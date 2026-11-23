import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { faArrowTrendUp, faBuilding, faLightbulb, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons'
import { Async, BlockSkeleton, Empty, Icon, PageHero, SectionHead, Skeleton, WriteButton } from '../components/ui'
import { LineChart, WordCloud } from '../components/charts'
import { api, toast, useApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'

function Filter({ label, value, options, onChange }) {
  return (
    <label className="block min-w-40 flex-1">
      <span className="mb-1 block text-caption font-bold text-muted">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input !rounded-full">
        <option value="">전체</option>{options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  )
}

function Structured({ s }) {
  const Tags = ({ list, cls }) => (list?.length ? list.map((x) => <span key={x} className={`rounded-full px-2.5 py-1 text-caption font-bold ${cls}`}>{x}</span>) : <span className="text-caption text-muted">없음</span>)
  return (
    <div className="space-y-3 rounded-2xl bg-surface-2 p-4">
      <p className="text-sm font-bold text-brand-800"><Icon icon={faWandMagicSparkles} className="mr-1.5" />AI 구조화 결과 <span className="ml-1 font-medium text-muted">({s.engine})</span></p>
      <p className="text-sm">{s.summary}</p>
      <div className="flex flex-wrap items-center gap-2"><b className="w-12 text-caption">필수</b><Tags list={s.must} cls="bg-brand-600 text-white" /></div>
      <div className="flex flex-wrap items-center gap-2"><b className="w-12 text-caption">우대</b><Tags list={s.nice} cls="bg-accent text-ink" /></div>
      <p className="text-caption text-muted">경력 요건: {s.experience}</p>
    </div>
  )
}

function PostForm({ jobs, industries, regions, onDone }) {
  const [f, setF] = useState({ company: '', job: jobs[0], industry: '', region: '', requirements: '' })
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const submit = async (e) => {
    e.preventDefault(); setBusy(true)
    try { const r = await api('/api/demand/posts', { method: 'POST', body: f }); setResult(r.structured); toast('수요가 등록되었습니다.', 'ok'); onDone() }
    catch (err) { if (!err.data?.read_only) toast(err.message, 'error') } finally { setBusy(false) }
  }
  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <label><span className="mb-1 block text-sm font-semibold">회사명</span><input className="input" value={f.company} onChange={set('company')} placeholder="예: 코그니랩" /></label>
        <label><span className="mb-1 block text-sm font-semibold">필요 직무</span><select className="input" value={f.job} onChange={set('job')}>{jobs.map((j) => <option key={j}>{j}</option>)}</select></label>
        <label><span className="mb-1 block text-sm font-semibold">산업</span><select className="input" value={f.industry} onChange={set('industry')}><option value="">선택 안 함</option>{industries.map((j) => <option key={j}>{j}</option>)}</select></label>
        <label><span className="mb-1 block text-sm font-semibold">지역</span><select className="input" value={f.region} onChange={set('region')}><option value="">선택 안 함</option>{regions.map((j) => <option key={j}>{j}</option>)}</select></label>
      </div>
      <label className="block"><span className="mb-1 block text-sm font-semibold">역량 요건 (자유롭게 서술)</span>
        <textarea required minLength={10} rows={5} className="input" value={f.requirements} onChange={set('requirements')} placeholder={'예) FastAPI·Docker 실무 경험 필수, 경력 2년 이상\nAWS, GitHub Actions 경험 우대'} /></label>
      <WriteButton type="submit" disabled={busy}><Icon icon={faWandMagicSparkles} />{busy ? 'AI가 구조화하는 중…' : 'AI로 구조화하고 등록'}</WriteButton>
      {result && <Structured s={result} />}
    </form>
  )
}

export default function Demand() {
  const [sp, setSp] = useSearchParams()
  const job = sp.get('job') || '', industry = sp.get('industry') || '', region = sp.get('region') || ''
  const set = (k) => (v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); setSp(n, { replace: true }) }
  const state = useApi(`/api/demand/overview?${new URLSearchParams({ job, industry, region })}`)
  const { user, isCompany } = useAuth()
  const posts = useApi('/api/demand/posts', isCompany)
  const opts = state.data?.options

  return (
    <>
      <PageHero eyebrow="Demand Analytics" title="기업 수요 분석 대시보드" desc="채용공고·공공 고용 데이터를 형태소 분석해 직무·산업·지역별로 요구되는 역량 키워드와 트렌드를 보여줍니다.">
        <div className="mt-8 flex flex-wrap gap-3">
          {opts ? <>
            <Filter label="직무" value={job} options={opts.jobs} onChange={set('job')} />
            <Filter label="산업" value={industry} options={opts.industries} onChange={set('industry')} />
            <Filter label="지역" value={region} options={opts.regions} onChange={set('region')} />
          </> : <Skeleton className="h-16 w-full max-w-2xl" />}
        </div>
      </PageHero>
      <div className="container-x space-y-8 py-10">
        <Async state={state} skeleton={<div className="grid gap-5 lg:grid-cols-2"><BlockSkeleton h="h-80" /><BlockSkeleton h="h-80" /></div>} isEmpty={(d) => !d.top_skills.length} empty={<Empty title="조건에 맞는 데이터가 없어요" desc="필터를 조정해 보세요." />}>
          {(d) => (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                {[['최근 월 분석 공고', `${d.kpis.postings.toLocaleString()}건`], ['도출된 역량 키워드', `${d.kpis.skills}개`], ['급상승 역량', d.kpis.top_rising]].map(([k, v]) => (
                  <div key={k} className="tile !p-5"><p className="text-caption font-semibold text-muted">{k}</p><p className="mt-1 font-display text-2xl font-bold">{v}</p></div>
                ))}
              </div>
              <div className="flex items-start gap-3 rounded-3xl bg-ink p-6 text-white">
                <Icon icon={faLightbulb} className="mt-1 text-lg text-accent" />
                <ul className="space-y-1 text-sm font-medium">{d.insights.map((i) => <li key={i}>{i}</li>)}</ul>
              </div>
              <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
                <div className="tile !p-5"><h3 className="text-h3 mb-4">역량 키워드 시계열 (Top 5)</h3><LineChart labels={d.months} series={d.trends.map((t) => ({ name: t.skill, values: t.values }))} unit="건" /></div>
                <div className="tile !p-5"><h3 className="text-h3 mb-2">수요 워드클라우드</h3><p className="mb-2 text-caption text-muted">글자 크기=공고 빈도 · 민트=급상승</p><WordCloud words={d.wordcloud} /></div>
              </div>
              <div className="tile !p-5">
                <h3 className="text-h3 mb-4">역량별 수요 순위</h3>
                <ul className="grid gap-x-10 gap-y-3 md:grid-cols-2">
                  {d.top_skills.slice(0, 12).map((s, i) => (
                    <li key={s.skill} className="flex items-center gap-3 text-sm">
                      <span className="w-5 text-right font-display font-bold text-muted">{i + 1}</span>
                      <Link to={`/courses?skill=${encodeURIComponent(s.skill)}`} className="w-28 shrink-0 font-semibold hover:text-brand-700">{s.skill}</Link>
                      <div className="h-2.5 flex-1 rounded-full bg-surface-2"><div className="h-full rounded-full bg-gradient-to-r from-ink to-brand-600" style={{ width: `${(s.count / d.top_skills[0].count) * 100}%` }} /></div>
                      <span className={`w-16 text-right text-caption font-bold ${s.growth >= 5 ? 'text-accent-ink' : 'text-muted'}`}><Icon icon={faArrowTrendUp} className="mr-0.5" />{s.growth}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </Async>

        <section id="register" className="scroll-mt-28">
          <SectionHead no="02" eyebrow="For Business" title="기업 수요 등록" desc="필요 직무와 역량 요건을 입력하면 AI가 필수·우대 역량으로 구조화해 학습 과정 설계에 반영합니다." />
          {!user ? (
            <Empty title="기업 담당자 로그인이 필요해요" desc="테스트 기업 담당자 계정으로 바로 체험할 수 있습니다." action={<Link to="/login" className="btn btn-primary">로그인</Link>} />
          ) : !isCompany ? (
            <Empty title="기업 담당자 전용 기능입니다" desc="학습자 계정에서는 조회만 가능합니다." />
          ) : opts ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <PostForm jobs={opts.jobs} industries={opts.industries} regions={opts.regions} onDone={posts.reload} />
              <div>
                <h3 className="text-h3 mb-3"><Icon icon={faBuilding} className="mr-2 text-brand-600" />등록된 수요</h3>
                <Async state={posts} isEmpty={(d) => !d.length} empty={<Empty title="아직 등록한 수요가 없어요" />}>
                  {(d) => <ul className="space-y-3">{d.map((p) => (
                    <li key={p.id} className="tile !p-4"><p className="font-bold">{p.company || '회사명 미입력'} · {p.job}</p><p className="mb-2 text-caption text-muted">{[p.industry, p.region].filter(Boolean).join(' · ')}</p><Structured s={p.structured} /></li>
                  ))}</ul>}
                </Async>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </>
  )
}
