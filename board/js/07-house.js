/* =====================================================================
   RAGING BOARD — MA MAISON : L'ATELIER DU PLAN
   ---------------------------------------------------------------------
   « Mon lieu » sait maintenant fabriquer une vraie maison, pièce par pièce :
   on dessine ses pièces sur un plan (comme sur une feuille quadrillée),
   on pose les portes, les fenêtres, l'escalier, on monte un étage, et la
   maison se construit toute seule en 3D, avec ses murs, ses plafonds, sa
   façade, son toit, son jardin, et ses meubles (chaque pièce se meuble
   selon ce qu'elle est : un lit dans la chambre, un canapé au salon…).
   Les portes entre les pièces se posent toutes seules (chaque pièce reste
   accessible) ; on les déplace, on les enlève, on ouvre un mur entier.
   Et de nouvelles matières pour tous les lieux (marbre, tomettes, bâtons
   rompus, terrazzo, crépi, bardage, tôle, tuiles, ardoises, zinc, gravier).
===================================================================== */

/* ---------- 1. De nouvelles matières, pour tous les lieux ---------- */
Object.assign(TEX_KINDS, {
  herring:{ fr:'Bâtons rompus', en:'Herringbone', s:1.4, on:'f', cols:['#B98A5C', '#7A5638', '#D9B48A', '#5E4532'] },
  marble:{ fr:'Marbre', en:'Marble', s:1.8, on:'fw', cols:['#ECE9E4', '#2C2E33', '#D8CCBD', '#3E5B52'] },
  hex:{ fr:'Tomettes', en:'Hex tiles', s:1.0, on:'f', cols:['#B5653E', '#E6E2DA', '#3A3D44', '#7E9C8A'] },
  terrazzo:{ fr:'Terrazzo', en:'Terrazzo', s:1.4, on:'fw', cols:['#E9E4DA', '#C9CFCB', '#E3C9B8', '#3A3D44'] },
  gravel:{ fr:'Gravier', en:'Gravel', s:1.6, on:'fr', cols:['#B8B2A6', '#8E8B85', '#D2C6AE'] },
  plaster:{ fr:'Crépi', en:'Render', s:2, on:'wc', cols:['#EDE6D8', '#D9C8A8', '#C9D2D6', '#E6CFC2', '#F4F2EE'] },
  planks:{ fr:'Bardage', en:'Wood siding', s:1.4, on:'w', cols:['#8A6A4A', '#E9E6E0', '#3D4A44', '#9DB3A6'] },
  metal:{ fr:'Tôle', en:'Metal sheet', s:1.5, on:'wc', cols:['#9AA0A8', '#5E636C', '#2F5E7E', '#8E3B34'] },
  rtile:{ fr:'Tuiles', en:'Roof tiles', s:1.2, on:'r', cols:['#A34B33', '#7A3A2A', '#5E636C', '#B9876A'] },
  slate:{ fr:'Ardoises', en:'Slates', s:1.2, on:'r', cols:['#4A4F57', '#3A3D44', '#6E7178'] },
  zinc:{ fr:'Zinc', en:'Zinc', s:1.5, on:'r', cols:['#8E959C', '#5E636C'] },
});
const HB_TEX_NEW = new Set(['herring', 'marble', 'hex', 'terrazzo', 'gravel', 'plaster', 'planks', 'metal', 'rtile', 'slate', 'zinc']);
const hbTexCanvasBase = texCanvas;
texCanvas = function(kind, col){
  if(!HB_TEX_NEW.has(kind)) return hbTexCanvasBase(kind, col);
  const key = kind + ':' + col; if(TEX_CAN.has(key)) return TEX_CAN.get(key);
  const N = 256, cv = document.createElement('canvas'); cv.width = cv.height = N; const x = cv.getContext('2d');
  let seed = 11; [...kind].forEach(ch => seed = (seed * 31 + ch.charCodeAt(0)) % 233280);
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280, C = hexRGB(col);
  const tone = (k, a) => `rgba(${Math.round(Math.min(255, C[0] * 255 * k))},${Math.round(Math.min(255, C[1] * 255 * k))},${Math.round(Math.min(255, C[2] * 255 * k))},${a == null ? 1 : a})`;
  const fill = (k, X, Y, W, H, a) => { x.fillStyle = tone(k, a); x.fillRect(X, Y, W, H); };
  const speck = (n, sz, k0, k1, a) => { for(let i = 0; i < n; i++) fill(k0 + (k1 - k0) * rnd(), rnd() * N, rnd() * N, sz, sz, a); };
  // ce qui déborde se répète de l'autre côté : le motif se raccorde sans couture
  const wrap = (k, X, Y, W, H, a) => { [-N, 0, N].forEach(dx => [-N, 0, N].forEach(dy => { if(X + dx < N && X + dx + W > 0 && Y + dy < N && Y + dy + H > 0) fill(k, X + dx, Y + dy, W, H, a); })); };
  const around = fn => [-N, 0, N].forEach(dx => [-N, 0, N].forEach(dy => { x.save(); x.translate(dx, dy); fn(); x.restore(); }));
  fill(1, 0, 0, N, N);
  if(kind === 'herring'){
    // de vraies lames en chevrons : une lame couchée, une lame debout, en escalier, et les rangées côte à côte
    fill(0.6, 0, 0, N, N);
    for(let t = -6; t <= 6; t++) for(let k = -20; k <= 20; k++){ const bx = 16 * k + 64 * t, by = 16 * k - 64 * t;
      if(bx > N + 64 || by > N + 64 || bx < -128 || by < -128) continue;
      wrap(0.86 + rnd() * 0.24, bx + 0.5, by + 0.5, 63, 15); wrap(0.86 + rnd() * 0.24, bx + 0.5, by + 16.5, 15, 63); }
    speck(1600, 1, 0.9, 1.06, 0.35);
  }
  else if(kind === 'marble'){
    for(let i = 0; i < 16; i++) wrap(0.96 + rnd() * 0.08, rnd() * N, rnd() * N, 40 + rnd() * 80, 30 + rnd() * 70, 0.25);
    const dark = (C[0] + C[1] + C[2]) / 3 < 0.4;
    for(let i = 0; i < 9; i++){ const sx = rnd() * N, sy = rnd() * N, pts = [[sx, sy]]; for(let k = 0; k < 4; k++){ const p = pts[pts.length - 1]; pts.push([p[0] + 30 + rnd() * 50, p[1] + (rnd() - 0.5) * 90]); }
      const w = 0.6 + rnd() * 1.8, a = 0.18 + rnd() * 0.3;
      around(() => { x.strokeStyle = dark ? `rgba(235,232,226,${a})` : tone(0.62, a); x.lineWidth = w; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]);
        for(let k = 1; k < pts.length; k++){ const p = pts[k - 1], q = pts[k]; x.quadraticCurveTo(p[0] + (q[0] - p[0]) * 0.5 + (rnd() - 0.5) * 20, p[1] + (q[1] - p[1]) * 0.5, q[0], q[1]); } x.stroke(); }); }
    // quatre dalles, à peine marquées
    [0, 128].forEach(v => { fill(0.84, v, 0, 1, N, 0.6); fill(0.84, 0, v, N, 1, 0.6); });
  }
  else if(kind === 'hex'){
    fill(0.72, 0, 0, N, N); const r = 32 / 3, vs = N / 14, ky = vs / (Math.sqrt(3) * r);
    for(let c = 0; c < 16; c++) for(let row = -1; row < 15; row++){ const cx = c * 1.5 * r, cy = row * vs + (c % 2 ? vs / 2 : 0), k = 0.86 + rnd() * 0.22;
      around(() => { x.fillStyle = tone(k); x.beginPath(); for(let i = 0; i < 6; i++){ const a = i * Math.PI / 3; x.lineTo(cx + Math.cos(a) * (r - 0.9), cy + Math.sin(a) * (r - 0.9) * ky); } x.closePath(); x.fill(); }); }
    speck(900, 1, 0.85, 1.1, 0.35);
  }
  else if(kind === 'terrazzo'){
    speck(2500, 1, 0.93, 1.06, 0.4);
    const acc = ['#8E3B34', '#3A3D44', '#C9A64B', '#F4F2EE', '#5E7F72'];
    for(let i = 0; i < 520; i++){ const cx = rnd() * N, cy = rnd() * N, s = 1.5 + rnd() * 4.5, n = 3 + Math.floor(rnd() * 3), a0 = rnd() * 6, c = rnd() < 0.55 ? tone(0.7 + rnd() * 0.5) : acc[Math.floor(rnd() * acc.length)];
      around(() => { x.fillStyle = c; x.beginPath(); for(let k = 0; k < n; k++){ const a = a0 + k / n * Math.PI * 2; x.lineTo(cx + Math.cos(a) * s * (0.7 + rnd() * 0.5), cy + Math.sin(a) * s * (0.7 + rnd() * 0.5)); } x.closePath(); x.fill(); }); }
  }
  else if(kind === 'gravel'){ for(let i = 0; i < 2600; i++){ const s = 2 + rnd() * 3; wrap(0.62 + rnd() * 0.6, rnd() * N, rnd() * N, s, s * (0.6 + rnd() * 0.5), 0.9); } }
  else if(kind === 'plaster'){ speck(9000, 1, 0.9, 1.08, 0.5); speck(1800, 2, 0.93, 1.05, 0.45); }
  else if(kind === 'planks'){ for(let r = 0; r < 8; r++){ const y = r * 32; fill(0.86 + rnd() * 0.2, 0, y, N, 32); fill(0.6, 0, y + 29, N, 3); fill(1.1, 0, y, N, 1, 0.6); for(let j = 0; j < 7; j++) wrap(0.93, rnd() * N, y + 4 + rnd() * 22, 30 + rnd() * 80, 1, 0.5); } }
  else if(kind === 'metal'){ for(let i = 0; i < N; i++) fill(0.84 + 0.2 * Math.sin(i / 32 * Math.PI * 2), i, 0, 1, N); speck(900, 1, 0.9, 1.1, 0.25); }
  else if(kind === 'rtile'){ fill(0.6, 0, 0, N, N);
    for(let r = 0; r < 8; r++){ const o = (r % 2) * 16, y = r * 32; for(let i = -1; i < 8; i++){ const X = o + i * 32, k = 0.86 + rnd() * 0.22;
      around(() => { x.fillStyle = tone(k); x.beginPath(); x.moveTo(X + 1, y); x.lineTo(X + 31, y); x.lineTo(X + 31, y + 18); x.quadraticCurveTo(X + 31, y + 31, X + 16, y + 31); x.quadraticCurveTo(X + 1, y + 31, X + 1, y + 18); x.closePath(); x.fill();
        x.fillStyle = tone(k * 1.12, 0.5); x.fillRect(X + 6, y + 3, 4, 20); }); } } }
  else if(kind === 'slate'){ fill(0.62, 0, 0, N, N); for(let r = 0; r < 8; r++){ const o = (r % 2) * 16, y = r * 32; for(let i = -1; i < 8; i++){ wrap(0.84 + rnd() * 0.26, o + i * 32 + 1, y + 1, 30, 30); wrap(0.7, o + i * 32 + 1, y + 28, 30, 3, 0.7); } } speck(1200, 1, 0.85, 1.15, 0.35); }
  else if(kind === 'zinc'){ speck(3000, 1, 0.94, 1.06, 0.35); for(let i = 0; i < 6; i++){ const X = Math.round(i * N / 6); fill(1.15, X, 0, 2, N); fill(0.7, X + 2, 0, 2, N); } }
  TEX_CAN.set(key, cv); return cv;
};

/* ---------- 2. La maison : des données au décor 3D ---------- */
const HB_T = 0.06, HB_TO = 0.12, HB_SL = 0.25, HB_EPS = 1e-6;
const HB_TYPES = [
  // id, fr, en, sol, murs, meubles
  ['living', 'Salon', 'Living room', ['parquet', '#A9825A'], ['paint', '#E7E2DA'], ['rug@c', 'sofa@w', 'tv@o', 'ctable@c', 'armchair@w', 'lamp@k', 'plant@k', 'shelf@w']],
  ['kitchen', 'Cuisine', 'Kitchen', ['tiles', '#E6E2DA'], ['paint', '#E6D3B3'], ['counter@w', 'fridge@w', 'table@c', 'chair@t', 'plant@k']],
  ['dining', 'Salle à manger', 'Dining room', ['herring', '#B98A5C'], ['paint', '#9DB3A6'], ['rug@c', 'table@c', 'chair@t', 'shelf@w', 'plant@k']],
  ['bedroom', 'Chambre', 'Bedroom', ['parquet', '#C9A27A'], ['paint', '#C9D2D6'], ['bed@w', 'night@b', 'wardrobe@w', 'rug@c', 'plant@k']],
  ['kids', 'Chambre d’enfant', 'Kid’s room', ['carpet', '#B9A88F'], ['stripes', '#9DB3A6'], ['bed@w', 'night@b', 'shelf@w', 'rug@c', 'box@k']],
  ['bath', 'Salle de bain', 'Bathroom', ['tiles', '#CFD8DC'], ['tiles', '#E6E2DA'], ['tub@w', 'sink@w', 'toilet@w', 'plant@k']],
  ['wc', 'Toilettes', 'Toilet', ['hex', '#E6E2DA'], ['paint', '#C9D2D6'], ['toilet@w', 'sink@w']],
  ['office', 'Bureau', 'Study', ['parquet', '#7A5638'], ['paint', '#9DB3A6'], ['desk@w', 'chair@d', 'shelf@w', 'armchair@k', 'plant@k']],
  ['hall', 'Entrée', 'Entrance', ['checker', '#24262B'], ['paint', '#E7E2DA'], ['plant@k', 'mirror@w', 'bench@w']],
  ['corridor', 'Couloir', 'Hallway', ['parquet', '#A9825A'], ['paint', '#E7E2DA'], ['plant@k']],
  ['garage', 'Garage', 'Garage', ['concrete', '#A7A49E'], ['concrete', '#C9C6BE'], ['tires@k', 'crate@k', 'ladder@w', 'box@k', 'barrel@k']],
  ['empty', 'Pièce vide', 'Empty room', ['parquet', '#A9825A'], ['paint', '#E7E2DA'], []],
];
const HB_TYPE = Object.fromEntries(HB_TYPES.map(t => [t[0], t]));
const hbUid = () => 'r' + Math.random().toString(36).slice(2, 8);
const hbLevelsOf = hs => (hs && Array.isArray(hs.lv) && hs.lv.length ? hs.lv : [{ rooms:[] }]);
const hbL = lv => ({ rooms:lv.rooms || [], doors:lv.doors || [], st:lv.st || [], open:lv.open || [], nd:lv.nd || [] });
const hbRect = r => [r.x, r.z, r.x + r.w, r.z + r.d];
const hbStRect = s => (s.dir === 'n' || s.dir === 's') ? [s.x, s.z, s.x + (s.w || 1), s.z + (s.l || 3.6)] : [s.x, s.z, s.x + (s.l || 3.6), s.z + (s.w || 1)];
const hbOverlap = (a, b, m) => a[0] < b[2] - (m || 0) && b[0] < a[2] - (m || 0) && a[1] < b[3] - (m || 0) && b[1] < a[3] - (m || 0);
const hbInside = (a, b) => a[0] >= b[0] - 1e-6 && a[1] >= b[1] - 1e-6 && a[2] <= b[2] + 1e-6 && a[3] <= b[3] + 1e-6;
const hbPairKey = (a, b) => a < b ? a + '|' + b : b + '|' + a;
/* un rectangle moins des trous : les morceaux qui restent (pour le plancher percé par l'escalier, les toits…) */
function hbMinus(rect, holes){
  let out = [rect];
  (holes || []).forEach(h => {
    const next = [];
    out.forEach(p => {
      if(!hbOverlap(p, h)){ next.push(p); return; }
      const [x0, z0, x1, z1] = p, hx0 = Math.max(x0, h[0]), hz0 = Math.max(z0, h[1]), hx1 = Math.min(x1, h[2]), hz1 = Math.min(z1, h[3]);
      if(hz0 > z0 + 1e-4) next.push([x0, z0, x1, hz0]);
      if(z1 > hz1 + 1e-4) next.push([x0, hz1, x1, z1]);
      if(hx0 > x0 + 1e-4) next.push([x0, hz0, hx0, hz1]);
      if(x1 > hx1 + 1e-4) next.push([hx1, hz0, x1, hz1]);
    });
    out = next;
  });
  return out;
}
/* les quatre murs d'une pièce, chacun avec son sens vers l'intérieur */
function hbEdges(r){
  const [x0, z0, x1, z1] = hbRect(r);
  return [
    { s:'n', ax:'x', c:z0, a0:x0, a1:x1, inn:1 }, { s:'s', ax:'x', c:z1, a0:x0, a1:x1, inn:-1 },
    { s:'w', ax:'z', c:x0, a0:z0, a1:z1, inn:1 }, { s:'e', ax:'z', c:x1, a0:z0, a1:z1, inn:-1 },
  ];
}
const hbP = (E, a, off) => E.ax === 'x' ? [a, E.c + E.inn * off] : [E.c + E.inn * off, a];
const hbN = (E, k) => E.ax === 'x' ? [0, E.inn * (k || 1)] : [E.inn * (k || 1), 0];
const hbAlongN = (E, k) => E.ax === 'x' ? [k, 0] : [0, k];
/* les morceaux d'un mur partagés avec les pièces voisines (et si le mur entre elles est ouvert) */
function hbShared(E, r, rooms, open){
  const out = [];
  rooms.forEach(q => { if(q === r) return;
    hbEdges(q).forEach(F => { if(F.ax !== E.ax || F.inn !== -E.inn || Math.abs(F.c - E.c) > 1e-4) return;
      const s = Math.max(E.a0, F.a0), e = Math.min(E.a1, F.a1); if(e - s > 1e-3) out.push({ s, e, q, open:open.includes(hbPairKey(r.id, q.id)) }); }); });
  return out.sort((a, b) => a.s - b.s);
}
/* un intervalle moins une liste d'intervalles */
function hbIvMinus(s, e, cuts){
  let out = [[s, e]];
  cuts.forEach(([a, b]) => { const n = []; out.forEach(([p, q]) => { if(b <= p || a >= q){ n.push([p, q]); return; } if(a > p) n.push([p, a]); if(b < q) n.push([b, q]); }); out = n; });
  return out.filter(([p, q]) => q - p > 1e-3);
}
const hbOcc = (rooms, x, z) => rooms.some(r => x > r.x + 1e-4 && x < r.x + r.w - 1e-4 && z > r.z + 1e-4 && z < r.z + r.d - 1e-4);
/* les ouvertures d'un mur : portes intérieures (partagées), fenêtres et portes d'entrée (sur la façade) */
function hbOpenings(E, r, lv, shared, H){
  const O = [], ext = hbIvMinus(E.a0, E.a1, shared.map(x => [x.s, x.e])), inExt = (a, b) => ext.some(([p, q]) => a >= p - 1e-4 && b <= q + 1e-4);
  const inShared = (a, b) => shared.some(x => !x.open && a >= x.s - 1e-4 && b <= x.e + 1e-4);
  lv.doors.forEach((d, i) => { if(d.o !== E.ax || Math.abs(d.c - E.c) > 1e-4) return; const w = d.w || 0.9, a = d.a - w / 2, b = d.a + w / 2;
    if(inShared(a, b) && a >= E.a0 + HB_T && b <= E.a1 - HB_T) O.push({ s:a, e:b, y0:0, y1:Math.min(H - 0.15, w > 1.3 ? 2.3 : 2.1), kind:'door', i, pass:w > 1.3 }); });
  const base = E.ax === 'x' ? r.x : r.z;
  (r.wins || []).forEach((wn, i) => { if(wn.s !== E.s) return; const w = wn.w || 1.2, h = Math.min(wn.h || 1.3, H - 0.25), y = clamp(wn.y == null ? 0.9 : wn.y, 0, H - h - 0.15), c = base + wn.u, a = c - w / 2, b = c + w / 2;
    if(inExt(a, b) && a >= E.a0 + HB_T + 0.05 && b <= E.a1 - HB_T - 0.05) O.push({ s:a, e:b, y0:y, y1:y + h, kind:'win', i, col:wn.f }); });
  (r.ext || []).forEach((dr, i) => { if(dr.s !== E.s) return; const w = dr.w || 1.0, c = base + dr.u, a = c - w / 2, b = c + w / 2;
    if(inExt(a, b) && a >= E.a0 + HB_T + 0.05 && b <= E.a1 - HB_T - 0.05) O.push({ s:a, e:b, y0:0, y1:Math.min(2.2, H - 0.15), kind:'ext', i, col:dr.c, glass:dr.g }); });
  // jamais deux ouvertures l'une sur l'autre : la première posée garde sa place
  O.sort((a, b) => a.s - b.s); const keep = [];
  O.forEach(o => { if(!keep.some(k => o.s < k.e + 0.05 && k.s < o.e + 0.05)) keep.push(o); });
  return { O:keep, ext };
}
/* une face verticale à texture, vue du côté nrm ; le motif suit les coordonnées du monde (aucune couture entre deux morceaux) */
function hbQ(gg, key, p, q, y, h, s, nrm, yb, coll){
  const len = Math.hypot(q[0] - p[0], q[1] - p[1]); if(len < 0.004 || h < 0.004) return;
  if(-(q[1] - p[1]) * nrm[0] + (q[0] - p[0]) * nrm[1] < 0){ const t = p; p = q; q = t; }
  if(COLL && coll !== false && h >= 0.4 && len >= 0.4) collOf(gg).w.push([p[0], p[1], q[0], q[1], y, y + h]);
  if(!TEXS) return; let m = TEXS.get(key); if(!m) TEXS.set(key, m = { p:[], u:[], l:[] });
  const al = Math.abs(q[0] - p[0]) >= Math.abs(q[1] - p[1]) ? 0 : 1, ua = p[al] / s, ub = q[al] / s, n = Math.hypot(nrm[0], nrm[1]) || 1, k = texLight([nrm[0] / n, 0, nrm[1] / n]);
  const A = [p[0], y, p[1]], B = [q[0], y, q[1]], Cc = [q[0], y + h, q[1]], D = [p[0], y + h, p[1]];
  [[A, ua, y], [B, ub, y], [Cc, ub, y + h], [A, ua, y], [Cc, ub, y + h], [D, ua, y + h]].forEach(([P, u, v]) => { m.p.push(P[0], P[1], P[2]); m.u.push(u, v / s); m.l.push(k, 1 + (yb || 0)); });
}
/* un dessus ou un dessous à texture, entre deux points quelconques (les coins sont remis dans l'ordre) */
function hbH(key, a, b, y, s, down, rot){
  const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]), z0 = Math.min(a[1], b[1]), z1 = Math.max(a[1], b[1]);
  if(x1 - x0 < 0.004 || z1 - z0 < 0.004) return; tfloor(key, x0, z0, x1, z1, y, s, down, rot);
}
const hbOrient = (p, q, nrm) => (-(q[1] - p[1]) * nrm[0] + (q[0] - p[0]) * nrm[1] < 0) ? [q, p] : [p, q];
/* coller une forme (un meuble) dans le décor, tournée et posée */
function hbMerge(dst, src, ry, tx, ty, tz){
  const c = Math.cos(ry), s = Math.sin(ry);
  for(let i = 0; i < src.p.length; i += 3){ const x = src.p[i], y = src.p[i + 1], z = src.p[i + 2], nx = src.n[i], ny = src.n[i + 1], nz = src.n[i + 2];
    dst.p.push(tx + x * c + z * s, ty + y, tz - x * s + z * c); dst.n.push(nx * c + nz * s, ny, -nx * s + nz * c); }
  for(const v of src.c) dst.c.push(v);
  if(dst.e && src.e) for(const v of src.e) dst.e.push(v);
  if(dst.m && src.m) for(const v of src.m) dst.m.push(v);
}

