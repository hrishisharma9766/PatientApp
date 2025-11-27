import sql from '../config/db.js'

export async function listProviders(req, res, next) {
  try {
    try {
      console.log('listProviders: begin')
      const rows = await sql`select * from public.get_providers()`
      console.log('listProviders: rows', rows.length)
      res.json(rows.map(r => r.name))
    } catch (err) {
      console.error('listProviders error:', err?.message)
      throw err
    }
  } catch (err) {
    next(err)
  }
}
