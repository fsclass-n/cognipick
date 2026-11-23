import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { faArrowRightFromBracket, faMagnifyingGlass, faShieldHalved, faUser, faEye, faCompass, faChartLine, faWandMagicSparkles, faBullseye, faRobot, faXmark } from '@fortawesome/free-solid-svg-icons'
import { Icon } from './ui'
import Logo from './Logo'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../lib/api'
import { NAV, ROLE_LABEL } from '../lib/site'

const NAV_ICONS = { '/courses': faCompass, '/demand': faChartLine, '/diagnosis': faWandMagicSparkles, '/pick': faBullseye, '/tutor': faRobot }

export { Logo }

/** 상단 시그널 바: 기업 수요 급상승 역량을 실시간 티커로 */
function SignalBar() {
  const { data } = useApi('/api/demand/overview')
  const items = (data?.top_skills || []).slice().sort((a, b) => b.growth - a.growth).slice(0, 10)
  return (
    <div className="overflow-hidden bg-ink text-[12px] text-white/75">
      <div className="container-x flex h-9 items-center gap-4">
        <span className="text-eyebrow shrink-0 !text-[10px] text-accent">Demand Signal</span>
        <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
          {items.length ? (
            <div className="flex w-max animate-marquee gap-8 hover:[animation-play-state:paused]">
              {[...items, ...items].map((s, i) => (
                <span key={i} className="whitespace-nowrap"><b className="text-white">{s.skill}</b> <span className={s.growth >= 0 ? 'text-accent' : 'text-white/45'}>{s.growth >= 0 ? '↑' : '↓'}{Math.abs(s.growth)}%</span></span>
              ))}
            </div>
          ) : <span className="text-white/50">채용공고 · 공공 고용 데이터 · AI Hub 기반 기업 수요를 분석합니다</span>}
        </div>
        <Link to="/demand" className="hidden shrink-0 font-semibold text-white hover:text-accent sm:block">리포트 보기 →</Link>
      </div>
    </div>
  )
}