/* ---------- les meubles qui n'existaient pas encore (cuisine, salle de bain) ---------- */
function hbFurGeo(kind, len){
  const g = geo(), m0 = MAT; MAT = 0;
  if(kind === 'counter'){
    const W = len, D = 0.62, n = Math.max(1, Math.round(W / 0.6));
    box(g, 0, 0.45, -0.01, W, 0.8, D - 0.06, '#E9E6E0'); box(g, 0, 0.05, 0.02, W - 0.02, 0.1, D - 0.12, '#2C2E33');
    box(g, 0, 0.88, 0, W + 0.02, 0.04, D, '#3A3D44');
    for(let k = 1; k < n; k++) box(g, -W / 2 + k * W / n, 0.47, D / 2 - 0.035, 0.008, 0.72, 0.006, '#C9C6BE');
    for(let k = 0; k < n; k++) box(g, -W / 2 + (k + 0.5) * W / n, 0.78, D / 2 - 0.03, 0.18, 0.02, 0.02, '#9AA0A8');
    const e0 = EDGE_ON; EDGE_ON = 0; box(g, -W / 4, 0.902, 0.02, Math.min(0.6, W / 3), 0.006, 0.4, '#B8BEC4'); box(g, W / 4, 0.902, 0.02, Math.min(0.6, W / 3), 0.006, 0.5, '#1E1F23'); EDGE_ON = e0;
    cyl(g, -W / 4, 1.06, -0.22, 0.015, 0.015, 0.16, '#9AA0A8', 6); box(g, -W / 4, 1.13, -0.16, 0.02, 0.02, 0.14, '#9AA0A8');
    box(g, 0, 1.33, -D / 2 + 0.01, W, 0.86, 0.02, '#D9D4CB');   // la crédence
    box(g, 0, 1.92, -D / 2 + 0.18, W, 0.72, 0.34, '#E9E6E0');   // les meubles hauts
    for(let k = 1; k < n; k++) box(g, -W / 2 + k * W / n, 1.92, -D / 2 + 0.352, 0.008, 0.66, 0.006, '#C9C6BE');
  }
  else if(kind === 'tub'){
    box(g, 0, 0.27, 0, 1.62, 0.54, 0.74, '#F4F6F6'); const e0 = EDGE_ON; EDGE_ON = 0; box(g, 0, 0.545, 0.01, 1.46, 0.01, 0.58, '#CFE0E8'); EDGE_ON = e0;
    cyl(g, -0.66, 0.66, -0.3, 0.016, 0.016, 0.14, '#9AA0A8', 6); box(g, -0.66, 0.72, -0.25, 0.02, 0.02, 0.1, '#9AA0A8');
  }
  else if(kind === 'sink'){
    box(g, 0, 0.4, -0.08, 0.16, 0.8, 0.16, '#F4F6F6'); box(g, 0, 0.84, 0, 0.56, 0.12, 0.44, '#F4F6F6');
    const e0 = EDGE_ON; EDGE_ON = 0; box(g, 0, 0.902, 0.02, 0.42, 0.006, 0.28, '#CFE0E8'); EDGE_ON = e0;
    cyl(g, 0, 0.98, -0.15, 0.014, 0.014, 0.1, '#9AA0A8', 6);
    box(g, 0, 1.55, -0.21, 0.52, 0.66, 0.02, '#C9CDD3'); box(g, 0, 1.55, -0.198, 0.46, 0.6, 0.006, '#BFD7E6');   // le miroir
  }
  else if(kind === 'toilet'){
    box(g, 0, 0.2, 0.06, 0.34, 0.4, 0.46, '#F4F6F6'); box(g, 0, 0.42, 0.08, 0.38, 0.04, 0.5, '#F4F6F6'); box(g, 0, 0.62, -0.2, 0.4, 0.44, 0.2, '#F4F6F6'); box(g, 0, 0.86, -0.2, 0.42, 0.04, 0.22, '#E9EDEE');
  }
  MAT = m0; return g;
}
const HB_FUR_SIZE = { counter:[1, 0.31, 2.3], tub:[0.81, 0.37, 0.6], sink:[0.28, 0.24, 1.9], toilet:[0.2, 0.31, 0.9] };
const hbFurSize = k => HB_FUR_SIZE[k] || (OBJ_DEF[k] ? [OBJ_DEF[k].sh[0], OBJ_DEF[k].sh[1], OBJ_DEF[k].label || 1] : [0.3, 0.3, 1]);
const HB_GEO_CACHE = new Map();
function hbFurMesh(kind, len){
  const key = kind + ':' + (len || 0); if(HB_GEO_CACHE.has(key)) return HB_GEO_CACHE.get(key);
  const C0 = COLL; COLL = null; const g = HB_FUR_SIZE[kind] ? hbFurGeo(kind, len) : objGeo(kind); COLL = C0;
  HB_GEO_CACHE.set(key, g); return g;
}
/* chaque pièce se meuble selon ce qu'elle est : contre les murs (sans boucher une porte ni une fenêtre), au centre, dans les coins */
function hbFurnLayout(r, ctx){
  const T = HB_T, R = [r.x + T, r.z + T, r.x + r.w - T, r.z + r.d - T], W = R[2] - R[0], D = R[3] - R[1];
  const ty = HB_TYPE[r.t] || HB_TYPE.empty; if(W < 1.1 || D < 1.1 || !ty[5].length) return [];
  const blocks = ctx.blocks(r), wins = ctx.winZones(r), placed = [], by = {};
  const free = (rc, tall, soft) => rc[0] >= R[0] - 1e-6 && rc[1] >= R[1] - 1e-6 && rc[2] <= R[2] + 1e-6 && rc[3] <= R[3] + 1e-6
    && !blocks.some(b => hbOverlap(rc, b)) && !(tall && wins.some(b => hbOverlap(rc, b))) && (soft || !placed.some(p => !p.soft && hbOverlap(rc, p.rc, -0.04)));
  const atWall = (side, u, hx, hz) => side === 'n' ? { x:u, z:R[1] + hz, ry:0, rc:[u - hx, R[1], u + hx, R[1] + 2 * hz] }
    : side === 's' ? { x:u, z:R[3] - hz, ry:Math.PI, rc:[u - hx, R[3] - 2 * hz, u + hx, R[3]] }
    : side === 'w' ? { x:R[0] + hz, z:u, ry:Math.PI / 2, rc:[R[0], u - hx, R[0] + 2 * hz, u + hx] }
    : { x:R[2] - hz, z:u, ry:-Math.PI / 2, rc:[R[2] - 2 * hz, u - hx, R[2], u + hx] };
  const span = side => side === 'n' || side === 's' ? [R[0], R[2]] : [R[1], R[3]];
  const sides = ['n', 's', 'w', 'e'].sort((a, b) => (span(b)[1] - span(b)[0]) - (span(a)[1] - span(a)[0]));
  const opp = { n:'s', s:'n', w:'e', e:'w' };
  const put = (kind, P, extra) => { placed.push(Object.assign({ kind, x:P.x, z:P.z, ry:P.ry, rc:P.rc }, extra || {})); return placed[placed.length - 1]; };
  const tryWall = (kind, order, hx, hz, tall, near) => {
    for(const sd of order){ const [lo, hi] = span(sd); if(hi - lo < 2 * hx) continue;
      const mid = near != null ? near : (lo + hi) / 2, cand = [];
      for(let d = 0; d <= hi - lo; d += 0.15){ cand.push(mid + d); if(d) cand.push(mid - d); }
      for(const u of cand){ if(u - hx < lo - 1e-6 || u + hx > hi + 1e-6) continue; const P = atWall(sd, u, hx, hz); if(free(P.rc, tall)) return Object.assign(P, { side:sd, u }); } }
    return null;
  };
  ty[5].forEach(tok => {
    const [kind, mode] = tok.split('@'); let [hx, hz, h] = hbFurSize(kind); const tall = h > 1.15;
    if(mode === 'c'){
      const soft = kind === 'rug'; if(soft && (W < 2.6 || D < 2.6)) return;
      const cx = (R[0] + R[2]) / 2, cz = (R[1] + R[3]) / 2, ry = W >= D ? 0 : Math.PI / 2, ex = ry ? hz : hx, ez = ry ? hx : hz;
      for(const [dx, dz] of [[0, 0], [0.4, 0], [-0.4, 0], [0, 0.4], [0, -0.4], [0.8, 0], [-0.8, 0], [0, 0.8], [0, -0.8]]){
        const rc = [cx + dx - ex, cz + dz - ez, cx + dx + ex, cz + dz + ez]; if(free(rc, false, soft)){ by[kind] = put(kind, { x:cx + dx, z:cz + dz, ry, rc }, { soft }); return; } }
      return;
    }
    if(mode === 'k'){
      for(const [ax, az] of [[0, 0], [1, 1], [1, 0], [0, 1]]){ const x = ax ? R[2] - hx - 0.08 : R[0] + hx + 0.08, z = az ? R[3] - hz - 0.08 : R[1] + hz + 0.08, rc = [x - hx, z - hz, x + hx, z + hz];
        if(free(rc, tall)){ put(kind, { x, z, ry:az ? Math.PI : 0, rc }); return; } }
      return;
    }
    if(mode === 'b'){ const bed = by.bed; if(!bed) return;
      [-1, 1].forEach(sg => { const u = bed.u + sg * (hbFurSize('bed')[0] + hx + 0.04), P = atWall(bed.side, u, hx, hz); if(free(P.rc, false)) put(kind, P); }); return; }
    if(mode === 't'){ const t = by.table; if(!t) return; const al = t.ry ? 1 : 0;
      [[-0.3, -0.62, 0], [0.3, -0.62, 0], [-0.3, 0.62, Math.PI], [0.3, 0.62, Math.PI]].forEach(([a, b, ry]) => { const x = t.x + (al ? b : a), z = t.z + (al ? -a : b), r2 = al ? ry + Math.PI / 2 : ry, rc = [x - 0.24, z - 0.24, x + 0.24, z + 0.24];
        if(free(rc, false)) put('chair', { x, z, ry:r2, rc }); }); return; }
    if(mode === 'd'){ const d = by.desk; if(!d) return; const c = Math.cos(d.ry), s = Math.sin(d.ry), lx = 0.15, lz = 0.62, x = d.x + lx * c + lz * s, z = d.z - lx * s + lz * c, rc = [x - 0.24, z - 0.24, x + 0.24, z + 0.24];
      if(free(rc, false)) put('chair', { x, z, ry:d.ry + Math.PI, rc }); return; }
    // contre un mur
    let order = sides, len = 0;
    if(mode === 'o' && by.sofa) order = [opp[by.sofa.side]].concat(sides.filter(s => s !== opp[by.sofa.side]));
    if(kind === 'counter'){
      for(const L0 of [2.8, 2.4, 2.0, 1.6, 1.2]){ const P = tryWall(kind, sides, L0 / 2, 0.31, true); if(P){ by.counter = put(kind, P, { len:L0, side:P.side, u:P.u }); return; } }
      return;
    }
    if(kind === 'fridge' && by.counter) order = [by.counter.side].concat(sides.filter(s => s !== by.counter.side));
    const P = tryWall(kind, order, hx, hz, tall, kind === 'fridge' && by.counter ? by.counter.u + by.counter.len / 2 + hx + 0.04 : null);
    if(P) by[kind] = put(kind, P, { side:P.side, u:P.u, len });
  });
  placed.forEach(p => { p.h = hbFurSize(p.kind)[2]; });
  return placed;
}
function hbFurnish(gg, r, ctx, y0){
  hbFurnLayout(r, ctx).forEach(p => hbMerge(gg, hbFurMesh(p.kind, p.len ? Math.round(p.len * 10) / 10 : 0), p.ry, p.x, y0, p.z));
}

/* le contexte d'un étage : ses portes, ses passages, ses escaliers (pour meubler sans rien boucher) */
function hbCtx(hs, i){
  const LV = hbLevelsOf(hs), lv = hbL(LV[i]), below = LV[i - 1] ? hbL(LV[i - 1]) : null;
  const stHere = lv.st.map(s => { const R = hbStRect(s), m = 0.8; return s.dir === 'n' ? [R[0], R[1], R[2], R[3] + m] : s.dir === 's' ? [R[0], R[1] - m, R[2], R[3]] : s.dir === 'e' ? [R[0] - m, R[1], R[2], R[3]] : [R[0], R[1], R[2] + m, R[3]]; });
  const holes = below ? below.st.map(s => { const R = hbStRect(s); return [R[0] - 0.1, R[1] - 0.1, R[2] + 0.1, R[3] + 0.1]; }) : [];
  return {
    blocks(r){
      const out = stHere.concat(holes);
      hbEdges(r).forEach(E => { const sh = hbShared(E, r, lv.rooms, lv.open), { O } = hbOpenings(E, r, lv, sh, 9);
        O.filter(o => o.kind !== 'win').forEach(o => { const a = hbP(E, o.s - 0.12, 0), b = hbP(E, o.e + 0.12, 1.0); out.push([Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])]); });
        sh.filter(x => x.open).forEach(x => { const a = hbP(E, x.s, 0), b = hbP(E, x.e, 0.75); out.push([Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])]); }); });
      return out;
    },
    winZones(r){
      const out = [];
      hbEdges(r).forEach(E => { const sh = hbShared(E, r, lv.rooms, lv.open), { O } = hbOpenings(E, r, lv, sh, 9);
        O.filter(o => o.kind === 'win').forEach(o => { const a = hbP(E, o.s - 0.05, 0), b = hbP(E, o.e + 0.05, 0.45); out.push([Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])]); }); });
      return out;
    },
  };
}

