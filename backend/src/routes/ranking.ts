import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const router = Router();
const prisma = new PrismaClient();

interface RankingRow {
  rank: number;
  name: string;
  rankCategory?: string;
  value: number;
  details?: any;
}

/**
 * Apply filters to data rows
 */
function applyFilters(rows: any[], filters: any): any[] {
  if (!filters || typeof filters !== 'object') {
    return rows;
  }
  
  return rows.filter(row => {
    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined) continue;
      
      // Handle different filter types
      if (typeof value === 'object' && value !== null) {
        // Range filter: { min: X, max: Y }
        if ('min' in value || 'max' in value) {
          const rowValue = row[key];
          if ('min' in value && rowValue < (value as any).min) return false;
          if ('max' in value && rowValue > (value as any).max) return false;
        }
        // Array filter: { in: [A, B, C] }
        else if ('in' in value && Array.isArray((value as any).in)) {
          if (!(value as any).in.includes(row[key])) return false;
        }
      } else {
        // Exact match filter
        if (row[key] !== value) return false;
      }
    }
    return true;
  });
}

/**
 * Group and aggregate data
 */
function groupAndAggregate(
  rows: any[],
  groupBy: string,
  metricField: string,
  aggregation: string
): Map<string, { value: number; count: number; details: any }> {
  const groups = new Map<string, { value: number; count: number; details: any }>();
  
  rows.forEach(row => {
    let groupKey: string;
    let groupDetails: any = {};
    
    // Determine group key based on groupBy parameter
    if (groupBy === 'collaborator') {
      groupKey = row.fullName || `${row.firstName || ''} ${row.lastName || ''}`.trim();
      groupDetails = {
        firstName: row.firstName,
        lastName: row.lastName,
        rankCategory: row.rankCategory,
        fullName: groupKey
      };
    } else if (groupBy === 'coach') {
      groupKey = row.coachFullName || '';
      if (!groupKey) return; // Skip rows without coach
      groupDetails = {
        coachFirstName: row.coachFirstName,
        coachLastName: row.coachLastName,
        coachFullName: groupKey
      };
    } else if (groupBy === 'rank_category') {
      groupKey = row.rankCategory || '';
      if (!groupKey) return; // Skip rows without rank category
      groupDetails = {
        rankCategory: groupKey
      };
    } else {
      groupKey = row[groupBy] || '';
      groupDetails = { [groupBy]: groupKey };
    }
    
    if (!groupKey) return;
    
    // Get metric value
    let metricValue = 0;
    if (metricField in row) {
      metricValue = Number(row[metricField]) || 0;
    }
    
    // Update group
    if (!groups.has(groupKey)) {
      groups.set(groupKey, { value: 0, count: 0, details: groupDetails });
    }
    
    const group = groups.get(groupKey)!;
    group.count++;
    
    // Apply aggregation
    switch (aggregation) {
      case 'sum':
        group.value += metricValue;
        break;
      case 'avg':
        group.value += metricValue;
        break;
      case 'count':
        group.value = group.count;
        break;
      case 'min':
        group.value = group.count === 1 ? metricValue : Math.min(group.value, metricValue);
        break;
      case 'max':
        group.value = Math.max(group.value, metricValue);
        break;
      default:
        group.value += metricValue;
    }
  });
  
  // Post-process averages
  if (aggregation === 'avg') {
    groups.forEach(group => {
      if (group.count > 0) {
        group.value = group.value / group.count;
      }
    });
  }
  
  return groups;
}

/**
 * Compute mixed ranks ranking (MODE A)
 * Supports multiple ranks with special operations per collaborator
 */
