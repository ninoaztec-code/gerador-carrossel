"use client";

import { useState, type ChangeEvent } from "react";
import { INSTAGRAM_45PLUS_LIBRARY, LIBRARY_COLORS } from "@/lib/instagramTemplateLibrary";
import type { Box, LibraryCard, LibraryTemplate } from "@/lib/instagramTemplateLibrary";

const W = 540;
const H = 675;

type PhotoCfg = { x: number; y: number; zoom: number; fit: "cover" | "contain" };
type CopyState = { headline: string; body: string; cta: string };
type TextSize = "small" | "medium" | "large";
type TextBlock = "headline" | "body" | "cta";
type TextMove = { x: number; y: number };
type TextMoves = Record<TextBlock, TextMove>;
type CardColors = { bg: string; text: string };

type ColorPreset = { name: string; bg: string; text: string };

const DEFAULT_PHOTO: PhotoCfg = { x: 0, y: 0, zoom: 100, fit: "cover" };
const DEFAULT_COPY: CopyState = {
  headline: "Um corte que conversa com quem você é hoje.",
  body: "Movimento, proporção e personalidade para valorizar seu cabelo e sua rotina.",
  cta: "Agende seu corte pelo WhatsApp."
};
const DEFAULT_TEXT_MOVES: TextMoves = {
  headline: { x: 0, y: 0 },
  body: { x: 0, y: 0 },
  cta: { x: 0, y: 0 }
};

const COLOR_PRESETS: ColorPreset[] = [
  { name: "Off-white + vinho", bg: "#F7F2EC", text: "#703C49" },
  { name: "Bege + marrom", bg: "#E7D8CB", text: "#493731" },
  { name: "Vinho + creme", bg: "#703C49", text: "#F7F2EC" },
  { name: "Terracota + creme", bg: "#92533D", text: "#F7F2EC" },
  { name: "Preto + creme", bg: "#25201E", text: "#F7F2EC" },
  { name: "Rosé + vinho", bg: "#D3A29A", text: "#703C49" }
];

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
function photoKey(templateId: string, cardIndex: number, slotIndex: number) { return `${templateId}:${cardIndex}:${slotIndex}`; }
function copyKey(templateId: string, cardIndex: number) { return `${templateId}:${cardIndex}`; }
function textSizeKey(templateId: string, cardIndex: number) { return `${templateId}:${cardIndex}`; }
function textMoveKey(templateId: string, cardIndex: number) { return `${templateId}:${cardIndex}`; }
function colorKey(templateId: string, cardIndex: number) { return `${templateId}:${cardIndex}`; }

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
  return undefined;
}
function isDark(bg: string) {
  const clean = bg.replace("#", "");
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16), g = parseInt(clean.slice(2, 4), 16), b = parseInt(clean.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 135;
}
function defaultColors(card: LibraryCard): CardColors {
  const bg = colorOf(card.bg);
  return { bg, text: isDark(bg) ? "#F7F2EC" : "#493731" };
}

