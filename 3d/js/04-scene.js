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

function charFromSpawn(i, def, look){
  const sp = def.spawn[i] || def.spawn[i % def.spawn.length];
  const ch = newChar(i, sp, look);
  if(sp.pose) applyPose(ch, sp.pose);
  if(sp.y != null) ch.root.y = sp.y;
  return ch;
}
const newInfo = () => ({ cap:'', dial:'', scene:'', size:'pe', angle:'neu', side:'tq', move:'fix', dur:2 });
function newShot(setId){
  const def = SET_DEF[setId];
  return { id:uidS(), set:setId, chars:[charFromSpawn(0, def, 0)], cam:clone(def.cam), info:newInfo() };
}
function newDoc(setId){ return { v:2, title:L('Mon storyboard', 'My storyboard'), shots:[newShot(setId || 'garage')] }; }

/* ---------- Sauvegarde automatique (dans le navigateur) ---------- */
let _saveT = 0;
function save(){ clearTimeout(_saveT); _saveT = setTimeout(() => lsSet(LS_SCENE, JSON.stringify({ doc:S.doc, i:S.i })), 250); }
/* les plans d'avant gardent tout : on complète seulement ce qui manque */
function fixShot(sh){
  sh.info = Object.assign(newInfo(), sh.info || {});
  sh.chars.forEach((ch, c) => { if(ch.look == null) ch.look = c % 2; });
  return sh;
}
function load(){
  try{
    const o = JSON.parse(lsGet(LS_SCENE) || 'null'); if(!o) return false;
    // version 2 : la planche ; version 1 (la toute première) : chaque clé devient un plan
    const d = o.doc || o;
    if(d.v === 2 && Array.isArray(d.shots) && d.shots.length && d.shots.every(s => SET_DEF[s.set])){ d.shots.forEach(fixShot); S.doc = d; S.i = clamp(o.i || 0, 0, d.shots.length - 1); return true; }
    if(d.v === 1 && SET_DEF[d.set] && Array.isArray(d.keys) && d.keys.length){
      S.doc = { v:2, title:d.title, shots:d.keys.map(k => fixShot({ id:uidS(), set:d.set, chars:k.chars, cam:k.cam })) };
      S.i = 0; return true;
    }
  }catch(e){}
  return false;
}

/* ---------- Annuler / rétablir ---------- */
function snapshot(){ return JSON.stringify({ doc:S.doc, i:S.i }); }
function pushUndo(snap){ S.undo.push(snap || snapshot()); if(S.undo.length > 80) S.undo.shift(); S.redo = []; }
function restore(str){ const o = JSON.parse(str); S.doc = o.doc; S.i = clamp(o.i, 0, S.doc.shots.length - 1); S.sel = null; S.target = 0; THUMBS.clear(); changed(true); }
function undo(){ if(!S.undo.length) return; S.redo.push(snapshot()); restore(S.undo.pop()); }
function redo(){ if(!S.redo.length) return; S.undo.push(snapshot()); restore(S.redo.pop()); }
/* après chaque changement : on enregistre, on redessine, on met à jour la vignette */
function changed(all){
  if(S.target >= shot().chars.length) S.target = 0;
  save(); if(all){ renderUI(); } else { renderSide(); renderShotPanel(); renderTools(); }
  requestRender(); thumbLater(S.i, all);
}
/* un changement fait d'un coup (bouton) : annulable */
function edit(fn){ pushUndo(); fn(); changed(); }

