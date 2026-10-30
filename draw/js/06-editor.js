/* =====================================================================
   RAGING DRAW — ÉDITEUR
   Coquille (colonne, barre du haut, plan de travail), vue (zoom, main),
   outils, sélection, poignées, magnétisme, texte, dessin, gomme,
   historique et sauvegarde automatique.
===================================================================== */
const S = {
  view:'home', index:[], doc:null,
  sel:[], tool:'select', prevTool:'select',
  brush:{tool:'round', size:22, color:'#FFFFFF', opacity:1, smooth:55},
  eraser:{size:60, opacity:1},
  bucket:{tol:16, contig:true, gap:10},
  zoom:1, panX:0, panY:0, fitted:false, autoFit:true,
  flyout:'templates', rtab:'props',
  history:[], hpos:-1,
  snap:true, grid:false, safe:false,
  guides:[], editingId:null, clipboard:null, clipText:'',
  saveState:'saved', drag:null, hover:null, spaceDown:false, pointer:null
};
const HANDLE = 9;
let cv = null, cx = null, dpr = 1, _raf = 0;

/* ---------- Accès ---------- */
function selObjs(){ return S.doc ? S.sel.map(id => S.doc.objects.find(o => o.id === id)).filter(Boolean) : []; }
function sel1(){ const s = selObjs(); return s.length === 1 ? s[0] : null; }
function objById(id){ return S.doc ? S.doc.objects.find(o => o.id === id) : null; }
function setSel(ids, keepPanel){
  S.sel = ids.slice();
  if(S.editingId && !ids.includes(S.editingId)) endTextEdit();
  if(!keepPanel) renderSide();
  renderLayersIfOpen();
  requestRender();
}

/* ---------- Historique ---------- */
function snapshot(){
  const d = S.doc;
  return JSON.stringify({title:d.title, format:d.format, w:d.w, h:d.h, phys:d.phys, bg:d.bg, fx:d.fx, objects:d.objects}, (k, v) => k === '_v' ? undefined : v);
}
function resetHistory(){ S.history = [snapshot()]; S.hpos = 0; updateUndoButtons(); }
function commit(){
  if(!S.doc) return;
  const snap = snapshot();
  if(snap === S.history[S.hpos]) return;
  S.history = S.history.slice(0, S.hpos + 1);
  S.history.push(snap);
  if(S.history.length > 150) S.history.shift();
  S.hpos = S.history.length - 1;
  updateUndoButtons();
  scheduleSave();
}
function restoreSnap(snap){
  const o = JSON.parse(snap);
  Object.assign(S.doc, o);
  S.sel = S.sel.filter(id => S.doc.objects.some(x => x.id === id));
  renderSide(); renderLayersIfOpen(); updateDocInfo(); requestRender();
  scheduleSave();
}
function undo(){ if(S.editingId) endTextEdit(); if(S.hpos > 0){ S.hpos--; restoreSnap(S.history[S.hpos]); updateUndoButtons(); } }
function redo(){ if(S.hpos < S.history.length - 1){ S.hpos++; restoreSnap(S.history[S.hpos]); updateUndoButtons(); } }
function updateUndoButtons(){
  const u = document.querySelector('[data-act="undo"]'), r = document.querySelector('[data-act="redo"]');
  if(u) u.disabled = S.hpos <= 0;
  if(r) r.disabled = S.hpos >= S.history.length - 1;
}

/* ---------- Sauvegarde automatique ---------- */
const scheduleSave = debounce(() => saveDoc(), 700);
function setSaveState(st){
  S.saveState = st;
  const el = document.getElementById('saveStatus');
  if(el){
    el.className = 'save-status ' + st;
    el.innerHTML = '<i></i>' + (st === 'saving' ? L('Enregistrement…','Saving…') : st === 'error' ? L('Non enregistré','Not saved') : L('Enregistré','Saved'));
  }
}
function saveDoc(){
  if(!S.doc) return Promise.resolve();
  const d = S.doc;
  d.updatedAt = Date.now();
  setSaveState('saving');
  let thumb = '';
  try{ thumb = renderThumb(d, 420, 420).toDataURL('image/jpeg', .84); }catch(e){}
  const clean = JSON.parse(JSON.stringify(d, (k, v) => k === '_v' ? undefined : v));
  const meta = {id:d.id, title:d.title, updatedAt:d.updatedAt, createdAt:d.createdAt, format:d.format, w:d.w, h:d.h, phys:d.phys, thumb};
  return Store.putDoc(clean, meta).then(() => setSaveState('saved')).catch(() => setSaveState('error'));
}

/* ---------- Ouverture ---------- */
function openDoc(doc){
  S.doc = doc; S.sel = []; S.tool = 'select'; S.editingId = null; S.fitted = false; S.autoFit = true;
  S.flyout = doc.objects.length ? null : 'templates';
  S.rtab = 'props';
  // on retire les images que plus aucun objet n'utilise
  const used = new Set(doc.objects.filter(o => o.type === 'image' && o.asset).map(o => o.asset));
  Object.keys(doc.assets || {}).forEach(k => { if(!used.has(k)) delete doc.assets[k]; });
  doc.objects.forEach(o => { if(o.type === 'text') ensureFont(o); });
  S.view = 'editor';
  render();
  resetHistory();
  preloadImages(doc).then(() => requestRender(true));
  loadDocFonts(doc).then(() => requestRender(true));
}
function goHome(){
  if(S.editingId) endTextEdit();
  saveDoc().then(() => refreshIndex()).then(() => { S.view = 'home'; S.doc = null; render(); });
}

/* ---------- Coquille de l'éditeur ---------- */
function railItem(act, ic, label, active, id){
  return `<div class="rail-item ${active?'active':''}" data-act="${act}" ${id?`data-id="${id}"`:''} role="button" tabindex="0">${icon(ic)}<span class="lbl">${label}</span></div>`;
}
function renderEditorShell(){
  const d = S.doc, f = S.flyout;
  return `
  <div id="editorView">
    <aside class="rail">
      <div class="rail-top">
        <div class="rail-brand" data-act="goHome" title="${L('Retour à l’accueil','Back to home')}">${rdLogo(36,'rail-logo')}${rdWordmark()}</div>
        <div class="rail-project" data-label="${L('Affiche','Poster')}" id="railTitle">${esc(d.title)}</div>
      </div>
      <nav class="rail-nav">
        <div class="rail-group">${L('Créer','Create')}</div>
        ${railItem('flyout','templates',L('Modèles','Templates'), f==='templates','templates')}
        ${railItem('flyout','typeT',L('Textes','Text'), f==='text','text')}
        ${railItem('flyout','shapes',L('Formes','Shapes'), f==='shapes','shapes')}
        ${railItem('flyout','sparkles',L('Décors','Decor'), f==='decors','decors')}
        ${railItem('flyout','image',L('Images','Images'), f==='images','images')}
        ${railItem('flyout','brush',L('Dessin','Drawing'), f==='draw','draw')}
        <div class="rail-group">${L('Affiche','Poster')}</div>
        ${railItem('docSettings','bg',L('Fond et ambiance','Background & mood'), false)}
        ${railItem('showLayers','layers',L('Calques','Layers'), false)}
        ${railItem('openFormat','ratio',L('Format','Size'), false)}
        <div class="rail-group">${L('Projet','Project')}</div>
        ${railItem('openExport','export',L('Exporter','Export'), false)}
        ${railItem('openHelp','keyboard',L('Raccourcis et aide','Shortcuts & help'), false)}
      </nav>
      <div class="rail-bottom" id="docInfo"></div>
    </aside>
    <div class="main-col">
      <div class="topbar">
        <div class="topbar-left">
          <button class="btn tb-back" data-act="goHome" title="${L('Retour à mes affiches','Back to my posters')}">${icon('back')}<span class="tb-lbl">${L('Mes affiches','My posters')}</span></button>
          <span class="tb-div"></span>
          <input class="tb-title" id="docTitle" value="${esc(d.title)}" spellcheck="false" aria-label="${L('Titre de l’affiche','Poster title')}">
          <span class="tb-div"></span>
          <button class="btn tb-box" data-act="tbAddText" title="${L('Ajouter un texte au centre de l’affiche (T)','Add a text in the middle of the poster (T)')}">${icon('typeT')} + <span class="tb-lbl">${L('Texte','Text')}</span></button>
          <button class="btn tb-box" data-act="addImage" title="${L('Importer une image (I)','Import an image (I)')}">${icon('image')} + <span class="tb-lbl">${L('Image','Image')}</span></button>
          <button class="btn" data-act="tbAlignMenu" title="${L('Aligner la sélection : sur l’affiche, ou entre plusieurs éléments','Align the selection: on the poster, or between several elements')}">${icon('alignCH')}<span class="tb-lbl">${L('Aligner','Align')}</span></button>
          <span class="tb-div"></span>
          <button class="btn" data-act="undo" title="${L('Annuler','Undo')} (Ctrl+Z)">${icon('undo')}</button>
          <button class="btn" data-act="redo" title="${L('Rétablir','Redo')} (Ctrl+Maj+Z)">${icon('redo')}</button>
          <span class="tb-div"></span>
          <span class="save-status saved" id="saveStatus"><i></i>${L('Enregistré','Saved')}</span>
          <span class="vault-chip off" id="driveChip" data-act="driveChipClick" role="button" tabindex="0"></span>
          ${langFlagsHtml()}
        </div>
        <div class="topbar-right">
          <button class="fmt-indicator" data-act="openFormat" id="fmtIndicator" title="${L('Changer le format de l’affiche','Change the poster size')}">${esc(formatLabel(d))}</button>
          ${themeToggleBtnHtml('', true)}
          <button class="btn" data-act="tbMoreMenu" title="${L('Plus d’options','More options')}">${icon('more')}</button>
          <button class="btn btn-primary" data-act="openExport">${icon('export')}<span class="tb-lbl">${L('Exporter','Export')}</span></button>
        </div>
      </div>
      <div class="work">
        <div class="flyout ${f?'':'hidden'}" id="flyout"></div>
        <div class="stage" id="stage">
          <canvas id="cv"></canvas>
          <textarea id="textEdit" class="hidden" spellcheck="false"></textarea>
          <div class="dock" id="dock"></div>
          <div class="zoombar">
            <button class="zb" data-act="zoomOut" title="${L('Dézoomer','Zoom out')} (−)">${icon('zoomOut')}</button>
            <button class="zb zb-pct" data-act="zoomFit" id="zoomPct" title="${L('Ajuster à l’écran','Fit to screen')} (Ctrl+0)">100 %</button>
            <button class="zb" data-act="zoomIn" title="${L('Zoomer','Zoom in')} (+)">${icon('zoomIn')}</button>
          </div>
          <div class="drop-veil hidden" id="dropVeil"><div>${icon('image')}<b>${L('Lâche ton image','Drop your image')}</b><span>${L('Elle garde sa pleine résolution','It keeps its full resolution')}</span></div></div>
        </div>
        <aside class="side" id="side"></aside>
      </div>
    </div>
  </div>`;
}
function updateDocInfo(){
  const el = document.getElementById('docInfo'); if(!el || !S.doc) return;
  const d = S.doc;
  const fi = document.getElementById('fmtIndicator'); if(fi) fi.textContent = formatLabel(d);
  el.innerHTML = `<span>${esc(formatLabel(d))}</span><span>${d.objects.length} ${L(d.objects.length>1?'éléments':'élément', d.objects.length>1?'elements':'element')}</span>`;
}
function renderDock(){
  const el = document.getElementById('dock'); if(!el) return;
  const t = S.tool;
  const b = (tool, ic, label, key) => `<button class="dk ${t===tool?'on':''}" data-act="tool" data-id="${tool}" title="${label} (${key})">${icon(ic)}</button>`;
  el.innerHTML = b('select','cursor',L('Sélection','Select'),'V') + b('hand','hand',L('Main','Hand'),'H') + '<span class="dk-sep"></span>' +
    b('brush','brush',L('Pinceau','Brush'),'B') + b('eraser','eraser',L('Gomme','Eraser'),'E') + b('bucket','bucket',L('Pot de peinture','Paint bucket'),'G') + '<span class="dk-sep"></span>' +
    b('text','typeT',L('Texte','Text'),'T') + b('rect','rect',L('Rectangle','Rectangle'),'R') + b('ellipse','ellipse',L('Ellipse','Ellipse'),'O') +
    b('line','line',L('Trait','Line'),'L') + '<button class="dk" data-act="addImage" title="' + L('Image','Image') + ' (I)">' + icon('image') + '</button>' +
    b('pipette','pipette',L('Pipette','Eyedropper'),'K');
}
function setTool(t){
  if(S.editingId) endTextEdit();
  if(t !== 'pipette') S.prevTool = t;
  S.tool = t;
  renderDock();
  if(cv) cv.style.cursor = cursorFor(t);
  renderSide();
  requestRender();
}
function cursorFor(t){
  if(t === 'hand') return 'grab';
  if(t === 'brush' || t === 'eraser') return 'none';
  if(t === 'text') return 'text';
  if(t === 'pipette' || t === 'bucket') return 'crosshair';
  if(['rect','ellipse','line','triangle','star'].includes(t)) return 'crosshair';
  return 'default';
}

