/* ============================================================
   CURSOR LAB — workbench controller
   catalogue · stage · inspector (+ source drawer)
   ============================================================ */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  var stage = $('#stage');
  var nav = $('#nav');
  var controls = $('#controls');
  var drawer = $('#drawer');
  var langs = $('#langs');
  var codeEl = $('#code');
  var titleEl = $('#iTitle');

  var TAB = 'animated';
  var LANG = 'js';
  var current = null;
  var destroy = null;

  var SEGS = 20;
  /* Nothing palette + the status colours. Monochrome first. */
  var SWATCHES = ['#FFFFFF', '#999999', '#D71921', '#D4A843', '#4A9E5C', '#5B9BF6', '#A78BFA', '#FF6FAE'];

  /* ── syntax highlight ─────────────────────────────────── */
  var KW = 'const|let|var|function|return|if|else|for|of|in|new|class|export|default|import|from|null|undefined|true|false|typeof|while|continue|break|delete|await|async|this';
  var RE = new RegExp(
    '(\\/\\*[\\s\\S]*?\\*\\/|\\/\\/[^\\n]*)' +
    '|("(?:[^"\\\\\\n]|\\\\.)*"|\'(?:[^\'\\\\\\n]|\\\\.)*\'|`(?:[^`\\\\]|\\\\.)*`)' +
    '|(\\b(?:' + KW + ')\\b)' +
    '|(\\b\\d+(?:\\.\\d+)?(?:px|s|ms|deg|%|em|rem)?\\b)' +
    '|([A-Za-z_$][\\w$]*)(?=\\()', 'g');

  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function hl(src) {
    return esc(src).replace(RE, function (m, c, s, k, n, f) {
      if (c) return '<span class="tok-com">' + c + '</span>';
      if (s) return '<span class="tok-str">' + s + '</span>';
      if (k) return '<span class="tok-key">' + k + '</span>';
      if (n) return '<span class="tok-num">' + n + '</span>';
      if (f) return '<span class="tok-fn">' + f + '</span>';
      return m;
    });
  }

  /* ── inline status (no toasts) ────────────────────────── */
  var statusEl = $('#status'), statusTimer;
  function status(text) {
    statusEl.textContent = '[' + text + ']';
    statusEl.classList.add('on');
    clearTimeout(statusTimer);
    statusTimer = setTimeout(function () { statusEl.classList.remove('on'); }, 1600);
  }
  function copyText(text, label) {
    var ok = function () { status(label); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(ok, function () { legacy(text, ok); });
    } else legacy(text, ok);
  }
  function legacy(text, ok) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); ok(); } catch (e) { status('COPY BLOCKED'); }
    ta.remove();
  }

  /* ── dot-matrix scramble: the switch micro-animation ──── */
  var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#/*+-';
  var STILL = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function scramble(el, text) {
    cancelAnimationFrame(el._raf || 0);
    clearTimeout(el._settle);
    el.textContent = text;                 // truth first — never leave garbage
    if (STILL) return;

    var start = performance.now(), dur = 240;
    // hard floor: if rAF is throttled (background tab), the text still lands
    el._settle = setTimeout(function () {
      cancelAnimationFrame(el._raf || 0);
      el.textContent = text;
    }, dur + 80);

    (function step(now) {
      var t = clamp((now - start) / dur, 0, 1);
      if (t >= 1) { el.textContent = text; return; }
      var reveal = t * text.length, out = '';
      for (var i = 0; i < text.length; i++) {
        var c = text[i];
        out += (c === ' ' || i < reveal) ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      el._raf = requestAnimationFrame(step);
    })(start);
  }

  /* ── design entries: scale, cursor value, generated code ── */
  function scaleSvg(svgStr, k) {
    return svgStr.replace(/^(<svg[^>]*?)width="([\d.]+)"([^>]*?)height="([\d.]+)"/,
      function (m, a, w, mid, h) {
        return a + 'width="' + Math.min(128, Math.round(w * k)) + '"' + mid +
          'height="' + Math.min(128, Math.round(h * k)) + '"';
      });
  }
  function encode(s) { return encodeURIComponent(s).replace(/'/g, '%27'); }

  /* white is the "paintable" area of every mono cursor; a gradient gets a
     real <linearGradient> injected and the fills repointed at it */
  var WHITE = /#ffffff\b|#fff\b/gi;
  function tintable(svgStr) { return WHITE.test(svgStr); }
  function tintSvg(svgStr, paint) {
    var pv = FX.pnorm(paint);
    if (!tintable(svgStr)) return svgStr;
    if (!pv.on) return svgStr.replace(WHITE, pv.a);
    var id = 'clt' + Math.random().toString(36).slice(2, 7);
    var defs = '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0.35" y2="1">' +
      '<stop offset="0" stop-color="' + pv.a + '"/><stop offset="1" stop-color="' + pv.b + '"/>' +
      '</linearGradient></defs>';
    return svgStr.replace(WHITE, 'url(#' + id + ')').replace(/(<svg[^>]*>)/, '$1' + defs);
  }
  function renderSvg(e, p) { return scaleSvg(tintSvg(e.svg, p && p.tint), (p && p.scale) || 1); }

  function cursorValue(e, p) {
    var k = (p && p.scale) || 1;
    return 'url("data:image/svg+xml,' + encode(renderSvg(e, p)) + '") ' +
      Math.round(e.hot[0] * k) + ' ' + Math.round(e.hot[1] * k) + ', auto';
  }
  function prettySvg(s) {
    var lines = s.replace(/></g, '>\n<').split('\n'), depth = 0;
    return lines.map(function (line) {
      if (/^<\//.test(line)) depth = Math.max(0, depth - 1);
      var out = new Array(depth + 1).join('  ') + line;
      if (/^<[^/!?]/.test(line) && !/\/>$/.test(line) && !/<\/[a-zA-Z]/.test(line)) depth++;
      return out;
    }).join('\n');
  }
  function pascal(id) { return id.replace(/(^|-)(\w)/g, function (m, a, b) { return b.toUpperCase(); }); }

  function designCode(e, p) {
    var val = cursorValue(e, p), k = p.scale || 1;
    return {
      css:
        '/* ' + e.name + ' · hotspot ' + Math.round(e.hot[0] * k) + ' ' + Math.round(e.hot[1] * k) + ' */\n' +
        '.cursor-' + e.id + ' {\n  cursor: ' + val + ';\n}\n\n' +
        '/* Keep the ", auto" fallback — a browser that rejects the image\n' +
        '   falls back to it instead of showing no cursor at all.\n' +
        '   Anything wider than 128px is ignored outright. */',
      svg: prettySvg(renderSvg(e, p)),
      react:
        'const CURSOR =\n  \'' + val.replace(/'/g, "\\'") + '\';\n\n' +
        'export function ' + pascal(e.id) + 'Zone({ children }) {\n' +
        '  // No listeners, no re-renders — the OS draws it.\n' +
        '  return <div style={{ cursor: CURSOR }}>{children}</div>;\n' +
        '}'
    };
  }

  /* ── data access ──────────────────────────────────────── */
  function list() { return TAB === 'design' ? window.DESIGN_DB : window.ANIM_DB; }
  function paramsOf(e) {
    if (TAB !== 'design') return e.params || [];
    if (!e._params) {
      e._params = [
        { key: 'scale', label: 'Scale', type: 'range', min: 0.5, max: 3, step: 0.1, value: 1, unit: '×', rebuild: true, group: 'SIZE' }
      ];
      /* only offer a tint when the artwork actually has a paintable area */
      if (tintable(e.svg)) {
        e._params.push({
          key: 'tint', label: 'Tint', type: 'paint', rebuild: true, group: 'PAINT',
          value: { a: '#FFFFFF', b: '#5B9BF6', on: false, angle: 90 }
        });
      }
    }
    return e._params;
  }
  function stateOf(e) {
    if (!e._p) {
      e._p = {};
      paramsOf(e).forEach(function (d) {
        /* paint values are objects — clone so entries never share state */
        e._p[d.key] = d.type === 'paint' ? FX.pnorm(d.value) : d.value;
      });
    }
    return e._p;
  }
  function codeOf(e) {
    var p = stateOf(e);
    return TAB === 'design' ? designCode(e, p) : e.code(p);
  }

  /* ── group glyphs (monoline, 1.5px, no fill) ──────────── */
  var GLYPH = {
    Pointer: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M5 2.5l13 6.5-5.6 1.6L10.4 17z"/></svg>',
    Trail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="5" cy="18" r="1.2"/><circle cx="11.5" cy="13" r="2.2"/><circle cx="18.5" cy="7" r="3.2"/></svg>',
    Field: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 6h4M4 12h4M4 18h4M16 6h4M16 12h4M16 18h4M12 4v16"/></svg>'
  };

  /* ── catalogue ────────────────────────────────────────── */
  function buildNav() {
    var items = list(), html = '', last = null, n = 0;
    items.forEach(function (e) {
      if (e.group !== last) { html += '<div class="nav__group">' + e.group + '</div>'; last = e.group; }
      n++;
      var ico = TAB === 'design' ? e.svg : GLYPH[e.group];
      html +=
        '<button class="item" data-id="' + e.id + '" aria-current="false" style="animation-delay:' + (n * 14) + 'ms">' +
        '<span class="item__ico"' + (e.pixel ? ' data-pixel="1"' : '') + '>' + ico + '</span>' +
        '<span class="item__name">' + e.name + '</span>' +
        '<span class="item__idx">' + String(n).padStart(2, '0') + '</span>' +
        '</button>';
    });
    nav.innerHTML = html;
    $('#count').textContent = String(items.length).padStart(2, '0') + ' UNITS';
  }

  /* ── controls ─────────────────────────────────────────── */
  function decimals(step) {
    var s = String(step);
    return s.indexOf('.') > -1 ? s.split('.')[1].length : 0;
  }
  function fmt(d, v) {
    var n = Number(v).toFixed(decimals(d.step));
    return n + (d.unit ? '<em>' + d.unit + '</em>' : '');
  }
  function segHTML(d, v, animate) {
    var on = Math.round(((v - d.min) / (d.max - d.min)) * SEGS);
    var out = '';
    for (var i = 0; i < SEGS; i++) {
      out += '<i class="' + (i < on ? 'on' : '') + '"' +
        (animate ? ' style="animation-delay:' + (i * 8) + 'ms"' : '') + '></i>';
    }
    return '<div class="segbar' + (animate ? ' anim' : '') + '" data-key="' + d.key + '" role="slider" tabindex="0"' +
      ' aria-valuemin="' + d.min + '" aria-valuemax="' + d.max + '" aria-valuenow="' + v + '"' +
      ' aria-label="' + d.label + '">' + out + '</div>';
  }

  function paintHTML(d, v) {
    var pv = FX.pnorm(v);
    return '<div class="paint">' +
      '<div class="swatches">' + SWATCHES.map(function (c) {
        return '<button class="swatch" data-key="' + d.key + '" data-sub="a" data-val="' + c +
          '" aria-pressed="' + (c.toLowerCase() === pv.a.toLowerCase()) +
          '" style="background:' + c + '" aria-label="' + c + '"></button>';
      }).join('') + '</div>' +
      '<div class="paint__row">' +
        '<label class="stop" title="Custom colour"><input type="color" data-key="' + d.key +
          '" data-sub="a" value="' + pv.a + '"><span style="background:' + pv.a + '"></span></label>' +
        '<label class="stop' + (pv.on ? '' : ' is-off') + '" title="Second stop"><input type="color" data-key="' + d.key +
          '" data-sub="b" value="' + pv.b + '"><span style="background:' + pv.b + '"></span></label>' +
        '<button class="chip" data-key="' + d.key + '" data-sub="on" aria-pressed="' + pv.on + '">Gradient</button>' +
      '</div>' +
    '</div>';
  }

  function ctlHTML(d, v) {
    var inner = '', right = '';

    if (d.type === 'range') {
      inner = segHTML(d, v, true);
      right = '<span class="ctl__val">' + fmt(d, v) + '</span>';
    } else if (d.type === 'paint') {
      inner = paintHTML(d, v);
      right = '<span class="ctl__val ctl__val--sm">' + FX.plabel(v) + '</span>';
    } else if (d.type === 'select') {
      inner = '<div class="seg" style="width:100%">' + d.options.map(function (o) {
        return '<button data-key="' + d.key + '" data-val="' + o + '" aria-selected="' + (o === v) +
          '" style="flex:1">' + o + '</button>';
      }).join('') + '</div>';
      /* the readout carries the full value, so the chips can be terse */
      right = '<span class="ctl__val ctl__val--sm">' + v + '</span>';
    } else if (d.type === 'switch') {
      right = '<button class="sw" data-key="' + d.key + '" aria-pressed="' + !!v + '" aria-label="' + d.label + '"></button>';
    } else if (d.type === 'text') {
      inner = '<input class="field" type="text" data-key="' + d.key + '" maxlength="18" value="' +
        String(v).replace(/"/g, '&quot;') + '">';
    }

    return '<div class="ctl" data-ctl="' + d.key + '">' +
      '<div class="ctl__top"><span class="lbl">' + d.label + '</span>' + right + '</div>' +
      inner + '</div>';
  }

  function buildControls() {
    var e = current, p = stateOf(e), defs = paramsOf(e);
    if (!defs.length) {
      controls.innerHTML = '<div class="ctl"><span class="lbl">NO PARAMETERS</span></div>';
      return;
    }
    /* group the params, preserving declaration order */
    var order = [], byGroup = {};
    defs.forEach(function (d) {
      var g = d.group || '';
      if (!byGroup[g]) { byGroup[g] = []; order.push(g); }
      byGroup[g].push(d);
    });

    /* folded by default — opening every accordion on select was the noisiest
       thing on the screen. Choices are remembered per entry once made. */
    if (!e._folds) {
      e._folds = {};
      order.forEach(function (g) { if (g) e._folds[g] = true; });
    }

    controls.innerHTML = order.map(function (g) {
      var rows = byGroup[g].map(function (d) { return ctlHTML(d, p[d.key]); }).join('');
      if (!g) return rows;
      var folded = !!e._folds[g];
      return '<section class="grp' + (folded ? ' is-folded' : '') + '" data-grp="' + g + '">' +
        '<button class="grp__t" data-fold="' + g + '" aria-expanded="' + !folded + '">' +
        '<span class="lbl">' + g + '</span><span class="grp__n">' + byGroup[g].length + '</span>' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>' +
        '</button><div class="grp__b">' + rows + '</div></section>';
    }).join('');
  }

  function setParam(key, raw, sub) {
    var e = current, p = stateOf(e);
    var d = paramsOf(e).filter(function (x) { return x.key === key; })[0];
    if (!d) return;
    var row = $('[data-ctl="' + key + '"]', controls);

    if (d.type === 'paint') {
      var pv = p[key] = FX.pnorm(p[key]);
      if (sub === 'on') pv.on = !!raw;
      else if (sub === 'b') pv.b = raw;
      else { pv.a = raw; if (!pv.on) pv.b = raw; }
      if (row) {
        $('.ctl__val', row).textContent = FX.plabel(pv);
        $$('.swatch', row).forEach(function (b) {
          b.setAttribute('aria-pressed', String(b.getAttribute('data-val').toLowerCase() === pv.a.toLowerCase()));
        });
        var stops = $$('.stop', row);
        stops[0].lastElementChild.style.background = pv.a;
        stops[0].firstElementChild.value = pv.a;
        stops[1].lastElementChild.style.background = pv.b;
        stops[1].firstElementChild.value = pv.b;
        stops[1].classList.toggle('is-off', !pv.on);
        $('.chip', row).setAttribute('aria-pressed', String(pv.on));
      }
      if (d.rebuild || TAB === 'design') remount(); else poke();
      paintCode();
      return;
    }

    var v = d.type === 'range' ? parseFloat(raw) : d.type === 'switch' ? !!raw : raw;
    if (d.type === 'range') v = clamp(v, d.min, d.max);
    if (p[key] === v) return;
    p[key] = v;

    if (row) {
      if (d.type === 'range') {
        $('.ctl__val', row).innerHTML = fmt(d, v);
        var bar = $('.segbar', row);
        var on = Math.round(((v - d.min) / (d.max - d.min)) * SEGS);
        $$('i', bar).forEach(function (seg, i) { seg.classList.toggle('on', i < on); });
        bar.setAttribute('aria-valuenow', v);
      } else if (d.type === 'switch') {
        $('.sw', row).setAttribute('aria-pressed', String(v));
      } else if (d.type === 'color') {
        $('.ctl__val', row).textContent = String(v).toUpperCase();
        $$('.swatch', row).forEach(function (b) {
          b.setAttribute('aria-pressed', String(b.getAttribute('data-val').toLowerCase() === String(v).toLowerCase()));
        });
      } else if (d.type === 'select') {
        $('.ctl__val', row).textContent = v;
        $$('button', row).forEach(function (b) {
          b.setAttribute('aria-selected', String(b.getAttribute('data-val') === v));
        });
      }
    }

    if (d.rebuild || TAB === 'design') remount(); else poke();
    paintCode();
  }

  /* ── mount ────────────────────────────────────────────── */
  /* one frame on demand so inspector edits land immediately */
  function poke() { if (stage.__fx && stage.__fx.poke) stage.__fx.poke(); }

  function remount() {
    if (destroy) { try { destroy(); } catch (err) { } destroy = null; }
    stage.style.cursor = '';
    var e = current, p = stateOf(e);
    if (TAB === 'design') mountDesign(e, p); else mountAnimated(e, p);
  }

  function mountAnimated(e, p) {
    if (e.hideCursor === false) stage.removeAttribute('data-hide');
    else stage.setAttribute('data-hide', '');
    stage.innerHTML = (e.content || '') + '<span class="stage__hint">HOVER TO RUN</span>';
    try { destroy = e.mount(stage, p) || null; }
    catch (err) { console.warn('[cursor lab]', e.id, err); }
  }

  function mountDesign(e, p) {
    stage.removeAttribute('data-hide');
    var k = p.scale || 1;
    stage.innerHTML =
      '<div class="stage__body"><div class="dsp">' +
      '<div class="dsp__art"' + (e.pixel ? ' data-pixel="1"' : '') + '>' + tintSvg(e.svg, p.tint) + '</div>' +
      '<p class="stage__note">HOTSPOT ' + Math.round(e.hot[0] * k) + ' · ' + Math.round(e.hot[1] * k) + '</p>' +
      '</div></div><span class="stage__hint">MOVE · PRESS</span>';
    stage.style.cursor = cursorValue(e, p);

    var art = $('.dsp__art', stage);
    var down = function () { art.classList.add('is-press'); };
    var up = function () { art.classList.remove('is-press'); };
    var live = function () { stage.classList.add('is-live'); };
    var idle = function () { stage.classList.remove('is-live'); };
    stage.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    stage.addEventListener('pointerenter', live);
    stage.addEventListener('pointerleave', idle);

    destroy = function () {
      stage.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      stage.removeEventListener('pointerenter', live);
      stage.removeEventListener('pointerleave', idle);
      stage.classList.remove('is-live');
      stage.style.cursor = '';
    };
  }

  /* ── select ───────────────────────────────────────────── */
  function select(id, scroll) {
    var items = list(), e = null;
    for (var i = 0; i < items.length; i++) if (items[i].id === id) { e = items[i]; break; }
    if (!e) return;
    current = e;

    $$('.item', nav).forEach(function (b) {
      b.setAttribute('aria-current', String(b.getAttribute('data-id') === id));
    });
    if (scroll) {
      var el = $('.item[data-id="' + id + '"]', nav);
      if (el) el.scrollIntoView({ block: 'nearest' });
    }

    $('#iEyebrow').textContent = e.group + ' / ' + String(items.indexOf(e) + 1).padStart(2, '0');
    scramble(titleEl, e.name.toUpperCase());
    $('#iDesc').textContent = e.desc;

    buildControls();
    remount();
    buildLangs();
    paintCode();
    document.body.classList.remove('nav-open');
  }

  /* ── source drawer ────────────────────────────────────── */
  function buildLangs() {
    var code = codeOf(current);
    var order = TAB === 'design' ? ['css', 'svg', 'react'] : ['js', 'react', 'css'];
    var keys = order.filter(function (k) { return code[k]; });
    if (keys.indexOf(LANG) === -1) LANG = keys[0];
    langs.innerHTML = keys.map(function (k) {
      return '<button role="tab" data-lang="' + k + '" aria-selected="' + (k === LANG) + '">' + k + '</button>';
    }).join('');
  }
  function paintCode() {
    if (!current) return;
    var code = codeOf(current);
    if (!code[LANG]) { buildLangs(); code = codeOf(current); }
    codeEl.innerHTML = hl(code[LANG]);
    $('#drawerTitle').textContent = current.name.toUpperCase() + ' — SOURCE';
    $$('button', langs).forEach(function (b) {
      b.setAttribute('aria-selected', String(b.getAttribute('data-lang') === LANG));
    });
  }
  function setDrawer(on) {
    drawer.classList.toggle('open', on);
    drawer.setAttribute('aria-hidden', String(!on));
    if (on) $('.drawer__body', drawer).scrollTop = 0;
  }

  /* ── tabs ─────────────────────────────────────────────── */
  function setTab(t) {
    if (t === TAB) return;
    TAB = t;
    LANG = t === 'design' ? 'css' : 'js';
    $$('button', $('#tabs')).forEach(function (b) {
      b.setAttribute('aria-selected', String(b.getAttribute('data-tab') === t));
    });
    buildNav();
    select(list()[0].id, true);
  }

  /* ── segbar dragging ──────────────────────────────────── */
  function barValue(d, bar, clientX) {
    var r = bar.getBoundingClientRect();
    var ratio = clamp((clientX - r.left) / r.width, 0, 1);
    var steps = Math.round((d.min + ratio * (d.max - d.min) - d.min) / d.step);
    return +(d.min + steps * d.step).toFixed(6);
  }
  controls.addEventListener('pointerdown', function (ev) {
    var bar = ev.target.closest('.segbar');
    if (!bar) return;
    var key = bar.getAttribute('data-key');
    var d = paramsOf(current).filter(function (x) { return x.key === key; })[0];
    if (!d) return;
    bar.classList.remove('anim');
    bar.setPointerCapture(ev.pointerId);
    setParam(key, barValue(d, bar, ev.clientX));
    var move = function (e2) { setParam(key, barValue(d, bar, e2.clientX)); };
    var up = function () {
      bar.removeEventListener('pointermove', move);
      bar.removeEventListener('pointerup', up);
      bar.removeEventListener('pointercancel', up);
    };
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', up);
    bar.addEventListener('pointercancel', up);
  });

  controls.addEventListener('keydown', function (ev) {
    var bar = ev.target.closest('.segbar');
    if (!bar) return;
    if (ev.key !== 'ArrowLeft' && ev.key !== 'ArrowRight') return;
    ev.preventDefault(); ev.stopPropagation();
    var key = bar.getAttribute('data-key');
    var d = paramsOf(current).filter(function (x) { return x.key === key; })[0];
    if (!d) return;
    var v = stateOf(current)[key] + (ev.key === 'ArrowRight' ? d.step : -d.step);
    setParam(key, +v.toFixed(6));
  });

  /* ── wiring ───────────────────────────────────────────── */
  $('#tabs').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-tab]'); if (b) setTab(b.getAttribute('data-tab'));
  });
  nav.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-id]'); if (b) select(b.getAttribute('data-id'));
  });
  controls.addEventListener('input', function (ev) {
    var t = ev.target;
    if (t.classList.contains('field')) setParam(t.getAttribute('data-key'), t.value);
    else if (t.type === 'color') setParam(t.getAttribute('data-key'), t.value, t.getAttribute('data-sub'));
  });
  controls.addEventListener('click', function (ev) {
    var fold = ev.target.closest('[data-fold]');
    if (fold) {
      var g = fold.getAttribute('data-fold');
      current._folds = current._folds || {};
      current._folds[g] = !current._folds[g];
      var sec = fold.parentNode;
      sec.classList.toggle('is-folded', current._folds[g]);
      fold.setAttribute('aria-expanded', String(!current._folds[g]));
      return;
    }
    var chip = ev.target.closest('.chip');
    if (chip) { setParam(chip.getAttribute('data-key'), chip.getAttribute('aria-pressed') !== 'true', 'on'); return; }
    var sw = ev.target.closest('.sw');
    if (sw) { setParam(sw.getAttribute('data-key'), sw.getAttribute('aria-pressed') !== 'true'); return; }
    var b = ev.target.closest('[data-val]');
    if (b) setParam(b.getAttribute('data-key'), b.getAttribute('data-val'), b.getAttribute('data-sub'));
  });

  $('#reset').addEventListener('click', function () {
    current._p = null; stateOf(current);
    buildControls(); remount(); paintCode();
    status('DEFAULTS RESTORED');
  });
  $('#openCode').addEventListener('click', function () { setDrawer(!drawer.classList.contains('open')); });
  $('#drawerClose').addEventListener('click', function () { setDrawer(false); });
  langs.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-lang]'); if (!b) return;
    LANG = b.getAttribute('data-lang'); paintCode();
  });
  $('#copy').addEventListener('click', function () {
    if (!current) return;
    copyText(codeOf(current)[LANG], LANG.toUpperCase() + ' COPIED');
  });
  $('#navToggle').addEventListener('click', function () { document.body.classList.toggle('nav-open'); });

  document.addEventListener('keydown', function (ev) {
    if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
    var el = document.activeElement;
    if (el && (el.tagName === 'INPUT' || el.classList.contains('segbar'))) {
      if (ev.key === 'Escape') el.blur();
      return;
    }
    var items = list(), i = items.indexOf(current);
    if (ev.key === 'ArrowDown' || ev.key === 'j') { ev.preventDefault(); select(items[(i + 1) % items.length].id, true); }
    else if (ev.key === 'ArrowUp' || ev.key === 'k') { ev.preventDefault(); select(items[(i - 1 + items.length) % items.length].id, true); }
    else if (ev.key === 'ArrowLeft') { ev.preventDefault(); setTab('design'); }
    else if (ev.key === 'ArrowRight') { ev.preventDefault(); setTab('animated'); }
    else if (ev.key === 'Escape') setDrawer(false);
    else if (ev.key.toLowerCase() === 'c') $('#copy').click();
    else if (ev.key.toLowerCase() === 'e') $('#openCode').click();
  });

  /* ── GitHub: live star count ──────────────────────────────
     Point REPO at the repository once it exists. The count is cached
     for an hour so a reload does not burn the 60/hour anonymous quota,
     and the badge simply shows no number if the call fails. */
  var GH = { owner: 'oleksand4rux-del', repo: 'cursor-lab' };

  function stamp(d) {
    /* ISO date: unambiguous, sorts, and reads like the rest of the panel */
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  function ghMeta() {
    var link = $('#gh'), out = $('#ghStars'), upd = $('#updated');
    if (link) link.href = 'https://github.com/' + GH.owner + '/' + GH.repo;

    /* Fallback first, so the date is never blank: the document's own
       Last-Modified is true for a local or statically hosted copy. */
    function setDate(d, why) {
      if (!upd || !d || isNaN(d)) return;
      upd.textContent = stamp(d);
      upd.title = d.toString() + '  ·  ' + why;
    }
    setDate(new Date(document.lastModified), 'file timestamp');

    if (!link || !out) return;

    var KEY = 'cl.gh.' + GH.owner + '.' + GH.repo;
    var TTL = 3600e3;

    function show(n) {
      out.textContent = n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k' : String(n);
      out.hidden = false;
    }

    try {
      var hit = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (hit && Date.now() - hit.t < TTL) {
        show(hit.n);
        if (hit.p) setDate(new Date(hit.p), 'last push to GitHub');
        return;
      }
    } catch (e) { }

    fetch('https://api.github.com/repos/' + GH.owner + '/' + GH.repo, {
      headers: { Accept: 'application/vnd.github+json' }
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || typeof d.stargazers_count !== 'number') return;
        show(d.stargazers_count);
        if (d.pushed_at) setDate(new Date(d.pushed_at), 'last push to GitHub');
        try {
          localStorage.setItem(KEY, JSON.stringify({ n: d.stargazers_count, p: d.pushed_at, t: Date.now() }));
        } catch (e) { }
      })
      .catch(function () { /* offline or rate-limited: file timestamp stands */ });
  }

  /* ── boot ─────────────────────────────────────────────── */
  buildNav();
  select(window.ANIM_DB[0].id);
  ghMeta();
})();
