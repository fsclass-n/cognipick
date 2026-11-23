# AGENTS.md - cognipick

## Commands (repo root)
- venv: `python -m venv .venv && .venv/Scripts/python -m pip install -r requirements.txt`
- Backend dev: `DATABASE_URL= .venv/Scripts/python -m uvicorn backend.app.main:app --reload --port 8000`
- Backend tests: `.venv/Scripts/python -m pytest backend/tests -q`
- Frontend (`frontend/`): `npm ci`, `npm run dev`, `npm run build` (build must pass before finishing)

## Conventions
- Single root `.env`; Vite uses `envDir: '..'`. Only `VITE_*` reach the frontend. Never put secrets in `VITE_*`.
- Roles: `learner`, `company`, `admin` (via `POST /api/auth/admin-login` with `ADMIN_SECRET_KEY`), `admin_readonly` (test admin).
  `read_only_guard` middleware in `backend/app/main.py` 403s non-GET `/api/*` for `admin_readonly` (except `/api/auth/*`, `/api/tutor/*`); frontend uses `WriteButton`/`useAuth().readOnly`.
- Tailwind v4: custom classes via `@utility` in `frontend/src/index.css`. Fonts: IBM Plex Sans KR (display) + Pretendard (body). Icons: FontAwesome only.
- Charts are hand-written SVG in `frontend/src/components/charts.jsx` (no chart lib).
- Deploy: push to `main` -> `.github/workflows/deploy.yml` (paths-filter -> test/build -> Render REST API via `.github/scripts/render-deploy.sh`, secret `RENDER_API_KEY`). Render services have Auto-Deploy Off; no Blueprint, no `RENDER_*_DEPLOY_HOOK`. Netlify uses Git integration.
- UI concept "Pick Signal": electric indigo `brand-*` + signal mint `accent` (use `text-accent-ink` on light bg, `text-ink` on mint fills); Sora (display) + Pretendard (body). Signature guitar-pick silhouette: `components/Logo.jsx`, `pick-mask` utility. Photos: Unsplash License images self-hosted as WebP in `frontend/public/images` (mapping + credits in `src/lib/photos.js`, shown on /info/data-sources); never hotlink or guess Unsplash URLs, never use Unsplash+ images. SNS buttons follow Kakao/Naver/Google brand guides (`components/SocialButtons.jsx`).
- Shell heredocs over ~4KB get truncated; create big files with the write tool.

## Workflow
- Report in Korean. Commit and push to `origin main` after each task. Never commit `.env` or DB files.
