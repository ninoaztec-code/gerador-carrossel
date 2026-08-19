import { NextRequest, NextResponse } from "next/server";
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
  return NextResponse.json({
    ok: true,
    service: "hermes-studio-project-bridge",
    endpoint: "/api/hermes/projects",
    method: "POST",
    purpose: "Salva o projeto na VPS e devolve links do Studio e do render.",
    studio_origin: req.nextUrl.origin,
    render_endpoint: `${req.nextUrl.origin}/api/hermes/render-project?project_id=PROJECT_ID`,
  });
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  try {
    const project = (await req.json()) as HermesProject;
    const { errors, warnings } = validate(project);
    if (errors.length) return NextResponse.json({ ok: false, errors, warnings }, { status: 422 });

    const normalized: HermesProject = {
      ...project,
      template: project.template.toUpperCase(),
      cards: [...project.cards].sort((a, b) => a.card - b.card),
    };

    let result = await createRemoteProject(normalized);
    if (result.status === 409) result = await putRemoteProject(normalized.project_id, normalized);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: "vps_project_save_failed", remote_status: result.status, remote: result.data }, { status: 502 });
    }

    const encodedId = encodeURIComponent(normalized.project_id);
    const studioUrl = `${req.nextUrl.origin}/studio?project=${encodedId}`;
    const renderHtmlUrl = `${req.nextUrl.origin}/api/hermes/render-project?project_id=${encodedId}`;
    const renderCards = normalized.cards.map((card) => ({
      card: card.card,
      html_url: `${renderHtmlUrl}&card=${card.card}`,
      width: 1080,
      height: 1350,
    }));

    return NextResponse.json({
      ok: true,
      project_id: normalized.project_id,
      template: normalized.template,
      studio_url: studioUrl,
      render_html_url: renderHtmlUrl,
      render_cards: renderCards,
      warnings,
      status: "ready_to_render",
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
