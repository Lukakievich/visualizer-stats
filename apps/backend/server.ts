import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import dashboardsRouter from './routes/dashboards.js'
import metricsRouter from './routes/metrics.js'
import dataPointsRouter from './routes/dataPoints.js'

dotenv.config()

const app: Express = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Логирование запросов
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`)
  next()
})

// Routes
app.use('/api/dashboards', dashboardsRouter)
app.use('/api/metrics', metricsRouter)
app.use('/api/data-points', dataPointsRouter)

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() })
})

// 404 обработчик
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', error.message)
  res.status(500).json({
    error: error.message || 'Internal server error',
  })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`API available at http://localhost:${PORT}/api`)
})
