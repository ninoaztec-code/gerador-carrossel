"use client";

import { useEffect } from "react";

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

function buildState(project: any) {
  if (project?.editor_state?.projectId === project.project_id) return project.editor_state;
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
      headline: card.headline || card.text || "",
      body: card.body || "",
      cta: card.cta || (position === cards.length - 1 ? project.cta || "" : ""),
    };
    textSizes[cKey] = textSize(card.text_size);
    if (card.photo_id) {
      images[pKey] = `/api/projects/images/${encodeURIComponent(String(card.photo_id))}`;
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
        const initial = JSON.stringify(buildState(remote));
        let replace = !lastRaw || Boolean(remote?.editor_state);
        if (lastRaw && !remote?.editor_state) {
          try {
            const local = JSON.parse(lastRaw);
            replace = local.templateId !== String(remote.template || "T01").toUpperCase() || Object.keys(local.images || {}).length === 0;
          } catch {
            replace = true;
          }
        }
        if (replace) {
          localStorage.setItem(key, initial);
          if (remote?.caption) localStorage.setItem(`mago-project-caption:${projectId}`, String(remote.caption));
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
