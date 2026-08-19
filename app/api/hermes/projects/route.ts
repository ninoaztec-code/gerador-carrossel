import { NextRequest, NextResponse } from "next/server";
import { carouselPublicOrigin } from "@/lib/carouselPublicOrigin";
import { importExternalImage } from "@/lib/localCarouselImages";
import { createRemoteProject, putRemoteProject } from "@/lib/remoteCarouselProjects";

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
};

function authorized(req: NextRequest) {
  const secret = process.env.HERMES_API_KEY;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

function buildCommit() {
  return process.env.APP_GIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || null;
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
    if (!card.photo_id && !card.image_url && !card.direct_image_url && !card.image_data_url) warnings.push(`card_${card.card}_sem_foto`);
  }
  return { errors, warnings };
}

export async function GET(req: NextRequest) {
  const origin = carouselPublicOrigin(req);
  return NextResponse.json({
    ok: true,
    service: "hermes-studio-project-bridge",
    endpoint: "/api/hermes/projects",
    method: "POST",
    purpose: "Salva o projeto, importa imagens externas e devolve links do Studio e do render.",
    persistence: process.env.CAROUSEL_PROJECTS_DIR ? "local-volume" : "remote-api",
    image_persistence: process.env.CAROUSEL_IMAGES_DIR ? "local-volume" : "external-or-legacy",
    image_import_endpoint: `${origin}/api/hermes/images/import`,
    studio_origin: origin,
    studio_example: `${origin}/studio?project=PROJECT_ID`,
    render_endpoint: `${origin}/api/hermes/render-project?project_id=PROJECT_ID`,
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
    const sortedCards = [...project.cards].sort((a, b) => a.card - b.card);
    const cards: HermesCard[] = [];

    for (const card of sortedCards) {
      const next: HermesCard = { ...card };
      const externalImage = !next.photo_id ? String(next.image_url || next.direct_image_url || "").trim() : "";
      if (externalImage && /^https?:\/\//i.test(externalImage) && process.env.CAROUSEL_IMAGES_DIR) {
        try {
          const imported = await importExternalImage(externalImage);
          const localUrl = `${origin}/api/projects/images/${encodeURIComponent(imported.photo_id)}`;
          next.photo_id = imported.photo_id;
          next.image_url = localUrl;
          next.direct_image_url = undefined;
          importedPhotos.push({
            card: next.card,
            photo_id: imported.photo_id,
            image_url: localUrl,
            source_url: imported.source_url,
          });
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          warnings.push(`card_${next.card}_importacao_foto_falhou:${reason}`);
        }
      }
      cards.push(next);
    }

    const normalized: HermesProject = {
      ...project,
      template: project.template.toUpperCase(),
      cards,
    };

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
    const renderCards = normalized.cards.map((card) => ({
      card: card.card,
      html_url: `${renderProjectUrl}&card=${card.card}`,
      width: 1080,
      height: 1350,
    }));

    return NextResponse.json({
      ok: true,
      project_id: normalized.project_id,
      template: normalized.template,
      studio_url: studioUrl,
      review_url: studioUrl,
      render_html_url: renderProjectUrl,
      render_cards: renderCards,
      imported_photos: importedPhotos,
      warnings,
      persistence: process.env.CAROUSEL_PROJECTS_DIR ? "local-volume" : "remote-api",
      image_persistence: process.env.CAROUSEL_IMAGES_DIR ? "local-volume" : "external-or-legacy",
      status: "ready_for_review",
      build: { commit: buildCommit() },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error), build: { commit: buildCommit() } }, { status: 500 });
  }
}
