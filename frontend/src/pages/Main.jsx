import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { faArrowRight, faArrowTrendUp, faMagnifyingGlass, faWandMagicSparkles, faBuilding, faFlagCheckered, faDatabase, faBrain, faBullseye } from '@fortawesome/free-solid-svg-icons'
import { Async, CardSkeleton, Icon, SectionHead, Skeleton } from '../components/ui'
import CourseCard from '../components/CourseCard'
import { LogoMark } from '../components/Logo'
import { Donut, WordCloud } from '../components/charts'
import { useApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { PHOTOS } from '../lib/photos'

const LINES = [
  { job: '데이터 분석가', color: '#4a3aff', weeks: 10, steps: ['SQL', 'Python', '데이터 시각화', '통계', '머신러닝'] },
  { job: 'AI/ML 엔지니어', color: '#20d6a5', weeks: 16, steps: ['Python', '머신러닝', '딥러닝', 'LLM/프롬프트', 'MLOps'] },
  { job: '클라우드/DevOps', color: '#f59e0b', weeks: 12, steps: ['Docker', 'AWS', 'CI/CD', 'Kubernetes'] },
  { job: '백엔드 개발자', color: '#ec4899', weeks: 11, steps: ['Python', 'FastAPI', 'SQL', 'Docker', 'AWS'] },
  { job: '프런트엔드 개발자', color: '#0ea5e9', weeks: 9, steps: ['TypeScript', 'React', 'Git 협업'] },
]

function MiniArea({ values }) {
  const W = 240, H = 64, max = Math.max(...values), min = Math.min(...values)
  const pts = values.map((v, i) => [(i * W) / (values.length - 1), H - 6 - ((v - min) / (max - min || 1)) * (H - 16)])
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ')
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" aria-hidden>
      <defs><linearGradient id="ma" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4a3aff" stopOpacity=".35" /><stop offset="1" stopColor="#4a3aff" stopOpacity="0" /></linearGradient></defs>
      <path d={`${line} L${W},${H} L0,${H} Z`} fill="url(#ma)" />
      <path d={line} fill="none" stroke="#4a3aff" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx={pts.at(-1)[0]} cy={pts.at(-1)[1]} r="4.5" fill="#20d6a5" stroke="#fff" strokeWidth="2" />
    </svg>
  )
}

function HeroSearch() {
  const [q, setQ] = useState('')
  const nav = useNavigate()
  return (
    <form onSubmit={(e) => { e.preventDefault(); nav(`/courses?q=${encodeURIComponent(q.trim())}`) }} className="mt-8 flex max-w-xl items-center gap-2 rounded-2xl border border-line bg-white p-2 pl-5 shadow-card focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-100">
      <Icon icon={faMagnifyingGlass} className="text-muted" />
      <input value={q} onChange={(e) => setQ(e.target.value)} className="min-w-0 flex-1 bg-transparent py-2.5 text-[0.95rem] outline-none" placeholder="배우고 싶은 역량을 검색해 보세요 (예: LLM, SQL)" aria-label="강의 검색" />
      <button className="btn btn-primary">검색</button>
    </form>
  )
}

