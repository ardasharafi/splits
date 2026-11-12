/* Splits for iPhone: start the ledger engine before the screens load. */
(function () {
  'use strict';
  var apiBase = 'https://api.github.com';
  // Tests on this computer point the engine at a stand-in GitHub.
  if (/^(127\.0\.0\.1|localhost)$/.test(location.hostname)) {
    try { apiBase = localStorage.getItem('splits.testApi') || apiBase; } catch (e) { /* default */ }
  }
  window.SplitsLocal = window.SplitsEngine.create({ apiBase: apiBase });
  var standalone = window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  if (/[#&]p=[A-Za-z0-9_-]+/.test(location.hash)) {
    try { window.SplitsLocal.keepPhoneLink(location.href); } catch (e) { /* the screen asks for a link */ }
    // In Safari the link stays in the address so Add to Home Screen carries it over.
    if (standalone) history.replaceState(null, '', location.pathname + location.search);
  }
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function () { /* works without */ });
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () { /* fine */ });
})();
