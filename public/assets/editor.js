'use strict';
/* Craft editors remain independent. Never enable ?host=parent without real save handling. */
(() => {
  const apps = Object.freeze({
    deckcraft:['DeckCraft','D','#ff944e','Presentasi dan slide visual'],
    wordcraft:['WordCraft','W','#4689ff','Dokumen, proposal, dan laporan'],
    pdfcraft:['PdfCraft','P','#ff6876','PDF dan anotasi'],
    gridcraft:['GridCraft','G','#34d79b','Spreadsheet dan data'],
    photocraft:['PhotoCraft','P','#b780ff','Foto dan penyuntingan gambar'],
    filmcraft:['FilmCraft','F','#8688ff','Video dan timeline'],
    vectorcraft:['VectorCraft','V','#ffd166','Ilustrasi dan desain vektor']
  });
  const m = location.pathname.match(/^\/(deckcraft|wordcraft|pdfcraft|gridcraft|photocraft|filmcraft|vectorcraft)\/$/);
  if (!m) { location.replace('/'); return; }
  const app=m[1], [name,initial,color,description]=apps[app];
  const $ = id => document.getElementById(id);
  const rawUrl = `/${app}/editor/${location.search}${location.hash}`;
  document.title = `${name} — AsiaHub Workspace`;
  $('app-title').textContent = name;
  $('app-icon').textContent = initial;
  $('app-icon').style.setProperty('--app-accent',color);
  $('open-tab').href = rawUrl;
  const root=document.querySelector('.workspace-editor');
  const frame=$('craft-frame'),toggle=$('focus-toggle'),exit=$('exit-focus');
  const focused=()=>root.classList.contains('focus-mode');
  function sync() {
    const active=focused();
    toggle.setAttribute('aria-pressed',String(active));
    $('focus-label').textContent=active?'Tutup fokus':'Fokus';
    exit.hidden=!active;
  }
  function leave() { root.classList.remove('focus-mode'); sync(); }
  function enter() { root.classList.add('focus-mode'); sync(); }
  toggle.addEventListener('click',()=>{ focused()?leave():enter(); });
  exit.addEventListener('click',leave);
  // Native browser fullscreen caused Android to return to a floating/small window.
  // CSS focus mode preserves the full browser window and restores it on Escape.
  const onEscape=e=>{ if(e.key==='Escape'&&focused())leave(); };
  document.addEventListener('keydown',onEscape,true);
  window.addEventListener('keydown',onEscape,true);
  // Keyboard events inside a same-origin iframe do not bubble to the parent.
  frame.addEventListener('load',()=>{
    $('loading').hidden=true;
    try {
      frame.contentWindow.addEventListener('keydown',onEscape,true);
      frame.contentDocument.addEventListener('keydown',onEscape,true);
    } catch (_) { /* Visible exit button stays available. */ }
    // iframe load is not proof the WASM application initialized.
  });
  frame.title=name+' editor';
  frame.src=rawUrl;
  sync();
})();
