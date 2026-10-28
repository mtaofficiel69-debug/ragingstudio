/* =====================================================================
   RAGING BOARD — MODÈLE
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

/* ---------- Les huit personnages : deux hommes, deux femmes, deux enfants, deux aînés ----------
   Même squelette pour tous. Chacun a sa silhouette, sa taille, sa coiffure et ses habits :
   on les reconnaît d'un coup d'œil, même en noir et blanc (les habits n'ont pas la même clarté). */
const CHAR_LOOK = [
  { id:'m1', body:'m', fr:'Homme 1', en:'Man 1', skin:'#E7C8AE', hair:'#3B2A20', hairStyle:'short', top:'#2E3A4E', inner:'#EDEBE6', tie:'#7A2E3A', bottom:'#3A3D44', shoes:'#2A221D', wear:'suit' },
  { id:'m2', body:'m', fr:'Homme 2', en:'Man 2', skin:'#8E6248', hair:'#1E1A18', hairStyle:'curly', top:'#B4593A', bottom:'#3E5577', shoes:'#E9E6E0', sole:'#F4F2EE', wear:'sweater' },
  { id:'f1', body:'f', fr:'Femme 1', en:'Woman 1', skin:'#EDD0B8', hair:'#7A3E26', hairStyle:'bun', top:'#E8D9B5', bottom:'#7A2E3A', shoes:'#2A221D', wear:'blouse', skirt:true, lips:'#B8686A' },
  { id:'f2', body:'f', fr:'Femme 2', en:'Woman 2', skin:'#C99B78', hair:'#2A1F1A', hairStyle:'long', top:'#3F6E7A', inner:'#E9E4DA', bottom:'#2A2C31', shoes:'#5A3A2A', wear:'coat', lips:'#9A5450' },
  { id:'k1', body:'m', age:'kid', fr:'Garçon', en:'Boy', skin:'#D9AE8C', hair:'#5A3A24', hairStyle:'messy', top:'#E3A33A', bottom:'#4A6A8A', shoes:'#D64A3A', sole:'#F4F2EE', socks:'#F4F2EE', wear:'tee', shorts:true },
  { id:'k2', body:'f', age:'kid', fr:'Fille', en:'Girl', skin:'#F0D3BE', hair:'#C9973E', hairStyle:'pigtails', top:'#D9707A', bottom:'#D9707A', shoes:'#3A3D44', socks:'#F4F2EE', wear:'dress', skirt:true, lips:'#C27A78' },
  { id:'o1', body:'m', age:'old', fr:'Grand-père', en:'Grandpa', skin:'#E3C2AA', hair:'#E4E2DE', hairStyle:'bald', top:'#8A7356', inner:'#C9D3DC', bottom:'#5E636C', shoes:'#3A2A20', wear:'cardigan', glasses:true, stache:true },
  { id:'o2', body:'f', age:'old', fr:'Grand-mère', en:'Grandma', skin:'#E8C8B4', hair:'#DAD8D4', hairStyle:'bun', top:'#7C6A8E', inner:'#EDEBE6', bottom:'#4A4458', shoes:'#3A2A20', wear:'cardigan', skirt:true, glasses:true, lips:'#B07C7A' },
];
CHAR_LOOK.forEach(lk => { lk.col = lk.top; });
const MAX_CHARS = 6;
const lookOf = (ch, c) => CHAR_LOOK[ch && ch.look != null ? ch.look : (c || 0) % 2] || CHAR_LOOK[0];
/* les articulations qui bougent selon la silhouette ; « head » grossit la tête (les enfants),
   « stoop » voûte un peu le dos (les aînés) */
const BODY = {
  m:{ scale:1, head:1, off:{} },
  f:{ scale:0.95, head:1, off:{ armL:[0.178, 0.235, 0], armR:[-0.178, 0.235, 0], thighL:[0.102, -0.06, 0], thighR:[-0.102, -0.06, 0] } },
};
const AGE = { adult:{ k:1, head:1 }, kid:{ k:0.68, head:1.26 }, old:{ k:0.97, head:1, stoop:{ spine:[5, 0, 0], chest:[9, 0, 0], head:[-9, 0, 0] } } };
const bodyScale = lk => (BODY[lk.body] || BODY.m).scale * (AGE[lk.age || 'adult'] || AGE.adult).k;

/* la forme de chaque partie, dans le repère de son articulation.
   « bare » : sans les petits détails (yeux, bouche, boutons…), pour dessiner le contour. */
function partGeo(id, look, bare){
  const g = geo(), lk = look || CHAR_LOOK[0], f = lk.body === 'f', kid = lk.age === 'kid';
  const H = c => hexRGB(c), SK = H(lk.skin), TOP = H(lk.top), BOT = H(lk.bottom), SHO = H(lk.shoes), HAIR = H(lk.hair);
  const IN = H(lk.inner || lk.top), SOLE = H(lk.sole || '#2A2C31'), SOCK = H(lk.socks || lk.bottom);
  const dark = (c, k) => c.map(v => v * k);
  const sleeveLong = !(lk.wear === 'tee' || lk.wear === 'dress');
  const sx = f ? 0.178 : 0.2, hx = f ? 0.102 : 0.095;
  // un membre en deux couleurs : le haut (habit) puis le bas (peau ou autre habit)
  const limb2 = (r1, r2, len, cut, cTop, cBot, ball0, ballCol) => {
    if(ball0) ball(g, 0, 0, 0, ball0, ball0, ball0, ballCol || cTop, 10);
    if(cut <= 0){ cyl(g, 0, 0, 0, r1, r2, len, cBot, 10); return; }
    if(cut >= len){ cyl(g, 0, 0, 0, r1, r2, len, cTop, 10); return; }
    const rm = r1 + (r2 - r1) * cut / len;
    cyl(g, 0, 0, 0, r1 + 0.006, rm + 0.006, cut, cTop, 10); cyl(g, 0, -cut, 0, rm, r2, len - cut, cBot, 10);
  };
  switch(id){
    case 'pelvis': {
      const c = lk.skirt ? H(lk.bottom) : BOT;
      box(g, 0, -0.01, 0, f ? 0.35 : 0.32, f ? 0.17 : 0.16, f ? 0.21 : 0.2, c);
      ball(g, hx, -0.06, 0, f ? 0.09 : 0.085, f ? 0.09 : 0.085, f ? 0.09 : 0.085, c, 10); ball(g, -hx, -0.06, 0, f ? 0.09 : 0.085, f ? 0.09 : 0.085, f ? 0.09 : 0.085, c, 10);
      if(lk.skirt){ const old = lk.age === 'old', len = old ? 0.5 : lk.wear === 'dress' ? 0.3 : 0.32; cyl(g, 0, 0.07, 0, f ? 0.18 : 0.172, old ? 0.255 : 0.245, len, c, 14); }
      else if(!bare) box(g, 0, 0.065, 0, (f ? 0.35 : 0.32) + 0.008, 0.03, (f ? 0.21 : 0.2) + 0.008, dark(BOT, 0.55));   // la ceinture
      if(lk.wear === 'coat' || lk.wear === 'cardigan') cyl(g, 0, 0.075, 0, f ? 0.186 : 0.178, f ? 0.2 : 0.19, lk.wear === 'coat' ? 0.2 : 0.1, TOP, 14);
      break;
    }
    case 'spine': {
      { const wb = f ? 0.24 : 0.28, wt = f ? 0.26 : 0.3, d = f ? 0.17 : 0.18; prismXY(g, [[-wb / 2, 0], [wb / 2, 0], [wt / 2, 0.2], [-wt / 2, 0.2]], -d / 2, d / 2, TOP); }
      if(!bare && (lk.wear === 'suit' || lk.wear === 'coat' || lk.wear === 'cardigan')){
        { const z = (f ? 0.085 : 0.09) + 0.0006; quad(g, [-0.035, 0.0, z], [0.035, 0.0, z], [0.035, 0.2, z], [-0.035, 0.2, z], IN); }         // le devant de la chemise
        if(lk.wear === 'cardigan') [0.04, 0.12].forEach(y => box(g, 0.05, y, f ? 0.086 : 0.091, 0.014, 0.014, 0.006, dark(TOP, 0.6)));
      }
      if(!bare && lk.tie) quad(g, [-0.018, 0.0, 0.0912], [0.018, 0.0, 0.0912], [0.012, 0.2, 0.0912], [-0.012, 0.2, 0.0912], H(lk.tie));
      break;
    }
    case 'chest': {
      { const wb = f ? 0.27 : 0.31, wt = f ? 0.33 : 0.39, d = f ? 0.2 : 0.22;
        prismXY(g, [[-wb / 2, -0.01], [wb / 2, -0.01], [wt / 2, 0.2], [wt / 2 - 0.035, 0.27], [-wt / 2 + 0.035, 0.27], [-wt / 2, 0.2]], -d / 2 + 0.005, d / 2 + 0.005, TOP); }
      ball(g, sx, 0.228, 0, 0.058, 0.058, 0.058, TOP, 10); ball(g, -sx, 0.228, 0, 0.058, 0.058, 0.058, TOP, 10);
      cyl(g, 0, 0.34, 0, f ? 0.045 : 0.05, f ? 0.05 : 0.055, 0.08, SK, 10);
      if(f && !kid) ball(g, 0, 0.115, 0.08, 0.125, 0.052, 0.03, TOP, 10);
      const zf = (f ? 0.1 : 0.11) + 0.0055;
      if(!bare){
        if(lk.wear === 'suit' || lk.wear === 'coat' || lk.wear === 'cardigan'){
          // l'encolure en V : la chemise, la cravate, les revers de la veste
          tri(g, [-0.075, 0.27, zf], [0, 0.04, zf], [0.075, 0.27, zf], IN);
          if(lk.tie){ tri(g, [-0.02, 0.255, zf + 0.001], [0, 0.03, zf + 0.001], [0.02, 0.255, zf + 0.001], H(lk.tie)); box(g, 0, 0.255, zf, 0.032, 0.025, 0.006, H(lk.tie)); }
          const lap = dark(TOP, 0.72);
          tri(g, [-0.075, 0.27, zf + 0.0015], [-0.03, 0.12, zf + 0.0015], [-0.0, 0.04, zf + 0.0015], lap); tri(g, [0.075, 0.27, zf + 0.0015], [0, 0.04, zf + 0.0015], [0.03, 0.12, zf + 0.0015], lap);
        }
        if(lk.wear === 'sweater' || lk.wear === 'tee' || lk.wear === 'dress' || lk.wear === 'blouse') cyl(g, 0, 0.305, 0, f ? 0.058 : 0.064, f ? 0.06 : 0.066, 0.025, dark(TOP, 0.82), 12);   // le col
      }
      break;
    }
    case 'head': {
      const B = SK, LIP = H(lk.lips || '#A26A60'), BROW = dark(HAIR, lk.age === 'old' ? 0.85 : 0.9);
      ball(g, 0, 0.125, 0.0, 0.097, 0.118, 0.106, B, 14);                   // le crâne
      ball(g, 0, 0.06, 0.03, 0.074, 0.064, 0.078, B, 12);                   // la mâchoire, arrondie
      ball(g, 0.1, 0.112, -0.004, 0.018, 0.036, 0.026, B, 8); ball(g, -0.1, 0.112, -0.004, 0.018, 0.036, 0.026, B, 8);   // les oreilles
      ball(g, 0, 0.1, 0.1, 0.014, 0.033, 0.022, B, 8); ball(g, 0, 0.084, 0.113, 0.016, 0.013, 0.014, B, 8);              // le nez
      if(!bare){
        // les yeux : le blanc, puis l'iris ; les sourcils, posés sur le front ; la bouche
        const zs = (x, y) => 0.106 * Math.sqrt(Math.max(0, 1 - (x / 0.097) ** 2 - ((y - 0.125) / 0.118) ** 2)) + 0.003;
        [0.036, -0.036].forEach(x => {
          ball(g, x, 0.128, 0.092, 0.019, 0.013, 0.012, [0.96, 0.95, 0.93], 8);
          ball(g, x, 0.128, 0.1, 0.0085, 0.0095, 0.007, [0.17, 0.13, 0.11], 8);
          const s = x > 0 ? 1 : -1, xi = x - 0.021 * s, xo = x + 0.021 * s;
          const P = [[xi, 0.152], [xo, 0.157], [xo, 0.165], [xi, 0.162]].map(([a, b]) => [a, b, zs(a, b)]);
          if(s > 0) quad(g, P[0], P[1], P[2], P[3], BROW); else quad(g, P[0], P[3], P[2], P[1], BROW);
        });
        ball(g, 0, 0.054, 0.101, f ? 0.023 : 0.026, 0.007, 0.01, LIP, 8);
        if(lk.stache) ball(g, 0, 0.068, 0.106, 0.034, 0.009, 0.012, HAIR, 8);
        if(lk.glasses){ const K = [0.2, 0.2, 0.22];
          [0.037, -0.037].forEach(x => { box(g, x, 0.144, 0.113, 0.042, 0.005, 0.005, K); box(g, x, 0.112, 0.113, 0.042, 0.005, 0.005, K); box(g, x - 0.02, 0.128, 0.113, 0.005, 0.036, 0.005, K); box(g, x + 0.02, 0.128, 0.113, 0.005, 0.036, 0.005, K); });
          box(g, 0, 0.13, 0.114, 0.016, 0.005, 0.005, K); [1, -1].forEach(sd => box(g, sd * 0.08, 0.135, 0.058, 0.005, 0.005, 0.118, K, Math.atan2(sd * 0.36, -0.93) + Math.PI)); }
      }
      // les cheveux
      const hs = lk.hairStyle;
      if(hs === 'short' || hs === 'messy' || hs === 'curly'){
        const puff = hs === 'curly' ? 0.018 : hs === 'messy' ? 0.01 : 0;
        ball(g, 0, 0.16 + puff * 0.6, -0.012, 0.103 + puff, 0.094 + puff, 0.104 + puff, HAIR, 12);
        box(g, 0, 0.12, -0.075, 0.18 + puff, 0.1, 0.06, HAIR);
        if(hs === 'messy') [[0.03, 0.25, 0.04], [-0.04, 0.245, 0.02], [0.0, 0.255, -0.02]].forEach(([x, y, z]) => ball(g, x, y, z, 0.03, 0.022, 0.03, HAIR, 6));
      } else if(hs === 'bald'){
        ball(g, 0, 0.115, -0.03, 0.102, 0.06, 0.09, HAIR, 12);             // une couronne de cheveux blancs, sur les côtés et derrière
      } else {
        ball(g, 0, 0.162, -0.02, 0.105, 0.101, 0.103, HAIR, 12);
        if(hs === 'bun') ball(g, 0, 0.2, -0.112, 0.055, 0.055, 0.05, HAIR, 10);
        if(hs === 'long'){ box(g, 0, 0.03, -0.07, 0.19, 0.25, 0.07, HAIR); box(g, 0.087, 0.07, 0.0, 0.028, 0.17, 0.09, HAIR); box(g, -0.087, 0.07, 0.0, 0.028, 0.17, 0.09, HAIR); }
        if(hs === 'pigtails') [0.1, -0.1].forEach(x => { ball(g, x, 0.15, -0.05, 0.03, 0.03, 0.03, H('#D9707A'), 6); ball(g, x * 1.15, 0.08, -0.06, 0.04, 0.07, 0.04, HAIR, 8); });
      }
      break;
    }
    case 'armL': case 'armR': {
      const r1 = f ? 0.05 : 0.058, r2 = f ? 0.042 : 0.048;
      limb2(r1, r2, 0.28, sleeveLong ? 0.28 : 0.11, TOP, SK);
      break;
    }
    case 'foreL': case 'foreR': {
      const r1 = f ? 0.041 : 0.047, r2 = f ? 0.033 : 0.038, b0 = f ? 0.045 : 0.051;
      if(sleeveLong){ limb2(r1, r2, 0.25, 0.235, TOP, SK, b0, TOP); if(!bare) cyl(g, 0, -0.2, 0, r2 + 0.009, r2 + 0.009, 0.035, lk.wear === 'suit' ? IN : dark(TOP, 0.85), 10); }
      else limb2(r1, r2, 0.25, 0, SK, SK, b0, SK);
      break;
    }
    case 'handL': case 'handR': {
      const s = id === 'handL' ? -1 : 1;
      ball(g, 0, 0, 0, 0.034, 0.034, 0.034, SK, 8);
      ball(g, 0, -0.07, 0.004, f ? 0.034 : 0.038, 0.052, 0.018, SK, 10);
      box(g, 0, -0.12, 0.006, f ? 0.058 : 0.066, 0.05, 0.026, SK);
      ball(g, s * 0.037, -0.06, 0.02, 0.013, 0.032, 0.013, SK, 6);
      break;
    }
    case 'thighL': case 'thighR': {
      const r1 = f ? 0.09 : 0.085, r2 = f ? 0.06 : 0.062;
      if(lk.skirt) limb2(r1, r2, 0.42, lk.wear === 'dress' ? 0.2 : lk.age === 'old' ? 0.42 : 0.24, BOT, lk.age === 'old' ? BOT : SK);
      else if(lk.shorts) limb2(r1, r2, 0.42, 0.22, BOT, SK);
      else if(lk.wear === 'coat') limb2(r1, r2, 0.42, 0.24, TOP, BOT);
      else limb2(r1, r2, 0.42, 0.42, BOT, BOT);
      break;
    }
    case 'shinL': case 'shinR': {
      const r1 = f ? 0.056 : 0.06, r2 = f ? 0.04 : 0.045, b0 = f ? 0.06 : 0.064;
      const leg = (lk.skirt || lk.shorts) ? SK : BOT;
      limb2(r1, r2, 0.4, lk.skirt && lk.age === 'old' ? 0.06 : 0, lk.skirt ? BOT : leg, leg, b0, lk.age === 'old' && lk.skirt ? BOT : (lk.skirt || lk.shorts) ? SK : BOT);
      if(lk.socks && !bare) cyl(g, 0, -0.32, 0, r2 + 0.006, r2 + 0.005, 0.08, SOCK, 10);
      break;
    }
    case 'footL': case 'footR': {
      ball(g, 0, 0, 0, 0.043, 0.043, 0.043, (lk.skirt || lk.shorts) && !lk.socks ? SK : SOCK, 8);
      box(g, 0, -0.03, 0.055, f ? 0.085 : 0.095, 0.055, f ? 0.22 : 0.24, SHO);
      ball(g, 0, -0.03, 0.15, (f ? 0.085 : 0.095) / 2, 0.026, 0.045, SHO, 8);
      box(g, 0, -0.061, 0.06, (f ? 0.085 : 0.095) + 0.006, 0.014, (f ? 0.22 : 0.24) + 0.03, SOLE);
      break;
    }
  }
  return g;
}
function blankPose(){ const j = {}; JOINTS.forEach(J => j[J.id] = J.ax.map(() => 0)); j.armL[1] = 6; j.armR[1] = 6; return j; }
function newChar(i, spawn, look){
  const s = spawn || { x:i ? 0.8 : -0.8, z:0, ry:0 };
  return { look:look == null ? i % 2 : look, root:{ x:s.x, y:0, z:s.z, ry:s.ry || 0 }, j:blankPose() };
}

