"use client";
import { useMemo, useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import { CarouselDocument, CarouselSlide, FamilyId } from "@/lib/carousel";
import { cloneTemplate, TEMPLATES, TemplateId } from "@/lib/templates";

type Direction="auto"|"left"|"right"|"top"|"bottom"|"full";
type FormatId="4:5"|"1:1"|"story";
type Fit="cover"|"contain";
type Align="left"|"center"|"right";
type CardCfg={
  direction:Direction; panX:number; panY:number; zoom:number; rotation:number; opacity:number; fit:Fit; align:Align;
  headline:number; body:number; bg:string; accent:string; ink:string; bodyInk:string;
  showImage:boolean; showHeadline:boolean; showBody:boolean; showCta:boolean; showBrand:boolean; showCounter:boolean; decor:boolean;
  photoWidth:number; titleMarginTop:number; bodyMarginTop:number; lineHeight:number; bodyLineHeight:number;
};
type Brand={name:string;tagline:string;logo?:string};

const formats:Record<FormatId,{w:number;h:number;label:string}>={
  "4:5":{w:540,h:675,label:"Instagram 4:5 · 1080×1350"},
  "1:1":{w:540,h:540,label:"Quadrado 1:1 · 1080×1080"},
  story:{w:540,h:960,label:"Story 9:16 · 1080×1920"}
};

const darkBase:CardCfg={direction:"auto",panX:0,panY:0,zoom:100,rotation:0,opacity:100,fit:"cover",align:"left",headline:31,body:14,bg:"#090909",accent:"#D1A065",ink:"#F4F0E8",bodyInk:"#F4F0E8",showImage:true,showHeadline:true,showBody:true,showCta:true,showBrand:true,showCounter:true,decor:true,photoWidth:52,titleMarginTop:28,bodyMarginTop:22,lineHeight:1.08,bodyLineHeight:1.5};
const wineBase:CardCfg={...darkBase,bg:"#F7F1EA",accent:"#6B2E3D",ink:"#2B1F1F",bodyInk:"#3A2D2D",decor:false,headline:24,body:9,photoWidth:50,titleMarginTop:12,bodyMarginTop:8,lineHeight:1.1,bodyLineHeight:1.5};

const winePresets:CardCfg[]=[
  {...wineBase,direction:"auto",showImage:false,headline:32,body:9,photoWidth:0,titleMarginTop:72,bodyMarginTop:12,lineHeight:1.1,showCta:true},
  {...wineBase,direction:"auto",showImage:true,headline:24,body:9,photoWidth:50,titleMarginTop:34,bodyMarginTop:8,lineHeight:1.1,showCta:false},
  {...wineBase,direction:"auto",showImage:true,headline:24,body:9,photoWidth:50,titleMarginTop:34,bodyMarginTop:8,lineHeight:1.1,showCta:false},
  {...wineBase,direction:"auto",showImage:true,headline:24,body:9,photoWidth:50,titleMarginTop:34,bodyMarginTop:8,lineHeight:1.1,showCta:false},
  {...wineBase,direction:"auto",showImage:true,headline:24,body:9,photoWidth:45,titleMarginTop:28,bodyMarginTop:8,lineHeight:1.05,showCta:true}
];

const cfgFor=(family:FamilyId,index=0)=>family==="mago-editorial-rose"?{...(winePresets[index]||wineBase)}:{...darkBase};
const upload=(setter:(v:string)=>void)=>(e:React.ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>setter(String(r.result));r.readAsDataURL(f)};

function Img({src,cfg}:{src?:string;cfg:CardCfg}){
  if(!src||!cfg.showImage)return null;
  return <img src={src} alt="" style={{width:"100%",height:"100%",display:"block",objectFit:cfg.fit,objectPosition:"center",opacity:cfg.opacity/100,transform:`translate(${cfg.panX}px,${cfg.panY}px) scale(${cfg.zoom/100}) rotate(${cfg.rotation}deg)`,transformOrigin:"center"}}/>;
}

function BrandBlock({brand,cfg,counter,logo}:{brand:Brand;cfg:CardCfg;counter:string;logo?:string}){
  return <div>
    {cfg.showBrand&&<div style={{display:"flex",alignItems:"center",gap:10}}>{logo&&<img src={logo} alt="" style={{width:28,height:28,objectFit:"contain",borderRadius:6}}/>}<div><div style={{fontFamily:"Montserrat, Arial, sans-serif",fontSize:9,fontWeight:700,letterSpacing:".18em",color:cfg.accent}}>{brand.name}</div><div style={{fontFamily:"Montserrat, Arial, sans-serif",fontSize:9,fontWeight:700,letterSpacing:".16em",color:cfg.accent,marginTop:5}}>{brand.tagline}</div></div></div>}
    {cfg.showCounter&&<div style={{fontFamily:"Montserrat, Arial, sans-serif",fontSize:9,letterSpacing:".12em",color:cfg.accent,marginTop:22}}>{counter}</div>}
  </div>;
}

function TitleBlock({slide,cfg}:{slide:CarouselSlide;cfg:CardCfg}){
  return <>
    {cfg.showHeadline&&<div style={{fontFamily:"Playfair Display, Georgia, serif",fontSize:cfg.headline,fontWeight:700,lineHeight:cfg.lineHeight,color:cfg.ink,textAlign:cfg.align,marginTop:cfg.titleMarginTop}}>{slide.headline}</div>}
    {cfg.decor&&<div style={{width:40,height:3,background:cfg.accent,marginTop:12}}/>}
    {!cfg.decor&&<div style={{width:40,height:3,background:cfg.accent,marginTop:12}}/>}
    {cfg.showBody&&slide.body&&<div style={{fontFamily:"Montserrat, Arial, sans-serif",fontSize:cfg.body,fontWeight:500,lineHeight:cfg.bodyLineHeight,color:cfg.bodyInk,textAlign:cfg.align,marginTop:cfg.bodyMarginTop}}>{slide.body}</div>}
  </>;
}

function Cta({slide,cfg}:{slide:CarouselSlide;cfg:CardCfg}){
  if(!cfg.showCta||!slide.cta)return null;
  return <div style={{marginTop:"auto",alignSelf:cfg.align==="center"?"center":cfg.align==="right"?"flex-end":"flex-start",fontFamily:"Montserrat, Arial, sans-serif",fontSize:8,fontWeight:600,padding:"7px 10px",borderRadius:8,background:cfg.accent,color:"#FFFFFF",display:"inline-flex",alignItems:"center",gap:7}}><span style={{fontSize:11}}>◉</span>{slide.cta}</div>;
}

function WineDefaultCard({slide,index,total,cfg,brand,logo,w,h}:{slide:CarouselSlide;index:number;total:number;cfg:CardCfg;brand:Brand;logo?:string;w:number;h:number}){
  const counter=slide.eyebrow||`${String(index+1).padStart(2,"0")} / ${String(total).padStart(2,"0")}`;
  if(index===0){
    return <div style={{width:w,height:h,background:cfg.bg,color:cfg.ink,position:"relative",overflow:"hidden",padding:"42px 48px 40px",display:"flex",flexDirection:"column"}}>
      <BrandBlock brand={brand} cfg={cfg} counter={counter} logo={logo}/>
      <TitleBlock slide={slide} cfg={cfg}/>
      <Cta slide={slide} cfg={cfg}/>
    </div>;
  }
  const photoWidth=index===4?45:50;
  const copyWidth=100-photoWidth;
  return <div style={{width:w,height:h,background:cfg.bg,color:cfg.ink,display:"grid",gridTemplateColumns:`${copyWidth}% ${photoWidth}%`,overflow:"hidden"}}>
    <div style={{padding:"40px 34px 34px 40px",display:"flex",flexDirection:"column",minWidth:0}}>
      <BrandBlock brand={brand} cfg={cfg} counter={counter} logo={logo}/>
      <TitleBlock slide={slide} cfg={cfg}/>
      <Cta slide={slide} cfg={cfg}/>
    </div>
    <div style={{width:"100%",height:"100%",overflow:"hidden",background:"#E8D8C8"}}><Img src={slide.image} cfg={cfg}/></div>
  </div>;
}

function GenericCard({slide,index,total,cfg,brand,logo,w,h}:{slide:CarouselSlide;index:number;total:number;cfg:CardCfg;brand:Brand;logo?:string;w:number;h:number}){
  const counter=slide.eyebrow||`${String(index+1).padStart(2,"0")} / ${String(total).padStart(2,"0")}`;
  const auto:Direction=index===0?"right":index%4===1?"top":index%4===2?"left":index%4===3?"full":"right";
  const dir=cfg.direction==="auto"?auto:cfg.direction;
  const photo=<div style={{width:"100%",height:"100%",overflow:"hidden",background:cfg.bg}}><Img src={slide.image} cfg={cfg}/></div>;
  const copy=<div style={{height:"100%",padding:"36px 30px",display:"flex",flexDirection:"column",minWidth:0}}><BrandBlock brand={brand} cfg={cfg} counter={counter} logo={logo}/><TitleBlock slide={slide} cfg={cfg}/><Cta slide={slide} cfg={cfg}/></div>;
  if(dir==="left"||dir==="right")return <div style={{width:w,height:h,display:"grid",gridTemplateColumns:dir==="left"?`${cfg.photoWidth}% ${100-cfg.photoWidth}%`:`${100-cfg.photoWidth}% ${cfg.photoWidth}%`,background:cfg.bg,color:cfg.ink,overflow:"hidden"}}>{dir==="left"?<>{photo}{copy}</>:<>{copy}{photo}</>}</div>;
  if(dir==="top"||dir==="bottom")return <div style={{width:w,height:h,display:"grid",gridTemplateRows:dir==="top"?"46% 54%":"54% 46%",background:cfg.bg,color:cfg.ink,overflow:"hidden"}}>{dir==="top"?<>{photo}{copy}</>:<>{copy}{photo}</>}</div>;
  return <div style={{width:w,height:h,position:"relative",overflow:"hidden",background:cfg.bg,color:cfg.ink}}><div style={{position:"absolute",inset:0}}>{photo}</div><div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(0,0,0,.06),rgba(0,0,0,.78))"}}/><div style={{position:"absolute",left:20,right:20,bottom:18,height:"52%"}}>{copy}</div></div>;
}

