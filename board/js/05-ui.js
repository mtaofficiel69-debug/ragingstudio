/* =====================================================================
   RAGING BOARD — INTERFACE
   La même maison que Raging Draw : à gauche la colonne sombre (les étapes),
   en haut la barre du projet, au centre l'image du plan, à droite le volet
   de l'étape choisie, en bas le storyboard (en bande, ou en planche entière).
===================================================================== */
const HUB = () => getLang() === 'fr' ? '../fr/' : '../';
const LS_PANEL = 'raging3d_panel', LS_THEME = 'raging3d_theme';
S.panel = lsGet(LS_PANEL) || 'place';
S.view = 'stage';          // 'stage' : on met en scène ; 'sheet' : la planche entière, pour écrire
S.crowd = -1;              // la foule choisie
S.veh = -1;                // le véhicule choisi
S.hidden = [];

/* ---------- Les étapes, dans la colonne de gauche ---------- */
const PANELS = [
  { g:['Le décor', 'The set'], items:[
    { id:'place', n:1, ic:'place', fr:'Le lieu', en:'The place' },
    { id:'car', ic:'car', fr:'Les véhicules', en:'Vehicles' },
    { id:'crowd', ic:'crowd', fr:'La foule', en:'Crowds' } ] },
  { g:['Les acteurs', 'The cast'], items:[
    { id:'chars', n:2, ic:'users', fr:'Les personnages', en:'The characters' },
    { id:'pose', n:3, ic:'pose', fr:'Les poses', en:'The poses' } ] },
  { g:['La caméra', 'The camera'], items:[
    { id:'frame', n:4, ic:'frame', fr:'Le cadrage', en:'Framing' },
    { id:'move', ic:'move', fr:'Le mouvement', en:'Camera move' } ] },
  { g:['Le plan', 'The shot'], items:[
    { id:'text', n:5, ic:'text', fr:'Ce qui se passe', en:'What happens' } ] },
  { g:['Le film', 'The film'], items:[
    { id:'look', ic:'contrast', fr:'Rendu et format', en:'Look & format' },
    { id:'export', ic:'export', fr:'Exporter', en:'Export' },
    { id:'help', ic:'help', fr:'Aide et raccourcis', en:'Help & shortcuts' } ] },
];
const PANEL = Object.fromEntries(PANELS.flatMap(g => g.items).map(p => [p.id, p]));
function setPanel(id, keep){
  if(!PANEL[id]) return;
  if(S.panel === id && keep) return;
  S.panel = id; lsSet(LS_PANEL, id);
  if(S.view === 'sheet' && id !== 'text' && id !== 'export' && id !== 'look' && id !== 'help') S.view = 'stage';
  renderUI();
}

/* ---------- La charpente de la page ---------- */
/* en immersion, l'atelier passe en sombre, comme une salle de cinéma (sans toucher au choix enregistré) */
function theme(){ return lsGet(LS_THEME) === 'dark' || (document.body.classList.contains('imm') && !document.body.classList.contains('on-home')) ? 'dark' : 'light'; }
function renderUI(){
  const app = document.getElementById('app');
  document.documentElement.lang = getLang(); document.documentElement.dataset.theme = theme();
  if(!app.querySelector('.rail')){
    app.innerHTML = `
      <aside class="rail" id="rail"></aside>
      <div class="main-col">
        <header class="topbar" id="topbar"></header>
        <div class="work">
          <section class="center">
            <div class="stage-area" id="stageArea">
              <div class="shot-head" id="shotHead"></div>
              <div class="stage-wrap" id="stageWrap">
                <div class="stage" id="stage"><canvas id="view"></canvas><div class="thirds" id="thirds"><i></i><i></i><i></i><i></i></div><div class="handles" id="handles"></div><div class="warn hidden" id="warn"></div><div class="hplan hidden" id="hplan"></div><div class="play-box" id="playBox"></div><div class="play-bar"><i id="playBar"></i></div><button class="play-stop" data-act="stopBoard">${icon('pause')}<span id="playStopLbl"></span></button><div class="rec hidden" id="recBox"></div></div>
              </div>
              <div class="under" id="under"><div class="dock" id="nav"></div><div class="hint" id="hint"></div></div>
            </div>
            <div class="sheet-view hidden" id="sheetView"></div>
            <div class="board" id="strip"></div>
          </section>
          <aside class="side" id="side"></aside>
        </div>
      </div>`;
  }
  renderRail(); renderTop(); renderHead(); renderPanel(); renderStrip(); renderHint(); renderNav(); renderView(); fitStage();
}
function renderRail(){
  const el = document.getElementById('rail'); if(!el) return;
  const s = shot(), n = S.doc.shots.length;
  const badge = id => id === 'chars' ? s.chars.length : id === 'crowd' ? (s.crowds.length || '') : id === 'car' ? ((s.vehicles || []).length || '') : '';
  el.innerHTML = `<a class="rail-brand" href="./" data-act="toHome" title="${esc(L('Mes storyboards', 'My storyboards'))}">${r3Logo(34, 'rail-logo')}${r3Wordmark()}</a>
    <div class="rail-project" data-label="${esc(L('Storyboard', 'Storyboard'))}">${esc(S.doc.title || L('Sans titre', 'Untitled'))}</div>
    <nav class="rail-nav">${PANELS.map(g => `<div class="rail-group">${esc(L(g.g[0], g.g[1]))}</div>` + g.items.map(p => {
      const b = badge(p.id), off = false;
      return `<button class="rail-item ${S.panel === p.id ? 'active' : ''} ${off ? 'dim' : ''}" data-act="panel" data-id="${p.id}" title="${esc(L(p.fr, p.en))}">${p.n ? `<i class="rn">${p.n}</i>` : icon(p.ic)}<span class="lbl">${esc(L(p.fr, p.en))}</span>${b !== '' ? `<b class="rb">${b}</b>` : ''}</button>`;
    }).join('')).join('')}</nav>
    <div class="rail-bottom"><span>${n} ${n > 1 ? L('plans', 'shots') : L('plan', 'shot')} · ${fmtDur(totalDur())}</span><span>${R3_VERSION}</span></div>`;
}
function renderTop(){
  const el = document.getElementById('topbar'); if(!el) return;
  if(!el.firstChild){
    el.innerHTML = `<div class="topbar-left">
        <button class="btn tb-back" id="tbBack" data-act="toHome">${icon('back')}<span class="tb-lbl" id="tbBackLbl"></span></button>
        <span class="tb-div"></span>
        <input class="tb-title" id="tbTitle" spellcheck="false" maxlength="80">
        <span class="tb-div"></span>
        <button class="btn tb-box" data-act="addShot" id="tbShot">${icon('plus')}<span class="tb-lbl" id="tbShotLbl"></span></button>
        <button class="btn tb-box" data-act="tbChar" id="tbChar">${icon('users')} + <span class="tb-lbl" id="tbCharLbl"></span></button>
        <button class="btn" data-act="full" id="tbFull">${icon('full')}<span class="tb-lbl" id="tbFullLbl"></span></button>
        <span class="tb-div"></span>
        <button class="btn tb-ic" data-act="undo" id="tbUndo">${icon('undo')}</button>
        <button class="btn tb-ic" data-act="redo" id="tbRedo">${icon('redo')}</button>
        <span class="tb-div"></span>
        <span class="save-status" id="saveStatus"><i></i><span></span></span>
      </div>
      <div class="topbar-right">
        <div class="lang-flags" role="group" aria-label="Language / Langue"><button class="lang-flag" data-act="lang" data-l="fr">FR</button><button class="lang-flag" data-act="lang" data-l="en">EN</button></div>
        <button class="ib" data-act="theme" id="tbTheme"></button>
        <div class="menu-wrap">
          <button class="btn btn-primary" data-act="exportMenu" id="tbExport">${icon('export')}<span class="tb-lbl" id="tbExportLbl"></span></button>
          <div class="menu hidden" id="exportMenu"></div>
        </div>
      </div>`;
  }
  const t = document.getElementById('tbTitle'); if(document.activeElement !== t) t.value = S.doc.title;
  t.placeholder = L('Titre du storyboard', 'Storyboard title');
  const back = document.getElementById('tbBack'); back.title = L('Mes storyboards', 'My storyboards');
  document.getElementById('tbBackLbl').textContent = L('Mes storyboards', 'My storyboards');
  document.getElementById('tbShotLbl').textContent = L('Plan', 'Shot'); document.getElementById('tbShot').title = L('Nouveau plan, qui reprend le plan actuel (N)', 'New shot, starting from the current one (N)');
  document.getElementById('tbCharLbl').textContent = L('Personnage', 'Character'); document.getElementById('tbChar').title = L('Ajouter un personnage dans ce plan', 'Add a character to this shot');
  document.getElementById('tbFullLbl').textContent = L('Immersion', 'Immersion'); document.getElementById('tbFull').title = L('Tout le storyboard en plein écran (P)', 'The whole storyboard in full screen (P)');
  document.getElementById('tbUndo').title = L('Annuler (Ctrl+Z)', 'Undo (Ctrl+Z)'); document.getElementById('tbRedo').title = L('Rétablir (Ctrl+Y)', 'Redo (Ctrl+Y)');
  document.getElementById('tbUndo').disabled = !S.undo.length; document.getElementById('tbRedo').disabled = !S.redo.length;
  document.querySelectorAll('.lang-flag').forEach(b => b.classList.toggle('active', b.dataset.l === getLang()));
  const th = document.getElementById('tbTheme'); th.innerHTML = icon(theme() === 'dark' ? 'sun' : 'moon'); th.title = theme() === 'dark' ? L('Mode clair', 'Light mode') : L('Mode sombre', 'Dark mode');
  document.getElementById('tbExportLbl').textContent = L('Exporter', 'Export');
  document.getElementById('exportMenu').innerHTML = exportList();
  renderSaved();
}
function renderSaved(){ const el = document.getElementById('saveStatus'); if(el) { el.lastChild.textContent = L('Enregistré', 'Saved'); el.title = L('Enregistré dans ce navigateur', 'Saved in this browser'); } }
const exportList = () => `<button data-act="exportPdf" data-per="6">${icon('board')}<span><b>${L('Planche PDF · 6 plans par page', 'PDF board · 6 shots per page')}</b><small>${L('Tout le film d’un coup d’œil, avec les flèches des mouvements', 'The whole film at a glance, with camera-move arrows')}</small></span></button>
     <button data-act="exportPdf" data-per="3">${icon('text')}<span><b>${L('Planche PDF · 3 grands plans par page', 'PDF board · 3 large shots per page')}</b><small>${L('Avec l’action, le dialogue et de la place pour écrire : pour le tournage', 'With action, dialogue and room to write: for the shoot')}</small></span></button>
     <button data-act="exportImage">${icon('image')}<span><b>${L('Image de ce plan (PNG)', 'Image of this shot (PNG)')}</b><small>${L('En 1920 × 1080, à déposer dans le storyboard de Raging Page', '1920 × 1080, to drop into the Raging Page storyboard')}</small></span></button>
     <button data-act="exportVideo">${icon('film')}<span><b>${L('Animatique (vidéo)', 'Animatic (video)')}</b><small>${L('Les plans à la suite, avec leurs mouvements de caméra', 'The shots one after another, with their camera moves')}</small></span></button>
     <button data-act="hExportCur">${icon('save')}<span><b>${L('Fichier du projet (.rboard)', 'Project file (.rboard)')}</b><small>${L('Pour le garder ou l’ouvrir sur un autre ordinateur', 'To keep it or open it on another computer')}</small></span></button>`;

/* ---------- Le plein écran, en immersion : tout l'atelier passe en plein écran, sur fond sombre ----------
   La barre du haut s'efface, le menu de gauche ne garde que ses icônes : l'image prend toute la place,
   et on continue tout le storyboard sans en sortir. « Masquer les outils » (H) ne laisse que l'image.
   Quand le navigateur ne sait pas (iPhone), on remplit simplement la fenêtre. */
const isFull = () => !!(document.fullscreenElement || document.body.classList.contains('fs-fake'));
function toggleFull(){
  const el = document.getElementById('app'); if(!el) return;
  if(document.fullscreenElement){ document.exitFullscreen(); return; }
  if(document.body.classList.contains('fs-fake')){ document.body.classList.remove('fs-fake'); afterFull(); return; }
  const req = el.requestFullscreen || el.webkitRequestFullscreen;
  const fake = () => { document.body.classList.add('fs-fake'); afterFull(); };
  if(req){ try { const r = req.call(el); if(r && r.catch) r.catch(fake); } catch(e){ fake(); } } else fake();
}
function afterFull(){
  const on = isFull(), b = document.body; b.classList.toggle('imm', on); if(!on) b.classList.remove('imm-clean');
  if(!b.classList.contains('on-home')){ renderUI(); requestRender(); }
  renderHead(); setTimeout(fitStage, 30);
}
function immTools(){ if(!isFull()) return; document.body.classList.toggle('imm-clean'); renderHead(); setTimeout(fitStage, 30); }
document.addEventListener('fullscreenchange', afterFull);

