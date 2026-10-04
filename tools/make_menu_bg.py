"""Gera o fundo do menu a partir da arte de referência, apagando os textos que mudam
durante o jogo (moedas, barra de Amor, nível, objetivo do dia, número do dia).
O jogo redesenha essas partes por cima, com os valores reais.

Uso: python tools/make_menu_bg.py
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "jogo_restaurante_assets" / "09_menu" / "menu_referencia.png"
OUT = ROOT / "public" / "art"

PILL = (57, 37, 44)
CARD = (250, 231, 216)
REWARD = (248, 222, 202)
GREEN = (98, 165, 58)

# (x0, y0, x1, y1, cor) em coordenadas da imagem original (1260x713)
ERASE = [
    (60, 14, 146, 56, PILL),        # número de moedas
    (258, 12, 414, 62, PILL),       # barra de amor + "320 / 400"
    (430, 10, 578, 60, PILL),       # "Nível 8 / Já virou rotina"
    (974, 166, 1238, 228, CARD),    # texto, barra e contagem do objetivo
    (1036, 258, 1090, 284, REWARD), # recompensa em moedas
    (1166, 258, 1204, 284, REWARD), # recompensa em amor
    (1052, 368, 1158, 397, GREEN),  # "Dia 1"
]

ICONS = {  # recortes dos ícones pintados (x0, y0, x1, y1)
    "ic_cardapio": (22, 636, 74, 682), "ic_decoracoes": (116, 636, 168, 682),
    "ic_conquistas": (212, 636, 264, 682), "ic_galeria": (306, 636, 358, 682),
    "ic_musica": (400, 636, 452, 682), "ic_objetivo": (985, 112, 1025, 155),
    "ic_melhorias": (970, 418, 1022, 470), "ic_historia": (980, 492, 1030, 545),
    "ic_visual": (980, 566, 1030, 620),
}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    im = Image.open(SRC).convert("RGB")
    for name, box in ICONS.items():
        im.crop(box).resize(((box[2] - box[0]) * 2, (box[3] - box[1]) * 2), Image.LANCZOS).save(OUT / f"{name}.png")
    d = ImageDraw.Draw(im)
    for x0, y0, x1, y1, c in ERASE:
        d.rounded_rectangle((x0, y0, x1, y1), radius=6, fill=c)
    im = im.resize((1280, 720), Image.LANCZOS)
    im.save(OUT / "menu_bg.jpg", quality=92)
    print("ok", OUT)


if __name__ == "__main__":
    main()
