const USERS = [
  { email: 'user@example.com', password: 'password123', name: 'Test User' },
  { email: 'doctor@clinic.com', password: 'secret', name: 'Dr. Sarah Johnson' }
]

export async function signin(req, res, next) {
  try {
    const { email, password } = req.body || {}
    console.log(req.body.email)
    const user = USERS.find(u => u.email === email && u.password === password)
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    res.json({ token: 'dummy-token', user: { email: user.email, name: user.name } })
  } catch (err) {
    next(err)
  }
}
