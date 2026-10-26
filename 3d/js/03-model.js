/* =====================================================================
   RAGING 3D — MODÈLE
   Le squelette d'un homme (proportions d'un adulte de 1,78 m), les poses
   rapides, et les quatre lieux. Tout est fait de formes simples, sans texture.
===================================================================== */

/* ---------- Le squelette ----------
   Chaque articulation : parent, position par rapport au parent (mètres), forme,
   et les réglages qu'on peut bouger (en degrés, avec des limites humaines).
   Un réglage : [axe, signe, min, max, nom FR, nom EN]. Le personnage regarde vers +Z ;
   sa gauche est vers +X. Les membres pendent vers le bas (-Y). */
const AX = {
  bend:  (s, a, b) => ['x', s, a, b, 'Plier', 'Bend'],
  raise: (s, a, b) => ['x', s, a, b, 'Lever', 'Raise'],
  lean:  (a, b) => ['x', 1, a, b, 'Pencher', 'Lean'],
  nod:   (a, b) => ['x', 1, a, b, 'Hocher', 'Nod'],
  side:  (s, a, b) => ['z', s, a, b, 'Écarter', 'Spread'],
  tilt:  (a, b) => ['z', 1, a, b, 'Incliner', 'Tilt'],
  turn:  (a, b) => ['y', 1, a, b, 'Tourner', 'Turn'],
};
const JOINTS = [
  { id:'pelvis', fr:'Bassin', en:'Hips', parent:null, off:[0, 0.94, 0], ax:[AX.lean(-30, 40), AX.tilt(-25, 25)] },
  { id:'spine', fr:'Ventre', en:'Belly', parent:'pelvis', off:[0, 0.07, 0], ax:[AX.lean(-25, 50), AX.turn(-40, 40), AX.tilt(-30, 30)] },
  { id:'chest', fr:'Torse', en:'Chest', parent:'spine', off:[0, 0.2, 0], ax:[AX.lean(-20, 35), AX.turn(-35, 35), AX.tilt(-25, 25)] },
  { id:'head', fr:'Tête', en:'Head', parent:'chest', off:[0, 0.33, 0], ax:[AX.nod(-45, 55), AX.turn(-80, 80), AX.tilt(-35, 35)] },
  { id:'armL', fr:'Bras gauche', en:'Left arm', parent:'chest', off:[0.2, 0.235, 0], ax:[AX.raise(-1, -60, 180), AX.side(1, -15, 180), AX.turn(-90, 90)] },
  { id:'foreL', fr:'Avant-bras gauche', en:'Left forearm', parent:'armL', off:[0, -0.28, 0], ax:[AX.bend(-1, 0, 150), AX.turn(-80, 80)] },
  { id:'handL', fr:'Main gauche', en:'Left hand', parent:'foreL', off:[0, -0.25, 0], ax:[AX.bend(-1, -70, 70), AX.side(1, -30, 40)] },
  { id:'armR', fr:'Bras droit', en:'Right arm', parent:'chest', off:[-0.2, 0.235, 0], ax:[AX.raise(-1, -60, 180), AX.side(-1, -15, 180), AX.turn(-90, 90)] },
  { id:'foreR', fr:'Avant-bras droit', en:'Right forearm', parent:'armR', off:[0, -0.28, 0], ax:[AX.bend(-1, 0, 150), AX.turn(-80, 80)] },
  { id:'handR', fr:'Main droite', en:'Right hand', parent:'foreR', off:[0, -0.25, 0], ax:[AX.bend(-1, -70, 70), AX.side(-1, -30, 40)] },
  { id:'thighL', fr:'Cuisse gauche', en:'Left thigh', parent:'pelvis', off:[0.095, -0.06, 0], ax:[AX.raise(-1, -40, 125), AX.side(1, -20, 70), AX.turn(-45, 45)] },
  { id:'shinL', fr:'Jambe gauche', en:'Left leg', parent:'thighL', off:[0, -0.42, 0], ax:[AX.bend(1, 0, 150)] },
  { id:'footL', fr:'Pied gauche', en:'Left foot', parent:'shinL', off:[0, -0.4, 0], ax:[AX.bend(1, -40, 50)] },
  { id:'thighR', fr:'Cuisse droite', en:'Right thigh', parent:'pelvis', off:[-0.095, -0.06, 0], ax:[AX.raise(-1, -40, 125), AX.side(-1, -20, 70), AX.turn(-45, 45)] },
  { id:'shinR', fr:'Jambe droite', en:'Right leg', parent:'thighR', off:[0, -0.42, 0], ax:[AX.bend(1, 0, 150)] },
  { id:'footR', fr:'Pied droit', en:'Right foot', parent:'shinR', off:[0, -0.4, 0], ax:[AX.bend(1, -40, 50)] },
];
const JOINT = Object.fromEntries(JOINTS.map((j, i) => [j.id, Object.assign(j, { idx:i })]));