function Hero({ d, user, diag }) {
  const lead = d?.trends?.[0]
  return (
    <section className="dots-bg relative overflow-hidden">
      <div className="pointer-events-none absolute -right-40 -top-40 size-[40rem] rounded-full bg-brand-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 size-[28rem] rounded-full bg-accent/15 blur-3xl" />
      <div className="container-x relative grid items-center gap-12 py-12 lg:grid-cols-12 lg:py-20">
        <div className="animate-rise lg:col-span-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-caption font-semibold text-brand-700 shadow-card">
            <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-accent opacity-75" /><span className="relative inline-flex size-2 rounded-full bg-accent" /></span>
            K-AI 데이터 × 채용공고 실시간 분석
          </span>
          <h1 className="text-display mt-6">기업이 찾는 역량을<br />데이터로 <span className="text-gradient">Pick.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">채용공고·공공 고용 데이터·AI Hub 데이터셋을 AI가 분석하고, 내 역량 진단과 맞붙여 갭을 가장 빠르게 메우는 학습 경로를 설계합니다.</p>
          <HeroSearch />
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/diagnosis" className="btn btn-ink !px-5"><Icon icon={faWandMagicSparkles} />3분 역량 진단</Link>
            <Link to="/demand" className="btn btn-ghost !px-5">수요 리포트<Icon icon={faArrowRight} /></Link>
          </div>
          <p className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-caption font-semibold text-muted">
            <span className="text-eyebrow text-muted/70">Data from</span><span>AI Hub</span><span>공공데이터포털</span><span>고용24</span><span>Google Gemini</span>
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[560px] lg:col-span-6">
          <div className="relative mx-auto aspect-square w-[84%]">
            <div className="pebble-line -inset-[5%]" aria-hidden />
            <div className="pebble-line -inset-[11%] !border-accent/50 [animation-duration:18s,60s]" aria-hidden />
            <div className="pebble relative size-full shadow-lift">
              <img src={PHOTOS.hero} alt="함께 학습하는 사람들" className="size-full object-cover object-[62%_center]" fetchPriority="high" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-900/55 via-transparent to-brand-500/10" />
            </div>
          </div>
          <span className="absolute right-[10%] top-[6%] size-5 rounded-full bg-accent shadow-[0_0_0_8px_rgb(32_214_165/0.18)]" aria-hidden />
          <div className="glass-light absolute -left-2 top-[12%] w-56 animate-float rounded-2xl p-4 sm:left-0">
            <p className="text-eyebrow flex justify-between text-muted">Top demand<span className="text-accent-ink">LIVE</span></p>
            {lead ? <>
              <p className="mt-1 font-display text-xl font-bold">{lead.skill}</p>
              <p className="text-caption text-muted">전체 공고의 <b className="text-fg">{d.top_skills[0].share}%</b></p>
              <div className="mt-2"><MiniArea values={lead.values} /></div>
            </> : <Skeleton className="mt-2 h-20" />}
          </div>
          <div className="glass-light absolute -right-2 top-[46%] w-52 animate-float-slow rounded-2xl p-4 sm:right-0">
            {user && diag ? (
              <div className="flex items-center gap-3"><Donut value={diag.readiness} size={64} label="준비도" /><div><p className="text-caption text-muted">직무 준비도</p><p className="font-bold">{diag.job}</p></div></div>
            ) : (
              <><p className="text-caption text-muted">맞춤 추천</p><p className="mt-1 font-bold leading-snug">실전 SQL로 배우는<br />데이터 분석</p><p className="mt-2 inline-flex rounded-full bg-accent px-2.5 py-0.5 text-caption font-bold text-ink">매칭 92%</p></>
            )}
          </div>
          <div className="glass-light absolute bottom-[6%] left-[12%] flex animate-float items-center gap-2 rounded-full py-2 pl-2 pr-4 text-sm font-semibold [animation-delay:1s]">
            <LogoMark size={26} /> 갭 3개를 메우는 경로를 찾았어요
          </div>
        </div>
      </div>
    </section>
  )
}

function StatBand({ d }) {
  const items = [['월 분석 공고', d ? `${(d.kpis.postings / 1000).toFixed(1)}K` : '—', faDatabase], ['추적 역량 키워드', d?.kpis.skills ?? '—', faBrain], ['급상승 1위', d?.kpis.top_rising || '—', faArrowTrendUp], ['진단 → 추천', '3분', faBullseye]]
  return (
    <section className="container-x -mt-2">
      <div className="dots-dark grid grid-cols-2 gap-px overflow-hidden rounded-3xl bg-ink text-white lg:grid-cols-4">
        {items.map(([k, v, ic]) => (
          <div key={k} className="flex items-center gap-4 bg-ink/90 p-6">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10 text-accent"><Icon icon={ic} /></span>
            <div className="min-w-0"><p className="text-caption text-white/55">{k}</p><p className="num truncate text-2xl font-bold">{v}</p></div>
          </div>
        ))}
      </div>
    </section>
  )
}