/* ---------- Au-dessus de l'image : quel plan, et ce qu'on voit ---------- */
function renderHead(){
  const el = document.getElementById('shotHead'); if(!el) return;
  const s = shot(), n = S.doc.shots.length, inf = s.info;
  el.innerHTML = `<div class="sh-l">
      <span class="sh-no">${L('Plan', 'Shot')} ${S.i + 1}</span><span class="sh-of">${L('sur', 'of')} ${n}</span>
      ${inf.scene ? `<span class="sh-chip">${esc(L('Sc. ', 'Sc. ') + inf.scene)}</span>` : ''}
      <span class="sh-chip">${esc(shotLabel('size', inf.size))}</span>
      ${inf.move !== 'fix' ? `<span class="sh-chip mv">${icon('move')}${esc(shotLabel('move', inf.move))}${S.endEd ? ' · ' + L('cadre de fin', 'end frame') : ''}</span>` : ''}
      <span class="sh-auto" title="${esc(L('Ce cadre est le plan : tout ce que tu vois est gardé, pas besoin d’enregistrer.', 'This frame is the shot: everything you see is kept, no need to save.'))}">${icon('check')}</span>
    </div>
    <div class="sh-r">
      <div class="seg" role="group"><button class="${S.final ? '' : 'on'}" data-act="final" data-v="0" title="${esc(L('Les meubles qui cachent un personnage deviennent transparents', 'Furniture hiding a character turns see-through'))}">${icon('eye')}${L('Vue de travail', 'Work view')}</button><button class="${S.final ? 'on' : ''}" data-act="final" data-v="1" title="${esc(L('Exactement l’image qui sera enregistrée', 'Exactly the image that will be saved'))}">${icon('image')}${L('Image finale', 'Final image')}</button></div>
      <button class="ib ${S.grid ? 'on' : ''}" data-act="grid" title="${esc(L('Grille des tiers', 'Rule of thirds'))}">${icon('grid')}</button>
      ${isFull() ? `<button class="ib ${document.body.classList.contains('imm-clean') ? 'on' : ''}" data-act="immTools" title="${esc(document.body.classList.contains('imm-clean') ? L('Afficher les outils (H)', 'Show the tools (H)') : L('Masquer les outils : l’image seule (H)', 'Hide the tools: the picture only (H)'))}">${icon('eye')}</button>` : ''}
      <button class="ib ${isFull() ? 'on' : ''}" data-act="full" title="${esc(isFull() ? L('Quitter l’immersion (P ou Échap)', 'Exit immersion (P or Esc)') : L('Plein écran, en immersion (P)', 'Immersive full screen (P)'))}">${icon(isFull() ? 'unfull' : 'full')}</button>
      <span class="tb-div"></span>
      <button class="ib" data-act="prevShot" ${S.i === 0 ? 'disabled' : ''} title="${esc(L('Plan précédent (←)', 'Previous shot (←)'))}">${icon('left')}</button>
      <button class="ib" data-act="nextShot" ${S.i === n - 1 ? 'disabled' : ''} title="${esc(L('Plan suivant (→)', 'Next shot (→)'))}">${icon('right')}</button>
    </div>`;
  renderWarn(); renderPlan();
}
/* ---------- Le plan de la maison, posé sur l'image ----------
   Les étages en onglets, le plan de l'étage : on clique une pièce (ou n'importe quel point) et la caméra
   s'y téléporte. Les personnages de l'étage y sont marqués, et la caméra aussi. */
const PLAN = { x0:-5, z0:-4, k:21, pad:8 };
const planXY = (x, z) => [PLAN.pad + (x - PLAN.x0) * PLAN.k, PLAN.pad + (z - PLAN.z0) * PLAN.k];
const levelOfY = (d, y) => d.levels.reduce((b, l, i) => y >= l - 0.2 ? i : b, 0);
function renderPlan(){
  const el = document.getElementById('hplan'); if(!el) return;
  const s = shot(), d = SET_DEF[s.set], C = SET_COLL[s.set];
  if(!d.floors || !d.levels || !C || S.final){ el.classList.add('hidden'); el.innerHTML = ''; return; }
  el.classList.remove('hidden');
  const open = lsGet('raging3d_plan') === '1',   // replié par défaut : une petite pastille, l'image reste libre
   lv = S.planLevel != null ? S.planLevel : levelOfY(d, s.cam.ty);
  const names = [L('Rez-de-chaussée', 'Ground floor'), L('1er étage', '1st floor'), L('2e étage', '2nd floor'), L('Grenier', 'Attic')];
  const short = [L('RDC', 'GF'), L('1er', '1st'), L('2e', '2nd'), L('Grenier', 'Attic')];
  const garden = d.floors.findIndex(f => f[2] < 0);
  const W = PLAN.pad * 2 + 10 * PLAN.k, H = PLAN.pad * 2 + 8 * PLAN.k;
  let svg = '';
  if(open){
    const [ax, ay] = planXY(-5, -4), [bx, by] = planXY(5, 4);
    svg += `<rect class="hp-floor" x="${ax}" y="${ay}" width="${bx - ax}" height="${by - ay}" rx="2"/>`;
    // l'escalier ou la trappe de l'étage
    const holes = [[-4.9, -0.45, -3.7, 3.75], [-3.62, -0.45, -2.42, 3.75], [-4.7, -3.2, -3.9, -2.4], [-4.7, -3.2, -3.9, -2.4]];
    const hs = lv === 1 ? [holes[0], holes[1]] : lv === 2 ? [holes[1], holes[2]] : lv === 3 ? [holes[3]] : [holes[0]];
    hs.forEach(([x0, z0, x1, z1]) => { const [p, q] = planXY(x0, z0), [r, t] = planXY(x1, z1); svg += `<rect class="hp-stair" x="${p}" y="${q}" width="${r - p}" height="${t - q}"/>`; for(let z = z0 + 0.3; z < z1; z += 0.3){ const [u, v] = planXY(x0, z), [w] = planXY(x1, z); svg += `<line class="hp-step" x1="${u}" y1="${v}" x2="${w}" y2="${v}"/>`; } });
    // les cloisons, avec leurs portes
    (C.levels[lv] ? C.levels[lv].p : []).forEach(([a, b, gaps]) => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / len, uz = (b[1] - a[1]) / len;
      const cuts = [[0, 0]].concat(gaps, [[len, len]]);
      for(let i = 0; i < cuts.length - 1; i++){ const s0 = cuts[i][1], s1 = cuts[i + 1][0]; if(s1 - s0 < 0.02) continue;
        const [p, q] = planXY(a[0] + ux * s0, a[1] + uz * s0), [r, t] = planXY(a[0] + ux * s1, a[1] + uz * s1); svg += `<line class="hp-wall" x1="${p}" y1="${q}" x2="${r}" y2="${t}"/>`; }
    });
    // les personnages de cet étage
    s.chars.forEach((ch, c) => { if(levelOfY(d, ch.root.y + 0.5) !== lv) return; const [p, q] = planXY(ch.root.x, ch.root.z); if(p < 0 || p > W || q < 0 || q > H) return;
      svg += `<circle class="hp-char" cx="${p}" cy="${q}" r="4.2" style="--c:${lookOf(ch, c).top || '#888'}"><title>${esc(L(lookOf(ch, c).fr, lookOf(ch, c).en))}</title></circle>`; });
    // les pièces : toute la pièce se clique, son nom au milieu
    d.floors.forEach((f, k) => { if(f[2] !== lv || !f[5]) return; const [x0, z0, x1, z1] = f[5][3], [p, q] = planXY(x0, z0), [r, t] = planXY(x1, z1);
      const nm = L(f[0], f[1]).replace(/^(1er|2e|1st|2nd)\s*:\s*/, '');
      svg += `<g class="hp-room ${S.room === k ? 'on' : ''}" data-k="${k}"><rect x="${p + 1.5}" y="${q + 1.5}" width="${r - p - 3}" height="${t - q - 3}" rx="3"/><text x="${(p + r) / 2}" y="${(q + t) / 2 + 3.5}">${esc(nm)}</text></g>`; });
    svg += `<g class="hp-cam" id="hpCam"><path d="M0 0 L-7 -12 L7 -12 Z"/><circle r="3.4"/></g>`;
  }
  el.innerHTML = `<div class="hp-h"><button class="hp-tog" data-act="planTog" title="${esc(open ? L('Replier le plan', 'Fold the plan') : L('Ouvrir le plan de la maison', 'Open the house plan'))}">${icon('stairs')}<b>${L('Plan', 'Plan')}</b>${open ? '' : `<span>${esc(names[lv] || '')}</span>`}</button>
      ${open ? `<div class="hp-tabs">${short.map((t, i) => `<button class="${i === lv && S.room !== garden ? 'on' : ''}" data-act="planLv" data-l="${i}" title="${esc(names[i])}">${esc(t)}</button>`).join('')}${garden >= 0 ? `<button class="${S.room === garden ? 'on' : ''}" data-act="floor" data-k="${garden}">${L('Jardin', 'Garden')}</button>` : ''}</div>` : ''}</div>
    ${open ? `<svg class="hp-svg" id="hpSvg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" data-l="${lv}">${svg}</svg>
    <div class="hp-f"><span>${L('Clique dans une pièce : la caméra s’y pose, tournée vers ce point', 'Click inside a room: the camera goes there, facing that spot')}</span><button class="hp-bring" data-act="bringHere" title="${esc(L('Amener le personnage choisi là où vise la caméra', 'Bring the chosen character where the camera aims'))}">${icon('users')}${L('Amener ', 'Bring ') + charName(S.sel ? S.sel.c : S.target) + L(' ici', ' here')}</button></div>` : ''}`;
  planMarker();
}
/* la caméra sur le plan : sa position et la direction où elle regarde (mis à jour à chaque image) */
function planMarker(){
  const g = document.getElementById('hpCam'); if(!g) return;
  const s = shot(), d = SET_DEF[s.set], c = viewCam(s), lv = +document.getElementById('hpSvg').dataset.l;
  const e = camEye(c), [p, q] = planXY(e[0], e[2]), a = Math.atan2(c.tx - e[0], c.tz - e[2]);
  g.style.display = levelOfY(d, e[1]) === lv || levelOfY(d, c.ty) === lv ? '' : 'none';
  g.setAttribute('transform', `translate(${p.toFixed(1)} ${q.toFixed(1)}) rotate(${(-a * 180 / Math.PI + 180).toFixed(1)})`);
}
/* le décor cache quelqu'un dans l'image finale : on le dit, et on propose de regarder */
function renderWarn(){
  const el = document.getElementById('warn'); if(!el) return;
  const s = shot(), h = (S.hidden || []).filter(c => s.chars[c]);
  if(!h.length || S.play){ el.classList.add('hidden'); return; }
  const names = h.map(c => L(lookOf(s.chars[c], c).fr, lookOf(s.chars[c], c).en)).join(', ');
  el.classList.remove('hidden');
  el.innerHTML = `${icon('warn')}<span>${L('Dans l’image finale, le décor cache ', 'In the final image, the set hides ')}${esc(names)}</span>${S.final ? '' : `<button data-act="final" data-v="1">${L('Voir', 'See')}</button>`}`;
}
function renderView(){
  const st = document.getElementById('stage'); if(!st) return;
  st.classList.toggle('final', !!S.final);
  const th = document.getElementById('thirds'), fb = frameBox(1000, 562.5);
  th.classList.toggle('hidden', !S.grid || !!S.final);
  th.style.inset = fb ? `${fb.y / 5.625}% ${fb.x / 10}%` : '';
  const sheet = S.view === 'sheet';
  document.getElementById('stageArea').classList.toggle('hidden', sheet);
  document.getElementById('sheetView').classList.toggle('hidden', !sheet);
  if(sheet) renderSheet();
}

/* ---------- Sous l'image : se déplacer (on maintient un bouton), et l'aide du moment ---------- */
function renderNav(){
  const el = document.getElementById('nav'); if(!el) return;
  const hd = document.getElementById('handles'); if(hd){ hd.innerHTML = ''; hd.dataset.sig = ''; }   // refaites dans la bonne langue au prochain dessin
  const b = (k, t, svg) => `<button class="dk" data-nav="${k}" title="${esc(t)}" aria-label="${esc(t)}"><svg viewBox="0 0 16 16" aria-hidden="true">${svg}</svg></button>`;
  const ar = 'M8 3.5 12.5 9H3.5Z';
  el.innerHTML = `${b('left', L('À gauche (Q ou A)', 'Left (A or Q)'), `<path d="${ar}" transform="rotate(-90 8 8)"/>`)}${b('fwd', L('Avancer (Z ou W)', 'Forward (W or Z)'), `<path d="${ar}"/>`)}${b('back', L('Reculer (S)', 'Back (S)'), `<path d="${ar}" transform="rotate(180 8 8)"/>`)}${b('right', L('À droite (D)', 'Right (D)'), `<path d="${ar}" transform="rotate(90 8 8)"/>`)}
    <span class="dk-sep"></span>${b('turnL', L('Tourner autour, à gauche', 'Orbit left'), '<path d="M12.5 8a4.5 4.5 0 1 1-1.3-3.2" fill="none"/><path d="M12 1.8v3.4H8.6" fill="none"/>')}${b('turnR', L('Tourner autour, à droite', 'Orbit right'), '<path d="M3.5 8a4.5 4.5 0 1 0 1.3-3.2" fill="none"/><path d="M4 1.8v3.4h3.4" fill="none"/>')}
    <span class="dk-sep"></span>${b('up', L('Monter (R)', 'Up (R)'), '<path d="M8 2v12M4.5 5.5 8 2l3.5 3.5" fill="none"/>')}${b('down', L('Descendre (F)', 'Down (F)'), '<path d="M8 2v12M4.5 10.5 8 14l3.5-3.5" fill="none"/>')}
    <span class="dk-sep"></span>${b('in', L('Zoomer', 'Zoom in'), '<path d="M8 3.5v9M3.5 8h9" fill="none"/>')}${b('out', L('Dézoomer', 'Zoom out'), '<path d="M3.5 8h9" fill="none"/>')}`;
}
function renderHint(){
  const el = document.getElementById('hint'); if(!el) return;
  let t;
  if(S.play) t = L('Lecture du storyboard · Échap ou clic pour arrêter', 'Playing the storyboard · Esc or click to stop');
  else if(S.endEd) t = L('Tu règles l’image de FIN du mouvement : cadre-la comme tu veux, puis reviens au début dans le volet.', 'You are setting the END frame of the move: frame it as you like, then go back to the start in the panel.');
  else if(S.hover) t = L(JOINT[S.hover.j].fr, JOINT[S.hover.j].en) + ' · ' + (S.hover.j === 'pelvis' ? L('glisse pour déplacer le personnage', 'drag to move the character') : L('glisse pour bouger', 'drag to move'));
  else if(HDRAG.c >= 0) t = HDRAG.kind === 'move' ? L('Glisse pour déplacer sur le sol', 'Drag to move on the floor') : L('Glisse à gauche ou à droite pour faire tourner', 'Drag left or right to turn');
  else if(S.sel) t = L('Glisse la partie verte pour la bouger · Clique dans le vide pour désélectionner', 'Drag the green part to move it · Click empty space to deselect');
  else t = L('Glisser : tourner autour · Clic droit : se décaler · Molette : avancer · Double-clic : viser', 'Drag: orbit · Right-click: pan · Wheel: move in · Double-click: aim');
  el.innerHTML = `<i></i>${esc(t)}`;
}