/* matrices de chaque partie pour un personnage (repère du monde) */
function charMatrices(ch){
  const out = {}, lk = lookOf(ch), B = BODY[lk.body] || BODY.m, A = AGE[lk.age || 'adult'] || AGE.adult, stoop = A.stoop || {};
  for(const J of JOINTS){
    const v = ch.j[J.id] || [], add = stoop[J.id] || [];
    // ordre : tourner (y), puis lever/plier (x), puis écarter/incliner (z)
    const val = k => { let a = 0; J.ax.forEach((x, i) => { if(x[0] === k) a += x[1] * ((v[i] || 0) + (add[i] || 0)) * D2R; }); return a; };
    const R = M4.mul(M4.mul(M4.ry(val('y')), M4.rx(val('x'))), M4.rz(val('z')));
    const o = B.off[J.id] || J.off, local = M4.mul(M4.trans(o[0], o[1], o[2]), R);
    if(!J.parent){
      const k = B.scale * A.k, W = M4.mul(M4.mul(M4.trans(ch.root.x, ch.root.y, ch.root.z), M4.ry(ch.root.ry * D2R)), [k,0,0,0, 0,k,0,0, 0,0,k,0, 0,0,0,1]);
      out[J.id] = M4.mul(W, local);
    } else out[J.id] = M4.mul(out[J.parent], local);
  }
  // les enfants : une tête un peu plus grosse que le corps
  if(A.head !== 1){ const h = A.head; out.head = M4.mul(out.head, [h,0,0,0, 0,h,0,0, 0,0,h,0, 0,0,0,1]); }
  return out;
}

/* ---------- Poses rapides (valeurs par articulation, dans l'ordre de ses réglages) ----------
   Les gestes où les mains doivent tomber juste (le volant, le guidon, l'arme, la tête) ont été
   calculés : on a cherché les angles des bras qui posent la paume exactement sur la cible. */
const POSE_GROUPS = [['move', 'Debout et en mouvement', 'Standing and moving'], ['seat', 'Assis, à genoux, au sol', 'Seated, kneeling, on the ground'], ['gest', 'Les gestes', 'Gestures'], ['gun', 'Avec un pistolet', 'With a handgun'], ['moto', 'À moto', 'On a motorbike']];
const POSES = [
  { id:'stand', g:'move', fr:'Debout', en:'Standing', j:{}, y:0 },
  { id:'walk', g:'move', fr:'Marche', en:'Walking', y:-0.015, j:{ thighL:[24, 0, 0], shinL:[8], footL:[-8], thighR:[-18, 0, 0], shinR:[26], footR:[10], armL:[-18, 6, 0], foreL:[12, 0], armR:[20, 6, 0], foreR:[22, 0], spine:[4, 6, 0] } },
  { id:'run', g:'move', fr:'Course', en:'Running', y:-0.2, j:{ thighL:[60, 0, 0], shinL:[80], footL:[-10], thighR:[-28, 0, 0], shinR:[70], footR:[30], spine:[14, 8, 0], chest:[6, 0, 0], armL:[-35, 8, 0], foreL:[95, 0], armR:[50, 8, 0], foreR:[95, 0] } },
  { id:'sit', g:'seat', fr:'Assis', en:'Sitting', y:-0.4, j:{ thighL:[90, 6, 0], shinL:[88], thighR:[90, 6, 0], shinR:[88], armL:[22, 8, 0], foreL:[58, 0], armR:[22, 8, 0], foreR:[58, 0], spine:[6, 0, 0] } },
  { id:'crouch', g:'seat', fr:'Accroupi', en:'Crouching', y:-0.62, j:{ thighL:[115, 10, 0], shinL:[135], footL:[-25], thighR:[115, 10, 0], shinR:[135], footR:[-25], spine:[28, 0, 0], chest:[12, 0, 0], head:[-30, 0, 0], armL:[40, 10, 0], foreL:[40, 0], armR:[40, 10, 0], foreR:[40, 0] } },
  { id:'drive', g:'seat', fr:'Au volant', en:'Driving', y:-0.35, j:{ thighL:[90, 8, 0], shinL:[25], footL:[-12], thighR:[90, 8, 0], shinR:[25], footR:[-12], armL:[42, -15, -10], foreL:[69, 28], armR:[42, -15, 10], foreR:[69, -28], spine:[-4, 0, 0] } },
  { id:'cross', g:'move', fr:'Bras croisés', en:'Arms crossed', y:0, j:{ armR:[10, 40, 90], foreR:[90, 0], armL:[15, 50, -90], foreL:[90, 0], head:[-4, 0, 0] } },
  { id:'hips', g:'move', fr:'Mains sur les hanches', en:'Hands on hips', y:0, j:{ armR:[-35, 0, 90], foreR:[70, 0], armL:[-35, 0, -90], foreL:[70, 0], chest:[-4, 0, 0] } },
  { id:'point', g:'gest', fr:'Pointer', en:'Pointing', y:0, j:{ armR:[88, 8, 0], foreR:[4, 0], head:[0, -12, 0], chest:[0, -10, 0], handR:[-8, 0] } },
  { id:'wave', g:'gest', fr:'Saluer', en:'Waving', y:0, j:{ armR:[105, -10, -90], foreR:[80, 0], handR:[-10, 0], head:[-4, -6, 0] } },
  { id:'think', g:'gest', fr:'Réfléchir', en:'Thinking', y:0, j:{ armR:[35, 20, 60], foreR:[130, 0], armL:[15, 50, -90], foreL:[90, 0], head:[10, 0, 4] } },
  { id:'phone', g:'gest', prop:'phone', fr:'Au téléphone', en:'On the phone', y:0, j:{ armR:[65, 35, 30], foreR:[150, 0], handR:[-10, 0], head:[6, 0, -10] } },
  { id:'up', g:'gest', fr:'Mains en l’air', en:'Hands up', y:0, j:{ armL:[150, 28, 0], foreL:[38, 0], armR:[150, 28, 0], foreR:[38, 0], head:[-8, 0, 0] } },
  { id:'sitground', g:'seat', fr:'Assis par terre', en:'Sitting on the ground', y:-0.83, j:{ thighL:[120, 10, 0], shinL:[83], footL:[10], thighR:[120, 10, 0], shinR:[83], footR:[10], spine:[10, 0, 0], armL:[55, 12, 0], foreL:[25, 0], armR:[55, 12, 0], foreR:[25, 0] } },
  { id:'lie', g:'seat', fr:'Allongé', en:'Lying down', y:-0.83, j:{ pelvis:[-90, 0], head:[10, 0, 0], armL:[0, 10, 0], armR:[0, 10, 0] } },
  { id:'aim2', fr:'Viser à deux mains', en:'Two-handed aim', g:'gun', prop:'gun', y:0, j:{ head:[6,  0,  0], armL:[50,  -10,  0], foreL:[70,  -19], handL:[0,  0], armR:[61,  -15,  0], foreR:[55,  14], handR:[0,  0] } },
  { id:'aim1', fr:'Viser à une main', en:'One-handed aim', g:'gun', prop:'gun', y:0, j:{ chest:[0,  -8,  0], head:[0,  8,  0], armR:[92,  -15,  -10], foreR:[5,  39], handR:[0,  0] } },
  { id:'gunDown', fr:'Arme baissée', en:'Gun lowered', g:'gun', prop:'gun', y:0, j:{ head:[10,  0,  0], armL:[7,  -7,  15], foreL:[56,  -44], handL:[0,  0], armR:[10,  -15,  -1], foreR:[55,  8], handR:[0,  0] } },
  { id:'crouchAim', fr:'Accroupi, en joue', en:'Crouched, aiming', g:'gun', prop:'gun', y:-0.62, j:{ thighL:[115,  10,  0], shinL:[135], footL:[-25], thighR:[115,  10,  0], shinR:[135], footR:[-25], spine:[12,  0,  0], chest:[0,  0,  0], head:[-14,  0,  0], armL:[68,  -15,  -22], foreL:[75,  19], armR:[76,  -3,  23], foreR:[60,  -6], handL:[0,  0], handR:[0,  0] } },
  { id:'kneel', fr:'À genoux', en:'Kneeling', g:'seat', y:-0.47, j:{ thighL:[0,  6,  0], shinL:[92], footL:[30], thighR:[0,  6,  0], shinR:[92], footR:[30], armL:[0,  -12,  55], foreL:[1,  79], handL:[-1,  0], armR:[0,  -12,  -55], foreR:[1,  -79], handR:[-1,  0] } },
  { id:'kneelHands', fr:'À genoux, mains sur la tête', en:'Kneeling, hands on head', g:'gun', prop:'gun', y:-0.47, j:{ thighL:[0,  6,  0], shinL:[92], footL:[30], thighR:[0,  6,  0], shinR:[92], footR:[30], head:[12,  0,  0], armL:[100,  -11,  -52], foreL:[103,  0], handL:[0,  0], armR:[100,  -11,  53], foreR:[103,  0], handR:[0,  0] } },
  { id:'oneKnee', fr:'Un genou à terre', en:'One knee down', g:'seat', y:-0.47, j:{ thighL:[0,  4,  0], shinL:[92], footL:[30], thighR:[88,  4,  0], shinR:[88], footR:[0], armL:[0,  -14,  50], foreL:[0,  76], handL:[-1,  0], armR:[32,  -15,  -15], foreR:[2,  21], handR:[0,  0] } },
  { id:'handshake', fr:'Serrer la main', en:'Handshake', g:'gest', y:0, j:{ armR:[34,  -15,  0], foreR:[18,  -13], handR:[0,  0] } },
  { id:'hug', fr:'Prendre dans ses bras', en:'Hugging', g:'gest', y:0, j:{ head:[0,  25,  6], armL:[42,  -14,  0], foreL:[78,  -11], handL:[0,  0], armR:[33,  -8,  6], foreR:[82,  9], handR:[0,  0] } },
  { id:'drink', fr:'Boire', en:'Drinking', g:'gest', y:0, j:{ head:[-12,  0,  0], armR:[54,  -4,  45], foreR:[123,  0], handR:[0,  0] } },
  { id:'shout', fr:'Crier (mains en porte-voix)', en:'Shouting', g:'gest', y:0, j:{ head:[-14,  0,  0], chest:[-4,  0,  0], armL:[59,  -4,  -45], foreL:[127,  0], handL:[0,  0], armR:[59,  -4,  45], foreR:[127,  0], handR:[0,  0] } },
  { id:'readPhone', fr:'Regarder son téléphone', en:'Looking at the phone', g:'gest', y:0, j:{ head:[32,  0,  0], armL:[-9,  -15,  9], foreL:[88,  -26], handL:[0,  0], armR:[-2,  -7,  -21], foreR:[85,  45], handR:[0,  0] } },
  { id:'pocket', fr:'Mains dans les poches', en:'Hands in pockets', g:'move', y:0, j:{ armL:[0,  -15,  15], foreL:[17,  58], handL:[0,  0], armR:[0,  -15,  -15], foreR:[17,  -58], handR:[0,  0] } },
  { id:'punch', fr:'Coup de poing', en:'Punching', g:'gest', y:0, j:{ spine:[4,  -14,  0], chest:[4,  -10,  0], thighR:[-10,  0,  0], thighL:[14,  0,  0], shinL:[10], armL:[40,  -2,  31], foreL:[142,  -30], handL:[0,  0], armR:[102,  -15,  21], foreR:[3,  26], handR:[0,  0] } },
  { id:'guard', fr:'En garde', en:'On guard', g:'gest', y:0, j:{ thighL:[16,  4,  0], thighR:[-12,  4,  0], shinR:[12], spine:[6,  0,  0], head:[6,  0,  0], armL:[57,  -8,  0], foreL:[101,  -15], handL:[0,  0], armR:[49,  -12,  15], foreR:[111,  0], handR:[0,  0] } },
  { id:'headInHands', fr:'La tête dans les mains', en:'Head in hands', g:'seat', y:-0.4, j:{ thighL:[90,  6,  0], shinL:[88], thighR:[90,  6,  0], shinR:[88], armL:[42,  7,  -45], foreL:[133,  0], armR:[42,  7,  45], foreR:[133,  0], spine:[24,  0,  0], chest:[14,  0,  0], head:[28,  0,  0], handL:[0,  0], handR:[0,  0] } },
  { id:'lookBack', fr:'Se retourner', en:'Looking back', g:'move', y:0, j:{ chest:[0,  30,  0], spine:[0,  18,  0], head:[0,  70,  0], armL:[8,  8,  0], armR:[-8,  8,  0] } },
  { id:'ride', fr:'À moto (pilote)', en:'Riding (driver)', g:'moto', y:-0.02, j:{ spine:[16,  0,  0], chest:[10,  0,  0], head:[-22,  0,  0], armL:[76,  10,  0], foreL:[6,  32], handL:[0,  0], armR:[76,  10,  0], foreR:[6,  -32], handR:[0,  0], thighL:[71,  13,  0], shinL:[114], footL:[-37], thighR:[71,  13,  0], shinR:[114], footR:[-37] } },
  { id:'rideBack', fr:'À moto (passager)', en:'Riding (passenger)', g:'moto', y:0.02, j:{ spine:[10,  0,  0], head:[-10,  0,  0], thighL:[68,  21,  0], thighR:[68,  21,  0], shinL:[117], shinR:[117], armL:[27,  27,  2], foreL:[65,  -80], handL:[0,  0], armR:[27,  27,  -2], foreR:[65,  80], handR:[0,  0], footL:[-27], footR:[-27] } },
];
function applyPose(ch, pid){
  const P = POSES.find(p => p.id === pid); if(!P) return;
  ch.j = blankPose(); ch.pose = pid;
  // l'accessoire va avec la pose (le pistolet pour viser, le téléphone pour appeler), sinon on garde celui qu'on a choisi
  ch.prop = P.prop || (pid === 'phone' || pid === 'readPhone' ? 'phone' : ch.propUser ? ch.prop : null);
  for(const k in P.j) ch.j[k] = P.j[k].slice();
  ch.root.y = (P.y || 0) * bodyScale(lookOf(ch));    // un enfant plus petit descend moins pour s'asseoir
}
/* assis sur un vrai siège (canapé, banc, voiture) : le bassin reste à la hauteur du siège, quelle que soit la taille */
const SEATED = { sit:1, drive:1, headInHands:1 };
function seatY(ch, adultY){ return 0.94 + adultY - 0.94 * bodyScale(lookOf(ch)); }

/* ---------- Les lieux ----------
   Chaque lieu : sa géométrie (une seule forme, couleurs par sommet), où placer les deux
   personnages, et un premier cadrage. Les murs, et ce qui est collé aux murs (fenêtres,
   portes, tableaux), ne se voient que de l'intérieur : la caméra peut passer derrière. */
