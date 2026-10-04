import { donaBody, donaFace, type Rosto } from '../dona';
import { ITEM_ICON, STATION_ICON, UI, dishSVG } from '../icons';
import {
  ALWAYS_NIGHT_LEVEL, NIGHT_LEVEL, SPECIAL_LEVEL, VERSOES_NIVEL10, BASE_PATIENCE, BINS, CUSTOMER_TYPES, DAY_LENGTH, ITEMS, TESTE, RECIPES, SPEED, STATIONS, UPGRADES,
  canAdd, matchRecipe, recipeById, type ClientSprite, type CustType, type StationDef,
} from '../data';
import { PERSONAL } from '../personal';
import { upg } from '../state';
import { sfx } from '../audio';
import { type App, banner, clientSrc, confirmBox, el, floatText, fly, fmt, lovePill, rand, stageH, stagePos, toast, wait } from '../ui';
import { restaurantHTML, skyAt, tableDeco } from './restaurant';
import { playFinale } from './cutscene';
import { goalForDay } from '../goals';

type Cust = {
  id: number; type: CustType; seat: number; el: HTMLElement; img: HTMLImageElement;
  bubble: HTMLElement | null; state: 'walking' | 'waiting' | 'served' | 'leaving';
  order: string[]; remaining: string[]; pat: number; patTotal: number; sprite: ClientSprite; waitSprite: ClientSprite;
  special: boolean; tutorial: boolean; speech?: HTMLElement; talkUntil?: number;
};
type Station = { def: StationDef; state: 'idle' | 'cooking' | 'ready'; t: number; dur: number; el: HTMLElement };
type Plate = { items: string[]; el: HTMLElement };

export type DayResult = {
  day: number; served: number; missed: number; coins: number; tips: number; love: number;
  bestCombo: number; target: number; special: boolean; dishes: Record<string, number>; perfect: number;
};

// Layout em pé (720 x altura do aparelho): HUD no topo, salão com as mesas em duas fileiras,
// bancada e balcão presos embaixo, perto do polegar.
const COUNTER_H = 250, BENCH_H = 150;
const CUST_H = 176;
/** Posição de cada mesa (x do centro, fileira). A ordem é a ordem de desbloqueio. */
const SEATS: { x: number; row: 0 | 1 }[] = [{ x: 160, row: 0 }, { x: 560, row: 0 }, { x: 260, row: 1 }, { x: 460, row: 1 }, { x: 360, row: 0 }];

