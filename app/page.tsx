"use client";
import { useState, useRef } from "react";
import * as htmlToImage from "html-to-image";

type PhotoLayout = "top-full" | "top-badge" | "top-overlay";

type Slide =
  | { type: "cover"; tag: string; title: string; subtitle: string; bgImage?: string }
  | { type: "content"; label: string; headline: string; body: string; bgImage?: string }
  | { type: "photo"; label: string; headline: string; body: string; photoImage?: string; photoLayout: PhotoLayout; bgImage?: string }
  | { type: "cta"; tag: string; title: string; action1: string; action2: string; action3: string; footer: string; bgImage?: string };

const TEMPLATES = [
  { id: "minimal", name: "Minimal", bg: "#ffffff", text: "#111111", accent: "#C8102E", tagBg: "#FFF0F2", tagText: "#C8102E" },
  { id: "bold-red", name: "Red", bg: "#C8102E", text: "#ffffff", accent: "#ffffff", tagBg: "rgba(255,255,255,0.2)", tagText: "#ffffff" },
  { id: "bold", name: "Bold", bg: "#111111", text: "#ffffff", accent: "#facc15", tagBg: "#1f1f1f", tagText: "#facc15" },
  { id: "grad", name: "Grad.", bg: "linear-gradient(135deg,#7c3aed,#2563eb)", text: "#ffffff", accent: "#a5f3fc", tagBg: "rgba(255,255,255,0.15)", tagText: "#e0f2fe" },
  { id: "card", name: "Card", bg: "#f5f0eb", text: "#2d2d2d", accent: "#b45309", tagBg: "#e7e0d9", tagText: "#92400e" },
  { id: "neon", name: "Neon", bg: "#030712", text: "#f0fdf4", accent: "#22d3ee", tagBg: "rgba(34,211,238,0.1)", tagText: "#22d3ee" },
];

const VOZES = [
  { id: "educativo", label: "🎓 Educativo" },
  { id: "descontraido", label: "😄 Descontraído" },
  { id: "profissional", label: "👔 Profissional" },
  { id: "vendas", label: "🔥 Vendas" },
];

const PHOTO_LAYOUTS: { id: PhotoLayout; label: string; desc: string }[] = [
  { id: "top-full", label: "Foto grande", desc: "Foto ocupa topo inteiro" },
  { id: "top-badge", label: "Foto + badge", desc: "Foto com etiqueta flutuante" },
  { id: "top-overlay", label: "Título sobre foto", desc: "Título aparece sobre a foto" },
];

const PADRAO: Slide[] = [
  {
    type: "cover",
    tag: "O Calendário do Cabelo",
    title: "Cada dia carrega\numa intenção.",
    subtitle: "Descubra como o momento certo pode valorizar seu cabelo, renovar sua imagem e acompanhar a fase que você deseja viver."
  },
  {
    type: "content",
    label: "Dia 01",
    headline: "Recomeços.",
    body: "Um bom dia para iniciar um novo ciclo. Cortar o cabelo hoje pode simbolizar leveza e renovação."
  },
  {
    type: "photo",
    label: "Antes & Depois",
    headline: "Transformação real.",
    body: "Veja a diferença que um corte certo faz na autoestima e na imagem de cada cliente.",
    photoLayout: "top-badge",
  },
  {
    type: "cta",
    tag: "Salve este conteúdo",
    title: "Guarde este carrossel para consultar sempre que quiser.",
    action1: "❤️ Curte se fez sentido pra você",
    action2: "💬 Comente qual dia combina com você",
    action3: "🔖 Salva para acessar quando quiser",
    footer: "@omagodastesouras · Parte 1 de 5"
  },
];

