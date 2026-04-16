import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { titulo, voz } = await req.json();

    if (!titulo || typeof titulo !== "string") {
      return NextResponse.json(
        { error: "Título é obrigatório." },
        { status: 400 }
      );
    }

    const groqKey = process.env.GROQ_API_KEY;

    if (!groqKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY não configurada no .env.local" },
        { status: 500 }
      );
    }

    const vozDesc: Record<string, string> = {
      educativo: "informativo e didático",
      descontraido: "leve e divertido",
      profissional: "formal e sério",
      vendas: "persuasivo e urgente",
    };

    const prompt = `Crie uma legenda para Instagram sobre "${titulo}". Tom: ${vozDesc[voz] || "educativo"}. Máximo 150 palavras. Inclua abertura forte, 2-3 parágrafos curtos, CTA claro e 10-15 hashtags. Retorne só o texto pronto para copiar.`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 600,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Erro na Groq." },
        { status: res.status }
      );
    }

    const legenda = data?.choices?.[0]?.message?.content || "";

    return NextResponse.json({ legenda });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno." },
      { status: 500 }
    );
  }
}