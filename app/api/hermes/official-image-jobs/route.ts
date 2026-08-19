import { NextRequest, NextResponse } from "next/server";
import { OFFICIAL_IMAGE_JOBS } from "@/lib/officialImageBriefs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorized(req: NextRequest) {
  const secret = process.env.HERMES_API_KEY;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  return NextResponse.json({
    ok: true,
    total: OFFICIAL_IMAGE_JOBS.length,
    jobs: OFFICIAL_IMAGE_JOBS,
  }, { headers: { "cache-control": "no-store" } });
}
