// Formas vetoriais pequenas usadas pela interface (corações).
// A protagonista não é mais vetorial: veja src/dona.ts.

export function heartPath(x: number, y: number, s: number, fill: string, stroke = '', sw = 2) {
  const st = stroke ? ` stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"` : '';
  return `<path d="M${x} ${y + 6 * s}C${x - 10 * s} ${y - s} ${x - 6 * s} ${y - 10 * s} ${x} ${y - 4 * s}C${x + 6 * s} ${y - 10 * s} ${x + 10 * s} ${y - s} ${x} ${y + 6 * s}Z" fill="${fill}"${st}/>`;
}
