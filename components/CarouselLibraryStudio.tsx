"use client";
import {useMemo,useRef,useState,type ChangeEvent,type ReactNode} from "react";
import * as htmlToImage from "html-to-image";
import {INSTAGRAM_45PLUS_LIBRARY,LIBRARY_COLORS} from "@/lib/instagramTemplateLibrary";
import type {LibraryCard,LibraryTemplate,Box,TextBox} from "@/lib/instagramTemplateLibrary";

const W=540,H=675;
type PhotoCfg={x:number;y:number;zoom:number;fit:"cover"|"contain";opacity:number};
type Copy={headline:string;body:string;cta:string};
type Brand={name:string;tagline:string};
const DEFAULT_PHOTO:PhotoCfg={x:0,y:0,zoom:100,fit:"cover",opacity:100};
const DEFAULT_COPY:Copy={headline:"Um corte que conversa com quem você é hoje.",body:"Movimento, proporção e personalidade para valorizar seu cabelo e sua rotina.",cta:"Agende seu corte pelo WhatsApp."};

function colorOf(name?:string){if(!name)return LIBRARY_COLORS.off_white;return (LIBRARY_COLORS as Record<string,string>)[name]||name;}
function slotKey(templateId:string,card:number,slot:number){return `${templateId}:${card}:${slot}`}
function copyKey(templateId:string,card:number){return `${templateId}:${card}`}
function uploadFile(cb:(v:string)=>void){return(e:ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>cb(String(r.result));r.readAsDataURL(f)}}
function boxRadius(b:Box){if(b.radius)return b.radius;if(b.shape==="oval"||b.shape==="oval_vertical"||b.shape==="circulo")return "50%";if(b.shape?.includes("capsula"))return "999px";if(b.shape?.includes("arco"))return "50% 50% 20px 20px";return "18px"}

