import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataPath = path.join(__dirname, '../data/patients.json')

function readData() {
  const raw = fs.readFileSync(dataPath, 'utf-8')
  return JSON.parse(raw)
}

export async function listPatients() {
  return readData()
}

export async function filterPatients(query, dob) {
  const data = readData()
  const q = (query || '').trim().toLowerCase()
  const hasDob = !!dob
  return data.filter(p => {
    const matchText = q ? (p.name.toLowerCase().includes(q) || String(p.id).includes(q)) : true
    const matchDob = hasDob ? p.dob === dob : true
    return matchText && matchDob
  })
}

export async function updatePatientState(id, state) {
  const data = readData()
  const idx = data.findIndex(p => String(p.id) === String(id))
  if (idx === -1) return null
  data[idx].state = state
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2))
  return data[idx]
}
