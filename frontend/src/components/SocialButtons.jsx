import { API_BASE } from '../lib/api'

const LAST_KEY = 'cognipick.lastProvider'

/* 각 사 브랜드 가이드(색상·로고·문구)를 따른 공식형 버튼 */
const GoogleG = () => (
  <svg viewBox="0 0 48 48" className="size-[18px]" aria-hidden>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
)
const KakaoBubble = () => (
  <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
    <path fill="#000" d="M12 3.2C6.7 3.2 2.4 6.6 2.4 10.8c0 2.7 1.8 5.1 4.5 6.4l-.9 3.4c-.1.3.3.6.6.4l4-2.7c.5.1 1 .1 1.5.1 5.3 0 9.6-3.4 9.6-7.6S17.3 3.2 12 3.2z" />
  </svg>
)
const NaverN = () => (
  <svg viewBox="0 0 24 24" className="size-[16px]" aria-hidden><path fill="#fff" d="M15.3 12.6 8.4 2.8H2.8v18.4h5.9v-9.8l6.9 9.8h5.6V2.8h-5.9z" /></svg>
)

const PROVIDERS = [
  { id: 'kakao', label: '카카오로 시작하기', Logo: KakaoBubble, cls: 'bg-[#FEE500] text-black/85 hover:bg-[#f5dc00]' },
  { id: 'naver', label: '네이버로 시작하기', Logo: NaverN, cls: 'bg-[#03C75A] text-white hover:bg-[#02b350]' },
  { id: 'google', label: 'Google 계정으로 계속하기', Logo: GoogleG, cls: 'border border-[#dadce0] bg-white text-[#1f1f1f] hover:bg-[#f8f9fa]' },
]

export default function SocialButtons() {
  const last = typeof localStorage !== 'undefined' ? localStorage.getItem(LAST_KEY) : null
  return (
    <div className="space-y-2.5">
      {PROVIDERS.map(({ id, label, Logo, cls }) => (
        <a key={id} href={`${API_BASE}/api/auth/oauth/${id}/start`} onClick={() => localStorage.setItem(LAST_KEY, id)}
          className={`relative flex h-12 w-full items-center justify-center rounded-xl px-12 text-[0.9375rem] font-semibold transition active:scale-[.99] ${cls}`}>
          <span className="absolute left-4 grid size-6 place-items-center"><Logo /></span>
          {label}
          {last === id && (
            <span className="absolute -top-2.5 right-3 rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold text-white shadow-md after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-ink">최근 사용</span>
          )}
        </a>
      ))}
    </div>
  )
}
