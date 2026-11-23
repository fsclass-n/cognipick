import { useEffect, useState } from 'react'
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome'
import { faCircleExclamation, faInbox, faLock, faRotateRight, faXmark, faCircleCheck, faCircleInfo, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../context/AuthContext'

export { Icon }

export function Skeleton({ className = '' }) { return <div className={`skeleton ${className}`} aria-hidden /> }

export function CardSkeleton({ n = 4 }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="card overflow-hidden"><Skeleton className="h-36 rounded-none" /><div className="space-y-3 p-4"><Skeleton className="h-4 w-4/5" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-2/3" /></div></div>
      ))}
    </div>
  )
}

export function BlockSkeleton({ h = 'h-64' }) { return <Skeleton className={`${h} w-full rounded-2xl`} /> }

export function Empty({ title = '표시할 데이터가 없습니다', desc, action }) {
  return (
    <div className="card flex flex-col items-center gap-3 border-dashed px-6 py-14 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Icon icon={faInbox} className="text-xl" /></span>
      <h3 className="text-h3">{title}</h3>
      {desc && <p className="max-w-sm text-body text-muted">{desc}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ error, onRetry }) {
  return (
    <div role="alert" className="card flex flex-col items-center gap-3 border-red-200 px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-red-50 text-danger"><Icon icon={faCircleExclamation} className="text-xl" /></span>
      <h3 className="text-h3">데이터를 불러오지 못했어요</h3>
      <p className="max-w-md text-body text-muted">{error?.message || '알 수 없는 오류가 발생했습니다.'}</p>
      {onRetry && <button className="btn btn-primary" onClick={onRetry}><Icon icon={faRotateRight} />다시 시도</button>}
    </div>
  )
}

function SlowHint() {
  const [slow, setSlow] = useState(false)
  useEffect(() => { const t = setTimeout(() => setSlow(true), 4000); return () => clearTimeout(t) }, [])
  return slow ? <p className="mt-3 text-center text-caption text-muted">무료 서버를 깨우는 중이에요. 최대 1분 정도 걸릴 수 있습니다…</p> : null
}

/** 로딩(스켈레톤) · 에러 · 빈 상태 · 성공을 일관되게 처리 */
export function Async({ state, skeleton = <BlockSkeleton />, isEmpty, empty, children }) {
  if (state.loading) return <div>{skeleton}<SlowHint /></div>
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />
  if (isEmpty?.(state.data)) return empty ?? <Empty />
  return children(state.data)
}

/** 테스트 관리자(읽기 전용)일 때 비활성화되는 쓰기 버튼 */
export function WriteButton({ children, className = 'btn btn-primary', disabled, title, ...rest }) {
  const { readOnly } = useAuth()
  return (
    <button {...rest} disabled={disabled || readOnly} title={readOnly ? '읽기 전용 모드에서는 사용할 수 없습니다' : title} className={className}>
      {readOnly && <Icon icon={faLock} className="text-xs" />}{children}
    </button>
  )
}

export function SectionHead({ eyebrow, title, desc, right }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-1 text-caption font-bold uppercase tracking-widest text-brand-600">{eyebrow}</p>}
        <h2 className="text-h1">{title}</h2>
        {desc && <p className="mt-2 max-w-2xl text-body text-muted">{desc}</p>}
      </div>
      {right}
    </div>
  )
}

export function PageHero({ eyebrow, title, desc, children }) {
  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <div className="grid-dots absolute inset-0 opacity-60" />
      <div className="absolute -right-24 -top-24 size-80 rounded-full bg-brand-600/40 blur-3xl" />
      <div className="container-x relative py-12 sm:py-16">
        <p className="mb-2 text-caption font-bold uppercase tracking-widest text-accent">{eyebrow}</p>
        <h1 className="text-h1 max-w-3xl">{title}</h1>
        {desc && <p className="mt-3 max-w-2xl text-body text-white/70">{desc}</p>}
        {children}
      </div>
    </section>
  )
}

const TOAST_STYLE = {
  info: ['bg-ink text-white', faCircleInfo], ok: ['bg-ok text-white', faCircleCheck],
  warn: ['bg-amber-500 text-ink', faTriangleExclamation], error: ['bg-danger text-white', faCircleExclamation],
}

export function Toasts() {
  const [items, setItems] = useState([])
  useEffect(() => {
    const on = (e) => {
      const id = Math.random()
      setItems((l) => [...l.slice(-3), { id, ...e.detail }])
      setTimeout(() => setItems((l) => l.filter((x) => x.id !== id)), 4200)
    }
    window.addEventListener('cognipick:toast', on)
    return () => window.removeEventListener('cognipick:toast', on)
  }, [])
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[80] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {items.map((t) => {
        const [cls, ic] = TOAST_STYLE[t.type] || TOAST_STYLE.info
        return (
          <div key={t.id} className={`pointer-events-auto flex max-w-md animate-rise items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-pop ${cls}`}>
            <Icon icon={ic} className="mt-0.5" /><span className="flex-1">{t.message}</span>
            <button aria-label="닫기" onClick={() => setItems((l) => l.filter((x) => x.id !== t.id))}><Icon icon={faXmark} /></button>
          </div>
        )
      })}
    </div>
  )
}
