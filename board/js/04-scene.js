/* =====================================================================
   RAGING BOARD — LA PLANCHE DE STORYBOARD
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
  pro:lsGet('raging3d_pro') === '1',   // repères pro : zones de sécurité, horizon, chiffres de la caméra
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
  putOnSpot(ch, sp.pose, sp.y);
  return ch;
}
/* mettre un personnage dans la pose d'une place : assis sur un siège, le bassin reste à la hauteur
   du siège (même pour un enfant) ; debout sur un trottoir ou un gradin, on monte d'autant */
function putOnSpot(ch, pose, y){
  const low = ch.pose && (POSES.find(p => p.id === ch.pose) || {}).y < -0.1;
  if(pose) applyPose(ch, pose); else if(low || ch.on) { applyPose(ch, 'stand'); delete ch.on; } else ch.root.y -= ch.gy || 0;
  ch.gy = 0;
  if(pose && SEATED[pose]) ch.root.y = seatY(ch, y != null ? y : (POSES.find(p => p.id === pose) || {}).y || 0);
  else if(y != null){ ch.gy = y; ch.root.y += y; }
}
const newInfo = () => ({ cap:'', dial:'', scene:'', size:'pe', angle:'neu', side:'tq', move:'fix', dur:2, walk:false, time:'day', trans:'cut' });
function newShot(setId){
  const def = SET_DEF[setId];
  return { id:uidS(), set:setId, chars:[charFromSpawn(0, def, 0)], cam:camSafe(clone(def.cam), setId, true), crowds:[], vehicles:[], info:newInfo() };
}
function newDoc(setId){ return { v:2, title:L('Mon storyboard', 'My storyboard'), style:'color', shots:[newShot(setId || 'garage')] }; }

/* ---------- Sauvegarde automatique (dans le navigateur) ---------- */
let _saveT = 0;
function save(){ clearTimeout(_saveT); _saveT = setTimeout(() => { const j = docJSON(); if(S.docId && typeof persistDoc === 'function') persistDoc(j); else lsSet(LS_SCENE, j); if(typeof renderSaved === 'function') renderSaved(); }, 250); }
/* le projet tel qu'on l'enregistre : si on règle le cadre de fin d'un mouvement, on remet chaque cadre à sa place */
function docJSON(){ const sw = S.endEd && shot(); if(sw) swapEnd(sw); const t = JSON.stringify({ doc:S.doc, i:S.i }); if(sw) swapEnd(sw); return t; }
/* les plans d'avant gardent tout : on complète seulement ce qui manque */
const OLD_MOVES = { pan:'panR', tilt:'tiltU', trav:'in', zoom:'zoomIn', stea:'in' };
function fixShot(sh){
  sh.info = Object.assign(newInfo(), sh.info || {});
  if(OLD_MOVES[sh.info.move]) sh.info.move = OLD_MOVES[sh.info.move];
  if(!Array.isArray(sh.crowds)) sh.crowds = [];
  if(!Array.isArray(sh.vehicles)) sh.vehicles = [];
  sh.chars.forEach((ch, c) => { if(ch.look == null || !CHAR_LOOK[ch.look]) ch.look = c % 2; });
  return sh;
}
function load(){
  try{
    const o = JSON.parse(lsGet(LS_SCENE) || 'null'); if(!o) return false;
    // version 2 : la planche ; version 1 (la toute première) : chaque clé devient un plan
    const d = o.doc || o;
    if(d.v === 2 && Array.isArray(d.shots) && d.shots.length && d.shots.every(s => SET_DEF[s.set])){ d.shots.forEach(fixShot); if(!d.style) d.style = 'color'; S.doc = d; S.i = clamp(o.i || 0, 0, d.shots.length - 1); return true; }
    if(d.v === 1 && SET_DEF[d.set] && Array.isArray(d.keys) && d.keys.length){
      S.doc = { v:2, title:d.title, style:'color', shots:d.keys.map(k => fixShot({ id:uidS(), set:d.set, chars:k.chars, cam:k.cam })) };
      S.i = 0; return true;
    }
  }catch(e){}
  return false;
}

/* ---------- Annuler / rétablir ---------- */
function snapshot(){ return docJSON(); }
function pushUndo(snap){ S.undo.push(snap || snapshot()); if(S.undo.length > 80) S.undo.shift(); S.redo = []; }
function restore(str){ endEdit(); const o = JSON.parse(str); S.doc = o.doc; S.i = clamp(o.i, 0, S.doc.shots.length - 1); S.sel = null; S.target = 0; THUMBS.clear(); changed(true); }
function undo(){ if(!S.undo.length) return; S.redo.push(snapshot()); restore(S.undo.pop()); }
function redo(){ if(!S.redo.length) return; S.undo.push(snapshot()); restore(S.redo.pop()); }
/* après chaque changement : on enregistre, on redessine, on met à jour la vignette */
function changed(all){
  if(S.target >= shot().chars.length) S.target = 0;
  save(); if(all){ renderUI(); } else { renderPanel(); renderHead(); renderTop(); }
  requestRender(); thumbLater(S.i, all);
}
/* un changement fait d'un coup (bouton) : annulable */
function edit(fn){ pushUndo(); fn(); changed(); }

/* ---------- Les plans ---------- */
function goShot(i){ if(i === S.i || !S.doc.shots[i]) return; endEdit(); S.room = null; S.i = i; S.hidden = []; S.sel = null; S.hover = null; S.target = 0; S.tween = null; save(); renderUI(); requestRender(); }
function addShot(){
  endEdit(); pushUndo();
  const n = clone(shot()); n.id = uidS(); n.info.cap = ''; n.info.dial = ''; n.info.move = 'fix'; n.info.trans = 'cut'; delete n.camEnd;
  S.doc.shots.splice(S.i + 1, 0, n); S.i++; S.sel = null; changed(true);
  toast(L('Plan ', 'Shot ') + (S.i + 1) + L(' créé', ' created'));
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
  endEdit(); pushUndo();
  const n = clone(s); n.id = uidS(); n.info = Object.assign({}, s.info, { cap:'', dial:'', size:'am', angle:'neu', move:'fix' }); delete n.camEnd;
  const back = S.target, front = otherOf(back, n.chars);
  n.cam = frameOTS(n.chars[front], n.chars[back], s.cam.lens >= 50 ? s.cam.lens : 50);
  S.doc.shots.splice(S.i + 1, 0, n); S.i++; S.target = front; S.sel = null; changed(true);
}
function dupShot(){ endEdit(); pushUndo(); const n = clone(shot()); n.id = uidS(); S.doc.shots.splice(S.i + 1, 0, n); S.i++; changed(true); }
function delShot(k){
  if(S.doc.shots.length < 2){ toast(L('Il faut garder au moins un plan.', 'You need to keep at least one shot.')); return; }
  const i = Number.isInteger(k) ? k : S.i; if(!S.doc.shots[i]) return;
  endEdit(); pushUndo(); S.doc.shots.splice(i, 1);
  if(i < S.i || S.i >= S.doc.shots.length) S.i = Math.max(0, S.i - 1);
  S.sel = null; THUMBS.clear(); changed(true);
  toast(L('Plan ', 'Shot ') + (i + 1) + L(' supprimé', ' deleted'), '', [L('Annuler', 'Undo'), () => undo()]);
}
function moveShot(d){
  const j = S.i + d; if(j < 0 || j >= S.doc.shots.length) return;
  pushUndo(); const a = S.doc.shots; [a[S.i], a[j]] = [a[j], a[S.i]]; S.i = j; changed(true);
}
/* glisser-déposer dans la planche : le plan « from » va à la place « to » */
function dropShot(from, to){
  const a = S.doc.shots; if(from === to || !a[from] || to < 0 || to > a.length) return;
  endEdit(); pushUndo(); const [m] = a.splice(from, 1); const k = to > from ? to - 1 : to; a.splice(k, 0, m); S.i = k; changed(true);
}
const totalDur = () => S.doc.shots.reduce((t, s) => t + (s.info.dur || 2), 0);

/* ---------- Personnages, lieu, poses ---------- */
function addChar(look){
  const s = shot(); if(s.chars.length >= MAX_CHARS) return;
  edit(() => { const i = s.chars.length; s.chars.push(charFromSpawn(i, SET_DEF[s.set], look)); S.sel = { c:i, j:'pelvis' }; S.target = i; });
}
function setOutfit(id){
  const s = shot(), t = S.sel ? S.sel.c : S.target, ch = s.chars[t]; if(!ch) return;
  edit(() => { if(id && id !== 'base') ch.outfit = id; else delete ch.outfit;
    const c = S.doc.colors && S.doc.colors[ch.look]; if(c){ delete c.top; delete c.bottom; if(!Object.keys(c).length) delete S.doc.colors[ch.look]; } });
}
function removeChar(c){
  const s = shot(); if(s.chars.length < 2 || !s.chars[c]) return;
  edit(() => { s.chars.splice(c, 1); S.sel = null; S.target = 0; });
}
function setPlace(id){ S.room = null;
  const s = shot(); if(!SET_DEF[id] || id === s.set) return;
  endEdit();
  const before = clone(s.cam);
  edit(() => { const def = SET_DEF[id]; s.set = id; s.chars = s.chars.map((ch, i) => Object.assign(charFromSpawn(i, def, ch.look), ch.outfit ? { outfit:ch.outfit } : {})); s.cam = camSafe(clone(def.cam), id, true); s.info.size = 'pe'; s.info.move = 'fix'; delete s.camEnd; s.crowds = []; s.vehicles = []; s.chars.forEach(ch => delete ch.on); });
  startTween(before);
  clearTimeout(R.benchT); R.benchT = setTimeout(benchmark, 600);   // un grand espace est plus lourd : on revérifie
}
/* une place toute prête du lieu : le personnage y va, avec la pose qui va avec */
function placeAt(k){
  const s = shot(), sp = (SPOTS[s.set] || [])[k], c = S.sel ? S.sel.c : S.target, ch = s.chars[c]; if(!sp || !ch) return;
  edit(() => { putOnSpot(ch, sp[5], sp[6]); ch.root.x = sp[2]; ch.root.z = sp[3]; ch.root.ry = sp[4]; });
}
function setPose(pid){
  const s = shot(), c = S.sel ? S.sel.c : S.target, ch = s.chars[c]; if(!ch) return;
  edit(() => { const keep = { x:ch.root.x, z:ch.root.z, ry:ch.root.ry }; applyPose(ch, pid); Object.assign(ch.root, keep); ch.root.y += ch.gy || 0; });
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
/* les recettes de plans : un clic, et la valeur, l'angle, le côté et le mouvement vont ensemble (pour bien démarrer) */
const SHOT_RECIPES = [
  ['establish', 'Plan d’ouverture', 'Establishing shot', 'On découvre le lieu, de loin, en reculant.', 'We discover the place from afar, pulling back.', { size:'pg', angle:'plo', move:'out' }],
  ['hero', 'Le héros, puissant', 'The hero, powerful', 'Vu d’en bas : il domine.', 'Seen from below: they dominate.', { size:'pa', angle:'con', side:'tq' }],
  ['weak', 'Écrasé, vulnérable', 'Crushed, vulnerable', 'Vu d’en haut : il est petit.', 'Seen from above: they look small.', { size:'pm', angle:'plo', side:'tq' }],
  ['emotion', 'L’émotion', 'The emotion', 'Un gros plan où l’on s’approche doucement.', 'A close-up slowly pushing in.', { size:'gp', angle:'neu', side:'tq', move:'in' }],
  ['tension', 'La tension', 'The tension', 'Les yeux, de face, immobiles (Sergio Leone).', 'The eyes, from the front, still (Sergio Leone).', { size:'tgp', angle:'neu', side:'face' }],
  ['unease', 'Le malaise', 'The unease', 'L’image penche : quelque chose ne va pas.', 'The picture tilts: something is wrong.', { size:'pr', angle:'deb', side:'tq' }],
  ['dialog', 'Dialogue en amorce', 'Over-the-shoulder dialogue', 'Par-dessus l’épaule de l’autre ; fais ensuite le contrechamp.', 'Over the other one’s shoulder; then make the reverse shot.', { size:'am', two:true }],
  ['two', 'Les deux ensemble', 'Both together', 'Les deux personnages dans le même cadre.', 'Both characters in the same frame.', { size:'2p', two:true }],
  ['pov', 'Ce qu’il voit', 'What they see', 'La caméra à la place de ses yeux.', 'The camera in place of their eyes.', { size:'pov' }],
  ['reveal', 'La révélation', 'The reveal', 'La caméra s’élève et dévoile la scène.', 'The camera rises and unveils the scene.', { size:'pe', angle:'neu', side:'tq', move:'grue' }],
  ['shock', 'Le choc', 'The shock', 'Effet Vertigo : le monde bascule autour de lui.', 'Dolly zoom: the world lurches around them.', { size:'pr', angle:'neu', side:'face', move:'vertigo' }],
  ['trunk', 'Vu du coffre (Tarantino)', 'Trunk shot (Tarantino)', 'Très bas, vers le haut, les personnages penchés sur nous.', 'Very low, looking up, the characters leaning over us.', { size:'pa', angle:'sol', side:'face', pitch:24 }],
];
function shotRecipe(id){
  const r = SHOT_RECIPES.find(x => x[0] === id), s = shot(); if(!r) return;
  const o = r[5], before = clone(s.cam);
  edit(() => {
    s.info.size = o.size; s.info.angle = o.angle || 'neu'; if(o.side) s.info.side = o.side; s.info.move = o.move || 'fix';
    frameNow(s, o.size, s.info.angle === 'deb' ? 'neu' : s.info.angle);
    s.cam.roll = s.info.angle === 'deb' ? 14 : 0;
    if(o.pitch) s.cam.pitch = o.pitch;
    camSafe(s.cam, s.set, true); CAM_WANT.cam = null;
  });
  startTween(before);
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
  }, true);
}

/* ---------- Changer de personnage : la caméra le suit, en glissant ---------- */
function focusChar(c){
  const s = shot(); if(!s.chars[c]) return;
  const same = S.target === c;
  S.target = c; S.sel = { c, j:'pelvis' };
  const k = s.info.size;
  if(!same && (FRAMES[k] || k === 'am' || k === '2p' || k === 'pov')) frameSize(k);
  else { renderSide(); renderTools(); requestRender(); }
}

/* ---------- En voiture : des prises de vue toutes prêtes dans le taxi ---------- */
function carSetup(){
  const s = shot(); if(s.set !== 'taxi') return;
  edit(() => {
    const sp = SPOTS.taxi;
    if(s.chars[0]){ putOnSpot(s.chars[0], sp[0][5], sp[0][6]); Object.assign(s.chars[0].root, { x:sp[0][2], z:sp[0][3], ry:sp[0][4] }); }
    if(s.chars[1]){ putOnSpot(s.chars[1], sp[1][5], sp[1][6]); Object.assign(s.chars[1].root, { x:sp[1][2], z:sp[1][3], ry:sp[1][4] }); }
  });
}
function carShot(id){
  const s = shot(), P = CAR_SHOTS.find(x => x[0] === id); if(!P || s.set !== 'taxi') return;
  camEdit(() => { s.cam = camLook(P[3], P[4], P[5]); s.info.size = P[6]; s.info.angle = P[7] || 'neu'; });
}

/* ---------- La foule ----------
   Une foule est un rectangle rempli de silhouettes plates, toujours tournées vers la caméra :
   on peut en mettre partout (une terrasse, un trottoir, une salle de concert) pour presque rien. */
const CROWD_KIND = [['stand', 'Debout', 'Standing'], ['cheer', 'Qui applaudit', 'Cheering'], ['mix', 'Mélangée', 'Mixed']];
function addCrowd(kind){
  const s = shot(), c = viewCam(), y = c.yaw * D2R;
  // devant la caméra, un peu plus loin que ce qu'elle vise
  const d = clamp(c.dist * 0.6 + 3, 3, 14);
  edit(() => {
    s.crowds.push({ x:round(c.tx - Math.sin(y) * d, 2), z:round(c.tz - Math.cos(y) * d, 2), y:0, ry:round(c.yaw, 0), w:8, d:3, dens:1, kind:kind || 'stand', seed:1 + Math.floor(Math.random() * 9999) });
    S.crowd = s.crowds.length - 1; S.sel = null;
  });
  if(typeof setPanel === 'function') setPanel('crowd');
}
function setCrowd(k, f, v){ const c = shot().crowds[k]; if(!c) return; c[f] = v; save(); requestRender(); thumbLater(S.i); }
function removeCrowd(k){ const s = shot(); if(!s.crowds[k]) return; edit(() => { s.crowds.splice(k, 1); S.crowd = s.crowds.length ? Math.min(k, s.crowds.length - 1) : -1; }); }