/* un étage : les sols, les plafonds, les murs (avec leurs ouvertures), la façade, l'escalier, les meubles, les toits */
function hbBuildLevel(gg, hs, i, opt){
  const LV = hbLevelsOf(hs), lv = hbL(LV[i]), below = LV[i - 1] ? hbL(LV[i - 1]) : null, above = LV[i + 1] && !(opt.cut != null && i >= opt.cut) ? hbL(LV[i + 1]) : null;
  const H = opt.H, y0 = opt.lvY(i), T = HB_T, TO = HB_TO, top = opt.cut != null && i === opt.cut, WH = top ? Math.min(H, 1.25) : H;
  const C = mapSurf(hs.ceil, 'paint'), FA = mapSurf(hs.fac, 'plaster'), facK = texKey(FA);
  const stUp = lv.st.map(hbStRect), stDown = below ? below.st.map(hbStRect) : [];
  const ctx = hbCtx(hs, i);
  lv.rooms.forEach(r => {
    const ty = HB_TYPE[r.t] || HB_TYPE.empty, F = mapSurf(r.f || { k:ty[3][0], c:ty[3][1] }, 'parquet'), Wl = mapSurf(r.wl || { k:ty[4][0], c:ty[4][1] }, 'paint'), wk = texKey(Wl);
    const rect = hbRect(r);
    hbMinus(rect, stDown).forEach(q => tfloor(texKey(F), q[0], q[1], q[2], q[3], y0, F.s, false, r.frot));
    if(!top) hbMinus(rect, stUp).forEach(q => tfloor(texKey(C), q[0], q[1], q[2], q[3], y0 + H, C.s, true));
    // les murs, vus de l'intérieur de la pièce
    hbEdges(r).forEach(E => {
      const sh = hbShared(E, r, lv.rooms, lv.open), { O } = hbOpenings(E, r, lv, sh, H), nI = hbN(E);
      const runs = hbIvMinus(E.a0, E.a1, sh.filter(x => x.open).map(x => [x.s, x.e]));
      runs.forEach(([s0, e0]) => {
        const s = Math.max(s0, E.a0 + T), e = Math.min(e0, E.a1 - T);
        // au bout d'un mur ouvert sur la pièce voisine : son épaisseur
        if(s0 > E.a0 + 1e-4) hbQ(gg, wk, hbP(E, s0, 0), hbP(E, s0, T), y0, WH, Wl.s, hbAlongN(E, -1), y0, false);
        if(e0 < E.a1 - 1e-4) hbQ(gg, wk, hbP(E, e0, 0), hbP(E, e0, T), y0, WH, Wl.s, hbAlongN(E, 1), y0, false);
        let cur = s; const os = O.filter(o => o.s >= s - 1e-4 && o.e <= e + 1e-4);
        const skirt = (a, b) => { if(b - a < 0.05 || top) return; const [p, q] = hbOrient(hbP(E, a, T + 0.007), hbP(E, b, T + 0.007), nI); wall(gg, p, q, 0.08, hs.sk || '#E9E6E0', y0); };
        os.forEach(o => {
          hbQ(gg, wk, hbP(E, cur, T), hbP(E, o.s, T), y0, WH, Wl.s, nI, y0); skirt(cur, o.s);
          if(o.y0 > 0.001){ hbQ(gg, wk, hbP(E, o.s, T), hbP(E, o.e, T), y0, Math.min(o.y0, WH), Wl.s, nI, y0, false); skirt(o.s, o.e); }
          if(o.y1 < WH - 0.001) hbQ(gg, wk, hbP(E, o.s, T), hbP(E, o.e, T), y0 + o.y1, WH - o.y1, Wl.s, nI, y0, false);
          // l'épaisseur du mur dans l'ouverture : les côtés, le dessus, l'appui
          const yt = Math.min(o.y1, WH);
          hbQ(gg, wk, hbP(E, o.s, 0), hbP(E, o.s, T), y0 + o.y0, yt - o.y0, Wl.s, hbAlongN(E, 1), y0, false);
          hbQ(gg, wk, hbP(E, o.e, 0), hbP(E, o.e, T), y0 + o.y0, yt - o.y0, Wl.s, hbAlongN(E, -1), y0, false);
          if(o.y1 < WH) hbH(wk, hbP(E, o.s, 0), hbP(E, o.e, T), y0 + o.y1, Wl.s, true);
          if(o.y0 > 0.001 && o.y0 < WH) hbH(wk, hbP(E, o.s, 0), hbP(E, o.e, T), y0 + o.y0, Wl.s, false);
          // les chambranles des portes, blancs, du côté de la pièce
          if(o.kind !== 'win' && !o.pass && !top) hbCasing(gg, E, o.s, o.e, T + 0.012, y0, o.y1, '#F4F2EE');
          cur = o.e;
        });
        hbQ(gg, wk, hbP(E, cur, T), hbP(E, e, T), y0, WH, Wl.s, nI, y0); skirt(cur, e);
      });
      // les fenêtres : la vitre au milieu du mur, un cadre de chaque côté
      O.filter(o => o.kind === 'win').forEach(o => {
        const h = Math.min(o.y1, WH) - o.y0; if(h < 0.3) return;
        const [a1, b1] = hbOrient(hbP(E, o.s, 0), hbP(E, o.e, 0), nI), [a2, b2] = hbOrient(hbP(E, o.s, 0), hbP(E, o.e, 0), hbN(E, -1));
        pane(gg, a1, b1, h, '#A9C9DE', y0 + o.y0); pane(gg, a2, b2, h, '#A9C9DE', y0 + o.y0);
        const C0 = COLL; COLL = null; const fc = o.col || hs.wf || '#F4F2EE';
        winFrame(gg, a1, b1, h, y0 + o.y0, fc, false); winFrame(gg, a2, b2, h, y0 + o.y0, fc, o.y0 > 0.05); COLL = C0;
      });
      // la porte d'entrée : un vrai battant, dans sa couleur
      O.filter(o => o.kind === 'ext').forEach(o => {
        const C0 = COLL; COLL = null; const DC = o.col || hs.dcol || '#2F5E7E', w = o.e - o.s, h = o.y1 - o.y0, cx = (o.s + o.e) / 2, P0 = hbP(E, cx, -0.02);
        box(gg, P0[0], y0 + h / 2, P0[1], E.ax === 'x' ? w - 0.02 : 0.05, h - 0.01, E.ax === 'x' ? 0.05 : w - 0.02, DC);
        if(o.glass){ const Pg = hbP(E, cx, -0.02); box(gg, Pg[0], y0 + h * 0.7, Pg[1], E.ax === 'x' ? w * 0.5 : 0.056, h * 0.36, E.ax === 'x' ? 0.056 : w * 0.5, '#A9C9DE'); }
        [-1, 1].forEach(sg => { const Ph = hbP(E, cx + w * 0.36, -0.02 + sg * 0.05); box(gg, Ph[0], y0 + 1.02, Ph[1], E.ax === 'x' ? 0.12 : 0.03, 0.03, E.ax === 'x' ? 0.03 : 0.12, '#C9CDD3'); });
        hbCasing(gg, E, o.s, o.e, T + 0.012, y0, h, '#F4F2EE'); hbCasing(gg, E, o.s, o.e, -TO - 0.012, y0, h, '#F4F2EE'); COLL = C0;
      });
    });
    // la lumière du plafond (allumée la nuit)
    if(!top && (hs.lights || 'pendant') !== 'none' && !stDown.some(h => hbOverlap(rect, h) && hbInside([r.x + r.w / 2 - 0.3, r.z + r.d / 2 - 0.3, r.x + r.w / 2 + 0.3, r.z + r.d / 2 + 0.3], h))){
      const x = r.x + r.w / 2, z = r.z + r.d / 2, LC = hs.lcol === 'cool' ? '#F4F7FA' : hs.lcol === 'neutral' ? '#F7F5F0' : '#F4E3C2', m0 = MAT, LT = hs.lights || 'pendant';
      if(LT === 'pendant'){ const drop = Math.min(0.75, H - 2.05); box(gg, x, y0 + H - drop / 2, z, 0.012, drop, 0.012, '#2C2E33'); cyl(gg, x, y0 + H - drop, z, 0.05, 0.2, 0.18, '#2C2E33', 10); MAT = 5; ball(gg, x, y0 + H - drop - 0.17, z, 0.06, 0.06, 0.06, LC, 7); MAT = m0; }
      else if(LT === 'spot'){ MAT = 5; [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => cyl(gg, x + a * r.w / 4, y0 + H, z + b * r.d / 4, 0.08, 0.08, 0.025, LC, 10)); MAT = m0; }
      else { MAT = 5; box(gg, x, y0 + H - 0.02, z, Math.min(1.2, r.w * 0.4), 0.04, 0.3, LC); MAT = m0; }
    }
    if(hs.fur !== false && r.fur !== false && opt.furnish !== false) hbFurnish(gg, r, ctx, y0);
  });
  // la façade : seulement là où le mur donne dehors ; les coins se referment (saillants, rentrants)
  lv.rooms.forEach(r => hbEdges(r).forEach(E => {
    const sh = hbShared(E, r, lv.rooms, lv.open), { O, ext } = hbOpenings(E, r, lv, sh, H), nO = hbN(E, -1);
    ext.forEach(([s, e]) => {
      const endX = (a, dir) => { const po = hbP(E, a + dir * 0.05, -0.05), pi = hbP(E, a + dir * 0.05, 0.05); return hbOcc(lv.rooms, po[0], po[1]) ? -TO : hbOcc(lv.rooms, pi[0], pi[1]) ? 0 : TO; };
      const S0 = s - endX(s, -1), E0 = e + endX(e, 1), mid = hbP(E, (s + e) / 2, 0.06);
      const coveredAbove = above && hbOcc(above.rooms, mid[0], mid[1]), overBelow = i > 0 && below && hbOcc(below.rooms, mid[0], mid[1]);
      const yb = i > 0 && !overBelow ? y0 - HB_SL : y0, flat = !coveredAbove && !(opt.gableLv === i), par = top ? 0 : flat ? 0.38 : 0;
      const yt = top ? y0 + WH : y0 + H + HB_SL + par;
      let cur = S0; const os = O.filter(o => o.s >= s - 1e-4 && o.e <= e + 1e-4 && (o.kind !== 'door'));
      os.forEach(o => {
        const oy0 = y0 + o.y0, oy1 = Math.min(y0 + o.y1, yt);
        hbQ(gg, facK, hbP(E, cur, -TO), hbP(E, o.s, -TO), yb, yt - yb, FA.s, nO, 0);
        if(oy0 > yb + 0.001) hbQ(gg, facK, hbP(E, o.s, -TO), hbP(E, o.e, -TO), yb, oy0 - yb, FA.s, nO, 0, false);
        if(oy1 < yt - 0.001) hbQ(gg, facK, hbP(E, o.s, -TO), hbP(E, o.e, -TO), oy1, yt - oy1, FA.s, nO, 0, false);
        hbQ(gg, facK, hbP(E, o.s, -TO), hbP(E, o.s, 0), oy0, oy1 - oy0, FA.s, hbAlongN(E, 1), 0, false);
        hbQ(gg, facK, hbP(E, o.e, -TO), hbP(E, o.e, 0), oy0, oy1 - oy0, FA.s, hbAlongN(E, -1), 0, false);
        if(oy1 < yt) hbH(facK, hbP(E, o.s, -TO), hbP(E, o.e, 0), oy1, FA.s, true);
        if(o.kind === 'win' && o.y0 > 0.05){ const C0 = COLL; COLL = null; const P = hbP(E, (o.s + o.e) / 2, -TO - 0.02);
          box(gg, P[0], oy0 - 0.03, P[1], E.ax === 'x' ? o.e - o.s + 0.12 : 0.16, 0.06, E.ax === 'x' ? 0.16 : o.e - o.s + 0.12, '#D9D4CB'); COLL = C0; }
        if(o.kind === 'ext' && i === 0 && !top){ const C0 = COLL; COLL = null; const P = hbP(E, (o.s + o.e) / 2, -TO - 0.25);   // la marche du seuil
          box(gg, P[0], 0.04, P[1], E.ax === 'x' ? o.e - o.s + 0.5 : 0.5, 0.08, E.ax === 'x' ? 0.5 : o.e - o.s + 0.5, '#B9B4AA'); COLL = C0; }
        cur = o.e;
      });
      hbQ(gg, facK, hbP(E, cur, -TO), hbP(E, E0, -TO), yb, yt - yb, FA.s, nO, 0);
      // l'acrotère d'un toit plat : sa face intérieure et sa couvertine
      if(par){ const C0 = COLL; COLL = null;
        hbQ(gg, facK, hbP(E, s, 0), hbP(E, e, 0), y0 + H + HB_SL, par, FA.s, hbN(E), 0, false);
        const a = hbP(E, S0, -TO - 0.03), b = hbP(E, E0, 0.03); box(gg, (a[0] + b[0]) / 2, y0 + H + HB_SL + par + 0.025, (a[1] + b[1]) / 2, Math.abs(b[0] - a[0]), 0.05, Math.abs(b[1] - a[1]), '#D9D4CB'); COLL = C0; }
      // le bas d'un étage qui avance au-dessus du vide : son dessous
      if(yb < y0){ const a = hbP(E, s, -TO), b = hbP(E, e, 0); hbH(facK, a, b, yb, FA.s, true); }
    });
  }));
  // le dessous d'un étage là où il n'y a rien en dessous
  if(i > 0 && !top) lv.rooms.forEach(r => hbMinus(hbRect(r), below ? below.rooms.map(hbRect) : []).forEach(q => tfloor(facK, q[0], q[1], q[2], q[3], y0 - HB_SL, FA.s, true)));
  // l'escalier qui monte d'ici, et le garde-corps autour de celui qui arrive
  if(!top || opt.cut === undefined) lv.st.forEach(s => hbStairs(gg, s, lv, y0, H + HB_SL, opt));
  if(below) below.st.forEach(s => {
    const R = hbStRect(s), sides = [[[R[0], R[1]], [R[2], R[1]], 'n'], [[R[2], R[3]], [R[0], R[3]], 's'], [[R[0], R[3]], [R[0], R[1]], 'w'], [[R[2], R[1]], [R[2], R[3]], 'e']];
    const C0 = COLL; COLL = null;
    sides.forEach(([a, b, sd]) => { if(sd === s.dir) return;   // le côté par où l'on arrive reste libre
      const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], o = sd === 'n' ? [0, -0.1] : sd === 's' ? [0, 0.1] : sd === 'w' ? [-0.1, 0] : [0.1, 0];
      if(!hbOcc(lv.rooms, m[0] + o[0], m[1] + o[1])) return;   // contre un mur : pas besoin de rampe
      railing(gg, a, b, y0); });
    COLL = C0;
  });
  // les toits plats : là où rien n'est posé au-dessus
  if(!top){ const RF = mapSurf((hs.roof || 'gable') === 'flat' ? hs.rf : null, 'gravel');
    lv.rooms.forEach(r => { const pieces = hbMinus(hbRect(r), above ? above.rooms.map(hbRect) : []);
      if(opt.gableLv === i) return;
      pieces.forEach(q => tfloor(texKey(RF), q[0], q[1], q[2], q[3], y0 + H + HB_SL, RF.s, false)); }); }
}
/* un encadrement de porte : deux montants et la traverse, posés sur le mur (off : à quelle distance de l'axe du mur) */
function hbCasing(gg, E, a, b, off, y0, h, col){
  const C0 = COLL, X = E.ax === 'x'; COLL = null;
  [a - 0.035, b + 0.035].forEach(u => { const P = hbP(E, u, off); box(gg, P[0], y0 + (h + 0.05) / 2, P[1], X ? 0.07 : 0.025, h + 0.05, X ? 0.025 : 0.07, col); });
  const P = hbP(E, (a + b) / 2, off); box(gg, P[0], y0 + h + 0.035, P[1], X ? b - a + 0.14 : 0.025, 0.07, X ? 0.025 : b - a + 0.14, col);
  COLL = C0;
}
/* un escalier droit, tourné dans le sens où il monte (n : vers le fond, s : vers l'avant, e : vers la droite, w : vers la gauche) */
function hbStairs(gg, s, lv, y0, rise, opt){
  const R = hbStRect(s), w = s.w || 1, l = s.l || 3.6, n = Math.max(10, Math.round(rise / 0.185)), g2 = geo(), C0 = COLL; COLL = null;
  const cx = (R[0] + R[2]) / 2, cz = (R[1] + R[3]) / 2, ry = { n:0, s:Math.PI, e:-Math.PI / 2, w:Math.PI / 2 }[s.dir] || 0;
  // une rampe du côté qui ne touche pas de mur
  const room = lv.rooms.find(r => hbInside(R, hbRect(r)));
  const rails = [-w / 2 - 0.02, w / 2 + 0.02].filter(lx => { const c = Math.cos(ry), sn = Math.sin(ry), px = cx + (lx + Math.sign(lx) * 0.2) * c, pz = cz - (lx + Math.sign(lx) * 0.2) * sn; return room && hbOcc([room], px, pz); });
  stairs(g2, -w / 2, w / 2, l / 2, -l / 2, 0, rise, n, s.c || '#8A6A4A', opt.cut != null ? [] : rails);
  hbMerge(gg, g2, ry, cx, y0, cz); COLL = C0;
}
/* la maison entière : son jardin, ses étages, son toit */
function houseDef(m, opt){
  opt = opt || {};
  const hs = m.hs || {}, LV = hbLevelsOf(hs), nL = LV.length, H = clamp(+hs.H || 2.7, 2.3, 4), lvY = i => i * (H + HB_SL);
  const all = []; LV.forEach((lv, i) => (lv.rooms || []).forEach(r => all.push([r, i])));
  const B = all.length ? all.reduce((b, [r]) => [Math.min(b[0], r.x), Math.min(b[1], r.z), Math.max(b[2], r.x + r.w), Math.max(b[3], r.z + r.d)], [1e9, 1e9, -1e9, -1e9]) : [-4, -3, 4, 3];
  const cx = (B[0] + B[2]) / 2, cz = (B[1] + B[3]) / 2, ext = Math.max(B[2] - B[0], B[3] - B[1]);
  const lastLv = opt.cut != null ? Math.min(opt.cut, nL - 1) : nL - 1;
  // le toit à deux pentes couvre l'étage du haut (tout l'étage, d'un seul tenant)
  const gableLv = (hs.roof || 'gable') === 'gable' && opt.cut == null ? nL - 1 : -1;
  const d = { custom:m.id, house:true, view:hs.view === 'city' ? undefined : 'nature', roomH:H,
    bg:'#C6D6E4', sky:{ top:'#82B0D8', hor:'#DCE8EE', low:'#7C9A68' }, fog:[30, 160],
    build(g, gl, Lg){
      const GA = mapSurf(hs.gnd, 'grass');
      tfloor(texKey(GA), B[0] - 9, B[1] - 9, B[2] + 9, B[3] + 9, -0.02, GA.s);
      floor(g, -150, -150, 150, 150, -0.05, hexRGB(/grass|sand|dirt/.test(GA.k) ? GA.c : '#8F9A7E').map(v => v * 0.92));
      // une allée devant chaque porte d'entrée du rez-de-chaussée
      const lv0 = hbL(LV[0]);
      lv0.rooms.forEach(r => (r.ext || []).forEach(dr => { const E = hbEdges(r).find(x => x.s === dr.s); if(!E) return; const c = (E.ax === 'x' ? r.x : r.z) + dr.u, w = (dr.w || 1) + 0.5;
        const a = hbP(E, c - w / 2, -HB_TO - 0.5), b = hbP(E, c + w / 2, -HB_TO - 3.4), PK = { k:'cobble', c:'#A08A6E', s:1.2 }; hbH(texKey(PK), a, b, -0.008, PK.s, false); }));
      for(let i = 0; i <= lastLv; i++) hbBuildLevel(Lg && Lg[i] && nL > 1 ? Lg[i] : g, hs, i, { H, lvY, cut:opt.cut, gableLv, furnish:opt.furnish });
      if(gableLv >= 0 && (LV[gableLv].rooms || []).length) hbGable(nL > 1 && Lg ? Lg[gableLv] : g, hs, LV[gableLv].rooms, lvY(gableLv) + H + HB_SL);
    } };
  if(nL > 1 && opt.cut == null) d.levels = LV.map((_, i) => lvY(i));
  else if(opt.cut != null && opt.cut > 0) d.levels = LV.slice(0, opt.cut + 1).map((_, i) => lvY(i));
  d.rooms = all.filter(([, i]) => opt.cut == null || i <= opt.cut).map(([r, i]) => { const nm = r.n || L((HB_TYPE[r.t] || HB_TYPE.empty)[1], (HB_TYPE[r.t] || HB_TYPE.empty)[2]); return [nm, nm, i, hbRect(r)]; });
  // dehors : la caméra dans le jardin, de trois quarts, qui vise la façade (jamais l'intérieur : elle ne traverse pas les murs)
  const out = [cx + ext * 0.5 + 3.5, 1.7 + (nL > 1 ? 1.2 : 0.4), B[3] + ext * 0.85 + 5.5];
  d.garden = ['Dehors', 'Outside', -1, out, [cx + (B[2] - B[0]) * 0.12, 1.5 + (nL - 1) * 1.35, B[3] + HB_TO + 0.9]];
  // la caméra d'une pièce : dans le coin le plus éloigné du centre qui n'est pas pris par un grand meuble (armoire, bibliothèque…)
  const ctxs = LV.map((_, i) => hbCtx(hs, i));
  d.floors = d.rooms.map((rr, k) => {
    const [r, i] = all.filter(([, j]) => opt.cut == null || j <= opt.cut)[k], y0 = lvY(i), [x0, z0, x1, z1] = rr[3], m = 0.45;
    const fur = hs.fur !== false && r.fur !== false ? hbFurnLayout(r, ctxs[i]).filter(p => p.h > 1.0 || p.kind === 'counter') : [];
    const t = [(x0 + x1) / 2, y0 + 1.0, (z0 + z1) / 2];
    const cand = [[x0 + m, z0 + m], [x1 - m, z0 + m], [x0 + m, z1 - m], [x1 - m, z1 - m]].map(([x, z]) => {
      const near = fur.some(p => hbOverlap([x - 0.55, z - 0.55, x + 0.55, z + 0.55], p.rc)), blk = ctxs[i].blocks(r).some(b => hbOverlap([x - 0.2, z - 0.2, x + 0.2, z + 0.2], b));
      return { e:[x, y0 + 1.65, z], bad:(near ? 2 : 0) + (blk ? 1 : 0), dd:Math.hypot(x - t[0], z - t[2]) }; });
    const best = cand.sort((a, b) => a.bad - b.bad || b.dd - a.dd)[0];
    return [rr[0], rr[1], rr[2], best.e, t, rr];
  }).concat([d.garden]);
  d.cam = d.floors.length > 1 ? camLook(d.floors[0][3], d.floors[0][4], 22) : camLook(out, d.garden[4], 28);
  d.camOut = camLook(out, d.garden[4], 28);
  d.prev = camLook([cx + ext * 0.6 + 5, lvY(nL - 1) + H + ext * 0.35 + 3, B[3] + ext * 0.7 + 5], [cx, lvY(nL - 1) * 0.5 + 1.2, cz], 28);
  const r0 = all[0] && all[0][0];
  // les personnages arrivent dans la première pièce, sur un endroit libre (jamais sur la table basse ni dans le canapé)
  const freeSpots = r => { const fur = hs.fur !== false && r.fur !== false ? hbFurnLayout(r, ctxs[all[0][1]]).filter(q => !q.soft) : [], out = [];
    for(let k = 0; k < 40 && out.length < 2; k++){ const a = k * 2.4, rad = 0.25 * Math.sqrt(k), x = r.x + r.w / 2 + Math.cos(a) * rad, z = r.z + r.d / 2 + Math.sin(a) * rad;
      if(x < r.x + 0.4 || x > r.x + r.w - 0.4 || z < r.z + 0.4 || z > r.z + r.d - 0.4) continue;
      if(fur.some(q => hbOverlap([x - 0.3, z - 0.3, x + 0.3, z + 0.3], q.rc)) || out.some(o => Math.hypot(o[0] - x, o[1] - z) < 0.9)) continue; out.push([x, z]); }
    while(out.length < 2) out.push([r.x + r.w / 2 + out.length * 0.6, r.z + r.d / 2]); return out; };
  d.spawn = r0 ? freeSpots(r0).map(([x, z], k) => ({ x, z, ry:k ? -20 : 20, y:lvY(all[0][1]) || undefined }))
    : [{ x:cx - 0.6, z:B[3] + 2, ry:20 }, { x:cx + 0.6, z:B[3] + 2.2, ry:-20 }];
  // les places : au milieu de chaque pièce
  if(opt.cut == null) SPOTS['my_' + m.id] = all.slice(0, 16).map(([r, i]) => { const nm = r.n || L((HB_TYPE[r.t] || HB_TYPE.empty)[1], (HB_TYPE[r.t] || HB_TYPE.empty)[2]); return [nm, nm, r.x + r.w / 2, r.z + r.d / 2, 180, null, lvY(i) || undefined]; });
  d.hplan = { box:B, n:nL };
  return d;
}
/* le toit à deux pentes de l'étage du haut : le faîte dans la longueur, un débord tout autour, les pignons dans la façade */
function hbGable(gg, hs, rooms, yR){
  const B = rooms.reduce((b, r) => [Math.min(b[0], r.x), Math.min(b[1], r.z), Math.max(b[2], r.x + r.w), Math.max(b[3], r.z + r.d)], [1e9, 1e9, -1e9, -1e9]);
  const ov = 0.4, x0 = B[0] - HB_TO - ov, x1 = B[2] + HB_TO + ov, z0 = B[1] - HB_TO - ov, z1 = B[3] + HB_TO + ov, alongX = (x1 - x0) >= (z1 - z0);
  const half = alongX ? (z1 - z0) / 2 : (x1 - x0) / 2, rise = Math.min(half * 0.62, 3.2), RT = mapSurf(hs.rf && TEX_KINDS[hs.rf.k] && TEX_KINDS[hs.rf.k].on.includes('r') ? hs.rf : null, 'rtile'), key = texKey(RT), s = RT.s;
  const FA = mapSurf(hs.fac, 'plaster'), fk = texKey(FA), yE = yR - 0.06, m0 = MAT;
  const slope = (A, Bp, Cp, D, n) => { if(!TEXS) return; let mm = TEXS.get(key); if(!mm) TEXS.set(key, mm = { p:[], u:[], l:[] }); const k = texLight(n);
    const uv = p => alongX ? [p[0] / s, Math.hypot(p[2] - (z0 + z1) / 2, p[1] - yE) / s] : [p[2] / s, Math.hypot(p[0] - (x0 + x1) / 2, p[1] - yE) / s];
    [A, Bp, Cp, A, Cp, D].forEach(P => { const u = uv(P); mm.p.push(P[0], P[1], P[2]); mm.u.push(u[0], u[1]); mm.l.push(k, 0); }); };
  const nl = Math.hypot(half, rise);
  if(alongX){ const zm = (z0 + z1) / 2, yt = yE + rise;
    slope([x0, yE, z1], [x1, yE, z1], [x1, yt, zm], [x0, yt, zm], [0, half / nl, rise / nl]);
    slope([x1, yE, z0], [x0, yE, z0], [x0, yt, zm], [x1, yt, zm], [0, half / nl, -rise / nl]);
    // les dessous du débord, et les pignons (dans la matière de la façade)
    quad(gg, [x0, yE - 0.01, z1], [x0, yt - 0.01, zm], [x1, yt - 0.01, zm], [x1, yE - 0.01, z1], hexRGB('#E9E6E0')); quad(gg, [x1, yE - 0.01, z0], [x1, yt - 0.01, zm], [x0, yt - 0.01, zm], [x0, yE - 0.01, z0], hexRGB('#E9E6E0'));
    [[B[0] - HB_TO, -1], [B[2] + HB_TO, 1]].forEach(([x, sg]) => { const zz0 = B[1] - HB_TO, zz1 = B[3] + HB_TO, hh = rise * ((zz1 - zz0) / 2) / half;
      let mm = TEXS && TEXS.get(fk); if(TEXS && !mm) TEXS.set(fk, mm = { p:[], u:[], l:[] }); if(!mm) return; const k = texLight([sg, 0, 0]);
      const P = sg > 0 ? [[x, yR, zz0], [x, yR + hh, zm], [x, yR, zz1]] : [[x, yR, zz1], [x, yR + hh, zm], [x, yR, zz0]];
      P.forEach(p => { mm.p.push(p[0], p[1], p[2]); mm.u.push(p[2] / FA.s, p[1] / FA.s); mm.l.push(k, 0); }); });
    MAT = 1; box(gg, (x0 + x1) / 2, yt + 0.04, zm, x1 - x0, 0.08, 0.16, hexRGB(RT.k === 'img' ? '#5E636C' : RT.c).map(v => v * 0.8)); MAT = m0;
  } else { const xm = (x0 + x1) / 2, yt = yE + rise;
    slope([x1, yE, z1], [x1, yE, z0], [xm, yt, z0], [xm, yt, z1], [half / nl, rise / nl, 0]);
    slope([x0, yE, z0], [x0, yE, z1], [xm, yt, z1], [xm, yt, z0], [-half / nl, rise / nl, 0]);
    quad(gg, [x1, yE - 0.01, z1], [xm, yt - 0.01, z1], [xm, yt - 0.01, z0], [x1, yE - 0.01, z0], hexRGB('#E9E6E0')); quad(gg, [x0, yE - 0.01, z0], [xm, yt - 0.01, z0], [xm, yt - 0.01, z1], [x0, yE - 0.01, z1], hexRGB('#E9E6E0'));
    [[B[1] - HB_TO, -1], [B[3] + HB_TO, 1]].forEach(([z, sg]) => { const xx0 = B[0] - HB_TO, xx1 = B[2] + HB_TO, hh = rise * ((xx1 - xx0) / 2) / half;
      let mm = TEXS && TEXS.get(fk); if(TEXS && !mm) TEXS.set(fk, mm = { p:[], u:[], l:[] }); if(!mm) return; const k = texLight([0, 0, sg]);
      const P = sg > 0 ? [[xx1, yR, z], [xm, yR + hh, z], [xx0, yR, z]] : [[xx0, yR, z], [xm, yR + hh, z], [xx1, yR, z]];
      P.forEach(p => { mm.p.push(p[0], p[1], p[2]); mm.u.push(p[0] / FA.s, p[1] / FA.s); mm.l.push(k, 0); }); });
    MAT = 1; box(gg, xm, yt + 0.04, (z0 + z1) / 2, 0.16, 0.08, z1 - z0, hexRGB(RT.k === 'img' ? '#5E636C' : RT.c).map(v => v * 0.8)); MAT = m0;
  }
  // sous le toit, au-dessus du dernier plafond : un plancher de comble (on ne voit jamais le vide par une fenêtre de pignon)
  const C0 = COLL; COLL = null; floor(gg, B[0], B[1], B[2], B[3], yR + 0.001, '#B9A88F'); COLL = C0;
}
/* « Mon lieu » : une maison passe par l'atelier, le reste est fait comme avant */
const hbMapDefBase = mapDef;
mapDef = function(m){ return m && m.kind === 'house' ? houseDef(m) : hbMapDefBase.apply(this, arguments); };