function Card(props:{slide:CarouselSlide;index:number;total:number;cfg:CardCfg;brand:Brand;logo?:string;w:number;h:number;templateId:TemplateId}){
  if(props.templateId==="mago-rose"&&props.cfg.direction==="auto")return <WineDefaultCard {...props}/>;
  return <GenericCard {...props}/>;
}

export default function CarouselStudioProV2(){
  const [templateId,setTemplateId]=useState<TemplateId>("mago-dark");
  const [doc,setDoc]=useState<CarouselDocument>(()=>cloneTemplate("mago-dark"));
  const [idx,setIdx]=useState(0);
  const [format,setFormat]=useState<FormatId>("4:5");
  const [brand,setBrand]=useState<Brand>({name:"MAGO DAS TESOURAS",tagline:"45+"});
  const [logo,setLogo]=useState<string>();
  const [cfgs,setCfgs]=useState<CardCfg[]>(()=>cloneTemplate("mago-dark").slides.map((_,i)=>cfgFor("mago-editorial-premium",i)));
  const [topic,setTopic]=useState("");
  const [grid,setGrid]=useState(false);
  const refs=useRef<(HTMLDivElement|null)[]>([]);
  const {w,h}=formats[format];
  const cfg=cfgs[idx]||cfgFor(doc.family,idx);
  const slide=doc.slides[idx];
  const control={width:"100%",padding:9,marginTop:6,boxSizing:"border-box" as const,background:"#151515",color:"#fff",border:"1px solid #444",borderRadius:8};
  const patchSlide=(p:Partial<CarouselSlide>)=>setDoc(d=>({...d,slides:d.slides.map((s,i)=>i===idx?{...s,...p}:s)}));
  const patchCfg=(p:Partial<CardCfg>)=>setCfgs(a=>a.map((c,i)=>i===idx?{...c,...p}:c));
  const chooseTemplate=(id:TemplateId)=>{const d=cloneTemplate(id);setTemplateId(id);setDoc(d);setIdx(0);setCfgs(d.slides.map((_,i)=>cfgFor(d.family,i)))};
  const reindex=(slides:CarouselSlide[])=>slides.map((s,i)=>({...s,eyebrow:`${String(i+1).padStart(2,"0")} / ${String(slides.length).padStart(2,"0")}`}));
  const move=(delta:number)=>{const to=idx+delta;if(to<0||to>=doc.slides.length)return;const ss=[...doc.slides];[ss[idx],ss[to]]=[ss[to],ss[idx]];const cc=[...cfgs];[cc[idx],cc[to]]=[cc[to],cc[idx]];setDoc({...doc,slides:reindex(ss)});setCfgs(cc);setIdx(to)};
  const duplicate=()=>{if(doc.slides.length>=10)return;const ss=[...doc.slides];ss.splice(idx+1,0,{...slide});const cc=[...cfgs];cc.splice(idx+1,0,{...cfg});setDoc({...doc,slides:reindex(ss)});setCfgs(cc);setIdx(idx+1)};
  const remove=()=>{if(doc.slides.length<=3)return;const ss=doc.slides.filter((_,i)=>i!==idx);setDoc({...doc,slides:reindex(ss)});setCfgs(cfgs.filter((_,i)=>i!==idx));setIdx(Math.max(0,idx-1)};
  const add=()=>{if(doc.slides.length>=10)return;const ss=[...doc.slides,{layout:"statement-portrait" as const,headline:"Novo card",body:"Edite este texto.",cta:""}];setDoc({...doc,slides:reindex(ss)});setCfgs([...cfgs,cfgFor(doc.family,ss.length-1)]);setIdx(ss.length-1)};
  const applyImageAll=()=>{if(!slide.image)return;setDoc(d=>({...d,slides:d.slides.map(s=>({...s,image:slide.image}))}))};
  const randomize=()=>setCfgs(a=>a.map(c=>({...c,direction:(['left','right','top','bottom','full'] as Direction[])[Math.floor(Math.random()*5)]})));
  const resetCard=()=>patchCfg(cfgFor(doc.family,idx));
  const save=()=>{localStorage.setItem("carousel-pro-v2",JSON.stringify({templateId,doc,cfgs,format,brand,logo}));alert("Projeto salvo neste navegador.")};
  const load=()=>{const raw=localStorage.getItem("carousel-pro-v2");if(!raw)return alert("Nenhum projeto salvo.");const p=JSON.parse(raw);setTemplateId(p.templateId);setDoc(p.doc);setCfgs(p.cfgs);setFormat(p.format);setBrand(p.brand);setLogo(p.logo);setIdx(0)};
  const exportOne=async(i=idx)=>{const el=refs.current[i];if(!el)return;const data=await htmlToImage.toPng(el,{pixelRatio:2,cacheBust:true});const a=document.createElement("a");a.href=data;a.download=`${doc.id||"carousel"}-${String(i+1).padStart(2,"0")}.png`;a.click()};
  const exportAll=async()=>{for(let i=0;i<doc.slides.length;i++){await exportOne(i);await new Promise(r=>setTimeout(r,220))}};
  const aiGenerate=async()=>{if(!topic.trim())return;const r=await fetch('/api/gerar',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({tema:topic,family:doc.family,slides:doc.slides.length})});const j=await r.json();if(!r.ok)return alert(j.error||'Erro na IA');setDoc(j);setCfgs(j.slides.map((_:CarouselSlide,i:number)=>cfgFor(j.family,i)));setIdx(0)};
  const caption=useMemo(()=>[doc.title,...doc.slides.map(s=>s.headline),doc.slides.at(-1)?.cta].filter(Boolean).join("\n\n"),[doc]);

  return <main style={{minHeight:"100vh",background:"#111",color:"#fff",padding:22,fontFamily:"Arial,sans-serif"}}><div style={{maxWidth:1480,margin:"auto",display:"grid",gridTemplateColumns:"410px 1fr",gap:24}}>
    <aside style={{background:"#202020",borderRadius:18,padding:18,maxHeight:"calc(100vh - 44px)",overflowY:"auto"}}>
      <h1 style={{margin:"0 0 4px"}}>Carousel Studio Pro</h1><p style={{opacity:.6,marginTop:4}}>Editor visual multidirecional · presets card a card</p>
      <label>Template</label><select value={templateId} onChange={e=>chooseTemplate(e.target.value as TemplateId)} style={control}>{Object.entries(TEMPLATES).map(([id,t])=><option key={id} value={id}>{t.name}</option>)}</select>
      <label style={{display:"block",marginTop:10}}>Formato</label><select value={format} onChange={e=>setFormat(e.target.value as FormatId)} style={control}>{Object.entries(formats).map(([id,f])=><option key={id} value={id}>{f.label}</option>)}</select>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}><button onClick={save}>Salvar</button><button onClick={load}>Carregar</button></div>
      <hr style={{borderColor:"#333",margin:"16px 0"}}/>
      <label>Tema para IA</label><textarea value={topic} onChange={e=>setTopic(e.target.value)} rows={2} style={control}/><button onClick={aiGenerate} style={{width:"100%",marginTop:8}}>Gerar conteúdo com IA</button>
      <hr style={{borderColor:"#333",margin:"16px 0"}}/>
      <strong>Branding</strong><input value={brand.name} onChange={e=>setBrand({...brand,name:e.target.value})} style={control}/><input value={brand.tagline} onChange={e=>setBrand({...brand,tagline:e.target.value})} style={control}/><input type="file" accept="image/*" onChange={upload(setLogo)} style={{marginTop:8}}/>
      <hr style={{borderColor:"#333",margin:"16px 0"}}/>
      <strong>Card {idx+1}/{doc.slides.length}</strong><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginTop:8}}><button onClick={()=>move(-1)}>←</button><button onClick={()=>move(1)}>→</button><button onClick={duplicate}>Duplicar</button><button onClick={remove}>Excluir</button></div><button onClick={add} style={{width:"100%",marginTop:7}}>+ Adicionar card</button>
      <label style={{display:"block",marginTop:12}}>Direção</label><select value={cfg.direction} onChange={e=>patchCfg({direction:e.target.value as Direction})} style={control}><option value="auto">Padrão deste card</option><option value="left">Foto esquerda</option><option value="right">Foto direita</option><option value="top">Foto em cima</option><option value="bottom">Foto embaixo</option><option value="full">Foto fundo inteiro</option></select>
      <button onClick={resetCard} style={{width:"100%",marginTop:7}}>Restaurar especificação deste card</button>
      <label style={{display:"block",marginTop:10}}>Imagem</label><input type="file" accept="image/*" onChange={upload(v=>patchSlide({image:v}))}/>{slide.image&&<button onClick={applyImageAll} style={{marginLeft:8}}>Usar em todos</button>}
      <label style={{display:"block",marginTop:8}}>Encaixe</label><select value={cfg.fit} onChange={e=>patchCfg({fit:e.target.value as Fit})} style={control}><option value="cover">Cover</option><option value="contain">Contain</option></select>
      <label>Mover X {cfg.panX}px</label><input type="range" min="-220" max="220" value={cfg.panX} onChange={e=>patchCfg({panX:+e.target.value})} style={{width:"100%"}}/>
      <label>Mover Y {cfg.panY}px</label><input type="range" min="-220" max="220" value={cfg.panY} onChange={e=>patchCfg({panY:+e.target.value})} style={{width:"100%"}}/>
      <label>Zoom {cfg.zoom}%</label><input type="range" min="80" max="150" value={cfg.zoom} onChange={e=>patchCfg({zoom:+e.target.value})} style={{width:"100%"}}/>
      <label>Rotação {cfg.rotation}°</label><input type="range" min="-20" max="20" value={cfg.rotation} onChange={e=>patchCfg({rotation:+e.target.value})} style={{width:"100%"}}/>
      <label>Opacidade {cfg.opacity}%</label><input type="range" min="10" max="100" value={cfg.opacity} onChange={e=>patchCfg({opacity:+e.target.value})} style={{width:"100%"}}/>
      <hr style={{borderColor:"#333",margin:"16px 0"}}/>
      <label>Título</label><textarea value={slide.headline} onChange={e=>patchSlide({headline:e.target.value})} rows={3} style={control}/><label style={{display:"block",marginTop:8}}>Descrição</label><textarea value={slide.body||""} onChange={e=>patchSlide({body:e.target.value})} rows={3} style={control}/><label style={{display:"block",marginTop:8}}>CTA</label><input value={slide.cta||""} onChange={e=>patchSlide({cta:e.target.value})} style={control}/>
      <label style={{display:"block",marginTop:8}}>Alinhamento</label><select value={cfg.align} onChange={e=>patchCfg({align:e.target.value as Align})} style={control}><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></select>
      <label>Título {Math.round(cfg.headline*2)}px final</label><input type="range" min="18" max="42" value={cfg.headline} onChange={e=>patchCfg({headline:+e.target.value})} style={{width:"100%"}}/>
      <label>Descrição {Math.round(cfg.body*2)}px final</label><input type="range" min="7" max="18" value={cfg.body} onChange={e=>patchCfg({body:+e.target.value})} style={{width:"100%"}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}><label>Fundo<input type="color" value={cfg.bg} onChange={e=>patchCfg({bg:e.target.value})} style={{width:"100%"}}/></label><label>Acento<input type="color" value={cfg.accent} onChange={e=>patchCfg({accent:e.target.value})} style={{width:"100%"}}/></label></div>
      <hr style={{borderColor:"#333",margin:"16px 0"}}/>
      <strong>Mostrar / ocultar</strong>{([['showImage','Imagem'],['showHeadline','Título'],['showBody','Descrição'],['showCta','CTA'],['showBrand','Marca'],['showCounter','Contador'],['decor','Linha decorativa']] as [keyof CardCfg,string][]).map(([k,l])=><label key={k} style={{display:"flex",gap:8,alignItems:"center",marginTop:7}}><input type="checkbox" checked={Boolean(cfg[k])} onChange={e=>patchCfg({[k]:e.target.checked} as Partial<CardCfg>)}/>{l}</label>)}
      <button onClick={randomize} style={{width:"100%",marginTop:12}}>Randomizar direções</button>
      <hr style={{borderColor:"#333",margin:"16px 0"}}/>
      <textarea value={caption} readOnly rows={5} style={control}/>
    </aside>

    <section>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div><strong>Preview</strong> · {formats[format].label}</div><div style={{display:"flex",gap:8}}><button onClick={()=>setGrid(!grid)}>{grid?'Card único':'Grade'}</button><button onClick={()=>exportOne()}>Exportar card</button><button onClick={exportAll}>Exportar todos</button></div></div>
      {!grid?<div style={{display:"flex",justifyContent:"center"}}><div ref={el=>{refs.current[idx]=el}} style={{boxShadow:"0 20px 60px #0008"}}><Card templateId={templateId} slide={slide} index={idx} total={doc.slides.length} cfg={cfg} brand={brand} logo={logo} w={w} h={h}/></div></div>:
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:18}}>{doc.slides.map((s,i)=>{const c=cfgs[i]||cfgFor(doc.family,i);const scale=Math.min(1,260/w);return <div key={i} onClick={()=>{setIdx(i);setGrid(false)}} style={{cursor:"pointer",height:h*scale,overflow:"hidden",boxShadow:"0 10px 30px #0006"}}><div ref={el=>{refs.current[i]=el}} style={{transform:`scale(${scale})`,transformOrigin:"top left",width:w,height:h}}><Card templateId={templateId} slide={s} index={i} total={doc.slides.length} cfg={c} brand={brand} logo={logo} w={w} h={h}/></div></div>})}</div>}
      <div style={{display:"flex",justifyContent:"center",gap:7,marginTop:14,flexWrap:"wrap"}}>{doc.slides.map((_,i)=><button key={i} onClick={()=>setIdx(i)} style={{fontWeight:i===idx?800:400,background:i===idx?"#D1A065":undefined}}>{i+1}</button>)}</div>
      <div style={{position:"absolute",left:-10000,top:0}}>{doc.slides.map((s,i)=>i===idx?null:<div key={i} ref={el=>{refs.current[i]=el}}><Card templateId={templateId} slide={s} index={i} total={doc.slides.length} cfg={cfgs[i]||cfgFor(doc.family,i)} brand={brand} logo={logo} w={w} h={h}/></div>)}</div>
    </section>
  </div></main>;
}