/* ---------- Les véhicules posés (la moto) ----------
   On la pose devant la caméra ; un personnage peut y monter (pilote ou passager) :
   il suit alors la moto quand on la déplace ou qu'on la tourne. */
function addVehicle(kind){
  const s = shot(), c = viewCam(), y = c.yaw * D2R, d = clamp(c.dist * 0.5 + 1.5, 2, 10);
  edit(() => {
    const K = VEH_DEF[kind] ? kind : 'moto', D = VEH_DEF[K], dd = K === 'moto' || D.obj ? Math.min(d, 4) : Math.max(d, 6);
    const nv = { id:uidS(), kind:K, col:D.cols[s.vehicles.filter(o => o.kind === K).length % D.cols.length], x:round(c.tx - Math.sin(y) * dd, 2), y:0, z:round(c.tz - Math.cos(y) * dd, 2), ry:round(c.yaw + (D.obj ? 0 : 90), 0) };
    const lv = SET_DEF[s.set].levels; if(lv) nv.y = lv.reduce((b, l) => l <= c.ty + 0.3 ? l : b, 0);
    if(D.obj) nv.y = supportY(s, nv, nv.y);
    s.vehicles.push(nv);
    S.veh = s.vehicles.length - 1;
  });
}
/* ---------- La hauteur d'un accessoire ----------
   On le monte, on le descend : il ne passe jamais sous le sol (ni sous le plancher de l'étage où il est),
   ni à travers un meuble ou un autre accessoire (il se pose dessus), ni à travers le plafond d'une pièce.
   Le calcul ne se fait qu'au moment où l'on règle la hauteur : rien de plus à chaque image. */
function itemSize(v){
  const D = VEH_DEF[v.kind] || {};
  if(D.obj){ const s = D.sh || [0.3, 0.3]; return [s[0], s[1], Math.max(0.15, (D.label || 1) - 0.22)]; }
  const H = VEH_HULL[v.kind] || [[0, 0.5, 0, 0.5, 0.5, 0.5]];
  return [Math.max(...H.map(h => Math.abs(h[0]) + h[3])), Math.max(...H.map(h => Math.abs(h[2]) + h[5])), Math.max(...H.map(h => h[1] + h[4]))];
}
function supportY(sh, v, want){
  const d = SET_DEF[sh.set] || {}, C = SET_COLL[sh.set], lv = d.levels || [0], [hx, hz, h] = itemSize(v);
  const a = (v.ry || 0) * D2R, ca = Math.abs(Math.cos(a)), sa = Math.abs(Math.sin(a)), ex = hx * ca + hz * sa, ez = hx * sa + hz * ca;
  // l'étage où il se trouve déjà : on règle sa hauteur dans cet étage (il ne passe pas d'un étage à l'autre)
  const lvl = lv.reduce((b, l, i) => l <= Math.max(v.y || 0, 0) + 0.3 ? i : b, 0), base = lv[lvl] || 0;
  // le plafond de la pièce où il est (dans un lieu sans ciel) : il reste dessous, et ce qui est à l'étage ne compte pas
  const inBox = !d.box || (v.x > d.box[0] && v.x < d.box[2] && v.z > d.box[1] && v.z < d.box[3]);
  const top = !C ? 1e9 : d.levels ? (inBox ? base + (d.roomH || 2.9) : 1e9) : d.sky ? 1e9 : Math.max(0, ...[C.main].concat(C.levels).flatMap(L => L.w.map(w => w[5])));
  let y = Math.max(want, base);
  // ce qui peut porter l'objet : les meubles du lieu, et les autres accessoires
  const boxes = [];
  if(C) [C.main].concat(C.levels).forEach(L => L.b.forEach(b => { const c = Math.abs(Math.cos(b[6] || 0)), s = Math.abs(Math.sin(b[6] || 0)); boxes.push([b[0], b[2], b[3] * c + b[5] * s, b[3] * s + b[5] * c, b[1] - b[4], b[1] + b[4]]); }));
  (sh.vehicles || []).forEach(o => { if(o === v) return; const [ox, oz, oh] = itemSize(o), oa = (o.ry || 0) * D2R, c = Math.abs(Math.cos(oa)), s = Math.abs(Math.sin(oa)); boxes.push([o.x, o.z, ox * c + oz * s, ox * s + oz * c, o.y || 0, (o.y || 0) + oh]); });
  for(let k = 0; k < 6; k++){
    let moved = false;
    for(const b of boxes){
      if(b[4] >= top - 0.05 || Math.abs(v.x - b[0]) >= ex + b[2] - 0.02 || Math.abs(v.z - b[1]) >= ez + b[3] - 0.02) continue;   // pas au-dessus, ou à l'étage
      if(y < b[5] - 0.005 && y + h > b[4] + 0.005){ y = b[5]; moved = true; }                              // dedans : il se pose dessus
    }
    if(!moved) break;
  }
  if(top > 0.5 && top < 1e8 && y + h > top) y = Math.max(base, top - h);
  return Math.round(y * 100) / 100;
}
function setVehY(v, want){ const s = shot(); v.y = supportY(s, v, want); syncRiders(s); }
function removeVehicle(k){ const s = shot(), v = s.vehicles[k]; if(!v) return; edit(() => { s.chars.forEach(ch => { if(ch.on && ch.on.v === v.id){ delete ch.on; applyPose(ch, 'stand'); } }); s.vehicles.splice(k, 1); S.veh = s.vehicles.length ? Math.min(k, s.vehicles.length - 1) : -1; }); }
/* les personnages montés suivent leur véhicule */
const vehSeat = (v, i) => { const D = VEH_DEF[v.kind] || VEH_DEF.moto; return D.seats[i] || D.seats[0]; };
function syncRiders(sh){
  (sh.chars || []).forEach(ch => {
    const v = ch.on && sh.vehicles.find(x => x.id === ch.on.v); if(!v) return;
    const st = vehSeat(v, ch.on.seat), a = (v.ry || 0) * D2R, py = (POSES.find(p => p.id === st.pose) || {}).y || 0;
    ch.root.x = v.x + Math.cos(a) * st.x + Math.sin(a) * st.z; ch.root.z = v.z - Math.sin(a) * st.x + Math.cos(a) * st.z; ch.root.ry = v.ry || 0;
    ch.root.y = (v.y || 0) + (st.py != null ? seatY(ch, py) + st.py : py);
  });
}
function mountVehicle(k, seat){
  const s = shot(), v = s.vehicles[k], c = S.sel ? S.sel.c : S.target, ch = s.chars[c]; if(!v || !ch) return;
  seat = seat | 0;
  edit(() => {
    s.chars.forEach(o => { if(o !== ch && o.on && o.on.v === v.id && o.on.seat === seat){ delete o.on; applyPose(o, 'stand'); o.root.x += 1.2; o.root.y = 0; } });
    applyPose(ch, vehSeat(v, seat).pose); ch.on = { v:v.id, seat }; syncRiders(s);
  });
}
/* une prise de vue donnée dans le repère d'un objet (véhicule ou personnage) : on la ramène dans le monde */
function localCam(o, ry, e, t, lens){
  const a = (ry || 0) * D2R, W = p => [o.x + p[0] * Math.cos(a) + p[2] * Math.sin(a), (o.y || 0) + p[1], o.z - p[0] * Math.sin(a) + p[2] * Math.cos(a)];
  return camLook(W(e), W(t), lens);
}
function vehShot(k, id){
  const s = shot(), v = s.vehicles[k], P = (VEH_DEF[v && v.kind] || VEH_DEF.moto).shots.find(x => x[0] === id); if(!v || !P) return;
  camEdit(() => { s.cam = localCam(v, v.ry, P[3], P[4], P[5]); s.info.size = P[6]; s.info.angle = P[7] || 'neu'; });
}
/* les prises de vue autour d'un personnage armé */
function gunShot(id){
  const s = shot(), c = S.sel ? S.sel.c : S.target, ch = s.chars[c], P = GUN_SHOTS.find(x => x[0] === id); if(!ch || !P) return;
  const M = charMatrices(ch), b = bodyMarks(ch), e = b.eyes[1] - ch.root.y, sh = M4.apply(M.armR, [0, 0, 0])[1] - ch.root.y;
  camEdit(() => {
    if(id === 'arme'){
      const h = M4.apply(M.handR, [0, -0.1, 0.03]), a = ch.root.ry * D2R, side = [Math.cos(a), 0, -Math.sin(a)];
      s.cam = camLook([h[0] - side[0] * 0.5 + Math.sin(a) * 0.15, h[1] + 0.06, h[2] - side[2] * 0.5 + Math.cos(a) * 0.15], h, P[5]);
    } else s.cam = localCam({ x:ch.root.x, y:ch.root.y, z:ch.root.z }, ch.root.ry, P[3](e, sh), P[4](e, sh), P[5]);
    s.info.size = P[6]; s.info.angle = P[7] || 'neu';
  });
}
function setGear(id){ const s = shot(), c = S.sel ? S.sel.c : S.target, ch = s.chars[c]; if(!ch) return; edit(() => { ch.gear = Object.assign({}, ch.gear); ch.gear[id] = !ch.gear[id]; }); }
function setProp(id){ const s = shot(), c = S.sel ? S.sel.c : S.target, ch = s.chars[c]; if(!ch) return; edit(() => { ch.prop = id || null; ch.propUser = true; }); }

/* ---------- Le noir et blanc (pour tout le film) ---------- */
function setStyle(st){ if(S.doc.style === st) return; edit(() => { S.doc.style = st; }); THUMBS.clear(); renderStrip(); }
function setRatio(r){ if((S.doc.ratio || '16:9') === r) return; edit(() => { if(r === '16:9') delete S.doc.ratio; else S.doc.ratio = r; }); THUMBS.clear(); renderStrip(); renderView(); }

/* ---------- Le mouvement de caméra : on le voit à la lecture et dans l'animatique ----------
   Le cadre du plan est le point de départ ; le mouvement en part. « Vers un cadre de fin » :
   on règle soi-même l'image d'arrivée. */
function camStart(sh){ return S.endEd && sh === shot() && sh.camEnd ? sh.camEnd : sh.cam; }
function camFinish(sh){ return S.endEd && sh === shot() ? sh.cam : sh.camEnd; }
function swapEnd(sh){ const t = sh.cam; sh.cam = sh.camEnd; sh.camEnd = t; }
/* régler la fin : la caméra montre (et on modifie) l'image d'arrivée */
function editEnd(on){
  const s = shot();
  if(on === !!S.endEd) return;
  const before = clone(s.cam);
  if(on){
    if(!s.camEnd){ s.camEnd = clone(s.cam); s.camEnd.dist = clamp(s.cam.dist * 0.7, 0.4, 28); }
    swapEnd(s); S.endEd = true;
  } else { swapEnd(s); S.endEd = false; }
  startTween(before); renderUI(); requestRender();
}
function endEdit(){ if(S.endEd){ const s = shot(); if(s) swapEnd(s); S.endEd = false; } }
const easeIO = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
function camAt(sh, k, t){
  const a = camStart(sh), m = sh.info.move, e = easeIO(clamp(k, 0, 1)), c = Object.assign({}, a);
  const eye = camEyeRaw(a);
  // tourner sur place (la caméra ne bouge pas, elle pivote)
  const pivot = (dy, dp) => {
    c.yaw = a.yaw + dy; c.pitch = clamp(a.pitch + dp, -88, 85);
    const y = c.yaw * D2R, p = c.pitch * D2R;
    c.tx = eye[0] - c.dist * Math.cos(p) * Math.sin(y); c.ty = eye[1] + c.dist * Math.sin(p); c.tz = eye[2] - c.dist * Math.cos(p) * Math.cos(y);
  };
  const side = v => { const y = a.yaw * D2R, d = Math.max(0.8, a.dist * 0.3) * v; c.tx = a.tx + Math.cos(y) * d; c.tz = a.tz - Math.sin(y) * d; };
  if(m === 'panR') pivot(-18 * e, 0);
  else if(m === 'panL') pivot(18 * e, 0);
  else if(m === 'tiltU') pivot(0, 10 * e);
  else if(m === 'tiltD') pivot(0, -10 * e);
  else if(m === 'in') c.dist = Math.max(0.45, a.dist * (1 - 0.35 * e));
  else if(m === 'out') c.dist = a.dist * (1 + 0.45 * e);
  else if(m === 'travR') side(e);
  else if(m === 'travL') side(-e);
  else if(m === 'zoomIn') c.lens = a.lens * (1 + 0.8 * e);
  else if(m === 'zoomOut') c.lens = Math.max(14, a.lens / (1 + 0.6 * e));
  else if(m === 'orbit') c.yaw = a.yaw + 35 * e;
  else if(m === 'grue') c.pitch = clamp(a.pitch - 22 * e, -88, 85);
  else if(m === 'grueD') c.pitch = clamp(a.pitch + 16 * e, -88, 85);
  else if(m === 'drone'){ c.dist = a.dist * (1 + 1.2 * e); c.pitch = clamp(a.pitch - 25 * e, -88, 85); }
  else if(m === 'epa'){ const s = t || 0; c.yaw += Math.sin(s * 4.1) * 0.7 + Math.sin(s * 9.3) * 0.25; c.pitch += Math.sin(s * 5.3 + 1) * 0.5; c.roll = (a.roll || 0) + Math.sin(s * 3.1) * 0.6; }
  else if(m === 'orbitL') c.yaw = a.yaw - 35 * e;
  else if(m === 'arc360') c.yaw = a.yaw + 360 * clamp(k, 0, 1);
  else if(m === 'pedU' || m === 'pedD') c.ty = a.ty + (m === 'pedU' ? 0.9 : -Math.min(0.9, Math.max(0, a.ty - 0.25))) * e;
  else if(m === 'vertigo' || m === 'vertigoIn'){
    // le sujet garde sa taille : le recul et la focale changent ensemble
    const f = m === 'vertigo' ? 1 + 1.1 * e : 1 / (1 + 0.6 * e);
    c.dist = a.dist * f; c.lens = clamp(a.lens * f, 12, 200);
  }
  else if(m === 'crash'){ const q = clamp(k * 2.4 - 0.3, 0, 1), f = q * q * (3 - 2 * q); c.lens = clamp(a.lens * (1 + 2.6 * f), 12, 200); }
  else if(m === 'whipR' || m === 'whipL'){ const q = clamp((k - 0.35) / 0.3, 0, 1), f = q * q * (3 - 2 * q); pivot((m === 'whipR' ? -1 : 1) * 80 * f, 0); }
  else if(m === 'follow'){
    // la caméra avance avec le premier personnage qui marche ; sinon, une lente avancée flottante
    const s = t || 0, w = sh.info.walk && sh.chars.find(ch => ch.pose === 'walk' || ch.pose === 'run');
    if(w){ const d = s * (w.pose === 'run' ? 3.2 : 1.25) * bodyScale(lookOf(w)), y = w.root.ry * D2R; c.tx = a.tx + Math.sin(y) * d; c.tz = a.tz + Math.cos(y) * d; }
    else c.dist = Math.max(0.45, a.dist * (1 - 0.2 * e));
    c.ty = c.ty + Math.sin(s * 2.2) * 0.012; c.roll = (a.roll || 0) + Math.sin(s * 1.3) * 0.35;
  }
  else if(m === 'shake'){ const s = t || 0, f = Math.exp(-s * 2.2) * 2.2; c.yaw += Math.sin(s * 37) * f; c.pitch += Math.sin(s * 29 + 1) * f * 0.8; c.roll = (a.roll || 0) + Math.sin(s * 23) * f * 0.6; }
  else if(m === 'rollIn') c.roll = (a.roll || 0) + 16 * e;
  else if(m === 'end'){
    const b = camFinish(sh); if(!b) return c;
    for(const f of ['tx', 'ty', 'tz', 'pitch', 'dist', 'lens', 'roll']) c[f] = (a[f] || 0) + ((b[f] || 0) - (a[f] || 0)) * e;
    c.yaw = a.yaw + ((((b.yaw - a.yaw) % 360) + 540) % 360 - 180) * e;
  }
  return c;
}
/* les transitions : comment on entre dans un plan (le cut, un fondu enchaîné depuis le plan d'avant,
   un fondu au noir, un flash blanc). fxAt dit, à l'instant t du plan i, ce qu'il faut poser par-dessus l'image. */
