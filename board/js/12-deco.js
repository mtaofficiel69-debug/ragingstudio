/* =====================================================================
   RAGING BOARD — UN DÉCOR VIVANT, QU'ON ARRANGE COMME ON VEUT
   ---------------------------------------------------------------------
   Les voitures des décors (rue, taxi, parking, maison) ne sont plus collées
   au lieu : ce sont de vrais objets du plan, avec un conducteur et parfois
   des passagers (de simples figurants, pas des personnages qu'on anime),
   et des passants sur les trottoirs. On les clique pour les choisir, on les
   déplace, on les tourne, et on les supprime un par un (✕ ou touche Suppr).
===================================================================== */

/* ---------- 1. Les figurants : un passant debout, des gens assis dans les voitures ---------- */
const DECO_SKIN = ['#E8C3A0', '#C99A73', '#8D5E3C', '#F1D2B6', '#A9744F', '#5E3B26'];
const DECO_HAIR = ['#2A1E17', '#5A3B24', '#C9A15E', '#1B1B1D', '#8E4A2E', '#B9B4AA'];
const DECO_LEGS = ['#2C3440', '#3B3E45', '#5E5144', '#24262B', '#4A5A6E', '#6E6A64'];
const DECO_TOPS = ['#B4232C', '#3D5A80', '#2F6E4F', '#E9E6E0', '#C99E2A', '#7C6A8E', '#24262B', '#C2453B', '#5F7F48'];
function decoPal(n){ return { skin:DECO_SKIN[n % 6], hair:DECO_HAIR[(n * 5 + 1) % 6], legs:DECO_LEGS[(n * 7 + 2) % 6], top:DECO_TOPS[(n * 4 + 3) % 9] }; }
// un passant, debout (ou qui marche), tourné vers +z
function walkerGeo(col, st){
  const g = geo(), m0 = MAT, v = (st && st.cv) || 0, P = decoPal(v), T = col || P.top, walk = v % 3 !== 0, s = walk ? 0.17 : 0.03;
  MAT = 0;
  try {
    [-1, 1].forEach(sd => {                                                      // les jambes, les chaussures
      const fz = walk ? sd * s : 0;
      beam(g, [sd * 0.1, 0.9, 0], [sd * 0.1, 0.08, fz], 0.15, 0.16, P.legs);
      box(g, sd * 0.1, 0.05, fz + 0.05, 0.13, 0.1, 0.27, '#1E2025');
    });
    box(g, 0, 0.98, 0, 0.36, 0.2, 0.22, P.legs);                                 // le bassin
    box(g, 0, 1.25, 0, 0.42, 0.56, 0.24, T);                                     // le buste
    if(v % 2) box(g, 0, 1.12, 0.005, 0.44, 0.34, 0.25, T);                       // un manteau un peu plus long
    [-1, 1].forEach(sd => {                                                      // les bras (ils balancent en marchant), les mains
      const hz = walk ? -sd * 0.16 : 0.02, hx = sd * 0.27;
      beam(g, [sd * 0.25, 1.48, 0], [hx, 0.9, hz], 0.11, 0.12, T);
      ball(g, hx, 0.86, hz, 0.05, 0.06, 0.05, P.skin, 6);
    });
    box(g, 0, 1.56, 0, 0.11, 0.08, 0.11, P.skin);                                // le cou, la tête, les cheveux
    ball(g, 0, 1.67, 0.01, 0.105, 0.125, 0.115, P.skin, 8);
    ball(g, 0, 1.72, -0.015, 0.112, 0.09, 0.12, P.hair, 8);
    if(v % 4 === 1){ box(g, 0, 1.06, -0.16, 0.3, 0.36, 0.12, '#5E4532'); }       // un sac à dos
    if(v % 5 === 2){ box(g, 0.3, 0.72, 0.02, 0.06, 0.26, 0.2, '#24262B'); }      // une sacoche
  } finally { MAT = m0; }
  return g;
}
// des gens assis dans une voiture (face à l'avant, +z) : le conducteur tient le volant
const DECO_SEATS = [[0.37, 0.3, 1], [-0.37, 0.3, 0], [0.4, -0.8, 0], [-0.4, -0.8, 0]];
function decoCrew(g, n, cv){
  const m0 = MAT; MAT = 0;
  try {
    for(let i = 0; i < Math.min(n, 4); i++){
      const [x, z, drv] = DECO_SEATS[i], P = decoPal(cv + i * 3 + 1);
      box(g, x, 0.58, z + 0.17, 0.34, 0.14, 0.42, P.legs);                        // les cuisses
      box(g, x, 0.43, z + 0.42, 0.3, 0.26, 0.12, P.legs);                         // les jambes
      box(g, x, 0.86, z - 0.06, 0.38, 0.5, 0.22, P.top);                          // le buste
      [-1, 1].forEach(sd => drv
        ? beam(g, [x + sd * 0.21, 1.03, z - 0.04], [x + sd * 0.14, 0.97, z + 0.44], 0.09, 0.1, P.top)
        : beam(g, [x + sd * 0.21, 1.03, z - 0.04], [x + sd * 0.18, 0.66, z + 0.22], 0.09, 0.1, P.top));
      box(g, x, 1.14, z - 0.05, 0.1, 0.08, 0.1, P.skin);
      ball(g, x, 1.25, z - 0.04, 0.1, 0.12, 0.11, P.skin, 8);
      ball(g, x, 1.3, z - 0.06, 0.108, 0.085, 0.115, P.hair, 8);
    }
  } finally { MAT = m0; }
}
VEH_DEF.walker = { fr:'Passant', en:'Passer-by', ic:'obj', obj:true, shots:[], seats:[], cat:'street', cols:DECO_TOPS.slice(0, 6), label:2.05, sh:[0.26, 0.2], h:1.78 };
const decoGeoBase = vehicleGeo;
vehicleGeo = function(kind, col, glass, st){
  if(kind === 'walker') return walkerGeo(col, st);
  const g = decoGeoBase.apply(this, arguments);
  if(st && st.crew && (kind === 'car' || kind === 'police' || kind === 'taxi')) decoCrew(g, st.crew, st.cv || 0);
  return g;
};

