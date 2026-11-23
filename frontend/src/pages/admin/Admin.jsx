import { useState } from 'react'
import { faChartPie, faBookOpen, faBullhorn, faPen, faTrash, faUsers } from '@fortawesome/free-solid-svg-icons'
import { Async, BlockSkeleton, Empty, Icon, WriteButton } from '../../components/ui'
import { LineChart, Sparkline } from '../../components/charts'
import { api, toast, useApi } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'
import { ROLE_LABEL } from '../../lib/site'

const act = async (fn, ok, after) => {
  try { await fn(); toast(ok, 'ok'); after?.() } catch (e) { if (!e.data?.read_only) toast(e.message, 'error') }
}

function Monitoring() {
  const state = useApi('/api/admin/monitoring')
  return (
    <Async state={state} skeleton={<BlockSkeleton h="h-96" />}>
      {({ series, kpis, totals, ai }) => {
        const days = series.map((s) => s.day)
        const cards = [
          ['누적 수집 건수', kpis.collected_total.toLocaleString(), series.map((s) => s.collected)],
          ['AI 분석 성공률', `${kpis.analysis_success_rate}%`, series.map((s) => s.success_rate)],
          ['추천 클릭률', `${kpis.reco_ctr}%`, series.map((s) => s.ctr)],
          ['수강 전환율', `${kpis.enroll_conversion}%`, series.map((s) => s.conversion)],
          ['활성 사용자(일)', kpis.active_users, series.map((s) => s.active_users)],
          ['평균 진도율', `${kpis.avg_progress}%`, series.map((s) => s.avg_progress)],
          ['수료율', `${kpis.completion_rate}%`, series.map((s) => s.completion_rate)],
        ]
        return (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cards.map(([k, v, s]) => <div key={k} className="tile flex items-end justify-between !p-5"><div><p className="text-caption font-semibold text-muted">{k}</p><p className="font-display text-2xl font-bold">{v}</p></div><Sparkline values={s} /></div>)}
              <div className="tile bg-brand-600 !p-5 text-white"><p className="text-caption font-semibold text-white/60">AI 엔진</p><p className="mt-1 text-sm font-bold">{ai.engine}</p><p className="text-caption text-white/50">{ai.model}</p></div>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="tile !p-5"><h3 className="text-h3 mb-3">데이터 수집 · 활성 사용자 (30일)</h3><LineChart labels={days} area series={[{ name: '수집 건수', values: series.map((s) => s.collected) }, { name: '활성 사용자', values: series.map((s) => s.active_users) }]} /></div>
              <div className="tile !p-5"><h3 className="text-h3 mb-3">AI 분석 성공률 · 추천 성과 (%)</h3><LineChart labels={days} series={[{ name: '분석 성공률', values: series.map((s) => s.success_rate) }, { name: '추천 클릭률', values: series.map((s) => s.ctr) }, { name: '수강 전환율', values: series.map((s) => s.conversion) }]} unit="%" /></div>
              <div className="card p-5 lg:col-span-2"><h3 className="text-h3 mb-3">학습 운영 통계: 평균 진도율 · 수료율 (%)</h3><LineChart labels={days} height={220} series={[{ name: '평균 진도율', values: series.map((s) => s.avg_progress) }, { name: '수료율', values: series.map((s) => s.completion_rate) }]} unit="%" /></div>
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              {Object.entries({ users: '회원', courses: '강의', enrollments: '수강', demand_posts: '기업 수요' }).map(([k, l]) => <div key={k} className="tile !p-4 text-center"><p className="font-display text-2xl font-bold text-brand-700">{totals[k]}</p><p className="text-caption text-muted">{l}</p></div>)}
            </div>
          </div>
        )
      }}
    </Async>
  )
}

function Users() {
  const [q, setQ] = useState('')
  const state = useApi(`/api/admin/users?q=${encodeURIComponent(q)}`)
  const { readOnly } = useAuth()
  return (
    <div className="space-y-4">
      <input className="input max-w-xs" placeholder="이메일·이름 검색" value={q} onChange={(e) => setQ(e.target.value)} />
      <Async state={state} skeleton={<BlockSkeleton />} isEmpty={(d) => !d.length} empty={<Empty title="회원이 없어요" />}>
        {(rows) => (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-surface-2 text-caption uppercase text-muted"><tr>{['이름', '이메일', '가입 경로', '권한', ''].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">{rows.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 font-semibold">{u.name}</td><td className="px-4 py-3 text-muted">{u.email}</td><td className="px-4 py-3">{u.provider}</td>
                  <td className="px-4 py-3">
                    <select className="input !w-auto !py-1.5" disabled={readOnly} value={u.role} aria-label={`${u.name} 권한`}
                      onChange={(e) => act(() => api(`/api/admin/users/${u.id}/role`, { method: 'PATCH', body: { role: e.target.value } }), '권한을 변경했습니다.', state.reload)}>
                      {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right"><WriteButton className="btn btn-danger !px-3 !py-1.5" onClick={() => confirm(`${u.name} 회원을 삭제할까요?`) && act(() => api(`/api/admin/users/${u.id}`, { method: 'DELETE' }), '삭제했습니다.', state.reload)}><Icon icon={faTrash} /></WriteButton></td>
                </tr>))}</tbody>
            </table>
          </div>
        )}
      </Async>
    </div>
  )
}