const TRANS = [['cut', 'Cut (coupe franche)', 'Cut'], ['fade', 'Fondu enchaîné', 'Cross-fade'], ['black', 'Fondu au noir', 'Fade to black'], ['white', 'Flash blanc', 'Flash to white']];
const FX_T = { fade:0.6, black:0.45, white:0.3 };
function fxAt(shots, i, t){
  const s = shots[i], n = shots[i + 1], d = s.info.dur || 2, tr = s.info.trans, nt = n && n.info.trans;
  const col = k => k === 'white' ? [1, 1, 1] : [0, 0, 0];
  if(tr === 'fade' && i > 0 && t < FX_T.fade) return { prev:true, a:1 - t / FX_T.fade };
  if((tr === 'black' || tr === 'white') && t < FX_T[tr]) return { col:col(tr), a:1 - t / FX_T[tr] };
  if((nt === 'black' || nt === 'white') && t > d - FX_T[nt]) return { col:col(nt), a:(t - (d - FX_T[nt])) / FX_T[nt] };
  return null;
}
/* les personnages qui marchent ou courent avancent pendant le plan, en balançant bras et jambes */
const MIRROR = { thighL:'thighR', thighR:'thighL', shinL:'shinR', shinR:'shinL', footL:'footR', footR:'footL', armL:'armR', armR:'armL', foreL:'foreR', foreR:'foreL', handL:'handR', handR:'handL' };
function animChars(sh, t){
  if(!sh.info.walk || !sh.chars.some(ch => ch.pose === 'walk' || ch.pose === 'run')) return null;
  return sh.chars.map(ch => {
    if(ch.pose !== 'walk' && ch.pose !== 'run') return ch;
    const run = ch.pose === 'run', o = clone(ch), m = {};
    for(const k in ch.j) m[k] = (ch.j[MIRROR[k] || k] || []).slice();
    ['spine', 'chest', 'head'].forEach(k => { if(m[k]) { m[k][1] = -(m[k][1] || 0); if(m[k][2] != null) m[k][2] = -m[k][2]; } });
    const w = (1 - Math.cos(t * Math.PI * 2 * (run ? 1.45 : 0.95))) / 2;
    for(const k in o.j) o.j[k] = o.j[k].map((v, i) => v + ((m[k][i] || 0) - v) * w);
    const d = t * (run ? 3.2 : 1.25) * bodyScale(lookOf(ch)), y = ch.root.ry * D2R;
    o.root.x += Math.sin(y) * d; o.root.z += Math.cos(y) * d;
    o.root.y += Math.abs(Math.sin(t * Math.PI * 2 * (run ? 1.45 : 0.95))) * (run ? 0.05 : 0.02);
    return o;
  });
}
/* une image du plan à l'instant t (en secondes depuis son début) */
function frameAt(sh, t){
  const k = t / (sh.info.dur || 2), cam = camAt(sh, k, t);
  // dans un lieu fermé, un mouvement (travelling arrière, grue…) s'arrête aux murs au lieu de les traverser
  if(sh.info.move && sh.info.move !== 'fix' && SET_DEF[sh.set] && SET_DEF[sh.set].rooms) camSafe(cam, sh.set, false);
  return { cam, chars:animChars(sh, t) };
}

/* ---------- L'image finale ----------
   Un bouton montre exactement ce qui sera enregistré : sans transparence, sans poignées, sans grille. */
function setFinal(on){ S.final = on == null ? !S.final : on; renderTools(); if(typeof renderView === 'function') renderView(); requestRender(); }

/* ---------- Ma photo comme décor ----------
   La photo est rangée à part, dans la base du navigateur (IndexedDB) : une photo pèse trop lourd pour
   le petit stockage où vivent les storyboards. Le plan ne garde que son numéro. Le fichier .rboard,
   lui, emporte les photos avec le storyboard. */
const PHOTOS = new Map();
let _phDB = null;
function photoDB(){
  if(_phDB) return _phDB;
  return _phDB = new Promise(ok => { try{ const r = indexedDB.open('raging3d_photos', 1);
    r.onupgradeneeded = () => { try{ r.result.createObjectStore('p'); }catch(e){} }; r.onsuccess = () => ok(r.result); r.onerror = () => ok(null); r.onblocked = () => ok(null);
  }catch(e){ ok(null); } });
}
async function photoPut(id, url){ PHOTOS.set(id, url); const db = await photoDB(); if(!db) return false;
  return new Promise(ok => { try{ const t = db.transaction('p', 'readwrite'); t.objectStore('p').put(url, id); t.oncomplete = () => ok(true); t.onerror = () => ok(false); }catch(e){ ok(false); } }); }
async function photoGet(id){ if(PHOTOS.has(id)) return PHOTOS.get(id); const db = await photoDB(); if(!db) return null;
  return new Promise(ok => { try{ const q = db.transaction('p').objectStore('p').get(id); q.onsuccess = () => { if(q.result) PHOTOS.set(id, q.result); ok(q.result || null); }; q.onerror = () => ok(null); }catch(e){ ok(null); } }); }