/* ---------- 2. Ce que chaque lieu pose de lui-même ---------- */
const CAR_COLS = ['#3D5A80', '#B4232C', '#E9E6E0', '#24262B', '#2F6E4F', '#8E8B85', '#5E4532'];
function decoList(id){
  const L = [], car = (kind, x, z, ry, col, crew, cv) => L.push({ kind, x, y:0, z, ry, col, crew, cv }), walk = (x, z, ry, cv, col) => L.push({ kind:'walker', x, y:0, z, ry, cv, col:col || DECO_TOPS[(cv * 4 + 3) % 9] });
  if(id === 'taxi'){
    [[-34, 0], [-21, 180], [-9, 0], [19, 0], [31, 180], [46, 0], [-48, 180]].forEach(([z, ry], i) => car('car', 7.9, z, ry, CAR_COLS[i % 7], i % 3 === 1 ? 2 : 1, i));
    [[-1.2, 0, -9.5, 1], [-1.2, 0, -16.5, 2], [5.6, 180, 18, 2], [1.5, 0, 26, 1]].forEach(([x, ry, z, n], i) => car('taxi', x, z, ry, '#F2C230', n, i + 5));
    [[-4.6, -22, 0], [-5.4, -28, 180], [-4.4, 34, 180], [-5.6, 40, 0], [11.4, -14, 180], [12.2, 12, 0], [11.0, 30, 180], [12.4, -30, 0], [-5.0, 15.5, 90]].forEach(([x, z, ry], i) => walk(x, z, ry, i));
  }
  if(id === 'street'){
    car('car', 2.4, -14, 0, '#3D5A80', 1, 0); car('car', 2.4, -24, 0, '#9B3B33', 2, 1); car('car', -2.4, 18, 180, '#E4E7EC', 1, 2); car('car', 2.4, 22, 0, '#2F6E4F', 1, 3);
    [[-6.6, -18, 0], [-7.6, -26, 180], [-6.2, 14, 180], [7.4, 18, 0], [6.6, 30, 180], [7.8, -24, 0], [-7.2, 30, 0]].forEach(([x, z, ry], i) => walk(x, z, ry, i + 2));
  }
  if(id === 'parking'){
    const cols = ['#B4232C', '#2E3A4E', '#D9D6CF', '#3D5A80', '#24262B', '#5F7F48', '#C9B48F', '#8A8D93'];
    let k = 0; for(let x = -12.25; x <= 12.3; x += 2.7) [-1, 1].forEach(sd => { k++; if(k % 3 === 1) return; car('car', round(x, 2), sd * 6.0, sd > 0 ? 180 : 0, cols[k % cols.length], k % 4 === 0 ? 1 : 0, k); });
  }
  if(id === 'house') car('car', 7.5, 5, 0, '#3D5A80', 0, 0);
  return L;
}
// la première fois qu'un plan montre un lieu, il reçoit ses voitures et ses passants (ensuite, ce sont les siens : on les garde, déplacés ou supprimés)
function decoEnsure(sh){
  if(!sh || !sh.set || sh.decoSet === sh.set) return;
  sh.vehicles = (sh.vehicles || []).filter(v => !v.deco);
  decoList(sh.set).forEach(o => sh.vehicles.push(Object.assign({ id:uidS(), deco:true }, o)));
  sh.decoSet = sh.set;
}
const decoDrawBase = drawFrame;
drawFrame = function(sh){ try{ decoEnsure(sh); }catch(err){ console.warn(err); } return decoDrawBase.apply(this, arguments); };
// monter dans une voiture du décor : le figurant qui était à cette place lui laisse la place
const decoMountBase = mountVehicle;
mountVehicle = function(k, seat){ const v = (shot().vehicles || [])[k]; if(v && v.crew){ delete v.crew; } return decoMountBase.apply(this, arguments); };

