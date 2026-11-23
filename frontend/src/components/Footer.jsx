import { Link } from 'react-router-dom'
import { faGithub } from '@fortawesome/free-brands-svg-icons'
import { faArrowUp, faBook, faEnvelope, faGlobe } from '@fortawesome/free-solid-svg-icons'
import { Icon } from './ui'
import { Logo } from './Header'
import { LINKS, TEAM } from '../lib/site'

const Col = ({ title, children }) => (
  <div><h4 className="mb-3 text-sm font-bold text-white">{title}</h4><ul className="space-y-2 text-sm text-white/60">{children}</ul></div>
)
const L = ({ to, children }) => <li><Link className="transition hover:text-accent" to={to}>{children}</Link></li>
const X = ({ href, children }) => <li><a className="transition hover:text-accent" href={href} target="_blank" rel="noreferrer">{children}</a></li>

export default function Footer() {
  return (
    <footer className="mt-24 bg-ink text-white">
      <div className="container-x py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Logo light />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/60">기업이 원하는 역량을 읽고, 나에게 맞는 학습을 Pick. 데이터로 연결하는 지능형 학습 플랫폼.</p>
            <div className="mt-5 flex gap-2">
              <a aria-label="GitHub" href={LINKS.github} target="_blank" rel="noreferrer" className="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-accent hover:text-accent-ink"><Icon icon={faGithub} /></a>
              <a aria-label="프로젝트 안내" href={LINKS.pages} target="_blank" rel="noreferrer" className="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-accent hover:text-accent-ink"><Icon icon={faGlobe} /></a>
              <a aria-label="블로그" href={LINKS.blog} target="_blank" rel="noreferrer" className="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-accent hover:text-accent-ink"><Icon icon={faBook} /></a>
            </div>
          </div>
          <Col title="회사·팀 정보">
            <li>프로젝트명: cognipick</li>
            {TEAM.map((t) => <li key={t}>{t}</li>)}
            <li><a className="hover:text-accent" href={`mailto:${LINKS.email}`}><Icon icon={faEnvelope} className="mr-1.5" />{LINKS.email}</a></li>
          </Col>
          <Col title="고객센터"><L to="/info/faq">FAQ</L><L to="/info/inquiry">1:1 문의</L><L to="/info/notices">공지사항</L></Col>
          <Col title="정책"><L to="/info/terms">이용약관</L><L to="/info/privacy">개인정보처리방침</L><L to="/info/data-sources">데이터 출처 고지</L></Col>
          <Col title="외부 링크">
            <X href={LINKS.github}>GitHub Repository</X><X href={LINKS.pages}>GitHub Pages</X><X href={LINKS.blog}>블로그</X>
          </Col>
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-caption text-white/50">
          <p>© 2026 cognipick. All rights reserved.</p>
          <p>데이터 출처: AI Hub · 공공데이터포털 · 고용24</p>
          <button className="inline-flex items-center gap-2 font-semibold text-white/70 hover:text-accent" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            To the Top <Icon icon={faArrowUp} />
          </button>
        </div>
      </div>
    </footer>
  )
}
