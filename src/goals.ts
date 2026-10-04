// Objetivo do dia e conquistas.
import { RECIPES, UPGRADES } from './data';
import type { Save } from './state';

export type GoalProgress = { served: number; coins: number; bestCombo: number; dishes: Record<string, number> };
export type Goal = { text: string; target: number; reward: { coins: number; love: number }; value: (p: GoalProgress) => number };

export function goalForDay(day: number, level: number): Goal {
  const reward = { coins: Math.round((60 + day * 8) / 10) * 10, love: Math.min(20, 5 + Math.floor(day / 2)) };
  const recipes = RECIPES.filter(r => r.level <= level);
  switch (day % 4) {
    case 1: { const n = Math.min(14, 4 + Math.floor(day / 2)); return { text: `Atenda ${n} clientes`, target: n, reward, value: p => p.served }; }
    case 2: { const n = 60 + day * 10; return { text: `Ganhe ${n} moedas`, target: n, reward, value: p => p.coins }; }
    case 3: { const n = Math.min(6, 3 + Math.floor(day / 6)); return { text: `Faça um combo de ${n}`, target: n, reward, value: p => p.bestCombo }; }
    default: {
      const r = recipes[day % recipes.length];
      const n = Math.min(8, 2 + Math.floor(day / 4));
      return { text: `Sirva ${n}× ${r.name}`, target: n, reward, value: p => p.dishes[r.id] || 0 };
    }
  }
}

export type Achievement = { id: string; name: string; desc: string; done: (s: Save) => boolean };
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'primeira', name: 'Primeira cliente', desc: 'Atenda a primeira cliente', done: s => s.stats.served >= 1 },
  { id: 'c50', name: 'Casa cheia', desc: 'Atenda 50 clientes', done: s => s.stats.served >= 50 },
  { id: 'c200', name: 'Clientela fiel', desc: 'Atenda 200 clientes', done: s => s.stats.served >= 200 },
  { id: 'perfeito', name: 'Atendimento perfeito', desc: 'Sirva 25 pedidos ainda com paciência cheia', done: s => s.stats.perfect >= 25 },
  { id: 'combo5', name: 'No ritmo', desc: 'Faça um combo de 5', done: s => s.bestCombo >= 5 },
  { id: 'combo10', name: 'Imparável', desc: 'Faça um combo de 10', done: s => s.bestCombo >= 10 },
  { id: 'moedas', name: 'Cofrinho', desc: 'Ganhe 2.000 moedas no total', done: s => s.stats.coinsEarned >= 2000 },
  { id: 'objetivos', name: 'Organizada', desc: 'Cumpra 10 objetivos do dia', done: s => s.stats.goals >= 10 },
  { id: 'galeria', name: 'Te conheço de todo jeito', desc: 'Veja todas as versões da cliente', done: s => s.seenSprites.length >= 24 },
  { id: 'nivel9', name: 'Pedido em dobro', desc: 'Chegue ao nível 9', done: s => s.level >= 9 },
  { id: 'nivel15', name: 'Depois do expediente', desc: 'Chegue ao nível 15', done: s => s.level >= 15 },
  { id: 'decor', name: 'Nosso cantinho', desc: 'Compre toda a decoração', done: s => UPGRADES.filter(u => u.tab === 'decoracao').every(u => (s.upgrades[u.id] || 0) > 0) },
  { id: 'sempre', name: 'Para sempre', desc: 'Entregue o Pedido Especial', done: s => s.specialDone },
];
