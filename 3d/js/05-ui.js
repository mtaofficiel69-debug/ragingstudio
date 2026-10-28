/* =====================================================================
   RAGING 3D — INTERFACE
   À gauche : qui et où (lieu, personnages, pose). Au-dessus de l'image :
   le cadrage en un clic (valeur, angle, focale). À droite : la fiche du plan.
   En bas : la planche, plan par plan, comme un storyboard dessiné.
===================================================================== */
const HUB = () => getLang() === 'fr' ? '../fr/' : '../';

function renderUI(){
  const app = document.getElementById('app');
  document.documentElement.lang = getLang();
  if(!app.querySelector('.topbar')){
    app.innerHTML = `
      <header class="topbar">
        <div class="topbar-left">
          <a class="btn tb-back" id="tbBack" href="${HUB()}">${icon('back')}<span class="tb-lbl">Raging Studio</span></a>
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
          <div class="tools" id="tools"></div>
          <div class="stage-wrap" id="stageWrap">
            <div class="stage" id="stage"><canvas id="view"></canvas><div class="thirds" id="thirds"><i></i><i></i><i></i><i></i></div><div class="handles" id="handles"></div><div class="shot-no" id="shotNo"></div><div class="hint" id="hint"></div><div class="nav" id="nav"></div><div class="rec hidden" id="recBox"></div></div>
          </div>
          <div class="strip" id="strip"></div>
        </section>
        <aside class="sheet" id="sheet"></aside>
      </div>`;
  }
  const t = document.getElementById('tbTitle'); if(document.activeElement !== t) t.value = S.doc.title;
  t.placeholder = L('Titre du storyboard', 'Storyboard title');
  ['tbBack', 'tbBrand'].forEach(id => { const a = document.getElementById(id); a.href = HUB(); a.title = L('Retour à l’accueil de Raging Studio', 'Back to Raging Studio home'); });
  document.getElementById('tbUndo').title = L('Annuler (Ctrl+Z)', 'Undo (Ctrl+Z)'); document.getElementById('tbRedo').title = L('Rétablir (Ctrl+Y)', 'Redo (Ctrl+Y)');
  document.querySelectorAll('.lang-flags button').forEach(b => b.classList.toggle('on', b.dataset.l === getLang()));
  document.getElementById('tbExportLbl').textContent = L('Exporter', 'Export');
  document.getElementById('exportMenu').innerHTML =
    `<button data-act="exportPdf">${icon('new')}<span><b>${L('Planche de storyboard (PDF)', 'Storyboard sheets (PDF)')}</b><small>${L('Tous les plans, 6 par page, avec leurs infos : prêt à imprimer ou à envoyer', 'Every shot, 6 per page, with its details: ready to print or send')}</small></span></button>
     <button data-act="exportImage">${icon('image')}<span><b>${L('Image de ce plan (PNG)', 'Image of this shot (PNG)')}</b><small>${L('En 1920 × 1080, à déposer dans le storyboard de Raging Page', '1920 × 1080, to drop into the Raging Page storyboard')}</small></span></button>
     <button data-act="exportVideo">${icon('film')}<span><b>${L('Animatique (vidéo)', 'Animatic (video)')}</b><small>${L('Les plans à la suite, chacun pendant sa durée', 'The shots one after another, each for its length')}</small></span></button>`;
  renderSide(); renderTools(); renderStrip(); renderShotPanel(); renderHint(); renderNav(); fitStage();
}
/* le pavé de déplacement, en bas à droite de l'image : on maintient un bouton pour bouger */
function renderNav(){
  const el = document.getElementById('nav'); if(!el) return;
  const hd = document.getElementById('handles'); if(hd) hd.innerHTML = '';   // refaites dans la bonne langue au prochain dessin
  const b = (k, t, svg) => `<button data-nav="${k}" title="${esc(t)}" aria-label="${esc(t)}"><svg viewBox="0 0 16 16" aria-hidden="true">${svg}</svg></button>`;
  const ar = 'M8 3.5 12.5 9H3.5Z';
  el.innerHTML = `<div class="pad">${b('fwd', L('Avancer (Z ou W)', 'Forward (W or Z)'), `<path d="${ar}"/>`)}
      ${b('left', L('À gauche (Q ou A)', 'Left (A or Q)'), `<path d="${ar}" transform="rotate(-90 8 8)"/>`)}
      ${b('right', L('À droite (D)', 'Right (D)'), `<path d="${ar}" transform="rotate(90 8 8)"/>`)}
      ${b('back', L('Reculer (S)', 'Back (S)'), `<path d="${ar}" transform="rotate(180 8 8)"/>`)}</div>
    <div class="col">${b('turnL', L('Tourner autour, à gauche', 'Orbit left'), '<path d="M12.5 8a4.5 4.5 0 1 1-1.3-3.2" fill="none"/><path d="M12 1.8v3.4H8.6" fill="none"/>')}${b('turnR', L('Tourner autour, à droite', 'Orbit right'), '<path d="M3.5 8a4.5 4.5 0 1 0 1.3-3.2" fill="none"/><path d="M4 1.8v3.4h3.4" fill="none"/>')}</div>
    <div class="col">${b('up', L('Monter (R)', 'Up (R)'), '<path d="M8 2v12M4.5 5.5 8 2l3.5 3.5" fill="none"/>')}${b('down', L('Descendre (F)', 'Down (F)'), '<path d="M8 2v12M4.5 10.5 8 14l3.5-3.5" fill="none"/>')}</div>
    <div class="col">${b('in', L('Zoomer', 'Zoom in'), '<path d="M8 3.5v9M3.5 8h9" fill="none"/>')}${b('out', L('Dézoomer', 'Zoom out'), '<path d="M3.5 8h9" fill="none"/>')}</div>`;
}