/* à l'ouverture d'un storyboard : on va chercher ses photos, puis on redessine */
async function loadPhotos(doc){
  const ids = [...new Set((doc.shots || []).map(s => s.photo).filter(Boolean))].filter(id => !PHOTOS.has(id));
  if(!ids.length) return; await Promise.all(ids.map(photoGet));
  THUMBS.clear(); if(typeof renderStrip === 'function') renderStrip(); requestRender();
}
/* importer une photo : réduite à 1600 px au plus (légère, nette), puis le plan prend « Ma photo » pour décor */
function importPhoto(file){
  if(!file || !/^image\//.test(file.type)){ toast(L('Choisis une image (JPG, PNG…).', 'Pick an image (JPG, PNG…).'), 'warn'); return; }
  const r = new FileReader();
  r.onload = () => { const im = new Image(); im.onload = async () => {
    const k = Math.min(1, 1600 / Math.max(im.width, im.height)), c = document.createElement('canvas');
    c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    const url = c.toDataURL('image/jpeg', 0.85), id = 'ph' + uidS();
    const kept = await photoPut(id, url);
    const s = shot(); if(s.set !== 'photo') setPlace('photo');
    edit(() => { s.photo = id; }); THUMBS.clear(); renderUI(); requestRender();
    toast(kept ? L('Photo posée comme décor', 'Photo set as the background')
      : L('Photo posée, mais non gardée par ce navigateur : enregistre le fichier .rboard', 'Photo placed but not kept by this browser: save the .rboard file'), kept ? '' : 'warn');
  }; im.onerror = () => toast(L('Cette image ne s’ouvre pas.', 'This image can’t be opened.'), 'warn'); im.src = r.result; };
  r.readAsDataURL(file);
}
/* ---------- Caméra ---------- */
function camEyeRaw(c){
  const y = c.yaw * D2R, p = c.pitch * D2R;
  return [c.tx + c.dist * Math.cos(p) * Math.sin(y), c.ty - c.dist * Math.sin(p), c.tz + c.dist * Math.cos(p) * Math.cos(y)];
}
/* ---------- La caméra, un objet physique ----------
   L'objectif est une petite boule qui ne traverse ni les murs, ni les meubles, ni les plafonds, ni le sol.
   Quand on tourne, recule, avance ou se décale, il glisse le long de ce qu'il touche, comme une vraie
   caméra qu'on promène : il ne saute jamais, et ce qu'on voit est exactement ce qui est enregistré
   (rien n'est corrigé après coup). Pour passer d'une pièce à l'autre, on passe par les portes, ou on
   se téléporte avec le plan. C'est la même règle dans tous les lieux, taxi compris (ses prises de vue toutes
   prêtes, elles, passent par les vitres). */
let CAM_SET = null;
const CAM_R = 0.1;
const PHYS = {};
/* les obstacles d'un lieu, préparés une fois : pavés (tournés), murs (segments), pièces (sol, plafond) */
function physOf(id){
  if(PHYS[id] !== undefined) return PHYS[id];
  // les obstacles se relèvent en construisant le lieu : s'il n'a pas encore été dessiné, on le construit maintenant
  // (sinon la caméra posée en arrivant dans le lieu ne voyait pas ses murs)
  if(!SET_COLL[id] && SET_DEF[id] && GL.gl) setMesh(id);
  const C = SET_COLL[id], d = SET_DEF[id];
  if(!C) return null;
  const all = [C.main].concat(C.levels), boxes = [], walls = [];
  all.forEach(L => {
    L.b.forEach(b => boxes.push([b[0], b[1], b[2], b[3] + CAM_R, b[4] + CAM_R, b[5] + CAM_R, Math.cos(b[6]), Math.sin(b[6])]));
    L.w.forEach(w => walls.push(w));
  });
  const rooms = (d.rooms || []).map(r => { const y0 = d.levels ? d.levels[r[2]] : 0; return { r:r[3], y0, y1:y0 + (d.roomH || 3), roof:r[5] === 'roof' }; });
  // les limites du lieu : un lieu fermé (hôtel, banque…), c'est l'intérieur de ses pièces ; dehors, un peu au-delà du décor
  const closed = !!(d.rooms && !d.levels && !d.garden);
  let lim = null;
  if(!closed){ let x0 = -30, z0 = -30, x1 = 30, z1 = 30;
    boxes.forEach(b => { const r = Math.hypot(b[3], b[5]); x0 = Math.min(x0, b[0] - r - 10); x1 = Math.max(x1, b[0] + r + 10); z0 = Math.min(z0, b[2] - r - 10); z1 = Math.max(z1, b[2] + r + 10); });
    walls.forEach(w => { x0 = Math.min(x0, w[0] - 10, w[2] - 10); x1 = Math.max(x1, w[0] + 10, w[2] + 10); z0 = Math.min(z0, w[1] - 10, w[3] - 10); z1 = Math.max(z1, w[1] + 10, w[3] + 10); });
    lim = [x0, z0, x1, z1, 40]; }
  return PHYS[id] = { boxes, walls, rooms, closed, lim };
}
/* la caméra est-elle dans le lieu ? (dans une de ses pièces pour un lieu fermé, dans ses limites dehors) */
function physIn(P, p){
  if(P.closed) return P.rooms.some(R0 => p[0] >= R0.r[0] && p[0] <= R0.r[2] && p[2] >= R0.r[1] && p[2] <= R0.r[3] && p[1] >= R0.y0 && p[1] <= R0.y1);
  const l = P.lim; return !l || (p[0] >= l[0] && p[0] <= l[2] && p[2] >= l[1] && p[2] <= l[3] && p[1] <= l[4]);
}
/* à quelle profondeur le point est entré dans l'obstacle (négatif : dehors) */
function physDepth(b, p){
  const px = p[0] - b[0], pz = p[2] - b[2], lx = px * b[6] - pz * b[7], lz = px * b[7] + pz * b[6];
  return Math.min(b[3] - Math.abs(lx), b[4] - Math.abs(p[1] - b[1]), b[5] - Math.abs(lz));
}
/* le gabarit des véhicules posés dans le plan : la caméra en fait le tour au lieu de passer à travers la carrosserie
   (les prises de vue toutes prêtes, elles, se placent à l'intérieur, et l'on peut en ressortir) */
const VEH_HULL = { moto:[[0, 0.55, 0, 0.3, 0.45, 0.95]], car:[[0, 0.5, 0, 0.95, 0.4, 2.45], [0, 1.2, -0.25, 0.85, 0.32, 1.15]],
  police:[[0, 0.5, 0, 0.95, 0.4, 2.45], [0, 1.2, -0.25, 0.85, 0.32, 1.15]], heli:[[0, 1.35, 0.4, 0.95, 0.95, 1.9]], plane:[[0, 1.15, -1.0, 0.75, 0.75, 3.6]] };
const _physV = { key:'', P:null };
function physScene(id, sh){
  const P = physOf(id), vs = ((sh || (S.doc && S.doc.shots[S.i]) || {}).vehicles) || []; if(!P || !vs.length) return P;
  const key = id + JSON.stringify(vs.map(v => [v.kind, v.x, v.y, v.z, v.ry]));
  if(_physV.key === key && _physV.base === P) return _physV.P;
  const boxes = P.boxes.slice();
  vs.forEach(v => (VEH_HULL[v.kind] || []).forEach(h => { const a = (v.ry || 0) * D2R, c = Math.cos(a), s = Math.sin(a);
    boxes.push([v.x + h[0] * c + h[2] * s, (v.y || 0) + h[1], v.z - h[0] * s + h[2] * c, h[3] + CAM_R, h[4] + CAM_R, h[5] + CAM_R, Math.cos(a), Math.sin(a)]); }));
  _physV.key = key; _physV.base = P; _physV.P = Object.assign({}, P, { boxes });
  return _physV.P;
}
/* l'obstacle (son numéro) qui contient le point, en sautant ceux de la liste « skip » */
function physHit(P, p, skip){
  const B = P.boxes;
  for(let i = 0; i < B.length; i++){
    const b = B[i], py = p[1] - b[1]; if(py > b[4] || py < -b[4]) continue;
    const px = p[0] - b[0], pz = p[2] - b[2], lx = px * b[6] - pz * b[7], lz = px * b[7] + pz * b[6];
    if(lx > b[3] || lx < -b[3] || lz > b[5] || lz < -b[5]) continue;
    if(skip && skip.has(i)) continue;
    return i;
  }
  return -1;
}
/* traverser un mur entre a et b ? (dans le plan, à la hauteur du mur) */
function physWall(P, a, b){
  for(const w of P.walls){
    const y = (a[1] + b[1]) / 2; if(y < w[4] - CAM_R || y > w[5] + CAM_R) continue;
    const ex = w[2] - w[0], ez = w[3] - w[1], dx = b[0] - a[0], dz = b[2] - a[2];
    const den = dx * ez - dz * ex; if(Math.abs(den) < 1e-12) continue;
    const qx = w[0] - a[0], qz = w[1] - a[2], t = (qx * ez - qz * ex) / den, u = (qx * dz - qz * dx) / den;
    if(t >= 0 && t <= 1 && u >= -0.02 && u <= 1.02) return true;
    // et pas trop près du mur non plus (la boule a une épaisseur)
    const L2 = ex * ex + ez * ez, k = clamp(((b[0] - w[0]) * ex + (b[2] - w[1]) * ez) / L2, 0, 1), cx = w[0] + ex * k - b[0], cz = w[1] + ez * k - b[2];
    const ka = clamp(((a[0] - w[0]) * ex + (a[2] - w[1]) * ez) / L2, 0, 1), ax = w[0] + ex * ka - a[0], az = w[1] + ez * ka - a[2];
    const db = Math.hypot(cx, cz), da = Math.hypot(ax, az);
    if(db < CAM_R * 0.7 && db < da) return true;
  }
  return false;
}
/* le sol et le plafond : dans une pièce, entre son sol et son plafond (sous le toit au grenier) ; dehors, au-dessus du sol */
function physY(P, p){
  let lo = 0.12, hi = 60, best = null, bd = 1e9;
  for(const R0 of P.rooms){
    const [x0, z0, x1, z1] = R0.r; if(p[0] < x0 || p[0] > x1 || p[2] < z0 || p[2] > z1) continue;
    const dd = p[1] < R0.y0 ? R0.y0 - p[1] : p[1] > R0.y1 ? p[1] - R0.y1 : 0; if((dd < 0.05 || P.closed) && dd < bd){ bd = dd; best = R0; }   // seulement la pièce où l'on est (pas celle de l'étage d'en dessus)
  }
  if(best){ lo = best.y0 + 0.15; hi = best.roof ? best.y0 + 2.4 - 0.56 * Math.abs(p[2]) - 0.12 : best.y1 - 0.12; hi = Math.max(hi, lo + 0.1); }
  return clamp(p[1], lo, hi);
}
/* déplacer l'objectif de « from » vers « to » : par petits pas, en glissant le long de ce qu'il touche */
function physMove(P, from, to){
  let p = from.slice(); p[1] = physY(P, p);
  // ce qui contient déjà l'objectif ne le retient pas… mais il ne peut que s'en dégager, jamais s'y enfoncer
  const skip = new Set(); for(let i = physHit(P, p); i >= 0; i = physHit(P, p, skip)) skip.add(i);
  const deep = [...skip].map(i => [P.boxes[i], physDepth(P.boxes[i], p)]);
  // hors du lieu (un ancien plan, une prise de vue toute prête) : on peut y revenir, pas s'en éloigner
  let out = !physIn(P, p);
  const D = [to[0] - p[0], to[1] - p[1], to[2] - p[2]], L = Math.hypot(...D); if(L < 1e-7) return p;
  const n = Math.min(400, Math.ceil(L / 0.04)), st = D.map(v => v / n);
  const ok = q => {
    if(Math.abs(physY(P, q) - q[1]) > 1e-9 || physHit(P, q, skip) >= 0) return false;   // le sol, le plafond et le toit sont des obstacles comme les autres
    for(const k of deep){ const d = physDepth(k[0], q); if(d > 0 && d > k[1] + 1e-6) return false; k[2] = d; }
    if(out) return physIn(P, q) || physLim(P, q) <= physLim(P, p) + 1e-6;
    return physIn(P, q) && !physWall(P, p, q);
  };
  for(let k = 0; k < n; k++){
    // tout droit, sinon en glissant le long de l'obstacle, sinon en montant par-dessus un obstacle bas (un tonneau, une table)
    const up = Math.hypot(st[0], st[2]);
    const tries = [st, [st[0], 0, st[2]], [st[0], st[1], 0], [0, st[1], st[2]], [st[0], 0, 0], [0, 0, st[2]], [st[0], up, st[2]], [0, up, 0], [0, st[1], 0]];
    let moved = false;
    for(let t = 0; t < tries.length; t++){
      const m = tries[t];
      if(!m[0] && !m[1] && !m[2]) continue;
      if(up > 1e-4 && m[1] !== up && Math.hypot(m[0], m[2]) < up * 0.1 && t !== 8) continue;   // on avançait : glisser sur place ne compte pas
      // monter : seulement par-dessus ce qui est bas (pas le long d'un mur ou d'une armoire, sinon la caméra grimpe et sort du lieu)
      if((t === 6 || t === 7) && !ok([p[0] + st[0] * 2, p[1] + 0.45, p[2] + st[2] * 2])) continue;
      const q = [p[0] + m[0], p[1] + m[1], p[2] + m[2]];
      if(ok(q)){ deep.forEach(k => { if(k[2] != null) k[1] = Math.min(k[1], k[2]); }); p = q; moved = true; if(out && physIn(P, p)) out = false; break; }
    }
    if(!moved) break;
  }
  return p;
}
/* la distance qui sépare un point du lieu (0 dedans) */
function physLim(P, p){
  if(P.closed){ let best = 1e9; P.rooms.forEach(R0 => { const r = R0.r; best = Math.min(best, Math.hypot(Math.max(r[0] - p[0], 0, p[0] - r[2]), Math.max(r[1] - p[2], 0, p[2] - r[3]), Math.max(R0.y0 - p[1], 0, p[1] - R0.y1))); }); return best; }
  const l = P.lim; return l ? Math.hypot(Math.max(l[0] - p[0], 0, p[0] - l[2]), Math.max(l[1] - p[2], 0, p[2] - l[3]), Math.max(0, p[1] - l[4])) : 0;
}
/* après chaque geste de caméra : l'objectif part d'où il était (e0) et va où on le demande, physiquement.
   S'il se décale avec le point visé (avancer, se décaler), tout le « pied » de caméra s'arrête ensemble ;
   s'il tourne ou recule autour du point visé, la caméra garde ce qu'elle a pu faire. */
const CAM_WANT = { cam:null, dist:0 };
function camSettle(c, e0, t0, restore, zoom){
  const id = shot().set, P = physScene(id); if(!P) return;
  const t = [c.tx, c.ty, c.tz], rig = Math.hypot(t[0] - t0[0], t[1] - t0[1], t[2] - t0[2]) > 1e-9;
  if(restore && !rig && CAM_WANT.cam === c && CAM_WANT.dist > c.dist + 0.01) c.dist = Math.min(CAM_WANT.dist, c.dist + 0.12);   // le recul voulu revient peu à peu quand la place se libère
  const want = camEyeRaw(c), e = physMove(P, e0, want);
  if(Math.hypot(e[0] - want[0], e[1] - want[1], e[2] - want[2]) < 1e-6) return;
  if(rig){ c.tx += e[0] - want[0]; c.ty += e[1] - want[1]; c.tz += e[2] - want[2]; return; }
  // on tourne autour du point visé : la caméra garde exactement l'angle demandé et se rapproche le long de la ligne
  // de visée, juste devant ce qui la gêne (elle ne glisse plus de travers, donc elle ne sautille plus)
  if(physIn(P, t)){
    const y = c.yaw * D2R, pp = c.pitch * D2R, dir = [Math.cos(pp) * Math.sin(y), -Math.sin(pp), Math.cos(pp) * Math.cos(y)];
    const f = physRay(P, t, dir, c.dist);
    const nd = Math.max(0.05, Math.min(c.dist, f)), q = [t[0] + dir[0] * nd, t[1] + dir[1] * nd, t[2] + dir[2] * nd];
    // (sauf si cet endroit est dans un meuble qui contient aussi le point visé : alors on reste physique)
    // (et seulement si ce n'est pas un grand saut : loin dehors, mieux vaut glisser le long du décor que bondir à travers)
    const pd = Math.hypot(e[0] - t[0], e[1] - t[1], e[2] - t[2]);
    // zoomer (molette, pincement) : on recule ou on avance sur la ligne de visée, sans jamais tourner ; bloqué, on reste
    if(zoom){
      const d0 = Math.hypot(e0[0] - t[0], e0[1] - t[1], e0[2] - t[2]), at = k => [t[0] + dir[0] * k, t[1] + dir[1] * k, t[2] + dir[2] * k], h0 = physHit(P, e0);
      let k = Math.max(0.05, Math.min(c.dist, Math.max(f, d0)));
      // en avançant, on s'arrête devant un meuble qui se trouve entre la caméra et le sujet (on ne rentre pas dedans)
      const bad = k => { const q = at(k), h = physHit(P, q); return (h >= 0 && h !== h0) || physWall(P, e0, q); };
      if(k < d0) for(let a = d0; a > k; a -= 0.04){ if(bad(Math.max(k, a - 0.04))){ k = a; break; } }
      c.dist = k; return;
    }
    if(f >= Math.min(c.dist, 0.3) && nd > pd - 0.6 && (physHit(P, q) < 0 || physHit(P, e0) >= 0) && !physWall(P, e0, q)){ c.dist = nd; return; }
  }
  const v = [e[0] - c.tx, e[1] - c.ty, e[2] - c.tz], d = Math.hypot(...v); if(d < 0.05) return;
  const yaw = Math.atan2(v[0], v[2]) / D2R;
  c.yaw = yaw + Math.round((c.yaw - yaw) / 360) * 360; c.pitch = clamp(-Math.asin(clamp(v[1] / d, -1, 1)) / D2R, -89, 89); c.dist = d;
}
/* jusqu'où l'objectif peut reculer depuis le point visé t, dans la direction dir (sans traverser ni sortir du lieu) */
function physRay(P, t, dir, maxd){
  const skip = new Set(); for(let i = physHit(P, t); i >= 0; i = physHit(P, t, skip)) skip.add(i);
  const inT = physIn(P, t);
  let p = t, d = 0;
  while(d < maxd){
    const nd = Math.min(maxd, d + 0.04), q = [t[0] + dir[0] * nd, t[1] + dir[1] * nd, t[2] + dir[2] * nd];
    if(Math.abs(physY(P, q) - q[1]) > 1e-6 || physHit(P, q, skip) >= 0 || physWall(P, p, q) || (inT && !physIn(P, q))) return Math.max(0, d - 0.02);
    p = q; d = nd;
  }
  return d;
}
/* le recul que l'on a demandé (molette, pincement) : la caméra y revient d'elle-même, doucement, dès qu'il y a la place */
function camWant(c){ CAM_WANT.cam = c; CAM_WANT.dist = c.dist; }
/* une caméra posée d'un coup (un cadrage, une pièce) : si quelque chose se trouve entre le point visé et
   l'objectif, l'objectif se pose juste devant ; la focale s'élargit pour garder la même taille de sujet */
function camSafe(c, id, fit){
  const P = id !== 'taxi' && physOf(id); if(!P) return c;   // les prises de vue du taxi (et des véhicules) sont faites pour passer par les vitres
  const t = [c.tx, c.ty, c.tz];
  // jusqu'où l'objectif peut reculer depuis le point visé, dans la direction (yaw, pitch)
  const free = (yaw, pitch) => { const y = yaw * D2R, pp = pitch * D2R; return physRay(P, t, [Math.cos(pp) * Math.sin(y), -Math.sin(pp), Math.cos(pp) * Math.cos(y)], c.dist); };
  let d = free(c.yaw, c.pitch);
  if(d >= c.dist - 0.02) return c;
  // un cadrage tout prêt qui tombe dans un meuble (un comptoir, un dossier) : on cherche l'angle le plus proche
  // d'où l'on voit vraiment le sujet, un peu plus haut ou un peu sur le côté, plutôt que de coller l'objectif au sujet
  if(fit && d < c.dist * 0.8){
    let best = null;
    let most = null;
    for(const dp of [0, -8, -16, -26, -40]) for(const dy of [0, 12, -12, 24, -24, 38, -38, 55, -55, 75, -75, 100, -100, 130, -130]){
      if(!dp && !dy) continue;
      const pt = clamp(c.pitch + dp, -60, 60), f = free(c.yaw + dy, pt), cost = Math.abs(dy) + Math.abs(dp) * 1.4;
      if(f >= c.dist * 0.92 && (!best || cost < best.cost)) best = { cost, yaw:c.yaw + dy, pitch:pt, d:f };
      if(!most || f - cost * 0.01 > most.d - most.cost * 0.01) most = { cost, yaw:c.yaw + dy, pitch:pt, d:f };
    }
    // aucun angle ne laisse tout le recul (un personnage collé à un comptoir) : celui qui en laisse le plus
    if(!best && most && most.d > Math.max(d * 1.5, 0.45)) best = most;
    if(best){ c.yaw = best.yaw; c.pitch = best.pitch; d = Math.min(best.d, c.dist); if(d >= c.dist - 0.02) return c; }
  }
  // juste devant ce qui gêne : jamais dans le meuble lui-même
  const nd = Math.max(0.05, d);
  if(fit && c.lens) c.lens = clamp(c.lens * nd / c.dist, 14, 200);
  c.dist = nd;
  return c;
}
/* l'objectif : là où on l'a mis */
const camEye = c => camEyeRaw(c);
function viewProj(c, aspect){
  const e = camEye(c), r = (c.roll || 0) * D2R;
  // le débullé tourne l'image autour de l'axe de la caméra ; on voit loin dans les grands espaces
  return M4.mul(M4.persp(fovOf(c.lens), aspect, 0.06, 320), M4.mul(M4.rz(r), M4.lookAt(e, [c.tx, c.ty, c.tz], [0, 1, 0])));
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
function camEdit(fn, keepLens){ const before = clone(shot().cam); edit(() => { fn(); const s = shot(); camSafe(s.cam, s.set, !keepLens); CAM_WANT.cam = null; }); startTween(before); }
/* un geste de caméra (tourner, se décaler, zoomer, avancer) : l'objectif y va physiquement */
function camGesture(c, fn, zoom){
  const e0 = camEyeRaw(c), t0 = [c.tx, c.ty, c.tz];
  fn(); keepCam(c);
  const asked = c.dist; camSettle(c, e0, t0, !zoom, zoom);
  if(zoom){ camWant(c); CAM_WANT.dist = Math.min(asked, c.dist + 1.5); }
}

/* ---------- Rendu ---------- */
const R = { canvas:null, sets:{}, parts:{}, out:{}, blob:null, raf:0, crowds:new Map(), scale:1 };
function setMesh(id){
  if(!R.sets[id]){ const o = setGeo(id); R.sets[id] = { g:GL.mesh(o.g), gl:GL.mesh(edgeLines(o.g)), glass:o.glass.p.length ? GL.mesh(o.glass) : null, levels:o.levels.map(l => GL.mesh(l)), levelsL:o.levels.map(l => GL.mesh(edgeLines(l))),
    panes:o.panes ? GL.mesh(o.panes) : null, levelPanes:o.levelPanes.map(l => l ? GL.mesh(l) : null) }; }
  return R.sets[id];
}
/* les formes d'un personnage (et de son contour), fabriquées une fois, à la demande pour les tenues */
function lookMesh(lk){
  if(!R.parts[lk.id]){ R.parts[lk.id] = {}; R.out[lk.id] = {};
    JOINTS.forEach(J => { GEO_K = 0.8; R.parts[lk.id][J.id] = GL.mesh(partGeo(J.id, lk)); GEO_K = 0.55; R.out[lk.id][J.id] = GL.mesh(smoothNormals(partGeo(J.id, lk, true))); GEO_K = 1; }); }
  return { parts:R.parts[lk.id], out:R.out[lk.id] };
}
function initMeshes(){
  CHAR_LOOK.forEach(lk => {
    R.parts[lk.id] = {}; R.out[lk.id] = {};
    JOINTS.forEach(J => { GEO_K = 0.8; R.parts[lk.id][J.id] = GL.mesh(partGeo(J.id, lk)); GEO_K = 0.55; R.out[lk.id][J.id] = GL.mesh(smoothNormals(partGeo(J.id, lk, true))); GEO_K = 1; });
  });
  const g = geo(), C = [0.08, 0.09, 0.11];
  for(let i = 0; i < 16; i++){ const a = i / 16 * Math.PI * 2, b = (i + 1) / 16 * Math.PI * 2; tri(g, [0, 0, 0], [Math.sin(b) * 0.36, 0, Math.cos(b) * 0.36], [Math.sin(a) * 0.36, 0, Math.cos(a) * 0.36], C); }
  R.blob = GL.mesh(g);
  { const gg = geo(), C = [1, 1, 1];   // la grille du sol de « Ma photo » : un carré de 12 m, un trait par mètre
    for(let k = -6; k <= 6; k++){ quad(gg, [k - 0.008, 0.002, -6], [k - 0.008, 0.002, 6], [k + 0.008, 0.002, 6], [k + 0.008, 0.002, -6], C); quad(gg, [-6, 0.002, k - 0.008], [6, 0.002, k - 0.008], [6, 0.002, k + 0.008], [-6, 0.002, k + 0.008], C); }
    R.phGrid = GL.mesh(gg); }
  { const a = geo(), b = geo(), C = [1, 1, 1];   // la flèche : un trait (largeur 1, longueur 1) et une pointe
    quad(a, [-0.5, 0, 0], [-0.5, 0, 1], [0.5, 0, 1], [0.5, 0, 0], C); tri(b, [-0.5, 0, 0], [0, 0, 1], [0.5, 0, 0], C);
    R.arShaft = GL.mesh(a); R.arHead = GL.mesh(b); }
  R.props = {}; R.propsOut = {};
  PROPS.map(p => p[0]).concat(['holster']).forEach(id => { R.props[id] = GL.mesh(propGeo(id)); R.propsOut[id] = GL.mesh(smoothNormals(propGeo(id))); });
}
/* un véhicule (forme et couleur), fabriqué une fois */
R.veh = {};
function vehMesh(v){ const k = v.kind + v.col; if(!R.veh[k]){ const G = geo(), g = vehicleGeo(v.kind, v.col, G); R.veh[k] = GL.mesh(g); R.veh[k + ':l'] = GL.mesh(edgeLines(g)); R.veh[k + ':g'] = G.p.length ? GL.mesh(G) : null; } return R.veh[k]; }
function vehGlass(v){ vehMesh(v); return R.veh[v.kind + v.col + ':g']; }
function vehLines(v){ vehMesh(v); return R.veh[v.kind + v.col + ':l']; }
const vehMat = v => M4.mul(M4.trans(v.x, v.y || 0, v.z), M4.ry((v.ry || 0) * D2R));
/* les étages qu'on dessine : tous, toujours (la caméra ne passe plus à travers les plafonds) */
function levelsShown(sh, cam){
  const d = SET_DEF[sh.set]; if(!d.levels) return [];
  // la caméra reste toujours sous le plafond de sa pièce : les étages du dessus restent en place
  // (sinon, en regardant l'escalier depuis le rez-de-chaussée, on voyait le vide à la place de l'étage)
  return d.levels.map(() => true);
}
function drawSet(SM, sh, cam, o, lines){
  const gl = GL.gl, show = SM.levels.length ? levelsShown(sh, cam) : [];
  // les faces un peu repoussées : le trait des arêtes passe toujours devant
  if(lines){ gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1, 1); }
  const lv = SET_DEF[sh.set].levels || [];
  GL.draw(SM.g, o); SM.levels.forEach((m, i) => { if(show[i]) GL.draw(m, Object.assign({}, o, { floor:lv[i] || 0 })); });
  if(lines){
    gl.disable(gl.POLYGON_OFFSET_FILL); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    const L = { flat:true, lines:true, col:INK, a:0.3 };
    // les traits d'un étage au-dessus de la caméra ne se dessinent pas : collés au plafond, ils transparaîtraient à travers
    const ey = camEye(cam)[1], here = lv.reduce((b, y, i) => ey >= y - 0.2 ? i : b, 0);
    GL.draw(SM.gl, L); SM.levelsL.forEach((m, i) => { if(show[i] && i <= here) GL.draw(m, L); });
    gl.depthMask(true); gl.disable(gl.BLEND);
  }
}
/* les foules d'un plan : celle du lieu (les tribunes du stade) et celles qu'on a posées */
function crowdMeshes(sh){
  const out = [], get = (key, make) => {
    let m = R.crowds.get(key);
    if(!m){ m = GL.crowdMesh(crowdData(make())); R.crowds.set(key, m);
      if(R.crowds.size > 48){ const k = R.crowds.keys().next().value; GL.freeCrowd(R.crowds.get(k)); R.crowds.delete(k); } }
    out.push(m);
  };
  const def = SET_DEF[sh.set]; if(def.crowd) get('set:' + sh.set, def.crowd);
  (sh.crowds || []).forEach(c => get(JSON.stringify(c), () => crowdSprites(c)));
  return out;
}
function requestRender(){
  if(R.raf || S.rec || S.play) return;
  // pendant qu'on bouge : l'image à sa finesse normale (fluide) ; dès qu'on s'arrête, une image plus fine
  if(R.sharp){ R.sharp = false; R.canvas.width = R.baseW; R.canvas.height = R.baseH; }
  clearTimeout(R.sharpT); R.sharpT = setTimeout(sharpen, R.bench > 45 ? 380 : 200);
  R.raf = requestAnimationFrame(() => { R.raf = 0; drawFrame(); if(S.tween || NAV.held) requestRender(); });
}
/* l'image au repos, calculée plus finement (jusqu'à 2 pixels par pixel d'écran) : les traits des visages,
   les bords des meubles deviennent nets. Une seule image, quand plus rien ne bouge : rien ne ralentit,
   même sur un vieil ordinateur (s'il est très lent, on affine moins). */
function sharpen(){
  if(!R.canvas || !R.baseW || R.sharp || S.rec || S.play) return;
  if(R.raf || DRAG.mode || HDRAG.c >= 0 || NAV.running || S.tween || document.hidden){ R.sharpT = setTimeout(sharpen, 200); return; }
  const dpr = window.devicePixelRatio || 1, want = Math.min(2, Math.max(dpr, 1) * (R.bench > 45 ? 1 : R.bench > 25 ? 1.5 : 2)), base = R.baseW / (R.cssW || R.baseW);
  let k = want / base; if(R.baseW * R.baseH * k * k > 4.2e6) k = Math.sqrt(4.2e6 / (R.baseW * R.baseH));
  if(k < 1.08) return;
  R.canvas.width = Math.round(R.baseW * k); R.canvas.height = Math.round(R.baseH * k); R.sharp = true;
  R.inSharp = true; drawFrame(); R.inSharp = false;   // la même image, plus fine : rien à revérifier (ce que cache le décor)
}
const GHOST_C = hexRGB('#5B8FD6'), BG = hexRGB('#DCE0E7'), GREEN = hexRGB('#22A06B'), GREEN_L = hexRGB('#7FD1A8'), GHOST = hexRGB('#3E4552'), INK = hexRGB('#1B1E24');
/* l'ambiance du lieu : le fond, le ciel, la brume, et le noir et blanc du film */
/* le moment de la journée, plan par plan : le ciel change, la lumière se teinte (chaude au couchant, bleue la nuit) ;
   dedans, la nuit, ce sont les lampes : plus chaud et un peu plus sombre. Les personnages restent toujours lisibles. */
const TIMES = {
  day:{ fr:'Jour', en:'Day' },
  dusk:{ fr:'Soir', en:'Dusk', sky:{ top:'#41507E', hor:'#F2AA6C', low:'#5E5050' }, out:[1.07, 0.86, 0.7], in:[1.03, 0.92, 0.8], ch:[1.05, 0.93, 0.84] },
  night:{ fr:'Nuit', en:'Night', sky:{ top:'#060A15', hor:'#1B2740', low:'#0D1017' }, out:[0.36, 0.44, 0.66], in:[0.8, 0.72, 0.58], ch:[0.66, 0.72, 0.9], chIn:[0.92, 0.85, 0.74] },
};
function envOf(sh, cam){
  const d = SET_DEF[sh.set], T = TIMES[sh.info && sh.info.time] || TIMES.day, sky = d.sky && T.sky ? T.sky : d.sky;
  // dans une maison (un lieu avec un jardin), quand la caméra est à l'intérieur : la lumière des pièces, pas celle du dehors
  // (la nuit, les lampes sont allumées, comme dans tous les lieux fermés)
  const e = cam && d.box ? camEye(cam) : null, inside = !!(e && e[0] > d.box[0] && e[0] < d.box[2] && e[2] > d.box[1] && e[2] < d.box[3]);
  const outLight = d.sky && !inside;
  let bg = d.bg ? hexRGB(d.bg) : BG;
  if(T.out && !d.sky) bg = bg.map((v, i) => v * T.in[i]);
  // le dehors vu par les fenêtres : le ciel du lieu (ou un ciel de jour, de soir ou de nuit pour un lieu fermé)
  const ws = T.sky || d.sky || { top:'#86AFD3', hor:'#DCE6EE' };
  return { bg, sky, fogC:sky ? hexRGB(sky.hor) : bg, fog:d.fog || [400, 500], bw:S.doc && S.doc.style === 'bw', winT:hexRGB(ws.top), winH:hexRGB(ws.hor), view:d.view,
    grade:T.out ? (outLight ? T.out : T.in) : null, gradeC:T.ch ? (outLight ? T.ch : (T.chIn || T.ch)) : null };
}
/* dessine un plan ; « clean » : l'image du film, sans aide (exports, vignettes).
   « o » (lecture, animatique) : { cam, chars } pour une image en mouvement. */
/* ce que le personnage porte sur lui : le pistolet dans son étui sur la hanche droite, le fusil en travers du dos */
function gearOf(ch, M){
  const out = [], G = ch.gear || {};
  if(G.holster && ch.prop !== 'gun'){ const m = M4.mul(M.pelvis, M4.trans(-0.19, 0.02, 0.02)); out.push(['holster', m], ['gun', m]); }
  if(G.sling && ch.prop !== 'rifle') out.push(['rifle', M4.mul(M.chest, M4.mul(M4.trans(0, 0.1, -0.17), M4.mul(M4.rz(-0.75), M4.ry(Math.PI))))]);
  return out;
}
/* le regard : la tête (et un peu le torse) se tourne vers la caméra ou vers un autre personnage, à chaque image.
   On calcule la direction dans le repère du torse, puis les deux angles de la tête (tourner, hocher). */
function gazed(ch, cam, chars){
  const gz = ch.gaze; if(gz == null || gz === '') return ch;
  let t;
  if(gz === 'cam') t = camEye(cam);
  else { const o = chars[+gz]; if(!o || o === ch) return ch; const Mo = charMatrices(o); t = M4.apply(Mo.head, [0, 0.12, 0.04]); }
  const c = Object.assign({}, ch, { j:Object.assign({}, ch.j) }), M = charMatrices(ch);
  const l = M4.apply(M4.invert(M.chest), t), d = [l[0], l[1] - 0.45, l[2]];
  let yaw = Math.atan2(d[0], d[2]) / D2R; const pitch = Math.atan2(d[1], Math.hypot(d[0], d[2])) / D2R;
  if(Math.abs(yaw) > 150) return ch;   // derrière lui : il ne se dévisse pas le cou
  const ct = clamp(yaw * 0.3, -30, 30), ch0 = (ch.j.chest || [0, 0, 0]).slice(); ch0[1] = clamp((ch0[1] || 0) + ct, -35, 35); c.j.chest = ch0;
  const h0 = (ch.j.head || [0, 0, 0]).slice(); h0[1] = clamp(yaw - ct, -80, 80); h0[0] = clamp(-pitch, -45, 55); c.j.head = h0;
  return c;
}
/* la flèche de déplacement d'un personnage, posée au sol (comme sur un storyboard dessiné) */
const ARROW_DIR = { f:0, l:90, r:-90, b:180 };
function drawArrows(chars, mats, final){
  const gl = GL.gl; gl.disable(gl.CULL_FACE); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  chars.forEach((ch, c) => {
    const A = ch.arrow; if(!A || !A.len) return;
    const M = mats[c], fy = Math.max(0, Math.min(M4.apply(M.footL, [0, -0.065, 0.05])[1], M4.apply(M.footR, [0, -0.065, 0.05])[1])) + 0.014, p = M4.apply(M.pelvis, [0, 0, 0]);
    const a = (ch.root.ry + (ARROW_DIR[A.dir] || 0)) * D2R, L_ = A.len, base = M4.mul(M4.trans(p[0], fy, p[2]), M4.ry(a));
    const part = (w, z0, z1, mesh, col, al, y) => GL.draw(mesh, { m:M4.mul(M4.mul(base, M4.trans(0, y, z0)), [w, 0, 0, 0, 0, 1, 0, 0, 0, 0, z1 - z0, 0, 0, 0, 0, 1]), flat:true, col, a:al });
    // le contour sombre, puis la flèche verte par-dessus
    part(0.2, 0.4, L_ - 0.3, R.arShaft, INK, 0.85, 0); part(0.52, L_ - 0.4, L_ + 0.07, R.arHead, INK, 0.85, 0);
    part(0.13, 0.43, L_ - 0.3, R.arShaft, GREEN, 0.95, 0.004); part(0.4, L_ - 0.35, L_, R.arHead, GREEN, 0.95, 0.004);
  });
  gl.disable(gl.BLEND); gl.enable(gl.CULL_FACE);
}
function drawFrame(sh, w, h, clean, o){
  const gl = GL.gl; if(!gl) return;
  sh = sh || shot(); w = w || R.canvas.width; h = h || R.canvas.height; CAM_SET = sh.set;
  const final = clean || S.final;
  // sur un petit ordinateur, pendant qu'on bouge : une image plus simple (sans contours ni filigranes) ;
  // dès qu'on s'arrête, l'image complète revient
  const moving = !clean && !o && (DRAG.mode || HDRAG.c >= 0 || NAV.running || S.tween || _wheelSnap);
  // on mesure le temps entre deux images quand on bouge : si l'ordinateur peine, on passe en image simplifiée
  if(moving){ const now = performance.now(), dt = now - (R.lastT || 0); R.lastT = now; if(dt < 250){ R.dtAvg = R.dtAvg ? R.dtAvg * 0.8 + dt * 0.2 : dt; if(R.dtAvg > 30) R.slow = true; } }
  const fast = moving && R.slow;
  const cam = (o && o.cam) || (clean ? camStart(sh) : viewCam(sh));
  const vp = viewProj(cam, w / h), eye = camEye(cam);
  const E = envOf(sh, cam);
  GL.begin(w, h, vp, E.bg, E);
  const ph = sh.set === 'photo' && sh.photo && PHOTOS.get(sh.photo), phT = ph && GL.photoTex(ph, () => { THUMBS.clear(); if(typeof renderStrip === 'function') renderStrip(); requestRender(); });
  if(phT){ const fbx = S.doc && S.doc.shots.indexOf(sh) >= 0 && frameBox(w, h); GL.drawPhoto(phT, fbx ? fbx.w / fbx.h : w / h); }
  else if(E.sky) GL.drawSky(vp, hexRGB(E.sky.top), hexRGB(E.sky.hor), hexRGB(E.sky.low), 0, w / h);
  // en travaillant, le décor qui cache un personnage devient transparent ; à l'export, il reste en place
  const chars = (o && o.chars) || sh.chars, mats = chars.map(ch => charMatrices(gazed(ch, cam, chars)));
  // on ne perce le décor que pour ceux qu'il cache vraiment (vérifié à l'arrêt), et pour celui qu'on déplace :
  // sur un petit ordinateur, c'est autant de calcul en moins
  // le décor ne se perce plus (plus de trou rond) : qui est caché se voit en silhouette claire, par-dessus
  const tube = [];
  GL.view(eye, tube.map(c => M4.apply(mats[c].chest, [0, 0.12, 0])));
  const SM = setMesh(sh.set);
  if(sh.set !== 'photo'){ drawSet(SM, sh, cam, { vc:true }, !fast);
    // les vitres des fenêtres : le dehors, vu à travers (avec les étages visibles)
    const show = SM.levels.length ? levelsShown(sh, cam) : [], pm = [SM.panes].concat(SM.levelPanes.filter((m, i) => show[i])).filter(Boolean);
    if(pm.length) GL.drawPanes(pm, vp, eye); }
  else if(!final){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false); gl.disable(gl.CULL_FACE); GL.draw(R.phGrid, { flat:true, col:[1, 1, 1], a:0.38 }); gl.enable(gl.CULL_FACE); gl.depthMask(true); gl.disable(gl.BLEND); }   // la grille du sol : pour caler la caméra sur la photo
  (sh.vehicles || []).forEach(v => { const M = vehMat(v); GL.draw(vehMesh(v), { m:M, vc:true, floor:v.y || 0 }); if(!fast){ gl.enable(gl.BLEND); gl.depthMask(false); GL.draw(vehLines(v), { m:M, flat:true, lines:true, col:INK, a:0.3 }); gl.depthMask(true); gl.disable(gl.BLEND); } });
  // une ombre douce sous chaque personnage (trois disques très légers, pas de calcul d'ombre)
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
  chars.forEach((ch, c) => {
    const M = mats[c], fy = Math.min(M4.apply(M.footL, [0, -0.065, 0.05])[1], M4.apply(M.footR, [0, -0.065, 0.05])[1]), k = bodyScale(lookOf(ch, c));
    const p = M4.apply(M.pelvis, [0, 0, 0]);
    [[1.25, 0.08], [0.9, 0.11], [0.55, 0.14]].forEach(([r, a]) => GL.draw(R.blob, { m:M4.mul(M4.trans(p[0], Math.max(0, fy) + 0.008, p[2]), [r * k, 0, 0, 0, 0, 1, 0, 0, 0, 0, r * k, 0, 0, 0, 0, 1]), flat:true, a, col:[0.06, 0.07, 0.09] }));
  });
  // et sous chaque véhicule (sous un hélicoptère en vol, l'ombre pâlit avec l'altitude)
  const VSH = { moto:[0.4, 1.05], car:[1.1, 2.6], police:[1.1, 2.6], heli:[1.3, 3.0], plane:[1.2, 3.6] };
  (sh.vehicles || []).forEach(v => { const e = VSH[v.kind] || (VEH_DEF[v.kind] && VEH_DEF[v.kind].sh) || VSH.car, alt = v.y || 0, f = 1 / (1 + alt * 0.25);
    [[1.12, 0.07], [0.9, 0.12]].forEach(([r, a]) => GL.draw(R.blob, { m:M4.mul(M4.mul(M4.trans(v.x, 0.01, v.z), M4.ry((v.ry || 0) * D2R)), [e[0] / 0.36 * r, 0, 0, 0, 0, 1, 0, 0, 0, 0, e[1] / 0.36 * r, 0, 0, 0, 0, 1]), flat:true, a:a * f, col:[0.06, 0.07, 0.09] })); });
  gl.depthMask(true); gl.disable(gl.BLEND);
  if(chars.some(ch => ch.arrow && ch.arrow.len)) drawArrows(chars, mats, final);
  GL.drawCrowds(crowdMeshes(sh), vp, eye, [Math.cos(cam.yaw * D2R), 0, -Math.sin(cam.yaw * D2R)]);
  // en travaillant : les parties cachées par le décor (mur, voiture) sont dessinées en filigrane,
  // avant les personnages, pour qu'elles n'apparaissent que là où le décor passe devant
  if(!final && !fast){
    gl.enable(gl.BLEND); gl.depthMask(false); gl.depthFunc(gl.GREATER);
    chars.forEach((ch, c) => { const on = S.sel && S.sel.c === c, P = lookMesh(lookOf(ch, c)).out; for(const J of JOINTS) GL.draw(P[J.id], { m:mats[c][J.id], flat:true, a:on ? 0.5 : 0.34, col:on ? GREEN : GHOST_C }); });
    gl.depthFunc(gl.LESS); gl.depthMask(true); gl.disable(gl.BLEND);
  }
  const tintOf = (c, id) => final ? [null, 0] : (S.sel && S.sel.c === c && S.sel.j === id && (id !== 'pelvis' || S.sel.pick)) ? [GREEN, 0.42] : (S.hover && S.hover.c === c && S.hover.j === id) ? [GREEN_L, 0.26] : [null, 0];
  // le contour des personnages : comme un trait de crayon, d'épaisseur constante à l'écran
  const px = 2 * Math.tan(fovOf(cam.lens) / 2) / h * clamp(h / 280, 1.7, 3.4);
  if(!fast) gl.cullFace(gl.FRONT);
  if(!fast) chars.forEach((ch, c) => { const P = lookMesh(lookOf(ch, c)).out; for(const J of JOINTS) GL.draw(P[J.id], { m:mats[c][J.id], flat:true, col:INK, out:px });
    if(ch.prop && R.propsOut[ch.prop]) GL.draw(R.propsOut[ch.prop], { m:mats[c].handR, flat:true, col:INK, out:px });
    gearOf(ch, mats[c]).forEach(([id, m]) => GL.draw(R.propsOut[id], { m, flat:true, col:INK, out:px })); });
  gl.cullFace(gl.BACK);
  chars.forEach((ch, c) => { if(ch.prop && R.props[ch.prop]) GL.draw(R.props[ch.prop], { m:mats[c].handR, col:[1, 1, 1], mul:true, char:ch.prop !== 'gun' && ch.prop !== 'rifle' });   // l'arme garde son éclat de métal
    gearOf(ch, mats[c]).forEach(([id, m]) => GL.draw(R.props[id], { m, col:[1, 1, 1], mul:true, char:id === 'holster' })); });
  chars.forEach((ch, c) => {
    const P = lookMesh(lookOf(ch, c)).parts;
    for(const J of JOINTS){ const [tint, k] = tintOf(c, J.id); GL.draw(P[J.id], { m:mats[c][J.id], col:[1, 1, 1], tint, tintK:k, mul:true, char:true }); }
  });
  // les vitres, transparentes (des deux côtés)
  const vg = (sh.vehicles || []).filter(v => vehGlass(v));
  if(SM.glass || vg.length){ gl.disable(gl.CULL_FACE); gl.enable(gl.BLEND); gl.depthMask(false);
    if(SM.glass) GL.draw(SM.glass, { vc:true, glass:true, a:0.2 });
    vg.forEach(v => GL.draw(vehGlass(v), { m:vehMat(v), vc:true, glass:true, a:0.2 }));
    gl.depthMask(true); gl.disable(gl.BLEND); gl.enable(gl.CULL_FACE); }
  if(tube.length && !fast){
    gl.enable(gl.BLEND); gl.depthMask(false);
    // le décor coupé autour des personnages, remis en transparence par-dessus
    drawSet(SM, sh, cam, { vc:true, x:2, a:0.22 });
    gl.depthMask(true); gl.disable(gl.BLEND);
  }
  if(clean) GL.drawSky(vp, [0, 0, 0], [0, 0, 0], [0, 0, 0], 1, w / h);   // dans les images exportées : un léger vignettage, comme une vraie optique
  // le format du film (2.39, 4:3, 9:16…) : des bandes noires autour du cadre, partout (écran, vignettes, planche, animatique)
  const fb = S.doc.shots.indexOf(sh) >= 0 && frameBox(w, h);
  if(fb){ gl.enable(gl.SCISSOR_TEST); gl.clearColor(0.07, 0.075, 0.085, 1);
    (fb.x > 0 ? [[0, 0, fb.x, h], [fb.x + fb.w, 0, w - fb.x - fb.w, h]] : [[0, 0, w, fb.y], [0, fb.y + fb.h, w, h - fb.y - fb.h]]).forEach(([x, y, bw, bh]) => { gl.scissor(Math.floor(x), Math.floor(y), Math.ceil(bw), Math.ceil(bh)); gl.clear(gl.COLOR_BUFFER_BIT); });
    gl.disable(gl.SCISSOR_TEST); }
  if(!clean && w === R.canvas.width){ R.pickDirty = true; placeHandles(sh, vp, w, h, mats); if(!o && !R.inSharp) hiddenLater(); if(typeof planMarker === 'function'){ planMarker(); techMarker(); } }
  CAM_SET = null;
}
/* les petits ordinateurs : on mesure une fois le temps d'une image ; si c'est lent, l'image de travail
   est calculée un peu moins finement (les exports, eux, gardent toujours leur pleine taille) */
