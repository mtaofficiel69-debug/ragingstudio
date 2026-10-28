/* =====================================================================
   RAGING 3D — MOTEUR
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
function geo(){ return { p:[], n:[], c:[] }; }
function tri(g, a, b, c, col){
  const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
  let nx = uy*vz - uz*vy, ny = uz*vx - ux*vz, nz = ux*vy - uy*vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
  for(const v of [a, b, c]){ g.p.push(v[0], v[1], v[2]); g.n.push(nx, ny, nz); g.c.push(col[0], col[1], col[2]); }
}
const quad = (g, a, b, c, d, col) => { tri(g, a, b, c, col); tri(g, a, c, d, col); };
/* pavé centré en (x,y,z), tourné de ry autour de la verticale ; faces tournées vers l'extérieur */
function box(g, x, y, z, w, h, d, col, ry){
  const hx = w/2, hy = h/2, hz = d/2, c = Math.cos(ry || 0), s = Math.sin(ry || 0);
  const P = (a, b, e) => [x + a*c + e*s, y + b, z - a*s + e*c];
  const v = [P(-hx,-hy,-hz), P(hx,-hy,-hz), P(hx,hy,-hz), P(-hx,hy,-hz), P(-hx,-hy,hz), P(hx,-hy,hz), P(hx,hy,hz), P(-hx,hy,hz)];
  const C = typeof col === 'string' ? hexRGB(col) : col;
  quad(g, v[4], v[5], v[6], v[7], C); quad(g, v[1], v[0], v[3], v[2], C);
  quad(g, v[5], v[1], v[2], v[6], C); quad(g, v[0], v[4], v[7], v[3], C);
  quad(g, v[7], v[6], v[2], v[3], C); quad(g, v[0], v[1], v[5], v[4], C);
}
/* mur d'un seul côté : on le voit de face, il disparaît vu de dos (la caméra peut passer derrière) */
function wall(g, a, b, h, col, y0){
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
function cyl(g, x, y, z, r1, r2, len, col, seg, axis){
  seg = seg || 8; const C = typeof col === 'string' ? hexRGB(col) : col;
  const pt = (r, t, k) => { const a = Math.cos(t)*r, b = Math.sin(t)*r;
    if(axis === 'x') return [x + k, y + a, z + b];
    if(axis === 'z') return [x + a, y + b, z + k];
    return [x + a, y - k, z + b]; };
  for(let i = 0; i < seg; i++){
    const t0 = i / seg * Math.PI * 2, t1 = (i + 1) / seg * Math.PI * 2;
    const a0 = pt(r1, t0, 0), a1 = pt(r1, t1, 0), b0 = pt(r2, t0, len), b1 = pt(r2, t1, len);
    quad(g, a0, a1, b1, b0, C); tri(g, pt(0, 0, 0), a1, a0, C); tri(g, pt(0, 0, len), b0, b1, C);
  }
}
/* ellipsoïde bas en polygones */
function ball(g, x, y, z, rx, ry, rz, col, seg){
  seg = seg || 8; const st = Math.max(4, Math.round(seg * .7)); const C = typeof col === 'string' ? hexRGB(col) : col;
  const P = (i, j) => { const th = i / seg * Math.PI * 2, ph = j / st * Math.PI; return [x + Math.sin(ph)*Math.cos(th)*rx, y + Math.cos(ph)*ry, z + Math.sin(ph)*Math.sin(th)*rz]; };
  for(let j = 0; j < st; j++) for(let i = 0; i < seg; i++){
    const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
    if(j === 0) tri(g, a, c, d, C); else if(j === st - 1) tri(g, a, b, c, C); else quad(g, a, b, c, d, C);
  }
}

/* ---------- Rendu ---------- */
const GL = {
  gl:null, prog:null, loc:{}, meshes:[],
  init(canvas){
    const gl = canvas.getContext('webgl', { antialias:true, alpha:false, preserveDrawingBuffer:false, powerPreference:'low-power' }) || canvas.getContext('experimental-webgl');
    if(!gl) return false;
    this.gl = gl;
    const vs = `attribute vec3 aP; attribute vec3 aN; attribute vec3 aC;
      uniform mat4 uVP; uniform mat4 uM; uniform vec3 uCol; uniform float uVC;
      varying vec3 vN; varying vec3 vC; varying vec3 vW;
      void main(){ vN = mat3(uM) * aN; vC = uVC > 1.5 ? uCol * aC : mix(uCol, aC, uVC); vec4 w = uM * vec4(aP, 1.0); vW = w.xyz; gl_Position = uVP * w; }`;
    const fs = `precision mediump float;
      uniform vec3 uL; uniform float uFlat; uniform float uA; uniform vec3 uTint; uniform float uTintK;
      uniform vec3 uEye; uniform vec3 uT0; uniform vec3 uT1; uniform float uNT; uniform float uX; uniform float uChar;
      varying vec3 vN; varying vec3 vC; varying vec3 vW;
      /* le décor qui se trouve entre la caméra et un personnage (un tube autour de la ligne de vue) */
      bool inTube(vec3 t){ vec3 d = t - uEye; float k = dot(vW - uEye, d) / dot(d, d); return k > 0.0 && k < 0.9 && distance(vW, uEye + d * k) < 0.42; }
      void main(){
        if(uX > 0.5){
          bool hid = (uNT > 0.5 && inTube(uT0)) || (uNT > 1.5 && inTube(uT1));
          if(uX < 1.5 && hid) discard;        // passe opaque : on laisse un trou…
          if(uX > 1.5 && !hid) discard;       // …que la passe transparente remplit à moitié
        }
        if(distance(vW, uEye) < 0.3 && uX > 0.5) discard;   // rien ne colle à l'objectif
        if(uFlat > 0.5){ gl_FragColor = vec4(vC, uA); return; }
        vec3 n = normalize(vN);
        float d = max(dot(n, uL), 0.0), h = 0.5 + 0.5 * n.y;
        vec3 c;
        if(uChar > 0.5){
          // personnages : sans ombres (trop lourdes pour un vieux PC), on lit le visage autrement :
          // une petite lumière portée par la caméra, et un liseré clair sur les contours
          float f = max(dot(n, normalize(uEye - vW)), 0.0);
          c = mix(vC, uTint, uTintK) * (0.3 + 0.14 * h + 0.36 * d + 0.32 * f) + vec3(0.13) * pow(1.0 - f, 3.0);
        } else c = mix(vC, uTint, uTintK) * (0.42 + 0.2 * h + 0.5 * d);
        gl_FragColor = vec4(c, uA);
      }`;
    const sh = (t, src) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    const p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
    if(!gl.getProgramParameter(p, gl.LINK_STATUS)) return false;
    gl.useProgram(p); this.prog = p;
    ['aP', 'aN', 'aC'].forEach(k => this.loc[k] = gl.getAttribLocation(p, k));
    ['uVP', 'uM', 'uCol', 'uVC', 'uL', 'uFlat', 'uA', 'uTint', 'uTintK', 'uEye', 'uT0', 'uT1', 'uNT', 'uX', 'uChar'].forEach(k => this.loc[k] = gl.getUniformLocation(p, k));
    gl.enable(gl.DEPTH_TEST); gl.enable(gl.CULL_FACE);
    const l = [0.45, 0.82, 0.36], n = Math.hypot(...l); gl.uniform3f(this.loc.uL, l[0]/n, l[1]/n, l[2]/n);
    // pour la sélection au clic : une petite image hors écran où chaque partie du corps a sa couleur
    this.pickFB = gl.createFramebuffer(); this.pickTex = gl.createTexture(); this.pickRB = gl.createRenderbuffer(); this.pickSize = [0, 0];
    return true;
  },
  mesh(g){
    const gl = this.gl, mk = a => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(a), gl.STATIC_DRAW); return b; };
    const m = { p:mk(g.p), n:mk(g.n), c:mk(g.c), count:g.p.length / 3 };
    this.meshes.push(m); return m;
  },
  free(m){ if(!m) return; const gl = this.gl; [m.p, m.n, m.c].forEach(b => gl.deleteBuffer(b)); this.meshes = this.meshes.filter(x => x !== m); },
  bind(m){
    const gl = this.gl, L = this.loc;
    gl.bindBuffer(gl.ARRAY_BUFFER, m.p); gl.enableVertexAttribArray(L.aP); gl.vertexAttribPointer(L.aP, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, m.n); gl.enableVertexAttribArray(L.aN); gl.vertexAttribPointer(L.aN, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, m.c); gl.enableVertexAttribArray(L.aC); gl.vertexAttribPointer(L.aC, 3, gl.FLOAT, false, 0, 0);
  },
  /* o : { m:matrice, col:[r,g,b], vc:utiliser les couleurs des sommets, flat, a:opacité, tint, tintK } */
  draw(mesh, o){
    const gl = this.gl, L = this.loc;
    this.bind(mesh);
    gl.uniformMatrix4fv(L.uM, false, o.m || M4.ident());
    const c = o.col || [1, 1, 1]; gl.uniform3f(L.uCol, c[0], c[1], c[2]);
    gl.uniform1f(L.uVC, o.mul ? 2 : o.vc ? 1 : 0); gl.uniform1f(L.uChar, o.char ? 1 : 0); gl.uniform1f(L.uFlat, o.flat ? 1 : 0); gl.uniform1f(L.uA, o.a == null ? 1 : o.a);
    const t = o.tint || [0, 0, 0]; gl.uniform3f(L.uTint, t[0], t[1], t[2]); gl.uniform1f(L.uTintK, o.tintK || 0);
    gl.uniform1f(L.uX, o.x || 0);
    gl.drawArrays(gl.TRIANGLES, 0, mesh.count);
  },
  begin(w, h, vp, bg){
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, w, h);
    gl.clearColor(bg[0], bg[1], bg[2], 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(this.loc.uVP, false, vp);
  },
  /* la position de la caméra, et les personnages à ne jamais laisser cacher par le décor */
  view(eye, targets){
    const gl = this.gl, L = this.loc, t = targets || [];
    gl.uniform3f(L.uEye, eye[0], eye[1], eye[2]);
    const a = t[0] || [0, -99, 0], b = t[1] || [0, -99, 0];
    gl.uniform3f(L.uT0, a[0], a[1], a[2]); gl.uniform3f(L.uT1, b[0], b[1], b[2]); gl.uniform1f(L.uNT, t.length);
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
  },
  readPick(x, y){
    const gl = this.gl, px = new Uint8Array(4);
    gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return px[0] + px[1] * 256;
  },
};

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
