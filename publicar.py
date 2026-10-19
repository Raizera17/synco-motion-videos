#!/usr/bin/env python3
"""Gera a página de download (v/<id>.html) e o corpo do e-mail (email_<id>.html).
Uso: python3 publicar.py <id> "<Nome do cliente>" "<Empresa>"
"""
import sys, os, html
AQUI = os.path.dirname(os.path.abspath(__file__))
BASE = 'https://raizera17.github.io/synco-motion-videos'
RAW = 'https://raw.githubusercontent.com/Raizera17/synco-motion-videos/main'

def main():
    pid, nome, empresa = sys.argv[1], sys.argv[2], sys.argv[3]
    completo = len(sys.argv) > 4 and sys.argv[4] == 'completo'
    n, e = html.escape(nome.split()[0] if nome.strip() else ''), html.escape(empresa)
    os.makedirs(os.path.join(AQUI, 'v'), exist_ok=True)
    pagina = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Vídeo {e} · Synco Motion</title>
<meta property="og:title" content="Seu vídeo {e} está pronto"><meta property="og:image" content="{BASE}/videos/{pid}_capa.jpg">
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">
<style>
:root{{--bg:#0E0B1A;--card:#1A1530;--fg:#F4F1FF;--mut:#B7AECF;--acc:#E0337F;--acc2:#7B5CFF}}
*{{box-sizing:border-box}}body{{margin:0;background:radial-gradient(1200px 600px at 80% -10%,#3a1450 0,transparent 60%),var(--bg);color:var(--fg);font-family:Poppins,system-ui,sans-serif;min-height:100vh}}
main{{max-width:520px;margin:0 auto;padding:28px 18px 48px;display:flex;flex-direction:column;gap:18px;align-items:center;text-align:center}}
.tag{{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--mut)}}
h1{{margin:0;font-size:28px;line-height:1.15;text-wrap:balance}}
video{{width:min(100%,360px);aspect-ratio:9/16;border-radius:22px;background:#000;box-shadow:0 24px 60px rgba(0,0,0,.5)}}
.btn{{display:inline-flex;gap:10px;align-items:center;justify-content:center;width:min(100%,360px);padding:16px 22px;border-radius:999px;background:linear-gradient(90deg,var(--acc),var(--acc2));color:#fff;font-weight:700;text-decoration:none;font-size:17px}}
.box{{width:100%;background:var(--card);border-radius:20px;padding:20px;display:flex;flex-direction:column;gap:6px}}
.box b{{font-size:18px}}.box p{{margin:0;color:var(--mut);font-size:14px;line-height:1.5}}
footer{{color:var(--mut);font-size:12px}}
</style></head><body><main>
<div class="tag">Synco Motion · por SyncoHub</div>
<h1>{('Oi, ' + n + '! ') if n else ''}Seu vídeo da {e} está pronto</h1>
<video src="../videos/{pid}.mp4" poster="../videos/{pid}_capa.jpg" controls playsinline></video>
<a class="btn" href="../videos/{pid}.mp4" download="{pid}.mp4">⬇ Baixar vídeo</a>
{'<div class="box"><b>Obrigado pela confiança!</b><p>Precisa de algum ajuste? É só responder o e-mail.</p></div>' if completo else '<div class="box"><b>Gostou? Esse foi só o começo.</b><p>Vídeos completos com fotos reais, narração, música e legendas, entregues no mesmo dia. A partir de R$ 50 (15s).</p><p>Responda o e-mail que você recebeu ou fale com a gente no estande da SyncoHub.</p></div>'}
<footer>Feito com Synco Motion · SyncoHub</footer>
</main></body></html>"""
    open(os.path.join(AQUI, 'v', f'{pid}.html'), 'w', encoding='utf-8').write(pagina)

    # E-mail enxuto de propósito (anti-spam): parece mensagem pessoal, um único link,
    # sem imagem externa, sem emoji/“grátis”/caixa alta, com versão em texto puro igual.
    link = f'{BASE}/v/{pid}.html'
    saud = ('Oi, ' + n + '!') if n else 'Olá!'
    intro = (f'Seu vídeo da {e} ficou pronto. Obrigado por escolher a SyncoHub.' if completo else
             f'Foi um prazer conversar com você no estande da SyncoHub na Feira do Empreendedor. Como combinamos, aqui está o vídeo de demonstração da {e}.')
    fim = ('Se quiser algum ajuste, é só responder este e-mail.' if completo else
           'Se quiser a versão completa, com fotos reais do seu negócio, narração e entrega no mesmo dia, é só responder este e-mail.')
    email = f"""<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#222;max-width:560px">
<p>{saud}</p>
<p>{intro}</p>
<p><a href="{link}" style="color:#7B2CBF;font-weight:bold">Assistir e baixar o vídeo</a></p>
<p>{fim}</p>
<p>Abraço,<br>Raí Neves<br>SyncoHub</p></div>"""
    texto = f"{saud}\n\n{intro}\n\nAssistir e baixar o vídeo: {link}\n\n{fim}\n\nAbraço,\nRaí Neves\nSyncoHub\n"
    open(os.path.join(AQUI, f'email_{pid}.html'), 'w', encoding='utf-8').write(email)
    open(os.path.join(AQUI, f'email_{pid}.txt'), 'w', encoding='utf-8').write(texto)
    print('pagina:', f'{BASE}/v/{pid}.html'); print('email:', os.path.join(AQUI, f'email_{pid}.html'))

if __name__ == '__main__':
    main()
