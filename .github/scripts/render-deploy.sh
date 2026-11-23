#!/usr/bin/env bash
# Render REST API 로 특정 서비스 배포를 트리거하고 완료(live)까지 대기한다.
# 사용: render-deploy.sh <service-name> [service-id]
# 필요: RENDER_API_KEY (GitHub Secret). Deploy Hook URL 은 사용하지 않는다.
set -euo pipefail
NAME="$1"; ID="${2:-}"
API="https://api.render.com/v1"
AUTH=(-H "Authorization: Bearer ${RENDER_API_KEY}" -H "Accept: application/json")

if [ -z "${RENDER_API_KEY:-}" ]; then
  echo "::warning::RENDER_API_KEY 시크릿이 없어 ${NAME} 배포를 건너뜁니다."; exit 0
fi
if [ -z "$ID" ]; then
  ID=$(curl -fsS "${AUTH[@]}" "${API}/services?name=${NAME}&limit=20" | jq -r --arg n "$NAME" '[.[] | .service | select(.name == $n)][0].id // empty')
fi
[ -n "$ID" ] || { echo "::error::Render 서비스 '${NAME}' 를 찾지 못했습니다."; exit 1; }
echo "service ${NAME} -> ${ID}"

DEPLOY=$(curl -fsS -X POST "${AUTH[@]}" -H "Content-Type: application/json" \
  -d "{\"clearCache\":\"do_not_clear\",\"commitId\":\"${GITHUB_SHA}\"}" "${API}/services/${ID}/deploys" | jq -r '.id')
echo "deploy ${DEPLOY} started (commit ${GITHUB_SHA})"

for _ in $(seq 1 90); do
  STATUS=$(curl -fsS "${AUTH[@]}" "${API}/services/${ID}/deploys/${DEPLOY}" | jq -r '.status')
  echo "status: ${STATUS}"
  case "$STATUS" in
    live) echo "✅ ${NAME} 배포 완료"; exit 0 ;;
    build_failed|update_failed|canceled|deactivated|pre_deploy_failed) echo "::error::${NAME} 배포 실패 (${STATUS})"; exit 1 ;;
  esac
  sleep 20
done
echo "::error::${NAME} 배포 대기 시간 초과"; exit 1
