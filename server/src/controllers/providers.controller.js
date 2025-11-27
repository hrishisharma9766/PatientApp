import { pool } from '../config/db.js'

export async function listProviders(req, res, next) {
  try {
    const client = await pool.connect()
    try {
      console.log('listProviders: begin')
      await client.query('BEGIN')
      await client.query('CALL get_providers_cursor()')
      const { rows } = await client.query('FETCH ALL FROM get_providers_cursor_rc')
      await client.query('COMMIT')
      console.log('listProviders: rows', rows.length)
      res.json(rows.map(r => r.name))
    } catch (err) {
      console.error('listProviders error:', err?.message)
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  } catch (err) {
    next(err)
  }
}
