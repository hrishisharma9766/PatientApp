import { Router } from 'express'
import multer from 'multer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const storage = multer.memoryStorage()
const upload = multer({ storage })

const router = Router()
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const audioDir = path.join(__dirname, '../data/audio')

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

router.post('/:id', upload.single('file'), (req, res, next) => {
  try {
    const id = String(req.params.id)
    ensureDir(audioDir)
    const mode = String(req.query.mode || 'replace')
    const mime = req.file?.mimetype || 'audio/webm'
    const ext = mime.includes('ogg') ? 'ogg' : mime.includes('webm') ? 'webm' : 'dat'
    const existingPath = fs.existsSync(path.join(audioDir, `${id}.ogg`))
      ? path.join(audioDir, `${id}.ogg`)
      : fs.existsSync(path.join(audioDir, `${id}.webm`))
        ? path.join(audioDir, `${id}.webm`)
        : null
    const targetPath = existingPath ?? path.join(audioDir, `${id}.${ext}`)
    if (mode === 'append' && fs.existsSync(targetPath)) {
      fs.appendFileSync(targetPath, req.file.buffer)
    } else {
      fs.writeFileSync(targetPath, req.file.buffer)
    }
    res.json({ ok: true, path: `/api/audio/${id}` })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', (req, res, next) => {
  try {
    const id = String(req.params.id)
    const oggPath = path.join(audioDir, `${id}.ogg`)
    const webmPath = path.join(audioDir, `${id}.webm`)
    if (fs.existsSync(oggPath)) {
      res.setHeader('Content-Type', 'audio/ogg')
      return fs.createReadStream(oggPath).pipe(res)
    }
    if (fs.existsSync(webmPath)) {
      res.setHeader('Content-Type', 'audio/webm')
      return fs.createReadStream(webmPath).pipe(res)
    }
    return res.status(404).json({ error: 'Not found' })
  } catch (err) {
    next(err)
  }
})

export default router
