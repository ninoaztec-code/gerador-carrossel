import { NextRequest, NextResponse } from "next/server";
import { createRemoteProject } from "@/lib/remoteCarouselProjects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await createRemoteProject(body);
    return NextResponse.json(result.data ?? { ok: result.ok }, {
      status: result.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
