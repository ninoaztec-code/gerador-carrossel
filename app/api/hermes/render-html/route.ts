import { NextRequest, NextResponse } from "next/server";
import { CarouselDocument, CarouselSlide, FAMILIES, validateCarousel } from "@/lib/carousel";

export const runtime = "nodejs";

type T10Slot = {
  slot: string;
  x: number;
  y: number;
  width: number;
  height: number;
  orientation: "vertical" | "horizontal";
};

const T10_SLOTS: T10Slot[][] = [
  [
    { slot: "foto_1", x: 6, y: 30, width: 27, height: 46, orientation: "vertical" },
    { slot: "foto_2", x: 36, y: 23, width: 28, height: 53, orientation: "vertical" },
    { slot: "foto_3", x: 67, y: 30, width: 27, height: 46, orientation: "vertical" },
  ],
  [{ slot: "foto", x: 8, y: 12, width: 42, height: 72, orientation: "vertical" }],
  [{ slot: "foto", x: 50, y: 12, width: 42, height: 72, orientation: "vertical" }],
  [{ slot: "foto", x: 8, y: 14, width: 84, height: 51, orientation: "horizontal" }],
  [
    { slot: "foto_1", x: 8, y: 16, width: 25, height: 43, orientation: "vertical" },
    { slot: "foto_2", x: 37, y: 16, width: 25, height: 43, orientation: "vertical" },
    { slot: "foto_3", x: 66, y: 16, width: 25, height: 43, orientation: "vertical" },
  ],
];

function esc(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function bindingSource(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (!isRecord(value)) return undefined;
  for (const key of ["url", "src", "image", "path", "arquivo", "href"]) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }
  return undefined;
}

function bindingFromCollection(collection: unknown, slot: string, slotIndex: number): string | undefined {
  if (Array.isArray(collection)) {
    const named = collection.find((entry) => isRecord(entry) && [entry.slot, entry.name, entry.id].some((v) => v === slot));
    return bindingSource(named) || bindingSource(collection[slotIndex]);
  }
  if (!isRecord(collection)) return undefined;
  return bindingSource(collection[slot]);
}

function documentCardBindings(doc: CarouselDocument, cardIndex: number): unknown {
  const bindings = doc.photo_bindings as unknown;
  if (Array.isArray(bindings)) return bindings[cardIndex];
  if (!isRecord(bindings)) return undefined;

  const card = cardIndex + 1;
  for (const key of [String(card), `card_${card}`, `card-${card}`, `card${card}`, `T10-C${card}`, `T10-${card}`]) {
    if (bindings[key] !== undefined) return bindings[key];
  }
  return bindings;
}

function resolvePhotoBinding(doc: CarouselDocument, slide: CarouselSlide, cardIndex: number, slot: string, slotIndex: number) {
  return (
    bindingFromCollection(slide.photo_bindings, slot, slotIndex) ||
    bindingFromCollection(documentCardBindings(doc, cardIndex), slot, slotIndex)
  );
}

function hasT10Marker(value: unknown) {
  return typeof value === "string" && /(^|[-_\s])T10($|[-_\s])/i.test(value);
}

function isT10Document(doc: CarouselDocument) {
  if ([doc.id, doc.template, doc.template_id, doc.templateId].some(hasT10Marker)) return true;
  return doc.slides.some((slide) => hasT10Marker(String(slide.template_card ?? "")));
}

function renderableImageSource(src: string | undefined) {
  if (!src) return undefined;
  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  if (src.startsWith("/") && !src.startsWith("/root/") && !src.startsWith("/home/")) return src;
  return undefined;
}

function t10SlotHtml(doc: CarouselDocument, slide: CarouselSlide, cardIndex: number, slot: T10Slot, slotIndex: number) {
  const rawBinding = resolvePhotoBinding(doc, slide, cardIndex, slot.slot, slotIndex);
  const src = renderableImageSource(rawBinding);
  const bindingAttr = rawBinding ? ` data-photo-binding="${esc(rawBinding)}"` : "";
  const content = src
    ? `<img class="t10-photo" src="${esc(src)}" alt=""/>`
    : `<div class="t10-placeholder"><span class="t10-placeholder-icon">＋</span><span>COLOQUE SUA FOTO AQUI</span><small>${esc(slot.slot)}</small></div>`;

  return `<div class="t10-photo-slot t10-${slot.orientation}" data-slot="${esc(slot.slot)}"${bindingAttr} style="left:${slot.x}%;top:${slot.y}%;width:${slot.width}%;height:${slot.height}%">${content}</div>`;
}