const SETS = [
  { id:'garage', fr:'Garage', en:'Garage' },
  { id:'office', fr:'Bureau', en:'Office' },
  { id:'living', fr:'Salon', en:'Living room' },
  { id:'cafe', fr:'Café', en:'Café' },
  { id:'hall', fr:'Couloir', en:'Hallway' },
  { id:'alley', fr:'Ruelle', en:'Alley' },
  { id:'taxi', fr:'Taxi', en:'Taxi' },
  { id:'park', fr:'Parc', en:'Park' },
  { id:'street', fr:'Grande rue', en:'City street', big:true },
  { id:'beach', fr:'Plage', en:'Beach', big:true },
  { id:'stadium', fr:'Stade', en:'Stadium', big:true },
  { id:'country', fr:'Campagne', en:'Countryside', big:true },
  { id:'house', fr:'Maison de campagne', en:'Country house' },
  { id:'roof', fr:'Toit d’immeuble', en:'Rooftop' },
  { id:'warehouse', fr:'Entrepôt', en:'Warehouse' },
];
const SET_DEF = {
  garage:{
    spawn:[{ x:-0.7, z:0.4, ry:20 }, { x:0.9, z:0.2, ry:-25 }],
    cam:{ tx:0, ty:1.05, tz:0, yaw:12, pitch:-6, dist:5.6, lens:28 },
    build(g){
      floor(g, -4, -4, 4, 4, 0, '#8D9198');
      for(let i = -3; i <= 3; i++) box(g, i * 1.15, 0.002, 0, 0.02, 0.004, 8, '#80848B');
      wall(g, [-4, -4], [4, -4], 3.2, '#C9CCD1'); wall(g, [-4, 4], [-4, -4], 3.2, '#BEC2C8'); wall(g, [4, -4], [4, 4], 3.2, '#BEC2C8');
      // le 4e mur, pour les contrechamps : une porte et un tableau à outils, collés au mur (vus seulement de l'intérieur)
      wall(g, [4, 4], [-4, 4], 3.2, '#C4C8CE'); wall(g, [2.275, 3.99], [1.325, 3.99], 2.1, '#7A7F88'); wall(g, [2.2, 3.985], [2.12, 3.985], 0.06, '#2C2E33', 1.02); wall(g, [-1.7, 3.99], [-3.3, 3.99], 0.9, '#8A6A4A', 0.95);
      floor(g, -4, -4, 4, 4, 3.2, '#A9ADB4', true);
      // porte de garage à lattes
      wall(g, [-1.1, -3.97], [2.3, -3.97], 2.5, '#A8ADB5');
      for(let i = 0; i < 9; i++) wall(g, [-1.1, -3.95], [2.3, -3.95], 0.025, '#8F959E', 0.1375 + i * 0.28);
      wall(g, [-1.2, -3.94], [2.4, -3.94], 0.12, '#7A7F88', 2.49);
      // établi, panneau à outils, étagère, bidons, pneus
      box(g, -3.35, 0.9, -1.2, 1.1, 0.07, 2.6, '#8A6A4A'); box(g, -3.35, 0.45, -2.3, 1.0, 0.9, 0.06, '#6E5440'); box(g, -3.35, 0.45, -0.0, 1.0, 0.9, 0.06, '#6E5440'); box(g, -3.35, 0.25, -1.2, 1.0, 0.05, 2.5, '#6E5440');
      wall(g, [-3.97, -0.1], [-3.97, -2.3], 1.0, '#C9B48F', 1.25);
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
      // le 4e mur, pour les contrechamps : la porte et un tableau, collés au mur (vus seulement de l'intérieur)
      wall(g, [3.5, 3.5], [-3.5, 3.5], 2.9, '#E1DCD3'); wall(g, [-1.14, 3.49], [-2.06, 3.49], 2.06, '#8C6B4E'); wall(g, [-1.21, 3.485], [-1.29, 3.485], 0.04, '#C9B48F', 0.98);
      wall(g, [1.75, 3.49], [0.65, 3.49], 0.75, '#3D5A80', 1.225); wall(g, [1.65, 3.485], [0.75, 3.485], 0.55, '#A9C9DE', 1.325);
      floor(g, -3.5, -3.5, 3.5, 3.5, 2.9, '#EEEBE6', true);
      wall(g, [-3.5, -3.48], [3.5, -3.48], 0.1, '#BDB6AA');
      // fenêtre
      wall(g, [-2.1, -3.485], [0.1, -3.485], 1.4, '#A9C9DE', 0.9);
      wall(g, [-2.15, -3.475], [0.15, -3.475], 0.06, '#F4F2EE', 0.85); wall(g, [-2.15, -3.475], [0.15, -3.475], 0.06, '#F4F2EE', 2.29);
      [-2.12, -1.0, 0.12].forEach(x => wall(g, [x - 0.03, -3.475], [x + 0.03, -3.475], 1.5, '#F4F2EE', 0.85)); wall(g, [-2.15, -3.475], [0.15, -3.475], 0.04, '#F4F2EE', 1.58);
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
    sky:{ top:'#9DB3C8', hor:'#D3DAE0', low:'#6E737B' }, fog:[30, 120],
    spawn:[{ x:-0.5, z:0.3, ry:30 }, { x:0.7, z:-0.5, ry:-150 }],
    cam:{ tx:0, ty:1.2, tz:0, yaw:6, pitch:-4, dist:6.4, lens:28 },
    build(g){
      floor(g, -2.4, -14, 2.4, 6, 0, '#5C6068');
      box(g, 0, 0.004, -4, 0.3, 0.008, 20, '#50545B');
      // deux immeubles : façades vues de la ruelle
      wall(g, [-2.4, 6], [-2.4, -14], 9, '#8E7E72'); wall(g, [2.4, -14], [2.4, 6], 9, '#9A8B7E');
      for(let z = -12; z <= 4; z += 2.6) for(let y = 3.0; y < 8.5; y += 2.6){ wall(g, [-2.37, z + 0.45], [-2.37, z - 0.45], 1.3, '#3E4552', y - 0.65); wall(g, [2.37, z + 0.75], [2.37, z + 1.65], 1.3, '#3E4552', y + 0.35); }
      wall(g, [-2.4, -14], [2.4, -14], 9, '#7E7064');
      wall(g, [-0.8, -13.98], [0.2, -13.98], 2.2, '#4A3B33');
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
    bg:'#CFD8E1', sky:{ top:'#8FB3D4', hor:'#DCE4EB', low:'#8A8E95' }, fog:[30, 140],
    cam:{ tx:0, ty:1.0, tz:-0.2, yaw:58, pitch:-9, dist:6.4, lens:35 },
    build(g, gl){
      // la rue : chaussée, passage piéton, trottoir, façades de boutiques
      floor(g, -14, -16, 14, 16, 0, '#4A4E55');
      for(let z = -15; z < 16; z += 3.2) box(g, 3.1, 0.003, z, 0.12, 0.006, 1.7, '#D9D3B8');
      for(let x = -2.2; x <= 2.2; x += 0.62) box(g, x, 0.003, 5.2, 0.36, 0.006, 2.2, '#D9D3B8');
      box(g, -2.95, 0.07, 0, 0.18, 0.14, 32, '#8D9198'); floor(g, -14, -16, -3.04, 16, 0.14, '#8A8E95');
      for(let z = -15; z < 16; z += 1.2) box(g, -5, 0.142, z, 3.9, 0.004, 0.02, '#7C8087');
      wall(g, [-7, 16], [-7, -16], 7, '#9A8B7E');
      [[-9.5, '#2F6E4F'], [-4.5, '#9B3B33'], [0.5, '#3D5A80'], [5.5, '#C99E2A'], [10.5, '#2F6E4F']].forEach(([z, c]) => {
        wall(g, [-6.99, z + 2], [-6.99, z - 2], 2.4, '#2E3340', 0.15); wall(g, [-6.98, z + 0.4], [-6.98, z - 0.5], 2.1, '#1E2129', 0.15);
        prism(g, [[z + 2.1, 3.0], [z - 2.1, 3.0], [z - 2.1, 3.12], [z + 2.1, 3.12]], -7, -6.1, c);
        prism(g, [[z + 2.1, 3.0], [z - 2.1, 3.0], [z - 2.1, 2.7], [z + 2.1, 2.7]], -6.1, -6.0, c);
        for(let k = 0; k < 2; k++) wall(g, [-6.99, z + 1.6 - k * 2.4], [-6.99, z + 0.8 - k * 2.4], 1.1, '#3E4552', 4.2);
      });
      cyl(g, -3.4, 4.4, -6.5, 0.07, 0.07, 4.4, '#2C2E33', 6); box(g, -3.1, 4.4, -6.5, 0.7, 0.05, 0.08, '#2C2E33'); box(g, -2.8, 4.3, -6.5, 0.3, 0.12, 0.3, '#F2D98A');
      cyl(g, -3.35, 0.7, 3.2, 0.11, 0.13, 0.56, '#B4232C', 8); ball(g, -3.35, 0.72, 3.2, 0.11, 0.08, 0.11, '#B4232C', 8);
      // le taxi : carrosserie profilée, habitacle ouvert à travers les vitres
      const Y = '#E8B923', Yd = '#C99A17', K = '#24262B', S = '#3B3E45', CH = '#A9AEB6', W = 0.92;
      prism(g, [[2.42, 0.3], [2.44, 0.62], [2.32, 0.82], [1.2, 0.92], [1.15, 0.6], [1.15, 0.3]], -W, W, Y);            // capot
      prism(g, [[-1.75, 0.3], [-1.75, 0.95], [-2.4, 0.86], [-2.47, 0.62], [-2.45, 0.3]], -W, W, Y);                    // coffre
      [[W - 0.06, W], [-W, -W + 0.06]].forEach(([a, b]) => prism(g, [[1.15, 0.3], [1.15, 0.92], [-1.75, 0.95], [-1.75, 0.3]], a, b, Y));   // portières
      box(g, 0, 0.27, -0.3, 1.8, 0.06, 2.9, K);                                                                         // plancher
      // vitres : montants sombres, toit, pare-brise penché
      [[W - 0.05, W - 0.01], [-W + 0.01, -W + 0.05]].forEach(([a, b]) => {
        prism(g, [[1.2, 0.92], [1.12, 0.92], [0.5, 1.5], [0.58, 1.5]], a, b, K);
        prism(g, [[-0.27, 0.93], [-0.37, 0.93], [-0.37, 1.5], [-0.27, 1.5]], a, b, K);
        prism(g, [[-1.62, 0.95], [-1.75, 0.95], [-1.25, 1.5], [-1.15, 1.5]], a, b, K);
      });
      prism(g, [[0.6, 1.5], [0.52, 1.56], [-1.2, 1.56], [-1.28, 1.5]], -W + 0.02, W - 0.02, Y);
      // les vitres : transparentes, on voit les passagers à travers
      if(gl){
        prism(gl, [[1.15, 0.92], [1.13, 0.92], [0.54, 1.5], [0.56, 1.5]], -W + 0.05, W - 0.05, '#A9C4D2');                    // pare-brise
        prism(gl, [[-1.64, 0.95], [-1.24, 1.5], [-1.26, 1.5], [-1.66, 0.95]], -W + 0.05, W - 0.05, '#A9C4D2');                // lunette arrière
        [[W - 0.04, W - 0.03], [-W + 0.03, -W + 0.04]].forEach(([a, b]) => {
          prism(gl, [[1.12, 0.93], [0.54, 1.5], [-0.27, 1.5], [-0.27, 0.93]], a, b, '#A9C4D2');
          prism(gl, [[-0.37, 0.93], [-0.37, 1.5], [-1.16, 1.5], [-1.62, 0.95]], a, b, '#A9C4D2');
        });
      }
      // enseigne TAXI, posée sur le toit
      prism(g, [[0.05, 1.56], [-0.55, 1.56], [-0.5, 1.75], [0, 1.75]], -0.28, 0.28, '#F4EFD8'); box(g, 0, 1.756, -0.25, 0.56, 0.012, 0.5, Yd);
      [[0.282], [-0.282]].forEach(([x]) => { const sd = x > 0 ? 1 : -1; [0, 1, 2, 3].forEach(k => wall(g, sd > 0 ? [x, -0.05 - k * 0.11] : [x, -0.13 - k * 0.11], sd > 0 ? [x, -0.13 - k * 0.11] : [x, -0.05 - k * 0.11], 0.09, K, 1.61)); });
      // damier sur les portières (un seul côté de chaque carré : on ne le voit que de dehors)
      for(let i = 0; i < 24; i++){ const z = 1.05 - i * 0.12; for(let r = 0; r < 2; r++) if((i + r) % 2 === 0){
        wall(g, [W + 0.002, z], [W + 0.002, z - 0.12], 0.06, K, 0.68 + r * 0.06); wall(g, [-W - 0.002, z - 0.12], [-W - 0.002, z], 0.06, K, 0.68 + r * 0.06); } }
      [[0.0], [-0.95]].forEach(([z]) => { wall(g, [W + 0.003, z + 0.008], [W + 0.003, z - 0.008], 0.6, K, 0.33); wall(g, [-W - 0.003, z - 0.008], [-W - 0.003, z + 0.008], 0.6, K, 0.33); });
      // pare-chocs, calandre, phares, feux, rétroviseurs
      box(g, 0, 0.36, 2.48, 1.86, 0.12, 0.1, CH); box(g, 0, 0.36, -2.5, 1.86, 0.12, 0.1, CH);
      box(g, 0, 0.55, 2.445, 0.9, 0.16, 0.02, K);
      [0.66, -0.66].forEach(x => { box(g, x, 0.6, 2.44, 0.26, 0.12, 0.04, '#FBF6DF'); box(g, x, 0.7, -2.45, 0.24, 0.12, 0.04, '#C2453B'); });
      [W + 0.05, -W - 0.05].forEach(x => box(g, x, 1.0, 1.05, 0.1, 0.08, 0.14, K));
      // roues, avec enjoliveurs
      [[1.55], [-1.65]].forEach(([z]) => [1, -1].forEach(sd => {
        const x0 = sd > 0 ? W - 0.2 : -W - 0.04;
        cyl(g, x0, 0.34, z, 0.34, 0.34, 0.24, '#17181B', 14, 'x');
        cyl(g, sd > 0 ? W + 0.04 : -W - 0.05, 0.34, z, 0.17, 0.17, 0.01, CH, 10, 'x');
      }));
      // l'habitacle : tableau de bord, volant, sièges, plafonnier
      prism(g, [[1.15, 0.6], [1.15, 0.95], [0.95, 1.0], [0.85, 0.86], [0.9, 0.6]], -W + 0.06, W - 0.06, K);
      cyl(g, 0.37, 0.98, 0.78, 0.17, 0.17, 0.025, '#111214', 14, 'z'); cyl(g, 0.37, 0.98, 0.8, 0.03, 0.03, 0.2, '#111214', 6, 'z');
      [0.37, -0.37].forEach(x => { box(g, x, 0.44, 0.3, 0.54, 0.12, 0.5, S); prism(g, [[0.05, 0.5], [-0.07, 0.5], [-0.12, 1.22], [0.0, 1.22]], x - 0.27, x + 0.27, S); box(g, x, 1.3, -0.06, 0.24, 0.14, 0.09, S); });
      box(g, 0, 0.44, -0.82, 1.62, 0.12, 0.56, S); prism(g, [[-1.05, 0.5], [-1.17, 0.5], [-1.24, 1.12], [-1.12, 1.12]], -0.81, 0.81, S);
      box(g, 0, 0.88, -0.4, 0.04, 0.28, 0.02, '#8C9199');                     // la vitre de séparation, en partie
    },
  },
  living:{
    cam:{ tx:0, ty:0.95, tz:-1.4, yaw:40, pitch:-8, dist:4.4, lens:28 },
    build(g){
      floor(g, -3.8, -3.2, 3.8, 3.2, 0, '#9C7B5B');
      for(let x = -3.6; x < 3.8; x += 0.4) box(g, x, 0.002, 0, 0.012, 0.004, 6.4, '#8C6D50');
      wall(g, [-3.8, -3.2], [3.8, -3.2], 2.7, '#D9D2C5'); wall(g, [-3.8, 3.2], [-3.8, -3.2], 2.7, '#CFC7B8'); wall(g, [3.8, -3.2], [3.8, 3.2], 2.7, '#CFC7B8'); wall(g, [3.8, 3.2], [-3.8, 3.2], 2.7, '#D4CCBF');
      floor(g, -3.8, -3.2, 3.8, 3.2, 2.7, '#ECE8E1', true);
      // fenêtre, porte, tableau
      wall(g, [-3.79, 1.2], [-3.79, -0.8], 1.4, '#A9C9DE', 0.9); wall(g, [-3.785, 1.25], [-3.785, -0.85], 0.06, '#F4F2EE', 0.87); wall(g, [-3.785, 0.23], [-3.785, 0.17], 1.4, '#F4F2EE', 0.9);
      wall(g, [1.6, 3.19], [0.7, 3.19], 2.05, '#8C6B4E'); wall(g, [0.2, -3.19], [1.6, -3.19], 0.9, '#2F6E4F', 1.4);
      // tapis, canapé, table basse, meuble télé et télé
      floor(g, -1.6, -1.4, 1.6, 0.9, 0.006, '#B9876A');
      box(g, 0, 0.22, -2.2, 2.2, 0.44, 0.9, '#5A6B7C'); box(g, 0, 0.66, -2.58, 2.2, 0.5, 0.18, '#53637A');
      [1.18, -1.18].forEach(x => box(g, x, 0.36, -2.2, 0.2, 0.32, 0.92, '#53637A'));
      [-0.55, 0.55].forEach(x => box(g, x, 0.47, -2.17, 1.0, 0.06, 0.8, '#66788A'));
      box(g, 0, 0.38, -0.45, 1.1, 0.05, 0.6, '#6E5440'); [[-0.5, -0.7], [0.5, -0.7], [-0.5, -0.2], [0.5, -0.2]].forEach(([x, z]) => box(g, x, 0.18, z, 0.05, 0.36, 0.05, '#5B4532'));
      box(g, 0, 0.27, 2.9, 2.0, 0.54, 0.45, '#6E5440'); box(g, 0, 0.92, 3.0, 1.5, 0.82, 0.05, '#1E1F23'); box(g, 0, 0.92, 2.97, 1.42, 0.74, 0.01, '#2E3846');
      // lampadaire, plante, étagère
      cyl(g, 2.6, 1.6, -2.4, 0.02, 0.02, 1.6, '#2C2E33', 6); cyl(g, 2.6, 1.75, -2.4, 0.12, 0.24, 0.3, '#F2E6C9', 10); cyl(g, 2.6, 0.03, -2.4, 0.18, 0.18, 0.03, '#2C2E33', 10);
      cyl(g, -3.2, 0.35, 2.6, 0.2, 0.16, 0.35, '#B9876A', 8); ball(g, -3.2, 0.85, 2.6, 0.34, 0.5, 0.34, '#4E7C58', 8);
      box(g, 3.55, 1.0, 1.0, 0.4, 2.0, 1.2, '#7A5C42'); [0.5, 1.0, 1.5].forEach((y, k) => { for(let i = 0; i < 7; i++) box(g, 3.48, y + 0.13, 0.55 + i * 0.13, 0.22, 0.24 - (i % 3) * 0.03, 0.09, ['#9B3B33', '#3D5A80', '#C9B48F', '#2F6E4F'][(i + k) % 4]); });
    },
  },
  cafe:{
    cam:{ tx:0, ty:1.15, tz:0, yaw:-24, pitch:-6, dist:6.0, lens:28 },
    build(g){
      floor(g, -4.5, -3.5, 4.5, 3.5, 0, '#8E8577');
      for(let x = -4.2; x < 4.5; x += 0.6) for(let z = -3.2; z < 3.5; z += 0.6) if(((x + z) * 10 | 0) % 12 === 0) box(g, x, 0.002, z, 0.58, 0.004, 0.58, '#7E7568');
      wall(g, [-4.5, -3.5], [4.5, -3.5], 3.0, '#C9B9A3'); wall(g, [-4.5, 3.5], [-4.5, -3.5], 3.0, '#BFAE97'); wall(g, [4.5, -3.5], [4.5, 3.5], 3.0, '#BFAE97'); wall(g, [4.5, 3.5], [-4.5, 3.5], 3.0, '#C4B49D');
      floor(g, -4.5, -3.5, 4.5, 3.5, 3.0, '#5B4A3A', true);
      // la vitrine sur la rue et le tableau du menu
      wall(g, [4.49, -2.6], [4.49, 2.6], 2.0, '#A9C9DE', 0.5); for(let z = -2.6; z <= 2.61; z += 1.3) wall(g, [4.485, z - 0.03], [4.485, z + 0.03], 2.0, '#2C2E33', 0.5);
      wall(g, [-2.6, -3.49], [-0.4, -3.49], 1.0, '#26292F', 1.7); for(let i = 0; i < 4; i++) wall(g, [-2.4, -3.485], [-1.0 + (i % 2) * 0.3, -3.485], 0.03, '#E6E2DA', 2.45 - i * 0.18);
      // le comptoir, la machine à café, les tabourets
      box(g, -1.0, 0.52, -2.1, 3.6, 1.04, 0.6, '#6E5440'); box(g, -1.0, 1.06, -2.05, 3.7, 0.05, 0.75, '#3A3D44');
      box(g, -2.2, 1.28, -2.25, 0.5, 0.4, 0.4, '#A9AEB6'); box(g, -2.2, 1.12, -2.04, 0.3, 0.06, 0.06, '#2C2E33');
      box(g, -1.0, 1.0, -3.3, 3.8, 0.04, 0.35, '#6E5440'); box(g, -1.0, 1.7, -3.3, 3.8, 0.04, 0.35, '#6E5440');
      for(let i = 0; i < 9; i++) cyl(g, -2.6 + i * 0.4, 1.2, -3.3, 0.06, 0.05, 0.16, ['#2F6E4F', '#9B3B33', '#C9B48F'][i % 3], 8);
      [-2.2, -1.0, 0.2].forEach(x => { cyl(g, x, 0.76, -1.45, 0.19, 0.19, 0.05, '#2C2E33', 12); cyl(g, x, 0.72, -1.45, 0.03, 0.03, 0.7, '#3A3D44', 6); cyl(g, x, 0.02, -1.45, 0.2, 0.2, 0.02, '#3A3D44', 10); });
      // deux tables rondes avec leurs chaises
      [[2.2, 0.0], [1.2, 2.0]].forEach(([x, z]) => {
        cyl(g, x, 0.75, z, 0.42, 0.42, 0.04, '#E6E2DA', 14); cyl(g, x, 0.71, z, 0.04, 0.04, 0.7, '#2C2E33', 6); cyl(g, x, 0.02, z, 0.22, 0.22, 0.02, '#2C2E33', 10);
        [[-0.68, 0], [0.68, Math.PI]].forEach(([dx, ry]) => { const cx = x + dx; box(g, cx, 0.44, z, 0.42, 0.05, 0.42, '#7A5C42'); box(g, cx + (dx < 0 ? -0.19 : 0.19), 0.72, z, 0.04, 0.55, 0.4, '#7A5C42');
          [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]].forEach(([a, b]) => box(g, cx + a, 0.21, z + b, 0.03, 0.42, 0.03, '#5B4532')); });
      });
      // suspensions
      [-2.0, 0.0, 2.2].forEach(x => { cyl(g, x, 3.0, -1.1, 0.008, 0.008, 0.9, '#2C2E33', 4); cyl(g, x, 2.1, -1.1, 0.06, 0.22, 0.18, '#C99E2A', 10); });
    },
  },
  park:{
    bg:'#C6D6E4', sky:{ top:'#82B0D8', hor:'#DCE8EE', low:'#7C9A68' }, fog:[30, 140],
    cam:{ tx:0, ty:1.1, tz:0, yaw:18, pitch:-6, dist:6.2, lens:28 },
    build(g){
      floor(g, -18, -18, 18, 18, 0, '#6F8F5A');
      floor(g, -1.1, -18, 1.1, 18, 0.004, '#B9A88C');
      for(let i = 0; i < 60; i++){ const x = ((i * 7.31) % 34) - 17, z = ((i * 11.7) % 34) - 17; if(Math.abs(x) > 1.6) box(g, x, 0.004, z, 0.5, 0.006, 0.4, i % 2 ? '#668553' : '#789A63'); }
      // le banc
      box(g, -1.65, 0.46, -0.2, 0.44, 0.05, 1.7, '#8A6A4A');
      box(g, -1.86, 0.75, -0.2, 0.04, 0.34, 1.7, '#8A6A4A');
      [[-0.9], [0.5]].forEach(([dz]) => { box(g, -1.65, 0.22, -0.2 + dz * 0.9, 0.44, 0.44, 0.05, '#2C2E33'); box(g, -1.86, 0.7, -0.2 + dz * 0.9, 0.05, 0.5, 0.05, '#2C2E33'); });
      // arbres, buissons, lampadaire, poubelle, clôture au loin
      [[-4.5, -3.5, 1.0], [4.2, -6, 1.2], [-6.5, 4.5, 0.9], [5.5, 3.5, 1.1], [-3.2, -11, 1.3], [3.5, -13, 1.0], [8, -2, 1.2], [-9, -6, 1.1]].forEach(([x, z, k]) => {
        cyl(g, x, 1.6 * k, z, 0.14 * k, 0.2 * k, 1.6 * k, '#6B4E37', 8);
        ball(g, x, 2.6 * k, z, 1.3 * k, 1.1 * k, 1.3 * k, '#4E7C58', 9); ball(g, x + 0.5 * k, 2.2 * k, z + 0.3 * k, 0.8 * k, 0.7 * k, 0.8 * k, '#5A8A60', 8);
      });
      [[2.2, 1.5], [-2.6, 3.2], [2.6, -2.4]].forEach(([x, z]) => ball(g, x, 0.35, z, 0.6, 0.42, 0.5, '#557F57', 8));
      cyl(g, 1.6, 3.6, -3.0, 0.06, 0.06, 3.6, '#2C2E33', 6); ball(g, 1.6, 3.7, -3.0, 0.16, 0.2, 0.16, '#F2D98A', 8);
      cyl(g, -1.55, 0.45, 1.2, 0.22, 0.2, 0.45, '#2F6E4F', 10);
      for(let x = -17; x < 18; x += 0.5) box(g, x, 0.4, -17.5, 0.05, 0.8, 0.05, '#5E636C'); box(g, 0, 0.7, -17.5, 36, 0.04, 0.04, '#5E636C');
    },
  },
  hall:{
    cam:{ tx:0, ty:1.2, tz:0, yaw:8, pitch:-5, dist:5.6, lens:24 },
    build(g){
      floor(g, -1.6, -9, 1.6, 4, 0, '#8F8A82');
      for(let z = -8.6; z < 4; z += 0.8) box(g, 0, 0.002, z, 3.2, 0.004, 0.02, '#7F7A72');
      floor(g, -0.7, -9, 0.7, 4, 0.004, '#7A3B37');
      wall(g, [-1.6, 4], [-1.6, -9], 2.6, '#D8D4CC'); wall(g, [1.6, -9], [1.6, 4], 2.6, '#D2CEC6'); wall(g, [-1.6, -9], [1.6, -9], 2.6, '#CBC6BD'); wall(g, [1.6, 4], [-1.6, 4], 2.6, '#CBC6BD');
      floor(g, -1.6, -9, 1.6, 4, 2.6, '#EEEBE6', true);
      // les portes des appartements, numérotées par une plaque
      [-6.5, -3.0, 0.5].forEach((z, i) => {
        wall(g, [-1.59, z + 0.45], [-1.59, z - 0.45], 2.05, '#6E5440'); wall(g, [-1.585, z - 0.3], [-1.585, z - 0.36], 0.05, '#C9B48F', 1.0); wall(g, [-1.585, z + 0.08], [-1.585, z - 0.08], 0.08, '#C9B48F', 1.6);
        wall(g, [1.59, z - 1.2], [1.59, z - 0.3], 2.05, '#6E5440'); wall(g, [1.585, z - 0.45], [1.585, z - 0.39], 0.05, '#C9B48F', 1.0);
      });
      // l'ascenseur au fond
      wall(g, [-0.75, -8.99], [0.75, -8.99], 2.2, '#9AA0A8'); wall(g, [-0.01, -8.985], [0.01, -8.985], 2.2, '#5E636C'); wall(g, [0.9, -8.985], [1.0, -8.985], 0.2, '#2C2E33', 1.1);
      for(let z = -8; z < 4; z += 3) box(g, 0, 2.58, z, 0.6, 0.03, 0.6, '#F7F5F0');
      box(g, 1.45, 0.45, 2.6, 0.25, 0.9, 0.5, '#7A5C42'); cyl(g, 1.45, 1.2, 2.6, 0.12, 0.1, 0.3, '#B9876A', 8); ball(g, 1.45, 1.35, 2.6, 0.2, 0.22, 0.2, '#4E7C58', 7);
    },
  },
};
/* ---------- Les grands espaces ----------
   Dehors, le sol va loin et une brume légère cache l'horizon : la scène paraît
   immense sans rien coûter de plus à dessiner. */
/* une voiture simple (garée), orientée le long de la rue ; les vitres vont dans « gl » */
function car(g, gl, x, z, col, flip){
  const K = '#24262B', CH = '#A9AEB6', W = 0.88, s = flip ? -1 : 1, Z = v => z + v * s;
  const P = pts => pts.map(([a, b]) => [Z(a), b]);
  prism(g, P([[2.2, 0.3], [2.24, 0.62], [2.1, 0.8], [1.0, 0.88], [1.0, 0.3]]), x - W, x + W, col);
  prism(g, P([[-1.6, 0.3], [-1.6, 0.9], [-2.2, 0.82], [-2.26, 0.6], [-2.24, 0.3]]), x - W, x + W, col);
  prism(g, P([[1.0, 0.3], [1.0, 0.88], [-1.6, 0.9], [-1.6, 0.3]]), x - W, x + W, col);
  prism(g, P([[1.0, 0.88], [0.4, 1.38], [-1.1, 1.4], [-1.6, 0.9]]), x - W + 0.06, x + W - 0.06, K);
  prism(g, P([[0.36, 1.38], [-1.06, 1.4], [-1.04, 1.44], [0.34, 1.43]]), x - W + 0.08, x + W - 0.08, col);
  if(gl) [[x + W - 0.055, x + W - 0.045], [x - W + 0.045, x - W + 0.055]].forEach(([a, b]) => prism(gl, P([[0.95, 0.9], [0.4, 1.36], [-1.05, 1.38], [-1.52, 0.92]]), a, b, '#A9C4D2'));
  [1.4, -1.45].forEach(v => [x + W - 0.18, x - W - 0.04].forEach(x0 => { cyl(g, x0, 0.32, Z(v), 0.32, 0.32, 0.22, '#17181B', 12, 'x'); }));
  box(g, x, 0.36, Z(2.26), 1.7, 0.1, 0.08, CH); box(g, x, 0.36, Z(-2.28), 1.7, 0.1, 0.08, CH);
  [0.6, -0.6].forEach(dx => { box(g, x + dx, 0.6, Z(2.22), 0.24, 0.1, 0.04, '#FBF6DF'); box(g, x + dx, 0.66, Z(-2.24), 0.22, 0.1, 0.04, '#C2453B'); });
}
/* un arbre : un tronc et deux boules de feuillage */
function tree(g, x, z, k, c1, c2){ cyl(g, x, 1.6 * k, z, 0.14 * k, 0.2 * k, 1.6 * k, '#6B4E37', 8); ball(g, x, 2.6 * k, z, 1.3 * k, 1.1 * k, 1.3 * k, c1 || '#4E7C58', 9); ball(g, x + 0.5 * k, 2.2 * k, z + 0.3 * k, 0.8 * k, 0.7 * k, 0.8 * k, c2 || '#5A8A60', 8); }
/* un palmier : un tronc penché en tronçons, des palmes en lames */
function palm(g, x, z, k, lean){
  let px = x, py = 0, pz = z; const n = 6;
  for(let i = 0; i < n; i++){ const nx = px + lean * k * 0.14 * (i + 1) / n, ny = py + 0.85 * k; cyl(g, px, ny, pz, 0.12 * k * (1 - i * 0.06), 0.15 * k * (1 - i * 0.06), 0.88 * k, '#8A7356', 7); px = nx; py = ny; }
  for(let a = 0; a < 7; a++){ const t = a / 7 * Math.PI * 2, dx = Math.sin(t), dz = Math.cos(t);
    prism(g, [[0, 0.06], [1.6 * k, -0.52 * k], [1.5 * k, -0.6 * k], [0.06, -0.02]], -0.12, 0.12, '#4E7C58');
    // la palme est tracée dans le plan (z, y) : on la tourne autour du sommet
    const last = g.p.length - prismCount(4) * 9; rotY(g, last, t, px, py, pz);
  }
}
const prismCount = n => (n - 2) * 2 + n * 2;      // nombre de triangles d'un prisme à n côtés
/* tourne les derniers sommets ajoutés (depuis « from ») autour de la verticale, puis les pose en (x, y, z) */
function rotY(g, from, t, x, y, z){
  const c = Math.cos(t), s = Math.sin(t);
  for(let i = from; i < g.p.length; i += 3){
    const a = g.p[i], b = g.p[i + 2], na = g.n[i], nb = g.n[i + 2];
    g.p[i] = x + a * c + b * s; g.p[i + 1] += y; g.p[i + 2] = z - a * s + b * c;
    g.n[i] = na * c + nb * s; g.n[i + 2] = -na * s + nb * c;
  }
}
/* une façade d'immeuble, vue de la rue : sa couleur, ses fenêtres, sa vitrine en bas */
function facade(g, x, z0, z1, h, col, faceX, shop){
  const A = faceX > 0 ? [x, z0] : [x, z1], B = faceX > 0 ? [x, z1] : [x, z0];
  // le mur est vu de la rue (il regarde vers faceX)
  if(faceX < 0) wall(g, [x, z0], [x, z1], h, col); else wall(g, [x, z1], [x, z0], h, col);
  const off = x - faceX * 0.01, len = Math.abs(z1 - z0), zs = Math.min(z0, z1);
  for(let y = 3.6; y < h - 1.4; y += 3.0) for(let k = 0.9; k < len - 0.9; k += 2.2){
    const a = zs + k, b = zs + k + 1.1;
    if(faceX < 0) wall(g, [off, a], [off, b], 1.5, '#3E4552', y); else wall(g, [off, b], [off, a], 1.5, '#3E4552', y);
  }
  if(shop){
    if(faceX < 0) wall(g, [off, zs + 0.6], [off, zs + len - 0.6], 2.3, '#2E3340', 0.2); else wall(g, [off, zs + len - 0.6], [off, zs + 0.6], 2.3, '#2E3340', 0.2);
    // trois stores, un par vitrine
    for(let k = 0; k < 3; k++){ const a = zs + 0.6 + k * (len - 1.2) / 3 + 0.2, b = a + (len - 1.2) / 3 - 0.4;
      prismXY(g, [[x, 3.02], [x + faceX * 1.05, 2.62], [x + faceX * 1.05, 2.54], [x, 2.94]], a, b, shop); }
  }
}
Object.assign(SET_DEF, {
  street:{
    sky:{ top:'#86AFD3', hor:'#DCE6EE', low:'#9DA3AA' }, fog:[40, 190],
    cam:{ tx:-5.6, ty:1.2, tz:0.0, yaw:22, pitch:-4, dist:7.6, lens:28 },
    build(g, gl){
      floor(g, -60, -90, 60, 90, 0, '#4A4E55');
      for(let z = -88; z < 90; z += 6) box(g, 0, 0.003, z, 0.14, 0.006, 3, '#E6E0C4');
      [-3.4, 3.4].forEach(x => box(g, x, 0.003, 0, 0.12, 0.006, 180, '#D9D3B8'));
      for(let x = -3.2; x <= 3.2; x += 0.66) box(g, x, 0.003, 6, 0.4, 0.006, 3, '#E6E0C4');
      [-1, 1].forEach(sd => { box(g, sd * 4.05, 0.07, 0, 0.16, 0.14, 180, '#8D9198'); floor(g, sd < 0 ? -10 : 4.13, -90, sd < 0 ? -4.13 : 10, 90, 0.14, '#9A9EA5'); });
      for(let z = -88; z < 90; z += 1.4) [-1, 1].forEach(sd => box(g, sd * 7, 0.142, z, 5.7, 0.004, 0.02, '#8C9097'));
      // les immeubles des deux côtés : des hauteurs et des couleurs qui changent
      const cols = ['#B39C86', '#9A8B7E', '#C9B9A3', '#8E7E72', '#A6ACB4', '#BFA58A'], shops = ['#2F6E4F', '#9B3B33', '#3D5A80', '#C99E2A', null, '#7C6A8E'];
      let k = 0;
      for(let z = -80; z < 80; z += 12, k++){
        facade(g, -10, z, z + 12, 12 + (k * 7) % 9, cols[k % 6], 1, shops[k % 6]);
        facade(g, 10, z, z + 12, 13 + (k * 5) % 10, cols[(k + 3) % 6], -1, shops[(k + 2) % 6]);
      }
      // lampadaires, arbres, abribus, banc, feu tricolore, voitures garées
      for(let z = -60; z <= 60; z += 15) [-1, 1].forEach(sd => { const x = sd * 4.6; cyl(g, x, 4.6, z, 0.07, 0.08, 4.5, '#2C2E33', 6); box(g, x - sd * 0.35, 4.6, z, 0.8, 0.06, 0.1, '#2C2E33'); box(g, x - sd * 0.72, 4.5, z, 0.3, 0.12, 0.24, '#F2D98A'); });
      for(let z = -54; z <= 54; z += 18) [-1, 1].forEach(sd => { const x = sd * 5.2; box(g, x, 0.2, z + 7, 0.9, 0.12, 0.9, '#5E636C'); cyl(g, x, 2.2, z + 7, 0.09, 0.12, 2.1, '#6B4E37', 7); ball(g, x, 3.0, z + 7, 1.15, 1.0, 1.15, '#557F57', 9); });
      box(g, 6.8, 1.4, -8, 0.06, 2.5, 3.2, '#2C2E33'); box(g, 6.0, 2.68, -8, 1.8, 0.08, 3.4, '#3A3D44');
      [-9.55, -6.45].forEach(z => box(g, 6.0, 1.4, z, 1.6, 2.5, 0.06, '#2C2E33'));
      if(gl) wall(gl, [6.76, -9.5], [6.76, -6.5], 2.2, '#A9C4D2', 0.25);
      box(g, 6.3, 0.48, -8, 0.4, 0.05, 2.2, '#8A6A4A');
      cyl(g, -4.5, 3.0, 4.2, 0.07, 0.07, 3.0, '#2C2E33', 6); box(g, -4.5, 3.25, 4.2, 0.22, 0.6, 0.2, '#24262B');
      [['#C2453B', 3.42], ['#E8B923', 3.25], ['#4E9A5B', 3.08]].forEach(([c, y]) => box(g, -4.5, y, 4.31, 0.1, 0.1, 0.02, c));
      car(g, gl, 2.4, -14, '#3D5A80'); car(g, gl, 2.4, -24, '#9B3B33'); car(g, gl, -2.4, 18, '#E4E7EC', true); car(g, gl, 2.4, 22, '#2F6E4F');
      box(g, -4.7, 0.6, -3, 0.5, 0.9, 0.5, '#2F6E4F');
    },
  },
  beach:{
    sky:{ top:'#79AED8', hor:'#E2EEF3', low:'#BFD0D8' }, fog:[45, 220],
    cam:{ tx:1.5, ty:0.8, tz:1.0, yaw:40, pitch:-7, dist:9.0, lens:28 },
    build(g, gl){
      floor(g, -90, -6, 90, 80, 0, '#DDCCA3');
      for(let i = 0; i < 80; i++){ const x = ((i * 9.37) % 120) - 60, z = ((i * 13.1) % 70) - 4; box(g, x, 0.003, z, 0.9, 0.006, 0.5, i % 2 ? '#D3C196' : '#E4D5AE'); }
      floor(g, -90, -10, 90, -6, -0.005, '#BFAE8A');
      floor(g, -260, -300, 260, -10, -0.04, '#4F86A3');
      for(let z = -16; z > -120; z -= 9) box(g, ((z * 7.3) % 20), -0.03, z, 30, 0.004, 0.25, '#6B9DB8');
      box(g, 0, -0.025, -10.2, 180, 0.01, 0.5, '#EEF2F2');
      // parasols, serviettes, transats
      [[-2.6, -1.2, '#C9503C'], [3.8, 2.2, '#3D5A80'], [-7.5, 3.5, '#E3A33A'], [9, -0.5, '#2F6E4F']].forEach(([x, z, c]) => {
        cyl(g, x, 2.3, z, 0.025, 0.025, 2.3, '#E9E6E0', 6); cyl(g, x, 2.42, z, 0.05, 1.15, 0.34, c, 12); cyl(g, x, 2.08, z, 1.15, 1.12, 0.05, '#E9E6E0', 12);
        box(g, x + 1.0, 0.012, z + 0.6, 0.85, 0.02, 1.8, c === '#3D5A80' ? '#E8D9B5' : '#E9E4DA'); box(g, x + 1.0, 0.016, z + 0.6, 0.85, 0.02, 0.25, c);
      });
      [[1.6, 1.0], [-5.2, -0.4]].forEach(([x, z]) => { prism(g, [[z - 0.8, 0.28], [z + 0.8, 0.28], [z + 0.8, 0.34], [z - 0.8, 0.34]], x - 0.3, x + 0.3, '#F4F2EE'); prism(g, [[z - 0.8, 0.34], [z - 0.7, 0.34], [z - 1.15, 0.95], [z - 1.25, 0.95]], x - 0.3, x + 0.3, '#F4F2EE'); [z - 0.7, z + 0.7].forEach(zz => box(g, x, 0.14, zz, 0.6, 0.28, 0.05, '#C9C3B5')); });
      // le poste de secours, les palmiers, les rochers, le filet de volley
      [[-14.6, 4.4], [-12.4, 4.4], [-14.6, 6.6], [-12.4, 6.6]].forEach(([x, z]) => box(g, x, 1.1, z, 0.12, 2.2, 0.12, '#E9E6E0'));
      box(g, -13.5, 2.9, 5.5, 2.6, 1.4, 2.6, '#C9503C'); prism(g, [[4.0, 3.6], [7.0, 3.6], [5.5, 4.4]], -15, -12, '#E9E6E0');
      wall(g, [-14.3, 6.81], [-12.7, 6.81], 0.6, '#3E4552', 3.1);
      for(let i = 0; i < 8; i++) box(g, -13.5, 0.15 + i * 0.27, 7.05, 0.8, 0.04, 0.12, '#E9E6E0');
      palm(g, 13, 7, 1.0, 1.3); palm(g, 16, 3, 1.15, -1.0); palm(g, -20, 12, 1.1, 0.8);
      [[22, -5, 1.4], [24, -7, 0.9], [-26, -6, 1.2]].forEach(([x, z, k]) => ball(g, x, 0.4 * k, z, 1.1 * k, 0.7 * k, 0.9 * k, '#8D8579', 7));
      [6.5, 13.5].forEach(x => cyl(g, x, 2.4, 10, 0.04, 0.04, 2.4, '#E9E6E0', 6)); box(g, 10, 2.15, 10, 7, 0.5, 0.02, '#2C2E33');
    },
  },
  stadium:{
    sky:{ top:'#6E9CC8', hor:'#D6E2EC', low:'#8B9196' }, fog:[70, 260],
    cam:{ tx:0, ty:1.2, tz:0, yaw:32, pitch:-5, dist:8.5, lens:28 },
    build(g, gl){
      floor(g, -40, -58, 40, 58, 0, '#4F8A4A');
      for(let z = -54; z < 54; z += 12) box(g, 0, 0.002, z + 3, 68, 0.004, 6, '#5A9655');
      const line = (x, z, w, d, ry) => box(g, x, 0.005, z, w, 0.006, d, '#EEF0EA', ry);
      line(34, 0, 0.12, 100); line(-34, 0, 0.12, 100); line(0, 50, 68.1, 0.12); line(0, -50, 68.1, 0.12); line(0, 0, 68, 0.12);
      for(let i = 0; i < 32; i++){ const a = i / 32 * Math.PI * 2; line(Math.sin(a) * 9.15, Math.cos(a) * 9.15, 0.12, 1.8, a); }
      [-1, 1].forEach(sd => { line(20.15, sd * 41.75, 0.12, 16.5); line(-20.15, sd * 41.75, 0.12, 16.5); line(0, sd * 33.5, 40.4, 0.12); line(9.16, sd * 47.25, 0.12, 5.5); line(-9.16, sd * 47.25, 0.12, 5.5); line(0, sd * 44.5, 18.4, 0.12);
        // les buts, et leurs filets (transparents)
        const z = sd * 50; [3.66, -3.66].forEach(x => cyl(g, x, 2.44, z, 0.06, 0.06, 2.44, '#F4F2EE', 8)); box(g, 0, 2.44, z, 7.44, 0.12, 0.12, '#F4F2EE');
        if(gl){ wall(gl, [3.66, z + sd * 1.5], [-3.66, z + sd * 1.5], 2.2, '#EEF2F2'); wall(gl, [3.66, z], [3.66, z + sd * 1.5], 2.44, '#EEF2F2'); wall(gl, [-3.66, z + sd * 1.5], [-3.66, z], 2.44, '#EEF2F2'); } });
      // panneaux publicitaires, tribunes en gradins, toits, projecteurs
      const ads = ['#2F6E4F', '#C9503C', '#3D5A80', '#E3A33A'];
      for(let z = -52; z < 52; z += 8) [-1, 1].forEach((sd, k) => { const x = sd * 37; if(sd > 0) wall(g, [x, z], [x, z + 8], 0.9, ads[(z / 8 + k + 7) & 3]); else wall(g, [x, z + 8], [x, z], 0.9, ads[(z / 8 + k + 6) & 3]); });
      for(let i = 0; i < 16; i++){
        const x = 39.4 + i * 0.8, y = 0.5 + i * 0.45;
        [-1, 1].forEach(sd => { box(g, sd * x, y / 2, 0, 0.8, y, 112, i % 2 ? '#7E838B' : '#8D9198'); });
        [-1, 1].forEach(sd => box(g, 0, y / 2, sd * (54.4 + i * 0.8), 76, y, 0.8, i % 2 ? '#7E838B' : '#8D9198'));
      }
      [-1, 1].forEach(sd => { box(g, sd * 46, 15.5, 0, 16, 0.3, 112, '#B9BEC6'); for(let z = -48; z <= 48; z += 24) cyl(g, sd * 53.5, 15.5, z, 0.25, 0.25, 15.5, '#8D9198', 8); });
      [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([a, b]) => { const x = a * 58, z = b * 64; cyl(g, x, 32, z, 0.4, 0.6, 32, '#8D9198', 8); box(g, x, 33, z, 6, 3, 0.6, '#3A3D44', Math.atan2(-x, -z)); box(g, x - a * 0.2, 33, z - b * 0.2, 5.4, 2.4, 0.4, '#F7F1DA', Math.atan2(-x, -z)); });
    },
    // la foule des tribunes : des silhouettes, pas des personnages (rien à poser, presque rien à dessiner)
    crowd(){
      const out = [], rnd = seeded(7);
      for(let i = 0; i < 14; i++){
        const x = 39.4 + i * 0.8, y = 0.5 + i * 0.45;
        for(let z = -54; z < 54; z += 0.95) [-1, 1].forEach(sd => { if(rnd() < 0.86 && !(sd < 0 && i < 6 && Math.abs(z - 10) < 3)) out.push(crowdOne(sd * x, y, z + rnd() * 0.3, rnd, 'cheer')); });
        for(let xx = -36; xx < 36; xx += 0.95) [-1, 1].forEach(sd => { if(rnd() < 0.86) out.push(crowdOne(xx + rnd() * 0.3, y, sd * (54.4 + i * 0.8), rnd, 'cheer')); });
      }
      return out;
    },
  },
  country:{
    sky:{ top:'#86B3D9', hor:'#E6EBE6', low:'#9AA88A' }, fog:[50, 240],
    cam:{ tx:2.4, ty:1.2, tz:1, yaw:-38, pitch:-4, dist:8, lens:28 },
    build(g, gl){
      floor(g, -200, -200, 200, 200, 0, '#7C9A5A');
      // les champs de chaque côté de la route
      [[-60, -120, -6, -40, '#C9B26A'], [-60, -40, -6, 20, '#5F7F48'], [-60, 20, -6, 120, '#8A6F52'], [6, -120, 70, -10, '#6E8F50'], [6, -10, 70, 60, '#C9B26A'], [6, 60, 70, 140, '#5F7F48']].forEach(([x0, z0, x1, z1, c], k) => {
        floor(g, x0, z0, x1, z1, 0.004, c);
        for(let x = x0 + 1; x < x1; x += 1.6) box(g, x, 0.006, (z0 + z1) / 2, 0.25, 0.004, z1 - z0 - 1, hexRGB(c).map(v => v * 0.9));
      });
      floor(g, -3.3, -200, 3.3, 200, 0.01, '#55595F'); [-4.2, 4.2].forEach(x => floor(g, x - 0.9, -200, x + 0.9, 200, 0.008, '#A69B85'));
      for(let z = -196; z < 200; z += 8) box(g, 0, 0.013, z, 0.14, 0.006, 4, '#E6E0C4');
      [-3.1, 3.1].forEach(x => box(g, x, 0.013, 0, 0.12, 0.006, 400, '#E6E0C4'));
      // clôtures, poteaux électriques, arbres le long de la route
      for(let z = -80; z <= 80; z += 2.5) [-5.6, 5.6].forEach(x => box(g, x, 0.5, z, 0.1, 1.0, 0.1, '#7A5C42'));
      [-5.6, 5.6].forEach(x => [0.45, 0.85].forEach(y => box(g, x, y, 0, 0.05, 0.08, 160, '#8A6A4A')));
      for(let z = -150; z <= 150; z += 30){ cyl(g, 7.5, 8, z, 0.12, 0.14, 8, '#6B4E37', 6); box(g, 7.5, 7.6, z, 1.4, 0.1, 0.1, '#6B4E37'); }
      [7.0, 8.0].forEach(x => box(g, x, 7.62, 0, 0.02, 0.02, 300, '#2C2E33'));
      for(let z = -120; z <= 120; z += 14) ball(g, -8.5, 4.5, z + 4, 1.2, 4.2, 1.2, '#4E7C58', 8);
      [[16, -18, 1.4], [24, 8, 1.2], [-22, 30, 1.3], [-30, -60, 1.5], [30, -70, 1.2]].forEach(([x, z, k]) => tree(g, x, z, k));
      // la ferme et la grange
      box(g, -26, 2.2, -30, 9, 4.4, 7, '#E6DDCC'); prism(g, [[-33.6, 4.4], [-26.4, 4.4], [-30, 6.8]], -30.8, -21.2, '#8C4A3A');
      wall(g, [-21.49, -29], [-21.49, -31], 2.1, '#6E5440'); [-27.5, -32.5].forEach(z => wall(g, [-21.49, z + 0.6], [-21.49, z - 0.6], 1.2, '#3E4552', 2.4));
      box(g, -40, 3, -24, 8, 6, 10, '#9B3B33'); prism(g, [[-29, 6], [-19, 6], [-24, 8.6]], -44, -36, '#5E636C');
      // les collines et les montagnes au loin
      [[-90, -160, 60, 18, '#6E8F5A'], [40, -180, 80, 24, '#76966A'], [150, -120, 60, 16, '#6E8F5A'], [-150, 40, 70, 20, '#76966A'], [120, 120, 80, 22, '#6E8F5A']].forEach(([x, z, r, h, c]) => ball(g, x, 0, z, r, h, r, c, 14));
      [[-40, -230, 70, 55], [60, -240, 90, 70], [180, -200, 60, 45]].forEach(([x, z, r, h]) => cyl(g, x, h, z, 0.5, r, h, '#8C9AA8', 9));
      box(g, 4.6, 1.1, 10, 0.06, 2.2, 0.06, '#8D9198'); box(g, 4.6, 2.1, 10, 0.04, 0.6, 0.6, '#E8B923', Math.PI / 4);
    },
  },
});
/* ---------- La maison de campagne, avec tous ses étages ----------
   Rez-de-chaussée (salon, cuisine, entrée, escalier), premier étage (deux chambres, salle de bain),
   grenier sous le toit, et le jardin autour. Chaque étage est dessiné à part : quand la caméra
   vise un étage, ceux du dessus ne sont pas dessinés (comme une maison de poupée qu'on ouvre). */
const HOUSE = { x0:-5, x1:5, z0:-4, z1:4, h:2.9 };
/* un mur intérieur épais (visible des deux côtés), avec des ouvertures [début, fin] le long du mur */
function partition(g, a, b, y0, h, col, gaps){
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), ry = Math.atan2(dx, dz);
  const cuts = [[0, 0]].concat((gaps || []).map(([s, e]) => [s, e]), [[len, len]]);
  for(let i = 0; i < cuts.length - 1; i++){
    const s = cuts[i][1], e = cuts[i + 1][0]; if(e - s < 0.02) continue;
    const m = (s + e) / 2; box(g, a[0] + dx / len * m, y0 + h / 2, a[1] + dz / len * m, 0.1, h, e - s, col, ry);
  }
  (gaps || []).forEach(([s, e]) => { const m = (s + e) / 2; box(g, a[0] + dx / len * m, y0 + h - 0.35, a[1] + dz / len * m, 0.1, 0.7, e - s, col, ry); });   // le linteau au-dessus des portes
}
/* un plancher percé (la trémie d'un escalier) : des bandes autour du trou */
function floorHole(g, x0, z0, x1, z1, y, col, hole, down){
  const [hx0, hz0, hx1, hz1] = hole;
  floor(g, x0, z0, x1, hz0, y, col, down); floor(g, x0, hz1, x1, z1, y, col, down);
  floor(g, x0, hz0, hx0, hz1, y, col, down); floor(g, hx1, hz0, x1, hz1, y, col, down);
}
function stairs(g, x0, x1, zStart, zEnd, y0, rise, n, col){
  const run = (zEnd - zStart) / n, st = rise / n;
  for(let i = 0; i < n; i++){ const zc = zStart + run * (i + 0.5), top = y0 + st * (i + 1); box(g, (x0 + x1) / 2, (y0 + top) / 2, zc, x1 - x0, top - y0, Math.abs(run) + 0.01, col); }
}
Object.assign(SET_DEF, {
  house:{
    sky:{ top:'#86B3D9', hor:'#E3E9E8', low:'#8FA27C' }, fog:[45, 200],
    levels:[0, 2.9, 5.8], box:[-5.2, -4.2, 5.2, 4.2],
    cam:{ tx:-1.6, ty:1.0, tz:-2.4, yaw:32, pitch:-10, dist:3.6, lens:24 },
    // la caméra toute prête de chaque étage
    floors:[['Rez-de-chaussée', 'Ground floor', { tx:-1.6, ty:1.0, tz:-2.4, yaw:32, pitch:-10, dist:3.6, lens:24 }], ['Premier étage', 'First floor', { tx:-1.4, ty:3.6, tz:-2.7, yaw:28, pitch:-18, dist:3.4, lens:24 }],
      ['Grenier', 'Attic', { tx:-1, ty:6.4, tz:-0.5, yaw:81, pitch:-5, dist:5.4, lens:24 }], ['Le jardin', 'Garden', { tx:0, ty:2.6, tz:0, yaw:22, pitch:-6, dist:17, lens:28 }]],
    build(g, gl, L){
      const H = HOUSE, W0 = '#E6DDCC', IN = '#E9E3D6', WOOD = '#9C7B5B';
      // le jardin
      floor(g, -70, -70, 70, 70, 0, '#7C9A5A');
      floor(g, -0.7, 4.2, 0.7, 16, 0.006, '#B9A88C');
      for(let x = -12; x <= 12; x += 0.6) box(g, x, 0.45, 16, 0.08, 0.9, 0.08, '#E9E6E0'); box(g, 0, 0.75, 16, 24, 0.06, 0.04, '#E9E6E0');
      [[-9, 6, 1.3], [9, 9, 1.1], [-11, -7, 1.4], [10, -6, 1.2]].forEach(([x, z, k]) => tree(g, x, z, k));
      [[-3.2, 4.9], [3.2, 4.9]].forEach(([x, z]) => ball(g, x, 0.35, z, 0.8, 0.45, 0.45, '#557F57', 8));
      car(g, gl, 7.5, 5, '#3D5A80');
      // la façade : des murs vus du dehors seulement (dedans, on voit les murs intérieurs)
      const X0 = H.x0 - 0.15, X1 = H.x1 + 0.15, Z0 = H.z0 - 0.15, Z1 = H.z1 + 0.15, top = H.h * 2;
      wall(g, [X0, Z1], [X1, Z1], top, W0); wall(g, [X1, Z0], [X0, Z0], top, W0); wall(g, [X0, Z0], [X0, Z1], top, W0); wall(g, [X1, Z1], [X1, Z0], top, W0);
      box(g, 0, 0.12, Z1 + 0.3, 1.8, 0.24, 0.6, '#8D9198');
      wall(g, [-0.55, Z1 + 0.005], [0.55, Z1 + 0.005], 2.1, '#6E5440');                        // la porte d'entrée
      [[-3, 1], [3, 1], [-3, 3.9], [3, 3.9], [0, 3.9]].forEach(([x, y]) => { wall(g, [x - 0.6, Z1 + 0.005], [x + 0.6, Z1 + 0.005], 1.3, '#3E4552', y); wall(g, [x - 0.68, Z1 + 0.01], [x + 0.68, Z1 + 0.01], 0.08, '#F4F2EE', y - 0.04); [-0.66, 0.66].forEach(d => wall(g, [x + d - 0.18, Z1 + 0.012], [x + d, Z1 + 0.012], 1.3, '#5E7F6A', y)); });
      [[-2.5, 1], [2.5, 1], [-2.5, 3.9], [2.5, 3.9]].forEach(([z, y]) => { wall(g, [X0 - 0.005, z - 0.55], [X0 - 0.005, z + 0.55], 1.3, '#3E4552', y); wall(g, [X1 + 0.005, z + 0.55], [X1 + 0.005, z - 0.55], 1.3, '#3E4552', y); });
      // le toit à deux pentes, et ses pignons
      // (dans le niveau du grenier : quand on regarde un étage d'en haut, le toit s'efface)
      prism(L[2], [[Z0 - 0.5, top], [Z1 + 0.5, top], [0, top + 2.8]], X0 - 0.4, X1 + 0.4, '#8C4A3A');
      [[X0, 1], [X1, -1]].forEach(([x, sd]) => { const pts = [[Z0, top], [Z1, top], [0, top + 2.6]]; prism(L[2], pts, Math.min(x, x + sd * -0.02), Math.max(x, x + sd * -0.02), W0); });
      box(L[2], 3, top + 2.4, -1, 0.6, 1.4, 0.6, '#8A7356');                                     // la cheminée
      // ---- rez-de-chaussée (L[0]) ----
      const g0 = L[0], hole = [-4.85, -0.4, -3.55, 3.7];
      floor(g0, H.x0, H.z0, H.x1, H.z1, 0.004, WOOD); for(let x = H.x0 + 0.4; x < H.x1; x += 0.4) box(g0, x, 0.006, 0, 0.012, 0.004, 8, '#8C6D50');
      wall(g0, [H.x0, H.z0], [H.x1, H.z0], H.h, IN); wall(g0, [H.x0, H.z1], [H.x0, H.z0], H.h, '#DED6C6'); wall(g0, [H.x1, H.z0], [H.x1, H.z1], H.h, '#DED6C6'); wall(g0, [H.x1, H.z1], [H.x0, H.z1], H.h, IN);
      floorHole(g0, H.x0, H.z0, H.x1, H.z1, H.h - 0.002, '#F2EEE6', hole, true);
      [[-3, 1], [3, 1]].forEach(([x, y]) => wall(g0, [x + 0.6, H.z1 - 0.01], [x - 0.6, H.z1 - 0.01], 1.3, '#A9C9DE', y));
      wall(g0, [0.55, H.z1 - 0.01], [-0.55, H.z1 - 0.01], 2.1, '#7A5C42');
      [-2.5, 2.5].forEach(z => { wall(g0, [H.x0 + 0.01, z + 0.55], [H.x0 + 0.01, z - 0.55], 1.3, '#A9C9DE', 1); wall(g0, [H.x1 - 0.01, z - 0.55], [H.x1 - 0.01, z + 0.55], 1.3, '#A9C9DE', 1); });
      partition(g0, [0.8, H.z0], [0.8, 1.2], 0, H.h, IN, [[3.2, 4.1]]);                       // salon | cuisine
      partition(g0, [0.8, 1.2], [H.x1, 1.2], 0, H.h, IN, [[1.2, 2.2]]);
      stairs(g0, -4.85, -3.55, 3.7, -0.4, 0, H.h, 14, '#8A6A4A');
      box(g0, -3.5, 1.4, 1.65, 0.05, 1.0, 4.1, '#6E5440');                                    // la rampe
      // le salon : canapé, table basse, cheminée, tapis, bibliothèque
      floor(g0, -3.2, -3.5, 0.4, -0.3, 0.008, '#B9876A');
      box(g0, -1.4, 0.22, -3.3, 2.2, 0.44, 0.9, '#5A6B7C'); box(g0, -1.4, 0.66, -3.68, 2.2, 0.5, 0.16, '#53637A'); [-0.22, -2.58].forEach(x => box(g0, x, 0.36, -3.3, 0.2, 0.32, 0.92, '#53637A'));
      box(g0, -1.4, 0.38, -1.7, 1.1, 0.05, 0.6, '#6E5440');
      box(g0, -4.75, 0.6, -2.0, 0.5, 1.2, 1.6, '#B9B0A0'); box(g0, -4.6, 0.45, -2.0, 0.3, 0.6, 0.9, '#2C2E33'); box(g0, -4.72, 1.25, -2.0, 0.6, 0.1, 1.8, '#9A8B7E');
      box(g0, 0.55, 1.0, -2.0, 0.4, 2.0, 1.4, '#7A5C42');
      // la cuisine : plan de travail, évier, frigo, table et chaises
      box(g0, 4.65, 0.45, -1.5, 0.65, 0.9, 4.8, '#E9E6E0'); box(g0, 4.65, 0.92, -1.5, 0.7, 0.05, 4.85, '#5E636C'); box(g0, 4.65, 0.93, -2.6, 0.45, 0.04, 0.6, '#9AA0A8');
      box(g0, 4.6, 0.95, 0.6, 0.7, 1.9, 0.7, '#D9DCE0');
      box(g0, 2.6, 0.75, -1.8, 1.4, 0.05, 0.9, '#8A6A4A'); [[-0.6, -0.35], [0.6, -0.35], [-0.6, 0.35], [0.6, 0.35]].forEach(([a, b]) => box(g0, 2.6 + a, 0.37, -1.8 + b, 0.05, 0.74, 0.05, '#6E5440'));
      [[2.0, -2.55], [3.2, -2.55], [2.0, -1.05], [3.2, -1.05]].forEach(([x, z]) => { box(g0, x, 0.45, z, 0.42, 0.05, 0.42, '#7A5C42'); box(g0, x, 0.72, z + (z < -1.8 ? -0.19 : 0.19), 0.42, 0.55, 0.04, '#7A5C42'); });
      cyl(g0, 2.6, 2.9, -1.8, 0.01, 0.01, 0.7, '#2C2E33', 4); cyl(g0, 2.6, 2.2, -1.8, 0.05, 0.25, 0.2, '#2F6E4F', 10);
      // l'entrée : porte-manteau, meuble à chaussures
      box(g0, 3.6, 0.4, 3.75, 1.2, 0.8, 0.4, '#7A5C42'); cyl(g0, 1.6, 0.9, 3.6, 0.03, 0.03, 1.8, '#3A3D44', 6);
      // ---- premier étage (L[1]) ----
      const g1 = L[1], y1 = H.h, hatch = [-4.6, -3.0, -3.8, -2.2];
      floorHole(g1, H.x0, H.z0, H.x1, H.z1, y1 + 0.002, '#A68A6B', hole);
      wall(g1, [H.x0, H.z0], [H.x1, H.z0], H.h, '#DCE3E8', y1); wall(g1, [H.x0, H.z1], [H.x0, H.z0], H.h, '#E8DED4', y1); wall(g1, [H.x1, H.z0], [H.x1, H.z1], H.h, '#E8DED4', y1); wall(g1, [H.x1, H.z1], [H.x0, H.z1], H.h, '#DCE3E8', y1);
      floorHole(g1, H.x0, H.z0, H.x1, H.z1, y1 + H.h - 0.002, '#F2EEE6', hatch, true);
      [[-3, 1], [3, 1], [0, 1]].forEach(([x]) => wall(g1, [x + 0.6, H.z1 - 0.01], [x - 0.6, H.z1 - 0.01], 1.3, '#A9C9DE', y1 + 1));
      [-2.5, 2.5].forEach(z => { wall(g1, [H.x0 + 0.01, z + 0.55], [H.x0 + 0.01, z - 0.55], 1.3, '#A9C9DE', y1 + 1); wall(g1, [H.x1 - 0.01, z - 0.55], [H.x1 - 0.01, z + 0.55], 1.3, '#A9C9DE', y1 + 1); });
      partition(g1, [-3.4, H.z0], [-3.4, H.z1], y1, H.h, '#E9E3D6', [[0.6, 1.5], [4.6, 5.5]]);                     // le palier, le long de l'escalier
      partition(g1, [0.6, H.z0], [0.6, 0.6], y1, H.h, '#E9E3D6', []);
      partition(g1, [-3.4, 0.6], [H.x1, 0.6], y1, H.h, '#E9E3D6', [[0.6, 1.5], [4.6, 5.5]]);
      box(g1, -3.45, y1 + 0.5, -2.4, 0.05, 1.0, 0.0001, '#6E5440');
      // la chambre des parents : grand lit, tables de nuit, armoire
      box(g1, -1.4, y1 + 0.25, -2.7, 1.7, 0.5, 2.1, '#E9E4DA'); box(g1, -1.4, y1 + 0.52, -2.7, 1.66, 0.06, 2.06, '#C9503C'); box(g1, -1.4, y1 + 0.55, -3.6, 1.6, 0.12, 0.35, '#F4F2EE'); box(g1, -1.4, y1 + 0.7, -3.85, 1.8, 1.0, 0.08, '#7A5C42');
      [-2.55, -0.25].forEach(x => box(g1, x, y1 + 0.28, -3.6, 0.45, 0.56, 0.4, '#7A5C42'));
      box(g1, 0.25, y1 + 1.0, -1.0, 0.6, 2.0, 1.4, '#8A6A4A');
      // la chambre d'enfant : petit lit, bureau, tapis
      box(g1, 3.9, y1 + 0.2, -2.6, 1.0, 0.4, 2.0, '#E9E4DA'); box(g1, 3.9, y1 + 0.42, -2.3, 0.96, 0.05, 1.4, '#3D5A80');
      box(g1, 1.6, y1 + 0.72, -3.6, 1.2, 0.05, 0.6, '#E9E6E0'); box(g1, 1.6, y1 + 0.42, -3.2, 0.42, 0.05, 0.42, '#C9503C');
      floor(g1, 1.4, -2.2, 3.2, -0.6, y1 + 0.006, '#E3A33A');
      // la salle de bain : baignoire, lavabo, toilettes
      box(g1, 3.9, y1 + 0.28, 3.3, 1.6, 0.56, 0.8, '#F4F2EE'); box(g1, 3.9, y1 + 0.5, 3.3, 1.45, 0.08, 0.6, '#A9C9DE');
      box(g1, 1.4, y1 + 0.8, 3.75, 0.6, 0.12, 0.42, '#F4F2EE'); box(g1, 1.4, y1 + 0.4, 3.85, 0.2, 0.8, 0.2, '#F4F2EE'); wall(g1, [1.75, H.z1 - 0.01], [1.05, H.z1 - 0.01], 0.6, '#C9D3DC', y1 + 1.1);
      box(g1, 2.5, y1 + 0.22, 3.7, 0.4, 0.44, 0.55, '#F4F2EE');
      // l'échelle vers le grenier
      [-4.5, -3.9].forEach(x => box(g1, x, y1 + H.h / 2, -2.6, 0.05, H.h, 0.05, '#8A6A4A')); for(let k = 1; k < 9; k++) box(g1, -4.2, y1 + k * 0.32, -2.6, 0.6, 0.04, 0.05, '#8A6A4A');
      // ---- le grenier (L[2]) ----
      const g2 = L[2], y2 = H.h * 2;
      floorHole(g2, H.x0, H.z0, H.x1, H.z1, y2 + 0.002, '#8A7356', hatch);
      for(let x = H.x0 + 0.3; x < H.x1; x += 0.6) box(g2, x, y2 + 0.005, 0, 0.012, 0.004, 8, '#7A6248');
      // les pentes du toit vues de l'intérieur, et les pignons
      const ridge = y2 + 2.55;
      quad(g2, [H.x0, y2, H.z0], [H.x1, y2, H.z0], [H.x1, ridge, 0], [H.x0, ridge, 0], hexRGB('#9C7B5B'));
      quad(g2, [H.x1, y2, H.z1], [H.x0, y2, H.z1], [H.x0, ridge, 0], [H.x1, ridge, 0], hexRGB('#9C7B5B'));
      tri(g2, [H.x0, y2, H.z1], [H.x0, y2, H.z0], [H.x0, ridge, 0], hexRGB('#B9A88C')); tri(g2, [H.x1, y2, H.z0], [H.x1, y2, H.z1], [H.x1, ridge, 0], hexRGB('#B9A88C'));
      for(let x = H.x0 + 0.8; x < H.x1; x += 1.6){ const k = hexRGB('#7A5C42'); quad(g2, [x - 0.06, y2 + 0.01, H.z0 + 0.02], [x + 0.06, y2 + 0.01, H.z0 + 0.02], [x + 0.06, ridge - 0.02, 0.02], [x - 0.06, ridge - 0.02, 0.02], k); quad(g2, [x + 0.06, y2 + 0.01, H.z1 - 0.02], [x - 0.06, y2 + 0.01, H.z1 - 0.02], [x - 0.06, ridge - 0.02, -0.02], [x + 0.06, ridge - 0.02, -0.02], k); }
      wall(g2, [H.x0 + 0.01, 0.5], [H.x0 + 0.01, -0.5], 0.8, '#A9C9DE', y2 + 0.8);
      box(g2, -2.5, y2 + 0.3, -2.2, 1.0, 0.6, 0.6, '#6E5440'); box(g2, -2.5, y2 + 0.62, -2.2, 1.04, 0.06, 0.64, '#8A6A4A');
      [[1.2, -2.4], [1.8, -2.2], [1.5, -2.3]].forEach(([x, z], k) => box(g2, x, y2 + 0.25 + (k === 2 ? 0.5 : 0), z, 0.5, 0.5, 0.5, '#B08A5A'));
      box(g2, 2.6, y2 + 0.45, 1.4, 0.55, 0.06, 0.55, '#7A5C42'); box(g2, 2.6, y2 + 0.85, 1.65, 0.55, 0.8, 0.06, '#7A5C42');
      cyl(g2, 0, ridge, 0, 0.01, 0.01, 0.5, '#2C2E33', 4); ball(g2, 0, ridge - 0.55, 0, 0.06, 0.08, 0.06, '#F2E6C9', 8);
      box(g2, -1.2, y2 + 0.9, 2.4, 0.6, 1.8, 0.4, '#9AA0A8');
    },
  },
  roof:{
    sky:{ top:'#6F9CC9', hor:'#E2D9CF', low:'#6E737B' }, fog:[40, 220],
    cam:{ tx:0, ty:1.2, tz:0, yaw:24, pitch:-5, dist:7.6, lens:28 },
    build(g, gl){
      // le toit de l'immeuble, posé à hauteur zéro : la ville est en dessous
      floor(g, -9, -7, 9, 7, 0, '#8D9198');
      for(let x = -8.5; x < 9; x += 1.5) box(g, x, 0.003, 0, 0.02, 0.004, 14, '#7E838B');
      [[-9, -7, 9, -7], [9, -7, 9, 7], [9, 7, -9, 7], [-9, 7, -9, -7]].forEach(([a, b, c, d]) => { const mx = (a + c) / 2, mz = (b + d) / 2, along = a === c; box(g, mx, 0.55, mz, along ? 0.3 : Math.abs(c - a) + 0.3, 1.1, along ? Math.abs(d - b) + 0.3 : 0.3, '#A6ACB4'); });
      box(g, 0, -15.01, 0, 18.2, 30, 14.2, '#9A8B7E');
      for(let y = -3; y > -30; y -= 3) for(let x = -7.5; x <= 7.5; x += 2.2){ wall(g, [x - 0.5, 7.11], [x + 0.5, 7.11], 1.4, '#3E4552', y); wall(g, [x + 0.5, -7.11], [x - 0.5, -7.11], 1.4, '#3E4552', y); }
      // le château d'eau, la cage d'escalier, les climatiseurs, l'antenne, la verrière
      [[-4.6, -3.8], [-3.2, -3.8], [-4.6, -2.4], [-3.2, -2.4]].forEach(([x, z]) => box(g, x, 1.2, z, 0.14, 2.4, 0.14, '#5E636C'));
      cyl(g, -3.9, 4.3, -3.1, 1.2, 1.2, 1.9, '#8A6A4A', 14); cyl(g, -3.9, 5.1, -3.1, 0.05, 1.3, 0.8, '#5E636C', 14);
      box(g, 5.6, 1.4, -4.2, 2.6, 2.8, 2.4, '#B9B0A0'); wall(g, [5.0, -2.99], [6.0, -2.99], 2.1, '#5E636C');
      [[2.6, 4.6], [4.0, 4.6], [5.4, 4.6]].forEach(([x, z]) => { box(g, x, 0.45, z, 1.1, 0.9, 0.8, '#C9CDD2'); cyl(g, x, 0.92, z, 0.3, 0.3, 0.02, '#5E636C', 10); });
      cyl(g, 7.6, 5.5, 5.6, 0.04, 0.05, 5.5, '#2C2E33', 6); box(g, 7.6, 4.5, 5.6, 1.2, 0.03, 0.03, '#2C2E33'); box(g, 7.6, 5.1, 5.6, 0.8, 0.03, 0.03, '#2C2E33');
      prism(g, [[-1.2, 0.1], [1.2, 0.1], [0.9, 0.55], [-0.9, 0.55]], -6.2, -3.8, '#5E636C'); if(gl) prism(gl, [[-1.0, 0.56], [1.0, 0.56], [0.85, 0.6], [-0.85, 0.6]], -6.1, -3.9, '#A9C4D2');
      box(g, 1.2, 0.22, -4.6, 1.8, 0.44, 0.6, '#8A6A4A');
      // la ville autour : des immeubles plus bas et plus hauts, avec leurs fenêtres
      const cols = ['#B39C86', '#8E7E72', '#A6ACB4', '#C9B9A3', '#9A8B7E', '#BFA58A'];
      for(let i = 0; i < 26; i++){
        const a = i / 26 * Math.PI * 2, r = 30 + (i * 7) % 18, x = Math.cos(a) * r, z = Math.sin(a) * r, h = 10 + (i * 13) % 34 - 16, w = 9 + (i * 5) % 7, d = 9 + (i * 3) % 6;
        box(g, x, -30 + (h + 30) / 2, z, w, h + 30, d, cols[i % 6]);
        for(let y = -1; y < h - 1; y += 3.2) for(let k = -w / 2 + 1.2; k < w / 2 - 0.8; k += 2.0){
          const f = [x + k, z + d / 2 + 0.02], b2 = [x + k + 1.0, z + d / 2 + 0.02]; wall(g, f, b2, 1.4, '#3E4552', y);
          wall(g, [x + k + 1.0, z - d / 2 - 0.02], [x + k, z - d / 2 - 0.02], 1.4, '#3E4552', y);
        }
      }
    },
  },
  warehouse:{
    fog:[400, 500],
    cam:{ tx:0, ty:1.1, tz:0.8, yaw:79, pitch:-9, dist:9.8, lens:24 },
    build(g, gl){
      const X = 12, Z = 8, Hh = 8;
      floor(g, -X, -Z, X, Z, 0, '#8A8E95');
      for(let x = -X + 2; x < X; x += 4) box(g, x, 0.003, 0, 0.02, 0.004, 2 * Z, '#7E828A');
      [[-X + 1, -Z + 1.5, X - 1, -Z + 1.5], [-X + 1, Z - 1.5, X - 1, Z - 1.5]].forEach(([a, b, c]) => box(g, 0, 0.004, b, 2 * X - 2, 0.006, 0.12, '#E3B53A'));
      wall(g, [-X, -Z], [X, -Z], Hh, '#9AA0A8'); wall(g, [-X, Z], [-X, -Z], Hh, '#8D9198'); wall(g, [X, -Z], [X, Z], Hh, '#8D9198'); wall(g, [X, Z], [-X, Z], Hh, '#9AA0A8');
      floor(g, -X, -Z, X, Z, Hh, '#6E737B', true);
      for(let x = -X + 3; x < X; x += 6) box(g, x, Hh - 0.3, 0, 0.3, 0.5, 2 * Z, '#5E636C');
      for(let x = -X + 3; x < X; x += 6) box(g, x, Hh - 0.02, 0, 1.4, 0.01, 2 * Z - 2, '#C9D3DC');
      // les portes à rideau, les poteaux, les rayonnages chargés de caisses et de palettes
      [-6, 2].forEach(x => { wall(g, [x, -Z + 0.02], [x + 4, -Z + 0.02], 4.5, '#7A7F88'); for(let i = 0; i < 15; i++) wall(g, [x, -Z + 0.03], [x + 4, -Z + 0.03], 0.025, '#6A6F77', 0.15 + i * 0.3); });
      for(let x = -X + 3; x < X; x += 6) [-Z + 4, Z - 4].forEach(z => box(g, x, Hh / 2, z, 0.3, Hh, 0.3, '#E3B53A'));
      const crate = ['#B08A5A', '#9A7A55', '#8A6A4A', '#3D5A80', '#2F6E4F'];
      [[-8, 4.5], [-2, 4.5], [4, 4.5], [-8, -3.2], [4, -3.2]].forEach(([cx, cz], r) => {
        [-0.55, 0.55].forEach(dz => [0, 1.6, 3.2].forEach(y => box(g, cx, y + 0.05, cz + dz * 1.6, 4.4, 0.1, 0.1, '#C9503C')));
        [-2.15, 0, 2.15].forEach(dx => [-1, 1].forEach(dz => box(g, cx + dx, 2.4, cz + dz * 0.88, 0.1, 4.8, 0.1, '#3D5A80')));
        [0.1, 1.7, 3.3].forEach((y, k) => { for(let i = 0; i < 3; i++) if((i + k + r) % 4 !== 3) box(g, cx - 1.4 + i * 1.4, y + 0.45, cz, 1.2, 0.8, 1.4, crate[(i + k + r) % 5]); });
      });
      // au milieu : des palettes, des caisses en pile, un chariot élévateur, une table et des chaises
      [[1.5, 0.5], [2.6, 0.9]].forEach(([x, z]) => { box(g, x, 0.07, z, 1.2, 0.14, 1.0, '#8A6A4A'); box(g, x, 0.5, z, 1.1, 0.7, 0.9, '#B08A5A'); });
      box(g, -3.0, 0.45, -0.6, 1.0, 0.9, 1.0, '#9A7A55'); box(g, -3.0, 1.3, -0.6, 0.8, 0.8, 0.8, '#B08A5A');
      { const fx = -9.4; box(g, fx, 0.6, 0.8, 1.2, 0.9, 2.0, '#E3B53A'); box(g, fx, 1.6, 1.2, 1.1, 1.2, 0.05, '#2C2E33'); box(g, fx, 2.2, 0.6, 1.2, 0.06, 1.3, '#2C2E33'); [fx - 0.5, fx + 0.5].forEach(x => box(g, x, 1.4, -0.35, 0.08, 2.8, 0.08, '#2C2E33')); [[-0.4], [0.4]].forEach(([d]) => box(g, fx + d, 0.1, -0.9, 0.1, 0.05, 1.0, '#5E636C'));
      [[fx - 0.45, 1.5], [fx + 0.45, 1.5], [fx - 0.45, 0.1], [fx + 0.45, 0.1]].forEach(([x, z]) => cyl(g, x - 0.1, 0.25, z, 0.25, 0.25, 0.2, '#17181B', 10, 'x')); }
      box(g, -6.0, 0.75, 0.6, 1.6, 0.05, 0.9, '#6E5440'); [[-6.7, 0.25], [-5.3, 0.25], [-6.7, 0.95], [-5.3, 0.95]].forEach(([x, z]) => box(g, x, 0.37, z, 0.05, 0.74, 0.05, '#5B4532'));
      [[-6.6, -0.3], [-5.4, -0.3]].forEach(([x, z]) => { box(g, x, 0.45, z, 0.42, 0.05, 0.42, '#3A3D44'); box(g, x, 0.75, z - 0.2, 0.42, 0.55, 0.04, '#3A3D44'); });
      cyl(g, -6.0, Hh, 0.6, 0.01, 0.01, Hh - 2.6, '#2C2E33', 4); cyl(g, -6.0, 2.6, 0.6, 0.08, 0.45, 0.3, '#5E636C', 12);
      [-4, 4].forEach(x => [-3, 3].forEach(z => { cyl(g, x, Hh, z, 0.01, 0.01, 2, '#2C2E33', 4); cyl(g, x, Hh - 2, z, 0.1, 0.5, 0.3, '#5E636C', 12); }));
    },
  },
});
/* un hasard qui donne toujours la même suite (la foule ne bouge pas d'une image à l'autre) */
function seeded(n){ let s = (n * 9301 + 49297) % 233280 || 1; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }
const CROWD_TINTS = ['#C9503C', '#3D5A80', '#E3A33A', '#2F6E4F', '#7C6A8E', '#B4593A', '#4A6A8A', '#D9707A', '#8A7356', '#5E636C', '#E9E4DA', '#2E3A4E'].map(hexRGB);
const CROWD_KINDS = { stand:[0, 3, 4, 0, 3, 5], cheer:[1, 2, 6, 7, 4, 1], mix:[0, 1, 2, 3, 4, 5, 6, 7] };
function crowdOne(x, y, z, rnd, kind){
  const v = CROWD_KINDS[kind] || CROWD_KINDS.mix;
  return { x, y, z, v:v[Math.floor(rnd() * v.length)], h:1.62 + rnd() * 0.24, t:CROWD_TINTS[Math.floor(rnd() * CROWD_TINTS.length)], s:rnd() };
}
/* une foule posée par l'utilisateur : un rectangle de w × d mètres, tourné de ry, plus ou moins dense */
function crowdSprites(c){
  const out = [], rnd = seeded(c.seed || 1), n = Math.min(700, Math.round(c.w * c.d * (c.dens || 1) * 0.8));
  const cs = Math.cos((c.ry || 0) * D2R), sn = Math.sin((c.ry || 0) * D2R);
  for(let i = 0; i < n; i++){
    const a = (rnd() - 0.5) * c.w, b = (rnd() - 0.5) * c.d;
    out.push(crowdOne(c.x + a * cs + b * sn, c.y || 0, c.z - a * sn + b * cs, rnd, c.kind));
  }
  return out;
}
/* les sommets d'une foule : deux triangles par silhouette, la teinte et la peau de chacune */
function crowdData(list){
  const d = [];
  for(const p of list){
    const w = p.h * 0.5, u0 = p.v / 8, u1 = (p.v + 1) / 8;
    const V = (ox, oy, u, v) => d.push(p.x, p.y, p.z, ox, oy, u, v, p.t[0], p.t[1], p.t[2], p.s);
    V(-w / 2, 0, u0, 1); V(w / 2, 0, u1, 1); V(w / 2, p.h, u1, 0);
    V(-w / 2, 0, u0, 1); V(w / 2, p.h, u1, 0); V(-w / 2, p.h, u0, 0);
  }
  return d;
}
/* les places toutes prêtes de chaque lieu : où mettre un personnage, dans quelle pose */
const SPOTS = {
  garage:[ ['Au milieu', 'In the middle', -0.7, 0.4, 20], ['En face', 'Facing', 0.9, 0.2, -25], ['Près de l’établi', 'By the workbench', -2.5, -1.0, -90], ['Devant la porte', 'By the garage door', 0.6, -3.0, 0] ],
  office:[ ['Au bureau, assis', 'At the desk, seated', -0.2, -0.6, 180, 'sit'], ['Debout, en face', 'Standing, facing', 0.9, 0.9, 210], ['À la fenêtre', 'At the window', -1.0, -2.7, 180], ['À la porte', 'At the door', -1.6, 2.8, 180] ],
  alley:[ ['Au milieu', 'In the middle', -0.5, 0.3, 30], ['En face', 'Facing', 0.7, -0.5, -150], ['Près de la benne', 'By the dumpster', -1.0, -2.2, 90], ['Au fond, à la porte', 'At the back door', -0.3, -12.8, 0] ],
  taxi:[ ['Au volant', 'At the wheel', 0.37, 0.3, 0, 'drive'], ['Derrière, à droite', 'Back seat, right', -0.4, -0.8, 0, 'sit', -0.35], ['Passager avant', 'Front passenger', -0.37, 0.3, 0, 'sit', -0.35], ['Sur le trottoir', 'On the sidewalk', -3.8, 0.4, 90, null, 0.14] ],
  living:[ ['Sur le canapé', 'On the sofa', -0.55, -2.1, 0, 'sit'], ['Sur le canapé, à côté', 'On the sofa, next to', 0.55, -2.1, 0, 'sit'], ['Devant la télé', 'In front of the TV', 0.8, 1.6, 180], ['À la fenêtre', 'At the window', -3.0, 0.2, -90] ],
  cafe:[ ['Au comptoir, client', 'At the counter, customer', -1.0, -1.2, 180], ['Derrière le comptoir', 'Behind the counter', -1.0, -2.85, 0], ['À table', 'At a table', 1.52, 0.0, 90, 'sit'], ['À table, en face', 'At a table, facing', 2.88, 0.0, -90, 'sit'] ],
  park:[ ['Sur le banc', 'On the bench', -1.62, -0.55, 90, 'sit'], ['Sur le banc, à côté', 'On the bench, next to', -1.62, 0.25, 90, 'sit'], ['Sur le chemin', 'On the path', 0.2, 1.4, -160], ['Sous l’arbre', 'Under the tree', -3.6, -2.6, 40] ],
  hall:[ ['Au milieu', 'In the middle', 0.0, 0.0, 0], ['Devant l’ascenseur', 'At the lift', 0.0, -8.2, 180], ['À une porte', 'At a door', -1.1, -3.0, -90], ['Qui arrive', 'Walking in', 0.3, 2.8, 180, 'walk'] ],
  street:[ ['Sur le trottoir', 'On the sidewalk', -6.2, 0.5, 120, null, 0.14], ['En face, sur le trottoir', 'Facing, on the sidewalk', -5.0, -0.5, -60, null, 0.14], ['Au passage piéton', 'At the crosswalk', -1.6, 6.0, 90, 'walk'], ['À l’abribus, assis', 'At the bus stop, seated', 6.32, -8.4, -90, 'sit', -0.34] ],
  beach:[ ['Sur la serviette', 'On the towel', 4.8, 2.6, -150, 'sitground'], ['Allongé au soleil', 'Lying in the sun', -1.6, -0.6, 180, 'lie'], ['Au bord de l’eau', 'At the water’s edge', 1.0, -7.4, 180], ['Qui se promène', 'Taking a walk', -2.0, 2.4, -100, 'walk'] ],
  stadium:[ ['Au rond central', 'Center circle', 0.0, 0.0, 30], ['Face à face', 'Facing', 0.8, 0.6, -150], ['Devant le but', 'In front of the goal', 0.0, 44.0, 180], ['En tribune', 'In the stands', -41.0, 10.0, 90, null, 1.4] ],
  house:[ ['Salon, sur le canapé', 'Living room, on the sofa', -1.6, -3.2, 0, 'sit'], ['Dans la cuisine', 'In the kitchen', 3.6, -1.0, 90], ['À la porte d’entrée', 'At the front door', 0.0, 3.3, 180], ['Dans l’escalier', 'On the stairs', -4.2, 1.55, 180, null, 1.66],
    ['Chambre, sur le lit', 'Bedroom, on the bed', -1.4, -2.4, 0, 'lie', 3.45], ['Chambre, à la fenêtre', 'Bedroom, at the window', -1.0, -3.4, 0, null, 2.9], ['Chambre d’enfant', 'Child’s room', 2.4, -1.4, -60, null, 2.9], ['Au grenier', 'In the attic', 0.6, 0.2, 90, null, 5.8], ['Dans le jardin', 'In the garden', 1.6, 7.0, 180] ],
  roof:[ ['Au bord du toit', 'At the edge', 0.0, -6.3, 180], ['Face à face', 'Facing', 0.9, -4.8, 0], ['Près du château d’eau', 'By the water tower', -2.2, -2.2, -130], ['Assis sur le rebord', 'Sitting on the ledge', 3.0, 6.75, 180, 'sit', 0.55] ],
  warehouse:[ ['Au milieu, face à face', 'In the middle, facing', -0.8, 1.8, 120], ['En face', 'Opposite', 0.6, 1.0, -60], ['Entre les rayonnages', 'Between the racks', -5.0, 2.6, 90], ['Caché derrière une caisse', 'Hiding behind a crate', -3.0, -1.5, 180, 'crouch'] ],
  country:[ ['Au bord de la route', 'By the roadside', 4.3, 1.0, -90], ['Sur la route', 'On the road', 0.9, 3.0, 180, 'walk'], ['Près de la clôture', 'By the fence', -5.0, -1.6, 90], ['Dans le champ', 'In the field', -12.0, -6.0, 30] ],
};
// les deux premières places servent de départ quand on choisit le lieu
Object.keys(SPOTS).forEach(id => { SET_DEF[id].spawn = SPOTS[id].map(p => ({ x:p[2], z:p[3], ry:p[4], pose:p[5], y:p[6] })); });
function setGeo(id){ const g = geo(), gl = geo(), L = (SET_DEF[id].levels || []).map(() => geo()); SET_DEF[id].build(g, gl, L); return { g, glass:gl, levels:L }; }

