import { useState } from 'react'
import { api } from '../lib/api'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { useAuth } from '../context/useAuth'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { signIn } = useAuth()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post('/auth/signin', { email, password }, { validateStatus: () => true })
      if (res.status !== 200) {
        setError(res.data?.error || 'Invalid credentials')
        return
      }
      await signIn(email, password)
      navigate('/patients')
    } catch {
      setError('Network error')
    }
  }

  return (
    <div className="max-w-sm mx-auto p-4 relative">
      <div className="flex items-center justify-between">
        <div className="text-lg font-bold text-blue-600">eScribe</div>
        <button type="button" aria-label="Close" className="inline-flex items-center justify-center rounded-full w-9 h-9 text-gray-600">
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="mt-4">
        <div className="text-center">
          <div className="text-2xl font-semibold tracking-tight text-[#4c2b36]">Welcome Back</div>
          <div className="mt-1 text-sm text-[#4c2b36]/70">Sign in to your EVAA AI portal</div>
        </div>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4c2b36]">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-md border border-[#d7d1c8] bg-white px-3 py-2 text-sm text-[#4c2b36] placeholder-[#4c2b36]/40 focus:border-[#4c2b36] focus:outline-none focus:ring-2 focus:ring-[#4c2b36]"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#4c2b36]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-md border border-[#d7d1c8] bg-white px-3 py-2 text-sm text-[#4c2b36] placeholder-[#4c2b36]/40 focus:border-[#4c2b36] focus:outline-none focus:ring-2 focus:ring-[#4c2b36]"
              required
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button type="submit" className="mt-2 w-full rounded-md bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2">
            Sign In
          </button>
        </form>
      </div>
    </div>
  )
}
