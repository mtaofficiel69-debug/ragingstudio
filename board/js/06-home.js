/* =====================================================================
   RAGING BOARD — L'ACCUEIL : MES STORYBOARDS
   Comme Raging Page et Raging Draw : à gauche, créer, ouvrir, l'exemple,
   l'aide ; à droite, tous ses storyboards, rangés du plus récent au plus
   ancien. Chaque storyboard est gardé à part dans le navigateur ; on peut
   l'emporter dans un fichier .rboard.
===================================================================== */
const LS_LIB = 'raging3d_lib', docKey = id => 'raging3d_doc_' + id;
S.docId = null;
const libGet = () => { try{ const a = JSON.parse(lsGet(LS_LIB) || '[]'); return Array.isArray(a) ? a.filter(x => x && x.id) : []; }catch(e){ return []; } };
const libSet = a => lsSet(LS_LIB, JSON.stringify(a));
const uidB = () => 'b' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const docDur = d => d.shots.reduce((t, s) => t + ((s.info && s.info.dur) || 2), 0);

/* l'enregistrement du storyboard ouvert : son contenu, et sa fiche dans la liste (titre, plans, vignette) */
let _libThumbT = 0;
function persistDoc(json){
  lsSet(docKey(S.docId), json);
  const lib = libGet(), e = lib.find(x => x.id === S.docId) || (lib.unshift({ id:S.docId }), lib[0]);
  Object.assign(e, { title:S.doc.title || '', n:S.doc.shots.length, dur:docDur(S.doc), upd:Date.now() });
  libSet(lib);
  clearTimeout(_libThumbT); _libThumbT = setTimeout(() => { const l = libGet(), x = l.find(y => y.id === S.docId); if(!x || !S.doc) return; const u = thumbOf(0); if(u){ x.thumb = u; libSet(l); } }, 1200);
}
/* la toute première fois : le storyboard d'avant (un seul, sans liste) rejoint la liste */
function migrateLib(){
  if(lsGet('raging3d_libv')) return; lsSet('raging3d_libv', '1');
  if(libGet().length || !lsGet(LS_SCENE)) return;
  const keep = S.doc, ki = S.i;
  if(!load()) return;
  const id = uidB(); lsSet(docKey(id), JSON.stringify({ doc:S.doc, i:S.i }));
  libSet([{ id, title:S.doc.title || '', n:S.doc.shots.length, dur:docDur(S.doc), upd:Date.now() }]);
  S.doc = keep; S.i = ki;
}
function readDoc(id){
  try{ const o = JSON.parse(lsGet(docKey(id)) || 'null'); const d = o && (o.doc || o);
    if(d && d.v === 2 && Array.isArray(d.shots) && d.shots.length && d.shots.every(s => SET_DEF[s.set])){ d.shots.forEach(fixShot); if(!d.style) d.style = 'color'; return { doc:d, i:clamp((o && o.i) || 0, 0, d.shots.length - 1) }; }
  }catch(e){}
  return null;
}

