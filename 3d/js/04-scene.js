/* =====================================================================
   RAGING 3D — LA PLANCHE DE STORYBOARD
   Un projet = une suite de plans. Chaque plan est une image arrêtée :
   un lieu, un ou deux personnages posés, un cadrage, et ses infos
   (valeur, angle, mouvement, description). Un nouveau plan reprend le
   précédent : on ajuste, on ne recommence pas.
===================================================================== */
const S = {
  doc:null,           // { v:2, title, shots:[{ id, set, chars, cam, info:{ cap, size, angle, move, dur } }] }
  i:0,                // le plan affiché
  sel:null, hover:null, // { c:personnage, j:articulation }
  target:0,           // le personnage visé par le cadrage rapide
  grid:true,          // grille des tiers
  rec:null, undo:[], redo:[],
};
const clone = o => JSON.parse(JSON.stringify(o));
const LENSES = [24, 35, 50, 85];
const fovOf = lens => 2 * Math.atan(12 / lens);
const uidS = () => 's' + Math.random().toString(36).slice(2, 9);
const shot = () => S.doc.shots[S.i];

function charFromSpawn(i, def){
  const sp = def.spawn[i] || def.spawn[0];
  const ch = newChar(i, sp);
  if(sp.pose) applyPose(ch, sp.pose);
  if(sp.y != null) ch.root.y = sp.y;
  return ch;
}
function newShot(setId){
  const def = SET_DEF[setId];
  return { id:uidS(), set:setId, chars:[charFromSpawn(0, def)], cam:clone(def.cam), info:{ cap:'', size:'pe', angle:'neu', move:'fix', dur:2 } };
}
function newDoc(setId){ return { v:2, title:L('Mon storyboard', 'My storyboard'), shots:[newShot(setId || 'garage')] }; }

/* ---------- Sauvegarde automatique (dans le navigateur) ---------- */
let _saveT = 0;
function save(){ clearTimeout(_saveT); _saveT = setTimeout(() => lsSet(LS_SCENE, JSON.stringify({ doc:S.doc, i:S.i })), 250); }
function load(){
  try{
    const o = JSON.parse(lsGet(LS_SCENE) || 'null'); if(!o) return false;
    // version 2 : la planche ; version 1 (la toute première) : chaque clé devient un plan
    const d = o.doc || o;
    if(d.v === 2 && Array.isArray(d.shots) && d.shots.length && d.shots.every(s => SET_DEF[s.set])){ S.doc = d; S.i = clamp(o.i || 0, 0, d.shots.length - 1); return true; }
    if(d.v === 1 && SET_DEF[d.set] && Array.isArray(d.keys) && d.keys.length){
      S.doc = { v:2, title:d.title, shots:d.keys.map(k => ({ id:uidS(), set:d.set, chars:k.chars, cam:k.cam, info:{ cap:'', size:'pe', angle:'neu', move:'fix', dur:2 } })) };
      S.i = 0; return true;
    }
  }catch(e){}
  return false;
}

/* ---------- Annuler / rétablir ---------- */
function snapshot(){ return JSON.stringify({ doc:S.doc, i:S.i }); }
function pushUndo(snap){ S.undo.push(snap || snapshot()); if(S.undo.length > 80) S.undo.shift(); S.redo = []; }
function restore(str){ const o = JSON.parse(str); S.doc = o.doc; S.i = clamp(o.i, 0, S.doc.shots.length - 1); S.sel = null; THUMBS.clear(); changed(true); }
function undo(){ if(!S.undo.length) return; S.redo.push(snapshot()); restore(S.undo.pop()); }
function redo(){ if(!S.redo.length) return; S.undo.push(snapshot()); restore(S.redo.pop()); }
/* après chaque changement : on enregistre, on redessine, on met à jour la vignette */
function changed(all){
  save(); if(all){ renderUI(); } else { renderSide(); renderShotPanel(); renderTools(); }
  requestRender(); thumbLater(S.i, all);
}
/* un changement fait d'un coup (bouton) : annulable */
function edit(fn){ pushUndo(); fn(); changed(); }

