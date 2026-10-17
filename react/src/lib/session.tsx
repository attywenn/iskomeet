import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import * as api from './api'
import type { SessionUser } from './types'

type SessionContextValue = {
  user: SessionUser | null
  refresh: () => void
  signOut: () => void
  updateUser: (updated: SessionUser) => void
}

const SessionContext = createContext<SessionContextValue | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => api.getSession())

  const refresh = useCallback(() => {
    setUser(api.getSession())
  }, [])

  const signOut = useCallback(() => {
    api.signOut()
    setUser(null)
  }, [])

  const updateUser = useCallback((updated: SessionUser) => {
    api.updateSession(updated)
    setUser(updated)
  }, [])

  const value = useMemo(
    () => ({ user, refresh, signOut, updateUser }),
    [user, refresh, signOut, updateUser],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside SessionProvider')
  return ctx
}
