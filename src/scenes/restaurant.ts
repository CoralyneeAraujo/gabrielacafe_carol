import { heartPath } from '../chibi';
import { RECIPES } from '../data';
import { PERSONAL } from '../personal';
import { upg, type Save } from '../state';

const L = '#4A2C2A';
export const DECO = {
  planta: `<svg viewBox="0 0 100 140"><path d="M50 92C20 90 4 60 12 34C30 40 48 62 50 92ZM50 92C80 90 96 60 88 34C70 40 52 62 50 92ZM50 90C40 60 42 30 50 10C58 30 60 60 50 90Z" fill="#6DB04B" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><path d="M30 60Q38 70 46 84M70 60Q62 70 54 84" stroke="#4E8A33" stroke-width="2.5" fill="none"/><path d="M26 92H74L68 136H32Z" fill="#E2895A" stroke="${L}" stroke-width="3" stroke-linejoin="round"/><path d="M24 92H76V102H24Z" fill="#D07448" stroke="${L}" stroke-width="3"/></svg>`,
  pendente: `<svg viewBox="0 0 100 160"><path d="M15 0Q20 50 50 60Q80 50 85 0" fill="none" stroke="#4E8A33" stroke-width="3"/><g fill="#6DB04B" stroke="${L}" stroke-width="2"><ellipse cx="22" cy="40" rx="9" ry="5" transform="rotate(40 22 40)"/><ellipse cx="78" cy="40" rx="9" ry="5" transform="rotate(-40 78 40)"/><ellipse cx="34" cy="70" rx="9" ry="5" transform="rotate(70 34 70)"/><ellipse cx="66" cy="74" rx="9" ry="5" transform="rotate(-70 66 74)"/><ellipse cx="50" cy="100" rx="9" ry="5" transform="rotate(90 50 100)"/></g><path d="M30 0H70L64 22H36Z" fill="#E2895A" stroke="${L}" stroke-width="3"/></svg>`,
  quadro: `<svg viewBox="0 0 120 100"><rect x="4" y="4" width="112" height="92" rx="6" fill="#FFF6EE" stroke="#9A6440" stroke-width="8"/><path d="M14 86Q40 54 60 70Q80 50 106 86Z" fill="#F7C1CF"/><circle cx="46" cy="52" r="10" fill="#2B1D19"/><circle cx="74" cy="52" r="12" fill="#3A2620"/><circle cx="46" cy="54" r="7" fill="#EDB892"/><circle cx="74" cy="54" r="7" fill="#F2C8A8"/>${heartPath(60, 30, 1.2, '#F2738C')}</svg>`,
  flores: `<svg viewBox="0 0 50 50"><path d="M18 30h14l-2 18H20z" fill="#DFF3F7" stroke="${L}" stroke-width="2.5"/><path d="M25 30V16M25 30L16 18M25 30l9-12" stroke="#4E8A33" stroke-width="2.5"/>${[[25, 12, '#F2738C'], [15, 16, '#FFB38A'], [35, 16, '#B7A6E8']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="6" fill="${c}" stroke="${L}" stroke-width="2"/>`).join('')}</svg>`,
  vela: `<svg viewBox="0 0 50 50"><ellipse cx="25" cy="12" rx="10" ry="12" fill="rgba(255,214,107,.45)"/><path d="M25 4Q30 12 25 18Q20 12 25 4Z" fill="#FFB238" stroke="${L}" stroke-width="1.5"/><rect x="19" y="18" width="12" height="26" rx="3" fill="#FFF6EE" stroke="${L}" stroke-width="2.5"/></svg>`,
};

/** Quadro do menu: cresce com o cardápio, preso pela base (acima do rodapé) e sem subir até o placar do topo. */
export function menuBoard(save: Save, x: number, bottomY: number) {
  const list = RECIPES.filter(r => r.level <= save.level);
  const rows = list.map(r => `<div class="row"><span>${r.name}</span><span>${r.price}</span></div>`).join('');
  const room = bottomY - 150;                       // espaço entre o placar (HUD) e o rodapé
  const fs = Math.max(10, Math.min(14, (room - 70) / (list.length * 1.25)));
  return `<div class="abs r-board" style="left:${x}px;top:${bottomY}px;transform:translateY(-100%);font-size:${fs.toFixed(1)}px"><b>MENU ♡</b>${rows}</div>`;
}

/** Salão em pé: parede com porta, janelas e quadro do menu; o chão vai até o fim da tela. */
export function restaurantHTML(save: Save, wallH: number, H: number) {
  const has = (id: string) => upg(save, id) > 0;
  const sign = has('placa') ? `${PERSONAL.nomeDela} &amp; ${PERSONAL.seuNome}` : PERSONAL.nomeRestaurante;
  const w = wallH; // tudo na parede é posicionado a partir do rodapé
  return `
  <div class="abs r-wall" style="height:${w}px"></div>
  ${has('luzinhas') ? `<div class="abs r-lights" style="top:${Math.max(150, w - 520)}px"></div>` : ''}
  <div class="abs r-win" style="left:150px;top:${w - 330}px"></div>
  <div class="abs r-win" style="left:540px;top:${w - 330}px"></div>
  ${menuBoard(save, 318, w - 95)}
  ${has('quadro') ? `<div class="abs" style="left:363px;top:${w - 460}px;width:110px">${DECO.quadro}</div>` : ''}
  <div class="abs r-shelf" style="top:${w - 400}px"></div>
  <div class="abs" style="left:590px;top:${w - 500}px;width:70px">${DECO.planta}</div>
  <div class="abs" style="left:160px;top:${w - 440}px;width:80px">${DECO.pendente}</div>
  ${has('planta') ? `<div class="abs" style="left:600px;top:${w - 140}px;width:110px;z-index:3">${DECO.planta}</div>` : ''}
  ${has('luminarias') ? `<div class="abs r-lamp" style="left:195px;top:${w - 470}px"><i></i><b></b></div><div class="abs r-lamp" style="left:585px;top:${w - 470}px"><i></i><b></b></div>` : ''}
  <div class="abs r-wains" style="top:${w - 80}px"></div>
  <div class="abs r-floor" style="top:${w}px;height:${H - w}px"></div>
  <div class="abs r-door" style="top:${w - 235}px"></div>
  <div class="abs r-sign" style="top:${w - 290}px">${sign}</div>`;
}

export function tableDeco(save: Save) {
  if (upg(save, 'velas')) return DECO.vela;
  if (upg(save, 'flores')) return DECO.flores;
  return '';
}

/** Céu da janela ao longo do dia: manhã → tarde → pôr do sol (ou noite no nível 5+). */
export function skyAt(frac: number, night: boolean) {
  if (night) return 'linear-gradient(#2E2A5C, #6B5BA8 60%, #F7A9B8)';
  const stops = [
    ['#9FD8F0', '#E8F6FB'],
    ['#FFD27A', '#FFF1CC'],
    ['#FF9E7A', '#FFD6A8'],
    ['#B98AD9', '#FFB38A'],
  ];
  const i = Math.min(stops.length - 1, Math.floor(frac * stops.length));
  return `linear-gradient(${stops[i][0]}, ${stops[i][1]})`;
}
