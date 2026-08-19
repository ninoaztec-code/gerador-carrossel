import { OFFICIAL_PAUTAS } from "@/lib/officialPautas";
import { OFFICIAL_PROJECTS } from "@/lib/officialPautaProjects";

const BASE = "Fotografia editorial premium e realista para Instagram do Mago das Tesouras. Retratar mulheres brasileiras reais entre aproximadamente 45 e 65 anos, alternando tons de pele, formatos de rosto, tipos e curvaturas de cabelo ao longo da série. Aparência madura natural, elegante e contemporânea; preservar textura de pele, linhas de expressão e individualidade. Cabelo protagonista, textura e densidade fisicamente plausíveis, sem aparência de peruca, sem volume artificial, sem beleza genérica de banco de imagens. Luz suave de salão/editorial, fundo neutro preto, bege ou ambiente de salão discretamente desfocado. Sem texto, sem logotipo, sem marca d'água. Enquadramento vertical 4:5 com espaço negativo útil para tipografia. A fotografia precisa demonstrar visualmente a ideia específica do card, e não apenas ilustrar uma mulher bonita.";

const CATEGORY: Record<string,string> = {
  Corte: "Mostrar com clareza o desenho real do corte: comprimento, camadas, contorno, densidade, movimento e relação com o rosto. Respeitar rigorosamente quando a pauta mencionar fios finos, pouco volume, cabelo denso, cacheado, crespo, grisalho ou outra condição. O resultado deve parecer possível de manter no cotidiano, sem escova excessivamente produzida.",
  Cor: "Mostrar com fidelidade base, contraste, temperatura, distribuição das mechas e dimensão da cor. Manter raiz, reflexos e brilho naturais. Evitar loiro artificial, saturação exagerada e descoloração extrema quando não fizerem parte da pauta.",
  "Produtos/Tratamentos": "Mostrar saúde e textura real do fio, brilho natural e gesto cotidiano de cuidado. Não transformar a fotografia em propaganda de produto e não inventar embalagens ou marcas; cabelo e pessoa continuam protagonistas.",
};

const VARIANTS = [
  "retrato três-quartos, cabelo ocupando aproximadamente metade da imagem, olhar fora da câmera, leitura nítida do corte e da densidade",
  "perfil suave, foco no caimento lateral, contorno do rosto e textura verdadeira dos fios",
  "enquadramento de costas em três-quartos mostrando desenho, comprimento, camadas e textura do cabelo",
  "retrato frontal espontâneo, expressão segura e acolhedora, cabelo em condição cotidiana refinada e não excessivamente produzido",
  "close editorial do cabelo e rosto com movimento natural dos fios e detalhes suficientes para comprovar a característica ensinada no card",
];

const PROJECT_DIRECTION: Record<string,string> = {
  "CM-037": "Esta pauta é sobre cortes para fios finos e pouco volume. A modelo deve ter densidade capilar visualmente baixa a moderada e fios finos reais; couro cabeludo pode aparecer de modo sutil e natural em algumas áreas. Não criar cabelo cheio, volumoso ou espesso. Cada imagem deve provar como o desenho do corte cria percepção de corpo e movimento sem fingir densidade inexistente.",
};

export type OfficialImageJob = { project_id:string; card:number; filename:string; prompt:string };

export const OFFICIAL_IMAGE_JOBS: OfficialImageJob[] = OFFICIAL_PROJECTS.flatMap((project) => {
  const pauta = OFFICIAL_PAUTAS.find((item) => item.id === project.project_id)!;
  return project.cards.map((card, index) => ({
    project_id: project.project_id,
    card: card.card,
    filename: `${project.project_id}/${String(card.card).padStart(2,"0")}.jpg`,
    prompt: `${BASE} ${CATEGORY[pauta.category]} ${PROJECT_DIRECTION[project.project_id] ?? "Interpretar literalmente a condição capilar descrita na pauta e no card; não suavizar nem substituir a característica central por cabelo genericamente perfeito."} Pauta: ${pauta.title}. Mensagem visual deste card: ${card.headline}. ${card.body} Composição: ${VARIANTS[index % VARIANTS.length]}. A pessoa e o cabelo deste card devem ser visualmente distintos dos demais cards quando isso ajudar a demonstrar a pauta. Não inserir palavras na fotografia.`,
  }));
});
