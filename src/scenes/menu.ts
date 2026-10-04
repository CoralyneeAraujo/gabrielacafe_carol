// Menu principal (em pé). A arte pintada vem em duas faixas (tools/make_menu_portrait.py):
// o topo fica preso no alto da tela e o corpo (restaurante + botões) embaixo; o céu preenche o meio,
// então a mesma arte serve para qualquer altura de celular. Por cima vão áreas de toque invisíveis
// e os valores que mudam (moedas, Amor, nível, dia). Tudo dentro de .art usa as coordenadas da arte
// original (596 de largura), escaladas para os 720 do palco.
import { heartPath } from '../chibi';
import { UI, dishSVG } from '../icons';
import { LEVELS, MAX_LEVEL, NIGHT_LEVEL, RECIPES, SPECIAL_LEVEL, CLIENT_SPRITES, levelFromLove } from '../data';
import { ACHIEVEMENTS } from '../goals';
import { PERSONAL } from '../personal';
import { reset } from '../state';
import { setMusic, setSound, sfx } from '../audio';
import { type App, clientSrc, confirmBox, el, fmt, levelProgress, rand, toast } from '../ui';

const K = 720 / 596;     // arte → palco
const SPLIT = 74;        // linha da arte onde topo e corpo se separam
const PAD = 24;          // folga para a câmera/entalhe do celular
const CSS = `
.mn { position:absolute; inset:0; overflow:hidden; background:url(art/menu_sky_gap.png) 0 0 / 100% 100%; }
.mn .skytop { position:absolute; left:0; right:0; top:0; height:${PAD + 4}px; background:url(art/menu_sky_top.png) 0 0 / 100% 100%; }
.mn .band { position:absolute; left:0; width:720px; }
.mn .band > .art { position:absolute; left:0; top:0; width:596px; transform:scale(${K}); transform-origin:0 0; }
.mn .top { top:${PAD}px; height:${Math.round(78 * K)}px; }
.mn .top > .art { height:78px; background:url(art/menu_top.webp) 0 0 / 100% 100%; }
.mn .body { bottom:0; height:${(941 - SPLIT) * K}px; }
.mn .body > .art { height:${941 - SPLIT}px; background:url(art/menu_body.webp) 0 0 / 100% 100%; }
.mn .cloud { position:absolute; border-radius:50%; background:radial-gradient(closest-side, rgba(255,214,222,.55), rgba(255,214,222,0)); animation: drift 40s ease-in-out infinite alternate; pointer-events:none; }
.mn .hot { position:absolute; cursor:pointer; border-radius:18px; }
.mn .hot:active { background: rgba(255,255,255,.2); }
.mn .val { position:absolute; color:#fff; font-weight:600; pointer-events:none; white-space:nowrap; font-variant-numeric:tabular-nums; }
.mn .lbar { position:absolute; left:266px; top:29px; width:194px; height:14px; border-radius:99px; background:#5A3F45; overflow:hidden; pointer-events:none; }
.mn .lbar i { display:block; height:100%; background:linear-gradient(#FFB3C4,#F48AA2); border-radius:99px; box-shadow: inset 0 3px 0 rgba(255,255,255,.35); }
.mn .level { position:absolute; left:186px; top:84px; width:225px; height:76px; background:url(art/menu_level.webp) 0 0 / 100% 100%; pointer-events:none; }
.mn .tint { position:absolute; inset:0; background:#7C76C8; mix-blend-mode:multiply; pointer-events:none; }
.mn .glow { position:absolute; border-radius:50%; mix-blend-mode:screen; pointer-events:none; background: radial-gradient(circle, rgba(255,200,110,.75), rgba(255,200,110,0) 65%); }
.mn:not(.night) .tint, .mn:not(.night) .glow { display:none; }
.mn-modal { position:absolute; inset:0; z-index:90; background:rgba(42,29,27,.55); display:grid; place-items:center; animation: fadein .2s; }
.mn-card { width:660px; max-height:calc(var(--H, 1600px) - 200px); background:#FAE7D8; border:5px solid #5A3F45; border-radius:30px; box-shadow:0 12px 0 rgba(0,0,0,.25); padding:20px 22px 22px; display:grid; grid-template-rows:auto 1fr; gap:14px; animation: popin .3s cubic-bezier(.3,1.5,.5,1); }
.mn-card header { display:flex; align-items:center; gap:14px; }
.mn-card header img { width:64px; height:64px; }
.mn-card header h2 { margin:0; font-size:34px; font-weight:600; flex:1; }
.mn-card .x { width:54px; height:54px; border-radius:50%; border:0; background:#F2738C; color:#fff; font-size:30px; font-family:var(--fd); box-shadow:0 4px 0 #D24F6C; cursor:pointer; }
.mn-card .body { overflow:auto; min-height:0; }
.mn-list { display:grid; grid-template-columns:1fr; gap:12px; }
.mn-item { display:flex; gap:14px; align-items:center; background:#fff; border-radius:20px; padding:10px 14px; border:3px solid #F0DCCD; }
.mn-item svg, .mn-item .ic { width:64px; height:64px; flex:none; }
.mn-item b { font-size:22px; font-weight:600; display:block; }
.mn-item small { font-family:var(--fb); font-weight:700; font-size:16px; color:#7A5A52; }
.mn-item.off { opacity:.5; filter:grayscale(.7); }
.mn-gal { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; }
.mn-gal div { background:#fff; border-radius:16px; border:3px solid #F0DCCD; aspect-ratio:1; display:grid; place-items:end center; overflow:hidden; position:relative; }
.mn-gal img { width:100%; }
.mn-gal div.lock img { filter: brightness(0) opacity(.18); }
.mn-gal span { position:absolute; top:4px; left:0; right:0; text-align:center; font-size:13px; font-weight:500; }
.mn-bubble { position:absolute; z-index:30; background:#fff; border:3px solid #4A2C2A; border-radius:16px; padding:6px 12px; font-family:var(--fb); font-weight:700; font-size:16px; max-width:230px; animation: popin .3s cubic-bezier(.3,1.6,.5,1); pointer-events:none; }
@keyframes drift { to { transform: translateX(60px); } }
`;

