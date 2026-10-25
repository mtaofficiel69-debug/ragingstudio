/* =====================================================================
   MODÈLES — parodies d'affiches cultes, façon Raging Studio.
   Chaque modèle détourne une affiche célèbre (titre, slogan, réplique,
   composition) sans en reprendre le dessin : tout est redessiné en
   formes simples, et la mascotte du studio (le logo) joue tous les rôles.
   Tout reste modifiable : chaque morceau est un calque.
===================================================================== */

/* ---------- Petits outils de tracé ---------- */
function _m(v){ return Math.round(v*100)/100; }
function _circ(cx, cy, r){ return `M${_m(cx+r)} ${_m(cy)}A${_m(r)} ${_m(r)} 0 1 0 ${_m(cx-r)} ${_m(cy)}A${_m(r)} ${_m(r)} 0 1 0 ${_m(cx+r)} ${_m(cy)}Z`; }
function _cap(x1, y1, x2, y2, r){
  // un trait à bouts ronds, transformé en surface pleine
  const a = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(a)*r, ny = Math.cos(a)*r;
  return `M${_m(x1+nx)} ${_m(y1+ny)}L${_m(x2+nx)} ${_m(y2+ny)}A${_m(r)} ${_m(r)} 0 0 0 ${_m(x2-nx)} ${_m(y2-ny)}L${_m(x1-nx)} ${_m(y1-ny)}A${_m(r)} ${_m(r)} 0 0 0 ${_m(x1+nx)} ${_m(y1+ny)}Z`;
}
function _poly(pts){ return pts.map((p, i) => (i ? 'L' : 'M') + _m(p[0]) + ' ' + _m(p[1])).join('') + 'Z'; }
// fait tourner un ensemble de calques autour d'un point, comme un seul bloc
function _turn(objs, px, py, deg){
  const a = deg*Math.PI/180, c = Math.cos(a), s = Math.sin(a);
  objs.forEach(o => { const dx = o.x - px, dy = o.y - py; o.x = px + dx*c - dy*s; o.y = py + dx*s + dy*c; o.rot = (o.rot || 0) + deg; });
  return objs;
}
function _named(objs, name){ objs.forEach(o => { o.name = name; }); return objs; }

/* ---------- La mascotte (le logo Raging Studio), en 5 calques ----------
   Boîte de 64 × 64 : la feuille, le coin bleu, le coin rouge, les sourcils
   et la bouche, puis les yeux (les reflets sont des trous). */
const MASCOT = {
  sheet:'M10.6 5.6H38.6L54.4 21.4V58.4H10.6Z',
  blue:'M37.1 5.4V22.9H46.7Z',
  red:'M38.4 5.8L46.1 22.9H54.6Z',
  face:_cap(16.4, 25, 31.4, 30, 3) + _cap(50.4, 27, 35.4, 30, 3) + _cap(24.4, 51, 42.4, 51, 2.8),
  eyes:_circ(25.4, 38, 6.6) + _circ(27.6, 35.8, 1.9) + _circ(41.4, 38, 6.6) + _circ(43.6, 35.8, 1.9)
};
// cx, cy : centre ; s : taille de la boîte (la feuille en occupe ~ 0,7 × 0,83)
function mascot(cx, cy, s, o){
  o = Object.assign({paper:'#FCFDFE', ink:'#262535', blue:'#3699D4', red:'#D9363E', badge:null, parts:null, rot:0, flip:false, shadow:null, opacity:1}, o || {});
  const P = (d, fill, rule, part) => mkPath({d, vw:64, vh:64, rule}, cx, cy, s, s, {fill:solid(fill), flipX:o.flip, opacity:o.opacity, name:L('Mascotte · ', 'Mascot · ') + part});
  const out = [];
  if(o.badge) out.push(mkShape('rect', cx, cy, s, s, {radius:s*14/64, fill:solid(o.badge), name:L('Mascotte · fond', 'Mascot · tile')}));
  const want = o.parts || ['sheet', 'blue', 'red', 'face', 'eyes'];
  if(want.includes('sheet')) out.push(P(MASCOT.sheet, o.paper, 'nonzero', L('feuille', 'sheet')));
  if(want.includes('blue')) out.push(P(MASCOT.blue, o.blue, 'nonzero', L('coin bleu', 'blue corner')));
  if(want.includes('red')) out.push(P(MASCOT.red, o.red, 'nonzero', L('coin rouge', 'red corner')));
  if(want.includes('face')) out.push(P(MASCOT.face, o.ink, 'nonzero', L('sourcils et bouche', 'brows and mouth')));
  if(want.includes('eyes')) out.push(P(MASCOT.eyes, o.ink, 'evenodd', L('yeux', 'eyes')));
  if(o.shadow) out.forEach(p => { p.shadow = Object.assign({on:true, x:0, y:0}, o.shadow); });
  if(o.rot) _turn(out, cx, cy, o.rot);
  return out;
}
// un point de la boîte 64 × 64 de la mascotte, en coordonnées de l'affiche
function mpt(cx, cy, s, x, y){ return [cx + (x - 32)*s/64, cy + (y - 32)*s/64]; }

// le carton du studio : le logo et « Raging Studio » dessous
function studioCard(x, y, s, color, o){
  o = o || {};
  const out = mascot(x, y, s, {badge:o.tile || '#262535'});
  out.push(mkText('Raging Studio', x, y + s*.86, s*4, {font:'Fraunces', size:Math.round(s*.34), weight:700, fill:solid(color || '#FFFFFF'), name:L('Carton du studio', 'Studio card')}));
  return out;
}
// la ligne « Raging Studio présente » en haut de l'affiche
function presents(W, H, y, color, extra){
  const u = Math.min(W, H);
  return mkText(L('RAGING STUDIO PRÉSENTE', 'RAGING STUDIO PRESENTS') + (extra ? '  ·  ' + extra : ''), W/2, y, W*.9, {font:'Oswald', size:Math.round(u*.024), letterSpacing:380, fill:solid(color || '#FFFFFFcc')});
}
// le bloc de crédits, version parodie (les « Prénom Nom » restent à remplacer)
function parodyBilling(W, H, y, color, font){
  const u = Math.min(W, H);
  return mkText(L(
    'RAGING STUDIO PRÉSENTE  UNE PRODUCTION DE LA MASCOTTE  UN FILM DE PRÉNOM NOM  AVEC PRÉNOM NOM  PRÉNOM NOM  ET LA MASCOTTE DANS LE RÔLE DE LA MASCOTTE  MUSIQUE ORIGINALE UN KAZOO TRÈS EN COLÈRE  MONTAGE CTRL+Z  DIRECTION DE LA PHOTOGRAPHIE UN ÉCRAN TRÈS LUMINEUX  ÉCRIT SUR RAGING PAGE  DESSINÉ SUR RAGING DRAW  AUCUN BUDGET N’A ÉTÉ MALTRAITÉ PENDANT LE TOURNAGE',
    'RAGING STUDIO PRESENTS  A MASCOT PRODUCTION  A FIRST LAST FILM  STARRING FIRST LAST  FIRST LAST  AND THE MASCOT AS THE MASCOT  ORIGINAL MUSIC BY A VERY ANGRY KAZOO  EDITED BY CTRL+Z  DIRECTOR OF PHOTOGRAPHY A VERY BRIGHT SCREEN  WRITTEN IN RAGING PAGE  DRAWN IN RAGING DRAW  NO BUDGETS WERE HARMED IN THE MAKING OF THIS FILM'),
    W/2, y, W*.8, {font:font || 'League Gothic', size:Math.round(u*.024), lineHeight:1.05, letterSpacing:40, fill:solid(color || '#FFFFFFcc'), name:L('Bloc de crédits', 'Billing block')});
}

