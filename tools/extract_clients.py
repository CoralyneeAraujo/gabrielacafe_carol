"""Recorta as clientes da concept sheet em sprites PNG com fundo transparente.

Uso: python tools/extract_clients.py
Entrada: jogo_restaurante_assets/04_clientes/*.png
Saida:   public/sprites/clientes/<nome>.png  e  tools/preview_clientes.png
"""
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

from limpa_fundo import limpa

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "jogo_restaurante_assets" / "04_clientes"
OUT = ROOT / "public" / "sprites" / "clientes"

SHEET = ROOT / "jogo_restaurante_assets" / "00_concept_sheet_original.png"

# cada linha: caixa (x0, y0, x1, y1) na concept sheet, altura da legenda, cortes em x (coordenadas da sheet)
# e nomes na ordem esquerda -> direita. Cortes marcados a olho com uma regua sobre a imagem.
ROWS = [
    ((10, 445, 1350, 610), 26,
     [10, 128, 250, 368, 488, 608, 728, 860, 1015, 1155, 1350],
     ["normal", "feliz", "com_fome", "impaciente", "surpresa",
      "apaixonada", "brava", "sonolenta", "comemorando", "joinha"]),
    ((10, 600, 1530, 730), 22,
     [10, 107, 205, 298, 395, 490, 590, 698, 807, 903, 1000, 1103, 1203, 1308, 1408, 1530],
     ["com_cafe", "com_notebook", "com_celular", "pensativa", "rindo",
      "envergonhada", "surpresa_feliz", "triste", "desconfiada", "ansiosa",
      "muito_feliz", "com_sacolas", "camiseta_diferente", "hoodie", "de_touca"]),
    ((1350, 445, 1528, 610), 30, [1350, 1528], ["pedido_especial"]),
]