/* la forme de chaque partie, dans le repère de son articulation (un mannequin d'artiste) */
function partGeo(id){
  const g = geo(), W = [1, 1, 1];
  const limb = (r1, r2, len, ball0) => { if(ball0) ball(g, 0, 0, 0, ball0, ball0, ball0, W, 10); cyl(g, 0, 0, 0, r1, r2, len, W, 10); };
  switch(id){
    case 'pelvis': box(g, 0, -0.01, 0, 0.32, 0.16, 0.2, W); ball(g, 0.095, -0.06, 0, 0.085, 0.085, 0.085, W, 10); ball(g, -0.095, -0.06, 0, 0.085, 0.085, 0.085, W, 10); break;
    case 'spine': box(g, 0, 0.1, 0, 0.29, 0.2, 0.18, W); break;
    case 'chest': box(g, 0, 0.13, 0.005, 0.38, 0.28, 0.22, W); ball(g, 0.2, 0.235, 0, 0.068, 0.068, 0.068, W, 10); ball(g, -0.2, 0.235, 0, 0.068, 0.068, 0.068, W, 10); cyl(g, 0, 0.34, 0, 0.05, 0.055, 0.08, W, 10); break;
    case 'head': ball(g, 0, 0.12, 0.005, 0.098, 0.12, 0.108, W, 12); box(g, 0, 0.11, 0.1, 0.03, 0.045, 0.04, W); box(g, 0, 0.035, 0.035, 0.12, 0.05, 0.12, W); break;
    case 'armL': case 'armR': limb(0.058, 0.048, 0.28); break;
    case 'foreL': case 'foreR': limb(0.047, 0.038, 0.25, 0.051); break;
    case 'handL': case 'handR': ball(g, 0, 0, 0, 0.036, 0.036, 0.036, W, 6); box(g, 0, -0.085, 0.005, 0.075, 0.13, 0.035, W); box(g, (id === 'handL' ? -1 : 1) * 0.04, -0.06, 0.02, 0.025, 0.06, 0.025, W); break;
    case 'thighL': case 'thighR': limb(0.085, 0.062, 0.42); break;
    case 'shinL': case 'shinR': limb(0.06, 0.045, 0.4, 0.064); break;
    case 'footL': case 'footR': ball(g, 0, 0, 0, 0.045, 0.045, 0.045, W, 6); box(g, 0, -0.035, 0.055, 0.095, 0.06, 0.24, W); break;
  }
  return g;
}

/* les deux personnages : même squelette, deux teintes */
const CHAR_LOOK = [
  { col:'#E4E7EC', fr:'Personnage 1', en:'Character 1' },
  { col:'#9CA3AF', fr:'Personnage 2', en:'Character 2' },
];
function blankPose(){ const j = {}; JOINTS.forEach(J => j[J.id] = J.ax.map(() => 0)); j.armL[1] = 6; j.armR[1] = 6; return j; }
function newChar(i, spawn){
  const s = spawn || { x:i ? 0.8 : -0.8, z:0, ry:0 };
  return { root:{ x:s.x, y:0, z:s.z, ry:s.ry || 0 }, j:blankPose() };
}