function t10CopyHtml(slide: CarouselSlide, index: number, total: number) {
  const list = (slide.items || []).map((item) => `<div class="t10-item"><span>•</span>${esc(item)}</div>`).join("");
  return `<div class="t10-copy t10-copy-card-${index + 1}">
    <div class="t10-eyebrow">${esc(slide.eyebrow || `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`)}</div>
    <h1 class="t10-headline">${esc(slide.headline)}</h1>
    ${slide.body ? `<p class="t10-body">${esc(slide.body)}</p>` : ""}
    ${list ? `<div class="t10-items">${list}</div>` : ""}
    ${slide.cta ? `<div class="t10-cta">${esc(slide.cta)}</div>` : ""}
  </div>`;
}

function t10SlideHtml(doc: CarouselDocument, slide: CarouselSlide, family: keyof typeof FAMILIES, index: number, total: number) {
  const t = FAMILIES[family];
  const slots = T10_SLOTS[index] || [];
  const slotHtml = slots.map((slot, slotIndex) => t10SlotHtml(doc, slide, index, slot, slotIndex)).join("\n");

  return `<section id="slide-${index + 1}" class="slide t10-slide" data-template="T10" data-template-name="CATÁLOGO DE CORTES" data-template-card="${index + 1}" style="--bg:${t.bg};--ink:${t.ink};--accent:${t.accent};--support:${t.support}">
    <div class="t10-catalog-mark">CATÁLOGO DE CORTES</div>
    ${slotHtml}
    ${t10CopyHtml(slide, index, total)}
  </section>`;
}

function standardSlideHtml(slide: CarouselSlide, family: keyof typeof FAMILIES, index: number, total: number) {
  const t = FAMILIES[family];
  const dark = slide.layout === "photo-cta" && family === "editorial-premium";
  const bg = dark ? t.ink : t.bg;
  const ink = dark ? t.bg : t.ink;
  const hasPhoto = Boolean(slide.image) && ["hero-photo", "statement-portrait", "photo-cta"].includes(slide.layout);
  const photoWidth = slide.layout === "hero-photo" ? 58 : 42;
  const contentWidth = hasPhoto ? 64 : 100;
  const list = (slide.items || []).map((item) => `<div class="item"><span>•</span><b>${esc(item)}</b></div>`).join("");
  const image = hasPhoto ? `<img class="photo photo-${slide.layout}" src="${esc(slide.image)}" alt=""/>` : "";
  const overlay = hasPhoto && slide.layout === "hero-photo" ? `<div class="hero-overlay"></div>` : "";

  return `<section id="slide-${index + 1}" class="slide" style="--bg:${bg};--ink:${ink};--accent:${t.accent};--support:${t.support};--content:${contentWidth}%;--photo:${photoWidth}%">
    ${image}${overlay}
    <div class="content">
      <div class="eyebrow">${esc(slide.eyebrow || `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`)}</div>
      <h1 class="headline layout-${slide.layout}">${esc(slide.headline)}</h1>
      ${slide.body ? `<p class="body">${esc(slide.body)}</p>` : ""}
      ${list ? `<div class="items ${slide.layout === "checklist" ? "checklist" : ""}">${list}</div>` : ""}
      <div class="footer">${slide.cta ? `<div class="cta">${esc(slide.cta)}</div>` : ""}<div class="rule"></div></div>
    </div>
  </section>`;
}

