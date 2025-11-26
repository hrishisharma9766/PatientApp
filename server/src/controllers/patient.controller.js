import { listPatients, filterPatients, updatePatientState } from '../services/patient.service.js'

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

export async function setPatientState(req, res, next) {
  try {
    const { id } = req.params
    const { state } = req.body || {}
    const updated = await updatePatientState(id, state)
    if (!updated) return res.status(404).json({ error: 'Patient not found' })
    res.json(updated)
  } catch (err) {
    next(err)
  }
}
