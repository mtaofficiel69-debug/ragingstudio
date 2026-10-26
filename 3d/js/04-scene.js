/* =====================================================================
   RAGING 3D — SCÈNE, ANIMATION, CAMÉRA
   La scène est une suite de « clés » : à chaque clé, la pose des personnages
   et la place de la caméra. Entre deux clés, tout glisse en douceur.
   Chaque changement est enregistré tout seul à l'instant du curseur.
===================================================================== */
const S = {
  doc:null,          // { v, title, set, dur, keys:[{t, chars, cam}] }
  cur:null,          // ce qu'on voit maintenant : { chars:[...], cam }
  t:0, playing:false, rec:null,
  sel:null, hover:null,   // { c:index du personnage, j:id de l'articulation }
  freeView:false, view:null,  // vue libre : regarder ailleurs sans changer le plan filmé
  undo:[], redo:[],
};
const clone = o => JSON.parse(JSON.stringify(o));
const LENSES = [24, 35, 50, 85];
const fovOf = lens => 2 * Math.atan(12 / lens);

function newDoc(setId){
  const def = SET_DEF[setId || 'garage'];
  const cur = { chars:[charFromSpawn(0, def)], cam:clone(def.cam) };
  return { doc:{ v:1, title:L('Ma scène', 'My scene'), set:setId || 'garage', dur:5, keys:[{ t:0, chars:clone(cur.chars), cam:clone(cur.cam) }] }, cur };
}
function charFromSpawn(i, def){
  const sp = def.spawn[i] || def.spawn[0];
  const ch = newChar(i, sp);
  if(sp.pose) applyPose(ch, sp.pose);
  if(sp.y != null) ch.root.y = sp.y;
  return ch;
}

/* ---------- Sauvegarde automatique (dans le navigateur) ---------- */
let _saveT = 0;
function save(){ clearTimeout(_saveT); _saveT = setTimeout(() => lsSet(LS_SCENE, JSON.stringify(S.doc)), 250); }
function load(){
  try{
    const d = JSON.parse(lsGet(LS_SCENE) || 'null');
    if(d && d.v === 1 && SET_DEF[d.set] && Array.isArray(d.keys) && d.keys.length){ S.doc = d; S.cur = evalAt(0); return true; }
  }catch(e){}
  return false;
}

/* ---------- Annuler / rétablir ---------- */
function snapshot(){ return JSON.stringify({ doc:S.doc, t:S.t }); }
function pushUndo(){ S.undo.push(snapshot()); if(S.undo.length > 60) S.undo.shift(); S.redo = []; }
function restore(str){ const o = JSON.parse(str); S.doc = o.doc; S.t = o.t; S.cur = evalAt(S.t); if(S.sel && !S.cur.chars[S.sel.c]) S.sel = null; buildSet(); save(); renderUI(); requestRender(); }
function undo(){ if(!S.undo.length) return; S.redo.push(snapshot()); restore(S.undo.pop()); }
function redo(){ if(!S.redo.length) return; S.undo.push(snapshot()); restore(S.redo.pop()); }

/* ---------- Clés ---------- */
const snapT = t => Math.round(clamp(t, 0, S.doc.dur) * 10) / 10;
function keyAt(t){ return S.doc.keys.find(k => Math.abs(k.t - t) < 0.051); }
/* enregistre ce qu'on voit à l'instant du curseur (crée la clé ou la met à jour) */
function commit(){
  pushUndo();
  const t = snapT(S.t); let k = keyAt(t);
  if(!k){ k = { t }; S.doc.keys.push(k); S.doc.keys.sort((a, b) => a.t - b.t); }
  k.chars = clone(S.cur.chars); k.cam = clone(S.cur.cam);
  save(); renderTimeline(); renderSide();
}
function deleteKey(){
  const k = keyAt(snapT(S.t)); if(!k) return;
  if(S.doc.keys.length === 1){ toast(L('Il faut garder au moins une clé.', 'You need to keep at least one key.')); return; }
  pushUndo(); S.doc.keys = S.doc.keys.filter(x => x !== k);
  S.cur = evalAt(S.t); save(); renderUI(); requestRender();
}
const ease = k => k * k * (3 - 2 * k);
const mix = (a, b, k) => a + (b - a) * k;
function lerpChar(a, b, k){
  const o = { root:{}, j:{} };
  for(const f of ['x', 'y', 'z', 'ry']) o.root[f] = mix(a.root[f], b.root[f], k);
  for(const J of JOINTS) o.j[J.id] = J.ax.map((_, i) => mix((a.j[J.id] || [])[i] || 0, (b.j[J.id] || [])[i] || 0, k));
  return o;
}
function lerpCam(a, b, k){ const o = {}; for(const f in a) o[f] = mix(a[f], b[f] == null ? a[f] : b[f], k); return o; }
function evalAt(t){
  const K = S.doc.keys;
  if(t <= K[0].t) return { chars:clone(K[0].chars), cam:clone(K[0].cam) };
  const last = K[K.length - 1];
  if(t >= last.t) return { chars:clone(last.chars), cam:clone(last.cam) };
  let i = 0; while(K[i + 1].t < t) i++;
  const a = K[i], b = K[i + 1], k = ease((t - a.t) / (b.t - a.t));
  return { chars:a.chars.map((c, n) => b.chars[n] ? lerpChar(c, b.chars[n], k) : clone(c)), cam:lerpCam(a.cam, b.cam, k) };
}
function seek(t){ S.t = clamp(t, 0, S.doc.dur); S.cur = evalAt(S.t); renderTimeline(); renderSide(true); requestRender(); }

