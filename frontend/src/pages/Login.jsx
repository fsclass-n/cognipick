import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { faArrowRight, faBuilding, faChevronDown, faEye, faEyeSlash, faKey, faLock, faUserGear, faUserGraduate } from '@fortawesome/free-solid-svg-icons'
import { Icon } from '../components/ui'
import SocialButtons from '../components/SocialButtons'
import { api, toast } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { validatePassword } from '../lib/site'

const TESTS = [
  { role: 'learner', label: '학습자', desc: '진단 · 추천 · 수강', email: 'learner@cognipick.dev', icon: faUserGraduate, tone: 'bg-brand-50 text-brand-700' },
  { role: 'company', label: '기업 담당자', desc: '수요 등록 · AI 구조화', email: 'company@cognipick.dev', icon: faBuilding, tone: 'bg-accent-soft text-accent-ink' },
  { role: 'admin_readonly', label: '테스트 관리자', desc: '관리자 화면 · 읽기 전용', email: 'readonly@cognipick.dev', icon: faUserGear, tone: 'bg-amber-50 text-amber-700' },
]

export default function Login() {
  const { login, user } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [sp] = useSearchParams()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(null)
  const [adminOpen, setAdminOpen] = useState(false)
  const [adminKey, setAdminKey] = useState('')
  const to = loc.state?.from || '/'
  const pwOk = !pw || validatePassword(pw)

  useEffect(() => { if (user) nav(to, { replace: true }) }, [user, nav, to])
  useEffect(() => {
    const err = sp.get('oauth_error')
    if (err) toast(err === 'not_configured' ? `${sp.get('provider')} 로그인은 아직 서버에 설정되지 않았어요. 테스트 계정으로 체험해 주세요.` : '소셜 로그인에 실패했습니다.', 'warn')
  }, [sp])

  const wrap = async (key, fn) => {
    setBusy(key)
    try { const res = await fn(); login(res); toast(`${res.user.name}님 환영합니다.`, 'ok') } catch (e) { toast(e.message, 'error') } finally { setBusy(null) }
  }
  const submit = (e) => { e.preventDefault(); wrap('form', () => api('/api/auth/login', { method: 'POST', body: { email, password: pw } })) }
  const quick = async (t) => {
    setEmail(t.email); setPw('••••••••••')
    await new Promise((r) => setTimeout(r, 400))
    wrap(t.role, () => api('/api/auth/test-login', { method: 'POST', body: { role: t.role } }))
  }

  return (
    <div className="animate-rise">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-h1">로그인</h1>
          <p className="mt-1.5 text-body text-muted">맞춤 학습 Pick을 이어서 시작하세요.</p>
        </div>
        <Link to="/register" className="shrink-0 pb-1 text-sm font-semibold text-brand-700 hover:underline">회원가입</Link>
      </div>

      <div className="mt-7"><SocialButtons /></div>

      <div className="my-6 flex items-center gap-3 text-caption text-muted"><span className="h-px flex-1 bg-line" />또는 이메일로 로그인<span className="h-px flex-1 bg-line" /></div>

      <form onSubmit={submit} className="space-y-3" noValidate>
        <label className="block"><span className="sr-only">이메일</span>
          <input type="email" required autoComplete="email" className="input h-12" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일 주소" /></label>
        <label className="block"><span className="sr-only">비밀번호</span>
          <span className="relative block">
            <input type={show ? 'text' : 'password'} required autoComplete="current-password" className={`input h-12 !pr-12 ${pwOk ? '' : '!border-danger'}`} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="비밀번호" />
            <button type="button" aria-label={show ? '비밀번호 숨기기' : '비밀번호 표시'} className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-surface-2" onClick={() => setShow(!show)}><Icon icon={show ? faEyeSlash : faEye} /></button>
          </span>
          <span className={`mt-1.5 block text-caption ${pwOk ? 'text-muted' : 'font-medium text-danger'}`}>영문 대·소문자, 숫자, 특수문자를 조합한 8자 이상</span>
        </label>
        <button className="btn btn-primary h-12 w-full text-[0.9375rem]" disabled={!!busy || !email || !pw || !pwOk}>{busy === 'form' ? '로그인 중…' : '로그인'}</button>
      </form>

      <section className="mt-8 rounded-2xl border border-line bg-surface p-4 shadow-card" aria-labelledby="quick-title">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="quick-title" className="text-sm font-bold">테스트 계정으로 바로 체험</h2>
          <span className="text-caption text-muted">클릭 시 자동 입력 후 로그인</span>
        </div>
        <ul className="space-y-2">
          {TESTS.map((t) => (
            <li key={t.role}>
              <button disabled={!!busy} onClick={() => quick(t)} className="group flex w-full items-center gap-3 rounded-xl border border-transparent px-2.5 py-2 text-left transition hover:border-line hover:bg-bg disabled:opacity-50">
                <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${t.tone}`}><Icon icon={t.icon} /></span>
                <span className="min-w-0 flex-1"><b className="block text-sm">{t.label}{t.role === 'admin_readonly' && ' 로그인'}</b><span className="text-caption text-muted">{t.desc}</span></span>
                <span className="text-caption font-semibold text-brand-700 opacity-0 transition group-hover:opacity-100">{busy === t.role ? '접속 중…' : <>입장 <Icon icon={faArrowRight} /></>}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-3 rounded-2xl border border-dashed border-line">
        <button className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-muted hover:text-ink" onClick={() => setAdminOpen(!adminOpen)} aria-expanded={adminOpen}>
          <span><Icon icon={faKey} className="mr-2" />실제 관리자 (보안 키 인증)</span><Icon icon={faChevronDown} className={`text-xs transition ${adminOpen ? 'rotate-180' : ''}`} />
        </button>
        {adminOpen && (
          <form className="flex gap-2 px-4 pb-4" onSubmit={(e) => { e.preventDefault(); wrap('admin', () => api('/api/auth/admin-login', { method: 'POST', body: { key: adminKey } })) }}>
            <span className="relative flex-1"><Icon icon={faLock} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-muted" />
              <input type="password" className="input !pl-9" placeholder="ADMIN_SECRET_KEY" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} autoComplete="off" /></span>
            <button className="btn btn-ink" disabled={!!busy || !adminKey}>인증</button>
          </form>
        )}
      </div>
    </div>
  )
}
