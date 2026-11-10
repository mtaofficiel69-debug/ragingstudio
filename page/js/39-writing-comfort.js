/* =====================================================================
   v-ÉCRITURE — trois petites gênes à l'écriture, signalées par une utilisatrice
   ---------------------------------------------------------------------
   1. TROIS POINTS. Taper « ... » donne maintenant le vrai caractère « … »
      (points de suspension), comme dans Word ou Final Draft. Effacer juste
      après (Retour arrière) rend les trois points d'origine, pour qui les
      préfère.
   2. PAGES BLANCHES EN FIN D'EXPORT. Des lignes vides en fin de scénario
      créaient des feuilles vierges que le PDF et l'impression recopiaient.
      Les feuilles vides de la fin sont désormais coupées (sauf si une image
      y est posée).
   3. GARDER SA PLACE. En revenant dans l'écriture (après le storyboard ou
      un autre onglet) ou en rouvrant le scénario, la page revient exactement
      là où on était, avec le curseur dans la même ligne, au lieu de remonter
      à la première page.
===================================================================== */

/* ---------- 1. « ... » → « … » ---------- */
let rpEllJust = null;   // { node, at } : le « … » qu'on vient de poser (pour Retour arrière)
function rpAutoEllipsis(e){
  if(!e || e.inputType !== 'insertText' || e.data !== '.') return;
  const sel = window.getSelection();
  if(!sel || !sel.rangeCount || !sel.isCollapsed) return;
  const node = sel.anchorNode, off = sel.anchorOffset;
  if(!node || node.nodeType !== 3 || off < 3) return;
  const s = node.data;
  if(s.slice(off - 3, off) !== '...') return;
  if(off >= 4 && s[off - 4] === '.') return;   // « .... » tapé exprès : on ne touche à rien
  node.data = s.slice(0, off - 3) + '…' + s.slice(off);
  const r = document.createRange(); r.setStart(node, off - 2); r.collapse(true);
  sel.removeAllRanges(); sel.addRange(r);
  rpEllJust = { node, at: off - 2 };
}
const rpLineInputBase = onLineInput;
onLineInput = function(e){
  try{ rpAutoEllipsis(e); }catch(err){}
  return rpLineInputBase.call(this, e);
};
/* Retour arrière juste après la conversion : on rend « ... ». */
document.addEventListener('keydown', e=>{
  const j = rpEllJust;
  if(e.key !== 'Backspace'){ if(e.key && e.key.length === 1 || e.key === 'Enter' || e.key === 'Delete') rpEllJust = null; return; }
  if(!j) return;
  rpEllJust = null;
  const sel = window.getSelection();
  if(!sel || !sel.isCollapsed || sel.anchorNode !== j.node || sel.anchorOffset !== j.at) return;
  const s = j.node.data;
  if(s[j.at - 1] !== '…') return;
  const div = j.node.parentElement && j.node.parentElement.closest('#page .line');
  if(!div) return;
  e.preventDefault();
  j.node.data = s.slice(0, j.at - 1) + '...' + s.slice(j.at);
  const r = document.createRange(); r.setStart(j.node, j.at + 2); r.collapse(true);
  sel.removeAllRanges(); sel.addRange(r);
  rpLineInputBase({ target: div, inputType: 'insertText', data: null });
}, true);
document.addEventListener('mousedown', ()=>{ rpEllJust = null; }, true);

/* ---------- 2. Pas de feuilles vierges à la fin du PDF / de l'impression ---------- */
function rpTrimBlankTail(res, p){
  const pages = res && res.pages;
  if(!pages || pages.length < 2) return res;
  let imgLast = -1;
  try{ pgiList(p).forEach(m => { imgLast = Math.max(imgLast, pgiPageOf(m, pages.length)); }); }catch(e){}
  while(pages.length > 1){
    const k = pages.length - 1;
    if(k <= imgLast) break;                                  // une image est posée sur cette feuille
    if(res.spill && res.spill[k]) break;                     // un bloc géant la traverse
    if(pages[k].some(d => (d.textContent || '').trim())) break;
    pages.pop();
  }
  res.pageCount = pages.length;
  return res;
}
const rpMeasureExportBase = measureExportPages;
measureExportPages = function(p){ return rpTrimBlankTail(rpMeasureExportBase(p), p); };

