import jwt from 'jsonwebtoken'

const USERS = [
  { email: 'user@example.com', password: 'password123', name: 'Test User' },
  { email: 'doctor@clinic.com', password: 'secret', name: 'Dr. Sarah Johnson' }
]

export async function signin(req, res, next) {
  try {
    const { email, password } = req.body || {}
    const user = USERS.find(u => u.email === email && u.password === password)
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    const secret = process.env.JWT_SECRET || 'dev-secret'
    const token = jwt.sign({ email: user.email, name: user.name }, secret, { expiresIn: '2h' })
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 2 * 60 * 60 * 1000
    })
    res.json({ user: { email: user.email, name: user.name } })
  } catch (err) {
    next(err)
  }
}

export async function signout(req, res, next) {
  try {
    res.clearCookie('token', { httpOnly: true, secure: false, sameSite: 'lax' })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}

export async function profile(req, res, next) {
  try {
    const user = req.user
    if (!user) return res.status(401).json({ error: 'Unauthorized' })
    res.json({ user: { email: user.email, name: user.name } })
  } catch (err) {
    next(err)
  }
}
