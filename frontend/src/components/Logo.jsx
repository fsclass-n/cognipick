import { Link } from 'react-router-dom'

/**
 * cognipick 로고
 * - 실루엣: 기타 피크(Pick) — "골라낸다"는 브랜드 의미
 * - 내부: 열린 고리 c (Cognition: 진단 → 분석 → 학습의 순환)
 * - 민트 점: 고리가 열린 자리에서 '골라낸 역량(시그널)'
 */
export function LogoMark({ size = 34, mono = false, className = '' }) {
  const id = `lg${size}${mono ? 'm' : ''}`
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={className} aria-hidden>
      <defs>
        <linearGradient id={id} x1="4" y1="1" x2="26" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6d5bff" /><stop offset=".55" stopColor="#4a3aff" /><stop offset="1" stopColor="#2e22a8" />
        </linearGradient>
      </defs>
      <path d="M16 31.4C11.9 28.9 1.3 18 .7 10 .1 3.6 7 .4 16 .4s15.9 3.2 15.3 9.6C30.7 18 20.1 28.9 16 31.4Z" fill={mono ? '#fff' : `url(#${id})`} />
      <path d="M20.6 8.6A6 6 0 1 0 20.6 16.4" fill="none" stroke={mono ? '#4a3aff' : '#fff'} strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="23.6" cy="12.5" r="2.3" fill="#20d6a5" />
    </svg>
  )
}

export default function Logo({ light = false, size = 34, to = '/' }) {
  return (
    <Link to={to} className="group inline-flex items-center gap-2.5" aria-label="cognipick 홈">
      <LogoMark size={size} mono={light} className="transition-transform duration-300 group-hover:-rotate-12" />
      <span className={`font-display text-[1.32rem] font-bold leading-none tracking-[-0.05em] ${light ? 'text-white' : 'text-ink'}`}>
        cogni<span className={light ? 'text-accent' : 'text-brand-600'}>pick</span>
      </span>
    </Link>
  )
}
