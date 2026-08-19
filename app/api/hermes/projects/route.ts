import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { CarouselDocument, validateCarousel } from "@/lib/carousel";

export const runtime = "nodejs";

const STORE_DIR = process.env.HERMES_PROJECT_DIR || "/app/data/hermes-projects";

function authorized(req: NextRequest) {
  const secret = process.env.HERMES_API_KEY;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

function safeId(value: unknown) {
  const raw = String(value || "").trim();
  return /^[A-Za-z0-9._-]{3,120}$/.test(raw) ? raw : "";
}

function extractDocument(body: unknown): CarouselDocument | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  const candidate = record.document || record.carousel || record.payload || body;
  return candidate && typeof candidate === "object" ? candidate as CarouselDocument : null;
}

function projectIdFrom(body: unknown, doc: CarouselDocument | null) {
  const record = body && typeof body === "object" ? body as Record<string, unknown> : {};
  return safeId(record.project_id || record.projectId || record.id || doc?.id);
}

function urls(req: NextRequest, projectId: string) {
  const origin = req.nextUrl.origin;
  return {
    studio_url: new URL(`/studio?project=${encodeURIComponent(projectId)}`, origin).toString(),
    render_url: new URL(`/api/hermes/render-project?project_id=${encodeURIComponent(projectId)}`, origin).toString(),
  };
}

async function readProject(projectId: string) {
  const file = path.join(STORE_DIR, `${projectId}.json`);
  return JSON.parse(await readFile(file, "utf8")) as CarouselDocument;
}

export async function GET(req: NextRequest) {
  const projectId = safeId(req.nextUrl.searchParams.get("project_id") || req.nextUrl.searchParams.get("project"));
  if (!projectId) {
    const origin = req.nextUrl.origin;
    return NextResponse.json({
      ok: true,
      service: "hermes-studio-project-bridge",
      endpoint: "/api/hermes/projects",
      method: "POST",
      purpose: "Salva o projeto na VPS e devolve links do Studio e do render.",
      studio_origin: origin,
      studio_example: new URL("/studio?project=PROJECT_ID", origin).toString(),
      render_endpoint: new URL("/api/hermes/render-project?project_id=PROJECT_ID", origin).toString(),
    });
  }

  try {
    const document = await readProject(projectId);
    return NextResponse.json({ ok: true, project_id: projectId, document, ...urls(req, projectId) });
  } catch {
    return NextResponse.json({ ok: false, error: "project_not_found", project_id: projectId }, { status: 404 });
  }
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const document = extractDocument(body);
    if (!document) return NextResponse.json({ ok: false, error: "missing_document" }, { status: 400 });

    const errors = validateCarousel(document);
    if (errors.length) return NextResponse.json({ ok: false, errors }, { status: 422 });

    const projectId = projectIdFrom(body, document);
    if (!projectId) return NextResponse.json({ ok: false, error: "invalid_project_id" }, { status: 400 });

    document.id = document.id || projectId;
    await mkdir(STORE_DIR, { recursive: true });
    await writeFile(path.join(STORE_DIR, `${projectId}.json`), JSON.stringify(document, null, 2), "utf8");

    return NextResponse.json({
      ok: true,
      project_id: projectId,
      saved: true,
      document,
      ...urls(req, projectId),
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "invalid_json" }, { status: 400 });
  }
}
