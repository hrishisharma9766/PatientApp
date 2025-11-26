import { Router } from 'express'
import { getPatients, searchPatients } from '../controllers/patient.controller.js'
import { validate } from '../middlewares/validate.js'
import Joi from 'joi'

const router = Router()

router.get('/', getPatients)

const searchSchema = Joi.object({
  q: Joi.string().allow('').default(''),
  dob: Joi.string().pattern(/^\d{2}\/\d{2}\/\d{4}$/).allow('').default('')
})

router.get('/search', validate(searchSchema), searchPatients)

export default router
