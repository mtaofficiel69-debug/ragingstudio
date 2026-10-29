/* =====================================================================
   RAGING BOARD — MOTEUR
   Un moteur WebGL 1 minimal, écrit pour les petits ordinateurs :
   pas de textures, pas d'ombres calculées, un seul éclairage simple,
   et une image dessinée seulement quand quelque chose change.
===================================================================== */

/* ---------- Mathématiques (matrices 4×4 en colonnes, comme WebGL) ---------- */
const M4 = {
  ident(){ return [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1]; },
  mul(a, b){
    const o = new Array(16);
    for(let c = 0; c < 4; c++) for(let r = 0; r < 4; r++)
      o[c*4 + r] = a[r]*b[c*4] + a[4 + r]*b[c*4 + 1] + a[8 + r]*b[c*4 + 2] + a[12 + r]*b[c*4 + 3];
    return o;
  },
  persp(fovy, aspect, near, far){
    const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return [f/aspect,0,0,0, 0,f,0,0, 0,0,(far + near)*nf,-1, 0,0,2*far*near*nf,0];
  },
  lookAt(e, t, u){
    let zx = e[0] - t[0], zy = e[1] - t[1], zz = e[2] - t[2]; let l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
    let xx = u[1]*zz - u[2]*zy, xy = u[2]*zx - u[0]*zz, xz = u[0]*zy - u[1]*zx; l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l;
    const yx = zy*xz - zz*xy, yy = zz*xx - zx*xz, yz = zx*xy - zy*xx;
    return [xx,yx,zx,0, xy,yy,zy,0, xz,yz,zz,0, -(xx*e[0] + xy*e[1] + xz*e[2]), -(yx*e[0] + yy*e[1] + yz*e[2]), -(zx*e[0] + zy*e[1] + zz*e[2]), 1];
  },
  trans(x, y, z){ return [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]; },
  rx(a){ const c = Math.cos(a), s = Math.sin(a); return [1,0,0,0, 0,c,s,0, 0,-s,c,0, 0,0,0,1]; },
  ry(a){ const c = Math.cos(a), s = Math.sin(a); return [c,0,-s,0, 0,1,0,0, s,0,c,0, 0,0,0,1]; },
  rz(a){ const c = Math.cos(a), s = Math.sin(a); return [c,s,0,0, -s,c,0,0, 0,0,1,0, 0,0,0,1]; },
  apply(m, p){ const x = p[0], y = p[1], z = p[2], w = m[3]*x + m[7]*y + m[11]*z + m[15];
    return [(m[0]*x + m[4]*y + m[8]*z + m[12]) / w, (m[1]*x + m[5]*y + m[9]*z + m[13]) / w, (m[2]*x + m[6]*y + m[10]*z + m[14]) / w]; },
  invert(m){
    const a = m, o = new Array(16);
    const b00 = a[0]*a[5] - a[1]*a[4], b01 = a[0]*a[6] - a[2]*a[4], b02 = a[0]*a[7] - a[3]*a[4], b03 = a[1]*a[6] - a[2]*a[5];
    const b04 = a[1]*a[7] - a[3]*a[5], b05 = a[2]*a[7] - a[3]*a[6], b06 = a[8]*a[13] - a[9]*a[12], b07 = a[8]*a[14] - a[10]*a[12];
    const b08 = a[8]*a[15] - a[11]*a[12], b09 = a[9]*a[14] - a[10]*a[13], b10 = a[9]*a[15] - a[11]*a[13], b11 = a[10]*a[15] - a[11]*a[14];
    let d = b00*b11 - b01*b10 + b02*b09 + b03*b08 - b04*b07 + b05*b06; if(!d) return M4.ident(); d = 1 / d;
    o[0] = (a[5]*b11 - a[6]*b10 + a[7]*b09)*d; o[1] = (a[2]*b10 - a[1]*b11 - a[3]*b09)*d; o[2] = (a[13]*b05 - a[14]*b04 + a[15]*b03)*d; o[3] = (a[10]*b04 - a[9]*b05 - a[11]*b03)*d;
    o[4] = (a[6]*b08 - a[4]*b11 - a[7]*b07)*d; o[5] = (a[0]*b11 - a[2]*b08 + a[3]*b07)*d; o[6] = (a[14]*b02 - a[12]*b05 - a[15]*b01)*d; o[7] = (a[8]*b05 - a[10]*b02 + a[11]*b01)*d;
    o[8] = (a[4]*b10 - a[5]*b08 + a[7]*b06)*d; o[9] = (a[1]*b08 - a[0]*b10 - a[3]*b06)*d; o[10] = (a[12]*b04 - a[13]*b02 + a[15]*b00)*d; o[11] = (a[9]*b02 - a[8]*b04 - a[11]*b00)*d;
    o[12] = (a[5]*b07 - a[4]*b09 - a[6]*b06)*d; o[13] = (a[0]*b09 - a[1]*b07 + a[2]*b06)*d; o[14] = (a[13]*b01 - a[12]*b03 - a[14]*b00)*d; o[15] = (a[8]*b03 - a[9]*b01 + a[10]*b00)*d;
    return o;
  },
};
const D2R = Math.PI / 180;
const hexRGB = h => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

/* ---------- Géométrie : quelques formes simples, faces à plat ----------
   Une géométrie = { p:[...], n:[...], c:[...] } (positions, normales, couleurs par sommet). */
function geo(){ return { p:[], n:[], c:[], e:[], m:[] }; }
/* MAT : la matière de ce qu'on construit (le rendu les distingue au premier coup d'œil, pour presque rien) :
   0 objet, meuble · 1 architecture (sols, murs) · 2 feuillage · 3 métal (armes) · 4 carrosserie */
let MAT = 0;
const isGreen = C => C[1] > C[0] * 1.08 && C[1] > C[2] * 1.02;
/* une ampoule, un abat-jour, la tête d'un réverbère : petit, clair et chaud. La nuit, il reste allumé */
const isLight = (C, size) => size < 0.62 && C[0] > 0.9 && C[1] > 0.78 && C[2] < 0.82 && C[0] - C[2] > 0.12;
/* EDGE_ON : les arêtes de cette forme seront-elles tracées (meubles, murs) ? Pas pour les formes rondes. */
let EDGE_ON = 1;
function tri(g, a, b, c, col){
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  let nx = uy*vz - uz*vy, ny = uz*vx - ux*vz, nz = ux*vy - uy*vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
  for(const v of [a, b, c]){ g.p.push(v[0], v[1], v[2]); g.n.push(nx, ny, nz); g.c.push(col[0], col[1], col[2]); }
  if(g.e) g.e.push(EDGE_ON);
  if(g.m) g.m.push(MAT, MAT, MAT);
}
const quad = (g, a, b, c, d, col) => { tri(g, a, b, c, col); tri(g, a, c, d, col); };
/* pavé centré en (x,y,z), tourné de ry autour de la verticale ; faces tournées vers l'extérieur */
/* les pavés assez grands d'un décor (murs épais, meubles) sont aussi notés comme obstacles pour la caméra */
let COLL = null;
const collOf = g => { let a = COLL.get(g); if(!a) COLL.set(g, a = { b:[], w:[], p:[] }); return a; };
function box(g, x, y, z, w, h, d, col, ry){
  if(COLL && Math.max(w, h, d) >= 0.4 && h >= 0.03 && !(h < 0.25 && w > 2 && d > 2)) collOf(g).b.push([x, y, z, w / 2, h / 2, d / 2, ry || 0]);
  const e0 = EDGE_ON, m0 = MAT; if(Math.min(w, h, d) < 0.012) EDGE_ON = 0;   // les bandes peintes au sol : pas de trait
  if(MAT === 0 && ((h < 0.25 && w > 2 && d > 2) || Math.max(w, h, d) > 3.2)) MAT = 1;   // une dalle, un grand volume : de l'architecture
  if(MAT === 0 && isLight(typeof col === 'string' ? hexRGB(col) : col, Math.max(w, h, d))) MAT = 5;
  // un plafonnier : un panneau fin et clair, collé au plafond (néon de bureau, d'hôpital…) : allumé la nuit
  if(MAT === 0 && h <= 0.06 && y > 2.45 && y < 3.3 && Math.max(w, d) <= 2.4 && Math.min(w, d) >= 0.12){ const C = typeof col === 'string' ? hexRGB(col) : col; if(C[0] + C[1] + C[2] > 2.6) MAT = 5; }
  const hx = w/2, hy = h/2, hz = d/2, c = Math.cos(ry || 0), s = Math.sin(ry || 0);
  const P = (a, b, e) => [x + a*c + e*s, y + b, z - a*s + e*c];
  const v = [P(-hx,-hy,-hz), P(hx,-hy,-hz), P(hx,hy,-hz), P(-hx,hy,-hz), P(-hx,-hy,hz), P(hx,-hy,hz), P(hx,hy,hz), P(-hx,hy,hz)];
  const C = typeof col === 'string' ? hexRGB(col) : col;
  quad(g, v[4], v[5], v[6], v[7], C); quad(g, v[1], v[0], v[3], v[2], C);
  quad(g, v[5], v[1], v[2], v[6], C); quad(g, v[0], v[4], v[7], v[3], C);
  quad(g, v[7], v[6], v[2], v[3], C); quad(g, v[0], v[1], v[5], v[4], C);
  EDGE_ON = e0; MAT = m0;
}
/* mur d'un seul côté : on le voit de face, il disparaît vu de dos (la caméra peut passer derrière) */
/* une vitre de fenêtre : on y voit le dehors (le ciel, la ville ou la campagne au loin), calculé selon la direction du regard :
   la vue tourne avec la caméra, comme à travers une vraie fenêtre. Les vitres ont leur propre petit programme
   (le calcul ne se fait que sur elles : le reste de l'image ne coûte pas un calcul de plus) */
