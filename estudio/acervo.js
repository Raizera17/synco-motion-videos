// Prévias de estilos — adaptam-se ao formato (9:16, 1:1, 16:9). render(canvas, id, t), loop de 4 s.
const D = 4.0;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, p) => a + (b - a) * p;
const pr = (t, a, b) => clamp((t - a) / (b - a));
const eo = p => 1 - Math.pow(1 - clamp(p), 3);
const eio = p => { p = clamp(p); return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
const ex = p => { p = clamp(p); return p === 1 ? 1 : 1 - Math.pow(2, -10 * p); };
const back = p => { p = clamp(p); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
const spring = p => { p = clamp(p); return 1 - Math.exp(-6 * p) * Math.cos(12 * p); };
const outA = t => 1 - pr(t, D - 0.35, D);
function seeded(s) { return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
function rr(ctx, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function txt(ctx, s, x, y, font, color, align = 'left') { ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.fillText(s, x, y); }
function fitSize(ctx, s, fontFn, size, maxW) { let z = size; ctx.font = fontFn(z); while (z > 6 && ctx.measureText(s).width > maxW) { z *= 0.95; ctx.font = fontFn(z); } return z; }
function shadow(ctx, c, b, x, y) { ctx.shadowColor = c; ctx.shadowBlur = b; ctx.shadowOffsetX = x; ctx.shadowOffsetY = y; }
function noShadow(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; }

// ----- layout por formato -----
function layout(W, H) {
  const u = Math.min(W, H) / 100, o = W > H * 1.2 ? 'h' : H > W * 1.2 ? 'v' : 's';
  if (o === 'h') return { u, o, W, H, text: { x: 0.07 * W, y: 0.22 * H, w: 0.42 * W, h: 0.6 * H }, vis: { x: 0.52 * W, y: 0.1 * H, w: 0.42 * W, h: 0.8 * H }, base: 11 * u };
  if (o === 'v') return { u, o, W, H, text: { x: 0.08 * W, y: 0.13 * H, w: 0.84 * W, h: 0.3 * H }, vis: { x: 0.06 * W, y: 0.45 * H, w: 0.88 * W, h: 0.42 * H }, base: 10.5 * u };
  return { u, o, W, H, text: { x: 0.08 * W, y: 0.1 * H, w: 0.84 * W, h: 0.3 * H }, vis: { x: 0.12 * W, y: 0.44 * H, w: 0.76 * W, h: 0.48 * H }, base: 9 * u };
}
// desenha num espaço de design bw×bh encaixado no box
function inBox(ctx, box, bw, bh, fn) { const s = Math.min(box.w / bw, box.h / bh); ctx.save(); ctx.translate(box.x + (box.w - bw * s) / 2, box.y + (box.h - bh * s) / 2); ctx.scale(s, s); fn(s); ctx.restore(); }
// título em linhas: [{s, f:(size)=>font, k, c, at}], entrada: rise | pop | mask | blur
function heading(ctx, box, lines, t, base, entry = 'rise', align = 'left') {
  let y = box.y;
  lines.forEach(ln => {
    const size = fitSize(ctx, ln.s, ln.f, base * (ln.k || 1), box.w); y += size * (ln.gap || 1.08);
    const p = pr(t, ln.at, ln.at + 0.45); if (p <= 0) return; const x = align === 'center' ? box.x + box.w / 2 : box.x;
    ctx.save();
    if (entry === 'pop') { const q = back(p); ctx.translate(x, y - size * 0.35); ctx.scale(lerp(0.6, 1, q), lerp(0.6, 1, q)); ctx.globalAlpha *= clamp(p * 2); txt(ctx, ln.s, 0, size * 0.35, ln.f(size), ln.c, align); }
    else if (entry === 'mask') { ctx.beginPath(); ctx.rect(box.x - 20, y - size * 1.0, box.w + 40, size * 1.25); ctx.clip(); txt(ctx, ln.s, x, y + (1 - ex(p)) * size * 1.2, ln.f(size), ln.c, align); }
    else if (entry === 'blur') { ctx.filter = `blur(${(1 - eo(p)) * size * 0.12}px)`; ctx.globalAlpha *= eo(p); txt(ctx, ln.s, x, y, ln.f(size), ln.c, align); ctx.filter = 'none'; }
    else { ctx.globalAlpha *= eo(p); txt(ctx, ln.s, x, y + (1 - eo(p)) * size * 0.4, ln.f(size), ln.c, align); }
    ctx.restore(); ln._y = y; ln._size = size;
  });
  return y;
}
const SG = (w = 700) => s => `${w} ${s}px "Space Grotesk"`, IN = (w = 800) => s => `${w} ${s}px Inter`, SER = s => `italic ${s}px "Instrument Serif"`, MONO = s => `500 ${s}px "JetBrains Mono"`, ANT = s => `${s}px Anton`, ARC = s => `${s}px "Archivo Black"`, CAV = s => `700 ${s}px Caveat`, DMS = s => `italic ${s}px "DM Serif Display"`;
const ST = {};

// 1 — Motion 2D flat
ST.flat2d = (ctx, t, L) => {
  const { W, H } = L; ctx.fillStyle = '#FFF4E6'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  inBox(ctx, L.vis, 320, 340, () => {
    const b1 = back(pr(t, 0, 0.6)); ctx.fillStyle = '#FFC145'; ctx.beginPath(); ctx.arc(160, 175, 135 * b1 + 6 * Math.sin(t * 3), 0, 7); ctx.fill();
    ctx.fillStyle = '#FF6B4A'; ctx.beginPath(); ctx.arc(275, 50, 34 * back(pr(t, 0.2, 0.7)), 0, 7); ctx.fill();
    ctx.fillStyle = '#2E3A87'; ctx.beginPath(); ctx.arc(45, 300, 18 * back(pr(t, 0.3, 0.8)), 0, 7); ctx.fill();
    const pp = back(pr(t, 0.25, 0.85)); ctx.save(); ctx.translate(160, 175 + (1 - pp) * 220); ctx.rotate(-0.08 * (1 - pp) + 0.02 * Math.sin(t * 2));
    ctx.fillStyle = '#2E3A87'; rr(ctx, -62, -112, 124, 224, 18); ctx.fill(); ctx.fillStyle = '#FFF'; rr(ctx, -54, -100, 108, 200, 12); ctx.fill();
    [[-44, -80, 72, '#E9ECFF', 1.0], [-12, -48, 70, '#FF6B4A', 1.45], [-44, -16, 60, '#E9ECFF', 1.9]].forEach(([x, y, w, c, s]) => { const p = back(pr(t, s, s + 0.35)); if (p <= 0) return; ctx.save(); ctx.translate(x, y); ctx.scale(p, p); ctx.fillStyle = c; rr(ctx, 0, 0, w, 24, 10); ctx.fill(); ctx.restore(); });
    const cp = back(pr(t, 2.3, 2.7)); if (cp > 0) { ctx.save(); ctx.translate(0, 50); ctx.scale(cp, cp); ctx.fillStyle = '#21C17A'; ctx.beginPath(); ctx.arc(0, 0, 26, 0, 7); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-11, 1); ctx.lineTo(-3, 9); ctx.lineTo(12, -8); ctx.stroke(); ctx.restore(); }
    ctx.restore();
  });
  const lines = [{ s: 'Agende em', f: SG(), c: '#2E3A87', at: 0.5 }, { s: '1 minuto', f: SG(), k: 1.2, c: '#FF6B4A', at: 0.7 }, { s: 'direto pelo celular, sem fila', f: SG(500), k: 0.42, c: '#2E3A87', at: 1.2, gap: 1.9 }];
  heading(ctx, L.text, lines, t, L.base, 'rise'); const l2 = lines.at(1);
  if (l2._y) { ctx.font = SG()(l2._size); const w = ctx.measureText(l2.s).width; ctx.strokeStyle = '#FFC145'; ctx.lineWidth = l2._size * 0.14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(L.text.x, l2._y + l2._size * 0.22); ctx.lineTo(L.text.x + w * eo(pr(t, 1.0, 1.5)), l2._y + l2._size * 0.22); ctx.stroke(); }
};
// 2 — Tipografia cinética
ST.kinetic = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#0B0B0C'; ctx.fillRect(0, 0, W, H); const lime = '#E8FF3A', mw = W * 0.84;
  if (t < 2.2) {
    const words = [['SUA', 0.0, '#FFF'], ['MARCA', 0.55, lime], ['EM', 1.1, '#FFF'], ['MOVIMENTO', 1.55, '#FFF']];
    const size = fitSize(ctx, 'MOVIMENTO', ANT, L.o === 'h' ? 24 * u : 30 * u, mw); const lh = size * 1.02; const y0 = H / 2 - lh * (L.o === 'h' ? 1.0 : 1.5);
    words.forEach(([w, s, c], i) => { const p = ex(pr(t, s, s + 0.3)); if (p <= 0) return; const y = L.o === 'h' ? (i < 2 ? y0 : y0 + lh) : y0 + i * lh; const x = L.o === 'h' ? (i % 2 ? W * 0.08 + ctx.measureText('SUA ').width + 20 : W * 0.08) : W * 0.08;
      ctx.save(); ctx.globalAlpha = p; if (w === 'MOVIMENTO' && L.o !== 'h') { ctx.beginPath(); ctx.rect(x, y - lh, mw * eio(pr(t, 1.55, 2.0)), lh * 1.2); ctx.clip(); }
      ctx.translate(x, y); const sc = w === 'MARCA' ? lerp(1.5, 1, p) : 1; ctx.scale(sc, sc); txt(ctx, w, 0, 0, ANT(L.o === 'h' && w === 'MOVIMENTO' ? size * 0.9 : size), c); ctx.restore(); });
  } else {
    const p = ex(pr(t, 2.2, 2.6)); const size = fitSize(ctx, 'MOVIMENTO', ANT, 40 * u, W * 0.9);
    ctx.save(); ctx.translate(W / 2, H / 2); const s = lerp(3, 1, p); ctx.scale(s, s); ctx.globalAlpha = p; ctx.textBaseline = 'middle'; ctx.font = ANT(size); ctx.fillStyle = lime; ctx.textAlign = 'center'; ctx.fillText('MOVIMENTO', 0, 0); ctx.restore();
    const q = eo(pr(t, 2.7, 3.1)); ctx.globalAlpha = q * outA(t); txt(ctx, 'em 6 segundos.', W / 2, H / 2 + size * 0.85 + (1 - q) * 14, SER(size * 0.38), '#FFF', 'center');
    ctx.fillStyle = lime; ctx.fillRect(W / 2 - W * 0.25, H / 2 + size * 1.05, W * 0.5 * eo(pr(t, 2.9, 3.4)), Math.max(3, u * 0.7)); ctx.globalAlpha = 1;
  }
  const fl = Math.max(0, 1 - Math.abs(t - 2.2) / 0.08); if (fl > 0) { ctx.fillStyle = `rgba(232,255,58,${fl * 0.8})`; ctx.fillRect(0, 0, W, H); }
};
// 3 — Isométrico
function isoCube(ctx, x, y, w, h, cT, cL, cR) { const dx = w, dy = w / 2; ctx.fillStyle = cT; ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x + dx, y - h + dy); ctx.lineTo(x, y - h + 2 * dy); ctx.lineTo(x - dx, y - h + dy); ctx.closePath(); ctx.fill(); ctx.fillStyle = cL; ctx.beginPath(); ctx.moveTo(x - dx, y - h + dy); ctx.lineTo(x, y - h + 2 * dy); ctx.lineTo(x, y + 2 * dy); ctx.lineTo(x - dx, y + dy); ctx.closePath(); ctx.fill(); ctx.fillStyle = cR; ctx.beginPath(); ctx.moveTo(x + dx, y - h + dy); ctx.lineTo(x, y - h + 2 * dy); ctx.lineTo(x, y + 2 * dy); ctx.lineTo(x + dx, y + dy); ctx.closePath(); ctx.fill(); }
ST.iso = (ctx, t, L) => {
  const { W, H } = L; ctx.fillStyle = '#EAF2FF'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  ctx.strokeStyle = 'rgba(80,110,180,0.12)'; ctx.lineWidth = 1; const g = L.u * 8; for (let i = -30; i < 40; i++) { ctx.beginPath(); ctx.moveTo(i * g, 0); ctx.lineTo(i * g + H * 2, H); ctx.stroke(); ctx.beginPath(); ctx.moveTo(i * g + H * 2, 0); ctx.lineTo(i * g, H); ctx.stroke(); }
  inBox(ctx, L.vis, 400, 300, () => {
    const nodes = [[90, 170, 46, 0.1], [200, 95, 70, 0.35], [310, 170, 40, 0.6], [200, 235, 30, 0.85]]; const pos = nodes.map(([x, y]) => [x, y + 20]);
    [[0, 1], [1, 2], [0, 3], [3, 2]].forEach(([a, b], i) => { const p = eo(pr(t, 1.0 + i * 0.15, 1.5 + i * 0.15)); if (p <= 0) return; ctx.strokeStyle = '#4A6CF7'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -t * 30; ctx.beginPath(); ctx.moveTo(pos[a][0], pos[a][1]); ctx.lineTo(lerp(pos[a][0], pos[b][0], p), lerp(pos[a][1], pos[b][1], p)); ctx.stroke(); ctx.setLineDash([]); if (t > 1.8) { const q = ((t - 1.8) * 0.6 + i * 0.25) % 1; ctx.fillStyle = '#FF8A3D'; ctx.beginPath(); ctx.arc(lerp(pos[a][0], pos[b][0], q), lerp(pos[a][1], pos[b][1], q), 5, 0, 7); ctx.fill(); } });
    const pal = [['#7C9BFF', '#4A6CF7', '#2F4FD1'], ['#FFFFFF', '#C9D6FF', '#9DB2F7'], ['#FFB27A', '#FF8A3D', '#E46A1E'], ['#7EE2C3', '#2EC4A0', '#1A9C7E']];
    nodes.forEach(([x, y, h, s], i) => { const p = back(pr(t, s, s + 0.55)); if (p <= 0) return; const [a, b, c] = pal.at(i); isoCube(ctx, x, y - (1 - p) * 60 + 3 * Math.sin(t * 2 + i), 34, h * p, a, b, c); });
  });
  heading(ctx, L.text, [{ s: 'Tudo conectado', f: SG(), c: '#1C2B5A', at: 1.4 }, { s: 'loja · estoque · entrega', f: MONO, k: 0.4, c: '#4A6CF7', at: 1.7, gap: 1.8 }], t, L.base * 0.85);
};
// 4 — Infográfico de dados
ST.data = (ctx, t, L) => {
  const { W, H } = L; ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  const n = Math.round(87 * eio(pr(t, 0.9, 2.4)));
  heading(ctx, L.text, [{ s: 'Vendas por mês', f: SG(), k: 0.55, c: '#13293D', at: 0 }, { s: `+${n}%`, f: SG(), k: 1.7, c: '#13293D', at: 0.2 }, { s: 'de crescimento no semestre', f: SG(500), k: 0.36, c: '#7A8A99', at: 0.4, gap: 1.6 }], t, L.base);
  inBox(ctx, L.vis, 360, 260, () => {
    const vals = [0.32, 0.45, 0.4, 0.58, 0.66, 0.84], meses = ['J', 'F', 'M', 'A', 'M', 'J'];
    ctx.strokeStyle = '#DDE3E8'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(10, 230 - i * 55); ctx.lineTo(350, 230 - i * 55); ctx.stroke(); }
    vals.forEach((v, i) => { const p = back(pr(t, 0.3 + i * 0.12, 0.9 + i * 0.12)); const h = 190 * v * p; ctx.fillStyle = i === 5 ? '#0FA3B1' : '#B5E2E6'; rr(ctx, 22 + i * 55, 230 - h, 38, h, 6); ctx.fill(); txt(ctx, meses.at(i), 41 + i * 55, 252, MONO(12), '#7A8A99', 'center'); });
    const lp = eo(pr(t, 1.6, 2.8)); ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 360 * lp, 260); ctx.clip(); ctx.strokeStyle = '#F7A072'; ctx.lineWidth = 3; ctx.beginPath(); [[30, 180], [90, 160], [150, 168], [210, 128], [270, 108], [340, 60]].forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.restore();
    const dp = eio(pr(t, 2.0, 3.0)); ctx.lineWidth = 10; ctx.strokeStyle = '#EEF2F5'; ctx.beginPath(); ctx.arc(320, 30, 22, 0, 7); ctx.stroke(); ctx.strokeStyle = '#0FA3B1'; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(320, 30, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.72 * dp); ctx.stroke(); ctx.lineCap = 'butt';
  });
};
// 5 — Demo de produto
ST.ui = (ctx, t, L) => {
  const { W, H } = L; const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#F4F4F8'); g.addColorStop(1, '#E7E7F1'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  heading(ctx, L.text, [{ s: 'Pedidos que se', f: IN(800), c: '#1D1D3A', at: 0 }, { s: 'confirmam sozinhos.', f: SER, k: 1.05, c: '#5B5BD6', at: 0.25 }], t, L.base * 0.85, 'rise');
  inBox(ctx, L.vis, 460, 300, () => {
    const p = ex(pr(t, 0, 0.7)); const cam = 1 + 0.1 * eio(pr(t, 1.4, 2.2)) - 0.1 * eio(pr(t, 3.0, 3.6));
    ctx.save(); ctx.translate(230, 150); ctx.scale(cam, cam); ctx.translate(-230 + 30 * eio(pr(t, 1.4, 2.2)) - 30 * eio(pr(t, 3.0, 3.6)), -150 + (1 - p) * 120);
    shadow(ctx, 'rgba(40,40,90,0.18)', 30, 0, 14); ctx.fillStyle = '#FFF'; rr(ctx, 0, 0, 460, 290, 14); ctx.fill(); noShadow(ctx);
    ctx.fillStyle = '#F0F0F6'; rr(ctx, 0, 0, 460, 34, 14); ctx.fill(); ctx.fillRect(0, 20, 460, 14); ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(20 + i * 16, 17, 5, 0, 7); ctx.fill(); });
    ctx.fillStyle = '#F7F7FB'; ctx.fillRect(0, 34, 110, 256); for (let i = 0; i < 5; i++) { ctx.fillStyle = i === 1 ? '#5B5BD6' : '#DADAE6'; rr(ctx, 14, 52 + i * 26, i === 1 ? 82 : 70, 10, 5); ctx.fill(); }
    txt(ctx, 'Pedidos de hoje', 128, 66, SG()(17), '#1D1D3A');
    for (let i = 0; i < 4; i++) { const rp = eo(pr(t, 0.6 + i * 0.12, 1.0 + i * 0.12)); ctx.save(); ctx.globalAlpha *= rp; ctx.fillStyle = '#F7F7FB'; rr(ctx, 128, 82 + i * 40, 312, 32, 8); ctx.fill(); ctx.fillStyle = '#CFCFE0'; rr(ctx, 140, 93 + i * 40, 120, 10, 5); ctx.fill(); const done = i === 0 && t > 2.05; ctx.fillStyle = done ? '#21C17A' : '#FFE7B3'; rr(ctx, 358, 90 + i * 40, 70, 16, 8); ctx.fill(); txt(ctx, done ? 'pago' : 'pendente', 393, 102 + i * 40, SG(600)(10), done ? '#FFF' : '#8A5A00', 'center'); ctx.restore(); }
    ctx.restore();
    const cx = lerp(470, 393, eio(pr(t, 1.2, 1.9))), cy = lerp(320, 100, eio(pr(t, 1.2, 1.9))); const click = Math.max(0, 1 - Math.abs(t - 2.0) / 0.12);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1 - 0.15 * click, 1 - 0.15 * click); ctx.fillStyle = '#111'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 20); ctx.lineTo(5, 15); ctx.lineTo(9, 23); ctx.lineTo(12, 21); ctx.lineTo(8, 14); ctx.lineTo(15, 14); ctx.closePath(); ctx.stroke(); ctx.fill(); ctx.restore();
    const tp = back(pr(t, 2.3, 2.75)) * (1 - eo(pr(t, 3.4, 3.7))); if (tp > 0) { ctx.save(); ctx.translate(230, 300 - 30 * tp); ctx.globalAlpha *= clamp(tp); ctx.fillStyle = '#1D1D3A'; rr(ctx, -120, -20, 240, 40, 20); ctx.fill(); ctx.fillStyle = '#21C17A'; ctx.beginPath(); ctx.arc(-96, 0, 9, 0, 7); ctx.fill(); txt(ctx, 'Pagamento confirmado', -78, 5, SG(600)(14), '#FFF'); ctx.restore(); }
  });
};
// 6 — Documento / HUD
ST.hud = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#F3EFE7'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t); const ink = '#1A1A1A', acc = '#1F6F5C', m = 5 * u;
  const lab = '// 03 — processo'; txt(ctx, lab.slice(0, Math.round(lab.length * pr(t, 0.1, 0.9))), m, m + 2 * u, MONO(2.6 * u), '#6B6B6B');
  txt(ctx, `ESTÚDIO 00:00:${String(Math.floor(t)).padStart(2, '0')}:${String(Math.floor(t * 30) % 30).padStart(2, '0')}`, W - m, m + 2 * u, MONO(2.6 * u), '#6B6B6B', 'right');
  ctx.fillStyle = '#DDD6C8'; ctx.fillRect(m, H - m, W - 2 * m, 2); ctx.fillStyle = ink; ctx.fillRect(m, H - m, (W - 2 * m) * (t / D), 2);
  inBox(ctx, L.vis, 320, 300, () => {
    const R = 95 * eo(pr(t, 0, 0.9)), cx = 160, cy = 150, rot = t * 0.6;
    for (let i = 0; i < 26; i++) for (let j = 0; j < 14; j++) { const th = i / 26 * Math.PI * 2 + rot, ph = j / 13 * Math.PI; const x = Math.sin(ph) * Math.cos(th), y = Math.cos(ph), z = Math.sin(ph) * Math.sin(th); const yy = y * 0.94 - z * 0.34, zz = y * 0.34 + z * 0.94; const a = (zz + 1) / 2; ctx.fillStyle = `rgba(26,26,26,${0.12 + 0.75 * a})`; ctx.beginPath(); ctx.arc(cx + x * R, cy + yy * R, 1 + 1.6 * a, 0, 7); ctx.fill(); }
    ctx.strokeStyle = 'rgba(31,111,92,0.6)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(cx, cy, R * 1.45, R * 0.4, -0.25, 0, Math.PI * 2 * eo(pr(t, 0.6, 1.4))); ctx.stroke();
    const oa = t * 1.4, ox = Math.cos(oa) * R * 1.45, oy = Math.sin(oa) * R * 0.4; ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(cx + ox * 0.969 + oy * 0.247, cy - ox * 0.247 + oy * 0.969, 6 * eo(pr(t, 1, 1.4)), 0, 7); ctx.fill();
  });
  const y = heading(ctx, L.text, [{ s: 'O pedido chega', f: IN(800), c: ink, at: 0.5 }, { s: 'e já sai pronto', f: IN(800), c: ink, at: 0.75 }, { s: 'sem ninguém digitar.', f: SER, k: 1.1, c: acc, at: 1.2 }], t, L.base * 0.85);
  const cp = back(pr(t, 1.9, 2.4)); if (cp > 0) { const cw = Math.min(L.text.w, 46 * u), ch = 9 * u; ctx.save(); ctx.globalAlpha *= clamp(cp); ctx.translate(L.text.x, y + 3 * u + (1 - cp) * 2 * u); ctx.fillStyle = '#FFF'; rr(ctx, 0, 0, cw, ch, 0.8 * u); ctx.fill(); ctx.strokeStyle = '#DDD6C8'; ctx.stroke(); txt(ctx, 'pedido_4812.json', 2 * u, 3.4 * u, MONO(2.2 * u), '#6B6B6B'); [['nota emitida', 2.4], ['estoque baixado', 2.7]].forEach(([s, tt], i) => { const on = t > tt; ctx.fillStyle = on ? acc : '#DDD6C8'; ctx.fillRect(2 * u + i * cw * 0.48, 5.3 * u, 1.8 * u, 1.8 * u); txt(ctx, s, 4.6 * u + i * cw * 0.48, 7 * u, `500 ${2.2 * u}px Inter`, ink); }); ctx.restore(); }
};
// 7 — Traço desenhado
function sketchPath(ctx, pts, prog, seed) { const r = seeded(seed); const segs = []; let Lt = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segs.push(d); Lt += d; } let rem = Lt * clamp(prog); if (rem <= 0) return; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length && rem > 0; i++) { const d = segs.at(i - 1), f = Math.min(1, rem / d); const [ax, ay] = pts[i - 1], [bx, by] = pts[i]; ctx.quadraticCurveTo((ax + bx) / 2 + (r() - 0.5) * 2.2, (ay + by) / 2 + (r() - 0.5) * 2.2, lerp(ax, bx, f), lerp(ay, by, f)); rem -= d; } ctx.stroke(); }
function circlePts(cx, cy, r, n = 40, a0 = 0) { return Array.from({ length: n + 1 }, (_, i) => [cx + r * Math.cos(a0 + i / n * Math.PI * 2.08), cy + r * Math.sin(a0 + i / n * Math.PI * 2.08)]); }
ST.whiteboard = (ctx, t, L) => {
  const { W, H } = L; ctx.fillStyle = '#FDFDFB'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  const vb = L.o === 'h' ? { x: 0.06 * W, y: 0.1 * H, w: 0.88 * W, h: 0.58 * H } : L.vis;
  inBox(ctx, vb, 520, 220, () => {
    ctx.strokeStyle = '#222'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    sketchPath(ctx, circlePts(70, 100, 48, 40, Math.PI * 0.7), eo(pr(t, 0.1, 0.8)), 3); sketchPath(ctx, [[50, 146], [50, 175], [90, 175], [90, 146]], eo(pr(t, 0.7, 1.0)), 5); sketchPath(ctx, [[54, 186], [86, 186]], eo(pr(t, 0.95, 1.1)), 6); sketchPath(ctx, [[58, 100], [70, 78], [82, 100]], eo(pr(t, 0.9, 1.2)), 7);
    [[70, 32, 70, 14], [120, 55, 134, 42], [20, 55, 6, 42]].forEach(([a, b, c, d], i) => sketchPath(ctx, [[a, b], [c, d]], eo(pr(t, 1.1 + i * 0.08, 1.3 + i * 0.08)), 11 + i));
    ctx.strokeStyle = '#E4572E'; sketchPath(ctx, [[150, 110], [210, 100], [280, 110]], eo(pr(t, 1.3, 1.8)), 20); sketchPath(ctx, [[264, 96], [282, 110], [264, 124]], eo(pr(t, 1.75, 1.95)), 21);
    ctx.strokeStyle = '#222'; sketchPath(ctx, [[320, 40], [500, 42], [498, 180], [322, 178], [320, 40]], eo(pr(t, 1.8, 2.5)), 30);
    ctx.strokeStyle = '#2E86AB'; sketchPath(ctx, [[338, 160], [380, 130], [415, 142], [475, 70]], eo(pr(t, 2.4, 2.9)), 31); sketchPath(ctx, [[460, 68], [476, 68], [476, 84]], eo(pr(t, 2.85, 3.0)), 32);
  });
  const tb = L.o === 'h' ? { x: 0.1 * W, y: 0.7 * H, w: 0.8 * W, h: 0.2 * H } : L.text; const size = fitSize(ctx, 'ideia  →  resultado', CAV, L.base * 1.15, tb.w); const wp = pr(t, 1.0, 2.6);
  ctx.save(); ctx.beginPath(); ctx.rect(tb.x, tb.y, tb.w * wp, size * 1.6); ctx.clip(); txt(ctx, 'ideia  →  resultado', tb.x + tb.w / 2, tb.y + size * 1.1, CAV(size), '#222', 'center'); ctx.restore();
};
// 8 — Colagem (12 fps)
ST.collage = (ctx, tt, L) => {
  const t = Math.floor(tt * 12) / 12, { W, H, u } = L; const r = seeded(99); ctx.fillStyle = '#D9C4A0'; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < W * H / 260; i++) { ctx.fillStyle = `rgba(90,60,20,${r() * 0.07})`; ctx.fillRect(r() * W, r() * H, 2, 2); }
  ctx.globalAlpha = outA(tt); const boil = k => (seeded(Math.floor(tt * 12) + k)() - 0.5) * 0.03;
  inBox(ctx, L.vis, 240, 240, () => { const hp = back(pr(t, 0.1, 0.6)); ctx.save(); ctx.translate(120, 120); ctx.scale(hp, hp); ctx.fillStyle = '#E94F37'; ctx.beginPath(); ctx.arc(0, 0, 105, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let y = -100; y < 100; y += 9) for (let x = -100; x < 100; x += 9) if (x * x + y * y < 10000) { ctx.beginPath(); ctx.arc(x, y, 2.2 * (0.4 + (x + y + 200) / 400), 0, 7); ctx.fill(); } ctx.restore();
    const sp = back(pr(t, 1.9, 2.3)); if (sp > 0) { ctx.save(); ctx.translate(195, 205); ctx.rotate(-0.25 + boil(9)); ctx.scale(sp, sp); ctx.strokeStyle = '#1E1E1E'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 40, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 33, 0, 7); ctx.stroke(); txt(ctx, 'EDIÇÃO', 0, -2, ANT(14), '#1E1E1E', 'center'); txt(ctx, 'Nº 01', 0, 15, ANT(12), '#1E1E1E', 'center'); ctx.restore(); }
    if (t > 2.3) { ctx.save(); ctx.translate(60, 10); ctx.rotate(0.5); ctx.fillStyle = 'rgba(255,250,220,0.75)'; ctx.fillRect(-40, -12, 80, 24); ctx.restore(); } });
  const tb = L.text, base = L.base * 1.1; const items = [['FEITO', ANT, '#F5EFE0', '#1E1E1E', 0.4, -0.03], ['À MÃO,', ANT, '#1E1E1E', '#F5EFE0', 0.7, 0.025], ['com alma.', DMS, '#F5EFE0', '#1E1E1E', 1.0, -0.02]];
  let y = tb.y; items.forEach(([s, f, bg, fg, st, rot], k) => { const size = fitSize(ctx, s, f, base, tb.w * 0.85); const sh = size * 1.25; const p = eo(pr(t, st, st + 0.4)); if (p > 0) { ctx.save(); ctx.translate(tb.x - 2 * u - (1 - p) * W, y); ctx.rotate(rot + boil(k)); shadow(ctx, 'rgba(0,0,0,0.25)', 8, 3, 4); ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(0, 0); const sw = tb.w * 0.95; for (let x = 0; x <= sw; x += 12) ctx.lineTo(x, (seeded(k * 100 + x)() - 0.5) * 6); ctx.lineTo(sw, sh); for (let x = sw; x >= 0; x -= 12) ctx.lineTo(x, sh + (seeded(k * 100 + x + 7)() - 0.5) * 6); ctx.closePath(); ctx.fill(); noShadow(ctx); if (t >= st + 0.3) txt(ctx, s, 3 * u, sh * 0.8, f(size), fg); ctx.restore(); } y += sh + 1.5 * u; });
};
// 9 — Lançamento
ST.launch = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#07070A'; ctx.fillRect(0, 0, W, H);
  if (t < 1.1) { const p = ex(pr(t, 0, 0.35)), o = 1 - eo(pr(t, 0.85, 1.1)); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(lerp(0.85, 1, p), lerp(0.85, 1, p)); ctx.globalAlpha = p * o; ctx.textBaseline = 'middle'; txt(ctx, 'Novo.', 0, 0, IN(800)(24 * u), '#FFF', 'center'); ctx.restore(); }
  else { const A = outA(t); const gp = eo(pr(t, 1.1, 1.8)); const gr = ctx.createRadialGradient(W / 2, H * 0.47, 10, W / 2, H * 0.47, Math.max(W, H) * 0.5); gr.addColorStop(0, `rgba(120,90,255,${0.55 * gp})`); gr.addColorStop(1, 'rgba(120,90,255,0)'); ctx.globalAlpha = A; ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    const box = { x: W * 0.08, y: H * 0.2, w: W * 0.84, h: H * 0.55 }; const cp = ex(pr(t, 1.1, 1.7));
    inBox(ctx, box, 320, 190, () => { ctx.save(); ctx.translate(160, 95 + (1 - cp) * 60); ctx.rotate((1 - cp) * 0.12); ctx.globalAlpha = A * cp; shadow(ctx, 'rgba(120,90,255,0.6)', 40, 0, 0); const cg = ctx.createLinearGradient(-150, -86, 150, 86); cg.addColorStop(0, '#2A2540'); cg.addColorStop(1, '#141220'); ctx.fillStyle = cg; rr(ctx, -150, -86, 300, 172, 18); ctx.fill(); noShadow(ctx); ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; rr(ctx, -150, -86, 300, 172, 18); ctx.stroke();
      txt(ctx, 'Produto X', -126, -40, IN(800)(28), '#FFF'); txt(ctx, 'agora em todo lugar', -126, -14, SER(20), '#B9A8FF');
      ['rápido', 'seguro', 'sem código'].forEach((f, i) => { const fp = back(pr(t, 1.9 + i * 0.2, 2.3 + i * 0.2)); if (fp <= 0) return; ctx.save(); ctx.translate(-126 + i * 92, 38); ctx.scale(fp, fp); ctx.fillStyle = 'rgba(185,168,255,0.16)'; rr(ctx, 0, -14, 84, 28, 14); ctx.fill(); txt(ctx, f, 42, 5, IN(600)(13), '#E4DCFF', 'center'); ctx.restore(); }); ctx.restore(); });
    const sp = eo(pr(t, 2.8, 3.2)); ctx.globalAlpha = A * sp; txt(ctx, 'disponível hoje · link na bio', W / 2, H * 0.86, MONO(2.8 * u), '#9A93B8', 'center'); }
  const fl = Math.max(0, 1 - Math.abs(t - 1.1) / 0.07); if (fl > 0) { ctx.globalAlpha = fl; ctx.fillStyle = '#FFF'; ctx.fillRect(0, 0, W, H); }
};
// 10 — Minimal suíço
ST.swiss = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#FAFAF7'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t); const red = '#E63312', ink = '#111';
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1; for (let i = 1; i < 8; i++) { const p = eo(pr(t, i * 0.04, 0.5 + i * 0.04)); ctx.beginPath(); ctx.moveTo(i * W / 8, 0); ctx.lineTo(i * W / 8, H * p); ctx.stroke(); }
  const bp = eio(pr(t, 0.3, 0.9)); const blk = L.o === 'h' ? { x: 0, y: 0, w: W * 0.37, h: H } : { x: 0, y: 0, w: W, h: H * 0.4 };
  ctx.fillStyle = red; if (L.o === 'h') ctx.fillRect(0, 0, blk.w * bp, H); else ctx.fillRect(0, 0, W, blk.h * bp);
  const np = ex(pr(t, 0.7, 1.1)); const ns = fitSize(ctx, '01', IN(800), blk.h * 0.7, blk.w * 0.8); ctx.save(); ctx.beginPath(); ctx.rect(blk.x, blk.y, blk.w, blk.h); ctx.clip(); txt(ctx, '01', blk.x + 4 * u, blk.y + blk.h - 4 * u + (1 - np) * ns, IN(800)(ns), '#FAFAF7'); ctx.restore();
  const tb = L.o === 'h' ? { x: W * 0.42, y: H * 0.1, w: W * 0.52 } : { x: W * 0.08, y: H * 0.44, w: W * 0.84 };
  heading(ctx, tb, [{ s: 'Menos', f: IN(800), c: ink, at: 1.0 }, { s: 'ruído,', f: IN(800), c: ink, at: 1.18 }, { s: 'mais', f: IN(800), c: ink, at: 1.36 }, { s: 'clareza.', f: IN(800), c: red, at: 1.54 }], t, L.o === 'h' ? 13 * u : L.o === 'v' ? 15 * u : 10 * u, 'mask');
  const mp = eo(pr(t, 2.1, 2.5)); ctx.globalAlpha = outA(t) * mp; const fy = H - 6 * u; txt(ctx, 'ESTÚDIO NORTE', tb.x, fy, `600 ${2.6 * u}px Inter`, ink); txt(ctx, '2026 / 01', W - 5 * u, fy, MONO(2.6 * u), ink, 'right'); ctx.fillStyle = ink; ctx.fillRect(tb.x, fy + 1.4 * u, (W - 5 * u - tb.x) * eio(pr(t, 2.2, 2.9)), 2);
};
// 11 — Gradiente tech
ST.gradient = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#0D0B1E'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'lighter';
  [['#6C3CF5', 0.28, 0.3, 0], ['#FF4FA3', 0.72, 0.66, 1.7], ['#2BD1FF', 0.56, 0.22, 3.1]].forEach(([c, x, y, ph]) => { const xx = W * x + 10 * u * Math.sin(t * 1.2 + ph), yy = H * y + 8 * u * Math.cos(t * 0.9 + ph); const g = ctx.createRadialGradient(xx, yy, 0, xx, yy, Math.max(W, H) * 0.42); g.addColorStop(0, c + 'CC'); g.addColorStop(1, c + '00'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); });
  ctx.globalCompositeOperation = 'source-over'; const A = outA(t); ctx.globalAlpha = A;
  const cw = Math.min(W * 0.82, 120 * u), ch = Math.min(H * 0.5, cw * 0.62), cx = (W - cw) / 2, cy = (H - ch) / 2; const cp = ex(pr(t, 0.3, 0.9));
  ctx.save(); ctx.globalAlpha = A * cp; ctx.translate(0, (1 - cp) * 8 * u); ctx.save(); rr(ctx, cx, cy, cw, ch, 3 * u); ctx.clip(); ctx.filter = `blur(${4 * u}px)`; ctx.drawImage(ctx.canvas, 0, -(1 - cp) * 8 * u); ctx.filter = 'none'; ctx.fillStyle = 'rgba(25,12,60,0.28)'; ctx.fillRect(cx, cy, cw, ch); ctx.restore();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1; rr(ctx, cx, cy, cw, ch, 3 * u); ctx.stroke();
  heading(ctx, { x: cx + cw * 0.08, y: cy + ch * 0.12, w: cw * 0.84 }, [{ s: 'Automatize', f: IN(800), c: '#FFF', at: 0.8 }, { s: 'o trabalho repetitivo.', f: SER, k: 0.8, c: '#E9DBFF', at: 1.1 }], t, ch * 0.24, 'blur', 'center');
  const bp = back(pr(t, 1.6, 2.0)); if (bp > 0) { const bw = cw * 0.42, bh = ch * 0.18; ctx.save(); ctx.translate(W / 2, cy + ch * 0.8); ctx.scale(bp, bp); const bg = ctx.createLinearGradient(-bw / 2, 0, bw / 2, 0); bg.addColorStop(0, '#6C3CF5'); bg.addColorStop(1, '#FF4FA3'); ctx.fillStyle = bg; rr(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.fill(); txt(ctx, 'Começar grátis', 0, bh * 0.15, IN(700)(bh * 0.4), '#FFF', 'center'); const sh = (t - 2.2) / 0.9; if (sh > 0 && sh < 1) { ctx.save(); rr(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.clip(); const sx = lerp(-bw, bw, sh); const sg = ctx.createLinearGradient(sx - bw * 0.2, 0, sx + bw * 0.2, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.6)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sg; ctx.fillRect(-bw / 2, -bh / 2, bw, bh); ctx.restore(); } ctx.restore(); }
  ctx.restore();
  // grão sutil para evitar faixas
  const r = seeded(Math.floor(t * 15) + 3); ctx.globalAlpha = 0.05; for (let i = 0; i < W * H / 300; i++) { ctx.fillStyle = r() > 0.5 ? '#fff' : '#000'; ctx.fillRect(r() * W, r() * H, 1.5, 1.5); } ctx.globalAlpha = 1;
};
// 12 — Neo-brutalismo
ST.brutal = (ctx, t, L) => {
  const { W, H } = L; ctx.fillStyle = '#FFE14D'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  const box = (x, y, w, h, fill, off, rot = 0) => { ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot); ctx.fillStyle = '#111'; ctx.fillRect(-w / 2 + off, -h / 2 + off, w, h); ctx.fillStyle = fill; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.lineWidth = 4; ctx.strokeStyle = '#111'; ctx.strokeRect(-w / 2, -h / 2, w, h); ctx.restore(); };
  const V = L.o !== 'h'; const area = { x: W * 0.06, y: H * 0.08, w: W * 0.88, h: H * 0.84 };
  inBox(ctx, area, V ? 360 : 600, V ? 560 : 320, () => {
    const p1 = spring(pr(t, 0, 0.8)); ctx.save(); ctx.translate(0, (1 - p1) * -300); box(10, 20, 340, 170, '#FFF', 10); txt(ctx, 'OFERTA', 34, 112, ARC(64), '#111'); txt(ctx, 'de lançamento', 36, 152, SG()(24), '#111'); ctx.restore();
    const p2 = spring(pr(t, 0.7, 1.4)); if (p2 > 0) { ctx.save(); ctx.translate(V ? 250 : 470, V ? 250 : 110); ctx.rotate(0.12 + (1 - p2) * 0.8); ctx.scale(p2, p2); box(-90, -60, 180, 120, '#FF5C8A', 8); txt(ctx, '-40%', 0, 16, ARC(54), '#111', 'center'); ctx.restore(); }
    const press = t > 2.1 && t < 2.35; const p3 = back(pr(t, 1.3, 1.7)); if (p3 > 0) { const bx = 10 + (press ? 6 : 0), by = (V ? 360 : 240) + (press ? 6 : 0); ctx.save(); ctx.globalAlpha *= clamp(p3); box(bx, by, 250, 60, '#5CE1E6', press ? 2 : 8); txt(ctx, 'QUERO AGORA →', bx + 125, by + 37, SG()(20), '#111', 'center'); ctx.restore(); }
    [['SÓ HOJE', V ? 90 : 400, V ? 480 : 230, -0.08, 1.6], ['FRETE 0', V ? 250 : 520, V ? 500 : 285, 0.1, 1.8]].forEach(([s, x, y, r, st]) => { const p = back(pr(t, st, st + 0.35)); if (p <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.scale(p, p); box(-60, -20, 120, 40, '#FFF', 5); txt(ctx, s, 0, 7, SG()(17), '#111', 'center'); ctx.restore(); });
  });
  ctx.save(); ctx.translate(W - L.u * 8, L.u * 8); ctx.rotate(t * 1.5); ctx.fillStyle = '#111'; ctx.beginPath(); for (let i = 0; i < 16; i++) { const r2 = (i % 2 ? 10 : 24) * L.u / 3.6; ctx.lineTo(Math.cos(i / 16 * Math.PI * 2) * r2, Math.sin(i / 16 * Math.PI * 2) * r2); } ctx.closePath(); ctx.fill(); ctx.restore();
};
// 13 — 3D suave
function sphere(ctx, x, y, r, c1, c2) { const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r); g.addColorStop(0, c1); g.addColorStop(1, c2); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
ST.soft3d = (ctx, t, L) => {
  const { W, H, u } = L; const bg = ctx.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#F6E9FF'); bg.addColorStop(1, '#E3F1FF'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  inBox(ctx, L.vis, 300, 300, () => {
    [[160, 140, 70, '#B9A4FF', 0], [255, 230, 38, '#FF9EC7', 0.25], [70, 235, 30, '#8FD3FF', 0.45], [250, 60, 22, '#FFD59E', 0.6]].forEach(([x, y, r, c, s], i) => { const p = back(pr(t, s, s + 0.7)); if (p <= 0) return; const bob = 6 * Math.sin(t * 2 + i * 1.3); ctx.fillStyle = `rgba(90,70,160,${0.12 * clamp(p)})`; ctx.beginPath(); ctx.ellipse(x, y + r + 22, r * 0.8, r * 0.16, 0, 0, 7); ctx.fill(); sphere(ctx, x, y + bob - (1 - p) * 80, r * p, '#FFF', c); });
    const tp = back(pr(t, 0.4, 1.1)); if (tp > 0) { ctx.save(); ctx.translate(70, 80 + 5 * Math.sin(t * 1.6)); ctx.rotate(t * 0.8); ctx.scale(tp, tp * (0.55 + 0.15 * Math.sin(t * 1.2))); ctx.lineWidth = 18; const tg = ctx.createLinearGradient(-40, -40, 40, 40); tg.addColorStop(0, '#FFF'); tg.addColorStop(1, '#7FE0C2'); ctx.strokeStyle = tg; ctx.beginPath(); ctx.arc(0, 0, 34, 0, 7); ctx.stroke(); ctx.restore(); }
  });
  const y = heading(ctx, L.text, [{ s: 'Leve,', f: IN(800), k: 1.2, c: '#2B1F4F', at: 0.9 }, { s: 'como deve ser.', f: SER, k: 0.95, c: '#7A5CF0', at: 1.2 }], t, L.base);
  const bp = back(pr(t, 1.8, 2.2)); if (bp > 0) { const bw = 26 * u, bh = 8 * u; ctx.save(); ctx.translate(L.text.x + bw / 2, y + 7 * u); ctx.scale(bp, bp); shadow(ctx, 'rgba(122,92,240,0.35)', 18, 0, 8); ctx.fillStyle = '#FFF'; rr(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.fill(); noShadow(ctx); txt(ctx, 'Conhecer', 0, bh * 0.15, IN(700)(bh * 0.38), '#2B1F4F', 'center'); ctx.restore(); }
};

