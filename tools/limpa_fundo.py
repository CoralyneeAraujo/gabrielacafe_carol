"""Tira restos do fundo branco dos sprites recortados (clientes e dona).

Os desenhos têm contorno escuro, então todo branco claro e sem cor (neutro) que encosta
na parte transparente é sobra do fundo da folha, e não roupa, olho ou caneca. A limpeza anda
a partir do transparente por esses pixels e apaga tudo o que alcança; a borda clarinha
que sobra fica translúcida. Bolsões totalmente fechados (entre mechas, entre as pernas)
são tratados em extract_dona.py.

Uso: python tools/limpa_fundo.py public/sprites/clientes public/sprites/dona
"""
import sys
from collections import deque
from pathlib import Path
from PIL import Image


def claro_neutro(p, lim=200, sat=30):
    r, g, b, a = p
    return a > 0 and min(r, g, b) > lim and max(r, g, b) - min(r, g, b) < sat


def beirada(p):
    """Pixel de transição (mais escurinho que o fundo, mas não é contorno): dá para atravessar."""
    return claro_neutro(p, 160, 45)


def limpa(im: Image.Image) -> Image.Image:
    im = im.convert("RGBA")
    w, h = im.size
    px = im.load()
    viz = ((1, 0), (-1, 0), (0, 1), (0, -1))
    q = deque()
    seen = bytearray(w * h)
    for y in range(h):
        for x in range(w):
            if px[x, y][3] < 20:
                seen[y * w + x] = 1
                q.append((x, y))
    apagar = []
    while q:
        x, y = q.popleft()
        for dx, dy in viz:
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx]:
                seen[ny * w + nx] = 1
                if beirada(px[nx, ny]):
                    apagar.append((nx, ny))
                    q.append((nx, ny))
    # bem claro some; a beirada fica translúcida conforme o quanto é clara
    for x, y in apagar:
        r, g, b, a = px[x, y]
        m = min(r, g, b)
        px[x, y] = (r, g, b, 0 if m > 190 else min(a, (190 - m) * 255 // 30))
    # anel de 1 px em volta do que foi apagado: quanto mais claro, mais transparente
    for x, y in apagar:
        for dx, dy in viz:
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h:
                r, g, b, a = px[nx, ny]
                m = min(r, g, b)
                if a and m > 150:
                    px[nx, ny] = (r, g, b, min(a, max(0, (255 - m) * 255 // 105)))
    return im


def main(pastas):
    n = 0
    for pasta in pastas:
        for f in sorted(Path(pasta).glob("*.png")):
            limpa(Image.open(f)).save(f, optimize=True)
            n += 1
    print("ok", n, "sprites limpos")


if __name__ == "__main__":
    main(sys.argv[1:])