/** Skill Metro: 직무 로드맵을 지하철 노선도처럼 — 역(역량)을 따라가면 목표 직무에 도착 */
function SkillMetro() {
  return (
    <div className="card overflow-hidden">
      <div className="scrollbar-none overflow-x-auto">
        <ul className="min-w-[760px] divide-y divide-line">
          {LINES.map((l, i) => (
            <li key={l.job} className="grid grid-cols-[200px_1fr] items-center gap-6 px-6 py-6 transition hover:bg-bg">
              <Link to={`/diagnosis?job=${encodeURIComponent(l.job)}`} className="group flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full font-display text-sm font-bold text-white" style={{ background: l.color }}>{i + 1}</span>
                <span><b className="block font-display group-hover:underline">{l.job}</b><span className="text-caption text-muted">{l.steps.length}개 역 · 약 {l.weeks}주</span></span>
              </Link>
              <div className="relative flex items-center justify-between">
                <span className="absolute inset-x-2 top-1/2 h-1.5 -translate-y-1/2 rounded-full" style={{ background: l.color }} />
                {l.steps.map((s) => (
                  <Link key={s} to={`/courses?skill=${encodeURIComponent(s)}`} className="group relative z-10 flex flex-col items-center">
                    <span className="size-5 rounded-full border-[5px] bg-white transition group-hover:scale-125" style={{ borderColor: l.color }} />
                    <span className="absolute top-7 whitespace-nowrap text-caption font-semibold text-muted group-hover:text-ink">{s}</span>
                  </Link>
                ))}
                <span className="relative z-10 grid size-9 place-items-center rounded-full text-white shadow-md" style={{ background: l.color }} title="목표 직무 도착"><Icon icon={faFlagCheckered} className="text-xs" /></span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="border-t border-line bg-bg px-6 py-3 text-caption text-muted">역(역량)을 누르면 해당 강의로, 노선 이름을 누르면 직무 진단으로 이동합니다.</p>
    </div>
  )
}

export default function Main() {
  const { user } = useAuth()
  const demand = useApi('/api/demand/overview')
  const courses = useApi('/api/courses?sort=popular')
  const reco = useApi('/api/recommend', !!user)
  const diag = useApi('/api/diagnosis/latest', !!user)
  const picks = user && reco.data?.picks?.length ? reco.data.picks.slice(0, 4) : null

  return (
    <>
      <Hero d={demand.data} user={user} diag={diag.data} />
      <StatBand d={demand.data} />

      <section className="container-x pt-24">
        <SectionHead no="01" eyebrow="Demand Top" title="지금 기업이 가장 많이 찾는 역량" desc="전 직무·산업·지역 기준 최근 12개월 채용 요건 분석 결과입니다."
          right={<Link to="/demand" className="btn btn-ghost">전체 분석<Icon icon={faArrowRight} /></Link>} />
        <Async state={demand} skeleton={<div className="grid gap-5 lg:grid-cols-2"><Skeleton className="h-96" /><Skeleton className="h-96" /></div>}>
          {(dd) => (
            <div className="grid gap-5 lg:grid-cols-12">
              <ol className="card divide-y divide-line px-2 lg:col-span-7">
                {dd.top_skills.slice(0, 8).map((s, i) => (
                  <li key={s.skill}>
                    <Link to={`/courses?skill=${encodeURIComponent(s.skill)}`} className="group grid grid-cols-[2.75rem_1fr_auto] items-center gap-4 rounded-xl px-3 py-3.5 transition hover:bg-bg">
                      <span className={`num grid size-9 place-items-center rounded-xl text-sm font-bold ${i < 3 ? 'bg-brand-600 text-white' : 'bg-surface-2 text-muted'}`}>{i + 1}</span>
                      <span><b className="font-display group-hover:text-brand-700">{s.skill}</b><span className="ml-2 text-caption text-muted">{s.category}</span>
                        <span className="mt-2 block h-1.5 rounded-full bg-surface-2"><span className="block h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400" style={{ width: `${(s.count / dd.top_skills[0].count) * 100}%` }} /></span></span>
                      <span className={`num rounded-full px-2 py-0.5 text-caption font-bold ${s.growth >= 5 ? 'bg-accent-soft text-accent-ink' : 'text-muted'}`}><Icon icon={faArrowTrendUp} className="mr-1" />{s.growth > 0 ? '+' : ''}{s.growth}%</span>
                    </Link>
                  </li>
                ))}
              </ol>
              <div className="tile flex flex-col lg:col-span-5">
                <p className="text-eyebrow text-muted">Keyword cloud</p>
                <div className="flex flex-1 items-center"><WordCloud words={dd.wordcloud} /></div>
                <p className="text-caption text-muted">글자 크기 = 공고 빈도 · <span className="font-semibold text-accent-ink">민트</span> = 3개월 급상승</p>
              </div>
            </div>
          )}
        </Async>
      </section>

      <section className="container-x pt-24">
        <SectionHead no="02" eyebrow={picks ? 'Picked for you' : 'Popular now'} title={picks ? `${user.name}님을 위한 맞춤 추천` : '맞춤 추천 강의'}
          desc={picks ? '진단 결과와 기업 수요의 갭을 가장 크게 줄이는 순서입니다.' : '역량 진단을 마치면 나만의 추천으로 바뀝니다. 지금은 인기 강의를 보여드려요.'}
          right={<Link to={user ? '/pick' : '/courses'} className="btn btn-ghost">{user ? '내 학습 Pick' : '전체 강의'}<Icon icon={faArrowRight} /></Link>} />
        <Async state={courses} skeleton={<CardSkeleton />} isEmpty={(l) => !l.length}>
          {(list) => (
            <div className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
              {(picks || list.slice(0, 8)).map((c) => <CourseCard key={c.id} c={c} badge={c.match ? `매칭 ${c.match}%` : undefined} />)}
            </div>
          )}
        </Async>
      </section>

      <section className="container-x pt-24">
        <SectionHead no="03" eyebrow="Skill Metro" title="인기 학습 로드맵 노선도" desc="직무마다 기업이 요구하는 역량을 순서대로 잇는 노선입니다. 역을 하나씩 지나면 목표 직무에 도착해요." />
        <SkillMetro />
      </section>

      <section className="container-x pt-24">
        <div className="relative grid items-center gap-10 overflow-hidden rounded-[2rem] bg-ink p-8 text-white sm:p-12 lg:grid-cols-2">
          <div className="dots-dark absolute inset-0" />
          <div className="relative">
            <p className="text-eyebrow text-accent">04 · For Business</p>
            <h2 className="text-h1 mt-4">채용 요건을 입력하면,<br />AI가 학습 과정으로 구조화합니다</h2>
            <p className="mt-4 max-w-lg text-white/65">기업 담당자가 필요 직무와 역량 요건을 등록하면 필수·우대 역량이 자동 분류되어 학습 과정 설계와 추천에 바로 반영됩니다.</p>
            <Link to="/demand#register" className="btn btn-accent mt-8 !px-6 !py-3.5"><Icon icon={faBuilding} />기업 수요 등록하기</Link>
          </div>
          <div className="relative mx-auto w-full max-w-md">
            <div className="relative mx-auto aspect-square w-[82%]"><div className="pebble-line -inset-[6%] !border-white/25" aria-hidden /><div className="pebble size-full [animation-delay:-5s]"><img src={PHOTOS.business} alt="노트북으로 협업하는 팀" loading="lazy" className="size-full object-cover" /></div></div>
            <div className="glass absolute -left-4 top-8 w-60 rounded-2xl p-4 text-sm">“FastAPI·Docker 실무 필수, AWS 우대, 경력 2년 이상”</div>
            <div className="glass-light absolute -right-2 bottom-10 w-56 space-y-1.5 rounded-2xl p-4 text-sm text-ink">
              <p className="text-eyebrow text-muted">AI structured</p>
              <p><span className="mr-2 text-muted">필수</span><b>FastAPI · Docker</b></p>
              <p><span className="mr-2 text-muted">우대</span><b className="rounded bg-accent-soft px-1.5 text-accent-ink">AWS</b></p>
              <p><span className="mr-2 text-muted">경력</span>2년 이상</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
