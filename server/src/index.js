import './config/env.js'
import express from 'express'
import dns from 'dns'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import helmet from 'helmet'
import morgan from 'morgan'
import patientRouter from './routes/patient.routes.js'
import authRouter from './routes/auth.routes.js'
import providersRouter from './routes/providers.routes.js'
import audioRouter from './routes/audio.routes.js'
import { notFoundHandler } from './middlewares/notFound.js'
import { errorHandler } from './middlewares/error.js'
import sql from './config/db.js'

try { dns.setDefaultResultOrder && dns.setDefaultResultOrder('ipv4first') } catch {}

const app = express()

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false
}))
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(cookieParser())
app.use(express.json())
app.use(morgan('dev'))

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'find-patient-server' })
})

app.use('/api/patients', patientRouter)
app.use('/api/auth', authRouter)
app.use('/api/providers', providersRouter)
app.use('/api/audio', audioRouter)

app.use(notFoundHandler)
app.use(errorHandler)

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  const isSupabase = !!(process.env.PG_URL || process.env.DATABASE_URL || '').includes('supabase.co')
  sql`SELECT 1`.then(() => {
    console.log(`Database connected (${isSupabase ? 'supabase' : 'postgres'})`)
  }).catch(err => {
    console.error('Database connectivity FAILED', err?.message)
  })
})
