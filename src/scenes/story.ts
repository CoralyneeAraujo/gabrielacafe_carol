// "Nossa história": a trilha dos 15 níveis, de cima para baixo e rolável.
// Cada fase mostra o que libera, o evento e o que ainda vai chegar ("em breve").
import { donaFace } from '../dona';
import { UI } from '../icons';
import { LEVELS, MAX_LEVEL } from '../data';
import { PERSONAL } from '../personal';
import { sfx } from '../audio';
import { type App, clientSrc, el, fmt, levelProgress } from '../ui';
import { playDialogue, showLetter } from './cutscene';

const CSS = `
.st { position:absolute; inset:0; background:linear-gradient(170deg,#C9B8F2 0%,#F7C1CF 50%,#FFD9C0 100%); }
.st h1 { position:absolute; left:28px; top:36px; margin:0; font-size:44px; font-weight:600; color:#fff; text-shadow:0 3px 0 rgba(74,44,42,.25); }
.st .since { position:absolute; left:32px; top:96px; color:#fff; font-size:20px; }
.st-scroll { position:absolute; left:0; right:0; top:130px; bottom:380px; overflow-y:auto; overscroll-behavior:contain; touch-action:pan-y; padding:10px 0 40px; -webkit-mask-image:linear-gradient(transparent, #000 24px, #000 calc(100% - 30px), transparent); mask-image:linear-gradient(transparent, #000 24px, #000 calc(100% - 30px), transparent); }
.st-trail { position:relative; }
.st-trail svg.path { position:absolute; left:0; top:0; pointer-events:none; }
.st-row { position:relative; height:200px; }
.st-node { position:absolute; top:34px; width:92px; height:92px; border-radius:50%; display:grid; place-items:center; font-size:44px; background:rgba(255,255,255,.55); border:6px solid #fff; }
.st-node.done { background:#F2738C; }
.st-node.now { background:#fff; border-color:#F2738C; box-shadow:0 0 0 12px rgba(255,255,255,.45); animation: floaty 2.4s ease-in-out infinite; }
.st-node.lock { filter:grayscale(.9) opacity(.7); }
.st-node .ck { position:absolute; right:-8px; bottom:-6px; width:36px; height:36px; border-radius:50%; background:#6DB04B; border:3px solid #fff; display:grid; place-items:center; }
.st-node .ck svg { width:20px; height:20px; }
.st-card { position:absolute; top:6px; width:470px; background:rgba(255,250,246,.92); border-radius:22px; padding:12px 16px 12px; box-shadow:0 5px 0 rgba(74,44,42,.12); }
.st-card.lock { background:rgba(255,250,246,.6); }
.st-card .t { display:flex; justify-content:space-between; align-items:baseline; gap:8px; }
.st-card b { font-size:22px; font-weight:600; line-height:1.15; }
.st-card .lv { font-size:14px; color:#A85A6E; white-space:nowrap; font-weight:500; }
.st-card .ev { font-family:var(--fb); font-weight:700; font-size:15px; color:#7A5A52; margin:3px 0 7px; font-style:italic; }
.st-card .tags { display:flex; flex-wrap:wrap; gap:5px; }
.st-card .tags span { font-family:var(--fb); font-weight:700; font-size:13px; padding:3px 9px; border-radius:99px; background:#E7F3DD; color:#4E8A33; }
.st-card .tags span.soon { background:#F1E9FB; color:#7B5BB8; }
.st-card.lock .tags span:not(.soon) { background:#EFE6E0; color:#9A8A82; }
.st-panel { position:absolute; left:20px; right:20px; bottom:36px; display:grid; gap:12px; padding:16px 20px; }
.st-top { display:flex; align-items:center; gap:14px; }
.st-duo { display:flex; align-items:center; gap:4px; flex:none; }
.st-ava { width:78px; height:78px; border-radius:50%; overflow:hidden; background:#FFE9EE; border:4px solid #fff; box-shadow:0 0 0 3px #F7C6D2; position:relative; }
.st-ava img { position:absolute; left:50%; top:-4px; width:92px; margin-left:-46px; }
.st-ava.cli img { top:-2px; width:96px; margin-left:-48px; }
.st-duo .hrt { color:#F2738C; font-size:24px; }
`;

