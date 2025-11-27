import { Pool } from 'pg'



const host = process.env.PG_HOST || 'localhost'
const port = process.env.PG_PORT || 5432
const database = process.env.PG_DB || 'PatientApp'
const user = process.env.PG_USER || 'postgres'
const password = process.env.PG_PASSWORD || "HANUMAN9766"


export const pool = new Pool({
    host: host,
    port: port,
    database: database,
    user : user,
    password : password,
  ssl: false,
  max: 10,
  idleTimeoutMillis: 30000
})

pool.on('error', (err) => {
  console.error('PG pool error', err)
})

try {
  const safe = { host, port, database, user, pwType: typeof password, urlSet: !!envUrl }
  console.log('PG config', safe)
} catch {}
