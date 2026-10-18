#!/usr/bin/env python3
"""Synco Motion — gera vídeo de 15s a partir de um roteiro JSON.
Uso: python3 gerar.py roteiro.json saida.mp4 [--logo caminho.png]
"""
import sys, os, json, base64, subprocess, argparse, io, tempfile
from playwright.sync_api import sync_playwright
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
FPS, DUR = 30, 15.0

def prepara_logo(path):
    im = Image.open(path)
    im.thumbnail((900, 900))
    tem_alpha = im.mode in ('RGBA', 'LA') or (im.mode == 'P' and 'transparency' in im.info)
    if tem_alpha:
        im = im.convert('RGBA')
        a = im.split()[-1]
        transparente = sum(1 for v in a.getdata() if v < 20) / (im.width * im.height)
        card = transparente < 0.05  # PNG "com alpha" mas sem transparência real
    else:
        im = im.convert('RGBA'); card = True
    bbox = im.getbbox()
    if bbox: im = im.crop(bbox)
    buf = io.BytesIO(); im.save(buf, 'PNG')
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode(), card

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('roteiro'); ap.add_argument('saida'); ap.add_argument('--logo')
    a = ap.parse_args()
    spec = json.load(open(a.roteiro, encoding='utf-8'))
    if a.logo and os.path.exists(a.logo):
        spec['logo'], spec['logoCard'] = prepara_logo(a.logo)
    modelo = spec.get('modelo', 'vibrante')
    tmp = tempfile.mkdtemp()
    video = os.path.join(tmp, 'v.mp4'); capa = os.path.join(tmp, 'capa.jpg')
    n = int(DUR * FPS)
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'png', '-i', '-',
                           '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', video], stdin=subprocess.PIPE)
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1080, 'height': 1920})
        erros = []
        pg.on('pageerror', lambda e: erros.append(str(e)))
        pg.goto('file://' + os.path.join(AQUI, 'engine', 'index.html'))
        pg.evaluate('s => window.load(s)', spec)
        for i in range(n):
            u = pg.evaluate(f"(()=>{{window.ov({i / FPS});return document.getElementById('c').toDataURL('image/png')}})()")
            data = base64.b64decode(u.split(',')[1]); ff.stdin.write(data)
            if i == 0: Image.open(io.BytesIO(data)).convert('RGB').save(capa, quality=92)
            if i % 90 == 0: print(f'quadro {i}/{n}', flush=True)
        b.close()
        if erros: print('ERROS NA PÁGINA:', erros)
    ff.stdin.close(); ff.wait()
    musica = os.path.join(AQUI, 'music', f'{modelo}.wav')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', video, '-i', musica, '-i', capa,
                    '-map', '0:v', '-map', '1:a', '-map', '2', '-c:v:0', 'copy',
                    '-af', 'afade=t=out:st=13.2:d=1.8,loudnorm=I=-28:TP=-6', '-c:a', 'aac', '-b:a', '160k',
                    '-c:v:1', 'mjpeg', '-disposition:v:1', 'attached_pic', '-t', str(DUR), '-movflags', '+faststart', a.saida], check=True)
    capa_out = os.path.splitext(a.saida)[0] + '_capa.jpg'
    Image.open(capa).save(capa_out, quality=90)
    print('OK', a.saida, os.path.getsize(a.saida) // 1024, 'KB')

if __name__ == '__main__':
    main()
