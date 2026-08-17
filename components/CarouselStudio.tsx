"use client";
import { useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import { CarouselDocument, CarouselSlide, DEMO, FAMILIES, FamilyId, validateCarousel } from "@/lib/carousel";

const W = 540, H = 675;

function SlideView({ slide, family, index, total }: { slide: CarouselSlide; family: FamilyId; index: number; total: number }) {
  const t = FAMILIES[family];
  const dark = slide.layout === "photo-cta" && family === "editorial-premium";
  const bg = dark ? t.ink : t.bg;
  const ink = dark ? t.bg : t.ink;
  const photo = slide.image;
  const photoLayout = ["hero-photo", "statement-portrait", "photo-cta"].includes(slide.layout);
  return <div style={{ width: W, height: H, background: bg, color: ink, position: "relative", overflow: "hidden", fontFamily: t.sans }}>
    {photoLayout && photo && <img src={photo} alt="" style={{ position: "absolute", right: 0, top: 0, width: slide.layout === "hero-photo" ? "58%" : "42%", height: "100%", objectFit: "cover" }} />}
    {slide.layout === "hero-photo" && photo && <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(247,243,237,.98) 0%,rgba(247,243,237,.9) 40%,rgba(247,243,237,0) 72%)" }} />}
    <div style={{ position: "relative", zIndex: 2, height: "100%", boxSizing: "border-box", padding: "48px 46px", width: photoLayout && photo ? "64%" : "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ fontSize: 10, letterSpacing: ".35em", textTransform: "uppercase", opacity: .65 }}>{slide.eyebrow || `${String(index + 1).padStart(2,"0")} / ${String(total).padStart(2,"0")}`}</div>
      <div style={{ marginTop: slide.layout === "hero-photo" ? 80 : 56, fontFamily: t.serif, fontWeight: 700, fontSize: slide.layout === "quote" ? 48 : 39, lineHeight: 1.02 }}>{slide.headline}</div>
      {slide.body && <div style={{ marginTop: 28, fontSize: 16, lineHeight: 1.55, maxWidth: 350 }}>{slide.body}</div>}
      {!!slide.items?.length && <div style={{ marginTop: 28, display: "grid", gap: 12 }}>{slide.items.map((x,i)=><div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding: slide.layout === "checklist" ? "11px 14px" : 0, borderRadius: 18, background: slide.layout === "checklist" ? t.support : "transparent" }}><span style={{ color:t.accent, fontWeight:900 }}>•</span><span style={{ fontSize:15 }}>{x}</span></div>)}</div>}
      <div style={{ marginTop: "auto" }}>
        {slide.cta && <div style={{ display:"inline-block", background:t.accent, color:"#fff", padding:"12px 20px", borderRadius:999, fontSize:13, fontWeight:700 }}>{slide.cta}</div>}
        <div style={{ marginTop:22, width:70, height:1, background:t.accent }} />
      </div>
    </div>
  </div>;
}

export default function CarouselStudio() {
  const [doc,setDoc] = useState<CarouselDocument>(DEMO);
  const [idx,setIdx] = useState(0);
  const [topic,setTopic] = useState("");
  const [busy,setBusy] = useState(false);
  const ref=useRef<HTMLDivElement>(null);
  const errors=validateCarousel(doc);
  const patch=(p:Partial<CarouselSlide>)=>setDoc(d=>({...d,slides:d.slides.map((s,i)=>i===idx?{...s,...p}:s)}));
  async function generate(){ setBusy(true); try{ const r=await fetch("/api/gerar",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({tema:topic,family:doc.family,slides:6})}); const j=await r.json(); if(!r.ok) throw new Error(j.error); setDoc(j); setIdx(0);}catch(e){alert(e instanceof Error?e.message:String(e))}finally{setBusy(false)} }
  async function exportOne(){ if(errors.length) return alert(errors.join("\n")); if(!ref.current)return; const data=await htmlToImage.toPng(ref.current,{pixelRatio:2}); const a=document.createElement("a");a.href=data;a.download=`${doc.id||"carousel"}-${String(idx+1).padStart(2,"0")}.png`;a.click(); }
  return <main style={{ minHeight:"100vh", background:"#151515", color:"#fff", padding:28, fontFamily:"Arial,sans-serif" }}>
    <div style={{ maxWidth:1220,margin:"auto",display:"grid",gridTemplateColumns:"340px 1fr",gap:28 }}>
      <aside style={{ background:"#202020",padding:22,borderRadius:18 }}><h1 style={{marginTop:0}}>Carousel Studio</h1><p style={{opacity:.65}}>Hermes → Gemini → JSON → render determinístico</p>
        <label>Família visual</label><select value={doc.family} onChange={e=>setDoc(d=>({...d,family:e.target.value as FamilyId}))} style={{width:"100%",padding:12,margin:"8px 0 18px"}}>{Object.entries(FAMILIES).map(([id,x])=><option key={id} value={id}>{x.name}</option>)}</select>
        <label>Tema</label><textarea value={topic} onChange={e=>setTopic(e.target.value)} rows={4} style={{width:"100%",boxSizing:"border-box",padding:12,margin:"8px 0"}} placeholder="Ex.: corte curto para mulheres maduras"/><button disabled={busy||!topic.trim()} onClick={generate} style={{width:"100%",padding:13}}>{busy?"Gerando...":"Gerar com Gemini"}</button>
        <hr style={{borderColor:"#333",margin:"22px 0"}}/><label>Headline</label><textarea value={doc.slides[idx].headline} onChange={e=>patch({headline:e.target.value})} rows={4} style={{width:"100%",boxSizing:"border-box",padding:10,marginTop:8}}/><label>Texto</label><textarea value={doc.slides[idx].body||""} onChange={e=>patch({body:e.target.value})} rows={4} style={{width:"100%",boxSizing:"border-box",padding:10,marginTop:8}}/>
        <label style={{display:"block",marginTop:12}}>Imagem do slide</label><input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>patch({image:String(r.result)});r.readAsDataURL(f)}}/>
        {errors.length>0&&<div style={{marginTop:16,padding:12,background:"#4a1d1d",borderRadius:10,fontSize:12}}>{errors.map(x=><div key={x}>• {x}</div>)}</div>}
      </aside>
      <section><div ref={ref} style={{width:W,height:H,margin:"0 auto",boxShadow:"0 20px 60px #0008"}}><SlideView slide={doc.slides[idx]} family={doc.family} index={idx} total={doc.slides.length}/></div>
        <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:18,flexWrap:"wrap"}}>{doc.slides.map((_,i)=><button key={i} onClick={()=>setIdx(i)} style={{padding:"8px 12px",fontWeight:i===idx?800:400}}>{i+1}</button>)}<button onClick={exportOne} style={{padding:"8px 18px"}}>Exportar PNG</button></div>
      </section>
    </div>
  </main>;
}
