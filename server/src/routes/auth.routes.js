import { Router } from 'express'
import { signin } from '../controllers/auth.controller.js'

const router = Router()

router.post('/signin', signin)

export default router
