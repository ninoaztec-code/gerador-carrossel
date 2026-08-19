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

async function jsonResult(response: Response) {
  const data = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data };
}

export async function createRemoteProject(body: unknown) {
  const response = await fetch(`${baseUrl()}/projects`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json", Accept: "application/json" }),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return jsonResult(response);
}

export async function getRemoteProject(projectId: string) {
  const response = await fetch(`${baseUrl()}/projects/${encodeURIComponent(projectId)}`, {
    headers: authHeaders({ Accept: "application/json" }),
    cache: "no-store",
  });
  return jsonResult(response);
}

export async function putRemoteProject(projectId: string, body: unknown) {
  const response = await fetch(`${baseUrl()}/projects/${encodeURIComponent(projectId)}`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json", Accept: "application/json" }),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return jsonResult(response);
}

export async function deleteRemoteProject(projectId: string) {
  const response = await fetch(`${baseUrl()}/projects/${encodeURIComponent(projectId)}`, {
    method: "DELETE",
    headers: authHeaders({ "X-Confirm-Delete": "true", Accept: "application/json" }),
    cache: "no-store",
  });
  return jsonResult(response);
}

export async function getRemoteImage(photoId: string) {
  return fetch(`${baseUrl()}/library-images/${encodeURIComponent(photoId)}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
}