export function dayScene(app: App) {
  const { stage, save } = app;
  const lvl = save.level;
  const night = (save.settings.night && lvl >= NIGHT_LEVEL) || lvl >= ALWAYS_NIGHT_LEVEL;
  const tables = Math.min(5, 2 + upg(save, 'mesas') + (lvl >= 5 ? 2 : 0));
  const plateCount = 2 + upg(save, 'pratos');
  const patienceBonus = 1 + UPGRADES.filter(u => u.patience && upg(save, u.id)).reduce((a, u) => a + (u.patience || 0), 0);
  const recipes = RECIPES.filter(r => r.level <= lvl);
  const tutorial = !save.tutorialDone;
  const specialToday = lvl >= SPECIAL_LEVEL && !save.specialDone && save.specialDay > 0 && save.day >= save.specialDay;
  const target = 50 + save.day * 12;

  const dayLen = save.settings.teste ? TESTE.dayLength : DAY_LENGTH;
  let elapsed = 0, paused = false, ended = false, spawnT = 1.2, nextId = 1;
  let combo = 0, specialSpawned = false;
  const res: DayResult = { day: save.day, served: 0, missed: 0, coins: 0, tips: 0, love: 0, bestCombo: 0, target, special: false, dishes: {}, perfect: 0 };
  const goal = goalForDay(save.day, save.level);
  let goalDone = false;
  const seen = (s: string) => { if (!save.seenSprites.includes(s)) save.seenSprites.push(s); };
  const customers: Cust[] = [];
  const seatTaken: boolean[] = SEATS.map(() => false);

  const H = stageH(stage);
  const benchTop = H - COUNTER_H - BENCH_H;
  const rowFloor = [benchTop - 310, benchTop - 30];  // onde ficam os pés das clientes em cada fileira
  const wallH = rowFloor[0] - 130;
  const seatX = (i: number) => SEATS[i].x;
  const custTop = (i: number) => rowFloor[SEATS[i].row] - CUST_H;
  const DOOR = { x: 20, y: wallH - CUST_H + 20 };
  const HER_IDLE = { x: 520, y: benchTop - 217 };
  /** Segundos que a cliente leva entre a porta e a mesa: depende da distância, para o passo ter sempre o mesmo ritmo. */
  const walkTime = (seat: number, type: CustType) =>
    Math.max(1.3, Math.hypot(seatX(seat) - 78 - DOOR.x, custTop(seat) - DOOR.y) / 230) * type.walk;

  // ---------- montagem da tela ----------
  const root = el(`<div class="abs${night ? ' night' : ''}" style="inset:0"></div>`);
  root.innerHTML = restaurantHTML(save, wallH, H);
  stage.appendChild(root);
  const tableEls = SEATS.map((s, i) => {
    const t = el(`<div class="abs table${i >= tables ? ' locked' : ''}" style="left:${s.x - 75}px;top:${rowFloor[s.row] - 25}px;z-index:${6 + s.row * 2}">${i < tables ? `<div class="deco">${tableDeco(save)}</div>` : ''}</div>`);
    root.appendChild(t);
    return t;
  });
  void tableEls;

  const her = el(`<div class="abs her" style="left:${HER_IDLE.x}px;top:${HER_IDLE.y}px">${donaBody(save.roupa)}<div class="face" hidden></div></div>`);
  root.appendChild(her);
  // reações da dona: um rostinho da folha aparece num balão redondo acima da cabeça
  const faceEl = her.querySelector('.face') as HTMLElement;
  let faceTimer = 0;
  const react = (f: Rosto, ms = 1500) => {
    clearTimeout(faceTimer);
    faceEl.innerHTML = donaFace(f);
    faceEl.hidden = false;
    faceEl.style.animation = 'none'; void faceEl.offsetWidth; faceEl.style.animation = '';
    faceTimer = window.setTimeout(() => { faceEl.hidden = true; }, ms);
  };
  // jeitinho estressado: sem paciência quando algo dá errado ou o salão aperta
  const BRAVINHA: Rosto[] = ['bravo_leve', 'chateada', 'seria', 'confusa'];
  let bravaCooldown = 0;
  const bravinha = (chance = 1) => {
    if (bravaCooldown > 0 || Math.random() > chance) return;
    bravaCooldown = 6;
    react(rand(BRAVINHA), 1400);
  };

  // bancada de montagem
  const bench = el(`<div class="abs bench" style="top:${benchTop}px"><div class="plates"></div><div class="bench-label">Bancada</div></div>`);
  root.appendChild(bench);
  const plates: Plate[] = [];
  let selPlate = 0;
  for (let i = 0; i < plateCount; i++) {
    const p = el(`<div class="plate" data-act="plate" data-i="${i}"></div>`);
    bench.querySelector('.plates')!.appendChild(p);
    plates.push({ items: [], el: p });
  }

  // balcão: estações + ingredientes + lixeira
  const counter = el(`<div class="abs counter"><div class="crow"></div><div class="crow"></div></div>`);
  root.appendChild(counter);
  const [rowCook, rowBins] = Array.from(counter.children) as HTMLElement[];
  const stations: Station[] = STATIONS.filter(s => s.level <= lvl).map(def => {
    const dur = def.time * SPEED[upg(save, 'speed_' + def.id)] * (save.settings.teste ? TESTE.cook : 1);
    const t = el(`<div class="tile station" data-act="station" data-id="${def.id}">${STATION_ICON[def.id]}<em>${def.name}</em><div class="prog"><i></i></div></div>`);
    rowCook.appendChild(t);
    return { def, state: 'idle' as const, t: 0, dur, el: t };
  });
  BINS.filter(b => ITEMS[b].level <= lvl).forEach(b => {
    rowBins.appendChild(el(`<div class="tile" data-act="bin" data-id="${b}">${ITEM_ICON[b]}<em>${ITEMS[b].name}</em></div>`));
  });
  rowCook.appendChild(el(`<div class="tile sep" data-act="trash">${STATION_ICON.lixeira}<em>Lixeira</em></div>`));

  // HUD
  const hud = el(`<div class="hud">
    <div><span class="pill" data-hud="coins">${UI.coin}<span>${fmt(save.coins)}</span></span>
      <span class="pill">${UI.clock}<span data-hud="clock">Dia ${save.day}</span><span class="bar gold" style="width:110px" data-hud="time"><i style="width:100%"></i></span></span>
      <button class="rbtn" data-act="pause" aria-label="Pausar">${UI.pause}</button></div>
    <div><span class="pill" data-hud="stars"><span class="stars"></span><span class="bar gold" style="width:70px"><i></i></span></span>
      ${lovePill(save)}</div></div>`);
  root.appendChild(hud);
  const comboEl = el(`<div class="abs combo" hidden></div>`);
  root.appendChild(comboEl);

  const coinsSpan = hud.querySelector('[data-hud="coins"] span') as HTMLElement;
  const starsEl = hud.querySelector('.stars') as HTMLElement;
  const starBar = hud.querySelector('[data-hud="stars"] .bar i') as HTMLElement;
  const timeBar = hud.querySelector('[data-hud="time"] i') as HTMLElement;
  const loveBarI = () => hud.querySelector('[data-hud="love"] .bar i') as HTMLElement;

  function starsFor(c: number) { return c >= target ? 3 : c >= target * 0.75 ? 2 : c >= target * 0.4 ? 1 : 0; }
  function refreshHUD() {
    coinsSpan.textContent = fmt(save.coins + res.coins);
    const n = starsFor(res.coins);
    starsEl.innerHTML = [0, 1, 2].map(i => (i < n ? UI.star : UI.starOff)).join('');
    starBar.style.width = Math.min(100, (res.coins / target) * 100) + '%';
    const tmp = lovePill({ ...save, love: save.love + res.love } as typeof save);
    const w = /width:([\d.]+)%/.exec(tmp)?.[1];
    if (w) loveBarI().style.width = w + '%';
  }
  refreshHUD();

  // ---------- plates ----------
  function renderPlate(i: number) {
    const p = plates[i];
    const r = matchRecipe(p.items);
    const wanted = r && customers.some(c => c.state === 'waiting' && c.remaining.includes(r.id));
    p.el.className = 'plate' + (wanted ? ' match' : i === selPlate && p.items.length ? ' sel' : '');
    p.el.innerHTML = dishSVG(p.items) + (wanted ? `<span class="lbl">${r!.name}</span>` : '');
  }
  const renderPlates = () => plates.forEach((_, i) => renderPlate(i));
  renderPlates();

  function place(item: string): boolean {
    let target = -1;
    if (canAdd(plates[selPlate].items, item) && (plates[selPlate].items.length || ITEMS[item].starter)) target = selPlate;
    if (target < 0) target = plates.findIndex(p => p.items.length > 0 && canAdd(p.items, item));
    if (target < 0 && ITEMS[item].starter) target = plates.findIndex(p => p.items.length === 0);
    if (target < 0) {
      sfx.error();
      bravinha();
      toast(stage, ITEMS[item].starter ? 'A bancada está cheia: entregue ou jogue um prato fora' : 'Comece pela base do prato primeiro');
      return false;
    }
    plates[target].items.push(item);
    selPlate = target;
    sfx.pop();
    renderPlates();
    return true;
  }

  // ---------- estações ----------
  function renderStation(s: Station) {
    s.el.classList.toggle('cooking', s.state === 'cooking');
    s.el.classList.toggle('isready', s.state === 'ready');
    s.el.querySelector('.ready')?.remove();
    if (s.state === 'ready') s.el.appendChild(el(`<div class="ready">${ITEM_ICON[s.def.makes]}</div>`));
    (s.el.querySelector('.prog i') as HTMLElement).style.width = s.state === 'cooking' ? `${(s.t / s.dur) * 100}%` : '0';
  }

  // ---------- clientes ----------
  function pickType(): CustType {
    const pool = CUSTOMER_TYPES.filter(t => t.level <= lvl && (!t.only || recipes.some(r => r.id === t.only)));
    let w = pool.reduce((a, t) => a + t.weight, 0) * Math.random();
    for (const t of pool) { w -= t.weight; if (w <= 0) return t; }
    return pool[0];
  }

  function freeSeat() {
    const free = seatTaken.map((t, i) => (!t && i < tables ? i : -1)).filter(i => i >= 0);
    return free.length ? rand(free) : -1;
  }

  function spawn(opts: { special?: boolean; tutorial?: boolean } = {}) {
    const seat = freeSeat();
    if (seat < 0) return;
    seatTaken[seat] = true;
    const type = opts.special || opts.tutorial ? CUSTOMER_TYPES[0] : pickType();
    let order: string[];
    if (opts.special) {
      order = PERSONAL.pedidoEspecial.receitas.filter(id => recipes.some(r => r.id === id));
      if (!order.length) order = ['hamburguer', 'batata', 'cafe'];
    } else if (opts.tutorial) order = ['hamburguer'];
    else if (type.only) order = [type.only];
    else order = Array.from({ length: type.dishes }, () => rand(recipes).id);
    const waiting = type.waiting.filter(s => lvl >= 10 || !VERSOES_NIVEL10.includes(s));
    const waitSprite: ClientSprite = opts.special ? 'pedido_especial' : rand(waiting.length ? waiting : type.waiting);
    const c: Cust = {
      id: nextId++, type, seat, order, remaining: [...order], pat: 1,
      patTotal: BASE_PATIENCE * type.patience * patienceBonus * (order.length > 1 ? 1.35 : 1),
      el: el(`<div class="abs cust walking" style="left:${DOOR.x}px;top:${DOOR.y}px;z-index:${5 + SEATS[seat].row * 2};--walk:${walkTime(seat, type).toFixed(2)}s"><img alt="" src="${clientSrc(waitSprite)}"></div>`),
      img: null as unknown as HTMLImageElement, bubble: null, state: 'walking', sprite: waitSprite, waitSprite,
      special: !!opts.special, tutorial: !!opts.tutorial,
    };
    c.img = c.el.querySelector('img')!;
    seen(waitSprite);
    root.appendChild(c.el);
    customers.push(c);
    sfx.bell();
    requestAnimationFrame(() => requestAnimationFrame(() => { c.el.style.left = `${seatX(seat) - 78}px`; c.el.style.top = `${custTop(seat)}px`; }));
    setTimeout(() => {
      if (c.state !== 'walking') return;
      c.el.classList.remove('walking');
      c.state = 'waiting';
      showBubble(c);
      if (!c.tutorial && !c.special && Math.random() < 0.35) say(c, PERSONAL.frasesEsperando, 160);
      if (c.tutorial) tutorialRefresh();
    }, walkTime(seat, type) * 1000 + 150);
  }

  // balão de fala: cada cliente tem o seu, fica tempo suficiente para ler e não repete a última frase
  let lastLine = '';
  const readMs = (t: string) => Math.max(3500, 1600 + t.length * 55);
  function say(c: Cust, lines: string[], above = 100) {
    let line = rand(lines);
    if (line === lastLine && lines.length > 1) line = lines[(lines.indexOf(line) + 1) % lines.length];
    lastLine = line;
    c.speech?.remove();
    const x = seatX(c.seat);
    const sp = el(`<div class="abs speech" style="left:${Math.max(10, Math.min(450, x - 110))}px;top:${custTop(c.seat) - above}px">${line}</div>`);
    root.appendChild(sp);
    c.speech = sp;
    const ms = readMs(line);
    c.talkUntil = performance.now() + ms;
    setTimeout(() => { sp.remove(); if (c.speech === sp) c.speech = undefined; }, ms);
  }

  function setSprite(c: Cust, s: ClientSprite) {
    if (c.sprite === s) return;
    c.sprite = s;
    seen(s);
    c.img.src = clientSrc(s);
    c.el.classList.remove('react'); void c.el.offsetWidth; c.el.classList.add('react');
  }

  function showBubble(c: Cust) {
    c.bubble?.remove();
    const many = c.order.length > 1;
    const w = c.order.length > 2 ? 200 : c.order.length > 1 ? 160 : 100;
    const left = Math.max(8, Math.min(712 - w, seatX(c.seat) - 70));
    const b = el(`<div class="abs order${c.special ? ' special' : ''}" style="left:${left}px;top:${custTop(c.seat) - (many ? 101 : 97)}px"></div>`);
    root.appendChild(b);
    c.bubble = b;
    renderBubble(c);
  }

  function renderBubble(c: Cust) {
    if (!c.bubble) return;
    const remaining = [...c.remaining];
    const icons = c.order.map(id => {
      const k = remaining.indexOf(id);
      const done = k < 0;
      if (!done) remaining.splice(k, 1);
      const size = c.order.length > 2 ? 54 : c.order.length > 1 ? 62 : 72;
      return `<span class="${done ? 'done' : ''}" style="width:${size}px;height:${size}px;display:block">${dishSVG(recipeById(id).items).replace('<svg ', `<svg style="width:${size}px;height:${size}px" `)}</span>`;
    }).join('');
    const hearts = c.special ? 'Pedido Especial ✦' : (settingsRelax() || c.tutorial ? '♥♥♥♥' : '♥'.repeat(Math.ceil(c.pat * 4)) + '♡'.repeat(4 - Math.ceil(c.pat * 4)));
    c.bubble.innerHTML = icons + `<span class="pat">${hearts}</span>`;
    c.bubble.classList.toggle('low', c.pat < 0.3 && !c.special && !settingsRelax());
  }
  const settingsRelax = () => save.settings.relax;

  function leave(c: Cust, sad: boolean) {
    c.state = 'leaving';
    c.bubble?.remove(); c.bubble = null;
    if (sad) setSprite(c, c.type.id === 'impaciente' ? 'brava' : 'triste');
    // se ela está falando, só levanta depois de terminar a frase
    const stay = Math.max(sad ? 1100 : 1500, (c.talkUntil || 0) - performance.now());
    setTimeout(() => {
      c.speech?.remove();
      c.el.classList.add('walking');
      c.el.style.left = `${DOOR.x}px`; c.el.style.top = `${DOOR.y}px`;
      const t = walkTime(c.seat, c.type) * 1000;
      setTimeout(() => { c.el.style.opacity = '0'; }, t - 350);
      setTimeout(() => {
        c.el.remove();
        seatTaken[c.seat] = false;
        customers.splice(customers.indexOf(c), 1);
        renderPlates();
      }, t + 100);
    }, stay);
  }

  // ---------- entrega ----------
  let herBusy: Promise<void> = Promise.resolve();
  let herPending = 0;

  function tryDeliver(pi: number): boolean {
    const p = plates[pi];
    const r = matchRecipe(p.items);
    if (!r) return false;
    const cands = customers.filter(c => c.state === 'waiting' && c.remaining.includes(r.id))
      .sort((a, b) => Number(b.special) - Number(a.special) || a.pat - b.pat);
    const c = cands[0];
    if (!c) return false;
    const dish = dishSVG(p.items);
    p.items = [];
    c.remaining.splice(c.remaining.indexOf(r.id), 1);
    const finished = c.remaining.length === 0;
    if (finished) c.state = 'served';
    renderPlates();
    herPending++;
    herBusy = herBusy.then(async () => {
      her.classList.add('walking');
      react('com_prato', 700);
      her.insertAdjacentHTML('beforeend', `<div class="carry">${dish}</div>`);
      her.style.left = `${Math.min(570, seatX(c.seat) + 40)}px`;
      her.style.top = `${custTop(c.seat) - 16}px`;
      await wait(330);
      her.classList.remove('walking');
      her.querySelector('.carry')?.remove();
      const pos = { x: seatX(c.seat), y: custTop(c.seat) + 130 };
      floatText(stage, pos.x, pos.y - 60, `${r.name}!`);
      res.dishes[r.id] = (res.dishes[r.id] || 0) + 1;
      checkGoal();
      sfx.pop();
      if (finished) serve(c); else { renderBubble(c); c.pat = Math.min(1, c.pat + 0.15); setSprite(c, 'surpresa'); setTimeout(() => c.state === 'waiting' && setSprite(c, c.waitSprite), 1200); }
      await wait(160);
      herPending--;
      if (herPending === 0) {
        her.classList.add('walking');
        her.style.left = `${HER_IDLE.x}px`; her.style.top = `${HER_IDLE.y}px`;
        await wait(330);
        her.classList.remove('walking');
      }
    });
    return true;
  }

  function serve(c: Cust) {
    const frac = c.special || c.tutorial || save.settings.relax ? 1 : c.pat;
    const price = c.order.reduce((a, id) => a + recipeById(id).price, 0);
    const tip = Math.round(price * 0.45 * frac * c.type.tip);
    let love = c.order.length * (frac > 0.6 ? 2 : 1) * c.type.love;
    combo++;
    res.bestCombo = Math.max(res.bestCombo, combo);
    let bonus = 0;
    if (combo >= 3 && combo % 3 === 0) { bonus = 5 * (combo / 3); love += 1; }
    res.coins += price + tip + bonus; res.tips += tip + bonus; res.love += love; res.served++;
    if (frac > 0.75) res.perfect++;
    checkGoal();
    const onlyCoffee = c.order.every(id => id === 'cafe');
    const reaction: ClientSprite = c.special ? 'muito_feliz'
      : onlyCoffee ? 'com_cafe'
      : frac > 0.75 ? rand(['comemorando', 'apaixonada', 'muito_feliz', 'rindo'] as ClientSprite[])
      : frac > 0.4 ? rand(['feliz', 'joinha', 'surpresa_feliz'] as ClientSprite[])
      : 'feliz';
    setSprite(c, reaction);
    c.bubble?.remove(); c.bubble = null;
    const x = seatX(c.seat), y = custTop(c.seat) + 31;
    floatText(stage, x, y - 20, `+${price + tip + bonus}`);
    const coinPos = stagePos(stage, hud.querySelector('[data-hud="coins"]')!);
    const lovePos = stagePos(stage, hud.querySelector('[data-hud="love"]')!);
    for (let i = 0; i < Math.min(6, 2 + Math.floor((price + tip) / 8)); i++) fly(stage, UI.coin, { x, y }, coinPos, i * 70);
    for (let i = 0; i < Math.min(5, love); i++) fly(stage, UI.heart, { x, y: y - 20 }, lovePos, 200 + i * 90);
    sfx.coin(); setTimeout(() => sfx.love(), 300);
    setTimeout(refreshHUD, 800);
    if (combo >= 3) { comboEl.hidden = false; comboEl.textContent = `Combo ×${combo}!`; comboEl.style.animation = 'none'; void comboEl.offsetWidth; comboEl.style.animation = ''; }
    if (!c.special && Math.random() < 0.65) say(c, PERSONAL.frasesClientes);
    react(c.special ? 'carinha_de_amor' : frac > 0.75 ? rand(['empolgada', 'rindo', 'animada'] as Rosto[]) : 'feliz');
    if (c.tutorial) { tutorialStep = 'done'; tutorialRefresh(); }
    if (c.special) { finishSpecial(c); return; }
    leave(c, false);
  }

  async function finishSpecial(c: Cust) {
    paused = true;
    res.special = true;
    await wait(1400);
    await playFinale(stage, save, save.level >= 15);
    c.el.remove();
    seatTaken[c.seat] = false;
    customers.splice(customers.indexOf(c), 1);
    endDay(true);
  }

  function checkGoal() {
    if (goalDone || goal.value(res) < goal.target) return;
    goalDone = true;
    sfx.levelup();
    react('vitoriosa', 2200);
    banner(stage, 'Objetivo do dia concluído! ★', 1800);
  }

  // ---------- tutorial ----------
  let tutorialStep: 'on' | 'done' | 'off' = tutorial ? 'on' : 'off';
  let hintEl: HTMLElement | null = null;
  function hint(text: string, target: Element | null, above = true) {
    hintEl?.remove(); hintEl = null;
    if (!text) return;
    const h = el(`<div class="abs hint${above ? '' : ' up'}">${text}</div>`);
    root.appendChild(h);
    const w = Math.min(420, h.offsetWidth || 360);
    if (target) {
      const p = stagePos(stage, target);
      const left = Math.max(10, Math.min(710 - w, p.x - w / 2));
      h.style.left = left + 'px';
      h.style.setProperty('--ax', `${p.x - left}px`);
      h.style.top = above ? `${p.y - p.h / 2 - 16 - (h.offsetHeight || 60)}px` : `${p.y + p.h / 2 + 16}px`;
    } else { h.style.left = `${360 - w / 2}px`; h.style.top = `${wallH / 2}px`; }
    hintEl = h;
  }
  function tutorialRefresh() {
    if (tutorialStep === 'off') return;
    if (tutorialStep === 'done') {
      hint('Perfeito! Cada cliente feliz te dá moedas e Amor ♥<br>Agora é com você!', null);
      tutorialStep = 'off';
      save.tutorialDone = true; app.persist();
      setTimeout(() => hint('', null), 3500);
      return;
    }
    const c = customers.find(x => x.tutorial);
    if (!c || c.state !== 'waiting') return;
    const chapa = stations.find(s => s.def.id === 'chapa')!;
    const pi = plates.findIndex(p => matchRecipe(p.items)?.id === 'hamburguer');
    const hasCarne = plates.some(p => p.items.includes('carne'));
    const hasPao = plates.some(p => p.items.includes('pao'));
    if (pi >= 0) hint('Hambúrguer pronto! Toque no prato para entregar', plates[pi].el);
    else if (hasCarne && !hasPao) hint('Agora toque no <b>pão</b>', rowBins.querySelector('[data-id="pao"]'));
    else if (chapa.state === 'ready') hint('A carne ficou pronta! Toque nela para pôr no prato', chapa.el);
    else if (chapa.state === 'cooking') hint('A carne está fritando…', chapa.el);
    else if (!hasCarne) hint('A cliente quer um hambúrguer.<br>Toque na <b>chapa</b> para fritar a carne', chapa.el);
  }

  // ---------- entrada ----------
  async function onAct(e: PointerEvent) {
    const t = (e.target as HTMLElement).closest('[data-act]') as HTMLElement | null;
    if (!t || ended) return;
    const act = t.dataset.act;
    if (act === 'pause') { pause(); return; }
    if (paused) return;
    if (act === 'station') {
      const s = stations.find(x => x.def.id === t.dataset.id)!;
      if (s.state === 'idle') { s.state = 'cooking'; s.t = 0; sfx.tap(); react('concentrada', 1100); }
      else if (s.state === 'ready') { if (place(s.def.makes)) { s.state = 'idle'; } }
      else { t.classList.remove('shake'); void t.offsetWidth; t.classList.add('shake'); bravinha(0.5); }
      renderStation(s);
    } else if (act === 'bin') {
      place(t.dataset.id!);
    } else if (act === 'plate') {
      const i = Number(t.dataset.i);
      if (!tryDeliver(i)) {
        if (plates[i].items.length && matchRecipe(plates[i].items)) { sfx.error(); bravinha(); toast(stage, 'Ninguém pediu esse prato agora'); }
        selPlate = i; renderPlates(); sfx.tap();
      }
    } else if (act === 'trash') {
      const i = plates[selPlate].items.length ? selPlate : plates.findIndex(p => p.items.length);
      if (i >= 0) { plates[i].items = []; renderPlates(); sfx.pop(); bravinha(0.6); }
    }
    tutorialRefresh();
  }
  root.addEventListener('pointerdown', onAct);

  async function pause() {
    if (paused || ended) return;
    paused = true;
    const leaveDay = await confirmBox(stage, 'Pausado', 'Quer voltar ao menu? O progresso deste dia não será salvo.', 'Sair para o menu', 'Continuar');
    if (leaveDay) { ended = true; app.go('menu'); return; }
    paused = false;
    last = performance.now();
  }
  const onVis = () => { if (document.hidden) pause(); };
  document.addEventListener('visibilitychange', onVis);

  // ---------- loop ----------
  let last = performance.now(), raf = 0, skyTick = -1;
  const win = root.querySelectorAll<HTMLElement>('.r-win');
  function update(dt: number) {
    const tutBlocking = tutorialStep === 'on';
    if (!tutBlocking) elapsed += dt;
    const frac = Math.min(1, elapsed / dayLen);
    timeBar.style.width = `${(1 - frac) * 100}%`;
    const tick = Math.floor(frac * 8);
    if (tick !== skyTick) { skyTick = tick; win.forEach(w => w.style.setProperty('--sky', skyAt(frac, night))); }

    for (const s of stations) {
      if (s.state !== 'cooking') continue;
      s.t += dt;
      if (s.t >= s.dur) { s.state = 'ready'; sfx.ready(); renderStation(s); tutorialRefresh(); }
      else (s.el.querySelector('.prog i') as HTMLElement).style.width = `${(s.t / s.dur) * 100}%`;
    }

    // chegada de clientes
    if (tutorial && !customers.length && tutorialStep === 'on' && elapsed === 0 && !nextId_tutorialSpawned) { nextId_tutorialSpawned = true; spawn({ tutorial: true }); }
    if (!tutBlocking && elapsed < dayLen - 6) {
      const wantSpecial = specialToday && !specialSpawned && elapsed > dayLen * 0.35;
      spawnT -= dt;
      if (wantSpecial) {
        if (freeSeat() >= 0) { specialSpawned = true; spawn({ special: true }); react('surpresa', 2200); banner(stage, 'Uma cliente muito especial chegou…', 2200); }
      } else if (spawnT <= 0 && freeSeat() >= 0) {
        spawn();
        spawnT = save.settings.teste ? TESTE.spawnEvery : Math.max(4.5, 10.5 - save.day * 0.3) + (Math.random() * 3 - 1.5);
      }
    }

    // salão apertado (2+ clientes esperando há tempo): de vez em quando ela bufa
    bravaCooldown = Math.max(0, bravaCooldown - dt);
    if (customers.filter(c => c.state === 'waiting' && c.pat < 0.6).length >= 2) bravinha(dt / 5);

    // paciência
    for (const c of customers) {
      if (c.state !== 'waiting' || c.special || c.tutorial || save.settings.relax) continue;
      const before = Math.ceil(c.pat * 4);
      c.pat -= dt / c.patTotal;
      if (c.pat < 0.33 && c.sprite === c.waitSprite) { setSprite(c, 'impaciente'); bravinha(0.7); if (Math.random() < 0.5) say(c, PERSONAL.frasesImpaciente, 160); }
      if (c.pat <= 0) {
        c.pat = 0; res.missed++; combo = 0; comboEl.hidden = true; sfx.sad(); react('triste');
        leave(c, true);
        continue;
      }
      if (Math.ceil(c.pat * 4) !== before) renderBubble(c);
    }

    if (elapsed >= dayLen && customers.length === 0 && !ended) endDay(false);
  }
  let nextId_tutorialSpawned = false;

  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!paused && !ended) update(dt);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  if (specialToday) setTimeout(() => toast(stage, 'Hoje alguém especial vai aparecer…', 3000), 600);
  else if (!tutorial) {
    setTimeout(() => banner(stage, `Dia ${save.day}`, 1300), 200);
    setTimeout(() => toast(stage, `Objetivo: ${goal.text}`, 2600), 1600);
  }

  function endDay(_special: boolean) {
    if (ended) return;
    ended = true;
    hint('', null);
    react(res.special ? 'apaixonada' : 'acenando', 1600);
    banner(stage, res.special ? 'Para sempre ♥' : 'Fim do expediente!', 1500);
    setTimeout(() => app.go('summary', res), 1600);
  }

  return () => {
    cancelAnimationFrame(raf);
    document.removeEventListener('visibilitychange', onVis);
    root.removeEventListener('pointerdown', onAct);
  };
}
