"""Repinta a placa do restaurante na arte do menu com o nome de src/personal.ts.

Lê a arte original (menu_retrato_original.png, criada na primeira execução como cópia de
menu_retrato.png) e grava menu_retrato.png com a placa nova. Depois rode
tools/make_menu_portrait.py para regerar as imagens do menu.

Uso: python tools/rename_sign.py
"""
import re
import shutil
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
DIR = ROOT / "jogo_restaurante_assets" / "09_menu"
ORIG, OUT = DIR / "menu_retrato_original.png", DIR / "menu_retrato.png"
ART_X0 = 538                       # mesma origem usada em make_menu_portrait.py
BOX = (150, 219, 452, 283)         # miolo da placa (coordenadas da arte recortada 596x941)
INK = (59, 36, 32)
FONT = Path("C:/Windows/Fonts/segoescb.ttf")  # Segoe Script Bold: traço redondo parecido com o original
S = 4                              # supersampling para o texto sair suave


def restaurant_name() -> str:
    src = (ROOT / "src" / "personal.ts").read_text(encoding="utf-8")
    m = re.search(r"nomeRestaurante:\s*(['\"])(.*?)\1", src)
    return m.group(2) if m else "Gabi's Restaurant"


def heart(d: ImageDraw.ImageDraw, cx: float, cy: float, r: float, w: int):
    pts = []
    import math
    for i in range(0, 361, 6):
        t = math.radians(i)
        x = 16 * math.sin(t) ** 3
        y = -(13 * math.cos(t) - 5 * math.cos(2 * t) - 2 * math.cos(3 * t) - math.cos(4 * t))
        pts.append((cx + x * r / 16, cy + y * r / 16))
    d.line(pts, fill=255, width=w, joint="curve")  # desenhado na máscara; a cor entra depois


def main():
    if not ORIG.exists():
        shutil.copy(OUT, ORIG)
    im = Image.open(ORIG).convert("RGB")
    x0, y0, x1, y1 = BOX
    X0, X1 = x0 + ART_X0, x1 + ART_X0

    # 1) apaga as letras: cada linha vira um degradê entre as bordas esquerda e direita da placa
    px = im.load()
    for y in range(y0, y1):
        a, b = px[X0 - 1, y], px[X1, y]
        for x in range(X0, X1):
            t = (x - X0 + 1) / (X1 - X0 + 1)
            px[x, y] = tuple(round(a[i] * (1 - t) + b[i] * t) for i in range(3))
    # leve textura de madeira para não ficar chapado
    patch = im.crop((X0, y0, X1, y1))
    grain = patch.filter(ImageFilter.GaussianBlur(1.2))
    im.paste(grain, (X0, y0))

    # 2) escreve o nome novo, ajustando o tamanho para caber
    name = restaurant_name().replace("'", "’")  # apóstrofo tipográfico separa melhor no traço grosso
    w, h = (X1 - X0) * S, (y1 - y0) * S
    layer = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(layer)
    heart_w = 20 * S
    size = 46 * S
    while True:
        font = ImageFont.truetype(str(FONT), size)
        l, t, r, bt = d.textbbox((0, 0), name, font=font)
        if r - l + heart_w <= w - 4 * S and bt - t <= h - 10 * S:
            break
        size -= S
    tw, th = r - l, bt - t
    tx = (w - tw - heart_w) / 2 - l
    ty = (h - th) / 2 - t - 2 * S
    d.text((tx, ty), name, font=font, fill=255)
    heart(d, tx + l + tw + heart_w * 0.6, h * 0.68, 7 * S, int(2 * S))
    # engrossa o traço para chegar perto do letreiro pintado (traço redondo e cheio)
    layer = layer.filter(ImageFilter.MaxFilter(7))
    layer = layer.resize((X1 - X0, y1 - y0), Image.LANCZOS)
    ink = Image.new("RGB", layer.size, INK)
    im.paste(ink, (X0, y0), layer)
    im.save(OUT)
    print(f"placa: {name!r}, fonte {size // S}px -> {OUT.name}")


if __name__ == "__main__":
    main()
