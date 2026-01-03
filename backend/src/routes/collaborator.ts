import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import prisma from '../utils/prisma';

const router = Router();

/**
 * GET /api/collaborators
 * Search and get collaborators with optional filters
 * Query params:
 *   - datasetId: required
 *   - rankCategory: optional filter by rank category
 *   - search: optional search term for first/last name
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { datasetId, rankCategory, search } = req.query;
    
    if (!datasetId) {
      return res.status(400).json({ error: 'datasetId is required' });
    }
    
    // Build where clause
    const where: any = {
      datasetId: datasetId as string,
    };
    
    // Add rank category filter if provided
    if (rankCategory) {
      where.rankCategory = rankCategory as string;
    }
    
    // Add search filter if provided
    if (search && typeof search === 'string') {
      const searchTerm = search.toLowerCase();
      where.OR = [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { fullName: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }
    
    // Fetch collaborators
    const collaborators = await prisma.dataRow.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        fullName: true,
        rankCategory: true,
        unitsBrutPersonal: true,
        unitsBrutGlobal: true,
        unitsBrutParallel: true,
        totalUnits: true,
        nbDealsPersonal: true,
        nbDealsGlobal: true,
      },
      orderBy: [
        { rankCategory: 'asc' },
        { lastName: 'asc' },
        { firstName: 'asc' },
      ],
    });
    
    res.json({
      success: true,
      collaborators,
      total: collaborators.length,
    });
    
  } catch (error: any) {
    console.error('Error fetching collaborators:', error);
    res.status(500).json({ error: 'Failed to fetch collaborators' });
  }
});

/**
 * GET /api/collaborators/ranks
 * Get all available rank categories from a dataset
 * Query params:
 *   - datasetId: required
 */
router.get('/ranks', requireAuth, async (req: Request, res: Response) => {
  try {
    const { datasetId } = req.query;
    
    if (!datasetId) {
      return res.status(400).json({ error: 'datasetId is required' });
    }
    
    // Get distinct rank categories
    const ranks = await prisma.dataRow.findMany({
      where: {
        datasetId: datasetId as string,
        rankCategory: { not: null },
      },
      select: {
        rankCategory: true,
      },
      distinct: ['rankCategory'],
      orderBy: {
        rankCategory: 'asc',
      },
    });
    
    const rankCategories = ranks
      .map(r => r.rankCategory)
      .filter((r): r is string => r !== null);
    
    res.json({
      success: true,
      ranks: rankCategories,
    });
    
  } catch (error: any) {
    console.error('Error fetching ranks:', error);
    res.status(500).json({ error: 'Failed to fetch ranks' });
  }
});

export default router;




