/* =====================================================================
   RAGING 3D — INTERFACE
   Une barre du haut, un panneau à gauche (lieu, personnages, pose, réglages),
   l'image au centre, la ligne de temps en bas. Rien de plus.
===================================================================== */
const HUB = () => getLang() === 'fr' ? '../fr/' : '../';

function renderUI(){
  const app = document.getElementById('app');
  document.documentElement.lang = getLang();
  if(!app.querySelector('.topbar')){
    app.innerHTML = `
      <header class="topbar">
        <div class="topbar-left">
          <a class="btn tb-back" id="tbBack" href="${HUB()}">${icon('back')}<span class="tb-lbl" id="tbBackLbl"></span></a>
          <a class="brand" id="tbBrand" href="${HUB()}">${r3Logo(34, 'brand-logo')}${r3Wordmark()}</a>
          <span class="tb-div"></span>
          <input class="tb-title" id="tbTitle" spellcheck="false" maxlength="80">
        </div>
        <div class="topbar-right">
          <button class="btn tb-icon" data-act="undo" id="tbUndo">${icon('undo')}</button>
          <button class="btn tb-icon" data-act="redo" id="tbRedo">${icon('redo')}</button>
          <span class="tb-div"></span>
          <div class="lang-flags" role="group" aria-label="Language / Langue"><button data-act="lang" data-l="fr">FR</button><button data-act="lang" data-l="en">EN</button></div>
          <div class="menu-wrap">
            <button class="btn btn-primary" data-act="exportMenu" id="tbExport">${icon('export')}<span class="tb-lbl" id="tbExportLbl"></span></button>
            <div class="menu hidden" id="exportMenu"></div>
          </div>
        </div>
      </header>
      <div class="main">
        <aside class="side" id="side"></aside>
        <section class="work">
          <div class="stage-wrap" id="stageWrap">
            <div class="stage" id="stage"><canvas id="view"></canvas><div class="stage-bar" id="stageBar"></div><div class="hint" id="hint"></div><div class="rec hidden" id="recBox"></div></div>
          </div>
          <div class="timeline" id="timeline"></div>
        </section>
      </div>`;
  }
  const t = document.getElementById('tbTitle'); if(document.activeElement !== t) t.value = S.doc.title;
  t.placeholder = L('Titre de la scène', 'Scene title');
  document.getElementById('tbBackLbl').textContent = 'Raging Studio';
  document.getElementById('tbBack').title = L('Retour à l’accueil de Raging Studio', 'Back to Raging Studio home');
  document.getElementById('tbBack').href = HUB(); document.getElementById('tbBrand').href = HUB();
  document.getElementById('tbBrand').title = L('Retour à l’accueil de Raging Studio', 'Back to Raging Studio home');
  document.getElementById('tbUndo').title = L('Annuler (Ctrl+Z)', 'Undo (Ctrl+Z)'); document.getElementById('tbRedo').title = L('Rétablir (Ctrl+Y)', 'Redo (Ctrl+Y)');
  document.querySelectorAll('.lang-flags button').forEach(b => b.classList.toggle('on', b.dataset.l === getLang()));
  document.getElementById('tbExportLbl').textContent = L('Exporter', 'Export');
  document.getElementById('exportMenu').innerHTML =
    `<button data-act="exportVideo">${icon('film')}<span><b>${L('Vidéo', 'Video')}</b><small>${L('Toute la scène, en 1280 × 720', 'The whole scene, 1280 × 720')}</small></span></button>
     <button data-act="exportImage">${icon('image')}<span><b>${L('Image', 'Image')}</b><small>${L('Ce plan, en PNG 1920 × 1080 : pour ton storyboard', 'This shot, as a 1920 × 1080 PNG: for your storyboard')}</small></span></button>`;
  renderSide(); renderTimeline(); renderStageBar(); renderHint(); fitStage();
}

