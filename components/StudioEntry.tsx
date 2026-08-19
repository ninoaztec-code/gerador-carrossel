"use client";

import { useEffect, useRef, useState } from "react";
import CarouselLibraryStudio from "@/components/CarouselLibraryStudio";

type TextSize = "small" | "medium" | "large";
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
  textMovesByCard: Record<string, unknown>;
  colorsByCard: Record<string, unknown>;
  typeStyles: Record<string, unknown>;
  updatedAt: string;
};

type RemoteCard = {
  card?: number;
  headline?: string;
  body?: string;
  text?: string;
  cta?: string;
  photo_id?: string;
  slot?: string;
  slot_index?: number;
  text_size?: string;
  image_url?: string;
  direct_image_url?: string;
  image_data_url?: string;
  file_path?: string;
  caminho_foto?: string;
  texto?: { headline?: string; body?: string; cta?: string };
};

type RemoteProject = {
  project_id: string;
  template: string;
  status?: string;
  caption?: string;
  legenda?: string;
  cta?: string;
  cta_final?: string;
  cards: RemoteCard[];
  editor_state?: ProjectState;
  [key: string]: unknown;
};

const LEGACY_IMAGE_ID_BY_BASENAME: Record<string, string> = {
  "img_c70b5991137b.jpg": "MAGO-VIS-0003",
  "img_aa847e8de7a9.jpg": "MAGO-VIS-0004",
  "img_d0f17a997055.jpg": "MAGO-VIS-0002",
};

function decodePayload(encoded: string): RemoteProject {
  const normalized = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes)) as RemoteProject;
}

function unwrapRemote(raw: unknown, projectId: string): RemoteProject {
  const root = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const nested = (root.project && typeof root.project === "object" ? root.project :
    root.data && typeof root.data === "object" ? root.data :
    root.payload && typeof root.payload === "object" ? root.payload : root) as Record<string, unknown>;
  const cards = Array.isArray(nested.cards) ? nested.cards as RemoteCard[] : [];
  const firstTemplate = cards.find((c) => typeof (c as Record<string, unknown>).template === "string") as (RemoteCard & { template?: string }) | undefined;
  const template = String(nested.template || firstTemplate?.template || "T01").toUpperCase();
  return {
    ...nested,
    project_id: String(nested.project_id || nested.projectId || projectId),
    template,
    cards,
  } as RemoteProject;
}

function slotIndex(card: RemoteCard) {
  if (Number.isInteger(card.slot_index) && (card.slot_index as number) >= 0) return card.slot_index as number;
  const slot = String(card.slot || "").toLowerCase();
  if (/(_3|foto_3)$/.test(slot)) return 2;
  if (/(_2|foto_2|secundaria|detalhe|depois)$/.test(slot)) return 1;
  return 0;
}

function sizeOf(value?: string): TextSize {
  const v = String(value || "medium").toLowerCase();
  if (v === "small" || v === "pequeno") return "small";
  if (v === "large" || v === "grande") return "large";
  return "medium";
}

function photoIdOf(card: RemoteCard) {
  if (card.photo_id) return String(card.photo_id);
  const source = String(card.image_url || card.direct_image_url || card.file_path || card.caminho_foto || "");
  const explicit = source.match(/MAGO-VIS-\d{4}/i)?.[0];
  if (explicit) return explicit.toUpperCase();
  const basename = source.split(/[\\/]/).pop() || "";
  return LEGACY_IMAGE_ID_BY_BASENAME[basename] || "";
}

function publicImageOf(card: RemoteCard) {
  const photoId = photoIdOf(card);
  if (photoId) return `/api/projects/images/${encodeURIComponent(photoId)}`;
  const source = String(card.image_url || card.direct_image_url || card.image_data_url || "");
  return /^(https?:|data:image)/i.test(source) ? source : "";
}

function editorStateIsUsable(project: RemoteProject) {
  const state = project.editor_state;
  if (!state || state.projectId !== project.project_id) return false;
  if (String(state.templateId || "").toUpperCase() !== project.template.toUpperCase()) return false;
  if (!project.cards.length) return true;
  const expectedImages = project.cards.filter((card) => Boolean(publicImageOf(card))).length;
  return Object.keys(state.copies || {}).length >= project.cards.length && Object.keys(state.images || {}).length >= expectedImages;
}

