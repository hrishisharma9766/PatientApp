import { listPatients, filterPatients } from '../services/patient.service.js'

export async function getPatients(req, res, next) {
  try {
    const patients = await listPatients()
    res.json(patients)
  } catch (err) {
    next(err)
  }
}

export async function searchPatients(req, res, next) {
  try {
    const { q = '', dob = '' } = req.query
    const patients = await filterPatients(q, dob)
    res.json(patients)
  } catch (err) {
    next(err)
  }
}
