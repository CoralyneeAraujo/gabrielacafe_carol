import { UI } from '../icons';
import { LEVELS, MAX_LEVEL, TESTE, SPECIAL_LEVEL, levelFromLove } from '../data';
import { PERSONAL } from '../personal';
import { sfx } from '../audio';
import { type App, el, fmt, lovePill, wait } from '../ui';
import type { DayResult } from './day';
import { playDialogue, showLetter } from './cutscene';
import { goalForDay } from '../goals';

export function summaryScene(app: App, r: DayResult) {
  const { stage, save } = app;
  const before = save.level;
  const stars = r.coins >= r.target ? 3 : r.coins >= r.target * 0.75 ? 2 : r.coins >= r.target * 0.4 ? 1 : 0;

  // objetivo do dia (calculado antes de avançar o dia)
  const goal = goalForDay(save.day, save.level);
  const goalOk = goal.value(r) >= goal.target;
  const bonusCoins = goalOk ? goal.reward.coins : 0, bonusLove = goalOk ? goal.reward.love : 0;

  // grava o resultado do dia
  save.coins += r.coins + bonusCoins;
  if (save.settings.teste) r.love *= TESTE.love;
  save.love += r.love + bonusLove;
  save.stats.served += r.served;
  save.stats.coinsEarned += r.coins + bonusCoins;
  save.stats.perfect += r.perfect;
  if (goalOk) save.stats.goals++;
  save.stars += stars;
  save.day += 1;
  save.bestCombo = Math.max(save.bestCombo, r.bestCombo);
  if (r.special) save.specialDone = true;
  save.level = levelFromLove(save.love);
  if (save.level >= SPECIAL_LEVEL && !save.specialDay) save.specialDay = save.day;
  app.persist();
  const newLevels = LEVELS.filter(l => l.n > before && l.n <= save.level);

  const root = el(`<div class="abs" style="inset:0;background:linear-gradient(160deg,#C9B8F2 0%,#F7C1CF 55%,#FFD9C0 100%)">
    <div class="panel" style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:680px;padding:28px 24px;--t:translate(-50%,-50%)">
      <h2>${r.special ? 'Um dia para sempre ♥' : `Fim do dia ${r.day}`}</h2>
      <div class="row" style="gap:6px;margin-bottom:14px" data-stars>${[0, 1, 2].map(() => `<span style="width:72px;height:72px;display:block">${UI.starOff}</span>`).join('')}</div>
      <div style="display:grid;grid-template-columns:1fr auto;gap:10px 20px;font-size:22px;font-variant-numeric:tabular-nums;padding:0 8px">
        <span>Clientes atendidas</span><b>${r.served}${r.missed ? ` <small style="color:#D24F6C;font-size:18px">(${r.missed} foram embora)</small>` : ''}</b>
        <span>Moedas</span><b data-count="${r.coins}">+0</b>
        <span>Gorjetas e combos</span><b>${fmt(r.tips)}</b>
        <span>Amor</span><b style="color:#D24F6C">+${r.love} ♥</b>
        <span>Maior combo</span><b>${r.bestCombo}</b>
        <span>Objetivo: ${goal.text}</span><b style="color:${goalOk ? '#4E8A33' : '#A8968E'}">${goalOk ? `✓ +${bonusCoins} · +${bonusLove} ♥` : `${Math.min(goal.value(r), goal.target)} / ${goal.target}`}</b>
      </div>
      <div class="row" style="margin:18px 0 6px">${lovePill(save)}</div>
      <div data-lvl></div>
      <div class="row" style="margin-top:18px" data-btns>
        <button class="btn white sm" data-a="menu">Menu</button>
        <button class="btn gold" data-a="shop">Melhorias</button>
        <button class="btn leaf" data-a="play">Próximo dia</button>
      </div>
    </div></div>`);
  stage.appendChild(root);

  (async () => {
    const cnt = root.querySelector('[data-count]') as HTMLElement;
    const steps = 20;
    for (let i = 1; i <= steps; i++) { cnt.textContent = '+' + fmt((r.coins * i) / steps); await wait(30); }
    const st = root.querySelectorAll('[data-stars] > span');
    for (let i = 0; i < stars; i++) {
      await wait(250);
      st[i].innerHTML = UI.star;
      st[i].animate([{ transform: 'scale(0)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 400, easing: 'ease-out' });
      sfx.coin();
    }
    if (newLevels.length) {
      await wait(400);
      sfx.levelup();
      const box = root.querySelector('[data-lvl]') as HTMLElement;
      const l = newLevels[newLevels.length - 1];
      const mem = PERSONAL.memorias.filter(m => newLevels.some(n => n.n === m.nivel));
      box.innerHTML = `<div style="background:#fff;border-radius:22px;padding:14px 22px;margin-top:10px;text-align:center;border:3px solid #F7C6D2">
        <div style="font-size:30px;font-weight:600;color:#D24F6C">${l.emoji} Nível ${l.n}: ${l.name}!</div>
        <div style="font-family:var(--fb);font-weight:700;font-size:19px;margin-top:4px">${newLevels.flatMap(n => n.unlocks).join(' · ') || l.event}</div>
        ${mem.length ? `<button class="btn sm" style="margin-top:12px" data-a="memory">Ver memória ♥</button>` : ''}
        ${l.n === MAX_LEVEL ? `<button class="btn sm" style="margin-top:12px" data-a="final">Abrir o final ♥</button>` : ''}</div>`;
      box.animate([{ transform: 'scale(.6)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 450, easing: 'cubic-bezier(.3,1.5,.5,1)' });
    }
  })();

  root.addEventListener('click', async e => {
    const a = (e.target as HTMLElement).closest('[data-a]')?.getAttribute('data-a');
    if (!a) return;
    sfx.tap();
    if (a === 'menu') app.go('menu');
    else if (a === 'shop') app.go('shop');
    else if (a === 'play') app.go('day');
    else if (a === 'final') await showLetter(stage);
    else if (a === 'memory') {
      for (const m of PERSONAL.memorias.filter(m => newLevels.some(n => n.n === m.nivel))) {
        await playDialogue(stage, save, m.falas, { title: m.titulo, night: m.noite });
        if (!save.seenMemories.includes(m.nivel)) save.seenMemories.push(m.nivel);
      }
      app.persist();
    }
  });
}
