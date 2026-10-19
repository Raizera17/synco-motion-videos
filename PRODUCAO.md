# Synco Motion — produção automática de um pedido (feira)

Você roda sem ninguém olhando. Não faça perguntas; decida e siga. Meta: vídeo entregue em **até 12 minutos**.
Se algo falhar de vez, marque o pedido como `erro` (último passo) e pare.

Entrada (mensagem anexada ao disparo): JSON `{"colecao": "pedidos/<uid>/itens", "pedido": "<id>", "url": "<link do artefato>"}`.
(Formato antigo `{"pedido","url"}` sem `colecao` → use `colecao` = `pedidos`.)

## Regras fixas da demonstração
- **15 segundos**, **sem narração**, música de fundo baixa (o render já mixa em -28 LUFS).
- **Quadro 0 = capa completa** (marca + mensagem principal já visíveis no t=0, só "respirando"); nada de tela vazia ou rosa no começo.
- O que o cliente **digitou** vale mais do que as opções clicadas. Não invente fatos (preço, prazo, números, prêmios, endereço).
- Textos curtos: título até ~7 palavras; cada linha cabe na tela sem letra miúda.
- Use as **cores da marca** se vierem em `cores`; senão, as do estilo escolhido. Use o **logo** e as **fotos de produto** se existirem.
- Formato: `formato` do pedido (Vertical 9:16 → `9:16`, Quadrado 1:1 → `1:1`, Horizontal 16:9 → `16:9`).

## Passos
1. **Ler** — `ArtifactData` `get` (`url`, `collection` = colecao, `doc_id` = pedido). Depois `update` `{"status":"producao","inicio_producao":<epoch ms>,"atualizado_em":<epoch ms>}` com o `if_version` lido.
2. **Repositório** — `add_repo` Raizera17/synco-motion-videos (`push`); `git clone --depth 1 https://github.com/Raizera17/synco-motion-videos /home/claude/smv`.
3. **Arquivos do cliente** — para `logo.id` e cada `produtos_fotos[].id`: `Artifact` `read` com `url` e `path` = id (salva local).
   Fotos com fundo branco: `python3 estudio/recortar.py foto.jpg foto.png` (ou `--modo casca` para embalagem branca) e confira sobre uma cor com Read.
   Logo sem transparência: recorte igual; se ficar ruim, use o logo dentro de um cartão branco arredondado.
4. **Criar o vídeo** — no `estudio/`:
   - Estilo pedido (`estilo` / `estilo_nome`) está em `estudio/acervo.js` como `ST.<estilo>` (prévias de 4 s). Leia a função desse estilo e use o mesmo visual (fundo, paleta, tipografia, jeito de animar). `tipo_video` (ex.: `f_whatsapp`, `f_vitrine`, `f_lista`) define a estrutura das cenas — também está no acervo.
   - Copie `estudio/exemplo_video.js` para `estudio/v_<id>.js` e reescreva: 4–5 cenas em 15 s (capa → gancho/dor → conteúdo/destaques/produto → chamada final com contato). Dá para chamar funções do acervo, mas os textos de exemplo delas (ex.: "Agende em 1 minuto") **nunca** podem aparecer no vídeo do cliente — reescreva com o conteúdo dele.
   - `dados.json`: `{"logo": "<caminho png>", "produtos": ["<png>", ...]}` (omita o que não existir).
   - Conferir: `python3 estudio/render.py --js estudio/v_<id>.js --dados dados.json --fmt 9:16 --saida videos/<id>.mp4 --previa 0,3,6,9,12,14.5` e olhe os PNGs (uma passada de ajustes, no máximo duas).
   - Final: o mesmo comando sem `--previa` e com `--musica <trilha>`: use a `musica` do pedido (nome do humor, ex.: "Pop animado" → `pop`, "Calma / ambiente" → `calma`, "Eletrônica / tech" → `eletronica`); "A gente escolhe" → escolha pelo estilo (`impacto` para escuro/forte, `elegante` para claro/sofisticado, `vibrante` para colorido/alegre). Gera `videos/<id>.mp4` e `videos/<id>_capa.jpg`.
5. **Página e e-mail** — `python3 publicar.py <id> "<cliente.nome>" "<cliente.empresa>"`.
6. **Publicar** — `git add videos/<id>.mp4 videos/<id>_capa.jpg v/<id>.html && git commit -m "video <id>" && git push` (se recusar: `git pull --rebase` e push de novo). Não suba o .js do vídeo nem o e-mail.
7. **Vídeo dentro do Synco Motion** — `Artifact` publish com `url` = url, `file_path` = `videos/<id>.mp4`, `asset: true` → guarde o `id` retornado.
8. **E-mail** — `Gmail send_message`: `to` = [cliente.email], `subject` = `Seu vídeo Synco Motion está pronto 🎬 — <empresa>`, `htmlBody` = conteúdo de `email_<id>.html`, `body` = texto curto com o link da página.
9. **Concluir** — `ArtifactData` `get` de novo e `update`:
   `{"status":"pronto","video":"<id do asset>","pagina":"https://raizera17.github.io/synco-motion-videos/v/<id>.html","video_url":"https://raw.githubusercontent.com/Raizera17/synco-motion-videos/main/videos/<id>.mp4","email_enviado":true|false,"atualizado_em":<epoch ms>}`.
   Em falha: `{"status":"erro","erro":"<motivo curto, em português>","atualizado_em":<epoch ms>}`.

## Alternativa rápida
Se faltar tempo ou o vídeo personalizado quebrar, use o motor de modelos: escreva um roteiro no formato de `gerar.py` (`modelo` impacto|elegante|vibrante) e rode `python3 gerar.py roteiro.json videos/<id>.mp4 --logo <png>` (~1–2 min).
