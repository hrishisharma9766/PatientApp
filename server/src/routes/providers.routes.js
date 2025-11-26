import { Router } from 'express'
import { listProviders } from '../controllers/providers.controller.js'

const router = Router()

router.get('/', listProviders)

export default router
