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

function magoSplitHtml(slide: CarouselSlide, index: number, total: number) {
  const image = slide.image ? `<div class="mago-photo-wrap"><img class="mago-photo" src="${esc(slide.image)}" alt=""/></div>` : `<div class="mago-photo-wrap mago-photo-empty"></div>`;
  return `<section id="slide-${index + 1}" class="slide mago-slide">
    <div class="mago-copy">
      <div class="mago-brand">MAGO DAS TESOURAS</div>
      <div class="mago-audience">45+</div>
      <div class="mago-counter">${esc(slide.eyebrow || `${String(index + 1).padStart(2, "0")} / ${String(total).padStart(2, "0")}`)}</div>
      <div class="mago-rule"></div>
      <h1 class="mago-headline">${esc(slide.headline)}</h1>
      ${slide.body ? `<p class="mago-body">${esc(slide.body)}</p>` : ""}
      ${slide.cta ? `<div class="mago-cta">${esc(slide.cta)}</div>` : ""}
    </div>
    ${image}
  </section>`;
}

function slideHtml(slide: CarouselSlide, family: keyof typeof FAMILIES, index: number, total: number) {
  if (family === "mago-editorial-premium" && slide.layout === "mago-split") return magoSplitHtml(slide, index, total);

  const t = FAMILIES[family];
  const mago = family === "mago-editorial-premium";
  const dark = mago || (slide.layout === "photo-cta" && family === "editorial-premium");
  const bg = dark ? t.bg : t.bg;
  const ink = dark ? t.ink : t.ink;
  const hasPhoto = Boolean(slide.image) && ["hero-photo", "statement-portrait", "photo-cta"].includes(slide.layout);
  const photoWidth = slide.layout === "hero-photo" ? 58 : 42;
  const contentWidth = hasPhoto ? 64 : 100;
  const list = (slide.items || []).map((item) => `<div class="item"><span>•</span><b>${esc(item)}</b></div>`).join("");
  const image = hasPhoto ? `<div class="photo-wrap" style="--photo:${photoWidth}%"><img class="photo photo-${slide.layout}" src="${esc(slide.image)}" alt=""/></div>` : "";
  const overlay = hasPhoto && slide.layout === "hero-photo" && !mago ? `<div class="hero-overlay"></div>` : "";

  return `<section id="slide-${index + 1}" class="slide ${mago ? "mago-generic" : ""}" style="--bg:${bg};--ink:${ink};--accent:${t.accent};--support:${t.support};--content:${contentWidth}%;--photo:${photoWidth}%">
    ${image}${overlay}
    <div class="content">
      ${mago ? `<div class="brandline"><span>MAGO DAS TESOURAS</span><span>45+</span></div>` : ""}
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
*{box-sizing:border-box}html,body{margin:0;padding:0;background:#111;font-family:Arial,sans-serif}.deck{display:grid;gap:40px;padding:40px;width:max-content}.slide{width:1080px;height:1350px;position:relative;overflow:hidden;background:var(--bg);color:var(--ink)}.photo-wrap{position:absolute;right:0;top:0;width:var(--photo);height:100%;overflow:hidden}.photo{width:100%;height:100%;display:block;object-fit:cover;object-position:center 20%}.hero-overlay{position:absolute;inset:0;background:linear-gradient(90deg,rgba(247,243,237,.99) 0%,rgba(247,243,237,.95) 38%,rgba(247,243,237,.25) 64%,rgba(247,243,237,0) 76%)}.content{position:relative;z-index:2;height:100%;width:var(--content);padding:96px 92px;display:flex;flex-direction:column}.brandline{display:flex;flex-direction:column;gap:14px;font-size:18px;letter-spacing:.32em;color:var(--accent);font-weight:700;margin-bottom:70px}.eyebrow{font-size:20px;letter-spacing:.18em;text-transform:uppercase;opacity:.7;white-space:nowrap}.headline{font-family:Georgia,serif;font-size:78px;line-height:1.02;margin:118px 0 0;font-weight:700;overflow-wrap:anywhere}.headline.layout-quote{font-size:92px}.body{font-size:31px;line-height:1.5;margin:52px 0 0;max-width:700px}.items{display:grid;gap:22px;margin-top:52px}.item{display:flex;gap:20px;align-items:center;font-size:29px;line-height:1.25}.item span{color:var(--accent);font-size:36px}.checklist .item{padding:20px 26px;border-radius:28px;background:var(--support)}.footer{margin-top:auto}.cta{display:inline-block;background:var(--accent);color:#111;padding:22px 34px;border-radius:999px;font-size:25px;font-weight:700}.rule{width:140px;height:2px;background:var(--accent);margin-top:38px}.mago-generic .headline{margin-top:74px}.mago-generic .content{padding:78px 54px}.mago-generic .items{margin-top:44px}.mago-slide{display:grid;grid-template-columns:45% 55%;background:#0A0A0A;color:#F4F0E8}.mago-copy{padding:66px 54px 58px;display:flex;flex-direction:column;min-width:0}.mago-brand{color:#D1A065;font-size:18px;font-weight:700;letter-spacing:.32em;white-space:nowrap}.mago-audience{color:#D1A065;font-size:19px;font-weight:700;letter-spacing:.28em;margin-top:17px}.mago-counter{color:#D1A065;font-size:20px;letter-spacing:.16em;margin-top:125px;white-space:nowrap}.mago-rule{width:76px;height:3px;background:#D1A065;margin-top:24px}.mago-headline{font-family:Georgia,serif;font-size:58px;line-height:1.12;margin:54px 0 0;font-weight:700;max-width:100%;overflow-wrap:normal;word-break:normal}.mago-body{font-size:27px;line-height:1.5;margin:58px 0 0;max-width:390px}.mago-cta{margin-top:auto;align-self:flex-start;background:#D1A065;color:#111;padding:20px 30px;border-radius:999px;font-size:21px;line-height:1.2;font-weight:800;max-width:360px}.mago-photo-wrap{width:100%;height:100%;overflow:hidden;background:#C8B9A7}.mago-photo{width:100%;height:100%;display:block;object-fit:cover;object-position:center 18%}.mago-photo-empty{background:linear-gradient(180deg,#BFAF9C,#8E7E6D)}@media print{body{background:#fff}.deck{gap:0;padding:0}.slide{page-break-after:always}}
</style></head><body><main class="deck">${slides}</main></body></html>`;

    return new NextResponse(html, { status: 200, headers: { "content-type": "text/html; charset=utf-8", "x-carousel-id": doc.id || "carousel", "x-carousel-slides": String(doc.slides.length) } });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
}