function benchmark(){
  const gl = GL.gl; if(!gl || !R.canvas) return;
  let n = 0;
  const px = new Uint8Array(4), sync = () => gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
  drawFrame(); sync();
  const t1 = performance.now();
  while(n < 3){ drawFrame(); sync(); n++; }
  const ms = (performance.now() - t1) / n; R.slow = ms > 20;
  const scale = ms > 60 ? 0.6 : ms > 32 ? 0.75 : 1;
  if(scale !== R.scale){ R.scale = scale; fitStage(); }
  R.bench = ms;
}
/* les formats d'image : le cadre reste en 16:9, le format se voit par des bandes (comme sur un moniteur de tournage) */
const RATIOS = [['16:9', 16 / 9, '16:9 · TV, web'], ['1.85', 1.85, '1.85 · cinéma'], ['2.39', 2.39, '2.39 · scope'], ['4:3', 4 / 3, '4:3'], ['1:1', 1, '1:1 · carré'], ['9:16', 9 / 16, '9:16 · vertical']];
const ratioOf = () => (RATIOS.find(r => r[0] === (S.doc && S.doc.ratio)) || RATIOS[0])[1];
function frameBox(w, h){
  if(!S.doc || !S.doc.ratio) return null;   // en 16:9 (par défaut), jamais de bandes
  const r = ratioOf(), a = w / h; if(Math.abs(r - a) < 0.02) return null;
  if(r > a){ const hh = w / r; return { x:0, y:(h - hh) / 2, w, h:hh }; }
  const ww = h * r; return { x:(w - ww) / 2, y:0, w:ww, h };
}
/* une petite image dessinée hors de l'écran, deux fois plus grande puis réduite (les bords restent doux) */
const _offC = {};
function offscreenURL(w, h, draw, q){
  if(!GL.gl) return '';
  const ss = 2, W = w * ss, H = h * ss, px = GL.renderTo(W, H, () => draw(W, H));
  const big = _offC.big || (_offC.big = document.createElement('canvas')), sm = _offC.sm || (_offC.sm = document.createElement('canvas'));
  big.width = W; big.height = H; sm.width = w; sm.height = h;
  const bx = big.getContext('2d'), im = bx.createImageData(W, H), row = W * 4;
  for(let y = 0; y < H; y++) im.data.set(px.subarray((H - 1 - y) * row, (H - y) * row), y * row);   // WebGL lit de bas en haut
  bx.putImageData(im, 0, 0);
  const sx = sm.getContext('2d'); sx.imageSmoothingQuality = 'high'; sx.drawImage(big, 0, 0, w, h);
  return sm.toDataURL('image/jpeg', q || 0.84);
}
/* vignettes de la planche : petites images, refaites seulement quand un plan change */
const THUMBS = new Map();
function thumbOf(i){
  const sh = S.doc.shots[i]; if(!sh || !GL.gl) return '';
  const key = sh.id + '|' + JSON.stringify([sh.set, sh.chars, camStart(sh), sh.crowds, sh.vehicles, S.doc.style, S.doc.ratio]);
  const t = THUMBS.get(sh.id); if(t && (t.key === key || S.play || S.rec)) return t.url;
  if(S.rec) return '';
  const url = offscreenURL(320, 180, (w, h) => drawFrame(sh, w, h, true));
  THUMBS.set(sh.id, { key, url });
  return url;
}
let _thumbT = 0;
function thumbLater(i, all){
  clearTimeout(_thumbT);
  _thumbT = setTimeout(() => {
    if(all){ renderStrip(); return; }
    document.querySelectorAll(`[data-thumb="${i}"]`).forEach(img => img.src = thumbOf(i));
    const card = document.querySelector(`.shot-card[data-i="${i}"]`); if(card){ const b = card.querySelector('.sc-t b'); if(b) b.textContent = shotLabel('size', S.doc.shots[i].info.size, true); }
  }, all ? 0 : 200);
}

