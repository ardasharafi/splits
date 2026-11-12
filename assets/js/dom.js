/* Splits — small DOM helpers shared by the app and the statement pages. */
(function (root) {
  'use strict';
  var SVGNS = 'http://www.w3.org/2000/svg';

  function append(el, kids) {
    for (var i = 0; i < kids.length; i++) {
      var c = kids[i];
      if (c === null || c === undefined || c === false || c === true) continue;
      if (Array.isArray(c)) { append(el, c); continue; }
      el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
  }

  function setProps(el, props, isSvg) {
    if (!props) return;
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') { if (isSvg) el.setAttribute('class', v); else el.className = v; }
      else if (k === 'style' && typeof v === 'object') Object.keys(v).forEach(function (s) {
        if (s.indexOf('--') === 0) el.style.setProperty(s, v[s]); else el.style[s] = v[s];
      });
      else if (k.indexOf('on') === 0 && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value' && !isSvg) el.value = v;
      else if ((k === 'checked' || k === 'disabled' || k === 'selected' || k === 'indeterminate') && !isSvg) el[k] = !!v;
      else if (k === 'ref' && typeof v === 'function') v(el);
      else el.setAttribute(k, v === true ? '' : v);
    });
  }

  function h(tag, props) {
    var el = document.createElement(tag);
    setProps(el, props, false);
    return append(el, Array.prototype.slice.call(arguments, 2));
  }

  function s(tag, props) {
    var el = document.createElementNS(SVGNS, tag);
    setProps(el, props, true);
    return append(el, Array.prototype.slice.call(arguments, 2));
  }

  // The Splits mark: a record split into the artist's share, the owner's and yours.
  function logo(size, opts) {
    opts = opts || {};
    var r = 21, c = 2 * Math.PI * r, gap = 2.2;
    var parts = [[0.8, '#8b6ad6'], [0.1, '#13a594'], [0.1, '#e3a512']];
    if (opts.flat) parts = [[0.8, '#6b46c1'], [0.1, '#0f8f80'], [0.1, '#d89a00']];
    var svg = s('svg', { viewBox: '0 0 64 64', width: size, height: size, 'aria-hidden': 'true', class: 'logo-mark' });
    if (opts.disc) svg.appendChild(s('circle', { cx: 32, cy: 32, r: 31, fill: opts.disc }));
    var offset = 0;
    parts.forEach(function (p) {
      var len = p[0] * c - gap;
      svg.appendChild(s('circle', {
        cx: 32, cy: 32, r: r, fill: 'none', stroke: p[1], 'stroke-width': 12,
        'stroke-dasharray': len + ' ' + (c - len), 'stroke-dashoffset': -offset,
        transform: 'rotate(-90 32 32)'
      }));
      offset += p[0] * c;
    });
    svg.appendChild(s('circle', { cx: 32, cy: 32, r: 5.2, fill: opts.hole || 'currentColor' }));
    return svg;
  }

  root.Dom = { h: h, s: s, append: append, logo: logo };
})(this);