/* ---------- Le vocabulaire du storyboard (le même que dans Raging Page) ---------- */
const SHOT = {
  size:[['tgp','Très gros plan','Extreme close-up','TGP','ECU'], ['gp','Gros plan','Close-up','GP','CU'], ['pr','Plan rapproché','Medium close-up','PR','MCU'],
    ['pm','Plan moyen','Medium shot','PM','MS'], ['pa','Plan américain','Cowboy shot','PA','Cowboy'], ['pe','Plan d’ensemble','Wide shot','PE','WS'],
    ['pg','Plan général','Extreme wide shot','PG','EWS'], ['am','Amorce (épaule)','Over the shoulder','Amorce','OTS'], ['ins','Insert','Insert','Insert','Insert'],
    ['pov','Plan subjectif','Point of view','Subjectif','POV'], ['2p','Plan à deux','Two-shot','Plan à deux','Two-shot']],
  angle:[['neu','Neutre','Eye level'], ['plo','Plongée','High angle'], ['con','Contre-plongée','Low angle'], ['dess','Vue de dessus','Overhead'], ['deb','Débullé','Dutch angle'], ['sol','Au ras du sol','Ground level']],
  move:[['fix','Fixe','Static'], ['in','Travelling avant','Dolly in'], ['out','Travelling arrière','Dolly out'], ['panR','Panoramique vers la droite','Pan right'], ['panL','Panoramique vers la gauche','Pan left'],
    ['tiltU','Tilt vers le haut','Tilt up'], ['tiltD','Tilt vers le bas','Tilt down'], ['travR','Travelling latéral vers la droite','Truck right'], ['travL','Travelling latéral vers la gauche','Truck left'],
    ['zoomIn','Zoom avant','Zoom in'], ['zoomOut','Zoom arrière','Zoom out'], ['orbit','Travelling circulaire','Arc shot'], ['grue','Grue qui monte','Crane up'], ['grueD','Grue qui descend','Crane down'],
    ['drone','Drone qui s’élève','Drone rising'], ['epa','Caméra épaule','Handheld'], ['end','Vers un cadre de fin','To an end frame']],
};
const shotLabel = (k, v, short) => { const o = (SHOT[k] || []).find(x => x[0] === v); return !o ? '' : (short && o[3]) ? L(o[3], o[4]) : L(o[1], o[2]); };

