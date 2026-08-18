"use client";

import { useState, type ChangeEvent } from "react";
import { INSTAGRAM_45PLUS_LIBRARY, LIBRARY_COLORS } from "@/lib/instagramTemplateLibrary";
import type { Box, LibraryCard, LibraryTemplate } from "@/lib/instagramTemplateLibrary";

const W = 540;
const H = 675;

type PhotoCfg = { x: number; y: number; zoom: number; fit: "cover" | "contain" };
type CopyState = { headline: string; body: string; cta: string };
type TextSize = "small" | "medium" | "large";

const DEFAULT_PHOTO: PhotoCfg = { x: 0, y: 0, zoom: 100, fit: "cover" };
const DEFAULT_COPY: CopyState = {
  headline: "Um corte que conversa com quem você é hoje.",
  body: "Movimento, proporção e personalidade para valorizar seu cabelo e sua rotina.",
  cta: "Agende seu corte pelo WhatsApp."
};

const TEXT_SCALES: Record<TextSize, { headline: number; body: number; cta: number; headlineLine: number; bodyLine: number; gapBody: number; gapCta: number }> = {
  small: { headline: 27, body: 12, cta: 12, headlineLine: 1.08, bodyLine: 1.48, gapBody: 15, gapCta: 16 },
  medium: { headline: 32, body: 15, cta: 14, headlineLine: 1.06, bodyLine: 1.5, gapBody: 18, gapCta: 20 },
  large: { headline: 38, body: 18, cta: 16, headlineLine: 1.03, bodyLine: 1.55, gapBody: 20, gapCta: 22 }
};

function colorOf(name?: string) {
  if (!name) return LIBRARY_COLORS.off_white;
  const colors: Record<string, string> = LIBRARY_COLORS;
  return colors[name] ?? name;
}

function photoKey(templateId: string, cardIndex: number, slotIndex: number) {
  return `${templateId}:${cardIndex}:${slotIndex}`;
}

function copyKey(templateId: string, cardIndex: number) {
  return `${templateId}:${cardIndex}`;
}

function textSizeKey(templateId: string, cardIndex: number) {
  return `${templateId}:${cardIndex}`;
}

function radiusOf(box: Box) {
  if (box.radius) return box.radius;
  if (box.shape === "oval" || box.shape === "oval_vertical" || box.shape === "circulo") return "50%";
  if (box.shape?.includes("capsula")) return "999px";
  if (box.shape === "arco") return "50% 50% 18px 18px";
  if (box.shape === "arco_invertido") return "18px 18px 50% 50%";
  return "18px";
}

function clipPathOf(box: Box) {
  if (box.shape === "circulo" || box.shape === "oval" || box.shape === "oval_vertical") return "ellipse(50% 50% at 50% 50%)";
  if (box.shape === "arco") return "path('M 0 100% L 0 40% C 0 15% 20% 0 50% 0 C 80% 0 100% 15% 100% 40% L 100% 100% Z')";
  if (box.shape === "arco_invertido") return "path('M 0 0 L 100% 0 L 100% 60% C 100% 85% 80% 100% 50% 100% C 20% 100% 0 85% 0 60% Z')";
  return undefined;
}

function isDark(bg: string) {
  return [LIBRARY_COLORS.terracota, LIBRARY_COLORS.vinho, LIBRARY_COLORS.marrom, LIBRARY_COLORS.preto].includes(bg as never);
}