export async function POST(req: NextRequest) {
  try {
    const doc = (await req.json()) as CarouselDocument;
    const errors = validateCarousel(doc);
    if (errors.length) return NextResponse.json({ ok: false, errors }, { status: 422 });

    const t10 = isT10Document(doc);
    if (t10 && doc.slides.length !== 5) {
      return NextResponse.json({ ok: false, errors: ["T10 exige exatamente 5 cards."] }, { status: 422 });
    }

    const slides = doc.slides
      .map((slide, index) => t10
        ? t10SlideHtml(doc, slide, doc.family, index, doc.slides.length)
        : standardSlideHtml(slide, doc.family, index, doc.slides.length))
      .join("\n");

    const html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
*{box-sizing:border-box}html,body{margin:0;padding:0;background:#111;font-family:Arial,sans-serif}.deck{display:grid;gap:40px;padding:40px;width:max-content}.slide{width:1080px;height:1350px;position:relative;overflow:hidden;background:var(--bg);color:var(--ink)}.photo{position:absolute;right:0;top:0;width:var(--photo);height:100%;object-fit:cover;object-position:center}.hero-overlay{position:absolute;inset:0;background:linear-gradient(90deg,rgba(247,243,237,.99) 0%,rgba(247,243,237,.95) 38%,rgba(247,243,237,.25) 64%,rgba(247,243,237,0) 76%)}.content{position:relative;z-index:2;height:100%;width:var(--content);padding:96px 92px;display:flex;flex-direction:column}.eyebrow{font-size:20px;letter-spacing:.32em;text-transform:uppercase;opacity:.62}.headline{font-family:Georgia,serif;font-size:78px;line-height:1.02;margin:118px 0 0;font-weight:700;overflow-wrap:anywhere}.headline.layout-quote{font-size:92px}.body{font-size:31px;line-height:1.5;margin:52px 0 0;max-width:700px}.items{display:grid;gap:22px;margin-top:52px}.item{display:flex;gap:20px;align-items:center;font-size:29px;line-height:1.25}.item span{color:var(--accent);font-size:36px}.checklist .item{padding:20px 26px;border-radius:28px;background:var(--support)}.footer{margin-top:auto}.cta{display:inline-block;background:var(--accent);color:#fff;padding:22px 34px;border-radius:999px;font-size:25px;font-weight:700}.rule{width:140px;height:2px;background:var(--accent);margin-top:38px}
.t10-slide{background:var(--bg);color:var(--ink);font-family:Arial,sans-serif}.t10-catalog-mark{position:absolute;right:6%;bottom:4%;font-size:15px;letter-spacing:.24em;text-transform:uppercase;opacity:.45}.t10-photo-slot{position:absolute;z-index:1;overflow:hidden;background:rgba(197,154,107,.10);border:2px dashed rgba(15,15,16,.28);border-radius:24px}.t10-photo{width:100%;height:100%;display:block;object-fit:cover;object-position:center}.t10-placeholder{width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:12px;padding:24px;color:rgba(15,15,16,.55);font-size:18px;font-weight:800;letter-spacing:.08em}.t10-placeholder-icon{width:48px;height:48px;border:1.5px solid currentColor;border-radius:999px;display:grid;place-items:center;font-size:28px;font-weight:400}.t10-placeholder small{font-size:13px;font-weight:700;letter-spacing:.18em;opacity:.7}.t10-copy{position:absolute;z-index:2}.t10-eyebrow{font-size:17px;letter-spacing:.24em;text-transform:uppercase;color:var(--accent);font-weight:800;margin-bottom:16px}.t10-headline{font-family:Georgia,serif;font-size:58px;line-height:1.02;margin:0;font-weight:700;overflow-wrap:anywhere}.t10-body{font-size:24px;line-height:1.38;margin:18px 0 0;max-width:100%}.t10-items{display:grid;gap:10px;margin-top:18px}.t10-item{font-size:21px;line-height:1.25;font-weight:700}.t10-item span{color:var(--accent);margin-right:10px}.t10-cta{display:inline-block;margin-top:20px;background:var(--accent);color:#fff;padding:14px 22px;border-radius:999px;font-size:19px;font-weight:800}.t10-copy-card-1{left:6%;top:6%;width:88%}.t10-copy-card-1 .t10-headline{font-size:62px;max-width:92%}.t10-copy-card-1 .t10-body{position:absolute;top:980px;left:0;width:88%;font-size:25px}.t10-copy-card-2{left:55%;top:14%;width:37%;height:69%}.t10-copy-card-2 .t10-headline,.t10-copy-card-3 .t10-headline{font-size:55px}.t10-copy-card-3{left:8%;top:14%;width:36%;height:69%}.t10-copy-card-4{left:8%;top:69%;width:84%;height:24%}.t10-copy-card-4 .t10-headline{font-size:48px}.t10-copy-card-4 .t10-body{font-size:22px}.t10-copy-card-5{left:8%;top:64%;width:84%;height:29%}.t10-copy-card-5 .t10-headline{font-size:50px}.t10-copy-card-5 .t10-body{font-size:22px}
@media print{body{background:#fff}.deck{gap:0;padding:0}.slide{page-break-after:always}}
</style></head><body><!-- template:${t10 ? "T10" : "generic"} --><main class="deck">${slides}</main></body></html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "x-carousel-id": doc.id || "carousel",
        "x-carousel-slides": String(doc.slides.length),
        "x-carousel-template": t10 ? "T10" : "generic",
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
}
