"""Limpa os recortes da dona do restaurante e copia para o jogo.

Lê jogo_restaurante_assets/01_personagem_principal/personagem_namorada_assets_corrigidos/
e grava public/sprites/dona/*.png + src/donaSprites.ts (lista com os tamanhos).
Em cada recorte fica só a personagem (o maior pedaço opaco): somem as pontas de cabelo
das vizinhas da folha e as etiquetas cor-de-rosa ("Acenando", "Com prato"...).

Uso: python tools/extract_dona.py
"""
from collections import deque
from pathlib import Path
from PIL import Image, ImageFilter

from limpa_fundo import limpa

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "jogo_restaurante_assets" / "01_personagem_principal" / "personagem_namorada_assets_corrigidos"
OUT = ROOT / "public" / "sprites" / "dona"
TS = ROOT / "src" / "donaSprites.ts"
SHEET = SRC / "00_referencia" / "folha_original.png"
# As roupas são recortadas direto da folha: os PNGs prontos foram cortados no limite da célula
# e perdiam pontas do cabelo comprido. (nome, x do centro da figura) na faixa y 30–362.
ROUPAS_FOLHA = [("padrao_restaurante", 105), ("casual", 290), ("trabalhando", 480), ("noite", 660),
                ("especial", 830), ("inverno", 1020), ("avental_alternativo", 1210), ("pijama", 1410)]
ROUPAS_FAIXA = (0, 30, 1536, 362)
GROUPS = {"02_expressoes_rosto": "rosto", "03_expressoes_extras": "rosto", "04_acoes": "acao"}
PAD = 2


def cut_label(im):
    """Corta a etiqueta rosa-clarinha que fica embaixo das ações (com o texto escuro no meio)."""
    px = im.load()
    w, h = im.size
    def pink(y):
        return sum(1 for x in range(w) if px[x, y][3] > 0 and min(px[x, y][:3]) > 205 and px[x, y][0] - px[x, y][2] > 6) / w
    y = h - 1
    while y > h * 0.6 and pink(y) < 0.3:
        y -= 1
    if y <= h * 0.6:
        return im
    while y > h * 0.6 and pink(y - 1) > 0.22:
        y -= 1
    return im.crop((0, 0, w, y - 2))


def largest_component(im):
    """Máscara do maior pedaço opaco. Antes de procurar, a máscara é afinada para soltar
    pontas de cabelo vizinhas presas por fios finos; depois volta ao tamanho original."""
    w, h = im.size
    a = im.getchannel("A").point(lambda v: 255 if v >= 40 else 0).filter(ImageFilter.MinFilter(7)).load()
    seen = bytearray(w * h)
    best = []
    for sy in range(h):
        for sx in range(w):
            i = sy * w + sx
            if seen[i] or a[sx, sy] < 40:
                continue
            comp, q = [], deque([(sx, sy)])
            seen[i] = 1
            while q:
                x, y = q.popleft()
                comp.append((x, y))
                for dx in (-1, 0, 1):
                    for dy in (-1, 0, 1):
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and a[nx, ny] >= 40:
                            seen[ny * w + nx] = 1
                            q.append((nx, ny))
            if len(comp) > len(best):
                best = comp
    keep = Image.new("L", im.size, 0)
    kp = keep.load()
    for x, y in best:
        kp[x, y] = 255
    # desfaz o afinamento e devolve a borda suave
    return keep.filter(ImageFilter.MaxFilter(9))


