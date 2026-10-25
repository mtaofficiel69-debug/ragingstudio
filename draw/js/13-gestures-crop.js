/* =====================================================================
   RAGING DRAW — GESTES ET RECADRAGE
   • Recadrage sur l'affiche : double-clic sur une image (ou « Recadrer »
     dans le volet ou au clic droit). On glisse la photo dans son cadre, on
     tire les coins et les côtés ; toute la photo reste visible en transparence
     autour du cadre. Entrée ou « Terminé » valide, Échap annule.
   • Clic droit maintenu + glisser : déplace la vue. Un clic droit simple
     (sans bouger) ouvre toujours le menu, comme avant.
   • Sur écran tactile : pincer à deux doigts pour zoomer, glisser à deux
     doigts pour se déplacer. La souris et le pavé tactile ne changent pas.
===================================================================== */
(function(){
  const CROP_MIN = 0.02;            // un côté ne descend jamais sous 2 % de la photo
  const RP_MOVE = 4;                // au-delà de 4 px, le clic droit devient un déplacement

  /* ---------------- recadrage ---------------- */
  const cropObj = () => S.crop && objById(S.crop.id);
  const scaleOf = o => {            // pixels d'affiche par pixel de la photo
    const c = o.crop || {l:0, t:0, r:0, b:0};
    return {kx:o.w/Math.max(1e-6, (1 - c.l - c.r)*o.nw), ky:o.h/Math.max(1e-6, (1 - c.t - c.b)*o.nh), c};
  };
  /* la photo entière, dans le repère du calque (le cadre va de -w/2 à w/2) */
  function fullRect(o){
    const {kx, ky, c} = scaleOf(o);
    return {x:-o.w/2 - c.l*o.nw*kx, y:-o.h/2 - c.t*o.nh*ky, w:o.nw*kx, h:o.nh*ky};
  }
  function canCrop(o){ return o && o.type === 'image' && o.asset && o.nw && o.nh && !o.locked; }
  window.startCrop = function(o){
    o = o || sel1();
    if(!canCrop(o)){ if(o && o.type === 'image' && !o.asset) pickImageFile(o); return; }
    if(S.editingId) endTextEdit();
    if(S.tool !== 'select') setTool('select');
    if(!o.crop) o.crop = {l:0, t:0, r:0, b:0};
    S.crop = {id:o.id, snap:{crop:Object.assign({}, o.crop), x:o.x, y:o.y, w:o.w, h:o.h}};
    setSel([o.id]);
    showBar(); fitPhoto(o); requestRender();
  };
  /* si la photo entière dépasse de l'écran, on recule juste assez pour la voir en entier */
  function fitPhoto(o){
    const F = fullRect(o), pts = [[F.x, F.y], [F.x + F.w, F.y], [F.x + F.w, F.y + F.h], [F.x, F.y + F.h]].map(q => toWorld(o, q[0], q[1]));
    const xs = pts.map(q => q.x), ys = pts.map(q => q.y), x1 = Math.min(...xs), x2 = Math.max(...xs), y1 = Math.min(...ys), y2 = Math.max(...ys);
    const st = stageSize(), mt = 72, mb = 96, ms = 36;
    const a = docToScreen(x1, y1), b = docToScreen(x2, y2);
    if(a.x >= ms && a.y >= mt && b.x <= st.w - ms && b.y <= st.h - mb) return;
    const z = clamp(Math.min((st.w - 2*ms)/(x2 - x1), (st.h - mt - mb)/(y2 - y1), S.zoom), 0.02, 16);
    S.autoFit = false; S.zoom = z;
    S.panX = ms + (st.w - 2*ms - (x2 - x1)*z)/2 - x1*z; S.panY = mt + (st.h - mt - mb - (y2 - y1)*z)/2 - y1*z;
    updateZoomLabel(); positionTextEdit();
  }
  window.endCrop = function(cancel){
    const o = cropObj(), st = S.crop; if(!st) return;
    S.crop = null; hideBar();
    if(o){
      if(cancel) Object.assign(o, {crop:st.snap.crop, x:st.snap.x, y:st.snap.y, w:st.snap.w, h:st.snap.h});
      touch(o); commit(); syncFields();
    }
    requestRender();
  };
  ACT.cropStart = () => startCrop();
  ACT.cropDone = () => endCrop(false);
  ACT.cropCancel = () => endCrop(true);

  function showBar(){
    hideBar();
    const stage = document.getElementById('stage'); if(!stage) return;
    const b = document.createElement('div'); b.className = 'rd-cropbar'; b.id = 'rdCropBar';
    b.innerHTML = `<span class="cb-t">${icon('crop')}<b>${L('Recadrage','Crop')}</b><span class="cb-h">${L('Glisse la photo, tire les coins','Drag the photo, pull the corners')}</span></span>
      <button class="btn btn-sm btn-ghost" data-act="cropCancel">${L('Annuler','Cancel')}</button><button class="btn btn-sm btn-primary" data-act="cropDone">${icon('check')} ${L('Terminé','Done')}</button>`;
    stage.appendChild(b);
  }
  function hideBar(){ const b = document.getElementById('rdCropBar'); if(b) b.remove(); }

  /* les 8 poignées du cadre, en coordonnées d'écran */
  function cropHandles(o){
    const w = o.w/2, h = o.h/2, out = [];
    [[-1,-1],[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0]].forEach(s => {
      const p = toWorld(o, s[0]*w, s[1]*h); out.push({sx:s[0], sy:s[1], s:docToScreen(p.x, p.y)});
    });
    return out;
  }
  function cropHandleAt(o, sx, sy, touchy){
    const r = touchy ? 22 : 12, hs = cropHandles(o);
    let best = null, bd = r;
    hs.forEach(h => { const d = Math.hypot(h.s.x - sx, h.s.y - sy); if(d <= bd){ bd = d; best = h; } });
    return best;
  }
  function cropDown(e, p, sx, sy){
    const o = cropObj(); if(!o){ endCrop(false); return false; }
    const hd = cropHandleAt(o, sx, sy, e.pointerType === 'touch');
    const l = toLocal(o, p.x, p.y), F = fullRect(o);
    const base = {o0:{x:o.x, y:o.y, w:o.w, h:o.h, rot:o.rot, flipX:o.flipX, flipY:o.flipY}, c0:Object.assign({}, o.crop), l0:l, k:scaleOf(o)};
    if(hd){ S.drag = Object.assign({kind:'crophd', sx:hd.sx, sy:hd.sy}, base); return true; }
    if(l.x >= F.x && l.x <= F.x + F.w && l.y >= F.y && l.y <= F.y + F.h){ S.drag = Object.assign({kind:'croppan'}, base); cv.style.cursor = 'grabbing'; return true; }
    endCrop(false);                 // clic à côté : on valide et on reprend la main normale
    return false;
  }
  function cropMove(p){
    const D = S.drag, o = cropObj(); if(!o) return;
    const l = toLocal(D.o0, p.x, p.y), dx = l.x - D.l0.x, dy = l.y - D.l0.y;
    const ux = o.nw*D.k.kx, uy = o.nh*D.k.ky, c0 = D.c0, c = o.crop;
    if(D.kind === 'croppan'){
      // la photo glisse sous le cadre : le cadre ne bouge pas
      const s = clamp(dx/ux, -c0.r, c0.l), t = clamp(dy/uy, -c0.b, c0.t);
      c.l = c0.l - s; c.r = c0.r + s; c.t = c0.t - t; c.b = c0.b + t;
    }else{
      // un côté du cadre se déplace, la photo reste où elle est
      if(D.sx === 1) c.r = clamp(c0.r - dx/ux, 0, 1 - c0.l - CROP_MIN);
      if(D.sx === -1) c.l = clamp(c0.l + dx/ux, 0, 1 - c0.r - CROP_MIN);
      if(D.sy === 1) c.b = clamp(c0.b - dy/uy, 0, 1 - c0.t - CROP_MIN);
      if(D.sy === -1) c.t = clamp(c0.t + dy/uy, 0, 1 - c0.b - CROP_MIN);
      const w = (1 - c.l - c.r)*ux, h = (1 - c.t - c.b)*uy;
      const cxl = D.sx ? D.sx*(w - D.o0.w)/2 : 0, cyl = D.sy ? D.sy*(h - D.o0.h)/2 : 0;
      const q = toWorld(D.o0, cxl, cyl);
      o.w = w; o.h = h; o.x = q.x; o.y = q.y;
    }
    ['l', 't', 'r', 'b'].forEach(k => { c[k] = Math.round(c[k]*1e5)/1e5; });
    touch(o); syncFields(); requestRender();
  }
  function drawCropOverlay(){
    const o = cropObj(); if(!o) return;
    const img = getImage(S.doc, o.asset), z = S.zoom, F = fullRect(o);
    // toute la photo, en transparence autour du cadre
    cx.save();
    cx.setTransform(dpr*z, 0, 0, dpr*z, dpr*S.panX, dpr*S.panY);
    objTransform(cx, o);
    cx.beginPath(); cx.rect(F.x, F.y, F.w, F.h); cx.rect(-o.w/2, -o.h/2, o.w, o.h); cx.clip('evenodd');
    if(img){ cx.globalAlpha = .42; cx.drawImage(img, F.x, F.y, F.w, F.h); cx.globalAlpha = 1; }
    cx.fillStyle = 'rgba(15,17,21,.28)'; cx.fillRect(F.x, F.y, F.w, F.h);
    cx.restore();
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // contour de la photo entière (pointillé) et du cadre (plein)
    const ring = (pts, dash, col, lw) => { cx.save(); cx.strokeStyle = col; cx.lineWidth = lw; if(dash) cx.setLineDash(dash); cx.beginPath(); pts.forEach((q, i) => i ? cx.lineTo(q.x, q.y) : cx.moveTo(q.x, q.y)); cx.closePath(); cx.stroke(); cx.restore(); };
    const scr = (lx, ly) => { const q = toWorld(o, lx, ly); return docToScreen(q.x, q.y); };
    ring([scr(F.x, F.y), scr(F.x + F.w, F.y), scr(F.x + F.w, F.y + F.h), scr(F.x, F.y + F.h)], [4, 4], 'rgba(255,255,255,.8)', 1);
    const w = o.w/2, h = o.h/2;
    ring([scr(-w, -h), scr(w, -h), scr(w, h), scr(-w, h)], null, '#fff', 1.5);
    // tiers, pour composer
    cx.save(); cx.strokeStyle = 'rgba(255,255,255,.45)'; cx.lineWidth = 1; cx.beginPath();
    [-1/3, 1/3].forEach(k => { const a = scr(k*o.w, -h), b = scr(k*o.w, h), c = scr(-w, k*o.h), d = scr(w, k*o.h); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.moveTo(c.x, c.y); cx.lineTo(d.x, d.y); });
    cx.stroke(); cx.restore();
    // poignées : équerres aux coins, barres sur les côtés
    const L1 = Math.min(18, Math.max(8, Math.min(o.w, o.h)*z/5));
    cropHandles(o).forEach(hd => {
      cx.save(); cx.lineCap = 'round';
      const a = (o.rot || 0)*Math.PI/180, fx = o.flipX ? -1 : 1, fy = o.flipY ? -1 : 1;
      const dir = (lx, ly) => ({x:(lx*fx)*Math.cos(a) - (ly*fy)*Math.sin(a), y:(lx*fx)*Math.sin(a) + (ly*fy)*Math.cos(a)});
      const seg = [];
      if(hd.sx && hd.sy){ seg.push(dir(-hd.sx, 0), dir(0, -hd.sy)); }
      else if(hd.sx){ seg.push(dir(0, 1), dir(0, -1)); }
      else { seg.push(dir(1, 0), dir(-1, 0)); }
      [['rgba(15,17,21,.55)', 6], ['#fff', 3.2]].forEach(([col, lw]) => {
        cx.strokeStyle = col; cx.lineWidth = lw; cx.beginPath();
        if(hd.sx && hd.sy){ seg.forEach(v => { cx.moveTo(hd.s.x, hd.s.y); cx.lineTo(hd.s.x + v.x*L1, hd.s.y + v.y*L1); }); }
        else { cx.moveTo(hd.s.x + seg[0].x*L1*.6, hd.s.y + seg[0].y*L1*.6); cx.lineTo(hd.s.x + seg[1].x*L1*.6, hd.s.y + seg[1].y*L1*.6); }
        cx.stroke();
      });
      cx.restore();
    });
  }

  /* ---------------- pincer (tactile) ---------------- */
  const touches = new Map();
  let pinch = null;
  function pinchState(){
    const pts = [...touches.values()].slice(0, 2), r = cv.getBoundingClientRect();
    const mx = (pts[0].x + pts[1].x)/2 - r.left, my = (pts[0].y + pts[1].y)/2 - r.top;
    return {d:Math.max(1, Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)), mx, my};
  }
  function startPinch(){
    const D = S.drag;
    // le premier doigt avait peut-être commencé à déplacer un élément : on le remet en place
    if(D && D.kind === 'move' && D.start){ D.start.forEach(q => { const o = objById(q.id); if(o){ o.x = q.x; o.y = q.y; } }); }
    if(D && D.kind === 'marquee') S.sel = D.base || [];
    if(D && (D.kind === 'croppan' || D.kind === 'crophd')){ const o = cropObj(); if(o){ Object.assign(o, {crop:Object.assign({}, D.c0), x:D.o0.x, y:D.o0.y, w:D.o0.w, h:D.o0.h}); touch(o); } }
    S.drag = null; S.guides = [];
    const st = pinchState();
    pinch = {d0:st.d, z0:S.zoom, docX:(st.mx - S.panX)/S.zoom, docY:(st.my - S.panY)/S.zoom};
  }
  function movePinch(){
    const st = pinchState();
    const z = clamp(pinch.z0*st.d/pinch.d0, 0.02, 16);
    S.autoFit = false; S.zoom = z;
    S.panX = st.mx - pinch.docX*z; S.panY = st.my - pinch.docY*z;   // le point sous les doigts reste sous les doigts
    updateZoomLabel(); positionTextEdit(); requestRender();
  }

  /* ---------------- clic droit maintenu = déplacer la vue ---------------- */
  let rp = null;

  /* ---------------- branchement sur l'éditeur ---------------- */
  const _down = onPointerDown, _move = onPointerMove, _up = onPointerUp, _ctx = onCanvasContextMenu, _dbl = onDblClick, _ov = drawOverlay;
  onPointerDown = function(e){
    if(e.pointerType === 'touch'){
      touches.set(e.pointerId, {x:e.clientX, y:e.clientY});
      if(touches.size === 2){ try{ cv.setPointerCapture(e.pointerId); }catch(err){} startPinch(); return; }
      if(touches.size > 2 || pinch) return;
    }
    if(e.button === 2 && e.pointerType === 'mouse'){
      const r = cv.getBoundingClientRect();
      rp = {sx:e.clientX - r.left, sy:e.clientY - r.top, px:S.panX, py:S.panY, moved:false, down:true, menu:null, upAt:0};
    }
    if(S.crop && e.button === 0 && !(S.tool === 'hand' || S.spaceDown)){
      cv.setPointerCapture(e.pointerId);
      const r = cv.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top, p = screenToDoc(e.clientX, e.clientY);
      S.pointer = {sx, sy, x:p.x, y:p.y};
      if(cropDown(e, p, sx, sy)) return;
    }
    return _down(e);
  };
  onPointerMove = function(e){
    if(e.pointerType === 'touch' && touches.has(e.pointerId)){
      touches.set(e.pointerId, {x:e.clientX, y:e.clientY});
      if(pinch){ if(touches.size >= 2) movePinch(); return; }
    }
    if(rp && rp.down && (e.buttons & 2)){
      const r = cv.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top;
      if(!rp.moved && Math.hypot(sx - rp.sx, sy - rp.sy) > RP_MOVE){
        rp.moved = true; closeMenu && closeMenu();
        S.drag = {kind:'pan', sx:rp.sx, sy:rp.sy, px:rp.px, py:rp.py}; cv.style.cursor = 'grabbing';
      }
    }
    if(S.drag && (S.drag.kind === 'croppan' || S.drag.kind === 'crophd')){
      const p = screenToDoc(e.clientX, e.clientY); cropMove(p); return;
    }
    if(S.crop && !S.drag){
      const o = cropObj();
      if(o){
        const r = cv.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top, p = screenToDoc(e.clientX, e.clientY);
        const hd = cropHandleAt(o, sx, sy, false), l = toLocal(o, p.x, p.y), F = fullRect(o);
        cv.style.cursor = hd ? handleCursor({kind:'side', sx:hd.sx, sy:hd.sy}, o) : (l.x >= F.x && l.x <= F.x + F.w && l.y >= F.y && l.y <= F.y + F.h ? 'grab' : 'default');
        S.pointer = {sx, sy, x:p.x, y:p.y}; return;
      }
    }
    return _move(e);
  };
  onPointerUp = function(e){
    if(e.pointerType === 'touch'){
      touches.delete(e.pointerId);
      if(pinch){ if(touches.size < 2){ pinch = null; touches.clear(); try{ cv.releasePointerCapture(e.pointerId); }catch(err){} } return; }
    }
    if(S.drag && (S.drag.kind === 'croppan' || S.drag.kind === 'crophd')){
      try{ cv.releasePointerCapture(e.pointerId); }catch(err){}
      S.drag = null; cv.style.cursor = 'grab'; commit(); syncFields(); requestRender(); return;
    }
    const wasRight = e.button === 2 && rp;
    const r = _up(e);
    if(wasRight){
      rp.down = false; rp.upAt = Date.now();
      // clic droit sans bouger : le menu s'ouvre au relâchement (navigateurs qui l'annoncent à l'appui)
      if(!rp.moved && rp.menu){ const m = rp.menu; rp.menu = null; _ctx({clientX:m.x, clientY:m.y, preventDefault(){}}); }
    }
    return r;
  };
  onCanvasContextMenu = function(e){
    e.preventDefault();
    if(rp && rp.down){ rp.menu = {x:e.clientX, y:e.clientY}; return; }          // on attend de savoir s'il glisse
    if(rp && rp.moved && Date.now() - rp.upAt < 600) return;                      // c'était un déplacement
    if(S.crop) endCrop(false);
    return _ctx(e);
  };
  onDblClick = function(e){
    if(S.tool !== 'select') return _dbl(e);
    const p = screenToDoc(e.clientX, e.clientY), hit = pickAt(p.x, p.y);
    if(hit && hit.type === 'image' && hit.asset){ startCrop(hit); return; }
    return _dbl(e);
  };
  drawOverlay = function(){
    if(S.crop && cropObj()){ drawCropOverlay(); return; }
    if(S.crop) S.crop = null;
    return _ov();
  };
  // Entrée valide, Échap annule ; quitter l'éditeur, changer d'outil ou de sélection valide aussi
  document.addEventListener('keydown', e => {
    if(!S.crop) return;
    if(e.key === 'Enter'){ e.preventDefault(); e.stopPropagation(); endCrop(false); }
    else if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); endCrop(true); }
  }, true);
  const _setTool = setTool; setTool = function(t){ if(S.crop && t !== 'select' && t !== 'hand') endCrop(false); return _setTool.apply(this, arguments); };
  const _setSel = setSel; setSel = function(ids){ if(S.crop && !(ids && ids.length === 1 && ids[0] === S.crop.id)) endCrop(false); return _setSel.apply(this, arguments); };
  const _goHome = goHome; goHome = function(){ if(S.crop) endCrop(false); return _goHome.apply(this, arguments); };
  const _undo = undo; undo = function(){ if(S.crop){ S.crop = null; hideBar(); } return _undo.apply(this, arguments); };
  const _redo = redo; redo = function(){ if(S.crop){ S.crop = null; hideBar(); } return _redo.apply(this, arguments); };
  // le cadre recadré dans le menu clic droit d'une image
  const _items = objectMenuItems;
  objectMenuItems = function(){
    const items = _items.apply(this, arguments), one = sel1();
    if(canCrop(one)){
      const i = items.findIndex(it => it && it.icon === 'upload');
      items.splice(i >= 0 ? i + 1 : 0, 0, {label:L('Recadrer','Crop'), icon:'crop', kbd:L('Double-clic','Double-click'), act:() => startCrop(one)});
    }
    return items;
  };
})();
