/* =====================================================================
   RAGING BOARD — L'ATELIER PLUS CLAIR
   ---------------------------------------------------------------------
   1. La caméra libre : un interrupteur bien visible sous l'image, éteint
      par défaut, pour filmer à travers un mur exprès (le 4e mur enlevé).
   2. Les pièces : une petite pastille « Pièce · Salon ▾ » au lieu d'un
      grand panneau posé sur l'image ; la liste s'ouvre au clic.
   3. Les personnages : une carte du corps pour choisir une partie d'un
      clic, la symétrie gauche ↔ droite, et la retouche en haut du volet.
   4. Moins de texte : l'aide générale passe dans un bouton « ? ».
===================================================================== */

/* ---------- 1. La caméra libre ---------- */
S.freeCam = lsGet('raging3d_freecam') === '1';
const fcSettleBase = camSettle;
camSettle = function(){ if(S.freeCam) return; return fcSettleBase.apply(this, arguments); };
ACT.freeCam = () => {
  S.freeCam = !S.freeCam; lsSet('raging3d_freecam', S.freeCam ? '1' : '0'); renderNav(); renderHint();
  toast(S.freeCam ? L('Caméra libre : elle traverse les murs (vue en coupe)', 'Free camera: it goes through walls (cutaway)') : L('Murs solides : la caméra reste dans le lieu', 'Solid walls: the camera stays in the place'));
  // en revenant aux murs solides, une caméra restée dans un mur revient dans le lieu
  if(!S.freeCam){ const s = shot(); camEdit(() => { s.cam = camSafe(s.cam, s.set, true); }); }
  requestRender();
};
const uiNavBase = renderNav;
renderNav = function(){
  uiNavBase.apply(this, arguments);
  const el = document.getElementById('nav'); if(!el) return;
  el.insertAdjacentHTML('beforeend', `<span class="dk-sep"></span><button class="dk dk-free ${S.freeCam ? 'on' : ''}" data-act="freeCam" aria-pressed="${S.freeCam ? 'true' : 'false'}" title="${esc(S.freeCam ? L('Caméra libre : elle traverse les murs. Clique pour revenir aux murs solides.', 'Free camera: it goes through walls. Click for solid walls.') : L('Caméra libre (vue en coupe) : traverser les murs pour filmer à travers, le 4e mur enlevé', 'Free camera (cutaway): go through walls to film through them, the 4th wall removed'))}">
    <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5 2.5v11M11 2.5v11" fill="none" stroke-dasharray="${S.freeCam ? '1.6 1.6' : 'none'}"/><path d="M2 8h12M11.5 5.5 14 8l-2.5 2.5" fill="none"/></svg><span>${S.freeCam ? L('Caméra libre', 'Free camera') : L('Murs solides', 'Solid walls')}</span></button>
    <button class="dk dk-help" data-act="navHelp" title="${esc(L('Glisser : tourner autour · Clic droit : se décaler · Molette : avancer · Double-clic : viser un point · Flèches ou ZQSD : se déplacer', 'Drag: orbit · Right-click: pan · Wheel: move in · Double-click: aim at a point · Arrows or WASD: move'))}"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6.2" fill="none"/><path d="M6.3 6.3a1.8 1.8 0 1 1 2.5 1.6c-.5.3-.8.6-.8 1.2v.4" fill="none"/><circle cx="8" cy="11.6" r=".5"/></svg></button>`);
};
ACT.navHelp = () => toast(L('Glisser : tourner autour · Clic droit : se décaler · Molette : avancer · Double-clic : viser', 'Drag: orbit · Right-click: pan · Wheel: move in · Double-click: aim'));
// l'aide générale sous l'image ne s'affiche plus en permanence : seulement ce qui aide pendant un geste
const uiHintBase = renderHint;
renderHint = function(){
  uiHintBase.apply(this, arguments);
  const el = document.getElementById('hint'); if(!el) return;
  const idle = !S.play && !S.endEd && !DRAG.mode && !S.hover && HDRAG.c < 0 && !S.sel && !S.freeCam;
  el.classList.toggle('idle', idle);
  if(S.freeCam && !S.play && !DRAG.mode && !S.hover && !S.sel) el.innerHTML = `<i></i><span>${esc(L('Caméra libre : elle traverse les murs', 'Free camera: it goes through walls'))}</span>`;
};

