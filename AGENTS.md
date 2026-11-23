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
- Deploy: push to `main` -> Render (`render.yaml`, autoDeploy + buildFilter) and Netlify Git integration. Do NOT use `RENDER_*_DEPLOY_HOOK` secrets.
- Shell heredocs over ~4KB get truncated; create big files with the write tool.

## Workflow
- Report in Korean. Commit and push to `origin main` after each task. Never commit `.env` or DB files.
