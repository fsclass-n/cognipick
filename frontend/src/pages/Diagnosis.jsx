import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { faArrowLeft, faArrowRight, faBullseye, faRotateRight } from '@fortawesome/free-solid-svg-icons'
import { Async, BlockSkeleton, Icon, PageHero, WriteButton } from '../components/ui'
import { GapBridge, Legend, RadarChart } from '../components/charts'
import { api, toast, useApi } from '../lib/api'
import { JOBS } from '../lib/site'

function Result({ r, onRetry }) {
  const axes = r.gaps.map((g) => ({ label: g.skill, a: g.score, b: g.required }))
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {[['종합 역량 점수', r.overall], ['직무 준비도', `${r.readiness}%`], ['우선 보강 역량', r.gaps[0]?.skill]].map(([k, v]) => (
          <div key={k} className="tile !p-5"><p className="text-caption font-semibold text-muted">{k}</p><p className="mt-1 font-display text-3xl font-bold text-brand-700">{v}</p></div>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="tile !p-5"><h3 className="text-h3 mb-2">역량 레이더 · {r.job}</h3>
          <RadarChart axes={axes} />
          <div className="mt-2 flex justify-center"><Legend items={[{ label: '내 역량', color: '#4f46e5' }, { label: '기업 요구 수준', color: '#8fb800' }]} /></div></div>
        <div className="tile !p-5"><h3 className="text-h3 mb-1">기업 수요 대비 갭(Gap)</h3><p className="mb-5 text-caption text-muted">검은 눈금이 기업 요구 수준, 민트 사선이 채워야 할 구간입니다.</p><GapBridge gaps={r.gaps} /></div>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link to={`/pick?job=${encodeURIComponent(r.job)}`} className="btn btn-primary !px-6 !py-3"><Icon icon={faBullseye} />갭을 메우는 학습 Pick 보기</Link>
        <button className="btn btn-ghost !py-3" onClick={onRetry}><Icon icon={faRotateRight} />다시 진단</button>
      </div>
    </div>
  )
}

function Quiz({ job, onDone }) {
  const state = useApi(`/api/diagnosis/questions?job=${encodeURIComponent(job)}`)
  const [i, setI] = useState(0)
  const [ans, setAns] = useState({})
  const [busy, setBusy] = useState(false)
  return (
    <Async state={state} skeleton={<BlockSkeleton h="h-80" />}>
      {({ questions: qs, engine }) => {
        const q = qs[i], a = ans[q.skill] || { choice: -1, confidence: 3 }
        const upd = (patch) => setAns({ ...ans, [q.skill]: { ...a, ...patch } })
        const last = i === qs.length - 1
        const submit = async () => {
          setBusy(true)
          try {
            const answers = qs.map((x) => ({ skill: x.skill, ...(ans[x.skill] || { choice: -1, confidence: 3 }) }))
            onDone(await api('/api/diagnosis/submit', { method: 'POST', body: { job, answers } }))
            toast('진단이 완료되었습니다.', 'ok')
          } catch (e) { if (!e.data?.read_only) toast(e.message, 'error') } finally { setBusy(false) }
        }
        return (
          <div className="card mx-auto max-w-2xl p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="h-2 flex-1 rounded-full bg-surface-2"><div className="h-full rounded-full bg-brand-600 transition-all duration-500" style={{ width: `${((i + 1) / qs.length) * 100}%` }} /></div>
              <span className="text-caption font-bold text-muted">{i + 1} / {qs.length}</span>
            </div>
            <span className="chip">{q.skill}</span>
            <h2 className="text-h2 mt-3">{q.question}</h2>
            <div className="mt-5 space-y-2.5" role="radiogroup">
              {q.options.map((o, k) => (
                <button key={o} role="radio" aria-checked={a.choice === k} onClick={() => upd({ choice: k })}
                  className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm font-medium transition ${a.choice === k ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200' : 'border-line bg-white hover:border-brand-300'}`}>
                  <span className={`grid size-6 shrink-0 place-items-center rounded-full text-caption font-bold ${a.choice === k ? 'bg-brand-600 text-white' : 'bg-surface-2'}`}>{'ABCD'[k]}</span>{o}
                </button>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-surface-2 p-4">
              <label className="flex items-center justify-between text-sm font-semibold">이 역량에 대한 자신감<b className="text-brand-700">{a.confidence} / 5</b></label>
              <input type="range" min="1" max="5" value={a.confidence} onChange={(e) => upd({ confidence: +e.target.value })} className="mt-2 w-full accent-brand-600" aria-label="자신감" />
            </div>
            <div className="mt-6 flex justify-between">
              <button className="btn btn-ghost" disabled={i === 0} onClick={() => setI(i - 1)}><Icon icon={faArrowLeft} />이전</button>
              {last ? <WriteButton disabled={busy} onClick={submit}>{busy ? '분석 중…' : '결과 보기'}</WriteButton>
                : <button className="btn btn-primary" onClick={() => setI(i + 1)}>다음<Icon icon={faArrowRight} /></button>}
            </div>
            <p className="mt-4 text-center text-caption text-muted">문항 출처: {engine === 'gemini' ? 'Gemini 생성' : '직무 진단 문항은행'}</p>
          </div>
        )
      }}
    </Async>
  )
}

export default function Diagnosis() {
  const [sp, setSp] = useSearchParams()
  const job = sp.get('job') || ''
  const [started, setStarted] = useState(false)
  const [result, setResult] = useState(null)
  const latest = useApi(`/api/diagnosis/latest?job=${encodeURIComponent(job)}`, !!job)
  const pick = (j) => { setSp({ job: j }); setStarted(false); setResult(null) }
  const shown = result || (!started && latest.data)

  return (
    <>
      <PageHero eyebrow="AI Assessment" title="AI 역량 진단" desc="목표 직무를 고르면 핵심 역량별 문항으로 현재 수준을 진단하고, 기업 요구 수준과의 갭을 시각화합니다." />
      <div className="container-x py-10">
        <div className="mb-8 flex flex-wrap gap-2" role="tablist" aria-label="목표 직무">
          {JOBS.map((j) => (
            <button key={j} role="tab" aria-selected={job === j} onClick={() => pick(j)} className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${job === j ? 'border-ink bg-ink text-white' : 'border-line bg-surface hover:border-ink'}`}>{j}</button>
          ))}
        </div>
        {!job ? (
          <div className="card grid place-items-center gap-2 px-6 py-16 text-center"><Icon icon={faBullseye} className="text-3xl text-brand-600" /><h3 className="text-h3">목표 직무를 선택해 주세요</h3><p className="text-body text-muted">직무마다 기업이 요구하는 핵심 역량이 달라집니다.</p></div>
        ) : shown ? <Result r={shown} onRetry={() => { setResult(null); setStarted(true) }} />
          : started ? <Quiz key={job} job={job} onDone={setResult} />
          : (
            <Async state={latest} skeleton={<BlockSkeleton h="h-60" />}>
              {() => (
                <div className="card mx-auto max-w-xl space-y-4 p-8 text-center">
                  <h3 className="text-h2">{job} 역량 진단</h3>
                  <p className="text-body text-muted">역량별 1문항 + 자신감 점수로 약 3분 소요됩니다. 결과는 레이더 차트와 갭 분석으로 제공됩니다.</p>
                  <button className="btn btn-primary !px-8 !py-3" onClick={() => setStarted(true)}>진단 시작하기<Icon icon={faArrowRight} /></button>
                </div>
              )}
            </Async>
          )}
      </div>
    </>
  )
}
