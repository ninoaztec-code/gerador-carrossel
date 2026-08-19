import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

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
  expires_at?: string;
  cards: HermesCard[];
};

function authorized(req: NextRequest) {
  const secret = process.env.HERMES_API_KEY;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

function base64url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
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
    const usableImage = card.image_url || card.direct_image_url || card.image_data_url;
    if (!usableImage && card.file_path) warnings.push(`card_${card.card}_file_path_local_nao_acessivel_pelo_studio`);
    if (!usableImage && card.photo_id) warnings.push(`card_${card.card}_${card.photo_id}_sem_image_url`);
  }
  return { errors, warnings };
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    ok: true,
    service: "hermes-studio-project-bridge",
    endpoint: "/api/hermes/projects",
    method: "POST",
    authorization: "Bearer HERMES_API_KEY (quando configurada)",
    purpose: "Recebe o pacote do Hermes e devolve um link temporário que importa o projeto no Studio.",
    required: {
      project_id: "string",
      template: "T01..T12",
      cards: "array",
    },
    recommended_card_fields: ["card", "headline ou text", "body", "cta", "photo_id", "slot", "slot_index", "score", "text_size", "image_url ou direct_image_url"],
    note: "Caminhos locais /root/... não podem ser abertos pelo navegador. Para preencher a foto automaticamente, envie image_url/direct_image_url publicamente acessível ou image_data_url pequeno.",
    studio_origin: req.nextUrl.origin,
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
      expires_at: project.expires_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      cards: [...project.cards].sort((a, b) => a.card - b.card),
    };
    const encoded = base64url(JSON.stringify(normalized));
    const studioUrl = `${req.nextUrl.origin}/studio?project=${encodeURIComponent(normalized.project_id)}#hermes=${encoded}`;

    return NextResponse.json({
      ok: true,
      project_id: normalized.project_id,
      template: normalized.template,
      expires_at: normalized.expires_at,
      studio_url: studioUrl,
      warnings,
      status: "ready_to_edit",
    });
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
}