/* ---------- Personnages, lieu ---------- */
function addChar(){
  if(S.cur.chars.length >= 2) return;
  pushUndo();
  const ch = charFromSpawn(1, SET_DEF[S.doc.set]);
  S.doc.keys.forEach(k => k.chars.push(clone(ch)));
  S.cur.chars.push(clone(ch));
  S.sel = { c:1, j:'pelvis' };
  save(); renderUI(); requestRender();
}
function removeChar(){
  if(S.cur.chars.length < 2) return;
  pushUndo();
  S.doc.keys.forEach(k => k.chars.length = 1); S.cur.chars.length = 1;
  if(S.sel && S.sel.c === 1) S.sel = null;
  save(); renderUI(); requestRender();
}
function setPlace(id){
  if(!SET_DEF[id] || id === S.doc.set) return;
  pushUndo();
  S.doc.set = id; buildSet();
  // tant que la scène n'est pas animée, on installe les personnages et la caméra du lieu
  if(S.doc.keys.length === 1){
    const def = SET_DEF[id];
    S.cur.chars = S.cur.chars.map((_, i) => charFromSpawn(i, def)); S.cur.cam = clone(def.cam);
    S.doc.keys[0].chars = clone(S.cur.chars); S.doc.keys[0].cam = clone(S.cur.cam);
  }
  save(); renderUI(); requestRender();
}
function setPose(pid){
  const c = S.sel ? S.sel.c : 0, ch = S.cur.chars[c]; if(!ch) return;
  const keep = { x:ch.root.x, z:ch.root.z, ry:ch.root.ry };
  applyPose(ch, pid); Object.assign(ch.root, keep);
  commit(); requestRender();
}
function resetPart(){
  if(!S.sel) return;
  const ch = S.cur.chars[S.sel.c], J = JOINT[S.sel.j];
  ch.j[J.id] = blankPose()[J.id];
  commit(); renderSide(); requestRender();
}

/* ---------- Caméra ---------- */
function camEye(c){
  const y = c.yaw * D2R, p = c.pitch * D2R;
  return [c.tx + c.dist * Math.cos(p) * Math.sin(y), c.ty - c.dist * Math.sin(p), c.tz + c.dist * Math.cos(p) * Math.cos(y)];
}
const activeCam = () => S.freeView ? S.view : S.cur.cam;
function viewProj(c, aspect){
  const e = camEye(c);
  return M4.mul(M4.persp(fovOf(c.lens), aspect, 0.05, 80), M4.lookAt(e, [c.tx, c.ty, c.tz], [0, 1, 0]));
}
function setLens(l){
  const c = activeCam(); c.lens = l;
  if(!S.freeView) commit(); else renderSide();
  requestRender(); renderStageBar();
}
function toggleFreeView(){
  S.freeView = !S.freeView;
  if(S.freeView) S.view = clone(S.cur.cam);
  requestRender(); renderStageBar();
}