/* ---------- 3. Les données : modèles, portes automatiques, nettoyage ---------- */
const HB_PRIO = ['corridor', 'hall', 'living', 'dining', 'kitchen', 'office', 'garage', 'bedroom', 'kids', 'empty', 'bath', 'wc'];
function hbRoom(t, x, z, w, d, extra){
  const ty = HB_TYPE[t] || HB_TYPE.empty;
  return Object.assign({ id:hbUid(), t, n:L(ty[1], ty[2]), x, z, w, d, f:{ k:ty[3][0], c:ty[3][1] }, wl:{ k:ty[4][0], c:ty[4][1] }, wins:[], ext:[] }, extra || {});
}
/* chaque pièce reste accessible : une porte vers la meilleure pièce voisine (le couloir, l'entrée, le salon…), au milieu du mur commun */
function hbAutoDoors(lv){
  const R = lv.rooms; lv.doors = lv.doors || []; lv.open = lv.open || []; lv.nd = lv.nd || [];
  if(R.length < 2) return;
  const pairs = [];
  R.forEach((r, i) => R.forEach((q, j) => { if(j <= i) return; hbEdges(r).forEach(E => hbShared(E, r, [q], lv.open).forEach(x => pairs.push({ a:r, b:q, E, s:x.s, e:x.e, open:x.open }))); }));
  const linked = p => p.open || lv.doors.some(d => d.o === p.E.ax && Math.abs(d.c - p.E.c) < 1e-4 && d.a > p.s && d.a < p.e);
  const pr = r => { const k = HB_PRIO.indexOf(r.t); return k < 0 ? 99 : k; };
  const hub = R.slice().sort((a, b) => pr(a) - pr(b))[0], conn = new Set([hub.id]);
  for(let guard = 0; guard < 60; guard++){
    let grew = true; while(grew){ grew = false; pairs.forEach(p => { if(linked(p) && (conn.has(p.a.id) !== conn.has(p.b.id))){ conn.add(p.a.id); conn.add(p.b.id); grew = true; } }); }
    const cand = pairs.filter(p => conn.has(p.a.id) !== conn.has(p.b.id) && p.e - p.s >= 1.0 && !lv.nd.includes(hbPairKey(p.a.id, p.b.id)))
      .sort((p, q) => (pr(conn.has(p.a.id) ? p.a : p.b) - pr(conn.has(q.a.id) ? q.a : q.b)) || ((q.e - q.s) - (p.e - p.s)));
    if(!cand.length) break;
    const p = cand[0], w = 0.9; lv.doors.push({ o:p.E.ax, c:p.E.c, a:Math.round(((p.s + p.e) / 2) * 20) / 20, w });
  }
}
/* fenêtres automatiques d'une nouvelle pièce : sur son plus long mur qui donne dehors */
function hbAutoWins(lv, r){
  if(r.t === 'corridor' || r.t === 'garage') return;
  const small = r.t === 'bath' || r.t === 'wc';
  const cands = [];
  hbEdges(r).forEach(E => { const sh = hbShared(E, r, lv.rooms, lv.open || []); hbIvMinus(E.a0, E.a1, sh.map(x => [x.s, x.e])).forEach(([s, e]) => cands.push({ E, s, e, len:e - s })); });
  cands.sort((a, b) => b.len - a.len);
  const c = cands[0]; if(!c || c.len < (small ? 1.0 : 1.8)) return;
  const base = c.E.ax === 'x' ? r.x : r.z, w = small ? 0.6 : c.len >= 3.4 ? 1.6 : 1.2;
  const n = !small && c.len >= 5 ? 2 : 1;
  r.wins = r.wins || [];
  for(let k = 0; k < n; k++){ const ctr = c.s + c.len * (k + 1) / (n + 1); r.wins.push(small ? { s:c.E.s, u:round(ctr - base, 2), w, h:0.6, y:1.4 } : { s:c.E.s, u:round(ctr - base, 2), w }); }
}
/* après chaque changement du plan : on enlève ce qui ne tient plus (une fenêtre devenue intérieure, une porte sans mur commun…) */
function hbNormalize(hs){
  hs.lv = hbLevelsOf(hs).map(lv => Object.assign({ rooms:[], doors:[], st:[], open:[], nd:[] }, lv));
  hs.lv.forEach((lv, li) => {
    const ids = new Set(lv.rooms.map(r => r.id));
    lv.open = lv.open.filter(k => k.split('|').every(id => ids.has(id)));
    lv.nd = lv.nd.filter(k => k.split('|').every(id => ids.has(id)));
    // une porte doit tomber sur un mur commun (pas ouvert) assez long
    lv.doors = lv.doors.filter(d => lv.rooms.some(r => hbEdges(r).some(E => { if(E.ax !== d.o || Math.abs(E.c - d.c) > 1e-4) return false;
      return hbShared(E, r, lv.rooms, lv.open).some(x => !x.open && d.a - (d.w || 0.9) / 2 >= x.s + 0.05 && d.a + (d.w || 0.9) / 2 <= x.e - 0.05); })));
    lv.doors = lv.doors.filter((d, i) => !lv.doors.some((q, j) => j < i && q.o === d.o && Math.abs(q.c - d.c) < 1e-4 && Math.abs(q.a - d.a) < ((q.w || 0.9) + (d.w || 0.9)) / 2 + 0.05));
    // fenêtres et portes d'entrée : seulement sur un mur qui donne dehors
    lv.rooms.forEach(r => {
      const keepOn = it => { const E = hbEdges(r).find(x => x.s === it.s); if(!E) return false; const base = E.ax === 'x' ? r.x : r.z, w = it.w || 1, a = base + it.u - w / 2, b = base + it.u + w / 2;
        const sh = hbShared(E, r, lv.rooms, lv.open); return a >= E.a0 + 0.1 && b <= E.a1 - 0.1 && hbIvMinus(E.a0, E.a1, sh.map(x => [x.s, x.e])).some(([p, q]) => a >= p - 1e-4 && b <= q + 1e-4); };
      r.wins = (r.wins || []).filter(keepOn); r.ext = (r.ext || []).filter(keepOn);
    });
    // un escalier reste dans une pièce
    lv.st = lv.st.filter(s => lv.rooms.some(r => hbInside(hbStRect(s), hbRect(r))) && li < hs.lv.length - 1);
    hbAutoDoors(lv);
  });
  return hs;
}
const HB_TEMPLATES = [
  ['studio', 'Studio', 'Studio', '1 pièce, coin cuisine, salle d’eau', '1 room, kitchenette, shower room', () => {
    const lv = { rooms:[hbRoom('living', -3, -2.5, 6, 4.5, { n:L('Pièce de vie', 'Living space') }), hbRoom('kitchen', -3, 2, 3.5, 2.5), hbRoom('bath', 0.5, 2, 2.5, 2.5)], doors:[], st:[], open:[], nd:[] };
    lv.open.push(hbPairKey(lv.rooms[0].id, lv.rooms[1].id)); lv.rooms[1].ext.push({ s:'w', u:1.25, w:1.0 });
    return { lv:[lv], H:2.6, fac:{ k:'plaster', c:'#EDE6D8' }, roof:'flat' }; }],
  ['flat', 'Appartement', 'Apartment', 'Salon ouvert, 2 chambres, couloir', 'Open living room, 2 bedrooms, hallway', () => {
    const R = [hbRoom('living', -5, -4, 5.5, 4.5), hbRoom('kitchen', 0.5, -4, 4.5, 4.5), hbRoom('corridor', -5, 0.5, 10, 1.5), hbRoom('bedroom', -5, 2, 4, 3.5), hbRoom('bath', -1, 2, 2.5, 3.5), hbRoom('bedroom', 1.5, 2, 3.5, 3.5, { n:L('Chambre 2', 'Bedroom 2') })];
    const lv = { rooms:R, doors:[], st:[], open:[hbPairKey(R[0].id, R[1].id)], nd:[] }; R[2].ext.push({ s:'w', u:0.75, w:1.0 });
    return { lv:[lv], H:2.6, fac:{ k:'plaster', c:'#E6CFC2' }, roof:'flat' }; }],
  ['house', 'Maison à étage', 'Two-storey house', 'Rez-de-chaussée, étage, toit, jardin', 'Ground floor, upstairs, roof, garden', () => {
    const G = [hbRoom('living', -4.5, -4, 5, 4.5), hbRoom('kitchen', 0.5, -4, 4, 4.5), hbRoom('hall', -4.5, 0.5, 5, 3.5), hbRoom('office', 0.5, 0.5, 4, 3.5)];
    const U = [hbRoom('bedroom', -4.5, -4, 4.5, 4.5), hbRoom('kids', 0, -4, 4.5, 4.5), hbRoom('corridor', -4.5, 0.5, 6, 3.5, { n:L('Palier', 'Landing') }), hbRoom('bath', 1.5, 0.5, 3, 3.5)];
    const g = { rooms:G, doors:[], st:[{ x:-4.4, z:0.6, w:1, l:3.3, dir:'n' }], open:[hbPairKey(G[0].id, G[1].id)], nd:[] }, u = { rooms:U, doors:[], st:[], open:[], nd:[] };
    // la porte d'entrée sur la façade de devant, une fenêtre à côté, et celle du palier juste au-dessus
    G[2].ext.push({ s:'s', u:2.6, w:1.0, g:true }); G[2].wins.push({ s:'s', u:4.2, w:0.8 }); U[2].wins.push({ s:'s', u:2.6, w:1.2 });
    return { lv:[g, u], H:2.7, fac:{ k:'plaster', c:'#EDE6D8' }, roof:'gable', rf:{ k:'rtile', c:'#A34B33' } }; }],
  ['villa', 'Villa de plain-pied', 'Single-storey villa', 'Grand séjour, 3 chambres, garage', 'Big living room, 3 bedrooms, garage', () => {
    const R = [hbRoom('living', -6, -4.5, 7, 5), hbRoom('kitchen', 1, -4.5, 4, 5), hbRoom('garage', 5, -4.5, 4, 6), hbRoom('corridor', -6, 0.5, 11, 1.5), hbRoom('bedroom', -6, 2, 4, 3.5),
      hbRoom('kids', -2, 2, 3.5, 3.5), hbRoom('bath', 1.5, 2, 3.5, 3.5)];
    const lv = { rooms:R, doors:[], st:[], open:[hbPairKey(R[0].id, R[1].id)], nd:[] }; R[3].ext.push({ s:'w', u:0.75, w:1.0 }); R[0].ext.push({ s:'n', u:3.5, w:1.0, g:true });
    return { lv:[lv], H:2.7, fac:{ k:'stone', c:'#D2C6AE' }, roof:'flat' }; }],
  ['blank', 'Partir de zéro', 'Start from scratch', 'Un plan vide, tu dessines tout', 'An empty plan, you draw it all', () => ({ lv:[{ rooms:[], doors:[], st:[], open:[], nd:[] }], H:2.7, fac:{ k:'plaster', c:'#EDE6D8' }, roof:'gable' })],
];
function hbFromTemplate(id){
  const t = HB_TEMPLATES.find(x => x[0] === id) || HB_TEMPLATES[0], hs = t[5]();
  hbNormalize(hs); hs.lv.forEach(lv => lv.rooms.forEach(r => { if(!r.wins.length) hbAutoWins(lv, r); })); hbNormalize(hs);
  return hs;
}

/* ---------- 4. Le volet « Mon lieu » : une maison s'y fabrique aussi ---------- */
function mapNewHouse(){
  const id = uidS(), n = (S.doc.maps || []).filter(x => x.kind === 'house').length + 1;
  edit(() => { S.doc.maps = (S.doc.maps || []).concat([{ id, name:L('Ma maison ', 'My house ') + n, kind:'house', view:'nature', hs:{ lv:[{ rooms:[], doors:[], st:[], open:[], nd:[] }], H:2.7, roof:'gable' } }]); });
  syncMaps(S.doc); setPlace('my_' + id); setPanel('mymap'); hbOpen(true);
}
/* une petite vue du plan, pour le volet */
function hbMiniPlan(hs, lvI){
  const LV = hbLevelsOf(hs), lv = hbL(LV[lvI] || LV[0]); if(!lv.rooms.length) return '';
  const all = LV.flatMap(l => l.rooms || []), B = all.reduce((b, r) => [Math.min(b[0], r.x), Math.min(b[1], r.z), Math.max(b[2], r.x + r.w), Math.max(b[3], r.z + r.d)], [1e9, 1e9, -1e9, -1e9]);
  const pad = 0.6, vb = [B[0] - pad, B[1] - pad, B[2] - B[0] + 2 * pad, B[3] - B[1] + 2 * pad];
  return `<svg class="hb-mini" viewBox="${vb.join(' ')}" preserveAspectRatio="xMidYMid meet">${lv.rooms.map(r => { const ty = HB_TYPE[r.t] || HB_TYPE.empty, fc = (r.f && r.f.c) || ty[3][1];
    return `<rect x="${r.x}" y="${r.z}" width="${r.w}" height="${r.d}" style="fill:${esc(fc)}" class="hb-mr"/>`; }).join('')}${lv.rooms.map(r => `<rect x="${r.x}" y="${r.z}" width="${r.w}" height="${r.d}" class="hb-mw"/>`).join('')}</svg>`;
}
const hbMymapBase = PANEL_HTML.mymap;
PANEL_HTML.mymap = function(){
  const m = curMap();
  if(!m){
    // pas encore de lieu : à côté de « Créer mon lieu », la maison
    return hbMymapBase.call(this).replace(/(<button class="btn btn-primary mm-new" data-act="mapNew">[\s\S]*?<\/button>)/, `$1<button class="btn mm-new hb-newh" data-act="hbNewHouse">${hbIco('house')}${L('Modéliser ma maison', 'Model my house')}</button>`);
  }
  if(m.kind !== 'house'){
    // un troisième choix : Maison
    return hbMymapBase.call(this).replace(/(data-act="mapKind" data-v="out">[^<]*<\/button>)<\/div>/, `$1<button data-act="hbKind">${esc(L('Maison', 'House'))}</button></div>`);
  }
  const hs = m.hs || {}, LV = hbLevelsOf(hs), sh = shot(), d = SET_DEF[sh.set] || {};
  const nR = LV.reduce((a, l) => a + (l.rooms || []).length, 0), area = LV.reduce((a, l) => a + (l.rooms || []).reduce((b, r) => b + r.w * r.d, 0), 0);
  const back = `<div class="pbtns"><button class="btn btn-sm btn-ghost" data-act="panel" data-id="place">${icon('back')}${L('Tous les lieux', 'All places')}</button><button class="btn btn-sm btn-ghost" data-act="mapNew">${icon('plus')}${L('Nouveau lieu', 'New place')}</button></div>`;
  const lvNames = hbLvNames(LV.length);
  const rooms = (d.floors || []).map((f, k) => `<button class="chip ${S.room === k ? 'on' : ''}" data-act="floor" data-k="${k}">${esc(f[2] < 0 ? L('Dehors', 'Outside') : (LV.length > 1 ? lvNames.short[f[2]] + ' · ' : '') + f[0])}</button>`).join('');
  return ph('place', L('Mon lieu', 'My place'), esc(m.name || '')) + `<div class="pb">${back}
    <label class="fld"><span>${L('Nom du lieu', 'Place name')}</span><input id="mapName" type="text" maxlength="40" value="${esc(m.name || '')}"></label>
    <div class="seg wide">${[['in', L('Intérieur', 'Indoors')], ['out', L('Extérieur', 'Outdoors')]].map(([k, t]) => `<button data-act="mapKind" data-v="${k}">${esc(t)}</button>`).join('')}<button class="on" data-act="hbOpen">${esc(L('Maison', 'House'))}</button></div>
    <button class="hb-card" data-act="hbOpen" title="${esc(L('Dessiner les pièces, les portes, les fenêtres, l’escalier…', 'Draw the rooms, doors, windows, stairs…'))}">
      <span class="hb-card-plan">${nR ? hbMiniPlan(hs, 0) : `<i class="hb-card-empty">${hbIco('room')}</i>`}</span>
      <span class="hb-card-t"><b>${L('Ouvrir l’atelier du plan', 'Open the floor-plan studio')}</b><small>${nR ? `${nR} ${L(nR > 1 ? 'pièces' : 'pièce', nR > 1 ? 'rooms' : 'room')} · ${Math.round(area)} m² · ${LV.length} ${L(LV.length > 1 ? 'niveaux' : 'niveau', LV.length > 1 ? 'levels' : 'level')}` : L('Dessine tes pièces, ou pars d’un modèle', 'Draw your rooms, or start from a template')}</small></span>${icon('right')}</button>
    ${rooms ? lbl(L('Aller dans une pièce', 'Go to a room')) + `<div class="chips">${rooms}</div>` : ''}
    <p class="mm-p">${L('Les meubles se posent tout seuls selon la pièce. Pour en ajouter : ', 'Furniture is placed for you, room by room. To add more: ')}<button class="lnk" data-act="panel" data-id="car">${L('les accessoires', 'the props')}</button>.</p>
    <div class="pbtns"><button class="btn btn-sm btn-ghost danger" data-act="mapDel">${icon('trash')}${L('Supprimer ce lieu', 'Delete this place')}</button></div>
    <input type="file" id="mapFile" accept="image/*" hidden></div>`;
};
// dans le volet Lieu : à côté de « Créer mon lieu », « Modéliser ma maison »
const hbPlaceBase = PANEL_HTML.place;
PANEL_HTML.place = function(){
  const h = hbPlaceBase.call(this), i = h.indexOf('class="myplace'); if(i < 0) return h;
  const j = h.indexOf('</button>', i); if(j < 0) return h;
  const btn = `<button class="myplace hb-myhouse" data-act="hbNewHouse" title="${esc(L('Dessine le plan de ta maison, pièce par pièce, et elle se construit en 3D', 'Draw your house plan, room by room, and it builds itself in 3D'))}"><span class="mp-ic">${hbIco('house')}</span><span class="mp-t"><b>${L('Modéliser ma maison', 'Model my house')}</b><small>${L('Pièces, étages, portes, fenêtres, meubles', 'Rooms, floors, doors, windows, furniture')}</small></span>${icon('plus')}</button>`;
  return h.slice(0, j + 9) + btn + h.slice(j + 9);
};
Object.assign(ACT, {
  hbNewHouse:() => mapNewHouse(),
  hbOpen:() => hbOpen(),
  hbKind:() => { mapEditDo(m => { m.kind = 'house'; if(!m.hs) m.hs = { lv:[{ rooms:[], doors:[], st:[], open:[], nd:[] }], H:clamp(+m.h || 2.7, 2.3, 4), roof:'gable' }; }); hbOpen(true); },
});

