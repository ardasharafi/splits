/* Splits — pure logic shared by the app window and the PDF pages.
   Dates, money, the text importer and every calculation live here so the
   screen and the statements always agree. */
(function (root) {
  'use strict';

  // ---------------------------------------------------------------- Jalali
  // Borkowski's algorithm (as in jalaali-js).
  var BREAKS = [-61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394, 2456, 3178];
  function div(a, b) { return ~~(a / b); }
  function mod(a, b) { return a - ~~(a / b) * b; }
  function jalCal(jy, withoutLeap) {
    var bl = BREAKS.length, gy = jy + 621, leapJ = -14, jp = BREAKS[0], jm, jump, leap, leapG, march, n, i;
    if (jy < jp || jy >= BREAKS[bl - 1]) throw new Error('Invalid Jalali year ' + jy);
    for (i = 1; i < bl; i += 1) {
      jm = BREAKS[i];
      jump = jm - jp;
      if (jy < jm) break;
      leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
      jp = jm;
    }
    n = jy - jp;
    leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
    if (mod(jump, 33) === 4 && jump - n === 4) leapJ += 1;
    leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
    march = 20 + leapJ - leapG;
    if (withoutLeap) return { gy: gy, march: march };
    if (jump - n < 6) n = n - jump + div(jump + 4, 33) * 33;
    leap = mod(mod(n + 1, 33) - 1, 4);
    if (leap === -1) leap = 4;
    return { leap: leap, gy: gy, march: march };
  }
  function g2d(gy, gm, gd) {
    var d = div((gy + div(gm - 8, 6) + 100100) * 1461, 4) + div(153 * mod(gm + 9, 12) + 2, 5) + gd - 34840408;
    return d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  }
  function d2g(jdn) {
    var j = 4 * jdn + 139361631;
    j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
    var i = div(mod(j, 1461), 4) * 5 + 308;
    var gd = div(mod(i, 153), 5) + 1;
    var gm = mod(div(i, 153), 12) + 1;
    var gy = div(j, 1461) - 100100 + div(8 - gm, 6);
    return { gy: gy, gm: gm, gd: gd };
  }
  function d2j(jdn) {
    var gy = d2g(jdn).gy, jy = gy - 621, r = jalCal(jy, false), jdn1f = g2d(gy, 3, r.march), jd, jm, k;
    k = jdn - jdn1f;
    if (k >= 0) {
      if (k <= 185) { jm = 1 + div(k, 31); jd = mod(k, 31) + 1; return { jy: jy, jm: jm, jd: jd }; }
      k -= 186;
    } else {
      jy -= 1;
      k += 179;
      if (r.leap === 1) k += 1;
    }
    jm = 7 + div(k, 30);
    jd = mod(k, 30) + 1;
    return { jy: jy, jm: jm, jd: jd };
  }
  function toJalali(gy, gm, gd) { return d2j(g2d(gy, gm, gd)); }

  // ---------------------------------------------------------------- dates
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var MON = MONTHS.map(function (m) { return m.slice(0, 3); });
  var JMONTHS = ['Farvardin', 'Ordibehesht', 'Khordad', 'Tir', 'Mordad', 'Shahrivar', 'Mehr', 'Aban', 'Azar', 'Dey', 'Bahman', 'Esfand'];

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(y, m, d) { return y + '-' + pad(m) + '-' + pad(d); }
  function parseISO(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    return m ? { y: +m[1], m: +m[2], d: +m[3] } : null;
  }
  function validDate(y, m, d) {
    if (m < 1 || m > 12 || d < 1) return false;
    return d <= daysInMonth(y, m);
  }
  function daysInMonth(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }
  function todayISO(now) {
    var t = now ? new Date(now) : new Date();
    return iso(t.getFullYear(), t.getMonth() + 1, t.getDate());
  }
  function addDays(s, n) {
    var p = parseISO(s);
    var t = new Date(Date.UTC(p.y, p.m - 1, p.d + n));
    return iso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
  }
  function fmtDate(s, opts) {
    var p = parseISO(s);
    if (!p) return '';
    if (opts && opts.short) return MON[p.m - 1] + ' ' + p.d;
    return MON[p.m - 1] + ' ' + p.d + ', ' + p.y;
  }
  function jalaliOf(s) {
    var p = parseISO(s);
    return p ? toJalali(p.y, p.m, p.d) : null;
  }
  function fmtJDate(s) {
    var j = jalaliOf(s);
    return j ? j.jd + ' ' + JMONTHS[j.jm - 1] + ' ' + j.jy : '';
  }
  function fmtTimestamp(ms) {
    if (!ms) return '';
    var t = new Date(ms);
    var h = t.getHours(), ap = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return fmtDate(iso(t.getFullYear(), t.getMonth() + 1, t.getDate())) + ', ' + h + ':' + pad(t.getMinutes()) + ' ' + ap;
  }

  function monthRange(y, m) { return { from: iso(y, m, 1), to: iso(y, m, daysInMonth(y, m)) }; }
  function shiftMonth(y, m, delta) {
    var i = y * 12 + (m - 1) + delta;
    return { y: Math.floor(i / 12), m: (i % 12) + 1 };
  }

  function presets(today) {
    var t = parseISO(today);
    var cur = monthRange(t.y, t.m);
    var lm = shiftMonth(t.y, t.m, -1), lmr = monthRange(lm.y, lm.m);
    var three = shiftMonth(t.y, t.m, -2);
    return [
      { id: 'this-month', label: 'This month', from: cur.from, to: cur.to },
      { id: 'last-month', label: 'Last month', from: lmr.from, to: lmr.to },
      { id: 'last-3', label: 'Last 3 months', from: monthRange(three.y, three.m).from, to: cur.to },
      { id: 'this-year', label: 'This year', from: iso(t.y, 1, 1), to: iso(t.y, 12, 31) },
      { id: 'all', label: 'All time', from: '2000-01-01', to: '2099-12-31' }
    ];
  }

  // Human label for a date range, e.g. "November 2026" or "Nov 4 – Nov 11, 2026".
  function rangeLabel(from, to) {
    if (from === '2000-01-01' && to === '2099-12-31') return 'All time';
    var a = parseISO(from), b = parseISO(to);
    if (!a || !b) return '';
    if (a.d === 1 && a.y === b.y && a.m === b.m && b.d === daysInMonth(b.y, b.m)) return MONTHS[a.m - 1] + ' ' + a.y;
    if (a.d === 1 && a.m === 1 && b.m === 12 && b.d === 31 && a.y === b.y) return String(a.y);
    if (a.d === 1 && b.d === daysInMonth(b.y, b.m)) {
      if (a.y === b.y) return MONTHS[a.m - 1] + ' – ' + MONTHS[b.m - 1] + ' ' + a.y;
      return MON[a.m - 1] + ' ' + a.y + ' – ' + MON[b.m - 1] + ' ' + b.y;
    }
    if (from === to) return fmtDate(from);
    if (a.y === b.y) return MON[a.m - 1] + ' ' + a.d + ' – ' + MON[b.m - 1] + ' ' + b.d + ', ' + a.y;
    return fmtDate(from) + ' – ' + fmtDate(to);
  }
  function rangeJLabel(from, to) {
    if (from === '2000-01-01' && to === '2099-12-31') return '';
    var a = jalaliOf(from), b = jalaliOf(to);
    if (!a || !b) return '';
    if (a.jy === b.jy && a.jm === b.jm && a.jd === b.jd) return fmtJDate(from);
    if (a.jy === b.jy) return a.jd + ' ' + JMONTHS[a.jm - 1] + ' – ' + b.jd + ' ' + JMONTHS[b.jm - 1] + ' ' + a.jy;
    return fmtJDate(from) + ' – ' + fmtJDate(to);
  }
  // File-friendly period name, e.g. "2026-11 November".
  function rangeFileLabel(from, to) {
    var a = parseISO(from), b = parseISO(to);
    if (from === '2000-01-01' && to === '2099-12-31') return 'All time';
    if (a && b && a.d === 1 && a.y === b.y && a.m === b.m && b.d === daysInMonth(b.y, b.m)) return a.y + '-' + pad(a.m) + ' ' + MONTHS[a.m - 1];
    return from + ' to ' + to;
  }

  // ---------------------------------------------------------------- money
  var CURRENCIES = {
    USD: { code: 'USD', symbol: '$', name: 'US dollar' },
    CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian dollar' },
    EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
    GBP: { code: 'GBP', symbol: '£', name: 'British pound' },
    AUD: { code: 'AUD', symbol: 'A$', name: 'Australian dollar' }
  };
  function curInfo(c) { return CURRENCIES[c] || { code: c, symbol: c + ' ', name: c }; }
  function groupDigits(s) { return s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function fmtNumber(n) { return (n < 0 ? '−' : '') + groupDigits(String(Math.abs(Math.round(n)))); }
  function fmtMoney(cents, cur, opts) {
    if (cents === null || cents === undefined || isNaN(cents)) return '—';
    var neg = cents < 0;
    var abs = Math.abs(Math.round(cents));
    var whole = Math.floor(abs / 100), frac = abs % 100;
    var s = curInfo(cur).symbol + groupDigits(String(whole)) + '.' + pad(frac);
    if (opts && opts.sign && !neg && cents > 0) return '+' + s;
    return neg ? '−' + s : s;
  }
  function fmtToman(n) {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return fmtNumber(n);
  }
  function fmtPct(bp) {
    var v = bp / 100;
    var s = (Math.round(v * 100) / 100).toString();
    return s + '%';
  }
  function parsePct(s) {
    var v = parseFloat(String(s).replace(/[%\s]/g, '').replace(',', '.'));
    if (isNaN(v)) return null;
    return Math.round(v * 100);
  }
  // Persian and Arabic digits, and the Persian decimal and thousands signs, as plain ASCII.
  function normDigits(s) {
    return String(s === null || s === undefined ? '' : s).replace(/[٠-٩۰-۹]/g, function (c) {
      var code = c.charCodeAt(0);
      return String(code >= 0x06F0 ? code - 0x06F0 : code - 0x0660);
    }).replace(/٫/g, '.').replace(/٬/g, ',');
  }
  function parseMoney(s) {
    var t = normDigits(s).replace(/[^\d.,\-]/g, '');
    if (!t) return null;
    // "1,234.56" or "1234,56"
    if (/,\d{1,2}$/.test(t) && t.indexOf('.') < 0) t = t.replace(',', '.');
    t = t.replace(/,/g, '');
    var v = parseFloat(t);
    if (isNaN(v)) return null;
    return Math.round(v * 100);
  }
  function parseRate(s) {
    var t = String(s || '').replace(/[,\s٬_]/g, '').replace(/[٠-٩۰-۹]/g, function (c) {
      var code = c.charCodeAt(0);
      return String(code >= 0x06F0 ? code - 0x06F0 : code - 0x0660);
    });
    if (!t) return null;
    var v = parseFloat(t);
    if (isNaN(v) || v < 0) return null;
    return Math.round(v);
  }
  function roundDiv(a, b) {
    if (b === 0) return 0;
    var q = Math.abs(a) / Math.abs(b);
    var r = Math.floor(q + 0.5 + 1e-9);
    return (a < 0) !== (b < 0) ? -r : r;
  }

  // ---------------------------------------------------------------- names
  function normName(s) {
    return String(s || '').normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
  }
  function cleanName(s) {
    return String(s || '').replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ').replace(/^[\s:\-–—,.•]+|[\s:\-–—,.•+]+$/g, '').trim();
  }
  var UNNAMED = 'Unnamed';

  // ---------------------------------------------------------------- text import
  var HEADER_RE = /^\s*\[(\d{1,4})([\/.\-])(\d{1,2})\2(\d{1,4}),?\s+(\d{1,2})[:.](\d{2})(?:[:.]\d{2})?\s*([AaPp]\.?\s?[Mm]\.?)?\]\s?(.*)$/;
  var PLACEHOLDER_RE = /\[\s*(?:image_[^\]]*|photo|video|file[^\]]*|sticker[^\]]*|gif|animation|voice[^\]]*|audio[^\]]*|document[^\]]*|album[^\]]*|media[^\]]*|poll[^\]]*|contact[^\]]*|location[^\]]*)\s*\]/gi;
  var WHOLE_BRACKET_RE = /^\s*\[[^\]]{0,160}\]\s*$/;
  // Lines that are only an exchange rate: dropped.
  var LABEL_DROP = [/^(?:currency\s+)?conversion\s+rate\b/i, /^exchange\s+rate\b/i, /^rate\s*:/i];
  // Labels that can sit in front of the amount: the label goes, the amount stays.
  var LABEL_PREFIX = /^(?:amount\s+you\s+will\s+receive|you\s+will\s+receive|amount\s+received|amount)\s*:?\s*/i;
  var SYM = '(?:CA\\$|C\\$|US\\$|A\\$|\\$|€|£)';
  var CODE = '(?:USD|CAD|EUR|GBP|AUD)';
  var NUM = '(\\d[\\d,]*(?:\\.\\d+)?)';
  // "Name +$12.50 ✅", "+ 2662.84 CAD", "Tiem + 2662.84 CAD"
  var SIGNED_RE = new RegExp('^(.*)([+\\-−–])\\s*(' + SYM + ')?\\s*' + NUM + '\\s*(' + CODE + ')?(?![\\d.,])(.*)$', 'i');
  // "2,680.35 CAD", "CA$2,680.35", "Tiem 2662.84 CAD", "USD 50"
  var AMOUNT_RE = new RegExp('^(.*?)\\s*(?:(' + CODE + ')\\s*)?(' + SYM + ')?\\s*' + NUM + '\\s*(' + CODE + ')?\\s*$', 'i');

  // An exchange rate typed by hand: "1.3768", "1,3768", or in Persian digits.
  function parseFx(s) {
    var t = normDigits(s).replace(/[\s_]/g, '');
    if (t.indexOf('.') >= 0) t = t.replace(/,/g, '');
    else if ((t.match(/,/g) || []).length === 1) t = t.replace(',', '.');
    else t = t.replace(/,/g, '');
    if (!/^(\d+\.?\d*|\.\d+)$/.test(t)) return null;
    var v = parseFloat(t);
    return v > 0 && isFinite(v) ? v : null;
  }
  function fmtFx(v) {
    if (!(v > 0)) return '';
    return String(+v.toFixed(v >= 100 ? 2 : v >= 1 ? 4 : 6));
  }
  function convertCents(cents, rate) { return Math.round(+(cents * rate).toFixed(6)); }

  function toCents(numStr) {
    var v = parseFloat(String(numStr).replace(/,/g, ''));
    return isNaN(v) ? null : Math.round(v * 100);
  }

  function parseHeader(line) {
    var m = HEADER_RE.exec(line);
    if (!m) return null;
    var a = +m[1], sep = m[2], b = +m[3], c = +m[4], y, mo, d;
    if (m[1].length === 4) { y = a; mo = b; d = c; }
    else {
      y = c < 100 ? 2000 + c : c;
      if (sep === '/') {
        if (a > 12 && b <= 12) { d = a; mo = b; } else { mo = a; d = b; }
      } else {
        if (b > 12 && a <= 12) { mo = a; d = b; } else { d = a; mo = b; }
      }
    }
    if (!validDate(y, mo, d)) return null;
    var hh = +m[5], mm = +m[6];
    var ap = m[7] ? m[7].replace(/[.\s]/g, '').toUpperCase() : '';
    if (ap === 'PM' && hh < 12) hh += 12;
    if (ap === 'AM' && hh === 12) hh = 0;
    if (hh > 23 || mm > 59) return null;
    var rest = m[8] || '';
    // "Sender: message" — drop the sender.
    var sm = /^([^:\n]{0,80}?):\s?(.*)$/.exec(rest);
    var content = sm ? sm[2] : rest;
    return { date: iso(y, mo, d), time: pad(hh) + ':' + pad(mm), content: content };
  }

  function symCur(sym) {
    if (!sym) return '';
    var x = sym.toUpperCase();
    return x === 'CA$' || x === 'C$' ? 'CAD' : x === 'A$' ? 'AUD' : sym === '€' ? 'EUR' : sym === '£' ? 'GBP' : 'USD';
  }

  function nameOf(s) {
    var n = cleanName(s);
    return /\p{L}/u.test(n) ? n : '';
  }

  function isNameLike(t) { return t.length <= 80 && /\p{L}/u.test(t); }

  function signedLine(line) {
    var m = SIGNED_RE.exec(line);
    if (!m) return null;
    var cents = toCents(m[4]);
    if (cents === null || cents === 0) return null;
    var sign = m[2];
    var after = line.charAt(m[1].length + 1);
    if ((sign === '-' || sign === '−') && after && !/\s/.test(after)) cents = -cents;
    var cur = m[5] ? m[5].toUpperCase() : symCur(m[3]) || 'USD';
    return { name: nameOf(m[1]), cents: cents, cur: cur };
  }

  function amountLine(line) {
    var m = AMOUNT_RE.exec(line);
    if (!m) return null;
    var code = m[5] || m[2];
    if (!code && !m[3]) return null;
    var cents = toCents(m[4]);
    if (cents === null || cents === 0) return null;
    return { name: nameOf(m[1]), cents: cents, cur: code ? code.toUpperCase() : symCur(m[3]) };
  }

  function cleanLine(l) {
    var t = l.replace(PLACEHOLDER_RE, ' ').replace(/[​-‍﻿]/g, '').replace(/\s+/g, ' ').trim();
    if (!t || WHOLE_BRACKET_RE.test(t)) return '';
    for (var i = 0; i < LABEL_DROP.length; i++) if (LABEL_DROP[i].test(t)) return '';
    t = t.replace(LABEL_PREFIX, '').trim();
    if (!/[\p{L}\p{N}]/u.test(t)) return '';
    return t;
  }

  // Splits a pasted chat log (or plain lines) into payment rows.
  // Within a message, a line with a name and no amount is the name of the next amount.
  function parseText(text, opts) {
    opts = opts || {};
    var today = opts.today || todayISO();
    var src = String(text || '').replace(/\r\n?/g, '\n').replace(/ /g, ' ');
    // Two copied logs pasted back to back can glue a date header onto the previous line.
    src = src.replace(/([^\n])(\[\d{1,4}[\/.\-]\d{1,2}[\/.\-]\d{1,4},?\s+\d{1,2}[:.]\d{2}(?:[:.]\d{2})?\s*(?:[AaPp]\.?\s?[Mm]\.?)?\])/g, '$1\n$2');
    var messages = [];
    var cur = null;
    src.split('\n').forEach(function (raw) {
      var h = parseHeader(raw);
      if (h) {
        cur = { date: h.date, time: h.time, lines: [h.content], dated: true };
        messages.push(cur);
      } else {
        if (!cur) { cur = { date: today, time: '', lines: [], dated: false }; messages.push(cur); }
        cur.lines.push(raw);
      }
    });

    var rows = [], ignored = [], occ = {};
    messages.forEach(function (msg) {
      var clean = [];
      msg.lines.forEach(function (l) { var t = cleanLine(l); if (t) clean.push(t); });
      var entries = [], pending = -1, leftovers = [];
      for (var i = 0; i < clean.length; i++) {
        var e = signedLine(clean[i]) || amountLine(clean[i]);
        if (e) {
          if (!e.name && pending >= 0) e.name = nameOf(clean[pending]);
          else if (pending >= 0) leftovers.push(pending);
          pending = -1;
          entries.push(e);
          continue;
        }
        if (pending >= 0) leftovers.push(pending);
        if (isNameLike(clean[i])) pending = i;
        else { pending = -1; leftovers.push(i); }
      }
      if (pending >= 0) leftovers.push(pending);
      // One amount and one loose name in the same message: the name came after the amount.
      if (entries.length === 1 && !entries[0].name) {
        var names = leftovers.filter(function (k) { return isNameLike(clean[k]); });
        if (names.length === 1) {
          entries[0].name = nameOf(clean[names[0]]);
          leftovers = leftovers.filter(function (k) { return k !== names[0]; });
        }
      }
      entries.forEach(function (e) {
        var base = [msg.dated ? msg.date : 'undated', msg.time, normName(e.name), e.cur, e.cents].join('|');
        var n = occ[base] = (occ[base] || 0) + 1;
        rows.push({ date: msg.date, time: msg.time, dated: msg.dated, name: e.name || UNNAMED, unnamed: !e.name, cents: e.cents, cur: e.cur, key: base + '|' + (n - 1) });
      });
      leftovers.sort(function (a, b) { return a - b; }).forEach(function (k) { ignored.push(clean[k]); });
    });

    return { rows: rows, ignored: ignored };
  }

  // ---------------------------------------------------------------- data model helpers
  // db: { artists: {id: rec}, payments: {...}, managers: {...}, settings: {...}, imports: {...} }
  var DEFAULTS = { ownerBP: 1000, managerBP: 1000, business: '', ownerName: 'Owner', myName: 'You', autoLock: 0 };

  function settingsOf(db) {
    var out = {};
    Object.keys(DEFAULTS).forEach(function (k) { out[k] = DEFAULTS[k]; });
    var s = (db && db.settings) || {};
    Object.keys(s).forEach(function (k) { if (s[k] && s[k].value !== undefined) out[k] = s[k].value; });
    return out;
  }

  function splitOf(artist, settings) {
    if (artist && artist.custom) {
      return { ownerBP: artist.ownerBP | 0, managerBP: artist.managerBP | 0 };
    }
    return { ownerBP: settings.ownerBP | 0, managerBP: settings.managerBP | 0 };
  }

  function inRange(p, from, to) { return p.date >= from && p.date <= to; }

  function values(obj) { return Object.keys(obj || {}).map(function (k) { return obj[k]; }); }

  function managersFor(db, artistId) {
    return values(db.managers).filter(function (m) { return (m.artistIds || []).indexOf(artistId) >= 0 && (m.pctBP | 0) > 0; });
  }

  // computeRows: one row per artist and currency in the period.
  function computeRows(db, from, to) {
    var settings = settingsOf(db);
    var groups = {};
    values(db.payments).forEach(function (p) {
      if (!inRange(p, from, to)) return;
      // Payments without a name are probably different artists: each one stays on its own.
      var art = db.artists[p.artistId];
      var key = !art || art.name === UNNAMED ? 'unnamed|' + p.id : p.artistId + '|' + p.cur;
      (groups[key] = groups[key] || []).push(p);
    });
    var rows = Object.keys(groups).map(function (key) {
      var list = groups[key].slice().sort(function (a, b) { return (a.date + (a.time || '')).localeCompare(b.date + (b.time || '')); });
      var artistId = list[0].artistId, cur = list[0].cur;
      var artist = db.artists[artistId] || { name: UNNAMED };
      var split = splitOf(artist, settings);
      var feeBP = split.ownerBP + split.managerBP;
      // Sub-groups by (rate, paid) so each part is computed exactly once.
      var subs = {};
      list.forEach(function (p) {
        var rate = p.rate > 0 ? p.rate : 0;
        var sk = rate + '|' + (p.paid ? 1 : 0);
        var s = subs[sk] || (subs[sk] = { rate: rate, paid: !!p.paid, received: 0, payments: [], paidAt: '' });
        s.received += p.cents;
        s.payments.push(p);
        if (p.paid && p.paidAt && p.paidAt > s.paidAt) s.paidAt = p.paidAt;
      });
      var parts = values(subs).sort(function (a, b) { return a.payments[0].date.localeCompare(b.payments[0].date) || a.rate - b.rate; });
      var received = 0, fee = 0, after = 0, toman = 0, tomanKnown = true, tomanAny = false, unpaid = 0, paidCount = 0, paidAt = '';
      var rates = {};
      parts.forEach(function (s) {
        s.fee = roundDiv(s.received * feeBP, 10000);
        s.after = s.received - s.fee;
        s.toman = s.rate ? roundDiv(s.after * s.rate, 100) : null;
        received += s.received;
        fee += s.fee;
        after += s.after;
        if (s.toman === null) tomanKnown = false; else { toman += s.toman; tomanAny = true; }
        if (!s.paid) unpaid += s.after; else { paidCount += s.payments.length; if (s.paidAt > paidAt) paidAt = s.paidAt; }
        rates[s.rate] = true;
      });
      var owner = feeBP ? roundDiv(fee * split.ownerBP, feeBP) : 0;
      var mine = fee - owner;
      var mgrs = managersFor(db, artistId).map(function (m) {
        var share = roundDiv(received * (m.pctBP | 0), 10000);
        var fromOwnerBP = Math.min(m.ownerBP | 0, m.pctBP | 0);
        var fromOwner = roundDiv(received * fromOwnerBP, 10000);
        if (fromOwner > share) fromOwner = share;
        return { managerId: m.id, name: m.name, pctBP: m.pctBP | 0, share: share, fromOwner: fromOwner, fromMe: share - fromOwner };
      });
      var mgrTotal = 0;
      mgrs.forEach(function (m) { owner -= m.fromOwner; mine -= m.fromMe; mgrTotal += m.share; });
      var rateKeys = Object.keys(rates).map(Number);
      var status = paidCount === 0 ? 'unpaid' : paidCount === list.length ? 'paid' : 'partial';
      var rate = rateKeys.length === 1 ? (rateKeys[0] || null) : 'mixed';
      return {
        key: key, artistId: artistId, name: artist.name || UNNAMED, unnamed: (artist.name || UNNAMED) === UNNAMED,
        paymentId: (artist.name || UNNAMED) === UNNAMED ? list[0].id : null,
        cur: cur, count: list.length, payments: list, parts: parts,
        ownerBP: split.ownerBP, managerBP: split.managerBP, feeBP: feeBP, custom: !!artist.custom,
        received: received, fee: fee, after: after, owner: owner, mine: mine, managers: mgrs, managersTotal: mgrTotal,
        toman: tomanAny ? toman : null, tomanComplete: tomanKnown,
        rate: rate, status: status, unpaid: unpaid, paidAt: paidAt
      };
    });
    rows.sort(function (a, b) {
      if (a.unnamed !== b.unnamed) return a.unnamed ? 1 : -1;
      return a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }) || a.cur.localeCompare(b.cur) ||
        (a.payments[0].date + (a.payments[0].time || '')).localeCompare(b.payments[0].date + (b.payments[0].time || ''));
    });
    return rows;
  }

  function currenciesIn(rows) {
    var seen = {};
    rows.forEach(function (r) { seen[r.cur] = true; });
    var order = ['USD', 'CAD', 'EUR', 'GBP', 'AUD'];
    return Object.keys(seen).sort(function (a, b) {
      var ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
    });
  }

  function totals(rows) {
    var by = {};
    rows.forEach(function (r) {
      var t = by[r.cur] || (by[r.cur] = { cur: r.cur, received: 0, fee: 0, after: 0, owner: 0, mine: 0, managers: 0, unpaid: 0, paidAfter: 0, toman: 0, tomanRows: 0, rows: 0, artists: 0, unnamed: 0, payments: 0, unpaidArtists: 0, unpaidNamed: 0, unpaidUnnamed: 0 });
      t.received += r.received; t.fee += r.fee; t.after += r.after; t.owner += r.owner; t.mine += r.mine;
      t.managers += r.managersTotal; t.unpaid += r.unpaid; t.paidAfter += r.after - r.unpaid;
      if (r.toman) { t.toman += r.toman; t.tomanRows++; }
      t.rows++; t.payments += r.count;
      if (r.unnamed) t.unnamed++; else t.artists++;
      if (r.status !== 'paid') { t.unpaidArtists++; if (r.unnamed) t.unpaidUnnamed++; else t.unpaidNamed++; }
    });
    return by;
  }

  // Per manager: what they earn in the period, per currency.
  function managerReport(db, from, to, rowsIn) {
    var rows = rowsIn || computeRows(db, from, to);
    return values(db.managers).sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); }).map(function (m) {
      var lines = [];
      var byCur = {};
      rows.forEach(function (r) {
        r.managers.forEach(function (x) {
          if (x.managerId !== m.id) return;
          lines.push({ artistId: r.artistId, name: r.name, cur: r.cur, received: r.received, share: x.share, fromOwner: x.fromOwner, fromMe: x.fromMe });
          var t = byCur[r.cur] || (byCur[r.cur] = { cur: r.cur, received: 0, share: 0, fromOwner: 0, fromMe: 0 });
          t.received += r.received; t.share += x.share; t.fromOwner += x.fromOwner; t.fromMe += x.fromMe;
        });
      });
      return { manager: m, lines: lines, totals: byCur };
    });
  }

  // Received per month for the last n months ending at `endISO`.
  function monthlySeries(db, cur, endISO, n) {
    var e = parseISO(endISO);
    var out = [];
    for (var i = n - 1; i >= 0; i--) {
      var mm = shiftMonth(e.y, e.m, -i);
      var r = monthRange(mm.y, mm.m);
      out.push({ y: mm.y, m: mm.m, label: MON[mm.m - 1], from: r.from, to: r.to, received: 0 });
    }
    values(db.payments).forEach(function (p) {
      if (p.cur !== cur) return;
      for (var i = 0; i < out.length; i++) {
        if (p.date >= out[i].from && p.date <= out[i].to) { out[i].received += p.cents; break; }
      }
    });
    return out;
  }

  // Matches parsed rows against the ledger: new vs already imported, and which artist.
  function planImport(db, parsed) {
    var keys = {};
    values(db.payments).forEach(function (p) { if (p.key) keys[p.key] = true; });
    var byName = {};
    values(db.artists).forEach(function (a) { byName[normName(a.name)] = a; });
    var seen = {};
    return parsed.rows.map(function (r) {
      var dup = !!keys[r.key] || !!seen[r.key];
      seen[r.key] = true;
      var artist = byName[normName(r.name)] || null;
      return { row: r, duplicate: dup, artist: artist, include: !dup };
    });
  }

  function uid(prefix) {
    var s = Date.now().toString(36);
    for (var i = 0; i < 8; i++) s += Math.floor(Math.random() * 36).toString(36);
    return prefix + '_' + s;
  }

  // Builds the operations that import the chosen rows.
  function importOps(db, plan, opts) {
    opts = opts || {};
    var ops = [];
    var byName = {};
    values(db.artists).forEach(function (a) { byName[normName(a.name)] = a.id; });
    var importId = opts.importId || uid('i');
    var totalsBy = {}, count = 0;
    plan.forEach(function (it) {
      if (!it.include) return;
      var r = it.row;
      var nk = normName(r.name);
      var aid = byName[nk];
      if (!aid) {
        aid = uid('a');
        byName[nk] = aid;
        ops.push({ op: 'put', c: 'artists', id: aid, b: { name: r.name, custom: false } });
      }
      ops.push({ op: 'put', c: 'payments', id: uid('p'), b: { artistId: aid, date: r.date, time: r.time, cur: r.cur, cents: r.cents, rate: 0, paid: false, paidAt: '', key: r.key, importId: importId } });
      totalsBy[r.cur] = (totalsBy[r.cur] || 0) + r.cents;
      count++;
    });
    if (count) ops.push({ op: 'put', c: 'imports', id: importId, b: { at: opts.now || Date.now(), count: count, totals: totalsBy } });
    return { ops: ops, count: count, importId: importId };
  }

  // A manager's share in one currency. The user converts the other currencies
  // by hand for a period; m.conv[from|to] = { to: 'CAD', lines: { USD: { src, cents, rate } } }.
  // If a share changed after it was converted, it is worked out again at the same rate.
  function periodKey(from, to) { return from + '|' + to; }
  function managerCombined(m, from, to, totals) {
    var c = m && m.conv && m.conv[periodKey(from, to)];
    if (!c || !c.to || !totals) return null;
    var order = ['USD', 'CAD', 'EUR', 'GBP', 'AUD'];
    var curs = Object.keys(totals).sort(function (a, b) {
      if (a === c.to) return -1;
      if (b === c.to) return 1;
      var ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
    });
    var out = { to: c.to, lines: [], total: 0, missing: [], changed: false };
    curs.forEach(function (cur) {
      var share = totals[cur].share;
      if (cur === c.to) { out.lines.push({ cur: cur, share: share, cents: share, rate: 1, same: true }); out.total += share; return; }
      var x = (c.lines || {})[cur];
      if (!x || !(x.rate > 0)) { out.missing.push(cur); return; }
      var stale = x.src !== share;
      var cents = !stale && x.cents > 0 ? x.cents : convertCents(share, x.rate);
      if (stale) out.changed = true;
      out.lines.push({ cur: cur, share: share, cents: cents, rate: x.rate, changed: stale });
      out.total += cents;
    });
    out.complete = !out.missing.length && out.lines.some(function (l) { return !l.same; });
    return out;
  }

  // How a payouts row is named on screen and on paper.
  function rowLabel(r) {
    if (!r.unnamed) return r.name;
    var p = r.payments[0];
    return UNNAMED + ', ' + fmtDate(p.date, { short: true }) + (p.time ? ' ' + p.time : '');
  }

  function initials(name) {
    var clean = String(name || '?').replace(/[^\p{L}\p{N}\s]/gu, ' ').trim();
    var parts = clean.split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  function safeFile(s) { return String(s || '').replace(/[<>:"\/\\|?*\x00-\x1f]/g, '').replace(/\s+/g, ' ').trim() || 'Unnamed'; }

  var api = {
    toJalali: toJalali, iso: iso, parseISO: parseISO, todayISO: todayISO, addDays: addDays,
    fmtDate: fmtDate, fmtJDate: fmtJDate, fmtTimestamp: fmtTimestamp, jalaliOf: jalaliOf,
    MONTHS: MONTHS, MON: MON, JMONTHS: JMONTHS, monthRange: monthRange, shiftMonth: shiftMonth, daysInMonth: daysInMonth,
    presets: presets, rangeLabel: rangeLabel, rangeJLabel: rangeJLabel, rangeFileLabel: rangeFileLabel,
    CURRENCIES: CURRENCIES, curInfo: curInfo, fmtMoney: fmtMoney, fmtToman: fmtToman, fmtNumber: fmtNumber, fmtPct: fmtPct,
    parsePct: parsePct, parseMoney: parseMoney, parseRate: parseRate, roundDiv: roundDiv,
    normDigits: normDigits, parseFx: parseFx, fmtFx: fmtFx, convertCents: convertCents, periodKey: periodKey, managerCombined: managerCombined,
    normName: normName, cleanName: cleanName, UNNAMED: UNNAMED,
    parseText: parseText, parseHeader: parseHeader,
    DEFAULTS: DEFAULTS, settingsOf: settingsOf, splitOf: splitOf, values: values,
    computeRows: computeRows, totals: totals, currenciesIn: currenciesIn, managerReport: managerReport, monthlySeries: monthlySeries,
    planImport: planImport, importOps: importOps, uid: uid, initials: initials, safeFile: safeFile, rowLabel: rowLabel
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Logic = api;
})(this);
