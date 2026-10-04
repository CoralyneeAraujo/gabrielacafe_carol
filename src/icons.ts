// Ícones vetoriais de comida, estações e interface. Itens usam viewBox 0 0 40 40; pratos montados, 0 0 100 100.
import { heartPath } from './chibi';

const L = '#4A2C2A';
const sv = (inner: string, vb = '0 0 40 40') => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
const st = (w = 2.5) => `stroke="${L}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

export const UI = {
  coin: sv(`<circle cx="20" cy="20" r="16" fill="#F2C230" stroke="#B8860B" stroke-width="3"/><circle cx="20" cy="20" r="10" fill="none" stroke="#FFE17A" stroke-width="2.5"/><path d="M20 14v12" stroke="#B8860B" stroke-width="3" stroke-linecap="round"/>`),
  star: sv(`<polygon points="20,4 24.7,14.6 36,15.6 27.4,23 30,34 20,28.2 10,34 12.6,23 4,15.6 15.3,14.6" fill="#F2C230" stroke="#B8860B" stroke-width="2.5" stroke-linejoin="round"/>`),
  starOff: sv(`<polygon points="20,4 24.7,14.6 36,15.6 27.4,23 30,34 20,28.2 10,34 12.6,23 4,15.6 15.3,14.6" fill="#7A6460" stroke="#5A4643" stroke-width="2.5" stroke-linejoin="round"/>`),
  heart: sv(heartPath(20, 22, 1.9, '#F2738C', '#C2405E', 2.5)),
  clock: sv(`<circle cx="20" cy="20" r="15" fill="#fff" stroke="${L}" stroke-width="3"/><path d="M20 11v9l6 4" fill="none" stroke="${L}" stroke-width="3" stroke-linecap="round"/>`),
  lock: sv(`<rect x="10" y="18" width="20" height="15" rx="4" fill="#B9A49A"/><path d="M14 18v-4a6 6 0 0 1 12 0v4" fill="none" stroke="#B9A49A" stroke-width="3.5"/>`),
  gear: sv(`<circle cx="20" cy="20" r="6" fill="none" stroke="#fff" stroke-width="3.5"/><path d="M20 5v5M20 30v5M5 20h5M30 20h5M9.4 9.4l3.5 3.5M27.1 27.1l3.5 3.5M9.4 30.6l3.5-3.5M27.1 12.9l3.5-3.5" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>`),
  pause: sv(`<rect x="12" y="10" width="6" height="20" rx="2" fill="#fff"/><rect x="22" y="10" width="6" height="20" rx="2" fill="#fff"/>`),
};

export const ITEM_ICON: Record<string, string> = {
  carne: sv(`<ellipse cx="20" cy="22" rx="15" ry="8" fill="#8B4A2B" ${st()}/><path d="M11 20h4M18 19h4M25 20h4" stroke="#5E2F1A" stroke-width="2" stroke-linecap="round"/>`),
  pao: sv(`<path d="M5 22Q5 8 20 8Q35 8 35 22Z" fill="#E8A955" ${st()}/><rect x="5" y="23" width="30" height="7" rx="3.5" fill="#F2C27A" ${st()}/><g fill="#FFF3D6"><ellipse cx="14" cy="15" rx="1.6" ry="1"/><ellipse cx="21" cy="12" rx="1.6" ry="1"/><ellipse cx="27" cy="16" rx="1.6" ry="1"/></g>`),
  queijo: sv(`<path d="M6 13L34 13L31 28L9 28Z" fill="#FFD34D" ${st()}/><circle cx="15" cy="19" r="2" fill="#F2B925"/><circle cx="25" cy="22" r="2.5" fill="#F2B925"/>`),
  alface: sv(`<path d="M5 24Q8 12 14 16Q17 8 22 14Q28 8 30 16Q36 14 35 24Q20 30 5 24Z" fill="#7CC35A" ${st()}/><path d="M12 22Q20 18 28 22" stroke="#4E8A33" stroke-width="2" fill="none"/>`),
  tomate: sv(`<circle cx="20" cy="21" r="13" fill="#E84A3A" ${st()}/><circle cx="20" cy="21" r="8" fill="#FF7A66"/><g fill="#FFE1A6"><circle cx="16" cy="19" r="1.5"/><circle cx="24" cy="19" r="1.5"/><circle cx="20" cy="25" r="1.5"/></g>`),
  batata: sv(`<path d="M12 8l2 14M17 6l1 16M22 7l-1 15M27 8l-2 14" stroke="#F2C230" stroke-width="4.5" stroke-linecap="round"/><path d="M8 18H32L29 35H11Z" fill="#E8476A" ${st()}/>${heartPath(20, 26, 0.7, '#fff')}`),
  cafe: sv(`<path d="M14 12c0-3 3-3 3-6M21 12c0-3 3-3 3-6" fill="none" stroke="#C9A79A" stroke-width="2" stroke-linecap="round"/><path d="M8 15h20v9a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8z" fill="#fff" ${st()}/><path d="M28 18h3a4 4 0 0 1 0 8h-3" fill="none" ${st()}/><ellipse cx="18" cy="15.5" rx="8.5" ry="2" fill="#8A5A3C"/>`),
  suco: sv(`<path d="M11 10H29L26 35H14Z" fill="#FFB238" ${st()}/><path d="M12 15H28" stroke="#FFD27A" stroke-width="3"/><path d="M24 4L21 20" stroke="#F2738C" stroke-width="3" stroke-linecap="round"/><circle cx="29" cy="10" r="6" fill="#FFB238" ${st(2)}/><path d="M29 6v8M25 10h8" stroke="#FFE1A6" stroke-width="1.5"/>`),
  panqueca: sv(`<ellipse cx="20" cy="22" rx="16" ry="8" fill="#F3B76B" ${st()}/><ellipse cx="20" cy="20" rx="11" ry="4" fill="#F8CC8A"/>`),
  calda: sv(`<rect x="13" y="13" width="14" height="22" rx="5" fill="#C2405E" ${st()}/><rect x="16" y="5" width="8" height="9" rx="2" fill="#fff" ${st()}/><path d="M16 22h8" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>`),
  morango: sv(`<path d="M20 35C9 28 8 18 12 14C15 11 25 11 28 14C32 18 31 28 20 35Z" fill="#E8476A" ${st()}/><path d="M12 13L20 8L28 13L20 16Z" fill="#6DB04B" ${st(2.2)}/><g fill="#FFE1A6"><circle cx="16" cy="20" r="1.2"/><circle cx="23" cy="21" r="1.2"/><circle cx="19" cy="26" r="1.2"/><circle cx="25" cy="27" r="1.2"/></g>`),
  milkshake: sv(`<path d="M24 2L22 14" stroke="#F2738C" stroke-width="3" stroke-linecap="round"/><path d="M11 12Q20 4 29 12Z" fill="#FFF8F0" ${st()}/><path d="M11 12H29L26 36H14Z" fill="#FFD3DC" ${st()}/><path d="M12 18H28" stroke="#fff" stroke-width="2.5" opacity=".7"/>`),
};

export const STATION_ICON: Record<string, string> = {
  chapa: sv(`<rect x="4" y="14" width="32" height="14" rx="3" fill="#5A4643" ${st()}/><path d="M9 18h22M9 22h22" stroke="#8C7470" stroke-width="2"/><path d="M8 28v6M32 28v6" ${st(3)}/><path d="M12 10q2-3 0-6M20 10q2-3 0-6M28 10q2-3 0-6" stroke="#C9B6AC" stroke-width="2" fill="none" stroke-linecap="round"/>`),
  fritadeira: sv(`<rect x="5" y="14" width="30" height="21" rx="4" fill="#C9CED6" ${st()}/><rect x="9" y="17" width="22" height="7" rx="2" fill="#F2C230" ${st(2)}/><path d="M14 17V9h12v8M26 11h7" fill="none" ${st(2.2)}/><circle cx="12" cy="30" r="1.8" fill="${L}"/><circle cx="18" cy="30" r="1.8" fill="${L}"/>`),
  cafeteira: sv(`<rect x="7" y="5" width="26" height="10" rx="4" fill="#B7A6E8" ${st()}/><rect x="9" y="15" width="22" height="19" rx="3" fill="#fff" ${st()}/><path d="M17 15v5h6v-5" fill="none" ${st(2.2)}/><rect x="15" y="25" width="10" height="7" rx="2" fill="#8A5A3C" ${st(2)}/>`),
  frigideira: sv(`<ellipse cx="17" cy="22" rx="13" ry="9" fill="#5A4643" ${st()}/><ellipse cx="17" cy="20.5" rx="9" ry="5" fill="#7A6460"/><path d="M29 20L38 15" stroke="#9A6440" stroke-width="5" stroke-linecap="round"/>`),
  liquidificador: sv(`<path d="M12 6H28L26 26H14Z" fill="#DFF3F7" ${st()}/><path d="M14 16H26" stroke="#FFD3DC" stroke-width="7"/><rect x="11" y="26" width="18" height="9" rx="3" fill="#F2738C" ${st()}/><rect x="15" y="3" width="10" height="4" rx="2" fill="#5A4643"/>`),
  lixeira: sv(`<path d="M10 12H30L28 35H12Z" fill="#9BB3A8" ${st()}/><path d="M7 12H33M16 8h8" ${st(3)}/><path d="M16 17v13M20 17v13M24 17v13" stroke="#6E8A7E" stroke-width="2"/>`),
};

// ---- prato montado ------------------------------------------------------
const plate = `<ellipse cx="50" cy="86" rx="44" ry="10" fill="#fff" stroke="${L}" stroke-width="3"/><ellipse cx="50" cy="84" rx="32" ry="6" fill="#F4ECE6"/>`;
const coaster = `<ellipse cx="50" cy="90" rx="30" ry="6" fill="#E8D6C8" stroke="${L}" stroke-width="2.5"/>`;

export function dishSVG(items: string[]) {
  const has = (i: string) => items.includes(i);
  let s = '';
  if (items.length === 0) return sv(plate, '0 0 100 100');
  if (has('pao') || has('carne')) {
    s += plate;
    let y = 84;
    const layer = (hgt: number, draw: (top: number) => string) => { s += draw(y - hgt); y -= hgt; };
    if (has('pao')) layer(10, t => `<rect x="18" y="${t}" width="64" height="11" rx="5" fill="#F2C27A" stroke="${L}" stroke-width="2.5"/>`);
    if (has('carne')) layer(10, t => `<rect x="15" y="${t}" width="70" height="11" rx="5.5" fill="#8B4A2B" stroke="${L}" stroke-width="2.5"/>`);
    if (has('queijo')) layer(5, t => `<path d="M16 ${t}H84L80 ${t + 6}L74 ${t + 12}L70 ${t + 6}H34L28 ${t + 12}L24 ${t + 6}Z" fill="#FFD34D" stroke="${L}" stroke-width="2"/>`);
    if (has('alface')) layer(6, t => `<path d="M14 ${t + 6}Q20 ${t - 2} 26 ${t + 4}Q32 ${t - 3} 38 ${t + 4}Q44 ${t - 3} 50 ${t + 4}Q56 ${t - 3} 62 ${t + 4}Q68 ${t - 3} 74 ${t + 4}Q80 ${t - 2} 86 ${t + 6}Z" fill="#7CC35A" stroke="${L}" stroke-width="2"/>`);
    if (has('tomate')) layer(6, t => `<rect x="22" y="${t}" width="25" height="7" rx="3.5" fill="#E84A3A" stroke="${L}" stroke-width="2"/><rect x="53" y="${t}" width="25" height="7" rx="3.5" fill="#E84A3A" stroke="${L}" stroke-width="2"/>`);
    if (has('pao')) {
      const t = y;
      s += `<path d="M18 ${t + 1}Q18 ${t - 26} 50 ${t - 26}Q82 ${t - 26} 82 ${t + 1}Z" fill="#E8A955" stroke="${L}" stroke-width="2.5"/>` +
        `<g fill="#FFF3D6"><ellipse cx="38" cy="${t - 14}" rx="2.5" ry="1.5"/><ellipse cx="52" cy="${t - 19}" rx="2.5" ry="1.5"/><ellipse cx="64" cy="${t - 12}" rx="2.5" ry="1.5"/><ellipse cx="46" cy="${t - 8}" rx="2.5" ry="1.5"/></g>`;
    }
  } else if (has('panqueca')) {
    s += plate;
    for (let i = 0; i < 3; i++) s += `<rect x="${20 + i}" y="${70 - i * 11}" width="${60 - i * 2}" height="12" rx="6" fill="#F3B76B" stroke="${L}" stroke-width="2.5"/>`;
    if (has('calda')) s += `<path d="M24 50Q50 42 76 50L74 58Q70 55 66 63Q62 55 56 60Q50 54 44 62Q38 55 32 59Q28 54 26 57Z" fill="#C2405E" stroke="${L}" stroke-width="2"/>`;
    if (has('morango')) s += `<g transform="translate(36 22) scale(.75)">${ITEM_ICON.morango.replace(/<\/?svg[^>]*>/g, '')}</g>`;
  } else if (has('milkshake')) {
    s += coaster + `<path d="M58 8L54 34" stroke="#F2738C" stroke-width="5" stroke-linecap="round"/><path d="M30 32Q50 14 70 32Z" fill="#FFF8F0" stroke="${L}" stroke-width="3"/><path d="M30 32H70L64 88H36Z" fill="${has('morango') ? '#FFB3C4' : '#FFF1E0'}" stroke="${L}" stroke-width="3"/>`;
    if (has('morango')) s += `<g transform="translate(30 6) scale(.6)">${ITEM_ICON.morango.replace(/<\/?svg[^>]*>/g, '')}</g>`;
  } else {
    // itens únicos: café, suco, batata
    const id = items[0];
    s += (id === 'batata' ? plate : coaster) + `<g transform="translate(14 14) scale(1.8)">${(ITEM_ICON[id] || '').replace(/<\/?svg[^>]*>/g, '')}</g>`;
  }
  return sv(s, '0 0 100 100');
}
