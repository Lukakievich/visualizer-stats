import { Router, type Request, type Response, type NextFunction } from 'express'
import * as dataPointService from '../services/dataPointService.js'

interface AddDataPointBody {
  metric_id: number
  value: number
}

interface AddDataPointsBody {
  dataPoints: Array<{
    metric_id: number
    value: number
  }>
}

interface DataPointQuery {
  metricId: string
  limit?: string
}

const router = Router()

// GET /api/data-points?metricId=1&limit=100
router.get(
  '/',
  async (
    req: Request<{}, {}, {}, DataPointQuery>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { metricId, limit = '100' } = req.query

      if (!metricId) {
        return res.status(400).json({ error: 'metricId is required' })
      }

      const dataPoints = await dataPointService.getDataPointsByMetric(
        parseInt(metricId),
        parseInt(limit),
      )
      res.json(dataPoints)
    } catch (error) {
      next(error)
    }
  },
)

// POST /api/data-points
router.post(
  '/',
  async (
    req: Request<{}, {}, AddDataPointsBody>,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const { dataPoints } = req.body

      if (!Array.isArray(dataPoints) || dataPoints.length === 0) {
        return res.status(400).json({ error: 'dataPoints array is required' })
      }

      const result = await dataPointService.addDataPoints(dataPoints)
      res.status(201).json(result)
    } catch (error) {
      next(error)
    }
  },
)

export default router
