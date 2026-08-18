"use client";

import { useEffect, useState } from "react";
import CarouselLibraryStudio from "@/components/CarouselLibraryStudio";

type TextSize = "small" | "medium" | "large";
type HermesCard = {
  card: number;
  headline?: string;
  body?: string;
  text?: string;
  cta?: string;
  photo_id?: string;
  slot?: string;
  slot_index?: number;
  score?: number;
  text_size?: string;
  image_url?: string;
  direct_image_url?: string;
  image_data_url?: string;
};

type HermesProject = {
  project_id: string;
  template: string;
  title?: string;
  caption?: string;
  cta?: string;
  expires_at?: string;
  cards: HermesCard[];
};

type CopyState = { headline: string; body: string; cta: string };
type ProjectState = {
  version: 1;
  projectId: string;
  status: "rascunho" | "salvo" | "aprovado";
  templateId: string;
  cardIndex: number;
  slotIndex: number;
  images: Record<string, string>;
  photoCfgs: Record<string, { x: number; y: number; zoom: number; fit: "cover" | "contain" }>;
  copies: Record<string, CopyState>;
  textSizes: Record<string, TextSize>;
  textMovesByCard: Record<string, { headline: { x: number; y: number }; body: { x: number; y: number }; cta: { x: number; y: number } }>;
  colorsByCard: Record<string, { bg: string; text: string }>;
  typeStyles: Record<string, "clean-serif" | "directional-poster" | "elegant-classic" | "squeeze-deco">;
  updatedAt: string;
};

function decodePayload(encoded: string): HermesProject {
  const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as HermesProject;
}

function slotIndex(slot?: string, explicit?: number) {
  if (Number.isInteger(explicit) && (explicit as number) >= 0) return explicit as number;
  const s = (slot || "").toLowerCase();
  if (/(_3|foto_3)$/.test(s)) return 2;
  if (/(_2|foto_2|secundaria|detalhe|depois)$/.test(s)) return 1;
  return 0;
}

function sizeOf(value?: string): TextSize {
  const v = (value || "").toLowerCase();
  if (v === "small" || v === "pequeno") return "small";
  if (v === "large" || v === "grande") return "large";
  return "medium";
}

function buildState(p: HermesProject): ProjectState {
  const images: ProjectState["images"] = {};
  const photoCfgs: ProjectState["photoCfgs"] = {};
  const copies: ProjectState["copies"] = {};
  const textSizes: ProjectState["textSizes"] = {};
  const template = p.template.toUpperCase();
  const sorted = [...p.cards].sort((a, b) => a.card - b.card);

  for (const c of sorted) {
    const cardIndex = Math.max(0, c.card - 1);
    const cKey = `${template}:${cardIndex}`;
    const idx = slotIndex(c.slot, c.slot_index);
    const pKey = `${template}:${cardIndex}:${idx}`;
    const image = c.image_url || c.direct_image_url || c.image_data_url;
    if (image) {
      images[pKey] = image;
      photoCfgs[pKey] = { x: 0, y: 0, zoom: 100, fit: "cover" };
    }
    copies[cKey] = {
      headline: c.headline || c.text || "",
      body: c.body || "",
      cta: c.cta || (c.card === sorted.length ? p.cta || "" : ""),
    };
    textSizes[cKey] = sizeOf(c.text_size);
  }

  return {
    version: 1,
    projectId: p.project_id,
    status: "salvo",
    templateId: template,
    cardIndex: 0,
    slotIndex: 0,
    images,
    photoCfgs,
    copies,
    textSizes,
    textMovesByCard: {},
    colorsByCard: {},
    typeStyles: {},
    updatedAt: new Date().toISOString(),
  };
}

export default function StudioEntry() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.startsWith("#hermes=")) {
      setReady(true);
      return;
    }

    try {
      const payload = decodePayload(hash.slice("#hermes=".length));
      if (!payload.project_id || !/^T(?:0[1-9]|1[0-2])$/.test(payload.template.toUpperCase()) || !Array.isArray(payload.cards)) {
        throw new Error("Pacote Hermes inválido.");
      }
      if (payload.expires_at && new Date(payload.expires_at).getTime() < Date.now()) {
        throw new Error("Este link temporário do Hermes expirou. Gere um novo link no Telegram.");
      }

      const key = `mago-project:${payload.project_id}`;
      if (!localStorage.getItem(key)) {
        const state = buildState(payload);
        localStorage.setItem(key, JSON.stringify(state));
        const ids = JSON.parse(localStorage.getItem("mago-project-index") || "[]") as string[];
        localStorage.setItem("mago-project-index", JSON.stringify([payload.project_id, ...ids.filter((id) => id !== payload.project_id)]));
        if (payload.caption) localStorage.setItem(`mago-project-caption:${payload.project_id}`, payload.caption);
      }

      const target = new URL(window.location.href);
      target.hash = "";
      target.searchParams.set("project", payload.project_id);
      window.location.replace(target.toString());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível importar o projeto do Hermes.");
    }
  }, []);

  if (error) {
    return <main style={{minHeight:"100vh",background:"#111",color:"white",display:"grid",placeItems:"center",padding:24,fontFamily:"Arial,sans-serif"}}><div style={{maxWidth:520,background:"#202020",padding:24,borderRadius:16}}><h1>Não foi possível abrir o projeto</h1><p>{error}</p><a href="/studio" style={{color:"#f0c4bb"}}>Abrir o Studio sem importar</a></div></main>;
  }

  if (!ready) return <main style={{minHeight:"100vh",background:"#111",color:"white",display:"grid",placeItems:"center",fontFamily:"Arial,sans-serif"}}>Importando projeto do Hermes…</main>;
  return <CarouselLibraryStudio />;
}
