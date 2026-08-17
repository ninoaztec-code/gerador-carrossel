import { NextRequest, NextResponse } from "next/server";
import { CarouselDocument, CarouselSlide, FAMILIES, validateCarousel } from "@/lib/carousel";

export const runtime = "nodejs";

function esc(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slideHtml(slide: CarouselSlide, family: keyof typeof FAMILIES, index: number, total: number) {
  const t = FAMILIES[family];
  const dark = slide.layout === "photo-cta" && family === "editorial-premium";
  const bg = dark ? t.ink : t.bg;
  const ink = dark ? t.bg : t.ink;
  const hasPhoto = Boolean(slide.image) && ["hero-photo", "statement-portrait", "photo-cta"].includes(slide.layout);
  const photoWidth = slide.layout === "hero-photo" ? 58 : 42;
  const contentWidth = hasPhoto ? 64 : 100;
  const list = (slide.items || []).map((item) => `<div class="item"><span>•</span><b>${esc(item)}</b></div>`).join("");
  const image = hasPhoto
    ? `<div class="photo-wrap photo-${slide.layout}"><img class="photo" src="${esc(slide.image)}" alt=""/></div>`
    : "";
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

    const slides = doc.slides.map((s, i) => slideHtml(s, doc.family, i, doc.slides.length)).join("\n");
    const html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
*{box-sizing:border-box}html,body{margin:0;padding:0;background:#111;font-family:Arial,sans-serif}.deck{display:grid;gap:40px;padding:40px;width:max-content}.slide{width:1080px;height:1350px;position:relative;overflow:hidden;background:var(--bg);color:var(--ink)}.photo-wrap{position:absolute;right:0;top:0;width:var(--photo);height:100%;overflow:hidden}.photo{display:block;width:100%;height:100%;object-fit:cover;object-position:center top;max-width:none;max-height:none}.hero-overlay{position:absolute;inset:0;background:linear-gradient(90deg,rgba(247,243,237,.99) 0%,rgba(247,243,237,.95) 38%,rgba(247,243,237,.25) 64%,rgba(247,243,237,0) 76%)}.content{position:relative;z-index:2;height:100%;width:var(--content);padding:96px 92px;display:flex;flex-direction:column}.eyebrow{font-size:20px;letter-spacing:.14em;text-transform:uppercase;opacity:.62;font-variant-numeric:tabular-nums;word-spacing:.2em}.headline{font-family:Georgia,serif;font-size:78px;line-height:1.02;margin:118px 0 0;font-weight:700;overflow-wrap:anywhere}.headline.layout-quote{font-size:92px}.body{font-size:31px;line-height:1.5;margin:52px 0 0;max-width:700px}.items{display:grid;gap:22px;margin-top:52px}.item{display:flex;gap:20px;align-items:center;font-size:29px;line-height:1.25}.item span{color:var(--accent);font-size:36px}.checklist .item{padding:20px 26px;border-radius:28px;background:var(--support)}.footer{margin-top:auto}.cta{display:inline-block;background:var(--accent);color:#fff;padding:22px 34px;border-radius:999px;font-size:25px;font-weight:700}.rule{width:140px;height:2px;background:var(--accent);margin-top:38px}@media print{body{background:#fff}.deck{gap:0;padding:0}.slide{page-break-after:always}}
</style></head><body><main class="deck">${slides}</main></body></html>`;

    return new NextResponse(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8", "x-carousel-id": doc.id || "carousel", "x-carousel-slides": String(doc.slides.length) } });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
}
