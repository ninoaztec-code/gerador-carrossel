import { NextRequest, NextResponse } from "next/server";
import { getRemoteImage } from "@/lib/remoteCarouselProjects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ photoId: string }> }) {
  try {
    const { photoId } = await ctx.params;
    const response = await getRemoteImage(photoId);
    if (!response.ok) return NextResponse.json({ ok: false, error: "image_not_found" }, { status: response.status });
    const body = await response.arrayBuffer();
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/octet-stream",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
