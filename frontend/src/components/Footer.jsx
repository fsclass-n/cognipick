import { Link } from 'react-router-dom'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import { faArrowUp, faBook, faEnvelope, faGlobe } from '@fortawesome/free-solid-svg-icons'
import { Icon } from './ui'
import { LINKS, TEAM } from '../lib/site'

const Col = ({ title, children }) => (
  <div><h4 className="text-eyebrow mb-4 text-white/40">{title}</h4><ul className="space-y-2.5 text-sm text-white/75">{children}</ul></div>
)
const L = ({ to, children }) => <li><Link className="transition hover:text-white hover:underline" to={to}>{children}</Link></li>
const X = ({ href, icon, children }) => <li><a className="inline-flex items-center gap-2 transition hover:text-white hover:underline" href={href} target="_blank" rel="noreferrer"><Icon icon={icon} className="w-4" />{children}</a></li>

export default function Footer() {
  return (
    <footer className="mt-28 bg-ink pb-24 text-white lg:pb-0">
      <div className="container-x pt-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="font-display text-3xl font-bold leading-tight tracking-tight">기업이 원하는 역량을 읽고,<br /><span className="text-accent">나에게 맞는 학습</span>을 Pick.</p>
            <p className="mt-4 max-w-sm text-sm text-white/55">cognipick — AI 기반 지능형 학습 플랫폼 & 기업 수요 분석 비즈니스 플랫폼</p>
          </div>
          <div className="grid gap-10 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-4">
            <Col title="Team">
              <li>프로젝트 cognipick</li>
              {TEAM.map((t) => <li key={t}>{t}</li>)}
              <li><a className="inline-flex items-center gap-1.5 hover:text-white" href={`mailto:${LINKS.email}`}><Icon icon={faEnvelope} />{LINKS.email}</a></li>
            </Col>
            <Col title="고객센터"><L to="/info/faq">FAQ</L><L to="/info/inquiry">1:1 문의</L><L to="/info/notices">공지사항</L></Col>
            <Col title="정책"><L to="/info/terms">이용약관</L><L to="/info/privacy"><b>개인정보처리방침</b></L><L to="/info/data-sources">데이터 출처 고지</L></Col>
            <Col title="Links">
              <X href={LINKS.github} icon={faGithub}>GitHub Repository</X><X href={LINKS.pages} icon={faGlobe}>GitHub Pages</X><X href={LINKS.blog} icon={faBook}>블로그</X>
            </Col>
          </div>
        </div>
        <p className="mt-14 text-caption text-white/45">데이터 출처: AI Hub(한국지능정보사회진흥원) · 공공데이터포털 · 고용24(워크넷)</p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 py-6 text-caption text-white/50">
          <p>© 2026 cognipick. All rights reserved.</p>
          <button className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 font-semibold text-white transition hover:bg-white hover:text-ink" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            To the Top <Icon icon={faArrowUp} />
          </button>
        </div>
      </div>
      <div className="overflow-hidden" aria-hidden>
        <p className="select-none whitespace-nowrap text-center font-display text-[22vw] font-bold leading-[0.78] tracking-[-0.07em] text-white/[0.06]">cognipick</p>
      </div>
    </footer>
  )
}