let PANES = null;
function pane(g, a, b, h, col, y0){ let q = g; if(PANES){ q = PANES.get(g); if(!q) PANES.set(g, q = geo()); } wall(q, a, b, h, col, y0); }
function wall(g, a, b, h, col, y0){
  if(COLL && h >= 0.4 && Math.hypot(b[0] - a[0], b[1] - a[1]) >= 0.4) collOf(g).w.push([a[0], a[1], b[0], b[1], y0 || 0, (y0 || 0) + h]);
  const C = typeof col === 'string' ? hexRGB(col) : col, y = y0 || 0, m0 = MAT; if(MAT === 0) MAT = 1;
  quad(g, [a[0], y, a[1]], [b[0], y, b[1]], [b[0], y + h, b[1]], [a[0], y + h, a[1]], C); MAT = m0;
}
/* les surfaces à texture (« Mon lieu ») : rangées à part, comme les vitres, et dessinées par leur propre petit programme.
   Les autres lieux n'en ont pas : rien de plus à calculer pour eux. k : la lumière de la face (calculée une fois ici). */
let TEXS = null;
const texLight = n => { const l = 1 / Math.hypot(0.45, 0.82, 0.36), h = 0.5 + 0.5 * n[1], w = Math.max((n[0] * 0.45 * l + n[1] * 0.82 * l + n[2] * 0.36 * l + 0.35) / 1.35, 0);
  return (0.37 + 0.13 * h + 0.56 * w) * (n[1] < -0.5 ? 0.93 : 1); };
function texQuad(key, a, b, c, d, ua, ub, uc, ud, vert){
  if(!TEXS) return; let m = TEXS.get(key); if(!m) TEXS.set(key, m = { p:[], u:[], l:[] });
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  let n = [uy*vz - uz*vy, uz*vx - ux*vz, ux*vy - uy*vx]; const L = Math.hypot(...n) || 1; n = n.map(v => v / L); const k = texLight(n);
  [[a, ua], [b, ub], [c, uc], [a, ua], [c, uc], [d, ud]].forEach(([p, u]) => { m.p.push(p[0], p[1], p[2]); m.u.push(u[0], u[1]); m.l.push(k, vert ? 1 : 0); });
}
/* un mur à texture : même obstacle qu'un mur peint ; s : la taille du motif, en mètres */
function twall(g, key, a, b, h, y0, s){
  if(COLL && h >= 0.4 && Math.hypot(b[0] - a[0], b[1] - a[1]) >= 0.4) collOf(g).w.push([a[0], a[1], b[0], b[1], y0 || 0, (y0 || 0) + h]);
  const y = y0 || 0, len = Math.hypot(b[0] - a[0], b[1] - a[1]) / s;
  texQuad(key, [a[0], y, a[1]], [b[0], y, b[1]], [b[0], y + h, b[1]], [a[0], y + h, a[1]], [0, y / s], [len, y / s], [len, (y + h) / s], [0, (y + h) / s], true);
}
/* un sol (ou un plafond, vu du dessous) à texture */
function tfloor(key, x0, z0, x1, z1, y, s, down, rot){
  const U = rot ? (x, z) => [z / s, x / s] : (x, z) => [x / s, -z / s];   // rot : le motif tourné d'un quart de tour (les lames du parquet dans l'autre sens)
  if(down) texQuad(key, [x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], U(x0, z0), U(x1, z0), U(x1, z1), U(x0, z1));
  else texQuad(key, [x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], U(x0, z1), U(x1, z1), U(x1, z0), U(x0, z0));
}
/* sol ou plafond, vu du dessus (sol) ou du dessous (plafond) */
function floor(g, x0, z0, x1, z1, y, col, down){
  const C = typeof col === 'string' ? hexRGB(col) : col, m0 = MAT; if(MAT === 0) MAT = 1;
  // un plafond ne trace pas ses propres bords (ses raccords, autour d'une trémie, feraient des traits noirs au plafond) :
  // l'angle avec les murs est déjà tracé par les murs
  if(down){ const e0 = EDGE_ON; EDGE_ON = 0; quad(g, [x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], C); EDGE_ON = e0; }
  else quad(g, [x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], C);
  MAT = m0;
}
/* cylindre le long d'un axe ('y' vers le bas pour les membres, 'x' pour les roues) */
/* GEO_K : le niveau de détail des formes rondes (plus bas pour les contours, plus légers à dessiner) */
let GEO_K = 1;
function cyl(g, x, y, z, r1, r2, len, col, seg, axis){
  // les cylindres assez grands (tables rondes, colonnes, roues, troncs) sont aussi des obstacles pour la caméra
  if(COLL && Math.max(2 * Math.max(r1, r2), len) >= 0.4){ const r = Math.max(r1, r2);
    collOf(g).b.push(axis === 'x' ? [x + len / 2, y, z, len / 2, r, r, 0] : axis === 'z' ? [x, y, z + len / 2, r, r, len / 2, 0] : [x, y - len / 2, z, r, len / 2, r, 0]); }
  seg = Math.max(5, Math.round((seg || 8) * GEO_K)); const C = typeof col === 'string' ? hexRGB(col) : col, e0 = EDGE_ON, m0 = MAT; EDGE_ON = 0;
  if(MAT === 0 && isGreen(C)) MAT = 2;
  if(MAT === 0 && isLight(C, Math.max(2 * Math.max(r1, r2), len))) MAT = 5;
  const pt = (r, t, k) => { const a = Math.cos(t)*r, b = Math.sin(t)*r;
    if(axis === 'x') return [x + k, y + a, z + b];
    if(axis === 'z') return [x + a, y + b, z + k];
    return [x + a, y - k, z + b]; };
  for(let i = 0; i < seg; i++){
    const t0 = i / seg * Math.PI * 2, t1 = (i + 1) / seg * Math.PI * 2;
    const a0 = pt(r1, t0, 0), a1 = pt(r1, t1, 0), b0 = pt(r2, t0, len), b1 = pt(r2, t1, len);
    quad(g, a0, a1, b1, b0, C); tri(g, pt(0, 0, 0), a1, a0, C); tri(g, pt(0, 0, len), b0, b1, C);
  }
  EDGE_ON = e0; MAT = m0;
}
/* un volume à huit pans, effilé du bas (y0) vers le haut (y1) : un torse arrondi, sans arêtes vives.
   hx, hz : demi-largeur et demi-profondeur en bas ; tx, tz : en haut ; k : la part de chaque coin abattu */
function taper8(g, y0, y1, hx, hz, tx, tz, col, k, zc){
  const C = typeof col === 'string' ? hexRGB(col) : col, e0 = EDGE_ON; EDGE_ON = 0; k = k == null ? 0.38 : k; zc = zc || 0;
  const ring = (y, a, b) => [[a, -b * (1 - k)], [a, b * (1 - k)], [a * (1 - k), b], [-a * (1 - k), b], [-a, b * (1 - k)], [-a, -b * (1 - k)], [-a * (1 - k), -b], [a * (1 - k), -b]].map(([x, z]) => [x, y, z + zc]);
  const B = ring(y0, hx, hz), T = ring(y1, tx, tz);
  for(let i = 0; i < 8; i++){ const j = (i + 1) % 8; quad(g, B[i], T[i], T[j], B[j], C); }
  const ct = [0, y1, zc], cb = [0, y0, zc];
  for(let i = 0; i < 8; i++){ const j = (i + 1) % 8; tri(g, ct, T[j], T[i], C); tri(g, cb, B[i], B[j], C); }
  EDGE_ON = e0;
}
/* ellipsoïde bas en polygones */
function ball(g, x, y, z, rx, ry, rz, col, seg){
  seg = Math.max(5, Math.round((seg || 8) * GEO_K)); const st = Math.max(4, Math.round(seg * .7)); const C = typeof col === 'string' ? hexRGB(col) : col, m0 = MAT, e0 = EDGE_ON; EDGE_ON = 0;
  const P = (i, j) => { const th = i / seg * Math.PI * 2, ph = j / st * Math.PI; return [x + Math.sin(ph)*Math.cos(th)*rx, y + Math.cos(ph)*ry, z + Math.sin(ph)*Math.sin(th)*rz]; };
  if(MAT === 0 && isGreen(C)) MAT = 2;
  if(MAT === 0 && isLight(C, 2 * Math.max(rx, ry, rz))) MAT = 5;
  for(let j = 0; j < st; j++) for(let i = 0; i < seg; i++){
    const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
    if(j === 0) tri(g, a, c, d, C); else if(j === st - 1) tri(g, a, b, c, C); else quad(g, a, b, c, d, C);
  }
  EDGE_ON = e0; MAT = m0;
}

