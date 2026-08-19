"use client";

import { useState } from "react";
import CarouselLibraryStudioV2 from "@/components/CarouselLibraryStudioV2";

export default function CarouselLibraryStudio() {
  const [approving, setApproving] = useState(false);

  async function approveAndOpenRender() {
    const projectId = new URLSearchParams(window.location.search).get("project");
    if (!projectId) {
      alert("Salve ou abra um projeto antes de aprovar.");
      return;
    }

    const key = `mago-project:${projectId}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      alert("Projeto ainda não foi carregado no editor.");
      return;
    }

    const popup = window.open("about:blank", "_blank");
    setApproving(true);
    try {
      const state = JSON.parse(raw) as Record<string, unknown>;
      const approved = {
        ...state,
        status: "aprovado",
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(approved));

      // StudioEntryV2 sincroniza o localStorage com a VPS em ciclos curtos.
      await new Promise((resolve) => window.setTimeout(resolve, 1700));

      const renderUrl = `/api/hermes/render-project?project_id=${encodeURIComponent(projectId)}`;
      if (popup) popup.location.href = renderUrl;
      else window.location.href = renderUrl;
    } catch (error) {
      popup?.close();
      alert(`Não foi possível aprovar: ${String(error)}`);
    } finally {
      setApproving(false);
    }
  }

  return <>
    <CarouselLibraryStudioV2 />
    <button
      type="button"
      onClick={() => void approveAndOpenRender()}
      disabled={approving}
      style={{
        position: "fixed",
        right: 24,
        bottom: 24,
        zIndex: 1000,
        border: 0,
        borderRadius: 999,
        padding: "15px 22px",
        background: "#703C49",
        color: "#fff",
        fontWeight: 900,
        boxShadow: "0 12px 30px rgba(0,0,0,.35)",
        cursor: approving ? "wait" : "pointer",
      }}
    >
      {approving ? "Aprovando…" : "✅ Aprovar e abrir render"}
    </button>
  </>;
}