function computeMixedRanksRanking(
  rows: any[],
  selectedRanks: string[],
  specialOperations: Array<{ targetCollaboratorId: string; subtractCollaboratorIds: string[] }>,
  includedCollaboratorIds: string[] | null,
  excludedCollaboratorIds: string[] | null,
  metricField: string,
  sortOrder: string
): RankingRow[] {
  // Debug logs
  console.log('🔍 Mixed Ranks Ranking - Input params:');
  console.log('  - Total rows:', rows.length);
  console.log('  - Selected ranks:', selectedRanks);
  console.log('  - Included collaborators:', includedCollaboratorIds?.length || 0);
  console.log('  - Special operations:', specialOperations?.length || 0);
  console.log('  - Metric field:', metricField);
  
  // Filter by selected ranks
  let filteredRows = rows.filter(row => selectedRanks.includes(row.rankCategory));
  console.log('  - After rank filter:', filteredRows.length, 'rows');
  
  // Apply collaborator filtering
  if (includedCollaboratorIds && includedCollaboratorIds.length > 0) {
    filteredRows = filteredRows.filter(row => includedCollaboratorIds.includes(row.id));
    console.log('  - After included filter:', filteredRows.length, 'rows');
  } else if (excludedCollaboratorIds && excludedCollaboratorIds.length > 0) {
    filteredRows = filteredRows.filter(row => !excludedCollaboratorIds.includes(row.id));
    console.log('  - After excluded filter:', filteredRows.length, 'rows');
  }
  
  // Build a map of collaborator ID -> base metric value
  const collaboratorMetrics = new Map<string, {
    id: string;
    name: string;
    rankCategory: string;
    baseValue: number;
    finalValue: number;
    details: any;
  }>();
  
  filteredRows.forEach(row => {
    const collabId = row.id;
    const collabName = row.fullName || `${row.firstName || ''} ${row.lastName || ''}`.trim();
    const rankCategory = row.rankCategory || '';
    const metricValue = Number(row[metricField]) || 0;
    
    if (!collaboratorMetrics.has(collabId)) {
      collaboratorMetrics.set(collabId, {
        id: collabId,
        name: collabName,
        rankCategory: rankCategory,
        baseValue: metricValue,
        finalValue: metricValue, // Initially same as base
        details: {
          firstName: row.firstName,
          lastName: row.lastName,
          rankCategory: rankCategory,
          fullName: collabName
        }
      });
    }
  });
  
  // Apply special operations (per collaborator)
  if (specialOperations && specialOperations.length > 0) {
    specialOperations.forEach(operation => {
      const { targetCollaboratorId, subtractCollaboratorIds } = operation;
      
      // Find target collaborator
      const targetMetric = collaboratorMetrics.get(targetCollaboratorId);
      if (!targetMetric) return;
      
      // Calculate sum of values to subtract
      let subtractSum = 0;
      subtractCollaboratorIds.forEach(subtractId => {
        const subtractMetric = collaboratorMetrics.get(subtractId);
        if (subtractMetric) {
          subtractSum += subtractMetric.baseValue;
        }
      });
      
      // Apply subtraction to target
      targetMetric.finalValue = targetMetric.baseValue - subtractSum;
    });
  }
  
  // Create ranking data using final values
  const rankingData: RankingRow[] = Array.from(collaboratorMetrics.values()).map(metric => ({
    rank: 0,
    name: metric.name,
    rankCategory: metric.rankCategory,
    value: metric.finalValue,
    details: metric.details
  }));
  
  // Sort
  if (sortOrder === 'desc') {
    rankingData.sort((a, b) => b.value - a.value);
  } else {
    rankingData.sort((a, b) => a.value - b.value);
  }
  
  // Assign ranks
  rankingData.forEach((row, index) => {
    row.rank = index + 1;
  });
  
  console.log('✅ Mixed Ranks Ranking - Output:');
  console.log('  - Total ranking rows:', rankingData.length);
  console.log('  - First 3 rows:', rankingData.slice(0, 3).map(r => ({ name: r.name, rank: r.rankCategory, value: r.value })));
  
  return rankingData;
}

/**
 * Compute single rank ranking with manual collaborator selection (MODE B)
 */
function computeSingleRankRanking(
  rows: any[],
  rankCategory: string,
  includedCollaboratorIds: string[],
  metricField: string,
  sortOrder: string
): RankingRow[] {
  // Filter by rank category and included collaborators
  const filteredRows = rows.filter(
    row => row.rankCategory === rankCategory && includedCollaboratorIds.includes(row.id)
  );
  
  // Calculate metric for each collaborator
  const collaboratorMetrics = new Map<string, {
    name: string;
    rankCategory: string;
    value: number;
    details: any;
  }>();
  
  filteredRows.forEach(row => {
    const collabId = row.id;
    const collabName = row.fullName || `${row.firstName || ''} ${row.lastName || ''}`.trim();
    const metricValue = Number(row[metricField]) || 0;
    
    if (!collaboratorMetrics.has(collabId)) {
      collaboratorMetrics.set(collabId, {
        name: collabName,
        rankCategory: row.rankCategory,
        value: metricValue,
        details: {
          firstName: row.firstName,
          lastName: row.lastName,
          rankCategory: row.rankCategory,
          fullName: collabName
        }
      });
    }
  });
  
  // Convert to ranking data
  const rankingData: RankingRow[] = Array.from(collaboratorMetrics.values()).map(metric => ({
    rank: 0,
    name: metric.name,
    rankCategory: metric.rankCategory,
    value: metric.value,
    details: metric.details
  }));
  
  // Sort
  if (sortOrder === 'desc') {
    rankingData.sort((a, b) => b.value - a.value);
  } else {
    rankingData.sort((a, b) => a.value - b.value);
  }
  
  // Assign ranks
  rankingData.forEach((row, index) => {
    row.rank = index + 1;
  });
  
  return rankingData;
}

