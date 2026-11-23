import { useMemo } from 'react'

const FALLBACK = ['Python', 'SQL', 'LLM/프롬프트', 'Docker', 'React', 'MLOps', 'AWS', '통계', '머신러닝'].map((skill, i) => ({ skill, share: 12 - i, growth: i === 2 ? 40 : i === 5 ? 18 : 3 }))

/** 히어로 비주얼: 기업 수요 상위 역량이 '나(YOU)' 주위를 공전한다. 노드 크기=수요 비중, 형광=급상승 */
export default function SkillOrbit({ skills }) {
  const nodes = useMemo(() => {
    const list = (skills?.length ? skills : FALLBACK).slice(0, 9)
    return list.map((s, i) => {
      const ring = i < 3 ? 0 : i < 6 ? 1 : 2
      const per = [3, 3, 3][ring]
      const idx = i - ring * 3
      return { ...s, ring, angle: (360 / per) * idx + ring * 40, r: 16 + Math.min(14, (s.share || 4) * 1.1) }
    })
  }, [skills])
  const radii = [105, 168, 228]
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]" aria-hidden>
      <div className="absolute inset-[6%] rounded-full bg-brand-600/30 blur-3xl" />
      {radii.map((r) => (
        <div key={r} className="absolute left-1/2 top-1/2 rounded-full border border-dashed border-white/20"
          style={{ width: `${(r * 2) / 5.2}%`, height: `${(r * 2) / 5.2}%`, translate: '-50% -50%' }} />
      ))}
      {radii.map((r, k) => (
        <div key={`o${r}`} className={`absolute inset-0 ${k % 2 ? 'animate-orbit-rev' : 'animate-orbit'}`} style={{ animationDuration: `${34 + k * 14}s` }}>
          {nodes.filter((n) => n.ring === k).map((n) => {
            const a = (n.angle * Math.PI) / 180
            const x = 50 + (Math.sin(a) * r) / 5.2, y = 50 - (Math.cos(a) * r) / 5.2
            const hot = n.growth >= 8
            return (
              <div key={n.skill} className="absolute" style={{ left: `${x}%`, top: `${y}%`, translate: '-50% -50%' }}>
                <div className={k % 2 ? 'animate-orbit' : 'animate-orbit-rev'} style={{ animationDuration: `${34 + k * 14}s` }}>
                  <div className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold backdrop-blur ${hot ? 'border-accent bg-accent text-accent-ink shadow-[0_0_24px_rgb(198_244_50/0.55)]' : 'border-white/25 bg-white/10 text-white'}`}
                    style={{ fontSize: Math.max(11, Math.min(15, n.r * 0.5)) }}>
                    {n.skill}{hot && <span className="ml-1">▲</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ))}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-accent/60" />
        <div className="relative grid size-24 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-800 font-display text-lg font-bold text-white shadow-pop ring-4 ring-white/15">YOU</div>
      </div>
    </div>
  )
}
