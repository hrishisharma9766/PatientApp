import postgres from 'postgres'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import dns from 'dns'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
try { dotenv.config({ path: path.resolve(__dirname, '../../.env') }) } catch {}
try { dotenv.config() } catch {}
try { dns.setDefaultResultOrder && dns.setDefaultResultOrder('ipv4first') } catch {}

function buildFromParts() {
  const host = process.env.DB_HOST
  const user = process.env.DB_USER || 'postgres'
  const password = process.env.DB_PASSWORD || ''
  const port = process.env.DB_PORT || '5432'
  const name = process.env.DB_NAME || 'postgres'
  if (!host) return null
  const encodedPassword = encodeURIComponent(password)
  return `postgresql://${user}:${encodedPassword}@${host}:${port}/${name}`
}

const connectionString = process.env.DATABASE_URL || process.env.PG_URL || buildFromParts()
if (!connectionString) {
  throw new Error('Missing DATABASE_URL / PG_URL or DB_HOST/DB_USER/DB_PASSWORD in environment for Supabase/Postgres connection')
}

const sql = postgres(connectionString, { ssl: { rejectUnauthorized: false }, max: 5 })

try {
  const url = process.env.DATABASE_URL || process.env.PG_URL || ''
  const isSupabase = url.includes('supabase.co') || (process.env.DB_HOST || '').includes('supabase.co')
  console.log('DB config', { urlSet: !!connectionString, isSupabase })
} catch {}

export default sql
