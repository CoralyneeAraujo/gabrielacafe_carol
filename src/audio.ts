// Efeitos sonoros sintetizados (sem arquivos de áudio).
let ctx: AudioContext | null = null;
let enabled = true;

export function setSound(on: boolean) { enabled = on; }

export function unlockAudio() {
  if (!ctx) {
    try { ctx = new AudioContext(); } catch { ctx = null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  if (musicWanted) startMusic();
}

// ---- música de fundo: loop lo-fi gerado (Fmaj7 → Em7 → Dm7 → Cmaj7, 80 bpm) ----
let musicWanted = false, musicTimer = 0, beat = 0, musicGain: GainNode | null = null;
const CHORDS = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]];
const ARP = [0, 2, 1, 3, 2, 1, 3, 0];
const hz = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

function note(freq: number, t: number, dur: number, type: OscillatorType, vol: number) {
  if (!ctx || !musicGain) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.08, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(musicGain);
  o.start(t); o.stop(t + dur + 0.05);
}

function startMusic() {
  if (!ctx || musicTimer) return;
  musicGain = ctx.createGain();
  musicGain.gain.value = 0.5;
  musicGain.connect(ctx.destination);
  const spb = 0.75 / 2; // colcheias
  let next = ctx.currentTime + 0.1;
  musicTimer = window.setInterval(() => {
    if (!ctx) return;
    while (next < ctx.currentTime + 0.4) {
      const bar = Math.floor(beat / 8) % 4, chord = CHORDS[bar];
      if (beat % 8 === 0) {
        chord.forEach(n => note(hz(n), next, spb * 8, 'sine', 0.035));
        note(hz(chord[0] - 12), next, spb * 6, 'triangle', 0.05);
      }
      if (beat % 8 !== 7) note(hz(chord[ARP[beat % 8]] + 12), next, spb * 1.6, 'triangle', 0.03);
      beat++; next += spb;
    }
  }, 100);
}

function stopMusic() {
  clearInterval(musicTimer); musicTimer = 0;
  if (musicGain && ctx) { musicGain.gain.setTargetAtTime(0, ctx.currentTime, 0.2); const g = musicGain; setTimeout(() => g.disconnect(), 1000); }
  musicGain = null;
}

export function setMusic(on: boolean) {
  musicWanted = on;
  if (on) startMusic(); else stopMusic();
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.14, delay = 0, slide = 0) {
  if (!enabled || !ctx) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t); o.stop(t + dur + 0.02);
}

export const sfx = {
  tap: () => tone(660, 0.07, 'triangle', 0.08),
  pop: () => tone(520, 0.12, 'sine', 0.12, 0, 1.6),
  ready: () => { tone(880, 0.12, 'sine', 0.1); tone(1320, 0.18, 'sine', 0.08, 0.08); },
  coin: () => { tone(1046, 0.08, 'square', 0.05); tone(1568, 0.16, 'square', 0.05, 0.07); },
  bell: () => { tone(1318, 0.5, 'sine', 0.08); tone(1975, 0.4, 'sine', 0.04, 0.02); },
  error: () => tone(180, 0.18, 'sawtooth', 0.06, 0, 0.8),
  sad: () => { tone(440, 0.2, 'triangle', 0.07, 0, 0.8); tone(330, 0.3, 'triangle', 0.07, 0.18, 0.8); },
  love: () => [523, 659, 784].forEach((f, i) => tone(f, 0.18, 'sine', 0.09, i * 0.07)),
  levelup: () => [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.25, 'triangle', 0.09, i * 0.09)),
  type: () => tone(1200 + Math.random() * 300, 0.025, 'square', 0.015),
  meow: () => { tone(700, 0.18, 'triangle', 0.08, 0, 1.4); tone(980, 0.3, 'triangle', 0.07, 0.16, 0.7); },
  woof: () => { tone(220, 0.12, 'sawtooth', 0.07, 0, 0.7); tone(200, 0.14, 'sawtooth', 0.07, 0.18, 0.7); },
};
