/* =====================================================================
   RAGING BOARD — LE ZOOM VERS LA SOURIS (comme les logiciels 3D pro)
   ---------------------------------------------------------------------
   Avant, la molette avançait vers le point que la caméra regarde (souvent
   un point au sol, ailleurs que là où l'on vise) et ne glissait que peu à
   peu vers la souris : en visant un visage, un passant ou une voiture, on
   passait à côté, ou à travers.
   Maintenant, chaque cran rapproche la caméra du point exact sous la souris
   (un personnage, un objet, un figurant, un mur, le sol) d'une part de la
   distance qui reste : on s'en approche autant qu'on veut, jusqu'à quelques
   centimètres, sans jamais le traverser. Ce point devient le centre autour
   duquel la caméra tourne ensuite. Seuls les murs arrêtent la caméra.
===================================================================== */
const ZM = { min:0.03 };
// la forme exacte de chaque objet (ses vraies faces, pas une boîte autour) : gardée une fois calculée
const ZGEO = new Map();
function zoomGeo(v){
  const k = vehKey(v) + (v.kind && v.kind.startsWith('sp_') ? '' : ''); let o = ZGEO.get(k); if(o) return o;
  const g = vehicleGeo(v.kind, v.col, geo(), v), p = g.p; let a = [1e9, 1e9, 1e9], b = [-1e9, -1e9, -1e9];
  for(let i = 0; i < p.length; i += 3) for(let q = 0; q < 3; q++){ a[q] = Math.min(a[q], p[i + q]); b[q] = Math.max(b[q], p[i + q]); }
  o = { p:new Float32Array(p), a, b }; ZGEO.set(k, o); return o;
}
// rayon / triangle (Möller-Trumbore)
function zoomTri(o, d, P, i){
  const e1x = P[i + 3] - P[i], e1y = P[i + 4] - P[i + 1], e1z = P[i + 5] - P[i + 2], e2x = P[i + 6] - P[i], e2y = P[i + 7] - P[i + 1], e2z = P[i + 8] - P[i + 2];
  const px = d[1] * e2z - d[2] * e2y, py = d[2] * e2x - d[0] * e2z, pz = d[0] * e2y - d[1] * e2x, det = e1x * px + e1y * py + e1z * pz;
  if(Math.abs(det) < 1e-12) return -1; const inv = 1 / det, tx = o[0] - P[i], ty = o[1] - P[i + 1], tz = o[2] - P[i + 2];
  const u = (tx * px + ty * py + tz * pz) * inv; if(u < 0 || u > 1) return -1;
  const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x, w = (d[0] * qx + d[1] * qy + d[2] * qz) * inv; if(w < 0 || u + w > 1) return -1;
  return (e2x * qx + e2y * qy + e2z * qz) * inv;
}
// le premier objet touché par le rayon : [distance, numéro] (les véhicules, accessoires, figurants, éléments du décor)
function zoomHitObjects(o, rd){
  let best = 1e9, bi = -1;
  (shot().vehicles || []).forEach((v, n) => {
    const G = zoomGeo(v), inv = M4.invert(vehMat(v)), lo = M4.apply(inv, o), le = M4.apply(inv, [o[0] + rd[0], o[1] + rd[1], o[2] + rd[2]]);
    const dir = [le[0] - lo[0], le[1] - lo[1], le[2] - lo[2]]; let t0 = 0, t1 = 1e9;
    for(let k = 0; k < 3; k++){                                                     // d'abord la boîte qui l'entoure (rapide)
      if(Math.abs(dir[k]) < 1e-9){ if(lo[k] < G.a[k] || lo[k] > G.b[k]) return; continue; }
      let ta = (G.a[k] - lo[k]) / dir[k], tb = (G.b[k] - lo[k]) / dir[k]; if(ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta); t1 = Math.min(t1, tb); if(t0 > t1) return;
    }
    if(t0 >= best) return;
    for(let i = 0; i < G.p.length; i += 9){ const t = zoomTri(lo, dir, G.p, i); if(t > 0.02 && t < best){ best = t; bi = n; } }   // puis ses vraies faces
  });
  return [best, bi];
}
function zoomRayObjects(o, rd){ return zoomHitObjects(o, rd)[0]; }
// cliquer un objet : seulement s'il est vraiment sous la souris (plus de boîte invisible autour d'un arbre, d'une suspension)
vehPickAt = function(x, y){
  const [a, d] = rayAt(x, y), L0 = Math.hypot(d[0], d[1], d[2]) || 1, rd = [d[0] / L0, d[1] / L0, d[2] / L0];
  return zoomHitObjects(camEyeRaw(viewCam()), rd)[1];
};
// la distance jusqu'au décor (murs, meubles, sols, plafonds) : à grands pas, puis affinée (léger, même sur un vieil ordinateur)
function zoomRaySet(o, rd, maxd){
  const P = physOf(shot().set); if(!P) return 1e9;
  const skip = new Set(); for(let i = physHit(P, o); i >= 0; i = physHit(P, o, skip)) skip.add(i);
  const at = t => [o[0] + rd[0] * t, o[1] + rd[1] * t, o[2] + rd[2] * t];
  const yOk = Math.abs(physY(P, o) - o[1]) < 1e-6;   // (une caméra déjà hors des sols permis : on ne teste plus les sols, sinon tout bloquerait)
  const bad = (p, q) => physHit(P, q, skip) >= 0 || physWall(P, p, q) || (yOk && Math.abs(physY(P, q) - q[1]) > 1e-6);
  let t0 = 0, p = o;
  for(let t = 0.25; t <= maxd; t += 0.25){ const q = at(t); if(bad(p, q)){ let lo = t0, hi = t; for(let k = 0; k < 8; k++){ const m = (lo + hi) / 2; if(bad(at(lo), at(m))) hi = m; else lo = m; } return Math.max(0.02, lo); } p = q; t0 = t; }
  return 1e9;
}
// le point visé sous la souris : le plus proche entre un personnage, un objet, le décor (murs, meubles, sols) et le sol
function zoomPoint(x, y, h){
  const c = shot().cam, eye = camEyeRaw(c), [a, d] = rayAt(x, y), L0 = Math.hypot(d[0], d[1], d[2]) || 1, rd = [d[0] / L0, d[1] / L0, d[2] / L0];
  let D = 1e9;
  if(h && shot().chars[h.c]){ const J = charMatrices(shot().chars[h.c])[h.j]; if(J){ const q = M4.apply(J, [0, h.j === 'head' ? 0.1 : 0, 0]);
    const t = (q[0] - eye[0]) * rd[0] + (q[1] - eye[1]) * rd[1] + (q[2] - eye[2]) * rd[2] - (h.j === 'head' ? 0.13 : 0.08); if(t > 0.02) D = Math.min(D, t); } }   // devant la peau, pas au centre du membre
  D = Math.min(D, zoomRayObjects(eye, rd));
  try{ const t = zoomRaySet(eye, rd, Math.min(D, 120)); if(t < Math.min(D, 120)) D = Math.min(D, t); }catch(err){}
  if(rd[1] < -1e-4){ const fy = (SET_DEF[shot().set] && SET_DEF[shot().set].levels) ? clamp(c.ty - 1.0, 0, 30) : 0, t = (fy - eye[1]) / rd[1]; if(t > 0.02) D = Math.min(D, t); }
  if(D > 1e8) D = Math.max(c.dist, 4);
  return { eye, rd, D, P:[eye[0] + rd[0] * D, eye[1] + rd[1] * D, eye[2] + rd[2] * D] };
}
wheelApply = function(x, y, f, h){
  if(!_wheelSnap) _wheelSnap = snapshot();
  const c = shot().cam, Z = zoomPoint(x, y, f < 1 ? h : null), eye = Z.eye;
  // jamais de bond : un cran ne fait pas plus de chemin que ce que la caméra a devant elle (si la souris passe sur le ciel
  // ou sur un immeuble au loin, on avance pas à pas, de plus en plus vite, au lieu de sauter de 50 m d'un coup)
  const now = performance.now(); if(!ZM.t || now - ZM.t > 400) ZM.ds = clamp(c.dist, 0.3, 80) * 1.6 + 0.6; ZM.t = now;
  const lim = Math.min(ZM.ds * 1.15 + 0.15, clamp(c.dist, 0.3, 80) * 1.6 + 0.6);   // la portée ne grandit que doucement d'une image à l'autre
  ZM.ds = Math.min(Z.D, lim);
  if(Z.D > lim){ Z.D = lim; Z.P = [eye[0] + Z.rd[0] * lim, eye[1] + Z.rd[1] * lim, eye[2] + Z.rd[2] * lim]; }
  const P = Z.P;
  const yaw = c.yaw * D2R, pit = c.pitch * D2R, back = [Math.cos(pit) * Math.sin(yaw), -Math.sin(pit), Math.cos(pit) * Math.cos(yaw)], fwd = back.map(v => -v);
  // la nouvelle place de l'objectif : sur la droite qui va de lui au point visé (plus près en avançant, plus loin en reculant)
  let r = Z.D * f;
  if(f < 1) r = Math.max(ZM.min, r);
  else { const d = SET_DEF[shot().set] || {}, out = d.sky && !d.freeCam && !(d.rooms && !d.levels && !d.garden); r = Math.min(r, out ? 60 : DIST_MAX); }
  // tout contre : on s'arrête (on peut cadrer à quelques centimètres) ; si l'on insiste (encore quelques crans), on passe à travers
  if(f < 1 && Z.D <= ZM.min + 0.02){
    ZM.push = (ZM.push || 0) + (1 - f);
    if(ZM.push > 1.4){ ZM.push = 0; const s0 = 0.14;
      camGesture(c, () => { c.tx += Z.rd[0] * s0; c.ty += Z.rd[1] * s0; c.tz += Z.rd[2] * s0; }, true); }
    requestRender(); clearTimeout(_wheelT); _wheelT = setTimeout(() => { pushUndo(_wheelSnap); _wheelSnap = null; changed(); }, 350); return;
  }
  ZM.push = 0;
  const ne = [P[0] - Z.rd[0] * r, P[1] - Z.rd[1] * r, P[2] - Z.rd[2] * r];
  // la caméra garde son angle ; elle tournera ensuite autour de ce qu'on a visé
  const depth = Math.max(0.05, (P[0] - ne[0]) * fwd[0] + (P[1] - ne[1]) * fwd[1] + (P[2] - ne[2]) * fwd[2]);
  const set = () => { c.dist = depth; c.tx = ne[0] + fwd[0] * depth; c.ty = ne[1] + fwd[1] * depth; c.tz = ne[2] + fwd[2] * depth; };
  // une caméra coincée dans un mur ou hors du lieu : elle en ressort librement (sinon elle ne pourrait plus reculer)
  let stuck = false; try{ const PP = physOf(shot().set); stuck = !!PP && (physHit(PP, eye) >= 0 || !physIn(PP, eye)); }catch(err){}
  if(stuck || S.freeCam){ set(); keepCam(c); } else camGesture(c, set, true);
  requestRender();
  clearTimeout(_wheelT); _wheelT = setTimeout(() => { pushUndo(_wheelSnap); _wheelSnap = null; changed(); }, 350);
};

/* la molette marche aussi quand la souris est sur une étiquette (le nom d'un personnage, d'un objet) ou sur un anneau :
   le geste est transmis à l'image 3D, au même endroit */
document.addEventListener('wheel', e => {
  if(!R.canvas || e.target === R.canvas || !e.target.closest || !e.target.closest('#handles')) return;
  e.preventDefault(); e.stopPropagation();
  R.canvas.dispatchEvent(new WheelEvent('wheel', { deltaX:e.deltaX, deltaY:e.deltaY, deltaZ:e.deltaZ, deltaMode:e.deltaMode, clientX:e.clientX, clientY:e.clientY, ctrlKey:e.ctrlKey, shiftKey:e.shiftKey, altKey:e.altKey, bubbles:true, cancelable:true }));
}, { capture:true, passive:false });
