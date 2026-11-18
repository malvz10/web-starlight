/* Starlight — ajustes del Estudio compartidos entre todos tus dispositivos.
   - En Cloudflare: GET/PUT /api/ajustes (lo atiende _worker.js con un KV). Guardar pide la clave del estudio una vez por navegador.
   - En el artefacto de Claude: la base de datos del artefacto (solo el dueño escribe).
   Lo que llega de aquí gana sobre lo guardado en este navegador; cada cambio en el Estudio se sube solo. */
(function () {
  'use strict';
  var LS = 'starlightStudio', PIN = 'starlightPIN';
  var host = location.hostname, inArtifact = /claudeusercontent\.com$/.test(host);
  var lastSent = '', timer = 0, push = null, pending = null;

  function local(){ try { return JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) { return null; } }
  function got(obj, str){
    if (!obj || typeof obj !== 'object' || !Object.keys(obj).length) {        // nothing shared yet: this browser's settings become the shared ones
      var l = local(); if (l && Object.keys(l).length) seed = JSON.stringify(l); return; }
    if (str) lastSent = str;
    try { localStorage.setItem(LS, JSON.stringify(obj)); } catch (e) {}
    if (window.__stuLoad) window.__stuLoad(obj);                              // engine already running: apply now
    else { window.__REMOTE_V = obj; window.__REMOTE_LATE = obj; }            // engine not yet: it picks this up when it starts
  }
  var seed = null;
  /* the studio calls this on every change (coalesced: one upload per pause) */
  window.__stuPush = function (V) {
    clearTimeout(timer);
    timer = setTimeout(function () { var s = JSON.stringify(V); if (s === lastSent) return; pending = s; if (push) push(s); }, 900);
  };
  function flushSeed(){ if (seed && push) { var s = seed; seed = null; push(s); } }

  if (inArtifact) {
    var tries = 0;
    (function waitClaude(){
      if (!window.claude || !window.claude.use) { if (++tries < 50) setTimeout(waitClaude, 100); return; }
      window.claude.use('db').then(function (db) {
        if (!db) return;
        var doc = db.doc('ajustes/estudio'), busy = false, queued = null;
        push = function (s) {
          if (busy) { queued = s; return; }
          busy = true; lastSent = s;
          doc.set({ v:s, t:Date.now() }).catch(function () {}).then(function () { busy = false; if (queued) { var q = queued; queued = null; push(q); } });
        };
        doc.onSnapshot(function (snap) {
          if (snap.metadata && snap.metadata.hasPendingWrites) return;
          var d = snap.exists && snap.data(); if (!d || typeof d.v !== 'string') { got(null); flushSeed(); return; }
          if (d.v === lastSent) return;
          try { got(JSON.parse(d.v), d.v); } catch (e) {}
        }, function () {});
        if (pending) push(pending);
      }, function () {});
    })();
  } else if (/^https?:$/.test(location.protocol) && host !== 'localhost' && host !== '127.0.0.1') {
    fetch('/api/ajustes', { cache:'no-store' }).then(function (r) { return r.ok ? r.text() : ''; }).then(function (t) {
      if (!t) return; var o = null; try { o = JSON.parse(t); } catch (e) {} got(o, o && Object.keys(o).length ? t : '');
      if (seed && localStorage.getItem(PIN)) flushSeed(); else seed = null;   // only the owner (with the key) seeds the shared copy
    }).catch(function () {});
    push = function (s, retry) {
      var pin = ''; try { pin = localStorage.getItem(PIN) || ''; } catch (e) {}
      if (!pin) { pin = (window.prompt('Clave del Estudio (para que tus ajustes se vean igual en todos tus dispositivos):') || '').trim(); if (!pin) return; try { localStorage.setItem(PIN, pin); } catch (e) {} }
      fetch('/api/ajustes', { method:'PUT', headers:{ 'content-type':'application/json', 'x-clave':pin }, body:s }).then(function (r) {
        if (r.ok) { lastSent = s; return; }
        if (r.status === 401) { try { localStorage.removeItem(PIN); } catch (e) {} if (!retry) { window.alert('Esa clave no es correcta.'); push(s, true); } }
      }).catch(function () {});
    };
  }
})();