/* ---------- Le volet de droite : le contenu de l'étape choisie ---------- */
const charName = c => { const ch = shot().chars[c]; const lk = lookOf(ch, c); return esc(L(lk.fr, lk.en)); };
/* une petite silhouette, à la couleur des habits du personnage (les enfants sont plus petits) */
const figure = lk => {
  const kid = lk.age === 'kid', k = kid ? 0.78 : 1, oy = kid ? 4.4 : 0, f = lk.body === 'f';
  const T = (x, y) => `${(8 + (x - 8) * k).toFixed(2)} ${(y * k + oy).toFixed(2)}`;
  const body = lk.skirt ? `M${T(5.3, 8)}L${T(10.7, 8)}L${T(12.6, 15)}L${T(3.4, 15)}Z` : `M${T(4.3, 8)}L${T(11.7, 8)}L${T(11.4, 13.5)}L${T(4.6, 13.5)}Z`;
  const legs = `M${T(5.4, 13)}L${T(7.6, 13)}L${T(7.4, 19.5)}L${T(5.4, 19.5)}ZM${T(8.4, 13)}L${T(10.6, 13)}L${T(10.6, 19.5)}L${T(8.6, 19.5)}Z`;
  const hair = lk.hairStyle === 'bald' ? '' : `<path d="M${T(4.6, 4.3)}A${(3.4 * k).toFixed(2)} ${(3.4 * k).toFixed(2)} 0 0 1 ${T(11.4, 4.3)}L${T(11.4, f && lk.hairStyle === 'long' ? 7.6 : 4.6)}L${T(4.6, f && lk.hairStyle === 'long' ? 7.6 : 4.6)}Z" fill="${lk.hair}"/>`;
  return `<svg class="fig" viewBox="0 0 16 20" aria-hidden="true"><path d="${legs}" fill="${lk.skirt || lk.shorts ? lk.skin : lk.bottom}"/><path d="${body}" fill="${lk.top}"/><circle cx="8" cy="${(4.6 * k + oy).toFixed(2)}" r="${(3.2 * k).toFixed(2)}" fill="${lk.skin}"/>${hair}${lk.hairStyle === 'bun' ? `<circle cx="8" cy="${(1.2 * k + oy).toFixed(2)}" r="${(1.3 * k).toFixed(2)}" fill="${lk.hair}"/>` : ''}</svg>`;
};
const ph = (ic, title, sub, nav) => `<div class="ph"><div class="ph-ico">${icon(ic)}</div><div class="ph-t"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}${nav || ''}</div></div>`;
/* dans les volets longs (lieux, poses) : une barre pour sauter directement à une catégorie */
const jumpBar = items => `<div class="jump">${items.map(([id, t]) => `<button data-act="jump" data-t="${id}">${esc(t)}</button>`).join('')}</div>`;
const lblId = (t, id) => `<div class="fly-lbl" id="g-${id}">${t}</div>`;
const lbl = t => `<div class="fly-lbl">${t}</div>`;
function slider(label, act, i, v, min, max, step, unit){
  return `<label class="fr"><span class="fl">${esc(label)}</span><input type="range" data-act="${act}" data-i="${i}" min="${min}" max="${max}" step="${step}" value="${v}"><b class="fv">${round(v, step < 1 ? 2 : 0)}${unit == null ? '°' : unit}</b></label>`;
}
function renderSide(onlyValues){
  const el = document.getElementById('side'); if(!el) return;
  if(onlyValues){
    const sh = shot(), sel = S.sel;
    el.querySelectorAll('.fr input').forEach(inp => {
      const i = +inp.dataset.i, act = inp.dataset.act; let v;
      if(act === 'axis' && sel) v = sh.chars[sel.c].j[sel.j][i];
      else if(act === 'root' && sel) v = i === 0 ? sh.chars[sel.c].root.ry : sh.chars[sel.c].root.y;
      else if(act === 'crowdSet' && sh.crowds[S.crowd]) v = sh.crowds[S.crowd][inp.dataset.f];
      if(v == null) return;
      inp.value = v; const b = inp.parentNode.querySelector('.fv'); if(b) b.textContent = round(v, inp.step < 1 ? 2 : 0) + (inp.dataset.unit != null ? inp.dataset.unit : act === 'root' && i === 1 ? ' m' : '°');
    });
    return;
  }
  renderPanel();
}
let _panelQ = false;
function renderPanel(){
  const el = document.getElementById('side'); if(!el) return;
  const fn = PANEL_HTML[S.panel] || PANEL_HTML.place;
  const keep = el.querySelector('.side-body'), top = keep ? keep.scrollTop : 0, same = el.dataset.p === S.panel;
  el.innerHTML = `<div class="side-body">${fn()}</div>`;
  el.dataset.p = S.panel;
  if(same) el.querySelector('.side-body').scrollTop = top;
  renderRail();
  fillPlacePreviews(); fillPosePreviews();
}
/* les vignettes des lieux se dessinent une par une, sans bloquer l'interface */
let _ppT = 0;
function fillPlacePreviews(){
  clearTimeout(_ppT);
  const el = [...document.querySelectorAll('[data-pp]')].find(e => !e.style.backgroundImage); if(!el || S.play || S.rec || !GL.gl) return;
  _ppT = setTimeout(() => { el.style.backgroundImage = `url(${placePreview(el.dataset.pp)})`; fillPlacePreviews(); }, 16);
}
let _pvT = 0;
function fillPosePreviews(){
  clearTimeout(_pvT);
  const el = document.querySelector('img[data-pv]'); if(!el || S.play || S.rec || !GL.gl) return;
  _pvT = setTimeout(() => { const [lk, pid] = el.dataset.pv.split(':'); el.src = posePreview(+lk, pid); el.removeAttribute('data-pv'); fillPosePreviews(); }, 12);
}
function renderTools(){ renderHead(); renderPanel(); renderView(); }
function renderShotPanel(){ renderHead(); if(S.panel === 'text' || S.panel === 'move') renderPanel(); renderTop(); }

