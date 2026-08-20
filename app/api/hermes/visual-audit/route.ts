import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROOT = process.env.VISUAL_AUDIT_DIR || "/data/visual-audit";

function safeProject(value: string | null) {
  const raw = String(value || "").toUpperCase();
  return /^CM-0(?:3[7-9]|[4-5][0-9]|6[0-6])$/.test(raw) ? raw : "";
}

function safeCard(value: string | null) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 10 ? n : 0;
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const project = safeProject(url.searchParams.get("project"));
  const card = safeCard(url.searchParams.get("card"));

  if (!project || !card) {
    return NextResponse.json({ ok: false, error: "project_and_card_required" }, { status: 400 });
  }

  const file = path.join(ROOT, project, `card-${String(card).padStart(2, "0")}.png`);
  try {
    const data = await fs.readFile(file);
    return new NextResponse(data, {
      status: 200,
      headers: {
        "content-type": "image/png",
        "cache-control": "no-store",
        "content-length": String(data.byteLength),
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "audit_image_not_found" }, { status: 404 });
  }
}