const CHECK = `<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const ROW = 200, LEFT_X = 70, RIGHT_X = 650; // centros dos nós nos dois lados

export function storyScene(app: App) {
  const { stage, save } = app;
  if (!document.getElementById('st-css')) { const s = document.createElement('style'); s.id = 'st-css'; s.textContent = CSS; document.head.appendChild(s); }
  const cur = save.level;

  const cx = (i: number) => (i % 2 ? RIGHT_X : LEFT_X);
  const pts = LEVELS.map((_, i) => [cx(i), i * ROW + 80]);
  const pathD = pts.map(([x, y], i) => (i ? `C${pts[i - 1][0]} ${y - ROW / 2} ${x} ${pts[i - 1][1] + ROW / 2} ${x} ${y}` : `M${x} ${y}`)).join(' ');

  const rows = LEVELS.map((l, i) => {
    const state = l.n < cur ? 'done' : l.n === cur ? 'now' : 'lock';
    const nodeLeft = cx(i) - 46;
    const cardLeft = i % 2 ? 40 : 210;
    const tags = [...l.unlocks.map(u => `<span>${u}</span>`), ...(l.soon || []).map(u => `<span class="soon">✦ ${u} · em breve</span>`)].join('');
    return `<div class="st-row" data-n="${l.n}">
      <div class="st-node ${state}" style="left:${nodeLeft}px">${l.emoji}${state === 'done' ? `<span class="ck">${CHECK}</span>` : ''}</div>
      <div class="st-card ${state === 'lock' ? 'lock' : ''}" style="left:${cardLeft}px">
        <div class="t"><b>${l.name}</b><span class="lv">Nv ${l.n} · ${l.n === cur ? 'agora' : `${fmt(l.love)} ♥`}</span></div>
        <div class="ev">${l.event}</div>
        <div class="tags">${tags}</div>
      </div></div>`;
  }).join('');

  const { next, frac } = levelProgress(save);
  const mems = PERSONAL.memorias.map(m => {
    const open = save.level >= m.nivel;
    return `<button class="btn ${open ? 'white' : 'off'} sm" ${open ? `data-m="${m.nivel}"` : ''} style="font-size:17px">${open ? m.titulo : `${UI.lock} Nível ${m.nivel}`}</button>`;
  }).join('');
  const status = cur >= MAX_LEVEL ? 'Depois do expediente ✨ Para sempre ♥'
    : `Próximo: ${next!.name} <span style="font-size:19px;color:#7A5A52">· faltam ${fmt(Math.max(0, next!.love - save.love))} de Amor</span>`;

  const root = el(`<div class="st">
    <h1>Nossa história</h1>
    ${PERSONAL.juntasDesde ? `<div class="since">juntas desde ${PERSONAL.juntasDesde}</div>` : ''}
    <div class="st-scroll"><div class="st-trail">
      <svg class="path" width="720" height="${LEVELS.length * ROW}"><path d="${pathD}" fill="none" stroke="#fff" stroke-width="9" stroke-dasharray="2 22" stroke-linecap="round"/></svg>
      ${rows}
    </div></div>
    <div class="panel st-panel">
      <div class="st-top">
        <div class="st-duo"><div class="st-ava">${donaFace('apaixonada')}</div><span class="hrt">♥</span><div class="st-ava cli"><img alt="" src="${clientSrc('apaixonada')}"></div></div>
        <div style="font-size:21px;font-weight:600;line-height:1.25;min-width:0">${status}</div>
      </div>
      <div style="display:grid;gap:12px">
        <div class="bar" style="width:100%;height:18px"><i style="width:${frac * 100}%"></i></div>
        <div class="row" style="justify-content:flex-start;flex-wrap:wrap;gap:8px">${mems}${cur >= MAX_LEVEL ? '<button class="btn sm" data-letter>Reler a carta ♥</button>' : ''}<span style="flex:1"></span><button class="btn leaf sm" data-a="menu">Voltar</button></div>
      </div>
    </div></div>`);
  stage.appendChild(root);

  // abre a trilha já na fase atual
  const scroll = root.querySelector('.st-scroll') as HTMLElement;
  requestAnimationFrame(() => { scroll.scrollTop = Math.max(0, (cur - 1) * ROW - 60); });
  // o palco é escalado: o arrasto vertical precisa rolar a trilha
  let dragY = -1, startTop = 0;
  scroll.addEventListener('pointerdown', e => { dragY = e.clientY; startTop = scroll.scrollTop; });
  scroll.addEventListener('pointermove', e => {
    if (dragY < 0) return;
    const k = stage.getBoundingClientRect().height / stage.offsetHeight;
    scroll.scrollTop = startTop - (e.clientY - dragY) / k;
  });
  const endDrag = () => { dragY = -1; };
  scroll.addEventListener('pointerup', endDrag); scroll.addEventListener('pointercancel', endDrag); scroll.addEventListener('pointerleave', endDrag);

  root.addEventListener('click', async e => {
    const b = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null;
    if (!b) return;
    sfx.tap();
    if (b.dataset.a === 'menu') app.go('menu');
    else if (b.dataset.m) {
      const m = PERSONAL.memorias.find(x => x.nivel === Number(b.dataset.m))!;
      await playDialogue(stage, save, m.falas, { title: m.titulo, night: m.noite });
    } else if (b.hasAttribute('data-letter')) await showLetter(stage);
  });
}
