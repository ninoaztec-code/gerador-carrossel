export type Box={x:number;y:number;w:number;h:number;radius?:string;label?:string;shape?:string};
export type TextBox={x:number;y:number;w:number;kind?:string};
export type CardRole='cover'|'content'|'comparison'|'proof'|'cta';
export type DesignProfile={photoWeight:'low'|'medium'|'high';rhythm:string;headlineMaxLines:number;bodyMaxLines:number;safeMargin:number;preferredType:'clean-serif'|'directional-poster'|'elegant-classic'|'squeeze-deco';notes:string[]};
export type LibraryCard={bg?:string;photos:Box[];text?:TextBox;headline?:TextBox;cta?:TextBox;extraText?:TextBox[];number?:string;labels?:string[];role?:CardRole};
export type LibraryTemplate={id:string;name:string;description:string;profile:DesignProfile;cards:LibraryCard[]};

export const LIBRARY_COLORS={off_white:'#F7F2EC',bege:'#E7D8CB',terracota:'#92533D',vinho:'#703C49',rose:'#D3A29A',marrom:'#493731',preto:'#25201E'} as const;
const P='COLOQUE SUA FOTO AQUI';
const b=(x:number,y:number,w:number,h:number,radius?:string,shape?:string):Box=>({x,y,w,h,radius,label:P,shape});
const t=(x:number,y:number,w:number,kind?:string):TextBox=>({x,y,w,kind});
const p=(photoWeight:DesignProfile['photoWeight'],rhythm:string,headlineMaxLines:number,bodyMaxLines:number,preferredType:DesignProfile['preferredType'],notes:string[]):DesignProfile=>({photoWeight,rhythm,headlineMaxLines,bodyMaxLines,safeMargin:7,preferredType,notes});

