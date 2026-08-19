import { INSTAGRAM_45PLUS_LIBRARY } from "@/lib/instagramTemplateLibrary";

export type PhotoCfg = { x: number; y: number; zoom: number; fit: "cover" | "contain" };
export type CopyState = { headline: string; body: string; cta: string };
export type TextSize = "small" | "medium" | "large";
export type TextBlock = "headline" | "body" | "cta";
export type TextMove = { x: number; y: number };
export type TextMoves = Record<TextBlock, TextMove>;
export type CardColors = { bg: string; text: string };
export type TypeStyle = "clean-serif" | "directional-poster" | "elegant-classic" | "squeeze-deco";
export type PendingPhoto = {
  id: string;
  image: string;
  photoCfg?: PhotoCfg;
  fromTemplate: string;
  fromCard: number;
  fromSlot: number;
  reason: "no_compatible_slot";
};

export type ProjectState = {
  version: 1;
  projectId: string;
  status: "rascunho" | "salvo" | "aprovado";
  templateId: string;
  cardIndex: number;
  slotIndex: number;
  images: Record<string, string>;
  photoCfgs: Record<string, PhotoCfg>;
  copies: Record<string, CopyState>;
  textSizes: Record<string, TextSize>;
  textMovesByCard: Record<string, TextMoves>;
  colorsByCard: Record<string, CardColors>;
  typeStyles: Record<string, TypeStyle>;
  pendingPhotos?: PendingPhoto[];
  updatedAt: string;
};

export const photoKey = (templateId: string, cardIndex: number, slotIndex: number) =>
  `${templateId}:${cardIndex}:${slotIndex}`;
export const cardKey = (templateId: string, cardIndex: number) => `${templateId}:${cardIndex}`;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function clearPrefix<T>(record: Record<string, T>, prefix: string) {
  const next = { ...record };
  for (const key of Object.keys(next)) if (key.startsWith(prefix)) delete next[key];
  return next;
}

function copyCardRecord<T>(record: Record<string, T>, source: string, target: string, cards: number) {
  const next = clearPrefix(record, `${target}:`);
  for (let card = 0; card < cards; card++) {
    const value = record[cardKey(source, card)];
    if (value !== undefined) next[cardKey(target, card)] = clone(value);
  }
  return next;
}

function pendingId(image: string, template: string, card: number, slot: number) {
  let hash = 2166136261;
  const input = `${image}|${template}|${card}|${slot}`;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `pending-${(hash >>> 0).toString(36)}`;
}

export function remapProjectState(state: ProjectState, targetTemplateId: string, newProjectId = state.projectId): ProjectState {
  const sourceTemplateId = state.templateId.toUpperCase();
  const targetId = targetTemplateId.toUpperCase();
  const sourceTemplate = INSTAGRAM_45PLUS_LIBRARY.find((item) => item.id === sourceTemplateId);
  const targetTemplate = INSTAGRAM_45PLUS_LIBRARY.find((item) => item.id === targetId);
  if (!targetTemplate) throw new Error(`Template inválido: ${targetId}`);
  if (!sourceTemplate) throw new Error(`Template de origem inválido: ${sourceTemplateId}`);

  if (sourceTemplateId === targetId) {
    return { ...clone(state), projectId: newProjectId, updatedAt: new Date().toISOString() };
  }

  const cardCount = Math.min(sourceTemplate.cards.length, targetTemplate.cards.length);
  const images = clearPrefix(state.images || {}, `${targetId}:`);
  const photoCfgs = clearPrefix(state.photoCfgs || {}, `${targetId}:`);
  const occupied = new Map<number, Set<number>>();
  const pending: PendingPhoto[] = [];

  const place = (image: string, cfg: PhotoCfg | undefined, fromTemplate: string, fromCard: number, fromSlot: number) => {
    const targetCard = targetTemplate.cards[fromCard];
    if (!targetCard || targetCard.photos.length === 0) {
      pending.push({ id: pendingId(image, fromTemplate, fromCard, fromSlot), image, photoCfg: cfg, fromTemplate, fromCard, fromSlot, reason: "no_compatible_slot" });
      return;
    }
    const used = occupied.get(fromCard) ?? new Set<number>();
    let slot = fromSlot < targetCard.photos.length && !used.has(fromSlot) ? fromSlot : -1;
    if (slot < 0) slot = targetCard.photos.findIndex((_, index) => !used.has(index));
    if (slot < 0) {
      pending.push({ id: pendingId(image, fromTemplate, fromCard, fromSlot), image, photoCfg: cfg, fromTemplate, fromCard, fromSlot, reason: "no_compatible_slot" });
      return;
    }
    used.add(slot);
    occupied.set(fromCard, used);
    const key = photoKey(targetId, fromCard, slot);
    images[key] = image;
    if (cfg) photoCfgs[key] = clone(cfg);
  };

  for (let card = 0; card < sourceTemplate.cards.length; card++) {
    const sourceSlots = sourceTemplate.cards[card]?.photos.length ?? 0;
    for (let slot = 0; slot < sourceSlots; slot++) {
      const key = photoKey(sourceTemplateId, card, slot);
      const image = state.images?.[key];
      if (image) place(image, state.photoCfgs?.[key], sourceTemplateId, card, slot);
    }
  }

  for (const item of state.pendingPhotos || []) {
    if (pending.some((p) => p.id === item.id)) continue;
    place(item.image, item.photoCfg, item.fromTemplate, item.fromCard, item.fromSlot);
  }

  const dedupedPending = Array.from(new Map(pending.map((item) => [item.id, item])).values());

  return {
    ...clone(state),
    projectId: newProjectId,
    templateId: targetId,
    cardIndex: Math.min(state.cardIndex || 0, targetTemplate.cards.length - 1),
    slotIndex: 0,
    images,
    photoCfgs,
    copies: copyCardRecord(state.copies || {}, sourceTemplateId, targetId, cardCount),
    textSizes: copyCardRecord(state.textSizes || {}, sourceTemplateId, targetId, cardCount),
    textMovesByCard: copyCardRecord(state.textMovesByCard || {}, sourceTemplateId, targetId, cardCount),
    colorsByCard: copyCardRecord(state.colorsByCard || {}, sourceTemplateId, targetId, cardCount),
    typeStyles: copyCardRecord(state.typeStyles || {}, sourceTemplateId, targetId, cardCount),
    pendingPhotos: dedupedPending,
    updatedAt: new Date().toISOString(),
  };
}
