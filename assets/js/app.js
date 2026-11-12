/* Splits — app window */
(function () {
  'use strict';
  var L = window.Logic, ST = window.Statements, D = window.Dom, h = D.h, s = D.s;
  // On the iPhone the ledger engine runs in the page (local.js) instead of the Windows app.
  var PHONE = !!window.SplitsLocal, KIT = window.SplitsKit;
  var STANDALONE = PHONE && (window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches));

  // ================================================================ icons
  var ICONS = {
    overview: '<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15.5 3.7A9 9 0 0 1 20.3 8.5H15.5z"/>',
    payouts: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6.5 9.5h.01M17.5 14.5h.01"/>',
    import: '<path d="M12 4v10m0 0-4-4m4 4 4-4"/><path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
    payments: '<path d="M9 6.5h11M9 12h11M9 17.5h11"/><path d="M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01"/>',
    artists: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
    managers: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19.5c.6-3.3 2.8-5.2 5.5-5.2s4.9 1.9 5.5 5.2"/><path d="M15.5 5.2a3.1 3.1 0 0 1 0 5.6M17.6 14.6c1.6.7 2.6 2.2 2.9 4.6"/>',
    settings: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/>',
    lock: '<rect x="5" y="10.5" width="14" height="9.5" rx="2.2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 9a4.5 4.5 0 0 1-.5 9.5z"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
    calendar: '<rect x="4" y="5" width="16" height="15" rx="2.2"/><path d="M4 10h16M9 3v4M15 3v4"/>',
    down: '<path d="m7 10 5 5 5-5"/>',
    right: '<path d="m10 7 5 5-5 5"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
    folder: '<path d="M3 7.5a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    open: '<path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.9-3.5M4 4v4h4M4 13a8 8 0 0 0 14.9 3.5M20 20v-4h-4"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    circle: '<circle cx="12" cy="12" r="7"/>',
    half: '<circle cx="12" cy="12" r="7"/><path d="M12 5a7 7 0 0 1 0 14z" fill="currentColor"/>',
    paid: '<circle cx="12" cy="12" r="8" fill="currentColor" stroke="none"/><path d="M8.3 12.3l2.5 2.5 5-5.3" stroke="#fff"/>',
    alert: '<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4M12 17h.01"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="m11 12 8-8M16 7l2 2M14 9l2 2"/>',
    shield: '<path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6z"/>',
    merge: '<path d="M6 4v5a6 6 0 0 0 6 6h6M15 12l3 3-3 3M6 20v-3"/>',
    convert: '<path d="M4 8.5h14.5L15 5M20 15.5H5.5L9 19"/>',
    share: '<path d="M12 3v12M8 7l4-4 4 4"/><path d="M5 11v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8"/>',
    phone: '<rect x="6.5" y="2.5" width="11" height="19" rx="2.5"/><path d="M10.5 18.5h3"/>',
    backup: '<path d="M4 7c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3z"/><path d="M4 7v10c0 1.7 3.6 3 8 3s8-1.3 8-3V7M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    user: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-3.6 3.6-5.8 7-5.8s6.2 2.2 7 5.8"/>',
    sheet: '<rect x="4" y="4" width="16" height="16" rx="2.2"/><path d="M4 9.5h16M4 14.5h16M10 9.5V20"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'
  };
  function icon(name, size) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    el.setAttribute('viewBox', '0 0 24 24');
    el.setAttribute('width', size || 18);
    el.setAttribute('height', size || 18);
    el.setAttribute('fill', 'none');
    el.setAttribute('stroke', 'currentColor');
    el.setAttribute('stroke-width', '1.8');
    el.setAttribute('stroke-linecap', 'round');
    el.setAttribute('stroke-linejoin', 'round');
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = ICONS[name] || '';
    return el;
  }

  // ================================================================ api
  function call(method, path, body) {
    if (PHONE) return window.SplitsLocal.call(method, path, body);
    var opts = { method: method, headers: { 'X-Splits': '1' }, credentials: 'same-origin' };
    if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
    return fetch(path, opts).then(function (res) {
      return res.text().then(function (txt) {
        var data = null;
        try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = null; }
        if (!res.ok) {
          var err = new Error((data && data.error) || ('Something went wrong (' + res.status + ').'));
          err.status = res.status;
          err.data = data;
          throw err;
        }
        return data;
      });
    }, function () {
      var err = new Error('Splits stopped responding.');
      err.gone = true;
      throw err;
    });
  }
  var api = {
    get: function (p) { return call('GET', p); },
    post: function (p, b) { return call('POST', p, b || {}); }
  };

  // ================================================================ state
  var today = L.todayISO();
  var st = {
    server: null,
    db: null,
    rev: -1,
    route: 'overview',
    period: periodFromPreset('this-month'),
    cur: null,
    payouts: { q: '', cur: 'all', status: 'all', sel: {}, sort: { key: 'name', dir: 'asc' }, lastIdx: null },
    payments: { q: '', cur: 'all', status: 'all', sel: {}, sort: { key: 'date', dir: 'desc' }, lastIdx: null },
    artists: { q: '', sel: {}, sort: { key: 'name', dir: 'asc' }, lastIdx: null },
    deleteSelected: null,
    imp: { text: '', parsed: null, plan: null },
    setup: { step: 'welcome', code: '', error: '' },
    lockView: 'password',
    drawer: null,
    lastActivity: Date.now(),
    animatedOverview: false,
    focusNext: null,
    gone: false
  };

  function periodFromPreset(id) {
    var p = L.presets(L.todayISO()).filter(function (x) { return x.id === id; })[0];
    return { preset: id, from: p.from, to: p.to };
  }
  function settings() { return L.settingsOf(st.db || {}); }
  function money(c, cur) { return L.fmtMoney(c, cur); }
  function rangeLabel() { return L.rangeLabel(st.period.from, st.period.to); }
  function values(o) { return L.values(o); }

  // ================================================================ data
  function emptyDb() { return { artists: {}, payments: {}, managers: {}, settings: {}, imports: {} }; }
  function loadData() {
    return api.get('/api/data').then(function (res) {
      var db = emptyDb();
      Object.keys(res.colls || {}).forEach(function (c) {
        db[c] = db[c] || {};
        res.colls[c].forEach(function (r) { db[c][r.id] = Object.assign({}, r.b, { id: r.id, u: r.u }); });
      });
      st.db = db;
      st.rev = res.rev;
    });
  }
  function bodyOf(rec) { var b = Object.assign({}, rec); delete b.id; delete b.u; return b; }
  function putOp(c, id, body) { return { op: 'put', c: c, id: id, b: body }; }
  function updOp(c, rec, changes) { return putOp(c, rec.id, Object.assign(bodyOf(rec), changes)); }
  function delOp(c, id) { return { op: 'del', c: c, id: id }; }
  function setOp(key, value) { return putOp('settings', key, { value: value }); }

  function commit(ops) {
    if (!ops.length) return Promise.resolve();
    return api.post('/api/mutate', { ops: ops }).then(function (res) {
      (res.recs || []).forEach(function (r) {
        if (!st.db[r.c]) st.db[r.c] = {};
        if (r.del) delete st.db[r.c][r.id];
        else st.db[r.c][r.id] = Object.assign({}, r.b, { id: r.id, u: r.u });
      });
      st.rev = res.rev;
      render();
      return res;
    }).catch(function (e) { handleError(e); throw e; });
  }
  // Snapshot records so a change can be undone.
  function snapshot(c, recs) { return recs.map(function (r) { return putOp(c, r.id, bodyOf(st.db[c][r.id] || r)); }); }

  function handleError(e) {
    if (e && e.gone) { showGone(); return; }
    if (e && e.status === 423) { st.db = null; refreshState().then(render); return; }
    if (e && e.status === 401) { showGone('Open Splits from its icon.'); return; }
    toast(e && e.message ? e.message : String(e), { error: true });
  }

  function refreshState() {
    return api.get('/api/state').then(function (s) { st.server = s; return s; });
  }

  // ================================================================ render
  var appRoot, layerRoot, modalRoot, toastRoot, tipEl;
  var after = [];
  function afterRender(fn) { after.push(fn); }

  function captureFocus() {
    var a = document.activeElement;
    if (!a || !a.getAttribute || !a.getAttribute('data-fk')) return null;
    var f = { key: a.getAttribute('data-fk'), scroll: a.scrollTop };
    try { f.start = a.selectionStart; f.end = a.selectionEnd; } catch (e) { /* not a text field */ }
    return f;
  }
  function restoreFocus(f) {
    var key = st.focusNext || (f && f.key);
    if (!key) return;
    var el = document.querySelector('[data-fk="' + key + '"]');
    var next = !!st.focusNext;
    st.focusNext = null;
    if (!el) return;
    el.focus({ preventScroll: true });
    if (next && el.select) { el.select(); return; }
    if (f && f.key === key) {
      try { if (f.start !== undefined && f.start !== null) el.setSelectionRange(f.start, f.end); } catch (e) { /* ignore */ }
      if (f.scroll) el.scrollTop = f.scroll;
    }
  }

  function render() {
    if (!appRoot) return;
    var f = captureFocus();
    var y = window.scrollY;
    var drawerScroll = layerRoot.querySelector('.drawer-body');
    var dy = drawerScroll ? drawerScroll.scrollTop : 0;
    after = [];
    st.deleteSelected = null;
    var screen;
    if (!st.server) screen = h('div', { class: 'lock' });
    else if (!st.server.initialized) screen = setupScreen();
    else if (st.server.locked || !st.db) screen = lockScreen();
    else screen = shell();
    appRoot.replaceChildren(screen);
    renderLayer();
    window.scrollTo(0, y);
    var nd = layerRoot.querySelector('.drawer-body');
    if (nd) nd.scrollTop = dy;
    restoreFocus(f);
    after.forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } });
    if (st.setup.step === 'code' && st.server && st.server.initialized && st.db) afterSetup();
  }

  function go(route) {
    st.route = route;
    st.drawer = null;
    window.scrollTo(0, 0);
    render();
  }

  // ================================================================ small components
  var AV_TINTS = [['#ece6fa', '#4b2f86'], ['#dcf1ed', '#0b5e54'], ['#f8eccd', '#6b4a00'], ['#f9e0e8', '#8c2a48'], ['#e2eafb', '#1c4d8c'], ['#eceaf0', '#4a4555']];
  function avatar(name, cls) {
    var hsh = 0, n = String(name || '');
    for (var i = 0; i < n.length; i++) hsh = (hsh * 31 + n.charCodeAt(i)) >>> 0;
    var t = AV_TINTS[hsh % AV_TINTS.length];
    return h('span', { class: 'av ' + (cls || ''), style: { background: t[0], color: t[1] }, 'aria-hidden': 'true' }, L.initials(name));
  }

  function seg(options, value, onChange, label) {
    return h('div', { class: 'seg', role: 'group', 'aria-label': label || '' }, options.map(function (o) {
      return h('button', { type: 'button', class: o.value === value ? 'on' : '', 'aria-pressed': o.value === value ? 'true' : 'false', onclick: function () { onChange(o.value); } }, o.label);
    }));
  }

  function statusButton(status, onClick, label) {
    var cls = status === 'paid' ? 'paid' : status === 'partial' ? 'partial' : 'unpaid';
    var ic = status === 'paid' ? 'paid' : status === 'partial' ? 'half' : 'circle';
    var text = status === 'paid' ? 'Paid' : status === 'partial' ? 'Part paid' : 'Not paid';
    return h('button', { type: 'button', class: 'status ' + cls, onclick: onClick, 'data-tip': status === 'paid' ? 'Click to mark as not paid' : 'Click to mark as paid', 'aria-label': (label ? label + ': ' : '') + text }, icon(ic, 16), text);
  }

  function pageHead(title, sub, actions) {
    return h('header', { class: 'page-head' },
      h('div', null, h('h1', { class: 'page-title' }, title), sub ? h('div', { class: 'page-sub' }, sub) : null),
      actions && actions.length ? h('div', { class: 'page-actions' }, actions) : null);
  }

  function emptyState(title, text, action) {
    return h('div', { class: 'empty' }, h('div', { class: 'empty-title' }, title), text ? h('p', null, text) : null, action || null);
  }

  function searchBox(value, placeholder, fk, onInput) {
    var t = null;
    return h('label', { class: 'search' }, icon('search', 16),
      h('input', { class: 'input', type: 'search', value: value, placeholder: placeholder, 'data-fk': fk, 'aria-label': placeholder,
        oninput: function (e) { var v = e.target.value; clearTimeout(t); t = setTimeout(function () { onInput(v); }, 140); } }));
  }

  // ---------------------------------------------------------------- period picker
  function periodButton() {
    var p = st.period;
    var j = L.rangeJLabel(p.from, p.to);
    return h('button', { type: 'button', class: 'period-btn', 'aria-haspopup': 'true', onclick: function (e) { openPeriodPop(e.currentTarget); } },
      icon('calendar', 18),
      h('span', null, h('span', { class: 'g' }, L.rangeLabel(p.from, p.to)), j ? h('span', { class: 'j' }, j) : null),
      icon('down', 16));
  }

  function openPeriodPop(anchor) {
    var list = L.presets(L.todayISO());
    var t = L.parseISO(L.todayISO());
    var months = [];
    for (var i = 11; i >= 0; i--) months.push(L.shiftMonth(t.y, t.m, -i));
    var fromIn, toIn;
    function pick(from, to, preset) {
      st.period = { preset: preset || 'custom', from: from, to: to };
      st.payouts.sel = {}; st.payments.sel = {};
      closePop();
      render();
    }
    var node = h('div', { class: 'pop', role: 'dialog', 'aria-label': 'Choose a period' },
      list.map(function (p) {
        var on = st.period.preset === p.id;
        return h('button', { type: 'button', class: 'pop-item' + (on ? ' on' : ''), onclick: function () { pick(p.from, p.to, p.id); } },
          h('span', null, p.label), h('span', { class: 'faint' }, p.id === 'all' ? '' : L.rangeLabel(p.from, p.to)), on ? icon('check', 16) : null);
      }),
      h('div', { class: 'pop-sep' }),
      h('div', { class: 'pop-label' }, 'Month'),
      h('div', { class: 'pop-months' }, months.map(function (m) {
        var r = L.monthRange(m.y, m.m);
        var on = st.period.from === r.from && st.period.to === r.to;
        return h('button', { type: 'button', class: on ? 'on' : '', onclick: function () { pick(r.from, r.to, 'month'); } }, L.MON[m.m - 1] + (m.y !== t.y ? ' ' + String(m.y).slice(2) : ''));
      })),
      h('div', { class: 'pop-sep' }),
      h('div', { class: 'pop-label' }, 'Custom range'),
      h('div', { class: 'pop-custom' },
        h('div', { class: 'field' }, h('label', { class: 'hint' }, 'From'), fromIn = h('input', { class: 'input', type: 'date', value: st.period.from.slice(0, 4) === '2000' ? '' : st.period.from })),
        h('div', { class: 'field' }, h('label', { class: 'hint' }, 'To'), toIn = h('input', { class: 'input', type: 'date', value: st.period.to.slice(0, 4) === '2099' ? '' : st.period.to })),
        h('button', { type: 'button', class: 'btn btn-primary', onclick: function () {
          var a = fromIn.value, b = toIn.value;
          if (!a || !b) { toast('Choose both dates.', { error: true }); return; }
          if (a > b) { var x = a; a = b; b = x; }
          pick(a, b, 'custom');
        } }, 'Apply')));
    openPop(anchor, node);
  }

  var popEl = null;
  function openPop(anchor, node) {
    closePop();
    popEl = node;
    document.body.appendChild(node);
    var r = anchor.getBoundingClientRect();
    var w = node.offsetWidth, hgt = node.offsetHeight;
    var left = Math.min(r.right - w, window.innerWidth - w - 12);
    left = Math.max(12, left);
    var top = r.bottom + 8;
    if (top + hgt > window.innerHeight - 12) top = Math.max(12, r.top - hgt - 8);
    node.style.left = left + 'px';
    node.style.top = top + 'px';
    setTimeout(function () { document.addEventListener('mousedown', popOutside); }, 0);
  }
  function popOutside(e) { if (popEl && !popEl.contains(e.target)) closePop(); }
  function closePop() {
    if (popEl) { popEl.remove(); popEl = null; }
    document.removeEventListener('mousedown', popOutside);
  }

  // ---------------------------------------------------------------- tooltip
  function setupTooltips() {
    tipEl = h('div', { class: 'tip', hidden: true, role: 'tooltip' });
    document.body.appendChild(tipEl);
    document.addEventListener('mouseover', function (e) {
      var t = e.target.closest && e.target.closest('[data-tip]');
      if (!t) { tipEl.hidden = true; return; }
      tipEl.textContent = t.getAttribute('data-tip');
      tipEl.hidden = false;
      moveTip(e);
    });
    document.addEventListener('mousemove', function (e) { if (!tipEl.hidden) moveTip(e); });
    document.addEventListener('mousedown', function () { tipEl.hidden = true; });
  }
  function moveTip(e) {
    var w = tipEl.offsetWidth, hh = tipEl.offsetHeight;
    var x = e.clientX + 14, y = e.clientY + 16;
    if (x + w > window.innerWidth - 8) x = e.clientX - w - 14;
    if (y + hh > window.innerHeight - 8) y = e.clientY - hh - 12;
    tipEl.style.left = x + 'px';
    tipEl.style.top = y + 'px';
  }

  // ---------------------------------------------------------------- toasts
  function toast(msg, opts) {
    opts = opts || {};
    var el = h('div', { class: 'toast' + (opts.error ? ' error' : ''), role: opts.error ? 'alert' : 'status' },
      opts.busy ? h('span', { class: 'spin', 'aria-hidden': 'true' }) : null,
      h('div', { class: 'toast-msg' }, msg),
      opts.actions ? h('div', { class: 'toast-actions' }, opts.actions.map(function (a) {
        return h('button', { type: 'button', onclick: function () { el.remove(); a.fn(); } }, a.label);
      })) : null);
    toastRoot.appendChild(el);
    while (toastRoot.children.length > (PHONE ? 2 : 4)) toastRoot.firstChild.remove();
    if (!opts.busy) setTimeout(function () { el.remove(); }, opts.error ? 9000 : opts.actions ? (PHONE ? 6500 : 9000) : (PHONE ? 3200 : 4200));
    return { el: el, close: function () { el.remove(); }, update: function (m) { el.querySelector('.toast-msg').textContent = m; } };
  }

  // ---------------------------------------------------------------- modal
  function openModal(build, opts) {
    opts = opts || {};
    var prevFocus = document.activeElement;
    var scrim = h('div', { class: 'scrim modal-scrim' });
    var box = h('div', { class: 'modal' + (opts.wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true' });
    var closed = false;
    function close() {
      if (closed) return;
      closed = true;
      scrim.remove(); box.remove();
      document.removeEventListener('keydown', onKey, true);
      if (prevFocus && prevFocus.focus && document.body.contains(prevFocus)) prevFocus.focus();
      if (opts.onClose) opts.onClose();
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
    }
    scrim.addEventListener('mousedown', function () { if (!opts.sticky) close(); });
    D.append(box, [build(close)]);
    modalRoot.appendChild(scrim);
    modalRoot.appendChild(box);
    document.addEventListener('keydown', onKey, true);
    var first = box.querySelector('[autofocus]') || box.querySelector('input, select, textarea, button.btn-primary');
    if (first) setTimeout(function () { first.focus(); if (first.select && first.type !== 'date') first.select(); }, 30);
    return close;
  }

  function modalFrame(title, text, body, actions, left) {
    return h('div', { class: 'modal-inner', style: { display: 'contents' } },
      h('div', { class: 'modal-head' }, h('div', null, h('h2', { class: 'modal-title' }, title), text ? h('p', { class: 'modal-text' }, text) : null)),
      body ? h('div', { class: 'modal-body' }, body) : null,
      h('div', { class: 'modal-foot' }, left ? h('div', { class: 'left' }, left) : null, actions));
  }

  function confirmDialog(o) {
    return new Promise(function (resolve) {
      var done = false;
      openModal(function (close) {
        return modalFrame(o.title, o.text, null, [
          h('button', { type: 'button', class: 'btn btn-ghost', onclick: function () { close(); } }, o.cancel || 'Cancel'),
          h('button', { type: 'button', class: 'btn ' + (o.danger ? 'btn-danger' : 'btn-primary'), autofocus: true, onclick: function () { done = true; close(); } }, o.confirm || 'OK')
        ]);
      }, { onClose: function () { resolve(done); } });
    });
  }

  // Asks for the password, then runs fn(password). Keeps the dialog open on a wrong password.
  function withPassword(o, fn) {
    openModal(function (close) {
      var err = h('div', { class: 'error-text', hidden: true });
      var input = h('input', { class: 'input', type: 'password', autocomplete: 'current-password', autofocus: true, placeholder: 'Password' });
      var btn;
      function submit() {
        btn.disabled = true;
        Promise.resolve(fn(input.value)).then(function () { close(); }).catch(function (e) {
          btn.disabled = false;
          if (e && e.gone) { close(); showGone(); return; }
          err.textContent = e.message; err.hidden = false;
          input.select();
        });
      }
      input.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
      return modalFrame(o.title, o.text, [h('div', { class: 'field' }, h('label', null, o.label || 'Password'), input), err], [
        h('button', { type: 'button', class: 'btn btn-ghost', onclick: close }, 'Cancel'),
        btn = h('button', { type: 'button', class: 'btn btn-primary', onclick: submit }, o.confirm || 'Continue')
      ]);
    });
  }

  // ---------------------------------------------------------------- drawer
  function renderLayer() {
    layerRoot.replaceChildren();
    if (!st.drawer || !st.db || (st.server && st.server.locked)) return;
    var node = st.drawer.kind === 'artist' ? drawerArtist(st.drawer) : st.drawer.kind === 'manager' ? drawerManager(st.drawer) : null;
    if (!node) { st.drawer = null; return; }
    var scrim = h('div', { class: 'scrim', onmousedown: closeDrawer });
    layerRoot.appendChild(scrim);
    layerRoot.appendChild(node);
  }
  function openDrawer(d) { st.drawer = d; render(); var b = layerRoot.querySelector('.drawer-close'); if (b) b.focus(); }
  function closeDrawer() { st.drawer = null; render(); }

  // ================================================================ PDF
  function periodFolder() { return L.rangeFileLabel(st.period.from, st.period.to); }
  function openPath(path, reveal) { return api.post('/api/open', { path: path, reveal: !!reveal }).catch(handleError); }
  function openDir(dir) { return api.post('/api/open', { dir: dir }).catch(handleError); }

  function makePdf(kind, params, name) {
    if (PHONE) return phonePdf([{ kind: kind, params: params }], name).then(function (f) { return { phone: true, files: [f], name: f.name }; });
    var file = periodFolder() + '/' + L.safeFile(name) + '.pdf';
    return api.post('/api/pdf', { kind: kind, params: params, file: file }).then(function (res) {
      if (res && res.fallback) {
        window.open(res.url, '_blank', 'width=960,height=1100');
        return null;
      }
      return res;
    });
  }

  // iPhone: make the PDF from the same statement pages the computer prints.
  function phonePdf(jobs, name) {
    var sheets = jobs.map(function (j) { return ST.render(j.kind, j.params, { db: st.db, settings: settings(), now: Date.now() }).node; });
    return KIT.statementPdf(sheets, name).then(function (blob) { return KIT.file(blob, L.safeFile(name) + '.pdf'); });
  }
  // iPhone: files are handed to the share sheet (Save to Files, Telegram, Mail, Print).
  function readySheet(files, what) {
    openModal(function (close) {
      var kb = files.reduce(function (n, f) { return n + f.size; }, 0) / 1024;
      var size = kb > 1024 ? (kb / 1024).toFixed(1) + ' MB' : Math.max(1, Math.round(kb)) + ' KB';
      return modalFrame(files.length === 1 ? files[0].name : files.length + ' ' + what + ' files', 'Ready, ' + size + '. Share opens the iPhone menu: Save to Files, Telegram, Mail or Print.',
        files.length > 1 ? h('div', { class: 'checklist', style: { maxHeight: '240px' } }, files.map(function (f) { return h('div', { style: { padding: '8px 10px' } }, f.name); })) : null,
        [h('button', { type: 'button', class: 'btn btn-ghost', onclick: close }, 'Done'),
          h('button', { type: 'button', class: 'btn btn-primary', autofocus: true, onclick: function () {
            KIT.share(files, files.length === 1 ? files[0].name : 'Splits').then(function (done) { if (done) close(); }).catch(function (e) { toast(e.message || String(e), { error: true }); });
          } }, icon('share', 17), 'Share')]);
    });
  }

  function savedToast(res) {
    if (res && res.phone) { readySheet(res.files, 'PDF'); return; }
    if (!res) { toast('Choose "Save as PDF" in the print window.'); return; }
    toast('Saved ' + res.name, { actions: [
      { label: 'Open', fn: function () { openPath(res.path); } },
      { label: 'Show in folder', fn: function () { openPath(res.path, true); } }
    ] });
  }

  function artistPdfName(row, rows) {
    var multi = rows.filter(function (r) { return r.artistId === row.artistId; }).length > 1;
    return row.name + (multi ? ' ' + row.cur : '') + ' - ' + rangeLabel();
  }

  function saveArtistPdf(row) {
    var rows = L.computeRows(st.db, st.period.from, st.period.to);
    var t = toast('Saving the PDF for ' + row.name + '…', { busy: true });
    return makePdf('artist', { artistId: row.artistId, cur: row.cur, from: st.period.from, to: st.period.to }, artistPdfName(row, rows))
      .then(function (res) { t.close(); savedToast(res); })
      .catch(function (e) { t.close(); handleError(e); });
  }

  function saveManyPdfs(all) {
    var list = all.filter(function (r) { return !r.unnamed; });
    var skipped = all.length - list.length;
    if (!list.length) { toast('Give these payments a name first. A statement needs an artist.', { error: true }); return; }
    var rows = L.computeRows(st.db, st.period.from, st.period.to);
    if (PHONE) {
      var tp = toast('Making ' + list.length + ' PDFs…', { busy: true });
      var made = [], chainP = Promise.resolve();
      list.forEach(function (row, i) {
        chainP = chainP.then(function () {
          tp.update('Making PDF ' + (i + 1) + ' of ' + list.length + '…');
          return phonePdf([{ kind: 'artist', params: { artistId: row.artistId, cur: row.cur, from: st.period.from, to: st.period.to } }], artistPdfName(row, rows)).then(function (f) { made.push(f); });
        });
      });
      chainP.then(function () {
        tp.close();
        readySheet(made, 'PDF');
        if (skipped) toast(plural(skipped, 'payment') + ' without a name got no PDF.');
      }).catch(function (e) { tp.close(); handleError(e); });
      return;
    }
    var t = toast('Saving PDFs…', { busy: true });
    var done = 0, last = null, fellBack = false;
    var chain = Promise.resolve();
    list.forEach(function (row) {
      chain = chain.then(function () {
        t.update('Saving PDF ' + (done + 1) + ' of ' + list.length + '…');
        if (fellBack) return null;
        return makePdf('artist', { artistId: row.artistId, cur: row.cur, from: st.period.from, to: st.period.to }, artistPdfName(row, rows))
          .then(function (res) { if (res) { done++; last = res; } else fellBack = true; });
      });
    });
    chain.then(function () {
      t.close();
      if (last) toast('Saved ' + done + (done === 1 ? ' PDF' : ' PDFs') + ' in ' + periodFolder() + (skipped ? '. ' + plural(skipped, 'payment') + ' without a name got no PDF.' : ''), { actions: [{ label: 'Open folder', fn: function () { openPath(last.folder); } }] });
      if (fellBack) toast('Splits couldn\'t save the PDFs by itself, so it opened a print window. Choose "Save as PDF" there, then save the others one by one.', { error: !last });
    }).catch(function (e) { t.close(); handleError(e); });
  }

  function saveOverviewPdf() {
    var t = toast('Saving the report…', { busy: true });
    makePdf('overview', { from: st.period.from, to: st.period.to }, 'Overview - ' + rangeLabel())
      .then(function (res) { t.close(); savedToast(res); })
      .catch(function (e) { t.close(); handleError(e); });
  }

  function saveManagerPdf(m) {
    var t = toast('Saving the statement for ' + m.name + '…', { busy: true });
    makePdf('manager', { managerId: m.id, from: st.period.from, to: st.period.to }, 'Manager ' + m.name + ' - ' + rangeLabel())
      .then(function (res) { t.close(); savedToast(res); })
      .catch(function (e) { t.close(); handleError(e); });
  }

  // Statement preview: the real statement page, scaled to fit.
  function statementPreview(kind, params) {
    var out = ST.render(kind, params, { db: st.db, settings: settings(), now: Date.now() });
    var scale = h('div', { class: 'sheet-scale' }, out.node);
    var frame = h('div', { class: 'sheet-frame' }, scale);
    afterRender(function () {
      var w = frame.clientWidth - 36;
      var sheetW = out.node.offsetWidth || 794;
      var k = Math.min(1, w / sheetW);
      scale.style.transform = 'scale(' + k + ')';
      frame.style.height = (out.node.offsetHeight * k + 36) + 'px';
    });
    return frame;
  }

  // ================================================================ actions on payouts
  function rateInput(row, idx) {
    var v = row.rate === 'mixed' ? '' : row.rate ? L.fmtToman(row.rate) : '';
    var unit = L.curInfo(row.cur).symbol.trim();
    var input = h('input', {
      class: 'input rate-input', inputmode: 'numeric', value: v, 'data-fk': 'rate-' + idx,
      placeholder: row.rate === 'mixed' ? 'Mixed' : 'Toman per ' + unit,
      'aria-label': 'Rate in Toman per ' + unit + ' for ' + row.name,
      onkeydown: function (e) {
        if (e.key === 'Enter') { st.focusNext = 'rate-' + (idx + 1); e.target.blur(); }
        if (e.key === 'Escape') { e.target.value = v; e.target.blur(); }
      },
      onchange: function (e) {
        var raw = e.target.value.trim();
        if (!raw) { if (row.rate && row.rate !== 'mixed') setRowsRate([row], 0); return; }
        var rate = L.parseRate(raw);
        if (rate === null) { toast('Type the rate as a number, like 258300.', { error: true }); e.target.value = v; return; }
        if (rate === row.rate) { e.target.value = L.fmtToman(rate); render(); return; }
        setRowsRate([row], rate);
      },
      onclick: function (e) { e.stopPropagation(); }
    });
    return input;
  }

  // ================================================================ screens
  function shell() {
    var page = { overview: pageOverview, payouts: pagePayouts, import: pageImport, payments: pagePayments, artists: pageArtists, managers: pageManagers, settings: pageSettings }[st.route] || pageOverview;
    if (PHONE) return h('div', { class: 'shell phone-shell' }, phoneTop(), h('main', { class: 'main', id: 'main' }, page()), phoneTabs());
    return h('div', { class: 'shell' }, sidebar(), h('main', { class: 'main', id: 'main' }, page()));
  }

  function phoneTop() {
    return h('header', { class: 'phone-top' },
      h('div', { class: 'phone-brand' }, D.logo(26, { hole: '#26173a' }), h('span', { class: 'word' }, 'Splits')),
      h('div', { id: 'sync-slot' }, syncChip()),
      h('button', { type: 'button', class: 'icon-btn phone-lock', 'aria-label': 'Lock', onclick: lockNow }, icon('lock', 20)));
  }
  function phoneTabs() {
    var rows = L.computeRows(st.db, st.period.from, st.period.to);
    var notPaid = rows.filter(function (r) { return r.status !== 'paid'; }).length;
    function tab(id, label, ic, count) {
      return h('button', { type: 'button', class: 'tab' + (st.route === id ? ' active' : ''), 'aria-current': st.route === id ? 'page' : null, onclick: function () { go(id); } },
        h('span', { class: 'tab-ico' }, icon(ic, 21), count ? h('span', { class: 'tab-count', 'aria-label': count + ' not paid' }, String(count)) : null), h('span', { class: 'tab-label' }, label));
    }
    return h('nav', { class: 'phone-tabs', 'aria-label': 'Main' },
      tab('overview', 'Overview', 'overview'),
      tab('payouts', 'Payouts', 'payouts', notPaid),
      tab('import', 'Import', 'import'),
      tab('payments', 'Payments', 'payments'),
      tab('artists', 'Artists', 'artists'),
      tab('managers', 'Managers', 'managers'),
      tab('settings', 'Settings', 'settings'));
  }

  function sidebar() {
    var rows = L.computeRows(st.db, st.period.from, st.period.to);
    var notPaid = rows.filter(function (r) { return r.status !== 'paid'; }).length;
    function item(id, label, ic, count) {
      return h('button', { type: 'button', class: 'nav-item' + (st.route === id ? ' active' : ''), 'aria-current': st.route === id ? 'page' : null, onclick: function () { go(id); }, 'data-tip': null },
        icon(ic, 19), h('span', { class: 'label' }, label), count ? h('span', { class: 'nav-count', 'aria-label': count + ' not paid' }, String(count)) : null);
    }
    return h('aside', { class: 'side' },
      h('div', { class: 'side-brand' }, D.logo(34, { hole: '#26173a' }), h('span', { class: 'word' }, 'Splits')),
      h('nav', { class: 'nav', 'aria-label': 'Main' },
        item('overview', 'Overview', 'overview'),
        item('payouts', 'Payouts', 'payouts', notPaid),
        item('import', 'Import', 'import'),
        item('payments', 'Payments', 'payments'),
        item('artists', 'Artists', 'artists'),
        item('managers', 'Managers', 'managers')),
      h('div', { class: 'side-foot' },
        item('settings', 'Settings', 'settings'),
        h('div', { class: 'side-sep' }),
        h('div', { id: 'sync-slot' }, syncChip()),
        h('button', { type: 'button', class: 'nav-item', onclick: lockNow }, icon('lock', 19), h('span', { class: 'label' }, 'Lock'))));
  }

  function ago(ms) {
    if (!ms) return '';
    var d = Math.max(0, Date.now() - ms) / 1000;
    if (d < 45) return 'just now';
    if (d < 3600) return Math.round(d / 60) + ' min ago';
    if (d < 86400) return Math.round(d / 3600) + ' h ago';
    return L.fmtTimestamp(ms);
  }

  function syncInfo() {
    var sy = (st.server && st.server.sync) || { state: 'off' };
    switch (sy.state) {
      case 'ok': return sy.pending || sy.busy ? { dot: 'busy', title: 'Syncing', sub: 'Saving to GitHub' } : { dot: 'ok', title: 'Synced', sub: ago(sy.lastOk) };
      case 'syncing': return { dot: 'busy', title: 'Syncing', sub: sy.repo || '' };
      case 'offline': return { dot: 'warn', title: 'Offline', sub: PHONE ? 'Saved on this iPhone' : 'Saved on this computer' };
      case 'auth': return { dot: 'bad', title: 'Sync stopped', sub: PHONE ? 'Connect this iPhone again' : 'GitHub key needs replacing' };
      case 'mismatch': return { dot: 'bad', title: 'Sync needs you', sub: 'Open Settings' };
      case 'error': return { dot: 'bad', title: 'Sync problem', sub: sy.message || '' };
      case 'locked': return { dot: '', title: 'Locked', sub: '' };
      default: return { dot: '', title: 'Not syncing', sub: 'Connect GitHub in Settings' };
    }
  }
  function syncChip() {
    var i = syncInfo();
    var sy = (st.server && st.server.sync) || {};
    return h('button', { type: 'button', class: 'sync-chip', onclick: function () { go('settings'); }, 'data-tip': sy.message || (sy.repo ? 'GitHub: ' + sy.repo : 'Sync with GitHub') },
      h('span', { class: 'sync-dot ' + i.dot }), h('span', { class: 'sync-text' }, h('b', null, i.title), i.sub ? h('span', null, i.sub) : null));
  }
  function updateSyncChip() {
    var slot = document.getElementById('sync-slot');
    if (slot) slot.replaceChildren(syncChip());
  }

  function lockNow() {
    api.post('/api/lock').then(function (s) {
      st.server = s; st.db = null; st.drawer = null; st.lockView = 'password';
      closePop(); modalRoot.replaceChildren(); toastRoot.replaceChildren();
      render();
    }).catch(handleError);
  }

  // ---------------------------------------------------------------- overview
  function pageOverview() {
    var rows = L.computeRows(st.db, st.period.from, st.period.to);
    var tot = L.totals(rows);
    var curs = L.currenciesIn(rows);
    var cur = curs.indexOf(st.cur) >= 0 ? st.cur : (curs[0] || 'USD');
    var t = tot[cur];
    var s0 = settings();
    var actions = [periodButton()];
    if (curs.length > 1) actions.unshift(seg(curs.map(function (c) { return { value: c, label: c }; }), cur, function (v) { st.cur = v; render(); }, 'Currency'));
    actions.push(h('button', { type: 'button', class: 'btn', onclick: saveOverviewPdf, disabled: !rows.length }, icon('file', 17), 'Save report PDF'));
    var head = pageHead('Overview', null, actions);
    if (!rows.length) {
      return h('div', null, head, h('div', { class: 'page-body' }, h('section', { class: 'panel' },
        emptyState('No payments in ' + rangeLabel(), 'Paste a message log on the Import page and Splits will list every artist and work out the splits.',
          h('button', { type: 'button', class: 'btn btn-primary', onclick: function () { go('import'); } }, icon('import', 17), 'Import payments')))));
    }
    var parts = [
      { key: 'artists', label: 'Artists', value: t.after, color: ST.COLORS.artist },
      { key: 'owner', label: s0.ownerName || 'Owner', value: t.owner, color: ST.COLORS.owner },
      { key: 'mine', label: s0.myName || 'You', value: t.mine, color: ST.COLORS.mine, light: true },
      { key: 'managers', label: 'Other managers', value: t.managers, color: ST.COLORS.managers }
    ];
    var hero = h('section', { class: 'panel hero' },
      h('div', { class: 'hero-label' }, st.period.preset === 'all' ? 'Received in total' : 'Received in ' + rangeLabel()),
      h('div', { class: 'hero-figure' }, money(t.received, cur)),
      h('div', { class: 'hero-sub' }, fromText(t)),
      splitBar(parts, t.received, cur),
      h('div', { class: 'legend' }, parts.filter(function (p) { return p.value > 0; }).map(function (p) {
        return h('span', { class: 'legend-item' }, h('span', { class: 'swatch', style: { background: p.color } }), p.label);
      })));

    var breakdown = h('section', { class: 'panel' },
      h('div', { class: 'panel-head' }, h('h2', { class: 'panel-title' }, 'Where the money goes')),
      h('div', { class: 'panel-body' }, h('table', { class: 'kv' }, h('tbody', null,
        parts.filter(function (p) { return p.value !== 0 || p.key !== 'managers'; }).map(function (p) {
          return h('tr', null, h('td', null, h('span', { class: 'label' }, h('span', { class: 'swatch', style: { background: p.color } }), p.label)), h('td', { class: 'num' }, money(p.value, cur)), h('td', { class: 'share' }, ST.pctOf(p.value, t.received)));
        }),
        h('tr', { class: 'gap' }, h('td', { colspan: 3 })),
        h('tr', null, h('td', null, 'Paid to artists'), h('td', { class: 'num' }, money(t.paidAfter, cur)), h('td', { class: 'share' }, ST.pctOf(t.paidAfter, t.after))),
        h('tr', { class: 'strong' }, h('td', null, 'Still to pay artists', t.unpaidArtists ? h('span', { class: 'sub' }, notPaidText(t)) : null), h('td', { class: 'num' }, money(t.unpaid, cur)), h('td', { class: 'share' }, ST.pctOf(t.unpaid, t.after))),
        t.toman ? h('tr', null, h('td', null, 'In Toman', h('span', { class: 'sub' }, t.tomanRows === t.rows ? 'Every payout has a rate' : t.tomanRows + ' of ' + t.rows + ' payouts have a rate')), h('td', { class: 'num' }, L.fmtToman(t.toman)), h('td', { class: 'share' })) : null))));

    var series = L.monthlySeries(st.db, cur, st.period.to.slice(0, 4) === '2099' ? L.todayISO() : st.period.to, 6);
    var chart = h('section', { class: 'panel' },
      h('div', { class: 'panel-head' }, h('h2', { class: 'panel-title' }, 'Received per month'), h('span', { class: 'faint small' }, L.curInfo(cur).name)),
      h('div', { class: 'panel-body' }, barChart(series, cur)));

    var unpaid = rows.filter(function (r) { return r.cur === cur && r.status !== 'paid'; }).sort(function (a, b) { return b.unpaid - a.unpaid; });
    var todo = h('section', { class: 'panel panel-flush' },
      h('div', { class: 'panel-head' }, h('h2', { class: 'panel-title' }, 'Still to pay'),
        h('button', { type: 'button', class: 'btn btn-sm btn-ghost', onclick: function () { st.payouts.status = 'unpaid'; go('payouts'); } }, 'Open payouts', icon('right', 16))),
      unpaid.length ? h('div', { class: 'table-wrap' }, h('table', { class: 'tbl' },
        h('thead', null, h('tr', null, h('th', null, 'Artist'), h('th', { class: 'num' }, 'Artist share'), h('th', { class: 'num' }, 'Toman'), h('th', null, 'Status'))),
        h('tbody', null, unpaid.slice(0, 8).map(function (r) {
          return h('tr', { class: 'row-link', onclick: function () { if (r.unnamed) editPayment(st.db.payments[r.paymentId]); else openDrawer({ kind: 'artist', key: r.key }); } },
            h('td', null, h('div', { class: 'who' }, avatar(r.name), h('span', { class: 'who-name' }, L.rowLabel(r)))),
            h('td', { class: 'num strong' }, money(r.unpaid, cur)),
            h('td', { class: 'num' }, r.toman ? L.fmtToman(r.toman) : h('span', { class: 'faint' }, '—')),
            h('td', null, statusButton(r.status, function (e) { e.stopPropagation(); setRowsPaid([r], r.status !== 'paid'); }, r.name)));
        })))) : h('div', { class: 'panel-body' }, h('p', { class: 'muted', style: { margin: 0 } }, 'Everyone is paid for ' + rangeLabel() + '.')));

    return h('div', null, head, h('div', { class: 'page-body' }, hero, h('div', { class: 'grid-2' }, breakdown, chart), todo));
  }

  function fromText(t) {
    if (!t.artists) return plural(t.payments, 'payment') + ' without a name';
    return plural(t.payments, 'payment') + ' from ' + plural(t.artists, 'artist') + (t.unnamed ? ' and ' + t.unnamed + ' without a name' : '');
  }
  function notPaidText(t) {
    var parts = [];
    if (t.unpaidNamed) parts.push(plural(t.unpaidNamed, 'artist'));
    if (t.unpaidUnnamed) parts.push(plural(t.unpaidUnnamed, 'payment') + ' without a name');
    return parts.join(' and ') + ' not paid yet';
  }

  // Tall segmented bar: the period's money split into its parts.
  function splitBar(parts, total, cur) {
    var live = parts.filter(function (p) { return p.value > 0; });
    var animate = !st.animatedOverview && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    st.animatedOverview = true;
    var els = live.map(function (p) {
      var share = ST.pctOf(p.value, total);
      return h('div', {
        class: 'splitbar-part' + (p.light ? ' on-light' : ''), role: 'img', tabindex: '0',
        'aria-label': p.label + ': ' + money(p.value, cur) + ', ' + share,
        'data-tip': p.label + '\n' + money(p.value, cur) + '  (' + share + ')',
        'data-label': share,
        style: { background: p.color, flexGrow: animate ? '0.0001' : String(p.value) }
      });
    });
    var bar = h('div', { class: 'splitbar' }, els);
    afterRender(function () {
      var width = bar.clientWidth - 2 * (els.length - 1);
      var ctx = document.createElement('canvas').getContext('2d');
      ctx.font = '600 12px Inter, Segoe UI, sans-serif';
      els.forEach(function (el, i) {
        var px = width * live[i].value / total;
        var label = el.getAttribute('data-label');
        el.textContent = ctx.measureText(label).width + 18 <= px ? label : '';
      });
      if (animate) requestAnimationFrame(function () { requestAnimationFrame(function () { els.forEach(function (el, i) { el.style.flexGrow = String(live[i].value); }); }); });
    });
    return bar;
  }

  function niceStep(max, n) {
    if (max <= 0) return 1;
    var raw = max / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var f = raw / mag;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * mag;
  }
  function tickLabel(cents, cur) {
    var v = cents / 100, sym = L.curInfo(cur).symbol;
    if (v >= 10000) return sym + (Math.round(v / 100) / 10) + 'K';
    return sym + L.fmtNumber(v);
  }

  function barChart(series, cur) {
    var W = 500, H = 220, left = 56, right = 8, top = 22, bottom = 28;
    var max = Math.max.apply(null, series.map(function (d) { return d.received; }).concat([0]));
    var step = niceStep(max, 3), ticks = [];
    var top0 = Math.max(step, Math.ceil(max / step) * step);
    for (var v = 0; v <= top0 + 0.5; v += step) ticks.push(v);
    var plotW = W - left - right, plotH = H - top - bottom, band = plotW / series.length;
    var bw = Math.min(24, band * 0.5);
    function y(v) { return top + plotH - (v / top0) * plotH; }
    var periodMonth = st.period.to.slice(0, 7);
    var svg = s('svg', { class: 'chart', viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Received per month: ' + series.map(function (d) { return d.label + ' ' + money(d.received, cur); }).join(', ') });
    ticks.forEach(function (tv) {
      svg.appendChild(s('line', { class: tv === 0 ? 'base-line' : 'tick-line', x1: left, x2: W - right, y1: y(tv), y2: y(tv) }));
      svg.appendChild(s('text', { x: left - 10, y: y(tv) + 4, 'text-anchor': 'end' }, tickLabel(tv, cur)));
    });
    series.forEach(function (d, i) {
      var cx = left + band * i + band / 2;
      var x = cx - bw / 2, y0 = y(d.received), hgt = top + plotH - y0;
      var current = (d.y + '-' + String(d.m).padStart(2, '0')) === periodMonth;
      var tip = L.MONTHS[d.m - 1] + ' ' + d.y + '\n' + money(d.received, cur);
      var g = s('g', { 'data-tip': tip });
      g.appendChild(s('rect', { class: 'hit', x: left + band * i, y: top, width: band, height: plotH }));
      if (hgt > 0.5) {
        var r = Math.min(4, hgt);
        g.appendChild(s('path', { class: 'col', fill: current ? ST.COLORS.artist : '#9d88d9',
          d: 'M' + x + ' ' + (y0 + hgt) + 'V' + (y0 + r) + 'Q' + x + ' ' + y0 + ' ' + (x + r) + ' ' + y0 + 'H' + (x + bw - r) + 'Q' + (x + bw) + ' ' + y0 + ' ' + (x + bw) + ' ' + (y0 + r) + 'V' + (y0 + hgt) + 'Z' }));
      }
      if (current && d.received > 0) g.appendChild(s('text', { class: 'value', x: cx, y: y0 - 7, 'text-anchor': 'middle' }, tickLabel(d.received, cur)));
      g.appendChild(s('text', { x: cx, y: H - 8, 'text-anchor': 'middle' }, d.label + (d.m === 1 ? ' ' + String(d.y).slice(2) : '')));
      svg.appendChild(g);
    });
    return svg;
  }

  // ---------------------------------------------------------------- tables: sorting, selection, bulk actions
  function sortTh(state, key, label, cls, firstDir) {
    var on = state.sort.key === key;
    return h('th', { class: (cls || '') + ' sortable' + (on ? ' sorted' : ''), 'aria-sort': on ? (state.sort.dir === 'asc' ? 'ascending' : 'descending') : 'none' },
      h('button', { type: 'button', class: 'th-btn', onclick: function () {
        if (state.sort.key === key) state.sort.dir = state.sort.dir === 'asc' ? 'desc' : 'asc';
        else { state.sort.key = key; state.sort.dir = firstDir || 'asc'; }
        render();
      } }, label, h('span', { class: 'sort-arrow', 'aria-hidden': 'true' }, on ? (state.sort.dir === 'asc' ? '↑' : '↓') : '')));
  }

  function sortList(list, sort, getters) {
    var g = getters[sort.key];
    if (!g) return list;
    var dir = sort.dir === 'desc' ? -1 : 1;
    return list.slice().sort(function (a, b) {
      var x = g(a), y = g(b);
      var c = typeof x === 'string' || typeof y === 'string' ? String(x).localeCompare(String(y), 'en', { sensitivity: 'base' }) : (x || 0) - (y || 0);
      return c * dir;
    });
  }

  // Row checkbox. Shift-click selects everything between this row and the last one clicked.
  function checkCell(state, key, index, keys, label) {
    return h('td', { class: 'check-col', onclick: function (e) { e.stopPropagation(); } }, h('label', { class: 'check' }, h('input', {
      type: 'checkbox', checked: !!state.sel[key], 'aria-label': 'Select ' + label,
      onclick: function (e) {
        var on = e.target.checked;
        if (e.shiftKey && typeof state.lastIdx === 'number') {
          var a = Math.min(state.lastIdx, index), b = Math.max(state.lastIdx, index);
          for (var i = a; i <= b; i++) state.sel[keys[i]] = on;
        } else state.sel[key] = on;
        state.lastIdx = index;
        render();
      }
    })));
  }

  function headCheck(state, keys) {
    var n = keys.filter(function (k) { return state.sel[k]; }).length;
    return h('th', { class: 'check-col' }, h('label', { class: 'check' }, h('input', {
      type: 'checkbox', checked: keys.length > 0 && n === keys.length, indeterminate: n > 0 && n < keys.length, 'aria-label': 'Select all',
      onchange: function (e) { keys.forEach(function (k) { state.sel[k] = e.target.checked; }); state.lastIdx = null; render(); }
    })));
  }

  function bulkBar(count, buttons, clear) {
    return h('div', { class: 'bulk', role: 'region', 'aria-label': count + ' selected' },
      h('span', { class: 'count' }, count + ' selected'), buttons,
      h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Clear selection', 'data-tip': 'Clear selection', onclick: clear }, icon('x', 18)));
  }
  function bbtn(label, ic, fn, danger) {
    return h('button', { type: 'button', class: 'btn btn-sm' + (danger ? ' bulk-danger' : ''), onclick: fn }, ic ? icon(ic, 16) : null, label);
  }

  // Clicking a row opens it, unless the click was on a control inside the row.
  function rowOpen(fn) {
    return function (e) { if (e.target.closest('button, input, select, a, label, textarea')) return; fn(); };
  }

  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }

  // ---------------------------------------------------------------- shared payment actions
  function livePayments(list) { return list.map(function (p) { return st.db.payments[p.id]; }).filter(Boolean); }
  function paymentsOfRows(rows) {
    var out = [];
    rows.forEach(function (r) { r.payments.forEach(function (p) { out.push(p); }); });
    return livePayments(out);
  }

  function setPaymentsPaid(pays, paid, label) {
    pays = livePayments(pays);
    if (!pays.length) return Promise.resolve();
    var undo = snapshot('payments', pays);
    var today0 = L.todayISO();
    var ops = pays.map(function (p) { return updOp('payments', p, { paid: paid, paidAt: paid ? (p.paid && p.paidAt ? p.paidAt : today0) : '' }); });
    return commit(ops).then(function () {
      toast('Marked ' + (label || plural(pays.length, 'payment')) + (paid ? ' as paid' : ' as not paid'), { actions: [{ label: 'Undo', fn: function () { commit(undo); } }] });
    });
  }
  function setRowsPaid(rows, paid) {
    return setPaymentsPaid(paymentsOfRows(rows), paid, rows.length === 1 ? rows[0].name : plural(rows.length, 'artist'));
  }

  function setRowsRate(rows, rate) {
    return commit(paymentsOfRows(rows).map(function (p) { return updOp('payments', p, { rate: rate || 0 }); }));
  }

  // One rate per currency for a set of payments.
  function rateDialog(pays, what) {
    pays = livePayments(pays);
    var curs = {};
    pays.forEach(function (p) { curs[p.cur] = true; });
    var list = Object.keys(curs).sort();
    openModal(function (close) {
      var inputs = {};
      var err = h('div', { class: 'error-text', hidden: true });
      function submit() {
        var ops = [];
        for (var i = 0; i < list.length; i++) {
          var c = list[i], raw = inputs[c].value.trim();
          if (!raw) continue;
          var rate = L.parseRate(raw);
          if (rate === null) { err.textContent = 'Type the rate as a number, like 258300.'; err.hidden = false; return; }
          pays.filter(function (p) { return p.cur === c; }).forEach(function (p) { ops.push(updOp('payments', p, { rate: rate })); });
        }
        close();
        commit(ops).then(function () { if (ops.length) toast('Rate set for ' + what); });
      }
      return modalFrame('Set the rate', 'The rate goes on ' + what + '.', [
        list.map(function (c, i) {
          var same = pays.filter(function (p) { return p.cur === c; }).map(function (p) { return p.rate; });
          var one = same.every(function (x) { return x === same[0]; }) && same[0] ? L.fmtToman(same[0]) : '';
          var inp = inputs[c] = h('input', { class: 'input', inputmode: 'numeric', value: one, placeholder: 'For example 258,300', autofocus: i === 0, onkeydown: function (e) { if (e.key === 'Enter') submit(); } });
          return h('div', { class: 'field' }, h('label', null, 'Toman per ' + (c === 'USD' ? 'US dollar' : L.curInfo(c).name)), inp);
        }),
        err
      ], [h('button', { type: 'button', class: 'btn btn-ghost', onclick: close }, 'Cancel'), h('button', { type: 'button', class: 'btn btn-primary', onclick: submit }, 'Set rate')]);
    });
  }
  function bulkRate(rows) { rateDialog(paymentsOfRows(rows), rows.length === 1 ? rows[0].name + ' for ' + rangeLabel() : plural(rows.length, 'artist') + ' for ' + rangeLabel()); }

  function deletePaymentsDialog(pays, title, text) {
    pays = livePayments(pays);
    if (!pays.length) return;
    confirmDialog({ title: title, text: text, confirm: 'Delete', danger: true }).then(function (ok) {
      if (!ok) return;
      var undo = snapshot('payments', pays);
      st.payouts.sel = {}; st.payments.sel = {};
      commit(pays.map(function (p) { return delOp('payments', p.id); })).then(function () {
        toast(plural(pays.length, 'payment') + ' deleted', { actions: [{ label: 'Undo', fn: function () { commit(undo); } }] });
      });
    });
  }
  function deleteRowsDialog(rows) {
    var pays = paymentsOfRows(rows);
    deletePaymentsDialog(pays,
      rows.length === 1 ? 'Delete ' + rows[0].name + '\'s payments in ' + rangeLabel() + '?' : 'Delete the payments of ' + plural(rows.length, 'artist') + '?',
      plural(pays.length, 'payment') + ' in ' + rangeLabel() + ' will be removed. Other months stay as they are.');
  }

  function artistPicker(selectedId, allowUnnamed) {
    var sel = h('select', { class: 'select' },
      h('option', { value: '' }, 'Choose an artist'),
      values(st.db.artists).filter(function (a) { return allowUnnamed || a.name !== L.UNNAMED; })
        .sort(function (a, b) { return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }); })
        .map(function (a) { return h('option', { value: a.id, selected: a.id === selectedId }, a.name); }),
      h('option', { value: '__new' }, 'New artist…'));
    var newName = h('input', { class: 'input', placeholder: 'Artist name', hidden: true });
    sel.addEventListener('change', function () { newName.hidden = sel.value !== '__new'; if (!newName.hidden) newName.focus(); });
    return {
      node: h('div', { class: 'field-stack' }, sel, newName),
      // Resolves the choice to an artist id, adding a create op when needed.
      resolve: function (ops) {
        if (sel.value === '__new') {
          var nm = L.cleanName(newName.value);
          if (!nm) return { error: 'Type the new artist\'s name.' };
          var existing = values(st.db.artists).filter(function (a) { return L.normName(a.name) === L.normName(nm); })[0];
          if (existing) return { id: existing.id };
          var id = L.uid('a');
          ops.push(putOp('artists', id, { name: nm, custom: false }));
          return { id: id };
        }
        if (!sel.value) return { error: 'Choose an artist.' };
        return { id: sel.value };
      }
    };
  }

  function changeArtistDialog(pays) {
    pays = livePayments(pays);
    openModal(function (close) {
      var picker = artistPicker('', false);
      var err = h('div', { class: 'error-text', hidden: true });
      function submit() {
        var ops = [];
        var res = picker.resolve(ops);
        if (res.error) { err.textContent = res.error; err.hidden = false; return; }
        var name = st.db.artists[res.id] ? st.db.artists[res.id].name : 'the new artist';
        pays.forEach(function (p) { ops.push(updOp('payments', p, { artistId: res.id })); });
        var undo = snapshot('payments', pays);
        close();
        st.payments.sel = {};
        commit(ops).then(function () { toast(plural(pays.length, 'payment') + ' moved to ' + (st.db.artists[res.id] ? st.db.artists[res.id].name : name), { actions: [{ label: 'Undo', fn: function () { commit(undo); } }] }); });
      }
      return modalFrame('Change the artist', 'Move ' + plural(pays.length, 'payment') + ' to another artist.', [h('div', { class: 'field' }, h('label', null, 'Artist'), picker.node), err],
        [h('button', { type: 'button', class: 'btn btn-ghost', onclick: close }, 'Cancel'), h('button', { type: 'button', class: 'btn btn-primary', onclick: submit }, 'Move payments')]);
    });
  }

  // ---------------------------------------------------------------- Excel export
  function saveExcel(name, sheets) {
    if (PHONE) {
      try { readySheet([KIT.file(KIT.buildXlsx(sheets), L.safeFile(name) + '.xlsx')], 'Excel'); } catch (e) { handleError(e); }
      return Promise.resolve();
    }
    var t = toast('Saving the Excel file…', { busy: true });
    return api.post('/api/export', { file: periodFolder() + '/' + L.safeFile(name) + '.xlsx', sheets: sheets }).then(function (res) {
      t.close();
      toast('Saved ' + res.name, { actions: [
        { label: 'Open', fn: function () { openPath(res.path); } },
        { label: 'Show in folder', fn: function () { openPath(res.path, true); } }
      ] });
    }).catch(function (e) { t.close(); handleError(e); });
  }
  function dollars(c) { return c === null || c === undefined ? null : Math.round(c) / 100; }
  function statusWord(s) { return s === 'paid' ? 'Paid' : s === 'partial' ? 'Part paid' : 'Not paid'; }

  function exportPayouts(rows) {
    var s0 = settings();
    var cols = [
      { title: 'Artist', kind: 'text', width: 24 }, { title: 'Currency', kind: 'text', width: 9 }, { title: 'Payments', kind: 'int', width: 10 },
      { title: 'Received', kind: 'money', width: 13 }, { title: 'Commission %', kind: 'text', width: 13 }, { title: 'Commission', kind: 'money', width: 13 },
      { title: 'Artist share', kind: 'money', width: 13 }, { title: s0.ownerName || 'Owner', kind: 'money', width: 12 }, { title: s0.myName || 'You', kind: 'money', width: 12 },
      { title: 'Other managers', kind: 'money', width: 15 }, { title: 'Rate (Toman)', kind: 'int', width: 14 }, { title: 'Toman', kind: 'int', width: 16 },
      { title: 'Status', kind: 'text', width: 11 }, { title: 'Paid on', kind: 'text', width: 13 }
    ];
    var curs = L.currenciesIn(rows);
    var sheets = curs.map(function (c) {
      var list = rows.filter(function (r) { return r.cur === c; });
      var t = L.totals(list)[c];
      return {
        name: 'Payouts ' + c, cols: cols,
        rows: list.map(function (r) {
          return [L.rowLabel(r), r.cur, r.count, dollars(r.received), L.fmtPct(r.feeBP), dollars(r.fee), dollars(r.after), dollars(r.owner), dollars(r.mine),
            dollars(r.managersTotal), r.rate === 'mixed' ? 'Mixed' : (r.rate || null), r.toman, statusWord(r.status), r.paidAt || ''];
        }),
        total: ['Total', c, t.payments, dollars(t.received), '', dollars(t.fee), dollars(t.after), dollars(t.owner), dollars(t.mine), dollars(t.managers), null, t.toman || null, '', '']
      };
    });
    if (!sheets.length) { toast('Nothing to export.', { error: true }); return; }
    saveExcel('Payouts - ' + rangeLabel(), sheets);
  }

  function exportPayments(list) {
    var s0 = settings();
    var rows = list.map(function (p) {
      var a = st.db.artists[p.artistId] || { name: L.UNNAMED };
      var sp = L.splitOf(a, s0);
      var fee = L.roundDiv(p.cents * (sp.ownerBP + sp.managerBP), 10000);
      var share = p.cents - fee;
      return [p.date, L.fmtJDate(p.date), p.time || '', a.name, p.cur, dollars(p.cents), dollars(fee), dollars(share), p.rate || null,
        p.rate ? L.roundDiv(share * p.rate, 100) : null, p.paid ? 'Paid' : 'Not paid', p.paidAt || '', p.note || ''];
    });
    saveExcel('Payments - ' + rangeLabel(), [{
      name: 'Payments',
      cols: [{ title: 'Date', kind: 'text', width: 12 }, { title: 'Jalali date', kind: 'text', width: 16 }, { title: 'Time', kind: 'text', width: 7 },
        { title: 'Artist', kind: 'text', width: 24 }, { title: 'Currency', kind: 'text', width: 9 }, { title: 'Amount', kind: 'money', width: 12 },
        { title: 'Commission', kind: 'money', width: 12 }, { title: 'Artist share', kind: 'money', width: 13 }, { title: 'Rate (Toman)', kind: 'int', width: 13 },
        { title: 'Toman', kind: 'int', width: 15 }, { title: 'Status', kind: 'text', width: 10 }, { title: 'Paid on', kind: 'text', width: 12 }, { title: 'Note', kind: 'text', width: 30 }],
      rows: rows
    }]);
  }

  // ---------------------------------------------------------------- payouts
  var PAYOUT_SORT = {
    name: function (r) { return r.name; },
    received: function (r) { return r.received; },
    after: function (r) { return r.after; },
    toman: function (r) { return r.toman || 0; },
    status: function (r) { return r.status === 'paid' ? 2 : r.status === 'partial' ? 1 : 0; }
  };

  function filteredPayoutRows() {
    var f = st.payouts;
    var q = L.normName(f.q);
    var rows = L.computeRows(st.db, st.period.from, st.period.to).filter(function (r) {
      if (f.cur !== 'all' && r.cur !== f.cur) return false;
      if (f.status === 'paid' && r.status !== 'paid') return false;
      if (f.status === 'unpaid' && r.status === 'paid') return false;
      if (q && L.normName(r.name).indexOf(q) < 0) return false;
      return true;
    });
    var sorted = sortList(rows, f.sort, PAYOUT_SORT);
    // Sorted by name, payments without a name stay together at the end, oldest first.
    if (f.sort.key === 'name') return sorted.filter(function (r) { return !r.unnamed; }).concat(rows.filter(function (r) { return r.unnamed; }));
    return sorted;
  }

  function distinctArtists(rows) {
    var seen = {};
    rows.forEach(function (r) { seen[r.artistId] = true; });
    return Object.keys(seen);
  }

  function pagePayouts() {
    var all = L.computeRows(st.db, st.period.from, st.period.to);
    var rows = filteredPayoutRows();
    var curs = L.currenciesIn(all);
    var f = st.payouts;
    var named = all.filter(function (r) { return !r.unnamed; });
    var unnamedN = all.length - named.length;
    var paidN = named.filter(function (r) { return r.status === 'paid'; }).length;
    var sub = all.length ? (named.length ? paidN + ' of ' + plural(named.length, 'artist') + ' paid' : '') +
      (unnamedN ? (named.length ? ', ' : '') + plural(unnamedN, 'payment') + ' without a name' : '') : null;
    var head = pageHead('Payouts', sub, [
      periodButton(),
      h('button', { type: 'button', class: 'btn', disabled: !rows.length, onclick: function () { exportPayouts(rows); } }, icon('sheet', 17), 'Export to Excel'),
      h('button', { type: 'button', class: 'btn', disabled: !rows.length, onclick: function () { saveManyPdfs(rows); }, 'data-tip': 'One PDF for each artist in the list' }, icon('file', 17), 'Save all PDFs')
    ]);
    if (!all.length) {
      st.deleteSelected = null;
      return h('div', null, head, h('div', { class: 'page-body' }, h('section', { class: 'panel' },
        emptyState('No payments in ' + rangeLabel(), 'Import a message log, or pick another period.',
          h('button', { type: 'button', class: 'btn btn-primary', onclick: function () { go('import'); } }, icon('import', 17), 'Import payments')))));
    }
    var keys = rows.map(function (r) { return r.key; });
    var selected = rows.filter(function (r) { return f.sel[r.key]; });

    var toolbar = h('div', { class: 'toolbar' },
      searchBox(f.q, 'Search artists', 'payouts-q', function (v) { f.q = v; render(); }),
      curs.length > 1 ? seg([{ value: 'all', label: 'All' }].concat(curs.map(function (c) { return { value: c, label: c }; })), f.cur, function (v) { f.cur = v; render(); }, 'Currency') : null,
      seg([{ value: 'all', label: 'All' }, { value: 'unpaid', label: 'Not paid' }, { value: 'paid', label: 'Paid' }], f.status, function (v) { f.status = v; render(); }, 'Status'),
      h('div', { class: 'spacer' }),
      h('span', { class: 'faint small' }, rows.length === all.length ? plural(rows.length, 'row') : rows.length + ' of ' + all.length + ' rows'));

    var body = rows.map(function (r, i) {
      var checked = !!f.sel[r.key];
      var open = function () { if (r.unnamed) editPayment(st.db.payments[r.paymentId]); else openDrawer({ kind: 'artist', key: r.key, tab: 'statement' }); };
      return h('tr', { class: 'row-click' + (checked ? ' selected' : ''), onclick: rowOpen(open) },
        checkCell(f, r.key, i, keys, r.name),
        h('td', null,
          h('div', { class: 'who' }, avatar(r.name), h('div', { class: 'who-text' },
            h('div', { class: 'who-name' }, r.name),
            h('span', { class: 'sub' }, r.unnamed ? L.fmtDate(r.payments[0].date, { short: true }) + (r.payments[0].time ? ', ' + r.payments[0].time : '') + ', needs a name' : plural(r.count, 'payment') + (r.custom ? ', custom split' : ''))))),
        h('td', { class: 'num' }, money(r.received, r.cur)),
        h('td', { class: 'num muted' }, money(r.fee, r.cur), r.custom ? h('span', { class: 'sub' }, L.fmtPct(r.feeBP)) : null),
        h('td', { class: 'num strong' }, money(r.after, r.cur)),
        h('td', { class: 'num' }, rateInput(r, i)),
        h('td', { class: 'num' }, r.toman ? L.fmtToman(r.toman) : h('span', { class: 'faint' }, '—')),
        h('td', null, statusButton(r.status, function () { setRowsPaid([r], r.status !== 'paid'); }, r.name)),
        h('td', { class: 'act-col' },
          h('button', { type: 'button', class: 'icon-btn', 'data-tip': r.unnamed ? 'Give it a name' : 'Edit artist', 'aria-label': 'Edit ' + r.name, onclick: function () { if (r.unnamed) editPayment(st.db.payments[r.paymentId]); else { var a = st.db.artists[r.artistId]; if (a) editArtist(a); } } }, icon('edit', 18)),
          r.unnamed ? h('span', { class: 'icon-btn icon-space', 'aria-hidden': 'true' }) : h('button', { type: 'button', class: 'icon-btn', 'data-tip': 'Save PDF', 'aria-label': 'Save PDF for ' + r.name, onclick: function () { saveArtistPdf(r); } }, icon('file', 18)),
          h('button', { type: 'button', class: 'icon-btn danger', 'data-tip': r.unnamed ? 'Delete this payment' : 'Delete these payments', 'aria-label': 'Delete payments of ' + r.name, onclick: function () { deleteRowsDialog([r]); } }, icon('trash', 18))));
    });

    var tot = L.totals(rows);
    var foot = L.currenciesIn(rows).map(function (c) {
      var t = tot[c];
      return h('tr', null,
        h('td', null), h('td', null, 'Total ' + c),
        h('td', { class: 'num' }, money(t.received, c)), h('td', { class: 'num' }, money(t.fee, c)), h('td', { class: 'num' }, money(t.after, c)),
        h('td', null), h('td', { class: 'num' }, t.toman ? L.fmtToman(t.toman) : ''),
        h('td', { class: 'muted', colspan: 2 }, t.unpaidArtists ? money(t.unpaid, c) + ' still to pay' : 'All paid'));
    });

    var table = h('section', { class: 'panel panel-flush' }, toolbar,
      rows.length ? h('div', { class: 'table-wrap' }, h('table', { class: 'tbl' },
        h('thead', null, h('tr', null,
          headCheck(f, keys),
          sortTh(f, 'name', 'Artist'), sortTh(f, 'received', 'Received', 'num', 'desc'), h('th', { class: 'num' }, 'Commission'), sortTh(f, 'after', 'Artist share', 'num', 'desc'),
          h('th', { class: 'num' }, 'Rate (Toman)'), sortTh(f, 'toman', 'Toman', 'num', 'desc'), sortTh(f, 'status', 'Status'), h('th', { class: 'act-col' }))),
        h('tbody', null, body),
        h('tfoot', null, foot))) : emptyState('Nothing matches', 'Clear the search or the filters to see every artist.'));

    var bulk = null;
    st.deleteSelected = selected.length ? function () { deleteRowsDialog(selected); } : null;
    if (selected.length) {
      var artistsSel = distinctArtists(selected.filter(function (r) { return !r.unnamed; }));
      var unnamedSel = selected.filter(function (r) { return r.unnamed; });
      var one = selected.length === 1 ? selected[0] : null;
      bulk = bulkBar(selected.length, [
        one ? bbtn(one.unnamed ? 'Give a name' : 'Edit', 'edit', function () { if (one.unnamed) editPayment(st.db.payments[one.paymentId]); else { var a = st.db.artists[one.artistId]; if (a) editArtist(a); } }) : null,
        unnamedSel.length > 1 ? bbtn('Give names', 'user', function () { nameUnnamedDialog(paymentsOfRows(unnamedSel)); }) : null,
        bbtn('Set rate', null, function () { bulkRate(selected); }),
        bbtn('Mark as paid', 'check', function () { setRowsPaid(selected, true); }),
        bbtn('Mark as not paid', null, function () { setRowsPaid(selected, false); }),
        bbtn('Save PDFs', 'file', function () { saveManyPdfs(selected); }),
        bbtn('Excel', 'sheet', function () { exportPayouts(selected); }),
        artistsSel.length > 1 ? bbtn('Merge', 'merge', function () { mergeArtistsDialog(artistsSel); }) : null,
        bbtn('Delete', 'trash', function () { deleteRowsDialog(selected); }, true)
      ], function () { f.sel = {}; render(); });
    }
    return h('div', null, head, h('div', { class: 'page-body' }, table, bulk));
  }

  // ---------------------------------------------------------------- artist drawer
  function drawerArtist(d) {
    var rows = L.computeRows(st.db, st.period.from, st.period.to);
    var r = rows.filter(function (x) { return x.key === d.key; })[0];
    if (!r || r.unnamed) return null;
    var artist = st.db.artists[r.artistId];
    var multi = rows.filter(function (x) { return x.artistId === r.artistId; }).length > 1;
    var tab = d.tab || 'statement';
    return h('aside', { class: 'drawer', role: 'dialog', 'aria-modal': 'true', 'aria-label': r.name },
      h('div', { class: 'drawer-head' },
        h('div', { class: 'drawer-title' }, avatar(r.name, 'lg'),
          h('div', null, h('h2', null, r.name), h('div', { class: 'muted small' }, plural(r.count, 'payment') + ' in ' + rangeLabel() + (multi ? ', ' + L.curInfo(r.cur).name : '') + (artist && artist.note ? '. ' + artist.note : ''))),
          h('button', { type: 'button', class: 'icon-btn drawer-close', 'aria-label': 'Close', onclick: closeDrawer }, icon('x', 20))),
        h('div', { class: 'row wrap' },
          h('div', { class: 'field' }, h('span', { class: 'hint' }, 'Rate (Toman per ' + L.curInfo(r.cur).symbol.trim() + ')'), rateInput(r, 'd')),
          h('div', { class: 'field' }, h('span', { class: 'hint' }, 'Status'), statusButton(r.status, function () { setRowsPaid([r], r.status !== 'paid'); }, r.name)),
          h('div', { style: { flex: '1' } }),
          artist ? h('button', { type: 'button', class: 'btn btn-ghost', onclick: function () { editArtist(artist); } }, icon('edit', 17), 'Edit artist') : null,
          h('button', { type: 'button', class: 'btn btn-primary', onclick: function () { saveArtistPdf(r); } }, icon('file', 17), 'Save PDF')),
        seg([{ value: 'statement', label: 'Statement' }, { value: 'payments', label: 'Payments (' + r.count + ')' }], tab, function (v) { st.drawer.tab = v; render(); }, 'View')),
      h('div', { class: 'drawer-body' },
        tab === 'statement'
          ? statementPreview('artist', { artistId: r.artistId, cur: r.cur, from: st.period.from, to: st.period.to })
          : drawerPayments(r)));
  }

  function drawerPayments(r) {
    var pays = livePayments(r.payments).sort(function (a, b) { return (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')); });
    return h('section', { class: 'panel panel-flush' },
      h('div', { class: 'panel-head', style: { paddingBottom: '12px' } }, h('h2', { class: 'panel-title' }, 'Payments in ' + rangeLabel()),
        h('button', { type: 'button', class: 'btn btn-sm', onclick: function () { editPayment(null, { artistId: r.artistId, cur: r.cur }); } }, icon('plus', 16), 'Add payment')),
      h('div', { class: 'table-wrap' }, h('table', { class: 'tbl' },
        h('thead', null, h('tr', null, h('th', null, 'Date'), h('th', { class: 'num' }, 'Amount'), h('th', { class: 'num' }, 'Rate'), h('th', null, 'Status'), h('th', { class: 'act-col' }))),
        h('tbody', null, pays.map(function (p) {
          return h('tr', { class: 'row-click', onclick: rowOpen(function () { editPayment(p); }) },
            h('td', { class: 'nowrap' }, L.fmtDate(p.date), h('span', { class: 'sub' }, L.fmtJDate(p.date) + (p.note ? ', ' + p.note : ''))),
            h('td', { class: 'num strong' }, money(p.cents, p.cur)),
            h('td', { class: 'num' }, p.rate ? L.fmtToman(p.rate) : h('span', { class: 'faint' }, '—')),
            h('td', null, statusButton(p.paid ? 'paid' : 'unpaid', function () { setPaymentsPaid([p], !p.paid, 'the payment'); })),
            h('td', { class: 'act-col' },
              h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Edit payment', 'data-tip': 'Edit', onclick: function () { editPayment(p); } }, icon('edit', 18)),
              h('button', { type: 'button', class: 'icon-btn danger', 'aria-label': 'Delete payment', 'data-tip': 'Delete', onclick: function () { deletePayment(p); } }, icon('trash', 18))));
        })))));
  }

  // ---------------------------------------------------------------- import
  var parseTimer = null;
  function reparse() {
    var text = st.imp.text;
    if (!text.trim()) { st.imp.parsed = null; st.imp.plan = null; return; }
    st.imp.parsed = L.parseText(text, { today: L.todayISO() });
    st.imp.plan = L.planImport(st.db, st.imp.parsed);
  }
  function findArtistByName(name) {
    var n = L.normName(name);
    return values(st.db.artists).filter(function (a) { return L.normName(a.name) === n; })[0] || null;
  }

  function pageImport() {
    var plan = st.imp.plan;
    st.deleteSelected = null;
    var head = pageHead('Import', 'Paste the messages you copied. Splits finds every name and amount and skips photos, dates and exchange rates. Check the list, fix any name, then import.');
    var textarea = h('textarea', {
      class: 'input paste', 'data-fk': 'import-text', spellcheck: 'false', value: st.imp.text,
      placeholder: '[11/4/2026 1:38 PM] -: [ image.png ]\n\nPidar +$421.48 ✅\n\n[11/4/2026 3:18 PM] -: [ Photo ]\n\nPoori\n\nAmount you will receive\n2,680.35 CAD',
      'aria-label': 'Messages to import',
      oninput: function (e) {
        st.imp.text = e.target.value;
        clearTimeout(parseTimer);
        parseTimer = setTimeout(function () { reparse(); render(); }, 220);
      }
    });
    var left = h('section', { class: 'panel' },
      h('div', { class: 'panel-head' }, h('h2', { class: 'panel-title' }, 'Messages'),
        st.imp.text ? h('button', { type: 'button', class: 'btn btn-sm btn-ghost', onclick: function () { st.imp.text = ''; reparse(); render(); } }, 'Clear') : null),
      h('div', { class: 'panel-body' }, textarea));

    var right;
    if (!plan) {
      right = h('section', { class: 'panel' }, emptyState('Nothing to import yet', 'The payments Splits finds show up here, so you can check and fix them before they go in.'));
    } else {
      var newOnes = plan.filter(function (p) { return !p.duplicate; });
      var chosen = plan.filter(function (p) { return p.include; });
      var dups = plan.length - newOnes.length;
      var unnamed = plan.filter(function (p) { return p.include && p.row.unnamed; }).length;
      var newArtists = {};
      chosen.forEach(function (p) { if (!p.artist && !p.row.unnamed) newArtists[L.normName(p.row.name)] = true; });
      var totalsBy = {};
      chosen.forEach(function (p) { totalsBy[p.row.cur] = (totalsBy[p.row.cur] || 0) + p.row.cents; });
      var ignored = st.imp.parsed.ignored;
      var datalist = h('datalist', { id: 'artist-names' }, values(st.db.artists).filter(function (a) { return a.name !== L.UNNAMED; }).map(function (a) { return h('option', { value: a.name }); }));
      var allIncluded = newOnes.length > 0 && newOnes.every(function (p) { return p.include; });
      right = h('section', { class: 'panel panel-flush' },
        h('div', { class: 'panel-head' }, h('h2', { class: 'panel-title' }, plural(plan.length, 'payment') + ' found')),
        h('div', { class: 'panel-body', style: { paddingBottom: '14px' } },
          h('div', { class: 'import-summary' },
            h('span', { class: 'tag new' }, newOnes.length + ' new'),
            dups ? h('span', { class: 'tag' }, dups + ' already imported') : null,
            Object.keys(newArtists).length ? h('span', { class: 'tag' }, plural(Object.keys(newArtists).length, 'new artist')) : null,
            unnamed ? h('span', { class: 'tag warn' }, unnamed + ' without a name') : null),
          chosen.length ? h('div', { class: 'import-totals', style: { marginTop: '14px' } }, Object.keys(totalsBy).map(function (c) {
            return h('div', null, h('div', { class: 'faint small' }, 'To import in ' + c), h('b', null, money(totalsBy[c], c)));
          })) : null,
          unnamed ? h('div', { class: 'hint', style: { marginTop: '10px' } }, 'Type a name in the empty boxes, or import them as Unnamed and name them later.') : null,
          ignored.length ? h('details', { class: 'ignored' }, h('summary', null, plural(ignored.length, 'line') + ' didn\'t look like a payment'),
            h('ul', null, ignored.slice(0, 40).map(function (l) { return h('li', null, l); }))) : null),
        datalist,
        h('div', { class: 'table-wrap', style: { maxHeight: '440px', overflowY: 'auto', borderTop: '1px solid var(--line)' } }, h('table', { class: 'tbl imp-tbl' },
          h('thead', null, h('tr', null,
            h('th', { class: 'check-col' }, h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: allIncluded, 'aria-label': 'Import all new payments', onchange: function (e) { newOnes.forEach(function (p) { p.include = e.target.checked; }); render(); } }))),
            h('th', null, 'Date'), h('th', null, 'Artist'), h('th', { class: 'num' }, 'Amount'), h('th', null, ''))),
          h('tbody', null, plan.map(function (p, idx) {
            var r = p.row;
            var nameIn = h('input', {
              class: 'input input-sm' + (r.unnamed && p.include ? ' warn' : ''), value: r.unnamed ? '' : r.name, list: 'artist-names',
              placeholder: 'Artist name', 'data-fk': 'imp-name-' + idx, disabled: p.duplicate, 'aria-label': 'Artist name',
              onkeydown: function (e) { if (e.key === 'Enter') e.target.blur(); },
              onchange: function (e) {
                var v = L.cleanName(e.target.value);
                if (v && L.normName(v) !== L.normName(L.UNNAMED)) { r.name = v; r.unnamed = false; } else { r.name = L.UNNAMED; r.unnamed = true; }
                p.artist = r.unnamed ? null : findArtistByName(r.name);
                render();
              }
            });
            var dateCell = r.dated ? h('td', { class: 'nowrap' }, L.fmtDate(r.date), h('span', { class: 'sub' }, L.fmtJDate(r.date)))
              : h('td', null, h('input', { class: 'input input-sm', type: 'date', value: r.date, 'aria-label': 'Date', onchange: function (e) { if (e.target.value) { r.date = e.target.value; render(); } } }), h('span', { class: 'sub' }, 'No date in the text'));
            return h('tr', { class: p.duplicate ? 'dup' : '' },
              h('td', { class: 'check-col' }, h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: p.include, 'aria-label': 'Import ' + r.name, onchange: function (e) { p.include = e.target.checked; render(); } }))),
              dateCell,
              h('td', { class: 'name-cell' }, nameIn),
              h('td', { class: 'num' }, money(r.cents, r.cur)),
              h('td', null, p.duplicate ? h('span', { class: 'faint small' }, 'Already imported') : !p.artist && !r.unnamed ? h('span', { class: 'tag new' }, 'New artist') : null));
          })))),
        h('div', { class: 'modal-foot', style: { borderTop: '1px solid var(--line)' } },
          h('button', { type: 'button', class: 'btn btn-primary', disabled: !chosen.length, onclick: doImport }, icon('import', 17),
            chosen.length ? 'Import ' + plural(chosen.length, 'payment') : 'Nothing new to import')));
    }

    var imports = values(st.db.imports).sort(function (a, b) { return (b.at || 0) - (a.at || 0); }).slice(0, 12);
    var history = imports.length ? h('section', { class: 'panel panel-flush' },
      h('div', { class: 'panel-head', style: { paddingBottom: '12px' } }, h('h2', { class: 'panel-title' }, 'Recent imports')),
      h('div', { class: 'table-wrap' }, h('table', { class: 'tbl' },
        h('thead', null, h('tr', null, h('th', null, 'Imported'), h('th', { class: 'num' }, 'Payments'), h('th', { class: 'num' }, 'Total'), h('th', { class: 'act-col' }))),
        h('tbody', null, imports.map(function (im) {
          var live = values(st.db.payments).filter(function (p) { return p.importId === im.id; }).length;
          return h('tr', null,
            h('td', null, L.fmtTimestamp(im.at)),
            h('td', { class: 'num' }, live === im.count ? String(im.count) : live + ' of ' + im.count),
            h('td', { class: 'num' }, Object.keys(im.totals || {}).map(function (c) { return h('div', null, money(im.totals[c], c)); })),
            h('td', { class: 'act-col' }, h('button', { type: 'button', class: 'btn btn-sm btn-ghost', disabled: !live, onclick: function () { undoImport(im); } }, 'Undo')));
        }))))) : null;

    return h('div', null, head, h('div', { class: 'page-body' }, h('div', { class: 'grid-import' }, left, right), history));
  }

  function doImport() {
    var res = L.importOps(st.db, st.imp.plan, { now: Date.now() });
    if (!res.count) return;
    commit(res.ops).then(function () {
      var chosen = st.imp.plan.filter(function (p) { return p.include; });
      var dates = chosen.map(function (p) { return p.row.date; }).sort();
      st.imp.text = '';
      reparse();
      var inPeriod = dates.every(function (d) { return d >= st.period.from && d <= st.period.to; });
      if (!inPeriod && dates.length) {
        var a = L.parseISO(dates[0]), b = L.parseISO(dates[dates.length - 1]);
        if (a.y === b.y && a.m === b.m) { var r = L.monthRange(a.y, a.m); st.period = { preset: 'month', from: r.from, to: r.to }; }
        else st.period = { preset: 'custom', from: L.monthRange(a.y, a.m).from, to: L.monthRange(b.y, b.m).to };
      }
      render();
      toast('Imported ' + plural(res.count, 'payment'), { actions: [{ label: 'Open payouts', fn: function () { go('payouts'); } }] });
    });
  }

  function undoImport(im) {
    var pays = values(st.db.payments).filter(function (p) { return p.importId === im.id; });
    confirmDialog({ title: 'Undo this import?', text: 'Its ' + plural(pays.length, 'payment') + ' will be removed from the ledger. You can import the same messages again later.', confirm: 'Undo import', danger: true }).then(function (ok) {
      if (!ok) return;
      var ops = pays.map(function (p) { return delOp('payments', p.id); });
      ops.push(delOp('imports', im.id));
      commit(ops).then(function () { reparse(); render(); toast('Import undone'); });
    });
  }

  // ---------------------------------------------------------------- payments
  function paymentsSortGetters() {
    return {
      date: function (p) { return p.date + ' ' + (p.time || ''); },
      artist: function (p) { var a = st.db.artists[p.artistId]; return a ? a.name : ''; },
      amount: function (p) { return p.cents; },
      rate: function (p) { return p.rate || 0; },
      status: function (p) { return p.paid ? 1 : 0; }
    };
  }

  function pagePayments() {
    var f = st.payments;
    var q = L.normName(f.q);
    var all = values(st.db.payments).filter(function (p) { return p.date >= st.period.from && p.date <= st.period.to; });
    var curs = {};
    all.forEach(function (p) { curs[p.cur] = true; });
    var unnamedN = all.filter(function (p) { var a = st.db.artists[p.artistId]; return a && a.name === L.UNNAMED; }).length;
    if (f.status === 'unnamed' && !unnamedN) f.status = 'all';
    var list = sortList(all.filter(function (p) {
      var a = st.db.artists[p.artistId];
      if (f.cur !== 'all' && p.cur !== f.cur) return false;
      if (f.status === 'paid' && !p.paid) return false;
      if (f.status === 'unpaid' && p.paid) return false;
      if (f.status === 'unnamed' && !(a && a.name === L.UNNAMED)) return false;
      if (q && L.normName(a ? a.name : '').indexOf(q) < 0 && L.normName(p.note || '').indexOf(q) < 0) return false;
      return true;
    }), f.sort, paymentsSortGetters());
    var head = pageHead('Payments', 'Every payment on its own. Click one to change it, or select several to change them together.', [
      periodButton(),
      h('button', { type: 'button', class: 'btn', disabled: !list.length, onclick: function () { exportPayments(list); } }, icon('sheet', 17), 'Export to Excel'),
      h('button', { type: 'button', class: 'btn btn-primary', onclick: function () { editPayment(null); } }, icon('plus', 17), 'Add payment')
    ]);
    var curList = Object.keys(curs).sort();
    var statusOpts = [{ value: 'all', label: 'All' }, { value: 'unpaid', label: 'Not paid' }, { value: 'paid', label: 'Paid' }];
    if (unnamedN) statusOpts.push({ value: 'unnamed', label: 'Unnamed (' + unnamedN + ')' });
    var toolbar = h('div', { class: 'toolbar' },
      searchBox(f.q, 'Search artists or notes', 'payments-q', function (v) { f.q = v; render(); }),
      curList.length > 1 ? seg([{ value: 'all', label: 'All' }].concat(curList.map(function (c) { return { value: c, label: c }; })), f.cur, function (v) { f.cur = v; render(); }, 'Currency') : null,
      seg(statusOpts, f.status, function (v) { f.status = v; render(); }, 'Status'),
      h('div', { class: 'spacer' }),
      h('span', { class: 'faint small' }, plural(list.length, 'payment')));
    var shown = list.slice(0, 800);
    var keys = shown.map(function (p) { return p.id; });
    var selected = shown.filter(function (p) { return f.sel[p.id]; });
    var table = list.length ? h('div', { class: 'table-wrap' }, h('table', { class: 'tbl' },
      h('thead', null, h('tr', null, headCheck(f, keys), sortTh(f, 'date', 'Date', '', 'desc'), sortTh(f, 'artist', 'Artist'), sortTh(f, 'amount', 'Amount', 'num', 'desc'), sortTh(f, 'rate', 'Rate', 'num', 'desc'), sortTh(f, 'status', 'Status'), h('th', { class: 'act-col' }))),
      h('tbody', null, shown.map(function (p, i) {
        var a = st.db.artists[p.artistId] || { name: L.UNNAMED };
        var unnamed = a.name === L.UNNAMED;
        var checked = !!f.sel[p.id];
        return h('tr', { class: 'row-click' + (checked ? ' selected' : ''), onclick: rowOpen(function () { editPayment(p); }) },
          checkCell(f, p.id, i, keys, a.name + ' ' + money(p.cents, p.cur)),
          h('td', { class: 'nowrap' }, L.fmtDate(p.date), h('span', { class: 'sub' }, L.fmtJDate(p.date) + (p.time ? ', ' + p.time : ''))),
          h('td', null, unnamed
            ? h('button', { type: 'button', class: 'link-btn', onclick: function () { editPayment(p); } }, 'Choose artist')
            : h('div', { class: 'who' }, avatar(a.name), h('div', { class: 'who-text' }, h('div', { class: 'who-name' }, a.name), p.note ? h('span', { class: 'sub' }, p.note) : null))),
          h('td', { class: 'num strong' }, money(p.cents, p.cur)),
          h('td', { class: 'num' }, p.rate ? L.fmtToman(p.rate) : h('span', { class: 'faint' }, '—')),
          h('td', null, statusButton(p.paid ? 'paid' : 'unpaid', function () { setPaymentsPaid([p], !p.paid, 'the payment'); }, a.name)),
          h('td', { class: 'act-col' },
            h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Edit payment', 'data-tip': 'Edit', onclick: function () { editPayment(p); } }, icon('edit', 18)),
            h('button', { type: 'button', class: 'icon-btn danger', 'aria-label': 'Delete payment', 'data-tip': 'Delete', onclick: function () { deletePayment(p); } }, icon('trash', 18))));
      })))) : emptyState(all.length ? 'Nothing matches' : 'No payments in ' + rangeLabel(), all.length ? 'Clear the search or the filters.' : 'Import messages or add a payment by hand.');
    var bulk = null;
    st.deleteSelected = selected.length ? function () { deletePaymentsDialog(selected, 'Delete ' + plural(selected.length, 'payment') + '?', 'They will be removed from the ledger.'); } : null;
    if (selected.length) {
      bulk = bulkBar(selected.length, [
        selected.length === 1 ? bbtn('Edit', 'edit', function () { editPayment(selected[0]); }) : null,
        bbtn('Change artist', 'user', function () { changeArtistDialog(selected); }),
        selected.filter(isUnnamedPayment).length > 1 ? bbtn('Give names', 'user', function () { nameUnnamedDialog(selected.filter(isUnnamedPayment)); }) : null,
        bbtn('Set rate', null, function () { rateDialog(selected, plural(selected.length, 'payment')); }),
        bbtn('Mark as paid', 'check', function () { setPaymentsPaid(selected, true); }),
        bbtn('Mark as not paid', null, function () { setPaymentsPaid(selected, false); }),
        bbtn('Delete', 'trash', st.deleteSelected, true)
      ], function () { f.sel = {}; render(); });
    }
    return h('div', null, head, h('div', { class: 'page-body' }, h('section', { class: 'panel panel-flush' }, toolbar, table), bulk));
  }

  function editPayment(p, defaults) {
    var isNew = !p;
    defaults = defaults || {};
    p = p || { artistId: defaults.artistId || '', date: defaults.date || L.todayISO(), time: '', cur: defaults.cur || 'USD', cents: 0, rate: 0, paid: false, paidAt: '', note: '' };
    var artist = st.db.artists[p.artistId];
    openModal(function (close) {
      var err = h('div', { class: 'error-text', hidden: true });
      var picker = artistPicker(artist && artist.name !== L.UNNAMED ? p.artistId : '', false);
      var date = h('input', { class: 'input', type: 'date', value: p.date });
      var jHint = h('span', { class: 'hint' }, L.fmtJDate(p.date));
      date.addEventListener('change', function () { jHint.textContent = L.fmtJDate(date.value); });
      var amount = h('input', { class: 'input', inputmode: 'decimal', value: p.cents ? (p.cents / 100).toFixed(2) : '', placeholder: '0.00' });
      var curList = ['USD', 'CAD'];
      if (p.cur && curList.indexOf(p.cur) < 0) curList.push(p.cur);
      var cur = h('select', { class: 'select' }, curList.map(function (c) { return h('option', { value: c, selected: c === p.cur }, c + '  ' + L.curInfo(c).name); }));
      var rate = h('input', { class: 'input', inputmode: 'numeric', value: p.rate ? L.fmtToman(p.rate) : '', placeholder: 'Optional' });
      var paid = h('input', { type: 'checkbox', checked: !!p.paid });
      var paidAt = h('input', { class: 'input', type: 'date', value: p.paidAt || L.todayISO(), 'aria-label': 'Paid on' });
      var paidWrap = h('div', { class: 'field', hidden: !p.paid }, h('label', null, 'Paid on'), paidAt);
      paid.addEventListener('change', function () { paidWrap.hidden = !paid.checked; });
      var note = h('input', { class: 'input', value: p.note || '', placeholder: 'Optional, for example how it was paid' });
      function submit() {
        var ops = [];
        var res = picker.resolve(ops);
        var aid = res.id;
        if (res.error) {
          if (artist && artist.name === L.UNNAMED && !isNew) aid = p.artistId;
          else { err.textContent = res.error; err.hidden = false; return; }
        }
        var cents = L.parseMoney(amount.value);
        if (cents === null || cents === 0) { err.textContent = 'Type the amount, like 421.48.'; err.hidden = false; return; }
        if (!date.value) { err.textContent = 'Choose the date.'; err.hidden = false; return; }
        var r = rate.value.trim() ? L.parseRate(rate.value) : 0;
        if (r === null) { err.textContent = 'Type the rate as a number, like 258300.'; err.hidden = false; return; }
        var body = Object.assign(isNew ? {} : bodyOf(p), {
          artistId: aid, date: date.value, cur: cur.value, cents: cents, rate: r,
          paid: paid.checked, paidAt: paid.checked ? (paidAt.value || L.todayISO()) : '', note: note.value.trim()
        });
        if (isNew) { body.time = ''; body.key = 'manual|' + L.uid('k'); body.importId = ''; }
        ops.push(putOp('payments', isNew ? L.uid('p') : p.id, body));
        close();
        commit(ops).then(function () { toast(isNew ? 'Payment added' : 'Payment saved'); });
      }
      return modalFrame(isNew ? 'Add a payment' : 'Edit payment', null, [
        h('div', { class: 'field' }, h('label', null, 'Artist'), picker.node, artist && artist.name === L.UNNAMED && !isNew ? h('span', { class: 'hint' }, 'This payment came in without a name. Choose its artist.') : null),
        h('div', { class: 'cols-2' }, h('div', { class: 'field' }, h('label', null, 'Date'), date, jHint), h('div', { class: 'field' }, h('label', null, 'Currency'), cur)),
        h('div', { class: 'cols-2' }, h('div', { class: 'field' }, h('label', null, 'Amount received'), amount), h('div', { class: 'field' }, h('label', null, 'Rate in Toman'), rate)),
        h('label', { class: 'check' }, paid, 'The artist has been paid'),
        paidWrap,
        h('div', { class: 'field' }, h('label', null, 'Note'), note),
        err
      ], [h('button', { type: 'button', class: 'btn btn-ghost', onclick: close }, 'Cancel'), h('button', { type: 'button', class: 'btn btn-primary', onclick: submit }, isNew ? 'Add payment' : 'Save')],
      isNew ? null : h('button', { type: 'button', class: 'btn btn-danger', onclick: function () { close(); deletePayment(p); } }, icon('trash', 16), 'Delete'));
    });
  }

  function deletePayment(p) {
    var a = st.db.artists[p.artistId];
    deletePaymentsDialog([p], 'Delete this payment?', money(p.cents, p.cur) + ' for ' + (a ? a.name : L.UNNAMED) + ' on ' + L.fmtDate(p.date) + '.');
  }

  // ---------------------------------------------------------------- artists
  var ARTIST_SORT = {
    name: function (x) { return x.a.name; },
    count: function (x) { return x.count; },
    received: function (x) { return x.receivedSort; },
    unpaid: function (x) { return x.unpaidSort; },
    last: function (x) { return x.last; }
  };

  function pageArtists() {
    var s0 = settings();
    var f = st.artists;
    var stats = {};
    values(st.db.payments).forEach(function (p) {
      var x = stats[p.artistId] || (stats[p.artistId] = { count: 0, by: {}, last: '' });
      x.count++;
      x.by[p.cur] = (x.by[p.cur] || 0) + p.cents;
      if (p.date > x.last) x.last = p.date;
    });
    var unpaid = {};
    L.computeRows(st.db, '2000-01-01', '2099-12-31').forEach(function (r) {
      if (!r.unpaid) return;
      var u = unpaid[r.artistId] || (unpaid[r.artistId] = {});
      u[r.cur] = (u[r.cur] || 0) + r.unpaid;
    });
    var unnamedPays = values(st.db.payments).filter(isUnnamedPayment);
    var items = values(st.db.artists).filter(function (a) { return a.name !== L.UNNAMED; }).map(function (a) {
      var x = stats[a.id] || { count: 0, by: {}, last: '' };
      var u = unpaid[a.id] || {};
      return { a: a, count: x.count, by: x.by, last: x.last, unpaid: u,
        receivedSort: Object.keys(x.by).reduce(function (s, c) { return s + x.by[c]; }, 0),
        unpaidSort: Object.keys(u).reduce(function (s, c) { return s + u[c]; }, 0) };
    });
    var q = L.normName(f.q || '');
    var shown = sortList(items.filter(function (x) { return !q || L.normName(x.a.name).indexOf(q) >= 0 || L.normName(x.a.note || '').indexOf(q) >= 0; }), f.sort, ARTIST_SORT);
    var head = pageHead('Artists', plural(items.length, 'artist') + '. Default split: ' + (s0.ownerName || 'Owner') + ' ' + L.fmtPct(s0.ownerBP) + ', ' + (s0.myName || 'You') + ' ' + L.fmtPct(s0.managerBP) + ', artist ' + L.fmtPct(10000 - s0.ownerBP - s0.managerBP) + '.', [
      h('button', { type: 'button', class: 'btn btn-primary', onclick: function () { editArtist(null); } }, icon('plus', 17), 'Add artist')
    ]);
    var toolbar = h('div', { class: 'toolbar' }, searchBox(f.q || '', 'Search artists', 'artists-q', function (v) { f.q = v; render(); }),
      h('div', { class: 'spacer' }), h('span', { class: 'faint small' }, plural(shown.length, 'artist')));
    var keys = shown.map(function (x) { return x.a.id; });
    var selected = shown.filter(function (x) { return f.sel[x.a.id]; }).map(function (x) { return x.a; });
    function amounts(by) {
      var cs = Object.keys(by).sort();
      return cs.length ? cs.map(function (c) { return h('div', null, money(by[c], c)); }) : h('span', { class: 'faint' }, '—');
    }
    var table = shown.length ? h('div', { class: 'table-wrap' }, h('table', { class: 'tbl' },
      h('thead', null, h('tr', null, headCheck(f, keys), sortTh(f, 'name', 'Artist'), sortTh(f, 'count', 'Payments', 'num', 'desc'), sortTh(f, 'received', 'Received, all time', 'num', 'desc'), sortTh(f, 'unpaid', 'Still to pay', 'num', 'desc'), sortTh(f, 'last', 'Last payment', '', 'desc'), h('th', null, 'Split'), h('th', { class: 'act-col' }))),
      h('tbody', null, shown.map(function (x, i) {
        var a = x.a;
        var sp = L.splitOf(a, s0);
        return h('tr', { class: 'row-click' + (f.sel[a.id] ? ' selected' : ''), onclick: rowOpen(function () { editArtist(a); }) },
          checkCell(f, a.id, i, keys, a.name),
          h('td', null, h('div', { class: 'who' }, avatar(a.name), h('div', { class: 'who-text' }, h('div', { class: 'who-name' }, a.name), a.note ? h('span', { class: 'sub' }, a.note) : null))),
          h('td', { class: 'num' }, String(x.count)),
          h('td', { class: 'num' }, amounts(x.by)),
          h('td', { class: 'num' }, amounts(x.unpaid)),
          h('td', { class: 'nowrap' }, x.last ? L.fmtDate(x.last) : h('span', { class: 'faint' }, '—')),
          h('td', null, a.custom ? h('span', { class: 'tag new' }, 'Custom ' + L.fmtPct(sp.ownerBP + sp.managerBP)) : h('span', { class: 'faint' }, 'Default ' + L.fmtPct(sp.ownerBP + sp.managerBP))),
          h('td', { class: 'act-col' },
            h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Edit ' + a.name, 'data-tip': 'Edit', onclick: function () { editArtist(a); } }, icon('edit', 18)),
            h('button', { type: 'button', class: 'icon-btn danger', 'aria-label': 'Delete ' + a.name, 'data-tip': 'Delete', onclick: function () { deleteArtistsDialog([a]); } }, icon('trash', 18))));
      })))) : emptyState(items.length ? 'Nothing matches' : 'No artists yet', items.length ? 'Clear the search.' : 'Artists are added when you import payments. You can also add one by hand.');
    var bulk = null;
    st.deleteSelected = selected.length ? function () { deleteArtistsDialog(selected); } : null;
    if (selected.length) {
      bulk = bulkBar(selected.length, [
        selected.length === 1 ? bbtn('Edit', 'edit', function () { editArtist(selected[0]); }) : null,
        selected.length > 1 ? bbtn('Merge', 'merge', function () { mergeArtistsDialog(selected.map(function (a) { return a.id; })); }) : null,
        bbtn('Delete', 'trash', st.deleteSelected, true)
      ], function () { f.sel = {}; render(); });
    }
    var notice = unnamedPays.length ? h('div', { class: 'notice' }, icon('alert', 18), h('div', { style: { flex: '1' } },
      h('b', null, plural(unnamedPays.length, 'payment') + ' came in without a name.'),
      h('div', null, 'Each one can belong to a different artist.')),
      h('button', { type: 'button', class: 'btn btn-sm', onclick: function () { nameUnnamedDialog(unnamedPays); } }, icon('user', 16), 'Give them names')) : null;
    return h('div', null, head, h('div', { class: 'page-body' }, notice, h('section', { class: 'panel panel-flush' }, toolbar, table), bulk));
  }

  function isUnnamedPayment(p) { var a = st.db.artists[p.artistId]; return !a || a.name === L.UNNAMED; }

  // Name each payment that came in without a name; every one can go to a different artist.
  function nameUnnamedDialog(pays) {
    pays = livePayments(pays).sort(function (a, b) { return (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')); });
    if (!pays.length) return;
    openModal(function (close) {
      var inputs = [];
      var dl = h('datalist', { id: 'artist-names-modal' }, values(st.db.artists).filter(function (a) { return a.name !== L.UNNAMED; }).map(function (a) { return h('option', { value: a.name }); }));
      var body = pays.map(function (p, i) {
        var inp = h('input', { class: 'input input-sm', list: 'artist-names-modal', placeholder: 'Artist name', autofocus: i === 0, 'aria-label': 'Artist for ' + money(p.cents, p.cur) });
        inputs.push(inp);
        return h('tr', null,
          h('td', { class: 'nowrap' }, L.fmtDate(p.date), h('span', { class: 'sub' }, L.fmtJDate(p.date) + (p.time ? ', ' + p.time : ''))),
          h('td', { class: 'num strong' }, money(p.cents, p.cur)),
          h('td', { class: 'name-cell' }, inp));
      });
      function submit() {
        var ops = [], byName = {}, named = 0;
        values(st.db.artists).forEach(function (a) { if (a.name !== L.UNNAMED) byName[L.normName(a.name)] = a.id; });
        pays.forEach(function (p, i) {
          var nm = L.cleanName(inputs[i].value);
          if (!nm || L.normName(nm) === L.normName(L.UNNAMED)) return;
          var id = byName[L.normName(nm)];
          if (!id) { id = L.uid('a'); byName[L.normName(nm)] = id; ops.push(putOp('artists', id, { name: nm, custom: false })); }
          ops.push(updOp('payments', p, { artistId: id }));
          named++;
        });
        close();
        if (!named) return;
        var undo = snapshot('payments', pays);
        st.payments.sel = {}; st.payouts.sel = {};
        commit(ops).then(function () { toast('Named ' + plural(named, 'payment'), { actions: [{ label: 'Undo', fn: function () { commit(undo); } }] }); });
      }
      inputs.forEach(function (inp, i) { inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { if (inputs[i + 1]) inputs[i + 1].focus(); else submit(); } }); });
      return modalFrame('Give the payments a name', 'Each payment can go to a different artist. Leave a box empty to keep that payment unnamed.', [
        dl,
        h('div', { class: 'table-wrap', style: { maxHeight: '52vh', overflowY: 'auto', border: '1px solid var(--line)', borderRadius: '12px' } }, h('table', { class: 'tbl' },
          h('thead', null, h('tr', null, h('th', null, 'Date'), h('th', { class: 'num' }, 'Amount'), h('th', null, 'Artist'))),
          h('tbody', null, body)))
      ], [h('button', { type: 'button', class: 'btn btn-ghost', onclick: close }, 'Cancel'), h('button', { type: 'button', class: 'btn btn-primary', onclick: submit }, 'Save names')]);
    }, { wide: true });
  }

  function deleteArtistsDialog(list) {
    var ids = {};
    list.forEach(function (a) { ids[a.id] = true; });
    var pays = values(st.db.payments).filter(function (p) { return ids[p.artistId]; });
    var title = list.length === 1 ? (list[0].name === L.UNNAMED ? 'Delete the unnamed payments?' : 'Delete ' + list[0].name + '?') : 'Delete ' + plural(list.length, 'artist') + '?';
    var text = pays.length ? 'Their ' + plural(pays.length, 'payment') + ' in every month will be deleted too. You can undo this right after, or restore a backup from Settings.' : 'They have no payments.';
    confirmDialog({ title: title, text: text, confirm: 'Delete', danger: true }).then(function (ok) {
      if (!ok) return;
      var ops = pays.map(function (p) { return delOp('payments', p.id); });
      var undo = snapshot('payments', pays);
      values(st.db.managers).forEach(function (mg) {
        var mids = mg.artistIds || [];
        if (mids.some(function (x) { return ids[x]; })) {
          undo.push(putOp('managers', mg.id, bodyOf(mg)));
          ops.push(updOp('managers', mg, { artistIds: mids.filter(function (x) { return !ids[x]; }) }));
        }
      });
      list.forEach(function (a) { if (a.name !== L.UNNAMED) { ops.push(delOp('artists', a.id)); undo.push(putOp('artists', a.id, bodyOf(a))); } });
      st.artists.sel = {};
      commit(ops).then(function () { toast(list.length === 1 ? 'Deleted ' + list[0].name : plural(list.length, 'artist') + ' deleted', { actions: [{ label: 'Undo', fn: function () { commit(undo); } }] }); });
    });
  }

  function mergeArtistsDialog(ids) {
    var list = ids.map(function (id) { return st.db.artists[id]; }).filter(Boolean);
    var named = list.filter(function (a) { return a.name !== L.UNNAMED; });
    openModal(function (close) {
      var err = h('div', { class: 'error-text', hidden: true });
      var picker = artistPicker(named.length ? named[0].id : '', false);
      function submit() {
        var ops = [];
        var res = picker.resolve(ops);
        if (res.error) { err.textContent = res.error; err.hidden = false; return; }
        var target = st.db.artists[res.id] || { id: res.id, name: 'the new artist' };
        list.forEach(function (a) { if (a.id !== target.id) ops = ops.concat(mergeOps(a, target)); });
        close();
        st.payouts.sel = {}; st.artists.sel = {};
        commit(ops).then(function () { toast('Merged into ' + (st.db.artists[res.id] ? st.db.artists[res.id].name : target.name)); });
      }
      return modalFrame('Merge ' + plural(list.length, 'artist'), 'All their payments go to the artist you choose, and the others are removed. Use this when the same artist came in under different names.', [
        h('div', { class: 'chips' }, list.map(function (a) { return h('span', { class: 'tag' }, a.name); })),
        h('div', { class: 'field' }, h('label', null, 'Keep this artist'), picker.node), err
      ], [h('button', { type: 'button', class: 'btn btn-ghost', onclick: close }, 'Cancel'), h('button', { type: 'button', class: 'btn btn-primary', onclick: submit }, icon('merge', 16), 'Merge')]);
    });
  }

  function editArtist(a) {
    if (a && a.name === L.UNNAMED) { nameUnnamedDialog(values(st.db.payments).filter(function (p) { return p.artistId === a.id; })); return; }
    var isNew = !a;
    var s0 = settings();
    a = a || { name: '', custom: false, ownerBP: s0.ownerBP, managerBP: s0.managerBP };
    var payCount = isNew ? 0 : values(st.db.payments).filter(function (p) { return p.artistId === a.id; }).length;
    openModal(function (close) {
      var err = h('div', { class: 'error-text', hidden: true });
      var isUnnamed = !isNew && a.name === L.UNNAMED;
      var name = h('input', { class: 'input', value: isUnnamed ? '' : a.name, autofocus: true, placeholder: isUnnamed ? 'Type the artist\'s name' : '' });
      var custom = !!a.custom;
      var ownerIn = h('input', { class: 'input', inputmode: 'decimal', value: L.fmtPct(a.custom ? a.ownerBP : s0.ownerBP).replace('%', '') });
      var mineIn = h('input', { class: 'input', inputmode: 'decimal', value: L.fmtPct(a.custom ? a.managerBP : s0.managerBP).replace('%', '') });
      var artistPct = h('div', { class: 'hint' });
      var customBox = h('div', { class: 'cols-3', hidden: !custom },
        h('div', { class: 'field' }, h('label', null, (s0.ownerName || 'Owner') + ' %'), ownerIn),
        h('div', { class: 'field' }, h('label', null, (s0.myName || 'You') + ' %'), mineIn),
        h('div', { class: 'field' }, h('label', null, 'Artist gets'), artistPct));
      function updPct() {
        var o = L.parsePct(ownerIn.value) || 0, m = L.parsePct(mineIn.value) || 0;
        artistPct.textContent = L.fmtPct(10000 - o - m);
      }
      ownerIn.addEventListener('input', updPct);
      mineIn.addEventListener('input', updPct);
      updPct();
      var segWrap = h('div');
      function drawSeg() {
        segWrap.replaceChildren(seg([{ value: false, label: 'Default split' }, { value: true, label: 'Custom split' }], custom, function (v) { custom = v; customBox.hidden = !custom; drawSeg(); }, 'Split'));
      }
      drawSeg();
      var others = values(st.db.artists).filter(function (x) { return x.id !== a.id && x.name !== L.UNNAMED; }).sort(function (x, y) { return x.name.localeCompare(y.name); });
      var mergeSel = h('select', { class: 'select' }, h('option', { value: '' }, 'Choose an artist'), others.map(function (x) { return h('option', { value: x.id }, x.name); }));
      var noteIn = h('textarea', { class: 'input', rows: 2, value: a.note || '', placeholder: 'Optional, for example how this artist likes to be paid' });
      function submit() {
        var nm = L.cleanName(name.value);
        if (!nm) { err.textContent = 'Type a name.'; err.hidden = false; return; }
        var clash = values(st.db.artists).filter(function (x) { return x.id !== a.id && L.normName(x.name) === L.normName(nm); })[0];
        if (isUnnamed) {
          if (L.normName(nm) === L.normName(L.UNNAMED)) { close(); return; }
          var ops0 = [], tid = clash ? clash.id : L.uid('a');
          if (!clash) ops0.push(putOp('artists', tid, { name: nm, custom: false }));
          values(st.db.payments).filter(function (p) { return p.artistId === a.id; }).forEach(function (p) { ops0.push(updOp('payments', p, { artistId: tid })); });
          close();
          commit(ops0).then(function () { toast(payCount + (payCount === 1 ? ' payment' : ' payments') + ' moved to ' + nm); });
          return;
        }
        if (clash) {
          close();
          confirmDialog({ title: 'There is already an artist called ' + clash.name, text: 'Merge ' + a.name + ' into ' + clash.name + '? All ' + payCount + ' payments move to ' + clash.name + '.', confirm: 'Merge' }).then(function (ok) { if (ok) mergeInto(a, clash); });
          return;
        }
        var o = L.parsePct(ownerIn.value), m = L.parsePct(mineIn.value);
        if (custom && (o === null || m === null || o < 0 || m < 0 || o + m > 10000)) { err.textContent = 'Check the percentages. Together they can\'t be more than 100%.'; err.hidden = false; return; }
        var body = Object.assign(isNew ? {} : bodyOf(a), { name: nm, custom: custom, ownerBP: custom ? o : s0.ownerBP, managerBP: custom ? m : s0.managerBP, note: noteIn.value.trim() });
        close();
        commit([putOp('artists', isNew ? L.uid('a') : a.id, body)]).then(function () { toast(isNew ? 'Artist added' : 'Artist saved'); });
      }
      function merge() {
        var target = st.db.artists[mergeSel.value];
        if (!target) { err.textContent = 'Choose the artist to merge into.'; err.hidden = false; return; }
        close();
        confirmDialog({ title: 'Merge ' + (isUnnamed ? 'the unnamed payments' : a.name) + ' into ' + target.name + '?', text: 'All ' + payCount + ' payments move to ' + target.name + '.', confirm: 'Merge', danger: false }).then(function (ok) { if (ok) mergeInto(a, target); });
      }
      function remove() { close(); deleteArtistsDialog([a]); }
      return modalFrame(isNew ? 'Add an artist' : isUnnamed ? 'Unnamed payments' : a.name, isNew ? null : payCount + (payCount === 1 ? ' payment' : ' payments'), [
        h('div', { class: 'field' }, h('label', null, isUnnamed ? 'Whose payments are these?' : 'Name'), name, isUnnamed ? h('span', { class: 'hint' }, 'Type a name to move all ' + payCount + ' unnamed ' + (payCount === 1 ? 'payment' : 'payments') + ' to that artist. If they belong to different artists, give each its artist on the Payments page.') : null),
        isUnnamed ? null : h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Commission'), segWrap,
          h('span', { class: 'hint', hidden: custom }, 'Default: ' + (s0.ownerName || 'Owner') + ' ' + L.fmtPct(s0.ownerBP) + ' and ' + (s0.myName || 'You') + ' ' + L.fmtPct(s0.managerBP) + '. Change it in Settings.'),
          customBox),
        isUnnamed ? null : h('div', { class: 'field' }, h('label', null, 'Note'), noteIn),
        isNew || isUnnamed || !others.length || !payCount ? null : h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Merge into another artist'),
          h('div', { class: 'row' }, mergeSel, h('button', { type: 'button', class: 'btn', onclick: merge }, icon('merge', 16), 'Merge')),
          h('span', { class: 'hint' }, 'Use this when the same artist came in under two names.')),
        err
      ], [h('button', { type: 'button', class: 'btn btn-ghost', onclick: close }, 'Cancel'), h('button', { type: 'button', class: 'btn btn-primary', onclick: submit }, isNew ? 'Add artist' : 'Save')],
      !isNew && (payCount || !isUnnamed) ? h('button', { type: 'button', class: 'btn btn-danger', onclick: remove }, icon('trash', 16), 'Delete') : null);
    });
  }

  function mergeOps(a, target) {
    var ops = values(st.db.payments).filter(function (p) { return p.artistId === a.id; }).map(function (p) { return updOp('payments', p, { artistId: target.id }); });
    values(st.db.managers).forEach(function (mg) {
      var ids = mg.artistIds || [];
      if (ids.indexOf(a.id) >= 0) ops.push(updOp('managers', mg, { artistIds: ids.filter(function (x) { return x !== a.id; }).concat(ids.indexOf(target.id) >= 0 ? [] : [target.id]) }));
    });
    if (a.name !== L.UNNAMED) ops.push(delOp('artists', a.id));
    return ops;
  }
  function mergeInto(a, target) {
    commit(mergeOps(a, target)).then(function () { toast('Merged into ' + target.name); });
  }

  // ---------------------------------------------------------------- managers
  function pageManagers() {
    var s0 = settings();
    var rows = L.computeRows(st.db, st.period.from, st.period.to);
    var rep = L.managerReport(st.db, st.period.from, st.period.to, rows);
    var head = pageHead('Managers', 'Give another manager a share of some artists\' income. It comes out of your ' + L.fmtPct(s0.managerBP) + ' unless you move part of it to the owner.', [
      periodButton(),
      h('button', { type: 'button', class: 'btn btn-primary', onclick: function () { editManager(null); } }, icon('plus', 17), 'Add manager')
    ]);
    if (!rep.length) {
      return h('div', null, head, h('div', { class: 'page-body' }, h('section', { class: 'panel' },
        emptyState('No other managers yet', 'Add one, choose the artists and the share, and Splits takes it into account on every payout.',
          h('button', { type: 'button', class: 'btn btn-primary', onclick: function () { editManager(null); } }, icon('plus', 17), 'Add manager')))));
    }
    var cards = rep.map(function (x) {
      var m = x.manager;
      var ids = (m.artistIds || []).filter(function (id) { return st.db.artists[id]; });
      var fromOwner = Math.min(m.ownerBP | 0, m.pctBP | 0), fromMe = (m.pctBP | 0) - fromOwner;
      var who = fromOwner === 0 ? 'Paid from your share' : fromMe === 0 ? 'Paid from the owner\'s share' : L.fmtPct(fromMe) + ' from you, ' + L.fmtPct(fromOwner) + ' from the owner';
      var curs = mgrCurrencies(x);
      var comb = L.managerCombined(m, st.period.from, st.period.to, x.totals);
      var convBtn = curs.length > 1 || comb
        ? h('button', { type: 'button', class: 'btn btn-sm btn-ghost mgr-conv-btn', onclick: function () { convertManagerDialog(m, x); } }, icon('convert', 16), comb ? 'Change the conversion' : 'Total in one currency')
        : null;
      var amounts;
      if (comb && comb.complete) {
        amounts = h('div', { class: 'mgr-amounts mgr-combined' },
          h('div', { class: 'mgr-amount' }, h('span', { class: 'faint small' }, 'Total for ' + rangeLabel() + ', in ' + L.curInfo(comb.to).name + 's'), h('b', null, money(comb.total, comb.to))),
          h('table', { class: 'mgr-conv' }, h('tbody', null, comb.lines.map(function (l) {
            return h('tr', null,
              h('td', null, l.cur + ' share'),
              h('td', { class: 'num muted' }, l.same ? '' : money(l.share, l.cur) + ' × ' + L.fmtFx(l.rate)),
              h('td', { class: 'num' }, money(l.cents, comb.to)));
          }))),
          comb.changed ? h('div', { class: 'hint' }, 'A share changed after you converted it, so Splits worked it out again at the same rate.') : null,
          convBtn);
      } else {
        amounts = h('div', { class: 'mgr-amounts' }, curs.length ? curs.map(function (c) {
          return h('div', { class: 'mgr-amount' }, h('span', { class: 'faint small' }, 'Share in ' + rangeLabel() + (curs.length > 1 ? ', ' + c : '')), h('b', null, money(x.totals[c].share, c)));
        }) : h('div', { class: 'mgr-amount' }, h('span', { class: 'faint small' }, 'Share in ' + rangeLabel()), h('b', null, '—')),
          comb && comb.missing.length ? h('div', { class: 'hint', style: { flexBasis: '100%' } }, 'Convert the ' + comb.missing.join(' and ') + ' share too to get one total.') : null,
          convBtn ? h('div', { style: { flexBasis: '100%' } }, convBtn) : null);
      }
      return h('section', { class: 'panel mgr' },
        h('div', { class: 'row between' },
          h('div', { class: 'who' }, avatar(m.name, 'lg'), h('div', null, h('h2', { class: 'mgr-name' }, m.name), h('div', { class: 'muted small' }, L.fmtPct(m.pctBP) + ' of ' + ids.length + (ids.length === 1 ? ' artist' : ' artists') + '. ' + who + '.'))),
          h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Edit ' + m.name, 'data-tip': 'Edit manager', onclick: function () { editManager(m); } }, icon('edit', 18))),
        amounts,
        h('div', { class: 'chips' }, ids.map(function (id) { return h('span', { class: 'tag' }, st.db.artists[id].name); })),
        h('div', { class: 'row' },
          h('button', { type: 'button', class: 'btn btn-sm', disabled: !curs.length, onclick: function () { saveManagerPdf(m); } }, icon('file', 16), 'Save PDF'),
          h('button', { type: 'button', class: 'btn btn-sm btn-ghost', disabled: !curs.length, onclick: function () { openDrawer({ kind: 'manager', key: m.id }); } }, 'View statement')));
    });
    return h('div', null, head, h('div', { class: 'page-body' }, h('div', { class: 'cards' }, cards)));
  }

  function mgrCurrencies(x) { return L.currenciesIn(Object.keys(x.totals).map(function (c) { return { cur: c }; })); }

  // Pay a manager in one currency: the user types the rate, or what the other share came to.
  function convertManagerDialog(m, x) {
    var key = L.periodKey(st.period.from, st.period.to);
    var saved = (m.conv && m.conv[key]) || null;
    var curs = mgrCurrencies(x);
    if (saved && curs.indexOf(saved.to) < 0) curs.push(saved.to);
    var target = saved ? saved.to : curs.slice().sort(function (a, b) { return x.totals[b].share - x.totals[a].share; })[0];
    var typed = {}; // 'USD>CAD' -> rate typed in this dialog
    if (saved) Object.keys(saved.lines || {}).forEach(function (c) { if (saved.lines[c].rate > 0) typed[c + '>' + saved.to] = saved.lines[c].rate; });
    openModal(function (close) {
      var err = h('div', { class: 'error-text', hidden: true });
      var linesBox = h('div', { class: 'conv-lines' });
      var totalEl = h('b', { class: 'conv-total-value' });
      var totalLabel = h('span', null);
      var lines = [];
      var targetSel = h('select', { class: 'select', 'aria-label': 'Total in' }, curs.map(function (c) { return h('option', { value: c, selected: c === target }, c + '  ' + L.curInfo(c).name); }));
      targetSel.addEventListener('change', function () { target = targetSel.value; build(); });
      function share(c) { return x.totals[c] ? x.totals[c].share : 0; }
      function build() {
        lines = [];
        var others = curs.filter(function (c) { return c !== target && share(c) > 0; });
        linesBox.replaceChildren.apply(linesBox, others.map(function (c) {
          var src = share(c);
          var rate = typed[c + '>' + target] || (typed[target + '>' + c] ? 1 / typed[target + '>' + c] : null);
          var cents = null;
          if (saved && saved.to === target && saved.lines && saved.lines[c] && saved.lines[c].rate === rate) cents = saved.lines[c].src === src ? saved.lines[c].cents : L.convertCents(src, rate);
          else if (rate) cents = L.convertCents(src, rate);
          var ln = { cur: c, src: src, rate: rate, cents: cents };
          var rateIn = h('input', { class: 'input', inputmode: 'decimal', value: rate ? L.fmtFx(rate) : '', placeholder: 'Rate', 'aria-label': '1 ' + c + ' in ' + target });
          var amtIn = h('input', { class: 'input', inputmode: 'decimal', value: cents ? (cents / 100).toFixed(2) : '', placeholder: '0.00', 'aria-label': 'Amount in ' + target });
          rateIn.addEventListener('input', function () {
            var r = L.parseFx(rateIn.value);
            ln.rate = r; ln.cents = r ? L.convertCents(src, r) : null;
            amtIn.value = ln.cents ? (ln.cents / 100).toFixed(2) : '';
            if (r) typed[c + '>' + target] = r;
            sum();
          });
          amtIn.addEventListener('input', function () {
            var v = L.parseMoney(amtIn.value);
            ln.cents = v && v > 0 ? v : null; ln.rate = ln.cents ? ln.cents / src : null;
            rateIn.value = ln.rate ? L.fmtFx(ln.rate) : '';
            if (ln.rate) typed[c + '>' + target] = ln.rate;
            sum();
          });
          lines.push(ln);
          return h('div', { class: 'conv-line' },
            h('div', { class: 'conv-src' }, h('span', { class: 'hint' }, L.curInfo(c).name + ' share'), h('b', null, money(src, c))),
            h('div', { class: 'field' }, h('span', { class: 'hint' }, '1 ' + c + ' = ? ' + target), rateIn),
            h('div', { class: 'field' }, h('span', { class: 'hint' }, 'Comes to, in ' + target), amtIn));
        }));
        sum();
      }
      function sum() {
        var total = share(target), ok = true;
        lines.forEach(function (l) { if (l.cents > 0) total += l.cents; else ok = false; });
        totalLabel.textContent = 'Total in ' + L.curInfo(target).name + 's';
        totalEl.textContent = ok ? money(total, target) : '—';
      }
      build();
      function submit() {
        if (!lines.length) { err.textContent = 'There is nothing to convert. Choose another currency.'; err.hidden = false; return; }
        var entry = { to: target, lines: {} };
        for (var i = 0; i < lines.length; i++) {
          var l = lines[i];
          if (!(l.cents > 0) || !(l.rate > 0)) { err.textContent = 'Type the rate or the amount for the ' + l.cur + ' share.'; err.hidden = false; return; }
          entry.lines[l.cur] = { src: l.src, cents: l.cents, rate: +l.rate.toFixed(8) };
        }
        var live = st.db.managers[m.id] || m;
        var conv = Object.assign({}, live.conv || {});
        conv[key] = entry;
        var undo = snapshot('managers', [live]);
        close();
        commit([updOp('managers', live, { conv: conv })]).then(function () {
          var fresh = st.db.managers[m.id];
          var c = fresh && L.managerCombined(fresh, st.period.from, st.period.to, x.totals);
          toast(c && c.complete ? m.name + ': ' + money(c.total, c.to) + ' in total' : 'Conversion saved', { actions: [{ label: 'Undo', fn: function () { commit(undo); } }] });
        });
      }
      function removeConv() {
        var live = st.db.managers[m.id] || m;
        var conv = Object.assign({}, live.conv || {});
        delete conv[key];
        var undo = snapshot('managers', [live]);
        close();
        commit([updOp('managers', live, { conv: conv })]).then(function () { toast('Showing each currency again', { actions: [{ label: 'Undo', fn: function () { commit(undo); } }] }); });
      }
      return modalFrame('Total in one currency', 'Pay ' + m.name + ' in one currency for ' + rangeLabel() + '. Type the rate you used, or what the other share came to. The statement then shows one total.', [
        h('div', { class: 'field', style: { maxWidth: '260px' } }, h('label', null, 'Total in'), targetSel),
        linesBox,
        h('div', { class: 'conv-total' }, totalLabel, totalEl),
        err
      ], [h('button', { type: 'button', class: 'btn btn-ghost', onclick: close }, 'Cancel'), h('button', { type: 'button', class: 'btn btn-primary', onclick: submit }, 'Save')],
      saved ? h('button', { type: 'button', class: 'btn btn-ghost', onclick: removeConv }, 'Show each currency') : null);
    }, { wide: true });
  }

  function drawerManager(d) {
    var m = st.db.managers[d.key];
    if (!m) return null;
    var x = L.managerReport(st.db, st.period.from, st.period.to).filter(function (r) { return r.manager.id === m.id; })[0];
    if (!x) return null;
    var curs = mgrCurrencies(x);
    var comb = L.managerCombined(m, st.period.from, st.period.to, x.totals);
    return h('aside', { class: 'drawer', role: 'dialog', 'aria-modal': 'true', 'aria-label': m.name },
      h('div', { class: 'drawer-head' },
        h('div', { class: 'drawer-title' }, avatar(m.name, 'lg'),
          h('div', null, h('h2', null, m.name), h('div', { class: 'muted small' }, 'Manager statement for ' + rangeLabel())),
          h('button', { type: 'button', class: 'icon-btn drawer-close', 'aria-label': 'Close', onclick: closeDrawer }, icon('x', 20))),
        h('div', { class: 'row wrap' },
          h('div', { style: { flex: '1' } }),
          curs.length > 1 || comb ? h('button', { type: 'button', class: 'btn btn-ghost', onclick: function () { convertManagerDialog(m, x); } }, icon('convert', 17), comb ? 'Change the conversion' : 'Total in one currency') : null,
          h('button', { type: 'button', class: 'btn btn-ghost', onclick: function () { editManager(m); } }, icon('edit', 17), 'Edit manager'),
          h('button', { type: 'button', class: 'btn btn-primary', disabled: !curs.length, onclick: function () { saveManagerPdf(m); } }, icon('file', 17), 'Save PDF'))),
      h('div', { class: 'drawer-body' }, statementPreview('manager', { managerId: m.id, from: st.period.from, to: st.period.to })));
  }

  function editManager(m) {
    var isNew = !m;
    var s0 = settings();
    m = m || { name: '', pctBP: 500, ownerBP: 0, artistIds: [] };
    openModal(function (close) {
      var err = h('div', { class: 'error-text', hidden: true });
      var name = h('input', { class: 'input', value: m.name, autofocus: true, placeholder: 'Manager name' });
      var pct = h('input', { class: 'input', inputmode: 'decimal', value: L.fmtPct(m.pctBP).replace('%', '') });
      var fromOwner = h('input', { class: 'input', inputmode: 'decimal', value: L.fmtPct(Math.min(m.ownerBP | 0, m.pctBP | 0)).replace('%', '') });
      var fromMe = h('input', { class: 'input', inputmode: 'decimal', value: L.fmtPct((m.pctBP | 0) - Math.min(m.ownerBP | 0, m.pctBP | 0)).replace('%', '') });
      function syncFrom(which) {
        var total = L.parsePct(pct.value) || 0;
        if (which === 'owner') { var o = Math.min(total, Math.max(0, L.parsePct(fromOwner.value) || 0)); fromMe.value = L.fmtPct(total - o).replace('%', ''); }
        else if (which === 'me') { var me = Math.min(total, Math.max(0, L.parsePct(fromMe.value) || 0)); fromOwner.value = L.fmtPct(total - me).replace('%', ''); }
        else { var o2 = Math.min(total, Math.max(0, L.parsePct(fromOwner.value) || 0)); fromOwner.value = L.fmtPct(o2).replace('%', ''); fromMe.value = L.fmtPct(total - o2).replace('%', ''); }
      }
      pct.addEventListener('input', function () { syncFrom('total'); });
      fromOwner.addEventListener('input', function () { syncFrom('owner'); });
      fromMe.addEventListener('input', function () { syncFrom('me'); });
      var chosen = {};
      (m.artistIds || []).forEach(function (id) { chosen[id] = true; });
      var artists = values(st.db.artists).filter(function (a) { return a.name !== L.UNNAMED; }).sort(function (a, b) { return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }); });
      var listBox = h('div', { class: 'checklist' });
      var filter = h('input', { class: 'input', type: 'search', placeholder: 'Search artists' });
      var countEl = h('span', { class: 'hint' });
      function drawList() {
        var q = L.normName(filter.value);
        listBox.replaceChildren.apply(listBox, artists.filter(function (a) { return !q || L.normName(a.name).indexOf(q) >= 0; }).map(function (a) {
          return h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: !!chosen[a.id], onchange: function (e) { chosen[a.id] = e.target.checked; countEl.textContent = count() + ' chosen'; } }), a.name);
        }));
        if (!listBox.children.length) listBox.appendChild(h('div', { class: 'hint', style: { padding: '8px' } }, artists.length ? 'No artist matches.' : 'Import payments first, then choose the artists here.'));
        countEl.textContent = count() + ' chosen';
      }
      function count() { return Object.keys(chosen).filter(function (k) { return chosen[k]; }).length; }
      filter.addEventListener('input', drawList);
      drawList();
      function submit() {
        var nm = L.cleanName(name.value);
        var p = L.parsePct(pct.value), o = L.parsePct(fromOwner.value) || 0;
        if (!nm) { err.textContent = 'Type the manager\'s name.'; err.hidden = false; return; }
        if (p === null || p <= 0 || p > 10000) { err.textContent = 'Type the share as a percentage, like 5.'; err.hidden = false; return; }
        if (o < 0 || o > p) { err.textContent = 'The owner\'s part can\'t be more than the whole share.'; err.hidden = false; return; }
        var ids = Object.keys(chosen).filter(function (k) { return chosen[k]; });
        if (!ids.length) { err.textContent = 'Choose at least one artist.'; err.hidden = false; return; }
        var body = Object.assign(isNew ? {} : bodyOf(m), { name: nm, pctBP: p, ownerBP: o, artistIds: ids });
        close();
        commit([putOp('managers', isNew ? L.uid('m') : m.id, body)]).then(function () { toast(isNew ? 'Manager added' : 'Manager saved'); });
      }
      function remove() {
        close();
        confirmDialog({ title: 'Remove ' + m.name + '?', text: 'Their share goes back to you and the owner on every payout.', confirm: 'Remove', danger: true }).then(function (ok) {
          if (ok) commit([delOp('managers', m.id)]).then(function () { toast('Manager removed'); });
        });
      }
      return modalFrame(isNew ? 'Add a manager' : 'Edit ' + m.name, null, [
        h('div', { class: 'cols-2' }, h('div', { class: 'field' }, h('label', null, 'Name'), name), h('div', { class: 'field' }, h('label', null, 'Share of the artists\' income (%)'), pct)),
        h('div', { class: 'field' }, h('span', { class: 'field-label' }, 'Who pays it'),
          h('div', { class: 'cols-2' },
            h('div', { class: 'field' }, h('span', { class: 'hint' }, 'From your ' + L.fmtPct(s0.managerBP) + ' (%)'), fromMe),
            h('div', { class: 'field' }, h('span', { class: 'hint' }, 'From the owner\'s ' + L.fmtPct(s0.ownerBP) + ' (%)'), fromOwner)),
          h('span', { class: 'hint' }, 'The artist\'s share never changes.')),
        h('div', { class: 'field' }, h('div', { class: 'row between' }, h('span', { class: 'field-label' }, 'Artists'), countEl), filter, listBox),
        err
      ], [h('button', { type: 'button', class: 'btn btn-ghost', onclick: close }, 'Cancel'), h('button', { type: 'button', class: 'btn btn-primary', onclick: submit }, isNew ? 'Add manager' : 'Save')],
      isNew ? null : h('button', { type: 'button', class: 'btn btn-danger', onclick: remove }, icon('trash', 16), 'Remove'));
    }, { wide: true });
  }

  // ---------------------------------------------------------------- settings
  function settingText(key, label, hint, placeholder) {
    var s0 = settings();
    var input = h('input', { class: 'input', value: s0[key] || '', placeholder: placeholder || '',
      onchange: function (e) { var v = e.target.value.trim(); commit([setOp(key, v)]).then(function () { toast('Saved'); }); } });
    return h('div', { class: 'set-row' }, h('div', { class: 'set-label' }, label, hint ? h('div', { class: 'hint' }, hint) : null), input);
  }

  function pageSettings() {
    var s0 = settings();
    var sy = st.server.sync || { state: 'off' };

    var statements = h('section', { class: 'panel' },
      h('div', { class: 'panel-head' }, h('h2', { class: 'panel-title' }, 'Statements')),
      h('div', { class: 'panel-body' },
        settingText('business', 'Business name', 'Shown at the top of every PDF.', 'Your label or company'),
        settingText('ownerName', 'Owner', 'How the owner\'s share is labelled.', 'Owner'),
        settingText('myName', 'You', 'How your manager share is labelled.', 'You')));

    var ownerIn = h('input', { class: 'input', inputmode: 'decimal', value: L.fmtPct(s0.ownerBP).replace('%', ''), style: { maxWidth: '120px' } });
    var mineIn = h('input', { class: 'input', inputmode: 'decimal', value: L.fmtPct(s0.managerBP).replace('%', ''), style: { maxWidth: '120px' } });
    function saveSplit() {
      var o = L.parsePct(ownerIn.value), m = L.parsePct(mineIn.value);
      if (o === null || m === null || o < 0 || m < 0 || o + m > 10000) { toast('Check the percentages. Together they can\'t be more than 100%.', { error: true }); return; }
      if (o === s0.ownerBP && m === s0.managerBP) return;
      commit([setOp('ownerBP', o), setOp('managerBP', m)]).then(function () { toast('Default split saved'); });
    }
    ownerIn.addEventListener('change', saveSplit);
    mineIn.addEventListener('change', saveSplit);
    var split = h('section', { class: 'panel' },
      h('div', { class: 'panel-head' }, h('h2', { class: 'panel-title' }, 'Default split')),
      h('div', { class: 'panel-body' },
        h('div', { class: 'set-row' }, h('div', { class: 'set-label' }, 'Commission', h('div', { class: 'hint' }, 'Taken from every payment. Artists with a custom split keep their own.')),
          h('div', { class: 'row wrap' },
            h('div', { class: 'field' }, h('span', { class: 'hint' }, (s0.ownerName || 'Owner') + ' %'), ownerIn),
            h('div', { class: 'field' }, h('span', { class: 'hint' }, (s0.myName || 'You') + ' %'), mineIn),
            h('div', { class: 'field' }, h('span', { class: 'hint' }, 'Artists get'), h('div', { style: { height: '38px', display: 'flex', alignItems: 'center', fontWeight: '600' } }, L.fmtPct(10000 - s0.ownerBP - s0.managerBP)))))));

    var sync = h('section', { class: 'panel', id: 'sync' },
      h('div', { class: 'panel-head' }, h('h2', { class: 'panel-title' }, 'Sync with GitHub')),
      h('div', { class: 'panel-body' }, syncSettings(sy)));

    var autoSel = h('select', { class: 'select', style: { maxWidth: '220px' }, onchange: function (e) { commit([setOp('autoLock', parseInt(e.target.value, 10))]).then(function () { toast('Saved'); }); } },
      [[5, 'After 5 minutes'], [15, 'After 15 minutes'], [30, 'After 30 minutes'], [60, 'After 1 hour'], [0, 'Never']].map(function (o) { return h('option', { value: String(o[0]), selected: s0.autoLock === o[0] }, o[1]); }));
    var security = h('section', { class: 'panel' },
      h('div', { class: 'panel-head' }, h('h2', { class: 'panel-title' }, 'Password and security')),
      h('div', { class: 'panel-body' },
        h('div', { class: 'set-row' }, h('div', { class: 'set-label' }, 'Password', h('div', { class: 'hint' }, 'Opens Splits and locks the ledger file, the backups and the copy on GitHub.')),
          h('div', { class: 'row wrap' }, h('button', { type: 'button', class: 'btn', onclick: changePassword }, icon('key', 16), 'Change password'))),
        h('div', { class: 'set-row' }, h('div', { class: 'set-label' }, 'Recovery code', h('div', { class: 'hint' }, 'The only way back in if you forget your password.')),
          h('div', { class: 'row wrap' }, h('button', { type: 'button', class: 'btn', onclick: newRecovery }, icon('shield', 16), 'Make a new recovery code'))),
        h('div', { class: 'set-row' }, h('div', { class: 'set-label' }, 'Lock automatically', h('div', { class: 'hint' }, 'When Splits isn\'t used for a while.')), autoSel)));

    if (PHONE) {
      var phoneBackups = h('section', { class: 'panel' },
        h('div', { class: 'panel-head' }, h('h2', { class: 'panel-title' }, 'Backups')),
        h('div', { class: 'panel-body' },
          h('div', { class: 'set-row' }, h('div', { class: 'set-label' }, 'Backups', h('div', { class: 'hint' }, 'Your computers keep a locked copy every day. You can also save one from this iPhone to Files.')),
            h('div', { class: 'row wrap' },
              h('button', { type: 'button', class: 'btn', onclick: phoneBackup }, icon('backup', 16), 'Save a backup'),
              h('button', { type: 'button', class: 'btn', onclick: phoneRestore }, icon('refresh', 16), 'Restore a backup')))));
      var about = h('section', { class: 'panel' },
        h('div', { class: 'panel-head' }, h('h2', { class: 'panel-title' }, 'This iPhone')),
        h('div', { class: 'panel-body' },
          STANDALONE ? null : h('div', { class: 'notice' }, icon('phone', 18), h('div', null, h('b', null, 'Add Splits to your Home Screen'), h('div', null, 'In Safari, tap the Share button, then Add to Home Screen. Splits then opens like an app, full screen.'))),
          h('div', { class: 'set-row' }, h('div', { class: 'set-label' }, 'Version'), h('div', null, 'Splits ' + st.server.version + ' for iPhone')),
          h('div', { class: 'set-row' }, h('div', { class: 'set-label' }, 'Remove', h('div', { class: 'hint' }, 'Takes the ledger off this iPhone. Your computers and GitHub keep everything.')),
            h('div', null, h('button', { type: 'button', class: 'btn btn-ghost btn-danger', onclick: removeFromPhone }, 'Remove Splits from this iPhone')))));
      return h('div', null, pageHead('Settings'), h('div', { class: 'page-body' }, h('div', { class: 'settings' }, statements, split, sync, security, phoneBackups, about)));
    }

    var lastBackup = st.server.lastBackup ? L.fmtTimestamp(st.server.lastBackup) : 'Not yet';
    var backups = h('section', { class: 'panel' },
      h('div', { class: 'panel-head' }, h('h2', { class: 'panel-title' }, 'Backups')),
      h('div', { class: 'panel-body' },
        h('div', { class: 'set-row' }, h('div', { class: 'set-label' }, 'Automatic backups', h('div', { class: 'hint' }, 'Splits keeps a locked copy every day you use it.')),
          h('div', null, h('div', null, 'Last backup: ' + lastBackup),
            h('div', { class: 'row wrap', style: { marginTop: '10px' } },
              h('button', { type: 'button', class: 'btn', onclick: backupNow }, icon('backup', 16), 'Back up now'),
              h('button', { type: 'button', class: 'btn', onclick: restoreBackup }, icon('refresh', 16), 'Restore a backup'),
              h('button', { type: 'button', class: 'btn btn-ghost', onclick: function () { openDir('backups'); } }, icon('folder', 16), 'Open folder'))))));

    var files = h('section', { class: 'panel' },
      h('div', { class: 'panel-head' }, h('h2', { class: 'panel-title' }, 'Files')),
      h('div', { class: 'panel-body' },
        h('div', { class: 'set-row' }, h('div', { class: 'set-label' }, 'PDFs'), h('div', null, h('div', { class: 'mono-box' }, st.server.pdfDir), h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { type: 'button', class: 'btn btn-sm', onclick: function () { openDir('pdf'); } }, icon('folder', 16), 'Open folder')))),
        h('div', { class: 'set-row' }, h('div', { class: 'set-label' }, 'Ledger'), h('div', null, h('div', { class: 'mono-box' }, st.server.dataDir), h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { type: 'button', class: 'btn btn-sm', onclick: function () { openDir('data'); } }, icon('folder', 16), 'Open folder')))),
        h('div', { class: 'set-row' }, h('div', { class: 'set-label' }, 'Version'), h('div', null, 'Splits ' + st.server.version))));

    return h('div', null, pageHead('Settings'), h('div', { class: 'page-body' }, h('div', { class: 'settings' }, statements, split, sync, security, backups, files)));
  }

  function syncSettings(sy) {
    var info = syncInfo();
    if (sy.state === 'off') info.sub = '';
    var statusLine = h('div', { class: 'status-line' }, h('span', { class: 'sync-dot ' + info.dot }), h('b', null, info.title), info.sub ? h('span', { class: 'muted' }, info.sub) : null);
    if (sy.state === 'off') {
      var keyIn = h('input', { class: 'input', placeholder: 'owner/repository#github_pat_…', spellcheck: 'false' });
      var err = h('div', { class: 'error-text', hidden: true });
      var btn = h('button', { type: 'button', class: 'btn btn-primary', onclick: function () {
        btn.disabled = true;
        api.post('/api/sync/connect', { key: keyIn.value }).then(function () { return refreshState(); }).then(function () { render(); toast('Connected to GitHub'); })
          .catch(function (e) { btn.disabled = false; if (e.gone) return showGone(); err.textContent = e.message; err.hidden = false; });
      } }, icon('link', 16), 'Connect');
      return h('div', null,
        h('div', { class: 'set-row' }, h('div', { class: 'set-label' }, 'Status'), statusLine),
        h('div', { class: 'set-row' }, h('div', { class: 'set-label' }, 'Sync key', h('div', { class: 'hint' }, 'Keeps a locked copy on GitHub so your other computers stay up to date, even after working offline.')),
          h('div', { class: 'field' }, h('div', { class: 'row' }, keyIn, btn), err)));
    }
    var rows = [h('div', { class: 'set-row' }, h('div', { class: 'set-label' }, 'Status'), h('div', null, statusLine, sy.message && sy.state !== 'ok' ? h('div', { class: 'hint', style: { marginTop: '6px' } }, sy.message) : null))];
    rows.push(h('div', { class: 'set-row' }, h('div', { class: 'set-label' }, 'Repository'), h('div', null, h('div', null, sy.repo || ''), sy.lastOk ? h('div', { class: 'hint' }, 'Last synced ' + L.fmtTimestamp(sy.lastOk)) : null)));
    if (PHONE) {
      if (sy.state === 'mismatch' || sy.state === 'auth') {
        rows.push(h('div', { class: 'notice bad' }, icon('alert', 18), h('div', null, h('b', null, 'Connect this iPhone again.'),
          h('div', null, sy.message || 'GitHub turned this iPhone away.'), h('div', null, 'Remove Splits from this iPhone below, then scan the QR code on your computer again.'))));
      }
      rows.push(h('div', { class: 'set-row' }, h('div', { class: 'set-label' }, 'Actions'), h('div', { class: 'row wrap' },
        h('button', { type: 'button', class: 'btn', onclick: function () {
          var t = toast('Syncing…', { busy: true });
          api.post('/api/sync/now').then(function (s2) { t.close(); st.server = s2; if (s2.rev !== st.rev) return loadData(); }).then(function () { render(); var i = syncInfo(); toast(i.title + (i.sub ? ', ' + i.sub : '')); }).catch(function (e) { t.close(); handleError(e); });
        } }, icon('refresh', 16), 'Sync now'))));
      return h('div', null, rows);
    }
    if (sy.state === 'mismatch') {
      rows.push(h('div', { class: 'notice bad' }, icon('alert', 18), h('div', null,
        h('b', null, 'GitHub has a different ledger.'),
        h('div', null, 'This happens when Splits was set up separately on two computers. Merge keeps the records of both and this computer switches to the GitHub ledger\'s password.'),
        h('div', { class: 'row', style: { marginTop: '10px' } }, h('button', { type: 'button', class: 'btn btn-primary btn-sm', onclick: function () {
          withPassword({ title: 'Merge with the ledger on GitHub', text: 'Type the password of the ledger on GitHub, the one your other computer uses.', confirm: 'Merge' }, function (pw) {
            return api.post('/api/sync/adopt', { password: pw }).then(function (s) { st.server = s; return loadData(); }).then(function () { render(); toast('Ledgers merged. Use the GitHub ledger\'s password from now on.'); });
          });
        } }, icon('merge', 16), 'Merge')))));
    }
    if (sy.state === 'auth') {
      var k2 = h('input', { class: 'input', placeholder: 'owner/repository#github_pat_…', spellcheck: 'false' });
      rows.push(h('div', { class: 'set-row' }, h('div', { class: 'set-label' }, 'New sync key'), h('div', { class: 'row' }, k2, h('button', { type: 'button', class: 'btn btn-primary', onclick: function () {
        api.post('/api/sync/connect', { key: k2.value }).then(refreshState).then(function () { render(); toast('Connected to GitHub'); }).catch(handleError);
      } }, 'Connect'))));
    }
    rows.push(h('div', { class: 'set-row' }, h('div', { class: 'set-label' }, 'Actions'), h('div', { class: 'row wrap' },
      h('button', { type: 'button', class: 'btn', onclick: function () {
        var t = toast('Syncing…', { busy: true });
        api.post('/api/sync/now').then(function (s) { t.close(); st.server = s; if (s.rev !== st.rev) return loadData(); }).then(function () { render(); var i = syncInfo(); toast(i.title + (i.sub ? ', ' + i.sub : '')); }).catch(function (e) { t.close(); handleError(e); });
      } }, icon('refresh', 16), 'Sync now'),
      h('button', { type: 'button', class: 'btn', onclick: showSyncKey }, icon('copy', 16), 'Key for another computer'),
      h('button', { type: 'button', class: 'btn', onclick: showPhoneLink }, icon('phone', 16), 'Use Splits on your iPhone'),
      h('button', { type: 'button', class: 'btn btn-ghost btn-danger', onclick: function () {
        confirmDialog({ title: 'Stop syncing?', text: 'The ledger stays on this computer and on GitHub. Other computers stop getting this computer\'s changes.', confirm: 'Stop syncing', danger: true }).then(function (ok) {
          if (ok) api.post('/api/sync/disconnect').then(function (s) { st.server = s; render(); toast('Sync stopped'); }).catch(handleError);
        });
      } }, 'Stop syncing'))));
    return h('div', null, rows);
  }

  function showSyncKey() {
    withPassword({ title: 'Key for another computer', text: 'Type your password to see the sync key. On the other computer, open Splits, choose "Connect to my ledger" and paste it.' }, function (pw) {
      return api.post('/api/sync/key', { password: pw }).then(function (res) {
        setTimeout(function () {
          openModal(function (close) {
            return modalFrame('Sync key', 'Keep it private. Anyone with this key can change the copy on GitHub, but only your password opens it.', [h('div', { class: 'mono-box' }, res.key)], [
              h('button', { type: 'button', class: 'btn btn-ghost', onclick: close }, 'Close'),
              h('button', { type: 'button', class: 'btn btn-primary', onclick: function () { copyText(res.key); } }, icon('copy', 16), 'Copy key')
            ]);
          });
        }, 50);
      });
    });
  }

  // The QR code that connects an iPhone. It only carries locked data, so it needs the password too.
  function showPhoneLink() {
    api.get('/api/phone').then(function (res) {
      openModal(function (close) {
        var code = h('div', { class: 'qr-box', 'aria-label': 'QR code for the iPhone' });
        code.innerHTML = window.QR.svg(res.url, { size: 280 });
        return modalFrame('Use Splits on your iPhone', 'The iPhone gets the same ledger from GitHub and stays in sync with your computers.', [
          h('div', { class: 'qr-wrap' }, code,
            h('ol', { class: 'phone-steps' },
              h('li', null, 'Open the Camera on your iPhone and point it at this code.'),
              h('li', null, 'Tap the link that appears. Safari opens Splits.'),
              h('li', null, 'Tap the Share button, then Add to Home Screen, then Add.'),
              h('li', null, 'Open Splits from your Home Screen and type your password.'))),
          h('p', { class: 'hint' }, 'The code is locked with your password, so it\'s safe to keep on screen. You can make it again any time.')
        ], [
          h('button', { type: 'button', class: 'btn btn-ghost', onclick: function () { copyText(res.url); } }, icon('copy', 16), 'Copy link'),
          h('button', { type: 'button', class: 'btn btn-primary', onclick: close }, 'Done')
        ]);
      }, { wide: true });
    }).catch(handleError);
  }

  function copyText(text) {
    navigator.clipboard.writeText(text).then(function () { toast('Copied'); }, function () { toast('Couldn\'t copy. Select the text and press Ctrl+C.', { error: true }); });
  }

  function changePassword() {
    openModal(function (close) {
      var cur = h('input', { class: 'input', type: 'password', autocomplete: 'current-password', autofocus: true });
      var n1 = h('input', { class: 'input', type: 'password', autocomplete: 'new-password' });
      var n2 = h('input', { class: 'input', type: 'password', autocomplete: 'new-password' });
      var err = h('div', { class: 'error-text', hidden: true });
      var btn;
      function submit() {
        if (!n1.value) { err.textContent = 'Type a new password.'; err.hidden = false; return; }
        if (n1.value !== n2.value) { err.textContent = 'The new passwords don\'t match.'; err.hidden = false; return; }
        btn.disabled = true;
        api.post('/api/password', { current: cur.value, next: n1.value }).then(function () { close(); toast('Password changed. Your other computers use the new one after their next sync.'); })
          .catch(function (e) { btn.disabled = false; err.textContent = e.message; err.hidden = false; });
      }
      [cur, n1, n2].forEach(function (i) { i.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); }); });
      return modalFrame('Change password', null, [
        h('div', { class: 'field' }, h('label', null, 'Current password'), cur),
        h('div', { class: 'field' }, h('label', null, 'New password'), n1),
        h('div', { class: 'field' }, h('label', null, 'New password again'), n2), err
      ], [h('button', { type: 'button', class: 'btn btn-ghost', onclick: close }, 'Cancel'), btn = h('button', { type: 'button', class: 'btn btn-primary', onclick: submit }, 'Change password')]);
    });
  }

  function showRecoveryCode(code, then) {
    openModal(function (close) {
      var ok = h('input', { type: 'checkbox' });
      var btn = h('button', { type: 'button', class: 'btn btn-primary', disabled: true, onclick: function () { close(); if (then) then(); } }, 'Done');
      ok.addEventListener('change', function () { btn.disabled = !ok.checked; });
      return modalFrame('Your recovery code', 'Write it down or keep it in a safe note. If you forget your password, this code is the only way back in.', [
        h('div', { class: 'code-box' }, code),
        h('div', { class: 'row' }, h('button', { type: 'button', class: 'btn btn-sm', onclick: function () { copyText(code); } }, icon('copy', 16), 'Copy code')),
        h('label', { class: 'check' }, ok, 'I saved my recovery code')
      ], [btn]);
    }, { sticky: true });
  }

  function newRecovery() {
    withPassword({ title: 'Make a new recovery code', text: 'The old code stops working.', confirm: 'Make code' }, function (pw) {
      return api.post('/api/recovery', { password: pw }).then(function (res) { setTimeout(function () { showRecoveryCode(res.recoveryCode); }, 50); });
    });
  }

  // ---- iPhone backups: a locked file through the share sheet, and back
  function phoneBackup() {
    api.post('/api/backup/export').then(function (res) {
      readySheet([KIT.file(new Blob([res.json], { type: 'application/json' }), res.name)], 'backup');
    }).catch(handleError);
  }
  function phoneRestore() {
    var input = h('input', { type: 'file', accept: '.json,application/json', style: { display: 'none' } });
    input.addEventListener('change', function () {
      var f = input.files && input.files[0];
      input.remove();
      if (!f) return;
      f.text().then(function (json) {
        return confirmDialog({ title: 'Restore ' + f.name + '?', text: 'The ledger goes back to how it was in that backup, on this iPhone and on your computers.', confirm: 'Restore' }).then(function (ok) {
          if (!ok) return;
          function run(pw) {
            return api.post('/api/backup/import', { json: json, password: pw || '' }).then(function (res) {
              return loadData().then(function () { render(); toast(res.changes ? 'Backup restored' : 'Nothing to change. The ledger already matches that backup.'); });
            });
          }
          return run().catch(function (e) {
            if (e.data && e.data.needPassword) {
              withPassword({ title: 'Password of that backup', text: e.message, confirm: 'Restore' }, function (pw) { return run(pw); });
            } else handleError(e);
          });
        });
      }).catch(handleError);
    });
    document.body.appendChild(input);
    input.click();
  }
  function removeFromPhone() {
    confirmDialog({ title: 'Remove Splits from this iPhone?', text: 'The ledger is taken off this iPhone. Your computers and the copy on GitHub keep everything. To use Splits here again, scan the QR code on your computer.', confirm: 'Remove', danger: true }).then(function (ok) {
      if (!ok) return;
      api.post('/api/sync/disconnect').then(function (s2) { st.server = s2; st.db = null; st.setup = { step: 'welcome', code: '', error: '' }; render(); toast('Splits was removed from this iPhone'); }).catch(handleError);
    });
  }

  function backupNow() {
    api.post('/api/backups/create').then(function () { return refreshState(); }).then(function () { render(); toast('Backup saved'); }).catch(handleError);
  }

  function restoreBackup() {
    api.get('/api/backups').then(function (res) {
      openModal(function (close) {
        var list = res.backups || [];
        return modalFrame('Restore a backup', 'The ledger goes back to how it was then. Splits backs up the current state first, so you can undo this.', [
          list.length ? h('div', { class: 'checklist', style: { maxHeight: '320px' } }, list.map(function (b) {
            return h('div', { class: 'row between', style: { padding: '8px' } },
              h('div', null, h('div', null, L.fmtTimestamp(b.at)), h('div', { class: 'hint' }, b.name)),
              h('button', { type: 'button', class: 'btn btn-sm', onclick: function () { close(); doRestore(b); } }, 'Restore'));
          })) : h('p', { class: 'muted' }, 'No backups yet.')
        ], [h('button', { type: 'button', class: 'btn btn-ghost', onclick: close }, 'Close')]);
      }, { wide: true });
    }).catch(handleError);
  }

  function doRestore(b, password) {
    confirmDialog({ title: 'Restore the backup from ' + L.fmtTimestamp(b.at) + '?', text: 'Changes made after it are undone on every computer.', confirm: 'Restore' }).then(function (ok) {
      if (!ok) return;
      api.post('/api/backups/restore', { name: b.name, password: password || '' }).then(function (res) {
        return loadData().then(function () { render(); toast(res.changes ? 'Backup restored' : 'Nothing to change. The ledger already matches that backup.'); });
      }).catch(function (e) {
        if (/different password/.test(e.message)) {
          withPassword({ title: 'Password of that backup', text: e.message, confirm: 'Restore' }, function (pw) {
            return api.post('/api/backups/restore', { name: b.name, password: pw }).then(function () { return loadData(); }).then(function () { render(); toast('Backup restored'); });
          });
        } else handleError(e);
      });
    });
  }

  // ---------------------------------------------------------------- lock & setup
  function brand(working) {
    return h('div', { class: 'lock-brand' + (working ? ' working' : '') }, D.logo(88, { hole: '#26173a' }), h('div', { class: 'lock-word' }, 'Splits'));
  }

  function lockScreen() {
    var lockUntil = st.server.lockUntil || 0;
    var err = h('div', { class: 'error-text', hidden: true });
    var brandEl = brand(false);
    if (st.lockView === 'recover') {
      var code = h('input', { class: 'input', autofocus: true, placeholder: 'XXXX-XXXX-XXXX-XXXX-XXXX-XXXX', spellcheck: 'false', autocomplete: 'off' });
      var n1 = h('input', { class: 'input', type: 'password', autocomplete: 'new-password' });
      var n2 = h('input', { class: 'input', type: 'password', autocomplete: 'new-password' });
      var btn;
      var submitR = function () {
        if (!n1.value) { err.textContent = 'Choose a new password.'; err.hidden = false; return; }
        if (n1.value !== n2.value) { err.textContent = 'The new passwords don\'t match.'; err.hidden = false; return; }
        btn.disabled = true; brandEl.classList.add('working');
        api.post('/api/recover', { code: code.value, next: n1.value }).then(function (s) { st.server = s; return loadData(); }).then(function () { st.lockView = 'password'; render(); toast('Password reset. Make a new recovery code in Settings if you like.'); })
          .catch(function (e) { btn.disabled = false; brandEl.classList.remove('working'); err.textContent = e.message; err.hidden = false; });
      };
      [code, n1, n2].forEach(function (i) { i.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitR(); }); });
      return h('div', { class: 'lock' }, h('div', { class: 'lock-wrap' }, brandEl,
        h('div', { class: 'lock-card' }, h('h1', null, 'Reset your password'), h('p', null, 'Type the recovery code you saved when you set up Splits.'),
          h('div', { class: 'field' }, h('label', null, 'Recovery code'), code),
          h('div', { class: 'field' }, h('label', null, 'New password'), n1),
          h('div', { class: 'field' }, h('label', null, 'New password again'), n2), err,
          btn = h('button', { type: 'button', class: 'btn btn-primary btn-wide', onclick: submitR }, 'Reset password')),
        h('div', { class: 'lock-foot' }, h('button', { type: 'button', class: 'link-btn', onclick: function () { st.lockView = 'password'; render(); } }, 'Back to unlock'))));
    }
    var pw = h('input', { class: 'input', type: 'password', autofocus: true, autocomplete: 'current-password', placeholder: 'Password', 'aria-label': 'Password', 'data-fk': 'unlock-pw' });
    var ub;
    function showLockout(until) {
      var left = Math.ceil((until - Date.now()) / 1000);
      if (left <= 0) { err.hidden = true; ub.disabled = false; return; }
      ub.disabled = true;
      err.textContent = 'Too many wrong tries. Try again in ' + left + ' seconds.';
      err.hidden = false;
      setTimeout(function () { if (document.body.contains(err)) showLockout(until); }, 1000);
    }
    function submit() {
      if (!pw.value) return;
      ub.disabled = true; brandEl.classList.add('working');
      api.post('/api/unlock', { password: pw.value }).then(function (s) {
        st.server = s;
        return loadData();
      }).then(function () { st.lastActivity = Date.now(); st.animatedOverview = false; render(); })
        .catch(function (e) {
          brandEl.classList.remove('working'); ub.disabled = false;
          if (e.gone) return showGone();
          if (e.data && e.data.lockUntil) { showLockout(e.data.lockUntil); return; }
          err.textContent = e.message; err.hidden = false; pw.select();
        });
    }
    pw.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
    var node = h('div', { class: 'lock' }, h('div', { class: 'lock-wrap' }, brandEl,
      h('div', { class: 'lock-card' }, h('div', { class: 'field' }, h('label', null, 'Password'), pw), err,
        ub = h('button', { type: 'button', class: 'btn btn-primary btn-wide', onclick: submit }, icon('lock', 17), 'Unlock')),
      h('div', { class: 'lock-foot' }, h('button', { type: 'button', class: 'link-btn', onclick: function () { st.lockView = 'recover'; render(); } }, 'Forgot your password?'))));
    if (lockUntil > Date.now()) afterRender(function () { showLockout(lockUntil); });
    afterRender(function () { pw.focus(); });
    return node;
  }

  function setupScreen() {
    if (PHONE) return phoneSetup();
    var stp = st.setup;
    var err = h('div', { class: 'error-text', hidden: !stp.error }, stp.error || '');
    var brandEl = brand(false);
    function wrap(card, wide, foot) {
      return h('div', { class: 'lock' }, h('div', { class: 'lock-wrap' + (wide ? ' wide' : '') }, brandEl, card, foot || null));
    }
    if (stp.step === 'welcome') {
      return wrap(h('div', { class: 'lock-card' },
        h('h1', null, 'Welcome'),
        h('p', null, 'Splits keeps your artists\' payouts, splits and statements in one locked ledger.'),
        h('button', { type: 'button', class: 'choice', onclick: function () { stp.step = 'new'; stp.error = ''; render(); } },
          h('span', { class: 'ico' }, icon('plus', 20)), h('span', null, h('b', null, 'Start a new ledger'), h('span', null, 'Use this on your first computer.'))),
        h('button', { type: 'button', class: 'choice', onclick: function () { stp.step = 'join'; stp.error = ''; render(); } },
          h('span', { class: 'ico' }, icon('link', 20)), h('span', null, h('b', null, 'Connect to my ledger'), h('span', null, 'Already using Splits on another computer? Paste your sync key.')))), true);
    }
    if (stp.step === 'new') {
      var p1 = h('input', { class: 'input', type: 'password', autofocus: true, autocomplete: 'new-password' });
      var p2 = h('input', { class: 'input', type: 'password', autocomplete: 'new-password' });
      var btn;
      var submit = function () {
        if (!p1.value) { err.textContent = 'Choose a password.'; err.hidden = false; return; }
        if (p1.value !== p2.value) { err.textContent = 'The passwords don\'t match.'; err.hidden = false; return; }
        btn.disabled = true; brandEl.classList.add('working');
        api.post('/api/setup', { password: p1.value }).then(function (res) {
          stp.code = res.recoveryCode; stp.step = 'code'; stp.error = '';
          return refreshState().then(loadData);
        }).then(render).catch(function (e) { btn.disabled = false; brandEl.classList.remove('working'); err.textContent = e.message; err.hidden = false; });
      };
      [p1, p2].forEach(function (i) { i.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); }); });
      afterRender(function () { p1.focus(); });
      return wrap(h('div', { class: 'lock-card' },
        h('div', { class: 'steps' }, h('i', { class: 'on' }), h('i'), h('i')),
        h('h1', null, 'Choose a password'),
        h('p', null, 'You type it each time you open Splits. It also locks your backups and the copy on GitHub.'),
        h('div', { class: 'field' }, h('label', null, 'Password'), p1),
        h('div', { class: 'field' }, h('label', null, 'Password again'), p2), err,
        btn = h('button', { type: 'button', class: 'btn btn-primary btn-wide', onclick: submit }, 'Create ledger')), false,
        h('div', { class: 'lock-foot' }, h('button', { type: 'button', class: 'link-btn', onclick: function () { stp.step = 'welcome'; render(); } }, 'Back')));
    }
    if (stp.step === 'join') {
      var key = h('input', { class: 'input', autofocus: true, placeholder: 'owner/repository#github_pat_…', spellcheck: 'false', autocomplete: 'off' });
      var pw = h('input', { class: 'input', type: 'password', autocomplete: 'current-password' });
      var jb;
      var submitJ = function () {
        jb.disabled = true; brandEl.classList.add('working');
        api.post('/api/join', { key: key.value, password: pw.value }).then(function (s) { st.server = s; return loadData(); }).then(function () { render(); toast('Connected. This computer now shares the ledger.'); })
          .catch(function (e) { jb.disabled = false; brandEl.classList.remove('working'); err.textContent = e.message; err.hidden = false; });
      };
      [key, pw].forEach(function (i) { i.addEventListener('keydown', function (e) { if (e.key === 'Enter') submitJ(); }); });
      afterRender(function () { key.focus(); });
      return wrap(h('div', { class: 'lock-card' },
        h('h1', null, 'Connect to my ledger'),
        h('p', null, 'On your other computer, open Settings, then Sync with GitHub, then "Key for another computer".'),
        h('div', { class: 'field' }, h('label', null, 'Sync key'), key),
        h('div', { class: 'field' }, h('label', null, 'Password of the ledger'), pw), err,
        jb = h('button', { type: 'button', class: 'btn btn-primary btn-wide', onclick: submitJ }, icon('link', 17), 'Connect')), false,
        h('div', { class: 'lock-foot' }, h('button', { type: 'button', class: 'link-btn', onclick: function () { stp.step = 'welcome'; stp.error = ''; render(); } }, 'Back')));
    }
    return h('div', { class: 'lock' });
  }

  function phoneSetup() {
    var stp = st.setup;
    var err = h('div', { class: 'error-text', hidden: !stp.error }, stp.error || '');
    var brandEl = brand(false);
    function wrap(card, foot) { return h('div', { class: 'lock' }, h('div', { class: 'lock-wrap' }, brandEl, card, foot || null)); }
    if (st.server.pairing && !STANDALONE && stp.step !== 'here') {
      return wrap(h('div', { class: 'lock-card' },
        h('h1', null, 'Add Splits to your Home Screen'),
        h('p', null, 'Splits works best as an app on your Home Screen.'),
        h('ol', { class: 'phone-steps' },
          h('li', null, 'Tap the Share button at the bottom of Safari.'),
          h('li', null, 'Choose Add to Home Screen, then Add.'),
          h('li', null, 'Open Splits from your Home Screen and type your password.')),
        h('p', { class: 'hint' }, 'If Splits asks for the link there, copy it here and paste it.'),
        h('div', { class: 'row wrap' },
          h('button', { type: 'button', class: 'btn', onclick: function () { copyText(location.href); } }, icon('copy', 16), 'Copy link'),
          h('button', { type: 'button', class: 'btn btn-ghost', onclick: function () { stp.step = 'here'; render(); } }, 'Use it here in Safari'))));
    }
    if (st.server.pairing) {
      var pw = h('input', { class: 'input', type: 'password', autofocus: true, autocomplete: 'current-password', placeholder: 'Password', 'aria-label': 'Password' });
      var pb;
      var submit = function () {
        if (!pw.value) return;
        pb.disabled = true; brandEl.classList.add('working');
        api.post('/api/pair', { password: pw.value }).then(function (s2) { st.server = s2; return loadData(); })
          .then(function () { st.setup = { step: 'welcome', code: '', error: '' }; render(); toast('Connected. This iPhone now shares your ledger.'); })
          .catch(function (e) {
            pb.disabled = false; brandEl.classList.remove('working');
            err.textContent = e.data && e.data.lockUntil ? e.message : e.message; err.hidden = false; pw.select();
          });
      };
      pw.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
      afterRender(function () { pw.focus(); });
      return wrap(h('div', { class: 'lock-card' },
        h('h1', null, 'Connect this iPhone'),
        h('p', null, 'Type the password you use for Splits on your computer.'),
        h('div', { class: 'field' }, h('label', null, 'Password'), pw), err,
        pb = h('button', { type: 'button', class: 'btn btn-primary btn-wide', onclick: submit }, icon('link', 17), 'Connect')),
        h('div', { class: 'lock-foot' }, h('button', { type: 'button', class: 'link-btn', onclick: function () { api.post('/api/pair/forget').then(function (s2) { st.server = s2; render(); }); } }, 'Use another link')));
    }
    if (stp.step === 'join') {
      var key = h('input', { class: 'input', placeholder: 'owner/repository#github_pat_…', spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off' });
      var pw2 = h('input', { class: 'input', type: 'password', autocomplete: 'current-password' });
      var jb;
      var submitJ = function () {
        jb.disabled = true; brandEl.classList.add('working');
        api.post('/api/join', { key: key.value, password: pw2.value }).then(function (s2) { st.server = s2; return loadData(); }).then(function () { st.setup.step = 'welcome'; render(); toast('Connected. This iPhone now shares your ledger.'); })
          .catch(function (e) { jb.disabled = false; brandEl.classList.remove('working'); err.textContent = e.message; err.hidden = false; });
      };
      return wrap(h('div', { class: 'lock-card' },
        h('h1', null, 'Connect with the sync key'),
        h('p', null, 'On your computer: Settings, Sync with GitHub, Key for another computer.'),
        h('div', { class: 'field' }, h('label', null, 'Sync key'), key),
        h('div', { class: 'field' }, h('label', null, 'Password'), pw2), err,
        jb = h('button', { type: 'button', class: 'btn btn-primary btn-wide', onclick: submitJ }, icon('link', 17), 'Connect')),
        h('div', { class: 'lock-foot' }, h('button', { type: 'button', class: 'link-btn', onclick: function () { stp.step = 'welcome'; stp.error = ''; render(); } }, 'Back')));
    }
    var link = h('textarea', { class: 'input', rows: 3, placeholder: 'Paste the link from your computer', spellcheck: 'false', autocapitalize: 'off', style: { height: 'auto', padding: '10px 12px', resize: 'none' } });
    var lb;
    var submitL = function () {
      lb.disabled = true;
      api.post('/api/pairlink', { link: link.value }).then(function (s2) { st.server = s2; stp.step = 'here'; render(); })
        .catch(function (e) { lb.disabled = false; err.textContent = e.message; err.hidden = false; });
    };
    return wrap(h('div', { class: 'lock-card' },
      h('h1', null, 'Connect this iPhone'),
      h('ol', { class: 'phone-steps' },
        h('li', null, 'On your computer, open Splits, then Settings, then Use Splits on your iPhone.'),
        h('li', null, 'Scan the QR code with the iPhone camera.')),
      h('p', { class: 'hint' }, 'Or paste the link here:'),
      link, err,
      lb = h('button', { type: 'button', class: 'btn btn-primary btn-wide', onclick: submitL }, 'Continue')),
      h('div', { class: 'lock-foot' }, h('button', { type: 'button', class: 'link-btn', onclick: function () { stp.step = 'join'; stp.error = ''; render(); } }, 'Use a sync key instead')));
  }

  // After the ledger is created: show the recovery code, then offer GitHub.
  function afterSetup() {
    if (st.setup.step === 'code' && st.setup.code) {
      var code = st.setup.code;
      st.setup.code = '';
      st.setup.step = 'done';
      showRecoveryCode(code, function () { offerSync(); });
    }
  }
  function offerSync() {
    openModal(function (close) {
      var keyIn = h('input', { class: 'input', placeholder: 'owner/repository#github_pat_…', spellcheck: 'false', autofocus: true });
      var err = h('div', { class: 'error-text', hidden: true });
      var btn;
      function submit() {
        btn.disabled = true;
        api.post('/api/sync/connect', { key: keyIn.value }).then(refreshState).then(function () { close(); render(); toast('Connected to GitHub'); })
          .catch(function (e) { btn.disabled = false; err.textContent = e.message; err.hidden = false; });
      }
      keyIn.addEventListener('keydown', function (e) { if (e.key === 'Enter') submit(); });
      return modalFrame('Sync with GitHub', 'Paste your sync key to keep a locked copy on GitHub and use the ledger on your laptop too. You can also do this later in Settings.', [
        h('div', { class: 'field' }, h('label', null, 'Sync key'), keyIn), err
      ], [h('button', { type: 'button', class: 'btn btn-ghost', onclick: close }, 'Later'), btn = h('button', { type: 'button', class: 'btn btn-primary', onclick: submit }, icon('link', 16), 'Connect')]);
    });
  }

  function showGone(msg) {
    if (st.gone) return;
    st.gone = true;
    document.body.appendChild(h('div', { class: 'gone', role: 'alert' }, h('div', null, D.logo(64, { hole: '#26173a' }), h('h2', null, 'Splits has closed'), h('p', null, msg || 'Close this window and open Splits again. Your work is saved.'))));
  }

  // ================================================================ heartbeat, idle lock
  var beatFails = 0;
  function beat() {
    if (st.gone) return;
    api.post('/api/beat').then(function (s) {
      beatFails = 0;
      var wasLocked = st.server && st.server.locked;
      st.server = s;
      if (s.locked && st.db) { st.db = null; st.drawer = null; modalRoot.replaceChildren(); closePop(); render(); return; }
      if (!s.locked && wasLocked && !st.db) return;
      if (!s.locked && st.db && s.rev !== st.rev) { loadData().then(function () { if (st.imp.text) reparse(); render(); }); return; }
      updateSyncChip();
    }).catch(function (e) {
      // A computer waking from sleep can drop a check or two; only give up when Splits is really gone.
      if (e.gone && ++beatFails >= 3) showGone();
    });
  }

  function idleCheck() {
    if (!st.db) return;
    var mins = settings().autoLock;
    if (mins > 0 && Date.now() - st.lastActivity > mins * 60000) lockNow();
  }

  // iPhone: tables turn into cards, so every cell gets its column name as a label.
  function labelTables(rootEl) {
    Array.prototype.forEach.call(rootEl.querySelectorAll('table.tbl'), function (t) {
      var heads = [];
      var hr = t.tHead && t.tHead.rows[t.tHead.rows.length - 1];
      if (hr) Array.prototype.forEach.call(hr.cells, function (th) { var txt = th.textContent.trim(); for (var i = 0; i < (th.colSpan || 1); i++) heads.push(txt); });
      var bodies = Array.prototype.slice.call(t.tBodies);
      if (t.tFoot) bodies.push(t.tFoot);
      bodies.forEach(function (tb) {
        Array.prototype.forEach.call(tb.rows, function (tr) {
          var col = 0, main = false;
          Array.prototype.forEach.call(tr.cells, function (td) {
            if (heads[col] && !td.hasAttribute('data-label')) td.setAttribute('data-label', heads[col]);
            if (!main && !td.classList.contains('check-col') && td.colSpan === 1) { td.classList.add('cell-main'); main = true; }
            col += td.colSpan || 1;
          });
        });
      });
    });
  }

  // ================================================================ boot
  function boot() {
    appRoot = document.getElementById('app');
    layerRoot = document.getElementById('layer');
    modalRoot = document.getElementById('modals');
    toastRoot = document.getElementById('toasts');
    setupTooltips();
    ['mousemove', 'keydown', 'mousedown', 'wheel', 'touchstart'].forEach(function (ev) {
      window.addEventListener(ev, function () { st.lastActivity = Date.now(); }, { passive: true });
    });
    document.addEventListener('keydown', function (e) {
      var typing = e.target && e.target.closest && e.target.closest('input, textarea, select, [contenteditable]');
      if (e.key === 'Escape' && !modalRoot.children.length) {
        if (popEl) closePop();
        else if (st.drawer) closeDrawer();
        else if (!typing) { st.payouts.sel = {}; st.payments.sel = {}; st.artists.sel = {}; render(); }
      }
      if (e.key === 'Delete' && !typing && !modalRoot.children.length && !st.drawer && st.deleteSelected) { e.preventDefault(); st.deleteSelected(); }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l' && st.db) { e.preventDefault(); lockNow(); }
    });
    if (PHONE) {
      window.SplitsLocal.onChange(function () { setTimeout(beat, 30); });
      document.body.classList.add('is-phone');
      var labelling = false;
      new MutationObserver(function () {
        if (labelling) return;
        labelling = true;
        requestAnimationFrame(function () { labelling = false; labelTables(document); });
      }).observe(document.body, { childList: true, subtree: true });
    }
    if (!PHONE) window.addEventListener('pagehide', function () {
      try { fetch('/api/bye', { method: 'POST', keepalive: true, headers: { 'X-Splits': '1', 'Content-Type': 'application/json' }, body: '{}' }); } catch (e) { /* closing */ }
    });
    window.addEventListener('resize', function () { if (st.drawer) render(); });
    refreshState().then(function (s) {
      if (!s.locked) return loadData();
    }).then(function () { render(); }).catch(function (e) {
      if (e.status === 401) showGone('Open Splits from its icon.');
      else if (e.gone) showGone();
      else toast(e.message, { error: true });
    });
    setInterval(beat, 5000);
    setInterval(idleCheck, 15000);
    setInterval(function () { if (st.db && st.route === 'overview') updateSyncChip(); }, 30000);
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
