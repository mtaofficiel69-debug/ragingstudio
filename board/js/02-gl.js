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
function geo(){ return { p:[], n:[], c:[], e:[] }; }
/* EDGE_ON : les arêtes de cette forme seront-elles tracées (meubles, murs) ? Pas pour les formes rondes. */
let EDGE_ON = 1;
function tri(g, a, b, c, col){
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  let nx = uy*vz - uz*vy, ny = uz*vx - ux*vz, nz = ux*vy - uy*vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
  for(const v of [a, b, c]){ g.p.push(v[0], v[1], v[2]); g.n.push(nx, ny, nz); g.c.push(col[0], col[1], col[2]); }
  if(g.e) g.e.push(EDGE_ON);
}
const quad = (g, a, b, c, d, col) => { tri(g, a, b, c, col); tri(g, a, c, d, col); };
/* pavé centré en (x,y,z), tourné de ry autour de la verticale ; faces tournées vers l'extérieur */
/* les pavés assez grands d'un décor (murs épais, meubles) sont aussi notés comme obstacles pour la caméra */
let COLL = null;
const collOf = g => { let a = COLL.get(g); if(!a) COLL.set(g, a = { b:[], w:[], p:[] }); return a; };
function box(g, x, y, z, w, h, d, col, ry){
  if(COLL && Math.max(w, h, d) >= 0.4 && h >= 0.03 && !(h < 0.25 && w > 2 && d > 2)) collOf(g).b.push([x, y, z, w / 2, h / 2, d / 2, ry || 0]);
  const e0 = EDGE_ON; if(Math.min(w, h, d) < 0.012) EDGE_ON = 0;   // les bandes peintes au sol : pas de trait
  const hx = w/2, hy = h/2, hz = d/2, c = Math.cos(ry || 0), s = Math.sin(ry || 0);
  const P = (a, b, e) => [x + a*c + e*s, y + b, z - a*s + e*c];
  const v = [P(-hx,-hy,-hz), P(hx,-hy,-hz), P(hx,hy,-hz), P(-hx,hy,-hz), P(-hx,-hy,hz), P(hx,-hy,hz), P(hx,hy,hz), P(-hx,hy,hz)];
  const C = typeof col === 'string' ? hexRGB(col) : col;
  quad(g, v[4], v[5], v[6], v[7], C); quad(g, v[1], v[0], v[3], v[2], C);
  quad(g, v[5], v[1], v[2], v[6], C); quad(g, v[0], v[4], v[7], v[3], C);
  quad(g, v[7], v[6], v[2], v[3], C); quad(g, v[0], v[1], v[5], v[4], C);
  EDGE_ON = e0;
}
/* mur d'un seul côté : on le voit de face, il disparaît vu de dos (la caméra peut passer derrière) */
function wall(g, a, b, h, col, y0){
  if(COLL && h >= 0.4 && Math.hypot(b[0] - a[0], b[1] - a[1]) >= 0.4) collOf(g).w.push([a[0], a[1], b[0], b[1], y0 || 0, (y0 || 0) + h]);
  const C = typeof col === 'string' ? hexRGB(col) : col, y = y0 || 0;
  quad(g, [a[0], y, a[1]], [b[0], y, b[1]], [b[0], y + h, b[1]], [a[0], y + h, a[1]], C);
}
/* sol ou plafond, vu du dessus (sol) ou du dessous (plafond) */
function floor(g, x0, z0, x1, z1, y, col, down){
  const C = typeof col === 'string' ? hexRGB(col) : col;
  if(down) quad(g, [x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1], C);
  else quad(g, [x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], C);
}
/* cylindre le long d'un axe ('y' vers le bas pour les membres, 'x' pour les roues) */
/* GEO_K : le niveau de détail des formes rondes (plus bas pour les contours, plus légers à dessiner) */
let GEO_K = 1;
function cyl(g, x, y, z, r1, r2, len, col, seg, axis){
  // les cylindres assez grands (tables rondes, colonnes, roues, troncs) sont aussi des obstacles pour la caméra
  if(COLL && Math.max(2 * Math.max(r1, r2), len) >= 0.4){ const r = Math.max(r1, r2);
    collOf(g).b.push(axis === 'x' ? [x + len / 2, y, z, len / 2, r, r, 0] : axis === 'z' ? [x, y, z + len / 2, r, r, len / 2, 0] : [x, y - len / 2, z, r, len / 2, r, 0]); }
  seg = Math.max(5, Math.round((seg || 8) * GEO_K)); const C = typeof col === 'string' ? hexRGB(col) : col, e0 = EDGE_ON; EDGE_ON = 0;
  const pt = (r, t, k) => { const a = Math.cos(t)*r, b = Math.sin(t)*r;
    if(axis === 'x') return [x + k, y + a, z + b];
    if(axis === 'z') return [x + a, y + b, z + k];
    return [x + a, y - k, z + b]; };
  for(let i = 0; i < seg; i++){
    const t0 = i / seg * Math.PI * 2, t1 = (i + 1) / seg * Math.PI * 2;
    const a0 = pt(r1, t0, 0), a1 = pt(r1, t1, 0), b0 = pt(r2, t0, len), b1 = pt(r2, t1, len);
    quad(g, a0, a1, b1, b0, C); tri(g, pt(0, 0, 0), a1, a0, C); tri(g, pt(0, 0, len), b0, b1, C);
  }
  EDGE_ON = e0;
}
/* ellipsoïde bas en polygones */
function ball(g, x, y, z, rx, ry, rz, col, seg){
  seg = Math.max(5, Math.round((seg || 8) * GEO_K)); const st = Math.max(4, Math.round(seg * .7)); const C = typeof col === 'string' ? hexRGB(col) : col, e0 = EDGE_ON; EDGE_ON = 0;
  const P = (i, j) => { const th = i / seg * Math.PI * 2, ph = j / st * Math.PI; return [x + Math.sin(ph)*Math.cos(th)*rx, y + Math.cos(ph)*ry, z + Math.sin(ph)*Math.sin(th)*rz]; };
  for(let j = 0; j < st; j++) for(let i = 0; i < seg; i++){
    const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
    if(j === 0) tri(g, a, c, d, C); else if(j === st - 1) tri(g, a, b, c, C); else quad(g, a, b, c, d, C);
  }
  EDGE_ON = e0;
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
const GL = {
  gl:null, prog:null, loc:{}, meshes:[],
  init(canvas){
    const gl = canvas.getContext('webgl', { antialias:true, alpha:false, preserveDrawingBuffer:false, powerPreference:'low-power' }) || canvas.getContext('experimental-webgl');
    if(!gl) return false;
    this.gl = gl;
    const vs = `attribute vec3 aP; attribute vec3 aN; attribute vec3 aC; attribute vec3 aS;
      uniform mat4 uVP; uniform mat4 uM; uniform vec3 uCol; uniform float uVC; uniform float uOut; uniform mediump vec3 uEye;
      varying vec3 vN; varying vec3 vC; varying vec3 vW; varying vec3 vN2;
      void main(){
        vN = mat3(uM) * aN; vN2 = mat3(uM) * aC; vC = uVC > 1.5 ? uCol * aC : mix(uCol, aC, uVC);
        vec4 w = uM * vec4(aP, 1.0);
        // le contour : la forme regonflée un tout petit peu, d'une épaisseur constante à l'écran
        if(uOut > 0.0) w.xyz += normalize(mat3(uM) * aS) * uOut * distance(w.xyz, uEye);
        vW = w.xyz; gl_Position = uVP * w;
      }`;
    const fs = `precision mediump float;
      uniform vec3 uL; uniform float uFlat; uniform float uA; uniform vec3 uTint; uniform float uTintK;
      uniform vec3 uEye; uniform vec3 uT[6]; uniform float uNT; uniform float uX; uniform float uChar;
      uniform vec3 uFogC; uniform vec2 uFog; uniform float uBW; uniform float uGlass; uniform float uLine; uniform float uFloor;
      varying vec3 vN; varying vec3 vC; varying vec3 vW; varying vec3 vN2;
      /* le décor qui se trouve entre la caméra et un personnage (un tube autour de la ligne de vue) */
      bool inTube(vec3 t){ vec3 d = t - uEye; float k = dot(vW - uEye, d) / dot(d, d); return k > 0.0 && k < 0.9 && distance(vW, uEye + d * k) < 0.42; }
      vec3 bw(vec3 c, float lift){ float l = dot(c, vec3(0.299, 0.587, 0.114)); return vec3(l * (1.0 + lift) + lift * 0.4); }
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
        if(uFlat > 0.5){ float la = uLine > 0.5 ? 1.0 - smoothstep(10.0, 42.0, distance(vW, uEye)) : 1.0; gl_FragColor = vec4(uBW > 0.5 && uFlat < 1.5 ? bw(vC, 0.0) : vC, uA * la); return; }
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
        } else {
          // une lumière du ciel un peu froide par-dessus, un rebond chaud par-dessous, et un soleil doux
          // qui « enveloppe » les formes (aussi léger à calculer que l'ancien éclairage)
          float w = max((dot(n, uL) + 0.35) / 1.35, 0.0);
          vec3 amb = mix(vec3(0.37, 0.35, 0.33), vec3(0.5, 0.52, 0.56), h);
          c = base * (amb + 0.56 * w * vec3(1.05, 1.0, 0.92));
          // le pied des murs et des meubles, plus sombre (à chaque étage) : les objets « touchent » le sol
          if(abs(n.y) < 0.5) c *= mix(0.66, 1.0, smoothstep(0.0, 0.6, vW.y - uFloor));
          c = mix(c, c * c * (3.0 - 2.0 * c), 0.22);   // un peu plus de relief dans les valeurs
          // le décor reste un peu en retrait (couleurs un peu plus douces, un voile très léger au loin) : les personnages ressortent
          float ls = dot(c, vec3(0.299, 0.587, 0.114)); c = mix(c, vec3(ls), 0.3); c = mix(c, vec3(0.5, 0.51, 0.53), 0.07);
          if(uFog.x < 300.0) c = mix(c, uFogC, smoothstep(3.0, 26.0, distance(vW, uEye)) * 0.14);
        }
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
    ['aP', 'aN', 'aC', 'aS'].forEach(k => this.loc[k] = gl.getAttribLocation(p, k));
    ['uVP', 'uM', 'uCol', 'uVC', 'uL', 'uFlat', 'uA', 'uTint', 'uTintK', 'uEye', 'uT', 'uNT', 'uX', 'uChar', 'uOut', 'uFogC', 'uFog', 'uBW', 'uGlass', 'uLine', 'uFloor'].forEach(k => this.loc[k] = gl.getUniformLocation(p, k));
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE);
    const l = [0.45, 0.82, 0.36], n = Math.hypot(...l); gl.uniform3f(this.loc.uL, l[0]/n, l[1]/n, l[2]/n);
    // le ciel et le vignettage : un seul triangle qui couvre l'écran
    this.sky = prog(`attribute vec2 aQ; uniform mat4 uInv; varying vec3 vD; varying vec2 vQ;
        void main(){ vQ = aQ; vec4 a = uInv * vec4(aQ, -1.0, 1.0), b = uInv * vec4(aQ, 1.0, 1.0); vD = b.xyz / b.w - a.xyz / a.w; gl_Position = vec4(aQ, 0.999, 1.0); }`,
      `precision mediump float; uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uLow; uniform float uMode; uniform float uBW; uniform vec2 uAsp;
        varying vec3 vD; varying vec2 vQ;
        void main(){
          if(uMode > 0.5){ float r = length(vQ * uAsp); gl_FragColor = vec4(0.0, 0.0, 0.0, smoothstep(0.62, 1.42, r) * 0.32); return; }
          vec3 d = normalize(vD);
          vec3 c = d.y > 0.0 ? mix(uHor, uTop, pow(clamp(d.y * 1.7, 0.0, 1.0), 0.75)) : mix(uHor, uLow, clamp(-d.y * 4.0, 0.0, 1.0));
          if(uBW > 0.5){ float l = dot(c, vec3(0.299, 0.587, 0.114)); c = vec3(l); }
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
      `precision mediump float; uniform sampler2D uTex; uniform vec3 uFogC; uniform vec2 uFog; uniform float uBW;
        varying vec2 vUV; varying vec4 vT; varying float vDist; varying float vY;
        void main(){
          vec4 t = texture2D(uTex, vUV); if(t.a < 0.5) discard;
          vec3 c = vec3(t.r);
          c = mix(c, c * vT.rgb * 1.5, t.g);                                           // les habits, à la couleur de chacun
          c = mix(c, c * mix(vec3(1.0, 0.86, 0.74), vec3(0.62, 0.45, 0.34), vT.a), t.b);  // la peau
          c *= 0.78 + 0.22 * clamp(vY / 1.2, 0.0, 1.0);
          c = mix(c, uFogC, clamp((vDist - uFog.x) / (uFog.y - uFog.x), 0.0, 1.0) * 0.82);
          if(uBW > 0.5){ float l = dot(c, vec3(0.299, 0.587, 0.114)); c = vec3(l * 0.94); }
          gl_FragColor = vec4(c, 1.0);
        }`);
    if(this.crowd){
      this.crLoc = {}; ['aCen', 'aCor', 'aUV', 'aTint'].forEach(k => this.crLoc[k] = gl.getAttribLocation(this.crowd, k));
      ['uVP', 'uRight', 'uEye', 'uTex', 'uFogC', 'uFog', 'uBW'].forEach(k => this.crLoc[k] = gl.getUniformLocation(this.crowd, k));
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
    const m = { p:mk(g.p), n:mk(g.n), c:mk(g.c), s:g.s ? mk(g.s) : null, count:g.p.length / 3 };
    this.meshes.push(m); return m;
  },
  /* avant de passer à un autre programme : on débranche les tableaux de la scène */
  off(){ const gl = this.gl, L = this.loc; ['aP', 'aN', 'aC', 'aS'].forEach(k => L[k] >= 0 && gl.disableVertexAttribArray(L[k])); },
  free(m){ if(!m) return; const gl = this.gl; [m.p, m.n, m.c, m.s].forEach(b => b && gl.deleteBuffer(b)); this.meshes = this.meshes.filter(x => x !== m); },
  bind(m){
    const gl = this.gl, L = this.loc;
    gl.bindBuffer(gl.ARRAY_BUFFER, m.p); gl.enableVertexAttribArray(L.aP); gl.vertexAttribPointer(L.aP, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, m.n); gl.enableVertexAttribArray(L.aN); gl.vertexAttribPointer(L.aN, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, m.c); gl.enableVertexAttribArray(L.aC); gl.vertexAttribPointer(L.aC, 3, gl.FLOAT, false, 0, 0);
    if(L.aS >= 0){ gl.bindBuffer(gl.ARRAY_BUFFER, m.s || m.n); gl.enableVertexAttribArray(L.aS); gl.vertexAttribPointer(L.aS, 3, gl.FLOAT, false, 0, 0); }
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
  },
  /* le ciel en dégradé (mode 0), ou le vignettage par-dessus l'image (mode 1) */
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
      if(!r){ r = { i:i0 + a, j:i0 + b, n:[] }; map.set(k, r); }
      r.n.push(n);
    }
  }
  const out = { p:[], n:[], c:[] };
  for(const r of map.values()){
    let keep = r.n.length === 1;
    if(!keep) for(let x = 0; x < r.n.length && !keep; x++) for(let y = x + 1; y < r.n.length; y++){ const a = r.n[x], b = r.n[y]; if(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] < cosT){ keep = true; break; } }
    if(!keep) continue;
    out.p.push(g.p[r.i], g.p[r.i + 1], g.p[r.i + 2], g.p[r.j], g.p[r.j + 1], g.p[r.j + 2]);
    const a = r.n[0], b = r.n[r.n.length - 1];
    out.n.push(a[0], a[1], a[2], a[0], a[1], a[2]); out.c.push(b[0], b[1], b[2], b[0], b[1], b[2]);   // les normales des deux faces
  }
  return out;
}
