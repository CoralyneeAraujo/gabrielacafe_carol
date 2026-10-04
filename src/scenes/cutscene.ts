import { heartPath } from '../chibi';
import { donaFace, type Rosto } from '../dona';
import { DECO } from './restaurant';
import { PERSONAL, type Fala } from '../personal';
import type { Save } from '../state';
import { sfx } from '../audio';
import { clientSrc, el, wait } from '../ui';

const CSS = `
.cs { position:absolute; inset:0; z-index:95; overflow:hidden; animation: fadein .5s; }
.cs .bg { position:absolute; inset:0; }
.cs .lb { position:absolute; left:0; right:0; height:70px; background:#1E1514; z-index:3; transition: transform .6s; }
.cs .her-c { position:absolute; left:14px; bottom:330px; width:290px; transition: filter .3s, transform .3s; transform-origin: 50% 100%; }
.cs .her-c img { display:block; width:100%; }
.cs .you-c { position:absolute; right:0; bottom:345px; width:330px; transition: filter .3s, transform .3s; transform-origin: 50% 100%; }
.cs .dim { filter: brightness(.6) saturate(.7); transform: scale(.96); }
.cs .box { position:absolute; left:24px; right:24px; bottom:80px; min-height:200px; background:#FFF4EE; border:5px solid #4A2C2A; border-radius:26px; padding:26px 34px 22px; font-family:var(--fb); font-weight:700; font-size:26px; line-height:1.4; z-index:4; color:#4A2C2A; }
.cs .name { position:absolute; top:-22px; left:28px; background:#F2738C; color:#fff; font-family:var(--fd); font-weight:600; font-size:22px; padding:2px 18px; border-radius:99px; }
.cs .name.n { background:#7A5A52; }
.cs .next { position:absolute; right:22px; bottom:12px; font-family:var(--fd); font-size:18px; color:#D24F6C; animation: bounce 1s infinite; }
.cs .title { position:absolute; left:0; right:0; top:130px; text-align:center; font-size:40px; font-weight:600; color:#fff; text-shadow:0 3px 0 rgba(0,0,0,.25); z-index:4; }
/* coração acima da cabeça das duas, sem cobrir os rostos */
.cs .bigheart { position:absolute; left:50%; bottom:calc(330px + 340px); width:260px; margin-left:-130px; z-index:5; }
.cs .letter { position:absolute; left:50%; top:50%; width:660px; max-height:calc(var(--H, 1600px) - 180px); transform:translate(-50%,-50%); background:#FFFDF7; border-radius:18px; padding:36px 36px 28px; z-index:6; box-shadow:0 20px 50px rgba(0,0,0,.35); background-image: repeating-linear-gradient(transparent 0 43px, #F4D6DD 43px 45px); display:flex; flex-direction:column; gap:18px; animation: popin .5s cubic-bezier(.3,1.4,.5,1); --t: translate(-50%,-50%); }
.cs .letter pre { margin:0; white-space:pre-wrap; font-family:var(--fb); font-weight:700; font-size:24px; line-height:45px; color:#4A2C2A; overflow:auto; }
.cs .letter .sig { text-align:right; font-family:var(--fd); font-size:28px; color:#D24F6C; }
.cs .vela { position:absolute; bottom:300px; width:70px; z-index:2; filter:drop-shadow(0 0 18px rgba(255,200,110,.8)); }
.cs .nota { position:absolute; z-index:2; color:#FFE3EE; font-size:40px; opacity:0; animation: nota 5s ease-in-out infinite; text-shadow:0 0 10px rgba(255,180,210,.8); }
@keyframes nota { 0% { opacity:0; transform:translateY(0) rotate(-8deg); } 20% { opacity:.9; } 100% { opacity:0; transform:translateY(-160px) rotate(10deg); } }
.cs .petal { position:absolute; width:26px; z-index:5; pointer-events:none; }
`;