/* ---------- À gauche : lieu, personnages, pose, partie du corps ---------- */
function slider(label, act, i, v, min, max, step, unit){
  return `<label class="sl"><span class="sl-h"><span>${esc(label)}</span><b>${round(v, step < 1 ? 2 : 0)}${unit || '°'}</b></span>
    <input type="range" data-act="${act}" data-i="${i}" min="${min}" max="${max}" step="${step}" value="${v}"></label>`;
}
const charName = c => esc(L(CHAR_LOOK[c].fr, CHAR_LOOK[c].en));
function renderSide(onlyValues){
  const el = document.getElementById('side'); if(!el) return;
  const sh = shot(), sel = S.sel, chars = sh.chars;
  if(onlyValues && el.querySelector('.sec-part')){
    el.querySelectorAll('.sl input').forEach(inp => {
      const i = +inp.dataset.i, act = inp.dataset.act; let v;
      if(act === 'axis' && sel) v = chars[sel.c].j[sel.j][i];
      else if(act === 'root' && sel) v = i === 0 ? chars[sel.c].root.ry : chars[sel.c].root.y;
      if(v == null) return;
      inp.value = v; inp.closest('.sl').querySelector('b').textContent = round(v, inp.step < 1 ? 2 : 0) + (act === 'root' && i === 1 ? ' m' : '°');
    });
    return;
  }
  const place = SETS.map(s => `<button class="chip-btn place ${sh.set === s.id ? 'on' : ''}" data-act="place" data-id="${s.id}"><i class="sw sw-${s.id}"></i>${esc(L(s.fr, s.en))}</button>`).join('');
  const who = chars.map((c, i) => `<div class="who ${sel && sel.c === i ? 'on' : ''}">
      <button class="who-main" data-act="pickChar" data-c="${i}"><i class="dot" style="background:${CHAR_LOOK[i].col}"></i>${charName(i)}</button>
      ${i === 1 ? `<button class="who-x" data-act="removeChar" title="${esc(L('Retirer ce personnage du plan', 'Remove this character from the shot'))}">${icon('close')}</button>` : ''}
    </div>`).join('') + (chars.length < 2 ? `<button class="add" data-act="addChar">${icon('plus')}${L('Ajouter un 2ᵉ personnage', 'Add a 2nd character')}</button>`
      : `<div class="pair"><button class="chip-btn" data-act="faceThem">${L('Se faire face', 'Face each other')}</button><button class="chip-btn" data-act="lookAt">${L('Regarder l’autre', 'Look at the other')}</button></div>`);
  const target = sel ? sel.c : S.target;
  const poses = POSES.map(p => `<button class="chip-btn" data-act="pose" data-id="${p.id}">${esc(L(p.fr, p.en))}</button>`).join('');
  let part;
  if(sel){
    const J = JOINT[sel.j], v = chars[sel.c].j[sel.j], ch = chars[sel.c];
    part = `<div class="part-h"><b>${esc(L(J.fr, J.en))}</b><span>${charName(sel.c)}</span></div>
      ${J.ax.map((a, i) => slider(L(a[4], a[5]), 'axis', i, v[i], a[2], a[3], 1)).join('')}
      ${sel.j === 'pelvis' ? `<p class="tip">${L('Glisse le bassin pour déplacer le personnage.', 'Drag the hips to move the character.')}</p>
        ${slider(L('Tout le corps : tourner', 'Whole body: turn'), 'root', 0, ch.root.ry, -180, 180, 1)}
        ${slider(L('Tout le corps : hauteur', 'Whole body: height'), 'root', 1, ch.root.y, -0.8, 1.2, 0.01, ' m')}` : ''}
      <button class="btn btn-sm btn-ghost" data-act="resetPart">${icon('reset')}${L('Remettre droit', 'Straighten')}</button>`;
  } else part = `<p class="tip">${L('Clique sur une partie du corps dans l’image, puis glisse pour la bouger. Les curseurs apparaîtront ici.', 'Click a body part in the picture, then drag to move it. The sliders will show up here.')}</p>`;
  el.innerHTML = `
    <div class="sec"><h3>${L('Lieu', 'Place')}</h3><div class="grid2">${place}</div></div>
    <div class="sec"><h3>${L('Personnages', 'Characters')}</h3>${who}</div>
    <div class="sec"><h3>${L('Pose rapide', 'Quick pose')} <span class="for">${charName(target)}</span></h3><div class="chips">${poses}</div></div>
    <div class="sec sec-part"><h3>${L('Partie du corps', 'Body part')}</h3>${part}</div>
    <div class="side-foot"><button class="btn btn-sm btn-ghost" data-act="newBoard">${icon('new')}${L('Nouveau storyboard', 'New storyboard')}</button><button class="btn btn-sm btn-ghost" data-act="help">${icon('help')}${L('Aide', 'Help')}</button></div>`;
}

