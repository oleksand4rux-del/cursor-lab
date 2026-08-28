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