/**
 * Validate indicator configuration for a specific ranking mode
 */
function validateIndicatorConfig(indicator: any, rows: any[]): { valid: boolean; error?: string; hint?: string } {
  const rankingMode = indicator.rankingMode || 'standard';
  
  // Basic validation for all modes
  if (!indicator.groupBy || !indicator.metricField) {
    return { 
      valid: false, 
      error: 'Configuration incomplète : groupBy et metricField sont requis',
      hint: 'Cet indicateur semble corrompu. Veuillez le dupliquer pour le recréer.'
    };
  }
  
  // Mode-specific validation
  if (rankingMode === 'mixedRanks' || rankingMode === 'singleRankSelection') {
    // Parse and validate selectedRanks
    let selectedRanks = indicator.selectedRanks;
    if (typeof selectedRanks === 'string') {
      try {
        selectedRanks = JSON.parse(selectedRanks);
      } catch (e) {
        return { 
          valid: false, 
          error: 'Configuration invalide : selectedRanks mal formé',
          hint: 'Dupliquez cet indicateur pour le reconfigurer.'
        };
      }
    }
    
    if (!Array.isArray(selectedRanks) || selectedRanks.length === 0) {
      return { 
        valid: false, 
        error: `Configuration incomplète : aucun rang sélectionné pour le mode ${rankingMode}`,
        hint: 'Dupliquez cet indicateur pour le reconfigurer.'
      };
    }
    
    // Check if selected ranks exist in the current dataset
    const availableRanks = new Set(rows.map(row => row.rankCategory).filter(Boolean));
    const missingRanks = selectedRanks.filter((rank: string) => !availableRanks.has(rank));
    
    if (missingRanks.length > 0) {
      return {
        valid: false,
        error: `Rangs incompatibles avec ce fichier : ${missingRanks.join(', ')}`,
        hint: `Ce fichier ne contient pas les rangs requis (${missingRanks.join(', ')}). Rangs disponibles : ${Array.from(availableRanks).join(', ')}`
      };
    }
    
    // Validate includedCollaboratorIds
    let includedCollaboratorIds = indicator.includedCollaboratorIds;
    if (typeof includedCollaboratorIds === 'string') {
      try {
        includedCollaboratorIds = JSON.parse(includedCollaboratorIds);
      } catch (e) {
        return { 
          valid: false, 
          error: 'Configuration invalide : includedCollaboratorIds mal formé',
          hint: 'Dupliquez cet indicateur pour le reconfigurer.'
        };
      }
    }
    
    if (!Array.isArray(includedCollaboratorIds) || includedCollaboratorIds.length === 0) {
      return { 
        valid: false, 
        error: `Configuration incomplète : aucun collaborateur sélectionné pour le mode ${rankingMode}`,
        hint: 'Dupliquez cet indicateur pour le reconfigurer.'
      };
    }
    
    // NOTE: Skip collaborator ID validation for mixedRanks/singleRankSelection modes
    // IDs change with each file upload, so we'll filter by selected ranks at execution time
    // The includedCollaboratorIds are only used if they match the current dataset IDs
    console.log(`ℹ️ Indicator has ${includedCollaboratorIds.length} included collaborators (IDs from original file)`);
    console.log(`ℹ️ Current dataset has ${rows.length} total rows`);
    console.log(`ℹ️ Will filter by selected ranks: ${selectedRanks.join(', ')}`)
  }
  
  return { valid: true };
}

/**
 * POST /api/rankings/compute
 * Compute a ranking based on an indicator and dataset
 */
