import './config/env.js'
import sql from './config/db.js'

async function test() {
  try {
    const r = await sql`SELECT 1 as ok`
    console.log('DB test query result:', r?.[0])
    await sql.end()
    process.exit(0)
  } catch (err) {
    console.error('DB test failed:', err?.message || err)
    try { await sql.end() } catch {}
    process.exit(1)
  }
}

test()
