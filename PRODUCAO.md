# Synco Motion — produção automática de um pedido (feira)

Você roda sem ninguém olhando. Não faça perguntas; decida e siga. Se algo falhar, marque o pedido como `erro` (passo final) e pare.

Entrada (mensagem anexada ao disparo): JSON `{"pedido": "<id>", "url": "<link do artefato Synco Motion>"}`.

## Passos

1. **Ler o pedido** — `ArtifactData` action `get`, `url` = url, `collection` = `pedidos`, `doc_id` = pedido.
   Logo depois, `update` com `{"status":"produzindo","inicio":"<ISO agora>"}` (passe `if_version` da leitura).
2. **Repositório** — `add_repo` owner `Raizera17` repo `synco-motion-videos` access `push`; clone em `/home/claude/smv`
   (`git clone --depth 1 https://github.com/Raizera17/synco-motion-videos /home/claude/smv`).
   Dependências: `pip install --break-system-packages playwright pillow scipy numpy` só se faltar; Chromium já vem instalado. Precisa de `ffmpeg`.
3. **Logo** (se `logo_asset` existir no pedido) — `Artifact` action `read`, `url` = url, `path` = logo_asset. Use o arquivo salvo.
4. **Roteiro** — escreva `/home/claude/smv/roteiro_<id>.json` no formato abaixo, em português, a partir do que o cliente preencheu.
   O texto digitado pelo cliente vale mais que as opções clicadas. Não invente fatos (preços, prazos, prêmios) que ele não disse.
   Frases curtas: título da capa até ~7 palavras; gancho até ~12; cada destaque até ~6; CTA até ~5.
5. **Gerar** — `cd /home/claude/smv && python3 gerar.py roteiro_<id>.json videos/<id>.mp4 [--logo <arquivo>]`
   (gera também `videos/<id>_capa.jpg`). Leva ~1–2 min. Confira a capa com Read (uma olhada só).
6. **Página e e-mail** — `python3 publicar.py <id> "<nome>" "<empresa>"`.
7. **Publicar** — `git add videos/<id>.mp4 videos/<id>_capa.jpg v/<id>.html && git commit -m "video <id>" && git push`
   (antes: `git pull --rebase` se o push for recusado). Não faça commit do roteiro nem do email.
8. **E-mail** — `Gmail send_message`: `to` = [email do pedido], `subject` = `Seu vídeo Synco Motion está pronto 🎬 — <empresa>`,
   `htmlBody` = conteúdo de `email_<id>.html`, `body` = versão curta em texto com o link da página. Só se houver e-mail válido.
9. **Concluir** — `ArtifactData` `get` de novo e `update`:
   `{"status":"pronto","pagina":"https://raizera17.github.io/synco-motion-videos/v/<id>.html","video":"https://raw.githubusercontent.com/Raizera17/synco-motion-videos/main/videos/<id>.mp4","capa":"https://raw.githubusercontent.com/Raizera17/synco-motion-videos/main/videos/<id>_capa.jpg","fim":"<ISO>","email_enviado":true|false}`.
   Em falha: `{"status":"erro","erro":"<motivo curto>"}`.

## Formato do roteiro

```json
{
  "modelo": "impacto | elegante | vibrante",
  "cores": {"primaria": "#hex", "secundaria": "#hex"},
  "marca": "Nome da empresa",
  "capa": {"selo": "palavra curta (só impacto)", "titulo": "...", "subtitulo": "...", "rodape": "chamada curta"},
  "gancho": "pergunta ou frase de dor/desejo",
  "gancho2": "resposta curta (opcional)",
  "titulo_destaques": "Por que a <marca>",
  "destaques": ["...", "...", "..."],
  "cta": {"titulo": "...", "contato": "principal (WhatsApp/telefone)", "contato2": "@instagram ou site", "contato3": "endereço (opcional)"},
  "rodape_legal": "opcional: registro profissional exigido (ex.: CRP, CRM, OAB)"
}
```

Modelos: **impacto** (escuro, tipografia forte, faixas de cor — varejo, serviços, ofertas), **elegante** (claro, serifada itálica — saúde, beleza, consultoria, moda), **vibrante** (gradiente colorido — alimentação, eventos, educação, público jovem).
Se o cliente escolheu estilo, respeite; se não, escolha pelo segmento.