router.post('/compute', requireAuth, async (req: Request, res: Response) => {
  try {
    const { indicatorId, datasetId } = req.body;
    
    if (!indicatorId || !datasetId) {
      return res.status(400).json({ error: 'Missing indicatorId or datasetId' });
    }
    
    // Fetch indicator
    const indicator = await prisma.indicatorDefinition.findUnique({
      where: { id: indicatorId }
    });
    
    if (!indicator) {
      return res.status(404).json({ error: 'Indicator not found' });
    }
    
    // Fetch dataset rows first (needed for validation)
    const rows = await prisma.dataRow.findMany({
      where: { datasetId }
    });
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Aucune donnée trouvée pour ce fichier' });
    }
    
    // Validate indicator configuration against the current dataset
    const validation = validateIndicatorConfig(indicator, rows);
    if (!validation.valid) {
      console.error('❌ Indicator validation failed:', validation.error);
      return res.status(400).json({ 
        error: validation.error,
        hint: validation.hint || 'Cet indicateur nécessite une configuration complète. Veuillez le recréer ou le dupliquer pour le mettre à jour.'
      });
    }
    
    let rankingData: RankingRow[];
    
    // Determine which ranking mode to use
    const rankingMode = indicator.rankingMode || 'standard';
    
    if (rankingMode === 'mixedRanks') {
      // MODE A: Mixed ranks with special operations per collaborator
      console.log('📊 MODE A - Mixed Ranks - Raw indicator data:');
      console.log('  - selectedRanks type:', typeof indicator.selectedRanks, 'value:', indicator.selectedRanks);
      console.log('  - specialOperations type:', typeof indicator.specialOperations, 'value:', indicator.specialOperations);
      console.log('  - includedCollaboratorIds type:', typeof indicator.includedCollaboratorIds, 'value:', indicator.includedCollaboratorIds);
      
      // Parse JSON data if necessary
      let selectedRanks = indicator.selectedRanks;
      if (typeof selectedRanks === 'string') {
        selectedRanks = JSON.parse(selectedRanks);
      }
      selectedRanks = (selectedRanks as any) || [];
      
      let specialOperations = indicator.specialOperations;
      if (typeof specialOperations === 'string') {
        specialOperations = JSON.parse(specialOperations);
      }
      specialOperations = (specialOperations as any) || [];
      
      let includedCollaboratorIds = indicator.includedCollaboratorIds;
      if (typeof includedCollaboratorIds === 'string') {
        includedCollaboratorIds = JSON.parse(includedCollaboratorIds);
      }
      includedCollaboratorIds = (includedCollaboratorIds as any) || null;
      
      let excludedCollaboratorIds = indicator.excludedCollaboratorIds;
      if (typeof excludedCollaboratorIds === 'string') {
        excludedCollaboratorIds = JSON.parse(excludedCollaboratorIds);
      }
      excludedCollaboratorIds = (excludedCollaboratorIds as any) || null;
      
      console.log('📊 MODE A - Parsed indicator config:');
      console.log('  - Indicator name:', indicator.name);
      console.log('  - Selected ranks:', selectedRanks, 'length:', Array.isArray(selectedRanks) ? selectedRanks.length : 'not array');
      console.log('  - Special operations:', JSON.stringify(specialOperations, null, 2));
      console.log('  - Included collaborator IDs (original file):', includedCollaboratorIds, 'length:', Array.isArray(includedCollaboratorIds) ? includedCollaboratorIds.length : 'not array');
      console.log('  - Metric field:', indicator.metricField);
      
      // Ensure correct types for function call
      const selectedRanksArray: string[] = Array.isArray(selectedRanks) ? selectedRanks as string[] : [];
      const specialOperationsArray: Array<{ targetCollaboratorId: string; subtractCollaboratorIds: string[] }> = 
        Array.isArray(specialOperations) ? specialOperations as any : [];
      
      // IMPORTANT: For mixedRanks mode with reused indicators across different file uploads,
      // we ignore the original includedCollaboratorIds (they're from a different upload)
      // Instead, we include ALL collaborators from the selected ranks in the current dataset
      console.log('ℹ️ Using ALL collaborators from selected ranks (ignoring original IDs as they are from a different file upload)');
      const includedCollaboratorIdsArray: string[] | null = null; // Use null to include all from selected ranks
      const excludedCollaboratorIdsArray: string[] | null = null;
      
      rankingData = computeMixedRanksRanking(
        rows,
        selectedRanksArray,
        specialOperationsArray,
        includedCollaboratorIdsArray,
        excludedCollaboratorIdsArray,
        indicator.metricField,
        indicator.sortOrder
      );
      
    } else if (rankingMode === 'singleRankSelection') {
      // MODE B: Single rank with manual collaborator selection
      const selectedRanks = (indicator.selectedRanks as any) || [];
      const rankCategory = selectedRanks[0]; // Single rank
      const includedCollaboratorIds = (indicator.includedCollaboratorIds as any) || [];
      
      rankingData = computeSingleRankRanking(
        rows,
        rankCategory,
        includedCollaboratorIds,
        indicator.metricField,
        indicator.sortOrder
      );
      
    } else {
      // Standard mode
      // Apply filters
      const filteredRows = applyFilters(rows, indicator.filters);
      
      // Group and aggregate
      const groups = groupAndAggregate(
        filteredRows,
        indicator.groupBy,
        indicator.metricField,
        indicator.aggregation
      );
      
      // Convert to array and sort
      rankingData = Array.from(groups.entries()).map(([name, data]) => ({
        rank: 0, // Will be assigned after sorting
        name,
        rankCategory: data.details.rankCategory,
        value: data.value,
        details: data.details
      }));
      
      // Sort
      if (indicator.sortOrder === 'desc') {
        rankingData.sort((a, b) => b.value - a.value);
      } else {
        rankingData.sort((a, b) => a.value - b.value);
      }
      
      // Apply topN limit if specified
      if (indicator.topN && indicator.topN > 0) {
        rankingData = rankingData.slice(0, indicator.topN);
      }
      
      // Assign ranks
      rankingData.forEach((row, index) => {
        row.rank = index + 1;
      });
    }
    
    // Save ranking result (optional, for caching)
    await prisma.rankingResult.create({
      data: {
        indicatorId,
        datasetId,
        results: rankingData as any,
        rowCount: rankingData.length
      }
    });
    
    res.json({
      success: true,
      ranking: {
        indicatorName: indicator.name,
        description: indicator.description,
        groupBy: indicator.groupBy,
        metricField: indicator.metricField,
        aggregation: indicator.aggregation,
        totalRows: rankingData.length,
        data: rankingData
      }
    });
    
  } catch (error: any) {
    console.error('Error computing ranking:', error);
    res.status(500).json({ error: 'Failed to compute ranking' });
  }
});

