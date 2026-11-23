import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { faCheck, faCircle } from '@fortawesome/free-solid-svg-icons'
import { Icon } from '../components/ui'
import SocialButtons from '../components/SocialButtons'
import { api, toast } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { validatePassword } from '../lib/site'

const RULES = [['영문 대문자', /[A-Z]/], ['영문 소문자', /[a-z]/], ['숫자', /\d/], ['특수문자', /[^A-Za-z0-9\s]/], ['8자 이상', /^.{8,}$/]]

export default function Register() {
  const { login, user } = useAuth()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'learner' })
  const [busy, setBusy] = useState(false)
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  useEffect(() => { if (user) nav('/', { replace: true }) }, [user, nav])

  const submit = async (e) => {
    e.preventDefault(); setBusy(true)
    try { login(await api('/api/auth/register', { method: 'POST', body: f })); toast('가입이 완료되었습니다.', 'ok') }
    catch (err) { toast(err.message, 'error') } finally { setBusy(false) }
  }

  return (
    <div className="animate-rise">
      <h1 className="text-h1">회원가입</h1>
      <p className="mt-1.5 text-body text-muted">1분이면 가입하고 역량 진단을 시작할 수 있어요.</p>
      <div className="mt-7"><SocialButtons /></div>
      <div className="my-6 flex items-center gap-3 text-caption text-muted"><span className="h-px flex-1 bg-line" />또는 이메일로 가입<span className="h-px flex-1 bg-line" /></div>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-surface-2 p-1" role="radiogroup" aria-label="가입 유형">
          {[['learner', '학습자'], ['company', '기업 담당자']].map(([v, l]) => (
            <button type="button" key={v} role="radio" aria-checked={f.role === v} onClick={() => setF({ ...f, role: v })} className={`rounded-lg py-2 text-sm font-semibold transition ${f.role === v ? 'bg-white text-brand-700 shadow-card' : 'text-muted'}`}>{l}</button>
          ))}
        </div>
        <label className="block"><span className="mb-1 block text-sm font-semibold">이름</span><input required className="input h-12" value={f.name} onChange={set('name')} maxLength={50} autoComplete="name" /></label>
        <label className="block"><span className="mb-1 block text-sm font-semibold">이메일</span><input required type="email" className="input h-12" value={f.email} onChange={set('email')} autoComplete="email" /></label>
        <label className="block"><span className="mb-1 block text-sm font-semibold">비밀번호</span><input required type="password" className="input h-12" value={f.password} onChange={set('password')} autoComplete="new-password" /></label>
        <ul className="flex flex-wrap gap-2">
          {RULES.map(([l, re]) => { const ok = re.test(f.password); return <li key={l} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-caption font-bold transition ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-surface-2 text-muted'}`}><Icon icon={ok ? faCheck : faCircle} className="text-[0.6rem]" />{l}</li> })}
        </ul>
        <button className="btn btn-primary h-12 w-full" disabled={busy || !f.name || !f.email || !validatePassword(f.password)}>{busy ? '가입 중…' : '회원가입'}</button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">이미 계정이 있나요? <Link to="/login" className="font-bold text-brand-700">로그인</Link></p>
    </div>
  )
}
