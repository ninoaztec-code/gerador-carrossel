import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";

const PROJECT_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;

type ProjectResult = {
  ok: boolean;
  status: number;
  data: unknown;
};

function projectsDir() {
  return process.env.CAROUSEL_PROJECTS_DIR?.trim() || "";
}

function remoteBaseUrl() {
  const value = process.env.CAROUSEL_API_BASE?.trim();
  if (!value) throw new Error("CAROUSEL_API_BASE_missing");
  return value.replace(/\/+$/, "");
}

function imageBaseUrl() {
  const value = process.env.CAROUSEL_IMAGE_API_BASE?.trim() || process.env.CAROUSEL_API_BASE?.trim();
  return value ? value.replace(/\/+$/, "") : "";
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

async function jsonResult(response: Response): Promise<ProjectResult> {
  const data = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, data };
}

function projectPath(projectId: string) {
  if (!PROJECT_ID_RE.test(projectId) || projectId === "." || projectId === ".." || projectId.includes("..")) {
    throw new Error("invalid_project_id");
  }
  return join(projectsDir(), `${projectId}.json`);
}

async function ensureProjectDir() {
  const dir = projectsDir();
  if (!dir) return;
  await mkdir(dir, { recursive: true });
}

function asRecord(body: unknown): Record<string, unknown> | null {
  return body && typeof body === "object" && !Array.isArray(body) ? body as Record<string, unknown> : null;
}

async function readLocalProject(projectId: string): Promise<ProjectResult> {
  try {
    await ensureProjectDir();
    const data = JSON.parse(await readFile(projectPath(projectId), "utf-8"));
    return { ok: true, status: 200, data };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") return { ok: false, status: 404, data: { ok: false, error: "project_not_found" } };
    if (error instanceof Error && error.message === "invalid_project_id") {
      return { ok: false, status: 400, data: { ok: false, error: "invalid_project_id" } };
    }
    throw error;
  }
}

async function atomicWriteLocal(projectId: string, data: Record<string, unknown>) {
  await ensureProjectDir();
  const target = projectPath(projectId);
  const temp = `${target}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temp, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
  await rename(temp, target);
}

async function createLocalProject(body: unknown): Promise<ProjectResult> {
  const obj = asRecord(body);
  const projectId = String(obj?.project_id || "");
  if (!obj || !PROJECT_ID_RE.test(projectId) || projectId.includes("..")) {
    return { ok: false, status: 400, data: { ok: false, error: "invalid_project_id" } };
  }

  const existing = await readLocalProject(projectId);
  if (existing.ok) return { ok: false, status: 409, data: { ok: false, error: "project_exists" } };
  if (existing.status !== 404) return existing;

  const now = new Date().toISOString();
  const data = { ...obj, project_id: projectId, created_at: obj.created_at || now, updated_at: now };
  await atomicWriteLocal(projectId, data);
  return { ok: true, status: 201, data };
}

async function putLocalProject(projectId: string, body: unknown): Promise<ProjectResult> {
  const obj = asRecord(body);
  if (!obj || !PROJECT_ID_RE.test(projectId) || projectId.includes("..")) {
    return { ok: false, status: 400, data: { ok: false, error: "invalid_project_id" } };
  }
  if (obj.project_id && String(obj.project_id) !== projectId) {
    return { ok: false, status: 409, data: { ok: false, error: "project_id_mismatch" } };
  }

  const existing = await readLocalProject(projectId);
  if (!existing.ok) return existing;
  const old = asRecord(existing.data) || {};
  const now = new Date().toISOString();
  const data = { ...obj, project_id: projectId, created_at: obj.created_at || old.created_at || now, updated_at: now };
  await atomicWriteLocal(projectId, data);
  return { ok: true, status: 200, data };
}

async function deleteLocalProject(projectId: string): Promise<ProjectResult> {
  try {
    await unlink(projectPath(projectId));
    return { ok: true, status: 200, data: { ok: true, project_id: projectId, deleted: true } };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") return { ok: false, status: 404, data: { ok: false, error: "project_not_found" } };
    if (error instanceof Error && error.message === "invalid_project_id") {
      return { ok: false, status: 400, data: { ok: false, error: "invalid_project_id" } };
    }
    throw error;
  }
}

export async function createRemoteProject(body: unknown) {
  if (projectsDir()) return createLocalProject(body);
  const response = await fetch(`${remoteBaseUrl()}/projects`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json", Accept: "application/json" }),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return jsonResult(response);
}

export async function getRemoteProject(projectId: string) {
  if (projectsDir()) return readLocalProject(projectId);
  const response = await fetch(`${remoteBaseUrl()}/projects/${encodeURIComponent(projectId)}`, {
    headers: authHeaders({ Accept: "application/json" }),
    cache: "no-store",
  });
  return jsonResult(response);
}

export async function putRemoteProject(projectId: string, body: unknown) {
  if (projectsDir()) return putLocalProject(projectId, body);
  const response = await fetch(`${remoteBaseUrl()}/projects/${encodeURIComponent(projectId)}`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json", Accept: "application/json" }),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return jsonResult(response);
}

export async function deleteRemoteProject(projectId: string) {
  if (projectsDir()) return deleteLocalProject(projectId);
  const response = await fetch(`${remoteBaseUrl()}/projects/${encodeURIComponent(projectId)}`, {
    method: "DELETE",
    headers: authHeaders({ "X-Confirm-Delete": "true", Accept: "application/json" }),
    cache: "no-store",
  });
  return jsonResult(response);
}

export async function getRemoteImage(photoId: string) {
  const base = imageBaseUrl();
  if (!base) return new Response(null, { status: 404 });
  return fetch(`${base}/library-images/${encodeURIComponent(photoId)}`, {
    headers: authHeaders(),
    cache: "no-store",
  });
}
