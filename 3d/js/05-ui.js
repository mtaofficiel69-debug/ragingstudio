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
            <div class="stage" id="stage"><canvas id="view"></canvas><div class="thirds" id="thirds"><i></i><i></i><i></i><i></i></div><div class="handles" id="handles"></div><div class="shot-no" id="shotNo"></div><div class="hint" id="hint"></div><div class="nav" id="nav"></div><div class="play-box" id="playBox"></div><div class="play-bar"><i id="playBar"></i></div><button class="play-stop" data-act="stopBoard">■ ${L('Arrêter', 'Stop')}</button><div class="rec hidden" id="recBox"></div></div>
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
    `<button data-act="exportPdf" data-per="6">${icon('new')}<span><b>${L('Planche PDF · 6 plans par page', 'PDF board · 6 shots per page')}</b><small>${L('Pour voir tout le film d’un coup d’œil', 'To see the whole film at a glance')}</small></span></button>
     <button data-act="exportPdf" data-per="3">${icon('new')}<span><b>${L('Planche PDF · 3 grands plans par page', 'PDF board · 3 large shots per page')}</b><small>${L('Avec l’action, le dialogue et de la place pour écrire : pour le tournage', 'With action, dialogue and room to write: for the shoot')}</small></span></button>
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

/* ---------- À gauche, en trois étapes : le lieu, les personnages, la pose ---------- */
function slider(label, act, i, v, min, max, step, unit){
  return `<label class="sl"><span class="sl-h"><span>${esc(label)}</span><b>${round(v, step < 1 ? 2 : 0)}${unit || '°'}</b></span>
    <input type="range" data-act="${act}" data-i="${i}" min="${min}" max="${max}" step="${step}" value="${v}"></label>`;
}
const charName = c => { const ch = shot().chars[c]; const lk = lookOf(ch, c); return esc(L(lk.fr, lk.en)); };
/* une petite silhouette, homme ou femme, à la couleur du personnage */
const figure = lk => `<svg class="fig" viewBox="0 0 16 20" aria-hidden="true"><circle cx="8" cy="4" r="3.2" fill="${lk.col}"/>${lk.body === 'f' ? `<path d="M8 1A3.6 3.6 0 0 1 11.6 4.6V6H4.4V4.6A3.6 3.6 0 0 1 8 1Z" fill="#6B5446"/>` : ''}<path d="${lk.body === 'f' ? 'M5.2 8h5.6l2.4 9H2.8Z' : 'M4 8h8l.8 11H3.2Z'}" fill="${lk.col}"/><path d="M8 1A3.2 3.2 0 1 1 8 7.4 3.2 3.2 0 1 1 8 1ZM4 8h8" fill="none" stroke="#00000030" stroke-width=".8"/></svg>`;
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
  const target = sel ? sel.c : S.target, used = chars.map(c => c.look);
  const place = SETS.map(s => `<button class="chip-btn place ${sh.set === s.id ? 'on' : ''}" data-act="place" data-id="${s.id}"><i class="sw sw-${s.id}"></i>${esc(L(s.fr, s.en))}</button>`).join('');
  const who = chars.map((c, i) => `<div class="who ${target === i ? 'on' : ''}">
      <button class="who-main" data-act="pickChar" data-c="${i}">${figure(lookOf(c, i))}${charName(i)}</button>
      ${chars.length > 1 ? `<button class="who-x" data-act="removeChar" data-c="${i}" title="${esc(L('Retirer ce personnage du plan', 'Remove this character from the shot'))}">${icon('close')}</button>` : ''}
    </div>`).join('');
  const add = chars.length < MAX_CHARS ? `<div class="add-row"><span>${L('Ajouter', 'Add')}</span>${CHAR_LOOK.map((lk, k) => `<button class="add-fig" data-act="addChar" data-look="${k}" ${used.includes(k) ? 'disabled' : ''} title="${esc(L(lk.fr, lk.en))}">${figure(lk)}<small>${esc(L(lk.fr, lk.en))}</small></button>`).join('')}</div>` : '';
  const spots = (SPOTS[sh.set] || []).map((p, k) => `<button class="chip-btn" data-act="spot" data-k="${k}">${esc(L(p[0], p[1]))}</button>`).join('');
  const pair = chars.length > 1 ? `<div class="pair"><button class="chip-btn" data-act="faceThem">${L('Se faire face', 'Face each other')}</button><button class="chip-btn" data-act="lookAt">${L('Regarder l’autre', 'Look at the other')}</button></div>` : '';
  const poses = POSES.map(p => `<button class="chip-btn" data-act="pose" data-id="${p.id}">${esc(L(p.fr, p.en))}</button>`).join('');
  let part;
  if(sel){
    const J = JOINT[sel.j], v = chars[sel.c].j[sel.j], ch = chars[sel.c];
    part = `<div class="part-h"><b>${esc(L(J.fr, J.en))}</b><span>${charName(sel.c)}</span></div>
      ${J.ax.map((a, i) => slider(L(a[4], a[5]), 'axis', i, v[i], a[2], a[3], 1)).join('')}
      ${sel.j === 'pelvis' ? `${slider(L('Tout le corps : tourner', 'Whole body: turn'), 'root', 0, ch.root.ry, -180, 180, 1)}
        ${slider(L('Tout le corps : hauteur', 'Whole body: height'), 'root', 1, ch.root.y, -0.8, 1.2, 0.01, ' m')}` : ''}
      <button class="btn btn-sm btn-ghost" data-act="resetPart">${icon('reset')}${L('Remettre droit', 'Straighten')}</button>`;
  } else part = `<p class="tip">${L('Pour un geste précis : clique sur une partie du corps dans l’image et glisse. Ses réglages s’affichent ici.', 'For a precise gesture: click a body part in the picture and drag. Its settings show up here.')}</p>`;
  el.innerHTML = `
    <div class="sec"><h3><i class="step">1</i>${L('Le lieu', 'The place')}</h3><div class="grid2">${place}</div></div>
    <div class="sec"><h3><i class="step">2</i>${L('Les personnages', 'The characters')}</h3>${who}${add}
      <div class="sub-h">${L('Placer', 'Place')} <b>${charName(target)}</b></div><div class="chips">${spots}</div>${pair}</div>
    <div class="sec"><h3><i class="step">3</i>${L('La pose de', 'Pose for')}&nbsp;<span class="for">${charName(target)}</span></h3><div class="chips">${poses}</div></div>
    <div class="sec sec-part"><h3>${L('Partie du corps', 'Body part')}</h3>${part}</div>
    <div class="side-foot"><button class="btn btn-sm btn-ghost" data-act="newBoard">${icon('new')}${L('Nouveau storyboard', 'New storyboard')}</button><button class="btn btn-sm btn-ghost" data-act="help">${icon('help')}${L('Aide', 'Help')}</button></div>`;
}

/* ---------- Au-dessus de l'image : le cadrage en un clic ---------- */
function renderTools(){
  const el = document.getElementById('tools'); if(!el) return;
  const sh = shot(), two = sh.chars.length > 1, inf = sh.info;
  const sizes = ['pg', 'pe', 'pa', 'pm', 'pr', 'gp', 'tgp'].concat(two ? ['am', '2p'] : [], ['pov']);
  const btn = (k, act, on, label, title) => `<button class="${on ? 'on' : ''}" data-act="${act}" data-v="${k}" title="${esc(title)}">${esc(label)}</button>`;
  el.innerHTML = `
    <div class="tools-row">
      <div class="tg"><span class="tl">${L('Cadrer', 'Frame')}</span><div class="seg2">${sh.chars.map((c, i) => `<button class="${S.target === i ? 'on' : ''}" data-act="target" data-c="${i}" title="${esc(L('Le cadrage vise ', 'Framing aims at ') + L(lookOf(c, i).fr, lookOf(c, i).en))}">${figure(lookOf(c, i))}${sh.chars.length > 2 ? esc(L(lookOf(c, i).fr, lookOf(c, i).en).replace(/^(\S)\S*\s/, '$1')) : charName(i)}</button>`).join('')}</div></div>
      <div class="tg"><span class="tl">${L('Valeur', 'Size')}</span><div class="seg2">${sizes.map(k => btn(k, 'size', inf.size === k, shotLabel('size', k, true), shotLabel('size', k))).join('')}</div></div>
    </div>
    <div class="tools-row">
      <div class="tg"><span class="tl">${L('Angle', 'Angle')}</span><div class="seg2">${['neu', 'plo', 'con', 'dess', 'sol', 'deb'].map(k => btn(k, 'angle', inf.angle === k, shotLabel('angle', k), shotLabel('angle', k))).join('')}</div></div>
      <div class="tg"><span class="tl">${L('Côté', 'Side')}</span><div class="seg2">${SIDES.map(x => btn(x[0], 'side', inf.side === x[0], L(x[1], x[2]), L(x[1], x[2]))).join('')}</div></div>
      <div class="tg"><span class="tl">${L('Focale', 'Lens')}</span><div class="seg2">${LENSES.map(l => `<button class="${Math.round(sh.cam.lens) === l ? 'on' : ''}" data-act="lens" data-l="${l}" title="${l} mm">${l}</button>`).join('')}</div></div>
      <button class="grid-btn ${S.grid ? 'on' : ''}" data-act="grid" title="${esc(L('Grille des tiers', 'Rule of thirds'))}"><svg viewBox="0 0 16 16" class="icon" fill="none" stroke="currentColor" stroke-width="1.3"><rect x="1.5" y="2.5" width="13" height="11" rx="1"/><path d="M6 2.5v11M10 2.5v11M1.5 6.2h13M1.5 9.8h13"/></svg></button>
    </div>`;
  document.getElementById('thirds').classList.toggle('hidden', !S.grid);
}

/* ---------- À droite : la fiche du plan ---------- */
const opt = (k, v) => SHOT[k].map(o => `<option value="${o[0]}" ${o[0] === v ? 'selected' : ''}>${esc(L(o[1], o[2]))}</option>`).join('');
function renderShotPanel(){
  const el = document.getElementById('sheet'); if(!el) return;
  const sh = shot(), inf = sh.info, n = S.doc.shots.length;
  document.getElementById('shotNo').textContent = (inf.scene ? L('Sc. ', 'Sc. ') + inf.scene + ' · ' : '') + L('Plan ', 'Shot ') + (S.i + 1);
  el.innerHTML = `
    <div class="sec">
      <h3>${L('Plan', 'Shot')} ${S.i + 1} <span class="for">${L('sur', 'of')} ${n}</span></h3>
      <div class="fld-row"><label class="fld"><span>${L('Scène', 'Scene')}</span><input id="fScene" data-k="scene" maxlength="40" value="${esc(inf.scene)}" placeholder="${esc(L('ex. 3', 'e.g. 3'))}"></label>
        <label class="fld"><span>${L('Durée', 'Length')}</span><select data-act="info" data-k="dur">${[1, 1.5, 2, 3, 4, 5, 8].map(d => `<option value="${d}" ${d === inf.dur ? 'selected' : ''}>${fmtTime(d)}</option>`).join('')}</select></label></div>
      <label class="fld"><span>${L('Ce qui se passe', 'What happens')}</span><textarea id="cap" data-k="cap" rows="3" placeholder="${esc(L('Léa entre dans le café et cherche quelqu’un.', 'Léa walks into the café, looking for someone.'))}">${esc(inf.cap)}</textarea></label>
      <label class="fld"><span>${L('Dialogue ou son', 'Dialogue or sound')}</span><textarea id="dial" data-k="dial" rows="2" placeholder="${esc(L('LÉA : Tu es en retard.', 'LÉA: You’re late.'))}">${esc(inf.dial)}</textarea></label>
      <label class="fld"><span>${L('Mouvement de caméra', 'Camera move')}</span><select data-act="info" data-k="move">${opt('move', inf.move)}</select></label>
      <details class="more"><summary>${L('Valeur et angle notés', 'Noted size and angle')}</summary>
        <p class="tip">${L('Remplis tout seuls quand tu cadres avec les boutons. Change-les ici si besoin.', 'Filled in when you frame with the buttons. Change them here if needed.')}</p>
        <label class="fld"><span>${L('Valeur', 'Size')}</span><select data-act="info" data-k="size">${opt('size', inf.size)}</select></label>
        <label class="fld"><span>${L('Angle', 'Angle')}</span><select data-act="info" data-k="angle">${opt('angle', inf.angle)}</select></label>
        <p class="tip">${L('Focale', 'Lens')} : <b>${Math.round(sh.cam.lens)} mm</b></p></details>
    </div>
    <div class="sec">
      <div class="acts">
        <button class="chip-btn" data-act="dupShot">${L('Dupliquer', 'Duplicate')}</button>
        <button class="chip-btn" data-act="moveShot" data-d="-1" ${S.i === 0 ? 'disabled' : ''} title="${esc(L('Avancer ce plan', 'Move this shot earlier'))}">←</button>
        <button class="chip-btn" data-act="moveShot" data-d="1" ${S.i === n - 1 ? 'disabled' : ''} title="${esc(L('Reculer ce plan', 'Move this shot later'))}">→</button>
        <button class="chip-btn danger" data-act="delShot" ${n < 2 ? 'disabled' : ''}>${icon('trash')}${L('Supprimer', 'Delete')}</button>
      </div>
    </div>`;
}

/* ---------- En bas : la planche (on glisse une vignette pour changer l'ordre) ---------- */
const fmtDur = t => { const m = Math.floor(t / 60), s = Math.round(t % 60); return m + ':' + String(s).padStart(2, '0'); };
function renderStrip(){
  const el = document.getElementById('strip'); if(!el) return;
  const two = shot().chars.length > 1, n = S.doc.shots.length;
  el.innerHTML = `<div class="strip-h"><b>${L('Planche', 'Board')}</b><span>${n} ${n > 1 ? L('plans', 'shots') : L('plan', 'shot')} · ${fmtDur(totalDur())}</span>
      <span class="strip-tip">${L('Glisse une vignette pour changer l’ordre', 'Drag a thumbnail to reorder')}</span>
      <button class="btn btn-sm btn-play" data-act="playBoard">${icon('play')}${L('Lire le storyboard', 'Play the storyboard')}</button></div>
    <div class="cards" id="cards">${S.doc.shots.map((s, i) => `<button class="shot-card ${i === S.i ? 'on' : ''}" data-act="goShot" data-i="${i}" draggable="true">
        <span class="sc-img"><img src="${thumbOf(i)}" alt="" draggable="false"><span class="sc-n">${i + 1}</span>${s.info.scene ? `<span class="sc-sc">${esc(L('Sc. ', 'Sc. ') + s.info.scene)}</span>` : ''}<span class="sc-d">${fmtTime(s.info.dur || 2)}</span></span>
        <span class="sc-t"><b>${esc(shotLabel('size', s.info.size, true))}</b>${esc(s.info.cap || L('Sans description', 'No description'))}</span></button>`).join('')}
      <div class="add-col">
        <button class="add-shot" data-act="addShot" title="${esc(L('Reprend le plan actuel (touche N)', 'Starts from the current shot (N key)'))}">${icon('plus')}<span>${L('Nouveau plan', 'New shot')}</span></button>
        ${two ? `<button class="add-shot rev" data-act="addReverse" title="${esc(L('Le plan suivant, par-dessus l’épaule de l’autre personnage', 'The next shot, over the other character’s shoulder'))}">⇄<span>${L('Contrechamp', 'Reverse shot')}</span></button>` : ''}
      </div></div>`;
  const on = el.querySelector('.shot-card.on'); if(on) on.scrollIntoView({ block:'nearest', inline:'nearest' });
}
function renderHint(){
  const el = document.getElementById('hint'); if(!el) return;
  let t;
  if(S.play) t = L('Lecture du storyboard · Échap ou clic pour arrêter', 'Playing the storyboard · Esc or click to stop');
  else if(S.hover) t = L(JOINT[S.hover.j].fr, JOINT[S.hover.j].en) + ' · ' + (S.hover.j === 'pelvis' ? L('glisse pour déplacer le personnage', 'drag to move the character') : L('glisse pour bouger', 'drag to move'));
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
/* la planche PDF : 6 plans par page (vue d'ensemble), ou 3 grands plans par page avec la place d'écrire */
async function exportPdf(per){
  per = per === 3 ? 3 : 6;
  let jsPDF;
  try{ jsPDF = await loadPdf(); }catch(e){ toast(L('Impossible de charger l’outil PDF : vérifie ta connexion.', 'Could not load the PDF tool: check your connection.'), 'warn'); return; }
  const doc = new jsPDF({ orientation:'landscape', unit:'mm', format:'a4' });
  const W = 297, H = 210, M = 12, shots = S.doc.shots, pages = Math.ceil(shots.length / per);
  const meta = s => [shotLabel('size', s.info.size), shotLabel('angle', s.info.angle), shotLabel('move', s.info.move), Math.round(s.cam.lens) + ' mm', fmtTime(s.info.dur || 2)].filter(Boolean).join(' · ');
  const badge = (i, x, y) => {
    doc.setFillColor(23, 122, 79); doc.roundedRect(x + 2, y + 2, 9, 5.4, 1, 1, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(255, 255, 255); doc.text(String(i + 1), x + 6.5, y + 5.8, { align:'center' });
  };
  const ruled = (x, y, w, n, from) => { doc.setDrawColor(218, 223, 230); doc.setLineWidth(0.2); for(let l = from; l < n; l++) doc.line(x, y + 0.6 + l * 4, x + w, y + 0.6 + l * 4); };
  for(let p = 0; p < pages; p++){
    if(p) doc.addPage();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(35, 38, 46);
    doc.text(pdfText(S.doc.title || 'Storyboard'), M, M + 5);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(92, 98, 112);
    doc.text(pdfText(L('Storyboard · page ', 'Storyboard · page ') + (p + 1) + ' / ' + pages + ' · ' + shots.length + ' ' + L('plans', 'shots') + ' · ' + fmtDur(totalDur())), W - M, M + 5, { align:'right' });
    doc.setDrawColor(35, 38, 46); doc.setLineWidth(0.4); doc.line(M, M + 9, W - M, M + 9);
    for(let k = 0; k < per; k++){
      const i = p * per + k; if(i >= shots.length) break;
      const s = shots[i], title = (s.info.scene ? L('Scène ', 'Scene ') + s.info.scene + ' · ' : '') + L('Plan ', 'Shot ') + (i + 1);
      if(per === 6){
        const cols = 3, gx = 8, gy = 10, cw = (W - 2 * M - (cols - 1) * gx) / cols, ih = cw * 9 / 16, ch = (H - 2 * M - 16 - gy) / 2;
        const x = M + (k % cols) * (cw + gx), y = M + 16 + Math.floor(k / cols) * (ch + gy);
        doc.addImage(renderShotURL(i, 960, 540, 'image/jpeg', 0.86), 'JPEG', x, y, cw, ih);
        doc.setDrawColor(35, 38, 46); doc.setLineWidth(0.3); doc.rect(x, y, cw, ih); badge(i, x, y);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(35, 38, 46); doc.text(pdfText(title), x, y + ih + 5);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(23, 122, 79); doc.text(pdfText(meta(s)), x, y + ih + 9.2, { maxWidth:cw });
        doc.setFontSize(8.5); doc.setTextColor(60, 64, 74);
        const lines = doc.splitTextToSize(pdfText(s.info.cap), cw).slice(0, 2); doc.text(lines, x, y + ih + 14);
        if(s.info.dial){ doc.setFont('helvetica', 'italic'); doc.setTextColor(92, 98, 112); doc.text(doc.splitTextToSize(pdfText(s.info.dial), cw).slice(0, 1), x, y + ih + 22); }
        else ruled(x, y + ih + 14, cw, 3, lines.length);
      } else {
        const rh = (H - 2 * M - 16) / 3, ih = rh - 6, iw = ih * 16 / 9, x = M, y = M + 15 + k * rh, tx = x + iw + 8, tw = W - M - tx;
        doc.addImage(renderShotURL(i, 1280, 720, 'image/jpeg', 0.86), 'JPEG', x, y, iw, ih);
        doc.setDrawColor(35, 38, 46); doc.setLineWidth(0.3); doc.rect(x, y, iw, ih); badge(i, x, y);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(35, 38, 46); doc.text(pdfText(title), tx, y + 5);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(23, 122, 79); doc.text(pdfText(meta(s)), tx, y + 10.5, { maxWidth:tw });
        doc.setFontSize(7.5); doc.setTextColor(92, 98, 112); doc.text(pdfText(L('ACTION', 'ACTION')), tx, y + 17);
        doc.setFontSize(9.5); doc.setTextColor(45, 48, 56);
        const lines = doc.splitTextToSize(pdfText(s.info.cap), tw).slice(0, 4); doc.text(lines, tx, y + 21.5); ruled(tx, y + 21.5, tw, 4, lines.length);
        doc.setFontSize(7.5); doc.setTextColor(92, 98, 112); doc.text(pdfText(L('DIALOGUE / SON', 'DIALOGUE / SOUND')), tx, y + 40);
        doc.setFont('helvetica', 'italic'); doc.setFontSize(9.5); doc.setTextColor(45, 48, 56);
        const dl = doc.splitTextToSize(pdfText(s.info.dial), tw).slice(0, 2); doc.text(dl, tx, y + 44.5); doc.setFont('helvetica', 'normal'); ruled(tx, y + 44.5, tw, 2, dl.length);
        if(k < 2){ doc.setDrawColor(218, 223, 230); doc.setLineWidth(0.2); doc.line(M, y + rh - 2.5, W - M, y + rh - 2.5); }
      }
    }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(92, 98, 112);
    doc.text('Raging 3D · ragingstudio.com/3d', M, H - 6);
  }
  doc.save(safeName(S.doc.title) + ' - storyboard.pdf');
  toast(L('Planche PDF enregistrée.', 'PDF board saved.'));
}

/* ---------- Lire le storyboard dans l'outil : chaque plan pendant sa durée, avec sa description ---------- */
function playBoard(){
  if(S.play){ stopBoard(); return; }
  const shots = S.doc.shots, starts = []; let total = 0; shots.forEach(s => { starts.push(total); total += s.info.dur || 2; });
  S.play = { t0:performance.now(), from:S.i, last:-1 }; S.sel = null; S.hover = null;
  const st = document.getElementById('stage'); st.classList.add('playing');
  const box = document.getElementById('playBox');
  const t0 = S.play.t0 - starts[S.i] * 1000;
  const step = now => {
    if(!S.play) return;
    const t = (now - t0) / 1000;
    if(t >= total){ stopBoard(); return; }
    let i = 0; while(i + 1 < shots.length && starts[i + 1] <= t) i++;
    if(i !== S.play.last){
      S.play.last = i; const s = shots[i];
      box.innerHTML = `<b>${(s.info.scene ? L('Sc. ', 'Sc. ') + esc(s.info.scene) + ' · ' : '') + L('Plan ', 'Shot ') + (i + 1)}</b>${s.info.cap ? `<span>${esc(s.info.cap)}</span>` : ''}${s.info.dial ? `<i>${esc(s.info.dial)}</i>` : ''}`;
      document.querySelectorAll('.shot-card').forEach((c, k) => c.classList.toggle('now', k === i));
    }
    drawFrame(shots[i], null, null, true);
    document.getElementById('playBar').style.width = (t / total * 100) + '%';
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step); renderStrip(); renderHint();
}
function stopBoard(){
  if(!S.play) return;
  S.play = null;
  document.getElementById('stage').classList.remove('playing');
  document.querySelectorAll('.shot-card.now').forEach(c => c.classList.remove('now'));
  renderStrip(); renderHint(); requestRender();
}

/* ---------- La première visite : trois étapes, puis on n'en parle plus ---------- */
function showIntro(force){
  if(!force && lsGet('raging3d_intro')) return;
  const st = document.getElementById('stage'); if(!st || st.querySelector('.intro')) return;
  const el = document.createElement('div'); el.className = 'intro';
  el.innerHTML = `<div class="intro-card"><h3>${L('Ton storyboard en 3D, sans dessiner', 'Your storyboard in 3D, no drawing')}</h3>
    <ol><li><b>${L('Installe', 'Set up')}</b>${L('Choisis un lieu, ajoute tes personnages, place-les.', 'Pick a place, add your characters, place them.')}</li>
      <li><b>${L('Cadre', 'Frame')}</b>${L('Clique sur une valeur de plan au-dessus de l’image : la caméra se place.', 'Click a shot size above the picture: the camera places itself.')}</li>
      <li><b>${L('Enchaîne', 'Keep going')}</b>${L('« Nouveau plan » reprend le plan actuel. Puis exporte la planche en PDF.', '“New shot” starts from the current one. Then export the board as a PDF.')}</li></ol>
    <button class="btn btn-primary" data-act="introOk">${L('C’est parti', 'Let’s go')}</button></div>`;
  st.appendChild(el);
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
      <li><b>${L('Le lieu', 'The place')}</b>${L('À gauche, étape 1 : garage, bureau, salon, café, couloir, ruelle, taxi ou parc.', 'On the left, step 1: garage, office, living room, café, hallway, alley, taxi or park.')}</li>
      <li><b>${L('Les personnages', 'The characters')}</b>${L('Étape 2 : ajoute jusqu’à quatre personnages (deux hommes, deux femmes), puis « Placer » pour les mettre à un endroit tout prêt : au volant, au comptoir, sur le canapé…', 'Step 2: add up to four characters (two men, two women), then “Place” to put them in a ready-made spot: at the wheel, at the counter, on the sofa…')}</li>
      <li><b>${L('La pose', 'The pose')}</b>${L('Étape 3 : une pose rapide (assis, course, bras croisés…). Pour un geste précis, clique sur une partie du corps et glisse.', 'Step 3: a quick pose (sitting, running, arms crossed…). For a precise gesture, click a body part and drag.')}</li>
      <li><b>${L('Déplacer un personnage', 'Move a character')}</b>${L('Maintiens le losange vert au-dessus de sa tête ; la petite flèche à côté le fait tourner. Le losange n’apparaît jamais dans les exports.', 'Hold the green diamond above their head; the small arrow next to it turns them. The diamond never shows in exports.')}</li>
      <li><b>${L('Cadrer', 'Frame')}</b>${L('Au-dessus de l’image : sur qui, la valeur (du plan général au très gros plan, amorce, plan à deux, subjectif), l’angle, le côté (face, trois-quarts, profil, dos) et la focale.', 'Above the picture: on whom, the size (from extreme wide to extreme close-up, over the shoulder, two-shot, point of view), the angle, the side (front, three-quarter, profile, back) and the lens.')}</li>
      <li><b>${L('Se promener', 'Move around')}</b>${L('Glisse dans le vide pour tourner, clic droit + glisser pour te décaler, molette pour avancer, double-clic pour viser. ZQSD ou WASD pour marcher, R et F pour monter et descendre.', 'Drag empty space to orbit, right-click + drag to pan, wheel to move in, double-click to aim. WASD or ZQSD to walk, R and F to go up and down.')}</li>
      <li><b>${L('Décrire', 'Describe')}</b>${L('À droite : la scène, ce qui se passe, le dialogue, le mouvement de caméra et la durée.', 'On the right: the scene, what happens, the dialogue, the camera move and the length.')}</li>
      <li><b>${L('Enchaîner', 'Keep going')}</b>${L('« Nouveau plan » reprend le plan actuel. « Contrechamp » fait le plan inverse. Glisse les vignettes pour changer l’ordre, et « Lire le storyboard » pour le voir défiler.', '“New shot” starts from the current one. “Reverse shot” makes the opposite angle. Drag thumbnails to reorder, and “Play the storyboard” to watch it.')}</li>
      <li><b>${L('Exporter', 'Export')}</b>${L('La planche en PDF (6 ou 3 plans par page), l’image d’un plan, ou l’animatique en vidéo.', 'The board as a PDF (6 or 3 shots per page), the image of a shot, or the animatic as a video.')}</li>
    </ol>
    <p class="keys">${L('Raccourcis : ← → plan précédent ou suivant · ZQSD / WASD et ↑ ↓ se déplacer · R F monter, descendre · N nouveau plan · Espace lire le storyboard · Ctrl+Z annuler · Échap désélectionner', 'Shortcuts: ← → previous or next shot · WASD / ZQSD and ↑ ↓ move · R F up, down · N new shot · Space play the storyboard · Ctrl+Z undo · Esc deselect')}</p></div>`;
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
  exportPdf:b => { closeMenus(); exportPdf(+b.dataset.per); },
  exportImage:() => { closeMenus(); exportImage(); },
  exportVideo:() => { closeMenus(); exportVideo(); },
  cancelRec:() => { if(S.rec) S.rec.cancel = true; },
  place:b => setPlace(b.dataset.id),
  pickChar:b => { S.sel = { c:+b.dataset.c, j:'pelvis' }; S.target = +b.dataset.c; renderSide(); renderTools(); requestRender(); },
  addChar:b => addChar(+b.dataset.look), removeChar:b => removeChar(+b.dataset.c), faceThem, lookAt:lookAtOther,
  spot:b => placeAt(+b.dataset.k), side:b => frameSide(b.dataset.v),
  playBoard, stopBoard, introOk:() => { lsSet('raging3d_intro', '1'); const i = document.querySelector('.intro'); if(i) i.remove(); },
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
    // les champs du plan : scène, ce qui se passe, dialogue
    if(t.id === 'cap' || t.id === 'dial' || t.id === 'fScene'){
      if(!capSnap) capSnap = snapshot(); shot().info[t.dataset.k] = t.value; save();
      const card = document.querySelector(`.shot-card[data-i="${S.i}"]`);
      if(card && t.id === 'cap') card.querySelector('.sc-t').lastChild.textContent = t.value || L('Sans description', 'No description');
      if(t.id === 'fScene') document.getElementById('shotNo').textContent = (t.value ? L('Sc. ', 'Sc. ') + t.value + ' · ' : '') + L('Plan ', 'Shot ') + (S.i + 1);
      return;
    }
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
    if((t.id === 'cap' || t.id === 'dial' || t.id === 'fScene') && capSnap){ pushUndo(capSnap); capSnap = null; if(t.id === 'fScene') renderStrip(); }
    if(t.dataset.act === 'info'){ const k = t.dataset.k; edit(() => { shot().info[k] = k === 'dur' ? +t.value : t.value; }); renderStrip(); }
  });
  const c = R.canvas;
  c.addEventListener('pointerdown', onDown); c.addEventListener('pointermove', onMove); c.addEventListener('pointerup', onUp); c.addEventListener('pointercancel', onUp);
  c.addEventListener('pointerleave', () => { if(!DRAG.mode && S.hover){ S.hover = null; requestRender(); renderHint(); } });
  c.addEventListener('wheel', onWheel, { passive:false });
  c.addEventListener('dblclick', onDblClick);
  // la planche : glisser une vignette pour la changer de place
  const strip = document.getElementById('strip'); let dragFrom = -1;
  strip.addEventListener('dragstart', e => { const c = e.target.closest('.shot-card'); if(!c) return; dragFrom = +c.dataset.i; c.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; try{ e.dataTransfer.setData('text/plain', String(dragFrom)); }catch(err){} });
  const dropIndex = e => { const cards = [...strip.querySelectorAll('.shot-card')]; for(let i = 0; i < cards.length; i++){ const r = cards[i].getBoundingClientRect(); if(e.clientX < r.left + r.width / 2) return i; } return cards.length; };
  strip.addEventListener('dragover', e => { if(dragFrom < 0) return; e.preventDefault(); const k = dropIndex(e); strip.querySelectorAll('.shot-card').forEach((c, i) => { c.classList.toggle('drop-l', i === k); c.classList.toggle('drop-r', k === S.doc.shots.length && i === k - 1); }); });
  const dragEnd = () => { dragFrom = -1; strip.querySelectorAll('.drag, .drop-l, .drop-r').forEach(c => c.classList.remove('drag', 'drop-l', 'drop-r')); };
  strip.addEventListener('drop', e => { if(dragFrom < 0) return; e.preventDefault(); const f = dragFrom, k = dropIndex(e); dragEnd(); dropShot(f, k); });
  strip.addEventListener('dragend', dragEnd);
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
    else if(e.key === 'Escape' && S.play){ stopBoard(); }
    else if(e.key === ' ' && e.target === document.body){ e.preventDefault(); playBoard(); }
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
  initMeshes(); bindEvents(); fitStage(); renderStrip(); renderHint(); showIntro();
})();
