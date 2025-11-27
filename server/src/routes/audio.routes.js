import { Router } from 'express'
import multer from 'multer'
import sql from '../config/db.js'
import { validateToken } from '../middlewares/validateToken.js'

const storage = multer.memoryStorage()
const upload = multer({ storage })

const router = Router()

router.post('/:id', validateToken, upload.single('file'), async (req, res, next) => {
  try {
    const id = String(req.params.id)
    const mime = req.file?.mimetype || 'audio/webm'
    const data = req.file?.buffer || Buffer.alloc(0)
    await sql`select public.upsert_recording(${id}, ${mime}, ${data})`
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

router.get('/:id', async (req, res, next) => {
  try {
    const id = String(req.params.id)
    const rows = await sql`select mime_type, data from public.get_recording(${id})`
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    const row = rows[0]
    const buf = Buffer.isBuffer(row.data) ? row.data : Buffer.from(row.data)
    res.setHeader('Content-Type', row.mime_type || 'audio/webm')
    res.end(buf)
  } catch (err) {
    next(err)
  }
})

export default router
