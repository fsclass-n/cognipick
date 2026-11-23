import { Link } from 'react-router-dom'
import { faArrowRight, faArrowTrendUp, faBullseye, faChartLine, faRoute, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons'
import { Async, CardSkeleton, Icon, SectionHead, Skeleton } from '../components/ui'
import CourseCard from '../components/CourseCard'
import SkillOrbit from '../components/SkillOrbit'
import { useApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const ROADMAPS = [
  { job: '데이터 분석가', hue: 215, steps: ['SQL', 'Python', '데이터 시각화', '통계'], desc: '데이터로 의사결정을 이끄는 첫 직무' },
  { job: 'AI/ML 엔지니어', hue: 275, steps: ['Python', '머신러닝', '딥러닝', 'LLM/프롬프트'], desc: '모델을 만들고 서비스로 연결합니다' },
  { job: '클라우드/DevOps', hue: 195, steps: ['Docker', 'AWS', 'CI/CD', 'Kubernetes'], desc: '배포와 운영을 자동화하는 전문가' },
]

function Pulse({ skills }) {
  if (!skills?.length) return <div className="h-12 bg-ink-2" />
  const items = [...skills, ...skills]
  return (
    <div className="overflow-hidden border-y border-white/10 bg-ink-2 py-3 text-white" aria-label="실시간 수요 급상승 역량">
      <div className="flex w-max animate-marquee gap-10 whitespace-nowrap hover:[animation-play-state:paused]">
        {items.map((s, i) => (
          <span key={i} className="flex items-center gap-2 text-sm">
            <span className="size-1.5 rounded-full bg-accent" /><b>{s.skill}</b>
            <span className={s.growth >= 0 ? 'text-accent' : 'text-rose-300'}>{s.growth >= 0 ? '▲' : '▼'} {Math.abs(s.growth)}%</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function Main() {
  const { user } = useAuth()
  const demand = useApi('/api/demand/overview')
  const courses = useApi('/api/courses?sort=popular')
  const reco = useApi('/api/recommend', !!user)
  const top = demand.data?.top_skills
  const picks = user && reco.data?.picks?.length ? reco.data.picks.slice(0, 4) : null

  return (
    <>
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="grid-dots absolute inset-0" />
        <div className="absolute -left-40 -top-40 size-[34rem] rounded-full bg-brand-600/40 blur-3xl" />
        <div className="container-x relative grid items-center gap-10 py-14 lg:grid-cols-[1.1fr_1fr] lg:py-20">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-caption font-bold backdrop-blur"><span className="size-1.5 animate-pulse rounded-full bg-accent" />기업 수요 데이터 × AI 학습 추천</span>
            <h1 className="text-display mt-5">기업이 찾는 역량을<br /><span className="rounded-lg bg-accent px-2 text-accent-ink">Pick</span> 해서 배우세요</h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/70">채용공고·공공 고용 데이터·K-AI 데이터셋을 AI가 분석하고, 내 역량 진단 결과와 맞붙여 가장 빠르게 갭을 메우는 학습 경로를 설계합니다.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/diagnosis" className="btn btn-accent !px-6 !py-3 text-base"><Icon icon={faWandMagicSparkles} />무료 역량 진단</Link>
              <Link to="/demand" className="btn !px-6 !py-3 text-base text-white ring-1 ring-white/30 hover:bg-white/10">수요 분석 보기<Icon icon={faArrowRight} /></Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-white/10 pt-6">
              {[['월 분석 공고', demand.data ? `${(demand.data.kpis.postings / 1000).toFixed(1)}K` : '—'], ['추적 역량', demand.data ? demand.data.kpis.skills : '—'], ['급상승 1위', demand.data?.kpis.top_rising || '—']].map(([k, v]) => (
                <div key={k}><dt className="text-caption text-white/50">{k}</dt><dd className="font-display text-xl font-bold">{v}</dd></div>
              ))}
            </dl>
          </div>
          <SkillOrbit skills={top} />
        </div>
        <Pulse skills={top?.slice().sort((a, b) => b.growth - a.growth).slice(0, 12)} />
      </section>

      <section className="container-x pt-16">
        <SectionHead eyebrow="Demand Top" title="지금 기업이 가장 많이 찾는 역량" desc="전 직무·산업·지역 기준 최근 12개월 채용 요건 분석 결과입니다."
          right={<Link to="/demand" className="btn btn-ghost">전체 분석<Icon icon={faArrowRight} /></Link>} />
        <Async state={demand} skeleton={<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-28" />)}</div>}>
          {(d) => (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {d.top_skills.slice(0, 8).map((s, i) => (
                <Link to={`/courses?skill=${encodeURIComponent(s.skill)}`} key={s.skill} className="card group relative overflow-hidden p-5 transition hover:-translate-y-1 hover:shadow-pop">
                  <span className="absolute -right-2 -top-4 font-display text-7xl font-bold text-surface-2 transition group-hover:text-brand-100">{i + 1}</span>
                  <p className="relative text-caption font-semibold text-muted">{s.category}</p>
                  <h3 className="text-h3 relative mt-1">{s.skill}</h3>
                  <div className="relative mt-4 flex items-center justify-between text-sm">
                    <span className="font-semibold">{s.share}%</span>
                    <span className={`inline-flex items-center gap-1 font-bold ${s.growth >= 5 ? 'text-lime-700' : 'text-muted'}`}><Icon icon={faArrowTrendUp} className="text-xs" />{s.growth > 0 ? '+' : ''}{s.growth}%</span>
                  </div>
                  <div className="relative mt-2 h-1.5 rounded-full bg-surface-2"><div className="h-full rounded-full bg-brand-600" style={{ width: `${Math.min(100, s.share * 7)}%` }} /></div>
                </Link>
              ))}
            </div>
          )}
        </Async>
      </section>

      <section className="container-x pt-20">
        <SectionHead eyebrow={picks ? 'Picked for you' : 'Popular'} title={picks ? `${user.name}님을 위한 맞춤 추천 강의` : '맞춤 추천 강의'}
          desc={picks ? '진단 결과와 기업 수요의 갭을 가장 크게 줄이는 순서입니다.' : '로그인 후 역량 진단을 마치면 나만의 추천이 표시됩니다. 지금은 인기 강의를 보여드려요.'}
          right={<Link to={user ? '/pick' : '/diagnosis'} className="btn btn-primary"><Icon icon={faBullseye} />{user ? '내 학습 Pick' : '진단하고 추천받기'}</Link>} />
        <Async state={courses} skeleton={<CardSkeleton />} isEmpty={(d) => !d.length}>
          {(list) => (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {(picks || list.slice(0, 4)).map((c) => <CourseCard key={c.id} c={c} highlight={c.match ? `매칭 ${c.match}%` : undefined} />)}
            </div>
          )}
        </Async>
      </section>

      <section className="container-x pt-20">
        <SectionHead eyebrow="Roadmap" title="인기 학습 로드맵" desc="직무별로 기업이 요구하는 역량 순서를 따라 설계한 대표 경로입니다." />
        <div className="grid gap-5 md:grid-cols-3">
          {ROADMAPS.map((r) => (
            <Link key={r.job} to={`/diagnosis?job=${encodeURIComponent(r.job)}`} className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-pop">
              <div className="p-6 text-white" style={{ background: `linear-gradient(135deg, hsl(${r.hue} 70% 42%), hsl(${r.hue + 40} 75% 26%))` }}>
                <Icon icon={faRoute} className="text-xl text-accent" />
                <h3 className="text-h2 mt-3">{r.job}</h3>
                <p className="mt-1 text-sm text-white/75">{r.desc}</p>
              </div>
              <ol className="relative space-y-3 p-6">
                <span className="absolute bottom-9 left-[2.15rem] top-9 w-px bg-brand-200" />
                {r.steps.map((s, i) => (
                  <li key={s} className="relative flex items-center gap-3 text-sm font-semibold">
                    <span className="relative z-10 grid size-6 place-items-center rounded-full bg-brand-600 text-caption font-bold text-white">{i + 1}</span>{s}
                  </li>
                ))}
              </ol>
            </Link>
          ))}
        </div>
      </section>

      <section className="container-x pt-20">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-8 text-white sm:p-12">
          <div className="grid-dots absolute inset-0 opacity-50" />
          <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <p className="text-caption font-bold uppercase tracking-widest text-accent">For Business</p>
              <h2 className="text-h1 mt-2">채용 요건을 입력하면, AI가 학습 과정으로 구조화합니다</h2>
              <p className="mt-3 max-w-2xl text-white/70">기업 담당자는 필요 직무와 역량 요건을 등록하세요. 필수·우대 역량이 자동 분류되어 학습 과정 설계에 반영됩니다.</p>
            </div>
            <Link to="/demand#register" className="btn btn-accent !px-6 !py-3"><Icon icon={faChartLine} />수요 등록하기</Link>
          </div>
        </div>
      </section>
    </>
  )
}