function attachEditorEvents(){
  cv = document.getElementById('cv'); cx = cv.getContext('2d');
  const stage = document.getElementById('stage');
  new ResizeObserver(() => resizeCanvas()).observe(stage);
  resizeCanvas();
  cv.addEventListener('pointerdown', onPointerDown);
  cv.addEventListener('pointermove', onPointerMove);
  cv.addEventListener('pointerup', onPointerUp);
  cv.addEventListener('pointercancel', onPointerUp);
  cv.addEventListener('pointerleave', () => { S.pointer = null; S.hover = null; requestRender(); });
  cv.addEventListener('dblclick', onDblClick);
  cv.addEventListener('wheel', onWheel, {passive:false});
  cv.addEventListener('contextmenu', onCanvasContextMenu);
  const title = document.getElementById('docTitle');
  title.addEventListener('input', () => { S.doc.title = title.value; const r = document.getElementById('railTitle'); if(r) r.textContent = title.value; scheduleSave(); });
  title.addEventListener('change', () => { if(!title.value.trim()){ title.value = S.doc.title = L('Sans titre','Untitled'); } commit(); });
  title.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); title.blur(); } });
  // glisser-déposer d'images
  stage.addEventListener('dragover', e => { if(hasFiles(e)){ e.preventDefault(); document.getElementById('dropVeil').classList.remove('hidden'); } });
  stage.addEventListener('dragleave', e => { if(e.target === stage || e.target.id === 'dropVeil') document.getElementById('dropVeil').classList.add('hidden'); });
  stage.addEventListener('drop', e => {
    document.getElementById('dropVeil').classList.add('hidden');
    if(!hasFiles(e)) return;
    e.preventDefault();
    const p = screenToDoc(e.clientX, e.clientY);
    const files = [...e.dataTransfer.files].filter(f => /^image\//.test(f.type) || /\.svg$/i.test(f.name));
    if(!files.length){ toast(L('Seules les images peuvent être déposées ici.','Only images can be dropped here.'), 'warn'); return; }
    const ph = pickAt(p.x, p.y, o => o.type === 'image');
    files.forEach((f, i) => addImageFile(f, i === 0 && ph ? ph : null, p));
  });
  renderDock(); renderSide(); renderFlyout(); updateDocInfo(); updateUndoButtons();
  cv.style.cursor = cursorFor(S.tool);
}
function hasFiles(e){ return e.dataTransfer && [...(e.dataTransfer.types||[])].includes('Files'); }

/* ---------- Vue ---------- */
function resizeCanvas(){
  if(!cv) return;
  const r = cv.parentElement.getBoundingClientRect();
  dpr = window.devicePixelRatio || 1;
  cv.width = Math.max(1, Math.round(r.width*dpr)); cv.height = Math.max(1, Math.round(r.height*dpr));
  cv.style.width = r.width + 'px'; cv.style.height = r.height + 'px';
  if((!S.fitted || S.autoFit) && r.width > 50){ fitView(true); S.fitted = true; }
  requestRender(true);
}
function stageSize(){ const r = cv.getBoundingClientRect(); return {w:r.width, h:r.height}; }
function fitView(auto){
  if(!cv || !S.doc) return;
  if(!auto) S.autoFit = true;
  const s = stageSize(), d = S.doc;
  const z = Math.min((s.w - 96)/d.w, (s.h - 150)/d.h);
  S.zoom = clamp(z, 0.02, 8);
  S.panX = (s.w - d.w*S.zoom)/2; S.panY = (s.h - 70 - d.h*S.zoom)/2 + 16;
  updateZoomLabel(); positionTextEdit(); requestRender();
}
function zoomAt(z, sx, sy){
  z = clamp(z, 0.02, 16);
  S.autoFit = false;
  const s = stageSize();
  if(sx == null){ sx = s.w/2; sy = s.h/2; }
  const dx = (sx - S.panX)/S.zoom, dy = (sy - S.panY)/S.zoom;
  S.zoom = z; S.panX = sx - dx*z; S.panY = sy - dy*z;
  updateZoomLabel(); positionTextEdit(); requestRender();
}
function zoomStep(dir){
  const steps = [0.05,0.08,0.1,0.15,0.2,0.25,0.33,0.5,0.67,0.75,1,1.25,1.5,2,3,4,6,8,12,16];
  let z = S.zoom;
  if(dir > 0) z = steps.find(v => v > S.zoom*1.01) || 16; else z = steps.slice().reverse().find(v => v < S.zoom*0.99) || 0.02;
  zoomAt(z);
}
function updateZoomLabel(){ const el = document.getElementById('zoomPct'); if(el) el.textContent = Math.round(S.zoom*100) + ' %'; }
function screenToDoc(clientX, clientY){
  const r = cv.getBoundingClientRect();
  return {x:(clientX - r.left - S.panX)/S.zoom, y:(clientY - r.top - S.panY)/S.zoom};
}
function docToScreen(x, y){ return {x:S.panX + x*S.zoom, y:S.panY + y*S.zoom}; }
function onWheel(e){
  e.preventDefault();
  const r = cv.getBoundingClientRect();
  if(e.ctrlKey || e.metaKey){
    const k = Math.exp(-e.deltaY*(e.deltaMode ? 0.05 : 0.0022));
    zoomAt(S.zoom*k, e.clientX - r.left, e.clientY - r.top);
  }else{
    S.autoFit = false;
    S.panX -= e.shiftKey ? e.deltaY : e.deltaX; S.panY -= e.shiftKey ? 0 : e.deltaY;
    positionTextEdit(); requestRender();
  }
}

