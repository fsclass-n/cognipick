import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { toast } from '../lib/api'
import { BlockSkeleton } from './ui'

/** roles 가 없으면 로그인만 요구, 있으면 해당 권한만 통과 (백엔드가 최종 검증) */
export default function ProtectedRoute({ roles }) {
  const { user, ready } = useAuth()
  const loc = useLocation()
  const denied = ready && user && roles && !roles.includes(user.role)
  useEffect(() => { if (denied) toast('접근 권한이 없는 페이지입니다.', 'warn') }, [denied])
  if (!ready) return <div className="container-x py-16"><BlockSkeleton h="h-96" /></div>
  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  if (denied) return <Navigate to="/" replace />
  return <Outlet />
}
