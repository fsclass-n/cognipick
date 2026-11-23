import { Link } from 'react-router-dom'
import { faAward, faBookOpen, faClock, faGauge } from '@fortawesome/free-solid-svg-icons'
import { Async, BlockSkeleton, Empty, Icon, PageHero } from '../components/ui'
import { Donut, GapBridge, RadarChart } from '../components/charts'
import CourseCard from '../components/CourseCard'
import { useApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { ROLE_LABEL } from '../lib/site'

export default function MyPage() {
  const { user } = useAuth()
  const learning = useApi('/api/me/learning')
  const diag = useApi('/api/diagnosis/latest')

  return (
    <>
      <PageHero eyebrow="My Learning" title={`${user.name}님의 학습 현황`} desc={`${ROLE_LABEL[user.role]} · ${user.email}`} />
      <div className="container-x space-y-10 py-10">
        <Async state={learning} skeleton={<BlockSkeleton h="h-40" />}>
          {({ items, stats }) => (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[[faBookOpen, '수강 중인 강의', `${stats.enrolled}개`], [faAward, '수료한 강의', `${stats.completed}개`], [faClock, '누적 학습 시간', `${stats.hours}h`], [faGauge, '평균 진도율', `${stats.avg_progress}%`]].map(([ic, k, v]) => (
                  <div key={k} className="tile flex items-center gap-4 !p-5"><span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Icon icon={ic} /></span><div><p className="text-caption font-semibold text-muted">{k}</p><p className="font-display text-2xl font-bold">{v}</p></div></div>
                ))}
              </div>
              <section>
                <h2 className="text-h2 mb-4">학습 이력 · 진도</h2>
                {items.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{items.map((c) => <CourseCard key={c.id} c={c} />)}</div>
                  : <Empty title="아직 수강 중인 강의가 없어요" desc="맞춤 추천에서 첫 강의를 시작해 보세요." action={<Link to="/pick" className="btn btn-primary">맞춤 학습 Pick</Link>} />}
              </section>
            </>
          )}
        </Async>
        <section>
          <h2 className="text-h2 mb-4">성취도 리포트</h2>
          <Async state={diag} skeleton={<BlockSkeleton h="h-72" />} isEmpty={(d) => !d} empty={<Empty title="진단 결과가 없어요" desc="AI 역량 진단을 완료하면 성취도 리포트가 표시됩니다." action={<Link to="/diagnosis" className="btn btn-primary">진단 시작</Link>} />}>
            {(d) => (
              <div className="grid gap-5 lg:grid-cols-[auto_1fr_1fr]">
                <div className="card flex flex-col items-center justify-center gap-2 p-6"><Donut value={d.readiness} size={120} label="직무 준비도" /><p className="font-bold">{d.job}</p><p className="text-caption text-muted">직무 준비도</p></div>
                <div className="tile !p-5"><RadarChart axes={d.gaps.map((g) => ({ label: g.skill, a: g.score, b: g.required }))} size={300} /></div>
                <div className="tile !p-5"><GapBridge gaps={d.gaps.slice(0, 5)} /></div>
              </div>
            )}
          </Async>
        </section>
      </div>
    </>
  )
}
