import { NextRequest, NextResponse } from "next/server";
import { OFFICIAL_PROJECTS } from "@/lib/officialPautaProjects";
import { carouselPublicOrigin } from "@/lib/carouselPublicOrigin";
import { getRemoteProject } from "@/lib/remoteCarouselProjects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REFERENCE_PROJECTS = [
  "MAG-20260819-062742",
  "MAG-20260819-065638",
  "MAG-20260819-122410",
];

function authorized(req: NextRequest) {
  const secret = process.env.HERMES_API_KEY;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

function collectDataUrls(value: unknown, output: string[] = []) {
  if (typeof value === "string") {
    if (/^data:image\/(?:jpeg|jpg|png|webp);base64,/i.test(value)) output.push(value);
    return output;
  }
  if (Array.isArray(value)) {
    value.forEach((item) => collectDataUrls(item, output));
    return output;
  }
  if (value && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach((item) => collectDataUrls(item, output));
  }
  return output;
}

async function referenceImagePool() {
  const all: string[] = [];
  for (const projectId of REFERENCE_PROJECTS) {
    const result = await getRemoteProject(projectId);
    if (result.ok) collectDataUrls(result.data, all);
  }
  return [...new Set(all)];
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const origin = carouselPublicOrigin(req);
  const imagePool = await referenceImagePool();
  if (!imagePool.length) {
    return NextResponse.json({ ok: false, error: "reference_image_pool_empty", references: REFERENCE_PROJECTS }, { status: 409 });
  }

  const results: Array<Record<string, unknown>> = [];
  for (let projectIndex = 0; projectIndex < OFFICIAL_PROJECTS.length; projectIndex += 1) {
    const project = OFFICIAL_PROJECTS[projectIndex];
    const cards = project.cards.map((card, cardIndex) => ({
      ...card,
      image_data_url: imagePool[(projectIndex * 2 + cardIndex) % imagePool.length],
    }));
    const payload = { ...project, cards };
    const headers: HeadersInit = { "Content-Type": "application/json", Accept: "application/json" };
    if (process.env.HERMES_API_KEY) headers.Authorization = `Bearer ${process.env.HERMES_API_KEY}`;

    try {
      const response = await fetch(`${origin}/api/hermes/projects`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        cache: "no-store",
      });
      const data = await response.json().catch(() => null) as Record<string, unknown> | null;
      results.push({
        project_id: project.project_id,
        ok: response.ok && data?.ok === true,
        http: response.status,
        studio_url: data?.studio_url,
        render_html_url: data?.render_html_url,
        status: data?.status,
        warnings: data?.warnings,
      });
    } catch (error) {
      results.push({ project_id: project.project_id, ok: false, error: error instanceof Error ? error.message : String(error) });
    }
  }

  const completed = results.filter((item) => item.ok === true).length;
  return NextResponse.json({
    ok: completed === OFFICIAL_PROJECTS.length,
    total: OFFICIAL_PROJECTS.length,
    completed,
    failed: OFFICIAL_PROJECTS.length - completed,
    image_pool_count: imagePool.length,
    results,
  }, { status: completed === OFFICIAL_PROJECTS.length ? 200 : 207 });
}