/* ---------- Les plans ---------- */
function goShot(i){ if(i === S.i || !S.doc.shots[i]) return; S.i = i; S.sel = null; S.hover = null; S.target = 0; save(); renderUI(); requestRender(); }
function addShot(){
  pushUndo();
  const n = clone(shot()); n.id = uidS(); n.info.cap = '';
  S.doc.shots.splice(S.i + 1, 0, n); S.i++; S.sel = null; changed(true);
  toast(L('Nouveau plan : il reprend le précédent. Change le cadrage ou la pose.', 'New shot: it starts from the previous one. Change the framing or the pose.'));
}
/* contrechamp : le plan suivant, vu par-dessus l'épaule de l'autre personnage */
function addReverse(){
  const s = shot(); if(s.chars.length < 2) return;
  pushUndo();
  const n = clone(s); n.id = uidS(); n.info = Object.assign({}, s.info, { cap:'', size:'am', angle:'neu' });
  const front = S.target === 0 ? 1 : 0, back = 1 - front;
  n.cam = frameOTS(n.chars[front], n.chars[back], s.cam.lens >= 50 ? s.cam.lens : 50);
  S.doc.shots.splice(S.i + 1, 0, n); S.i++; S.target = front; S.sel = null; changed(true);
}
function dupShot(){ pushUndo(); const n = clone(shot()); n.id = uidS(); S.doc.shots.splice(S.i + 1, 0, n); S.i++; changed(true); }
function delShot(){
  if(S.doc.shots.length < 2){ toast(L('Il faut garder au moins un plan.', 'You need to keep at least one shot.')); return; }
  pushUndo(); S.doc.shots.splice(S.i, 1); S.i = Math.min(S.i, S.doc.shots.length - 1); S.sel = null; THUMBS.clear(); changed(true);
}
function moveShot(d){
  const j = S.i + d; if(j < 0 || j >= S.doc.shots.length) return;
  pushUndo(); const a = S.doc.shots; [a[S.i], a[j]] = [a[j], a[S.i]]; S.i = j; changed(true);
}

/* ---------- Personnages, lieu, poses ---------- */
function addChar(){
  const s = shot(); if(s.chars.length >= 2) return;
  edit(() => { s.chars.push(charFromSpawn(1, SET_DEF[s.set])); S.sel = { c:1, j:'pelvis' }; S.target = 1; });
}
function removeChar(){
  const s = shot(); if(s.chars.length < 2) return;
  edit(() => { s.chars.length = 1; if(S.sel && S.sel.c === 1) S.sel = null; S.target = 0; });
}
function setPlace(id){
  const s = shot(); if(!SET_DEF[id] || id === s.set) return;
  edit(() => { const def = SET_DEF[id]; s.set = id; s.chars = s.chars.map((_, i) => charFromSpawn(i, def)); s.cam = clone(def.cam); s.info.size = 'pe'; });
}
function setPose(pid){
  const s = shot(), c = S.sel ? S.sel.c : S.target, ch = s.chars[c]; if(!ch) return;
  edit(() => { const keep = { x:ch.root.x, z:ch.root.z, ry:ch.root.ry }; applyPose(ch, pid); Object.assign(ch.root, keep); });
}
function resetPart(){
  if(!S.sel) return;
  edit(() => { const ch = shot().chars[S.sel.c]; ch.j[S.sel.j] = blankPose()[S.sel.j]; });
}
function faceThem(){ const s = shot(); if(s.chars.length < 2) return; edit(() => faceEachOther(s.chars)); }
/* le personnage regarde l'autre (il tourne la tête et un peu le torse) */
function lookAtOther(){
  const s = shot(); if(s.chars.length < 2) return;
  const c = S.sel ? S.sel.c : S.target, me = s.chars[c], other = s.chars[1 - c];
  edit(() => {
    const want = Math.atan2(other.root.x - me.root.x, other.root.z - me.root.z) / D2R;
    let d = ((want - me.root.ry) % 360 + 540) % 360 - 180;
    const chest = clamp(d * 0.3, -35, 35); d -= chest;
    me.j.chest[1] = chest; me.j.head[1] = clamp(d, -80, 80);
  });
}