/* les vignettes des valeurs de plan : un cadre et la silhouette à la taille du plan */
function sizeGlyph(k){
  const P = { pg:[18, 13, 0.28], pe:[18, 12, 0.62], pa:[18, 17, 1.05], pm:[18, 21, 1.4], pr:[18, 27, 1.9], gp:[18, 40, 3.1], tgp:[18, 60, 5.2] }[k];
  const fig = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><circle cx="0" cy="-12.5" r="3.1"/><path d="M-4.6-8.4h9.2l.6 8.4h-2.2l-.4 8.4h-2.4l-.7-6.6-.7 6.6h-2.4l-.4-8.4h-2.2z"/></g>`;
  let inner;
  if(P) inner = fig(P[0], P[1], P[2]);
  else if(k === 'am') inner = `<path d="M-2 26c2-8 7-10 12-10s9 3 10 10z" opacity=".45"/>${fig(25, 21, 1.15)}`;
  else if(k === '2p') inner = fig(12, 19, 0.95) + fig(24, 19, 0.95);
  else if(k === 'pov') inner = `<path d="M5 12s5-6 13-6 13 6 13 6-5 6-13 6S5 12 5 12z" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="18" cy="12" r="3.2"/>`;
  else inner = fig(18, 12, 0.6);
  return `<svg class="sg" viewBox="0 0 36 22" aria-hidden="true"><rect x=".75" y=".75" width="34.5" height="20.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".5"/><clipPath id="sgc"><rect x="1" y="1" width="34" height="20" rx="2"/></clipPath><g clip-path="url(#sgc)" fill="currentColor">${inner}</g></svg>`;
}
/* les petits schémas des angles et des mouvements */
const ANGLE_G = { neu:'M3 11h14M13 7.5l4 3.5-4 3.5', plo:'M3 4l13 9M11.5 13.6h4.8v-4.8', con:'M3 17l13-9M11.5 7.4h4.8v4.8', dess:'M11 2v15M7 13l4 4 4-4', sol:'M2 16h16M4 13h11M12 10l3 3-3 3', deb:'M4 5l12 3-2 9-12-3z' };
const MOVE_G = { fix:'M6 6h8v8H6z', in:'M3 10h10M10 6.5l3.5 3.5-3.5 3.5M16 4v12', out:'M17 10H7M10 6.5 6.5 10l3.5 3.5M3 4v12', panR:'M3 13a9 9 0 0 1 14-3M14 6.5l3 3.5-4 1', panL:'M17 13a9 9 0 0 0-14-3M6 6.5 3 10l4 1',
  tiltU:'M7 17a9 9 0 0 1 3-14M6.5 6 10 3l3 3.5', tiltD:'M7 3a9 9 0 0 0 3 14M6.5 14 10 17l3-3.5', travR:'M2 15h16M3 10h11M11 6.5l3.5 3.5-3.5 3.5', travL:'M2 15h16M17 10H6M9 6.5 5.5 10 9 13.5',
  zoomIn:'M3 3l4 4M17 3l-4 4M3 17l4-4M17 17l-4-4M7 4v3H4M13 4v3h3M7 16v-3H4M13 16v-3h3', zoomOut:'M7 7 3 3M13 7l4-4M7 13l-4 4M13 13l4 4M3 6V3h3M17 6V3h-3M3 14v3h3M17 14v3h-3', orbit:'M3 12c0-3 3-5 7-5s7 2 7 5-3 5-7 5M6 16.5 10 17l-1.5 3',
  grue:'M10 17V5M6.5 8.5 10 5l3.5 3.5M5 17h10', grueD:'M10 3v12M6.5 11.5 10 15l3.5-3.5M5 3h10', drone:'M4 15l10-9M10 6h4v4M3 18h6', epa:'M2 10c2-3 3 3 5 0s3 3 5 0 3 3 6 0', end:'M3 10h11M10 6.5l3.5 3.5-3.5 3.5M16.5 6v8' };
const glyph = (d, cls) => `<svg class="${cls || 'mg'}" viewBox="0 0 20 20" aria-hidden="true"><path d="${d}"/></svg>`;

const PANEL_HTML = {
  place(){
    const sh = shot(), groups = [[L('Intérieurs', 'Indoors'), ['garage', 'office', 'living', 'cafe', 'hall', 'warehouse', 'hotel', 'parking', 'diner', 'house']], [L('Extérieurs', 'Outdoors'), ['alley', 'taxi', 'park', 'roof', 'forest']], [L('Grands espaces', 'Wide open spaces'), ['street', 'beach', 'stadium', 'country', 'airfield']]];
    const fl = SET_DEF[sh.set].floors ? lblId(L('Aller dans une pièce', 'Go to a room'), 'rooms') + `<div class="chips">${SET_DEF[sh.set].floors.map((f, k) => `<button class="chip ${S.room === k ? 'on' : ''}" data-act="floor" data-k="${k}">${esc(L(f[0], f[1]))}</button>`).join('')}</div>` : '';
    const gid = ['in', 'out', 'wide'];
    return ph('place', L('Le lieu', 'The place'), L('Les personnages s’y placent tout seuls.', 'Characters go to ready-made spots by themselves.'), jumpBar((fl ? [['rooms', L('Pièces', 'Rooms')]] : []).concat(groups.map(([t], k) => [gid[k], t])))) +
      `<div class="pb">${fl}${groups.map(([t, ids], k) => lblId(t, gid[k]) + `<div class="ptiles">${ids.map(id => { const st = SETS.find(x => x.id === id); return `<button class="ptile ${sh.set === id ? 'on' : ''}" data-act="place" data-id="${id}"><i class="sw sw-${id}" data-pp="${id}"${PLACE_PREV.has(id + ':' + (S.doc.style || '')) ? ` style="background-image:url(${PLACE_PREV.get(id + ':' + (S.doc.style || ''))})"` : ''}></i><span>${esc(L(st.fr, st.en))}</span></button>`; }).join('')}</div>`).join('')}</div>`;
  },
  chars(){
    const sh = shot(), chars = sh.chars, t = S.sel ? S.sel.c : S.target, used = chars.map(c => c.look);
    const rows = chars.map((c, i) => `<div class="crow ${t === i ? 'on' : ''}"><button class="crow-main" data-act="pickChar" data-c="${i}" title="${esc(L('La caméra va vers ', 'The camera goes to ') + L(lookOf(c, i).fr, lookOf(c, i).en))}">${figure(lookOf(c, i))}<span>${charName(i)}</span>${t === i ? `<em>${L('cadré', 'framed')}</em>` : ''}</button>${chars.length > 1 ? `<button class="ib sm danger" data-act="removeChar" data-c="${i}" title="${esc(L('Retirer du plan', 'Remove from the shot'))}">${icon('close')}</button>` : ''}</div>`).join('');
    const add = `<div class="figs">${CHAR_LOOK.map((lk, k) => `<button class="fig-t" data-act="addChar" data-look="${k}" ${used.includes(k) || chars.length >= MAX_CHARS ? 'disabled' : ''} title="${esc(L(lk.fr, lk.en))}">${figure(lk)}<small>${esc(L(lk.fr, lk.en))}</small></button>`).join('')}</div>`;
    const base = chars[t] && CHAR_LOOK[chars[t].look != null ? chars[t].look : t % 2] || CHAR_LOOK[0], cur = chars[t] && chars[t].outfit || 'base';
    const outfits = `<div class="figs">${OUTFITS.filter(o => !o.body || o.body === base.body).map(o => `<button class="fig-t ${cur === o.id ? 'on' : ''}" data-act="outfit" data-id="${o.id}" title="${esc(L(o.fr, o.en))}">${figure(outfitLook(base, o.id))}<small>${esc(L(o.fr, o.en))}</small></button>`).join('')}</div>`;
    const spots = (SPOTS[sh.set] || []).map((p, k) => `<button class="chip" data-act="spot" data-k="${k}">${esc(L(p[0], p[1]))}</button>`).join('');
    return ph('users', L('Les personnages', 'The characters'), L('Clique un nom : la caméra va vers lui. L’épingle verte le déplace.', 'Click a name: the camera goes to them. The green pin moves them.')) +
      `<div class="pb">${lbl(L('Dans ce plan', 'In this shot'))}${rows}
      ${lbl(L('Ajouter', 'Add') + ` <span class="cnt">${chars.length} / ${MAX_CHARS}</span>`)}${add}
      ${chars[t] ? lbl(L('La tenue de ', 'Outfit for ') + charName(t)) + outfits : ''}
      ${lbl(L('Placer ', 'Place ') + charName(t))}<div class="chips">${spots}</div>
      ${chars.length > 1 ? lbl(L('À plusieurs', 'Together')) + `<div class="chips"><button class="chip" data-act="faceThem">${L('Se faire face', 'Face each other')}</button><button class="chip" data-act="lookAt">${L('Regarder l’autre', 'Look at the other')}</button></div>` : ''}</div>`;
  },
  pose(){
    const sh = shot(), chars = sh.chars, t = S.sel ? S.sel.c : S.target, ch = chars[t], look = ch ? ch.look : 0, sel = S.sel;
    const who = chars.length > 1 ? `<div class="seg wide">${chars.map((c, i) => `<button class="${t === i ? 'on' : ''}" data-act="pickChar" data-c="${i}" title="${esc(L(lookOf(c, i).fr, lookOf(c, i).en))}">${figure(lookOf(c, i))}</button>`).join('')}</div>` : '';
    const tile = p => `<button class="pose-t ${ch && ch.pose === p.id ? 'on' : ''}" data-act="pose" data-id="${p.id}"><img ${POSE_PREV.has(poseKey(look, p.id)) ? `src="${POSE_PREV.get(poseKey(look, p.id))}"` : `data-pv="${look}:${p.id}"`} alt=""><span>${esc(L(p.fr, p.en))}</span></button>`;
    const tiles = POSE_GROUPS.map(([g, fr, en]) => `<div class="pose-g" id="g-${g}">${esc(L(fr, en))}</div><div class="poses">${POSES.filter(p => p.g === g).map(tile).join('')}</div>`).join('');
    const prop = ch ? `${lbl(L('Dans la main', 'In hand'))}<div class="seg wide"><button class="${!ch.prop ? 'on' : ''}" data-act="prop" data-id="">${L('Rien', 'Nothing')}</button>${PROPS.map(([id, fr, en]) => `<button class="${ch.prop === id ? 'on' : ''}" data-act="prop" data-id="${id}">${id === 'gun' ? icon('gun') : ''}${esc(L(fr, en))}</button>`).join('')}</div>` : '';
    const gun = ch && ch.prop === 'gun' ? lbl(L('Prises de vue avec l’arme', 'Shots with the gun')) + `<div class="cars">${GUN_SHOTS.map(P => `<button class="car-t" data-act="gunShot" data-id="${P[0]}">${sizeGlyph(P[6])}<span>${esc(L(P[1], P[2]))}</span></button>`).join('')}</div>` : '';
    let part;
    if(sel && chars[sel.c]){
      const J = JOINT[sel.j], v = chars[sel.c].j[sel.j], c2 = chars[sel.c];
      part = `<div class="part-h"><b>${esc(L(J.fr, J.en))}</b><span>${charName(sel.c)}</span></div>
        ${J.ax.map((a, i) => slider(L(a[4], a[5]), 'axis', i, v[i], a[2], a[3], 1)).join('')}
        ${sel.j === 'pelvis' ? `${slider(L('Tout le corps : tourner', 'Whole body: turn'), 'root', 0, c2.root.ry, -180, 180, 1)}${slider(L('Tout le corps : hauteur', 'Whole body: height'), 'root', 1, c2.root.y, -0.9, 2, 0.01, ' m')}` : ''}
        <button class="btn btn-sm" data-act="resetPart">${icon('reset')}${L('Remettre droit', 'Straighten')}</button>`;
    } else part = `<p class="fly-note">${L('Pour un geste précis : clique sur une partie du corps dans l’image (un bras, la tête…) et glisse. Ses réglages s’affichent ici.', 'For a precise gesture: click a body part in the picture (an arm, the head…) and drag. Its settings show up here.')}</p>`;
    return ph('pose', L('Les poses de ', 'Poses for ') + charName(t), L('Une pose en un clic, puis les retouches à la main si besoin.', 'One click for a pose, then hand touch-ups if needed.'), sel ? '' : jumpBar(POSE_GROUPS.map(([g]) => [g, { move:L('Debout', 'Standing'), seat:L('Assis, au sol', 'Seated, floor'), gest:L('Gestes', 'Gestures'), gun:L('Pistolet', 'Handgun'), moto:L('Moto', 'Motorbike') }[g] || g]))) +
      `<div class="pb">${who}${tiles}${prop}${gun}${lbl(L('Partie du corps', 'Body part'))}${part}</div>`;
  },
  crowd(){
    const sh = shot(), cr = sh.crowds, k = cr[S.crowd] ? S.crowd : -1, c = cr[k];
    const kinds = CROWD_KIND.map(([id, fr, en]) => `<button class="ptile sm" data-act="addCrowd" data-kind="${id}">${icon('plus')}<span>${esc(L(fr, en))}</span></button>`).join('');
    const list = cr.map((x, i) => `<div class="crow ${i === k ? 'on' : ''}"><button class="crow-main" data-act="pickCrowd" data-k="${i}">${icon('crowd')}<span>${L('Foule', 'Crowd')} ${i + 1}</span><em>${esc(L(...CROWD_KIND.find(q => q[0] === x.kind).slice(1)))}</em></button><button class="ib sm danger" data-act="removeCrowd" data-k="${i}" title="${esc(L('Retirer', 'Remove'))}">${icon('close')}</button></div>`).join('');
    const sl = (f, label, min, max, step, unit) => `<label class="fr"><span class="fl">${esc(label)}</span><input type="range" data-act="crowdSet" data-f="${f}" data-unit="${unit}" min="${min}" max="${max}" step="${step}" value="${c[f]}"><b class="fv">${round(c[f], step < 1 ? 1 : 0)}${unit}</b></label>`;
    const set = c ? lbl(L('Réglages de la foule ', 'Crowd settings ') + (k + 1)) + `<div class="seg wide">${CROWD_KIND.map(([id, fr, en]) => `<button class="${c.kind === id ? 'on' : ''}" data-act="crowdKind" data-kind="${id}">${esc(L(fr, en))}</button>`).join('')}</div>` +
      sl('w', L('Largeur', 'Width'), 2, 40, 0.5, ' m') + sl('d', L('Profondeur', 'Depth'), 1, 20, 0.5, ' m') + sl('dens', L('Densité', 'Density'), 0.2, 3, 0.1, '') + sl('ry', L('Tourner', 'Turn'), -180, 180, 1, '°') + sl('y', L('Hauteur du sol', 'Ground height'), 0, 6, 0.05, ' m') +
      `<div class="pbtns"><button class="btn btn-sm" data-act="crowdShuffle">${icon('reset')}${L('Autres têtes', 'Other faces')}</button></div>` : '';
    return ph('crowd', L('La foule', 'Crowds'), L('Des silhouettes légères, par centaines, sans ralentir.', 'Light cut-outs, by the hundred, with no slowdown.')) +
      `<div class="pb">${lbl(L('Ajouter une foule devant la caméra', 'Add a crowd in front of the camera'))}<div class="ptiles three">${kinds}</div>
      ${cr.length ? lbl(L('Dans ce plan', 'In this shot')) + list : `<p class="fly-note">${L('Pas encore de foule dans ce plan. Une fois posée, déplace-la avec sa poignée « Foule » dans l’image.', 'No crowd in this shot yet. Once added, move it with its “Crowd” handle in the picture.')}</p>`}${set}
      <p class="fly-note">${L('Elles ne bougent pas et ne se posent pas : pour un personnage qui agit, ajoute plutôt un personnage.', 'They don’t move or pose: for someone who acts, add a character instead.')}</p></div>`;
  },
  frame(){
    const sh = shot(), inf = sh.info, two = sh.chars.length > 1;
    const sizes = ['pg', 'pe', 'pa', 'pm', 'pr', 'gp', 'tgp'].concat(two ? ['am', '2p'] : [], ['pov']);
    const who = `<div class="seg wide">${sh.chars.map((c, i) => `<button class="${S.target === i ? 'on' : ''}" data-act="target" data-c="${i}" title="${esc(L(lookOf(c, i).fr, lookOf(c, i).en))}">${figure(lookOf(c, i))}${sh.chars.length <= 3 ? `<span>${charName(i)}</span>` : ''}</button>`).join('')}</div>`;
    const st = sizes.map(k => `<button class="size-t ${inf.size === k ? 'on' : ''}" data-act="size" data-v="${k}" title="${esc(shotLabel('size', k))}">${sizeGlyph(k)}<b>${esc(shotLabel('size', k, true))}</b><small>${esc(shotLabel('size', k))}</small></button>`).join('');
    const an = ['neu', 'plo', 'con', 'dess', 'sol', 'deb'].map(k => `<button class="ang-t ${inf.angle === k ? 'on' : ''}" data-act="angle" data-v="${k}">${glyph(ANGLE_G[k])}<span>${esc(shotLabel('angle', k))}</span></button>`).join('');
    return ph('frame', L('Le cadrage', 'Framing'), L('Sur qui, puis la valeur de plan : la caméra se place seule.', 'Who, then the shot size: the camera places itself.')) +
      `<div class="pb">${lbl(L('Sur qui', 'On whom'))}${who}
      ${lbl(L('La valeur du plan', 'Shot size'))}<div class="sizes">${st}</div>
      ${lbl(L('L’angle', 'Angle'))}<div class="angs">${an}</div>
      ${lbl(L('Le côté', 'Side'))}<div class="seg wide wrap">${SIDES.map(x => `<button class="${inf.side === x[0] ? 'on' : ''}" data-act="side" data-v="${x[0]}">${esc(L(x[1], x[2]))}</button>`).join('')}</div>
      ${lbl(L('La focale', 'Lens'))}<div class="seg wide">${LENSES.map(l => `<button class="${Math.round(sh.cam.lens) === l ? 'on' : ''}" data-act="lens" data-l="${l}">${l} mm</button>`).join('')}</div>
      <p class="fly-note">${L('24 mm : grand angle, on voit large. 85 mm : téléobjectif, le fond se rapproche.', '24 mm: wide angle, you see a lot. 85 mm: telephoto, the background comes closer.')}</p>
      ${two ? `<div class="pbtns"><button class="btn btn-sm" data-act="addReverse">${icon('reverse')}${L('Faire le contrechamp (nouveau plan)', 'Make the reverse shot (new shot)')}</button></div>` : ''}</div>`;
  },
  move(){
    const sh = shot(), inf = sh.info, m = inf.move, walk = sh.chars.some(c => c.pose === 'walk' || c.pose === 'run');
    const tiles = SHOT.move.map(o => `<button class="ang-t ${m === o[0] ? 'on' : ''}" data-act="info" data-k="move" data-v="${o[0]}">${glyph(MOVE_G[o[0]] || MOVE_G.fix)}<span>${esc(L(o[1], o[2]))}</span></button>`).join('');
    const end = m === 'end' ? lbl(L('Le cadre de fin', 'The end frame')) + `<div class="seg wide"><button class="${S.endEd ? '' : 'on'}" data-act="editEnd" data-v="0">${L('Début', 'Start')}</button><button class="${S.endEd ? 'on' : ''}" data-act="editEnd" data-v="1">${L('Fin', 'End')}</button></div>
      <p class="fly-note">${L('Choisis « Fin », cadre l’image d’arrivée avec les outils habituels, puis reviens sur « Début ». La caméra ira de l’une à l’autre.', 'Pick “End”, frame the final image with the usual tools, then go back to “Start”. The camera will travel from one to the other.')}</p>` : '';
    return ph('move', L('Le mouvement de caméra', 'Camera move'), L('Il part du cadre du plan ; on le voit à la lecture et sur le PDF.', 'It starts from the shot’s frame; it shows in playback and on the PDF.')) +
      `<div class="pb"><div class="angs moves">${tiles}</div>${end}
      ${lbl(L('Les personnages', 'Characters'))}<label class="ftog"><span>${L('Ceux qui marchent ou courent avancent pendant le plan', 'Walking or running characters move forward during the shot')}</span><input type="checkbox" data-act="walk" ${inf.walk ? 'checked' : ''}><i class="tg"></i></label>
      ${!walk ? `<p class="fly-note">${L('Donne la pose « Marche » ou « Course » à un personnage pour l’animer.', 'Give a character the “Walking” or “Running” pose to animate them.')}</p>` : ''}
      ${lbl(L('Durée du plan', 'Shot length'))}<div class="seg wide">${[1, 2, 3, 4, 5, 8].map(d => `<button class="${d === inf.dur ? 'on' : ''}" data-act="dur" data-v="${d}">${fmtTime(d)}</button>`).join('')}</div>
      <div class="pbtns"><button class="btn btn-sm btn-play" data-act="previewShot">${icon('play')}${L('Voir ce plan bouger', 'Watch this shot move')}</button></div></div>`;
  },
  car(){
    const sh = shot(), vs = sh.vehicles || [], k = vs[S.veh] ? S.veh : vs.length ? 0 : -1, v = vs[k], t = S.sel ? S.sel.c : S.target;
    const taxi = sh.set === 'taxi'
      ? lbl(L('Le taxi', 'The taxi')) + `<div class="pbtns"><button class="btn btn-sm" data-act="carSetup">${icon('users')}${L('Installer : conducteur et passager', 'Seat the driver and the passenger')}</button></div><div class="cars">${CAR_SHOTS.map(p => `<button class="car-t" data-act="carShot" data-id="${p[0]}">${sizeGlyph(p[6])}<span>${esc(L(p[1], p[2]))}</span></button>`).join('')}</div>`
      : lbl(L('Le taxi', 'The taxi')) + `<p class="fly-note">${L('Le taxi est un lieu à part : ses vitres sont transparentes et dix prises de vue sont prêtes à l’intérieur.', 'The taxi is a place of its own: see-through windows and ten ready-made shots inside.')}</p><div class="pbtns"><button class="btn btn-sm" data-act="place" data-id="taxi">${icon('car')}${L('Aller dans le taxi', 'Go to the taxi')}</button></div>`;
    const VD = x => VEH_DEF[x.kind] || VEH_DEF.moto, on = x => sh.chars.filter(c => c.on && c.on.v === x.id);
    const list = vs.map((x, i) => `<div class="crow ${i === k ? 'on' : ''}"><button class="crow-main" data-act="pickVeh" data-k="${i}">${icon(VD(x).ic)}<span>${esc(L(VD(x).fr, VD(x).en))} ${vs.filter((o, j) => j <= i && o.kind === x.kind).length}</span><em>${esc(on(x).map(c => L(lookOf(c).fr, lookOf(c).en)).join(', '))}</em></button><button class="ib sm danger" data-act="removeVeh" data-k="${i}" title="${esc(L('Retirer', 'Remove'))}">${icon('close')}</button></div>`).join('');
    const D = v && VD(v), who = v && (si => { const c = on(v).find(c => c.on.seat === si); return c ? L(lookOf(c).fr, lookOf(c).en) : ''; });
    const set = v ? `<div class="qsw">${D.cols.map(c => `<button class="${v.col === c ? 'on' : ''}" style="--c:${c}" data-act="vehCol" data-c="${c}" aria-label="${c}"></button>`).join('')}</div>
      ${lbl(L('Mettre ', 'Seat ') + charName(t) + L(' à la place…', ' as…'))}<div class="chips">${D.seats.map((st, i) => { const c = on(v).find(c => c.on.seat === i), me = c && sh.chars.indexOf(c) === t; return `<button class="chip ${me ? 'on' : ''}" data-act="mount" data-seat="${i}">${esc(L(st.fr, st.en))}${c && !me ? `<small>· ${esc(who(i))}</small>` : ''}</button>`; }).join('')}</div>
      ${D.fly ? `<label class="fr"><span class="fl">${L('Altitude', 'Altitude')}</span><input type="range" data-act="vehAlt" min="0" max="60" step="0.5" value="${v.y || 0}"><b class="fv">${round(v.y || 0, 1)} m</b></label>` : ''}
      ${lbl(L('Ses prises de vue', 'Its shots'))}<div class="cars">${D.shots.map(P => `<button class="car-t" data-act="vehShot" data-id="${P[0]}">${sizeGlyph(P[6])}<span>${esc(L(P[1], P[2]))}</span></button>`).join('')}</div>` : '';
    return ph('car', L('Les véhicules', 'Vehicles'), L('Pose un véhicule devant la caméra, mets un personnage à une place, puis choisis une prise de vue.', 'Put a vehicle in front of the camera, seat a character, then pick a shot.')) +
      `<div class="pb">${lbl(L('Ajouter devant la caméra', 'Add in front of the camera'))}<div class="vadd">${Object.keys(VEH_DEF).map(id => `<button class="vtile" data-act="addVeh" data-kind="${id}">${icon(VEH_DEF[id].ic)}<span>${esc(L(VEH_DEF[id].fr, VEH_DEF[id].en))}</span></button>`).join('')}</div>${list}${set}${taxi}</div>`;
  },
  text(){
    const sh = shot(), inf = sh.info, n = S.doc.shots.length;
    return ph('text', L('Plan ', 'Shot ') + (S.i + 1) + ' : ' + L('ce qui se passe', 'what happens'), L('Ce texte accompagne l’image sur la planche PDF et pendant la lecture.', 'This text goes with the picture on the PDF board and during playback.')) +
      `<div class="pb"><div class="g2"><label class="fld"><span>${L('Scène', 'Scene')}</span><input id="fScene" data-k="scene" maxlength="40" value="${esc(inf.scene)}" placeholder="${esc(L('ex. 3', 'e.g. 3'))}"></label>
        <label class="fld"><span>${L('Durée', 'Length')}</span><select data-act="info" data-k="dur">${[1, 1.5, 2, 3, 4, 5, 8].map(d => `<option value="${d}" ${d === inf.dur ? 'selected' : ''}>${fmtTime(d)}</option>`).join('')}</select></label></div>
      <label class="fld"><span>${L('L’action', 'Action')}</span><textarea id="cap" data-k="cap" rows="4" placeholder="${esc(L('Léa entre dans le café et cherche quelqu’un.', 'Léa walks into the café, looking for someone.'))}">${esc(inf.cap)}</textarea></label>
      <label class="fld"><span>${L('Dialogue ou son', 'Dialogue or sound')}</span><textarea id="dial" data-k="dial" rows="3" placeholder="${esc(L('LÉA : Tu es en retard.', 'LÉA: You’re late.'))}">${esc(inf.dial)}</textarea></label>
      ${lbl(L('Noté sur la planche', 'Noted on the board'))}<p class="fly-note">${esc(shotLabel('size', inf.size))} · ${esc(shotLabel('angle', inf.angle))} · ${esc(shotLabel('move', inf.move))} · ${Math.round(sh.cam.lens)} mm</p>
      ${lbl(L('Ce plan', 'This shot'))}<div class="pbtns"><button class="btn btn-sm" data-act="dupShot">${icon('copy')}${L('Dupliquer', 'Duplicate')}</button><button class="btn btn-sm" data-act="moveShot" data-d="-1" ${S.i === 0 ? 'disabled' : ''} title="${esc(L('Avancer ce plan', 'Move this shot earlier'))}">${icon('left')}</button><button class="btn btn-sm" data-act="moveShot" data-d="1" ${S.i === n - 1 ? 'disabled' : ''} title="${esc(L('Reculer ce plan', 'Move this shot later'))}">${icon('right')}</button><button class="btn btn-sm danger" data-act="delShot" ${n < 2 ? 'disabled' : ''}>${icon('trash')}${L('Supprimer', 'Delete')}</button></div>
      <div class="pbtns"><button class="btn btn-sm" data-act="sheetView">${icon('board')}${L('Écrire tous les plans d’un coup (planche)', 'Write all shots at once (board view)')}</button></div></div>`;
  },
  look(){
    const st = S.doc.style || 'color';
    const prev = k => { if(!GL.gl) return ''; const o = S.doc.style; S.doc.style = k; const u = offscreenURL(240, 135, (w, h) => drawFrame(shot(), w, h, true), 0.8); S.doc.style = o; return u; };
    return ph('contrast', L('Le rendu', 'The look'), L('Couleur ou noir et blanc, et le format de l’image, pour tout le film.', 'Color or black & white, and the picture format, for the whole film.')) +
      `<div class="pb"><div class="looks"><button class="look-t ${st === 'color' ? 'on' : ''}" data-act="style" data-v="color"><img src="${prev('color')}" alt=""><span>${L('Couleur', 'Color')}</span></button><button class="look-t ${st === 'bw' ? 'on' : ''}" data-act="style" data-v="bw"><img src="${prev('bw')}" alt=""><span>${L('Noir et blanc', 'Black & white')}</span></button></div>
      <p class="fly-note">${L('En noir et blanc, les personnages gardent un trait sombre autour d’eux, leurs habits ont des clartés différentes, et le décor est un peu adouci : on les distingue toujours du fond.', 'In black & white, characters keep a dark outline, their clothes have different brightness, and the set is slightly softened: they always stand out from the background.')}</p>
      ${lbl(L('Le format de l’image', 'Picture format'))}<div class="seg wide ratios">${RATIOS.map(r => `<button class="${(S.doc.ratio || '16:9') === r[0] ? 'on' : ''}" data-act="ratio" data-v="${r[0]}" title="${esc(r[2])}"><i class="rbox" style="width:${Math.round(Math.min(22, 11 * r[1]))}px;height:${Math.round(Math.min(11, 22 / r[1]))}px"></i>${r[0]}</button>`).join('')}</div>
      <p class="fly-note">${L('Le format vaut pour tout le film : l’écran, la planche PDF, l’animatique et les images PNG (recadrées au bon format).', 'The format applies to the whole film: the screen, the PDF board, the animatic and PNG images (cropped to the right format).')}</p>
      ${lbl(L('Aides à l’image', 'Picture aids'))}<label class="ftog"><span>${L('Grille des tiers', 'Rule of thirds')}</span><input type="checkbox" data-act="gridTog" ${S.grid ? 'checked' : ''}><i class="tg"></i></label>
      <label class="ftog"><span>${L('Image finale (sans transparence ni poignées)', 'Final image (no see-through, no handles)')}</span><input type="checkbox" data-act="finalTog" ${S.final ? 'checked' : ''}><i class="tg"></i></label></div>`;
  },
  export(){
    return ph('export', L('Exporter', 'Export'), L('Tout est fait dans ton navigateur : rien n’est envoyé en ligne.', 'Everything happens in your browser: nothing is sent online.')) + `<div class="pb"><div class="xlist">${exportList()}</div></div>`;
  },
  help(){
    return ph('help', L('Ton storyboard, sans savoir dessiner', 'Your storyboard, no drawing skills needed'), '') + `<div class="pb"><ol class="how">
      <li><b>${L('Un plan = une image', 'One shot = one picture')}</b>${L('Ce que tu vois dans le cadre est le plan en cours (son numéro est au-dessus de l’image). Il s’enregistre tout seul.', 'What you see in the frame is the current shot (its number is above the picture). It saves by itself.')}</li>
      <li><b>${L('Installe la scène', 'Set the scene')}</b>${L('À gauche, de haut en bas : le décor (lieu, véhicules, foule), puis les acteurs (personnages, poses).', 'On the left, top to bottom: the set (place, vehicles, crowds), then the cast (characters, poses).')}</li>
      <li><b>${L('Cadre', 'Frame')}</b>${L('« Le cadrage » : sur qui, la valeur, l’angle. La caméra se place. Puis « Le mouvement » si la caméra bouge.', '“Framing”: who, the size, the angle. The camera places itself. Then “Camera move” if the camera moves.')}</li>
      <li><b>${L('Écris', 'Write')}</b>${L('« Ce qui se passe » : l’action et le dialogue du plan.', '“What happens”: the action and dialogue of the shot.')}</li>
      <li><b>${L('Plan suivant', 'Next shot')}</b>${L('« Nouveau plan », en bas : il reprend celui-ci, tu ne changes que ce qui bouge. « Contrechamp » fait l’angle inverse.', '“New shot”, at the bottom: it starts from this one, you only change what moves. “Reverse shot” makes the opposite angle.')}</li>
      <li><b>${L('Relis, exporte', 'Review, export')}</b>${L('« Lire le storyboard » le fait défiler avec les mouvements. Puis la planche PDF ou l’animatique.', '“Play the storyboard” runs it with the moves. Then the PDF board or the animatic.')}</li></ol>
      ${lbl(L('Dans l’image', 'In the picture'))}<p class="fly-note">${L('Épingle verte au-dessus d’une tête : maintiens-la pour déplacer · flèche ronde : tourner · clic sur un bras, la tête… : poser à la main · glisser dans le vide : tourner autour · clic droit : se décaler · molette : avancer · double-clic : viser.', 'Green pin above a head: hold to move · round arrow: turn · click an arm, the head…: pose by hand · drag empty space: orbit · right-click: pan · wheel: move in · double-click: aim.')}</p>
      ${lbl(L('La caméra', 'The camera'))}<p class="fly-note">${L('Elle se promène comme une vraie caméra : elle ne traverse ni les murs ni les meubles, elle glisse le long et passe par-dessus ce qui est bas. Pour changer de pièce, passe par une porte (touches Z Q S D ou flèches), ou clique dans une pièce sur le plan.', 'It moves like a real camera: it never goes through walls or furniture, it slides along them and over anything low. To change rooms, go through a door (WASD or arrow keys), or click a room on the plan.')}</p>
      ${lbl(L('Pour une planche de pro', 'For a pro board'))}<ul class="pro">
        <li>${L('Ouvre la séquence par un plan large (plan général ou d’ensemble) : on comprend où l’on est.', 'Open the sequence on a wide shot (extreme wide or wide): we see where we are.')}</li>
        <li>${L('Dans un dialogue : champ, contrechamp, en restant du même côté des personnages (la règle des 180°). Le bouton « Contrechamp » le fait pour toi.', 'In a dialogue: shot, reverse shot, staying on the same side of the characters (the 180° rule). The “Reverse shot” button does it for you.')}</li>
        <li>${L('Resserre quand l’émotion monte : plan moyen, rapproché, gros plan.', 'Move closer as the emotion rises: medium, medium close-up, close-up.')}</li>
        <li>${L('Choisis le format du film dès le début (« Rendu et format ») : un cadre en 2.39 ne se compose pas comme un cadre en 9:16.', 'Pick the film’s format first (“Look & format”): a 2.39 frame is not composed like a 9:16 one.')}</li>
        <li>${L('Une ligne d’action par plan, au présent : ce qu’on voit, pas ce qu’on pense.', 'One line of action per shot, in the present tense: what we see, not what we think.')}</li></ul>
      ${lbl(L('Raccourcis', 'Shortcuts'))}<p class="fly-note keys">${L('← → plan précédent ou suivant · ZQSD / WASD se déplacer · R F monter, descendre · N nouveau plan · P plein écran · Espace lire · Ctrl+Z annuler · Échap désélectionner', '← → previous or next shot · WASD / ZQSD move · R F up, down · N new shot · P full screen · Space play · Ctrl+Z undo · Esc deselect')}</p>
      <div class="pbtns"><button class="btn btn-sm" data-act="intro">${icon('help')}${L('Revoir l’accueil', 'See the welcome again')}</button><button class="btn btn-sm" data-act="newBoard">${icon('new')}${L('Nouveau storyboard', 'New storyboard')}</button></div></div>`;
  },
};

/* ---------- En bas : le storyboard (on glisse une vignette pour changer l'ordre) ---------- */
const fmtDur = t => { const m = Math.floor(t / 60), s = Math.round(t % 60); return m + ':' + String(s).padStart(2, '0'); };
function renderStrip(){
  const el = document.getElementById('strip'); if(!el) return;
  const two = shot().chars.length > 1, n = S.doc.shots.length;
  el.innerHTML = `<div class="board-h"><b>${L('Storyboard', 'Storyboard')}</b><span>${n} ${n > 1 ? L('plans', 'shots') : L('plan', 'shot')} · ${fmtDur(totalDur())}</span>
      <div class="seg"><button class="${S.view === 'stage' ? 'on' : ''}" data-act="stageView" title="${esc(L('Mettre en scène le plan choisi', 'Stage the chosen shot'))}">${icon('strip')}${L('Bande', 'Strip')}</button><button class="${S.view === 'sheet' ? 'on' : ''}" data-act="sheetView" title="${esc(L('Tous les plans en grand, pour écrire', 'All shots large, for writing'))}">${icon('board')}${L('Planche', 'Board')}</button></div>
      <span class="grow"></span>
      <button class="btn btn-sm btn-play" data-act="playBoard">${icon('play')}${L('Lire le storyboard', 'Play the storyboard')}</button>
      <button class="btn btn-sm btn-primary" data-act="addShot" title="${esc(L('Reprend le plan actuel (touche N)', 'Starts from the current shot (N key)'))}">${icon('plus')}${L('Nouveau plan', 'New shot')}</button></div>
    <div class="cards" id="cards">${S.doc.shots.map((s, i) => `<div class="sc-wrap">${n > 1 ? `<button class="sc-del" data-act="delShotAt" data-i="${i}" title="${esc(L('Supprimer le plan ', 'Delete shot ') + (i + 1) + L(' (touche Suppr)', ' (Delete key)'))}" aria-label="${esc(L('Supprimer le plan ', 'Delete shot ') + (i + 1))}">${icon('trash')}</button>` : ''}<button class="shot-card ${i === S.i ? 'on' : ''}" data-act="goShot" data-i="${i}" draggable="true">
        <span class="sc-img"><img data-thumb="${i}" src="${thumbOf(i)}" alt="" draggable="false"><span class="sc-n">${i + 1}</span>${s.info.scene ? `<span class="sc-sc">${esc(L('Sc. ', 'Sc. ') + s.info.scene)}</span>` : ''}${s.info.move !== 'fix' ? `<span class="sc-mv" title="${esc(shotLabel('move', s.info.move))}">${glyph(MOVE_G[s.info.move] || MOVE_G.fix)}</span>` : ''}<span class="sc-d">${fmtTime(s.info.dur || 2)}</span>${i === S.i ? `<span class="sc-now">${L('en cours', 'editing')}</span>` : ''}</span>
        <span class="sc-t"><b>${esc(shotLabel('size', s.info.size, true))}</b>${esc(s.info.cap || L('Sans action', 'No action yet'))}</span></button></div>`).join('')}
      <div class="add-col">
        <button class="add-shot" data-act="addShot">${icon('plus')}<span>${L('Nouveau plan', 'New shot')}</span><small>${L('copie du plan ', 'copy of shot ') + (S.i + 1)}</small></button>
        ${two ? `<button class="add-shot rev" data-act="addReverse" title="${esc(L('Le plan suivant, par-dessus l’épaule de l’autre personnage', 'The next shot, over the other character’s shoulder'))}">${icon('reverse')}<span>${L('Contrechamp', 'Reverse shot')}</span></button>` : ''}
      </div>
      ${n === 1 ? `<p class="board-tip">${L('Ton premier plan est prêt. Quand l’image te plaît, clique sur « Nouveau plan » : il reprend celui-ci, tu changes juste ce qui bouge.', 'Your first shot is ready. When you like the picture, click “New shot”: it starts from this one, you only change what moves.')}</p>` : ''}</div>`;
  const on = el.querySelector('.shot-card.on'); if(on && on.scrollIntoView) on.scrollIntoView({ block:'nearest', inline:'nearest' });
  if(S.view === 'sheet') renderSheet();
}
/* la planche entière : chaque plan en grand, avec son texte modifiable sur place */
function renderSheet(){
  const el = document.getElementById('sheetView'); if(!el || S.view !== 'sheet') return;
  el.innerHTML = `<div class="sv-h"><b>${esc(S.doc.title || 'Storyboard')}</b><span>${L('Clique sur une image pour la mettre en scène. Écris directement sous chaque plan.', 'Click a picture to stage it. Write right under each shot.')}</span></div>
    <div class="sv-grid">${S.doc.shots.map((s, i) => `<article class="sv-card ${i === S.i ? 'on' : ''}">
      <button class="sv-img" data-act="stageShot" data-i="${i}" title="${esc(L('Mettre en scène ce plan', 'Stage this shot'))}"><img data-thumb="${i}" src="${thumbOf(i)}" alt=""><span class="sc-n">${i + 1}</span>${s.info.move !== 'fix' ? `<span class="sc-mv">${glyph(MOVE_G[s.info.move] || MOVE_G.fix)}</span>` : ''}</button>
      ${S.doc.shots.length > 1 ? `<button class="sc-del sv-del" data-act="delShotAt" data-i="${i}" title="${esc(L('Supprimer le plan ', 'Delete shot ') + (i + 1))}" aria-label="${esc(L('Supprimer le plan ', 'Delete shot ') + (i + 1))}">${icon('trash')}</button>` : ''}
      <div class="sv-meta"><b>${(s.info.scene ? esc(L('Sc. ', 'Sc. ') + s.info.scene) + ' · ' : '') + L('Plan ', 'Shot ') + (i + 1)}</b><span>${esc(shotLabel('size', s.info.size))} · ${esc(shotLabel('angle', s.info.angle))}${s.info.move !== 'fix' ? ' · ' + esc(shotLabel('move', s.info.move)) : ''} · ${fmtTime(s.info.dur || 2)}</span></div>
      <textarea data-sv="cap" data-i="${i}" rows="3" placeholder="${esc(L('L’action…', 'Action…'))}">${esc(s.info.cap)}</textarea>
      <textarea data-sv="dial" data-i="${i}" rows="2" class="dl" placeholder="${esc(L('Dialogue ou son…', 'Dialogue or sound…'))}">${esc(s.info.dial)}</textarea>
    </article>`).join('')}
    <button class="sv-add" data-act="addShotEnd">${icon('plus')}<span>${L('Nouveau plan à la fin', 'New shot at the end')}</span></button></div>`;
}

/* ---------- L'image : toujours en 16:9, comme le film ---------- */
function fitStage(){
  if(!R.canvas) return;
  const wrap = document.getElementById('stageWrap'), st = document.getElementById('stage'); if(!wrap || !st) return;
  const W = wrap.clientWidth - 8, H = wrap.clientHeight - 8;
  if(W <= 0 || H <= 0) return;
  let w = W, h = W * 9 / 16; if(h > H){ h = H; w = H * 16 / 9; }
  st.style.width = Math.max(160, Math.floor(w)) + 'px'; st.style.height = Math.max(90, Math.floor(h)) + 'px';
  if(S.rec) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * (R.scale || 1);
  R.canvas.width = Math.round(Math.max(160, w) * dpr); R.canvas.height = Math.round(Math.max(90, h) * dpr);
  requestRender();
}

/* ---------- Exports ---------- */
function renderShotURL(i, w, h, type, q, arrows){
  const ow = R.canvas.width, oh = R.canvas.height;
  R.canvas.width = w; R.canvas.height = h; drawFrame(S.doc.shots[i], w, h, true);
  let u;
  if(arrows && S.doc.shots[i].info.move !== 'fix'){
    // la flèche du mouvement, dessinée par-dessus l'image (comme sur un storyboard dessiné)
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const x = cv.getContext('2d'); x.drawImage(R.canvas, 0, 0); moveArrow(x, w, h, S.doc.shots[i].info.move);
    u = cv.toDataURL(type || 'image/jpeg', q || 0.88);
  } else u = R.canvas.toDataURL(type || 'image/jpeg', q || 0.88);
  R.canvas.width = ow; R.canvas.height = oh; requestRender();
  return u;
}
/* les flèches des mouvements de caméra, au trait blanc cerné de sombre */
function moveArrow(x, w, h, m){
  const k = w / 960;
  x.save(); x.lineCap = 'round'; x.lineJoin = 'round';
  const stroke = path => { x.strokeStyle = 'rgba(20,22,28,.75)'; x.lineWidth = 9 * k; path(); x.stroke(); x.strokeStyle = '#fff'; x.lineWidth = 4.5 * k; path(); x.stroke(); };
  const head = (ax, ay, ang) => () => { x.beginPath(); x.moveTo(ax - Math.cos(ang - 0.5) * 22 * k, ay - Math.sin(ang - 0.5) * 22 * k); x.lineTo(ax, ay); x.lineTo(ax - Math.cos(ang + 0.5) * 22 * k, ay - Math.sin(ang + 0.5) * 22 * k); };
  const line = (a, b, c, d) => { stroke(() => { x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); }); stroke(head(c, d, Math.atan2(d - b, c - a))); };
  const cx = w / 2, cy = h / 2;
  if(m === 'panR' || m === 'travR') line(w * 0.3, h * (m === 'panR' ? 0.16 : 0.86), w * 0.7, h * (m === 'panR' ? 0.16 : 0.86));
  else if(m === 'panL' || m === 'travL') line(w * 0.7, h * (m === 'panL' ? 0.16 : 0.86), w * 0.3, h * (m === 'panL' ? 0.16 : 0.86));
  else if(m === 'tiltU' || m === 'grue' || m === 'drone') line(w * 0.92, h * 0.72, w * 0.92, h * 0.28);
  else if(m === 'tiltD' || m === 'grueD') line(w * 0.92, h * 0.28, w * 0.92, h * 0.72);
  else if(m === 'in' || m === 'zoomIn') [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => line(cx + a * w * 0.44, cy + b * h * 0.4, cx + a * w * 0.32, cy + b * h * 0.26));
  else if(m === 'out' || m === 'zoomOut') [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => line(cx + a * w * 0.32, cy + b * h * 0.26, cx + a * w * 0.44, cy + b * h * 0.4));
  else if(m === 'orbit'){ stroke(() => { x.beginPath(); x.ellipse(cx, h * 0.84, w * 0.26, h * 0.07, 0, Math.PI * 0.1, Math.PI * 0.95); }); stroke(head(cx - w * 0.255, h * 0.852, Math.PI * 0.55)); }
  else if(m === 'epa') stroke(() => { x.beginPath(); for(let i = 0; i <= 40; i++){ const t = i / 40; x.lineTo(w * (0.3 + 0.4 * t), h * 0.86 + Math.sin(t * 18) * 7 * k); } });
  else if(m === 'end') line(w * 0.32, h * 0.86, w * 0.68, h * 0.86);
  x.restore();
}
function exportImage(){
  // l'image garde le vrai format du film : on enlève les bandes noires
  const url = renderShotURL(S.i, 1920, 1080, 'image/png'), fb = frameBox(1920, 1080);
  const crop = !fb ? fetch(url).then(r => r.blob()) : new Promise(ok => { const im = new Image(); im.onload = () => { const c = document.createElement('canvas'); c.width = Math.round(fb.w); c.height = Math.round(fb.h); c.getContext('2d').drawImage(im, -Math.round(fb.x), -Math.round(fb.y)); c.toBlob(ok, 'image/png'); }; im.src = url; });
  crop.then(b => {
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
const pdfText = s => String(s || '').replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/…/g, '...').replace(/[–—]/g, '-').replace(/ | /g, ' ');
/* la planche PDF : 6 plans par page (vue d'ensemble), ou 3 grands plans par page avec la place d'écrire */
async function exportPdf(per){
  per = per === 3 ? 3 : 6;
  endEdit();
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
        doc.addImage(renderShotURL(i, 960, 540, 'image/jpeg', 0.86, true), 'JPEG', x, y, cw, ih);
        doc.setDrawColor(35, 38, 46); doc.setLineWidth(0.3); doc.rect(x, y, cw, ih); badge(i, x, y);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(35, 38, 46); doc.text(pdfText(title), x, y + ih + 5);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(23, 122, 79); doc.text(pdfText(meta(s)), x, y + ih + 9.2, { maxWidth:cw });
        doc.setFontSize(8.5); doc.setTextColor(60, 64, 74);
        const lines = doc.splitTextToSize(pdfText(s.info.cap), cw).slice(0, 2); doc.text(lines, x, y + ih + 14);
        if(s.info.dial){ doc.setFont('helvetica', 'italic'); doc.setTextColor(92, 98, 112); doc.text(doc.splitTextToSize(pdfText(s.info.dial), cw).slice(0, 1), x, y + ih + 22); }
        else ruled(x, y + ih + 14, cw, 3, lines.length);
      } else {
        const rh = (H - 2 * M - 16) / 3, ih = rh - 6, iw = ih * 16 / 9, x = M, y = M + 15 + k * rh, tx = x + iw + 8, tw = W - M - tx;
        doc.addImage(renderShotURL(i, 1280, 720, 'image/jpeg', 0.86, true), 'JPEG', x, y, iw, ih);
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
    doc.text('Raging Board · ragingstudio.com/board', M, H - 6);
  }
  doc.save(safeName(S.doc.title) + ' - storyboard.pdf');
  toast(L('Planche PDF enregistrée.', 'PDF board saved.'));
}

/* ---------- Lire le storyboard dans l'outil : chaque plan pendant sa durée, avec son mouvement ---------- */
function playBoard(only){
  if(S.play){ stopBoard(); return; }
  endEdit();
  const all = S.doc.shots, idx = only != null ? [only] : all.map((_, i) => i), starts = []; let total = 0;
  idx.forEach(i => { starts.push(total); total += all[i].info.dur || 2; });
  S.play = { from:S.i, last:-1 }; S.sel = null; S.hover = null;
  const st = document.getElementById('stage'); st.classList.add('playing');
  document.getElementById('playStopLbl').textContent = L('Arrêter', 'Stop');
  const box = document.getElementById('playBox'), first = only != null ? 0 : Math.max(0, idx.indexOf(S.i));
  const t0 = performance.now() - starts[first] * 1000;
  const step = now => {
    if(!S.play) return;
    const t = (now - t0) / 1000;
    if(t >= total){ stopBoard(); return; }
    let k = 0; while(k + 1 < idx.length && starts[k + 1] <= t) k++;
    const i = idx[k], s = all[i];
    if(i !== S.play.last){
      S.play.last = i;
      box.innerHTML = `<b>${(s.info.scene ? L('Sc. ', 'Sc. ') + esc(s.info.scene) + ' · ' : '') + L('Plan ', 'Shot ') + (i + 1)}</b>${s.info.cap ? `<span>${esc(s.info.cap)}</span>` : ''}${s.info.dial ? `<i>${esc(s.info.dial)}</i>` : ''}`;
      document.querySelectorAll('.shot-card').forEach((c, j) => c.classList.toggle('now', j === i));
    }
    drawFrame(s, null, null, true, frameAt(s, t - starts[k]));
    document.getElementById('playBar').style.width = (t / total * 100) + '%';
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step); renderHint(); renderWarn();
}
function stopBoard(){
  if(!S.play) return;
  S.play = null;
  document.getElementById('stage').classList.remove('playing');
  document.querySelectorAll('.shot-card.now').forEach(c => c.classList.remove('now'));
  renderHint(); renderWarn(); requestRender();
}

/* ---------- La première visite : les étapes, puis on n'en parle plus ---------- */
function showIntro(force){
  if(!force && lsGet('raging3d_intro')) return;
  if(document.querySelector('.intro')) return;
  const bd = document.createElement('div'); bd.className = 'modal-bd intro';
  const st = (ic, t, d) => `<li><span class="ph-ico">${icon(ic)}</span><span><b>${t}</b>${d}</span></li>`;
  bd.innerHTML = `<div class="modal intro-card" role="dialog" aria-modal="true">
    <div class="ph intro-h">${r3Logo(44, 'rail-logo')}<div><b>${L('Ton storyboard en 3D, sans dessiner', 'Your storyboard in 3D, no drawing')}</b><small>${L('Chaque image du storyboard est un « plan ». Tu en fais un, puis le suivant.', 'Each picture of the storyboard is a “shot”. You make one, then the next.')}</small></div></div>
    <ol class="intro-steps">
      ${st('place', L('Installe', 'Set up'), L('À gauche : le décor, puis les personnages et leurs poses.', 'On the left: the set, then the characters and their poses.'))}
      ${st('frame', L('Cadre', 'Frame'), L('« Le cadrage » : choisis la valeur du plan, la caméra se place. Ce que tu vois dans le cadre, c’est ton plan : il s’enregistre tout seul.', '“Framing”: pick a shot size, the camera places itself. What you see in the frame is your shot: it saves by itself.'))}
      ${st('plus', L('Enchaîne', 'Keep going'), L('« Nouveau plan », en bas : il reprend le plan actuel, tu changes juste ce qui bouge. Puis « Lire le storyboard » et la planche PDF.', '“New shot”, at the bottom: it starts from the current one, you only change what moves. Then “Play the storyboard” and the PDF board.'))}
    </ol>
    <div class="modal-f"><button class="btn btn-primary" data-act="introOk">${L('C’est parti', 'Let’s go')}</button></div></div>`;
  document.body.appendChild(bd);
}

function videoType(){
  const types = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return window.MediaRecorder ? types.find(t => MediaRecorder.isTypeSupported(t)) : null;
}
/* une petite bibliothèque chargée seulement au moment de s'en servir (l'outil reste léger) */
const _libs = {};
function loadLib(name, urls){
  if(window[name]) return Promise.resolve(window[name]);
  if(_libs[name]) return _libs[name];
  return _libs[name] = new Promise((res, rej) => {
    const next = k => {
      if(k >= urls.length){ delete _libs[name]; rej(new Error(name)); return; }
      const s = document.createElement('script'); s.src = urls[k];
      s.onload = () => window[name] ? res(window[name]) : next(k + 1); s.onerror = () => next(k + 1);
      document.head.appendChild(s);
    };
    next(0);
  });
}
/* l'animatique, image par image : chaque image est calculée pour son instant exact (30 par seconde),
   puis encodée en MP4. Même sur un vieil ordinateur, la vidéo est fluide et dure le bon temps :
   l'export prend juste un peu plus longtemps. */
async function exportVideoFrames(){
  const Mux = await loadLib('Mp4Muxer', ['https://cdn.jsdelivr.net/npm/mp4-muxer@5.2.1/build/mp4-muxer.js', 'https://unpkg.com/mp4-muxer@5.2.1/build/mp4-muxer.js']);
  const w = 1280, h = 720, fps = 30, shots = S.doc.shots;
  let codec = null;
  for(const c of ['avc1.4d0028', 'avc1.42001f', 'avc1.640028']){ try{ const r = await VideoEncoder.isConfigSupported({ codec:c, width:w, height:h, bitrate:6e6, framerate:fps }); if(r.supported){ codec = c; break; } }catch(e){} }
  if(!codec) throw new Error('codec');
  const starts = []; let total = 0; shots.forEach(s => { starts.push(total); total += s.info.dur || 2; });
  const n = Math.max(1, Math.round(total * fps));
  const muxer = new Mux.Muxer({ target:new Mux.ArrayBufferTarget(), video:{ codec:'avc', width:w, height:h, frameRate:fps }, fastStart:'in-memory' });
  let fail = null;
  const enc = new VideoEncoder({ output:(chunk, meta) => muxer.addVideoChunk(chunk, meta), error:e => { fail = e; } });
  enc.configure({ codec, width:w, height:h, bitrate:6e6, framerate:fps, latencyMode:'quality' });
  const ow = R.canvas.width, oh = R.canvas.height, box = document.getElementById('recBox');
  S.rec = { cancel:false }; box.classList.remove('hidden');
  R.canvas.width = w; R.canvas.height = h;
  try{
    for(let f = 0; f < n; f++){
      if(S.rec.cancel || fail) break;
      const t = f / fps; let i = 0; while(i + 1 < shots.length && starts[i + 1] <= t) i++;
      drawFrame(shots[i], w, h, true, frameAt(shots[i], t - starts[i]));
      const vf = new VideoFrame(R.canvas, { timestamp:Math.round(f * 1e6 / fps), duration:Math.round(1e6 / fps) });
      enc.encode(vf, { keyFrame:f % (fps * 2) === 0 }); vf.close();
      if(f % 6 === 0 || enc.encodeQueueSize > 6){
        box.innerHTML = `<span class="rec-dot"></span>${L('Animatique', 'Animatic')} · ${Math.round(f / n * 100)} %<button class="btn btn-sm" data-act="cancelRec">${L('Annuler', 'Cancel')}</button>`;
        await new Promise(r => setTimeout(r, 0));
        while(enc.encodeQueueSize > 6) await new Promise(r => setTimeout(r, 4));
      }
    }
    if(fail) throw fail;
    if(S.rec.cancel){ enc.close(); return true; }
    await enc.flush(); muxer.finalize();
    downloadBlob(new Blob([muxer.target.buffer], { type:'video/mp4' }), safeName(S.doc.title) + ' - ' + L('animatique', 'animatic') + '.mp4');
    toast(L('Animatique enregistrée (MP4, 30 images par seconde).', 'Animatic saved (MP4, 30 frames per second).'));
    return true;
  } finally {
    S.rec = null; box.classList.add('hidden'); R.canvas.width = ow; R.canvas.height = oh; requestRender();
  }
}
async function exportVideo(){
  if(S.rec) return;
  endEdit();
  if(window.VideoEncoder && window.VideoFrame){
    try{ if(await exportVideoFrames()) return; }catch(e){ console.warn('Raging Board animatic', e); }
  }
  exportVideoLive();
}
/* l'ancienne façon (navigateurs sans WebCodecs) : on filme l'image en direct */
function exportVideoLive(){
  const type = videoType();
  if(!type || !R.canvas.captureStream){ toast(L('Ce navigateur ne sait pas enregistrer de vidéo. Essaie avec Chrome, Edge ou Firefox.', 'This browser can’t record video. Try Chrome, Edge or Firefox.'), 'warn'); return; }
  endEdit();
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
  const t0 = performance.now();
  drawFrame(shots[0], w, h, true, frameAt(shots[0], 0)); rec.start(200);
  const step = now => {
    if(!S.rec) return;
    if(S.rec.cancel){ rec.stop(); return; }
    const t = Math.min(total, (now - t0) / 1000);
    let i = 0; while(i + 1 < shots.length && starts[i + 1] <= t) i++;
    drawFrame(shots[i], w, h, true, frameAt(shots[i], t - starts[i]));   // on redessine à chaque image : la vidéo garde son rythme
    box.innerHTML = `<span class="rec-dot"></span>${L('Animatique', 'Animatic')} · ${L('plan', 'shot')} ${i + 1} / ${shots.length} · ${fmtTime(t)}<button class="btn btn-sm" data-act="cancelRec">${L('Annuler', 'Cancel')}</button>`;
    if(t >= total){ setTimeout(() => rec.stop(), 150); return; }
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- Confirmation ---------- */
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
function showHelp(){ setPanel('help'); }

/* ---------- Actions ---------- */
const ACT = {
  undo, redo,
  lang:b => setLang(b.dataset.l),
  theme:() => { lsSet(LS_THEME, theme() === 'dark' ? 'light' : 'dark'); renderUI(); },
  panel:b => setPanel(b.dataset.id),
  exportMenu:() => document.getElementById('exportMenu').classList.toggle('hidden'),
  exportPdf:b => { closeMenus(); exportPdf(+b.dataset.per); },
  exportImage:() => { closeMenus(); exportImage(); },
  exportVideo:() => { closeMenus(); exportVideo(); },
  cancelRec:() => { if(S.rec) S.rec.cancel = true; },
  place:b => { setPlace(b.dataset.id); if(S.panel === 'car' && b.dataset.id === 'taxi') renderPanel(); },
  pickChar:b => focusChar(+b.dataset.c),
  addChar:b => addChar(+b.dataset.look), removeChar:b => removeChar(+b.dataset.c), outfit:b => setOutfit(b.dataset.id), faceThem, lookAt:lookAtOther,
  spot:b => placeAt(+b.dataset.k), side:b => frameSide(b.dataset.v),
  playBoard:() => playBoard(), stopBoard, previewShot:() => playBoard(S.i),
  introOk:() => { lsSet('raging3d_intro', '1'); const i = document.querySelector('.intro'); if(i) i.remove(); },
  intro:() => showIntro(true),
  pose:b => setPose(b.dataset.id),
  resetPart,
  target:b => focusChar(+b.dataset.c),
  size:b => frameSize(b.dataset.v),
  angle:b => frameAngle(b.dataset.v),
  lens:b => setLens(+b.dataset.l),
  grid:() => { S.grid = !S.grid; renderHead(); renderView(); if(S.panel === 'look') renderPanel(); },
  final:b => setFinal(b.dataset.v === '1'),
  goShot:b => goShot(+b.dataset.i),
  prevShot:() => goShot(S.i - 1), nextShot:() => goShot(S.i + 1),
  stageShot:b => { S.view = 'stage'; goShot(+b.dataset.i); renderUI(); },
  stageView:() => { S.view = 'stage'; renderUI(); },
  sheetView:() => { S.view = 'sheet'; renderUI(); },
  addShot, addReverse, dupShot, delShot, delShotAt:b => delShot(+b.dataset.i), planTog:() => { lsSet('raging3d_plan', lsGet('raging3d_plan') === '1' ? '0' : '1'); renderPlan(); }, planLv:b => { S.planLevel = +b.dataset.l; const d = SET_DEF[shot().set], k = d.floors.findIndex(f => f[2] === S.planLevel); if(k >= 0){ goRoom(k); renderHead(); renderPanel(); } else renderPlan(); }, bringHere:() => { bringHere(); renderPlan(); }, jump:b => { const g = document.getElementById('g-' + b.dataset.t); if(g) g.scrollIntoView({ block:'start', behavior:'smooth' }); },
  addShotEnd:() => { goShot(S.doc.shots.length - 1); addShot(); },
  moveShot:b => moveShot(+b.dataset.d),
  info:b => { const k = b.dataset.k, v = b.dataset.v; if(k === 'move' && v !== 'end') endEdit(); edit(() => { shot().info[k] = v; }); renderStrip(); },
  dur:b => { edit(() => { shot().info.dur = +b.dataset.v; }); renderStrip(); },
  editEnd:b => editEnd(b.dataset.v === '1'),
  full:() => toggleFull(), tbChar:() => { const s = shot(), used = s.chars.map(c => c.look), k = CHAR_LOOK.findIndex((x, i) => !used.includes(i)); if(k >= 0) addChar(k); setPanel('chars'); }, immTools:() => immTools(), style:b => setStyle(b.dataset.v), ratio:b => setRatio(b.dataset.v),
  carSetup, carShot:b => carShot(b.dataset.id),
  floor:b => { goRoom(+b.dataset.k); renderHead(); renderPanel(); },
  addVeh:b => addVehicle(b.dataset.kind || 'moto'), removeVeh:b => removeVehicle(+b.dataset.k), pickVeh:b => { S.veh = +b.dataset.k; renderPanel(); requestRender(); },
  vehCol:b => { const v = shot().vehicles[S.veh]; if(v) edit(() => { v.col = b.dataset.c; }); },
  mount:b => mountVehicle(S.veh < 0 ? 0 : S.veh, +b.dataset.seat), vehShot:b => vehShot(S.veh < 0 ? 0 : S.veh, b.dataset.id),
  gunShot:b => gunShot(b.dataset.id), prop:b => setProp(b.dataset.id),
  addCrowd:b => addCrowd(b.dataset.kind),
  pickCrowd:b => { S.crowd = +b.dataset.k; renderPanel(); requestRender(); },
  removeCrowd:b => removeCrowd(+b.dataset.k),
  crowdKind:b => { const c = shot().crowds[S.crowd]; if(!c) return; edit(() => { c.kind = b.dataset.kind; }); },
  crowdShuffle:() => { const c = shot().crowds[S.crowd]; if(!c) return; edit(() => { c.seed = 1 + Math.floor(Math.random() * 9999); }); },
  newBoard:async () => {
    if(!await ask(L('Nouveau storyboard ?', 'New storyboard?'), L('Le storyboard actuel sera remplacé. Tu pourras revenir en arrière avec Annuler.', 'The current storyboard will be replaced. You can go back with Undo.'), L('Nouveau storyboard', 'New storyboard'))) return;
    endEdit(); pushUndo(); S.doc = newDoc(shot().set); S.i = 0; S.sel = null; S.target = 0; THUMBS.clear(); changed(true);
  },
  help:showHelp,
};
function closeMenus(){ const m = document.getElementById('exportMenu'); if(m) m.classList.add('hidden'); }

function bindEvents(){
  // le plan de la maison : une pièce, ou n'importe quel point de l'étage
  document.addEventListener('click', e => {
    const svg = e.target.closest('#hpSvg'); if(!svg) return;
    // on clique dans une pièce : la caméra s'y pose, tournée vers l'endroit cliqué
    const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, x = (e.clientX - r.left) * vb.width / r.width, y = (e.clientY - r.top) * vb.height / r.height;
    const wx = clamp(PLAN.x0 + (x - PLAN.pad) / PLAN.k, -4.8, 4.8), wz = clamp(PLAN.z0 + (y - PLAN.pad) / PLAN.k, -3.8, 3.8); goSpot(+svg.dataset.l, wx, wz);
    lsSet('raging3d_plan', '0');   // la pièce choisie, le plan se replie et laisse voir l'image
    renderHead(); renderPanel();
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-act]');
    if(!e.target.closest('.menu-wrap')) closeMenus();
    if(!b || b.tagName === 'INPUT' || b.tagName === 'SELECT' || b.disabled) return;
    const f = ACT[b.dataset.act]; if(f){ e.preventDefault(); f(b, e); }
  });
  let sliderSnap = null, capSnap = null;
  document.addEventListener('input', e => {
    const t = e.target;
    if(t.id === 'tbTitle'){ S.doc.title = t.value; save(); const p = document.querySelector('.rail-project'); if(p) p.textContent = t.value || L('Sans titre', 'Untitled'); return; }
    // les champs du plan : scène, action, dialogue
    if(t.id === 'cap' || t.id === 'dial' || t.id === 'fScene'){
      if(!capSnap) capSnap = snapshot(); shot().info[t.dataset.k] = t.value; save();
      const card = document.querySelector(`.shot-card[data-i="${S.i}"]`);
      if(card && t.id === 'cap') card.querySelector('.sc-t').lastChild.textContent = t.value || L('Sans action', 'No action yet');
      return;
    }
    // la planche entière : on écrit sous chaque plan, sans changer de plan
    if(t.dataset.sv){ if(!capSnap) capSnap = snapshot(); const s = S.doc.shots[+t.dataset.i]; if(s){ s.info[t.dataset.sv] = t.value; save(); } return; }
    if(t.dataset.act === 'crowdSet'){
      if(!sliderSnap) sliderSnap = snapshot();
      setCrowd(S.crowd, t.dataset.f, +t.value); renderSide(true); return;
    }
    if(t.dataset.act === 'vehAlt'){
      const s = shot(), v = s.vehicles[S.veh < 0 ? 0 : S.veh]; if(!v) return;
      if(!sliderSnap) sliderSnap = snapshot();
      v.y = +t.value; syncRiders(s); const b = t.nextElementSibling; if(b) b.textContent = round(v.y, 1) + ' m'; R.pickDirty = true; requestRender(); return;
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
    if(t.dataset.act === 'axis' || t.dataset.act === 'root' || t.dataset.act === 'crowdSet' || t.dataset.act === 'vehAlt'){ pushUndo(sliderSnap); sliderSnap = null; changed(); }
    if((t.id === 'cap' || t.id === 'dial' || t.id === 'fScene' || t.dataset.sv) && capSnap){ pushUndo(capSnap); capSnap = null; if(t.id === 'fScene' || t.dataset.sv) { renderStrip(); renderHead(); } }
    if(t.dataset.act === 'info' && t.tagName === 'SELECT'){ const k = t.dataset.k; edit(() => { shot().info[k] = k === 'dur' ? +t.value : t.value; }); renderStrip(); }
    if(t.dataset.act === 'room' && t.value !== ''){ goRoom(+t.value); renderHead(); renderPanel(); }
    if(t.dataset.act === 'walk') edit(() => { shot().info.walk = t.checked; });
    if(t.dataset.act === 'gridTog'){ S.grid = t.checked; renderHead(); renderView(); }
    if(t.dataset.act === 'finalTog') setFinal(t.checked);
  });
  const c = R.canvas;
  c.addEventListener('pointerdown', onDown); c.addEventListener('pointermove', onMove); c.addEventListener('pointerup', onUp); c.addEventListener('pointercancel', onUp);
  c.addEventListener('pointerleave', () => { if(!DRAG.mode && S.hover){ S.hover = null; requestRender(); renderHint(); } });
  c.addEventListener('wheel', onWheel, { passive:false });
  c.addEventListener('dblclick', onDblClick);
  // le storyboard : glisser une vignette pour la changer de place
  const strip = document.getElementById('strip'); let dragFrom = -1;
  strip.addEventListener('dragstart', e => { const c = e.target.closest('.shot-card'); if(!c) return; dragFrom = +c.dataset.i; c.classList.add('drag'); e.dataTransfer.effectAllowed = 'move'; try{ e.dataTransfer.setData('text/plain', String(dragFrom)); }catch(err){} });
  const dropIndex = e => { const cards = [...strip.querySelectorAll('.shot-card')]; for(let i = 0; i < cards.length; i++){ const r = cards[i].getBoundingClientRect(); if(e.clientX < r.left + r.width / 2) return i; } return cards.length; };
  strip.addEventListener('dragover', e => { if(dragFrom < 0) return; e.preventDefault(); const k = dropIndex(e); strip.querySelectorAll('.shot-card').forEach((c, i) => { c.classList.toggle('drop-l', i === k); c.classList.toggle('drop-r', k === S.doc.shots.length && i === k - 1); }); });
  const dragEnd = () => { dragFrom = -1; strip.querySelectorAll('.drag, .drop-l, .drop-r').forEach(c => c.classList.remove('drag', 'drop-l', 'drop-r')); };
  strip.addEventListener('drop', e => { if(dragFrom < 0) return; e.preventDefault(); const f = dragFrom, k = dropIndex(e); dragEnd(); dropShot(f, k); });
  strip.addEventListener('dragend', dragEnd);
  // les poignées au-dessus des têtes (et des foules)
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
  if(window.ResizeObserver) new ResizeObserver(() => fitStage()).observe(document.getElementById('stageWrap'));
  document.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toLowerCase();
    if((tag === 'input' && e.target.type !== 'range' && e.target.type !== 'checkbox') || tag === 'textarea' || tag === 'select') return;
    if(document.body.classList.contains('on-home')) return;   // sur l'accueil, les raccourcis de l'atelier dorment
    if(document.querySelector('.modal-bd')){ if(e.key === 'Escape'){ const i = document.querySelector('.intro'); if(i) ACT.introOk(); } return; }
    const mod = e.ctrlKey || e.metaKey;
    if(mod && e.key.toLowerCase() === 'z'){ e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if(mod && e.key.toLowerCase() === 'y'){ e.preventDefault(); redo(); return; }
    if(mod) return;
    if(S.view === 'sheet') return;
    const nk = NAV_KEYS[e.key.toLowerCase()];
    if(nk){ e.preventDefault(); if(!NAV.keys.has(nk)){ NAV.keys.add(nk); navStart(); } return; }
    if(e.key === 'ArrowRight'){ e.preventDefault(); goShot(S.i + 1); }
    else if(e.key === 'ArrowLeft'){ e.preventDefault(); goShot(S.i - 1); }
    else if(e.key.toLowerCase() === 'n'){ e.preventDefault(); addShot(); }
    else if(e.key.toLowerCase() === 'p'){ e.preventDefault(); toggleFull(); }
    else if(e.key.toLowerCase() === 'h' && isFull()){ e.preventDefault(); immTools(); }
    else if((e.key === 'Delete' || e.key === 'Backspace') && !S.sel){ e.preventDefault(); delShot(); }
    else if(e.key === 'Escape' && document.body.classList.contains('fs-fake')){ toggleFull(); }
    else if(e.key === 'Escape' && S.play){ stopBoard(); }
    else if(e.key === ' ' && (e.target === document.body || tag === 'button')){ e.preventDefault(); playBoard(); }
    else if(e.key === 'Escape'){ if(S.sel){ S.sel = null; renderPanel(); renderHint(); requestRender(); } closeMenus(); }
  });
}

/* ---------- Démarrage ---------- */
/* le démarrage : l'atelier se prépare derrière l'accueil (voir 06-home.js) */
function bootEditor(){
  document.documentElement.lang = getLang();
  if(!load()){ S.doc = newDoc('garage'); S.i = 0; }
  renderUI();
  R.canvas = document.getElementById('view');
  if(!GL.init(R.canvas)){
    document.getElementById('stage').innerHTML = `<div class="nogl"><b>${L('La 3D n’est pas disponible dans ce navigateur.', '3D isn’t available in this browser.')}</b>${L('Raging Board a besoin de WebGL. Essaie avec une version récente de Chrome, Edge ou Firefox, ou active l’accélération matérielle dans les réglages du navigateur.', 'Raging Board needs WebGL. Try a recent Chrome, Edge or Firefox, or turn on hardware acceleration in your browser settings.')}</div>`;
    return;
  }
  initMeshes(); bindEvents(); renderUI(); fitStage(); benchmark();
  return true;
}
