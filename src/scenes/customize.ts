// Tela "Visual": escolhe a roupa da dona entre as da folha oficial.
// Em cima, um cantinho do restaurante com a prévia grande; embaixo, o painel de roupas.
import { sfx } from '../audio';
import { PERSONAL } from '../personal';
import { heartPath } from '../chibi';
import { donaBody, ROUPA_NIVEL, ROUPAS, roupaLiberada, roupaSrc, type Roupa } from '../dona';
import { UI } from '../icons';
import { DECO } from './restaurant';
import { type App, el, toast } from '../ui';

const heart = (s: number, c = '#F2738C') => `<svg viewBox="0 0 40 40" style="width:${s}px;height:${s}px">${heartPath(20, 22, 1.7, c)}</svg>`;
const CHECK = `<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const BACK = `<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const SWAP = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h14l-4-4M20 16H6l4 4"/></svg>`;
const SHIRT = (fill: string) => `<svg viewBox="0 0 48 44"><path d="M17 4l-12 7 5 10 5-3v22h18V18l5 3 5-10-12-7c-1 4-4 6-7 6s-6-2-7-6z" fill="${fill}" stroke="#7A4B3A" stroke-width="3" stroke-linejoin="round"/></svg>`;
const ZOOM = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L20 20M10.5 7.5v6M7.5 10.5h6"/></svg>`;

