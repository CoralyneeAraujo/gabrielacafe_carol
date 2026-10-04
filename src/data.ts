// Regras e números do jogo. Ajuste aqui para mudar ritmo, preços e desbloqueios.

export type ItemDef = { id: string; name: string; family: string; starter: boolean; level: number };
export const ITEMS: Record<string, ItemDef> = {
  pao: { id: 'pao', name: 'Pão', family: 'burger', starter: true, level: 1 },
  carne: { id: 'carne', name: 'Carne', family: 'burger', starter: true, level: 1 },
  queijo: { id: 'queijo', name: 'Queijo', family: 'burger', starter: false, level: 4 },
  alface: { id: 'alface', name: 'Alface', family: 'burger', starter: false, level: 6 },
  tomate: { id: 'tomate', name: 'Tomate', family: 'burger', starter: false, level: 6 },
  batata: { id: 'batata', name: 'Batata', family: 'batata', starter: true, level: 1 },
  cafe: { id: 'cafe', name: 'Café', family: 'cafe', starter: true, level: 2 },
  suco: { id: 'suco', name: 'Suco', family: 'suco', starter: true, level: 2 },
  panqueca: { id: 'panqueca', name: 'Panqueca', family: 'panqueca', starter: true, level: 3 },
  calda: { id: 'calda', name: 'Calda', family: 'panqueca', starter: false, level: 3 },
  morango: { id: 'morango', name: 'Morango', family: 'panqueca|milkshake', starter: false, level: 3 },
  milkshake: { id: 'milkshake', name: 'Milkshake', family: 'milkshake', starter: true, level: 9 },
};

export type StationDef = { id: string; name: string; makes: string; time: number; level: number };
export const STATIONS: StationDef[] = [
  { id: 'chapa', name: 'Chapa', makes: 'carne', time: 5, level: 1 },
  { id: 'fritadeira', name: 'Fritadeira', makes: 'batata', time: 4, level: 1 },
  { id: 'cafeteira', name: 'Cafeteira', makes: 'cafe', time: 3, level: 2 },
  { id: 'frigideira', name: 'Frigideira', makes: 'panqueca', time: 5, level: 3 },
  { id: 'liquidificador', name: 'Liquidificador', makes: 'milkshake', time: 4, level: 9 },
];
export const BINS = ['pao', 'queijo', 'suco', 'alface', 'tomate', 'calda', 'morango'];
export const SPEED = [1, 0.78, 0.6, 0.45];

export type Recipe = { id: string; name: string; items: string[]; price: number; level: number };
export const RECIPES: Recipe[] = [
  { id: 'cafe', name: 'Café', items: ['cafe'], price: 6, level: 2 },
  { id: 'batata', name: 'Batata frita', items: ['batata'], price: 8, level: 1 },
  { id: 'hamburguer', name: 'Hambúrguer', items: ['pao', 'carne'], price: 12, level: 1 },
  { id: 'xburger', name: 'X-Burger', items: ['pao', 'carne', 'queijo'], price: 15, level: 4 },
  { id: 'suco', name: 'Suco', items: ['suco'], price: 7, level: 2 },
  { id: 'panquecas', name: 'Panquecas', items: ['panqueca', 'calda', 'morango'], price: 16, level: 3 },
  { id: 'xsalada', name: 'X-Salada', items: ['pao', 'carne', 'queijo', 'alface', 'tomate'], price: 20, level: 6 },
  { id: 'milkshake', name: 'Milkshake de morango', items: ['milkshake', 'morango'], price: 14, level: 9 },
];
export const recipeById = (id: string) => RECIPES.find(r => r.id === id)!;

export function matchRecipe(items: string[]): Recipe | undefined {
  if (!items.length) return undefined;
  return RECIPES.find(r => r.items.length === items.length && r.items.every(i => items.includes(i)));
}

export function canAdd(plate: string[], item: string): boolean {
  const def = ITEMS[item];
  if (plate.includes(item)) return false;
  if (plate.length === 0) return def.starter;
  const fam = ITEMS[plate[0]].family.split('|')[0];
  const sameFamily = def.family.split('|').includes(fam);
  if (!sameFamily) return false;
  // famílias de item único não aceitam mais nada
  return !['batata', 'cafe', 'suco'].includes(fam);
}

