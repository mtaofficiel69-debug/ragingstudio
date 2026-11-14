/* =====================================================================
   RAGING BOARD — UNE IMAGE NETTE, UN VRAI PLEIN ÉCRAN
   ---------------------------------------------------------------------
   1. L'image 3D toujours nette : le canevas a exactement la taille où il
      s'affiche, et il est posé pile sur les pixels de l'écran (un décalage
      d'une fraction de pixel suffisait à rendre toute l'image floue).
   2. Le plein écran (P) devient un mode cinéma : l'image en grand sur fond
      noir, les commandes flottent par-dessus et s'effacent quand on ne bouge
      plus la souris ; H ressort les outils ; Échap pour sortir.
===================================================================== */

/* ---------- 1. Une image nette ---------- */
const cineFitBase = fitStage;
fitStage = function(){
  cineFitBase.apply(this, arguments);
  const st = document.getElementById('stage'); if(!st || !R.canvas || S.rec) return;
  const w = parseFloat(st.style.width), h = parseFloat(st.style.height); if(!w || !h) return;
  const k = sharpK(), cw = Math.round(w * k), ch = Math.round(h * k);
  if(R.canvas.width !== cw || R.canvas.height !== ch){ R.canvas.width = cw; R.canvas.height = ch; R.baseW = cw; R.baseH = ch; requestRender(); }
  cineSnap();
};
/* la netteté : l'image est calculée plus finement que l'écran puis réduite (un vrai anticrénelage : des bords nets,
   plus d'escaliers ni d'image molle). Le choix est fait une fois pour toutes selon la carte graphique (jamais de bascule
   floue / nette en bougeant), et on peut le forcer dans « Rendu ». */
function sharpK(){
  const dpr = window.devicePixelRatio || 1, pref = lsGet('raging3d_sharp') || 'auto';
  // toujours un nombre entier de pixels calculés par pixel d'écran : réduite d'un facteur entier, l'image reste nette
  if(pref === 'std') return Math.max(1, Math.round(dpr));
  if(pref === 'max') return Math.max(2, Math.round(dpr * 1.5));
  if(R.sharpAuto == null) return Math.max(1, Math.round(dpr));             // avant la première mesure
  return R.sharpAuto;
}
// la première mesure de la carte graphique décide de la finesse (une seule fois)
const cineBenchBase = benchmark;
benchmark = function(){
  cineBenchBase.apply(this, arguments);
  if(R.sharpAuto == null && R.bench){ const dpr = window.devicePixelRatio || 1, b = R.bench;
    R.sharpAuto = b < 70 ? 2 : Math.max(1, Math.round(dpr)); fitStage(); }
};
// le choix, dans « Rendu et format »
const cineLookBase = PANEL_HTML.look;
PANEL_HTML.look = function(){
  const h = cineLookBase.call(this), pref = lsGet('raging3d_sharp') || 'auto';
  const sec = `<div class="fly-lbl">${L('Netteté de l’image', 'Image sharpness')}</div><div class="seg wide">${[['auto', L('Auto', 'Auto')], ['std', L('Légère', 'Light')], ['max', L('Maximale', 'Maximum')]].map(([k, t]) => `<button class="${pref === k ? 'on' : ''}" data-act="sharp" data-v="${k}">${esc(t)}</button>`).join('')}</div><p class="mm-p">${L('« Maximale » donne les bords les plus nets ; « Légère » si l’ordinateur rame.', '“Maximum” gives the crispest edges; “Light” if the computer struggles.')}</p>`;
  const i = h.lastIndexOf('</div>'); return i > 0 ? h.slice(0, i) + sec + h.slice(i) : h + sec;
};
ACT.sharp = b => { lsSet('raging3d_sharp', b.dataset.v); fitStage(); renderPanel(); toast(L('Netteté : ', 'Sharpness: ') + b.textContent); };
// posé pile sur les pixels de l'écran
function cineSnap(){
  const st = document.getElementById('stage'); if(!st) return;
  st.style.translate = '';
  const r = st.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  const fx = Math.round(r.left * dpr) / dpr - r.left, fy = Math.round(r.top * dpr) / dpr - r.top;
  if(Math.abs(fx) > 0.001 || Math.abs(fy) > 0.001) st.style.translate = `${fx.toFixed(3)}px ${fy.toFixed(3)}px`;
}
window.addEventListener('resize', () => setTimeout(cineSnap, 60));

/* ---------- 2. Le mode cinéma ---------- */
const cineAfterBase = afterFull;
afterFull = function(){
  const was = document.body.classList.contains('imm');
  cineAfterBase.apply(this, arguments);
  const b = document.body;
  // en entrant : l'image seule (les outils reviennent avec H)
  if(b.classList.contains('imm') && !was){ b.classList.add('imm-clean'); renderHead(); setTimeout(fitStage, 40); }
  cineWake();
};
// on ne remplace pas l'écouteur d'origine : on écoute aussi le changement de plein écran pour appliquer notre version
document.addEventListener('fullscreenchange', () => { const b = document.body; if(b.classList.contains('imm') && !b.dataset.cineIn){ b.dataset.cineIn = '1'; b.classList.add('imm-clean'); renderHead(); setTimeout(fitStage, 40); } if(!b.classList.contains('imm')) delete b.dataset.cineIn; cineWake(); });
let cineT = 0;
function cineWake(){
  const b = document.body; b.classList.remove('imm-idle'); clearTimeout(cineT);
  if(!b.classList.contains('imm')) return;
  cineT = setTimeout(() => { if(document.body.classList.contains('imm') && !document.querySelector('.shot-head:hover, .under:hover, .rn-pop') && !DRAG.mode) document.body.classList.add('imm-idle'); }, 2600);
}
['pointermove', 'pointerdown', 'keydown', 'wheel'].forEach(t => document.addEventListener(t, () => { if(document.body.classList.contains('imm')) cineWake(); }, { passive:true }));
// la tête de l'image, en plein écran : un vrai bouton pour sortir, et les outils en un bouton nommé
const cineHeadBase = renderHead;
renderHead = function(){
  cineHeadBase.apply(this, arguments);
  const el = document.getElementById('shotHead'); if(!el || !isFull()) return;
  const r = el.querySelector('.sh-r'); if(!r) return;
  const clean = document.body.classList.contains('imm-clean');
  r.querySelectorAll('[data-act="immTools"], [data-act="full"]').forEach(b => b.remove());
  r.insertAdjacentHTML('beforeend', `<span class="tb-div"></span><button class="cine-btn ${clean ? '' : 'on'}" data-act="immTools" title="${esc(L('Afficher ou masquer les outils (H)', 'Show or hide the tools (H)'))}">${icon('board')}<span>${L('Outils', 'Tools')}</span><kbd>H</kbd></button>
    <button class="cine-btn cine-exit" data-act="full" title="${esc(L('Quitter le plein écran (Échap ou P)', 'Exit full screen (Esc or P)'))}">${icon('unfull')}<span>${L('Quitter', 'Exit')}</span><kbd>Échap</kbd></button>`);
};
