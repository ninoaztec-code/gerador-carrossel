export type PautaCategory = "Corte" | "Cor" | "Produtos/Tratamentos";
export type PautaFormat = "Carrossel" | "Post fixo";

export type OfficialPauta = {
  id: string;
  date: string;
  day: string;
  category: PautaCategory;
  format: PautaFormat;
  title: string;
};

export const OFFICIAL_PAUTAS: OfficialPauta[] = [
  { id: "CM-037", date: "2026-08-24", day: "Segunda", category: "Corte", format: "Carrossel", title: "Seu cabelo parece mais fino mesmo usando bons produtos?" },
  { id: "CM-038", date: "2026-08-25", day: "Terça", category: "Produtos/Tratamentos", format: "Post fixo", title: "Seu cabelo fino precisa de mais produto — ou de escolhas melhores?" },
  { id: "CM-039", date: "2026-08-26", day: "Quarta", category: "Cor", format: "Carrossel", title: "Assumir os brancos pode ser mais leve do que você imagina" },
  { id: "CM-040", date: "2026-08-27", day: "Quinta", category: "Corte", format: "Post fixo", title: "Seu corte perdeu o formato ou sua rotina mudou?" },
  { id: "CM-041", date: "2026-08-28", day: "Sexta", category: "Cor", format: "Carrossel", title: "A iluminação precisa conversar com a sua base" },
  { id: "CM-042", date: "2026-08-29", day: "Sábado", category: "Produtos/Tratamentos", format: "Post fixo", title: "Frizz não é sempre falta de produto" },
  { id: "CM-043", date: "2026-08-31", day: "Segunda", category: "Corte", format: "Carrossel", title: "Cortar curto não precisa significar virar outra pessoa" },
  { id: "CM-044", date: "2026-09-01", day: "Terça", category: "Produtos/Tratamentos", format: "Post fixo", title: "Quando o cabelo está frágil, fazer mais pode não ser a resposta" },
  { id: "CM-045", date: "2026-09-02", day: "Quarta", category: "Cor", format: "Carrossel", title: "A raiz aparece rápido? Talvez a estratégia de cor precise mudar" },
  { id: "CM-046", date: "2026-09-03", day: "Quinta", category: "Corte", format: "Post fixo", title: "O melhor corte não é o mais bonito no salão — é o que funciona em casa" },
  { id: "CM-047", date: "2026-09-04", day: "Sexta", category: "Cor", format: "Carrossel", title: "Cachos também podem ganhar luz sem perder sua presença" },
  { id: "CM-048", date: "2026-09-05", day: "Sábado", category: "Produtos/Tratamentos", format: "Post fixo", title: "Depois de um tempo, o cabelo pode pedir outra rotina" },
  { id: "CM-049", date: "2026-09-07", day: "Segunda", category: "Corte", format: "Carrossel", title: "Seu cabelo está sem movimento ou sem a distribuição certa?" },
  { id: "CM-050", date: "2026-09-08", day: "Terça", category: "Produtos/Tratamentos", format: "Post fixo", title: "Definição não precisa deixar o cabelo rígido" },
  { id: "CM-051", date: "2026-09-09", day: "Quarta", category: "Cor", format: "Carrossel", title: "Cobrir os brancos é uma escolha — não uma obrigação" },
  { id: "CM-052", date: "2026-09-10", day: "Quinta", category: "Corte", format: "Post fixo", title: "Mudar o cabelo não precisa mudar quem você é" },
  { id: "CM-053", date: "2026-09-11", day: "Sexta", category: "Cor", format: "Carrossel", title: "Quando o problema não é a cor — é o contraste" },
  { id: "CM-054", date: "2026-09-12", day: "Sábado", category: "Produtos/Tratamentos", format: "Post fixo", title: "Seu cabelo está hidratado, mas continua sem brilho?" },
  { id: "CM-055", date: "2026-09-14", day: "Segunda", category: "Corte", format: "Carrossel", title: "Por que o mesmo corte pode ficar tão diferente em cada mulher?" },
  { id: "CM-056", date: "2026-09-15", day: "Terça", category: "Produtos/Tratamentos", format: "Post fixo", title: "O cuidado com fios delicados começa antes da finalização" },
  { id: "CM-057", date: "2026-09-16", day: "Quarta", category: "Cor", format: "Carrossel", title: "A cor precisa caber na sua agenda" },
  { id: "CM-058", date: "2026-09-17", day: "Quinta", category: "Corte", format: "Post fixo", title: "Pixie cacheado: curto sem apagar a textura" },
  { id: "CM-059", date: "2026-09-18", day: "Sexta", category: "Cor", format: "Carrossel", title: "Quer mudar a cor sem parecer que mudou completamente?" },
  { id: "CM-060", date: "2026-09-19", day: "Sábado", category: "Produtos/Tratamentos", format: "Post fixo", title: "Cuidar da cor também é cuidar do fio" },
  { id: "CM-061", date: "2026-09-21", day: "Segunda", category: "Corte", format: "Carrossel", title: "Quer cortar curto sem chegar ao pixie?" },
  { id: "CM-062", date: "2026-09-22", day: "Terça", category: "Produtos/Tratamentos", format: "Post fixo", title: "O melhor cuidado é o que cabe na sua vida" },
  { id: "CM-063", date: "2026-09-23", day: "Quarta", category: "Cor", format: "Carrossel", title: "A manutenção da cor começa antes da próxima visita" },
  { id: "CM-064", date: "2026-09-24", day: "Quinta", category: "Corte", format: "Post fixo", title: "Bixie: o meio-termo para quem quer mais forma sem radicalizar" },
  { id: "CM-065", date: "2026-09-25", day: "Sexta", category: "Cor", format: "Carrossel", title: "Iluminar a cor não significa apagar a base que você gosta" },
  { id: "CM-066", date: "2026-09-26", day: "Sábado", category: "Produtos/Tratamentos", format: "Post fixo", title: "Seu cabelo não precisa seguir a rotina de outra pessoa" },
];

export const OFFICIAL_PAUTA_IDS = new Set(OFFICIAL_PAUTAS.map((item) => item.id));