/* ---------- Rendu ---------- */
const R = { canvas:null, setMesh:null, parts:{}, blob:null, raf:0, w:0, h:0 };
function buildSet(){ if(!GL.gl) return; GL.free(R.setMesh); R.setMesh = GL.mesh(setGeo(S.doc.set)); }
function initMeshes(){
  JOINTS.forEach(J => R.parts[J.id] = GL.mesh(partGeo(J.id)));
  const g = geo(), C = [0.08, 0.09, 0.11];
  for(let i = 0; i < 16; i++){ const a = i / 16 * Math.PI * 2, b = (i + 1) / 16 * Math.PI * 2; tri(g, [0, 0, 0], [Math.sin(b) * 0.36, 0, Math.cos(b) * 0.36], [Math.sin(a) * 0.36, 0, Math.cos(a) * 0.36], C); }
  R.blob = GL.mesh(g);
  buildSet();
}
function requestRender(){ if(R.raf || S.rec) return; R.raf = requestAnimationFrame(() => { R.raf = 0; drawFrame(); }); }
const BG = hexRGB('#DCE0E7'), GREEN = hexRGB('#22A06B'), GREEN_L = hexRGB('#7FD1A8');
function drawFrame(state, w, h, cam){
  const gl = GL.gl; if(!gl) return;
  state = state || S.cur; cam = cam || activeCam();
  w = w || R.canvas.width; h = h || R.canvas.height;
  GL.begin(w, h, viewProj(cam, w / h), BG);
  if(R.setMesh) GL.draw(R.setMesh, { vc:true });
  // ombres posées au sol : un disque sombre sous chaque personnage
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
  state.chars.forEach(ch => {
    const ground = (S.doc.set === 'taxi' ? 0.305 : 0.006);
    GL.draw(R.blob, { m:M4.trans(ch.root.x, ground, ch.root.z), flat:true, a:0.22, col:[0.06, 0.07, 0.09] });
  });
  gl.depthMask(true); gl.disable(gl.BLEND);
  const exporting = !!S.rec || state !== S.cur;
  state.chars.forEach((ch, c) => {
    const M = charMatrices(ch), col = hexRGB(CHAR_LOOK[c].col);
    for(const J of JOINTS){
      let tint = null, k = 0;
      if(!exporting && S.sel && S.sel.c === c && S.sel.j === J.id){ tint = GREEN; k = 0.72; }
      else if(!exporting && S.hover && S.hover.c === c && S.hover.j === J.id){ tint = GREEN_L; k = 0.45; }
      GL.draw(R.parts[J.id], { m:M[J.id], col, tint, tintK:k });
    }
  });
}
/* ce qu'il y a sous la souris : une partie du corps, ou rien */
function pickAt(px, py){
  const gl = GL.gl; if(!gl) return null;
  const sc = 0.5, w = Math.max(1, Math.round(R.canvas.width * sc)), h = Math.max(1, Math.round(R.canvas.height * sc));
  GL.beginPick(w, h, viewProj(activeCam(), R.canvas.width / R.canvas.height));
  if(R.setMesh) GL.draw(R.setMesh, { flat:true, col:[0, 0, 0] });
  S.cur.chars.forEach((ch, c) => {
    const M = charMatrices(ch);
    for(const J of JOINTS){ const id = c * 32 + J.idx + 1; GL.draw(R.parts[J.id], { m:M[J.id], flat:true, col:[id / 255, 0, 0] }); }
  });
  const id = GL.readPick(Math.floor(px * sc), Math.floor(h - 1 - py * sc));
  if(!id) return null;
  const c = Math.floor((id - 1) / 32), J = JOINTS[(id - 1) % 32];
  return J && S.cur.chars[c] ? { c, j:J.id } : null;
}
/* point du sol (y) sous un pixel de l'écran */
function groundAt(px, py, y){
  const c = activeCam(), inv = M4.invert(viewProj(c, R.canvas.width / R.canvas.height));
  const nx = px / R.canvas.width * 2 - 1, ny = 1 - py / R.canvas.height * 2;
  const a = M4.apply(inv, [nx, ny, -1]), b = M4.apply(inv, [nx, ny, 1]);
  const dy = b[1] - a[1]; if(Math.abs(dy) < 1e-6) return null;
  const k = (y - a[1]) / dy; if(k < 0) return null;
  return [a[0] + (b[0] - a[0]) * k, a[2] + (b[2] - a[2]) * k];
}

