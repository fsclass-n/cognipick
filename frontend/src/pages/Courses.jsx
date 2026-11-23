import { useSearchParams } from 'react-router-dom'
import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { Async, CardSkeleton, Empty, Icon, PageHero } from '../components/ui'
import CourseCard from '../components/CourseCard'
import { useApi } from '../lib/api'

const LEVELS = ['', '입문', '중급', '심화']
const SORTS = [['popular', '인기순'], ['rating', '평점순'], ['short', '짧은 시간순'], ['new', '최신순']]

export default function Courses() {
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') || '', level = sp.get('level') || '', skill = sp.get('skill') || '', sort = sp.get('sort') || 'popular'
  const set = (k, v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); setSp(n, { replace: true }) }
  const qs = new URLSearchParams({ q, level, skill, sort }).toString()
  const list = useApi(`/api/courses?${qs}`)
  const skills = useApi('/api/skills')

  return (
    <>
      <PageHero eyebrow="Courses" title="강의 탐색" desc="기업 채용 요건에서 반복 등장하는 역량 기준으로 큐레이션한 과정입니다." />
      <div className="container-x py-10">
        <div className="card mb-6 space-y-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <input className="input max-w-sm" placeholder="강의명·강사·역량 검색" defaultValue={q} key={q} onKeyDown={(e) => e.key === 'Enter' && set('q', e.target.value.trim())} onBlur={(e) => e.target.value.trim() !== q && set('q', e.target.value.trim())} />
            <div className="flex rounded-xl bg-surface-2 p-1" role="tablist" aria-label="난이도">
              {LEVELS.map((l) => <button key={l} role="tab" aria-selected={level === l} onClick={() => set('level', l)} className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${level === l ? 'bg-white text-brand-700 shadow' : 'text-muted'}`}>{l || '전체'}</button>)}
            </div>
            <select className="input !w-auto" value={sort} onChange={(e) => set('sort', e.target.value)} aria-label="정렬">{SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          </div>
          <div className="flex flex-wrap gap-2">
            {(skills.data || []).map((s) => (
              <button key={s.id} onClick={() => set('skill', skill === s.name ? '' : s.name)} className={`rounded-full border px-3 py-1 text-caption font-semibold transition ${skill === s.name ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-white text-muted hover:border-brand-300'}`}>{s.name}</button>
            ))}
            {(q || level || skill) && <button className="text-caption font-semibold text-danger" onClick={() => setSp({})}><Icon icon={faXmark} className="mr-1" />필터 초기화</button>}
          </div>
        </div>
        <Async state={list} skeleton={<CardSkeleton n={8} />} isEmpty={(d) => !d.length} empty={<Empty title="조건에 맞는 강의가 없어요" desc="검색어나 필터를 바꿔보세요." />}>
          {(d) => (
            <>
              <p className="mb-4 text-sm text-muted">총 <b className="text-fg">{d.length}</b>개 강의</p>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{d.map((c) => <CourseCard key={c.id} c={c} />)}</div>
            </>
          )}
        </Async>
      </div>
    </>
  )
}
