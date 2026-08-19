#!/usr/bin/env bash
set -euo pipefail

REPO_URL="https://github.com/ninoaztec-code/gerador-carrossel.git"
DEFAULT_DIR="/root/hermes-workspace/gerador-carrossel-repo"
APP_DIR="${APP_DIR:-$DEFAULT_DIR}"

if [ ! -d "$APP_DIR/.git" ] && [ -d "/root/hermes-workspace/gerador-carrossel/.git" ]; then
  APP_DIR="/root/hermes-workspace/gerador-carrossel"
fi

if [ -d "$APP_DIR/.git" ]; then
  cd "$APP_DIR"
  git fetch origin
  git checkout main
  git pull --ff-only origin main
else
  mkdir -p "$(dirname "$APP_DIR")"
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

docker compose -f compose.vps.yml up -d --build

docker compose -f compose.vps.yml ps

node <<'NODE'
const base = "http://127.0.0.1:3007";
const auth = process.env.HERMES_API_KEY
  ? { Authorization: `Bearer ${process.env.HERMES_API_KEY}` }
  : {};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(path, attempts = 30) {
  let last;
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(`${base}${path}`, { headers: auth, cache: "no-store" });
      if (response.ok) return response;
      last = new Error(`${path}: HTTP ${response.status}`);
    } catch (error) {
      last = error;
    }
    await sleep(1000);
  }
  throw last || new Error(`${path}: indisponível`);
}

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
  const healthResponse = await fetchWithRetry("/api/hermes/projects");
  const health = await healthResponse.json();
  console.log(`HEALTH_HTTP=${healthResponse.status}`);
  console.log(`PERSISTENCE=${health.persistence || "unknown"}`);
  console.log(`BUILD_COMMIT=${health.build?.commit || "unknown"}`);
  if (health.persistence !== "local-volume") {
    throw new Error(`persistência inesperada: ${health.persistence || "unknown"}`);
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
