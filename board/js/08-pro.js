/* =====================================================================
   RAGING BOARD — FINITIONS PRO
   ---------------------------------------------------------------------
   1. Les vitres vues de dehors : un reflet de verre, jamais un paysage peint.
   2. Les anneaux de rotation : on tourne le membre choisi comme dans les
      logiciels 3D pro (un anneau par mouvement possible, rouge / vert / bleu).
   3. « Mon lieu » rangé : créer (maison, pièce, photo), puis tous ses lieux.
      « Ma photo » quitte « Lieu » pour « Mon lieu ».
   4. L'inspecteur : les onglets rangés en colonne, par famille (Décor,
      Acteurs, Caméra, Plan, Film), comme les panneaux des logiciels pro.
===================================================================== */

/* ---------- 1. La caméra est-elle dehors ? (pour les vitres) ---------- */
function eyeOutside(e){
  const d = typeof CAM_SET !== 'undefined' && CAM_SET && SET_DEF[CAM_SET]; if(!d) return false;
  const rs = d.rooms; if(!rs || !rs.length) return true;
  return !rs.some(r => { const y0 = d.levels ? d.levels[r[2]] || 0 : 0, R = r[3];
    return e[0] >= R[0] - 0.08 && e[0] <= R[2] + 0.08 && e[2] >= R[1] - 0.08 && e[2] <= R[3] + 0.08 && e[1] >= y0 - 0.4 && e[1] <= y0 + (d.roomH || 3) + 0.5; });
}

