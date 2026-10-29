'use strict';
// All seven tools are live navigation targets. The workspace itself doesn't persist editor files.
(function () {
  const search = document.getElementById('tool-search');
  const cards = [...document.querySelectorAll('[data-tool-name]')];
  const empty = document.getElementById('empty-results');
  const clear = document.getElementById('clear-search');
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
  if (!search || !empty) return;
  function filterTools() {
    const query = search.value.trim().toLocaleLowerCase();
    let shown = 0;
    for (const card of cards) {
      const visible = !query || `${card.dataset.search || ''} ${card.dataset.toolName || ''}`.toLocaleLowerCase().includes(query);
      card.hidden = !visible;
      if (visible) shown++;
    }
    empty.hidden = shown > 0;
  }
  search.addEventListener('input', filterTools);
  clear?.addEventListener('click', () => { search.value = ''; filterTools(); search.focus(); });
  document.addEventListener('keydown', event => {
    const typing = event.target instanceof HTMLElement && (event.target.isContentEditable || ['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName));
    if (event.key === '/' && !typing && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault(); search.focus(); document.getElementById('tools')?.scrollIntoView({behavior:'smooth'});
    }
    if (event.key === 'Escape' && document.activeElement === search) { search.value = ''; filterTools(); search.blur(); }
  });
  filterTools();
})();