function ReadOnlyBar() {
  return (
    <div className="bg-amber-400 text-ink">
      <div className="container-x flex items-center justify-center gap-2 py-1.5 text-caption font-bold">
        <span className="group relative inline-flex cursor-help items-center gap-1.5 rounded-full bg-ink/10 px-2.5 py-0.5">
          <Icon icon={faEye} />읽기 전용 모드
          <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 rounded-xl bg-ink px-3 py-2 text-center font-medium text-white opacity-0 shadow-lift transition group-hover:opacity-100">
            테스트 관리자 계정입니다. 모든 관리자 화면을 볼 수 있지만 생성·수정·삭제는 서버에서 차단됩니다.
          </span>
        </span>
        <span className="hidden font-medium sm:inline">데이터 변경 요청은 403으로 차단됩니다</span>
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
  const link = ({ isActive }) => `relative rounded-full px-3.5 py-2 text-[0.9rem] font-semibold transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-muted hover:bg-surface-2 hover:text-ink'}`

  return (
    <>
      <header className="sticky top-0 z-50">
        {readOnly && <ReadOnlyBar />}
        <SignalBar />
        <div className="border-b border-line/80 bg-white/80 backdrop-blur-xl">
          <div className="container-x flex h-16 items-center gap-4">
            <Logo />
            <nav className="mx-auto hidden items-center gap-1 rounded-full border border-line bg-surface/70 p-1 lg:flex" aria-label="주요 메뉴">
              {NAV.map((n) => <NavLink key={n.to} to={n.to} className={link}>{n.label}</NavLink>)}
            </nav>
            <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
              <button className="grid size-10 place-items-center rounded-full text-ink hover:bg-surface-2" aria-label="검색" aria-expanded={searching} onClick={() => setSearching((s) => !s)}><Icon icon={searching ? faXmark : faMagnifyingGlass} /></button>
              <div className="hidden items-center gap-1.5 lg:flex">
                {isAdmin && <NavLink to="/admin" className="btn btn-ghost !px-4 !py-2"><Icon icon={faShieldHalved} />관리자</NavLink>}
                {user ? (
                  <>
                    <NavLink to="/mypage" className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3 text-sm font-semibold hover:border-brand-300">
                      <span className="grid size-7 place-items-center rounded-full bg-brand-600 text-caption font-bold text-white">{user.name.slice(0, 1)}</span>{user.name}<span className="text-caption font-medium text-muted">{ROLE_LABEL[user.role]}</span>
                    </NavLink>
                    <button className="grid size-10 place-items-center rounded-full text-muted hover:bg-surface hover:text-ink" aria-label="로그아웃" title="로그아웃" onClick={logout}><Icon icon={faArrowRightFromBracket} /></button>
                  </>
                ) : <><Link to="/login" className="btn btn-ghost !border-transparent !py-2">로그인</Link><Link to="/register" className="btn btn-primary !py-2">무료로 시작</Link></>}
              </div>
              <button className="relative z-[70] grid size-10 place-items-center rounded-full hover:bg-surface-2 lg:hidden" aria-label={open ? '메뉴 닫기' : '메뉴 열기'} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
                <span className="relative block h-3.5 w-5">
                  <i className={`absolute left-0 h-0.5 w-5 rounded bg-ink transition-all duration-300 ${open ? 'top-1.5 rotate-45' : 'top-0'}`} />
                  <i className={`absolute left-0 top-1.5 h-0.5 rounded bg-ink transition-all duration-300 ${open ? 'w-0 opacity-0' : 'w-3.5'}`} />
                  <i className={`absolute left-0 h-0.5 w-5 rounded bg-ink transition-all duration-300 ${open ? 'top-1.5 -rotate-45' : 'top-3'}`} />
                </span>
              </button>
            </div>
          </div>
          {searching && (
            <form onSubmit={search} className="container-x animate-rise pb-4">
              <div className="relative"><Icon icon={faMagnifyingGlass} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted" />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} className="input !rounded-full !py-3.5 !pl-12 text-base" placeholder="무엇을 배우고 싶나요? 강의명·강사·역량 (예: SQL, LLM)" /></div>
            </form>
          )}
        </div>
      </header>

      <div className={`fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} onClick={() => setOpen(false)} />
      <aside className={`fixed inset-y-0 right-0 z-[65] flex w-[86%] max-w-sm flex-col bg-white shadow-lift transition-transform duration-[400ms] ease-[cubic-bezier(.2,.8,.2,1)] lg:hidden ${open ? 'translate-x-0' : 'translate-x-full'}`} aria-hidden={!open} inert={!open}>
        <div className="flex h-16 items-center border-b border-line px-5"><Logo /></div>
        <nav className="flex-1 overflow-y-auto px-5 py-6">
          <p className="text-eyebrow mb-3 text-muted">Menu</p>
          {NAV.map((n, i) => (
            <NavLink key={n.to} to={n.to} style={{ transitionDelay: open ? `${100 + i * 50}ms` : '0ms' }}
              className={({ isActive }) => `flex items-center justify-between border-b border-line py-4 font-display text-2xl font-bold tracking-tight transition-all duration-500 ${isActive ? 'text-brand-600' : 'text-ink'} ${open ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}>
              {n.label}<span className="num text-caption text-muted">0{i + 1}</span>
            </NavLink>
          ))}
          {isAdmin && <NavLink to="/admin" className="mt-4 flex items-center gap-2 text-sm font-semibold"><Icon icon={faShieldHalved} className="text-brand-600" />운영 관리자</NavLink>}
        </nav>
        <div className="space-y-2 border-t border-line p-5">
          {user ? (
            <>
              <Link to="/mypage" className="btn btn-ghost w-full"><Icon icon={faUser} />{user.name} · {ROLE_LABEL[user.role]}</Link>
              <button className="btn btn-danger w-full" onClick={logout}>로그아웃</button>
            </>
          ) : <Link to="/login" className="btn btn-ink w-full">로그인 / 시작하기</Link>}
        </div>
      </aside>

      {/* 모바일 하단 탭바 (앱형 내비게이션) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden" aria-label="하단 탭">
        <div className="grid grid-cols-5">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => `flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold ${isActive ? 'text-brand-600' : 'text-muted'}`}>
              <Icon icon={NAV_ICONS[n.to]} className="text-base" />{n.label.replace('기업 ', '').replace('맞춤 학습 ', '').replace('AI 역량 ', '')}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}
