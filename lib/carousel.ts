export type FamilyId = "editorial-premium" | "organic" | "educational" | "clean-white";
export type LayoutId = "hero-photo" | "statement-portrait" | "feature-list" | "checklist" | "quote" | "photo-cta";

export type PhotoBindingValue =
  | string
  | {
      slot?: string;
      url?: string;
      src?: string;
      image?: string;
      path?: string;
      photo_id?: string;
      arquivo?: string;
    };

export type PhotoBindings =
  | Record<string, PhotoBindingValue>
  | PhotoBindingValue[];

export type CarouselSlide = {
  layout: LayoutId;
  eyebrow?: string;
  headline: string;
  body?: string;
  items?: string[];
  cta?: string;
  image?: string;
  template_card?: string | number;
  photo_bindings?: PhotoBindings;
};

export type CarouselDocument = {
  id?: string;
  family: FamilyId;
  title?: string;
  template?: string;
  template_id?: string;
  templateId?: string;
  photo_bindings?: PhotoBindings | Record<string, PhotoBindings>;
  slides: CarouselSlide[];
};

export const FAMILIES = {
  "editorial-premium": { name: "Editorial Premium", bg: "#F7F3ED", ink: "#0F0F10", accent: "#C59A6B", support: "#8A6D54", serif: "Georgia, serif", sans: "Arial, sans-serif" },
  organic: { name: "Orgânico Terracota", bg: "#F7F0E8", ink: "#3B241C", accent: "#9A4F35", support: "#D4A06F", serif: "Georgia, serif", sans: "Arial, sans-serif" },
  educational: { name: "Minimal Educacional", bg: "#F4F6F5", ink: "#172124", accent: "#4C8A91", support: "#B8D5D8", serif: "Georgia, serif", sans: "Arial, sans-serif" },
  "clean-white": { name: "Clean White", bg: "#FFFFFF", ink: "#111111", accent: "#B98B5F", support: "#EEE9E3", serif: "Georgia, serif", sans: "Arial, sans-serif" },
} as const;

export const LIMITS: Record<LayoutId, { headline: number; body: number; items: number }> = {
  "hero-photo": { headline: 58, body: 120, items: 0 },
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
  id: "CM-043",
  family: "editorial-premium",
  title: "Quer cortar curto sem deixar de se reconhecer?",
  slides: [
    { layout: "hero-photo", eyebrow: "CM-043 · CORTE", headline: "Quer cortar curto", body: "sem deixar de se reconhecer?" },
    { layout: "statement-portrait", eyebrow: "02 / 06", headline: "O medo nem sempre é do cabelo curto.", body: "Muitas vezes, é medo de perder a própria identidade junto com a mudança." },
    { layout: "feature-list", eyebrow: "03 / 06", headline: "O comprimento é só uma parte do corte.", items: ["Desenho do corte", "Contorno do rosto", "Volume e textura", "Proporção"] },
    { layout: "checklist", eyebrow: "04 / 06", headline: "O curto não precisa ser radical.", body: "Um short bob bem desenhado pode trazer:", items: ["Leveza", "Movimento", "Praticidade", "Manutenção real"] },
    { layout: "checklist", eyebrow: "05 / 06", headline: "Antes de cortar, vale considerar:", items: ["Rotina de finalização", "Textura natural", "Volume desejado", "Manutenção possível", "Quanto da sua identidade deseja preservar"] },
    { layout: "photo-cta", eyebrow: "06 / 06", headline: "Mudar também pode ser continuar se reconhecendo.", body: "Qual mudança você teria vontade de experimentar no seu cabelo?", cta: "Conte nos comentários" },
  ],
};
