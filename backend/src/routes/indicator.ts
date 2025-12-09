import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * Initialize predefined indicators if they don't exist
 */
async function initializePredefinedIndicators() {
  const predefinedIndicators = [
    {
      name: 'Top collaborateurs – Unités perso (brut)',
      description: 'Classement des collaborateurs par unités brutes personnelles',
      type: 'predefined',
      groupBy: 'collaborator',
      metricField: 'unitsBrutPersonal',
      aggregation: 'sum',
      sortOrder: 'desc',
      filters: null
    },
    {
      name: 'Top collaborateurs – Unités globales (brut)',
      description: 'Classement des collaborateurs par unités brutes globales',
      type: 'predefined',
      groupBy: 'collaborator',
      metricField: 'unitsBrutGlobal',
      aggregation: 'sum',
      sortOrder: 'desc',
      filters: null
    },
    {
      name: 'Top collaborateurs – Unités totales (perso + global + parallèles)',
      description: 'Classement des collaborateurs par total des unités brutes',
      type: 'predefined',
      groupBy: 'collaborator',
      metricField: 'totalUnits',
      aggregation: 'sum',
      sortOrder: 'desc',
      filters: null
    },
    {
      name: 'Top coachs – Unités totales',
      description: 'Classement des coachs par unités totales de leurs collaborateurs',
      type: 'predefined',
      groupBy: 'coach',
      metricField: 'totalUnits',
      aggregation: 'sum',
      sortOrder: 'desc',
      filters: null
    },
    {
      name: 'Top catégories de rang – Unités totales',
      description: 'Classement des catégories de rang par unités totales',
      type: 'predefined',
      groupBy: 'rank_category',
      metricField: 'totalUnits',
      aggregation: 'sum',
      sortOrder: 'desc',
      filters: null
    }
  ];
  
  for (const indicator of predefinedIndicators) {
    const existing = await prisma.indicatorDefinition.findFirst({
      where: {
        name: indicator.name,
        type: 'predefined'
      }
    });
    
    if (!existing) {
      await prisma.indicatorDefinition.create({
        data: indicator as any
      });
    }
  }
}

// Initialize predefined indicators on module load
initializePredefinedIndicators().catch(console.error);

/**
 * GET /api/indicators
 * Get all indicators (predefined and custom)
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const indicators = await prisma.indicatorDefinition.findMany({
      where: { isActive: true },
      orderBy: [
        { type: 'asc' }, // predefined first
        { createdAt: 'desc' }
      ]
    });
    
    res.json({ indicators });
  } catch (error: any) {
    console.error('Error fetching indicators:', error);
    res.status(500).json({ error: 'Failed to fetch indicators' });
  }
});

/**
 * GET /api/indicators/:id
 * Get a specific indicator
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const indicator = await prisma.indicatorDefinition.findUnique({
      where: { id }
    });
    
    if (!indicator) {
      return res.status(404).json({ error: 'Indicator not found' });
    }
    
    res.json({ indicator });
  } catch (error: any) {
    console.error('Error fetching indicator:', error);
    res.status(500).json({ error: 'Failed to fetch indicator' });
  }
});

/**
 * POST /api/indicators
 * Create a new custom indicator
 */
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      groupBy,
      metricField,
      aggregation,
      filters,
      sortOrder,
      topN
    } = req.body;
    
    // Validation
    if (!name || !groupBy || !metricField) {
      return res.status(400).json({ error: 'Missing required fields: name, groupBy, metricField' });
    }
    
    const validGroupBy = ['collaborator', 'coach', 'rank_category'];
    if (!validGroupBy.includes(groupBy)) {
      return res.status(400).json({ error: `Invalid groupBy. Must be one of: ${validGroupBy.join(', ')}` });
    }
    
    const validAggregations = ['sum', 'avg', 'count', 'min', 'max'];
    if (aggregation && !validAggregations.includes(aggregation)) {
      return res.status(400).json({ error: `Invalid aggregation. Must be one of: ${validAggregations.join(', ')}` });
    }
    
    // Log the data being saved
    console.log('💾 Creating indicator with data:', {
      name,
      rankingMode: (req.body as any).rankingMode,
      selectedRanks: (req.body as any).selectedRanks,
      specialOperations: (req.body as any).specialOperations,
      includedCollaboratorIds: (req.body as any).includedCollaboratorIds,
    });
    
    // Create indicator
    const indicator = await prisma.indicatorDefinition.create({
      data: {
        name,
        description,
        type: 'custom',
        rankingMode: (req.body as any).rankingMode || 'standard',
        groupBy,
        metricField,
        aggregation: aggregation || 'sum',
        filters: filters || null,
        sortOrder: sortOrder || 'desc',
        topN: topN || null,
        selectedRanks: (req.body as any).selectedRanks || null,
        specialOperations: (req.body as any).specialOperations || null,
        includedCollaboratorIds: (req.body as any).includedCollaboratorIds || null,
        excludedCollaboratorIds: (req.body as any).excludedCollaboratorIds || null,
        isActive: true
      }
    });
    
    console.log('✅ Indicator created with ID:', indicator.id);
    
    res.json({
      success: true,
      indicator
    });
  } catch (error: any) {
    console.error('Error creating indicator:', error);
    res.status(500).json({ error: 'Failed to create indicator' });
  }
});