def remove_bg(img: Image.Image) -> np.ndarray:
    a = np.asarray(img.convert("RGB")).astype(np.float32)
    h, w, _ = a.shape
    border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
    bg = np.median(border, axis=0)
    dist = np.sqrt(((a - bg) ** 2).sum(axis=2))
    cand = dist < 34
    # flood fill do fundo a partir das bordas
    bgm = np.zeros((h, w), bool)
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if cand[y, x] and not bgm[y, x]:
                bgm[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if cand[y, x] and not bgm[y, x]:
                bgm[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and cand[ny, nx] and not bgm[ny, nx]:
                bgm[ny, nx] = True; q.append((ny, nx))
    # buracos fechados (entre cachos, bracos) com cor bem proxima do fundo
    # so na metade de cima (cabelo): embaixo o branco das listras da camiseta e parecido com o fundo
    holes = dist < 14
    holes[int(h * 0.5):, :] = False
    bgm |= holes
    alpha = np.where(bgm, 0.0, 1.0)
    # borda suave: pixels opacos vizinhos ao fundo ganham alpha proporcional a distancia de cor
    edge = np.zeros_like(bgm)
    edge[1:, :] |= bgm[:-1, :]; edge[:-1, :] |= bgm[1:, :]
    edge[:, 1:] |= bgm[:, :-1]; edge[:, :-1] |= bgm[:, 1:]
    edge &= ~bgm
    soft = np.clip((dist - 14) / 60, 0, 1)
    alpha = np.where(edge, soft, alpha)
    # remove o halo creme das bordas (des-mistura com a cor do fundo)
    am = np.maximum(alpha, 1e-3)[..., None]
    rgb = np.where(alpha[..., None] > 0, (a - bg * (1 - am)) / am, a)
    rgb = np.clip(rgb, 0, 255)
    return np.dstack([rgb, alpha * 255]).astype(np.uint8), dist


def dilate(m: np.ndarray, r: int) -> np.ndarray:
    out = m.copy()
    for _ in range(r):
        g = out.copy()
        g[1:, :] |= out[:-1, :]; g[:-1, :] |= out[1:, :]
        g[:, 1:] |= out[:, :-1]; g[:, :-1] |= out[:, 1:]
        out = g
    return out


def tira_restos_nos_cachos(rgba: np.ndarray, dist: np.ndarray):
    """Pontinhos de fundo presos na borda de fora dos cachos.
    Só mexe numa faixa fina (4 px) colada no lado de fora da silhueta, perto do cabelo castanho,
    e nunca nos 10% de baixo da linha (camiseta, caneca, notebook): ali tudo fica como está."""
    h, w = dist.shape
    opaco = rgba[..., 3] > 128
    fora = np.zeros((h, w), bool)  # transparente ligado à borda da imagem
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if not opaco[y, x] and not fora[y, x]:
                fora[y, x] = True; q.append((y, x))
    for y in range(h):
        for x in (0, w - 1):
            if not opaco[y, x] and not fora[y, x]:
                fora[y, x] = True; q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not opaco[ny, nx] and not fora[ny, nx]:
                fora[ny, nx] = True; q.append((ny, nx))
    c = rgba[..., :3].astype(int)
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    cabelo = opaco & (r < 125) & (r > g) & (g >= b - 4) & (r - b > 12)
    mn, mx = c.min(axis=2), c.max(axis=2)
    claro = (dist < 45) | ((mn > 140) & (mx - mn < 40))  # fundo ou o contorno branco/cinza da figurinha
    resto = dilate(fora, 4) & dilate(cabelo, 3) & claro & (rgba[..., 3] > 0)
    resto[int(h * 0.9):, :] = False
    rgba[..., 3] = np.where(resto, 0, rgba[..., 3])


def components(mask: np.ndarray):
    h, w = mask.shape
    lab = np.zeros((h, w), np.int32)
    comps = []
    cur = 0
    for y0 in range(h):
        row = mask[y0]
        for x0 in np.nonzero(row)[0]:
            if lab[y0, x0]:
                continue
            cur += 1
            lab[y0, x0] = cur
            q = deque([(y0, x0)])
            xs0 = xs1 = x0; ys0 = ys1 = y0; n = 0
            while q:
                y, x = q.popleft(); n += 1
                xs0 = min(xs0, x); xs1 = max(xs1, x); ys0 = min(ys0, y); ys1 = max(ys1, y)
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not lab[ny, nx]:
                            lab[ny, nx] = cur; q.append((ny, nx))
            comps.append((cur, n, xs0, ys0, xs1, ys1))
    return lab, comps


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    sprites = []
    sheet_img = Image.open(SHEET)
    for box, label_h, xcuts, names in ROWS:
        img = sheet_img.crop(box)
        w, h = img.size
        rgba, dist = remove_bg(img)
        tira_restos_nos_cachos(rgba, dist)
        rgba[h - label_h:, :, 3] = 0  # tira a legenda de texto
        # tira a faixa rosa do titulo "CLIENTES" que encosta no topo da linha 1
        top = rgba[:12].astype(int)
        pink = (top[..., 0] > 200) & (top[..., 1] < 150) & (top[..., 2] < 170)
        rgba[:12, :, 3] = np.where(pink, 0, rgba[:12, :, 3])
        # afina 1px da borda para tirar o halo claro do fundo
        al = rgba[..., 3] > 0
        inner = al.copy()
        inner[1:, :] &= al[:-1, :]; inner[:-1, :] &= al[1:, :]
        inner[:, 1:] &= al[:, :-1]; inner[:, :-1] &= al[:, 1:]
        rgba[..., 3] = np.where(al & ~inner, (rgba[..., 3] * 0.3).astype(np.uint8), rgba[..., 3])
        mask = rgba[..., 3] > 128
        # cachos de vizinhas se encostam: corta nas colunas marcadas
        cuts = [x - box[0] for x in xcuts]
        for i, name in enumerate(names):
            m = mask.copy()
            m[:, :cuts[i]] = False; m[:, cuts[i + 1]:] = False
            lab, comps = components(m)
            if not comps:
                print("  !! vazio:", name, file=sys.stderr); continue
            cid, n, x0, y0, x1, y1 = max(comps, key=lambda c: c[1])
            print(f"   {name:20s} area {n:6d} bbox {x0}-{x1} x {y0}-{y1}")
            keep = lab == cid
            keep[:, :cuts[i]] = False; keep[:, cuts[i + 1]:] = False
            # inclui pixels semi-transparentes da borda vizinhos ao componente
            grow = keep.copy()
            grow[1:, :] |= keep[:-1, :]; grow[:-1, :] |= keep[1:, :]
            grow[:, 1:] |= keep[:, :-1]; grow[:, :-1] |= keep[:, 1:]
            grow[:, :cuts[i]] = False; grow[:, cuts[i + 1]:] = False
            sub = rgba.copy()
            sub[..., 3] = np.where(grow, sub[..., 3], 0)
            crop = sub[max(0, y0 - 2):y1 + 3, max(0, x0 - 2):x1 + 3]
            im = Image.fromarray(crop, "RGBA")
            # padroniza: 2x com filtro suave, ancorado embaixo
            im = limpa(im.resize((im.width * 2, im.height * 2), Image.LANCZOS))
            im.save(OUT / f"{name}.png", optimize=True)
            sprites.append((name, im))
    # folha de conferencia sobre fundo escuro
    pw = sum(s.width for _, s in sprites[:13]) + 20 * 13
    sheet = Image.new("RGBA", (max(pw, 400), 2 * 360 + 40), (60, 42, 40, 255))
    x, y = 10, 10
    for i, (_, s) in enumerate(sprites):
        if i == 13:
            x, y = 10, 380
        sheet.alpha_composite(s, (x, y))
        x += s.width + 20
    sheet.save(ROOT / "tools" / "preview_clientes.png")
    print("ok:", len(sprites), "sprites em", OUT)


if __name__ == "__main__":
    main()