/* ---------- Ouvrir, créer, dupliquer, supprimer ---------- */
function openBoard(id){
  const o = readDoc(id); if(!o){ toast(L('Ce storyboard est illisible.', 'This storyboard can’t be read.'), 'warn'); return; }
  endEdit(); S.docId = id; S.doc = o.doc; S.i = o.i; S.sel = null; S.target = 0; S.undo = []; S.redo = []; S.view = 'stage'; S.room = null; S.planLevel = null;
  THUMBS.clear(); lsSet('raging3d_last', id);
  showEditor();
}
function addBoard(doc, open){
  const id = uidB(); lsSet(docKey(id), JSON.stringify({ doc, i:0 }));
  const lib = libGet(); lib.unshift({ id, title:doc.title || '', n:doc.shots.length, dur:docDur(doc), upd:Date.now() }); libSet(lib);
  if(open) openBoard(id); else renderHome();
  return id;
}
function newBoardHome(){
  const n = libGet().length + 1, d = newDoc('garage'); d.title = L('Mon storyboard', 'My storyboard') + (n > 1 ? ' ' + n : '');
  addBoard(d, true);
}
function dupBoard(id){ const o = readDoc(id); if(!o) return; o.doc.title = (o.doc.title || L('Sans titre', 'Untitled')) + L(' (copie)', ' (copy)'); const lib = libGet(), src = lib.find(x => x.id === id); const nid = addBoard(o.doc, false); const l2 = libGet(), e = l2.find(x => x.id === nid); if(e && src && src.thumb){ e.thumb = src.thumb; libSet(l2); renderHome(); } }
async function delBoard(id){
  const e = libGet().find(x => x.id === id); if(!e) return;
  if(!await ask(L('Supprimer ce storyboard ?', 'Delete this storyboard?'), L('« ', '“') + (e.title || L('Sans titre', 'Untitled')) + L(' » sera effacé de ce navigateur. Garde d’abord une copie en fichier si tu en as besoin.', '” will be erased from this browser. Save a file copy first if you need it.'), L('Supprimer', 'Delete'))) return;
  libSet(libGet().filter(x => x.id !== id)); try{ localStorage.removeItem(docKey(id)); }catch(err){}
  if(S.docId === id) S.docId = null;
  renderHome();
}
/* le fichier .rboard : tout le storyboard, pour le garder ou changer d'ordinateur */
function exportBoardFile(id){
  const o = id === S.docId && S.doc ? { doc:S.doc } : readDoc(id); if(!o) return;
  const blob = new Blob([JSON.stringify({ app:'raging-board', v:1, doc:o.doc })], { type:'application/json' });
  downloadBlob(blob, safeName(o.doc.title || 'storyboard') + '.rboard');
}
function importBoardFile(file){
  const r = new FileReader();
  r.onload = () => { try{ const o = JSON.parse(r.result), d = o.doc || o;
      if(!(d && d.v === 2 && Array.isArray(d.shots) && d.shots.length && d.shots.every(s => SET_DEF[s.set]))) throw 0;
      d.shots.forEach(fixShot); addBoard(d, true); toast(L('Storyboard ouvert.', 'Storyboard opened.'));
    }catch(e){ toast(L('Ce fichier n’est pas un storyboard Raging Board.', 'This file isn’t a Raging Board storyboard.'), 'warn'); } };
  r.readAsText(file);
}
/* le storyboard d'exemple : un rendez-vous au café, en six plans (plan large, champ-contrechamp, gros plan) */
function exampleDoc(){
  const d = newDoc('street'); d.title = L('Exemple : le rendez-vous', 'Example: the meeting'); d.shots = [];
  const cafe = () => { const s = newShot('cafe'); s.chars = [charFromSpawn(0, SET_DEF.cafe, 0), charFromSpawn(1, SET_DEF.cafe, 2)]; return s; };
  const info = (s, o) => Object.assign(s.info, o);
  let s = newShot('street'); const lea = s.chars[0]; lea.look = 2; putOnSpot(lea, 'walk'); s.cam = clone(SET_DEF.street.cam);
  info(s, { size:'pg', move:'panL', dur:3, scene:'1', cap:L('EXT. RUE – JOUR. Léa traverse la rue, en retard.', 'EXT. STREET – DAY. Léa crosses the street, running late.') }); d.shots.push(s);
  s = cafe(); info(s, { size:'pe', dur:3, scene:'2', cap:L('INT. CAFÉ – JOUR. Paul attend déjà, devant deux cafés.', 'INT. CAFÉ – DAY. Paul is already waiting, two coffees on the table.') }); d.shots.push(s);
  s = cafe(); s.cam = frameOTS(s.chars[0], s.chars[1], 50); info(s, { size:'am', dur:2, scene:'2', cap:L('Paul lève les yeux.', 'Paul looks up.'), dial:L('PAUL : Tu es en retard.', 'PAUL: You’re late.') }); d.shots.push(s);
  s = cafe(); s.cam = frameOTS(s.chars[1], s.chars[0], 50); info(s, { size:'am', dur:2, scene:'2', cap:L('Léa sourit, s’assoit.', 'Léa smiles and sits down.'), dial:L('LÉA : Je sais. J’ai une nouvelle.', 'LÉA: I know. I have news.') }); d.shots.push(s);
  s = cafe(); s.cam = frameOn(s.chars[0], 'gp', 'neu', 85); info(s, { size:'gp', move:'in', dur:3, scene:'2', cap:L('Gros plan sur Paul : il comprend.', 'Close-up on Paul: he understands.') }); d.shots.push(s);
  return d;
}

