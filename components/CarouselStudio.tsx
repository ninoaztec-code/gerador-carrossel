"use client";
import { useEffect, useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import { CarouselDocument, CarouselSlide, FAMILIES, FamilyId, validateCarousel } from "@/lib/carousel";
import { cloneTemplate, TEMPLATES, TemplateId } from "@/lib/templates";

const W=540,H=675;
type Direction="auto"|"left"|"right"|"top"|"bottom"|"full";
type FitMode="cover"|"contain";
type TextAlign="left"|"center"|"right";
type PhotoFit={x:number;y:number;zoom:number;opacity:number;fit:FitMode};
type CardStyle={direction:Direction;headlineSize:number;bodySize:number;align:TextAlign;bg?:string;accent?:string};
const DEFAULT_FIT:PhotoFit={x:0,y:0,zoom:100,opacity:100,fit:"cover"};
const DEFAULT_STYLE:CardStyle={direction:"auto",headlineSize:30,bodySize:14,align:"left"};

function Photo({src,fit}:{src?:string;fit:PhotoFit}){
 if(!src)return null;
 return <img src={src} alt="" style={{width:"100%",height:"100%",objectFit:fit.fit,objectPosition:"50% 50%",opacity:fit.opacity/100,transform:`translate(${fit.x}%, ${fit.y}%) scale(${fit.zoom/100})`,transformOrigin:"center center",display:"block"}}/>;
}
function Brand({slide,index,total,accent}:{slide:CarouselSlide;index:number;total:number;accent:string}){return <div><div style={{color:accent,fontSize:9,fontWeight:700,letterSpacing:".24em"}}>MAGO DAS TESOURAS</div><div style={{color:accent,fontSize:10,fontWeight:700,letterSpacing:".2em",marginTop:8}}>45+</div><div style={{color:accent,fontSize:10,letterSpacing:".12em",marginTop:30}}>{slide.eyebrow||`${String(index+1).padStart(2,"0")} / ${String(total).padStart(2,"0")}`}</div><div style={{width:34,height:2,background:accent,marginTop:12}}/></div>}
function Copy({slide,index,total,accent,ink,style,horizontal=false}:{slide:CarouselSlide;index:number;total:number;accent:string;ink:string;style:CardStyle;horizontal?:boolean}){return <div style={{height:"100%",padding:horizontal?"28px 32px":"40px 30px",display:horizontal?"grid":"flex",gridTemplateColumns:horizontal?"31% 1fr":undefined,gap:horizontal?22:undefined,flexDirection:"column",textAlign:style.align}}><Brand slide={slide} index={index} total={total} accent={accent}/><div style={{display:"flex",flexDirection:"column",minWidth:0,marginTop:horizontal?0:28}}><div style={{fontFamily:"Georgia,serif",fontWeight:700,fontSize:style.headlineSize,lineHeight:1.08,color:ink}}>{slide.headline}</div><div style={{width:34,height:2,background:accent,marginTop:16,alignSelf:style.align==="center"?"center":style.align==="right"?"flex-end":"flex-start"}}/>{slide.body&&<div style={{marginTop:20,fontSize:style.bodySize,lineHeight:1.5,color:ink,opacity:.92}}>{slide.body}</div>}{slide.cta&&<div style={{marginTop:"auto",alignSelf:style.align==="center"?"center":style.align==="right"?"flex-end":"flex-start",padding:"12px 15px",borderRadius:16,background:accent,color:"#111",fontSize:10,fontWeight:800}}>{slide.cta}</div>}</div></div>}
function DirectionalSlide({slide,family,index,total,fit,style}:{slide:CarouselSlide;family:FamilyId;index:number;total:number;fit:PhotoFit;style:CardStyle}){
 const rose=family==="mago-editorial-rose",bg=style.bg||(rose?"#F7F1EA":"#090909"),ink=rose?"#403632":"#F4F0E8",accent=style.accent||(rose?"#743F4B":"#D1A065"),direction=style.direction==="auto"?"right":style.direction;
 const photo=<div style={{width:"100%",height:"100%",overflow:"hidden",background:rose?"#E8D8C8":"#B8AA9B"}}><Photo src={slide.image} fit={fit}/></div>;
 const copy=<Copy slide={slide} index={index} total={total} accent={accent} ink={ink} style={style} horizontal={direction==="top"||direction==="bottom"}/>;
 if(direction==="left"||direction==="right")return <div style={{width:W,height:H,background:bg,color:ink,display:"grid",gridTemplateColumns:direction==="left"?"52% 48%":"48% 52%",overflow:"hidden"}}>{direction==="left"?<>{photo}{copy}</>:<>{copy}{photo}</>}</div>;
 if(direction==="top"||direction==="bottom")return <div style={{width:W,height:H,background:bg,color:ink,display:"grid",gridTemplateRows:direction==="top"?"46% 54%":"54% 46%",overflow:"hidden"}}>{direction==="top"?<>{photo}{copy}</>:<>{copy}{photo}</>}</div>;
 return <div style={{width:W,height:H,position:"relative",overflow:"hidden",background:bg,color:ink}}><div style={{position:"absolute",inset:0}}>{photo}</div><div style={{position:"absolute",inset:0,background:rose?"linear-gradient(180deg,rgba(247,241,234,.08),rgba(64,54,50,.8))":"linear-gradient(180deg,rgba(0,0,0,.05),rgba(0,0,0,.82))"}}/><div style={{position:"absolute",left:28,right:28,bottom:24,height:"48%"}}>{copy}</div></div>;
}
function AutoSlide({slide,family,index,total,fit,style}:{slide:CarouselSlide;family:FamilyId;index:number;total:number;fit:PhotoFit;style:CardStyle}){
 const dir:Direction=family==="mago-editorial-rose"?(index%2===0?"right":"left"):(slide.layout==="mago-split"?(index%2===0?"right":"left"):(index===1?"top":"right"));
 return <DirectionalSlide slide={slide} family={family} index={index} total={total} fit={fit} style={{...style,direction:dir}}/>;
}
function SlideView(p:{slide:CarouselSlide;family:FamilyId;index:number;total:number;fit:PhotoFit;style:CardStyle}){return p.style.direction==="auto"?<AutoSlide {...p}/>:<DirectionalSlide {...p}/>}

export default function CarouselStudio(){
 const [templateId,setTemplateId]=useState<TemplateId>("mago-dark");
 const [doc,setDoc]=useState<CarouselDocument>(()=>cloneTemplate("mago-dark"));
 const [idx,setIdx]=useState(0);
 const [fits,setFits]=useState<Record<number,PhotoFit>>({});
 const [styles,setStyles]=useState<Record<number,CardStyle>>({});
 const refs=useRef<Record<number,HTMLDivElement|null>>({});
 const fit=fits[idx]||DEFAULT_FIT,style=styles[idx]||DEFAULT_STYLE,errors=validateCarousel(doc);
 const patch=(p:Partial<CarouselSlide>)=>setDoc(d=>({...d,slides:d.slides.map((s,i)=>i===idx?{...s,...p}:s)}));
 const patchFit=(p:Partial<PhotoFit>)=>setFits(f=>({...f,[idx]:{...(f[idx]||DEFAULT_FIT),...p}}));
 const patchStyle=(p:Partial<CardStyle>)=>setStyles(s=>({...s,[idx]:{...(s[idx]||DEFAULT_STYLE),...p}}));
 function chooseTemplate(id:TemplateId){setTemplateId(id);setDoc(cloneTemplate(id));setIdx(0);setFits({});setStyles({})}
 function moveCard(delta:number){const to=idx+delta;if(to<0||to>=doc.slides.length)return;setDoc(d=>{const a=[...d.slides];[a[idx],a[to]]=[a[to],a[idx]];return {...d,slides:a}});setIdx(to)}
 function duplicateCard(){if(doc.slides.length>=10)return;setDoc(d=>({...d,slides:[...d.slides.slice(0,idx+1),{...d.slides[idx],eyebrow:undefined},...d.slides.slice(idx+1)]}));setIdx(idx+1)}
 function removeCard(){if(doc.slides.length<=3)return;setDoc(d=>({...d,slides:d.slides.filter((_,i)=>i!==idx)}));setIdx(Math.max(0,idx-1))}
 function addCard(){if(doc.slides.length>=10)return;setDoc(d=>({...d,slides:[...d.slides,{layout:"statement-portrait",headline:"Novo card",body:"Edite este texto.",cta:""}]}));setIdx(doc.slides.length)}
 function saveProject(){localStorage.setItem("mago-carousel-project",JSON.stringify({templateId,doc,fits,styles}));alert("Projeto salvo neste navegador.")}
 function loadProject(){const raw=localStorage.getItem("mago-carousel-project");if(!raw)return alert("Nenhum projeto salvo.");const p=JSON.parse(raw);setTemplateId(p.templateId||"mago-dark");setDoc(p.doc);setFits(p.fits||{});setStyles(p.styles||{});setIdx(0)}
 async function exportOne(i=idx){const el=refs.current[i];if(!el)return;const data=await htmlToImage.toPng(el,{pixelRatio:2});const a=document.createElement("a");a.href=data;a.download=`${doc.id||"carousel"}-${String(i+1).padStart(2,"0")}.png`;a.click()}
 async function exportAll(){for(let i=0;i<doc.slides.length;i++){await exportOne(i);await new Promise(r=>setTimeout(r,250))}}
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="s"){e.preventDefault();saveProject()}};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey)});
 const inputStyle={width:"100%",padding:10,boxSizing:"border-box" as const,marginTop:6,background:"#171717",color:"#fff",border:"1px solid #444",borderRadius:8};
 return <main style={{minHeight:"100vh",background:"#151515",color:"#fff",padding:24,fontFamily:"Arial,sans-serif"}}><div style={{maxWidth:1380,margin:"auto",display:"grid",gridTemplateColumns:"380px 1fr",gap:26}}>
 <aside style={{background:"#202020",padding:20,borderRadius:18,maxHeight:"calc(100vh - 48px)",overflowY:"auto"}}><h1 style={{marginTop:0}}>Carousel Studio</h1><p style={{opacity:.65}}>Editor visual completo</p>
 <label>Template</label><select value={templateId} onChange={e=>chooseTemplate(e.target.value as TemplateId)} style={inputStyle}>{Object.entries(TEMPLATES).map(([id,t])=><option key={id} value={id}>{t.name}</option>)}</select>
 <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12}}><button onClick={saveProject}>Salvar</button><button onClick={loadProject}>Carregar</button></div>
 <hr style={{borderColor:"#333",margin:"18px 0"}}/>
 <strong>Card {idx+1} de {doc.slides.length}</strong><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginTop:10}}><button onClick={()=>moveCard(-1)}>←</button><button onClick={()=>moveCard(1)}>→</button><button onClick={duplicateCard}>Duplicar</button><button onClick={removeCard}>Excluir</button></div><button onClick={addCard} style={{width:"100%",marginTop:8}}>+ Adicionar card</button>
 <hr style={{borderColor:"#333",margin:"18px 0"}}/>
 <label>Direção</label><select value={style.direction} onChange={e=>patchStyle({direction:e.target.value as Direction})} style={inputStyle}><option value="auto">Automático</option><option value="left">Foto à esquerda</option><option value="right">Foto à direita</option><option value="top">Foto em cima</option><option value="bottom">Foto embaixo</option><option value="full">Foto fundo inteiro</option></select>
 <label style={{display:"block",marginTop:12}}>Foto</label><input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>patch({image:String(r.result)});r.readAsDataURL(f)}}/>
 {doc.slides[idx].image&&<div style={{background:"#292929",padding:12,borderRadius:10,marginTop:10}}><label>Encaixe</label><select value={fit.fit} onChange={e=>patchFit({fit:e.target.value as FitMode})} style={inputStyle}><option value="cover">Preencher (cover)</option><option value="contain">Mostrar inteira (contain)</option></select><label style={{display:"block",marginTop:10}}>Mover X: {fit.x}%</label><input style={{width:"100%"}} type="range" min="-60" max="60" value={fit.x} onChange={e=>patchFit({x:+e.target.value})}/><label>Mover Y: {fit.y}%</label><input style={{width:"100%"}} type="range" min="-60" max="60" value={fit.y} onChange={e=>patchFit({y:+e.target.value})}/><label>Zoom: {fit.zoom}%</label><input style={{width:"100%"}} type="range" min="70" max="220" value={fit.zoom} onChange={e=>patchFit({zoom:+e.target.value})}/><label>Opacidade: {fit.opacity}%</label><input style={{width:"100%"}} type="range" min="10" max="100" value={fit.opacity} onChange={e=>patchFit({opacity:+e.target.value})}/><button onClick={()=>setFits(f=>({...f,[idx]:DEFAULT_FIT}))} style={{marginTop:8}}>Resetar foto</button></div>}
 <hr style={{borderColor:"#333",margin:"18px 0"}}/>
 <label>Headline</label><textarea value={doc.slides[idx].headline} onChange={e=>patch({headline:e.target.value})} rows={3} style={inputStyle}/><label style={{display:"block",marginTop:10}}>Texto</label><textarea value={doc.slides[idx].body||""} onChange={e=>patch({body:e.target.value})} rows={3} style={inputStyle}/><label style={{display:"block",marginTop:10}}>CTA</label><input value={doc.slides[idx].cta||""} onChange={e=>patch({cta:e.target.value})} style={inputStyle}/>
 <label style={{display:"block",marginTop:10}}>Alinhamento</label><select value={style.align} onChange={e=>patchStyle({align:e.target.value as TextAlign})} style={inputStyle}><option value="left">Esquerda</option><option value="center">Centro</option><option value="right">Direita</option></select><label style={{display:"block",marginTop:10}}>Título: {style.headlineSize}px</label><input style={{width:"100%"}} type="range" min="22" max="60" value={style.headlineSize} onChange={e=>patchStyle({headlineSize:+e.target.value})}/><label>Corpo: {style.bodySize}px</label><input style={{width:"100%"}} type="range" min="10" max="28" value={style.bodySize} onChange={e=>patchStyle({bodySize:+e.target.value})}/>
 <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:12}}><label>Fundo<input type="color" value={style.bg||"#090909"} onChange={e=>patchStyle({bg:e.target.value})} style={{width:"100%"}}/></label><label>Acento<input type="color" value={style.accent||"#D1A065"} onChange={e=>patchStyle({accent:e.target.value})} style={{width:"100%"}}/></label></div>
 {errors.length>0&&<div style={{marginTop:14,padding:10,background:"#4a1d1d",borderRadius:8,fontSize:12}}>{errors.map(x=><div key={x}>• {x}</div>)}</div>}</aside>
 <section><div ref={el=>{refs.current[idx]=el}} style={{width:W,height:H,margin:"0 auto",boxShadow:"0 20px 60px #0008"}}><SlideView slide={doc.slides[idx]} family={doc.family} index={idx} total={doc.slides.length} fit={fit} style={style}/></div><div style={{display:"flex",justifyContent:"center",gap:7,marginTop:16,flexWrap:"wrap"}}>{doc.slides.map((_,i)=><button key={i} onClick={()=>setIdx(i)} style={{padding:"8px 12px",fontWeight:i===idx?800:400}}>{i+1}</button>)}</div><div style={{display:"flex",justifyContent:"center",gap:10,marginTop:12}}><button onClick={()=>exportOne()}>Exportar card</button><button onClick={exportAll}>Exportar todos</button></div><div style={{position:"absolute",left:-99999,top:0}}>{doc.slides.map((s,i)=><div key={i} ref={el=>{if(i!==idx)refs.current[i]=el}}><SlideView slide={s} family={doc.family} index={i} total={doc.slides.length} fit={fits[i]||DEFAULT_FIT} style={styles[i]||DEFAULT_STYLE}/></div>)}</div></section></div></main>;
}
