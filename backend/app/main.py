import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool

from .config import settings
from .database import Base, SessionLocal, engine
from .routers import admin, auth, content, demand, learn
from .security import READ_ONLY_MESSAGE, is_read_only_token
from .services.seed import run_seed

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        run_seed(db)
    yield


app = FastAPI(title="cognipick API", version="1.0.0", lifespan=lifespan,
              description="기업 수요 분석 · AI 역량 진단 · 맞춤 학습 추천 플랫폼")
SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
# 데이터를 변경하지 않는 읽기성 POST (AI 튜터 질의)
READ_ONLY_ALLOWED = ("/api/auth/", "/api/tutor/")


def _token_is_read_only(token: str) -> bool:
    with SessionLocal() as db:
        return is_read_only_token(db, token)


@app.middleware("http")
async def read_only_guard(request: Request, call_next):
    """admin_readonly(테스트 관리자) 토큰의 POST/PUT/PATCH/DELETE 를 API 진입 전에 403 으로 일괄 차단한다."""
    path, header = request.url.path, request.headers.get("authorization", "")
    if (request.method not in SAFE_METHODS and path.startswith("/api/") and not path.startswith(READ_ONLY_ALLOWED)
            and header.lower().startswith("bearer ") and await run_in_threadpool(_token_is_read_only, header[7:].strip())):
        return JSONResponse({"detail": READ_ONLY_MESSAGE, "read_only": True}, status_code=403)
    return await call_next(request)


app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins, allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

for r in (auth.router, content.router, demand.router, learn.router, admin.router):
    app.include_router(r)


@app.get("/", tags=["health"])
def root():
    return {"service": "cognipick-api", "docs": "/docs", "health": "/health"}


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