function Canvas({
  template,
  card,
  cardIndex,
  images,
  photoCfgs,
  copy,
  textSize,
  onSlot
}: {
  template: LibraryTemplate;
  card: LibraryCard;
  cardIndex: number;
  images: Record<string, string>;
  photoCfgs: Record<string, PhotoCfg>;
  copy: CopyState;
  textSize: TextSize;
  onSlot: (index: number) => void;
}) {
  const bg = colorOf(card.bg);
  const ink = isDark(bg) ? "#FFF9F4" : "#493731";
  const mainText = card.headline ?? card.text ?? card.cta ?? { x: 7, y: 18, w: 40 };
  const scale = TEXT_SCALES[textSize];

  return (
    <div style={{ width: W, height: H, position: "relative", overflow: "hidden", background: bg, color: ink }}>
      <div style={{ position: "absolute", left: 30, top: 26, zIndex: 5, color: ink }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".2em" }}>MAGO DAS TESOURAS</div>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".16em", marginTop: 5 }}>45+</div>
        <div style={{ fontSize: 9, letterSpacing: ".12em", marginTop: 12 }}>{String(cardIndex + 1).padStart(2, "0")} / 05 · {template.id}</div>
      </div>

      {card.photos.map((box, slotIndex) => {
        const key = photoKey(template.id, cardIndex, slotIndex);
        const image = images[key];
        const cfg = photoCfgs[key] ?? DEFAULT_PHOTO;
        const clipPath = clipPathOf(box);
        return (
          <button
            type="button"
            key={key}
            onClick={() => onSlot(slotIndex)}
            style={{
              position: "absolute",
              left: `${box.x}%`,
              top: `${box.y}%`,
              width: `${box.w}%`,
              height: `${box.h}%`,
              padding: 0,
              borderRadius: radiusOf(box),
              clipPath,
              overflow: "hidden",
              border: "1px dashed #A77C69",
              background: "#E9DED4",
              color: "#755547",
              zIndex: 2,
              cursor: "pointer"
            }}
          >
            {image ? (
              <img
                src={image}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                  objectFit: cfg.fit,
                  transform: `translate(${cfg.x}px, ${cfg.y}px) scale(${cfg.zoom / 100})`,
                  transformOrigin: "center"
                }}
              />
            ) : (
              <span style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", padding: 12, boxSizing: "border-box", textAlign: "center", fontSize: 10, fontWeight: 800, letterSpacing: ".1em" }}>
                COLOQUE SUA FOTO AQUI
              </span>
            )}
            {card.labels?.[slotIndex] ? (
              <span style={{ position: "absolute", left: 8, top: 8, background: "rgba(37,32,30,.82)", color: "white", padding: "4px 7px", borderRadius: 10, fontSize: 8, fontWeight: 800 }}>
                {card.labels[slotIndex]}
              </span>
            ) : null}
          </button>
        );
      })}

      {card.number ? (
        <div style={{ position: "absolute", left: "44%", top: "12%", fontFamily: "Georgia,serif", fontSize: 100, fontWeight: 700, opacity: .12 }}>{card.number}</div>
      ) : null}

      <div style={{ position: "absolute", left: `${mainText.x}%`, top: `${mainText.y}%`, width: `${mainText.w}%`, zIndex: 3 }}>
        <div style={{ fontFamily: "Georgia,serif", fontSize: scale.headline, lineHeight: scale.headlineLine, fontWeight: 700 }}>{copy.headline}</div>
        <div style={{ marginTop: scale.gapBody, fontSize: scale.body, lineHeight: scale.bodyLine, fontWeight: 500 }}>{copy.body}</div>
        <div style={{ marginTop: scale.gapCta, fontSize: scale.cta, lineHeight: 1.25, fontWeight: 800, letterSpacing: ".01em" }}>{copy.cta}</div>
      </div>
    </div>
  );
}

