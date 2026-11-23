from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Course, DailyMetric, DemandPost, Enrollment, Notice, Skill, User
from ..security import ROLES, require_admin, require_admin_read
from .content import course_out
from ..services import ai

router = APIRouter(prefix="/api/admin", tags=["admin"])


def user_row(u: User) -> dict:
    return {"id": u.id, "email": u.email, "name": u.name, "role": u.role, "provider": u.provider,
            "is_active": u.is_active, "created_at": u.created_at.isoformat()}


@router.get("/users")
def users(q: str = "", db: Session = Depends(get_db), _: User = Depends(require_admin_read)):
    rows = db.scalars(select(User).order_by(User.id))
    return [user_row(u) for u in rows if not q or q.lower() in u.email.lower() or q in u.name]


class RoleIn(BaseModel):
    role: str


@router.patch("/users/{user_id}/role")
def set_role(user_id: int, body: RoleIn, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(404, "회원을 찾을 수 없습니다.")
    if body.role not in ROLES:
        raise HTTPException(422, "올바르지 않은 권한입니다.")
    if u.id == admin.id:
        raise HTTPException(400, "본인의 권한은 변경할 수 없습니다.")
    u.role = body.role
    db.commit()
    return user_row(u)


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    u = db.get(User, user_id)
    if not u:
        raise HTTPException(404, "회원을 찾을 수 없습니다.")
    if u.id == admin.id:
        raise HTTPException(400, "본인 계정은 삭제할 수 없습니다.")
    for model in (Enrollment, DemandPost):
        for row in db.scalars(select(model).where(model.user_id == u.id)):
            db.delete(row)
    db.delete(u)
    db.commit()
    return {"ok": True}


class CourseIn(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    instructor: str = Field(min_length=1, max_length=80)
    level: str = "입문"
    hours: int = Field(default=10, ge=1, le=500)
    hue: int = Field(default=250, ge=0, le=360)
    summary: str = ""
    skills: list[str] = []
    curriculum: list[str] = []
    published: bool = True


@router.get("/courses")
def all_courses(db: Session = Depends(get_db), _: User = Depends(require_admin_read)):
    return [course_out(c, detail=True) for c in db.scalars(select(Course).order_by(Course.id.desc()))]


@router.post("/courses")
def create_course(body: CourseIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    c = Course(**body.model_dump())
    db.add(c)
    db.commit()
    return course_out(c, detail=True)


@router.put("/courses/{course_id}")
def update_course(course_id: int, body: CourseIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    c = db.get(Course, course_id)
    if not c:
        raise HTTPException(404, "강의를 찾을 수 없습니다.")
    for k, v in body.model_dump().items():
        setattr(c, k, v)
    db.commit()
    return course_out(c, detail=True)


@router.delete("/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    c = db.get(Course, course_id)
    if not c:
        raise HTTPException(404, "강의를 찾을 수 없습니다.")
    for e in db.scalars(select(Enrollment).where(Enrollment.course_id == course_id)):
        db.delete(e)
    db.delete(c)
    db.commit()
    return {"ok": True}


class SkillIn(BaseModel):
    name: str = Field(min_length=1, max_length=60)
    category: str = Field(default="기타", max_length=40)


@router.post("/skills")
def create_skill(body: SkillIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    if db.scalar(select(Skill).where(Skill.name == body.name)):
        raise HTTPException(409, "이미 존재하는 역량 태그입니다.")
    s = Skill(**body.model_dump())
    db.add(s)
    db.commit()
    return {"id": s.id, "name": s.name, "category": s.category}


@router.delete("/skills/{skill_id}")
def delete_skill(skill_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    s = db.get(Skill, skill_id)
    if not s:
        raise HTTPException(404, "역량 태그를 찾을 수 없습니다.")
    db.delete(s)
    db.commit()
    return {"ok": True}


class NoticeIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    body: str = ""
    pinned: bool = False


@router.post("/notices")
def create_notice(body: NoticeIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    n = Notice(**body.model_dump())
    db.add(n)
    db.commit()
    return {"id": n.id}


@router.put("/notices/{notice_id}")
def update_notice(notice_id: int, body: NoticeIn, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    n = db.get(Notice, notice_id)
    if not n:
        raise HTTPException(404, "공지를 찾을 수 없습니다.")
    for k, v in body.model_dump().items():
        setattr(n, k, v)
    db.commit()
    return {"id": n.id}


@router.delete("/notices/{notice_id}")
def delete_notice(notice_id: int, db: Session = Depends(get_db), _: User = Depends(require_admin)):
    n = db.get(Notice, notice_id)
    if not n:
        raise HTTPException(404, "공지를 찾을 수 없습니다.")
    db.delete(n)
    db.commit()
    return {"ok": True}


@router.get("/monitoring")
def monitoring(db: Session = Depends(get_db), _: User = Depends(require_admin_read)):
    rows = db.scalars(select(DailyMetric).order_by(DailyMetric.day)).all()
    sum_ = lambda f: sum(f(r) for r in rows)  # noqa: E731
    imp, clk = sum_(lambda r: r.reco_impressions), sum_(lambda r: r.reco_clicks)
    tot, ok = sum_(lambda r: r.analysis_total), sum_(lambda r: r.analysis_ok)
    last = rows[-1] if rows else None
    return {
        "series": [{"day": r.day.isoformat(), "active_users": r.active_users, "collected": r.collected,
                    "success_rate": round(r.analysis_ok / r.analysis_total * 100, 1), "ctr": round(r.reco_clicks / r.reco_impressions * 100, 1),
                    "conversion": round(r.enroll_conversions / r.reco_clicks * 100, 1), "avg_progress": r.avg_progress,
                    "completion_rate": r.completion_rate} for r in rows],
        "kpis": {"collected_total": sum_(lambda r: r.collected), "analysis_success_rate": round(ok / tot * 100, 1) if tot else 0,
                 "reco_ctr": round(clk / imp * 100, 1) if imp else 0,
                 "enroll_conversion": round(sum_(lambda r: r.enroll_conversions) / clk * 100, 1) if clk else 0,
                 "active_users": last.active_users if last else 0, "avg_progress": last.avg_progress if last else 0,
                 "completion_rate": last.completion_rate if last else 0},
        "totals": {"users": db.scalar(select(func.count(User.id))), "courses": db.scalar(select(func.count(Course.id))),
                   "enrollments": db.scalar(select(func.count(Enrollment.id))), "demand_posts": db.scalar(select(func.count(DemandPost.id)))},
        "ai": {"engine": "gemini" if ai.gemini_enabled() else "rule-based (GEMINI_API_KEY 미설정)", "model": ai.settings.gemini_model},
    }