/* ---------- Passer de l'accueil à l'atelier ---------- */
function showHome(){
  if(S.docId && S.doc){ clearTimeout(_saveT); persistDoc(docJSON()); clearTimeout(_libThumbT); const u = thumbOf(0), l = libGet(), x = l.find(y => y.id === S.docId); if(u && x){ x.thumb = u; libSet(l); } }
  endEdit(); if(S.play) stopBoard();
  if(document.fullscreenElement) document.exitFullscreen();
  document.body.classList.remove('fs-fake', 'imm', 'imm-clean');
  document.body.classList.add('on-home'); renderHome(); window.scrollTo(0, 0);
}
function showEditor(){
  document.body.classList.remove('on-home');
  const h = document.getElementById('home'); if(h) h.innerHTML = '';
  renderUI(); fitStage(); requestRender(); showIntro();
}
const timeAgo = t => {
  const s = (Date.now() - t) / 1000;
  if(s < 60) return L('à l’instant', 'just now');
  if(s < 3600) return L('il y a ', '') + Math.round(s / 60) + L(' min', ' min ago');
  if(s < 86400) return L('il y a ', '') + Math.round(s / 3600) + L(' h', ' h ago');
  if(s < 86400 * 30) return L('il y a ', '') + Math.round(s / 86400) + L(' j', ' d ago');
  return new Date(t).toLocaleDateString(getLang() === 'fr' ? 'fr-FR' : 'en-GB', { day:'numeric', month:'short', year:'numeric' });
};
const RP_LOGO = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#1F6FA0"/><path d="M12 7H38L53 22V57H12Z" fill="#FCFDFE" stroke="#FCFDFE" stroke-width="3" stroke-linejoin="round"/><path d="M38 7V22H53Z" fill="#B7D4EC" stroke="#B7D4EC" stroke-width="2" stroke-linejoin="round"/><path d="M16 25L31 30M50 27L35 30" stroke="#14425E" stroke-width="6" stroke-linecap="round"/><circle cx="25" cy="38" r="6.6" fill="#14425E"/><circle cx="41" cy="38" r="6.6" fill="#14425E"/><circle cx="27.2" cy="35.8" r="1.9" fill="#FCFDFE"/><circle cx="43.2" cy="35.8" r="1.9" fill="#FCFDFE"/><path d="M20 51H37" stroke="#14425E" stroke-width="5.6" stroke-linecap="round"/></svg>';
const RD_LOGO = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#A51F2B"/><path d="M12 7H53V57H12Z" fill="#FCFDFE" stroke="#FCFDFE" stroke-width="3" stroke-linejoin="round"/><path d="M12 7H53V12.6c0 1.7-1 2.7-2.3 2.7s-2.3-1-2.3-2.7V12H43.6v5.2c0 1.9-1.1 3-2.5 3s-2.5-1.1-2.5-3V12H12Z" fill="#F2C4C7" stroke="#F2C4C7" stroke-width="3" stroke-linejoin="round"/><path d="M16 25L31 30M50 27L35 30" stroke="#5E1418" stroke-width="6" stroke-linecap="round"/><circle cx="25" cy="38" r="6.6" fill="#5E1418"/><circle cx="41" cy="38" r="6.6" fill="#5E1418"/><circle cx="27.2" cy="35.8" r="1.9" fill="#FCFDFE"/><circle cx="43.2" cy="35.8" r="1.9" fill="#FCFDFE"/><path d="M20 51H37" stroke="#5E1418" stroke-width="5.6" stroke-linecap="round"/></svg>';
const HUB_LOGO = '<svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#262535"/><path d="M12 7H38L53 22V57H12Z" fill="#FCFDFE" stroke="#FCFDFE" stroke-width="3" stroke-linejoin="round"/><path d="M38 7V22H43Z" fill="#3699D4"/><path d="M38 7L43 22H48Z" fill="#22A06B"/><path d="M38 7L48 22H53Z" fill="#D9363E"/><path d="M16 25L31 30M50 27L35 30" stroke="#262535" stroke-width="6" stroke-linecap="round"/><circle cx="25" cy="38" r="6.6" fill="#262535"/><circle cx="41" cy="38" r="6.6" fill="#262535"/><circle cx="27.2" cy="35.8" r="1.9" fill="#FCFDFE"/><circle cx="43.2" cy="35.8" r="1.9" fill="#FCFDFE"/><path d="M24 51H42" stroke="#262535" stroke-width="5.6" stroke-linecap="round"/></svg>';
const HOME_TIPS = [
  ['Un dialogue ? « Contrechamp » prépare l’angle inverse.', 'A dialogue? “Reverse shot” sets up the opposite angle.'],
  ['Touche N : un nouveau plan qui reprend l’actuel.', 'N key: a new shot that starts from the current one.'],
  ['Maison de campagne : le plan en bas à gauche te téléporte.', 'Country house: the plan at the bottom left teleports you.'],
  ['Touche P : tout le storyboard en plein écran, en immersion.', 'P key: the whole storyboard in immersive full screen.'],
  ['Choisis le format (2.39, 9:16…) avant de cadrer.', 'Pick the format (2.39, 9:16…) before framing.'],
];
function renderHome(){
  let el = document.getElementById('home');
  if(!el){ el = document.createElement('div'); el.id = 'home'; document.body.appendChild(el); }
  document.documentElement.lang = getLang(); document.documentElement.dataset.theme = theme();
  const lib = libGet().sort((a, b) => (b.upd || 0) - (a.upd || 0)), last = lib[0];
  const cards = lib.map(b => `<article class="bh-card">
      <button class="bh-open" data-act="hOpen" data-id="${esc(b.id)}" title="${esc(L('Ouvrir', 'Open'))}">
        <span class="bh-img">${b.thumb ? `<img src="${b.thumb}" alt="" loading="lazy">` : `<span class="bh-noimg">${r3Logo(34)}</span>`}<span class="bh-n">${b.n || 1} ${(b.n || 1) > 1 ? L('plans', 'shots') : L('plan', 'shot')}</span></span>
        <span class="bh-t"><b>${esc(b.title || L('Sans titre', 'Untitled'))}</b><small>${fmtDur(b.dur || 2)} · ${esc(timeAgo(b.upd || Date.now()))}</small></span>
      </button>
      <div class="bh-acts">
        <button class="ib sm" data-act="hDup" data-id="${esc(b.id)}" title="${esc(L('Dupliquer', 'Duplicate'))}">${icon('copy')}</button>
        <button class="ib sm" data-act="hExport" data-id="${esc(b.id)}" title="${esc(L('Enregistrer le fichier (.rboard)', 'Save the file (.rboard)'))}">${icon('save')}</button>
        <button class="ib sm danger" data-act="hDel" data-id="${esc(b.id)}" title="${esc(L('Supprimer', 'Delete'))}">${icon('trash')}</button>
      </div></article>`).join('');
  el.innerHTML = `<header class="bh-top">
      <a class="bh-brand" href="./" aria-label="Raging Board">${r3Logo(40, 'bh-logo')}${r3Wordmark()}</a>
      <nav class="bh-links" aria-label="${esc(L('Raging Studio et les autres outils', 'Raging Studio and the other tools'))}">
        <a class="bh-l" href="${HUB()}" title="${esc(L('L’accueil de Raging Studio : tous les outils', 'The Raging Studio home: all the tools'))}">${HUB_LOGO}<span>Raging Studio</span></a>
        <a class="bh-l bh-guide" href="../guide.html?from=board" title="${esc(L('Comment fonctionnent Raging Page, Raging Board et Raging Draw', 'How Raging Page, Raging Board and Raging Draw work'))}"><svg class="icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3C6 2 3.5 2 2 2.8v10c1.5-.8 4-.8 6 .2M8 3c2-1 4.5-1 6 -.2v10c-1.5-.8-4-.8-6 .2V3z"/></svg><span>Guide</span></a>
        <span class="app-trio" role="group" aria-label="${esc(L('Les outils Raging Studio', 'Raging Studio tools'))}"><a class="at-i" href="../page/" title="Raging Page">${RP_LOGO}</a><span class="at-i on" title="Raging Board" aria-current="page">${r3Logo(24)}</span><a class="at-i" href="../draw/" title="Raging Draw">${RD_LOGO}</a></span>
        <span class="bh-sep"></span>
        <div class="lang-flags" role="group" aria-label="Language / Langue"><button class="lang-flag ${getLang() === 'fr' ? 'active' : ''}" data-act="hLang" data-l="fr">FR</button><button class="lang-flag ${getLang() === 'en' ? 'active' : ''}" data-act="hLang" data-l="en">EN</button></div>
        <button class="ib" data-act="hTheme" title="${esc(theme() === 'dark' ? L('Mode clair', 'Light mode') : L('Mode sombre', 'Dark mode'))}">${icon(theme() === 'dark' ? 'sun' : 'moon')}</button>
      </nav>
    </header>
    <div class="bh-body">
      <aside class="bh-side">
        <button class="btn btn-primary bh-new" data-act="hNew">${icon('plus')}${L('Nouveau storyboard', 'New storyboard')}</button>
        <div class="bh-navs">
          <button class="bh-nav" data-act="hImport">${icon('folder')}<span>${L('Ouvrir un fichier', 'Open a file')}<small>.rboard</small></span></button>
          <button class="bh-nav" data-act="hExample">${icon('board')}<span>${L('Storyboard d’exemple', 'Example storyboard')}<small>${L('Un rendez-vous au café, en 5 plans', 'A meeting at a café, in 5 shots')}</small></span></button>
          <button class="bh-nav" data-act="hHelp">${icon('book')}<span>${L('Comment faire', 'How it works')}</span></button>
          <a class="bh-nav sup" href="https://ko-fi.com/ragingstudio" target="_blank" rel="noopener">${icon('heart')}<span>${L('Soutenir Raging Studio', 'Support Raging Studio')}<small>${L('Un don sur Ko-fi', 'A donation on Ko-fi')}</small></span></a>
          <a class="bh-nav dsc" href="${DISCORD_URL}" target="_blank" rel="noopener">${discordSvg()}<span>${L('La communauté Discord', 'The Discord community')}<small>${L('Undergrounders · 100 % francophone', 'Undergrounders · French only')}</small></span></a>
          <input type="file" id="hFile" accept=".rboard,.json,application/json" hidden>
        </div>
        <div class="bh-about">${r3Wordmark()}<p>${L('Ton storyboard en 3D, sans savoir dessiner. Gratuit, sans compte.', 'Your storyboard in 3D, no drawing skills needed. Free, no account.')}</p></div>
      </aside>
      <main class="bh-main">
        <div class="bh-main-h"><h1>${L('Mes storyboards', 'My storyboards')}</h1>${lib.length ? `<span class="bh-count">${lib.length}</span>` : ''}
          ${last ? `<button class="bh-resume" data-act="hOpen" data-id="${esc(last.id)}"><span>${L('Reprendre', 'Resume')}</span><b>${esc(last.title || L('Sans titre', 'Untitled'))}</b>${icon('right')}</button>` : ''}</div>
        ${lib.length ? `<div class="bh-grid">${cards}</div>` : `<div class="bh-empty">${r3Logo(56)}<p>${L('Aucun storyboard pour l’instant. Crée le premier : tu mets en scène dès l’écran suivant.', 'No storyboard yet. Create the first one: you’ll be staging on the very next screen.')}</p>
          <button class="btn btn-primary" data-act="hNew">${icon('plus')}${L('Nouveau storyboard', 'New storyboard')}</button><button class="btn" data-act="hExample">${icon('board')}${L('Voir le storyboard d’exemple', 'See the example storyboard')}</button></div>`}
      </main>
    </div>`;
  const f = el.querySelector('#hFile'); f.onchange = () => { if(f.files[0]) importBoardFile(f.files[0]); f.value = ''; };
}
Object.assign(ACT, {
  toHome:() => showHome(), newBoard:() => newBoardHome(),
  hNew:() => newBoardHome(), hOpen:b => openBoard(b.dataset.id), hDup:b => dupBoard(b.dataset.id), hDel:b => delBoard(b.dataset.id),
  hExport:b => exportBoardFile(b.dataset.id), hExportCur:() => { closeMenus(); exportBoardFile(S.docId); },
  hImport:() => document.getElementById('hFile').click(), hExample:() => addBoard(exampleDoc(), true), hHelp:() => showIntro(true),
  hLang:b => { setLang(b.dataset.l); renderHome(); }, hTheme:() => { lsSet(LS_THEME, theme() === 'dark' ? 'light' : 'dark'); renderHome(); },
});

/* ---------- Démarrage : l'atelier se prépare en coulisse, on arrive sur l'accueil ---------- */
(function boot(){
  if(!bootEditor()) return;
  migrateLib();
  // un lien direct vers un storyboard (#b=…) l'ouvre ; sinon l'accueil
  const m = /#b=([\w-]+)/.exec(location.hash), id = m && libGet().some(x => x.id === m[1]) ? m[1] : null;
  if(id) openBoard(id); else showHome();
})();
