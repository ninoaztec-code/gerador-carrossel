import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { tema, apiKey } = await req.json();

    if (!tema || !apiKey) {
      return NextResponse.json(
        { error: "tema e apiKey são obrigatórios" },
        { status: 400 }
      );
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "Você é especialista em conteúdo para Instagram. Responda APENAS com JSON válido, sem markdown, sem explicações.",
          },
          {
            role: "user",
            content: `Crie um carrossel completo para Instagram sobre: "${tema}". Responda APENAS com este JSON:\n{"titulo":"título chamativo da capa","subtitulo":"subtítulo da capa","slides":[{"titulo":"título do slide","conteudo":"conteúdo detalhado e prático"}],"cta":"chamada para ação final","legenda":"legenda completa para Instagram com emojis e hashtags relevantes"}\n\nCrie 4 a 6 slides.`,
          },
        ],
        temperature: 0.8,
        max_tokens: 2048,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json(
        { error: err.error?.message || "Erro no Groq" },
        { status: res.status }
      );
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    const clean = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    try {
      return NextResponse.json({ result: JSON.parse(clean) });
    } catch {
      return NextResponse.json(
        { error: "JSON inválido da IA", raw: text },
        { status: 500 }
      );
    }
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}