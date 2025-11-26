import './config/env.js'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import patientRouter from './routes/patient.routes.js'
import authRouter from './routes/auth.routes.js'
import providersRouter from './routes/providers.routes.js'
import audioRouter from './routes/audio.routes.js'
import { notFoundHandler } from './middlewares/notFound.js'
import { errorHandler } from './middlewares/error.js'

const app = express()

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginEmbedderPolicy: false
}))
app.use(cors({ origin: '*'}))
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
})
