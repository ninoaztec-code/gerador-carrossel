import { NextRequest, NextResponse } from "next/server";
import { CarouselDocument, FamilyId, FAMILIES, LIMITS, validateCarousel } from "@/lib/carousel";

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export async function POST(req: NextRequest) {
  try {
    const { tema, family = "editorial-premium", slides = 6 } = await req.json();
    if (!tema || typeof tema !== "string") return NextResponse.json({ error: "Tema é obrigatório." }, { status: 400 });
    if (!FAMILIES[family as FamilyId]) return NextResponse.json({ error: "Família visual inválida." }, { status: 400 });
    const key = process.env.GEMINI_API_KEY;
    if (!key) return NextResponse.json({ error: "GEMINI_API_KEY não configurada." }, { status: 500 });

    const prompt = `Você é diretor de arte e editor de carrosséis do Instagram. Não desenhe imagens: devolva somente a direção estruturada em JSON.\nTema: ${tema}\nFamília: ${family}\nQuantidade: ${Math.min(10,Math.max(3,Number(slides)||6))}\nLayouts permitidos: hero-photo, statement-portrait, feature-list, checklist, quote, photo-cta.\nLimites rígidos por layout: ${JSON.stringify(LIMITS)}.\nVarie os layouts, use hero-photo na abertura e photo-cta no fechamento. Escreva em português brasileiro, claro, elegante, sem clichês.\nFormato EXATO: {"id":"CAROUSEL","family":"${family}","title":"...","slides":[{"layout":"hero-photo","eyebrow":"01 / 06","headline":"...","body":"...","items":[],"cta":""}]}`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents:[{parts:[{text:prompt}]}], generationConfig:{ temperature:.65, responseMimeType:"application/json" } })
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data?.error?.message || "Erro no Gemini." }, { status: res.status });
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return NextResponse.json({ error: "Gemini não retornou conteúdo." }, { status: 502 });
    const doc = JSON.parse(text) as CarouselDocument;
    doc.family = family as FamilyId;
    const errors = validateCarousel(doc);
    if (errors.length) return NextResponse.json({ error: "Gemini retornou conteúdo fora dos limites.", validation: errors }, { status: 422 });
    return NextResponse.json(doc);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno." }, { status: 500 });
  }
}
