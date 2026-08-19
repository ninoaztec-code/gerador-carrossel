export type LegacyHermesProject = {
  project_id: string;
  template: string;
  title?: string;
  caption?: string;
  cta?: string;
  cards: Array<{
    card: number;
    headline?: string;
    body?: string;
    text?: string;
    cta?: string;
    photo_id?: string;
    slot?: string;
    score?: number;
    text_size?: string;
  }>;
};

const LEGACY_PROJECTS: Record<string, LegacyHermesProject> = {
  "MAGO-CAR-5-MORENAS-ILUMINADAS-001": {
    project_id: "MAGO-CAR-5-MORENAS-ILUMINADAS-001",
    template: "T09",
    title: "5 morenas iluminadas",
    cta: "Curta, comente, salve e compartilhe.",
    caption:
      "Morena iluminada não é uma cor única.\n\nEla pode aparecer em um bob médio com caramelo, em cachos com luz mel, em camadas com cobre dourado ou em um comprimento longo com reflexos mais suaves.\n\nO tom certo precisa conversar com o seu cabelo, o seu rosto, a sua rotina e a mulher que você se tornou.\n\nQual dessas versões combina mais com você? Curta, comente, salve e compartilhe.",
    cards: [
      {
        card: 1,
        headline: "5 tons, cortes e maneiras diferentes de iluminar o castanho.",
        photo_id: "MAGO-VIS-0003",
        slot: "foto",
        score: 84,
        text_size: "large",
      },
      {
        card: 2,
        headline: "Caramelo com movimento.",
        photo_id: "MAGO-VIS-0004",
        slot: "foto",
        score: 94,
        text_size: "medium",
      },
      {
        card: 3,
        headline: "Luz também é textura.",
        photo_id: "MAGO-VIS-0006",
        slot: "foto",
        score: 80,
        text_size: "medium",
      },
      {
        card: 4,
        headline: "Mais calor, mais presença.",
        photo_id: "MAGO-VIS-0002",
        slot: "foto_1",
        score: 76,
        text_size: "small",
      },
      {
        card: 5,
        headline: "A mesma base. Uma nova luz.",
        cta: "Curta, comente, salve e compartilhe.",
        photo_id: "MAGO-VIS-0009",
        slot: "foto",
        score: 85,
        text_size: "medium",
      },
    ],
  },
};

export function getLegacyHermesProject(projectId: string) {
  return LEGACY_PROJECTS[projectId] ?? null;
}
