import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import { globalRateLimit } from './middleware/rateLimit'
import productRoutes from './routes/products'
import aiRoutes from './routes/ai'
import billRoutes from './routes/bills'
import statsRoutes from './routes/stats'

const app = express()
const PORT = process.env.PORT || 8080

// Validate required env vars
const requiredEnvVars = ['DATABASE_URL', 'GROQ_API_KEY']
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Missing required env var: ${envVar}`)
    console.error('Set it in Railway → Service → Variables')
    process.exit(1)
  }
}

app.set('trust proxy', 1)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

// CORS
const frontendUrl = process.env.FRONTEND_URL
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (frontendUrl ? [frontendUrl] : [])
  : ['http://localhost:3000', 'http://127.0.0.1:3000']

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS blocked: ${origin}`))
    }
  },
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

// Body parsing — 20mb for base64 images
app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ extended: true, limit: '20mb' }))
app.use(globalRateLimit)

// Health check — Railway uses this
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    groq: !!process.env.GROQ_API_KEY,
    db: !!process.env.DATABASE_URL,
  })
})

app.use('/api/products', productRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/bills', billRoutes)
app.use('/api/stats', statsRoutes)

app.use((_req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message)
  res.status(500).json({ message: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`✅ Kirana POS v2 backend — port ${PORT}`)
  console.log(`🤖 Groq AI: ${process.env.GROQ_API_KEY ? 'Ready' : 'NOT SET'}`)
  console.log(`🗄️  Database: ${process.env.DATABASE_URL ? 'Connected' : 'NOT SET'}`)
})

export default app
