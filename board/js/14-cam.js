/* =====================================================================
   RAGING BOARD — UNE SEULE CAMÉRA POUR TOUS LES LIEUX
   ---------------------------------------------------------------------
   Tourner, se décaler, zoomer : les trois gestes de la souris passent par
   le même mécanisme, qui ne dépend d'aucun lieu en particulier (rien à
   régler map par map, les lieux à venir en profitent tout seuls).

   · Tourner (clic gauche) : la caméra tourne autour de ce qu'on a attrapé
     sous la souris — ce point ne bouge pas à l'écran. Jamais autour d'un
     point perdu à 60 m (c'est ce qui envoyait la caméra valser).
   · Se décaler (clic droit, molette enfoncée, Maj) : ce qu'on a attrapé
     reste sous la souris, à la même vitesse qu'elle, de près comme de loin.
   · Zoomer (molette) : vers ce qui est sous la souris (voir 13-zoom.js).

   Une seule règle pour les obstacles : en « Murs solides », l'objectif
   glisse le long des murs sans les traverser ; il n'est jamais déplacé
   d'un coup ailleurs (plus de « téléportation »). En « Caméra libre »,
   rien ne l'arrête.
===================================================================== */
const CAMG = { down:null, piv:null, depth:null, dot:null };
const camBasis = (yawDeg, pitDeg) => { const y = yawDeg * D2R, p = pitDeg * D2R, back = [Math.cos(p) * Math.sin(y), -Math.sin(p), Math.cos(p) * Math.cos(y)], right = [Math.cos(y), 0, -Math.sin(y)];
  return { back, right, up:[back[1] * right[2] - back[2] * right[1], back[2] * right[0] - back[0] * right[2], back[0] * right[1] - back[1] * right[0]] }; };

/* poser l'objectif à un endroit, avec un angle : le seul passage obligé de tous les gestes */
function camPut(c, eye, yaw, pitch, focus){
  const e0 = camEyeRaw(c); let e = eye.slice();
  e[1] = clamp(e[1], 0.03, 45);
  // l'objectif reste toujours dans le lieu : il glisse le long des murs, des sols, des plafonds, sans jamais les traverser.
  // S'il se trouve hors du lieu (un ancien plan, un cadrage tout prêt), il ne peut qu'y revenir : jamais s'en éloigner davantage.
  try{ const P = physScene(shot().set);
    if(P){ const ok = q => physHit(P, q) < 0 && physIn(P, q) && Math.abs(physY(P, q) - q[1]) < 1e-6;
      let a = e0.slice(); if(!ok(a)){ a[1] = physY(P, a); }
      if(ok(a)) e = physMove(P, a, e);
      else if(!ok(e)){ const s = camSafe(clone(c), shot().set, true), es = camEyeRaw(s); e = ok(es) ? es : e0; }
    }
  }catch(err){}
  pitch = clamp(pitch, -88, 85);
  const B = camBasis(yaw, pitch); let d = clamp(focus, 0.05, DIST_MAX);
  // le point visé reste dans les limites permises : on raccourcit la visée plutôt que de déplacer la caméra
  const fy = -B.back[1]; if(fy < -1e-6) d = Math.min(d, Math.max(0.05, (e[1] + 0.45) / -fy)); if(fy > 1e-6) d = Math.min(d, Math.max(0.05, (29.9 - e[1]) / fy));
  [0, 2].forEach(k => { const f = -B.back[k]; if(Math.abs(f) > 1e-6){ const lim = (f > 0 ? 149.5 - e[k] : e[k] + 149.5) / Math.abs(f); if(lim > 0.05) d = Math.min(d, lim); } });
  c.yaw = yaw; c.pitch = pitch; c.dist = d; c.tx = e[0] - B.back[0] * d; c.ty = e[1] - B.back[1] * d; c.tz = e[2] - B.back[2] * d;
  keepCam(c); if(typeof camWant === 'function') camWant(c);
}

/* ce qu'on attrape sous la souris au début d'un geste (jamais à plus de 10 m : la rotation reste douce) */
function camGrab(){
  const c = shot().cam, eye = camEyeRaw(c), B = camBasis(c.yaw, c.pitch), dn = CAMG.down;
  let P = null;
  if(dn){ try{ const rc = R.canvas.getBoundingClientRect(), k = R.canvas.width / rc.width, x = (dn[0] - rc.left) * k, y = (dn[1] - rc.top) * k;
    const Z = zoomPoint(x, y, pickAt(x, y)), D = Math.min(Z.D, 10); P = [eye[0] + Z.rd[0] * D, eye[1] + Z.rd[1] * D, eye[2] + Z.rd[2] * D]; }catch(err){} }
  if(!P){ const d = clamp(c.dist, 0.5, 10); P = [eye[0] - B.back[0] * d, eye[1] - B.back[1] * d, eye[2] - B.back[2] * d]; }
  CAMG.piv = P; CAMG.depth = clamp(-((P[0] - eye[0]) * B.back[0] + (P[1] - eye[1]) * B.back[1] + (P[2] - eye[2]) * B.back[2]), 0.3, 60);
}
// un petit repère, le temps du geste : le point autour duquel on tourne
function camDot(on){
  const host = document.getElementById('handles'); if(!host) return;
  let d = host.querySelector('.cam-dot');
  if(!on || !CAMG.down){ if(d) d.remove(); return; }
  if(!d){ d = document.createElement('i'); d.className = 'cam-dot'; host.appendChild(d); }
  const rc = R.canvas.getBoundingClientRect(); d.style.left = (CAMG.down[0] - rc.left) + 'px'; d.style.top = (CAMG.down[1] - rc.top) + 'px';
}
document.addEventListener('pointerdown', e => { if(R.canvas && e.target === R.canvas){ CAMG.down = [e.clientX, e.clientY]; CAMG.piv = null; ORB.yaw = ORB.pitch = ORB.px = ORB.py = 0; } }, true);
document.addEventListener('pointerup', () => { setTimeout(() => { CAMG.piv = null; camDot(false); }, 0); }, true);

