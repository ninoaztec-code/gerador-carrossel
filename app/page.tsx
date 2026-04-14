"use client";
import { useState, useRef } from "react";
import * as htmlToImage from "html-to-image";

type Slide =
  | { type: "cover"; tag: string; title: string; subtitle: string; imgUrl?: string }
  | { type: "content"; label: string; headline: string; body: string; imgUrl?: string }
  | { type: "cta"; tag: string; title: string; action1: string; action2: string; action3: string; footer: string; imgUrl?: string };

const TEMPLATES = [
  { id: "minimal", name: "Minimal", bg: "#ffffff", text: "#111111", accent: "#e53e3e", tagBg: "#f5f5f5", tagText: "#666666" },
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

const PADRAO: Slide[] = [
  { type: "cover", tag: "O Calendário do Cabelo", title: "Cada dia carrega\numa intenção.", subtitle: "Descubra como o momento certo pode valorizar seu cabelo, renovar sua imagem e acompanhar a fase que você deseja viver." },
  { type: "content", label: "Dia 01", headline: "Recomeços.", body: "Um bom dia para iniciar um novo ciclo. Cortar o cabelo hoje pode simbolizar leveza e renovação." },
  { type: "content", label: "Dia 02", headline: "Equilíbrio.", body: "Um momento favorável para buscar harmonia. O corte transmite organização e suavidade." },
  { type: "content", label: "Dia 03", headline: "Transformação.", body: "Quando a energia pede mudança, este é um ótimo dia para se reinventar com um novo corte." },
  { type: "cta", tag: "Salve este conteúdo", title: "Guarde este carrossel para consultar sempre que quiser.", action1: "Curta este post se ele fez sentido para você.", action2: "Comente qual dia mais combina com o seu momento.", action3: "Compartilhe com alguém que também ama cuidar do cabelo.", footer: "@omagodastesouras · Parte 1 de 5" },
];

export default function Home() {
  const [handle, setHandle] = useState("@omagodastesouras");
  const [visible, setVisible] = useState(true);
  const [idx, setIdx] = useState(0);
  const [slides, setSlides] = useState<Slide[]>(PADRAO);
  const [tplId, setTplId] = useState("minimal");
  const [voz, setVoz] = useState("educativo");
  const [tema, setTema] = useState("");
  const [groqKey, setGroqKey] = useState("");
  const [gerando, setGerando] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [stories, setStories] = useState(false);
  const [imgSearch, setImgSearch] = useState("");
  const [imgResults, setImgResults] = useState<string[]>([]);
  const slideRef = useRef<HTMLDivElement>(null);
  const slide = slides[idx];
  const tpl = TEMPLATES.find(t => t.id === tplId)!;

  function ir(n: number) {
    setVisible(false);
    setTimeout(() => {
      setIdx(n);
      setVisible(true);
    }, 180);
  }

  function set(campo: string, valor: string) {
    const c = [...slides];
    c[idx] = { ...slide, [campo]: valor } as Slide;
    setSlides(c);
  }

  function addSlide() {
    const novo: Slide = {
      type: "content",
      label: `Dica ${String(slides.length).padStart(2, "0")}`,
      headline: "Novo slide.",
      body: "Escreva aqui o conteúdo."
    };
    setSlides([...slides.slice(0, -1), novo, slides[slides.length - 1]]);
    ir(slides.length - 1);
  }

  function delSlide() {
    if (slides.length <= 1) return;
    setSlides(slides.filter((_, i) => i !== idx));
    ir(Math.max(0, idx - 1));
  }

  async function exportPNG() {
    if (!slideRef.current) return;
    setExportando(true);
    try {
      const url = await htmlToImage.toPng(slideRef.current, { pixelRatio: 2.5 });
      const a = document.createElement("a");
      a.download = `slide-${idx + 1}.png`;
      a.href = url;
      a.click();
    } catch {
      alert("Erro ao exportar.");
    } finally {
      setExportando(false);
    }
  }

  async function exportTodos() {
    setExportando(true);
    for (let i = 0; i < slides.length; i++) {
      await new Promise<void>(res => {
        setVisible(false);
        setTimeout(() => {
          setIdx(i);
          setVisible(true);
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
      await new Promise(r => setTimeout(r, 300));
    }
    setExportando(false);
  }

  function buscarImagens() {
    if (!imgSearch.trim()) return;
    const q = encodeURIComponent(imgSearch.trim());
    const urls = Array.from(
      { length: 6 },
      (_, i) => `https://image.pollinations.ai/prompt/${q}%20professional%20photo%20high%20quality?width=600&height=400&nologo=true&seed=${Date.now() + i * 100}`
    );
    setImgResults(urls);
  }

  function aplicarImg(url: string) {
    const c = [...slides];
    c[idx] = { ...slide, imgUrl: url } as Slide;
    setSlides(c);
  }

  function removerImg() {
    const c = [...slides];
    const s = { ...slide };
    delete (s as Record<string, unknown>).imgUrl;
    c[idx] = s as Slide;
    setSlides(c);
  }

  async function gerarIA() {
    if (!tema.trim()) return alert("Digite um tema!");
    if (!groqKey.trim()) return alert("Cole sua chave Groq!");

    setGerando(true);

    const vozDesc: Record<string, string> = {
      educativo: "informativo e didático",
      descontraido: "leve e divertido",
      profissional: "formal e sério",
      vendas: "persuasivo e urgente"
    };

    const prompt = `Crie um carrossel para Instagram sobre: "${tema}". Tom: ${vozDesc[voz] || "educativo"}.
Para cada slide de conteúdo, inclua um campo "imagePrompt" com uma descrição em inglês para gerar uma foto por IA.
Retorne APENAS JSON válido:
{"slides":[
  {"type":"cover","tag":"TAG","title":"TÍTULO\\nIMPACTO","subtitle":"Subtítulo 1-2 frases.","imagePrompt":"description of cover image"},
  {"type":"content","label":"Dica 01","headline":"Título.","body":"2-3 frases.","imagePrompt":"description of image for this tip"},
  {"type":"content","label":"Dica 02","headline":"Título.","body":"2-3 frases.","imagePrompt":"description of image for this tip"},
  {"type":"content","label":"Dica 03","headline":"Título.","body":"2-3 frases.","imagePrompt":"description of image for this tip"},
  {"type":"cta","tag":"Salve","title":"Frase final.","action1":"Curta.","action2":"Comente.","action3":"Compartilhe.","footer":"${handle}"}
]}`;

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.8,
          max_tokens: 1500
        }),
      });

      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const txt = data.choices?.[0]?.message?.content || "";
      const match = txt.match(/\{[\s\S]*\}/);

      if (!match) throw new Error("IA não retornou JSON.");

      const parsed = JSON.parse(match[0]);

      if (parsed.slides) {
        const slidesComImg = parsed.slides.map((s: Slide & { imagePrompt?: string }) => {
          if (s.imagePrompt && s.type !== "cta") {
            const q = encodeURIComponent(s.imagePrompt);
            return {
              ...s,
              imgUrl: `https://image.pollinations.ai/prompt/${q}%20professional%20photography%20high%20quality?width=600&height=400&nologo=true&seed=${Math.floor(Math.random() * 99999)}`
            };
          }
          return s;
        });

        setSlides(slidesComImg);
        ir(0);
      }
    } catch (e: unknown) {
      alert("Erro: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setGerando(false);
    }
  }

  async function gerarLegenda() {
    if (!groqKey.trim()) return alert("Cole sua chave Groq!");

    setGerando(true);

    const capa = slides.find(s => s.type === "cover") as { title: string } | undefined;
    const titulo = capa?.title?.replace(/\n/g, " ") || tema;

    const vozDesc: Record<string, string> = {
      educativo: "informativo",
      descontraido: "leve",
      profissional: "formal",
      vendas: "persuasivo"
    };

    const prompt = `Crie uma legenda para Instagram sobre "${titulo}". Tom: ${vozDesc[voz]}. Máximo 150 palavras. Inclua abertura forte, 2-3 parágrafos, CTA e 10-15 hashtags.`;

    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.8,
          max_tokens: 600
        }),
      });

      const data = await res.json();
      const leg = data.choices?.[0]?.message?.content || "";
      await navigator.clipboard.writeText(leg).catch(() => {});
      alert("✅ Legenda copiada!\n\n" + leg);
    } catch (e: unknown) {
      alert("Erro: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setGerando(false);
    }
  }

  const isGrad = tpl.bg.startsWith("linear");
  const W = stories ? 405 : 540;
  const H = stories ? 720 : 540;
  const hasImg = !!(slide as Slide & { imgUrl?: string }).imgUrl;

  function SlideContent() {
    const imgUrl = (slide as Slide & { imgUrl?: string }).imgUrl;

    if (slide.type === "cover") {
      return (
        <div style={{ width: "100%", height: "100%", padding: "32px 36px", display: "flex", flexDirection: "column", justifyContent: "flex-end", boxSizing: "border-box" }}>
          {imgUrl && (
            <div style={{ position: "absolute", top: 24, left: 36, right: 36, height: "40%", borderRadius: 14, overflow: "hidden" }}>
              <img src={imgUrl} referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            </div>
          )}
          <div style={{ display: "inline-block", background: tpl.tagBg, color: tpl.tagText, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 14px", borderRadius: 100, marginBottom: 16, width: "fit-content" }}>
            {slide.tag}
          </div>
          <div style={{ fontSize: imgUrl ? 28 : 36, fontWeight: 900, lineHeight: 1.15, whiteSpace: "pre-line", marginBottom: 12, color: tpl.text }}>
            {slide.title}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.6, opacity: 0.75, color: tpl.text }}>
            {slide.subtitle}
          </div>
          <div style={{ position: "absolute", bottom: 16, right: 24, fontSize: 11, opacity: 0.4, color: tpl.text }}>
            {handle}
          </div>
        </div>
      );
    }

    if (slide.type === "content") {
      return (
        <div style={{ width: "100%", height: "100%", padding: "28px 36px", display: "flex", flexDirection: "column", justifyContent: "flex-start", boxSizing: "border-box" }}>
          <div style={{ display: "inline-block", background: tpl.tagBg, color: tpl.tagText, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", padding: "5px 12px", borderRadius: 100, marginBottom: 16, width: "fit-content" }}>
            {slide.label}
          </div>
          <div style={{ fontSize: imgUrl ? 24 : 32, fontWeight: 900, lineHeight: 1.2, marginBottom: 10, color: tpl.accent }}>
            {slide.headline}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.6, opacity: 0.85, color: tpl.text, marginBottom: imgUrl ? 12 : 0 }}>
            {slide.body}
          </div>
          {imgUrl && (
            <div style={{ flex: 1, width: "100%", borderRadius: 14, overflow: "hidden", marginTop: 8, minHeight: 120 }}>
              <img src={imgUrl} referrerPolicy="no-referrer" style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
            </div>
          )}
          {!imgUrl && <div style={{ flex: 1 }} />}
          <div style={{ position: "absolute", bottom: 16, right: 24, fontSize: 11, opacity: 0.4, color: tpl.text }}>
            {handle}
          </div>
        </div>
      );
    }

    if (slide.type === "cta") {
      return (
        <div style={{ width: "100%", height: "100%", padding: "32px 36px", display: "flex", flexDirection: "column", justifyContent: "center", boxSizing: "border-box" }}>
          <div style={{ display: "inline-block", background: tpl.tagBg, color: tpl.tagText, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", padding: "5px 12px", borderRadius: 100, marginBottom: 16, width: "fit-content" }}>
            {slide.tag}
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.25, marginBottom: 24, color: tpl.text }}>
            {slide.title}
          </div>
          {[slide.action1, slide.action2, slide.action3].map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10, fontSize: 14, lineHeight: 1.5, color: tpl.text, opacity: 0.85 }}>
              <span style={{ color: tpl.accent, fontWeight: 700, flexShrink: 0 }}>→</span>
              <span>{a}</span>
            </div>
          ))}
          <div style={{ marginTop: "auto", paddingTop: 20, fontSize: 12, opacity: 0.45, color: tpl.text, borderTop: `1px solid ${tpl.accent}44` }}>
            {slide.footer || handle}
          </div>
        </div>
      );
    }

    return null;
  }

  return (
    <main style={{ minHeight: "100vh", background: "#e5e5e5", padding: 32, display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: 960, display: "grid", gridTemplateColumns: "360px 1fr", gap: 24 }}>
        <aside style={{ background: "#fff", borderRadius: 24, padding: 24, display: "flex", flexDirection: "column", gap: 16, maxHeight: "95vh", overflowY: "auto" }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 2 }}>Gerador de Carrossel</div>
            <div style={{ fontSize: 13, color: "#888" }}>IA · Templates · Imagens · Stories</div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>🎨 Modelo</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTplId(t.id)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    padding: 4,
                    borderRadius: 12,
                    border: tplId === t.id ? "2px solid #000" : "2px solid transparent",
                    background: "none",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ width: 48, height: 56, background: t.bg, borderRadius: 8, border: "1px solid #e5e5e5" }} />
                  <span style={{ fontSize: 11, fontWeight: 500 }}>{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ border: "1px solid #e5e5e5", borderRadius: 16, padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span>✨</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Gerar com IA</span>
              <span style={{ marginLeft: "auto", fontSize: 11, background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: 100, fontWeight: 600 }}>
                Groq + Pollinations
              </span>
            </div>

            <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>Tom de voz:</div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              {VOZES.map(v => (
                <button
                  key={v.id}
                  onClick={() => setVoz(v.id)}
                  style={{
                    fontSize: 12,
                    padding: "5px 12px",
                    borderRadius: 100,
                    border: "1px solid",
                    borderColor: voz === v.id ? "#000" : "#d4d4d4",
                    background: voz === v.id ? "#000" : "#fff",
                    color: voz === v.id ? "#fff" : "#555",
                    cursor: "pointer"
                  }}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <textarea
              value={tema}
              onChange={e => setTema(e.target.value)}
              rows={3}
              placeholder="Ex: dicas de cuidado com cabelo crespo"
              style={{ width: "100%", border: "1px solid #d4d4d4", borderRadius: 12, padding: "8px 12px", fontSize: 13, outline: "none", resize: "none", marginBottom: 8, boxSizing: "border-box" }}
            />

            <input
              type="password"
              value={groqKey}
              onChange={e => setGroqKey(e.target.value)}
              placeholder="Chave Groq (gsk_...)"
              style={{ width: "100%", border: "1px solid #d4d4d4", borderRadius: 12, padding: "8px 12px", fontSize: 13, outline: "none", marginBottom: 4, boxSizing: "border-box" }}
            />

            <div style={{ fontSize: 11, color: "#aaa", marginBottom: 10 }}>
              Gratuito em{" "}
              <a href="https://console.groq.com/keys" target="_blank" style={{ color: "#555" }}>
                console.groq.com/keys
              </a>
            </div>

            <button
              onClick={gerarIA}
              disabled={gerando}
              style={{
                width: "100%",
                background: "#000",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "10px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                marginBottom: 6,
                opacity: gerando ? 0.5 : 1
              }}
            >
              {gerando ? "⏳ Gerando texto + imagens..." : "✨ Gerar carrossel completo"}
            </button>

            <button
              onClick={gerarLegenda}
              disabled={gerando}
              style={{
                width: "100%",
                background: "#fff",
                color: "#333",
                border: "1px solid #d4d4d4",
                borderRadius: 12,
                padding: "8px",
                fontSize: 13,
                cursor: "pointer",
                opacity: gerando ? 0.5 : 1
              }}
            >
              📋 Gerar legenda do Instagram
            </button>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Handle</div>
            <input
              value={handle}
              onChange={e => setHandle(e.target.value)}
              style={{ width: "100%", border: "1px solid #d4d4d4", borderRadius: 12, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Slides</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
              {slides.map((s, i) => (
                <button
                  key={i}
                  onClick={() => ir(i)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 10,
                    border: "none",
                    background: idx === i ? "#000" : "#f5f5f5",
                    color: idx === i ? "#fff" : "#333",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer"
                  }}
                >
                  {s.type === "cover" ? "Capa" : s.type === "cta" ? "CTA" : String(i + 1)}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={addSlide}
                style={{ flex: 1, border: "1px dashed #ccc", borderRadius: 10, padding: "5px", fontSize: 12, color: "#888", background: "none", cursor: "pointer" }}
              >
                + Adicionar
              </button>
              {slides.length > 1 && (
                <button
                  onClick={delSlide}
                  style={{ border: "1px dashed #fca5a5", borderRadius: 10, padding: "5px 10px", fontSize: 12, color: "#ef4444", background: "none", cursor: "pointer" }}
                >
                  Remover
                </button>
              )}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>🖼️ Imagem IA (slide atual)</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              <input
                value={imgSearch}
                onChange={e => setImgSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") buscarImagens();
                }}
                placeholder="Descreva a imagem..."
                style={{ flex: 1, border: "1px solid #d4d4d4", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }}
              />
              <button
                onClick={buscarImagens}
                style={{ padding: "8px 14px", border: "none", background: "#000", color: "#fff", borderRadius: 10, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                🔍
              </button>
            </div>

            {imgResults.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                {imgResults.map((url, i) => (
                  <div
                    key={i}
                    onClick={() => aplicarImg(url)}
                    style={{
                      width: "calc(33% - 4px)",
                      aspectRatio: "1.5",
                      borderRadius: 8,
                      overflow: "hidden",
                      cursor: "pointer",
                      border: hasImg && (slide as Slide & { imgUrl?: string }).imgUrl === url ? "2px solid #000" : "2px solid transparent",
                      background: "#f5f5f5"
                    }}
                  >
                    <img
                      src={url}
                      referrerPolicy="no-referrer"
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      alt=""
                      onError={e => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {hasImg && (
              <button
                onClick={removerImg}
                style={{ fontSize: 12, color: "#ef4444", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
              >
                Remover imagem
              </button>
            )}
          </div>

          <div style={{ border: "1px solid #e5e5e5", borderRadius: 16, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>✏️ Editar slide</div>

            {slide.type === "cover" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 12, background: "#f5f5f5", borderRadius: 10, padding: "6px 12px", color: "#666" }}>
                  Editando: Capa
                </div>
                {(["tag", "title", "subtitle"] as const).map(c => (
                  <label key={c}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3, textTransform: "capitalize" }}>{c}</div>
                    {c === "subtitle" ? (
                      <textarea
                        value={slide[c]}
                        onChange={e => set(c, e.target.value)}
                        rows={3}
                        style={{ width: "100%", border: "1px solid #d4d4d4", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box" }}
                      />
                    ) : (
                      <input
                        value={slide[c]}
                        onChange={e => set(c, e.target.value)}
                        style={{ width: "100%", border: "1px solid #d4d4d4", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                      />
                    )}
                  </label>
                ))}
              </div>
            )}

            {slide.type === "content" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 12, background: "#f5f5f5", borderRadius: 10, padding: "6px 12px", color: "#666" }}>
                  Editando: Conteúdo
                </div>
                {(["label", "headline", "body"] as const).map(c => (
                  <label key={c}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3, textTransform: "capitalize" }}>{c}</div>
                    {c === "body" ? (
                      <textarea
                        value={slide[c]}
                        onChange={e => set(c, e.target.value)}
                        rows={4}
                        style={{ width: "100%", border: "1px solid #d4d4d4", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box" }}
                      />
                    ) : (
                      <input
                        value={slide[c]}
                        onChange={e => set(c, e.target.value)}
                        style={{ width: "100%", border: "1px solid #d4d4d4", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                      />
                    )}
                  </label>
                ))}
              </div>
            )}

            {slide.type === "cta" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 12, background: "#f5f5f5", borderRadius: 10, padding: "6px 12px", color: "#666" }}>
                  Editando: CTA
                </div>
                {(["tag", "title", "action1", "action2", "action3", "footer"] as const).map(c => (
                  <label key={c}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 3, textTransform: "capitalize" }}>{c}</div>
                    <input
                      value={slide[c] || ""}
                      onChange={e => set(c, e.target.value)}
                      style={{ width: "100%", border: "1px solid #d4d4d4", borderRadius: 10, padding: "8px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                    />
                  </label>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>📱 Stories (9:16)</span>
            <div
              onClick={() => setStories(!stories)}
              style={{ width: 40, height: 22, borderRadius: 100, background: stories ? "#000" : "#d4d4d4", position: "relative", cursor: "pointer", flexShrink: 0 }}
            >
              <div style={{ position: "absolute", top: 3, left: stories ? 20 : 3, width: 16, height: 16, borderRadius: 100, background: "#fff", transition: "left 0.2s" }} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <button
              onClick={exportPNG}
              disabled={exportando}
              style={{
                width: "100%",
                background: "#000",
                color: "#fff",
                border: "none",
                borderRadius: 12,
                padding: "10px",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                opacity: exportando ? 0.5 : 1
              }}
            >
              {exportando ? "⏳ Exportando..." : "⬇ Baixar slide (PNG)"}
            </button>

            <button
              onClick={exportTodos}
              disabled={exportando}
              style={{
                width: "100%",
                background: "#fff",
                color: "#333",
                border: "1px solid #d4d4d4",
                borderRadius: 12,
                padding: "8px",
                fontSize: 13,
                cursor: "pointer",
                opacity: exportando ? 0.5 : 1
              }}
            >
              ⬇ Baixar todos
            </button>
          </div>
        </aside>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div
            ref={slideRef}
            style={{
              width: W,
              height: H,
              background: isGrad ? undefined : tpl.bg,
              backgroundImage: isGrad ? tpl.bg : undefined,
              borderRadius: 24,
              overflow: "hidden",
              position: "relative",
              boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
              opacity: visible ? 1 : 0,
              transition: "opacity 0.18s"
            }}
          >
            <div style={{ position: "relative", zIndex: 1, width: "100%", height: "100%" }}>
              <SlideContent />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={() => ir((idx - 1 + slides.length) % slides.length)}
              style={{ padding: "8px 20px", borderRadius: 12, border: "1px solid #ccc", background: "#fff", cursor: "pointer", fontSize: 13 }}
            >
              ← Anterior
            </button>
            <span style={{ fontSize: 13, color: "#888", alignSelf: "center" }}>
              {idx + 1} / {slides.length}
            </span>
            <button
              onClick={() => ir((idx + 1) % slides.length)}
              style={{ padding: "8px 20px", borderRadius: 12, border: "none", background: "#000", color: "#fff", cursor: "pointer", fontSize: 13 }}
            >
              Próximo →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}