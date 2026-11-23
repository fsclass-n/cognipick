export const TEAM = ['김모란(조장)', '박미금', '이오리', '홍기흥']
export const LINKS = {
  github: 'https://github.com/fsclass-n/cognipick',
  pages: 'https://fsclass-n.github.io/cognipick/',
  blog: 'https://github.com/fsclass-n/cognipick/discussions',
  email: 'team@cognipick.dev',
}
export const NAV = [
  { to: '/courses', label: '강의 탐색' },
  { to: '/demand', label: '기업 수요 분석' },
  { to: '/diagnosis', label: 'AI 역량 진단' },
  { to: '/pick', label: '맞춤 학습 Pick' },
  { to: '/tutor', label: 'AI 튜터' },
]
export const ROLE_LABEL = { learner: '학습자', company: '기업 담당자', admin: '관리자', admin_readonly: '테스트 관리자' }
export const levelColor = { 입문: 'bg-emerald-50 text-emerald-700', 중급: 'bg-amber-50 text-amber-700', 심화: 'bg-rose-50 text-rose-700' }
export const validatePassword = (pw) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,64}$/.test(pw)
export const JOBS = ['데이터 분석가', 'AI/ML 엔지니어', '백엔드 개발자', '프런트엔드 개발자', '클라우드/DevOps', '데이터 엔지니어']
