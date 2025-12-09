import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/mappings/:datasetId
 * Get column mappings for a dataset
 */
router.get('/:datasetId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { datasetId } = req.params;
    
    const mappings = await prisma.columnMapping.findMany({
      where: { datasetId }
    });
    
    res.json({ mappings });
  } catch (error: any) {
    console.error('Error fetching mappings:', error);
    res.status(500).json({ error: 'Failed to fetch mappings' });
  }
});

/**
 * PUT /api/mappings/:datasetId
 * Update column mappings for a dataset
 */
router.put('/:datasetId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { datasetId } = req.params;
    const { mappings } = req.body; // Array of { excelColumnName, internalFieldName }
    
    if (!Array.isArray(mappings)) {
      return res.status(400).json({ error: 'Mappings must be an array' });
    }
    
    // Delete existing mappings
    await prisma.columnMapping.deleteMany({
      where: { datasetId }
    });
    
    // Create new mappings
    const createPromises = mappings.map(mapping => {
      return prisma.columnMapping.create({
        data: {
          datasetId,
          excelColumnName: mapping.excelColumnName,
          internalFieldName: mapping.internalFieldName,
          columnType: mapping.columnType || 'string',
          isActive: true
        }
      });
    });
    
    const newMappings = await Promise.all(createPromises);
    
    res.json({
      success: true,
      mappings: newMappings
    });
  } catch (error: any) {
    console.error('Error updating mappings:', error);
    res.status(500).json({ error: 'Failed to update mappings' });
  }
});

/**
 * GET /api/mappings/fields/available
 * Get list of available internal fields
 */
router.get('/fields/available', requireAuth, async (req: Request, res: Response) => {
  const availableFields = [
    { name: 'rankOrder', label: 'Classement', type: 'number' },
    { name: 'firstName', label: 'Prénom', type: 'string' },
    { name: 'lastName', label: 'Nom', type: 'string' },
    { name: 'rankCategory', label: 'Rang', type: 'string' },
    { name: 'nbDealsPersonal', label: 'Nombre d\'affaires (perso)', type: 'number' },
    { name: 'nbDealsGlobal', label: 'Nombre d\'affaires (global)', type: 'number' },
    { name: 'unitsBrutPersonal', label: 'Unités brutes (perso)', type: 'number' },
    { name: 'unitsBrutGlobal', label: 'Unités brutes (global)', type: 'number' },
    { name: 'unitsBrutParallel', label: 'Unités brutes (parallèles)', type: 'number' },
    { name: 'coachRank', label: 'Rang du coach', type: 'string' },
    { name: 'coachFirstName', label: 'Prénom du coach', type: 'string' },
    { name: 'coachLastName', label: 'Nom du coach', type: 'string' }
  ];
  
  res.json({ fields: availableFields });
});

export default router;

