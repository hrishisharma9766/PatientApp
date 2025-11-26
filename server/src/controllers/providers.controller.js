import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataPath = path.join(__dirname, '../data/providers.json')

export async function listProviders(req, res, next) {
  try {
    const raw = fs.readFileSync(dataPath, 'utf-8')
    const providers = JSON.parse(raw)
    res.json(providers)
  } catch (err) {
    next(err)
  }
}
