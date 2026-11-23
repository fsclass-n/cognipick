import { Link } from 'react-router-dom'
import { faStar } from '@fortawesome/free-solid-svg-icons'
import { Icon } from './ui'
import Cover from './Cover'

const LEVELS = { 입문: 1, 중급: 2, 심화: 3 }

export function LevelDots({ level }) {
  const n = LEVELS[level] || 1
  return (
    <span className="inline-flex items-center gap-1.5 text-caption font-semibold" title={`난이도 ${level}`}>
      <span className="flex gap-0.5">{[1, 2, 3].map((i) => <i key={i} className={`h-2.5 w-1.5 rounded-full ${i <= n ? 'bg-ink' : 'bg-line'}`} />)}</span>{level}
    </span>
  )
}

export function ProgressRing({ value, size = 44 }) {
  const r = 18, c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 44 44" width={size} height={size} aria-label={`진도율 ${value}%`}>
      <circle cx="22" cy="22" r={r} fill="#fff" stroke="#efede7" strokeWidth="4" />
      <circle cx="22" cy="22" r={r} fill="none" stroke={value >= 100 ? '#15935f' : '#3a35e0'} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(c * value) / 100} ${c}`} transform="rotate(-90 22 22)" />
      <text x="22" y="26" textAnchor="middle" style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{value}</text>
    </svg>
  )
}

export default function CourseCard({ c, badge, note }) {
  return (
    <Link to={`/courses/${c.id}`} className="group flex flex-col">
      <div className="relative overflow-hidden rounded-2xl">
        <div className="transition-transform duration-500 group-hover:scale-[1.04]"><Cover category={c.category} seed={c.id} label={c.category} no={c.id} /></div>
        {badge && <span className="absolute bottom-3 left-3 rounded-full bg-white px-2.5 py-1 text-caption font-bold text-ink shadow-sm">{badge}</span>}
        {c.progress != null && <span className="absolute bottom-3 right-3"><ProgressRing value={c.progress} /></span>}
      </div>
      <div className="flex flex-1 flex-col pt-4">
        <div className="flex items-center justify-between text-muted"><LevelDots level={c.level} /><span className="num text-caption">{c.hours}h</span></div>
        <h3 className="text-h4 mt-2 line-clamp-2 transition group-hover:text-brand-700">{c.title}</h3>
        <p className="mt-1 text-caption text-muted">{c.instructor}</p>
        <p className="mt-2 flex flex-wrap gap-x-2 text-caption font-semibold text-brand-700">{c.skills.slice(0, 3).map((s) => <span key={s}>#{s}</span>)}</p>
        <p className="mt-2 flex items-center gap-2 text-caption text-muted"><Icon icon={faStar} className="text-accent" /><b className="num text-fg">{c.rating}</b>· 수강 {c.learners.toLocaleString()}명</p>
        {c.progress != null && <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-2"><div className="h-full bg-brand-600" style={{ width: `${c.progress}%` }} /></div>}
        {note && <p className="mt-2 text-caption font-medium text-accent-ink">{note}</p>}
      </div>
    </Link>
  )
}
