
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const dir = process.cwd();
console.log('\n🚀 Iniciando setup do Gerador de Carrossel com IA (Groq)');
console.log('📁 Pasta:', dir);

// ─────────────────────────────────────────────
// 1. Instalar html-to-image
// ─────────────────────────────────────────────
console.log('\n📦 Instalando html-to-image...');
try {
  execSync('npm install html-to-image', { stdio: 'inherit', cwd: dir });
  console.log('✅ html-to-image instalado!');
} catch(e) {
  console.log('⚠️  Erro ao instalar html-to-image:', e.message);
}

// ─────────────────────────────────────────────
// 2. Criar app/api/gerar/route.ts (Groq)
// ─────────────────────────────────────────────
console.log('\n📝 Criando rota API para Groq...');
const apiDir = join(dir, 'app', 'api', 'gerar');
if (!existsSync(apiDir)) mkdirSync(apiDir, { recursive: true });

const routeTs = `import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { tema, apiKey } = await req.json();
    if (!tema || !apiKey) {
      return NextResponse.json({ error: 'tema e apiKey são obrigatórios' }, { status: 400 });
    }

    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${apiKey}\`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: 'Você é especialista em conteúdo para Instagram. Sempre responda APENAS com JSON válido, sem markdown.',
          },
          {
            role: 'user',
            content: \`Crie um carrossel completo para Instagram sobre: "\${tema}". Responda APENAS com JSON (sem markdown): {"titulo":"título da capa","subtitulo":"subtítulo da capa","slides":[{"titulo":"título","conteudo":"conteúdo detalhado"}],"cta":"chamada para ação"} — crie 4 a 6 slides.\`,
          },
        ],
        temperature: 0.8,
        max_tokens: 2048,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.error?.message || 'Erro no Groq' }, { status: res.status });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const cleaned = text.replace(/\`\`\`json\\n?/g, '').replace(/\`\`\`\\n?/g, '').trim();

    try {
      return NextResponse.json({ result: JSON.parse(cleaned) });
    } catch {
      return NextResponse.json({ error: 'JSON inválido da IA', raw: text }, { status: 500 });
    }
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Erro' }, { status: 500 });
  }
}
`;

writeFileSync(join(apiDir, 'route.ts'), routeTs, 'utf-8');
console.log('✅ app/api/gerar/route.ts criado!');

// ─────────────────────────────────────────────
// 3. Fazer patch no app/page.tsx
// ─────────────────────────────────────────────
console.log('\n📝 Atualizando app/page.tsx...');
const pagePath = join(dir, 'app', 'page.tsx');
let page = readFileSync(pagePath, 'utf-8');

// 3a. Adicionar import de html-to-image se não existir
if (!page.includes('html-to-image')) {
  page = page.replace(
    /'use client'/,
    `'use client'\nimport * as htmlToImage from 'html-to-image';`
  );
  console.log('  ✅ Import html-to-image adicionado');
}

// 3b. Adicionar estado apiKey se não existir
if (!page.includes('apiKey') && !page.includes('api_key')) {
  // Adicionar após o useState do handle
  page = page.replace(
    /const \[handle, setHandle\] = useState/,
    `const [apiKey, setApiKey] = useState('')\n  const [handle, setHandle] = useState`
  );
  console.log('  ✅ Estado apiKey adicionado');
}

// 3c. Trocar html2canvas por html-to-image na exportarPNG
if (page.includes('html2canvas')) {
  // Substituir toda a função exportarPNG
  page = page.replace(
    /async function exportarPNG[^}]+(?:{[^}]*})*[^}]+}/s,
    `async function exportarPNG() {
    if (!slideRef.current) return;
    setExportando(true);
    try {
      const dataUrl = await htmlToImage.toPng(slideRef.current, { pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = 'slide.png';
      link.href = dataUrl;
      link.click();
    } catch(e) { console.error('Erro ao exportar:', e); }
    finally { setExportando(false); }
  }`
  );
  console.log('  ✅ exportarPNG atualizada para html-to-image');
}

// 3d. Passar apiKey no fetch para /api/gerar
if (!page.includes('apiKey') || !page.includes('/api/gerar')) {
  console.log('  ⚠️  Não foi possível atualizar o fetch automaticamente - faça manualmente');
} else {
  // Verificar se o fetch já inclui apiKey
  const fetchIdx = page.indexOf('fetch(\'/api/gerar\'') || page.indexOf('fetch("/api/gerar")');
  if (fetchIdx >= 0) {
    // Atualizar o body do fetch para incluir apiKey
    page = page.replace(
      /body:\s*JSON\.stringify\(\{\s*tema/,
      'body: JSON.stringify({ tema, apiKey'
    );
    console.log('  ✅ apiKey adicionada ao fetch');
  }
}

// 3e. Adicionar campo de apiKey na UI
if (!page.includes('Groq API Key') && !page.includes('placeholder.*gsk_') && !page.includes("placeholder='gsk_")) {
  // Adicionar input antes do botão de gerar
  page = page.replace(
    /<button[^>]*onClick=\{gerarComIA\}/,
    `<input
              type="password"
              placeholder="gsk_... (chave do Groq)"
              className="w-full border border-neutral-300 rounded-xl px-3 py-2 outline-none text-sm mb-2"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
            <button onClick={gerarComIA}`
  );
  console.log('  ✅ Campo de API key adicionado na UI');
}

writeFileSync(pagePath, page, 'utf-8');
console.log('✅ app/page.tsx atualizado!');

console.log('\n🎉 Setup concluído com sucesso!');
console.log('\n📋 Próximos passos:');
console.log('  1. Reinicie o servidor: Ctrl+C e depois npm run dev');
console.log('  2. Abra http://localhost:3005');
console.log('  3. Digite o tema, cole a chave do Groq (gsk_...) e clique em Gerar!');
