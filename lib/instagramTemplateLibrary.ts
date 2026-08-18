export type Box={x:number;y:number;w:number;h:number;radius?:string;label?:string;shape?:string};
export type TextBox={x:number;y:number;w:number;kind?:string};
export type LibraryCard={bg?:string;photos:Box[];text?:TextBox;headline?:TextBox;cta?:TextBox;extraText?:TextBox[];number?:string;labels?:string[]};
export type LibraryTemplate={id:string;name:string;description:string;cards:LibraryCard[]};

export const LIBRARY_COLORS={off_white:'#F7F2EC',bege:'#E7D8CB',terracota:'#92533D',vinho:'#703C49',rose:'#D3A29A',marrom:'#493731',preto:'#25201E'} as const;
const P='COLOQUE SUA FOTO AQUI';
const b=(x:number,y:number,w:number,h:number,radius?:string,shape?:string):Box=>({x,y,w,h,radius,label:P,shape});
const t=(x:number,y:number,w:number,kind?:string):TextBox=>({x,y,w,kind});

export const INSTAGRAM_45PLUS_LIBRARY:LibraryTemplate[]=[
{id:'T01',name:'EDITORIAL PREMIUM',description:'Fotografia vertical forte combinada com tipografia de revista.',cards:[
{bg:'off_white',photos:[b(5,10,42,80,'0 80px 0 0','vertical')],text:t(53,24,40,'headline grande')},
{bg:'terracota',photos:[b(58,9,36,82,'40px','vertical')],text:t(7,20,43)},
{bg:'off_white',photos:[b(8,8,84,43,'30px','horizontal')],text:t(8,58,84)},
{bg:'vinho',photos:[b(7,18,40,66,'70px 20px','vertical')],text:t(53,22,39)},
{bg:'off_white',photos:[b(58,12,35,74,'20px 70px','vertical')],text:t(7,25,43,'CTA')}]},
{id:'T02',name:'HERO BEAUTY',description:'Uma fotografia dominante ocupa grande parte da composição.',cards:[
{bg:'bege',photos:[b(35,0,65,100,undefined,'foto_grande_vertical')],text:t(6,20,40)},
{bg:'off_white',photos:[b(0,0,100,58,undefined,'horizontal_grande')],text:t(8,65,84)},
{bg:'terracota',photos:[b(8,12,84,64,'90px','hero_central')],text:t(10,81,80)},
{bg:'off_white',photos:[b(0,22,65,72,undefined,'sangrado_esquerda')],text:t(69,28,25)},
{bg:'vinho',photos:[b(45,8,55,92,undefined,'sangrado_direita')],text:t(7,27,39)}]},
{id:'T03',name:'DUPLA EDITORIAL',description:'Duas fotografias criam comparação ou complementaridade.',cards:[
{photos:[b(6,10,40,67),b(54,23,40,67)],text:t(9,80,78)},
{photos:[b(7,9,41,47),b(53,9,40,47)],text:t(8,63,84)},
{photos:[b(8,16,34,68,'90px 0'),b(58,16,34,68,'0 90px')],text:t(39,36,22)},
{photos:[b(7,8,52,58),b(62,44,31,42)],text:t(8,71,47)},
{photos:[b(5,12,43,60),b(52,12,43,60)],text:t(8,78,84)}]},
{id:'T04',name:'COLAGEM MAGAZINE',description:'Três imagens em tamanhos assimétricos como editorial de revista.',cards:[
{photos:[b(7,8,48,65),b(61,10,31,32),b(61,48,31,31)],text:t(8,81,84)},
{photos:[b(8,15,30,48),b(42,7,50,42),b(46,55,40,35)],text:t(8,67,32)},
{photos:[b(6,8,88,40),b(7,55,38,34),b(55,55,38,34)]},
{photos:[b(7,10,36,75),b(49,10,44,35),b(57,51,35,34)]},
{photos:[b(8,15,27,46),b(37,8,27,53),b(66,15,27,46)],text:t(10,70,80)}]},
{id:'T05',name:'ANTES E DEPOIS',description:'Template específico para transformação de cabelo.',cards:[
{photos:[b(6,19,42,63),b(52,19,42,63)],headline:t(8,6,84),labels:['ANTES','DEPOIS']},
{photos:[b(7,8,45,84)],text:t(58,20,35,'O QUE MUDOU?')},
{photos:[b(8,10,38,43),b(54,10,38,43)],text:t(8,62,84)},
{photos:[b(14,8,72,58)],text:t(10,72,80)},
{photos:[b(8,16,36,53),b(56,16,36,53)],cta:t(10,75,80),labels:['ANTES','DEPOIS']}]},
{id:'T06',name:'ORGÂNICO FEMININO',description:'Arcos, curvas e molduras suaves para um visual acolhedor.',cards:[
{photos:[b(7,12,43,70,'50% 50% 18px 18px','arco')],text:t(55,24,37)},
{photos:[b(55,12,38,64,'50%','oval_vertical')],text:t(8,23,40)},
{photos:[b(14,9,72,52,'999px','capsula_horizontal')],text:t(10,69,80)},
{photos:[b(8,12,37,60,'50% 50% 18px 18px','arco'),b(61,36,28,37,'50%','circulo')],text:t(51,15,40)},
{photos:[b(57,14,36,68,'18px 18px 50% 50%','arco_invertido')],text:t(8,28,42)}]},
{id:'T07',name:'FOTO SANGRADA',description:'Imagens encostam ou ultrapassam visualmente as bordas.',cards:[
{photos:[b(42,0,58,100,undefined,'sangrado_direita')],text:t(6,25,39)},
{photos:[b(0,0,55,100,undefined,'sangrado_esquerda')],text:t(61,22,33)},
{photos:[b(0,0,100,55,undefined,'sangrado_superior')],text:t(8,63,84)},
{photos:[b(0,45,100,55,undefined,'sangrado_inferior')],text:t(8,10,84)},
{photos:[b(35,0,65,100,undefined,'sangrado_direita')],text:t(6,30,38)}]},
{id:'T08',name:'REVISTA 45+',description:'Composição inspirada em páginas de revista feminina.',cards:[
{photos:[b(45,8,48,83)],text:t(7,17,41,'capa_de_revista')},
{photos:[b(7,11,49,65),b(62,17,29,35)],text:t(61,59,31)},
{photos:[b(8,9,84,46)],extraText:[t(8,62,38),t(54,62,38)]},
{photos:[b(54,8,39,72),b(8,58,32,25)],text:t(8,15,38)},
{photos:[b(8,15,35,65)],text:t(50,25,42,'editorial_cta')}]},
{id:'T09',name:'VISAGISMO',description:'Foto do rosto como centro da análise, com áreas informativas ao redor.',cards:[
{photos:[b(27,24,46,52,'50%','oval')],headline:t(10,8,80)},
{photos:[b(8,15,43,66)],text:t(57,17,35)},
{photos:[b(50,13,42,65)],text:t(8,18,36)},
{photos:[b(8,14,37,53),b(55,14,37,53)],text:t(10,74,80)},
{photos:[b(31,9,38,55,'50%','oval')],cta:t(10,72,80)}]},
{id:'T10',name:'CATÁLOGO DE CORTES',description:'Ideal para apresentar várias opções numeradas.',cards:[
{photos:[b(6,30,27,46),b(36,23,28,53),b(67,30,27,46)],headline:t(8,7,84)},
{photos:[b(8,12,42,72)],number:'01',text:t(57,26,35)},
{photos:[b(50,12,42,72)],number:'02',text:t(8,26,35)},
{photos:[b(8,14,84,51)],number:'03',text:t(8,72,84)},
{photos:[b(8,16,25,43),b(37,16,25,43),b(66,16,25,43)],cta:t(10,69,80)}]},
{id:'T11',name:'FAIXA FOTOGRÁFICA',description:'Fotografias horizontais funcionam como faixas que atravessam o card.',cards:[
{photos:[b(0,34,100,38,undefined,'faixa_horizontal')],headline:t(8,8,84),text:t(8,78,84)},
{photos:[b(7,10,86,36)],text:t(8,55,84)},
{photos:[b(0,52,100,35)],text:t(8,12,84)},
{photos:[b(10,22,80,40,'100px')],text:t(10,69,80)},
{photos:[b(0,18,100,37)],cta:t(10,66,80)}]},
{id:'T12',name:'CLOSE BEAUTY',description:'Foco total em cabelo, rosto, textura, fios e detalhes.',cards:[
{photos:[b(38,5,57,90,undefined,'close_vertical')],headline:t(6,24,40)},
{photos:[b(8,8,84,58,undefined,'close_horizontal')],text:t(8,73,84)},
{photos:[b(7,12,50,77,undefined,'macro_vertical')],text:t(63,26,29)},
{photos:[b(43,10,50,72),b(8,54,27,27,'50%','circulo')],text:t(8,16,31)},
{photos:[b(26,8,48,61,'120px','close_central')],cta:t(10,76,80)}]}
];

export const MASTER_INSTRUCTION="Crie o layout seguindo exatamente o template selecionado. Todos os cards devem ter 1080x1350 px, proporção 4:5. Não gere pessoas automaticamente nos espaços destinados às fotografias. Cada área de imagem deve aparecer como um placeholder visível contendo literalmente 'COLOQUE SUA FOTO AQUI'. Preserve posição, proporção e formato das caixas. Não coloque títulos, textos, setas ou ornamentos importantes dentro dos placeholders. A composição deve ser sofisticada, feminina e contemporânea, direcionada a mulheres 45+, com estética editorial de beleza premium.";