export default function CarouselLibraryStudio() {
  const [templateId, setTemplateId] = useState("T01");
  const [cardIndex, setCardIndex] = useState(0);
  const [slotIndex, setSlotIndex] = useState(0);
  const [images, setImages] = useState<Record<string, string>>({});
  const [photoCfgs, setPhotoCfgs] = useState<Record<string, PhotoCfg>>({});
  const [copies, setCopies] = useState<Record<string, CopyState>>({});
  const [textSizes, setTextSizes] = useState<Record<string, TextSize>>({});

  const template = INSTAGRAM_45PLUS_LIBRARY.find((item) => item.id === templateId) ?? INSTAGRAM_45PLUS_LIBRARY[0];
  if (!template) return null;
  const card = template.cards[cardIndex] ?? template.cards[0];
  if (!card) return null;

  const safeSlot = Math.min(slotIndex, Math.max(0, card.photos.length - 1));
  const pKey = photoKey(template.id, cardIndex, safeSlot);
  const cKey = copyKey(template.id, cardIndex);
  const sizeKey = textSizeKey(template.id, cardIndex);
  const photoCfg = photoCfgs[pKey] ?? DEFAULT_PHOTO;
  const copy = copies[cKey] ?? DEFAULT_COPY;
  const textSize = textSizes[sizeKey] ?? "medium";

  const control = { width: "100%", padding: 9, marginTop: 6, boxSizing: "border-box" as const, background: "#151515", color: "#fff", border: "1px solid #444", borderRadius: 8 };

  function patchPhoto(patch: Partial<PhotoCfg>) {
    setPhotoCfgs((current) => ({ ...current, [pKey]: { ...(current[pKey] ?? DEFAULT_PHOTO), ...patch } }));
  }

  function patchCopy(patch: Partial<CopyState>) {
    setCopies((current) => ({ ...current, [cKey]: { ...(current[cKey] ?? DEFAULT_COPY), ...patch } }));
  }

  function uploadPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImages((current) => ({ ...current, [pKey]: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  return (
    <main style={{ minHeight: "100vh", background: "#111", color: "#fff", padding: 22, fontFamily: "Arial,sans-serif" }}>
      <div style={{ maxWidth: 1450, margin: "auto", display: "grid", gridTemplateColumns: "400px 1fr", gap: 24 }}>
        <aside style={{ background: "#202020", borderRadius: 18, padding: 18, maxHeight: "calc(100vh - 44px)", overflowY: "auto" }}>
          <h1 style={{ margin: "0 0 4px" }}>Carousel Studio · Biblioteca 45+</h1>
          <p style={{ opacity: .65, marginTop: 4 }}>12 templates · 60 layouts-base · 1080×1350</p>

          <label>Template visual</label>
          <select value={templateId} onChange={(e) => { setTemplateId(e.target.value); setCardIndex(0); setSlotIndex(0); }} style={control}>
            {INSTAGRAM_45PLUS_LIBRARY.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.name}</option>)}
          </select>
          <div style={{ fontSize: 12, opacity: .7, marginTop: 7 }}>{template.description}</div>

          <hr style={{ borderColor: "#333", margin: "16px 0" }} />
          <strong>Card {cardIndex + 1}/5</strong>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 5, marginTop: 8 }}>
            {template.cards.map((_, index) => <button key={index} type="button" onClick={() => { setCardIndex(index); setSlotIndex(0); }}>{index + 1}</button>)}
          </div>

          <label style={{ display: "block", marginTop: 12 }}>Área de foto</label>
          <select value={safeSlot} onChange={(e) => setSlotIndex(Number(e.target.value))} style={control}>
            {card.photos.map((_, index) => <option key={index} value={index}>Foto {index + 1}{card.labels?.[index] ? ` · ${card.labels[index]}` : ""}</option>)}
          </select>

          <input type="file" accept="image/*" onChange={uploadPhoto} style={{ marginTop: 10 }} />
          <label style={{ display: "block", marginTop: 10 }}>Encaixe</label>
          <select value={photoCfg.fit} onChange={(e) => patchPhoto({ fit: e.target.value as "cover" | "contain" })} style={control}>
            <option value="cover">Cover</option><option value="contain">Contain</option>
          </select>
          <label>Mover X {photoCfg.x}px</label><input type="range" min="-220" max="220" value={photoCfg.x} onChange={(e) => patchPhoto({ x: Number(e.target.value) })} style={{ width: "100%" }} />
          <label>Mover Y {photoCfg.y}px</label><input type="range" min="-220" max="220" value={photoCfg.y} onChange={(e) => patchPhoto({ y: Number(e.target.value) })} style={{ width: "100%" }} />
          <label>Zoom {photoCfg.zoom}%</label><input type="range" min="70" max="220" value={photoCfg.zoom} onChange={(e) => patchPhoto({ zoom: Number(e.target.value) })} style={{ width: "100%" }} />

          <hr style={{ borderColor: "#333", margin: "16px 0" }} />
          <label>Tamanho do texto</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginTop: 8 }}>
            {(["small", "medium", "large"] as TextSize[]).map((size) => {
              const label = size === "small" ? "Pequeno" : size === "medium" ? "Médio" : "Grande";
              const active = textSize === size;
              return <button key={size} type="button" onClick={() => setTextSizes((current) => ({ ...current, [sizeKey]: size }))} style={{ padding: "9px 6px", fontWeight: active ? 800 : 500, border: active ? "2px solid #D3A29A" : "1px solid #555", background: active ? "#3a2c2a" : "#181818", color: "#fff", borderRadius: 8 }}>{label}</button>;
            })}
          </div>
          <div style={{ fontSize: 11, opacity: .65, marginTop: 7 }}>A hierarquia ajusta título, corpo e CTA em proporções diferentes para preservar a leitura.</div>

          <label style={{ display: "block", marginTop: 12 }}>Headline</label><textarea value={copy.headline} onChange={(e) => patchCopy({ headline: e.target.value })} rows={3} style={control} />
          <label style={{ display: "block", marginTop: 8 }}>Texto</label><textarea value={copy.body} onChange={(e) => patchCopy({ body: e.target.value })} rows={3} style={control} />
          <label style={{ display: "block", marginTop: 8 }}>CTA</label><input value={copy.cta} onChange={(e) => patchCopy({ cta: e.target.value })} style={control} />
        </aside>

        <section>
          <div style={{ width: W, height: H, margin: "0 auto", boxShadow: "0 22px 70px #0009" }}>
            <Canvas template={template} card={card} cardIndex={cardIndex} images={images} photoCfgs={photoCfgs} copy={copy} textSize={textSize} onSlot={setSlotIndex} />
          </div>
        </section>
      </div>
    </main>
  );
}
