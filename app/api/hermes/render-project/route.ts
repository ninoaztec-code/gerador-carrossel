import { NextRequest, NextResponse } from "next/server";
import { getRemoteProject } from "@/lib/remoteCarouselProjects";
import { INSTAGRAM_45PLUS_LIBRARY, LIBRARY_COLORS } from "@/lib/instagramTemplateLibrary";
import type { Box, LibraryCard } from "@/lib/instagramTemplateLibrary";
import { cardKey, photoKey } from "@/lib/carouselProjectState";
import type { ProjectState, PhotoCfg, TextMoves, TextSize, TypeStyle } from "@/lib/carouselProjectState";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_PHOTO: PhotoCfg = { x: 0, y: 0, zoom: 100, fit: "cover" };
const DEFAULT_MOVES: TextMoves = { headline: { x: 0, y: 0 }, body: { x: 0, y: 0 }, cta: { x: 0, y: 0 } };
const TEXT_SCALES: Record<TextSize, { h: number; b: number; c: number }> = {
  small: { h: 54, b: 24, c: 24 },
  medium: { h: 64, b: 30, c: 28 },
  large: { h: 76, b: 36, c: 32 },
};
const TYPE_PRESETS: Record<TypeStyle, { headline: string; body: string; cta: string; upper: boolean }> = {
  "clean-serif": { headline: "Georgia, serif", body: "Arial, sans-serif", cta: "Arial, sans-serif", upper: false },
  "directional-poster": { headline: "Arial Narrow, Arial, sans-serif", body: "Arial, sans-serif", cta: "Arial Narrow, Arial, sans-serif", upper: true },
  "elegant-classic": { headline: "Georgia, serif", body: "Georgia, serif", cta: "Arial, sans-serif", upper: true },
  "squeeze-deco": { headline: "Impact, Arial Narrow, sans-serif", body: "Arial, sans-serif", cta: "Georgia, serif", upper: true },
};

type RemoteCard = {
  card?: number;
  headline?: string;
  body?: string;
  text?: string;
  cta?: string;
  photo_id?: string;
  slot_index?: number;
  text_size?: string;
  image_url?: string;
  direct_image_url?: string;
  image_data_url?: string;
  texto?: { headline?: string; body?: string; cta?: string };
};

type RemoteProject = {
  project_id: string;
  template: string;
  status?: string;
  cta?: string;
  cta_final?: string;
  cards: RemoteCard[];
  editor_state?: ProjectState;
};

