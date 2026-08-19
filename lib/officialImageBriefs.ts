import { OFFICIAL_PAUTAS } from "@/lib/officialPautas";
import { OFFICIAL_PROJECTS } from "@/lib/officialPautaProjects";

const BASE = "Fotografia editorial premium para Instagram do Mago das Tesouras. Mulher real brasileira 45+, aparência natural e elegante, cabelo protagonista, textura realista, pele sem efeito plástico, luz suave de salão/editorial, fundo neutro preto/bege, detalhes dourados discretos apenas na composição posterior, sem texto, sem logotipo, sem marca d'água, enquadramento vertical 4:5, espaço negativo útil para tipografia.";

const CATEGORY: Record<string,string> = {
  Corte: "Priorizar leitura clara do corte, comprimento, camadas, contorno, densidade e movimento. O penteado deve parecer possível de manter no dia a dia.",
  Cor: "Priorizar leitura fiel de base, contraste, temperatura, mechas e dimensão da cor. Evitar loiro artificial e descoloração extrema quando não fizer parte da pauta.",
  "Produtos/Tratamentos": "Priorizar saúde e textura do fio, brilho natural e gesto cotidiano de cuidado. Não transformar a imagem em propaganda de produto; cabelo e pessoa continuam protagonistas.",
};

const VARIANTS = [
  "retrato três-quartos, cabelo ocupando metade da imagem, olhar fora da câmera",
  "perfil suave, foco no caimento lateral e contorno do rosto",
  "enquadramento de costas em três-quartos mostrando desenho e textura do cabelo",
  "retrato frontal espontâneo, expressão segura e acolhedora",
  "close editorial do cabelo e rosto com movimento natural dos fios",
];

export type OfficialImageJob = { project_id:string; card:number; filename:string; prompt:string };

export const OFFICIAL_IMAGE_JOBS: OfficialImageJob[] = OFFICIAL_PROJECTS.flatMap((project) => {
  const pauta = OFFICIAL_PAUTAS.find((item) => item.id === project.project_id)!;
  return project.cards.map((card, index) => ({
    project_id: project.project_id,
    card: card.card,
    filename: `${project.project_id}/${String(card.card).padStart(2,"0")}.jpg`,
    prompt: `${BASE} ${CATEGORY[pauta.category]} Pauta: ${pauta.title}. Mensagem visual deste card: ${card.headline}. ${card.body} Composição: ${VARIANTS[index % VARIANTS.length]}. Não inserir palavras na fotografia.`,
  }));
});
