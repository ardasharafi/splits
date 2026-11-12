/* Splits — statements and reports. The same functions draw the in-app
   preview and the page Edge prints to PDF, so both always match. */
(function (root) {
  'use strict';
  var L = root.Logic, D = root.Dom, h = D.h;

  var COLORS = { artist: '#6b46c1', owner: '#0f8f80', mine: '#d89a00', managers: '#d9547a', fee: '#d6cfe3' };

  function money(c, cur) { return L.fmtMoney(c, cur); }
  function perUnit(cur) { return 'per ' + L.curInfo(cur).symbol.trim(); }
  function rateName(cur) { return cur === 'USD' ? 'Dollar rate' : cur === 'CAD' ? 'Canadian dollar rate' : L.curInfo(cur).name + ' rate'; }
  function statusText(s) { return s === 'paid' ? 'Paid' : s === 'partial' ? 'Part paid' : 'Not paid'; }

  function header(ctx, docType) {
    var st = ctx.settings;
    return h('header', { class: 'st-head' },
      h('div', { class: 'st-brand' },
        D.logo(26, { flat: true, hole: '#2a1d3d' }),
        h('span', { class: 'st-brand-name' }, st.business || 'Splits')),
      h('div', { class: 'st-doc' },
        h('div', { class: 'st-doc-type' }, docType),
        h('div', { class: 'st-doc-date' }, 'Issued ' + L.fmtDate(L.todayISO(ctx.now)))));
  }

  function periodBlock(from, to) {
    var j = L.rangeJLabel(from, to);
    return h('div', { class: 'st-period' },
      h('div', { class: 'st-label' }, 'Period'),
      h('div', { class: 'st-period-g' }, L.rangeLabel(from, to)),
      j ? h('div', { class: 'st-period-j' }, j) : null);
  }

  function footer(ctx, note) {
    return h('footer', { class: 'st-foot' },
      h('span', null, note || ''),
      h('span', null, ctx.settings.business || ''));
  }

  // Thin share bar: one whole split into parts, legend underneath.
  function shareBar(parts, total) {
    var live = parts.filter(function (p) { return p.value > 0; });
    return h('div', { class: 'st-share' },
      h('div', { class: 'st-share-bar', role: 'img', 'aria-label': live.map(function (p) { return p.label + ' ' + p.pct; }).join(', ') },
        live.map(function (p) {
          return h('span', { class: 'st-share-part', style: { flexGrow: String(Math.max(p.value, 0)), background: p.color } });
        })),
      h('div', { class: 'st-share-legend' },
        live.map(function (p) {
          return h('span', { class: 'st-key' }, h('i', { style: { background: p.color } }), p.label + ' ', h('b', null, p.pct));
        })));
  }

  function pctOf(part, whole) {
    if (!whole) return '0%';
    var v = Math.round(part / whole * 1000) / 10;
    return (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)) + '%';
  }

  function sheet(cls) {
    var el = h('article', { class: 'st-sheet ' + (cls || '') });
    for (var i = 1; i < arguments.length; i++) D.append(el, [arguments[i]]);
    return el;
  }

  // ------------------------------------------------------------ artist
  function artistStatement(ctx, p) {
    var rows = L.computeRows(ctx.db, p.from, p.to).filter(function (r) { return r.artistId === p.artistId && (!p.cur || r.cur === p.cur); });
    var artist = ctx.db.artists[p.artistId] || { name: L.UNNAMED };
    var title = artist.name + ' - ' + L.rangeLabel(p.from, p.to);
    if (!rows.length) {
      return { title: title, node: sheet('', header(ctx, 'Payment statement'),
        h('div', { class: 'st-intro' }, h('div', null, h('div', { class: 'st-label' }, 'Statement for'), h('h1', { class: 'st-name' }, artist.name)), periodBlock(p.from, p.to)),
        h('p', { class: 'st-empty' }, 'No payments in this period.'), footer(ctx)) };
    }
    var r = rows[0], cur = r.cur;
    var feePct = L.fmtPct(r.feeBP), sharePct = L.fmtPct(10000 - r.feeBP);
    var single = r.parts.length === 1;
    var rate = r.rate !== 'mixed' ? r.rate : null;

    var payTable = h('table', { class: 'st-table' },
      h('thead', null, h('tr', null, h('th', null, 'Date'), h('th', null, 'Jalali date'), h('th', { class: 'num' }, 'Amount'))),
      h('tbody', null, r.payments.map(function (x) {
        return h('tr', null, h('td', null, L.fmtDate(x.date)), h('td', { class: 'muted' }, L.fmtJDate(x.date)), h('td', { class: 'num' }, money(x.cents, cur)));
      })),
      h('tfoot', null, h('tr', null, h('td', { colspan: 2 }, r.count === 1 ? '1 payment' : r.count + ' payments'), h('td', { class: 'num' }, money(r.received, cur)))));

    var partsTable = null;
    if (!single) {
      partsTable = h('table', { class: 'st-table st-parts' },
        h('thead', null, h('tr', null, h('th', null, 'Payments'), h('th', { class: 'num' }, 'Received'), h('th', { class: 'num' }, 'Your share'), h('th', { class: 'num' }, 'Rate'), h('th', { class: 'num' }, 'Toman'), h('th', null, 'Status'))),
        h('tbody', null, r.parts.map(function (s) {
          var d0 = s.payments[0].date, d1 = s.payments[s.payments.length - 1].date;
          return h('tr', null,
            h('td', null, d0 === d1 ? L.fmtDate(d0) : L.fmtDate(d0, { short: true }) + ' – ' + L.fmtDate(d1)),
            h('td', { class: 'num' }, money(s.received, cur)),
            h('td', { class: 'num' }, money(s.after, cur)),
            h('td', { class: 'num' }, s.rate ? L.fmtToman(s.rate) : '—'),
            h('td', { class: 'num' }, s.toman !== null ? L.fmtToman(s.toman) : '—'),
            h('td', null, s.paid ? 'Paid' : 'Not paid'));
        })));
    }

    var lines = [
      h('div', { class: 'st-line' }, h('span', null, 'Received'), h('span', null, money(r.received, cur))),
      h('div', { class: 'st-line' }, h('span', null, 'Commission (' + feePct + ')'), h('span', null, money(-r.fee, cur))),
      h('div', { class: 'st-line strong' }, h('span', null, 'Your share (' + sharePct + ')'), h('span', null, money(r.after, cur)))
    ];
    if (rate) lines.push(h('div', { class: 'st-line' }, h('span', null, rateName(cur)), h('span', null, '× ' + L.fmtToman(rate) + ' Toman ' + perUnit(cur))));
    else if (!single && r.toman) lines.push(h('div', { class: 'st-line' }, h('span', null, rateName(cur)), h('span', null, 'see the parts above')));

    var total = h('div', { class: 'st-total' },
      h('div', { class: 'st-total-label' }, 'Total'),
      h('div', { class: 'st-total-values' },
        r.toman ? h('div', { class: 'st-total-toman' }, L.fmtToman(r.toman), h('small', null, ' Toman')) : null,
        h('div', { class: r.toman ? 'st-total-cur' : 'st-total-toman' }, money(r.after, cur))));
    if (r.toman && !r.tomanComplete) total.appendChild(h('div', { class: 'st-note' }, 'Some payments have no rate yet, so the Toman total covers only part of your share.'));

    var status = null;
    if (r.status === 'paid') status = h('div', { class: 'st-status paid' }, h('span', { class: 'st-check' }, '✓'), 'Paid' + (r.paidAt ? ' on ' + L.fmtDate(r.paidAt) + ' (' + L.fmtJDate(r.paidAt) + ')' : ''));
    else if (r.status === 'partial') status = h('div', { class: 'st-status' }, 'Part paid');

    var node = sheet('',
      header(ctx, 'Payment statement'),
      h('div', { class: 'st-intro' },
        h('div', null, h('div', { class: 'st-label' }, 'Statement for'), h('h1', { class: 'st-name' }, artist.name)),
        periodBlock(p.from, p.to)),
      shareBar([
        { label: 'Your share', value: r.after, color: COLORS.artist, pct: sharePct },
        { label: 'Commission', value: r.fee, color: COLORS.fee, pct: feePct }
      ], r.received),
      h('section', { class: 'st-section' }, h('h2', null, 'Payments'), payTable),
      partsTable ? h('section', { class: 'st-section' }, h('h2', null, 'Rates and payouts'), partsTable) : null,
      h('section', { class: 'st-summary' }, h('div', { class: 'st-lines' }, lines), total, status),
      footer(ctx, cur === 'USD' ? 'Amounts in US dollars' : 'Amounts in ' + L.curInfo(cur).name + 's'));
    return { title: title, node: node };
  }

  // ------------------------------------------------------------ overview
  function overviewReport(ctx, p) {
    var st = ctx.settings;
    var rows = L.computeRows(ctx.db, p.from, p.to);
    var tot = L.totals(rows);
    var curs = L.currenciesIn(rows);
    var title = 'Overview - ' + L.rangeLabel(p.from, p.to);
    var me = st.myName || 'You', owner = st.ownerName || 'Owner';
    var mgrRep = L.managerReport(ctx.db, p.from, p.to, rows).filter(function (m) { return m.lines.length; });

    var blocks = curs.map(function (cur) {
      var t = tot[cur];
      var list = rows.filter(function (r) { return r.cur === cur; });
      return h('section', { class: 'st-section st-cur' },
        h('h2', null, L.curInfo(cur).name, h('span', { class: 'st-h2-sub' }, t.payments + ' payments, ' + t.artists + ' artists' + (t.unnamed ? ', ' + t.unnamed + ' without a name' : ''))),
        h('div', { class: 'st-kpis' },
          kpi('Received', money(t.received, cur)),
          kpi('Artists', money(t.after, cur)),
          kpi(owner, money(t.owner, cur)),
          kpi(me, money(t.mine, cur)),
          t.managers ? kpi('Other managers', money(t.managers, cur)) : null,
          kpi('Still to pay artists', money(t.unpaid, cur))),
        shareBar([
          { label: 'Artists', value: t.after, color: COLORS.artist, pct: pctOf(t.after, t.received) },
          { label: owner, value: t.owner, color: COLORS.owner, pct: pctOf(t.owner, t.received) },
          { label: me, value: t.mine, color: COLORS.mine, pct: pctOf(t.mine, t.received) },
          { label: 'Other managers', value: t.managers, color: COLORS.managers, pct: pctOf(t.managers, t.received) }
        ], t.received),
        h('table', { class: 'st-table st-wide' },
          h('thead', null, h('tr', null,
            h('th', null, 'Artist'), h('th', { class: 'num' }, 'Received'), h('th', { class: 'num' }, 'Commission'),
            h('th', { class: 'num' }, 'Artist share'), h('th', { class: 'num' }, owner), h('th', { class: 'num' }, me),
            t.managers ? h('th', { class: 'num' }, 'Managers') : null,
            h('th', { class: 'num' }, 'Rate'), h('th', { class: 'num' }, 'Toman'), h('th', null, 'Status'))),
          h('tbody', null, list.map(function (r) {
            return h('tr', null,
              h('td', null, L.rowLabel(r)),
              h('td', { class: 'num' }, money(r.received, cur)),
              h('td', { class: 'num' }, money(r.fee, cur)),
              h('td', { class: 'num' }, money(r.after, cur)),
              h('td', { class: 'num' }, money(r.owner, cur)),
              h('td', { class: 'num' }, money(r.mine, cur)),
              t.managers ? h('td', { class: 'num' }, r.managersTotal ? money(r.managersTotal, cur) : '—') : null,
              h('td', { class: 'num' }, r.rate === 'mixed' ? 'Mixed' : r.rate ? L.fmtToman(r.rate) : '—'),
              h('td', { class: 'num' }, r.toman ? L.fmtToman(r.toman) : '—'),
              h('td', null, statusText(r.status)));
          })),
          h('tfoot', null, h('tr', null,
            h('td', null, 'Total'),
            h('td', { class: 'num' }, money(t.received, cur)),
            h('td', { class: 'num' }, money(t.fee, cur)),
            h('td', { class: 'num' }, money(t.after, cur)),
            h('td', { class: 'num' }, money(t.owner, cur)),
            h('td', { class: 'num' }, money(t.mine, cur)),
            t.managers ? h('td', { class: 'num' }, money(t.managers, cur)) : null,
            h('td', null, ''),
            h('td', { class: 'num' }, t.toman ? L.fmtToman(t.toman) : '—'),
            h('td', null, t.unpaidArtists ? t.unpaidArtists + ' not paid' : 'All paid')))));
    });

    var mgrBlock = null;
    if (mgrRep.length) {
      mgrBlock = h('section', { class: 'st-section' },
        h('h2', null, 'Other managers'),
        h('table', { class: 'st-table' },
          h('thead', null, h('tr', null, h('th', null, 'Manager'), h('th', null, 'Share'), h('th', null, 'Artists'), h('th', { class: 'num' }, 'From ' + me.toLowerCase()), h('th', { class: 'num' }, 'From ' + owner.toLowerCase()), h('th', { class: 'num' }, 'Total'))),
          h('tbody', null, mgrRep.map(function (m) {
            var c = Object.keys(m.totals);
            return h('tr', null,
              h('td', null, m.manager.name),
              h('td', null, L.fmtPct(m.manager.pctBP)),
              h('td', { class: 'st-small' }, uniqueNames(m.lines).join(', ')),
              h('td', { class: 'num' }, c.map(function (k) { return h('div', null, money(m.totals[k].fromMe, k)); })),
              h('td', { class: 'num' }, c.map(function (k) { return h('div', null, money(m.totals[k].fromOwner, k)); })),
              h('td', { class: 'num' }, c.map(function (k) { return h('div', null, money(m.totals[k].share, k)); })));
          }))));
    }

    var node = sheet('st-landscape',
      header(ctx, 'Overview report'),
      h('div', { class: 'st-intro' }, h('div', null, h('div', { class: 'st-label' }, 'Overview'), h('h1', { class: 'st-name' }, st.business || 'All artists')), periodBlock(p.from, p.to)),
      curs.length ? blocks : h('p', { class: 'st-empty' }, 'No payments in this period.'),
      mgrBlock,
      footer(ctx, 'Commission ' + L.fmtPct(st.ownerBP + st.managerBP) + ' by default: ' + owner + ' ' + L.fmtPct(st.ownerBP) + ', ' + me + ' ' + L.fmtPct(st.managerBP)));
    return { title: title, node: node, landscape: true };
  }

  function kpi(label, value) {
    return h('div', { class: 'st-kpi' }, h('div', { class: 'st-kpi-label' }, label), h('div', { class: 'st-kpi-value' }, value));
  }

  function uniqueNames(lines) {
    var seen = {}, out = [];
    lines.forEach(function (l) { if (!seen[l.name]) { seen[l.name] = true; out.push(l.name); } });
    return out;
  }

  // ------------------------------------------------------------ manager
  function managerStatement(ctx, p) {
    var m = ctx.db.managers[p.managerId];
    if (!m) return { title: 'Manager', node: sheet('', h('p', { class: 'st-empty' }, 'This manager was removed.')) };
    var rep = L.managerReport(ctx.db, p.from, p.to).filter(function (x) { return x.manager.id === m.id; })[0];
    var title = 'Manager ' + m.name + ' - ' + L.rangeLabel(p.from, p.to);
    var curs = L.currenciesIn(Object.keys(rep.totals).map(function (c) { return { cur: c }; }));
    var comb = L.managerCombined(m, p.from, p.to, rep.totals);
    if (comb && !comb.complete) comb = null;
    var blocks = curs.map(function (cur) {
      var t = rep.totals[cur];
      var lines = rep.lines.filter(function (l) { return l.cur === cur; });
      return h('section', { class: 'st-section' },
        h('h2', null, L.curInfo(cur).name),
        h('table', { class: 'st-table' },
          h('thead', null, h('tr', null, h('th', null, 'Artist'), h('th', { class: 'num' }, 'Artist income'), h('th', { class: 'num' }, 'Share'), h('th', { class: 'num' }, 'Your amount'))),
          h('tbody', null, lines.map(function (l) {
            return h('tr', null, h('td', null, l.name), h('td', { class: 'num' }, money(l.received, cur)), h('td', { class: 'num' }, L.fmtPct(m.pctBP)), h('td', { class: 'num' }, money(l.share, cur)));
          })),
          h('tfoot', null, h('tr', null, h('td', null, 'Total'), h('td', { class: 'num' }, money(t.received, cur)), h('td', null, ''), h('td', { class: 'num' }, money(t.share, cur))))));
    });
    var conversion = comb ? h('section', { class: 'st-section' },
      h('h2', null, 'Paid in ' + L.curInfo(comb.to).name + 's'),
      h('table', { class: 'st-table' },
        h('thead', null, h('tr', null, h('th', null, 'Your amount'), h('th', { class: 'num' }, 'Amount'), h('th', { class: 'num' }, 'Rate'), h('th', { class: 'num' }, 'In ' + comb.to))),
        h('tbody', null, comb.lines.map(function (l) {
          return h('tr', null,
            h('td', null, 'In ' + L.curInfo(l.cur).name + 's'),
            h('td', { class: 'num' }, money(l.share, l.cur)),
            h('td', { class: 'num' }, l.same ? '—' : '1 ' + l.cur + ' = ' + L.fmtFx(l.rate) + ' ' + comb.to),
            h('td', { class: 'num' }, money(l.cents, comb.to)));
        })),
        h('tfoot', null, h('tr', null, h('td', { colspan: 3 }, 'Total'), h('td', { class: 'num' }, money(comb.total, comb.to)))))) : null;
    var totalValues = comb
      ? [h('div', { class: 'st-total-toman' }, money(comb.total, comb.to))]
      : curs.map(function (c) { return h('div', { class: 'st-total-toman' }, money(rep.totals[c].share, c)); });
    var node = sheet('',
      header(ctx, 'Manager statement'),
      h('div', { class: 'st-intro' },
        h('div', null, h('div', { class: 'st-label' }, 'Statement for'), h('h1', { class: 'st-name' }, m.name)),
        periodBlock(p.from, p.to)),
      h('p', { class: 'st-lead' }, 'Your share is ' + L.fmtPct(m.pctBP) + ' of the income of the artists below.' +
        (comb ? ' The amounts in other currencies are converted to ' + L.curInfo(comb.to).name + 's at the rates shown.' : '')),
      curs.length ? blocks : h('p', { class: 'st-empty' }, 'No income for these artists in this period.'),
      conversion,
      curs.length ? h('section', { class: 'st-summary' },
        h('div', { class: 'st-lines' }),
        h('div', { class: 'st-total' }, h('div', { class: 'st-total-label' }, 'Total'),
          h('div', { class: 'st-total-values' }, totalValues))) : null,
      footer(ctx, comb ? 'Total in ' + L.curInfo(comb.to).name + 's' : null));
    return { title: title, node: node };
  }

  function render(kind, params, ctx) {
    if (kind === 'artist') return artistStatement(ctx, params);
    if (kind === 'overview') return overviewReport(ctx, params);
    if (kind === 'manager') return managerStatement(ctx, params);
    return { title: 'Splits', node: h('p', null, 'Unknown statement') };
  }

  root.Statements = { render: render, COLORS: COLORS, pctOf: pctOf, statusText: statusText };
})(this);