/* ---------- Cadrage rapide ---------- */
function frameSize(size){
  const s = shot(), ch = s.chars[S.target] || s.chars[0];
  edit(() => {
    if(size === 'am'){ if(s.chars.length > 1) s.cam = frameOTS(ch, s.chars[1 - S.target], 50); }
    else if(size === '2p'){ if(s.chars.length > 1) s.cam = frameTwo(s.chars[0], s.chars[1], 35, s.cam.yaw); }
    else if((size === 'pe' || size === 'pg') && s.chars.length > 1){ s.cam = frameTwo(s.chars[0], s.chars[1], size === 'pg' ? 24 : 28, s.cam.yaw, true); if(size === 'pg') s.cam.dist *= 1.8; }
    else s.cam = frameOn(ch, size, s.info.angle, null);
    s.info.size = size;
    if(size === 'am' || size === '2p'){ s.info.angle = 'neu'; s.cam.roll = 0; }
  });
}
function frameAngle(angle){
  const s = shot(), ch = s.chars[S.target] || s.chars[0];
  edit(() => {
    s.info.angle = angle;
    if(angle === 'deb'){ s.cam.roll = s.cam.roll ? 0 : 14; return; }
    s.cam.roll = 0;
    if(FRAMES[s.info.size]) s.cam = Object.assign(frameOn(ch, s.info.size, angle, s.cam.lens), { roll:0 });
    else { const A = ANGLES[angle]; if(A) s.cam.pitch = A.pitch; }
  });
}
function setLens(l){
  const s = shot();
  edit(() => {
    // on garde la même taille de sujet à l'image : le recul suit la focale
    s.cam.dist = clamp(s.cam.dist * l / s.cam.lens, 0.35, 28); s.cam.lens = l;
  });
}

/* ---------- Caméra ---------- */
function camEye(c){
  const y = c.yaw * D2R, p = c.pitch * D2R;
  return [c.tx + c.dist * Math.cos(p) * Math.sin(y), c.ty - c.dist * Math.sin(p), c.tz + c.dist * Math.cos(p) * Math.cos(y)];
}
function viewProj(c, aspect){
  const e = camEye(c), r = (c.roll || 0) * D2R;
  // le débullé tourne l'image autour de l'axe de la caméra
  return M4.mul(M4.persp(fovOf(c.lens), aspect, 0.05, 80), M4.mul(M4.rz(r), M4.lookAt(e, [c.tx, c.ty, c.tz], [0, 1, 0])));
}

/* ---------- Rendu ---------- */
const R = { canvas:null, sets:{}, parts:{}, blob:null, raf:0 };
function setMesh(id){ if(!R.sets[id]) R.sets[id] = GL.mesh(setGeo(id)); return R.sets[id]; }
function initMeshes(){
  JOINTS.forEach(J => R.parts[J.id] = GL.mesh(partGeo(J.id)));
  const g = geo(), C = [0.08, 0.09, 0.11];
  for(let i = 0; i < 16; i++){ const a = i / 16 * Math.PI * 2, b = (i + 1) / 16 * Math.PI * 2; tri(g, [0, 0, 0], [Math.sin(b) * 0.36, 0, Math.cos(b) * 0.36], [Math.sin(a) * 0.36, 0, Math.cos(a) * 0.36], C); }
  R.blob = GL.mesh(g);
}
function requestRender(){ if(R.raf || S.rec) return; R.raf = requestAnimationFrame(() => { R.raf = 0; drawFrame(); }); }
const BG = hexRGB('#DCE0E7'), GREEN = hexRGB('#22A06B'), GREEN_L = hexRGB('#7FD1A8');
/* dessine un plan ; « clean » : sans la sélection en vert (exports, vignettes) */
function drawFrame(sh, w, h, clean){
  const gl = GL.gl; if(!gl) return;
  sh = sh || shot(); w = w || R.canvas.width; h = h || R.canvas.height;
  GL.begin(w, h, viewProj(sh.cam, w / h), BG);
  GL.draw(setMesh(sh.set), { vc:true });
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
  const ground = sh.set === 'taxi' ? 0.305 : 0.006;
  sh.chars.forEach(ch => GL.draw(R.blob, { m:M4.trans(ch.root.x, ground, ch.root.z), flat:true, a:0.22, col:[0.06, 0.07, 0.09] }));
  gl.depthMask(true); gl.disable(gl.BLEND);
  sh.chars.forEach((ch, c) => {
    const M = charMatrices(ch), col = hexRGB(CHAR_LOOK[c].col);
    for(const J of JOINTS){
      let tint = null, k = 0;
      if(!clean && S.sel && S.sel.c === c && S.sel.j === J.id){ tint = GREEN; k = 0.72; }
      else if(!clean && S.hover && S.hover.c === c && S.hover.j === J.id){ tint = GREEN_L; k = 0.45; }
      GL.draw(R.parts[J.id], { m:M[J.id], col, tint, tintK:k });
    }
  });
}
/* vignettes de la planche : petites images, refaites seulement quand un plan change */
const THUMBS = new Map();
function thumbOf(i){
  const sh = S.doc.shots[i]; if(!sh || !GL.gl) return '';
  const key = sh.id + '|' + JSON.stringify([sh.set, sh.chars, sh.cam]);
  const t = THUMBS.get(sh.id); if(t && t.key === key) return t.url;
  const ow = R.canvas.width, oh = R.canvas.height;
  R.canvas.width = 320; R.canvas.height = 180; drawFrame(sh, 320, 180, true);
  const url = R.canvas.toDataURL('image/jpeg', 0.8);
  R.canvas.width = ow; R.canvas.height = oh;
  THUMBS.set(sh.id, { key, url }); requestRender();
  return url;
}
let _thumbT = 0;
function thumbLater(i, all){
  clearTimeout(_thumbT);
  _thumbT = setTimeout(() => {
    if(all){ renderStrip(); return; }
    const card = document.querySelector(`.shot-card[data-i="${i}"]`); if(!card) return;
    card.querySelector('img').src = thumbOf(i);
    card.querySelector('.sc-t b').textContent = shotLabel('size', S.doc.shots[i].info.size, true);
  }, all ? 0 : 200);
}