export const INSTAGRAM_45PLUS_LIBRARY:LibraryTemplate[]=[
{id:'T01',name:'EDITORIAL PREMIUM',description:'Editorial sofisticado com fotografia forte, respiro e alternância de eixo.',profile:p('high','alternar esquerda/direita, abrir o terceiro card e fechar com CTA',3,5,'clean-serif',['foto protagonista','blocos de texto com respiro','alternância de eixo sem repetição']),cards:[
{role:'cover',bg:'off_white',photos:[b(5,8,45,84,'0 92px 0 0','vertical')],headline:t(56,20,37,'headline dominante')},
{role:'content',bg:'terracota',photos:[b(59,8,35,84,'42px','vertical')],text:t(7,22,43,'texto editorial')},
{role:'content',bg:'off_white',photos:[b(8,8,84,43,'30px','horizontal')],text:t(8,59,84,'texto aberto')},
{role:'proof',bg:'vinho',photos:[b(6,17,42,68,'84px 24px','vertical')],text:t(54,22,38,'prova/benefício')},
{role:'cta',bg:'off_white',photos:[b(60,11,33,76,'22px 78px','vertical')],cta:t(7,24,45,'CTA forte')}]},

{id:'T02',name:'HERO BEAUTY',description:'Fotografia dominante e copy curta com sensação de campanha de beleza.',profile:p('high','hero dominante → pausa horizontal → close → sangrado',3,4,'elegant-classic',['uma imagem manda na página','texto sempre em ilha limpa','alto contraste']),cards:[
{role:'cover',bg:'bege',photos:[b(43,0,57,100,undefined,'foto_grande_vertical')],headline:t(6,19,31,'headline impacto')},
{role:'content',bg:'off_white',photos:[b(0,0,100,54,undefined,'horizontal_grande')],text:t(8,63,84,'texto inferior')},
{role:'proof',bg:'terracota',photos:[b(9,13,82,59,'96px','hero_central')],text:t(10,79,80,'legenda curta')},
{role:'content',bg:'off_white',photos:[b(0,18,61,76,undefined,'sangrado_esquerda')],text:t(67,25,27,'texto estreito')},
{role:'cta',bg:'vinho',photos:[b(50,7,50,93,undefined,'sangrado_direita')],cta:t(7,28,36,'CTA vertical')}]},

{id:'T03',name:'DUPLA EDITORIAL',description:'Duas imagens por página para comparação, escolha e contraste visual.',profile:p('high','pares equilibrados → comparação aberta → assimetria → CTA',3,4,'directional-poster',['comparar sem poluir','texto nunca espremido entre duas fotos','pares com pesos diferentes']),cards:[
{role:'cover',bg:'off_white',photos:[b(6,32,40,58,'24px'),b(54,27,40,63,'24px')],headline:t(8,6,84,'pergunta/capa')},
{role:'comparison',bg:'bege',photos:[b(7,9,41,49,'24px'),b(52,9,41,49,'24px')],text:t(8,65,84,'comparação')},
{role:'comparison',bg:'off_white',photos:[b(8,13,35,55,'90px 0'),b(57,13,35,55,'0 90px')],text:t(8,75,84,'comparação explicada')},
{role:'proof',bg:'terracota',photos:[b(6,8,54,56,'26px'),b(65,46,28,38,'26px')],text:t(8,70,48,'destaque')},
{role:'cta',bg:'off_white',photos:[b(5,13,43,58,'28px'),b(52,13,43,58,'28px')],cta:t(8,78,84,'CTA escolha')}]},

{id:'T04',name:'COLAGEM MAGAZINE',description:'Colagem editorial com uma foto dominante e imagens de apoio em assimetria controlada.',profile:p('high','dominante + apoios → faixa → colagem vertical → trio final',3,4,'squeeze-deco',['uma foto manda em cada página','texto em ilha limpa','assimetria intencional']),cards:[
{role:'cover',bg:'off_white',photos:[b(6,8,50,64,'24px'),b(62,10,30,30,'20px'),b(62,47,30,30,'20px')],headline:t(8,81,84,'capa revista')},
{role:'content',bg:'bege',photos:[b(8,17,29,46,'22px'),b(43,7,49,40,'22px'),b(47,54,39,34,'22px')],text:t(8,68,32,'nota editorial')},
{role:'proof',bg:'off_white',photos:[b(6,8,88,34,'26px'),b(7,63,39,27,'22px'),b(54,63,39,27,'22px')],text:t(8,47,84,'linha editorial')},
{role:'content',bg:'vinho',photos:[b(7,10,36,74,'26px'),b(50,10,43,32,'22px'),b(66,70,26,17,'18px')],text:t(49,48,43,'texto lateral')},
{role:'cta',bg:'off_white',photos:[b(7,16,27,43,'22px'),b(37,9,27,50,'22px'),b(67,16,27,43,'22px')],cta:t(10,69,80,'CTA final')}]},

{id:'T05',name:'ANTES E DEPOIS',description:'Transformação com leitura imediata, comparação e prova visual.',profile:p('high','antes/depois → explicação → técnica → resultado → CTA',3,5,'clean-serif',['antes e depois com mesmo peso','cabelo inteiro visível','comparação clara']),cards:[
{role:'cover',bg:'off_white',photos:[b(6,27,42,57,'24px'),b(52,27,42,57,'24px')],headline:t(8,6,84,'transformação'),labels:['ANTES','DEPOIS']},
{role:'content',bg:'bege',photos:[b(7,8,45,84,'28px')],text:t(58,19,35,'O QUE MUDOU?')},
{role:'comparison',bg:'off_white',photos:[b(8,10,38,43,'22px'),b(54,10,38,43,'22px')],text:t(8,62,84,'técnica/resultado')},
{role:'proof',bg:'terracota',photos:[b(14,8,72,57,'34px')],text:t(10,72,80,'resultado de perto')},
{role:'cta',bg:'off_white',photos:[b(8,16,36,52,'24px'),b(56,16,36,52,'24px')],cta:t(10,75,80,'CTA transformação'),labels:['ANTES','DEPOIS']}]},

{id:'T06',name:'ORGÂNICO FEMININO',description:'Arcos, ovais e curvas com ritmo suave e elegante.',profile:p('medium','arco → oval → cápsula → detalhe circular → arco invertido',3,5,'elegant-classic',['curvas como linguagem principal','respiro generoso','ornamento subordinado à foto']),cards:[
{role:'cover',bg:'bege',photos:[b(7,12,44,70,'50% 50% 20px 20px','arco')],headline:t(56,23,36,'headline suave')},
{role:'content',bg:'off_white',photos:[b(56,12,37,63,'50%','oval_vertical')],text:t(8,23,40,'texto acolhedor')},
{role:'proof',bg:'rose',photos:[b(14,9,72,50,'999px','capsula_horizontal')],text:t(10,68,80,'benefício')},
{role:'content',bg:'off_white',photos:[b(8,12,37,59,'50% 50% 18px 18px','arco'),b(64,60,25,25,'50%','circulo')],text:t(51,15,40,'detalhe')},
{role:'cta',bg:'bege',photos:[b(58,14,35,68,'18px 18px 50% 50%','arco_invertido')],cta:t(8,28,42,'CTA delicado')}]},

{id:'T07',name:'FOTO SANGRADA',description:'Fotografia encostada nas bordas com impacto alto e copy curta.',profile:p('high','direita → esquerda → topo → base → direita escura',3,4,'directional-poster',['sangrado como protagonista','copy curta','contraste forte']),cards:[
{role:'cover',bg:'off_white',photos:[b(43,0,57,100,undefined,'sangrado_direita')],headline:t(6,25,32,'headline forte')},
{role:'content',bg:'vinho',photos:[b(0,0,55,100,undefined,'sangrado_esquerda')],text:t(62,22,31,'texto lateral')},
{role:'proof',bg:'off_white',photos:[b(0,0,100,53,undefined,'sangrado_superior')],text:t(8,62,84,'prova')},
{role:'content',bg:'bege',photos:[b(0,47,100,53,undefined,'sangrado_inferior')],text:t(8,10,84,'texto superior')},
{role:'cta',bg:'preto',photos:[b(41,0,59,100,undefined,'sangrado_direita')],cta:t(6,29,29,'CTA impacto')}]},

{id:'T08',name:'REVISTA 45+',description:'Sistema de revista feminina com capa, matéria, coluna e fechamento editorial.',profile:p('medium','capa → nota lateral → matéria aberta → destaque → fechamento',4,6,'clean-serif',['hierarquia de revista','foto e texto com pesos distintos','mais espaço para conteúdo']),cards:[
{role:'cover',bg:'off_white',photos:[b(46,8,47,83,'24px')],headline:t(7,16,39,'capa revista')},
{role:'content',bg:'bege',photos:[b(7,11,49,65,'22px'),b(64,17,27,34,'18px')],text:t(60,58,33,'nota lateral')},
{role:'content',bg:'off_white',photos:[b(8,9,84,43,'24px')],text:t(8,60,84,'matéria aberta')},
{role:'proof',bg:'rose',photos:[b(55,8,38,72,'22px'),b(8,58,31,24,'18px')],text:t(8,15,38,'destaque')},
{role:'cta',bg:'off_white',photos:[b(8,15,35,65,'22px')],cta:t(50,25,42,'editorial_cta')}]},

{id:'T09',name:'VISAGISMO',description:'Rosto em destaque, leitura técnica lateral, comparação e recomendação final.',profile:p('medium','rosto central → análise esquerda → análise direita → comparação → diagnóstico',3,6,'elegant-classic',['rosto com respiro','área técnica limpa','comparação equilibrada']),cards:[
{role:'cover',bg:'off_white',photos:[b(29,34,42,46,'50%','oval')],headline:t(10,8,80,'visagismo capa')},
{role:'content',bg:'bege',photos:[b(8,15,43,66,'24px')],text:t(57,17,35,'análise 1')},
{role:'content',bg:'off_white',photos:[b(50,13,42,65,'24px')],text:t(8,18,36,'análise 2')},
{role:'comparison',bg:'rose',photos:[b(8,14,37,53,'24px'),b(55,14,37,53,'24px')],text:t(10,74,80,'comparação')},
{role:'cta',bg:'off_white',photos:[b(31,9,38,55,'50%','oval')],cta:t(10,72,80,'CTA diagnóstico')}]},

{id:'T10',name:'CATÁLOGO DE CORTES',description:'Catálogo numerado com capa de opções, páginas individuais e fechamento comparativo.',profile:p('high','trio de abertura → opção esquerda → opção direita → hero horizontal → trio final',3,4,'directional-poster',['número como âncora','foto mostra corte inteiro','texto curto e objetivo']),cards:[
{role:'cover',bg:'off_white',photos:[b(6,34,27,42,'22px'),b(36,30,28,46,'22px'),b(67,34,27,42,'22px')],headline:t(8,7,84,'capa catálogo')},
{role:'content',bg:'bege',photos:[b(8,12,43,72,'24px')],number:'01',text:t(58,25,34,'opção 01')},
{role:'content',bg:'off_white',photos:[b(49,12,43,72,'24px')],number:'02',text:t(8,25,34,'opção 02')},
{role:'proof',bg:'terracota',photos:[b(8,14,84,50,'26px')],number:'03',text:t(8,71,84,'opção 03')},
{role:'cta',bg:'off_white',photos:[b(8,16,25,43,'22px'),b(37,16,25,43,'22px'),b(66,16,25,43,'22px')],cta:t(10,69,80,'escolha seu corte')}]},

{id:'T11',name:'FAIXA FOTOGRÁFICA',description:'Faixas horizontais criam ritmo editorial e leitura rápida.',profile:p('medium','faixa central → topo → base → cápsula → faixa final',3,5,'clean-serif',['bom para conteúdo educativo','foto panorâmica','texto fora da faixa']),cards:[
{role:'cover',bg:'off_white',photos:[b(0,36,100,34,undefined,'faixa_horizontal')],headline:t(8,8,84,'headline topo'),text:t(8,78,84,'apoio')},
{role:'content',bg:'bege',photos:[b(7,10,86,35,'24px')],text:t(8,55,84,'texto inferior')},
{role:'content',bg:'off_white',photos:[b(0,54,100,33,undefined,'faixa_horizontal')],text:t(8,12,84,'texto superior')},
{role:'proof',bg:'rose',photos:[b(10,22,80,39,'100px')],text:t(10,69,80,'benefício')},
{role:'cta',bg:'vinho',photos:[b(0,18,100,37,undefined,'faixa_horizontal')],cta:t(10,66,80,'CTA final')}]},

{id:'T12',name:'CLOSE BEAUTY',description:'Close de textura, rosto e cabelo para alto impacto visual.',profile:p('high','close vertical → horizontal → macro → detalhe circular → close central',3,4,'squeeze-deco',['textura como protagonista','copy mínima','contraste alto']),cards:[
{role:'cover',bg:'preto',photos:[b(45,5,50,90,undefined,'close_vertical')],headline:t(6,24,33,'headline close')},
{role:'content',bg:'off_white',photos:[b(8,8,84,57,'24px','close_horizontal')],text:t(8,72,84,'descrição')},
{role:'proof',bg:'bege',photos:[b(7,12,49,77,'24px','macro_vertical')],text:t(63,26,31,'detalhe técnico')},
{role:'content',bg:'off_white',photos:[b(44,10,49,72,'24px'),b(8,58,25,25,'50%','circulo')],text:t(8,16,31,'micro detalhe')},
{role:'cta',bg:'vinho',photos:[b(26,8,48,60,'120px','close_central')],cta:t(10,75,80,'CTA beauty')}]}
];

export const TEMPLATE_USAGE_GUIDE=Object.fromEntries(INSTAGRAM_45PLUS_LIBRARY.map((template)=>[template.id,{name:template.name,description:template.description,profile:template.profile,cards:template.cards.map((card,index)=>({card:index+1,role:card.role,photos:card.photos.length,mainText:card.headline?'headline':card.cta?'cta':'text'}))}]));

export const MASTER_INSTRUCTION="Use o template selecionado como sistema visual, não como sugestão. Todos os cards são 1080x1350 px (4:5). Preserve slots, respiro e hierarquia. O Gerador pode preencher automaticamente slots secundários com outras fotos do mesmo projeto para completar colagens e comparações; o Hermes continua decidindo apenas conteúdo e imagens, nunca coordenadas. Não sobreponha copy ao rosto ou ao corte principal. Respeite o papel de cada página (capa, conteúdo, comparação, prova ou CTA), mantenha headline curta, corpo enxuto e CTA destacado. Quando não houver foto suficiente, mostre literalmente 'COLOQUE SUA FOTO AQUI'. A estética é premium, contemporânea, humana e direcionada a mulheres 45+.";
