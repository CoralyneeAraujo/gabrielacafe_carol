import { STATION_ICON, UI } from '../icons';
import { UPGRADES, type Upgrade } from '../data';
import { upg } from '../state';
import { sfx } from '../audio';
import { type App, el, fmt, toast } from '../ui';
import { DECO } from './restaurant';
import { heartPath } from '../chibi';

const TABS: [Upgrade['tab'], string][] = [['cozinha', 'Cozinha'], ['salao', 'Salão'], ['decoracao', 'Decoração']];
const ICON: Record<string, string> = {
  ...STATION_ICON,
  mesa: `<svg viewBox="0 0 40 40"><ellipse cx="20" cy="17" rx="16" ry="5" fill="#C8875A" stroke="#4A2C2A" stroke-width="2.5"/><path d="M20 22v12M13 34h14" stroke="#4A2C2A" stroke-width="2.5" stroke-linecap="round"/></svg>`,
  prato: `<svg viewBox="0 0 40 40"><ellipse cx="20" cy="24" rx="16" ry="6" fill="#fff" stroke="#4A2C2A" stroke-width="2.5"/><ellipse cx="20" cy="23" rx="10" ry="3" fill="#F4ECE6"/></svg>`,
  planta: DECO.planta, quadro: DECO.quadro, flores: DECO.flores, velas: DECO.vela,
  luminaria: `<svg viewBox="0 0 40 40"><path d="M20 2v12" stroke="#3B2A28" stroke-width="2"/><path d="M8 26Q8 14 20 14Q32 14 32 26Z" fill="#3B2A28"/><circle cx="20" cy="29" r="6" fill="#FFD66B"/></svg>`,
  luzinhas: `<svg viewBox="0 0 40 40"><path d="M3 10Q20 24 37 10" fill="none" stroke="#4A2C2A" stroke-width="2"/>${[[8, 18], [15, 22], [22, 22.5], [29, 20], [35, 15]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="#FFD66B" stroke="#4A2C2A" stroke-width="1.6"/>`).join('')}</svg>`,
  placa: `<svg viewBox="0 0 40 40"><rect x="3" y="10" width="34" height="18" rx="5" fill="#F2738C" stroke="#4A2C2A" stroke-width="2.5"/>${heartPath(20, 20, 0.7, '#fff')}</svg>`,
};

const CSS = `
.sh { position:absolute; inset:0; background: var(--paper); }
.sh h1 { position:absolute; left:28px; top:40px; margin:0; font-size:44px; font-weight:600; }
.sh-tabs { position:absolute; left:28px; top:116px; display:flex; gap:10px; }
.sh-tabs button { font-family:var(--fd); font-size:22px; font-weight:600; border:0; border-radius:99px; padding:10px 26px; background:#F3E3D6; color:var(--cocoa2); }
.sh-tabs button.on { background:var(--straw); color:#fff; }
.sh-grid { position:absolute; left:28px; right:28px; top:190px; bottom:130px; display:grid; grid-template-columns:repeat(2,1fr); gap:18px; align-content:start; overflow:auto; }
.uc { background:#fff; border-radius:24px; border:3px solid #EAD6CA; padding:14px; display:grid; gap:8px; align-content:start; }
.uc .th { background:var(--paper2); border-radius:16px; height:110px; display:grid; place-items:center; }
.uc .th svg { height:86px; width:auto; max-width:120px; }
.uc b { font-size:22px; font-weight:600; line-height:1.1; }
.uc small { font-family:var(--fb); font-weight:700; font-size:16px; color:var(--cocoa2); line-height:1.25; min-height:40px; }
.uc .pips { display:flex; gap:6px; }
.uc .pips i { width:30px; height:10px; border-radius:99px; background:#EFDCD0; }
.uc .pips i.on { background:var(--leaf); }
.uc .btn { font-size:22px; padding:8px 0 11px; width:100%; }
.uc .btn svg { width:26px; height:26px; }
.sh-foot { position:absolute; left:28px; right:28px; bottom:36px; display:flex; justify-content:space-between; }
`;

export function shopScene(app: App, startTab?: Upgrade['tab']) {
  const { stage, save } = app;
  if (!document.getElementById('sh-css')) { const s = document.createElement('style'); s.id = 'sh-css'; s.textContent = CSS; document.head.appendChild(s); }
  let tab: Upgrade['tab'] = startTab || 'cozinha';
  const root = el(`<div class="sh"><h1>Melhorias</h1>
    <div class="hud" style="left:auto;top:40px"><div><span class="pill" data-coins>${UI.coin}${fmt(save.coins)}</span></div></div>
    <div class="sh-tabs"></div><div class="sh-grid"></div>
    <div class="sh-foot"><button class="btn white" data-a="menu">Voltar</button><button class="btn leaf" data-a="play">Abrir · Dia ${save.day}</button></div></div>`);
  stage.appendChild(root);
  const grid = root.querySelector('.sh-grid') as HTMLElement;

  function render() {
    root.querySelector('.sh-tabs')!.innerHTML = TABS.map(([id, n]) => `<button class="${id === tab ? 'on' : ''}" data-t="${id}">${n}</button>`).join('');
    root.querySelector('[data-coins]')!.innerHTML = UI.coin + fmt(save.coins);
    grid.innerHTML = UPGRADES.filter(u => u.tab === tab).map(u => {
      const lv = upg(save, u.id), max = u.costs.length, cost = u.costs[lv];
      let btn: string;
      if (save.level < u.level) btn = `<button class="btn off">${UI.lock} Nível ${u.level}</button>`;
      else if (lv >= max) btn = `<button class="btn off">${max > 1 ? 'Máximo' : 'Comprado ♥'}</button>`;
      else btn = `<button class="btn gold${save.coins < cost ? ' off' : ''}" data-buy="${u.id}">${UI.coin}${fmt(cost)}</button>`;
      return `<div class="uc"><div class="th">${ICON[u.icon] || ''}</div><b>${u.name}</b><small>${u.desc}</small>
        ${max > 1 ? `<div class="pips">${u.costs.map((_, i) => `<i class="${i < lv ? 'on' : ''}"></i>`).join('')}</div>` : ''}${btn}</div>`;
    }).join('');
  }
  render();

  root.addEventListener('click', e => {
    const t = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null;
    if (!t) return;
    if (t.dataset.t) { tab = t.dataset.t as Upgrade['tab']; sfx.tap(); render(); return; }
    if (t.dataset.a === 'menu') { app.go('menu'); return; }
    if (t.dataset.a === 'play') { app.go('day'); return; }
    if (t.dataset.buy) {
      const u = UPGRADES.find(x => x.id === t.dataset.buy)!;
      const cost = u.costs[upg(save, u.id)];
      if (save.coins < cost) { sfx.error(); toast(stage, 'Moedas insuficientes'); return; }
      save.coins -= cost;
      save.upgrades[u.id] = upg(save, u.id) + 1;
      app.persist();
      sfx.levelup();
      toast(stage, `${u.name} ✓`);
      render();
    }
  });
}
