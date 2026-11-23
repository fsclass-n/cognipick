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

## 자동 배포 (GitHub Actions → Render API, Deploy Hook 미사용)
`main` 에 push 하면 `.github/workflows/deploy.yml` 이 변경 영역을 감지해 검증 후 Render REST API 로 배포합니다.

| 변경 경로 | 검증 | 배포 대상 |
|---|---|---|
| `backend/**`, `requirements.txt`, `Dockerfile` | pytest | Render Web Service `cognipick-api` |
| `frontend/**` | `npm run build` | Render Static Site `cognipick` |

최초 1회 설정
1. Render 에서 서비스를 직접 생성하고 **Auto-Deploy 를 Off** 로 둡니다 (중복 배포 방지).
   - Web Service `cognipick-api`: Runtime Docker, **Root Directory 비움(저장소 루트)**, Dockerfile `./Dockerfile`, Docker Context `.`, Health Check `/health`, 환경 변수는 `.env.example` 참고
   - Static Site `cognipick`: Root `frontend`, Build `npm ci && npm run build`, Publish `dist`, Rewrite `/*` → `/index.html`, 환경 변수 `VITE_API_BASE_URL=https://cognipick-api.onrender.com`
2. GitHub 저장소 Settings → Secrets → Actions 에 `RENDER_API_KEY` (Render Account Settings → API Keys) 등록
3. (선택) Variables 에 `RENDER_API_SERVICE_ID`, `RENDER_FRONTEND_SERVICE_ID` 등록 — 없으면 서비스 이름으로 자동 조회

`RENDER_API_DEPLOY_HOOK`, `RENDER_FRONTEND_DEPLOY_HOOK` 은 사용하지 않습니다. Actions 탭의 *Deploy → Run workflow* 로 수동 배포도 가능합니다.
Netlify 데모는 저장소 Git 연동으로 빌드되며 `netlify.toml` 의 `ignore` 로 `frontend/` 변경 시에만 빌드됩니다.