/* ---------- Souris, doigts ---------- */
const DRAG = { mode:null, x:0, y:0, moved:false, grab:null, pts:new Map(), pinch:0 };
function canvasXY(e){ const r = R.canvas.getBoundingClientRect(), k = R.canvas.width / r.width; return [(e.clientX - r.left) * k, (e.clientY - r.top) * k]; }
function onDown(e){
  if(S.rec) return;
  R.canvas.setPointerCapture(e.pointerId);
  DRAG.pts.set(e.pointerId, [e.clientX, e.clientY]);
  if(DRAG.pts.size === 2){ const [a, b] = [...DRAG.pts.values()]; DRAG.mode = 'pinch'; DRAG.pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); DRAG.camStart = clone(activeCam()); return; }
  if(S.playing) pause();
  const [x, y] = canvasXY(e);
  DRAG.x = e.clientX; DRAG.y = e.clientY; DRAG.moved = false;
  const hit = e.button === 0 && !e.shiftKey ? pickAt(x, y) : null;
  if(hit){
    S.sel = hit; DRAG.mode = hit.j === 'pelvis' ? 'move' : 'pose';
    if(DRAG.mode === 'move'){ const ch = S.cur.chars[hit.c], g = groundAt(x, y, 0); DRAG.grab = g ? [ch.root.x - g[0], ch.root.z - g[1]] : null; }
    renderSide(); requestRender();
  } else {
    DRAG.mode = (e.button === 2 || e.button === 1 || e.shiftKey) ? 'pan' : 'orbit';
  }
}
function onMove(e){
  if(DRAG.pts.has(e.pointerId)) DRAG.pts.set(e.pointerId, [e.clientX, e.clientY]);
  if(!DRAG.mode){ hoverCheck(e); return; }
  if(DRAG.mode === 'pinch'){
    if(DRAG.pts.size < 2) return;
    const [a, b] = [...DRAG.pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
    activeCam().dist = clamp(DRAG.camStart.dist * DRAG.pinch / Math.max(d, 1), 0.6, 30); DRAG.moved = true; requestRender(); return;
  }
  const dx = e.clientX - DRAG.x, dy = e.clientY - DRAG.y; DRAG.x = e.clientX; DRAG.y = e.clientY;
  if(Math.abs(dx) + Math.abs(dy) > 0) DRAG.moved = true;
  const cam = activeCam();
  if(DRAG.mode === 'orbit'){ cam.yaw -= dx * 0.35; cam.pitch = clamp(cam.pitch + dy * 0.3, -85, 85); }
  else if(DRAG.mode === 'pan'){
    const k = cam.dist * 0.0016, y = cam.yaw * D2R;
    cam.tx -= (Math.cos(y) * dx) * k; cam.tz -= (-Math.sin(y) * dx) * k; cam.ty = clamp(cam.ty + dy * k, 0, 6);
  }
  else if(DRAG.mode === 'pose'){
    const J = JOINT[S.sel.j], v = S.cur.chars[S.sel.c].j[J.id], k = 0.5;
    // glisser vers le haut lève ou plie ; vers le côté, la deuxième façon de bouger
    const a0 = J.ax[0], up = (a0[4] === 'Hocher' || a0[4] === 'Pencher') ? dy : -dy;
    v[0] = clamp(v[0] + up * k, a0[2], a0[3]);
    if(J.ax[1]) v[1] = clamp(v[1] + dx * k * (J.ax[1][0] === 'y' ? 1 : -1), J.ax[1][2], J.ax[1][3]);
    renderSide(true);
  }
  else if(DRAG.mode === 'move'){
    const [x, y] = canvasXY(e), g = groundAt(x, y, 0), ch = S.cur.chars[S.sel.c];
    if(g && DRAG.grab){ ch.root.x = clamp(g[0] + DRAG.grab[0], -12, 12); ch.root.z = clamp(g[1] + DRAG.grab[1], -14, 12); }
  }
  requestRender();
}
function onUp(e){
  DRAG.pts.delete(e.pointerId);
  if(!DRAG.mode) return;
  const m = DRAG.mode; DRAG.mode = DRAG.pts.size ? DRAG.mode : null;
  if(DRAG.pts.size) return;
  if(!DRAG.moved){
    if((m === 'orbit' || m === 'pan') && S.sel){ S.sel = null; renderSide(); requestRender(); }
    return;
  }
  if(m === 'pose' || m === 'move' || ((m === 'orbit' || m === 'pan' || m === 'pinch') && !S.freeView)) commit();
}
let _wheelT = 0;
function onWheel(e){
  e.preventDefault();
  const c = activeCam(); c.dist = clamp(c.dist * Math.exp(e.deltaY * 0.0012), 0.6, 30); requestRender();
  if(!S.freeView){ clearTimeout(_wheelT); _wheelT = setTimeout(commit, 350); }
}
let _hoverT = 0;
function hoverCheck(e){
  const now = performance.now(); if(now - _hoverT < 60 || S.playing) return; _hoverT = now;
  const [x, y] = canvasXY(e), h = pickAt(x, y);
  const same = (h && S.hover && h.c === S.hover.c && h.j === S.hover.j) || (!h && !S.hover);
  R.canvas.style.cursor = h ? 'pointer' : 'grab';
  if(!same){ S.hover = h; requestRender(); renderHint(); }
}

/* ---------- Lecture ---------- */
let _playStart = 0, _playFrom = 0;
function play(){
  if(S.playing) return pause();
  if(S.t >= S.doc.dur - 0.01) S.t = 0;
  S.playing = true; _playStart = performance.now(); _playFrom = S.t;
  const step = now => {
    if(!S.playing) return;
    const t = _playFrom + (now - _playStart) / 1000;
    if(t >= S.doc.dur){ seek(S.doc.dur); pause(); return; }
    S.t = t; S.cur = evalAt(t); drawFrame(); renderTimeline(true);
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step); renderTimeline();
}
function pause(){ S.playing = false; S.t = Math.round(S.t * 10) / 10; S.cur = evalAt(S.t); renderTimeline(); renderSide(); requestRender(); }
