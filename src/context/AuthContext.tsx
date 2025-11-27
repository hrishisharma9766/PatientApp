import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api'
import { AuthContext, type User } from './authCore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null)

  useEffect(() => {
    api.defaults.withCredentials = true
  }, [])

  const refreshProfile = useCallback(async () => {
    const res = await api.get('/auth/profile', { validateStatus: () => true })
    if (res.status === 200) setUser(res.data?.user ?? null)
    else setUser(null)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/signin', { email, password }, { validateStatus: () => true })
    if (res.status === 200) {
      setUser(res.data?.user ?? null)
    } else {
      setUser(null)
    }
  }, [])

  const signOut = useCallback(async () => {
    await api.post('/auth/signout')
    setUser(null)
  }, [])

  useEffect(() => {
    const id = window.setTimeout(() => { refreshProfile() }, 0)
    return () => window.clearTimeout(id)
  }, [refreshProfile])

  const value = useMemo(() => ({ user, signIn, signOut, refreshProfile }), [user, signIn, signOut, refreshProfile])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
