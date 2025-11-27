import sql from '../config/db.js'

export async function listPatients() {
  try {
    console.log('listPatients: begin')
    const rows = await sql`select * from public.get_patients()`
    console.log('listPatients: rows', rows.length)
    return rows
  } catch (err) {
    console.error('listPatients error:', err?.message)
    throw err
  }
}

export async function filterPatients(query, dob) {
  const q = (query || '').trim()
  const d = (dob || '').trim()
  try {
    console.log('filterPatients: begin', { q, d })
    const rows = await sql`select * from public.search_patients(${q}, ${d})`
    console.log('filterPatients: rows', rows.length)
    return rows
  } catch (err) {
    console.error('filterPatients error:', err?.message)
    throw err
  }
}

export async function updatePatientState(id, state) {
  try {
    console.log('updatePatientState: begin', { id, state })
    const rows = await sql`select * from public.set_patient_state(${id}, ${state})`
    console.log('updatePatientState: done')
    return rows[0] || null
  } catch (err) {
    console.error('updatePatientState error:', err?.message)
    throw err
  }
}

export async function createPatient(patient) {
  const { id, name, dob, age, time } = patient
  try {
    console.log('createPatient: begin', { id })
    const rows = await sql`select * from public.create_patient(${id}, ${name}, ${dob}, ${age}, ${time || null})`
    console.log('createPatient: done')
    return rows[0] || null
  } catch (err) {
    console.error('createPatient error:', err?.message)
    throw err
  }
}
