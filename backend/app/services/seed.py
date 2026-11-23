import random
from datetime import date, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..config import settings
from ..models import Course, DailyMetric, DemandStat, Enrollment, Notice, Skill, User
from ..security import ADMIN, ADMIN_READONLY, COMPANY, LEARNER, hash_password
from .catalog_data import COURSES, INDUSTRIES, JOBS, NOTICES, REGIONS, SKILL_CATEGORY, SKILL_GROWTH


def months(n: int = 12) -> list[str]:
    today, out = date.today().replace(day=1), []
    y, m = today.year, today.month
    for _ in range(n):
        out.append(f"{y:04d}-{m:02d}")
        m -= 1
        if m == 0:
            y, m = y - 1, 12
    return out[::-1]


def seed_skills(db: Session) -> None:
    if db.scalar(select(func.count(Skill.id))):
        return
    db.add_all(Skill(name=n, category=c) for n, c in SKILL_CATEGORY.items())
    db.commit()


def seed_courses(db: Session) -> None:
    if db.scalar(select(func.count(Course.id))):
        return
    rnd = random.Random(7)
    for title, inst, level, hours, hue, skills, cur in COURSES:
        db.add(Course(title=title, instructor=inst, level=level, hours=hours, hue=hue, skills=skills, curriculum=cur,
                      summary=f"{', '.join(skills)} 역량을 현업 사례 중심으로 익히는 {level} 과정입니다. 기업 채용공고에서 반복 등장하는 요건을 기준으로 설계했습니다.",
                      rating=round(rnd.uniform(4.4, 4.9), 1), learners=rnd.randint(320, 9800)))
    db.commit()


def seed_demand(db: Session) -> None:
    if db.scalar(select(func.count(DemandStat.id))):
        return
    rnd = random.Random(42)
    ms = months()
    ind_mult = {(j, i): rnd.uniform(0.6, 1.4) for j in JOBS for i in INDUSTRIES}
    reg_mult = {r: m for r, m in zip(REGIONS, (1.6, 1.1, 0.7, 0.55))}
    rows = []
    for job, skills in JOBS.items():
        for skill, base in skills.items():
            g = SKILL_GROWTH.get(skill, 1.0) / 100
            for ind in INDUSTRIES:
                for reg in REGIONS:
                    for idx, mo in enumerate(ms):
                        v = base * 1.4 * (1 + g) ** idx * ind_mult[(job, ind)] * reg_mult[reg] * rnd.uniform(0.9, 1.1)
                        rows.append({"month": mo, "job": job, "industry": ind, "region": reg, "skill": skill, "count": max(1, int(v))})
    db.bulk_insert_mappings(DemandStat, rows)
    db.commit()


def seed_metrics(db: Session) -> None:
    if db.scalar(select(func.count(DailyMetric.id))):
        return
    rnd = random.Random(3)
    today = date.today()
    for i in range(30, 0, -1):
        d = today - timedelta(days=i)
        ok_total = rnd.randint(820, 1100)
        imp = rnd.randint(1800, 2600) + (30 - i) * 14
        clicks = int(imp * rnd.uniform(0.17, 0.27))
        db.add(DailyMetric(day=d, active_users=rnd.randint(260, 420) + (30 - i) * 5, collected=rnd.randint(1200, 1900),
                           analysis_total=ok_total, analysis_ok=int(ok_total * rnd.uniform(0.94, 0.99)),
                           reco_impressions=imp, reco_clicks=clicks, enroll_conversions=int(clicks * rnd.uniform(0.28, 0.4)),
                           avg_progress=round(rnd.uniform(48, 63) + (30 - i) * 0.2, 1), completion_rate=round(rnd.uniform(34, 46), 1)))
    db.commit()


def seed_users(db: Session) -> None:
    if db.scalar(select(func.count(User.id))):
        return
    pw = hash_password(settings.test_password)
    db.add_all([
        User(email="learner@cognipick.dev", name="테스트 학습자", role=LEARNER, password_hash=pw, target_job="데이터 분석가"),
        User(email="company@cognipick.dev", name="테스트 기업 담당자", role=COMPANY, password_hash=pw),
        User(email="readonly@cognipick.dev", name="테스트 관리자", role=ADMIN_READONLY, password_hash=pw),
        User(email=settings.admin_email, name="플랫폼 관리자", role=ADMIN, password_hash=None),
    ])
    db.commit()
    learner = db.scalar(select(User).where(User.email == "learner@cognipick.dev"))
    for cid, prog in ((1, 72), (2, 100), (5, 28)):
        db.add(Enrollment(user_id=learner.id, course_id=cid, progress=prog))
    db.commit()


def seed_notices(db: Session) -> None:
    if db.scalar(select(func.count(Notice.id))):
        return
    db.add_all(Notice(title=t, body=b, pinned=p) for t, b, p in NOTICES)
    db.commit()


def run_seed(db: Session) -> None:
    seed_skills(db)
    seed_courses(db)
    seed_demand(db)
    seed_metrics(db)
    seed_users(db)
    seed_notices(db)
