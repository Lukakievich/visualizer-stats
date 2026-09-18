import { Router, type Request, type Response, type NextFunction } from 'express';
import * as metricService from '../services/metricService.js';

interface CreateMetricBody {
  dashboardId: number;
  name: string;
  type?: 'line' | 'bar' | 'area';
  unit: string;
  color: string;
}

interface MetricParams {
  id: string;
}

interface MetricQuery {
  dashboardId: string;
}

const router: Router = Router();

// GET /api/metrics?dashboardId=1
router.get('/', async (
  req: Request<{}, {}, {}, MetricQuery>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { dashboardId } = req.query;
    
    if (!dashboardId) {
      return res.status(400).json({ error: 'dashboardId is required' });
    }
    
    const metrics = await metricService.getMetricsByDashboard(parseInt(dashboardId));
    res.json(metrics);
  } catch (error) {
    next(error);
  }
});

// GET /api/metrics/:id
router.get('/:id', async (
  req: Request<MetricParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const metric = await metricService.getMetricById(id);
    
    if (!metric) {
      return res.status(404).json({ error: 'Metric not found' });
    }
    
    res.json(metric);
  } catch (error) {
    next(error);
  }
});

// POST /api/metrics
router.post('/', async (
  req: Request<{}, {}, CreateMetricBody>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { dashboardId, name, type, unit, color } = req.body;
    
    if (!dashboardId || !name) {
      return res.status(400).json({ error: 'dashboardId and name are required' });
    }
    
    const metric = await metricService.createMetric(
      dashboardId,
      name,
      type || 'line',
      unit,
      color
    );
    res.status(201).json(metric);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/metrics/:id
router.delete('/:id', async (
  req: Request<MetricParams>,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = parseInt(req.params.id);
    const metric = await metricService.deleteMetric(id);
    
    if (!metric) {
      return res.status(404).json({ error: 'Metric not found' });
    }
    
    res.json({ message: 'Metric deleted', metric });
  } catch (error) {
    next(error);
  }
});

export default router;