function Canvas({ template, card, cardIndex, images, photoCfgs, copy, textSize, textMoves, colors, onSlot }: {
  template: LibraryTemplate;
  card: LibraryCard;
  cardIndex: number;
  images: Record<string, string>;
  photoCfgs: Record<string, PhotoCfg>;
  copy: CopyState;
  textSize: TextSize;
  textMoves: TextMoves;
  colors: CardColors;
  onSlot: (index: number) => void;
}) {
  const mainText = card.headline ?? card.text ?? card.cta ?? { x: 7, y: 18, w: 40 };
  const scale = TEXT_SCALES[textSize];
  return (
    <div style={{ width: W, height: H, position: "relative", overflow: "hidden", background: colors.bg, color: colors.text }}>
      <div style={{ position: "absolute", left: 30, top: 26, zIndex: 5, color: colors.text }}>
        <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: ".2em" }}>MAGO DAS TESOURAS</div>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".16em", marginTop: 5 }}>45+</div>
        <div style={{ fontSize: 9, letterSpacing: ".12em", marginTop: 12 }}>{String(cardIndex + 1).padStart(2, "0")} / 05 · {template.id}</div>
      </div>

      {card.photos.map((box, slotIndex) => {
        const key = photoKey(template.id, cardIndex, slotIndex);
        const image = images[key];
        const cfg = photoCfgs[key] ?? DEFAULT_PHOTO;
        return (
          <button type="button" key={key} onClick={() => onSlot(slotIndex)} style={{
            position: "absolute", left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%`, padding: 0,
            borderRadius: radiusOf(box), clipPath: clipPathOf(box), overflow: "hidden", border: "1px dashed #A77C69",
            background: "#E9DED4", color: "#755547", zIndex: 2, cursor: "pointer"
          }}>
            {image ? <img src={image} alt="" style={{ width: "100%", height: "100%", display: "block", objectFit: cfg.fit, transform: `translate(${cfg.x}px, ${cfg.y}px) scale(${cfg.zoom / 100})`, transformOrigin: "center" }} /> :
              <span style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", padding: 12, boxSizing: "border-box", textAlign: "center", fontSize: 10, fontWeight: 800, letterSpacing: ".1em" }}>COLOQUE SUA FOTO AQUI</span>}
            {card.labels?.[slotIndex] ? <span style={{ position: "absolute", left: 8, top: 8, background: "rgba(37,32,30,.82)", color: "white", padding: "4px 7px", borderRadius: 10, fontSize: 8, fontWeight: 800 }}>{card.labels[slotIndex]}</span> : null}
          </button>
        );
      })}

      {card.number ? <div style={{ position: "absolute", left: "44%", top: "12%", fontFamily: "Georgia,serif", fontSize: 100, fontWeight: 700, opacity: .12 }}>{card.number}</div> : null}
      <div style={{ position: "absolute", left: `${mainText.x}%`, top: `${mainText.y}%`, width: `${mainText.w}%`, zIndex: 3, color: colors.text }}>
        <div style={{ transform: `translate(${textMoves.headline.x}px, ${textMoves.headline.y}px)`, fontFamily: "Georgia,serif", fontSize: scale.headline, lineHeight: scale.headlineLine, fontWeight: 700 }}>{copy.headline}</div>
        <div style={{ transform: `translate(${textMoves.body.x}px, ${textMoves.body.y}px)`, marginTop: scale.gapBody, fontSize: scale.body, lineHeight: scale.bodyLine, fontWeight: 500 }}>{copy.body}</div>
        <div style={{ transform: `translate(${textMoves.cta.x}px, ${textMoves.cta.y}px)`, marginTop: scale.gapCta, fontSize: scale.cta, lineHeight: 1.25, fontWeight: 800, letterSpacing: ".01em" }}>{copy.cta}</div>
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
  const [textMovesByCard, setTextMovesByCard] = useState<Record<string, TextMoves>>({});
  const [colorsByCard, setColorsByCard] = useState<Record<string, CardColors>>({});
  const [activeTextBlock, setActiveTextBlock] = useState<TextBlock>("headline");

  const template = INSTAGRAM_45PLUS_LIBRARY.find((item) => item.id === templateId) ?? INSTAGRAM_45PLUS_LIBRARY[0];
  if (!template) return null;
  const card = template.cards[cardIndex] ?? template.cards[0];
  if (!card) return null;

  const safeSlot = Math.min(slotIndex, Math.max(0, card.photos.length - 1));
  const pKey = photoKey(template.id, cardIndex, safeSlot);
  const cKey = copyKey(template.id, cardIndex);
  const sizeKey = textSizeKey(template.id, cardIndex);
  const moveKey = textMoveKey(template.id, cardIndex);
  const currentColorKey = colorKey(template.id, cardIndex);
  const photoCfg = photoCfgs[pKey] ?? DEFAULT_PHOTO;
  const copy = copies[cKey] ?? DEFAULT_COPY;
  const textSize = textSizes[sizeKey] ?? "medium";
  const textMoves = textMovesByCard[moveKey] ?? DEFAULT_TEXT_MOVES;
  const activeMove = textMoves[activeTextBlock];
  const colors = colorsByCard[currentColorKey] ?? defaultColors(card);

  const control = { width: "100%", padding: 9, marginTop: 6, boxSizing: "border-box" as const, background: "#151515", color: "#fff", border: "1px solid #444", borderRadius: 8 };

  function patchPhoto(patch: Partial<PhotoCfg>) { setPhotoCfgs((current) => ({ ...current, [pKey]: { ...(current[pKey] ?? DEFAULT_PHOTO), ...patch } })); }
  function patchCopy(patch: Partial<CopyState>) { setCopies((current) => ({ ...current, [cKey]: { ...(current[cKey] ?? DEFAULT_COPY), ...patch } })); }
  function patchTextMove(patch: Partial<TextMove>) {
    setTextMovesByCard((current) => {
      const base = current[moveKey] ?? DEFAULT_TEXT_MOVES;
      return { ...current, [moveKey]: { ...base, [activeTextBlock]: { ...base[activeTextBlock], ...patch } } };
    });
  }
  function resetTextMoves() {
    setTextMovesByCard((current) => ({ ...current, [moveKey]: { headline: { x: 0, y: 0 }, body: { x: 0, y: 0 }, cta: { x: 0, y: 0 } } }));
  }
  function setCardColors(next: CardColors) { setColorsByCard((current) => ({ ...current, [currentColorKey]: next })); }
  function applyPreset(preset: ColorPreset, allCards: boolean) {
    if (!allCards) return setCardColors({ bg: preset.bg, text: preset.text });
    setColorsByCard((current) => {
      const next = { ...current };
      template.cards.forEach((_, index) => { next[colorKey(template.id, index)] = { bg: preset.bg, text: preset.text }; });
      return next;
    });
  }
  function resetColors() {
    setColorsByCard((current) => { const next = { ...current }; delete next[currentColorKey]; return next; });
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
          <select value={templateId} onChange={(e) => { setTemplateId(e.target.value); setCardIndex(0); setSlotIndex(0); setActiveTextBlock("headline"); }} style={control}>
            {INSTAGRAM_45PLUS_LIBRARY.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.name}</option>)}
          </select>
          <div style={{ fontSize: 12, opacity: .7, marginTop: 7 }}>{template.description}</div>

          <hr style={{ borderColor: "#333", margin: "16px 0" }} />
          <strong>Card {cardIndex + 1}/5</strong>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 5, marginTop: 8 }}>
            {template.cards.map((_, index) => <button key={index} type="button" onClick={() => { setCardIndex(index); setSlotIndex(0); setActiveTextBlock("headline"); }}>{index + 1}</button>)}
          </div>

          <label style={{ display: "block", marginTop: 12 }}>Área de foto</label>
          <select value={safeSlot} onChange={(e) => setSlotIndex(Number(e.target.value))} style={control}>
            {card.photos.map((_, index) => <option key={index} value={index}>Foto {index + 1}{card.labels?.[index] ? ` · ${card.labels[index]}` : ""}</option>)}
          </select>
          <input type="file" accept="image/*" onChange={uploadPhoto} style={{ marginTop: 10 }} />
          <label style={{ display: "block", marginTop: 10 }}>Encaixe</label>
          <select value={photoCfg.fit} onChange={(e) => patchPhoto({ fit: e.target.value as "cover" | "contain" })} style={control}><option value="cover">Cover</option><option value="contain">Contain</option></select>
          <label>Mover foto X {photoCfg.x}px</label><input type="range" min="-220" max="220" value={photoCfg.x} onChange={(e) => patchPhoto({ x: Number(e.target.value) })} style={{ width: "100%" }} />
          <label>Mover foto Y {photoCfg.y}px</label><input type="range" min="-220" max="220" value={photoCfg.y} onChange={(e) => patchPhoto({ y: Number(e.target.value) })} style={{ width: "100%" }} />
          <label>Zoom {photoCfg.zoom}%</label><input type="range" min="70" max="220" value={photoCfg.zoom} onChange={(e) => patchPhoto({ zoom: Number(e.target.value) })} style={{ width: "100%" }} />

          <hr style={{ borderColor: "#333", margin: "16px 0" }} />
          <strong>Cores do card</strong>
          <div style={{ fontSize: 11, opacity: .65, marginTop: 5 }}>Troque fundo e letras sem alterar fotos ou estrutura do template.</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
            <label>Fundo<input type="color" value={colors.bg} onChange={(e) => setCardColors({ ...colors, bg: e.target.value })} style={{ width: "100%", height: 38, marginTop: 5 }} /></label>
            <label>Letras<input type="color" value={colors.text} onChange={(e) => setCardColors({ ...colors, text: e.target.value })} style={{ width: "100%", height: 38, marginTop: 5 }} /></label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 10 }}>
            {COLOR_PRESETS.map((preset) => <button key={preset.name} type="button" onClick={() => applyPreset(preset, false)} style={{ padding: 8, background: preset.bg, color: preset.text, border: "1px solid #777", borderRadius: 8, fontWeight: 700 }}>{preset.name}</button>)}
          </div>
          <select defaultValue="" onChange={(e) => { const preset = COLOR_PRESETS.find((item) => item.name === e.target.value); if (preset) applyPreset(preset, true); e.currentTarget.value = ""; }} style={{ ...control, marginTop: 10 }}>
            <option value="" disabled>Aplicar preset aos 5 cards...</option>
            {COLOR_PRESETS.map((preset) => <option key={preset.name} value={preset.name}>{preset.name}</option>)}
          </select>
          <button type="button" onClick={resetColors} style={{ width: "100%", marginTop: 7 }}>Restaurar cores deste card</button>

          <hr style={{ borderColor: "#333", margin: "16px 0" }} />
          <label>Tamanho do texto</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginTop: 8 }}>
            {(["small", "medium", "large"] as TextSize[]).map((size) => {
              const label = size === "small" ? "Pequeno" : size === "medium" ? "Médio" : "Grande";
              const active = textSize === size;
              return <button key={size} type="button" onClick={() => setTextSizes((current) => ({ ...current, [sizeKey]: size }))} style={{ padding: "9px 6px", fontWeight: active ? 800 : 500, border: active ? "2px solid #D3A29A" : "1px solid #555", background: active ? "#3a2c2a" : "#181818", color: "#fff", borderRadius: 8 }}>{label}</button>;
            })}
          </div>

          <label style={{ display: "block", marginTop: 14 }}>Mover bloco de texto</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6, marginTop: 8 }}>
            {(["headline", "body", "cta"] as TextBlock[]).map((block) => {
              const label = block === "headline" ? "Título" : block === "body" ? "Corpo" : "CTA";
              const active = activeTextBlock === block;
              return <button key={block} type="button" onClick={() => setActiveTextBlock(block)} style={{ padding: "8px 5px", fontWeight: active ? 800 : 500, border: active ? "2px solid #D3A29A" : "1px solid #555", background: active ? "#3a2c2a" : "#181818", color: "#fff", borderRadius: 8 }}>{label}</button>;
            })}
          </div>
          <label>Mover texto X {activeMove.x}px</label><input type="range" min="-260" max="260" value={activeMove.x} onChange={(e) => patchTextMove({ x: Number(e.target.value) })} style={{ width: "100%" }} />
          <label>Mover texto Y {activeMove.y}px</label><input type="range" min="-320" max="320" value={activeMove.y} onChange={(e) => patchTextMove({ y: Number(e.target.value) })} style={{ width: "100%" }} />
          <button type="button" onClick={resetTextMoves} style={{ width: "100%", marginTop: 7 }}>Resetar posições dos textos</button>

          <label style={{ display: "block", marginTop: 12 }}>Headline</label><textarea value={copy.headline} onChange={(e) => patchCopy({ headline: e.target.value })} rows={3} style={control} />
          <label style={{ display: "block", marginTop: 8 }}>Texto</label><textarea value={copy.body} onChange={(e) => patchCopy({ body: e.target.value })} rows={3} style={control} />
          <label style={{ display: "block", marginTop: 8 }}>CTA</label><input value={copy.cta} onChange={(e) => patchCopy({ cta: e.target.value })} style={control} />
        </aside>

        <section>
          <div style={{ width: W, height: H, margin: "0 auto", boxShadow: "0 22px 70px #0009" }}>
            <Canvas template={template} card={card} cardIndex={cardIndex} images={images} photoCfgs={photoCfgs} copy={copy} textSize={textSize} textMoves={textMoves} colors={colors} onSlot={setSlotIndex} />
          </div>
        </section>
      </div>
    </main>
  );
}