/* normales lissées (moyenne des faces qui se touchent) : elles servent au contour
   des personnages, qui reste fermé aux angles au lieu de se fendre */
function smoothNormals(g){
  const acc = new Map(), key = i => Math.round(g.p[i] * 2000) + ',' + Math.round(g.p[i + 1] * 2000) + ',' + Math.round(g.p[i + 2] * 2000);
  for(let i = 0; i < g.p.length; i += 3){ const k = key(i), a = acc.get(k) || [0, 0, 0]; a[0] += g.n[i]; a[1] += g.n[i + 1]; a[2] += g.n[i + 2]; acc.set(k, a); }
  g.s = [];
  for(let i = 0; i < g.p.length; i += 3){ const a = acc.get(key(i)), l = Math.hypot(a[0], a[1], a[2]) || 1; g.s.push(a[0] / l, a[1] / l, a[2] / l); }
  return g;
}

/* ---------- Rendu ----------
   Trois petits programmes : la scène (éclairage simple, brume au loin, contour des personnages),
   le ciel (un dégradé, plus un léger vignettage), et la foule (des silhouettes plates
   tournées vers la caméra, comme les tribunes des jeux de foot). */
/* le noir et blanc, le même partout (décor, personnages, ciel, fenêtres, foule, photo, textures) : comme une pellicule.
   Un filtre jaune léger (la peau s'éclaircit, le ciel fonce un peu), plus de contraste et une courbe en S (des noirs profonds
   sans être bouchés, des blancs propres), et un grain très fin, fixe ; sans aucune couleur (quelques opérations par pixel, rien de plus) */