/* ---------- 3. Les choisir, les supprimer un par un ---------- */
// les figurants n'encombrent pas l'image : leur étiquette n'apparaît que quand on les a choisis
const decoPlaceBase = placeHandles;
placeHandles = function(sh, vp, w, h, mats){
  decoPlaceBase.apply(this, arguments);
  const host = document.getElementById('handles'); if(!host) return;
  const n0 = sh.chars.length + (sh.crowds || []).length, vs = sh.vehicles || [];
  vs.forEach((v, i) => { const el = host.children[n0 + i]; if(!el || !el.classList.contains('hd-veh')) return;
    el.classList.toggle('deco', !!v.deco);
    let x = el.querySelector('.hd-del');
    if(S.veh === i && !S.sel){ if(!x){ el.insertAdjacentHTML('beforeend', `<button class="hd-del" data-k="${i}" title="${esc(L('Supprimer (Suppr)', 'Delete (Del)'))}" aria-label="${esc(L('Supprimer', 'Delete'))}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg></button>`); } else x.dataset.k = i; }
    else if(x) x.remove();
  });
};
document.addEventListener('pointerdown', e => { const b = e.target.closest && e.target.closest('.hd-del'); if(!b) return; e.preventDefault(); e.stopPropagation(); }, true);
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('.hd-del'); if(!b) return; e.preventDefault(); e.stopPropagation(); removeVehicle(+b.dataset.k); S.veh = -1; renderPanel(); requestRender(); }, true);
// la touche Suppr efface l'objet choisi (et non plus le plan entier)
document.addEventListener('keydown', e => {
  if(e.key !== 'Delete' && e.key !== 'Backspace') return;
  const t = e.target, tag = (t && t.tagName || '').toLowerCase(); if(tag === 'input' || tag === 'textarea' || tag === 'select' || (t && t.isContentEditable)) return;
  if(S.view !== 'stage' && S.view) return;
  const vs = shot().vehicles || []; if(S.sel || S.veh < 0 || !vs[S.veh]) return;
  e.preventDefault(); e.stopPropagation(); removeVehicle(S.veh); S.veh = -1; renderPanel(); requestRender();
}, true);

