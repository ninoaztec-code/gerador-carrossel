import { NextRequest, NextResponse } from "next/server";
import { getRemoteProject } from "@/lib/remoteCarouselProjects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RemoteCard = {
  card?: number;
  image_data_url?: string;
};

function authorized(req: NextRequest) {
  const secret = process.env.HERMES_API_KEY;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

function unwrapCards(raw: unknown): RemoteCard[] {
  const root = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const nested = (root.project && typeof root.project === "object" ? root.project :
    root.data && typeof root.data === "object" ? root.data :
    root.payload && typeof root.payload === "object" ? root.payload : root) as Record<string, unknown>;
  return Array.isArray(nested.cards) ? nested.cards as RemoteCard[] : [];
}

function decodeImageDataUrl(value: string) {
  const match = value.match(/^data:(image\/(?:jpeg|jpg|png|webp|gif|avif));base64,([a-z0-9+/=\s]+)$/i);
  if (!match) return null;
  const contentType = match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase();
  const body = Buffer.from(match[2].replace(/\s+/g, ""), "base64");
  return { contentType, body };
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const projectId = req.nextUrl.searchParams.get("project_id")?.trim();
  const cardNumber = Number(req.nextUrl.searchParams.get("card") || 0);
  if (!projectId) return NextResponse.json({ ok: false, error: "project_id_obrigatorio" }, { status: 400 });
  if (!Number.isInteger(cardNumber) || cardNumber < 1) return NextResponse.json({ ok: false, error: "card_invalido" }, { status: 400 });

  const remote = await getRemoteProject(projectId);
  if (!remote.ok) return NextResponse.json({ ok: false, error: "project_not_found" }, { status: remote.status === 404 ? 404 : 502 });

  const card = unwrapCards(remote.data).find((item) => Number(item.card) === cardNumber);
  const decoded = decodeImageDataUrl(String(card?.image_data_url || ""));
  if (!decoded) return NextResponse.json({ ok: false, error: "embedded_image_not_found" }, { status: 404 });

  return new NextResponse(new Uint8Array(decoded.body), {
    status: 200,
    headers: {
      "content-type": decoded.contentType,
      "cache-control": "private, max-age=3600",
      "x-carousel-project": projectId,
      "x-carousel-card": String(cardNumber),
    },
  });
}