function PhotoSlot({box,image,cfg,label,onClick}:{box:Box;image?:string;cfg:PhotoCfg;label?:string;onClick:()=>void}){
 return <div onClick={onClick} style={{position:"absolute",left:`${box.x}%`,top:`${box.y}%`,width:`${box.w}%`,height:`${box.h}%`,borderRadius:boxRadius(box),overflow:"hidden",background:"#E9DED4",border:"1px dashed #A77C69",color:"#755547",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",zIndex:2,boxSizing:"border-box"}}>
  {image?<img src={image} alt="" style={{width:"100%",height:"100%",display:"block",objectFit:cfg.fit,opacity:cfg.opacity/100,transform:`translate(${cfg.x}px,${cfg.y}px) scale(${cfg.zoom/100})`,transformOrigin:"center"}}/>:<div style={{textAlign:"center",padding:10,fontFamily:"Inter,Arial,sans-serif"}}><div style={{fontSize:24,opacity:.65}}>▧</div><div style={{fontSize:9,fontWeight:800,letterSpacing:".12em",marginTop:6}}>COLOQUE SUA FOTO AQUI</div></div>}
  {label&&<div style={{position:"absolute",left:8,top:8,background:"rgba(37,32,30,.82)",color:"white",padding:"4px 7px",borderRadius:10,fontSize:8,fontWeight:800,letterSpacing:".12em"}}>{label}</div>}
 </div>
}

function TextArea({box,children,kind="body"}:{box?:TextBox;children:ReactNode;kind?:"headline"|"body"|"cta"}){if(!box)return null;const sizes={headline:34,body:14,cta:16};return <div style={{position:"absolute",left:`${box.x}%`,top:`${box.y}%`,width:`${box.w}%`,zIndex:3,fontFamily:kind==="headline"?"Georgia,serif":"Inter,Arial,sans-serif",fontSize:sizes[kind],lineHeight:kind==="headline"?1.05:1.45,fontWeight:kind==="headline"?700:kind==="cta"?800:500,color:"#493731",whiteSpace:"pre-wrap"}}>{children}</div>}
}

function CardCanvas({template,card,index,images,photoCfgs,copy,brand,onSelectSlot}:{template:LibraryTemplate;card:LibraryCard;index:number;images:Record<string,string>;photoCfgs:Record<string,PhotoCfg>;copy:Copy;brand:Brand;onSelectSlot:(i:number)=>void}){
 const bg=colorOf(card.bg);const dark=(Object.values(LIBRARY_COLORS) as string[]).filter(v=>[LIBRARY_COLORS.terracota,LIBRARY_COLORS.vinho,LIBRARY_COLORS.marrom,LIBRARY_COLORS.preto].includes(v)).includes(bg);const ink=dark?"#FFF9F4":"#493731";
 const headlineBox=card.headline||card.text||card.cta||{x:7,y:18,w:40};const bodyBox=card.text&&!card.headline?undefined:card.text;const ctaBox=card.cta;
 return <div style={{width:W,height:H,position:"relative",overflow:"hidden",background:bg,color:ink,boxShadow:"inset 0 0 0 1px rgba(0,0,0,.04)"}}>
  <div style={{position:"absolute",left:30,top:28,zIndex:4,fontFamily:"Inter,Arial,sans-serif",color:dark?"#F7F2EC":"#703C49"}}><div style={{fontSize:9,fontWeight:800,letterSpacing:".2em"}}>{brand.name}</div><div style={{fontSize:9,fontWeight:700,letterSpacing:".16em",marginTop:5}}>{brand.tagline}</div><div style={{fontSize:9,letterSpacing:".12em",marginTop:15}}>{String(index+1).padStart(2,"0")} / 05 · {template.id}</div></div>
  {card.photos.map((p,i)=><PhotoSlot key={i} box={p} image={images[slotKey(template.id,index,i)]} cfg={photoCfgs[slotKey(template.id,index,i)]||DEFAULT_PHOTO} label={card.labels?.[i]} onClick={()=>onSelectSlot(i)}/>)}
  {card.number&&<div style={{position:"absolute",left:"45%",top:"12%",fontFamily:"Georgia,serif",fontSize:100,lineHeight:1,fontWeight:700,color:dark?"rgba(255,255,255,.12)":"rgba(112,60,73,.12)",zIndex:1}}>{card.number}</div>}
  <div style={{color:ink}}><TextArea box={headlineBox} kind="headline">{copy.headline}</TextArea>{bodyBox&&<TextArea box={bodyBox} kind="body">{copy.body}</TextArea>}{ctaBox&&<TextArea box={ctaBox} kind="cta">{copy.cta}</TextArea>}{card.extraText?.map((b,i)=><TextArea key={i} box={b} kind="body">{i===0?copy.body:"Detalhes, dicas e observações para complementar o conteúdo."}</TextArea>)}</div>
 </div>
}

export default function CarouselLibraryStudio(){
 const [templateId,setTemplateId]=useState("T01"),[cardIndex,setCardIndex]=useState(0),[slotIndex,setSlotIndex]=useState(0),[images,setImages]=useState<Record<string,string>>({}),[photoCfgs,setPhotoCfgs]=useState<Record<string,PhotoCfg>>({}),[copies,setCopies]=useState<Record<string,Copy>>({}),[brand,setBrand]=useState<Brand>({name:"MAGO DAS TESOURAS",tagline:"45+"}),[grid,setGrid]=useState(false);const refs=useRef<(HTMLDivElement|null)[]>([]);
 const template=INSTAGRAM_45PLUS_LIBRARY.find(t=>t.id===templateId)??INSTAGRAM_45PLUS_LIBRARY[0];
 if(!template)return null;
 const card=template.cards[cardIndex]??template.cards[0];
 if(!card)return null;
 const safeSlot=Math.min(slotIndex,Math.max(0,card.photos.length-1)),pkey=slotKey(template.id,cardIndex,safeSlot),ckey=copyKey(template.id,cardIndex),pcfg=photoCfgs[pkey]||DEFAULT_PHOTO,copy=copies[ckey]||DEFAULT_COPY;
 const control={width:"100%",padding:9,marginTop:6,boxSizing:"border-box" as const,background:"#151515",color:"#fff",border:"1px solid #444",borderRadius:8};
 const patchPhoto=(p:Partial<PhotoCfg>)=>setPhotoCfgs(s=>({...s,[pkey]:{...(s[pkey]||DEFAULT_PHOTO),...p}}));const patchCopy=(p:Partial<Copy>)=>setCopies(s=>({...s,[ckey]:{...(s[ckey]||DEFAULT_COPY),...p}}));
 const selectTemplate=(id:string)=>{setTemplateId(id);setCardIndex(0);setSlotIndex(0)};
 const save=()=>{localStorage.setItem("mago-library-studio",JSON.stringify({templateId,cardIndex,images,photoCfgs,copies,brand}));alert("Projeto salvo neste navegador.")};
 const load=()=>{const raw=localStorage.getItem("mago-library-studio");if(!raw)return alert("Nenhum projeto salvo.");const p=JSON.parse(raw);setTemplateId(p.templateId||"T01");setCardIndex(p.cardIndex||0);setImages(p.images||{});setPhotoCfgs(p.photoCfgs||{});setCopies(p.copies||{});setBrand(p.brand||brand);setSlotIndex(0)};
 const exportOne=async(i=cardIndex)=>{const el=refs.current[i];if(!el)return;const data=await htmlToImage.toPng(el,{pixelRatio:2,cacheBust:true});const a=document.createElement("a");a.href=data;a.download=`${template.id}-${String(i+1).padStart(2,"0")}.png`;a.click()};
 const exportAll=async()=>{for(let i=0;i<template.cards.length;i++){await exportOne(i);await new Promise(r=>setTimeout(r,200))}};
 const currentImage=images[pkey];
 const caption=useMemo(()=>template.cards.map((_,i)=>(copies[copyKey(template.id,i)]||DEFAULT_COPY).headline).join("\n\n"),[template,copies]);
 return <main style={{minHeight:"100vh",background:"#111",color:"#fff",padding:22,fontFamily:"Arial,sans-serif"}}><div style={{maxWidth:1500,margin:"auto",display:"grid",gridTemplateColumns:"410px 1fr",gap:24}}>
  <aside style={{background:"#202020",borderRadius:18,padding:18,maxHeight:"calc(100vh - 44px)",overflowY:"auto"}}><h1 style={{margin:"0 0 4px"}}>Carousel Studio · Biblioteca 45+</h1><p style={{opacity:.65,marginTop:4}}>12 templates · 60 layouts-base · 1080×1350</p>
   <label>Template visual</label><select value={templateId} onChange={e=>selectTemplate(e.target.value)} style={control}>{INSTAGRAM_45PLUS_LIBRARY.map(t=><option key={t.id} value={t.id}>{t.id} · {t.name}</option>)}</select><div style={{fontSize:12,opacity:.7,marginTop:7}}>{template.description}</div>
   <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:10}}><button onClick={save}>Salvar</button><button onClick={load}>Carregar</button></div>
   <hr style={{borderColor:"#333",margin:"16px 0"}}/><strong>Branding</strong><input value={brand.name} onChange={e=>setBrand({...brand,name:e.target.value})} style={control}/><input value={brand.tagline} onChange={e=>setBrand({...brand,tagline:e.target.value})} style={control}/>
   <hr style={{borderColor:"#333",margin:"16px 0"}}/><strong>Card {cardIndex+1}/{template.cards.length}</strong><div style={{display:"grid",gridTemplateColumns:`repeat(${template.cards.length},1fr)`,gap:5,marginTop:8}}>{template.cards.map((_,i)=><button key={i} onClick={()=>{setCardIndex(i);setSlotIndex(0)}} style={{fontWeight:i===cardIndex?800:400}}>{i+1}</button>)}</div>
   <label style={{display:"block",marginTop:12}}>Área de foto</label><select value={safeSlot} onChange={e=>setSlotIndex(+e.target.value)} style={control}>{card.photos.map((_,i)=><option key={i} value={i}>Foto {i+1}{card.labels?.[i]?` · ${card.labels[i]}`:""}</option>)}</select>
   <div style={{marginTop:10,padding:12,border:"1px dashed #666",borderRadius:10}}><input type="file" accept="image/*" onChange={uploadFile(v=>setImages(s=>({...s,[pkey]:v}))}/>{currentImage&&<button onClick={()=>setImages(s=>{const n={...s};delete n[pkey];return n})} style={{marginTop:8}}>Remover foto</button>}</div>
   <label style={{display:"block",marginTop:10}}>Encaixe</label><select value={pcfg.fit} onChange={e=>patchPhoto({fit:e.target.value as "cover"|"contain"})} style={control}><option value="cover">Cover</option><option value="contain">Contain</option></select><label>Mover X {pcfg.x}px</label><input type="range" min="-220" max="220" value={pcfg.x} onChange={e=>patchPhoto({x:+e.target.value})} style={{width:"100%"}}/><label>Mover Y {pcfg.y}px</label><input type="range" min="-220" max="220" value={pcfg.y} onChange={e=>patchPhoto({y:+e.target.value})} style={{width:"100%"}}/><label>Zoom {pcfg.zoom}%</label><input type="range" min="70" max="220" value={pcfg.zoom} onChange={e=>patchPhoto({zoom:+e.target.value})} style={{width:"100%"}}/><label>Opacidade {pcfg.opacity}%</label><input type="range" min="20" max="100" value={pcfg.opacity} onChange={e=>patchPhoto({opacity:+e.target.value})} style={{width:"100%"}}/>
   <hr style={{borderColor:"#333",margin:"16px 0"}}/><label>Headline</label><textarea value={copy.headline} onChange={e=>patchCopy({headline:e.target.value})} rows={3} style={control}/><label style={{display:"block",marginTop:8}}>Texto</label><textarea value={copy.body} onChange={e=>patchCopy({body:e.target.value})} rows={3} style={control}/><label style={{display:"block",marginTop:8}}>CTA</label><input value={copy.cta} onChange={e=>patchCopy({cta:e.target.value})} style={control}/>
   <button onClick={()=>setGrid(!grid)} style={{width:"100%",marginTop:12}}>{grid?"Preview único":"Preview em grade"}</button>
  </aside>
  <section><div style={{display:"flex",justifyContent:"flex-end",gap:8,marginBottom:12}}><button onClick={()=>exportOne()}>Exportar card</button><button onClick={exportAll}>Exportar {template.cards.length} cards</button></div>{grid?<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:14}}>{template.cards.map((c,i)=><div key={i} onClick={()=>{setCardIndex(i);setSlotIndex(0);setGrid(false)}} style={{cursor:"pointer",background:"#1d1d1d",padding:8,borderRadius:12}}><div style={{width:250,height:312.5,overflow:"hidden"}}><div style={{transform:"scale(.463)",transformOrigin:"top left",width:W,height:H}}><CardCanvas template={template} card={c} index={i} images={images} photoCfgs={photoCfgs} copy={copies[copyKey(template.id,i)]||DEFAULT_COPY} brand={brand} onSelectSlot={()=>{}}/></div></div><div style={{textAlign:"center",paddingTop:7}}>Card {i+1}</div></div>)}</div>:<div ref={el=>{refs.current[cardIndex]=el}} style={{width:W,height:H,margin:"0 auto",boxShadow:"0 22px 70px #0009"}}><CardCanvas template={template} card={card} index={cardIndex} images={images} photoCfgs={photoCfgs} copy={copy} brand={brand} onSelectSlot={setSlotIndex}/></div>}
   <div style={{marginTop:16,background:"#1c1c1c",padding:12,borderRadius:10}}><strong>Legenda rápida</strong><textarea readOnly value={caption} rows={6} style={{...control,marginTop:8}}/></div>
   <div style={{position:"fixed",left:-10000,top:0}}>{template.cards.map((c,i)=><div key={i} ref={el=>{refs.current[i]=el}} style={{width:W,height:H}}><CardCanvas template={template} card={c} index={i} images={images} photoCfgs={photoCfgs} copy={copies[copyKey(template.id,i)]||DEFAULT_COPY} brand={brand} onSelectSlot={()=>{}}/></div>)}</div>
  </section>
 </div></main>
}
