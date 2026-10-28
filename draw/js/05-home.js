/* =====================================================================
   RAGING DRAW — ACCUEIL
   Même mise en page que l'accueil de Raging Page : barre du haut,
   colonne d'actions à gauche, « Mes affiches » à droite.
===================================================================== */
const HOME_TIPS = [
  ['Clic droit maintenu + glisser : tu te déplaces sur l’affiche. Un clic droit simple ouvre le menu.', 'Hold right-click and drag to move around the poster. A simple right-click opens the menu.'],
  ['Double-clique sur une image pour la recadrer : glisse la photo, tire les coins.', 'Double-click an image to crop it: drag the photo, pull the corners.'],
  ['Glisse une photo sur un cadre photo : elle le remplit sans se déformer.', 'Drop a photo on a photo frame: it fills it without stretching.'],
  ['Alt + glisser un élément : il est dupliqué en même temps.', 'Alt + drag an element: it’s duplicated at the same time.'],
  ['La gomme n’abîme rien : « Restaurer » récupère tout.', 'The eraser never destroys: “Restore” brings everything back.'],
  ['Exporter › PDF 300 dpi : prêt pour l’imprimeur, à la taille réelle.', 'Export › PDF 300 dpi: printer-ready, at actual size.'],
  ['Fond et ambiance : du grain de pellicule et un vignettage, en un geste.', 'Background & mood: film grain and a vignette, in one move.'],
  ['Maj en redimensionnant : libère ou garde les proportions.', 'Shift while resizing: frees or keeps proportions.'],
  ['Ctrl+V colle une image copiée depuis n’importe où.', 'Ctrl+V pastes an image copied from anywhere.'],
  ['Un stylet ? La pression fait varier l’épaisseur du pinceau.', 'Got a stylus? Pressure changes the brush thickness.'],
  ['Double-clique sur un texte pour l’écrire directement sur l’affiche.', 'Double-click a text to type right on the poster.'],
  ['Le mode « Fusion » d’une image change tout : essaie « Superposition claire ».', 'An image’s “Blending” changes everything: try “Screen”.']
];
let homeTipK = null;
function homeTipHtml(){
  if(homeTipK === null){ const d = new Date(); homeTipK = (d.getFullYear()*372 + d.getMonth()*31 + d.getDate()) % HOME_TIPS.length; }
  const t = HOME_TIPS[homeTipK];
  return `<button class="btn wd-nav wd-tip" data-act="nextTip" title="${L('Astuce suivante','Next tip')}">${icon('bulb')}<small><span class="tip-k">${L('Astuce','Tip')}</span>${L(t[0], t[1])}</small></button>`;
}
function renderHome(){
  const list = S.index.slice().sort((a, b) => b.updatedAt - a.updatedAt);
  const nb = list.length;
  const cards = list.map(m => `
    <div class="pcard" data-act="openPoster" data-id="${m.id}" tabindex="0">
      <div class="pc-th"><span style="aspect-ratio:${m.w}/${m.h};${m.thumb ? `background-image:url(${m.thumb})` : ''}"></span></div>
      <div class="pc-meta"><b title="${esc(m.title)}">${esc(m.title || L('Sans titre','Untitled'))}</b><small>${esc(formatLabel(m))} · ${timeAgo(m.updatedAt)}</small></div>
      <div class="pc-acts">
        <button class="ib" data-act="renamePoster" data-id="${m.id}" data-stop="1" title="${L('Renommer','Rename')}">${icon('pen')}</button>
        <button class="ib" data-act="duplicatePoster" data-id="${m.id}" data-stop="1" title="${L('Dupliquer','Duplicate')}">${icon('copy')}</button>
        <button class="ib danger" data-act="deletePoster" data-id="${m.id}" data-stop="1" title="${L('Supprimer','Delete')}">${icon('trash')}</button>
      </div>
    </div>`).join('');
  const main = nb ? `<div class="pgrid-scroll"><div class="pgrid">${cards}</div></div>`
    : `<div class="wd-empty"><span class="wd-poster"><i></i><i></i><i></i></span>
        <p>${L('Aucune affiche pour l’instant. Crée la première : tu choisis un format, un modèle si tu veux, et tu dessines dès l’écran suivant.','No poster yet. Create the first one: pick a size, a template if you like, and start drawing on the very next screen.')}</p>
        <button class="btn btn-primary" data-act="openCreate">${icon('plus')} ${L('Nouvelle affiche','New poster')}</button>
        <button class="btn" data-act="openSample" style="margin-top:8px;">${icon('poster')} ${L('Voir l’affiche d’exemple','See the example poster')}</button>
      </div>`;
  const last = list[0];
  return `
  <div id="homeView">
    <header class="wd-top">
      <div class="wd-brand">${rdLogo(40,'wd-logo',true)}${rdWordmark()}</div>
      <div class="wd-top-r">${appLinksHtml()}${langFlagsHtml()}${themeToggleBtnHtml('btn-ghost btn-sm')}</div>
    </header>
    <div class="wd-body">
      <aside class="wd-side">
        <button class="btn btn-primary wd-new" data-act="openCreate">${icon('plus')} ${L('Nouvelle affiche','New poster')}</button>
        <div class="wd-navs">
          <button class="btn wd-nav" data-act="homeImportImage">${icon('image')}<span>${L('Partir d’une photo','Start from a photo')}<small>JPG, PNG, WebP, SVG…</small></span></button>
          <button class="btn wd-nav" data-act="homeOpenProject">${icon('folder')}<span>${L('Ouvrir un projet','Open a project')}<small>.rdraw</small></span></button>
          <button class="btn wd-nav wd-nav-sample" data-act="openSample">${icon('poster')}<span>${L('Affiche d’exemple','Example poster')}</span></button>
          <button class="btn wd-nav" data-act="openHelp">${icon('read')}<span>${L('Comment faire','How it works')}</span></button>
        <a class="btn wd-nav wd-sup" href="https://ko-fi.com/ragingstudio" target="_blank" rel="noopener" title="${L('Raging Studio est gratuit. S\u2019il t\u2019aide, tu peux le soutenir sur Ko-fi.','Raging Studio is free. If it helps you, you can support it on Ko-fi.')}"><svg class="icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 13.6S1.8 9.9 1.8 5.7A3.1 3.1 0 0 1 8 4.6a3.1 3.1 0 0 1 6.2 1.1C14.2 9.9 8 13.6 8 13.6z"/></svg><span>${L('Soutenir Raging Studio','Support Raging Studio')}<small>${L('Un don sur Ko-fi','A donation on Ko-fi')}</small></span></a>
        <a class="btn wd-nav wd-dsc" href="https://discord.gg/j5GXQPg6hb" target="_blank" rel="noopener"><svg class="icon" viewBox="0 0 127.14 96.36" aria-hidden="true"><path d="M107.7 8.07A105.15 105.15 0 0 0 81.47 0a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.11 0A72.37 72.37 0 0 0 45.64 0a105.89 105.89 0 0 0-26.25 8.09C2.79 32.65-1.71 56.6.54 80.21a105.73 105.73 0 0 0 32.17 16.15 77.7 77.7 0 0 0 6.89-11.11 68.42 68.42 0 0 1-10.85-5.18c.91-.66 1.8-1.34 2.66-2a75.57 75.57 0 0 0 64.32 0c.87.71 1.76 1.39 2.66 2a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.1 105.25 105.25 0 0 0 32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.15zM42.45 65.69C36.18 65.69 31 60 31 53s5-12.74 11.43-12.74S54 46 53.89 53s-5.05 12.69-11.44 12.69zm42.24 0C78.41 65.69 73.25 60 73.25 53s5-12.74 11.44-12.74S96.23 46 96.12 53s-5.04 12.69-11.43 12.69z"/></svg><span>${L('La communaut\u00e9 Discord','The Discord community')}<small>${L('Undergrounders \u00b7 100 % francophone','Undergrounders \u00b7 French only')}</small></span></a>
        </div>
        ${homeTipHtml()}
        <div class="wd-about">
          <b>${rdWordmark()}</b>
          <p class="wd-tag">${L('Tes affiches de films, de A à Z, gratuitement.','Your film posters, from A to Z, for free.')}</p>
        </div>
      </aside>
      <main class="wd-main">
        <div class="wd-main-h"><h1>${L('Mes affiches','My posters')}</h1>${nb ? `<span class="wd-count">${nb}</span>` : ''}${last ? `<button type="button" class="wd-resume" data-act="openPoster" data-id="${esc(last.id)}" title="${L('Rouvrir la dernière affiche modifiée','Reopen the last poster you edited')}"><span class="wd-resume-l">${L('Reprendre','Resume')}</span><span class="wd-resume-t">${esc(last.title || L('Sans titre','Untitled'))}</span>${icon('chevR')}</button>` : ''}</div>
        <div class="wd-table">${main}
          <div class="wd-slug" aria-hidden="true"><span class="wd-slug-n">1</span><span class="wd-slug-t"></span><span class="wd-slug-c"></span><span class="wd-slug-n wd-slug-r">1</span></div>
        </div>
      </main>
    </div>
  </div>`;
}
/* bandeau « entête de scène » tapé à la machine, le même qu'à l'accueil de Raging Page */
let __reelT = 0;
function homeReel(){
  clearTimeout(__reelT);
  const box = document.querySelector('#homeView .wd-slug'); if(!box) return;
  const lines = getLang() === 'en'
    ? ['INT. POSTER STUDIO - NIGHT', 'EXT. CINEMA FRONT - DUSK', 'INT. PRINT SHOP - DAY', 'EXT. FESTIVAL STEPS - NIGHT', 'INT. YOUR NEXT POSTER - CONTINUOUS']
    : ['INT. ATELIER D\u2019AFFICHES - NUIT', 'EXT. DEVANTURE DU CINÉMA - CRÉPUSCULE', 'INT. IMPRIMERIE - JOUR', 'EXT. MARCHES DU FESTIVAL - NUIT', 'INT. TA PROCHAINE AFFICHE - CONTINU'];
  const t = box.querySelector('.wd-slug-t'), ns = box.querySelectorAll('.wd-slug-n');
  let k = 0, i = 0, del = false;
  const setN = () => ns.forEach(n => { n.textContent = String(k + 1); });
  if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){ t.textContent = lines[0]; setN(); return; }
  const step = () => {
    if(!box.isConnected) return;
    if(document.hidden){ __reelT = setTimeout(step, 800); return; }
    const L0 = lines[k];
    if(!del){
      i++; t.textContent = L0.slice(0, i);
      if(i >= L0.length){ del = true; __reelT = setTimeout(step, 2600); return; }
      __reelT = setTimeout(step, 55 + Math.random() * 70);
    } else {
      i--; t.textContent = L0.slice(0, i);
      if(i <= 0){ del = false; k = (k + 1) % lines.length; setN(); __reelT = setTimeout(step, 500); return; }
      __reelT = setTimeout(step, 22);
    }
  };
  setN(); __reelT = setTimeout(step, 700);
}
function attachHomeEvents(){
  const hv = document.getElementById('homeView');
  hv.addEventListener('dragover', e => { if(hasFiles(e)){ e.preventDefault(); hv.classList.add('dropping'); } });
  hv.addEventListener('dragleave', e => { if(e.target === hv) hv.classList.remove('dropping'); });
  hv.addEventListener('drop', e => {
    hv.classList.remove('dropping');
    if(!hasFiles(e)) return;
    e.preventDefault();
    const f = e.dataTransfer.files[0]; if(!f) return;
    if(/\.rdraw$|\.json$/i.test(f.name)) openProjectFile(f);
    else if(/^image\//.test(f.type) || /\.svg$/i.test(f.name)) startFromPhoto(f);
  });
  homeReel();
}
async function refreshIndex(){
  try{ S.index = await Store.listMeta(); }catch(e){ S.index = []; }
}

/* ---------- Actions de l'accueil ---------- */
async function openPoster(id){
  let doc = null;
  try{ doc = await Store.getDoc(id); }catch(e){}
  if(!doc){ rdAlert(L('Affiche introuvable','Poster not found'), L('Elle a peut-être été supprimée de ce navigateur.','It may have been removed from this browser.')); await refreshIndex(); render(); return; }
  doc.fx = Object.assign({grain:0, vignette:0, vignetteColor:'#000000'}, doc.fx || {});
  doc.assets = doc.assets || {};
  openDoc(doc);
}
async function renamePoster(id){
  const m = S.index.find(x => x.id === id); if(!m) return;
  const v = await rdPrompt(L('Renommer l’affiche','Rename poster'), m.title);
  if(v == null || !v.trim()) return;
  const doc = await Store.getDoc(id); if(!doc) return;
  doc.title = v.trim(); m.title = doc.title; m.updatedAt = doc.updatedAt = Date.now();
  await Store.putDoc(doc, m); await refreshIndex(); render();
}
async function duplicatePoster(id){
  const doc = await Store.getDoc(id); const m = S.index.find(x => x.id === id);
  if(!doc || !m) return;
  const c = deepClone(doc); c.id = uid('p'); c.title = doc.title + L(' (copie)',' (copy)'); c.createdAt = c.updatedAt = Date.now();
  await Store.putDoc(c, Object.assign({}, m, {id:c.id, title:c.title, createdAt:c.createdAt, updatedAt:c.updatedAt}));
  await refreshIndex(); render();
  toast(L('Affiche dupliquée','Poster duplicated'));
}
async function deletePoster(id){
  const m = S.index.find(x => x.id === id); if(!m) return;
  const ok = await rdConfirm(L('Supprimer « ','Delete “') + (m.title || L('Sans titre','Untitled')) + L(' » ?','”?'), L('L’affiche sera effacée de ce navigateur. Exporte-la en .rdraw d’abord si tu veux la garder.','The poster will be erased from this browser. Export it as .rdraw first if you want to keep it.'), L('Supprimer','Delete'), true);
  if(!ok) return;
  await Store.remove(id); await refreshIndex(); render();
}
function homeImportImage(){
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*,.svg';
  inp.onchange = () => { if(inp.files[0]) startFromPhoto(inp.files[0]); };
  inp.click();
}
function homeOpenProject(){
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.rdraw,.json,application/json';
  inp.onchange = () => { if(inp.files[0]) openProjectFile(inp.files[0]); };
  inp.click();
}
async function startFromPhoto(file){
  const fmt = formatById('onesheet');
  const doc = newDoc(file.name.replace(/\.[^.]+$/, '').slice(0, 60) || L('Nouvelle affiche','New poster'), fmt, 'blank');
  S.doc = doc;
  const src = await readFileAsDataURL(file).catch(() => null);
  if(!src) return;
  const im = await loadImageMeta(src).catch(() => null);
  if(!im){ toast(L('Ce fichier n’est pas une image lisible.','This file isn’t a readable image.'), 'warn'); return; }
  const id = uid('a'); doc.assets[id] = src; IMG[id] = im;
  const o = mkImage(id, doc.w/2, doc.h/2, doc.w, doc.h, im.naturalWidth, im.naturalHeight);
  fillFrameWith(o, id, im.naturalWidth, im.naturalHeight);
  doc.objects.push(o);
  await saveDoc();
  openDoc(doc);
  S.flyout = 'text'; renderFlyout();
}

/* ---------- Création ---------- */
const CR = {fmt:'onesheet', tpl:'taxi', title:''};
function openCreate(){
  CR.title = '';
  const body = `
    <div class="field"><label>${L('Titre de l’affiche','Poster title')}</label><input type="text" id="crTitle" placeholder="${L('Mon film','My film')}" spellcheck="false"></div>
    <div class="field"><label>${L('Format','Size')}</label><div class="fmt-grid sm">${FORMATS.map(f => `<button class="fmt-card ${CR.fmt===f.id?'active':''}" data-act="crFmt" data-id="${f.id}"><span class="fc-r"><i style="aspect-ratio:${f.w}/${f.h}"></i></span><b>${L(f.fr, f.en)}</b><small>${f.d}</small></button>`).join('')}</div></div>
    <div class="field"><label>${L('Point de départ','Starting point')}</label><div class="tgrid cr" id="crTpl"></div></div>`;
  modalShell('createBackdrop', L('Nouvelle affiche','New poster'), L('Tout reste modifiable ensuite : le format, le modèle, chaque élément.','Everything stays editable afterwards: the size, the template, every element.'), body,
    `<button class="btn btn-ghost" data-act="closeModal">${L('Annuler','Cancel')}</button><button class="btn btn-primary" data-act="doCreate">${icon('plus')} ${L('Créer l’affiche','Create poster')}</button>`, true);
  const t = document.getElementById('crTitle');
  t.addEventListener('keydown', e => { if(e.key === 'Enter') doCreate(); });
  setTimeout(() => t.focus(), 30);
  renderCreateTemplates();
}
function renderCreateTemplates(){
  const el = document.getElementById('crTpl'); if(!el) return;
  const f = formatById(CR.fmt);
  el.innerHTML = TEMPLATES.map(t => `<button class="tcard ${CR.tpl===t.id?'active':''}" data-act="crTpl" data-id="${t.id}"><span class="tthumb" data-ctpl="${t.id}" style="aspect-ratio:${f.w}/${f.h}"></span><span>${L(t.fr, t.en)}</span></button>`).join('');
  el.querySelectorAll('[data-ctpl]').forEach(sp => {
    const id = sp.dataset.ctpl, key = id + '|' + f.w + 'x' + f.h + '|' + getLang();
    if(_tplCache[key]){ sp.style.backgroundImage = 'url(' + _tplCache[key] + ')'; return; }
    const tmp = newDoc('', f, id);
    loadDocFonts(tmp).then(() => { try{ const u = renderThumb(tmp, 200, 280).toDataURL('image/jpeg', .85); _tplCache[key] = u; sp.style.backgroundImage = 'url(' + u + ')'; }catch(e){} });
  });
}
async function doCreate(){
  const t = document.getElementById('crTitle');
  const title = (t && t.value.trim()) || L('Nouvelle affiche','New poster');
  const doc = newDoc(title, formatById(CR.fmt), CR.tpl);
  closeModal();
  S.doc = doc;
  await saveDoc();
  openDoc(doc);
  if(doc.objects.some(o => o.type === 'image' && !o.asset)) S.flyout = 'images';
  renderFlyout();
}

/* ---------- Affiche d'exemple : une image de démonstration dessinée sur place ---------- */
function sampleArt(w, h){
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), r = _rng(99);
  let sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#06121C'); sky.addColorStop(.55, '#14425E'); sky.addColorStop(.78, '#3699D4'); sky.addColorStop(1, '#B7D4EC');
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  for(let i = 0; i < 260; i++){ g.fillStyle = 'rgba(255,255,255,' + (0.2 + r()*0.8) + ')'; g.beginPath(); g.arc(r()*w, r()*h*.55, r()*1.6 + .3, 0, Math.PI*2); g.fill(); }
  const mg = g.createRadialGradient(w*.68, h*.26, 0, w*.68, h*.26, w*.3);
  mg.addColorStop(0, 'rgba(252,253,254,.95)'); mg.addColorStop(.18, 'rgba(252,253,254,.9)'); mg.addColorStop(.2, 'rgba(183,212,236,.35)'); mg.addColorStop(1, 'rgba(183,212,236,0)');
  g.fillStyle = mg; g.fillRect(0, 0, w, h);
  const city = (base, hmin, hmax, col, wmin, wmax) => {
    g.fillStyle = col; let x = -10;
    while(x < w){ const bw = wmin + r()*(wmax - wmin), bh = hmin + r()*(hmax - hmin); g.fillRect(x, base - bh, bw, bh + h); if(r() > .6) g.fillRect(x + bw*.4, base - bh - bh*.18, bw*.15, bh*.2); x += bw - 2; }
  };
  city(h*.78, h*.08, h*.3, '#0E2A3D', w*.04, w*.11);
  city(h*.86, h*.06, h*.22, '#081A27', w*.05, w*.13);
  // fenêtres
  for(let i = 0; i < 380; i++){ g.fillStyle = r() > .5 ? 'rgba(242,201,76,.75)' : 'rgba(93,182,236,.6)'; g.fillRect(r()*w, h*.6 + r()*h*.35, 3, 4); }
  // silhouette
  g.fillStyle = '#030810';
  const sx = w*.42, sy = h*.92;
  g.beginPath(); g.ellipse(sx, sy - h*.27, w*.035, w*.042, 0, 0, Math.PI*2); g.fill();
  g.beginPath(); g.moveTo(sx - w*.085, sy + h*.1); g.quadraticCurveTo(sx - w*.09, sy - h*.2, sx, sy - h*.225); g.quadraticCurveTo(sx + w*.09, sy - h*.2, sx + w*.085, sy + h*.1); g.fill();
  g.fillRect(0, h*.92, w, h*.1);
  return c.toDataURL('image/jpeg', .92);
}
async function openSample(){
  const fmt = formatById('onesheet');
  const doc = newDoc(L('Exemple · Taxi Drawer','Example · Taxi Drawer'), fmt, 'taxi');
  const ph = doc.objects.find(o => o.type === 'image');
  const src = sampleArt(1620, 1360);
  const im = await loadImageMeta(src);
  const id = uid('a'); doc.assets[id] = src; IMG[id] = im;
  if(ph){ fillFrameWith(ph, id, im.naturalWidth, im.naturalHeight); ph.name = L('Photo d’exemple','Example photo'); }
  S.doc = doc;
  await saveDoc();
  openDoc(doc);
  S.flyout = null; renderFlyout();
  toast(L('Clique sur n’importe quel élément pour le modifier.','Click any element to change it.'));
}