/* ---------- 4. Tous les éléments du décor (réverbères, arbres, bancs…) : des objets du plan ---------- */
// la forme d'un élément, dans le monde, puis ramenée autour de son centre (calculée une fois)
function spPiece(set, n){
  if(!SET_PIECES[set]) try{ setGeo(set); }catch(err){ console.warn(err); }
  const P = (SET_PIECES[set] || [])[n]; if(!P) return null;
  if(!P.g){
    const g = geo(), gl = geo(), m0 = MAT, e0 = EDGE_ON, c0 = COLL; COLL = null; MAT = P.mat; EDGE_ON = P.edge;
    try { P.fn(g, gl); } finally { MAT = m0; EDGE_ON = e0; COLL = c0; }
    let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9, y1 = 0;
    for(let i = 0; i < g.p.length; i += 3){ x0 = Math.min(x0, g.p[i]); x1 = Math.max(x1, g.p[i]); y1 = Math.max(y1, g.p[i + 1]); z0 = Math.min(z0, g.p[i + 2]); z1 = Math.max(z1, g.p[i + 2]); }
    if(x0 > x1){ x0 = x1 = z0 = z1 = 0; }
    P.cx = round((x0 + x1) / 2, 3); P.cz = round((z0 + z1) / 2, 3); P.hx = Math.max(0.1, (x1 - x0) / 2); P.hz = Math.max(0.1, (z1 - z0) / 2); P.h = Math.max(0.2, y1);
    P.g = g; P.gl = gl;
  }
  return P;
}
const spKind = P => 'sp_' + P.en.toLowerCase().replace(/[^a-z0-9]+/g, '');
function spDef(P){
  const k = spKind(P);
  if(!VEH_DEF[k]) VEH_DEF[k] = { fr:P.fr, en:P.en, ic:'obj', obj:true, cat:'decor', cols:['#888'], label:P.h + 0.35, sh:[0.01, 0.01], h:P.h, shots:[], seats:[] };
  else VEH_DEF[k].label = Math.max(VEH_DEF[k].label, P.h + 0.35);
  return k;
}
const spGeoBase = vehicleGeo;
vehicleGeo = function(kind, col, glass, st){
  if(kind && kind.startsWith('sp_')){
    const g = geo(), P = st && spPiece(st.set, st.n); if(!P) return g;
    hbMerge(g, P.g, 0, -P.cx, 0, -P.cz); if(glass) hbMerge(glass, P.gl, 0, -P.cx, 0, -P.cz);
    return g;
  }
  return spGeoBase.apply(this, arguments);
};
// sa taille (pour le choisir d'un clic, le poser sur un meuble…)
const spSizeBase = itemSize;
itemSize = function(v){
  if(v && v.kind && v.kind.startsWith('sp_')){ const P = spPiece(v.set, v.n); if(P) return [P.hx, P.hz, P.h]; }
  return spSizeBase.apply(this, arguments);
};
// les éléments du lieu, ajoutés au plan (une seule fois : ensuite ils sont à lui)
const DECO_V = 2;
function spAdd(sh){
  if(!SET_PIECES[sh.set]) try{ setGeo(sh.set); }catch(err){ return; }
  (SET_PIECES[sh.set] || []).forEach((P0, n) => { const P = spPiece(sh.set, n); if(!P) return; const k = spDef(P);
    sh.vehicles.push({ id:uidS(), kind:k, col:sh.set + ':' + n, set:sh.set, n, x:P.cx, y:0, z:P.cz, ry:0, deco:true }); });
}
const decoEnsureV1 = decoEnsure;
decoEnsure = function(sh){
  if(!sh || !sh.set) return;
  const fresh = sh.decoSet !== sh.set;
  decoEnsureV1(sh);
  if(fresh || (sh.decoV || 1) < DECO_V){ spAdd(sh); sh.decoV = DECO_V; }
  // les éléments déjà dans le plan (storyboard rouvert) : leur nom revient
  (sh.vehicles || []).forEach(v => { if(v.kind && v.kind.startsWith('sp_') && !VEH_DEF[v.kind]){ const P = spPiece(v.set, v.n); if(P) spDef(P); } });
};
