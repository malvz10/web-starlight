/* Starlight Detailing MX — interfaz en modo presentación.
   Una página a la vez: la rueda, las flechas o un deslizamiento pasan exactamente un paso.
   En el celular el texto y la cámara siguen al dedo; al soltar se completa (más de 1/4 o un golpe rápido) o regresa.
   El 3D (js/engine.js) expone window.S3D; aquí se decide qué toma y qué efecto va en cada paso. */
(function () {
  'use strict';

  /* ======================= CONFIGURACIÓN (editar aquí) ======================= */
  const CONFIG = {
    whatsapp: '523335561612',            // 52 + número, solo dígitos
    studio: true,                         // botón "Estudio" en la barra superior (ponlo en false al lanzar si no lo quieres público)
    work: [
      { src:'assets/work/gt3-verde.jpg', title:'911 GT3: corrección y protección' },
      { src:'assets/work/ppf-gloss-vs-mate.jpg', title:'PPF brillante contra mate' },
      { src:'assets/work/gt3-verde-detalle.jpg', title:'Brillo después del detallado' },
      { src:'assets/work/ppf-mate.jpg', title:'PPF mate en Cayenne' },
      { src:'assets/work/gt3rs-estudio.jpg', title:'GT3 RS en el taller' },
      { src:'assets/work/puerta-interior.jpg', title:'Interiores' }
    ],
    chips: ['Detallado general', 'PPF', 'PPF de color', 'Recubrimiento cerámico', 'Polarizado', 'Restauración de faros', 'Varillaje']
  };
  /* duración (segundos) de los pasos que se animan solos al llegar */
  const DUR = { wash:9, wax:5.5, ppf:7, bikini:3.2, frontal:3.2, cover:3.8, lampproc:7.5, pdr:7 };
  /* Servicios: al pasar el cursor, toma y efecto de vista previa de cada servicio (mismo orden que las tarjetas) */
  const SVC_PREV = [
    { shot:'det', fx:{ dirt:1 } },
    { shot:'frontal', fx:{ film:1, pkg:'frontal', filmZ:-3 } },
    { shot:'ceramic', fx:{ gloss:1, rain:1 } },
    { shot:'tint', fx:{ tintAll:1 } },
    { shot:'lamp', fx:{ mica:1 } },
    { shot:'pdr', fx:{ dent:1, pdrEnv:1 } }
  ];
  const COLORS = [['Negro', '#0c0d0f'], ['Rojo intenso', '#a5121b'], ['Gris Nardo', '#8a8e90'], ['Blanco', '#e9eaea'], ['Azul', '#1d3f8f'], ['Verde racing', '#123c2c'], ['Amarillo', '#d2a504']];
  const FINS = { gloss:'brillante', satin:'satinado', matte:'mate' };
  const TONES = [5, 20, 35, 50, 70];
  const FILMS = {
    eco:{ n:'Económico', p:'Película teñida que oscurece el cristal: la opción de entrada para ganar privacidad y estética.', l:['Privacidad desde el exterior', 'Menos deslumbramiento', 'Con los años el tono puede aclararse'] },
    hd:{ n:'HD', p:'Mayor calidad óptica: vista nítida desde dentro, poco reflejo interior y un color que se mantiene estable.', l:['Visibilidad clara de día y de noche', 'Color estable, no se torna morado', 'Bloquea la mayor parte de los rayos UV'] },
    ceramica:{ n:'Cerámico', p:'Partículas cerámicas no metálicas que rechazan más calor sin oscurecer de más ni interferir con celular o GPS.', l:['Mayor rechazo de calor', 'Confort aun con tonos claros', 'Sin interferencia con señales'] },
    seg:{ n:'Antiasalto', p:'Película de poliéster multicapa, más gruesa, que mantiene unidos los fragmentos si el cristal se rompe.', l:['Retiene los fragmentos del cristal', 'Retrasa un intento de robo', 'Puede combinarse con tono'] }
  };
  /* ========================================================================== */

  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const seg = (p, a, b) => clamp((p - a) / (b - a));
  const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const html = document.documentElement, body = document.body;
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SHEET_MQ = matchMedia('(max-width:860px), (orientation:portrait) and (max-width:1100px)');
  const waURL = (txt) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(txt)}`;
  const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- degradado de Inicio ---------- */
  const fadeControls = $('#heroFadeControls');
  const localFadeEditor = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  if (localFadeEditor) {
    const fade = $('#hfade');
    const height = $('#heroFadeHeight'), width = $('#heroFadeWidth'), intensity = $('#heroFadeIntensity');
    const transition = $('#heroFadeTransition');
    const heightValue = $('#heroFadeHeightValue'), widthValue = $('#heroFadeWidthValue'), intensityValue = $('#heroFadeIntensityValue');
    const transitionValue = $('#heroFadeTransitionValue');
    const storageKey = 'starlight-hero-fade';

    function applyFade(){
      fade.style.setProperty('--hero-fade-height', `${height.value}%`);
      fade.style.setProperty('--hero-fade-width', `${width.value}%`);
      fade.style.setProperty('--hero-fade-transition', `${transition.value}%`);
      fade.style.setProperty('--hero-fade-intensity', intensity.valueAsNumber / 100);
      heightValue.value = `${height.value}%`;
      widthValue.value = `${width.value}%`;
      transitionValue.value = `${transition.value}%`;
      intensityValue.value = `${intensity.value}%`;
    }
    function saveFade(){
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          height:height.valueAsNumber, width:width.valueAsNumber, transition:transition.valueAsNumber, intensity:intensity.valueAsNumber
        }));
      } catch {} // The controls still work when browser storage is unavailable.
    }
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (Number.isFinite(saved?.height)) height.value = saved.height;
      if (Number.isFinite(saved?.width)) width.value = saved.width;
      if (Number.isFinite(saved?.transition)) transition.value = saved.transition;
      if (Number.isFinite(saved?.intensity)) intensity.value = saved.intensity;
    } catch {} // Keep the defaults if the saved settings cannot be read.
    applyFade();

    fadeControls.addEventListener('input', applyFade);
    fadeControls.addEventListener('change', saveFade);
    $('#heroFadeReset').addEventListener('click', () => {
      height.value = height.defaultValue;
      width.value = width.defaultValue;
      transition.value = transition.defaultValue;
      intensity.value = intensity.defaultValue;
      applyFade();
      saveFade();
    });
    fadeControls.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !fadeControls.open) return;
      e.stopPropagation();
      fadeControls.open = false;
      $('summary', fadeControls).focus();
    });
  }

  const st = { color:0, fin:'gloss', tone:1, film:'hd', svc:-1 };

  /* ---------- 3D: esperar al motor ---------- */
  let S = null;
  const loader = $('#loader'), bar = $('.ld-bar i');
  let loaderOff = false;
  function hideLoader(){ if (loaderOff) return; loaderOff = true; loader.classList.add('done'); setTimeout(() => loader.remove(), 900); }
  function no3d(){ body.classList.add('no3d'); hideLoader(); }
  function hook(){
    S = window.S3D;
    if (!S) return false;
    S.onProgress = (p) => bar.style.setProperty('--p', (0.06 + 0.9 * p).toFixed(3));
    S.onReady = () => { bar.style.setProperty('--p', 1); setTimeout(hideLoader, 250); applyStep(true); };
    S.onFail = no3d;
    S.onSplit = moveSplit;
    if (S.failed) no3d();
    if (S.ready) S.onReady();
    /* the car can't be dragged anymore: the camera is directed by the page */
    applyStep(true);
    return true;
  }
  setTimeout(() => { if (!S || !S.ready) hideLoader(); }, 25000);   // conexión lenta: se muestra la página y el carro aparece cuando llegue
  function wait(t){ if (hook()) return; if (window.__ENGINE_FAIL) { no3d(); return; } if (t > 600) { no3d(); return; } setTimeout(() => wait(t + 1), 100); }
  addEventListener('error', (e) => { if (e.target && e.target.tagName === 'SCRIPT' && /three|engine/.test(e.target.src || '')) no3d(); }, true);

  /* ---------- pasos ---------- */
  const steps = [$('#inicio'), ...$$('.step')].map((el) => ({
    el, card:$('.card', el), shot:el.dataset.shot || 'hero', fx:el.dataset.fx || 'clean', split:el.dataset.split || '',
    chap:el.closest('[data-chap]'), dur:DUR[el.dataset.fx] || 0, bottom:el.dataset.layout === 'bottom'
  }));
  const N = steps.length;
  $$('.prog').forEach((p) => { const n = +p.dataset.of, a = +p.dataset.at;
    p.innerHTML = Array.from({ length:n }, (_, i) => `<i class="${i < a ? 'on' : ''}"></i>`).join('') + `<span>Paso ${a} de ${n}</span>`; });
  /* "ver de nuevo" en los pasos que se animan solos */
  steps.forEach((s, i) => { if (!s.dur || !s.card) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'replay';
    b.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M12 1.5v3h-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>Ver de nuevo';
    b.addEventListener('click', () => { if (cur === i) { tl.t0 = performance.now(); tl.done = false; b.classList.remove('on'); } });
    s.card.appendChild(b); s.replay = b; });
  steps.forEach((s) => { if (!s.card) return; [...s.card.children].forEach((c, i) => c.style.setProperty('--i', Math.min(i, 9))); });

  /* ---------- efectos por paso (p = avance de la animación del paso, 0..1) ---------- */
  function fxFor(name, p){
    switch (name) {
      case 'svc': return Object.assign({ labels:'svc' }, st.svc >= 0 ? SVC_PREV[st.svc].fx : {});
      case 'det': return { dirt:1 };
      case 'wash': return { dirt:1, wash:1, washP:p };
      case 'polish': return { swirl:1, swirlX:0, lamp:'hood', labels:'polish' };
      case 'wax': return { wax:1, waxZ:lerp(2.6, -2.6, seg(p, 0.05, 0.95)) };
      case 'interior': return { door:1, cabin:1 };
      case 'engine': return { lamp:'rear' };
      case 'ppf': return { film:1, clear:1, pkg:'hood', filmZ:lerp(2.08, 0.55, ease(seg(p, 0.02, 0.26))), squee:seg(p, 0.3, 0.72), rocks:p > 0.76 ? 1 : 0 };
      case 'bikini': case 'frontal': case 'cover': return { film:1, pkg:name, filmZ:lerp(2.3, -2.6, seg(p, 0, 0.85)), labels:name };
      case 'color': return { color:COLORS[st.color][1], finish:st.fin };
      case 'ceramic': return { gloss:1 };
      case 'beads': return { rain:1, gloss:0.5 };
      case 'beadsplit': return { rainSplit:1 };
      case 'tint': return { split:'tint', vlt:TONES[st.tone] };
      case 'lamp': return { mica:1, split:'lamp' };
      case 'lampproc': {
        const frost = p < 0.22 ? 0 : p < 0.48 ? seg(p, 0.22, 0.38) : p < 0.74 ? 1 - seg(p, 0.5, 0.7) : 0;
        return { mica:1, frost, micaClean:seg(p, 0.3, 0.46), gloss:p > 0.74 ? 0.4 : 0, _stage:p < 0.22 ? 0 : p < 0.48 ? 1 : p < 0.74 ? 2 : 3 };
      }
      case 'pdr': {
        const dent = p < 0.16 ? 1 : p < 0.84 ? 1 - seg(p, 0.16, 0.84) : 0;
        return { dent, push:p > 0.16 && p < 0.84 ? 1 : 0, pdrEnv:1, labels:'pdr', _stage:p < 0.16 ? 0 : p < 0.84 ? 1 : 2 };
      }
      default: return {};
    }
  }

  /* ---------- estado de la presentación ---------- */
  const rail = $('#rail'), splitEl = $('#split'), pbar = $('#pbar');
  const lb = $('#lb'), fig = $('#lbFig'), menu = $('#menu'), menuBtn = $('#menuBtn');
  let cur = 0, busy = false, lastFx = '', layoutKey = '', studioOn = false;
  const cam = { a:'hero', b:'hero', f:0, from:0, to:0, t0:0, dur:0, run:false, now:'hero' };
  function camTo(shot, dur){ if (!S || cam.now === shot) return; cam.a = cam.run && cam.f > 0.5 ? cam.b : cam.now; cam.b = shot; cam.now = shot; cam.from = 0; cam.to = 1; cam.t0 = performance.now(); cam.dur = dur; cam.run = true; }   // camera tween between two shots
  const tl = { t0:0, done:true };                                                 // the current step's own animation
  function setLayout(card){
    if (!S) return;
    let col = 0.38, sheet = 0.44, bottom = 0;
    const st0 = steps[cur];
    if (st0 && st0.bottom && !SHEET_MQ.matches) {
      const list = $('.svc2', st0.el), hd = $('.svc-head', st0.el);
      bottom = clamp(((list ? list.getBoundingClientRect().height : 160) + 60) / innerHeight, 0.15, 0.45); col = 0;
      if (hd && innerWidth > 900) col = 0.26;   /* the car moves a little to the right, the title gets clear space on the left */
    } else if (SHEET_MQ.matches) {
      const h = card ? card.getBoundingClientRect().height : innerHeight * 0.4;
      sheet = clamp((h + 36) / innerHeight, 0.3, 0.62);
    } else {
      const w = card ? card.getBoundingClientRect().width : 440, gut = parseFloat(getComputedStyle(html).getPropertyValue('--gut')) || 56;
      col = clamp((w + gut * 1.6) / innerWidth, 0.25, 0.5);
    }
    const k = col.toFixed(3) + '|' + sheet.toFixed(3) + '|' + bottom.toFixed(3);
    if (k !== layoutKey) { layoutKey = k; S.setLayout(col, sheet, bottom); html.style.setProperty('--sheet', (sheet * 100).toFixed(1)); html.style.setProperty('--bot', (bottom * 100).toFixed(1)); }
    body.classList.toggle('lay-bottom', bottom > 0);
  }
  function progressOf(){ const s = steps[cur]; if (!s.dur || REDUCED) return 1; return clamp((performance.now() - tl.t0) / (s.dur * 1000)); }
  function pushFx(force){
    if (!S) return;
    const s = steps[cur], p = progressOf(), fx = fxFor(s.fx, p), key = JSON.stringify(fx);
    if (key !== lastFx || force) { lastFx = key; S.fx(fx); }
    if (fx._stage !== undefined) { const list = s.fx === 'pdr' ? $('#dentStages') : $('#lampStages'); if (list) $$('li', list).forEach((li, i) => li.classList.toggle('on', i <= fx._stage)); }
    if (s.dur && p >= 1 && !tl.done) { tl.done = true; if (s.replay) s.replay.classList.add('on'); }
  }
  /* everything the engine needs for the current step (also after the engine arrives / the studio closes) */
  function applyStep(snap){
    if (!S) return;
    const s = steps[cur];
    if (snap) { cam.run = false; cam.now = s.shot; cam.a = cam.b = s.shot; cam.f = 0; S.view(s.shot, s.shot, 0); S.snap(); }
    pushFx(true); layoutKey = ''; setLayout(s.card);
  }
  /* one loop drives the camera tween and the step animations (nothing hangs off scroll events) */
  function tick(now){
    requestAnimationFrame(tick);
    if (!S || studioOn) return;
    if (cam.run) { const t = clamp((now - cam.t0) / cam.dur); cam.f = lerp(cam.from, cam.to, ease(t)); S.view(cam.a, cam.b, cam.f);
      if (t >= 1) { cam.run = false; if (cam.to >= 1) { cam.a = cam.b; cam.f = 0; S.view(cam.a, cam.a, 0); } } }
    if (steps[cur].dur && !tl.done) pushFx(false);
  }
  requestAnimationFrame(tick);

  function markUI(){
    const s = steps[cur];
    body.classList.toggle('at-hero', cur === 0);
    fadeControls.hidden = !localFadeEditor || cur !== 0;
    if (fadeControls.hidden) fadeControls.open = false;
    body.classList.toggle('has-split', !!s.split);
    if (s.split) { const [l, r] = s.split.split('|'); $('#splitL').textContent = l; $('#splitR').textContent = r; if (s.fx === 'tint') tintUI(); if (S) S.resetSplit(); }
    railMark(s.chap);
    const cc = $('#chapterCaption');
    if (cc) cc.textContent = String(cur + 1).padStart(2, '0') + ' / ' + (s.chap?.dataset.chap || 'Inicio');
    const prevButton = $('#chapterPrev'), nextButton = $('#chapterNext');
    if (prevButton) prevButton.disabled = cur === 0;
    if (nextButton) nextButton.disabled = cur === N - 1;
    pbar.style.setProperty('--pb', (cur / (N - 1)).toFixed(4));
    rail.style.setProperty('--railo', cur > 0 ? 1 : 0);
    if (s.replay) s.replay.classList.remove('on');
  }
  /* go to step i; the text slides the way the page goes; fromF: where a finger drag left the camera */
  function go(i, opt = {}){
    i = clamp(i, 0, N - 1) | 0;
    if (i === cur && !opt.force) return;
    if (busy && !opt.force) return;
    const pi = cur, prev = steps[pi], nx = steps[i], dir = i >= pi ? 1 : -1;
    closeLB(); setMenu(false);
    prev.el.style.setProperty('--dir', dir); nx.el.style.setProperty('--dir', dir);
    if (prev !== nx) { prev.el.classList.remove('is-on'); prev.el.classList.add('is-out'); setTimeout(() => prev.el.classList.remove('is-out'), 450); }
    if (prev.card) { prev.card.classList.remove('drag'); prev.card.style.transform = ''; prev.card.style.opacity = ''; setTimeout(() => { prev.card.scrollTop = 0; }, 400); }
    cur = i; nx.el.classList.add('is-on'); cam.now = nx.shot; if (st.svc >= 0) { st.svc = -1; svcMark(-1); }
    markUI();
    try { history.replaceState(null, '', '#' + (nx.chap && nx.chap.id ? nx.chap.id : 'inicio')); } catch (e) {}
    const far = Math.abs(i - pi) > 3 || opt.instant || REDUCED;
    if (S) {
      if (S.resetDrag) S.resetDrag();
      if (far) { cam.run = false; cam.a = cam.b = nx.shot; cam.f = 0; S.view(nx.shot, nx.shot, 0); if (opt.instant) S.snap(); }
      else { cam.a = opt.fromShot || prev.shot; cam.b = nx.shot; cam.from = opt.fromF || 0; cam.to = 1; cam.t0 = performance.now(); cam.dur = 1250 * (1 - cam.from * 0.6); cam.run = true; }
    }
    /* the step's own animation starts once the camera has mostly arrived */
    tl.t0 = performance.now() + (far ? 300 : 900); tl.done = !nx.dur;
    lastFx = ''; pushFx(true);
    requestAnimationFrame(() => setLayout(nx.card));
    busy = true; setTimeout(() => { busy = false; }, opt.instant ? 0 : 820);
  }
  const step = (d) => { if (!busy) go(cur + d); };
  $('#chapterPrev')?.addEventListener('click', () => step(-1));
  $('#chapterNext')?.addEventListener('click', () => step(1));

  /* ---------- entrada: rueda, teclas, táctil ---------- */
  function canScrollInside(el, dy){
    const sc = el && el.closest && el.closest('.card'); if (!sc || sc.closest('.hero')) return false;
    if (sc.scrollHeight <= sc.clientHeight + 2) return false;
    return dy > 0 ? sc.scrollTop + sc.clientHeight < sc.scrollHeight - 2 : sc.scrollTop > 2;
  }
  const blocked = () => studioOn || !lb.hidden || !menu.hidden;
  // Cada gesto del mouse puede avanzar un capítulo. Una pausa temporal reemplaza
  // el bloqueo "quiet" anterior, que se mantenía activo durante un scroll continuo.
  let wheelAccum = 0, lastWheelAt = 0, lastWheelStepAt = -2000;
  addEventListener('wheel', (e) => {
    if (blocked() || e.ctrlKey || e.metaKey || fadeControls.contains(e.target)) return;
    if (canScrollInside(e.target, e.deltaY) && !(steps[cur].fx === 'svc' && !SHEET_MQ.matches)) {
      wheelAccum = 0; return;
    }
    e.preventDefault();
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || Math.abs(e.deltaY) < 0.5) return;
    const now = performance.now();
    if (now - lastWheelAt > 220) wheelAccum = 0;
    lastWheelAt = now;
    if (busy || now - lastWheelStepAt < 950) { wheelAccum = 0; return; }
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaMode === 2 ? e.deltaY * innerHeight : e.deltaY;
    wheelAccum += dy;
    if (Math.abs(wheelAccum) >= 26) {
      const direction = Math.sign(wheelAccum);
      wheelAccum = 0;
      lastWheelStepAt = now;
      step(direction);
    }
  }, { passive:false });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (!menu.hidden) setMenu(false); closeLB(); return; }
    if (blocked() || fadeControls.contains(e.target) || (e.target.closest && e.target.closest('input,textarea,select,[contenteditable]'))) return;
    if (['ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); step(1); }
    else if (['ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); step(-1); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(N - 1); }
  });
  /* touch: a vertical swipe follows the finger (text + camera); release commits past 1/4 or on a flick */
  let tsx = 0, tsy = 0, tEl = null, sw = null, multi = false;
  addEventListener('touchstart', (e) => {
    if (e.touches.length > 1) { multi = true; sw = null; return; }
    multi = false; const t = e.touches[0]; tsx = t.clientX; tsy = t.clientY; tEl = e.target; sw = null;
  }, { passive:true });
  addEventListener('touchmove', (e) => {
    if (blocked() || multi || !tEl) return;
    if (tEl.closest('.split,.vlt,#studio,#heroFadeControls,.gal,.svc2,.lightbox,.menu')) return;          // controls with their own drag
    const t = e.touches[0], dx = t.clientX - tsx, dy = t.clientY - tsy;
    if (!sw) {
      if (Math.abs(dy) < 8 || Math.abs(dy) < Math.abs(dx) * 1.15) return;
      if (canScrollInside(tEl, -dy)) { tEl = null; return; }                    // the text scrolls first
      if (busy) return;
      const d = dy < 0 ? 1 : -1, j = cur + d;
      sw = { d, j:(j >= 0 && j < N) ? j : -1, p:0, ly:t.clientY, lt:performance.now(), v:0, card:steps[cur].card };
      if (sw.card) sw.card.classList.add('drag');
    }
    if (e.cancelable) e.preventDefault();
    const now = performance.now(), raw = -dy * sw.d / (innerHeight * 0.5);
    sw.p = sw.j >= 0 ? clamp(raw) : clamp(raw * 0.2, 0, 0.06);
    sw.v = 0.7 * sw.v + 0.3 * ((sw.ly - t.clientY) * sw.d / Math.max(1, now - sw.lt)); sw.ly = t.clientY; sw.lt = now;
    if (sw.card) { sw.card.style.transform = `translate3d(0,${(-sw.d * sw.p * 80).toFixed(1)}px,0)`; sw.card.style.opacity = String(Math.max(0, 1 - sw.p * 1.6)); }
    if (sw.j >= 0 && S) { cam.run = false; cam.a = steps[cur].shot; cam.b = steps[sw.j].shot; cam.f = sw.p * 0.8; S.view(cam.a, cam.b, cam.f); }
  }, { passive:false });
  addEventListener('touchend', () => {
    if (!sw) { tEl = null; return; }
    const s = sw; sw = null; tEl = null;
    const commit = s.j >= 0 && (s.p > 0.25 || (s.v > 0.35 && s.p > 0.04));
    if (commit) go(s.j, { fromF:cam.f, fromShot:steps[cur].shot });
    else {
      if (s.card) { const c = s.card; c.classList.remove('drag'); c.style.transition = 'transform .45s cubic-bezier(.2,.8,.2,1), opacity .45s'; c.style.transform = ''; c.style.opacity = '';
        setTimeout(() => { c.style.transition = ''; }, 480); }
      if (S && s.j >= 0) { cam.a = steps[cur].shot; cam.b = steps[s.j].shot; cam.from = cam.f; cam.to = 0; cam.t0 = performance.now(); cam.dur = 450; cam.run = true; }
    }
  });
  addEventListener('touchcancel', () => { if (sw && sw.card) { sw.card.classList.remove('drag'); sw.card.style.transform = ''; sw.card.style.opacity = ''; } sw = null; tEl = null; });

  let rzT = 0;
  addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => { layoutKey = ''; setLayout(steps[cur].card); }, 100); });

  /* ---------- índice lateral, menú y enlaces ---------- */
  const chaps = $$('[data-chap]').filter((c) => c.id !== 'inicio');
  rail.innerHTML = chaps.map((c) => `<a href="#${c.id}"><span>${c.dataset.chap}</span><i></i></a>`).join('');
  function railMark(ch){
    $$('a', rail).forEach((a) => a.classList.toggle('on', !!ch && a.getAttribute('href') === '#' + ch.id));
    $$('#menu a').forEach((a) => { if (ch && a.getAttribute('href') === '#' + ch.id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }
  function setMenu(o){ menu.hidden = !o; menuBtn.setAttribute('aria-expanded', String(o)); $('#exploreBtn')?.setAttribute('aria-expanded', String(o)); }
  menuBtn.addEventListener('click', () => setMenu(menu.hidden));
  const exploreBtn = $('#exploreBtn');
  exploreBtn?.addEventListener('click', () => setMenu(menu.hidden));
  const idxOf = (id) => { if (id === 'inicio') return 0; const el = document.getElementById(id); if (!el) return -1;
    return steps.findIndex((s) => s.el === el || el.contains(s.el)); };
  function goTo(id, instant){ const k = idxOf(id); if (k < 0) return; setMenu(false); go(k, { force:true, instant }); }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]'); if (!a) return;
    const id = a.getAttribute('href').slice(1); if (!id) return;
    e.preventDefault();
    if (a.dataset.book) book(a.dataset.book); else goTo(id);
  });
  addEventListener('hashchange', () => { const id = location.hash.slice(1), k = id ? idxOf(id) : -1; if (k >= 0 && (steps[cur].chap || {}).id !== id && k !== cur) goTo(id); });

  /* ---------- Servicios: vista previa al pasar el cursor (tarjetas y etiquetas sobre el carro) ---------- */
  let svcT = 0;
  function svcMark(i){ $$('#svcList a').forEach((a) => a.classList.toggle('hot', +a.dataset.svc === i)); $$('#labels .lbl3.go').forEach((l) => l.classList.toggle('hot', +l.dataset.i === i)); $('#labels').classList.toggle('focus', i >= 0); }
  function svcPreview(i){
    clearTimeout(svcT);
    if (steps[cur].fx !== 'svc' || i === st.svc) return;
    svcT = setTimeout(() => { st.svc = i; svcMark(i); camTo(i >= 0 ? SVC_PREV[i].shot : steps[cur].shot, i >= 0 ? 1100 : 1000); pushFx(true); }, i >= 0 ? 90 : 320);
  }
  { const list = $('#svcList');
    list.addEventListener('pointerover', (e) => { const a = e.target.closest('a[data-svc]'); if (a && e.pointerType === 'mouse') svcPreview(+a.dataset.svc); });
    list.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') svcPreview(-1); });
    list.addEventListener('focusin', (e) => { const a = e.target.closest('a[data-svc]'); if (a) svcPreview(+a.dataset.svc); });
    const lw = $('#labels');
    lw.addEventListener('pointerover', (e) => { const l = e.target.closest('.lbl3.go'); if (l && e.pointerType === 'mouse') svcPreview(+l.dataset.i); });
    lw.addEventListener('pointerout', (e) => { const l = e.target.closest('.lbl3.go'); if (l && !l.contains(e.relatedTarget) && e.pointerType === 'mouse') svcPreview(-1); });
    lw.addEventListener('click', (e) => { const l = e.target.closest('.lbl3.go'); if (l) { e.preventDefault(); goTo(l.dataset.go.slice(1)); } }); }

  /* ---------- antes / después ---------- */
  function moveSplit(x){ if (x < 0) return; splitEl.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`; }
  { const knob = $('.knob', splitEl); let drag = false;
    knob.addEventListener('pointerdown', (e) => { drag = true; knob.setPointerCapture(e.pointerId); e.preventDefault(); });
    knob.addEventListener('pointermove', (e) => { if (!drag || !S) return; const x = clamp(e.clientX, 24, innerWidth - 24); S.setSplit(x, true); moveSplit(x); });
    const up = () => { drag = false; }; knob.addEventListener('pointerup', up); knob.addEventListener('pointercancel', up); }

  /* ---------- PPF de color ---------- */
  const sws = $('#swatches');
  sws.innerHTML = COLORS.map(([n, c], i) => `<button type="button" role="radio" aria-checked="${i === 0}" aria-label="${n}" style="--c:${c}" data-i="${i}"></button>`).join('');
  const cfgName = () => { $('#cfgName').textContent = `${COLORS[st.color][0]}, ${FINS[st.fin]}`; };
  sws.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; st.color = +b.dataset.i;
    $$('button', sws).forEach((x) => x.setAttribute('aria-checked', String(x === b))); cfgName(); pushFx(true); });
  $('#finishes').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; st.fin = b.dataset.fin;
    $$('#finishes button').forEach((x) => x.setAttribute('aria-checked', String(x === b))); cfgName(); pushFx(true); });
  cfgName();

  /* ---------- polarizado ---------- */
  const vlt = $('#vlt');
  function tintUI(){ const v = TONES[st.tone], f = FILMS[st.film];
    $('#vltVal').textContent = v + '%'; $('#vltNote').textContent = `Deja pasar el ${v} % de la luz visible.`;
    if (steps[cur] && steps[cur].fx === 'tint') $('#splitR').textContent = `${f.n}, ${v} %`;
    $('#filmInfo').innerHTML = `<p>${f.p}</p><ul>${f.l.map((x) => `<li>${x}</li>`).join('')}</ul>`; }
  vlt.addEventListener('input', () => { st.tone = +vlt.value; tintUI(); pushFx(true); });
  $('#films').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; st.film = b.dataset.f;
    $$('#films button').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', String(x === b)); }); tintUI(); });
  tintUI();

  /* ---------- galería ---------- */
  const gal = $('#gal');
  gal.innerHTML = CONFIG.work.map((w, i) => `<button type="button" data-i="${i}" aria-label="Ver foto: ${w.title}"><img src="${w.src}" alt="${w.title}" loading="lazy" decoding="async" width="640" height="800"><span>${w.title}</span></button>`).join('');
  let lbI = 0, lbFrom = null;
  function showLB(i){ lbI = (i + CONFIG.work.length) % CONFIG.work.length; const w = CONFIG.work[lbI];
    fig.innerHTML = `<img src="${w.src}" alt="${w.title}"><figcaption>${w.title}</figcaption>`; }
  function openLB(i, from){ lbFrom = from; showLB(i); lb.hidden = false; $('.lb-x', lb).focus(); }
  function closeLB(){ if (lb.hidden) return; lb.hidden = true; if (lbFrom) lbFrom.focus({ preventScroll:true }); }
  gal.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) openLB(+b.dataset.i, b); });
  lb.addEventListener('click', (e) => { if (e.target === lb || e.target.closest('.lb-x')) closeLB(); else if (e.target.closest('.prev')) showLB(lbI - 1); else if (e.target.closest('.next')) showLB(lbI + 1); });
  addEventListener('keydown', (e) => { if (lb.hidden) return; if (e.key === 'ArrowLeft') showLB(lbI - 1); if (e.key === 'ArrowRight') showLB(lbI + 1); });

  /* ---------- cita por WhatsApp ---------- */
  const chips = $('#chips');
  chips.insertAdjacentHTML('beforeend', CONFIG.chips.map((c) => `<button type="button" aria-pressed="false">${c}</button>`).join(''));
  chips.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); });
  function book(svc){
    if (svc) $$('button', chips).forEach((c) => c.setAttribute('aria-pressed', String(c.textContent === svc)));
    goTo('contacto');
  }
  $('#ctForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const n = $('#fN').value.trim(), car = $('#fA').value.trim(), extra = $('#fM').value.trim();
    const svc = $$('button[aria-pressed=true]', chips).map((c) => c.textContent);
    const txt = `Hola Starlight, soy ${n || '(nombre)'}. Me interesa: ${svc.join(', ') || 'información de sus servicios'}.` + (car ? ` Mi auto: ${car}.` : '') + (extra ? ` ${extra}` : '') + ' ¿Me ayudan con una cita?';
    const w = window.open(waURL(txt), '_blank', 'noopener');
    $('#formMsg').innerHTML = w ? 'Abrimos WhatsApp con tu mensaje. Si no se abrió, escríbenos al <a href="tel:+523335561612">33 3556 1612</a>.'
      : `Tu navegador bloqueó la ventana. <a href="${waURL(txt)}" target="_blank" rel="noopener">Abre WhatsApp aquí</a>.`;
  });

  /* ---------- estudio ---------- */
  if (CONFIG.studio || html.classList.contains('can-studio')) {
    const v = ((document.querySelector('script[src*="app.js"]') || {}).src || '').match(/\?v=\w+/);
    const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = 'css/studio.css' + (v ? v[0] : ''); document.head.appendChild(l);
    const btn = $('#stuOpen'); btn.hidden = false;
    btn.addEventListener('click', () => { if (!S || !S.ready) return; studioOn = true; setMenu(false); S.fx({}); lastFx = ''; body.classList.remove('has-split'); S.studioOpen(); });
    $('#stBack').addEventListener('click', () => { if (!S) return; S.studioClose(); studioOn = false; markUI(); applyStep(false); S.view(steps[cur].shot, steps[cur].shot, 0); });
  }

  /* ---------- arranque ---------- */
  steps[0].el.classList.add('is-on'); markUI();
  { const id = location.hash.slice(1), k = id ? idxOf(id) : -1; if (k > 0) go(k, { force:true, instant:true }); }
  wait(0);
})();