const BW_GLSL = `vec3 bwTone(vec3 c, float lift){
  float l = dot(c, vec3(0.36, 0.54, 0.10)) * (1.0 + lift) + lift * 0.4;
  l = clamp((l - 0.4) * 1.38 + 0.44, 0.0, 1.0);
  l = mix(l, l * l * (3.0 - 2.0 * l), 0.6);
  l = 0.035 + l * 0.94 + (fract(52.9829 * fract(dot(floor(gl_FragCoord.xy), vec2(0.06711, 0.00584)))) - 0.5) * 0.022;
  return vec3(l);
}
`;
const GL = {
  gl:null, prog:null, loc:{}, meshes:[],
  init(canvas){
    const gl = canvas.getContext('webgl', { antialias:true, alpha:false, preserveDrawingBuffer:false, powerPreference:'low-power' }) || canvas.getContext('experimental-webgl');
    if(!gl) return false;
    this.gl = gl;
    const vs = `attribute vec3 aP; attribute vec3 aN; attribute vec3 aC; attribute vec3 aS; attribute float aM;
      uniform mat4 uVP; uniform mat4 uM; uniform vec3 uCol; uniform float uVC; uniform float uOut; uniform mediump vec3 uEye;
      varying vec3 vN; varying vec3 vC; varying vec3 vW; varying vec3 vN2; varying float vM;
      void main(){
        vM = aM; vN = mat3(uM) * aN; vN2 = mat3(uM) * aC; vC = uVC > 1.5 ? uCol * aC : mix(uCol, aC, uVC);
        vec4 w = uM * vec4(aP, 1.0);
        // le contour : la forme regonflée un tout petit peu, d'une épaisseur constante à l'écran
        if(uOut > 0.0) w.xyz += normalize(mat3(uM) * aS) * uOut * distance(w.xyz, uEye);
        vW = w.xyz; gl_Position = uVP * w;
      }`;
    const fs = `precision mediump float;
      uniform vec3 uL; uniform float uFlat; uniform float uA; uniform vec3 uTint; uniform float uTintK;
      uniform vec3 uEye; uniform vec3 uT[6]; uniform float uNT; uniform float uX; uniform float uChar;
      uniform vec3 uFogC; uniform vec2 uFog; uniform float uBW; uniform float uGlass; uniform float uLine; uniform float uFloor;
      uniform vec3 uGrade; uniform vec3 uGradeC;
      varying vec3 vN; varying vec3 vC; varying vec3 vW; varying vec3 vN2; varying float vM;
      /* le décor qui se trouve entre la caméra et un personnage (un tube autour de la ligne de vue) */
      bool inTube(vec3 t){ vec3 d = t - uEye; float k = dot(vW - uEye, d) / dot(d, d); return k > 0.0 && k < 0.9 && distance(vW, uEye + d * k) < 0.42; }
      ${BW_GLSL}
      vec3 bw(vec3 c, float lift){ return bwTone(c, lift); }
      void main(){
        if(uX > 0.5){
          bool hid = false;
          for(int i = 0; i < 6; i++){ if(float(i) >= uNT) break; if(inTube(uT[i])){ hid = true; break; } }
          if(uX < 1.5 && hid) discard;        // passe opaque : on laisse un trou…
          if(uX > 1.5 && !hid) discard;       // …que la passe transparente remplit à moitié
        }
        if(distance(vW, uEye) < 0.3 && uX > 0.5) discard;   // rien ne colle à l'objectif
        // une arête dont les deux faces tournent le dos à la caméra (un mur vu de derrière) ne se trace pas
        if(uLine > 0.5){ vec3 v = uEye - vW; if(dot(vN, v) < 0.0 && dot(vN2, v) < 0.0) discard; }
        if(uFlat > 0.5){ float la = uLine > 0.5 ? (1.0 - smoothstep(10.0, 42.0, distance(vW, uEye))) * (vM < 0.5 ? 1.7 : vM < 1.5 ? 0.75 : 1.0) : 1.0; gl_FragColor = vec4(uBW > 0.5 && uFlat < 1.5 ? bw(vC, 0.0) : vC, uA * la); return; }
        vec3 n = normalize(vN);
        if(!gl_FrontFacing) n = -n;
        float d = max(dot(n, uL), 0.0), h = 0.5 + 0.5 * n.y, f = max(dot(n, normalize(uEye - vW)), 0.0);
        vec3 c, base = mix(vC, uTint, uTintK);
        if(uChar > 0.5){
          // personnages : sans ombres (trop lourdes pour un vieux PC), on lit le visage autrement :
          // une petite lumière portée par la caméra, une lumière chaude, et un liseré clair sur les contours
          c = base * (0.32 + 0.15 * h + 0.36 * d * vec3(1.05, 1.0, 0.94) + 0.3 * f);
          float lc = dot(c, vec3(0.299, 0.587, 0.114)); c = mix(vec3(lc), c, 1.22);                  // des couleurs un peu plus franches que le décor
          c += vec3(0.3, 0.3, 0.31) * pow(1.0 - f, 2.2) * (0.5 + 0.5 * h);                       // un liseré clair tout autour : le personnage se détache du fond
          c *= mix(0.84, 1.0, smoothstep(0.0, 0.85, vW.y - uFloor));                              // un peu plus sombre près du sol : il touche le décor
        } else {
          // une lumière du ciel un peu froide par-dessus, un rebond chaud par-dessous, et un soleil doux
          // qui « enveloppe » les formes (aussi léger à calculer que l'ancien éclairage)
          float w = max((dot(n, uL) + 0.35) / 1.35, 0.0);
          vec3 amb = mix(vec3(0.37, 0.35, 0.33), vec3(0.5, 0.52, 0.56), h);
          c = base * (amb + 0.56 * w * vec3(1.05, 1.0, 0.92));
          // le pied des murs et des meubles, plus sombre (à chaque étage) : les objets « touchent » le sol
          if(abs(n.y) < 0.5) c *= mix(0.66, 1.0, smoothstep(0.0, 0.6, vW.y - uFloor));
          if(n.y < -0.5) c *= 0.93;                                                                // les plafonds, un peu plus sombres que les murs
          c = mix(c, c * c * (3.0 - 2.0 * c), 0.22);   // un peu plus de relief dans les valeurs
          // le décor reste un peu en retrait (couleurs un peu plus douces, un voile très léger au loin) : les personnages ressortent
          // chaque matière a sa lumière : l'architecture reste en retrait, les meubles et objets ressortent un peu,
          // le feuillage vit, le métal brille, les carrosseries ont un vernis (quelques calculs, sans texture ni ombre)
          float mt = floor(vM + 0.5), ls = dot(c, vec3(0.299, 0.587, 0.114)), night = clamp((0.9 - dot(uGrade, vec3(0.3333))) * 3.0, 0.0, 1.0);
          vec3 hv = normalize(uL + normalize(uEye - vW)); float nh = max(dot(n, hv), 0.0);
          if(mt < 0.5){ c = mix(c, vec3(ls), 0.06); c = mix(c, c * c * (3.0 - 2.0 * c), 0.25); c += vec3(0.07) * pow(nh, 24.0); }   // objets, meubles : des couleurs et des valeurs un peu plus franches
          else if(mt < 1.5){ c = mix(c, vec3(ls), 0.32); c = mix(c, vec3(0.5, 0.51, 0.53), 0.09); }             // architecture
          else if(mt < 2.5){                                                                                     // feuillage
            float v = sin(vW.x * 1.9 + vW.y * 0.7) * sin(vW.z * 1.6 - vW.y * 0.9);
            c = base * (amb * 1.08 + 0.62 * w * vec3(1.02, 1.04, 0.86)) * (1.0 + 0.1 * v); c = mix(vec3(ls), c, 1.12);
          }
          else if(mt < 3.5){ c = base * (0.45 + 0.35 * d) + vec3(0.6) * pow(nh, 40.0) + vec3(0.16) * pow(1.0 - f, 3.0); }   // métal
          else if(mt < 4.5){ c = mix(c, vec3(ls), 0.06); c += vec3(0.42) * pow(nh, 60.0); c = mix(c, vec3(0.78, 0.84, 0.9) * (0.65 + 0.35 * n.y), pow(1.0 - f, 4.0) * 0.32); }   // carrosserie
          else if(mt < 5.5) c = mix(c, base * 1.18 + vec3(0.08, 0.06, 0.0), night);                           // une lampe : allumée la nuit
          else if(mt < 6.5){ if(night > 0.05){                                                                  // une fenêtre d'immeuble : la nuit, certaines sont éclairées
            float r = fract(sin(dot(floor(vW.xz * 0.9) + floor(vW.y * 0.7) * 7.0, vec2(12.9898, 78.233))) * 43758.5);
            if(r > 0.5) c = mix(c, vec3(1.0, 0.82, 0.52) * (0.85 + 0.3 * r), night);
          } }
          else if(mt < 7.5){                                                                                    // une fenêtre allumée la nuit, toute entière : une lumière chaude qui varie d'une fenêtre à l'autre (plus froide dans un train)
            float t = fract(dot(vC, vec3(37.1, 17.3, 5.7)));
            vec3 L = mix(vec3(1.0, 0.78, 0.48), vec3(1.0, 0.88, 0.68), t) * (0.8 + 0.2 * t);
            L = mix(L, vec3(0.68, 0.72, 0.74), step(0.5, dot(vC, vec3(0.3333))));
            c = mix(c, L, night);
          }
          if(uFog.x < 300.0) c = mix(c, uFogC, smoothstep(3.0, 26.0, distance(vW, uEye)) * 0.14);
          // dedans aussi, un peu de profondeur : le fond d'une grande pièce recule à peine, le premier plan ressort
          else c *= 1.0 - 0.1 * smoothstep(6.0, 18.0, distance(vW, uEye));
          // la lumière vient d'en haut : le sol reste un peu dans l'ombre, ce qui s'élève (plateaux, assises, comptoirs) s'éclaire.
          // Un meuble se détache ainsi du sol, même de la même couleur.
          if(mt < 1.5) c *= mix(0.9, 1.1, smoothstep(0.02, 1.0, vW.y - uFloor));
          // les bords des meubles et des objets, vus de biais, s'assombrissent un peu : chaque forme se détache de ce qui est derrière
          if(mt < 0.5 || (mt > 2.5 && mt < 4.5)) c *= 1.0 - 0.4 * pow(1.0 - f, 2.5); else if(mt < 1.5) c *= 1.0 - 0.1 * pow(1.0 - f, 3.0);
        }
        if(uChar > 0.5) c *= uGradeC; else if(floor(vM + 0.5) < 4.5 || floor(vM + 0.5) > 7.5) c *= uGrade; else c *= mix(uGrade, vec3(1.0), clamp((0.9 - dot(uGrade, vec3(0.3333))) * 3.0, 0.0, 1.0));   // le moment de la journée : jour, fin de journée, nuit (les personnages restent lisibles, les lampes et les fenêtres s'allument)
        float a = uA;
        if(uGlass > 0.5){ c = mix(vC, vec3(0.92, 0.96, 1.0), pow(1.0 - f, 2.0) * 0.6); a = uA + pow(1.0 - f, 3.0) * 0.35; }
        if(uFog.x < 300.0) c = mix(c, uFogC, clamp((distance(vW, uEye) - uFog.x) / (uFog.y - uFog.x), 0.0, 1.0) * 0.82);   // la brume au loin (dehors)
        if(uBW > 0.5) c = bw(c, uChar > 0.5 ? 0.06 : -0.06);
        gl_FragColor = vec4(c, a);
      }`;
    const prog = (v, f) => {
      const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); return s; };
      const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, v)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, f)); gl.linkProgram(p);
      if(!gl.getProgramParameter(p, gl.LINK_STATUS)){ try{ console.warn('Raging Board shader', gl.getProgramInfoLog(p)); }catch(e){} return null; }
      return p;
    };
    const p = prog(vs, fs); if(!p) return false;
    gl.useProgram(p); this.prog = p;
    ['aP', 'aN', 'aC', 'aS', 'aM'].forEach(k => this.loc[k] = gl.getAttribLocation(p, k));
    ['uVP', 'uM', 'uCol', 'uVC', 'uL', 'uFlat', 'uA', 'uTint', 'uTintK', 'uEye', 'uT', 'uNT', 'uX', 'uChar', 'uOut', 'uFogC', 'uFog', 'uBW', 'uGlass', 'uLine', 'uFloor', 'uGrade', 'uGradeC'].forEach(k => this.loc[k] = gl.getUniformLocation(p, k));
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE);
    const l = [0.45, 0.82, 0.36], n = Math.hypot(...l); gl.uniform3f(this.loc.uL, l[0]/n, l[1]/n, l[2]/n);
    // le ciel et le vignettage : un seul triangle qui couvre l'écran
    this.win = prog(`attribute vec3 aP; uniform mat4 uVP; varying vec3 vW; void main(){ vW = aP; gl_Position = uVP * vec4(aP, 1.0); }`,
      `precision mediump float; uniform vec3 uEye; uniform vec3 uWinT; uniform vec3 uWinH; uniform float uView; uniform vec3 uGrade; uniform float uBW; varying vec3 vW;
      ${BW_GLSL}
      float hash(float x){ return fract(sin(x * 91.17) * 43758.55); }
      /* ce qu'on voit par une fenêtre : le ciel, une ligne d'immeubles (ou de collines et d'arbres) au loin, le sol */
      /* une rangée d'immeubles vue de loin : k bâtiments par radian, des hauteurs variées, des annexes plus basses,
         parfois un édicule sur le toit, et des fenêtres en grille (le jour elles reflètent le ciel, la nuit certaines s'allument) */
      vec4 row(float az, float el, float k, float seed, float h0, float h1, float night){
        float x = az * k + seed, cell = floor(x), f = fract(x), r = hash(cell + seed), e = 0.05 + 0.07 * hash(cell + 3.1);
        float top = h0 + (h1 - h0) * r * r;
        if(f < e || f > 1.0 - e) top *= 0.72;
        if(hash(cell + 9.0) > 0.62 && f > 0.42 && f < 0.56) top += 0.014;
        if(el > top) return vec4(0.0);
        vec3 tone = mix(vec3(0.56, 0.57, 0.61), vec3(0.72, 0.66, 0.57), hash(cell + 7.0));
        tone = mix(tone, vec3(0.44, 0.46, 0.52), step(0.72, hash(cell + 13.0)));
        float u = f * (5.0 + floor(4.0 * hash(cell + 2.0))), v = el * 9.5 * k;
        float win = step(0.22, fract(u)) * step(fract(u), 0.78) * step(0.3, fract(v)) * step(fract(v), 0.82) * step(e, f) * step(f, 1.0 - e) * step(0.012, top - el);
        float lit = step(0.58, hash(floor(u) + floor(v) * 13.0 + cell * 7.0));
        vec3 b = tone * (0.92 + 0.08 * step(0.5, fract(f * 2.0 + 0.25))) * mix(1.0, 0.2, night);
        vec3 wc = mix(mix(tone * 0.7, mix(uWinH, uWinT, 0.5) * 0.9, 0.4) * mix(1.0, 0.18, night), vec3(1.0, 0.83, 0.52), lit * night);
        return vec4(mix(b, wc, win), 1.0);
      }
      vec3 outside(vec3 d, float night){
        float el = d.y, az = atan(d.x, d.z);
        vec3 c = mix(uWinH, uWinT, smoothstep(-0.02, 0.55, el));
        c += vec3(0.1, 0.07, 0.02) * (1.0 - night) * pow(max(dot(d, normalize(vec3(0.45, 0.22, 0.55))), 0.0), 10.0);   // un peu de soleil
        if(uView < 0.5){                                                                   // la ville : un fond voilé, puis des immeubles plus proches
          vec4 far = row(az, el, 13.0, 0.0, 0.03, 0.11, night), near = row(az, el, 4.5, 50.0, 0.05, 0.3, night);
          if(far.a > 0.0) c = mix(far.rgb, uWinH * mix(1.0, 0.35, night), 0.45);
          if(near.a > 0.0) c = near.rgb;
          // sous l'horizon : le pied des façades d'en face, leur trottoir, puis la rue et son marquage
          if(el < -0.07){ float m = mix(1.0, 0.35, night);
            if(el > -0.11) c = vec3(0.62, 0.61, 0.58) * m;                                                     // le trottoir
            else if(el > -0.115) c = vec3(0.4) * m;                                                           // la bordure
            else { c = mix(vec3(0.33, 0.34, 0.37), vec3(0.24, 0.25, 0.27), smoothstep(-0.12, -0.6, el)) * m;   // la chaussée
              if(abs(el + 0.24) < 0.008 && fract(az * 6.0) < 0.5) c = vec3(0.8, 0.78, 0.7) * m; } }          // la ligne au milieu
        } else {                                                                           // la campagne : des collines voilées, une ligne d'arbres, les prés
          float far = 0.05 + 0.03 * sin(az * 2.0 + 1.3) + 0.015 * sin(az * 5.1);
          float hill = 0.025 + 0.02 * sin(az * 3.0) + 0.012 * sin(az * 7.3 + 1.0);
          float tc = floor(az * 40.0), tree = 0.03 + 0.05 * hash(tc) * step(0.4, hash(tc + 5.0)), tf = fract(az * 40.0);
          float crown = tree * sqrt(max(0.0, 1.0 - (2.0 * tf - 1.0) * (2.0 * tf - 1.0)));
          if(el < far) c = mix(vec3(0.5, 0.6, 0.5), uWinH, 0.45) * mix(1.0, 0.3, night);
          if(el < hill + crown && el > hill - 0.005) c = mix(vec3(0.3, 0.42, 0.28), vec3(0.38, 0.5, 0.33), hash(tc)) * mix(1.0, 0.3, night);
          if(el < hill) c = mix(vec3(0.45, 0.56, 0.37), vec3(0.4, 0.5, 0.33), step(0.5, fract(az * 9.0))) * mix(1.0, 0.3, night);
          if(el < 0.0) c = mix(vec3(0.42, 0.53, 0.34), vec3(0.32, 0.42, 0.27), smoothstep(0.0, -0.4, el)) * mix(1.0, 0.3, night);
        }
        return c;
      }
      void main(){
        float night = clamp((0.9 - dot(uGrade, vec3(0.3333))) * 3.0, 0.0, 1.0);
        vec3 c = mix(outside(normalize(vW - uEye), night), vec3(0.86, 0.92, 0.98), 0.12) * mix(vec3(1.0), uGrade, 0.5);
        if(uBW > 0.5) c = bwTone(c, -0.02);
        gl_FragColor = vec4(c, 1.0);
      }`);
    if(this.win){ const K = this.winLoc = {}; ['aP', 'uVP', 'uEye', 'uWinT', 'uWinH', 'uView', 'uGrade', 'uBW'].forEach(k => K[k] = k[0] === 'a' ? gl.getAttribLocation(this.win, k) : gl.getUniformLocation(this.win, k)); }
    this.sky = prog(`attribute vec2 aQ; uniform mat4 uInv; varying vec3 vD; varying vec2 vQ;
        void main(){ vQ = aQ; vec4 a = uInv * vec4(aQ, -1.0, 1.0), b = uInv * vec4(aQ, 1.0, 1.0); vD = b.xyz / b.w - a.xyz / a.w; gl_Position = vec4(aQ, 0.999, 1.0); }`,
      `precision mediump float; uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uLow; uniform float uMode; uniform float uBW; uniform vec2 uAsp;
        ${BW_GLSL}
        varying vec3 vD; varying vec2 vQ;
        void main(){
          if(uMode > 0.5){ float r = length(vQ * uAsp); gl_FragColor = vec4(0.0, 0.0, 0.0, smoothstep(0.62, 1.42, r) * 0.32); return; }
          vec3 d = normalize(vD);
          vec3 c = d.y > 0.0 ? mix(uHor, uTop, pow(clamp(d.y * 1.7, 0.0, 1.0), 0.75)) : mix(uHor, uLow, clamp(-d.y * 4.0, 0.0, 1.0));
          if(uBW > 0.5) c = bwTone(c, 0.0);
          gl_FragColor = vec4(c, 1.0);
        }`);
    if(this.sky){
      this.skyLoc = {}; ['aQ'].forEach(k => this.skyLoc[k] = gl.getAttribLocation(this.sky, k));
      ['uInv', 'uTop', 'uHor', 'uLow', 'uMode', 'uBW', 'uAsp'].forEach(k => this.skyLoc[k] = gl.getUniformLocation(this.sky, k));
      this.skyBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.skyBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    }
    // la foule : des silhouettes découpées dans une petite image, toujours tournées vers la caméra
    this.crowd = prog(`attribute vec3 aCen; attribute vec2 aCor; attribute vec2 aUV; attribute vec4 aTint;
        uniform mat4 uVP; uniform vec3 uRight; uniform vec3 uEye;
        varying vec2 vUV; varying vec4 vT; varying float vDist; varying float vY;
        void main(){ vec3 p = aCen + uRight * aCor.x + vec3(0.0, aCor.y, 0.0); vUV = aUV; vT = aTint; vDist = distance(p, uEye); vY = aCor.y; gl_Position = uVP * vec4(p, 1.0); }`,
      `precision mediump float; uniform sampler2D uTex; uniform vec3 uFogC; uniform vec2 uFog; uniform float uBW; uniform vec3 uGrade;
        ${BW_GLSL}
        varying vec2 vUV; varying vec4 vT; varying float vDist; varying float vY;
        void main(){
          vec4 t = texture2D(uTex, vUV); if(t.a < 0.5) discard;
          vec3 c = vec3(t.r);
          c = mix(c, c * vT.rgb * 1.5, t.g);                                           // les habits, à la couleur de chacun
          c = mix(c, c * mix(vec3(1.0, 0.86, 0.74), vec3(0.62, 0.45, 0.34), vT.a), t.b);  // la peau
          c *= (0.78 + 0.22 * clamp(vY / 1.2, 0.0, 1.0)) * uGrade;
          c = mix(c, uFogC, clamp((vDist - uFog.x) / (uFog.y - uFog.x), 0.0, 1.0) * 0.82);
          if(uBW > 0.5) c = bwTone(c, -0.06);
          gl_FragColor = vec4(c, 1.0);
        }`);
    if(this.crowd){
      this.crLoc = {}; ['aCen', 'aCor', 'aUV', 'aTint'].forEach(k => this.crLoc[k] = gl.getAttribLocation(this.crowd, k));
      ['uVP', 'uRight', 'uEye', 'uTex', 'uFogC', 'uFog', 'uBW', 'uGrade'].forEach(k => this.crLoc[k] = gl.getUniformLocation(this.crowd, k));
      this.crTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.crTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, crowdAtlas());
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    gl.useProgram(p);
    this.env = { fogC:[0.86, 0.88, 0.9], fog:[400, 500], bw:false };
    // pour la sélection au clic : une petite image hors écran où chaque partie du corps a sa couleur
    this.pickFB = gl.createFramebuffer(); this.pickTex = gl.createTexture(); this.pickRB = gl.createRenderbuffer(); this.pickSize = [0, 0];
    return true;
  },
  mesh(g){
    const gl = this.gl, mk = a => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(a), gl.STATIC_DRAW); return b; };
    const m = { p:mk(g.p), n:mk(g.n), c:mk(g.c), s:g.s ? mk(g.s) : null, m:g.m && g.m.length * 3 === g.p.length && g.m.some(v => v) ? mk(g.m) : null, count:g.p.length / 3 };
    this.meshes.push(m); return m;
  },
  /* avant de passer à un autre programme : on débranche les tableaux de la scène */
  off(){ const gl = this.gl, L = this.loc; ['aP', 'aN', 'aC', 'aS', 'aM'].forEach(k => L[k] >= 0 && gl.disableVertexAttribArray(L[k])); },
  free(m){ if(!m) return; const gl = this.gl; [m.p, m.n, m.c, m.s, m.m].forEach(b => b && gl.deleteBuffer(b)); this.meshes = this.meshes.filter(x => x !== m); },
  bind(m){
    const gl = this.gl, L = this.loc;
    gl.bindBuffer(gl.ARRAY_BUFFER, m.p); gl.enableVertexAttribArray(L.aP); gl.vertexAttribPointer(L.aP, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, m.n); gl.enableVertexAttribArray(L.aN); gl.vertexAttribPointer(L.aN, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, m.c); gl.enableVertexAttribArray(L.aC); gl.vertexAttribPointer(L.aC, 3, gl.FLOAT, false, 0, 0);
    if(L.aS >= 0){ gl.bindBuffer(gl.ARRAY_BUFFER, m.s || m.n); gl.enableVertexAttribArray(L.aS); gl.vertexAttribPointer(L.aS, 3, gl.FLOAT, false, 0, 0); }
    if(L.aM >= 0){ if(m.m){ gl.bindBuffer(gl.ARRAY_BUFFER, m.m); gl.enableVertexAttribArray(L.aM); gl.vertexAttribPointer(L.aM, 1, gl.FLOAT, false, 0, 0); } else { gl.disableVertexAttribArray(L.aM); gl.vertexAttrib1f(L.aM, 0); } }
  },
  /* o : { m:matrice, col:[r,g,b], vc:utiliser les couleurs des sommets, flat, a:opacité, tint, tintK,
           out:épaisseur du contour, glass:vitre, raw:couleur exacte (sélection) } */
  draw(mesh, o){
    const gl = this.gl, L = this.loc;
    this.bind(mesh);
    gl.uniformMatrix4fv(L.uM, false, o.m || M4.ident());
    const c = o.col || [1, 1, 1]; gl.uniform3f(L.uCol, c[0], c[1], c[2]);
    gl.uniform1f(L.uVC, o.mul ? 2 : o.vc ? 1 : 0); gl.uniform1f(L.uChar, o.char ? 1 : 0); gl.uniform1f(L.uFlat, o.raw ? 2 : o.flat ? 1 : 0); gl.uniform1f(L.uA, o.a == null ? 1 : o.a);
    const t = o.tint || [0, 0, 0]; gl.uniform3f(L.uTint, t[0], t[1], t[2]); gl.uniform1f(L.uTintK, o.tintK || 0);
    gl.uniform1f(L.uX, o.x || 0); gl.uniform1f(L.uOut, o.out || 0); gl.uniform1f(L.uGlass, o.glass ? 1 : 0);
    gl.uniform1f(L.uLine, o.lines ? 1 : 0); gl.uniform1f(L.uFloor, o.floor || 0);
    gl.drawArrays(o.lines ? gl.LINES : gl.TRIANGLES, 0, mesh.count);
  },
  /* env : { fogC, fog:[début, fin], bw:noir et blanc } */
  begin(w, h, vp, bg, env){
    const gl = this.gl, L = this.loc, E = this.env = Object.assign({ fogC:bg, fog:[400, 500], bw:false }, env || {});
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.target || null); gl.viewport(0, 0, w, h);
    gl.clearColor(bg[0], bg[1], bg[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(L.uVP, false, vp);
    gl.uniform3f(L.uFogC, E.fogC[0], E.fogC[1], E.fogC[2]); gl.uniform2f(L.uFog, E.fog[0], E.fog[1]); gl.uniform1f(L.uBW, E.bw ? 1 : 0);
    const g = E.grade || [1, 1, 1], gc = E.gradeC || [1, 1, 1]; gl.uniform3f(L.uGrade, g[0], g[1], g[2]); gl.uniform3f(L.uGradeC, gc[0], gc[1], gc[2]);
  },
  /* « Ma photo » : la photo du vrai lieu, en fond, qui remplit l'image (recadrée sans être déformée) */
  photoTex(url, onload){
    const gl = this.gl; this._ph = this._ph || new Map();
    const hit = this._ph.get(url); if(hit) return hit.ready ? hit : null;
    const o = { tex:gl.createTexture(), ready:false, ar:1 }; this._ph.set(url, o);
    const im = new Image();
    im.onload = () => { gl.bindTexture(gl.TEXTURE_2D, o.tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      o.ar = im.width / im.height; o.ready = true; if(onload) onload(); };
    im.src = url;
    return null;
  },
  drawPhoto(o, aspect){
    const gl = this.gl;
    if(!this.phProg){
      this.phProg = (() => { const sh = (t, src) => { const x = gl.createShader(t); gl.shaderSource(x, src); gl.compileShader(x); return x; };
        const p = gl.createProgram();
        gl.attachShader(p, sh(gl.VERTEX_SHADER, 'attribute vec2 aQ; uniform vec2 uS; varying vec2 vU; void main(){ vU = (aQ * uS) * 0.5 + 0.5; gl_Position = vec4(aQ, 0.999, 1.0); }'));
        gl.attachShader(p, sh(gl.FRAGMENT_SHADER, 'precision mediump float; uniform sampler2D uT; uniform float uBW; uniform vec3 uGr; varying vec2 vU; ' + BW_GLSL + ' void main(){ vec3 c = texture2D(uT, vU).rgb * uGr; if(uBW > 0.5) c = bwTone(c, 0.0); gl_FragColor = vec4(c, 1.0); }'));
        gl.linkProgram(p); return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null; })();
      if(!this.phProg) return;
      this.phLoc = { aQ:gl.getAttribLocation(this.phProg, 'aQ'), uS:gl.getUniformLocation(this.phProg, 'uS'), uT:gl.getUniformLocation(this.phProg, 'uT'), uBW:gl.getUniformLocation(this.phProg, 'uBW'), uGr:gl.getUniformLocation(this.phProg, 'uGr') };
    }
    const K = this.phLoc, E = this.env || {}, g = E.grade || [1, 1, 1];
    // recadrer comme « cover » : on garde tout le cadre rempli, sans déformer la photo
    const r = o.ar / aspect, sc = r > 1 ? [1 / r, 1] : [1, r];
    this.off(); gl.useProgram(this.phProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.skyBuf); gl.enableVertexAttribArray(K.aQ); gl.vertexAttribPointer(K.aQ, 2, gl.FLOAT, false, 0, 0);
    gl.uniform2f(K.uS, sc[0], sc[1]); gl.uniform1f(K.uBW, E.bw ? 1 : 0); gl.uniform3f(K.uGr, g[0], g[1], g[2]);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, o.tex); gl.uniform1i(K.uT, 0);
    gl.disable(gl.DEPTH_TEST); gl.depthMask(false); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
    gl.disableVertexAttribArray(K.aQ); gl.useProgram(this.prog);
  },
  /* « Mon lieu » : les textures (un motif dessiné, ou l'image de l'utilisateur), répétées, avec leurs mipmaps
     (de loin, le motif se fond au lieu de scintiller) */
  texOf(key, src){
    const gl = this.gl; this._tx = this._tx || new Map();
    if(this._tx.has(key)) return this._tx.get(key);
    if(!src) return null;
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const an = this._an === undefined ? (this._an = gl.getExtension('EXT_texture_filter_anisotropic') || gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') || null) : this._an;
    if(an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(4, gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
    this._tx.set(key, t); return t;
  },
  texMesh(m){ const gl = this.gl, mk = a => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(a), gl.STATIC_DRAW); return b; };
    return { p:mk(m.p), u:mk(m.u), l:mk(m.l), count:m.p.length / 3 }; },
  /* list : [{ key, mesh }] ; raw : en noir (l'image de sélection) */
  drawTex(list, vp, eye, raw){
    const gl = this.gl; if(!list.length) return;
    if(this.txProg === undefined){
      const sh = (t, src) => { const x = gl.createShader(t); gl.shaderSource(x, src); gl.compileShader(x); return x; };
      const p = gl.createProgram();
      gl.attachShader(p, sh(gl.VERTEX_SHADER, 'attribute vec3 aP; attribute vec2 aU; attribute vec2 aL; uniform mat4 uVP; varying vec2 vU; varying vec2 vL; varying vec3 vW; void main(){ vU = aU; vL = aL; vW = aP; gl_Position = uVP * vec4(aP, 1.0); }'));
      gl.attachShader(p, sh(gl.FRAGMENT_SHADER, `precision mediump float; uniform sampler2D uT; uniform vec3 uEye; uniform vec3 uFogC; uniform vec2 uFog; uniform float uBW; uniform vec3 uGrade; uniform float uRaw;
        ${BW_GLSL}
        varying vec2 vU; varying vec2 vL; varying vec3 vW;
        void main(){
          if(uRaw > 0.5){ gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); return; }
          vec3 c = texture2D(uT, vU).rgb * vL.x;
          if(vL.y > 0.5) c *= mix(0.66, 1.0, smoothstep(0.0, 0.6, vW.y));
          c = mix(c, c * c * (3.0 - 2.0 * c), 0.22) * uGrade;
          float d = distance(vW, uEye);
          if(uFog.x < 300.0) c = mix(c, uFogC, clamp((d - uFog.x) / (uFog.y - uFog.x), 0.0, 1.0) * 0.82); else c *= 1.0 - 0.1 * smoothstep(6.0, 18.0, d);
          if(uBW > 0.5) c = bwTone(c, -0.06);
          gl_FragColor = vec4(c, 1.0);
        }`));
      gl.linkProgram(p); this.txProg = gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
      if(this.txProg){ const K = this.txLoc = {}; ['aP', 'aU', 'aL'].forEach(k => K[k] = gl.getAttribLocation(p, k)); ['uVP', 'uT', 'uEye', 'uFogC', 'uFog', 'uBW', 'uGrade', 'uRaw'].forEach(k => K[k] = gl.getUniformLocation(p, k)); }
    }
    if(!this.txProg) return;
    const K = this.txLoc, E = this.env || {}, g = E.grade || [1, 1, 1], fc = E.fogC || [0.86, 0.88, 0.9], fg = E.fog || [400, 500];
    this.off(); gl.useProgram(this.txProg);
    gl.uniformMatrix4fv(K.uVP, false, vp); gl.uniform3f(K.uEye, eye[0], eye[1], eye[2]); gl.uniform3f(K.uFogC, fc[0], fc[1], fc[2]); gl.uniform2f(K.uFog, fg[0], fg[1]);
    gl.uniform1f(K.uBW, E.bw ? 1 : 0); gl.uniform3f(K.uGrade, g[0], g[1], g[2]); gl.uniform1f(K.uRaw, raw ? 1 : 0); gl.uniform1i(K.uT, 0); gl.activeTexture(gl.TEXTURE0);
    ['aP', 'aU', 'aL'].forEach(k => gl.enableVertexAttribArray(K[k]));
    list.forEach(({ tex, mesh }) => { if(!tex) return; gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.p); gl.vertexAttribPointer(K.aP, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.u); gl.vertexAttribPointer(K.aU, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.l); gl.vertexAttribPointer(K.aL, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, mesh.count); });
    ['aP', 'aU', 'aL'].forEach(k => gl.disableVertexAttribArray(K[k])); gl.useProgram(this.prog);
  },
  /* le ciel en dégradé (mode 0), ou le vignettage par-dessus l'image (mode 1) */
  drawPanes(meshes, vp, eye){
    const gl = this.gl, K = this.winLoc, E = this.env; if(!this.win || !meshes.length) return;
    this.off(); gl.useProgram(this.win);
    gl.uniformMatrix4fv(K.uVP, false, vp); gl.uniform3f(K.uEye, eye[0], eye[1], eye[2]);
    const wt = E.winT || [0.53, 0.69, 0.83], wh = E.winH || [0.86, 0.9, 0.93], g = E.grade || [1, 1, 1];
    gl.uniform3f(K.uWinT, wt[0], wt[1], wt[2]); gl.uniform3f(K.uWinH, wh[0], wh[1], wh[2]); gl.uniform1f(K.uView, E.view === 'nature' ? 1 : 0);
    gl.uniform3f(K.uGrade, g[0], g[1], g[2]); gl.uniform1f(K.uBW, E.bw ? 1 : 0);
    gl.enableVertexAttribArray(K.aP);
    meshes.forEach(m => { gl.bindBuffer(gl.ARRAY_BUFFER, m.p); gl.vertexAttribPointer(K.aP, 3, gl.FLOAT, false, 0, 0); gl.drawArrays(gl.TRIANGLES, 0, m.count); });
    gl.disableVertexAttribArray(K.aP); gl.useProgram(this.prog);
  },
  drawSky(vp, top, hor, low, mode, aspect){
    const gl = this.gl, K = this.skyLoc; if(!this.sky) return;
    this.off(); gl.useProgram(this.sky);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.skyBuf); gl.enableVertexAttribArray(K.aQ); gl.vertexAttribPointer(K.aQ, 2, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(K.uInv, false, M4.invert(vp));
    gl.uniform3f(K.uTop, top[0], top[1], top[2]); gl.uniform3f(K.uHor, hor[0], hor[1], hor[2]); gl.uniform3f(K.uLow, low[0], low[1], low[2]);
    gl.uniform1f(K.uMode, mode || 0); gl.uniform1f(K.uBW, this.env.bw ? 1 : 0); gl.uniform2f(K.uAsp, 1, 1 / (aspect || 1.78) * 1.25);
    gl.disable(gl.DEPTH_TEST); gl.depthMask(false);
    if(mode){ gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if(mode) gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
    gl.disableVertexAttribArray(K.aQ);
    gl.useProgram(this.prog);
  },
  /* une foule : un seul tableau de sommets, 11 nombres par sommet (centre, coin, image, teinte + peau) */
  crowdMesh(data){ const gl = this.gl, b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW); return { b, count:data.length / 11 }; },
  freeCrowd(m){ if(m) this.gl.deleteBuffer(m.b); },
  drawCrowds(list, vp, eye, right){
    const gl = this.gl, K = this.crLoc; if(!this.crowd || !list.length) return;
    this.off(); gl.useProgram(this.crowd);
    gl.uniformMatrix4fv(K.uVP, false, vp); gl.uniform3f(K.uRight, right[0], right[1], right[2]); gl.uniform3f(K.uEye, eye[0], eye[1], eye[2]);
    const E = this.env; gl.uniform3f(K.uFogC, E.fogC[0], E.fogC[1], E.fogC[2]); gl.uniform2f(K.uFog, E.fog[0], E.fog[1]); gl.uniform1f(K.uBW, E.bw ? 1 : 0);
    const g = E.grade || [1, 1, 1]; gl.uniform3f(K.uGrade, g[0], g[1], g[2]);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.crTex); gl.uniform1i(K.uTex, 0);
    gl.disable(gl.CULL_FACE);
    for(const m of list){
      gl.bindBuffer(gl.ARRAY_BUFFER, m.b);
      const st = 11 * 4, at = (k, n, off) => { if(K[k] < 0) return; gl.enableVertexAttribArray(K[k]); gl.vertexAttribPointer(K[k], n, gl.FLOAT, false, st, off * 4); };
      at('aCen', 3, 0); at('aCor', 2, 3); at('aUV', 2, 5); at('aTint', 4, 7);
      gl.drawArrays(gl.TRIANGLES, 0, m.count);
    }
    ['aCen', 'aCor', 'aUV', 'aTint'].forEach(k => K[k] >= 0 && gl.disableVertexAttribArray(K[k]));
    gl.enable(gl.CULL_FACE);
    gl.useProgram(this.prog);
  },
  /* la position de la caméra, et les personnages à ne jamais laisser cacher par le décor (six au plus) */
  view(eye, targets){
    const gl = this.gl, L = this.loc, t = (targets || []).slice(0, 6), a = [];
    gl.uniform3f(L.uEye, eye[0], eye[1], eye[2]);
    for(let i = 0; i < 6; i++){ const v = t[i] || [0, -99, 0]; a.push(v[0], v[1], v[2]); }
    gl.uniform3fv(L.uT, a); gl.uniform1f(L.uNT, t.length);
  },
  /* image de sélection, à la taille réduite de l'écran (assez pour viser une main) */
  beginPick(w, h, vp){
    const gl = this.gl;
    if(this.pickSize[0] !== w || this.pickSize[1] !== h){
      gl.bindTexture(gl.TEXTURE_2D, this.pickTex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindRenderbuffer(gl.RENDERBUFFER, this.pickRB); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.pickFB);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.pickTex, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, this.pickRB);
      this.pickSize = [w, h];
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.pickFB); gl.viewport(0, 0, w, h);
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(this.loc.uVP, false, vp);
    gl.uniform1f(this.loc.uBW, 0); gl.uniform2f(this.loc.uFog, 400, 500);
  },
  /* dessiner hors de l'écran (vignettes, petites images) : l'image principale ne change pas de taille,
     rien ne clignote et rien n'est recalculé pour rien */
  renderTo(w, h, fn){
    const gl = this.gl, O = this.offRT || (this.offRT = { fb:gl.createFramebuffer(), tex:gl.createTexture(), rb:gl.createRenderbuffer(), w:0, h:0 });
    if(O.w !== w || O.h !== h){
      gl.bindTexture(gl.TEXTURE_2D, O.tex); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.bindRenderbuffer(gl.RENDERBUFFER, O.rb); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_STENCIL, w, h);   // 24 bits de profondeur : pas de sols qui se battent au loin
      gl.bindFramebuffer(gl.FRAMEBUFFER, O.fb);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, O.tex, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, O.rb);
      O.w = w; O.h = h;
    }
    this.target = O.fb;
    try{ fn(); } finally{ this.target = null; }
    gl.bindFramebuffer(gl.FRAMEBUFFER, O.fb);
    const px = new Uint8Array(w * h * 4); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return px;
  },
  readPick(x, y, keep){
    const gl = this.gl, px = new Uint8Array(4);
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    if(!keep) gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return px[0] + px[1] * 256;
  },
};

