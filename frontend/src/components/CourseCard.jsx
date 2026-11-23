import { Link } from 'react-router-dom'
import { faStar } from '@fortawesome/free-solid-svg-icons'
import { Icon } from './ui'
import { coursePhoto } from '../lib/photos'

const LEVELS = { 입문: 1, 중급: 2, 심화: 3 }

/** 고해상도 사진 커버 (Unsplash, 셀프 호스팅) + 브랜드 듀오톤 */
export function PhotoCover({ c, className = 'aspect-[4/3]', label = true, children }) {
  return (
    <div className={`duotone relative overflow-hidden bg-ink-2 ${className}`}>
      <img src={coursePhoto(c.category, c.id)} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.06]" />
      {label && (
        <div className="absolute inset-x-3 top-3 z-10 flex items-center justify-between">
          <span className="glass rounded-full px-2.5 py-1 text-[11px] font-semibold text-white">{c.category}</span>
          <span className="num text-[11px] font-semibold text-white/80">No.{String(c.id).padStart(2, '0')}</span>
        </div>
      )}
      {children}
    </div>
  )
}

export function LevelDots({ level }) {
  const n = LEVELS[level] || 1
  return (
    <span className="inline-flex items-center gap-1.5 text-caption font-semibold" title={`난이도 ${level}`}>
      <span className="flex gap-0.5">{[1, 2, 3].map((i) => <i key={i} className={`h-2.5 w-1.5 rounded-full ${i <= n ? 'bg-brand-600' : 'bg-line'}`} />)}</span>{level}
    </span>
  )
}

export function ProgressRing({ value, size = 44 }) {
  const r = 18, c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 44 44" width={size} height={size} aria-label={`진도율 ${value}%`}>
      <circle cx="22" cy="22" r={r} fill="#fff" stroke="#eceefa" strokeWidth="4" />
      <circle cx="22" cy="22" r={r} fill="none" stroke={value >= 100 ? '#0f9b6e' : '#4a3aff'} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(c * value) / 100} ${c}`} transform="rotate(-90 22 22)" />
      <text x="22" y="26" textAnchor="middle" style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{value}</text>
    </svg>
  )
}

export default function CourseCard({ c, badge, note }) {
  return (
    <Link to={`/courses/${c.id}`} className="group flex flex-col">
      <PhotoCover c={c} className="aspect-[4/3] rounded-2xl shadow-card">
        {badge && <span className="absolute bottom-3 left-3 z-10 rounded-full bg-accent px-2.5 py-1 text-caption font-bold text-ink shadow-sm">{badge}</span>}
        {c.progress != null && <span className="absolute bottom-3 right-3 z-10"><ProgressRing value={c.progress} /></span>}
      </PhotoCover>
      <div className="flex flex-1 flex-col pt-4">
        <div className="flex items-center justify-between text-muted"><LevelDots level={c.level} /><span className="num text-caption">{c.hours}h</span></div>
        <h3 className="text-h4 mt-2 line-clamp-2 transition group-hover:text-brand-700">{c.title}</h3>
        <p className="mt-1 text-caption text-muted">{c.instructor}</p>
        <p className="mt-2 flex flex-wrap gap-x-2 text-caption font-semibold text-brand-700">{c.skills.slice(0, 3).map((s) => <span key={s}>#{s}</span>)}</p>
        <p className="mt-2 flex items-center gap-2 text-caption text-muted"><Icon icon={faStar} className="text-amber-400" /><b className="num text-fg">{c.rating}</b>· 수강 {c.learners.toLocaleString()}명</p>
        {c.progress != null && <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-brand-600" style={{ width: `${c.progress}%` }} /></div>}
        {note && <p className="mt-2 rounded-lg bg-accent-soft px-2.5 py-1.5 text-caption font-medium text-accent-ink">{note}</p>}
      </div>
    </Link>
  )
}
