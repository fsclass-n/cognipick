import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { faArrowRightFromBracket, faMagnifyingGlass, faShieldHalved, faUser, faEye } from '@fortawesome/free-solid-svg-icons'
import { Icon } from './ui'
import { useAuth } from '../context/AuthContext'
import { NAV, ROLE_LABEL } from '../lib/site'

export function Logo({ light = false }) {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="cognipick 홈">
      <svg viewBox="0 0 32 32" className="size-8"><rect width="32" height="32" rx="9" fill="#4f46e5" /><circle cx="16" cy="16" r="6.5" fill="none" stroke="#fff" strokeWidth="2.4" /><circle cx="23.5" cy="9" r="3.2" fill="#c6f432" /></svg>
      <span className={`font-display text-xl font-bold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>cogni<span className={light ? 'text-accent' : 'text-brand-600'}>pick</span></span>
    </Link>
  )
}

function ReadOnlyBar() {
  return (
    <div className="bg-amber-400 text-ink">
      <div className="container-x flex items-center justify-center gap-2 py-1.5 text-caption font-bold">
        <span className="group relative inline-flex items-center gap-1.5">
          <Icon icon={faEye} />읽기 전용 모드
          <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-center font-medium text-white opacity-0 shadow-pop transition group-hover:opacity-100">
            테스트 관리자 계정입니다. 모든 관리자 화면을 볼 수 있지만 생성·수정·삭제는 차단됩니다.
          </span>
        </span>
        <span className="hidden font-medium sm:inline">· 데이터 변경 요청은 서버에서 403으로 차단됩니다</span>
      </div>
    </div>
  )
}

export default function Header() {
  const { user, logout, isAdmin, readOnly } = useAuth()
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const loc = useLocation()

  useEffect(() => { setOpen(false); setSearching(false) }, [loc.pathname])
  useEffect(() => { document.body.style.overflow = open ? 'hidden' : ''; return () => { document.body.style.overflow = '' } }, [open])

  const search = (e) => { e.preventDefault(); nav(`/courses?q=${encodeURIComponent(q.trim())}`); setQ('') }
  const link = ({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-muted hover:bg-surface-2 hover:text-fg'}`

  return (
    <header className="sticky top-0 z-50">
      {readOnly && <ReadOnlyBar />}
      <div className="border-b border-line bg-white/85 backdrop-blur-xl">
        <div className="container-x flex h-16 items-center gap-4">
          <Logo />
          <nav className="mx-auto hidden items-center gap-1 lg:flex" aria-label="주요 메뉴">
            {NAV.map((n) => <NavLink key={n.to} to={n.to} className={link}>{n.label}</NavLink>)}
          </nav>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <button className="grid size-10 place-items-center rounded-xl text-muted hover:bg-surface-2" aria-label="검색" onClick={() => setSearching((s) => !s)}><Icon icon={faMagnifyingGlass} /></button>
            <div className="hidden items-center gap-2 lg:flex">
              {isAdmin && <NavLink to="/admin" className="btn btn-ghost !py-2"><Icon icon={faShieldHalved} />관리자</NavLink>}
              {user ? (
                <>
                  <NavLink to="/mypage" className="btn btn-ghost !py-2"><Icon icon={faUser} />{user.name}<span className="chip">{ROLE_LABEL[user.role]}</span></NavLink>
                  <button className="grid size-10 place-items-center rounded-xl text-muted hover:bg-surface-2" aria-label="로그아웃" title="로그아웃" onClick={logout}><Icon icon={faArrowRightFromBracket} /></button>
                </>
              ) : <Link to="/login" className="btn btn-primary !py-2">로그인</Link>}
            </div>
            <button className="relative z-[70] grid size-10 place-items-center rounded-xl hover:bg-surface-2 lg:hidden" aria-label={open ? '메뉴 닫기' : '메뉴 열기'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
              <span className="relative block h-4 w-5">
                <i className={`absolute left-0 h-0.5 w-5 rounded bg-ink transition-all duration-300 ${open ? 'top-[7px] rotate-45' : 'top-0'}`} />
                <i className={`absolute left-0 top-[7px] h-0.5 w-5 rounded bg-ink transition-all duration-300 ${open ? 'scale-x-0 opacity-0' : ''}`} />
                <i className={`absolute left-0 h-0.5 w-5 rounded bg-ink transition-all duration-300 ${open ? 'top-[7px] -rotate-45' : 'top-[14px]'}`} />
              </span>
            </button>
          </div>
        </div>
        {searching && (
          <form onSubmit={search} className="container-x animate-rise pb-3">
            <div className="relative"><Icon icon={faMagnifyingGlass} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} className="input !pl-11" placeholder="강의명, 강사, 역량 태그로 검색 (예: SQL, LLM)" /></div>
          </form>
        )}
      </div>

      <div className={`fixed inset-0 z-[60] bg-ink/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} onClick={() => setOpen(false)} />
      <aside className={`fixed inset-y-0 right-0 z-[65] flex w-[82%] max-w-sm flex-col bg-white shadow-pop transition-transform duration-300 ease-out lg:hidden ${open ? 'translate-x-0' : 'translate-x-full'}`} aria-hidden={!open} inert={!open}>
        <div className="flex h-16 items-center border-b border-line px-5"><Logo /></div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {NAV.map((n, i) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => `block rounded-xl px-4 py-3 text-base font-semibold transition-all duration-300 ${isActive ? 'bg-brand-50 text-brand-700' : 'text-fg hover:bg-surface-2'} ${open ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'}`} style={{ transitionDelay: open ? `${80 + i * 45}ms` : '0ms' }}>{n.label}</NavLink>
          ))}
          {isAdmin && <NavLink to="/admin" className="block rounded-xl px-4 py-3 text-base font-semibold text-fg hover:bg-surface-2"><Icon icon={faShieldHalved} className="mr-2 text-brand-600" />관리자</NavLink>}
        </nav>
        <div className="space-y-2 border-t border-line p-4">
          {user ? (
            <>
              <Link to="/mypage" className="btn btn-ghost w-full"><Icon icon={faUser} />{user.name} · {ROLE_LABEL[user.role]}</Link>
              <button className="btn btn-danger w-full" onClick={logout}>로그아웃</button>
            </>
          ) : <Link to="/login" className="btn btn-primary w-full">로그인 / 시작하기</Link>}
        </div>
      </aside>
    </header>
  )
}
