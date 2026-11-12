/* Splits on the iPhone: the same ledger engine as the Windows app, running in
 * the browser. It reads and writes the exact same encrypted ledger file on
 * GitHub (AES-256-GCM, PBKDF2-SHA256, gzip), merges record by record (newest
 * write wins, deletions travel as tombstones) and answers the same /api calls
 * the app's screens make on Windows. Nothing leaves the phone unencrypted. */
(function (root) {
  'use strict';

  var VERSION = '1.4.0';
  var LEDGER = 'splits-ledger.json';
  var COLLS = ['artists', 'payments', 'managers', 'settings', 'imports'];
  var te = new TextEncoder(), td = new TextDecoder();
  var CORRUPT = 'The ledger is damaged or not a Splits ledger.';
  var BAD_PW = 'That password isn\'t right.';

  // ------------------------------------------------------------------ bytes
  function b64(u8) {
    var s = '';
    for (var i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function unb64(s) {
    var bin = atob(String(s || '').replace(/[\r\n\s]/g, ''));
    var u8 = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return u8;
  }
  function b64url(u8) { return b64(u8).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function unb64url(s) { s = String(s).replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return unb64(s); }
  function rand(n) { var u = new Uint8Array(n); root.crypto.getRandomValues(u); return u; }
  function hex(u8) { var s = ''; for (var i = 0; i < u8.length; i++) s += (u8[i] < 16 ? '0' : '') + u8[i].toString(16); return s; }
  function concat(a, b) { var u = new Uint8Array(a.length + b.length); u.set(a, 0); u.set(b, a.length); return u; }
  function pipe(u8, stream) {
    return new Response(new Blob([u8]).stream().pipeThrough(stream)).arrayBuffer().then(function (ab) { return new Uint8Array(ab); });
  }
  function gzip(u8) { return pipe(u8, new CompressionStream('gzip')); }
  function gunzip(u8) { return pipe(u8, new DecompressionStream('gzip')); }
  var B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  function base32(u8) {
    var out = '', bits = 0, val = 0;
    for (var i = 0; i < u8.length; i++) {
      val = (val << 8) | u8[i]; bits += 8;
      while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; }
    }
    if (bits > 0) out += B32[(val << (5 - bits)) & 31];
    return out;
  }
  function normalizeCode(code) {
    var out = '';
    String(code || '').toUpperCase().split('').forEach(function (r) {
      if ((r >= 'A' && r <= 'Z') || (r >= '2' && r <= '7')) out += r;
      else if (r === '0') out += 'O';
      else if (r === '1') out += 'I';
      else if (r === '8') out += 'B';
    });
    return out;
  }
  function groupCode(code) { return code.match(/.{1,4}/g).join('-'); }

  // ------------------------------------------------------------------ errors
  function fail(status, msg, extra) {
    var e = new Error(msg);
    e.status = status;
    e.data = Object.assign({ error: msg }, extra || {});
    return e;
  }
  function offline(cause) { var e = fail(503, 'offline'); e.offline = true; e.cause = cause; return e; }

  // ------------------------------------------------------------------ crypto (vault.go)
  var subtle = root.crypto && root.crypto.subtle;
  var newKdfIter = 600000;
  function derive(kdf, secret) {
    var salt;
    try { salt = unb64(kdf && kdf.salt); } catch (e) { salt = new Uint8Array(0); }
    if (!kdf || kdf.alg !== 'pbkdf2-sha256' || !(kdf.iter >= 1000) || salt.length < 8) return Promise.reject(fail(400, CORRUPT));
    return subtle.importKey('raw', te.encode(secret), 'PBKDF2', false, ['deriveBits']).then(function (base) {
      return subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: kdf.iter }, base, 256);
    }).then(function (bits) { return new Uint8Array(bits); });
  }
  function aesKey(raw) { return subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']); }
  function seal(raw, plain, aad) {
    var iv = rand(12);
    return aesKey(raw).then(function (k) {
      return subtle.encrypt({ name: 'AES-GCM', iv: iv, additionalData: aad, tagLength: 128 }, k, plain);
    }).then(function (ct) { return concat(iv, new Uint8Array(ct)); });
  }
  function unseal(raw, blob, aad) {
    if (!blob || blob.length < 28) return Promise.reject(fail(400, CORRUPT));
    return aesKey(raw).then(function (k) {
      return subtle.decrypt({ name: 'AES-GCM', iv: blob.subarray(0, 12), additionalData: aad, tagLength: 128 }, k, blob.subarray(12));
    }).then(function (pt) { return new Uint8Array(pt); });
  }
  function aad(env, kind) { return te.encode('splits/' + kind + '/' + env.keyId); }
  function newKdf() { return { alg: 'pbkdf2-sha256', iter: newKdfIter, salt: b64(rand(16)) }; }
  function validEnv(e) { return !!(e && e.format === 'splits-vault' && e.keyId && e.pwWrap); }

  function unlockPassword(env, pw) {
    return derive(env.pwKdf, pw).then(function (kek) {
      return unseal(kek, unb64(env.pwWrap), aad(env, 'pw')).catch(function () { throw fail(400, BAD_PW, { bad: 'password' }); });
    });
  }
  function unlockRecovery(env, code) {
    var norm = normalizeCode(code);
    if (norm.length !== 24) return Promise.reject(fail(400, 'That recovery code isn\'t right.', { bad: 'code' }));
    return derive(env.rcKdf, norm).then(function (kek) {
      return unseal(kek, unb64(env.rcWrap), aad(env, 'rc')).catch(function () { throw fail(400, 'That recovery code isn\'t right.', { bad: 'code' }); });
    });
  }
  function setPassword(env, dek, pw) {
    var k = newKdf();
    return derive(k, pw).then(function (kek) { return seal(kek, dek, aad(env, 'pw')); }).then(function (w) {
      env.pwKdf = k; env.pwWrap = b64(w); env.pwAt = Date.now();
    });
  }
  function newRecovery(env, dek) {
    var code = base32(rand(15));
    var k = newKdf();
    return derive(k, code).then(function (kek) { return seal(kek, dek, aad(env, 'rc')); }).then(function (w) {
      env.rcKdf = k; env.rcWrap = b64(w); env.rcAt = Date.now();
      return groupCode(code);
    });
  }
  function openData(env, dek) {
    if (!env.data) return Promise.resolve('');
    var blob;
    try { blob = unb64(env.data); } catch (e) { return Promise.reject(fail(400, CORRUPT)); }
    return unseal(dek, blob, aad(env, 'data')).catch(function () { throw fail(400, CORRUPT); })
      .then(gunzip).then(function (u8) { return td.decode(u8); });
  }
  function sealData(env, dek, json) {
    return gzip(te.encode(json)).then(function (z) { return seal(dek, z, aad(env, 'data')); }).then(function (blob) { env.data = b64(blob); });
  }
  function sealSecret(env, dek, kind, secret) { return seal(dek, te.encode(secret), aad(env, kind)).then(b64); }
  function openSecret(env, dek, kind, blob64) { return unseal(dek, unb64(blob64), aad(env, kind)).then(function (u8) { return td.decode(u8); }); }

  // ------------------------------------------------------------------ store (store.go)
  function newDataset() { var ds = { schema: 1, colls: {} }; COLLS.forEach(function (c) { ds.colls[c] = {}; }); return ds; }
  function ensure(ds) {
    if (!ds.schema) ds.schema = 1;
    if (!ds.colls || typeof ds.colls !== 'object') ds.colls = {};
    COLLS.forEach(function (c) { if (!ds.colls[c] || typeof ds.colls[c] !== 'object') ds.colls[c] = {}; });
    return ds;
  }
  function parseDataset(json) {
    if (!json) return newDataset();
    var ds;
    try { ds = JSON.parse(json); } catch (e) { throw fail(400, CORRUPT); }
    if (!ds || typeof ds !== 'object') throw fail(400, CORRUPT);
    ensure(ds);
    Object.keys(ds.colls).forEach(function (c) {
      var m = ds.colls[c];
      Object.keys(m).forEach(function (id) { if (!m[id] || typeof m[id] !== 'object') delete m[id]; });
    });
    return ds;
  }
  function cloneRec(r) {
    var c = { id: r.id, u: r.u };
    if (r.dev) c.dev = r.dev;
    if (r.del) c.del = true;
    if (r.b !== undefined && r.b !== null) c.b = JSON.parse(JSON.stringify(r.b));
    return c;
  }
  function newer(a, b) {
    if (a.u !== b.u) return a.u > b.u;
    return (a.dev || '') > (b.dev || '');
  }
  // mergeInto merges src into dst; changed: dst took something from src; ahead: dst has writes src lacks.
  function mergeInto(dst, src) {
    ensure(dst); ensure(src);
    var changed = false, ahead = false;
    Object.keys(src.colls).forEach(function (c) {
      var s = src.colls[c] || {};
      var d = dst.colls[c] || (dst.colls[c] = {});
      Object.keys(s).forEach(function (id) {
        var sr = s[id], dr = d[id];
        if (!sr) return;
        if (!dr || newer(sr, dr)) { d[id] = cloneRec(sr); changed = true; }
      });
    });
    var cs = Object.keys(dst.colls);
    for (var i = 0; i < cs.length && !ahead; i++) {
      var d2 = dst.colls[cs[i]], s2 = src.colls[cs[i]] || {};
      var ids = Object.keys(d2);
      for (var j = 0; j < ids.length; j++) {
        var sr2 = s2[ids[j]];
        if (!sr2 || newer(d2[ids[j]], sr2)) { ahead = true; break; }
      }
    }
    return { changed: changed, ahead: ahead };
  }
  function mergeHeader(local, remote) {
    var changed = false, ahead = false;
    if ((remote.pwAt || 0) > (local.pwAt || 0)) { local.pwKdf = remote.pwKdf; local.pwWrap = remote.pwWrap; local.pwAt = remote.pwAt; changed = true; }
    else if ((remote.pwAt || 0) < (local.pwAt || 0)) ahead = true;
    if ((remote.rcAt || 0) > (local.rcAt || 0)) { local.rcKdf = remote.rcKdf; local.rcWrap = remote.rcWrap; local.rcAt = remote.rcAt; changed = true; }
    else if ((remote.rcAt || 0) < (local.rcAt || 0)) ahead = true;
    return { changed: changed, ahead: ahead };
  }
  var ID_RE = /^[A-Za-z0-9._-]{1,80}$/;
  function apply(ds, op, now, dev) {
    if (!op || COLLS.indexOf(op.c) < 0) throw fail(400, 'unknown collection "' + (op && op.c) + '"');
    if (typeof op.id !== 'string' || !ID_RE.test(op.id)) throw fail(400, 'invalid record id');
    var coll = ds.colls[op.c], prev = coll[op.id];
    var u = now;
    if (prev && prev.u >= u) u = prev.u + 1;
    var rec = { id: op.id, u: u, dev: dev };
    if (op.op === 'put') {
      if (!op.b || typeof op.b !== 'object' || Array.isArray(op.b)) throw fail(400, 'record must be a JSON object');
      var s = JSON.stringify(op.b);
      if (te.encode(s).length > 64 * 1024) throw fail(400, 'record is too large');
      rec.b = JSON.parse(s);
    } else if (op.op === 'del') {
      if (!prev || prev.del) return null;
      rec.del = true;
      if (prev.b !== undefined) rec.b = prev.b;
    } else throw fail(400, 'unknown operation "' + op.op + '"');
    coll[op.id] = rec;
    return rec;
  }
  function cloneDataset(ds) { return parseDataset(JSON.stringify(ds)); }
  function clientView(ds) {
    var out = {};
    Object.keys(ds.colls).forEach(function (c) {
      var m = ds.colls[c];
      out[c] = Object.keys(m).filter(function (id) { return !m[id].del; }).sort().map(function (id) { return { id: id, u: m[id].u, b: m[id].b || {} }; });
    });
    return out;
  }
  function restoreOps(cur, target) {
    var ops = [];
    COLLS.forEach(function (c) {
      var cm = cur.colls[c] || {}, tm = target.colls[c] || {};
      Object.keys(cm).forEach(function (id) {
        if (cm[id].del) return;
        if (!tm[id] || tm[id].del) ops.push({ op: 'del', c: c, id: id });
      });
      Object.keys(tm).forEach(function (id) {
        var t = tm[id];
        if (t.del) return;
        var r = cm[id];
        if (r && !r.del && JSON.stringify(r.b) === JSON.stringify(t.b)) return;
        ops.push({ op: 'put', c: c, id: id, b: t.b || {} });
      });
    });
    ops.sort(function (a, b) { return a.c !== b.c ? (a.c < b.c ? -1 : 1) : (a.id < b.id ? -1 : a.id > b.id ? 1 : 0); });
    return ops;
  }

  // ------------------------------------------------------------------ sync key and phone link
  var RE_PART = /^[A-Za-z0-9_.-]{1,100}$/, RE_TOKEN = /^[A-Za-z0-9_]{20,255}$/;
  function parseSyncKey(key) {
    var k = String(key || '').trim().replace(/^https:\/\//, '').replace(/^github\.com\//, '');
    var m = k.match(/[#| \t\r\n]/);
    var bad = fail(400, 'This doesn\'t look like a sync key. It should look like owner/repository#key.');
    if (!m) throw bad;
    var left = k.slice(0, m.index), right = k.slice(m.index).replace(/^[#| \t\r\n]+|[#| \t\r\n]+$/g, '');
    var parts = left.replace(/\.git$/, '').split('/');
    if (parts.length !== 2 || !RE_PART.test(parts[0]) || !RE_PART.test(parts[1]) || !RE_TOKEN.test(right)) throw bad;
    return { owner: parts[0], repo: parts[1], token: right };
  }
  // The link the computer shows as a QR code: #p=<version 1, keyId, password KDF and wrap, sync key sealed with the data key>.
  function parsePhoneLink(s) {
    var str = String(s || '').trim();
    var m = str.match(/[#&?]p=([A-Za-z0-9_-]+)/);
    var code = m ? m[1] : str;
    var bad = fail(400, 'This isn\'t a Splits link for the iPhone. Make a new one on your computer: Settings, Use Splits on your iPhone.');
    var b;
    try { b = unb64url(code); } catch (e) { throw bad; }
    if (b.length < 60 || b[0] !== 1) throw bad;
    var i = 1;
    function take(n) { if (i + n > b.length) throw bad; var x = b.subarray(i, i + n); i += n; return x; }
    var keyId = hex(take(8));
    var it = take(4);
    var iter = ((it[0] << 24) >>> 0) + (it[1] << 16) + (it[2] << 8) + it[3];
    var salt = take(take(1)[0]);
    var wrap = take(take(1)[0]);
    var ln = take(2);
    var sealed = take((ln[0] << 8) | ln[1]);
    if (i !== b.length) throw bad;
    return { keyId: keyId, pwKdf: { alg: 'pbkdf2-sha256', iter: iter, salt: b64(salt) }, pwWrap: b64(wrap), sealed: sealed, code: code };
  }

  // ------------------------------------------------------------------ storage
  function browserStorage() {
    return {
      get: function (k) { try { return root.localStorage.getItem(k); } catch (e) { return null; } },
      set: function (k, v) {
        try { root.localStorage.setItem(k, v); } catch (e) { throw fail(507, 'The iPhone has no room left for Splits\' data. Free some space and try again.'); }
      },
      del: function (k) { try { root.localStorage.removeItem(k); } catch (e) { /* gone */ } }
    };
  }

  // ------------------------------------------------------------------ the engine
  function create(opt) {
    opt = opt || {};
    var store = opt.storage || browserStorage();
    var apiBase = (opt.apiBase || 'https://api.github.com').replace(/\/+$/, '');
    var fetchFn = opt.fetch || function (u, o) { return root.fetch(u, o); };
    var now = opt.now || function () { return Date.now(); };
    if (opt.kdfIter) newKdfIter = opt.kdfIter;
    var K = { vault: 'splits.vault', local: 'splits.local', pair: 'splits.pair' };

    var S = {
      env: null, dek: null, data: null, rev: 1, local: null, pending: false, seq: 0,
      cache: { etag: '', content: null, sha: '' },
      sync: { state: 'off', message: '', lastOk: 0, repo: '', busy: false },
      timer: null, running: null, again: false, fails: 0, saving: Promise.resolve(), listeners: []
    };

    function loadLocal() {
      var l = null;
      try { l = JSON.parse(store.get(K.local) || 'null'); } catch (e) { l = null; }
      S.local = l && typeof l === 'object' ? l : {};
      if (!S.local.deviceId) { S.local.deviceId = 'iphone-' + hex(rand(4)); saveLocal(); }
      if (S.local.sync) S.sync.repo = S.local.sync.owner + '/' + S.local.sync.repo;
      if (S.local.sync && S.local.sync.lastSync) S.sync.lastOk = S.local.sync.lastSync;
    }
    function saveLocal() { store.set(K.local, JSON.stringify(S.local)); }
    function loadVault() {
      var raw = store.get(K.vault);
      if (!raw) { S.env = null; return; }
      try { var e = JSON.parse(raw); S.env = validEnv(e) ? e : null; } catch (x) { S.env = null; }
    }
    loadLocal();
    loadVault();

    function touch() { S.seq++; S.pending = true; }
    function clearPending(seq) { if (S.seq === seq) S.pending = false; else kick(1000); }
    function changed() { S.rev++; S.listeners.forEach(function (fn) { try { fn(); } catch (e) { /* ignore */ } }); }

    // Seal the data into the envelope and keep it on the phone. Saves run one after another.
    // sealVault resolves to { json, seq }: the file and the change count it contains.
    function sealVault() {
      var p = S.saving.then(function () {
        if (!S.env) throw fail(400, 'Splits isn\'t set up on this iPhone yet.');
        var step = Promise.resolve();
        var seq = S.seq;
        if (S.dek && S.data) {
          var dek = S.dek, json = JSON.stringify(S.data);
          step = sealData(S.env, dek, json).then(function () { S.env.savedAt = now(); S.env.savedBy = S.local.deviceId; });
        }
        return step.then(function () {
          var out = JSON.stringify(S.env);
          store.set(K.vault, out);
          return { json: out, seq: seq };
        });
      });
      S.saving = p.catch(function () { /* keep the chain going */ });
      return p;
    }
    function saveVault() { return sealVault().then(function (r) { return r.json; }); }

    // -------------------------------------------------------------- lockout (app.go)
    function lockout() {
      if ((S.local.lockUntil || 0) > now()) {
        var secs = Math.ceil((S.local.lockUntil - now()) / 1000);
        throw fail(429, 'Too many wrong tries. Try again in ' + secs + ' seconds.', { lockUntil: S.local.lockUntil });
      }
    }
    function failed() {
      S.local.failCount = (S.local.failCount || 0) + 1;
      if (S.local.failCount >= 5) {
        var d = Math.min(30000 * Math.pow(2, Math.min(S.local.failCount - 5, 5)), 15 * 60000);
        S.local.lockUntil = now() + d;
      }
      saveLocal();
    }
    function succeeded() { S.local.failCount = 0; S.local.lockUntil = 0; saveLocal(); }
    function checkPassword(pw) {
      lockout();
      return unlockPassword(S.env, pw).catch(function (e) { if (e.data && e.data.bad) failed(); throw e; });
    }

    // -------------------------------------------------------------- GitHub (sync.go)
    function ghError(res) {
      var msg = '';
      try { msg = JSON.parse(res.text).message || ''; } catch (e) { /* not JSON */ }
      if (res.status === 401) return fail(400, 'The GitHub key is invalid or has expired. Make a new link on your computer.', { gh: 401 });
      if (res.status === 403) {
        if (res.headers && res.headers.get && res.headers.get('X-RateLimit-Remaining') === '0') return fail(400, 'GitHub is limiting requests for a while. Splits will try again shortly.', { gh: 403 });
        return fail(400, 'GitHub refused the change. Check that the key can read and write this repository. (' + msg + ')', { gh: 403 });
      }
      if (res.status === 404) return fail(400, 'Can\'t find the repository, or the key doesn\'t have access to it.', { gh: 404 });
      if (res.status >= 500) return offline(new Error('GitHub error ' + res.status));
      return fail(400, 'GitHub error ' + res.status + ': ' + msg, { gh: res.status });
    }
    function ghDo(g, method, path, body, hdr) {
      var headers = { 'Accept': 'application/vnd.github+json', 'Authorization': 'Bearer ' + g.token, 'X-GitHub-Api-Version': '2022-11-28' };
      if (body) headers['Content-Type'] = 'application/json';
      Object.keys(hdr || {}).forEach(function (k) { headers[k] = hdr[k]; });
      var url = apiBase + '/repos/' + encodeURIComponent(g.owner) + '/' + encodeURIComponent(g.repo) + path;
      return Promise.resolve().then(function () {
        return fetchFn(url, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined, cache: 'no-store' });
      }).then(function (res) {
        return res.text().then(function (text) { return { status: res.status, headers: res.headers, text: text }; });
      }, function (e) { throw offline(e); });
    }
    function ghCheck(g) { return ghDo(g, 'GET', '').then(function (r) { if (r.status !== 200) throw ghError(r); }); }
    function ghGet(g, etag) {
      return ghDo(g, 'GET', '/contents/' + LEDGER, null, etag ? { 'If-None-Match': etag } : null).then(function (r) {
        if (r.status === 304) return { status: 304, etag: etag };
        if (r.status === 404) return ghCheck(g).then(function () { return { status: 404 }; });
        if (r.status !== 200) throw ghError(r);
        var c;
        try { c = JSON.parse(r.text); } catch (e) { throw fail(400, 'GitHub sent an unexpected answer.'); }
        if (c.type && c.type !== 'file') throw fail(400, LEDGER + ' on GitHub isn\'t a file.');
        var etagOut = r.headers && r.headers.get ? (r.headers.get('ETag') || '') : '';
        var raw = c.content;
        var step = Promise.resolve(raw);
        if ((c.encoding !== 'base64' || !raw) && c.size > 0) {
          step = ghDo(g, 'GET', '/git/blobs/' + c.sha).then(function (br) {
            if (br.status !== 200) throw ghError(br);
            try { return JSON.parse(br.text).content; } catch (e) { throw fail(400, 'GitHub sent an unexpected answer.'); }
          });
        }
        return step.then(function (content64) {
          var text;
          try { text = td.decode(unb64(content64 || '')); } catch (e) { throw fail(400, 'GitHub sent a damaged file.'); }
          return { status: 200, content: text, sha: c.sha, etag: etagOut };
        });
      });
    }
    function ghPut(g, content, sha, msg) {
      var body = { message: msg, content: b64(te.encode(content)) };
      if (sha) body.sha = sha;
      return ghDo(g, 'PUT', '/contents/' + LEDGER, body).then(function (r) {
        if (r.status === 200 || r.status === 201) {
          var s = '';
          try { s = JSON.parse(r.text).content.sha; } catch (e) { /* keep empty */ }
          return { sha: s };
        }
        if (r.status === 409 || (r.status === 422 && /sha/i.test(r.text))) return { conflict: true };
        throw ghError(r);
      });
    }
    function client() {
      var cfg = S.local.sync;
      if (!cfg) return Promise.reject(fail(400, 'GitHub isn\'t connected.'));
      if (!S.dek) return Promise.reject(fail(423, 'Splits is locked'));
      if (cfg.keyId !== S.env.keyId) return Promise.reject(fail(400, 'Reconnect this iPhone: make a new link on your computer.'));
      return openSecret(S.env, S.dek, 'token', cfg.tokenSeal).then(function (token) {
        return { owner: cfg.owner, repo: cfg.repo, token: token };
      }, function () { throw fail(400, 'Reconnect this iPhone: make a new link on your computer.'); });
    }

    function setSync(state, msg) {
      S.sync.state = state;
      S.sync.message = msg || '';
      if (state === 'ok') S.sync.lastOk = now();
    }
    function syncFailed(e) {
      if (e && e.offline) setSync('offline', 'No connection to GitHub. Changes are saved on this iPhone and will sync when you\'re back online.');
      else if (e && e.data && e.data.mismatch) setSync('mismatch', e.message);
      else if (e && e.data && e.data.gh === 401) setSync('auth', e.message);
      else setSync('error', (e && e.message) || String(e));
      throw e;
    }

    // One pull-merge-push cycle, like the Windows app.
    function once() {
      var cfg = S.local.sync;
      if (!cfg) { setSync('off'); return Promise.resolve(); }
      if (!S.dek) { setSync('locked', 'Unlock Splits to sync.'); return Promise.resolve(); }
      var pending = S.pending;
      S.sync.busy = true;
      if (S.sync.state !== 'ok') setSync('syncing');
      var attempt = 0;
      function round(g) {
        var etag = attempt === 0 && S.cache.content ? S.cache.etag : '';
        return ghGet(g, etag).then(function (r) {
          var content, sha;
          if (r.status === 304) {
            if (!pending && !S.pending) { setSync('ok'); return 'done'; }
            content = S.cache.content; sha = S.cache.sha;
          } else if (r.status === 200) {
            S.cache = { etag: r.etag, content: r.content, sha: r.sha };
            content = r.content; sha = r.sha;
          } else S.cache = { etag: '', content: null, sha: '' };
          if (!S.dek || S.local.sync !== cfg) return 'done';
          var payloadP, putSha = '', msg = 'Update ledger from ' + S.local.deviceId, mergedSeq = S.seq;
          if (r.status === 404) {
            payloadP = sealVault();
            msg = 'Create ledger';
          } else {
            var renv;
            try { renv = JSON.parse(content); } catch (e) { renv = null; }
            if (!validEnv(renv)) throw fail(400, LEDGER + ' on GitHub isn\'t a Splits ledger.');
            if (renv.keyId !== S.env.keyId) throw fail(400, 'GitHub has a different ledger. Remove Splits from this iPhone in Settings and connect it again.', { mismatch: true });
            payloadP = openData(renv, S.dek).catch(function () { throw fail(400, 'Splits can\'t read the ledger on GitHub. It may be damaged.'); }).then(function (plain) {
              var rds;
              try { rds = parseDataset(plain); } catch (e) { throw fail(400, 'Splits can\'t read the ledger on GitHub. It may be damaged.'); }
              if (!S.dek || !S.data) return 'abort';
              var seqAtMerge = S.seq;
              var m = mergeInto(S.data, rds);
              var hm = mergeHeader(S.env, renv);
              var save = m.changed || hm.changed ? saveVault().then(function () { changed(); }) : Promise.resolve();
              return save.then(function () {
                if (!m.ahead && !hm.ahead) { mergedSeq = seqAtMerge; return null; }
                putSha = sha;
                return sealVault();
              });
            });
          }
          return payloadP.then(function (payload) {
            if (payload === 'abort') return 'done';
            if (payload === null) {
              clearPending(mergedSeq);
              cfg.lastSha = sha; cfg.lastSync = now();
              saveLocal();
              setSync('ok');
              return 'done';
            }
            var sentSeq = payload.seq;
            payload = payload.json;
            return ghPut(g, payload, putSha, msg).then(function (pr) {
              if (pr.conflict) {
                S.pending = true; pending = true;
                S.cache = { etag: '', content: null, sha: '' };
                attempt++;
                if (attempt >= 6) throw fail(400, 'Another computer kept changing the ledger. Splits will try again shortly.');
                return new Promise(function (res) { setTimeout(res, 400 * attempt); }).then(function () { return round(g); });
              }
              S.cache = { etag: '', content: payload, sha: pr.sha };
              clearPending(sentSeq);
              cfg.lastSha = pr.sha; cfg.lastSync = now();
              saveLocal();
              setSync('ok');
              return 'done';
            });
          });
        });
      }
      return client().then(round).then(function () { S.fails = 0; }, function (e) { S.fails++; return syncFailed(e); })
        .finally(function () { S.sync.busy = false; });
    }

    function run() {
      if (S.running) { S.again = true; return S.running; }
      S.running = once().catch(function () { /* status shows it */ }).finally(function () {
        S.running = null;
        if (S.again) { S.again = false; kick(200); return; }
        var next = 60000;
        if (S.sync.state === 'offline') next = Math.min(10000 * Math.pow(2, Math.min(Math.max(S.fails - 1, 0), 5)), 300000);
        else if (S.sync.state === 'error' || S.sync.state === 'auth' || S.sync.state === 'mismatch') next = 180000;
        kick(next);
      });
      return S.running;
    }
    function kick(ms) {
      if (S.timer) clearTimeout(S.timer);
      S.timer = setTimeout(function () { S.timer = null; run(); }, ms);
    }
    function syncNow() {
      if (S.timer) { clearTimeout(S.timer); S.timer = null; }
      if (S.running) { S.again = true; return S.running.then(function () { return S.running || run(); }); }
      return run();
    }

    // -------------------------------------------------------------- open the ledger
    function openWithKey(dek) {
      return openData(S.env, dek).then(function (plain) {
        S.data = parseDataset(plain);
        S.dek = dek;
        succeeded();
        changed();
        kick(300);
      });
    }
    // Join the ledger on GitHub. getDek(remoteEnvelope) returns the data key.
    function joinWith(k, getDek) {
      var g = { owner: k.owner, repo: k.repo, token: k.token };
      return ghGet(g, '').catch(function (e) {
        if (e.offline) throw fail(400, 'Can\'t reach GitHub. Check the internet connection and try again.');
        throw e;
      }).then(function (r) {
        if (r.status !== 200) throw fail(400, 'There\'s no ledger on GitHub yet. Start Splits on your computer and connect it to GitHub first.');
        var renv;
        try { renv = JSON.parse(r.content); } catch (e) { renv = null; }
        if (!validEnv(renv)) throw fail(400, LEDGER + ' in this repository isn\'t a Splits ledger.');
        return Promise.resolve(getDek(renv)).then(function (dek) {
          return openData(renv, dek).then(function (plain) {
            var ds = parseDataset(plain);
            return sealSecret(renv, dek, 'token', k.token).then(function (tokenSeal) {
              S.env = renv;
              store.set(K.vault, r.content);
              S.local.sync = { owner: k.owner, repo: k.repo, path: LEDGER, tokenSeal: tokenSeal, keyId: renv.keyId, lastSha: r.sha, lastSync: now() };
              S.local.failCount = 0; S.local.lockUntil = 0;
              saveLocal();
              store.del(K.pair);
              S.cache = { etag: r.etag, content: r.content, sha: r.sha };
              S.dek = dek; S.data = ds; S.pending = false;
              S.sync.repo = k.owner + '/' + k.repo;
              setSync('ok');
              changed();
              kick(60000);
            });
          });
        });
      });
    }

    // -------------------------------------------------------------- the /api the screens call
    function state() {
      var t = now();
      var st = {
        version: VERSION, initialized: !!S.env, locked: !S.dek, rev: S.rev,
        dataDir: '', pdfDir: '', backupDir: '', lastBackup: S.local.lastBackup || 0,
        device: S.local.deviceId, platform: 'iphone', now: t, phone: true,
        pairing: !S.env && !!store.get(K.pair)
      };
      if ((S.local.lockUntil || 0) > t) st.lockUntil = S.local.lockUntil;
      if (!S.local.sync) st.sync = { state: 'off', busy: false, pending: false };
      else {
        st.sync = { state: S.sync.state, message: S.sync.message, lastOk: S.sync.lastOk, repo: S.sync.repo, busy: S.sync.busy, pending: S.pending };
        if (st.locked) st.sync.state = 'locked';
      }
      return st;
    }
    function needOpen() { if (!S.env) throw fail(400, 'Splits isn\'t set up on this iPhone yet.'); if (!S.dek) throw fail(423, 'Splits is locked'); }

    var routes = {
      'GET /api/state': function () { return state(); },
      'POST /api/beat': function () { return state(); },
      'POST /api/bye': function () { return { ok: true }; },
      'POST /api/unlock': function (b) {
        if (!S.env) throw fail(400, 'Splits isn\'t set up on this iPhone yet.');
        if (S.dek) return state();
        return checkPassword(b.password || '').then(openWithKey).then(state);
      },
      'POST /api/lock': function () {
        return S.saving.then(function () {
          if (S.dek) { S.dek = null; S.data = null; changed(); }
          return state();
        });
      },
      'GET /api/data': function () { needOpen(); return { rev: S.rev, colls: clientView(S.data) }; },
      'POST /api/mutate': function (b) {
        needOpen();
        var ops = (b && b.ops) || [];
        if (ops.length > 5000) throw fail(400, 'too many changes at once');
        var work = cloneDataset(S.data), t = now(), out = [];
        ops.forEach(function (op) {
          var rec = apply(work, op, t, S.local.deviceId);
          if (rec) out.push({ c: op.c, id: rec.id, u: rec.u, del: rec.del || undefined, b: rec.b });
        });
        S.data = work;
        if (!out.length) return { rev: S.rev, recs: [] };
        S.rev++;
        touch();
        return saveVault().then(function () { kick(2000); return { rev: S.rev, recs: out }; });
      },
      'POST /api/pairlink': function (b) {
        var p = parsePhoneLink(b.link);
        store.set(K.pair, p.code);
        return state();
      },
      'POST /api/pair': function (b) {
        if (S.env) throw fail(400, 'This iPhone is already connected.');
        lockout();
        var p = parsePhoneLink(store.get(K.pair));
        var envLike = { keyId: p.keyId };
        return derive(p.pwKdf, b.password || '').then(function (kek) {
          return unseal(kek, unb64(p.pwWrap), aad(envLike, 'pw')).catch(function () { failed(); throw fail(400, BAD_PW, { bad: 'password' }); });
        }).then(function (dek) {
          return unseal(dek, p.sealed, aad(envLike, 'phone')).catch(function () {
            throw fail(400, 'This link is damaged. Make a new one on your computer.');
          }).then(function (u8) {
            var k = parseSyncKey(td.decode(u8));
            return joinWith(k, function (renv) {
              if (renv.keyId !== p.keyId) throw fail(400, 'This link is for another ledger. Make a new one on your computer.');
              return dek;
            });
          });
        }).then(state);
      },
      'POST /api/pair/forget': function () { store.del(K.pair); return state(); },
      'POST /api/join': function (b) {
        if (S.env) throw fail(400, 'This iPhone is already connected.');
        lockout();
        var k = parseSyncKey(b.key);
        return joinWith(k, function (renv) {
          return unlockPassword(renv, b.password || '').catch(function (e) {
            if (e.data && e.data.bad) { failed(); throw fail(400, 'That\'s not the password of the ledger on GitHub.', { bad: 'password' }); }
            throw e;
          });
        }).then(state);
      },
      'POST /api/recover': function (b) {
        if (!S.env) throw fail(400, 'Splits isn\'t set up on this iPhone yet.');
        if (!b.next) throw fail(400, 'Choose a new password');
        lockout();
        return unlockRecovery(S.env, b.code).catch(function (e) { if (e.data && e.data.bad) failed(); throw e; }).then(function (dek) {
          return setPassword(S.env, dek, b.next).then(function () { return openWithKey(dek); });
        }).then(function () { touch(); return saveVault(); }).then(function () { kick(500); return state(); });
      },
      'POST /api/password': function (b) {
        needOpen();
        if (!b.next) throw fail(400, 'Choose a new password');
        return checkPassword(b.current || '').then(function () { succeeded(); return setPassword(S.env, S.dek, b.next); })
          .then(function () { touch(); return saveVault(); }).then(function () { kick(500); return { ok: true }; });
      },
      'POST /api/recovery': function (b) {
        needOpen();
        return checkPassword(b.password || '').then(function () { succeeded(); return newRecovery(S.env, S.dek); }).then(function (code) {
          touch();
          return saveVault().then(function () { kick(500); return { recoveryCode: code }; });
        });
      },
      'POST /api/sync/now': function () { return syncNow().then(state, state); },
      'POST /api/sync/key': function (b) {
        needOpen();
        return checkPassword(b.password || '').then(function () { succeeded(); return client(); }).then(function (g) { return { key: g.owner + '/' + g.repo + '#' + g.token }; });
      },
      // On the iPhone, "stop syncing" removes Splits and its data from this phone.
      'POST /api/sync/disconnect': function () {
        return S.saving.then(function () {
          if (S.timer) { clearTimeout(S.timer); S.timer = null; }
          S.env = null; S.dek = null; S.data = null; S.pending = false;
          S.cache = { etag: '', content: null, sha: '' };
          store.del(K.vault); store.del(K.pair);
          var dev = S.local.deviceId;
          S.local = { deviceId: dev };
          saveLocal();
          setSync('off');
          S.sync.repo = '';
          changed();
          return state();
        });
      },
      'POST /api/backup/export': function () {
        needOpen();
        return saveVault().then(function (json) {
          var d = new Date(now());
          var p = function (n) { return (n < 10 ? '0' : '') + n; };
          S.local.lastBackup = now(); saveLocal();
          return { name: 'splits-' + d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + '_' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()) + '-iphone.json', json: json };
        });
      },
      'POST /api/backup/import': function (b) {
        needOpen();
        var env;
        try { env = JSON.parse(b.json || ''); } catch (e) { env = null; }
        if (!validEnv(env)) throw fail(400, 'This file isn\'t a Splits backup.');
        var dekP = env.keyId === S.env.keyId ? Promise.resolve(S.dek) : (b.password
          ? unlockPassword(env, b.password).catch(function () { throw fail(400, 'That\'s not the password this backup was made with.', { needPassword: true }); })
          : Promise.reject(fail(400, 'This backup has a different password. Enter the password it was made with.', { needPassword: true })));
        return dekP.then(function (dek) { return openData(env, dek); }).then(function (plain) {
          var target = parseDataset(plain);
          var ops = restoreOps(S.data, target);
          var t = now();
          ops.forEach(function (op) { apply(S.data, op, t, S.local.deviceId); });
          if (!ops.length) return { changes: 0 };
          S.rev++; touch();
          return saveVault().then(function () { kick(500); return { changes: ops.length }; });
        });
      }
    };

    function call(method, path, body) {
      var fn = routes[method + ' ' + path.split('?')[0]];
      return Promise.resolve().then(function () {
        if (!fn) throw fail(404, 'This isn\'t available on the iPhone.');
        if (!subtle || typeof CompressionStream === 'undefined') throw fail(400, 'Update your iPhone to use Splits: it needs iOS 16.4 or newer.');
        return fn(body || {});
      }).then(function (data) {
        return data === undefined ? null : JSON.parse(JSON.stringify(data));
      });
    }

    // Sync when the phone comes back online or the app comes back to the front.
    if (root.addEventListener) {
      root.addEventListener('online', function () { if (S.local.sync) kick(500); });
    }
    if (root.document && root.document.addEventListener) {
      root.document.addEventListener('visibilitychange', function () {
        if (root.document.visibilityState === 'visible' && S.local.sync) kick(300);
      });
    }
    if (S.local.sync) kick(1500);

    return {
      call: call,
      // Keep a link from the computer (#p=…) until the password is typed. Throws if it isn't one.
      keepPhoneLink: function (link) { if (!S.env) store.set(K.pair, parsePhoneLink(link).code); },
      syncNow: syncNow,
      state: state,
      onChange: function (fn) { S.listeners.push(fn); },
      _S: S
    };
  }

  var api = {
    create: create,
    parsePhoneLink: parsePhoneLink,
    parseSyncKey: parseSyncKey,
    mergeInto: mergeInto,
    restoreOps: restoreOps,
    _crypto: { derive: derive, seal: seal, unseal: unseal, b64: b64, unb64: unb64, b64url: b64url, unb64url: unb64url, gzip: gzip, gunzip: gunzip }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SplitsEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
