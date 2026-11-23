import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { faArrowUp, faRobot } from '@fortawesome/free-solid-svg-icons'
import { Icon } from './ui'

/** 우측 하단: 스크롤 진행률 링이 있는 원형 To the Top + 그 위에 AI 튜터 버튼 (모바일은 하단 탭바 위로) */
export default function Floaters() {
  const [p, setP] = useState(0)
  const [y, setY] = useState(0)
  const { pathname } = useLocation()
  useEffect(() => {
    const on = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      setY(window.scrollY); setP(max > 0 ? Math.min(1, window.scrollY / max) : 0)
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on) }
  }, [])
  const show = y > 300, C = 2 * Math.PI * 22
  return (
    <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3 sm:right-6 lg:bottom-6">
      {pathname !== '/tutor' && (
        <Link to="/tutor" aria-label="AI 튜터에게 질문하기" className="group flex h-12 items-center gap-2 rounded-full bg-brand-600 pl-4 pr-4 text-sm font-semibold text-white shadow-lift transition hover:bg-brand-700">
          <Icon icon={faRobot} /><span className="hidden sm:inline">AI 튜터</span>
          <span className="size-2 rounded-full bg-accent" />
        </Link>
      )}
      <button aria-label="최상단으로 이동" title="To the Top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`relative grid size-12 place-items-center rounded-full bg-surface text-ink shadow-lift transition-all duration-300 hover:bg-ink hover:text-white ${show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'}`}>
        <svg viewBox="0 0 48 48" className="absolute inset-0 -rotate-90" aria-hidden>
          <circle cx="24" cy="24" r="22" fill="none" stroke="#e4e2db" strokeWidth="2" />
          <circle cx="24" cy="24" r="22" fill="none" stroke="#20d6a5" strokeWidth="2.5" strokeLinecap="round" strokeDasharray={`${C * p} ${C}`} />
        </svg>
        <Icon icon={faArrowUp} className="relative" />
      </button>
    </div>
  )
}