// partes da arte que não escurecem no modo noite (botões), em coordenadas de cada faixa
const TOP_UI = 'M16 15H201V70H16Z M208 15H481V70H208Z M521 15H579V71H521Z';
const BODY_UI = 'M108 601H489V673H108Z M24 679H571V753H24Z M13 767H584V851H13Z';

const SPRITE_NAMES: Record<string, string> = {
  normal: 'Normal', feliz: 'Feliz', com_fome: 'Com fome', impaciente: 'Impaciente', surpresa: 'Surpresa', apaixonada: 'Apaixonada',
  brava: 'Brava', sonolenta: 'Sonolenta', comemorando: 'Comemorando', joinha: 'Joinha', com_cafe: 'Com café', com_notebook: 'Notebook',
  com_celular: 'Celular', pensativa: 'Pensativa', rindo: 'Rindo', envergonhada: 'Envergonhada', surpresa_feliz: 'Surpresa feliz',
  triste: 'Triste', desconfiada: 'Desconfiada', ansiosa: 'Ansiosa', muito_feliz: 'Muito feliz', com_sacolas: 'Sacolas',
  camiseta_diferente: 'Camiseta', hoodie: 'Hoodie', de_touca: 'De touca', pedido_especial: 'Especial',
};
const HER_LINES = [`Bem-vinda ao ${PERSONAL.nomeRestaurante}!`, 'Hoje só quero paz.', 'Já separei o seu café.', 'Não me estressa hoje.'];

