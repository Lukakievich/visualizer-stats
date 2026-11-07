import 'dotenv/config'
import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import dashboardsRouter from './routes/dashboards.js'
import metricsRouter from './routes/metrics.js'
import dataPointsRouter from './routes/dataPoints.js'

interface HttpError extends Error {
  status?: number
  statusCode?: number
}

const app: Express = express()
const PORT = Number(process.env.PORT) || 3001

// Middleware
app.use(cors()) // TODO: ограничить: cors({ origin: 'https://фронтенд' })
app.use(express.json())

// Логирование запросов
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`)
  next()
})

// Routes
app.use('/api/dashboards', dashboardsRouter)
app.use('/api/metrics', metricsRouter)
app.use('/api/data-points', dataPointsRouter)

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() })
})

// 404 обработчик
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler
app.use(
  (error: HttpError, _req: Request, res: Response, _next: NextFunction) => {
    const status = error.status ?? error.statusCode ?? 500

    if (status >= 500) {
      console.error(error)
    }

    res.status(status).json({
      error: status >= 500 ? 'Internal server error' : error.message,
    })
  },
)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`API available at http://localhost:${PORT}/api`)
})