/* matrices de chaque partie pour un personnage (repère du monde) */
function charMatrices(ch){
  const out = {};
  for(const J of JOINTS){
    const v = ch.j[J.id] || [];
    let R = M4.ident();
    // ordre : tourner (y), puis lever/plier (x), puis écarter/incliner (z)
    const val = k => { let a = 0; J.ax.forEach((x, i) => { if(x[0] === k) a += x[1] * (v[i] || 0) * D2R; }); return a; };
    R = M4.mul(M4.mul(M4.ry(val('y')), M4.rx(val('x'))), M4.rz(val('z')));
    const T = M4.trans(J.off[0], J.off[1], J.off[2]);
    const local = M4.mul(T, R);
    if(!J.parent){
      const W = M4.mul(M4.trans(ch.root.x, ch.root.y, ch.root.z), M4.ry(ch.root.ry * D2R));
      out[J.id] = M4.mul(W, local);
    } else out[J.id] = M4.mul(out[J.parent], local);
  }
  return out;
}

/* ---------- Poses rapides (valeurs par articulation, dans l'ordre de ses réglages) ---------- */
const POSES = [
  { id:'stand', fr:'Debout', en:'Standing', j:{}, y:0 },
  { id:'walk', fr:'Marche', en:'Walking', y:-0.015, j:{ thighL:[24, 0, 0], shinL:[8], footL:[-8], thighR:[-18, 0, 0], shinR:[26], footR:[10], armL:[-18, 6, 0], foreL:[12, 0], armR:[20, 6, 0], foreR:[22, 0], spine:[4, 6, 0] } },
  { id:'sit', fr:'Assis', en:'Sitting', y:-0.4, j:{ thighL:[90, 6, 0], shinL:[88], thighR:[90, 6, 0], shinR:[88], armL:[22, 8, 0], foreL:[58, 0], armR:[22, 8, 0], foreR:[58, 0], spine:[6, 0, 0] } },
  { id:'point', fr:'Pointer', en:'Pointing', y:0, j:{ armR:[88, 8, 0], foreR:[4, 0], head:[0, -12, 0], chest:[0, -10, 0], handR:[-8, 0] } },
  { id:'up', fr:'Mains en l’air', en:'Hands up', y:0, j:{ armL:[150, 28, 0], foreL:[38, 0], armR:[150, 28, 0], foreR:[38, 0], head:[-8, 0, 0] } },
  { id:'drive', fr:'Au volant', en:'Driving', y:-0.35, j:{ thighL:[90, 8, 0], shinL:[25], footL:[-12], thighR:[90, 8, 0], shinR:[25], footR:[-12], armL:[62, 14, 0], foreL:[48, 0], armR:[62, 14, 0], foreR:[48, 0], spine:[-4, 0, 0] } },
  { id:'phone', fr:'Au téléphone', en:'On the phone', y:0, j:{ armR:[65, 35, 30], foreR:[150, 0], handR:[-10, 0], head:[6, 0, -10] } },
];
function applyPose(ch, pid){
  const P = POSES.find(p => p.id === pid); if(!P) return;
  ch.j = blankPose();
  for(const k in P.j) ch.j[k] = P.j[k].slice();
  ch.root.y = P.y || 0;
}

/* ---------- Les lieux ----------
   Chaque lieu : sa géométrie (une seule forme, couleurs par sommet), où placer les deux
   personnages, et un premier cadrage. Les murs ne se voient que de l'intérieur. */