/* ---------- Le décor cache-t-il quelqu'un dans l'image finale ? ----------
   En travaillant, on voit à travers les meubles ; l'image du film, elle, les garde.
   On vérifie (sur une petite image, seulement quand on s'arrête de bouger) si la tête
   ou le corps d'un personnage disparaît derrière le décor, pour prévenir. */
let _hidT = 0;
function hiddenLater(){ clearTimeout(_hidT); _hidT = setTimeout(checkHidden, 380); }
function checkHidden(){
  const gl = GL.gl; if(!gl || S.play || S.rec || DRAG.mode || HDRAG.c >= 0) return;
  const sh = shot(), cam = sh.cam, sc = 0.5, w = Math.max(1, Math.round(R.canvas.width * sc)), h = Math.max(1, Math.round(R.canvas.height * sc));
  const vp = viewProj(cam, R.canvas.width / R.canvas.height);
  GL.beginPick(w, h, vp); GL.view(camEye(cam), []);
  drawSet(setMesh(sh.set), sh, cam, { raw:true, col:[0, 0, 0] });
  (sh.vehicles || []).forEach(v => GL.draw(vehMesh(v), { m:vehMat(v), raw:true, col:[0, 0, 0] }));
  const mats = sh.chars.map(ch => charMatrices(ch));
  sh.chars.forEach((ch, c) => { const P = lookMesh(lookOf(ch, c)).parts; for(const J of JOINTS) GL.draw(P[J.id], { m:mats[c][J.id], raw:true, col:[(c * 32 + J.idx + 1) / 255, 0, 0] }); });
  const out = [];
  sh.chars.forEach((ch, c) => {
    const pts = [['head', M4.apply(mats[c].head, [0, 0.12, 0.05])], ['body', M4.apply(mats[c].chest, [0, 0.12, 0.08])]];
    let hid = 0, seen = 0;
    pts.forEach(([what, p]) => {
      const q = M4.apply(vp, p); if(q[2] < -1 || q[2] > 1 || Math.abs(q[0]) > 0.98 || Math.abs(q[1]) > 0.98) return;
      seen++;
      const id = GL.readPick(Math.floor((q[0] + 1) / 2 * w), Math.floor((q[1] + 1) / 2 * h), true);
      if(id === 0) hid++;
    });
    if(seen && hid === seen) out.push(c);
  });
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); R.pickDirty = true;
  const sig = out.join(',');
  if(sig !== (S.hidden || []).join(',')){ S.hidden = out; if(typeof renderWarn === 'function') renderWarn(); requestRender(); }
}

/* ---------- La poignée au-dessus de la tête (comme dans les Sims) ----------
   Une petite épingle verte (le visage de la mascotte) flotte au-dessus de chaque personnage : on la maintient pour
   déplacer le personnage, la petite flèche à côté sert à le faire tourner.
   C'est un élément de la page, posé sur l'image : il n'est jamais dans les exports. */
