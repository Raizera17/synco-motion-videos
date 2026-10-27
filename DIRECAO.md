# Synco Motion — direção do vídeo (briefing antes de animar)

Antes de escrever o `v_<id>.js`, escreva um **briefing curto** em `briefs/<id>.md` (não sobe pro GitHub). Vídeo com direção travada sai melhor na primeira passada.
Na demo (15 s, meta de 12 min) o briefing tem 10–15 linhas; no modo completo pode ser maior.

## 1. Referências (1–2 min, opcional na demo)
`python3 referencias/buscar.py <palavras do pedido>` (ex.: `lancamento produto vertical`, `--cat explainer receita`, `dados grafico`, `logo marca`).
Leia 1–2 prompts completos com `--n 2 --ler`. Pegue **estrutura e técnica** (como a cena se transforma, ritmo, hits). Nunca copie textos, marcas, personagens ou paletas de outra empresa.
O índice inteiro está em `referencias/INDICE.md` (703 prompts: motion 369, explainer 116, 3D 117, interativo 101).

## 2. Anatomia do briefing (os 8 blocos)
1. **Entrega** — duração exata (ex.: 15,0 s), formato (1080×1920 para Reels/Stories; 1080×1080 feed; 1920×1080 TV/YouTube), 30 fps, MP4. "Renderize, confira os quadros e ajuste antes de entregar."
2. **Conceito em uma linha** — uma ideia visual que atravessa o vídeo todo (ex.: "o logo é uma gota que vira cada produto"; "uma linha que desenha a jornada do cliente e nunca sai da tela").
3. **Direção de arte travada** — 3 a 5 cores em hex (as do cliente se vierem em `cores`; senão as do estilo do acervo) e "nenhuma outra"; 1 fonte display pesada para 1–4 palavras, 1 de apoio, 1 mono para rótulos; margem de segurança ≥ 6% da largura.
4. **Mensagem travada** — as frases exatas, na ordem exata, tiradas do que o cliente **digitou**. Sem slogans inventados, sem preço/prazo/número que ele não deu.
5. **Storyboard com tempos** — blocos `0,0–2,5 s`, `2,5–6,0 s`… cada um com: o que entra, como se transforma, qual é o "hit" (impacto). Quadro 0 = capa completa.
6. **Regras de movimento** — transições que nascem da cena anterior (a forma/palavra vira a próxima), sem corte seco nem fade genérico; uma família de easing para entradas e a espelhada para saídas; nada parado no momento do corte; câmera travada ou movimento com motivo.
7. **Som** — trilha baixa; trocas de mensagem caem no tempo da música; com narração, cenas trocam nas pausas da fala.
8. **Restrições** — sem marca d'água, sem contador, sem clichê do nicho, sem texto dentro de imagem gerada, sem tela vazia no início, sem letra miúda.

## 3. Princípios que se repetem nos melhores vídeos
- **Gancho em 0–2,5 s**: frase curta e grande batendo na tela (na demo, a capa já é o gancho: marca + mensagem principal).
- **Tipografia é o personagem**: poucas palavras por vez, grandes, que constroem e transformam o quadro.
- **Prova real**: produto, foto, tela ou número do cliente entrando em cards com profundidade; números contando.
- **Um acento de cor só para a ação** (chamada, contato, preço que o cliente deu); o resto neutro.
- **Ritmo por hits**: cada troca de mensagem coincide com um impacto.
- **Final com logo + uma chamada só** e quadro final estável (ou loop: último quadro = quadro 0).
- **Espaço negativo**: composição compacta e centrada, nada encostado nas bordas.

## 4. Modelo de briefing (copie e preencha)
```
# Briefing <id> — <empresa>
Entrega: <dur> s · <W×H> · 30 fps · MP4
Conceito: <uma linha>
Paleta: <#hex fundo> <#hex texto> <#hex acento> (nenhuma outra) · Tipos: <display> / <apoio> / <mono>
Mensagens (ordem exata): 1) "<…>" 2) "<…>" 3) "<chamada final>"
Storyboard:
- 0,0–3,0 s  capa completa (logo + "<mensagem principal>"), respira; hit em 2,8 s
- 3,0–7,0 s  <cena 2: o que entra / como vira a próxima>
- 7,0–11,0 s <cena 3>
- 11,0–15,0 s chamada final + contato, quadro estável
Movimento: <regra de transição> · easing <família>
Som: <trilha> baixa; trocas em <tempos>
Não fazer: <restrições específicas do pedido>
Referências usadas: <slugs> (só estrutura)
```
Depois do briefing, siga o passo 5 do `PRODUCAO.md` (acervo + `v_<id>.js` + prévias). Ao conferir as prévias, compare com o storyboard: se uma cena não "vira" a próxima ou tem letra miúda, ajuste antes do render final.

## 5. Sincronizar com narração (modo completo)
Para saber o tempo exato de cada frase: `creative_transcribe_audio` (modelo `eleven_scribe_v1`, `connect_from` = node da fala no mesmo flow) devolve o início/fim de cada palavra — use o início da primeira palavra de cada parágrafo como troca de cena (+ o atraso de `--narracao-inicio`). Sem transcrição, use `silencedetect`.
