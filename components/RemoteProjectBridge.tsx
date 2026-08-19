"use client";

import { useEffect } from "react";

const LEGACY_IMAGE_ID_BY_BASENAME: Record<string, string> = {
  "img_c70b5991137b.jpg": "MAGO-VIS-0003",
  "img_aa847e8de7a9.jpg": "MAGO-VIS-0004",
  "img_d0f17a997055.jpg": "MAGO-VIS-0002",
};

function slotIndex(card: any) {
  if (Number.isInteger(card?.slot_index) && card.slot_index >= 0) return card.slot_index;
  const slot = String(card?.slot || "").toLowerCase();
  if (/(_3|foto_3)$/.test(slot)) return 2;
  if (/(_2|foto_2|secundaria|detalhe|depois)$/.test(slot)) return 1;
  return 0;
}

function textSize(value: any) {
  const size = String(value || "medium").toLowerCase();
  if (size === "small" || size === "pequeno") return "small";
  if (size === "large" || size === "grande") return "large";
  return "medium";
}

function legacyPhotoId(card: any) {
  if (card?.photo_id) return String(card.photo_id);
  const source = String(card?.image_url || card?.direct_image_url || card?.file_path || "");
  const explicit = source.match(/MAGO-VIS-\d{4}/i)?.[0];
  if (explicit) return explicit.toUpperCase();
  const basename = source.split(/[\\/]/).pop() || "";
  return LEGACY_IMAGE_ID_BY_BASENAME[basename] || "";
}

function editorStateIsUsable(project: any) {
  const state = project?.editor_state;
  if (!state || state.projectId !== project?.project_id) return false;
  const template = String(project?.template || "T01").toUpperCase();
  if (String(state.templateId || "").toUpperCase() !== template) return false;

  const cards = Array.isArray(project?.cards) ? project.cards : [];
  if (!cards.length) return true;
  const copyCount = Object.keys(state.copies || {}).length;
  const expectedPhotos = cards.filter((card: any) => Boolean(legacyPhotoId(card))).length;
  const imageCount = Object.keys(state.images || {}).length;
  return copyCount >= Math.min(cards.length, 1) && imageCount >= expectedPhotos;
}

function buildState(project: any) {
  if (editorStateIsUsable(project)) return project.editor_state;

  const template = String(project?.template || "T01").toUpperCase();
  const images: Record<string, string> = {};
  const photoCfgs: Record<string, any> = {};
  const copies: Record<string, any> = {};
  const textSizes: Record<string, string> = {};
  const cards = Array.isArray(project?.cards) ? [...project.cards].sort((a: any, b: any) => Number(a.card) - Number(b.card)) : [];

  cards.forEach((card: any, position: number) => {
    const cardIndex = Math.max(0, Number(card.card || position + 1) - 1);
    const slot = slotIndex(card);
    const cKey = `${template}:${cardIndex}`;
    const pKey = `${template}:${cardIndex}:${slot}`;
    copies[cKey] = {
      headline: card.headline || card.text || card?.texto?.headline || "",
      body: card.body || card?.texto?.body || "",
      cta: card.cta || card?.texto?.cta || (position === cards.length - 1 ? project.cta || project.cta_final || "" : ""),
    };
    textSizes[cKey] = textSize(card.text_size || card.tamanho_texto);

    const photoId = legacyPhotoId(card);
    if (photoId) {
      images[pKey] = `/api/projects/images/${encodeURIComponent(photoId)}`;
      photoCfgs[pKey] = { x: 0, y: 0, zoom: 100, fit: "cover" };
    } else {
      const remoteImage = String(card.image_url || card.direct_image_url || card.image_data_url || "");
      if (/^(https?:|data:image)/i.test(remoteImage)) {
        images[pKey] = remoteImage;
        photoCfgs[pKey] = { x: 0, y: 0, zoom: 100, fit: "cover" };
      }
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

export default function RemoteProjectBridge() {
  useEffect(() => {
    const projectId = new URLSearchParams(window.location.search).get("project");
    if (!projectId) return;
    const key = `mago-project:${projectId}`;
    let stopped = false;
    let remote: any = null;
    let lastRaw = localStorage.getItem(key);

    const load = async () => {
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, { cache: "no-store" });
        if (!response.ok) return;
        remote = await response.json();
        const nextState = buildState(remote);
        const initial = JSON.stringify(nextState);
        let replace = !lastRaw || !editorStateIsUsable(remote);

        if (lastRaw) {
          try {
            const local = JSON.parse(lastRaw);
            const remoteTemplate = String(remote.template || "T01").toUpperCase();
            const expectedImages = Object.keys(nextState.images || {}).length;
            replace = replace || local.templateId !== remoteTemplate || Object.keys(local.copies || {}).length === 0 || Object.keys(local.images || {}).length < expectedImages;
          } catch {
            replace = true;
          }
        }

        if (replace) {
          localStorage.setItem(key, initial);
          if (remote?.caption || remote?.legenda) localStorage.setItem(`mago-project-caption:${projectId}`, String(remote.caption || remote.legenda));
          lastRaw = initial;
          if (!stopped) window.location.reload();
        }
      } catch {}
    };

    void load();
    const timer = window.setInterval(async () => {
      if (!remote) return;
      const raw = localStorage.getItem(key);
      if (!raw || raw === lastRaw) return;
      lastRaw = raw;
      try {
        const editorState = JSON.parse(raw);
        const payload = { ...remote, editor_state: editorState, status: editorState.status || remote.status };
        const response = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (response.ok) remote = payload;
      } catch {}
    }, 1200);

    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
