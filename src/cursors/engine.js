/* ============================================================
   CURSOR LAB — demo runtime
   Tiny scoped harness so every catalogue entry can run inside
   its own tile without touching the document cursor.
   ============================================================ */
(function (global) {
  'use strict';

  var lerp  = function (a, b, n) { return (1 - n) * a + n * b; };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var rand  = function (a, b) { return a + Math.random() * (b - a); };
  var dist  = function (x1, y1, x2, y2) { var dx = x2 - x1, dy = y2 - y1; return Math.sqrt(dx * dx + dy * dy); };

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* Layer that every effect draws into. Sits above the stage content. */
  function layer(stage) {
    var l = el('div', 'fx');
    l.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:5';
    stage.appendChild(l);
    return l;
  }

  /* DPR-aware canvas bound to the stage box. */
  function canvas(stage, opts) {
    opts = opts || {};
    var cv = el('canvas');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
    if (opts.blend) cv.style.mixBlendMode = opts.blend;
    if (opts.filter) cv.style.filter = opts.filter;
    cv.style.zIndex = opts.z == null ? 4 : opts.z;
    stage.appendChild(cv);
    var ctx = cv.getContext('2d');
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    function fit() {
      var r = stage.getBoundingClientRect();
      cv.width = Math.max(1, Math.round(r.width * dpr));
      cv.height = Math.max(1, Math.round(r.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    fit();
    return { cv: cv, ctx: ctx, fit: fit, dpr: dpr };
  }

  /*  mount(stage, handlers)
      handlers: { setup, enter, move, leave, down, up, tick, destroy, settle }
      state:    { x, y, px, py, vx, vy, w, h, inside, down, layer }            */
  function mount(stage, h) {
    h = h || {};
    var s = { stage: stage, x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0, w: 0, h: 0, inside: false, down: false, t: 0 };
    var cleanups = [];

    function measure() {
      var r = stage.getBoundingClientRect();
      s.w = r.width; s.h = r.height; s.rect = r;
    }
    measure();
    s.x = s.px = s.w / 2;
    s.y = s.py = s.h / 2;
    /* seed client coords too: a poke() before the first pointermove would
       otherwise hand effects undefined, and one NaN poisons a lerp forever */
    s.clientX = (s.rect ? s.rect.left : 0) + s.x;
    s.clientY = (s.rect ? s.rect.top : 0) + s.y;

    var ro = new ResizeObserver(function () { measure(); if (h.resize) h.resize(s); });
    ro.observe(stage);

    var rafId = 0, running = false, stopTimer = 0;

    function frame(t) {
      if (!running) return;
      s.t = t;
      if (h.tick) h.tick(s, t);
      rafId = requestAnimationFrame(frame);
    }
    function start() { if (running || !h.tick) return; running = true; rafId = requestAnimationFrame(frame); }
    function stop() { running = false; cancelAnimationFrame(rafId); }

    function pos(e) {
      var r = stage.getBoundingClientRect();
      s.px = s.x; s.py = s.y;
      s.x = e.clientX - r.left;
      s.y = e.clientY - r.top;
      s.vx = s.x - s.px;
      s.vy = s.y - s.py;
      s.clientX = e.clientX; s.clientY = e.clientY;
    }

    function onMove(e) { pos(e); if (h.move) h.move(s, e); }
    function onEnter(e) {
      measure(); s.inside = true; pos(e);
      stage.classList.add('is-live');
      clearTimeout(stopTimer);
      if (h.enter) h.enter(s, e);
      start();
    }
    function onLeave(e) {
      s.inside = false;
      stage.classList.remove('is-live');
      if (h.leave) h.leave(s, e);
      clearTimeout(stopTimer);
      stopTimer = setTimeout(stop, h.settle == null ? 1400 : h.settle);
    }
    function onDown(e) { s.down = true; pos(e); if (h.down) h.down(s, e); }
    function onUp(e) { s.down = false; if (h.up) h.up(s, e); }

    stage.addEventListener('pointermove', onMove, { passive: true });
    stage.addEventListener('pointerenter', onEnter);
    stage.addEventListener('pointerleave', onLeave);
    stage.addEventListener('pointerdown', onDown);
    global.addEventListener('pointerup', onUp);

    if (h.setup) h.setup(s);

    var handle = {
      state: s,
      push: function (fn) { cleanups.push(fn); },
      /* Run one frame on demand. The loop only spins while the pointer is
         over the stage, so a slider dragged in the inspector would otherwise
         change nothing on screen until you moved back over the preview. */
      poke: function () {
        if (!h.tick) return;
        measure();
        h.tick(s, performance.now());
      },
      destroy: function () {
        if (stage.__fx === handle) stage.__fx = null;
        stop(); ro.disconnect();
        clearTimeout(stopTimer);
        stage.removeEventListener('pointermove', onMove);
        stage.removeEventListener('pointerenter', onEnter);
        stage.removeEventListener('pointerleave', onLeave);
        stage.removeEventListener('pointerdown', onDown);
        global.removeEventListener('pointerup', onUp);
        stage.classList.remove('is-live');
        if (h.destroy) h.destroy(s);
        cleanups.forEach(function (f) { try { f(); } catch (err) {} });
        Array.prototype.slice.call(stage.querySelectorAll('.fx, canvas, svg[data-fx]')).forEach(function (n) { n.remove(); });
      }
    };
    stage.__fx = handle;
    return handle;
  }

  /* Shared CSS injector — effects that need real stylesheet rules. */
  var injected = {};
  function style(id, css) {
    if (injected[id]) return;
    injected[id] = true;
    var t = document.createElement('style');
    t.id = 'fx-' + id;
    t.textContent = css;
    document.head.appendChild(t);
  }

  /* ── paint ────────────────────────────────────────────────
     A paint value is either a hex string or {a, b, on, angle}.
     `on` switches the second stop in; every effect then samples it
     at its own natural 0..1 (tail position, particle life, field
     strength, node index), which is cheaper and reads better than
     a real canvas gradient.                                      */

  function triplet(hex) {
    var h = String(hex || '#ffffff').replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) n = 0xffffff;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgb(hex) { return triplet(hex).join(','); }
  function rgba(hex, a) { return 'rgba(' + rgb(hex) + ',' + a + ')'; }

  function hex2(n) { var s = Math.round(clamp(n, 0, 255)).toString(16); return s.length < 2 ? '0' + s : s; }
  function mix(a, b, t) {
    var A = triplet(a), B = triplet(b);
    t = clamp(t, 0, 1);
    return '#' + hex2(A[0] + (B[0] - A[0]) * t) + hex2(A[1] + (B[1] - A[1]) * t) + hex2(A[2] + (B[2] - A[2]) * t);
  }

  function pnorm(v) {
    if (!v) return { a: '#ffffff', b: '#ffffff', on: false, angle: 90 };
    if (typeof v === 'string') return { a: v, b: v, on: false, angle: 90 };
    return { a: v.a || '#ffffff', b: v.b || v.a || '#ffffff', on: !!v.on, angle: v.angle == null ? 90 : v.angle };
  }
  /* colour at position t (0..1) along the paint */
  function pat(v, t) { var p = pnorm(v); return p.on ? mix(p.a, p.b, t == null ? 0 : t) : p.a; }
  /* the workhorse: rgba() at position t with alpha a */
  function pc(v, t, a) { return rgba(pat(v, t), a == null ? 1 : a); }
  /* CSS background for DOM cursors — a real gradient when enabled */
  function pcss(v) {
    var p = pnorm(v);
    return p.on ? 'linear-gradient(' + p.angle + 'deg,' + p.a + ',' + p.b + ')' : p.a;
  }
  /* JS source for a `tint(t, a)` helper, pasted into generated snippets
     so copied code carries the gradient the user actually tuned */
  function tintjs(v) {
    var p = pnorm(v);
    if (!p.on) return 'const tint = (t, a) => `rgba(' + rgb(p.a) + ', ${a})`;';
    return 'const CA = [' + rgb(p.a) + '], CB = [' + rgb(p.b) + '];\n' +
      'const tint = (t, a) =>\n' +
      '  `rgba(${CA.map((v, i) => Math.round(v + (CB[i] - v) * t)).join(\',\')}, ${a})`;';
  }

  /* one-line label for the inspector readout */
  function plabel(v) {
    var p = pnorm(v);
    return p.on ? p.a.toUpperCase() + ' → ' + p.b.toUpperCase() : p.a.toUpperCase();
  }

  global.FX = {
    lerp: lerp, clamp: clamp, rand: rand, dist: dist,
    el: el, layer: layer, canvas: canvas, mount: mount, style: style,
    rgb: rgb, rgba: rgba, mix: mix,
    pnorm: pnorm, pat: pat, pc: pc, pcss: pcss, plabel: plabel, tintjs: tintjs
  };
  global.CURSOR_DB = global.CURSOR_DB || [];
  global.CAT = {
    follow: 'Follow',
    trail: 'Trail',
    reveal: 'Reveal',
    click: 'Click',
    field: 'Field',
    css: 'CSS only'
  };
})(window);
