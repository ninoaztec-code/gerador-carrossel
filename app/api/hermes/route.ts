import { NextRequest, NextResponse } from "next/server";
import { CarouselDocument, validateCarousel } from "@/lib/carousel";

export const runtime = "nodejs";

function authorized(req: NextRequest) {
  const secret = process.env.HERMES_API_KEY;
  if (!secret) return true; // Preview/test mode until the secret is configured in Vercel.
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "gerador-carrossel",
    endpoint: "/api/hermes",
    accepts: "CarouselDocument JSON",
  });
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  try {
    const doc = (await req.json()) as CarouselDocument;
    const errors = validateCarousel(doc);
    if (errors.length) return NextResponse.json({ ok: false, errors }, { status: 422 });

    return NextResponse.json({
      ok: true,
      document: doc,
      studio: "/studio",
      render: {
        width: 1080,
        height: 1350,
        format: "png",
        status: "accepted",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
}