// ================= novos estilos =================
// 14 — Line art contínua
ST.lineart = (ctx, t, L) => {
  const { W, H } = L; ctx.fillStyle = '#F7F3EC'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  inBox(ctx, L.vis, 320, 300, () => {
    // uma linha só: chão → xícara com vapor → coração
    const pts = []; const add = (x, y) => pts.push([x, y]);
    add(0, 250); add(40, 250); add(105, 140); add(140, 195); add(195, 95); add(235, 160);
    for (let i = 0; i <= 40; i++) { const a = Math.PI / 2 + i / 40 * Math.PI * 2; add(250 + Math.cos(a) * 32, 62 + Math.sin(a) * 32); }
    add(250, 160); add(275, 210); add(300, 250); add(320, 250);
    const p = eio(pr(t, 0.1, 2.6)); let Lt = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); Lt += d; }
    const draw = (off, col, w) => { let rem = Lt * p; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(pts[0][0] + off, pts[0][1] + off); for (let i = 1; i < pts.length && rem > 0; i++) { const f = Math.min(1, rem / seg.at(i - 1)); ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], f) + off, lerp(pts[i - 1][1], pts[i][1], f) + off); rem -= seg.at(i - 1); } ctx.stroke(); };
    draw(6, '#E8A87C', 2); draw(0, '#1D2B2A', 3);
  });
  heading(ctx, L.text, [{ s: 'Uma pausa', f: s => `300 ${s}px Inter`, c: '#1D2B2A', at: 0.6 }, { s: 'bem desenhada.', f: SER, k: 1.1, c: '#C26A3D', at: 0.9 }], t, L.base);
};
// 15 — Pixel art (renderizado em baixa resolução)
const _pix = document.createElement('canvas');