export function menuScene(app: App) {
  const { stage, save } = app;
  if (!document.getElementById('mn-css')) { const s = document.createElement('style'); s.id = 'mn-css'; s.textContent = CSS; document.head.appendChild(s); }

  const { cur, next, frac } = levelProgress(save);
  const loveTxt = next && save.level < MAX_LEVEL ? `${save.love} / ${next.love}` : `${save.love} ♥`;
  const night = save.settings.night && save.level >= NIGHT_LEVEL;
  const hot = (a: string, x0: number, y0: number, x1: number, y1: number, label: string, r = 18) =>
    `<div class="hot" data-a="${a}" role="button" aria-label="${label}" style="left:${x0}px;top:${y0}px;width:${x1 - x0}px;height:${y1 - y0}px;border-radius:${r}px"></div>`;
  const B = (y: number) => y - SPLIT; // y da arte → y dentro do corpo
  const glows = [[52, 280, 60], [112, 255, 60], [482, 258, 60], [34, 345, 70], [567, 430, 70], [145, 420, 150], [437, 420, 150], [292, 400, 130]]
    .map(([x, y, s]) => `<div class="glow" style="left:${x - s / 2}px;top:${B(y) - s / 2}px;width:${s}px;height:${s}px"></div>`).join('');
  const playTxt = `Abrir · Dia ${save.day}`;

  const root = el(`<div class="mn${night ? ' night' : ''}">
    <div class="tint"></div>
    <div class="skytop"></div>
    <div class="cloud" style="left:-60px;top:${PAD + 160}px;width:320px;height:110px"></div>
    <div class="cloud" style="left:420px;top:${PAD + 300}px;width:280px;height:90px;animation-duration:55s"></div>
    <div class="band body"><div class="art">
      <div class="tint" style="clip-path:path(evenodd, 'M0 0H596V867H0Z ${BODY_UI}')"></div>${glows}
      <div class="val" style="left:330px;top:${B(695)}px;transform:translateX(-50%);font-size:${playTxt.length > 13 ? 26 : 30}px;line-height:36px">${playTxt}</div>
      ${hot('her', 252, B(455), 372, B(670), PERSONAL.nomeDela, 40)}
      ${hot('cat', 372, B(600), 477, B(672), 'Gatinho', 30)}
      ${hot('win', 82, B(360), 207, B(485), 'Cliente', 16)}${hot('win', 367, B(360), 502, B(485), 'Cliente', 16)}
      ${hot('menu', 22, B(475), 172, B(650), 'Menu do dia', 12)}
      ${hot('play', 112, B(679), 485, B(743), 'Jogar', 26)}
      ${hot('shop', 28, B(757), 188, B(823), 'Melhorias')}
      ${hot('story', 200, B(757), 397, B(823), 'Nossa história')}
      ${hot('look', 408, B(757), 567, B(823), 'Visual')}
      ${[['menu', 'Cardápio'], ['decor', 'Decorações'], ['achv', 'Conquistas'], ['gallery', 'Galeria'], ['music', 'Música']]
        .map(([a, l], i) => hot(a, [17, 132, 247, 362, 477][i], B(845), [119, 234, 349, 464, 580][i], B(921), l)).join('')}
    </div></div>
    <div class="band top"><div class="art">
      <div class="tint" style="clip-path:path(evenodd, 'M0 0H596V78H0Z ${TOP_UI}')"></div>
      <div class="val" style="left:80px;top:27px;font-size:25px;line-height:30px">${fmt(save.coins)}</div>
      <div class="lbar"><i style="width:${frac * 100}%"></i></div>
      <div class="val" style="left:363px;top:46px;transform:translateX(-50%);font-size:14px;color:#F7A9B8;font-weight:500">${loveTxt}</div>
      <div class="level"></div>
      <div class="val" style="left:298px;top:101px;transform:translateX(-50%);font-size:22px;color:#3B2A30">Nível ${save.level}</div>
      <div class="val" style="left:298px;top:126px;transform:translateX(-50%);font-size:${cur.name.length > 22 ? 12 : 14}px;color:#3B2A30">${cur.name}</div>
      ${hot('coins', 153, 22, 193, 62, 'Ganhar moedas', 20)}
      ${hot('settings', 523, 17, 577, 69, 'Ajustes', 27)}
    </div></div>
  </div>`);
  stage.appendChild(root);
  const body = root.querySelector('.body > .art') as HTMLElement;

  // balões e corações aparecem dentro do corpo, em coordenadas da arte
  function bubble(x: number, y: number, text: string) {
    body.querySelectorAll('.mn-bubble').forEach(b => b.remove());
    const b = el(`<div class="mn-bubble" style="left:${x}px;top:${B(y)}px">${text}</div>`);
    body.appendChild(b);
    setTimeout(() => b.remove(), 2200);
  }
  function hearts(x: number, y: number) {
    for (let i = 0; i < 3; i++) {
      const h = el(`<div class="abs" style="left:${x - 13 + (i - 1) * 22}px;top:${B(y)}px;width:26px;pointer-events:none;z-index:30"><svg viewBox="0 0 40 40">${heartPath(20, 22, 1.8, '#F2738C', '#C2405E', 2)}</svg></div>`);
      body.appendChild(h);
      h.animate([{ transform: 'translateY(0) scale(.4)', opacity: 0 }, { transform: 'translateY(-25px) scale(1)', opacity: 1, offset: .3 }, { transform: 'translateY(-75px) scale(.8)', opacity: 0 }], { duration: 1200, delay: i * 120, fill: 'both' }).onfinish = () => h.remove();
    }
  }
  function bounce(node: Element) { node.animate([{ transform: 'scale(1)' }, { transform: 'scale(.94)' }, { transform: 'scale(1)' }], { duration: 160 }); }

  root.addEventListener('click', async e => {
    const t = (e.target as HTMLElement).closest('[data-a]') as HTMLElement | null;
    if (!t) return;
    const a = t.dataset.a;
    bounce(t);
    switch (a) {
      case 'play': sfx.tap(); app.go('day'); break;
      case 'shop': sfx.tap(); app.go('shop'); break;
      case 'decor': sfx.tap(); app.go('shop', 'decoracao'); break;
      case 'story': sfx.tap(); app.go('story'); break;
      case 'look': sfx.tap(); app.go('customize'); break;
      case 'settings': sfx.tap(); openSettings(); break;
      case 'coins': sfx.tap(); toast(stage, 'Moedas vêm de clientes felizes ♥'); break;
      case 'cat': sfx.meow(); hearts(425, 590); break;
      case 'her': sfx.pop(); bubble(200, 400, rand(HER_LINES)); break;
      case 'win': sfx.love(); hearts(parseFloat(t.style.left) + 62, parseFloat(t.style.top) + SPLIT + 20); break;
      case 'menu': sfx.tap(); openMenu(); break;
      case 'achv': sfx.tap(); openAchievements(); break;
      case 'gallery': sfx.tap(); openGallery(); break;
      case 'music': sfx.tap(); openMusic(); break;
    }
  });

  function modal(icon: string, title: string, body: string) {
    const m = el(`<div class="mn-modal"><div class="mn-card"><header><img alt="" src="art/${icon}.png"><h2>${title}</h2><button class="x" data-close aria-label="Fechar">×</button></header><div class="body">${body}</div></div></div>`);
    m.addEventListener('click', e => { if ((e.target as HTMLElement).closest('[data-close]') || e.target === m) { sfx.tap(); m.remove(); } });
    stage.appendChild(m);
    return m;
  }

  function openMenu() {
    const lv = save.level;
    modal('ic_cardapio', 'Cardápio', `<div class="mn-list">${RECIPES.map(r => `<div class="mn-item${r.level > lv ? ' off' : ''}">${dishSVG(r.items)}
      <div><b>${r.name}</b><small>${r.level > lv ? `Libera no nível ${r.level} · ${LEVELS[r.level - 1].name}` : r.items.map(i => i[0].toUpperCase() + i.slice(1)).join(' + ')}</small></div>
      <b style="margin-left:auto;display:flex;align-items:center;gap:6px"><span style="width:28px;display:block">${UI.coin}</span>${r.price}</b></div>`).join('')}</div>`);
  }

  function openAchievements() {
    const done = ACHIEVEMENTS.filter(x => x.done(save)).length;
    modal('ic_conquistas', `Conquistas · ${done}/${ACHIEVEMENTS.length}`, `<div class="mn-list">${ACHIEVEMENTS.map(x => {
      const ok = x.done(save);
      return `<div class="mn-item${ok ? '' : ' off'}"><span class="ic">${ok ? UI.star : UI.lock}</span><div><b>${x.name}</b><small>${x.desc}</small></div></div>`;
    }).join('')}</div>`);
  }

  function openGallery() {
    const seen = new Set(save.seenSprites);
    const list = CLIENT_SPRITES.filter(s => s !== 'pedido_especial' || save.specialDone);
    modal('ic_galeria', `Galeria · ${list.filter(s => seen.has(s)).length}/${list.length}`, `<p style="font-family:var(--fb);font-weight:700;margin:0 0 10px;color:#7A5A52">Cada versão da cliente que aparecer no restaurante fica guardada aqui.</p>
      <div class="mn-gal">${list.map(s => `<div class="${seen.has(s) ? '' : 'lock'}"><span>${seen.has(s) ? SPRITE_NAMES[s] : '???'}</span><img alt="" src="${clientSrc(s)}"></div>`).join('')}</div>`);
  }

  function openMusic() {
    const m = modal('ic_musica', 'Música', `<div style="display:grid;gap:8px;font-size:24px">
      <div class="toggle"><div>Música de fundo<small>Uma trilha calminha enquanto vocês cozinham.</small></div><button class="sw${save.settings.music ? ' on' : ''}" data-s="music" aria-label="Música"></button></div>
      <div class="toggle"><div>Efeitos sonoros<small>Sino da porta, moedas e plim.</small></div><button class="sw${save.settings.sound ? ' on' : ''}" data-s="sound" aria-label="Sons"></button></div></div>`);
    m.addEventListener('click', e => {
      const b = (e.target as HTMLElement).closest('[data-s]') as HTMLElement | null;
      if (!b) return;
      const k = b.dataset.s as 'music' | 'sound';
      save.settings[k] = !save.settings[k];
      b.classList.toggle('on', save.settings[k]);
      if (k === 'music') setMusic(save.settings.music); else setSound(save.settings.sound);
      app.persist();
    });
  }

  // botões do modo teste: pular de fase sem jogar
  const pulos = () => save.settings.teste && save.level < MAX_LEVEL
    ? `<button class="btn gold sm" data-s="pular">+1 nível</button>${save.level < 13 ? '<button class="btn gold sm" data-s="pular13">Ir ao nível 13</button>' : ''}<button class="btn gold sm" data-s="pular15">Ir ao nível 15</button>`
    : '';

  function openSettings() {
    const m = modal('ic_objetivo', 'Ajustes', `<div style="display:grid;gap:8px">
      ${save.level >= NIGHT_LEVEL ? `<div class="toggle"><div>Modo noite<small>Céu estrelado e as luzes do restaurante acesas.</small></div><button class="sw${save.settings.night ? ' on' : ''}" data-s="night" aria-label="Modo noite"></button></div>`
        : `<div class="toggle" style="opacity:.55"><div>Modo noite<small>Libera no nível ${NIGHT_LEVEL} · ${LEVELS[NIGHT_LEVEL - 1].name}</small></div>${UI.lock.replace('<svg', '<svg style="width:40px"')}</div>`}
      <div class="toggle"><div>Modo sem pressa<small>Clientes esperam para sempre. Bom para jogar só pela história.</small></div><button class="sw${save.settings.relax ? ' on' : ''}" data-s="relax" aria-label="Modo sem pressa"></button></div>
      <div class="toggle"><div>Modo teste<small>Dia de 20 s, cozinha 3× mais rápida, clientes sem parar e Amor ×50. Desligue antes de entregar o presente!</small></div><button class="sw${save.settings.teste ? ' on' : ''}" data-s="teste" aria-label="Modo teste"></button></div>
      <div class="row" style="margin-top:18px;flex-wrap:wrap;gap:10px"><span data-pulos style="display:contents">${pulos()}</span><button class="btn white sm" data-s="reset">Apagar progresso</button></div></div>`);
    m.addEventListener('click', async e => {
      const b = (e.target as HTMLElement).closest('[data-s]') as HTMLElement | null;
      if (!b) return;
      if (b.dataset.s === 'night') {
        save.settings.night = !save.settings.night; b.classList.toggle('on', save.settings.night); app.persist();
        root.classList.toggle('night', save.settings.night);
      } else if (b.dataset.s?.startsWith('pular')) {
        // só no modo teste: ganha o Amor que falta para a fase escolhida
        const alvo = b.dataset.s === 'pular15' ? MAX_LEVEL : b.dataset.s === 'pular13' ? 13 : save.level + 1;
        save.love = Math.max(save.love, LEVELS[alvo - 1].love);
        save.level = levelFromLove(save.love);
        if (save.level >= SPECIAL_LEVEL && !save.specialDay) save.specialDay = save.day;
        app.persist(); sfx.levelup(); app.go('menu');
        toast(stage, `${LEVELS[save.level - 1].emoji} Nível ${save.level}: ${LEVELS[save.level - 1].name}`, 2500);
      } else if (b.dataset.s === 'teste') {
        save.settings.teste = !save.settings.teste; b.classList.toggle('on', save.settings.teste); app.persist();
        (m.querySelector('[data-pulos]') as HTMLElement).innerHTML = pulos();
      } else if (b.dataset.s === 'relax') {
        save.settings.relax = !save.settings.relax; b.classList.toggle('on', save.settings.relax); app.persist();
      } else if (await confirmBox(stage, 'Apagar tudo?', 'Moedas, Amor, melhorias e visual voltam ao começo.', 'Apagar')) {
        app.save = reset(); app.persist(); app.go('menu');
      }
    });
  }
}
