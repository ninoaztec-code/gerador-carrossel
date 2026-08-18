"use client";

import { useEffect, useRef, useState } from "react";

type RemoteCard = {
  card: number;
  headline?: string;
  text?: string;
  body?: string;
  cta?: string;
  photo_id?: string;
  slot_index?: number;
  text_size?: string;
};

type RemoteProject = {
  project_id: string;
  template: string;
  status?: string;
  cards?: RemoteCard[];
  editor_state?: Record<string, unknown>;
  [key: string]: unknown;
};

function cardKey(template: string, cardIndex: number) { return `${template}:${cardIndex}`; }
function photoKey(template: string, cardIndex: number, slotIndex: number) { return `${template}:${cardIndex}:${slotIndex}`; }
function normalizeSize(value?: string) {
  const v = (value || "medium").toLowerCase();
  if (["small", "pequeno"].includes(v)) return "small";
  if (["large", "grande"].includes(v)) return "large";
  return "medium";
}

function toEditorState(project: RemoteProject) {
  if (project.editor_state && typeof project.editor_state === "object") return project.editor_state;
  const template = (project.template || "T01").toUpperCase();
  const copies: Record<string, unknown> = {};
  const textSizes: Record<string, string> = {};
  const images: Record<string, string> = {};
  for (const c of project.cards || []) {
    const index = Math.max(0, Number(c.card || 1) - 1);
    const slot = Math.max(0, Number(c.slot_index ?? 0));
    copies[cardKey(template, index)] = {
      headline: c.headline || c.text || "",
      body: c.body || "",
      cta: c.cta || "",
    };
    textSizes[cardKey(template, index)] = normalizeSize(c.text_size);
    if (c.photo_id) images[photoKey(template, index, slot)] = `/api/projects/images/${encodeURIComponent(c.photo_id)}`;
  }
  return {
    version: 1,
    projectId: project.project_id,
    status: project.status === "aprovado" ? "aprovado" : "salvo",
    templateId: template,
    cardIndex: 0,
    slotIndex: 0,
    images,
    photoCfgs: {},
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
    const params = new URLSearchParams(window.location.search);
    const projectId = params.get("project");
    if (!projectId) return;
    const storageKey = `mago-project:${projectId}`;
    let cancelled = false;

    async function push(raw: string) {
      const remote = remoteRef.current;
      if (!remote) return;
      let editorState: Record<string, unknown>;
      try { editorState = JSON.parse(raw) as Record<string, unknown>; } catch { return; }
      const editorStatus = typeof editorState.status === "string" ? editorState.status : remote.status;
      const payload: RemoteProject = { ...remote, editor_state: editorState, status: editorStatus };
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (response.ok) remoteRef.current = payload;
      } catch { /* o autosave local continua válido */ }
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
        const local = localStorage.getItem(storageKey);
        if (!local) {
          const initial = JSON.stringify(toEditorState(remote));
          localStorage.setItem(storageKey, initial);
          lastRawRef.current = initial;
          if (!cancelled) window.location.reload();
          return;
        }
        lastRawRef.current = local;
        setMessage("Projeto conectado à VPS ✓");
      } catch {
        setMessage("Projeto local disponível; sincronização com VPS indisponível.");
      }
    }

    load();
    const timer = window.setInterval(() => {
      if (!remoteRef.current) return;
      const raw = localStorage.getItem(storageKey);
      if (raw === null) {
        if (lastRawRef.current !== null) {
          lastRawRef.current = null;
          fetch(`/api/projects/${encodeURIComponent(projectId)}`, { method: "DELETE" }).catch(() => undefined);
        }
        return;
      }
      if (raw !== lastRawRef.current) {
        lastRawRef.current = raw;
        push(raw);
      }
    }, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  if (!message) return null;
  return <div style={{maxWidth:1450,margin:"10px auto 0",padding:"8px 14px",borderRadius:10,background:"#1d1d1d",color:"#ddd",fontSize:12}}>{message}</div>;
}
