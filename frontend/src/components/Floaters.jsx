import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { faArrowUp, faRobot } from '@fortawesome/free-solid-svg-icons'
import { Icon } from './ui'

/** 우측 하단 플로팅: To the Top(최하단) 위에 AI 튜터 버튼을 쌓아 서로 겹치지 않게 배치 */
export default function Floaters() {
  const [show, setShow] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => {
    const on = () => setShow(window.scrollY > 300)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])
  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-center gap-3 sm:bottom-6 sm:right-6">
      {pathname !== '/tutor' && (
        <Link to="/tutor" aria-label="AI 튜터에게 질문하기" title="AI 튜터" className="group relative grid size-14 place-items-center rounded-full bg-brand-600 text-white shadow-pop transition hover:scale-105 hover:bg-brand-700">
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-500/50" />
          <Icon icon={faRobot} className="relative text-xl" />
        </Link>
      )}
      <button aria-label="최상단으로 이동" title="To the Top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className={`grid size-12 place-items-center rounded-full border border-line bg-white text-ink shadow-card transition-all duration-300 hover:bg-accent ${show ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}>
        <Icon icon={faArrowUp} />
      </button>
    </div>
  )
}