const CSS = `
.vz { position:absolute; inset:0; background:linear-gradient(#F7E3D6, #FBEDE4); display:grid; grid-template-rows: 47% 1fr; }
.vz-scene { position:relative; overflow:hidden; background:linear-gradient(#7A4B3A, #A86D52 55%, #C48A68 72%, #B97B5A 72.2%, #D49A72); }
.vz-scene .wood { position:absolute; left:0; right:0; top:0; height:72%; background:repeating-linear-gradient(90deg, rgba(0,0,0,.06) 0 2px, transparent 2px 90px); }
.vz-scene .win { position:absolute; left:250px; top:150px; width:150px; height:200px; border-radius:75px 75px 8px 8px; border:9px solid #6B3F2C; background:linear-gradient(#FFE3B0, #FFC98E); box-shadow:0 0 70px 20px rgba(255,214,150,.35); }
.vz-scene .win::before { content:""; position:absolute; left:50%; top:0; bottom:0; width:6px; margin-left:-3px; background:#6B3F2C; }
.vz-scene .mirror { position:absolute; right:110px; top:170px; width:120px; height:250px; border-radius:60px 60px 10px 10px; border:10px solid #C9955E; background:linear-gradient(135deg, #FFE9D6, #F6C9B8 45%, #FFF3E8 52%, #EBC0AE); box-shadow:inset 0 0 0 3px #A8743F; }
.vz-scene .board { position:absolute; left:24px; top:300px; width:150px; height:180px; background:#3B3532; border:9px solid #8A5A3A; border-radius:8px; transform:rotate(-3deg); color:#F7E6DA; font-size:26px; line-height:1.05; text-align:center; padding-top:16px; font-weight:500; }
.vz-scene .board small { display:block; margin-top:14px; font-size:30px; opacity:.85; }
.vz-scene .plant { position:absolute; }
.vz-scene .rug { position:absolute; left:50%; bottom:22px; width:360px; height:74px; margin-left:-150px; border-radius:50%; background:radial-gradient(ellipse at center, #F7A9B8 0 58%, #E98CA0 59% 64%, #F7A9B8 65%); box-shadow:0 6px 0 rgba(120,50,60,.25); }
.vz-scene .ch { position:absolute; left:50%; bottom:46px; margin-left:30px; transform:translateX(-50%); transform-origin:50% 100%; transition: transform .25s; }
.vz-scene .ch.zoom { transform:translateX(-50%) scale(1.22); }
.vz-scene .ch img.dona { display:block; transform-origin:50% 100%; animation: breathe 2.2s ease-in-out infinite; }
.vz-head { position:absolute; left:20px; right:20px; top:34px; display:flex; align-items:center; gap:14px; z-index:5; }
.vz-head h1 { margin:0; flex:1; display:flex; align-items:center; gap:10px; color:#fff; font-size:46px; font-weight:600; text-shadow:0 3px 0 rgba(74,44,42,.35); }
.vz-head h1 svg { width:58px; height:54px; }
.vz-back { width:76px; height:76px; border-radius:24px; border:0; background:#FBE9DA; color:#7A4B3A; box-shadow:0 5px 0 #D9B8A2; display:grid; place-items:center; cursor:pointer; }
.vz-back svg { width:38px; height:38px; }
.vz-save { border:0; border-radius:26px; background:#F2738C; color:#fff; font-family:var(--fd); font-weight:600; font-size:30px; padding:12px 26px 14px 20px; display:flex; align-items:center; gap:10px; box-shadow:0 6px 0 #D24F6C; cursor:pointer; }
.vz-save svg { width:34px; height:34px; }
.vz-back:active, .vz-save:active, .vz-side button:active { transform:translateY(4px); box-shadow:none; }
.vz-name { position:absolute; left:28px; top:136px; z-index:4; background:#FBEDE2; border:3px solid #E6CDBB; border-radius:18px; padding:12px 20px 14px; box-shadow:0 6px 0 rgba(74,44,42,.18); transform:rotate(-1.5deg); }
.vz-name b { display:flex; align-items:center; gap:10px; font-size:42px; font-weight:600; line-height:1.1; }
.vz-name span { display:block; font-family:var(--fb); font-weight:700; font-size:17px; color:#6E4E44; max-width:230px; margin-top:4px; }
.vz-side { position:absolute; right:18px; bottom:70px; display:grid; gap:14px; z-index:4; }
.vz-side button { width:96px; border:0; border-radius:22px; background:#FFF6EF; color:#7A4B3A; box-shadow:0 5px 0 #D9B8A2; padding:12px 4px 10px; display:grid; justify-items:center; gap:4px; font-family:var(--fd); font-size:15px; line-height:1.1; cursor:pointer; }
.vz-side button svg { width:36px; height:36px; color:#C9955E; }
.vz-side button.on { background:#FFE3EA; }
.vz-panel { margin:-26px 18px 24px; position:relative; z-index:6; background:#FDF3EC; border-radius:28px; box-shadow:0 8px 24px rgba(74,44,42,.12); padding:18px 18px 22px; display:grid; grid-template-rows:auto 1fr; gap:16px; min-height:0; }
.vz-panel header { display:flex; align-items:center; justify-content:space-between; }
.vz-chip { display:flex; align-items:center; gap:10px; background:#F9DCE2; border-radius:999px; padding:6px 26px 6px 16px; font-size:30px; font-weight:600; }
.vz-chip svg { width:42px; height:38px; }
.vz-count { background:#F9DCE2; color:#C2405E; border-radius:999px; padding:6px 16px; font-size:18px; font-weight:500; }
.vz-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; align-content:start; overflow:auto; min-height:0; padding:6px 6px 0 0; }
.vz-grid button { position:relative; border:3px solid transparent; background:#F8E7DD; border-radius:20px; padding:12px 2px 10px; display:grid; justify-items:center; align-content:end; gap:6px; font-family:var(--fd); font-size:17px; line-height:1.1; color:var(--cocoa); cursor:pointer; box-shadow:inset 0 0 0 1px #EFD6C8; }
.vz-grid button img { height:180px; width:auto; max-width:100%; object-fit:contain; }
.vz-grid button.on { border-color:#F2738C; background:#FCE6EA; }
.vz-grid button .ok { position:absolute; right:-6px; top:-6px; width:42px; height:42px; border-radius:50%; background:#F2738C; color:#fff; display:none; place-items:center; box-shadow:0 3px 0 #D24F6C; }
.vz-grid button.on .ok { display:grid; }
.vz-grid button .ok svg { width:26px; height:26px; }
.vz-grid button.lock img { filter: brightness(.25) opacity(.35); }
.vz-grid button.lock .lk { position:absolute; left:50%; top:62px; width:46px; margin-left:-23px; }
.vz-grid button.lock small { font-family:var(--fb); font-weight:700; font-size:13px; color:#A8968E; }
`;