function ensureCSS() {
  if (document.getElementById('cs-css')) return;
  const s = document.createElement('style'); s.id = 'cs-css'; s.textContent = CSS; document.head.appendChild(s);
}

type Opts = { title?: string; night?: boolean; keepOpen?: boolean };

/** Mostra uma sequência de falas com as duas personagens. Toque avança. */
export async function playDialogue(stage: HTMLElement, save: Save, falas: Fala[], opts: Opts = {}) {
  ensureCSS();
  const bg = opts.night ? 'linear-gradient(#3A2F6B, #8C78CC 55%, #F7A9B8)' : 'linear-gradient(#FFD9C0, #FFE6D8 60%, #F3C6A8)';
  const root = el(`<div class="cs"><div class="bg" style="background:${bg}"></div>
    <div class="lb" style="top:0;transform:translateY(-100%)"></div><div class="lb" style="bottom:0;transform:translateY(100%)"></div>
    ${opts.title ? `<div class="title">${opts.title}</div>` : ''}
    ${opts.night ? `<div class="vela" style="left:300px">${DECO.vela}</div><div class="vela" style="left:350px;width:56px">${DECO.vela}</div>
      ${['♪', '♫', '♪', '♬', '♫'].map((n, i) => `<span class="nota" style="left:${80 + i * 130}px;top:${260 + (i % 2) * 70}px;animation-delay:${i * 1.1}s">${n}</span>`).join('')}` : ''}
    <div class="her-c"></div><img class="you-c" alt="" src="${clientSrc('normal')}">
    <div class="box"><span class="name"></span><span class="txt"></span><span class="next">toque ▸</span></div></div>`);
  stage.appendChild(root);
  requestAnimationFrame(() => root.querySelectorAll<HTMLElement>('.lb').forEach(b => (b.style.transform = 'none')));
  const herC = root.querySelector('.her-c') as HTMLElement;
  const youC = root.querySelector('.you-c') as HTMLImageElement;
  const nameEl = root.querySelector('.name') as HTMLElement;
  const txt = root.querySelector('.txt') as HTMLElement;
  const next = root.querySelector('.next') as HTMLElement;

  for (const f of falas) {
    const herFace: Rosto = f.quem === 'ela' ? (opts.night ? 'carinha_de_amor' : 'feliz') : f.quem === 'voce' ? 'apaixonada' : 'normal';
    herC.innerHTML = donaFace(herFace);
    youC.src = clientSrc(f.quem === 'voce' ? (opts.night ? 'pedido_especial' : 'feliz') : 'apaixonada');
    herC.classList.toggle('dim', f.quem === 'voce');
    youC.classList.toggle('dim', f.quem === 'ela');
    nameEl.className = 'name' + (f.quem === 'narrador' ? ' n' : '');
    nameEl.textContent = f.quem === 'ela' ? PERSONAL.nomeDela : f.quem === 'voce' ? PERSONAL.seuNome : '♥';
    next.hidden = true;
    await typeText(root, txt, f.texto);
    next.hidden = false;
    await tap(root);
  }
  if (!opts.keepOpen) { root.style.transition = 'opacity .4s'; root.style.opacity = '0'; await wait(400); root.remove(); }
  return root;
}

function tap(root: HTMLElement) {
  return new Promise<void>(res => root.addEventListener('pointerdown', () => res(), { once: true }));
}

async function typeText(root: HTMLElement, node: HTMLElement, text: string) {
  let skip = false;
  const onTap = () => (skip = true);
  root.addEventListener('pointerdown', onTap, { once: true });
  node.textContent = '';
  for (let i = 0; i < text.length && !skip; i++) {
    node.textContent = text.slice(0, i + 1);
    if (i % 2 === 0) sfx.type();
    await wait(24);
  }
  node.textContent = text;
  root.removeEventListener('pointerdown', onTap);
  await wait(60);
}

