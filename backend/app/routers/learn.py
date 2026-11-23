import json
from collections.abc import Iterator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Course, Diagnosis, Enrollment, User
from ..security import get_current_user, get_optional_user
from ..services import ai
from ..services.catalog_data import JOBS, QUESTIONS
from .content import course_out
from .demand import required_levels

router = APIRouter(prefix="/api", tags=["learn"])
LEVEL_ORDER = {"입문": 0, "중급": 1, "심화": 2}


@router.get("/diagnosis/questions")
def questions(job: str):
    if job not in JOBS:
        raise HTTPException(422, "지원하지 않는 직무입니다.")
    return {"job": job, "engine": "gemini" if ai.gemini_enabled() else "question-bank",
            "questions": [{"skill": s, "question": QUESTIONS[s][0], "options": QUESTIONS[s][1]} for s in JOBS[job]]}


class AnswerIn(BaseModel):
    skill: str
    choice: int = Field(ge=-1, le=3)
    confidence: int = Field(ge=1, le=5)


class SubmitIn(BaseModel):
    job: str
    answers: list[AnswerIn]


def _gaps(db: Session, job: str, scores: dict[str, int]) -> list[dict]:
    req = required_levels(db, job)
    out = [{"skill": s, "required": r, "score": scores.get(s, 20), "gap": max(0, r - scores.get(s, 20))} for s, r in req.items()]
    return sorted(out, key=lambda x: -x["gap"])


@router.post("/diagnosis/submit")
def submit(body: SubmitIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if body.job not in JOBS:
        raise HTTPException(422, "지원하지 않는 직무입니다.")
    scores = {}
    for a in body.answers:
        if a.skill in JOBS[body.job] and a.skill in QUESTIONS:
            scores[a.skill] = (60 if a.choice == QUESTIONS[a.skill][2] else 0) + a.confidence * 8
    if not scores:
        raise HTTPException(422, "답변이 없습니다.")
    d = Diagnosis(user_id=user.id, job=body.job, scores=scores)
    db.add(d)
    db.commit()
    return _diag_out(db, d)


def _diag_out(db: Session, d: Diagnosis) -> dict:
    gaps = _gaps(db, d.job, d.scores)
    overall = round(sum(g["score"] for g in gaps) / len(gaps)) if gaps else 0
    ready = round(sum(min(g["score"], g["required"]) for g in gaps) / (sum(g["required"] for g in gaps) or 1) * 100)
    return {"id": d.id, "job": d.job, "scores": d.scores, "gaps": gaps, "overall": overall, "readiness": ready,
            "created_at": d.created_at.isoformat()}


@router.get("/diagnosis/latest")
def latest(job: str = "", db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    q = select(Diagnosis).where(Diagnosis.user_id == user.id).order_by(Diagnosis.created_at.desc(), Diagnosis.id.desc())
    if job:
        q = q.where(Diagnosis.job == job)
    d = db.scalars(q).first()
    return _diag_out(db, d) if d else None


def build_roadmap(db: Session, gaps: list[dict], enrolled: dict[int, int]) -> dict:
    gap_by = {g["skill"]: g["gap"] for g in gaps}
    courses = list(db.scalars(select(Course).where(Course.published.is_(True))))
    scored = []
    for c in courses:
        cover = sum(gap_by.get(s, 0) for s in c.skills)
        if cover <= 0:
            continue
        lvl_pen = {0: 1.0, 1: 0.95, 2: 0.85}[LEVEL_ORDER.get(c.level, 1)]
        score = cover * lvl_pen / (1 + c.hours / 40)
        scored.append((score, c, [s for s in c.skills if gap_by.get(s, 0) > 0]))
    scored.sort(key=lambda x: -x[0])
    top_score = scored[0][0] if scored else 1
    picks = [course_out(c, enrolled.get(c.id)) | {"match": min(99, round(60 + 39 * s / top_score)), "closes": cl,
             "reason": f"{', '.join(cl)} 갭을 {sum(gap_by[x] for x in cl)}pt 줄여줍니다"} for s, c, cl in scored[:8]]
    stages, used = [], set()
    for name, lv in (("1단계 · 기초 다지기", 0), ("2단계 · 핵심 역량 강화", 1), ("3단계 · 실전·심화", 2)):
        items = [p for p in picks if LEVEL_ORDER.get(p["level"], 1) == lv and p["id"] not in used][:3]
        used |= {p["id"] for p in items}
        if items:
            stages.append({"name": name, "weeks": max(1, round(sum(i["hours"] for i in items) / 6)), "courses": items})
    return {"picks": picks[:6], "stages": stages, "total_weeks": sum(s["weeks"] for s in stages)}


@router.get("/recommend")
def recommend(job: str = "", db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    job = job or user.target_job or "데이터 분석가"
    if job not in JOBS:
        raise HTTPException(422, "지원하지 않는 직무입니다.")
    d = db.scalars(select(Diagnosis).where(Diagnosis.user_id == user.id, Diagnosis.job == job)
                   .order_by(Diagnosis.created_at.desc(), Diagnosis.id.desc())).first()
    scores = d.scores if d else {}
    gaps = _gaps(db, job, scores)
    enrolled = {e.course_id: e.progress for e in db.scalars(select(Enrollment).where(Enrollment.user_id == user.id))}
    return {"job": job, "diagnosed": bool(d), "gaps": gaps, **build_roadmap(db, gaps, enrolled)}


class ChatIn(BaseModel):
    message: str = Field(min_length=1, max_length=1000)


@router.post("/tutor/chat")
def chat(body: ChatIn, db: Session = Depends(get_db), user: User | None = Depends(get_optional_user)):
    q = ai.tokenize(body.message)
    skills_hit = set(ai.extract_skills(body.message))
    scored = []
    for c in db.scalars(select(Course).where(Course.published.is_(True))):
        text = " ".join([c.title, c.summary, *c.skills, *c.curriculum])
        s = len(q & ai.tokenize(text)) + 3 * len(skills_hit & set(c.skills))
        if s:
            scored.append((s, c))
    scored.sort(key=lambda x: -x[0])
    sources = [{"id": c.id, "title": c.title, "skills": c.skills, "summary": c.summary, "curriculum": c.curriculum}
               for _, c in scored[:3]]

    def gen() -> Iterator[str]:
        yield f"data: {json.dumps({'sources': [{'id': s['id'], 'title': s['title']} for s in sources]}, ensure_ascii=False)}\n\n"
        for chunk in ai.answer_stream(body.message, sources):
            yield f"data: {json.dumps({'delta': chunk}, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream", headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