/* ---------- Boucle d'affichage ---------- */
function requestRender(){ if(_raf) return; _raf = requestAnimationFrame(draw); }
function cssVar(n, fb){ const v = getComputedStyle(document.documentElement).getPropertyValue(n).trim(); return v || fb; }
function draw(){
  _raf = 0;
  if(!cv || !S.doc || S.view !== 'editor') return;
  const d = S.doc, z = S.zoom;
  cx.setTransform(1, 0, 0, 1, 0, 0);
  cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
  cx.fillStyle = cssVar('--editor-backdrop', '#DCE0E7');
  cx.fillRect(0, 0, cv.width, cv.height);
  // ombre portée de la feuille + damier si le fond est transparent
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cx.save(); cx.shadowColor = 'rgba(10,10,20,.28)'; cx.shadowBlur = 28; cx.shadowOffsetY = 6;
  cx.fillStyle = '#fff'; cx.fillRect(S.panX, S.panY, d.w*z, d.h*z); cx.restore();
  drawChecker(S.panX, S.panY, d.w*z, d.h*z);
  cx.setTransform(dpr*z, 0, 0, dpr*z, dpr*S.panX, dpr*S.panY);
  renderDoc(cx, d, dpr*z, {screen:true, editingId:S.editingId});
  // trait en cours (aperçu direct, sans recalculer tout le calque)
  if(S.drag && S.drag.kind === 'paint' && S.drag.stroke){
    const o = objById(S.drag.targetId);
    if(o){
      cx.save(); cx.beginPath(); cx.rect(0, 0, d.w, d.h); cx.clip();
      cx.globalAlpha = o.opacity; cx.globalCompositeOperation = o.blend || 'source-over';
      objTransform(cx, o); cx.scale(o.w/o.bw, o.h/o.bh); cx.translate(-o.bw/2, -o.bh/2);
      drawStroke(cx, S.drag.stroke, dpr*z);
      cx.restore();
    }
  }
  cx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawOverlay();
}
function drawChecker(x, y, w, h){
  const bg = S.doc.bg;
  const transparent = bg && ((bg.type === 'solid' && colorAlpha(bg.color) < 1) || (bg.stops && bg.stops.some(s => colorAlpha(s.c) < 1)));
  if(!transparent) return;
  cx.save(); cx.beginPath(); cx.rect(x, y, w, h); cx.clip();
  const s = 10; cx.fillStyle = '#E3E6EC';
  for(let yy = 0; yy < h; yy += s) for(let xx = ((yy/s)%2)*s; xx < w; xx += s*2) cx.fillRect(x + xx, y + yy, s, s);
  cx.restore();
}
function drawOverlay(){
  const d = S.doc, z = S.zoom, acc = '#D9363E';
  // repères de composition
  if(S.grid || S.safe){
    cx.save(); cx.strokeStyle = 'rgba(217,54,62,.55)'; cx.lineWidth = 1; cx.setLineDash([5, 5]);
    const p = docToScreen(0, 0), W = d.w*z, H = d.h*z;
    if(S.grid){
      cx.beginPath();
      [1/3, 2/3].forEach(k => { cx.moveTo(p.x + W*k, p.y); cx.lineTo(p.x + W*k, p.y + H); cx.moveTo(p.x, p.y + H*k); cx.lineTo(p.x + W, p.y + H*k); });
      cx.stroke();
    }
    if(S.safe){ const m = Math.min(W, H)*.05; cx.strokeStyle = 'rgba(214,69,69,.6)'; cx.strokeRect(p.x + m, p.y + m, W - 2*m, H - 2*m); }
    cx.restore();
  }
  // survol
  if(S.hover && !S.drag && !S.sel.includes(S.hover) && S.tool === 'select'){
    const o = objById(S.hover); if(o) outline(o, 'rgba(217,54,62,.7)', 1);
  }
  const sel = selObjs();
  if(S.tool === 'select' || S.tool === 'text' || (S.drag && S.drag.kind !== 'paint')){
    sel.forEach(o => outline(o, acc, sel.length > 1 ? 1 : 1.5));
    if(sel.length === 1 && !S.editingId && !(S.drag && S.drag.kind === 'move')){
      const o = sel[0];
      if(!o.locked) handlesFor(o).forEach(hd => drawHandle(hd));
    }else if(sel.length > 1){
      const b = unionBox(sel), p1 = docToScreen(b.x1, b.y1), p2 = docToScreen(b.x2, b.y2);
      cx.save(); cx.strokeStyle = acc; cx.setLineDash([4, 3]); cx.lineWidth = 1; cx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y); cx.restore();
      if(!(S.drag && S.drag.kind === 'move')) groupHandles().forEach(hd => drawHandle(hd));
    }
  }
  // lignes magnétiques
  if(S.guides.length){
    cx.save(); cx.strokeStyle = '#E86FB0'; cx.lineWidth = 1;
    S.guides.forEach(g => {
      cx.beginPath();
      if(g.x != null){ const a = docToScreen(g.x, g.y1), b = docToScreen(g.x, g.y2); cx.moveTo(Math.round(a.x) + .5, a.y); cx.lineTo(Math.round(b.x) + .5, b.y); }
      else{ const a = docToScreen(g.x1, g.y), b = docToScreen(g.x2, g.y); cx.moveTo(a.x, Math.round(a.y) + .5); cx.lineTo(b.x, Math.round(b.y) + .5); }
      cx.stroke();
    });
    cx.restore();
  }
  // rectangle de sélection / de création
  if(S.drag && (S.drag.kind === 'marquee' || S.drag.kind === 'create') && S.drag.cur){
    const a = docToScreen(S.drag.x0, S.drag.y0), b = docToScreen(S.drag.cur.x, S.drag.cur.y);
    cx.save();
    cx.fillStyle = 'rgba(217,54,62,.10)'; cx.strokeStyle = acc; cx.lineWidth = 1;
    if(S.drag.kind === 'create') cx.setLineDash([5, 4]);
    const r = S.drag.kind === 'create' ? createRect() : null;
    if(r){ const p1 = docToScreen(r.x1, r.y1), p2 = docToScreen(r.x2, r.y2); cx.fillRect(p1.x, p1.y, p2.x-p1.x, p2.y-p1.y); cx.strokeRect(p1.x + .5, p1.y + .5, p2.x-p1.x, p2.y-p1.y); }
    else{ cx.fillRect(a.x, a.y, b.x - a.x, b.y - a.y); cx.strokeRect(a.x + .5, a.y + .5, b.x - a.x, b.y - a.y); }
    cx.restore();
  }
  // curseur du pinceau / de la gomme
  if((S.tool === 'brush' || S.tool === 'eraser') && S.pointer && !S.spaceDown){
    const size = (S.tool === 'brush' ? S.brush.size : S.eraser.size)*z;
    const p = S.pointer;
    cx.save();
    cx.beginPath(); cx.arc(p.sx, p.sy, Math.max(1.5, size/2), 0, Math.PI*2);
    cx.strokeStyle = 'rgba(0,0,0,.55)'; cx.lineWidth = 2.5; cx.stroke();
    cx.strokeStyle = S.tool === 'brush' ? '#fff' : '#FFB4B4'; cx.lineWidth = 1.2; cx.stroke();
    if(S.tool === 'brush'){ cx.beginPath(); cx.arc(p.sx, p.sy, 1.6, 0, Math.PI*2); cx.fillStyle = S.brush.color; cx.fill(); }
    cx.restore();
  }
}
function outline(o, color, lw){
  const c = corners(o).map(p => docToScreen(p.x, p.y));
  cx.save(); cx.strokeStyle = color; cx.lineWidth = lw;
  cx.beginPath(); c.forEach((p, i) => i ? cx.lineTo(p.x, p.y) : cx.moveTo(p.x, p.y)); cx.closePath(); cx.stroke();
  cx.restore();
}
function handlesFor(o){
  const w = o.w/2, h = o.h/2, list = [];
  const sides = o.type === 'text' ? [[-1,0],[1,0]] : [[0,-1],[1,0],[0,1],[-1,0]];
  [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(s => list.push({kind:'corner', sx:s[0], sy:s[1], p:toWorld(o, s[0]*w, s[1]*h)}));
  if(!(o.type === 'shape' && o.shape === 'line' && Math.abs(o.h)*S.zoom < 14)) sides.forEach(s => list.push({kind:'side', sx:s[0], sy:s[1], p:toWorld(o, s[0]*w, s[1]*h)}));
  else list.push({kind:'side', sx:1, sy:0, p:toWorld(o, w, 0)}, {kind:'side', sx:-1, sy:0, p:toWorld(o, -w, 0)});
  const top = toWorld(o, 0, -h);
  const up = toWorld(o, 0, -h - 26/S.zoom*(o.flipY ? -1 : 1));
  list.push({kind:'rot', p:up, base:top});
  return list.map(hd => Object.assign(hd, {s:docToScreen(hd.p.x, hd.p.y), b:hd.base ? docToScreen(hd.base.x, hd.base.y) : null}));
}
function groupHandles(){
  const b = unionBox(selObjs());
  return [[b.x1,b.y1,-1,-1],[b.x2,b.y1,1,-1],[b.x2,b.y2,1,1],[b.x1,b.y2,-1,1]].map(q => ({kind:'gcorner', sx:q[2], sy:q[3], p:{x:q[0], y:q[1]}, s:docToScreen(q[0], q[1])}));
}
function drawHandle(hd){
  cx.save();
  if(hd.kind === 'rot'){
    cx.strokeStyle = '#D9363E'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(hd.b.x, hd.b.y); cx.lineTo(hd.s.x, hd.s.y); cx.stroke();
    cx.beginPath(); cx.arc(hd.s.x, hd.s.y, 6, 0, Math.PI*2); cx.fillStyle = '#fff'; cx.fill(); cx.lineWidth = 1.5; cx.stroke();
    cx.beginPath(); cx.arc(hd.s.x, hd.s.y, 2.4, -2.6, 1.6); cx.stroke();
  }else{
    const r = hd.kind === 'side' ? 3.6 : 4.6;
    cx.fillStyle = '#fff'; cx.strokeStyle = '#D9363E'; cx.lineWidth = 1.5;
    cx.shadowColor = 'rgba(0,0,0,.18)'; cx.shadowBlur = 3;
    cx.beginPath();
    if(cx.roundRect) cx.roundRect(hd.s.x - r, hd.s.y - r, r*2, r*2, 1.5); else cx.rect(hd.s.x - r, hd.s.y - r, r*2, r*2);
    cx.fill(); cx.shadowBlur = 0; cx.stroke();
  }
  cx.restore();
}
function handleAt(sx, sy){
  const sel = selObjs();
  let list = [];
  if(sel.length === 1 && !sel[0].locked) list = handlesFor(sel[0]);
  else if(sel.length > 1) list = groupHandles();
  for(let i = list.length - 1; i >= 0; i--){
    if(Math.hypot(list[i].s.x - sx, list[i].s.y - sy) <= HANDLE) return list[i];
  }
  return null;
}
function handleCursor(hd, o){
  if(hd.kind === 'rot') return 'grab';
  let ang = Math.atan2(hd.sy, hd.sx)*180/Math.PI + (o ? o.rot : 0);
  ang = ((ang % 180) + 180) % 180;
  if(ang < 22.5 || ang >= 157.5) return 'ew-resize';
  if(ang < 67.5) return 'nwse-resize';
  if(ang < 112.5) return 'ns-resize';
  return 'nesw-resize';
}
function pickAt(x, y, filter, includeLocked){
  const tol = 4/S.zoom;
  for(let i = S.doc.objects.length - 1; i >= 0; i--){
    const o = S.doc.objects[i];
    if(!o.visible || (o.locked && !includeLocked)) continue;
    if(filter && !filter(o)) continue;
    if(hitObject(o, x, y, tol, S.doc)) return o;
  }
  return null;
}

/* ---------- Pointeur ---------- */
function onPointerDown(e){
  if(S.editingId){ endTextEdit(); }
  cv.setPointerCapture(e.pointerId);
  const r = cv.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top;
  const p = screenToDoc(e.clientX, e.clientY);
  S.pointer = {sx, sy, x:p.x, y:p.y};
  if(e.button === 1 || S.tool === 'hand' || S.spaceDown){
    S.drag = {kind:'pan', sx, sy, px:S.panX, py:S.panY};
    cv.style.cursor = 'grabbing';
    return;
  }
  if(e.button !== 0) return;
  const t = S.tool;
  if(t === 'pipette'){ pipetteAt(sx, sy); return; }
  if(t === 'bucket'){ bucketAt(p); return; }
  if(t === 'brush' || t === 'eraser'){ startPaint(p, e); return; }
  if(t === 'text'){
    const hit = pickAt(p.x, p.y, o => o.type === 'text');
    if(hit){ setSel([hit.id]); startTextEdit(hit); return; }
    const o = mkText(L('Ton texte','Your text'), p.x, p.y, Math.min(S.doc.w*.6, 900), {font:'Bebas Neue', size:Math.round(Math.min(S.doc.w, S.doc.h)*.08)});
    fitTextHeight(o);
    insertObj(o); setTool('select'); setSel([o.id]); commit();
    startTextEdit(o, true);
    return;
  }
  if(['rect','ellipse','line','triangle','star'].includes(t)){
    S.drag = {kind:'create', x0:p.x, y0:p.y, cur:p, shift:e.shiftKey};
    return;
  }
  // outil Sélection
  const hd = handleAt(sx, sy);
  if(hd){ startHandleDrag(hd, p, e); return; }
  const hit = pickAt(p.x, p.y);
  const sel = selObjs();
  if(hit){
    if(e.shiftKey){
      const ids = S.sel.includes(hit.id) ? S.sel.filter(i => i !== hit.id) : S.sel.concat(hit.id);
      setSel(ids);
      if(!ids.includes(hit.id)) return;
    }else if(!S.sel.includes(hit.id)){
      setSel([hit.id]);
    }
    if(e.altKey){ duplicateSel(true); }
    startMove(p, e);
    return;
  }
  if(sel.length > 1){
    const b = unionBox(sel);
    if(p.x >= b.x1 && p.x <= b.x2 && p.y >= b.y1 && p.y <= b.y2){ startMove(p, e); return; }
  }
  if(!e.shiftKey) setSel([]);
  S.drag = {kind:'marquee', x0:p.x, y0:p.y, cur:p, base:e.shiftKey ? S.sel.slice() : []};
}
function onPointerMove(e){
  const r = cv.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top;
  const p = screenToDoc(e.clientX, e.clientY);
  S.pointer = {sx, sy, x:p.x, y:p.y};
  const D = S.drag;
  if(!D){
    if(S.tool === 'select' && !S.spaceDown){
      const hd = handleAt(sx, sy);
      if(hd){ cv.style.cursor = handleCursor(hd, sel1()); S.hover = null; }
      else{
        const h = pickAt(p.x, p.y);
        cv.style.cursor = h ? 'move' : 'default';
        if((h && h.id) !== S.hover){ S.hover = h ? h.id : null; }
      }
    }
    requestRender();
    return;
  }
  if(D.kind === 'pan'){ S.autoFit = false; S.panX = D.px + sx - D.sx; S.panY = D.py + sy - D.sy; positionTextEdit(); requestRender(); return; }
  if(D.kind === 'paint'){ continuePaint(p, e); return; }
  if(D.kind === 'move') doMove(p, e);
  else if(D.kind === 'resize') doResize(p, e);
  else if(D.kind === 'gresize') doGroupResize(p, e);
  else if(D.kind === 'rotate') doRotate(p, e);
  else if(D.kind === 'marquee'){
    D.cur = p;
    const x1 = Math.min(D.x0, p.x), x2 = Math.max(D.x0, p.x), y1 = Math.min(D.y0, p.y), y2 = Math.max(D.y0, p.y);
    const ids = S.doc.objects.filter(o => o.visible && !o.locked).filter(o => { const b = aabb(o); return b.x2 >= x1 && b.x1 <= x2 && b.y2 >= y1 && b.y1 <= y2; }).map(o => o.id);
    S.sel = [...new Set(D.base.concat(ids))];
  }
  else if(D.kind === 'create'){ D.cur = p; D.shift = e.shiftKey; }
  requestRender();
}
function onPointerUp(e){
  const D = S.drag;
  try{ cv.releasePointerCapture(e.pointerId); }catch(err){}
  S.drag = null; S.guides = [];
  if(!D){ return; }
  if(D.kind === 'pan'){ cv.style.cursor = cursorFor(S.tool); return; }
  if(D.kind === 'paint'){ endPaint(D); return; }
  if(D.kind === 'create'){ finishCreate(D); return; }
  if(D.kind === 'marquee'){ renderSide(); renderLayersIfOpen(); requestRender(); return; }
  if(D.moved){ selObjs().forEach(touch); commit(); }
  syncFields(); requestRender();
}
function onDblClick(e){
  if(S.tool !== 'select') return;
  const p = screenToDoc(e.clientX, e.clientY);
  const hit = pickAt(p.x, p.y);
  if(!hit) return;
  if(hit.type === 'text'){ setSel([hit.id]); startTextEdit(hit); }
  else if(hit.type === 'image'){ setSel([hit.id]); pickImageFile(hit); }
  else if(hit.type === 'draw'){ setSel([hit.id]); setTool('brush'); toast(L('Tu dessines dans ce calque.','You’re drawing on this layer.')); }
}

/* ---------- Déplacement avec magnétisme ---------- */
function startMove(p, e){
  const sel = selObjs().filter(o => !o.locked);
  if(!sel.length) return;
  S.drag = {kind:'move', x0:p.x, y0:p.y, start:sel.map(o => ({id:o.id, x:o.x, y:o.y})), box:unionBox(sel), moved:false};
}
function snapTargets(excludeIds){
  const d = S.doc, xs = [0, d.w/2, d.w], ys = [0, d.h/2, d.h];
  d.objects.forEach(o => {
    if(!o.visible || excludeIds.includes(o.id)) return;
    const b = aabb(o);
    if(b.x2 - b.x1 > d.w*3) return;
    xs.push(b.x1, (b.x1 + b.x2)/2, b.x2); ys.push(b.y1, (b.y1 + b.y2)/2, b.y2);
  });
  return {xs, ys};
}
function snapDelta(box, dx, dy, excludeIds){
  S.guides = [];
  if(!S.snap) return {dx, dy};
  const thr = 6/S.zoom, T = snapTargets(excludeIds);
  const bx = [box.x1 + dx, (box.x1 + box.x2)/2 + dx, box.x2 + dx];
  const by = [box.y1 + dy, (box.y1 + box.y2)/2 + dy, box.y2 + dy];
  let best = null;
  bx.forEach(v => T.xs.forEach(t => { const dd = t - v; if(Math.abs(dd) < thr && (!best || Math.abs(dd) < Math.abs(best.d))) best = {d:dd, t}; }));
  let bestY = null;
  by.forEach(v => T.ys.forEach(t => { const dd = t - v; if(Math.abs(dd) < thr && (!bestY || Math.abs(dd) < Math.abs(bestY.d))) bestY = {d:dd, t}; }));
  if(best) dx += best.d;
  if(bestY) dy += bestY.d;
  const nb = {x1:box.x1 + dx, y1:box.y1 + dy, x2:box.x2 + dx, y2:box.y2 + dy};
  if(best) S.guides.push({x:best.t, y1:Math.min(0, nb.y1) - 40, y2:Math.max(S.doc.h, nb.y2) + 40});
  if(bestY) S.guides.push({y:bestY.t, x1:Math.min(0, nb.x1) - 40, x2:Math.max(S.doc.w, nb.x2) + 40});
  return {dx, dy};
}
function doMove(p, e){
  const D = S.drag;
  let dx = p.x - D.x0, dy = p.y - D.y0;
  if(!D.moved && Math.hypot(dx, dy)*S.zoom < 2) return;
  D.moved = true;
  if(e.shiftKey){ if(Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
  const s = snapDelta(D.box, dx, dy, D.start.map(q => q.id));
  D.start.forEach(q => { const o = objById(q.id); if(o){ o.x = q.x + s.dx; o.y = q.y + s.dy; } });
  syncFields();
}

/* ---------- Redimensionnement ---------- */
function startHandleDrag(hd, p, e){
  if(hd.kind === 'gcorner'){
    const sel = selObjs();
    S.drag = {kind:'gresize', hd, box:unionBox(sel), start:sel.map(o => deepClone(o)), moved:false};
    return;
  }
  const o = sel1();
  if(hd.kind === 'rot'){
    S.drag = {kind:'rotate', o0:deepClone(o), a0:Math.atan2(p.y - o.y, p.x - o.x), moved:false};
    return;
  }
  S.drag = {kind:'resize', hd, o0:deepClone(o), moved:false};
}
function keepsRatio(o, hd, e){
  if(hd.kind !== 'corner') return false;
  const natural = o.type === 'image' || o.type === 'path' || o.type === 'draw' || o.type === 'text';
  return natural ? !e.shiftKey : e.shiftKey;
}
function doResize(p, e){
  const D = S.drag, o0 = D.o0, o = sel1(); if(!o) return;
  D.moved = true;
  const hd = D.hd, lp = toLocal(o0, p.x, p.y);
  const fromCenter = e.altKey;
  const w0 = o0.w, h0 = o0.h;
  let ax = -hd.sx*w0/2, ay = -hd.sy*h0/2;
  if(fromCenter){ ax = 0; ay = 0; }
  let nw = w0, nh = h0;
  const k = fromCenter ? 2 : 1;
  if(hd.sx) nw = Math.max(4, (lp.x - ax)*hd.sx*k);
  if(hd.sy) nh = Math.max(4, (lp.y - ay)*hd.sy*k);
  if(o.type === 'text'){
    if(hd.kind === 'corner'){
      const r = nw/w0;
      o.w = w0*r; o.size = Math.max(4, o0.size*r);
      if(o0.stroke) o.stroke.width = o0.stroke.width*r;
      if(o0.glow) o.glow.blur = o0.glow.blur*r;
    }else o.w = nw;
    fitTextHeight(o);
    nw = o.w; nh = o.h;
    ay = fromCenter ? 0 : (hd.kind === 'corner' ? -hd.sy*h0/2 : 0);
    const cxl = fromCenter ? 0 : ax + hd.sx*nw/2;
    const cyl = hd.kind === 'corner' && !fromCenter ? ay + hd.sy*nh/2 : 0;
    const c = toWorld(o0, cxl, cyl);
    o.x = c.x; o.y = c.y;
  }else{
    if(keepsRatio(o, hd, e)){
      const r = Math.max(nw/w0, nh/h0);
      nw = w0*r; nh = h0*r;
    }
    o.w = nw; o.h = nh;
    const cxl = fromCenter || !hd.sx ? 0 : ax + hd.sx*nw/2;
    const cyl = fromCenter || !hd.sy ? 0 : ay + hd.sy*nh/2;
    const c = toWorld(o0, cxl, cyl);
    o.x = c.x; o.y = c.y;
  }
  touch(o);
  syncFields();
}
function doGroupResize(p, e){
  const D = S.drag, b = D.box, hd = D.hd;
  D.moved = true;
  const ax = hd.sx > 0 ? b.x1 : b.x2, ay = hd.sy > 0 ? b.y1 : b.y2;
  const w0 = b.x2 - b.x1, h0 = b.y2 - b.y1;
  const r = Math.max(0.02, Math.max((p.x - ax)*hd.sx/w0, (p.y - ay)*hd.sy/h0));
  D.start.forEach(s => {
    const o = objById(s.id); if(!o) return;
    o.x = ax + (s.x - ax)*r; o.y = ay + (s.y - ay)*r;
    o.w = s.w*r; o.h = s.h*r;
    if(o.type === 'text'){ o.size = s.size*r; if(s.stroke) o.stroke.width = s.stroke.width*r; fitTextHeight(o); }
    if(o.shadow && s.shadow){ o.shadow.blur = s.shadow.blur*r; o.shadow.x = s.shadow.x*r; o.shadow.y = s.shadow.y*r; }
    touch(o);
  });
  syncFields();
}
function doRotate(p, e){
  const D = S.drag, o = sel1(); if(!o) return;
  D.moved = true;
  let a = (D.o0.rot + (Math.atan2(p.y - o.y, p.x - o.x) - D.a0)*180/Math.PI);
  a = ((a % 360) + 540) % 360 - 180;
  if(e.shiftKey) a = Math.round(a/15)*15;
  else [0, 90, -90, 180, -180].forEach(t => { if(Math.abs(a - t) < 3) a = t; });
  o.rot = round(a, 1);
  syncFields();
}

/* ---------- Création de formes ---------- */
function createRect(){
  const D = S.drag; if(!D || !D.cur) return null;
  let x1 = D.x0, y1 = D.y0, x2 = D.cur.x, y2 = D.cur.y;
  if(D.shift && S.tool !== 'line'){
    const s = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
    x2 = x1 + Math.sign(x2 - x1 || 1)*s; y2 = y1 + Math.sign(y2 - y1 || 1)*s;
  }
  return {x1:Math.min(x1, x2), y1:Math.min(y1, y2), x2:Math.max(x1, x2), y2:Math.max(y1, y2), raw:{x1, y1, x2, y2}};
}
function finishCreate(D){
  S.drag = D;
  const r = createRect();
  S.drag = null;
  const u = Math.min(S.doc.w, S.doc.h);
  const t = S.tool;
  let o;
  if(t === 'line'){
    let x1 = D.x0, y1 = D.y0, x2 = D.cur.x, y2 = D.cur.y;
    if(Math.hypot(x2 - x1, y2 - y1) < 6/S.zoom){ x2 = x1 + u*.3; y2 = y1; }
    if(D.shift){ const a = Math.round(Math.atan2(y2 - y1, x2 - x1)/(Math.PI/4))*(Math.PI/4), len = Math.hypot(x2 - x1, y2 - y1); x2 = x1 + Math.cos(a)*len; y2 = y1 + Math.sin(a)*len; }
    o = mkShape('line', (x1 + x2)/2, (y1 + y2)/2, Math.hypot(x2 - x1, y2 - y1), Math.max(2, u*.006), {fill:solid(S.brush.color === '#FFFFFF' ? '#FFFFFF' : S.brush.color)});
    o.rot = round(Math.atan2(y2 - y1, x2 - x1)*180/Math.PI, 1);
  }else{
    let w = r.x2 - r.x1, h = r.y2 - r.y1, x = (r.x1 + r.x2)/2, y = (r.y1 + r.y2)/2;
    if(w*S.zoom < 6 && h*S.zoom < 6){ w = h = u*.3; x = D.x0; y = D.y0; }
    o = mkShape(t, x, y, w, h, {fill:solid('#D9363E')});
  }
  insertObj(o);
  setTool('select');
  setSel([o.id]); commit();
}

/* ---------- Dessin et gomme ---------- */
function startPaint(p, e){
  const isBrush = S.tool === 'brush';
  let target = null;
  if(isBrush){
    const s = sel1();
    if(s && s.type === 'draw' && !s.locked) target = s;
    else{
      target = mkDraw(S.doc.w/2, S.doc.h/2, S.doc.w, S.doc.h);
      insertObj(target);
      S.sel = [target.id];
      renderSide(); renderLayersIfOpen();
    }
  }else{
    const s = sel1();
    if(s && !s.locked && s.visible) target = s;
    else target = pickAt(p.x, p.y);
    if(!target){ toast(L('Rien à gommer ici : touche un élément ou sélectionne-le d’abord.','Nothing to erase here: touch an element or select it first.'), 'warn'); return; }
    if(target.type !== 'draw' && !target.mask) target.mask = {bw:target.w, bh:target.h, strokes:[]};
  }
  const st = isBrush
    ? {tool:S.brush.tool, color:S.brush.color, size:S.brush.size, opacity:S.brush.opacity, seed:Math.floor(Math.random()*1e9), pts:[]}
    : {tool:'erase', size:S.eraser.size, opacity:S.eraser.opacity, pts:[]};
  const base = target.type === 'draw' ? {bw:target.bw, bh:target.bh} : (target.mask || {bw:target.bw, bh:target.bh});
  const k = base.bw/Math.max(1e-6, target.w);
  st.size = st.size*Math.abs(k);
  S.drag = {kind:'paint', targetId:target.id, stroke:st, base, k, kY:base.bh/Math.max(1e-6, target.h), sm:null, isBrush};
  addPaintPoint(p, e, true);
  if(!isBrush){ pushEraseStroke(target); }
  requestRender();
}
function pushEraseStroke(target){
  const D = S.drag;
  if(target.type === 'draw') target.strokes.push(D.stroke);
  else target.mask.strokes.push(D.stroke);
  D.pushed = true;
}
function addPaintPoint(p, e, first){
  const D = S.drag, o = objById(D.targetId); if(!o) return;
  const lp = toLocal(o, p.x, p.y);
  let bx = lp.x*D.k + D.base.bw/2, by = lp.y*D.kY + D.base.bh/2;
  const pr = e.pointerType === 'pen' && e.pressure > 0 ? e.pressure : 0.5;
  // lissage : moyenne glissante, réglable
  const sm = clamp(S.brush.smooth, 0, 95)/100*0.85;
  if(D.sm && D.isBrush){ bx = D.sm.x*sm + bx*(1 - sm); by = D.sm.y*sm + by*(1 - sm); }
  const pts = D.stroke.pts, n = pts.length;
  if(!first && n >= 3){
    const ddx = bx - pts[n-3], ddy = by - pts[n-2];
    if(Math.hypot(ddx, ddy) < Math.max(0.6, D.stroke.size*0.04)) return;
  }
  D.sm = {x:bx, y:by};
  pts.push(round(bx, 2), round(by, 2), round(pr, 2));
}
function continuePaint(p, e){
  const D = S.drag;
  const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
  (evs.length ? evs : [e]).forEach(ev => addPaintPoint(screenToDoc(ev.clientX, ev.clientY), ev, false));
  if(!D.isBrush){ const o = objById(D.targetId); if(o) touch(o); }
  requestRender();
}
function endPaint(D){
  const o = objById(D.targetId);
  if(!o) return;
  if(D.isBrush){
    if(D.stroke.pts.length >= 3){ o.strokes.push(D.stroke); refitDraw(o); }
    else if(!o.strokes.length){ removeObjs([o.id]); }
  }
  touch(o);
  commit();
  renderSide(); renderLayersIfOpen(); updateDocInfo();
  requestRender();
}
/* Le calque de dessin se resserre sur ce qui est dessiné : il se sélectionne,
   se déplace et s'agrandit ensuite comme n'importe quel élément. */
function refitDraw(o){
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  o.strokes.forEach(s => {
    if(s.tool === 'erase') return;
    const r = s.size/2 + (s.tool === 'neon' ? s.size*1.8 : 0) + 1;
    for(let i = 0; i < s.pts.length; i += 3){
      x1 = Math.min(x1, s.pts[i] - r); x2 = Math.max(x2, s.pts[i] + r);
      y1 = Math.min(y1, s.pts[i+1] - r); y2 = Math.max(y2, s.pts[i+1] + r);
    }
  });
  if(!isFinite(x1)) return;
  const kx = o.w/o.bw, ky = o.h/o.bh;
  const lcx = ((x1 + x2)/2 - o.bw/2)*kx, lcy = ((y1 + y2)/2 - o.bh/2)*ky;
  const c = toWorld(o, lcx, lcy);
  o.strokes.forEach(s => { for(let i = 0; i < s.pts.length; i += 3){ s.pts[i] = round(s.pts[i] - x1, 2); s.pts[i+1] = round(s.pts[i+1] - y1, 2); } });
  o.bw = x2 - x1; o.bh = y2 - y1;
  o.w = o.bw*kx; o.h = o.bh*ky;
  o.x = c.x; o.y = c.y;
  touch(o);
}

/* ---------- Pipette ---------- */
function pipetteAt(sx, sy){
  let col = null;
  try{
    const d = cx.getImageData(Math.round(sx*dpr), Math.round(sy*dpr), 1, 1).data;
    col = toHex({r:d[0], g:d[1], b:d[2], a:1});
  }catch(e){}
  if(!col) return;
  applyPickedColor(col);
  setTool(S.prevTool && S.prevTool !== 'pipette' ? S.prevTool : 'select');
}
function applyPickedColor(col){
  const sel = selObjs().filter(o => o.fill);
  if(sel.length && S.prevTool !== 'brush' && S.prevTool !== 'bucket'){
    sel.forEach(o => { o.fill = solid(col); touch(o); });
    commit(); renderSide();
    toast(L('Couleur appliquée : ','Colour applied: ') + col.toUpperCase());
  }else{
    S.brush.color = col; renderSide();
    toast((S.prevTool === 'bucket' ? L('Couleur du pot de peinture : ','Paint bucket colour: ') : L('Couleur du pinceau : ','Brush colour: ')) + col.toUpperCase());
  }
  requestRender();
}

/* ---------- Pot de peinture ----------
   On regarde l'affiche telle qu'elle est vue, au pixel près, et on remplit la zone de même couleur sous le clic.
   - Une forme, un décor ou un remplissage déjà fait, touché en entier : c'est sa couleur qui change (il reste modifiable).
     S'il n'est touché qu'en partie (coupé par un trait), seule cette partie se remplit.
   - Un texte : c'est sa couleur qui change.
   - Les petits trous d'un trait mal fermé sont bouchés : la couleur ne déborde plus sur toute l'affiche.
   Le remplissage devient un élément à part, posé juste au-dessus de ce qu'on a touché (les traits restent par-dessus) :
   on peut le déplacer, le gommer, l'effacer, ou cliquer dessus avec une autre couleur pour le repeindre. */
const BUCKET_AREA = 6e6;   // au-delà, la zone est cherchée sur une image réduite : reste rapide sur les vieux PC
let _bucketBusy = false, _bucketQueue = [];
async function bucketAt(p){
  const d = S.doc; if(!d || S.drag) return;
  if(p.x < 0 || p.y < 0 || p.x >= d.w || p.y >= d.h) return;
  // un clic pendant un remplissage n'est jamais perdu : il passe juste après, avec sa couleur
  if(_bucketBusy){ if(_bucketQueue.length < 8) _bucketQueue.push({p, col:S.brush.color}); return; }
  _bucketBusy = true;
  const col = S.brush.color;   // la couleur du moment du clic, même si on en change pendant le calcul
  if(cv) cv.style.cursor = 'progress';                                   // on voit tout de suite que ça travaille
  await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));  // l'écran se met à jour avant le calcul
  try{
    await bucketFill(d, p, col);
    while(_bucketQueue.length && S.doc === d){ const q = _bucketQueue.shift(); await bucketFill(d, q.p, q.col); }
  }
  catch(e){ _bucketCache = null; toast(L('Impossible de remplir ici.','Can’t fill here.'), 'warn'); }
  finally{ _bucketBusy = false; _bucketQueue = []; if(cv) cv.style.cursor = cursorFor(S.tool); }
}
/* l'affiche dessinée pour le seau est gardée tant qu'elle n'a pas changé : les remplissages suivants sont immédiats */
let _bucketCache = null;
function bucketKey(d){ return d.id + '|' + snapshot() + '|' + Object.keys(IMG).filter(id => IMG[id].complete).length + '|' + (document.fonts ? document.fonts.status : ''); }
/* l'affiche (ou quelques éléments seuls) dessinée à l'échelle k, en pixels */
function bucketPixels(d, k, W, H, list, withBg, R){
  R = R || {x:0, y:0, w:W, h:H};   // seulement ce rectangle (en pixels de travail) : bien plus rapide
  const c = document.createElement('canvas'); c.width = R.w; c.height = R.h;
  const g = c.getContext('2d', {willReadFrequently:true});
  g.setTransform(k, 0, 0, k, -R.x, -R.y);
  if(withBg){ g.fillStyle = makePaint(g, d.bg, 0, 0, d.w, d.h); g.fillRect(0, 0, d.w, d.h); }
  list.forEach(o => drawObject(g, o, k, {}, d));
  return g.getImageData(0, 0, R.w, R.h).data;
}
/* l'élément vraiment dessiné sous ce pixel (pas seulement sa boîte), le plus haut */
function bucketHit(d, p, k, sx, sy){
  const c = document.createElement('canvas'); c.width = 3; c.height = 3;
  const g = c.getContext('2d', {willReadFrequently:true});
  for(let i = d.objects.length - 1; i >= 0; i--){
    const o = d.objects[i];
    if(!o.visible || !hitObject(o, p.x, p.y, 2/Math.max(.05, k), d)) continue;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 3, 3);
    g.setTransform(k, 0, 0, k, 1 - sx, 1 - sy);
    drawObject(g, o, k, {}, d);
    const a = g.getImageData(0, 0, 3, 3).data;
    if(a[4*4 + 3] > 24) return i;
  }
  return -1;
}
/* remplissage d'un seul tenant : renvoie le masque, sa taille et sa boîte */
function bucketFlood(ok, W, H, seed){
  const m = new Uint8Array(W*H), st = [seed];
  let cnt = 0, x1 = W, y1 = H, x2 = -1, y2 = -1;
  while(st.length){
    let j = st.pop(); if(m[j]) continue;
    const y = (j/W)|0; let x = j - y*W;
    while(x > 0 && ok[j - 1] && !m[j - 1]){ x--; j--; }
    if(x < x1) x1 = x; if(y < y1) y1 = y; if(y > y2) y2 = y;
    let up = false, dn = false;
    while(x < W && ok[j] && !m[j]){
      m[j] = 1; cnt++;
      if(y > 0){ const u = j - W; if(ok[u] && !m[u]){ if(!up){ st.push(u); up = true; } } else up = false; }
      if(y < H - 1){ const v = j + W; if(ok[v] && !m[v]){ if(!dn){ st.push(v); dn = true; } } else dn = false; }
      x++; j++;
    }
    if(x - 1 > x2) x2 = x - 1;
  }
  return {m, cnt, x1, y1, x2, y2};
}
/* même chose, mais les trous plus petits que r pixels sont bouchés : on remplit loin des bords,
   puis la couleur revient jusqu'aux traits (sans repasser par les trous) */
