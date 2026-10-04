import { UI } from './icons';
import { LEVELS, MAX_LEVEL } from './data';
import type { Save } from './state';

export type SceneName = 'menu' | 'customize' | 'day' | 'summary' | 'shop' | 'story';
export type App = {
  stage: HTMLElement;
  save: Save;
  go: (scene: SceneName, data?: unknown) => void;
  persist: () => void;
};

/** Largura fixa do palco; a altura varia com o aparelho (veja fit() em main.ts). */
export const STAGE_W = 720, STAGE_MIN_H = 1280, STAGE_MAX_H = 1700;
export const stageH = (stage: HTMLElement) => stage.offsetHeight || 1600;

export const clientSrc = (name: string) => `sprites/clientes/${name}.png`;
export const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
export const rand = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
export const fmt = (n: number) => Math.round(n).toLocaleString('pt-BR');

export function el(html: string): HTMLElement {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild as HTMLElement;
}

export function levelProgress(save: Save) {
  const cur = LEVELS[save.level - 1];
  const next = LEVELS[save.level];
  if (!next || save.level >= MAX_LEVEL) return { cur, next, frac: 1 };
  return { cur, next, frac: Math.min(1, (save.love - cur.love) / (next.love - cur.love)) };
}

export function lovePill(save: Save, extraLove = 0) {
  const s = { ...save, love: save.love + extraLove };
  const { frac } = levelProgress(s);
  return `<span class="pill" data-hud="love">${UI.heart}<span class="bar"><i style="width:${frac * 100}%"></i></span><small>Nv ${save.level} · ${LEVELS[save.level - 1].name}</small></span>`;
}

export function toast(stage: HTMLElement, text: string, ms = 1800) {
  stage.querySelectorAll('.toast').forEach(t => t.remove());
  const t = el(`<div class="abs toast">${text}</div>`);
  stage.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

export function banner(stage: HTMLElement, text: string, ms = 1600) {
  const b = el(`<div class="abs banner">${text}</div>`);
  stage.appendChild(b);
  setTimeout(() => b.remove(), ms);
}

export function floatText(stage: HTMLElement, x: number, y: number, html: string) {
  const f = el(`<div class="abs float" style="left:${x}px;top:${y}px">${html}</div>`);
  stage.appendChild(f);
  f.animate([{ transform: 'translate(-50%,0) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-30px) scale(1.1)', opacity: 1, offset: 0.25 }, { transform: 'translate(-50%,-80px) scale(1)', opacity: 0 }], { duration: 1300, easing: 'ease-out' });
  setTimeout(() => f.remove(), 1300);
}

export function fly(stage: HTMLElement, svg: string, from: { x: number; y: number }, to: { x: number; y: number }, delay = 0) {
  const p = el(`<div class="abs particle" style="left:${from.x - 17}px;top:${from.y - 17}px">${svg}</div>`);
  stage.appendChild(p);
  const dx = to.x - from.x, dy = to.y - from.y;
  const a = p.animate([
    { transform: 'translate(0,0) scale(.4)', opacity: 0 },
    { transform: `translate(${dx * 0.15}px,${-60}px) scale(1.1)`, opacity: 1, offset: 0.3 },
    { transform: `translate(${dx}px,${dy}px) scale(.7)`, opacity: 1 },
  ], { duration: 750, delay, easing: 'cubic-bezier(.5,0,.6,1)', fill: 'both' });
  a.onfinish = () => p.remove();
}

/** Posição de um elemento em coordenadas do palco (720 de largura), descontando a escala. */
export function stagePos(stage: HTMLElement, node: Element) {
  const s = stage.getBoundingClientRect(), r = node.getBoundingClientRect();
  const k = s.width / STAGE_W;
  return { x: (r.left - s.left + r.width / 2) / k, y: (r.top - s.top + r.height / 2) / k, w: r.width / k, h: r.height / k };
}

export function confirmBox(stage: HTMLElement, title: string, text: string, yes: string, no = 'Cancelar') {
  return new Promise<boolean>(res => {
    const o = el(`<div class="overlay"><div class="panel" style="width:620px;text-align:center">
      <h2>${title}</h2><p style="font-family:var(--fb);font-size:22px;font-weight:600;margin:0 0 24px">${text}</p>
      <div class="row"><button class="btn white" data-a="no">${no}</button><button class="btn" data-a="yes">${yes}</button></div></div></div>`);
    o.addEventListener('click', e => {
      const a = (e.target as HTMLElement).closest('[data-a]')?.getAttribute('data-a');
      if (!a) return;
      o.remove(); res(a === 'yes');
    });
    stage.appendChild(o);
  });
}