/* ce qu'il y a sous la souris : une partie du corps, ou rien */
function pickAt(px, py){
  const gl = GL.gl; if(!gl) return null;
  const sh = shot(), sc = 0.5, w = Math.max(1, Math.round(R.canvas.width * sc)), h = Math.max(1, Math.round(R.canvas.height * sc));
  GL.beginPick(w, h, viewProj(sh.cam, R.canvas.width / R.canvas.height));
  GL.draw(setMesh(sh.set), { flat:true, col:[0, 0, 0] });
  sh.chars.forEach((ch, c) => {
    const M = charMatrices(ch);
    for(const J of JOINTS){ const id = c * 32 + J.idx + 1; GL.draw(R.parts[J.id], { m:M[J.id], flat:true, col:[id / 255, 0, 0] }); }
  });
  const id = GL.readPick(Math.floor(px * sc), Math.floor(h - 1 - py * sc));
  if(!id) return null;
  const c = Math.floor((id - 1) / 32), J = JOINTS[(id - 1) % 32];
  return J && sh.chars[c] ? { c, j:J.id } : null;
}
/* point du sol (y) sous un pixel de l'écran */
function groundAt(px, py, y){
  const inv = M4.invert(viewProj(shot().cam, R.canvas.width / R.canvas.height));
  const nx = px / R.canvas.width * 2 - 1, ny = 1 - py / R.canvas.height * 2;
  const a = M4.apply(inv, [nx, ny, -1]), b = M4.apply(inv, [nx, ny, 1]);
  const dy = b[1] - a[1]; if(Math.abs(dy) < 1e-6) return null;
  const k = (y - a[1]) / dy; if(k < 0) return null;
  return [a[0] + (b[0] - a[0]) * k, a[2] + (b[2] - a[2]) * k];
}

