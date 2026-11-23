import { Link, Outlet } from 'react-router-dom'
import { Toasts } from '../components/ui'
import { Logo } from '../components/Header'
import Cover from '../components/Cover'

const TILES = [
  ['데이터', '01', '기업 수요 분석', '채용공고·공공 데이터로 뜨는 역량을 읽습니다', 'col-span-2'],
  ['AI', '02', 'AI 역량 진단', '레이더 차트로 보는 내 위치', ''],
  ['프런트엔드', '03', '맞춤 학습 Pick', '갭을 메우는 로드맵', ''],
]

export default function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col bg-surface-2 p-10 lg:flex">
        <Logo />
        <div className="my-auto">
          <p className="text-eyebrow text-brand-700">AI Learning Platform</p>
          <h2 className="text-display mt-4 max-w-lg !text-[3.25rem]">Learn what<br />companies <span className="underline-accent">need.</span></h2>
          <p className="mt-4 max-w-md text-body text-muted">기업이 원하는 역량을 데이터로 읽고, 내 역량과 비교해 가장 빠른 학습 경로를 골라드립니다.</p>
          <div className="mt-10 grid max-w-lg grid-cols-2 gap-3">
            {TILES.map(([cat, no, t, d, span]) => (
              <div key={t} className={`overflow-hidden rounded-3xl bg-surface ${span}`}>
                <Cover category={cat} seed={+no} label={no} className={span ? 'h-32' : 'h-24'} />
                <div className="p-4"><p className="font-display font-bold">{t}</p><p className="text-caption text-muted">{d}</p></div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-caption text-muted">© 2026 cognipick. All rights reserved.</p>
      </aside>
      <main className="flex flex-col bg-bg">
        <div className="flex items-center justify-between p-5"><span className="lg:invisible"><Logo /></span><Link to="/" className="text-sm font-semibold text-muted hover:text-ink">← 둘러보기</Link></div>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-10"><Outlet /></div>
      </main>
      <Toasts />
    </div>
  )
}
