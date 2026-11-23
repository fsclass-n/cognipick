from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import DemandPost, DemandStat, User
from ..security import ADMIN_ROLES, require_company
from ..services import ai
from ..services.catalog_data import INDUSTRIES, JOBS, REGIONS, SKILL_CATEGORY

router = APIRouter(prefix="/api/demand", tags=["demand"])


def _filters(job: str, industry: str, region: str) -> list:
    return [c for v, c in ((job, DemandStat.job == job), (industry, DemandStat.industry == industry), (region, DemandStat.region == region)) if v]


def required_levels(db: Session, job: str) -> dict[str, int]:
    """직무별 최근 3개월 공고 빈도를 정규화해 역량별 요구 수준(55~95)으로 변환."""
    months = [m for (m,) in db.execute(select(DemandStat.month).distinct().order_by(DemandStat.month.desc()).limit(3))]
    rows = db.execute(select(DemandStat.skill, func.sum(DemandStat.count)).where(DemandStat.job == job, DemandStat.month.in_(months))
                      .group_by(DemandStat.skill)).all()
    top = max((c for _, c in rows), default=1) or 1
    return {s: round(55 + 40 * c / top) for s, c in rows}


@router.get("/overview")
def overview(job: str = "", industry: str = "", region: str = "", db: Session = Depends(get_db)):
    f = _filters(job, industry, region)
    rows = db.execute(select(DemandStat.month, DemandStat.skill, func.sum(DemandStat.count)).where(*f)
                      .group_by(DemandStat.month, DemandStat.skill)).all()
    months = sorted({m for m, _, _ in rows})
    series: dict[str, dict[str, int]] = {}
    for m, s, c in rows:
        series.setdefault(s, {})[m] = int(c)
    totals = {s: sum(v.values()) for s, v in series.items()}
    grand = sum(totals.values()) or 1

    def growth(s: str) -> float:
        v = [series[s].get(m, 0) for m in months]
        prev, cur = sum(v[-6:-3]) or 1, sum(v[-3:])
        return round((cur - prev) / prev * 100, 1)

    ranked = sorted(totals, key=totals.get, reverse=True)
    top = [{"skill": s, "count": totals[s], "share": round(totals[s] / grand * 100, 1), "growth": growth(s),
            "category": SKILL_CATEGORY.get(s, "")} for s in ranked]
    rising = sorted(totals, key=growth, reverse=True)[:3]
    latest = months[-1] if months else ""
    insights = [f"'{top[0]['skill']}' 역량이 전체 공고의 {top[0]['share']}%로 가장 많이 요구됩니다." if top else "조건에 맞는 데이터가 없습니다."]
    if rising and top:
        insights.append(f"최근 3개월 급상승 역량: {', '.join(f'{s}(+{growth(s)}%)' for s in rising)}")
    return {
        "options": {"jobs": list(JOBS), "industries": INDUSTRIES, "regions": REGIONS},
        "months": months,
        "top_skills": top,
        "trends": [{"skill": s, "values": [series[s].get(m, 0) for m in months]} for s in ranked[:5]],
        "wordcloud": [{"text": t["skill"], "weight": t["count"], "growth": t["growth"]} for t in top],
        "kpis": {"postings": sum(series[s].get(latest, 0) for s in series), "skills": len(series),
                 "top_rising": rising[0] if rising else "", "latest_month": latest},
        "insights": insights,
    }


class PostIn(BaseModel):
    company: str = Field(default="", max_length=100)
    job: str
    industry: str = ""
    region: str = ""
    requirements: str = Field(min_length=10, max_length=4000)


def post_out(p: DemandPost) -> dict:
    return {"id": p.id, "company": p.company, "job": p.job, "industry": p.industry, "region": p.region,
            "requirements": p.requirements, "structured": p.structured, "created_at": p.created_at.isoformat()}


@router.post("/posts")
def create_post(body: PostIn, db: Session = Depends(get_db), user: User = Depends(require_company)):
    if body.job not in JOBS:
        raise HTTPException(422, "지원하지 않는 직무입니다.")
    structured = ai.structure_requirements(body.job, body.requirements)
    p = DemandPost(user_id=user.id, structured=structured, **body.model_dump())
    db.add(p)
    db.commit()
    return post_out(p)


@router.get("/posts")
def list_posts(db: Session = Depends(get_db), user: User = Depends(require_company)):
    q = select(DemandPost).order_by(DemandPost.created_at.desc()).limit(50)
    if user.role not in ADMIN_ROLES:
        q = q.where(DemandPost.user_id == user.id)
    return [post_out(p) for p in db.scalars(q)]