/* la petite image de la foule : huit silhouettes de 64 × 128 points.
   Rouge = la lumière, vert = où sont les habits (teintés), bleu = où est la peau. */
function crowdAtlas(){
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 128;
  const x = cv.getContext('2d');
  const CL = 'rgb(175,255,0)', CLd = 'rgb(135,255,0)', SK = 'rgb(215,0,255)', HR = 'rgb(62,0,0)', PT = 'rgb(88,0,0)', SH = 'rgb(40,0,0)';
  const rr = (px, py, w, h, r, c) => { x.fillStyle = c; x.beginPath(); x.moveTo(px + r, py); x.arcTo(px + w, py, px + w, py + h, r); x.arcTo(px + w, py + h, px, py + h, r); x.arcTo(px, py + h, px, py, r); x.arcTo(px, py, px + w, py, r); x.fill(); };
  const el = (cx, cy, rx, ry, c) => { x.fillStyle = c; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fill(); };
  // o : décalage de la case ; arms : 'down' | 'up' | 'clap' | 'one' ; legs : true si on voit les jambes ; k : taille
  const person = (o, arms, opt) => {
    const k = opt.k || 1, cx = o + 32, top = 128 - 124 * k, s = v => v * k;
    const hy = top + s(12), sy = top + s(26), hipY = top + s(66);
    if(opt.legs !== false){ rr(cx - s(11), hipY - s(2), s(10), s(56), s(4), PT); rr(cx + s(1), hipY - s(2), s(10), s(56), s(4), PT); rr(cx - s(13), top + s(118), s(12), s(6), s(3), SH); rr(cx + s(1), top + s(118), s(12), s(6), s(3), SH); }
    if(opt.dress) { x.fillStyle = CL; x.beginPath(); x.moveTo(cx - s(13), sy); x.lineTo(cx + s(13), sy); x.lineTo(cx + s(19), top + s(92)); x.lineTo(cx - s(19), top + s(92)); x.fill(); }
    rr(cx - s(15), sy, s(30), s(44), s(8), CL); rr(cx + s(3), sy + s(2), s(12), s(40), s(6), CLd);
    const arm = (side, mode) => {
      const ax = cx + side * s(17);
      if(mode === 'up'){ rr(ax - s(4.5), sy - s(30), s(9), s(36), s(4.5), CL); el(ax, sy - s(32), s(5), s(5), SK); }
      else if(mode === 'clap'){ rr(ax - s(4.5), sy + s(2), s(9), s(22), s(4.5), CL); x.save(); x.translate(ax, sy + s(22)); x.rotate(-side * 0.9); rr(-s(4), -s(2), s(8), s(18), s(4), CL); el(0, s(18), s(4.5), s(4.5), SK); x.restore(); }
      else { rr(ax - s(4.5), sy + s(2), s(9), s(42), s(4.5), CL); el(ax, sy + s(47), s(4.6), s(5.5), SK); }
    };
    arm(-1, arms === 'one' ? 'down' : arms); arm(1, arms === 'one' ? 'up' : arms);
    rr(cx - s(4.5), hy + s(8), s(9), s(8), s(3), SK);
    el(cx, hy, s(10), s(12), SK);
    if(opt.hair === 'long'){ x.fillStyle = HR; x.beginPath(); x.ellipse(cx, hy - s(3), s(11.5), s(10.5), 0, Math.PI, 0); x.fill(); rr(cx - s(12), hy - s(4), s(5), s(22), s(2.5), HR); rr(cx + s(7), hy - s(4), s(5), s(22), s(2.5), HR); }
    else if(opt.hair === 'cap'){ x.fillStyle = CLd; x.beginPath(); x.ellipse(cx, hy - s(4), s(11), s(9), 0, Math.PI, 0); x.fill(); rr(cx - s(2), hy - s(6), s(16), s(4), s(2), CLd); }
    else if(opt.hair !== 'none'){ x.fillStyle = HR; x.beginPath(); x.ellipse(cx, hy - s(4), s(10.5), s(9), 0, Math.PI, 0); x.fill(); }
  };
  person(0, 'down', {});
  person(64, 'up', { hair:'long' });
  person(128, 'clap', {});
  person(192, 'down', { hair:'long', dress:true, legs:true });
  person(256, 'one', { hair:'cap' });
  person(320, 'down', { k:0.62, hair:'long' });
  person(384, 'up', { hair:'none' });
  person(448, 'clap', { hair:'long' });
  return cv;
}