function placeHandles(sh, vp, w, h, mats){
  const host = document.getElementById('handles'); if(!host) return;
  const crowds = sh.crowds || [], vehs = sh.vehicles || [];
  const sig = sh.chars.map(ch => ch.look).join(',') + '|' + crowds.length + '|' + vehs.map(v => v.kind).join(',') + getLang();
  if(host.dataset.sig !== sig){
    host.dataset.sig = sig;
    host.innerHTML = sh.chars.map((_, c) => `<div class="hd" data-c="${c}">
      <button class="hd-move" data-hd="move" data-c="${c}" aria-label="${esc(L('Déplacer ', 'Move ') + L(lookOf(sh.chars[c], c).fr, lookOf(sh.chars[c], c).en))}"><svg viewBox="0 0 24 30" aria-hidden="true"><path class="pin" d="M12 1.6a10.2 10.2 0 0 1 4.3 19.5L12 28.4l-4.3-7.3A10.2 10.2 0 0 1 12 1.6z"/><path class="ft" d="M6.4 8.9l4.3 1.7M17.6 9.4l-4.3 1.2" stroke-width="2.1" stroke-linecap="round"/><circle class="fe" cx="9" cy="13.4" r="2.2"/><circle class="fe" cx="15" cy="13.4" r="2.2"/><circle class="fh" cx="9.7" cy="12.7" r=".65"/><circle class="fh" cx="15.7" cy="12.7" r=".65"/><path class="ft" d="M9.6 17.4h4.6" stroke-width="1.8" stroke-linecap="round"/></svg></button>
      <button class="hd-turn" data-hd="turn" data-c="${c}" aria-label="${esc(L('Tourner ', 'Turn ') + L(lookOf(sh.chars[c], c).fr, lookOf(sh.chars[c], c).en))}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8a5 5 0 1 0 1.6-3.7"/><path d="M3 2.6v3h3"/></svg></button>
      <span class="hd-name">${esc(L(lookOf(sh.chars[c], c).fr, lookOf(sh.chars[c], c).en))}</span>
    </div>`).join('') + crowds.map((_, k) => `<div class="hd hd-crowd" data-k="${k}">
      <button class="hd-move" data-hd="cmove" data-k="${k}" aria-label="${esc(L('Déplacer la foule', 'Move the crowd'))}">${icon('crowd')}<span>${L('Foule', 'Crowd')}</span></button>
      <button class="hd-turn" data-hd="cturn" data-k="${k}" aria-label="${esc(L('Tourner la foule', 'Turn the crowd'))}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8a5 5 0 1 0 1.6-3.7"/><path d="M3 2.6v3h3"/></svg></button>
    </div>`).join('') + vehs.map((v, k) => `<div class="hd hd-crowd hd-veh" data-k="${k}">
      <button class="hd-move" data-hd="vmove" data-k="${k}" aria-label="${esc(L('Déplacer le véhicule', 'Move the vehicle'))}">${icon((VEH_DEF[v.kind] || VEH_DEF.moto).ic)}<span>${esc((D => D.tag ? L(...D.tag) : L(D.fr, D.en))(VEH_DEF[v.kind] || VEH_DEF.moto))}</span></button>
      <button class="hd-turn" data-hd="vturn" data-k="${k}" aria-label="${esc(L('Tourner le véhicule', 'Turn the vehicle'))}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8a5 5 0 1 0 1.6-3.7"/><path d="M3 2.6v3h3"/></svg></button>
    </div>`).join('');
  }
  const r = R.canvas.getBoundingClientRect(), k = r.width / w;
  const put = (el, p, minY) => {
    const clip = [vp[0] * p[0] + vp[4] * p[1] + vp[8] * p[2] + vp[12], vp[1] * p[0] + vp[5] * p[1] + vp[9] * p[2] + vp[13], vp[3] * p[0] + vp[7] * p[1] + vp[11] * p[2] + vp[15]];
    // derrière la caméra : on cache la poignée
    if(clip[2] <= 0.05){ el.style.display = 'none'; return; }
    const x = (clip[0] / clip[2] + 1) / 2 * w * k, y = (1 - clip[1] / clip[2]) / 2 * h * k;
    el.style.display = x < -20 || y < -40 || x > r.width + 20 || y > r.height + 20 ? 'none' : '';
    el.style.transform = `translate(${Math.round(x)}px, ${Math.round(clamp(y, minY, r.height - 10))}px)`;
  };
  sh.chars.forEach((ch, c) => {
    const el = host.children[c]; if(!el) return;
    put(el, M4.apply(mats[c].head, [0, 0.62, 0]), 18);
    el.classList.toggle('on', (S.sel && S.sel.c === c) || S.target === c);
    el.classList.toggle('busy', HDRAG.c === c && !HDRAG.crowd);
  });
  crowds.forEach((cr, i) => {
    const el = host.children[sh.chars.length + i]; if(!el) return;
    put(el, [cr.x, (cr.y || 0) + 2.3, cr.z], 18);
    el.classList.toggle('on', S.crowd === i);
  });
  vehs.forEach((v, i) => {
    const el = host.children[sh.chars.length + crowds.length + i]; if(!el) return;
    put(el, [v.x, (v.y || 0) + (VEH_DEF[v.kind] || VEH_DEF.moto).label, v.z], 18);
    el.classList.toggle('on', S.veh === i);
  });
}
const HDRAG = { c:-1, kind:null, x:0, y:0, snap:null, moved:false, crowd:false };
function onHandleDown(e){
  const b = e.target.closest('[data-hd]'); if(!b || S.rec) return;
  e.preventDefault(); e.stopPropagation();
  const t0 = b.dataset.hd[0], crowd = t0 === 'c' ? 'crowd' : t0 === 'v' ? 'veh' : false, c = crowd ? +b.dataset.k : +b.dataset.c;
  if(crowd === 'crowd' ? !shot().crowds[c] : crowd === 'veh' ? !(shot().vehicles || [])[c] : !shot().chars[c]) return;
  b.setPointerCapture(e.pointerId);
  HDRAG.c = c; HDRAG.crowd = crowd; HDRAG.kind = crowd ? b.dataset.hd.slice(1) : b.dataset.hd; HDRAG.snap = snapshot(); HDRAG.moved = false; HDRAG.x = e.clientX; HDRAG.y = e.clientY;
  if(crowd === 'crowd'){ S.crowd = c; S.sel = null; if(typeof setPanel === 'function') setPanel('crowd', true); }
  else if(crowd === 'veh'){ S.veh = c; S.sel = null; if(typeof setPanel === 'function') setPanel('car', true); }
  else { S.target = c; S.sel = { c, j:'pelvis' }; }
  document.body.classList.add('dragging');
  renderSide(); renderTools(); renderHint(); requestRender();
}
function onHandleMove(e){
  if(HDRAG.c < 0) return;
  const o = HDRAG.crowd === 'crowd' ? shot().crowds[HDRAG.c] : HDRAG.crowd === 'veh' ? shot().vehicles[HDRAG.c] : shot().chars[HDRAG.c]; if(!o) return;
  const pos = HDRAG.crowd ? o : o.root;
  if(HDRAG.kind === 'move'){
    // la souris glisse, le personnage suit sur le sol : vers la droite de l'image, ou vers le fond
    const dx = e.clientX - HDRAG.x, dy = e.clientY - HDRAG.y; HDRAG.x = e.clientX; HDRAG.y = e.clientY;
    if(dx || dy){
      const c = viewCam(), eye = camEye(c), y = c.yaw * D2R;
      const vx = pos.x - eye[0], vy = 1.0 + (pos.y || 0) - eye[1], vz = pos.z - eye[2], d = Math.hypot(vx, vy, vz) || 1;
      const k = d * 2 * Math.tan(fovOf(c.lens) / 2) / (R.canvas.getBoundingClientRect().height || 500);
      const depth = 1 / clamp(Math.abs(vy) / d + 0.25, 0.35, 1);     // vu de haut, un pixel vers le fond fait moins de chemin
      const rx = Math.cos(y), rz = -Math.sin(y), fx = -Math.sin(y), fz = -Math.cos(y), lim = HDRAG.crowd ? 120 : 60;
      pos.x = clamp(pos.x + (rx * dx - fx * dy * depth) * k, -lim, lim);
      pos.z = clamp(pos.z + (rz * dx - fz * dy * depth) * k, -lim, lim);
      HDRAG.moved = true;
    }
  } else {
    const dx = e.clientX - HDRAG.x; HDRAG.x = e.clientX;
    if(dx){ pos.ry = (((pos.ry || 0) + dx * 0.8) % 360 + 540) % 360 - 180; HDRAG.moved = true; renderSide(true); }
  }
  if(HDRAG.crowd === 'veh'){ if(HDRAG.kind === 'move' && (VEH_DEF[o.kind] || {}).obj) o.y = supportY(shot(), o, o.y || 0); syncRiders(shot()); }
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
  // l'image de sélection n'est refaite que si la scène a bougé depuis : survoler ne coûte presque rien
  if(!R.pickDirty && GL.pickSize[0] === w && GL.pickSize[1] === h){
    GL.gl.bindFramebuffer(GL.gl.FRAMEBUFFER, GL.pickFB);
    const id0 = GL.readPick(Math.floor(px * sc), Math.floor(h - 1 - py * sc));
    if(!id0) return null; const c0 = Math.floor((id0 - 1) / 32), J0 = JOINTS[(id0 - 1) % 32];
    return J0 && sh.chars[c0] ? { c:c0, j:J0.id } : null;
  }
  R.pickDirty = false;
  GL.beginPick(w, h, viewProj(viewCam(), R.canvas.width / R.canvas.height));
  sh.chars.forEach((ch, c) => {
    const M = charMatrices(ch);
    const P = lookMesh(lookOf(ch, c)).parts;
    for(const J of JOINTS){ const id = c * 32 + J.idx + 1; GL.draw(P[J.id], { m:M[J.id], raw:true, col:[id / 255, 0, 0] }); }
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
    S.sel = Object.assign(hit, { pick:true }); S.target = hit.c; S.crowd = -1; DRAG.mode = hit.j === 'pelvis' ? 'move' : 'pose';
    // attraper une main ou un pied : tout le membre suit (Alt garde l'ancienne façon, articulation par articulation)
    DRAG.ik = DRAG.mode === 'pose' ? ikStart(hit.c, hit.j, e.altKey, x, y) : null;
    if(DRAG.mode === 'pose' && S.panel !== 'pose'){ S.panel = 'pose'; lsSet(LS_PANEL, 'pose'); }
    if(DRAG.mode === 'move'){ const ch = shot().chars[hit.c], g = groundAt(x, y, 0); DRAG.grab = g ? [ch.root.x - g[0], ch.root.z - g[1]] : null; }
    renderSide(); renderTools(); renderHint(); requestRender();
  } else {
    DRAG.mode = (e.button === 2 || e.button === 1 || e.shiftKey) ? 'pan' : 'orbit';
    R.canvas.style.cursor = 'grabbing';
  }
}
/* zoomer : on se rapproche du point visé ; tout près, au lieu de se bloquer, la caméra continue d'avancer
   (le point visé avance avec elle) : on ne reste jamais coincé */
const DIST_MIN = 0.25, DIST_MAX = 80;
function zoomBy(c, f){
  const want = c.dist * f;
  if(want < DIST_MIN){
    const step = Math.max(0.05, c.dist - want), y = c.yaw * D2R, p = c.pitch * D2R;
    c.tx -= Math.sin(y) * Math.cos(p) * step; c.ty = clamp(c.ty + Math.sin(p) * step, -0.5, 30); c.tz -= Math.cos(y) * Math.cos(p) * step;
    c.dist = Math.max(DIST_MIN, Math.min(c.dist, DIST_MIN));
  } else {
    c.dist = Math.min(DIST_MAX, want);
  }
  keepCam(c);
}
/* une caméra toujours valable : dans le lieu, sans valeur impossible */
function keepCam(c){
  const ok = ['tx', 'ty', 'tz', 'yaw', 'pitch', 'dist', 'lens'].every(k => Number.isFinite(c[k]));
  if(!ok){ const d = SET_DEF[shot().set].cam; Object.assign(c, clone(d)); return; }
  c.tx = clamp(c.tx, -150, 150); c.tz = clamp(c.tz, -150, 150); c.ty = clamp(c.ty, -0.5, 30);
  c.dist = clamp(c.dist, 0.05, DIST_MAX); c.pitch = clamp(c.pitch, -89, 89); c.lens = clamp(c.lens, 10, 200);
  if(Math.abs(c.yaw) > 3600) c.yaw = ((c.yaw % 360) + 360) % 360;
}
/* se décaler : la scène suit la souris, dans le plan de l'image */
function panBy(cam, dx, dy){
  const k = Math.max(cam.dist, 1.2) * Math.tan(fovOf(cam.lens) / 2) * 2 / (R.canvas.getBoundingClientRect().height || 500), y = cam.yaw * D2R, p = cam.pitch * D2R;
  cam.tx -= Math.cos(y) * dx * k; cam.tz += Math.sin(y) * dx * k;
  // vers le haut et le bas : selon l'inclinaison de la caméra, on monte ou on avance
  cam.ty = clamp(cam.ty + Math.cos(p) * dy * k, -0.5, 30);
  cam.tx -= Math.sin(y) * Math.sin(p) * dy * k; cam.tz -= Math.cos(y) * Math.sin(p) * dy * k;
}
function onMove(e){
  if(DRAG.pts.has(e.pointerId)) DRAG.pts.set(e.pointerId, [e.clientX, e.clientY]);
  if(!DRAG.mode){ hoverCheck(e); return; }
  const cam = shot().cam;
  if(DRAG.mode === 'pinch'){
    if(DRAG.pts.size < 2) return;
    const [a, b] = [...DRAG.pts.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    camGesture(cam, () => { zoomBy(cam, DRAG.dist0 * DRAG.pinch / Math.max(d, 1) / cam.dist); panBy(cam, mid[0] - DRAG.mid[0], mid[1] - DRAG.mid[1]); }, true); DRAG.mid = mid;   // deux doigts : zoomer et se décaler
    DRAG.moved = true; requestRender(); return;
  }
  const dx = e.clientX - DRAG.x, dy = e.clientY - DRAG.y; DRAG.x = e.clientX; DRAG.y = e.clientY;
  if(Math.abs(dx) + Math.abs(dy) > 0) DRAG.moved = true;
  if(DRAG.mode === 'orbit') camGesture(cam, () => { cam.yaw -= dx * 0.3; cam.pitch = clamp(cam.pitch + dy * 0.25, -88, 85); });
  else if(DRAG.mode === 'pan') camGesture(cam, () => panBy(cam, dx, dy));
  else if(DRAG.mode === 'pose' && DRAG.ik){
    const [x, y] = canvasXY(e); ikDrag(DRAG.ik, x, y); renderSide(true);
  }
  else if(DRAG.mode === 'move'){
    const [x, y] = canvasXY(e), g = groundAt(x, y, 0), ch = shot().chars[S.sel.c];
    if(g && DRAG.grab){ ch.root.x = clamp(g[0] + DRAG.grab[0], -60, 60); ch.root.z = clamp(g[1] + DRAG.grab[1], -60, 60); }
  }
  requestRender();
}
function onUp(e){
  DRAG.pts.delete(e.pointerId);
  if(!DRAG.mode || DRAG.pts.size) return;
  const m = DRAG.mode; DRAG.mode = null; DRAG.ik = null; R.canvas.style.cursor = 'grab';
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
  if(DRAG.mode === 'pose' && DRAG.ik){
    const K = DRAG.ik;
    if(K.base == null){ const P = M4.apply(charMatrices(shot().chars[K.c])[K.j], K.pt); K.base = Math.hypot(P[0] - K.eye[0], P[1] - K.eye[1], P[2] - K.eye[2]); }   // depuis là où elle est
    K.dz = clamp(K.dz + (e.deltaY < 0 ? 0.05 : -0.05), -0.8, 0.8); DRAG.moved = true;
    const ch = shot().chars[K.c]; if(ch && K.n) ikSolve(ch, K.j, K.chain, [K.n[0] + K.off[0], K.n[1] + K.off[1]], K.pt, K.vp, K.h, K);
    renderSide(true); requestRender(); return;
  }
  if(!_wheelSnap) _wheelSnap = snapshot();
  const c = shot().cam, f = Math.exp(clamp(e.deltaY, -120, 120) * 0.0015);
  const [x, y] = canvasXY(e), hit = f < 1 && pickAt(x, y), g = groundAt(x, y, c.ty);
  // sous la souris, un personnage : on avance vers ce qu'on montre (un visage, une main), pour un gros plan précis
  if(hit){ const M = charMatrices(shot().chars[hit.c]), J = M[hit.j]; if(J){ const q = M4.apply(J, [0, hit.j === 'head' ? 0.1 : 0, 0]);
    camGesture(c, () => { const k = (1 - f) * 0.9; c.tx += (q[0] - c.tx) * k; c.ty += (q[1] - c.ty) * k; c.tz += (q[2] - c.tz) * k; zoomBy(c, f); }, true);
    requestRender(); clearTimeout(_wheelT); _wheelT = setTimeout(() => { pushUndo(_wheelSnap); _wheelSnap = null; changed(); }, 350); return; } }
  // vers le point sous la souris, mais jamais plus loin que le recul actuel (sinon on part à l'horizon)
  camGesture(c, () => {
    if(g && f < 1){ const k = (1 - f) * 0.5, dx = (g[0] - c.tx) * k, dz = (g[1] - c.tz) * k, l = Math.hypot(dx, dz), m = c.dist * 0.25; c.tx += l > m ? dx * m / l : dx; c.tz += l > m ? dz * m / l : dz; }
    zoomBy(c, f);
  }, true); requestRender();
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

/* ---------- Poser à la main : on attrape une partie du corps, et le point attrapé suit la souris ----------
   Chaque partie entraîne ce qui la porte : la main entraîne le bras, l'avant-bras plie le coude et l'épaule,
   la tête se tourne vers où on la tire, le torse se penche et pivote. Avec Alt, seule l'articulation saisie bouge.
   Le point saisi glisse dans un plan face à la caméra ; on cherche les angles qui l'y amènent sans sortir des
   limites du corps, en changeant le moins possible (et presque jamais en vrillant un membre sur lui-même).
   Quelques centaines de petits essais par mouvement de souris : fluide même sur un vieil ordinateur. */
const IK_CHAIN = { head:['head'], chest:['spine', 'chest'], spine:['spine'],
  armL:['armL'], foreL:['armL', 'foreL'], handL:['armL', 'foreL', 'handL'], armR:['armR'], foreR:['armR', 'foreR'], handR:['armR', 'foreR', 'handR'],
  thighL:['thighL'], shinL:['thighL', 'shinL'], footL:['thighL', 'shinL', 'footL'], thighR:['thighR'], shinR:['thighR', 'shinR'], footR:['thighR', 'shinR', 'footR'] };
// où l'on peut saisir chaque partie (un segment, dans le repère de la partie) : on prend le point le plus proche de la souris.
// La tête et le torse se saisissent en avant du visage : tirer vers le côté les fait tourner, vers le haut les fait se redresser.
// (un levier d'une cinquantaine de centimètres : un petit geste, une rotation mesurée)
const IK_SEG = { head:[[0, 0.1, 0.5], [0, 0.1, 0.5]], chest:[[0, 0.25, 0.5], [0, 0.25, 0.5]], spine:[[0, 0.12, 0.5], [0, 0.12, 0.5]],
  armL:[[0, -0.08, 0], [0, -0.28, 0]], foreL:[[0, -0.06, 0], [0, -0.25, 0]], handL:[[0, -0.04, 0.01], [0, -0.09, 0.01]],
  armR:[[0, -0.08, 0], [0, -0.28, 0]], foreR:[[0, -0.06, 0], [0, -0.25, 0]], handR:[[0, -0.04, 0.01], [0, -0.09, 0.01]],
  thighL:[[0, -0.12, 0], [0, -0.42, 0]], shinL:[[0, -0.06, 0], [0, -0.4, 0]], footL:[[0, -0.05, 0.02], [0, -0.05, 0.12]],
  thighR:[[0, -0.12, 0], [0, -0.42, 0]], shinR:[[0, -0.06, 0], [0, -0.4, 0]], footR:[[0, -0.05, 0.02], [0, -0.05, 0.12]] };
function rayAt(x, y){
  const w = R.canvas.width, h = R.canvas.height, inv = M4.invert(viewProj(viewCam(), w / h)), nx = x / w * 2 - 1, ny = 1 - y / h * 2;
  const a = M4.apply(inv, [nx, ny, -1]), b = M4.apply(inv, [nx, ny, 1]); return [a, [b[0] - a[0], b[1] - a[1], b[2] - a[2]]];
}
function ikStart(c, j, one, x, y){
  const ch = shot().chars[c]; if(!ch || !IK_CHAIN[j]) return null;
  const M = charMatrices(ch), [A, B] = IK_SEG[j], a = M4.apply(M[j], A), b = M4.apply(M[j], B);
  // le point du segment le plus proche du rayon de la souris : c'est lui qu'on tient
  let t = 1;
  if(x != null){
    const [o, d] = rayAt(x, y), u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], w0 = [a[0] - o[0], a[1] - o[1], a[2] - o[2]];
    const A1 = u[0] * u[0] + u[1] * u[1] + u[2] * u[2], B1 = u[0] * d[0] + u[1] * d[1] + u[2] * d[2], C1 = d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
    const D1 = u[0] * w0[0] + u[1] * w0[1] + u[2] * w0[2], E1 = d[0] * w0[0] + d[1] * w0[1] + d[2] * w0[2], den = A1 * C1 - B1 * B1;
    t = den > 1e-9 ? clamp((B1 * E1 - C1 * D1) / den, 0, 1) : 0.5;
  }
  const pt = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t];
  const w = R.canvas.width, h = R.canvas.height, vp = viewProj(viewCam(), w / h), q = M4.apply(vp, M4.apply(M[j], pt));
  // l'écart entre le curseur et le point saisi, au moment où on l'attrape (on ne le fait pas sauter sous la souris)
  // la distance du point saisi à la caméra : quand c'est ambigu, il vient vers nous plutôt que de partir derrière ;
  // la molette (en tenant) le rapproche ou l'éloigne
  const eye = camEye(viewCam()), p0 = M4.apply(M[j], pt), d0 = Math.hypot(p0[0] - eye[0], p0[1] - eye[1], p0[2] - eye[2]);
  return { c, j, chain:one ? [j] : IK_CHAIN[j], pt, vp, h, eye, d0, dz:0, n:x != null ? [x / w * 2 - 1, 1 - y / h * 2] : null, off:x != null ? [q[0] - (x / w * 2 - 1), q[1] - (1 - y / h * 2)] : [0, 0] };
}
function ikDrag(K, x, y){
  const ch = shot().chars[K.c]; if(!ch) return;
  // en coordonnées de l'image (de -1 à 1) : la taille de l'image peut changer entre deux gestes (image affinée au repos)
  const w = R.canvas.width, h = R.canvas.height; K.n = [x / w * 2 - 1, 1 - y / h * 2];
  ikSolve(ch, K.j, K.chain, [K.n[0] + K.off[0], K.n[1] + K.off[1]], K.pt, K.vp, K.h, K);
}
/* ce qui coûte le plus : vriller un membre sur lui-même, pencher la tête ou le buste de côté, casser le poignet.
   On ne le fait que si rien d'autre n'amène le point sous la souris. */
const ikCost = (id, i) => { const a = JOINT[id].ax[i], trunk = id === 'head' || id === 'chest' || id === 'spine';
  if(a[0] === 'y') return trunk ? 0.000002 : 0.00006;
  if(a[0] === 'z' && trunk) return 0.00006;
  if(id === 'handL' || id === 'handR') return 0.00002;
  return 0.0000015; };
// un bras ou une jambe qui part derrière le corps : possible, mais seulement si on le demande vraiment
const BACK = { armL:0, armR:0, thighL:0, thighR:0 };
/* le point saisi doit rester sous le curseur, à l'écran : la profondeur est libre (elle bouge le moins possible) */
function ikSolve(ch, j, chain, T, pt, vp, h, K){
  // l'articulation la plus proche de la main qui tient travaille d'abord : on attrape l'avant-bras, le coude plie
  const free = []; chain.forEach((id, n) => { ch.j[id] = ch.j[id] || []; JOINT[id].ax.forEach((a, i) => free.push([id, i, ikCost(id, i) * (1 + (chain.length - 1 - n) * 2), BACK[id] === i])); });
  const orig = {}; chain.forEach(id => orig[id] = ch.j[id].slice());
  const k = h / 2 / 250;     // écart à l'écran : en quarts de millier de pixels, à l'échelle des angles
  if(K && (j === 'head' || j === 'chest' || j === 'spine')) K = null;   // la tête et le torse se tiennent par un levier : pas de profondeur
  const err = () => { const M = charMatrices(ch), P = M4.apply(M[j], pt), q = M4.apply(vp, P); let e = ((q[0] - T[0]) * k) ** 2 + ((q[1] - T[1]) * k) ** 2;
    if(K){ const dd = Math.hypot(P[0] - K.eye[0], P[1] - K.eye[1], P[2] - K.eye[2]) - (K.base != null ? K.base - K.dz : K.d0);
      e += K.dz ? 6 * dd * dd : dd > 0 ? 2 * dd * dd : 0; }                     // s'éloigner coûte ; la molette fixe la profondeur voulue
    for(const [id, i, wt, back] of free){ const v = ch.j[id][i] || 0; e += wt * (v - (orig[id][i] || 0)) ** 2; if(back && v < 0) e += 0.00003 * v * v; } return e; };
  // de grands pas d'abord (on ne reste pas coincé), puis de plus en plus fins
  let best = err(), step = 16, n = 0;
  while(step > 0.5 && n < 360){
    let better = false;
    for(const [id, i] of free){ const lim = JOINT[id].ax[i];
      for(const dd of [step, -step]){ const old = ch.j[id][i] || 0; ch.j[id][i] = clamp(old + dd, lim[2], lim[3]); n++;
        const e = err(); if(e < best - 1e-9){ best = e; better = true; } else ch.j[id][i] = old; } }
    if(!better) step /= 2;
  }
  chain.forEach(id => ch.j[id] = ch.j[id].map(v => Math.round((v || 0) * 10) / 10));
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
  else if(kind === 'up') c.ty = clamp(c.ty + sp * 0.6, -0.5, 30);
  else if(kind === 'down') c.ty = clamp(c.ty - sp * 0.6, -0.5, 8);
  else if(kind === 'turnL') c.yaw += turn;
  else if(kind === 'turnR') c.yaw -= turn;
  else if(kind === 'in') zoomBy(c, Math.exp(-1.2 * dt));
  else if(kind === 'out') zoomBy(c, Math.exp(1.2 * dt));
}
function navLoop(now){
  const kinds = [...NAV.keys]; if(NAV.held) kinds.push(NAV.held);
  if(!kinds.length){ NAV.running = false; return; }
  const dt = Math.min(0.05, (now - NAV.last) / 1000); NAV.last = now;
  const c = shot().cam; camGesture(c, () => kinds.forEach(k => navStep(k, dt)), kinds.includes('in') || kinds.includes('out')); drawFrame();
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

/* ---------- Les petites images des poses (dans le volet) ----------
   Chaque pose est dessinée une fois, avec le personnage choisi, puis gardée. */
const POSE_PREV = new Map();
const poseKey = (look, pid) => look + ':' + pid + ':' + (S.doc.style || '') + (document.documentElement.dataset.theme === 'dark' ? ':d' : '');
function posePreview(look, pid){
  const dk = document.documentElement.dataset.theme === 'dark', key = poseKey(look, pid);
  if(POSE_PREV.has(key)) return POSE_PREV.get(key);
  const gl = GL.gl; if(!gl || S.rec) return '';
  const ch = newChar(0, { x:0, z:0, ry:0 }, look); applyPose(ch, pid);
  const M = charMatrices(ch), pts = Object.values(M).map(m => M4.apply(m, [0, 0, 0])).concat([M4.apply(M.head, [0, 0.26, 0]), M4.apply(M.footL, [0, -0.07, 0.2]), M4.apply(M.footR, [0, -0.07, 0.2])]);
  const lo = [0, 1, 2].map(i => Math.min(...pts.map(p => p[i]))), hi = [0, 1, 2].map(i => Math.max(...pts.map(p => p[i])));
  const c = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2], size = Math.max(hi[1] - lo[1], (hi[0] - lo[0]) * 1.25, (hi[2] - lo[2]) * 0.9, 0.6);
  const lens = 50, dist = size / 2 / Math.tan(fovOf(lens) / 2) * 1.12, y = 28 * D2R, p = -8 * D2R;
  const cam = camLook([c[0] + Math.sin(y) * Math.cos(p) * dist, c[1] - Math.sin(p) * dist, c[2] + Math.cos(y) * Math.cos(p) * dist], c, lens);
  const url = offscreenURL(96, 120, (w, h) => {
    const vp = M4.mul(M4.persp(fovOf(cam.lens), w / h, 0.06, 320), M4.lookAt(camEyeRaw(cam), [cam.tx, cam.ty, cam.tz], [0, 1, 0])), eye = camEyeRaw(cam);
    GL.begin(w, h, vp, hexRGB(dk ? '#262930' : '#E7EBF0'), { bw:S.doc.style === 'bw' }); GL.view(eye, []);
    gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    const fy = Math.min(M4.apply(M.footL, [0, -0.065, 0])[1], M4.apply(M.footR, [0, -0.065, 0])[1]), pc = M4.apply(M.pelvis, [0, 0, 0]);
    GL.draw(R.blob, { m:M4.mul(M4.trans(pc[0], fy + 0.004, pc[2]), [1.1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1.1, 0, 0, 0, 0, 1]), flat:true, a:0.16, col:[0.06, 0.07, 0.09] });
    gl.depthMask(true); gl.disable(gl.BLEND);
    const lk = CHAR_LOOK[look] || CHAR_LOOK[0], px = 2 * Math.tan(fovOf(lens) / 2) / h * 2.2;
    gl.cullFace(gl.FRONT); for(const J of JOINTS) GL.draw(R.out[lk.id][J.id], { m:M[J.id], flat:true, col:INK, out:px });
    if(ch.prop) GL.draw(R.propsOut[ch.prop], { m:M.handR, flat:true, col:INK, out:px });
    gl.cullFace(gl.BACK);
    for(const J of JOINTS) GL.draw(R.parts[lk.id][J.id], { m:M[J.id], col:[1, 1, 1], mul:true, char:true });
    if(ch.prop) GL.draw(R.props[ch.prop], { m:M.handR, col:[1, 1, 1], mul:true, char:true });
  });
  POSE_PREV.set(key, url);
  return url;
}
/* la vignette d'un objet : lui seul, de trois quarts, sur le fond du volet */
const OBJ_PREV = new Map();
function objPreview(kind){
  if(OBJ_PREV.has(kind)) return OBJ_PREV.get(kind);
  const gl = GL.gl; if(!gl || S.rec) return '';
  const D = VEH_DEF[kind], v = { kind, col:D.cols[0], x:0, y:0, z:0, ry:0 }, h = D.label - 0.25, r = Math.max(D.sh[0], D.sh[1], h / 2);
  const cam = camLook([r * 2.2, h * 0.75 + r * 0.9, r * 2.6], [0, h * 0.45, 0], 35), dk = document.documentElement.dataset.theme === 'dark';
  const url = offscreenURL(120, 96, (w, H) => {
    const vp = M4.mul(M4.persp(fovOf(cam.lens), w / H, 0.06, 320), M4.lookAt(camEyeRaw(cam), [cam.tx, cam.ty, cam.tz], [0, 1, 0]));
    GL.begin(w, H, vp, hexRGB(dk ? '#262930' : '#E7EBF0'), {}); GL.view(camEyeRaw(cam), []);
    GL.draw(vehMesh(v), { m:M4.ident(), vc:true });
  }, 0.85);
  OBJ_PREV.set(kind, url);
  return url;
}
/* la vignette d'un lieu : son premier cadrage, sans personne */
const PLACE_PREV = new Map();
function placePreview(id){
  const key = id + ':' + (S.doc.style || '');
  if(PLACE_PREV.has(key)) return PLACE_PREV.get(key);
  if(!GL.gl || S.rec) return '';
  const sh = { id:'prev', set:id, chars:[], crowds:[], vehicles:[], cam:clone(SET_DEF[id].prev || SET_DEF[id].cam), info:newInfo() };
  if(!SET_DEF[id].prev) sh.cam.dist *= 1.15;
  const url = offscreenURL(160, 90, (w, h) => drawFrame(sh, w, h, true), 0.8);
  PLACE_PREV.set(key, url);
  return url;
}

/* ---------- La maison : aller dans une pièce ----------
   La caméra glisse jusqu'à la pièce ; les étages du dessus s'effacent tout seuls. */
/* aller n'importe où dans la maison : on clique sur le plan, la caméra s'y pose à hauteur d'yeux */
function goSpot(level, x, z){
  const s = shot(), d = SET_DEF[s.set]; if(!d.levels) return;
  // la pièce où l'on a cliqué (ou la plus proche) : la caméra se met dans son coin opposé
  const rs = (d.rooms || []).filter(r => r[2] === level), dist = r => Math.hypot(Math.max(r[3][0] - x, 0, x - r[3][2]), Math.max(r[3][1] - z, 0, z - r[3][3]));
  const r = rs.reduce((b, q) => !b || dist(q) < dist(b) ? q : b, null);
  if(r){ const c = roomCam(d, r, [x, 0, z]); camEdit(() => { s.cam = camLook(c.eye, c.target, 22); s.info.size = 'pe'; s.info.angle = 'neu'; }); S.room = d.floors.findIndex(f => f[5] === r); }
  else { const y0 = d.levels[level] || 0; camEdit(() => { const c = s.cam; c.tx = x; c.tz = z; c.ty = y0 + 1.1; }); S.room = null; }
  S.planLevel = level;
}
/* amener le personnage choisi là où vise la caméra (pratique pour changer d'étage) */
function bringHere(){
  const s = shot(), d = SET_DEF[s.set], c = s.cam, k = S.sel ? S.sel.c : S.target, ch = s.chars[k]; if(!ch) return;
  const lv = d.levels ? d.levels.reduce((b, y, i) => c.ty >= y - 0.2 ? i : b, 0) : 0, y0 = d.levels ? d.levels[lv] : 0;
  edit(() => { if(ch.on) delete ch.on; ch.root.x = round(c.tx, 2); ch.root.z = round(c.tz, 2); const pose = ch.pose && SEATED[ch.pose] ? 'stand' : null; if(pose) applyPose(ch, pose); ch.root.y -= ch.gy || 0; ch.gy = 0; putOnSpot(ch, null, y0 || null); });
}
function goRoom(k){
  const s = shot(), f = (SET_DEF[s.set].floors || [])[k]; if(!f) return;
  camEdit(() => { s.cam = camLook(f[3], f[4], f[2] < 0 ? 28 : 22); s.info.size = 'pe'; s.info.angle = 'neu'; });
  S.room = k; S.planLevel = f[2];
}
