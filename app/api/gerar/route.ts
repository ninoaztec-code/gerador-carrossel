import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { tema, voz, handle } = await req.json();

    if (!tema || typeof tema !== "string") {
      return NextResponse.json(
        { error: "Tema é obrigatório." },
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

    const prompt = `Crie um carrossel para Instagram sobre: "${tema}". Tom: ${vozDesc[voz] || "educativo"}.
Retorne APENAS JSON válido:
{"slides":[
  {"type":"cover","tag":"TAG CURTA","title":"TÍTULO\\nDE IMPACTO","subtitle":"Subtítulo de 1-2 frases."},
  {"type":"content","label":"Dica 01","headline":"Título curto.","body":"2-3 frases explicativas."},
  {"type":"content","label":"Dica 02","headline":"Título curto.","body":"2-3 frases explicativas."},
  {"type":"content","label":"Dica 03","headline":"Título curto.","body":"2-3 frases explicativas."},
  {"type":"cta","tag":"Salve este conteúdo","title":"Frase de fechamento impactante.","action1":"Curta se gostou.","action2":"Comente sua opinião.","action3":"Compartilhe com alguém.","footer":"${handle || "@seuperfil"} · Carrossel"}
]}`;

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
        max_tokens: 1500,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Erro na Groq." },
        { status: res.status }
      );
    }

    const txt = data?.choices?.[0]?.message?.content || "";
    const match = txt.match(/\{[\s\S]*\}/);

    if (!match) {
      return NextResponse.json(
        { error: "A IA não retornou JSON válido." },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(match[0]);

    return NextResponse.json(parsed);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno." },
      { status: 500 }
    );
  }
}