function bucketFloodClosed(ok, W, H, seed, r){
  const n = W*H, wall = new Uint8Array(n), tmp = new Uint8Array(n);
  // les traits épaissis de r pixels (fenêtre glissante, ligne puis colonne)
  for(let y = 0; y < H; y++){
    const o = y*W; let s = 0;
    for(let x = 0; x < Math.min(W, r); x++) s += !ok[o + x];
    for(let x = 0; x < W; x++){
      if(x + r < W) s += !ok[o + x + r];
      if(x - r - 1 >= 0) s -= !ok[o + x - r - 1];
      tmp[o + x] = s > 0;
    }
  }
  for(let x = 0; x < W; x++){
    let s = 0;
    for(let y = 0; y < Math.min(H, r); y++) s += tmp[y*W + x];
    for(let y = 0; y < H; y++){
      if(y + r < H) s += tmp[(y + r)*W + x];
      if(y - r - 1 >= 0) s -= tmp[(y - r - 1)*W + x];
      wall[y*W + x] = s > 0;
    }
  }
  if(wall[seed]) return null;
  for(let j = 0; j < n; j++) tmp[j] = ok[j] && !wall[j];
  const f = bucketFlood(tmp, W, H, seed), m = f.m;
  // la couleur revient jusqu'aux traits, sur r + 1 pixels au plus (on ne part que du bord de la zone)
  let Q = new Int32Array(4096), qt = 0, qh = 0;
  const dist = new Uint8Array(n);
  const push = j => { if(qt >= Q.length){ const z = new Int32Array(Q.length*2); z.set(Q); Q = z; } Q[qt++] = j; };
  const open = j => ok[j] && !m[j];
  for(let y = f.y1; y <= f.y2; y++) for(let x = f.x1; x <= f.x2; x++){
    const j = y*W + x;
    if(m[j] && ((x > 0 && open(j - 1)) || (x < W - 1 && open(j + 1)) || (y > 0 && open(j - W)) || (y < H - 1 && open(j + W)))) push(j);
  }
  const grow = (v, dj) => { m[v] = 1; dist[v] = dj + 1; f.cnt++; push(v);
    const vy = (v/W)|0, vx = v - vy*W; if(vx < f.x1) f.x1 = vx; if(vx > f.x2) f.x2 = vx; if(vy < f.y1) f.y1 = vy; if(vy > f.y2) f.y2 = vy; };
  while(qh < qt){
    const j = Q[qh++], dj = dist[j]; if(dj > r) continue;
    const y = (j/W)|0, x = j - y*W;
    if(x > 0 && open(j - 1)) grow(j - 1, dj);
    if(x < W - 1 && open(j + 1)) grow(j + 1, dj);
    if(y > 0 && open(j - W)) grow(j - W, dj);
    if(y < H - 1 && open(j + W)) grow(j + W, dj);
    // et en diagonale : la couleur revient à la même distance dans toutes les directions (sinon un liseré reste)
    if(y > 0){ if(x > 0 && open(j - W - 1)) grow(j - W - 1, dj); if(x < W - 1 && open(j - W + 1)) grow(j - W + 1, dj); }
    if(y < H - 1){ if(x > 0 && open(j + W - 1)) grow(j + W - 1, dj); if(x < W - 1 && open(j + W + 1)) grow(j + W + 1, dj); }
  }
  return f;
}
async function bucketFill(d, p, color){
  const col = toHex(color || S.brush.color), F = parseColor(col), tol = clamp(S.bucket.tol, 0, 100)*2.55;
  const k = Math.min(1, Math.sqrt(BUCKET_AREA/(d.w*d.h)));
  const W = Math.max(1, Math.round(d.w*k)), H = Math.max(1, Math.round(d.h*k)), n = W*H;
  // l'affiche telle qu'on la voit (sans le grain ni le vignettage, qui troubleraient les zones)
  const key = bucketKey(d), C = _bucketCache;
  const px = C && C.key === key && C.W === W && C.H === H ? C.px : bucketPixels(d, k, W, H, d.objects, true);
  _bucketCache = {key, W, H, px};
  let sx = Math.min(W - 1, Math.floor(p.x*k)), sy = Math.min(H - 1, Math.floor(p.y*k));
  const okFor = (r, g, b) => { const ok = new Uint8Array(n); for(let j = 0, q = 0; j < n; j++, q += 4) ok[j] = Math.abs(px[q] - r) <= tol && Math.abs(px[q + 1] - g) <= tol && Math.abs(px[q + 2] - b) <= tol; return ok; };
  let s0 = (sy*W + sx)*4, sr = px[s0], sg = px[s0 + 1], sb = px[s0 + 2];
  let ok = okFor(sr, sg, sb), reg = S.bucket.contig ? bucketFlood(ok, W, H, sy*W + sx) : null;
  // clic pile sur le bord adouci d'un trait : on prend la vraie couleur la plus proche, à moins de 2 pixels d'écran
  if(reg && reg.cnt < 24){
    const rr = Math.max(1, Math.round(2*k/Math.max(.01, S.zoom)));
    let best = null;
    for(let dy = -rr; dy <= rr; dy++) for(let dx = -rr; dx <= rr; dx++){
      const x = sx + dx, y = sy + dy; if(x < 0 || y < 0 || x >= W || y >= H || (!dx && !dy)) continue;
      const dd = dx*dx + dy*dy; if(best && dd >= best.dd) continue;
      const q = (y*W + x)*4;
      let flat = true;
      for(let ey = -1; ey <= 1 && flat; ey++) for(let ex = -1; ex <= 1; ex++){ const xx = Math.min(W - 1, Math.max(0, x + ex)), yy = Math.min(H - 1, Math.max(0, y + ey)), e = (yy*W + xx)*4; if(Math.abs(px[e] - px[q]) > 8 || Math.abs(px[e + 1] - px[q + 1]) > 8 || Math.abs(px[e + 2] - px[q + 2]) > 8){ flat = false; break; } }
      if(flat) best = {x, y, dd};
    }
    if(best){ sx = best.x; sy = best.y; s0 = (sy*W + sx)*4; sr = px[s0]; sg = px[s0 + 1]; sb = px[s0 + 2]; ok = okFor(sr, sg, sb); reg = bucketFlood(ok, W, H, sy*W + sx); }
  }
  if(Math.max(Math.abs(F.r - sr), Math.abs(F.g - sg), Math.abs(F.b - sb)) <= 3){ toast(L('Cette partie a déjà cette couleur : choisis-en une autre.','This part already has this colour: pick another one.'), 'warn'); return; }
  const near = cc => { const q = parseColor(cc); return Math.max(Math.abs(q.r - sr), Math.abs(q.g - sg), Math.abs(q.b - sb)) <= Math.max(tol, 12); };
  // l'élément vraiment dessiné sous le clic
  const hi = bucketHit(d, {x:(sx + .5)/k, y:(sy + .5)/k}, k, sx, sy);
  const hit = hi >= 0 ? d.objects[hi] : null;
  if(hit && !hit.locked && hit.type === 'text' && hit.fill && hit.fill.type === 'solid' && near(hit.fill.color)){
    _bucketCache = null; hit.fill = solid(col); touch(hit); commit(); renderSide(); requestRender(); return;
  }
  // la zone
  if(reg){
    const r = Math.round(clamp(S.bucket.gap || 0, 0, 40)*k);
    if(r >= 1 && reg.cnt > Math.max(64, n*0.01)){   // une fuite donne toujours une grande zone
      if(n <= 1.3e6){
        const c = bucketFloodClosed(ok, W, H, sy*W + sx, r);
        if(c && reg.cnt > c.cnt*1.25 + 64) reg = c;   // la couleur fuyait par un trou : on garde la zone bouchée
      }else{
        // grande affiche : on cherche les trous sur une image deux fois plus petite (4 fois moins de calcul),
        // puis on garde la zone exacte, au pixel près, là où la couleur a le droit d'aller
        const W2 = (W + 1) >> 1, H2 = (H + 1) >> 1, ok2 = new Uint8Array(W2*H2);
        for(let y = 0; y < H2; y++) for(let x = 0; x < W2; x++){
          const j = 2*y*W + 2*x, xr = 2*x + 1 < W, yd = 2*y + 1 < H;
          ok2[y*W2 + x] = ok[j] && (!xr || ok[j + 1]) && (!yd || ok[j + W]) && (!xr || !yd || ok[j + W + 1]);
        }
        const s2 = (sy >> 1)*W2 + (sx >> 1);
        const c = ok2[s2] ? bucketFloodClosed(ok2, W2, H2, s2, Math.max(1, Math.round(r/2))) : null;
        if(c && reg.cnt > c.cnt*4*1.25 + 256){
          const m2 = c.m, g2 = new Uint8Array(W2*H2);
          for(let y = c.y1; y <= c.y2; y++) for(let x = c.x1; x <= c.x2; x++) if(m2[y*W2 + x])
            for(let ey = Math.max(0, y - 1); ey <= Math.min(H2 - 1, y + 1); ey++) for(let ex = Math.max(0, x - 1); ex <= Math.min(W2 - 1, x + 1); ex++) g2[ey*W2 + ex] = 1;
          const m = reg.m, f = {m, cnt:0, x1:W, y1:H, x2:-1, y2:-1};
          for(let y = reg.y1; y <= reg.y2; y++) for(let x = reg.x1; x <= reg.x2; x++){
            const j = y*W + x; if(!m[j]) continue;
            if(!g2[(y >> 1)*W2 + (x >> 1)]){ m[j] = 0; continue; }
            f.cnt++; if(x < f.x1) f.x1 = x; if(x > f.x2) f.x2 = x; if(y < f.y1) f.y1 = y; if(y > f.y2) f.y2 = y;
          }
          reg = bucketFlood(m, W, H, sy*W + sx);   // seulement la partie reliée au clic
        }
      }
    }
  }else{
    reg = {m:ok, cnt:0, x1:W, y1:H, x2:-1, y2:-1};
    for(let j = 0; j < n; j++) if(ok[j]){ reg.cnt++; const y = (j/W)|0, x = j - y*W; if(x < reg.x1) reg.x1 = x; if(x > reg.x2) reg.x2 = x; if(y < reg.y1) reg.y1 = y; if(y > reg.y2) reg.y2 = y; }
  }
  const m = reg.m;
  // une forme, un décor ou un remplissage touché en entier : on change sa couleur à lui
  if(hit && !hit.locked && ((hit.type === 'shape' || hit.type === 'path') && hit.fill && hit.fill.type === 'solid' && near(hit.fill.color) || hit.bucket && near(hit.bucket))){
    const bb = aabb(hit), ax = clamp(Math.floor(bb.x1*k) - 1, 0, W - 1), ay = clamp(Math.floor(bb.y1*k) - 1, 0, H - 1);
    const Rb = {x:ax, y:ay, w:clamp(Math.ceil(bb.x2*k) + 1, ax + 1, W) - ax, h:clamp(Math.ceil(bb.y2*k) + 1, ay + 1, H) - ay};
    const A = bucketPixels(d, k, W, H, [hit], false, Rb);
    let V = 0, R = 0;
    for(let y = 0; y < Rb.h; y++) for(let x = 0; x < Rb.w; x++){ const j = (y + Rb.y)*W + x + Rb.x; if(A[(y*Rb.w + x)*4 + 3] > 128 && ok[j]){ V++; if(m[j]) R++; } }
    if(R >= V*0.97 && reg.cnt - R <= Math.max(24, reg.cnt*0.02)){
      _bucketCache = null;
      if(hit.bucket) await recolorBucket(hit, col);
      else{ hit.fill = solid(col); touch(hit); commit(); renderSide(); requestRender(); }
      return;
    }
  }
  // ce qui est posé au-dessus (les traits) : la couleur passe dessous, pour ne laisser aucun liseré
  const X1 = Math.max(0, reg.x1 - 3), Y1 = Math.max(0, reg.y1 - 3), X2 = Math.min(W - 1, reg.x2 + 3), Y2 = Math.min(H - 1, reg.y2 + 3);
  const bw = X2 - X1 + 1, bh = Y2 - Y1 + 1, a = new Uint8Array(bw*bh);
  const up = d.objects.slice(hi + 1).filter(o => { if(!o.visible) return false; const b = aabb(o); return b.x2*k >= X1 - 2 && b.x1*k <= X2 + 2 && b.y2*k >= Y1 - 2 && b.y1*k <= Y2 + 2; });
  const U = up.length ? bucketPixels(d, k, W, H, up, false, {x:X1, y:Y1, w:bw, h:bh}) : null;
  for(let y = Y1; y <= Y2; y++) for(let x = X1; x <= X2; x++) if(m[y*W + x]) a[(y - Y1)*bw + x - X1] = 255;
  if(U){
    for(let step = 1; step <= 3; step++){
      let added = 0;
      for(let y = 0; y < bh; y++) for(let x = 0; x < bw; x++){
        const i = y*bw + x; if(a[i] || U[i*4 + 3] < 8) continue;
        const e = v => a[v] === 255 || (a[v] && a[v] < step);   // les pixels pris à ce tour ne comptent pas encore
        if((x > 0 && e(i - 1)) || (x < bw - 1 && e(i + 1)) || (y > 0 && e(i - bw)) || (y < bh - 1 && e(i + bw))){ a[i] = step; added++; }
      }
      if(!added) break;
    }
    for(let i = 0; i < a.length; i++) if(a[i] && a[i] < 255) a[i] = 255;
  }
  // le pixel de bord adouci : on y met juste la part de couleur qui revient à la zone
  for(let y = 0; y < bh; y++) for(let x = 0; x < bw; x++){
    const i = y*bw + x; if(a[i]) continue;
    const gx = x + X1, gy = y + Y1, j = gy*W + gx;
    if(!((gx > 0 && m[j - 1]) || (gx < W - 1 && m[j + 1]) || (gy > 0 && m[j - W]) || (gy < H - 1 && m[j + W]))) continue;
    let bj = -1, bd = -1;
    for(const v of [gx > 0 ? j - 1 : -1, gx < W - 1 ? j + 1 : -1, gy > 0 ? j - W : -1, gy < H - 1 ? j + W : -1]){
      if(v < 0 || m[v]) continue;
      const q = v*4, dd = Math.max(Math.abs(px[q] - sr), Math.abs(px[q + 1] - sg), Math.abs(px[q + 2] - sb));
      if(dd > bd){ bd = dd; bj = v; }
    }
    const q = j*4, B = bj >= 0 ? bj*4 : q;
    const er = sr - px[B], eg = sg - px[B + 1], eb = sb - px[B + 2], ee = er*er + eg*eg + eb*eb;
    if(ee < 300) continue;
    const t = ((px[q] - px[B])*er + (px[q + 1] - px[B + 1])*eg + (px[q + 2] - px[B + 2])*eb)/ee;
    a[i] = Math.round(clamp(t, 0, 1)*255);
  }
  const out = document.createElement('canvas'); out.width = bw; out.height = bh;
  const og = out.getContext('2d'), id = og.createImageData(bw, bh), od = id.data;
  for(let i = 0; i < a.length; i++) if(a[i]){ const q = i*4; od[q] = F.r; od[q + 1] = F.g; od[q + 2] = F.b; od[q + 3] = a[i]; }
  og.putImageData(id, 0, 0);
  // l'affiche gardée en mémoire reçoit la couleur, pour que le prochain clic n'ait rien à redessiner
  for(let y = 0; y < bh; y++) for(let x = 0; x < bw; x++){
    const i = y*bw + x, al = a[i]; if(!al || (U && U[i*4 + 3] >= 8)) continue;
    const q = ((y + Y1)*W + x + X1)*4, t = al/255;
    px[q] += (F.r - px[q])*t; px[q + 1] += (F.g - px[q + 1])*t; px[q + 2] += (F.b - px[q + 2])*t;
  }
  const aid = await bucketAsset(await canvasPng(out)); if(!aid || S.doc !== d){ _bucketCache = null; return; }
  const o = mkImage(aid, (X1 + bw/2)/k, (Y1 + bh/2)/k, bw/k, bh/k, bw, bh, {name:L('Remplissage','Fill'), bucket:col});
  insertObj(o, hi + 1);
  commit(); renderLayersIfOpen(); requestRender();
  if(_bucketCache && _bucketCache.px === px) _bucketCache.key = bucketKey(d);
}
/* l'image du remplissage, encodée sans figer la page quand le navigateur le permet */
function canvasPng(c){
  return new Promise(res => {
    if(!c.toBlob) return res(c.toDataURL('image/png'));
    c.toBlob(b => { if(!b) return res(c.toDataURL('image/png')); const fr = new FileReader(); fr.onload = () => res(fr.result); fr.onerror = () => res(c.toDataURL('image/png')); fr.readAsDataURL(b); }, 'image/png');
  });
}
async function bucketAsset(src){
  const im = new Image(); im.src = src;
  try{ await im.decode(); }catch(e){ return null; }
  const id = uid('a'); S.doc.assets[id] = src; IMG[id] = im;
  return id;
}
async function recolorBucket(o, col){
  const im = getImage(S.doc, o.asset); if(!im) return;
  const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
  const g = c.getContext('2d'); g.drawImage(im, 0, 0);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
  const id = await bucketAsset(await canvasPng(c)); if(!id || !objById(o.id)) return;
  o.asset = id; o.bucket = col; touch(o);
  commit(); renderSide(); requestRender();
}

