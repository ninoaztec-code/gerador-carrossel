"use client";
import { useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import { CarouselDocument, CarouselSlide, FAMILIES, FamilyId, validateCarousel } from "@/lib/carousel";
import { cloneTemplate, TEMPLATES, TemplateId } from "@/lib/templates";

const W = 540, H = 675;
type PhotoFit = { x:number; y:number; zoom:number };
const DEFAULT_FIT: PhotoFit = { x:50, y:20, zoom:100 };

function Photo({src,fit}:{src?:string;fit:PhotoFit}){
  if(!src) return null;
  return <img src={src} alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:`${fit.x}% ${fit.y}%`,transform:`scale(${fit.zoom/100})`,transformOrigin:`${fit.x}% ${fit.y}%`}}/>;
}

function RoseSlide({ slide, index, total, fit }: { slide: CarouselSlide; index: number; total: number; fit:PhotoFit }) {
  const photoRight = index % 2 === 0, isCover=index===0, isCta=index===total-1, bigNumber=isCover?"5":String(index);
  return <div style={{width:W,height:H,position:"relative",overflow:"hidden",background:index%2===0?"#E8D8C8":"#F7F1EA",color:"#403632",fontFamily:"Arial,sans-serif"}}>
    <div style={{position:"absolute",width:520,height:210,borderRadius:"50%",background:"#D6A49A",opacity:.72,left:index%2===0?260:-220,top:210,transform:`rotate(${index%2===0?-10:12}deg)`}}/>
    <div style={{position:"absolute",fontFamily:"Georgia,serif",fontSize:isCover?280:190,lineHeight:.8,fontWeight:700,color:"#743F4B",opacity:isCover?.16:.12,left:isCover?28:photoRight?30:325,top:isCover?220:355}}>{bigNumber}</div>
    {slide.image&&<div style={{position:"absolute",top:isCover?0:70,bottom:isCover?0:70,width:isCover?"52%":"46%",right:photoRight?0:undefined,left:photoRight?undefined:0,overflow:"hidden",borderRadius:isCover?0:"48% 48% 0 0"}}><Photo src={slide.image} fit={fit}/></div>}
    <div style={{position:"relative",zIndex:2,width:isCover?"52%":"48%",marginLeft:photoRight?0:"52%",padding:"54px 42px",height:"100%",display:"flex",flexDirection:"column"}}>
      <div style={{fontSize:10,letterSpacing:".22em",color:"#743F4B",fontWeight:700}}>{slide.eyebrow||`${String(index+1).padStart(2,"0")} / ${String(total).padStart(2,"0")}`}</div>
      <div style={{marginTop:isCover?160:130,fontFamily:"Georgia,serif",fontSize:isCover?39:35,lineHeight:1.02,fontWeight:700,color:"#743F4B"}}>{slide.headline}</div>
      {slide.body&&<div style={{marginTop:24,fontSize:15,lineHeight:1.5,maxWidth:230}}>{slide.body}</div>}
      {isCta&&slide.cta&&<div style={{marginTop:"auto",fontSize:12,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",color:"#743F4B"}}>{slide.cta} →</div>}
      {!isCta&&<div style={{marginTop:"auto",width:72,height:2,background:"#743F4B"}}/>}
    </div>
    <div style={{position:"absolute",left:0,right:0,bottom:38,height:2,background:"linear-gradient(90deg,transparent 0%,#D6A49A 18%,#743F4B 50%,#D6A49A 82%,transparent 100%)",opacity:.65}}/>
  </div>;
}

function DarkSplit({ slide,index,total,fit }:{slide:CarouselSlide;index:number;total:number;fit:PhotoFit}){
  const photoLeft=index%2===1;
  const copy=<div style={{padding:"42px 27px 34px",display:"flex",flexDirection:"column",minWidth:0}}>
    <div style={{color:"#D1A065",fontSize:9,fontWeight:700,letterSpacing:".32em"}}>MAGO DAS TESOURAS</div><div style={{color:"#D1A065",fontSize:10,fontWeight:700,letterSpacing:".28em",marginTop:9}}>45+</div>
    <div style={{color:"#D1A065",fontSize:10,letterSpacing:".16em",marginTop:66}}>{slide.eyebrow||`${String(index+1).padStart(2,"0")} / ${String(total).padStart(2,"0")}`}</div><div style={{width:38,height:2,background:"#D1A065",marginTop:12}}/>
    <div style={{marginTop:26,fontFamily:"Georgia,serif",fontWeight:700,fontSize:29,lineHeight:1.12}}>{slide.headline}</div>{slide.body&&<div style={{marginTop:28,fontSize:14,lineHeight:1.5}}>{slide.body}</div>}
    {slide.cta&&<div style={{marginTop:"auto",display:"inline-block",alignSelf:"flex-start",padding:"14px 16px",borderRadius:18,background:"#D1A065",color:"#111",fontSize:11,fontWeight:800}}>{slide.cta}</div>}
  </div>;
  const photo=<div style={{width:"100%",height:"100%",overflow:"hidden",background:"#C8B9A7"}}><Photo src={slide.image} fit={fit}/></div>;
  return <div style={{width:W,height:H,background:"#0A0A0A",color:"#F4F0E8",display:"grid",gridTemplateColumns:"48% 52%",overflow:"hidden",fontFamily:"Arial,sans-serif"}}>{photoLeft?<>{photo}{copy}</>:<>{copy}{photo}</>}</div>;
}

function GenericSlide({slide,family,index,total,fit}:{slide:CarouselSlide;family:FamilyId;index:number;total:number;fit:PhotoFit}){
 const t=FAMILIES[family],hasPhoto=Boolean(slide.image)&&["hero-photo","statement-portrait","photo-cta"].includes(slide.layout);
 return <div style={{width:W,height:H,background:t.bg,color:t.ink,position:"relative",overflow:"hidden",fontFamily:t.sans}}>{hasPhoto&&<div style={{position:"absolute",right:0,top:0,width:slide.layout==="hero-photo"?"58%":"42%",height:"100%",overflow:"hidden"}}><Photo src={slide.image} fit={fit}/></div>}<div style={{position:"relative",zIndex:2,height:"100%",padding:"48px 46px",width:hasPhoto?"64%":"100%",display:"flex",flexDirection:"column"}}><div style={{fontSize:10,letterSpacing:".18em",textTransform:"uppercase",opacity:.7}}>{slide.eyebrow||`${String(index+1).padStart(2,"0")} / ${String(total).padStart(2,"0")}`}</div><div style={{marginTop:70,fontFamily:t.serif,fontWeight:700,fontSize:39,lineHeight:1.02}}>{slide.headline}</div>{slide.body&&<div style={{marginTop:28,fontSize:16,lineHeight:1.55}}>{slide.body}</div>}<div style={{marginTop:"auto"}}>{slide.cta&&<div style={{fontWeight:700,color:t.accent}}>{slide.cta} →</div>}</div></div></div>;
}
function SlideView(p:{slide:CarouselSlide;family:FamilyId;index:number;total:number;fit:PhotoFit}){if(p.family==="mago-editorial-rose")return <RoseSlide {...p}/>;if(p.family==="mago-editorial-premium"&&p.slide.layout==="mago-split")return <DarkSplit {...p}/>;return <GenericSlide {...p}/>}

export default function CarouselStudio(){
 const [templateId,setTemplateId]=useState<TemplateId>("mago-dark"),[doc,setDoc]=useState<CarouselDocument>(()=>cloneTemplate("mago-dark")),[idx,setIdx]=useState(0),[fits,setFits]=useState<Record<number,PhotoFit>>({}); const ref=useRef<HTMLDivElement>(null),errors=validateCarousel(doc),fit=fits[idx]||DEFAULT_FIT;
 const patch=(p:Partial<CarouselSlide>)=>setDoc(d=>({...d,slides:d.slides.map((s,i)=>i===idx?{...s,...p}:s)})); const patchFit=(p:Partial<PhotoFit>)=>setFits(f=>({...f,[idx]:{...(f[idx]||DEFAULT_FIT),...p}}));
 function chooseTemplate(id:TemplateId){setTemplateId(id);setDoc(cloneTemplate(id));setIdx(0);setFits({})}
 async function exportOne(){if(errors.length)return alert(errors.join("\n"));if(!ref.current)return;const data=await htmlToImage.toPng(ref.current,{pixelRatio:2});const a=document.createElement("a");a.href=data;a.download=`${doc.id||"carousel"}-${String(idx+1).padStart(2,"0")}.png`;a.click()}
 return <main style={{minHeight:"100vh",background:"#151515",color:"#fff",padding:28,fontFamily:"Arial,sans-serif"}}><div style={{maxWidth:1280,margin:"auto",display:"grid",gridTemplateColumns:"360px 1fr",gap:28}}>
 <aside style={{background:"#202020",padding:22,borderRadius:18}}><h1 style={{marginTop:0}}>Carousel Studio</h1><p style={{opacity:.65}}>Monte visualmente · sem Hermes</p>
 <label>Template</label><select value={templateId} onChange={e=>chooseTemplate(e.target.value as TemplateId)} style={{width:"100%",padding:12,margin:"8px 0 18px"}}>{Object.entries(TEMPLATES).map(([id,t])=><option key={id} value={id}>{t.name}</option>)}</select>
 <div style={{background:"#292929",padding:16,borderRadius:14,marginBottom:18}}><strong>Foto do card {idx+1}</strong><div style={{marginTop:12,border:"1px dashed #666",padding:14,borderRadius:10,textAlign:"center"}}><input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>patch({image:String(r.result)});r.readAsDataURL(f)}}/></div>
 {doc.slides[idx].image&&<><label style={{display:"block",marginTop:14}}>Mover horizontal: {fit.x}%</label><input style={{width:"100%"}} type="range" min="0" max="100" value={fit.x} onChange={e=>patchFit({x:+e.target.value})}/><label style={{display:"block",marginTop:10}}>Mover vertical: {fit.y}%</label><input style={{width:"100%"}} type="range" min="0" max="100" value={fit.y} onChange={e=>patchFit({y:+e.target.value})}/><label style={{display:"block",marginTop:10}}>Zoom: {fit.zoom}%</label><input style={{width:"100%"}} type="range" min="100" max="180" value={fit.zoom} onChange={e=>patchFit({zoom:+e.target.value})}/><button onClick={()=>patchFit(DEFAULT_FIT)} style={{marginTop:10,padding:"7px 10px"}}>Resetar foto</button></>}</div>
 <label>Headline</label><textarea value={doc.slides[idx].headline} onChange={e=>patch({headline:e.target.value})} rows={4} style={{width:"100%",boxSizing:"border-box",padding:10,marginTop:8}}/><label>Texto</label><textarea value={doc.slides[idx].body||""} onChange={e=>patch({body:e.target.value})} rows={3} style={{width:"100%",boxSizing:"border-box",padding:10,marginTop:8}}/>{errors.length>0&&<div style={{marginTop:16,padding:12,background:"#4a1d1d",borderRadius:10,fontSize:12}}>{errors.map(x=><div key={x}>• {x}</div>)}</div>}</aside>
 <section><div ref={ref} style={{width:W,height:H,margin:"0 auto",boxShadow:"0 20px 60px #0008"}}><SlideView slide={doc.slides[idx]} family={doc.family} index={idx} total={doc.slides.length} fit={fit}/></div><div style={{display:"flex",justifyContent:"center",gap:8,marginTop:18,flexWrap:"wrap"}}>{doc.slides.map((_,i)=><button key={i} onClick={()=>setIdx(i)} style={{padding:"8px 12px",fontWeight:i===idx?800:400}}>{i+1}</button>)}<button onClick={exportOne} style={{padding:"8px 18px"}}>Exportar PNG</button></div></section></div></main>;
}
