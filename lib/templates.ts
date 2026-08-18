import { CarouselDocument } from "@/lib/carousel";

export type TemplateId = "mago-dark" | "mago-rose";

export const TEMPLATES: Record<TemplateId, { name: string; description: string; document: CarouselDocument }> = {
  "mago-dark": {
    name: "Template 1 · Dark / Dourado",
    description: "Editorial preto e dourado, fotografia forte, alto contraste e assinatura MAGO DAS TESOURAS · 45+.",
    document: {
      id: "MAGO-DARK-001",
      family: "mago-editorial-premium",
      title: "Cortes que acompanham quem você é hoje",
      slides: [
        { layout: "mago-split", eyebrow: "01 / 05", headline: "Um bom corte acompanha quem você é hoje.", body: "Movimento, moldura do rosto e manutenção possível fazem diferença.", cta: "Agende seu corte pelo WhatsApp." },
        { layout: "statement-portrait", eyebrow: "02 / 05", headline: "O desenho certo muda a leitura do rosto.", body: "Sem apagar sua identidade e sem exigir uma rotina impossível." },
        { layout: "feature-list", eyebrow: "03 / 05", headline: "O que faz um corte funcionar?", items: ["Movimento", "Proporção", "Textura natural", "Manutenção real"] },
        { layout: "quote", eyebrow: "04 / 05", headline: "Elegância não tem idade. Tem intenção.", body: "O corte deve conversar com a mulher que você é hoje." },
        { layout: "mago-split", eyebrow: "05 / 05", headline: "Seu próximo corte começa com um bom diagnóstico.", body: "Escolha um desenho que valorize seu cabelo, seu rosto e sua rotina.", cta: "Agende seu corte pelo WhatsApp." }
      ]
    }
  },
  "mago-rose": {
    name: "Template 2 · Rose Editorial",
    description: "Bege, creme, rosé e vinho; sequência feminina premium com números grandes e continuidade visual.",
    document: {
      id: "MAGO-ROSE-001",
      family: "mago-editorial-rose",
      title: "5 cortes para arrasar depois dos 45",
      slides: [
        { layout: "hero-photo", eyebrow: "01 / 05", headline: "5 CORTES PARA ARRASAR DEPOIS DOS 45", body: "Modernos, elegantes e cheios de personalidade." },
        { layout: "statement-portrait", eyebrow: "02 / 05", headline: "1. LONG BOB", body: "Um clássico que continua moderno." },
        { layout: "statement-portrait", eyebrow: "03 / 05", headline: "2. PIXIE ALONGADO", body: "Leveza, atitude e personalidade." },
        { layout: "statement-portrait", eyebrow: "04 / 05", headline: "3. BOB EM CAMADAS", body: "Movimento para transformar o visual." },
        { layout: "photo-cta", eyebrow: "05 / 05", headline: "QUAL É A SUA ESCOLHA?", body: "Seu cabelo não tem idade. Ele tem personalidade.", cta: "Comente: 1, 2 ou 3" }
      ]
    }
  }
};

export function cloneTemplate(id: TemplateId): CarouselDocument {
  return JSON.parse(JSON.stringify(TEMPLATES[id].document)) as CarouselDocument;
}
