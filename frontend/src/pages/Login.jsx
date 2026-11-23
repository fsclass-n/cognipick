import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { faGoogle } from '@fortawesome/free-brands-svg-icons'
import { faChevronDown, faEye, faEyeSlash, faKey, faUserGear, faUserGraduate, faBuilding, faComment, faN } from '@fortawesome/free-solid-svg-icons'
import { Icon } from '../components/ui'
import { API_BASE, api, toast } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { validatePassword } from '../lib/site'

const TESTS = [
  { role: 'learner', label: '학습자', email: 'learner@cognipick.dev', icon: faUserGraduate },
  { role: 'company', label: '기업 담당자', email: 'company@cognipick.dev', icon: faBuilding },
  { role: 'admin_readonly', label: '테스트 관리자', email: 'readonly@cognipick.dev', icon: faUserGear },
]
const SOCIAL = [
  { id: 'google', label: 'Google로 계속하기', cls: 'bg-white text-fg border border-line hover:bg-surface-2', icon: <Icon icon={faGoogle} className="text-[#ea4335]" /> },
  { id: 'naver', label: '네이버로 계속하기', cls: 'bg-[#03c75a] text-white hover:brightness-95', icon: <Icon icon={faN} /> },
  { id: 'kakao', label: '카카오로 계속하기', cls: 'bg-[#fee500] text-[#191919] hover:brightness-95', icon: <Icon icon={faComment} /> },
]

export default function Login() {
  const { login, user } = useAuth()
  const nav = useNavigate()
  const loc = useLocation()
  const [sp] = useSearchParams()
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [adminKey, setAdminKey] = useState('')
  const to = loc.state?.from || '/'
  const pwOk = !pw || validatePassword(pw)

  useEffect(() => { if (user) nav(to, { replace: true }) }, [user, nav, to])
  useEffect(() => {
    const err = sp.get('oauth_error')
    if (err) toast(err === 'not_configured' ? `${sp.get('provider')} 로그인은 아직 서버에 설정되지 않았어요. 테스트 계정을 이용해 주세요.` : '소셜 로그인에 실패했습니다.', 'warn')
  }, [sp])

  const done = (res) => { login(res); toast(`${res.user.name}님 환영합니다.`, 'ok') }
  const wrap = async (fn) => { setBusy(true); try { done(await fn()) } catch (e) { toast(e.message, 'error') } finally { setBusy(false) } }

  const submit = (e) => { e.preventDefault(); wrap(() => api('/api/auth/login', { method: 'POST', body: { email, password: pw } })) }
  const quick = async (t) => {
    setEmail(t.email); setPw('•••••••••••')
    await new Promise((r) => setTimeout(r, 450))
    wrap(() => api('/api/auth/test-login', { method: 'POST', body: { role: t.role } }))
  }

  return (
    <div className="animate-rise">
      <h1 className="text-h1">다시 오셨네요</h1>
      <p className="mt-2 text-body text-muted">로그인하고 맞춤 학습 Pick을 이어가세요.</p>

      <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50/60 p-4">
        <p className="mb-3 text-caption font-bold uppercase tracking-wider text-brand-700">테스트 계정 간편 로그인</p>
        <div className="grid grid-cols-3 gap-2">
          {TESTS.map((t) => (
            <button key={t.role} disabled={busy} onClick={() => quick(t)} className="flex flex-col items-center gap-1.5 rounded-xl border border-line bg-white px-2 py-3 text-caption font-bold transition hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-card disabled:opacity-50">
              <Icon icon={t.icon} className="text-lg text-brand-600" />{t.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <label className="block"><span className="mb-1 block text-sm font-semibold">이메일</span>
          <input type="email" required autoComplete="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></label>
        <label className="block"><span className="mb-1 block text-sm font-semibold">비밀번호</span>
          <div className="relative">
            <input type={show ? 'text' : 'password'} required autoComplete="current-password" className={`input !pr-11 ${pwOk ? '' : '!border-danger'}`} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="영문 대·소문자 + 숫자 + 특수문자, 8자 이상" />
            <button type="button" aria-label={show ? '비밀번호 숨기기' : '비밀번호 표시'} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" onClick={() => setShow(!show)}><Icon icon={show ? faEyeSlash : faEye} /></button>
          </div>
          {!pwOk && <span className="mt-1 block text-caption font-medium text-danger">영문 대·소문자, 숫자, 특수문자를 조합한 8자 이상이어야 합니다.</span>}
        </label>
        <button className="btn btn-primary w-full !py-3" disabled={busy || !email || !pw || !pwOk}>{busy ? '로그인 중…' : '로그인'}</button>
      </form>

      <div className="my-6 flex items-center gap-3 text-caption text-muted"><span className="h-px flex-1 bg-line" />소셜 계정으로 계속하기<span className="h-px flex-1 bg-line" /></div>
      <div className="space-y-2">
        {SOCIAL.map((s) => (
          <a key={s.id} href={`${API_BASE}/api/auth/oauth/${s.id}/start`} className={`btn w-full !py-2.5 ${s.cls}`}>{s.icon}{s.label}</a>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-white">
        <button className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold" onClick={() => setAdminOpen(!adminOpen)} aria-expanded={adminOpen}>
          <span><Icon icon={faKey} className="mr-2 text-muted" />관리자 키로 로그인</span><Icon icon={faChevronDown} className={`transition ${adminOpen ? 'rotate-180' : ''}`} />
        </button>
        {adminOpen && (
          <form className="flex gap-2 border-t border-line p-4" onSubmit={(e) => { e.preventDefault(); wrap(() => api('/api/auth/admin-login', { method: 'POST', body: { key: adminKey } })) }}>
            <input type="password" className="input" placeholder="ADMIN_SECRET_KEY" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} autoComplete="off" />
            <button className="btn btn-ghost" disabled={busy || !adminKey}>확인</button>
          </form>
        )}
      </div>
      <p className="mt-6 text-center text-sm text-muted">아직 계정이 없나요? <Link to="/register" className="font-bold text-brand-700">회원가입</Link></p>
    </div>
  )
}
