#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/ninoaztec-code/gerador-carrossel.git"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
APP_DIR="${APP_DIR:-$SCRIPT_REPO_DIR}"

if [ ! -d "$APP_DIR/.git" ]; then
  APP_DIR="/opt/gerador-carrossel"
fi

if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git fetch origin
  git checkout main
  git pull --ff-only origin main
else
  mkdir -p "$APP_DIR"
  git clone --branch main "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

export APP_GIT_SHA="$(git rev-parse HEAD)"

if [ -z "${CAROUSEL_API_KEY:-}" ]; then
  echo "ERRO: defina CAROUSEL_API_KEY no ambiente ou em $APP_DIR/.env"
  exit 2
fi

echo "DEPLOY_DIR=$APP_DIR"
echo "DEPLOY_COMMIT=$APP_GIT_SHA"

# O container usa nome fixo. Remover uma instância antiga evita conflito entre
# projetos Compose diferentes; o volume nomeado carousel-projects é preservado.
if docker container inspect gerador-carrossel >/dev/null 2>&1; then
  echo "Removendo container anterior gerador-carrossel (volume preservado)..."
  docker rm -f gerador-carrossel >/dev/null
fi

docker compose -f compose.vps.yml up -d --build

docker compose -f compose.vps.yml ps

echo "Aguardando gerador-carrossel ficar healthy..."
healthy=""
for _ in $(seq 1 60); do
  status="$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' gerador-carrossel 2>/dev/null || true)"
  if [ "$status" = "healthy" ]; then
    healthy="yes"
    break
  fi
  if [ "$status" = "unhealthy" ] || [ "$status" = "exited" ] || [ "$status" = "dead" ]; then
    echo "ERRO: container em estado $status"
    docker logs --tail 120 gerador-carrossel || true
    exit 3
  fi
  sleep 1
done

if [ "$healthy" != "yes" ]; then
  echo "ERRO: timeout aguardando healthcheck"
  docker inspect --format='{{json .State.Health}}' gerador-carrossel || true
  docker logs --tail 120 gerador-carrossel || true
  exit 3
fi

echo "CONTAINER_HEALTH=healthy"
container_sha="$(docker exec gerador-carrossel sh -lc 'printf %s "$APP_GIT_SHA"')"
echo "CONTAINER_APP_GIT_SHA=${container_sha:-unknown}"
if [ "$container_sha" != "$APP_GIT_SHA" ]; then
  echo "ERRO: APP_GIT_SHA do container não corresponde ao commit implantado"
  exit 4
fi

node <<'NODE'
const base = "http://127.0.0.1:3007";
const auth = process.env.HERMES_API_KEY
  ? { Authorization: `Bearer ${process.env.HERMES_API_KEY}` }
  : {};

async function jsonRequest(path, init = {}) {
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      ...auth,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  return { response, data };
}

(async () => {
  const healthResponse = await fetch(`${base}/api/hermes/projects`, { headers: auth, cache: "no-store" });
  const health = await healthResponse.json();
  console.log(`HEALTH_HTTP=${healthResponse.status}`);
  console.log(`PERSISTENCE=${health.persistence || "unknown"}`);
  console.log(`BUILD_COMMIT=${health.build?.commit || "unknown"}`);
  if (!healthResponse.ok) throw new Error(`health HTTP ${healthResponse.status}`);
  if (health.persistence !== "local-volume") {
    throw new Error(`persistência inesperada: ${health.persistence || "unknown"}`);
  }
  if (health.build?.commit !== process.env.APP_GIT_SHA) {
    throw new Error(`build commit inesperado: API=${health.build?.commit || "unknown"} deploy=${process.env.APP_GIT_SHA}`);
  }

  const projectId = `DEPLOY-SMOKE-${Date.now()}`;
  const payload = {
    project_id: projectId,
    template: "T01",
    title: "Deploy smoke test",
    cards: [{ card: 1, headline: "Deploy smoke test" }],
  };

  try {
    const created = await jsonRequest("/api/hermes/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!created.response.ok || !created.data?.ok) {
      throw new Error(`POST Hermes falhou: HTTP ${created.response.status} ${JSON.stringify(created.data)}`);
    }
    console.log(`SMOKE_CREATE_HTTP=${created.response.status}`);

    const publicOrigin = (process.env.CAROUSEL_PUBLIC_ORIGIN || "https://carrossel.magodastesouras.com.br").replace(/\/+$/, "");
    if (!String(created.data.render_html_url || "").startsWith(`${publicOrigin}/`)) {
      throw new Error(`render_html_url não usa origem pública: ${created.data.render_html_url}`);
    }

    const loaded = await jsonRequest(`/api/projects/${encodeURIComponent(projectId)}`);
    if (!loaded.response.ok || loaded.data?.project_id !== projectId) {
      throw new Error(`GET projeto falhou: HTTP ${loaded.response.status} ${JSON.stringify(loaded.data)}`);
    }
    console.log(`SMOKE_READ_HTTP=${loaded.response.status}`);

    const rendered = await fetch(`${base}/api/hermes/render-project?project_id=${encodeURIComponent(projectId)}&card=1`, {
      headers: auth,
      cache: "no-store",
    });
    const renderedBody = await rendered.text();
    if (!rendered.ok || !rendered.headers.get("content-type")?.includes("text/html") || !renderedBody.includes('id="card-1"')) {
      throw new Error(`render falhou: HTTP ${rendered.status}`);
    }
    console.log(`SMOKE_RENDER_HTTP=${rendered.status}`);
  } finally {
    const removed = await jsonRequest(`/api/projects/${encodeURIComponent(projectId)}`, { method: "DELETE" }).catch(() => null);
    if (removed) console.log(`SMOKE_DELETE_HTTP=${removed.response.status}`);
  }

  console.log("SMOKE_HERMES_RENDER=OK");
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
NODE

echo "GERADOR_CARROSSEL_LOCAL=http://127.0.0.1:3007"
echo "HERMES_PROJECTS=http://127.0.0.1:3007/api/hermes/projects"
echo "APP_GIT_SHA=$APP_GIT_SHA"
echo "STATUS=OK"