/* ---------- Cadrage automatique ----------
   Pour chaque valeur de plan : la hauteur de corps à montrer, le point visé
   (en partant du haut de la tête) et la focale qui va bien. */
const FRAMES = {
  tgp:{ span:0.22, from:0.09, lens:85 },
  gp: { span:0.45, from:0.2, lens:85 },
  pr: { span:0.72, from:0.34, lens:50 },
  pm: { span:1.0, from:0.48, lens:35 },
  pa: { span:1.3, from:0.62, lens:35 },
  pe: { span:2.25, from:0.9, lens:28 },
  pg: { span:6.0, from:0.9, lens:24 },
};
const ANGLES = { neu:{ pitch:-2, side:22 }, plo:{ pitch:-32, side:22 }, con:{ pitch:24, side:22 }, dess:{ pitch:-84, side:0 }, sol:{ pitch:6, side:22, low:true } };
/* les repères du corps dans le monde : haut de la tête, yeux, direction du regard */
function bodyMarks(ch){
  const M = charMatrices(ch), P = (id, v) => M4.apply(M[id], v);
  const top = P('head', [0, 0.245, 0]), eyes = P('head', [0, 0.13, 0.06]), nose = P('head', [0, 0.11, 0.3]), feet = Math.min(P('footL', [0, -0.065, 0])[1], P('footR', [0, -0.065, 0])[1]);
  const fx = nose[0] - eyes[0], fz = nose[2] - eyes[2];
  return { top, eyes, feet, face:Math.atan2(fx, fz) / D2R, chest:P('chest', [0, 0.18, 0]), shoulderR:P('armR', [0, 0, 0]), shoulderL:P('armL', [0, 0, 0]) };
}
/* caméra (cible, angle, recul) qui cadre « size » sur le personnage, vu sous « angle » */
function frameOn(ch, size, angle, lens, side){
  const F = FRAMES[size] || FRAMES.pm, A = ANGLES[angle] || ANGLES.neu, b = bodyMarks(ch);
  const height = b.top[1] - b.feet;
  const span = size === 'pe' ? Math.max(F.span, height + 0.35) : F.span;
  const cy = size === 'pe' || size === 'pg' ? b.feet + height * 0.52 : b.top[1] - F.from;
  const L_ = lens || F.lens, fov = 2 * Math.atan(12 / L_);
  let dist = (span / 2) / Math.tan(fov / 2) * 1.04;
  if(angle === 'dess') dist = Math.max(dist, 2.2);
  const s = side == null ? A.side : side;
  return { tx:b.eyes[0], ty:cy - (A.low ? 0.25 : 0), tz:b.eyes[2], yaw:b.face + s, pitch:A.pitch, dist:clamp(dist, 0.35, 28), lens:L_ };
}
/* amorce : par-dessus l'épaule de « back », on regarde le visage de « front » */
function frameOTS(front, back, lens){
  const f = bodyMarks(front), k = bodyMarks(back);
  const dx = k.eyes[0] - f.eyes[0], dz = k.eyes[2] - f.eyes[2], d = Math.hypot(dx, dz) || 1;
  const ux = dx / d, uz = dz / d, rx = uz, rz = -ux;           // de « front » vers « back », et le côté
  const eye = [k.eyes[0] + ux * 0.55 + rx * 0.32, k.eyes[1] + 0.06, k.eyes[2] + uz * 0.55 + rz * 0.32];
  const tgt = [f.eyes[0] - rx * 0.05, f.eyes[1] - 0.06, f.eyes[2] - rz * 0.05];
  const vx = eye[0] - tgt[0], vy = eye[1] - tgt[1], vz = eye[2] - tgt[2], dist = Math.hypot(vx, vy, vz);
  return { tx:tgt[0], ty:tgt[1], tz:tgt[2], yaw:Math.atan2(vx, vz) / D2R, pitch:-Math.asin(vy / dist) / D2R, dist, lens:lens || 50 };
}
/* plan à deux : les deux personnages dans le cadre, de profil à trois quarts */
function frameTwo(a, b2, lens, pref, full){
  const A = bodyMarks(a), Bm = bodyMarks(b2);
  const cx = (A.eyes[0] + Bm.eyes[0]) / 2, cz = (A.eyes[2] + Bm.eyes[2]) / 2, gap = Math.hypot(A.eyes[0] - Bm.eyes[0], A.eyes[2] - Bm.eyes[2]);
  const ang = Math.atan2(Bm.eyes[0] - A.eyes[0], Bm.eyes[2] - A.eyes[2]) / D2R + 90;
  const L_ = lens || 35, fov = 2 * Math.atan(12 / L_), top = Math.max(A.top[1], Bm.top[1]);
  // plan large : les deux corps en entier, et assez de largeur pour l'écart entre eux (image 16:9)
  const span = full ? Math.max(top + 0.4, (gap + 1.1) * 9 / 16) : Math.max(1.3, gap * 0.75 + 0.6);
  // des deux côtés possibles, on garde celui où se trouve déjà la caméra
  const diff = y => Math.abs(((y - (pref || 0)) % 360 + 540) % 360 - 180);
  const yaw = diff(ang) <= diff(ang + 180) ? ang : ang + 180;
  return { tx:cx, ty:full ? Math.min(top / 2 + 0.1, top - 0.6) : top - 0.6, tz:cz, yaw:yaw + (full ? 18 : 8), pitch:full ? -6 : -3, dist:(span / 2) / Math.tan(fov / 2) * 1.1, lens:L_ };
}
/* les deux personnages se tournent l'un vers l'autre */
function faceEachOther(chars){
  if(chars.length < 2) return;
  const [a, b] = chars;
  a.root.ry = Math.atan2(b.root.x - a.root.x, b.root.z - a.root.z) / D2R;
  b.root.ry = Math.atan2(a.root.x - b.root.x, a.root.z - b.root.z) / D2R;
}