/* ---------- Panneau de gauche ---------- */
function slider(label, act, i, v, min, max, step, unit){
  return `<label class="sl"><span class="sl-h"><span>${esc(label)}</span><b>${round(v, step < 1 ? 2 : 0)}${unit || '°'}</b></span>
    <input type="range" data-act="${act}" data-i="${i}" min="${min}" max="${max}" step="${step}" value="${v}"></label>`;
}
function renderSide(onlyValues){
  const el = document.getElementById('side'); if(!el) return;
  const sel = S.sel, chars = S.cur.chars;
  if(onlyValues && el.querySelector('.sec-part')){
    // pendant un glissé : on met juste à jour les chiffres et les curseurs
    el.querySelectorAll('.sl input').forEach(inp => {
      const i = +inp.dataset.i, act = inp.dataset.act; let v;
      if(act === 'axis' && sel) v = chars[sel.c].j[sel.j][i];
      else if(act === 'root' && sel) v = i === 0 ? chars[sel.c].root.ry : chars[sel.c].root.y;
      if(v == null) return;
      inp.value = v; inp.closest('.sl').querySelector('b').textContent = round(v, inp.step < 1 ? 2 : 0) + (act === 'root' && i === 1 ? ' m' : '°');
    });
    return;
  }
  const place = SETS.map(s => `<button class="chip-btn place ${S.doc.set === s.id ? 'on' : ''}" data-act="place" data-id="${s.id}"><i class="sw sw-${s.id}"></i>${esc(L(s.fr, s.en))}</button>`).join('');
  const who = chars.map((c, i) => `<div class="who ${sel && sel.c === i ? 'on' : ''}">
      <button class="who-main" data-act="pickChar" data-c="${i}"><i class="dot" style="background:${CHAR_LOOK[i].col}"></i>${esc(L(CHAR_LOOK[i].fr, CHAR_LOOK[i].en))}</button>
      ${i === 1 ? `<button class="who-x" data-act="removeChar" title="${esc(L('Retirer ce personnage', 'Remove this character'))}">${icon('close')}</button>` : ''}
    </div>`).join('') + (chars.length < 2 ? `<button class="add" data-act="addChar">${icon('plus')}${L('Ajouter un 2ᵉ personnage', 'Add a 2nd character')}</button>` : '');
  const target = sel ? sel.c : 0;
  const poses = POSES.map(p => `<button class="chip-btn" data-act="pose" data-id="${p.id}">${esc(L(p.fr, p.en))}</button>`).join('');
  let part;
  if(sel){
    const J = JOINT[sel.j], v = chars[sel.c].j[sel.j], ch = chars[sel.c];
    part = `<div class="part-h"><b>${esc(L(J.fr, J.en))}</b><span>${esc(L(CHAR_LOOK[sel.c].fr, CHAR_LOOK[sel.c].en))}</span></div>
      ${J.ax.map((a, i) => slider(L(a[4], a[5]), 'axis', i, v[i], a[2], a[3], 1)).join('')}
      ${sel.j === 'pelvis' ? `<p class="tip">${L('Glisse le bassin pour déplacer le personnage.', 'Drag the hips to move the character.')}</p>
        ${slider(L('Tout le corps : tourner', 'Whole body: turn'), 'root', 0, ch.root.ry, -180, 180, 1)}
        ${slider(L('Tout le corps : hauteur', 'Whole body: height'), 'root', 1, ch.root.y, -0.8, 1.2, 0.01, ' m')}` : ''}
      <button class="btn btn-sm btn-ghost" data-act="resetPart">${icon('reset')}${L('Remettre droit', 'Straighten')}</button>`;
  } else {
    part = `<p class="tip">${L('Clique sur une partie du corps dans l’image, puis glisse pour la bouger. Les curseurs apparaîtront ici.', 'Click a body part in the picture, then drag to move it. The sliders will show up here.')}</p>`;
  }
  el.innerHTML = `
    <div class="sec"><h3>${L('Lieu', 'Place')}</h3><div class="grid2">${place}</div></div>
    <div class="sec"><h3>${L('Personnages', 'Characters')}</h3>${who}</div>
    <div class="sec"><h3>${L('Pose rapide', 'Quick pose')} <span class="for">${esc(L(CHAR_LOOK[target].fr, CHAR_LOOK[target].en))}</span></h3><div class="chips">${poses}</div></div>
    <div class="sec sec-part"><h3>${L('Partie du corps', 'Body part')}</h3>${part}</div>
    <div class="side-foot"><button class="btn btn-sm btn-ghost" data-act="newScene">${icon('new')}${L('Nouvelle scène', 'New scene')}</button><button class="btn btn-sm btn-ghost" data-act="help">${icon('help')}${L('Aide', 'Help')}</button></div>`;
}

