from datetime import date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base, utcnow


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(190), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    password_hash: Mapped[str | None] = mapped_column(String(300), nullable=True)
    role: Mapped[str] = mapped_column(String(20), default="learner")
    provider: Mapped[str] = mapped_column(String(20), default="local")
    target_job: Mapped[str] = mapped_column(String(60), default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Skill(Base):
    __tablename__ = "skills"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(60), unique=True)
    category: Mapped[str] = mapped_column(String(40))


class Course(Base):
    __tablename__ = "courses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    instructor: Mapped[str] = mapped_column(String(80))
    level: Mapped[str] = mapped_column(String(20))
    hours: Mapped[int] = mapped_column(Integer, default=10)
    hue: Mapped[int] = mapped_column(Integer, default=250)
    summary: Mapped[str] = mapped_column(Text, default="")
    skills: Mapped[list] = mapped_column(JSON, default=list)
    curriculum: Mapped[list] = mapped_column(JSON, default=list)
    rating: Mapped[float] = mapped_column(Float, default=4.5)
    learners: Mapped[int] = mapped_column(Integer, default=0)
    published: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Enrollment(Base):
    __tablename__ = "enrollments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id", ondelete="CASCADE"), index=True)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class DemandStat(Base):
    __tablename__ = "demand_stats"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    month: Mapped[str] = mapped_column(String(7), index=True)
    job: Mapped[str] = mapped_column(String(60), index=True)
    industry: Mapped[str] = mapped_column(String(40), index=True)
    region: Mapped[str] = mapped_column(String(40), index=True)
    skill: Mapped[str] = mapped_column(String(60), index=True)
    count: Mapped[int] = mapped_column(Integer)


class DemandPost(Base):
    __tablename__ = "demand_posts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    company: Mapped[str] = mapped_column(String(100), default="")
    job: Mapped[str] = mapped_column(String(60))
    industry: Mapped[str] = mapped_column(String(40), default="")
    region: Mapped[str] = mapped_column(String(40), default="")
    requirements: Mapped[str] = mapped_column(Text)
    structured: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Diagnosis(Base):
    __tablename__ = "diagnoses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    job: Mapped[str] = mapped_column(String(60))
    scores: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class Notice(Base):
    __tablename__ = "notices"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text, default="")
    pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)


class DailyMetric(Base):
    __tablename__ = "daily_metrics"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    day: Mapped[date] = mapped_column(Date, unique=True)
    active_users: Mapped[int] = mapped_column(Integer)
    collected: Mapped[int] = mapped_column(Integer)
    analysis_total: Mapped[int] = mapped_column(Integer)
    analysis_ok: Mapped[int] = mapped_column(Integer)
    reco_impressions: Mapped[int] = mapped_column(Integer)
    reco_clicks: Mapped[int] = mapped_column(Integer)
    enroll_conversions: Mapped[int] = mapped_column(Integer)
    avg_progress: Mapped[float] = mapped_column(Float)
    completion_rate: Mapped[float] = mapped_column(Float)
