/* Splits on the iPhone: PDFs, Excel files and the share sheet.
 * iPhone Home Screen apps can't print, so statements are drawn into a PDF
 * here: the real statement page is laid out by the browser, painted onto a
 * canvas element by element at print resolution, and packed into an A4 PDF.
 * Excel files are written the same way the Windows app writes them. */
(function (root) {
  'use strict';

  var MM = 96 / 25.4;
  var SCALE = 2.5;
  var PAGES = { portrait: { w: 210, h: 297, top: 14, bottom: 12 }, landscape: { w: 297, h: 210, top: 12, bottom: 12 } };

  // ------------------------------------------------------------------ helpers
  function latin1(s) { var u = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i) & 255; return u; }
  function utf8(s) { return new TextEncoder().encode(s); }
  function transparent(c) { return !c || c === 'transparent' || /rgba\([^)]*,\s*0\)$/.test(c); }
  function px(v) { return parseFloat(v) || 0; }
  function blobBytes(b) { return b.arrayBuffer().then(function (ab) { return new Uint8Array(ab); }); }

  function roundRectPath(ctx, x, y, w, h, r) {
    var tl = Math.min(r[0], w / 2, h / 2), tr = Math.min(r[1], w / 2, h / 2), br = Math.min(r[2], w / 2, h / 2), bl = Math.min(r[3], w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    if (tr) ctx.arcTo(x + w, y, x + w, y + tr, tr); else ctx.lineTo(x + w, y);
    ctx.lineTo(x + w, y + h - br);
    if (br) ctx.arcTo(x + w, y + h, x + w - br, y + h, br); else ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + bl, y + h);
    if (bl) ctx.arcTo(x, y + h, x, y + h - bl, bl); else ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + tl);
    if (tl) ctx.arcTo(x, y, x + tl, y, tl); else ctx.lineTo(x, y);
    ctx.closePath();
  }
  function radii(cs) { return [px(cs.borderTopLeftRadius), px(cs.borderTopRightRadius), px(cs.borderBottomRightRadius), px(cs.borderBottomLeftRadius)]; }

  var RTL = /[֐-ࣿיִ-﷿ﹰ-﻿]/;

  // An SVG drawn as an image, with its colours written into it so it looks the same outside the page.
  function svgImage(svg, w, h) {
    var clone = svg.cloneNode(true);
    var src = svg.querySelectorAll('*'), dst = clone.querySelectorAll('*');
    for (var i = 0; i < src.length; i++) {
      var cs = getComputedStyle(src[i]);
      ['fill', 'stroke', 'stroke-width', 'opacity', 'fill-opacity', 'stroke-opacity', 'stroke-linecap', 'stroke-linejoin'].forEach(function (p) {
        var v = cs.getPropertyValue(p);
        if (v) dst[i].setAttribute(p, v);
      });
    }
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(Math.round(w * SCALE)));
    clone.setAttribute('height', String(Math.round(h * SCALE)));
    var url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = url;
    });
  }

  // ------------------------------------------------------------------ paint one statement sheet
  function paintSheet(sheet) {
    var landscape = sheet.classList.contains('st-landscape');
    var P = landscape ? PAGES.landscape : PAGES.portrait;
    var pageW = P.w * MM, pageH = P.h * MM, top = P.top * MM, bottom = P.bottom * MM;
    var stage = document.createElement('div');
    stage.className = 'pdf-stage';
    stage.style.cssText = 'position:fixed;left:-30000px;top:0;width:' + pageW + 'px;pointer-events:none;';
    stage.appendChild(sheet);
    document.body.appendChild(stage);

    var fonts = ['400', '500', '600', '700'].map(function (w) { return w + ' 12px Inter'; }).concat(['400 12px Adventor', '700 12px Adventor']);
    var ready = document.fonts && document.fonts.load ? Promise.all(fonts.map(function (f) { return document.fonts.load(f).catch(function () { }); })).then(function () { return document.fonts.ready; }) : Promise.resolve();

    return ready.then(function () {
      var svgs = Array.prototype.slice.call(sheet.querySelectorAll('svg'));
      return Promise.all(svgs.map(function (s) { var r = s.getBoundingClientRect(); return svgImage(s, r.width, r.height); })).then(function (imgs) {
        var images = new Map();
        svgs.forEach(function (s, i) { images.set(s, imgs[i]); });
        var origin = sheet.getBoundingClientRect();
        var total = origin.height;
        // Page breaks fall between table rows and between sections, like printing does.
        var cuts = [];
        Array.prototype.forEach.call(sheet.querySelectorAll('tr, .st-sheet > *, .st-section > *'), function (el) { cuts.push(el.getBoundingClientRect().top - origin.top); });
        cuts.sort(function (a, b) { return a - b; });
        var slices = [];
        if (total <= pageH + 1) slices.push({ from: 0, to: total, shift: 0 });
        else {
          var start = 0, first = true;
          while (start < total - bottom - 1) {
            var room = first ? pageH - bottom : start + (pageH - top - bottom);
            var end = room;
            if (room < total - bottom) {
              var best = -1;
              cuts.forEach(function (c) { if (c > start + 20 && c <= room) best = c; });
              end = best > 0 ? best : room;
            } else end = total - bottom;
            slices.push({ from: start, to: end, shift: first ? 0 : top - start });
            start = end; first = false;
          }
        }
        var pages = slices.map(function (sl) { return paintSlice(sheet, origin, images, sl, pageW, pageH); });
        stage.remove();
        return Promise.all(pages).then(function (list) { return list.map(function (p) { p.landscape = landscape; return p; }); });
      });
    }, function (e) { stage.remove(); throw e; });
  }

  function paintSlice(sheet, origin, images, sl, pageW, pageH) {
    var canvas = document.createElement('canvas');
    canvas.width = Math.round(pageW * SCALE);
    canvas.height = Math.round(pageH * SCALE);
    var ctx = canvas.getContext('2d');
    ctx.scale(SCALE, SCALE);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageW, pageH);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, sl.from + sl.shift, pageW, sl.to - sl.from);
    ctx.clip();
    ctx.translate(0, sl.shift);
    var range = document.createRange();

    function visible(y, h) { return y + h >= sl.from - 1 && y <= sl.to + 1; }

    function drawText(node, cs) {
      var text = node.nodeValue;
      if (!text || !/\S/.test(text)) return;
      ctx.fillStyle = cs.color;
      ctx.font = cs.fontStyle + ' ' + cs.fontWeight + ' ' + cs.fontSize + ' ' + cs.fontFamily;
      ctx.textBaseline = 'alphabetic';
      var m = ctx.measureText('Hg');
      var asc = m.fontBoundingBoxAscent || px(cs.fontSize) * 0.97, desc = m.fontBoundingBoxDescent || px(cs.fontSize) * 0.24;
      var tt = cs.textTransform;
      var ls = cs.letterSpacing === 'normal' ? 0 : px(cs.letterSpacing);
      var widths = {};
      function adv(ch) { return widths[ch] !== undefined ? widths[ch] : (widths[ch] = ctx.measureText(ch).width); }
      function shape(s) { return tt === 'uppercase' ? s.toUpperCase() : tt === 'lowercase' ? s.toLowerCase() : s; }
      if (RTL.test(text)) {
        // Right-to-left scripts need their letters joined: draw each line as a whole.
        var lines = [];
        var re = /\S+/g, mm;
        while ((mm = re.exec(text))) {
          range.setStart(node, mm.index); range.setEnd(node, mm.index + mm[0].length);
          var rr = range.getBoundingClientRect();
          var y = rr.top - origin.top;
          var line = lines.filter(function (l) { return Math.abs(l.y - y) < 2; })[0];
          if (!line) { line = { y: y, h: rr.height, left: rr.left, right: rr.right, words: [] }; lines.push(line); }
          line.left = Math.min(line.left, rr.left); line.right = Math.max(line.right, rr.right);
          line.words.push(mm[0]);
        }
        lines.forEach(function (l) {
          if (!visible(l.y, l.h)) return;
          ctx.save();
          ctx.direction = 'rtl';
          ctx.textAlign = 'right';
          ctx.fillText(shape(l.words.join(' ')), l.right - origin.left, l.y + (l.h - asc - desc) / 2 + asc);
          ctx.restore();
        });
        return;
      }
      for (var i = 0; i < text.length;) {
        var cp = text.codePointAt(i), n = cp > 0xffff ? 2 : 1;
        var ch = text.substr(i, n);
        if (/\S/.test(ch)) {
          range.setStart(node, i); range.setEnd(node, i + n);
          var r = range.getClientRects()[0];
          if (r && r.width > 0) {
            var y2 = r.top - origin.top;
            // Centre the glyph in the space the page gave it (tabular figures are wider than plain ones).
            var g = shape(ch);
            if (visible(y2, r.height)) ctx.fillText(g, r.left - origin.left + Math.max(0, (r.width - ls - adv(g)) / 2), y2 + (r.height - asc - desc) / 2 + asc);
          }
        }
        i += n;
      }
    }

    function drawEl(el) {
      var cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      var r = el.getBoundingClientRect();
      var x = r.left - origin.left, y = r.top - origin.top, w = r.width, h = r.height;
      if (!visible(y, h) && el !== sheet) return;
      var op = parseFloat(cs.opacity);
      ctx.save();
      if (op < 1) ctx.globalAlpha *= op;
      var rad = radii(cs);
      var rounded = rad[0] || rad[1] || rad[2] || rad[3];
      if (!transparent(cs.backgroundColor) && w > 0 && h > 0) {
        ctx.fillStyle = cs.backgroundColor;
        if (rounded) { roundRectPath(ctx, x, y, w, h, rad); ctx.fill(); } else ctx.fillRect(x, y, w, h);
      }
      var bt = cs.borderTopStyle !== 'none' ? px(cs.borderTopWidth) : 0, br = cs.borderRightStyle !== 'none' ? px(cs.borderRightWidth) : 0;
      var bb = cs.borderBottomStyle !== 'none' ? px(cs.borderBottomWidth) : 0, bl = cs.borderLeftStyle !== 'none' ? px(cs.borderLeftWidth) : 0;
      if (rounded && bt && bt === br && bt === bb && bt === bl && cs.borderTopColor === cs.borderLeftColor && !transparent(cs.borderTopColor)) {
        ctx.strokeStyle = cs.borderTopColor; ctx.lineWidth = bt;
        roundRectPath(ctx, x + bt / 2, y + bt / 2, w - bt, h - bt, rad.map(function (v) { return Math.max(0, v - bt / 2); }));
        ctx.stroke();
      } else {
        if (bt && !transparent(cs.borderTopColor)) { ctx.fillStyle = cs.borderTopColor; ctx.fillRect(x, y, w, bt); }
        if (bb && !transparent(cs.borderBottomColor)) { ctx.fillStyle = cs.borderBottomColor; ctx.fillRect(x, y + h - bb, w, bb); }
        if (bl && !transparent(cs.borderLeftColor)) { ctx.fillStyle = cs.borderLeftColor; ctx.fillRect(x, y, bl, h); }
        if (br && !transparent(cs.borderRightColor)) { ctx.fillStyle = cs.borderRightColor; ctx.fillRect(x + w - br, y, br, h); }
      }
      if (el instanceof SVGSVGElement) {
        var img = images.get(el);
        if (img) ctx.drawImage(img, x, y, w, h);
        ctx.restore();
        return;
      }
      if (el.tagName === 'IMG' && el.complete) { try { ctx.drawImage(el, x, y, w, h); } catch (e) { /* skip */ } }
      if (cs.overflow === 'hidden' || cs.overflowX === 'hidden' || cs.overflowY === 'hidden') {
        if (rounded) roundRectPath(ctx, x, y, w, h, rad); else { ctx.beginPath(); ctx.rect(x, y, w, h); }
        ctx.clip();
      }
      for (var c = el.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) drawText(c, cs);
        else if (c.nodeType === 1) drawEl(c);
      }
      ctx.restore();
    }

    drawEl(sheet);
    ctx.restore();
    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (b) {
        if (!b) { reject(new Error('The iPhone couldn\'t draw the PDF.')); return; }
        blobBytes(b).then(function (bytes) {
          var out = { jpeg: bytes, w: canvas.width, h: canvas.height, pw: pageW * 72 / 96, ph: pageH * 72 / 96 };
          canvas.width = 0; canvas.height = 0;
          resolve(out);
        }, reject);
      }, 'image/jpeg', 0.92);
    });
  }

  // ------------------------------------------------------------------ PDF file
  function pdfText(s) {
    var hex = 'FEFF';
    for (var i = 0; i < s.length; i++) hex += ('000' + s.charCodeAt(i).toString(16).toUpperCase()).slice(-4);
    return '<' + hex + '>';
  }
  function buildPdf(pages, title) {
    var parts = [], offsets = [], len = 0;
    function add(x) { var b = typeof x === 'string' ? latin1(x) : x; parts.push(b); len += b.length; }
    function num(v) { return (Math.round(v * 100) / 100).toString(); }
    add('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
    var n = pages.length;
    var kids = [];
    for (var i = 0; i < n; i++) kids.push((4 + i * 3) + ' 0 R');
    offsets[1] = len; add('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    offsets[2] = len; add('2 0 obj\n<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + n + ' >>\nendobj\n');
    var d = new Date();
    var p2 = function (v) { return (v < 10 ? '0' : '') + v; };
    var when = 'D:' + d.getFullYear() + p2(d.getMonth() + 1) + p2(d.getDate()) + p2(d.getHours()) + p2(d.getMinutes()) + p2(d.getSeconds());
    offsets[3] = len; add('3 0 obj\n<< /Title ' + pdfText(title || 'Statement') + ' /Producer (Splits) /Creator (Splits for iPhone) /CreationDate (' + when + ') >>\nendobj\n');
    pages.forEach(function (pg, k) {
      var pn = 4 + k * 3, cn = pn + 1, im = pn + 2;
      offsets[pn] = len;
      add(pn + ' 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + num(pg.pw) + ' ' + num(pg.ph) + '] /Resources << /XObject << /Im0 ' + im + ' 0 R >> >> /Contents ' + cn + ' 0 R >>\nendobj\n');
      var content = 'q ' + num(pg.pw) + ' 0 0 ' + num(pg.ph) + ' 0 0 cm /Im0 Do Q';
      offsets[cn] = len;
      add(cn + ' 0 obj\n<< /Length ' + content.length + ' >>\nstream\n' + content + '\nendstream\nendobj\n');
      offsets[im] = len;
      add(im + ' 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + pg.w + ' /Height ' + pg.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + pg.jpeg.length + ' >>\nstream\n');
      add(pg.jpeg);
      add('\nendstream\nendobj\n');
    });
    var count = 4 + n * 3;
    var xref = len;
    var x = 'xref\n0 ' + count + '\n0000000000 65535 f \n';
    for (var j = 1; j < count; j++) x += ('000000000' + offsets[j]).slice(-10) + ' 00000 n \n';
    add(x);
    add('trailer\n<< /Size ' + count + ' /Root 1 0 R /Info 3 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    return new Blob(parts, { type: 'application/pdf' });
  }

  // Draw statement sheets (from Statements.render) into one PDF.
  function statementPdf(sheets, title) {
    var all = [];
    var chain = Promise.resolve();
    sheets.forEach(function (s) { chain = chain.then(function () { return paintSheet(s).then(function (pages) { all = all.concat(pages); }); }); });
    return chain.then(function () { return buildPdf(all, title); });
  }

  // ------------------------------------------------------------------ Excel (same as xlsx.go)
  var CRC = (function () {
    var t = new Uint32Array(256);
    for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(entries) {
    var parts = [], central = [], offset = 0;
    var d = new Date();
    var time = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var date = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    function le(n, bytes) { var u = new Uint8Array(bytes); for (var i = 0; i < bytes; i++) u[i] = (n >>> (8 * i)) & 255; return u; }
    function cat(list) { var l = 0; list.forEach(function (x) { l += x.length; }); var u = new Uint8Array(l), o = 0; list.forEach(function (x) { u.set(x, o); o += x.length; }); return u; }
    entries.forEach(function (e) {
      var name = utf8(e.name), data = e.data, crc = crc32(data);
      var head = cat([le(0x04034b50, 4), le(20, 2), le(0x0800, 2), le(0, 2), le(time, 2), le(date, 2), le(crc, 4), le(data.length, 4), le(data.length, 4), le(name.length, 2), le(0, 2), name]);
      parts.push(head, data);
      central.push(cat([le(0x02014b50, 4), le(20, 2), le(20, 2), le(0x0800, 2), le(0, 2), le(time, 2), le(date, 2), le(crc, 4), le(data.length, 4), le(data.length, 4), le(name.length, 2), le(0, 2), le(0, 2), le(0, 2), le(0, 2), le(0, 4), le(offset, 4), name]));
      offset += head.length + data.length;
    });
    var cd = cat(central);
    var end = cat([le(0x06054b50, 4), le(0, 2), le(0, 2), le(entries.length, 2), le(entries.length, 2), le(cd.length, 4), le(offset, 4), le(0, 2)]);
    return new Blob(parts.concat([cd, end]), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  function xmlText(s) {
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i), ch = s[i];
      if (!(c === 9 || c === 10 || c === 13 || (c >= 0x20 && c !== 0xFFFE && c !== 0xFFFF))) continue;
      out += ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch === '"' ? '&#34;' : ch === '\'' ? '&#39;' : c === 9 ? '&#x9;' : c === 10 ? '&#xA;' : c === 13 ? '&#xD;' : ch;
    }
    return out;
  }
  function colName(i) { var s = ''; for (; i >= 0; i = Math.floor(i / 26) - 1) s = String.fromCharCode(65 + (i % 26)) + s; return s; }
  function trimFloat(f) { var s = f.toFixed(4).replace(/0+$/, '').replace(/\.$/, ''); return s === '-0' || s === '' ? '0' : s; }
  function sheetName(s, used) {
    var clean = String(s || '').trim().replace(/[\[\]:*?\/\\]/g, '') || 'Sheet';
    clean = Array.from(clean).slice(0, 31).join('');
    var name = clean, n = 2;
    while (used[name.toLowerCase()]) {
      var suffix = ' ' + n, base = Array.from(clean);
      if (base.length + suffix.length > 31) base = base.slice(0, 31 - suffix.length);
      name = base.join('') + suffix; n++;
    }
    used[name.toLowerCase()] = true;
    return name;
  }
  function cellXML(ref, v, kind, bold) {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number') {
      var st = kind === 'int' ? 3 : kind === 'text' ? 0 : 2;
      if (bold && st === 2) st = 4; else if (bold && st === 3) st = 5;
      return '<c r="' + ref + '" s="' + st + '"><v>' + trimFloat(v) + '</v></c>';
    }
    if (typeof v === 'boolean') return cellXML(ref, v ? 'Yes' : 'No', kind, bold);
    var s = String(v);
    if (!s) return '';
    return '<c r="' + ref + '" t="inlineStr" s="' + (bold ? 1 : 0) + '"><is><t xml:space="preserve">' + xmlText(s) + '</t></is></c>';
  }
  function buildXlsx(sheets) {
    if (!sheets || !sheets.length) throw new Error('nothing to export');
    var head = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
    var ct = head + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>';
    var wbSheets = '', wbRels = '', used = {};
    sheets.forEach(function (sh, i) {
      ct += '<Override PartName="/xl/worksheets/sheet' + (i + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>';
      wbSheets += '<sheet name="' + xmlText(sheetName(sh.name, used)) + '" sheetId="' + (i + 1) + '" r:id="rId' + (i + 1) + '"/>';
      wbRels += '<Relationship Id="rId' + (i + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (i + 1) + '.xml"/>';
    });
    ct += '</Types>';
    wbRels += '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>';
    var files = [
      ['[Content_Types].xml', ct],
      ['_rels/.rels', head + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', head + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + wbSheets + '</sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels', head + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + wbRels + '</Relationships>'],
      ['xl/styles.xml', head + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="#,##0.00"/><numFmt numFmtId="165" formatCode="#,##0"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/><xf numFmtId="165" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>']
    ];
    sheets.forEach(function (sh, i) {
      var cols = sh.cols || [];
      var x = head + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>';
      if (cols.length) {
        x += '<cols>';
        cols.forEach(function (c, k) { x += '<col min="' + (k + 1) + '" max="' + (k + 1) + '" width="' + trimFloat(c.width > 0 ? c.width : 14) + '" customWidth="1"/>'; });
        x += '</cols>';
      }
      x += '<sheetData>';
      var row = 1;
      x += '<row r="1">';
      cols.forEach(function (c, k) { x += cellXML(colName(k) + '1', c.title, 'text', true); });
      x += '</row>';
      function writeRow(vals, bold) {
        row++;
        x += '<row r="' + row + '">';
        vals.forEach(function (v, k) { x += cellXML(colName(k) + row, v, k < cols.length ? cols[k].kind : 'text', bold); });
        x += '</row>';
      }
      (sh.rows || []).forEach(function (r) { writeRow(r, false); });
      if (sh.total && sh.total.length) writeRow(sh.total, true);
      x += '</sheetData></worksheet>';
      files.push(['xl/worksheets/sheet' + (i + 1) + '.xml', x]);
    });
    return zip(files.map(function (f) { return { name: f[0], data: utf8(f[1]) }; }));
  }

  // ------------------------------------------------------------------ share sheet
  function canShareFiles(files) { try { return !!(navigator.canShare && navigator.share && navigator.canShare({ files: files })); } catch (e) { return false; } }
  function share(files, title) {
    if (canShareFiles(files)) {
      return navigator.share({ files: files, title: title }).then(function () { return true; }, function (e) {
        if (e && e.name === 'AbortError') return false;
        throw e;
      });
    }
    files.forEach(function (f) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(f);
      a.download = f.name;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 5000);
    });
    return Promise.resolve(true);
  }
  function file(blob, name) { return new File([blob], name, { type: blob.type || 'application/octet-stream' }); }

  root.SplitsKit = { statementPdf: statementPdf, buildPdf: buildPdf, buildXlsx: buildXlsx, share: share, canShareFiles: canShareFiles, file: file, crc32: crc32 };
})(window);