const EMPTY_COURSE = { title: '', instructor: '', level: '입문', hours: 10, hue: 250, summary: '', skills: '', curriculum: '', published: true }

function Content() {
  const courses = useApi('/api/admin/courses')
  const skills = useApi('/api/skills')
  const { readOnly } = useAuth()
  const [form, setForm] = useState(EMPTY_COURSE)
  const [editId, setEditId] = useState(null)
  const [tag, setTag] = useState('')
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const list = (s) => s.split(',').map((x) => x.trim()).filter(Boolean)

  const save = (e) => {
    e.preventDefault()
    const body = { ...form, hours: +form.hours, hue: +form.hue, skills: list(form.skills), curriculum: list(form.curriculum) }
    act(() => api(editId ? `/api/admin/courses/${editId}` : '/api/admin/courses', { method: editId ? 'PUT' : 'POST', body }), editId ? '강의를 수정했습니다.' : '강의를 등록했습니다.', () => { setForm(EMPTY_COURSE); setEditId(null); courses.reload() })
  }
  const edit = (c) => { setEditId(c.id); setForm({ ...c, skills: c.skills.join(', '), curriculum: c.curriculum.join(', ') }); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return (
    <div className="space-y-8">
      <form onSubmit={save} className="tile !p-5">
        <fieldset disabled={readOnly} className="space-y-3 disabled:opacity-60">
          <h3 className="text-h3">{editId ? `강의 수정 #${editId}` : '새 강의 등록'}</h3>
          <div className="grid gap-3 md:grid-cols-4">
            <input required className="input md:col-span-2" placeholder="강의명" value={form.title} onChange={set('title')} />
            <input required className="input" placeholder="강사" value={form.instructor} onChange={set('instructor')} />
            <select className="input" value={form.level} onChange={set('level')}>{['입문', '중급', '심화'].map((l) => <option key={l}>{l}</option>)}</select>
            <input type="number" min="1" className="input" placeholder="시간" value={form.hours} onChange={set('hours')} />
            <input type="number" min="0" max="360" className="input" placeholder="썸네일 색상(0-360)" value={form.hue} onChange={set('hue')} />
            <input className="input md:col-span-2" placeholder="역량 태그 (쉼표 구분: SQL, Python)" value={form.skills} onChange={set('skills')} />
            <input className="input md:col-span-4" placeholder="커리큘럼 (쉼표 구분)" value={form.curriculum} onChange={set('curriculum')} />
            <textarea className="input md:col-span-4" rows={2} placeholder="소개" value={form.summary} onChange={set('summary')} />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={form.published} onChange={set('published')} />공개</label>
        </fieldset>
        <div className="mt-3 flex gap-2"><WriteButton type="submit">{editId ? '수정 저장' : '등록'}</WriteButton>{editId && <button type="button" className="btn btn-ghost" onClick={() => { setEditId(null); setForm(EMPTY_COURSE) }}>취소</button>}</div>
      </form>

      <Async state={courses} skeleton={<BlockSkeleton />} isEmpty={(d) => !d.length} empty={<Empty title="등록된 강의가 없어요" />}>
        {(rows) => (
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-surface-2 text-caption uppercase text-muted"><tr>{['ID', '강의명', '난이도', '역량 태그', '상태', ''].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">{rows.map((c) => (
                <tr key={c.id}><td className="px-4 py-3 text-muted">{c.id}</td><td className="px-4 py-3 font-semibold">{c.title}</td><td className="px-4 py-3">{c.level}</td>
                  <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{c.skills.map((s) => <span key={s} className="chip">{s}</span>)}</div></td>
                  <td className="px-4 py-3">{c.published ? '공개' : '비공개'}</td>
                  <td className="space-x-2 whitespace-nowrap px-4 py-3 text-right">
                    <WriteButton className="btn btn-ghost !px-3 !py-1.5" onClick={() => edit(c)}><Icon icon={faPen} /></WriteButton>
                    <WriteButton className="btn btn-danger !px-3 !py-1.5" onClick={() => confirm('삭제할까요?') && act(() => api(`/api/admin/courses/${c.id}`, { method: 'DELETE' }), '삭제했습니다.', courses.reload)}><Icon icon={faTrash} /></WriteButton></td></tr>))}</tbody>
            </table>
          </div>
        )}
      </Async>

      <div className="tile !p-5">
        <h3 className="text-h3 mb-3">역량 태그 관리</h3>
        <Async state={skills} skeleton={<BlockSkeleton h="h-20" />}>
          {(rows) => (
            <>
              <div className="flex flex-wrap gap-2">{rows.map((s) => (
                <span key={s.id} className="chip !py-1">{s.name}<button disabled={readOnly} aria-label={`${s.name} 삭제`} className="disabled:opacity-40" onClick={() => act(() => api(`/api/admin/skills/${s.id}`, { method: 'DELETE' }), '태그를 삭제했습니다.', skills.reload)}>×</button></span>))}</div>
              <form className="mt-4 flex max-w-sm gap-2" onSubmit={(e) => { e.preventDefault(); act(() => api('/api/admin/skills', { method: 'POST', body: { name: tag, category: '기타' } }), '태그를 추가했습니다.', () => { setTag(''); skills.reload() }) }}>
                <input className="input" placeholder="새 역량 태그" value={tag} disabled={readOnly} onChange={(e) => setTag(e.target.value)} /><WriteButton type="submit" disabled={!tag}>추가</WriteButton>
              </form>
            </>
          )}
        </Async>
      </div>
    </div>
  )
}

function Notices() {
  const state = useApi('/api/notices')
  const { readOnly } = useAuth()
  const [f, setF] = useState({ title: '', body: '', pinned: false })
  return (
    <div className="space-y-6">
      <form className="card space-y-3 p-5" onSubmit={(e) => { e.preventDefault(); act(() => api('/api/admin/notices', { method: 'POST', body: f }), '공지를 등록했습니다.', () => { setF({ title: '', body: '', pinned: false }); state.reload() }) }}>
        <fieldset disabled={readOnly} className="space-y-3 disabled:opacity-60">
          <input required className="input" placeholder="공지 제목" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
          <textarea className="input" rows={3} placeholder="내용" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} />
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={f.pinned} onChange={(e) => setF({ ...f, pinned: e.target.checked })} />상단 고정</label>
        </fieldset>
        <WriteButton type="submit">공지 등록</WriteButton>
      </form>
      <Async state={state} isEmpty={(d) => !d.length} empty={<Empty title="공지가 없어요" />}>
        {(rows) => <ul className="space-y-3">{rows.map((n) => (
          <li key={n.id} className="card flex items-start justify-between gap-4 p-4"><div><p className="font-bold">{n.pinned && '📌 '}{n.title}</p><p className="text-sm text-muted">{n.body}</p></div>
            <WriteButton className="btn btn-danger !px-3 !py-1.5" onClick={() => act(() => api(`/api/admin/notices/${n.id}`, { method: 'DELETE' }), '삭제했습니다.', state.reload)}><Icon icon={faTrash} /></WriteButton></li>))}</ul>}
      </Async>
    </div>
  )
}

