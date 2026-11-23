import { Link } from 'react-router-dom'
import { faClock, faStar, faUserGroup } from '@fortawesome/free-solid-svg-icons'
import { Icon } from './ui'
import { levelColor } from '../lib/site'

export function Thumb({ hue, label, className = 'h-36' }) {
  const a = `hsl(${hue} 78% 46%)`, b = `hsl(${(hue + 48) % 360} 82% 28%)`
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: `linear-gradient(135deg, ${a}, ${b})` }} aria-hidden>
      <svg className="absolute inset-0 size-full opacity-30" viewBox="0 0 200 140" preserveAspectRatio="xMidYMid slice">
        {[24, 48, 72, 96].map((r) => <circle key={r} cx="160" cy="30" r={r} fill="none" stroke="#fff" strokeWidth="1" />)}
        {Array.from({ length: 8 }, (_, i) => <line key={i} x1={i * 28} y1="0" x2={i * 28 - 60} y2="140" stroke="#fff" strokeWidth="0.6" />)}
      </svg>
      <span className="absolute bottom-2 left-3 font-display text-3xl font-bold text-white/90 drop-shadow">{label}</span>
      <span className="absolute right-3 top-3 size-2.5 rounded-full bg-accent shadow-[0_0_0_4px_rgb(198_244_50/0.25)]" />
    </div>
  )
}

export default function CourseCard({ c, highlight }) {
  return (
    <Link to={`/courses/${c.id}`} className="card group flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-pop">
      <Thumb hue={c.hue} label={c.skills[0]} />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-caption font-bold ${levelColor[c.level]}`}>{c.level}</span>
          {highlight && <span className="rounded-full bg-accent px-2 py-0.5 text-caption font-bold text-accent-ink">{highlight}</span>}
        </div>
        <h3 className="text-h4 line-clamp-2 min-h-12 font-bold group-hover:text-brand-700">{c.title}</h3>
        <p className="text-caption text-muted">{c.instructor} 강사</p>
        <div className="flex flex-wrap gap-1.5">{c.skills.slice(0, 3).map((s) => <span key={s} className="chip">{s}</span>)}</div>
        <div className="mt-auto flex items-center gap-3 border-t border-line pt-3 text-caption text-muted">
          <span><Icon icon={faClock} className="mr-1" />{c.hours}시간</span>
          <span><Icon icon={faStar} className="mr-1 text-amber-500" />{c.rating}</span>
          <span><Icon icon={faUserGroup} className="mr-1" />{c.learners.toLocaleString()}</span>
        </div>
        {c.progress != null && (
          <div>
            <div className="mb-1 flex justify-between text-caption font-semibold"><span>진도율</span><span className="text-brand-700">{c.progress}%</span></div>
            <div className="h-1.5 rounded-full bg-surface-2"><div className="h-full rounded-full bg-brand-600" style={{ width: `${c.progress}%` }} /></div>
          </div>
        )}
      </div>
    </Link>
  )
}
