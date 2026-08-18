"use client";

import { useState } from "react";
import Link from "next/link";

const PIN = "1975";
type Tab = "aprovados" | "agendados" | "publicados" | "arquivo";

export default function PublicacaoPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("aprovados");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:00");
  const [instagram, setInstagram] = useState(true);
  const [facebook, setFacebook] = useState(false);

  if (!unlocked) return <main style={{minHeight:"100vh",background:"#111",color:"#fff",display:"grid",placeItems:"center",fontFamily:"Arial,sans-serif",padding:20}}>
    <div style={{width:"100%",maxWidth:390,background:"#202020",padding:28,borderRadius:20,boxShadow:"0 20px 70px #0008"}}>
      <div style={{fontSize:34}}>🔒</div><h1>Central de Publicação</h1><p style={{opacity:.7}}>Área reservada para aprovação, calendário e programação.</p>
      <input inputMode="numeric" type="password" placeholder="Digite o PIN" value={pin} onChange={e=>{setPin(e.target.value);setError("")}} style={{width:"100%",boxSizing:"border-box",padding:14,borderRadius:10,border:"1px solid #555",background:"#111",color:"white",fontSize:18}} />
      {error && <p style={{color:"#ffb4b4"}}>{error}</p>}
      <button onClick={()=> pin===PIN ? setUnlocked(true) : setError("PIN incorreto") } style={{width:"100%",marginTop:12,padding:14,border:0,borderRadius:10,fontWeight:800}}>ENTRAR</button>
      <Link href="/studio" style={{display:"block",textAlign:"center",color:"#ddd",marginTop:18}}>← Voltar ao Studio</Link>
    </div>
  </main>;

  const tabs: {id:Tab;label:string}[]=[{id:"aprovados",label:"Aprovados"},{id:"agendados",label:"Agendados"},{id:"publicados",label:"Publicados"},{id:"arquivo",label:"Arquivo"}];
  return <main style={{minHeight:"100vh",background:"#111",color:"#fff",fontFamily:"Arial,sans-serif",padding:24}}>
    <div style={{maxWidth:1200,margin:"auto"}}>
      <header style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",flexWrap:"wrap"}}><div><div style={{opacity:.6,fontSize:12,letterSpacing:".15em"}}>MAGO DAS TESOURAS</div><h1 style={{margin:"6px 0"}}>Central de Publicação</h1><p style={{opacity:.65,margin:0}}>Conteúdos finalizados · Hermes · programação</p></div><div style={{display:"flex",gap:8}}><Link href="/studio" style={{background:"#292929",color:"white",padding:"11px 14px",borderRadius:10,textDecoration:"none"}}>← Studio</Link><button onClick={()=>{setUnlocked(false);setPin("")}}>Sair</button></div></header>
      <nav style={{display:"flex",gap:8,margin:"24px 0",flexWrap:"wrap"}}>{tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{padding:"11px 16px",borderRadius:999,border:tab===t.id?"2px solid #D3A29A":"1px solid #555",background:tab===t.id?"#3a2c2a":"#202020",color:"white",fontWeight:700}}>{t.label}</button>)}</nav>
      {tab==="aprovados" ? <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 360px",gap:20}}>
        <section style={{background:"#1d1d1d",borderRadius:18,padding:20}}><h2>Projetos aprovados</h2><div style={{border:"1px dashed #555",borderRadius:14,padding:36,textAlign:"center",opacity:.75}}><div style={{fontSize:38}}>✓</div><h3>Aguardando projetos finalizados</h3><p>Quando um carrossel for marcado como aprovado no Studio, ele aparecerá aqui com os 5 cards, legenda, CTA e ID do projeto.</p></div></section>
        <aside style={{background:"#202020",borderRadius:18,padding:20}}><h2>Programação</h2><label>Data</label><input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{width:"100%",boxSizing:"border-box",padding:11,margin:"7px 0 14px",background:"#111",color:"white",border:"1px solid #555",borderRadius:9}}/><label>Horário</label><input type="time" value={time} onChange={e=>setTime(e.target.value)} style={{width:"100%",boxSizing:"border-box",padding:11,margin:"7px 0 14px",background:"#111",color:"white",border:"1px solid #555",borderRadius:9}}/><strong>Canais</strong><label style={{display:"block",marginTop:12}}><input type="checkbox" checked={instagram} onChange={e=>setInstagram(e.target.checked)}/> Instagram</label><label style={{display:"block",marginTop:9}}><input type="checkbox" checked={facebook} onChange={e=>setFacebook(e.target.checked)}/> Facebook</label><button disabled style={{width:"100%",marginTop:22,padding:14,borderRadius:10,border:0,fontWeight:800,opacity:.45}}>PROGRAMAR</button><p style={{fontSize:12,opacity:.55}}>O botão será liberado quando houver um projeto aprovado selecionado e a integração Hermes/Zernio estiver conectada.</p></aside>
      </div> : <section style={{background:"#1d1d1d",borderRadius:18,padding:28}}><h2>{tabs.find(t=>t.id===tab)?.label}</h2><p style={{opacity:.65}}>Esta área já está preparada para receber o histórico dos projetos quando conectarmos o fluxo Hermes/Zernio.</p></section>}
    </div>
  </main>;
}
