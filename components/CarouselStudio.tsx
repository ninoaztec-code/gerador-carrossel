"use client";
import { useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import { CarouselDocument, CarouselSlide, FAMILIES, FamilyId, validateCarousel } from "@/lib/carousel";
import { cloneTemplate, TEMPLATES, TemplateId } from "@/lib/templates";

const W = 540, H = 675;

function RoseSlide({ slide, index, total }: { slide: CarouselSlide; index: number; total: number }) {
  const photoRight = index % 2 === 0;
  const isCover = index === 0;
  const isCta = index === total - 1;
  const bigNumber = isCover ? "5" : String(index);
  return <div style={{ width:W,height:H,position:"relative",overflow:"hidden",background:index%2===0?"#E8D8C8":"#F7F1EA",color:"#403632",fontFamily:"Arial,sans-serif" }}>
    <div style={{ position:"absolute", width:520, height:210, borderRadius:"50%", background:"#D6A49A", opacity:.72, left:index%2===0?260:-220, top:210, transform:`rotate(${index%2===0?-10:12}deg)` }} />
    <div style={{ position:"absolute", fontFamily:"Georgia,serif", fontSize:isCover?280:190, lineHeight:.8, fontWeight:700, color:"#743F4B", opacity:isCover?.16:.12, left:isCover?28:photoRight?30:325, top:isCover?220:355 }}>{bigNumber}</div>
    {slide.image && <div style={{ position:"absolute", top:isCover?0:70, bottom:isCover?0:70, width:isCover?"52%":"46%", right:photoRight?0:undefined, left:photoRight?undefined:0, overflow:"hidden", borderRadius:isCover?0:"48% 48% 0 0" }}><img src={slide.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center 20%"}} /></div>}
    <div style={{ position:"relative", zIndex:2, width:isCover?"52%":"48%", marginLeft:photoRight?0:"52%", padding:"54px 42px", height:"100%", display:"flex", flexDirection:"column" }}>
      <div style={{fontSize:10,letterSpacing:".22em",color:"#743F4B",fontWeight:700}}>{slide.eyebrow || `${String(index+1).padStart(2,"0")} / ${String(total).padStart(2,"0")}`}</div>
      <div style={{marginTop:isCover?160:130,fontFamily:"Georgia,serif",fontSize:isCover?39:35,lineHeight:1.02,fontWeight:700,color:"#743F4B"}}>{slide.headline}</div>
      {slide.body && <div style={{marginTop:24,fontSize:15,lineHeight:1.5,maxWidth:230}}>{slide.body}</div>}
      {isCta && slide.cta && <div style={{marginTop:"auto",fontSize:12,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",color:"#743F4B"}}>{slide.cta} →</div>}
      {!isCta && <div style={{marginTop:"auto",width:72,height:2,background:"#743F4B"}} />}
    </div>
    <div style={{position:"absolute",left:0,right:0,bottom:38,height:2,background:"linear-gradient(90deg,transparent 0%,#D6A49A 18%,#743F4B 50%,#D6A49A 82%,transparent 100%)",opacity:.65}} />
  </div>;
}

function DarkSplit({ slide, index, total }: { slide: CarouselSlide; index: number; total: number }) {
  const photoLeft = index % 2 === 1;
  const copy = <div style={{ padding:"34px 28px 29px", display:"flex", flexDirection:"column", minWidth:0 }}>
    <div style={{ color:"#D1A065",fontSize:9,fontWeight:700,letterSpacing:".32em" }}>MAGO DAS TESOURAS</div>
    <div style={{ color:"#D1A065",fontSize:10,fontWeight:700,letterSpacing:".28em",marginTop:9 }}>45+</div>
    <div style={{ color:"#D1A065",fontSize:10,letterSpacing:".16em",marginTop:60 }}>{slide.eyebrow || `${String(index+1).padStart(2,"0")} / ${String(total).padStart(2,"0")}`}</div>
    <div style={{width:38,height:2,background:"#D1A065",marginTop:12}} />
    <div style={{marginTop:26,fontFamily:"Georgia,serif",fontWeight:700,fontSize:29,lineHeight:1.12}}>{slide.headline}</div>
    {slide.body && <div style={{marginTop:28,fontSize:14,lineHeight:1.5}}>{slide.body}</div>}
    {slide.cta && <div style={{marginTop:"auto",fontSize:11,fontWeight:800,letterSpacing:".08em",color:"#D1A065"}}>{slide.cta} →</div>}
  </div>;
  const photo = <div style={{width:"100%",height:"100%",overflow:"hidden",background:"#C8B9A7"}}>{slide.image && <img src={slide.image} alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center 18%"}} />}</div>;
  return <div style={{width:W,height:H,background:"#0A0A0A",color:"#F4F0E8",display:"grid",gridTemplateColumns:"45% 55%",overflow:"hidden",fontFamily:"Arial,sans-serif"}}>{photoLeft?<>{photo}{copy}</>:<>{copy}{photo}</>}</div>;
}

function GenericSlide({ slide, family, index, total }: { slide:CarouselSlide; family:FamilyId; index:number; total:number }) {
  const t=FAMILIES[family]; const photo=slide.image; const hasPhoto=Boolean(photo)&&["hero-photo","statement-portrait","photo-cta"].includes(slide.layout);
  return <div style={{width:W,height:H,background:t.bg,color:t.ink,position:"relative",overflow:"hidden",fontFamily:t.sans}}>
    {hasPhoto&&<div style={{position:"absolute",right:0,top:0,width:slide.layout==="hero-photo"?"58%":"42%",height:"100%",overflow:"hidden"}}><img src={photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center 20%"}}/></div>}
    <div style={{position:"relative",zIndex:2,height:"100%",padding:"48px 46px",width:hasPhoto?"64%":"100%",display:"flex",flexDirection:"column"}}>
      <div style={{fontSize:10,letterSpacing:".18em",textTransform:"uppercase",opacity:.7}}>{slide.eyebrow||`${String(index+1).padStart(2,"0")} / ${String(total).padStart(2,"0")}`}</div>
      <div style={{marginTop:70,fontFamily:t.serif,fontWeight:700,fontSize:39,lineHeight:1.02}}>{slide.headline}</div>
      {slide.body&&<div style={{marginTop:28,fontSize:16,lineHeight:1.55}}>{slide.body}</div>}
      {!!slide.items?.length&&<div style={{marginTop:28,display:"grid",gap:12}}>{slide.items.map((x,i)=><div key={i} style={{display:"flex",gap:12,fontSize:15}}><span style={{color:t.accent}}>•</span>{x}</div>)}</div>}
      <div style={{marginTop:"auto"}}>{slide.cta&&<div style={{fontWeight:700,color:t.accent}}>{slide.cta} →</div>}<div style={{marginTop:22,width:70,height:1,background:t.accent}}/></div>
    </div>
  </div>;
}

function SlideView(props:{slide:CarouselSlide;family:FamilyId;index:number;total:number}) {
  if(props.family==="mago-editorial-rose") return <RoseSlide slide={props.slide} index={props.index} total={props.total}/>;
  if(props.family==="mago-editorial-premium" && props.slide.layout==="mago-split") return <DarkSplit slide={props.slide} index={props.index} total={props.total}/>;
  return <GenericSlide {...props}/>;
}

export default function CarouselStudio(){
  const [templateId,setTemplateId]=useState<TemplateId>("mago-dark");
  const [doc,setDoc]=useState<CarouselDocument>(()=>cloneTemplate("mago-dark"));
  const [idx,setIdx]=useState(0); const ref=useRef<HTMLDivElement>(null); const errors=validateCarousel(doc);
  const patch=(p:Partial<CarouselSlide>)=>setDoc(d=>({...d,slides:d.slides.map((s,i)=>i===idx?{...s,...p}:s)}));
  function chooseTemplate(id:TemplateId){setTemplateId(id);setDoc(cloneTemplate(id));setIdx(0)}
  async function exportOne(){if(errors.length)return alert(errors.join("\n"));if(!ref.current)return;const data=await htmlToImage.toPng(ref.current,{pixelRatio:2});const a=document.createElement("a");a.href=data;a.download=`${doc.id||"carousel"}-${String(idx+1).padStart(2,"0")}.png`;a.click()}
  return <main style={{minHeight:"100vh",background:"#151515",color:"#fff",padding:28,fontFamily:"Arial,sans-serif"}}>
    <div style={{maxWidth:1220,margin:"auto",display:"grid",gridTemplateColumns:"340px 1fr",gap:28}}>
      <aside style={{background:"#202020",padding:22,borderRadius:18}}>
        <h1 style={{marginTop:0}}>Carousel Studio</h1><p style={{opacity:.65}}>Teste visual direto · sem Hermes</p>
        <label>Template</label><select value={templateId} onChange={e=>chooseTemplate(e.target.value as TemplateId)} style={{width:"100%",padding:12,margin:"8px 0 8px"}}>{Object.entries(TEMPLATES).map(([id,t])=><option key={id} value={id}>{t.name}</option>)}</select>
        <p style={{fontSize:12,opacity:.65,marginTop:0}}>{TEMPLATES[templateId].description}</p>
        <hr style={{borderColor:"#333",margin:"20px 0"}}/>
        <label>Headline</label><textarea value={doc.slides[idx].headline} onChange={e=>patch({headline:e.target.value})} rows={4} style={{width:"100%",boxSizing:"border-box",padding:10,marginTop:8}}/>
        <label>Texto</label><textarea value={doc.slides[idx].body||""} onChange={e=>patch({body:e.target.value})} rows={4} style={{width:"100%",boxSizing:"border-box",padding:10,marginTop:8}}/>
        <label style={{display:"block",marginTop:12}}>Imagem do slide</label><input type="file" accept="image/*" onChange={e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=()=>patch({image:String(r.result)});r.readAsDataURL(f)}}/>
        {errors.length>0&&<div style={{marginTop:16,padding:12,background:"#4a1d1d",borderRadius:10,fontSize:12}}>{errors.map(x=><div key={x}>• {x}</div>)}</div>}
      </aside>
      <section><div ref={ref} style={{width:W,height:H,margin:"0 auto",boxShadow:"0 20px 60px #0008"}}><SlideView slide={doc.slides[idx]} family={doc.family} index={idx} total={doc.slides.length}/></div>
        <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:18,flexWrap:"wrap"}}>{doc.slides.map((_,i)=><button key={i} onClick={()=>setIdx(i)} style={{padding:"8px 12px",fontWeight:i===idx?800:400}}>{i+1}</button>)}<button onClick={exportOne} style={{padding:"8px 18px"}}>Exportar PNG</button></div>
      </section>
    </div>
  </main>
}