/* ---------- Barre de l'image : caméra du film ou vue libre, focale ---------- */
function renderStageBar(){
  const el = document.getElementById('stageBar'); if(!el) return;
  const c = activeCam();
  el.innerHTML = `<div class="seg">
      <button class="${!S.freeView ? 'on' : ''}" data-act="camFilm" title="${esc(L('Ce que tu vois sera filmé', 'What you see will be filmed'))}">${icon('camera')}<span class="sb-lbl">${L('Caméra du film', 'Film camera')}</span></button>
      <button class="${S.freeView ? 'on' : ''}" data-act="camFree" title="${esc(L('Regarde la scène sous un autre angle, sans changer le plan filmé', 'Look at the scene from another angle without changing the filmed shot'))}">${icon('eye')}<span class="sb-lbl">${L('Vue libre', 'Free view')}</span></button>
    </div>
    <div class="seg lens" title="${esc(L('Focale : 24 mm grand angle, 85 mm serré', 'Lens: 24 mm wide, 85 mm tight'))}">${LENSES.map(l => `<button class="${Math.round(c.lens) === l ? 'on' : ''}" data-act="lens" data-l="${l}">${l}</button>`).join('')}<span>mm</span></div>`;
  document.getElementById('stage').classList.toggle('free', S.freeView);
}
function renderHint(){
  const el = document.getElementById('hint'); if(!el) return;
  let t;
  if(S.freeView) t = L('Vue libre : ce que tu vois ici n’est pas filmé. Reviens à « Caméra du film » pour cadrer.', 'Free view: what you see here is not filmed. Go back to “Film camera” to frame your shot.');
  else if(S.hover) t = L(JOINT[S.hover.j].fr, JOINT[S.hover.j].en) + ' · ' + (S.hover.j === 'pelvis' ? L('glisse pour déplacer le personnage', 'drag to move the character') : L('glisse pour bouger', 'drag to move'));
  else if(S.sel) t = L('Glisse la partie verte pour la bouger · Clique dans le vide pour désélectionner', 'Drag the green part to move it · Click empty space to deselect');
  else t = L('Clique sur une partie du corps · Glisse dans le vide pour tourner la caméra · Molette pour zoomer · Maj + glisser pour décaler', 'Click a body part · Drag empty space to orbit the camera · Wheel to zoom · Shift + drag to pan');
  el.textContent = t;
}

