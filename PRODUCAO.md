# Synco Motion — produção automática de um pedido (feira)

Você roda sem ninguém olhando. Não faça perguntas; decida e siga. Meta: vídeo entregue em **até 12 minutos**.
Se algo falhar de vez, marque o pedido como `erro` (último passo) e pare.

Entrada (mensagem anexada ao disparo): JSON `{"colecao": "pedidos/<uid>/itens", "pedido": "<id>", "url": "<link do artefato>"}`.
(Formato antigo `{"pedido","url"}` sem `colecao` → use `colecao` = `pedidos`.)

## Dois modos (campo `modo` do pedido)
- `demo` (ou ausente): demonstração grátis — regras fixas abaixo.
- `completo`: cliente pagante — **sem as limitações**: duração = `duracao` do pedido (15/30/45/60 s), narração conforme `narracao`, mais cenas e mais capricho; prazo maior é aceitável (até ~25 min). Veja a seção **Modo completo** no fim. Capa no quadro 0, música baixa e regra do texto digitado continuam valendo.

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
   **Imagens em `referencias`** (ids de imagem): baixe também. Se a `referencias_nota`, a `descricao` ou a `mensagem` indicarem que a foto é o assunto (uma pessoa, o produto, o lugar, "é o próprio…", "use esta foto"), **coloque a foto no vídeo** (cartão com borda/sombra, recorte se tiver fundo liso). Na dúvida, use: quem sobe uma foto espera vê-la. Só trate como inspiração de estilo quando a nota disser isso. Converta `.webp` para PNG antes (`python3 -c "from PIL import Image; Image.open('a.webp').save('a.png')"`).
4. **Criar o vídeo** — no `estudio/`:
   - Estilo pedido (`estilo` / `estilo_nome`) está em `estudio/acervo.js` como `ST.<estilo>` (prévias de 4 s). Leia a função desse estilo e use o mesmo visual (fundo, paleta, tipografia, jeito de animar). `tipo_video` (ex.: `f_whatsapp`, `f_vitrine`, `f_lista`) define a estrutura das cenas — também está no acervo.
   - Copie `estudio/exemplo_video.js` para `estudio/v_<id>.js` e reescreva: 4–5 cenas em 15 s (capa → gancho/dor → conteúdo/destaques/produto → chamada final com contato). Dá para chamar funções do acervo, mas os textos de exemplo delas (ex.: "Agende em 1 minuto") **nunca** podem aparecer no vídeo do cliente — reescreva com o conteúdo dele.
   - `dados.json`: `{"logo": "<caminho png>", "produtos": ["<png>", ...]}` (omita o que não existir). Fotos de `referencias` que vão para o vídeo entram também em `produtos` (DADOS.produtos).
   - Conferir: `python3 estudio/render.py --js estudio/v_<id>.js --dados dados.json --fmt 9:16 --saida videos/<id>.mp4 --previa 0,3,6,9,12,14.5` e olhe os PNGs (uma passada de ajustes, no máximo duas).
   - Final: o mesmo comando sem `--previa` e com `--musica <trilha>`: use a `musica` do pedido (nome do humor, ex.: "Pop animado" → `pop`, "Calma / ambiente" → `calma`, "Eletrônica / tech" → `eletronica`); "A gente escolhe" → escolha pelo estilo (`impacto` para escuro/forte, `elegante` para claro/sofisticado, `vibrante` para colorido/alegre). Gera `videos/<id>.mp4` e `videos/<id>_capa.jpg`.
5. **Página e e-mail** — `python3 publicar.py <id> "<cliente.nome>" "<cliente.empresa>"`.
6. **Publicar** — `git add videos/<id>.mp4 videos/<id>_capa.jpg v/<id>.html && git commit -m "video <id>" && git push` (se recusar: `git pull --rebase` e push de novo). Não suba o .js do vídeo nem o e-mail.
7. **Vídeo dentro do Synco Motion** — `Artifact` publish com `url` = url, `file_path` = `videos/<id>.mp4`, `asset: true` → guarde o `id` retornado.
8. **E-mail** — `Gmail send_message`: `to` = [cliente.email], `subject` = `Seu vídeo da <empresa>` (sem emoji, sem "grátis"/"pronto!!"), `htmlBody` = conteúdo de `email_<id>.html`, `body` = conteúdo de `email_<id>.txt` (os dois iguais em texto, um único link — isso reduz SPAM).
9. **Concluir** — `ArtifactData` `get` de novo e `update`:
   `{"status":"pronto","video":"<id do asset>","pagina":"https://videos.syncohub.com.br/v/<id>.html","video_url":"https://raw.githubusercontent.com/Raizera17/synco-motion-videos/main/videos/<id>.mp4","email_enviado":true|false,"atualizado_em":<epoch ms>}`.
   Em falha: `{"status":"erro","erro":"<motivo curto, em português>","atualizado_em":<epoch ms>}`.

