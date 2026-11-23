import { Link, useSearchParams } from 'react-router-dom'
import { faCalendarCheck, faFlagCheckered, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { Async, BlockSkeleton, Empty, Icon, PageHero, SectionHead } from '../components/ui'
import { GapBridge } from '../components/charts'
import CourseCard from '../components/CourseCard'
import { PhotoCover } from '../components/CourseCard'
import { useApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { JOBS } from '../lib/site'

export default function Pick() {
  const { user } = useAuth()
  const [sp, setSp] = useSearchParams()
  const job = sp.get('job') || user?.target_job || JOBS[0]
  const state = useApi(`/api/recommend?job=${encodeURIComponent(job)}`)

  return (
    <>
      <PageHero eyebrow="Personalized Pick" title="맞춤 학습 Pick" desc="기업 수요와 내 역량 사이의 갭을 가장 효율적으로 줄이는 강의와 단계별 로드맵을 추천합니다.">
        <div className="mt-6 flex flex-wrap gap-2">
          {JOBS.map((j) => <button key={j} onClick={() => setSp({ job: j })} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${job === j ? 'bg-ink text-white' : 'border border-line bg-surface hover:border-ink'}`}>{j}</button>)}
        </div>
      </PageHero>
      <div className="container-x space-y-12 py-10">
        <Async state={state} skeleton={<BlockSkeleton h="h-96" />} isEmpty={(d) => !d.picks.length} empty={<Empty title="추천할 강의가 없어요" desc="이미 모든 역량 요건을 충족했거나 데이터가 부족합니다." />}>
          {(d) => (
            <>
              {!d.diagnosed && (
                <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-amber-200 bg-amber-50 p-5">
                  <Icon icon={faTriangleExclamation} className="text-xl text-amber-500" />
                  <p className="flex-1 text-sm font-medium">아직 {d.job} 진단 결과가 없어 모든 역량을 기초 수준으로 가정했어요. 진단하면 추천이 정확해집니다.</p>
                  <Link to={`/diagnosis?job=${encodeURIComponent(d.job)}`} className="btn btn-primary">역량 진단하기</Link>
                </div>
              )}
              <section>
                <SectionHead no="01" eyebrow="Gap" title="가장 먼저 채워야 할 역량" />
                <div className="tile"><GapBridge gaps={d.gaps.slice(0, 6)} /></div>
              </section>
              <section>
                <SectionHead no="02" eyebrow="Roadmap" title="단계별 학습 로드맵" desc={`예상 소요 기간 약 ${d.total_weeks}주 (주 6시간 기준)`} />
                <ol className="relative space-y-8 before:absolute before:bottom-4 before:left-5 before:top-4 before:w-0.5 before:bg-gradient-to-b before:from-ink before:to-accent">
                  {d.stages.map((s, i) => (
                    <li key={s.name} className="relative pl-14">
                      <span className="absolute left-0 top-0 grid size-10 place-items-center rounded-full bg-brand-600 font-display font-bold text-white ring-4 ring-bg">{i + 1}</span>
                      <div className="mb-3 flex flex-wrap items-center gap-3"><h3 className="text-h3">{s.name}</h3><span className="chip"><Icon icon={faCalendarCheck} />약 {s.weeks}주</span></div>
                      <div className="grid gap-3 md:grid-cols-3">
                        {s.courses.map((c) => (
                          <Link key={c.id} to={`/courses/${c.id}`} className="card flex gap-3 overflow-hidden p-3 transition hover:-translate-y-0.5 hover:shadow-pop">
                            <PhotoCover c={c} label={false} className="size-16 shrink-0 rounded-xl" />
                            <div className="min-w-0"><p className="line-clamp-2 text-sm font-bold">{c.title}</p><p className="mt-1 text-caption text-muted">{c.hours}시간 · {c.closes.join(', ')}</p></div>
                          </Link>
                        ))}
                      </div>
                    </li>
                  ))}
                  <li className="relative pl-14"><span className="absolute left-0 top-0 grid size-10 place-items-center rounded-full bg-accent text-ink ring-4 ring-bg"><Icon icon={faFlagCheckered} /></span><h3 className="text-h3 pt-1.5">목표 직무 준비 완료</h3></li>
                </ol>
              </section>
              <section>
                <SectionHead no="03" eyebrow="Top Picks" title="AI 추천 강의" />
                <div className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                  {d.picks.map((c) => (
                    <CourseCard key={c.id} c={c} badge={`매칭 ${c.match}%`} note={c.reason} />
                  ))}
                </div>
              </section>
            </>
          )}
        </Async>
      </div>
    </>
  )
}
