#!/usr/bin/env bash
# Render REST API 로 특정 서비스 배포를 트리거하고 완료(live)까지 대기한다.
# 사용: render-deploy.sh <service-name> [service-id] [expected-root-dir ("." = 저장소 루트)]
# 필요: RENDER_API_KEY (GitHub Secret). Deploy Hook URL 은 사용하지 않는다.
set -euo pipefail
NAME="$1"; ID="${2:-}"; EXPECT_ROOT="${3:-}"
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
SVC=$(curl -fsS "${AUTH[@]}" "${API}/services/${ID}")
OWNER=$(echo "$SVC" | jq -r '.ownerId')
echo "$SVC" | jq '{name, type, repo, branch, rootDir, autoDeploy, env: .serviceDetails.env, runtime: .serviceDetails.runtime,
  dockerfilePath: .serviceDetails.envSpecificDetails.dockerfilePath, dockerContext: .serviceDetails.envSpecificDetails.dockerContext,
  buildCommand: (.serviceDetails.envSpecificDetails.buildCommand // .serviceDetails.buildCommand), publishPath: .serviceDetails.publishPath}' || true

# 서비스 Root Directory 가 저장소 구조와 다르면 API 로 교정한다 (예: Docker 서비스는 루트의 Dockerfile 을 써야 함)
if [ -n "$EXPECT_ROOT" ]; then
  WANT=$([ "$EXPECT_ROOT" = "." ] && echo "" || echo "$EXPECT_ROOT")
  HAVE=$(echo "$SVC" | jq -r '.rootDir // ""')
  if [ "$HAVE" != "$WANT" ]; then
    echo "::warning::${NAME} Root Directory '${HAVE}' -> '${WANT:-<repo root>}' 로 교정합니다."
    curl -fsS -X PATCH "${AUTH[@]}" -H "Content-Type: application/json" -d "$(jq -n --arg r "$WANT" '{rootDir: $r}')"       "${API}/services/${ID}" | jq '{name, rootDir}'
  fi
fi

# DATABASE_URL 이 플레이스홀더(예시) 값인지 경고한다
DBV=$(echo "$SVC" | jq -r '[.envVars[]? | select(.key == "DATABASE_URL")] | .[0].value // empty')
if [ -n "$DBV" ] && echo "$DBV" | grep -qi 'USER:PASS@HOST'; then
  echo "::warning::Render 의 DATABASE_URL 이 예시 값(USER:PASS@HOST)입니다. 앱은 SQLite 로 대체 동작합니다. TiDB 를 쓰려면 Render 환경 변수를 실제 주소로 교체하세요."
fi

print_logs() {
  echo "::group::Render ${1} logs (최근 150줄)"
  curl -fsS "${AUTH[@]}" "${API}/logs?ownerId=${OWNER}&resource=${ID}&type=${1}&direction=backward&limit=150"     | jq -r '.logs | reverse | .[] | "\(.timestamp) \(.message)"' || echo "(로그 조회 실패)"
  echo "::endgroup::"
}

DEPLOY=$(curl -fsS -X POST "${AUTH[@]}" -H "Content-Type: application/json" \
  -d "{\"clearCache\":\"do_not_clear\",\"commitId\":\"${GITHUB_SHA}\"}" "${API}/services/${ID}/deploys" | jq -r '.id')
echo "deploy ${DEPLOY} started (commit ${GITHUB_SHA})"

for _ in $(seq 1 90); do
  STATUS=$(curl -fsS "${AUTH[@]}" "${API}/services/${ID}/deploys/${DEPLOY}" | jq -r '.status')
  echo "status: ${STATUS}"
  case "$STATUS" in
    live) echo "✅ ${NAME} 배포 완료"; exit 0 ;;
    build_failed|update_failed|canceled|deactivated|pre_deploy_failed) print_logs build; print_logs app; echo "::error::${NAME} 배포 실패 (${STATUS}) - 위 Render logs 그룹을 확인하세요"; exit 1 ;;
  esac
  sleep 20
done
echo "::error::${NAME} 배포 대기 시간 초과"; exit 1