/* ---------- Les prises de vue en voiture (dans le taxi) ----------
   Chacune : l'œil de la caméra, le point visé, la focale et la valeur de plan.
   Elles supposent le conducteur au volant et le passager à l'arrière, à droite. */
const CAR_SHOTS = [
  ['pare', 'Conducteur, par le pare-brise', 'Driver, through the windshield', [0.3, 1.32, 3.0], [0.37, 1.27, 0.3], 50, 'pr'],
  ['parearr', 'Passager, par le pare-brise', 'Passenger, through the windshield', [-0.25, 1.36, 3.0], [-0.4, 1.25, -0.8], 50, 'pr'],
  ['deux', 'Les deux, de face', 'Both, from the front', [0, 1.45, 3.6], [0, 1.2, -0.25], 28, '2p'],
  ['vitre', 'Profil, par la vitre', 'Profile, through the window', [2.3, 1.3, 0.32], [0.37, 1.27, 0.32], 50, 'gp'],
  ['epaule', 'Par-dessus l’épaule (la route)', 'Over the shoulder (the road)', [0.02, 1.45, -0.25], [0.45, 1.1, 4.5], 24, 'am'],
  ['arriere', 'Depuis la banquette arrière', 'From the back seat', [0.05, 1.33, -0.85], [0.37, 1.25, 0.4], 24, 'pr'],
  ['retro', 'Les yeux dans le rétroviseur', 'Eyes in the rear-view mirror', [0.0, 1.42, 0.6], [0.37, 1.32, 0.3], 35, 'gp'],
  ['portiere', 'À la portière (on monte)', 'At the door (getting in)', [-2.6, 1.25, -0.5], [-0.4, 1.05, -0.8], 35, 'pm'],
  ['arrive', 'Le taxi arrive (plan large)', 'The taxi pulls up (wide)', [-2.2, 0.45, 10.5], [0, 0.8, 0.3], 28, 'pe'],
  ['dessus', 'Vue du dessus', 'From above', [0.2, 9, 0.6], [0, 0.5, -0.2], 24, 'pg'],
];
/* une caméra à partir de l'endroit où elle est (e) et de ce qu'elle regarde (t) */
function camLook(e, t, lens){
  const vx = e[0] - t[0], vy = e[1] - t[1], vz = e[2] - t[2], dist = Math.hypot(vx, vy, vz) || 1;
  return { tx:t[0], ty:t[1], tz:t[2], yaw:Math.atan2(vx, vz) / D2R, pitch:-Math.asin(vy / dist) / D2R, dist, lens, roll:0 };
}

