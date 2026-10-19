#!/usr/bin/env python3
"""Renderiza um vídeo do estúdio Synco Motion.

O vídeo é um arquivo JS que define:
  window.VIDEO = {
    async preparar(DADOS) { ... carregar imagens (DADOS.logo, DADOS.produtos[i]) ... },
    quadro(ctx, t, W, H) { ... desenha o quadro no tempo t (segundos) ... }
  };
Ele roda numa página que já carregou fonts.css e acervo.js (todos os 48+ estilos e
os auxiliares: clamp, lerp, pr, eo, eio, ex, back, spring, rr, txt, fitSize, heading,
inBox, layout, shadow, noShadow, seeded e as famílias SG/IN/SER/MONO/ANT/ARC/CAV/DMS).

Uso:
  python3 render.py --js video.js --dados dados.json --fmt 9:16 --musica vibrante --saida ../videos/ID.mp4
DADOS (json) pode ter caminhos locais de imagem em "logo" e "produtos"; eles viram data URI.
Gera também <saida>_capa.jpg (quadro 0, que precisa ser a capa completa).
"""
import argparse, base64, io, json, mimetypes, os, subprocess, tempfile
from PIL import Image
from playwright.sync_api import sync_playwright

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
FMT = {'9:16': (1080, 1920), '1:1': (1080, 1080), '16:9': (1920, 1080)}
MUSICAS = {  # trilhas originais do repositório (music/)
    'impacto': 'impacto', 'elegante': 'elegante', 'vibrante': 'vibrante',
    # nomes do formulário -> trilha mais próxima
    'calma': 'elegante', 'acustica': 'elegante', 'acústica': 'elegante', 'jazz': 'elegante', 'bossa': 'elegante',
    'corporativa': 'vibrante', 'pop': 'vibrante', 'groove': 'vibrante', 'lofi': 'vibrante', 'lo-fi': 'vibrante',
    'eletronica': 'impacto', 'eletrônica': 'impacto', 'epica': 'impacto', 'épica': 'impacto', 'hiphop': 'impacto',
    'synthwave': 'impacto', 'suspense': 'impacto',
}