function esc(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function authorized(req: NextRequest) {
  const secret = process.env.HERMES_API_KEY;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

function unwrapRemote(raw: unknown, projectId: string): RemoteProject {
  const root = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const nested = (root.project && typeof root.project === "object" ? root.project :
    root.data && typeof root.data === "object" ? root.data :
    root.payload && typeof root.payload === "object" ? root.payload : root) as Record<string, unknown>;
  return {
    ...nested,
    project_id: String(nested.project_id || nested.projectId || projectId),
    template: String(nested.template || "T01").toUpperCase(),
    cards: Array.isArray(nested.cards) ? nested.cards as RemoteCard[] : [],
  } as RemoteProject;
}

function sizeOf(value?: string): TextSize {
  const v = String(value || "medium").toLowerCase();
  if (v === "small" || v === "pequeno") return "small";
  if (v === "large" || v === "grande") return "large";
  return "medium";
}

function buildFallbackState(project: RemoteProject, origin: string): ProjectState {
  const templateId = project.template.toUpperCase();
  const images: ProjectState["images"] = {};
  const copies: ProjectState["copies"] = {};
  const textSizes: ProjectState["textSizes"] = {};
  const cards = [...project.cards].sort((a, b) => Number(a.card || 0) - Number(b.card || 0));

  cards.forEach((card, position) => {
    const index = Math.max(0, Number(card.card || position + 1) - 1);
    copies[cardKey(templateId, index)] = {
      headline: card.headline || card.text || card.texto?.headline || "",
      body: card.body || card.texto?.body || "",
      cta: card.cta || card.texto?.cta || (position === cards.length - 1 ? String(project.cta || project.cta_final || "") : ""),
    };
    textSizes[cardKey(templateId, index)] = sizeOf(card.text_size);
    const slot = Number.isInteger(card.slot_index) && Number(card.slot_index) >= 0 ? Number(card.slot_index) : 0;
    const source = card.photo_id
      ? `${origin}/api/projects/images/${encodeURIComponent(String(card.photo_id).toUpperCase())}`
      : String(card.image_url || card.direct_image_url || card.image_data_url || "");
    if (source) images[photoKey(templateId, index, slot)] = source;
  });

  return {
    version: 1,
    projectId: project.project_id,
    status: project.status === "aprovado" ? "aprovado" : "salvo",
    templateId,
    cardIndex: 0,
    slotIndex: 0,
    images,
    photoCfgs: {},
    copies,
    textSizes,
    textMovesByCard: {},
    colorsByCard: {},
    typeStyles: {},
    pendingPhotos: [],
    updatedAt: new Date().toISOString(),
  };
}

function colorOf(name?: string) {
  if (!name) return LIBRARY_COLORS.off_white;
  return (LIBRARY_COLORS as Record<string, string>)[name] ?? name;
}

function isDark(bg: string) {
  const value = bg.replace("#", "");
  if (value.length !== 6) return false;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 135;
}

function radiusOf(box: Box) {
  if (box.radius) return box.radius;
  if (["oval", "oval_vertical", "circulo"].includes(box.shape ?? "")) return "50%";
  if (box.shape?.includes("capsula")) return "999px";
  if (box.shape === "arco") return "50% 50% 36px 36px";
  if (box.shape === "arco_invertido") return "36px 36px 50% 50%";
  return "36px";
}

function clipPathOf(box: Box) {
  return ["circulo", "oval", "oval_vertical"].includes(box.shape ?? "") ? "ellipse(50% 50% at 50% 50%)" : "none";
}

function absoluteImage(src: string, origin: string) {
  if (!src) return "";
  if (/^(https?:|data:image)/i.test(src)) return src;
  return new URL(src.startsWith("/") ? src : `/${src}`, origin).toString();
}

function renderCard(templateId: string, card: LibraryCard, cardIndex: number, state: ProjectState, origin: string) {
  const main = card.headline ?? card.text ?? card.cta ?? { x: 7, y: 18, w: 40 };
  const key = cardKey(templateId, cardIndex);
  const copy = state.copies?.[key] ?? { headline: "", body: "", cta: "" };
  const textSize = state.textSizes?.[key] ?? "medium";
  const scale = TEXT_SCALES[textSize];
  const moves = state.textMovesByCard?.[key] ?? DEFAULT_MOVES;
  const bg = state.colorsByCard?.[key]?.bg ?? colorOf(card.bg);
  const text = state.colorsByCard?.[key]?.text ?? (isDark(bg) ? "#F7F2EC" : "#493731");
  const typeStyle = state.typeStyles?.[key] ?? "clean-serif";
  const type = TYPE_PRESETS[typeStyle];

  const photos = card.photos.map((box, slotIndex) => {
    const pKey = photoKey(templateId, cardIndex, slotIndex);
    const image = absoluteImage(state.images?.[pKey] || "", origin);
    const cfg = state.photoCfgs?.[pKey] ?? DEFAULT_PHOTO;
    const content = image
      ? `<img src="${esc(image)}" alt="" style="width:100%;height:100%;object-fit:${cfg.fit};transform:translate(${cfg.x * 2}px,${cfg.y * 2}px) scale(${cfg.zoom / 100});transform-origin:center center;display:block"/>`
      : `<div class="placeholder">COLOQUE SUA FOTO AQUI</div>`;
    return `<div class="photo-slot" style="left:${box.x}%;top:${box.y}%;width:${box.w}%;height:${box.h}%;border-radius:${esc(radiusOf(box))};clip-path:${esc(clipPathOf(box))}">${content}</div>`;
  }).join("");

  const transform = (name: "headline" | "body" | "cta") => `translate(${moves[name].x * 2}px,${moves[name].y * 2}px)`;
  return `<section id="card-${cardIndex + 1}" class="card" data-template="${esc(templateId)}" data-card="${cardIndex + 1}" style="background:${esc(bg)};color:${esc(text)}">
    <div class="brand">MAGO DAS TESOURAS<br/><span>${String(cardIndex + 1).padStart(2, "0")} / 05 · ${esc(templateId)}</span></div>
    ${photos}
    <div class="copy" style="left:${main.x}%;top:${main.y}%;width:${main.w}%">
      <div class="headline" style="transform:${transform("headline")};font-family:${esc(type.headline)};font-size:${scale.h}px;text-transform:${type.upper ? "uppercase" : "none"}">${esc(copy.headline)}</div>
      ${copy.body ? `<div class="body" style="transform:${transform("body")};font-family:${esc(type.body)};font-size:${scale.b}px">${esc(copy.body)}</div>` : ""}
      ${copy.cta ? `<div class="cta" style="transform:${transform("cta")};font-family:${esc(type.cta)};font-size:${scale.c}px;text-transform:${type.upper ? "uppercase" : "none"}">${esc(copy.cta)}</div>` : ""}
    </div>
  </section>`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const projectId = req.nextUrl.searchParams.get("project_id")?.trim();
  const requestedCard = Number(req.nextUrl.searchParams.get("card") || 0);
  if (!projectId) return NextResponse.json({ ok: false, error: "project_id_obrigatorio" }, { status: 400 });

  try {
    const remoteResult = await getRemoteProject(projectId);
    if (!remoteResult.ok) {
      return NextResponse.json({ ok: false, error: "project_not_found", remote_status: remoteResult.status }, { status: remoteResult.status === 404 ? 404 : 502 });
    }

    const project = unwrapRemote(remoteResult.data, projectId);
    const state = project.editor_state?.projectId === project.project_id
      ? project.editor_state
      : buildFallbackState(project, req.nextUrl.origin);
    const templateId = String(state.templateId || project.template || "T01").toUpperCase();
    const template = INSTAGRAM_45PLUS_LIBRARY.find((item) => item.id === templateId);
    if (!template) return NextResponse.json({ ok: false, error: "template_invalido", template: templateId }, { status: 422 });

    const indexes = requestedCard >= 1 && requestedCard <= template.cards.length
      ? [requestedCard - 1]
      : template.cards.map((_, index) => index);
    const cards = indexes.map((index) => renderCard(template.id, template.cards[index], index, state, req.nextUrl.origin)).join("\n");
    const html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${esc(projectId)} · render</title><style>
*{box-sizing:border-box}html,body{margin:0;padding:0;background:#111}body{font-family:Arial,sans-serif}.deck{display:grid;gap:40px;padding:40px;width:max-content}.card{position:relative;width:1080px;height:1350px;overflow:hidden}.brand{position:absolute;left:60px;top:52px;z-index:5;font-size:18px;font-weight:800;letter-spacing:.16em;line-height:1.35}.brand span{font-weight:500}.photo-slot{position:absolute;overflow:hidden;border:2px dashed #A77C69;background:#E9DED4;color:#755547;z-index:2}.placeholder{width:100%;height:100%;display:grid;place-items:center;padding:24px;text-align:center;font-size:20px;font-weight:800}.copy{position:absolute;z-index:3}.headline{font-weight:700;line-height:1.08}.body{margin-top:36px;line-height:1.5}.cta{margin-top:40px;font-weight:800;line-height:1.25}@media print{body{background:#fff}.deck{gap:0;padding:0}.card{page-break-after:always}}
</style></head><body><main class="deck">${cards}</main></body></html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "x-carousel-project": projectId,
        "x-carousel-template": template.id,
        "x-carousel-cards": String(indexes.length),
      },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
