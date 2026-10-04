import { isRoupa, roupaLiberada, ROUPA_PADRAO, type Roupa } from './dona';
import { levelFromLove } from './data';

export type Save = {
  v: 1;
  day: number;
  coins: number;
  love: number;
  stars: number;
  level: number;
  upgrades: Record<string, number>;
  roupa: Roupa;            // visual da dona (uma das roupas da folha oficial)
  settings: { relax: boolean; sound: boolean; music: boolean; night: boolean; teste: boolean };
  stats: { served: number; coinsEarned: number; perfect: number; goals: number };
  seenSprites: string[];
  seenMemories: number[];
  specialDay: number;      // dia em que o Pedido Especial aparece (0 = ainda não marcado)
  specialDone: boolean;
  tutorialDone: boolean;
  bestCombo: number;
};

const KEY = 'nosso-cantinho-save-v1';

export function newSave(): Save {
  return {
    v: 1, day: 1, coins: 0, love: 0, stars: 0, level: 1, upgrades: {},
    roupa: ROUPA_PADRAO, settings: { relax: false, sound: true, music: true, night: false, teste: false },
    stats: { served: 0, coinsEarned: 0, perfect: 0, goals: 0 }, seenSprites: [],
    seenMemories: [], specialDay: 0, specialDone: false, tutorialDone: false, bestCombo: 0,
  };
}

export function load(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = { ...newSave(), ...JSON.parse(raw) } as Save;
      const d = newSave();
      s.level = levelFromLove(s.love);
      if (!isRoupa(s.roupa) || !roupaLiberada(s.roupa, s.level)) s.roupa = ROUPA_PADRAO;
      delete (s as Partial<Save> & { look?: unknown }).look; // visual vetorial antigo
      s.settings = { ...d.settings, ...s.settings };
      s.stats = { ...d.stats, ...s.stats };
      return s;
    }
  } catch { /* save corrompido ou indisponível: começa do zero */ }
  return newSave();
}

export function persist(s: Save) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* sem armazenamento */ }
}

export function reset(): Save {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  return newSave();
}

export const upg = (s: Save, id: string) => s.upgrades[id] || 0;
