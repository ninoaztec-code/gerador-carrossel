"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { INSTAGRAM_45PLUS_LIBRARY, LIBRARY_COLORS } from "@/lib/instagramTemplateLibrary";
import type { Box, LibraryCard, LibraryTemplate } from "@/lib/instagramTemplateLibrary";
import {
  cardKey,
  photoKey,
  remapProjectState,
  type CardColors,
  type CopyState,
  type PendingPhoto,
  type PhotoCfg,
  type ProjectState,
  type TextBlock,
  type TextMove,
  type TextMoves,
  type TextSize,
  type TypeStyle,
} from "@/lib/carouselProjectState";

const W = 540;
const H = 675;
const DEFAULT_PHOTO: PhotoCfg = { x: 0, y: 0, zoom: 100, fit: "cover" };
const DEFAULT_COPY: CopyState = {
  headline: "Um corte que conversa com quem você é hoje.",
  body: "Movimento, proporção e personalidade para valorizar seu cabelo e sua rotina.",
  cta: "Agende seu corte pelo WhatsApp.",
};
const DEFAULT_MOVES: TextMoves = { headline: { x: 0, y: 0 }, body: { x: 0, y: 0 }, cta: { x: 0, y: 0 } };
const TYPE_PRESETS = [
  { id: "clean-serif" as TypeStyle, name: "Clean + Serif", headline: "var(--font-playfair), Georgia, serif", body: "var(--font-montserrat), Arial, sans-serif", cta: "var(--font-montserrat), Arial, sans-serif", upper: false },
  { id: "directional-poster" as TypeStyle, name: "Directional + Pôster", headline: "var(--font-oswald), Arial Narrow, sans-serif", body: "var(--font-montserrat), Arial, sans-serif", cta: "var(--font-oswald), Arial Narrow, sans-serif", upper: true },
  { id: "elegant-classic" as TypeStyle, name: "Elegant + Classic", headline: "var(--font-cinzel), Georgia, serif", body: "var(--font-playfair), Georgia, serif", cta: "var(--font-montserrat), Arial, sans-serif", upper: true },
  { id: "squeeze-deco" as TypeStyle, name: "Squeeze + Deco", headline: "var(--font-bebas), Impact, sans-serif", body: "var(--font-montserrat), Arial, sans-serif", cta: "var(--font-cinzel), Georgia, serif", upper: true },
];
const COLOR_PRESETS = [
  { name: "Off-white + vinho", bg: "#F7F2EC", text: "#703C49" },
  { name: "Bege + marrom", bg: "#E7D8CB", text: "#493731" },
  { name: "Vinho + creme", bg: "#703C49", text: "#F7F2EC" },
  { name: "Terracota + creme", bg: "#92533D", text: "#F7F2EC" },
  { name: "Preto + creme", bg: "#25201E", text: "#F7F2EC" },
  { name: "Rosé + vinho", bg: "#D3A29A", text: "#703C49" },
];
const TEXT_SCALES = { small: { h: 27, b: 12, c: 12 }, medium: { h: 32, b: 15, c: 14 }, large: { h: 38, b: 18, c: 16 } };