/* ---------- Édition de texte sur l'affiche ---------- */
function startTextEdit(o, selectAll){
  const ta = document.getElementById('textEdit'); if(!ta) return;
  S.editingId = o.id;
  ta.value = o.text;
  ta.classList.remove('hidden');
  positionTextEdit();
  requestRender();
  setTimeout(() => { ta.focus(); if(selectAll) ta.select(); else ta.setSelectionRange(ta.value.length, ta.value.length); }, 0);
  ta.oninput = () => {
    const ob = objById(S.editingId); if(!ob) return;
    const h0 = ob.h;
    ob.text = ta.value;
    fitTextHeight(ob);
    // le haut du bloc reste en place pendant la frappe
    const dh = (ob.h - h0)/2, c = toWorld(ob, 0, dh*(ob.flipY ? -1 : 1));
    ob.x = c.x; ob.y = c.y;
    touch(ob);
    positionTextEdit(); syncFields(); renderLayersIfOpen();
    const tf = document.querySelector('[data-bind="text"]'); if(tf && tf !== document.activeElement) tf.value = ob.text;
    scheduleSave();
  };
  ta.onkeydown = e => {
    if(e.key === 'Escape'){ e.preventDefault(); endTextEdit(); }
    e.stopPropagation();
  };
  ta.onblur = () => { setTimeout(() => { if(document.activeElement !== ta) endTextEdit(); }, 0); };
}
function positionTextEdit(){
  const ta = document.getElementById('textEdit');
  if(!ta || !S.editingId) return;
  const o = objById(S.editingId); if(!o){ endTextEdit(); return; }
  const z = S.zoom, p = docToScreen(o.x, o.y);
  const lay = layoutText(o);
  const col = o.fill && o.fill.type === 'solid' ? o.fill.color : (o.fill && o.fill.stops ? o.fill.stops[0].c : '#fff');
  // marge invisible au-dessus et au-dessous : les lettres hautes ne sont jamais rognées pendant la frappe
  const pad = Math.round(o.size*z*.45);
  Object.assign(ta.style, {
    left:(p.x - o.w*z/2) + 'px', top:(p.y - o.h*z/2 - pad) + 'px', width:(o.w*z) + 'px', height:(o.h*z + 2 + pad*2) + 'px',
    padding:pad + 'px 0', outlineOffset:(4 - pad) + 'px',
    font:(o.italic ? 'italic ' : '') + (o.weight||400) + ' ' + (o.size*z) + 'px "' + o.font + '", Inter, sans-serif',
    lineHeight:String(o.lineHeight || 1), letterSpacing:(lay.ls*z) + 'px', textAlign:o.align || 'center',
    textTransform:o.upper ? 'uppercase' : 'none', color:colorAlpha(col) < 0.15 ? '#D9363E' : toHex(col),
    transform:'rotate(' + (o.rot||0) + 'deg) scale(' + (o.flipX ? -1 : 1) + ',' + (o.flipY ? -1 : 1) + ')'
  });
}
function endTextEdit(){
  const ta = document.getElementById('textEdit');
  const id = S.editingId;
  S.editingId = null;
  if(ta){ ta.classList.add('hidden'); ta.oninput = ta.onkeydown = ta.onblur = null; }
  const o = objById(id);
  if(o && !o.text.trim()){ removeObjs([o.id]); }
  if(id){ commit(); renderSide(); renderLayersIfOpen(); }
  requestRender();
}

