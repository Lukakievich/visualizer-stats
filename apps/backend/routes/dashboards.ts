import { Router, type Request, type Response, type NextFunction } from 'express';
import * as dashboardService from '../services/dashboardService.js';

interface CreateDashboardBody {
  name: string;
  description?: string;
}

interface DashboardParams {
  id: string;
}

const router = Router();

// GET /api/dashboards
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dashboards = await dashboardService.getAllDashboards();
    res.json(dashboards);
  } catch (error) {
    next(error);
  }
});

// GET /api/dashboards/:id
router.get('/:id', async (
  req: Request<DashboardParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const dashboard = await dashboardService.getDashboardById(id);
    
    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }
    
    res.json(dashboard);
  } catch (error) {
    next(error);
  }
});

// POST /api/dashboards
router.post('/', async (
  req: Request<{}, {}, CreateDashboardBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const dashboard = await dashboardService.createDashboard(name, description);
    res.status(201).json(dashboard);
  } catch (error) {
    next(error);
  }
});

// PUT /api/dashboards/:id
router.put('/:id', async (
  req: Request<DashboardParams, {}, CreateDashboardBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const { name, description } = req.body;
    
    const dashboard = await dashboardService.updateDashboard(id, name, description);
    
    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }
    
    res.json(dashboard);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/dashboards/:id
router.delete('/:id', async (
  req: Request<DashboardParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const dashboard = await dashboardService.deleteDashboard(id);
    
    if (!dashboard) {
      return res.status(404).json({ error: 'Dashboard not found' });
    }
    
    res.json({ message: 'Dashboard deleted', dashboard });
  } catch (error) {
    next(error);
  }
});

export default router;