/* ---------- Au-dessus de l'image : le cadrage en un clic ---------- */
function renderTools(){
  const el = document.getElementById('tools'); if(!el) return;
  const sh = shot(), two = sh.chars.length > 1, inf = sh.info;
  const sizes = ['pg', 'pe', 'pa', 'pm', 'pr', 'gp', 'tgp'].concat(two ? ['am', '2p'] : []);
  const btn = (k, act, on, extra) => `<button class="${on ? 'on' : ''}" data-act="${act}" data-v="${k}" title="${esc(shotLabel(act === 'size' ? 'size' : 'angle', k))}">${extra || esc(shotLabel(act === 'size' ? 'size' : 'angle', k, true))}</button>`;
  el.innerHTML = `
    ${two ? `<div class="tg"><span class="tl">${L('Sur', 'On')}</span><div class="seg2">${sh.chars.map((_, i) => `<button class="${S.target === i ? 'on' : ''}" data-act="target" data-c="${i}"><i class="dot" style="background:${CHAR_LOOK[i].col}"></i>${i + 1}</button>`).join('')}</div></div>` : ''}
    <div class="tg"><span class="tl">${L('Valeur', 'Size')}</span><div class="seg2">${sizes.map(k => btn(k, 'size', inf.size === k)).join('')}</div></div>
    <div class="tg"><span class="tl">${L('Angle', 'Angle')}</span><div class="seg2">${['neu', 'plo', 'con', 'dess', 'deb'].map(k => btn(k, 'angle', inf.angle === k, esc(shotLabel('angle', k)))).join('')}</div></div>
    <div class="tg"><span class="tl">${L('Focale', 'Lens')}</span><div class="seg2">${LENSES.map(l => `<button class="${Math.round(sh.cam.lens) === l ? 'on' : ''}" data-act="lens" data-l="${l}">${l}</button>`).join('')}</div></div>
    <button class="grid-btn ${S.grid ? 'on' : ''}" data-act="grid" title="${esc(L('Grille des tiers', 'Rule of thirds'))}"><svg viewBox="0 0 16 16" class="icon" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="1.5" y="2.5" width="13" height="11" rx="1"/><path d="M6 2.5v11M10 2.5v11M1.5 6.2h13M1.5 9.8h13"/></svg></button>`;
  document.getElementById('thirds').classList.toggle('hidden', !S.grid);
}

/* ---------- À droite : la fiche du plan ---------- */
const opt = (k, v) => SHOT[k].map(o => `<option value="${o[0]}" ${o[0] === v ? 'selected' : ''}>${esc(L(o[1], o[2]))}</option>`).join('');
function renderShotPanel(){
  const el = document.getElementById('sheet'); if(!el) return;
  const sh = shot(), inf = sh.info, n = S.doc.shots.length;
  document.getElementById('shotNo').textContent = L('Plan ', 'Shot ') + (S.i + 1);
  el.innerHTML = `
    <div class="sec">
      <h3>${L('Plan', 'Shot')} ${S.i + 1} <span class="for">${L('sur', 'of')} ${n}</span></h3>
      <label class="fld"><span>${L('Ce qui se passe', 'What happens')}</span><textarea id="cap" rows="4" placeholder="${esc(L('Léa entre dans la librairie…', 'Léa walks into the bookshop…'))}">${esc(inf.cap)}</textarea></label>
      <label class="fld"><span>${L('Valeur', 'Size')}</span><select data-act="info" data-k="size">${opt('size', inf.size)}</select></label>
      <label class="fld"><span>${L('Angle', 'Angle')}</span><select data-act="info" data-k="angle">${opt('angle', inf.angle)}</select></label>
      <label class="fld"><span>${L('Mouvement', 'Movement')}</span><select data-act="info" data-k="move">${opt('move', inf.move)}</select></label>
      <div class="fld-row"><label class="fld"><span>${L('Focale', 'Lens')}</span><b class="ro">${Math.round(sh.cam.lens)} mm</b></label>
        <label class="fld"><span>${L('Durée', 'Length')}</span><select data-act="info" data-k="dur">${[1, 1.5, 2, 3, 4, 5, 8].map(d => `<option value="${d}" ${d === inf.dur ? 'selected' : ''}>${fmtTime(d)}</option>`).join('')}</select></label></div>
    </div>
    <div class="sec">
      <h3>${L('Ce plan', 'This shot')}</h3>
      <div class="acts">
        <button class="chip-btn" data-act="moveShot" data-d="-1" ${S.i === 0 ? 'disabled' : ''}>← ${L('Avant', 'Earlier')}</button>
        <button class="chip-btn" data-act="moveShot" data-d="1" ${S.i === n - 1 ? 'disabled' : ''}>${L('Après', 'Later')} →</button>
        <button class="chip-btn" data-act="dupShot">${L('Dupliquer', 'Duplicate')}</button>
        <button class="chip-btn danger" data-act="delShot" ${n < 2 ? 'disabled' : ''}>${icon('trash')}${L('Supprimer', 'Delete')}</button>
      </div>
    </div>`;
}

