/* ============================================================
   cursor lab — ANIMATED / Trail
   Everything the pointer leaves behind.
   ============================================================ */
(function () {
  'use strict';

  var DB = window.ANIM_DB = window.ANIM_DB || [];
  var lerp = FX.lerp, clamp = FX.clamp, rand = FX.rand, rgba = FX.rgba, rgbOf = FX.rgb;
  var BASE = 'position:absolute;top:0;left:0;will-change:transform;';
  function make(css) { var d = document.createElement('div'); d.style.cssText = css; return d; }
  function body(title, note) {
    return '<div class="stage__body"><p class="stage__title">' + title + '</p>' +
      '<p class="stage__note">' + note + '</p></div>';
  }

  /* ── Cascading Dots ───────────────────────────────────── */
  DB.push({
    id: 'dot-trail', name: 'Cascading Dots', group: 'Trail',
    desc: 'A chain of nodes where each one eases toward the node in front of it. No canvas, no library — the tail falls out of the maths.',
    params: [
      { key: 'count', label: 'Nodes', type: 'range', min: 3, max: 40, step: 1, value: 14, rebuild: true },
      { key: 'ease', label: 'Chain ease', type: 'range', min: 0.08, max: 0.8, step: 0.02, value: 0.34 },
      { key: 'head', label: 'Head size', type: 'range', min: 6, max: 60, step: 1, value: 24, unit: 'px' },
      { key: 'taper', label: 'Taper', type: 'range', min: 0, max: 1, step: 0.05, value: 0.8 },
      { key: 'color', label: 'Colour', type: 'paint', value: { a: '#FFFFFF', b: '#5B9BF6', on: false, angle: 90 } }
    ],
    content: body('Draw with it', 'each node chases the one ahead'),
    mount: function (stage, p) {
      var l = FX.layer(stage), nodes = [];
      for (var i = 0; i < p.count; i++) {
        var d = make(BASE + 'border-radius:50%;opacity:0;transition:opacity .3s');
        l.appendChild(d);
        nodes.push({ el: d, x: 0, y: 0, t: i / Math.max(p.count - 1, 1) });
      }
      return FX.mount(stage, {
        enter: function (s) { nodes.forEach(function (n) { n.x = s.x; n.y = s.y; n.el.style.opacity = 1; }); },
        leave: function () { nodes.forEach(function (n) { n.el.style.opacity = 0; }); },
        tick: function (s) {
          var px = s.x, py = s.y;
          nodes.forEach(function (n) {
            n.x = lerp(n.x, px, p.ease); n.y = lerp(n.y, py, p.ease);
            var sz = p.head * (1 - n.t * p.taper);
            n.el.style.width = n.el.style.height = sz + 'px';
            n.el.style.margin = (-sz / 2) + 'px 0 0 ' + (-sz / 2) + 'px';
            n.el.style.background = FX.pc(p.color, n.t, 1 - n.t * 0.78);
            n.el.style.transform = 'translate3d(' + n.x + 'px,' + n.y + 'px,0)';
            px = n.x; py = n.y;
          });
        }
      }).destroy;
    },
    code: function (p) {
      return {
        css: '.trail-dot{\n  position: fixed; top: 0; left: 0; z-index: 9999;\n  border-radius: 50%; pointer-events: none; will-change: transform;\n}\nbody { cursor: none; }',
        js: 'const N     = ' + p.count + ';\nconst EASE  = ' + p.ease + ';\nconst HEAD  = ' + p.head + ';   // diameter of the first node\nconst TAPER = ' + p.taper + ';  // 0 = all equal, 1 = tail vanishes\n\nconst nodes = Array.from({ length: N }, (_, i) => {\n  const t  = i / (N - 1);\n  const sz = HEAD * (1 - t * TAPER);\n  const el = document.createElement(\'div\');\n  el.className = \'trail-dot\';\n  el.style.width = el.style.height = sz + \'px\';\n  el.style.margin = `${-sz / 2}px 0 0 ${-sz / 2}px`;\n  el.style.background = tint(t, 1 - t * 0.78);\n  document.body.appendChild(el);\n  return { el, x: 0, y: 0 };\n});\n\nlet mx = 0, my = 0;\naddEventListener(\'pointermove\', e => { mx = e.clientX; my = e.clientY; }, { passive: true });\n\n' + FX.tintjs(p.color) + '\n\n(function loop(){\n  let px = mx, py = my;\n  for (const n of nodes) {\n    n.x += (px - n.x) * EASE;\n    n.y += (py - n.y) * EASE;\n    n.el.style.transform = `translate3d(${n.x}px, ${n.y}px, 0)`;\n    px = n.x; py = n.y;          // the next node chases this one\n  }\n  requestAnimationFrame(loop);\n})();',
        react: 'import { useEffect, useRef } from \'react\';\n\nexport function DotTrail({ count = ' + p.count + ', ease = ' + p.ease + ', head = ' + p.head + ', taper = ' + p.taper + ' }) {\n  const host = useRef(null);\n\n  useEffect(() => {\n    if (!matchMedia(\'(pointer: fine)\').matches) return;\n    const nodes = Array.from({ length: count }, (_, i) => {\n      const t = i / (count - 1);\n      const sz = head * (1 - t * taper);\n      const el = document.createElement(\'div\');\n      el.className = \'trail-dot\';\n      el.style.width = el.style.height = sz + \'px\';\n      el.style.margin = `${-sz / 2}px 0 0 ${-sz / 2}px`;\n      el.style.background = tint(t, 1 - t * 0.78);\n      host.current.appendChild(el);\n      return { el, x: 0, y: 0 };\n    });\n\n    let mx = 0, my = 0, id = 0;\n    const move = (e) => { mx = e.clientX; my = e.clientY; };\n    addEventListener(\'pointermove\', move, { passive: true });\n\n    ' + FX.tintjs(p.color).split('\n').join('\n    ') + '\n\n    const loop = () => {\n      let px = mx, py = my;\n      for (const n of nodes) {\n        n.x += (px - n.x) * ease; n.y += (py - n.y) * ease;\n        n.el.style.transform = `translate3d(${n.x}px,${n.y}px,0)`;\n        px = n.x; py = n.y;\n      }\n      id = requestAnimationFrame(loop);\n    };\n    id = requestAnimationFrame(loop);\n    return () => {\n      removeEventListener(\'pointermove\', move);\n      cancelAnimationFrame(id);\n      nodes.forEach(n => n.el.remove());\n    };\n  }, [count, ease, head, taper]);\n\n  return <div ref={host} aria-hidden />;\n}'
      };
    }
  });

  /* ── Swirl ────────────────────────────────────────────── */
  DB.push({
    id: 'swirl', name: 'Swirl', group: 'Trail',
    desc: 'A stroked canvas spline through the last N pointer samples, tapering to nothing at the tail. Midpoint quadratics keep it smooth with no maths library.',
    params: [
      { key: 'length', label: 'Samples', type: 'range', min: 8, max: 120, step: 2, value: 40 },
      { key: 'width', label: 'Head width', type: 'range', min: 2, max: 48, step: 1, value: 15, unit: 'px' },
      { key: 'alpha', label: 'Opacity', type: 'range', min: 0.1, max: 1, step: 0.05, value: 0.8 },
      { key: 'color', label: 'Colour', type: 'paint', value: { a: '#FFFFFF', b: '#5B9BF6', on: false, angle: 90 } }
    ],
    content: body('Swirl', 'quadratic midpoints'),
    mount: function (stage, p) {
      var c = FX.canvas(stage, { z: 3 }), ctx = c.ctx, pts = [];
      return FX.mount(stage, {
        resize: function () { c.fit(); },
        tick: function (s) {
          if (s.inside) pts.push({ x: s.x, y: s.y });
          while (pts.length > p.length) pts.shift();
          if (!s.inside && pts.length) pts.shift();
          ctx.clearRect(0, 0, s.w, s.h);
          for (var i = 1; i < pts.length - 1; i++) {
            var t = i / (pts.length - 1), a = pts[i], b = pts[i + 1];
            ctx.beginPath();
            ctx.moveTo(pts[i - 1].x, pts[i - 1].y);
            ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);
            ctx.lineWidth = t * p.width;
            ctx.lineCap = 'round';
            ctx.strokeStyle = FX.pc(p.color, t, t * p.alpha);
            ctx.stroke();
          }
        }
      }).destroy;
    },
    code: function (p) {
      return {
        css: '.silk{ position: fixed; inset: 0; z-index: 9999; pointer-events: none; }',
        js: 'const cv  = document.querySelector(\'.silk\');\nconst ctx = cv.getContext(\'2d\');\nconst dpr = Math.min(devicePixelRatio, 2);\n\nconst MAX   = ' + p.length + ';\nconst WIDTH = ' + p.width + ';\nconst ALPHA = ' + p.alpha + ';\n\nlet pts = [], mx = 0, my = 0, moved = false;\n\nfunction fit(){\n  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;\n  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);\n}\nfit(); addEventListener(\'resize\', fit);\naddEventListener(\'pointermove\', e => { mx = e.clientX; my = e.clientY; moved = true; }, { passive: true });\n\n' + FX.tintjs(p.color) + '\n\n(function loop(){\n  if (moved) pts.push({ x: mx, y: my });\n  if (pts.length > MAX) pts.shift();\n\n  ctx.clearRect(0, 0, innerWidth, innerHeight);\n\n  for (let i = 1; i < pts.length - 1; i++) {\n    const t = i / (pts.length - 1);        // 0 at the tail, 1 at the pointer\n    const a = pts[i], b = pts[i + 1];\n    ctx.beginPath();\n    ctx.moveTo(pts[i - 1].x, pts[i - 1].y);\n    ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);\n    ctx.lineWidth   = t * WIDTH;\n    ctx.lineCap     = \'round\';\n    ctx.strokeStyle = tint(t, t * ALPHA);\n    ctx.stroke();\n  }\n  requestAnimationFrame(loop);\n})();',
        react: 'import { useEffect, useRef } from \'react\';\n\nexport function Swirl({ length = ' + p.length + ', width = ' + p.width + ', alpha = ' + p.alpha + ' }) {\n  const ref = useRef(null);\n\n  useEffect(() => {\n    if (!matchMedia(\'(pointer: fine)\').matches) return;\n    const cv = ref.current, ctx = cv.getContext(\'2d\');\n    const dpr = Math.min(devicePixelRatio, 2);\n    let pts = [], mx = 0, my = 0, moved = false, id = 0;\n\n    const fit = () => {\n      cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;\n      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);\n    };\n    const move = (e) => { mx = e.clientX; my = e.clientY; moved = true; };\n    fit();\n    addEventListener(\'resize\', fit);\n    addEventListener(\'pointermove\', move, { passive: true });\n\n    ' + FX.tintjs(p.color).split('\n').join('\n    ') + '\n\n    const loop = () => {\n      if (moved) pts.push({ x: mx, y: my });\n      if (pts.length > length) pts.shift();\n      ctx.clearRect(0, 0, innerWidth, innerHeight);\n      for (let i = 1; i < pts.length - 1; i++) {\n        const t = i / (pts.length - 1);\n        const a = pts[i], b = pts[i + 1];\n        ctx.beginPath();\n        ctx.moveTo(pts[i - 1].x, pts[i - 1].y);\n        ctx.quadraticCurveTo(a.x, a.y, (a.x + b.x) / 2, (a.y + b.y) / 2);\n        ctx.lineWidth = t * width;\n        ctx.lineCap = \'round\';\n        ctx.strokeStyle = tint(t, t * alpha);\n        ctx.stroke();\n      }\n      id = requestAnimationFrame(loop);\n    };\n    id = requestAnimationFrame(loop);\n    return () => {\n      removeEventListener(\'resize\', fit);\n      removeEventListener(\'pointermove\', move);\n      cancelAnimationFrame(id);\n    };\n  }, [length, width, alpha]);\n\n  return <canvas ref={ref} className="silk" aria-hidden />;\n}'
      };
    }
  });

  /* ── Silky Ribbon ─────────────────────────────────────── */
  DB.push({
    id: 'silky', name: 'Silky Ribbon', group: 'Trail',
    desc: 'Not a stroke — a filled polygon built from two offset edges of the path. Because the outline is explicit, the ribbon can swell in the middle and pinch to a point at both ends.',
    params: [
      { key: 'length', label: 'Samples', type: 'range', min: 10, max: 90, step: 2, value: 44 },
      { key: 'width', label: 'Max width', type: 'range', min: 4, max: 60, step: 1, value: 22, unit: 'px' },
      { key: 'smooth', label: 'Smoothing', type: 'range', min: 0.05, max: 0.6, step: 0.01, value: 0.28 },
      { key: 'alpha', label: 'Opacity', type: 'range', min: 0.1, max: 1, step: 0.05, value: 0.85 },
      { key: 'color', label: 'Colour', type: 'paint', value: { a: '#FFFFFF', b: '#5B9BF6', on: false, angle: 90 } }
    ],
    content: body('Silky', 'filled ribbon, pinched at both ends'),
    mount: function (stage, p) {
      var c = FX.canvas(stage, { z: 3 }), ctx = c.ctx, pts = [];
      var hx = 0, hy = 0;
      return FX.mount(stage, {
        resize: function () { c.fit(); },
        enter: function (s) { hx = s.x; hy = s.y; },
        tick: function (s) {
          hx = lerp(hx, s.x, p.smooth); hy = lerp(hy, s.y, p.smooth);
          if (s.inside) pts.push({ x: hx, y: hy });
          while (pts.length > p.length) pts.shift();
          if (!s.inside && pts.length) pts.shift();

          ctx.clearRect(0, 0, s.w, s.h);
          if (pts.length < 4) return;

          var left = [], right = [];
          for (var i = 1; i < pts.length; i++) {
            var a = pts[i - 1], b = pts[i];
            var dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
            var nx = -dy / d, ny = dx / d;
            var t = i / (pts.length - 1);
            var w = Math.sin(t * Math.PI) * p.width * 0.5 + t * p.width * 0.18;
            left.push([b.x + nx * w, b.y + ny * w]);
            right.push([b.x - nx * w, b.y - ny * w]);
          }
          ctx.beginPath();
          ctx.moveTo(left[0][0], left[0][1]);
          for (var j = 1; j < left.length; j++) ctx.lineTo(left[j][0], left[j][1]);
          for (var k = right.length - 1; k >= 0; k--) ctx.lineTo(right[k][0], right[k][1]);
          ctx.closePath();
          /* one filled polygon, so this is the one place a real canvas
             gradient beats sampling — it runs tail-to-head along the ribbon */
          if (FX.pnorm(p.color).on) {
            var t0 = pts[0], t1 = pts[pts.length - 1];
            var g = ctx.createLinearGradient(t0.x, t0.y, t1.x, t1.y);
            g.addColorStop(0, FX.pc(p.color, 0, p.alpha));
            g.addColorStop(1, FX.pc(p.color, 1, p.alpha));
            ctx.fillStyle = g;
          } else {
            ctx.fillStyle = FX.pc(p.color, 0, p.alpha);
          }
          ctx.fill();
        }
      }).destroy;
    },
    code: function (p) {
      return {
        css: '.ribbon{ position: fixed; inset: 0; z-index: 9998; pointer-events: none; }',
        js: 'const cv  = document.querySelector(\'.ribbon\');\nconst ctx = cv.getContext(\'2d\');\nconst dpr = Math.min(devicePixelRatio, 2);\n\nconst MAX    = ' + p.length + ';\nconst WIDTH  = ' + p.width + ';\nconst SMOOTH = ' + p.smooth + ';   // lower = silkier, laggier\nconst ALPHA  = ' + p.alpha + ';\n\nlet pts = [], mx = 0, my = 0, hx = 0, hy = 0;\n\nfunction fit(){\n  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;\n  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);\n}\nfit(); addEventListener(\'resize\', fit);\naddEventListener(\'pointermove\', e => { mx = e.clientX; my = e.clientY; }, { passive: true });\n\n' + FX.tintjs(p.color) + '\n\n(function loop(){\n  hx += (mx - hx) * SMOOTH;        // smooth the head, then record it\n  hy += (my - hy) * SMOOTH;\n  pts.push({ x: hx, y: hy });\n  if (pts.length > MAX) pts.shift();\n\n  ctx.clearRect(0, 0, innerWidth, innerHeight);\n  if (pts.length < 4) return requestAnimationFrame(loop);\n\n  // walk the path once, offsetting each point along the normal\n  const left = [], right = [];\n  for (let i = 1; i < pts.length; i++) {\n    const a = pts[i - 1], b = pts[i];\n    const dx = b.x - a.x, dy = b.y - a.y;\n    const d  = Math.hypot(dx, dy) || 1;\n    const nx = -dy / d, ny = dx / d;                   // unit normal\n    const t  = i / (pts.length - 1);\n    const w  = Math.sin(t * Math.PI) * WIDTH * 0.5 + t * WIDTH * 0.18;\n    left.push([b.x + nx * w, b.y + ny * w]);\n    right.push([b.x - nx * w, b.y - ny * w]);\n  }\n\n  ctx.beginPath();\n  ctx.moveTo(left[0][0], left[0][1]);\n  for (let i = 1; i < left.length; i++) ctx.lineTo(left[i][0], left[i][1]);\n  for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);\n  ctx.closePath();\n  // one polygon, so a real canvas gradient beats sampling here\n  const g = ctx.createLinearGradient(pts[0].x, pts[0].y,\n                                     pts[pts.length - 1].x, pts[pts.length - 1].y);\n  g.addColorStop(0, tint(0, ALPHA));\n  g.addColorStop(1, tint(1, ALPHA));\n  ctx.fillStyle = g;\n  ctx.fill();\n\n  requestAnimationFrame(loop);\n})();',
        react: 'import { useEffect, useRef } from \'react\';\n\nexport function SilkyRibbon({ length = ' + p.length + ', width = ' + p.width + ', smooth = ' + p.smooth + ', alpha = ' + p.alpha + ' }) {\n  const ref = useRef(null);\n\n  useEffect(() => {\n    if (!matchMedia(\'(pointer: fine)\').matches) return;\n    const cv = ref.current, ctx = cv.getContext(\'2d\');\n    const dpr = Math.min(devicePixelRatio, 2);\n    let pts = [], mx = 0, my = 0, hx = 0, hy = 0, id = 0;\n\n    const fit = () => {\n      cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;\n      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);\n    };\n    const move = (e) => { mx = e.clientX; my = e.clientY; };\n    fit();\n    addEventListener(\'resize\', fit);\n    addEventListener(\'pointermove\', move, { passive: true });\n\n    ' + FX.tintjs(p.color).split('\n').join('\n    ') + '\n\n    const loop = () => {\n      hx += (mx - hx) * smooth; hy += (my - hy) * smooth;\n      pts.push({ x: hx, y: hy });\n      if (pts.length > length) pts.shift();\n      ctx.clearRect(0, 0, innerWidth, innerHeight);\n      if (pts.length >= 4) {\n        const left = [], right = [];\n        for (let i = 1; i < pts.length; i++) {\n          const a = pts[i - 1], b = pts[i];\n          const dx = b.x - a.x, dy = b.y - a.y;\n          const d = Math.hypot(dx, dy) || 1;\n          const nx = -dy / d, ny = dx / d;\n          const t = i / (pts.length - 1);\n          const w = Math.sin(t * Math.PI) * width * 0.5 + t * width * 0.18;\n          left.push([b.x + nx * w, b.y + ny * w]);\n          right.push([b.x - nx * w, b.y - ny * w]);\n        }\n        ctx.beginPath();\n        ctx.moveTo(left[0][0], left[0][1]);\n        for (let i = 1; i < left.length; i++) ctx.lineTo(left[i][0], left[i][1]);\n        for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);\n        ctx.closePath();\n        const g = ctx.createLinearGradient(pts[0].x, pts[0].y,\n                                           pts[pts.length - 1].x, pts[pts.length - 1].y);\n        g.addColorStop(0, tint(0, alpha));\n        g.addColorStop(1, tint(1, alpha));\n        ctx.fillStyle = g;\n        ctx.fill();\n      }\n      id = requestAnimationFrame(loop);\n    };\n    id = requestAnimationFrame(loop);\n    return () => {\n      removeEventListener(\'resize\', fit);\n      removeEventListener(\'pointermove\', move);\n      cancelAnimationFrame(id);\n    };\n  }, [length, width, smooth, alpha]);\n\n  return <canvas ref={ref} className="ribbon" aria-hidden />;\n}'
      };
    }
  });

  /* ── Pixel Trail ──────────────────────────────────────── */
  DB.push({
    id: 'pixel-trail', name: 'Pixel Trail', group: 'Trail',
    desc: 'The pointer path is quantised to a grid; every touched cell ignites, then decays. Gaps between frames are interpolated so fast moves stay solid.',
    params: [
      { key: 'cell', label: 'Cell', type: 'range', min: 6, max: 48, step: 2, value: 20, unit: 'px' },
      { key: 'decay', label: 'Decay', type: 'range', min: 0.8, max: 0.99, step: 0.01, value: 0.94 },
      { key: 'gap', label: 'Grid gap', type: 'range', min: 0, max: 6, step: 1, value: 2, unit: 'px' },
      { key: 'color', label: 'Colour', type: 'paint', value: { a: '#FFFFFF', b: '#5B9BF6', on: false, angle: 90 } }
    ],
    content: body('Pixelate', 'quantise · ignite · decay'),
    mount: function (stage, p) {
      var c = FX.canvas(stage, { z: 3 }), ctx = c.ctx, cells = {};
      return FX.mount(stage, {
        resize: function () { c.fit(); },
        move: function (s) {
          var steps = Math.min(Math.round(Math.hypot(s.vx, s.vy) / p.cell), 10);
          for (var i = 0; i <= steps; i++) {
            var k = i / Math.max(steps, 1);
            var kx = Math.floor((s.px + (s.x - s.px) * k) / p.cell);
            var ky = Math.floor((s.py + (s.y - s.py) * k) / p.cell);
            cells[kx + '|' + ky] = 1;
          }
        },
        tick: function (s) {
          ctx.clearRect(0, 0, s.w, s.h);
          for (var k in cells) {
            var v = cells[k] *= p.decay;
            if (v < .02) { delete cells[k]; continue; }
            var q = k.split('|');
            ctx.fillStyle = FX.pc(p.color, 1 - v, v);
            ctx.fillRect(q[0] * p.cell + p.gap / 2, q[1] * p.cell + p.gap / 2, p.cell - p.gap, p.cell - p.gap);
          }
        }
      }).destroy;
    },
    code: function (p) {
      return {
        css: '.pixels{ position: fixed; inset: 0; z-index: 9998; pointer-events: none; }',
        js: 'const cv  = document.querySelector(\'.pixels\');\nconst ctx = cv.getContext(\'2d\');\nconst dpr = Math.min(devicePixelRatio, 2);\n\nconst CELL  = ' + p.cell + ';\nconst DECAY = ' + p.decay + ';   // brightness kept per frame\nconst GAP   = ' + p.gap + ';\nconst cells = new Map();     // "col|row" -> brightness 0…1\n\nfunction fit(){\n  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;\n  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);\n}\nfit(); addEventListener(\'resize\', fit);\n\nlet px = 0, py = 0;\naddEventListener(\'pointermove\', (e) => {\n  // interpolate between frames so fast moves do not leave holes\n  const steps = Math.min(Math.round(Math.hypot(e.clientX - px, e.clientY - py) / CELL), 10);\n  for (let i = 0; i <= steps; i++) {\n    const k = i / Math.max(steps, 1);\n    const x = px + (e.clientX - px) * k;\n    const y = py + (e.clientY - py) * k;\n    cells.set(`${Math.floor(x / CELL)}|${Math.floor(y / CELL)}`, 1);\n  }\n  px = e.clientX; py = e.clientY;\n}, { passive: true });\n\n' + FX.tintjs(p.color) + '\n\n(function loop(){\n  ctx.clearRect(0, 0, innerWidth, innerHeight);\n  for (const [key, v] of cells) {\n    const next = v * DECAY;\n    if (next < 0.02) { cells.delete(key); continue; }\n    cells.set(key, next);\n    const [c, r] = key.split(\'|\').map(Number);\n    ctx.fillStyle = tint(1 - next, next);\n    ctx.fillRect(c * CELL + GAP / 2, r * CELL + GAP / 2, CELL - GAP, CELL - GAP);\n  }\n  requestAnimationFrame(loop);\n})();',
        react: 'import { useEffect, useRef } from \'react\';\n\nexport function PixelTrail({ cell = ' + p.cell + ', decay = ' + p.decay + ', gap = ' + p.gap + ' }) {\n  const ref = useRef(null);\n\n  useEffect(() => {\n    if (!matchMedia(\'(pointer: fine)\').matches) return;\n    const cv = ref.current, ctx = cv.getContext(\'2d\');\n    const dpr = Math.min(devicePixelRatio, 2);\n    const cells = new Map();\n    let px = 0, py = 0, id = 0;\n\n    const fit = () => {\n      cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;\n      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);\n    };\n    const move = (e) => {\n      const steps = Math.min(Math.round(Math.hypot(e.clientX - px, e.clientY - py) / cell), 10);\n      for (let i = 0; i <= steps; i++) {\n        const k = i / Math.max(steps, 1);\n        const x = px + (e.clientX - px) * k;\n        const y = py + (e.clientY - py) * k;\n        cells.set(`${Math.floor(x / cell)}|${Math.floor(y / cell)}`, 1);\n      }\n      px = e.clientX; py = e.clientY;\n    };\n    fit();\n    addEventListener(\'resize\', fit);\n    addEventListener(\'pointermove\', move, { passive: true });\n\n    ' + FX.tintjs(p.color).split('\n').join('\n    ') + '\n\n    const loop = () => {\n      ctx.clearRect(0, 0, innerWidth, innerHeight);\n      for (const [key, v] of cells) {\n        const next = v * decay;\n        if (next < 0.02) { cells.delete(key); continue; }\n        cells.set(key, next);\n        const [c, r] = key.split(\'|\').map(Number);\n        ctx.fillStyle = tint(1 - next, next);\n        ctx.fillRect(c * cell + gap / 2, r * cell + gap / 2, cell - gap, cell - gap);\n      }\n      id = requestAnimationFrame(loop);\n    };\n    id = requestAnimationFrame(loop);\n    return () => {\n      removeEventListener(\'resize\', fit);\n      removeEventListener(\'pointermove\', move);\n      cancelAnimationFrame(id);\n    };\n  }, [cell, decay, gap]);\n\n  return <canvas ref={ref} className="pixels" aria-hidden />;\n}'
      };
    }
  });

  /* ── Fluid Smoke ──────────────────────────────────────── */
  DB.push({
    id: 'fluid-smoke', name: 'Fluid Smoke', group: 'Trail',
    desc: 'Particles inherit the pointer velocity, then drift under drag, buoyancy and a little curl, drawn with additive blending. A WebGL read at canvas cost.',
    params: [
      { key: 'rate', label: 'Density', type: 'range', min: 1, max: 14, step: 1, value: 6 },
      { key: 'radius', label: 'Puff size', type: 'range', min: 6, max: 70, step: 2, value: 30, unit: 'px' },
      { key: 'drag', label: 'Drag', type: 'range', min: 0.86, max: 0.995, step: 0.005, value: 0.94 },
      { key: 'lift', label: 'Buoyancy', type: 'range', min: -0.3, max: 0.3, step: 0.02, value: 0.06 },
      { key: 'color', label: 'Colour', type: 'paint', value: { a: '#FFFFFF', b: '#5B9BF6', on: false, angle: 90 } }
    ],
    content: body('Stir the air', 'additive · drag · curl'),
    mount: function (stage, p) {
      var c = FX.canvas(stage, { z: 3 }), ctx = c.ctx, ps = [];
      return FX.mount(stage, {
        resize: function () { c.fit(); },
        move: function (s) {
          var sp = Math.hypot(s.vx, s.vy), n = clamp(Math.round(sp / 3), 1, p.rate);
          for (var i = 0; i < n; i++) {
            ps.push({
              x: s.x + rand(-6, 6), y: s.y + rand(-6, 6),
              vx: s.vx * rand(.1, .34) + rand(-.6, .6),
              vy: s.vy * rand(.1, .34) + rand(-.6, .6),
              r: rand(p.radius * .34, p.radius), life: 1
            });
          }
          if (ps.length > 460) ps.splice(0, ps.length - 460);
        },
        tick: function (s, t) {
          ctx.clearRect(0, 0, s.w, s.h);
          ctx.globalCompositeOperation = 'lighter';
          for (var i = ps.length - 1; i >= 0; i--) {
            var q = ps[i];
            q.life -= .014;
            if (q.life <= 0) { ps.splice(i, 1); continue; }
            q.vx *= p.drag; q.vy *= p.drag; q.vy -= p.lift;
            q.vx += Math.sin((q.y + t * .02) * .01) * .05;
            q.x += q.vx; q.y += q.vy; q.r += .5;
            var g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r);
            g.addColorStop(0, FX.pc(p.color, 1 - q.life, q.life * .16));
            g.addColorStop(1, FX.pc(p.color, 1 - q.life, 0));
            ctx.fillStyle = g;
            ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.2832); ctx.fill();
          }
          ctx.globalCompositeOperation = 'source-over';
        }
      }).destroy;
    },
    code: function (p) {
      return {
        css: '.smoke{ position: fixed; inset: 0; z-index: 9998; pointer-events: none; }',
        js: 'const cv  = document.querySelector(\'.smoke\');\nconst ctx = cv.getContext(\'2d\');\nconst dpr = Math.min(devicePixelRatio, 2);\n\nconst RATE   = ' + p.rate + ';     // max particles per pointer event\nconst RADIUS = ' + p.radius + ';\nconst DRAG   = ' + p.drag + ';\nconst LIFT   = ' + p.lift + ';\nconst MAX    = 460;\n\nlet ps = [], px = 0, py = 0;\nconst rand = (a, b) => a + Math.random() * (b - a);\n\nfunction fit(){\n  cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;\n  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);\n}\nfit(); addEventListener(\'resize\', fit);\n\naddEventListener(\'pointermove\', (e) => {\n  const vx = e.clientX - px, vy = e.clientY - py;\n  px = e.clientX; py = e.clientY;\n\n  const n = Math.max(1, Math.min(Math.round(Math.hypot(vx, vy) / 3), RATE));\n  for (let i = 0; i < n; i++) ps.push({\n    x: px + rand(-6, 6), y: py + rand(-6, 6),\n    vx: vx * rand(.1, .34) + rand(-.6, .6),\n    vy: vy * rand(.1, .34) + rand(-.6, .6),\n    r: rand(RADIUS * 0.34, RADIUS), life: 1\n  });\n  if (ps.length > MAX) ps.splice(0, ps.length - MAX);\n}, { passive: true });\n\n' + FX.tintjs(p.color) + '\n\n(function loop(t){\n  ctx.clearRect(0, 0, innerWidth, innerHeight);\n  ctx.globalCompositeOperation = \'lighter\';          // additive = glow\n\n  for (let i = ps.length - 1; i >= 0; i--) {\n    const q = ps[i];\n    q.life -= 0.014;\n    if (q.life <= 0) { ps.splice(i, 1); continue; }\n\n    q.vx *= DRAG; q.vy *= DRAG;\n    q.vy -= LIFT;                                     // negative = it sinks\n    q.vx += Math.sin((q.y + t * 0.02) * 0.01) * 0.05; // curl\n    q.x += q.vx; q.y += q.vy; q.r += 0.5;\n\n    const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r);\n    g.addColorStop(0, tint(1 - q.life, q.life * 0.16));\n    g.addColorStop(1, tint(1 - q.life, 0));\n    ctx.fillStyle = g;\n    ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.fill();\n  }\n\n  ctx.globalCompositeOperation = \'source-over\';\n  requestAnimationFrame(loop);\n})(0);',
        react: 'import { useEffect, useRef } from \'react\';\n\nconst rand = (a, b) => a + Math.random() * (b - a);\n\nexport function FluidSmoke({\n  rate = ' + p.rate + ', radius = ' + p.radius + ', drag = ' + p.drag + ', lift = ' + p.lift + ', max = 460\n}) {\n  const ref = useRef(null);\n\n  useEffect(() => {\n    if (!matchMedia(\'(pointer: fine)\').matches) return;\n    const cv = ref.current, ctx = cv.getContext(\'2d\');\n    const dpr = Math.min(devicePixelRatio, 2);\n    let ps = [], px = 0, py = 0, id = 0;\n\n    const fit = () => {\n      cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;\n      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);\n    };\n    const move = (e) => {\n      const vx = e.clientX - px, vy = e.clientY - py;\n      px = e.clientX; py = e.clientY;\n      const n = Math.max(1, Math.min(Math.round(Math.hypot(vx, vy) / 3), rate));\n      for (let i = 0; i < n; i++) ps.push({\n        x: px + rand(-6, 6), y: py + rand(-6, 6),\n        vx: vx * rand(.1, .34) + rand(-.6, .6),\n        vy: vy * rand(.1, .34) + rand(-.6, .6),\n        r: rand(radius * 0.34, radius), life: 1\n      });\n      if (ps.length > max) ps.splice(0, ps.length - max);\n    };\n    fit();\n    addEventListener(\'resize\', fit);\n    addEventListener(\'pointermove\', move, { passive: true });\n\n    ' + FX.tintjs(p.color).split('\n').join('\n    ') + '\n\n    const loop = (t) => {\n      ctx.clearRect(0, 0, innerWidth, innerHeight);\n      ctx.globalCompositeOperation = \'lighter\';\n      for (let i = ps.length - 1; i >= 0; i--) {\n        const q = ps[i];\n        q.life -= 0.014;\n        if (q.life <= 0) { ps.splice(i, 1); continue; }\n        q.vx *= drag; q.vy *= drag; q.vy -= lift;\n        q.vx += Math.sin((q.y + t * 0.02) * 0.01) * 0.05;\n        q.x += q.vx; q.y += q.vy; q.r += 0.5;\n        const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.r);\n        g.addColorStop(0, tint(1 - q.life, q.life * 0.16));\n        g.addColorStop(1, tint(1 - q.life, 0));\n        ctx.fillStyle = g;\n        ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.fill();\n      }\n      ctx.globalCompositeOperation = \'source-over\';\n      id = requestAnimationFrame(loop);\n    };\n    id = requestAnimationFrame(loop);\n    return () => {\n      removeEventListener(\'resize\', fit);\n      removeEventListener(\'pointermove\', move);\n      cancelAnimationFrame(id);\n    };\n  }, [rate, radius, drag, lift, max]);\n\n  return <canvas ref={ref} className="smoke" aria-hidden />;\n}'
      };
    }
  });

  /* ── Cursor Ghost ─────────────────────────────────────── */
  DB.push({
    id: 'ghost', name: 'Cursor Ghost', group: 'Trail',
    desc: 'Copies of the arrow itself, each one lagging harder and blurring more than the last. Because they are the same silhouette, the trail reads as motion smear instead of decoration.',
    params: [
      { key: 'count', label: 'Ghosts', type: 'range', min: 2, max: 12, step: 1, value: 6, rebuild: true },
      { key: 'size', label: 'Size', type: 'range', min: 14, max: 60, step: 1, value: 26, unit: 'px' },
      { key: 'ease', label: 'Head follow', type: 'range', min: 0.06, max: 0.6, step: 0.02, value: 0.26 },
      { key: 'blur', label: 'Smear', type: 'range', min: 0, max: 14, step: 0.5, value: 5, unit: 'px' },
      { key: 'color', label: 'Colour', type: 'paint', value: { a: '#FFFFFF', b: '#5B9BF6', on: false, angle: 90 } }
    ],
    content: body('Smear', 'same shape · deeper lag'),
    mount: function (stage, p) {
      var l = FX.layer(stage), gs = [];
      for (var i = 0; i < p.count; i++) {
        var g = make(BASE + 'opacity:0;transition:opacity .35s');
        l.appendChild(g);
        gs.push({ el: g, x: 0, y: 0, t: i / Math.max(p.count - 1, 1) });
      }
      gs.reverse();
      return FX.mount(stage, {
        enter: function (s) { gs.forEach(function (g) { g.x = s.x; g.y = s.y; g.el.style.opacity = 1; }); },
        leave: function () { gs.forEach(function (g) { g.el.style.opacity = 0; }); },
        tick: function (s) {
          gs.forEach(function (g) {
            var e = p.ease * (1 - g.t * 0.8);
            g.x = lerp(g.x, s.x, Math.max(e, 0.03));
            g.y = lerp(g.y, s.y, Math.max(e, 0.03));
            g.el.style.width = g.el.style.height = p.size + 'px';
            g.el.style.filter = 'blur(' + (g.t * p.blur) + 'px)';
            g.el.style.opacity = 1 - g.t * 0.72;
            g.el.innerHTML = '<svg viewBox="0 0 24 24" width="' + p.size + '" height="' + p.size + '">' +
              '<path d="M5 2l14 7-6 1.7L11 18z" fill="' + FX.pat(p.color, g.t) + '"/></svg>';
            g.el.style.transform = 'translate3d(' + g.x + 'px,' + g.y + 'px,0)';
          });
        }
      }).destroy;
    },
    code: function (p) {
      return {
        css: '.ghost{\n  position: fixed; top: 0; left: 0; z-index: 9998;\n  width: ' + p.size + 'px; height: ' + p.size + 'px;\n  pointer-events: none; will-change: transform;\n}\nbody { cursor: none; }',
        js: '' + FX.tintjs(p.color) + '\n\nconst N     = ' + p.count + ';\nconst EASE  = ' + p.ease + ';   // ease of the sharpest ghost\nconst BLUR  = ' + p.blur + ';   // smear of the deepest one\nconst arrow = (c) => `<svg viewBox="0 0 24 24" width="' + p.size + '" height="' + p.size + '">` +\n              `<path d="M5 2l14 7-6 1.7L11 18z" fill="${c}"/></svg>`;\n\n// build back-to-front so the sharpest copy paints last\nconst ghosts = Array.from({ length: N }, (_, i) => {\n  const t  = i / (N - 1);\n  const el = document.createElement(\'div\');\n  el.className = \'ghost\';\n  el.innerHTML = arrow(tint(t, 1));\n  el.style.filter  = `blur(${t * BLUR}px)`;\n  el.style.opacity = 1 - t * 0.72;\n  document.body.appendChild(el);\n  return { el, x: 0, y: 0, ease: Math.max(EASE * (1 - t * 0.8), 0.03) };\n}).reverse();\n\nlet mx = 0, my = 0;\naddEventListener(\'pointermove\', e => { mx = e.clientX; my = e.clientY; }, { passive: true });\n\n(function loop(){\n  for (const g of ghosts) {\n    g.x += (mx - g.x) * g.ease;\n    g.y += (my - g.y) * g.ease;\n    g.el.style.transform = `translate3d(${g.x}px, ${g.y}px, 0)`;\n  }\n  requestAnimationFrame(loop);\n})();\n\n/* Blur is expensive: six small nodes are fine, sixty are not. */',
        react: 'import { useEffect, useRef } from \'react\';\n\nexport function CursorGhost({\n  count = ' + p.count + ', size = ' + p.size + ', ease = ' + p.ease + ', blur = ' + p.blur + '\n}) {\n  const host = useRef(null);\n\n  useEffect(() => {\n    if (!matchMedia(\'(pointer: fine)\').matches) return;\n    ' + FX.tintjs(p.color).split('\n').join('\n    ') + '\n    const arrow = (c) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}">` +\n                  `<path d="M5 2l14 7-6 1.7L11 18z" fill="${c}"/></svg>`;\n    const ghosts = Array.from({ length: count }, (_, i) => {\n      const t = i / (count - 1);\n      const el = document.createElement(\'div\');\n      el.className = \'ghost\';\n      el.innerHTML = arrow(tint(t, 1));\n      el.style.filter = `blur(${t * blur}px)`;\n      el.style.opacity = String(1 - t * 0.72);\n      host.current.appendChild(el);\n      return { el, x: 0, y: 0, ease: Math.max(ease * (1 - t * 0.8), 0.03) };\n    }).reverse();\n\n    let mx = 0, my = 0, id = 0;\n    const move = (e) => { mx = e.clientX; my = e.clientY; };\n    addEventListener(\'pointermove\', move, { passive: true });\n\n\n    const loop = () => {\n      for (const g of ghosts) {\n        g.x += (mx - g.x) * g.ease;\n        g.y += (my - g.y) * g.ease;\n        g.el.style.transform = `translate3d(${g.x}px,${g.y}px,0)`;\n      }\n      id = requestAnimationFrame(loop);\n    };\n    id = requestAnimationFrame(loop);\n    return () => {\n      removeEventListener(\'pointermove\', move);\n      cancelAnimationFrame(id);\n      ghosts.forEach(g => g.el.remove());\n    };\n  }, [count, size, ease, blur, color]);\n\n  return <div ref={host} aria-hidden />;\n}'
      };
    }
  });

})();