/* ---------- 5. Le plan de la maison posé sur l'image (étages et pièces) ---------- */
function hbLvNames(n){
  const names = [L('Rez-de-chaussée', 'Ground floor'), L('1er étage', '1st floor'), L('2e étage', '2nd floor')], short = [L('RDC', 'GF'), L('1er', '1st'), L('2e', '2nd')];
  return { names:names.slice(0, n), short:short.slice(0, n) };
}
const hbRenderPlanBase = renderPlan;
renderPlan = function(){
  const el = document.getElementById('hplan'), s = S.doc && shot(), d = s && SET_DEF[s.set];
  if(!el || !d || !d.house || !d.levels || S.final){ Object.assign(PLAN, { x0:-5, z0:-4, k:21 }); return hbRenderPlanBase.apply(this, arguments); }
  const m = (S.doc.maps || []).find(x => x.id === d.custom); if(!m) return hbRenderPlanBase.apply(this, arguments);
  el.classList.remove('hidden');
  const LV = hbLevelsOf(m.hs), { names, short } = hbLvNames(LV.length), B = d.hplan.box, bw = Math.max(B[2] - B[0], 1), bh = Math.max(B[3] - B[1], 1);
  PLAN.k = Math.min(210 / bw, 168 / bh); PLAN.x0 = B[0]; PLAN.z0 = B[1];
  const W = PLAN.pad * 2 + bw * PLAN.k, Hh = PLAN.pad * 2 + bh * PLAN.k;
  const e = camEyeRaw(s.cam), cur = S.room != null ? S.room : d.floors.findIndex(f => f[5] && e[0] >= f[5][3][0] && e[0] <= f[5][3][2] && e[2] >= f[5][3][1] && e[2] <= f[5][3][3] && levelOfY(d, e[1]) === f[2]);
  const chip = (f, k, nm) => `<button class="hp-chip ${cur === k ? 'on' : ''}" data-act="floor" data-k="${k}">${esc(nm)}</button>`;
  const open = lsGet('raging3d_plan') === '1', lv = clamp(S.planLevel != null ? S.planLevel : levelOfY(d, s.cam.ty), 0, LV.length - 1);
  const garden = d.floors.findIndex(f => f[2] < 0);
  let svg = '';
  if(open){
    const L0 = hbL(LV[lv]);
    L0.rooms.forEach(r => { const [p, q] = planXY(r.x, r.z), [a, b] = planXY(r.x + r.w, r.z + r.d); svg += `<rect class="hp-floor" x="${p}" y="${q}" width="${a - p}" height="${b - q}"/>`; });
    L0.st.concat(lv > 0 ? hbL(LV[lv - 1]).st : []).forEach(st => { const R = hbStRect(st), [p, q] = planXY(R[0], R[1]), [a, b] = planXY(R[2], R[3]); svg += `<rect class="hp-stair" x="${p}" y="${q}" width="${a - p}" height="${b - q}"/>`; });
    L0.rooms.forEach(r => hbEdges(r).forEach(E => { const sh = hbShared(E, r, L0.rooms, L0.open), { O } = hbOpenings(E, r, L0, sh, 9), cuts = O.filter(o => o.kind !== 'win').map(o => [o.s, o.e]).concat(sh.filter(x => x.open).map(x => [x.s, x.e]));
      hbIvMinus(E.a0, E.a1, cuts).forEach(([a, b]) => { const [p, q] = planXY(...hbP(E, a, 0)), [u, v] = planXY(...hbP(E, b, 0)); svg += `<line class="hp-wall" x1="${p}" y1="${q}" x2="${u}" y2="${v}"/>`; }); }));
    s.chars.forEach((ch, c) => { if(levelOfY(d, ch.root.y + 0.5) !== lv) return; const [p, q] = planXY(ch.root.x, ch.root.z); if(p < 0 || p > W || q < 0 || q > Hh) return;
      svg += `<circle class="hp-char" cx="${p}" cy="${q}" r="4.2" style="--c:${lookOf(ch, c).top || '#888'}"><title>${esc(L(lookOf(ch, c).fr, lookOf(ch, c).en))}</title></circle>`; });
    d.floors.forEach((f, k) => { if(f[2] !== lv || !f[5]) return; const [x0, z0, x1, z1] = f[5][3], [p, q] = planXY(x0, z0), [r, t] = planXY(x1, z1);
      svg += `<g class="hp-room ${S.room === k ? 'on' : ''}" data-k="${k}"><rect x="${p + 1.5}" y="${q + 1.5}" width="${r - p - 3}" height="${t - q - 3}" rx="3"/><text x="${(p + r) / 2}" y="${(q + t) / 2 + 3.5}">${esc(f[0])}</text></g>`; });
    svg += `<g class="hp-cam" id="hpCam"><path d="M0 0 L-7 -12 L7 -12 Z"/><circle r="3.4"/></g>`;
  }
  const rooms = open ? '' : `<div class="hp-rooms">${d.floors.map((f, k) => f[2] === lv && f[5] ? chip(f, k, f[0]) : '').join('')}</div>`;
  el.innerHTML = `<div class="hp-h"><button class="hp-tog" data-act="planTog" title="${esc(open ? L('Replier le plan', 'Fold the plan') : L('Ouvrir le plan de la maison', 'Open the house plan'))}">${icon('stairs')}<b>${L('Plan', 'Plan')}</b><i class="hp-chev ${open ? 'up' : ''}"></i></button>
      <div class="hp-tabs">${short.map((t, i) => `<button class="${i === lv && S.room !== garden ? 'on' : ''}" data-act="planLv" data-l="${i}" title="${esc(names[i])}">${esc(t)}</button>`).join('')}${garden >= 0 ? `<button class="${S.room === garden ? 'on' : ''}" data-act="floor" data-k="${garden}">${L('Jardin', 'Garden')}</button>` : ''}</div>
      <button class="hp-edit" data-act="hbOpen" title="${esc(L('Modifier le plan de la maison', 'Edit the house plan'))}">${hbIco('pencil')}</button></div>${rooms}
    ${open ? `<svg class="hp-svg" id="hpSvg" data-hb="1" viewBox="0 0 ${W} ${Hh}" width="${W}" height="${Hh}" data-l="${lv}">${svg}</svg>
    <div class="hp-f"><span>${L('Clique dans une pièce : la caméra s’y pose, tournée vers ce point', 'Click inside a room: the camera goes there, facing that spot')}</span><button class="hp-bring" data-act="bringHere" title="${esc(L('Amener le personnage choisi là où vise la caméra', 'Bring the chosen character where the camera aims'))}">${icon('users')}${L('Amener ', 'Bring ') + charName(S.sel ? S.sel.c : S.target) + L(' ici', ' here')}</button></div>` : ''}`;
  planMarker();
};
// un clic sur le plan d'une maison faite à la main : ses vraies dimensions (pas celles de la maison de campagne)
document.addEventListener('click', e => {
  const svg = e.target.closest && e.target.closest('#hpSvg[data-hb]'); if(!svg) return;
  e.stopPropagation(); e.preventDefault();
  const rc = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, x = (e.clientX - rc.left) * vb.width / rc.width, y = (e.clientY - rc.top) * vb.height / rc.height;
  goSpot(+svg.dataset.l, PLAN.x0 + (x - PLAN.pad) / PLAN.k, PLAN.z0 + (y - PLAN.pad) / PLAN.k); renderHead(); renderPanel();
}, true);