/* ---------- En bas : la planche ---------- */
function renderStrip(){
  const el = document.getElementById('strip'); if(!el) return;
  const two = shot().chars.length > 1;
  el.innerHTML = `<div class="strip-h"><b>${L('Planche', 'Board')}</b><span>${S.doc.shots.length} ${S.doc.shots.length > 1 ? L('plans', 'shots') : L('plan', 'shot')}</span></div>
    <div class="cards" id="cards">${S.doc.shots.map((s, i) => `<button class="shot-card ${i === S.i ? 'on' : ''}" data-act="goShot" data-i="${i}">
        <span class="sc-img"><img src="${thumbOf(i)}" alt=""><span class="sc-n">${i + 1}</span></span>
        <span class="sc-t"><b>${esc(shotLabel('size', s.info.size, true))}</b>${esc(s.info.cap || L('Sans description', 'No description'))}</span></button>`).join('')}
      <div class="add-col">
        <button class="add-shot" data-act="addShot">${icon('plus')}<span>${L('Nouveau plan', 'New shot')}</span></button>
        ${two ? `<button class="add-shot rev" data-act="addReverse" title="${esc(L('Le plan suivant, par-dessus l’épaule de l’autre personnage', 'The next shot, over the other character’s shoulder'))}">⇄<span>${L('Contrechamp', 'Reverse shot')}</span></button>` : ''}
      </div></div>`;
  const on = el.querySelector('.shot-card.on'); if(on) on.scrollIntoView({ block:'nearest', inline:'nearest' });
}
function renderHint(){
  const el = document.getElementById('hint'); if(!el) return;
  let t;
  if(S.hover) t = L(JOINT[S.hover.j].fr, JOINT[S.hover.j].en) + ' · ' + (S.hover.j === 'pelvis' ? L('glisse pour déplacer le personnage', 'drag to move the character') : L('glisse pour bouger', 'drag to move'));
  else if(HDRAG.c >= 0) t = HDRAG.kind === 'move' ? L('Glisse pour déplacer le personnage sur le sol', 'Drag to move the character on the floor') : L('Glisse à gauche ou à droite pour le faire tourner', 'Drag left or right to turn them');
  else if(S.sel) t = L('Glisse la partie verte pour la bouger · Clique dans le vide pour désélectionner', 'Drag the green part to move it · Click empty space to deselect');
  else t = L('Losange vert : maintiens-le pour déplacer un personnage · Glisse dans le vide : tourner · Clic droit + glisser : se décaler · Molette : avancer · Double-clic : viser', 'Green diamond: hold it to move a character · Drag empty space: orbit · Right-click + drag: pan · Wheel: move in · Double-click: aim');
  el.textContent = t;
}

