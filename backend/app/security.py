import base64
import hashlib
import hmac
import re
import secrets
from datetime import timedelta

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db, utcnow
from .models import User

ALGORITHM = "HS256"
PBKDF2_ITERATIONS = 310_000
PASSWORD_RULE = re.compile(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,64}$")
PASSWORD_RULE_MESSAGE = "비밀번호는 영문 대·소문자, 숫자, 특수문자를 모두 포함해 8자 이상이어야 합니다."

LEARNER, COMPANY, ADMIN, ADMIN_READONLY = "learner", "company", "admin", "admin_readonly"
ROLES = {LEARNER, COMPANY, ADMIN, ADMIN_READONLY}
ADMIN_ROLES = {ADMIN, ADMIN_READONLY}
READ_ONLY_MESSAGE = "테스트 관리자 계정은 읽기 전용(Read-Only)입니다. 데이터 생성·수정·삭제는 실제 관리자만 할 수 있습니다."

bearer = HTTPBearer(auto_error=False)


def validate_password(password: str) -> None:
    if not PASSWORD_RULE.match(password):
        raise ValueError(PASSWORD_RULE_MESSAGE)


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${base64.b64encode(salt).decode()}${base64.b64encode(digest).decode()}"


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False
    try:
        _, iterations, salt, digest = password_hash.split("$")
        expected = hashlib.pbkdf2_hmac("sha256", password.encode(), base64.b64decode(salt), int(iterations))
        return hmac.compare_digest(expected, base64.b64decode(digest))
    except ValueError:
        return False


def create_access_token(user: User) -> str:
    payload = {"sub": str(user.id), "role": user.role, "type": "access",
               "exp": utcnow() + timedelta(minutes=settings.access_token_expire_minutes)}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=ALGORITHM)


def user_from_token(db: Session, token: str | None) -> User | None:
    if not token:
        return None
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None
    user = db.get(User, int(payload["sub"])) if payload.get("type") == "access" else None
    return user if user and user.is_active else None


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
                     db: Session = Depends(get_db)) -> User:
    user = user_from_token(db, credentials.credentials if credentials else None)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "로그인이 필요합니다.")
    return user


def get_optional_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
                      db: Session = Depends(get_db)) -> User | None:
    return user_from_token(db, credentials.credentials if credentials else None)


def require_admin_read(user: User = Depends(get_current_user)) -> User:
    if user.role not in ADMIN_ROLES:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "관리자 권한이 필요합니다.")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role == ADMIN_READONLY:
        raise HTTPException(status.HTTP_403_FORBIDDEN, READ_ONLY_MESSAGE)
    if user.role != ADMIN:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "관리자 권한이 필요합니다.")
    return user


def require_company(user: User = Depends(get_current_user)) -> User:
    if user.role not in {COMPANY, ADMIN, ADMIN_READONLY}:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "기업 담당자 권한이 필요합니다.")
    return user


def is_read_only_token(db: Session, token: str) -> bool:
    user = user_from_token(db, token)
    return bool(user and user.role == ADMIN_READONLY)