/**
 * GET /api/rankings/latest/:indicatorId
 * Get the latest ranking result for an indicator
 */
router.get('/latest/:indicatorId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { indicatorId } = req.params;
    
    const latestResult = await prisma.rankingResult.findFirst({
      where: { indicatorId },
      orderBy: { computedAt: 'desc' }
    });
    
    if (!latestResult) {
      return res.status(404).json({ error: 'No ranking result found' });
    }
    
    const indicator = await prisma.indicatorDefinition.findUnique({
      where: { id: indicatorId }
    });
    
    res.json({
      ranking: {
        id: latestResult.id,
        indicatorName: indicator?.name,
        computedAt: latestResult.computedAt,
        data: latestResult.results
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching ranking:', error);
    res.status(500).json({ error: 'Failed to fetch ranking' });
  }
});

/**
 * POST /api/rankings/:id/export-pdf
 * Export a ranking as PDF
 */
router.post('/:id/export-pdf', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, companyName } = req.body;
    
    // Fetch ranking result
    const rankingResult = await prisma.rankingResult.findUnique({
      where: { id }
    });
    
    if (!rankingResult) {
      return res.status(404).json({ error: 'Ranking not found' });
    }
    
    const indicator = await prisma.indicatorDefinition.findUnique({
      where: { id: rankingResult.indicatorId }
    });
    
    const dataset = await prisma.dataset.findUnique({
      where: { id: rankingResult.datasetId }
    });
    
    // Create PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ranking-${id}.pdf"`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Add header
    doc.fontSize(20).text(title || indicator?.name || 'Ranking', { align: 'center' });
    doc.moveDown();
    
    if (companyName) {
      doc.fontSize(14).text(companyName, { align: 'center' });
      doc.moveDown();
    }
    
    // Add metadata
    doc.fontSize(10)
      .text(`Date: ${new Date(rankingResult.computedAt).toLocaleDateString('fr-FR')}`, { align: 'right' })
      .text(`Fichier source: ${dataset?.originalName || 'N/A'}`, { align: 'right' })
      .text(`Nombre de lignes: ${rankingResult.rowCount}`, { align: 'right' });
    
    doc.moveDown(2);
    
    // Add description
    if (indicator?.description) {
      doc.fontSize(10).text(indicator.description, { align: 'left' });
      doc.moveDown();
    }
    
    // Add table header
    const startY = doc.y;
    const tableTop = startY + 10;
    
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Rang', 50, tableTop, { width: 50 });
    doc.text('Nom', 110, tableTop, { width: 200 });
    
    if (indicator?.groupBy === 'collaborator') {
      doc.text('Catégorie', 320, tableTop, { width: 80 });
      doc.text('Unités', 410, tableTop, { width: 100, align: 'right' });
    } else {
      doc.text('Unités', 410, tableTop, { width: 100, align: 'right' });
    }
    
    doc.moveDown();
    
    // Add table rows
    doc.font('Helvetica');
    const rankingData = rankingResult.results as any[];
    
    let currentY = doc.y;
    rankingData.forEach((row, index) => {
      // Check if we need a new page
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
        
        // Repeat header
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Rang', 50, currentY, { width: 50 });
        doc.text('Nom', 110, currentY, { width: 200 });
        if (indicator?.groupBy === 'collaborator') {
          doc.text('Catégorie', 320, currentY, { width: 80 });
          doc.text('Unités', 410, currentY, { width: 100, align: 'right' });
        } else {
          doc.text('Unités', 410, currentY, { width: 100, align: 'right' });
        }
        doc.moveDown();
        currentY = doc.y;
        doc.font('Helvetica');
      }
      
      doc.fontSize(9);
      doc.text(row.rank.toString(), 50, currentY, { width: 50 });
      doc.text(row.name || 'N/A', 110, currentY, { width: 200 });
      
      if (indicator?.groupBy === 'collaborator' && row.rankCategory) {
        doc.text(row.rankCategory, 320, currentY, { width: 80 });
      }
      
      doc.text(row.value.toFixed(2), 410, currentY, { width: 100, align: 'right' });
      
      currentY += 20;
      doc.y = currentY;
    });
    
    // Finalize PDF
    doc.end();
    
  } catch (error: any) {
    console.error('Error exporting PDF:', error);
    
    // If headers not sent yet, send error JSON
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to export PDF' });
    }
  }
});