/* ---------- 6. L'atelier du plan ---------- */
const HB = { open:false, mid:null, lv:0, tool:'sel', sel:null, drawType:'living', vb:null, drag:null, hover:null, yaw:-38, pitch:-52, stDir:null, prevT:0, snap:null, space:false };
function hbIco(n){
  const p = {
    house:'<path d="M2 7.5 8 2.5l6 5"/><path d="M3.5 6.5V14h9V6.5"/><path d="M6.5 14v-4h3v4"/>',
    room:'<rect x="2" y="2.5" width="12" height="11" rx="1"/><path d="M2 8h5.5V13.5M7.5 2.5V5.5"/>',
    sel:'<path d="M3 2.2l9.6 5.6-4.1 1 2.4 4.2-1.6.9-2.4-4.2-3 2.9z"/>',
    door:'<path d="M2.5 13.5h11"/><path d="M4 13.5V3.2h4.5"/><path d="M4 3.2A10.3 10.3 0 0 1 14 13.5"/>',
    win:'<rect x="2.5" y="2.5" width="11" height="11" rx="1"/><path d="M8 2.5v11M2.5 8h11"/>',
    stairs:'<path d="M2 14h3.2v-3h3v-3h3v-3H14"/><path d="M2 14V11"/>',
    pencil:'<path d="M10.8 2.6 13.4 5.2 5.6 13H3v-2.6z"/><path d="M9.3 4.1l2.6 2.6"/>',
    level:'<path d="M2 10.5 8 13.5l6-3"/><path d="M2 7.5 8 10.5l6-3L8 4.5z"/>',
    rotL:'<path d="M3.2 8a4.8 4.8 0 1 0 1.5-3.5"/><path d="M3 2.6v2.5h2.5"/>',
    rotR:'<path d="M12.8 8a4.8 4.8 0 1 1-1.5-3.5"/><path d="M13 2.6v2.5h-2.5"/>',
    fit:'<path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10"/>',
    rot:'<path d="M12.5 8a4.5 4.5 0 1 1-1.3-3.2"/><path d="M12 2v3h-3"/>',
    dup:'<rect x="5" y="5" width="8.5" height="8.5" rx="1.2"/><path d="M11 5V3.2c0-.6-.4-1-1-1H3.2c-.6 0-1 .4-1 1V10c0 .6.4 1 1 1H5"/>',
    open:'<path d="M2 3v10M14 3v10"/><path d="M5 8h6M6.6 6.2 4.8 8l1.8 1.8M9.4 6.2 11.2 8l-1.8 1.8"/>',
    tpl:'<rect x="2" y="2" width="5" height="5" rx=".8"/><rect x="9" y="2" width="5" height="5" rx=".8"/><rect x="2" y="9" width="5" height="5" rx=".8"/><path d="M11.5 9v5M9 11.5h5"/>',
  }[n] || '';
  return `<svg class="icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
}
const hbMap = () => (S.doc && (S.doc.maps || []).find(x => x.id === HB.mid)) || null;
const hbHS = () => { const m = hbMap(); return m && m.hs; };
const hbCurLv = () => { const hs = hbHS(); return hs ? hbLevelsOf(hs)[clamp(HB.lv, 0, hbLevelsOf(hs).length - 1)] : null; };
function hbOpen(fresh){
  const m = curMap(); if(!m) return;
  if(m.kind !== 'house'){ edit(() => { m.kind = 'house'; if(!m.hs) m.hs = { lv:[{ rooms:[], doors:[], st:[], open:[], nd:[] }], H:2.7, roof:'gable' }; }); }
  HB.open = true; HB.mid = m.id; HB.sel = null; HB.drag = null; HB.hover = null;
  const LV = hbLevelsOf(m.hs); HB.lv = clamp(HB.lv, 0, LV.length - 1);
  const hasRooms = LV.some(l => (l.rooms || []).length);
  HB.tool = hasRooms ? 'sel' : 'room'; HB.vb = null;
  let el = document.getElementById('hbAt');
  if(!el){ el = document.createElement('div'); el.id = 'hbAt'; el.className = 'hb'; document.body.appendChild(el); hbBind(el); }
  el.classList.remove('hidden'); document.body.classList.add('hb-on');
  hbRender(); hbPreviewSoon(10);
  void fresh;
}
function hbClose(){
  const el = document.getElementById('hbAt'); if(el) el.classList.add('hidden'); document.body.classList.remove('hb-on');
  HB.open = false; HB.drag = null;
  const m = hbMap(); if(!m) { renderUI(); return; }
  // on revient dans la maison : la caméra dans une pièce, les personnages qui seraient dans un mur ramenés dans la première pièce
  const sh = shot(), id = 'my_' + m.id; if(sh.set !== id){ renderUI(); return; }
  const d = SET_DEF[id], rooms = d.rooms || [];
  if(rooms.length){
    const inside = ch => rooms.some(r => { const y0 = d.levels ? d.levels[r[2]] : 0; return ch.root.x > r[3][0] && ch.root.x < r[3][2] && ch.root.z > r[3][1] && ch.root.z < r[3][3] && Math.abs((ch.root.y || 0) - y0) < 1.2; });
    if(sh.chars.some(ch => !inside(ch))) edit(() => { sh.chars = sh.chars.map((ch, i) => inside(ch) ? ch : Object.assign(charFromSpawn(i, d, ch.look), ch.outfit ? { outfit:ch.outfit } : {})); });
    goRoom(d.floors.length - 1);   // d'abord la maison vue du jardin : on voit ce qu'on a construit
  } else { sh.cam = camSafe(clone(d.cam), id, true); }
  R.pickDirty = true; changed(true);
}
/* un changement du plan : annulable, nettoyé, et la maison se refait */
function hbEdit(fn, keepSel){
  const m = hbMap(); if(!m) return;
  pushUndo(); fn(m.hs, m); hbNormalize(m.hs); changed();
  if(!keepSel) hbValidSel(); hbRender(); hbPreviewSoon();
}
function hbValidSel(){
  const lv = hbCurLv(); if(!HB.sel || !lv) { return; }
  const s = HB.sel, r = lv.rooms.find(x => x.id === s.rid);
  if(s.k === 'room' && !r) HB.sel = null;
  else if((s.k === 'win' || s.k === 'ext') && (!r || !(r[s.k === 'win' ? 'wins' : 'ext'] || [])[s.i])) HB.sel = null;
  else if(s.k === 'door' && !(lv.doors || [])[s.i]) HB.sel = null;
  else if(s.k === 'st' && !(lv.st || [])[s.i]) HB.sel = null;
}
/* la vue du plan : tout le dessin, avec de la marge */
function hbFitVB(){
  const hs = hbHS(), LV = hbLevelsOf(hs), all = LV.flatMap(l => l.rooms || []);
  const B = all.length ? all.reduce((b, r) => [Math.min(b[0], r.x), Math.min(b[1], r.z), Math.max(b[2], r.x + r.w), Math.max(b[3], r.z + r.d)], [1e9, 1e9, -1e9, -1e9]) : [-6, -4.5, 6, 4.5];
  const el = document.getElementById('hbCv'), ar = el ? el.clientWidth / Math.max(1, el.clientHeight) : 1.5;
  let w = Math.max(B[2] - B[0] + 5, 12), h = Math.max(B[3] - B[1] + 4, 8); if(w / h > ar) h = w / ar; else w = h * ar;
  HB.vb = [(B[0] + B[2]) / 2 - w / 2, (B[1] + B[3]) / 2 - h / 2, w, h];
}
const hbSnap = (v, k) => Math.round(v / (k || 0.25)) * (k || 0.25);
function hbPt(e){ const svg = document.getElementById('hbSvg'); if(!svg) return [0, 0]; const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY; const p = pt.matrixTransform(svg.getScreenCTM().inverse()); return [p.x, p.y]; }
const hbRoomAt = (lv, x, z) => lv.rooms.slice().reverse().find(r => x >= r.x && x <= r.x + r.w && z >= r.z && z <= r.z + r.d);
const hbFree = (lv, rc, skip) => !lv.rooms.some(r => r !== skip && r.id !== (skip && skip.id) && hbOverlap(rc, hbRect(r), 0.001));
/* le mur le plus proche du pointeur : la pièce, le côté, la position le long du mur, et s'il donne dehors ou sur une autre pièce */
function hbWallAt(lv, x, z, maxD){
  let best = null;
  lv.rooms.forEach(r => hbEdges(r).forEach(E => {
    const a = E.ax === 'x' ? x : z, perp = E.ax === 'x' ? z : x, dist = Math.abs(perp - E.c); if(dist > (maxD || 0.45) || a < E.a0 + 0.2 || a > E.a1 - 0.2) return;
    if(best && best.dist <= dist) return;
    const sh = hbShared(E, r, lv.rooms, lv.open || []), hit = sh.find(q => a >= q.s && a <= q.e);
    best = { r, E, a, dist, shared:hit || null };
  }));
  return best;
}
function hbHint(){
  const t = HB.tool, sel = HB.sel;
  if(HB.drag && HB.drag.mode === 'draw') return L('Relâche pour créer la pièce', 'Release to create the room');
  return t === 'room' ? L('Glisse sur le quadrillage pour dessiner une pièce. Elle se colle aux autres, et une porte se pose toute seule.', 'Drag on the grid to draw a room. It snaps to the others, and a door is added for you.')
    : t === 'door' ? L('Clique sur un mur : entre deux pièces, une porte ; sur un mur extérieur, la porte d’entrée.', 'Click a wall: between two rooms, a door; on an outside wall, the front door.')
    : t === 'win' ? L('Clique sur un mur extérieur pour poser une fenêtre.', 'Click an outside wall to add a window.')
    : t === 'st' ? L('Clique dans une pièce pour poser l’escalier (R : le tourner). L’étage du dessus se crée tout seul.', 'Click inside a room to place the stairs (R: rotate). The floor above is created for you.')
    : sel ? L('Glisse pour déplacer · les poignées pour agrandir · Suppr pour enlever', 'Drag to move · handles to resize · Delete to remove')
    : L('Clique sur une pièce, une porte, une fenêtre ou l’escalier pour le modifier.', 'Click a room, door, window or the stairs to edit it.');
}
function hbRender(){
  const el = document.getElementById('hbAt'), m = hbMap(); if(!el) return;
  if(!m){ hbClose(); return; }
  const hs = m.hs, LV = hbLevelsOf(hs), { names, short } = hbLvNames(LV.length); HB.lv = clamp(HB.lv, 0, LV.length - 1);
  const tools = [['sel', 'sel', L('Choisir', 'Select'), 'V'], ['room', 'room', L('Pièce', 'Room'), 'P'], ['door', 'door', L('Porte', 'Door'), 'D'], ['win', 'win', L('Fenêtre', 'Window'), 'F'], ['st', 'stairs', L('Escalier', 'Stairs'), 'E']];
  el.innerHTML = `<div class="hb-top">
      <div class="hb-brand"><span class="hb-logo">${hbIco('house')}</span><span><b>${L('Atelier du plan', 'Floor-plan studio')}</b><small>${esc(m.name || '')}</small></span></div>
      <div class="hb-levels" role="tablist">${LV.map((l, i) => `<button class="${i === HB.lv ? 'on' : ''}" data-hb="lv" data-i="${i}" title="${esc(names[i])}">${hbIco('level')}${esc(short[i])}<small>${(l.rooms || []).length}</small></button>`).join('')}
        ${LV.length < 3 ? `<button class="hb-addlv" data-hb="addLv" title="${esc(L('Ajouter un étage au-dessus (il reprend le contour de celui-ci)', 'Add a floor above (it copies this one’s outline)'))}">${icon('plus')}${L('Étage', 'Floor')}</button>` : ''}</div>
      <div class="hb-acts"><button class="ib" data-hb="undo" title="${esc(L('Annuler (Ctrl+Z)', 'Undo (Ctrl+Z)'))}" ${S.undo.length ? '' : 'disabled'}>${icon('undo')}</button><button class="ib" data-hb="redo" title="${esc(L('Rétablir (Ctrl+Y)', 'Redo (Ctrl+Y)'))}" ${S.redo.length ? '' : 'disabled'}>${icon('redo')}</button>
        <button class="btn btn-primary btn-sm" data-hb="close">${icon('check')}${L('Voir ma maison en 3D', 'See my house in 3D')}</button></div></div>
    <div class="hb-body">
      <div class="hb-tools">${tools.map(([id, ic, lb, k]) => `<button class="hb-tool ${HB.tool === id ? 'on' : ''}" data-hb="tool" data-t="${id}" title="${esc(lb + ' (' + k + ')')}">${hbIco(ic)}<span>${esc(lb)}</span><kbd>${k}</kbd></button>`).join('')}
        <span class="hb-tsep"></span><button class="hb-tool" data-hb="tpl" title="${esc(L('Partir d’un modèle', 'Start from a template'))}">${hbIco('tpl')}<span>${L('Modèles', 'Templates')}</span></button></div>
      <div class="hb-cv" id="hbCv" data-tool="${HB.tool}"><svg id="hbSvg" class="hb-svg"></svg>
        <div class="hb-zoom"><button data-hb="zoom" data-z="out" title="${esc(L('Dézoomer', 'Zoom out'))}">−</button><button data-hb="fit" title="${esc(L('Tout voir', 'Fit'))}">${hbIco('fit')}</button><button data-hb="zoom" data-z="in" title="${esc(L('Zoomer', 'Zoom in'))}">+</button></div>
        <div class="hb-hint" id="hbHint"><i></i><span>${esc(hbHint())}</span></div>
        <div id="hbTpl"></div></div>
      <aside class="hb-side"><div class="hb-prev"><img id="hbPrev" alt=""><div class="hb-prev-b"><button class="ib sm" data-hb="yaw" data-d="-1" title="${esc(L('Tourner', 'Rotate'))}">${hbIco('rotL')}</button><span>${L('Aperçu', 'Preview')} · ${esc(names[HB.lv])}</span><button class="ib sm" data-hb="yaw" data-d="1" title="${esc(L('Tourner', 'Rotate'))}">${hbIco('rotR')}</button></div></div>
        <div class="hb-insp" id="hbInsp">${hbInspector()}</div></aside>
    </div>`;
  if(!HB.vb) hbFitVB();
  hbDrawSvg();
  const showTpl = (!LV.some(l => (l.rooms || []).length) && HB.noTpl !== HB.mid) || HB.showTpl;
  if(showTpl) hbTplHTML();
  const img = document.getElementById('hbPrev'); if(img && HB.prevURL) img.src = HB.prevURL;
}
function hbTplHTML(){
  const box = document.getElementById('hbTpl'); if(!box) return;
  const any = hbLevelsOf(hbHS()).some(l => (l.rooms || []).length);
  box.innerHTML = `<div class="hb-tpl"><div class="hb-tpl-h"><b>${any ? L('Repartir d’un modèle', 'Start again from a template') : L('Comment veux-tu commencer ?', 'How do you want to start?')}</b>${any ? `<button class="ib sm" data-hb="tplClose" title="${esc(L('Fermer', 'Close'))}">${icon('close')}</button>` : ''}</div>
    <small>${any ? L('Ta maison actuelle sera remplacée (Ctrl+Z pour revenir).', 'Your current house will be replaced (Ctrl+Z to undo).') : L('Un modèle tout prêt à retoucher, ou un plan vide à dessiner.', 'A ready-made plan to tweak, or an empty one to draw.')}</small>
    <div class="hb-tpls">${HB_TEMPLATES.map(t => `<button class="hb-tplc" data-hb="useTpl" data-id="${t[0]}">${hbTplThumb(t[0])}<b>${esc(L(t[1], t[2]))}</b><span>${esc(L(t[3], t[4]))}</span></button>`).join('')}</div></div>`;
}
const HB_TPL_THUMB = {};
function hbTplThumb(id){
  if(HB_TPL_THUMB[id]) return HB_TPL_THUMB[id];
  if(id === 'blank') return HB_TPL_THUMB[id] = `<svg class="hb-tplsvg" viewBox="0 0 10 7"><rect x="1.5" y="1.2" width="7" height="4.6" rx=".3" class="hb-tpl-dash"/><path d="M5 2.6v1.8M4.1 3.5h1.8" class="hb-tpl-plus"/></svg>`;
  const hs = HB_TEMPLATES.find(t => t[0] === id)[5](), lv = hs.lv[0], all = hs.lv.flatMap(l => l.rooms);
  const B = all.reduce((b, r) => [Math.min(b[0], r.x), Math.min(b[1], r.z), Math.max(b[2], r.x + r.w), Math.max(b[3], r.z + r.d)], [1e9, 1e9, -1e9, -1e9]);
  return HB_TPL_THUMB[id] = `<svg class="hb-tplsvg" viewBox="${B[0] - 0.8} ${B[1] - 0.8} ${B[2] - B[0] + 1.6} ${B[3] - B[1] + 1.6}" preserveAspectRatio="xMidYMid meet">${lv.rooms.map(r => `<rect x="${r.x}" y="${r.z}" width="${r.w}" height="${r.d}" style="fill:${esc(HB_TYPE[r.t][3][1])}" class="hb-mr"/><rect x="${r.x}" y="${r.z}" width="${r.w}" height="${r.d}" class="hb-mw"/>`).join('')}${hs.lv.length > 1 ? `${hbTxt('hb-tpl-n', B[2] - 0.2, B[1] + 0.9, 1.1, '+1')}` : ''}</svg>`;
}
/* le dessin du plan : le quadrillage, l'étage du dessous en fantôme, les pièces, les murs, les ouvertures, l'escalier, les poignées */
function hbDrawSvg(){
  const svg = document.getElementById('hbSvg'); if(!svg) return;
  const hs = hbHS(), LV = hbLevelsOf(hs), lv = hbL(LV[HB.lv]), below = HB.lv > 0 ? hbL(LV[HB.lv - 1]) : null, vb = HB.vb;
  svg.setAttribute('viewBox', vb.join(' '));
  const px = vb[2] / Math.max(1, svg.clientWidth || 800);   // un pixel, en mètres
  let s = `<defs><pattern id="hbG1" width="0.5" height="0.5" patternUnits="userSpaceOnUse"><path d="M0.5 0H0V0.5" class="hb-g1" style="stroke-width:${px}"/></pattern>
    <pattern id="hbG2" width="1" height="1" patternUnits="userSpaceOnUse"><rect width="1" height="1" fill="url(#hbG1)"/><path d="M1 0H0V1" class="hb-g2" style="stroke-width:${px * 1.2}"/></pattern></defs>
    <rect x="${vb[0] - 50}" y="${vb[1] - 50}" width="${vb[2] + 100}" height="${vb[3] + 100}" fill="url(#hbG2)"/>`;
  // l'étage du dessous, en fantôme : on dessine par-dessus
  if(below) below.rooms.forEach(r => { s += `<rect class="hb-ghost" x="${r.x}" y="${r.z}" width="${r.w}" height="${r.d}" style="stroke-width:${px * 1.5}"/>`; });
  // les pièces
  lv.rooms.forEach(r => {
    const ty = HB_TYPE[r.t] || HB_TYPE.empty, fc = (r.f && r.f.c) || ty[3][1], on = HB.sel && HB.sel.k === 'room' && HB.sel.rid === r.id, bad = HB.drag && HB.drag.rid === r.id && HB.drag.bad;
    s += `<g class="hb-room ${on ? 'on' : ''} ${bad ? 'bad' : ''}" data-rid="${r.id}"><rect class="hb-rf" x="${r.x}" y="${r.z}" width="${r.w}" height="${r.d}" style="--fc:${esc(fc)}"/>`;
    const fs = Math.min(0.42, Math.max(0.22, Math.min(r.w, r.d) * 0.14)), cx = r.x + r.w / 2, cz = r.z + r.d / 2;
    s += hbTxt('hb-rn', cx, cz - fs * 0.15, fs, esc(r.n || ty[1])) + hbTxt('hb-rs', cx, cz + fs * 1.05, fs * 0.72, `${hbFmt(r.w)} × ${hbFmt(r.d)} m`) + `</g>`;
  });
  // les murs : épais dehors, plus fins entre deux pièces, interrompus par les portes et les passages
  lv.rooms.forEach(r => hbEdges(r).forEach(E => {
    const sh = hbShared(E, r, lv.rooms, lv.open), { O, ext } = hbOpenings(E, r, lv, sh, hs.H || 2.7);
    const cuts = O.filter(o => o.kind !== 'win').map(o => [o.s, o.e]);
    ext.forEach(([a, b]) => hbIvMinus(a, b, cuts).forEach(([p, q]) => { const A = hbP(E, p, -0.06), B = hbP(E, q, -0.06); s += `<line class="hb-wx" x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}"/>`; }));
    sh.forEach(x => { if(x.open){ if(r.id < x.q.id){ const A = hbP(E, x.s, 0), B = hbP(E, x.e, 0); s += `<line class="hb-wopen" x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}" style="stroke-width:${px * 1.4};stroke-dasharray:${px * 5} ${px * 4}"/>`; } return; }
      if(r.id > x.q.id) return; hbIvMinus(x.s, x.e, cuts).forEach(([p, q]) => { const A = hbP(E, p, 0), B = hbP(E, q, 0); s += `<line class="hb-wi" x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}"/>`; }); });
    // les ouvertures
    O.forEach(o => {
      if(o.kind === 'door' && r.id > (sh.find(x => o.s >= x.s - 1e-4 && o.e <= x.e + 1e-4) || { q:{ id:'' } }).q.id) return;
      const on = HB.sel && ((HB.sel.k === 'door' && o.kind === 'door' && HB.sel.i === o.i) || (HB.sel.k === o.kind && HB.sel.rid === r.id && HB.sel.i === o.i));
      const A = hbP(E, o.s, 0), B = hbP(E, o.e, 0), w = o.e - o.s;
      if(o.kind === 'win'){ const a = hbP(E, o.s, -0.06), b = hbP(E, o.e, -0.06); s += `<g class="hb-op hb-win ${on ? 'on' : ''}" data-op="win" data-rid="${r.id}" data-i="${o.i}"><line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="hb-win-b"/><line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" class="hb-win-l" style="stroke-width:${px * 1.6}"/></g>`; return; }
      // la porte : le seuil, et l'arc du battant (vers la pièce)
      const ext = o.kind === 'ext', inn = ext ? 1 : 1, hinge = hbP(E, o.s, 0), tip = hbP(E, o.s, w * inn), end = B;
      s += `<g class="hb-op hb-door ${ext ? 'ext' : ''} ${o.pass ? 'pass' : ''} ${on ? 'on' : ''}" data-op="${ext ? 'ext' : 'door'}" data-rid="${r.id}" data-i="${o.i}"><line x1="${A[0]}" y1="${A[1]}" x2="${B[0]}" y2="${B[1]}" class="hb-door-gap"/>`
        + (o.pass ? '' : `<path d="M${tip[0]} ${tip[1]} A ${w} ${w} 0 0 ${E.ax === 'x' ? (E.inn > 0 ? 0 : 1) : (E.inn > 0 ? 1 : 0)} ${end[0]} ${end[1]}" class="hb-door-arc" style="stroke-width:${px * 1.3}"/><line x1="${hinge[0]}" y1="${hinge[1]}" x2="${tip[0]}" y2="${tip[1]}" class="hb-door-leaf" style="stroke-width:${px * 2.2}"/>`) + `</g>`;
    });
  }));
  // les escaliers : celui qui monte d'ici, et l'arrivée de celui d'en dessous
  const stG = (st, i, mine) => { const R = hbStRect(st), on = mine && HB.sel && HB.sel.k === 'st' && HB.sel.i === i, n = 12, horiz = st.dir === 'e' || st.dir === 'w';
    let g = `<g class="hb-st ${mine ? '' : 'arr'} ${on ? 'on' : ''}" ${mine ? `data-st="${i}"` : ''}><rect x="${R[0]}" y="${R[1]}" width="${R[2] - R[0]}" height="${R[3] - R[1]}" class="hb-st-b"/>`;
    for(let k = 1; k < n; k++){ if(horiz){ const x = R[0] + (R[2] - R[0]) * k / n; g += `<line x1="${x}" y1="${R[1]}" x2="${x}" y2="${R[3]}" style="stroke-width:${px}"/>`; } else { const z = R[1] + (R[3] - R[1]) * k / n; g += `<line x1="${R[0]}" y1="${z}" x2="${R[2]}" y2="${z}" style="stroke-width:${px}"/>`; } }
    const c = [(R[0] + R[2]) / 2, (R[1] + R[3]) / 2], dv = { n:[0, -1], s:[0, 1], e:[1, 0], w:[-1, 0] }[st.dir], L2 = (horiz ? R[2] - R[0] : R[3] - R[1]) * 0.36;
    const a = [c[0] - dv[0] * L2, c[1] - dv[1] * L2], b = [c[0] + dv[0] * L2, c[1] + dv[1] * L2], hd = 0.22, pr = [-dv[1], dv[0]];
    g += `<path class="hb-st-arr" d="M${a[0]} ${a[1]}L${b[0]} ${b[1]}M${b[0] - dv[0] * hd + pr[0] * hd} ${b[1] - dv[1] * hd + pr[1] * hd}L${b[0]} ${b[1]}L${b[0] - dv[0] * hd - pr[0] * hd} ${b[1] - dv[1] * hd - pr[1] * hd}" style="stroke-width:${px * 2}"/></g>`;
    return g; };
  lv.st.forEach((st, i) => { s += stG(st, i, true); });
  if(below) below.st.forEach(st => { s += stG(st, -1, false); });
  // les poignées de la pièce choisie
  if(HB.sel && HB.sel.k === 'room' && HB.tool === 'sel'){ const r = lv.rooms.find(x => x.id === HB.sel.rid);
    if(r){ const hz = px * 11; [['nw', r.x, r.z], ['n', r.x + r.w / 2, r.z], ['ne', r.x + r.w, r.z], ['e', r.x + r.w, r.z + r.d / 2], ['se', r.x + r.w, r.z + r.d], ['s', r.x + r.w / 2, r.z + r.d], ['sw', r.x, r.z + r.d], ['w', r.x, r.z + r.d / 2]]
      .forEach(([h, x, z]) => { s += `<rect class="hb-h hb-h-${h}" data-h="${h}" x="${x - hz / 2}" y="${z - hz / 2}" width="${hz}" height="${hz}" rx="${px * 2}" style="stroke-width:${px * 1.5}"/>`; }); } }
  // ce qui suit le pointeur : la pièce qu'on dessine, la porte, la fenêtre, l'escalier qu'on va poser
  const hv = HB.hover;
  if(HB.drag && HB.drag.mode === 'draw'){ const d = HB.drag, rc = d.rc;
    s += `<rect class="hb-draw ${d.bad ? 'bad' : ''}" x="${rc[0]}" y="${rc[1]}" width="${rc[2] - rc[0]}" height="${rc[3] - rc[1]}" style="stroke-width:${px * 2}"/>`;
    s += hbTxt('hb-dim', (rc[0] + rc[2]) / 2, rc[1] - px * 8, px * 13, hbFmt(rc[2] - rc[0]) + ' m') + hbTxt('hb-dim start', rc[2] + px * 8, (rc[1] + rc[3]) / 2, px * 13, hbFmt(rc[3] - rc[1]) + ' m'); }
  else if(hv && hv.ghost){ const g = hv.ghost;
    if(g.rect) s += `<rect class="hb-gh ${g.bad ? 'bad' : ''}" x="${g.rect[0]}" y="${g.rect[1]}" width="${g.rect[2] - g.rect[0]}" height="${g.rect[3] - g.rect[1]}" style="stroke-width:${px * 2}"/>`;
    if(g.line) s += `<line class="hb-gh-l ${g.bad ? 'bad' : ''}" x1="${g.line[0][0]}" y1="${g.line[0][1]}" x2="${g.line[1][0]}" y2="${g.line[1][1]}"/>`;
    if(g.dot) s += `<circle class="hb-gh-d" cx="${g.dot[0]}" cy="${g.dot[1]}" r="${px * 4}"/>`; }
  svg.innerHTML = s;
}
/* du texte sur le plan : écrit cent fois plus grand puis réduit (sinon, en mètres, les lettres se tassent) */
const hbTxt = (cls, x, y, fs, t) => `<text class="${cls}" transform="scale(.01)" x="${x * 100}" y="${y * 100}" style="font-size:${fs * 100}px">${t}</text>`;
const hbFmt = v => (Math.round(v * 100) / 100).toLocaleString(getLang() === 'en' ? 'en' : 'fr');
/* le volet de droite : ce qu'on a choisi (une pièce, une porte, une fenêtre, l'escalier), sinon toute la maison */
function hbInspector(){
  const hs = hbHS(), LV = hbLevelsOf(hs), lv = hbL(LV[HB.lv]), sel = HB.sel;
  const texRow = (kinds, cur, act, extra) => `<div class="txs">${kinds.map(k => `<button class="tx ${cur.k === k ? 'on' : ''}" data-hb="${act}" data-k="${k}"${extra || ''}><i style="background-image:url(${texThumb(k, cur.k === k ? cur.c : TEX_KINDS[k].cols[0])})"></i><span>${esc(L(TEX_KINDS[k].fr, TEX_KINDS[k].en))}</span></button>`).join('')}</div>`;
  const colRow = (cur, act, cols, extra) => `<div class="sws mm-sws">${cols.map(c => `<button class="swc ${String(cur).toLowerCase() === c.toLowerCase() ? 'on' : ''}" data-hb="${act}" data-c="${c}" style="--c:${c}" aria-label="${c}"${extra || ''}></button>`).join('')}<label class="swc any" title="${esc(L('Une autre couleur', 'Another colour'))}" style="--c:${esc(cur)}"><input type="color" data-hbcol="${act}" value="${esc(cur)}"${extra || ''}></label></div>`;
  const seg = (act, cur, opts) => `<div class="seg wide">${opts.map(([v, t]) => `<button class="${String(cur) === String(v) ? 'on' : ''}" data-hb="${act}" data-v="${v}">${esc(t)}</button>`).join('')}</div>`;
  const head = (ic, t, sub) => `<div class="hb-ih"><span class="hb-ii">${hbIco(ic)}</span><span><b>${t}</b>${sub ? `<small>${sub}</small>` : ''}</span></div>`;
  const kindsOf = on => Object.keys(TEX_KINDS).filter(k => TEX_KINDS[k].on.includes(on));
  if(sel && sel.k === 'room'){
    const r = lv.rooms.find(x => x.id === sel.rid); if(!r) return '';
    const ty = HB_TYPE[r.t] || HB_TYPE.empty, F = mapSurf(r.f || { k:ty[3][0], c:ty[3][1] }, 'parquet'), W = mapSurf(r.wl || { k:ty[4][0], c:ty[4][1] }, 'paint');
    return head('room', esc(r.n || ty[1]), `${hbFmt(r.w)} × ${hbFmt(r.d)} m · ${hbFmt(Math.round(r.w * r.d * 10) / 10)} m²`)
      + `<label class="fld"><span>${L('Nom', 'Name')}</span><input id="hbName" type="text" maxlength="28" value="${esc(r.n || '')}"></label>`
      + lbl(L('C’est…', 'It’s a…')) + `<div class="hb-types">${HB_TYPES.map(t => `<button class="chip ${r.t === t[0] ? 'on' : ''}" data-hb="rtype" data-t="${t[0]}">${esc(L(t[1], t[2]))}</button>`).join('')}</div>`
      + `<label class="ftog"><span>${L('Meublée', 'Furnished')}<small>${L('Les meubles de la pièce se posent tout seuls', 'The room’s furniture is placed for you')}</small></span><input type="checkbox" data-hb="rfur" ${r.fur !== false ? 'checked' : ''}><i class="tg"></i></label>`
      + lbl(L('Sol', 'Floor')) + texRow(kindsOf('f'), F, 'rfloor') + colRow(F.c, 'rfloorC', (TEX_KINDS[F.k] || TEX_KINDS.parquet).cols)
      + lbl(L('Murs', 'Walls')) + texRow(kindsOf('w'), W, 'rwall') + colRow(W.c, 'rwallC', (TEX_KINDS[W.k] || TEX_KINDS.paint).cols)
      + `<div class="pbtns"><button class="btn btn-sm" data-hb="rdup">${hbIco('dup')}${L('Dupliquer', 'Duplicate')}</button><button class="btn btn-sm btn-ghost danger" data-hb="del">${icon('trash')}${L('Supprimer', 'Delete')}</button></div>`;
  }
  if(sel && sel.k === 'door'){
    const d = lv.doors[sel.i]; if(!d) return ''; const w = d.w || 0.9;
    return head('door', L('Porte intérieure', 'Inside door'), L('Entre deux pièces', 'Between two rooms'))
      + lbl(L('Largeur', 'Width')) + seg('dw', w, [[0.8, L('Étroite', 'Narrow')], [0.9, L('Normale', 'Normal')], [1.4, L('Double', 'Double')], [2.4, L('Passage', 'Opening')]])
      + `<p class="mm-p">${L('Pour ouvrir tout le mur entre les deux pièces (une cuisine ouverte, un séjour) :', 'To open the whole wall between both rooms (open kitchen, living space):')}</p><button class="btn btn-sm hb-wide" data-hb="openWall">${hbIco('open')}${L('Ouvrir tout le mur', 'Open the whole wall')}</button>`
      + `<div class="pbtns"><button class="btn btn-sm btn-ghost danger" data-hb="del">${icon('trash')}${L('Enlever la porte', 'Remove the door')}</button></div>`;
  }
  if(sel && (sel.k === 'win' || sel.k === 'ext')){
    const r = lv.rooms.find(x => x.id === sel.rid), it = r && (r[sel.k === 'win' ? 'wins' : 'ext'] || [])[sel.i]; if(!it) return '';
    if(sel.k === 'ext') return head('door', L('Porte d’entrée', 'Front door'), esc(r.n || ''))
      + lbl(L('Couleur', 'Colour')) + colRow(it.c || hs.dcol || '#2F5E7E', 'extC', ['#2F5E7E', '#8C6B4E', '#2C2E33', '#B4232C', '#E9E6E0', '#3E5B52'])
      + `<label class="ftog"><span>${L('Vitrée', 'With glass')}</span><input type="checkbox" data-hb="extG" ${it.g ? 'checked' : ''}><i class="tg"></i></label>`
      + lbl(L('Largeur', 'Width')) + seg('extW', it.w || 1, [[0.9, L('Simple', 'Single')], [1.0, L('Normale', 'Normal')], [1.6, L('Double', 'Double')]])
      + `<div class="pbtns"><button class="btn btn-sm btn-ghost danger" data-hb="del">${icon('trash')}${L('Enlever la porte', 'Remove the door')}</button></div>`;
    const kind = (it.h || 1.3) >= 2 ? 'baie' : (it.w || 1.2) <= 0.7 ? 'small' : (it.w || 1.2) >= 1.7 ? 'big' : 'mid';
    return head('win', L('Fenêtre', 'Window'), esc(r.n || ''))
      + lbl(L('Taille', 'Size')) + seg('wk', kind, [['small', L('Petite', 'Small')], ['mid', L('Normale', 'Normal')], ['big', L('Grande', 'Large')], ['baie', L('Baie vitrée', 'Glass door')]])
      + lbl(L('Cadre', 'Frame')) + colRow(it.f || hs.wf || '#F4F2EE', 'wf', ['#F4F2EE', '#C9CDD3', '#2C2E33', '#7A5C42', '#2F5E7E'])
      + `<div class="pbtns"><button class="btn btn-sm btn-ghost danger" data-hb="del">${icon('trash')}${L('Enlever la fenêtre', 'Remove the window')}</button></div>`;
  }
  if(sel && sel.k === 'st'){
    const st = lv.st[sel.i]; if(!st) return '';
    return head('stairs', L('Escalier', 'Stairs'), L('Monte au ', 'Goes up to the ') + hbLvNames(3).names[HB.lv + 1].toLowerCase())
      + `<div class="pbtns"><button class="btn btn-sm" data-hb="strot">${hbIco('rot')}${L('Tourner', 'Rotate')}</button><button class="btn btn-sm btn-ghost danger" data-hb="del">${icon('trash')}${L('Enlever', 'Remove')}</button></div>`
      + lbl(L('Bois', 'Wood')) + colRow(st.c || '#8A6A4A', 'stC', ['#8A6A4A', '#5E4532', '#C9A27A', '#E9E6E0', '#2C2E33']);
  }
  // rien de choisi : toute la maison
  const nR = LV.reduce((a, l) => a + (l.rooms || []).length, 0), area = LV.reduce((a, l) => a + (l.rooms || []).reduce((b, r) => b + r.w * r.d, 0), 0);
  const FA = mapSurf(hs.fac, 'plaster'), RF = mapSurf(hs.rf, (hs.roof || 'gable') === 'gable' ? 'rtile' : 'gravel'), GA = mapSurf(hs.gnd, 'grass');
  const rfKinds = (hs.roof || 'gable') === 'gable' ? kindsOf('r').filter(k => k !== 'gravel') : ['gravel', 'concrete', 'zinc', 'grass'];
  return head('house', L('Ma maison', 'My house'), nR ? `${nR} ${L(nR > 1 ? 'pièces' : 'pièce', nR > 1 ? 'rooms' : 'room')} · ${Math.round(area)} m²` : L('Pas encore de pièce', 'No room yet'))
    + (nR ? '' : `<p class="mm-p">${L('Choisis l’outil « Pièce », puis glisse sur le quadrillage. Ou pars d’un modèle.', 'Pick the “Room” tool, then drag on the grid. Or start from a template.')}</p>`)
    + lbl(L('Prochaine pièce dessinée', 'Next room you draw')) + `<div class="hb-types">${HB_TYPES.map(t => `<button class="chip ${HB.drawType === t[0] ? 'on' : ''}" data-hb="dtype" data-t="${t[0]}">${esc(L(t[1], t[2]))}</button>`).join('')}</div>`
    + `<label class="fr"><span class="fl">${L('Hauteur sous plafond', 'Ceiling height')}</span><input type="range" data-hbr="H" min="2.3" max="4" step="0.05" value="${hs.H || 2.7}"><b class="fv">${round(hs.H || 2.7, 2)} m</b></label>`
    + lbl(L('Façade', 'Outside walls')) + texRow(kindsOf('w'), FA, 'fac') + colRow(FA.c, 'facC', (TEX_KINDS[FA.k] || TEX_KINDS.plaster).cols)
    + lbl(L('Toit', 'Roof')) + seg('roof', hs.roof || 'gable', [['gable', L('Deux pentes', 'Pitched')], ['flat', L('Toit plat', 'Flat')]]) + texRow(rfKinds, RF, 'rf') + colRow(RF.c, 'rfC', (TEX_KINDS[RF.k] || TEX_KINDS.rtile).cols)
    + lbl(L('Jardin', 'Garden')) + texRow(['grass', 'gravel', 'cobble', 'sand', 'dirt', 'concrete'], GA, 'gnd')
    + lbl(L('Lumières', 'Lights')) + seg('lights', hs.lights || 'pendant', [['pendant', L('Suspensions', 'Pendants')], ['spot', L('Spots', 'Spots')], ['panel', L('Plafonniers', 'Panels')], ['none', L('Aucune', 'None')]])
    + seg('lcol', hs.lcol || 'warm', [['warm', L('Chaud', 'Warm')], ['neutral', L('Blanc', 'White')], ['cool', L('Froid', 'Cool')]])
    + lbl(L('Par les fenêtres', 'Through the windows')) + seg('view', hs.view === 'city' ? 'city' : 'nature', [['nature', L('La campagne', 'The countryside')], ['city', L('La ville', 'The city')]])
    + `<label class="ftog"><span>${L('Meubler toutes les pièces', 'Furnish every room')}<small>${L('Lit, canapé, cuisine, salle de bain… selon chaque pièce', 'Bed, sofa, kitchen, bathroom… for each room')}</small></span><input type="checkbox" data-hb="fur" ${hs.fur !== false ? 'checked' : ''}><i class="tg"></i></label>`
    + (LV.length > 1 && HB.lv === LV.length - 1 ? `<div class="pbtns"><button class="btn btn-sm btn-ghost danger" data-hb="delLv">${icon('trash')}${L('Supprimer cet étage', 'Delete this floor')}</button></div>` : '');
}
/* l'aperçu 3D : la maison en maquette, ouverte à l'étage qu'on dessine (les murs coupés à mi-hauteur) */
function hbPreviewSoon(ms){ clearTimeout(HB.prevT); HB.prevT = setTimeout(hbPreview, ms == null ? 160 : ms); }
function hbPreview(){
  const m = hbMap(), img = document.getElementById('hbPrev'); if(!m || !img || !GL.gl) return;
  const id = 'hbprev', LV = hbLevelsOf(m.hs);
  try{
    if(typeof dropSet === 'function') dropSet(id);
    SET_DEF[id] = houseDef(m, { cut:HB.lv });
    const all = LV.flatMap(l => l.rooms || []), B = all.length ? all.reduce((b, r) => [Math.min(b[0], r.x), Math.min(b[1], r.z), Math.max(b[2], r.x + r.w), Math.max(b[3], r.z + r.d)], [1e9, 1e9, -1e9, -1e9]) : [-5, -4, 5, 4];
    const ext = Math.max(B[2] - B[0], B[3] - B[1], 6), y0 = HB.lv * (clamp(+m.hs.H || 2.7, 2.3, 4) + HB_SL);
    const cam = { tx:(B[0] + B[2]) / 2, ty:y0 + 0.4, tz:(B[1] + B[3]) / 2, yaw:HB.yaw, pitch:HB.pitch, dist:ext * 1.35 + 2.5, lens:30, roll:0 };
    const sh = { id:'hbprev', set:id, chars:[], crowds:[], vehicles:[], cam, info:newInfo() };
    const w = 300, h = 170;
    const url = offscreenURL(w, h, (W, H) => drawFrame(sh, W, H, true), 0.86);
    HB.prevURL = url; img.src = url;
  }catch(err){ console.warn(err); }
  if(typeof dropSet === 'function') dropSet(id); delete SET_DEF[id];
}