/* tourner et se décaler : remplace l'ancien mécanisme (même douceur : la caméra rattrape la souris image par image) */
orbStep = function(all){
  ORB.raf = 0; const c = shot().cam, k = all === true ? 1 : 0.5;
  const dy = ORB.yaw * k, dp = ORB.pitch * k, px = ORB.px * k, py = ORB.py * k;
  const turn = Math.abs(dy) + Math.abs(dp) > 0.005, slide = Math.abs(px) + Math.abs(py) > 0.02;
  if((turn || slide) && !CAMG.piv) camGrab();
  if(turn){
    const eye = camEyeRaw(c), B0 = camBasis(c.yaw, c.pitch), P = CAMG.piv, v = [eye[0] - P[0], eye[1] - P[1], eye[2] - P[2]];
    const a = v[0] * B0.right[0] + v[1] * B0.right[1] + v[2] * B0.right[2], b = v[0] * B0.up[0] + v[1] * B0.up[1] + v[2] * B0.up[2], d = v[0] * B0.back[0] + v[1] * B0.back[1] + v[2] * B0.back[2];
    const yaw = c.yaw - dy, pit = clamp(c.pitch + dp, -88, 85), B1 = camBasis(yaw, pit);
    camPut(c, [0, 1, 2].map(i => P[i] + a * B1.right[i] + b * B1.up[i] + d * B1.back[i]), yaw, pit, Math.max(0.3, d));
    camDot(true);
  }
  if(slide){
    const eye = camEyeRaw(c), B = camBasis(c.yaw, c.pitch), s = CAMG.depth * Math.tan(fovOf(c.lens) / 2) * 2 / (R.canvas.getBoundingClientRect().height || 500);
    camPut(c, [0, 1, 2].map(i => eye[i] - B.right[i] * px * s + B.up[i] * py * s), c.yaw, c.pitch, c.dist);
  }
  ORB.yaw -= dy; ORB.pitch -= dp; ORB.px -= px; ORB.py -= py; requestRender();
  if(Math.abs(ORB.yaw) + Math.abs(ORB.pitch) > 0.02 || Math.abs(ORB.px) + Math.abs(ORB.py) > 0.1) ORB.raf = requestAnimationFrame(orbStep);
  else { ORB.yaw = ORB.pitch = ORB.px = ORB.py = 0; }
};

/* ---------- La caméra ne sort plus du lieu ----------
   Le bouton « Caméra libre » est retiré : sans aucune limite, la caméra passait derrière les décors (on voyait l'envers
   des murs, le vide) et pouvait se perdre hors du lieu. Il reste une seule caméra, fluide, qui reste dans le lieu. */
S.freeCam = false; try{ lsSet('raging3d_freecam', '0'); }catch(err){}
ACT.freeCam = () => {};
const camNavBase = renderNav;
renderNav = function(){
  camNavBase.apply(this, arguments);
  const el = document.getElementById('nav'); if(!el) return;
  el.querySelectorAll('.dk-free').forEach(b => { const p = b.previousElementSibling; if(p && p.classList.contains('dk-sep') && !(b.nextElementSibling && b.nextElementSibling.classList.contains('dk-help'))) p.remove(); b.remove(); });
};

/* ---------- Double-clic : viser ce qu'on montre ----------
   Avant, le double-clic visait le point du SOL dans l'axe de la souris : sur un objet ou un mur, ce point était loin derrière,
   hors du lieu. Maintenant, il vise la surface exacte sous la souris (objet, meuble, mur, sol) et la caméra s'en approche
   en restant dans le lieu. Sur un personnage : comme avant, il est recadré. */
document.addEventListener('dblclick', e => {
  if(!R.canvas || e.target !== R.canvas || S.rec || S.play) return;
  const [x, y] = canvasXY(e); if(pickAt(x, y)) return;          // un personnage : l'ancien recadrage
  e.preventDefault(); e.stopPropagation();
  const s = shot(), c = s.cam, before = clone(c);
  let Z; try{ Z = zoomPoint(x, y, null); }catch(err){ return; }
  const D = Math.min(Z.D, 40), P = [Z.eye[0] + Z.rd[0] * D, Z.eye[1] + Z.rd[1] * D, Z.eye[2] + Z.rd[2] * D];
  const B = camBasis(c.yaw, c.pitch), d = clamp(D * 0.6, 0.8, 6);
  const snap = snapshot();
  // par petites étapes : l'objectif glisse le long des murs jusqu'à sa place (il ne peut pas les traverser)
  const goal = [P[0] + B.back[0] * d, P[1] + B.back[1] * d, P[2] + B.back[2] * d];
  for(let k = 0; k < 6; k++){ const e0 = camEyeRaw(c), m = [goal[0] - e0[0], goal[1] - e0[1], goal[2] - e0[2]], L0 = Math.hypot(m[0], m[1], m[2]); if(L0 < 0.02) break;
    const f = Math.min(1, 12 / L0); camPut(c, [e0[0] + m[0] * f, e0[1] + m[1] * f, e0[2] + m[2] * f], c.yaw, c.pitch, d); }
  pushUndo(snap); if(typeof startTween === 'function') startTween(before); changed();
}, true);