/**
 * PUT /api/indicators/:id
 * Update an existing indicator
 */
router.put('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      groupBy,
      metricField,
      aggregation,
      filters,
      sortOrder,
      topN
    } = req.body;
    
    // Check if indicator exists and is not predefined
    const existing = await prisma.indicatorDefinition.findUnique({
      where: { id }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Indicator not found' });
    }
    
    if (existing.type === 'predefined') {
      return res.status(403).json({ error: 'Cannot modify predefined indicators' });
    }
    
    // Update indicator
    const indicator = await prisma.indicatorDefinition.update({
      where: { id },
      data: {
        name: name || existing.name,
        description: description !== undefined ? description : existing.description,
        groupBy: groupBy || existing.groupBy,
        metricField: metricField || existing.metricField,
        aggregation: aggregation || existing.aggregation,
        filters: filters !== undefined ? filters : existing.filters,
        sortOrder: sortOrder || existing.sortOrder,
        topN: topN !== undefined ? topN : existing.topN
      }
    });
    
    res.json({
      success: true,
      indicator
    });
  } catch (error: any) {
    console.error('Error updating indicator:', error);
    res.status(500).json({ error: 'Failed to update indicator' });
  }
});

/**
 * DELETE /api/indicators/:id
 * Delete a custom indicator
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Check if indicator exists and is not predefined
    const existing = await prisma.indicatorDefinition.findUnique({
      where: { id }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Indicator not found' });
    }
    
    if (existing.type === 'predefined') {
      return res.status(403).json({ error: 'Cannot delete predefined indicators' });
    }
    
    // Delete indicator
    await prisma.indicatorDefinition.delete({
      where: { id }
    });
    
    res.json({
      success: true,
      message: 'Indicator deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting indicator:', error);
    res.status(500).json({ error: 'Failed to delete indicator' });
  }
});

/**
 * POST /api/indicators/:id/duplicate
 * Duplicate an indicator
 */
router.post('/:id/duplicate', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const original = await prisma.indicatorDefinition.findUnique({
      where: { id }
    });
    
    if (!original) {
      return res.status(404).json({ error: 'Indicator not found' });
    }
    
    // Create duplicate
    const duplicate = await prisma.indicatorDefinition.create({
      data: {
        name: `${original.name} (copie)`,
        description: original.description,
        type: 'custom', // Always create as custom
        groupBy: original.groupBy,
        metricField: original.metricField,
        aggregation: original.aggregation,
        filters: original.filters as any,
        sortOrder: original.sortOrder,
        topN: original.topN,
        isActive: true
      }
    });
    
    res.json({
      success: true,
      indicator: duplicate
    });
  } catch (error: any) {
    console.error('Error duplicating indicator:', error);
    res.status(500).json({ error: 'Failed to duplicate indicator' });
  }
});

export default router;

