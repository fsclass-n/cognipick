import { Link, Outlet, useLocation } from 'react-router-dom'
import { faArrowLeft, faArrowTrendUp, faRobot } from '@fortawesome/free-solid-svg-icons'
import { Icon, Toasts } from '../components/ui'
import Logo, { RingMark } from '../components/Logo'
import { PHOTOS } from '../lib/photos'

const BARS = [['SQL', 82], ['Python', 64], ['통계', 41]]

function SignalCards() {
  return (
    <div className="relative h-[19rem]">
      <div className="glass absolute left-0 top-0 w-64 animate-float rounded-2xl p-4 text-white">
        <p className="text-eyebrow text-white/60">Today&apos;s demand signal</p>
        <p className="mt-2 flex items-baseline justify-between font-display text-xl font-bold">LLM/프롬프트<span className="text-sm text-accent"><Icon icon={faArrowTrendUp} className="mr-1" />32.7%</span></p>
        <svg viewBox="0 0 200 40" className="mt-2 w-full"><path d="M0 34 L25 30 L50 31 L75 24 L100 25 L125 17 L150 14 L175 8 L200 4" fill="none" stroke="#20d6a5" strokeWidth="2.5" strokeLinecap="round" /></svg>
      </div>
      <div className="glass absolute right-0 top-20 w-60 animate-float-slow rounded-2xl p-4 text-white">
        <p className="text-eyebrow text-white/60">My readiness · 데이터 분석가</p>
        <ul className="mt-3 space-y-2">
          {BARS.map(([k, v]) => (
            <li key={k} className="text-caption"><span className="flex justify-between"><b>{k}</b><span className="num">{v}</span></span>
              <span className="mt-1 block h-1.5 rounded-full bg-white/20"><span className="block h-full rounded-full bg-white" style={{ width: `${v}%` }} /></span></li>
          ))}
        </ul>
      </div>
      <div className="glass absolute bottom-0 left-10 flex w-72 animate-float items-start gap-3 rounded-2xl p-4 text-white [animation-delay:1.2s]">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-ink"><Icon icon={faRobot} /></span>
        <p className="text-sm leading-relaxed">“SQL 윈도우 함수부터 시작해 보세요. <b>실전 SQL</b> 2강이 가장 가까워요.”</p>
      </div>
    </div>
  )
}

export default function AuthLayout() {
  const { pathname } = useLocation()
  const photo = pathname === '/register' ? PHOTOS.register : PHOTOS.login
  return (
    <div className="grid min-h-screen bg-bg lg:grid-cols-[1.08fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-ink lg:block">
        <img src={photo} alt="" className="absolute inset-0 size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-ink/95 via-brand-900/75 to-brand-600/40" />
        <div className="dots-dark absolute inset-0" />
        <RingMark size={620} className="absolute -bottom-56 -right-56 text-white/[0.12]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white xl:p-14">
          <Logo light />
          <div className="grid gap-12">
            <div>
              <p className="text-eyebrow text-accent">AI Learning × Enterprise Demand</p>
              <h2 className="text-display mt-4 !text-[clamp(2.4rem,3.6vw,3.6rem)]">Pick your<br />next skill.</h2>
              <p className="mt-4 max-w-md text-white/70">기업이 원하는 역량을 데이터로 읽고, 내 역량과 비교해 가장 빠른 학습 경로를 골라드립니다.</p>
            </div>
            <SignalCards />
          </div>
          <div className="flex items-end justify-between gap-6 border-t border-white/15 pt-6 text-caption text-white/55">
            <dl className="flex gap-8">
              {[['18', '추적 역량'], ['61K+', '월 분석 공고'], ['4', '권한 체계']].map(([v, k]) => <div key={k}><dt className="num text-xl font-bold text-white">{v}</dt><dd>{k}</dd></div>)}
            </dl>
            <span>Photo · ThisisEngineering / Unsplash</span>
          </div>
        </div>
      </aside>

      <main className="relative flex min-h-screen flex-col">
        <div className="relative h-36 overflow-hidden lg:hidden">
          <img src={photo} alt="" className="absolute inset-0 size-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/90 to-brand-700/60" />
          <div className="relative flex h-full items-center justify-between px-5"><Logo light /><Link to="/" className="text-sm font-semibold text-white/80">둘러보기</Link></div>
        </div>
        <div className="hidden justify-end p-6 lg:flex">
          <Link to="/" className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-muted hover:bg-surface hover:text-ink"><Icon icon={faArrowLeft} className="text-xs" />메인으로</Link>
        </div>
        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center px-5 py-10 lg:py-4"><Outlet /></div>
        <p className="pb-6 text-center text-caption text-muted">© 2026 cognipick. All rights reserved.</p>
      </main>
      <Toasts />
    </div>
  )
}