/* ---------- Motifs ---------- */
// moquette à hexagones (l'hôtel de The Whining)
function decorHexCarpet(vw, vh, R){
  let ring = '', core = '';
  const hx = (cx, cy, r) => _poly([0, 1, 2, 3, 4, 5].map(i => [cx + r*Math.cos(Math.PI/3*i), cy + r*Math.sin(Math.PI/3*i)]));
  const dx = R*1.5, dy = R*Math.sqrt(3);
  for(let i = -1, x = 0; x < vw + R*2; i++, x = i*dx){
    for(let y = (i % 2 ? dy/2 : 0) - dy; y < vh + dy; y += dy){
      ring += hx(x, y, R*.94) + hx(x, y, R*.72);
      core += hx(x, y, R*.36);
    }
  }
  return {ring:{d:ring, vw, vh, rule:'evenodd'}, core:{d:core, vw, vh}};
}
// bande de damier (le taxi)
function decorChecker(cols, rows, c){
  let d = '';
  for(let r = 0; r < rows; r++) for(let k = 0; k < cols; k++) if((r + k) % 2 === 0) d += `M${k*c} ${r*c}h${c}v${c}h-${c}z`;
  return {d, vw:cols*c, vh:rows*c};
}
// spirale épaisse (Vertirage)
function decorSpiral(turns, vw){
  const c = vw/2, R = vw*.49, gap = R/turns, hw = gap*.27, N = Math.round(turns*90), A = [], B = [];
  for(let i = 0; i <= N; i++){
    const t = i/N, th = t*turns*Math.PI*2, r = R*t, w = hw*(.25 + .75*t);
    A.push([c + Math.cos(th)*(r + w), c + Math.sin(th)*(r + w)]);
    B.push([c + Math.cos(th)*Math.max(0, r - w), c + Math.sin(th)*Math.max(0, r - w)]);
  }
  return {d:_poly(A.concat(B.reverse())), vw, vh:vw};
}
// sol quadrillé en perspective (Ralien)
function decorGridFloor(vw, vh){
  let d = ''; const hz = 0, cx = vw/2, t = 2.2;
  for(let i = 1; i <= 9; i++){ const y = hz + vh*Math.pow(i/9, 2.1); d += `M0 ${_m(y)}H${vw}V${_m(y + t*(.5 + i*.25))}H0Z`; }
  for(let k = -14; k <= 14; k++){
    const xb = cx + k*vw*.11, w = t*1.6;
    d += _poly([[cx + k*vw*.012 - .6, hz], [cx + k*vw*.012 + .6, hz], [xb + w, vh], [xb - w, vh]]);
  }
  return {d, vw, vh};
}

// la ville la nuit (Taxi Drawer) : des tours et leurs fenêtres allumées
function decorSkyline(vw, vh, seed){
  const r = _rng(seed || 5); let towers = '', lights = '';
  for(let x = -10; x < vw; ){
    const w = 50 + r()*90, h = vh*(.3 + r()*.65), y = vh - h;
    towers += `M${_m(x)} ${_m(y)}h${_m(w)}V${vh}h-${_m(w)}Z`;
    for(let wy = y + 14; wy < vh - 20; wy += 22) for(let wx = x + 10; wx < x + w - 14; wx += 18) if(r() > .62) lights += `M${_m(wx)} ${_m(wy)}h8v11h-8z`;
    x += w + 4 + r()*10;
  }
  return {towers:{d:towers, vw, vh}, lights:{d:lights, vw, vh}};
}