// Os 15 níveis de "Nossa história". `unlocks` é o que já existe no jogo;
// `soon` é o que ainda vai ser construído (aparece como "em breve" na trilha).
export type LevelDef = { n: number; emoji: string; name: string; love: number; unlocks: string[]; soon?: string[]; event: string };
export const LEVELS: LevelDef[] = [
  { n: 1, emoji: '🍔', name: 'Primeiro pedido', love: 0, unlocks: ['Restaurante minúsculo, 2 mesas', 'Hambúrguer e batata frita'], event: 'Tutorial + primeira cliente' },
  { n: 2, emoji: '☕', name: 'Só mais um café', love: 30, unlocks: ['Café e suco', 'Luminárias pendentes'], event: 'Primeiro bilhete misterioso' },
  { n: 3, emoji: '🥞', name: 'Deu fome', love: 75, unlocks: ['Panquecas', 'Frigideira'], soon: ['Sobremesa'], event: 'Nova cliente começa a pedir combinações estranhas' },
  { n: 4, emoji: '🍕', name: 'Agora complicou', love: 140, unlocks: ['X-Burger', 'Pedidos com 2 pratos'], soon: ['Pizza + forno novo'], event: 'Primeiro pedido grande' },
  { n: 5, emoji: '🍝', name: 'Não temos mesa', love: 230, unlocks: ['+2 mesas', 'Varal de luzinhas'], event: 'Restaurante começa a ficar cheio' },
  { n: 6, emoji: '😵', name: 'Quem inventou isso?', love: 350, unlocks: ['X-Salada (5 etapas)', 'Bancada maior'], event: 'Pedidos começam a exigir várias etapas' },
  { n: 7, emoji: '🎵', name: 'Coloca uma música aí', love: 500, unlocks: ['Modo noturno'], soon: ['Jukebox'], event: 'Clientes começam a dançar' },
  { n: 8, emoji: '🪴', name: 'Tá ficando bonito', love: 700, unlocks: ['Plantas, quadro de nós duas e flores'], soon: ['Varanda'], event: 'Aparece uma decoração que lembra vocês' },
  { n: 9, emoji: '🥤', name: 'Pedido em dobro', love: 950, unlocks: ['Milkshake de morango', 'Liquidificador', 'Velas: mesa para dois'], event: 'Primeiro evento especial de casal' },
  { n: 10, emoji: '👀', name: 'Eu conheço essa cliente...', love: 1250, unlocks: ['Novas roupas da Gabriela', 'Novas versões da cliente'], soon: ['Acessórios'], event: 'Começam a aparecer versões diferentes de você' },
  { n: 11, emoji: '😂', name: 'Isso não estava no cardápio', love: 1600, unlocks: [], soon: ['Ingredientes especiais', 'Pedidos secretos'], event: 'Pedidos secretos/absurdos começam a aparecer' },
  { n: 12, emoji: '🕵️', name: 'Tem alguma coisa estranha', love: 2000, unlocks: [], soon: ['Área secreta do restaurante'], event: 'Bilhetes começam a revelar pequenas memórias' },
  { n: 13, emoji: '🎁', name: 'Pedido especial', love: 2500, unlocks: ['Placa com os nossos nomes', 'O Pedido Especial: o combo do primeiro encontro'], soon: ['Item misterioso'], event: 'Surge o pedido mais importante do jogo' },
  { n: 14, emoji: '❤️', name: 'Mesa reservada', love: 3100, unlocks: ['Restaurante sempre à noite', 'Memória: fondue em Campos do Jordão'], event: 'Uma noite especial só para vocês duas' },
  { n: 15, emoji: '✨', name: 'Depois do expediente', love: 4000, unlocks: ['Restaurante completo + modo livre', 'Final secreto e a carta'], event: 'Final secreto + mensagem personalizada' },
];
export const MAX_LEVEL = LEVELS.length;
/** Nível em que o Pedido Especial aparece, e a partir do qual o restaurante fica sempre à noite. */
export const SPECIAL_LEVEL = 13, NIGHT_LEVEL = 7, ALWAYS_NIGHT_LEVEL = 14;
export function levelFromLove(love: number) {
  let n = 1;
  for (const l of LEVELS) if (love >= l.love) n = l.n;
  return n;
}