/* ---------- Insertion, suppression, ordre ---------- */
function insertObj(o, index){
  const d = S.doc;
  if(index == null){
    const s = selObjs();
    index = s.length ? Math.max(...s.map(x => d.objects.indexOf(x))) + 1 : d.objects.length;
  }
  d.objects.splice(index, 0, o);
  touch(o);
  updateDocInfo();
}
function addObjects(list, select){
  list.forEach(o => { if(o.type === 'text') fitTextHeight(o); insertObj(o, S.doc.objects.length); });
  if(select !== false) setSel(list.map(o => o.id));
  commit(); requestRender();
}
function removeObjs(ids){
  S.doc.objects = S.doc.objects.filter(o => !ids.includes(o.id));
  S.sel = S.sel.filter(id => !ids.includes(id));
  updateDocInfo();
}
function deleteSel(){
  const ids = selObjs().filter(o => !o.locked).map(o => o.id);
  if(!ids.length) return;
  removeObjs(ids); commit(); renderSide(); renderLayersIfOpen(); requestRender();
}
function cloneObj(o, dx, dy){
  const c = deepClone(o); c.id = uid(); c.x += dx; c.y += dy; delete c._v; return c;
}
function duplicateSel(inPlace){
  const sel = selObjs(); if(!sel.length) return;
  const off = inPlace ? 0 : Math.min(S.doc.w, S.doc.h)*.02;
  const copies = sel.map(o => cloneObj(o, off, off));
  const top = Math.max(...sel.map(o => S.doc.objects.indexOf(o)));
  copies.forEach((c, i) => S.doc.objects.splice(top + 1 + i, 0, c));
  S.sel = copies.map(c => c.id);
  updateDocInfo();
  if(!inPlace){ commit(); renderSide(); renderLayersIfOpen(); requestRender(); }
}
function copySel(){
  const sel = selObjs(); if(!sel.length) return;
  const assets = {};
  sel.forEach(o => { if(o.type === 'image' && o.asset) assets[o.asset] = S.doc.assets[o.asset]; });
  S.clipboard = {objects:deepClone(sel), assets, n:0};
  S.clipText = 'Raging Draw · ' + sel.length;
  try{ navigator.clipboard && navigator.clipboard.writeText && navigator.clipboard.writeText(S.clipText).catch(() => {}); }catch(e){}
}
function pasteInternal(){
  const c = S.clipboard; if(!c) return;
  c.n++;
  const off = Math.min(S.doc.w, S.doc.h)*.02*c.n;
  Object.assign(S.doc.assets, c.assets);
  const list = c.objects.map(o => cloneObj(o, off, off));
  list.forEach(o => insertObj(o, S.doc.objects.length));
  setSel(list.map(o => o.id)); commit(); requestRender();
}
function arrange(dir){
  const d = S.doc, sel = selObjs(); if(!sel.length) return;
  const ids = new Set(sel.map(o => o.id));
  let arr = d.objects.slice();
  if(dir === 'front'){ arr = arr.filter(o => !ids.has(o.id)).concat(arr.filter(o => ids.has(o.id))); }
  else if(dir === 'back'){ arr = arr.filter(o => ids.has(o.id)).concat(arr.filter(o => !ids.has(o.id))); }
  else if(dir === 'up'){ for(let i = arr.length - 2; i >= 0; i--) if(ids.has(arr[i].id) && !ids.has(arr[i+1].id)){ [arr[i], arr[i+1]] = [arr[i+1], arr[i]]; } }
  else if(dir === 'down'){ for(let i = 1; i < arr.length; i++) if(ids.has(arr[i].id) && !ids.has(arr[i-1].id)){ [arr[i], arr[i-1]] = [arr[i-1], arr[i]]; } }
  d.objects = arr;
  commit(); renderLayersIfOpen(); requestRender();
}
/* Aligner : un seul élément s'aligne sur l'affiche ; plusieurs s'alignent entre eux. */
function alignSel(how){
  const sel = selObjs().filter(o => !o.locked); if(!sel.length) return;
  const ref = sel.length === 1 ? {x1:0, y1:0, x2:S.doc.w, y2:S.doc.h} : unionBox(sel);
  sel.forEach(o => {
    const b = aabb(o);
    if(how === 'l') o.x += ref.x1 - b.x1;
    if(how === 'r') o.x += ref.x2 - b.x2;
    if(how === 'ch') o.x += (ref.x1 + ref.x2)/2 - (b.x1 + b.x2)/2;
    if(how === 't') o.y += ref.y1 - b.y1;
    if(how === 'b') o.y += ref.y2 - b.y2;
    if(how === 'cv') o.y += (ref.y1 + ref.y2)/2 - (b.y1 + b.y2)/2;
  });
  commit(); syncFields(); requestRender();
}
function distributeSel(axis){
  const sel = selObjs().filter(o => !o.locked); if(sel.length < 3) return;
  const k = axis === 'h' ? ['x1','x2'] : ['y1','y2'];
  const items = sel.map(o => ({o, b:aabb(o)})).sort((a, b) => a.b[k[0]] - b.b[k[0]]);
  const total = items.reduce((s, it) => s + it.b[k[1]] - it.b[k[0]], 0);
  const span = items[items.length-1].b[k[1]] - items[0].b[k[0]];
  const gap = (span - total)/(items.length - 1);
  let pos = items[0].b[k[0]];
  items.forEach(it => {
    const d = pos - it.b[k[0]];
    if(axis === 'h') it.o.x += d; else it.o.y += d;
    pos += it.b[k[1]] - it.b[k[0]] + gap;
  });
  commit(); syncFields(); requestRender();
}

