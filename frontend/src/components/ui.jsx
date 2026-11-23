import { useEffect, useState } from 'react'
import { FontAwesomeIcon as Icon } from '@fortawesome/react-fontawesome'
import { faCircleExclamation, faInbox, faLock, faRotateRight, faXmark, faCircleCheck, faCircleInfo, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../context/AuthContext'

export { Icon }

export function Skeleton({ className = '' }) { return <div className={`skeleton ${className}`} aria-hidden /> }

export function CardSkeleton({ n = 4 }) {
  return (
    <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: n }, (_, i) => <div key={i} className="space-y-3"><Skeleton className="aspect-[4/3] rounded-2xl" /><Skeleton className="h-3 w-1/3" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-3 w-1/2" /></div>)}
    </div>
  )
}

export function BlockSkeleton({ h = 'h-64' }) { return <Skeleton className={`${h} w-full rounded-3xl`} /> }

function StateBox({ icon, tone, title, desc, action, role }) {
  return (
    <div role={role} className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-line bg-surface px-6 py-14 text-center">
      <span className={`grid size-14 place-items-center rounded-full ${tone}`}><Icon icon={icon} className="text-lg" /></span>
      <h3 className="text-h3">{title}</h3>
      {desc && <p className="max-w-sm text-body text-muted">{desc}</p>}
      {action}
    </div>
  )
}

export const Empty = ({ title = '표시할 데이터가 없습니다', desc, action }) => <StateBox icon={faInbox} tone="bg-surface-2 text-ink" title={title} desc={desc} action={action} />

export const ErrorState = ({ error, onRetry }) => (
  <StateBox role="alert" icon={faCircleExclamation} tone="bg-red-50 text-danger" title="데이터를 불러오지 못했어요" desc={error?.message || '알 수 없는 오류가 발생했습니다.'}
    action={onRetry && <button className="btn btn-ink" onClick={onRetry}><Icon icon={faRotateRight} />다시 시도</button>} />
)

function SlowHint() {
  const [slow, setSlow] = useState(false)
  useEffect(() => { const t = setTimeout(() => setSlow(true), 4000); return () => clearTimeout(t) }, [])
  return slow ? <p className="mt-3 text-center text-caption text-muted">무료 서버를 깨우는 중이에요. 최대 1분 정도 걸릴 수 있습니다…</p> : null
}

/** 로딩(스켈레톤) · 에러 · 빈 상태 · 성공을 모든 데이터 영역에서 동일하게 처리 */
export function Async({ state, skeleton = <BlockSkeleton />, isEmpty, empty, children }) {
  if (state.loading) return <div>{skeleton}<SlowHint /></div>
  if (state.error) return <ErrorState error={state.error} onRetry={state.reload} />
  if (isEmpty?.(state.data)) return empty ?? <Empty />
  return children(state.data)
}

/** 테스트 관리자(읽기 전용)일 때 자동 비활성화되는 쓰기 버튼 */
export function WriteButton({ children, className = 'btn btn-primary', disabled, title, ...rest }) {
  const { readOnly } = useAuth()
  return (
    <button {...rest} disabled={disabled || readOnly} title={readOnly ? '읽기 전용 모드에서는 사용할 수 없습니다' : title} className={className}>
      {readOnly && <Icon icon={faLock} className="text-xs" />}{children}
    </button>
  )
}

/** 에디토리얼 섹션 헤더: 번호 + 아이브로 + 제목 */
export function SectionHead({ no, eyebrow, title, desc, right }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-t border-ink pt-4">
      <div className="max-w-2xl">
        <p className="text-eyebrow flex items-center gap-3 text-muted">{no && <span className="text-ink">{no}</span>}{eyebrow}</p>
        <h2 className="text-h1 mt-3">{title}</h2>
        {desc && <p className="mt-2 text-body text-muted">{desc}</p>}
      </div>
      {right}
    </div>
  )
}

/** 서브 페이지 공통 헤더 */
export function PageHero({ eyebrow, title, desc, children, aside }) {
  return (
    <section className="border-b border-line">
      <div className="container-x grid gap-6 py-10 sm:py-14 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="animate-rise">
          <p className="text-eyebrow flex items-center gap-2 text-brand-700"><span className="size-1.5 rounded-full bg-accent" />{eyebrow}</p>
          <h1 className="text-h1 mt-3 max-w-3xl">{title}</h1>
          {desc && <p className="mt-3 max-w-2xl text-body text-muted">{desc}</p>}
          {children}
        </div>
        {aside}
      </div>
    </section>
  )
}

export function Stat({ label, value, sub, tone = '' }) {
  return (
    <div className={`tile ${tone}`}>
      <p className="text-caption font-semibold opacity-70">{label}</p>
      <p className="num mt-2 text-3xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-caption opacity-70">{sub}</p>}
    </div>
  )
}

const TOAST_STYLE = { info: faCircleInfo, ok: faCircleCheck, warn: faTriangleExclamation, error: faCircleExclamation }
const TOAST_TONE = { info: 'text-brand-300', ok: 'text-emerald-400', warn: 'text-amber-300', error: "text-red-300" }

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
    <div className="pointer-events-none fixed inset-x-0 top-24 z-[80] flex flex-col items-center gap-2 px-4" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="pointer-events-auto flex max-w-md animate-rise items-start gap-3 rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white shadow-lift">
          <Icon icon={TOAST_STYLE[t.type] || faCircleInfo} className={`mt-0.5 ${TOAST_TONE[t.type] || ''}`} /><span className="flex-1">{t.message}</span>
          <button aria-label="닫기" onClick={() => setItems((l) => l.filter((x) => x.id !== t.id))}><Icon icon={faXmark} /></button>
        </div>
      ))}
    </div>
  )
}