/* ---------- Les accessoires, tenus dans la main droite ----------
   Dans le repère de la main, les doigts vont vers le bas (-y) : le canon prolonge la main,
   la crosse descend dans la paume. */
const PROPS = [['gun', 'Pistolet', 'Handgun'], ['phone', 'Téléphone', 'Phone']];
function propGeo(id){
  const g = geo(), K = '#23252B', Kl = '#3A3D44';
  if(id === 'gun'){
    box(g, 0, -0.1, 0.034, 0.028, 0.19, 0.034, K);           // la culasse et le canon
    box(g, 0, -0.04, -0.012, 0.025, 0.04, 0.085, Kl);         // la crosse, dans la paume
    box(g, 0, -0.072, 0.0, 0.006, 0.035, 0.03, K);            // le pontet
    box(g, 0, -0.192, 0.034, 0.012, 0.006, 0.012, '#111214');  // la bouche du canon
  } else if(id === 'phone'){
    box(g, 0, -0.085, 0.03, 0.07, 0.14, 0.012, '#1E2026');
    box(g, 0, -0.085, 0.0365, 0.062, 0.128, 0.002, '#2E3846');
  }
  return g;
}

/* ---------- Les véhicules qu'on pose où l'on veut (la moto) ----------
   Repère du véhicule : il regarde vers +z ; la selle du pilote est en z = -0.2, celle du passager en -0.55. */