def tira_bolsoes_brancos(im):
    """O fundo branco da folha fica preso entre as mechas do cabelo e o corpo (e entre as pernas).
    Esses bolsões ficam da metade da figura para baixo; dentes e brilho dos olhos ficam acima.
    O fundo da folha é branco neutro (vermelho ≈ azul); babados, meias e solas são brancos
    levemente quentes, e os detalhes brancos do meio da figura são pequenos. Então é fundo:
    - branco neutro nas laterais (pontas do cabelo)
    - branco neutro grande (60+ px) em qualquer lugar abaixo da metade (ex.: entre as pernas)"""
    w, h = im.size
    px = im.load()
    def cor(x, y, lim, sat):
        r, g, b, a = px[x, y]
        return a > 150 and min(r, g, b) > lim and max(r, g, b) - min(r, g, b) < sat
    tirar = set()
    for lim, sat, regra in ((236, 14, "puro"), (205, 26, "lado")):
        seen = set()
        for y0 in range(h // 2, h):
            for x0 in range(w):
                if (x0, y0) in seen or not cor(x0, y0, lim, sat):
                    continue
                comp, q = [], deque([(x0, y0)])
                seen.add((x0, y0))
                while q:
                    x, y = q.popleft()
                    comp.append((x, y))
                    for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                        if 0 <= nx < w and h // 2 <= ny < h and (nx, ny) not in seen and cor(nx, ny, lim, sat):
                            seen.add((nx, ny))
                            q.append((nx, ny))
                cx = sum(p[0] for p in comp) / len(comp)
                neutro = sum(px[p][0] - px[p][2] for p in comp) / len(comp) <= 3
                lado = cx < w * 0.22 or cx > w * 0.78
                if neutro and len(comp) >= 4 and (lado or (regra == "puro" and len(comp) >= 60)):
                    tirar.update(comp)
    for x, y in tirar:
        px[x, y] = px[x, y][:3] + (0,)
    # o anel claro em volta de cada bolsão fica translúcido (sem contorno branco)
    for x, y in tirar:
        for nx in (x - 1, x, x + 1):
            for ny in (y - 1, y, y + 1):
                if 0 <= nx < w and 0 <= ny < h and (nx, ny) not in tirar:
                    r, g, b, a = px[nx, ny]
                    if a and min(r, g, b) > 170:
                        px[nx, ny] = (r, g, b, a * (255 - min(r, g, b)) // 85 if min(r, g, b) < 255 else 0)
    return im


def roupas_da_folha():
    """Separa cada figura da fileira de roupas pelo fundo branco ligado às bordas."""
    band = Image.open(SHEET).convert("RGB").crop(ROUPAS_FAIXA)
    w, h = band.size
    px = band.load()
    white = lambda x, y: min(px[x, y]) > 232
    bg = bytearray(w * h)
    q = deque((x, y) for x in range(w) for y in (0, h - 1)) + deque((x, y) for y in range(h) for x in (0, w - 1))
    for x, y in q:
        bg[y * w + x] = 1
    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not bg[ny * w + nx] and white(nx, ny):
                bg[ny * w + nx] = 1
                q.append((nx, ny))
    for name, cx in ROUPAS_FOLHA:
        # a figura é o pedaço não-fundo que passa pela linha do rosto perto do centro
        seed = next((cx + d, 150) for d in (0, 4, -4, 8, -8, 12, -12) if not bg[150 * w + cx + d])
        comp = bytearray(w * h)
        q = deque([seed])
        comp[seed[1] * w + seed[0]] = 1
        while q:
            x, y = q.popleft()
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and not comp[ny * w + nx] and not bg[ny * w + nx]:
                        comp[ny * w + nx] = 1
                        q.append((nx, ny))
        alpha = Image.frombytes("L", (w, h), bytes(255 if v else 0 for v in comp))
        # borda: pixels claros da beirada ficam semitransparentes (sem halo branco)
        edge = Image.frombytes("L", (w, h), bytes(
            255 if not comp[i] else max(0, min(255, (255 - min(px[i % w, i // w])) * 6)) for i in range(w * h)))
        inner = alpha.filter(ImageFilter.MinFilter(3))
        alpha = Image.composite(alpha, Image.composite(edge, alpha, alpha), inner)
        # tira o fio claro de 1 px que o fundo branco deixa na beirada do cabelo
        alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
        fig = band.convert("RGBA")
        fig.putalpha(alpha)
        box = alpha.getbbox()
        yield name, tira_bolsoes_brancos(fig.crop((box[0] - PAD, box[1] - PAD, box[2] + PAD, box[3] + PAD)))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    rows = []
    for name, im in roupas_da_folha():
        im = limpa(im)
        im.save(OUT / f"roupa_{name}.png", optimize=True)
        rows.append(("roupa", name, im.width, im.height))
    for folder, kind in GROUPS.items():
        for f in sorted((SRC / folder).glob("*.png")):
            name = f.stem.split("_", 1)[1]
            im = Image.open(f).convert("RGBA")
            if kind == "acao":
                im = cut_label(im)
            mask = largest_component(im)
            alpha = Image.composite(im.getchannel("A"), Image.new("L", im.size, 0), mask)
            im.putalpha(alpha)
            box = alpha.getbbox()
            im = im.crop((max(0, box[0] - PAD), max(0, box[1] - PAD), min(im.width, box[2] + PAD), min(im.height, box[3] + PAD)))
            im = limpa(im)
            im.save(OUT / f"{kind}_{name}.png", optimize=True)
            rows.append((kind, name, im.width, im.height))
    lines = ["// Gerado por tools/extract_dona.py — não edite à mão.",
             "export const DONA_SPRITES = {"]
    for kind in ("roupa", "rosto", "acao"):
        items = ", ".join(f"{n}: [{w}, {h}]" for k, n, w, h in rows if k == kind)
        lines.append(f"  {kind}: {{ {items} }},")
    lines.append("} as const;")
    TS.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print("ok", len(rows), "sprites em", OUT)


if __name__ == "__main__":
    main()