export default function Home() {
  const [handle, setHandle] = useState("@omagodastesouras");
  const [visible, setVisible] = useState(true);
  const [idx, setIdx] = useState(0);
  const [slides, setSlides] = useState<Slide[]>(PADRAO);
  const [tplId, setTplId] = useState("minimal");
  const [voz, setVoz] = useState("educativo");
  const [tema, setTema] = useState("");
  const [gerando, setGerando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [stories, setStories] = useState(false);
  const slideRef = useRef<HTMLDivElement>(null);

  const slide = slides[idx];
  const tpl = TEMPLATES.find((t) => t.id === tplId)!;
  const isRedBold = tplId === "bold-red";

  function ir(n: number) {
    setVisible(false);
    setTimeout(() => { setIdx(n); setVisible(true); }, 180);
  }

  function set(campo: string, valor: string) {
    const c = [...slides];
    c[idx] = { ...slide, [campo]: valor } as Slide;
    setSlides(c);
  }

  function addSlide() {
    const novo: Slide = { type: "content", label: `Dica ${String(slides.length).padStart(2, "0")}`, headline: "Novo slide.", body: "Escreva aqui o conteúdo." };
    setSlides([...slides.slice(0, -1), novo, slides[slides.length - 1]]);
    ir(slides.length - 1);
  }

  function addPhotoSlide() {
    const novo: Slide = { type: "photo", label: "Antes & Depois", headline: "Resultado incrível.", body: "Descreva aqui a transformação.", photoLayout: "top-badge" };
    setSlides([...slides.slice(0, -1), novo, slides[slides.length - 1]]);
    ir(slides.length - 1);
  }

  function delSlide() {
    if (slides.length <= 1) return;
    const c = slides.filter((_, i) => i !== idx);
    setSlides(c);
    ir(Math.max(0, idx - 1));
  }

  function setBg(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => set("bgImage", ev.target?.result as string);
    r.readAsDataURL(f);
  }

  function setPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => set("photoImage", ev.target?.result as string);
    r.readAsDataURL(f);
  }

  function removeBg() { set("bgImage", ""); }
  function removePhoto() { set("photoImage", ""); }

  async function exportPNG() {
    if (!slideRef.current) return;
    setExportando(true);
    try {
      const url = await htmlToImage.toPng(slideRef.current, { pixelRatio: 2.5 });
      const a = document.createElement("a");
      a.download = `slide-${idx + 1}.png`;
      a.href = url;
      a.click();
    } catch { alert("Erro ao exportar."); }
    finally { setExportando(false); }
  }

  async function exportTodos() {
    setExportando(true);
    for (let i = 0; i < slides.length; i++) {
      await new Promise<void>((res) => {
        setVisible(false);
        setTimeout(() => {
          setIdx(i); setVisible(true);
          setTimeout(async () => {
            if (slideRef.current) {
              const url = await htmlToImage.toPng(slideRef.current, { pixelRatio: 2.5 });
              const a = document.createElement("a");
              a.download = `slide-${i + 1}.png`;
              a.href = url;
              a.click();
            }
            res();
          }, 400);
        }, 200);
      });
      await new Promise((r) => setTimeout(r, 300));
    }
    setExportando(false);
  }

  async function gerarIA() {
    if (!tema.trim()) return alert("Digite um tema!");
    setGerando(true);
    try {
      const res = await fetch("/api/gerar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tema, voz, handle }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      if (data.slides) { setSlides(data.slides); ir(0); }
    } catch (e: unknown) { alert("Erro: " + (e instanceof Error ? e.message : String(e))); }
    finally { setGerando(false); }
  }

  async function gerarLegenda() {
    setGerando(true);
    try {
      const capa = slides.find((s) => s.type === "cover") as { title: string } | undefined;
      const titulo = capa?.title?.replace(/\n/g, " ") || tema;
      const res = await fetch("/api/legenda", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titulo, voz }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      const leg = data.legenda || "";
      await navigator.clipboard.writeText(leg).catch(() => {});
      alert("✅ Legenda copiada!\n\n" + leg);
    } catch (e: unknown) { alert("Erro: " + (e instanceof Error ? e.message : String(e))); }
    finally { setGerando(false); }
  }

  const bgImage = (slide as Slide & { bgImage?: string }).bgImage;
  const isGrad = tpl.bg.startsWith("linear");
  const W = stories ? 405 : 540;
  const H = stories ? 720 : 540;
  const isPhotoSlide = slide.type === "photo";
  const photoSlide = isPhotoSlide ? (slide as Extract<Slide, { type: "photo" }>) : null;

  // Dots de navegação reutilizáveis
  function Dots({ accent }: { accent: string }) {
    return (
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 5, alignItems: "center" }}>
        {slides.map((_, i) => (
          <div key={i} style={{ width: i === idx ? 22 : 7, height: 7, borderRadius: 100, background: i === idx ? accent : "rgba(0,0,0,0.15)", transition: "width 0.2s" }} />
        ))}
      </div>
    );
  }

  // Badge reutilizável
  function Badge({ text }: { text: string }) {
    return (
      <div style={{
        display: "inline-block",
        background: tpl.tagBg,
        color: tpl.tagText,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.1em",
        textTransform: "uppercase" as const,
        padding: "6px 16px",
        borderRadius: 100,
        border: isRedBold ? "1.5px solid rgba(255,255,255,0.35)" : `1.5px solid ${tpl.accent}`,
      }}>
        {text}
      </div>
    );
  }

  function PhotoSlideContent({ s }: { s: Extract<Slide, { type: "photo" }> }) {
    const photoH = s.photoLayout === "top-full" ? 260 : s.photoLayout === "top-overlay" ? 240 : 210;

    return (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* BLOCO DA FOTO */}
        <div style={{ width: "100%", height: photoH, position: "relative", flexShrink: 0, backgroundColor: tpl.tagBg, overflow: "hidden" }}>
          {s.photoImage ? (
            <img src={s.photoImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={tpl.tagText} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
              </svg>
              <span style={{ fontSize: 12, color: tpl.tagText, fontWeight: 600 }}>Adicione sua foto</span>
            </div>
          )}
          {s.photoLayout === "top-badge" && s.label && (
            <div style={{ position: "absolute", bottom: 12, left: 12, background: isGrad ? "rgba(255,255,255,0.95)" : tpl.bg, color: tpl.text, fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 100 }}>
              {s.label}
            </div>
          )}
          {s.photoLayout === "top-overlay" && (
            <>
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.05) 60%, transparent 100%)" }} />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "16px 20px" }}>
                {s.label && <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>{s.label}</div>}
                <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.15, color: "#ffffff" }}>{s.headline}</div>
              </div>
            </>
          )}
        </div>

        {/* BLOCO DE TEXTO */}
        <div style={{ flex: 1, padding: "16px 20px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 8 }}>
          {s.photoLayout === "top-full" && s.label && (
            <div style={{ display: "inline-block", background: tpl.tagBg, color: tpl.tagText, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 12px", borderRadius: 100, width: "fit-content" }}>
              {s.label}
            </div>
          )}
          {s.photoLayout !== "top-overlay" && (
            <div style={{ fontSize: 22, fontWeight: 900, lineHeight: 1.2, color: tpl.accent }}>{s.headline}</div>
          )}
          {s.photoLayout === "top-overlay" && s.label && (
            <div style={{ display: "inline-block", background: tpl.tagBg, color: tpl.tagText, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "3px 10px", borderRadius: 100, width: "fit-content" }}>
              {s.label}
            </div>
          )}
          <div style={{ fontSize: 16, lineHeight: 1.65, opacity: 0.82, color: tpl.text }}>{s.body}</div>
          <div style={{ fontSize: 12, opacity: 0.4, color: tpl.text, marginTop: "auto" }}>{handle}</div>
        </div>
      </div>
    );
  }

  function SlideContent() {
    // ── CAPA ──────────────────────────────────────────────────────────────
    if (slide.type === "cover") {
      // Versão Bold Red: header vermelho com texto branco grande
      if (isRedBold) {
        return (
          <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
            {/* Header vermelho */}
            <div style={{ background: tpl.bg, padding: "28px 32px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Badge text={slide.tag} />
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{handle}</span>
              </div>
              <div style={{ fontSize: 38, fontWeight: 900, lineHeight: 1.15, whiteSpace: "pre-line", color: "#ffffff" }}>{slide.title}</div>
            </div>
            {/* Corpo branco */}
            <div style={{ flex: 1, background: "#ffffff", padding: "22px 32px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ fontSize: 18, lineHeight: 1.65, color: "#444" }}>{slide.subtitle}</div>
              <Dots accent={tpl.bg} />
            </div>
          </div>
        );
      }

      // Versão Minimal (fundo branco)
      return (
        <div style={{ width: "100%", height: "100%", padding: "40px 36px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Badge text={slide.tag} />
            <div style={{ fontSize: 13, color: tpl.accent, fontWeight: 600, opacity: 0.8 }}>{handle}</div>
          </div>
          <div>
            <div style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.15, whiteSpace: "pre-line", marginBottom: 18, color: tpl.accent }}>{slide.title}</div>
            <div style={{ fontSize: 18, lineHeight: 1.65, color: tpl.text, opacity: 0.75 }}>{slide.subtitle}</div>
          </div>
          <Dots accent={tpl.accent} />
        </div>
      );
    }

    // ── CONTEÚDO ──────────────────────────────────────────────────────────
    if (slide.type === "content") {
      // Versão Bold Red: header vermelho, corpo branco
      if (isRedBold) {
        return (
          <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", boxSizing: "border-box" }}>
            {/* Header vermelho */}
            <div style={{ background: tpl.bg, padding: "24px 32px 22px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Badge text={slide.label} />
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>{handle}</span>
              </div>
              <div style={{ fontSize: 34, fontWeight: 900, lineHeight: 1.2, color: "#ffffff" }}>{slide.headline}</div>
            </div>
            {/* Corpo branco */}
            <div style={{ flex: 1, background: "#ffffff", padding: "22px 32px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ background: "#FFF3F5", borderLeft: "5px solid #C8102E", borderRadius: "0 12px 12px 0", padding: "14px 18px", fontSize: 18, color: "#7a1020", lineHeight: 1.55, fontWeight: 500 }}>
                {slide.body}
              </div>
              <Dots accent={tpl.bg} />
            </div>
          </div>
        );
      }

      // Versão Minimal (fundo branco)
      return (
        <div style={{ width: "100%", height: "100%", padding: "40px 36px", display: "flex", flexDirection: "column", justifyContent: "space-between", boxSizing: "border-box" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Badge text={slide.label} />
            <div style={{ fontSize: 13, color: tpl.accent, fontWeight: 600, opacity: 0.8 }}>{handle}</div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 18, paddingTop: 24 }}>
            <div style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.2, color: tpl.accent }}>{slide.headline}</div>
            <div style={{ background: "#FFF3F5", borderLeft: `5px solid ${tpl.accent}`, borderRadius: "0 12px 12px 0", padding: "14px 18px", fontSize: 18, color: "#7a1020", lineHeight: 1.55, fontWeight: 500 }}>
              {slide.body}
            </div>
          </div>
          <Dots accent={tpl.accent} />
        </div>
      );
    }

    // ── FOTO ──────────────────────────────────────────────────────────────
    if (slide.type === "photo") return <PhotoSlideContent s={slide} />;

    // ── CTA ───────────────────────────────────────────────────────────────
    if (slide.type === "cta") {
      const items = [
        { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>, text: slide.action1 },
        { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>, text: slide.action2 },
        { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>, text: slide.action3 },
        { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>, text: "📤 Compartilhe com alguém especial" },
      ];
      return (
        <div style={{ width: "100%", height: "100%", padding: "30px 28px", display: "flex", flexDirection: "column", boxSizing: "border-box", background: "#ffffff" }}>
          <div style={{ display: "inline-block", background: "#111", color: "#fff", fontSize: 11, fontWeight: 900, letterSpacing: "0.07em", textTransform: "uppercase", padding: "8px 18px", borderRadius: 100, marginBottom: 22, width: "fit-content" }}>{slide.tag}</div>
          <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.2, color: "#111", marginBottom: 28 }}>{slide.title}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, color: "#111" }}>
                <span style={{ width: 36, minWidth: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}>{item.icon}</span>
                <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>{item.text}</span>
              </div>
            ))}
          </div>
          <div style={{ paddingTop: 12, borderTop: "1.5px solid rgba(17,17,17,0.12)", marginTop: "auto" }}>
            <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.6, color: "#111" }}>{slide.footer || handle}</span>
          </div>
        </div>
      );
    }

    return null;
  }

  const bgImage = (slide as Slide & { bgImage?: string }).bgImage;
  const isGrad = tpl.bg.startsWith("linear");

  return (
    <main style={{ minHeight: "100vh", background: "#e5e5e5", padding: 32, display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 960, display: "grid", gridTemplateColumns: "360px 1fr", gap: 24 }}>

        {/* ── SIDEBAR ── */}
        <aside style={{ background: "#fff", borderRadius: 24, padding: 24, display: "flex", flexDirection: "column", gap: 20, maxHeight: "95vh", overflowY: "auto" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>Gerador de Carrossel</div>
            <div style={{ fontSize: 13, color: "#888" }}>IA · Templates · Stories · Legenda</div>
          </div>

          {/* Templates */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>🎨 Modelo de criativo</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => setTplId(t.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: 4, borderRadius: 12, border: tplId === t.id ? "2px solid #000" : "2px solid transparent", background: "none", cursor: "pointer" }}>
                  <div style={{ width: 48, height: 56, background: t.bg, borderRadius: 8, border: "1px solid #e5e5e5", position: "relative", overflow: "hidden" }}>
                    {t.id === "bold-red" && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "45%", background: "#ffffff" }} />}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 500 }}>{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* IA */}
          <div style={{ border: "1px solid #e5e5e5", borderRadius: 16, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 15 }}>✨</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Gerar com IA</span>
              <span style={{ marginLeft: "auto", fontSize: 11, background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: 100, fontWeight: 600 }}>Groq</span>
            </div>
            <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Tom de voz:</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
              {VOZES.map((v) => (
                <button key={v.id} onClick={() => setVoz(v.id)} style={{ fontSize: 12, padding: "6px 12px", borderRadius: 100, border: "1px solid", borderColor: voz === v.id ? "#000" : "#d4d4d4", background: voz === v.id ? "#000" : "#fff", color: voz === v.id ? "#fff" : "#555", cursor: "pointer" }}>{v.label}</button>
              ))}
            </div>
            <textarea value={tema} onChange={(e) => setTema(e.target.value)} rows={3} placeholder="Ex: dicas de cuidado com cabelo crespo" style={{ width: "100%", border: "1px solid #d4d4d4", borderRadius: 12, padding: "8px 12px", fontSize: 13, outline: "none", resize: "none", marginBottom: 10, boxSizing: "border-box" }} />
            <button onClick={gerarIA} disabled={gerando} style={{ width: "100%", background: "#000", color: "#fff", border: "none", borderRadius: 12, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginBottom: 8, opacity: gerando ? 0.5 : 1 }}>
              {gerando ? "⏳ Gerando..." : "✨ Gerar carrossel"}
            </button>
            <button onClick={gerarLegenda} disabled={gerando} style={{ width: "100%", background: "#fff", color: "#333", border: "1px solid #d4d4d4", borderRadius: 12, padding: "8px", fontSize: 13, cursor: "pointer", opacity: gerando ? 0.5 : 1 }}>
              📋 Gerar legenda do Instagram
            </button>
          </div>

          {/* Handle */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Handle</div>
            <input value={handle} onChange={(e) => setHandle(e.target.value)} style={{ width: "100%", border: "1px solid #d4d4d4", borderRadius: 12, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>

          {/* Slides */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Slides</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {slides.map((s, i) => (
                <button key={i} onClick={() => ir(i)} style={{ padding: "6px 12px", borderRadius: 10, border: "none", background: idx === i ? "#000" : "#f5f5f5", color: idx === i ? "#fff" : "#333", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>
                  {s.type === "cover" ? "Capa" : s.type === "cta" ? "CTA" : s.type === "photo" ? `📷${i + 1}` : String(i + 1)}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button onClick={addSlide} style={{ flex: 1, border: "1px dashed #ccc", borderRadius: 10, padding: "6px", fontSize: 12, color: "#888", background: "none", cursor: "pointer" }}>+ Texto</button>
              <button onClick={addPhotoSlide} style={{ flex: 1, border: "1px dashed #a3a3a3", borderRadius: 10, padding: "6px", fontSize: 12, color: "#444", background: "none", cursor: "pointer", fontWeight: 600 }}>📷 + Foto</button>
              {slides.length > 1 && (
                <button onClick={delSlide} style={{ border: "1px dashed #fca5a5", borderRadius: 10, padding: "6px 10px", fontSize: 12, color: "#ef4444", background: "none", cursor: "pointer" }}>Remover</button>
              )}
            </div>
          </div>

          {/* Painel foto */}
          {isPhotoSlide && (
            <div style={{ border: "2px solid #000", borderRadius: 16, padding: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>📷 Configurar slide de foto</div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>Escolha a variação de layout:</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                {PHOTO_LAYOUTS.map((pl) => (
                  <button key={pl.id} onClick={() => set("photoLayout", pl.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, border: photoSlide?.photoLayout === pl.id ? "2px solid #000" : "1px solid #d4d4d4", background: photoSlide?.photoLayout === pl.id ? "#000" : "#fff", color: photoSlide?.photoLayout === pl.id ? "#fff" : "#333", cursor: "pointer", textAlign: "left" }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{pl.label}</div>
                      <div style={{ fontSize: 11, opacity: 0.6 }}>{pl.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <label style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", border: "1px dashed #555", borderRadius: 12, padding: "12px", fontSize: 13, color: "#333", cursor: "pointer", boxSizing: "border-box", fontWeight: 700, gap: 8 }}>
                📁 Subir foto do seu PC
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={setPhoto} />
              </label>
              {photoSlide?.photoImage && (
                <button onClick={removePhoto} style={{ marginTop: 6, fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Remover foto</button>
              )}
            </div>
          )}

          {/* Fundo */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>🖼 Fundo do slide (opcional)</div>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", border: "1px dashed #ccc", borderRadius: 12, padding: "10px", fontSize: 13, color: "#888", cursor: "pointer", boxSizing: "border-box" }}>
              📷 Subir fundo para este slide
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={setBg} />
            </label>
            {bgImage && <button onClick={removeBg} style={{ marginTop: 6, fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Remover fundo</button>}
          </div>

          {/* Editar slide */}
          <div style={{ border: "1px solid #e5e5e5", borderRadius: 16, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>✏️ Editar slide</div>
            {slide.type === "cover" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12, background: "#f5f5f5", borderRadius: 10, padding: "8px 12px", color: "#666" }}>Capa</div>
                {(["tag", "title", "subtitle"] as const).map((c) => (
                  <label key={c}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, textTransform: "capitalize" }}>{c}</div>
                    {c === "subtitle" ? <textarea value={slide[c]} onChange={(e) => set(c, e.target.value)} rows={4} style={{ width: "100%", border: "1px solid #d4d4d4", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box" }} /> : <input value={slide[c]} onChange={(e) => set(c, e.target.value)} style={{ width: "100%", border: "1px solid #d4d4d4", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />}
                  </label>
                ))}
              </div>
            )}
            {slide.type === "content" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12, background: "#f5f5f5", borderRadius: 10, padding: "8px 12px", color: "#666" }}>Conteúdo</div>
                {(["label", "headline", "body"] as const).map((c) => (
                  <label key={c}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, textTransform: "capitalize" }}>{c}</div>
                    {c === "body" ? <textarea value={slide[c]} onChange={(e) => set(c, e.target.value)} rows={5} style={{ width: "100%", border: "1px solid #d4d4d4", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box" }} /> : <input value={slide[c]} onChange={(e) => set(c, e.target.value)} style={{ width: "100%", border: "1px solid #d4d4d4", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />}
                  </label>
                ))}
              </div>
            )}
            {slide.type === "photo" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12, background: "#f5f5f5", borderRadius: 10, padding: "8px 12px", color: "#666" }}>Slide de Foto</div>
                {(["label", "headline", "body"] as const).map((c) => (
                  <label key={c}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{c === "label" ? "Etiqueta" : c === "headline" ? "Título" : "Texto"}</div>
                    {c === "body" ? <textarea value={slide[c]} onChange={(e) => set(c, e.target.value)} rows={4} style={{ width: "100%", border: "1px solid #d4d4d4", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box" }} /> : <input value={slide[c]} onChange={(e) => set(c, e.target.value)} style={{ width: "100%", border: "1px solid #d4d4d4", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />}
                  </label>
                ))}
              </div>
            )}
            {slide.type === "cta" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 12, background: "#f5f5f5", borderRadius: 10, padding: "8px 12px", color: "#666" }}>CTA</div>
                {(["tag", "title", "action1", "action2", "action3", "footer"] as const).map((c) => (
                  <label key={c}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, textTransform: "capitalize" }}>{c}</div>
                    <input value={slide[c] || ""} onChange={(e) => set(c, e.target.value)} style={{ width: "100%", border: "1px solid #d4d4d4", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Stories toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>📱 Formato Stories (9:16)</span>
            <div onClick={() => setStories(!stories)} style={{ width: 40, height: 22, borderRadius: 100, background: stories ? "#000" : "#d4d4d4", position: "relative", cursor: "pointer", flexShrink: 0 }}>
              <div style={{ position: "absolute", top: 3, left: stories ? 20 : 3, width: 16, height: 16, borderRadius: 100, background: "#fff", transition: "left 0.2s" }} />
            </div>
          </div>

          {/* Export */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={exportPNG} disabled={exportando} style={{ width: "100%", background: "#000", color: "#fff", border: "none", borderRadius: 12, padding: "12px", fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: exportando ? 0.5 : 1 }}>
              {exportando ? "⏳ Exportando..." : "⬇ Baixar slide atual (PNG)"}
            </button>
            <button onClick={exportTodos} disabled={exportando} style={{ width: "100%", background: "#fff", color: "#333", border: "1px solid #d4d4d4", borderRadius: 12, padding: "10px", fontSize: 13, cursor: "pointer", opacity: exportando ? 0.5 : 1 }}>
              ⬇ Baixar todos os slides
            </button>
          </div>
        </aside>

        {/* ── PREVIEW ── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div ref={slideRef} style={{ width: W, height: H, backgroundColor: isGrad ? undefined : bgImage ? "transparent" : (isRedBold ? "#ffffff" : tpl.bg), backgroundImage: bgImage ? `url(${bgImage})` : isGrad ? tpl.bg : undefined, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat", borderRadius: 24, overflow: "hidden", position: "relative", boxShadow: "0 8px 40px rgba(0,0,0,0.12)", opacity: visible ? 1 : 0, transition: "opacity 0.18s" }}>
            {bgImage && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />}
            <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}><SlideContent /></div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => ir((idx - 1 + slides.length) % slides.length)} style={{ padding: "8px 20px", borderRadius: 12, border: "1px solid #ccc", background: "#fff", cursor: "pointer", fontSize: 13 }}>← Anterior</button>
            <span style={{ fontSize: 13, color: "#888", alignSelf: "center" }}>{idx + 1} / {slides.length}</span>
            <button onClick={() => ir((idx + 1) % slides.length)} style={{ padding: "8px 20px", borderRadius: 12, border: "none", background: "#000", color: "#fff", cursor: "pointer", fontSize: 13 }}>Próximo →</button>
          </div>
        </div>

      </div>
    </main>
  );
}