/* profil extrudé : un contour convexe dans le plan (z, y), étiré en largeur de x0 à x1.
   Sert aux carrosseries (capot et pare-brise inclinés), aux toits en pente, aux marches. */
function prism(g, pts, x0, x1, col){
  const C = typeof col === 'string' ? hexRGB(col) : col, n = pts.length;
  const cz = pts.reduce((a, p) => a + p[0], 0) / n, cy = pts.reduce((a, p) => a + p[1], 0) / n;
  const P = (p, x) => [x, p[1], p[0]];
  // chaque face est tournée vers l'extérieur (on vérifie le sens de sa normale)
  const put = (a, b, c, out) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const nx = uy*vz - uz*vy, ny = uz*vx - ux*vz, nz = ux*vy - uy*vx;
    if(nx*out[0] + ny*out[1] + nz*out[2] < 0) tri(g, a, c, b, C); else tri(g, a, b, c, C);
  };
  for(let i = 1; i < n - 1; i++){ put(P(pts[0], x1), P(pts[i], x1), P(pts[i + 1], x1), [1, 0, 0]); put(P(pts[0], x0), P(pts[i], x0), P(pts[i + 1], x0), [-1, 0, 0]); }
  for(let i = 0; i < n; i++){
    const a = pts[i], b = pts[(i + 1) % n], out = [0, (a[1] + b[1]) / 2 - cy, (a[0] + b[0]) / 2 - cz];
    put(P(a, x0), P(b, x0), P(b, x1), out); put(P(a, x0), P(b, x1), P(a, x1), out);
  }
}
/* le même profil, mais dessiné de face : un contour dans le plan (x, y), étiré en profondeur de z0 à z1
   (un torse plus large aux épaules qu'à la taille, par exemple) */