/* ---------- 2. Les pièces : une pastille, la liste au clic ---------- */
S.rnOpen = false;
const rnName = f => (f[2] < 0 ? L('Dehors', 'Outside') : L(f[0], f[1])).replace(/^(1er|2e|1st|2nd)\s*:\s*/, '');
function rnLevelNames(d){
  if(d.house){ const n = d.levels ? d.levels.length : 1; return hbLvNames(n).short; }
  return [L('RDC', 'GF'), L('1er', '1st'), L('2e', '2nd'), L('Grenier', 'Attic')].slice(0, (d.levels || [0]).length);
}
renderPlan = function(){
  const el = document.getElementById('hplan'), s = S.doc && shot(), d = s && SET_DEF[s.set]; if(!el) return;
  el.classList.add('rn');
  if(!d || !d.floors || S.final){ el.classList.add('hidden'); el.innerHTML = ''; return; }
  el.classList.remove('hidden');
  const e = camEyeRaw(s.cam), lvOf = y => d.levels ? levelOfY(d, y) : 0;
  const cur = S.room != null ? S.room : d.floors.findIndex(f => f[5] && e[0] >= f[5][3][0] && e[0] <= f[5][3][2] && e[2] >= f[5][3][1] && e[2] <= f[5][3][3] && lvOf(e[1]) === f[2]);
  const names = rnLevelNames(d), lvCur = cur >= 0 && d.floors[cur][2] >= 0 ? d.floors[cur][2] : lvOf(s.cam.ty);
  const lv = S.rnLv != null ? clamp(S.rnLv, 0, names.length - 1) : lvCur;
  const curName = cur >= 0 ? rnName(d.floors[cur]) : L('Choisir', 'Choose');
  const prefix = d.levels && cur >= 0 && d.floors[cur][2] >= 0 ? names[d.floors[cur][2]] + ' · ' : '';
  let pop = '';
  if(S.rnOpen){
    const garden = d.floors.findIndex(f => f[2] < 0);
    pop = `<div class="rn-pop" role="menu">
      ${d.levels && names.length > 1 ? `<div class="rn-lv">${names.map((t, i) => `<button class="${i === lv ? 'on' : ''}" data-act="rnLv" data-l="${i}">${esc(t)}</button>`).join('')}</div>` : ''}
      <div class="rn-list">${d.floors.map((f, k) => f[5] && (!d.levels || f[2] === lv) ? `<button class="rn-it ${k === cur ? 'on' : ''}" data-act="floor" data-k="${k}">${esc(rnName(f))}</button>` : '').join('')}</div>
      ${garden >= 0 || d.house ? `<div class="rn-foot">${garden >= 0 ? `<button class="rn-it rn-out ${garden === cur ? 'on' : ''}" data-act="floor" data-k="${garden}">${icon('sun')}${L('Dehors', 'Outside')}</button>` : '<span></span>'}${d.house ? `<button class="rn-edit" data-act="hbOpen" title="${esc(L('Modifier le plan de la maison', 'Edit the house plan'))}">${hbIco('pencil')}${L('Plan', 'Plan')}</button>` : ''}</div>` : ''}
    </div>`;
  }
  el.innerHTML = `${pop}<button class="rn-pill ${S.rnOpen ? 'open' : ''}" data-act="rnTog" aria-expanded="${S.rnOpen}" title="${esc(L('Changer de pièce', 'Change room'))}">${icon('place')}<span class="rn-k">${prefix}</span><b>${esc(curName)}</b><i class="rn-chev"></i></button>`;
};
ACT.rnTog = () => { S.rnOpen = !S.rnOpen; S.rnLv = null; renderPlan(); };
ACT.rnLv = b => { S.rnLv = +b.dataset.l; renderPlan(); };
const rnFloorBase = ACT.floor;
ACT.floor = b => { S.rnOpen = false; S.rnLv = null; rnFloorBase(b); };
document.addEventListener('pointerdown', e => { if(S.rnOpen && !(e.target.closest && e.target.closest('#hplan'))){ S.rnOpen = false; renderPlan(); } }, true);

/* ---------- 3. Les personnages : la carte du corps, la symétrie, la retouche en haut ---------- */
const BM_PTS = { head:[50, 17], chest:[50, 50], spine:[50, 72], pelvis:[50, 93], armL:[71, 46], foreL:[80, 72], handL:[86, 98], armR:[29, 46], foreR:[20, 72], handR:[14, 98],
  thighL:[61, 113], shinL:[64, 149], footL:[67, 185], thighR:[39, 113], shinR:[36, 149], footR:[33, 185] };
const BM_BONES = [['head', 'chest'], ['chest', 'spine'], ['spine', 'pelvis'], ['chest', 'armL'], ['armL', 'foreL'], ['foreL', 'handL'], ['chest', 'armR'], ['armR', 'foreR'], ['foreR', 'handR'],
  ['pelvis', 'thighL'], ['thighL', 'shinL'], ['shinL', 'footL'], ['pelvis', 'thighR'], ['thighR', 'shinR'], ['shinR', 'footR']];
