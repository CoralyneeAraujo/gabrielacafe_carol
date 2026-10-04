// Alterna o app Android entre:
//   live    → o app carrega o jogo do servidor Vite do PC (alterações aparecem na hora)
//   release → o app usa os arquivos empacotados (para gerar o APK final / jogar sem o PC)
// Uso: node tools/cap-mode.mjs live|release
import { readFileSync, writeFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';

const mode = process.argv[2];
const file = new URL('../capacitor.config.json', import.meta.url);
const cfg = JSON.parse(readFileSync(file, 'utf8'));

if (mode === 'live') {
  const ips = Object.values(networkInterfaces()).flat()
    .filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
  const ip = ips.find(a => a.startsWith('192.168.')) || ips.find(a => a.startsWith('10.')) || ips[0];
  cfg.server = { url: `http://${ip}:5173`, cleartext: true };
  console.log(`Modo ao vivo: o app vai carregar ${cfg.server.url}`);
} else if (mode === 'release') {
  delete cfg.server;
  console.log('Modo release: o app usa os arquivos empacotados.');
} else {
  console.error('Use: node tools/cap-mode.mjs live|release');
  process.exit(1);
}
writeFileSync(file, JSON.stringify(cfg, null, 2) + '\n');
