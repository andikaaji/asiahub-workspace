'use strict';
// Workspace entries are deliberately independent of editor deployments.
// To add another Craft app, add its card in index.html and proxy route in nginx/workspace.conf.
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
    cards.forEach(card => {
      const visible = !query || (card.dataset.search || '').toLocaleLowerCase().includes(query);
      card.hidden = !visible;
      if (visible) shown++;
    });
    empty.hidden = shown > 0;
  }
  search.addEventListener('input', filterTools);
  clear?.addEventListener('click', () => {
    search.value = '';
    filterTools();
    search.focus();
  });
  document.addEventListener('keydown', event => {
    const isTyping = event.target instanceof HTMLElement && (event.target.isContentEditable || ['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName));
    if (event.key === '/' && !isTyping && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      search.focus();
      document.getElementById('tools')?.scrollIntoView({behavior:'smooth'});
    }
    if (event.key === 'Escape' && document.activeElement === search) {
      search.value = '';
      filterTools();
      search.blur();
    }
  });
  filterTools();
})();