function bodyMap(sel){
  const P = BM_PTS, on = sel ? sel.j : null;
  return `<svg class="bm-svg" viewBox="0 0 100 200" aria-label="${esc(L('Choisir une partie du corps', 'Pick a body part'))}">
    <circle class="bm-head" cx="50" cy="17" r="11"/>
    ${BM_BONES.map(([a, b]) => `<line x1="${P[a][0]}" y1="${P[a][1]}" x2="${P[b][0]}" y2="${P[b][1]}"/>`).join('')}
    ${Object.keys(P).map(j => `<g class="bm-pt ${on === j ? 'on' : ''}" data-act="bodyPick" data-j="${j}"><title>${esc(L(JOINT[j].fr, JOINT[j].en))}</title><circle class="bm-hit" cx="${P[j][0]}" cy="${P[j][1]}" r="9"/><circle class="bm-dot" cx="${P[j][0]}" cy="${P[j][1]}" r="${j === 'head' ? 5.5 : 4.4}"/></g>`).join('')}
  </svg>`;
}
const uiPoseBase = PANEL_HTML.pose;
PANEL_HTML.pose = function(){
  let h = uiPoseBase.call(this);
  const sh = shot(), t = S.sel ? S.sel.c : S.target, ch = sh.chars[t]; if(!ch) return h;
  // la retouche (et ses réglages) quitte le bas du volet pour venir en haut, avec la carte du corps
  const lab = `<div class="fly-lbl">${L('Retouche', 'Touch-up')}</div>`, i = h.lastIndexOf(lab);
  let part = '';
  if(i >= 0){ part = h.slice(i + lab.length, h.length - 6); h = h.slice(0, i) + h.slice(h.length - 6); }
  if(!S.sel) part = '';
  const sel = S.sel && JOINT[S.sel.j] ? S.sel : null;
  const card = `<div class="bm">
    <div class="bm-l">${bodyMap(sel)}</div>
    <div class="bm-r">
      <b class="bm-t">${sel ? esc(L(JOINT[sel.j].fr, JOINT[sel.j].en)) : L('Retoucher la pose', 'Fine-tune the pose')}</b>
      <small class="bm-s">${sel ? L('Glisse les anneaux dans l’image, ou les réglages ci-dessous', 'Drag the rings in the picture, or the settings below') : L('Clique une partie sur le corps, ou directement dans l’image', 'Click a part on the body, or right in the picture')}</small>
      <div class="bm-acts">
        <span class="bm-k">${L('Symétrie', 'Mirror')}</span>
        <div class="bm-two"><button class="btn btn-sm" data-act="mirrorPose" data-v="L" title="${esc(L('Le côté droit prend la pose du côté gauche (en miroir)', 'The right side copies the left side (mirrored)'))}">${L('G → D', 'L → R')}</button><button class="btn btn-sm" data-act="mirrorPose" data-v="R" title="${esc(L('Le côté gauche prend la pose du côté droit (en miroir)', 'The left side copies the right side (mirrored)'))}">${L('D → G', 'R → L')}</button></div>
      </div>
    </div></div>${part ? `<div class="bm-part">${part}</div>` : ''}`;
  // juste après le choix du personnage (s'il y en a plusieurs), avant les visages et les poses toutes prêtes
  const pb = h.indexOf('<div class="pb">'); if(pb < 0) return h;
  let at = pb + 16;
  if(h.startsWith('<div class="seg wide">', at)){ const end = h.indexOf('</div>', at); if(end > 0) at = end + 6; }
  return h.slice(0, at) + card + h.slice(at);
};
function bmIco(s){ return `<svg class="icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 2v12" stroke-dasharray="1.5 1.6"/><path d="${s > 0 ? 'M3 8h3.2M10 8h3M11 6l2 2-2 2' : 'M13 8H9.8M6 8H3M5 6 3 8l2 2'}"/></svg>`; }
ACT.bodyPick = b => { const t = S.sel ? S.sel.c : S.target, ch = shot().chars[t]; if(!ch) return; S.sel = { c:t, j:b.dataset.j }; S.target = t; renderPanel(); renderHint(); requestRender(); };
ACT.mirrorPose = b => {
  const t = S.sel ? S.sel.c : S.target, ch = shot().chars[t]; if(!ch) return;
  const pairs = [['armL', 'armR'], ['foreL', 'foreR'], ['handL', 'handR'], ['thighL', 'thighR'], ['shinL', 'shinR'], ['footL', 'footR']];
  edit(() => pairs.forEach(([l, r]) => { const [a, d] = b.dataset.v === 'L' ? [l, r] : [r, l], J = JOINT[d]; ch.j[d] = J.ax.map((x, i) => { const v = (ch.j[a] || [])[i] || 0; return x[0] === 'y' ? -v : v; }); }));
  toast(b.dataset.v === 'L' ? L('Le côté droit reprend le gauche, en miroir', 'Right side now mirrors the left') : L('Le côté gauche reprend le droit, en miroir', 'Left side now mirrors the right'));
};

/* ---------- 5. « Mon lieu » sans doublons ----------
   Les pièces se choisissent avec la pastille sur l'image : plus de seconde liste dans le volet. */
const uiMymapBase = PANEL_HTML.mymap;
PANEL_HTML.mymap = function(){
  return uiMymapBase.call(this).replace(/<div class="fly-lbl">(?:Aller dans une pièce|Go to a room)<\/div><div class="chips">[\s\S]*?<\/div>/, '');
};