def data_uri(path, max_lado=1400):
    im = Image.open(path)
    im.thumbnail((max_lado, max_lado))
    if im.mode not in ('RGB', 'RGBA'):
        im = im.convert('RGBA')
    buf = io.BytesIO(); im.save(buf, 'PNG')
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--js', required=True); ap.add_argument('--dados', default=None)
    ap.add_argument('--fmt', default='9:16'); ap.add_argument('--dur', type=float, default=15.0)
    ap.add_argument('--musica', default='vibrante'); ap.add_argument('--musica-arquivo', default=None)
    ap.add_argument('--narracao', default=None, help='arquivo de áudio da narração (mixado por cima da música)'); ap.add_argument('--narracao-inicio', type=float, default=0.6)
    ap.add_argument('--saida', required=True); ap.add_argument('--fps', type=int, default=30)
    ap.add_argument('--previa', default=None, help='lista de tempos "0,3,7" para só salvar quadros PNG (conferência)')
    a = ap.parse_args()
    W, H = FMT[a.fmt]
    dados = json.load(open(a.dados, encoding='utf-8')) if a.dados else {}
    if dados.get('logo') and os.path.exists(dados['logo']): dados['logo'] = data_uri(dados['logo'], 900)
    dados['produtos'] = [data_uri(p) for p in dados.get('produtos', []) if os.path.exists(p)]
    js = open(a.js, encoding='utf-8').read()
    html = f"""<!doctype html><html><head><meta charset=utf-8><link rel=stylesheet href="fonts.css">
<style>html,body{{margin:0;background:#000}}canvas{{display:block}}</style></head><body>
<canvas id=c width={W} height={H}></canvas>
<script src="acervo.js"></script>
<script>window.DADOS={json.dumps(dados)};</script>
<script>{js}</script>
<script>
window.pronto=(async()=>{{const fs=['400 40px Anton','40px "Archivo Black"','700 40px Caveat','italic 40px "Instrument Serif"','500 40px "Space Grotesk"','700 40px "Space Grotesk"','500 40px "JetBrains Mono"','italic 40px "DM Serif Display"','300 40px Inter','500 40px Inter','600 40px Inter','700 40px Inter','800 40px Inter','italic 800 40px Inter','400 40px Poppins','500 40px Poppins','700 40px Poppins','600 40px Lora','italic 600 40px Lora'];
 for(const f of fs){{try{{await document.fonts.load(f)}}catch(e){{}}}}
 await window.VIDEO.preparar(window.DADOS); return true}})();
window.q=t=>{{const c=document.getElementById('c'),x=c.getContext('2d');if(x.reset)x.reset();x.save();window.VIDEO.quadro(x,t,{W},{H});x.restore();return c.toDataURL('image/png')}};
</script></body></html>"""
    pagina = os.path.join(AQUI, '_render.html'); open(pagina, 'w', encoding='utf-8').write(html)
    tmp = tempfile.mkdtemp(); video = os.path.join(tmp, 'v.mp4')
    capa = os.path.splitext(a.saida)[0] + '_capa.jpg'
    with sync_playwright() as p:
        b = p.chromium.launch(); pg = b.new_page(viewport={'width': min(W, 1920), 'height': min(H, 1920)})
        erros = []; pg.on('pageerror', lambda e: erros.append(str(e)))
        pg.goto('file://' + pagina); pg.evaluate('window.pronto')
        if a.previa:
            for t in [float(x) for x in a.previa.split(',')]:
                u = pg.evaluate(f'window.q({t})')
                Image.open(io.BytesIO(base64.b64decode(u.split(',')[1]))).save(f'{os.path.splitext(a.saida)[0]}_t{t:.1f}.png')
            print('erros:', erros); b.close(); return
        n = int(a.dur * a.fps)
        ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(a.fps), '-c:v', 'png', '-i', '-',
                               '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', video], stdin=subprocess.PIPE)
        for i in range(n):
            u = pg.evaluate(f'window.q({i / a.fps})'); d = base64.b64decode(u.split(',')[1]); ff.stdin.write(d)
            if i == 0: Image.open(io.BytesIO(d)).convert('RGB').save(capa, quality=90)
            if i % 90 == 0: print(f'quadro {i}/{n}', flush=True)
        ff.stdin.close(); ff.wait(); b.close()
        if erros: print('ERROS NA PÁGINA:', erros)
    musica = a.musica_arquivo or os.path.join(RAIZ, 'music', MUSICAS.get(a.musica.lower(), 'vibrante') + '.wav')
    fade = max(0.5, a.dur - 1.8)
    if a.narracao:
        ms = int(a.narracao_inicio * 1000)
        filtro = (f'[1:a]loudnorm=I=-30:TP=-8,afade=t=out:st={fade}:d=1.8[m];'
                  f'[3:a]loudnorm=I=-16:TP=-1.5,adelay={ms}|{ms}[n];[m][n]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]')
        cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-i', video, '-stream_loop', '-1', '-i', musica, '-i', capa, '-i', a.narracao,
               '-filter_complex', filtro, '-map', '0:v', '-map', '[a]', '-map', '2', '-c:v:0', 'copy', '-c:a', 'aac', '-b:a', '192k',
               '-c:v:1', 'mjpeg', '-disposition:v:1', 'attached_pic', '-t', str(a.dur), '-movflags', '+faststart', a.saida]
        subprocess.run(cmd, check=True); print('OK', a.saida, os.path.getsize(a.saida) // 1024, 'KB', '| capa:', capa); return
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', video, '-stream_loop', '-1', '-i', musica, '-i', capa,
                    '-map', '0:v', '-map', '1:a', '-map', '2', '-c:v:0', 'copy',
                    '-af', f'afade=t=out:st={fade}:d=1.8,loudnorm=I=-28:TP=-6', '-c:a', 'aac', '-b:a', '160k',
                    '-c:v:1', 'mjpeg', '-disposition:v:1', 'attached_pic', '-t', str(a.dur), '-movflags', '+faststart', a.saida], check=True)
    print('OK', a.saida, os.path.getsize(a.saida) // 1024, 'KB', '| capa:', capa)

if __name__ == '__main__':
    main()
