import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { faPaperPlane, faRobot, faBookOpen } from '@fortawesome/free-solid-svg-icons'
import { Icon, PageHero } from '../components/ui'
import { streamChat, toast } from '../lib/api'

const SUGGEST = ['SQL JOIN을 어떻게 공부하면 좋을까요?', 'LLM RAG를 배우고 싶어요', 'Docker와 CI/CD 순서가 궁금해요', '데이터 시각화 강의 추천해 주세요']

const md = (t) => t.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : p))

export default function Tutor() {
  const [msgs, setMsgs] = useState([{ role: 'ai', text: '안녕하세요! cognipick AI 튜터예요. 학습 콘텐츠를 근거로 답하고 참고한 강의를 함께 보여드려요.', sources: [] }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef(null)
  useEffect(() => { end.current?.scrollIntoView({ block: 'end', behavior: 'smooth' }) }, [msgs])

  const send = async (text) => {
    const m = text.trim()
    if (!m || busy) return
    setInput(''); setBusy(true)
    setMsgs((l) => [...l, { role: 'me', text: m }, { role: 'ai', text: '', sources: [], pending: true }])
    const patch = (fn) => setMsgs((l) => l.map((x, i) => (i === l.length - 1 ? fn(x) : x)))
    try {
      await streamChat(m, { onSources: (s) => patch((x) => ({ ...x, sources: s })), onDelta: (d) => patch((x) => ({ ...x, text: x.text + d })) })
    } catch (e) { toast(e.message, 'error'); patch((x) => ({ ...x, text: x.text || '응답을 가져오지 못했어요. 잠시 후 다시 시도해 주세요.' })) }
    patch((x) => ({ ...x, pending: false })); setBusy(false)
  }

  return (
    <>
      <PageHero eyebrow="AI Tutor" title="AI 튜터" desc="학습 콘텐츠 기반 질의응답. 답변은 실시간 스트리밍으로 표시되고, 참고한 강의 출처가 함께 제공됩니다." />
      <div className="container-x py-8">
        <div className="card mx-auto flex h-[70vh] min-h-[28rem] max-w-3xl flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto p-5" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'me' ? 'flex-row-reverse' : ''}`}>
                <span className={`grid size-9 shrink-0 place-items-center rounded-full text-sm ${m.role === 'me' ? 'bg-ink text-white' : 'bg-brand-600 text-white'}`}>{m.role === 'me' ? '나' : <Icon icon={faRobot} />}</span>
                <div className={`max-w-[82%] ${m.role === 'me' ? 'text-right' : ''}`}>
                  <div className={`inline-block whitespace-pre-wrap rounded-2xl px-4 py-3 text-left text-sm leading-relaxed ${m.role === 'me' ? 'rounded-tr-sm bg-brand-600 text-white' : 'rounded-tl-sm bg-surface-2'}`}>
                    {m.text ? md(m.text) : null}{m.pending && <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-brand-600 align-middle" />}
                  </div>
                  {m.sources?.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-caption"><span className="font-bold text-muted"><Icon icon={faBookOpen} className="mr-1" />참고 콘텐츠</span>
                      {m.sources.map((s) => <Link key={s.id} to={`/courses/${s.id}`} className="rounded-full border border-brand-200 bg-white px-2.5 py-1 font-semibold text-brand-700 hover:bg-brand-50">{s.title}</Link>)}</div>
                  )}
                </div>
              </div>
            ))}
            <div ref={end} />
          </div>
          <div className="border-t border-line p-4">
            {msgs.length < 3 && <div className="mb-3 flex flex-wrap gap-2">{SUGGEST.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border border-line bg-white px-3 py-1.5 text-caption font-semibold text-muted hover:border-brand-300 hover:text-brand-700">{s}</button>)}</div>}
            <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="flex gap-2">
              <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="학습 질문을 입력하세요" maxLength={1000} aria-label="질문 입력" />
              <button className="btn btn-primary !px-5" disabled={busy || !input.trim()} aria-label="전송"><Icon icon={faPaperPlane} /></button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
