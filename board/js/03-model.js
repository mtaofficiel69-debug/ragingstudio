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
  // les rôles secondaires : la police et les truands
  { id:'cop', body:'m', npc:true, fr:'Policier', en:'Police officer', skin:'#D9B092', hair:'#2A211B', hairStyle:'short', top:'#243046', inner:'#A9C4D2', tie:'#141A28', bottom:'#243046', shoes:'#141518', wear:'suit', cap:'#1D2433' },
  { id:'copf', body:'f', npc:true, fr:'Policière', en:'Policewoman', skin:'#EAC7AE', hair:'#5A3A24', hairStyle:'bun', top:'#243046', inner:'#A9C4D2', tie:'#141A28', bottom:'#243046', shoes:'#141518', wear:'suit', cap:'#1D2433', lips:'#A86A66' },
  { id:'robber', body:'m', npc:true, fr:'Braqueur', en:'Robber', skin:'#D9B092', hair:'#1E1A18', hairStyle:'short', top:'#1E1F23', bottom:'#2A2C31', shoes:'#141518', wear:'sweater', mask:'#1A1B1F' },
  { id:'thug', body:'m', npc:true, fr:'Truand', en:'Gangster', skin:'#B98466', hair:'#1E1A18', hairStyle:'short', top:'#1E1F23', inner:'#F1EFEA', bottom:'#1E1F23', shoes:'#141518', wear:'cardigan', shades:true },
];
CHAR_LOOK.forEach(lk => { lk.col = lk.top; });
const MAX_CHARS = 8;
/* les tenues : chaque personnage garde son visage, sa coiffure et sa silhouette, seuls les habits changent */
const OUTFITS = [
  { id:'base', fr:'Tenue d’origine', en:'Own outfit' },
  { id:'blacksuit', fr:'Costume noir', en:'Black suit', wear:'suit', top:'#1F2024', inner:'#F4F2EE', tie:'#1F2024', bottom:'#1F2024', shoes:'#141518', skirt:false, shorts:false },
  { id:'casual', fr:'Pull et jean', en:'Sweater and jeans', wear:'sweater', top:'#5E7F6A', bottom:'#3E5577', shoes:'#E9E6E0', sole:'#F4F2EE', skirt:false, shorts:false },
  { id:'tee', fr:'T-shirt blanc', en:'White T-shirt', wear:'tee', top:'#F1EFEA', bottom:'#3E5577', shoes:'#2A2C31', skirt:false, shorts:false },
  { id:'leather', fr:'Blouson de cuir', en:'Leather jacket', wear:'cardigan', top:'#1E1F23', inner:'#F1EFEA', bottom:'#2E3A4E', shoes:'#141518', skirt:false, shorts:false },
  { id:'trench', fr:'Imperméable', en:'Trench coat', wear:'coat', top:'#B39A6B', inner:'#E9E4DA', bottom:'#3A3D44', shoes:'#2A221D', skirt:false, shorts:false },
  { id:'dress', fr:'Robe de soirée', en:'Evening dress', wear:'dress', top:'#9B1C2E', bottom:'#9B1C2E', shoes:'#141518', skirt:true, shorts:false, body:'f' },
  { id:'police', fr:'Uniforme de police', en:'Police uniform', wear:'suit', top:'#243046', inner:'#A9C4D2', tie:'#141A28', bottom:'#243046', shoes:'#141518', skirt:false, shorts:false },
  { id:'doctor', fr:'Blouse blanche', en:'White coat', wear:'coat', top:'#F4F2EE', inner:'#A9C4D2', bottom:'#5E636C', shoes:'#E9E6E0', skirt:false, shorts:false },
  { id:'sport', fr:'Survêtement', en:'Tracksuit', wear:'sweater', top:'#2F6E4F', bottom:'#2F6E4F', shoes:'#F4F2EE', sole:'#F4F2EE', skirt:false, shorts:false },
];
const _outfitLooks = new Map();
function outfitLook(base, oid){
  const o = OUTFITS.find(x => x.id === oid); if(!o || o.id === 'base' || (o.body && o.body !== base.body)) return base;
  const key = base.id + '_' + o.id; let lk = _outfitLooks.get(key);
  if(!lk){ lk = Object.assign({}, base); for(const k in o) if(!['id', 'fr', 'en', 'body'].includes(k)) lk[k] = o[k]; lk.id = key; lk.col = lk.top; _outfitLooks.set(key, lk); }
  return lk;
}
/* les expressions du visage : les sourcils, les yeux et la bouche changent (le reste du corps est le même) */
const EXPRS = [['neutral', 'Neutre', 'Neutral'], ['happy', 'Joie', 'Happy'], ['sad', 'Tristesse', 'Sad'], ['angry', 'Colère', 'Angry'], ['surprised', 'Surprise', 'Surprised'], ['scared', 'Peur', 'Scared'], ['shout', 'Cri', 'Shouting']];
const _exprLooks = new Map();
function exprLook(lk, e){
  if(!e || e === 'neutral') return lk;
  const key = lk.id + '_e_' + e; let o = _exprLooks.get(key);
  if(!o){ o = Object.assign({}, lk, { expr:e, id:key }); _exprLooks.set(key, o); }
  return o;
}
/* les couleurs choisies pour un personnage (peau, cheveux, haut, bas) : pour tout le film, comme son nom */
const _colLooks = new Map(), COL_KEYS = ['skin', 'hair', 'top', 'bottom'];
function colorLook(lk, c){
  const ks = c ? COL_KEYS.filter(k => /^#[0-9a-f]{6}$/i.test(c[k] || '')) : []; if(!ks.length) return lk;
  const key = lk.id + '_c_' + ks.map(k => k[0] + c[k].slice(1).toLowerCase()).join(''); let o = _colLooks.get(key);
  if(!o){ o = Object.assign({}, lk, { id:key }); ks.forEach(k => { o[k] = c[k]; }); if(c.top && /^#/.test(c.top)) o.col = c.top; if(lk.wear === 'dress' && c.top && !c.bottom) o.bottom = c.top; _colLooks.set(key, o); }
  return o;
}
const lookOf = (ch, c) => { const li = ch && ch.look != null ? ch.look : (c || 0) % 2, base = CHAR_LOOK[li] || CHAR_LOOK[0], cols = typeof S !== 'undefined' && S.doc && S.doc.colors && S.doc.colors[li];
  return exprLook(colorLook(ch && ch.outfit ? outfitLook(base, ch.outfit) : base, cols), ch && ch.expr); };
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
  const tie = (lk.wear === 'suit' || lk.wear === 'coat') && lk.tie;   // la cravate ne va qu'avec une veste (pas sur un pull ni un t-shirt)
  const metal = [0.72, 0.66, 0.5];
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
      // la jupe : la taille, puis deux pans qui suivent les cuisses (assise, à genoux, en courant, elle ne se fait plus traverser)
      if(lk.skirt){ const len = lk.age === 'old' ? 0.335 : lk.wear === 'dress' ? 0.27 : 0.25;
        cyl(g, 0, 0.075, 0, f ? 0.182 : 0.174, f ? 0.2 : 0.19, 0.15, c, 14); box(g, 0, 0.068, 0, (f ? 0.35 : 0.32) + 0.012, 0.022, (f ? 0.21 : 0.2) + 0.012, dark(c, 0.78));
        box(g, 0, -0.06 - len * 0.21, -0.004, 0.17, len * 0.42, f ? 0.16 : 0.15, c); }   // le tissu entre les deux pans : la jupe reste fermée
      else if(!bare){ box(g, 0, 0.065, 0, (f ? 0.35 : 0.32) + 0.008, 0.03, (f ? 0.21 : 0.2) + 0.008, dark(BOT, 0.55));   // la ceinture
        if(lk.wear !== 'sweater' && lk.wear !== 'coat') box(g, 0, 0.065, (f ? 0.105 : 0.1) + 0.006, 0.034, 0.026, 0.006, metal);   // et sa boucle
        // les poches de devant (jean, pantalon de toile) : une fente en biais de chaque côté
        if(lk.wear !== 'suit' && lk.wear !== 'coat') [1, -1].forEach(sd => tri(g, [sd * 0.1, 0.045, (f ? 0.105 : 0.1) + 0.004], [sd * 0.155, 0.045, (f ? 0.105 : 0.1) + 0.004], [sd * 0.155, -0.02, (f ? 0.105 : 0.1) + 0.004], dark(BOT, 0.7))); }
      if(lk.wear === 'suit' && !bare) box(g, 0, 0.05, 0, (f ? 0.35 : 0.32) + 0.02, 0.06, (f ? 0.21 : 0.2) + 0.02, TOP);   // le bas de la veste, sur les hanches
      if(lk.wear === 'coat' || lk.wear === 'cardigan') cyl(g, 0, 0.075, 0, f ? 0.19 : 0.182, f ? 0.215 : 0.205, lk.wear === 'coat' ? 0.16 : 0.1, TOP, 14);
      break;
    }
    case 'spine': {
      const wbS = f ? 0.25 : 0.29, wtS = f ? 0.26 : 0.305, dS = f ? 0.175 : 0.185, dT = f ? 0.19 : 0.2;
      taper8(g, -0.02, 0.21, wbS / 2, dS / 2, wtS / 2, dT / 2, TOP);   // le ventre, arrondi
      // le devant du ventre suit la pente du volume : ce qu'on pose dessus (chemise, cravate, boutons) reste bien visible
      const zAt = y => dS / 2 + (dT - dS) / 2 * (y + 0.02) / 0.23 + 0.003;
      const flat = (x0, x1, y0, y1, col) => quad(g, [x0, y0, zAt(y0)], [x1, y0, zAt(y0)], [x1, y1, zAt(y1)], [x0, y1, zAt(y1)], col);
      if(!bare && (lk.wear === 'suit' || lk.wear === 'coat' || lk.wear === 'cardigan')){
        flat(-0.035, 0.035, 0.0, 0.2, IN);         // le devant de la chemise
        if(lk.wear === 'cardigan') [0.04, 0.12].forEach(y => box(g, 0.05, y, zAt(y), 0.014, 0.014, 0.006, dark(TOP, 0.6)));
      }
      if(!bare){
        const d = dS + 0.01, wb = wbS;
        // la veste : deux boutons ; le pull : la bande côtelée ; la robe : une fine ceinture ; le trench : sa ceinture et sa boucle
        if(lk.wear === 'suit') [0.035, 0.105].forEach(y => ball(g, 0.042, y, zAt(y), 0.011, 0.011, 0.005, dark(TOP, 0.5), 6));
        if(lk.wear === 'sweater') box(g, 0, 0.022, 0, wb + 0.014, 0.044, d + 0.014, dark(TOP, 0.82));
        if(lk.wear === 'tee' || lk.wear === 'blouse') box(g, 0, 0.012, 0, wb + 0.01, 0.024, d + 0.01, dark(TOP, 0.9));
        if(lk.wear === 'dress') box(g, 0, 0.03, 0, wb + 0.012, 0.03, d + 0.012, dark(TOP, 0.6));
        if(lk.wear === 'coat'){ box(g, 0, 0.03, 0, wb + 0.018, 0.04, d + 0.018, dark(TOP, 0.78)); box(g, 0, 0.03, (d + 0.018) / 2 + 0.004, 0.05, 0.05, 0.008, metal); box(g, 0, 0.03, (d + 0.018) / 2 + 0.007, 0.03, 0.026, 0.006, dark(TOP, 0.78)); }
        if(lk.wear === 'blouse') [0.05, 0.13].forEach(y => ball(g, 0, y, zAt(y), 0.009, 0.009, 0.004, [0.95, 0.94, 0.9], 6));
        if(lk.wear === 'cardigan') [1, -1].forEach(sd => box(g, sd * 0.07, 0.04, zAt(0.04) + 0.002, 0.07, 0.055, 0.006, dark(TOP, 0.82)));   // les poches
      }
      if(!bare && tie){ const y0 = 0.0, y1 = 0.2; quad(g, [-0.018, y0, zAt(y0) + 0.001], [0.018, y0, zAt(y0) + 0.001], [0.012, y1, zAt(y1) + 0.001], [-0.012, y1, zAt(y1) + 0.001], H(lk.tie)); }
      break;
    }
    case 'chest': {
      { const wb = f ? 0.27 : 0.31, wt = f ? 0.33 : 0.39, d = f ? 0.2 : 0.22;
        taper8(g, -0.015, 0.2, wb / 2, (f ? 0.19 : 0.2) / 2, wt / 2, d / 2, TOP, 0.4, 0.005);              // la poitrine, arrondie
        taper8(g, 0.2, 0.275, wt / 2, d / 2, wt / 2 - 0.05, d / 2 - 0.035, TOP, 0.45, 0.005); }           // les épaules qui descendent vers le cou
      ball(g, sx, 0.218, 0, 0.054, 0.056, 0.056, TOP, 10); ball(g, -sx, 0.218, 0, 0.054, 0.056, 0.056, TOP, 10);
      cyl(g, 0, 0.34, 0, f ? 0.045 : 0.05, f ? 0.05 : 0.055, 0.08, SK, 10);
      if(f && !kid) ball(g, 0, 0.12, 0.042, 0.13, 0.068, 0.07, TOP, 14);   // la poitrine, un volume doux (plus de bosse en lentille)
      const zf = (f ? 0.1 : 0.11) + 0.0055;
      if(!bare){
        if(lk.wear === 'suit' || lk.wear === 'coat' || lk.wear === 'cardigan'){
          // l'encolure en V : la chemise, la cravate, les revers de la veste
          tri(g, [-0.075, 0.27, zf], [0, 0.04, zf], [0.075, 0.27, zf], IN);
          if(tie){ tri(g, [-0.02, 0.255, zf + 0.001], [0, 0.03, zf + 0.001], [0.02, 0.255, zf + 0.001], H(lk.tie)); box(g, 0, 0.255, zf, 0.032, 0.025, 0.006, H(lk.tie)); }
          const lap = dark(TOP, 0.72);
          tri(g, [-0.075, 0.27, zf + 0.0015], [-0.03, 0.12, zf + 0.0015], [-0.0, 0.04, zf + 0.0015], lap); tri(g, [0.075, 0.27, zf + 0.0015], [0, 0.04, zf + 0.0015], [0.03, 0.12, zf + 0.0015], lap);
        }
        if(lk.wear === 'sweater' || lk.wear === 'tee' || lk.wear === 'dress' || lk.wear === 'blouse') cyl(g, 0, 0.305, 0, f ? 0.058 : 0.064, f ? 0.06 : 0.066, 0.025, dark(TOP, 0.82), 12);   // le col
        if(lk.wear === 'suit' && !lk.cap) box(g, -0.095, 0.17, zf + 0.002, 0.04, 0.016, 0.006, IN);   // la pochette
        if(lk.wear === 'coat') [0.06, 0.12].forEach(y => [0.05, -0.05].forEach(x => ball(g, x, y, zf + 0.002, 0.011, 0.011, 0.005, dark(TOP, 0.55), 6)));   // la double rangée de boutons
        if(lk.wear === 'blouse') [1, -1].forEach(sd => tri(g, [sd * 0.002, 0.27, zf + 0.004], [sd * 0.06, 0.29, zf - 0.01], [sd * 0.035, 0.225, zf + 0.004], [0.96, 0.95, 0.92]));   // le col de chemisier
      }
      break;
    }
    case 'head': {
      const B = SK, LIP = H(lk.lips || '#A26A60'), BROW = dark(HAIR, lk.age === 'old' ? 0.85 : 0.9);
      ball(g, 0, 0.125, 0.0, 0.097, 0.118, 0.106, B, 14);                   // le crâne
      ball(g, 0, 0.06, 0.03, 0.074, 0.064, 0.078, B, 12);                   // la mâchoire, arrondie
      ball(g, 0.1, 0.112, -0.004, 0.018, 0.036, 0.026, B, 8); ball(g, -0.1, 0.112, -0.004, 0.018, 0.036, 0.026, B, 8);   // les oreilles
      if(!bare){
        // le nez n'a pas de contour : sans quoi un trait noir en fait le tour, au milieu du visage
        ball(g, 0, 0.1, 0.1, 0.014, 0.033, 0.022, B, 8); ball(g, 0, 0.084, 0.113, 0.016, 0.013, 0.014, B, 8);            // le nez
        // les yeux : le blanc, puis l'iris ; les sourcils, posés sur le front ; la bouche
        const zs = (x, y) => 0.106 * Math.sqrt(Math.max(0, 1 - (x / 0.097) ** 2 - ((y - 0.125) / 0.118) ** 2)) + 0.003;
        // l'expression : la hauteur des sourcils (côté nez, côté tempe), l'ouverture des yeux, la forme de la bouche
        const EX = { neutral:[0, 0, 1], happy:[0.003, 0.004, 0.78], sad:[0.011, -0.005, 0.9], angry:[-0.011, 0.005, 0.72], surprised:[0.015, 0.013, 1.35], scared:[0.016, 0.006, 1.3], shout:[-0.007, 0.003, 0.95] }[lk.expr || 'neutral'] || [0, 0, 1];
        [0.036, -0.036].forEach(x => {
          ball(g, x, 0.128, 0.092, 0.019, 0.013 * EX[2], 0.012, [0.96, 0.95, 0.93], 8);
          ball(g, x, 0.128, 0.1, 0.0085, Math.min(0.0095, 0.0095 * EX[2] + 0.001), 0.007, [0.17, 0.13, 0.11], 8);
          const s = x > 0 ? 1 : -1, xi = x - 0.021 * s, xo = x + 0.021 * s;
          const P = [[xi, 0.152 + EX[0]], [xo, 0.157 + EX[1]], [xo, 0.165 + EX[1]], [xi, 0.162 + EX[0]]].map(([a, b]) => [a, b, zs(a, b)]);
          if(s > 0) quad(g, P[0], P[1], P[2], P[3], BROW); else quad(g, P[0], P[3], P[2], P[1], BROW);
        });
        const mw = f ? 0.023 : 0.026, IN_ = [0.32, 0.12, 0.12], E_ = lk.expr || 'neutral';
        if(E_ === 'happy'){ ball(g, 0, 0.049, 0.103, mw * 0.8, 0.007, 0.01, LIP, 8); [1, -1].forEach(sd => { ball(g, sd * mw * 0.85, 0.056, 0.1, 0.011, 0.0065, 0.009, LIP, 6); ball(g, sd * 0.052, 0.07, 0.085, 0.022, 0.016, 0.02, dark(SK, 0.97), 6); }); }   // le sourire
        else if(E_ === 'sad'){ ball(g, 0, 0.057, 0.103, mw * 0.65, 0.006, 0.01, LIP, 8); [1, -1].forEach(sd => ball(g, sd * mw * 0.75, 0.049, 0.099, 0.01, 0.006, 0.009, LIP, 6)); }
        else if(E_ === 'angry'){ ball(g, 0, 0.053, 0.102, mw * 0.85, 0.005, 0.01, LIP, 8); [1, -1].forEach(sd => ball(g, sd * mw * 0.85, 0.05, 0.099, 0.008, 0.005, 0.008, LIP, 6)); }
        else if(E_ === 'surprised'){ ball(g, 0, 0.05, 0.1, 0.017, 0.02, 0.011, LIP, 8); ball(g, 0, 0.05, 0.104, 0.012, 0.015, 0.009, IN_, 8); }   // la bouche en O
        else if(E_ === 'scared'){ ball(g, 0, 0.051, 0.1, 0.022, 0.013, 0.011, LIP, 8); ball(g, 0, 0.051, 0.104, 0.017, 0.008, 0.009, IN_, 8); }
        else if(E_ === 'shout'){ ball(g, 0, 0.048, 0.099, 0.024, 0.025, 0.012, LIP, 8); ball(g, 0, 0.048, 0.104, 0.019, 0.02, 0.01, IN_, 8); }
        else ball(g, 0, 0.054, 0.101, mw, 0.007, 0.01, LIP, 8);
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
        ball(g, 0, 0.115, -0.045, 0.098 + puff * 0.8, 0.075, 0.085 + puff * 0.6, HAIR, 12);   // la nuque, arrondie (plus de pavé carré derrière la tête)
        if(hs === 'messy') [[0.03, 0.25, 0.04], [-0.04, 0.245, 0.02], [0.0, 0.255, -0.02]].forEach(([x, y, z]) => ball(g, x, y, z, 0.03, 0.022, 0.03, HAIR, 6));
      } else if(hs === 'bald'){
        ball(g, 0, 0.115, -0.03, 0.102, 0.06, 0.09, HAIR, 12);             // une couronne de cheveux blancs, sur les côtés et derrière
      } else {
        ball(g, 0, 0.162, -0.02, 0.105, 0.101, 0.103, HAIR, 12);
        if(hs === 'bun') ball(g, 0, 0.2, -0.112, 0.055, 0.055, 0.05, HAIR, 10);
        if(hs === 'long'){   // les cheveux longs : une masse arrondie qui tombe dans le dos, et deux mèches de côté
          ball(g, 0, 0.09, -0.055, 0.1, 0.13, 0.075, HAIR, 12); ball(g, 0, -0.03, -0.07, 0.09, 0.1, 0.05, HAIR, 10);
          [0.085, -0.085].forEach(x => ball(g, x, 0.06, 0.0, 0.03, 0.13, 0.06, HAIR, 8)); }
        if(hs === 'pigtails') [0.1, -0.1].forEach(x => { ball(g, x, 0.15, -0.05, 0.03, 0.03, 0.03, H('#D9707A'), 6); ball(g, x * 1.15, 0.08, -0.06, 0.04, 0.07, 0.04, HAIR, 8); });
      }
      // la casquette de police (visière, insigne), la cagoule, les lunettes noires
      if(lk.cap){ const CP = H(lk.cap); ball(g, 0, 0.215, -0.004, 0.112, 0.05, 0.118, CP, 12); cyl(g, 0, 0.2, -0.004, 0.106, 0.106, 0.035, CP, 12);
        box(g, 0, 0.17, 0.112, 0.17, 0.012, 0.075, [0.06, 0.06, 0.07], -0.0); box(g, 0, 0.212, 0.113, 0.026, 0.028, 0.006, H('#E8B923')); }
      if(lk.mask){ const MK = H(lk.mask); ball(g, 0, 0.172, -0.006, 0.108, 0.07, 0.112, MK, 12); ball(g, 0, 0.06, 0.02, 0.09, 0.07, 0.094, MK, 12); ball(g, 0, 0.118, -0.03, 0.104, 0.05, 0.1, MK, 12); ball(g, 0, 0.088, 0.014, 0.103, 0.032, 0.112, MK, 12); ball(g, 0, 0.088, 0.112, 0.022, 0.03, 0.022, MK, 8); ball(g, 0, 0.054, 0.098, 0.042, 0.026, 0.028, MK, 8); }   // la cagoule : seule une fente laisse voir les yeux
      if(lk.shades && !bare){ const K = [0.05, 0.05, 0.06]; [0.037, -0.037].forEach(x => box(g, x, 0.128, 0.114, 0.044, 0.026, 0.008, K)); box(g, 0, 0.134, 0.115, 0.03, 0.006, 0.006, K); }
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
      // les doigts : quatre, séparés, le majeur le plus long (le contour, lui, garde une forme simple)
      if(bare) box(g, 0, -0.12, 0.006, f ? 0.058 : 0.066, 0.05, 0.026, SK);
      else { const W = f ? 0.058 : 0.066, fw = W / 4 - 0.002;
        [0.045, 0.054, 0.05, 0.04].forEach((len, i) => { const x = s * (-W / 2 + fw / 2 + i * (fw + 0.0027)); box(g, x, -0.095 - len / 2, 0.006, fw, len, 0.024, SK); }); }
      ball(g, s * 0.037, -0.06, 0.02, 0.013, 0.032, 0.013, SK, 6);
      break;
    }
    case 'thighL': case 'thighR': {
      const r1 = f ? 0.09 : 0.085, r2 = f ? 0.06 : 0.062;
      if(lk.skirt){
        const old = lk.age === 'old', len = old ? 0.335 : lk.wear === 'dress' ? 0.27 : 0.25, sg = id === 'thighL' ? 1 : -1;
        limb2(r1, r2, 0.42, old ? 0.42 : 0.04, BOT, SK);
        // le pan : évasé vers l'ourlet, un peu décalé vers l'extérieur (les deux pans se rejoignent au milieu)
        cyl(g, sg * (old ? -0.01 : 0.0), 0.075, -0.004, r1 + 0.026, r1 + (old ? 0.075 : 0.052), len + 0.075, BOT, 12);
        cyl(g, sg * (old ? -0.01 : 0.0), -len + 0.012, -0.004, r1 + (old ? 0.076 : 0.053), r1 + (old ? 0.076 : 0.053), 0.012, dark(BOT, 0.8), 12);   // l'ourlet
      }
      else if(lk.shorts) limb2(r1, r2, 0.42, 0.22, BOT, SK);
      else if(lk.wear === 'coat'){   // le manteau : deux pans qui tombent sur les cuisses, comme la jupe
        const sg = id === 'thighL' ? 1 : -1; limb2(r1, r2, 0.42, 0.42, BOT, BOT);
        cyl(g, sg * 0.006, 0.075, -0.006, r1 + 0.034, r1 + 0.05, 0.36, TOP, 10); cyl(g, sg * 0.006, -0.272, -0.006, r1 + 0.051, r1 + 0.051, 0.012, dark(TOP, 0.8), 10); }
      else limb2(r1, r2, 0.42, 0.42, BOT, BOT);
      // le pli du pantalon (ou la couture du jean), sur le devant de la jambe
      if(!bare && !lk.skirt && !lk.shorts) quad(g, [-0.003, -0.02, r1 + 0.0035], [0.003, -0.02, r1 + 0.0035], [0.003, -0.4, r2 + 0.0035], [-0.003, -0.4, r2 + 0.0035], dark(BOT, 0.78));
      break;
    }
    case 'shinL': case 'shinR': {
      const r1 = f ? 0.056 : 0.06, r2 = f ? 0.04 : 0.045, b0 = f ? 0.06 : 0.064;
      const leg = (lk.skirt || lk.shorts) ? SK : BOT;
      limb2(r1, r2, 0.4, lk.skirt && lk.age === 'old' ? 0.1 : 0, lk.skirt ? BOT : leg, leg, b0, lk.age === 'old' && lk.skirt ? BOT : (lk.skirt || lk.shorts) ? SK : BOT);
      if(lk.socks && !bare) cyl(g, 0, -0.32, 0, r2 + 0.006, r2 + 0.005, 0.08, SOCK, 10);
      if(!bare && !lk.skirt && !lk.shorts) quad(g, [-0.003, -0.01, r1 + 0.0035], [0.003, -0.01, r1 + 0.0035], [0.003, -0.38, r2 + 0.0035], [-0.003, -0.38, r2 + 0.0035], dark(BOT, 0.78));
      break;
    }
    case 'footL': case 'footR': {
      ball(g, 0, 0, 0, 0.043, 0.043, 0.043, (lk.skirt || lk.shorts) && !lk.socks ? SK : SOCK, 8);
      box(g, 0, -0.03, 0.055, f ? 0.085 : 0.095, 0.055, f ? 0.22 : 0.24, SHO);
      ball(g, 0, -0.03, 0.15, (f ? 0.085 : 0.095) / 2, 0.026, 0.045, SHO, 8);
      box(g, 0, -0.061, 0.06, (f ? 0.085 : 0.095) + 0.006, 0.014, (f ? 0.22 : 0.24) + 0.03, SOLE);
      if(lk.sole && !bare) box(g, 0, -0.03, 0.15, (f ? 0.085 : 0.095) * 0.6, 0.01, 0.03, SOLE);   // le bout clair des baskets
      if(lk.sole && !bare) [0.03, 0.06, 0.09].forEach(z => box(g, 0, -0.001, z, (f ? 0.085 : 0.095) * 0.55, 0.006, 0.008, SOLE));   // les lacets
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
  // les mains dans les poches : elles sont dedans, on ne voit que les poignets à l'ouverture
  if(ch.pose === 'pocket'){ const z = [0.02,0,0,0, 0,0.02,0,0, 0,0,0.02,0, 0,0,0,1]; out.handL = M4.mul(out.handL, z); out.handR = M4.mul(out.handR, z); }
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
  { id:'think', g:'gest', fr:'Réfléchir', en:'Thinking', y:0, j:{ armR:[25, 2, 60], foreR:[132, 0], armL:[15, 50, -90], foreL:[90, 0], head:[10, 0, 4], handR:[0, 0] } },
  { id:'phone', g:'gest', prop:'phone', fr:'Au téléphone', en:'On the phone', y:0, j:{ head:[6, 0, -10], armR:[57, 180, 87], foreR:[138, 7], handR:[0, 0] } },
  { id:'up', g:'gest', fr:'Mains en l’air', en:'Hands up', y:0, j:{ armL:[150, 28, 0], foreL:[38, 0], armR:[150, 28, 0], foreR:[38, 0], head:[-8, 0, 0] } },
  { id:'sitground', g:'seat', fr:'Assis par terre', en:'Sitting on the ground', y:-0.83, j:{ thighL:[120,  10,  0], shinL:[55], footL:[-20], thighR:[120,  10,  0], shinR:[55], footR:[-20], spine:[10,  0,  0], armL:[55,  12,  0], foreL:[25,  0], armR:[55,  12,  0], foreR:[25,  0] } },
  { id:'lie', g:'seat', fr:'Allongé', en:'Lying down', y:-0.83, j:{ pelvis:[-90, 0], head:[10, 0, 0], armL:[0, 10, 0], armR:[0, 10, 0] } },
  { id:'aim2', fr:'Viser à deux mains', en:'Two-handed aim', g:'gun', prop:'gun', y:0, j:{ head:[6,  0,  0], armL:[50,  -10,  0], foreL:[70,  -19], handL:[0,  0], armR:[61,  -15,  0], foreR:[55,  14], handR:[0,  0] } },
  { id:'aim1', fr:'Viser à une main', en:'One-handed aim', g:'gun', prop:'gun', y:0, j:{ chest:[0,  -8,  0], head:[0,  8,  0], armR:[92,  -15,  -10], foreR:[5,  39], handR:[0,  0] } },
  { id:'gunDown', fr:'Arme baissée', en:'Gun lowered', g:'gun', prop:'gun', y:0, j:{ head:[10,  0,  0], armL:[7,  -7,  15], foreL:[56,  -44], handL:[0,  0], armR:[10,  -15,  -1], foreR:[55,  8], handR:[0,  0] } },
  { id:'crouchAim', fr:'Accroupi, en joue', en:'Crouched, aiming', g:'gun', prop:'gun', y:-0.62, j:{ thighL:[115,  10,  0], shinL:[135], footL:[-25], thighR:[115,  10,  0], shinR:[135], footR:[-25], spine:[12,  0,  0], chest:[0,  0,  0], head:[-14,  0,  0], armL:[68,  -15,  -22], foreL:[75,  19], armR:[76,  -3,  23], foreR:[60,  -6], handL:[0,  0], handR:[0,  0] } },
  { id:'kneel', fr:'À genoux', en:'Kneeling', g:'seat', y:-0.38, j:{ thighL:[0,  6,  0], shinL:[96], footL:[40], thighR:[0,  6,  0], shinR:[96], footR:[40], armL:[0,  -12,  55], foreL:[1,  79], handL:[-1,  0], armR:[0,  -12,  -55], foreR:[1,  -79], handR:[-1,  0] } },
  { id:'rifleAim', fr:'Fusil épaulé', en:'Rifle, shouldered', g:'gun', prop:'rifle', y:0, j:{ head:[4, 0, 0], armR:[13, 3, 8], foreR:[139, -2], handR:[-62, 5], armL:[76, -11, -28], foreL:[30, -22], handL:[-56, 12] } },
  { id:'rifleLow', fr:'Fusil, arme basse', en:'Rifle, low ready', g:'gun', prop:'rifle', y:0, j:{ head:[8, 0, 0], armR:[3, -1, -20], foreR:[94, 25], handR:[-26, 4], armL:[51, 46, -90], foreL:[0, 38], handL:[-10, 0] } },
  { id:'kneelHands', fr:'À genoux, mains sur la tête', en:'Kneeling, hands on head', g:'gun', y:-0.38, j:{ thighL:[0, 6, 0], shinL:[96], footL:[40], thighR:[0, 6, 0], shinR:[96], footR:[40], head:[16, 0, 0], armL:[127, 45, 36], foreL:[126, -30], handL:[0, 0], armR:[127, 45, -36], foreR:[126, 30], handR:[0, 0] } },
  { id:'oneKnee', fr:'Un genou à terre', en:'One knee down', g:'seat', y:-0.39, j:{ thighL:[0,  4,  0], shinL:[96], footL:[40], thighR:[88,  4,  0], shinR:[88], footR:[-5], armL:[0,  -14,  50], foreL:[0,  76], handL:[-1,  0], armR:[32,  -15,  -15], foreR:[2,  21], handR:[0,  0] } },
  { id:'handshake', fr:'Serrer la main', en:'Handshake', g:'gest', y:0, j:{ armR:[34,  -15,  0], foreR:[18,  -13], handR:[0,  0] } },
  { id:'hug', fr:'Prendre dans ses bras', en:'Hugging', g:'gest', y:0, j:{ head:[0,  18,  4], spine:[6,  0,  0], armL:[46,  -15,  0], foreL:[82,  -4], handL:[0,  0], armR:[50,  -15,  8], foreR:[59,  9], handR:[0,  0] } },
  { id:'drink', fr:'Boire', en:'Drinking', g:'gest', prop:'glass', y:0, j:{ head:[-14, 0, 0], armR:[73, 6, -11], foreR:[122, 47], handR:[2, -30] } },
  { id:'shout', fr:'Crier (mains en porte-voix)', en:'Shouting', g:'gest', y:0, j:{ head:[-14,  0,  0], chest:[-4,  0,  0], armL:[92,  28,  0], foreL:[132,  -49], handL:[-1,  0], armR:[92,  28,  0], foreR:[132,  49], handR:[-1,  0] } },
  { id:'readPhone', fr:'Regarder son téléphone', en:'Looking at the phone', g:'gest', y:0, j:{ head:[32,  0,  0], armL:[1,  2,  30], foreL:[93,  -60], handL:[0,  0], armR:[-2,  -10,  -7], foreR:[90,  30], handR:[15,  -30] } },
  { id:'pocket', fr:'Mains dans les poches', en:'Hands in pockets', g:'move', y:0, j:{ armL:[-4, 20, 29], foreL:[47, -76], handL:[-1, 0], armR:[-4, 20, -29], foreR:[47, 76], handR:[-1, 0] } },
  { id:'punch', fr:'Coup de poing', en:'Punching', g:'gest', y:0, j:{ spine:[4,  -14,  0], chest:[4,  -10,  0], thighR:[-10,  0,  0], thighL:[14,  0,  0], shinL:[10], armL:[45,  5,  -15], foreL:[140,  0], handL:[0,  0], armR:[96,  -15,  16], foreR:[5,  41], handR:[0,  0] } },
  { id:'guard', fr:'En garde', en:'On guard', g:'gest', y:0, j:{ thighL:[16,  4,  0], thighR:[-12,  4,  0], shinR:[12], spine:[6,  0,  0], head:[6,  0,  0], armL:[57,  -8,  0], foreL:[101,  -15], handL:[0,  0], armR:[49,  -12,  15], foreR:[111,  0], handR:[0,  0] } },
  { id:'headInHands', fr:'La tête dans les mains', en:'Head in hands', g:'seat', y:-0.4, j:{ thighL:[90,  6,  0], shinL:[88], thighR:[90,  6,  0], shinR:[88], armL:[42,  7,  -45], foreL:[133,  0], armR:[42,  7,  45], foreR:[133,  0], spine:[24,  0,  0], chest:[14,  0,  0], head:[28,  0,  0], handL:[0,  0], handR:[0,  0] } },
  { id:'lookBack', fr:'Se retourner', en:'Looking back', g:'move', y:0, j:{ chest:[0,  30,  0], spine:[0,  18,  0], head:[0,  70,  0], armL:[8,  8,  0], armR:[-8,  8,  0] } },
  { id:'ride', fr:'À moto (pilote)', en:'Riding (driver)', g:'moto', y:-0.02, j:{ spine:[16,  0,  0], chest:[10,  0,  0], head:[-22,  0,  0], armL:[76,  10,  0], foreL:[6,  32], handL:[0,  0], armR:[76,  10,  0], foreR:[6,  -32], handR:[0,  0], thighL:[71,  13,  0], shinL:[114], footL:[-37], thighR:[71,  13,  0], shinR:[114], footR:[-37] } },
  { id:'rideBack', fr:'À moto (passager)', en:'Riding (passenger)', g:'moto', y:0.02, j:{ spine:[10,  0,  0], head:[-10,  0,  0], thighL:[68,  21,  0], thighR:[68,  21,  0], shinL:[117], shinR:[117], armL:[27,  27,  2], foreL:[65,  -80], handL:[0,  0], armR:[27,  27,  -2], foreR:[65,  80], handR:[0,  0], footL:[-27], footR:[-27] } },
  { id:'pilot', fr:'Aux commandes', en:'At the controls', g:'seat', y:-0.4, j:{ thighL:[90,  6,  0], shinL:[88], thighR:[90,  6,  0], shinR:[88], armL:[4,  -14,  11], foreL:[66,  -9], armR:[14,  -15,  0], foreR:[43,  -8], spine:[-2,  0,  0], handL:[0,  0], handR:[0,  0] } },
  { id:'typing', fr:'Taper au clavier', en:'Typing', g:'seat', y:-0.4, j:{ thighL:[90,  6,  0], shinL:[88], thighR:[90,  6,  0], shinR:[88], armL:[23,  -11,  0], foreL:[55,  -4], armR:[23,  -11,  0], foreR:[55,  4], spine:[8,  0,  0], head:[14,  0,  0], handL:[0,  0], handR:[0,  0] } },
  { id:'sitCross', fr:'Assis, jambes croisées', en:'Seated, legs crossed', g:'seat', y:-0.4, j:{ thighL:[90,  4,  0], shinL:[88], thighR:[96,  -14,  8], shinR:[70], armL:[-13,  -15,  17], foreL:[68,  -11], armR:[-3,  -15,  -8], foreR:[61,  30], spine:[6,  0,  0], handL:[0,  0], handR:[0,  0] } },
  { id:'wounded', fr:'Blessé, assis par terre', en:'Wounded, sitting on the ground', g:'seat', y:-0.83, j:{ pelvis:[-24,  0], thighL:[96,  12,  0], shinL:[40], thighR:[90,  8,  0], shinR:[45], head:[18,  0,  6], spine:[6,  0,  0], armL:[0,  6,  -15], foreL:[12,  66], handL:[0,  0], armR:[-13,  -15,  90], foreR:[86,  -41], handR:[0,  0], footR:[-20,  0,  0] } },
  { id:'lieFront', fr:'Allongé sur le ventre', en:'Lying face down', g:'seat', y:-0.82, j:{ pelvis:[90,  0], head:[-30,  0,  0], armL:[135,  5,  66], foreL:[96,  -19], handL:[-1,  0], armR:[135,  5,  -66], foreR:[96,  19], handR:[-1,  0], footL:[45], footR:[45] } },
  { id:'jump', fr:'Sauter', en:'Jumping', g:'move', y:0.35, j:{ thighL:[40,  4,  0], shinL:[80], thighR:[20,  4,  0], shinR:[60], spine:[6,  0,  0], armL:[125,  9,  35], foreL:[76,  0], handL:[0,  0], armR:[125,  9,  -35], foreR:[76,  0], handR:[0,  0] } },
  { id:'leanWall', fr:'Adossé au mur', en:'Leaning on the wall', g:'move', y:0.01, j:{ pelvis:[-6,  0], thighR:[30,  0,  0], shinR:[60], spine:[-4,  0,  0], head:[0,  18,  0], armL:[15,  50,  -90], foreL:[90,  0], handL:[0,  0], armR:[10,  40,  90], foreR:[90,  0], handR:[0,  0] } },
  { id:'clap', fr:'Applaudir', en:'Clapping', g:'gest', y:0, j:{ armL:[60,  24,  0], foreL:[94,  -79], handL:[0,  0], armR:[60,  24,  0], foreR:[94,  79], handR:[0,  0] } },
  { id:'facepalm', fr:'La main sur le visage', en:'Facepalm', g:'gest', y:0, j:{ head:[18, 0, 0], armR:[77, 20, 34], foreR:[109, 25], handR:[0, 0] } },
  { id:'pray', fr:'Mains jointes', en:'Hands together', g:'gest', y:0, j:{ head:[16, 0, 0], armL:[7, 9, 16], foreL:[100, -80], handL:[70, 0], armR:[7, 9, -16], foreR:[100, 80], handR:[70, 0] } },
  { id:'carry', fr:'Porter un carton', en:'Carrying a box', g:'gest', y:0, j:{ spine:[-6,  0,  0], armL:[0,  22,  6], foreL:[81,  -30], handL:[0,  0], armR:[0,  22,  -6], foreR:[81,  30], handR:[0,  0] } },
  { id:'stop', fr:'Faire signe de s’arrêter', en:'Signalling stop', g:'gest', y:0, j:{ armR:[73,  -15,  -19], foreR:[45,  22], handR:[0,  0] } },
  { id:'scared', fr:'Avoir peur', en:'Scared', g:'gest', y:0.03, j:{ spine:[-10,  0,  0], head:[-6,  0,  0], thighR:[-6,  0,  0], shinL:[10], armL:[33,  -9,  0], foreL:[114,  -7], handL:[0,  0], armR:[26,  3,  15], foreR:[112,  0], handR:[0,  0] } },
];
function applyPose(ch, pid){
  const P = POSES.find(p => p.id === pid); if(!P) return;
  ch.j = blankPose(); ch.pose = pid;
  // l'accessoire va avec la pose (le pistolet pour viser, le téléphone pour appeler), sinon on garde celui qu'on a choisi
  ch.prop = P.prop || (pid === 'phone' || pid === 'readPhone' ? 'phone' : ch.propUser ? ch.prop : null);
  for(const k in P.j) ch.j[k] = P.j[k].slice();
  ch.root.y = (P.y || 0) * bodyScale(lookOf(ch));    // un enfant plus petit descend moins pour s'asseoir
  retargetHands(ch, P);
  if(!SEATED[pid] && !NO_GROUND[pid]) groundChar(ch);
}
/* le corps touche le sol (ou le matelas) : son point le plus bas est posé à 0, quelle que soit la silhouette
   (allongée, une femme ou un aîné s'enfonçait de quelques centimètres ; un homme flottait un peu) */
const NO_GROUND = { jump:1, ride:1, rideBack:1, pilot:1, drive:1 };
const _lowPts = new Map();
function lowPts(lk){
  let m = _lowPts.get(lk.id); if(m) return m;
  m = {}; JOINTS.forEach(J => { const p = partGeo(J.id, lk, true).p, a = []; for(let i = 0; i < p.length; i += 3) a.push([p[i], p[i + 1], p[i + 2]]); m[J.id] = a; });
  _lowPts.set(lk.id, m); return m;
}
function groundChar(ch){
  const M = charMatrices(ch), pts = lowPts(lookOf(ch)); let lo = 1e9;
  for(const id in pts){ const m = M[id]; if(!m) continue; for(const q of pts[id]){ const y = m[1] * q[0] + m[5] * q[1] + m[9] * q[2] + m[13]; if(y < lo) lo = y; } }
  if(lo < 1e8 && Math.abs(lo) < 0.4) ch.root.y -= lo;
}
/* ---------- Les mains à leur place, pour toutes les silhouettes ----------
   Les poses sont réglées sur l'homme adulte. Une femme a les épaules plus étroites, un enfant une plus
   grosse tête et des bras plus courts, un aîné le dos voûté : sans rien faire, le téléphone n'arrive plus
   à l'oreille et la main qui réfléchit tombe sur le nez. On note donc, sur l'homme adulte, où chaque main
   touche le corps (la tête, la poitrine, les hanches ou l'autre main), et on replie les bras de chaque
   silhouette pour que ses mains retrouvent ce même endroit sur son propre corps. */
const GRIP_PT = [0, -0.075, 0.012];
const _touch = new Map();
function touchRef(P){
  if(_touch.has(P.id)) return _touch.get(P.id);
  const ch = newChar(0, { x:0, z:0, ry:0 }, 0); ch.j = blankPose(); for(const k in P.j) ch.j[k] = P.j[k].slice(); ch.root.y = P.y || 0; ch.pose = P.id;
  const M = charMatrices(ch), loc = (m, p) => M4.apply(M4.invert(m), p), out = [];
  const g = { L:M4.apply(M.handL, GRIP_PT), R:M4.apply(M.handR, GRIP_PT) }, hc = M4.apply(M.head, [0, 0.12, 0.02]);
  ['R', 'L'].forEach(s => {
    const p = g[s], o = g[s === 'R' ? 'L' : 'R'], c = loc(M.chest, p), v = loc(M.pelvis, p);
    let a = null;
    if(Math.hypot(p[0] - hc[0], p[1] - hc[1], p[2] - hc[2]) < 0.27 && p[1] > hc[1] - 0.24) a = 'head';
    else if(P.prop && s === 'L' && Math.hypot(p[0] - o[0], p[1] - o[1], p[2] - o[2]) < 0.5) a = 'handR';   // la main qui tient le fusil ou soutient le pistolet
    else if(Math.abs(c[0]) < 0.3 && c[1] > -0.1 && c[1] < 0.45 && c[2] > -0.2 && c[2] < 0.45) a = 'chest';
    else if(Math.abs(v[0]) < 0.22 && v[1] > -0.2 && v[1] < 0.15 && Math.abs(v[2]) < 0.2) a = 'pelvis';
    if(a) out.push({ s, a, p:loc(M[a], p) });
  });
  _touch.set(P.id, out);
  return out;
}
function retargetHands(ch, P){
  const lk = lookOf(ch); if(lk.body !== 'f' && !lk.age) return;   // l'homme adulte : la pose est faite pour lui
  const T = touchRef(P); if(!T.length) return;
  const sides = T.map(t => t.s), free = [];
  sides.forEach(s => free.push(['arm' + s, [0, 1, 2]], ['fore' + s, [0, 1]], ['hand' + s, [0, 1]]));
  const orig = {}; free.forEach(([id]) => orig[id] = ch.j[id].slice());
  const err = () => {
    const M = charMatrices(ch); let e = 0;
    for(const t of T){ const q = M4.apply(M['hand' + t.s], GRIP_PT), w = M4.apply(M[t.a], t.p); e += (q[0] - w[0]) ** 2 + (q[1] - w[1]) ** 2 + (q[2] - w[2]) ** 2; }
    for(const [id] of free) e += 0.000002 * ch.j[id].reduce((a, v, i) => a + (v - orig[id][i]) ** 2, 0);
    return e;
  };
  let best = err(), step = 12;
  if(best < 0.00015) return;   // déjà en place
  for(let it = 0; it < 400 && step > 0.4; it++){
    let better = false;
    for(const [id, ax] of free){ const J = JOINT[id];
      for(const i of ax){ const lim = J.ax[i];
        for(const d of [step, -step]){ const old = ch.j[id][i]; ch.j[id][i] = Math.max(lim[2], Math.min(lim[3], old + d));
          const e = err(); if(e < best - 1e-10){ best = e; better = true; } else ch.j[id][i] = old; } } }
    if(!better) step /= 2;
  }
  free.forEach(([id]) => ch.j[id] = ch.j[id].map(v => Math.round(v)));
}
/* assis sur un vrai siège (canapé, banc, voiture) : le bassin reste à la hauteur du siège, quelle que soit la taille */
const SEATED = { sit:1, drive:1, headInHands:1, pilot:1, typing:1, sitCross:1 };
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
  { id:'airfield', fr:'Aérodrome', en:'Airfield', big:true },
  { id:'forest', fr:'Forêt', en:'Forest', big:true },
  { id:'hotel', fr:'Chambre d’hôtel', en:'Hotel room' },
  { id:'parking', fr:'Parking souterrain', en:'Underground car park' },
  { id:'diner', fr:'Diner 50’s', en:'50s diner' },
  { id:'bank', fr:'Banque', en:'Bank' },
  { id:'police', fr:'Commissariat', en:'Police station' },
  { id:'hospital', fr:'Hôpital', en:'Hospital' },
  { id:'metro', fr:'Métro', en:'Subway car' },
  { id:'bar', fr:'Bar', en:'Bar' },
  { id:'school', fr:'Salle de classe', en:'Classroom' },
  { id:'shop', fr:'Supérette', en:'Convenience store' },
  { id:'meeting', fr:'Salle de réunion', en:'Meeting room' },
  { id:'bedroom', fr:'Chambre', en:'Bedroom' },
  { id:'kitchen', fr:'Cuisine', en:'Kitchen' },
  { id:'bath', fr:'Salle de bain', en:'Bathroom' },
  { id:'gas', fr:'Station-service', en:'Gas station' },
  { id:'station', fr:'Quai de gare', en:'Train platform' },
  { id:'photo', fr:'Ma photo', en:'My photo' },
];
const SET_DEF = {
  // « Ma photo » : pas de décor 3D, c'est la photo du vrai lieu qui fait le fond ; les personnages se posent sur un sol invisible
  photo:{
    spawn:[{ x:-0.6, z:0, ry:15 }, { x:0.7, z:0.1, ry:-20 }],
    cam:{ tx:0, ty:1.0, tz:0, yaw:0, pitch:-4, dist:4.2, lens:28 }, bg:'#2A2D33',
    build(g){ tri(g, [-0.01, -50, 0], [0.01, -50, 0], [0, -50, 0.01], [0, 0, 0]); },
  },
  // l'hôpital : une chambre (le lit médicalisé, la perfusion, le moniteur) et son couloir
  hospital:{
    cam:{ tx:-2.0, ty:0.8, tz:-2.2, yaw:33, pitch:-8, dist:6.0, lens:24 },
    roomH:2.8,
    rooms:[['La chambre', 'The room', 0, [-4, -3.5, 2, 3.5]], ['Le couloir', 'The corridor', 0, [2, -3.5, 5, 3.5]]],
    build(g, gl){
      const X0 = -4, X1 = 5, Z0 = -3.5, Z1 = 3.5, H = 2.8, WL = '#DCE6E3', MET = '#B9C0C8';
      floor(g, X0, Z0, X1, Z1, 0, '#BFC8C7'); floor(g, X0, Z0, X1, Z1, H, '#F2F4F3', true);
      for(let x = X0 + 0.6; x < X1; x += 0.6) box(g, x, 0.004, 0, 0.012, 0.004, Z1 - Z0, '#AEB8B7');
      wall(g, [X0, Z0], [X1, Z0], H, WL); wall(g, [X0, Z1], [X0, Z0], H, '#D3DEDB'); wall(g, [X1, Z0], [X1, Z1], H, '#D3DEDB'); wall(g, [X1, Z1], [X0, Z1], H, WL);
      partition(g, [2, Z0], [2, Z1], 0, H, WL, [[1.1, 2.4]]);
      // la plinthe et la main courante du couloir
      [[X0, Z0, X1, Z0], [X1, Z1, X0, Z1]].forEach(([a, b, c, d]) => box(g, (a + c) / 2, 0.06, b + (b < 0 ? 0.02 : -0.02), Math.abs(c - a), 0.12, 0.02, '#8FA7A2'));
      [[-3.4, -2.95], [-1.45, 1.65], [3.15, 3.4]].forEach(([z0, z1]) => box(g, X1 - 0.05, 0.95, (z0 + z1) / 2, 0.05, 0.05, z1 - z0, '#C9CDD3'));   // la main courante s'arrête aux portes
      // ---- la chambre ----
      // la plinthe et la bande de protection à hauteur de lit, tout autour
      [[X0 + 0.012, -3.49, X0 + 0.012, 3.49, 'z'], [-3.99, Z0 + 0.012, 1.99, Z0 + 0.012, 'x'], [-3.99, Z1 - 0.012, 1.99, Z1 - 0.012, 'x']].forEach(([a, b, c, d, ax]) => {
        if(ax === 'z'){ box(g, a, 0.06, (b + d) / 2, 0.02, 0.12, d - b, '#8FA7A2'); box(g, a, 0.92, (b + d) / 2, 0.02, 0.1, d - b, '#C7D6D2'); }
        else { box(g, (a + c) / 2, 0.06, b, c - a, 0.12, 0.02, '#8FA7A2'); box(g, (a + c) / 2, 0.92, b, c - a, 0.1, 0.02, '#C7D6D2'); } });
      // le lit médicalisé, la tête contre le mur du fond : un vrai châssis sur roulettes, le matelas,
      // la couverture repliée, l'oreiller, la tête et le pied de lit, une barrière relevée
      const bx = -2.0, bz = -2.4, BL = 1.95, BW = 0.88, MT = 0.62, PAN = '#E7EAEC';
      box(g, bx, 0.34, bz, BW, 0.08, BL, MET);                                                          // le châssis
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => { const x = bx + sx * (BW / 2 - 0.08), z = bz + sz * (BL / 2 - 0.1);
        box(g, x, 0.2, z, 0.05, 0.22, 0.05, MET); box(g, x, 0.085, z, 0.035, 0.03, 0.08, '#5A6068'); cyl(g, x - 0.02, 0.055, z, 0.05, 0.05, 0.04, '#2C2E33', 10, 'x'); });
      box(g, bx, 0.43, bz, BW - 0.04, 0.1, BL - 0.04, '#C9CFD4');                                       // le sommier
      box(g, bx, MT - 0.08, bz, BW, 0.16, BL, '#F4F6F6');                                              // le matelas (dessus à 0,62)
      box(g, bx, MT - 0.02, bz + 0.33, BW + 0.04, 0.08, 1.3, '#9FC3D6');                                // la couverture (sur les jambes)
      box(g, bx, MT + 0.025, bz - 0.29, BW + 0.05, 0.03, 0.14, '#F7F8F8');                              // le drap replié par-dessus
      ball(g, bx, MT + 0.06, bz - 0.68, 0.32, 0.065, 0.16, '#FFFFFF', 10);                              // l'oreiller
      box(g, bx, 0.78, bz - BL / 2 - 0.035, BW + 0.08, 0.72, 0.05, PAN); cyl(g, bx - BW / 2 - 0.04, 1.14, bz - BL / 2 - 0.035, 0.035, 0.035, BW + 0.08, '#B9C0C8', 10, 'x');   // la tête de lit
      box(g, bx, 0.62, bz + BL / 2 + 0.035, BW + 0.08, 0.48, 0.05, PAN); cyl(g, bx - BW / 2 - 0.04, 0.86, bz + BL / 2 + 0.035, 0.03, 0.03, BW + 0.08, '#B9C0C8', 10, 'x');   // le pied de lit
      box(g, bx + 0.12, 0.66, bz + BL / 2 + 0.065, 0.26, 0.32, 0.015, '#3D5A80'); box(g, bx + 0.12, 0.66, bz + BL / 2 + 0.074, 0.22, 0.27, 0.005, '#F4F2EE');   // la fiche du patient
      // la barrière relevée, côté fenêtre : deux tubes portés par deux montants fixés au châssis
      [MT + 0.13, MT + 0.26].forEach(y => cyl(g, bx - BW / 2 - 0.03, y, bz - 0.85, 0.016, 0.016, 1.0, '#B9C0C8', 8, 'z'));
      [-0.8, 0.1].forEach(dz => box(g, bx - BW / 2 - 0.03, 0.62, bz + dz, 0.03, 0.56, 0.03, '#B9C0C8'));
      // le panneau de tête au mur (prises, oxygène, lampe de lecture)
      box(g, bx, 1.45, Z0 + 0.04, 1.6, 0.24, 0.06, '#E3E8E6'); box(g, bx, 1.45, Z0 + 0.075, 1.56, 0.03, 0.01, '#8FB5AD');
      [-0.55, -0.4, 0.4, 0.55].forEach(dx => box(g, bx + dx, 1.4, Z0 + 0.075, 0.07, 0.07, 0.01, '#F4F6F6'));
      cyl(g, bx + 0.2, 1.42, Z0 + 0.12, 0.025, 0.025, 0.1, '#2F6E4F', 8); box(g, bx + 0.2, 1.42, Z0 + 0.09, 0.03, 0.03, 0.04, '#C9CDD3');
      box(g, bx - 0.55, 1.7, Z0 + 0.12, 0.03, 0.03, 0.2, '#B9C0C8'); cyl(g, bx - 0.55, 1.72, Z0 + 0.26, 0.04, 0.08, 0.1, '#F2E6C9', 10);
      // la perfusion : pied à roulettes, mât, crochet, poche
      [0, Math.PI / 2].forEach(a => box(g, -1.35, 0.03, -3.0, 0.5 * Math.abs(Math.cos(a)) + 0.04, 0.03, 0.5 * Math.abs(Math.sin(a)) + 0.04, '#7E858C'));
      [[0.24, 0], [-0.24, 0], [0, 0.24], [0, -0.24]].forEach(([dx, dz]) => ball(g, -1.35 + dx, 0.025, -3.0 + dz, 0.025, 0.025, 0.025, '#2C2E33', 6));
      cyl(g, -1.35, 1.9, -3.0, 0.014, 0.014, 1.88, MET, 6); box(g, -1.35, 1.89, -3.0, 0.22, 0.015, 0.015, MET);
      box(g, -1.27, 1.74, -3.0, 0.11, 0.2, 0.04, '#CFE6F0'); box(g, -1.27, 1.86, -3.0, 0.015, 0.04, 0.015, MET);
      // le moniteur sur son pied roulant, de l'autre côté
      box(g, -3.05, 0.03, -2.9, 0.42, 0.03, 0.42, '#7E858C'); cyl(g, -3.05, 1.12, -2.9, 0.02, 0.02, 1.09, MET, 6);   // le pied monte jusqu'à l'écran
      box(g, -3.05, 1.25, -2.9, 0.36, 0.28, 0.08, '#2C2E33'); box(g, -3.05, 1.25, -2.855, 0.3, 0.22, 0.005, '#16302A');
      box(g, -3.05, 1.27, -2.85, 0.26, 0.012, 0.004, '#4ED38A'); box(g, -3.0, 1.2, -2.85, 0.12, 0.01, 0.004, '#E8B923');
      // la table de chevet (tiroir, poignée, gobelet et fleurs), la table à manger qui passe au-dessus du lit
      box(g, -3.25, 0.37, -1.75, 0.46, 0.74, 0.44, '#E6E8E8'); box(g, -3.25, 0.6, -1.525, 0.4, 0.005, 0.005, '#AEB8B7'); box(g, -3.25, 0.66, -1.52, 0.12, 0.02, 0.02, '#8FA7A2');
      cyl(g, -3.35, 0.83, -1.8, 0.035, 0.03, 0.09, '#F4F6F6', 8); cyl(g, -3.13, 0.88, -1.75, 0.045, 0.035, 0.14, '#9FC3D6', 8);
      [[-0.03, 0.91, 0], [0.03, 0.93, 0.02], [0, 0.94, -0.03]].forEach(([dx, y, dz]) => ball(g, -3.13 + dx, y, -1.75 + dz, 0.035, 0.03, 0.035, '#D9707A', 6));
      box(g, -1.2, 0.02, -1.2, 0.5, 0.03, 0.4, '#7E858C'); box(g, -1.2, 0.45, -1.2, 0.04, 0.86, 0.04, MET); box(g, -1.32, 0.9, -1.2, 0.6, 0.03, 0.4, '#C9B48F');   // garée à côté du lit
      // le fauteuil du visiteur, tourné vers le lit
      box(g, -0.75, 0.42, -2.2, 0.55, 0.12, 0.55, '#4E8C83'); box(g, -0.5, 0.78, -2.2, 0.08, 0.62, 0.55, '#4E8C83');
      [-1, 1].forEach(sd => { box(g, -0.75, 0.6, -2.2 + sd * 0.3, 0.55, 0.05, 0.06, '#3E7068'); box(g, -0.75, 0.18, -2.2 + sd * 0.25, 0.5, 0.36, 0.04, MET); });
      // la fenêtre (encadrement, appui, store), sur le mur de gauche
      pane(g, [X0 + 0.015, 1.1], [X0 + 0.015, -0.9], 1.3, '#A9C6D6', 0.95);
      [[1.12, 0.95, 1.3, 0.04], [-0.92, 0.95, 1.3, 0.04]].forEach(([z, y, h, w]) => box(g, X0 + 0.03, y + h / 2, z, 0.06, h + 0.08, w, '#F4F6F6'));
      box(g, X0 + 0.03, 2.27, 0.1, 0.06, 0.04, 2.08, '#F4F6F6'); box(g, X0 + 0.08, 0.93, 0.1, 0.16, 0.04, 2.1, '#F4F6F6');
      for(let y = 1.42; y < 2.2; y += 0.1) box(g, X0 + 0.06, y, 0.1, 0.015, 0.03, 1.96, '#EEF0F0');
      box(g, X0 + 0.06, 2.21, 0.1, 0.04, 0.04, 2.0, '#D9DEE3');
      // le rideau de séparation : son rail est collé au plafond, le rideau est replié contre le mur, en plis
      box(g, -0.62, 2.785, -2.25, 0.04, 0.03, 2.4, '#C9CDD3');
      for(let k = 0; k < 6; k++) box(g, -0.62 + (k % 2 ? 0.03 : -0.03), 1.505, -3.36 + k * 0.07, 0.035, 2.53, 0.075, k % 2 ? '#A9C9CE' : '#B7D6DA');   // accroché au rail
      // le lavabo et son meuble, le miroir, le distributeur de savon, près de l'entrée
      box(g, 1.2, 0.42, Z1 - 0.25, 0.7, 0.84, 0.46, '#E6E8E8'); box(g, 1.2, 0.86, Z1 - 0.25, 0.74, 0.04, 0.5, '#F4F6F6');
      box(g, 1.2, 0.85, Z1 - 0.25, 0.46, 0.03, 0.3, '#D9DEE3'); box(g, 1.2, 0.95, Z1 - 0.43, 0.03, 0.16, 0.03, '#C9CDD3'); box(g, 1.2, 1.02, Z1 - 0.39, 0.03, 0.03, 0.1, '#C9CDD3');
      wall(g, [1.5, Z1 - 0.015], [0.9, Z1 - 0.015], 0.6, '#B9D3E1', 1.15); box(g, 0.75, 1.2, Z1 - 0.04, 0.1, 0.18, 0.06, '#F4F6F6');
      // la télé sur son bras, face au lit ; l'horloge ; le distributeur de gel ; les dalles lumineuses
      box(g, -2.0, 1.95, Z1 - 0.05, 0.1, 0.1, 0.1, '#7E858C'); box(g, -2.0, 1.95, Z1 - 0.13, 0.85, 0.5, 0.05, '#1E1F23'); box(g, -2.0, 1.95, Z1 - 0.158, 0.79, 0.44, 0.005, '#2E3846');
      cyl(g, 0.6, 2.35, Z0 + 0.002, 0.15, 0.15, 0.03, '#F4F6F6', 16, 'z'); cyl(g, 0.6, 2.35, Z0 + 0.032, 0.125, 0.125, 0.003, '#2C2E33', 16, 'z');   // l'horloge, contre le mur
      box(g, 1.95, 1.3, -0.7, 0.06, 0.2, 0.1, '#F4F6F6');
      [[-2.0, -2.4], [-2.0, 0.6], [0.2, -1.0], [0.2, 2.0]].forEach(([x, z]) => box(g, x, 2.78, z, 1.0, 0.03, 0.5, '#FFFFFF'));
      // le couloir : les portes, le fauteuil roulant, les sièges d'attente, le panneau
      [-2.2, 2.4].forEach(z => doorX(g, X1, z, 1.1, 2.1, '#8FB5AD', -1));
      // l'encadrement de l'entrée de la chambre
      [-2.43, -1.07].forEach(z => box(g, 2, 1.05, z, 0.14, 2.1, 0.06, '#E9ECEE')); box(g, 2, 2.13, -1.75, 0.14, 0.06, 1.42, '#E9ECEE');
      box(g, 3.4, 0.5, 2.6, 0.5, 0.06, 0.5, '#2C2E33'); box(g, 3.4, 0.8, 2.83, 0.5, 0.5, 0.04, '#2C2E33');
      [-1, 1].forEach(sd => { cyl(g, 3.4 + sd * 0.28, 0.32, 2.65, 0.3, 0.3, 0.03, '#3A3D44', 14, 'x'); cyl(g, 3.4 + sd * 0.22 - 0.015, 0.08, 2.4, 0.07, 0.07, 0.03, '#3A3D44', 8, 'x'); box(g, 3.4 + sd * 0.22, 0.3, 2.4, 0.03, 0.36, 0.03, '#7E858C'); });   // les petites roues, sur leur fourche
      [0.6, 1.15, 1.7].forEach(z => { box(g, 2.35, 0.45, z, 0.45, 0.06, 0.45, '#5E8FA8'); box(g, 2.15, 0.72, z, 0.05, 0.5, 0.45, '#5E8FA8'); box(g, 2.35, 0.22, z, 0.04, 0.44, 0.04, MET); });
      box(g, 3.5, 2.45, Z0 + 0.02, 1.3, 0.3, 0.04, '#2F6E8F'); pixText(g, 'HOPITAL', 3.5, 2.45, Z0 + 0.045, 1, 0.026, '#F4F6F6');
      [-1.5, 1.5].forEach(z => box(g, 3.5, 2.77, z, 0.4, 0.04, 1.2, '#FFFFFF'));
    },
  },
  // le métro : l'intérieur d'une rame (les banquettes, les barres, les portes, les fenêtres sur le tunnel)
  metro:{
    cam:{ tx:0, ty:1.1, tz:0.5, yaw:180, pitch:-5, dist:4.2, lens:24 },
    roomH:2.3,
    rooms:[['La rame', 'The car', 0, [-1.4, -7, 1.4, 7]]],
    build(g, gl){
      const X0 = -1.4, X1 = 1.4, Z0 = -7, Z1 = 7, H = 2.3, BAR = '#E0B33A';
      floor(g, X0, Z0, X1, Z1, 0, '#4A4E55'); for(let z = Z0 + 0.5; z < Z1; z += 0.5) box(g, 0, 0.004, z, 2.6, 0.004, 0.015, '#3E4248');
      floor(g, X0, Z0, X1, Z1, H, '#E9ECEE', true);
      wall(g, [X0, Z0], [X1, Z0], H, '#B9C1C8'); wall(g, [X1, Z1], [X0, Z1], H, '#B9C1C8');
      [-1, 1].forEach(sd => {
        const x = sd > 0 ? X1 : X0, A = (z0, z1) => sd > 0 ? [[x, z0], [x, z1]] : [[x, z1], [x, z0]];
        const W = (z0, z1, h, col, y) => { const [a, b] = A(z0, z1); wall(g, a, b, h, col, y); };
        // la paroi, morceau par morceau (rien ne se superpose : plus de scintillement), avec les fenêtres sur le noir du tunnel
        [[Z0, -3.9], [-2.1, 2.1], [3.9, Z1]].forEach(([z0, z1]) => { W(z0, z1, 0.85, '#C9CED3'); W(z0, z1, 0.45, '#C9CED3', 1.85);
          const w0 = Math.max(z0, -6.8), w1 = Math.min(z1, 6.8); W(w0, w1, 1.0, '#1A1E25', 0.85); if(w0 > z0) W(z0, w0, 1.0, '#C9CED3', 0.85); if(w1 < z1) W(w1, z1, 1.0, '#C9CED3', 0.85);
          for(let z = w0; z <= w1 + 0.01; z += (w1 - w0) / 2) box(g, x - sd * 0.02, 1.35, z, 0.04, 1.0, 0.05, '#9AA3AB'); });
        // les portes, un peu en retrait de la paroi, avec leurs vitres et leur joint
        [-3, 3].forEach(z => { W(z - 0.9, z + 0.9, 0.35, '#C9CED3', 1.95);
          const D = (z0, z1, h, col, y, k) => { const xx = x - sd * k, [a, b] = sd > 0 ? [[xx, z0], [xx, z1]] : [[xx, z1], [xx, z0]]; wall(g, a, b, h, col, y); };
          D(z - 0.9, z + 0.9, 1.95, '#8E979F', 0, 0.015); D(z - 0.75, z - 0.06, 1.0, '#2A3038', 0.75, 0.03); D(z + 0.06, z + 0.75, 1.0, '#2A3038', 0.75, 0.03);
          box(g, x - sd * 0.035, 0.98, z, 0.02, 1.95, 0.03, '#2C2E33'); box(g, x - sd * 0.03, 1.97, z, 0.06, 0.05, 1.9, '#7E868E');
          [-0.92, 0.92].forEach(dz => box(g, x - sd * 0.02, 0.99, z + dz, 0.06, 1.98, 0.05, '#7E868E')); });   // les montants de l'encadrement
        // les banquettes, dos aux fenêtres
        [[-6.7, -4.0], [-2.0, 2.0], [4.0, 6.7]].forEach(([z0, z1]) => { const z = (z0 + z1) / 2, L_ = z1 - z0;
          box(g, x - sd * 0.25, 0.4, z, 0.48, 0.12, L_, '#2E5A8C'); box(g, x - sd * 0.06, 0.75, z, 0.1, 0.6, L_, '#2E5A8C'); box(g, x - sd * 0.25, 0.18, z, 0.42, 0.34, L_, '#3E4248');
          for(let k = z0 + 0.5; k < z1; k += 0.5) box(g, x - sd * 0.25, 0.47, k, 0.47, 0.02, 0.02, '#244A74'); });
        // le plan de la ligne, au-dessus des fenêtres
        box(g, x - sd * 0.01, 1.95, 0, 0.01, 0.16, 3.6, '#F4F2EE'); box(g, x - sd * 0.015, 1.95, 0, 0.01, 0.025, 3.4, '#B4232C');
        for(let z = -1.6; z <= 1.6; z += 0.4) ball(g, x - sd * 0.02, 1.95, z, 0.02, 0.035, 0.035, '#F4F2EE', 6);
      });
      // les barres : debout au milieu et le long du plafond
      [-4.8, -1.2, 1.2, 4.8].forEach(z => cyl(g, 0, H, z, 0.025, 0.025, H, BAR, 8));
      [-0.7, 0.7].forEach(x => { cyl(g, x, 1.95, Z0, 0.02, 0.02, Z1 - Z0, BAR, 8, 'z'); for(let z = -6.5; z <= 6.5; z += 1.3) { cyl(g, x, 1.95, z, 0.008, 0.008, 0.18, '#2C2E33', 4); cyl(g, x, 1.79, z, 0.045, 0.045, 0.012, '#2C2E33', 8, 'z'); cyl(g, x, 1.79, z + 0.002, 0.03, 0.03, 0.014, '#E9ECEE', 8, 'z'); } });
      // les néons du plafond, les portes du bout de la rame
      for(let z = -6.5; z <= 6.5; z += 1.0) [-0.45, 0.45].forEach(x => box(g, x, H - 0.03, z, 0.14, 0.04, 0.55, '#F7F3DC'));
      [Z0, Z1].forEach(z => { const sd = z < 0 ? 1 : -1; box(g, 0, 1.0, z + sd * 0.02, 0.9, 2.0, 0.03, '#8E979F'); box(g, 0, 1.4, z + sd * 0.04, 0.5, 0.6, 0.02, '#1A1E25'); });
    },
  },
  // le bar : le long comptoir et ses tabourets, les bouteilles, l'enseigne au néon, le billard, les box
  bar:{
    cam:{ tx:0.5, ty:1.1, tz:0.6, yaw:-160, pitch:-8, dist:5.2, lens:24 },
    roomH:3.2,
    rooms:[['Le bar', 'The bar', 0, [-6, -5, 6, 5]]],
    build(g, gl){
      const X0 = -6, X1 = 6, Z0 = -5, Z1 = 5, H = 3.2, WOOD = '#5A3A26', DK = '#2E1F17';
      floor(g, X0, Z0, X1, Z1, 0, '#5E4232'); for(let x = X0 + 0.3; x < X1; x += 0.3) box(g, x, 0.004, 0, 0.012, 0.004, Z1 - Z0, '#4E3628');
      floor(g, X0, Z0, X1, Z1, H, '#2A2422', true);
      wall(g, [X0, Z0], [X1, Z0], H, '#6E3A2E'); wall(g, [X0, Z1], [X0, Z0], H, '#4A3A34'); wall(g, [X1, Z0], [X1, Z1], H, '#4A3A34'); wall(g, [X1, Z1], [X0, Z1], H, '#3E302B');
      for(let y = 0.15; y < H; y += 0.3) for(let x = X0 + (Math.round(y / 0.3) % 2) * 0.3; x < X1; x += 0.6) box(g, x, y, Z0 + 0.012, 0.56, 0.26, 0.01, '#7A4234');   // les briques
      // le comptoir et son repose-pieds, les tabourets
      box(g, -0.5, 0.55, 2.9, 7.0, 1.1, 0.7, WOOD); box(g, -0.5, 1.12, 2.85, 7.2, 0.06, 0.9, DK); box(g, -0.5, 0.18, 2.5, 7.0, 0.04, 0.04, '#C9A64B'); [-3.6, -1.8, 0, 1.8, 2.6].forEach(x => box(g, x, 0.18, 2.53, 0.03, 0.03, 0.06, '#C9A64B'));   // la barre repose-pieds et ses supports
      for(let x = -3.6; x <= 2.6; x += 0.8){ cyl(g, x, 0.76, 2.15, 0.19, 0.19, 0.07, '#8C1F2A', 12); cyl(g, x, 0.7, 2.15, 0.03, 0.03, 0.7, '#2C2E33', 6); cyl(g, x, 0.03, 2.15, 0.16, 0.16, 0.03, '#2C2E33', 10); }
      // derrière le comptoir : les étagères de bouteilles, le miroir, la tireuse, le néon BAR
      box(g, -0.5, 1.6, 4.85, 7.0, 0.04, 0.3, DK); box(g, -0.5, 2.05, 4.85, 7.0, 0.04, 0.3, DK); box(g, -0.5, 1.1, 4.8, 7.0, 0.9, 0.35, WOOD);
      wall(g, [3.0, Z1 - 0.01], [-4.0, Z1 - 0.01], 0.9, '#6F7F88', 1.65);
      const BC = ['#2F6E4F', '#8C5A2A', '#C9A64B', '#7A2E3A', '#3D5A80', '#E3E6EA'];
      for(let x = -3.8; x <= 2.8; x += 0.22) [1.62, 2.07].forEach((y, k) => { const c = BC[((Math.round(x * 7 + k * 3) % BC.length) + BC.length) % BC.length]; cyl(g, x, y + 0.24, 4.85, 0.035, 0.035, 0.22, c, 6); cyl(g, x, y + 0.32, 4.85, 0.012, 0.012, 0.08, c, 4); });
      [-1.0, -0.6, -0.2].forEach(x => { cyl(g, x, 1.42, 3.05, 0.025, 0.025, 0.27, '#C9CDD3', 6); box(g, x, 1.38, 2.98, 0.03, 0.03, 0.12, '#C9CDD3'); box(g, x, 1.48, 3.05, 0.035, 0.12, 0.035, '#2C2E33'); });   // les tireuses, côté barman
      box(g, -0.5, 2.75, Z1 - 0.05, 1.5, 0.45, 0.04, '#141414'); pixText(g, 'BAR', -0.5, 2.75, Z1 - 0.075, -1, 0.06, '#FF3D5A');
      // le billard et les queues au mur
      box(g, -3.6, 0.73, -2.4, 1.6, 0.12, 2.7, WOOD); box(g, -3.6, 0.8, -2.4, 1.36, 0.02, 2.46, '#2F7A4A');
      [[-0.65, -1.2], [0.65, -1.2], [-0.65, 1.2], [0.65, 1.2]].forEach(([x, z]) => box(g, -3.6 + x, 0.33, -2.4 + z, 0.14, 0.66, 0.14, DK));
      [[-3.4, -2.1, '#E8B923'], [-3.8, -2.6, '#B4232C'], [-3.5, -2.9, '#F4F2EE'], [-3.9, -2.0, '#3D5A80']].forEach(([x, z, c]) => ball(g, x, 0.84, z, 0.03, 0.03, 0.03, c, 6));
      cyl(g, -3.6, H, -2.4, 0.01, 0.01, 0.9, '#2C2E33', 4); box(g, -3.6, 2.25, -2.4, 0.3, 0.12, 1.2, '#2F6E4F'); box(g, -3.6, 2.18, -2.4, 0.24, 0.02, 1.1, '#F2D98A');
      for(let z = -3.6; z <= -1.8; z += 0.2) box(g, X0 + 0.03, 1.1, z, 0.03, 1.4, 0.025, '#B08A5A');
      // les box le long du mur, leurs tables et leurs lampes
      [-3.6, -0.8].forEach(x => { [-1, 1].forEach(sd => { box(g, x + sd * 0.75, 0.25, -4.25, 0.5, 0.5, 1.3, '#7A1E2A'); box(g, x + sd * 0.95, 0.8, -4.25, 0.12, 0.7, 1.3, '#7A1E2A'); });
        box(g, x, 0.74, -4.3, 0.8, 0.05, 1.1, DK); box(g, x, 0.36, -4.3, 0.12, 0.72, 0.12, DK);
        cyl(g, x, H, -4.3, 0.008, 0.008, 1.3, '#2C2E33', 4); cyl(g, x, 1.95, -4.3, 0.06, 0.2, 0.18, '#C9A64B', 10); ball(g, x, 1.75, -4.3, 0.05, 0.04, 0.05, '#F7E3A0', 6); });
      // les petites tables rondes, la porte, le juke-box
      [[2.0, -1.5], [3.8, -0.2], [2.4, 0.9]].forEach(([x, z]) => { cyl(g, x, 0.74, z, 0.38, 0.38, 0.04, DK, 14); cyl(g, x, 0.7, z, 0.04, 0.04, 0.68, '#2C2E33', 6); cyl(g, x, 0.03, z, 0.25, 0.25, 0.03, '#2C2E33', 10);
        [[0.55, 0], [-0.55, 0]].forEach(([dx, dz]) => { box(g, x + dx, 0.45, z + dz, 0.4, 0.05, 0.4, '#3A2A20'); box(g, x + dx * 1.35, 0.72, z + dz, 0.04, 0.5, 0.4, '#3A2A20'); box(g, x + dx, 0.22, z + dz, 0.04, 0.44, 0.04, '#2C2E33'); }); });
      doorX(g, X1, -3.7, 1.1, 2.2, '#3A2416', -1, '#2E1F17'); box(g, X1 - 0.02, 1.6, -3.7, 0.01, 0.45, 0.4, '#C9B48F');   // la porte d'entrée et sa vitre
      box(g, X1 - 0.03, 2.45, -3.7, 0.04, 0.16, 0.6, '#1E5A3A'); pixText(g, 'SORTIE', -3.7, 2.45, X1 - 0.055, -1, 0.018, '#7EE0A0', true);
      box(g, 5.6, 0.75, 2.5, 0.6, 1.5, 0.55, '#8C1F2A'); box(g, 5.285, 1.2, 2.5, 0.02, 0.45, 0.4, '#F2D98A'); cyl(g, 5.6, 1.5, 2.5, 0.3, 0.3, 0.01, '#C9A64B', 12, 'x');
      [-4.2, -1.4, 1.4, 4.2].forEach(x => { cyl(g, x, H, 0.4, 0.008, 0.008, 0.9, '#2C2E33', 4); cyl(g, x, 2.3, 0.4, 0.05, 0.16, 0.14, '#C9A64B', 10); ball(g, x, 2.14, 0.4, 0.045, 0.04, 0.045, '#F7E3A0', 6); });
    },
  },
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
      wall(g, [-1.2, -3.985], [2.4, -3.985], 0.12, '#7A7F88', 2.49);
      // établi, panneau à outils, étagère, bidons, pneus
      box(g, -3.35, 0.9, -1.2, 1.1, 0.07, 2.6, '#8A6A4A'); box(g, -3.35, 0.45, -2.3, 1.0, 0.9, 0.06, '#6E5440'); box(g, -3.35, 0.45, -0.0, 1.0, 0.9, 0.06, '#6E5440'); box(g, -3.35, 0.25, -1.2, 1.0, 0.05, 2.5, '#6E5440');
      wall(g, [-3.99, -0.1], [-3.99, -2.3], 1.0, '#C9B48F', 1.25);
      [[-1.9, 2.0], [-1.5, 1.85], [-1.0, 2.05], [-0.6, 1.9]].forEach(([z, y]) => box(g, -3.97, y, z, 0.03, 0.32, 0.06, '#5E636C'));   // les outils, accrochés au panneau
      box(g, 3.65, 1.0, 1.6, 0.6, 0.05, 1.8, '#7E838B'); box(g, 3.65, 1.7, 1.6, 0.6, 0.05, 1.8, '#7E838B'); box(g, 3.65, 0.3, 1.6, 0.6, 0.05, 1.8, '#7E838B');
      [0.75, 2.45].forEach(z => box(g, 3.65, 1.0, z, 0.62, 2.0, 0.05, '#6A6F77'));
      box(g, 3.65, 1.175, 1.2, 0.4, 0.3, 0.4, '#B08A5A'); box(g, 3.65, 1.9, 2.0, 0.45, 0.35, 0.5, '#B08A5A');
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
      pane(g, [-2.1, -3.485], [0.1, -3.485], 1.4, '#A9C9DE', 0.9);
      wall(g, [-2.15, -3.475], [0.15, -3.475], 0.06, '#F4F2EE', 0.85); wall(g, [-2.15, -3.475], [0.15, -3.475], 0.06, '#F4F2EE', 2.29);
      [-2.12, -1.0, 0.12].forEach(x => wall(g, [x - 0.03, -3.475], [x + 0.03, -3.475], 1.5, '#F4F2EE', 0.85)); wall(g, [-2.15, -3.475], [0.15, -3.475], 0.04, '#F4F2EE', 1.58);
      // bureau, écran, clavier, chaise
      box(g, -0.2, 0.74, -1.35, 1.7, 0.05, 0.8, '#7A5C42');
      [[-0.97, -1.7], [0.57, -1.7], [-0.97, -1.0], [0.57, -1.0]].forEach(([x, z]) => box(g, x, 0.36, z, 0.05, 0.72, 0.05, '#5B4532'));
      box(g, -0.2, 1.03, -1.6, 0.56, 0.34, 0.03, '#2C2E33'); box(g, -0.2, 0.83, -1.6, 0.06, 0.14, 0.05, '#2C2E33'); box(g, -0.2, 0.77, -1.55, 0.25, 0.015, 0.18, '#2C2E33');
      box(g, -0.2, 0.775, -1.2, 0.42, 0.02, 0.14, '#3A3D44');
      box(g, -0.2, 0.42, -0.6, 0.48, 0.07, 0.46, '#3A3D44'); box(g, -0.2, 0.78, -0.34, 0.46, 0.62, 0.06, '#3A3D44'); cyl(g, -0.2, 0.39, -0.6, 0.03, 0.03, 0.36, '#2A2C31', 6); box(g, -0.2, 0.035, -0.6, 0.5, 0.03, 0.08, '#2A2C31'); box(g, -0.2, 0.035, -0.6, 0.08, 0.03, 0.5, '#2A2C31');   // le pied de la chaise, posé au sol
      // classeur, bibliothèque, plante
      box(g, 2.1, 0.66, -3.15, 0.5, 1.32, 0.6, '#8C9199'); [0.33, 0.77, 1.15].forEach(y => box(g, 2.1, y, -2.84, 0.18, 0.03, 0.02, '#5E636C'));
      box(g, -3.3, 1.0, 0.8, 0.35, 2.0, 1.6, '#6E5440');
      [0.45, 0.95, 1.45].forEach((y, k) => { for(let i = 0; i < 9; i++) box(g, -3.2, y + 0.14, 0.15 + i * 0.15 + (k % 2) * 0.05, 0.22, 0.28 - (i % 3) * 0.04, 0.1, ['#9B3B33', '#2F6E4F', '#C9B48F', '#3D5A80'][(i + k) % 4]); });
      cyl(g, 2.9, 0.4, 2.8, 0.2, 0.16, 0.4, '#B9876A', 8); ball(g, 2.9, 0.85, 2.8, 0.36, 0.48, 0.36, '#4E7C58', 8);
      // lampe de plafond
      box(g, 0, 2.86, -0.5, 1.2, 0.04, 0.3, '#F7F5F0');
    },
  },
  // la salle de classe : le tableau devant, trois rangs de pupitres doubles, les fenêtres à droite, la porte au fond à gauche
  school:{
    spawn:[{ x:-0.8, z:-2.9, ry:0 }, { x:-0.9, z:-0.35, ry:180, pose:'sit' }],
    cam:{ tx:0, ty:1.1, tz:-0.6, yaw:-150, pitch:-8, dist:5.6, lens:24 },
    build(g){
      const X0 = -4.5, X1 = 4.5, Z0 = -3.5, Z1 = 3.5, H = 3.0, MET = '#4F5560', SILL = '#F4F2EE';
      floor(g, X0, Z0, X1, Z1, 0, '#B9A98F');
      wall(g, [X0, Z0], [X1, Z0], H, '#E9E2D3'); wall(g, [X0, Z1], [X0, Z0], H, '#DED5C4'); wall(g, [X1, Z0], [X1, Z1], H, '#DED5C4'); wall(g, [X1, Z1], [X0, Z1], H, '#E4DBCB');
      floor(g, X0, Z0, X1, Z1, H, '#F1EEE8', true);
      // le soubassement peint, comme dans toutes les écoles
      wall(g, [X0, Z0 + 0.008], [X1, Z0 + 0.008], 1.0, '#9DB3A6'); wall(g, [X0 + 0.008, Z1], [X0 + 0.008, Z0], 1.0, '#9DB3A6'); wall(g, [X1 - 0.008, Z0], [X1 - 0.008, Z1], 0.88, '#9DB3A6'); wall(g, [X1, Z1 - 0.008], [X0, Z1 - 0.008], 1.0, '#9DB3A6');
      // le tableau noir (vert), son cadre, la craie, ce qui est écrit dessus
      wall(g, [-2.25, Z0 + 0.012], [2.25, Z0 + 0.012], 1.34, '#B9A27E', 0.84); wall(g, [-2.15, Z0 + 0.016], [2.15, Z0 + 0.016], 1.14, '#2F4B40', 0.94);
      box(g, 0, 0.93, Z0 + 0.055, 4.3, 0.03, 0.08, '#B9A27E'); box(g, -1.2, 0.955, Z0 + 0.05, 0.08, 0.016, 0.016, '#F2F2EE'); box(g, 0.9, 0.955, Z0 + 0.06, 0.14, 0.03, 0.05, '#8A6A4C');
      pixText(g, 'LECON', -1.05, 1.78, Z0 + 0.022, 1, 0.045, '#E6ECE4');
      [[-1.05, 1.46, 1.5], [-1.2, 1.3, 1.2], [-1.0, 1.14, 1.6]].forEach(([x, y, w]) => box(g, x, y, Z0 + 0.021, w, 0.014, 0.004, '#D6DED4'));
      [[1.1, 1.62, 0.9], [1.25, 1.42, 0.6], [1.1, 1.22, 0.9]].forEach(([x, y, w]) => box(g, x, y, Z0 + 0.021, w, 0.014, 0.004, '#D6DED4')); box(g, 0.66, 1.42, Z0 + 0.021, 0.014, 0.4, 0.004, '#D6DED4');
      // l'horloge, au-dessus du tableau
      cyl(g, 0, 2.5, Z0 + 0.002, 0.17, 0.17, 0.03, '#2C2E33', 16, 'z'); cyl(g, 0, 2.5, Z0 + 0.032, 0.148, 0.148, 0.003, '#F4F6F6', 16, 'z');
      box(g, 0, 2.56, Z0 + 0.038, 0.012, 0.12, 0.004, '#2C2E33'); box(g, 0.04, 2.5, Z0 + 0.04, 0.08, 0.012, 0.004, '#2C2E33');
      // le bureau du professeur, sa chaise, ce qu'il y a dessus
      box(g, 1.7, 0.75, -2.4, 1.5, 0.05, 0.7, '#8A6A4C'); box(g, 1.7, 0.4, -2.07, 1.44, 0.6, 0.03, '#7A5C42');
      [[0.98, -2.72], [2.42, -2.72], [0.98, -2.08], [2.42, -2.08]].forEach(([x, z]) => box(g, x, 0.36, z, 0.05, 0.72, 0.05, '#6B5038'));
      box(g, 1.3, 0.81, -2.45, 0.32, 0.07, 0.24, '#8E3B34'); box(g, 1.32, 0.86, -2.47, 0.28, 0.04, 0.2, '#2F5E7E'); ball(g, 2.15, 0.82, -2.3, 0.045, 0.045, 0.045, '#B5352B', 8); cyl(g, 2.3, 0.86, -2.55, 0.045, 0.04, 0.085, '#3A3D44', 8);
      box(g, 1.7, 0.44, -2.95, 0.46, 0.06, 0.44, '#3A3D44'); box(g, 1.7, 0.76, -3.16, 0.44, 0.58, 0.04, '#3A3D44');
      [[1.5, -3.14], [1.9, -3.14], [1.5, -2.76], [1.9, -2.76]].forEach(([x, z]) => box(g, x, 0.205, z, 0.03, 0.41, 0.03, MET));
      cyl(g, 2.75, 0.38, -2.95, 0.15, 0.13, 0.38, '#5E636C', 10);   // la corbeille
      // les pupitres doubles et leurs chaises, tournés vers le tableau
      const SEAT = ['#3D6B8C', '#3D6B8C', '#9B3B33'];
      [-3.0, -0.6, 1.8].forEach((x, cI) => [-0.9, 0.5, 1.9].forEach((z, rI) => {
        box(g, x, 0.71, z, 1.2, 0.04, 0.5, '#C9A87A'); box(g, x, 0.6, z - 0.02, 1.12, 0.02, 0.4, MET);
        [[-0.56, -0.2], [0.56, -0.2], [-0.56, 0.2], [0.56, 0.2]].forEach(([a, b]) => box(g, x + a, 0.345, z + b, 0.035, 0.69, 0.035, MET));
        [-0.3, 0.3].forEach(o => { const cx = x + o, cz = z + 0.55, c = SEAT[(cI + rI) % 3];
          box(g, cx, 0.43, cz, 0.4, 0.035, 0.38, c); box(g, cx, 0.73, cz + 0.2, 0.38, 0.24, 0.025, c);
          [[-0.17, -0.16], [0.17, -0.16], [-0.17, 0.16], [0.17, 0.16]].forEach(([a, b]) => box(g, cx + a, 0.206, cz + b, 0.025, 0.412, 0.025, MET));
          [-0.17, 0.17].forEach(a => box(g, cx + a, 0.6, cz + 0.19, 0.025, 0.34, 0.02, MET)); });
        // cahiers, trousses, et quelques cartables par terre
        if((cI + rI) % 2 === 0) box(g, x - 0.3, 0.735, z + 0.05, 0.3, 0.01, 0.22, ['#F4F2EE', '#C9DCEB', '#F0D9C9'][rI]);
        if((cI + rI) % 3 === 1){ box(g, x + 0.3, 0.735, z + 0.04, 0.3, 0.01, 0.22, '#F4F2EE'); box(g, x + 0.12, 0.755, z - 0.12, 0.2, 0.05, 0.07, '#2F6E4F'); }
        if((cI * 3 + rI) % 4 === 1) box(g, x + 0.62, 0.17, z + 0.62, 0.18, 0.34, 0.28, ['#9B3B33', '#2F5E7E', '#4E7C58'][cI]);
      }));
      // les fenêtres (à droite), leurs appuis, les radiateurs dessous
      [[-2.7, -1.1], [-0.5, 1.1], [1.7, 3.0]].forEach(([z0, z1]) => { const zc = (z0 + z1) / 2, w = z1 - z0;
        pane(g, [X1 - 0.015, z0], [X1 - 0.015, z1], 1.5, '#A9C9DE', 0.95);
        wall(g, [X1 - 0.025, z0 - 0.05], [X1 - 0.025, z1 + 0.05], 0.06, SILL, 0.9); wall(g, [X1 - 0.025, z0 - 0.05], [X1 - 0.025, z1 + 0.05], 0.06, SILL, 2.42);
        [z0, zc, z1].forEach(z => wall(g, [X1 - 0.025, z - 0.03], [X1 - 0.025, z + 0.03], 1.5, SILL, 0.95)); wall(g, [X1 - 0.025, z0], [X1 - 0.025, z1], 0.04, SILL, 1.72);
        box(g, X1 - 0.06, 0.92, zc, 0.12, 0.04, w + 0.12, '#E9E5DD'); box(g, X1 - 0.07, 0.5, zc, 0.07, 0.5, w * 0.8, '#E6E6E2'); [-1, 1].forEach(e => box(g, X1 - 0.07, 0.125, zc + e * w * 0.34, 0.04, 0.25, 0.04, '#D4D4CF'));
        for(let k = 0; k < 6; k++) box(g, X1 - 0.106, 0.5, zc - w * 0.33 + k * w * 0.132, 0.008, 0.44, 0.02, '#D4D4CF'); });
      cyl(g, X1 - 0.12, 1.06, 0.3, 0.09, 0.07, 0.12, '#B9876A', 8); ball(g, X1 - 0.12, 1.15, 0.3, 0.13, 0.11, 0.13, '#4E7C58', 8);
      // la porte (mur de gauche, au fond), le portemanteau
      wall(g, [X0 + 0.012, 3.08], [X0 + 0.012, 2.12], 2.05, '#6E8FA8'); box(g, X0 + 0.04, 1.0, 2.26, 0.04, 0.03, 0.13, '#C9CDD3');
      [2.07, 3.13].forEach(z => box(g, X0 + 0.03, 1.04, z, 0.06, 2.08, 0.06, '#E9ECEE')); box(g, X0 + 0.03, 2.1, 2.6, 0.06, 0.06, 1.12, '#E9ECEE');
      box(g, X0 + 0.03, 1.58, -0.2, 0.04, 0.08, 2.6, '#8A6A4C'); for(let k = 0; k < 7; k++) box(g, X0 + 0.08, 1.54, -1.35 + k * 0.38, 0.07, 0.025, 0.025, MET);
      box(g, X0 + 0.11, 1.28, -0.97, 0.12, 0.5, 0.3, '#3D5A80'); box(g, X0 + 0.11, 1.3, 0.17, 0.12, 0.46, 0.3, '#9B3B33');
      // au fond : le tableau de liège et ses affiches, la carte, l'armoire basse
      wall(g, [2.9, Z1 - 0.012], [0.3, Z1 - 0.012], 1.0, '#B98E5E', 1.2);
      [[2.7, 1.32, 0.4, '#F4F2EE'], [2.15, 1.6, 0.36, '#C9DCEB'], [1.55, 1.3, 0.42, '#F0D9C9'], [1.0, 1.62, 0.34, '#F4F2EE'], [0.6, 1.3, 0.3, '#DCE9D4']].forEach(([x, y, w, c]) => wall(g, [x, Z1 - 0.016], [x - w, Z1 - 0.016], 0.34, c, y));
      wall(g, [-0.6, Z1 - 0.012], [-2.4, Z1 - 0.012], 1.1, '#7FA6C4', 1.2); [[-0.9, 1.6, 0.4, 0.35], [-1.6, 1.4, 0.5, 0.45], [-2.1, 1.75, 0.2, 0.25]].forEach(([x, y, w, h]) => wall(g, [x, Z1 - 0.016], [x - w, Z1 - 0.016], h, '#9CB98A', y));
      box(g, -3.3, 0.45, Z1 - 0.28, 1.8, 0.9, 0.5, '#A5845F'); [-3.75, -2.85].forEach(x => box(g, x, 0.45, Z1 - 0.528, 0.02, 0.12, 0.02, '#5B4532'));
      [0, 1, 2, 3, 4, 5].forEach(k => box(g, -4.0 + k * 0.13, 0.9 + (0.26 - (k % 3) * 0.03) / 2, Z1 - 0.3, 0.09, 0.26 - (k % 3) * 0.03, 0.2, ['#9B3B33', '#2F6E4F', '#3D5A80', '#C9B48F'][k % 4]));
      // les néons du plafond
      [-2.2, 1.4].forEach(x => [-2, 0, 2].forEach(z => box(g, x, 2.97, z, 1.2, 0.04, 0.3, '#F7F5F0')));
    },
  },
  // la supérette : trois rayons, les frigos au fond, la caisse près de la vitrine
  shop:{
    spawn:[{ x:3.95, z:2.1, ry:-90 }, { x:2.2, z:2.1, ry:90 }],
    cam:{ tx:1.2, ty:1.1, tz:1.2, yaw:-40, pitch:-8, dist:5.6, lens:24 },
    build(g){
      const X0 = -5, X1 = 5, Z0 = -4, Z1 = 4, H = 3.0, MET = '#5C636E';
      floor(g, X0, Z0, X1, Z1, 0, '#D6D3CA');
      wall(g, [X0, Z0], [X1, Z0], H, '#E9E7E1'); wall(g, [X0, Z1], [X0, Z0], H, '#E2E0DA'); wall(g, [X1, Z0], [X1, Z1], H, '#E2E0DA'); wall(g, [X1, Z1], [X0, Z1], H, '#E6E4DE');
      floor(g, X0, Z0, X1, Z1, H, '#F3F2EE', true);
      wall(g, [X0, Z0 + 0.008], [X1, Z0 + 0.008], 0.1, '#8E959E'); wall(g, [X0 + 0.008, Z1], [X0 + 0.008, Z0], 0.1, '#8E959E'); wall(g, [X1 - 0.008, Z0], [X1 - 0.008, Z1], 0.1, '#8E959E');
      // la vitrine et la porte vitrée, sur la rue
      [[4.7, 0.6, 0.35], [0.2, -1.5, 0], [-1.9, -4.7, 0.35]].forEach(([a, b, y]) => { pane(g, [a, Z1 - 0.015], [b, Z1 - 0.015], 2.35 - y, '#A9C9DE', y);
        [a, b].forEach(x => wall(g, [x + 0.05, Z1 - 0.025], [x - 0.05, Z1 - 0.025], 2.4, '#3A3D44')); wall(g, [a + 0.05, Z1 - 0.025], [b - 0.05, Z1 - 0.025], 0.08, '#3A3D44', 2.33);
        if(y) wall(g, [a + 0.05, Z1 - 0.025], [b - 0.05, Z1 - 0.025], 0.06, '#3A3D44', y - 0.03); });
      [0.4, -1.7].forEach(x => wall(g, [x + 0.05, Z1 - 0.025], [x - 0.05, Z1 - 0.025], 2.4, '#3A3D44')); box(g, -0.65, 1.05, Z1 - 0.06, 1.4, 0.04, 0.04, '#B8BEC4');
      // les rayons : des gondoles doubles chargées de produits
      const PROD = ['#B5352B', '#2F5E7E', '#E2DCCB', '#4E7C58', '#D98A2B', '#7A4E8C', '#C9B48F', '#3A3D44', '#E07A6B', '#5E8FB0'];
      [-3.2, -0.9, 1.4].forEach((xc, u) => { const zc = -0.6, L = 3.6;
        box(g, xc, 0.075, zc, 0.9, 0.15, L, MET); box(g, xc, 0.9, zc, 0.06, 1.5, L, '#E4E6E8');
        [0.15, 0.55, 0.95, 1.35].forEach(y => box(g, xc, y + 0.015, zc, 0.86, 0.03, L, '#C9CDD2'));
        [-1, 1].forEach(e => box(g, xc, 0.84, zc + e * (L / 2 + 0.02), 0.9, 1.68, 0.04, '#D0D4D8'));
        box(g, xc, 1.78, zc + L / 2 + 0.03, 0.7, 0.2, 0.02, ['#B5352B', '#2F6E4F', '#2F5E7E'][u]);
        [-1, 1].forEach(sd => [0.18, 0.58, 0.98, 1.38].forEach((y, r) => { let z = zc - L / 2 + 0.1, k = u * 7 + r * 3 + (sd > 0 ? 5 : 0);
          while(z < zc + L / 2 - 0.16){ const w = 0.12 + (k % 3) * 0.06, h = 0.1 + ((k * 7) % 5) * 0.03;
            box(g, xc + sd * 0.24, y + h / 2, z + w / 2, 0.26, h, w - 0.02, PROD[k % PROD.length]); z += w + 0.01; k++; } })); });
      // les frigos, au fond : des portes vitrées sur des bouteilles
      box(g, 0, 1.06, Z0 + 0.06, 8.2, 2.12, 0.08, '#D9DEE2'); box(g, 0, 1.0, Z0 + 0.105, 8.0, 1.84, 0.01, '#EEF3F6');
      box(g, 0, 2.06, Z0 + 0.39, 8.2, 0.12, 0.7, '#D9DEE2'); box(g, 0, 0.11, Z0 + 0.39, 8.2, 0.22, 0.7, '#D9DEE2'); [-1, 1].forEach(e => box(g, e * 4.07, 1.06, Z0 + 0.39, 0.06, 2.12, 0.7, '#D9DEE2'));
      const BOT = ['#2F6E4F', '#B5352B', '#E2DCCB', '#5E8FB0', '#D98A2B'];
      [0.22, 0.68, 1.14, 1.6].forEach((y, r) => { box(g, 0, y + 0.0125, Z0 + 0.42, 7.96, 0.025, 0.6, '#B8BEC4');
        const e0 = EDGE_ON; EDGE_ON = 0; for(let k = 0; k < 40; k++){ const h = r === 3 ? 0.18 : 0.26; box(g, -3.9 + k * 0.2, y + 0.025 + h / 2, Z0 + 0.5, 0.075, h, 0.075, BOT[((k >> 2) + r) % 5]); } EDGE_ON = e0; });
      for(let k = 0; k <= 8; k++) box(g, -4 + k, 1.0, Z0 + 0.73, 0.05, 1.86, 0.05, '#B8BEC4');
      box(g, 0, 0.06, Z0 + 0.73, 8.04, 0.12, 0.06, '#B8BEC4'); box(g, 0, 1.94, Z0 + 0.73, 8.04, 0.06, 0.06, '#B8BEC4');
      for(let k = 0; k < 8; k++) box(g, -3.94 + k, 1.05, Z0 + 0.768, 0.025, 0.5, 0.03, '#8E959E');
      box(g, 0, 2.3, Z0 + 0.02, 3.0, 0.32, 0.04, '#2F5E7E'); pixText(g, 'FRAIS', 0, 2.3, Z0 + 0.045, 1, 0.045, '#F4F6F6');
      // la caisse, le présentoir de bonbons, l'étagère derrière le caissier, l'enseigne
      box(g, 3.0, 0.45, 2.1, 0.7, 0.9, 1.8, '#7C5A44'); box(g, 3.0, 0.92, 2.1, 0.8, 0.04, 1.9, '#2E3238');
      box(g, 3.1, 1.04, 2.55, 0.3, 0.2, 0.32, '#3A3D44'); box(g, 3.18, 1.25, 2.55, 0.04, 0.2, 0.28, '#1D1F24'); box(g, 2.85, 0.95, 1.6, 0.3, 0.02, 0.4, '#5C636E');
      box(g, 2.55, 0.5, 1.5, 0.3, 1.0, 0.5, '#B8BEC4'); [0.3, 0.6, 0.9].forEach((y, r) => { for(let k = 0; k < 4; k++) box(g, 2.45, y + 0.06, 1.32 + k * 0.12, 0.12, 0.1, 0.09, PROD[(k + r * 3) % PROD.length]); });
      box(g, X1 - 0.22, 1.5, 2.1, 0.4, 1.4, 2.0, '#5C4636'); [0.92, 1.14, 1.36, 1.58, 1.8, 2.02].forEach((y, r) => { box(g, X1 - 0.43, y - 0.085, 2.1, 0.03, 0.02, 1.9, '#3A2C22'); for(let k = 0; k < 13; k++) box(g, X1 - 0.43, y, 1.22 + k * 0.147, 0.02, 0.15, 0.12, PROD[(k * 3 + r) % PROD.length]); });
      box(g, X1 - 0.03, 2.55, 2.1, 0.04, 0.3, 2.0, '#C8392F'); pixText(g, 'SUPERETTE', 2.1, 2.55, X1 - 0.055, -1, 0.04, '#F4F6F6', true);
      // près de l'entrée : la pile de paniers, le présentoir à journaux
      [0, 1, 2, 3].forEach(k => box(g, -2.6, 0.1 + k * 0.09, 3.3, 0.42, 0.08, 0.3, '#C8392F')); box(g, -2.6, 0.06, 3.3, 0.38, 0.04, 0.26, '#A12E26');
      box(g, -3.9, 0.55, 3.2, 0.7, 1.1, 0.35, '#8E959E'); [0.5, 0.85].forEach(y => box(g, -3.9, y + 0.12, 3.02, 0.62, 0.24, 0.02, '#E2DCCB'));
      // les dalles lumineuses
      [-3.2, -0.9, 1.4, 3.4].forEach(x => [-2.6, -0.6, 1.4, 3.0].forEach(z => box(g, x, 2.97, z, 1.2, 0.04, 0.3, '#F7F5F0')));
    },
  },
  // la salle de réunion : la grande table, la baie vitrée sur la ville, l'écran, le tableau blanc
  meeting:{
    spawn:[{ x:-2.75, z:0, ry:90, pose:'sit' }, { x:0, z:1.05, ry:180, pose:'sit' }],
    cam:{ tx:0, ty:1.0, tz:0, yaw:-125, pitch:-10, dist:5.4, lens:24 },
    build(g){
      const X0 = -4, X1 = 4, Z0 = -3, Z1 = 3, H = 2.8, MET = '#2A2C31';
      floor(g, X0, Z0, X1, Z1, 0, '#6A7079');
      wall(g, [X0, Z0], [X1, Z0], H, '#E4E1DA'); wall(g, [X0, Z1], [X0, Z0], H, '#DAD6CE'); wall(g, [X1, Z0], [X1, Z1], H, '#DAD6CE'); wall(g, [X1, Z1], [X0, Z1], H, '#E1DDD5');
      floor(g, X0, Z0, X1, Z1, H, '#EEEBE6', true);
      [[X0, Z0 + 0.008, X1, Z0 + 0.008], [X0 + 0.008, Z1, X0 + 0.008, Z0], [X1 - 0.008, Z0, X1 - 0.008, Z1], [X1, Z1 - 0.008, X0, Z1 - 0.008]].forEach(([a, b, c, d]) => wall(g, [a, b], [c, d], 0.08, '#3A3D44'));
      // la baie vitrée, du sol presque au plafond, sur la ville
      pane(g, [X0 + 0.1, Z0 + 0.015], [X1 - 0.1, Z0 + 0.015], 2.25, '#A9C9DE', 0.25);
      for(let k = 0; k <= 6; k++){ const x = X0 + 0.1 + k * (X1 - X0 - 0.2) / 6; wall(g, [x - 0.035, Z0 + 0.025], [x + 0.035, Z0 + 0.025], 2.3, '#3A3D44', 0.22); }
      wall(g, [X0 + 0.05, Z0 + 0.025], [X1 - 0.05, Z0 + 0.025], 0.06, '#3A3D44', 0.2); wall(g, [X0 + 0.05, Z0 + 0.025], [X1 - 0.05, Z0 + 0.025], 0.06, '#3A3D44', 2.47);
      // la grande table, ses deux pieds, ce qui est posé dessus
      box(g, 0, 0.74, 0, 4.2, 0.05, 1.3, '#5B4636'); [-1.3, 1.3].forEach(x => { box(g, x, 0.36, 0, 0.3, 0.72, 0.7, '#3A3D44'); box(g, x, 0.02, 0, 0.5, 0.04, 0.9, '#3A3D44'); });
      box(g, 0, 0.785, 0, 0.32, 0.04, 0.32, '#1D1F24'); box(g, 0, 0.81, 0, 0.12, 0.012, 0.12, '#3A3D44');
      [[-1.4, 0.4, 0], [0, -0.4, 1], [1.4, 0.4, 0]].forEach(([x, z, f]) => { const s = z > 0 ? 1 : -1;
        box(g, x, 0.775, z, 0.34, 0.02, 0.24, '#BFC4CA'); box(g, x, 0.89, z + s * 0.13, 0.34, 0.22, 0.015, '#2C2E33'); });
      [[0, 0.42], [1.4, -0.42], [-1.4, -0.42]].forEach(([x, z]) => box(g, x - 0.05, 0.771, z, 0.22, 0.012, 0.3, '#F4F2EE'));
      [[-0.9, 0.45], [0.55, -0.45], [1.85, 0.4], [-1.85, -0.35]].forEach(([x, z]) => cyl(g, x, 0.85, z, 0.04, 0.035, 0.085, '#F4F2EE', 8));
      // les chaises de bureau, tournées vers la table
      const chair = (x, z, ry) => { const s = Math.sin(ry * D2R), c = Math.cos(ry * D2R);
        box(g, x, 0.42, z, 0.48, 0.07, 0.46, '#2E3440'); box(g, x - s * 0.25, 0.78, z - c * 0.25, Math.abs(c) * 0.44 + Math.abs(s) * 0.06, 0.6, Math.abs(s) * 0.44 + Math.abs(c) * 0.06, '#2E3440'); box(g, x - s * 0.24, 0.47, z - c * 0.24, 0.06, 0.12, 0.06, MET);
        cyl(g, x, 0.39, z, 0.03, 0.03, 0.36, MET, 6); box(g, x, 0.035, z, 0.5, 0.03, 0.08, MET); box(g, x, 0.035, z, 0.08, 0.03, 0.5, MET); };
      [-1.4, 0, 1.4].forEach(x => { chair(x, 1.05, 180); chair(x, -1.05, 0); }); chair(-2.75, 0, 90);
      // l'écran au mur, et un graphique dessus
      box(g, X1 - 0.04, 1.45, 0, 0.06, 1.0, 1.75, '#1D1F24'); wall(g, [X1 - 0.075, -0.8], [X1 - 0.075, 0.8], 0.86, '#E9EEF2', 1.02);
      [[-0.55, 0.3, '#2F5E7E'], [-0.25, 0.45, '#2F5E7E'], [0.05, 0.38, '#2F5E7E'], [0.35, 0.6, '#C8392F']].forEach(([z, h, c]) => wall(g, [X1 - 0.08, z - 0.1], [X1 - 0.08, z + 0.1], h, c, 1.1));
      box(g, X1 - 0.25, 0.3, 0, 0.45, 0.6, 1.6, '#4A3A2E');
      // le tableau blanc, au fond
      wall(g, [1.9, Z1 - 0.012], [-1.9, Z1 - 0.012], 1.2, '#B8BEC4', 0.9); wall(g, [1.85, Z1 - 0.016], [-1.85, Z1 - 0.016], 1.1, '#F6F7F8', 0.95); box(g, 0, 0.92, Z1 - 0.05, 3.8, 0.03, 0.07, '#B8BEC4');
      [[0.9, 1.7, 1.2, '#2F5E7E'], [0.8, 1.5, 0.9, '#2F5E7E'], [-0.9, 1.65, 0.8, '#C8392F'], [-0.6, 1.25, 1.4, '#3A3D44']].forEach(([x, y, w, c]) => box(g, x, y, Z1 - 0.021, w, 0.016, 0.004, c));
      [-0.3, 0.3].forEach(x => box(g, x, 0.95, Z1 - 0.05, 0.12, 0.02, 0.02, ['#C8392F', '#2F5E7E'][x > 0 ? 1 : 0]));
      // la porte, la crédence (eau, verres), la plante
      wall(g, [X0 + 0.012, 2.68], [X0 + 0.012, 1.72], 2.1, '#8C6B4E'); box(g, X0 + 0.04, 1.0, 1.85, 0.04, 0.03, 0.13, '#C9CDD3');
      [1.67, 2.73].forEach(z => box(g, X0 + 0.03, 1.06, z, 0.06, 2.12, 0.06, '#E9ECEE')); box(g, X0 + 0.03, 2.13, 2.2, 0.06, 0.06, 1.12, '#E9ECEE');
      box(g, X0 + 0.25, 0.4, -1.2, 0.45, 0.8, 1.6, '#6E5440'); [-1.6, -1.45].forEach(z => cyl(g, X0 + 0.25, 1.06, z, 0.04, 0.04, 0.26, '#A9C9DE', 8));
      [-1.0, -0.85, -0.7].forEach(z => cyl(g, X0 + 0.22, 0.89, z, 0.035, 0.03, 0.09, '#DCE6EC', 8));
      cyl(g, X1 - 0.4, 0.45, 2.6, 0.22, 0.18, 0.45, '#3A3D44', 8); ball(g, X1 - 0.4, 1.0, 2.6, 0.38, 0.55, 0.38, '#4E7C58', 8);
      // les dalles lumineuses
      [-1.25, 1.25].forEach(x => box(g, x, 2.77, 0, 2.0, 0.04, 0.5, '#F7F5F0'));
    },
  },
  // la chambre : le grand lit contre le mur, les tables de chevet et leurs lampes, l'armoire, le bureau sous la fenêtre
  bedroom:{
    spawn:[{ x:-0.6, z:-1.9, ry:0, pose:'lie', y:0.66 }, { x:2.6, z:0.5, ry:90, pose:'sit' }],
    cam:{ tx:-0.2, ty:0.9, tz:-1.2, yaw:22, pitch:-12, dist:3.8, lens:24 },
    build(g){
      const X0 = -3.5, X1 = 3.5, Z0 = -3, Z1 = 3, H = 2.6, W = '#7A5C42', K = '#2C2E33';
      floor(g, X0, Z0, X1, Z1, 0, '#A98258');
      wall(g, [X0, Z0], [X1, Z0], H, '#C9D2D6'); wall(g, [X0, Z1], [X0, Z0], H, '#E7DED3'); wall(g, [X1, Z0], [X1, Z1], H, '#E7DED3'); wall(g, [X1, Z1], [X0, Z1], H, '#EAE2D7');
      floor(g, X0, Z0, X1, Z1, H, '#F3EFE8', true);
      [[X0, Z0 + 0.008, X1, Z0 + 0.008], [X0 + 0.008, Z1, X0 + 0.008, Z0], [X1 - 0.008, Z0, X1 - 0.008, Z1], [X1, Z1 - 0.008, X0, Z1 - 0.008]].forEach(([a, b, c, d]) => wall(g, [a, b], [c, d], 0.08, '#F4F2EE'));
      // le lit, sa tête de lit, la couette, les oreillers
      box(g, -0.6, 0.2, -1.95, 1.7, 0.4, 2.1, '#6E5440'); box(g, -0.6, 0.5, -1.95, 1.6, 0.2, 2.0, '#F4F2EE'); box(g, -0.6, 0.625, -1.4, 1.64, 0.05, 1.2, '#3D5A80'); box(g, -0.6, 0.45, -0.81, 1.64, 0.3, 0.04, '#3D5A80');
      box(g, -0.6, 0.8, -2.96, 1.8, 1.1, 0.08, '#5B4532'); [-1.0, -0.2].forEach(x => ball(g, x, 0.66, -2.62, 0.32, 0.07, 0.17, '#FFFFFF', 10));
      // les tables de chevet et leurs lampes (allumées la nuit)
      [-1.85, 0.65].forEach(x => { box(g, x, 0.275, -2.75, 0.45, 0.55, 0.4, W); box(g, x, 0.38, -2.548, 0.36, 0.012, 0.005, '#5B4532');
        cyl(g, x, 0.6, -2.8, 0.06, 0.07, 0.05, K, 10); cyl(g, x, 0.75, -2.8, 0.01, 0.01, 0.15, K, 6); cyl(g, x, 0.88, -2.8, 0.07, 0.11, 0.15, '#F2E6C9', 10); });
      box(g, 0.75, 0.57, -2.68, 0.12, 0.03, 0.08, '#24262B');
      // l'armoire, contre le mur de gauche
      box(g, X0 + 0.3, 1.05, 0.8, 0.6, 2.1, 1.2, W); box(g, X0 + 0.603, 1.05, 0.8, 0.005, 2.0, 0.012, '#5B4532'); [0.74, 0.86].forEach(z => box(g, X0 + 0.61, 1.1, z, 0.02, 0.22, 0.02, '#9AA0A8'));
      // la fenêtre (à droite), ses rideaux, le bureau dessous et sa chaise
      pane(g, [X1 - 0.015, -0.3], [X1 - 0.015, 1.3], 1.3, '#A9C9DE', 0.9);
      wall(g, [X1 - 0.025, -0.35], [X1 - 0.025, 1.35], 0.06, '#F4F2EE', 0.86); wall(g, [X1 - 0.025, -0.35], [X1 - 0.025, 1.35], 0.06, '#F4F2EE', 2.18); [-0.33, 0.5, 1.33].forEach(z => wall(g, [X1 - 0.025, z - 0.03], [X1 - 0.025, z + 0.03], 1.3, '#F4F2EE', 0.9));
      box(g, X1 - 0.06, 2.38, 0.5, 0.03, 0.03, 2.6, '#9AA0A8'); [-0.6, 1.6].forEach(z => box(g, X1 - 0.08, 1.2, z, 0.04, 2.34, 0.4, '#C9B48F'));
      box(g, X1 - 0.35, 0.74, 0.5, 0.6, 0.04, 1.2, W); [[-0.28, -0.08], [-0.28, 1.08], [0.24, -0.08], [0.24, 1.08]].forEach(([dx, z]) => box(g, X1 - 0.35 + dx, 0.36, z, 0.04, 0.72, 0.04, '#5B4532'));
      box(g, X1 - 0.35, 0.77, 0.25, 0.24, 0.02, 0.34, '#3A3D44'); box(g, X1 - 0.5, 0.88, 0.25, 0.012, 0.2, 0.32, '#3A3D44'); cyl(g, X1 - 0.3, 0.84, 0.95, 0.04, 0.035, 0.08, '#B4232C', 8);
      box(g, 2.6, 0.44, 0.5, 0.44, 0.05, 0.44, '#E9E6E0'); box(g, 2.4, 0.72, 0.5, 0.04, 0.52, 0.42, '#E9E6E0'); [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]].forEach(([a, b]) => box(g, 2.6 + a, 0.21, 0.5 + b, 0.035, 0.42, 0.035, '#9AA0A8'));
      // le tapis, les affiches, la porte
      box(g, -0.6, 0.006, 0.05, 2.4, 0.012, 1.4, '#C9B48F'); box(g, -0.6, 0.0125, 0.05, 2.0, 0.002, 1.0, '#B98E5E');
      wall(g, [X0 + 0.012, -0.4], [X0 + 0.012, -1.4], 0.7, '#2F5E7E', 1.3); wall(g, [X0 + 0.016, -0.48], [X0 + 0.016, -1.32], 0.54, '#E2642B', 1.38);
      wall(g, [0.6, Z1 - 0.012], [-0.3, Z1 - 0.012], 1.2, '#24262B', 1.0); wall(g, [0.55, Z1 - 0.016], [-0.25, Z1 - 0.016], 1.1, '#B4232C', 1.05);
      wall(g, [2.85, Z1 - 0.012], [1.95, Z1 - 0.012], 2.05, '#E9E6E0'); box(g, 2.05, 1.0, Z1 - 0.04, 0.13, 0.03, 0.04, '#9AA0A8');
      [1.9, 2.9].forEach(x => box(g, x, 1.04, Z1 - 0.03, 0.06, 2.08, 0.06, '#F4F2EE')); box(g, 2.4, 2.1, Z1 - 0.03, 1.12, 0.06, 0.06, '#F4F2EE');
      box(g, 0, 2.57, 0, 0.5, 0.04, 0.5, '#F7F5F0');
    },
  },
  // la cuisine : le plan de travail, l'évier, la cuisinière et sa hotte, le frigo, la table au milieu
  kitchen:{
    spawn:[{ x:0.4, z:-1.8, ry:180 }, { x:-0.45, z:-0.05, ry:0, pose:'sit' }],
    cam:{ tx:0, ty:1.1, tz:-0.6, yaw:-30, pitch:-10, dist:4.2, lens:24 },
    build(g){
      const X0 = -3.5, X1 = 3.5, Z0 = -2.8, Z1 = 2.8, H = 2.6, CAB = '#3D5A80', TOP = '#E2DCCB', M = '#9AA0A8', K = '#2C2E33';
      floor(g, X0, Z0, X1, Z1, 0, '#CFC8BC');
      wall(g, [X0, Z0], [X1, Z0], H, '#EFE9DF'); wall(g, [X0, Z1], [X0, Z0], H, '#E9E2D6'); wall(g, [X1, Z0], [X1, Z1], H, '#E9E2D6'); wall(g, [X1, Z1], [X0, Z1], H, '#ECE5DA');
      floor(g, X0, Z0, X1, Z1, H, '#F4F1EB', true);
      wall(g, [X0, Z0 + 0.01], [1.5, Z0 + 0.01], 0.62, '#DCE6E8', 0.91);
      // le plan de travail : les meubles bas, l'évier, la cuisinière
      box(g, -1.0, 0.43, Z0 + 0.3, 5.0, 0.86, 0.6, CAB); box(g, -1.0, 0.885, Z0 + 0.32, 5.04, 0.05, 0.64, TOP); box(g, -1.0, 0.04, Z0 + 0.56, 5.0, 0.08, 0.05, '#2E4766');
      for(let k = 0; k < 8; k++){ const x = -3.2 + k * 0.6; if(Math.abs(x - 0.4) < 0.31) continue; box(g, x + 0.27, 0.43, Z0 + 0.603, 0.006, 0.76, 0.005, '#2E4766'); box(g, x, 0.74, Z0 + 0.612, 0.14, 0.02, 0.02, M); }
      box(g, -1.4, 0.912, Z0 + 0.34, 0.6, 0.004, 0.42, M); box(g, -1.4, 1.03, Z0 + 0.12, 0.03, 0.24, 0.03, M); box(g, -1.4, 1.14, Z0 + 0.2, 0.03, 0.03, 0.18, M);
      box(g, 0.4, 0.915, Z0 + 0.32, 0.6, 0.01, 0.56, '#1D1F24'); [[0.25, 0.2], [0.55, 0.2], [0.25, 0.44], [0.55, 0.44]].forEach(([x, z]) => cyl(g, x, 0.924, Z0 + z, 0.08, 0.08, 0.004, '#3A3D44', 10));
      box(g, 0.4, 0.45, Z0 + 0.604, 0.56, 0.5, 0.008, '#1D1F24'); box(g, 0.4, 0.73, Z0 + 0.62, 0.4, 0.02, 0.02, M);
      // la hotte, les placards du haut
      box(g, 0.4, 1.9, Z0 + 0.2, 0.7, 0.24, 0.4, M); box(g, 0.4, 2.31, Z0 + 0.12, 0.3, 0.58, 0.24, M);
      box(g, -2.2, 1.85, Z0 + 0.175, 2.4, 0.7, 0.35, '#E9E6E0'); for(let k = 0; k < 4; k++) box(g, -3.25 + k * 0.6, 1.62, Z0 + 0.355, 0.02, 0.12, 0.02, M);
      // sur le plan de travail : la bouilloire, la planche, la corbeille de fruits
      cyl(g, -0.3, 1.08, Z0 + 0.3, 0.08, 0.1, 0.17, '#B4232C', 10); box(g, -2.5, 0.92, Z0 + 0.35, 0.4, 0.02, 0.28, '#B9935F');
      // le frigo
      box(g, 2.1, 0.95, Z0 + 0.35, 0.75, 1.9, 0.66, '#E9E6E0'); box(g, 2.1, 1.3, Z0 + 0.682, 0.73, 0.012, 0.005, '#BFC4CA'); [[1.65, 0.45], [0.85, 0.6]].forEach(([y, h]) => box(g, 2.4, y, Z0 + 0.7, 0.03, h, 0.03, M));
      // la fenêtre (à droite)
      pane(g, [X1 - 0.015, -0.8], [X1 - 0.015, 0.8], 1.2, '#A9C9DE', 1.0);
      wall(g, [X1 - 0.025, -0.85], [X1 - 0.025, 0.85], 0.06, '#F4F2EE', 0.96); wall(g, [X1 - 0.025, -0.85], [X1 - 0.025, 0.85], 0.06, '#F4F2EE', 2.18); [-0.83, 0, 0.83].forEach(z => wall(g, [X1 - 0.025, z - 0.03], [X1 - 0.025, z + 0.03], 1.2, '#F4F2EE', 1.0));
      box(g, X1 - 0.07, 0.98, 0, 0.14, 0.04, 1.75, '#E9E5DD'); cyl(g, X1 - 0.08, 1.12, 0.4, 0.07, 0.055, 0.12, '#B9876A', 8); ball(g, X1 - 0.08, 1.2, 0.4, 0.1, 0.09, 0.1, '#4E7C58', 8);
      // la table, ses chaises, la suspension au-dessus
      box(g, 0, 0.75, 0.9, 1.5, 0.05, 0.9, '#B9935F'); [[-0.68, 0.52], [0.68, 0.52], [-0.68, 1.28], [0.68, 1.28]].forEach(([x, z]) => box(g, x, 0.36, z, 0.05, 0.72, 0.05, '#8A6A4C'));
      const chair = (x, z, f) => { box(g, x, 0.44, z, 0.42, 0.04, 0.42, '#8A6A4C'); box(g, x, 0.72, z - f * 0.19, 0.42, 0.5, 0.04, '#8A6A4C');
        [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([a, b]) => box(g, x + a, 0.21, z + b, 0.035, 0.42, 0.035, '#6B5038')); };
      [-0.45, 0.45].forEach(x => { chair(x, -0.05, 1); chair(x, 1.85, -1); });
      ball(g, 0, 0.82, 0.9, 0.16, 0.06, 0.16, '#E9E6E0', 10); [[-0.12, 0.88, '#B4232C'], [0.08, 0.86, '#E2642B'], [0.02, 0.98, '#6B8F3A']].forEach(([x, z, c]) => ball(g, x, 0.88, z, 0.05, 0.05, 0.05, c, 7));
      [[-0.45, 0.55], [0.45, 1.25]].forEach(([x, z]) => cyl(g, x, 0.84, z, 0.04, 0.035, 0.09, '#F4F2EE', 8));
      box(g, 0, 2.35, 0.9, 0.012, 0.5, 0.012, K); cyl(g, 0, 2.12, 0.9, 0.06, 0.2, 0.2, '#2F6E4F', 10); ball(g, 0, 1.92, 0.9, 0.05, 0.05, 0.05, '#F2E6C9', 7);
      box(g, 0, 2.57, -1.6, 1.0, 0.04, 0.3, '#F7F5F0');
      // la porte (au fond à gauche)
      wall(g, [-1.95, Z1 - 0.012], [-2.85, Z1 - 0.012], 2.05, '#E9E6E0'); box(g, -2.75, 1.0, Z1 - 0.04, 0.13, 0.03, 0.04, M);
      [-1.9, -2.9].forEach(x => box(g, x, 1.04, Z1 - 0.03, 0.06, 2.08, 0.06, '#F4F2EE')); box(g, -2.4, 2.1, Z1 - 0.03, 1.12, 0.06, 0.06, '#F4F2EE');
    },
  },
  // la salle de bain : le lavabo et son miroir, la baignoire et son rideau, les toilettes, le lave-linge
  bath:{
    spawn:[{ x:-0.6, z:-1.15, ry:180 }, { x:1.0, z:1.3, ry:200 }],
    cam:{ tx:-0.3, ty:1.2, tz:-0.8, yaw:-25, pitch:-8, dist:2.7, lens:24 },
    build(g){
      const X0 = -2.5, X1 = 2.5, Z0 = -2, Z1 = 2, H = 2.5, WH = '#F4F6F6', M = '#9AA0A8';
      floor(g, X0, Z0, X1, Z1, 0, '#D3DBDE');
      wall(g, [X0, Z0], [X1, Z0], H, '#F1EEE8'); wall(g, [X0, Z1], [X0, Z0], H, '#ECE8E1'); wall(g, [X1, Z0], [X1, Z1], H, '#ECE8E1'); wall(g, [X1, Z1], [X0, Z1], H, '#EFEBE4');
      floor(g, X0, Z0, X1, Z1, H, '#F6F4F0', true);
      // la faïence, jusqu'à mi-hauteur
      wall(g, [X0, Z0 + 0.008], [X1, Z0 + 0.008], 1.2, '#CFE0E6'); wall(g, [X0 + 0.008, Z1], [X0 + 0.008, Z0], 1.2, '#CFE0E6'); wall(g, [X1 - 0.008, Z0], [X1 - 0.008, Z1], 1.2, '#CFE0E6'); wall(g, [X1, Z1 - 0.008], [X0, Z1 - 0.008], 1.2, '#CFE0E6');
      wall(g, [X0, Z0 + 0.01], [X1, Z0 + 0.01], 0.03, '#9DB3BC', 1.2); wall(g, [X0 + 0.01, Z1], [X0 + 0.01, Z0], 0.03, '#9DB3BC', 1.2);
      // le lavabo, le miroir, la réglette lumineuse
      box(g, -0.6, 0.42, Z0 + 0.25, 0.9, 0.84, 0.5, '#E9E6E0'); box(g, -0.6, 0.86, Z0 + 0.27, 0.94, 0.04, 0.54, WH); box(g, -0.6, 0.882, Z0 + 0.29, 0.5, 0.004, 0.32, '#C9D6DE');
      box(g, -0.6, 0.95, Z0 + 0.06, 0.03, 0.14, 0.03, M); box(g, -0.6, 1.01, Z0 + 0.11, 0.03, 0.03, 0.1, M); box(g, -0.6, 0.42, Z0 + 0.503, 0.005, 0.74, 0.012, '#C9C6BE');
      wall(g, [-1.1, Z0 + 0.012], [-0.1, Z0 + 0.012], 1.0, '#B8BEC4', 1.15); wall(g, [-1.05, Z0 + 0.016], [-0.15, Z0 + 0.016], 0.9, '#D6E2E8', 1.2); box(g, -0.6, 2.2, Z0 + 0.04, 0.56, 0.05, 0.06, '#F2E6C9');
      box(g, -0.25, 0.93, Z0 + 0.12, 0.06, 0.1, 0.06, '#2F6E4F'); box(g, -0.95, 0.94, Z0 + 0.12, 0.05, 0.12, 0.05, '#E2642B');
      // la baignoire, son rideau, la douchette
      box(g, X0 + 0.375, 0.28, 1.12, 0.75, 0.56, 1.7, WH); box(g, X0 + 0.375, 0.565, 1.12, 0.6, 0.01, 1.55, '#C9D6DE');
      box(g, X0 + 0.78, 2.0, 1.12, 0.03, 0.03, 1.76, M); box(g, X0 + 0.78, 1.36, 0.6, 0.02, 1.26, 0.66, '#9DB3A6');
      box(g, X0 + 0.04, 1.85, 1.6, 0.06, 0.06, 0.06, M); box(g, X0 + 0.04, 1.3, 1.6, 0.02, 1.1, 0.02, M); box(g, X0 + 0.1, 0.62, 1.6, 0.14, 0.06, 0.08, M);
      box(g, -1.4, 0.006, 1.1, 0.5, 0.012, 0.8, '#9DB3A6');
      // les toilettes
      box(g, 1.5, 0.62, Z0 + 0.14, 0.42, 0.44, 0.18, WH); cyl(g, 1.5, 0.4, -1.55, 0.2, 0.16, 0.4, WH, 12); box(g, 1.5, 0.415, -1.52, 0.38, 0.03, 0.44, '#E9E6E0'); box(g, 1.5, 0.86, Z0 + 0.14, 0.08, 0.02, 0.06, M);
      cyl(g, 2.38, 0.75, -1.4, 0.06, 0.06, 0.1, WH, 10, 'z'); box(g, X1 - 0.03, 0.75, -1.35, 0.06, 0.03, 0.03, M);
      // le lave-linge, le porte-serviettes, la petite fenêtre
      box(g, X1 - 0.31, 0.43, 0.4, 0.6, 0.85, 0.6, WH); cyl(g, X1 - 0.625, 0.45, 0.4, 0.17, 0.17, 0.012, '#9AA0A8', 14, 'x'); cyl(g, X1 - 0.632, 0.45, 0.4, 0.13, 0.13, 0.008, '#3A4652', 14, 'x'); box(g, X1 - 0.6, 0.79, 0.25, 0.012, 0.05, 0.2, '#BFC4CA');
      box(g, X1 - 0.05, 1.2, 1.3, 0.04, 0.03, 0.7, M); box(g, X1 - 0.07, 0.95, 1.3, 0.04, 0.5, 0.5, '#E2642B');
      pane(g, [X1 - 0.015, -1.0], [X1 - 0.015, -0.3], 0.6, '#A9C9DE', 1.5);
      wall(g, [X1 - 0.025, -1.05], [X1 - 0.025, -0.25], 0.05, '#F4F2EE', 1.47); wall(g, [X1 - 0.025, -1.05], [X1 - 0.025, -0.25], 0.05, '#F4F2EE', 2.08); [-1.03, -0.27].forEach(z => wall(g, [X1 - 0.025, z - 0.025], [X1 - 0.025, z + 0.025], 0.6, '#F4F2EE', 1.5));
      // la porte, la lumière
      wall(g, [1.65, Z1 - 0.012], [0.75, Z1 - 0.012], 2.05, '#E9E6E0'); box(g, 0.85, 1.0, Z1 - 0.04, 0.13, 0.03, 0.04, M);
      [0.7, 1.7].forEach(x => box(g, x, 1.04, Z1 - 0.03, 0.06, 2.08, 0.06, '#F4F2EE')); box(g, 1.2, 2.1, Z1 - 0.03, 1.12, 0.06, 0.06, '#F4F2EE');
      box(g, 0, 2.47, 0, 0.4, 0.04, 0.4, '#F7F5F0');
    },
  },
  // la station-service : l'auvent et ses pompes, la boutique au fond, la station de lavage, la route devant, le grand panneau des prix
  gas:{
    sky:{ top:'#86AFD3', hor:'#DCE6EE', low:'#6E737B' }, fog:[40, 170],
    cam:{ tx:0, ty:1.2, tz:0, yaw:35, pitch:-6, dist:9, lens:28 },
    build(g){
      const K = '#2C2E33', R = '#C8392F', W = '#E9E6E0', M = '#B8BEC4', Y = '#E8B923', LED = '#F2D06B', e0 = EDGE_ON;
      // une lumière, une vitre éclairée : allumées la nuit
      const lit = (x, y, z, w, h, d, c) => { const m0 = MAT; MAT = 5; box(g, x, y, z, w, h, d, c); MAT = m0; };
      // les détails plats (écrans, étiquettes, joints) : une simple plaque, tournée vers +x ou -x (s), éventuellement allumée la nuit
      const px = (x, y, z, d, h, c, sd, on) => { const m0 = MAT; if(on) MAT = 5; wall(g, sd > 0 ? [x, z + d / 2] : [x, z - d / 2], sd > 0 ? [x, z - d / 2] : [x, z + d / 2], h, c, y - h / 2); MAT = m0; };
      const flat = (x, y, z, w, d, c, down, on) => { const m0 = MAT; if(on) MAT = 5; floor(g, x - w / 2, z - d / 2, x + w / 2, z + d / 2, y, c, down); MAT = m0; };
      // le bitume tout autour (pas sous la dalle ni sous l'herbe : rien n'est peint deux fois)
      [[-40, -40, 40, -13], [-40, 7.4, 40, 40], [-40, -13, -14, 7.4], [19, -13, 40, 7.4], [10.3, -13, 15.2, -10], [10.3, -1.6, 15.2, 7.4]].forEach(([a, b, c, d]) => floor(g, a, b, c, d, 0, '#5C6068'));
      // la dalle de la station, ses joints, quelques taches d'huile ; l'herbe et les haies sur les côtés
      floor(g, -9, -13, 9, 7.4, 0.02, '#A3A098');
      EDGE_ON = 0;
      for(let x = -6; x <= 6; x += 3) flat(x, 0.024, -2.8, 0.03, 20.4, '#8E8B85');
      for(let z = -10.5; z <= 4.5; z += 3) flat(0, 0.024, z, 18, 0.03, '#8E8B85');
      [[-2.4, 1.8, 0.4], [4.6, -0.9, 0.3], [-4.6, -1.2, 0.35], [2.6, 1.9, 0.25]].forEach(([x, z, r]) => cyl(g, x, 0.026, z, r, r * 0.8, 0.002, '#999690', 10));
      // la route : le trottoir, la bordure, les lignes
      box(g, 0, 0.05, 7.45, 80, 0.1, 0.15, '#C9C6BE');
      for(let x = -38; x < 38; x += 4) flat(x + 1, 0.03, 11, 2, 0.15, '#E9E6E0');
      flat(0, 0.03, 8.2, 76, 0.12, '#E9E6E0'); flat(0, 0.03, 13.8, 76, 0.12, '#E9E6E0');
      EDGE_ON = e0;
      [[-14, -9], [9, 10.3], [15.2, 19]].forEach(([a, b]) => floor(g, a, -13, b, 7.3, 0.02, '#6F8F5A'));
      box(g, -10.6, 0.4, -3.2, 0.9, 0.8, 18, '#4E7C58'); box(g, 17, 0.4, -3.2, 0.9, 0.8, 18, '#4E7C58');
      // l'auvent : son toit, son bandeau rouge, son logo, ses dalles lumineuses, ses deux piliers
      box(g, 0, 4.75, 0, 12.4, 0.5, 8.4, W);
      [-1, 1].forEach(e => { box(g, 0, 4.7, e * 4.22, 12.44, 0.18, 0.04, R); box(g, e * 6.22, 4.7, 0, 0.04, 0.18, 8.44, R); });
      pixText(g, 'STATION', 0, 4.71, 4.245, 1, 0.045, '#F4F6F6');
      cyl(g, 5.3, 4.75, 4.2, 0.2, 0.2, 0.03, R, 16, 'z'); cyl(g, 5.3, 4.75, 4.231, 0.13, 0.13, 0.004, '#F4F6F6', 16, 'z'); cyl(g, 5.3, 4.75, 4.236, 0.07, 0.07, 0.004, R, 12, 'z');
      EDGE_ON = 0; for(let x = -5; x <= 5; x += 2) [-2.6, 0, 2.6].forEach(z => flat(x, 4.49, z, 0.5, 0.5, '#F4EFD8', true, true)); EDGE_ON = e0;
      [-3.5, 3.5].forEach(x => {
        // l'îlot, ses butoirs jaunes, ses poteaux de protection
        box(g, x, 0.1, 0, 1.2, 0.2, 4.6, M); [-1, 1].forEach(e => { box(g, x, 0.1, e * 2.31, 1.22, 0.21, 0.04, Y); cyl(g, x - 0.4, 1.0, e * 2.6, 0.06, 0.06, 1.0, Y, 6); cyl(g, x + 0.4, 1.0, e * 2.6, 0.06, 0.06, 1.0, Y, 6); });
        box(g, x, 2.4, 0, 0.36, 4.4, 0.36, '#C9CDD3'); box(g, x, 0.45, 0, 0.46, 0.5, 0.46, R);
        [-1.4, 1.4].forEach((z, n) => {
          // la pompe : le socle, le corps, la tête et son bandeau, les écrans (allumés la nuit), les pistolets et leurs tuyaux
          box(g, x, 0.3, z, 0.66, 0.2, 0.5, '#3A3D44'); box(g, x, 1.0, z, 0.6, 1.2, 0.45, R); box(g, x, 1.75, z, 0.62, 0.3, 0.47, W); box(g, x, 1.75, z, 0.64, 0.08, 0.49, R);
          EDGE_ON = 0; [-1, 1].forEach(e => { const fx = x + e * 0.302;
            px(fx, 1.38, z, 0.34, 0.3, '#1D1F24', e); px(fx + e * 0.003, 1.44, z, 0.22, 0.05, LED, e, true); px(fx + e * 0.003, 1.34, z, 0.14, 0.05, LED, e, true);
            px(fx, 0.78, z, 0.36, 0.34, W, e); [0.84, 0.76].forEach(y => px(fx + e * 0.003, y, z, 0.26, 0.03, '#5E636C', e));
            [[-0.14, '#2F6E4F'], [0.0, Y], [0.14, K]].forEach(([dz, c]) => { box(g, x + e * 0.33, 1.12, z + dz, 0.05, 0.16, 0.08, K); box(g, x + e * 0.37, 1.08, z + dz, 0.07, 0.1, 0.05, c); });
            box(g, x + e * 0.34, 1.42, z - 0.2, 0.025, 0.56, 0.025, K); }); EDGE_ON = e0;
        });
        box(g, x, 0.55, 2.0, 0.3, 0.7, 0.3, '#2F6E4F'); box(g, x, 0.92, 2.0, 0.34, 0.04, 0.34, '#24262B'); box(g, x, 0.55, -2.0, 0.3, 0.7, 0.3, '#5E636C'); box(g, x, 0.92, -2.0, 0.34, 0.04, 0.34, '#24262B'); });
      // la boutique : le toit, la vitrine et la porte (éclairées la nuit), les affiches, l'enseigne, les appliques
      box(g, 0, 1.6, -10.5, 10, 3.2, 5, W); box(g, 0, 3.3, -10.5, 10.2, 0.2, 5.2, '#B8BEC4'); box(g, 0, 0.1, -7.95, 10.04, 0.2, 0.08, '#8E8B85');
      lit(-1.6, 1.3, -7.99, 6.0, 2.0, 0.02, '#C9D6DE'); [-4.6, -2.6, -0.6, 1.4].forEach(x => box(g, x, 1.3, -7.975, 0.06, 2.04, 0.03, '#3A3D44')); box(g, -1.6, 2.32, -7.975, 6.06, 0.06, 0.03, '#3A3D44');
      EDGE_ON = 0; [[-3.6, 1.55, R], [-1.6, 1.2, '#3D5A80'], [0.4, 1.6, Y]].forEach(([x, y, c]) => { box(g, x, y, -7.972, 0.7, 0.9, 0.006, W); box(g, x, y + 0.2, -7.969, 0.56, 0.3, 0.004, c); box(g, x, y - 0.2, -7.969, 0.4, 0.06, 0.004, K); }); EDGE_ON = e0;
      lit(3.2, 1.1, -7.99, 1.6, 2.2, 0.02, '#C9D6DE'); box(g, 3.2, 1.1, -7.975, 0.04, 2.2, 0.03, '#3A3D44'); box(g, 3.2, 2.22, -7.975, 1.64, 0.06, 0.03, '#3A3D44'); [2.8, 3.6].forEach(x => box(g, x, 1.05, -7.955, 0.5, 0.04, 0.04, '#B8BEC4'));
      box(g, 0, 2.8, -7.97, 10, 0.5, 0.04, R); pixText(g, 'BOUTIQUE', 0, 2.8, -7.945, 1, 0.05, '#F4F6F6');
      [-4.2, 3.2].forEach(x => { box(g, x, 2.45, -7.9, 0.08, 0.08, 0.16, K); lit(x, 2.4, -7.84, 0.2, 0.04, 0.12, '#F4EFD8'); });
      [-4.6, 4.6].forEach(x => { cyl(g, x, 0.85, -7.6, 0.25, 0.22, 0.85, '#2F6E4F', 10); cyl(g, x, 0.89, -7.6, 0.27, 0.27, 0.04, '#24262B', 10); });
      box(g, -3.0, 0.45, -7.6, 1.0, 0.9, 0.6, '#E9E6E0'); box(g, -3.0, 0.92, -7.6, 1.04, 0.04, 0.64, '#3D5A80'); pixText(g, 'GLACE', -3.0, 0.55, -7.296, 1, 0.025, '#3D5A80');
      box(g, 0.8, 0.45, -7.65, 1.4, 0.06, 0.4, '#7A5C42'); [0.25, 1.35].forEach(x => box(g, x, 0.21, -7.65, 0.06, 0.42, 0.36, K));
      box(g, 4.25, 0.7, -7.55, 0.9, 1.4, 0.5, '#C9CDD3'); for(let k = 0; k < 4; k++) cyl(g, 3.95 + k * 0.2, 0.68, -7.55, 0.08, 0.08, 0.5, '#3D7FB0', 8);
      // la station de lavage, sur le côté
      floor(g, 10.3, -10, 15.2, -1.6, 0.02, '#9A9890');
      box(g, 10.6, 1.6, -5.9, 0.3, 3.2, 8, W); box(g, 14.9, 1.6, -5.9, 0.3, 3.2, 8, W); box(g, 12.75, 1.6, -9.75, 4.6, 3.2, 0.3, W); box(g, 12.75, 3.3, -5.9, 4.6, 0.2, 8.2, '#B8BEC4');
      box(g, 12.75, 2.95, -1.86, 4.6, 0.5, 0.12, '#2F5E7E'); pixText(g, 'LAVAGE', 12.75, 2.95, -1.795, 1, 0.05, '#F4F6F6');
      [11.3, 14.2].forEach(x => { cyl(g, x, 2.6, -4.2, 0.36, 0.36, 2.4, '#3D7FB0', 10); cyl(g, x, 2.75, -4.2, 0.06, 0.06, 0.15, K, 6); box(g, x, 2.82, -4.2, 0.08, 0.04, 2.2, K); });
      box(g, 12.75, 2.78, -4.2, 3.2, 0.06, 0.08, K);
      // le grand panneau des prix, au bord de la route
      box(g, 8.5, 3.0, 7.5, 0.3, 6.0, 0.3, '#5E636C'); box(g, 8.5, 5.3, 7.5, 2.0, 2.6, 0.3, R); box(g, 8.5, 6.33, 7.66, 1.9, 0.42, 0.02, W);
      pixText(g, 'ESSENCE', 8.5, 6.33, 7.672, 1, 0.04, R); box(g, 8.5, 5.15, 7.66, 1.8, 1.7, 0.02, '#1D1F24');
      [['1.89', '#2F6E4F', 5.65], ['1.95', Y, 5.15], ['1.79', '#F4F6F6', 4.65]].forEach(([p, c, y]) => { box(g, 7.9, y, 7.672, 0.4, 0.26, 0.004, c); pixText(g, p, 8.85, y, 7.674, 1, 0.042, LED); });
      // les réverbères, les arbres, et au loin, de l'autre côté de la route, des bâtiments (leurs fenêtres s'allument la nuit)
      [[-9.5, 9], [9.5, -12], [-9.5, -12]].forEach(([x, z]) => { cyl(g, x, 6, z, 0.07, 0.09, 6, K, 8); box(g, x, 6.0, z + (z > 0 ? -0.5 : 0.5), 0.2, 0.08, 1.0, K); box(g, x, 5.95, z + (z > 0 ? -0.9 : 0.9), 0.24, 0.02, 0.36, '#F2E6C9'); });
      [-16, -12, 14, 18].forEach((x, i) => { cyl(g, x, 1.8, -10 + i * 3, 0.16, 0.2, 1.8, '#5B4532', 8); ball(g, x, 2.9, -10 + i * 3, 1.3, 1.4, 1.3, '#4E7C58', 9); });
      [[-22, 24, 10, 5.6], [-8, 26, 12, 8.4], [8, 25, 9, 5.6], [22, 24, 11, 5.6]].forEach(([x, z, w, h], i) => { box(g, x, h / 2, z, w, h, 6, ['#B9AE9C', '#9DB3C8', '#C9B48F', '#A7A49E'][i]); box(g, x, h + 0.1, z, w + 0.2, 0.2, 6.2, '#8E8B85');
        MAT = 6; EDGE_ON = 0; for(let y = 1.2; y < h - 1.2; y += 2.8) for(let k = -w / 2 + 0.8; k < w / 2 - 1.2; k += 1.8) wall(g, [x + k + 1.0, z - 3.02], [x + k, z - 3.02], 1.3, '#4F6275', y); MAT = 0; EDGE_ON = e0; });
    },
  },
  // le quai de gare : le quai en hauteur sous son abri, un train à quai, les voies, la caténaire, la ville derrière
  station:{
    sky:{ top:'#8FB2D0', hor:'#DCE4EA', low:'#77736C' }, fog:[40, 170],
    cam:{ tx:0.8, ty:2.2, tz:0, yaw:-55, pitch:-5, dist:8, lens:28 },
    build(g){
      const K = '#2C2E33', P = 1.1, ST = '#5E636C', BL = '#2F5E7E', LED = '#F2D06B', e0 = EDGE_ON;
      const lit = (x, y, z, w, h, d, c) => { const m0 = MAT; MAT = 5; box(g, x, y, z, w, h, d, c); MAT = m0; };
      // les détails plats : une simple plaque (sur le flanc du train, tournée vers le quai ; au sol ; sous l'abri), éventuellement allumée la nuit
      const side = (x, y, z, d, h, c, on) => { const m0 = MAT; if(on) MAT = 5; wall(g, [x, z - d / 2], [x, z + d / 2], h, c, y - h / 2); MAT = m0; };
      const flat = (x, y, z, w, d, c, down, on) => { const m0 = MAT; if(on) MAT = 5; floor(g, x - w / 2, z - d / 2, x + w / 2, z + d / 2, y, c, down); MAT = m0; };
      // le sol tout autour (pas sous le quai : rien n'est peint deux fois)
      [[-40, -40, -3, 40], [3, -40, 40, 40], [-3, -40, 3, -30], [-3, 30, 3, 40]].forEach(([a, b, c, d]) => floor(g, a, b, c, d, 0, '#7C746A'));
      // le quai : sa dalle, ses joints, ses flancs plus sombres, sa bordure, la ligne jaune, la bande podotactile
      floor(g, -3, -30, 3, 30, P, '#B8B4AC'); wall(g, [-3, -30], [-3, 30], P, '#8E8A82'); wall(g, [3, 30], [3, -30], P, '#8E8A82'); wall(g, [3, -30], [-3, -30], P, '#9E9A92'); wall(g, [-3, 30], [3, 30], P, '#9E9A92');
      if(COLL) collOf(g).b.push([0, P / 2, 0, 3, P / 2, 30, 0]);   // le quai reste un obstacle plein pour la caméra
      EDGE_ON = 0; for(let z = -29; z < 30; z += 1.5) flat(0, P + 0.003, z, 5.2, 0.02, '#A9A59D');
      [-1, 1].forEach(e => { flat(e * 2.9, P + 0.004, 0, 0.2, 60, '#D9D5CD'); flat(e * 2.55, P + 0.005, 0, 0.08, 60, '#E8B923'); flat(e * 2.36, P + 0.005, 0, 0.24, 60, '#D8CFAE'); });
      EDGE_ON = e0;
      // les deux voies : le ballast, les traverses, les rails
      [-4.6, 4.6].forEach(x => { box(g, x, 0.06, 0, 3.2, 0.12, 80, '#8E867A'); EDGE_ON = 0;
        // les traverses : leur dessus et leurs deux flancs (le dessous ne se voit jamais)
        for(let z = -39.6; z < 40; z += 0.65){ flat(x, 0.18, z, 2.4, 0.22, '#5B4532'); wall(g, [x - 1.2, z + 0.11], [x + 1.2, z + 0.11], 0.06, '#5B4532', 0.12); wall(g, [x + 1.2, z - 0.11], [x - 1.2, z - 0.11], 0.06, '#5B4532', 0.12); }
        EDGE_ON = e0; [-0.72, 0.72].forEach(d => box(g, x + d, 0.24, 0, 0.07, 0.12, 80, '#8A8F96')); });
      // le train à quai : la caisse et ses bandes, les fenêtres et les portes côté quai (éclairées la nuit), les deux nez, le toit et le pantographe, les bogies
      const TX = 4.6, T0 = -16, T1 = 6, TZ = (T0 + T1) / 2, TL = T1 - T0;
      box(g, TX, 2.45, TZ, 3.0, 2.7, TL, '#E9E6E0'); box(g, TX, 0.95, TZ, 3.0, 0.3, TL, '#5E636C');
      box(g, TX, 3.86, TZ, 2.7, 0.12, TL - 0.4, '#C9CDD3'); box(g, TX, 3.96, TZ, 2.2, 0.08, TL - 1.2, '#B8BEC4');
      box(g, TX - 1.505, 1.25, TZ, 0.01, 0.2, TL, BL); box(g, TX - 1.506, 1.4, TZ, 0.01, 0.05, TL, '#B4232C'); box(g, TX - 1.505, 3.35, TZ, 0.01, 0.12, TL, BL);
      EDGE_ON = 0; for(let z = T0 + 1.6; z < T1 - 1; z += 2.2){ const door = Math.round((z - T0) / 2.2) % 4 === 2;
        if(door){ side(TX - 1.503, 1.95, z, 1.36, 2.0, '#E8B923'); side(TX - 1.506, 1.95, z, 1.3, 1.95, '#B8BEC4');
          side(TX - 1.509, 2.3, z - 0.33, 0.5, 0.7, '#8EA3B5', true); side(TX - 1.509, 2.3, z + 0.33, 0.5, 0.7, '#8EA3B5', true); side(TX - 1.51, 1.95, z, 0.02, 1.95, K); }
        else { side(TX - 1.503, 2.45, z, 1.6, 0.95, '#3A3D44'); side(TX - 1.506, 2.45, z, 1.5, 0.85, '#8EA3B5', true); } } EDGE_ON = e0;
      [[T1, 1], [T0, -1]].forEach(([z, s]) => { lit(TX, 2.55, z + s * 0.01, 2.4, 0.9, 0.02, '#2E3846'); box(g, TX, 1.3, z + s * 0.012, 3.0, 0.5, 0.02, '#E8B923');
        [-0.95, 0.95].forEach(d => lit(TX + d, 1.6, z + s * 0.02, 0.24, 0.12, 0.02, '#F4EFD8')); box(g, TX, 0.95, z + s * 0.12, 0.4, 0.2, 0.24, K); });
      [T0 + 3, T1 - 3].forEach(z => { box(g, TX, 0.55, z, 2.2, 0.5, 2.6, K); [-0.9, 0.9].forEach(d => [-0.8, 0.8].forEach(w => cyl(g, TX + d - 0.05, 0.42, z + w, 0.42, 0.42, 0.1, '#3A3D44', 10, 'x'))); });
      box(g, TX, 4.06, -10, 1.2, 0.12, 1.6, ST); box(g, TX, 5.05, -10, 0.05, 1.9, 0.05, K); box(g, TX, 5.99, -10, 1.6, 0.04, 0.1, K);
      // l'abri du quai : poteaux, poutres, toit et ses bandeaux bleus, tubes lumineux (allumés la nuit), bancs, poubelles, composteurs, distributeur
      for(let z = -24; z <= 24; z += 8){ box(g, 0, P + 1.45, z, 0.25, 2.9, 0.25, ST); box(g, 0, P + 0.15, z, 0.4, 0.3, 0.4, ST); box(g, 0, P + 2.82, z, 5.0, 0.16, 0.18, ST); }
      box(g, 0, P + 2.96, 0, 5.2, 0.12, 52, '#5E636C'); [-1, 1].forEach(e => box(g, e * 2.62, P + 2.9, 0, 0.06, 0.3, 52.1, BL)); box(g, 0, P + 2.88, 0, 0.3, 0.06, 52, K);
      EDGE_ON = 0; for(let z = -22; z <= 22; z += 4) [-1.2, 1.2].forEach(x => flat(x, P + 2.895, z, 0.12, 1.2, '#F4EFD8', true, true)); EDGE_ON = e0;
      [-12, 4, 12].forEach(z => { box(g, -1.55, P + 0.42, z, 0.46, 0.07, 1.8, '#7A5C42'); box(g, -1.78, P + 0.72, z, 0.04, 0.5, 1.8, '#7A5C42');
        [-0.75, 0.75].forEach(d => { box(g, -1.55, P + 0.2, z + d, 0.42, 0.4, 0.05, K); box(g, -1.78, P + 0.6, z + d, 0.05, 0.3, 0.05, K); }); });
      [-16, 0, 16].forEach(z => { cyl(g, 0.45, P + 0.75, z + 0.4, 0.2, 0.18, 0.75, '#2F6E4F', 10); cyl(g, 0.45, P + 0.78, z + 0.4, 0.22, 0.22, 0.03, K, 10); });
      [-10, 10].forEach(z => { box(g, 1.0, P + 0.6, z, 0.12, 1.2, 0.12, ST); box(g, 1.0, P + 1.32, z, 0.28, 0.3, 0.24, '#E8B923'); box(g, 1.0, P + 1.32, z + 0.121, 0.18, 0.04, 0.004, K); });
      box(g, -1.6, P + 0.95, 18, 0.8, 1.9, 0.7, '#B4232C'); lit(-1.198, P + 1.25, 18, 0.006, 0.9, 0.56, '#E9EEF2'); box(g, -1.195, P + 0.55, 18, 0.01, 0.2, 0.4, K);
      // le panneau des départs (les horaires s'allument la nuit), le panneau du quai, l'horloge, le nom de la gare
      box(g, 0, P + 2.55, -2, 1.8, 0.62, 0.12, '#1D1F24'); box(g, 0, P + 2.88, -2, 0.06, 0.08, 0.06, K); pixText(g, 'DEPART', 0, P + 2.74, -1.935, 1, 0.026, LED);
      [['10:45', P + 2.56], ['11:02', P + 2.42]].forEach(([t, y]) => { pixText(g, t, -0.45, y, -1.935, 1, 0.022, LED); box(g, 0.4, y, -1.937, 0.7, 0.07, 0.004, '#3A3D44'); });
      [14, -20].forEach(z => { box(g, 0, P + 2.5, z, 1.4, 0.4, 0.08, BL); box(g, 0, P + 2.79, z, 0.06, 0.18, 0.06, K); pixText(g, 'QUAI 1', 0, P + 2.5, z + 0.045, 1, 0.03, '#F4F6F6'); pixText(g, 'QUAI 1', 0, P + 2.5, z - 0.045, -1, 0.03, '#F4F6F6'); });
      cyl(g, 0.13, P + 2.2, 8, 0.2, 0.2, 0.04, '#F4F6F6', 16, 'x'); cyl(g, 0.168, P + 2.2, 8, 0.17, 0.17, 0.005, '#2C2E33', 16, 'x'); cyl(g, 0.17, P + 2.2, 8, 0.165, 0.165, 0.004, '#F4F6F6', 16, 'x');
      box(g, 0.175, P + 2.26, 8, 0.004, 0.12, 0.012, K); box(g, 0.175, P + 2.2, 8.04, 0.004, 0.012, 0.08, K);
      [-17.6, -16.4].forEach(z => box(g, -2.27, P + 1.0, z, 0.06, 2.0, 0.08, ST)); box(g, -2.2, P + 1.85, -17, 0.08, 0.45, 1.8, BL); pixText(g, 'GARE', -17, P + 1.85, -2.155, 1, 0.05, '#F4F6F6', true); pixText(g, 'GARE', -17, P + 1.85, -2.245, -1, 0.05, '#F4F6F6', true);
      // la caténaire, la clôture
      for(let z = -36; z <= 36; z += 12) [-7.4, 7.4].forEach(x => { box(g, x, 3.2, z, 0.22, 6.4, 0.22, ST); box(g, x / 2 + Math.sign(x) * 0.9, 6.1, z, Math.abs(x) - 1.6, 0.12, 0.12, ST); });
      EDGE_ON = 0; [-4.6, 4.6].forEach(x => box(g, x, 6.025, 0, 0.025, 0.025, 80, '#3A3D44')); EDGE_ON = e0;
      [-9, 9].forEach(x => { for(let z = -36; z <= 36; z += 3) box(g, x, 0.75, z, 0.06, 1.5, 0.06, '#5E636C'); [0.5, 1.4].forEach(y => box(g, x, y, 0, 0.04, 0.05, 72, '#5E636C')); });
      // derrière, la ville : des immeubles et leurs fenêtres (la nuit, certaines s'éclairent), quelques arbres
      [[-1, -22, 12, 9], [-1, -2, 14, 13], [-1, 18, 10, 11], [1, 22, 14, 12]].forEach(([s, z, d, h], i) => { const x = s * 20, w = 7;
        box(g, x, h / 2, z, w, h, d, ['#B39C86', '#A6ACB4', '#C9B9A3', '#9A8B7E', '#BFA58A', '#8E7E72'][i]); box(g, x, h + 0.1, z, w + 0.2, 0.2, d + 0.2, '#8E8B85');
        const xf = x - s * (w / 2 + 0.02); MAT = 6; EDGE_ON = 0;
        for(let y = 1.4; y < h - 1.2; y += 3) for(let k = -d / 2 + 0.9; k < d / 2 - 1.4; k += 2.0) wall(g, s > 0 ? [xf, z + k] : [xf, z + k + 1.1], s > 0 ? [xf, z + k + 1.1] : [xf, z + k], 1.4, '#4F6275', y);
        MAT = 0; EDGE_ON = e0; });
      [-13, 13].forEach(x => [-28, -10, 10, 28].forEach(z => { cyl(g, x, 2, z, 0.18, 0.22, 2, '#5B4532', 8); ball(g, x, 3.2, z, 1.4, 1.5, 1.4, '#4E7C58', 9); }));
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
      for(let z = -12; z <= 4; z += 2.6) for(let y = 3.0; y < 8.5; y += 2.6){ wall(g, [-2.388, z + 0.45], [-2.388, z - 0.45], 1.3, '#3E4552', y - 0.65); wall(g, [2.388, z + 0.75], [2.388, z + 1.65], 1.3, '#3E4552', y + 0.35); }
      wall(g, [-2.4, -14], [2.4, -14], 9, '#7E7064');
      wall(g, [-0.8, -13.98], [0.2, -13.98], 2.2, '#4A3B33');
      // escalier de secours
      for(let y = 3.6; y < 9; y += 2.6){ box(g, 2.0, y, -3.2, 0.8, 0.05, 2.4, '#2C2E33'); box(g, 1.62, y + 0.45, -3.2, 0.04, 0.9, 2.4, '#2C2E33'); }
      for(let i = 0; i < 9; i++) box(g, 2.05, 1.8 + i * 0.2, -4.2 + i * 0.2, 0.6, 0.03, 0.12, '#2C2E33');
      [[1.72, 1.76], [2.34, 2.38]].forEach(([a, b]) => { prism(g, [[-4.32, 1.7], [-4.32, 1.86], [-2.44, 3.74], [-2.44, 3.58]], a, b, '#2C2E33'); prism(g, [[-4.32, 1.86], [-4.32, 1.7], [-2.44, 3.58], [-2.44, 3.74]], a, b, '#2C2E33'); });   // les limons
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
        wall(g, [-6.99, z + 2], [-6.99, z - 2], 2.4, '#7F98A8', 0.15); wall(g, [-6.98, z + 0.4], [-6.98, z - 0.5], 2.1, '#3A3024', 0.15);   // la vitrine (verre) et sa porte
        [z + 1.9, z + 1.0, z - 1.0, z - 1.9].forEach(m => wall(g, [-6.985, m + 0.05], [-6.985, m - 0.05], 2.4, '#2C2E33', 0.15));
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
      // l'enseigne TAXI sur le toit, en travers, lisible de devant et de derrière (comme les vrais)
      box(g, 0, 1.585, -0.3, 0.16, 0.05, 0.12, K);
      prism(g, [[-0.19, 1.61], [-0.41, 1.61], [-0.39, 1.83], [-0.21, 1.83]], -0.36, 0.36, '#F4EFD8'); box(g, 0, 1.835, -0.3, 0.72, 0.012, 0.2, Yd);
      pixText(g, 'TAXI', 0, 1.72, -0.186, 1, 0.022, K); pixText(g, 'TAXI', 0, 1.72, -0.414, -1, 0.022, K);
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
      [0.37, -0.37].forEach(x => { box(g, x, 0.44, 0.3, 0.54, 0.12, 0.5, S); box(g, x, 0.34, 0.3, 0.4, 0.08, 0.36, K); prism(g, [[0.05, 0.5], [-0.07, 0.5], [-0.12, 1.22], [0.0, 1.22]], x - 0.27, x + 0.27, S); box(g, x, 1.3, -0.06, 0.24, 0.14, 0.09, S); });
      box(g, 0, 0.44, -0.82, 1.62, 0.12, 0.56, S); prism(g, [[-1.05, 0.5], [-1.17, 0.5], [-1.24, 1.12], [-1.12, 1.12]], -0.81, 0.81, S);
      box(g, 0, 0.66, -0.4, 0.04, 0.72, 0.02, '#8C9199');                     // la vitre de séparation, posée sur le plancher
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
      pane(g, [-3.79, 1.2], [-3.79, -0.8], 1.4, '#A9C9DE', 0.9); wall(g, [-3.785, 1.25], [-3.785, -0.85], 0.06, '#F4F2EE', 0.87); wall(g, [-3.785, 0.23], [-3.785, 0.17], 1.4, '#F4F2EE', 0.9);
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
      pane(g, [4.49, -2.6], [4.49, 2.6], 2.0, '#A9C9DE', 0.5); for(let z = -2.6; z <= 2.61; z += 1.3) wall(g, [4.485, z - 0.03], [4.485, z + 0.03], 2.0, '#2C2E33', 0.5);
      wall(g, [-2.6, -3.49], [-0.4, -3.49], 1.0, '#26292F', 1.7); for(let i = 0; i < 4; i++) wall(g, [-2.4, -3.485], [-1.0 + (i % 2) * 0.3, -3.485], 0.03, '#E6E2DA', 2.45 - i * 0.18);
      // le comptoir, la machine à café, les tabourets
      box(g, -1.0, 0.52, -2.1, 3.6, 1.04, 0.6, '#6E5440'); box(g, -1.0, 1.06, -2.05, 3.7, 0.05, 0.75, '#3A3D44');
      box(g, -2.2, 1.28, -2.25, 0.5, 0.4, 0.4, '#A9AEB6'); box(g, -2.2, 1.12, -2.04, 0.3, 0.06, 0.06, '#2C2E33');
      box(g, -1.0, 1.0, -3.32, 3.8, 0.04, 0.35, '#6E5440'); box(g, -1.0, 1.7, -3.32, 3.8, 0.04, 0.35, '#6E5440');   // les étagères, contre le mur
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
  const m0 = MAT; MAT = 4;   // une carrosserie vernie
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
  MAT = m0;
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
/* des lettres en petits carrés (police 3 × 5), posées sur un plan vertical z, tournées vers +z (dir 1) ou -z (dir -1) */
const PIX = { T:['111', '010', '010', '010', '010'], A:['010', '101', '111', '101', '101'], X:['101', '101', '010', '101', '101'], I:['111', '010', '010', '010', '111'],
  P:['110', '101', '110', '100', '100'], O:['111', '101', '101', '101', '111'], L:['100', '100', '100', '100', '111'], C:['111', '100', '100', '100', '111'], E:['111', '100', '110', '100', '111'],
  B:['110', '101', '110', '101', '110'], N:['101', '111', '111', '111', '101'], Q:['111', '101', '101', '111', '001'], U:['101', '101', '101', '101', '111'], K:['101', '110', '100', '110', '101'], S:['111', '100', '111', '001', '111'], H:['101', '101', '111', '101', '101'], R:['110', '101', '110', '101', '101'], F:['111', '100', '110', '100', '100'], D:['110', '101', '101', '101', '110'], M:['101', '111', '111', '101', '101'], '0':['111', '101', '101', '101', '111'], '1':['010', '110', '010', '010', '111'], '2':['111', '001', '111', '100', '111'], '3':['111', '001', '111', '001', '111'], '4':['101', '101', '111', '001', '001'], '5':['111', '100', '111', '001', '111'], '6':['111', '100', '111', '101', '111'], '7':['111', '001', '001', '001', '001'], '8':['111', '101', '111', '101', '111'], '9':['111', '101', '111', '001', '111'], '.':['000', '000', '000', '000', '010'], ':':['000', '010', '000', '010', '000'], G:['111', '100', '101', '101', '111'], V:['101', '101', '101', '101', '010'], ' ':['000', '000', '000', '000', '000'] };
function pixText(g, text, cx, cy, z, dir, px, col, axisX){
  const w = text.length * 4 - 1, e0 = EDGE_ON; EDGE_ON = 0;
  [...text].forEach((ch, i) => (PIX[ch] || PIX[' ']).forEach((row, r) => [...row].forEach((b, c) => { if(b !== '1') return;
    const u = (i * 4 + c - (w - 1) / 2) * px * dir, v = cy + (2 - r) * px;
    // chaque pixel : une plaque vue des deux côtés (4 triangles au lieu des 12 d'un petit pavé : même image, bien plus léger)
    const h = px * 0.46, C = hexRGB(col), m0 = MAT; if(MAT === 0 && isLight(C, px)) MAT = 5;
    if(axisX){ const X = z, Z = cx - u; quad(g, [X, v - h, Z + h], [X, v - h, Z - h], [X, v + h, Z - h], [X, v + h, Z + h], C); quad(g, [X, v - h, Z - h], [X, v - h, Z + h], [X, v + h, Z + h], [X, v + h, Z - h], C); }
    else { const X = cx + u; quad(g, [X - h, v - h, z], [X + h, v - h, z], [X + h, v + h, z], [X - h, v + h, z], C); quad(g, [X + h, v - h, z], [X - h, v - h, z], [X - h, v + h, z], [X + h, v + h, z], C); }
    MAT = m0; })));
  EDGE_ON = e0;
}
/* une porte sur un mur vertical en x (vue de l'intérieur, côté faceX) : le battant, son encadrement, sa poignée */
function doorX(g, x, z, w, h, col, faceX, frame){
  const i = -faceX, A = [x + i * 0.012, z - w / 2], B = [x + i * 0.012, z + w / 2];
  if(faceX > 0) wall(g, B, A, h, col); else wall(g, A, B, h, col);
  const F = frame || '#E9ECEE';
  [-1, 1].forEach(sd => box(g, x + i * 0.03, h / 2, z + sd * (w / 2 + 0.03), 0.06, h + 0.06, 0.06, F));
  box(g, x + i * 0.03, h + 0.03, z, 0.06, 0.06, w + 0.12, F);
  box(g, x + i * 0.04, h * 0.48, z + w / 2 - 0.12, 0.04, 0.03, 0.12, '#C9CDD3');
}
function facade(g, x, z0, z1, h, col, faceX, shop){
  const A = faceX > 0 ? [x, z0] : [x, z1], B = faceX > 0 ? [x, z1] : [x, z0];
  // le mur est vu de la rue (il regarde vers faceX)
  if(faceX < 0) wall(g, [x, z0], [x, z1], h, col); else wall(g, [x, z1], [x, z0], h, col);
  const off = x + faceX * 0.012, len = Math.abs(z1 - z0), zs = Math.min(z0, z1);   // fenêtres et vitrines juste devant la façade (côté rue)
  for(let y = 3.6; y < h - 1.4; y += 3.0) for(let k = 0.9; k < len - 0.9; k += 2.2){
    const a = zs + k, b = zs + k + 1.1;
    MAT = 6; if(faceX < 0) wall(g, [off, a], [off, b], 1.5, '#4F6275', y); else wall(g, [off, b], [off, a], 1.5, '#4F6275', y); MAT = 0;   // (la nuit, certaines s'éclairent)
    const o2 = off + faceX * 0.004;   // le rebord clair sous la fenêtre, et la croisée
    if(faceX < 0){ wall(g, [o2, a - 0.06], [o2, b + 0.06], 0.08, '#E4E0D8', y - 0.08); wall(g, [o2, (a + b) / 2 - 0.025], [o2, (a + b) / 2 + 0.025], 1.5, '#D9D5CC', y); }
    else { wall(g, [o2, b + 0.06], [o2, a - 0.06], 0.08, '#E4E0D8', y - 0.08); wall(g, [o2, (a + b) / 2 + 0.025], [o2, (a + b) / 2 - 0.025], 1.5, '#D9D5CC', y); }
  }
  if(shop){
    // la vitrine : du verre bleuté, éclairé de l'intérieur, des montants sombres et une porte
    if(faceX < 0) wall(g, [off, zs + 0.6], [off, zs + len - 0.6], 2.3, '#7F98A8', 0.2); else wall(g, [off, zs + len - 0.6], [off, zs + 0.6], 2.3, '#7F98A8', 0.2);
    const o2 = off + faceX * 0.004;
    for(let m = zs + 0.6; m <= zs + len - 0.6 + 0.01; m += (len - 1.2) / 4){ if(faceX < 0) wall(g, [o2, m - 0.05], [o2, m + 0.05], 2.3, '#2C2E33', 0.2); else wall(g, [o2, m + 0.05], [o2, m - 0.05], 2.3, '#2C2E33', 0.2); }
    if(faceX < 0) wall(g, [o2, zs + 0.6], [o2, zs + len - 0.6], 0.1, '#2C2E33', 2.4); else wall(g, [o2, zs + len - 0.6], [o2, zs + 0.6], 0.1, '#2C2E33', 2.4);
    const dz = zs + len / 2; if(faceX < 0) wall(g, [o2, dz - 0.55], [o2, dz + 0.55], 2.15, '#3A3024', 0.2); else wall(g, [o2, dz + 0.55], [o2, dz - 0.55], 2.15, '#3A3024', 0.2);
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
      box(g, 6.3, 0.48, -8, 0.4, 0.05, 2.2, '#8A6A4A'); [-8.9, -7.1].forEach(z => box(g, 6.3, 0.23, z, 0.05, 0.46, 0.05, '#2C2E33'));   // le banc de l'abribus, sur ses pieds
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
      [-13.93, -13.07].forEach(x => box(g, x, 1.15, 7.05, 0.06, 2.3, 0.06, '#E9E6E0'));   // les montants de l'échelle
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
      // les couches du sol sont espacées de quelques centimètres (et non de quelques millimètres) :
      // vues de loin, elles ne se disputent plus la même profondeur et ne scintillent plus
      floor(g, -200, -200, 200, 200, -0.03, '#7C9A5A');
      // les champs de chaque côté de la route ; les sillons, de simples bandes posées dessus, seulement près de la route
      // (au loin, des traits si fins papillotent)
      [[-60, -120, -6, -40, '#C9B26A'], [-60, -40, -6, 20, '#5F7F48'], [-60, 20, -6, 120, '#8A6F52'], [6, -120, 70, -10, '#6E8F50'], [6, -10, 70, 60, '#C9B26A'], [6, 60, 70, 140, '#5F7F48']].forEach(([x0, z0, x1, z1, c], k) => {
        floor(g, x0, z0, x1, z1, 0, c);
        const dc = hexRGB(c).map(v => v * 0.9), za = Math.max(z0 + 0.5, -45), zb = Math.min(z1 - 0.5, 45);
        if(zb > za) for(let x = x0 + 1; x < x1; x += 1.6) if(Math.abs(x) < 45) floor(g, x - 0.125, za, x + 0.125, zb, 0.025, dc);
      });
      floor(g, -3.3, -200, 3.3, 200, 0, '#55595F'); [-4.2, 4.2].forEach(x => floor(g, x - 0.9, -200, x + 0.9, 200, 0, '#A69B85'));
      for(let z = -196; z < 200; z += 8) floor(g, -0.07, z - 2, 0.07, z + 2, 0.025, '#E6E0C4');
      [-3.1, 3.1].forEach(x => floor(g, x - 0.06, -200, x + 0.06, 200, 0.025, '#E6E0C4'));
      // clôtures, poteaux électriques, arbres le long de la route
      for(let z = -80; z <= 80; z += 2.5) [-5.6, 5.6].forEach(x => box(g, x, 0.5, z, 0.1, 1.0, 0.1, '#7A5C42'));
      [-5.6, 5.6].forEach(x => [0.45, 0.85].forEach(y => box(g, x, y, 0, 0.05, 0.08, 160, '#8A6A4A')));
      for(let z = -150; z <= 150; z += 30){ cyl(g, 7.5, 8, z, 0.12, 0.14, 8, '#6B4E37', 6); box(g, 7.5, 7.6, z, 1.4, 0.1, 0.1, '#6B4E37'); }
      [7.0, 8.0].forEach(x => box(g, x, 7.62, 0, 0.02, 0.02, 300, '#2C2E33'));
      for(let z = -120; z <= 120; z += 14){ cyl(g, -8.5, 0.9, z + 4, 0.13, 0.17, 0.9, '#6B4E37', 6); ball(g, -8.5, 4.5, z + 4, 1.2, 4.2, 1.2, '#4E7C58', 8); }
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
/* ---------- L'aérodrome et la forêt ----------
   L'aérodrome : une piste, un hangar ouvert, une tour de contrôle vitrée, une aire pour l'hélicoptère.
   La forêt : une clairière, un sentier, un ruisseau, une cabane de bois, un feu de camp. */
const wall2 = (g, a, b, h, col, y0) => { wall(g, a, b, h, col, y0); wall(g, b, a, h, col, y0); };
function pine(g, x, z, k, c){ c = c || '#3F6B4A'; cyl(g, x, 1.2 * k, z, 0.12 * k, 0.16 * k, 1.2 * k, '#5E4532', 6);
  [[1.2, 1.25, 2.2], [2.6, 0.95, 1.9], [3.8, 0.62, 1.6]].forEach(([y, r, h], i) => cyl(g, x, (y + h) * k, z, 0.02, r * k, h * k, hexRGB(c).map(v => v * (1 + i * 0.07)), 6)); }
Object.assign(SET_DEF, {
  airfield:{
    sky:{ top:'#7FAEDB', hor:'#E9EDEE', low:'#9DAA90' }, fog:[70, 320],
    cam:{ tx:-0.9, ty:1.2, tz:4.7, yaw:-62, pitch:-4, dist:6.5, lens:28 },
    build(g, gl){
      floor(g, -260, -260, 260, 260, 0, '#86A062');
      // la piste (dans l'axe z), ses marques, la voie de circulation
      floor(g, 6, -230, 30, 230, 0.01, '#5A5E64');
      for(let z = -220; z <= 220; z += 14) box(g, 18, 0.016, z, 0.5, 0.006, 7, '#EDEAE0');
      [6.6, 29.4].forEach(x => box(g, x, 0.016, 0, 0.3, 0.006, 460, '#EDEAE0'));
      for(let i = 0; i < 8; i++) [-218, 218].forEach(z => box(g, 8.5 + i * 2.6 + (i > 3 ? 2 : 0), 0.016, z, 1.2, 0.006, 12, '#EDEAE0'));
      floor(g, -24, -9, 6, -3, 0.012, '#62666C'); box(g, -9, 0.017, -6, 30, 0.006, 0.18, '#E8B923');
      floor(g, -24, -3, 6, 12, 0.011, '#6A6E73');   // le tarmac devant le hangar
      // l'aire de l'hélicoptère : un cercle et un H
      cyl(g, -6, 0.025, 8, 6, 6, 0.012, '#4E5257', 24);
      for(let i = 0; i < 32; i++){ const a0 = i / 32 * 6.2832, a1 = (i + 1) / 32 * 6.2832, P = (r, t) => [-6 + Math.cos(t) * r, 0.04, 8 + Math.sin(t) * r]; quad(g, P(5.1, a0), P(5.1, a1), P(5.4, a1), P(5.4, a0), hexRGB('#E8B923')); }
      box(g, -7.3, 0.04, 8, 0.6, 0.012, 4, '#EDEAE0'); box(g, -4.7, 0.04, 8, 0.6, 0.012, 4, '#EDEAE0'); box(g, -6, 0.04, 8, 2, 0.012, 0.6, '#EDEAE0');
      // le hangar, ouvert vers +x (on peut entrer)
      const HX0 = -30, HX1 = -16, HZ0 = -16, HZ1 = -2, HH = 7;
      floor(g, HX0, HZ0, HX1, HZ1, 0.02, '#8D9198');
      wall2(g, [HX0, HZ0], [HX1, HZ0], HH, '#B9BEC4'); wall2(g, [HX1, HZ1], [HX0, HZ1], HH, '#B9BEC4'); wall2(g, [HX0, HZ1], [HX0, HZ0], HH, '#AEB3BA');
      for(let z = HZ0 + 0.5; z < HZ1; z += 1.2) [HX0 + 0.02, HX0 - 0.02].forEach(x => box(g, x, HH / 2, z, 0.02, HH, 0.06, '#9EA3AA'));
      prism(g, [[HZ0 - 0.3, HH], [HZ1 + 0.3, HH], [(HZ0 + HZ1) / 2, HH + 2.2]], HX0 - 0.3, HX1 + 0.3, '#7C828B');
      prism(g, [[HZ1 + 0.3, HH], [HZ0 - 0.3, HH], [(HZ0 + HZ1) / 2, HH + 2.1]], HX0 - 0.2, HX1 + 0.2, '#C9CCD1');   // le dessous du toit
      [HZ0 + 0.15, HZ1 - 0.15].forEach(z => box(g, HX1, HH / 2, z, 0.4, HH, 0.3, '#6E747C'));
      box(g, HX1 + 0.3, HH - 0.4, (HZ0 + HZ1) / 2, 0.2, 0.8, HZ1 - HZ0 + 0.4, '#3D5A80');
      // l'atelier dans le hangar : établi, fûts, caisses, chariot à outils
      box(g, HX0 + 0.6, 0.48, -9, 0.9, 0.96, 4, '#7A5C42'); [-11.5, -11, -10.5].forEach((z, i) => cyl(g, HX0 + 0.7, 0.92, z - 2, 0.3, 0.3, 0.9, ['#B4232C', '#3D5A80', '#E8B923'][i], 10));
      [[-20, -14.5], [-21.2, -14.5], [-20.6, -14.5]].forEach(([x, z], i) => box(g, x, i === 2 ? 1.5 : 0.5, z, 1, 1, 1, '#A88A5E'));
      // la tour de contrôle, et sa vigie vitrée
      box(g, -38, 4, 10, 4, 8, 4, '#E3DED4'); box(g, -38, 8.1, 10, 5.4, 0.2, 5.4, '#8D9198');
      [[-40.6, 7.4], [-35.4, 7.4], [-40.6, 12.6], [-35.4, 12.6]].forEach(([x, z]) => box(g, x, 9.3, z, 0.15, 2.2, 0.15, '#2C2E33'));
      box(g, -38, 10.5, 10, 5.6, 0.25, 5.6, '#5E636C'); box(g, -38, 11.1, 10, 0.08, 1.0, 0.08, '#2C2E33');
      gl && [[[-40.6, 7.4], [-35.4, 7.4]], [[-35.4, 7.4], [-35.4, 12.6]], [[-35.4, 12.6], [-40.6, 12.6]], [[-40.6, 12.6], [-40.6, 7.4]]].forEach(([a, b]) => wall(gl, a, b, 2.2, '#A9C4D2', 8.2));
      wall(g, [-36.01, 9.4], [-36.01, 10.6], 2.1, '#6E5440');
      // la manche à air, les balises, la clôture, un camion-citerne
      box(g, 36, 3, -40, 0.1, 6, 0.1, '#D9D6CF'); cyl(g, 36, 5.8, -40.3, 0.32, 0.16, 1.8, '#E26A2C', 8, 'z');
      for(let z = -220; z <= 220; z += 20) [4.8, 31.2].forEach(x => box(g, x, 0.25, z, 0.18, 0.5, 0.18, '#E8B923'));
      for(let z = -60; z <= 60; z += 3) box(g, -50, 1, z, 0.08, 2, 0.08, '#7C828B'); [0.3, 1.0, 1.9].forEach(y => box(g, -50, y, 0, 0.03, 0.04, 120, '#9AA0A8'));
      // le camion-citerne : la cabine devant, la citerne posée sur le châssis, les roues sous le châssis
      box(g, -12, 0.6, 2.4, 2.0, 0.3, 7.2, '#2C2E33'); box(g, -12, 1.65, -0.3, 2.2, 1.8, 1.8, '#B4232C'); box(g, -12, 2.05, -1.21, 1.9, 0.7, 0.02, '#A9C4D2');
      cyl(g, -12, 1.7, 0.9, 0.95, 0.95, 5.4, '#D9D6CF', 12, 'z'); [-0.3, 3.2, 4.8].forEach(z => [-13.1, -11.2].forEach(x => cyl(g, x, 0.45, z, 0.45, 0.45, 0.3, '#17181B', 10, 'x')));
      // les collines au loin, des arbres
      [[-120, -200, 90, 26, '#6E8F5A'], [130, -180, 80, 22, '#76966A'], [-160, 120, 80, 24, '#6E8F5A'], [150, 160, 90, 20, '#76966A']].forEach(([x, z, r, h, c]) => ball(g, x, 0, z, r, h, r, c, 14));
      [[-60, -30], [-64, -20], [-58, 30], [-66, 40], [60, -60], [62, 20], [58, 70]].forEach(([x, z], i) => tree(g, x, z, 1.2 + (i % 3) * 0.2));
    },
  },
  forest:{
    sky:{ top:'#93B4C8', hor:'#D9E0D8', low:'#6E8064' }, fog:[18, 90],
    cam:{ tx:0, ty:1.1, tz:0.5, yaw:-20, pitch:-4, dist:7, lens:28 },
    build(g, gl){
      floor(g, -150, -150, 150, 150, 0, '#56703F');
      // la clairière, le sentier qui la traverse, le ruisseau
      cyl(g, 0, 0.006, 0, 9, 9, 0.004, '#7D8A4E', 18);
      for(let i = -40; i < 40; i++){ const z = i * 1.5, x = Math.sin(z * 0.08) * 2.5; box(g, x, 0.009, z, 1.4, 0.004, 1.7, '#8E7A5A', Math.cos(z * 0.08) * 0.2); }
      for(let i = -40; i < 40; i++){ const z = i * 1.5, x = 9 + Math.sin(z * 0.1 + 1) * 1.6; box(g, x, 0.012, z, 1.6, 0.004, 1.8, '#4C7186', Math.cos(z * 0.1 + 1) * 0.16); [-1, 1].forEach(sd => ball(g, x + sd * 0.95, 0.05, z, 0.25, 0.14, 0.4, '#8C8A84', 5)); }
      box(g, 9, 0.12, 2, 2.6, 0.08, 1.2, '#7A5C42'); [7.85, 10.15].forEach(x => box(g, x, 0.04, 2, 0.3, 0.08, 1.3, '#5E4532'));   // une passerelle, posée sur les berges
      [-0.56, 0.56].forEach(dz => { box(g, 9, 0.86, 2 + dz, 2.6, 0.06, 0.06, '#6E5440'); [7.8, 9, 10.2].forEach(x => box(g, x, 0.51, 2 + dz, 0.06, 0.7, 0.06, '#6E5440')); });
      // le feu de camp, les rondins autour
      cyl(g, -1.6, 0.1, -1.8, 0.55, 0.6, 0.1, '#6F6A63', 10); for(let i = 0; i < 5; i++) box(g, -1.6, 0.15, -1.8, 0.08, 0.08, 0.9, '#4A3626', i * 0.63);
      ball(g, -1.6, 0.32, -1.8, 0.25, 0.32, 0.25, '#E8823A', 6); ball(g, -1.6, 0.26, -1.8, 0.16, 0.2, 0.16, '#F3C64A', 6);
      [[-1.6, -3.1, 0], [-3.0, -1.6, Math.PI / 2], [-0.2, -1.2, 1.1]].forEach(([x, z, r]) => { cyl(g, x - Math.sin(r) * 0, 0.22, z, 0.22, 0.22, 1.8, '#6B4E37', 9, 'x'); });
      // la cabane de bois (on peut entrer : la porte est ouverte)
      const CX0 = -9, CX1 = -4, CZ0 = 3, CZ1 = 8, CH = 2.5;
      floor(g, CX0, CZ0, CX1, CZ1, 0.15, '#8A6A4A'); box(g, (CX0 + CX1) / 2, 0.07, (CZ0 + CZ1) / 2, CX1 - CX0 + 0.3, 0.14, CZ1 - CZ0 + 0.3, '#5E4532');
      partition(g, [CX0, CZ0], [CX1, CZ0], 0.15, CH, '#8A6545', [[1.8, 2.8]]);
      partition(g, [CX1, CZ0], [CX1, CZ1], 0.15, CH, '#7F5C3E', [[1.6, 3.2]]);
      partition(g, [CX1, CZ1], [CX0, CZ1], 0.15, CH, '#8A6545');
      partition(g, [CX0, CZ1], [CX0, CZ0], 0.15, CH, '#7F5C3E', [[2.0, 3.0]]);
      for(let y = 0.4; y < CH; y += 0.32) [[CX0 - 0.06, 'z'], [CX1 + 0.06, 'z']].forEach(([x]) => box(g, x, y, (CZ0 + CZ1) / 2, 0.04, 0.03, CZ1 - CZ0, '#5E4532'));
      prism(g, [[CZ0 - 0.5, CH + 0.1], [CZ1 + 0.5, CH + 0.1], [(CZ0 + CZ1) / 2, CH + 1.9]], CX0 - 0.5, CX1 + 0.5, '#4E3B2C'); prism(g, [[CZ1 + 0.5, CH + 0.1], [CZ0 - 0.5, CH + 0.1], [(CZ0 + CZ1) / 2, CH + 1.8]], CX0 - 0.4, CX1 + 0.4, '#6E5440');
      gl && [[CZ0 + 1.8, CZ0 + 2.8]].forEach(([a, b]) => wall2(gl, [CX0 + 0.02, a], [CX0 + 0.02, b], 0.8, '#A9C4D2', 1.2));
      box(g, CX0 + 0.8, 0.88, CZ1 - 1, 1.2, 0.06, 0.7, '#6E5440'); [[-0.52, -0.28], [0.52, -0.28], [-0.52, 0.28], [0.52, 0.28]].forEach(([a, b]) => box(g, CX0 + 0.8 + a, 0.5, CZ1 - 1 + b, 0.06, 0.7, 0.06, '#5E4532'));
      box(g, CX0 + 0.8, 0.6, CZ1 - 1.75, 0.4, 0.05, 0.4, '#6E5440'); [[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]].forEach(([a, b]) => box(g, CX0 + 0.8 + a, 0.37, CZ1 - 1.75 + b, 0.04, 0.44, 0.04, '#5E4532'));
      box(g, CX1 - 0.6, 0.27, CZ1 - 1.2, 0.95, 0.24, 1.95, '#5E4532'); box(g, CX1 - 0.6, 0.48, CZ1 - 1.2, 0.9, 0.18, 1.9, '#3D5A80'); box(g, CX0 + 0.5, 1.0, CZ0 + 0.6, 0.6, 1.7, 0.5, '#4A3626');
      // les sapins tout autour, plus serrés au loin, quelques rochers et souches
      let r = 7;
      const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
      for(let i = 0; i < 160; i++){ const a = rnd() * Math.PI * 2, d = 11 + rnd() * 48, x = Math.cos(a) * d, z = Math.sin(a) * d;
        if(Math.abs(x - Math.sin(z * 0.08) * 2.5) < 2 || Math.abs(x - 9) < 3 || (x > -11 && x < -2 && z > 1 && z < 10) || Math.hypot(x + 12, z + 10) < 4) continue;
        const k = 1.4 + rnd() * 1.3; (i % 7 === 0 ? tree(g, x, z, k * 0.8, '#55804E', '#61905A') : pine(g, x, z, k, ['#3F6B4A', '#355E42', '#48744F'][i % 3])); }
      [[3, -5, 0.6], [-6, -6, 0.9], [4.5, 6, 0.5], [12, -9, 1.1]].forEach(([x, z, k]) => ball(g, x, 0.2 * k, z, 0.9 * k, 0.55 * k, 0.7 * k, '#8C8A84', 7));
      [[5, -1.5], [-5.5, 0], [2, 7.5]].forEach(([x, z]) => cyl(g, x, 0.35, z, 0.3, 0.34, 0.35, '#6B4E37', 9));
      for(let i = 0; i < 40; i++){ const a = rnd() * 6.28, d = 6 + rnd() * 10, x = Math.cos(a) * d, z = Math.sin(a) * d; if((x > -10 && x < -3 && z > 2 && z < 9) || Math.abs(x - Math.sin(z * 0.08) * 2.5) < 1.2 || Math.abs(x - 9) < 1.6) continue; ball(g, x, 0.2, z, 0.5, 0.35, 0.5, '#4C7A46', 6); }
    },
  },
});
/* les trois voitures-box du diner : leur position le long du mur et leur couleur */
const DINER_CARS = [[-3.25, '#C2253A'], [0, '#E8B923'], [3.25, '#3FA9C4']];
/* ---------- La chambre d'hôtel, le parking souterrain, le diner des années 50 ----------
   Trois lieux fermés : la caméra y reste dans la pièce où l'on vise (voir 04-scene.js). */
Object.assign(SET_DEF, {
  hotel:{
    cam:{ tx:-0.9, ty:0.95, tz:0.6, yaw:-140, pitch:-10, dist:3.6, lens:24 },
    roomH:2.7,
    rooms:[['Chambre', 'Bedroom', 0, [-3.5, -3, 1.6, 3]], ['Entrée', 'Entry', 0, [1.6, -3, 3.5, 0]], ['Salle de bain', 'Bathroom', 0, [1.6, 0, 3.5, 3]]],
    build(g, gl){
      const X0 = -3.5, X1 = 3.5, Z0 = -3, Z1 = 3, H = 2.7, WL = '#E4DCCF';
      floor(g, X0, Z0, X1, Z1, 0, '#6F6158'); floor(g, X0, Z0, X1, Z1, H, '#F1EEE8', true);
      wall(g, [X0, Z0], [X1, Z0], H, WL); wall(g, [X0, Z1], [X0, Z0], H, '#DDD4C6'); wall(g, [X1, Z0], [X1, Z1], H, '#DDD4C6'); wall(g, [X1, Z1], [X0, Z1], H, WL);
      partition(g, [1.6, Z0], [1.6, Z1], 0, H, WL, [[0.5, 1.3]]);
      partition(g, [1.6, 0], [X1, 0], 0, H, WL, [[0.3, 1.25]]);
      // la porte de la chambre et son numéro, la penderie
      wall(g, [2.2, Z0 + 0.01], [3.2, Z0 + 0.01], 2.1, '#5E4532'); wall(g, [2.55, Z0 + 0.015], [2.85, Z0 + 0.015], 0.12, '#C9A64B', 1.55);
      box(g, 3.2, 1.1, -1.4, 0.55, 2.2, 1.3, '#7A5C42'); box(g, 2.93, 1.1, -1.4, 0.01, 2.0, 0.02, '#4A3626');
      // la grande fenêtre et ses rideaux
      pane(g, [X0 + 0.01, 1.4], [X0 + 0.01, -1.6], 1.7, '#9FC0D4', 0.6);
      [[1.75, 1.2], [-1.95, -1.6]].forEach(([z, z2]) => box(g, X0 + 0.08, 1.3, (z + z2) / 2, 0.06, 2.4, Math.abs(z - z2) * 0.4 + 0.35, '#8C3B3F'));
      box(g, X0 + 0.03, 2.52, -0.1, 0.05, 0.06, 3.6, '#2C2E33');   // la tringle, fixée au mur
      // le grand lit, sa tête de lit, les tables de chevet et leurs lampes
      box(g, -1.0, 0.2, 1.95, 1.85, 0.4, 2.1, '#4A3626'); box(g, -1.0, 0.5, 1.95, 1.8, 0.2, 2.05, '#F4F2EE');
      box(g, -1.0, 0.63, 1.55, 1.84, 0.06, 1.35, '#2E4A6B'); [-1.45, -0.55].forEach(x => box(g, x, 0.68, 2.7, 0.7, 0.16, 0.4, '#F7F5F0'));
      box(g, -1.0, 1.05, 2.97, 2.3, 1.1, 0.06, '#6E5440');
      [-2.4, 0.4].forEach(x => { box(g, x, 0.27, 2.75, 0.5, 0.54, 0.42, '#5E4532'); cyl(g, x, 0.62, 2.75, 0.06, 0.08, 0.08, '#C9A64B', 8); cyl(g, x, 0.88, 2.75, 0.12, 0.18, 0.26, '#F2E6C9', 10); });
      box(g, -1.0, 1.85, 2.96, 1.3, 0.75, 0.03, '#C9B48F'); box(g, -1.0, 1.85, 2.945, 1.18, 0.63, 0.01, '#5F7F8E');
      // le bureau, sa chaise, la télé, le fauteuil près de la fenêtre, la valise
      box(g, 1.25, 0.74, 0.9, 0.6, 0.05, 1.3, '#5E4532'); [[1.0, 0.3], [1.5, 0.3], [1.0, 1.5], [1.5, 1.5]].forEach(([x, z]) => box(g, x, 0.36, z, 0.05, 0.72, 0.05, '#4A3626'));
      box(g, 0.75, 0.45, 0.9, 0.45, 0.06, 0.45, '#3A3D44'); [[0.55, 0.7], [0.95, 0.7], [0.55, 1.1], [0.95, 1.1]].forEach(([x, z]) => box(g, x, 0.21, z, 0.04, 0.42, 0.04, '#2C2E33')); box(g, 0.53, 0.75, 0.9, 0.05, 0.55, 0.45, '#3A3D44');
      box(g, 1.52, 1.45, 0.9, 0.05, 0.6, 1.0, '#1E1F23'); box(g, 1.495, 1.45, 0.9, 0.01, 0.52, 0.92, '#2E3846');
      box(g, -2.9, 0.22, -2.3, 0.8, 0.44, 0.8, '#7C6A8E'); box(g, -3.25, 0.62, -2.3, 0.14, 0.5, 0.8, '#7C6A8E'); [-2.64, -1.96].forEach(z => box(g, -2.9, 0.52, z, 0.8, 0.2, 0.12, '#6E5C80'));   // les accoudoirs, de chaque côté de l'assise
      cyl(g, -2.6, 0.55, -1.5, 0.3, 0.3, 0.03, '#5E4532', 12); cyl(g, -2.6, 0.53, -1.5, 0.03, 0.03, 0.53, '#2C2E33', 6);
      box(g, 0.95, 0.26, -2.6, 0.75, 0.5, 0.28, '#B4232C'); box(g, 0.95, 0.55, -2.6, 0.3, 0.08, 0.04, '#2C2E33'); [0.68, 1.22].forEach(x => box(g, x, 0.005, -2.6, 0.05, 0.01, 0.2, '#2C2E33'));   // la valise, rangée dans la chambre (la porte de la salle de bain reste libre)
      floor(g, -2.6, -1.1, 0.6, 0.85, 0.006, '#9A7B67');
      cyl(g, -0.9, 2.7, 0, 0.25, 0.3, 0.06, '#F4F2EE', 12);   // contre le plafond
      // la salle de bain : carrelage, baignoire, lavabo et miroir, toilettes
      floor(g, 1.65, 0.05, X1, Z1, 0.005, '#D9DEE3');
      for(let x = 1.9; x < X1; x += 0.3) box(g, x, 0.008, 1.5, 0.008, 0.003, 2.9, '#C2C8CF');
      box(g, 2.55, 0.28, 2.6, 1.8, 0.56, 0.75, '#F4F2EE'); box(g, 2.55, 0.5, 2.6, 1.6, 0.14, 0.58, '#C9D3DC');
      box(g, 3.3, 0.85, 1.2, 0.4, 0.12, 0.6, '#F4F2EE'); box(g, 3.35, 0.4, 1.2, 0.3, 0.8, 0.5, '#E3E6EA'); wall(g, [X1 - 0.01, 0.85], [X1 - 0.01, 1.55], 0.8, '#B9D3E1', 1.1);
      box(g, 3.25, 0.22, 0.4, 0.38, 0.44, 0.5, '#F4F2EE'); box(g, 3.42, 0.6, 0.4, 0.15, 0.4, 0.45, '#F4F2EE');
    },
  },
  parking:{
    cam:{ tx:0, ty:1.1, tz:0, yaw:-35, pitch:-6, dist:7, lens:24 },
    roomH:2.6,
    rooms:[['Parking', 'Car park', 0, [-14, -10, 14, 10]]],
    build(g, gl){
      const X = 14, Z = 10, H = 2.6;
      floor(g, -X, -Z, X, Z, 0, '#75787E'); floor(g, -X, -Z, X, Z, H, '#8E9197', true);
      wall(g, [-X, -Z], [X, -Z], H, '#A3A6AC'); wall(g, [-X, Z], [-X, -Z], H, '#9A9DA3'); wall(g, [X, -Z], [X, Z], H, '#9A9DA3'); wall(g, [X, Z], [-X, Z], H, '#A3A6AC');
      // la bande jaune et la bande grise le long des murs, les numéros de places
      [[[-X, -Z + 0.01], [X, -Z + 0.01]], [[X, Z - 0.01], [-X, Z - 0.01]], [[-X + 0.01, Z], [-X + 0.01, -Z]], [[X - 0.01, -Z], [X - 0.01, Z]]].forEach(([a, b]) => { wall(g, a, b, 0.35, '#E8B923', 0.9); wall(g, a, b, 0.9, '#5E636C', 0); });
      // l'allée au milieu et ses flèches, les places de chaque côté
      floor(g, -X, -2.6, X, 2.6, 0.004, '#6A6D73');
      for(let x = -12; x <= 12; x += 6){ box(g, x, 0.008, 0, 1.2, 0.004, 0.16, '#E6E2D6'); box(g, x + 0.62, 0.008, 0.12, 0.34, 0.004, 0.12, '#E6E2D6', 0.6); box(g, x + 0.62, 0.008, -0.12, 0.34, 0.004, 0.12, '#E6E2D6', -0.6); }
      for(let x = -13.6; x <= 13.7; x += 2.7) [-1, 1].forEach(sd => box(g, x, 0.008, sd * 6.3, 0.1, 0.004, 4.6, '#E6E2D6'));
      // les piliers, avec leur bande jaune et noire
      for(let x = -10.8; x <= 10.9; x += 5.4) [-2.95, 2.95].forEach(z => { box(g, x, H / 2, z, 0.5, H, 0.5, '#B9BCC1'); for(let k = 0; k < 4; k++) box(g, x, 0.12 + k * 0.24, z, 0.52, 0.12, 0.52, k % 2 ? '#24262B' : '#E8B923'); });
      // les voitures garées
      const cols = ['#B4232C', '#2E3A4E', '#D9D6CF', '#3D5A80', '#24262B', '#5F7F48', '#C9B48F', '#8A8D93'];
      let k = 0;
      for(let x = -12.25; x <= 12.3; x += 2.7) [-1, 1].forEach(sd => { k++; if(k % 3 === 1) return; car(g, gl, x, sd * 6.0, cols[k % cols.length], sd > 0); });
      // les néons, les tuyaux, la sortie, l'ascenseur
      for(let x = -12; x <= 12; x += 4) [-1.4, 1.4].forEach(z => { box(g, x, H - 0.04, z, 1.25, 0.05, 0.12, '#F4F6F2'); box(g, x, H - 0.015, z, 1.3, 0.03, 0.18, '#5E636C'); });
      [[-6.5, '#B4232C'], [-6.85, '#3D5A80']].forEach(([z, c]) => cyl(g, -X, H - 0.25, z, 0.09, 0.09, 2 * X, c, 8, 'x'));
      wall(g, [-X + 0.02, 1.0], [-X + 0.02, -1.0], 2.15, '#9AA0A8'); wall(g, [-X + 0.025, 0.02], [-X + 0.025, -0.02], 2.15, '#6E747C');
      box(g, -X + 0.02, 1.2, 1.3, 0.04, 0.16, 0.1, '#2C2E33'); box(g, -X + 0.03, 2.35, 0, 0.06, 0.18, 0.7, '#2F9E44');
      box(g, X - 0.03, 2.35, -6, 0.06, 0.18, 0.7, '#2F9E44');
    },
  },
  diner:{
    cam:{ tx:-1.5, ty:1.0, tz:0, yaw:-120, pitch:-8, dist:5.5, lens:24 },
    roomH:3.4,
    rooms:[['Le diner', 'The diner', 0, [-7, -5, 7, 5]]],
    build(g, gl){
      const X = 7, Z = 5, H = 3.4;
      floor(g, -X, -Z, X, Z, 0, '#1E1D22'); floor(g, -X, -Z, X, Z, H, '#17161C', true);
      // le damier noir et blanc
      for(let x = -X; x < X - 0.01; x += 0.7) for(let z = -Z; z < Z - 0.01; z += 0.7) if((Math.round((x + X) / 0.7) + Math.round((z + Z) / 0.7)) % 2 === 0) floor(g, x, z, x + 0.7, z + 0.7, 0.004, '#ECE8E1');
      wall(g, [-X, -Z], [X, -Z], H, '#5A1E2A'); wall(g, [-X, Z], [-X, -Z], H, '#4A1A26'); wall(g, [X, -Z], [X, Z], H, '#4A1A26'); wall(g, [X, Z], [-X, Z], H, '#5A1E2A');
      // les néons roses et bleus sous le plafond, les affiches de films
      [[[-X + 0.02, Z], [-X + 0.02, -Z]], [[X - 0.02, -Z], [X - 0.02, Z]], [[-X, -Z + 0.02], [X, -Z + 0.02]], [[X, Z - 0.02], [-X, Z - 0.02]]].forEach(([a, b], i) => { wall(g, a, b, 0.07, i % 2 ? '#FF4FA3' : '#3FE0E8', H - 0.35); wall(g, a, b, 0.05, i % 2 ? '#3FE0E8' : '#FF4FA3', H - 0.55); });
      [-4.6, -1.6, 1.4, 4.4].forEach((x, i) => { wall(g, [x - 0.55, -Z + 0.025], [x + 0.55, -Z + 0.025], 1.5, '#E8D9A8', 1.3); wall(g, [x - 0.47, -Z + 0.03], [x + 0.47, -Z + 0.03], 1.34, ['#B4232C', '#2E3A4E', '#E8B923', '#2F6E4F'][i], 1.38); });
      // les box en forme de vieilles décapotables, le long du mur de gauche : une vraie voiture ouverte,
      // capot devant, malle et ailerons derrière, portières basses sur les côtés ; dedans, deux banquettes
      // face à face (assise à 50 cm, comme une chaise) et une table chromée au milieu
      DINER_CARS.forEach(([z, c]) => {
        const x = -5.55, W = 1.9, hw = W / 2;
        // les portières (basses : on voit les clients assis), leur jonc chromé
        [-1, 1].forEach(sd => { box(g, x + sd * (hw - 0.05), 0.42, z, 0.1, 0.6, 2.3, c); box(g, x + sd * (hw - 0.05), 0.735, z, 0.13, 0.03, 2.3, '#E3E6EA'); });
        // le capot, la calandre et les phares ; le pare-brise (son cadre chromé)
        box(g, x, 0.42, z + 1.35, W, 0.6, 0.4, c); box(g, x, 0.73, z + 1.35, W - 0.1, 0.02, 0.36, '#E3E6EA');
        box(g, x, 0.36, z + 1.565, W - 0.3, 0.3, 0.03, '#C9CDD3'); [-0.65, 0.65].forEach(dx => cyl(g, x + dx, 0.52, z + 1.55, 0.1, 0.1, 0.04, '#FBF6DF', 12, 'z'));
        box(g, x, 0.18, z + 1.58, W, 0.12, 0.06, '#C9CDD3');
        [-1, 1].forEach(sd => box(g, x + sd * (hw - 0.04), 0.98, z + 1.17, 0.04, 0.5, 0.04, '#E3E6EA')); box(g, x, 1.22, z + 1.17, W - 0.04, 0.04, 0.04, '#E3E6EA');
        // la malle, les ailerons, les feux
        box(g, x, 0.42, z - 1.33, W, 0.6, 0.36, c); [-1, 1].forEach(sd => { box(g, x + sd * (hw - 0.08), 0.86, z - 1.36, 0.06, 0.3, 0.3, c); box(g, x + sd * (hw - 0.12), 0.6, z - 1.52, 0.18, 0.08, 0.02, '#E0303B'); });
        box(g, x, 0.18, z - 1.55, W, 0.12, 0.06, '#C9CDD3');
        // les roues, à moitié sous les ailes
        [-1, 1].forEach(sd => [-1.25, 1.25].forEach(dz => { cyl(g, x + sd * hw - (sd > 0 ? 0 : 0.14), 0.3, z + dz, 0.3, 0.3, 0.14, '#17181B', 14, 'x'); cyl(g, x + sd * (hw + 0.005) - (sd > 0 ? 0 : 0.01), 0.3, z + dz, 0.15, 0.15, 0.01, '#C9CDD3', 10, 'x'); }));
        // les banquettes : l'assise (dessus à 50 cm) et le dossier, en skaï
        [-1, 1].forEach(sd => {
          box(g, x, 0.22, z + sd * 0.78, W - 0.2, 0.44, 0.5, '#6E1A22');
          box(g, x, 0.47, z + sd * 0.78, W - 0.24, 0.06, 0.5, '#8C2630');
          box(g, x, 0.78, z + sd * 1.08, W - 0.2, 0.62, 0.12, '#8C2630');
          box(g, x, 1.1, z + sd * 1.08, W - 0.2, 0.04, 0.14, '#E3E6EA');
        });
        // la table : plateau blanc cerclé de chrome, un seul pied
        box(g, x, 0.74, z, 1.2, 0.04, 0.62, '#ECE8E1'); box(g, x, 0.715, z, 1.24, 0.02, 0.66, '#C9CDD3');
        cyl(g, x, 0.71, z, 0.04, 0.04, 0.71, '#C9CDD3', 8); cyl(g, x, 0.02, z, 0.22, 0.22, 0.02, '#C9CDD3', 12);
        // les milk-shakes
        [-0.3, 0.3].forEach((dx, k) => { cyl(g, x + dx, 0.86, z + (k ? 0.12 : -0.12), 0.045, 0.03, 0.1, '#F1EFEA', 8); cyl(g, x + dx, 0.92, z + (k ? 0.12 : -0.12), 0.006, 0.006, 0.08, '#E0303B', 4); });
      });
      // les tables rondes au milieu, avec leurs chaises
      [[0.3, -2.4], [0.3, 1.3], [2.6, -0.6]].forEach(([x, z]) => {
        cyl(g, x, 0.76, z, 0.45, 0.45, 0.04, '#ECE8E1', 14); cyl(g, x, 0.74, z, 0.05, 0.05, 0.72, '#C9CDD3', 8); cyl(g, x, 0.03, z, 0.25, 0.25, 0.03, '#C9CDD3', 10);
        [0, Math.PI].forEach(a => { const cx = x + Math.sin(a) * 0.75, cz = z + Math.cos(a) * 0.75; box(g, cx, 0.46, cz, 0.42, 0.07, 0.42, '#C2253A'); box(g, cx, 0.8, cz + Math.cos(a) * 0.2, 0.42, 0.6, 0.05, '#C2253A'); cyl(g, cx, 0.43, cz, 0.03, 0.03, 0.43, '#C9CDD3', 6); });
      });
      // la piste de danse, son trophée, le juke-box
      box(g, 5.4, 0.1, 0, 3.0, 0.2, 4.2, '#2E2B33'); for(let z = -1.8; z < 2.1; z += 0.6) for(let x = 4.2; x < 6.8; x += 0.6) if((Math.round(z / 0.6) + Math.round(x / 0.6)) % 2 === 0) box(g, x, 0.205, z, 0.58, 0.01, 0.58, '#3FE0E8');
      cyl(g, 6.5, 1.0, 1.6, 0.04, 0.04, 1.0, '#C9CDD3', 6); cyl(g, 6.5, 1.35, 1.6, 0.13, 0.06, 0.35, '#E8B923', 10);
      box(g, 6.6, 0.75, -2.6, 0.6, 1.5, 0.8, '#B4232C'); cyl(g, 6.6, 1.5, -2.6, 0.4, 0.4, 0.62, '#E8B923', 12, 'x'); box(g, 6.29, 0.95, -2.6, 0.02, 0.5, 0.55, '#3FE0E8');
      // le comptoir, ses tabourets chromés, la vitrine à desserts
      box(g, 2.2, 0.55, 4.4, 5.2, 1.1, 0.7, '#C2253A'); box(g, 2.2, 1.12, 4.35, 5.4, 0.05, 0.85, '#ECE8E1'); box(g, 2.2, 0.08, 4.0, 5.2, 0.16, 0.05, '#C9CDD3');
      for(let x = 0.0; x <= 4.4; x += 0.75){ cyl(g, x, 0.72, 3.55, 0.2, 0.2, 0.08, '#C2253A', 12); cyl(g, x, 0.66, 3.55, 0.035, 0.035, 0.66, '#C9CDD3', 6); cyl(g, x, 0.03, 3.55, 0.18, 0.18, 0.03, '#C9CDD3', 10); }
      box(g, 4.2, 1.35, 4.4, 0.7, 0.4, 0.5, '#E3E6EA'); [0, 1, 2].forEach(i => cyl(g, 3.95 + i * 0.25, 1.28, 4.4, 0.08, 0.08, 0.1, ['#E8B923', '#D9707A', '#7A5C42'][i], 10));
      // les suspensions
      DINER_CARS.map(([z]) => [-5.55, z]).concat([[0.3, -2.4], [0.3, 1.3], [2.6, -0.6]]).forEach(([x, z]) => { cyl(g, x, H, z, 0.01, 0.01, 1.1, '#2C2E33', 4); cyl(g, x, H - 1.1, z, 0.08, 0.25, 0.22, '#E8B923', 10); });
    },
  },
});
/* ---------- La banque et le commissariat ---------- */
Object.assign(SET_DEF, {
  bank:{
    cam:{ tx:0, ty:1.3, tz:0.5, yaw:180, pitch:-6, dist:7.5, lens:24 },
    roomH:4.2,
    rooms:[['Le hall', 'The hall', 0, [-9, -7, 9, 3.2]], ['Derrière les guichets', 'Behind the counter', 0, [-9, 3.2, 9, 7]]],
    build(g, gl){
      const X = 9, Z = 7, H = 4.2, WL = '#E8E1D3';
      floor(g, -X, -Z, X, Z, 0, '#E3DDD1'); floor(g, -X, -Z, X, Z, H, '#F2EEE7', true);
      for(let x = -X + 1.5; x < X; x += 1.5) box(g, x, 0.004, 0, 0.03, 0.006, 2 * Z, '#CFC6B6');            // le marbre, en dalles
      for(let z = -Z + 1.5; z < Z; z += 1.5) box(g, 0, 0.004, z, 2 * X, 0.006, 0.03, '#CFC6B6');
      floor(g, -2, -Z, 2, 2.2, 0.008, '#7A2E3A');                                                           // le tapis jusqu'aux guichets
      wall(g, [-X, -Z], [X, -Z], H, WL); wall(g, [-X, Z], [-X, -Z], H, '#E1D9C9'); wall(g, [X, -Z], [X, Z], H, '#E1D9C9'); wall(g, [X, Z], [-X, Z], H, WL);
      wall(g, [-X, -Z + 0.02], [X, -Z + 0.02], 0.25, '#B8AE9C'); wall(g, [X, Z - 0.02], [-X, Z - 0.02], 0.25, '#B8AE9C');   // les plinthes
      // l'entrée vitrée (portes tournantes en façade)
      wall(g, [-2.2, -Z + 0.015], [2.2, -Z + 0.015], 2.8, '#9FB6C4', 0); [-2.2, 0, 2.2].forEach(x => wall(g, [x - 0.06, -Z + 0.02], [x + 0.06, -Z + 0.02], 2.8, '#2C2E33', 0));
      // les colonnes
      [-4.8, 4.8].forEach(x => [-3.6, 0.2].forEach(z => { cyl(g, x, H, z, 0.34, 0.34, H, '#F1ECE3', 14); box(g, x, 0.12, z, 0.85, 0.24, 0.85, '#D8D0C2'); box(g, x, H - 0.12, z, 0.85, 0.24, 0.85, '#D8D0C2'); }));
      // les guichets : le comptoir en bois, les vitres de sécurité, les petits panneaux numérotés
      box(g, -1.0, 0.55, 3.2, 15.8, 1.1, 0.7, '#6E4A32'); box(g, -1.0, 1.13, 3.15, 16.0, 0.06, 0.85, '#D8D0C2');
      for(let x = -8.4; x <= 6.4; x += 2.45){ box(g, x, 1.85, 3.25, 0.06, 1.4, 0.06, '#3A3D44'); if(x < 6) box(g, x + 1.22, 2.62, 3.25, 0.5, 0.16, 0.03, '#2F6E4F'); }
      if(gl) wall(gl, [-8.9, 3.27], [6.9, 3.27], 1.4, '#A9C4D2', 1.16);
      // la file d'attente : poteaux et cordons rouges
      [-3, -1, 1, 3].forEach(x => { cyl(g, x, 0.95, 0.6, 0.035, 0.035, 0.95, '#C9A64B', 8); cyl(g, x, 0.03, 0.6, 0.16, 0.16, 0.03, '#C9A64B', 10); });
      [-2, 0, 2].forEach(x => box(g, x, 0.86, 0.6, 1.9, 0.04, 0.04, '#9B1C2E'));
      // les bancs d'attente, les distributeurs de billets, l'horloge
      [-6.5, 6.5].forEach(x => { box(g, x, 0.45, -5.6, 2.2, 0.08, 0.55, '#6E4A32'); [-0.9, 0.9].forEach(dx => box(g, x + dx, 0.22, -5.6, 0.08, 0.44, 0.5, '#3A3D44')); });
      [-1.5, 1.5].forEach(z => { box(g, -X + 0.3, 0.85, z, 0.6, 1.7, 0.8, '#5E636C'); box(g, -X + 0.61, 1.25, z, 0.02, 0.3, 0.4, '#3E7DA8'); box(g, -X + 0.61, 0.95, z, 0.02, 0.1, 0.3, '#2C2E33'); });
      cyl(g, 0, 3.4, Z - 0.02, 0.35, 0.35, 0.04, '#F4F2EE', 16, 'z'); box(g, 0, 3.48, Z - 0.05, 0.03, 0.2, 0.01, '#24262B'); box(g, 0.07, 3.4, Z - 0.05, 0.14, 0.025, 0.01, '#24262B');
      box(g, 0, 2.7, -Z + 0.04, 3.2, 0.5, 0.05, '#2E3A4E'); pixText(g, 'BANK', 0, 2.68, -Z + 0.07, 1, 0.07, [0.91, 0.73, 0.14]);
      // derrière les guichets : les bureaux, les coffres, la porte ronde de la chambre forte
      [-6, -2.5, 1].forEach(x => { box(g, x, 0.74, 5.0, 1.5, 0.05, 0.7, '#5E4532'); box(g, x, 0.36, 5.0, 1.4, 0.7, 0.05, '#4A3626'); box(g, x, 1.0, 5.15, 0.5, 0.32, 0.04, '#1E1F23'); box(g, x, 0.8, 5.17, 0.05, 0.1, 0.04, '#1E1F23'); box(g, x, 0.48, 4.4, 0.45, 0.06, 0.45, '#3A3D44');
        cyl(g, x, 0.45, 4.4, 0.025, 0.025, 0.42, '#2C2E33', 6); box(g, x, 0.02, 4.4, 0.45, 0.04, 0.06, '#2C2E33'); box(g, x, 0.02, 4.4, 0.06, 0.04, 0.45, '#2C2E33'); });   // l'écran sur son pied ; la chaise sur son pied
      cyl(g, 5.8, 1.6, Z - 0.02, 1.25, 1.25, 0.3, '#9AA0A8', 22, 'z'); cyl(g, 5.8, 1.6, Z - 0.34, 1.05, 1.05, 0.08, '#B8BEC6', 22, 'z');
      cyl(g, 5.8, 1.6, Z - 0.44, 0.22, 0.22, 0.1, '#5E636C', 12, 'z'); [0, 1, 2].forEach(k => box(g, 5.8, 1.6, Z - 0.42, 0.9, 0.05, 0.05, '#5E636C', k * Math.PI / 3));
      for(let x = 7.9; x <= 8.6; x += 0.7) box(g, x, 1.1, 5.6, 0.6, 2.2, 1.4, '#7E838B');
    },
  },
  police:{
    cam:{ tx:0, ty:1.2, tz:-3.2, yaw:160, pitch:-6, dist:5.6, lens:24 },
    roomH:3.0,
    rooms:[['L’accueil', 'Front desk', 0, [-8, -6, 8, -1]], ['Les bureaux', 'The offices', 0, [-8, -1, 2, 6]], ['Salle d’interrogatoire', 'Interrogation room', 0, [2, -1, 8, 6]]],
    build(g, gl){
      const X = 8, Z = 6, H = 3.0, WL = '#D9DDE2';
      floor(g, -X, -Z, X, Z, 0, '#8E949C'); floor(g, -X, -Z, X, Z, H, '#ECEEF0', true);
      for(let x = -X + 0.6; x < X; x += 0.6) box(g, x, 0.004, 0, 0.012, 0.004, 2 * Z, '#81878F');
      wall(g, [-X, -Z], [X, -Z], H, WL); wall(g, [-X, Z], [-X, -Z], H, '#CDD2D8'); wall(g, [X, -Z], [X, Z], H, '#CDD2D8'); wall(g, [X, Z], [-X, Z], H, WL);
      wall(g, [-X, -Z + 0.02], [X, -Z + 0.02], 1.0, '#3A4A62'); wall(g, [X, Z - 0.02], [-X, Z - 0.02], 1.0, '#3A4A62');   // le bas des murs, bleu police
      partition(g, [-X, -1], [X, -1], 0, H, WL, [[6.9, 8.1], [12.3, 13.3]]);                                 // l'accueil, et ses deux portes
      partition(g, [2, -1], [2, Z], 0, H, '#C3C8CF', [[0.6, 1.5]]);                                          // la salle d'interrogatoire
      // l'accueil : le haut comptoir, la vitre, le drapeau, le panneau d'affichage, les chaises d'attente
      box(g, -1, 0.6, -2.2, 5.2, 1.2, 0.8, '#3A4A62'); box(g, -1, 1.23, -2.25, 5.4, 0.06, 0.95, '#C9CDD3');
      if(gl) wall(gl, [-3.6, -2.55], [1.6, -2.55], 0.9, '#A9C4D2', 1.26);
      box(g, -1, 2.45, -Z + 0.04, 3.2, 0.5, 0.05, '#243046'); pixText(g, 'POLICE', -1, 2.43, -Z + 0.07, 1, 0.06, [0.95, 0.95, 0.95]);
      cyl(g, 5.6, 2.2, -5.5, 0.025, 0.025, 2.2, '#C9CDD3', 6); box(g, 5.95, 1.9, -5.5, 0.66, 0.44, 0.01, '#2F6FE0'); box(g, 5.95, 1.9, -5.49, 0.22, 0.44, 0.012, '#F4F2EE');
      box(g, -6.5, 1.6, -Z + 0.03, 2.0, 1.1, 0.03, '#B39A6B'); [[-7.1, 1.8], [-6.5, 1.5], [-5.9, 1.75], [-6.8, 1.35]].forEach(([x, y]) => box(g, x, y, -Z + 0.05, 0.36, 0.42, 0.01, '#F4F2EE'));
      for(let x = 2.6; x <= 6.2; x += 0.9){ box(g, x, 0.46, -5.4, 0.5, 0.06, 0.5, '#2F6E9B'); box(g, x, 0.75, -5.62, 0.5, 0.55, 0.05, '#2F6E9B'); box(g, x, 0.22, -5.4, 0.06, 0.44, 0.06, '#5E636C'); }
      // les bureaux : postes de travail, écrans, classeurs, tableau de l'enquête
      [[-6.4, 1.2], [-3.6, 1.2], [-6.4, 3.8], [-3.6, 3.8], [-0.8, 2.5]].forEach(([x, z]) => {
        box(g, x, 0.74, z, 1.5, 0.05, 0.8, '#C9B48F'); [[-0.68, -0.33], [0.68, -0.33], [-0.68, 0.33], [0.68, 0.33]].forEach(([dx, dz]) => box(g, x + dx, 0.36, z + dz, 0.05, 0.72, 0.05, '#5E636C'));
        box(g, x, 1.0, z + 0.25, 0.55, 0.36, 0.04, '#1E1F23'); box(g, x, 0.8, z + 0.27, 0.05, 0.08, 0.04, '#1E1F23'); cyl(g, x, 0.43, z - 0.65, 0.025, 0.025, 0.4, '#2C2E33', 6); box(g, x, 0.02, z - 0.65, 0.45, 0.04, 0.06, '#2C2E33'); box(g, x, 0.78, z - 0.05, 0.45, 0.02, 0.16, '#2C2E33'); box(g, x, 0.46, z - 0.65, 0.45, 0.06, 0.45, '#2C2E33'); box(g, x, 0.72, z - 0.88, 0.45, 0.5, 0.05, '#2C2E33'); });
      [-7.7, -7.2].forEach(x => box(g, x, 0.65, -0.4, 0.45, 1.3, 0.55, '#7E838B'));
      box(g, -X + 0.04, 1.6, 2.5, 0.03, 1.1, 2.2, '#F4F2EE'); [[2.0, 1.8], [2.6, 1.5], [3.0, 1.85], [2.3, 1.3]].forEach(([z, y]) => box(g, -X + 0.06, y, z, 0.01, 0.2, 0.26, '#E8D9A8'));
      // la cellule de garde à vue : des barreaux, un banc
      for(let x = -7.9; x <= -5.2; x += 0.18) box(g, x, H / 2, 4.6, 0.035, H, 0.035, '#5E636C');
      for(let z = 4.7; z <= 5.95; z += 0.18) box(g, -5.2, H / 2, z, 0.035, H, 0.035, '#5E636C');
      box(g, -6.6, 0.42, 5.7, 2.4, 0.08, 0.5, '#7E838B'); [-7.7, -6.6, -5.5].forEach(x => box(g, x, 0.19, 5.7, 0.06, 0.38, 0.4, '#5E636C'));   // le banc sur ses pieds
      // la salle d'interrogatoire : la table, deux chaises, la lampe, la glace sans tain
      box(g, 5, 0.74, 2.6, 1.6, 0.05, 0.9, '#B8BEC6'); [[-0.75, -0.4], [0.75, -0.4], [-0.75, 0.4], [0.75, 0.4]].forEach(([dx, dz]) => box(g, 5 + dx, 0.36, 2.6 + dz, 0.05, 0.72, 0.05, '#5E636C'));
      [1.6, 3.6].forEach((z, k) => { box(g, 5, 0.46, z, 0.45, 0.06, 0.45, '#3A3D44'); cyl(g, 5, 0.43, z, 0.025, 0.025, 0.41, '#2C2E33', 6); box(g, 5, 0.02, z, 0.42, 0.04, 0.06, '#2C2E33'); box(g, 5, 0.75, z + (k ? 0.22 : -0.22), 0.45, 0.55, 0.05, '#3A3D44'); });
      cyl(g, 5, H, 2.6, 0.01, 0.01, 0.9, '#2C2E33', 4); cyl(g, 5, H - 0.9, 2.6, 0.08, 0.3, 0.22, '#3A3D44', 12);
      wall(g, [X - 0.01, 0.8], [X - 0.01, 4.4], 1.3, '#1E2633', 0.9);
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
  const m0 = MAT; MAT = 1;   // un mur, c'est de l'architecture
  if(COLL) collOf(g).p.push([a, b, gaps || []]);   // pour le plan de la maison
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), ry = Math.atan2(dx, dz);
  const cuts = [[0, 0]].concat((gaps || []).map(([s, e]) => [s, e]), [[len, len]]);
  for(let i = 0; i < cuts.length - 1; i++){
    const s = cuts[i][1], e = cuts[i + 1][0]; if(e - s < 0.02) continue;
    const m = (s + e) / 2; box(g, a[0] + dx / len * m, y0 + h / 2, a[1] + dz / len * m, 0.1, h, e - s, col, ry);
  }
  (gaps || []).forEach(([s, e]) => { const m = (s + e) / 2; box(g, a[0] + dx / len * m, y0 + h - 0.35, a[1] + dz / len * m, 0.1, 0.7, e - s, col, ry); });   // le linteau au-dessus des portes
  MAT = m0;
}
/* un plancher percé (la trémie d'un escalier) : des bandes autour du trou */
function floorHole(g, x0, z0, x1, z1, y, col, hole, down){
  const [hx0, hz0, hx1, hz1] = hole;
  floor(g, x0, z0, x1, hz0, y, col, down); floor(g, x0, hz1, x1, z1, y, col, down);
  floor(g, x0, hz0, hx0, hz1, y, col, down); floor(g, hx1, hz0, x1, hz1, y, col, down);
}
/* un vrai escalier droit : marches avec nez, contremarches, limons de chaque côté,
   main courante et barreaux du côté ouvert (railX : liste des côtés qui ont une rampe) */
function stairs(g, x0, x1, zStart, zEnd, y0, rise, n, col, railX){
  const run = (zEnd - zStart) / n, st = rise / n, dir = Math.sign(run), W = x1 - x0, xc = (x0 + x1) / 2;
  const WOOD = col || '#8A6A4A', RIS = '#E9E4DA', STR = '#6E5440';
  for(let i = 0; i < n; i++){
    const zf = zStart + run * i, zb = zf + run, top = y0 + st * (i + 1);
    box(g, xc, top - 0.02, (zf + zb) / 2 - dir * 0.02, W, 0.04, Math.abs(run) + 0.04, WOOD);                      // la marche, qui dépasse un peu
    box(g, xc, top - st / 2 - 0.02, zf + dir * 0.012, W - 0.02, st - 0.04, 0.024, RIS);                              // la contremarche
  }
  // les limons : deux bandes inclinées qui portent les marches
  const P = [[zStart, y0], [zStart, y0 + 0.28], [zEnd, y0 + rise + 0.28], [zEnd, y0 + rise - 0.06]].map(([z, y]) => [z, y]);
  [x0 - 0.03, x1 + 0.03].forEach(x => prism(g, P.map(([z, y], k) => [z, k === 0 || k === 3 ? y - 0.02 : y - 0.02]), x - 0.03, x + 0.03, STR));
  // la rampe : poteaux, barreaux, main courante
  (railX || []).forEach(x => {
    for(let i = 0; i < n; i += 1){ const z = zStart + run * (i + 0.5), y = y0 + st * (i + 1); box(g, x, y + 0.45, z, 0.03, 0.9, 0.03, '#F4F2EE'); }
    const len = Math.hypot(rise, Math.abs(zEnd - zStart)), a = Math.atan2(rise, Math.abs(zEnd - zStart));
    const g2 = geo(); box(g2, 0, 0, 0, 0.07, 0.05, len + 0.1, STR);
    for(let i = 0; i < g2.p.length; i += 3){ const yy = g2.p[i + 1], zz = g2.p[i + 2], c = Math.cos(a), s = Math.sin(a); g2.p[i + 1] = yy * c + zz * s * 1; g2.p[i + 2] = -yy * s + zz * c; const ny = g2.n[i + 1], nz = g2.n[i + 2]; g2.n[i + 1] = ny * c + nz * s; g2.n[i + 2] = -ny * s + nz * c; }
    // la pente monte vers zEnd
    for(let i = 0; i < g2.p.length; i += 3){ if(dir < 0){ g2.p[i + 2] = -g2.p[i + 2]; g2.n[i + 2] = -g2.n[i + 2]; } g2.p[i] += x; g2.p[i + 1] += y0 + rise / 2 + 0.95; g2.p[i + 2] += (zStart + zEnd) / 2; }
    if(dir < 0) for(let i = 0; i < g2.p.length; i += 9) for(const A of [g2.p, g2.n, g2.c]) for(let k = 0; k < 3; k++){ const t = A[i + 3 + k]; A[i + 3 + k] = A[i + 6 + k]; A[i + 6 + k] = t; }
    g.p.push(...g2.p); g.n.push(...g2.n); g.c.push(...g2.c); if(g.e) g.e.push(...g2.e);
    [zStart, zEnd].forEach((z, k) => box(g, x, y0 + (k ? rise : 0) + 0.55, z, 0.09, 1.1, 0.09, STR));
  });
}
/* un garde-corps le long d'un bord (au-dessus d'une trémie) */
function railing(g, a, b, y){
  const dx = b[0] - a[0], dz = b[1] - a[1], len = Math.hypot(dx, dz), n = Math.max(2, Math.round(len / 0.14)), ry = Math.atan2(dx, dz);
  for(let i = 0; i <= n; i++){ const t = i / n; box(g, a[0] + dx * t, y + 0.45, a[1] + dz * t, 0.03, 0.9, 0.03, '#F4F2EE'); }
  box(g, (a[0] + b[0]) / 2, y + 0.92, (a[1] + b[1]) / 2, 0.07, 0.05, len + 0.07, '#6E5440', ry);
}
Object.assign(SET_DEF, {
  house:{
    sky:{ top:'#86B3D9', hor:'#E3E9E8', low:'#8FA27C' }, fog:[45, 200],
    view:'nature', levels:[0, 2.9, 5.8, 8.7], prev:{ tx:0, ty:3.2, tz:0, yaw:32, pitch:-12, dist:21, lens:28 }, box:[-5.2, -4.2, 5.2, 4.2],
    cam:{ tx:-1.5, ty:0.8, tz:-2.2, yaw:43, pitch:-16, dist:4.4, lens:24 },
    // les pièces : [fr, en, étage, œil de la caméra (dans un coin de la pièce), point visé (son centre)]
    // les pièces, étage par étage : leur rectangle au sol (x0, z0, x1, z1). La caméra s'y place toute seule,
    // dans le coin le plus éloigné de ce qu'on veut voir, à hauteur d'yeux : toute la pièce est dans l'image
    roomH:2.9,
    rooms:[
      ['Salon', 'Living room', 0, [-3.7, -4, 0.8, 1.2]],
      ['Cuisine', 'Kitchen', 0, [0.8, -4, 5, 1.2]],
      ['Entrée et escalier', 'Hall and stairs', 0, [-3.7, 1.2, 5, 4]],
      ['1er : palier', '1st: landing', 1, [-5, -4, -1.95, -0.45], [-3.0, 1.4]],
      ['1er : chambre', '1st: bedroom', 1, [-1.95, -4, 5, 0.4]],
      ['1er : salle de bain', '1st: bathroom', 1, [-1.95, 0.4, 5, 4]],
      ['2e : palier', '2nd: landing', 2, [-5, -4, -1.6, -0.45], [-3.0, 1.4]],
      ['2e : chambre d’enfant', '2nd: child’s room', 2, [-1.6, -4, 5, 0.6]],
      ['2e : bureau', '2nd: study', 2, [-1.6, 0.6, 5, 4]],
      ['Grenier', 'Attic', 3, [-5, -4, 5, 4], null, 'roof'],
    ],
    garden:['Le jardin', 'Garden', -1, [7.5, 3.4, 17], [0, 2.6, 4.7]],
    build(g, gl, L){
      const H = HOUSE, W0 = '#E6DDCC', WOOD = '#9C7B5B', top = H.h * 3;
      // le jardin (percé sous la maison : son plancher ne clignote pas)
      floorHole(g, -70, -70, 70, 70, 0, '#7C9A5A', [H.x0 - 0.15, H.z0 - 0.15, H.x1 + 0.15, H.z1 + 0.15]);
      floor(g, -0.7, 4.2, 0.7, 16, 0.006, '#B9A88C');
      for(let x = -12; x <= 12; x += 0.6) box(g, x, 0.45, 16, 0.08, 0.9, 0.08, '#E9E6E0'); box(g, 0, 0.75, 16, 24, 0.06, 0.04, '#E9E6E0');
      [[-9, 6, 1.3], [9, 9, 1.1], [-11, -7, 1.4], [10, -6, 1.2]].forEach(([x, z, k]) => tree(g, x, z, k));
      [[-3.2, 4.9], [3.2, 4.9]].forEach(([x, z]) => ball(g, x, 0.35, z, 0.8, 0.45, 0.45, '#557F57', 8));
      car(g, gl, 7.5, 5, '#3D5A80');
      box(g, -6.5, 0.4, -1, 1.6, 0.05, 0.8, '#8A6A4A'); [[-7.1, -1.3], [-5.9, -1.3], [-7.1, -0.7], [-5.9, -0.7]].forEach(([x, z]) => box(g, x, 0.2, z, 0.05, 0.4, 0.05, '#6E5440'));
      // la façade (vue du dehors), sur trois niveaux
      const X0 = H.x0 - 0.15, X1 = H.x1 + 0.15, Z0 = H.z0 - 0.15, Z1 = H.z1 + 0.15;
      wall(g, [X0, Z1], [X1, Z1], top, W0); wall(g, [X1, Z0], [X0, Z0], top, W0); wall(g, [X0, Z0], [X0, Z1], top, W0); wall(g, [X1, Z1], [X1, Z0], top, W0);
      box(g, 0, 0.12, Z1 + 0.3, 1.8, 0.24, 0.6, '#8D9198');
      wall(g, [-0.55, Z1 + 0.005], [0.55, Z1 + 0.005], 2.1, '#6E5440');
      for(let f = 0; f < 3; f++){ const y = f * H.h + 1;
        [-3, 3].concat(f ? [0] : []).forEach(x => { wall(g, [x - 0.6, Z1 + 0.005], [x + 0.6, Z1 + 0.005], 1.3, '#3E4552', y); wall(g, [x - 0.68, Z1 + 0.01], [x + 0.68, Z1 + 0.01], 0.08, '#F4F2EE', y - 0.04); [-0.66, 0.66].forEach(d => wall(g, [x + d - 0.18, Z1 + 0.012], [x + d, Z1 + 0.012], 1.3, '#5E7F6A', y)); });
        [-2.5, 2.5].forEach(z => { wall(g, [X0 - 0.005, z - 0.55], [X0 - 0.005, z + 0.55], 1.3, '#3E4552', y); wall(g, [X1 + 0.005, z + 0.55], [X1 + 0.005, z - 0.55], 1.3, '#3E4552', y); });
        [-2.5, 2.5].forEach(x => wall(g, [x + 0.6, Z0 - 0.005], [x - 0.6, Z0 - 0.005], 1.3, '#3E4552', y));
        box(g, 0, f * H.h + 0.02, Z1 + 0.02, 10.3, 0.12, 0.04, '#D6CDBC');
      }
      // le toit et la cheminée (dans le niveau du grenier : il s'efface quand on regarde un étage d'en haut)
      prism(L[3], [[Z0 - 0.5, top], [Z1 + 0.5, top], [0, top + 2.8]], X0 - 0.4, X1 + 0.4, '#8C4A3A');
      [[X0, 1], [X1, -1]].forEach(([x, sd]) => prism(L[3], [[Z0, top], [Z1, top], [0, top + 2.6]], Math.min(x, x - sd * 0.02), Math.max(x, x - sd * 0.02), W0));
      box(L[3], 3, top + 2.4, -1, 0.6, 1.4, 0.6, '#8A7356');
      // ---- les trois étages habités ----
      const hole1 = [-4.2, -0.45, -3.2, 3.75], hole2 = [-3.12, -0.45, -2.12, 3.75], hatch = [-4.7, -3.2, -3.9, -2.4];
      const room = (gg, y, cols, ceilHole, floorHole_) => {
        if(floorHole_) floorHole(gg, H.x0, H.z0, H.x1, H.z1, y + 0.004, cols.f, floorHole_); else floor(gg, H.x0, H.z0, H.x1, H.z1, y + 0.004, cols.f);
        wall(gg, [H.x0, H.z0], [H.x1, H.z0], H.h, cols.a, y); wall(gg, [H.x0, H.z1], [H.x0, H.z0], H.h, cols.b, y); wall(gg, [H.x1, H.z0], [H.x1, H.z1], H.h, cols.b, y); wall(gg, [H.x1, H.z1], [H.x0, H.z1], H.h, cols.a, y);
        floorHole(gg, H.x0, H.z0, H.x1, H.z1, y + H.h - 0.002, '#F2EEE6', ceilHole, true);
        box(gg, 0, y + 0.06, H.z0 + 0.02, 10, 0.12, 0.03, '#C9BFAE'); box(gg, 0, y + 0.06, H.z1 - 0.02, 10, 0.12, 0.03, '#C9BFAE');
      };
      const winIn = (gg, y, xs) => { xs.forEach(x => pane(gg, [x + 0.6, H.z1 - 0.01], [x - 0.6, H.z1 - 0.01], 1.3, '#A9C9DE', y + 1)); [-2.5, 2.5].forEach(z => { pane(gg, [H.x0 + 0.01, z + 0.55], [H.x0 + 0.01, z - 0.55], 1.3, '#A9C9DE', y + 1); pane(gg, [H.x1 - 0.01, z - 0.55], [H.x1 - 0.01, z + 0.55], 1.3, '#A9C9DE', y + 1); }); [-2.5, 2.5].forEach(x => pane(gg, [x - 0.6, H.z0 + 0.01], [x + 0.6, H.z0 + 0.01], 1.3, '#A9C9DE', y + 1)); };
      // rez-de-chaussée : salon, cuisine, entrée ; l'escalier monte près du mur gauche (avec un vrai écart : il ne le frôle pas)
      const g0 = L[0];
      room(g0, 0, { f:WOOD, a:'#E9E3D6', b:'#DED6C6' }, hole1, null);
      for(let x = H.x0 + 0.4; x < H.x1; x += 0.4) box(g0, x, 0.006, 0, 0.012, 0.004, 8, '#8C6D50');
      winIn(g0, 0, [-3, 3]); wall(g0, [0.55, H.z1 - 0.01], [-0.55, H.z1 - 0.01], 2.1, '#7A5C42');
      stairs(g0, -4.2, -3.2, 3.7, -0.45, 0, H.h, 14, '#8A6A4A', [-3.16]);   // à 80 cm du mur : un vrai passage le long du mur
      partition(g0, [0.8, H.z0], [0.8, 1.2], 0, H.h, '#E9E3D6', [[3.2, 4.1]]);
      partition(g0, [0.8, 1.2], [H.x1, 1.2], 0, H.h, '#E9E3D6', [[1.2, 2.2]]);
      floor(g0, -3.2, -3.5, 0.4, -0.3, 0.008, '#B9876A');
      box(g0, -1.4, 0.22, -3.3, 2.2, 0.44, 0.9, '#5A6B7C'); box(g0, -1.4, 0.66, -3.68, 2.2, 0.5, 0.16, '#53637A'); [-0.22, -2.58].forEach(x => box(g0, x, 0.36, -3.3, 0.2, 0.32, 0.92, '#53637A'));
      box(g0, -1.4, 0.38, -1.7, 1.1, 0.05, 0.6, '#6E5440'); [[-0.48, -0.23], [0.48, -0.23], [-0.48, 0.23], [0.48, 0.23]].forEach(([a, b]) => box(g0, -1.4 + a, 0.18, -1.7 + b, 0.05, 0.36, 0.05, '#5E4532'));
      box(g0, 0.55, 1.0, -2.0, 0.4, 2.0, 1.4, '#7A5C42');
      box(g0, -2.3, 0.3, -1.6, 0.5, 0.6, 0.5, '#B9B0A0'); cyl(g0, -2.3, 1.0, -1.6, 0.12, 0.18, 0.4, '#F2E6C9', 10);
      box(g0, 4.65, 0.45, -1.5, 0.65, 0.9, 4.8, '#E9E6E0'); box(g0, 4.65, 0.92, -1.5, 0.7, 0.05, 4.85, '#5E636C'); box(g0, 4.65, 0.93, -2.6, 0.45, 0.04, 0.6, '#9AA0A8');
      box(g0, 4.6, 0.95, 0.6, 0.7, 1.9, 0.7, '#D9DCE0'); box(g0, 4.65, 1.75, -1.5, 0.35, 0.6, 4.6, '#E9E6E0');
      box(g0, 2.6, 0.75, -1.8, 1.4, 0.05, 0.9, '#8A6A4A'); [[-0.6, -0.35], [0.6, -0.35], [-0.6, 0.35], [0.6, 0.35]].forEach(([a, b]) => box(g0, 2.6 + a, 0.37, -1.8 + b, 0.05, 0.74, 0.05, '#6E5440'));
      [[2.0, -2.55], [3.2, -2.55], [2.0, -1.05], [3.2, -1.05]].forEach(([x, z]) => { box(g0, x, 0.45, z, 0.42, 0.05, 0.42, '#7A5C42'); [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([a, b]) => box(g0, x + a, 0.21, z + b, 0.035, 0.42, 0.035, '#6E5440')); box(g0, x, 0.72, z + (z < -1.8 ? -0.19 : 0.19), 0.42, 0.55, 0.04, '#7A5C42'); });
      cyl(g0, 2.6, 2.9, -1.8, 0.01, 0.01, 0.7, '#2C2E33', 4); cyl(g0, 2.6, 2.2, -1.8, 0.05, 0.25, 0.2, '#2F6E4F', 10);
      box(g0, 3.6, 0.4, 3.75, 1.2, 0.8, 0.4, '#7A5C42'); cyl(g0, 1.6, 0.9, 3.6, 0.03, 0.03, 1.8, '#3A3D44', 6);
      floor(g0, -0.9, 2.2, 0.9, 3.9, 0.008, '#7A3B37');
      // premier étage : palier (avec garde-corps), chambre des parents, salle de bain ; l'escalier suivant part du palier
      const g1 = L[1], y1 = H.h;
      room(g1, y1, { f:'#A68A6B', a:'#DCE3E8', b:'#E8DED4' }, hole2, hole1);
      winIn(g1, y1, [-3, 0, 3]);
      stairs(g1, -3.12, -2.12, 3.7, -0.45, y1, H.h, 14, '#8A6A4A', [-2.08]);
      railing(g1, [-4.2, 3.78], [-3.2, 3.78], y1); railing(g1, [-3.16, 3.75], [-3.16, -0.45], y1); railing(g1, [-4.23, 3.75], [-4.23, -0.45], y1);
      partition(g1, [-1.95, H.z0], [-1.95, H.z1], y1, H.h, '#E9E3D6', [[0.5, 1.4], [5.0, 5.9]]);
      partition(g1, [-1.95, 0.4], [H.x1, 0.4], y1, H.h, '#E9E3D6', [[3.45, 4.35]]);
      box(g1, 0.6, y1 + 0.25, -2.7, 1.7, 0.5, 2.1, '#E9E4DA'); box(g1, 0.6, y1 + 0.52, -2.7, 1.66, 0.06, 2.06, '#C9503C'); box(g1, 0.6, y1 + 0.55, -3.6, 1.6, 0.12, 0.35, '#F4F2EE'); box(g1, 0.6, y1 + 0.7, -3.85, 1.8, 1.0, 0.08, '#7A5C42');
      [-0.55, 1.75].forEach(x => { box(g1, x, y1 + 0.28, -3.6, 0.45, 0.56, 0.4, '#7A5C42'); cyl(g1, x, y1 + 0.82, -3.6, 0.06, 0.12, 0.25, '#F2E6C9', 8); });
      box(g1, 4.65, y1 + 1.0, -1.6, 0.6, 2.0, 1.4, '#8A6A4A'); floor(g1, -0.6, -1.4, 1.8, -0.2, y1 + 0.008, '#B9876A');
      box(g1, 3.9, y1 + 0.28, 3.3, 1.6, 0.56, 0.8, '#F4F2EE'); box(g1, 3.9, y1 + 0.5, 3.3, 1.45, 0.08, 0.6, '#A9C9DE');
      box(g1, 1.4, y1 + 0.8, 3.75, 0.6, 0.12, 0.42, '#F4F2EE'); box(g1, 1.4, y1 + 0.4, 3.85, 0.2, 0.8, 0.2, '#F4F2EE'); wall(g1, [1.75, H.z1 - 0.01], [1.05, H.z1 - 0.01], 0.6, '#C9D3DC', y1 + 1.1);
      box(g1, 2.5, y1 + 0.22, 3.7, 0.4, 0.44, 0.55, '#F4F2EE'); floor(g1, -1.85, 0.5, 5, 4, y1 + 0.007, '#C9D3DC');
      // deuxième étage : chambre d'enfant, bureau, et l'échelle du grenier sur le palier
      const g2 = L[2], y2 = H.h * 2;
      room(g2, y2, { f:'#B39C86', a:'#E8E4D9', b:'#DED8CA' }, hatch, hole2);
      winIn(g2, y2, [-3, 0, 3]);
      railing(g2, [-3.12, 3.78], [-2.12, 3.78], y2); railing(g2, [-2.08, 3.75], [-2.08, -0.45], y2); railing(g2, [-3.15, 3.75], [-3.15, -0.45], y2);
      partition(g2, [-1.6, H.z0], [-1.6, H.z1], y2, H.h, '#E9E3D6', [[0.6, 1.5], [5.6, 6.5]]);
      partition(g2, [-1.6, 0.6], [H.x1, 0.6], y2, H.h, '#E9E3D6', []);
      box(g2, 3.9, y2 + 0.2, -2.6, 1.0, 0.4, 2.0, '#E9E4DA'); box(g2, 3.9, y2 + 0.42, -2.3, 0.96, 0.05, 1.4, '#3D5A80');
      box(g2, 0.6, y2 + 0.72, -3.6, 1.2, 0.05, 0.6, '#E9E6E0'); [[-0.55, -0.25], [0.55, -0.25], [-0.55, 0.25], [0.55, 0.25]].forEach(([a, b]) => box(g2, 0.6 + a, y2 + 0.35, -3.6 + b, 0.04, 0.7, 0.04, '#C9CCD1'));
      box(g2, 0.6, y2 + 0.42, -3.2, 0.42, 0.05, 0.42, '#C9503C'); [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([a, b]) => box(g2, 0.6 + a, y2 + 0.2, -3.2 + b, 0.03, 0.4, 0.03, '#C9CCD1')); box(g2, 0.6, y2 + 0.68, -3.0, 0.42, 0.45, 0.04, '#C9503C');
      floor(g2, 1.4, -2.2, 3.2, -0.6, y2 + 0.006, '#E3A33A'); box(g2, -0.8, y2 + 0.3, -1.2, 0.5, 0.5, 0.5, '#D9707A'); ball(g2, 2.2, y2 + 0.15, -1.4, 0.15, 0.15, 0.15, '#3D5A80', 8);
      box(g2, 2.4, y2 + 0.74, 3.4, 1.6, 0.05, 0.7, '#6E5440'); [[-0.74, -0.3], [0.74, -0.3], [-0.74, 0.3], [0.74, 0.3]].forEach(([a, b]) => box(g2, 2.4 + a, y2 + 0.36, 3.4 + b, 0.05, 0.72, 0.05, '#5E4532'));
      box(g2, 2.4, y2 + 1.0, 3.6, 0.55, 0.36, 0.04, '#2C2E33'); box(g2, 2.4, y2 + 0.82, 3.6, 0.06, 0.1, 0.06, '#2C2E33'); box(g2, 2.4, y2 + 0.775, 3.6, 0.22, 0.02, 0.16, '#2C2E33');
      box(g2, 2.4, y2 + 0.45, 2.8, 0.48, 0.07, 0.46, '#3A3D44'); cyl(g2, 2.4, y2 + 0.42, 2.8, 0.03, 0.03, 0.36, '#9AA0A8', 6); box(g2, 2.4, y2 + 0.03, 2.8, 0.5, 0.05, 0.08, '#2C2E33'); box(g2, 2.4, y2 + 0.03, 2.8, 0.08, 0.05, 0.5, '#2C2E33'); box(g2, 2.4, y2 + 0.8, 2.56, 0.46, 0.6, 0.06, '#3A3D44');
      box(g2, 4.75, y2 + 1.0, 2.2, 0.4, 2.0, 2.4, '#7A5C42'); [0.5, 1.0, 1.5].forEach((yy, k) => { for(let i = 0; i < 9; i++) box(g2, 4.68, y2 + yy + 0.13, 1.2 + i * 0.22, 0.22, 0.24 - (i % 3) * 0.03, 0.12, ['#9B3B33', '#3D5A80', '#C9B48F', '#2F6E4F'][(i + k) % 4]); });
      [-4.6, -4.0].forEach(x => box(g2, x, y2 + H.h / 2, -2.8, 0.05, H.h, 0.05, '#8A6A4A')); for(let k = 1; k < 9; k++) box(g2, -4.3, y2 + k * 0.32, -2.8, 0.6, 0.04, 0.05, '#8A6A4A');
      // le grenier
      const g3 = L[3], y3 = H.h * 3, ridge = y3 + 2.55;
      floorHole(g3, H.x0, H.z0, H.x1, H.z1, y3 + 0.002, '#8A7356', hatch);
      for(let x = H.x0 + 0.3; x < H.x1; x += 0.6) box(g3, x, y3 + 0.005, 0, 0.012, 0.004, 8, '#7A6248');
      quad(g3, [H.x0, y3, H.z0], [H.x1, y3, H.z0], [H.x1, ridge, 0], [H.x0, ridge, 0], hexRGB('#9C7B5B'));
      quad(g3, [H.x1, y3, H.z1], [H.x0, y3, H.z1], [H.x0, ridge, 0], [H.x1, ridge, 0], hexRGB('#9C7B5B'));
      tri(g3, [H.x0, y3, H.z1], [H.x0, y3, H.z0], [H.x0, ridge, 0], hexRGB('#B9A88C')); tri(g3, [H.x1, y3, H.z0], [H.x1, y3, H.z1], [H.x1, ridge, 0], hexRGB('#B9A88C'));
      pane(g3, [H.x0 + 0.01, 0.5], [H.x0 + 0.01, -0.5], 0.8, '#A9C9DE', y3 + 0.8);
      box(g3, -2.5, y3 + 0.3, -2.2, 1.0, 0.6, 0.6, '#6E5440'); box(g3, -2.5, y3 + 0.62, -2.2, 1.04, 0.06, 0.64, '#8A6A4A');
      [[1.2, -2.4], [1.8, -2.2], [1.5, -2.3]].forEach(([x, z], k) => box(g3, x, y3 + 0.25 + (k === 2 ? 0.5 : 0), z, 0.5, 0.5, 0.5, '#B08A5A'));
      box(g3, 2.6, y3 + 0.45, 1.4, 0.55, 0.06, 0.55, '#7A5C42'); box(g3, 2.6, y3 + 0.85, 1.65, 0.55, 0.8, 0.06, '#7A5C42');
      cyl(g3, 0, ridge, 0, 0.01, 0.01, 0.5, '#2C2E33', 4); ball(g3, 0, ridge - 0.55, 0, 0.06, 0.08, 0.06, '#F2E6C9', 8);
      box(g3, -1.2, y3 + 0.9, 2.4, 0.6, 1.8, 0.4, '#9AA0A8');
    },
  },
});
Object.assign(SET_DEF, {
  roof:{
    sky:{ top:'#6F9CC9', hor:'#E2D9CF', low:'#6E737B' }, fog:[40, 220],
    cam:{ tx:0, ty:1.2, tz:0, yaw:24, pitch:-5, dist:7.6, lens:28 },
    build(g, gl){
      // le toit de l'immeuble, posé à hauteur zéro : la ville est en dessous
      floor(g, -9, -7, 9, 7, 0, '#8D9198');
      for(let x = -8.5; x < 9; x += 1.5) box(g, x, 0.003, 0, 0.02, 0.004, 14, '#7E838B');
      [[-9, -7, 9, -7], [9, -7, 9, 7], [9, 7, -9, 7], [-9, 7, -9, -7]].forEach(([a, b, c, d]) => { const mx = (a + c) / 2, mz = (b + d) / 2, along = a === c; box(g, mx, 0.55, mz, along ? 0.3 : Math.abs(c - a) + 0.3, 1.1, along ? Math.abs(d - b) + 0.3 : 0.3, '#A6ACB4'); });
      box(g, 0, -15.01, 0, 18.2, 30, 14.2, '#9A8B7E');
      // les fenêtres de l'immeuble (comme dans la rue : la nuit, certaines s'éclairent)
      MAT = 6; for(let y = -3; y > -30; y -= 3) for(let x = -7.5; x <= 7.5; x += 2.2){ wall(g, [x - 0.5, 7.11], [x + 0.5, 7.11], 1.4, '#3E4552', y); wall(g, [x + 0.5, -7.11], [x - 0.5, -7.11], 1.4, '#3E4552', y); } MAT = 0;
      // le château d'eau, la cage d'escalier, les climatiseurs, l'antenne, la verrière
      [[-4.6, -3.8], [-3.2, -3.8], [-4.6, -2.4], [-3.2, -2.4]].forEach(([x, z]) => box(g, x, 1.2, z, 0.14, 2.4, 0.14, '#5E636C'));
      cyl(g, -3.9, 4.3, -3.1, 1.2, 1.2, 1.9, '#8A6A4A', 14); cyl(g, -3.9, 5.1, -3.1, 0.05, 1.3, 0.8, '#5E636C', 14);
      box(g, 5.6, 1.4, -4.2, 2.6, 2.8, 2.4, '#B9B0A0'); wall(g, [5.0, -2.99], [6.0, -2.99], 2.1, '#5E636C');
      [[2.6, 4.6], [4.0, 4.6], [5.4, 4.6]].forEach(([x, z]) => { box(g, x, 0.45, z, 1.1, 0.9, 0.8, '#C9CDD2'); cyl(g, x, 0.92, z, 0.3, 0.3, 0.02, '#5E636C', 10); });
      cyl(g, 7.6, 5.5, 5.6, 0.04, 0.05, 5.5, '#2C2E33', 6); box(g, 7.6, 4.5, 5.6, 1.2, 0.03, 0.03, '#2C2E33'); box(g, 7.6, 5.1, 5.6, 0.8, 0.03, 0.03, '#2C2E33');
      prism(g, [[-1.2, 0], [1.2, 0], [0.9, 0.55], [-0.9, 0.55]], -6.2, -3.8, '#5E636C'); if(gl) prism(gl, [[-1.0, 0.56], [1.0, 0.56], [0.85, 0.6], [-0.85, 0.6]], -6.1, -3.9, '#A9C4D2');
      box(g, 1.2, 0.22, -4.6, 1.8, 0.44, 0.6, '#8A6A4A');
      // la ville autour : des immeubles plus bas et plus hauts, avec leurs fenêtres
      const cols = ['#B39C86', '#8E7E72', '#A6ACB4', '#C9B9A3', '#9A8B7E', '#BFA58A'];
      for(let i = 0; i < 26; i++){
        const a = i / 26 * Math.PI * 2, r = 30 + (i * 7) % 18, x = Math.cos(a) * r, z = Math.sin(a) * r, h = 10 + (i * 13) % 34 - 16, w = 9 + (i * 5) % 7, d = 9 + (i * 3) % 6;
        box(g, x, -30 + (h + 30) / 2, z, w, h + 30, d, cols[i % 6]);
        // leurs fenêtres, sur les quatre faces (la nuit, certaines s'éclairent, comme dans la rue)
        MAT = 6;
        for(let y = -1; y < h - 1; y += 3.2){
          for(let k = -w / 2 + 1.2; k < w / 2 - 0.8; k += 2.0){
            const f = [x + k, z + d / 2 + 0.02], b2 = [x + k + 1.0, z + d / 2 + 0.02]; wall(g, f, b2, 1.4, '#3E4552', y);
            wall(g, [x + k + 1.0, z - d / 2 - 0.02], [x + k, z - d / 2 - 0.02], 1.4, '#3E4552', y);
          }
          for(let k = -d / 2 + 1.2; k < d / 2 - 0.8; k += 2.0){
            wall(g, [x + w / 2 + 0.02, z + k + 1.0], [x + w / 2 + 0.02, z + k], 1.4, '#3E4552', y);
            wall(g, [x - w / 2 - 0.02, z + k], [x - w / 2 - 0.02, z + k + 1.0], 1.4, '#3E4552', y);
          }
        }
        MAT = 0;
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
        [0, 1.6, 3.2].forEach(y => box(g, cx, y + 0.13, cz, 4.4, 0.04, 1.86, '#9A8466'));   // le plateau de chaque étagère
        [0.1, 1.7, 3.3].forEach((y, k) => { for(let i = 0; i < 3; i++) if((i + k + r) % 4 !== 3) box(g, cx - 1.4 + i * 1.4, y + 0.45, cz, 1.2, 0.8, 1.4, crate[(i + k + r) % 5]); });
      });
      // au milieu : des palettes, des caisses en pile, un chariot élévateur, une table et des chaises
      [[1.5, 0.5], [2.6, 0.9]].forEach(([x, z]) => { box(g, x, 0.07, z, 1.2, 0.14, 1.0, '#8A6A4A'); box(g, x, 0.5, z, 1.1, 0.7, 0.9, '#B08A5A'); });
      box(g, -3.0, 0.45, -0.6, 1.0, 0.9, 1.0, '#9A7A55'); box(g, -3.0, 1.3, -0.6, 0.8, 0.8, 0.8, '#B08A5A');
      { const fx = -9.4; box(g, fx, 0.6, 0.8, 1.2, 0.9, 2.0, '#E3B53A'); box(g, fx, 1.6, 1.2, 1.1, 1.2, 0.05, '#2C2E33'); box(g, fx, 2.2, 0.6, 1.2, 0.06, 1.3, '#2C2E33'); [fx - 0.5, fx + 0.5].forEach(x => box(g, x, 1.4, -0.35, 0.08, 2.8, 0.08, '#2C2E33')); [[-0.4], [0.4]].forEach(([d]) => box(g, fx + d, 0.1, -0.9, 0.1, 0.05, 1.0, '#5E636C'));
      [[fx - 0.45, 1.5], [fx + 0.45, 1.5], [fx - 0.45, 0.1], [fx + 0.45, 0.1]].forEach(([x, z]) => cyl(g, x - 0.1, 0.25, z, 0.25, 0.25, 0.2, '#17181B', 10, 'x')); }
      box(g, -6.0, 0.75, 0.6, 1.6, 0.05, 0.9, '#6E5440'); [[-6.7, 0.25], [-5.3, 0.25], [-6.7, 0.95], [-5.3, 0.95]].forEach(([x, z]) => box(g, x, 0.37, z, 0.05, 0.74, 0.05, '#5B4532'));
      [[-6.6, -0.3], [-5.4, -0.3]].forEach(([x, z]) => { box(g, x, 0.45, z, 0.42, 0.05, 0.42, '#3A3D44'); box(g, x, 0.75, z - 0.2, 0.42, 0.55, 0.04, '#3A3D44'); [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([a, b]) => box(g, x + a, 0.21, z + b, 0.03, 0.42, 0.03, '#2C2E33')); });
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
  house:[ ['Salon, sur le canapé', 'Living room, on the sofa', -1.6, -3.2, 0, 'sit'], ['Dans la cuisine', 'In the kitchen', 3.6, -1.0, 90], ['À la porte d’entrée', 'At the front door', 0.0, 3.3, 180], ['Dans l’escalier', 'On the stairs', -3.7, 1.4, 180, null, 1.66],
    ['1er : sur le lit', '1st: on the bed', 0.6, -2.4, 0, 'lie', 3.45], ['1er : sur le palier', '1st: on the landing', -3.0, -2.0, 90, null, 2.9], ['1er : salle de bain', '1st: bathroom', 2.6, 2.2, 180, null, 2.9],
    ['2e : chambre d’enfant', '2nd: child’s room', 2.4, -1.4, -60, null, 5.8], ['2e : au bureau, assis', '2nd: at the desk, seated', 2.4, 2.8, 180, 'sit', 5.8 - 0.4], ['Au grenier', 'In the attic', 0.6, 0.2, 90, null, 8.7], ['Dans le jardin', 'In the garden', 1.6, 7.0, 180] ],
  roof:[ ['Au bord du toit', 'At the edge', 0.0, -6.3, 180], ['Face à face', 'Facing', 0.9, -4.8, 0], ['Près du château d’eau', 'By the water tower', -2.2, -2.2, -130], ['Assis sur le rebord', 'Sitting on the ledge', 3.0, 6.75, 180, 'sit', 0.55] ],
  warehouse:[ ['Au milieu, face à face', 'In the middle, facing', -0.8, 1.8, 120], ['En face', 'Opposite', 0.6, 1.0, -60], ['Entre les rayonnages', 'Between the racks', -5.0, 2.6, 90], ['Caché derrière une caisse', 'Hiding behind a crate', -3.0, -1.5, 180, 'crouch'] ],
  country:[ ['Au bord de la route', 'By the roadside', 4.3, 1.0, -90], ['Sur la route', 'On the road', 0.9, 3.0, 180, 'walk'], ['Près de la clôture', 'By the fence', -5.0, -1.6, 90], ['Dans le champ', 'In the field', -12.0, -6.0, 30] ],
  airfield:[ ['Sur le tarmac', 'On the apron', -2.0, 4.0, 60], ['En face', 'Facing', 0.2, 5.4, -120], ['Dans le hangar', 'In the hangar', -22, -9, 90], ['Au bord de la piste', 'By the runway', 4.2, 20, 90], ['Sur l’aire de l’hélico', 'On the helipad', -6, 11, 180, null, 0.04], ['Au pied de la tour', 'At the tower', -35.4, 10, 90] ],
  forest:[ ['Dans la clairière', 'In the clearing', 0.2, 0.6, 200], ['En face', 'Facing', -0.9, -0.6, 30], ['Sur le sentier', 'On the path', 1.2, -12, 0, 'walk'], ['Assis sur un rondin', 'Sitting on a log', -0.7, -3.1, 0, 'sit'], ['Sur la passerelle', 'On the footbridge', 9, 2, 90, null, 0.16], ['Dans la cabane', 'In the cabin', -6.5, 5.5, 160, null, 0.15], ['Entre les arbres', 'Among the trees', -12, -10, 40] ],
  hotel:[ ['Assis sur le lit', 'Sitting on the bed', -0.6, 0.75, 180, 'sit', -0.25], ['Debout, en face', 'Standing, facing', -0.8, -0.7, 0], ['À la fenêtre', 'At the window', -3.0, -0.2, -90], ['Au bureau', 'At the desk', 0.75, 0.9, 90, 'sit'], ['Allongé sur le lit', 'Lying on the bed', -1.0, 1.9, 180, 'lie', 0.66], ['Dans la salle de bain', 'In the bathroom', 2.5, 1.2, 90], ['À la porte', 'At the door', 2.7, -2.4, 0] ],
  parking:[ ['Dans l’allée', 'In the aisle', -1.0, 0.4, 70], ['En face', 'Facing', 0.6, -0.4, -110], ['À la portière', 'At the car door', -4.5, 3.7, 90], ['Contre un pilier', 'Against a pillar', 0.0, 2.55, 180], ['Devant l’ascenseur', 'At the lift', -13.2, 0.0, 90], ['En marchant', 'Walking', 6.0, 0.8, -90, 'walk'] ],
  diner:[ ['Dans la voiture, côté malle', 'In the car booth, back seat', -5.55, -4.02, 0, 'sit'], ['Dans la voiture, en face', 'In the car booth, facing', -5.55, -2.48, 180, 'sit'], ['Sur la piste de danse', 'On the dance floor', 5.2, 0.3, -90, null, 0.2], ['En face, sur la piste', 'Facing, on the dance floor', 4.5, 0.3, 90, null, 0.2], ['Au comptoir', 'At the counter', 1.5, 3.55, 0, 'sit', -0.1], ['Près du juke-box', 'By the jukebox', 5.7, -2.2, -60], ['Entre les tables', 'Between the tables', 1.4, -0.6, 200] ],
  bank:[ ['Au guichet', 'At the counter', -1.2, 2.3, 0], ['Derrière le guichet', 'Behind the counter', -1.2, 4.2, 180], ['Dans la file', 'In the queue', 0, -0.4, 0], ['À l’entrée', 'At the entrance', 0.6, -6.0, 0], ['Devant la chambre forte', 'In front of the vault', 5.8, 5.2, 180], ['Assis sur le banc', 'Sitting on the bench', -6.5, -5.75, 0, 'sit', 0.04] ],
  hospital:[ ['Allongé dans le lit', 'Lying in the bed', -2.0, -2.43, 0, 'lie', 0.62], ['Dans le fauteuil, au chevet', 'In the bedside armchair', -0.78, -2.2, -90, 'sit', -0.3], ['Le médecin, au pied du lit', 'The doctor, at the foot of the bed', -2.0, -0.85, 180], ['Debout, près du lit', 'Standing by the bed', -1.05, -0.45, -130], ['Dans le couloir', 'In the corridor', 3.5, 0, 0], ['En salle d’attente', 'In the waiting area', 2.38, 1.15, 90, 'sit'], ['À la fenêtre', 'At the window', -3.55, 0.1, -90] ],
  metro:[ ['Assis sur la banquette', 'Seated on the bench', 1.1, 0, -90, 'sit', -0.37], ['Assis en face', 'Seated opposite', -1.1, 0.6, 90, 'sit', -0.37], ['Debout à la barre', 'Standing at the pole', 0.25, 1.2, 0], ['Devant la porte', 'By the door', 0.9, 3, -90], ['Au bout de la rame', 'At the end of the car', 0, -6.2, 0] ],
  school:[ ['Le professeur, au tableau', 'The teacher, at the board', -0.8, -2.9, 0], ['Élève, au premier rang', 'Student, front row', -0.9, -0.35, 180, 'sit'], ['Élève, au fond', 'Student, back row', 1.5, 2.45, 180, 'sit'], ['Au bureau du professeur', 'At the teacher’s desk', 1.7, -2.95, 0, 'sit'], ['À la fenêtre', 'At the window', 3.85, 0.3, 90], ['À la porte', 'At the door', -3.9, 2.6, 90] ],
  shop:[ ['À la caisse', 'At the till', 3.95, 2.1, -90], ['Le client, au comptoir', 'The customer, at the counter', 2.0, 2.3, 90], ['Dans le rayon', 'In the aisle', 0.25, -0.8, 90], ['Devant les frigos', 'By the fridges', -2.0, -2.75, 180], ['À l’entrée', 'At the entrance', -0.65, 3.2, 180], ['Au bout du rayon', 'At the end of the aisle', -2.05, 1.8, 180] ],
  meeting:[ ['En bout de table', 'At the head of the table', -2.75, 0, 90, 'sit'], ['Autour de la table', 'Around the table', 0, 1.05, 180, 'sit'], ['En face', 'Opposite', 0, -1.05, 0, 'sit'], ['Au tableau blanc', 'At the whiteboard', 0.6, 2.4, 180], ['Devant l’écran', 'By the screen', 3.2, -0.9, -90], ['À la baie vitrée', 'At the window', 1.6, -2.45, 180] ],
  bedroom:[ ['Allongé sur le lit', 'Lying on the bed', -0.6, -1.9, 0, 'lie', 0.66], ['Au bureau', 'At the desk', 2.6, 0.5, 90, 'sit'], ['Assis sur le lit', 'Sitting on the bed', -0.6, -0.75, 0, 'sit', -0.25], ['À la fenêtre', 'At the window', 2.85, -0.75, 60], ['Devant l’armoire', 'By the wardrobe', -2.35, 0.8, -90], ['À la porte', 'At the door', 2.4, 2.45, 180] ],
  kitchen:[ ['À la cuisinière', 'At the stove', 0.4, -1.8, 180], ['À table', 'At the table', -0.45, -0.05, 0, 'sit'], ['À table, en face', 'At the table, opposite', 0.45, 1.85, 180, 'sit'], ['À l’évier', 'At the sink', -1.4, -1.8, 180], ['Devant le frigo', 'By the fridge', 2.1, -1.5, 180], ['À la porte', 'At the door', -2.4, 2.2, 180] ],
  bath:[ ['Devant le miroir', 'At the mirror', -0.6, -1.15, 180], ['À la porte', 'At the door', 1.2, 1.4, 180], ['Près de la baignoire', 'By the bathtub', -1.3, 0.7, -90], ['Près de la fenêtre', 'By the window', 1.85, -0.65, 90] ],
  gas:[ ['À la pompe', 'At the pump', 2.55, 1.4, 90], ['De l’autre côté de la pompe', 'Other side of the pump', 4.45, -1.4, -90], ['Sous l’auvent', 'Under the canopy', 0, 0.6, 180], ['Devant la boutique', 'In front of the shop', 3.2, -6.9, 0], ['Au bord de la route', 'By the road', 1.5, 7.6, 180], ['Près du gonflage', 'By the air pump', -7.0, -2.9, -90] ],
  station:[ ['Sur le quai', 'On the platform', 0.8, 2.0, 160, null, 1.1], ['Face au train', 'Facing the train', 2.2, -8.9, 90, null, 1.1], ['Sur le banc', 'On the bench', -1.55, 4.0, 90, 'sit', 1.1], ['À la porte du train', 'At the train door', 2.6, -3.4, 90, null, 1.1], ['Sous le panneau des départs', 'Under the departures board', 0.6, -0.6, 180, null, 1.1], ['Au bout du quai', 'At the end of the platform', 0.5, -25, 0, null, 1.1] ],
  bar:[ ['Au comptoir', 'At the counter', -1.2, 2.15, 0, 'sit', -0.06], ['Le barman', 'The bartender', -0.8, 3.9, 180], ['Au billard', 'At the pool table', -2.7, -2.4, -90], ['Dans le box', 'In the booth', -4.3, -4.25, 90, 'sit', -0.33], ['En face, dans le box', 'Facing, in the booth', -2.9, -4.25, -90, 'sit', -0.33], ['À une table', 'At a table', 2.55, -1.5, -90, 'sit'], ['Près du juke-box', 'By the jukebox', 4.8, 2.2, 90] ],
  police:[ ['À l’accueil', 'At the front desk', -1, -3.0, 0], ['Derrière le comptoir', 'Behind the desk', -1, -1.5, 180], ['Dans la salle d’attente', 'In the waiting room', 4.4, -5.4, 0, 'sit'], ['À son bureau', 'At a desk', -3.6, 0.55, 0, 'sit'], ['Le suspect, à la table', 'The suspect, at the table', 5, 1.6, 0, 'sit'], ['L’inspecteur, en face', 'The detective, facing', 5, 3.6, 180, 'sit'], ['Dans la cellule', 'In the cell', -6.6, 5.4, 180] ],
};
// les lieux fermés d'une seule pièce : la caméra y reste aussi (même système que la maison)
[['garage', [-4, -4, 4, 4], 3.2], ['office', [-3.5, -3.5, 3.5, 3.5], 2.9], ['living', [-3.8, -3.2, 3.8, 3.2], 2.7], ['cafe', [-4.5, -3.5, 4.5, 3.5], 3.0], ['hall', [-1.6, -9, 1.6, 4], 2.6], ['warehouse', [-12, -8, 12, 8], 8], ['school', [-4.5, -3.5, 4.5, 3.5], 3.0], ['shop', [-5, -4, 5, 4], 3.0], ['meeting', [-4, -3, 4, 3], 2.8], ['bedroom', [-3.5, -3, 3.5, 3], 2.6], ['kitchen', [-3.5, -2.8, 3.5, 2.8], 2.6], ['bath', [-2.5, -2, 2.5, 2], 2.5]]
  .forEach(([id, r, h]) => { if(SET_DEF[id] && !SET_DEF[id].rooms){ SET_DEF[id].rooms = [[SETS.find(x => x.id === id).fr, SETS.find(x => x.id === id).en, 0, r]]; SET_DEF[id].roomH = h; } });
// la maison : les pièces deviennent la liste « aller dans une pièce » (avec le jardin à la fin)
Object.values(SET_DEF).forEach(d => { if(d.rooms && (d.levels || d.rooms.length > 1)) d.floors = d.rooms.map(r => { const c = roomCam(d, r); return [r[0], r[1], r[2], c.eye, c.target, r]; }).concat(d.garden ? [d.garden] : []); });
// un lieu à étages s'ouvre sur sa première pièce, cadrée depuis son coin (jamais dans un mur)
Object.values(SET_DEF).forEach(d => { if(d.floors && d.levels){ const f = d.floors[0]; d.cam = camLook(f[3], f[4], 22); } });
// les deux premières places servent de départ quand on choisit le lieu
Object.keys(SPOTS).forEach(id => { SET_DEF[id].spawn = SPOTS[id].map(p => ({ x:p[2], z:p[3], ry:p[4], pose:p[5], y:p[6] })); });
const SET_COLL = {};
function setGeo(id){
  const g = geo(), gl = geo(), L = (SET_DEF[id].levels || []).map(() => geo());
  COLL = new Map(); PANES = new Map(); TEXS = new Map(); SET_DEF[id].build(g, gl, L);
  const E = { b:[], w:[], p:[] }; SET_COLL[id] = { main:COLL.get(g) || E, levels:L.map(l => COLL.get(l) || E) }; COLL = null;
  const P = PANES, T = TEXS; PANES = null; TEXS = null;
  return { g, glass:gl, levels:L, panes:P.get(g) || null, levelPanes:L.map(l => P.get(l) || null), tex:[...T.entries()] };
}

/* ---------- « Mon lieu » : un lieu qu'on fabrique soi-même ----------
   La taille, dedans ou dehors, le sol, les murs, le plafond (un motif tout prêt dans la couleur choisie, ou sa propre image),
   les fenêtres et la porte. On le meuble ensuite avec les accessoires. Il voyage avec le storyboard.
   Les motifs sont dessinés une fois dans une petite image (256 px) et répétés : presque rien à calculer. */
const TEX_KINDS = {
  parquet:{ fr:'Parquet', en:'Wood floor', s:1.6, on:'f', cols:['#A9825A', '#7A5638', '#C9A27A', '#5E4532'] },
  tiles:{ fr:'Carrelage', en:'Tiles', s:1.2, on:'fwc', cols:['#E6E2DA', '#CFD8DC', '#B9A88F', '#3A3D44'] },
  checker:{ fr:'Damier', en:'Checkerboard', s:1.2, on:'f', cols:['#24262B', '#8E3B34', '#2F5E7E'] },
  carpet:{ fr:'Moquette', en:'Carpet', s:1, on:'f', cols:['#5E646C', '#8E3B34', '#3D5A80', '#B9A88F'] },
  concrete:{ fr:'Béton', en:'Concrete', s:3, on:'fwc', cols:['#A7A49E', '#8E8B85', '#C9C6BE'] },
  cobble:{ fr:'Pavés', en:'Cobblestones', s:1.2, on:'f', cols:['#8E8B85', '#A08A6E', '#6E6A64'] },
  asphalt:{ fr:'Bitume', en:'Asphalt', s:3, on:'f', cols:['#55585F', '#6E7178'] },
  grass:{ fr:'Herbe', en:'Grass', s:2.4, on:'f', cols:['#6F8F5A', '#5E7F48', '#8A9A5B'] },
  sand:{ fr:'Sable', en:'Sand', s:2.4, on:'f', cols:['#D9C7A0', '#C9B48F'] },
  dirt:{ fr:'Terre', en:'Dirt', s:2.4, on:'f', cols:['#8A6E50', '#6E5A44'] },
  paint:{ fr:'Peinture', en:'Paint', s:2, on:'wc', cols:['#E7E2DA', '#C9D2D6', '#E6D3B3', '#9DB3A6', '#B98E8E', '#3A3D44'] },
  brick:{ fr:'Briques', en:'Bricks', s:1.2, on:'w', cols:['#A0523D', '#B9876A', '#E6E2DA', '#5E636C'] },
  stone:{ fr:'Pierre', en:'Stone', s:1.8, on:'w', cols:['#B9AE9C', '#8E8B85', '#D2C6AE'] },
  panel:{ fr:'Lambris', en:'Wood panels', s:1.2, on:'wc', cols:['#A9825A', '#E6E2DA', '#5E4532', '#3D5A80'] },
  stripes:{ fr:'Papier peint', en:'Wallpaper', s:1, on:'w', cols:['#C9B48F', '#9DB3A6', '#B98E8E', '#3D5A80'] },
  ceiltile:{ fr:'Dalles', en:'Ceiling tiles', s:1.2, on:'c', cols:['#EEEBE6', '#D6D3CC'] },
};
const TEX_CAN = new Map();
function texCanvas(kind, col){
  const key = kind + ':' + col; if(TEX_CAN.has(key)) return TEX_CAN.get(key);
  const N = 256, cv = document.createElement('canvas'); cv.width = cv.height = N; const x = cv.getContext('2d');
  let seed = 7; [...kind].forEach(ch => seed = (seed * 31 + ch.charCodeAt(0)) % 233280);
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280, C = hexRGB(col);
  const tone = (k, a) => `rgba(${Math.round(Math.min(255, C[0] * 255 * k))},${Math.round(Math.min(255, C[1] * 255 * k))},${Math.round(Math.min(255, C[2] * 255 * k))},${a == null ? 1 : a})`;
  const fill = (k, X, Y, W, H, a) => { x.fillStyle = tone(k, a); x.fillRect(X, Y, W, H); };
  const speck = (n, sz, k0, k1, a) => { for(let i = 0; i < n; i++) fill(k0 + (k1 - k0) * rnd(), rnd() * N, rnd() * N, sz, sz, a); };
  // un rectangle qui déborde se répète de l'autre côté : le motif se raccorde sans couture
  const wrap = (k, X, Y, W, H, a) => { [-N, 0, N].forEach(dx => [-N, 0, N].forEach(dy => { if(X + dx < N && X + dx + W > 0 && Y + dy < N && Y + dy + H > 0) fill(k, X + dx, Y + dy, W, H, a); })); };
  fill(1, 0, 0, N, N);
  if(kind === 'parquet'){ for(let r = 0; r < 8; r++){ let s = rnd() * 128; for(let i = 0; i < 3; i++){ const k = 0.86 + rnd() * 0.24; wrap(k, s + i * 128, r * 32, 127, 31); for(let j = 0; j < 3; j++) wrap(k * 0.93, s + i * 128 + 8, r * 32 + 5 + rnd() * 22, 100 + rnd() * 18, 1, 0.6); } fill(0.62, 0, r * 32 + 31, N, 1); } }
  else if(kind === 'tiles'){ for(let i = 0; i < 4; i++) for(let j = 0; j < 4; j++) fill(0.94 + rnd() * 0.1, i * 64 + 2, j * 64 + 2, 60, 60); speck(500, 1, 0.9, 1.06, 0.5); }
  else if(kind === 'checker'){ for(let i = 0; i < 4; i++) for(let j = 0; j < 4; j++) if((i + j) % 2){ x.fillStyle = '#ECE9E2'; x.fillRect(i * 64, j * 64, 64, 64); } speck(300, 1, 0.9, 1.1, 0.3); }
  else if(kind === 'carpet'){ speck(9000, 1, 0.82, 1.15, 0.7); }
  else if(kind === 'concrete'){ speck(4000, 1, 0.85, 1.12, 0.6); for(let i = 0; i < 14; i++) wrap(0.94 + rnd() * 0.1, rnd() * N, rnd() * N, 20 + rnd() * 60, 14 + rnd() * 40, 0.35); fill(0.78, 0, 0, N, 1); fill(0.78, 0, 0, 1, N); }
  else if(kind === 'cobble'){ fill(0.55, 0, 0, N, N); for(let r = 0; r < 6; r++){ const o = (r % 2) * 21; for(let i = 0; i < 6; i++){ const k = 0.85 + rnd() * 0.25; wrap(k, o + i * 43 + 2, r * 43 + 2, 39, 39); wrap(k * 1.08, o + i * 43 + 6, r * 43 + 5, 26, 14, 0.5); } } }
  else if(kind === 'asphalt'){ speck(9000, 1, 0.7, 1.3, 0.6); }
  else if(kind === 'grass'){ for(let i = 0; i < 18; i++) wrap(0.9 + rnd() * 0.2, rnd() * N, rnd() * N, 40 + rnd() * 70, 30 + rnd() * 60, 0.4); for(let i = 0; i < 2600; i++) fill(0.75 + rnd() * 0.5, rnd() * N, rnd() * N, 1, 3 + rnd() * 4, 0.8); }
  else if(kind === 'sand'){ speck(7000, 1, 0.88, 1.1, 0.6); for(let r = 0; r < 10; r++) fill(0.94, 0, r * 26 + rnd() * 8, N, 2, 0.4); }
  else if(kind === 'dirt'){ for(let i = 0; i < 24; i++) wrap(0.85 + rnd() * 0.3, rnd() * N, rnd() * N, 20 + rnd() * 50, 14 + rnd() * 40, 0.45); speck(1500, 2, 0.7, 1.25, 0.8); }
  else if(kind === 'paint'){ speck(2500, 2, 0.97, 1.03, 0.5); }
  else if(kind === 'brick'){ x.fillStyle = '#D8D3C8'; x.fillRect(0, 0, N, N); for(let r = 0; r < 12; r++){ const o = (r % 2) * 32, y = Math.round(r * N / 12); for(let i = 0; i < 4; i++) wrap(0.82 + rnd() * 0.3, o + i * 64 + 2, y + 2, 60, Math.round(N / 12) - 4); } speck(1500, 1, 0.8, 1.1, 0.4); }
  else if(kind === 'stone'){ fill(0.6, 0, 0, N, N); let y = 0; while(y < N){ const h = 36 + rnd() * 30; let X = rnd() * 40; while(X < N + 40){ const w = 40 + rnd() * 60; wrap(0.85 + rnd() * 0.28, X + 3, y + 3, w - 6, h - 6); X += w; } y += h; } speck(1500, 1, 0.8, 1.1, 0.4); }
  else if(kind === 'panel'){ for(let i = 0; i < 8; i++){ const k = 0.88 + rnd() * 0.2; fill(k, i * 32, 0, 31, N); for(let j = 0; j < 4; j++) fill(k * 0.93, i * 32 + 4 + rnd() * 22, 0, 1, N, 0.5); fill(0.6, i * 32 + 31, 0, 1, N); } }
  else if(kind === 'stripes'){ for(let i = 0; i < 4; i++){ fill(1.12, i * 64, 0, 32, N); fill(0.82, i * 64 + 46, 0, 3, N); } speck(800, 1, 0.95, 1.05, 0.4); }
  else if(kind === 'ceiltile'){ for(let i = 0; i < 4; i++) for(let j = 0; j < 4; j++){ fill(0.96 + rnd() * 0.06, i * 64 + 2, j * 64 + 2, 60, 60); } fill(0.8, 0, 0, N, 2); fill(0.8, 0, 0, 2, N); for(let i = 1; i < 4; i++){ fill(0.8, 0, i * 64, N, 2); fill(0.8, i * 64, 0, 2, N); } speck(900, 1, 0.82, 0.95, 0.5); }
  TEX_CAN.set(key, cv); return cv;
}
/* une image de l'utilisateur : réduite à 256 × 256 (nette de près, légère), puis répétée */
const TEX_IMG = new Map();
function texImage(id){
  if(TEX_IMG.has(id)) return TEX_IMG.get(id);
  const url = typeof PHOTOS !== 'undefined' && PHOTOS.get(id); if(!url) return null;
  TEX_IMG.set(id, null);
  const im = new Image(); im.onload = () => { const cv = document.createElement('canvas'); cv.width = cv.height = 256; cv.getContext('2d').drawImage(im, 0, 0, 256, 256); TEX_IMG.set(id, cv);
    if(typeof THUMBS !== 'undefined') THUMBS.clear(); if(typeof PLACE_PREV !== 'undefined') [...PLACE_PREV.keys()].forEach(k => { if(k.startsWith('my_')) PLACE_PREV.delete(k); });
    if(typeof requestRender === 'function') requestRender(); if(typeof renderStrip === 'function') renderStrip(); };
  im.src = url; return null;
}
const texSrc = key => { const [k, v] = key.split('|'); return k === 'img' ? texImage(v) : texCanvas(k, v); };
const mapSurf = (o, def) => { o = o || {}; const k = (o.k === 'img' && o.img) || TEX_KINDS[o.k] ? o.k : def; return { k, c:o.c || (TEX_KINDS[k] || TEX_KINDS[def]).cols[0], s:o.s || (TEX_KINDS[k] || { s:1.5 }).s, img:o.img }; };
const texKey = f => f.k === 'img' ? 'img|' + f.img : f.k + '|' + f.c;
function mapDef(m){
  const out = m.kind === 'out', W = clamp(+m.w || 8, 3, 40), D = clamp(+m.d || 6, 3, 40), H = clamp(+m.h || 2.8, 2.2, 6);
  const x0 = -W / 2, x1 = W / 2, z0 = -D / 2, z1 = D / 2, walls = !out || m.walls;
  const F = mapSurf(m.floor, out ? 'grass' : 'parquet'), Wl = mapSurf(m.wall, out ? 'brick' : 'paint'), C = mapSurf(m.ceil, 'paint');
  const d = { custom:m.id, view:m.view === 'nature' ? 'nature' : undefined,
    cam:{ tx:0, ty:1.1, tz:0, yaw:-32, pitch:-8, dist:out ? clamp(Math.max(W, D) * 0.5, 5, 14) : clamp(Math.max(W, D) * 0.6, 3, 9), lens:24 },
    spawn:[{ x:-0.6, z:0, ry:20 }, { x:0.6, z:0.2, ry:-20 }],
    build(g){
      tfloor(texKey(F), x0, z0, x1, z1, 0, F.s);
      // dehors, au-delà du terrain : un sol neutre (la teinte de l'herbe, du sable… si c'est un sol naturel)
      if(out) floor(g, -150, -150, 150, 150, -0.03, hexRGB(/grass|sand|dirt|asphalt|cobble|concrete/.test(F.k) ? F.c : '#8F9A7E').map(v => v * 0.92));
      if(!walls) return;
      const WH = out ? clamp(+m.wh || 2.4, 1, 6) : H, K = texKey(Wl);
      [[[x0, z0], [x1, z0]], [[x0, z1], [x0, z0]], [[x1, z0], [x1, z1]], [[x1, z1], [x0, z1]]].forEach(([a, b]) => twall(g, K, a, b, WH, 0, Wl.s));
      if(!out){
        tfloor(texKey(C), x0, z0, x1, z1, H, C.s, true);
        [[x0, z0 + 0.008, x1, z0 + 0.008], [x0 + 0.008, z1, x0 + 0.008, z0], [x1 - 0.008, z0, x1 - 0.008, z1], [x1, z1 - 0.008, x0, z1 - 0.008]].forEach(([a, b, c, e]) => wall(g, [a, b], [c, e], 0.08, '#E9E6E0'));
        // les plafonniers : un tous les trois mètres environ, toujours collés au plafond, quelle que soit sa hauteur (allumés la nuit)
        const nx = Math.max(1, Math.round(W / 3)), nz = Math.max(1, Math.round(D / 3)), m0 = MAT; MAT = 5;
        for(let i = 0; i < nx; i++) for(let j = 0; j < nz; j++) box(g, x0 + (i + 0.5) * W / nx, H - 0.02, z0 + (j + 0.5) * D / nz, 1.0, 0.04, 0.3, '#F7F5F0');
        MAT = m0;
      }
      // les fenêtres : d'abord le mur du fond, puis la droite, puis la gauche
      const win = clamp(Math.round(+m.win || 0), 0, 8), sides = [[x0, x1, z0, 'z', 1], [z0, z1, x1, 'x', -1], [z1, z0, x0, 'x', 1]], wy = out ? 0.9 : 0.9, wh = Math.min(1.4, WH - 1.2);
      let left = win;
      sides.forEach(([u0, u1, c, ax, inw]) => { if(left <= 0 || wh < 0.4) return; const len = Math.abs(u1 - u0), fit = Math.max(0, Math.floor((len - 0.6) / 2)), n = Math.min(left, fit); left -= n;
        for(let k = 0; k < n; k++){ const t = (k + 0.5) / n, u = u0 + (u1 - u0) * t, A = u - 0.7 * Math.sign(u1 - u0), B = u + 0.7 * Math.sign(u1 - u0);
          const P = (v, off) => ax === 'z' ? [v, c + inw * off] : [c + inw * off, v];
          pane(g, P(A, 0.015), P(B, 0.015), wh, '#A9C9DE', wy);
          wall(g, P(A - 0.05 * Math.sign(u1 - u0), 0.025), P(B + 0.05 * Math.sign(u1 - u0), 0.025), 0.06, '#F4F2EE', wy - 0.04); wall(g, P(A - 0.05 * Math.sign(u1 - u0), 0.025), P(B + 0.05 * Math.sign(u1 - u0), 0.025), 0.06, '#F4F2EE', wy + wh - 0.02);
          [A, u, B].forEach(v => wall(g, P(v - 0.03 * Math.sign(u1 - u0), 0.025), P(v + 0.03 * Math.sign(u1 - u0), 0.025), wh, '#F4F2EE', wy)); } });
      // la porte, sur le mur de devant
      if(m.door !== false && W >= 2.5){ const dx = x1 - 1.2;
        wall(g, [dx + 0.45, z1 - 0.012], [dx - 0.45, z1 - 0.012], 2.05, '#8C6B4E'); box(g, dx - 0.35, 1.0, z1 - 0.04, 0.13, 0.03, 0.04, '#C9CDD3');
        [dx - 0.5, dx + 0.5].forEach(x => box(g, x, 1.04, z1 - 0.03, 0.06, 2.08, 0.06, '#F4F2EE')); box(g, dx, 2.1, z1 - 0.03, 1.12, 0.06, 0.06, '#F4F2EE'); }
    } };
  if(out){ d.bg = '#C6D6E4'; d.sky = { top:'#82B0D8', hor:'#DCE8EE', low:'#7C9A68' }; d.fog = [30, 160]; }
  else { d.rooms = [[m.name || 'Mon lieu', m.name || 'My place', 0, [x0, z0, x1, z1]]]; d.roomH = H; }
  return d;
}
/* les lieux d'un storyboard rejoignent la liste des lieux (une seule fois, refaits seulement s'ils ont changé) */
const MAP_SIG = {};
function syncMaps(doc){
  ((doc && doc.maps) || []).forEach(m => {
    const id = 'my_' + m.id, sig = JSON.stringify(m); if(MAP_SIG[id] === sig && SET_DEF[id]) return;
    MAP_SIG[id] = sig; SET_DEF[id] = mapDef(m);
    const st = SETS.find(x => x.id === id), nm = m.name || L('Mon lieu', 'My place');
    if(st){ st.fr = nm; st.en = nm; } else SETS.push({ id, fr:nm, en:nm, custom:true });
    if(typeof dropSet === 'function') dropSet(id);
  });
}

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
    ['drone','Drone qui s’élève','Drone rising'], ['epa','Caméra épaule','Handheld'], ['end','Vers un cadre de fin','To an end frame'],
    ['orbitL','Travelling circulaire vers la gauche','Arc shot left'], ['arc360','Tour complet (360°)','360° orbit'], ['pedU','La caméra monte (pied)','Pedestal up'], ['pedD','La caméra descend (pied)','Pedestal down'],
    ['vertigo','Effet Vertigo (recule et zoome)','Dolly zoom (Vertigo)'], ['vertigoIn','Effet Vertigo inversé','Reverse dolly zoom'], ['crash','Zoom brutal','Crash zoom'],
    ['whipR','Panoramique filé à droite','Whip pan right'], ['whipL','Panoramique filé à gauche','Whip pan left'], ['follow','Steadicam qui suit','Steadicam follow'],
    ['shake','Secousse (choc, explosion)','Camera shake (impact)'], ['rollIn','Bascule progressive','Dutch roll']],
};
/* les mouvements rangés par famille, avec ce qu'ils racontent (pour l'amateur) et un film qui les a rendus célèbres (pour le pro) */
const MOVE_GROUPS = [
  ['Les classiques', 'The basics', ['fix', 'in', 'out', 'panR', 'panL', 'tiltU', 'tiltD', 'travR', 'travL']],
  ['L’objectif', 'The lens', ['zoomIn', 'zoomOut', 'crash', 'vertigo', 'vertigoIn']],
  ['Autour et en hauteur', 'Around and up', ['orbit', 'orbitL', 'arc360', 'grue', 'grueD', 'pedU', 'pedD', 'drone']],
  ['Le style', 'Style', ['epa', 'follow', 'whipR', 'whipL', 'shake', 'rollIn', 'end']],
];
const MOVE_TIP = {
  fix:['La caméra ne bouge pas : on regarde la scène.', 'The camera stays still: we watch the scene.'],
  in:['On s’approche : la tension monte, on entre dans la tête du personnage.', 'Moving closer: tension rises, we get into the character’s head.'],
  out:['On s’éloigne : on révèle le lieu, ou on laisse le personnage seul.', 'Moving away: reveals the place, or leaves the character alone.'],
  panR:['La caméra pivote sur place vers la droite.', 'The camera turns on the spot to the right.'], panL:['La caméra pivote sur place vers la gauche.', 'The camera turns on the spot to the left.'],
  tiltU:['La caméra lève les yeux.', 'The camera looks up.'], tiltD:['La caméra baisse les yeux.', 'The camera looks down.'],
  travR:['La caméra glisse sur le côté, comme sur des rails.', 'The camera slides sideways, as if on rails.'], travL:['La caméra glisse sur le côté, comme sur des rails.', 'The camera slides sideways, as if on rails.'],
  zoomIn:['L’objectif grossit l’image sans que la caméra bouge.', 'The lens magnifies without moving the camera.'], zoomOut:['L’objectif élargit l’image sans que la caméra bouge.', 'The lens widens without moving the camera.'],
  crash:['Un zoom très rapide sur un détail : effet choc (Tarantino, les westerns de Leone).', 'A very fast zoom onto a detail: a jolt (Tarantino, Leone westerns).'],
  vertigo:['La caméra recule en zoomant : le sujet garde sa taille, le décor se déforme (Vertigo, Les Dents de la mer).', 'The camera pulls back while zooming in: the subject stays the same size, the background warps (Vertigo, Jaws).'],
  vertigoIn:['La caméra avance en dézoomant : le décor s’ouvre derrière le sujet.', 'The camera pushes in while zooming out: the background opens up behind the subject.'],
  orbit:['La caméra tourne autour du sujet.', 'The camera circles the subject.'], orbitL:['La caméra tourne autour du sujet, dans l’autre sens.', 'The camera circles the subject, the other way.'],
  arc360:['Un tour complet autour des personnages (les baisers de cinéma, Michael Bay).', 'A full circle around the characters (movie kisses, Michael Bay).'],
  grue:['La caméra s’élève et regarde vers le bas : on prend de la hauteur.', 'The camera rises and looks down: we gain height.'], grueD:['La caméra descend vers la scène.', 'The camera comes down to the scene.'],
  pedU:['Toute la caméra monte droit, sans changer d’angle.', 'The whole camera rises straight up, same angle.'], pedD:['Toute la caméra descend droit, sans changer d’angle.', 'The whole camera goes straight down, same angle.'],
  drone:['On s’envole très haut au-dessus du lieu (fin de film).', 'We fly high above the place (ending shot).'],
  epa:['Caméra tenue à l’épaule : vivant, nerveux, documentaire.', 'Handheld camera: alive, nervous, documentary.'],
  follow:['La caméra accompagne le personnage qui marche (Les Affranchis).', 'The camera travels with the walking character (Goodfellas).'],
  whipR:['La caméra pivote si vite que l’image file : une transition énergique.', 'The camera turns so fast the picture blurs: an energetic transition.'], whipL:['La caméra pivote si vite que l’image file : une transition énergique.', 'The camera turns so fast the picture blurs: an energetic transition.'],
  shake:['Une secousse qui s’éteint : un choc, une explosion, un coup de feu.', 'A shake that dies down: an impact, an explosion, a gunshot.'],
  rollIn:['L’image penche peu à peu : le malaise s’installe.', 'The picture slowly tilts: unease sets in.'],
  end:['Tu cadres l’image de départ et celle d’arrivée : la caméra va de l’une à l’autre.', 'You frame the start and end images: the camera travels between them.'],
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
  // allongé (au sol, sur un lit) : le corps est à plat, on le cadre d'un peu au-dessus, centré sur le buste
  // (sinon le point visé tombait sous le lit, et la caméra avec lui)
  if(height < 0.75){
    const M = charMatrices(ch), c = M4.apply(M.chest, [0, 0.05, 0]), close = size === 'gp' || size === 'tgp' || size === 'pr';
    const t = close ? b.eyes : [(c[0] + ch.root.x) / 2, c[1], (c[2] + ch.root.z) / 2];
    return { tx:t[0], ty:t[1] + 0.05, tz:t[2], yaw:b.face + s, pitch:Math.min(A.pitch, 0) - 34, dist:clamp(dist * 0.9, 0.35, 28), lens:L_ };
  }
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
  ['dessus', 'Vue du dessus', 'From above', [0.2, 9, 0.6], [0, 0.5, -0.2], 24, 'pg', 'dess'],
  // les prises de vue de film de voiture (Pulp Fiction, Drive…)
  ['coffre', 'Vu du coffre (Pulp Fiction)', 'Trunk shot (Pulp Fiction)', [0, 0.9, -2.72], [0, 1.6, -4.4], 18, 'pm', 'con'],
  ['dos2', 'Les deux de dos, depuis la banquette', 'Both from behind, from the back seat', [0, 1.47, -1.4], [0, 1.3, 1.2], 24, '2p'],
  ['tableau', 'Depuis le tableau de bord', 'From the dashboard', [0.02, 1.13, 1.0], [0.37, 1.4, 0.25], 28, 'gp', 'con'],
  ['capot', 'Sur le capot, les deux', 'On the hood, both', [0, 1.13, 2.15], [0, 1.28, -0.2], 22, '2p'],
  ['passager', 'Le conducteur vu du passager', 'The driver from the passenger seat', [-0.1, 1.33, 0.75], [0.45, 1.32, 0.22], 28, 'pr'],
  ['roue', 'Au ras de la roue', 'Down by the wheel', [1.55, 0.28, 2.9], [0.4, 0.55, -1.2], 22, 'pe', 'sol'],
  ['suivre', 'On suit la voiture (¾ arrière)', 'Following the car (¾ rear)', [-2.4, 1.7, -7.0], [0, 0.9, 0], 35, 'pe'],
  ['cote', 'Travelling à hauteur de vitre', 'Tracking alongside at window height', [3.9, 1.25, 0.1], [0.2, 1.15, 0.1], 35, 'pa'],
];
/* ---------- Les objets à poser ----------
   Comme les véhicules : on les pose devant la caméra, on les déplace et on les tourne avec leur poignée.
   Chacun : nom, couleurs au choix, hauteur de l'étiquette, empreinte de son ombre (demi-largeur, demi-profondeur). */
const OBJ_DEF = {
  chair:{ cat:'home', fr:'Chaise', en:'Chair', cols:['#6E5440', '#24262B', '#B4232C', '#E9E6E0'], label:1.2, sh:[0.28, 0.28] },
  table:{ cat:'home', fr:'Table', en:'Table', cols:['#7A5C42', '#E9E6E0', '#2C2E33'], label:1.05, sh:[0.65, 0.42] },
  box:{ cat:'misc', fr:'Carton', en:'Cardboard box', cols:['#B08A5A'], label:0.8, sh:[0.27, 0.27] },
  case:{ cat:'misc', fr:'Valise', en:'Suitcase', cols:['#B4232C', '#24262B', '#3D5A80', '#C9B48F'], label:0.95, sh:[0.25, 0.14] },
  bag:{ cat:'misc', fr:'Sac de sport', en:'Duffel bag', cols:['#24262B', '#2F6E4F', '#3D5A80'], label:0.6, sh:[0.34, 0.2] },
  plant:{ cat:'home', fr:'Plante', en:'Plant', cols:['#B9876A', '#E9E6E0', '#2C2E33'], label:1.4, sh:[0.3, 0.3] },
  lamp:{ cat:'home', fr:'Lampadaire', en:'Floor lamp', cols:['#2C2E33', '#C9A64B'], label:1.95, sh:[0.2, 0.2] },
  crate:{ cat:'misc', fr:'Caisse en bois', en:'Wooden crate', cols:['#9A7A55'], label:0.95, sh:[0.33, 0.33] },
  barrel:{ cat:'street', fr:'Bidon', en:'Oil drum', cols:['#2F6E4F', '#9B3B33', '#3D5A80', '#E8B923'], label:1.2, sh:[0.32, 0.32] },
  tv:{ cat:'home', fr:'Télévision', en:'TV set', cols:['#1E1F23'], label:1.25, sh:[0.45, 0.25] },
  bench:{ cat:'street', fr:'Banc', en:'Bench', cols:['#7A5C42', '#2F6E4F'], label:1.05, sh:[0.8, 0.3] },
  bin:{ cat:'street', fr:'Poubelle', en:'Bin', cols:['#2F6E4F', '#5E636C', '#2C2E33'], label:1.05, sh:[0.3, 0.3] },
  door:{ cat:'home', fr:'Porte', en:'Door', cols:['#7A5C42', '#E9E6E0', '#3D5A80'], label:2.4, sh:[0.55, 0.12] },
  bed:{ cat:'home', fr:'Lit', en:'Bed', cols:['#2E4A6B', '#B4232C', '#E9E6E0'], label:1.0, sh:[0.8, 1.05] },
  sofa:{ fr:'Canapé', en:'Sofa', cat:'home', cols:['#3D5A80', '#8E3B34', '#C9B48F', '#4A4D55'], label:1.05, sh:[0.95, 0.43] },
  armchair:{ fr:'Fauteuil', en:'Armchair', cat:'home', cols:['#8E3B34', '#3D5A80', '#C9B48F', '#2F6E4F'], label:1.1, sh:[0.45, 0.43] },
  ctable:{ fr:'Table basse', en:'Coffee table', cat:'home', cols:['#7A5C42', '#E9E6E0', '#2C2E33'], label:0.7, sh:[0.55, 0.3] },
  shelf:{ fr:'Bibliothèque', en:'Bookcase', cat:'home', cols:['#6E5440', '#E9E6E0', '#2C2E33'], label:2.15, sh:[0.5, 0.17] },
  wardrobe:{ fr:'Armoire', en:'Wardrobe', cat:'home', cols:['#7A5C42', '#E9E6E0', '#3D5A80'], label:2.25, sh:[0.55, 0.3] },
  night:{ fr:'Table de chevet', en:'Nightstand', cat:'home', cols:['#7A5C42', '#E9E6E0', '#2C2E33'], label:1.05, sh:[0.23, 0.2] },
  stool:{ fr:'Tabouret de bar', en:'Bar stool', cat:'home', cols:['#24262B', '#B4232C', '#7A5C42'], label:0.95, sh:[0.18, 0.18] },
  fridge:{ fr:'Frigo', en:'Fridge', cat:'home', cols:['#E9E6E0', '#9AA0A8', '#24262B', '#B4232C'], label:2.05, sh:[0.35, 0.34] },
  rug:{ fr:'Tapis', en:'Rug', cat:'home', cols:['#8E3B34', '#3D5A80', '#C9B48F', '#4A4D55'], label:0.35, sh:[1.0, 0.7], h:0.02 },
  mirror:{ fr:'Miroir sur pied', en:'Standing mirror', cat:'home', cols:['#C9A64B', '#2C2E33', '#E9E6E0'], label:1.95, sh:[0.3, 0.2] },
  flowers:{ fr:'Bouquet', en:'Flowers', cat:'home', cols:['#3D5A80', '#E9E6E0', '#B4232C'], label:0.95, sh:[0.15, 0.15] },
  piano:{ fr:'Piano droit', en:'Upright piano', cat:'home', cols:['#24262B', '#5B4532', '#E9E6E0'], label:1.55, sh:[0.75, 0.42] },
  guitar:{ fr:'Guitare', en:'Guitar', cat:'home', cols:['#B9763A', '#24262B', '#B4232C'], label:1.5, sh:[0.2, 0.15] },
  desk:{ fr:'Bureau', en:'Desk', cat:'work', cols:['#7A5C42', '#E9E6E0', '#2C2E33'], label:1.05, sh:[0.7, 0.35] },
  laptop:{ fr:'Ordinateur portable', en:'Laptop', cat:'work', cols:['#3A3D44', '#BFC4CA'], label:0.5, sh:[0.17, 0.13] },
  screen:{ fr:'Écran d’ordinateur', en:'Computer screen', cat:'work', cols:['#24262B', '#E9E6E0'], label:0.7, sh:[0.28, 0.09] },
  safe:{ fr:'Coffre-fort', en:'Safe', cat:'work', cols:['#3A3D44', '#2F6E4F', '#8E3B34'], label:1.15, sh:[0.3, 0.31] },
  movie:{ fr:'Caméra de tournage', en:'Film camera', cat:'work', cols:['#24262B'], label:1.75, sh:[0.3, 0.3] },
  spot:{ fr:'Projecteur', en:'Film light', cat:'work', cols:['#24262B', '#9AA0A8'], label:1.95, sh:[0.3, 0.3] },
  mic:{ fr:'Pied de micro', en:'Mic stand', cat:'work', cols:['#24262B'], label:1.75, sh:[0.15, 0.15] },
  speaker:{ fr:'Enceinte', en:'Speaker', cat:'work', cols:['#24262B', '#E9E6E0'], label:1.1, sh:[0.23, 0.21] },
  ladder:{ fr:'Escabeau', en:'Stepladder', cat:'work', cols:['#9AA0A8', '#E8B923'], label:1.85, sh:[0.27, 0.35] },
  coffin:{ fr:'Cercueil', en:'Coffin', cat:'work', cols:['#5B4532', '#24262B', '#E9E6E0'], label:0.75, sh:[0.32, 1.02] },
  streetlamp:{ fr:'Réverbère', en:'Street lamp', cat:'street', cols:['#2C2E33', '#2F6E4F'], label:3.9, sh:[0.15, 0.15], pv:1.0 },
  traffic:{ fr:'Feu tricolore', en:'Traffic light', cat:'street', cols:['#2C2E33'], label:3.2, sh:[0.15, 0.15], pv:0.9 },
  stop:{ fr:'Panneau stop', en:'Stop sign', cat:'street', cols:['#B5352B'], label:2.55, sh:[0.33, 0.06], pv:0.6 },
  cone:{ fr:'Plot de chantier', en:'Traffic cone', cat:'street', cols:['#E2642B'], label:0.95, sh:[0.19, 0.19] },
  barrier:{ fr:'Barrière', en:'Barrier', cat:'street', cols:['#E2642B', '#C8392F', '#2F5E7E'], label:1.2, sh:[0.8, 0.2] },
  hydrant:{ fr:'Bouche d’incendie', en:'Fire hydrant', cat:'street', cols:['#B5352B', '#E8B923'], label:0.95, sh:[0.16, 0.16] },
  mailbox:{ fr:'Boîte aux lettres', en:'Mailbox', cat:'street', cols:['#E8B923', '#2F5E7E', '#B5352B'], label:1.6, sh:[0.15, 0.23] },
  bike:{ fr:'Vélo', en:'Bicycle', cat:'street', cols:['#B4232C', '#3D5A80', '#24262B', '#2F6E4F'], label:1.3, sh:[0.25, 0.85] },
  cart:{ fr:'Caddie', en:'Shopping cart', cat:'street', cols:['#B8BEC4'], label:1.25, sh:[0.3, 0.48] },
  tires:{ fr:'Pile de pneus', en:'Tyre stack', cat:'street', cols:['#24262B'], label:0.95, sh:[0.33, 0.33] },
  pallet:{ fr:'Palette', en:'Pallet', cat:'street', cols:['#B9935F'], label:0.4, sh:[0.6, 0.4], h:0.15 },
  fence:{ fr:'Clôture', en:'Fence', cat:'street', cols:['#9A7A55', '#E9E6E0', '#2C2E33'], label:1.25, sh:[1.04, 0.05] },
  tree:{ fr:'Arbre', en:'Tree', cat:'nature', cols:['#4E7C58', '#6B8F3A', '#B9763A'], label:3.6, sh:[0.2, 0.2], h:3.4, pv:1.1 },
  rock:{ fr:'Rocher', en:'Rock', cat:'nature', cols:['#8E8B85', '#6E6A64'], label:0.8, sh:[0.55, 0.45] },
  tent:{ fr:'Tente', en:'Tent', cat:'nature', cols:['#2F6E4F', '#E2642B', '#3D5A80'], label:1.45, sh:[1.0, 0.92] },
  campfire:{ fr:'Feu de camp', en:'Campfire', cat:'nature', cols:['#6B4E36'], label:0.7, sh:[0.4, 0.4] },
  parasol:{ fr:'Parasol', en:'Parasol', cat:'nature', cols:['#B4232C', '#3D5A80', '#E8B923', '#2F6E4F'], label:2.7, sh:[0.25, 0.25], pv:1.2 },
};
function objGeo(kind, col){
  const g = geo(), C = col || OBJ_DEF[kind].cols[0], H = hexRGB(C), dk = k => H.map(v => v * k), M = '#9AA0A8', K = '#2C2E33';
  const m0 = MAT; MAT = 0;
  if(kind === 'chair'){ box(g, 0, 0.45, 0, 0.44, 0.05, 0.44, C); box(g, 0, 0.75, -0.2, 0.44, 0.55, 0.04, C); box(g, 0, 0.88, -0.2, 0.44, 0.08, 0.05, dk(0.8));
    [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]].forEach(([x, z]) => box(g, x, 0.215, z, 0.04, 0.43, 0.04, dk(0.75))); }
  else if(kind === 'table'){ box(g, 0, 0.73, 0, 1.2, 0.05, 0.75, C); box(g, 0, 0.67, 0, 1.1, 0.07, 0.65, dk(0.8));
    [[-0.54, -0.32], [0.54, -0.32], [-0.54, 0.32], [0.54, 0.32]].forEach(([x, z]) => box(g, x, 0.35, z, 0.06, 0.7, 0.06, dk(0.75))); }
  else if(kind === 'box'){ box(g, 0, 0.25, 0, 0.5, 0.5, 0.5, C); box(g, 0, 0.502, 0, 0.08, 0.004, 0.52, '#C9B48F'); box(g, 0, 0.35, 0.252, 0.08, 0.3, 0.004, '#C9B48F'); }
  else if(kind === 'case'){ box(g, 0, 0.37, 0, 0.46, 0.62, 0.24, C); box(g, 0, 0.37, 0, 0.47, 0.03, 0.25, dk(0.7));
    box(g, 0, 0.72, 0, 0.04, 0.1, 0.03, K); box(g, 0, 0.77, 0, 0.18, 0.03, 0.03, K); [-0.17, 0.17].forEach(x => cyl(g, x - 0.01, 0.03, 0.08, 0.025, 0.025, 0.02, K, 8, 'x')); }
  else if(kind === 'bag'){ cyl(g, -0.32, 0.17, 0, 0.17, 0.17, 0.64, C, 12, 'x'); [-0.32, 0.32].forEach(x => cyl(g, x - 0.005, 0.17, 0, 0.165, 0.165, 0.01, dk(0.7), 12, 'x'));
    box(g, 0, 0.345, 0, 0.5, 0.012, 0.03, dk(0.6)); [-0.12, 0.12].forEach(x => box(g, x, 0.42, 0, 0.03, 0.16, 0.03, dk(0.6))); box(g, 0, 0.5, 0, 0.27, 0.03, 0.03, dk(0.6)); }
  else if(kind === 'plant'){ cyl(g, 0, 0.36, 0, 0.21, 0.16, 0.36, C, 12); cyl(g, 0, 0.37, 0, 0.19, 0.19, 0.02, '#4A3626', 12);
    ball(g, 0, 0.75, 0, 0.3, 0.38, 0.3, '#4E7C58', 9); ball(g, 0.13, 1.02, 0.05, 0.2, 0.22, 0.2, '#5A8A60', 8); ball(g, -0.12, 0.95, -0.08, 0.18, 0.2, 0.18, '#4E7C58', 8); }
  else if(kind === 'lamp'){ cyl(g, 0, 0.03, 0, 0.18, 0.18, 0.03, C, 12); cyl(g, 0, 1.6, 0, 0.018, 0.018, 1.57, C, 6); cyl(g, 0, 1.78, 0, 0.12, 0.23, 0.3, '#F2E6C9', 12); }
  else if(kind === 'crate'){ box(g, 0, 0.3, 0, 0.6, 0.6, 0.6, C);
    [-1, 1].forEach(sd => { box(g, 0, 0.3, sd * 0.305, 0.6, 0.06, 0.01, dk(0.75)); box(g, sd * 0.305, 0.3, 0, 0.01, 0.06, 0.6, dk(0.75)); box(g, 0, 0.3 + sd * 0.27, 0.305, 0.6, 0.05, 0.012, dk(0.75)); }); }
  else if(kind === 'barrel'){ cyl(g, 0, 0.9, 0, 0.29, 0.29, 0.9, C, 14); [0.3, 0.6].forEach(y => cyl(g, 0, y + 0.02, 0, 0.3, 0.3, 0.04, dk(0.7), 14)); cyl(g, 0, 0.905, 0, 0.27, 0.27, 0.01, dk(0.8), 14); cyl(g, 0.12, 0.93, 0.08, 0.04, 0.04, 0.03, dk(0.6), 8); }
  else if(kind === 'tv'){ box(g, 0, 0.25, 0, 0.9, 0.5, 0.42, '#5E4532'); box(g, 0, 0.52, 0, 0.25, 0.04, 0.15, K); box(g, 0, 0.56, 0, 0.04, 0.08, 0.04, K);
    box(g, 0, 0.92, 0, 0.84, 0.5, 0.05, C); box(g, 0, 0.92, 0.027, 0.78, 0.44, 0.005, '#2E3846'); }
  else if(kind === 'bench'){ box(g, 0, 0.45, 0, 1.6, 0.05, 0.42, C); box(g, 0, 0.75, -0.2, 1.6, 0.3, 0.04, C);
    [-0.7, 0.7].forEach(x => { box(g, x, 0.22, 0, 0.05, 0.44, 0.38, K); box(g, x, 0.62, -0.2, 0.05, 0.34, 0.04, K); }); }
  else if(kind === 'bin'){ cyl(g, 0, 0.85, 0, 0.27, 0.23, 0.85, C, 12); cyl(g, 0, 0.88, 0, 0.29, 0.29, 0.05, dk(0.75), 12); box(g, 0, 0.9, 0, 0.16, 0.025, 0.03, dk(0.6)); }
  else if(kind === 'door'){ [-0.5, 0.5].forEach(x => box(g, x, 1.06, 0, 0.08, 2.12, 0.14, '#E9E6E0')); box(g, 0, 2.15, 0, 1.08, 0.08, 0.14, '#E9E6E0');
    box(g, 0, 1.03, 0, 0.9, 2.06, 0.05, C); [0.6, 1.5].forEach(y => box(g, 0, y, 0.027, 0.7, 0.6, 0.005, dk(0.85))); [0.03, -0.03].forEach(z => box(g, 0.36, 1.02, z * 1.2, 0.12, 0.03, 0.03, M)); box(g, 0, 0.005, 0, 1.0, 0.01, 0.16, '#9AA0A8'); }
  else if(kind === 'bed'){ box(g, 0, 0.2, 0, 1.5, 0.3, 2.0, '#5E4532'); [[-0.68, -0.92], [0.68, -0.92], [-0.68, 0.92], [0.68, 0.92]].forEach(([x, z]) => box(g, x, 0.03, z, 0.08, 0.06, 0.08, '#4A3626'));   // ses pieds box(g, 0, 0.44, 0, 1.44, 0.18, 1.94, '#F4F2EE'); box(g, 0, 0.5, 0.25, 1.48, 0.08, 1.4, C);
    [-0.35, 0.35].forEach(x => ball(g, x, 0.58, -0.75, 0.28, 0.07, 0.16, '#FFFFFF', 10)); box(g, 0, 0.6, -1.02, 1.56, 0.9, 0.06, '#4A3626'); }
  else if(kind === 'sofa' || kind === 'armchair'){ const W = kind === 'sofa' ? 1.9 : 0.9;
    box(g, 0, 0.22, 0, W, 0.36, 0.85, dk(0.85)); box(g, 0, 0.72, -0.33, W, 0.56, 0.2, C);
    (kind === 'sofa' ? [-0.43, 0.43] : [0]).forEach(x => box(g, x, 0.46, 0.06, kind === 'sofa' ? 0.84 : 0.56, 0.12, 0.66, C));
    [-1, 1].forEach(e => box(g, e * (W / 2 - 0.08), 0.55, 0.02, 0.16, 0.3, 0.8, C));
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => box(g, a * (W / 2 - 0.08), 0.02, b * 0.36, 0.06, 0.04, 0.06, K)); }
  else if(kind === 'ctable'){ box(g, 0, 0.42, 0, 1.1, 0.04, 0.6, C); box(g, 0, 0.15, 0, 1.0, 0.02, 0.5, dk(0.8));
    [[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]].forEach(([x, z]) => box(g, x, 0.2, z, 0.05, 0.4, 0.05, dk(0.75))); }
  else if(kind === 'shelf'){ [-0.48, 0.48].forEach(x => box(g, x, 0.95, 0, 0.04, 1.9, 0.32, C)); box(g, 0, 0.95, -0.15, 0.92, 1.9, 0.02, dk(0.8));
    [0.04, 0.47, 0.92, 1.37, 1.88].forEach(y => box(g, 0, y, 0, 0.92, 0.04, 0.32, C));
    const e0 = EDGE_ON; EDGE_ON = 0; [0.06, 0.49, 0.94, 1.39].forEach((y, r) => { let x = -0.42; for(let k = 0; x < 0.36; k++){ const w = 0.04 + ((k + r) % 3) * 0.015, h = 0.24 + ((k * 5 + r) % 4) * 0.035;
      box(g, x + w / 2, y + 0.02 + h / 2, 0.01, w, h, 0.24, ['#9B3B33', '#2F6E4F', '#C9B48F', '#3D5A80', '#5E636C'][(k + r) % 5]); x += w + 0.008; } }); EDGE_ON = e0; }
  else if(kind === 'wardrobe'){ box(g, 0, 1.03, 0, 1.1, 1.94, 0.6, C); box(g, 0, 2.02, 0, 1.14, 0.04, 0.64, dk(0.8)); box(g, 0, 1.03, 0.302, 0.012, 1.86, 0.005, dk(0.6));
    [-0.06, 0.06].forEach(x => box(g, x, 1.1, 0.31, 0.02, 0.22, 0.02, M)); [[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]].forEach(([x, z]) => box(g, x, 0.03, z, 0.05, 0.06, 0.05, K)); }
  else if(kind === 'night'){ box(g, 0, 0.32, 0, 0.45, 0.5, 0.4, C); box(g, 0, 0.42, 0.202, 0.38, 0.012, 0.005, dk(0.6)); box(g, 0, 0.36, 0.205, 0.08, 0.02, 0.012, M);
    [[-0.19, -0.16], [0.19, -0.16], [-0.19, 0.16], [0.19, 0.16]].forEach(([x, z]) => box(g, x, 0.035, z, 0.04, 0.07, 0.04, dk(0.7)));
    cyl(g, 0.08, 0.6, -0.04, 0.06, 0.07, 0.03, K, 10); cyl(g, 0.08, 0.72, -0.04, 0.01, 0.01, 0.12, K, 6); cyl(g, 0.08, 0.86, -0.04, 0.07, 0.11, 0.15, '#F2E6C9', 10); }
  else if(kind === 'stool'){ cyl(g, 0, 0.78, 0, 0.19, 0.19, 0.06, C, 12); cyl(g, 0, 0.72, 0, 0.025, 0.025, 0.68, K, 6); cyl(g, 0, 0.04, 0, 0.2, 0.2, 0.04, K, 12); cyl(g, 0, 0.3, 0, 0.15, 0.15, 0.02, K, 12); }
  else if(kind === 'fridge'){ box(g, 0, 0.92, 0, 0.7, 1.8, 0.68, C); box(g, 0, 1.24, 0.342, 0.68, 0.012, 0.005, dk(0.7));
    [[1.5, 0.4], [0.8, 0.6]].forEach(([y, h]) => box(g, 0.28, y, 0.36, 0.03, h, 0.03, dk(0.7))); [[-0.3, -0.28], [0.3, -0.28], [-0.3, 0.28], [0.3, 0.28]].forEach(([x, z]) => box(g, x, 0.01, z, 0.05, 0.02, 0.05, K)); }
  else if(kind === 'rug'){ box(g, 0, 0.006, 0, 2.0, 0.012, 1.4, C); box(g, 0, 0.0125, 0, 1.6, 0.002, 1.0, dk(0.72)); box(g, 0, 0.0135, 0, 1.2, 0.002, 0.6, C); }
  else if(kind === 'mirror'){ box(g, 0, 0.95, 0, 0.6, 1.6, 0.05, C); box(g, 0, 0.95, 0.027, 0.5, 1.5, 0.005, '#C9D6DE'); box(g, 0, 0.075, 0, 0.6, 0.15, 0.4, C); box(g, 0, 0.62, -0.08, 0.05, 1.0, 0.04, dk(0.8)); }
  else if(kind === 'flowers'){ cyl(g, 0, 0.36, 0, 0.09, 0.07, 0.36, C, 10); [[-0.05, 0.03], [0.05, -0.02], [0, 0.05], [0.02, -0.06]].forEach(([x, z], i) => {
      box(g, x, 0.48, z, 0.012, 0.25, 0.012, '#4E7C58'); ball(g, x * 1.6, 0.62 + (i % 2) * 0.05, z * 1.6, 0.06, 0.05, 0.06, ['#B4232C', '#F4F2EE', '#C86B9A', '#B4232C'][i], 7); });
    ball(g, 0, 0.55, 0, 0.12, 0.07, 0.12, '#4E7C58', 7); }
  else if(kind === 'piano'){ box(g, 0, 0.72, -0.05, 1.5, 1.28, 0.5, C); box(g, 0, 0.76, 0.32, 1.42, 0.08, 0.26, C); box(g, 0, 0.805, 0.34, 1.34, 0.014, 0.18, '#F4F2EE');
    for(let k = 0; k < 18; k++) if(k % 7 !== 2 && k % 7 !== 6) box(g, -0.64 + k * 0.074, 0.82, 0.31, 0.03, 0.016, 0.1, '#1D1F24');
    [-0.68, 0.68].forEach(x => box(g, x, 0.37, 0.36, 0.06, 0.74, 0.06, C)); box(g, 0, 0.04, -0.05, 1.5, 0.08, 0.5, dk(0.8)); box(g, 0, 1.2, 0.205, 1.2, 0.3, 0.012, dk(1.3)); }
  else if(kind === 'guitar'){ ball(g, 0, 0.36, 0.02, 0.19, 0.22, 0.06, C, 10); ball(g, 0, 0.62, 0.02, 0.15, 0.14, 0.06, C, 10); cyl(g, 0, 0.47, 0.075, 0.05, 0.05, 0.01, K, 10, 'z');
    box(g, 0, 0.98, 0.02, 0.05, 0.6, 0.03, '#4A3626'); box(g, 0, 1.34, 0.02, 0.07, 0.13, 0.03, K);
    box(g, 0, 0.1, 0.02, 0.3, 0.02, 0.18, K); [-0.12, 0.12].forEach(x => box(g, x, 0.2, 0.06, 0.03, 0.2, 0.03, K)); box(g, 0, 0.55, -0.06, 0.03, 1.1, 0.03, K); }
  else if(kind === 'desk'){ box(g, 0, 0.74, 0, 1.4, 0.04, 0.7, C); box(g, -0.48, 0.36, 0, 0.42, 0.72, 0.66, dk(0.85)); box(g, 0.66, 0.36, 0, 0.04, 0.72, 0.66, dk(0.85));
    [0.58, 0.36, 0.14].forEach(y => box(g, -0.48, y, 0.332, 0.1, 0.02, 0.012, M)); box(g, 0.2, 0.45, -0.32, 0.88, 0.5, 0.02, dk(0.85)); }
  else if(kind === 'laptop'){ box(g, 0, 0.01, 0, 0.34, 0.02, 0.24, C); box(g, 0, 0.0215, 0.02, 0.3, 0.003, 0.12, K); box(g, 0, 0.13, -0.116, 0.34, 0.22, 0.012, C); box(g, 0, 0.13, -0.109, 0.31, 0.19, 0.003, '#3D5A80'); }
  else if(kind === 'screen'){ box(g, 0, 0.01, 0, 0.24, 0.02, 0.16, C); box(g, 0, 0.17, -0.03, 0.05, 0.3, 0.03, C); box(g, 0, 0.36, 0, 0.56, 0.34, 0.03, C); box(g, 0, 0.36, 0.016, 0.52, 0.3, 0.003, '#3D5A80'); }
  else if(kind === 'safe'){ box(g, 0, 0.47, 0, 0.6, 0.9, 0.6, C); box(g, 0, 0.47, 0.303, 0.5, 0.78, 0.008, dk(1.25)); cyl(g, 0.1, 0.56, 0.305, 0.06, 0.06, 0.03, '#C9CDD3', 12, 'z'); box(g, -0.12, 0.47, 0.32, 0.03, 0.2, 0.03, '#C9CDD3');
    [[-0.26, -0.26], [0.26, -0.26], [-0.26, 0.26], [0.26, 0.26]].forEach(([x, z]) => box(g, x, 0.01, z, 0.06, 0.02, 0.06, K)); }
  else if(kind === 'movie' || kind === 'spot'){ [0, 2.094, 4.189].forEach(a => { const s = Math.sin(a), c = Math.cos(a);
      box(g, s * 0.26, 0.6, c * 0.26, 0.03, 1.2, 0.03, K); box(g, s * 0.13, 1.21, c * 0.13, 0.03, 0.03, 0.26, K, a); });
    if(kind === 'movie'){ box(g, 0, 1.25, 0, 0.12, 0.06, 0.12, K); box(g, 0, 1.4, 0.04, 0.17, 0.24, 0.4, C); cyl(g, 0, 1.42, 0.24, 0.07, 0.07, 0.17, C, 10, 'z'); cyl(g, 0, 1.42, 0.405, 0.06, 0.06, 0.005, '#3D5A80', 10, 'z');
      cyl(g, -0.1, 1.62, 0.02, 0.1, 0.1, 0.2, C, 10, 'x'); box(g, 0.1, 1.46, -0.14, 0.05, 0.05, 0.14, C); }
    else { cyl(g, 0, 1.55, 0, 0.02, 0.02, 0.35, M, 6); box(g, 0, 1.65, 0.04, 0.3, 0.26, 0.24, C); box(g, 0, 1.65, 0.163, 0.25, 0.21, 0.006, '#F4EFD8');
      [-1, 1].forEach(e => box(g, e * 0.16, 1.65, 0.22, 0.012, 0.24, 0.12, C)); } }
  else if(kind === 'mic'){ cyl(g, 0, 0.03, 0, 0.15, 0.15, 0.03, C, 12); cyl(g, 0, 1.45, 0, 0.012, 0.012, 1.42, C, 6); box(g, 0, 1.47, 0.03, 0.02, 0.02, 0.08, C); ball(g, 0, 1.49, 0.09, 0.03, 0.05, 0.03, '#5E636C', 8); }
  else if(kind === 'speaker'){ box(g, 0, 0.47, 0, 0.45, 0.9, 0.42, C); cyl(g, 0, 0.32, 0.21, 0.15, 0.15, 0.01, '#3A3D44', 12, 'z'); cyl(g, 0, 0.32, 0.215, 0.05, 0.05, 0.01, '#5E636C', 10, 'z');
    cyl(g, 0, 0.7, 0.21, 0.06, 0.06, 0.01, '#3A3D44', 10, 'z'); [[-0.19, -0.17], [0.19, -0.17], [-0.19, 0.17], [0.19, 0.17]].forEach(([x, z]) => box(g, x, 0.01, z, 0.05, 0.02, 0.05, K)); }
  else if(kind === 'ladder'){ [-1, 1].forEach(sd => { [-0.22, 0.22].forEach(x => box(g, x, 0.8, sd * 0.24, 0.04, 1.6, 0.05, C)); });
    for(let y = 0.3; y < 1.5; y += 0.32) box(g, 0, y, 0.24, 0.44, 0.03, 0.08, C); box(g, 0, 1.62, 0, 0.5, 0.04, 0.56, dk(0.85)); }
  else if(kind === 'coffin'){ box(g, 0, 0.29, 0, 0.6, 0.38, 1.9, C); box(g, 0, 0.51, 0, 0.64, 0.06, 2.04, dk(0.85)); [-0.5, 0.5].forEach(z => [-1, 1].forEach(e => box(g, e * 0.315, 0.3, z, 0.03, 0.03, 0.2, '#C9B48F')));
    [[-0.24, -0.9], [0.24, -0.9], [-0.24, 0.9], [0.24, 0.9]].forEach(([x, z]) => box(g, x, 0.05, z, 0.06, 0.1, 0.06, dk(0.7))); }
  else if(kind === 'streetlamp'){ cyl(g, 0, 0.35, 0, 0.12, 0.15, 0.35, C, 10); cyl(g, 0, 3.6, 0, 0.05, 0.06, 3.27, C, 8); box(g, 0, 3.6, 0.3, 0.06, 0.06, 0.6, C);
    box(g, 0, 3.55, 0.6, 0.22, 0.1, 0.34, C); box(g, 0, 3.495, 0.6, 0.17, 0.012, 0.27, '#F2E6C9'); }
  else if(kind === 'traffic'){ cyl(g, 0, 3.0, 0, 0.05, 0.05, 3.0, C, 8); box(g, 0, 2.55, 0.12, 0.28, 0.82, 0.2, C);
    [[2.82, '#C8392F'], [2.55, '#D98A2B'], [2.28, '#3FA36B']].forEach(([y, c]) => { cyl(g, 0, y, 0.22, 0.08, 0.08, 0.012, c, 10, 'z'); box(g, 0, y + 0.1, 0.27, 0.2, 0.012, 0.08, C); }); }
  else if(kind === 'stop'){ box(g, 0, 1.1, 0, 0.06, 2.2, 0.06, '#9AA0A8'); cyl(g, 0, 2.0, 0.03, 0.33, 0.33, 0.02, C, 8, 'z'); cyl(g, 0, 2.0, 0.05, 0.3, 0.3, 0.003, '#F4F6F6', 8, 'z'); cyl(g, 0, 2.0, 0.053, 0.27, 0.27, 0.003, C, 8, 'z');
    pixText(g, 'STOP', 0, 2.0, 0.058, 1, 0.026, '#F4F6F6'); }
  else if(kind === 'cone'){ cyl(g, 0, 0.72, 0, 0.03, 0.16, 0.68, C, 10); cyl(g, 0, 0.5, 0, 0.088, 0.115, 0.12, '#F4F2EE', 10); box(g, 0, 0.02, 0, 0.38, 0.04, 0.38, C); }
  else if(kind === 'barrier'){ [-0.7, 0.7].forEach(x => { box(g, x, 0.5, 0.12, 0.05, 1.0, 0.05, K); box(g, x, 0.5, -0.12, 0.05, 1.0, 0.05, K); box(g, x, 0.03, 0, 0.08, 0.06, 0.4, K); });
    box(g, 0, 0.92, 0.15, 1.6, 0.2, 0.03, C); for(let k = 0; k < 4; k++) box(g, -0.6 + k * 0.4, 0.92, 0.167, 0.14, 0.2, 0.005, '#F4F2EE'); box(g, 0, 0.5, 0.15, 1.5, 0.08, 0.03, C); }
  else if(kind === 'hydrant'){ cyl(g, 0, 0.04, 0, 0.17, 0.17, 0.04, C, 10); cyl(g, 0, 0.62, 0, 0.11, 0.12, 0.58, C, 10); ball(g, 0, 0.64, 0, 0.11, 0.09, 0.11, C, 9); cyl(g, 0, 0.76, 0, 0.03, 0.04, 0.05, dk(0.7), 6);
    cyl(g, -0.19, 0.45, 0, 0.045, 0.045, 0.38, dk(0.8), 8, 'x'); cyl(g, 0, 0.45, 0.08, 0.055, 0.055, 0.1, dk(0.8), 8, 'z'); }
  else if(kind === 'mailbox'){ box(g, 0, 0.55, 0, 0.08, 1.1, 0.08, K); box(g, 0, 1.25, 0, 0.3, 0.32, 0.46, C); box(g, 0, 1.33, 0.232, 0.18, 0.025, 0.005, K); box(g, 0, 1.17, 0.232, 0.24, 0.12, 0.004, dk(0.8)); }
  else if(kind === 'bike'){ [-0.5, 0.5].forEach(z => { cyl(g, -0.02, 0.34, z, 0.34, 0.34, 0.04, K, 14, 'x'); cyl(g, -0.025, 0.34, z, 0.05, 0.05, 0.05, M, 8, 'x'); });
    const seg = (y0, z0, y1, z1, col, n) => { for(let i = 0; i < n; i++){ const t0 = i / n, t1 = (i + 1) / n, ya = y0 + (y1 - y0) * t0, yb = y0 + (y1 - y0) * t1, za = z0 + (z1 - z0) * t0, zb = z0 + (z1 - z0) * t1;
      box(g, 0, (ya + yb) / 2, (za + zb) / 2, 0.035, Math.abs(yb - ya) + 0.035, Math.abs(zb - za) + 0.035, col); } };
    seg(0.34, 0.5, 0.86, 0.36, C, 3); seg(0.8, 0.36, 0.38, -0.05, C, 4); seg(0.38, -0.05, 0.84, -0.18, C, 3); seg(0.34, -0.5, 0.38, -0.05, C, 2); seg(0.34, -0.5, 0.8, -0.16, C, 3);
    box(g, 0, 0.8, 0.1, 0.035, 0.035, 0.52, C); box(g, 0, 0.95, 0.38, 0.5, 0.03, 0.03, K); box(g, 0, 0.9, 0.37, 0.03, 0.1, 0.03, K); box(g, 0, 0.88, -0.2, 0.12, 0.04, 0.22, K); }
  else if(kind === 'cart'){ box(g, 0, 0.55, 0.02, 0.56, 0.02, 0.86, C); [-0.28, 0.28].forEach(x => box(g, x, 0.77, 0.02, 0.012, 0.44, 0.86, C)); [-0.43, 0.45].forEach(z => box(g, 0, 0.77, z, 0.56, 0.44, 0.012, C));
    box(g, 0, 1.0, -0.5, 0.56, 0.03, 0.03, '#C8392F'); [[-0.24, -0.38], [0.24, -0.38], [-0.2, 0.38], [0.2, 0.38]].forEach(([x, z]) => { box(g, x, 0.31, z, 0.025, 0.48, 0.025, M); cyl(g, x - 0.012, 0.05, z, 0.05, 0.05, 0.025, K, 8, 'x'); });
    box(g, 0, 0.12, 0, 0.5, 0.02, 0.7, M); }
  else if(kind === 'tires'){ [0, 1, 2].forEach(i => { cyl(g, 0, 0.18 + i * 0.2, 0, 0.31, 0.33, 0.18, C, 14); cyl(g, 0, 0.183 + i * 0.2, 0, 0.17, 0.17, 0.004, '#3A3D44', 12); box(g, 0, 0.19 + i * 0.2, 0, 0.42, 0.02, 0.42, dk(0.6)); }); }
  else if(kind === 'pallet'){ [-0.32, 0, 0.32].forEach(z => [-0.5, 0, 0.5].forEach(x => box(g, x, 0.065, z, 0.12, 0.09, 0.12, dk(0.85))));
    [-0.32, 0, 0.32].forEach(z => box(g, 0, 0.01, z, 1.2, 0.02, 0.12, C)); for(let k = 0; k < 7; k++) box(g, 0, 0.122, -0.36 + k * 0.12, 1.2, 0.024, 0.09, C); }
  else if(kind === 'fence'){ [-1, 0, 1].forEach(x => box(g, x, 0.55, 0, 0.08, 1.1, 0.08, C)); [0.35, 0.8].forEach(y => box(g, 0, y, 0.05, 2.08, 0.1, 0.03, C)); }
  else if(kind === 'tree'){ cyl(g, 0, 1.7, 0, 0.12, 0.17, 1.7, '#5B4532', 8);
    const F = C === '#B9763A' ? ['#C46A2C', '#B9763A', '#D99A3A'] : [C, dk(1.12), dk(0.88)];
    ball(g, 0, 2.5, 0, 0.95, 0.85, 0.95, F[0], 9); ball(g, 0.45, 2.95, 0.15, 0.6, 0.55, 0.6, F[1], 8); ball(g, -0.4, 2.85, -0.25, 0.6, 0.55, 0.6, F[2], 8); ball(g, 0.1, 3.25, -0.1, 0.5, 0.42, 0.5, F[1], 8); }
  else if(kind === 'rock'){ ball(g, 0, 0.32, 0, 0.55, 0.32, 0.45, C, 7); ball(g, 0.3, 0.2, 0.2, 0.3, 0.2, 0.28, dk(0.9), 6); }
  else if(kind === 'tent'){ prism(g, [[-0.92, 0], [0.92, 0], [0, 1.25]], -1.0, 1.0, C); prism(g, [[-0.45, 0], [0.45, 0], [0, 0.6]], 1.0, 1.006, dk(0.55)); box(g, 1.05, 0.6, 0, 0.03, 1.2, 0.03, K); box(g, -1.03, 0.62, 0, 0.03, 1.24, 0.03, K); }
  else if(kind === 'campfire'){ for(let i = 0; i < 9; i++){ const a = i / 9 * Math.PI * 2; ball(g, Math.sin(a) * 0.36, 0.07, Math.cos(a) * 0.36, 0.09, 0.07, 0.08, '#8E8B85', 6); }
    [0, 1.2, 2.4].forEach(a => box(g, 0, 0.06, 0, 0.09, 0.09, 0.6, C, a)); const e0 = EDGE_ON; EDGE_ON = 0; ball(g, 0, 0.26, 0, 0.13, 0.22, 0.13, '#E2642B', 8); ball(g, 0.03, 0.22, 0.02, 0.08, 0.14, 0.08, '#F2D06B', 7); EDGE_ON = e0; }
  else if(kind === 'parasol'){ cyl(g, 0, 0.09, 0, 0.26, 0.26, 0.09, K, 12); cyl(g, 0, 2.35, 0, 0.022, 0.022, 2.26, '#E9E6E0', 6); cyl(g, 0, 2.55, 0, 0.04, 1.2, 0.36, C, 12); cyl(g, 0, 2.19, 0, 1.2, 1.2, 0.03, dk(0.8), 12); }
  MAT = m0;
  return g;
}
/* une caméra à partir de l'endroit où elle est (e) et de ce qu'elle regarde (t) */
/* la caméra dans une pièce, pour voir le point T : dans le coin opposé, à hauteur d'yeux */
function roomCam(def, r, T){
  const [x0, z0, x1, z1] = r[3], y0 = def.levels ? def.levels[r[2]] : 0, m = 0.45;
  const t = !T && r[4] ? [r[4][0], y0 + 1.0, r[4][1]] : [clamp(T ? T[0] : (x0 + x1) / 2, x0 + 0.3, x1 - 0.3), y0 + 1.0, clamp(T ? T[2] : (z0 + z1) / 2, z0 + 0.3, z1 - 0.3)];
  const cand = r[5] === 'roof' ? [[x0 + 0.6, 0], [x1 - 0.6, 0]].map(([x, z]) => [x, y0 + 1.55, z])   // sous le toit : aux deux bouts du faîte
    : [[x0 + m, z0 + m], [x1 - m, z0 + m], [x0 + m, z1 - m], [x1 - m, z1 - m]].map(([x, z]) => [x, y0 + 1.65, z]);
  const e = cand.reduce((b, c) => Math.hypot(c[0] - t[0], c[2] - t[2]) > Math.hypot(b[0] - t[0], b[2] - t[2]) ? c : b);
  return { eye:e, target:t };
}
function camLook(e, t, lens){
  const vx = e[0] - t[0], vy = e[1] - t[1], vz = e[2] - t[2], dist = Math.hypot(vx, vy, vz) || 1;
  return { tx:t[0], ty:t[1], tz:t[2], yaw:Math.atan2(vx, vz) / D2R, pitch:-Math.asin(vy / dist) / D2R, dist, lens, roll:0 };
}

/* ---------- Les accessoires, tenus dans la main droite ----------
   Dans le repère de la main, les doigts vont vers le bas (-y) : le canon prolonge la main,
   la crosse descend dans la paume. */
const PROPS = [['gun', 'Pistolet', 'Handgun'], ['rifle', 'Fusil', 'Rifle'], ['phone', 'Téléphone', 'Phone'], ['glass', 'Verre d’eau', 'Glass of water']];
/* ce qu'un personnage porte sur lui, quelle que soit sa pose : un pistolet à la ceinture, un fusil dans le dos */
const GEAR = [['holster', 'Pistolet à la ceinture', 'Holstered handgun'], ['sling', 'Fusil dans le dos', 'Rifle on the back']];
/* tourner une partie d'une forme (à partir du sommet « from ») pour que son axe x devienne la direction u, puis la poser en c */
function alignX(g, from, u, c){
  const l = Math.hypot(...u), a = u.map(v => v / l), k = [0, -a[2], a[1]], s = Math.hypot(...k), co = a[0];   // de x vers a : axe k, angle (cos co, sin s)
  const K = s < 1e-9 ? [0, 0, 1] : k.map(v => v / s), t = 1 - co;
  const R = [[co + K[0] * K[0] * t, K[0] * K[1] * t - K[2] * s, K[0] * K[2] * t + K[1] * s],
             [K[1] * K[0] * t + K[2] * s, co + K[1] * K[1] * t, K[1] * K[2] * t - K[0] * s],
             [K[2] * K[0] * t - K[1] * s, K[2] * K[1] * t + K[0] * s, co + K[2] * K[2] * t]];
  const rot = v => [R[0][0] * v[0] + R[0][1] * v[1] + R[0][2] * v[2], R[1][0] * v[0] + R[1][1] * v[1] + R[1][2] * v[2], R[2][0] * v[0] + R[2][1] * v[1] + R[2][2] * v[2]];
  for(let i = from; i < g.p.length; i += 3){
    const p = rot([g.p[i], g.p[i + 1], g.p[i + 2]]), n = rot([g.n[i], g.n[i + 1], g.n[i + 2]]);
    g.p[i] = p[0] + c[0]; g.p[i + 1] = p[1] + c[1]; g.p[i + 2] = p[2] + c[2]; g.n[i] = n[0]; g.n[i + 1] = n[1]; g.n[i + 2] = n[2];
  }
}
function propGeo(id){
  const g = geo(), K = '#23252B', Kl = '#3A3D44';
  if(id === 'gun'){
    MAT = 3;   // le métal de l'arme
    // un pistolet semi-automatique : culasse biseautée et rainurée, carcasse, crosse inclinée, pontet, détente, organes de visée
    const SL = '#33363D', FR = '#1C1D21', GR = '#2A2420';
    prism(g, [[0.02, -0.006], [0.052, -0.006], [0.056, -0.012], [0.056, -0.2], [0.02, -0.2]].map(([z, y]) => [z, y]), -0.0135, 0.0135, SL);   // la culasse
    for(let k = 0; k < 5; k++) [0.0137, -0.0137].forEach(x => box(g, x, -0.02 - k * 0.008, 0.038, 0.002, 0.003, 0.028, FR));               // les rainures
    box(g, 0, -0.117, 0.012, 0.024, 0.17, 0.018, FR);                                                    // la carcasse, sous la culasse
    prism(g, [[0.006, -0.062], [0.006, -0.018], [-0.074, 0.006], [-0.08, -0.034]], -0.0125, 0.0125, GR);     // la crosse, inclinée dans la paume
    box(g, 0, -0.064, -0.016, 0.008, 0.003, 0.04, FR); box(g, 0, -0.084, -0.034, 0.008, 0.04, 0.003, FR);  // le pontet
    box(g, 0, -0.106, -0.016, 0.008, 0.003, 0.04, FR); box(g, 0, -0.08, -0.012, 0.004, 0.012, 0.012, '#111214');   // la détente
    box(g, 0, -0.194, 0.06, 0.004, 0.006, 0.008, FR); box(g, 0, -0.02, 0.06, 0.016, 0.006, 0.008, FR);   // guidon et hausse
    box(g, 0, -0.2015, 0.038, 0.012, 0.004, 0.012, '#0B0C0E');                                          // la bouche du canon
  } else if(id === 'rifle'){
    // un fusil d'assaut tenu par la poignée : le canon vers l'avant (-y), la crosse vers l'épaule (+y), le dessus vers +z
    MAT = 3; const B = '#2B2D33', D = '#1C1D21', W = '#3A3D44';
    prism(g, [[0.006, -0.062], [0.006, -0.018], [-0.07, 0.004], [-0.076, -0.034]], -0.013, 0.013, D);                      // la poignée pistolet
    box(g, 0, -0.06, 0.05, 0.034, 0.3, 0.07, B);                                                                         // la carcasse
    box(g, 0, -0.33, 0.055, 0.044, 0.26, 0.06, W);                                                                       // le garde-main
    cyl(g, 0, -0.46, 0.06, 0.011, 0.011, 0.24, D, 8, 'y');                                                                // le canon
    box(g, 0, -0.69, 0.06, 0.026, 0.04, 0.026, D);                                                                        // le cache-flamme
    prism(g, [[0.03, -0.12], [0.03, -0.06], [-0.11, -0.03], [-0.13, -0.08]], -0.013, 0.013, D);                           // le chargeur
    box(g, 0, 0.17, 0.035, 0.036, 0.16, 0.06, B); box(g, 0, 0.29, 0.02, 0.04, 0.1, 0.11, W);                              // la crosse
    box(g, 0, -0.06, 0.1, 0.02, 0.12, 0.022, D); box(g, 0, -0.42, 0.095, 0.006, 0.02, 0.03, D);                           // la lunette de visée, le guidon
    MAT = 0;
  } else if(id === 'holster'){
    MAT = 0; box(g, 0, -0.12, 0.034, 0.036, 0.15, 0.05, '#2A2420'); box(g, 0, -0.05, 0.034, 0.04, 0.02, 0.054, '#1C1D21');   // l'étui de cuir sur la hanche
  } else if(id === 'phone'){
    box(g, 0, -0.085, 0.03, 0.07, 0.14, 0.012, '#1E2026');
    box(g, 0, -0.085, 0.0365, 0.062, 0.128, 0.002, '#2E3846');
  } else if(id === 'glass'){
    // un verre d'eau tenu dans la main, les doigts autour : le verre (clair), l'eau (bleutée), le fond épais.
    // Il est fait couché le long de x, puis tourné pour que son axe suive U (dans le repère de la main) et centré en C :
    // dans la pose « Boire », le bord touche les lèvres et le verre penche vers la bouche.
    const st = g.p.length, U = [-0.7885, -0.2797, 0.5478], C = [-0.0157, -0.1176, 0.055];
    cyl(g, -0.06, 0, 0, 0.036, 0.036, 0.12, '#DDE7EE', 12, 'x');
    cyl(g, -0.058, 0, 0, 0.031, 0.031, 0.08, '#8EC3E0', 12, 'x');
    cyl(g, -0.064, 0, 0, 0.037, 0.037, 0.012, '#C7D3DC', 12, 'x');
    alignX(g, st, U, C);
  }
  MAT = 0;
  return g;
}

/* ---------- Les véhicules qu'on pose où l'on veut (la moto) ----------
   Repère du véhicule : il regarde vers +z ; la selle du pilote est en z = -0.2, celle du passager en -0.55. */
const VEHICLES = [['moto', 'Moto', 'Motorbike'], ['car', 'Voiture', 'Car'], ['police', 'Voiture de police', 'Police car'], ['heli', 'Hélicoptère', 'Helicopter'], ['plane', 'Avion', 'Plane']];
const MOTO_COLS = ['#B4232C', '#24262B', '#3D5A80', '#E8B923'];
function vehicleGeo(kind, col, glass){
  if(VEH_DEF[kind] && VEH_DEF[kind].obj) return objGeo(kind, col);
  const g = geo(), K = '#1E2025', M = '#9AA0A8', C = col || MOTO_COLS[0];
  MAT = 4; try {
  if(kind === 'heli') return heliGeo(col, glass);
  if(kind === 'plane') return planeGeo(col, glass);
  if(kind === 'car' || kind === 'police') return carGeo(col, glass, kind === 'police');
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
  } finally { MAT = 0; }
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

/* ---------- L'hélicoptère et l'avion de tourisme ----------
   Ils regardent vers +z. La cabine est vitrée (les vitres vont dans « glass ») : on voit le pilote. */
function heliGeo(col, glass){
  const g = geo(), C = col || '#2F6E4F', K = '#24262B', M = '#9AA0A8', G = glass;
  prism(g, [[1.55, 0.85], [1.75, 1.25], [-1.05, 1.25], [-1.2, 0.85]], -0.82, 0.82, C);              // le bas de la cabine
  box(g, 0, 0.87, 0.2, 1.6, 0.06, 2.6, K);                                                            // le plancher
  prism(g, [[0.95, 2.3], [-1.15, 2.3], [-1.2, 2.42], [0.9, 2.42]], -0.8, 0.8, C);                     // le toit
  [[-0.8, -0.74], [0.74, 0.8]].forEach(([a, b]) => { prism(g, [[-1.05, 1.25], [-1.2, 1.25], [-1.2, 2.3], [-1.05, 2.3]], a, b, C); prism(g, [[0.15, 1.25], [0.05, 1.25], [0.05, 2.3], [0.15, 2.3]], a, b, K); });
  if(G){ prism(G, [[1.75, 1.25], [1.6, 1.8], [0.95, 2.3], [0.9, 2.3], [1.5, 1.25]], -0.78, 0.78, '#A9C4D2');
    [[-0.79, -0.77], [0.77, 0.79]].forEach(([a, b]) => { prism(G, [[1.55, 1.25], [0.95, 2.3], [0.15, 2.3], [0.15, 1.25]], a, b, '#A9C4D2'); prism(G, [[0.05, 1.25], [0.05, 2.3], [-1.05, 2.3], [-1.05, 1.25]], a, b, '#A9C4D2'); }); }
  cyl(g, 0, 1.85, -5.4, 0.1, 0.34, 4.3, C, 10, 'z');                                                // la poutre de queue
  prism(g, [[-4.9, 1.85], [-5.35, 2.75], [-5.6, 2.75], [-5.5, 1.75]], -0.04, 0.04, C);                   // la dérive
  box(g, 0, 1.85, -5.2, 1.0, 0.04, 0.4, C);                                                          // le stabilisateur, en travers de la poutre
  cyl(g, 0.12, 2.35, -5.4, 0.04, 0.04, 0.08, K, 6, 'x'); box(g, 0.18, 2.35, -5.4, 0.02, 1.1, 0.1, K);   // le rotor de queue
  cyl(g, 0, 2.75, -0.1, 0.07, 0.07, 0.35, M, 8); box(g, 0, 2.78, -0.1, 0.3, 0.12, 0.3, K);            // le mât
  box(g, 0, 2.82, -0.1, 9.6, 0.03, 0.26, K, 0.35); box(g, 0, 2.82, -0.1, 9.6, 0.03, 0.26, K, 0.35 + Math.PI / 2);   // les pales
  [-0.85, 0.85].forEach(x => { box(g, x, 0.03, 0.2, 0.08, 0.06, 3.2, K); [-0.6, 1.0].forEach(z => box(g, x * 0.92, 0.45, z, 0.05, 0.8, 0.05, K)); });   // les patins
  [-0.33, 0.33].forEach(x => [0.55, -0.45].forEach(z => { box(g, x, 1.19, z, 0.5, 0.12, 0.5, '#3A3D44'); box(g, x, 0.98, z, 0.4, 0.3, 0.4, '#2A2C31'); box(g, x, 1.6, z - 0.28, 0.5, 0.75, 0.08, '#3A3D44'); }));   // les sièges
  prism(g, [[1.45, 1.25], [1.45, 1.45], [1.0, 1.55], [1.0, 1.25]], -0.7, 0.7, K);                    // le tableau de bord
  [-0.33, 0.33].forEach(x => box(g, x, 1.05, 0.95, 0.04, 0.45, 0.04, K));                            // les manches
  return g;
}
function planeGeo(col, glass){
  const g = geo(), C = col || '#E9E6E0', A = '#B4232C', K = '#24262B', M = '#9AA0A8', G = glass;
  prism(g, [[2.25, 0.8], [2.45, 1.35], [1.35, 1.35], [-0.95, 1.35], [-4.6, 1.55], [-4.75, 1.3], [-0.95, 0.8]], -0.62, 0.62, C);   // le bas du fuselage
  prism(g, [[-0.95, 1.35], [-4.6, 1.55], [-4.6, 1.9], [-0.95, 2.3]], -0.6, 0.6, C);                   // l'arrière, qui s'affine
  prism(g, [[1.3, 2.3], [-0.95, 2.3], [-0.95, 2.38], [1.3, 2.38]], -0.6, 0.6, C);                    // le toit de la cabine
  box(g, 0, 0.84, 0.2, 1.1, 0.05, 2.6, K);
  [[-0.62, -0.57], [0.57, 0.62]].forEach(([a, b]) => { prism(g, [[0.25, 1.35], [0.15, 1.35], [0.15, 2.3], [0.25, 2.3]], a, b, C); prism(g, [[-0.85, 1.35], [-0.95, 1.35], [-0.95, 2.3], [-0.85, 2.3]], a, b, C); });
  if(G){ prism(G, [[2.4, 1.35], [1.35, 2.3], [1.3, 2.3], [2.3, 1.35]], -0.58, 0.58, '#A9C4D2');
    [[-0.61, -0.59], [0.59, 0.61]].forEach(([a, b]) => { prism(G, [[2.35, 1.35], [1.35, 2.3], [0.25, 2.3], [0.25, 1.35]], a, b, '#A9C4D2'); prism(G, [[0.15, 1.35], [0.15, 2.3], [-0.85, 2.3], [-0.85, 1.35]], a, b, '#A9C4D2'); }); }
  box(g, 0, 2.42, 0.55, 11.2, 0.08, 1.5, C);                                                         // l'aile haute
  [-5.4, 5.4].forEach(x => box(g, x, 2.42, 0.55, 0.4, 0.085, 1.52, A));
  [-1, 1].forEach(sd => { const P = [[sd * 0.6, 0.98], [sd * 2.6, 2.36], [sd * 2.6, 2.42], [sd * 0.6, 1.06]]; prismXY(g, sd > 0 ? P : P.reverse(), 0.48, 0.54, M); });   // les haubans
  box(g, 0, 1.75, -4.35, 3.4, 0.06, 0.8, C); prism(g, [[-3.9, 1.85], [-4.75, 2.9], [-4.95, 2.9], [-4.75, 1.6]], -0.04, 0.04, A);   // la queue
  box(g, 0, 1.12, -1.6, 1.26, 0.1, 5, A);                                                            // la bande décorative
  cyl(g, 0, 1.1, 2.45, 0.16, 0.06, 0.25, K, 10, 'z'); [-0.6].forEach(t => { const c = Math.cos(t), sn = Math.sin(t), P = [[-0.06, -0.95], [0.06, -0.95], [0.06, 0.95], [-0.06, 0.95]].map(([u, w]) => [u * c - w * sn, 1.1 + u * sn + w * c]); prismXY(g, P, 2.7, 2.74, K); });   // l'hélice, en biais
  [[0, 0.25, 1.9], [-1.1, 0.3, 0.1], [1.1, 0.3, 0.1]].forEach(([x, y, z]) => { cyl(g, x - 0.06, y, z, 0.24, 0.24, 0.12, '#17181B', 12, 'x'); box(g, x, (y + 0.85) / 2, z, 0.06, 0.85 - y, 0.06, M); });   // les roues
  [-0.27, 0.27].forEach(x => [0.5, -0.45].forEach(z => { box(g, x, 1.16, z, 0.46, 0.12, 0.48, '#3A3D44'); box(g, x, 0.96, z, 0.36, 0.28, 0.4, '#2A2C31'); box(g, x, 1.55, z - 0.27, 0.46, 0.75, 0.08, '#3A3D44'); }));
  prism(g, [[1.6, 1.35], [1.6, 1.55], [1.05, 1.62], [1.05, 1.35]], -0.55, 0.55, K);                  // le tableau de bord
  [-0.27, 0.27].forEach(x => { box(g, x, 1.38, 0.98, 0.04, 0.04, 0.3, K); box(g, x, 1.4, 0.83, 0.28, 0.1, 0.03, K); });   // les manches
  return g;
}
/* chaque véhicule : ses couleurs, ses places (pose, position dans son repère, hauteur du bassin), ses prises de vue */
const HELI_SHOTS = [
  ['decol', 'Le décollage (plan large)', 'Take-off (wide)', [7, 1.6, 9], [0, 1.8, 0], 28, 'pg'],
  ['cockpit', 'Le pilote, par la verrière', 'The pilot, through the canopy', [-0.55, 1.75, 3.7], [-0.33, 1.8, 0.55], 40, 'pr'],
  ['epaule', 'Par-dessus l’épaule du pilote', 'Over the pilot’s shoulder', [-0.02, 2.08, 0.06], [-0.3, 1.45, 6], 24, 'am'],
  ['hublot', 'Le passager, par la vitre', 'The passenger, through the window', [-2.3, 1.78, -0.62], [-0.33, 1.78, -0.45], 40, 'pr'],
  ['pales', 'Contre-plongée sous les pales', 'Low angle under the blades', [2.2, 0.4, 3.2], [0, 2.4, 0], 20, 'pe', 'con'],
  ['profil', 'De profil, en vol', 'Side on, flying', [9, 1.8, 0.4], [0, 1.6, -1], 35, 'pe'],
  ['dessus', 'Vue aérienne', 'Aerial view', [3, 16, 6], [0, 1.2, -0.5], 35, 'pg', 'dess'],
];
const PLANE_SHOTS = [
  ['piste', 'Sur la piste (plan large)', 'On the runway (wide)', [8, 1.8, 10], [0, 1.5, -0.5], 28, 'pg'],
  ['cockpit', 'Le pilote, par le pare-brise', 'The pilot, through the windshield', [-0.75, 1.85, 4.3], [-0.27, 1.8, 0.5], 40, 'pr'],
  ['epaule', 'Par-dessus l’épaule (le tableau de bord)', 'Over the shoulder (the panel)', [0, 2.05, 0.04], [-0.25, 1.5, 6], 24, 'am'],
  ['aile', 'Sous l’aile, vers la cabine', 'Under the wing, at the cabin', [-3.4, 1.85, 1.3], [-0.27, 1.8, 0.4], 28, 'pm'],
  ['profil', 'De profil, en vol', 'Side on, flying', [12, 2.2, 0], [0, 1.8, -1.2], 35, 'pe'],
  ['sous', 'Contre-plongée sous l’aile', 'Low angle under the wing', [-2.2, 0.3, 3.4], [0, 2.3, 0], 20, 'pe', 'con'],
  ['helice', 'L’hélice en gros plan', 'Close-up on the propeller', [1.1, 1.55, 4.6], [0, 1.15, 2.4], 35, 'gp'],
  ['dessus', 'Vue aérienne', 'Aerial view', [3, 18, 4], [0, 1.2, -1], 35, 'pg', 'dess'],
];
/* ---------- La voiture qu'on pose où l'on veut (civile ou de police) ----------
   Repère : elle regarde vers +z, le conducteur est à gauche (x = 0.37). Même gabarit que le taxi :
   les prises de vue du taxi marchent telles quelles. */
function carGeo(col, glass, police){
  const g = geo(), C = col || '#3D5A80', K = '#24262B', S = '#3B3E45', CH = '#A9AEB6', W = 0.92, D = police ? '#F4F2EE' : C;
  prism(g, [[2.42, 0.3], [2.44, 0.62], [2.32, 0.82], [1.2, 0.92], [1.15, 0.6], [1.15, 0.3]], -W, W, C);            // le capot
  prism(g, [[-1.75, 0.3], [-1.75, 0.95], [-2.4, 0.86], [-2.47, 0.62], [-2.45, 0.3]], -W, W, C);                    // le coffre
  [[W - 0.06, W], [-W, -W + 0.06]].forEach(([a, b]) => prism(g, [[1.15, 0.3], [1.15, 0.92], [-1.75, 0.95], [-1.75, 0.3]], a, b, D));   // les portières
  box(g, 0, 0.27, -0.3, 1.8, 0.06, 2.9, K);                                                                         // le plancher
  [[W - 0.05, W - 0.01], [-W + 0.01, -W + 0.05]].forEach(([a, b]) => {                                              // les montants
    prism(g, [[1.2, 0.92], [1.12, 0.92], [0.5, 1.5], [0.58, 1.5]], a, b, K);
    prism(g, [[-0.27, 0.93], [-0.37, 0.93], [-0.37, 1.5], [-0.27, 1.5]], a, b, K);
    prism(g, [[-1.62, 0.95], [-1.75, 0.95], [-1.25, 1.5], [-1.15, 1.5]], a, b, K);
  });
  prism(g, [[0.6, 1.5], [0.52, 1.56], [-1.2, 1.56], [-1.28, 1.5]], -W + 0.02, W - 0.02, police ? '#F4F2EE' : C);   // le toit
  if(glass){                                                                                                        // les vitres
    prism(glass, [[1.15, 0.92], [1.13, 0.92], [0.54, 1.5], [0.56, 1.5]], -W + 0.05, W - 0.05, '#A9C4D2');
    prism(glass, [[-1.64, 0.95], [-1.24, 1.5], [-1.26, 1.5], [-1.66, 0.95]], -W + 0.05, W - 0.05, '#A9C4D2');
    [[W - 0.04, W - 0.03], [-W + 0.03, -W + 0.04]].forEach(([a, b]) => {
      prism(glass, [[1.12, 0.93], [0.54, 1.5], [-0.27, 1.5], [-0.27, 0.93]], a, b, '#A9C4D2');
      prism(glass, [[-0.37, 0.93], [-0.37, 1.5], [-1.16, 1.5], [-1.62, 0.95]], a, b, '#A9C4D2');
    });
  }
  box(g, 0, 0.36, 2.48, 1.86, 0.12, 0.1, CH); box(g, 0, 0.36, -2.5, 1.86, 0.12, 0.1, CH);                           // pare-chocs, calandre, phares, feux
  box(g, 0, 0.55, 2.445, 0.9, 0.16, 0.02, K);
  [0.66, -0.66].forEach(x => { box(g, x, 0.6, 2.44, 0.26, 0.12, 0.04, '#FBF6DF'); box(g, x, 0.7, -2.45, 0.24, 0.12, 0.04, '#C2453B'); });
  [W + 0.05, -W - 0.05].forEach(x => box(g, x, 1.0, 1.05, 0.1, 0.08, 0.14, K));                                    // les rétroviseurs
  [[1.55], [-1.65]].forEach(([z]) => [1, -1].forEach(sd => {                                                         // les roues
    cyl(g, sd > 0 ? W - 0.2 : -W - 0.04, 0.34, z, 0.34, 0.34, 0.24, '#17181B', 14, 'x');
    cyl(g, sd > 0 ? W + 0.04 : -W - 0.05, 0.34, z, 0.17, 0.17, 0.01, CH, 10, 'x');
  }));
  // l'habitacle : tableau de bord, volant, sièges
  prism(g, [[1.15, 0.6], [1.15, 0.95], [0.95, 1.0], [0.85, 0.86], [0.9, 0.6]], -W + 0.06, W - 0.06, K);
  cyl(g, 0.37, 0.98, 0.78, 0.17, 0.17, 0.025, '#111214', 14, 'z'); cyl(g, 0.37, 0.98, 0.8, 0.03, 0.03, 0.2, '#111214', 6, 'z');
  [0.37, -0.37].forEach(x => { box(g, x, 0.44, 0.3, 0.54, 0.12, 0.5, S); prism(g, [[0.05, 0.5], [-0.07, 0.5], [-0.12, 1.22], [0.0, 1.22]], x - 0.27, x + 0.27, S); box(g, x, 1.3, -0.06, 0.24, 0.14, 0.09, S); });
  box(g, 0, 0.44, -0.82, 1.62, 0.12, 0.56, S); prism(g, [[-1.05, 0.5], [-1.17, 0.5], [-1.24, 1.12], [-1.12, 1.12]], -0.81, 0.81, S);
  if(police){
    // la rampe de gyrophares (rouge et bleu), le pare-buffle, l'écusson doré et la bande sur les portières
    box(g, 0, 1.6, -0.3, 1.2, 0.08, 0.26, K); box(g, -0.3, 1.68, -0.3, 0.5, 0.09, 0.22, '#E0303B'); box(g, 0.3, 1.68, -0.3, 0.5, 0.09, 0.22, '#2F6FE0');
    box(g, 0, 0.55, 2.56, 1.0, 0.42, 0.06, K); [-0.42, 0.42].forEach(x => box(g, x, 0.55, 2.52, 0.06, 0.42, 0.1, K));
    [W + 0.003, -W - 0.003].forEach(x => { const sd = x > 0 ? 1 : -1;
      wall(g, sd > 0 ? [x, 0.75] : [x, 0.45], sd > 0 ? [x, 0.45] : [x, 0.75], 0.2, '#E8B923', 0.6);
      wall(g, sd > 0 ? [x, 1.1] : [x, -1.7], sd > 0 ? [x, -1.7] : [x, 1.1], 0.05, '#2F6FE0', 0.42); });
  }
  return g;
}
const SEDAN_SHOTS = CAR_SHOTS.map(P => P[0] === 'arrive' ? ['arrive', 'La voiture arrive (plan large)', 'The car pulls up (wide)'].concat(P.slice(3)) : P);
const CAR_SEATS = [{ fr:'Conducteur', en:'Driver', pose:'drive', x:0.37, z:0.3, py:0 }, { fr:'Passager avant', en:'Front passenger', pose:'sit', x:-0.37, z:0.3, py:0.05 },
  { fr:'Arrière gauche', en:'Back left', pose:'sit', x:0.4, z:-0.8, py:0.05 }, { fr:'Arrière droite', en:'Back right', pose:'sit', x:-0.4, z:-0.8, py:0.05 }];
const VEH_DEF = {
  moto:{ fr:'Moto', en:'Motorbike', ic:'moto', cols:MOTO_COLS, label:1.9, shots:MOTO_SHOTS,
    seats:[{ fr:'Pilote', en:'Rider', pose:'ride', x:0, z:-0.2 }, { fr:'Passager', en:'Passenger', pose:'rideBack', x:0, z:-0.55 }] },
  car:{ fr:'Voiture', en:'Car', ic:'car', cols:['#3D5A80', '#B4232C', '#E9E6E0', '#24262B', '#2F6E4F'], label:2.0, shots:SEDAN_SHOTS, seats:CAR_SEATS },
  police:{ fr:'Voiture de police', en:'Police car', tag:['Police', 'Police'], ic:'police', cols:['#1E1F23'], label:2.1, shots:SEDAN_SHOTS, seats:CAR_SEATS },
  heli:{ fr:'Hélicoptère', en:'Helicopter', ic:'heli', cols:['#2F6E4F', '#B4232C', '#24262B', '#E9E6E0'], label:3.3, shots:HELI_SHOTS, fly:true,
    seats:[{ fr:'Pilote', en:'Pilot', pose:'pilot', x:-0.33, z:0.55, py:0.8 }, { fr:'Copilote', en:'Co-pilot', pose:'sit', x:0.33, z:0.55, py:0.8 }, { fr:'Passager', en:'Passenger', pose:'sit', x:-0.33, z:-0.45, py:0.8 }, { fr:'Passager 2', en:'Passenger 2', pose:'sit', x:0.33, z:-0.45, py:0.8 }] },
  plane:{ fr:'Avion', en:'Plane', ic:'plane', cols:['#E9E6E0', '#3D5A80', '#E8B923', '#2F6E4F'], label:3.0, shots:PLANE_SHOTS, fly:true,
    seats:[{ fr:'Pilote', en:'Pilot', pose:'pilot', x:-0.27, z:0.5, py:0.77 }, { fr:'Copilote', en:'Co-pilot', pose:'pilot', x:0.27, z:0.5, py:0.77 }, { fr:'Passager', en:'Passenger', pose:'sit', x:-0.27, z:-0.45, py:0.77 }, { fr:'Passager 2', en:'Passenger 2', pose:'sit', x:0.27, z:-0.45, py:0.77 }] },
};
// les objets à poser rejoignent la liste des véhicules (même pose, même poignée, même liste)
Object.entries(OBJ_DEF).forEach(([k, d]) => { VEH_DEF[k] = Object.assign({ ic:'obj', obj:true, shots:[], seats:[] }, d); });
