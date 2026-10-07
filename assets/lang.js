(function () {
  var buttons = document.querySelectorAll('.langs button');
  function apply(lang) {
    document.documentElement.lang = lang;
    buttons.forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    });
    try { localStorage.setItem('lang', lang); } catch (e) {}
  }
  var saved = null;
  try { saved = localStorage.getItem('lang'); } catch (e) {}
  apply(saved || ((navigator.language || 'ja').toLowerCase().indexOf('ja') === 0 ? 'ja' : 'en'));
  buttons.forEach(function (b) {
    b.addEventListener('click', function () { apply(b.dataset.lang); });
  });
})();
