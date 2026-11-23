import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { faArrowRight, faArrowTrendUp, faMagnifyingGlass, faRobot, faWandMagicSparkles, faBuilding } from '@fortawesome/free-solid-svg-icons'
import { Async, CardSkeleton, Icon, SectionHead, Skeleton } from '../components/ui'
import CourseCard from '../components/CourseCard'
import Cover from '../components/Cover'
import { Donut, WordCloud } from '../components/charts'
import { useApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'

const COLLECTIONS = [
  { job: '데이터 분석가', cat: '데이터', steps: ['SQL', 'Python', '데이터 시각화', '통계'], weeks: 10, desc: '데이터로 의사결정을 이끄는 첫 직무' },
  { job: 'AI/ML 엔지니어', cat: 'AI', steps: ['Python', '머신러닝', '딥러닝', 'LLM/프롬프트'], weeks: 16, desc: '모델을 만들고 서비스로 연결합니다' },
  { job: '클라우드/DevOps', cat: '인프라', steps: ['Docker', 'AWS', 'CI/CD', 'Kubernetes'], weeks: 12, desc: '배포와 운영을 자동화하는 전문가' },
  { job: '백엔드 개발자', cat: '백엔드', steps: ['Python', 'FastAPI', 'SQL', 'Docker'], weeks: 11, desc: '안정적인 API와 데이터 구조 설계' },
  { job: '프런트엔드 개발자', cat: '프런트엔드', steps: ['TypeScript', 'React', 'Git 협업'], weeks: 9, desc: '사용자 경험을 코드로 구현합니다' },
]

function MiniArea({ values, months, growth }) {
  const W = 320, H = 110, max = Math.max(...values), min = Math.min(...values)
  const pts = values.map((v, i) => [(i * W) / (values.length - 1), H - 8 - ((v - min) / (max - min || 1)) * (H - 24)])
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ')
  const [lx, ly] = pts[pts.length - 1]
  return (
    <div className="mt-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" role="img" aria-label="최근 12개월 수요 추이">
        <defs><linearGradient id="ma" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff6b4a" stopOpacity=".45" /><stop offset="1" stopColor="#ff6b4a" stopOpacity="0" /></linearGradient></defs>
        <path d={`${line} L${W},${H} L0,${H} Z`} fill="url(#ma)" />
        <path d={line} fill="none" stroke="#ff6b4a" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx={lx} cy={ly} r="5" fill="#ff6b4a" stroke="#111114" strokeWidth="2" />
      </svg>
      <div className="mt-2 flex justify-between text-caption text-white/45"><span>{months[0]}</span><span className="font-semibold text-accent">3개월 {growth > 0 ? '+' : ''}{growth}%</span><span>{months[months.length - 1]}</span></div>
    </div>
  )
}

function HeroSearch() {
  const [q, setQ] = useState('')
  const nav = useNavigate()
  return (
    <form onSubmit={(e) => { e.preventDefault(); nav(`/courses?q=${encodeURIComponent(q.trim())}`) }} className="mt-8 flex max-w-xl items-center gap-2 rounded-full border border-line bg-bg p-1.5 pl-5 focus-within:border-ink">
      <Icon icon={faMagnifyingGlass} className="text-muted" />
      <input value={q} onChange={(e) => setQ(e.target.value)} className="min-w-0 flex-1 bg-transparent py-2 text-[0.95rem] outline-none" placeholder="배우고 싶은 역량을 검색해 보세요 (예: LLM)" aria-label="강의 검색" />
      <button className="btn btn-ink !py-2.5">검색</button>
    </form>
  )
}

export default function Main() {
  const { user } = useAuth()
  const demand = useApi('/api/demand/overview')
  const courses = useApi('/api/courses?sort=popular')
  const reco = useApi('/api/recommend', !!user)
  const diag = useApi('/api/diagnosis/latest', !!user)
  const d = demand.data
  const picks = user && reco.data?.picks?.length ? reco.data.picks.slice(0, 4) : null
  const lead = d?.trends?.[0]

  return (
    <>
      {/* HERO — Bento */}
      <section className="container-x pt-6 sm:pt-10">
        <div className="grid-12">
          <div className="tile col-span-12 flex flex-col justify-between !p-7 sm:!p-10 lg:col-span-8 lg:row-span-2">
            <div className="animate-rise">
              <p className="text-eyebrow flex items-center gap-2 text-brand-700"><span className="size-1.5 animate-pulse rounded-full bg-accent" />Enterprise demand × AI learning</p>
              <h1 className="text-display mt-6">기업이 찾는 역량을,<br />데이터로 <span className="text-brand-600">Pick</span><span className="text-accent">.</span></h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">채용공고·공공 고용 데이터·K-AI 데이터셋을 AI가 분석하고, 내 역량 진단 결과와 맞붙여 갭을 가장 빠르게 메우는 학습 경로를 설계합니다.</p>
              <HeroSearch />
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/diagnosis" className="btn btn-primary !px-6 !py-3.5"><Icon icon={faWandMagicSparkles} />3분 역량 진단</Link>
              <Link to="/demand" className="btn btn-ghost !px-6 !py-3.5">수요 리포트 보기<Icon icon={faArrowRight} /></Link>
            </div>
          </div>

          <div className="tile col-span-12 bg-ink !p-6 text-white sm:col-span-6 lg:col-span-4">
            <p className="text-eyebrow flex justify-between text-white/50">Top demand<span className="text-accent">LIVE</span></p>
            {d && lead ? (
              <>
                <p className="mt-3 font-display text-4xl font-bold">{lead.skill}</p>
                <p className="mt-1 text-sm text-white/60">전체 공고의 <b className="text-white">{d.top_skills[0].share}%</b>에서 요구</p>
                <MiniArea values={lead.values} months={d.months} growth={d.top_skills[0].growth} />
              </>
            ) : <Skeleton className="mt-4 h-44 opacity-20" />}
          </div>

          <div className="tile col-span-12 flex flex-col justify-between bg-brand-600 !p-6 text-white sm:col-span-6 lg:col-span-4">
            {user && diag.data ? (
              <div className="flex items-center gap-5">
                <div className="rounded-full bg-white p-1"><Donut value={diag.data.readiness} size={92} label="직무 준비도" /></div>
                <div><p className="text-eyebrow text-white/60">My readiness</p><p className="mt-1 font-display text-xl font-bold">{diag.data.job}</p><p className="text-sm text-white/70">우선 보강: {diag.data.gaps[0]?.skill}</p></div>
              </div>
            ) : (
              <div><p className="text-eyebrow text-white/60">Your Pick</p><p className="mt-3 font-display text-2xl font-bold leading-snug">내 역량, 기업 기준으로<br />몇 점일까요?</p></div>
            )}
            <Link to={user && diag.data ? '/pick' : '/diagnosis'} className="mt-6 inline-flex items-center justify-between rounded-full bg-white/15 px-5 py-3 text-sm font-semibold transition hover:bg-white hover:text-brand-700">
              {user && diag.data ? '내 학습 Pick 보기' : '무료로 진단하기'}<Icon icon={faArrowRight} />
            </Link>
          </div>

          {[['월 분석 공고', d ? `${(d.kpis.postings / 1000).toFixed(1)}K` : null], ['추적 역량', d?.kpis.skills], ['급상승 1위', d?.kpis.top_rising]].map(([k, v]) => (
            <div key={k} className="tile col-span-6 !p-5 sm:col-span-4 lg:col-span-3">
              <p className="text-caption font-semibold text-muted">{k}</p>
              {v != null ? <p className="num mt-2 truncate text-2xl font-bold sm:text-3xl">{v}</p> : <Skeleton className="mt-3 h-8 w-20" />}
            </div>
          ))}
          <Link to="/tutor" className="tile lift col-span-6 flex flex-col justify-between bg-accent !p-5 text-white sm:col-span-12 lg:col-span-3">
            <Icon icon={faRobot} className="text-xl" />
            <p className="mt-3 font-display text-lg font-bold leading-tight">AI 튜터에게<br />바로 물어보기 →</p>
          </Link>
        </div>
      </section>

      {/* 01 Demand */}
      <section className="container-x pt-24">
        <SectionHead no="01" eyebrow="Demand Top" title="지금 기업이 가장 많이 찾는 역량" desc="전 직무·산업·지역 기준 최근 12개월 채용 요건 분석 결과입니다."
          right={<Link to="/demand" className="btn btn-ghost">전체 분석<Icon icon={faArrowRight} /></Link>} />
        <Async state={demand} skeleton={<div className="grid gap-5 lg:grid-cols-2"><Skeleton className="h-96" /><Skeleton className="h-96" /></div>}>
          {(dd) => (
            <div className="grid gap-5 lg:grid-cols-12">
              <ol className="lg:col-span-7">
                {dd.top_skills.slice(0, 8).map((s, i) => (
                  <li key={s.skill}>
                    <Link to={`/courses?skill=${encodeURIComponent(s.skill)}`} className="group grid grid-cols-[3rem_1fr_auto] items-center gap-4 border-b border-line py-4">
                      <span className="num text-2xl font-bold text-muted group-hover:text-brand-600">{String(i + 1).padStart(2, '0')}</span>
                      <span><b className="font-display text-lg group-hover:underline">{s.skill}</b><span className="ml-2 text-caption text-muted">{s.category}</span>
                        <span className="mt-2 block h-1 rounded-full bg-surface-2"><span className="block h-full rounded-full bg-ink transition-all group-hover:bg-brand-600" style={{ width: `${(s.count / dd.top_skills[0].count) * 100}%` }} /></span></span>
                      <span className={`num text-sm font-bold ${s.growth >= 5 ? 'text-accent' : 'text-muted'}`}><Icon icon={faArrowTrendUp} className="mr-1 text-xs" />{s.growth > 0 ? '+' : ''}{s.growth}%</span>
                    </Link>
                  </li>
                ))}
              </ol>
              <div className="tile flex flex-col lg:col-span-5">
                <p className="text-eyebrow text-muted">Keyword cloud</p>
                <div className="flex flex-1 items-center"><WordCloud words={dd.wordcloud} /></div>
                <p className="text-caption text-muted">글자 크기 = 공고 빈도 · <span className="text-accent">코랄</span> = 3개월 급상승</p>
              </div>
            </div>
          )}
        </Async>
      </section>

      {/* 02 Courses */}
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

      {/* 03 Roadmap Lookbook */}
      <section className="pt-24">
        <div className="container-x"><SectionHead no="03" eyebrow="Roadmap collection" title="인기 학습 로드맵" desc="직무별로 기업이 요구하는 역량 순서를 따라 엮은 컬렉션입니다." /></div>
        <div className="scrollbar-none flex snap-x snap-mandatory scroll-px-4 gap-5 overflow-x-auto pb-4" style={{ paddingInline: 'max(1rem, calc((100vw - 1280px) / 2 + 2rem))' }}>
          {COLLECTIONS.map((r, i) => (
            <Link key={r.job} to={`/diagnosis?job=${encodeURIComponent(r.job)}`} className="group relative w-[78vw] shrink-0 snap-start overflow-hidden rounded-3xl sm:w-[380px]">
              <div className="transition-transform duration-700 group-hover:scale-105"><Cover category={r.cat} seed={i + 3} className="aspect-[3/4]" /></div>
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <p className="text-eyebrow text-white/60">Collection {String(i + 1).padStart(2, '0')} · {r.weeks}주</p>
                <h3 className="mt-2 font-display text-3xl font-bold">{r.job}</h3>
                <p className="mt-1 text-sm text-white/70">{r.desc}</p>
                <p className="mt-4 flex flex-wrap items-center gap-1.5 text-caption font-semibold">
                  {r.steps.map((s, k) => <span key={s} className="inline-flex items-center gap-1.5"><span className="rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">{s}</span>{k < r.steps.length - 1 && <span className="text-accent">→</span>}</span>)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 04 Business */}
      <section className="container-x pt-24">
        <div className="grid overflow-hidden rounded-[2rem] bg-surface-2 lg:grid-cols-2">
          <div className="p-8 sm:p-12">
            <p className="text-eyebrow text-brand-700">04 · For Business</p>
            <h2 className="text-h1 mt-4">채용 요건을 입력하면,<br />AI가 학습 과정으로 구조화합니다</h2>
            <p className="mt-4 max-w-lg text-body text-muted">기업 담당자가 필요 직무와 역량 요건을 등록하면 필수·우대 역량이 자동 분류되어 학습 과정 설계와 추천에 바로 반영됩니다.</p>
            <Link to="/demand#register" className="btn btn-ink mt-8 !px-6 !py-3.5"><Icon icon={faBuilding} />기업 수요 등록하기</Link>
          </div>
          <div className="paper-grid relative min-h-72 bg-surface">
            <div className="absolute inset-8 flex flex-col justify-center gap-3">
              <div className="w-4/5 rounded-2xl border border-line bg-bg p-4 text-sm shadow-lift">"FastAPI·Docker 실무 필수, AWS 경험 우대, 경력 2년 이상"</div>
              <div className="ml-auto w-4/5 space-y-2 rounded-2xl bg-ink p-4 text-sm text-white shadow-lift">
                <p className="text-eyebrow text-white/50">AI structured</p>
                <p><span className="mr-2 text-white/50">필수</span><b>FastAPI</b> · <b>Docker</b></p>
                <p><span className="mr-2 text-white/50">우대</span><b className="text-accent">AWS</b></p>
                <p><span className="mr-2 text-white/50">경력</span>2년 이상</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