function buildState(project: RemoteProject): ProjectState {
  if (editorStateIsUsable(project)) return project.editor_state as ProjectState;

  const template = project.template.toUpperCase();
  const images: ProjectState["images"] = {};
  const photoCfgs: ProjectState["photoCfgs"] = {};
  const copies: ProjectState["copies"] = {};
  const textSizes: ProjectState["textSizes"] = {};
  const cards = [...project.cards].sort((a, b) => Number(a.card || 0) - Number(b.card || 0));

  cards.forEach((card, position) => {
    const index = Math.max(0, Number(card.card || position + 1) - 1);
    const cKey = `${template}:${index}`;
    const pKey = `${template}:${index}:${slotIndex(card)}`;
    copies[cKey] = {
      headline: card.headline || card.text || card.texto?.headline || "",
      body: card.body || card.texto?.body || "",
      cta: card.cta || card.texto?.cta || (position === cards.length - 1 ? String(project.cta || project.cta_final || "") : ""),
    };
    textSizes[cKey] = sizeOf(card.text_size);
    const image = publicImageOf(card);
    if (image) {
      images[pKey] = image;
      photoCfgs[pKey] = { x: 0, y: 0, zoom: 100, fit: "cover" };
    }
  });

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

function rememberProject(projectId: string) {
  const ids = JSON.parse(localStorage.getItem("mago-project-index") || "[]") as string[];
  localStorage.setItem("mago-project-index", JSON.stringify([projectId, ...ids.filter((id) => id !== projectId)]));
}

export default function StudioEntry() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const remoteRef = useRef<RemoteProject | null>(null);
  const lastRawRef = useRef<string | null>(null);

  useEffect(() => {
    let stopped = false;
    let timer = 0;

    const startSync = (projectId: string) => {
      const key = `mago-project:${projectId}`;
      timer = window.setInterval(async () => {
        const remote = remoteRef.current;
        if (!remote) return;
        const raw = localStorage.getItem(key);
        if (raw === lastRawRef.current) return;
        if (!raw) {
          if (lastRawRef.current) {
            lastRawRef.current = null;
            await fetch(`/api/projects/${encodeURIComponent(projectId)}`, { method: "DELETE" }).catch(() => undefined);
          }
          return;
        }
        lastRawRef.current = raw;
        try {
          const editorState = JSON.parse(raw) as ProjectState;
          const payload: RemoteProject = { ...remote, editor_state: editorState, status: editorState.status };
          const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (response.ok) remoteRef.current = payload;
        } catch { /* autosave local continua funcionando */ }
      }, 1400);
    };

    const boot = async () => {
      const hash = window.location.hash;
      if (hash.startsWith("#hermes=")) {
        try {
          const payload = decodePayload(hash.slice("#hermes=".length));
          if (!payload.project_id || !/^T(?:0[1-9]|1[0-2])$/.test(payload.template.toUpperCase()) || !Array.isArray(payload.cards)) {
            throw new Error("Pacote Hermes inválido.");
          }
          const state = buildState(payload);
          const key = `mago-project:${payload.project_id}`;
          localStorage.setItem(key, JSON.stringify(state));
          rememberProject(payload.project_id);
          if (payload.caption) localStorage.setItem(`mago-project-caption:${payload.project_id}`, payload.caption);
          const target = new URL(window.location.href);
          target.hash = "";
          target.searchParams.set("project", payload.project_id);
          window.history.replaceState({}, "", target.toString());
          lastRawRef.current = JSON.stringify(state);
          if (!stopped) setReady(true);
          return;
        } catch (e) {
          if (!stopped) setError(e instanceof Error ? e.message : "Não foi possível importar o projeto do Hermes.");
          return;
        }
      }

      const projectId = new URLSearchParams(window.location.search).get("project");
      if (!projectId) {
        if (!stopped) setReady(true);
        return;
      }

      const key = `mago-project:${projectId}`;
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, { cache: "no-store" });
        if (!response.ok) {
          const local = localStorage.getItem(key);
          if (local) {
            const parsed = JSON.parse(local) as ProjectState;
            if (parsed.templateId !== "T01" || Object.keys(parsed.copies || {}).length > 0) {
              lastRawRef.current = local;
              if (!stopped) setReady(true);
              return;
            }
          }
          throw new Error(`Projeto remoto indisponível (HTTP ${response.status}).`);
        }

        const rawRemote = await response.json();
        const remote = unwrapRemote(rawRemote, projectId);
        if (!/^T(?:0[1-9]|1[0-2])$/.test(remote.template) || !remote.cards.length) {
          throw new Error("A VPS respondeu, mas o projeto remoto não contém template/cards válidos.");
        }

        remoteRef.current = remote;
        const state = buildState(remote);
        const serialized = JSON.stringify(state);
        localStorage.setItem(key, serialized);
        rememberProject(projectId);
        const caption = String(remote.caption || remote.legenda || "");
        if (caption) localStorage.setItem(`mago-project-caption:${projectId}`, caption);
        lastRawRef.current = serialized;
        startSync(projectId);
        if (!stopped) setReady(true);
      } catch (e) {
        if (!stopped) setError(e instanceof Error ? e.message : "Não foi possível carregar o projeto da VPS.");
      }
    };

    void boot();
    return () => {
      stopped = true;
      if (timer) window.clearInterval(timer);
    };
  }, []);

  if (error) {
    return <main style={{minHeight:"100vh",background:"#111",color:"white",display:"grid",placeItems:"center",padding:24,fontFamily:"Arial,sans-serif"}}><div style={{maxWidth:560,background:"#202020",padding:24,borderRadius:16}}><h1>Não foi possível abrir o projeto</h1><p>{error}</p><p style={{opacity:.7,fontSize:13}}>Agora o Studio bloqueia a abertura vazia para não gravar T01 por cima do projeto do Hermes.</p><a href="/studio" style={{color:"#f0c4bb"}}>Abrir o Studio sem projeto</a></div></main>;
  }

  if (!ready) return <main style={{minHeight:"100vh",background:"#111",color:"white",display:"grid",placeItems:"center",fontFamily:"Arial,sans-serif"}}>Carregando projeto da VPS…</main>;
  return <CarouselLibraryStudio />;
}
