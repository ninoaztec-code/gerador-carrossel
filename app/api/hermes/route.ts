import { NextRequest, NextResponse } from "next/server";
import { CarouselDocument, validateCarousel } from "@/lib/carousel";
import { carouselPublicOrigin } from "@/lib/carouselPublicOrigin";
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

type HermesCarouselDocument = {
  project_id: string;
  template: string;
  title?: string;
  caption?: string;
  cta?: string;
  cards: HermesCard[];
};

function authorized(req: NextRequest) {
  const secret = process.env.HERMES_API_KEY;
  if (!secret) return true; // Preview/test mode until the secret is configured.
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

function renderHtmlUrl(req: NextRequest) {
  return `${carouselPublicOrigin(req)}/api/hermes/render-html`;
}

function buildCommit() {
  return process.env.APP_GIT_SHA || process.env.VERCEL_GIT_COMMIT_SHA || null;
}

function isHermesCarouselDocument(value: unknown): value is HermesCarouselDocument {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<HermesCarouselDocument>;
  return typeof candidate.project_id === "string" || typeof candidate.template === "string" || Array.isArray(candidate.cards);
}

function validateHermesDocument(project: HermesCarouselDocument) {
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

async function acceptHermesProject(req: NextRequest, project: HermesCarouselDocument) {
  const { errors, warnings } = validateHermesDocument(project);
  if (errors.length) return NextResponse.json({ ok: false, errors, warnings, contract: "hermes-t01-t12" }, { status: 422 });

  const normalized: HermesCarouselDocument = {
    ...project,
    template: project.template.toUpperCase(),
    cards: [...project.cards].sort((a, b) => a.card - b.card),
  };

  let result = await createRemoteProject(normalized);
  if (result.status === 409) result = await putRemoteProject(normalized.project_id, normalized);
  if (!result.ok) {
    return NextResponse.json({
      ok: false,
      error: "vps_project_save_failed",
      remote_status: result.status,
      remote: result.data,
      build: { commit: buildCommit() },
    }, { status: 502 });
  }

  const origin = carouselPublicOrigin(req);
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
    contract: "hermes-t01-t12",
    project_id: normalized.project_id,
    template: normalized.template,
    studio_url: studioUrl,
    review_url: studioUrl,
    render_html_url: renderProjectUrl,
    render_cards: renderCards,
    warnings,
    status: "ready_for_review",
    build: { commit: buildCommit() },
  });
}

export async function GET(req: NextRequest) {
  const origin = carouselPublicOrigin(req);
  return NextResponse.json({
    ok: true,
    service: "gerador-carrossel",
    endpoint: "/api/hermes",
    recommended_contract: {
      name: "hermes-t01-t12",
      description: "Hermes escolhe template T01-T12, conteúdo e referências de foto; o motor visual decide a composição.",
      required: ["project_id", "template", "cards"],
      templates: "T01-T12",
      cards: "1-10",
      method: "POST",
      render: `${origin}/api/hermes/render-project?project_id=PROJECT_ID`,
      studio: `${origin}/studio?project=PROJECT_ID`,
    },
    legacy_contract: {
      name: "CarouselDocument",
      accepted: true,
      render: {
        html: renderHtmlUrl(req),
        method: "POST",
        contentType: "application/json",
      },
    },
    authorization: "Bearer HERMES_API_KEY (quando configurada)",
    build: { commit: buildCommit() },
  });
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  try {
    const payload = await req.json() as unknown;

    if (isHermesCarouselDocument(payload)) {
      return acceptHermesProject(req, payload);
    }

    const doc = payload as CarouselDocument;
    const errors = validateCarousel(doc);
    if (errors.length) return NextResponse.json({ ok: false, errors, contract: "legacy-carousel-document" }, { status: 422 });

    const origin = carouselPublicOrigin(req);
    return NextResponse.json({
      ok: true,
      contract: "legacy-carousel-document",
      document: doc,
      studio: `${origin}/studio`,
      render: {
        html: renderHtmlUrl(req),
        method: "POST",
        width: 1080,
        height: 1350,
        input: "document",
        status: "ready",
      },
      build: { commit: buildCommit() },
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "invalid_json" }, { status: 400 });
  }
}