/* ---------- 7. Les gestes dans l'atelier ---------- */
function hbBind(el){
  el.addEventListener('click', e => { const b = e.target.closest('[data-hb]'); if(b && b.tagName !== 'INPUT') hbAct(b.dataset.hb, b); });
  el.addEventListener('change', e => {
    const t = e.target, hs = hbHS(); if(!hs) return;
    if(t.dataset.hb === 'rfur') return hbEdit(h => { const r = hbLevelsOf(h)[HB.lv].rooms.find(x => x.id === HB.sel.rid); if(r) r.fur = t.checked; }, true);
    if(t.dataset.hb === 'fur') return hbEdit(h => { h.fur = t.checked; });
    if(t.dataset.hb === 'extG') return hbEdit(h => { const r = hbLevelsOf(h)[HB.lv].rooms.find(x => x.id === HB.sel.rid), it = r && (r.ext || [])[HB.sel.i]; if(it) it.g = t.checked; }, true);
    if(t.dataset.hbcol) return hbAct(t.dataset.hbcol, { dataset:{ c:t.value } });
    if(t.id === 'hbName' && HB.nameSnap){ pushUndo(HB.nameSnap); HB.nameSnap = null; changed(); hbRender(); }
    if(t.dataset.hbr && HB.rSnap){ pushUndo(HB.rSnap); HB.rSnap = null; hbNormalize(hs); changed(); hbRender(); hbPreviewSoon(); }
  });
  hbBind2(el);
}
function hbAct(a, b){
  {
    const hs = hbHS(); if(!hs) return;
    const lvIdx = HB.lv, selRoom = () => { const lv = hbLevelsOf(hbHS())[lvIdx]; return HB.sel && lv.rooms.find(x => x.id === HB.sel.rid); };
    const selItem = () => { const r = selRoom(); return r && (r[HB.sel.k === 'win' ? 'wins' : 'ext'] || [])[HB.sel.i]; };
    if(a === 'close') return hbClose();
    if(a === 'lv'){ HB.lv = +b.dataset.i; HB.sel = null; hbRender(); hbPreviewSoon(10); return; }
    if(a === 'addLv') return hbAddLevel();
    if(a === 'undo' || a === 'redo'){ (a === 'undo' ? undo : redo)(); HB.sel = null; if(!hbMap()) return hbClose(); hbRender(); hbPreviewSoon(); return; }
    if(a === 'tool'){ HB.tool = b.dataset.t; HB.hover = null; if(HB.tool !== 'sel') HB.sel = null; hbRender(); return; }
    if(a === 'tpl'){ HB.showTpl = true; hbTplHTML(); return; }
    if(a === 'tplClose'){ HB.showTpl = false; const t = document.getElementById('hbTpl'); if(t) t.innerHTML = ''; return; }
    if(a === 'useTpl'){ const ths = hbFromTemplate(b.dataset.id); HB.showTpl = false; HB.noTpl = HB.mid; if(b.dataset.id === 'blank') HB.tool = 'room'; HB.lv = 0; HB.sel = null; HB.vb = null;
      hbEdit(h => { Object.keys(h).forEach(k => delete h[k]); Object.assign(h, ths); }); if(b.dataset.id !== 'blank') HB.tool = 'sel'; hbRender(); return; }
    if(a === 'zoom'){ hbZoom(b.dataset.z === 'in' ? 0.8 : 1.25); return; }
    if(a === 'fit'){ HB.vb = null; hbFitVB(); hbDrawSvg(); return; }
    if(a === 'yaw'){ HB.yaw += +b.dataset.d * 45; hbPreview(); return; }
    if(a === 'dtype'){ HB.drawType = b.dataset.t; HB.tool = 'room'; hbRender(); return; }
    if(a === 'del') return hbDelete();
    // la pièce choisie
    if(a === 'rtype') return hbEdit(h => { const r = hbLevelsOf(h)[lvIdx].rooms.find(x => x.id === HB.sel.rid); if(!r) return; const ty = HB_TYPE[b.dataset.t], old = HB_TYPE[r.t];
      if(!r.n || (old && (r.n === L(old[1], old[2]) || r.n.startsWith(L(old[1], old[2]))))) r.n = hbNameFor(hbLevelsOf(h), b.dataset.t, r);
      r.t = b.dataset.t; r.f = { k:ty[3][0], c:ty[3][1] }; r.wl = { k:ty[4][0], c:ty[4][1] }; }, true);
    if(a === 'rfloor') return hbEdit(() => { const r = selRoom(); const o = r.f || {}; r.f = { k:b.dataset.k, c:o.k === b.dataset.k && o.c ? o.c : TEX_KINDS[b.dataset.k].cols[0] }; }, true);
    if(a === 'rwall') return hbEdit(() => { const r = selRoom(); const o = r.wl || {}; r.wl = { k:b.dataset.k, c:o.k === b.dataset.k && o.c ? o.c : TEX_KINDS[b.dataset.k].cols[0] }; }, true);
    if(a === 'rfloorC') return hbEdit(() => { const r = selRoom(); r.f = Object.assign({}, mapSurf(r.f, 'parquet'), { c:b.dataset.c }); }, true);
    if(a === 'rwallC') return hbEdit(() => { const r = selRoom(); r.wl = Object.assign({}, mapSurf(r.wl, 'paint'), { c:b.dataset.c }); }, true);
    if(a === 'rdup') return hbDupRoom();
    // les portes, les fenêtres, l'escalier
    if(a === 'dw') return hbEdit(h => { const d = hbLevelsOf(h)[lvIdx].doors[HB.sel.i]; if(d) d.w = +b.dataset.v; }, true);
    if(a === 'openWall') return hbEdit(h => { const lv = hbLevelsOf(h)[lvIdx], d = lv.doors[HB.sel.i]; if(!d) return; const pair = hbDoorPair(lv, d); if(pair){ lv.open.push(hbPairKey(pair[0].id, pair[1].id)); lv.doors.splice(HB.sel.i, 1); } HB.sel = null; });
    if(a === 'extC') return hbEdit(() => { const it = selItem(); if(it) it.c = b.dataset.c; }, true);
    if(a === 'extW') return hbEdit(() => { const it = selItem(); if(it) it.w = +b.dataset.v; }, true);
    if(a === 'wk') return hbEdit(() => { const it = selItem(); if(!it) return; const k = b.dataset.v; Object.assign(it, k === 'small' ? { w:0.6, h:0.6, y:1.4 } : k === 'big' ? { w:2.0, h:1.5, y:0.8 } : k === 'baie' ? { w:2.4, h:2.15, y:0 } : { w:1.2, h:1.3, y:0.9 }); }, true);
    if(a === 'wf') return hbEdit(() => { const it = selItem(); if(it) it.f = b.dataset.c; }, true);
    if(a === 'strot') return hbEdit(h => { const lv = hbLevelsOf(h)[lvIdx], st = lv.st[HB.sel.i]; if(!st) return; hbRotStair(lv, st); }, true);
    if(a === 'stC') return hbEdit(h => { const st = hbLevelsOf(h)[lvIdx].st[HB.sel.i]; if(st) st.c = b.dataset.c; }, true);
    // toute la maison
    if(a === 'fac') return hbEdit(h => { const o = h.fac || {}; h.fac = { k:b.dataset.k, c:o.k === b.dataset.k && o.c ? o.c : TEX_KINDS[b.dataset.k].cols[0] }; });
    if(a === 'facC') return hbEdit(h => { h.fac = Object.assign({}, mapSurf(h.fac, 'plaster'), { c:b.dataset.c }); });
    if(a === 'roof') return hbEdit(h => { h.roof = b.dataset.v; h.rf = { k:h.roof === 'gable' ? 'rtile' : 'gravel' }; h.rf.c = TEX_KINDS[h.rf.k].cols[0]; });
    if(a === 'rf') return hbEdit(h => { const o = h.rf || {}; h.rf = { k:b.dataset.k, c:o.k === b.dataset.k && o.c ? o.c : TEX_KINDS[b.dataset.k].cols[0] }; });
    if(a === 'rfC') return hbEdit(h => { h.rf = Object.assign({}, mapSurf(h.rf, 'rtile'), { c:b.dataset.c }); });
    if(a === 'gnd') return hbEdit(h => { h.gnd = { k:b.dataset.k, c:TEX_KINDS[b.dataset.k].cols[0] }; });
    if(a === 'lights' || a === 'lcol' || a === 'view') return hbEdit(h => { h[a] = b.dataset.v; });
    if(a === 'delLv') return hbDelLevel();
  }
}
function hbBind2(el){
  el.addEventListener('input', e => {
    const t = e.target, m = hbMap(); if(!m) return;
    if(t.id === 'hbName'){ const r = hbLevelsOf(m.hs)[HB.lv].rooms.find(x => x.id === (HB.sel && HB.sel.rid)); if(!r) return; if(!HB.nameSnap) HB.nameSnap = snapshot(); r.n = t.value; syncMaps(S.doc); save(); hbDrawSvg(); return; }
    if(t.dataset.hbr){ if(!HB.rSnap) HB.rSnap = snapshot(); m.hs[t.dataset.hbr] = +t.value; const b = t.nextElementSibling; if(b) b.textContent = round(+t.value, 2) + ' m'; syncMaps(S.doc); hbPreviewSoon(); }
  });
  el.addEventListener('pointerdown', hbDown);
  el.addEventListener('pointermove', hbMove);
  el.addEventListener('pointerup', hbUp); el.addEventListener('pointercancel', hbUp);
  el.addEventListener('pointerleave', () => { if(!HB.drag && HB.hover){ HB.hover = null; hbDrawSvg(); } });
  el.addEventListener('wheel', e => { if(!e.target.closest('#hbCv')) return; e.preventDefault(); const p = hbPt(e); hbZoom(e.deltaY > 0 ? 1.12 : 1 / 1.12, p); }, { passive:false });
  // l'aperçu : on le fait tourner en le glissant
  el.addEventListener('pointerdown', e => { const im = e.target.closest('#hbPrev'); if(!im) return; const x0 = e.clientX, y0 = e.clientY, yw = HB.yaw, pt = HB.pitch; im.setPointerCapture(e.pointerId);
    const mv = ev => { HB.yaw = yw + (ev.clientX - x0) * 0.5; HB.pitch = clamp(pt - (ev.clientY - y0) * 0.3, -85, -15); clearTimeout(HB.prevT); HB.prevT = setTimeout(hbPreview, 16); };
    const up = () => { im.removeEventListener('pointermove', mv); im.removeEventListener('pointerup', up); };
    im.addEventListener('pointermove', mv); im.addEventListener('pointerup', up); });
}
function hbZoom(k, at){
  const vb = HB.vb, c = at || [vb[0] + vb[2] / 2, vb[1] + vb[3] / 2], w = clamp(vb[2] * k, 4, 80), kk = w / vb[2];
  HB.vb = [c[0] - (c[0] - vb[0]) * kk, c[1] - (c[1] - vb[1]) * kk, vb[2] * kk, vb[3] * kk]; hbDrawSvg();
}
function hbNameFor(LV, t, skip){
  const ty = HB_TYPE[t] || HB_TYPE.empty, base = L(ty[1], ty[2]), used = LV.flatMap(l => l.rooms || []).filter(r => r !== skip).map(r => r.n);
  if(!used.includes(base)) return base; for(let n = 2; n < 30; n++) if(!used.includes(base + ' ' + n)) return base + ' ' + n; return base;
}
const HB_NEXT = { living:'kitchen', kitchen:'bedroom', bedroom:'bath', bath:'bedroom', dining:'kitchen', kids:'bath', office:'bedroom', hall:'living', corridor:'bedroom', wc:'bedroom', garage:'living', empty:'empty' };
function hbDoorPair(lv, d){
  for(const r of lv.rooms) for(const E of hbEdges(r)){ if(E.ax !== d.o || Math.abs(E.c - d.c) > 1e-4) continue; const x = hbShared(E, r, lv.rooms, lv.open).find(q => d.a >= q.s && d.a <= q.e); if(x) return [r, x.q]; }
  return null;
}
function hbRotStair(lv, st){
  const order = ['n', 'e', 's', 'w'], R0 = hbStRect(st), c = [(R0[0] + R0[2]) / 2, (R0[1] + R0[3]) / 2], room = lv.rooms.find(r => hbInside(R0, hbRect(r)));
  for(let k = 1; k <= 4; k++){ const dir = order[(order.indexOf(st.dir) + k) % 4], horiz = dir === 'e' || dir === 'w', w = horiz ? (st.l || 3.6) : (st.w || 1), d = horiz ? (st.w || 1) : (st.l || 3.6);
    let x = c[0] - w / 2, z = c[1] - d / 2; if(room){ x = clamp(x, room.x + 0.06, room.x + room.w - w - 0.06); z = clamp(z, room.z + 0.06, room.z + room.d - d - 0.06); }
    if(!room || hbInside([x, z, x + w, z + d], hbRect(room))){ st.dir = dir; st.x = round(x, 2); st.z = round(z, 2); return; } }
}
function hbAddLevel(){
  const LV = hbLevelsOf(hbHS()); if(LV.length >= 3) return;
  const src = LV[HB.lv === LV.length - 1 ? HB.lv : LV.length - 1];
  hbEdit(h => { const L0 = hbLevelsOf(h); const top = L0[L0.length - 1];
    const rooms = (top.rooms || []).map((r, k) => hbRoom(k === 0 ? 'bedroom' : 'bedroom', r.x, r.z, r.w, r.d, { n:'' }));
    rooms.forEach(r => { r.n = hbNameFor(L0.concat([{ rooms }]), 'bedroom', r); });
    L0.push({ rooms, doors:[], st:[], open:[], nd:[] }); h.lv = L0;
    rooms.forEach(r => hbAutoWins(L0[L0.length - 1], r)); });
  void src;
  HB.lv = hbLevelsOf(hbHS()).length - 1; HB.sel = null; hbRender(); hbPreviewSoon();
  toast(L('Étage ajouté : il reprend le contour de celui du dessous. Pose l’escalier pour y monter.', 'Floor added, with the same outline as below. Add the stairs to get there.'));
}
async function hbDelLevel(){
  const LV = hbLevelsOf(hbHS()); if(LV.length < 2) return;
  const ok = await ask(L('Supprimer cet étage ?', 'Delete this floor?'), L('Ses pièces, portes et fenêtres seront enlevées (Ctrl+Z pour revenir).', 'Its rooms, doors and windows will be removed (Ctrl+Z to undo).'), L('Supprimer', 'Delete'));
  if(!ok) return; hbEdit(h => { h.lv = hbLevelsOf(h).slice(0, -1); }); HB.lv = hbLevelsOf(hbHS()).length - 1; HB.sel = null; hbRender(); hbPreviewSoon();
}
function hbDelete(){
  const s = HB.sel; if(!s) return;
  hbEdit(h => { const lv = hbLevelsOf(h)[HB.lv];
    if(s.k === 'room'){ lv.rooms = lv.rooms.filter(r => r.id !== s.rid); }
    else if(s.k === 'door'){ const d = lv.doors[s.i]; if(d){ const pair = hbDoorPair(lv, d); if(pair){ lv.nd = lv.nd || []; lv.nd.push(hbPairKey(pair[0].id, pair[1].id)); } lv.doors.splice(s.i, 1); } }
    else if(s.k === 'win' || s.k === 'ext'){ const r = lv.rooms.find(x => x.id === s.rid); if(r) (r[s.k === 'win' ? 'wins' : 'ext'] || []).splice(s.i, 1); }
    else if(s.k === 'st') lv.st.splice(s.i, 1);
    HB.sel = null; });
}
function hbDupRoom(){
  const lv = hbCurLv(), r = HB.sel && lv.rooms.find(x => x.id === HB.sel.rid); if(!r) return;
  // la copie se colle à droite, sinon en dessous, sinon à gauche, sinon au-dessus
  const tries = [[r.w, 0], [0, r.d], [-r.w, 0], [0, -r.d]];
  for(const [dx, dz] of tries){ const rc = [r.x + dx, r.z + dz, r.x + dx + r.w, r.z + dz + r.d]; if(hbFree(lv, rc)){
    let nid = null; hbEdit(h => { const L0 = hbLevelsOf(h)[HB.lv], c = JSON.parse(JSON.stringify(r)); c.id = hbUid(); c.x += dx; c.z += dz; c.n = hbNameFor(hbLevelsOf(h), c.t, null); c.wins = []; c.ext = []; L0.rooms.push(c); hbAutoWins(L0, c); nid = c.id; });
    HB.sel = { k:'room', rid:nid }; hbRender(); return; } }
  toast(L('Pas de place libre autour de cette pièce.', 'No free space around this room.'), 'warn');
}
/* le pointeur sur le plan */
function hbDown(e){
  if(!e.target.closest('#hbSvg')) return;
  const lv = hbCurLv(); if(!lv) return; const [x, z] = hbPt(e);
  // se déplacer dans le plan : espace + glisser, ou le bouton du milieu
  if(e.button === 1 || HB.space){ e.preventDefault(); HB.drag = { mode:'pan', cx:e.clientX, cy:e.clientY, vb:HB.vb.slice() }; e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId); return; }
  if(e.button !== 0) return;
  const svg = document.getElementById('hbSvg'); try{ svg.setPointerCapture(e.pointerId); }catch(err){}
  const t = HB.tool;
  if(t === 'room'){ const p = [hbSnap(x), hbSnap(z)]; HB.drag = { mode:'draw', p0:p, rc:[p[0], p[1], p[0], p[1]], bad:true }; hbDrawSvg(); return; }
  if(t === 'door' || t === 'win' || t === 'st'){ const g = HB.hover && HB.hover.ghost; if(g && !g.bad && g.commit) g.commit(); else if(g && g.bad && g.why) toast(g.why, 'warn'); return; }
  // choisir
  const h = e.target.closest('[data-h]'), op = e.target.closest('[data-op]'), st = e.target.closest('[data-st]'), rm = e.target.closest('[data-rid]');
  if(h && HB.sel && HB.sel.k === 'room'){ const r = lv.rooms.find(q => q.id === HB.sel.rid); HB.drag = { mode:'resize', h:h.dataset.h, rid:r.id, o:{ x:r.x, z:r.z, w:r.w, d:r.d }, snap:snapshot() }; return; }
  if(op){ const k = op.dataset.op; HB.sel = k === 'door' ? { k:'door', i:+op.dataset.i } : { k, rid:op.dataset.rid, i:+op.dataset.i }; HB.drag = { mode:'opmove', k, i:+op.dataset.i, rid:op.dataset.rid, x0:x, z0:z, snap:snapshot(), moved:false }; hbRender(); return; }
  if(st){ const i = +st.dataset.st; HB.sel = { k:'st', i }; const s0 = lv.st[i]; HB.drag = { mode:'stmove', i, x0:x, z0:z, o:{ x:s0.x, z:s0.z }, snap:snapshot(), moved:false }; hbRender(); return; }
  if(rm && !op){ const r = lv.rooms.find(q => q.id === rm.dataset.rid); if(r){ HB.sel = { k:'room', rid:r.id }; HB.drag = { mode:'move', rid:r.id, x0:x, z0:z, o:{ x:r.x, z:r.z }, snap:snapshot(), moved:false, st:lv.st.map((s, i) => hbInside(hbStRect(s), hbRect(r)) ? { i, x:s.x, z:s.z } : null).filter(Boolean) }; hbRender(); return; } }
  HB.sel = null; hbRender();
}
function hbMove(e){
  const svgOn = e.target.closest && e.target.closest('#hbCv');
  if(!HB.drag && !svgOn) return;
  const lv = hbCurLv(); if(!lv) return; const [x, z] = hbPt(e), d = HB.drag;
  if(d && d.mode === 'pan'){ const svg = document.getElementById('hbSvg'), k = HB.vb[2] / svg.clientWidth; HB.vb = [d.vb[0] - (e.clientX - d.cx) * k, d.vb[1] - (e.clientY - d.cy) * k, d.vb[2], d.vb[3]]; hbDrawSvg(); return; }
  if(d && d.mode === 'draw'){ const p = [hbSnap(x), hbSnap(z)], rc = [Math.min(d.p0[0], p[0]), Math.min(d.p0[1], p[1]), Math.max(d.p0[0], p[0]), Math.max(d.p0[1], p[1])];
    d.rc = rc; d.bad = rc[2] - rc[0] < 1 || rc[3] - rc[1] < 1 || !hbFree(lv, rc); hbDrawSvg(); hbHintSet(); return; }
  if(d && d.mode === 'move'){ const r = lv.rooms.find(q => q.id === d.rid); if(!r) return; const nx = d.o.x + hbSnap(x - d.x0), nz = d.o.z + hbSnap(z - d.z0);
    if(nx === r.x && nz === r.z) return; d.moved = true; r.x = nx; r.z = nz; d.st.forEach(s => { lv.st[s.i].x = s.x + (nx - d.o.x); lv.st[s.i].z = s.z + (nz - d.o.z); });
    d.bad = !hbFree(lv, hbRect(r), r); hbDrawSvg(); return; }
  if(d && d.mode === 'resize'){ const r = lv.rooms.find(q => q.id === d.rid); if(!r) return; const o = d.o, sx = hbSnap(x), sz = hbSnap(z);
    let x0 = o.x, z0 = o.z, x1 = o.x + o.w, z1 = o.z + o.d;
    if(d.h.includes('w')) x0 = Math.min(sx, x1 - 1); if(d.h.includes('e')) x1 = Math.max(sx, x0 + 1);
    if(d.h.includes('n')) z0 = Math.min(sz, z1 - 1); if(d.h.includes('s')) z1 = Math.max(sz, z0 + 1);
    Object.assign(r, { x:x0, z:z0, w:x1 - x0, d:z1 - z0 }); d.moved = true; d.bad = !hbFree(lv, hbRect(r), r); hbDrawSvg(); return; }
  if(d && d.mode === 'stmove'){ const st = lv.st[d.i]; if(!st) return; st.x = round(d.o.x + hbSnap(x - d.x0, 0.1), 2); st.z = round(d.o.z + hbSnap(z - d.z0, 0.1), 2); d.moved = true;
    d.bad = !lv.rooms.some(r => hbInside(hbStRect(st), hbRect(r))); hbDrawSvg(); return; }
  if(d && d.mode === 'opmove'){ hbOpMove(lv, d, x, z); return; }
  // au survol : ce qu'on va poser
  HB.hover = { x, z, ghost:hbGhost(lv, x, z) }; hbDrawSvg();
}
function hbHintSet(){ const h = document.getElementById('hbHint'); if(h) h.querySelector('span').textContent = hbHint(); }
/* déplacer une porte ou une fenêtre le long de son mur */
function hbOpMove(lv, d, x, z){
  if(d.k === 'door'){ const dr = lv.doors[d.i]; if(!dr) return; const a = hbSnap(dr.o === 'x' ? x : z, 0.05), pair = hbDoorPair(lv, Object.assign({}, dr, { a:dr.a }));
    if(!pair) return; const E = hbEdges(pair[0]).find(E2 => E2.ax === dr.o && Math.abs(E2.c - dr.c) < 1e-4), x2 = E && hbShared(E, pair[0], lv.rooms, lv.open).find(q => q.q === pair[1]);
    if(!x2) return; const w = dr.w || 0.9; dr.a = clamp(a, x2.s + w / 2 + 0.06, x2.e - w / 2 - 0.06); d.moved = true; hbDrawSvg(); return; }
  const r = lv.rooms.find(q => q.id === d.rid), it = r && (r[d.k === 'win' ? 'wins' : 'ext'] || [])[d.i]; if(!it) return;
  const E = hbEdges(r).find(q => q.s === it.s), base = E.ax === 'x' ? r.x : r.z, a = hbSnap(E.ax === 'x' ? x : z, 0.05), w = it.w || 1;
  it.u = round(clamp(a, E.a0 + w / 2 + 0.12, E.a1 - w / 2 - 0.12) - base, 2); d.moved = true; hbDrawSvg();
}
/* ce que l'outil va poser, sous le pointeur (avec la raison si ça ne va pas) */
function hbGhost(lv, x, z){
  const t = HB.tool;
  if(t === 'door' || t === 'win'){
    const w = hbWallAt(lv, x, z); if(!w) return null; const E = w.E;
    if(t === 'door' && w.shared){ if(w.shared.open) return null; const s = w.shared, dw = 0.9, a = clamp(hbSnap(w.a, 0.05), s.s + dw / 2 + 0.06, s.e - dw / 2 - 0.06), bad = s.e - s.s < dw + 0.12;
      return { line:[hbP(E, a - dw / 2, 0), hbP(E, a + dw / 2, 0)], bad, why:L('Ce mur est trop court pour une porte.', 'This wall is too short for a door.'), commit:() => { hbEdit(h => { const L0 = hbLevelsOf(h)[HB.lv]; L0.doors.push({ o:E.ax, c:E.c, a:round(a, 2), w:dw }); L0.nd = (L0.nd || []).filter(k => k !== hbPairKey(w.r.id, s.q.id)); }); } }; }
    if(t === 'win' && w.shared) return { line:[hbP(E, w.a - 0.6, 0), hbP(E, w.a + 0.6, 0)], bad:true, why:L('Une fenêtre se pose sur un mur qui donne dehors.', 'A window goes on an outside wall.') };
    const ww = t === 'win' ? 1.2 : 1.0, sh = hbShared(E, w.r, lv.rooms, lv.open || []), seg = hbIvMinus(E.a0, E.a1, sh.map(q => [q.s, q.e])).find(([p, q]) => w.a >= p && w.a <= q);
    if(!seg) return null; const a = clamp(hbSnap(w.a, 0.05), seg[0] + ww / 2 + 0.12, seg[1] - ww / 2 - 0.12), bad = seg[1] - seg[0] < ww + 0.3, base = E.ax === 'x' ? w.r.x : w.r.z;
    return { line:[hbP(E, a - ww / 2, -0.06), hbP(E, a + ww / 2, -0.06)], bad, why:L('Ce mur est trop court.', 'This wall is too short.'), commit:() => { let idx = 0; hbEdit(h => { const r = hbLevelsOf(h)[HB.lv].rooms.find(q => q.id === w.r.id); const key = t === 'win' ? 'wins' : 'ext'; r[key] = r[key] || []; r[key].push({ s:E.s, u:round(a - base, 2), w:ww }); idx = r[key].length - 1; });
      HB.sel = { k:t === 'win' ? 'win' : 'ext', rid:w.r.id, i:idx }; HB.tool = 'sel'; hbRender(); } };
  }
  if(t === 'st'){
    const r = hbRoomAt(lv, x, z); if(!r) return null;
    const dir = HB.stDir || (r.d >= r.w ? 'n' : 'e'), horiz = dir === 'e' || dir === 'w', w = horiz ? 3.6 : 1, d = horiz ? 1 : 3.6;
    const sx = clamp(hbSnap(x - w / 2, 0.1), r.x + 0.06, r.x + r.w - w - 0.06), sz = clamp(hbSnap(z - d / 2, 0.1), r.z + 0.06, r.z + r.d - d - 0.06), rect = [sx, sz, sx + w, sz + d];
    const bad = !hbInside(rect, hbRect(r)) || HB.lv >= 2;
    return { rect, bad, why:HB.lv >= 2 ? L('Pas plus de trois niveaux.', 'No more than three levels.') : L('La pièce est trop petite pour un escalier (il faut 1 × 3,6 m).', 'The room is too small for stairs (1 × 3.6 m needed).'),
      commit:() => { const LV = hbLevelsOf(hbHS()), made = LV.length - 1 === HB.lv; let idx = 0;
        if(made) hbAddLevel();
        hbEdit(h => { const L0 = hbLevelsOf(h)[HB.lv - (made ? 1 : 0)]; L0.st = L0.st || []; L0.st.push({ x:round(sx, 2), z:round(sz, 2), w:1, l:3.6, dir }); idx = L0.st.length - 1; });
        if(made) HB.lv -= 1; HB.sel = { k:'st', i:idx }; HB.tool = 'sel'; hbRender(); } };
  }
  return null;
}
function hbUp(e){
  const d = HB.drag; if(!d) return; HB.drag = null;
  const m = hbMap(); if(!m) return; const lv = hbCurLv();
  if(d.mode === 'pan') return;
  if(d.mode === 'draw'){
    if(d.bad){ if(d.rc[2] - d.rc[0] >= 0.25 || d.rc[3] - d.rc[1] >= 0.25) toast(d.rc[2] - d.rc[0] < 1 || d.rc[3] - d.rc[1] < 1 ? L('Une pièce fait au moins 1 × 1 m.', 'A room is at least 1 × 1 m.') : L('Une pièce ne peut pas en chevaucher une autre.', 'A room can’t overlap another one.'), 'warn'); hbDrawSvg(); hbHintSet(); return; }
    const rc = d.rc, t = HB.drawType; let nid = null;
    hbEdit(h => { const L0 = hbLevelsOf(h)[HB.lv], r = hbRoom(t, rc[0], rc[1], rc[2] - rc[0], rc[3] - rc[1]); r.n = hbNameFor(hbLevelsOf(h), t, null); L0.rooms.push(r); hbNormalize(h);
      const L1 = hbLevelsOf(h)[HB.lv], r1 = L1.rooms.find(q => q.id === r.id); hbAutoWins(L1, r1);
      // la toute première pièce du rez-de-chaussée : une porte d'entrée
      if(HB.lv === 0 && !L1.rooms.some(q => (q.ext || []).length)){ const E = hbEdges(r1).find(q => q.s === 's'); if(E && r1.w >= 1.6) r1.ext.push({ s:'s', u:round(Math.min(r1.w - 0.8, 0.9 + 0.2), 2), w:1.0 }); }
      nid = r.id; });
    HB.sel = { k:'room', rid:nid }; HB.drawType = HB_NEXT[t] || t; HB.tool = 'sel'; hbRender();
    return;
  }
  if(d.mode === 'move' || d.mode === 'resize' || d.mode === 'stmove'){
    if(!d.moved) return;
    if(d.bad){ restore(d.snap); toast(d.mode === 'stmove' ? L('L’escalier doit rester dans une pièce.', 'The stairs must stay inside a room.') : L('Une pièce ne peut pas en chevaucher une autre.', 'A room can’t overlap another one.'), 'warn'); hbRender(); return; }
    // les fenêtres suivent la pièce (leur place est comptée depuis le coin de la pièce) ; les portes intérieures sont refaites au besoin
    pushUndo(d.snap); hbNormalize(m.hs); changed(); hbRender(); hbPreviewSoon(); return;
  }
  if(d.mode === 'opmove'){ if(!d.moved) return; pushUndo(d.snap); hbNormalize(m.hs); changed(); hbRender(); hbPreviewSoon(); }
  void lv; void e;
}
document.addEventListener('keydown', e => {
  if(!HB.open) return;
  const tag = (e.target.tagName || '').toLowerCase(); if(tag === 'input' || tag === 'textarea' || tag === 'select'){ if(e.key === 'Escape') e.target.blur(); return; }
  e.stopPropagation();
  const k = e.key.toLowerCase();
  if((e.ctrlKey || e.metaKey) && k === 'z'){ e.preventDefault(); (e.shiftKey ? redo : undo)(); HB.sel = null; if(!hbMap()) return hbClose(); hbRender(); hbPreviewSoon(); return; }
  if((e.ctrlKey || e.metaKey) && k === 'y'){ e.preventDefault(); redo(); HB.sel = null; hbRender(); hbPreviewSoon(); return; }
  if((e.ctrlKey || e.metaKey) && k === 'd'){ e.preventDefault(); if(HB.sel && HB.sel.k === 'room') hbDupRoom(); return; }
  if(e.key === ' '){ HB.space = true; e.preventDefault(); return; }
  if(e.key === 'Delete' || e.key === 'Backspace'){ e.preventDefault(); hbDelete(); return; }
  if(e.key === 'Escape'){ e.preventDefault(); if(HB.drag){ const d = HB.drag; HB.drag = null; if(d.snap && d.moved) restore(d.snap); hbRender(); return; } if(HB.tool !== 'sel' || HB.sel){ HB.tool = 'sel'; HB.sel = null; HB.hover = null; hbRender(); return; } hbClose(); return; }
  const tools = { v:'sel', p:'room', d:'door', f:'win', e:'st' };
  if(tools[k] && !e.ctrlKey && !e.metaKey){ HB.tool = tools[k]; HB.hover = null; if(HB.tool !== 'sel') HB.sel = null; hbRender(); return; }
  if(k === 'r'){ if(HB.tool === 'st'){ const o = ['n', 'e', 's', 'w'], cur = HB.stDir || 'n'; HB.stDir = o[(o.indexOf(cur) + 1) % 4]; if(HB.hover) HB.hover.ghost = hbGhost(hbCurLv(), HB.hover.x, HB.hover.z); hbDrawSvg(); }
    else if(HB.sel && HB.sel.k === 'st') hbEdit(h => hbRotStair(hbLevelsOf(h)[HB.lv], hbLevelsOf(h)[HB.lv].st[HB.sel.i]), true); return; }
  if(HB.sel && HB.sel.k === 'room' && ['arrowleft', 'arrowright', 'arrowup', 'arrowdown'].includes(k)){ e.preventDefault();
    const st = e.shiftKey ? 1 : 0.25, dx = k === 'arrowleft' ? -st : k === 'arrowright' ? st : 0, dz = k === 'arrowup' ? -st : k === 'arrowdown' ? st : 0, lv = hbCurLv(), r = lv.rooms.find(q => q.id === HB.sel.rid);
    if(r && hbFree(lv, [r.x + dx, r.z + dz, r.x + r.w + dx, r.z + r.d + dz], r)) hbEdit(h => { const L0 = hbLevelsOf(h)[HB.lv], q = L0.rooms.find(x => x.id === r.id); L0.st.forEach(s => { if(hbInside(hbStRect(s), hbRect(q))){ s.x += dx; s.z += dz; } }); q.x += dx; q.z += dz; }, true); }
}, true);
document.addEventListener('keyup', e => { if(e.key === ' ') HB.space = false; });
window.addEventListener('resize', () => { if(HB.open){ HB.vb = null; hbFitVB(); hbDrawSvg(); } });
