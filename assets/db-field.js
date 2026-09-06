/* ============================================================
   cursor lab — ANIMATED / Field
   The surface reacts; the arrow stays where it is.
   ============================================================ */
(function () {
  'use strict';

  var DB = window.ANIM_DB = window.ANIM_DB || [];
  var lerp = FX.lerp, clamp = FX.clamp, rgba = FX.rgba, rgbOf = FX.rgb;
  function body(title, note) {
    return '<div class="stage__body" style="pointer-events:none"><p class="stage__title">' + title + '</p>' +
      '<p class="stage__note">' + note + '</p></div>';
  }

  /* ── Magnet Lines ─────────────────────────────────────── */
  DB.push({
    id: 'magnet-lines', name: 'Magnet Lines', group: 'Field',
    desc: 'A lattice of short segments that each rotate to face the pointer and brighten as it nears. The field is the cursor — nothing is pinned to the mouse.',
    hideCursor: false,
    params: [
      { key: 'gap', label: 'Gap', type: 'range', min: 16, max: 80, step: 2, value: 34, unit: 'px' },
      { key: 'reach', label: 'Reach', type: 'range', min: 60, max: 480, step: 10, value: 190, unit: 'px' },
      { key: 'len', label: 'Line length', type: 'range', min: 3, max: 24, step: 1, value: 9, unit: 'px' },
      { key: 'ease', label: 'Field ease', type: 'range', min: 0.03, max: 0.5, step: 0.01, value: 0.12 },
      { key: 'color', label: 'Colour', type: 'paint', value: { a: '#FFFFFF', b: '#5B9BF6', on: false, angle: 90 } }
    ],
    content: body('Field.', 'every segment faces the pointer'),
    mount: function (stage, p) {
      var c = FX.canvas(stage, { z: 1 }), ctx = c.ctx;
      var tx = -999, ty = -999, cx = -999, cy = -999;
      return FX.mount(stage, {
        resize: function () { c.fit(); },
        enter: function (s) { cx = s.x; cy = s.y; },
        leave: function (s) { tx = s.w / 2; ty = s.h / 2; },
        tick: function (s) {
          if (s.inside) { tx = s.x; ty = s.y; }
          cx = lerp(cx, tx, p.ease); cy = lerp(cy, ty, p.ease);
          ctx.clearRect(0, 0, s.w, s.h);
          ctx.lineCap = 'round';
          for (var x = p.gap / 2; x < s.w; x += p.gap) {
            for (var y = p.gap / 2; y < s.h; y += p.gap) {
              var dx = cx - x, dy = cy - y;
              var f = clamp(1 - Math.hypot(dx, dy) / p.reach, 0, 1);
              var a = Math.atan2(dy, dx), len = p.len * (0.55 + f);
              ctx.strokeStyle = FX.pc(p.color, f, .1 + f * .8);
              ctx.lineWidth = .9 + f * 1.3;
              ctx.beginPath();
              ctx.moveTo(x - Math.cos(a) * len, y - Math.sin(a) * len);
              ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
              ctx.stroke();
            }
          }
        }
      }).destroy;
    },
    code: function (p) {
      return {
        css: '.field-scope{ position: relative; }\n.field{ position: absolute; inset: 0; pointer-events: none; }',
        js: 'const cv   = document.querySelector(\'.field\');\nconst ctx  = cv.getContext(\'2d\');\nconst host = cv.parentElement;\nconst dpr  = Math.min(devicePixelRatio, 2);\n\nconst GAP   = ' + p.gap + ';\nconst REACH = ' + p.reach + ';\nconst LEN   = ' + p.len + ';\nconst EASE  = ' + p.ease + ';\n\nlet tx = -999, ty = -999, cx = -999, cy = -999, w = 0, h = 0;\n\nfunction fit(){\n  const r = host.getBoundingClientRect();\n  w = r.width; h = r.height;\n  cv.width = w * dpr; cv.height = h * dpr;\n  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);\n}\nfit(); new ResizeObserver(fit).observe(host);\n\nhost.addEventListener(\'pointermove\', (e) => {\n  const r = host.getBoundingClientRect();\n  tx = e.clientX - r.left; ty = e.clientY - r.top;\n}, { passive: true });\nhost.addEventListener(\'pointerleave\', () => { tx = w / 2; ty = h / 2; });\n\n' + FX.tintjs(p.color) + '\n\n(function loop(){\n  cx += (tx - cx) * EASE;          // ease the field once, not each line\n  cy += (ty - cy) * EASE;\n\n  ctx.clearRect(0, 0, w, h);\n  ctx.lineCap = \'round\';\n\n  for (let x = GAP / 2; x < w; x += GAP) {\n    for (let y = GAP / 2; y < h; y += GAP) {\n      const dx = cx - x, dy = cy - y;\n      const f = Math.max(0, Math.min(1, 1 - Math.hypot(dx, dy) / REACH));\n      const a = Math.atan2(dy, dx);\n      const len = LEN * (0.55 + f);\n\n      ctx.strokeStyle = tint(f, 0.1 + f * 0.8);\n      ctx.lineWidth = 0.9 + f * 1.3;\n      ctx.beginPath();\n      ctx.moveTo(x - Math.cos(a) * len, y - Math.sin(a) * len);\n      ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);\n      ctx.stroke();\n    }\n  }\n  requestAnimationFrame(loop);\n})();',
        react: 'import { useEffect, useRef } from \'react\';\n\nexport function MagnetLines({\n  gap = ' + p.gap + ', reach = ' + p.reach + ', len = ' + p.len + ', ease = ' + p.ease + '\n}) {\n  const ref = useRef(null);\n\n  useEffect(() => {\n    const cv = ref.current, ctx = cv.getContext(\'2d\');\n    const host = cv.parentElement;\n    const dpr = Math.min(devicePixelRatio, 2);\n    let tx = -999, ty = -999, cx = -999, cy = -999, w = 0, h = 0, id = 0;\n\n    const fit = () => {\n      const r = host.getBoundingClientRect();\n      w = r.width; h = r.height;\n      cv.width = w * dpr; cv.height = h * dpr;\n      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);\n    };\n    const move = (e) => {\n      const r = host.getBoundingClientRect();\n      tx = e.clientX - r.left; ty = e.clientY - r.top;\n    };\n    const leave = () => { tx = w / 2; ty = h / 2; };\n\n    fit();\n    const ro = new ResizeObserver(fit); ro.observe(host);\n    host.addEventListener(\'pointermove\', move, { passive: true });\n    host.addEventListener(\'pointerleave\', leave);\n\n    ' + FX.tintjs(p.color).split('\n').join('\n    ') + '\n\n    const loop = () => {\n      cx += (tx - cx) * ease; cy += (ty - cy) * ease;\n      ctx.clearRect(0, 0, w, h);\n      ctx.lineCap = \'round\';\n      for (let x = gap / 2; x < w; x += gap) {\n        for (let y = gap / 2; y < h; y += gap) {\n          const dx = cx - x, dy = cy - y;\n          const f = Math.max(0, Math.min(1, 1 - Math.hypot(dx, dy) / reach));\n          const a = Math.atan2(dy, dx);\n          const l = len * (0.55 + f);\n          ctx.strokeStyle = tint(f, 0.1 + f * 0.8);\n          ctx.lineWidth = 0.9 + f * 1.3;\n          ctx.beginPath();\n          ctx.moveTo(x - Math.cos(a) * l, y - Math.sin(a) * l);\n          ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);\n          ctx.stroke();\n        }\n      }\n      id = requestAnimationFrame(loop);\n    };\n    id = requestAnimationFrame(loop);\n    return () => {\n      ro.disconnect();\n      host.removeEventListener(\'pointermove\', move);\n      host.removeEventListener(\'pointerleave\', leave);\n      cancelAnimationFrame(id);\n    };\n  }, [gap, reach, len, ease]);\n\n  return <canvas ref={ref} className="field" aria-hidden />;\n}'
      };
    }
  });

  /* ── ASCII Field ──────────────────────────────────────── */

  /* Character ramps, low intensity first. `Codex` is the two-step ramp the
     OpenAI Codex hero uses: a faint underscore that sharpens into a chevron. */
  var RAMPS = {
    Codex: '_>',
    Dots: '.:-=+*',
    Binary: '01',
    Blocks: '░▒▓█'
  };
  /* `Mix` is not a ramp but a set of them: each cell keeps one for good, so
     chevrons, dots and bits sit side by side and every cell still climbs its
     own ramp as it heats up */
  var SETS = {
    Codex: [RAMPS.Codex],
    Dots: [RAMPS.Dots],
    Binary: [RAMPS.Binary],
    Blocks: [RAMPS.Blocks],
    Mix: [RAMPS.Codex, RAMPS.Dots, RAMPS.Binary]
  };
  /* the same sets as JS source, so a copied snippet carries the choice */
  var SETSRC = {
    Codex: "['_>']",
    Dots: "['.:-=+*']",
    Binary: "['01']",
    Blocks: "['\\u2591\\u2592\\u2593\\u2588']",
    Mix: "['_>', '.:-=+*', '01']"
  };
  /* stable per-cell pick — a hash, not Math.random, so a cell does not
     flicker between glyph families from one frame to the next */
  function pickOf(sets, i) {
    if (sets.length === 1) return sets[0];
    return sets[((i * 1103515245 + 12345) & 0x7fffffff) % sets.length];
  }
  var MONO = 'px ui-monospace, SFMono-Regular, "Space Mono", Menlo, monospace';
  var L = function (a) { return a.join('\n'); };

  DB.push({
    id: 'ascii-field', name: 'ASCII Field', group: 'Field',
    desc: 'A monospace grid that stays blank until the pointer writes into it. Each cell holds a heat value that decays on a timer, and the character is picked from a ramp by how hot the cell still is.',
    hideCursor: false,
    params: [
      { key: 'cell', label: 'Cell size', type: 'range', min: 8, max: 24, step: 1, value: 12, unit: 'px' },
      { key: 'reach', label: 'Reach', type: 'range', min: 40, max: 260, step: 10, value: 110, unit: 'px' },
      { key: 'life', label: 'Trail life', type: 'range', min: 0.2, max: 4, step: 0.1, value: 1.4, unit: 's' },
      { key: 'ink', label: 'Intensity', type: 'range', min: 0.3, max: 2, step: 0.1, value: 1, unit: '×' },
      { key: 'glyphs', label: 'Characters', type: 'select', value: 'Codex', options: ['Codex', 'Dots', 'Binary', 'Blocks', 'Mix'] },
      { key: 'color', label: 'Colour', type: 'paint', value: { a: '#FFFFFF', b: '#5B9BF6', on: false, angle: 90 } }
    ],
    content: body('Type on the surface.', 'the grid remembers where you went'),
    mount: function (stage, p) {
      var c = FX.canvas(stage, { z: 1 }), ctx = c.ctx;
      var cols = 0, rows = 0, heat = new Float32Array(0), cellNow = 0, wNow = 0, hNow = 0;
      var mx = -1e4, my = -1e4, lx = -1e4, ly = -1e4, last = 0;

      /* the grid is rebuilt whenever the box or the cell size changes, so the
         slider stays live instead of forcing a remount */
      function grid(w, h) {
        if (p.cell === cellNow && w === wNow && h === hNow) return;
        cellNow = p.cell; wNow = w; hNow = h;
        cols = Math.max(1, Math.ceil(w / p.cell));
        rows = Math.max(1, Math.ceil(h / p.cell));
        heat = new Float32Array(cols * rows);
      }

      function stamp(x, y, dose) {
        var cell = p.cell, reach = p.reach;
        var c0 = Math.max(0, Math.floor((x - reach) / cell));
        var c1 = Math.min(cols - 1, Math.floor((x + reach) / cell));
        var r0 = Math.max(0, Math.floor((y - reach) / cell));
        var r1 = Math.min(rows - 1, Math.floor((y + reach) / cell));
        for (var cc = c0; cc <= c1; cc++) {
          for (var rr = r0; rr <= r1; rr++) {
            var dx = (cc + 0.5) * cell - x, dy = (rr + 0.5) * cell - y;
            var f = 1 - Math.hypot(dx, dy) / reach;
            if (f <= 0) continue;
            var i = rr * cols + cc;
            heat[i] = Math.min(1, heat[i] + f * f * dose);
          }
        }
      }

      return FX.mount(stage, {
        /* keep the loop alive past the default 1.4s so the trail finishes
           fading instead of freezing half-lit when the pointer leaves */
        settle: 3200,
        resize: function () { c.fit(); },
        leave: function () { mx = my = lx = ly = -1e4; },
        tick: function (s, t) {
          var dt = last ? Math.min(0.05, (t - last) / 1000) : 0.016;
          last = t;
          grid(s.w, s.h);

          if (s.inside) { mx = s.x; my = s.y; }

          if (mx > -9e3) {
            if (lx < -9e3) { lx = mx; ly = my; }
            var dose = p.ink * 0.55 * Math.min(2, dt * 60);
            /* walk the segment travelled this frame: a fast flick would
               otherwise stamp two blobs with a hole between them */
            var steps = Math.max(1, Math.ceil(Math.hypot(mx - lx, my - ly) / (p.cell * 0.7)));
            for (var i = 1; i <= steps; i++) {
              stamp(lx + (mx - lx) * (i / steps), ly + (my - ly) * (i / steps), dose);
            }
            lx = mx; ly = my;
          }

          var k = Math.pow(0.02, dt / p.life);
          var sets = SETS[p.glyphs] || SETS.Codex;
          ctx.clearRect(0, 0, s.w, s.h);
          ctx.font = Math.round(p.cell * 0.95) + MONO;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          for (var idx = 0; idx < heat.length; idx++) {
            var v = heat[idx] * k;
            heat[idx] = v;
            if (v < 0.05) continue;
            var col = idx % cols, row = (idx - col) / cols;
            var ramp = pickOf(sets, idx), n = ramp.length;
            ctx.fillStyle = FX.pc(p.color, v, Math.min(1, v * 0.95));
            ctx.fillText(ramp.charAt(Math.min(n - 1, Math.floor(v * n))),
              (col + 0.5) * p.cell, (row + 0.5) * p.cell);
          }
        }
      }).destroy;
    },
    code: function (p) {
      var sets = SETSRC[p.glyphs] || SETSRC.Codex;
      return {
        css: L([
          '.ascii-scope{ position: relative; }',
          '.ascii{ position: absolute; inset: 0; pointer-events: none; }'
        ]),
        js: L([
          "const cv   = document.querySelector('.ascii');",
          "const ctx  = cv.getContext('2d');",
          'const host = cv.parentElement;',
          'const dpr  = Math.min(devicePixelRatio, 2);',
          '',
          'const CELL  = ' + p.cell + ';',
          'const REACH = ' + p.reach + ';',
          'const LIFE  = ' + p.life + ';        // seconds for a cell to fall dark',
          'const INK   = ' + p.ink + ';',
          'const RAMPS = ' + sets + ';   // low intensity first',
          '',
          '// one ramp: every cell uses it. Several: each cell keeps its own,',
          '// picked by a hash so it never flickers between families.',
          'const rampFor = (i) => RAMPS.length === 1 ? RAMPS[0]',
          '  : RAMPS[((i * 1103515245 + 12345) & 0x7fffffff) % RAMPS.length];',
          '',
          'let w = 0, h = 0, cols = 0, rows = 0, heat = new Float32Array(0);',
          'let mx = -1e4, my = -1e4, lx = -1e4, ly = -1e4, last = 0;',
          '',
          'function fit(){',
          '  const r = host.getBoundingClientRect();',
          '  w = r.width; h = r.height;',
          '  cv.width = w * dpr; cv.height = h * dpr;',
          '  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);',
          '  cols = Math.max(1, Math.ceil(w / CELL));',
          '  rows = Math.max(1, Math.ceil(h / CELL));',
          '  heat = new Float32Array(cols * rows);',
          '}',
          'fit(); new ResizeObserver(fit).observe(host);',
          '',
          "host.addEventListener('pointermove', (e) => {",
          '  const r = host.getBoundingClientRect();',
          '  mx = e.clientX - r.left; my = e.clientY - r.top;',
          '}, { passive: true });',
          "host.addEventListener('pointerleave', () => { mx = my = lx = ly = -1e4; });",
          '',
          FX.tintjs(p.color),
          '',
          '// raise the heat of every cell within REACH of (x, y)',
          'function stamp(x, y, dose){',
          '  const c0 = Math.max(0, Math.floor((x - REACH) / CELL));',
          '  const c1 = Math.min(cols - 1, Math.floor((x + REACH) / CELL));',
          '  const r0 = Math.max(0, Math.floor((y - REACH) / CELL));',
          '  const r1 = Math.min(rows - 1, Math.floor((y + REACH) / CELL));',
          '  for (let c = c0; c <= c1; c++) {',
          '    for (let r = r0; r <= r1; r++) {',
          '      const dx = (c + 0.5) * CELL - x, dy = (r + 0.5) * CELL - y;',
          '      const f = 1 - Math.hypot(dx, dy) / REACH;',
          '      if (f <= 0) continue;',
          '      const i = r * cols + c;',
          '      heat[i] = Math.min(1, heat[i] + f * f * dose);',
          '    }',
          '  }',
          '}',
          '',
          '(function loop(now){',
          '  const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;',
          '  last = now;',
          '',
          '  if (mx > -9e3) {',
          '    if (lx < -9e3) { lx = mx; ly = my; }',
          '    const dose = INK * 0.55 * Math.min(2, dt * 60);',
          '    // walk the segment travelled this frame, or a fast flick leaves a hole',
          '    const steps = Math.max(1, Math.ceil(Math.hypot(mx - lx, my - ly) / (CELL * 0.7)));',
          '    for (let i = 1; i <= steps; i++) {',
          '      stamp(lx + (mx - lx) * (i / steps), ly + (my - ly) * (i / steps), dose);',
          '    }',
          '    lx = mx; ly = my;',
          '  }',
          '',
          '  const k = Math.pow(0.02, dt / LIFE);   // time based, so it fades the',
          '  ctx.clearRect(0, 0, w, h);             // same on any refresh rate',
          "  ctx.font = Math.round(CELL * 0.95) + 'px ui-monospace, SFMono-Regular, monospace';",
          "  ctx.textAlign = 'center';",
          "  ctx.textBaseline = 'middle';",
          '',
          '  for (let i = 0; i < heat.length; i++) {',
          '    const v = heat[i] *= k;',
          '    if (v < 0.05) continue;',
          '    const c = i % cols, r = (i - c) / cols;',
          '    const ramp = rampFor(i);',
          '    ctx.fillStyle = tint(v, Math.min(1, v * 0.95));',
          '    ctx.fillText(ramp[Math.min(ramp.length - 1, Math.floor(v * ramp.length))],',
          '      (c + 0.5) * CELL, (r + 0.5) * CELL);',
          '  }',
          '  requestAnimationFrame(loop);',
          '})(performance.now());'
        ]),
        react: L([
          "import { useEffect, useRef } from 'react';",
          '',
          'export function AsciiField({',
          '  cell = ' + p.cell + ', reach = ' + p.reach + ', life = ' + p.life + ', ink = ' + p.ink + ', ramps = ' + sets,
          '}) {',
          '  const ref = useRef(null);',
          '',
          '  useEffect(() => {',
          "    const cv = ref.current, ctx = cv.getContext('2d');",
          '    const host = cv.parentElement;',
          '    const dpr = Math.min(devicePixelRatio, 2);',
          '    let w = 0, h = 0, cols = 0, rows = 0, heat = new Float32Array(0);',
          '    let mx = -1e4, my = -1e4, lx = -1e4, ly = -1e4, last = 0, id = 0;',
          '',
          '    const fit = () => {',
          '      const r = host.getBoundingClientRect();',
          '      w = r.width; h = r.height;',
          '      cv.width = w * dpr; cv.height = h * dpr;',
          '      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);',
          '      cols = Math.max(1, Math.ceil(w / cell));',
          '      rows = Math.max(1, Math.ceil(h / cell));',
          '      heat = new Float32Array(cols * rows);',
          '    };',
          '    const move = (e) => {',
          '      const r = host.getBoundingClientRect();',
          '      mx = e.clientX - r.left; my = e.clientY - r.top;',
          '    };',
          '    const leave = () => { mx = my = lx = ly = -1e4; };',
          '',
          '    fit();',
          '    const ro = new ResizeObserver(fit); ro.observe(host);',
          "    host.addEventListener('pointermove', move, { passive: true });",
          "    host.addEventListener('pointerleave', leave);",
          '',
          '    ' + FX.tintjs(p.color).split('\n').join('\n    '),
          '',
          '    // one ramp for every cell, or a hashed pick when several are given',
          '    const rampFor = (i) => ramps.length === 1 ? ramps[0]',
          '      : ramps[((i * 1103515245 + 12345) & 0x7fffffff) % ramps.length];',
          '',
          '    const stamp = (x, y, dose) => {',
          '      const c0 = Math.max(0, Math.floor((x - reach) / cell));',
          '      const c1 = Math.min(cols - 1, Math.floor((x + reach) / cell));',
          '      const r0 = Math.max(0, Math.floor((y - reach) / cell));',
          '      const r1 = Math.min(rows - 1, Math.floor((y + reach) / cell));',
          '      for (let c = c0; c <= c1; c++) {',
          '        for (let r = r0; r <= r1; r++) {',
          '          const dx = (c + 0.5) * cell - x, dy = (r + 0.5) * cell - y;',
          '          const f = 1 - Math.hypot(dx, dy) / reach;',
          '          if (f <= 0) continue;',
          '          const i = r * cols + c;',
          '          heat[i] = Math.min(1, heat[i] + f * f * dose);',
          '        }',
          '      }',
          '    };',
          '',
          '    const loop = (now) => {',
          '      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;',
          '      last = now;',
          '      if (mx > -9e3) {',
          '        if (lx < -9e3) { lx = mx; ly = my; }',
          '        const dose = ink * 0.55 * Math.min(2, dt * 60);',
          '        const steps = Math.max(1, Math.ceil(Math.hypot(mx - lx, my - ly) / (cell * 0.7)));',
          '        for (let i = 1; i <= steps; i++) {',
          '          stamp(lx + (mx - lx) * (i / steps), ly + (my - ly) * (i / steps), dose);',
          '        }',
          '        lx = mx; ly = my;',
          '      }',
          '      const k = Math.pow(0.02, dt / life);',
          '      ctx.clearRect(0, 0, w, h);',
          "      ctx.font = Math.round(cell * 0.95) + 'px ui-monospace, SFMono-Regular, monospace';",
          "      ctx.textAlign = 'center';",
          "      ctx.textBaseline = 'middle';",
          '      for (let i = 0; i < heat.length; i++) {',
          '        const v = heat[i] *= k;',
          '        if (v < 0.05) continue;',
          '        const c = i % cols, r = (i - c) / cols;',
          '        const ramp = rampFor(i);',
          '        ctx.fillStyle = tint(v, Math.min(1, v * 0.95));',
          '        ctx.fillText(ramp[Math.min(ramp.length - 1, Math.floor(v * ramp.length))],',
          '          (c + 0.5) * cell, (r + 0.5) * cell);',
          '      }',
          '      id = requestAnimationFrame(loop);',
          '    };',
          '    id = requestAnimationFrame(loop);',
          '',
          '    return () => {',
          '      ro.disconnect();',
          "      host.removeEventListener('pointermove', move);",
          "      host.removeEventListener('pointerleave', leave);",
          '      cancelAnimationFrame(id);',
          '    };',
          '  }, [cell, reach, life, ink, ramps]);',
          '',
          '  return <canvas ref={ref} className="ascii" aria-hidden />;',
          '}'
        ])
      };
    }
  });

  /* ── Dot Grid Warp ────────────────────────────────────── */
  DB.push({
    id: 'dot-grid-warp', name: 'Dot Grid Warp', group: 'Field',
    desc: 'Every dot is pushed away from the pointer along the vector between them and swells as it flees, so the grid dimples like fabric under a finger.',
    hideCursor: false,
    params: [
      { key: 'gap', label: 'Gap', type: 'range', min: 12, max: 60, step: 2, value: 26, unit: 'px' },
      { key: 'reach', label: 'Reach', type: 'range', min: 50, max: 400, step: 10, value: 150, unit: 'px' },
      { key: 'push', label: 'Push', type: 'range', min: -50, max: 60, step: 2, value: 26, unit: 'px' },
      { key: 'dot', label: 'Dot size', type: 'range', min: 0.5, max: 5, step: 0.25, value: 1, unit: 'px' },
      { key: 'color', label: 'Colour', type: 'paint', value: { a: '#FFFFFF', b: '#5B9BF6', on: false, angle: 90 } }
    ],
    content: body('Push the surface.', 'squared falloff · negative pulls'),
    mount: function (stage, p) {
      var c = FX.canvas(stage, { z: 1 }), ctx = c.ctx;
      var tx = -999, ty = -999, cx = -999, cy = -999;
      return FX.mount(stage, {
        resize: function () { c.fit(); },
        leave: function () { tx = -999; ty = -999; },
        tick: function (s) {
          if (s.inside) { tx = s.x; ty = s.y; }
          cx = lerp(cx, tx, .15); cy = lerp(cy, ty, .15);
          ctx.clearRect(0, 0, s.w, s.h);
          for (var x = p.gap / 2; x < s.w; x += p.gap) {
            for (var y = p.gap / 2; y < s.h; y += p.gap) {
              var dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1;
              var f = clamp(1 - d / p.reach, 0, 1), push = f * f * p.push;
              ctx.beginPath();
              ctx.arc(x + (dx / d) * push, y + (dy / d) * push, p.dot + f * 2.4, 0, 6.2832);
              ctx.fillStyle = FX.pc(p.color, f, .14 + f * .86);
              ctx.fill();
            }
          }
        }
      }).destroy;
    },
    code: function (p) {
      return {
        css: '.warp-scope{ position: relative; }\n.warp{ position: absolute; inset: 0; pointer-events: none; }',
        js: 'const cv   = document.querySelector(\'.warp\');\nconst ctx  = cv.getContext(\'2d\');\nconst host = cv.parentElement;\nconst dpr  = Math.min(devicePixelRatio, 2);\n\nconst GAP   = ' + p.gap + ';\nconst REACH = ' + p.reach + ';\nconst PUSH  = ' + p.push + ';   // negative values suck the grid inward\nconst DOT   = ' + p.dot + ';\n\nlet tx = -999, ty = -999, cx = -999, cy = -999, w = 0, h = 0;\n\nfunction fit(){\n  const r = host.getBoundingClientRect();\n  w = r.width; h = r.height;\n  cv.width = w * dpr; cv.height = h * dpr;\n  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);\n}\nfit(); new ResizeObserver(fit).observe(host);\n\nhost.addEventListener(\'pointermove\', (e) => {\n  const r = host.getBoundingClientRect();\n  tx = e.clientX - r.left; ty = e.clientY - r.top;\n}, { passive: true });\nhost.addEventListener(\'pointerleave\', () => { tx = ty = -999; });\n\n' + FX.tintjs(p.color) + '\n\n(function loop(){\n  cx += (tx - cx) * 0.15;\n  cy += (ty - cy) * 0.15;\n  ctx.clearRect(0, 0, w, h);\n\n  for (let x = GAP / 2; x < w; x += GAP) {\n    for (let y = GAP / 2; y < h; y += GAP) {\n      const dx = x - cx, dy = y - cy;\n      const d  = Math.hypot(dx, dy) || 1;\n      const f  = Math.max(0, Math.min(1, 1 - d / REACH));\n      const push = f * f * PUSH;              // squared falloff = a soft dimple\n\n      ctx.beginPath();\n      ctx.arc(x + (dx / d) * push, y + (dy / d) * push, DOT + f * 2.4, 0, Math.PI * 2);\n      ctx.fillStyle = tint(f, 0.14 + f * 0.86);\n      ctx.fill();\n    }\n  }\n  requestAnimationFrame(loop);\n})();',
        react: 'import { useEffect, useRef } from \'react\';\n\nexport function DotGridWarp({\n  gap = ' + p.gap + ', reach = ' + p.reach + ', push = ' + p.push + ', dot = ' + p.dot + '\n}) {\n  const ref = useRef(null);\n\n  useEffect(() => {\n    const cv = ref.current, ctx = cv.getContext(\'2d\');\n    const host = cv.parentElement;\n    const dpr = Math.min(devicePixelRatio, 2);\n    let tx = -999, ty = -999, cx = -999, cy = -999, w = 0, h = 0, id = 0;\n\n    const fit = () => {\n      const r = host.getBoundingClientRect();\n      w = r.width; h = r.height;\n      cv.width = w * dpr; cv.height = h * dpr;\n      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);\n    };\n    const move = (e) => {\n      const r = host.getBoundingClientRect();\n      tx = e.clientX - r.left; ty = e.clientY - r.top;\n    };\n    const leave = () => { tx = ty = -999; };\n\n    fit();\n    const ro = new ResizeObserver(fit); ro.observe(host);\n    host.addEventListener(\'pointermove\', move, { passive: true });\n    host.addEventListener(\'pointerleave\', leave);\n\n    ' + FX.tintjs(p.color).split('\n').join('\n    ') + '\n\n    const loop = () => {\n      cx += (tx - cx) * 0.15; cy += (ty - cy) * 0.15;\n      ctx.clearRect(0, 0, w, h);\n      for (let x = gap / 2; x < w; x += gap) {\n        for (let y = gap / 2; y < h; y += gap) {\n          const dx = x - cx, dy = y - cy;\n          const d = Math.hypot(dx, dy) || 1;\n          const f = Math.max(0, Math.min(1, 1 - d / reach));\n          const pp = f * f * push;\n          ctx.beginPath();\n          ctx.arc(x + (dx / d) * pp, y + (dy / d) * pp, dot + f * 2.4, 0, Math.PI * 2);\n          ctx.fillStyle = tint(f, 0.14 + f * 0.86);\n          ctx.fill();\n        }\n      }\n      id = requestAnimationFrame(loop);\n    };\n    id = requestAnimationFrame(loop);\n    return () => {\n      ro.disconnect();\n      host.removeEventListener(\'pointermove\', move);\n      host.removeEventListener(\'pointerleave\', leave);\n      cancelAnimationFrame(id);\n    };\n  }, [gap, reach, push, dot]);\n\n  return <canvas ref={ref} className="warp" aria-hidden />;\n}'
      };
    }
  });
})();
