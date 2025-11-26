import { Router } from 'express'
import { getPatients, searchPatients, setPatientState } from '../controllers/patient.controller.js'
import { validate, validateBody } from '../middlewares/validate.js'
import Joi from 'joi'

const router = Router()

router.get('/', getPatients)

const searchSchema = Joi.object({
  q: Joi.string().allow('').default(''),
  dob: Joi.string().pattern(/^\d{2}\/\d{2}\/\d{4}$/).allow('').default('')
})

router.get('/search', validate(searchSchema), searchPatients)

const stateSchema = Joi.object({ state: Joi.string().valid('idle','start','paused','complete').required() })
router.patch('/:id/state', validateBody(stateSchema), setPatientState)

export default router
