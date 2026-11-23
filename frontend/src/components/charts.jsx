import { useMemo, useState } from 'react'

const COLORS = ['#4f46e5', '#0ea5e9', '#84cc16', '#f97316', '#ec4899']

export function RadarChart({ axes, size = 340 }) {
  const c = size / 2, R = size / 2 - 52, n = axes.length
  if (n < 3) return null
  const pt = (i, v) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; return [c + Math.cos(a) * R * (v / 100), c + Math.sin(a) * R * (v / 100)] }
  const poly = (key) => axes.map((a, i) => pt(i, a[key]).join(',')).join(' ')
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-[420px]" role="img" aria-label="역량 레이더 차트">
      {[25, 50, 75, 100].map((l) => <polygon key={l} points={axes.map((_, i) => pt(i, l).join(',')).join(' ')} fill="none" stroke="#e1e4f0" />)}
      {axes.map((_, i) => <line key={i} x1={c} y1={c} x2={pt(i, 100)[0]} y2={pt(i, 100)[1]} stroke="#e1e4f0" />)}
      <polygon points={poly('b')} fill="#c6f432" fillOpacity="0.25" stroke="#8fb800" strokeWidth="2" strokeDasharray="5 4" />
      <polygon points={poly('a')} fill="#4f46e5" fillOpacity="0.28" stroke="#4f46e5" strokeWidth="2.5" />
      {axes.map((a, i) => { const [x, y] = pt(i, a.a); return <circle key={i} cx={x} cy={y} r="4" fill="#4f46e5" stroke="#fff" strokeWidth="2" /> })}
      {axes.map((a, i) => {
        const [x, y] = pt(i, 122)
        return <text key={a.label} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-fg" style={{ fontSize: 11, fontWeight: 600 }}>{a.label}</text>
      })}
    </svg>
  )
}

export function Legend({ items }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-caption text-muted">
      {items.map((i) => <span key={i.label} className="inline-flex items-center gap-1.5"><i className="inline-block size-2.5 rounded-full" style={{ background: i.color }} />{i.label}</span>)}
    </div>
  )
}

export function LineChart({ labels, series, height = 280, area = false, unit = '' }) {
  const [hover, setHover] = useState(null)
  const W = 720, H = height, p = { l: 44, r: 16, t: 16, b: 30 }
  const max = Math.max(1, ...series.flatMap((s) => s.values)) * 1.1
  const x = (i) => p.l + (i * (W - p.l - p.r)) / Math.max(1, labels.length - 1)
  const y = (v) => H - p.b - (v / max) * (H - p.t - p.b)
  const step = Math.ceil(labels.length / 8)
  const onMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    setHover(Math.max(0, Math.min(labels.length - 1, Math.round(((px - p.l) / (W - p.l - p.r)) * (labels.length - 1)))))
  }
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img" aria-label="추세 차트">
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line x1={p.l} x2={W - p.r} y1={y(max * t)} y2={y(max * t)} stroke="#e8eaf4" />
            <text x={p.l - 8} y={y(max * t)} textAnchor="end" dominantBaseline="middle" className="fill-muted" style={{ fontSize: 10 }}>{Math.round(max * t).toLocaleString()}</text>
          </g>
        ))}
        {labels.map((l, i) => i % step === 0 && <text key={l} x={x(i)} y={H - 8} textAnchor="middle" className="fill-muted" style={{ fontSize: 10 }}>{l.slice(-5)}</text>)}
        {series.map((s, k) => {
          const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ')
          const col = s.color || COLORS[k % COLORS.length]
          return (
            <g key={s.name}>
              {area && <path d={`${d} L${x(s.values.length - 1)},${H - p.b} L${x(0)},${H - p.b} Z`} fill={col} opacity="0.12" />}
              <path d={d} fill="none" stroke={col} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
              {hover !== null && <circle cx={x(hover)} cy={y(s.values[hover])} r="4.5" fill={col} stroke="#fff" strokeWidth="2" />}
            </g>
          )
        })}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={p.t} y2={H - p.b} stroke="#9aa3c7" strokeDasharray="3 3" />}
      </svg>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <Legend items={series.map((s, k) => ({ label: s.name, color: s.color || COLORS[k % COLORS.length] }))} />
        <div className="min-h-5 text-caption font-semibold text-fg">
          {hover !== null && `${labels[hover]} · ${series.map((s) => `${s.name} ${s.values[hover].toLocaleString()}${unit}`).join(' / ')}`}
        </div>
      </div>
    </div>
  )
}

