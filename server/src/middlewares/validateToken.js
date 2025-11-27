import jwt from 'jsonwebtoken'

export function validateToken(req, res, next) {
  try {
    const token = req.cookies?.token
    if (!token) return res.status(401).json({ error: 'Unauthorized' })
    const secret = process.env.JWT_SECRET || 'dev-secret'
    const payload = jwt.verify(token, secret)
    req.user = payload
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}