/* ---------- Images ---------- */
function pickImageFile(target){
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*,.svg'; inp.multiple = !target;
  inp.onchange = () => { [...inp.files].forEach((f, i) => addImageFile(f, i === 0 ? target : null)); };
  inp.click();
}
function loadImageMeta(src){
  return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; });
}
async function addImageFile(file, target, at){
  if(file.size > 60*1024*1024){ toast(L('Image trop lourde (plus de 60 Mo).','Image too large (over 60 MB).'), 'warn'); return; }
  let src;
  try{ src = await readFileAsDataURL(file); }catch(e){ toast(L('Impossible de lire ce fichier.','Couldn’t read this file.'), 'warn'); return; }
  let im;
  try{ im = await loadImageMeta(src); }catch(e){ toast(L('Ce fichier n’est pas une image lisible.','This file isn’t a readable image.'), 'warn'); return; }
  let nw = im.naturalWidth || 1000, nh = im.naturalHeight || 1000;
  // les SVG sans taille : on leur donne une grande taille pour qu'ils restent nets
  if(/svg/.test(file.type) && Math.max(nw, nh) < 2000){ const k = 2000/Math.max(nw, nh); nw *= k; nh *= k; }
  const id = uid('a');
  S.doc.assets[id] = src; IMG[id] = im;
  if(target && target.type === 'image'){
    fillFrameWith(target, id, nw, nh);
    setSel([target.id]);
  }else{
    const W = S.doc.w, H = S.doc.h;
    const k = Math.min(W*.7/nw, H*.7/nh);
    const o = mkImage(id, at ? at.x : W/2, at ? at.y : H/2, nw*k, nh*k, nw, nh);
    o.name = file.name.replace(/\.[^.]+$/, '').slice(0, 40);
    insertObj(o, S.doc.objects.length);
    setSel([o.id]);
  }
  commit(); requestRender(); renderFlyoutIf('images');
  toast(L('Image ajoutée · ','Image added · ') + Math.round(nw) + ' × ' + Math.round(nh) + ' px');
}
/* Remplit un cadre photo (ou remplace une image) en couvrant tout le cadre, sans déformer. */
function fillFrameWith(o, id, nw, nh){
  o.asset = id; o.nw = nw; o.nh = nh;
  const far = Math.abs(o.w/o.h), iar = nw/nh;
  o.crop = {l:0, t:0, r:0, b:0};
  if(iar > far){ const c = (1 - far/iar)/2; o.crop.l = o.crop.r = round(c, 4); }
  else{ const c = (1 - iar/far)/2; o.crop.t = o.crop.b = round(c, 4); }
  touch(o);
}
function coverDoc(o, contain){
  const W = S.doc.w, H = S.doc.h;
  o.rot = 0; o.x = W/2; o.y = H/2;
  if(contain){
    o.crop = {l:0, t:0, r:0, b:0};
    const k = Math.min(W/o.nw, H/o.nh); o.w = o.nw*k; o.h = o.nh*k;
  }else{ o.w = W; o.h = H; fillFrameWith(o, o.asset, o.nw, o.nh); }
  touch(o);
}

