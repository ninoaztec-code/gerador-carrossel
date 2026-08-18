export type FamilyId = "editorial-premium" | "mago-editorial-premium" | "organic" | "educational" | "clean-white";
export type LayoutId = "hero-photo" | "mago-split" | "statement-portrait" | "feature-list" | "checklist" | "quote" | "photo-cta";

export type CarouselSlide = {
  layout: LayoutId;
  eyebrow?: string;
  headline: string;
  body?: string;
  items?: string[];
  cta?: string;
  image?: string;
};

export type CarouselDocument = {
  id?: string;
  family: FamilyId;
  title?: string;
  slides: CarouselSlide[];
};

export const FAMILIES = {
  "editorial-premium": { name: "Editorial Premium", bg: "#F7F3ED", ink: "#0F0F10", accent: "#C59A6B", support: "#8A6D54", serif: "Georgia, serif", sans: "Arial, sans-serif" },
  "mago-editorial-premium": { name: "Mago Editorial Premium", bg: "#0A0A0A", ink: "#F4F0E8", accent: "#D1A065", support: "#2A2018", serif: "Georgia, serif", sans: "Arial, sans-serif" },
  organic: { name: "Orgânico Terracota", bg: "#F7F0E8", ink: "#3B241C", accent: "#9A4F35", support: "#D4A06F", serif: "Georgia, serif", sans: "Arial, sans-serif" },
  educational: { name: "Minimal Educacional", bg: "#F4F6F5", ink: "#172124", accent: "#4C8A91", support: "#B8D5D8", serif: "Georgia, serif", sans: "Arial, sans-serif" },
  "clean-white": { name: "Clean White", bg: "#FFFFFF", ink: "#111111", accent: "#B98B5F", support: "#EEE9E3", serif: "Georgia, serif", sans: "Arial, sans-serif" },
} as const;

export const LIMITS: Record<LayoutId, { headline: number; body: number; items: number }> = {
  "hero-photo": { headline: 58, body: 120, items: 0 },
  "mago-split": { headline: 64, body: 140, items: 0 },
  "statement-portrait": { headline: 72, body: 180, items: 0 },
  "feature-list": { headline: 72, body: 120, items: 5 },
  checklist: { headline: 64, body: 100, items: 5 },
  quote: { headline: 100, body: 120, items: 0 },
  "photo-cta": { headline: 72, body: 150, items: 0 },
};

export function validateCarousel(doc: CarouselDocument) {
  const errors: string[] = [];
  if (!FAMILIES[doc.family]) errors.push("Família visual inválida.");
  if (!Array.isArray(doc.slides) || doc.slides.length < 3 || doc.slides.length > 10) errors.push("O carrossel deve ter entre 3 e 10 slides.");
  doc.slides?.forEach((slide, index) => {
    const limit = LIMITS[slide.layout];
    if (!limit) return errors.push(`Slide ${index + 1}: layout inválido.`);
    if (!slide.headline?.trim()) errors.push(`Slide ${index + 1}: headline obrigatório.`);
    if ((slide.headline?.length || 0) > limit.headline) errors.push(`Slide ${index + 1}: headline excede ${limit.headline} caracteres.`);
    if ((slide.body?.length || 0) > limit.body) errors.push(`Slide ${index + 1}: body excede ${limit.body} caracteres.`);
    if ((slide.items?.length || 0) > limit.items) errors.push(`Slide ${index + 1}: itens excedem o limite do layout.`);
  });
  return errors;
}

export const DEMO: CarouselDocument = {
  id: "MAGO-001",
  family: "mago-editorial-premium",
  title: "Um bom corte acompanha quem você é hoje.",
  slides: [
    { layout: "mago-split", eyebrow: "01 / 03", headline: "Um bom corte acompanha quem você é hoje.", body: "Movimento, moldura do rosto e manutenção possível fazem diferença.", cta: "Agende seu corte pelo WhatsApp." },
    { layout: "feature-list", eyebrow: "02 / 03", headline: "O que faz o corte funcionar?", items: ["Movimento sem excesso de peso", "Moldura que valoriza o rosto", "Manutenção possível na rotina", "Identidade preservada"] },
    { layout: "mago-split", eyebrow: "03 / 03", headline: "Mudar não é deixar de se reconhecer.", body: "É encontrar um desenho que acompanhe quem você é hoje.", cta: "Agende seu corte pelo WhatsApp." },
  ],
};
