import { CarouselDocument } from "@/lib/carousel";

export type TemplateId = "mago-dark" | "mago-rose";

export type PhotoPlaceholder = {
  placeholder: string;
  x: number;
  y: number;
  width: number;
  height: number;
  format: "vertical" | "horizontal";
  crop: string;
  idealFraming: string;
};

// Direção de arte = ponto de partida editável no Studio, não uma trava.
export const PHOTO_PLACEHOLDERS: Record<string, PhotoPlaceholder> = {
  "mago-rose:0": {
    placeholder: "COLOQUE SUA FOTO AQUI",
    x: 8,
    y: 12,
    width: 42,
    height: 68,
    format: "vertical",
    crop: "cantos arredondados",
    idealFraming: "cabeça, cabelo e ombros"
  },
  "mago-rose:1": { placeholder: "COLOQUE SUA FOTO AQUI", x: 57, y: 8, width: 38, height: 84, format: "vertical", crop: "editorial", idealFraming: "meio corpo destacando o corte" },
  "mago-rose:2": { placeholder: "COLOQUE SUA FOTO AQUI", x: 8, y: 8, width: 84, height: 45, format: "horizontal", crop: "cantos levemente arredondados", idealFraming: "close mostrando rosto e cabelo" },
  "mago-rose:3": { placeholder: "COLOQUE SUA FOTO AQUI", x: 7, y: 18, width: 40, height: 64, format: "vertical", crop: "cantos arredondados", idealFraming: "retrato destacando camadas e movimento" },
  "mago-rose:4": { placeholder: "COLOQUE SUA FOTO AQUI", x: 55, y: 10, width: 40, height: 80, format: "vertical", crop: "canto inferior esquerdo arredondado", idealFraming: "retrato elegante olhando para a câmera" }
};

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
    name: "Template 2 · Editorial Vinho 45+",
    description: "Sistema editorial com áreas FOTO como base editável; upload substitui o placeholder sem redesenhar o card.",
    document: {
      id: "MAGO-ROSE-004",
      family: "mago-editorial-rose",
      title: "Cortes para mulheres 45+",
      slides: [
        { layout: "quote", eyebrow: "01 / 05", headline: "Um bom corte acompanha quem você é hoje.", body: "Movimento, moldura do rosto e manutenção possível fazem diferença.", cta: "Agende seu corte pelo WhatsApp." },
        { layout: "statement-portrait", eyebrow: "02 / 05", headline: "1. LONG BOB", body: "Um clássico que continua moderno." },
        { layout: "statement-portrait", eyebrow: "03 / 05", headline: "2. PIXIE ALONGADO", body: "Leveza, atitude e personalidade." },
        { layout: "mago-split", eyebrow: "04 / 05", headline: "3. BOB EM CAMADAS", body: "Movimento para transformar o visual." },
        { layout: "photo-cta", eyebrow: "05 / 05", headline: "5 CORTES PARA ARRASAR DEPOIS DOS 45", body: "Modernos, elegantes e cheios de personalidade.", cta: "Agende seu corte pelo WhatsApp." }
      ]
    }
  }
};

export function cloneTemplate(id: TemplateId): CarouselDocument {
  return JSON.parse(JSON.stringify(TEMPLATES[id].document)) as CarouselDocument;
}