// fonte pixel 5x7 desenhada em blocos (nítida em qualquer tamanho)
const PXF = { A: '01110 10001 10001 11111 10001 10001 10001', B: '11110 10001 10001 11110 10001 10001 11110', C: '01111 10000 10000 10000 10000 10000 01111', D: '11110 10001 10001 10001 10001 10001 11110', E: '11111 10000 10000 11110 10000 10000 11111', F: '11111 10000 10000 11110 10000 10000 10000', G: '01111 10000 10000 10011 10001 10001 01111', H: '10001 10001 10001 11111 10001 10001 10001', I: '11111 00100 00100 00100 00100 00100 11111', J: '00111 00010 00010 00010 00010 10010 01100', K: '10001 10010 10100 11000 10100 10010 10001', L: '10000 10000 10000 10000 10000 10000 11111', M: '10001 11011 10101 10101 10001 10001 10001', N: '10001 11001 10101 10011 10001 10001 10001', O: '01110 10001 10001 10001 10001 10001 01110', P: '11110 10001 10001 11110 10000 10000 10000', Q: '01110 10001 10001 10001 10101 10010 01101', R: '11110 10001 10001 11110 10100 10010 10001', S: '01111 10000 10000 01110 00001 00001 11110', T: '11111 00100 00100 00100 00100 00100 00100', U: '10001 10001 10001 10001 10001 10001 01110', V: '10001 10001 10001 10001 10001 01010 00100', W: '10001 10001 10001 10101 10101 10101 01010', X: '10001 10001 01010 00100 01010 10001 10001', Y: '10001 10001 01010 00100 00100 00100 00100', Z: '11111 00001 00010 00100 01000 10000 11111', '0': '01110 10011 10101 10101 10101 11001 01110', '1': '00100 01100 00100 00100 00100 00100 01110', '2': '01110 10001 00001 00010 00100 01000 11111', '3': '11110 00001 00001 01110 00001 00001 11110', '4': '00010 00110 01010 10010 11111 00010 00010', '5': '11111 10000 11110 00001 00001 10001 01110', '6': '00110 01000 10000 11110 10001 10001 01110', '7': '11111 00001 00010 00100 01000 01000 01000', '8': '01110 10001 10001 01110 10001 10001 01110', '9': '01110 10001 10001 01111 00001 00010 01100', '!': '00100 00100 00100 00100 00100 00000 00100', '%': '11001 11010 00010 00100 01000 01011 10011', '-': '00000 00000 00000 11111 00000 00000 00000', '.': '00000 00000 00000 00000 00000 00000 00100', ':': '00000 00100 00000 00000 00000 00100 00000', '?': '01110 10001 00001 00010 00100 00000 00100', ' ': '00000 00000 00000 00000 00000 00000 00000' };
const PXACC = { 'Á': ['A', 'acute'], 'À': ['A', 'grave'], 'Â': ['A', 'circ'], 'Ã': ['A', 'tilde'], 'É': ['E', 'acute'], 'Ê': ['E', 'circ'], 'Í': ['I', 'acute'], 'Ó': ['O', 'acute'], 'Ô': ['O', 'circ'], 'Õ': ['O', 'tilde'], 'Ú': ['U', 'acute'], 'Ç': ['C', 'ced'] };
const PXMARK = { acute: [[2, -2], [3, -3]], grave: [[2, -2], [1, -3]], circ: [[1, -2], [2, -3], [3, -2]], tilde: [[0, -2], [1, -3], [2, -2], [3, -3]], ced: [[2, 7], [1, 8]] };
function pxWidth(str, b) { return str.length * 6 * b - b; }
function pxText(ctx, str, x, y, b, color, shadow) { str = str.toUpperCase(); const draw = (ox, oy, col) => { ctx.fillStyle = col; let cx = x;
    for (const ch of str) { const acc = PXACC[ch]; const g = PXF[acc ? acc[0] : ch] || PXF[' ']; const rows = g.split(' ');
      rows.forEach((row, r) => { for (let c = 0; c < 5; c++) if (row[c] === '1') ctx.fillRect(Math.round(cx + c * b + ox), Math.round(y + r * b + oy), Math.ceil(b), Math.ceil(b)); });
      if (acc) PXMARK[acc[1]].forEach(([c, r]) => ctx.fillRect(Math.round(cx + c * b + ox), Math.round(y + r * b + oy), Math.ceil(b), Math.ceil(b)));
      cx += 6 * b; } };
  if (shadow) draw(0, b, shadow); draw(0, 0, color); }