export function WordCloud({ words }) {
  const list = useMemo(() => {
    const max = Math.max(...words.map((w) => w.weight), 1), min = Math.min(...words.map((w) => w.weight), 0)
    const mid = []
    ;[...words].sort((a, b) => b.weight - a.weight).forEach((w, i) => (i % 2 ? mid.push(w) : mid.unshift(w)))
    return mid.map((w, i) => ({ ...w, size: 14 + ((w.weight - min) / (max - min || 1)) * 30, rot: i % 7 === 3 ? -4 : i % 5 === 2 ? 3 : 0 }))
  }, [words])
  return (
    <div className="flex min-h-64 flex-wrap items-center justify-center gap-x-4 gap-y-1 p-2" role="img" aria-label="수요 역량 워드클라우드">
      {list.map((w) => (
        <span key={w.text} title={`${w.text} · ${w.weight.toLocaleString()}건 · 3개월 ${w.growth > 0 ? '+' : ''}${w.growth}%`}
          className="cursor-default font-display font-bold leading-tight transition-transform hover:scale-110"
          style={{ fontSize: w.size, transform: `rotate(${w.rot}deg)`, color: w.growth >= 8 ? '#6d8b00' : w.growth < 0 ? '#94a0c8' : w.size > 30 ? '#4338ca' : '#5a5cf0' }}>
          {w.text}
        </span>
      ))}
    </div>
  )
}

/** Gap Bridge: 요구 수준(눈금) 대비 내 점수와 부족 구간(형광 사선)을 한 줄로 */
export function GapBridge({ gaps }) {
  return (
    <ul className="space-y-4">
      {gaps.map((g) => (
        <li key={g.skill}>
          <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-1 text-sm">
            <span className="font-semibold">{g.skill}</span>
            <span className="text-caption text-muted">
              내 점수 <b className="text-fg">{g.score}</b> / 요구 <b className="text-fg">{g.required}</b>
              {g.gap > 0 ? <b className="ml-2 rounded bg-accent px-1.5 py-0.5 text-accent-ink">GAP -{g.gap}</b> : <b className="ml-2 text-ok">충족</b>}
            </span>
          </div>
          <div className="relative h-3.5 rounded-full bg-surface-2">
            <div className="absolute inset-y-0 left-0 rounded-full bg-brand-600 transition-all duration-700" style={{ width: `${Math.min(100, g.score)}%` }} />
            {g.gap > 0 && <div className="absolute inset-y-0 rounded-r-full" style={{ left: `${g.score}%`, width: `${g.gap}%`, background: 'repeating-linear-gradient(135deg,#c6f432 0 5px,#e6fb98 5px 10px)' }} />}
            <div className="absolute -inset-y-1 w-0.5 bg-ink" style={{ left: `${g.required}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export function Sparkline({ values, color = '#4f46e5', w = 120, h = 36 }) {
  const max = Math.max(...values), min = Math.min(...values)
  const pts = values.map((v, i) => `${(i * w) / (values.length - 1)},${h - 3 - ((v - min) / (max - min || 1)) * (h - 6)}`).join(' ')
  return <svg viewBox={`0 0 ${w} ${h}`} className="h-9 w-28"><polyline points={pts} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" /></svg>
}

export function Donut({ value, size = 96, label }) {
  const r = 38, c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`${label} ${value}%`}>
      <circle cx="50" cy="50" r={r} fill="none" stroke="#e8eaf4" strokeWidth="11" />
      <circle cx="50" cy="50" r={r} fill="none" stroke="#4f46e5" strokeWidth="11" strokeLinecap="round" strokeDasharray={`${(c * value) / 100} ${c}`} transform="rotate(-90 50 50)" />
      <text x="50" y="54" textAnchor="middle" className="fill-fg" style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{Math.round(value)}</text>
    </svg>
  )
}
