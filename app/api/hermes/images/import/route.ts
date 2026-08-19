import { NextRequest, NextResponse } from "next/server";
import { carouselPublicOrigin } from "@/lib/carouselPublicOrigin";
import { importExternalImage } from "@/lib/localCarouselImages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: NextRequest) {
  const secret = process.env.HERMES_API_KEY;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const body = await req.json() as { image_url?: string };
    const source = body?.image_url?.trim();
    if (!source) return NextResponse.json({ ok: false, error: "image_url_obrigatoria" }, { status: 422 });

    const imported = await importExternalImage(source);
    const origin = carouselPublicOrigin(req);
    return NextResponse.json({
      ok: true,
      photo_id: imported.photo_id,
      image_url: `${origin}/api/projects/images/${encodeURIComponent(imported.photo_id)}`,
      content_type: imported.content_type,
      bytes: imported.bytes,
      source_url: imported.source_url,
      persistence: "local-volume",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = message.startsWith("image_fetch_http_") ? 422 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
