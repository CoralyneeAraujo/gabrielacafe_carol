import '@fontsource/fredoka/400.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import './style.css';
import { load, persist } from './state';
import { setMusic, setSound, unlockAudio } from './audio';
import type { App, SceneName } from './ui';
import { menuScene } from './scenes/menu';
import { customizeScene } from './scenes/customize';
import { dayScene } from './scenes/day';
import { summaryScene } from './scenes/summary';
import { shopScene } from './scenes/shop';
import { storyScene } from './scenes/story';
import { CLIENT_SPRITES, LEVELS, levelFromLove } from './data';
import { preloadDona } from './dona';
import { PERSONAL } from './personal';
import { playDialogue, playFinale, showLetter } from './scenes/cutscene';
import { clientSrc, STAGE_MAX_H, STAGE_MIN_H, STAGE_W } from './ui';

const stage = document.getElementById('stage')!;

// Palco em pé: 720 de largura e a altura acompanha a proporção da tela
// (Pixel 7/8, 1080x2400 → 720x1600). Em telas mais largas (PC) vira uma coluna centralizada.
function fit() {
  const w = window.innerWidth, h = window.innerHeight;
  const H = Math.round(Math.min(STAGE_MAX_H, Math.max(STAGE_MIN_H, STAGE_W * h / w)));
  stage.style.height = `${H}px`;
  stage.style.setProperty('--H', `${H}px`);
  const s = Math.min(w / STAGE_W, h / H);
  stage.style.transform = `translate(-50%, -50%) scale(${s})`;
}
window.addEventListener('resize', fit);
fit();

// pré-carrega os sprites das clientes para não piscarem na primeira aparição
CLIENT_SPRITES.forEach(n => { const i = new Image(); i.src = clientSrc(n); });
preloadDona();

const scenes: Record<SceneName, (app: App, data?: any) => (() => void) | void> = {
  menu: menuScene, customize: customizeScene, day: dayScene, summary: summaryScene, shop: shopScene, story: storyScene,
};

let dispose: (() => void) | void;
const app: App = {
  stage,
  save: load(),
  persist: () => persist(app.save),
  go(name, data) {
    if (dispose) dispose();
    stage.innerHTML = '';
    dispose = scenes[name](app, data);
  },
};
setSound(app.save.settings.sound);
setMusic(app.save.settings.music);
window.addEventListener('pointerdown', unlockAudio, { capture: true });
document.addEventListener('contextmenu', e => e.preventDefault());

// em desenvolvimento, ?cena=day abre direto uma tela (útil para conferir o layout)
const devScene = import.meta.env.DEV && new URLSearchParams(location.search).get('cena');
// e ?nivel=9 simula o Amor daquele nível (sem salvar)
const devLevel = import.meta.env.DEV && Number(new URLSearchParams(location.search).get('nivel'));
if (devLevel) { app.save.love = LEVELS[Math.min(devLevel, LEVELS.length) - 1].love; app.save.level = levelFromLove(app.save.love); app.save.tutorialDone = true; app.persist = () => {}; }
app.go(devScene && devScene in scenes ? devScene as SceneName : 'menu');

// e ?memoria=14 abre aquela memória direto (só em desenvolvimento)
const devMem = import.meta.env.DEV && Number(new URLSearchParams(location.search).get('memoria'));
const mem = devMem && PERSONAL.memorias.find(m => m.nivel === devMem);
if (mem) playDialogue(stage, app.save, mem.falas, { title: mem.titulo, night: mem.noite });
// e ?final=1 abre a cena do Pedido Especial (sem a carta); ?final=coracao pula as falas
const devFinal = import.meta.env.DEV && new URLSearchParams(location.search).get('final');
if (devFinal) playFinale(stage, app.save, false, devFinal === 'coracao');
// e ?carta=1 abre só a carta
if (import.meta.env.DEV && new URLSearchParams(location.search).get('carta')) showLetter(stage);