/* ---------- 3. Revenir là où on écrivait ---------- */
const RP_POS_KEY = id => 'scriptmm_editpos_' + id;
const rpPosMem = {};
let rpPosRestoring = false, rpPosSaveT = null;
function rpPosGet(id){
  if(!id) return null;
  if(rpPosMem[id]) return rpPosMem[id];
  try{ const v = JSON.parse(localStorage.getItem(RP_POS_KEY(id)) || 'null'); if(v) rpPosMem[id] = v; return v; }catch(e){ return null; }
}
function rpPosPut(id, v){
  rpPosMem[id] = v;
  try{ localStorage.setItem(RP_POS_KEY(id), JSON.stringify(v)); }catch(e){}
}
function rpEditorReady(){
  return S.view === 'editor' && S.tab === 'editor' && S.project && document.getElementById('page') && document.getElementById('centerPane');
}
/* Première ligne visible en haut de la zone d'écriture (recherche dichotomique : les lignes se suivent de haut en bas). */
function rpTopLine(cp){
  const lines = document.querySelectorAll('#page .line[data-id]');
  if(!lines.length) return null;
  const top = cp.getBoundingClientRect().top;
  let lo = 0, hi = lines.length - 1;
  while(lo < hi){
    const mid = (lo + hi) >> 1;
    if(lines[mid].getBoundingClientRect().bottom <= top) lo = mid + 1; else hi = mid;
  }
  return { div: lines[lo], off: lines[lo].getBoundingClientRect().top - top };
}
function rpCaretInfo(){
  const sel = window.getSelection();
  if(!sel || !sel.rangeCount) return null;
  const n = sel.focusNode;
  const div = n && (n.nodeType === 1 ? n : n.parentElement);
  const line = div && div.closest && div.closest('#page .line[data-id]');
  if(!line) return null;
  try{
    const r = document.createRange(); r.selectNodeContents(line); r.setEnd(n, sel.focusOffset);
    return { id: line.dataset.id, o: r.toString().length };
  }catch(e){ return null; }
}
function rpPosSave(){
  if(rpPosRestoring || !rpEditorReady()) return;
  const cp = document.getElementById('centerPane');
  const t = rpTopLine(cp); if(!t) return;
  const prev = rpPosGet(S.project.id) || {};
  const caret = rpCaretInfo() || prev.caret || null;
  rpPosPut(S.project.id, { id: t.div.dataset.id, off: Math.round(t.off), caret });
}
function rpPosSaveSoon(){ clearTimeout(rpPosSaveT); rpPosSaveT = setTimeout(rpPosSave, 200); }
function rpPlaceCaret(line, o){
  const w = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
  let n, left = o, last = null;
  while((n = w.nextNode())){ last = n; if(left <= n.data.length) break; left -= n.data.length; }
  const r = document.createRange();
  if(n) r.setStart(n, Math.max(0, left));
  else if(last) r.setStart(last, last.data.length);
  else r.setStart(line, 0);
  r.collapse(true);
  try{ line.focus({ preventScroll: true }); }catch(e){ line.focus(); }
  const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
}
function rpPosRestore(withCaret){
  if(!rpEditorReady()) return false;
  const pos = rpPosGet(S.project.id); if(!pos) return false;
  const cp = document.getElementById('centerPane');
  const d = document.querySelector('#page .line[data-id="' + (window.CSS && CSS.escape ? CSS.escape(pos.id) : pos.id) + '"]');
  if(d) cp.scrollTop += d.getBoundingClientRect().top - cp.getBoundingClientRect().top - (pos.off || 0);
  if(withCaret && pos.caret){
    const ln = document.querySelector('#page .line[data-id="' + (window.CSS && CSS.escape ? CSS.escape(pos.caret.id) : pos.caret.id) + '"]');
    if(ln){
      // Le curseur n'est remis que s'il tombe dans la zone visible : jamais de saut de la page pour lui.
      const r = ln.getBoundingClientRect(), c = cp.getBoundingClientRect();
      if(r.bottom > c.top && r.top < c.bottom){ try{ rpPlaceCaret(ln, pos.caret.o || 0); }catch(e){} }
    }
  }
  return !!d;
}
const rpRenderEditorBase = renderEditorTab;
renderEditorTab = function(){
  rpPosRestoring = true;
  const out = rpRenderEditorBase.apply(this, arguments);
  const pid = S.project && S.project.id;
  const cp = document.getElementById('centerPane');
  if(cp && !cp.dataset.rpPos){ cp.dataset.rpPos = '1'; cp.addEventListener('scroll', rpPosSaveSoon, { passive: true }); }
  // La première pagination est faite dans l'image suivante (voir renderEditorTab) : on se replace juste après.
  requestAnimationFrame(()=>{
    if(!S.project || S.project.id !== pid){ rpPosRestoring = false; return; }
    rpPosRestore(true);
    const at = cp ? cp.scrollTop : 0;
    // Police encore en chargement : la page sera repaginée, on se recale une fois de plus si l'on n'a pas bougé.
    if(document.fonts && document.fonts.status !== 'loaded' && document.fonts.ready){
      document.fonts.ready.then(()=> requestAnimationFrame(()=>{
        if(S.project && S.project.id === pid && cp && Math.abs(cp.scrollTop - at) < 2) rpPosRestore(false);
        rpPosRestoring = false;
      }));
    } else requestAnimationFrame(()=>{ rpPosRestoring = false; });
  });
  return out;
};
document.addEventListener('selectionchange', ()=>{ if(!rpPosRestoring && rpEditorReady() && rpCaretInfo()) rpPosSaveSoon(); });
/* Avant de quitter l'écriture (autre onglet, accueil, fermeture), la position du moment est notée. */
const rpSwitchTabBase = switchTab;
switchTab = function(){ if(S.tab === 'editor'){ clearTimeout(rpPosSaveT); rpPosSave(); } return rpSwitchTabBase.apply(this, arguments); };
const rpGoHomeBase = goHome;
goHome = function(){ if(S.tab === 'editor'){ clearTimeout(rpPosSaveT); rpPosSave(); } return rpGoHomeBase.apply(this, arguments); };
window.addEventListener('pagehide', ()=>{ if(S.tab === 'editor'){ clearTimeout(rpPosSaveT); rpPosSave(); } });
