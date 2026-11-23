import hmac
import secrets
from urllib.parse import urlencode

import httpx
import jwt
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import User
from ..security import (ADMIN, ADMIN_READONLY, COMPANY, LEARNER, create_access_token, get_current_user, hash_password,
                        validate_password, verify_password)

router = APIRouter(prefix="/api/auth", tags=["auth"])

TEST_ACCOUNTS = {LEARNER: "learner@cognipick.dev", COMPANY: "company@cognipick.dev", ADMIN_READONLY: "readonly@cognipick.dev"}
OAUTH = {
    "google": ("https://accounts.google.com/o/oauth2/v2/auth", "https://oauth2.googleapis.com/token",
               "https://openidconnect.googleapis.com/v1/userinfo", "openid email profile"),
    "naver": ("https://nid.naver.com/oauth2.0/authorize", "https://nid.naver.com/oauth2.0/token",
              "https://openapi.naver.com/v1/nid/me", ""),
    "kakao": ("https://kauth.kakao.com/oauth/authorize", "https://kauth.kakao.com/oauth/token",
              "https://kapi.kakao.com/v2/user/me", "account_email profile_nickname"),
}


def user_out(u: User) -> dict:
    return {"id": u.id, "email": u.email, "name": u.name, "role": u.role, "target_job": u.target_job, "provider": u.provider}


def token_out(u: User) -> dict:
    return {"access_token": create_access_token(u), "token_type": "bearer", "user": user_out(u)}


class RegisterIn(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=50)
    password: str
    role: str = LEARNER


class LoginIn(BaseModel):
    email: EmailStr
    password: str


@router.post("/register")
def register(body: RegisterIn, db: Session = Depends(get_db)):
    try:
        validate_password(body.password)
    except ValueError as e:
        raise HTTPException(422, str(e)) from e
    if body.role not in {LEARNER, COMPANY}:
        raise HTTPException(422, "가입 가능한 유형은 학습자 또는 기업 담당자입니다.")
    if db.scalar(select(User).where(User.email == body.email)):
        raise HTTPException(409, "이미 가입된 이메일입니다.")
    u = User(email=body.email, name=body.name, role=body.role, password_hash=hash_password(body.password))
    db.add(u)
    db.commit()
    return token_out(u)


@router.post("/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    u = db.scalar(select(User).where(User.email == body.email))
    if not u or not u.is_active or not verify_password(body.password, u.password_hash):
        raise HTTPException(401, "이메일 또는 비밀번호가 올바르지 않습니다.")
    return token_out(u)


class TestLoginIn(BaseModel):
    role: str


@router.post("/test-login")
def test_login(body: TestLoginIn, db: Session = Depends(get_db)):
    if not settings.enable_test_login:
        raise HTTPException(404, "테스트 로그인이 비활성화되어 있습니다.")
    email = TEST_ACCOUNTS.get(body.role)
    u = db.scalar(select(User).where(User.email == email)) if email else None
    if not u:
        raise HTTPException(422, "지원하지 않는 테스트 계정입니다.")
    return token_out(u)


class AdminLoginIn(BaseModel):
    key: str


@router.post("/admin-login")
def admin_login(body: AdminLoginIn, db: Session = Depends(get_db)):
    """실제 관리자: 서버 환경 변수 ADMIN_SECRET_KEY 와 일치할 때만 발급 (검증은 백엔드에서만)."""
    if not settings.admin_secret_key or not hmac.compare_digest(body.key.encode(), settings.admin_secret_key.encode()):
        raise HTTPException(401, "관리자 키가 올바르지 않습니다.")
    u = db.scalar(select(User).where(User.email == settings.admin_email))
    if not u:
        u = User(email=settings.admin_email, name="플랫폼 관리자", role=ADMIN)
        db.add(u)
    u.role = ADMIN
    db.commit()
    return token_out(u)


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return user_out(user)


@router.get("/providers")
def providers():
    return {p: bool(c[0] and c[1]) for p, c in settings.oauth.items()}


def _redirect_uri(provider: str) -> str:
    return f"{settings.backend_public_url}/api/auth/oauth/{provider}/callback"


@router.get("/oauth/{provider}/start")
def oauth_start(provider: str):
    cid, secret = settings.oauth.get(provider, ("", ""))
    if provider not in OAUTH or not (cid and secret):
        return RedirectResponse(f"{settings.frontend_url}/login?oauth_error=not_configured&provider={provider}")
    state = jwt.encode({"p": provider, "n": secrets.token_urlsafe(8)}, settings.jwt_secret_key, algorithm="HS256")
    auth_url, _, _, scope = OAUTH[provider]
    q = {"client_id": cid, "redirect_uri": _redirect_uri(provider), "response_type": "code", "state": state}
    if scope:
        q["scope"] = scope
    return RedirectResponse(f"{auth_url}?{urlencode(q)}")


@router.get("/oauth/{provider}/callback")
def oauth_callback(provider: str, code: str = "", state: str = "", db: Session = Depends(get_db)):
    fail = RedirectResponse(f"{settings.frontend_url}/login?oauth_error=failed&provider={provider}")
    cid, secret = settings.oauth.get(provider, ("", ""))
    try:
        if jwt.decode(state, settings.jwt_secret_key, algorithms=["HS256"]).get("p") != provider or not code:
            return fail
        _, token_url, info_url, _ = OAUTH[provider]
        tk = httpx.post(token_url, data={"grant_type": "authorization_code", "code": code, "client_id": cid, "client_secret": secret,
                                         "redirect_uri": _redirect_uri(provider), "state": state}, timeout=15).json()
        info = httpx.get(info_url, headers={"Authorization": f"Bearer {tk['access_token']}"}, timeout=15).json()
    except (jwt.PyJWTError, KeyError, httpx.HTTPError, ValueError):
        return fail
    if provider == "naver":
        info = info.get("response", {})
        email, name = info.get("email"), info.get("name") or info.get("nickname")
    elif provider == "kakao":
        email, name = info.get("kakao_account", {}).get("email"), info.get("properties", {}).get("nickname")
    else:
        email, name = info.get("email"), info.get("name")
    if not email:
        return fail
    u = db.scalar(select(User).where(User.email == email))
    if not u:
        u = User(email=email, name=name or email.split("@")[0], role=LEARNER, provider=provider)
        db.add(u)
        db.commit()
    return RedirectResponse(f"{settings.frontend_url}/oauth/callback#token={create_access_token(u)}")