/* ---------- Les affiches ---------- */
const PARODIES = [

  /* The Shining → THE WHINING : la porte défoncée, la moquette de l'hôtel */
  {id:'whining', fr:'The Whining', en:'The Whining', make:(W,H) => {
    const u = Math.min(W, H), o = [], cp = decorHexCarpet(1000, 1000*H/W, 70);
    o.push(mkPath(cp.ring, W/2, H/2, W, H, {fill:solid('#D9622B'), name:L('Moquette de l’hôtel', 'Hotel carpet'), _re:vw => decorHexCarpet(vw, 1000*H/W, 70).ring}));
    o.push(mkPath(cp.core, W/2, H/2, W, H, {fill:solid('#8E1B1B'), name:L('Moquette · motifs', 'Carpet · pattern'), _re:vw => decorHexCarpet(vw, 1000*H/W, 70).core}));
    const dw = W*.66, dh = H*.6, dx = W/2, dy = H*.36;
    o.push(mkShape('rect', dx, dy, dw, dh, {fill:linear(90, [stop(0, '#7A4524'), stop(1, '#5A3018')]), shadow:{on:true, color:'#000000aa', blur:60, x:0, y:20}, name:L('Porte', 'Door')}));
    [[-.22, -.28], [.22, -.28], [-.22, .2], [.22, .2]].forEach(p => o.push(mkShape('rect', dx + dw*p[0], dy + dh*p[1], dw*.36, dh*.34, {radius:u*.006, fill:solid('#00000000'), stroke:{on:true, color:'#3E2010', width:Math.round(u*.008)}, name:L('Porte · panneau', 'Door · panel')})));
    const hw = dw*.62, hh = dh*.46, hy = dy - dh*.05;
    o.push(mkPath({d:'M60 40L180 0L250 70L380 20L460 130L560 90L600 230L520 330L590 450L470 520L420 640L300 590L190 660L120 540L20 520L50 390L0 270L70 170Z', vw:600, vh:660}, dx, hy, hw, hh, {fill:solid('#120806'), name:L('Trou dans la porte', 'Hole in the door')}));
    o.push(...mascot(dx + hw*.02, hy + hh*.04, hh*.78, {rot:-8}));
    o.push(mkPath(DECORS.bubble(), dx + dw*.36, dy - dh*.3, u*.34, u*.34*230/300, {fill:solid('#F2C94C'), rot:4, name:L('Bulle', 'Speech bubble')}));
    o.push(mkText(L('VOICI\nRAGY !', 'HERE’S\nRAGY!'), dx + dw*.36, dy - dh*.325, u*.3, {font:'Bowlby One', size:Math.round(u*.05), lineHeight:1, rot:4, fill:solid('#23262E')}));
    o.push(presents(W, H, H*.035, '#F2C94C'));
    o.push(mkText('THE WHINING', W/2, H*.735, W*.94, {font:'Archivo Black', size:Math.round(u*.1), letterSpacing:-10, fill:solid('#F2C94C'), shadow:{on:true, color:'#120806', blur:0, x:Math.round(u*.008), y:Math.round(u*.01)}}));
    o.push(mkText(L('TOUT LE TRAVAIL ET PAS DE CAFÉ\nFONT DE JACK UN GARÇON RONCHON.', 'ALL WORK AND NO COFFEE\nMAKES JACK A GRUMPY BOY.'), W/2, H*.81, W*.86, {font:'Special Elite', size:Math.round(u*.036), lineHeight:1.25, fill:solid('#FFF4D6')}));
    o.push(parodyBilling(W, H, H*.915, '#FFF4D6cc'));
    return {bg:solid('#3B1A10'), fx:{grain:22, vignette:55}, objects:o};
  }},

  /* Point Break → POINT BREAKFAST : la vague, la planche… en croissant */
  {id:'breakfast', fr:'Point Breakfast', en:'Point Breakfast', make:(W,H) => {
    const u = Math.min(W, H), o = [];
    o.push(mkShape('ellipse', W*.72, H*.2, u*.34, u*.34, {fill:radial([stop(0, '#FFF1B8'), stop(1, '#F2994A')], .4, .4), shadow:{on:true, color:'#F2994Acc', blur:120, x:0, y:0}, name:L('Soleil', 'Sun')}));
    o.push(mkPath({d:'M0 1000V640C150 600 300 520 420 400C520 300 620 200 760 170C880 146 980 200 1000 260V1000Z', vw:1000, vh:1000}, W/2, H*.62, W, H*.76, {fill:linear(180, [stop(0, '#5DB6EC'), stop(.5, '#1F6FA0'), stop(1, '#0B2A40')]), name:L('Vague', 'Wave')}));
    o.push(mkPath({d:'M560 300C620 220 690 176 770 166C880 152 980 200 1000 262V340C962 290 904 262 846 270C786 278 744 318 752 372C700 340 690 260 740 214C680 236 620 270 560 300Z', vw:1000, vh:1000}, W/2, H*.62, W, H*.76, {fill:solid('#FFFFFF'), opacity:.85, name:L('Écume', 'Foam')}));
    const bx = W*.46, by = H*.6, bw = u*.62;
    const board = [mkPath({d:'M0 70C40 8 260 8 300 70C250 118 50 118 0 70Z', vw:300, vh:120}, bx, by, bw, bw*.4, {fill:linear(90, [stop(0, '#F2C278'), stop(1, '#B9722E')]), name:L('Planche croissant', 'Croissant board')}),
      mkPath({d:'M70 30C80 60 80 80 72 104M130 20C142 56 142 84 132 112M190 22C200 56 198 86 188 112M245 34C250 60 248 80 240 100', vw:300, vh:120}, bx, by, bw, bw*.4, {fill:solid('#00000000'), stroke:{on:true, color:'#8A4E1C', width:Math.round(u*.007)}, name:L('Planche · plis', 'Board · folds')})];
    o.push(..._turn(board, bx, by, -12));
    o.push(...mascot(bx - u*.01, by - u*.2, u*.36, {rot:-10}));
    o.push(presents(W, H, H*.04, '#FFFFFF'));
    o.push(mkText('POINT\nBREAKFAST', W/2, H*.165, W*.86, {font:'Anton', size:Math.round(u*.15), lineHeight:.88, italic:true, align:'left', fill:solid('#FFFFFF'), shadow:{on:true, color:'#0B2A40aa', blur:30, x:0, y:8}}));
    o.push(mkText(L('100 % PUR BEURRE', '100% PURE BUTTER'), W/2, H*.82, W*.86, {font:'Oswald', size:Math.round(u*.06), weight:700, letterSpacing:120, fill:solid('#F2C94C'), shadow:{on:true, color:'#00000088', blur:20, x:0, y:6}}));
    o.push(mkText(L('LA VAGUE DU MATIN N’ATTEND PERSONNE. LE CROISSANT NON PLUS.', 'THE MORNING WAVE WAITS FOR NO ONE. NEITHER DOES THE CROISSANT.'), W/2, H*.865, W*.84, {font:'Oswald', size:Math.round(u*.024), letterSpacing:120, fill:solid('#E8EAF2')}));
    o.push(parodyBilling(W, H, H*.93));
    return {bg:linear(180, [stop(0, '#F2994A'), stop(.45, '#E86FB0'), stop(1, '#14425E')]), fx:{grain:10, vignette:30}, objects:o};
  }},

  /* Pulp Fiction → PULP FRICTION : la couverture de roman de gare */
  {id:'friction', fr:'Pulp Friction', en:'Pulp Friction', make:(W,H) => {
    const u = Math.min(W, H), o = [];
    o.push(mkShape('rect', W/2, H*.55, W*.88, H*.78, {fill:radial([stop(0, '#2A2420'), stop(1, '#0D0B0A')], .45, .55), name:L('Le lit', 'The bed')}));
    o.push(mkShape('rect', W*.62, H*.72, W*.72, H*.16, {radius:u*.02, fill:solid('#1A1715'), rot:-4, name:L('Oreiller', 'Pillow')}));
    const mx = W*.56, my = H*.56, ms = u*.5;
    o.push(...mascot(mx, my, ms, {rot:-14}));
    // le livre ouvert (un scénario, évidemment)
    const bk = [mkShape('rect', W*.3, H*.735, u*.26, u*.32, {radius:u*.01, fill:solid('#F4EFE6'), rot:-18, name:L('Livre · page gauche', 'Book · left page')}),
      mkShape('rect', W*.44, H*.73, u*.26, u*.32, {radius:u*.01, fill:solid('#E8E0D0'), rot:-6, name:L('Livre · page droite', 'Book · right page')}),
      mkText(L('RAGING\nPAGE', 'RAGING\nPAGE'), W*.3, H*.735, u*.2, {font:'Courier Prime', size:Math.round(u*.036), weight:700, lineHeight:1.1, rot:-18, fill:solid('#1F6FA0')})];
    o.push(...bk);
    // le crayon-cigarette et sa fumée
    o.push(mkShape('rect', W*.74, H*.57, u*.2, u*.022, {radius:u*.006, fill:solid('#F2C94C'), rot:-20, name:L('Crayon-cigarette', 'Pencil cigarette')}));
    o.push(mkPath({d:'M10 300C60 240 -10 190 40 130C90 70 20 40 60 0', vw:100, vh:300}, W*.85, H*.47, u*.07, u*.2, {fill:solid('#00000000'), stroke:{on:true, color:'#FFFFFF66', width:Math.round(u*.006)}, name:L('Fumée', 'Smoke')}));
    o.push(mkText('PULP\nFRICTION', W/2, H*.16, W*.9, {font:'Alfa Slab One', size:Math.round(u*.16), lineHeight:.95, fill:solid('#F2C94C'), stroke:{on:true, color:'#8E1B1B', width:Math.round(u*.008)}, shadow:{on:true, color:'#8E1B1B', blur:0, x:Math.round(u*.01), y:Math.round(u*.01)}}));
    o.push(mkShape('ellipse', W*.15, H*.06, u*.15, u*.15, {fill:solid('#D64545'), stroke:{on:true, color:'#F2C94C', width:Math.round(u*.006)}, name:L('Prix', 'Price')}));
    o.push(mkText(L('0 €', 'FREE'), W*.15, H*.06, u*.14, {font:'Bowlby One', size:Math.round(u*.04), rot:-10, fill:solid('#FFFFFF')}));
    o.push(mkText(L('UN SCÉNARIO ÉCRIT SUR RAGING PAGE', 'A SCREENPLAY WRITTEN IN RAGING PAGE'), W*.58, H*.045, W*.6, {font:'Oswald', size:Math.round(u*.022), letterSpacing:200, fill:solid('#3B2414')}));
    o.push(mkText(L('« REDIS “BROUILLON” ENCORE UNE FOIS. CHICHE. »', '“SAY ‘DRAFT’ AGAIN. I DARE YOU.”'), W/2, H*.86, W*.9, {font:'Playfair Display', size:Math.round(u*.034), weight:700, italic:true, fill:solid('#F2C94C')}));
    o.push(parodyBilling(W, H, H*.915, '#FFFFFFbb'));
    o.push(mkText(L('RAGING STUDIO · LE N° 1 DES HISTOIRES QUI COLLENT', 'RAGING STUDIO · AMERICA’S STICKIEST STORIES'), W/2, H*.975, W*.8, {font:'Oswald', size:Math.round(u*.02), letterSpacing:200, fill:solid('#3B2414')}));
    return {bg:solid('#E2CF9E'), fx:{grain:40, vignette:30, vignetteColor:'#5A3A1A'}, objects:o};
  }},

  /* Alien → R A L I E N : l'œuf, la fissure, le sol quadrillé */
  {id:'ralien', fr:'Ralien', en:'Ralien', make:(W,H) => {
    const u = Math.min(W, H), o = [];
    o.push(mkPath(decorGridFloor(1000, 360), W/2, H*.66, W, W*.36*1.1, {fill:solid('#2A3A44'), name:L('Sol quadrillé', 'Grid floor'), _re:vw => decorGridFloor(vw, 360)}));
    const ex = W/2, ey = H*.4, ew = u*.5, eh = ew*1.35;
    o.push(mkPath({d:'M100 0C160 0 200 90 200 160C200 230 155 270 100 270C45 270 0 230 0 160C0 90 40 0 100 0Z', vw:200, vh:270}, ex, ey, ew, eh, {fill:radial([stop(0, '#4A5A52'), stop(.6, '#1C2420'), stop(1, '#070A09')], .38, .32), shadow:{on:true, color:'#7CFFB255', blur:90, x:0, y:0}, name:L('L’œuf', 'The egg')}));
    o.push(mkPath({d:'M0 30L40 18L70 34L110 10L140 30L170 16L200 28L200 40L170 28L140 44L110 24L70 48L40 32L0 44Z', vw:200, vh:60}, ex, ey + eh*.32, ew*.9, ew*.27, {fill:solid('#C8FFDC'), shadow:{on:true, color:'#7CFFB2', blur:60, x:0, y:0}, name:L('Fissure lumineuse', 'Glowing crack')}));
    o.push(...mascot(ex, ey - eh*.04, ew*.86, {parts:['face', 'eyes'], ink:'#9CFFC4', shadow:{color:'#7CFFB2', blur:50}}));
    o.push(mkText('R A L I E N', W/2, H*.79, W*.94, {font:'Michroma', size:Math.round(u*.1), letterSpacing:120, fill:solid('#E8EAF2')}));
    o.push(mkText(L('DANS L’ESPACE, PERSONNE NE VOUS ENTEND RÂLER.', 'IN SPACE NO ONE CAN HEAR YOU RAGE.'), W/2, H*.075, W*.92, {font:'Michroma', size:Math.round(u*.02), letterSpacing:100, fill:solid('#B7D4EC')}));
    o.push(presents(W, H, H*.035, '#9A99B0'));
    o.push(parodyBilling(W, H, H*.9, '#9A99B0'));
    return {bg:linear(180, [stop(0, '#000000'), stop(.6, '#05080A'), stop(1, '#0B1418')]), fx:{grain:14, vignette:60}, objects:o};
  }},

  /* Taxi Driver → TAXI DRAWER : la nuit, le damier, la crête */
  {id:'taxi', fr:'Taxi Drawer', en:'Taxi Drawer', make:(W,H) => {
    const u = Math.min(W, H), o = [];
    const sk = decorSkyline(1000, 600, 5);
    o.push(mkPath(sk.towers, W/2, H*.42, W, W*.6, {fill:solid('#221A12'), name:L('La ville', 'The city'), _re:vw => decorSkyline(vw, 600, 5).towers}));
    o.push(mkPath(sk.lights, W/2, H*.42, W, W*.6, {fill:solid('#F2C94C'), opacity:.75, name:L('La ville · fenêtres', 'The city · windows'), _re:vw => decorSkyline(vw, 600, 5).lights}));
    o.push(mkImage(null, W/2, H*.36, W, H*.72, W, H*.72, {tint:{on:true, color:'#F2994A', amount:25}, fade:{top:0, bottom:45, left:0, right:0}}));
    const mx = W*.5, my = H*.5, ms = u*.56;
    const a = mpt(mx, my, ms, 32, 4);
    o.push(mkPath({d:'M0 100L14 30L26 80L40 0L54 80L66 30L80 100Z', vw:80, vh:100}, a[0], a[1] - ms*.03, ms*.34, ms*.22, {fill:linear(90, [stop(0, '#D9363E'), stop(1, '#8E1B1B')]), name:L('La crête', 'The mohawk')}));
    o.push(...mascot(mx, my, ms));
    const ck = decorChecker(24, 2, 40);
    o.push(mkShape('rect', W/2, H*.735, W, u*.08, {fill:solid('#F2C94C'), name:L('Bande taxi', 'Taxi stripe')}));
    o.push(mkPath(ck, W/2, H*.735, W, W*80/960, {fill:solid('#14110D'), name:L('Damier', 'Checkers'), _re:vw => decorChecker(Math.round(vw/40), 2, 40)}));
    o.push(mkPath(DECORS.bubble(), W*.8, H*.26, u*.36, u*.36*230/300, {fill:solid('#FFFFFF'), rot:-4, name:L('Bulle', 'Speech bubble')}));
    o.push(mkText(L('TU DESSINES\nÀ MOI ?', 'YOU DRAWIN’\nTO ME?'), W*.8, H*.255, u*.32, {font:'Permanent Marker', size:Math.round(u*.042), lineHeight:1.05, rot:-4, fill:solid('#23262E')}));
    o.push(mkText('TAXI DRAWER', W/2, H*.805, W*.94, {font:'Bebas Neue', size:Math.round(u*.14), letterSpacing:40, fill:solid('#F2C94C')}));
    o.push(mkText(L('Dans chaque rue de chaque ville, il y a un inconnu qui rêve de faire son affiche.', 'On every street in every city, there’s a nobody who dreams of making a poster.'), W/2, H*.88, W*.72, {font:'Special Elite', size:Math.round(u*.028), lineHeight:1.3, fill:solid('#E8EAF2')}));
    o.push(presents(W, H, H*.035, '#FFFFFFcc'));
    o.push(parodyBilling(W, H, H*.95, '#FFFFFFaa'));
    return {bg:linear(180, [stop(0, '#14110D'), stop(1, '#050505')]), fx:{grain:20, vignette:55}, objects:o};
  }},

  /* Vertigo → VERTIRAGE : la spirale, la chute, l'orange */
  {id:'vertirage', fr:'Vertirage', en:'Vertirage', make:(W,H) => {
    const u = Math.min(W, H), o = [];
    o.push(mkPath(decorSpiral(4.2, 1000), W*.52, H*.37, u*.88, u*.88, {fill:solid('#FFFFFF'), rot:20, name:L('Spirale', 'Spiral')}));
    o.push(...mascot(W*.48, H*.37, u*.3, {paper:'#14110D', blue:'#14110D', red:'#14110D', ink:'#E8542C', rot:28}));
    o.push(...mascot(W*.68, H*.54, u*.15, {paper:'#14110D', blue:'#14110D', red:'#14110D', ink:'#E8542C', rot:-36, flip:true}));
    o.push(mkText(L('LA CÉLÈBRE AFFICHE QUI DONNE LE TOURNIS', 'THE FAMOUS POSTER THAT MAKES YOU DIZZY'), W/2, H*.06, W*.86, {font:'Oswald', size:Math.round(u*.026), letterSpacing:260, fill:solid('#14110D')}));
    o.push(mkText(L('ALFRED HITCHCLIC', 'ALFRED HITCHCLICK’S'), W/2, H*.75, W*.86, {font:'Oswald', size:Math.round(u*.04), weight:700, letterSpacing:200, fill:solid('#14110D')}));
    o.push(mkText('VERTIRAGE', W/2, H*.81, W*.94, {font:'Staatliches', size:Math.round(u*.16), letterSpacing:20, fill:solid('#14110D')}));
    o.push(mkText(L('UN VERTIGE. UNE DEADLINE. ZÉRO SAUVEGARDE.', 'ONE DIZZY SPELL. ONE DEADLINE. ZERO BACKUPS.'), W/2, H*.875, W*.86, {font:'Oswald', size:Math.round(u*.028), letterSpacing:160, fill:solid('#FFFFFF')}));
    o.push(parodyBilling(W, H, H*.935, '#14110Dcc'));
    return {bg:solid('#E8542C'), fx:{grain:16, vignette:20, vignetteColor:'#5A1A0A'}, objects:o};
  }},

  /* Scarface → SCARFFACE : noir et blanc, le titre chromé… et l'écharpe */
  {id:'scarfface', fr:'Scarfface', en:'Scarfface', make:(W,H) => {
    const u = Math.min(W, H), o = [];
    o.push(mkShape('rect', W/2, H*.3, W, H*.6, {fill:linear(180, [stop(0, '#FFFFFF'), stop(1, '#C9CCD3')]), name:L('Lumière', 'Light')}));
    const mx = W/2, my = H*.4, ms = u*.62;
    o.push(...mascot(mx, my, ms, {paper:'#F4F5F7', blue:'#9A99B0', red:'#5C6270', ink:'#0B0B10', shadow:{color:'#00000066', blur:60}}));
    // l'écharpe (le jeu de mots, en vrai)
    const s1 = mpt(mx, my, ms, 32, 58), s2 = mpt(mx, my, ms, 42, 66);
    o.push(mkShape('rect', s1[0], s1[1], ms*.82, ms*.13, {radius:ms*.06, fill:linear(0, [stop(0, '#D9363E'), stop(.5, '#F04A52'), stop(1, '#D9363E')]), rot:-3, name:L('Écharpe', 'Scarf')}));
    o.push(mkShape('rect', s2[0], s2[1] + ms*.08, ms*.14, ms*.34, {radius:ms*.04, fill:solid('#C02A32'), rot:10, name:L('Écharpe · pan', 'Scarf · tail')}));
    o.push(mkPath(decorChecker(1, 6, 10), s2[0] + ms*.03, s2[1] + ms*.1, ms*.04, ms*.24, {fill:solid('#3699D4'), rot:10, name:L('Écharpe · rayures', 'Scarf · stripes')}));
    o.push(mkText('SCARFFACE', W/2, H*.72, W*.94, {font:'Abril Fatface', size:Math.round(u*.15), letterSpacing:10, fill:linear(180, [stop(0, '#FFFFFF'), stop(.48, '#C9CCD3'), stop(.52, '#5C6270'), stop(1, '#E8EAF2')]), stroke:{on:true, color:'#23262E', width:Math.round(u*.004)}, shadow:{on:true, color:'#000000', blur:30, x:0, y:8}}));
    o.push(mkText(L('IL AIMAIT LES AFFICHES GRATUITES. AVEC RAGE.', 'HE LOVED FREE POSTERS. WITH A VENGEANCE.'), W/2, H*.8, W*.86, {font:'Oswald', size:Math.round(u*.028), letterSpacing:220, fill:solid('#E8EAF2')}));
    o.push(mkText(L('« DIS BONJOUR À MA PETITE POLICE ! »', '“SAY HELLO TO MY LITTLE FONT!”'), W/2, H*.85, W*.86, {font:'Playfair Display', size:Math.round(u*.034), weight:700, italic:true, fill:solid('#D9363E')}));
    o.push(presents(W, H, H*.035, '#23262E'));
    o.push(parodyBilling(W, H, H*.92, '#9A99B0'));
    return {bg:solid('#0B0B10'), fx:{grain:18, vignette:45}, objects:o};
  }},

  /* Jaws → DRAWS : le nageur, et ce qui monte des profondeurs */
  {id:'draws', fr:'Draws', en:'Draws', make:(W,H) => {
    const u = Math.min(W, H), o = [], sea = H*.3;
    o.push(mkShape('rect', W/2, (sea + H)/2, W, H - sea, {fill:linear(180, [stop(0, '#1F6FA0'), stop(.4, '#0E2A3D'), stop(1, '#03080D')]), name:L('L’océan', 'The ocean')}));
    // le crayon géant, pointe vers le haut
    const px = W*.5, pw = u*.26, top = sea + H*.16, ph = H*.9;
    const pen = [
      mkShape('rect', px, top + pw*1.1 + ph/2, pw, ph, {fill:linear(0, [stop(0, '#C9971F'), stop(.33, '#F2C94C'), stop(.66, '#FFE08A'), stop(1, '#C9971F')]), name:L('Crayon · corps', 'Pencil · body')}),
      mkPath({d:'M0 220L100 0L200 220L183 210L167 222L150 208L133 222L117 208L100 222L83 208L67 222L50 208L33 222L17 210Z', vw:200, vh:222}, px, top + pw*.55, pw, pw*1.11, {fill:solid('#E8C49A'), name:L('Crayon · bois', 'Pencil · wood')}),
      mkPath({d:'M0 90L40 0L80 90Z', vw:80, vh:90}, px, top + pw*.14, pw*.4, pw*.45, {fill:solid('#2A2C33'), name:L('Crayon · mine', 'Pencil · lead')})
    ];
    o.push(..._turn(pen, px, top, 4));
    o.push(mkShape('rect', W/2, (sea + H)/2, W, H - sea, {fill:linear(180, [stop(0, '#1F6FA055'), stop(.45, '#0E2A3D00'), stop(.8, '#03080Dee'), stop(1, '#03080D')]), name:L('Les profondeurs', 'The depths')}));
    o.push(...mascot(W*.5, sea - u*.02, u*.16, {rot:-6}));
    o.push(mkPath({d:'M0 20C20 0 40 0 60 20C80 40 100 40 120 20C140 0 160 0 180 20C200 40 220 40 240 20V40H0Z', vw:240, vh:40}, W*.5, sea + u*.03, u*.3, u*.05, {fill:solid('#1F6FA0'), name:L('Clapotis', 'Ripples')}));
    o.push(mkText('DRAWS', W/2, H*.12, W*.94, {font:'Anton', size:Math.round(u*.22), letterSpacing:30, fill:solid('#D9363E')}));
    o.push(mkText(L('IL VOUS FAUDRA UNE PLUS GRANDE TOILE.', 'YOU’RE GONNA NEED A BIGGER CANVAS.'), W/2, H*.215, W*.86, {font:'Oswald', size:Math.round(u*.03), weight:700, letterSpacing:120, fill:solid('#14425E')}));
    o.push(presents(W, H, H*.035, '#14425E'));
    o.push(mkText(L('LE ROMAN DONT LES CRAYONS SE SOUVIENNENT', 'THE NOVEL EVERY PENCIL STILL REMEMBERS'), W/2, H*.88, W*.8, {font:'Oswald', size:Math.round(u*.024), letterSpacing:220, fill:solid('#B7D4EC')}));
    o.push(parodyBilling(W, H, H*.935, '#B7D4ECcc'));
    return {bg:linear(180, [stop(0, '#FFFFFF'), stop(1, '#D6E8F5')]), fx:{grain:10, vignette:35}, objects:o};
  }},

  /* The Godfather → THE PLOTFATHER : les fils du marionnettiste */
  {id:'plotfather', fr:'The Plotfather', en:'The Plotfather', make:(W,H) => {
    const u = Math.min(W, H), o = [];
    const cx = W/2, cy = H*.13, bw = u*.5;
    const mx = W/2, my = H*.5, ms = u*.46;
    [[16.4, 25], [50.4, 27], [12, 50], [53, 50]].forEach((p, i) => {
      const b = mpt(mx, my, ms, p[0], p[1]), t = [cx + (i % 2 ? 1 : -1)*bw*(i < 2 ? .18 : .46), cy];
      const len = Math.hypot(b[0] - t[0], b[1] - t[1]), ang = Math.atan2(b[1] - t[1], b[0] - t[0])*180/Math.PI;
      o.push(mkShape('rect', (b[0] + t[0])/2, (b[1] + t[1])/2, len, Math.max(2, u*.0025), {fill:solid('#E8EAF2cc'), rot:ang, name:L('Fil', 'String')}));
    });
    o.push(mkShape('rect', cx, cy, bw, u*.03, {radius:u*.01, fill:linear(90, [stop(0, '#7A5230'), stop(1, '#4A2E18')]), name:L('Croix du marionnettiste', 'Puppet control')}));
    o.push(mkShape('rect', cx, cy, u*.03, u*.2, {radius:u*.01, fill:linear(0, [stop(0, '#7A5230'), stop(1, '#4A2E18')]), name:L('Croix du marionnettiste', 'Puppet control')}));
    o.push(...mascot(mx, my, ms, {shadow:{color:'#00000099', blur:40}}));
    const bt = mpt(mx, my, ms, 32, 60);
    o.push(mkPath({d:'M0 0L50 25L0 50ZM100 0L50 25L100 50Z', vw:100, vh:50}, bt[0], bt[1], ms*.26, ms*.13, {fill:solid('#0B0B10'), stroke:{on:true, color:'#FCFDFE', width:Math.round(u*.003)}, name:L('Nœud papillon', 'Bow tie')}));
    const rs = mpt(mx, my, ms, 48, 46);
    o.push(mkShape('rect', rs[0] - ms*.01, rs[1] + ms*.08, ms*.018, ms*.16, {fill:solid('#2F9E44'), rot:-20, name:L('Rose · tige', 'Rose · stem')}));
    o.push(mkPath({d:_circ(50, 50, 30) + _circ(30, 40, 20) + _circ(70, 40, 20) + _circ(50, 28, 20), vw:100, vh:100}, rs[0], rs[1], ms*.14, ms*.14, {fill:solid('#C21F1F'), name:L('Rose', 'Rose')}));
    o.push(presents(W, H, H*.035, '#9A99B0'));
    o.push(mkText('THE\nPLOTFATHER', W/2, H*.78, W*.94, {font:'Cinzel', size:Math.round(u*.12), weight:700, lineHeight:1, letterSpacing:30, fill:solid('#F4F5F7')}));
    o.push(mkText(L('JE VAIS LUI FAIRE UN MODÈLE QU’IL NE POURRA PAS REFUSER.', 'I’M GONNA MAKE HIM A TEMPLATE HE CAN’T REFUSE.'), W/2, H*.885, W*.92, {font:'Cormorant Garamond', size:Math.round(u*.032), weight:600, italic:true, fill:solid('#C8A165')}));
    o.push(parodyBilling(W, H, H*.94, '#9A99B0'));
    return {bg:radial([stop(0, '#1C1C22'), stop(1, '#000000')], .5, .45), fx:{grain:16, vignette:65}, objects:o};
  }},

  /* 2001 → 2001 : L'ODYSSÉE DE LA BARRE ESPACE */
  {id:'spacebar', fr:'2001 · Barre espace', en:'2001 · Space bar', make:(W,H) => {
    const u = Math.min(W, H), o = [];
    o.push(mkPath(decorStarfield(W, H*.7, 21), W/2, H*.35, W, H*.7, {fill:solid('#FFFFFF'), opacity:.8, name:L('Étoiles', 'Stars'), _re:vw => decorStarfield(vw, H*.7, 21)}));
    o.push(mkShape('ellipse', W/2, H*.98 + W, W*2.6, W*2.6, {fill:radial([stop(0, '#14425E'), stop(.96, '#1F6FA0'), stop(1, '#5DB6EC')], .5, .5), shadow:{on:true, color:'#5DB6ECaa', blur:100, x:0, y:0}, name:L('La Terre', 'Earth')}));
    o.push(mkShape('ellipse', W/2, H*.66, u*.1, u*.1, {fill:solid('#FFFFFF'), shadow:{on:true, color:'#FFF1B8', blur:140, x:0, y:0}, name:L('Soleil', 'Sun')}));
    const kx = W/2, ky = H*.47, kw = W*.78, kh = u*.15;
    o.push(mkShape('rect', kx, ky + kh*.08, kw, kh, {radius:kh*.2, fill:solid('#0B0B10'), shadow:{on:true, color:'#000000', blur:40, x:0, y:20}, name:L('Barre espace', 'Space bar')}));
    o.push(mkShape('rect', kx, ky - kh*.04, kw*.96, kh*.78, {radius:kh*.16, fill:linear(180, [stop(0, '#3A3D46'), stop(1, '#1C1D22')]), name:L('Barre espace · dessus', 'Space bar · top')}));
    o.push(mkShape('ellipse', W/2, H*.22, u*.38, u*.38, {fill:radial([stop(0, '#B7D4EC33'), stop(.8, '#3699D433'), stop(1, '#5DB6EC88')]), stroke:{on:true, color:'#B7D4EC66', width:Math.round(u*.004)}, name:L('La bulle', 'The bubble')}));
    o.push(...mascot(W/2, H*.22, u*.24, {rot:-15, opacity:.95}));
    o.push(mkText('2001', W/2, H*.75, W*.9, {font:'Michroma', size:Math.round(u*.14), letterSpacing:200, fill:solid('#FFFFFF')}));
    o.push(mkText(L('L’ODYSSÉE DE LA BARRE ESPACE', 'A SPACE BAR ODYSSEY'), W/2, H*.815, W*.94, {font:'Michroma', size:Math.round(u*.03), letterSpacing:180, fill:solid('#E8EAF2')}));
    o.push(mkText(L('L’AVENTURE ULTIME… JUSQU’AU CLAVIER.', 'THE ULTIMATE TRIP… TO THE KEYBOARD.'), W/2, H*.06, W*.92, {font:'Michroma', size:Math.round(u*.02), letterSpacing:140, fill:solid('#B7D4EC')}));
    o.push(presents(W, H, H*.025, '#9A99B0'));
    o.push(parodyBilling(W, H, H*.92, '#B7D4ECcc'));
    return {bg:solid('#000000'), fx:{grain:8, vignette:40}, objects:o};
  }},

  /* Jurassic Park → JURASSIC PARKING : le médaillon, la jungle… et le P */
  {id:'parking', fr:'Jurassic Parking', en:'Jurassic Parking', make:(W,H) => {
    const u = Math.min(W, H), o = [];
    [[.1, .9, .5], [.92, .86, .55], [.3, 1.02, .6], [.75, 1.04, .5], [.02, .62, .35], [1, .6, .4]].forEach(t => o.push(mkShape('ellipse', W*t[0], H*t[1], u*t[2], u*t[2]*.9, {fill:solid('#0A1F14'), name:L('Jungle', 'Jungle')})));
    const cx = W/2, cy = H*.42, r = u*.4;
    o.push(mkShape('ellipse', cx, cy, r*2, r*2, {fill:solid('#0B0B10'), stroke:{on:true, color:'#F2C94C', width:Math.round(u*.012)}, shadow:{on:true, color:'#000000aa', blur:60, x:0, y:20}, name:L('Médaillon', 'Medallion')}));
    o.push(mkShape('ellipse', cx, cy, r*1.62, r*1.62, {fill:radial([stop(0, '#FFE08A'), stop(1, '#E8542C')], .5, .4), name:L('Médaillon · cœur', 'Medallion · core')}));
    o.push(...mascot(cx, cy - r*.08, r*1.15, {paper:'#0B0B10', blue:'#0B0B10', red:'#0B0B10', ink:'#F2994A'}));
    o.push(mkShape('rect', cx, cy + r*.62, r*2.3, r*.42, {fill:solid('#D9363E'), stroke:{on:true, color:'#0B0B10', width:Math.round(u*.008)}, name:L('Bandeau', 'Banner')}));
    o.push(mkText('JURASSIC PARKING', cx, cy + r*.62, r*2.2, {font:'Bungee', size:Math.round(u*.064), fill:solid('#FFE08A'), stroke:{on:true, color:'#0B0B10', width:Math.round(u*.004)}}));
    const sx = W*.86, sy = H*.16, ss = u*.15;
    o.push(mkShape('rect', sx, sy + ss*1.2, u*.016, ss*1.6, {fill:solid('#9A99B0'), name:L('Panneau · poteau', 'Sign · pole')}));
    o.push(mkShape('rect', sx, sy, ss, ss, {radius:ss*.12, fill:solid('#1F6FA0'), stroke:{on:true, color:'#FFFFFF', width:Math.round(u*.006)}, rot:6, name:L('Panneau P', 'P sign')}));
    o.push(mkText('P', sx, sy, ss, {font:'Archivo Black', size:Math.round(ss*.7), rot:6, fill:solid('#FFFFFF')}));
    o.push(mkText(L('UNE AVENTURE DE 65 MILLIONS D’ANNÉES… POUR TROUVER UNE PLACE.', 'AN ADVENTURE 65 MILLION YEARS IN THE MAKING… TO FIND A SPOT.'), W/2, H*.75, W*.8, {font:'Oswald', size:Math.round(u*.034), weight:700, lineHeight:1.2, letterSpacing:100, fill:solid('#FFE08A')}));
    o.push(presents(W, H, H*.035, '#FFE08Acc'));
    o.push(parodyBilling(W, H, H*.91, '#E8EAF2cc'));
    return {bg:linear(180, [stop(0, '#163826'), stop(1, '#050D08')]), fx:{grain:14, vignette:60}, objects:o};
  }},

  /* Le Bon, la Brute et le Truand → LE BON, LA BRUTE ET LE RÂLEUR */
  {id:'western', fr:'Le Bon, la Brute et le Râleur', en:'The Good, the Bad and the Angry', make:(W,H) => {
    const u = Math.min(W, H), o = [];
    o.push(mkShape('ellipse', W/2, H*.62, u*.7, u*.7, {fill:radial([stop(0, '#FFE08A'), stop(1, '#F2994A00')]), name:L('Soleil couchant', 'Setting sun')}));
    o.push(mkPath({d:'M0 120L120 60L220 90L340 30L470 80L600 40L720 90L860 50L1000 100V200H0Z', vw:1000, vh:200}, W/2, H*.66, W, W*.2, {fill:solid('#7A3A1A'), name:L('Montagnes', 'Mountains')}));
    o.push(mkShape('rect', W/2, H*.68 + H*.08, W, H*.16, {fill:solid('#3B1E10'), name:L('Le désert', 'The desert')}));
    const sep = {paper:'#F4E3C3', ink:'#3B2414', blue:'#C8A165', red:'#8E1B1B'};
    const hat = (x, y, s) => mkPath({d:'M0 70C40 90 160 90 200 70C185 60 160 58 150 58C150 30 140 0 100 8C60 0 50 30 50 58C40 58 15 60 0 70Z', vw:200, vh:92}, x, y, s*.8, s*.37, {fill:solid('#5A3018'), name:L('Chapeau', 'Hat')});
    [[W*.22, H*.56, u*.28, -6], [W*.78, H*.56, u*.28, 6], [W*.5, H*.5, u*.4, 0]].forEach(m => {
      o.push(...mascot(m[0], m[1], m[2], Object.assign({rot:m[3]}, sep)));
      const t = mpt(m[0], m[1], m[2], 32, 8); o.push(hat(t[0] + m[3]*u*.002, t[1] - m[2]*.04, m[2]));
    });
    o.push(mkText(L('LE BON, LA BRUTE\nET LE RÂLEUR', 'THE GOOD, THE BAD\nAND THE ANGRY'), W/2, H*.15, W*.94, {font:'Rye', size:Math.round(u*.076), lineHeight:1.05, fill:solid('#3B1E10'), stroke:{on:true, color:'#FFE08A', width:Math.round(u*.004)}}));
    o.push(mkText(L('POUR QUELQUES PIXELS DE PLUS', 'FOR A FEW PIXELS MORE'), W/2, H*.25, W*.8, {font:'Oswald', size:Math.round(u*.03), weight:700, letterSpacing:300, fill:solid('#7A3A1A')}));
    o.push(mkText(L('LE BON    ·    LA BRUTE    ·    LE RÂLEUR (C’EST LE MÊME)', 'THE GOOD    ·    THE BAD    ·    THE ANGRY (SAME GUY)'), W/2, H*.8, W*.9, {font:'Oswald', size:Math.round(u*.026), letterSpacing:120, fill:solid('#FFE08A')}));
    o.push(presents(W, H, H*.035, '#3B1E10'));
    o.push(parodyBilling(W, H, H*.9, '#FFE08Acc'));
    return {bg:linear(180, [stop(0, '#F2C94C'), stop(.6, '#E8542C'), stop(1, '#7A1E10')]), fx:{grain:28, vignette:40, vignetteColor:'#3B1E10'}, objects:o};
  }}
];
/* Sur un format large (carré, bannière), l'affiche garde sa mise en page
   en portrait, au centre ; les fonds pleine largeur s'étirent jusqu'aux
   bords et les motifs (moquette, ville, étoiles…) sont redessinés. */
function fitParody(make, W, H){
  const bw = Math.min(W, Math.round(H*.7)), t = make(bw, H), k = W/bw, dx = (W - bw)/2;
  t.objects.forEach(o => {
    const re = o._re; delete o._re;
    if(k === 1) return;
    if(o.type !== 'text' && o.w >= bw*.98 && Math.abs(o.rot || 0) < 1){
      o.x = W/2 + (o.x - bw/2)*k; o.w *= k;
      if(re){ const dec = re(o.vw*k); o.d = dec.d; o.vw = dec.vw; o.vh = dec.vh; }
    }else o.x += dx;
  });
  return t;
}
PARODIES.forEach(t => TEMPLATES.push({id:t.id, fr:t.fr, en:t.en, make:(W, H) => fitParody(t.make, W, H)}));