/* ---------- Ligne de temps ---------- */
function renderTimeline(fast){
  const el = document.getElementById('timeline'); if(!el) return;
  const d = S.doc.dur, pct = t => (t / d * 100) + '%';
  if(fast && el.querySelector('.tl-head')){
    el.querySelector('.tl-head').style.left = pct(S.t);
    el.querySelector('.tl-time b').textContent = fmtTime(S.t); return;
  }
  const onKey = keyAt(snapT(S.t));
  let ticks = ''; for(let s = 0; s <= d; s++) ticks += `<span class="tl-tick" style="left:${pct(s)}">${s}</span>`;
  el.innerHTML = `
    <div class="tl-ctrl">
      <button class="btn tl-btn" data-act="toStart" title="${esc(L('Revenir au début', 'Back to start'))}">${icon('start')}</button>
      <button class="btn tl-btn tl-play" data-act="play" title="${esc(L('Lecture (Espace)', 'Play (Space)'))}">${icon(S.playing ? 'pause' : 'play')}</button>
      <span class="tl-time"><b>${fmtTime(S.t)}</b> / ${fmtTime(d)}</span>
    </div>
    <div class="tl-track" id="tlTrack">${ticks}
      ${S.doc.keys.map((k, i) => `<button class="tl-key ${onKey === k ? 'on' : ''}" data-i="${i}" style="left:${pct(k.t)}" title="${esc(L('Clé à ', 'Key at ') + fmtTime(k.t))}"></button>`).join('')}
      <span class="tl-head" style="left:${pct(S.t)}"></span>
    </div>
    <div class="tl-side">
      <label class="tl-dur">${L('Durée', 'Length')}<select data-act="dur">${[3, 5, 8, 10, 15, 20].map(s => `<option value="${s}" ${s === d ? 'selected' : ''}>${s} s</option>`).join('')}</select></label>
      ${onKey ? `<button class="btn btn-sm" data-act="delKey" ${S.doc.keys.length < 2 ? 'disabled' : ''}>${icon('trash')}${L('Supprimer la clé', 'Delete key')}</button>`
        : `<button class="btn btn-sm btn-key" data-act="addKey">${icon('key')}${L('Ajouter une clé', 'Add a key')}</button>`}
    </div>
    <p class="tl-tip">${L('Place le curseur, change la pose ou la caméra : la clé s’enregistre toute seule. Entre deux clés, le mouvement se fait tout seul.', 'Move the cursor, change the pose or the camera: the key saves itself. Between two keys, the motion happens on its own.')}</p>`;
}
function trackT(e){ const r = document.getElementById('tlTrack').getBoundingClientRect(); return clamp((e.clientX - r.left) / r.width, 0, 1) * S.doc.dur; }

/* ---------- La taille de l'image : toujours en 16:9, comme le film ---------- */
function fitStage(){
  if(!R.canvas) return;
  const wrap = document.getElementById('stageWrap'), st = document.getElementById('stage'); if(!wrap || !st) return;
  const W = wrap.clientWidth - 24, H = wrap.clientHeight - 24;
  let w = W, h = W * 9 / 16; if(h > H){ h = H; w = H * 16 / 9; }
  st.style.width = Math.max(160, Math.floor(w)) + 'px'; st.style.height = Math.max(90, Math.floor(h)) + 'px';
  if(S.rec) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  R.canvas.width = Math.round(Math.max(160, w) * dpr); R.canvas.height = Math.round(Math.max(90, h) * dpr);
  requestRender();
}

