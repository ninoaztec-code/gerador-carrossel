import { NextRequest, NextResponse } from "next/server";
import { carouselPublicOrigin } from "@/lib/carouselPublicOrigin";
import { importExternalImage } from "@/lib/localCarouselImages";
import { createRemoteProject, getRemoteImage, putRemoteProject } from "@/lib/remoteCarouselProjects";
import { INSTAGRAM_45PLUS_LIBRARY } from "@/lib/instagramTemplateLibrary";
import { cardKey, photoKey } from "@/lib/carouselProjectState";
import type { ProjectState, TextSize } from "@/lib/carouselProjectState";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  file_path?: string;
};

type HermesProject = {
  project_id: string;
  template: string;
  title?: string;
  caption?: string;
  cta?: string;
  cards: HermesCard[];
  editor_state?: ProjectState;
};

type ImageDiagnostic = {
  card: number;
  had_photo_id: boolean;
  source_field: "image_url" | "direct_image_url" | "image_data_url" | "none";
  source_url?: string;
  action: "imported" | "kept_photo_id" | "kept_local_url" | "kept_data_url" | "no_image" | "import_failed" | "images_dir_missing" | "photo_id_unavailable";
  photo_id?: string;
  error?: string;
};

function authorized(req: NextRequest) {
  const secret = process.env.HERMES_API_KEY;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

function buildCommit() {
  return process.env.APP_GIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || null;
}

function validImageDataUrl(value?: string) {
  const raw = String(value || "").trim();
  return /^data:image\/(?:jpeg|jpg|png|webp|gif|avif);base64,[a-z0-9+/=\s]+$/i.test(raw) ? raw : "";
}

function validate(project: HermesProject) {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!project || typeof project !== "object") return { errors: ["payload_invalido"], warnings };
  if (!project.project_id?.trim()) errors.push("project_id_obrigatorio");
  if (!/^T(?:0[1-9]|1[0-2])$/i.test(project.template || "")) errors.push("template_deve_ser_T01_a_T12");
  if (!Array.isArray(project.cards) || project.cards.length < 1 || project.cards.length > 10) errors.push("cards_deve_conter_1_a_10_itens");
  const seen = new Set<number>();
  for (const card of project.cards || []) {
    if (!Number.isInteger(card.card) || card.card < 1 || card.card > 10) errors.push(`card_invalido:${card.card}`);
    if (seen.has(card.card)) errors.push(`card_duplicado:${card.card}`);
    seen.add(card.card);
    if (!card.headline && !card.text && !card.body) warnings.push(`card_${card.card}_sem_texto`);
    if (card.image_data_url && !validImageDataUrl(card.image_data_url)) warnings.push(`card_${card.card}_image_data_url_invalida`);
  }
  return { errors, warnings };
}