export type Upgrade = { id: string; tab: 'cozinha' | 'salao' | 'decoracao'; name: string; desc: string; costs: number[]; level: number; icon: string; patience?: number };
export const UPGRADES: Upgrade[] = [
  { id: 'speed_chapa', tab: 'cozinha', name: 'Chapa turbo', desc: 'A carne fica pronta mais rápido', costs: [60, 150, 300], level: 1, icon: 'chapa' },
  { id: 'speed_fritadeira', tab: 'cozinha', name: 'Fritadeira nova', desc: 'Batata pronta mais rápido', costs: [50, 130, 260], level: 1, icon: 'fritadeira' },
  { id: 'speed_cafeteira', tab: 'cozinha', name: 'Cafeteira italiana', desc: 'Café sai mais rápido', costs: [40, 110, 220], level: 2, icon: 'cafeteira' },
  { id: 'speed_frigideira', tab: 'cozinha', name: 'Frigideira antiaderente', desc: 'Panquecas mais rápidas', costs: [90, 200, 380], level: 3, icon: 'frigideira' },
  { id: 'speed_liquidificador', tab: 'cozinha', name: 'Liquidificador potente', desc: 'Milkshake mais rápido', costs: [110, 240, 420], level: 9, icon: 'liquidificador' },
  { id: 'mesas', tab: 'salao', name: 'Mesa extra', desc: '+1 cliente ao mesmo tempo', costs: [80], level: 1, icon: 'mesa' },
  { id: 'pratos', tab: 'salao', name: 'Bancada maior', desc: '+1 prato para montar', costs: [120], level: 6, icon: 'prato' },
  { id: 'planta', tab: 'decoracao', name: 'Costela-de-adão', desc: 'Clientes 5% mais pacientes', costs: [50], level: 8, icon: 'planta', patience: 0.05 },
  { id: 'quadro', tab: 'decoracao', name: 'Quadro de nós duas', desc: 'Clientes 5% mais pacientes', costs: [90], level: 8, icon: 'quadro', patience: 0.05 },
  { id: 'luminarias', tab: 'decoracao', name: 'Luminárias pendentes', desc: 'Luz quente, +5% paciência', costs: [140], level: 2, icon: 'luminaria', patience: 0.05 },
  { id: 'luzinhas', tab: 'decoracao', name: 'Varal de luzinhas', desc: 'Romântico, +5% paciência', costs: [180], level: 5, icon: 'luzinhas', patience: 0.05 },
  { id: 'flores', tab: 'decoracao', name: 'Flores nas mesas', desc: '+5% paciência', costs: [220], level: 8, icon: 'flores', patience: 0.05 },
  { id: 'velas', tab: 'decoracao', name: 'Velas', desc: 'Clima de jantar, +5% paciência', costs: [260], level: 9, icon: 'velas', patience: 0.05 },
  { id: 'placa', tab: 'decoracao', name: 'Placa com os nossos nomes', desc: 'O restaurante é de vocês', costs: [300], level: 13, icon: 'placa' },
];

// Sprites da cliente (recortados da concept sheet). Arquivo: public/sprites/clientes/<id>.png
export const CLIENT_SPRITES = [
  'normal', 'feliz', 'com_fome', 'impaciente', 'surpresa', 'apaixonada', 'brava', 'sonolenta', 'comemorando', 'joinha',
  'com_cafe', 'com_notebook', 'com_celular', 'pensativa', 'rindo', 'envergonhada', 'surpresa_feliz', 'triste',
  'desconfiada', 'ansiosa', 'muito_feliz', 'com_sacolas', 'camiseta_diferente', 'hoodie', 'de_touca', 'pedido_especial',
] as const;
export type ClientSprite = typeof CLIENT_SPRITES[number];
/** "Versões diferentes de você": só aparecem a partir do nível 10. */
export const VERSOES_NIVEL10: readonly ClientSprite[] = ['camiseta_diferente', 'hoodie', 'de_touca', 'com_sacolas'];

export type CustType = {
  id: string; level: number; weight: number; dishes: number; patience: number; tip: number; love: number;
  waiting: ClientSprite[]; walk: number; only?: string;
};
export const CUSTOMER_TYPES: CustType[] = [
  { id: 'normal', level: 1, weight: 6, dishes: 1, patience: 1, tip: 1, love: 1, walk: 1,
    waiting: ['normal', 'com_celular', 'com_notebook', 'pensativa', 'camiseta_diferente', 'hoodie', 'com_sacolas', 'de_touca', 'desconfiada'] },
  { id: 'sonolenta', level: 2, weight: 1, dishes: 1, patience: 1.2, tip: 1, love: 1, walk: 1.6, only: 'cafe', waiting: ['sonolenta'] },
  { id: 'faminta', level: 4, weight: 2, dishes: 2, patience: 1.3, tip: 1, love: 1, walk: 1, waiting: ['com_fome'] },
  { id: 'impaciente', level: 5, weight: 2, dishes: 1, patience: 0.7, tip: 2, love: 1, walk: 0.8, waiting: ['ansiosa'] },
  { id: 'apaixonada', level: 9, weight: 2, dishes: 1, patience: 1.1, tip: 1, love: 2, walk: 1, waiting: ['apaixonada', 'envergonhada'] },
];

export const DAY_LENGTH = 150; // segundos de expediente
/** Modo teste (Ajustes): dia curto, clientes chegando rápido e Amor multiplicado, para passar de fase depressa. */
export const TESTE = { dayLength: 20, spawnEvery: 1.2, love: 50, cook: 0.3 };
export const BASE_PATIENCE = 62; // segundos até a paciência zerar