/* ---------- Les plans ---------- */
function goShot(i){ if(i === S.i || !S.doc.shots[i]) return; S.i = i; S.sel = null; S.hover = null; S.target = 0; S.tween = null; save(); renderUI(); requestRender(); }
function addShot(){
  pushUndo();
  const n = clone(shot()); n.id = uidS(); n.info.cap = ''; n.info.dial = '';
  S.doc.shots.splice(S.i + 1, 0, n); S.i++; S.sel = null; changed(true);
  toast(L('Nouveau plan : il reprend le précédent. Change le cadrage ou la pose.', 'New shot: it starts from the previous one. Change the framing or the pose.'));
}
/* le personnage le plus proche d'un autre : celui à qui il parle */
function otherOf(c, chars){
  chars = chars || shot().chars; let best = -1, bd = 1e9;
  chars.forEach((o, i) => { if(i === c) return; const d = Math.hypot(o.root.x - chars[c].root.x, o.root.z - chars[c].root.z); if(d < bd){ bd = d; best = i; } });
  return best;
}
/* contrechamp : le plan suivant, vu par-dessus l'épaule de l'autre personnage */
function addReverse(){
  const s = shot(); if(s.chars.length < 2) return;
  pushUndo();
  const n = clone(s); n.id = uidS(); n.info = Object.assign({}, s.info, { cap:'', dial:'', size:'am', angle:'neu' });
  const back = S.target, front = otherOf(back, n.chars);
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
/* glisser-déposer dans la planche : le plan « from » va à la place « to » */
function dropShot(from, to){
  const a = S.doc.shots; if(from === to || !a[from] || to < 0 || to > a.length) return;
  pushUndo(); const [m] = a.splice(from, 1); const k = to > from ? to - 1 : to; a.splice(k, 0, m); S.i = k; changed(true);
}
const totalDur = () => S.doc.shots.reduce((t, s) => t + (s.info.dur || 2), 0);

/* ---------- Personnages, lieu, poses ---------- */
function addChar(look){
  const s = shot(); if(s.chars.length >= MAX_CHARS) return;
  edit(() => { const i = s.chars.length; s.chars.push(charFromSpawn(i, SET_DEF[s.set], look)); S.sel = { c:i, j:'pelvis' }; S.target = i; });
}
function removeChar(c){
  const s = shot(); if(s.chars.length < 2 || !s.chars[c]) return;
  edit(() => { s.chars.splice(c, 1); S.sel = null; S.target = 0; });
}
function setPlace(id){
  const s = shot(); if(!SET_DEF[id] || id === s.set) return;
  edit(() => { const def = SET_DEF[id]; s.set = id; s.chars = s.chars.map((ch, i) => charFromSpawn(i, def, ch.look)); s.cam = clone(def.cam); s.info.size = 'pe'; });
}
/* une place toute prête du lieu : le personnage y va, avec la pose qui va avec */
function placeAt(k){
  const s = shot(), sp = (SPOTS[s.set] || [])[k], c = S.sel ? S.sel.c : S.target, ch = s.chars[c]; if(!sp || !ch) return;
  edit(() => {
    if(sp[5]) applyPose(ch, sp[5]); else if(ch.root.y < -0.1) applyPose(ch, 'stand');
    ch.root.x = sp[2]; ch.root.z = sp[3]; ch.root.ry = sp[4]; if(sp[6] != null) ch.root.y = sp[6];
  });
}
function setPose(pid){
  const s = shot(), c = S.sel ? S.sel.c : S.target, ch = s.chars[c]; if(!ch) return;
  edit(() => { const keep = { x:ch.root.x, z:ch.root.z, ry:ch.root.ry }; applyPose(ch, pid); Object.assign(ch.root, keep); });
}
function resetPart(){
  if(!S.sel) return;
  edit(() => { const ch = shot().chars[S.sel.c]; ch.j[S.sel.j] = blankPose()[S.sel.j]; });
}
function faceThem(){
  const s = shot(); if(s.chars.length < 2) return;
  const a = S.target, b = otherOf(a);
  edit(() => faceEachOther([s.chars[a], s.chars[b]]));
}
/* le personnage regarde l'autre (il tourne la tête et un peu le torse) */
function lookAtOther(){
  const s = shot(); if(s.chars.length < 2) return;
  const c = S.sel ? S.sel.c : S.target, me = s.chars[c], other = s.chars[otherOf(c)];
  edit(() => {
    const want = Math.atan2(other.root.x - me.root.x, other.root.z - me.root.z) / D2R;
    let d = ((want - me.root.ry) % 360 + 540) % 360 - 180;
    const chest = clamp(d * 0.3, -35, 35); d -= chest;
    me.j.chest[1] = chest; me.j.head[1] = clamp(d, -80, 80);
  });
}

/* ---------- Cadrage rapide ----------
   La valeur (taille du sujet), l'angle (hauteur de la caméra), le côté (face, trois-quarts,
   profil, dos) : on choisit, la caméra se place. */
const SIDES = [['face', 'Face', 'Front', 0], ['tq', '¾', '¾', 26], ['tqg', '¾ inversé', '¾ other side', -26], ['prof', 'Profil', 'Profile', 88], ['dos', 'Dos', 'Back', 180]];
const sideDeg = k => (SIDES.find(x => x[0] === k) || SIDES[1])[3];
function frameNow(s, size, angle){
  const ch = s.chars[S.target] || s.chars[0], o = otherOf(S.target, s.chars);
  if(size === 'am'){ if(o >= 0) s.cam = frameOTS(ch, s.chars[o], 50); }
  else if(size === '2p'){ if(o >= 0) s.cam = frameTwo(ch, s.chars[o], 35, s.cam.yaw); }
  else if(size === 'pov'){
    // plan subjectif : la caméra à la place des yeux du personnage
    const b = bodyMarks(ch), y = b.face;
    s.cam = { tx:b.eyes[0] + Math.sin(y * D2R) * 2, ty:b.eyes[1] - 0.05, tz:b.eyes[2] + Math.cos(y * D2R) * 2, yaw:y + 180, pitch:-2, dist:2, lens:28 };
  }
  else if((size === 'pe' || size === 'pg') && s.chars.length > 1 && o >= 0){
    // plan large à plusieurs : tout le monde dans le cadre ; le côté choisi fait tourner la caméra autour du groupe
    s.cam = frameTwo(ch, s.chars[o], size === 'pg' ? 24 : 28, s.cam.yaw, true); if(size === 'pg') s.cam.dist *= 1.8;
    s.cam.yaw += sideDeg(s.info.side) - sideDeg('tq');
  }
  else s.cam = frameOn(ch, size, angle, null, sideDeg(s.info.side));
}
function frameSize(size){
  const s = shot();
  camEdit(() => {
    s.info.size = size; frameNow(s, size, s.info.angle);
    if(size === 'am' || size === '2p' || size === 'pov'){ s.info.angle = 'neu'; s.cam.roll = 0; }
  });
}
function frameAngle(angle){
  const s = shot();
  camEdit(() => {
    s.info.angle = angle;
    if(angle === 'deb'){ s.cam.roll = s.cam.roll ? 0 : 14; return; }
    s.cam.roll = 0;
    if(FRAMES[s.info.size]){ const lens = s.cam.lens; frameNow(s, s.info.size, angle); if(lens){ s.cam.dist = clamp(s.cam.dist * lens / s.cam.lens, 0.35, 28); s.cam.lens = lens; } }
    else { const A = ANGLES[angle]; if(A) s.cam.pitch = A.pitch; }
  });
}
function frameSide(side){
  const s = shot();
  camEdit(() => {
    s.info.side = side;
    if((s.info.size === 'pe' || s.info.size === 'pg') && s.chars.length > 1) s.cam.yaw = bodyMarks(s.chars[S.target] || s.chars[0]).face + 22;
    if(FRAMES[s.info.size]){ const lens = s.cam.lens; frameNow(s, s.info.size, s.info.angle); s.cam.dist = clamp(s.cam.dist * lens / s.cam.lens, 0.35, 28); s.cam.lens = lens; }
    else { const ch = s.chars[S.target] || s.chars[0]; s.cam.yaw = bodyMarks(ch).face + sideDeg(side); }
  });
}
function setLens(l){
  const s = shot();
  camEdit(() => {
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
/* la caméra glisse jusqu'au nouveau cadrage au lieu de sauter (un quart de seconde) */
const TWEEN_MS = 320;
function startTween(from){ S.tween = { from, t0:performance.now() }; requestRender(); }
function viewCam(sh){
  sh = sh || shot();
  if(!S.tween || sh !== shot()) return sh.cam;
  const k = (performance.now() - S.tween.t0) / TWEEN_MS;
  if(k >= 1){ S.tween = null; return sh.cam; }
  const e = 1 - Math.pow(1 - k, 3), a = S.tween.from, b = sh.cam, o = {};
  for(const f in b) o[f] = a[f] == null ? b[f] : a[f] + (b[f] - a[f]) * e;
  const dy = ((b.yaw - a.yaw) % 360 + 540) % 360 - 180; o.yaw = a.yaw + dy * e;   // par le plus court chemin
  return o;
}
/* un changement de cadrage annulable, avec la caméra qui glisse */
function camEdit(fn){ const before = clone(shot().cam); edit(fn); startTween(before); }

/* ---------- Rendu ---------- */
const R = { canvas:null, sets:{}, parts:{}, blob:null, raf:0 };
function setMesh(id){ if(!R.sets[id]) R.sets[id] = GL.mesh(setGeo(id)); return R.sets[id]; }
function initMeshes(){
  CHAR_LOOK.forEach(lk => { R.parts[lk.id] = {}; JOINTS.forEach(J => R.parts[lk.id][J.id] = GL.mesh(partGeo(J.id, lk))); });
  const g = geo(), C = [0.08, 0.09, 0.11];
  for(let i = 0; i < 16; i++){ const a = i / 16 * Math.PI * 2, b = (i + 1) / 16 * Math.PI * 2; tri(g, [0, 0, 0], [Math.sin(b) * 0.36, 0, Math.cos(b) * 0.36], [Math.sin(a) * 0.36, 0, Math.cos(a) * 0.36], C); }
  R.blob = GL.mesh(g);
}
function requestRender(){
  if(R.raf || S.rec || S.play) return;
  R.raf = requestAnimationFrame(() => { R.raf = 0; drawFrame(); if(S.tween || NAV.held) requestRender(); });
}
const BG = hexRGB('#DCE0E7'), GREEN = hexRGB('#22A06B'), GREEN_L = hexRGB('#7FD1A8'), GHOST = hexRGB('#3E4552');
/* dessine un plan ; « clean » : l'image du film, sans aide (exports, vignettes) */
function drawFrame(sh, w, h, clean){
  const gl = GL.gl; if(!gl) return;
  sh = sh || shot(); w = w || R.canvas.width; h = h || R.canvas.height;
  const cam = clean ? sh.cam : viewCam(sh), vp = viewProj(cam, w / h), eye = camEye(cam);
  GL.begin(w, h, vp, SET_DEF[sh.set].bg ? hexRGB(SET_DEF[sh.set].bg) : BG);
  // en travaillant, le décor qui cache un personnage devient transparent ; à l'export, il reste en place
  const mats = sh.chars.map(ch => charMatrices(ch));
  GL.view(eye, clean ? [] : mats.map(M => M4.apply(M.chest, [0, 0.12, 0])));
  GL.draw(setMesh(sh.set), { vc:true, x:1 });
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
  const ground = sh.set === 'taxi' ? 0.305 : 0.006;
  sh.chars.forEach(ch => GL.draw(R.blob, { m:M4.trans(ch.root.x, ground, ch.root.z), flat:true, a:0.22, col:[0.06, 0.07, 0.09] }));
  gl.depthMask(true); gl.disable(gl.BLEND);
  // en travaillant : les parties cachées par le décor (mur, voiture) sont dessinées en filigrane,
  // avant les personnages, pour qu'elles n'apparaissent que là où le décor passe devant
  if(!clean){
    gl.enable(gl.BLEND); gl.depthMask(false); gl.depthFunc(gl.GREATER);
    sh.chars.forEach((ch, c) => { const on = S.sel && S.sel.c === c, P = R.parts[lookOf(ch, c).id]; for(const J of JOINTS) GL.draw(P[J.id], { m:mats[c][J.id], flat:true, a:on ? 0.42 : 0.2, col:on ? GREEN : GHOST }); });
    gl.depthFunc(gl.LESS); gl.depthMask(true); gl.disable(gl.BLEND);
  }
  const tintOf = (c, id) => clean ? [null, 0] : (S.sel && S.sel.c === c && S.sel.j === id) ? [GREEN, 0.72] : (S.hover && S.hover.c === c && S.hover.j === id) ? [GREEN_L, 0.45] : [null, 0];
  sh.chars.forEach((ch, c) => {
    const lk = lookOf(ch, c), col = hexRGB(lk.col), P = R.parts[lk.id];
    for(const J of JOINTS){ const [tint, k] = tintOf(c, J.id); GL.draw(P[J.id], { m:mats[c][J.id], col, tint, tintK:k, mul:true, char:true }); }
  });
  if(!clean){
    gl.enable(gl.BLEND); gl.depthMask(false);
    // le décor coupé autour des personnages, remis en transparence par-dessus
    GL.draw(setMesh(sh.set), { vc:true, x:2, a:0.22 });
    gl.depthMask(true); gl.disable(gl.BLEND);
    if(w === R.canvas.width) placeHandles(sh, vp, w, h, mats);
  }
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

/* ---------- La poignée au-dessus de la tête (comme dans les Sims) ----------
   Un losange vert flotte au-dessus de chaque personnage : on le maintient pour
   déplacer le personnage, la petite flèche à côté sert à le faire tourner.
   C'est un élément de la page, posé sur l'image : il n'est jamais dans les exports. */
function placeHandles(sh, vp, w, h, mats){
  const host = document.getElementById('handles'); if(!host) return;
  const sig = sh.chars.map(ch => ch.look).join(',') + getLang();
  if(host.dataset.sig !== sig){ host.dataset.sig = sig; host.innerHTML = '';
  }
  if(host.children.length !== sh.chars.length) host.innerHTML = sh.chars.map((_, c) => `<div class="hd" data-c="${c}">
      <button class="hd-move" data-hd="move" data-c="${c}" aria-label="${esc(L('Déplacer ', 'Move ') + L(lookOf(sh.chars[c], c).fr, lookOf(sh.chars[c], c).en))}"><svg viewBox="0 0 24 32" aria-hidden="true"><path d="M12 1 22 13 12 31 2 13Z"/><path class="hl" d="M12 3.5 6 13h12Z"/></svg></button>
      <button class="hd-turn" data-hd="turn" data-c="${c}" aria-label="${esc(L('Tourner ', 'Turn ') + L(lookOf(sh.chars[c], c).fr, lookOf(sh.chars[c], c).en))}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8a5 5 0 1 0 1.6-3.7"/><path d="M3 2.6v3h3"/></svg></button>
    </div>`).join('');
  const r = R.canvas.getBoundingClientRect(), k = r.width / w;
  sh.chars.forEach((ch, c) => {
    const el = host.children[c], top = M4.apply(mats[c].head, [0, 0.62, 0]);
    // derrière la caméra : on cache la poignée
    const clip = [vp[0] * top[0] + vp[4] * top[1] + vp[8] * top[2] + vp[12], vp[1] * top[0] + vp[5] * top[1] + vp[9] * top[2] + vp[13], vp[3] * top[0] + vp[7] * top[1] + vp[11] * top[2] + vp[15]];
    if(clip[2] <= 0.05){ el.style.display = 'none'; return; }
    const x = (clip[0] / clip[2] + 1) / 2 * w * k, y = (1 - clip[1] / clip[2]) / 2 * h * k;
    el.style.display = x < -20 || y < -40 || x > r.width + 20 || y > r.height + 20 ? 'none' : '';
    el.style.transform = `translate(${Math.round(x)}px, ${Math.round(clamp(y, 18, r.height - 10))}px)`;
    el.classList.toggle('on', (S.sel && S.sel.c === c) || S.target === c);
    el.classList.toggle('busy', HDRAG.c === c);
  });
}
const HDRAG = { c:-1, kind:null, x:0, y:0, snap:null, moved:false };
function onHandleDown(e){
  const b = e.target.closest('[data-hd]'); if(!b || S.rec) return;
  e.preventDefault(); e.stopPropagation();
  const c = +b.dataset.c, ch = shot().chars[c]; if(!ch) return;
  b.setPointerCapture(e.pointerId);
  HDRAG.c = c; HDRAG.kind = b.dataset.hd; HDRAG.snap = snapshot(); HDRAG.moved = false; HDRAG.x = e.clientX;
  S.target = c; S.sel = { c, j:'pelvis' };
  HDRAG.y = e.clientY;
  document.body.classList.add('dragging');
  renderSide(); renderTools(); renderHint(); requestRender();
}
function onHandleMove(e){
  if(HDRAG.c < 0) return;
  const ch = shot().chars[HDRAG.c]; if(!ch) return;
  if(HDRAG.kind === 'move'){
    // la souris glisse, le personnage suit sur le sol : vers la droite de l'image, ou vers le fond
    const dx = e.clientX - HDRAG.x, dy = e.clientY - HDRAG.y; HDRAG.x = e.clientX; HDRAG.y = e.clientY;
    if(dx || dy){
      const c = viewCam(), eye = camEye(c), y = c.yaw * D2R;
      const vx = ch.root.x - eye[0], vy = 1.0 + ch.root.y - eye[1], vz = ch.root.z - eye[2], d = Math.hypot(vx, vy, vz) || 1;
      const k = d * 2 * Math.tan(fovOf(c.lens) / 2) / (R.canvas.getBoundingClientRect().height || 500);
      const depth = 1 / clamp(Math.abs(vy) / d + 0.25, 0.35, 1);     // vu de haut, un pixel vers le fond fait moins de chemin
      const rx = Math.cos(y), rz = -Math.sin(y), fx = -Math.sin(y), fz = -Math.cos(y);
      ch.root.x = clamp(ch.root.x + (rx * dx - fx * dy * depth) * k, -12, 12);
      ch.root.z = clamp(ch.root.z + (rz * dx - fz * dy * depth) * k, -14, 12);
      HDRAG.moved = true;
    }
  } else {
    const dx = e.clientX - HDRAG.x; HDRAG.x = e.clientX;
    if(dx){ ch.root.ry = ((ch.root.ry + dx * 0.8) % 360 + 540) % 360 - 180; HDRAG.moved = true; renderSide(true); }
  }
  requestRender();
}
function onHandleUp(){
  if(HDRAG.c < 0) return;
  HDRAG.c = -1; document.body.classList.remove('dragging');
  if(HDRAG.moved){ pushUndo(HDRAG.snap); changed(); } else requestRender();
}

/* ce qu'il y a sous la souris : une partie du corps, ou rien.
   Le décor n'arrête pas le clic : un personnage derrière un meuble reste attrapable. */
function pickAt(px, py){
  const gl = GL.gl; if(!gl) return null;
  const sh = shot(), sc = 0.5, w = Math.max(1, Math.round(R.canvas.width * sc)), h = Math.max(1, Math.round(R.canvas.height * sc));
  GL.beginPick(w, h, viewProj(viewCam(), R.canvas.width / R.canvas.height));
  sh.chars.forEach((ch, c) => {
    const M = charMatrices(ch);
    const P = R.parts[lookOf(ch, c).id];
    for(const J of JOINTS){ const id = c * 32 + J.idx + 1; GL.draw(P[J.id], { m:M[J.id], flat:true, col:[id / 255, 0, 0] }); }
  });
  const id = GL.readPick(Math.floor(px * sc), Math.floor(h - 1 - py * sc));
  if(!id) return null;
  const c = Math.floor((id - 1) / 32), J = JOINTS[(id - 1) % 32];
  return J && sh.chars[c] ? { c, j:J.id } : null;
}
/* point du sol (y) sous un pixel de l'écran */
function groundAt(px, py, y){
  const inv = M4.invert(viewProj(viewCam(), R.canvas.width / R.canvas.height));
  const nx = px / R.canvas.width * 2 - 1, ny = 1 - py / R.canvas.height * 2;
  const a = M4.apply(inv, [nx, ny, -1]), b = M4.apply(inv, [nx, ny, 1]);
  const dy = b[1] - a[1]; if(Math.abs(dy) < 1e-6) return null;
  const k = (y - a[1]) / dy; if(k < 0) return null;
  return [a[0] + (b[0] - a[0]) * k, a[2] + (b[2] - a[2]) * k];
}

/* ---------- Souris, doigts ----------
   Glisser dans le vide : tourner autour · clic droit (ou Maj) + glisser : se décaler ·
   molette : avancer, reculer · double-clic : viser cet endroit. */
const DRAG = { mode:null, x:0, y:0, moved:false, grab:null, pts:new Map(), pinch:0, snap:null };
function canvasXY(e){ const r = R.canvas.getBoundingClientRect(), k = R.canvas.width / r.width; return [(e.clientX - r.left) * k, (e.clientY - r.top) * k]; }
function onDown(e){
  if(S.rec) return;
  if(S.play){ stopBoard(); return; }
  S.tween = null;
  R.canvas.setPointerCapture(e.pointerId);
  DRAG.pts.set(e.pointerId, [e.clientX, e.clientY]);
  if(DRAG.pts.size === 1) DRAG.snap = snapshot();
  if(DRAG.pts.size === 2){ const [a, b] = [...DRAG.pts.values()]; DRAG.mode = 'pinch'; DRAG.pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); DRAG.dist0 = shot().cam.dist; DRAG.mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; return; }
  const [x, y] = canvasXY(e);
  DRAG.x = e.clientX; DRAG.y = e.clientY; DRAG.moved = false;
  const hit = e.button === 0 && !e.shiftKey ? pickAt(x, y) : null;
  if(hit){
    S.sel = hit; S.target = hit.c; DRAG.mode = hit.j === 'pelvis' ? 'move' : 'pose';
    if(DRAG.mode === 'move'){ const ch = shot().chars[hit.c], g = groundAt(x, y, 0); DRAG.grab = g ? [ch.root.x - g[0], ch.root.z - g[1]] : null; }
    renderSide(); renderTools(); renderHint(); requestRender();
  } else {
    DRAG.mode = (e.button === 2 || e.button === 1 || e.shiftKey) ? 'pan' : 'orbit';
    R.canvas.style.cursor = 'grabbing';
  }
}
/* se décaler : la scène suit la souris, dans le plan de l'image */
function panBy(cam, dx, dy){
  const k = cam.dist * Math.tan(fovOf(cam.lens) / 2) * 2 / (R.canvas.getBoundingClientRect().height || 500), y = cam.yaw * D2R, p = cam.pitch * D2R;
  cam.tx -= Math.cos(y) * dx * k; cam.tz += Math.sin(y) * dx * k;
  // vers le haut et le bas : selon l'inclinaison de la caméra, on monte ou on avance
  cam.ty = clamp(cam.ty + Math.cos(p) * dy * k, -0.5, 8);
  cam.tx -= Math.sin(y) * Math.sin(p) * dy * k; cam.tz -= Math.cos(y) * Math.sin(p) * dy * k;
}
function onMove(e){
  if(DRAG.pts.has(e.pointerId)) DRAG.pts.set(e.pointerId, [e.clientX, e.clientY]);
  if(!DRAG.mode){ hoverCheck(e); return; }
  const cam = shot().cam;
  if(DRAG.mode === 'pinch'){
    if(DRAG.pts.size < 2) return;
    const [a, b] = [...DRAG.pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    cam.dist = clamp(DRAG.dist0 * DRAG.pinch / Math.max(d, 1), 0.35, 30);
    panBy(cam, mid[0] - DRAG.mid[0], mid[1] - DRAG.mid[1]); DRAG.mid = mid;   // deux doigts : zoomer et se décaler
    DRAG.moved = true; requestRender(); return;
  }
  const dx = e.clientX - DRAG.x, dy = e.clientY - DRAG.y; DRAG.x = e.clientX; DRAG.y = e.clientY;
  if(Math.abs(dx) + Math.abs(dy) > 0) DRAG.moved = true;
  if(DRAG.mode === 'orbit'){ cam.yaw -= dx * 0.3; cam.pitch = clamp(cam.pitch + dy * 0.25, -88, 85); }
  else if(DRAG.mode === 'pan') panBy(cam, dx, dy);
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
  const m = DRAG.mode; DRAG.mode = null; R.canvas.style.cursor = 'grab';
  if(!DRAG.moved){
    if((m === 'orbit' || m === 'pan') && S.sel){ S.sel = null; renderSide(); renderHint(); requestRender(); }
    return;
  }
  pushUndo(DRAG.snap); changed();
}
/* molette : on avance vers ce qu'il y a sous la souris (et non vers le centre) */
let _wheelT = 0, _wheelSnap = null;
function onWheel(e){
  e.preventDefault(); S.tween = null;
  if(!_wheelSnap) _wheelSnap = snapshot();
  const c = shot().cam, f = Math.exp(clamp(e.deltaY, -120, 120) * 0.0015), nd = clamp(c.dist * f, 0.35, 30);
  const [x, y] = canvasXY(e), g = groundAt(x, y, c.ty);
  if(g && f < 1){ const k = (1 - nd / c.dist) * 0.5; c.tx += (g[0] - c.tx) * k; c.tz += (g[1] - c.tz) * k; }
  c.dist = nd; requestRender();
  clearTimeout(_wheelT); _wheelT = setTimeout(() => { pushUndo(_wheelSnap); _wheelSnap = null; changed(); }, 350);
}
/* double-clic : sur un personnage, la caméra le recadre ; ailleurs, elle vise ce point du sol */
function onDblClick(e){
  if(S.rec) return;
  const [x, y] = canvasXY(e), hit = pickAt(x, y), s = shot();
  if(hit){ S.target = hit.c; frameSize(FRAMES[s.info.size] ? s.info.size : 'pm'); return; }
  const g = groundAt(x, y, 0); if(!g) return;
  camEdit(() => { s.cam.tx = g[0]; s.cam.tz = g[1]; s.cam.ty = clamp(s.cam.ty, 0.8, 1.6); });
}
let _hoverT = 0;
function hoverCheck(e){
  const now = performance.now(); if(now - _hoverT < 60) return; _hoverT = now;
  const [x, y] = canvasXY(e), h = pickAt(x, y);
  const same = (h && S.hover && h.c === S.hover.c && h.j === S.hover.j) || (!h && !S.hover);
  R.canvas.style.cursor = h ? 'pointer' : 'grab';
  if(!same){ S.hover = h; requestRender(); renderHint(); }
}

/* ---------- Se déplacer : le pavé à l'écran et le clavier (ZQSD ou WASD, flèches haut et bas) ----------
   On maintient un bouton ou une touche : la caméra avance tant qu'on appuie. */
const NAV = { held:null, last:0, snap:null, keys:new Set() };
const NAV_KEYS = { z:'fwd', w:'fwd', arrowup:'fwd', s:'back', arrowdown:'back', q:'left', a:'left', d:'right', r:'up', f:'down' };
function navStep(kind, dt){
  const c = shot().cam, y = c.yaw * D2R, sp = (0.6 + c.dist * 0.35) * dt, turn = 70 * dt;
  const fx = -Math.sin(y), fz = -Math.cos(y), rx = Math.cos(y), rz = -Math.sin(y);
  if(kind === 'fwd'){ c.tx += fx * sp; c.tz += fz * sp; }
  else if(kind === 'back'){ c.tx -= fx * sp; c.tz -= fz * sp; }
  else if(kind === 'left'){ c.tx -= rx * sp; c.tz -= rz * sp; }
  else if(kind === 'right'){ c.tx += rx * sp; c.tz += rz * sp; }
  else if(kind === 'up') c.ty = clamp(c.ty + sp * 0.6, -0.5, 8);
  else if(kind === 'down') c.ty = clamp(c.ty - sp * 0.6, -0.5, 8);
  else if(kind === 'turnL') c.yaw += turn;
  else if(kind === 'turnR') c.yaw -= turn;
  else if(kind === 'in') c.dist = clamp(c.dist * Math.exp(-1.2 * dt), 0.35, 30);
  else if(kind === 'out') c.dist = clamp(c.dist * Math.exp(1.2 * dt), 0.35, 30);
}
function navLoop(now){
  const kinds = [...NAV.keys]; if(NAV.held) kinds.push(NAV.held);
  if(!kinds.length){ NAV.running = false; return; }
  const dt = Math.min(0.05, (now - NAV.last) / 1000); NAV.last = now;
  kinds.forEach(k => navStep(k, dt)); drawFrame();
  requestAnimationFrame(navLoop);
}
function navStart(kind){
  S.tween = null;
  if(!NAV.snap) NAV.snap = snapshot();
  if(!NAV.running){ NAV.running = true; NAV.last = performance.now(); requestAnimationFrame(navLoop); }
}
function navEnd(){
  if(NAV.held || NAV.keys.size) return;
  if(NAV.snap){ pushUndo(NAV.snap); NAV.snap = null; changed(); }
}
