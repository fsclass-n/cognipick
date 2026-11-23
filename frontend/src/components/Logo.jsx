import { Link } from 'react-router-dom'

/**
 * cognipick 로고
 * - 바탕: 둥근 사각형(앱 아이콘형) — 플랫폼·제품 아이덴티티
 * - 열린 고리 c: Cognition (진단 → 분석 → 학습의 순환)
 * - 민트 점: 고리가 열린 자리에서 '골라낸(Pick) 역량'
 */
export function LogoMark({ size = 34, light = false, className = '' }) {
  const id = `lg${size}${light ? 'l' : ''}`
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6d5bff" /><stop offset=".6" stopColor="#4a3aff" /><stop offset="1" stopColor="#2e22a8" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9.5" fill={light ? '#fff' : `url(#${id})`} />
      <path d="M20.9 10.6A7 7 0 1 0 20.9 21.4" fill="none" stroke={light ? '#4a3aff' : '#fff'} strokeWidth="3" strokeLinecap="round" />
      <circle cx="23.6" cy="16" r="2.5" fill="#20d6a5" />
    </svg>
  )
}

/** 배경 장식용 라인 마크 (채움 없이 고리 + 점만) */
export function RingMark({ size = 480, className = '' }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <path d="M20.9 10.6A7 7 0 1 0 20.9 21.4" fill="none" stroke="currentColor" strokeWidth=".6" strokeLinecap="round" />
      <circle cx="23.6" cy="16" r="1.1" fill="none" stroke="currentColor" strokeWidth=".5" />
    </svg>
  )
}

export default function Logo({ light = false, size = 34, to = '/' }) {
  return (
    <Link to={to} className="group inline-flex items-center gap-2.5" aria-label="cognipick 홈">
      <LogoMark size={size} light={light} className="transition-transform duration-300 group-hover:scale-105" />
      <span className={`font-display text-[1.32rem] font-bold leading-none tracking-[-0.05em] ${light ? 'text-white' : 'text-ink'}`}>
        cogni<span className={light ? 'text-accent' : 'text-brand-600'}>pick</span>
      </span>
    </Link>
  )
}
