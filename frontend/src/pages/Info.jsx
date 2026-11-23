import { useParams } from 'react-router-dom'
import { Async, Empty, PageHero } from '../components/ui'
import { LINKS } from '../lib/site'
import { useApi } from '../lib/api'
import NotFound from './NotFound'

const FAQ = [
  ['cognipick은 어떤 서비스인가요?', '채용공고·공공 고용 데이터·K-AI 데이터셋을 AI로 분석해 기업이 원하는 역량을 도출하고, 학습자의 진단 결과와 매칭해 맞춤 학습 경로를 추천하는 플랫폼입니다.'],
  ['테스트 계정은 어떻게 쓰나요?', '로그인 화면의 테스트 계정 버튼(학습자·기업 담당자·테스트 관리자)으로 바로 체험할 수 있습니다. 테스트 관리자는 읽기 전용입니다.'],
  ['AI 튜터의 답변은 신뢰할 수 있나요?', '학습 콘텐츠를 검색해 근거로 삼고, 참고한 강의 출처를 함께 표기합니다. 중요한 의사결정 전에는 원문 강의를 확인하세요.'],
]
const DOCS = {
  terms: ['이용약관', ['제1조(목적) 본 약관은 cognipick이 제공하는 학습 및 분석 서비스의 이용 조건을 규정합니다.', '제2조(계정) 이용자는 정확한 정보로 가입해야 하며 계정 보안에 책임이 있습니다.', '제3조(서비스) 본 서비스는 교육 프로젝트 데모이며 사전 고지 후 변경·중단될 수 있습니다.']],
  privacy: ['개인정보처리방침', ['수집 항목: 이메일, 이름, 학습 이력, 역량 진단 결과', '이용 목적: 회원 식별, 맞춤 학습 추천, 서비스 운영 통계', '비밀번호는 PBKDF2 해시로만 저장하며, 소셜 로그인은 이메일·이름만 수신합니다.']],
  'data-sources': ['데이터 출처 고지', ['AI Hub(한국지능정보사회진흥원) 공개 데이터셋', '공공데이터포털 고용·산업 통계 API', '고용24(워크넷) 채용정보', '화면의 수요 수치는 데모를 위해 위 출처의 분포를 모사한 샘플 데이터입니다.']],
}

function Notices() {
  const state = useApi('/api/notices')
  return (
    <Async state={state} isEmpty={(d) => !d.length} empty={<Empty title="등록된 공지가 없어요" />}>
      {(d) => <ul className="space-y-3">{d.map((n) => (
        <li key={n.id} className="tile !p-5"><p className="font-bold">{n.pinned && <span className="mr-2 rounded bg-accent px-1.5 py-0.5 text-caption text-white">고정</span>}{n.title}</p><p className="text-body mt-1 text-muted">{n.body}</p><p className="mt-2 text-caption text-muted">{n.created_at.slice(0, 10)}</p></li>
      ))}</ul>}
    </Async>
  )
}

export default function Info() {
  const { slug } = useParams()
  let title, body
  if (slug === 'faq') { title = '자주 묻는 질문'; body = <div className="space-y-3">{FAQ.map(([q, a]) => <details key={q} className="card group p-5"><summary className="cursor-pointer font-bold">{q}</summary><p className="text-body mt-3 text-muted">{a}</p></details>)}</div> }
  else if (slug === 'notices') { title = '공지사항'; body = <Notices /> }
  else if (slug === 'inquiry') { title = '1:1 문의'; body = <div className="card p-6 text-body">문의는 <a className="font-bold text-brand-700" href={`mailto:${LINKS.email}`}>{LINKS.email}</a> 또는 <a className="font-bold text-brand-700" href={`${LINKS.github}/issues`} target="_blank" rel="noreferrer">GitHub Issues</a>로 남겨 주세요.</div> }
  else if (DOCS[slug]) { title = DOCS[slug][0]; body = <ul className="card text-body space-y-3 p-6">{DOCS[slug][1].map((t) => <li key={t}>{t}</li>)}</ul> }
  else return <NotFound />
  return (<><PageHero eyebrow="Help Center" title={title} /><div className="container-x max-w-3xl py-10">{body}</div></>)
}
