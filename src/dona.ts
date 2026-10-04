// A dona do restaurante, desenhada a partir da folha oficial
// (personagem_namorada_assets_corrigidos → tools/extract_dona.py → public/sprites/dona/).
// Corpo inteiro = uma das roupas da folha; reações e diálogos usam os rostinhos e as ações.
import { DONA_SPRITES } from './donaSprites';

export type Roupa = keyof typeof DONA_SPRITES.roupa;
export type Rosto = keyof typeof DONA_SPRITES.rosto | keyof typeof DONA_SPRITES.acao;

export const ROUPA_PADRAO: Roupa = 'padrao_restaurante';

// Noite e Pijama ficam de fora: são desenhos dela sentada, que não funcionam andando pelo restaurante.
export const ROUPAS: [Roupa, string][] = [
  ['padrao_restaurante', 'Padrão'], ['casual', 'Casual'], ['trabalhando', 'Trabalhando'],
  ['especial', 'Especial'], ['inverno', 'Inverno'], ['avental_alternativo', 'Avental alternativo'],
];

export const ROSTOS: [Rosto, string][] = [
  ['normal', 'Normal'], ['feliz', 'Feliz'], ['animada', 'Animada'], ['piscando', 'Piscando'], ['surpresa', 'Surpresa'],
  ['confusa', 'Confusa'], ['pensativa', 'Pensativa'], ['chateada', 'Chateada'], ['triste', 'Triste'],
  ['envergonhada', 'Envergonhada'], ['rindo', 'Rindo'],
  ['carinha_de_amor', 'Carinha de amor'], ['dormindo', 'Dormindo'], ['comendo', 'Comendo'], ['bebendo', 'Bebendo'],
  ['concentrada', 'Concentrada'], ['empolgada', 'Empolgada'], ['bravo_leve', 'Bravo leve'], ['assustada', 'Assustada'],
  ['curiosa', 'Curiosa'], ['seria', 'Séria'], ['apaixonada', 'Apaixonada'],
  ['acenando', 'Acenando'], ['vitoriosa', 'Vitoriosa'], ['dancando', 'Dançando'], ['apontando', 'Apontando'],
  ['com_menu', 'Com menu'], ['com_prato', 'Com prato'], ['digitando', 'Digitando'], ['escrevendo', 'Escrevendo'],
  ['usando_celular', 'Usando celular'], ['coracao', 'Coração'], ['pensando', 'Pensando'],
];

/** Roupas que só abrem num nível de Nossa história (nível 10: "novas roupas"). */
export const ROUPA_NIVEL: Partial<Record<Roupa, number>> = { especial: 10, inverno: 10, avental_alternativo: 10 };
export const roupaLiberada = (r: Roupa, level: number) => level >= (ROUPA_NIVEL[r] ?? 1);

export const isRoupa = (v: unknown): v is Roupa => ROUPAS.some(([id]) => id === v);
export const roupaSrc = (r: Roupa) => `sprites/dona/roupa_${r}.png`;
export const rostoSrc = (f: Rosto) => (f in DONA_SPRITES.acao ? `sprites/dona/acao_${f}.png` : `sprites/dona/rosto_${f}.png`);

/** Corpo inteiro, com a mesma escala para todas as roupas. */
export function donaBody(r: Roupa, scale = 0.8) {
  const [w, h] = DONA_SPRITES.roupa[r];
  return `<img class="dona" alt="" src="${roupaSrc(r)}" style="width:${Math.round(w * scale)}px;height:${Math.round(h * scale)}px">`;
}

export const donaFace = (f: Rosto) => `<img class="dona-face" alt="" src="${rostoSrc(f)}">`;

/** Pré-carrega tudo para os rostinhos não piscarem na primeira reação. */
export function preloadDona() {
  for (const [r] of ROUPAS) new Image().src = roupaSrc(r);
  for (const [f] of ROSTOS) new Image().src = rostoSrc(f);
}
