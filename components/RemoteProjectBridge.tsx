"use client";

import { useEffect, useRef, useState } from "react";

type TextSize = "small" | "medium" | "large";
type EditorState = {
  version: 1;
  projectId: string;
  status: "rascunho" | "salvo" | "aprovado";
  templateId: string;
  cardIndex: number;
  slotIndex: number;
  images: Record<string, string>;
  photoCfgs: Record<string, { x: number; y: number; zoom: number; fit: "cover" | "contain" }>;
  copies: Record<string, { headline: string; body: string; cta: string }>;
  textSizes: Record<string, TextSize>;
  textMovesByCard: Record<string, unknown>;
  colorsByCard: Record<string, unknown>;
  typeStyles: Record<string, unknown>;
  updatedAt: string;
};

type RemoteCard = {
  card: number;
  headline?: string;
  text?: string;
  body?: string;
  cta?: string;
  photo_id?: string;
  slot?: string;
  slot_index?: number;
  text_size?: string;
};

type RemoteProject = {
  project_id: string;
  template: string;
  status?: string;
  cta?: string;
  caption?: string;
  cards?: RemoteCard[];
  editor_state?: EditorState;
};

function cardKey(template: string, cardIndex: number) { return `${template}:${cardIndex}`; }
function photoKey(template: string, cardIndex: number, slotIndex: number) { return `${template}:${cardIndex}:${slotIndex}`; }
function normalizeSize(value?: string): TextSize {
  const v = (value || "medium").toLowerCase();
  if (v === "small" || v === "pequeno") return "small";
  if (v === "large" || v === "grande") return "large";
  return "medium";
}
function slotIndex(slot?: string, explicit?: number) {
  if (Number.isInteger(explicit) && (explicit as number) >= 0) return explicit as number;
  const s = (slot || "").toLowerCase();
  if (/(_3|foto_3)$/.test(s)) return 2;
  if (/(_2|foto_2|secundaria|detalhe|depois)$/.test(s)) return 1;
  return 0;
}

function toEditorState(project: RemoteProject): EditorState {
  if (project.editor_state?.projectId === project.project_id) return project.editor_state;
  const template = (project.template || "T01").toUpperCase();
  const copies: EditorState["copies"] = {};
  const textSizes: EditorState["textSizes"] = {};
  const images: EditorState["images"] = {};
  const photoCfgs: EditorState["photoCfgs"] = {};
  const cards = [...(project.cards || [])].sort((a, b) => a.card - b.card);
  for (const c of cards) {
    const index = Math.max(0, Number(c.card || 1) - 1);
    const slot = slotIndex(c.slot, c.slot_index);
    const cKey = cardKey(template, index);
    const pKey = photoKey(template, index, slot);
    copies[cKey] = {
      headline: c.headline || c.text || "",
      body: c.body || "",
      cta: c.cta || (index === cards.length - 1 ? project.cta || "" : ""),
    };
    textSizes[cKey] = normalizeSize(c.text_size);
    if (c.photo_id) {
      images[pKey] = `/api/projects/images/${encodeURIComponent(c.photo_id)}`;
      photoCfgs[pKey] = { x: 0, y: 0, zoom: 100, fit: "cover" };
    }
  }
  return {
    version: 1,
    projectId: project.project_id,
    status: project.status === "aprovado" ? "aprovado" : "salvo",
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

export default function RemoteProjectBridge() {
  const [message, setMessage] = useState("");
  const remoteRef = useRef<RemoteProject | null>(null);
  const lastRawRef = useRef<string | null>(null);
  useEffect(() => {
    const projectId = new URLSearchParams(window.location.search).get("project");
    if (!projectId) return;
    const storageKey = `mago-project:${projectId}`;
    let cancelled = false;
    async function push(raw: string) {
      const remote = remoteRef.current;
      if (!remote) return;
      let editorState: EditorState;
      try { editorState = JSON.parse(raw) as EditorState; } catch { return; }
      const payload: RemoteProject = { ...remote, editor_state: editorState, status: editorState.status };
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (response.ok) remoteRef.current = payload;
      } catch {}
    }
    async function load() {
      setMessage("Carregando projeto do Hermes…");
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, { cache: "no-store" });
        if (!response.ok) {
          setMessage(response.status === 404 ? "Projeto ainda não encontrado na VPS." : "Não foi possível carregar o projeto remoto.");
          return;
        }
        const remote = await response.json() as RemoteProject;
        remoteRef.current = remote;
        const initial = JSON.stringify(toEditorState(remote));
        const localRaw = localStorage.getItem(storageKey);
        let shouldReplace = !localRaw;
        if (localRaw && !remote.editor_state) {
          try {
            const local = JSON.parse(localRaw) as EditorState;
            shouldReplace = local.templateId !== remote.template.toUpperCase() || Object.keys(local.images || {}).length === 0;
          } catch { shouldReplace = true; }
        }
        if (remote.editor_state) shouldReplace = true;
        if (shouldReplace) {
          localStorage.setItem(storageKey, initial);
          if (remote.caption) localStorage.setItem(`mago-project-caption:${projectId}`, remote.caption);
          lastRawRef.current = initial;
          if (!cancelled) window.location.reload();
          return;
        }
        lastRawRef.current = localRaw;
        setMessage("Projeto conectado à VPS ✓");
      } catch { setMessage("Projeto local disponível; sincronização com VPS indisponível."); }
    }
    void load();
    const timer = window.setInterval(() => {
      if (!remoteRef.current) return;
      const raw = localStorage.getItem(storageKey);
      if (raw && raw !== lastRawRef.current) {
        lastRawRef.current = raw;
        void push(raw);
      }
    }, 1200);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);
  if (!message) return null;
  return <div style={{maxWidth:1450,margin:"10px auto 0",padding:"8px 14px",borderRadius:10,background:"#1d1d1d",color:"#ddd",fontSize:12}}>{message}</div>;
}
