import { NextRequest, NextResponse } from "next/server";
import { OFFICIAL_PROJECTS } from "@/lib/officialPautaProjects";
import { carouselPublicOrigin } from "@/lib/carouselPublicOrigin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SeedBody = {
  images_by_project?: Record<string, string[]>;
};

function authorized(req: NextRequest) {
  const secret = process.env.HERMES_API_KEY;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

function validDataUrl(value: unknown) {
  return typeof value === "string" && /^data:image\/(?:jpeg|jpg|png|webp|gif|avif);base64,[a-z0-9+/=\s]+$/i.test(value);
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({})) as SeedBody;
  const imageMap = body.images_by_project || {};
  const missing = OFFICIAL_PROJECTS
    .filter((project) => {
      const images = imageMap[project.project_id] || [];
      return images.length < project.cards.length || images.slice(0, project.cards.length).some((image) => !validDataUrl(image));
    })
    .map((project) => ({ project_id: project.project_id, required_images: project.cards.length, supplied_images: (imageMap[project.project_id] || []).length }));

  if (missing.length) {
    return NextResponse.json({
      ok: false,
      error: "official_images_required",
      message: "O seed oficial não reutiliza mais fotos de projetos de teste. Forneça imagens reais/específicas por projeto.",
      missing,
    }, { status: 422 });
  }

  const origin = carouselPublicOrigin(req);
  const results: Array<Record<string, unknown>> = [];

  for (const project of OFFICIAL_PROJECTS) {
    const images = imageMap[project.project_id];
    const payload = {
      ...project,
      cards: project.cards.map((card, cardIndex) => ({ ...card, image_data_url: images[cardIndex] })),
    };
    const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
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
    recycled_test_images: false,
    results,
  }, { status: completed === OFFICIAL_PROJECTS.length ? 200 : 207 });
}
