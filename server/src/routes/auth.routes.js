import { Router } from 'express'
import { signin, signout, profile } from '../controllers/auth.controller.js'
import { validateToken } from '../middlewares/validateToken.js'

const router = Router()

router.post('/signin', signin)
router.post('/signout', signout)
router.get('/profile', validateToken, profile)

export default router
