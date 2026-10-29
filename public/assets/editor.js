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
  $('app-title').textContent = $('app-crumb').textContent = name;
  $('app-description').textContent = description;
  $('app-icon').textContent = initial;
  $('app-icon').style.setProperty('--app-color',color);
  $('open-tab').href = rawUrl;
  const stage=$('editor-stage'),toggle=$('focus-toggle'),exit=$('exit-focus');
  const focused = () => document.fullscreenElement===stage || document.body.classList.contains('fallback-focus');
  function sync() { const state=focused(); toggle.setAttribute('aria-pressed',String(state)); $('focus-label').textContent=state?'Keluar penuh':'Layar penuh'; exit.hidden=!state; }
  async function leave() {
    if(document.fullscreenElement===stage) { try { await document.exitFullscreen(); } catch (_) {} }
    document.body.classList.remove('fallback-focus'); sync();
  }
  async function enter() {
    if(stage.requestFullscreen) {
      try { await stage.requestFullscreen({navigationUI:'hide'}); sync(); return; } catch (_) {}
    }
    document.body.classList.add('fallback-focus'); sync();
  }
  toggle.addEventListener('click',()=>{ void (focused()?leave():enter()); });
  exit.addEventListener('click',()=>{void leave();});
  document.addEventListener('fullscreenchange',sync);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('fallback-focus'))void leave();});
  const frame=$('craft-frame'); frame.title=name+' editor';
  frame.addEventListener('load',()=>{$('loading').hidden=true;});
  // An iframe load event does not mean the WebAssembly application has initialized.
  frame.src=rawUrl; sync();
})();
