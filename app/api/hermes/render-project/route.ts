import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { CarouselDocument, validateCarousel } from "@/lib/carousel";

export const runtime = "nodejs";

const STORE_DIR = process.env.HERMES_PROJECT_DIR || "/app/data/hermes-projects";

function safeId(value: unknown) {
  const raw = String(value || "").trim();
  return /^[A-Za-z0-9._-]{3,120}$/.test(raw) ? raw : "";
}

export async function GET(req: NextRequest) {
  const projectId = safeId(req.nextUrl.searchParams.get("project_id") || req.nextUrl.searchParams.get("project"));
  if (!projectId) return NextResponse.json({ ok: false, error: "missing_project_id" }, { status: 400 });

  try {
    const document = JSON.parse(await readFile(path.join(STORE_DIR, `${projectId}.json`), "utf8")) as CarouselDocument;
    const errors = validateCarousel(document);
    if (errors.length) return NextResponse.json({ ok: false, errors }, { status: 422 });

    const renderUrl = new URL("/api/hermes/render-html", req.nextUrl.origin);
    const response = await fetch(renderUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(document),
      cache: "no-store",
    });

    const body = await response.text();
    return new NextResponse(body, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "text/html; charset=utf-8",
        "x-carousel-project": projectId,
        "x-carousel-source": "hermes-project-store",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "project_not_found", project_id: projectId }, { status: 404 });
  }
}
