// Applies the saved theme before first paint to avoid a flash of the wrong
// theme. Loaded as a tiny blocking script so CSP can stay `script-src 'self'`.
(function () {
  try {
    var t = localStorage.getItem('pn.theme');
    var light = t === 'light' || (t === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches);
    document.documentElement.dataset.theme = light ? 'light' : 'dark';
  } catch (e) {
    /* storage unavailable: keep dark default */
  }
})();
