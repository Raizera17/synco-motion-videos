#!/usr/bin/env python3
"""Busca referências de direção na biblioteca de 703 prompts (referencias/opus-videos).

Uso:
  python3 referencias/buscar.py lancamento produto 9:16       # palavras-chave (pt ou en)
  python3 referencias/buscar.py --cat explainer receita         # filtra categoria: motion | explainer | 3d | interactive
  python3 referencias/buscar.py --n 3 --ler kinetic tipografia  # mostra o prompt completo dos 3 melhores
  python3 referencias/buscar.py --indice                        # regenera referencias/INDICE.md

Só prompts completos entram no ranking (os parciais não trazem o texto do criador).
"""
import argparse, json, os, re, unicodedata

AQUI = os.path.dirname(os.path.abspath(__file__))
BASE = os.path.join(AQUI, 'opus-videos')

# sinônimos pt -> en para buscar numa biblioteca majoritariamente em inglês
SIN = {
    'lancamento': ['launch', 'release', 'announce'], 'produto': ['product', 'saas', 'app'], 'app': ['app', 'ui', 'interface'],
    'tipografia': ['kinetic', 'typography', 'type', 'text'], 'texto': ['text', 'typography', 'kinetic'], 'logo': ['logo', 'brand'],
    'marca': ['brand', 'logo'], 'explicativo': ['explainer', 'explain', 'how'], 'explicar': ['explainer', 'explain'],
    'dados': ['data', 'chart', 'graph', 'numbers'], 'grafico': ['chart', 'graph', 'data'], 'numeros': ['numbers', 'stats', 'data'],
    'vertical': ['9:16', 'vertical', 'reels', 'tiktok', 'shorts'], 'reels': ['9:16', 'reels', 'tiktok', 'vertical'],
    'anuncio': ['ad', 'commercial', 'promo'], 'promocao': ['promo', 'sale', 'offer'], 'oferta': ['offer', 'sale', 'promo'],
    'loja': ['store', 'shop', 'ecommerce'], 'comida': ['food', 'recipe', 'restaurant'], 'receita': ['recipe', 'cooking'],
    'saude': ['health', 'medical', 'wellness'], 'educacao': ['education', 'lesson', 'learn'], 'musica': ['music', 'beat', 'song'],
    'ritmo': ['beat', 'rhythm', 'sync'], 'som': ['sound', 'audio', 'sfx'], 'tela': ['ui', 'screen', 'interface'],
    'whatsapp': ['chat', 'message', 'whatsapp'], 'conversa': ['chat', 'message', 'conversation'], 'mapa': ['map', 'globe'],
    'contagem': ['countdown', 'timer'], 'historia': ['story', 'narrative'], 'luxo': ['luxury', 'premium', 'elegant'],
    'elegante': ['elegant', 'premium', 'minimal'], 'minimalista': ['minimal', 'clean'], 'retro': ['retro', 'pixel', 'vintage'],
    '3d': ['3d', 'threejs', 'three.js'], 'particulas': ['particles'], 'transicao': ['transition', 'morph'],
    'portfolio': ['portfolio', 'showreel'], 'imobiliaria': ['real estate', 'house'], 'financas': ['finance', 'fintech', 'money'],
}

def norm(s):
    return unicodedata.normalize('NFKD', s.lower()).encode('ascii', 'ignore').decode()

def carregar():
    return json.load(open(os.path.join(BASE, 'videos.json'), encoding='utf-8'))

def termos(chaves):
    out = []
    for k in chaves:
        n = norm(k); out.append(n); out += SIN.get(n, [])
    return list(dict.fromkeys(out))

def pontuar(v, ts):
    alvo = norm(v['prompt']) + ' ' + ' '.join(v['tech_tags']) + ' ' + v['category']
    p = sum(min(alvo.count(t), 3) * (3 if len(t) > 4 else 1) for t in ts)
    if p and len(v['prompt']) > 600: p += 2   # prompts longos costumam ter direção completa
    return p

def gerar_indice(dados):
    nomes = {'motion': 'Motion graphics', 'explainer': 'Explainer', '3d': '3D', 'interactive': 'Interativo'}
    linhas = ['# Índice — 703 prompts de vídeo (referência de direção)', '',
              'Fonte: `opus-videos/` (MIT, ver ORIGEM.md). ★ = prompt completo. Busca: `python3 referencias/buscar.py <palavras>`.', '']
    for cat in ['motion', 'explainer', '3d', 'interactive']:
        vs = [v for v in dados if v['category'] == cat]
        vs.sort(key=lambda v: (v['prompt_partial'], -len(v['prompt'])))
        linhas += [f'## {nomes[cat]} ({len(vs)})', '']
        for v in vs:
            ini = re.sub(r'\s+', ' ', v['prompt']).strip()[:140]
            linhas.append(f"- `{v['slug']}` · {','.join(v['tech_tags'])}{'' if v['prompt_partial'] else ' ★'} · {ini}")
        linhas.append('')
    open(os.path.join(AQUI, 'INDICE.md'), 'w', encoding='utf-8').write('\n'.join(linhas))
    print('INDICE.md gerado:', len(dados), 'prompts')

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('chaves', nargs='*'); ap.add_argument('--cat'); ap.add_argument('--n', type=int, default=8)
    ap.add_argument('--ler', action='store_true'); ap.add_argument('--indice', action='store_true')
    a = ap.parse_args(); dados = carregar()
    if a.indice: gerar_indice(dados); return
    ts = termos(a.chaves)
    cand = [v for v in dados if not v['prompt_partial'] and (not a.cat or v['category'] == a.cat)]
    res = sorted(((pontuar(v, ts), v) for v in cand), key=lambda x: -x[0])
    res = [r for r in res if r[0] > 0][:a.n] if ts else res[:a.n]
    for p, v in res:
        print(f"[{p}] {v['slug']} · {v['category']} · {','.join(v['tech_tags'])} · {v.get('skillry_url', '')}")
        print('    ' + re.sub(r'\s+', ' ', v['prompt'])[:220])
        if a.ler: print('\n' + v['prompt'] + '\n' + '-' * 60)

if __name__ == '__main__':
    main()