function colorOf(name?: string) {
  if (!name) return LIBRARY_COLORS.off_white;
  return (LIBRARY_COLORS as Record<string, string>)[name] ?? name;
}
function radiusOf(box: Box) {
  if (box.radius) return box.radius;
  if (["oval", "oval_vertical", "circulo"].includes(box.shape ?? "")) return "50%";
  if (box.shape?.includes("capsula")) return "999px";
  if (box.shape === "arco") return "50% 50% 18px 18px";
  if (box.shape === "arco_invertido") return "18px 18px 50% 50%";
  return "18px";
}
function clipPathOf(box: Box) {
  return ["circulo", "oval", "oval_vertical"].includes(box.shape ?? "") ? "ellipse(50% 50% at 50% 50%)" : undefined;
}
function isDark(bg: string) {
  const value = bg.replace("#", "");
  if (value.length !== 6) return false;
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 135;
}
function defaultColors(card: LibraryCard): CardColors {
  const bg = colorOf(card.bg);
  return { bg, text: isDark(bg) ? "#F7F2EC" : "#493731" };
}
function makeId() {
  return `MAGO-CAR-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}
function rememberProject(projectId: string) {
  const ids = JSON.parse(localStorage.getItem("mago-project-index") || "[]") as string[];
  localStorage.setItem("mago-project-index", JSON.stringify([projectId, ...ids.filter((id) => id !== projectId)]));
}

function Canvas({ template, card, cardIndex, images, photoCfgs, copy, textSize, textMoves, colors, typeStyle, onSlot }: {
  template: LibraryTemplate;
  card: LibraryCard;
  cardIndex: number;
  images: Record<string, string>;
  photoCfgs: Record<string, PhotoCfg>;
  copy: CopyState;
  textSize: TextSize;
  textMoves: TextMoves;
  colors: CardColors;
  typeStyle: TypeStyle;
  onSlot: (index: number) => void;
}) {
  const main = card.headline ?? card.text ?? card.cta ?? { x: 7, y: 18, w: 40 };
  const scale = TEXT_SCALES[textSize];
  const type = TYPE_PRESETS.find((item) => item.id === typeStyle) ?? TYPE_PRESETS[0];
  return <div style={{ width: W, height: H, position: "relative", overflow: "hidden", background: colors.bg, color: colors.text }}>
    <div style={{ position: "absolute", left: 30, top: 26, zIndex: 5, fontSize: 9, fontWeight: 800, letterSpacing: ".16em" }}>MAGO DAS TESOURAS<br/><span style={{ fontWeight: 500 }}>{String(cardIndex + 1).padStart(2, "0")} / 05 · {template.id}</span></div>
    {card.photos.map((box, index) => {
      const key = photoKey(template.id, cardIndex, index);
      const image = images[key];
      const cfg = photoCfgs[key] ?? DEFAULT_PHOTO;
      return <button key={key} type="button" onClick={() => onSlot(index)} style={{ position: "absolute", left: `${box.x}%`, top: `${box.y}%`, width: `${box.w}%`, height: `${box.h}%`, padding: 0, borderRadius: radiusOf(box), clipPath: clipPathOf(box), overflow: "hidden", border: "1px dashed #A77C69", background: "#E9DED4", color: "#755547", zIndex: 2 }}>
        {image ? <img src={image} alt="" style={{ width: "100%", height: "100%", objectFit: cfg.fit, transform: `translate(${cfg.x}px,${cfg.y}px) scale(${cfg.zoom / 100})` }} /> : <span style={{ display: "grid", placeItems: "center", height: "100%", padding: 12, fontSize: 10, fontWeight: 800 }}>COLOQUE SUA FOTO AQUI</span>}
      </button>;
    })}
    <div style={{ position: "absolute", left: `${main.x}%`, top: `${main.y}%`, width: `${main.w}%`, zIndex: 3 }}>
      <div style={{ transform: `translate(${textMoves.headline.x}px,${textMoves.headline.y}px)`, fontFamily: type.headline, fontSize: scale.h, fontWeight: 700, textTransform: type.upper ? "uppercase" : "none" }}>{copy.headline}</div>
      <div style={{ transform: `translate(${textMoves.body.x}px,${textMoves.body.y}px)`, marginTop: 18, fontFamily: type.body, fontSize: scale.b, lineHeight: 1.5 }}>{copy.body}</div>
      <div style={{ transform: `translate(${textMoves.cta.x}px,${textMoves.cta.y}px)`, marginTop: 20, fontFamily: type.cta, fontSize: scale.c, fontWeight: 800, textTransform: type.upper ? "uppercase" : "none" }}>{copy.cta}</div>
    </div>
  </div>;
}

export default function CarouselLibraryStudioV2() {
  const [projectId, setProjectId] = useState("");
  const [status, setStatus] = useState<ProjectState["status"]>("rascunho");
  const [lastSaved, setLastSaved] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [templateId, setTemplateId] = useState("T01");
  const [duplicateTemplateId, setDuplicateTemplateId] = useState("T01");
  const [cardIndex, setCardIndex] = useState(0);
  const [slotIndex, setSlotIndex] = useState(0);
  const [images, setImages] = useState<Record<string, string>>({});
  const [photoCfgs, setPhotoCfgs] = useState<Record<string, PhotoCfg>>({});
  const [copies, setCopies] = useState<Record<string, CopyState>>({});
  const [textSizes, setTextSizes] = useState<Record<string, TextSize>>({});
  const [textMovesByCard, setTextMovesByCard] = useState<Record<string, TextMoves>>({});
  const [colorsByCard, setColorsByCard] = useState<Record<string, CardColors>>({});
  const [typeStyles, setTypeStyles] = useState<Record<string, TypeStyle>>({});
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [activeTextBlock, setActiveTextBlock] = useState<TextBlock>("headline");

  const template = INSTAGRAM_45PLUS_LIBRARY.find((item) => item.id === templateId) ?? INSTAGRAM_45PLUS_LIBRARY[0];
  const card = template?.cards[cardIndex] ?? template?.cards[0];

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const id = query.get("project") || makeId();
    const raw = localStorage.getItem(`mago-project:${id}`);
    if (raw) {
      try {
        const project = JSON.parse(raw) as ProjectState;
        setProjectId(project.projectId || id);
        setStatus(project.status || "salvo");
        setTemplateId(project.templateId || "T01");
        setDuplicateTemplateId(project.templateId || "T01");
        setCardIndex(project.cardIndex || 0);
        setSlotIndex(project.slotIndex || 0);
        setImages(project.images || {});
        setPhotoCfgs(project.photoCfgs || {});
        setCopies(project.copies || {});
        setTextSizes(project.textSizes || {});
        setTextMovesByCard(project.textMovesByCard || {});
        setColorsByCard(project.colorsByCard || {});
        setTypeStyles(project.typeStyles || {});
        setPendingPhotos(project.pendingPhotos || []);
        setLastSaved(project.updatedAt || "");
      } catch {
        setProjectId(id);
      }
    } else {
      setProjectId(id);
    }
    if (!query.get("project")) {
      query.set("project", id);
      window.history.replaceState({}, "", `${window.location.pathname}?${query.toString()}`);
    }
    setHydrated(true);
  }, []);

  const snapshot = useMemo<ProjectState | null>(() => projectId ? {
    version: 1,
    projectId,
    status,
    templateId,
    cardIndex,
    slotIndex,
    images,
    photoCfgs,
    copies,
    textSizes,
    textMovesByCard,
    colorsByCard,
    typeStyles,
    pendingPhotos,
    updatedAt: new Date().toISOString(),
  } : null, [projectId, status, templateId, cardIndex, slotIndex, images, photoCfgs, copies, textSizes, textMovesByCard, colorsByCard, typeStyles, pendingPhotos]);

  function applyState(project: ProjectState) {
    setProjectId(project.projectId);
    setStatus(project.status);
    setTemplateId(project.templateId);
    setCardIndex(project.cardIndex);
    setSlotIndex(project.slotIndex);
    setImages(project.images || {});
    setPhotoCfgs(project.photoCfgs || {});
    setCopies(project.copies || {});
    setTextSizes(project.textSizes || {});
    setTextMovesByCard(project.textMovesByCard || {});
    setColorsByCard(project.colorsByCard || {});
    setTypeStyles(project.typeStyles || {});
    setPendingPhotos(project.pendingPhotos || []);
    setLastSaved(project.updatedAt);
  }

  function persist(nextStatus: ProjectState["status"] = "salvo") {
    if (!snapshot) return;
    const project = { ...snapshot, status: nextStatus, updatedAt: new Date().toISOString() };
    try {
      localStorage.setItem(`mago-project:${projectId}`, JSON.stringify(project));
      rememberProject(projectId);
      setStatus(nextStatus);
      setLastSaved(project.updatedAt);
    } catch {
      alert("Não foi possível salvar. As fotos podem estar grandes demais para o armazenamento do navegador.");
    }
  }

  useEffect(() => {
    if (!hydrated || !snapshot) return;
    const timer = window.setTimeout(() => persist(status === "aprovado" ? "aprovado" : "salvo"), 1200);
    return () => window.clearTimeout(timer);
  }, [hydrated, templateId, cardIndex, slotIndex, images, photoCfgs, copies, textSizes, textMovesByCard, colorsByCard, typeStyles, pendingPhotos]);

  if (!template || !card) return null;
  const safeSlot = Math.min(slotIndex, Math.max(0, card.photos.length - 1));
  const pKey = photoKey(template.id, cardIndex, safeSlot);
  const cKey = cardKey(template.id, cardIndex);
  const photoCfg = photoCfgs[pKey] ?? DEFAULT_PHOTO;
  const copy = copies[cKey] ?? DEFAULT_COPY;
  const textSize = textSizes[cKey] ?? "medium";
  const textMoves = textMovesByCard[cKey] ?? DEFAULT_MOVES;
  const activeMove = textMoves[activeTextBlock];
  const colors = colorsByCard[cKey] ?? defaultColors(card);
  const typeStyle = typeStyles[cKey] ?? "clean-serif";
  const control = { width: "100%", padding: 9, marginTop: 6, boxSizing: "border-box" as const, background: "#151515", color: "#fff", border: "1px solid #444", borderRadius: 8 };

  function patchPhoto(patch: Partial<PhotoCfg>) {
    setPhotoCfgs((current) => ({ ...current, [pKey]: { ...(current[pKey] ?? DEFAULT_PHOTO), ...patch } }));
  }
  function patchCopy(patch: Partial<CopyState>) {
    setCopies((current) => ({ ...current, [cKey]: { ...(current[cKey] ?? DEFAULT_COPY), ...patch } }));
  }
  function patchMove(patch: Partial<TextMove>) {
    setTextMovesByCard((current) => {
      const blocks = current[cKey] ?? DEFAULT_MOVES;
      return { ...current, [cKey]: { ...blocks, [activeTextBlock]: { ...blocks[activeTextBlock], ...patch } } };
    });
  }
  function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImages((current) => ({ ...current, [pKey]: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  function changeTemplate(targetId: string) {
    if (!snapshot || targetId === templateId) return;
    const migrated = remapProjectState(snapshot, targetId);
    applyState(migrated);
    setDuplicateTemplateId(targetId);
  }

  function applyPending(photo: PendingPhoto) {
    setImages((current) => ({ ...current, [pKey]: photo.image }));
    if (photo.photoCfg) setPhotoCfgs((current) => ({ ...current, [pKey]: photo.photoCfg as PhotoCfg }));
    setPendingPhotos((current) => current.filter((item) => item.id !== photo.id));
  }

  async function duplicateInTemplate() {
    if (!snapshot) return;
    const newId = makeId();
    const duplicated = { ...remapProjectState(snapshot, duplicateTemplateId, newId), status: "salvo" as const, cardIndex: 0, slotIndex: 0, updatedAt: new Date().toISOString() };
    localStorage.setItem(`mago-project:${newId}`, JSON.stringify(duplicated));
    rememberProject(newId);
    const caption = localStorage.getItem(`mago-project-caption:${projectId}`) || "";
    if (caption) localStorage.setItem(`mago-project-caption:${newId}`, caption);

    const targetTemplate = INSTAGRAM_45PLUS_LIBRARY.find((item) => item.id === duplicated.templateId) ?? INSTAGRAM_45PLUS_LIBRARY[0];
    const cards = targetTemplate.cards.flatMap((targetCard, index) => {
      const savedCopy = duplicated.copies[cardKey(duplicated.templateId, index)] ?? DEFAULT_COPY;
      const savedSize = duplicated.textSizes[cardKey(duplicated.templateId, index)] ?? "medium";
      return targetCard.photos.map((_, photoIndex) => ({
        card: index + 1,
        headline: savedCopy.headline,
        body: savedCopy.body,
        cta: savedCopy.cta,
        slot_index: photoIndex,
        text_size: savedSize,
        image_url: duplicated.images[photoKey(duplicated.templateId, index, photoIndex)] || undefined,
      }));
    });
    const url = `${window.location.origin}/studio?project=${encodeURIComponent(newId)}`;
    const opened = window.open(url, "_blank");
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_id: newId, template: duplicated.templateId, status: "salvo", caption, legenda: caption, cards, editor_state: duplicated }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (opened) opened.location.reload();
    } catch (error) {
      await navigator.clipboard?.writeText(url).catch(() => undefined);
      alert(`A cópia foi criada no navegador, mas a VPS não confirmou a criação (${String(error)}). O link foi copiado para você.`);
    }
  }

  async function removeProject() {
    if (!confirm("Excluir este projeto salvo? Esta ação não pode ser desfeita.")) return;
    localStorage.removeItem(`mago-project:${projectId}`);
    const ids = JSON.parse(localStorage.getItem("mago-project-index") || "[]") as string[];
    localStorage.setItem("mago-project-index", JSON.stringify(ids.filter((id) => id !== projectId)));
    await fetch(`/api/projects/${encodeURIComponent(projectId)}`, { method: "DELETE" }).catch(() => undefined);
    window.location.href = "/studio";
  }
  function copyLink() {
    void navigator.clipboard?.writeText(window.location.href);
    alert("Link do projeto copiado.");
  }

  return <main style={{ minHeight: "100vh", background: "#111", color: "#fff", padding: 22, fontFamily: "Arial,sans-serif" }}>
    <div style={{ maxWidth: 1450, margin: "auto" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", marginBottom: 12 }}>
        <div><b>{projectId || "Novo projeto"}</b><span style={{ marginLeft: 10, fontSize: 12, opacity: .7 }}>{lastSaved ? `Salvo automaticamente às ${new Date(lastSaved).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} ✓` : "Preparando salvamento..."}</span></div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={copyLink}>🔗 Copiar link</button>
          <button onClick={() => persist("salvo")} style={{ background: "#3b6b57", color: "white" }}>💾 Salvar</button>
          <button onClick={() => persist("aprovado")} style={{ background: "#92533D", color: "white" }}>✓ Aprovar</button>
          <button onClick={() => void removeProject()} style={{ background: "#54252b", color: "white" }}>🗑 Excluir</button>
          <Link href="/publicacao" style={{ background: "#703C49", color: "#fff", padding: "9px 12px", borderRadius: 8, textDecoration: "none", fontWeight: 800 }}>🔒 Central</Link>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: 24 }}>
        <aside style={{ background: "#202020", borderRadius: 18, padding: 18, maxHeight: "calc(100vh - 100px)", overflowY: "auto" }}>
          <h1 style={{ margin: "0 0 4px" }}>Carousel Studio · Biblioteca 45+</h1>
          <p style={{ opacity: .65 }}>12 templates · 60 layouts-base · 1080×1350 · {status.toUpperCase()}</p>

          <label>Trocar template — preserva conteúdo</label>
          <select value={templateId} onChange={(event) => changeTemplate(event.target.value)} style={control}>
            {INSTAGRAM_45PLUS_LIBRARY.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.name}</option>)}
          </select>
          <p style={{ fontSize: 12, opacity: .7 }}>{template.description}</p>

          <div style={{ background: "#292929", padding: 10, borderRadius: 10, marginBottom: 12 }}>
            <strong>Duplicar em outro template</strong>
            <select value={duplicateTemplateId} onChange={(event) => setDuplicateTemplateId(event.target.value)} style={control}>
              {INSTAGRAM_45PLUS_LIBRARY.map((item) => <option key={item.id} value={item.id}>{item.id} · {item.name}</option>)}
            </select>
            <button onClick={() => void duplicateInTemplate()} style={{ width: "100%", marginTop: 8 }}>Duplicar e abrir comparação ↗</button>
          </div>

          {pendingPhotos.length > 0 && <div style={{ background: "#493731", padding: 10, borderRadius: 10, marginBottom: 12 }}>
            <strong>{pendingPhotos.length} foto(s) pendente(s)</strong>
            <p style={{ fontSize: 12, opacity: .8 }}>Não couberam nos slots do template atual. Selecione um card/área de foto e use a imagem desejada.</p>
            <div style={{ display: "grid", gap: 8 }}>
              {pendingPhotos.map((photo) => <div key={photo.id} style={{ display: "grid", gridTemplateColumns: "54px 1fr auto", gap: 8, alignItems: "center" }}>
                <img src={photo.image} alt="" style={{ width: 54, height: 54, objectFit: "cover", borderRadius: 8 }} />
                <span style={{ fontSize: 11 }}>{photo.fromTemplate} · card {photo.fromCard + 1} · foto {photo.fromSlot + 1}</span>
                <button onClick={() => applyPending(photo)}>Usar aqui</button>
              </div>)}
            </div>
          </div>}

          <hr style={{ borderColor: "#333" }} />
          <strong>Card {cardIndex + 1}/5</strong>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 5, marginTop: 8 }}>
            {template.cards.map((_, index) => <button key={index} onClick={() => { setCardIndex(index); setSlotIndex(0); }}>{index + 1}</button>)}
          </div>

          <label style={{ display: "block", marginTop: 12 }}>Área de foto</label>
          <select value={safeSlot} onChange={(event) => setSlotIndex(Number(event.target.value))} style={control}>
            {card.photos.map((_, index) => <option key={index} value={index}>Foto {index + 1}</option>)}
          </select>
          <input type="file" accept="image/*" onChange={upload} style={{ marginTop: 10 }} />
          <label style={{ display: "block", marginTop: 10 }}>Encaixe</label>
          <select value={photoCfg.fit} onChange={(event) => patchPhoto({ fit: event.target.value as "cover" | "contain" })} style={control}><option value="cover">Cover</option><option value="contain">Contain</option></select>
          <label>Mover foto X {photoCfg.x}px</label><input type="range" min="-220" max="220" value={photoCfg.x} onChange={(event) => patchPhoto({ x: Number(event.target.value) })} style={{ width: "100%" }} />
          <label>Mover foto Y {photoCfg.y}px</label><input type="range" min="-220" max="220" value={photoCfg.y} onChange={(event) => patchPhoto({ y: Number(event.target.value) })} style={{ width: "100%" }} />
          <label>Zoom {photoCfg.zoom}%</label><input type="range" min="70" max="220" value={photoCfg.zoom} onChange={(event) => patchPhoto({ zoom: Number(event.target.value) })} style={{ width: "100%" }} />

          <hr style={{ borderColor: "#333" }} />
          <strong>Cores</strong>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <label>Fundo<input type="color" value={colors.bg} onChange={(event) => setColorsByCard((current) => ({ ...current, [cKey]: { ...colors, bg: event.target.value } }))} /></label>
            <label>Letras<input type="color" value={colors.text} onChange={(event) => setColorsByCard((current) => ({ ...current, [cKey]: { ...colors, text: event.target.value } }))} /></label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginTop: 8 }}>
            {COLOR_PRESETS.map((preset) => <button key={preset.name} onClick={() => setColorsByCard((current) => ({ ...current, [cKey]: { bg: preset.bg, text: preset.text } }))} style={{ background: preset.bg, color: preset.text }}>{preset.name}</button>)}
          </div>

          <hr style={{ borderColor: "#333" }} />
          <strong>Tipografia</strong>
          <select value={typeStyle} onChange={(event) => setTypeStyles((current) => ({ ...current, [cKey]: event.target.value as TypeStyle }))} style={control}>
            {TYPE_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.name}</option>)}
          </select>
          <label style={{ display: "block", marginTop: 12 }}>Tamanho do texto</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 5 }}>
            {(["small", "medium", "large"] as TextSize[]).map((size) => <button key={size} onClick={() => setTextSizes((current) => ({ ...current, [cKey]: size }))}>{size === "small" ? "Pequeno" : size === "medium" ? "Médio" : "Grande"}</button>)}
          </div>
          <label style={{ display: "block", marginTop: 12 }}>Mover bloco</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 5 }}>
            {(["headline", "body", "cta"] as TextBlock[]).map((block) => <button key={block} onClick={() => setActiveTextBlock(block)}>{block === "headline" ? "Título" : block === "body" ? "Corpo" : "CTA"}</button>)}
          </div>
          <label>X {activeMove.x}px</label><input type="range" min="-260" max="260" value={activeMove.x} onChange={(event) => patchMove({ x: Number(event.target.value) })} style={{ width: "100%" }} />
          <label>Y {activeMove.y}px</label><input type="range" min="-320" max="320" value={activeMove.y} onChange={(event) => patchMove({ y: Number(event.target.value) })} style={{ width: "100%" }} />
          <button onClick={() => setTextMovesByCard((current) => ({ ...current, [cKey]: DEFAULT_MOVES }))} style={{ width: "100%" }}>Resetar posições</button>
          <label style={{ display: "block", marginTop: 12 }}>Headline</label><textarea value={copy.headline} onChange={(event) => patchCopy({ headline: event.target.value })} rows={3} style={control} />
          <label>Texto</label><textarea value={copy.body} onChange={(event) => patchCopy({ body: event.target.value })} rows={3} style={control} />
          <label>CTA</label><input value={copy.cta} onChange={(event) => patchCopy({ cta: event.target.value })} style={control} />
        </aside>

        <section>
          <div style={{ width: W, height: H, margin: "0 auto", boxShadow: "0 22px 70px #0009" }}>
            <Canvas template={template} card={card} cardIndex={cardIndex} images={images} photoCfgs={photoCfgs} copy={copy} textSize={textSize} textMoves={textMoves} colors={colors} typeStyle={typeStyle} onSlot={setSlotIndex} />
          </div>
        </section>
      </div>
    </div>
  </main>;
}
