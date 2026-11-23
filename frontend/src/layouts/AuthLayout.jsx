import { Link, Outlet } from 'react-router-dom'
import { faChartLine, faCompassDrafting, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons'
import { Icon, Toasts } from '../components/ui'
import { Logo } from '../components/Header'
import SkillOrbit from '../components/SkillOrbit'

const POINTS = [
  [faChartLine, '기업 수요 분석', '채용공고·공공 데이터로 뜨는 역량을 읽습니다'],
  [faWandMagicSparkles, 'AI 역량 진단', '문항 생성부터 레이더 차트 해석까지'],
  [faCompassDrafting, '맞춤 학습 Pick', '갭을 메우는 로드맵과 강의를 골라드립니다'],
]

export default function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-ink p-12 text-white lg:flex lg:flex-col">
        <div className="grid-dots absolute inset-0" />
        <div className="absolute -left-32 top-1/3 size-96 rounded-full bg-brand-600/40 blur-3xl" />
        <div className="relative"><Logo light /></div>
        <div className="relative my-auto">
          <h2 className="text-h1 max-w-md">기업이 원하는 역량,<br />내게 맞는 학습을 <span className="rounded bg-accent px-1.5 text-accent-ink">Pick</span></h2>
          <div className="mt-4 scale-90"><SkillOrbit /></div>
          <ul className="mt-2 space-y-3">
            {POINTS.map(([ic, t, d]) => (
              <li key={t} className="flex items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-accent"><Icon icon={ic} /></span><span className="text-sm"><b className="block">{t}</b><span className="text-white/60">{d}</span></span></li>
            ))}
          </ul>
        </div>
        <p className="relative text-caption text-white/40">© 2026 cognipick. All rights reserved.</p>
      </aside>
      <main className="flex flex-col bg-bg">
        <div className="flex items-center justify-between p-5 lg:hidden"><Logo /><Link to="/" className="text-sm font-semibold text-muted">둘러보기</Link></div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-8"><Outlet /></div>
      </main>
      <Toasts />
    </div>
  )
}