/** Cena depois do Pedido Especial: diálogo e coração gigante. A carta só abre no nível 15 (ou já, se ela já chegou lá). */
export async function playFinale(stage: HTMLElement, save: Save, withLetter = false, skipTalk = false) {
  const root = await playDialogue(stage, save, skipTalk ? [] : PERSONAL.cenaEspecial, { night: true, keepOpen: true, title: 'Pedido Especial' });
  root.querySelector('.box')?.remove();
  root.querySelector('.title')?.remove();
  const herC = root.querySelector('.her-c') as HTMLElement;
  const youC = root.querySelector('.you-c') as HTMLImageElement;
  herC.classList.remove('dim'); youC.classList.remove('dim');
  herC.innerHTML = donaFace('coracao');
  youC.src = clientSrc('apaixonada');
  herC.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(30px)' }], { duration: 1200, fill: 'forwards', easing: 'ease-in-out' });
  youC.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-30px)' }], { duration: 1200, fill: 'forwards', easing: 'ease-in-out' });
  await wait(1200);
  const heart = el(`<div class="bigheart"><svg viewBox="0 0 40 40">${heartPath(20, 22, 1.9, '#F2738C', '#C2405E', 1.5)}</svg></div>`);
  root.appendChild(heart);
  sfx.levelup();
  heart.animate([{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.15)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)', opacity: 1 }], { duration: 1100, easing: 'cubic-bezier(.3,1.4,.5,1)', fill: 'forwards' });
  for (let i = 0; i < 40; i++) {
    const p = el(`<div class="petal" style="left:${Math.random() * 700}px;top:-40px"><svg viewBox="0 0 40 40">${heartPath(20, 22, 1.6, ['#F2738C', '#FFB3C4', '#FFD3DC', '#B7A6E8'][i % 4])}</svg></div>`);
    root.appendChild(p);
    p.animate([{ transform: 'translateY(0) rotate(0)' }, { transform: `translateY(${stage.offsetHeight + 80}px) rotate(${Math.random() * 360}deg) translateX(${Math.random() * 200 - 100}px)` }],
      { duration: 2500 + Math.random() * 2500, delay: Math.random() * 1800, easing: 'linear', fill: 'both' });
  }
  await wait(2600);
  if (!withLetter) {
    const t = el(`<div class="title" style="top:auto;bottom:16%">Continue… o melhor vem depois do expediente ✨</div>`);
    root.appendChild(t);
    await wait(2600);
    root.style.transition = 'opacity .6s'; root.style.opacity = '0';
    await wait(600);
    root.remove();
    return;
  }
  heart.animate([{ opacity: 1 }, { opacity: 0.15 }], { duration: 600, fill: 'forwards' });
  const letter = el(`<div class="letter"><pre></pre><div class="sig">com amor, ${PERSONAL.seuNome} ♥</div><div style="text-align:center"><button class="btn">Para sempre ♥</button></div></div>`);
  letter.querySelector('pre')!.textContent = PERSONAL.cartaFinal;
  root.appendChild(letter);
  await new Promise<void>(res => letter.querySelector('button')!.addEventListener('click', () => res(), { once: true }));
  root.style.transition = 'opacity .6s'; root.style.opacity = '0';
  await wait(600);
  root.remove();
}

/** Reabre só a carta (tela Nossa história). */
export async function showLetter(stage: HTMLElement) {
  ensureCSS();
  const root = el(`<div class="cs"><div class="bg" style="background:linear-gradient(#3A2F6B,#8C78CC 55%,#F7A9B8)"></div>
    <div class="letter"><pre></pre><div class="sig">com amor, ${PERSONAL.seuNome} ♥</div><div style="text-align:center"><button class="btn">Fechar</button></div></div></div>`);
  root.querySelector('pre')!.textContent = PERSONAL.cartaFinal;
  stage.appendChild(root);
  await new Promise<void>(res => root.querySelector('button')!.addEventListener('click', () => res(), { once: true }));
  root.remove();
}