/* ---------- Clavier ---------- */
function isTyping(e){
  const t = e.target;
  return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
}
function onKeyDown(e){
  if(S.view !== 'editor' || document.querySelector('.mmd-backdrop, .modal-backdrop')) return;
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if(e.key === ' ' && !isTyping(e)){ if(!S.spaceDown){ S.spaceDown = true; if(cv) cv.style.cursor = 'grab'; } e.preventDefault(); return; }
  if(mod && k === 'z' && !isTyping(e)){ e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if(mod && k === 'y' && !isTyping(e)){ e.preventDefault(); redo(); return; }
  if(mod && k === 's'){ e.preventDefault(); saveDoc().then(() => toast(L('Affiche enregistrée dans ce navigateur.','Poster saved in this browser.'))); return; }
  if(mod && k === 'e'){ e.preventDefault(); openExport(); return; }
  if(isTyping(e)) return;
  if(mod && k === 'a'){ e.preventDefault(); setSel(S.doc.objects.filter(o => o.visible && !o.locked).map(o => o.id)); return; }
  if(mod && k === 'd'){ e.preventDefault(); duplicateSel(); return; }
  if(mod && k === 'c'){ copySel(); return; }
  if(mod && k === 'x'){ copySel(); deleteSel(); return; }
  if(mod && k === '0'){ e.preventDefault(); fitView(); return; }
  if(mod && k === '1'){ e.preventDefault(); zoomAt(1); return; }
  if(mod && (e.key === '=' || e.key === '+')){ e.preventDefault(); zoomStep(1); return; }
  if(mod && e.key === '-'){ e.preventDefault(); zoomStep(-1); return; }
  if(mod && e.key === ']'){ e.preventDefault(); arrange(e.shiftKey ? 'front' : 'up'); return; }
  if(mod && e.key === '['){ e.preventDefault(); arrange(e.shiftKey ? 'back' : 'down'); return; }
  if(mod) return;
  if(e.key === 'Delete' || e.key === 'Backspace'){ e.preventDefault(); deleteSel(); return; }
  if(e.key === 'Escape'){ if(S.tool !== 'select') setTool('select'); else setSel([]); return; }
  if(e.key === 'Enter'){ const o = sel1(); if(o && o.type === 'text'){ e.preventDefault(); startTextEdit(o); } return; }
  if(e.key.startsWith('Arrow')){
    const sel = selObjs().filter(o => !o.locked); if(!sel.length) return;
    e.preventDefault();
    const st = e.shiftKey ? 10 : 1;
    sel.forEach(o => { if(e.key === 'ArrowLeft') o.x -= st; if(e.key === 'ArrowRight') o.x += st; if(e.key === 'ArrowUp') o.y -= st; if(e.key === 'ArrowDown') o.y += st; });
    syncFields(); requestRender(); scheduleCommit();
    return;
  }
  if(e.key === '[' || e.key === ']'){
    const t = S.tool === 'eraser' ? S.eraser : S.brush;
    t.size = clamp(Math.round(t.size*(e.key === ']' ? 1.2 : 1/1.2)), 1, 600);
    syncFields(); requestRender(); return;
  }
  if(e.key === '+' || e.key === '='){ zoomStep(1); return; }
  if(e.key === '-'){ zoomStep(-1); return; }
  const map = {v:'select', h:'hand', b:'brush', e:'eraser', t:'text', r:'rect', o:'ellipse', l:'line', k:'pipette', g:'bucket'};
  if(map[k]){ setTool(map[k]); return; }
  if(k === 'i'){ pickImageFile(null); return; }
}
const scheduleCommit = debounce(() => commit(), 400);
function onKeyUp(e){
  if(e.key === ' '){ S.spaceDown = false; if(cv) cv.style.cursor = cursorFor(S.tool); }
}
function onPaste(e){
  if(S.view !== 'editor' || isTyping(e)) return;
  const items = [...((e.clipboardData && e.clipboardData.items) || [])];
  const files = items.filter(it => it.kind === 'file' && /^image\//.test(it.type)).map(it => it.getAsFile()).filter(Boolean);
  if(files.length){ e.preventDefault(); const s = sel1(); files.forEach((f, i) => addImageFile(f, i === 0 && s && s.type === 'image' && !s.asset ? s : null)); return; }
  const txt = e.clipboardData ? e.clipboardData.getData('text/plain') : '';
  if(S.clipboard && (!txt || txt === S.clipText)){ e.preventDefault(); pasteInternal(); return; }
  if(txt && txt.trim()){
    e.preventDefault();
    const W = S.doc.w, H = S.doc.h;
    const o = mkText(txt.trim().slice(0, 2000), W/2, H/2, W*.7, {font:'Inter', size:Math.round(Math.min(W, H)*.04), lineHeight:1.25});
    addObjects([o]);
  }
}