/* ---------- 2. Les anneaux de rotation ---------- */
const GZ = { on:lsGet('raging3d_rot') !== '0', drag:null, hot:-1 };
const gzSub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], gzCross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const gzDot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], gzLen = a => Math.hypot(a[0], a[1], a[2]), gzNorm = a => { const l = gzLen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
/* l'axe de chaque réglage, dans le monde : on le mesure (on tourne d'un degré et on regarde ce qui bouge),
   donc il est toujours juste, quelle que soit la pose, le gabarit ou l'âge du personnage */
function gzAxes(ch, jid){
  const J = JOINT[jid]; if(!J) return [];
  const M = charMatrices(ch)[jid], c = M4.apply(M, [0, 0, 0]), P = [[0.1, 0, 0], [0, 0.1, 0], [0, 0, 0.1]], R = P.map(p => gzSub(M4.apply(M, p), c));
  return J.ax.map((a, i) => {
    const j2 = Object.assign({}, ch.j); j2[jid] = (ch.j[jid] || []).slice(); j2[jid][i] = (j2[jid][i] || 0) + 1;
    const M2 = charMatrices(Object.assign({}, ch, { j:j2 }))[jid], c2 = M4.apply(M2, [0, 0, 0]);
    const D = P.map((p, k) => gzSub(gzSub(M4.apply(M2, p), c2), R[k])), ord = [0, 1, 2].sort((x, y) => gzLen(D[y]) - gzLen(D[x]));
    let ax = gzCross(D[ord[0]], D[ord[1]]); const guess = gzCross(R[ord[0]], D[ord[0]]);
    if(gzLen(ax) < 1e-9) ax = guess; if(gzDot(ax, guess) < 0) ax = ax.map(v => -v);
    return { a:gzNorm(ax), c, i, def:a };
  });
}
/* tourner un point autour d'un axe (Rodrigues) */
function gzRot(p, c, a, deg){
  const t = deg * D2R, v = gzSub(p, c), cs = Math.cos(t), sn = Math.sin(t), k = gzCross(a, v), d = gzDot(a, v);
  return [c[0] + v[0] * cs + k[0] * sn + a[0] * d * (1 - cs), c[1] + v[1] * cs + k[1] * sn + a[1] * d * (1 - cs), c[2] + v[2] * cs + k[2] * sn + a[2] * d * (1 - cs)];
}
const GZ_COL = { x:'#E5484D', y:'#30A46C', z:'#3E7BFA' };
let GZ_VIEW = null;   // de quoi passer du monde à l'écran, pour la dernière image
function gzDraw(sh, vp, w, h, mats){
  const host = document.getElementById('handles'); if(!host) return;
  let svg = host.querySelector('#gizmo');
  const sel = S.sel, ch = sel && sh.chars[sel.c], show = GZ.on && ch && JOINT[sel.j] && !S.final && !S.play && !S.rec;
  if(!show){ if(svg) svg.remove(); GZ_VIEW = null; return; }
  if(!svg){ svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.id = 'gizmo'; svg.setAttribute('class', 'gizmo'); host.appendChild(svg); }
  const r = R.canvas.getBoundingClientRect(), k = r.width / w;
  const proj = p => { const cx = vp[0] * p[0] + vp[4] * p[1] + vp[8] * p[2] + vp[12], cy = vp[1] * p[0] + vp[5] * p[1] + vp[9] * p[2] + vp[13], cw = vp[3] * p[0] + vp[7] * p[1] + vp[11] * p[2] + vp[15];
    return cw <= 0.02 ? null : [(cx / cw + 1) / 2 * w * k, (1 - cy / cw) / 2 * h * k]; };
  const axes = gzAxes(ch, sel.j); if(!axes.length){ svg.innerHTML = ''; return; }
  const c = axes[0].c, eye = camEye(viewCam(sh)), vd = gzNorm(gzSub(c, eye)), C = proj(c); if(!C){ svg.innerHTML = ''; return; }
  let right = gzCross(vd, [0, 1, 0]); if(gzLen(right) < 1e-3) right = [1, 0, 0]; right = gzNorm(right);
  const Q = proj([c[0] + right[0] * 0.1, c[1] + right[1] * 0.1, c[2] + right[2] * 0.1]), ppm = Q ? Math.hypot(Q[0] - C[0], Q[1] - C[1]) / 0.1 : 400;
  const Rw = clamp(66, 46, 90) / Math.max(ppm, 1);
  GZ_VIEW = { proj, axes, c, Rw, eye };
  svg.setAttribute('width', r.width); svg.setAttribute('height', r.height); svg.setAttribute('viewBox', `0 0 ${r.width} ${r.height}`);
  let out = `<circle class="gz-c" cx="${C[0]}" cy="${C[1]}" r="${(66 * 1.16).toFixed(1)}"/>`;
  axes.forEach((A, n) => {
    let u = gzCross(A.a, Math.abs(A.a[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]); u = gzNorm(u); const v = gzCross(A.a, u);
    let front = '', back = '', hit = '', prev = null, prevF = null;
    for(let s = 0; s <= 64; s++){
      const t = s / 64 * Math.PI * 2, p = [c[0] + (u[0] * Math.cos(t) + v[0] * Math.sin(t)) * Rw, c[1] + (u[1] * Math.cos(t) + v[1] * Math.sin(t)) * Rw, c[2] + (u[2] * Math.cos(t) + v[2] * Math.sin(t)) * Rw];
      const q = proj(p); if(!q){ prev = null; continue; }
      const isF = gzDot(gzSub(p, c), vd) <= 0.0001;   // la moitié de l'anneau tournée vers nous
      if(prev){ const seg = `M${prev[0].toFixed(1)} ${prev[1].toFixed(1)}L${q[0].toFixed(1)} ${q[1].toFixed(1)}`; if(isF && prevF) front += seg; else back += seg; hit += seg; }
      prev = q; prevF = isF;
    }
    const col = GZ_COL[A.def[0]] || '#888', on = GZ.hot === n || (GZ.drag && GZ.drag.n === n);
    out += `<g class="gz-ring ${on ? 'on' : ''}" data-n="${n}" style="--gc:${col}"><path class="gz-back" d="${back}"/><path class="gz-front" d="${front}"/><path class="gz-hit" d="${hit}" data-n="${n}"/></g>`;
  });
  // pendant qu'on tourne : le nom du mouvement et sa valeur
  if(GZ.drag){ const A = axes[GZ.drag.n], val = (ch.j[sel.j] || [])[GZ.drag.n] || 0;
    out += `<g class="gz-tip" transform="translate(${C[0].toFixed(1)} ${(C[1] - 66 * 1.16 - 16).toFixed(1)})"><rect x="-58" y="-13" width="116" height="24" rx="12"/><text y="4">${esc(L(A.def[4], A.def[5]))} · ${Math.round(val)}°</text></g>`; }
  svg.innerHTML = out;
}
const gzPlaceBase = placeHandles;
placeHandles = function(sh, vp, w, h, mats){ gzPlaceBase.apply(this, arguments); try{ gzDraw(sh, vp, w, h, mats); }catch(err){ console.warn(err); } };
document.addEventListener('pointerover', e => { const g = e.target.closest && e.target.closest('.gz-hit'); const n = g ? +g.dataset.n : -1; if(n !== GZ.hot && !GZ.drag){ GZ.hot = n; requestRender(); } });
document.addEventListener('pointerdown', e => {
  const g = e.target.closest && e.target.closest('.gz-hit'); if(!g || !GZ_VIEW || !S.sel) return;
  e.preventDefault(); e.stopPropagation();
  const n = +g.dataset.n, A = GZ_VIEW.axes[n], ch = shot().chars[S.sel.c]; if(!A || !ch) return;
  const rc = R.canvas.getBoundingClientRect(), mx = e.clientX - rc.left, my = e.clientY - rc.top;
  // le point de l'anneau qu'on a attrapé : quand on tourne d'un degré, il glisse à l'écran dans cette direction
  let u = gzCross(A.a, Math.abs(A.a[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]); u = gzNorm(u); const v = gzCross(A.a, u);
  let best = null; for(let s = 0; s < 64; s++){ const t = s / 64 * Math.PI * 2, p = [A.c[0] + (u[0] * Math.cos(t) + v[0] * Math.sin(t)) * GZ_VIEW.Rw, A.c[1] + (u[1] * Math.cos(t) + v[1] * Math.sin(t)) * GZ_VIEW.Rw, A.c[2] + (u[2] * Math.cos(t) + v[2] * Math.sin(t)) * GZ_VIEW.Rw];
    const q = GZ_VIEW.proj(p); if(q){ const d = Math.hypot(q[0] - mx, q[1] - my); if(!best || d < best.d) best = { d, p, q }; } }
  if(!best) return;
  const q1 = GZ_VIEW.proj(gzRot(best.p, A.c, A.a, 1)); if(!q1) return;
  let s1 = [q1[0] - best.q[0], q1[1] - best.q[1]];
  // l'anneau vu par la tranche : on tourne en glissant le long de l'anneau, à vitesse raisonnable
  if(Math.hypot(...s1) < 0.35){ const L1 = Math.hypot(...s1) || 1; s1 = [s1[0] / L1 * 0.35, s1[1] / L1 * 0.35]; }
  const vals = (ch.j[S.sel.j] || []).slice();
  GZ.drag = { n, x0:mx, y0:my, s1, v0:vals[n] || 0, snap:snapshot(), c:S.sel.c, j:S.sel.j, moved:false };
  try{ g.setPointerCapture(e.pointerId); }catch(err){}
  requestRender();
}, true);
document.addEventListener('pointermove', e => {
  const d = GZ.drag; if(!d) return;
  const rc = R.canvas.getBoundingClientRect(), mx = e.clientX - rc.left, my = e.clientY - rc.top, ch = shot().chars[d.c]; if(!ch) return;
  const J = JOINT[d.j], ax = J.ax[d.n], s2 = d.s1[0] * d.s1[0] + d.s1[1] * d.s1[1];
  const dv = ((mx - d.x0) * d.s1[0] + (my - d.y0) * d.s1[1]) / s2;
  ch.j[d.j] = (ch.j[d.j] || J.ax.map(() => 0)).slice(); ch.j[d.j][d.n] = Math.round(clamp(d.v0 + dv, ax[2], ax[3]) * 2) / 2; d.moved = true;
  renderSide(true); requestRender();
}, true);
document.addEventListener('pointerup', () => {
  const d = GZ.drag; if(!d) return; GZ.drag = null;
  if(d.moved){ pushUndo(d.snap); changed(); } else requestRender();
}, true);
// le bouton, dans la retouche du membre choisi
const gzPoseBase = PANEL_HTML.pose;
PANEL_HTML.pose = function(){
  const h = gzPoseBase.call(this), btn = `<button class="btn btn-sm gz-btn ${GZ.on ? 'on' : ''}" data-act="gzTog" aria-pressed="${GZ.on}" title="${esc(L('Afficher les anneaux pour tourner le membre choisi, comme dans un logiciel 3D', 'Show the rings to rotate the chosen limb, like in a 3D app'))}">${gzIco()}${L('Anneaux', 'Rings')}</button>`;
  return h.replace('<button class="btn btn-sm" data-act="resetPart">', `<div class="gz-row">${btn}<button class="btn btn-sm" data-act="resetPart">`).replace(/(data-act="resetPart">[\s\S]*?<\/button>)/, '$1</div>')
    .replace(/(<p class="empty-n">[\s\S]*?<span>)([\s\S]*?)(<\/span><\/p>)/, `$1$2 ${L('Choisis-en une : des anneaux apparaissent pour la tourner.', 'Pick one: rings appear to rotate it.')}$3`);
};
function gzIco(){ return `<svg class="icon" viewBox="0 0 16 16" fill="none" stroke-width="1.4" stroke-linecap="round" aria-hidden="true"><ellipse cx="8" cy="8" rx="6.2" ry="6.2" stroke="#3E7BFA"/><ellipse cx="8" cy="8" rx="6.2" ry="2.4" stroke="#E5484D"/><ellipse cx="8" cy="8" rx="2.4" ry="6.2" stroke="#30A46C"/></svg>`; }
ACT.gzTog = () => { GZ.on = !GZ.on; lsSet('raging3d_rot', GZ.on ? '1' : '0'); renderPanel(); requestRender(); };

/* ---------- 3. « Mon lieu » rangé ---------- */
// « Lieu » ne sert plus qu'à choisir parmi les lieux tout prêts : Ma photo et ses propres lieux sont dans « Mon lieu »
const proPlaceBase = PANEL_HTML.place;
PANEL_HTML.place = function(){
  const keep = S.doc.maps; S.doc.maps = [];
  let h; try{ h = proPlaceBase.call(this); } finally { S.doc.maps = keep; }
  h = h.replace(/<button class="myplace[^"]*" data-act="photoPick"[\s\S]*?<\/button><input type="file" id="photoFile"[^>]*>/, '');
  const n = (keep || []).length, sh = shot(), mine = SET_DEF[sh.set] && (SET_DEF[sh.set].custom || sh.set === 'photo');
  // un rappel discret : ses propres lieux sont dans l'onglet d'à côté
  return h.replace('<div class="pb">', `<div class="pb"><button class="pro-mine ${mine ? 'on' : ''}" data-act="panel" data-id="mymap">${hbIco('house')}<span><b>${mine ? L('Ce plan se passe dans un de tes lieux', 'This shot is in one of your places') : L('Tes propres lieux', 'Your own places')}</b><small>${n ? n + ' ' + L(n > 1 ? 'lieux' : 'lieu', n > 1 ? 'places' : 'place') + ' · ' : ''}${L('maison, pièce, photo : dans « Mon lieu »', 'house, room, photo: in “My place”')}</small></span>${icon('right')}</button>`);
};
function proHub(){
  const maps = S.doc.maps || [], sh = shot(), cur = sh.set, style = S.doc.style || '';
  const card = (m) => { const id = 'my_' + m.id, st = SETS.find(x => x.id === id), on = cur === id, kind = m.kind === 'house' ? L('Maison', 'House') : m.kind === 'out' ? L('Extérieur', 'Outdoors') : L('Pièce', 'Room');
    const nR = m.kind === 'house' ? hbLevelsOf(m.hs).reduce((a, l) => a + (l.rooms || []).length, 0) : 0;
    return `<div class="pro-pc ${on ? 'on' : ''}"><button class="pro-pc-main" data-act="mmGo" data-id="${esc(m.id)}" title="${esc(L('Tourner ce plan dans ce lieu', 'Shoot this shot in this place'))}"><i class="sw" data-pp="${id}"${PLACE_PREV.has(id + ':' + style) ? ` style="background-image:url(${PLACE_PREV.get(id + ':' + style)})"` : ''}></i>
      <span class="pro-pc-t"><b>${esc(st ? L(st.fr, st.en) : m.name || '')}</b><small>${kind}${nR ? ' · ' + nR + ' ' + L(nR > 1 ? 'pièces' : 'pièce', nR > 1 ? 'rooms' : 'room') : ''}${on ? ' · ' + L('ce plan', 'this shot') : ''}</small></span></button>
      <button class="ib sm" data-act="proEdit" data-id="${esc(m.id)}" title="${esc(L('Modifier', 'Edit'))}">${hbIco('pencil')}</button></div>`; };
  const photoOn = cur === 'photo';
  return ph('house', L('Mon lieu', 'My place'), L('Tes propres décors', 'Your own sets')) + `<div class="pb pro-hub">
    <div class="fly-lbl">${L('Créer', 'Create')}</div>
    <div class="pro-new">
      <button class="pro-nc" data-act="hbNewHouse"><span class="pro-nc-ic">${hbIco('house')}</span><b>${L('Une maison', 'A house')}</b><small>${L('Pièces, étages, toit, meubles', 'Rooms, floors, roof, furniture')}</small></button>
      <button class="pro-nc" data-act="mapNew"><span class="pro-nc-ic">${icon('grid')}</span><b>${L('Une pièce', 'A room')}</b><small>${L('Ou une cour, un terrain', 'Or a yard, a field')}</small></button>
      <button class="pro-nc ${photoOn ? 'on' : ''}" data-act="photoPick"><span class="pro-nc-ic">${icon('image')}</span><b>${L('Ma photo', 'My photo')}</b><small>${photoOn && sh.photo ? L('Changer de photo', 'Change the photo') : L('Ton décor en image', 'Your set as a picture')}</small></button>
    </div><input type="file" id="photoFile" accept="image/*" hidden>
    <p class="mm-p">${L('Astuce : tu peux aussi glisser une image directement sur la vue 3D.', 'Tip: you can also drop an image straight onto the 3D view.')}</p>
    <div class="fly-lbl">${L('Mes lieux', 'My places')}${maps.length ? ` <span class="cnt">${maps.length}</span>` : ''}</div>
    ${maps.length ? `<div class="pro-pcs">${maps.map(card).join('')}</div>` : `<div class="pro-empty">${hbIco('house')}<span>${L('Tes lieux apparaîtront ici. Ils voyagent avec le storyboard.', 'Your places will show up here. They travel with the storyboard.')}</span></div>`}
  </div>`;
}
const proMymapBase = PANEL_HTML.mymap;
PANEL_HTML.mymap = function(){
  if(!curMap() || S.mmHub) return proHub();
  const m = curMap(), id = 'my_' + m.id, st = SETS.find(x => x.id === id), style = S.doc.style || '';
  // en tête des réglages : le lieu lui-même (sa vignette, son nom), et le retour à tous ses lieux
  const head = `<div class="pro-cur"><button class="pro-back" data-act="mmHub">${icon('back')}${L('Mon lieu', 'My place')}</button>
    <div class="pro-cur-c"><i class="sw" data-pp="${id}"${PLACE_PREV.has(id + ':' + style) ? ` style="background-image:url(${PLACE_PREV.get(id + ':' + style)})"` : ''}></i><span><small>${L('Tu modifies', 'Editing')}</small><b>${esc(st ? L(st.fr, st.en) : m.name || '')}</b></span></div></div>`;
  let h = proMymapBase.call(this);
  // l'ancienne rangée « Mes lieux / Nouveau lieu » est remplacée par cet en-tête
  h = h.replace(/<div class="pbtns"><button class="btn btn-sm btn-ghost" data-act="mmHub">[\s\S]*?<\/div>/, '');
  return h.replace('<div class="pb">', '<div class="pb">' + head);
};
ACT.proEdit = b => { const id = 'my_' + b.dataset.id; S.mmHub = false; if(shot().set !== id) setPlace(id); setPanel('mymap'); };

/* ---------- 4. L'inspecteur : les onglets en colonne, par famille ---------- */
const proRailBase = renderRail;
renderRail = function(){
  const el = document.getElementById('rail'); if(!el) return proRailBase.apply(this, arguments);
  proRailBase.apply(this, arguments);
  // on regroupe les onglets déjà dessinés sous le nom de leur famille
  const tabs = [...el.querySelectorAll('.tab')], by = Object.fromEntries(tabs.map(t => [t.dataset.id, t]));
  const frag = document.createDocumentFragment();
  PANELS.forEach((g, k) => { const lab = document.createElement('div'); lab.className = 'tab-g'; lab.textContent = L(g.g[0], g.g[1]); if(k) frag.appendChild(Object.assign(document.createElement('i'), { className:'tab-sep' })); frag.appendChild(lab);
    g.items.forEach(it => { if(by[it.id]) frag.appendChild(by[it.id]); }); });
  el.innerHTML = ''; el.appendChild(frag); el.classList.add('tabs-v');
  if(S.panel === 'mymap'){ const t = el.querySelector('.tab[data-id="place"]'); if(t) t.classList.remove('active'); }
};

/* ---------- 5. Les murs restent des murs, même vus de dehors ----------
   Dans un lieu fermé (une pièce, un bureau, un bar…), une caméra restée dehors (un ancien plan, un cadrage tout prêt)
   revient à l'intérieur dès qu'on la bouge, au lieu de glisser à travers un mur. Dans une maison avec jardin,
   on peut tourner autour de la maison, mais on entre par la porte (ou en cliquant une pièce), plus à travers la façade. */
const proGestureBase = camGesture;
camGesture = function(c, fn, zoom){
  try{ const id = shot().set, P = physOf(id);
    if(!S.freeCam && P && P.closed && c === shot().cam && !physIn(P, camEyeRaw(c))) Object.assign(c, camSafe(clone(c), id, true)); }catch(err){}
  return proGestureBase.apply(this, arguments);
};
