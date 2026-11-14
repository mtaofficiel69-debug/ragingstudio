/* =====================================================================
   RAGING BOARD — LES OBJETS SE TOURNENT DANS TOUS LES SENS
   ---------------------------------------------------------------------
   Comme un membre de personnage : trois anneaux autour de l'objet choisi
   (vert : tourner ; rouge : cabrer, l'avant se lève, comme une moto sur sa
   roue arrière ; bleu : pencher sur le côté), et les mêmes réglages en
   curseurs dans « Accessoires ».
===================================================================== */
const VGZ = { drag:null, hot:-1, view:null };
const VGZ_DEF = [
  { k:'ry', col:'#30A46C', fr:'Tourner', en:'Turn', min:-180, max:180 },
  { k:'rx', col:'#E5484D', fr:'Cabrer', en:'Pitch', min:-90, max:90 },
  { k:'rz', col:'#3E7BFA', fr:'Pencher', en:'Roll', min:-90, max:90 },
];
const vgzWrap = a => { a = ((a + 180) % 360 + 360) % 360 - 180; return a === -180 ? 180 : a; };
function vgzSet(v, k, val){
  if(k === 'ry') v.ry = Math.round(vgzWrap(val) * 2) / 2;
  else { const d = VGZ_DEF.find(x => x.k === k); val = Math.round(clamp(val, d.min, d.max) * 2) / 2; if(val) v[k] = val; else delete v[k]; }
}
function vgzSel(){ const sh = shot(), v = (sh.vehicles || [])[S.veh]; return S.veh >= 0 && v && !S.sel ? v : null; }
function vgzAxes(v){
  const [hx, hz, h] = itemSize(v), M = vehMat(v), c = M4.apply(M, [0, h * 0.5, 0]), a = (v.ry || 0) * D2R;
  return { c, size:Math.max(hx, hz, h * 0.6), axes:[
    [0, 1, 0],
    M4.apply(M4.ry(a), [1, 0, 0]),
    M4.apply(M4.mul(M4.ry(a), M4.rx(-(v.rx || 0) * D2R)), [0, 0, 1]),
  ].map(gzNorm) };
}
function vgzDraw(sh, vp, w, h){
  const host = document.getElementById('handles'); if(!host) return;
  let svg = host.querySelector('#vgizmo');
  const v = vgzSel(), show = GZ.on && v && !S.final && !S.play && !S.rec;
  if(!show){ if(svg) svg.remove(); VGZ.view = null; return; }
  if(!svg){ svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.id = 'vgizmo'; svg.setAttribute('class', 'gizmo'); host.appendChild(svg); }
  const r = R.canvas.getBoundingClientRect(), k = r.width / w;
  const proj = p => { const cx = vp[0] * p[0] + vp[4] * p[1] + vp[8] * p[2] + vp[12], cy = vp[1] * p[0] + vp[5] * p[1] + vp[9] * p[2] + vp[13], cw = vp[3] * p[0] + vp[7] * p[1] + vp[11] * p[2] + vp[15];
    return cw <= 0.02 ? null : [(cx / cw + 1) / 2 * w * k, (1 - cy / cw) / 2 * h * k]; };
  const { c, size, axes } = vgzAxes(v), eye = camEye(viewCam(sh)), vd = gzNorm(gzSub(c, eye)), C = proj(c);
  if(!C){ svg.innerHTML = ''; VGZ.view = null; return; }
  let right = gzCross(vd, [0, 1, 0]); if(gzLen(right) < 1e-3) right = [1, 0, 0]; right = gzNorm(right);
  const Q = proj([c[0] + right[0], c[1] + right[1], c[2] + right[2]]), ppm = Q ? Math.hypot(Q[0] - C[0], Q[1] - C[1]) : 100;
  // assez grand pour entourer l'objet, mais toujours lisible à l'écran
  const Rw = clamp(size * 0.9, 50 / Math.max(ppm, 1), 150 / Math.max(ppm, 1));
  VGZ.view = { proj, axes, c, Rw };
  svg.setAttribute('width', r.width); svg.setAttribute('height', r.height); svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
  let out = '';
  axes.forEach((A, n) => {
    let u = gzCross(A, Math.abs(A[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]); u = gzNorm(u); const vv = gzCross(A, u);
    let front = '', back = '', hit = '', prev = null, prevF = null;
    for(let s = 0; s <= 64; s++){
      const t = s / 64 * Math.PI * 2, p = [0, 1, 2].map(i => c[i] + (u[i] * Math.cos(t) + vv[i] * Math.sin(t)) * Rw);
      const q = proj(p); if(!q){ prev = null; continue; }
      const isF = gzDot(gzSub(p, c), vd) <= 0.0001;
      if(prev){ const seg = `M${prev[0].toFixed(1)} ${prev[1].toFixed(1)}L${q[0].toFixed(1)} ${q[1].toFixed(1)}`; if(isF && prevF) front += seg; else back += seg; hit += seg; }
      prev = q; prevF = isF;
    }
    const on = VGZ.hot === n || (VGZ.drag && VGZ.drag.n === n);
    out += `<g class="gz-ring ${on ? 'on' : ''}" style="--gc:${VGZ_DEF[n].col}"><path class="gz-back" d="${back}"/><path class="gz-front" d="${front}"/><path class="gz-hit vgz-hit" d="${hit}" data-n="${n}"/></g>`;
  });
  if(VGZ.drag){ const D = VGZ_DEF[VGZ.drag.n], val = v[D.k] || 0, top = Math.min(...[0, 1, 2].map(i => C[1])) - Rw * ppm - 18;
    out += `<g class="gz-tip" transform="translate(${C[0].toFixed(1)} ${Math.max(16, top).toFixed(1)})"><rect x="-58" y="-13" width="116" height="24" rx="12"/><text y="4">${esc(L(D.fr, D.en))} · ${Math.round(val)}°</text></g>`; }
  svg.innerHTML = out;
}
const vgzPlaceBase = placeHandles;
placeHandles = function(sh, vp, w, h){ vgzPlaceBase.apply(this, arguments); try{ vgzDraw(sh, vp, w, h); }catch(err){ console.warn(err); } };
document.addEventListener('pointerover', e => { const g = e.target.closest && e.target.closest('.vgz-hit'); const n = g ? +g.dataset.n : -1; if(n !== VGZ.hot && !VGZ.drag){ VGZ.hot = n; requestRender(); } });
document.addEventListener('pointerdown', e => {
  const g = e.target.closest && e.target.closest('.vgz-hit'); if(!g || !VGZ.view) return;
  const v = vgzSel(); if(!v) return;
  e.preventDefault(); e.stopPropagation();
  const n = +g.dataset.n, A = VGZ.view.axes[n], D = VGZ_DEF[n], rc = R.canvas.getBoundingClientRect(), mx = e.clientX - rc.left, my = e.clientY - rc.top, c = VGZ.view.c, Rw = VGZ.view.Rw;
  let u = gzCross(A, Math.abs(A[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]); u = gzNorm(u); const vv = gzCross(A, u);
  let best = null; for(let s = 0; s < 64; s++){ const t = s / 64 * Math.PI * 2, p = [0, 1, 2].map(i => c[i] + (u[i] * Math.cos(t) + vv[i] * Math.sin(t)) * Rw);
    const q = VGZ.view.proj(p); if(q){ const d = Math.hypot(q[0] - mx, q[1] - my); if(!best || d < best.d) best = { d, p, q }; } }
  if(!best) return;
  // le point attrapé, dans le repère de l'objet : on regarde où il part à l'écran quand on tourne d'un degré
  const loc = M4.apply(M4.invert(vehMat(v)), best.p), v1 = Object.assign({}, v); v1[D.k] = (v[D.k] || 0) + 1;
  const q1 = VGZ.view.proj(M4.apply(vehMat(v1), loc)); if(!q1) return;
  let s1 = [q1[0] - best.q[0], q1[1] - best.q[1]];
  if(Math.hypot(...s1) < 0.6){ const l = Math.hypot(...s1) || 1; s1 = [s1[0] / l * 0.6, s1[1] / l * 0.6]; }
  VGZ.drag = { n, k:D.k, x0:mx, y0:my, s1, v0:v[D.k] || 0, snap:snapshot(), veh:S.veh, moved:false };
  try{ g.setPointerCapture(e.pointerId); }catch(err){}
  requestRender();
}, true);
document.addEventListener('pointermove', e => {
  const d = VGZ.drag; if(!d) return;
  const sh = shot(), v = (sh.vehicles || [])[d.veh]; if(!v) return;
  const rc = R.canvas.getBoundingClientRect(), mx = e.clientX - rc.left, my = e.clientY - rc.top, s2 = d.s1[0] * d.s1[0] + d.s1[1] * d.s1[1];
  vgzSet(v, d.k, d.v0 + ((mx - d.x0) * d.s1[0] + (my - d.y0) * d.s1[1]) / s2); d.moved = true;
  syncRiders(sh); R.pickDirty = true; vgzSync(); requestRender();
}, true);
document.addEventListener('pointerup', () => {
  const d = VGZ.drag; if(!d) return; VGZ.drag = null;
  if(d.moved){ pushUndo(d.snap); changed(); } else requestRender();
}, true);

/* ---------- les mêmes réglages, en curseurs, dans « Accessoires » ---------- */
function vgzRows(v){
  return VGZ_DEF.map(D => `<label class="fr"><span class="fl">${L(D.fr, D.en)}</span><input type="range" data-act="vehRot" data-k="${D.k}" min="${D.min}" max="${D.max}" step="1" value="${v[D.k] || 0}"><b class="fv">${Math.round(v[D.k] || 0)}°</b></label>`).join('');
}
function vgzSync(){ const v = vgzSel() || (shot().vehicles || [])[S.veh]; if(!v) return;
  document.querySelectorAll('input[data-act="vehRot"]').forEach(t => { if(t === document.activeElement) return; t.value = v[t.dataset.k] || 0; const b = t.nextElementSibling; if(b) b.textContent = Math.round(v[t.dataset.k] || 0) + '°'; }); }
const vgzCarBase = PANEL_HTML.car;
PANEL_HTML.car = function(){
  const h = vgzCarBase.call(this), sh = shot(), vs = sh.vehicles || [], k = vs[S.veh] ? S.veh : vs.length ? 0 : -1, v = vs[k]; if(!v) return h;
  const i = h.indexOf('data-act="vehAlt"'); if(i < 0) return h;
  const j = h.indexOf('</label>', i); if(j < 0) return h;
  const sec = `${lbl(L('Orientation', 'Orientation'))}${vgzRows(v)}<div class="gz-row"><button class="btn btn-sm gz-btn ${GZ.on ? 'on' : ''}" data-act="gzTog" aria-pressed="${GZ.on}" title="${esc(L('Afficher les anneaux autour de l’objet choisi, pour le tourner à la souris', 'Show the rings around the chosen object, to turn it with the mouse'))}">${typeof gzIco === 'function' ? gzIco() : ''}${L('Anneaux', 'Rings')}</button><button class="btn btn-sm" data-act="vehFlat" ${v.rx || v.rz ? '' : 'disabled'}>${L('Remettre à plat', 'Level it')}</button></div>`;
  return h.slice(0, j + 8) + sec + h.slice(j + 8);
};
ACT.vehFlat = () => { const v = (shot().vehicles || [])[S.veh < 0 ? 0 : S.veh]; if(!v) return; edit(() => { delete v.rx; delete v.rz; syncRiders(shot()); R.pickDirty = true; }); };
let vgzSnap = null;
document.addEventListener('input', e => {
  const t = e.target; if(!t.dataset || t.dataset.act !== 'vehRot') return;
  const sh = shot(), v = (sh.vehicles || [])[S.veh < 0 ? 0 : S.veh]; if(!v) return;
  if(!vgzSnap) vgzSnap = snapshot();
  vgzSet(v, t.dataset.k, +t.value); const b = t.nextElementSibling; if(b) b.textContent = Math.round(v[t.dataset.k] || 0) + '°';
  syncRiders(sh); R.pickDirty = true; requestRender();
});
document.addEventListener('change', e => {
  const t = e.target; if(!t.dataset || t.dataset.act !== 'vehRot' || !vgzSnap) return;
  pushUndo(vgzSnap); vgzSnap = null; changed();
});