const TABS = [['monitor', '모니터링', faChartPie, Monitoring], ['users', '회원 관리', faUsers, Users], ['content', '콘텐츠 관리', faBookOpen, Content], ['notices', '공지사항', faBullhorn, Notices]]

export default function Admin() {
  const [tab, setTab] = useState('monitor')
  const { readOnly, user } = useAuth()
  const Body = TABS.find((t) => t[0] === tab)[3]
  return (
    <div className="container-x py-8">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-3xl bg-ink p-5 text-white">
            <p className="text-eyebrow text-white/50">Ops console</p>
            <p className="mt-2 font-display text-xl font-bold">운영 관리자</p>
            <p className="mt-1 text-caption text-white/60">{user.name}</p>
            <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-caption font-bold ${readOnly ? 'bg-accent text-white' : 'bg-white/15'}`}>{readOnly ? '읽기 전용 · 테스트 관리자' : '실제 관리자 · 전체 CRUD'}</span>
          </div>
          <nav className="scrollbar-none mt-3 flex gap-2 overflow-x-auto lg:flex-col" role="tablist" aria-label="관리 메뉴">
            {TABS.map(([id, label, ic]) => (
              <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`inline-flex shrink-0 items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${tab === id ? 'bg-surface text-ink ring-1 ring-ink' : 'text-muted hover:bg-surface hover:text-ink'}`}><Icon icon={ic} className="w-4" />{label}</button>
            ))}
          </nav>
        </aside>
        <section className="min-w-0">
          <h1 className="text-h1 mb-6">{TABS.find((t) => t[0] === tab)[1]}</h1>
          <Body />
        </section>
      </div>
    </div>
  )
}
