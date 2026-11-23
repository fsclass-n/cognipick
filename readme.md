# cognipick

AI 모델 및 K-AI 데이터 분석을 통한 기업 수요 반영 비즈니스 플랫폼 구축 · AI 기반 지능형 학습 플랫폼 개발 및 운영 시스템

기업 채용·직무 데이터를 분석해 요구 역량을 도출하고, 학습자의 AI 역량 진단 결과와 매칭해 **맞춤 학습 경로(Pick)** 를 추천합니다.

| 구분 | URL |
|---|---|
| GitHub | https://github.com/fsclass-n/cognipick |
| Frontend (Netlify 데모) | https://cognipick.netlify.app |
| Frontend (Render) | https://cognipick.onrender.com |
| Backend API (Render) | https://cognipick-api.onrender.com |

팀: 김모란(조장) · 박미금 · 이오리 · 홍기흥

## 구조
- `backend/` FastAPI (JWT, 권한, 강의/수요 분석/진단/추천/AI 튜터/관리자 API)
- `frontend/` React(Vite) + Tailwind CSS v4 (MainLayout/AuthLayout, 디자인 토큰, SVG 차트)
- `render.yaml`, `netlify.toml`, `.github/workflows/ci.yml`

## 로컬 실행
```bash
python -m venv .venv && .venv/Scripts/python -m pip install -r requirements.txt
cp .env.example .env
DATABASE_URL= .venv/Scripts/python -m uvicorn backend.app.main:app --reload --port 8000
cd frontend && npm ci && npm run dev
```

## 권한
`learner` / `company` / `admin`(서버 `ADMIN_SECRET_KEY` 로 로그인) / `admin_readonly`(테스트 관리자: 모든 관리자 화면 조회 가능, 변경 요청은 서버에서 403 차단)

## 자동 배포 (Deploy Hook 미사용)
`main` 에 push 하면 Render Blueprint(`render.yaml`, `autoDeploy` + `buildFilter`)와 Netlify Git 연동이 변경된 서비스만 자동 배포합니다.
`RENDER_API_DEPLOY_HOOK`, `RENDER_FRONTEND_DEPLOY_HOOK` Secret 은 필요하지 않으며, GitHub Actions 는 테스트/빌드 검증(CI)만 수행합니다.
최초 1회: Render 에서 *New > Blueprint* 로 저장소 연결, Netlify 에서 저장소 import. `DATABASE_URL`, `GEMINI_API_KEY` 등 `sync: false` 값은 Render 대시보드에서 입력합니다.