/* ---------- Exports ---------- */
function exportImage(){
  const w = 1920, h = 1080, ow = R.canvas.width, oh = R.canvas.height;
  R.canvas.width = w; R.canvas.height = h;
  drawFrame(S.cur, w, h, S.cur.cam);
  R.canvas.toBlob(b => {
    downloadBlob(b, safeName(S.doc.title) + ' - ' + S.t.toFixed(1) + 's.png');
    R.canvas.width = ow; R.canvas.height = oh; requestRender();
    toast(L('Image enregistrée. Dépose-la dans le storyboard de Raging Page.', 'Image saved. Drop it into the Raging Page storyboard.'));
  }, 'image/png');
}
function videoType(){
  const types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return window.MediaRecorder ? types.find(t => MediaRecorder.isTypeSupported(t)) : null;
}
function exportVideo(){
  const type = videoType();
  if(!type || !R.canvas.captureStream){ toast(L('Ce navigateur ne sait pas enregistrer de vidéo. Essaie avec Chrome, Edge ou Firefox.', 'This browser can’t record video. Try Chrome, Edge or Firefox.'), 'warn'); return; }
  if(S.playing) pause();
  const ow = R.canvas.width, oh = R.canvas.height, w = 1280, h = 720;
  R.canvas.width = w; R.canvas.height = h;
  const stream = R.canvas.captureStream(30), rec = new MediaRecorder(stream, { mimeType:type, videoBitsPerSecond:6e6 }), parts = [];
  const box = document.getElementById('recBox');
  S.rec = { rec, cancel:false, sel:S.sel }; S.sel = null; S.hover = null;
  rec.ondataavailable = e => { if(e.data && e.data.size) parts.push(e.data); };
  rec.onstop = () => {
    const cancelled = S.rec.cancel; S.sel = S.rec.sel; S.rec = null;
    box.classList.add('hidden'); R.canvas.width = ow; R.canvas.height = oh; seek(S.t);
    if(cancelled) return;
    const ext = type.startsWith('video/mp4') ? 'mp4' : 'webm';
    downloadBlob(new Blob(parts, { type:type.split(';')[0] }), safeName(S.doc.title) + '.' + ext);
    toast(L('Vidéo enregistrée (', 'Video saved (') + ext.toUpperCase() + ').');
  };
  box.classList.remove('hidden');
  const t0 = performance.now(), d = S.doc.dur;
  drawFrame(evalAt(0), w, h, evalAt(0).cam);
  rec.start(200);
  const step = now => {
    if(!S.rec) return;
    if(S.rec.cancel){ rec.stop(); return; }
    const t = Math.min(d, (now - t0) / 1000), st = evalAt(t);
    drawFrame(st, w, h, st.cam);
    box.innerHTML = `<span class="rec-dot"></span>${L('Enregistrement', 'Recording')} ${fmtTime(t)} / ${fmtTime(d)}<button class="btn btn-sm" data-act="cancelRec">${L('Annuler', 'Cancel')}</button>`;
    if(t >= d){ setTimeout(() => rec.stop(), 150); return; }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- Aide ---------- */
function showHelp(){
  const bd = document.createElement('div'); bd.className = 'modal-bd';
  bd.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><div class="modal-h"><h3>${L('Comment ça marche', 'How it works')}</h3><button class="btn btn-ghost btn-sm" data-act="closeModal">${icon('close')}</button></div>
    <ol class="how">
      <li><b>${L('Choisis un lieu et tes personnages', 'Pick a place and your characters')}</b>${L('À gauche : garage, bureau, ruelle ou taxi, et un ou deux personnages.', 'On the left: garage, office, alley or taxi, and one or two characters.')}</li>
      <li><b>${L('Pose-les', 'Pose them')}</b>${L('Clique sur une partie du corps et glisse. Pour aller vite, pars d’une pose rapide.', 'Click a body part and drag. To go fast, start from a quick pose.')}</li>
      <li><b>${L('Cadre', 'Frame')}</b>${L('Glisse dans le vide pour tourner autour, molette pour zoomer, Maj + glisser pour décaler. Choisis la focale en haut de l’image.', 'Drag empty space to orbit, wheel to zoom, Shift + drag to pan. Pick the lens at the top of the picture.')}</li>
      <li><b>${L('Anime', 'Animate')}</b>${L('Déplace le curseur du temps, change la pose ou le cadre : une clé se crée toute seule. Lecture pour voir le mouvement.', 'Move the time cursor, change the pose or the framing: a key is created on its own. Press play to see the motion.')}</li>
      <li><b>${L('Exporte', 'Export')}</b>${L('Une vidéo de toute la scène, ou une image du plan pour ton storyboard.', 'A video of the whole scene, or a picture of the shot for your storyboard.')}</li>
    </ol>
    <p class="keys">${L('Raccourcis : Espace lecture · ← → avancer de 0,1 s · Suppr supprimer la clé · Ctrl+Z annuler · Échap désélectionner', 'Shortcuts: Space play · ← → step 0.1 s · Delete remove the key · Ctrl+Z undo · Esc deselect')}</p></div>`;
  document.body.appendChild(bd);
  bd.addEventListener('click', e => { if(e.target === bd || e.target.closest('[data-act="closeModal"]')) bd.remove(); });
}

/* une petite boîte de confirmation, dans la DA (pas la fenêtre grise du navigateur) */
function ask(title, msg, okLabel){
  return new Promise(res => {
    const bd = document.createElement('div'); bd.className = 'modal-bd';
    bd.innerHTML = `<div class="modal sm" role="dialog" aria-modal="true"><h3>${esc(title)}</h3><p>${esc(msg)}</p>
      <div class="modal-f"><button class="btn btn-ghost" data-r="0">${L('Annuler', 'Cancel')}</button><button class="btn btn-primary" data-r="1">${esc(okLabel)}</button></div></div>`;
    document.body.appendChild(bd);
    const done = v => { bd.remove(); document.removeEventListener('keydown', k); res(v); };
    const k = e => { if(e.key === 'Escape') done(false); if(e.key === 'Enter') done(true); };
    document.addEventListener('keydown', k);
    bd.addEventListener('click', e => { const b = e.target.closest('[data-r]'); if(b) done(b.dataset.r === '1'); else if(e.target === bd) done(false); });
    setTimeout(() => bd.querySelector('.btn-primary').focus(), 30);
  });
}

/* ---------- Actions ---------- */
const ACT = {
  undo, redo,
  lang:b => setLang(b.dataset.l),
  exportMenu:() => document.getElementById('exportMenu').classList.toggle('hidden'),
  exportVideo:() => { closeMenus(); exportVideo(); },
  exportImage:() => { closeMenus(); exportImage(); },
  cancelRec:() => { if(S.rec) S.rec.cancel = true; },
  place:b => setPlace(b.dataset.id),
  pickChar:b => { S.sel = { c:+b.dataset.c, j:'pelvis' }; renderSide(); requestRender(); },
  addChar, removeChar,
  pose:b => setPose(b.dataset.id),
  resetPart,
  camFilm:() => { if(S.freeView) toggleFreeView(); renderHint(); },
  camFree:() => { if(!S.freeView) toggleFreeView(); renderHint(); },
  lens:b => setLens(+b.dataset.l),
  play, toStart:() => { if(S.playing) pause(); seek(0); },
  addKey:() => commit(),
  delKey:() => deleteKey(),
  newScene:async () => {
    if(!await ask(L('Nouvelle scène ?', 'New scene?'), L('La scène actuelle sera remplacée. Tu pourras revenir en arrière avec Annuler.', 'The current scene will be replaced. You can go back with Undo.'), L('Nouvelle scène', 'New scene'))) return;
    pushUndo(); const n = newDoc(S.doc.set); S.doc = n.doc; S.cur = n.cur; S.t = 0; S.sel = null; S.freeView = false;
    buildSet(); save(); renderUI(); requestRender();
  },
  help:showHelp,
};
function closeMenus(){ const m = document.getElementById('exportMenu'); if(m) m.classList.add('hidden'); }

function bindEvents(){
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if(!e.target.closest('.menu-wrap')) closeMenus();
    if(!b || b.tagName === 'INPUT' || b.tagName === 'SELECT') return;
    const f = ACT[b.dataset.act]; if(f){ e.preventDefault(); f(b, e); }
  });
  document.addEventListener('input', e => {
    const t = e.target;
    if(t.id === 'tbTitle'){ S.doc.title = t.value; save(); return; }
    if(t.dataset.act === 'axis' && S.sel){ S.cur.chars[S.sel.c].j[S.sel.j][+t.dataset.i] = +t.value; renderSide(true); requestRender(); }
    if(t.dataset.act === 'root' && S.sel){ const r = S.cur.chars[S.sel.c].root; if(+t.dataset.i === 0) r.ry = +t.value; else r.y = +t.value; renderSide(true); requestRender(); }
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if(t.dataset.act === 'axis' || t.dataset.act === 'root') commit();
    if(t.dataset.act === 'dur'){
      pushUndo(); const d = +t.value; S.doc.dur = d;
      // les clés au-delà de la nouvelle durée sont ramenées à la fin
      S.doc.keys.forEach(k => k.t = Math.min(k.t, d));
      S.doc.keys = S.doc.keys.filter((k, i, a) => !a.slice(i + 1).some(x => Math.abs(x.t - k.t) < 0.05));
      S.t = Math.min(S.t, d); S.cur = evalAt(S.t); save(); renderTimeline(); requestRender();
    }
  });
  // ligne de temps : cliquer ou glisser pour se déplacer ; glisser une clé pour changer son moment
  document.addEventListener('pointerdown', e => {
    const tr = e.target.closest('#tlTrack'); if(!tr) return;
    if(S.playing) pause();
    const key = e.target.closest('.tl-key');
    const moving = key ? S.doc.keys[+key.dataset.i] : null, start = moving ? moving.t : 0; let undoPushed = false, moved = false;
    if(!moving) seek(snapT(trackT(e)));
    const mv = ev => {
      const t = snapT(trackT(ev));
      if(moving){
        if(Math.abs(t - start) < 0.05 && !moved) return;
        if(S.doc.keys.some(k => k !== moving && Math.abs(k.t - t) < 0.05)) return;
        if(!undoPushed){ pushUndo(); undoPushed = true; }
        moved = true; moving.t = t; S.doc.keys.sort((a, b) => a.t - b.t); seek(t);
      } else seek(t);
    };
    const up = () => { document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up);
      if(moving && !moved) seek(moving.t); if(moved) save(); };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up);
  });
  const c = R.canvas;
  c.addEventListener('pointerdown', onDown); c.addEventListener('pointermove', onMove); c.addEventListener('pointerup', onUp); c.addEventListener('pointercancel', onUp);
  c.addEventListener('pointerleave', () => { if(!DRAG.mode && S.hover){ S.hover = null; requestRender(); renderHint(); } });
  c.addEventListener('wheel', onWheel, { passive:false });
  c.addEventListener('contextmenu', e => e.preventDefault());
  window.addEventListener('resize', fitStage);
  document.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase();
    if(tag === 'input' && e.target.type !== 'range' || tag === 'textarea' || tag === 'select') return;
    const mod = e.ctrlKey || e.metaKey;
    if(mod && e.key.toLowerCase() === 'z'){ e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if(mod && e.key.toLowerCase() === 'y'){ e.preventDefault(); redo(); return; }
    if(e.key === ' '){ e.preventDefault(); play(); }
    else if(e.key === 'ArrowRight' && tag !== 'input'){ e.preventDefault(); seek(snapT(S.t + 0.1)); }
    else if(e.key === 'ArrowLeft' && tag !== 'input'){ e.preventDefault(); seek(snapT(S.t - 0.1)); }
    else if(e.key === 'Delete' || e.key === 'Backspace'){ if(keyAt(snapT(S.t))) deleteKey(); }
    else if(e.key === 'Escape'){ if(S.sel){ S.sel = null; renderSide(); renderHint(); requestRender(); } closeMenus(); }
  });
}

/* ---------- Démarrage ---------- */
(function boot(){
  document.documentElement.lang = getLang();
  if(!load()){ const n = newDoc('garage'); S.doc = n.doc; S.cur = n.cur; }
  renderUI();
  R.canvas = document.getElementById('view');
  if(!GL.init(R.canvas)){
    document.getElementById('stage').innerHTML = `<div class="nogl"><b>${L('La 3D n’est pas disponible dans ce navigateur.', '3D isn’t available in this browser.')}</b>${L('Raging 3D a besoin de WebGL. Essaie avec une version récente de Chrome, Edge ou Firefox, ou active l’accélération matérielle dans les réglages du navigateur.', 'Raging 3D needs WebGL. Try a recent Chrome, Edge or Firefox, or turn on hardware acceleration in your browser settings.')}</div>`;
    return;
  }
  initMeshes(); bindEvents(); fitStage(); renderHint();
})();
