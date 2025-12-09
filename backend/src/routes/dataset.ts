import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import { parseExcelFile, parseCSVFile } from '../utils/excelParser';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel (.xlsx, .xls) and CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max
  }
});

/**
 * POST /api/datasets/upload
 * Upload and parse an Excel/CSV file
 */
router.post('/upload', requireAuth, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    // Parse the file
    let parsedData;
    if (fileExtension === '.csv') {
      parsedData = parseCSVFile(filePath);
    } else {
      parsedData = parseExcelFile(filePath, 'Ranklist');
    }
    
    // Create dataset in database
    const dataset = await prisma.dataset.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        sheetName: parsedData.sheetName,
        rowCount: parsedData.normalizedRows.length
      }
    });
    
    // Save column mappings
    const mappingPromises = Array.from(parsedData.columnMapping.entries()).map(([excelCol, internalField]) => {
      return prisma.columnMapping.create({
        data: {
          datasetId: dataset.id,
          excelColumnName: excelCol,
          internalFieldName: internalField,
          columnType: 'string', // Could be improved with type detection
          isActive: true
        }
      });
    });
    await Promise.all(mappingPromises);
    
    // Save normalized rows
    const rowPromises = parsedData.normalizedRows.map(row => {
      return prisma.dataRow.create({
        data: {
          datasetId: dataset.id,
          rankOrder: row.rankOrder,
          firstName: row.firstName,
          lastName: row.lastName,
          rankCategory: row.rankCategory,
          nbDealsPersonal: row.nbDealsPersonal,
          nbDealsGlobal: row.nbDealsGlobal,
          unitsBrutPersonal: row.unitsBrutPersonal,
          unitsBrutGlobal: row.unitsBrutGlobal,
          unitsBrutParallel: row.unitsBrutParallel,
          coachRank: row.coachRank,
          coachFirstName: row.coachFirstName,
          coachLastName: row.coachLastName,
          fullName: row.fullName,
          coachFullName: row.coachFullName,
          totalUnits: row.totalUnits
        }
      });
    });
    await Promise.all(rowPromises);
    
    // Return preview data (first 20 rows)
    const previewRows = parsedData.normalizedRows.slice(0, 20);
    
    // Calculate basic stats
    const stats = {
      totalRows: parsedData.normalizedRows.length,
      totalUnitsBrutPersonal: parsedData.normalizedRows.reduce((sum, r) => sum + r.unitsBrutPersonal, 0),
      totalUnitsBrutGlobal: parsedData.normalizedRows.reduce((sum, r) => sum + r.unitsBrutGlobal, 0),
      totalUnitsBrutParallel: parsedData.normalizedRows.reduce((sum, r) => sum + r.unitsBrutParallel, 0),
      totalUnits: parsedData.normalizedRows.reduce((sum, r) => sum + r.totalUnits, 0),
      uniqueRankCategories: [...new Set(parsedData.normalizedRows.map(r => r.rankCategory))].length,
      uniqueCoaches: [...new Set(parsedData.normalizedRows.map(r => r.coachFullName).filter(Boolean))].length
    };
    
    res.json({
      success: true,
      dataset: {
        id: dataset.id,
        filename: dataset.originalName,
        uploadDate: dataset.uploadDate,
        sheetName: dataset.sheetName,
        rowCount: dataset.rowCount
      },
      preview: previewRows,
      stats,
      headers: parsedData.headers,
      columnMapping: Object.fromEntries(parsedData.columnMapping)
    });
    
  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload and parse file' });
  }
});

/**
 * GET /api/datasets
 * Get all datasets
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const datasets = await prisma.dataset.findMany({
      orderBy: { uploadDate: 'desc' },
      include: {
        _count: {
          select: { rows: true }
        }
      }
    });
    
    res.json({ datasets });
  } catch (error: any) {
    console.error('Error fetching datasets:', error);
    res.status(500).json({ error: 'Failed to fetch datasets' });
  }
});

/**
 * GET /api/datasets/:id
 * Get a specific dataset with its data
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const dataset = await prisma.dataset.findUnique({
      where: { id },
      include: {
        rows: {
          take: 100, // Limit to first 100 rows for performance
          orderBy: { rankOrder: 'asc' }
        },
        mappings: true
      }
    });
    
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset not found' });
    }
    
    res.json({ dataset });
  } catch (error: any) {
    console.error('Error fetching dataset:', error);
    res.status(500).json({ error: 'Failed to fetch dataset' });
  }
});

/**
 * GET /api/datasets/:id/stats
 * Get statistics for a dataset
 */
router.get('/:id/stats', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const rows = await prisma.dataRow.findMany({
      where: { datasetId: id }
    });
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Dataset not found or has no data' });
    }
    
    const stats = {
      totalRows: rows.length,
      totalUnitsBrutPersonal: rows.reduce((sum, r) => sum + r.unitsBrutPersonal, 0),
      totalUnitsBrutGlobal: rows.reduce((sum, r) => sum + r.unitsBrutGlobal, 0),
      totalUnitsBrutParallel: rows.reduce((sum, r) => sum + r.unitsBrutParallel, 0),
      totalUnits: rows.reduce((sum, r) => sum + r.totalUnits, 0),
      avgUnitsPerCollaborator: rows.reduce((sum, r) => sum + r.totalUnits, 0) / rows.length,
      uniqueRankCategories: [...new Set(rows.map(r => r.rankCategory))].filter(Boolean).length,
      uniqueCoaches: [...new Set(rows.map(r => r.coachFullName).filter(Boolean))].length,
      rankCategoryBreakdown: {} as any,
      topCoaches: [] as any[]
    };
    
    // Breakdown by rank category
    const categoryMap = new Map<string, number>();
    rows.forEach(row => {
      if (row.rankCategory) {
        categoryMap.set(row.rankCategory, (categoryMap.get(row.rankCategory) || 0) + row.totalUnits);
      }
    });
    stats.rankCategoryBreakdown = Object.fromEntries(categoryMap);
    
    // Top coaches by total units
    const coachMap = new Map<string, number>();
    rows.forEach(row => {
      if (row.coachFullName) {
        coachMap.set(row.coachFullName, (coachMap.get(row.coachFullName) || 0) + row.totalUnits);
      }
    });
    stats.topCoaches = Array.from(coachMap.entries())
      .map(([name, units]) => ({ name, totalUnits: units }))
      .sort((a, b) => b.totalUnits - a.totalUnits)
      .slice(0, 10);
    
    res.json({ stats });
  } catch (error: any) {
    console.error('Error calculating stats:', error);
    res.status(500).json({ error: 'Failed to calculate statistics' });
  }
});

/**
 * DELETE /api/datasets/:id
 * Delete a dataset and all its data
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Delete dataset (cascade will delete rows and mappings)
    await prisma.dataset.delete({
      where: { id }
    });
    
    res.json({ success: true, message: 'Dataset deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting dataset:', error);
    res.status(500).json({ error: 'Failed to delete dataset' });
  }
});

export default router;

