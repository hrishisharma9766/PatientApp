import { pool } from '../config/db.js'

export async function listPatients() {
  const client = await pool.connect()
  try {
    console.log('listPatients: begin')
    await client.query('BEGIN')
    await client.query('CALL get_patients_cursor()')
    const { rows } = await client.query('FETCH ALL FROM get_patients_cursor_rc')
    await client.query('COMMIT')
    console.log('listPatients: rows', rows.length)
    return rows
  } catch (err) {
    console.error('listPatients error:', err?.message)
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function filterPatients(query, dob) {
  const q = (query || '').trim()
  const d = (dob || '').trim()
  const client = await pool.connect()
  try {
    console.log('filterPatients: begin', { q, d })
    await client.query('BEGIN')
    await client.query('CALL search_patients_cursor($1, $2)', [q, d])
    const { rows } = await client.query('FETCH ALL FROM search_patients_cursor_rc')
    await client.query('COMMIT')
    console.log('filterPatients: rows', rows.length)
    return rows
  } catch (err) {
    console.error('filterPatients error:', err?.message)
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function updatePatientState(id, state) {
  const client = await pool.connect()
  try {
    console.log('updatePatientState: begin', { id, state })
    await client.query('BEGIN')
    await client.query('CALL set_patient_state($1, $2)', [id, state])
    await client.query('CALL get_patient_by_id_cursor($1)', [id])
    const { rows } = await client.query('FETCH ALL FROM get_patient_by_id_cursor_rc')
    await client.query('COMMIT')
    console.log('updatePatientState: done')
    return rows[0] || null
  } catch (err) {
    console.error('updatePatientState error:', err?.message)
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function createPatient(patient) {
  const { id, name, dob, age, time } = patient
  const client = await pool.connect()
  try {
    console.log('createPatient: begin', { id })
    await client.query('BEGIN')
    await client.query('CALL create_patient($1, $2, $3, $4, $5)', [id, name, dob, age, time || null])
    await client.query('CALL get_patient_by_id_cursor($1)', [id])
    const { rows } = await client.query('FETCH ALL FROM get_patient_by_id_cursor_rc')
    await client.query('COMMIT')
    console.log('createPatient: done')
    return rows[0] || null
  } catch (err) {
    console.error('createPatient error:', err?.message)
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
