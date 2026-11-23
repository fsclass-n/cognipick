import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, tokenStore, toast } from '../lib/api'
import { useAuth } from '../context/AuthContext'

export default function OAuthCallback() {
  const nav = useNavigate()
  const { login } = useAuth()
  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token')
    if (!token) return nav('/login', { replace: true })
    tokenStore.set(token)
    api('/api/auth/me').then((user) => { login({ access_token: token, user }); nav('/', { replace: true }) })
      .catch(() => { tokenStore.clear(); toast('소셜 로그인에 실패했습니다.', 'error'); nav('/login', { replace: true }) })
  }, [nav, login])
  return <p className="text-center text-muted">로그인 처리 중…</p>
}
