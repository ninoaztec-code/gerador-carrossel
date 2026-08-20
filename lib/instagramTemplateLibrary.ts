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
const p=(photoWeight:DesignProfile['photoWeight'],rhythm:string,headlineMaxLines:number,bodyMaxLines:number,preferredType:DesignProfile['preferredType'],notes:string[]):DesignProfile=>({photoWeight,rhythm,headlineMaxLines,bodyMaxLines,safeMargin:6,preferredType,notes});

// Visual system v3: each template has a recognisable silhouette and every card changes axis.
// Photo slots deliberately use more of the canvas than the legacy library to avoid the generic boxed look.
export const INSTAGRAM_45PLUS_LIBRARY:LibraryTemplate[]=[
{id:'T01',name:'EDITORIAL PREMIUM',description:'Editorial premium com fotografia protagonista, alternância radical de eixo e respiro de revista.',profile:p('high','hero esquerdo → hero direito → paisagem → recorte orgânico → fechamento editorial',3,5,'clean-serif',['CM-037 como régua','foto protagonista','alternância real card a card']),cards:[
{role:'cover',bg:'off_white',photos:[b(0,0,56,100,'0 110px 110px 0','editorial_bleed_left')],headline:t(62,18,31,'headline dominante')},
{role:'content',bg:'terracota',photos:[b(52,7,48,86,'96px 0 0 96px','editorial_bleed_right')],text:t(6,20,39,'texto editorial')},
{role:'content',bg:'off_white',photos:[b(6,5,88,52,'34px','editorial_landscape')],text:t(8,64,78,'texto aberto')},
{role:'proof',bg:'vinho',photos:[b(5,12,48,76,'50% 50% 18px 18px','editorial_arch')],text:t(60,21,33,'prova/benefício')},
{role:'cta',bg:'bege',photos:[b(57,0,43,100,'110px 0 0 0','editorial_close')],cta:t(7,25,42,'CTA forte')}]},

{id:'T02',name:'HERO BEAUTY',description:'Campanha de beleza: close fotográfico grande e copy mínima.',profile:p('high','full bleed → faixa inferior → close central → diagonal → full bleed final',3,4,'elegant-classic',['imagem ocupa 60–100%','copy em ilha','sensação de campanha']),cards:[
{role:'cover',bg:'preto',photos:[b(0,0,100,100,undefined,'full_bleed')],headline:t(7,68,54,'headline overlay')},
{role:'content',bg:'off_white',photos:[b(0,0,100,65,undefined,'beauty_landscape')],text:t(8,72,82,'copy curta')},
{role:'proof',bg:'bege',photos:[b(15,7,70,78,'140px','beauty_close')],text:t(18,88,64,'legenda mínima')},
{role:'content',bg:'off_white',photos:[b(0,0,68,100,'0 140px 0 0','beauty_diagonal')],text:t(74,22,21,'texto estreito')},
{role:'cta',bg:'vinho',photos:[b(42,0,58,100,undefined,'beauty_bleed_right')],cta:t(6,31,31,'CTA vertical')}]},

{id:'T03',name:'DUPLA EDITORIAL',description:'Comparação sofisticada com duplas em pesos e alturas diferentes.',profile:p('high','dupla escalonada → split → espelho → dominante+apoio → dupla final',3,4,'directional-poster',['duas fotos sem grade rígida','pesos diferentes','comparação limpa']),cards:[
{role:'cover',bg:'off_white',photos:[b(4,32,43,62,'28px'),b(54,18,42,68,'28px')],headline:t(7,5,73,'pergunta/capa')},
{role:'comparison',bg:'bege',photos:[b(0,0,50,72,undefined,'split_left'),b(50,0,50,72,undefined,'split_right')],text:t(8,79,84,'comparação')},
{role:'comparison',bg:'off_white',photos:[b(6,11,39,65,'110px 16px'),b(55,11,39,65,'16px 110px')],text:t(10,82,80,'comparação espelho')},
{role:'proof',bg:'terracota',photos:[b(0,0,64,69,'0 40px 40px 0'),b(70,55,25,34,'22px')],text:t(68,12,26,'destaque')},
{role:'cta',bg:'off_white',photos:[b(5,12,42,61,'28px'),b(53,25,42,61,'28px')],cta:t(8,82,84,'CTA escolha')}]},

{id:'T04',name:'COLAGEM MAGAZINE',description:'Colagem de revista com sobreposição, assimetria e uma foto dominante.',profile:p('high','capa colagem → mosaico → faixa+retratos → coluna → trio editorial',3,4,'squeeze-deco',['sobreposição controlada','uma foto manda','ritmo magazine']),cards:[
{role:'cover',bg:'off_white',photos:[b(0,8,61,68,'0 32px 32px 0'),b(66,4,29,37,'20px'),b(62,48,34,43,'20px')],headline:t(8,79,47,'capa revista')},
{role:'content',bg:'bege',photos:[b(6,6,36,53,'22px'),b(46,14,50,36,'22px'),b(51,57,39,37,'22px')],text:t(7,66,34,'nota editorial')},
{role:'proof',bg:'off_white',photos:[b(0,0,100,40,undefined,'magazine_strip'),b(7,58,34,36,'22px'),b(59,54,34,40,'22px')],text:t(8,45,78,'linha editorial')},
{role:'content',bg:'vinho',photos:[b(5,6,39,88,'28px'),b(51,8,44,38,'22px'),b(69,69,26,22,'18px')],text:t(51,52,38,'texto lateral')},
{role:'cta',bg:'off_white',photos:[b(4,22,29,48,'22px'),b(35,8,30,62,'22px'),b(67,22,29,48,'22px')],cta:t(9,77,82,'CTA final')}]},

{id:'T05',name:'ANTES E DEPOIS',description:'Transformação visual direta com antes/depois grande e prova de detalhe.',profile:p('high','split total → antes dominante → detalhe → depois dominante → split final',3,5,'clean-serif',['antes/depois inequívoco','mesmo peso na comparação','resultado grande']),cards:[
{role:'cover',bg:'preto',photos:[b(0,20,50,80,undefined,'before_bleed'),b(50,20,50,80,undefined,'after_bleed')],headline:t(7,4,86,'transformação'),labels:['ANTES','DEPOIS']},
{role:'content',bg:'bege',photos:[b(0,0,58,100,'0 100px 0 0','before_focus')],text:t(65,19,29,'O QUE MUDOU?')},
{role:'comparison',bg:'off_white',photos:[b(6,7,42,58,'24px'),b(52,7,42,58,'24px')],text:t(8,72,84,'técnica/resultado')},
{role:'proof',bg:'terracota',photos:[b(8,5,84,70,'44px','result_close')],text:t(10,81,80,'resultado de perto')},
{role:'cta',bg:'off_white',photos:[b(0,0,50,70,undefined,'before_final'),b(50,0,50,70,undefined,'after_final')],cta:t(10,78,80,'CTA transformação'),labels:['ANTES','DEPOIS']}]},

{id:'T06',name:'ORGÂNICO FEMININO',description:'Arcos, círculos e cápsulas com elegância suave sem perder presença fotográfica.',profile:p('high','arco grande → oval → cápsula → arco+detalhe → arco invertido',3,5,'elegant-classic',['curvas protagonistas','foto maior','respiro feminino']),cards:[
{role:'cover',bg:'bege',photos:[b(3,7,53,86,'50% 50% 22px 22px','arch_large')],headline:t(62,20,31,'headline suave')},
{role:'content',bg:'off_white',photos:[b(53,7,44,76,'50%','oval_large')],text:t(7,21,39,'texto acolhedor')},
{role:'proof',bg:'rose',photos:[b(7,5,86,61,'999px','capsule_hero')],text:t(11,73,78,'benefício')},
{role:'content',bg:'off_white',photos:[b(3,9,48,76,'50% 50% 20px 20px','arch'),b(68,61,28,28,'50%','detail_circle')],text:t(58,16,34,'detalhe')},
{role:'cta',bg:'bege',photos:[b(56,6,41,82,'20px 20px 50% 50%','arch_inverse')],cta:t(7,28,41,'CTA delicado')}]},

{id:'T07',name:'FOTO SANGRADA',description:'Fotografia edge-to-edge com alternância de direção e texto curto.',profile:p('high','direita total → esquerda total → topo → base → full bleed',3,4,'directional-poster',['sem moldura','foto toca bordas','impacto alto']),cards:[
{role:'cover',bg:'off_white',photos:[b(39,0,61,100,undefined,'bleed_right')],headline:t(5,23,30,'headline forte')},
{role:'content',bg:'vinho',photos:[b(0,0,61,100,undefined,'bleed_left')],text:t(68,21,26,'texto lateral')},
{role:'proof',bg:'off_white',photos:[b(0,0,100,61,undefined,'bleed_top')],text:t(8,68,82,'prova')},
{role:'content',bg:'bege',photos:[b(0,39,100,61,undefined,'bleed_bottom')],text:t(8,8,82,'texto superior')},
{role:'cta',bg:'preto',photos:[b(0,0,100,100,undefined,'full_bleed_dark')],cta:t(7,70,48,'CTA overlay')}]},

{id:'T08',name:'REVISTA 45+',description:'Revista feminina contemporânea com capa, coluna, matéria aberta e pull quote.',profile:p('high','capa editorial → coluna → matéria → pull quote → fechamento',4,6,'clean-serif',['hierarquia de revista','foto grande','áreas de texto editoriais']),cards:[
{role:'cover',bg:'off_white',photos:[b(42,0,58,100,'0 0 0 80px','magazine_cover')],headline:t(6,13,32,'capa revista'),extraText:[t(6,68,28,'linha de apoio')]},
{role:'content',bg:'bege',photos:[b(0,0,58,100,'0 80px 80px 0','magazine_column')],text:t(65,18,29,'nota lateral')},
{role:'content',bg:'off_white',photos:[b(5,5,90,52,'26px','feature_landscape')],text:t(7,63,86,'matéria aberta')},
{role:'proof',bg:'rose',photos:[b(55,0,45,100,undefined,'portrait_bleed'),b(5,61,32,29,'18px')],text:t(6,15,40,'destaque')},
{role:'cta',bg:'off_white',photos:[b(0,13,46,74,'0 42px 42px 0','closing_portrait')],cta:t(54,26,38,'editorial_cta')}]},

{id:'T09',name:'VISAGISMO',description:'Diagnóstico visual com rosto protagonista, análise lateral e comparação.',profile:p('high','rosto hero → análise esquerda → análise direita → comparação → diagnóstico',3,6,'elegant-classic',['rosto grande','leitura técnica limpa','comparação objetiva']),cards:[
{role:'cover',bg:'off_white',photos:[b(22,25,56,62,'50%','face_hero')],headline:t(9,5,82,'visagismo capa')},
{role:'content',bg:'bege',photos:[b(0,8,56,84,'0 44px 44px 0','analysis_left')],text:t(63,18,31,'análise 1')},
{role:'content',bg:'off_white',photos:[b(44,8,56,84,'44px 0 0 44px','analysis_right')],text:t(6,18,31,'análise 2')},
{role:'comparison',bg:'rose',photos:[b(5,9,43,62,'30px'),b(52,9,43,62,'30px')],text:t(10,78,80,'comparação')},
{role:'cta',bg:'off_white',photos:[b(27,5,46,61,'50%','diagnostic_face')],cta:t(10,73,80,'CTA diagnóstico')}]},

{id:'T10',name:'CATÁLOGO DE CORTES',description:'Catálogo de cortes com numeração grande, fotos inteiras e comparação final.',profile:p('high','trio capa → opção esquerda → opção direita → hero → trio final',3,4,'directional-poster',['número editorial','corte inteiro visível','catálogo sem grade monótona']),cards:[
{role:'cover',bg:'off_white',photos:[b(3,34,29,50,'22px'),b(35,20,30,64,'22px'),b(68,34,29,50,'22px')],headline:t(7,5,86,'capa catálogo')},
{role:'content',bg:'bege',photos:[b(0,7,57,86,'0 36px 36px 0','catalog_left')],number:'01',text:t(64,26,29,'opção 01')},
{role:'content',bg:'off_white',photos:[b(43,7,57,86,'36px 0 0 36px','catalog_right')],number:'02',text:t(7,26,29,'opção 02')},
{role:'proof',bg:'terracota',photos:[b(6,5,88,64,'30px','catalog_hero')],number:'03',text:t(8,76,84,'opção 03')},
{role:'cta',bg:'off_white',photos:[b(4,17,28,50,'22px'),b(36,10,28,57,'22px'),b(68,17,28,50,'22px')],cta:t(10,75,80,'escolha seu corte')}]},

{id:'T11',name:'SPLIT EDITORIAL',description:'Sistema split com blocos de cor e fotografia alternando vertical, horizontal e diagonal.',profile:p('high','split vertical → split invertido → faixa horizontal → assimetria → split final',3,5,'clean-serif',['50/50 sofisticado','alternância de eixo','texto nunca sobrecarrega foto']),cards:[
{role:'cover',bg:'off_white',photos:[b(50,0,50,100,undefined,'split_vertical')],headline:t(6,18,36,'headline split')},
{role:'content',bg:'vinho',photos:[b(0,0,52,100,undefined,'split_inverse')],text:t(59,21,34,'texto split')},
{role:'proof',bg:'bege',photos:[b(0,0,100,58,undefined,'split_landscape')],text:t(8,66,84,'benefício aberto')},
{role:'content',bg:'off_white',photos:[b(6,8,61,80,'34px','split_asym')],text:t(73,20,21,'nota lateral')},
{role:'cta',bg:'preto',photos:[b(48,0,52,100,undefined,'split_close')],cta:t(6,30,34,'CTA split')}]},

{id:'T12',name:'CAPA IMPACTO',description:'Poster editorial de alto impacto com tipografia dominante e fotografia em recortes dramáticos.',profile:p('high','poster → recorte lateral → faixa → close → poster final',2,4,'directional-poster',['headline gigante','composição dramática','alto contraste']),cards:[
{role:'cover',bg:'vinho',photos:[b(47,0,53,100,undefined,'poster_bleed')],headline:t(5,12,42,'headline gigante')},
{role:'content',bg:'off_white',photos:[b(0,7,65,86,'0 90px 90px 0','poster_left')],text:t(72,22,22,'copy curta')},
{role:'proof',bg:'preto',photos:[b(0,16,100,58,undefined,'poster_strip')],text:t(8,80,84,'frase impacto')},
{role:'content',bg:'bege',photos:[b(25,4,70,78,'120px 0 0 120px','poster_close')],text:t(6,20,23,'nota')},
{role:'cta',bg:'terracota',photos:[b(0,0,100,100,undefined,'poster_full')],cta:t(7,72,58,'CTA overlay')}]}
];

export function getInstagramTemplate(id:string){return INSTAGRAM_45PLUS_LIBRARY.find((template)=>template.id===id)??INSTAGRAM_45PLUS_LIBRARY[0];}
export function getInstagramTemplateCard(id:string,index:number){const template=getInstagramTemplate(id);return template.cards[index%template.cards.length];}
