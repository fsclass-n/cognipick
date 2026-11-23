/** 고해상도 벡터 커버: 역량 카테고리별 제너레이티브 아트 (외부 이미지 없이 선명하게 렌더링) */
const THEMES = {
  데이터: { bg: '#3a35e0', fg: '#ffffff', pt: '#ff6b4a' },
  AI: { bg: '#111114', fg: '#c2c7ff', pt: '#ff6b4a' },
  프로그래밍: { bg: '#dfe2ff', fg: '#2e29b8', pt: '#ff6b4a' },
  백엔드: { bg: '#1c1b63', fg: '#9aa1ff', pt: '#ff6b4a' },
  프런트엔드: { bg: '#ffe8e1', fg: '#111114', pt: '#3a35e0' },
  인프라: { bg: '#26262d', fg: '#efede7', pt: '#ff6b4a' },
  협업: { bg: '#efede7', fg: '#111114', pt: '#3a35e0' },
  기타: { bg: '#4b4ef7', fg: '#ffffff', pt: '#ff6b4a' },
}

const rnd = (seed) => { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280) }

function Art({ cat, t, seed }) {
  const r = rnd(seed)
  if (cat === '데이터') return <g>{Array.from({ length: 7 }, (_, i) => { const h = 40 + i * 18 + r() * 40; return <rect key={i} x={150 + i * 34} y={230 - h} width="22" height={h} rx="4" fill={i === 5 ? t.pt : t.fg} opacity={i === 5 ? 1 : 0.18 + i * 0.1} /> })}</g>
  if (cat === 'AI') {
    const nodes = Array.from({ length: 11 }, () => [170 + r() * 210, 30 + r() * 200])
    return <g>{nodes.map((a, i) => nodes.slice(i + 1, i + 4).map((b, k) => <line key={`${i}-${k}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={t.fg} strokeOpacity=".35" />))}{nodes.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 4 ? 5 : 9} fill={i % 4 ? t.fg : t.pt} />)}</g>
  }
  if (cat === '프로그래밍') return <g fontFamily="Space Grotesk Variable, monospace" fontWeight="700"><text x="180" y="200" fontSize="190" fill={t.fg} opacity=".9">{'{'}</text><text x="290" y="200" fontSize="190" fill={t.pt}>{'}'}</text></g>
  if (cat === '백엔드') return <g>{[0, 1, 2, 3].map((i) => <g key={i}><rect x="190" y={40 + i * 48} width="180" height="38" rx="8" fill="none" stroke={t.fg} strokeWidth="2" /><circle cx="212" cy={59 + i * 48} r="5" fill={i === 1 ? t.pt : t.fg} /><rect x="232" y={56 + i * 48} width={60 + r() * 60} height="6" rx="3" fill={t.fg} opacity=".4" /></g>)}</g>
  if (cat === '프런트엔드') return <g>{[0, 1].map((i) => <g key={i} transform={`translate(${170 + i * 50} ${40 + i * 40})`}><rect width="180" height="130" rx="12" fill="#fff" stroke={t.fg} strokeWidth="2" /><circle cx="16" cy="16" r="4" fill={t.pt} /><circle cx="30" cy="16" r="4" fill={t.fg} opacity=".3" /><rect x="14" y="36" width="90" height="10" rx="5" fill={t.fg} opacity=".8" /><rect x="14" y="56" width="150" height="56" rx="8" fill={t.pt} opacity={i ? 0.9 : 0.15} /></g>)}</g>
  if (cat === '인프라') return <g>{[[250, 60], [210, 110], [290, 110], [250, 160]].map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}><path d="M0 0 L40 -20 L80 0 L40 20 Z" fill={i === 3 ? t.pt : t.fg} opacity={i === 3 ? 1 : 0.9} /><path d="M0 0 L40 20 L40 60 L0 40 Z" fill={t.fg} opacity=".45" /><path d="M80 0 L40 20 L40 60 L80 40 Z" fill={t.fg} opacity=".25" /></g>)}</g>
  return <g>{[0, 1, 2].map((i) => <circle key={i} cx={220 + i * 55} cy={130 + (i % 2) * 20} r="62" fill={i === 1 ? t.pt : 'none'} stroke={t.fg} strokeWidth="2" opacity={i === 1 ? 0.9 : 1} />)}</g>
}

export default function Cover({ category = '기타', seed = 1, label, no, className = 'aspect-[4/3]' }) {
  const t = THEMES[category] || THEMES.기타
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: t.bg }} aria-hidden>
      <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full"><Art cat={category} t={t} seed={seed} /></svg>
      {(label || no) && (
        <div className="absolute inset-x-4 top-3 flex justify-between text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: t.fg }}>
          <span>{label}</span>{no && <span className="num opacity-70">No.{String(no).padStart(2, '0')}</span>}
        </div>
      )}
    </div>
  )
}