ST.pixel = (ctx, t, L) => {
  const { W, H } = L; const S = Math.max(4, Math.round(Math.min(W, H) / 90)); const w = Math.ceil(W / S), h = Math.ceil(H / S); _pix.width = w; _pix.height = h; const g = _pix.getContext('2d'); g.imageSmoothingEnabled = false;
  const tf = Math.floor(t * 8) / 8; g.fillStyle = '#1B1440'; g.fillRect(0, 0, w, h);
  const r = seeded(4); for (let i = 0; i < 40; i++) { g.fillStyle = (Math.floor(tf * 4 + i) % 3) ? '#5A4B9E' : '#FFFFFF'; g.fillRect(Math.floor(r() * w), Math.floor(r() * h * 0.6), 1, 1); }
  g.fillStyle = '#2E8B57'; g.fillRect(0, Math.floor(h * 0.8), w, h); g.fillStyle = '#3FBF6F'; for (let x = 0; x < w; x += 4) g.fillRect(x, Math.floor(h * 0.8), 2, 1);
  const cx = Math.floor(w / 2), base = Math.floor(h * 0.8); const jump = Math.abs(Math.sin(tf * Math.PI * 1.5)); const by = Math.floor(base - 18 - jump * h * 0.14);
  g.fillStyle = '#FF5A5A'; g.fillRect(cx - 6, by, 12, 4); g.fillRect(cx - 4, by - 2, 9, 2); g.fillStyle = '#FFD7A8'; g.fillRect(cx - 5, by + 4, 10, 5); g.fillStyle = '#3B5BDB'; g.fillRect(cx - 6, by + 9, 12, 6); g.fillStyle = '#7A3E1D'; g.fillRect(cx - 6, by + 15, 4, 3); g.fillRect(cx + 2, by + 15, 4, 3); g.fillStyle = '#000'; g.fillRect(cx + 2, by + 5, 2, 2);
  for (let i = 0; i < 4; i++) { const x = Math.floor(w * 0.2 + i * w * 0.2), y = Math.floor(base - 34 + Math.sin(tf * 6 + i) * 2); const spin = Math.floor(tf * 8 + i) % 4; const cw = [6, 4, 2, 4].at(spin); g.fillStyle = '#FFC93C'; g.fillRect(x - Math.floor(cw / 2), y, cw, 7); g.fillStyle = '#FFF3B0'; g.fillRect(x - Math.floor(cw / 2) + 1, y + 1, 1, 4); }
  g.fillStyle = '#B5651D'; for (let i = 0; i < 3; i++) g.fillRect(Math.floor(w * 0.3 + i * 8), Math.floor(base - 50), 7, 7); g.fillStyle = '#FFC93C'; g.fillRect(Math.floor(w * 0.3 + 8), Math.floor(base - 50), 7, 7); g.fillStyle = '#7A3E1D'; g.fillRect(Math.floor(w * 0.3 + 10), Math.floor(base - 48), 3, 3);
  ctx.imageSmoothingEnabled = false; ctx.drawImage(_pix, 0, 0, w * S, h * S); ctx.imageSmoothingEnabled = true;
  // textos em fonte pixel desenhada direto no quadro final: blocos nítidos, sem borrão
  const tB = Math.max(2, Math.floor(Math.min(W * 0.84 / (10 * 6), H * 0.07 / 7))); const ty = Math.round(H * (L.o === 'v' ? 0.2 : L.o === 's' ? 0.11 : 0.09));
  if (tf > 0.4) { const pop = Math.min(1, (tf - 0.4) / 0.25); const tb2 = Math.max(2, Math.round(tB * (pop < 1 ? 0.7 + pop * 0.3 : 1))); pxText(ctx, 'NOVO NÍVEL', Math.round(W / 2 - pxWidth('NOVO NÍVEL', tb2) / 2), ty, tb2, '#FFC93C', '#7A3E1D'); }
  const sB = Math.max(2, Math.round(tB * 0.42)); if (Math.floor(tf * 2) % 2 === 0 && tf > 1.2) pxText(ctx, 'PRESSIONE START', Math.round(W / 2 - pxWidth('PRESSIONE START', sB) / 2), ty + tB * 10, sB, '#FFFFFF', '#1B1440');
  const hB = Math.max(2, Math.round(Math.min(W, H) / 140)); pxText(ctx, `PONTOS ${String(Math.floor(tf * 250)).padStart(4, '0')}`, hB * 4, hB * 4, hB, '#FFFFFF', '#000000');
  ctx.globalAlpha = 1 - outA(t); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
};
// 16 — Memphis
ST.memphis = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#FFF1DE'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  const shapes = [['tri', 0.15, 0.2, '#FF6F91', 0.0], ['circ', 0.85, 0.18, '#4FC3F7', 0.15], ['zig', 0.78, 0.82, '#111', 0.3], ['dots', 0.12, 0.8, '#111', 0.45], ['sq', 0.88, 0.55, '#FFD54F', 0.6], ['wave', 0.25, 0.92, '#7E57C2', 0.75], ['ring', 0.6, 0.12, '#26A69A', 0.9]];
  shapes.forEach(([k, x, y, c, s], i) => { const p = back(pr(t, s, s + 0.5)); if (p <= 0) return; ctx.save(); ctx.translate(W * x, H * y); ctx.rotate(Math.sin(t * 1.5 + i) * 0.2 + (1 - p) * 2); ctx.scale(p, p); const z = 6 * u; ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineWidth = 1.2 * u;
    if (k === 'tri') { ctx.beginPath(); ctx.moveTo(0, -z); ctx.lineTo(z, z); ctx.lineTo(-z, z); ctx.closePath(); ctx.fill(); }
    if (k === 'circ') { ctx.beginPath(); ctx.arc(0, 0, z, 0, 7); ctx.fill(); }
    if (k === 'sq') { ctx.fillRect(-z * 0.8, -z * 0.8, z * 1.6, z * 1.6); }
    if (k === 'ring') { ctx.beginPath(); ctx.arc(0, 0, z * 0.8, 0, 7); ctx.stroke(); }
    if (k === 'zig') { ctx.beginPath(); for (let j = 0; j <= 6; j++) ctx.lineTo(-z * 1.5 + j * z * 0.5, j % 2 ? -z * 0.4 : z * 0.4); ctx.stroke(); }
    if (k === 'wave') { ctx.beginPath(); for (let j = 0; j <= 30; j++) ctx.lineTo(-z * 1.6 + j * z * 0.107, Math.sin(j / 30 * Math.PI * 4 + t * 4) * z * 0.3); ctx.stroke(); }
    if (k === 'dots') { for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) { ctx.beginPath(); ctx.arc(-z + a * z * 0.66, -z + b * z * 0.66, z * 0.12, 0, 7); ctx.fill(); } }
    ctx.restore(); });
  const box = { x: W * 0.1, y: L.o === 'h' ? H * 0.3 : H * 0.34, w: W * 0.8 };
  const y = heading(ctx, box, [{ s: 'FESTA', f: ARC, k: 1.5, c: '#111', at: 0.9 }, { s: 'DE VERÃO', f: ARC, k: 1.0, c: '#FF6F91', at: 1.1 }], t, L.base, 'pop', 'center');
  const sp = back(pr(t, 1.6, 2.0)); if (sp > 0) { const s2 = 3.6 * u; ctx.save(); ctx.translate(W / 2, y + 7 * u); ctx.rotate(-0.04); ctx.scale(sp, sp); ctx.font = SG()(s2); const tw = ctx.measureText('sábado · 20h').width + 4 * u; ctx.fillStyle = '#111'; ctx.fillRect(-tw / 2 + 0.8 * u, -s2 + 0.8 * u, tw, s2 * 1.6); ctx.fillStyle = '#4FC3F7'; ctx.fillRect(-tw / 2, -s2, tw, s2 * 1.6); txt(ctx, 'sábado · 20h', 0, s2 * 0.32, SG()(s2), '#111', 'center'); ctx.restore(); }
};
// 17 — Bauhaus
ST.bauhaus = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#F2EBDD'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  inBox(ctx, L.vis, 300, 300, () => {
    const p1 = eio(pr(t, 0.1, 0.7)), p2 = eio(pr(t, 0.4, 1.0)), p3 = eio(pr(t, 0.7, 1.3)), p4 = eio(pr(t, 1.0, 1.6));
    ctx.fillStyle = '#E63946'; ctx.beginPath(); ctx.arc(lerp(-120, 110, p1), 110, 90, 0, 7); ctx.fill();
    ctx.fillStyle = '#1D3557'; ctx.fillRect(150, lerp(400, 120, p2), 130, 130);
    ctx.save(); ctx.translate(lerp(420, 210, p3), 260); ctx.rotate(lerp(1.5, 0, p3) + Math.sin(t * 1.2) * 0.03); ctx.fillStyle = '#F4B400'; ctx.beginPath(); ctx.moveTo(-70, 30); ctx.lineTo(0, -90); ctx.lineTo(70, 30); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.fillStyle = '#111'; ctx.fillRect(20, 230, 240 * p4, 14); ctx.fillRect(20, 255, 140 * p4, 14);
    ctx.save(); ctx.translate(110, 110); ctx.rotate(t * 0.8); ctx.fillStyle = '#F2EBDD'; ctx.fillRect(-4, -90, 8, 90); ctx.restore();
  });
  heading(ctx, L.text, [{ s: 'forma', f: IN(800), k: 1.1, c: '#111', at: 1.2 }, { s: 'segue', f: IN(800), k: 1.1, c: '#111', at: 1.35 }, { s: 'função.', f: IN(800), k: 1.1, c: '#E63946', at: 1.5 }], t, L.base, 'mask');
};
// 18 — Art Déco
ST.deco = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#0E0E10'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t); const gold = ctx.createLinearGradient(0, 0, W, H); gold.addColorStop(0, '#F7E3A1'); gold.addColorStop(0.5, '#C9A24A'); gold.addColorStop(1, '#F2D68A');
  const cx = W / 2, cy = L.o === 'h' ? H * 0.95 : L.o === 'v' ? H * 0.8 : H * 0.7, R = Math.max(W, H) * 0.7; const fan = eio(pr(t, 0.1, 1.4));
  ctx.strokeStyle = gold; for (let i = 0; i <= 24; i++) { const a = Math.PI + (i / 24) * Math.PI; const aa = lerp(-Math.PI / 2, a, fan); ctx.lineWidth = i % 2 ? 1 : 2.4; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(aa) * R, cy + Math.sin(aa) * R); ctx.stroke(); }
  for (let k = 0; k < 4; k++) { const rr2 = (12 + k * 7) * u * eo(pr(t, 0.6 + k * 0.12, 1.1 + k * 0.12)); ctx.lineWidth = k === 0 ? 3 : 1.4; ctx.beginPath(); ctx.arc(cx, cy, rr2, Math.PI, 0); ctx.stroke(); }
  ctx.fillStyle = '#0E0E10'; const bw = Math.min(W * 0.84, 110 * u), bh = 30 * u, bx = (W - bw) / 2, by = L.o === 'h' ? H * 0.22 : L.o === 'v' ? H * 0.28 : H * 0.18; const bp = eo(pr(t, 1.0, 1.5)); ctx.globalAlpha = outA(t) * bp; ctx.fillRect(bx, by, bw, bh); ctx.strokeStyle = gold; ctx.lineWidth = 2; ctx.strokeRect(bx + u, by + u, bw - 2 * u, bh - 2 * u); ctx.strokeRect(bx + 2.2 * u, by + 2.2 * u, bw - 4.4 * u, bh - 4.4 * u);
  ctx.globalAlpha = outA(t); const ls = fitSize(ctx, 'G R A N D E   N O I T E', s => `600 ${s}px Inter`, 5.4 * u, bw * 0.8); ctx.globalAlpha *= eo(pr(t, 1.3, 1.8)); txt(ctx, 'G R A N D E   N O I T E', W / 2, by + bh * 0.48, `600 ${ls}px Inter`, gold, 'center'); txt(ctx, 'gala de inauguração', W / 2, by + bh * 0.78, SER(4.6 * u), '#E9D9A6', 'center');
  // brilho que varre
  const sw = (t - 2.2) / 1.0; if (sw > 0 && sw < 1) { ctx.save(); ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip(); const sx = lerp(bx - bw * 0.3, bx + bw * 1.3, sw); const sg = ctx.createLinearGradient(sx - 6 * u, 0, sx + 6 * u, 0); sg.addColorStop(0, 'rgba(255,240,200,0)'); sg.addColorStop(0.5, 'rgba(255,240,200,0.35)'); sg.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = sg; ctx.fillRect(bx, by, bw, bh); ctx.restore(); }
  ctx.globalAlpha = 1;
};
// 19 — Synthwave
ST.synth = (ctx, t, L) => {
  const { W, H, u } = L; const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#0B0628'); sky.addColorStop(0.55, '#3A0F5E'); sky.addColorStop(0.62, '#130626'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  const hz = H * (L.o === 'v' ? 0.6 : 0.64), R = Math.min(W, H) * (L.o === 'v' ? 0.3 : 0.24), sunY = hz - R * 0.55 + (1 - eo(pr(t, 0, 1.2))) * R;
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, hz); ctx.clip(); const sg = ctx.createLinearGradient(0, sunY - R, 0, sunY + R); sg.addColorStop(0, '#FFD319'); sg.addColorStop(0.5, '#FF2975'); sg.addColorStop(1, '#8C1EFF'); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(W / 2, sunY, R, 0, 7); ctx.fill();
  ctx.fillStyle = '#130626'; for (let i = 0; i < 6; i++) { const yy = sunY + R * (0.1 + i * 0.16); ctx.fillRect(W / 2 - R, yy, 2 * R, R * 0.03 * (i + 1)); } ctx.restore();
  ctx.fillStyle = '#130626'; ctx.fillRect(0, hz, W, H - hz); ctx.strokeStyle = '#FF2975'; ctx.lineWidth = 1.5; shadow(ctx, '#FF2975', 8, 0, 0);
  for (let i = -14; i <= 14; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * W * 0.02, hz); ctx.lineTo(W / 2 + i * W * 0.22, H); ctx.stroke(); }
  for (let k = 0; k < 10; k++) { const z = ((k + (t * 1.5) % 1) / 10); const y = hz + (H - hz) * z * z; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } noShadow(ctx);
  const s = fitSize(ctx, 'NOITE NEON', s => `italic 800 ${s}px Inter`, 14 * u, W * 0.86); const p = ex(pr(t, 0.8, 1.3)); ctx.save(); ctx.translate(W / 2, H * (L.o === 'v' ? 0.22 : 0.17)); ctx.scale(lerp(1.3, 1, p), lerp(1.3, 1, p)); ctx.globalAlpha *= p;
  const tg = ctx.createLinearGradient(0, -s, 0, s * 0.2); tg.addColorStop(0, '#E0F7FF'); tg.addColorStop(0.5, '#5CD6FF'); tg.addColorStop(0.55, '#1B3A8C'); tg.addColorStop(1, '#C8F1FF'); shadow(ctx, '#2DE2E6', 18 + 8 * Math.sin(t * 6), 0, 0); txt(ctx, 'NOITE NEON', 0, 0, `italic 800 ${s}px Inter`, tg, 'center'); noShadow(ctx); ctx.restore();
  ctx.globalAlpha = outA(t) * eo(pr(t, 1.6, 2.0)); txt(ctx, 'sexta · 23h', W / 2, H * (L.o === 'v' ? 0.22 : 0.17) + s * 0.75, `italic ${s * 0.32}px "Instrument Serif"`, '#FF8FD8', 'center'); ctx.globalAlpha = 1;
};
// 20 — Risografia
const RISO_GRAIN = {};
function risoGrain(W, H) { const k = W + 'x' + H; if (RISO_GRAIN[k]) return RISO_GRAIN[k]; const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); const r = seeded(11); g.globalAlpha = 0.12; for (let i = 0; i < W * H / 120; i++) { g.fillStyle = r() > 0.5 ? '#FFF' : '#7A6F60'; g.fillRect(r() * W, r() * H, 1.4, 1.4); } return (RISO_GRAIN[k] = c); }
ST.riso = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#F4EFE6'; ctx.fillRect(0, 0, W, H);
  // registro levemente desalinhado: deriva suave e contínua, sem saltos
  const j = k => Math.sin(t * 2.1 + k * 1.7) * 0.5 * u;
  ctx.globalAlpha = outA(t); ctx.globalCompositeOperation = 'multiply';
  ctx.save(); ctx.translate(j(1), j(2)); ctx.fillStyle = '#FF48B0'; inBox(ctx, L.vis, 300, 300, () => { const p = back(pr(t, 0.1, 0.8)); const f = Math.sin(t * 1.6) * 6; ctx.beginPath(); ctx.arc(150, 150 + f, 110 * p, 0, 7); ctx.fill(); }); ctx.restore();
  ctx.save(); ctx.translate(j(3), j(4)); inBox(ctx, L.vis, 300, 300, () => { const p = eo(pr(t, 0.5, 1.2)); ctx.fillStyle = '#0078BF'; for (let i = 0; i < 5; i++) { const h = 200 * p * (0.4 + i * 0.15) * (1 + Math.sin(t * 2.4 + i) * 0.04 * p); ctx.fillRect(40 + i * 48, 270 - h, 30, h); } }); ctx.restore();
  ctx.save(); ctx.translate(j(5) + 0.6 * u, j(6)); heading(ctx, L.text, [{ s: 'Impresso', f: ARC, k: 1.1, c: '#0078BF', at: 0.6 }, { s: 'à mão.', f: ARC, k: 1.1, c: '#0078BF', at: 0.8 }], t, L.base); ctx.restore();
  ctx.save(); ctx.translate(j(7) - 0.4 * u, j(8)); heading(ctx, L.text, [{ s: 'Impresso', f: ARC, k: 1.1, c: '#FF48B0', at: 0.6 }, { s: 'à mão.', f: ARC, k: 1.1, c: '#FF48B0', at: 0.8 }], t, L.base); ctx.restore();
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  // granulado pré-gerado uma vez por tamanho; só desloca (efeito de papel vivo, sem custo)
  const g = risoGrain(W, H), ox = (Math.floor(t * 10) % 4) * 3; ctx.drawImage(g, -ox, 0); if (ox) ctx.drawImage(g, W - ox, 0);
};
// 21 — Retícula / HQ / pop art
ST.popart = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#FFE14D'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = 'rgba(230,57,70,0.35)'; const st = 2.6 * u; for (let y = 0; y < H; y += st) for (let x = (y / st) % 2 ? st / 2 : 0; x < W; x += st) { const rr2 = st * 0.32 * (0.4 + 0.6 * (y / H)); ctx.beginPath(); ctx.arc(x, y, rr2, 0, 7); ctx.fill(); }
  ctx.globalAlpha = outA(t); const cx = W / 2, cy = L.o === 'h' ? H * 0.5 : H * 0.42; const p = back(pr(t, 0.2, 0.7)); const R = Math.min(W, H) * 0.42 * p;
  ctx.strokeStyle = '#111'; ctx.lineWidth = 0.6 * u; for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2 + t * 0.2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R * 1.05, cy + Math.sin(a) * R * 1.05); ctx.lineTo(cx + Math.cos(a) * R * 1.6, cy + Math.sin(a) * R * 1.6); ctx.stroke(); }
  ctx.fillStyle = '#E63946'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.2 * u; ctx.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, rr2 = R * (i % 2 ? 0.72 : 1) * (1 + 0.03 * Math.sin(t * 9 + i)); ctx.lineTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2); } ctx.closePath(); ctx.fill(); ctx.stroke();
  const s = fitSize(ctx, 'OFERTA!', ARC, R * 0.6, R * 1.35); const wp = back(pr(t, 0.6, 1.0)); ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.12); ctx.scale(wp, wp); ctx.lineWidth = s * 0.14; ctx.strokeStyle = '#111'; ctx.font = ARC(s); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.strokeText('OFERTA!', 0, 0); ctx.fillStyle = '#FFE14D'; ctx.fillText('OFERTA!', 0, 0); ctx.restore();
  const bp = back(pr(t, 1.4, 1.8)); if (bp > 0) { const bw = Math.min(W * 0.7, 70 * u), bh = 14 * u, bx = L.o === 'h' ? W * 0.62 : W * 0.15, by = L.o === 'h' ? H * 0.08 : H * 0.76; ctx.save(); ctx.translate(bx + bw / 2, by + bh / 2); ctx.scale(bp, bp); ctx.fillStyle = '#FFF'; ctx.strokeStyle = '#111'; ctx.lineWidth = 0.8 * u; rr(ctx, -bw / 2, -bh / 2, bw, bh, bh / 2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-bw * 0.2, bh / 2 - 1); ctx.lineTo(-bw * 0.3, bh / 2 + 5 * u); ctx.lineTo(-bw * 0.05, bh / 2 - 1); ctx.fill(); ctx.stroke(); txt(ctx, 'só até domingo!', 0, bh * 0.14, SG()(fitSize(ctx, 'só até domingo!', SG(), 5 * u, bw * 0.85)), '#111', 'center'); ctx.restore(); }
};
// 22 — Terminal / código
ST.terminal = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#0B0F0C'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t); const G = '#39FF88', D2 = '#1E7A47';
  const lines = [['$ ', 'sync --pedidos', 0.1, 0.8], ['', '› WhatsApp ..... ok', 1.0, 1.25], ['', '› notas ........ ok', 1.3, 1.55], ['', '› estoque ...... ok', 1.6, 1.85], ['', '✔ 128 pedidos', 2.1, 2.4]];
  const size = fitSize(ctx, '› WhatsApp ..... ok__', MONO, 6 * u, W * 0.86); const x = W * 0.07; let y = L.o === 'h' ? H * 0.28 : H * 0.36;
  txt(ctx, 'automacao@empresa:~', x, y - size * 2, MONO(size * 0.75), D2);
  let cursor = null; lines.forEach(([pfx, s, a, b], i) => { if (t < a) return; const n = Math.round(s.length * pr(t, a, b)); const shown = s.slice(0, n); txt(ctx, pfx, x, y, MONO(size), G); ctx.font = MONO(size); const px = ctx.measureText(pfx).width; txt(ctx, shown, x + px, y, MONO(size), i === 4 ? '#FFFFFF' : i === 0 ? G : '#9BE8B8'); if (n < s.length || i === lines.length - 1 || t < lines[Math.min(i + 1, 4)][2]) cursor = [x + px + ctx.measureText(shown).width, y]; y += size * 1.6; });
  if (cursor && Math.floor(t * 3) % 2 === 0) { ctx.fillStyle = G; ctx.fillRect(cursor[0] + 2, cursor[1] - size * 0.8, size * 0.55, size); }
  ctx.fillStyle = 'rgba(57,255,136,0.04)'; for (let yy = 0; yy < H; yy += 4) ctx.fillRect(0, yy, W, 1);
};
// 23 — Blueprint
ST.blueprint = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#1F4E9C'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t); ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1; const g = 4 * u; for (let x = 0; x < W; x += g) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += g) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  inBox(ctx, L.vis, 320, 300, () => { ctx.strokeStyle = '#FFF'; ctx.lineWidth = 2; const p = k => eo(pr(t, 0.2 + k * 0.25, 0.7 + k * 0.25));
    const R = 80, cx = 160, cy = 140; ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p(0)); ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, 28, 0, Math.PI * 2 * p(1)); ctx.stroke();
    for (let i = 0; i < 10; i++) { const q = clamp(p(1) * 10 - i); if (q <= 0) continue; const a = i / 10 * Math.PI * 2 + t * 0.25; ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(-10, -R); ctx.lineTo(-8, -R - 18 * q); ctx.lineTo(8, -R - 18 * q); ctx.lineTo(10, -R); ctx.stroke(); ctx.restore(); }
    ctx.setLineDash([4, 4]); ctx.globalAlpha *= p(2); ctx.beginPath(); ctx.moveTo(cx - R - 30, cy); ctx.lineTo(cx + R + 30, cy); ctx.moveTo(cx, cy - R - 30); ctx.lineTo(cx, cy + R + 30); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(cx - R, 270); ctx.lineTo(cx + R, 270); ctx.moveTo(cx - R, 262); ctx.lineTo(cx - R, 278); ctx.moveTo(cx + R, 262); ctx.lineTo(cx + R, 278); ctx.stroke(); txt(ctx, 'Ø 160 mm', cx, 292, MONO(13), '#FFF', 'center'); });
  heading(ctx, L.text, [{ s: 'Projetado', f: IN(700), c: '#FFF', at: 1.2 }, { s: 'para durar.', f: IN(700), c: '#9CC8FF', at: 1.4 }, { s: 'REV. 03 · ESCALA 1:2', f: MONO, k: 0.32, c: '#CFE2FF', at: 1.7, gap: 2 }], t, L.base * 0.9);
};
// 24 — Glitch
ST.glitch = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#08080C'; ctx.fillRect(0, 0, W, H); const burst = (t > 0.3 && t < 0.7) || (t > 1.9 && t < 2.15) || (t > 3.0 && t < 3.15); const r = seeded(Math.floor(t * 30) + 1);
  const s = fitSize(ctx, 'SISTEMA', ARC, 20 * u, W * 0.84); const y = H * 0.48;
  const draw = (col, dx) => { ctx.globalCompositeOperation = 'lighter'; txt(ctx, 'SISTEMA', W / 2 + dx, y, ARC(s), col, 'center'); };
  ctx.globalAlpha = outA(t) * clamp(t * 3); const off = burst ? (r() - 0.5) * 3 * u : 0.4 * u; draw('#FF0040', -off); draw('#00E5FF', off); draw('#FFFFFF', 0); ctx.globalCompositeOperation = 'source-over';
  if (burst) { for (let k = 0; k < 6; k++) { const sy = r() * H, sh = r() * 4 * u + u, dx = (r() - 0.5) * 12 * u; ctx.drawImage(ctx.canvas, 0, sy, W, sh, dx, sy, W, sh); } }
  ctx.globalAlpha = outA(t) * eo(pr(t, 1.0, 1.4)); txt(ctx, 'segurança em tempo real', W / 2, y + s * 0.6, MONO(3.2 * u), '#9AA0B5', 'center');
  ctx.fillStyle = 'rgba(255,255,255,0.03)'; for (let yy = 0; yy < H; yy += 3) ctx.fillRect(0, yy, W, 1); ctx.globalAlpha = 1;
};
// 25 — Painel de LED
const _led = document.createElement('canvas');
ST.led = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, W, H); const P = Math.max(5, Math.round(Math.min(W, H) / 56)); const cols = Math.floor(W / P), rows = Math.floor(H / P);
  _led.width = cols; _led.height = rows; const g = _led.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, cols, rows); g.fillStyle = '#FFF'; g.textBaseline = 'middle';
  const msg = 'PROMOÇÃO · ATÉ 50% OFF · '; g.font = `bold ${Math.floor(rows * (L.o === 'h' ? 0.28 : 0.12))}px monospace`; const mw = g.measureText(msg).width; const sx = -((t * cols * 0.45) % mw);
  const ty = L.o === 'h' ? rows * 0.32 : rows * 0.22; g.fillText(msg + msg + msg, sx, ty);
  const n = Math.round(50 * eio(pr(t, 0.8, 2.4))); g.font = `bold ${Math.floor(rows * (L.o === 'h' ? 0.42 : 0.26))}px monospace`; g.textAlign = 'center'; g.fillText(`${n}%`, cols / 2, L.o === 'h' ? rows * 0.72 : rows * 0.55);
  const d = g.getImageData(0, 0, cols, rows).data; const A = outA(t);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const on = d[(y * cols + x) * 4] > 100; ctx.fillStyle = on ? `rgba(255,170,30,${A})` : 'rgba(255,170,30,0.07)'; ctx.beginPath(); ctx.arc(x * P + P / 2, y * P + P / 2, P * 0.36, 0, 7); ctx.fill(); }
};
// 26 — Formas orgânicas / morph
ST.blob = (ctx, t, L) => {
  const { W, H } = L; ctx.fillStyle = '#EAF4EC'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  inBox(ctx, L.vis, 300, 300, () => { const ph = (t / D) * 3; const k = Math.floor(ph), f = eio(ph - k); const shapes = [a => 1, a => 0.75 + 0.25 * Math.cos(a * 2) , a => 0.8 + 0.2 * Math.sin(a * 5), a => 1]; const s1 = shapes.at(k % 4), s2 = shapes.at((k + 1) % 4);
    const cols = ['#7BC47F', '#F2A65A', '#E86F68', '#7BC47F']; ctx.fillStyle = cols.at(k % 4); ctx.beginPath(); for (let i = 0; i <= 80; i++) { const a = i / 80 * Math.PI * 2; const r = 110 * lerp(s1(a), s2(a), f) * (1 + 0.03 * Math.sin(a * 3 + t * 2)); ctx.lineTo(150 + Math.cos(a) * r, 150 + Math.sin(a) * r); } ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(115, 110, 30, 18, -0.6, 0, 7); ctx.fill(); });
  heading(ctx, L.text, [{ s: 'Natural', f: SG(), k: 1.2, c: '#24452A', at: 0.4 }, { s: 'por inteiro.', f: SER, k: 1.05, c: '#4E8A54', at: 0.7 }], t, L.base, 'rise');
};
// 27 — Construtivismo
ST.constructivist = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#EFE6D2'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  const p1 = eio(pr(t, 0, 0.6)); ctx.save(); ctx.translate(W * 0.1, H * 0.95); ctx.rotate(-0.55); ctx.fillStyle = '#C8102E'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.hypot(W, H) * 1.2 * p1, -18 * u); ctx.lineTo(Math.hypot(W, H) * 1.2 * p1, 18 * u); ctx.closePath(); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#111'; const p2 = eio(pr(t, 0.4, 1.0)); ctx.beginPath(); ctx.arc(W * 0.78, H * 0.28, Math.min(W, H) * 0.18 * p2, 0, 7); ctx.fill(); ctx.fillStyle = '#C8102E'; ctx.beginPath(); ctx.arc(W * 0.78, H * 0.28, Math.min(W, H) * 0.18 * p2, -Math.PI / 2, Math.PI / 2); ctx.fill();
  ctx.save(); ctx.translate(W * 0.08, L.o === 'h' ? H * 0.62 : H * 0.6); ctx.rotate(-0.12); const s = fitSize(ctx, 'AVANTE!', ANT, 22 * u, W * 0.8); const p3 = ex(pr(t, 0.9, 1.3)); ctx.beginPath(); ctx.rect(0, -s, W, s * 1.15); ctx.clip(); txt(ctx, 'AVANTE!', (1 - p3) * -W * 0.6, 0, ANT(s), '#111'); ctx.restore();
  ctx.save(); ctx.translate(W * 0.08, (L.o === 'h' ? H * 0.62 : H * 0.6) + 9 * u); ctx.rotate(-0.12); ctx.globalAlpha *= eo(pr(t, 1.4, 1.8)); ctx.fillStyle = '#111'; ctx.fillRect(0, 0, 60 * u, 6 * u); txt(ctx, 'ASSEMBLEIA · 19H', 2 * u, 4.4 * u, ANT(4.2 * u), '#EFE6D2'); ctx.restore();
};

const STYLE_LIST = [
  ['flat2d', 'Motion 2D flat', 'Explicar serviços e processos'], ['kinetic', 'Tipografia cinética', 'Ofertas e frases de impacto'], ['iso', 'Isométrico', 'Integrações e logística'],
  ['data', 'Infográfico de dados', 'Números e resultados'], ['ui', 'Demo de produto', 'Mostrar app ou sistema'], ['hud', 'Documento / HUD', 'Autoridade, IA e automação'],
  ['whiteboard', 'Traço desenhado', 'Conteúdo educativo'], ['collage', 'Colagem', 'Marcas com personalidade'], ['launch', 'Lançamento', 'Revelar produto novo'],
  ['swiss', 'Minimal suíço', 'Institucional premium'], ['gradient', 'Gradiente tech', 'SaaS e produtos digitais'], ['brutal', 'Neo-brutalismo', 'Promoção que chama atenção'],
  ['soft3d', '3D suave', 'Bem-estar, beleza, finanças'], ['lineart', 'Line art contínua', 'Marca elegante, cafés, bem-estar'], ['pixel', 'Pixel art 8-bit', 'Games, público jovem, gamificação'],
  ['memphis', 'Memphis anos 80/90', 'Eventos e posts enérgicos'], ['bauhaus', 'Bauhaus', 'Design, arquitetura, cultura'], ['deco', 'Art Déco', 'Luxo, eventos, convites'],
  ['synth', 'Synthwave', 'Música, festas, games'], ['riso', 'Risografia', 'Marcas independentes, editorial'], ['popart', 'Quadrinho / pop art', 'Promoções divertidas'],
  ['terminal', 'Terminal / código', 'Automação, IA, tecnologia'], ['blueprint', 'Blueprint técnico', 'Engenharia, indústria, processos'], ['glitch', 'Glitch', 'Tecnologia, segurança, games'],
  ['led', 'Painel de LED', 'Ofertas, placares, avisos'], ['blob', 'Formas orgânicas', 'Alimentação, natural, bem-estar'], ['constructivist', 'Construtivismo', 'Manifesto, campanhas de impacto'],
];
function render(canvas, id, t) {
  const ctx = canvas.getContext('2d');
  // zera todo o estado do contexto a cada quadro: nenhum estilo herda transformação, recorte ou filtro de outro
  if (typeof ctx.reset === 'function') ctx.reset(); else { ctx.setTransform(1, 0, 0, 1, 0, 0); canvas.width = canvas.width; }
  const L = layout(canvas.width, canvas.height);
  ctx.save(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  try { ST[id](ctx, t, L); } catch (e) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = '#16171D'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  ctx.restore();
}

// ================= estilos extras =================
// 28 — Ícones de linha animados
const ICON_PATHS = [
  'M4 18l1.3-3.6A7.5 7.5 0 1 1 8 17.4z',
  'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1',
  'M4 7h16v13H4zM4 11h16M9 4v5M15 4v5',
  'M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17M8 12.5l2.7 2.7L16 9.5',
  'M4 18l6-6 4 4 6-8M15 8h5v5',
  'M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6zM9 12l2 2 4-4',
];
ST.lineicons = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  const cols = L.o === 'h' ? 3 : 2, rows = 6 / cols; const area = L.o === 'h' ? L.vis : { x: L.vis.x, y: L.vis.y - 4 * u, w: L.vis.w, h: L.vis.h + 6 * u };
  const cw = area.w / cols, ch = area.h / rows, s = Math.min(cw, ch) * 0.5 / 24;
  ICON_PATHS.forEach((d, i) => { const c = i % cols, r = Math.floor(i / cols); const cx = area.x + cw * (c + 0.5), cy = area.y + ch * (r + 0.5); const p = eio(pr(t, 0.2 + i * 0.18, 1.1 + i * 0.18));
    const bp = back(pr(t, 0.1 + i * 0.18, 0.5 + i * 0.18)); ctx.save(); ctx.translate(cx, cy); ctx.scale(bp, bp); ctx.fillStyle = i === 3 ? '#E8F7EF' : '#F1EFFF'; ctx.beginPath(); ctx.arc(0, 0, 18 * s, 0, 7); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(cx - 12 * s, cy - 12 * s); ctx.scale(s, s); ctx.lineWidth = 1.7; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = i === 3 ? '#16A34A' : '#4B3BFF'; ctx.setLineDash([120 * p, 200]); const pulse = i === 1 ? t * 0.8 : 0; if (pulse) { ctx.translate(12, 12); ctx.rotate(pulse); ctx.translate(-12, -12); } ctx.stroke(new Path2D(d)); ctx.restore(); });
  heading(ctx, L.text, [{ s: 'Simples de', f: IN(700), c: '#1C1B1F', at: 0.1 }, { s: 'entender.', f: IN(700), c: '#4B3BFF', at: 0.3 }], t, L.base * 0.9);
};
// 29 — Papercraft (12 fps)
ST.papercraft = (ctx, tt, L) => {
  const t = Math.floor(tt * 12) / 12, { W, H, u } = L; ctx.fillStyle = '#BFE3F2'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(tt);
  const sp = back(pr(t, 0, 0.6)); shadow(ctx, 'rgba(0,0,0,0.18)', 6, 0, 3); ctx.fillStyle = '#FFD166'; ctx.beginPath(); ctx.arc(W * 0.78, H * 0.2 + (1 - sp) * H * 0.2, Math.min(W, H) * 0.1, 0, 7); ctx.fill();
  const hill = (base, amp, col, st, k) => { const p = eo(pr(t, st, st + 0.5)); const yb = H * base + (1 - p) * H * 0.4; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += W / 30) ctx.lineTo(x, yb - Math.sin(x / W * Math.PI * (2 + k) + k) * H * amp - Math.sin(x / W * 13 + k) * u * 0.4); ctx.lineTo(W, H); ctx.closePath(); ctx.fill(); };
  hill(0.62, 0.06, '#7BC8A4', 0.1, 1); hill(0.72, 0.05, '#4CAF84', 0.3, 2); hill(0.84, 0.04, '#2E8B63', 0.5, 3);
  [[0.22, 0.18, 0.7], [0.5, 0.1, 0.9]].forEach(([x, y, st]) => { const p = eo(pr(t, st, st + 0.5)); if (p <= 0) return; const cx = W * x + (1 - p) * -W * 0.3 + Math.sin(t) * u, cy = H * y; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(cx, cy, 4 * u, 0, 7); ctx.arc(cx + 5 * u, cy - 2 * u, 5 * u, 0, 7); ctx.arc(cx + 10 * u, cy, 4 * u, 0, 7); ctx.fill(); });
  const tp = back(pr(t, 1.0, 1.4)); if (tp > 0) { const s = fitSize(ctx, 'Feito com carinho', s => `700 ${s}px "Space Grotesk"`, 7 * u, W * 0.7); ctx.font = `700 ${s}px "Space Grotesk"`; const tw = ctx.measureText('Feito com carinho').width + 6 * u; ctx.save(); ctx.translate(W / 2, H * 0.42); ctx.rotate(-0.03); ctx.scale(tp, tp); ctx.fillStyle = '#FFF8EC'; ctx.fillRect(-tw / 2, -s * 1.1, tw, s * 1.7); noShadow(ctx); txt(ctx, 'Feito com carinho', 0, s * 0.2, `700 ${s}px "Space Grotesk"`, '#7A4B2A', 'center'); ctx.restore(); }
  noShadow(ctx);
};

