#!/usr/bin/env python3
"""Remove fundo claro e liso de fotos de produto/logo (sem IA, sem internet).
Uso: python3 recortar.py entrada.jpg saida.png [--modo borda|casca]
  borda: inunda o fundo a partir das bordas (bom para fundo branco liso)
  casca: contorno convexo (bom para embalagem branca em fundo branco)
Se a imagem já tem transparência, só corta as sobras.
Sempre confira o resultado sobre uma cor (Read do PNG composto) antes de usar.
"""
import sys, cv2, numpy as np
from PIL import Image

def main():
    ent, sai = sys.argv[1], sys.argv[2]
    modo = sys.argv[sys.argv.index('--modo') + 1] if '--modo' in sys.argv else 'borda'
    pil = Image.open(ent)
    if pil.mode in ('RGBA', 'LA') and np.array(pil.convert('RGBA'))[..., 3].min() < 250:
        pil = pil.convert('RGBA'); bb = pil.getbbox(); pil.crop(bb).save(sai); print('ja tinha transparencia'); return
    im = cv2.cvtColor(np.array(pil.convert('RGB')), cv2.COLOR_RGB2BGR); h, w = im.shape[:2]
    if modo == 'casca':
        b = cv2.GaussianBlur(im, (5, 5), 0).astype(int); d = 255 - b.min(-1)
        fg = (d > 18).astype(np.uint8) * 255; fg[:3] = 0; fg[-3:] = 0; fg[:, :3] = 0; fg[:, -3:] = 0
        fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
        cs, _ = cv2.findContours(fg, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        big = max(cv2.contourArea(c) for c in cs); pts = np.vstack([c for c in cs if cv2.contourArea(c) > 0.01 * big])
        m = np.zeros((h, w), np.uint8); cv2.fillPoly(m, [cv2.convexHull(pts)], 255)
    else:
        pad = 6; big = cv2.copyMakeBorder(im, pad, pad, pad, pad, cv2.BORDER_REPLICATE)
        blur = cv2.GaussianBlur(big, (3, 3), 0); mask = np.zeros((h + 2 * pad + 2, w + 2 * pad + 2), np.uint8)
        for seed in [(0, 0), (w + 2 * pad - 1, 0), (0, h + 2 * pad - 1), (w + 2 * pad - 1, h + 2 * pad - 1)]:
            cv2.floodFill(blur, mask, seed, (0, 0, 0), (14, 14, 14), (14, 14, 14), cv2.FLOODFILL_MASK_ONLY | cv2.FLOODFILL_FIXED_RANGE | (255 << 8) | 8)
        bg = mask[1:-1, 1:-1][pad:-pad, pad:-pad] > 0
        m = (~bg).astype(np.uint8) * 255
        m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        area = max(cv2.contourArea(c) for c in cs); keep = np.zeros_like(m)
        for c in cs:
            if cv2.contourArea(c) > area * 0.02: cv2.drawContours(keep, [c], -1, 255, -1)
        # buracos internos com cor de fundo continuam fundo
        m = cv2.bitwise_and(keep, m) if (keep > 0).mean() > 0 else keep
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    m = cv2.erode(m, np.ones((3, 3), np.uint8), iterations=2); a = cv2.GaussianBlur(m, (5, 5), 0)
    out = np.dstack([cv2.cvtColor(im, cv2.COLOR_BGR2RGB), a]); ys, xs = np.where(a > 10)
    Image.fromarray(out[ys.min():ys.max() + 1, xs.min():xs.max() + 1], 'RGBA').save(sai); print('ok', sai)

if __name__ == '__main__':
    main()
