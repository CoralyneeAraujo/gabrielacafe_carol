"""Gera o menu em pé (retrato, alvo Pixel 7/8: 1080x2400, 20:9) a partir da arte de referência.

A arte tem proporção ~9:14, mais baixa que o celular. Ela é dividida em duas faixas:
  - topo  (moedas, Amor, ajustes) -> preso no alto da tela
  - corpo (restaurante, botões) -> preso embaixo, perto do polegar
A barra de nível sai do corpo como peça solta (menu_level.webp) para subir até logo abaixo do topo,
e o botão de sol/lua é apagado da arte.
e o espaço que sobra entre as duas vira céu (menu_sky_*.png, esticado pelo CSS).
Os textos que mudam no jogo são apagados; o jogo redesenha por cima com os valores reais.

Uso: python tools/make_menu_portrait.py
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "jogo_restaurante_assets" / "09_menu" / "menu_retrato.png"
OUT = ROOT / "public" / "art"

ART_X0, ART_X1 = 538, 1134   # a captura vem com faixas pretas dos lados
OUT_W = 1080                 # largura do Pixel 7/8
SPLIT = 74                   # linha onde a arte é dividida (logo abaixo dos botões do topo)

# caixas apagadas (x0, y0, x1, y1) em coordenadas da arte recortada (596x941);
# cada linha é preenchida interpolando as cores das bordas esquerda e direita
ERASE = [
    (76, 26, 147, 58),     # número de moedas
    (262, 26, 467, 64),    # barra de Amor + "320 / 400"
    (236, 92, 360, 142),   # "Nivel 8 / Já virou rotina"
    (240, 694, 414, 731),  # "Abrir · Dia 1"
]
# formas que ficam 100% opacas mesmo dentro das faixas de transição
TOP_SOLID = [(16, 15, 201, 70), (208, 15, 481, 70), (521, 15, 579, 71)]
BODY_SOLID = []
LEVEL = (186, 79, 411, 155)          # recorte da barra de nível (com sombra)
LEVEL_SHAPE = (189, 82, 408, 153)    # forma arredondada da barra
SKY_PATCH = [LEVEL, (465, 84, 582, 145)]  # barra de nível e botão de sol/lua: viram céu


def erase(im, box):
    x0, y0, x1, y1 = box
    px = im.load()
    for y in range(y0, y1):
        a, b = px[x0 - 1, y], px[x1, y]
        for x in range(x0, x1):
            t = (x - x0 + 1) / (x1 - x0 + 1)
            px[x, y] = tuple(round(a[i] * (1 - t) + b[i] * t) for i in range(3))


def sky_row(im, y, holes=()):
    """Uma linha de céu borrada, sem os botões, esticada depois pelo CSS."""
    row = im.crop((0, y, im.width, y + 1)).copy()
    px = row.load()
    for x0, x1 in holes:
        a, b = px[x0 - 1, 0], px[x1, 0]
        for x in range(x0, x1):
            t = (x - x0 + 1) / (x1 - x0 + 1)
            px[x, 0] = tuple(round(a[i] * (1 - t) + b[i] * t) for i in range(3))
    row = row.resize((im.width, 9)).filter(ImageFilter.GaussianBlur(14)).crop((0, 4, im.width, 5))
    return row.resize((OUT_W, 1), Image.LANCZOS)


def feather(size, solid, fade_from, fade_to, top_is_opaque):
    """Máscara alfa: some suavemente entre fade_from e fade_to, exceto nas formas sólidas."""
    w, h = size
    m = Image.new("L", size, 0)
    d = ImageDraw.Draw(m)
    for y in range(h):
        if top_is_opaque:
            t = 1 if y <= fade_from else max(0.0, 1 - (y - fade_from) / (fade_to - fade_from))
        else:
            t = 0 if y <= fade_from else min(1.0, (y - fade_from) / (fade_to - fade_from))
        d.line([(0, y), (w, y)], fill=round(255 * t))
    for box in solid:
        d.rounded_rectangle(box, radius=26, fill=255)
    return m


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    art = Image.open(SRC).convert("RGB").crop((ART_X0, 0, ART_X1, 941))
    W, H = art.size
    for box in ERASE:
        erase(art, box)
    k = OUT_W / W

    level = art.crop(LEVEL).convert("RGBA")
    m = Image.new("L", level.size, 0)
    x0, y0 = LEVEL[:2]
    ImageDraw.Draw(m).rounded_rectangle((LEVEL_SHAPE[0] - x0, LEVEL_SHAPE[1] - y0, LEVEL_SHAPE[2] - x0, LEVEL_SHAPE[3] - y0), radius=34, fill=255)
    level.putalpha(m.filter(ImageFilter.GaussianBlur(0.8)))
    level.resize((round(level.width * k), round(level.height * k)), Image.LANCZOS).save(OUT / "menu_level.webp", quality=92)
    for box in SKY_PATCH:
        erase(art, box)

    top = art.crop((0, 0, W, SPLIT + 4)).convert("RGBA")
    top.putalpha(feather(top.size, TOP_SOLID, 58, SPLIT + 3, True))
    top = top.resize((OUT_W, round(top.height * k)), Image.LANCZOS)
    top.save(OUT / "menu_top.webp", quality=92)

    body = art.crop((0, SPLIT, W, H)).convert("RGBA")
    body.putalpha(feather(body.size, [(x0, y0 - SPLIT, x1, y1 - SPLIT) for x0, y0, x1, y1 in BODY_SOLID], 0, 26, False))
    body = body.resize((OUT_W, round(body.height * k)), Image.LANCZOS)
    body.save(OUT / "menu_body.webp", quality=92)

    sky_row(art, 2).save(OUT / "menu_sky_top.png")
    # céu do meio: degradê do roxo do alto (linha 8) até o pôr do sol logo acima do corpo
    gap = Image.new("RGB", (OUT_W, 2))
    gap.paste(sky_row(art, 8), (0, 0))
    gap.paste(sky_row(art, SPLIT), (0, 1))
    gap.save(OUT / "menu_sky_gap.png")

    # prévia no tamanho do Pixel 7/8
    prev = Image.new("RGB", (OUT_W, 2400))
    pad = round(24 * OUT_W / 720)
    prev.paste(Image.open(OUT / "menu_sky_top.png").resize((OUT_W, pad + 2)), (0, 0))
    gap_top = pad + top.height - 4
    gap_h = 2400 - body.height - gap_top + 40
    prev.paste(Image.open(OUT / "menu_sky_gap.png").resize((OUT_W, gap_h), Image.BILINEAR), (0, gap_top))
    prev.paste(top, (0, pad), top)
    prev.paste(body, (0, 2400 - body.height), body)
    lv = Image.open(OUT / "menu_level.webp")
    prev.paste(lv, (round(LEVEL[0] * k), pad + round(84 * k)), lv)
    prev.save(ROOT / "tools" / "preview_menu_retrato.png")
    print("ok", OUT, "corpo:", body.size, "topo:", top.size)


if __name__ == "__main__":
    main()