/**
 * POST /api/rankings/export-pdf-direct
 * Export ranking data directly as PDF (without saving result first)
 */
router.post('/export-pdf-direct', requireAuth, async (req: Request, res: Response) => {
  try {
    const { rankingData, indicatorName, description, companyName, datasetName } = req.body;
    
    if (!rankingData || !Array.isArray(rankingData)) {
      return res.status(400).json({ error: 'Invalid ranking data' });
    }
    
    // Create PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    // Set response headers
    const filename = `ranking-${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Add header
    doc.fontSize(20).text(indicatorName || 'Ranking', { align: 'center' });
    doc.moveDown();
    
    if (companyName) {
      doc.fontSize(14).text(companyName, { align: 'center' });
      doc.moveDown();
    }
    
    // Add metadata
    doc.fontSize(10)
      .text(`Date: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' })
      .text(`Fichier source: ${datasetName || 'N/A'}`, { align: 'right' })
      .text(`Nombre de lignes: ${rankingData.length}`, { align: 'right' });
    
    doc.moveDown(2);
    
    // Add description
    if (description) {
      doc.fontSize(10).text(description, { align: 'left' });
      doc.moveDown();
    }
    
    // Add table header
    const startY = doc.y;
    const tableTop = startY + 10;
    
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Rang', 50, tableTop, { width: 50 });
    doc.text('Nom', 110, tableTop, { width: 200 });
    doc.text('Catégorie', 320, tableTop, { width: 80 });
    doc.text('Unités', 410, tableTop, { width: 100, align: 'right' });
    
    doc.moveDown();
    
    // Add table rows
    doc.font('Helvetica');
    let currentY = doc.y;
    
    rankingData.forEach((row) => {
      // Check if we need a new page
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
        
        // Repeat header
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text('Rang', 50, currentY, { width: 50 });
        doc.text('Nom', 110, currentY, { width: 200 });
        doc.text('Catégorie', 320, currentY, { width: 80 });
        doc.text('Unités', 410, currentY, { width: 100, align: 'right' });
        doc.moveDown();
        currentY = doc.y;
        doc.font('Helvetica');
      }
      
      doc.fontSize(9);
      doc.text(row.rank?.toString() || '-', 50, currentY, { width: 50 });
      doc.text(row.name || 'N/A', 110, currentY, { width: 200 });
      doc.text(row.rankCategory || '-', 320, currentY, { width: 80 });
      doc.text(row.value?.toFixed(2) || '0.00', 410, currentY, { width: 100, align: 'right' });
      
      currentY += 20;
      doc.y = currentY;
    });
    
    // Finalize PDF
    doc.end();
    
  } catch (error: any) {
    console.error('Error exporting PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to export PDF' });
    }
  }
});

export default router;