/* ---------- Souris, doigts ---------- */
const DRAG = { mode:null, x:0, y:0, moved:false, grab:null, pts:new Map(), pinch:0, snap:null };
function canvasXY(e){ const r = R.canvas.getBoundingClientRect(), k = R.canvas.width / r.width; return [(e.clientX - r.left) * k, (e.clientY - r.top) * k]; }
function onDown(e){
  if(S.rec) return;
  R.canvas.setPointerCapture(e.pointerId);
  DRAG.pts.set(e.pointerId, [e.clientX, e.clientY]);
  if(DRAG.pts.size === 1) DRAG.snap = snapshot();
  if(DRAG.pts.size === 2){ const [a, b] = [...DRAG.pts.values()]; DRAG.mode = 'pinch'; DRAG.pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); DRAG.dist0 = shot().cam.dist; return; }
  const [x, y] = canvasXY(e);
  DRAG.x = e.clientX; DRAG.y = e.clientY; DRAG.moved = false;
  const hit = e.button === 0 && !e.shiftKey ? pickAt(x, y) : null;
  if(hit){
    S.sel = hit; S.target = hit.c; DRAG.mode = hit.j === 'pelvis' ? 'move' : 'pose';
    if(DRAG.mode === 'move'){ const ch = shot().chars[hit.c], g = groundAt(x, y, 0); DRAG.grab = g ? [ch.root.x - g[0], ch.root.z - g[1]] : null; }
    renderSide(); renderTools(); renderHint(); requestRender();
  } else DRAG.mode = (e.button === 2 || e.button === 1 || e.shiftKey) ? 'pan' : 'orbit';
}
function onMove(e){
  if(DRAG.pts.has(e.pointerId)) DRAG.pts.set(e.pointerId, [e.clientX, e.clientY]);
  if(!DRAG.mode){ hoverCheck(e); return; }
  const cam = shot().cam;
  if(DRAG.mode === 'pinch'){
    if(DRAG.pts.size < 2) return;
    const [a, b] = [...DRAG.pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
    cam.dist = clamp(DRAG.dist0 * DRAG.pinch / Math.max(d, 1), 0.35, 30); DRAG.moved = true; requestRender(); return;
  }
  const dx = e.clientX - DRAG.x, dy = e.clientY - DRAG.y; DRAG.x = e.clientX; DRAG.y = e.clientY;
  if(Math.abs(dx) + Math.abs(dy) > 0) DRAG.moved = true;
  if(DRAG.mode === 'orbit'){ cam.yaw -= dx * 0.35; cam.pitch = clamp(cam.pitch + dy * 0.3, -88, 85); }
  else if(DRAG.mode === 'pan'){
    const k = cam.dist * 0.0016, y = cam.yaw * D2R;
    cam.tx -= Math.cos(y) * dx * k; cam.tz += Math.sin(y) * dx * k; cam.ty = clamp(cam.ty + dy * k, -0.5, 8);
  }
  else if(DRAG.mode === 'pose'){
    const J = JOINT[S.sel.j], v = shot().chars[S.sel.c].j[J.id], k = 0.5;
    // glisser vers le haut lève ou plie ; vers le côté, la deuxième façon de bouger
    const a0 = J.ax[0], up = (a0[4] === 'Hocher' || a0[4] === 'Pencher') ? dy : -dy;
    v[0] = clamp(v[0] + up * k, a0[2], a0[3]);
    if(J.ax[1]) v[1] = clamp(v[1] + dx * k * (J.ax[1][0] === 'y' ? 1 : -1), J.ax[1][2], J.ax[1][3]);
    renderSide(true);
  }
  else if(DRAG.mode === 'move'){
    const [x, y] = canvasXY(e), g = groundAt(x, y, 0), ch = shot().chars[S.sel.c];
    if(g && DRAG.grab){ ch.root.x = clamp(g[0] + DRAG.grab[0], -12, 12); ch.root.z = clamp(g[1] + DRAG.grab[1], -14, 12); }
  }
  requestRender();
}
function onUp(e){
  DRAG.pts.delete(e.pointerId);
  if(!DRAG.mode || DRAG.pts.size) return;
  const m = DRAG.mode; DRAG.mode = null;
  if(!DRAG.moved){
    if((m === 'orbit' || m === 'pan') && S.sel){ S.sel = null; renderSide(); renderHint(); requestRender(); }
    return;
  }
  pushUndo(DRAG.snap); changed();
}
let _wheelT = 0, _wheelSnap = null;
function onWheel(e){
  e.preventDefault();
  if(!_wheelSnap) _wheelSnap = snapshot();
  const c = shot().cam; c.dist = clamp(c.dist * Math.exp(e.deltaY * 0.0012), 0.35, 30); requestRender();
  clearTimeout(_wheelT); _wheelT = setTimeout(() => { pushUndo(_wheelSnap); _wheelSnap = null; changed(); }, 350);
}
let _hoverT = 0;
function hoverCheck(e){
  const now = performance.now(); if(now - _hoverT < 60) return; _hoverT = now;
  const [x, y] = canvasXY(e), h = pickAt(x, y);
  const same = (h && S.hover && h.c === S.hover.c && h.j === S.hover.j) || (!h && !S.hover);
  R.canvas.style.cursor = h ? 'pointer' : 'grab';
  if(!same){ S.hover = h; requestRender(); renderHint(); }
}