/* ---------- L'image : toujours en 16:9, comme le film ---------- */
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
function renderShotURL(i, w, h, type, q){
  const ow = R.canvas.width, oh = R.canvas.height;
  R.canvas.width = w; R.canvas.height = h; drawFrame(S.doc.shots[i], w, h, true);
  const u = R.canvas.toDataURL(type || 'image/jpeg', q || 0.88);
  R.canvas.width = ow; R.canvas.height = oh; requestRender();
  return u;
}
function exportImage(){
  fetch(renderShotURL(S.i, 1920, 1080, 'image/png')).then(r => r.blob()).then(b => {
    downloadBlob(b, safeName(S.doc.title) + ' - ' + L('plan', 'shot') + ' ' + (S.i + 1) + '.png');
    toast(L('Image enregistrée. Dépose-la dans le storyboard de Raging Page.', 'Image saved. Drop it into the Raging Page storyboard.'));
  });
}
/* jsPDF n'est chargé qu'au moment d'exporter : l'outil reste léger */
let _pdfLib = null;
function loadPdf(){
  if(window.jspdf && window.jspdf.jsPDF) return Promise.resolve(window.jspdf.jsPDF);
  if(_pdfLib) return _pdfLib;
  const urls = ['https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js', 'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js'];
  _pdfLib = new Promise((res, rej) => {
    const next = k => {
      if(k >= urls.length){ _pdfLib = null; rej(new Error('jspdf')); return; }
      const s = document.createElement('script'); s.src = urls[k];
      s.onload = () => window.jspdf ? res(window.jspdf.jsPDF) : next(k + 1); s.onerror = () => next(k + 1);
      document.head.appendChild(s);
    };
    next(0);
  });
  return _pdfLib;
}
const pdfText = s => String(s || '').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...').replace(/[–—]/g, '-').replace(/ | /g, ' ');
async function exportPdf(){
  let jsPDF;
  try{ jsPDF = await loadPdf(); }catch(e){ toast(L('Impossible de charger l’outil PDF : vérifie ta connexion.', 'Could not load the PDF tool: check your connection.'), 'warn'); return; }
  const doc = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });
  const W = 297, H = 210, M = 12, cols = 3, rows = 2, gx = 8, gy = 10;
  const cw = (W - 2 * M - (cols - 1) * gx) / cols, ih = cw * 9 / 16, ch = (H - 2 * M - 16 - (rows - 1) * gy) / rows;
  const shots = S.doc.shots, pages = Math.ceil(shots.length / 6);
  for(let p = 0; p < pages; p++){
    if(p) doc.addPage();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(35, 38, 46);
    doc.text(pdfText(S.doc.title || 'Storyboard'), M, M + 5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(92, 98, 112);
    doc.text(pdfText(L('Storyboard · page ', 'Storyboard · page ') + (p + 1) + ' / ' + pages), W - M, M + 5, { align:'right' });
    doc.setDrawColor(35, 38, 46); doc.setLineWidth(0.4); doc.line(M, M + 9, W - M, M + 9);
    for(let k = 0; k < 6; k++){
      const i = p * 6 + k; if(i >= shots.length) break;
      const s = shots[i], x = M + (k % cols) * (cw + gx), y = M + 16 + Math.floor(k / cols) * (ch + gy);
      doc.addImage(renderShotURL(i, 960, 540, 'image/jpeg', 0.86), 'JPEG', x, y, cw, ih);
      doc.setDrawColor(35, 38, 46); doc.setLineWidth(0.3); doc.rect(x, y, cw, ih);
      doc.setFillColor(23, 122, 79); doc.roundedRect(x + 2, y + 2, 9, 5.4, 1, 1, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(255, 255, 255); doc.text(String(i + 1), x + 6.5, y + 5.8, { align:'center' });
      const meta = [shotLabel('size', s.info.size), shotLabel('angle', s.info.angle), shotLabel('move', s.info.move), Math.round(s.cam.lens) + ' mm'].filter(Boolean).join(' · ');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(35, 38, 46);
      doc.text(pdfText(L('Plan ', 'Shot ') + (i + 1)), x, y + ih + 5);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(23, 122, 79);
      doc.text(pdfText(meta), x + 14, y + ih + 5, { maxWidth:cw - 14 });
      doc.setTextColor(60, 64, 74); doc.setFontSize(8.5);
      const lines = doc.splitTextToSize(pdfText(s.info.cap), cw).slice(0, 3);
      doc.text(lines, x, y + ih + 10);
      doc.setDrawColor(218, 223, 230); doc.setLineWidth(0.2);
      for(let l = lines.length; l < 3; l++) doc.line(x, y + ih + 10.6 + l * 4, x + cw, y + ih + 10.6 + l * 4);
    }
    doc.setFontSize(7.5); doc.setTextColor(92, 98, 112);
    doc.text('Raging 3D · ragingstudio.com/3d', M, H - 6);
  }
  doc.save(safeName(S.doc.title) + ' - storyboard.pdf');
  toast(L('Planche PDF enregistrée.', 'PDF board saved.'));
}
function videoType(){
  const types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return window.MediaRecorder ? types.find(t => MediaRecorder.isTypeSupported(t)) : null;
}
/* l'animatique : chaque plan reste à l'écran pendant sa durée, puis on coupe au suivant */
function exportVideo(){
  const type = videoType();
  if(!type || !R.canvas.captureStream){ toast(L('Ce navigateur ne sait pas enregistrer de vidéo. Essaie avec Chrome, Edge ou Firefox.', 'This browser can’t record video. Try Chrome, Edge or Firefox.'), 'warn'); return; }
  const ow = R.canvas.width, oh = R.canvas.height, w = 1280, h = 720, shots = S.doc.shots;
  const starts = []; let total = 0; shots.forEach(s => { starts.push(total); total += s.info.dur || 2; });
  R.canvas.width = w; R.canvas.height = h;
  const stream = R.canvas.captureStream(30), rec = new MediaRecorder(stream, { mimeType:type, videoBitsPerSecond:5e6 }), parts = [];
  const box = document.getElementById('recBox');
  S.rec = { cancel:false };
  rec.ondataavailable = e => { if(e.data && e.data.size) parts.push(e.data); };
  rec.onstop = () => {
    const cancelled = S.rec.cancel; S.rec = null;
    box.classList.add('hidden'); R.canvas.width = ow; R.canvas.height = oh; requestRender();
    if(cancelled) return;
    const ext = type.startsWith('video/mp4') ? 'mp4' : 'webm';
    downloadBlob(new Blob(parts, { type:type.split(';')[0] }), safeName(S.doc.title) + ' - ' + L('animatique', 'animatic') + '.' + ext);
    toast(L('Animatique enregistrée (', 'Animatic saved (') + ext.toUpperCase() + ').');
  };
  box.classList.remove('hidden');
  const t0 = performance.now(); let last = -1;
  drawFrame(shots[0], w, h, true); rec.start(200);
  const step = now => {
    if(!S.rec) return;
    if(S.rec.cancel){ rec.stop(); return; }
    const t = Math.min(total, (now - t0) / 1000);
    let i = 0; while(i + 1 < shots.length && starts[i + 1] <= t) i++;
    drawFrame(shots[i], w, h, true);   // on redessine à chaque image : la vidéo garde son rythme
    if(i !== last){ last = i; }
    box.innerHTML = `<span class="rec-dot"></span>${L('Animatique', 'Animatic')} · ${L('plan', 'shot')} ${i + 1} / ${shots.length} · ${fmtTime(t)}<button class="btn btn-sm" data-act="cancelRec">${L('Annuler', 'Cancel')}</button>`;
    if(t >= total){ setTimeout(() => rec.stop(), 150); return; }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- Aide, confirmation ---------- */
function showHelp(){
  const bd = document.createElement('div'); bd.className = 'modal-bd';
  bd.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><div class="modal-h"><h3>${L('Ton storyboard, sans savoir dessiner', 'Your storyboard, no drawing skills needed')}</h3><button class="btn btn-ghost btn-sm" data-act="closeModal">${icon('close')}</button></div>
    <ol class="how">
      <li><b>${L('Installe la scène', 'Set the scene')}</b>${L('À gauche : le lieu, un ou deux personnages, une pose rapide.', 'On the left: the place, one or two characters, a quick pose.')}</li>
      <li><b>${L('Cadre en un clic', 'Frame in one click')}</b>${L('Au-dessus de l’image : choisis la valeur (gros plan, plan moyen…), l’angle et la focale. La caméra se place toute seule.', 'Above the picture: pick the size (close-up, medium shot…), the angle and the lens. The camera places itself.')}</li>
      <li><b>${L('Place tes personnages', 'Place your characters')}</b>${L('Maintiens le losange vert au-dessus d’une tête pour déplacer le personnage ; la petite flèche à côté le fait tourner. Le losange n’apparaît jamais dans les exports.', 'Hold the green diamond above a head to move the character; the small arrow next to it turns them. The diamond never shows in exports.')}</li>
      <li><b>${L('Ajuste la pose', 'Adjust the pose')}</b>${L('Clique sur une partie du corps et glisse. Si un meuble cache un personnage, il devient transparent pendant que tu travailles.', 'Click a body part and drag. If furniture hides a character, it turns see-through while you work.')}</li>
      <li><b>${L('Promène-toi dans la scène', 'Move around the scene')}</b>${L('Glisse dans le vide pour tourner autour · clic droit (ou Maj) + glisser pour te décaler · molette pour avancer vers la souris · double-clic pour viser un endroit ou recadrer un personnage · ZQSD ou WASD pour marcher, R et F pour monter et descendre, ou le pavé en bas à droite de l’image.', 'Drag empty space to orbit · right-click (or Shift) + drag to pan · wheel to move toward the mouse · double-click to aim at a spot or reframe a character · WASD or ZQSD to walk, R and F to go up and down, or the pad at the bottom right of the picture.')}</li>
      <li><b>${L('Décris le plan', 'Describe the shot')}</b>${L('À droite : ce qui se passe, le mouvement de caméra, la durée.', 'On the right: what happens, the camera move, the length.')}</li>
      <li><b>${L('Plan suivant', 'Next shot')}</b>${L('« Nouveau plan » reprend le plan actuel : tu changes juste ce qui bouge. Avec deux personnages, « Contrechamp » fait le plan inverse.', '“New shot” starts from the current one: you only change what moves. With two characters, “Reverse shot” makes the opposite angle.')}</li>
      <li><b>${L('Exporte', 'Export')}</b>${L('La planche en PDF, l’image d’un plan, ou l’animatique en vidéo.', 'The board as a PDF, the image of a shot, or the animatic as a video.')}</li>
    </ol>
    <p class="keys">${L('Raccourcis : ← → plan précédent ou suivant · ZQSD / WASD et ↑ ↓ se déplacer · R F monter, descendre · N nouveau plan · Ctrl+Z annuler · Échap désélectionner', 'Shortcuts: ← → previous or next shot · WASD / ZQSD and ↑ ↓ move · R F up, down · N new shot · Ctrl+Z undo · Esc deselect')}</p></div>`;
  document.body.appendChild(bd);
  bd.addEventListener('click', e => { if(e.target === bd || e.target.closest('[data-act="closeModal"]')) bd.remove(); });
}
function ask(title, msg, okLabel){
  return new Promise(res => {
    const bd = document.createElement('div'); bd.className = 'modal-bd';
    bd.innerHTML = `<div class="modal sm" role="dialog" aria-modal="true"><h3>${esc(title)}</h3><p>${esc(msg)}</p>
      <div class="modal-f"><button class="btn btn-ghost" data-r="0">${L('Annuler', 'Cancel')}</button><button class="btn btn-primary" data-r="1">${esc(okLabel)}</button></div></div>`;
    document.body.appendChild(bd);
    const done = v => { bd.remove(); document.removeEventListener('keydown', k, true); res(v); };
    const k = e => { e.stopPropagation(); if(e.key === 'Escape') done(false); if(e.key === 'Enter') done(true); };
    document.addEventListener('keydown', k, true);
    bd.addEventListener('click', e => { const b = e.target.closest('[data-r]'); if(b) done(b.dataset.r === '1'); else if(e.target === bd) done(false); });
    setTimeout(() => bd.querySelector('.btn-primary').focus(), 30);
  });
}

/* ---------- Actions ---------- */
const ACT = {
  undo, redo,
  lang:b => setLang(b.dataset.l),
  exportMenu:() => document.getElementById('exportMenu').classList.toggle('hidden'),
  exportPdf:() => { closeMenus(); exportPdf(); },
  exportImage:() => { closeMenus(); exportImage(); },
  exportVideo:() => { closeMenus(); exportVideo(); },
  cancelRec:() => { if(S.rec) S.rec.cancel = true; },
  place:b => setPlace(b.dataset.id),
  pickChar:b => { S.sel = { c:+b.dataset.c, j:'pelvis' }; S.target = +b.dataset.c; renderSide(); renderTools(); requestRender(); },
  addChar, removeChar, faceThem, lookAt:lookAtOther,
  pose:b => setPose(b.dataset.id),
  resetPart,
  target:b => { S.target = +b.dataset.c; renderTools(); renderSide(); },
  size:b => frameSize(b.dataset.v),
  angle:b => frameAngle(b.dataset.v),
  lens:b => setLens(+b.dataset.l),
  grid:() => { S.grid = !S.grid; renderTools(); },
  goShot:b => goShot(+b.dataset.i),
  addShot, addReverse, dupShot, delShot,
  moveShot:b => moveShot(+b.dataset.d),
  newBoard:async () => {
    if(!await ask(L('Nouveau storyboard ?', 'New storyboard?'), L('Le storyboard actuel sera remplacé. Tu pourras revenir en arrière avec Annuler.', 'The current storyboard will be replaced. You can go back with Undo.'), L('Nouveau storyboard', 'New storyboard'))) return;
    pushUndo(); S.doc = newDoc(shot().set); S.i = 0; S.sel = null; S.target = 0; THUMBS.clear(); changed(true);
  },
  help:showHelp,
};
function closeMenus(){ const m = document.getElementById('exportMenu'); if(m) m.classList.add('hidden'); }

function bindEvents(){
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if(!e.target.closest('.menu-wrap')) closeMenus();
    if(!b || b.tagName === 'INPUT' || b.tagName === 'SELECT' || b.disabled) return;
    const f = ACT[b.dataset.act]; if(f){ e.preventDefault(); f(b, e); }
  });
  let sliderSnap = null, capSnap = null;
  document.addEventListener('input', e => {
    const t = e.target;
    if(t.id === 'tbTitle'){ S.doc.title = t.value; save(); return; }
    if(t.id === 'cap'){ if(!capSnap) capSnap = snapshot(); shot().info.cap = t.value; save(); const c = document.querySelector(`.shot-card[data-i="${S.i}"] .sc-t`); if(c) c.lastChild.textContent = t.value || L('Sans description', 'No description'); return; }
    if((t.dataset.act === 'axis' || t.dataset.act === 'root') && S.sel){
      if(!sliderSnap) sliderSnap = snapshot();
      const ch = shot().chars[S.sel.c];
      if(t.dataset.act === 'axis') ch.j[S.sel.j][+t.dataset.i] = +t.value;
      else if(+t.dataset.i === 0) ch.root.ry = +t.value; else ch.root.y = +t.value;
      renderSide(true); requestRender();
    }
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if(t.dataset.act === 'axis' || t.dataset.act === 'root'){ pushUndo(sliderSnap); sliderSnap = null; changed(); }
    if(t.id === 'cap' && capSnap){ pushUndo(capSnap); capSnap = null; }
    if(t.dataset.act === 'info'){ const k = t.dataset.k; edit(() => { shot().info[k] = k === 'dur' ? +t.value : t.value; }); renderStrip(); }
  });
  const c = R.canvas;
  c.addEventListener('pointerdown', onDown); c.addEventListener('pointermove', onMove); c.addEventListener('pointerup', onUp); c.addEventListener('pointercancel', onUp);
  c.addEventListener('pointerleave', () => { if(!DRAG.mode && S.hover){ S.hover = null; requestRender(); renderHint(); } });
  c.addEventListener('wheel', onWheel, { passive:false });
  c.addEventListener('dblclick', onDblClick);
  // la poignée au-dessus des têtes
  const hd = document.getElementById('handles');
  hd.addEventListener('pointerdown', onHandleDown);
  document.addEventListener('pointermove', onHandleMove);
  document.addEventListener('pointerup', () => { if(HDRAG.c >= 0){ onHandleUp(); renderHint(); } });
  document.addEventListener('pointercancel', onHandleUp);
  // le pavé de déplacement : on maintient
  const nav = document.getElementById('nav');
  nav.addEventListener('pointerdown', e => { const b = e.target.closest('[data-nav]'); if(!b) return; e.preventDefault(); b.setPointerCapture(e.pointerId); NAV.held = b.dataset.nav; b.classList.add('on'); navStart(); });
  const navUp = () => { if(!NAV.held) return; nav.querySelectorAll('.on').forEach(x => x.classList.remove('on')); NAV.held = null; navEnd(); };
  nav.addEventListener('pointerup', navUp); nav.addEventListener('pointercancel', navUp); nav.addEventListener('lostpointercapture', navUp);
  document.addEventListener('keyup', e => { const k = NAV_KEYS[e.key.toLowerCase()]; if(k && NAV.keys.delete(k)) navEnd(); });
  window.addEventListener('blur', () => { if(NAV.keys.size){ NAV.keys.clear(); navEnd(); } });
  c.addEventListener('contextmenu', e => e.preventDefault());
  window.addEventListener('resize', fitStage);
  document.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase();
    if((tag === 'input' && e.target.type !== 'range') || tag === 'textarea' || tag === 'select') return;
    const mod = e.ctrlKey || e.metaKey;
    if(mod && e.key.toLowerCase() === 'z'){ e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if(mod && e.key.toLowerCase() === 'y'){ e.preventDefault(); redo(); return; }
    if(mod) return;
    const nk = NAV_KEYS[e.key.toLowerCase()];
    if(nk){ e.preventDefault(); if(!NAV.keys.has(nk)){ NAV.keys.add(nk); navStart(); } return; }
    if(e.key === 'ArrowRight'){ e.preventDefault(); goShot(S.i + 1); }
    else if(e.key === 'ArrowLeft'){ e.preventDefault(); goShot(S.i - 1); }
    else if(e.key.toLowerCase() === 'n'){ e.preventDefault(); addShot(); }
    else if(e.key === 'Escape'){ if(S.sel){ S.sel = null; renderSide(); renderHint(); requestRender(); } closeMenus(); }
  });
}

/* ---------- Démarrage ---------- */
(function boot(){
  document.documentElement.lang = getLang();
  if(!load()){ S.doc = newDoc('garage'); S.i = 0; }
  renderUI();
  R.canvas = document.getElementById('view');
  if(!GL.init(R.canvas)){
    document.getElementById('stage').innerHTML = `<div class="nogl"><b>${L('La 3D n’est pas disponible dans ce navigateur.', '3D isn’t available in this browser.')}</b>${L('Raging 3D a besoin de WebGL. Essaie avec une version récente de Chrome, Edge ou Firefox, ou active l’accélération matérielle dans les réglages du navigateur.', 'Raging 3D needs WebGL. Try a recent Chrome, Edge or Firefox, or turn on hardware acceleration in your browser settings.')}</div>`;
    return;
  }
  initMeshes(); bindEvents(); fitStage(); renderStrip(); renderHint();
})();
