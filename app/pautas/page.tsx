"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { OFFICIAL_PAUTAS, type OfficialPauta } from "@/lib/officialPautas";

type ProjectStatus = "checking" | "ready" | "missing" | "error";

function formatDate(value: string) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function badgeStyle(category: OfficialPauta["category"]) {
  if (category === "Corte") return { background: "#703C49", color: "#fff" };
  if (category === "Cor") return { background: "#92533D", color: "#fff" };
  return { background: "#E7D8CB", color: "#493731" };
}

export default function PautasPage() {
  const [status, setStatus] = useState<Record<string, ProjectStatus>>(() => Object.fromEntries(OFFICIAL_PAUTAS.map((item) => [item.id, "checking"])));
  const [filter, setFilter] = useState<"Todos" | OfficialPauta["category"]>("Todos");

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const entries = await Promise.all(OFFICIAL_PAUTAS.map(async (item) => {
        try {
          const response = await fetch(`/api/projects/${encodeURIComponent(item.id)}`, { cache: "no-store" });
          return [item.id, response.ok ? "ready" : response.status === 404 ? "missing" : "error"] as const;
        } catch {
          return [item.id, "error"] as const;
        }
      }));
      if (!cancelled) setStatus(Object.fromEntries(entries));
    };
    void check();
    return () => { cancelled = true; };
  }, []);

  const visible = useMemo(() => filter === "Todos" ? OFFICIAL_PAUTAS : OFFICIAL_PAUTAS.filter((item) => item.category === filter), [filter]);
  const readyCount = Object.values(status).filter((value) => value === "ready").length;

  return <main style={{ minHeight: "100vh", background: "#111", color: "#fff", fontFamily: "Arial,sans-serif", padding: 24 }}>
    <div style={{ maxWidth: 1280, margin: "0 auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-end", flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: ".16em", opacity: .6 }}>MAGO DAS TESOURAS</div>
          <h1 style={{ fontSize: "clamp(30px,5vw,54px)", margin: "8px 0 4px" }}>30 pautas oficiais</h1>
          <p style={{ margin: 0, opacity: .68 }}>CM-037 a CM-066 · somente conteúdo oficial · testes técnicos ficam fora desta lista.</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ background: "#202020", border: "1px solid #333", borderRadius: 999, padding: "10px 14px", fontWeight: 800 }}>{readyCount}/30 produzidas</div>
          <Link href="/studio" style={{ color: "#fff", background: "#292929", padding: "10px 14px", borderRadius: 10, textDecoration: "none" }}>Studio</Link>
        </div>
      </header>

      <nav style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 22 }}>
        {(["Todos", "Corte", "Cor", "Produtos/Tratamentos"] as const).map((item) => <button key={item} onClick={() => setFilter(item)} style={{ border: filter === item ? "2px solid #D3A29A" : "1px solid #444", background: filter === item ? "#3a2c2a" : "#1c1c1c", color: "#fff", borderRadius: 999, padding: "10px 15px", fontWeight: 800, cursor: "pointer" }}>{item}</button>)}
      </nav>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: 14 }}>
        {visible.map((item) => {
          const state = status[item.id] || "checking";
          const ready = state === "ready";
          return <article key={item.id} style={{ background: "#1c1c1c", border: "1px solid #303030", borderRadius: 18, padding: 18, display: "flex", flexDirection: "column", minHeight: 250 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
              <strong style={{ fontSize: 19 }}>{item.id}</strong>
              <span style={{ ...badgeStyle(item.category), borderRadius: 999, padding: "6px 9px", fontSize: 12, fontWeight: 800 }}>{item.category}</span>
            </div>
            <div style={{ fontSize: 12, opacity: .58, marginTop: 9 }}>{formatDate(item.date)} · {item.day} · {item.format}</div>
            <h2 style={{ fontSize: 21, lineHeight: 1.18, margin: "16px 0 12px" }}>{item.title}</h2>
            <div style={{ marginTop: "auto", paddingTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 10, color: ready ? "#a8e6b0" : state === "checking" ? "#e6d5a8" : "#bbb" }}>
                {ready ? "● projeto produzido" : state === "checking" ? "● verificando VPS…" : state === "error" ? "● não foi possível verificar" : "○ a produzir"}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {ready ? <>
                  <Link href={`/studio?project=${encodeURIComponent(item.id)}`} style={{ background: "#F7F2EC", color: "#493731", padding: "10px 13px", borderRadius: 10, textDecoration: "none", fontWeight: 900 }}>Abrir Studio</Link>
                  <a href={`/api/hermes/render-project?project_id=${encodeURIComponent(item.id)}`} target="_blank" rel="noreferrer" style={{ background: "#292929", color: "#fff", padding: "10px 13px", borderRadius: 10, textDecoration: "none", fontWeight: 800 }}>Render</a>
                </> : <span style={{ background: "#252525", color: "#888", padding: "10px 13px", borderRadius: 10, fontWeight: 800 }}>Link será liberado após produção</span>}
              </div>
            </div>
          </article>;
        })}
      </section>
    </div>
  </main>;
}