export function customizeScene(app: App) {
  const { stage, save } = app;
  if (!document.getElementById('vz-css')) { const s = document.createElement('style'); s.id = 'vz-css'; s.textContent = CSS; document.head.appendChild(s); }
  let roupa: Roupa = save.roupa;

  const root = el(`<div class="vz">
    <div class="vz-scene">
      <div class="wood"></div><div class="win"></div><div class="mirror"></div>
      <div class="plant" style="left:180px;top:250px;width:80px">${DECO.pendente}</div>
      <div class="plant" style="right:30px;top:330px;width:96px">${DECO.planta}</div>
      <div class="board">Gabi's<br>Restaurant<small>♡ ☕</small></div>
      <div class="vz-head">
        <button class="vz-back" data-a="back" aria-label="Voltar">${BACK}</button>
        <h1>${SHIRT('#FFD6E0')}Visual</h1>
        <button class="vz-save" data-a="save">${CHECK}Salvar</button>
      </div>
      <div class="vz-name"><b>${PERSONAL.nomeDela} ${heart(32)}</b><span>Escolha o visual da sua personagem!</span></div>
      <div class="rug"></div><div class="ch"></div>
      <div class="vz-side">
        <button data-a="random">${SWAP}Trocar<br>visual</button>
        <button data-a="zoom">${ZOOM}Zoom</button>
      </div>
    </div>
    <div class="vz-panel">
      <header><div class="vz-chip">${SHIRT('#FFF6EF')}Roupas</div><div class="vz-count">${ROUPAS.length} visuais</div></header>
      <div class="vz-grid">${ROUPAS.map(([id, n]) => roupaLiberada(id, save.level)
        ? `<button data-r="${id}"><span class="ok">${CHECK}</span><img alt="" src="${roupaSrc(id)}">${n}</button>`
        : `<button class="lock" data-lock="${ROUPA_NIVEL[id]}"><img alt="" src="${roupaSrc(id)}"><span class="lk">${UI.lock}</span>${n}<small>Nível ${ROUPA_NIVEL[id]}</small></button>`).join('')}</div>
    </div></div>`);
  stage.appendChild(root);
  const ch = root.querySelector('.ch') as HTMLElement;

  function render() {
    ch.innerHTML = donaBody(roupa, 1.45);
    ch.firstElementChild?.animate([{ transform: 'scale(.85)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' });
    root.querySelectorAll<HTMLElement>('[data-r]').forEach(b => b.classList.toggle('on', b.dataset.r === roupa));
  }
  render();

  root.addEventListener('click', e => {
    const b = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null;
    if (!b) return;
    sfx.tap();
    const a = b.dataset.a;
    if (b.dataset.lock) { toast(stage, `Essa roupa libera no nível ${b.dataset.lock} ♥`); return; }
    if (b.dataset.r) { roupa = b.dataset.r as Roupa; render(); }
    else if (a === 'random') {
      const outras = ROUPAS.filter(([id]) => id !== roupa && roupaLiberada(id, save.level));
      if (!outras.length) return;
      roupa = outras[Math.floor(Math.random() * outras.length)][0];
      render();
    } else if (a === 'zoom') b.classList.toggle('on', ch.classList.toggle('zoom'));
    else if (a === 'back') app.go('menu'); // sai sem trocar a roupa
    else if (a === 'save') { save.roupa = roupa; app.persist(); sfx.love(); app.go('menu'); }
  });
}
