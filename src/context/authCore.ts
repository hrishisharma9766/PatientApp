import { createContext } from 'react'

export type User = { email: string, name: string } | null

export interface AuthContextValue {
  user: User
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue>({ user: null, signIn: async () => {}, signOut: () => {}, refreshProfile: async () => {} })