function pickExternalImage(card: HermesCard) {
  const imageUrl = String(card.image_url || "").trim();
  if (/^https?:\/\//i.test(imageUrl)) return { field: "image_url" as const, url: imageUrl };
  const directImageUrl = String(card.direct_image_url || "").trim();
  if (/^https?:\/\//i.test(directImageUrl)) return { field: "direct_image_url" as const, url: directImageUrl };
  return null;
}

function isLocalImageUrl(url: string, origin: string) {
  try {
    const parsed = new URL(url);
    const local = new URL(origin);
    return parsed.origin === local.origin && parsed.pathname.startsWith("/api/projects/images/");
  } catch {
    return false;
  }
}

async function photoIdExists(photoId: string) {
  try {
    const response = await getRemoteImage(photoId);
    return response.ok && String(response.headers.get("content-type") || "").toLowerCase().startsWith("image/");
  } catch {
    return false;
  }
}

function imageSource(card: HermesCard) {
  const embedded = validImageDataUrl(card.image_data_url);
  if (embedded) return embedded;
  if (card.photo_id) return `/api/projects/images/${encodeURIComponent(String(card.photo_id).toUpperCase())}`;
  const remote = String(card.image_url || card.direct_image_url || "").trim();
  return /^(https?:|data:image)/i.test(remote) ? remote : "";
}

function explicitTextSize(value?: string): TextSize | null {
  const raw = String(value || "").toLowerCase();
  if (raw === "small" || raw === "pequeno") return "small";
  if (raw === "large" || raw === "grande") return "large";
  if (raw === "medium" || raw === "medio" || raw === "médio") return "medium";
  return null;
}

function smartTextSize(card: HermesCard, role?: string): TextSize {
  const explicit = explicitTextSize(card.text_size);
  if (explicit) return explicit;
  const headline = String(card.headline || card.text || "").trim();
  const body = String(card.body || "").trim();
  if (headline.length > 72 || body.length > 210) return "small";
  if (role === "cover" && headline.length <= 52 && body.length <= 130) return "large";
  return "medium";
}

function buildVisualEditorState(project: HermesProject): ProjectState | undefined {
  const templateId = project.template.toUpperCase();
  const template = INSTAGRAM_45PLUS_LIBRARY.find((item) => item.id === templateId);
  if (!template) return undefined;

  const cards = [...project.cards].sort((a, b) => a.card - b.card);
  const sourceByCard = new Map<number, string>();
  cards.forEach((card) => {
    const source = imageSource(card);
    if (source) sourceByCard.set(card.card, source);
  });
  const imagePool = cards.map((card) => sourceByCard.get(card.card) || "").filter(Boolean);

  const images: ProjectState["images"] = {};
  const photoCfgs: ProjectState["photoCfgs"] = {};
  const copies: ProjectState["copies"] = {};
  const textSizes: ProjectState["textSizes"] = {};
  const typeStyles: ProjectState["typeStyles"] = {};

  template.cards.forEach((layoutCard, index) => {
    const sourceCard = cards.find((card) => card.card === index + 1) || cards[index];
    if (!sourceCard) return;
    const cKey = cardKey(templateId, index);
    let headline = String(sourceCard.headline || sourceCard.text || "").trim();
    const body = String(sourceCard.body || "").trim();
    const cta = String(sourceCard.cta || (index === template.cards.length - 1 ? project.cta || "" : "")).trim();

    if (layoutCard.number && headline && !/^\s*\d{1,2}\b/.test(headline)) headline = `${layoutCard.number} · ${headline}`;
    if (layoutCard.labels?.length && layoutCard.role === "cover" && headline && !/antes/i.test(headline)) {
      headline = `${layoutCard.labels.join(" × ")}\n${headline}`;
    }

    copies[cKey] = { headline, body, cta };
    textSizes[cKey] = smartTextSize(sourceCard, layoutCard.role);
    typeStyles[cKey] = template.profile.preferredType;

    const ownImage = sourceByCard.get(sourceCard.card) || imagePool[index % Math.max(1, imagePool.length)] || "";
    layoutCard.photos.forEach((_, slot) => {
      if (!imagePool.length && !ownImage) return;
      const source = slot === 0
        ? ownImage
        : imagePool[(index + slot) % imagePool.length] || ownImage;
      if (!source) return;
      const pKey = photoKey(templateId, index, slot);
      images[pKey] = source;
      photoCfgs[pKey] = { x: 0, y: 0, zoom: 100, fit: "cover" };
    });
  });

  return {
    version: 1,
    projectId: project.project_id,
    status: "salvo",
    templateId,
    cardIndex: 0,
    slotIndex: 0,
    images,
    photoCfgs,
    copies,
    textSizes,
    textMovesByCard: {},
    colorsByCard: {},
    typeStyles,
    pendingPhotos: [],
    updatedAt: new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const origin = carouselPublicOrigin(req);
  return NextResponse.json({
    ok: true,
    service: "hermes-studio-project-bridge",
    endpoint: "/api/hermes/projects",
    method: "POST",
    purpose: "Salva o projeto, monta o estado visual completo, aceita imagens embutidas, importa imagens externas e devolve links do Studio e do render.",
    persistence: process.env.CAROUSEL_PROJECTS_DIR ? "local-volume" : "remote-api",
    image_persistence: process.env.CAROUSEL_IMAGES_DIR ? "local-volume" : "external-or-legacy",
    image_import_endpoint: `${origin}/api/hermes/images/import`,
    studio_origin: origin,
    studio_example: `${origin}/studio?project=PROJECT_ID`,
    render_endpoint: `${origin}/api/hermes/render-project?project_id=PROJECT_ID`,
    embedded_image_field: "image_data_url",
    visual_autofill: true,
    build: { commit: buildCommit() },
  });
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const project = (await req.json()) as HermesProject;
    const validation = validate(project);
    if (validation.errors.length) return NextResponse.json({ ok: false, errors: validation.errors, warnings: validation.warnings }, { status: 422 });

    const origin = carouselPublicOrigin(req);
    const warnings = [...validation.warnings];
    const importedPhotos: Array<{ card: number; photo_id: string; image_url: string; source_url: string }> = [];
    const diagnostics: ImageDiagnostic[] = [];
    const sortedCards = [...project.cards].sort((a, b) => a.card - b.card);
    const cards: HermesCard[] = [];

    for (const card of sortedCards) {
      const next: HermesCard = { ...card };
      const embeddedImage = validImageDataUrl(next.image_data_url);
      const candidate = pickExternalImage(next);
      const hadPhotoId = Boolean(next.photo_id);

      if (embeddedImage) {
        next.image_data_url = embeddedImage;
        next.photo_id = undefined;
        next.image_url = undefined;
        next.direct_image_url = undefined;
        diagnostics.push({ card: next.card, had_photo_id: hadPhotoId, source_field: "image_data_url", action: "kept_data_url" });
      } else if (candidate && isLocalImageUrl(candidate.url, origin)) {
        const localPhotoId = next.photo_id || decodeURIComponent(candidate.url.split("/").pop() || "");
        if (localPhotoId && await photoIdExists(localPhotoId)) {
          next.photo_id = localPhotoId;
          diagnostics.push({ card: next.card, had_photo_id: hadPhotoId, source_field: candidate.field, source_url: candidate.url, action: "kept_local_url", photo_id: localPhotoId });
        } else {
          warnings.push(`card_${next.card}_photo_id_indisponivel:${localPhotoId || "unknown"}`);
          next.photo_id = undefined;
          next.image_url = undefined;
          next.direct_image_url = undefined;
          diagnostics.push({ card: next.card, had_photo_id: hadPhotoId, source_field: candidate.field, source_url: candidate.url, action: "photo_id_unavailable", photo_id: localPhotoId || undefined });
        }
      } else if (candidate && process.env.CAROUSEL_IMAGES_DIR) {
        try {
          const imported = await importExternalImage(candidate.url);
          const localUrl = `${origin}/api/projects/images/${encodeURIComponent(imported.photo_id)}`;
          next.photo_id = imported.photo_id;
          next.image_url = localUrl;
          next.direct_image_url = undefined;
          importedPhotos.push({ card: next.card, photo_id: imported.photo_id, image_url: localUrl, source_url: imported.source_url });
          diagnostics.push({ card: next.card, had_photo_id: hadPhotoId, source_field: candidate.field, source_url: candidate.url, action: "imported", photo_id: imported.photo_id });
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          warnings.push(`card_${next.card}_importacao_foto_falhou:${reason}`);
          diagnostics.push({ card: next.card, had_photo_id: hadPhotoId, source_field: candidate.field, source_url: candidate.url, action: "import_failed", photo_id: next.photo_id, error: reason });
        }
      } else if (candidate) {
        warnings.push(`card_${next.card}_importacao_foto_falhou:CAROUSEL_IMAGES_DIR_missing`);
        diagnostics.push({ card: next.card, had_photo_id: hadPhotoId, source_field: candidate.field, source_url: candidate.url, action: "images_dir_missing", photo_id: next.photo_id });
      } else if (next.photo_id) {
        const existingPhotoId = next.photo_id;
        if (await photoIdExists(existingPhotoId)) {
          diagnostics.push({ card: next.card, had_photo_id: true, source_field: "none", action: "kept_photo_id", photo_id: existingPhotoId });
        } else {
          warnings.push(`card_${next.card}_photo_id_indisponivel:${existingPhotoId}`);
          next.photo_id = undefined;
          diagnostics.push({ card: next.card, had_photo_id: true, source_field: "none", action: "photo_id_unavailable", photo_id: existingPhotoId });
        }
      } else {
        warnings.push(`card_${next.card}_sem_foto`);
        diagnostics.push({ card: next.card, had_photo_id: false, source_field: "none", action: "no_image" });
      }

      cards.push(next);
    }

    const normalized: HermesProject = {
      ...project,
      template: project.template.toUpperCase(),
      cards,
    };
    normalized.editor_state = buildVisualEditorState(normalized);

    let result = await createRemoteProject(normalized);
    if (result.status === 409) result = await putRemoteProject(normalized.project_id, normalized);
    if (!result.ok) {
      return NextResponse.json({
        ok: false,
        error: "project_save_failed",
        persistence: process.env.CAROUSEL_PROJECTS_DIR ? "local-volume" : "remote-api",
        remote_status: result.status,
        remote: result.data,
        build: { commit: buildCommit() },
      }, { status: 502 });
    }

    const encodedId = encodeURIComponent(normalized.project_id);
    const studioUrl = `${origin}/studio?project=${encodedId}`;
    const renderProjectUrl = `${origin}/api/hermes/render-project?project_id=${encodedId}`;
    const renderCards = normalized.cards.map((card) => ({ card: card.card, html_url: `${renderProjectUrl}&card=${card.card}`, width: 1080, height: 1350 }));

    const linkedPhotos = normalized.cards.filter((card) => Boolean(validImageDataUrl(card.image_data_url) || card.photo_id || card.image_url || card.direct_image_url)).length;
    const visualSlotsFilled = Object.keys(normalized.editor_state?.images || {}).length;
    const visualSlotsTotal = INSTAGRAM_45PLUS_LIBRARY.find((item) => item.id === normalized.template)?.cards.reduce((sum, card) => sum + card.photos.length, 0) || 0;
    const needsImages = warnings.some((warning) => /_sem_foto$|_photo_id_indisponivel:|_importacao_foto_falhou:|_image_data_url_invalida$/.test(warning));

    return NextResponse.json({
      ok: true,
      project_id: normalized.project_id,
      template: normalized.template,
      studio_url: studioUrl,
      review_url: studioUrl,
      render_html_url: renderProjectUrl,
      render_cards: renderCards,
      imported_photos: importedPhotos,
      imported_photos_count: importedPhotos.length,
      linked_photos_count: linkedPhotos,
      embedded_photos_count: normalized.cards.filter((card) => Boolean(validImageDataUrl(card.image_data_url))).length,
      visual_slots_filled: visualSlotsFilled,
      visual_slots_total: visualSlotsTotal,
      visual_autofill: visualSlotsFilled === visualSlotsTotal && visualSlotsTotal > 0,
      image_diagnostics: diagnostics,
      warnings,
      persistence: process.env.CAROUSEL_PROJECTS_DIR ? "local-volume" : "remote-api",
      image_persistence: process.env.CAROUSEL_IMAGES_DIR ? "local-volume" : "external-or-legacy",
      status: needsImages ? "needs_images" : "ready_for_review",
      build: { commit: buildCommit() },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error), build: { commit: buildCommit() } }, { status: 500 });
  }
}