// ================= tipos de vídeo (estruturas) =================
const FINK = '#1C1B1F', FACC = '#6D4AFF', FBG = '#F4F4F6';
// conversa de WhatsApp
ST.f_whatsapp = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#E9F5EE'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  const side = L.o !== 'v'; const box = side ? { x: W * 0.52, y: H * 0.05, w: W * 0.42, h: H * 0.9 } : { x: W * 0.12, y: H * 0.18, w: W * 0.76, h: H * 0.78 };
  inBox(ctx, box, 300, 540, () => {
    shadow(ctx, 'rgba(0,0,0,0.18)', 30, 0, 12); ctx.fillStyle = '#111'; rr(ctx, 0, 0, 300, 540, 36); ctx.fill(); noShadow(ctx); ctx.fillStyle = '#ECE5DD'; rr(ctx, 10, 10, 280, 520, 28); ctx.fill();
    ctx.fillStyle = '#1F8A5B'; ctx.save(); rr(ctx, 10, 10, 280, 520, 28); ctx.clip(); ctx.fillRect(10, 10, 280, 64); ctx.restore(); ctx.fillStyle = '#D9F2E3'; ctx.beginPath(); ctx.arc(46, 50, 16, 0, 7); ctx.fill(); txt(ctx, 'Clínica Sorriso', 70, 47, IN(700)(15), '#FFF'); txt(ctx, 'online', 70, 64, IN(500)(11), '#D9F2E3');
    const msgs = [['in', 'Oi! Tem horário amanhã?', 0.3], ['out', 'Temos 10h ou 15h 😊', 0.9], ['audio', '', 1.5], ['out', 'Agendado para 15h ✓', 2.3]];
    let y = 96; msgs.forEach(([k, s, at]) => { const p = back(pr(t, at, at + 0.35)); const w = k === 'audio' ? 170 : Math.min(220, s.length * 7.4 + 24), h = 40; const x = k === 'in' ? 22 : 278 - w; if (p > 0) { ctx.save(); ctx.translate(x + (k === 'in' ? 0 : w), y + h / 2); ctx.scale(p, p); ctx.translate(-(k === 'in' ? 0 : w), -h / 2); ctx.fillStyle = k === 'in' ? '#FFFFFF' : '#D7F7C2'; rr(ctx, 0, 0, w, h, 10); ctx.fill();
      if (k === 'audio') { ctx.fillStyle = '#1F8A5B'; ctx.beginPath(); ctx.moveTo(14, 12); ctx.lineTo(26, 20); ctx.lineTo(14, 28); ctx.fill(); for (let i = 0; i < 22; i++) { const hh = 4 + Math.abs(Math.sin(i * 1.7)) * 14; ctx.fillStyle = i / 22 < pr(t, 1.7, 2.2) ? '#1F8A5B' : '#9BC9AE'; ctx.fillRect(36 + i * 5.5, 20 - hh / 2, 3, hh); } }
      else txt(ctx, s, 12, 25, IN(500)(13), '#111'); ctx.restore(); } y += h + 12; });
    if (t > 1.9 && t < 2.3) { ctx.fillStyle = '#FFF'; rr(ctx, 22, y, 56, 30, 12); ctx.fill(); for (let i = 0; i < 3; i++) { ctx.fillStyle = `rgba(0,0,0,${0.3 + 0.4 * (Math.floor(t * 8 + i) % 2)})`; ctx.beginPath(); ctx.arc(38 + i * 12, y + 15, 3.5, 0, 7); ctx.fill(); } }
    const cp = back(pr(t, 2.6, 3.0)); if (cp > 0) { ctx.save(); ctx.translate(150, 470); ctx.scale(cp, cp); ctx.fillStyle = '#FFF'; shadow(ctx, 'rgba(0,0,0,0.15)', 16, 0, 6); rr(ctx, -110, -26, 220, 52, 14); ctx.fill(); noShadow(ctx); ctx.fillStyle = '#1F8A5B'; ctx.beginPath(); ctx.arc(-84, 0, 12, 0, 7); ctx.fill(); txt(ctx, 'Consulta confirmada', -64, 5, IN(700)(14), '#111'); ctx.restore(); }
  });
  const tb = side ? { x: W * 0.07, y: H * (L.o === 'h' ? 0.34 : 0.3), w: W * 0.42 } : { x: W * 0.08, y: H * 0.04, w: W * 0.84 }; heading(ctx, tb, [{ s: 'Atende sozinho,', f: IN(800), c: FINK, at: 0 }, { s: 'até de madrugada.', f: SER, k: 1.05, c: '#1F8A5B', at: 0.2 }], t, side ? (L.o === 'h' ? L.base : 7 * u) : L.base * 0.75);
};
// vitrine de produtos
ST.f_vitrine = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = FBG; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  heading(ctx, L.o === 'h' ? L.text : { x: W * 0.08, y: H * 0.08, w: W * 0.84 }, [{ s: 'Ofertas da semana', f: IN(800), c: FINK, at: 0 }, { s: 'até 30% off', f: SER, k: 1.1, c: '#E5484D', at: 0.2 }], t, L.base * 0.85);
  const box = L.o === 'h' ? L.vis : { x: 0, y: H * 0.36, w: W, h: H * 0.5 };
  const prods = [['Tapete Sala', '#C98B5A', '389', '279'], ['Tapete Boho', '#7FA88B', '459', '319'], ['Passadeira', '#5B6CC9', '199', '139'], ['Tapete Kids', '#E9A23B', '259', '179']];
  if (L.o === 'h') { ctx.save(); ctx.beginPath(); ctx.rect(box.x - 2 * u, 0, W - box.x + 2 * u, H); ctx.clip(); }
  const cw = Math.min(box.w * 0.62, box.h * 0.72), chh = cw * 1.32; const shift = eio(pr(t, 0.6, 3.4)) * 2.2;
  prods.forEach(([n, c, o, p], i) => { const k = i - shift; const x = box.x + box.w / 2 + k * (cw + 4 * u) - cw / 2, y = box.y + (box.h - chh) / 2; const sc = 1 - Math.min(0.15, Math.abs(k) * 0.12); if (x > W || x + cw < 0) return;
    ctx.save(); ctx.translate(x + cw / 2, y + chh / 2); ctx.scale(sc, sc); ctx.translate(-cw / 2, -chh / 2); shadow(ctx, 'rgba(0,0,0,0.12)', 20, 0, 8); ctx.fillStyle = '#FFF'; rr(ctx, 0, 0, cw, chh, 2.4 * u); ctx.fill(); noShadow(ctx);
    ctx.fillStyle = c; rr(ctx, cw * 0.06, cw * 0.06, cw * 0.88, cw * 0.7, 1.6 * u); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = u * 0.6; for (let j = 1; j < 5; j++) { ctx.beginPath(); ctx.moveTo(cw * 0.06, cw * 0.06 + j * cw * 0.14); ctx.lineTo(cw * 0.94, cw * 0.06 + j * cw * 0.14); ctx.stroke(); }
    txt(ctx, n, cw * 0.08, cw * 0.9, IN(700)(cw * 0.085), FINK); txt(ctx, `R$ ${o}`, cw * 0.08, cw * 1.04, IN(500)(cw * 0.065), '#9A9AA2'); ctx.fillStyle = '#9A9AA2'; ctx.fillRect(cw * 0.08, cw * 1.015, cw * 0.28, 1.5);
    txt(ctx, `R$ ${p}`, cw * 0.08, cw * 1.2, IN(800)(cw * 0.12), '#E5484D'); ctx.fillStyle = '#E5484D'; rr(ctx, cw * 0.66, cw * 0.1, cw * 0.24, cw * 0.11, cw * 0.05); ctx.fill(); txt(ctx, '-30%', cw * 0.78, cw * 0.18, IN(800)(cw * 0.065), '#FFF', 'center'); ctx.restore(); });
  if (L.o === 'h') ctx.restore();
};
// depoimento e avaliações
ST.f_depoimento = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#FFF8F0'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  const box = { x: W * 0.1, y: L.o === 'h' ? H * 0.12 : H * 0.16, w: W * 0.8 };
  txt(ctx, '“', box.x - u, box.y + 14 * u, `${22 * u}px "DM Serif Display"`, '#F2B24C');
  for (let i = 0; i < 5; i++) { const p = back(pr(t, 0.2 + i * 0.12, 0.5 + i * 0.12)); if (p <= 0) continue; const cx = box.x + 14 * u + i * 7.5 * u, cy = box.y + 6 * u, r = 3 * u * p; ctx.fillStyle = '#F2B24C'; ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr2 = k % 2 ? r * 0.45 : r; ctx.lineTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2); } ctx.closePath(); ctx.fill(); }
  const y = heading(ctx, { x: box.x, y: box.y + 13 * u, w: box.w }, [{ s: 'Meus pedidos dobraram', f: SER, k: 1, c: FINK, at: 0.8 }, { s: 'no primeiro mês.', f: SER, k: 1, c: FINK, at: 1.0 }], t, L.o === 'h' ? 9 * u : 9.5 * u, 'rise');
  const ap = eo(pr(t, 1.5, 1.9)); ctx.globalAlpha = outA(t) * ap; ctx.fillStyle = '#E5D3C0'; ctx.beginPath(); ctx.arc(box.x + 5 * u, y + 9 * u, 5 * u, 0, 7); ctx.fill(); txt(ctx, 'MS', box.x + 5 * u, y + 10.4 * u, IN(700)(3.6 * u), '#7A5A3A', 'center'); txt(ctx, 'Marina Souza', box.x + 13 * u, y + 8.4 * u, IN(700)(3.6 * u), FINK); txt(ctx, 'Doceria Vó Lurdes', box.x + 13 * u, y + 12.6 * u, IN(500)(3 * u), '#8A7A6A');
  const n = Math.round(1200 * eio(pr(t, 2.0, 3.0))); ctx.globalAlpha = outA(t) * eo(pr(t, 2.0, 2.3)); const ny = L.o === 'h' ? H * 0.86 : y + 30 * u; txt(ctx, `+${n.toLocaleString('pt-BR')}`, box.x, ny, IN(800)(9 * u), '#E07A2F'); txt(ctx, 'clientes atendidos', box.x + fitSize(ctx, '+1.200', IN(800), 9 * u, W) * 3.3, ny, IN(500)(3.4 * u), '#8A7A6A');
};
// antes e depois
ST.f_antesdepois = (ctx, t, L) => {
  const { W, H, u } = L; const split = W * lerp(0.92, 0.5, eio(pr(t, 0.8, 1.8)));
  ctx.fillStyle = '#E4E2DF'; ctx.fillRect(0, 0, W, H); const r = seeded(5);
  for (let i = 0; i < 9; i++) { const x = r() * W * 0.85, y = H * 0.3 + r() * H * 0.5, w = 14 * u, h = 18 * u; ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate((r() - 0.5) * 1.2 + Math.sin(t * 3 + i) * 0.03); ctx.fillStyle = '#FFF'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.fillStyle = '#C9C5BF'; for (let k = 0; k < 4; k++) ctx.fillRect(-w / 2 + 2 * u, -h / 2 + 3 * u + k * 3 * u, w * 0.6, 0.8 * u); ctx.restore(); }
  txt(ctx, 'ANTES', 5 * u, 10 * u, IN(800)(5 * u), '#8A847C');
  ctx.save(); ctx.beginPath(); ctx.rect(split, 0, W - split, H); ctx.clip(); ctx.fillStyle = '#EEF6FF'; ctx.fillRect(0, 0, W, H);
  const lx = Math.max(split + 6 * u, W * 0.56); const items = ['Pedidos organizados', 'Estoque em dia', 'Clientes respondidos']; items.forEach((s, i) => { const y = H * 0.38 + i * 11 * u; const p = back(pr(t, 1.8 + i * 0.25, 2.2 + i * 0.25)); ctx.fillStyle = '#FFF'; rr(ctx, lx, y - 5 * u, W - lx - 5 * u, 9 * u, 1.6 * u); ctx.fill(); if (p > 0) { ctx.save(); ctx.translate(lx + 4.5 * u, y - 0.5 * u); ctx.scale(p, p); ctx.fillStyle = '#22A06B'; ctx.beginPath(); ctx.arc(0, 0, 2.4 * u, 0, 7); ctx.fill(); ctx.restore(); } txt(ctx, s, lx + 9 * u, y + 0.8 * u, IN(600)(fitSize(ctx, s, IN(600), 3.4 * u, W - lx - 16 * u)), FINK); });
  txt(ctx, 'DEPOIS', W - 5 * u, 10 * u, IN(800)(5 * u), '#2563EB', 'right'); ctx.restore();
  ctx.fillStyle = '#FFF'; ctx.fillRect(split - 0.4 * u, 0, 0.8 * u, H); ctx.beginPath(); ctx.arc(split, H / 2, 4 * u, 0, 7); ctx.fill(); ctx.fillStyle = FINK; txt(ctx, '‹ ›', split, H / 2 + 1.4 * u, IN(800)(4 * u), FINK, 'center');
  ctx.fillStyle = `rgba(0,0,0,${1 - outA(t)})`; ctx.fillRect(0, 0, W, H);
};
// revelação de logo
ST.f_logo = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#101014'; ctx.fillRect(0, 0, W, H); const A = outA(t); ctx.globalAlpha = A; const cx = W / 2, cy = H * 0.44, R = Math.min(W, H) * 0.12;
  const pieces = [[-1, -1, '#FF5A36'], [1, -1, '#FFB627'], [1, 1, '#6D4AFF'], [-1, 1, '#2BD1FF']];
  pieces.forEach(([sx, sy, c], i) => { const p = back(pr(t, 0.1 + i * 0.12, 0.9 + i * 0.12)); const d = (1 - p) * Math.max(W, H) * 0.6; ctx.save(); ctx.translate(cx + sx * (R * 0.55 + d), cy + sy * (R * 0.55 + d)); ctx.rotate((1 - p) * 3 * sx); ctx.fillStyle = c; rr(ctx, -R * 0.5, -R * 0.5, R, R, R * 0.28); ctx.fill(); ctx.restore(); });
  const fl = Math.max(0, 1 - Math.abs(t - 1.35) / 0.15); if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl * 0.5})`; ctx.beginPath(); ctx.arc(cx, cy, R * 2.2 * (1 + (t - 1.2) * 2), 0, 7); ctx.fill(); }
  const word = 'SUA MARCA'; const s = fitSize(ctx, word, IN(800), 9 * u, W * 0.8); const sp = lerp(2.4 * u, 0.6 * u, eio(pr(t, 1.4, 2.4))); ctx.font = IN(800)(s); let tw = 0; for (const ch of word) tw += ctx.measureText(ch).width + sp; let x = cx - tw / 2;
  for (const [i, ch] of [...word].entries()) { const p = eo(pr(t, 1.4 + i * 0.05, 1.8 + i * 0.05)); ctx.globalAlpha = A * p; txt(ctx, ch, x, cy + R * 1.9 + (1 - p) * 3 * u, IN(800)(s), '#FFF'); x += ctx.measureText(ch).width + sp; }
  ctx.globalAlpha = A * eo(pr(t, 2.3, 2.7)); txt(ctx, 'desde 2026', cx, cy + R * 1.9 + s * 0.9, SER(s * 0.5), '#B9B6C8', 'center'); ctx.globalAlpha = 1;
};
// mapa animado
ST.f_mapa = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#EEF1E6'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t); const r = seeded(21);
  ctx.fillStyle = '#D8E4C8'; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.ellipse(r() * W, r() * H, 10 * u + r() * 14 * u, 6 * u + r() * 8 * u, r(), 0, 7); ctx.fill(); }
  ctx.fillStyle = '#BFD9F2'; ctx.beginPath(); ctx.moveTo(0, H * 0.78); ctx.bezierCurveTo(W * 0.3, H * 0.7, W * 0.6, H * 0.95, W, H * 0.82); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
  ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.6 * u; for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(0, H * i / 6 + Math.sin(i) * 4 * u); ctx.lineTo(W, H * i / 6 - Math.cos(i) * 5 * u); ctx.stroke(); ctx.beginPath(); ctx.moveTo(W * i / 6, 0); ctx.lineTo(W * i / 6 + Math.sin(i * 2) * 6 * u, H); ctx.stroke(); }
  const pts = [[0.18, 0.3], [0.45, 0.42], [0.7, 0.28], [0.8, 0.62]].map(([x, y]) => [W * x, H * y]);
  const lp = eio(pr(t, 1.0, 2.6)); ctx.strokeStyle = '#FF5A36'; ctx.lineWidth = 1 * u; ctx.setLineDash([2 * u, 1.6 * u]); ctx.beginPath(); let Lt = 0; for (let i = 1; i < pts.length; i++) Lt += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); let rem = Lt * lp; ctx.moveTo(pts[0][0], pts[0][1]); let truck = pts[0];
  for (let i = 1; i < pts.length && rem > 0; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]), f = Math.min(1, rem / d); truck = [lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]; ctx.lineTo(truck[0], truck[1]); rem -= d; } ctx.stroke(); ctx.setLineDash([]);
  pts.forEach(([x, y], i) => { const p = back(pr(t, 0.2 + i * 0.2, 0.6 + i * 0.2)); if (p <= 0) return; ctx.save(); ctx.translate(x, y - (1 - p) * 10 * u); ctx.scale(p, p); ctx.fillStyle = i === 0 ? '#1C1B1F' : '#FF5A36'; ctx.beginPath(); ctx.arc(0, -5 * u, 3.2 * u, Math.PI, 0); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(0, -5 * u, 1.2 * u, 0, 7); ctx.fill(); ctx.restore(); });
  if (lp > 0 && lp < 1) { ctx.fillStyle = '#1C1B1F'; rr(ctx, truck[0] - 2.4 * u, truck[1] - 1.6 * u, 4.8 * u, 3.2 * u, 0.6 * u); ctx.fill(); }
  const cp = back(pr(t, 2.6, 3.0)); if (cp > 0) { const cw = Math.min(W * 0.7, 56 * u), ch = 11 * u; ctx.save(); ctx.translate(W / 2, H * 0.1 + ch / 2); ctx.scale(cp, cp); shadow(ctx, 'rgba(0,0,0,0.15)', 14, 0, 6); ctx.fillStyle = '#FFF'; rr(ctx, -cw / 2, -ch / 2, cw, ch, 2 * u); ctx.fill(); noShadow(ctx); txt(ctx, 'Entrega em toda a cidade', 0, 1.2 * u, IN(700)(fitSize(ctx, 'Entrega em toda a cidade', IN(700), 4 * u, cw * 0.86)), FINK, 'center'); ctx.restore(); }
};
// lista / passo a passo
ST.f_lista = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  const tb = L.o === 'h' ? { x: W * 0.07, y: H * 0.14, w: W * 0.4 } : { x: W * 0.08, y: H * 0.08, w: W * 0.84 };
  heading(ctx, tb, [{ s: '3 erros que', f: IN(800), c: FINK, at: 0 }, { s: 'travam suas vendas', f: IN(800), c: '#E5484D', at: 0.15 }], t, L.o === 'h' ? 9 * u : 8.6 * u, 'mask');
  const lb = L.o === 'h' ? { x: W * 0.52, y: H * 0.18, w: W * 0.42 } : { x: W * 0.08, y: H * (L.o === 'v' ? 0.36 : 0.4), w: W * 0.84 };
  const items = ['Demorar para responder', 'Não ter preço claro', 'Esquecer o pós-venda']; const gap = L.o === 'h' ? 21 * u : L.o === 'v' ? 30 * u : 17 * u;
  items.forEach((s, i) => { const y = lb.y + i * gap; const p = ex(pr(t, 0.7 + i * 0.5, 1.1 + i * 0.5)); if (p <= 0) return; ctx.save(); ctx.globalAlpha *= p; ctx.translate((1 - p) * 10 * u, 0);
    ctx.fillStyle = '#E5484D'; rr(ctx, lb.x, y + 3.4 * u, 10 * u, 10 * u, 2.4 * u); ctx.fill(); txt(ctx, `${i + 1}`, lb.x + 5 * u, y + 10.4 * u, IN(800)(5.6 * u), '#FFF', 'center');
    const sz = fitSize(ctx, s, IN(700), 5 * u, lb.w - 14 * u); txt(ctx, s, lb.x + 14 * u, y + 11 * u, IN(700)(sz), FINK); ctx.restore(); });
};
// contagem regressiva / evento
ST.f_contagem = (ctx, t, L) => {
  const { W, H, u } = L; const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1B1035'); g.addColorStop(1, '#3B1C6B'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  heading(ctx, { x: W * 0.08, y: H * (L.o === 'h' ? 0.1 : 0.12), w: W * 0.84 }, [{ s: 'Black Friday', f: IN(800), c: '#FFF', at: 0 }, { s: 'começa em', f: SER, k: 0.9, c: '#C9B8FF', at: 0.2 }], t, L.o === 'h' ? 9 * u : 10 * u, 'rise', 'center');
  const left = Math.max(0, 3 - Math.floor(t * 1.0)); const units = [[String(left).padStart(2, '0'), 'dias'], ['14', 'horas'], [String(59 - Math.floor(t * 8) % 60).padStart(2, '0'), 'min'], [String(59 - Math.floor(t * 30) % 60).padStart(2, '0'), 'seg']];
  const bw = Math.min(W * 0.2, 22 * u), gap = 2.4 * u, total = units.length * bw + (units.length - 1) * gap, x0 = (W - total) / 2, y0 = H * (L.o === 'h' ? 0.45 : 0.42);
  units.forEach(([n, l], i) => { const p = back(pr(t, 0.4 + i * 0.12, 0.8 + i * 0.12)); if (p <= 0) return; const x = x0 + i * (bw + gap); ctx.save(); ctx.translate(x + bw / 2, y0 + bw * 0.6); ctx.scale(p, p); ctx.fillStyle = 'rgba(255,255,255,0.1)'; rr(ctx, -bw / 2, -bw * 0.6, bw, bw * 1.2, 1.6 * u); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-bw / 2, -0.15 * u, bw, 0.3 * u); txt(ctx, n, 0, bw * 0.18, IN(800)(bw * 0.52), '#FFF', 'center'); txt(ctx, l, 0, bw * 0.5, IN(500)(bw * 0.15), '#C9B8FF', 'center'); ctx.restore(); });
  const cp = back(pr(t, 1.4, 1.8)); if (cp > 0) { const cw = Math.min(W * 0.7, 58 * u), ch = 10 * u; ctx.save(); ctx.translate(W / 2, y0 + bw * 1.2 + 10 * u); ctx.scale(cp, cp); ctx.fillStyle = '#FFD23F'; rr(ctx, -cw / 2, -ch / 2, cw, ch, ch / 2); ctx.fill(); txt(ctx, 'Ative o lembrete', 0, ch * 0.16, IN(800)(ch * 0.4), '#1B1035', 'center'); ctx.restore(); }
};
STYLE_LIST.push(['lineicons', 'Ícones de linha', 'Explicativos, benefícios, passo a passo'], ['papercraft', 'Papercraft', 'Marcas acolhedoras, educação infantil']);
const FORMAT_LIST = [
  ['livre', 'Livre', 'A IA monta a estrutura a partir do pedido'], ['f_whatsapp', 'Conversa de WhatsApp', 'Mostrar atendimento e automação'], ['f_vitrine', 'Vitrine de produtos', 'E-commerce, catálogo, ofertas'],
  ['f_depoimento', 'Depoimento e avaliações', 'Prova social que converte'], ['f_antesdepois', 'Antes e depois', 'Mostrar a transformação'], ['f_logo', 'Revelação de logo', 'Abertura e fechamento de marca'],
  ['f_mapa', 'Mapa animado', 'Entregas, unidades, área de atendimento'], ['f_lista', 'Lista / passo a passo', 'Conteúdo educativo que gera salvamento'], ['f_contagem', 'Contagem regressiva', 'Lançamentos, promoções com prazo, eventos'],
];
ST.livre = (ctx, t, L) => { const { W, H, u } = L; ctx.fillStyle = '#F4F4F6'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t); const n = 4; for (let i = 0; i < n; i++) { const p = eo(pr(t, 0.2 + i * 0.3, 0.6 + i * 0.3)); const bw = W * 0.18, x = W * 0.1 + i * (W * 0.8 - bw) / (n - 1), y = H * 0.4; ctx.globalAlpha = outA(t) * p; ctx.fillStyle = ['#6D4AFF', '#FF5A36', '#22A06B', '#FFB627'].at(i); rr(ctx, x, y - (1 - p) * 4 * u, bw, bw * (L.o === 'v' ? 1.6 : 1), 1.6 * u); ctx.fill(); } ctx.globalAlpha = outA(t); txt(ctx, 'a IA escolhe a estrutura', W / 2, H * 0.3, IN(700)(fitSize(ctx, 'a IA escolhe a estrutura', IN(700), 6 * u, W * 0.8)), FINK, 'center'); };

// ================= estilos corporativos =================
// Corporativo clean
ST.corp = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  const NAVY = '#0B2545', ACC = '#13A3D8';
  ctx.fillStyle = NAVY; ctx.fillRect(0, 0, W * eio(pr(t, 0, 0.6)), 1.2 * u);
  const tb = { ...L.text }; ctx.fillStyle = ACC; ctx.fillRect(tb.x, tb.y - 4 * u, 8 * u * eo(pr(t, 0.2, 0.7)), 0.8 * u);
  const y = heading(ctx, tb, [{ s: 'Soluções que', f: IN(700), c: NAVY, at: 0.25 }, { s: 'fazem a diferença.', f: IN(300), c: NAVY, at: 0.4 }], t, L.base * 0.85);
  inBox(ctx, L.vis, 400, 300, () => {
    const items = [['Eficiência', 38, '%'], ['Clientes', 1200, '+'], ['Anos', 15, '']];
    items.forEach(([lab, v, suf], i) => { const p = eo(pr(t, 0.8 + i * 0.25, 1.6 + i * 0.25)); const yy = 20 + i * 95; ctx.globalAlpha = outA(t) * p;
      ctx.strokeStyle = '#DCE3EC'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, yy + 78); ctx.lineTo(400 * p, yy + 78); ctx.stroke();
      const n = Math.round(v * eio(pr(t, 0.9 + i * 0.25, 2.2 + i * 0.25))); txt(ctx, `${n.toLocaleString('pt-BR')}${suf}`, 0, yy + 55, IN(300)(56), NAVY);
      txt(ctx, lab.toUpperCase(), 400, yy + 55, IN(600)(15), ACC, 'right'); });
  });
  ctx.globalAlpha = outA(t);
};
// Relatório executivo
ST.exec = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#F6F7F9'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  const INK = '#111827', G = '#12A150', R = '#D93A3A';
  heading(ctx, L.text, [{ s: 'Resultados Q3', f: IN(800), c: INK, at: 0 }, { s: 'receita +24% no ano', f: IN(500), k: 0.55, c: '#6B7280', at: 0.2 }], t, L.base * 0.85);
  inBox(ctx, L.vis, 420, 320, () => {
    const kp = [['Receita', 'R$ 4,2 mi', '+24%', G], ['Margem', '31%', '+3 p.p.', G], ['Custo', 'R$ 1,1 mi', '−6%', G]];
    kp.forEach(([l, v, d, c], i) => { const p = back(pr(t, 0.4 + i * 0.15, 0.8 + i * 0.15)); const x = i * 142; ctx.save(); ctx.translate(x + 64, 40); ctx.scale(p, p); ctx.translate(-64, -40);
      ctx.fillStyle = '#FFF'; shadow(ctx, 'rgba(0,0,0,0.06)', 10, 0, 3); rr(ctx, 0, 0, 128, 80, 8); ctx.fill(); noShadow(ctx);
      txt(ctx, l, 12, 22, IN(500)(12), '#6B7280'); txt(ctx, v, 12, 50, IN(800)(19), INK); txt(ctx, (d[0] === '−' ? '▼ ' : '▲ ') + d, 12, 70, IN(700)(12), c); ctx.restore(); });
    ctx.fillStyle = '#FFF'; rr(ctx, 0, 100, 420, 220, 8); ctx.fill(); txt(ctx, 'Receita por trimestre', 16, 126, IN(600)(13), INK);
    const vals = [52, 61, 58, 74, 88, 96]; const bw = 40, gap = 24, x0 = 30, base = 296; const gp = eio(pr(t, 1.0, 2.2));
    ctx.strokeStyle = '#EEF0F3'; ctx.lineWidth = 1; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(16, base - k * 45); ctx.lineTo(404, base - k * 45); ctx.stroke(); }
    vals.forEach((v, i) => { const h = v * 1.6 * eo(pr(gp, i * 0.1, 0.5 + i * 0.1)); ctx.fillStyle = i === vals.length - 1 ? '#2563EB' : '#C7D2E3'; ctx.fillRect(x0 + i * (bw + gap), base - h, bw, h); txt(ctx, `T${i + 1}`, x0 + i * (bw + gap) + bw / 2, base + 16, IN(500)(11), '#6B7280', 'center'); });
    const lp = eo(pr(t, 2.2, 2.6)); if (lp > 0) { ctx.globalAlpha = outA(t) * lp; const lx = x0 + 5 * (bw + gap) + bw / 2, ly = base - 96 * 1.6 - 14; ctx.fillStyle = INK; rr(ctx, lx - 30, ly - 22, 60, 20, 4); ctx.fill(); txt(ctx, '+24%', lx, ly - 8, IN(700)(11), '#FFF', 'center'); ctx.globalAlpha = outA(t); }
  });
};
// Rede global
ST.globe = (ctx, t, L) => {
  const { W, H, u } = L; const g = ctx.createRadialGradient(W * 0.6, H * 0.5, 0, W * 0.6, H * 0.5, Math.max(W, H)); g.addColorStop(0, '#0E2A4F'); g.addColorStop(1, '#050B18'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  const box = L.vis; const R = Math.min(box.w, box.h) * 0.46, cx = box.x + box.w / 2, cy = box.y + box.h / 2; const rot = t * 0.35; const ap = eo(pr(t, 0, 0.8));
  ctx.strokeStyle = 'rgba(90,170,255,0.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, R * ap, 0, 7); ctx.stroke();
  const P = (lat, lon) => { const la = lat * Math.PI / 180, lo = lon * Math.PI / 180 + rot; const x = Math.cos(la) * Math.sin(lo), y = Math.sin(la), z = Math.cos(la) * Math.cos(lo); return [cx + x * R * ap, cy - y * R * ap, z]; };
  for (let la = -78; la <= 78; la += 5) for (let lo = -180; lo < 180; lo += 5) { const land = Math.sin(la * 0.06 + lo * 0.045) + Math.cos(lo * 0.08 - la * 0.035) + Math.sin(lo * 0.21 + la * 0.13) * 0.35 > 0.35; const [x, y, z] = P(la, lo); if (z < 0) continue; ctx.fillStyle = land ? `rgba(110,190,255,${0.25 + z * 0.55})` : `rgba(110,190,255,${0.06 + z * 0.08})`; ctx.fillRect(x - 0.9, y - 0.9, land ? 2.2 : 1.4, land ? 2.2 : 1.4); }
  const cities = [[-23.5, -46.6], [40.7, -74], [51.5, -0.1], [35.7, 139.7], [1.3, 103.8], [-33.9, 18.4], [19.4, -99.1]];
  const pts = cities.map(([a, b]) => P(a, b));
  [[0, 1], [0, 2], [0, 5], [2, 3], [1, 6], [2, 4]].forEach(([a, b], i) => { const p = eio(pr(t, 0.8 + i * 0.2, 1.8 + i * 0.2)); if (p <= 0) return; const A = pts[a], B = pts[b]; if (A[2] < -0.2 || B[2] < -0.2) return; const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2 - R * 0.35; ctx.strokeStyle = '#FFB547'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(A[0], A[1]); const N = 24; for (let k = 1; k <= N * p; k++) { const s = k / N; ctx.lineTo((1 - s) ** 2 * A[0] + 2 * (1 - s) * s * mx + s * s * B[0], (1 - s) ** 2 * A[1] + 2 * (1 - s) * s * my + s * s * B[1]); } ctx.stroke(); });
  pts.forEach(([x, y, z], i) => { if (z < 0) return; const p = back(pr(t, 0.5 + i * 0.1, 0.9 + i * 0.1)); const pulse = (t * 1.2 + i * 0.3) % 1; ctx.strokeStyle = `rgba(255,181,71,${(1 - pulse) * 0.8})`; ctx.beginPath(); ctx.arc(x, y, 2 * u * pulse * p, 0, 7); ctx.stroke(); ctx.fillStyle = '#FFB547'; ctx.beginPath(); ctx.arc(x, y, 0.7 * u * p, 0, 7); ctx.fill(); });
  heading(ctx, L.text, [{ s: 'Conectando', f: IN(700), c: '#FFFFFF', at: 0.3 }, { s: 'o Brasil ao mundo.', f: IN(300), c: '#9CC8FF', at: 0.5 }], t, L.base * 0.85);
};
// Premium monocromático
ST.premium = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#121212'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  const GOLD = '#C9A96E'; const cx = W / 2;
  const lp = eio(pr(t, 0.2, 1.4)); ctx.strokeStyle = GOLD; ctx.lineWidth = Math.max(1, 0.25 * u);
  const fw = Math.min(W, H) * 0.86 * (L.o === 'v' ? 0.95 : 1), fh = L.o === 'h' ? H * 0.72 : L.o === 'v' ? H * 0.62 : H * 0.8, fx = cx - fw / 2, fy = H / 2 - fh / 2;
  const per = 2 * (fw + fh), d = per * lp; ctx.beginPath(); ctx.moveTo(fx, fy); const seg = [[fx + fw, fy], [fx + fw, fy + fh], [fx, fy + fh], [fx, fy]]; let rem = d, px = fx, py = fy;
  for (const [x, y] of seg) { const len = Math.hypot(x - px, y - py); if (rem <= 0) break; const f = Math.min(1, rem / len); ctx.lineTo(px + (x - px) * f, py + (y - py) * f); rem -= len; px = x; py = y; } ctx.stroke();
  const a1 = eo(pr(t, 0.9, 1.8)); ctx.globalAlpha = outA(t) * a1; const sp = lerp(1.6 * u, 0.9 * u, a1);
  const lab = 'E S C R I T Ó R I O'; txt(ctx, lab, cx, H / 2 - fh * 0.18, IN(300)(fitSize(ctx, lab, IN(300), 2.8 * u, fw * 0.8)), GOLD, 'center');
  const a2 = eo(pr(t, 1.3, 2.3)); ctx.globalAlpha = outA(t) * a2; const s = fitSize(ctx, 'Excelência', SER, 15 * u, fw * 0.8); txt(ctx, 'Excelência', cx, H / 2 + s * 0.25 + (1 - a2) * 2 * u, SER(s), '#F2EDE4', 'center');
  const a3 = eo(pr(t, 1.9, 2.6)); ctx.globalAlpha = outA(t) * a3; ctx.fillStyle = GOLD; ctx.fillRect(cx - 6 * u * a3, H / 2 + s * 0.55, 12 * u * a3, Math.max(1, 0.25 * u));
  txt(ctx, 'desde 1998', cx, H / 2 + s * 0.55 + 6 * u, IN(300)(3 * u), '#8E8A82', 'center');
  const sh = (t * 0.4) % 1.6 - 0.3; if (sh > 0 && sh < 1) { ctx.globalAlpha = outA(t) * 0.12; const gg = ctx.createLinearGradient(W * sh - W * 0.15, 0, W * sh + W * 0.15, H); gg.addColorStop(0, 'rgba(201,169,110,0)'); gg.addColorStop(0.5, 'rgba(201,169,110,1)'); gg.addColorStop(1, 'rgba(201,169,110,0)'); ctx.fillStyle = gg; ctx.fillRect(0, 0, W, H); }
  ctx.globalAlpha = 1;
};
// Linha do tempo institucional
ST.timeline = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#F7F5F0'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  const INK = '#1F2A44', ACC = '#E0662F';
  heading(ctx, { x: W * 0.08, y: H * (L.o === 'v' ? 0.1 : 0.12), w: W * 0.84 }, [{ s: 'Nossa história', f: IN(800), c: INK, at: 0 }], t, L.o === 'h' ? 8 * u : 9 * u);
  const ms = [['2009', 'Fundação'], ['2014', '1ª filial'], ['2019', '+500 clientes'], ['2026', 'Presença nacional']];
  const prog = eio(pr(t, 0.5, 3.0));
  if (L.o === 'v') { const x = W * 0.2, y0 = H * 0.3, y1 = H * 0.9; ctx.strokeStyle = '#D9D3C7'; ctx.lineWidth = 0.6 * u; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke(); ctx.strokeStyle = ACC; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, lerp(y0, y1, prog)); ctx.stroke();
    ms.forEach(([y, l], i) => { const f = (i + 0.3) / ms.length, yy = lerp(y0, y1, f); const on = prog >= f; const p = back(pr(prog, f - 0.02, f + 0.12)); ctx.fillStyle = on ? ACC : '#D9D3C7'; ctx.beginPath(); ctx.arc(x, yy, 2.2 * u * (0.6 + 0.4 * p), 0, 7); ctx.fill(); ctx.globalAlpha = outA(t) * Math.max(0.15, p); txt(ctx, y, x + 7 * u, yy - 1 * u, IN(800)(8 * u), on ? INK : '#B8B1A4'); txt(ctx, l, x + 7 * u, yy + 6 * u, IN(500)(4.6 * u), '#6B6559'); ctx.globalAlpha = outA(t); }); }
  else { const y = H * 0.58, x0 = W * 0.08, x1 = W * 0.92; ctx.strokeStyle = '#D9D3C7'; ctx.lineWidth = 0.6 * u; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke(); ctx.strokeStyle = ACC; ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(lerp(x0, x1, prog), y); ctx.stroke();
    ms.forEach(([yr, l], i) => { const f = (i + 0.4) / ms.length, xx = lerp(x0, x1, f); const on = prog >= f; const p = back(pr(prog, f - 0.02, f + 0.12)); ctx.fillStyle = on ? ACC : '#D9D3C7'; ctx.beginPath(); ctx.arc(xx, y, 1.8 * u * (0.6 + 0.4 * p), 0, 7); ctx.fill(); ctx.globalAlpha = outA(t) * Math.max(0.15, p); const up = i % 2 === 0; const cw = (x1 - x0) / ms.length * 0.9;
      txt(ctx, yr, xx, up ? y - 9 * u : y + 13 * u, IN(800)(fitSize(ctx, yr, IN(800), 7 * u, cw)), on ? INK : '#B8B1A4', 'center'); txt(ctx, l, xx, up ? y - 4 * u : y + 18 * u, IN(500)(fitSize(ctx, l, IN(500), 3.6 * u, cw)), '#6B6559', 'center'); ctx.globalAlpha = outA(t); }); }
};
// Painel SaaS em vidro
ST.glass = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#0B1020'; ctx.fillRect(0, 0, W, H);
  const blob = (x, y, r, c) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, c); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); };
  blob(W * (0.3 + Math.sin(t * 0.8) * 0.05), H * 0.35, Math.max(W, H) * 0.45, 'rgba(124,92,255,0.55)'); blob(W * 0.8, H * (0.75 + Math.cos(t * 0.7) * 0.05), Math.max(W, H) * 0.4, 'rgba(0,200,255,0.4)');
  ctx.globalAlpha = outA(t);
  const card = (x, y, w, h, at, fn) => { const p = eo(pr(t, at, at + 0.6)); if (p <= 0) return; ctx.save(); ctx.globalAlpha = outA(t) * p; ctx.translate(0, (1 - p) * 4 * u); shadow(ctx, 'rgba(0,0,0,0.35)', 3 * u, 0, u); ctx.fillStyle = 'rgba(255,255,255,0.09)'; rr(ctx, x, y, w, h, 2.4 * u); ctx.fill(); noShadow(ctx); ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1; rr(ctx, x + 0.5, y + 0.5, w - 1, h - 1, 2.4 * u); ctx.stroke(); fn(x, y, w, h); ctx.restore(); };
  heading(ctx, L.text, [{ s: 'Tudo em', f: IN(700), c: '#FFFFFF', at: 0 }, { s: 'um só painel.', f: IN(300), c: '#C9C2FF', at: 0.2 }], t, L.base * 0.85);
  const b = L.vis; const gap = 2.5 * u; const w2 = (b.w - gap) / 2, h1 = b.h * 0.42;
  card(b.x, b.y, b.w, h1, 0.4, (x, y, w, h) => { txt(ctx, 'Vendas hoje', x + 3 * u, y + 5.5 * u, IN(500)(3 * u), '#C9D2E8'); const n = Math.round(48920 * eio(pr(t, 0.6, 1.8))); txt(ctx, 'R$ ' + n.toLocaleString('pt-BR'), x + 3 * u, y + 13 * u, IN(700)(fitSize(ctx, 'R$ 48.920', IN(700), 7 * u, w * 0.6)), '#FFF');
    const lp = eio(pr(t, 0.9, 2.4)); ctx.strokeStyle = '#7CE7FF'; ctx.lineWidth = 0.5 * u; ctx.beginPath(); for (let i = 0; i <= 30 * lp; i++) { const xx = x + 3 * u + i / 30 * (w - 6 * u), yy = y + h - 4 * u - (Math.sin(i * 0.5) * 0.25 + i / 30 * 0.6 + 0.15) * (h - 18 * u); i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); });
  card(b.x, b.y + h1 + gap, w2, b.h - h1 - gap, 0.7, (x, y, w, h) => { txt(ctx, 'Conversão', x + 3 * u, y + 5.5 * u, IN(500)(3 * u), '#C9D2E8'); const p = eio(pr(t, 1.0, 2.2)); const r = Math.min(w, h) * 0.28, ccx = x + w / 2, ccy = y + h * 0.6; ctx.lineWidth = 1.4 * u; ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.arc(ccx, ccy, r, 0, 7); ctx.stroke(); ctx.strokeStyle = '#A78BFA'; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(ccx, ccy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.68 * p); ctx.stroke(); ctx.lineCap = 'butt'; txt(ctx, Math.round(68 * p) + '%', ccx, ccy + 1.6 * u, IN(700)(r * 0.5), '#FFF', 'center'); });
  card(b.x + w2 + gap, b.y + h1 + gap, w2, b.h - h1 - gap, 0.9, (x, y, w, h) => { txt(ctx, 'Pedidos', x + 3 * u, y + 5.5 * u, IN(500)(3 * u), '#C9D2E8'); [0.5, 0.8, 0.6, 1, 0.75].forEach((v, i) => { const p = eo(pr(t, 1.2 + i * 0.1, 1.8 + i * 0.1)); const bw = (w - 6 * u) / 5 * 0.6, bh = (h - 12 * u) * v * p; ctx.fillStyle = i === 3 ? '#7CE7FF' : 'rgba(255,255,255,0.3)'; rr(ctx, x + 3 * u + i * (w - 6 * u) / 5, y + h - 3 * u - bh, bw, bh, 0.6 * u); ctx.fill(); }); });
};
// Financeiro / mercado
ST.finance = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#0A0F14'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  const G = '#22C55E', R = '#EF4444';
  const tk = [['IBOV', '+1,24%', G], ['PETR4', '+0,85%', G], ['VALE3', '−0,42%', R], ['USD', '−0,31%', R], ['ITUB4', '+1,10%', G], ['BTC', '+2,40%', G]];
  const th = 6 * u; ctx.fillStyle = '#121A22'; ctx.fillRect(0, H - th, W, th); ctx.font = MONO(2.8 * u); let tw = 0; const parts = tk.map(([a, b, c]) => { const s = `${a} ${b}`; const w = ctx.measureText(s).width + 6 * u; tw += w; return [a, b, c, w]; });
  let x = -((t * 9 * u) % tw); for (let r = 0; r < 3; r++) for (const [a, b, c, w] of parts) { if (x > W) break; txt(ctx, a, x, H - th / 2 + u, MONO(2.8 * u), '#9AA7B4'); ctx.font = MONO(2.8 * u); txt(ctx, b, x + ctx.measureText(a + ' ').width, H - th / 2 + u, MONO(2.8 * u), c); x += w; }
  heading(ctx, L.text, [{ s: 'Seu dinheiro', f: IN(700), c: '#FFFFFF', at: 0 }, { s: 'rendendo mais.', f: IN(300), c: G, at: 0.2 }], t, L.base * 0.85);
  const b = { ...L.vis, h: L.vis.h - (L.o === 'h' ? 6 * u : 2 * u) }; const N = 18; const r = seeded(9); let v = 50; const data = []; for (let i = 0; i < N; i++) { const o = v; v += (r() - 0.38) * 9; const hi = Math.max(o, v) + r() * 4, lo = Math.min(o, v) - r() * 4; data.push([o, v, hi, lo]); }
  const mn = Math.min(...data.map(d => d[3])), mx = Math.max(...data.map(d => d[2])); const Y = q => b.y + b.h - (q - mn) / (mx - mn) * b.h; const cw = b.w / N;
  ctx.strokeStyle = '#18222C'; ctx.lineWidth = 1; for (let k = 0; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(b.x, b.y + k * b.h / 4); ctx.lineTo(b.x + b.w, b.y + k * b.h / 4); ctx.stroke(); }
  data.forEach(([o, c, hi, lo], i) => { const p = eo(pr(t, 0.4 + i * 0.09, 0.7 + i * 0.09)); if (p <= 0) return; const col = c >= o ? G : R; const xx = b.x + i * cw + cw / 2; const mid = (Y(o) + Y(c)) / 2; ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(xx, lerp(mid, Y(hi), p)); ctx.lineTo(xx, lerp(mid, Y(lo), p)); ctx.stroke(); ctx.fillStyle = col; const y1 = lerp(mid, Math.min(Y(o), Y(c)), p), y2 = lerp(mid, Math.max(Y(o), Y(c)), p); ctx.fillRect(xx - cw * 0.3, y1, cw * 0.6, Math.max(1, y2 - y1)); });
  const last = data.findLastIndex((d, i) => pr(t, 0.4 + i * 0.09, 0.7 + i * 0.09) >= 1); if (last >= 0) { const yy = Y(data[last][1]); ctx.setLineDash([u, u]); ctx.strokeStyle = 'rgba(34,197,94,0.6)'; ctx.beginPath(); ctx.moveTo(b.x, yy); ctx.lineTo(b.x + b.w, yy); ctx.stroke(); ctx.setLineDash([]); const lab = (data[last][1] * 0.82).toFixed(2).replace('.', ','); ctx.fillStyle = G; rr(ctx, b.x + b.w - 11 * u, yy - 2.4 * u, 11 * u, 4.8 * u, 0.8 * u); ctx.fill(); txt(ctx, lab, b.x + b.w - 5.5 * u, yy + 1.1 * u, MONO(2.8 * u), '#04120A', 'center'); }
};
STYLE_LIST.push(['corp', 'Corporativo clean', 'Serviços B2B, institucional, consultoria'], ['exec', 'Relatório executivo', 'Resultados, prestação de contas, reunião de diretoria'], ['globe', 'Rede global', 'Logística, tecnologia, presença e parcerias'], ['premium', 'Premium monocromático', 'Advocacia, imóveis de alto padrão, finanças'], ['timeline', 'Linha do tempo', 'História da empresa, aniversário de marca, onboarding'], ['glass', 'Painel SaaS em vidro', 'Plataformas, dashboards, software'], ['finance', 'Financeiro / mercado', 'Fintechs, investimentos, contabilidade']);

// ================= estilos praianos =================
// Praia: céu, sol, mar em camadas ondulando, areia, guarda-sol
ST.praia = (ctx, t, L) => {
  const { W, H, u } = L; const sky = ctx.createLinearGradient(0, 0, 0, H * 0.6); sky.addColorStop(0, '#7FD3E8'); sky.addColorStop(1, '#FFE3B8'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  const horizon = H * (L.o === 'h' ? 0.56 : 0.6);
  const sp = eo(pr(t, 0, 1.0)); const sr = Math.min(W, H) * 0.13; const sx = L.o === 'h' ? W * 0.74 : W * 0.72, sy = horizon - sr * 0.4 - sp * H * 0.14;
  ctx.fillStyle = 'rgba(255,200,87,0.35)'; ctx.beginPath(); ctx.arc(sx, sy, sr * (1.35 + Math.sin(t * 2) * 0.04), 0, 7); ctx.fill(); ctx.fillStyle = '#FFB547'; ctx.beginPath(); ctx.arc(sx, sy, sr, 0, 7); ctx.fill();
  const wave = (y0, amp, len, speed, col, ph) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W + 4; x += 4) ctx.lineTo(x, y0 + Math.sin(x / len + t * speed + ph) * amp); ctx.lineTo(W, H); ctx.closePath(); ctx.fill(); };
  const wp = eo(pr(t, 0.2, 1.0)); const lift = (1 - wp) * H * 0.3;
  wave(horizon + lift, 0.5 * u, 9 * u, 1.2, '#2BA6C9', 0); wave(horizon + 3 * u + lift, 0.8 * u, 12 * u, -1.5, '#1E8FB3', 1); wave(horizon + 7 * u + lift, 1 * u, 15 * u, 1.8, '#3FC1D9', 2);
  const sandY = horizon + 12 * u; ctx.fillStyle = '#FFFFFF'; ctx.globalAlpha = outA(t) * 0.9; wave(sandY - 1 * u + lift, 1.1 * u, 10 * u, 2.2, '#FFFFFF', 3); ctx.globalAlpha = outA(t); wave(sandY + lift, 1 * u, 10 * u, 2.2, '#F6D9A8', 3);
  const up = back(pr(t, 0.9, 1.4)); if (up > 0) { const ux = L.o === 'h' ? W * 0.62 : W * 0.24, uy = sandY + 6 * u, R = 10 * u * up; ctx.strokeStyle = '#8A5A3B'; ctx.lineWidth = 0.7 * u; ctx.beginPath(); ctx.moveTo(ux, uy + 10 * u); ctx.lineTo(ux + 2 * u, uy - R * 0.9); ctx.stroke();
    const cols = ['#FF6B5A', '#FFFFFF', '#FF6B5A', '#FFFFFF', '#FF6B5A']; cols.forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(ux + 2 * u, uy - R * 0.9); ctx.arc(ux + 2 * u, uy - R * 0.9 + R * 0.55, R, Math.PI + i * Math.PI / 5, Math.PI + (i + 1) * Math.PI / 5); ctx.closePath(); ctx.fill(); }); }
  [[0.3, 0.16], [0.42, 0.12]].forEach(([x, y], i) => { const p = eo(pr(t, 0.6 + i * 0.2, 1.2 + i * 0.2)); ctx.globalAlpha = outA(t) * p; const bx = sx - sr * (1.6 + i * 0.9) + Math.sin(t * 1.4 + i) * 2 * u, by = sy + sr * (0.1 - i * 0.45); ctx.strokeStyle = '#2F4858'; ctx.lineWidth = 0.4 * u; ctx.beginPath(); ctx.moveTo(bx - 1.6 * u, by); ctx.quadraticCurveTo(bx - 0.8 * u, by - 1 * u, bx, by); ctx.quadraticCurveTo(bx + 0.8 * u, by - 1 * u, bx + 1.6 * u, by); ctx.stroke(); });
  ctx.globalAlpha = outA(t);
  const tb = L.o === 'h' ? { x: W * 0.07, y: H * 0.12, w: W * 0.5 } : { x: W * 0.08, y: H * 0.08, w: W * 0.84 };
  heading(ctx, tb, [{ s: 'Verão chegou', f: SG(700), c: '#16425B', at: 0.5 }, { s: 'e a gente também.', f: CAV, k: 1.15, c: '#FF6B5A', at: 0.75 }], t, L.o === 'h' ? 8.5 * u : L.base * 0.9);
};
// Tropical: folhas emoldurando, blocos de cor, selo de oferta
ST.tropical = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#FFE8C7'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  const leaf = (x, y, s, rot, col, at) => { const p = back(pr(t, at, at + 0.6)); if (p <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot + Math.sin(t * 1.6 + at * 5) * 0.04); ctx.scale(p * s, p * s);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(20, -18, 70, -22, 100, 0); ctx.bezierCurveTo(70, 22, 20, 18, 0, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(96, 0); ctx.stroke(); for (let k = 1; k < 7; k++) { ctx.beginPath(); ctx.moveTo(k * 13, 0); ctx.lineTo(k * 13 + 8, -10 + (k % 2) * 0); ctx.moveTo(k * 13, 0); ctx.lineTo(k * 13 + 8, 10); ctx.stroke(); } ctx.restore(); };
  const s = Math.min(W, H) / 230;
  leaf(-10 * s, -5 * s, s * 1.3, 0.6, '#1F7A5C', 0.0); leaf(-20 * s, 40 * s, s * 1.1, 0.15, '#2FA36B', 0.1); leaf(W + 10 * s, H + 5 * s, s * 1.1, Math.PI + 1.0, '#1F7A5C', 0.15); leaf(W + 12 * s, H - 30 * s, s * 0.95, Math.PI + 0.55, '#2FA36B', 0.25); leaf(W + 5 * s, -10 * s, s * 1.0, Math.PI - 0.7, '#FF8A3D', 0.3);
  const bp = back(pr(t, 0.5, 1.0)); const cx = W / 2, cy = L.o === 'h' ? H * 0.5 : H * 0.42; const cw = Math.min(W * 0.72, (L.o === 'h' ? 120 : 76) * u), ch = cw * (L.o === 'h' ? 0.5 : 0.62);
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.04); ctx.scale(bp, bp); ctx.fillStyle = '#FF5D73'; rr(ctx, -cw / 2, -ch / 2, cw, ch, 3 * u); ctx.fill(); ctx.fillStyle = '#FFD23F'; rr(ctx, -cw / 2 + 2 * u, -ch / 2 + 2 * u, cw - 4 * u, ch - 4 * u, 2.4 * u); ctx.globalAlpha = outA(t) * 0; ctx.fill(); ctx.globalAlpha = outA(t);
  const l1 = 'COLEÇÃO', l2 = 'VERÃO'; const s1 = fitSize(ctx, l2, ARC, ch * 0.42, cw * 0.86); txt(ctx, l1, 0, -ch * 0.18, ARC(s1 * 0.38), '#FFE8C7', 'center'); txt(ctx, l2, 0, ch * 0.22, ARC(s1), '#FFFFFF', 'center'); ctx.restore();
  const sp2 = back(pr(t, 1.3, 1.7)); if (sp2 > 0) { const r = Math.min(W, H) * 0.11; ctx.save(); ctx.translate(cx + cw * 0.42, cy + ch * 0.5); ctx.rotate(0.25 + t * 0.15); ctx.scale(sp2, sp2); ctx.fillStyle = '#1F7A5C'; ctx.beginPath(); for (let k = 0; k < 24; k++) { const a = k * Math.PI / 12, rr2 = k % 2 ? r * 0.86 : r; ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } ctx.closePath(); ctx.fill(); ctx.rotate(-0.25 - t * 0.15); txt(ctx, '-30%', 0, r * 0.18, ARC(r * 0.5), '#FFE8C7', 'center'); ctx.restore(); }
  const tp = eo(pr(t, 1.8, 2.3)); ctx.globalAlpha = outA(t) * tp; const ty = L.o === 'h' ? H * 0.88 : cy + ch * 0.5 + 18 * u; txt(ctx, 'só até domingo', cx, ty, CAV(fitSize(ctx, 'só até domingo', CAV, 9 * u, W * 0.7)), '#C2410C', 'center'); ctx.globalAlpha = 1;
};
STYLE_LIST.push(['praia', 'Praia', 'Verão, turismo, pousadas, bebidas, moda praia'], ['tropical', 'Tropical', 'Ofertas de verão, sucos, açaí, moda e eventos']);

// ================= estilos da pesquisa de tendências 2026 =================
const GRAINS = {};
function grainLayer(W, H, tint, alpha, seed) { const k = W + 'x' + H + tint; if (GRAINS[k]) return GRAINS[k]; const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); const r = seeded(seed || 3); g.globalAlpha = alpha; for (let i = 0; i < W * H / 90; i++) { g.fillStyle = r() > 0.5 ? '#FFFFFF' : tint; g.fillRect(r() * W, r() * H, 1.3, 1.3); } return (GRAINS[k] = c); }
function tornRect(ctx, x, y, w, h, col, seed, rot = 0) { const r = seeded(seed); ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot); ctx.fillStyle = col; ctx.beginPath(); const st = Math.max(6, w / 28);
  ctx.moveTo(-w / 2, -h / 2 + r() * st * 0.6); for (let i = 1; i <= Math.ceil(w / st); i++) ctx.lineTo(-w / 2 + Math.min(w, i * st), -h / 2 + (r() - 0.5) * st * 0.7);
  ctx.lineTo(w / 2 + (r() - 0.5) * 3, h / 2); for (let i = Math.ceil(w / st); i >= 0; i--) ctx.lineTo(-w / 2 + Math.min(w, i * st), h / 2 + (r() - 0.5) * st * 0.7); ctx.closePath(); ctx.fill(); ctx.restore(); }

// Papel rasgado (grunge de rua, 12 quadros por segundo)
ST.rasgado = (ctx, tt, L) => {
  const t = Math.floor(tt * 12) / 12, { W, H, u } = L; ctx.fillStyle = '#E8DCC4'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(tt);
  ctx.drawImage(grainLayer(W, H, '#6B5B45', 0.25, 9), 0, 0);
  const j = k => (seeded(Math.floor(t * 12) * 13 + k)() - 0.5) * 0.6 * u;
  const strips = [[0.05, 0.18, 0.9, 0.16, '#111111', -0.03, 0.1], [0.12, 0.52, 0.8, 0.12, '#FF3D2E', 0.04, 0.5], [0.0, 0.72, 0.7, 0.1, '#2F5BFF', -0.02, 0.8]];
  strips.forEach(([x, y, w, h, c, r, at], i) => { const p = eo(pr(t, at, at + 0.4)); if (p <= 0) return; tornRect(ctx, W * x - (1 - p) * W, H * y + j(i), W * w, H * h, c, 40 + i, r); });
  // respingo de tinta
  const sp = back(pr(t, 1.2, 1.5)); if (sp > 0) { const r = seeded(77); ctx.fillStyle = '#FFD400'; const cx = W * 0.84, cy = H * 0.44, R = Math.min(W, H) * 0.08 * sp; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill(); for (let i = 0; i < 9; i++) { const a = r() * 7, d = R * (1.1 + r() * 0.8); ctx.beginPath(); ctx.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, R * (0.08 + r() * 0.14), 0, 7); ctx.fill(); } }
  const tb = { x: W * 0.09, y: H * 0.17, w: W * 0.82 }; ctx.save(); ctx.translate(j(5), j(6));
  heading(ctx, tb, [{ s: 'SEM FILTRO.', f: ARC, c: '#F4EFE6', at: 0.3 }], t, L.o === 'h' ? 12 * u : 13 * u, 'pop'); ctx.restore();
  const mp = pr(t, 1.6, 2.2); if (mp > 0) { ctx.strokeStyle = '#111'; ctx.lineWidth = 1.4 * u; ctx.lineCap = 'round'; ctx.beginPath(); const y = H * 0.58 + 9 * u; for (let i = 0; i <= 20 * mp; i++) { const x = W * 0.16 + i / 20 * W * 0.6; ctx.lineTo(x, y + Math.sin(i * 1.7) * 1.2 * u); } ctx.stroke(); }
  ctx.save(); ctx.translate(j(7), j(8)); txt(ctx, 'feito na rua', W * 0.16, H * 0.58 + 5 * u, CAV(fitSize(ctx, 'feito na rua', CAV, 9 * u, W * 0.6)), '#FFFFFF'); ctx.restore();
  // fita adesiva
  ctx.globalAlpha = outA(tt) * 0.75; ctx.fillStyle = '#F2EBD3'; ctx.save(); ctx.translate(W * 0.88, H * 0.19); ctx.rotate(0.6); ctx.fillRect(-7 * u, -2.5 * u, 14 * u, 5 * u); ctx.restore(); ctx.globalAlpha = 1;
};
// Filme analógico (Super 8: grão, poeira, vazamento de luz)
ST.filme = (ctx, t, L) => {
  const { W, H, u } = L; const flick = 1 - (seeded(Math.floor(t * 24))() * 0.06);
  const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#E9A86B'); sky.addColorStop(0.55, '#F3C98F'); sky.addColorStop(0.56, '#5E7F86'); sky.addColorStop(1, '#3E5A60'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#FFE7B0'; ctx.beginPath(); ctx.arc(W * 0.66, H * 0.5, Math.min(W, H) * 0.11, 0, 7); ctx.fill();
  ctx.fillStyle = '#2B3B3F'; ctx.beginPath(); ctx.moveTo(0, H * 0.56); for (let x = 0; x <= W; x += W / 12) ctx.lineTo(x, H * 0.56 - Math.abs(Math.sin(x / W * 5 + 1)) * H * 0.07); ctx.lineTo(W, H * 0.56); ctx.fill();
  ctx.fillStyle = 'rgba(255,230,180,0.25)'; for (let i = 0; i < 6; i++) ctx.fillRect(W * 0.66 - (i + 1) * 4 * u, H * 0.58 + i * 2.6 * u, (i + 1) * 8 * u, 0.6 * u);
  ctx.globalAlpha = outA(t);
  ctx.shadowColor = 'rgba(60,30,10,0.45)'; ctx.shadowBlur = 2 * u; heading(ctx, { x: W * 0.08, y: H * (L.o === 'h' ? 0.1 : 0.12), w: W * 0.84 }, [{ s: 'Desde 1998', f: SER, c: '#FFF6E6', at: 0.4 }, { s: 'CONTANDO HISTÓRIAS', f: IN(500), k: 0.32, c: '#FFF6E6', at: 0.8, gap: 1.6 }], t, L.o === 'h' ? 13 * u : 15 * u, 'blur'); ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  // vazamento de luz
  const lx = W * (0.9 + Math.sin(t * 0.9) * 0.15); const lk = ctx.createRadialGradient(lx, H * 0.2, 0, lx, H * 0.2, Math.max(W, H) * 0.6); lk.addColorStop(0, 'rgba(255,90,40,0.45)'); lk.addColorStop(1, 'rgba(255,90,40,0)'); ctx.fillStyle = lk; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(grainLayer(W, H, '#2A1E12', 0.35, 21), -(Math.floor(t * 24) % 3) * 2, 0);
  const r = seeded(Math.floor(t * 24) + 5); ctx.fillStyle = 'rgba(20,14,8,0.55)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(r() * W, r() * H, r() * 1.2 * u + 0.3, 0, 7); ctx.fill(); }
  if (r() > 0.55) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(r() * W, 0, 1.2, H); }
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = `rgba(0,0,0,${1 - flick + (1 - outA(t))})`; ctx.fillRect(0, 0, W, H);
};
// Abertura de cinema (faixas pretas, título espaçado, flare anamórfico)
ST.cinema = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#05070B'; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.6); g.addColorStop(0, '#16202E'); g.addColorStop(1, '#05070B'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const r = seeded(4); ctx.fillStyle = 'rgba(200,220,255,0.5)'; for (let i = 0; i < 40; i++) { const x = r() * W, y = (r() * H - t * (8 + r() * 10) * u) % H; ctx.globalAlpha = 0.2 + r() * 0.5; ctx.beginPath(); ctx.arc(x, y < 0 ? y + H : y, r() * 0.5 * u + 0.4, 0, 7); ctx.fill(); }
  ctx.globalAlpha = outA(t);
  const zoom = 1 + t * 0.025; ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2);
  const words = ['O', 'PRÓXIMO', 'CAPÍTULO']; const ap = eo(pr(t, 0.6, 2.2)); const sp = lerp(2.2, 0.9, ap) * u; const size = fitSize(ctx, 'O PRÓXIMO CAPÍTULO', IN(300), (L.o === 'v' ? 6.5 : 7.5) * u, W * 0.78);
  let size2 = size, tw = 0; const s = words.join(' '); for (let it = 0; it < 30; it++) { ctx.font = IN(300)(size2); tw = 0; for (const ch of s) tw += ctx.measureText(ch).width + sp; if (tw <= W * 0.82) break; size2 *= 0.95; } let x = W / 2 - tw / 2;
  ctx.globalAlpha = outA(t) * ap; for (const ch of s) { txt(ctx, ch, x, H / 2 + size2 * 0.35, IN(300)(size2), '#E8EEF8'); x += ctx.measureText(ch).width + sp; }
  ctx.globalAlpha = outA(t) * eo(pr(t, 1.8, 2.6)); txt(ctx, 'EM BREVE', W / 2, H / 2 + size * 2.2, IN(500)(size * 0.38), '#7FA6D9', 'center'); ctx.restore();
  const fp = pr(t, 1.0, 2.8); if (fp > 0 && fp < 1) { const fx = lerp(-0.2, 1.2, eio(fp)) * W, a = Math.sin(fp * Math.PI); const fg = ctx.createLinearGradient(0, 0, W, 0); fg.addColorStop(0, 'rgba(80,160,255,0)'); fg.addColorStop(clamp(fx / W), `rgba(140,200,255,${0.7 * a})`); fg.addColorStop(1, 'rgba(80,160,255,0)'); ctx.globalAlpha = 1; ctx.fillStyle = fg; ctx.fillRect(0, H / 2 - 0.25 * u, W, 0.5 * u); const fr = ctx.createRadialGradient(fx, H / 2, 0, fx, H / 2, 8 * u); fr.addColorStop(0, `rgba(220,240,255,${0.9 * a})`); fr.addColorStop(1, 'rgba(120,180,255,0)'); ctx.fillStyle = fr; ctx.fillRect(fx - 8 * u, H / 2 - 8 * u, 16 * u, 16 * u); }
  const bar = (L.o === 'h' ? H * 0.12 : H * 0.08) * (1 - eio(pr(t, 0, 0.6)) * 0) ; ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
  ctx.fillStyle = `rgba(0,0,0,${1 - outA(t)})`; ctx.fillRect(0, 0, W, H);
};
// Rabisco à mão (traço tremido, cores lo-fi, 8 quadros por segundo)
ST.rabisco = (ctx, tt, L) => {
  const t = Math.floor(tt * 8) / 8, { W, H, u } = L; ctx.fillStyle = '#FBF7EE'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(tt);
  const fr = Math.floor(tt * 8); const wob = (k) => (seeded(fr * 31 + k)() - 0.5) * 0.9;
  const path = (pts, close, col, lw, k) => { ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); pts.forEach(([x, y], i) => { const X = x + wob(k + i) * 0.8 * u, Y = y + wob(k + i + 50) * 0.8 * u; i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); if (close) ctx.closePath(); ctx.stroke(); };
  inBox(ctx, L.vis, 300, 300, () => {
    const p = pr(t, 0.2, 1.2); if (p > 0) { ctx.fillStyle = '#F2C14E'; ctx.beginPath(); ctx.arc(158, 128, 70 * eo(p), 0, 7); ctx.fill(); }
    const circ = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2; circ.push([150 + Math.cos(a) * 70, 120 + Math.sin(a) * 70]); } if (p > 0) path(circ.slice(0, Math.ceil(25 * eo(p))), false, '#2B2B2B', 4, 1);
    const b = pr(t, 1.0, 1.6); if (b > 0) { path([[125, 190], [175, 190]], false, '#2B2B2B', 4, 40); path([[130, 210], [170, 210]], false, '#2B2B2B', 4, 41); path([[128, 186], [128, 150], [150, 170], [172, 150], [172, 186]].slice(0, Math.ceil(5 * b)), false, '#2B2B2B', 3, 42); }
    const rays = pr(t, 1.6, 2.2); for (let i = 0; i < 6; i++) { if (rays * 6 < i) break; const a = -Math.PI / 2 + (i - 2.5) * 0.45; path([[150 + Math.cos(a) * 92, 120 + Math.sin(a) * 92], [150 + Math.cos(a) * 118, 120 + Math.sin(a) * 118]], false, '#E4572E', 4, 60 + i); }
    const ar = pr(t, 2.2, 2.8); if (ar > 0) { path([[30, 260], [80, 240], [120, 255]].slice(0, Math.ceil(3 * ar)), false, '#3A7D7C', 4, 80); }
  });
  heading(ctx, L.o === 'h' ? L.text : { x: W * 0.08, y: H * 0.08, w: W * 0.84 }, [{ s: 'Ideias que saem', f: CAV, c: '#2B2B2B', at: 0.2 }, { s: 'do papel.', f: CAV, c: '#E4572E', at: 0.5 }], t, (L.o === 'h' ? 13 : 12) * u);
};
// Aconchegante (formas redondas, cores quentes, movimento lento)
ST.cozy = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#F6E7CB'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  const bob = Math.sin(t * 1.4) * 0.6 * u;
  inBox(ctx, L.vis, 320, 300, () => {
    const p = back(pr(t, 0.2, 1.0)); ctx.save(); ctx.translate(160, 230); ctx.scale(p, p);
    ctx.fillStyle = '#E8B98A'; ctx.beginPath(); ctx.ellipse(0, 40, 120, 18, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = '#A85E49'; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(46, -8, 28, -1.3, 1.3); ctx.stroke(); ctx.fillStyle = '#C8735B'; rr(ctx, -46, -80, 92, 128, 26); ctx.fill();
    ctx.fillStyle = '#F6E7CB'; rr(ctx, -30, -40, 60, 12, 6); ctx.fill(); ctx.restore();
    for (let i = 0; i < 3; i++) { const sp = pr(t, 0.8 + i * 0.2, 1.4 + i * 0.2); if (sp <= 0) continue; ctx.strokeStyle = `rgba(255,255,255,${0.85 * sp})`; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); const x = 130 + i * 30; for (let k = 0; k <= 12; k++) { const y = 135 - k * 8 - ((t * 18) % 16); ctx.lineTo(x + Math.sin(k * 0.8 + t * 2 + i) * 7, y); } ctx.stroke(); }
    const lp = back(pr(t, 1.2, 1.9)); if (lp > 0) { ctx.save(); ctx.translate(268, 250); ctx.scale(lp, lp); ctx.fillStyle = '#85A392'; [-0.7, 0, 0.7].forEach(a => { ctx.save(); ctx.rotate(a + Math.sin(t * 1.2) * 0.05); ctx.beginPath(); ctx.ellipse(0, -36, 14, 34, 0, 0, 7); ctx.fill(); ctx.restore(); }); ctx.fillStyle = '#A8604A'; rr(ctx, -22, -4, 44, 40, 10); ctx.fill(); ctx.restore(); }
  });
  ctx.save(); ctx.translate(0, bob); heading(ctx, L.o === 'h' ? L.text : { x: W * 0.08, y: H * 0.09, w: W * 0.84 }, [{ s: 'Feito com calma,', f: SG(600), c: '#5A3A2E', at: 0.3 }, { s: 'pensado pra você.', f: SG(500), c: '#C8735B', at: 0.6 }], t, L.base * 0.85); ctx.restore();
};
// Editorial modular (grade de revista com módulos entrando em sequência)
ST.editorial = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#F5F2EC'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  const g = 2 * u, m = 5 * u; const cols = L.o === 'h' ? 4 : 2, rows = L.o === 'v' ? 5 : L.o === 'h' ? 3 : 4; const cw = (W - 2 * m - (cols - 1) * g) / cols, ch = (H - 2 * m - (rows - 1) * g) / rows;
  const cell = (c, r, cs, rs) => [m + c * (cw + g), m + r * (ch + g), cs * cw + (cs - 1) * g, rs * ch + (rs - 1) * g];
  const mods = L.o === 'h' ? [[0, 0, 2, 2, 'type'], [2, 0, 1, 1, 'red'], [3, 0, 1, 2, 'img1'], [2, 1, 1, 1, 'num'], [0, 2, 1, 1, 'cap'], [1, 2, 3, 1, 'img2']] : L.o === 'v' ? [[0, 0, 2, 2, 'type'], [0, 2, 1, 1, 'red'], [1, 2, 1, 2, 'img1'], [0, 3, 1, 1, 'num'], [0, 4, 2, 1, 'img2']] : [[0, 0, 2, 2, 'type'], [0, 2, 1, 1, 'red'], [1, 2, 1, 2, 'img1'], [0, 3, 1, 1, 'num']];
  mods.forEach(([c, r, cs, rs, k], i) => { const p = eio(pr(t, 0.2 + i * 0.25, 0.8 + i * 0.25)); if (p <= 0) return; const [x, y, w, h] = cell(c, r, cs, rs); ctx.save(); ctx.beginPath(); ctx.rect(x, y, w * p, h); ctx.clip();
    if (k === 'type') { ctx.fillStyle = '#111'; ctx.fillRect(x, y, w, h); const s1 = fitSize(ctx, 'NOVA', ARC, h * 0.36, w * 0.88); txt(ctx, 'NOVA', x + w * 0.06, y + h * 0.44, ARC(s1), '#F5F2EC'); txt(ctx, 'COLEÇÃO', x + w * 0.06, y + h * 0.82, ARC(fitSize(ctx, 'COLEÇÃO', ARC, h * 0.36, w * 0.88)), '#F5F2EC'); }
    else if (k === 'red') { ctx.fillStyle = '#E63922'; ctx.fillRect(x, y, w, h); txt(ctx, 'Outono', x + w * 0.1, y + h * 0.62, DMS(fitSize(ctx, 'Outono', DMS, h * 0.4, w * 0.8)), '#F5F2EC'); }
    else if (k === 'num') { ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2); txt(ctx, 'Nº 07', x + w * 0.1, y + h * 0.6, ARC(fitSize(ctx, 'Nº 07', ARC, h * 0.4, w * 0.8)), '#111'); }
    else if (k === 'cap') { txt(ctx, 'Edição limitada', x, y + h * 0.4, IN(600)(fitSize(ctx, 'Edição limitada', IN(600), h * 0.2, w)), '#111'); ctx.fillStyle = '#111'; ctx.fillRect(x, y + h * 0.55, w * 0.6, 2); }
    else { const gr = ctx.createLinearGradient(x, y, x + w, y + h); gr.addColorStop(0, k === 'img1' ? '#C7B299' : '#8FA3A8'); gr.addColorStop(1, k === 'img1' ? '#8C6E54' : '#4E6168'); ctx.fillStyle = gr; ctx.fillRect(x, y, w, h); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.arc(x + w * 0.5, y + h * (0.5 + Math.sin(t) * 0.03), Math.min(w, h) * 0.28, 0, 7); ctx.fill(); }
    ctx.restore(); });
};
// Prisma de vidro (formas translúcidas com dispersão de cor)
ST.prisma = (ctx, t, L) => {
  const { W, H, u } = L; const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0B1230'); g.addColorStop(1, '#1B1446'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  const box = L.vis; const cx = box.x + box.w / 2, cy = box.y + box.h / 2, R = Math.min(box.w, box.h) * 0.32;
  const bp = eo(pr(t, 0.6, 1.4)); ctx.globalCompositeOperation = 'lighter';
  if (bp > 0) { ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.beginPath(); ctx.moveTo(0, cy - R * 0.1); ctx.lineTo(cx - R * 0.4, cy - R * 0.05); ctx.lineTo(cx - R * 0.4, cy + R * 0.05); ctx.lineTo(0, cy + R * 0.1); ctx.fill();
    ['#FF3B6B', '#FF9F1C', '#FFE74C', '#3BFF9A', '#2EC5FF', '#8B5CFF'].forEach((c, i) => { ctx.fillStyle = c; ctx.globalAlpha = outA(t) * 0.35 * bp; ctx.beginPath(); ctx.moveTo(cx + R * 0.3, cy); ctx.lineTo(W, cy - R * 0.9 + i * R * 0.3 * bp); ctx.lineTo(W, cy - R * 0.9 + (i + 1) * R * 0.3 * bp); ctx.fill(); }); }
  ctx.globalAlpha = outA(t); const rot = t * 0.35;
  [['rgba(255,80,120,0.35)', -1.2], ['rgba(80,255,180,0.35)', 0], ['rgba(90,140,255,0.35)', 1.2]].forEach(([c, off]) => { ctx.save(); ctx.translate(cx + off * u * 0.7, cy); ctx.rotate(rot); ctx.fillStyle = c; ctx.beginPath(); for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + k * Math.PI * 2 / 3; ctx.lineTo(Math.cos(a) * R * eo(pr(t, 0, 0.8)), Math.sin(a) * R * eo(pr(t, 0, 0.8))); } ctx.closePath(); ctx.fill(); ctx.restore(); });
  ctx.globalCompositeOperation = 'source-over'; ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.2; ctx.beginPath(); for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + k * Math.PI * 2 / 3; ctx.lineTo(Math.cos(a) * R * eo(pr(t, 0, 0.8)), Math.sin(a) * R * eo(pr(t, 0, 0.8))); } ctx.closePath(); ctx.stroke(); ctx.restore();
  heading(ctx, L.text, [{ s: 'Clareza em', f: IN(300), c: '#FFFFFF', at: 0.8 }, { s: 'cada detalhe.', f: IN(700), c: '#FFFFFF', at: 1.0 }], t, L.base * 0.85, 'blur');
};
// Stickers de story (adesivos que pulam, enquete, fita)
ST.stickers = (ctx, t, L) => {
  const { W, H, u } = L; ctx.fillStyle = '#C9B6FF'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  const stk = (x, y, rot, at, fn) => { const p = back(pr(t, at, at + 0.35)); if (p <= 0) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot + Math.sin(t * 2 + at * 7) * 0.03); ctx.scale(p, p); fn(); ctx.restore(); };
  const s = Math.min(W, H) / 100;
  stk(W * 0.5, H * (L.o === 'h' ? 0.3 : 0.22), -0.06, 0.1, () => { const w = 70 * s, h = 18 * s; ctx.fillStyle = '#FFFFFF'; rr(ctx, -w / 2 - 1.2 * s, -h / 2 - 1.2 * s, w + 2.4 * s, h + 2.4 * s, h / 2); ctx.fill(); ctx.fillStyle = '#FF3D7F'; rr(ctx, -w / 2, -h / 2, w, h, h / 2); ctx.fill(); txt(ctx, 'CHEGOU!', 0, h * 0.25, ARC(fitSize(ctx, 'CHEGOU!', ARC, h * 0.7, w * 0.85)), '#FFFFFF', 'center'); });
  const SQ = L.o === 's'; stk(W * (L.o === 'h' ? 0.27 : SQ ? 0.2 : 0.3), H * (L.o === 'h' ? 0.66 : SQ ? 0.7 : 0.5), 0.12, 0.6, () => { const r = 16 * s; ctx.fillStyle = '#FFE14D'; ctx.beginPath(); for (let k = 0; k < 24; k++) { const a = k * Math.PI / 12, rr2 = k % 2 ? r * 0.78 : r; ctx.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1.2 * s; ctx.stroke(); txt(ctx, '-20%', 0, r * 0.2, ARC(r * 0.55), '#111', 'center'); });
  stk(W * (L.o === 'h' ? 0.68 : SQ ? 0.64 : 0.62), H * (L.o === 'h' ? 0.62 : SQ ? 0.56 : 0.68), -0.04, 1.0, () => { const w = 56 * s, h = 34 * s; ctx.fillStyle = '#FFFFFF'; rr(ctx, -w / 2, -h / 2, w, h, 4 * s); ctx.fill(); txt(ctx, 'Você usaria?', 0, -h / 2 + 8 * s, IN(700)(5 * s), '#111', 'center');
    const vp = eio(pr(t, 1.6, 2.4)); [['SIM', 0.82, '#7C4DFF'], ['NÃO', 0.18, '#B9B9C6']].forEach(([n, v, c], i) => { const y = -h / 2 + 13 * s + i * 10 * s; ctx.fillStyle = '#F0EEF6'; rr(ctx, -w / 2 + 4 * s, y, w - 8 * s, 8 * s, 4 * s); ctx.fill(); ctx.fillStyle = c; rr(ctx, -w / 2 + 4 * s, y, (w - 8 * s) * v * vp, 8 * s, 4 * s); ctx.fill(); txt(ctx, n, -w / 2 + 7 * s, y + 5.6 * s, IN(700)(3.8 * s), '#111'); txt(ctx, Math.round(v * 100 * vp) + '%', w / 2 - 7 * s, y + 5.6 * s, IN(700)(3.8 * s), '#111', 'right'); }); });
  stk(W * (L.o === 'h' ? 0.82 : 0.78), H * (L.o === 'h' ? 0.26 : 0.38), 0.5, 1.4, () => { ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(-12 * s, -3 * s, 24 * s, 6 * s); });
  stk(W * (L.o === 'h' ? 0.5 : SQ ? 0.62 : 0.36), H * (L.o === 'h' ? 0.88 : SQ ? 0.9 : 0.86), -0.08, 2.0, () => { const tx = 'link na bio'; ctx.font = IN(800)(6 * s); const w = ctx.measureText(tx).width + 8 * s; ctx.fillStyle = '#111'; rr(ctx, -w / 2, -5 * s, w, 10 * s, 5 * s); ctx.fill(); txt(ctx, tx, 0, 2 * s, IN(800)(6 * s), '#FFFFFF', 'center'); });
};
// Y2K cromado (letras metálicas, brilhos, fundo holográfico)
ST.y2k = (ctx, t, L) => {
  const { W, H, u } = L; const g = ctx.createLinearGradient(0, 0, W, H); const h = (t * 20) % 360; g.addColorStop(0, `hsl(${290 + Math.sin(t) * 10},90%,82%)`); g.addColorStop(0.5, '#BFE6FF'); g.addColorStop(1, `hsl(${320 + Math.cos(t) * 10},90%,86%)`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  const r = seeded(12); for (let i = 0; i < 6; i++) { const x = r() * W, y = r() * H, R = (8 + r() * 14) * u; const bg = ctx.createRadialGradient(x - R * 0.3, y - R * 0.3, R * 0.1, x, y, R); bg.addColorStop(0, 'rgba(255,255,255,0.9)'); bg.addColorStop(0.5, 'rgba(180,220,255,0.35)'); bg.addColorStop(1, 'rgba(255,160,230,0.15)'); ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(x, y + Math.sin(t * 1.5 + i) * 2 * u, R * eo(pr(t, i * 0.1, 0.6 + i * 0.1)), 0, 7); ctx.fill(); }
  const word = 'FUTURO', s = fitSize(ctx, word, IN(800), (L.o === 'h' ? 18 : 16) * u, W * 0.84); const y = H * 0.5; const p = back(pr(t, 0.4, 1.1));
  ctx.save(); ctx.translate(W / 2, y); ctx.scale(p, p); ctx.transform(1, 0, -0.18, 1, 0, 0);
  const cg = ctx.createLinearGradient(0, -s * 0.8, 0, s * 0.2); cg.addColorStop(0, '#FFFFFF'); cg.addColorStop(0.45, '#9AA3B5'); cg.addColorStop(0.5, '#3B4252'); cg.addColorStop(0.62, '#D9DEE8'); cg.addColorStop(1, '#7D8698');
  ctx.font = IN(800)(s); ctx.textAlign = 'center'; ctx.lineWidth = s * 0.08; ctx.strokeStyle = '#2D2F45'; ctx.strokeText(word, 0, s * 0.35); ctx.fillStyle = cg; ctx.fillText(word, 0, s * 0.35);
  const sh = (t * 0.6) % 1.4 - 0.2; const sg = ctx.createLinearGradient(-W / 2 + sh * W, 0, -W / 2 + sh * W + s, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.9)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sg; ctx.fillText(word, 0, s * 0.35); ctx.restore();
  ctx.globalCompositeOperation = 'source-over'; txt(ctx, 'agora', W / 2, y + s * 0.95, SER(s * 0.55), '#5B2A86', 'center');
  const spark = (x, yy, R, at) => { const q = Math.sin(clamp((t - at) / 0.8) * Math.PI); if (q <= 0) return; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.moveTo(x, yy - R * q); ctx.quadraticCurveTo(x, yy, x + R * q, yy); ctx.quadraticCurveTo(x, yy, x, yy + R * q); ctx.quadraticCurveTo(x, yy, x - R * q, yy); ctx.quadraticCurveTo(x, yy, x, yy - R * q); ctx.fill(); };
  [[0.2, 0.3, 1.0], [0.82, 0.38, 1.5], [0.7, 0.66, 2.1], [0.3, 0.7, 2.6], [0.12, 0.5, 3.0]].forEach(([x, yy, at]) => spark(W * x, H * yy, 5 * u, at));
};
// Low poly (paisagem facetada)
ST.lowpoly = (ctx, t, L) => {
  const { W, H, u } = L; const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#20345A'); sky.addColorStop(0.6, '#E07A5F'); sky.addColorStop(1, '#F2CC8F'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = outA(t);
  const sp = eo(pr(t, 0, 1.4)); ctx.fillStyle = '#F7E3AF'; ctx.beginPath(); for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; ctx.lineTo(W * 0.68 + Math.cos(a) * 9 * u, H * (0.62 - 0.12 * sp) + Math.sin(a) * 9 * u); } ctx.fill();
  const layer = (base, amp, cols, seed, par, at) => { const r = seeded(seed); const n = 7; const pts = []; for (let i = 0; i <= n; i++) pts.push([i / n * W * 1.2 - W * 0.1 + Math.sin(t * 0.3) * par * u, H * base - r() * H * amp]); const lift = (1 - eo(pr(t, at, at + 0.9))) * H * 0.4;
    for (let i = 0; i < n; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[i + 1]; const mx = (x1 + x2) / 2, my = Math.max(y1, y2) + H * 0.05; ctx.fillStyle = cols[0]; ctx.beginPath(); ctx.moveTo(x1, y1 + lift); ctx.lineTo(x2, y2 + lift); ctx.lineTo(mx, my + lift); ctx.fill(); ctx.fillStyle = cols[1]; ctx.beginPath(); ctx.moveTo(x1, y1 + lift); ctx.lineTo(mx, my + lift); ctx.lineTo(x1, H); ctx.lineTo(mx, H); ctx.fill(); ctx.fillStyle = cols[2]; ctx.beginPath(); ctx.moveTo(x2, y2 + lift); ctx.lineTo(mx, my + lift); ctx.lineTo(mx, H); ctx.lineTo(x2, H); ctx.fill(); } };
  layer(0.72, 0.18, ['#8E5E7A', '#6F4A66', '#7D5371'], 3, 1, 0.2); layer(0.82, 0.14, ['#4B5E7E', '#3A4A66', '#435574'], 8, 2, 0.4); layer(0.94, 0.1, ['#2A3550', '#1F2840', '#253049'], 15, 3, 0.6);
  heading(ctx, { x: W * 0.08, y: H * (L.o === 'h' ? 0.1 : 0.1), w: W * 0.84 }, [{ s: 'Chegue mais longe.', f: SG(700), c: '#FFFFFF', at: 0.9 }], t, L.o === 'h' ? 10 * u : 9 * u, 'mask');
};
STYLE_LIST.push(['rasgado', 'Papel rasgado', 'Moda, música, eventos, marcas jovens'], ['filme', 'Filme analógico', 'Histórias de marca, nostalgia, aniversário'], ['cinema', 'Abertura de cinema', 'Lançamentos, teasers, vinhetas de abertura'], ['rabisco', 'Rabisco à mão', 'Educação, ideias, marcas próximas'], ['cozy', 'Aconchegante', 'Cafés, casa, bem-estar, pequenos negócios'], ['editorial', 'Editorial modular', 'Moda, coleções, revistas, portfólios'], ['prisma', 'Prisma de vidro', 'Tecnologia, inovação, produtos premium'], ['stickers', 'Stickers de story', 'Stories, ofertas rápidas, engajamento'], ['y2k', 'Y2K cromado', 'Público jovem, música, moda, lançamentos'], ['lowpoly', 'Low poly', 'Viagem, aventura, games, tecnologia']);
