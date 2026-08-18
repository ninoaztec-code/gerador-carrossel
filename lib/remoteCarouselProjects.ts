const DEFAULT_BASE = "https://carrossel.magodastesouras.com.br";

function baseUrl() {
  return (process.env.CAROUSEL_API_BASE || DEFAULT_BASE).replace(/\/$/, "");
}

function apiKey() {
  const key = process.env.CAROUSEL_API_KEY;
  if (!key) throw new Error("CAROUSEL_API_KEY_missing");
  return key;
}

function authHeaders(extra?: HeadersInit): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey()}`,
    ...(extra || {}),
  };
}

export async function getRemoteProject(projectId: string) {
  const response = await fetch(`${baseUrl()}/projects/${encodeURIComponent(projectId)}`, {
    headers: authHeaders({ Accept: "application/json" }),
    cache: "no-store",
  });
  if (!response.ok) return { ok: false as const, status: response.status, data: null };
  return { ok: true as const, status: response.status, data: await response.json() };
}

export async function putRemoteProject(projectId: string, body: unknown) {
  const response = await fetch(`${baseUrl()}/projects/${encodeURIComponent(projectId)}`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json", Accept: "application/json" }),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data };
}

export async function deleteRemoteProject(projectId: string) {
  const response = await fetch(`${baseUrl()}/projects/${encodeURIComponent(projectId)}`, {
    method: "DELETE",
    headers: authHeaders({ "X-Confirm-Delete": "true", Accept: "application/json" }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data };
}

export async function getRemoteImage(photoId: string) {
  return fetch(`${baseUrl()}/library-images/${encodeURIComponent(photoId)}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
}
