import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, tokenStore, toast } from '../lib/api'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(!tokenStore.get())

  const logout = useCallback(() => { tokenStore.clear(); setUser(null) }, [])
  const login = useCallback((res) => { tokenStore.set(res.access_token); setUser(res.user) }, [])

  useEffect(() => {
    if (!tokenStore.get()) return
    api('/api/auth/me', { silent: true }).then(setUser).catch(() => tokenStore.clear()).finally(() => setReady(true))
  }, [])
  useEffect(() => {
    const onUnauth = () => { logout(); toast('로그인이 만료되었습니다. 다시 로그인해 주세요.', 'warn') }
    window.addEventListener('cognipick:unauthorized', onUnauth)
    return () => window.removeEventListener('cognipick:unauthorized', onUnauth)
  }, [logout])

  const value = useMemo(() => ({
    user, ready, login, logout,
    isAdmin: user?.role === 'admin' || user?.role === 'admin_readonly',
    readOnly: user?.role === 'admin_readonly',
    isCompany: user?.role === 'company' || user?.role === 'admin' || user?.role === 'admin_readonly',
  }), [user, ready, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
