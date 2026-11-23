import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { faCheck, faClock, faPlay, faStar, faUserGroup } from '@fortawesome/free-solid-svg-icons'
import { Async, BlockSkeleton, Icon } from '../components/ui'
import { Thumb } from '../components/CourseCard'
import { api, toast, useApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { levelColor } from '../lib/site'

export default function CourseDetail() {
  const { id } = useParams()
  const state = useApi(`/api/courses/${id}`)
  const { user, readOnly } = useAuth()
  const nav = useNavigate()
  const [busy, setBusy] = useState(false)

  const enroll = async () => {
    if (!user) return nav('/login', { state: { from: `/courses/${id}` } })
    setBusy(true)
    try { await api(`/api/courses/${id}/enroll`, { method: 'POST' }); toast('수강 신청이 완료되었습니다.', 'ok'); state.reload() }
    catch (e) { if (!e.data?.read_only) toast(e.message, 'error') } finally { setBusy(false) }
  }
  const step = async (p) => {
    try { await api(`/api/courses/${id}/progress`, { method: 'PUT', body: { progress: p } }); state.reload() } catch (e) { if (!e.data?.read_only) toast(e.message, 'error') }
  }

  return (
    <div className="container-x py-8">
      <Async state={state} skeleton={<BlockSkeleton h="h-[28rem]" />}>
        {(c) => (
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div>
              <div className="overflow-hidden rounded-3xl"><Thumb hue={c.hue} label={c.skills[0]} className="h-56 sm:h-72" /></div>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-caption font-bold ${levelColor[c.level]}`}>{c.level}</span>
                {c.skills.map((s) => <Link key={s} to={`/courses?skill=${encodeURIComponent(s)}`} className="chip">{s}</Link>)}
              </div>
              <h1 className="text-h1 mt-3">{c.title}</h1>
              <p className="mt-2 text-sm text-muted">{c.instructor} 강사 · <Icon icon={faStar} className="text-amber-500" /> {c.rating} · {c.learners.toLocaleString()}명 수강</p>
              <p className="text-body mt-6 text-fg/80">{c.summary}</p>
              <h2 className="text-h2 mb-4 mt-10">커리큘럼</h2>
              <ol className="space-y-3">
                {c.curriculum.map((t, i) => (
                  <li key={t} className="card flex items-center gap-4 p-4">
                    <span className="grid size-9 place-items-center rounded-xl bg-brand-50 font-display font-bold text-brand-700">{i + 1}</span>
                    <span className="flex-1 font-semibold">{t}</span>
                    {c.progress != null && c.progress >= Math.round(((i + 1) / c.curriculum.length) * 100) && <Icon icon={faCheck} className="text-ok" />}
                  </li>
                ))}
              </ol>
            </div>
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="card space-y-4 p-6">
                <div className="flex gap-4 text-sm text-muted"><span><Icon icon={faClock} className="mr-1" />{c.hours}시간</span><span><Icon icon={faUserGroup} className="mr-1" />{c.learners.toLocaleString()}명</span></div>
                {c.progress != null ? (
                  <>
                    <div><div className="mb-1 flex justify-between text-sm font-semibold"><span>내 진도율</span><span className="text-brand-700">{c.progress}%</span></div>
                      <div className="h-2.5 rounded-full bg-surface-2"><div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${c.progress}%` }} /></div></div>
                    <button className="btn btn-primary w-full" disabled={readOnly || c.progress >= 100} onClick={() => step(Math.min(100, c.progress + Math.round(100 / c.curriculum.length)))}><Icon icon={faPlay} />{c.progress >= 100 ? '수료 완료' : '다음 차시 학습'}</button>
                  </>
                ) : (
                  <button className="btn btn-primary w-full !py-3" disabled={busy || readOnly} onClick={enroll}>{user ? '수강 신청하기' : '로그인하고 수강하기'}</button>
                )}
                <p className="text-caption text-muted">기업 채용공고에서 {c.skills.join(', ')} 역량이 반복적으로 요구됩니다.</p>
              </div>
            </aside>
          </div>
        )}
      </Async>
    </div>
  )
}