const VEHICLES = [['moto', 'Moto', 'Motorbike']];
const MOTO_COLS = ['#B4232C', '#24262B', '#3D5A80', '#E8B923'];
function vehicleGeo(kind, col){
  const g = geo(), K = '#1E2025', M = '#9AA0A8', C = col || MOTO_COLS[0];
  if(kind === 'moto'){
    [0.7, -0.72].forEach(z => { cyl(g, -0.06, 0.31, z, 0.31, 0.31, 0.12, '#17181B', 16, 'x'); cyl(g, -0.065, 0.31, z, 0.13, 0.13, 0.13, M, 10, 'x'); });
    prism(g, [[0.45, 0.78], [0.42, 0.98], [0.05, 1.0], [-0.02, 0.8]], -0.15, 0.15, C);                 // le réservoir
    prism(g, [[-0.02, 0.8], [0.0, 0.86], [-0.62, 0.9], [-0.72, 0.84], [-0.72, 0.78]], -0.14, 0.14, '#24262B');   // la selle
    prism(g, [[0.42, 0.5], [0.45, 0.78], [-0.02, 0.8], [-0.3, 0.45]], -0.1, 0.1, K);                   // le cadre et le moteur
    box(g, 0, 0.42, 0.02, 0.26, 0.24, 0.36, M);                                                         // le moteur
    prism(g, [[-0.62, 0.78], [-0.6, 0.86], [-0.98, 0.8], [-0.95, 0.74]], -0.13, 0.13, C);             // le garde-boue arrière
    prism(g, [[0.88, 0.55], [0.86, 0.62], [0.5, 0.66], [0.52, 0.58]], -0.1, 0.1, C);                 // le garde-boue avant
    [0.075, -0.075].forEach(x => { const a = [x, 0.31, 0.7], b = [x, 1.0, 0.44]; const n = 6;
      for(let i = 0; i < n; i++){ const t0 = i / n, t1 = (i + 1) / n; box(g, x, a[1] + (b[1] - a[1]) * (t0 + t1) / 2, a[2] + (b[2] - a[2]) * (t0 + t1) / 2, 0.035, (b[1] - a[1]) / n + 0.01, 0.04, M); } });
    box(g, 0, 1.03, 0.46, 0.72, 0.03, 0.03, K);                                                         // le guidon
    [0.33, -0.33].forEach(x => cyl(g, x - 0.05, 1.03, 0.46, 0.022, 0.022, 0.1, '#2C2E33', 8, 'x'));
    cyl(g, 0, 0.92, 0.6, 0.09, 0.09, 0.05, '#FBF6DF', 12, 'z'); box(g, 0, 0.92, 0.57, 0.2, 0.18, 0.06, C);   // le phare
    box(g, 0, 0.82, -0.98, 0.1, 0.05, 0.03, '#C2453B');                                                // le feu arrière
    cyl(g, 0.16, 0.36, -0.15, 0.04, 0.05, 0.7, M, 8, 'z');                                             // l'échappement
    [0.17, -0.17].forEach(x => box(g, x, 0.38, 0.17, 0.08, 0.02, 0.04, K));                           // les repose-pieds
  }
  return g;
}
/* les prises de vue de la moto, dans son repère : [id, fr, en, œil, cible, focale, valeur, angle] */
const MOTO_SHOTS = [
  ['face', 'De face, le pilote arrive', 'Head-on, rider coming', [0.4, 1.2, 5.5], [0, 1.2, 0], 35, 'pe'],
  ['prof', 'De profil (travelling)', 'Side on (tracking)', [4.2, 1.0, 0.1], [0, 1.0, 0], 35, 'pe'],
  ['dos', 'De dos, on suit la moto', 'From behind, following', [0.5, 1.6, -4.5], [0, 1.1, 0.5], 35, 'pe'],
  ['gp', 'Gros plan du pilote', 'Close-up of the rider', [0.9, 1.55, 1.5], [0, 1.5, -0.1], 50, 'gp'],
  ['sol', 'Au ras du sol, la roue', 'Ground level, the wheel', [0.9, 0.25, 2.2], [0, 0.55, 0.4], 24, 'pm', 'sol'],
  ['epaule', 'Par-dessus l’épaule du pilote', 'Over the rider’s shoulder', [-0.25, 1.78, -0.75], [0.1, 1.1, 5], 24, 'am'],
  ['guidon', 'Caméra sur le guidon', 'Handlebar camera', [0, 1.22, 0.62], [0, 1.5, -0.12], 24, 'gp'],
  ['dessus', 'Vue de dessus', 'From above', [0.3, 7, 0.3], [0, 0.8, 0], 28, 'pg', 'dess'],
];
/* les prises de vue d'un personnage qui tient une arme, dans son repère (x : sa gauche, z : devant lui).
   « e » et « s » : la hauteur des yeux et des épaules ; « H » : la main qui tient l'arme. */
const GUN_SHOTS = [
  ['canon', 'Le canon vers la caméra', 'Barrel at the camera', (e, s) => [-0.12, e, 1.7], (e, s) => [-0.05, e - 0.08, 0], 35, 'pm'],
  ['epaule', 'Par-dessus l’épaule du tireur', 'Over the shooter’s shoulder', (e, s) => [-0.38, e + 0.1, -0.65], (e, s) => [-0.12, e - 0.15, 4], 35, 'am'],
  ['arme', 'Gros plan sur l’arme', 'Close-up on the gun', null, null, 50, 'tgp'],
  ['profil', 'Le tireur de profil', 'The shooter in profile', (e, s) => [-2.6, s, 0.35], (e, s) => [0, s, 0.35], 35, 'pa'],
  ['contre', 'Contre-plongée menaçante', 'Threatening low angle', (e, s) => [-0.3, 0.55, 1.6], (e, s) => [0, e - 0.1, 0], 28, 'pm', 'con'],
  ['large', 'Plan large de la scène', 'Wide shot of the scene', (e, s) => [2.6, 1.7, 4.6], (e, s) => [0, 1.1, 1.3], 28, 'pe'],
];