function prismXY(g, pts, z0, z1, col){
  const from = g.p.length;
  prism(g, pts, z0, z1, col);
  // on échange x et z, puis on remet chaque triangle dans le bon sens (l'échange retourne les faces)
  for(let i = from; i < g.p.length; i += 3){ const a = g.p[i]; g.p[i] = g.p[i + 2]; g.p[i + 2] = a; const n = g.n[i]; g.n[i] = g.n[i + 2]; g.n[i + 2] = n; }
  for(let i = from; i < g.p.length; i += 9) for(const A of [g.p, g.n, g.c]) for(let k = 0; k < 3; k++){ const t = A[i + 3 + k]; A[i + 3 + k] = A[i + 6 + k]; A[i + 6 + k] = t; }
}

/* les arêtes vives d'un décor (là où deux faces font un angle, et les bords des faces seules) :
   tracées comme un trait de crayon fin, elles donnent au décor le même dessin que les personnages */
function edgeLines(g, minDeg){
  const cosT = Math.cos((minDeg || 28) * D2R), map = new Map(), K = v => Math.round(v * 500);
  const key = (i, j) => { const a = K(g.p[i]) + ',' + K(g.p[i + 1]) + ',' + K(g.p[i + 2]), b = K(g.p[j]) + ',' + K(g.p[j + 1]) + ',' + K(g.p[j + 2]); return a < b ? a + '|' + b : b + '|' + a; };
  for(let t = 0; t < g.p.length / 9; t++){
    if(g.e && !g.e[t]) continue;
    const i0 = t * 9, n = [g.n[i0], g.n[i0 + 1], g.n[i0 + 2]];
    for(const [a, b] of [[0, 3], [3, 6], [6, 0]]){
      const k = key(i0 + a, i0 + b); let r = map.get(k);
      if(!r){ r = { i:i0 + a, j:i0 + b, n:[], m:9 }; map.set(k, r); }
      r.n.push(n); if(g.m && g.m.length) r.m = Math.min(r.m, g.m[t * 3] || 0);
    }
  }
  const out = { p:[], n:[], c:[], m:[] };
  for(const r of map.values()){
    let keep = r.n.length === 1;
    if(!keep) for(let x = 0; x < r.n.length && !keep; x++) for(let y = x + 1; y < r.n.length; y++){ const a = r.n[x], b = r.n[y]; if(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] < cosT){ keep = true; break; } }
    if(!keep) continue;
    out.p.push(g.p[r.i], g.p[r.i + 1], g.p[r.i + 2], g.p[r.j], g.p[r.j + 1], g.p[r.j + 2]);
    const a = r.n[0], b = r.n[r.n.length - 1];
    out.n.push(a[0], a[1], a[2], a[0], a[1], a[2]); out.c.push(b[0], b[1], b[2], b[0], b[1], b[2]);   // les normales des deux faces
    const mt = r.m === 9 ? 0 : r.m; out.m.push(mt, mt);                                              // la matière : un meuble garde un trait plus net qu'un mur
  }
  return out;
}
