from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db, utcnow
from ..models import Course, Enrollment, Notice, Skill, User
from ..security import get_current_user, get_optional_user
from ..services.catalog_data import SKILL_CATEGORY

router = APIRouter(prefix="/api", tags=["content"])


def course_out(c: Course, progress: int | None = None, detail: bool = False) -> dict:
    d = {"id": c.id, "title": c.title, "instructor": c.instructor, "level": c.level, "hours": c.hours, "hue": c.hue,
         "skills": c.skills, "category": SKILL_CATEGORY.get((c.skills or [""])[0], "기타"), "rating": c.rating, "learners": c.learners, "published": c.published, "progress": progress}
    if detail:
        d |= {"summary": c.summary, "curriculum": c.curriculum}
    return d


def _progress_map(db: Session, user: User | None) -> dict[int, int]:
    if not user:
        return {}
    return {e.course_id: e.progress for e in db.scalars(select(Enrollment).where(Enrollment.user_id == user.id))}


@router.get("/courses")
def list_courses(q: str = "", level: str = "", skill: str = "", sort: str = "popular",
                 db: Session = Depends(get_db), user: User | None = Depends(get_optional_user)):
    rows = [c for c in db.scalars(select(Course).where(Course.published.is_(True)))]
    if q:
        ql = q.lower()
        rows = [c for c in rows if ql in c.title.lower() or ql in c.instructor.lower() or any(ql in s.lower() for s in c.skills)]
    if level:
        rows = [c for c in rows if c.level == level]
    if skill:
        rows = [c for c in rows if skill in c.skills]
    key = {"popular": lambda c: -c.learners, "rating": lambda c: -c.rating, "short": lambda c: c.hours, "new": lambda c: -c.id}
    rows.sort(key=key.get(sort, key["popular"]))
    prog = _progress_map(db, user)
    return [course_out(c, prog.get(c.id)) for c in rows]


@router.get("/courses/{course_id}")
def get_course(course_id: int, db: Session = Depends(get_db), user: User | None = Depends(get_optional_user)):
    c = db.get(Course, course_id)
    if not c or not c.published:
        raise HTTPException(404, "강의를 찾을 수 없습니다.")
    return course_out(c, _progress_map(db, user).get(c.id), detail=True)


@router.post("/courses/{course_id}/enroll")
def enroll(course_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    c = db.get(Course, course_id)
    if not c:
        raise HTTPException(404, "강의를 찾을 수 없습니다.")
    e = db.scalar(select(Enrollment).where(Enrollment.user_id == user.id, Enrollment.course_id == course_id))
    if not e:
        e = Enrollment(user_id=user.id, course_id=course_id)
        c.learners += 1
        db.add(e)
        db.commit()
    return {"course_id": course_id, "progress": e.progress}


class ProgressIn(BaseModel):
    progress: int = Field(ge=0, le=100)


@router.put("/courses/{course_id}/progress")
def set_progress(course_id: int, body: ProgressIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    e = db.scalar(select(Enrollment).where(Enrollment.user_id == user.id, Enrollment.course_id == course_id))
    if not e:
        raise HTTPException(404, "수강 중인 강의가 아닙니다.")
    e.progress, e.updated_at = body.progress, utcnow()
    db.commit()
    return {"course_id": course_id, "progress": e.progress}


@router.get("/me/learning")
def my_learning(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    ens = db.scalars(select(Enrollment).where(Enrollment.user_id == user.id).order_by(Enrollment.updated_at.desc())).all()
    items = []
    for e in ens:
        c = db.get(Course, e.course_id)
        if c:
            items.append(course_out(c, e.progress) | {"updated_at": e.updated_at.isoformat()})
    done = [i for i in items if i["progress"] >= 100]
    hours = round(sum(i["hours"] * i["progress"] / 100 for i in items), 1)
    return {"items": items, "stats": {"enrolled": len(items), "completed": len(done), "hours": hours,
                                      "avg_progress": round(sum(i["progress"] for i in items) / len(items)) if items else 0}}


@router.get("/skills")
def skills(db: Session = Depends(get_db)):
    return [{"id": s.id, "name": s.name, "category": s.category} for s in db.scalars(select(Skill).order_by(Skill.category, Skill.name))]


@router.get("/notices")
def notices(db: Session = Depends(get_db)):
    rows = db.scalars(select(Notice).order_by(Notice.pinned.desc(), Notice.created_at.desc()))
    return [{"id": n.id, "title": n.title, "body": n.body, "pinned": n.pinned, "created_at": n.created_at.isoformat()} for n in rows]