## Alternativa rápida
Se faltar tempo ou o vídeo personalizado quebrar, use o motor de modelos: escreva um roteiro no formato de `gerar.py` (`modelo` impacto|elegante|vibrante) e rode `python3 gerar.py roteiro.json videos/<id>.mp4 --logo <png>` (~1–2 min).

## Modo completo
- **Duração**: `duracao` do pedido. Passe `--dur <segundos>` ao render.py (e escreva o vídeo para essa duração: ~1 cena a cada 3–4 s).
- **Roteiro**: se o cliente mandou `roteiro`, siga-o; senão escreva um (gancho → problema → solução/produto → prova/destaques → chamada final).
- **ElevenLabs (plano pago do Raí) — use sempre nas narrações do modo completo**:
  - modelo `eleven_v4` (o melhor; aceita marcações de emoção entre colchetes como `[animado]`, `[sorrindo]`, `[pausa]` — use pouco, só onde ajuda), `language_code` `pt` / português do Brasil;
  - **uma única geração** (`generations_count: 1`) — nunca repita a chamada para "tentar de novo";
  - texto escrito para ser falado: frases curtas, números por extenso quando soar melhor, ~2,5 palavras por segundo para caber na duração;
  - voz: `voz.id` do pedido; voz clonada: procure pelo nome com `creative_list_voices` (search = `voz_clonada_nome`).
  - **Baixar o áudio gerado (automático, pelo notebook do Raí)**: o container não alcança `storage.googleapis.com`, mas o navegador do app Claude no notebook sim. Pegue o `content_url` em `creative_get_flow_run_status` (conector **ElevenLabs_Completo**), abra-o com `Claude_Browser__preview_start` e rode em `Claude_Browser__javascript_tool`:
    `const b = await fetch(location.href).then(r => r.blob()); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'narracao_<id>.mp3'; document.body.appendChild(a); a.click(); b.size`
    O arquivo cai em `C:\Users\rai20\Downloads\narracao_<id>.mp3`; traga para cá com `device_stage_files` (aparece em `/mnt/user-data/uploads/Downloads/`). Use-o como `--narracao`. Alinhe as cenas às pausas da fala (`ffmpeg -af silencedetect=n=-35dB:d=0.25`).
  - Só se o notebook estiver offline (ferramentas do computador falhando): caia no passo manual (`aguardando_audio`) descrito abaixo.
- **Narração**:
  - `Sem narração`: igual à demo, só que na duração pedida.
  - `Minha voz` + `Minha gravação vira a narração` com `minha_voz.arquivo`: o asset é texto base64 (`codificacao: base64`) — `Artifact read` do id, decodifique para o áudio original (`mime`), limpe com ffmpeg (`highpass=f=80,afftdn=nf=-25,loudnorm=I=-16:TP=-1.5`), meça com ffprobe, use `--dur` = duração + 1,5 s e `--narracao <arquivo>`. Sincronize os textos na tela com a fala.
  - `Minha voz` + `Criar uma voz igual à minha`:
    - sem `voz_clonada_nome` (1ª passada): escreva o texto da narração, `update` `{"status":"aguardando_voz","narracao_texto":"<texto>","atualizado_em":<ms>}` e encerre (o Raí baixa a gravação, cria o clone no ElevenLabs e informa o nome no card).
    - com `voz_clonada_nome` e sem `narracao_arquivo` (2ª passada): ache a voz pelo nome, gere a narração com o texto salvo (`eleven_v4`, 1 geração) e siga como "Voz da IA" abaixo (aguardando_audio).
  - `Voz da IA` com `narracao_arquivo` já presente (passada final): é o áudio que o Raí enviou (base64) → `--narracao` e finalize normalmente.
  - `Voz da IA` sem `narracao_arquivo`: escreva o texto (ou use `narracao_texto` se já existir), gere com o ElevenLabs (regras acima), baixe pelo notebook e finalize. **Só se não der para baixar**: `update` `{"status":"aguardando_audio","narracao_texto":"<texto>","narracao_link":"<url do flow>","atualizado_em":<ms>}` e **encerre** (o Raí baixa o áudio e envia pelo card; isso dispara a passada final).
- **Página e e-mail**: `python3 publicar.py <id> "<nome>" "<empresa>" completo` (texto de cliente pagante, sem oferta de upgrade).

## Cuidados de código
- `seeded(n)` com sementes seguidas (i, i+1…) dá o 1º número quase igual → tudo nasce no mesmo lugar (ex.: estrelas grudadas na borda esquerda). Use `seeded(i * 7919 + k)` e descarte 2 valores (`r(); r();`) antes de usar.
- E-mail sai como **contato@syncohub.com.br** (endereço padrão do "Enviar como" no Gmail do Raí, via SMTP Hostinger). Não passe outro remetente.
- O conector do Gmail **remove imagens** (`<img>`) e troca os links por `google.com/url?...`. Por isso o e-mail é só texto e cores (modelo de `publicar.py`). Não tente embutir imagens.