const SETS = [
  { id:'garage', fr:'Garage', en:'Garage' },
  { id:'office', fr:'Bureau', en:'Office' },
  { id:'alley', fr:'Ruelle', en:'Alley' },
  { id:'taxi', fr:'Taxi', en:'Taxi' },
];
const SET_DEF = {
  garage:{
    spawn:[{ x:-0.7, z:0.4, ry:20 }, { x:0.9, z:0.2, ry:-25 }],
    cam:{ tx:0, ty:1.05, tz:0, yaw:12, pitch:-6, dist:5.6, lens:28 },
    build(g){
      floor(g, -4, -4, 4, 4, 0, '#8D9198');
      for(let i = -3; i <= 3; i++) box(g, i * 1.15, 0.002, 0, 0.02, 0.004, 8, '#80848B');
      wall(g, [-4, -4], [4, -4], 3.2, '#C9CCD1'); wall(g, [-4, 4], [-4, -4], 3.2, '#BEC2C8'); wall(g, [4, -4], [4, 4], 3.2, '#BEC2C8');
      floor(g, -4, -4, 4, 4, 3.2, '#A9ADB4', true);
      // porte de garage à lattes
      box(g, 0.6, 1.25, -3.97, 3.4, 2.5, 0.04, '#A8ADB5');
      for(let i = 0; i < 9; i++) box(g, 0.6, 0.15 + i * 0.28, -3.94, 3.4, 0.025, 0.02, '#8F959E');
      box(g, 0.6, 2.55, -3.95, 3.6, 0.12, 0.06, '#7A7F88');
      // établi, panneau à outils, étagère, bidons, pneus
      box(g, -3.35, 0.9, -1.2, 1.1, 0.07, 2.6, '#8A6A4A'); box(g, -3.35, 0.45, -2.3, 1.0, 0.9, 0.06, '#6E5440'); box(g, -3.35, 0.45, -0.0, 1.0, 0.9, 0.06, '#6E5440'); box(g, -3.35, 0.25, -1.2, 1.0, 0.05, 2.5, '#6E5440');
      box(g, -3.96, 1.75, -1.2, 0.04, 1.0, 2.2, '#C9B48F');
      [[-1.9, 2.0], [-1.5, 1.85], [-1.0, 2.05], [-0.6, 1.9]].forEach(([z, y]) => box(g, -3.93, y, z, 0.03, 0.32, 0.06, '#5E636C'));
      box(g, 3.65, 1.0, 1.6, 0.6, 0.05, 1.8, '#7E838B'); box(g, 3.65, 1.7, 1.6, 0.6, 0.05, 1.8, '#7E838B'); box(g, 3.65, 0.3, 1.6, 0.6, 0.05, 1.8, '#7E838B');
      [0.75, 2.45].forEach(z => box(g, 3.65, 1.0, z, 0.62, 2.0, 0.05, '#6A6F77'));
      box(g, 3.65, 1.2, 1.2, 0.4, 0.3, 0.4, '#B08A5A'); box(g, 3.65, 1.9, 2.0, 0.45, 0.35, 0.5, '#B08A5A');
      cyl(g, 3.3, 0.9, -2.9, 0.29, 0.29, 0.9, '#2F6E4F', 10); cyl(g, 2.65, 0.9, -3.1, 0.29, 0.29, 0.9, '#9B3B33', 10);
      for(let i = 0; i < 3; i++) cyl(g, -2.6, 0.16 + i * 0.21, 3.1, 0.36, 0.36, 0.2, '#2C2E33', 12);
      // lampe suspendue
      cyl(g, 0, 3.2, 0.3, 0.01, 0.01, 0.6, '#3A3D44', 4); cyl(g, 0, 2.6, 0.3, 0.06, 0.32, 0.2, '#3A3D44', 10);
    },
  },
  office:{
    spawn:[{ x:-0.2, z:-0.6, ry:180, pose:'sit' }, { x:0.9, z:0.9, ry:210 }],
    cam:{ tx:0.2, ty:1.1, tz:0.2, yaw:-28, pitch:-6, dist:5.2, lens:28 },
    build(g){
      floor(g, -3.5, -3.5, 3.5, 3.5, 0, '#9A8F80');
      wall(g, [-3.5, -3.5], [3.5, -3.5], 2.9, '#E6E2DA'); wall(g, [-3.5, 3.5], [-3.5, -3.5], 2.9, '#DAD5CC'); wall(g, [3.5, -3.5], [3.5, 3.5], 2.9, '#DAD5CC');
      floor(g, -3.5, -3.5, 3.5, 3.5, 2.9, '#EEEBE6', true);
      box(g, 0, 0.05, -3.48, 7, 0.1, 0.03, '#BDB6AA');
      // fenêtre
      box(g, -1.0, 1.6, -3.48, 2.2, 1.4, 0.02, '#A9C9DE');
      box(g, -1.0, 0.88, -3.46, 2.3, 0.06, 0.06, '#F4F2EE'); box(g, -1.0, 2.32, -3.46, 2.3, 0.06, 0.06, '#F4F2EE');
      [-2.12, -1.0, 0.12].forEach(x => box(g, x, 1.6, -3.46, 0.06, 1.5, 0.06, '#F4F2EE')); box(g, -1.0, 1.6, -3.46, 2.3, 0.04, 0.05, '#F4F2EE');
      // bureau, écran, clavier, chaise
      box(g, -0.2, 0.74, -1.35, 1.7, 0.05, 0.8, '#7A5C42');
      [[-0.97, -1.7], [0.57, -1.7], [-0.97, -1.0], [0.57, -1.0]].forEach(([x, z]) => box(g, x, 0.36, z, 0.05, 0.72, 0.05, '#5B4532'));
      box(g, -0.2, 1.03, -1.6, 0.56, 0.34, 0.03, '#2C2E33'); box(g, -0.2, 0.83, -1.6, 0.06, 0.14, 0.05, '#2C2E33'); box(g, -0.2, 0.77, -1.55, 0.25, 0.015, 0.18, '#2C2E33');
      box(g, -0.2, 0.775, -1.2, 0.42, 0.02, 0.14, '#3A3D44');
      box(g, -0.2, 0.42, -0.6, 0.48, 0.07, 0.46, '#3A3D44'); box(g, -0.2, 0.78, -0.34, 0.46, 0.62, 0.06, '#3A3D44'); cyl(g, -0.2, 0.39, -0.6, 0.03, 0.03, 0.26, '#2A2C31', 6); box(g, -0.2, 0.1, -0.6, 0.5, 0.03, 0.08, '#2A2C31'); box(g, -0.2, 0.1, -0.6, 0.08, 0.03, 0.5, '#2A2C31');
      // classeur, bibliothèque, plante
      box(g, 2.1, 0.66, -3.15, 0.5, 1.32, 0.6, '#8C9199'); [0.33, 0.77, 1.15].forEach(y => box(g, 2.1, y, -2.84, 0.18, 0.03, 0.02, '#5E636C'));
      box(g, -3.3, 1.0, 0.8, 0.35, 2.0, 1.6, '#6E5440');
      [0.45, 0.95, 1.45].forEach((y, k) => { for(let i = 0; i < 9; i++) box(g, -3.2, y + 0.14, 0.15 + i * 0.15 + (k % 2) * 0.05, 0.22, 0.28 - (i % 3) * 0.04, 0.1, ['#9B3B33', '#2F6E4F', '#C9B48F', '#3D5A80'][(i + k) % 4]); });
      cyl(g, 2.9, 0.4, 2.8, 0.2, 0.16, 0.4, '#B9876A', 8); ball(g, 2.9, 0.85, 2.8, 0.36, 0.48, 0.36, '#4E7C58', 8);
      // lampe de plafond
      box(g, 0, 2.86, -0.5, 1.2, 0.04, 0.3, '#F7F5F0');
    },
  },
  alley:{
    spawn:[{ x:-0.5, z:0.3, ry:30 }, { x:0.7, z:-0.5, ry:-150 }],
    cam:{ tx:0, ty:1.2, tz:0, yaw:6, pitch:-4, dist:6.4, lens:28 },
    build(g){
      floor(g, -2.4, -14, 2.4, 6, 0, '#5C6068');
      box(g, 0, 0.004, -4, 0.3, 0.008, 20, '#50545B');
      // deux immeubles : façades vues de la ruelle
      wall(g, [-2.4, 6], [-2.4, -14], 9, '#8E7E72'); wall(g, [2.4, -14], [2.4, 6], 9, '#9A8B7E');
      for(let z = -12; z <= 4; z += 2.6) for(let y = 3.0; y < 8.5; y += 2.6){ box(g, -2.38, y, z, 0.04, 1.3, 0.9, '#3E4552'); box(g, 2.38, y + 1.0, z + 1.2, 0.04, 1.3, 0.9, '#3E4552'); }
      wall(g, [2.4, -14], [-2.4, -14], 9, '#7E7064');
      box(g, -0.3, 1.1, -13.97, 1.0, 2.2, 0.04, '#4A3B33');
      // escalier de secours
      for(let y = 3.6; y < 9; y += 2.6){ box(g, 2.0, y, -3.2, 0.8, 0.05, 2.4, '#2C2E33'); box(g, 1.62, y + 0.45, -3.2, 0.04, 0.9, 2.4, '#2C2E33'); }
      for(let i = 0; i < 9; i++) box(g, 2.05, 1.8 + i * 0.2, -4.2 + i * 0.2, 0.6, 0.03, 0.12, '#2C2E33');
      // benne, caisses, poubelles, réverbère
      box(g, -1.75, 0.6, -3.2, 1.2, 1.2, 2.0, '#2F6E4F'); box(g, -1.75, 1.24, -3.2, 1.25, 0.08, 2.05, '#26593F');
      box(g, 1.85, 0.25, 1.6, 0.5, 0.5, 0.5, '#9A7A55'); box(g, 1.85, 0.72, 1.55, 0.44, 0.44, 0.44, '#8A6A4A'); box(g, 1.5, 0.22, 2.2, 0.44, 0.44, 0.44, '#9A7A55');
      cyl(g, -1.95, 0.75, 1.5, 0.26, 0.22, 0.75, '#6E737B', 10); cyl(g, -1.95, 0.8, 1.5, 0.28, 0.28, 0.05, '#7D828A', 10);
      cyl(g, 2.2, 4.0, -7.5, 0.06, 0.06, 4.0, '#2C2E33', 6); box(g, 1.95, 4.0, -7.5, 0.5, 0.05, 0.08, '#2C2E33'); box(g, 1.72, 3.9, -7.5, 0.24, 0.12, 0.24, '#F2D98A');
      // fils au-dessus
      for(let z = -10; z <= 2; z += 4) box(g, 0, 7.4 - (z % 8 ? 0.3 : 0), z, 4.8, 0.02, 0.02, '#2C2E33');
    },
  },
  taxi:{
    // le conducteur à gauche à l'avant, le passager à l'arrière à droite ; tous deux assis
    spawn:[{ x:0.37, z:0.3, ry:0, pose:'drive' }, { x:-0.4, z:-0.8, ry:0, pose:'sit', y:-0.35 }],
    cam:{ tx:0, ty:1.0, tz:-0.2, yaw:58, pitch:-11, dist:6.2, lens:35 },
    build(g){
      floor(g, -8, -10, 8, 10, 0, '#4D5158');
      box(g, -2.6, 0.08, 0, 0.3, 0.16, 20, '#8D9198'); floor(g, -8, -10, -2.75, 10, 0.16, '#7A7E85');
      for(let z = -9; z < 10; z += 3) box(g, 2.6, 0.003, z, 0.12, 0.006, 1.6, '#D9D3B8');
      cyl(g, -3.2, 4.2, -9.5, 0.07, 0.07, 4.2, '#2C2E33', 6); box(g, -2.95, 4.2, -9.5, 0.6, 0.05, 0.08, '#2C2E33'); box(g, -2.7, 4.1, -9.5, 0.28, 0.12, 0.28, '#F2D98A');
      const Y = '#E2B93B', Yd = '#C99E2A', K = '#2B2D32', S = '#3E4148', G = '#9DB3C2';
      // caisse : plancher, bas de caisse, capot, coffre ; on garde l'habitacle ouvert pour filmer
      box(g, 0, 0.25, -0.2, 1.78, 0.1, 4.4, K);
      box(g, 0.88, 0.62, -0.2, 0.04, 0.5, 3.0, Y); box(g, -0.88, 0.62, -0.2, 0.04, 0.5, 3.0, Y);
      box(g, 0, 0.72, 1.85, 1.8, 0.32, 1.2, Y); box(g, 0, 0.9, 1.85, 1.76, 0.04, 1.16, Yd);
      box(g, 0, 0.72, -2.15, 1.8, 0.32, 0.9, Y); box(g, 0, 0.9, -2.15, 1.76, 0.04, 0.86, Yd);
      box(g, 0, 0.62, 2.47, 1.82, 0.22, 0.06, '#8C9199'); box(g, 0, 0.62, -2.62, 1.82, 0.22, 0.06, '#8C9199');
      [0.65, -0.65].forEach(x => { box(g, x, 0.74, 2.5, 0.28, 0.12, 0.02, '#F7F2D6'); box(g, x, 0.74, -2.63, 0.26, 0.1, 0.02, '#C2453B'); });
      for(let x = -0.85; x <= 0.86; x += 0.3) box(g, x, 0.305, -0.2, 0.15, 0.012, 3.0, '#33363C');
      box(g, 0.82, 0.78, -0.2, 0.06, 0.2, 2.9, '#1E1F23'); box(g, -0.82, 0.78, -0.2, 0.06, 0.2, 2.9, '#1E1F23');
      // montants, toit, pare-brise, enseigne
      [[0.85, 1.2, -0.28], [-0.85, 1.2, -0.28], [0.85, -0.25, 0], [-0.85, -0.25, 0], [0.85, -1.55, 0.3], [-0.85, -1.55, 0.3]].forEach(([x, z]) => box(g, x, 1.21, z, 0.06, 0.7, 0.07, Yd));
      box(g, 0, 1.58, -0.2, 1.74, 0.05, 2.4, Y);
      box(g, 0, 1.69, -0.2, 0.5, 0.18, 0.2, '#F7F2D6'); box(g, 0, 1.785, -0.2, 0.52, 0.02, 0.22, Yd);
      box(g, 0, 1.24, 1.26, 1.6, 0.6, 0.02, G);
      // tableau de bord, volant, sièges
      box(g, 0, 0.92, 1.12, 1.7, 0.22, 0.34, K);
      cyl(g, 0.37, 1.0, 0.85, 0.17, 0.17, 0.02, '#1E1F23', 12, 'z'); cyl(g, 0.37, 1.0, 0.87, 0.03, 0.03, 0.22, '#1E1F23', 6, 'z');
      [0.37, -0.37].forEach(x => { box(g, x, 0.4, 0.3, 0.56, 0.12, 0.52, S); box(g, x, 0.82, 0.02, 0.56, 0.76, 0.1, S); box(g, x, 1.3, 0.01, 0.26, 0.16, 0.08, S); });
      box(g, 0, 0.4, -0.8, 1.6, 0.12, 0.55, S); box(g, 0, 0.8, -1.12, 1.6, 0.72, 0.1, S);
      // roues
      [[0.88, 1.45], [-0.88, 1.45], [0.88, -1.7], [-0.88, -1.7]].forEach(([x, z]) => cyl(g, x - (x > 0 ? 0 : 0.22), 0.33, z, 0.33, 0.33, 0.22, '#1E1F23', 12, 'x'));
    },
  },
};
function setGeo(id){ const g = geo(); SET_DEF[id].build(g); return g; }
