// EXEMPLO de vídeo do estúdio (15 s). Copie, renomeie e reescreva para cada pedido.
// Regras: quadro 0 = capa completa (nada entrando do zero no t=0); sem narração; textos curtos;
// cores da marca quando o cliente mandou; logo e fotos de produto se existirem (DADOS.logo, DADOS.produtos).
// Aqui o visual parte do estilo "Gradiente tech" do acervo, adaptado às cores e textos do cliente.
(() => {
  const C = {                       // ===== conteúdo do pedido (troque tudo) =====
    marca: 'SyncoHub',
    cor1: '#E0337F', cor2: '#7B5CFF', cor3: '#2BD1FF', fundo: '#0D0B1E',
    capa: ['Sua empresa', 'no automático.'], capaSub: 'Automação com IA para pequenas empresas',
    gancho: ['Ainda responde', 'tudo na mão?'],
    destaques: ['Atendimento 24h no WhatsApp', 'Processos que rodam sozinhos', 'Ferramenta do seu jeito'],
    cta: ['Venha conhecer', 'no estande 127'], contato: '@syncohub',
  };
  const IMG = { logo: null, prods: [] };
  const load = src => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; });
  const CENAS = [[0, 3.8], [3.8, 7.4], [7.4, 11.4], [11.4, 15.2]];

  function fundo(ctx, t, W, H, u) {
    ctx.fillStyle = C.fundo; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter';
    [[C.cor2, 0.28, 0.25, 0], [C.cor1, 0.75, 0.62, 1.7], [C.cor3, 0.5, 0.88, 3.1]].forEach(([c, x, y, ph]) => {
      const xx = W * x + 12 * u * Math.sin(t * 0.9 + ph), yy = H * y + 10 * u * Math.cos(t * 0.7 + ph);
      const g = ctx.createRadialGradient(xx, yy, 0, xx, yy, Math.max(W, H) * 0.45); g.addColorStop(0, c + 'AA'); g.addColorStop(1, c + '00');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); });
    ctx.globalCompositeOperation = 'source-over';
  }
  function marca(ctx, x, y, u, a = 1, centro = true) {
    ctx.save(); ctx.globalAlpha *= a;
    if (IMG.logo) { const h = 9 * u, w = h * IMG.logo.width / IMG.logo.height; ctx.drawImage(IMG.logo, centro ? x - w / 2 : x, y - h / 2, w, h); }
    else txt(ctx, C.marca.toUpperCase(), x, y + 2 * u, IN(800)(5 * u), '#FFFFFF', centro ? 'center' : 'left');
    ctx.restore();
  }
  function vidro(ctx, x, y, w, h, u) { ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.10)'; rr(ctx, x, y, w, h, 3 * u); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }

  // cena 1 — capa: tudo visível no t=0, só respira
  function c1(ctx, t, lt, W, H, u) {
    marca(ctx, W / 2, H * 0.1, u);
    const s = 1 + 0.012 * Math.sin(t * 2.2);
    ctx.save(); ctx.translate(W / 2, H * 0.4); ctx.scale(s, s); ctx.translate(-W / 2, -H * 0.4);
    heading(ctx, { x: W * 0.08, y: H * 0.27, w: W * 0.84 }, [{ s: C.capa[0], f: IN(800), c: '#FFFFFF', at: -1 }, { s: C.capa[1], f: SER, k: 1.1, c: '#FFD9EC', at: -1 }], 9, 12 * u, 'rise', 'center');
    ctx.restore();
    txt(ctx, C.capaSub, W / 2, H * 0.53, IN(500)(fitSize(ctx, C.capaSub, IN(500), 3.6 * u, W * 0.8)), 'rgba(255,255,255,0.85)', 'center');
    if (IMG.prods[0]) { const im = IMG.prods[0], mh = H * 0.3, mw = mh * im.width / im.height; ctx.save(); shadow(ctx, 'rgba(0,0,0,0.4)', 40, 0, 20); ctx.drawImage(im, W / 2 - mw / 2, H * 0.6 + 1.2 * u * Math.sin(t * 1.6), mw, mh); ctx.restore(); }
    else { const bw = 60 * u, bh = 12 * u; ctx.save(); ctx.translate(W / 2, H * 0.78); const g = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0); g.addColorStop(0, C.cor1); g.addColorStop(1, C.cor2); ctx.fillStyle = g; rr(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.fill();
      txt(ctx, C.contato, 0, 1.6 * u, IN(700)(fitSize(ctx, C.contato, IN(700), 4.6 * u, bw * 0.85)), '#FFFFFF', 'center'); ctx.restore(); }
  }
  // cena 2 — gancho
  function c2(ctx, t, lt, W, H, u) {
    const cw = W * 0.86, ch = H * 0.3, cx = (W - cw) / 2, cy = H * 0.33; const p = ex(pr(lt, 0, 0.6));
    ctx.save(); ctx.globalAlpha *= p; ctx.translate(0, (1 - p) * 6 * u); vidro(ctx, cx, cy, cw, ch, u);
    heading(ctx, { x: cx + cw * 0.08, y: cy + ch * 0.18, w: cw * 0.84 }, [{ s: C.gancho[0], f: IN(800), c: '#FFFFFF', at: 0.2 }, { s: C.gancho[1], f: SER, k: 1.1, c: '#FFD9EC', at: 0.45 }], lt, 10 * u, 'blur', 'center');
    ctx.restore();
  }
  // cena 3 — destaques
  function c3(ctx, t, lt, W, H, u) {
    heading(ctx, { x: W * 0.08, y: H * 0.12, w: W * 0.84 }, [{ s: 'Por que a ' + C.marca, f: IN(800), c: '#FFFFFF', at: 0 }], lt, 7 * u, 'rise', 'center');
    C.destaques.forEach((d, i) => { const p = back(pr(lt, 0.4 + i * 0.45, 0.85 + i * 0.45)); if (p <= 0) return; const y = H * (0.3 + i * 0.17), w = W * 0.84, h = H * 0.13, x = (W - w) / 2;
      ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(clamp(p, 0, 1.1), clamp(p, 0, 1.1)); ctx.translate(-w / 2, -h / 2); vidro(ctx, 0, 0, w, h, u);
      ctx.fillStyle = [C.cor1, C.cor2, C.cor3][i % 3]; ctx.beginPath(); ctx.arc(h / 2, h / 2, h * 0.24, 0, 7); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = u * 0.9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(h * 0.4, h * 0.52); ctx.lineTo(h * 0.48, h * 0.6); ctx.lineTo(h * 0.62, h * 0.42); ctx.stroke();
      txt(ctx, d, h * 0.95, h * 0.6, IN(700)(fitSize(ctx, d, IN(700), 5 * u, w - h * 1.1)), '#FFFFFF'); ctx.restore(); });
  }
  // cena 4 — chamada final
  function c4(ctx, t, lt, W, H, u) {
    marca(ctx, W / 2, H * 0.2, u * 1.3, eo(pr(lt, 0, 0.5)));
    heading(ctx, { x: W * 0.08, y: H * 0.34, w: W * 0.84 }, [{ s: C.cta[0], f: IN(800), c: '#FFFFFF', at: 0.2 }, { s: C.cta[1], f: SER, k: 1.1, c: '#FFD9EC', at: 0.45 }], lt, 11 * u, 'rise', 'center');
    const bp = back(pr(lt, 0.9, 1.3)); if (bp > 0) { const bw = 62 * u, bh = 12 * u; ctx.save(); ctx.translate(W / 2, H * 0.66); ctx.scale(bp, bp); const g = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0); g.addColorStop(0, C.cor1); g.addColorStop(1, C.cor2); ctx.fillStyle = g; rr(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.fill();
      txt(ctx, C.contato, 0, 1.6 * u, IN(700)(fitSize(ctx, C.contato, IN(700), 4.8 * u, bw * 0.85)), '#FFFFFF', 'center');
      const sh = (lt - 1.6) / 0.9; if (sh > 0 && sh < 1) { ctx.save(); rr(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.clip(); const sx = lerp(-bw, bw, sh); const sg = ctx.createLinearGradient(sx - bw * 0.2, 0, sx + bw * 0.2, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.55)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sg; ctx.fillRect(-bw / 2, -bh / 2, bw, bh); ctx.restore(); }
      ctx.restore(); }
  }
  const FN = [c1, c2, c3, c4];
  function cena(ctx, t, k, W, H, u) { ctx.save(); FN[k](ctx, t, t - CENAS[k][0], W, H, u); ctx.restore(); }

  window.VIDEO = {
    async preparar(D) { if (D.logo) IMG.logo = await load(D.logo); for (const p of D.produtos || []) { const i = await load(p); if (i) IMG.prods.push(i); } },
    quadro(ctx, t, W, H) {
      const u = Math.min(W, H) / 100; fundo(ctx, t, W, H, u);
      for (let k = 0; k < CENAS.length; k++) { const [a, b] = CENAS[k]; if (t < a || t >= b) continue; const tr = 0.45;
        if (k > 0 && t < a + tr) { const p = eio((t - a) / tr);
          ctx.save(); ctx.globalAlpha = 1 - p; cena(ctx, t, k - 1, W, H, u); ctx.restore();
          ctx.save(); ctx.beginPath(); ctx.arc(W / 2, H / 2, p * Math.hypot(W, H) / 2, 0, 7); ctx.clip(); fundo(ctx, t, W, H, u); cena(ctx, t, k, W, H, u); ctx.restore();
        } else cena(ctx, t, k, W, H, u); }
    },
  };
})();
