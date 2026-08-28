/* ============================================================
   cursor lab — ANIMATED / Pointer
   Cursors that replace the arrow with a single object.
   Every entry: params -> live object p -> mount(stage, p)
                and code(p) generated from the tuned values.
   ============================================================ */
(function () {
  'use strict';

  var DB = window.ANIM_DB = window.ANIM_DB || [];
  var lerp = FX.lerp, clamp = FX.clamp, rand = FX.rand, rgba = FX.rgba;
  var BASE = 'position:absolute;top:0;left:0;will-change:transform;';
  function make(css) { var d = document.createElement('div'); d.style.cssText = css; return d; }
  function body(title, note, extra) {
    return '<div class="stage__body"><p class="stage__title">' + title + '</p>' +
      (extra || '') + '<p class="stage__note">' + note + '</p></div>';
  }

  /* ── 01 · Dot & Ring ──────────────────────────────────── */
  DB.push({
    id: 'dot-ring', name: 'Dot & Ring', group: 'Pointer',
    desc: 'A dot pinned 1:1 to the pointer and an outline ring lagging behind on a lerp. The ring inflates over anything interactive.',
    params: [
      { key: 'ease', label: 'Follow', type: 'range', min: 0.04, max: 0.4, step: 0.01, value: 0.14 },
      { key: 'ring', label: 'Ring size', type: 'range', min: 18, max: 90, step: 1, value: 36, unit: 'px' },
      { key: 'dot', label: 'Dot size', type: 'range', min: 0, max: 16, step: 1, value: 6, unit: 'px' },
      { key: 'grow', label: 'Hover scale', type: 'range', min: 1, max: 3, step: 0.05, value: 1.9, unit: '×' },
      { key: 'color', label: 'Colour', type: 'paint', value: { a: '#FFFFFF', b: '#5B9BF6', on: false, angle: 90 } }
    ],
    content: body('Two layers.', 'ring lags · dot does not', '<button class="ghost-chip" data-hot>hover me</button>'),
    mount: function (stage, p) {
      var l = FX.layer(stage);
      var dot = make(BASE + 'border-radius:50%;opacity:0;transition:opacity .3s');
      var ring = make(BASE + 'border-radius:50%;opacity:0;transition:opacity .3s');
      l.appendChild(ring); l.appendChild(dot);
      var rx = 0, ry = 0, sc = 1, want = 1;
      [].forEach.call(stage.querySelectorAll('[data-hot]'), function (h) {
        h.addEventListener('pointerenter', function () { want = p.grow; });
        h.addEventListener('pointerleave', function () { want = 1; });
      });
      return FX.mount(stage, {
        enter: function (s) { rx = s.x; ry = s.y; dot.style.opacity = 1; ring.style.opacity = 1; },
        leave: function () { dot.style.opacity = 0; ring.style.opacity = 0; want = 1; },
        tick: function (s) {
          rx = lerp(rx, s.x, p.ease); ry = lerp(ry, s.y, p.ease);
          sc = lerp(sc, want, 0.12);
          dot.style.cssText = BASE + 'border-radius:50%;width:' + p.dot + 'px;height:' + p.dot + 'px;margin:' + (-p.dot / 2) + 'px 0 0 ' + (-p.dot / 2) + 'px;background:' + FX.pat(p.color, 0) + ';opacity:1;transform:translate3d(' + s.x + 'px,' + s.y + 'px,0)';
          ring.style.cssText = BASE + 'border-radius:50%;width:' + p.ring + 'px;height:' + p.ring + 'px;margin:' + (-p.ring / 2) + 'px 0 0 ' + (-p.ring / 2) + 'px;border:1px solid ' + FX.pc(p.color, 1, .6) + ';background:' + FX.pc(p.color, 1, (sc - 1) * .12) + ';opacity:1;transform:translate3d(' + rx + 'px,' + ry + 'px,0) scale(' + sc + ')';
        }
      }).destroy;
    },
    code: function (p) {
      return {
        css: '.cursor-dot,\n.cursor-ring{\n  position: fixed; top: 0; left: 0; z-index: 9999;\n  pointer-events: none; will-change: transform;\n  border-radius: 50%;\n}\n.cursor-dot{\n  width: ' + p.dot + 'px; height: ' + p.dot + 'px;\n  margin: ' + (-p.dot / 2) + 'px 0 0 ' + (-p.dot / 2) + 'px;\n  background: ' + FX.pcss(p.color) + ';\n}\n.cursor-ring{\n  width: ' + p.ring + 'px; height: ' + p.ring + 'px;\n  margin: ' + (-p.ring / 2) + 'px 0 0 ' + (-p.ring / 2) + 'px;\n  border: 1px solid ' + FX.pc(p.color, 1, 0.6) + ';\n}\n\nbody, a, button { cursor: none; }',
        js: 'const dot  = document.querySelector(\'.cursor-dot\');\nconst ring = document.querySelector(\'.cursor-ring\');\n\nconst EASE = ' + p.ease + ';      // 0 = never arrives, 1 = no lag\nconst GROW = ' + p.grow + ';      // ring scale over interactive targets\n\nlet mx = innerWidth / 2, my = innerHeight / 2;\nlet rx = mx, ry = my, scale = 1, want = 1;\n\naddEventListener(\'pointermove\', e => { mx = e.clientX; my = e.clientY; }, { passive: true });\naddEventListener(\'pointerover\', e => {\n  want = e.target.closest(\'a, button, [data-cursor-hover]\') ? GROW : 1;\n});\n\n(function loop(){\n  rx += (mx - rx) * EASE;\n  ry += (my - ry) * EASE;\n  scale += (want - scale) * 0.12;\n\n  dot.style.transform  = `translate3d(${mx}px, ${my}px, 0)`;\n  ring.style.transform = `translate3d(${rx}px, ${ry}px, 0) scale(${scale})`;\n  requestAnimationFrame(loop);\n})();',
        react: 'import { useEffect, useRef } from \'react\';\n\nexport function DotRingCursor({ ease = ' + p.ease + ', grow = ' + p.grow + ' }) {\n  const dot = useRef(null), ring = useRef(null);\n\n  useEffect(() => {\n    if (!matchMedia(\'(pointer: fine)\').matches) return;\n    let mx = innerWidth / 2, my = innerHeight / 2;\n    let rx = mx, ry = my, scale = 1, want = 1, id = 0;\n\n    const move = (e) => { mx = e.clientX; my = e.clientY; };\n    const over = (e) => { want = e.target.closest?.(\'a, button, [data-cursor-hover]\') ? grow : 1; };\n    addEventListener(\'pointermove\', move, { passive: true });\n    addEventListener(\'pointerover\', over);\n\n    const loop = () => {\n      rx += (mx - rx) * ease; ry += (my - ry) * ease;\n      scale += (want - scale) * 0.12;\n      if (dot.current)  dot.current.style.transform  = `translate3d(${mx}px,${my}px,0)`;\n      if (ring.current) ring.current.style.transform = `translate3d(${rx}px,${ry}px,0) scale(${scale})`;\n      id = requestAnimationFrame(loop);\n    };\n    id = requestAnimationFrame(loop);\n    return () => {\n      removeEventListener(\'pointermove\', move);\n      removeEventListener(\'pointerover\', over);\n      cancelAnimationFrame(id);\n    };\n  }, [ease, grow]);\n\n  return (<>\n    <div ref={ring} className="cursor-ring" aria-hidden />\n    <div ref={dot} className="cursor-dot" aria-hidden />\n  </>);\n}'
      };
    }
  });

  /* ── 02 · Velocity Squish ─────────────────────────────── */
  DB.push({
    id: 'squish', name: 'Velocity Squish', group: 'Pointer',
    desc: 'The cursor deforms along its own direction of travel — atan2 gives the angle, speed drives scaleX up and scaleY down.',
    params: [
      { key: 'size', label: 'Size', type: 'range', min: 14, max: 80, step: 1, value: 34, unit: 'px' },
      { key: 'ease', label: 'Follow', type: 'range', min: 0.06, max: 0.4, step: 0.01, value: 0.16 },
      { key: 'power', label: 'Deform', type: 'range', min: 0.1, max: 1.2, step: 0.02, value: 0.72 },
      { key: 'invert', label: 'Difference blend', type: 'switch', value: true },
      { key: 'color', label: 'Colour', type: 'paint', value: { a: '#FFFFFF', b: '#5B9BF6', on: false, angle: 90 } }
    ],
    content: body('Flick it fast.', 'scaleX up · scaleY down'),
    mount: function (stage, p) {
      var l = FX.layer(stage);
      var c = make(BASE + 'border-radius:50%;opacity:0;transition:opacity .3s');
      l.appendChild(c);
      var x = 0, y = 0, sx = 1, sy = 1, rot = 0;
      return FX.mount(stage, {
        enter: function (s) { x = s.x; y = s.y; c.style.opacity = 1; },
        leave: function () { c.style.opacity = 0; },
        tick: function (s) {
          var dx = s.x - x, dy = s.y - y;
          x += dx * p.ease; y += dy * p.ease;
          var speed = Math.min(Math.sqrt(dx * dx + dy * dy) / 44, p.power);
          if (speed > .02) rot = Math.atan2(dy, dx) * 180 / Math.PI;
          sx = lerp(sx, 1 + speed, .18);
          sy = lerp(sy, 1 - speed * .78, .18);
          c.style.width = c.style.height = p.size + 'px';
          c.style.margin = (-p.size / 2) + 'px 0 0 ' + (-p.size / 2) + 'px';
          c.style.background = FX.pcss(p.color);
          c.style.mixBlendMode = p.invert ? 'difference' : 'normal';
          c.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) rotate(' + rot + 'deg) scale(' + sx + ',' + sy + ')';
        }
      }).destroy;
    },
    code: function (p) {
      return {
        css: '.squish-cursor{\n  position: fixed; top: 0; left: 0; z-index: 9999;\n  width: ' + p.size + 'px; height: ' + p.size + 'px;\n  margin: ' + (-p.size / 2) + 'px 0 0 ' + (-p.size / 2) + 'px;\n  border-radius: 50%; background: ' + FX.pcss(p.color) + ';\n' + (p.invert ? '  mix-blend-mode: difference;   /* legible on any background */\n' : '') + '  pointer-events: none; will-change: transform;\n}\nbody { cursor: none; }',
        js: 'const el = document.querySelector(\'.squish-cursor\');\n\nconst EASE  = ' + p.ease + ';\nconst POWER = ' + p.power + ';   // maximum deformation\n\nlet mx = 0, my = 0, x = 0, y = 0, sx = 1, sy = 1, rot = 0;\naddEventListener(\'pointermove\', e => { mx = e.clientX; my = e.clientY; }, { passive: true });\n\n(function loop(){\n  const dx = mx - x, dy = my - y;\n  x += dx * EASE;\n  y += dy * EASE;\n\n  const speed = Math.min(Math.hypot(dx, dy) / 44, POWER);\n  if (speed > 0.02) rot = Math.atan2(dy, dx) * 180 / Math.PI;\n\n  sx += ((1 + speed)        - sx) * 0.18;   // stretch along travel\n  sy += ((1 - speed * 0.78) - sy) * 0.18;   // squash across it\n\n  el.style.transform =\n    `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg) scale(${sx}, ${sy})`;\n  requestAnimationFrame(loop);\n})();',
        react: 'import { useEffect, useRef } from \'react\';\n\nexport function SquishCursor({ size = ' + p.size + ', ease = ' + p.ease + ', power = ' + p.power + ' }) {\n  const ref = useRef(null);\n\n  useEffect(() => {\n    if (!matchMedia(\'(pointer: fine)\').matches) return;\n    let mx = 0, my = 0, x = 0, y = 0, sx = 1, sy = 1, rot = 0, id = 0;\n    const move = (e) => { mx = e.clientX; my = e.clientY; };\n    addEventListener(\'pointermove\', move, { passive: true });\n\n    const loop = () => {\n      const dx = mx - x, dy = my - y;\n      x += dx * ease; y += dy * ease;\n      const speed = Math.min(Math.hypot(dx, dy) / 44, power);\n      if (speed > 0.02) rot = Math.atan2(dy, dx) * 180 / Math.PI;\n      sx += ((1 + speed) - sx) * 0.18;\n      sy += ((1 - speed * 0.78) - sy) * 0.18;\n      if (ref.current) ref.current.style.transform =\n        `translate3d(${x}px,${y}px,0) rotate(${rot}deg) scale(${sx},${sy})`;\n      id = requestAnimationFrame(loop);\n    };\n    id = requestAnimationFrame(loop);\n    return () => { removeEventListener(\'pointermove\', move); cancelAnimationFrame(id); };\n  }, [ease, power]);\n\n  return <div ref={ref} className="squish-cursor" aria-hidden\n              style={{ width: size, height: size, margin: `${-size / 2}px 0 0 ${-size / 2}px` }} />;\n}'
      };
    }
  });

  /* ── 03 · Crosshair HUD ───────────────────────────────── */
  DB.push({
    id: 'crosshair', name: 'Crosshair HUD', group: 'Pointer',
    desc: 'Full-bleed guide lines plus a live coordinate readout. No lerp anywhere — a lagging crosshair reads as broken.',
    params: [
      { key: 'box', label: 'Box size', type: 'range', min: 6, max: 44, step: 1, value: 16, unit: 'px' },
      { key: 'lines', label: 'Line opacity', type: 'range', min: 0.05, max: 0.8, step: 0.05, value: 0.3 },
      { key: 'readout', label: 'Coordinates', type: 'switch', value: true },
      { key: 'color', label: 'Colour', type: 'paint', value: { a: '#FFFFFF', b: '#5B9BF6', on: false, angle: 90 } }
    ],
    content: body('Precision.', 'x · y update every frame'),
    mount: function (stage, p) {
      var l = FX.layer(stage);
      var v = make('position:absolute;top:0;bottom:0;width:1px;opacity:0;transition:opacity .3s;will-change:transform');
      var h = make('position:absolute;left:0;right:0;height:1px;opacity:0;transition:opacity .3s;will-change:transform');
      var box = make(BASE + 'border-radius:2px;opacity:0;transition:opacity .3s');
      var tag = make(BASE + 'padding:2px 6px;border-radius:5px;font-family:var(--font-mono);font-size:10px;white-space:nowrap;opacity:0;transition:opacity .3s');
      [v, h, box, tag].forEach(function (n) { l.appendChild(n); });
      var on = 0;
      return FX.mount(stage, {
        enter: function () { on = 1; }, leave: function () { on = 0; },
        tick: function (s) {
          v.style.background = FX.pc(p.color, 0, p.lines); h.style.background = FX.pc(p.color, 1, p.lines);
          v.style.opacity = h.style.opacity = box.style.opacity = on;
          tag.style.opacity = on && p.readout ? 1 : 0;
          box.style.width = box.style.height = p.box + 'px';
          box.style.margin = (-p.box / 2) + 'px 0 0 ' + (-p.box / 2) + 'px';
          box.style.border = '1px solid ' + FX.pat(p.color, 0.5);
          tag.style.color = FX.pat(p.color, 1);
          tag.style.border = '1px solid ' + FX.pc(p.color, 1, .18);
          v.style.transform = 'translate3d(' + s.x + 'px,0,0)';
          h.style.transform = 'translate3d(0,' + s.y + 'px,0)';
          box.style.transform = 'translate3d(' + s.x + 'px,' + s.y + 'px,0)';
          tag.style.transform = 'translate3d(' + (s.x + 13) + 'px,' + (s.y + 13) + 'px,0)';
          tag.textContent = Math.round(s.x) + ' · ' + Math.round(s.y);
        }
      }).destroy;
    },
    code: function (p) {
      return {
        css: '.xh-v, .xh-h, .xh-box, .xh-tag{\n  position: fixed; z-index: 9999;\n  pointer-events: none; will-change: transform;\n}\n.xh-v{ top: 0; bottom: 0; width: 1px; background: ' + FX.pc(p.color, 0.5, p.lines) + '; }\n.xh-h{ left: 0; right: 0; height: 1px; background: ' + FX.pc(p.color, 0.5, p.lines) + '; }\n.xh-box{\n  top: 0; left: 0; width: ' + p.box + 'px; height: ' + p.box + 'px;\n  margin: ' + (-p.box / 2) + 'px 0 0 ' + (-p.box / 2) + 'px;\n  border: 1px solid ' + FX.pat(p.color, 0.5) + '; border-radius: 2px;\n}\n.xh-tag{\n  top: 0; left: 0; padding: 2px 6px; border-radius: 5px;\n  border: 1px solid ' + FX.pc(p.color, 1, 0.18) + '; color: ' + FX.pat(p.color, 1) + ';\n  font: 400 10px/1 ui-monospace, monospace;\n' + (p.readout ? '' : '  display: none;\n') + '}\nbody { cursor: none; }',
        js: 'const v = document.querySelector(\'.xh-v\');\nconst h = document.querySelector(\'.xh-h\');\nconst box = document.querySelector(\'.xh-box\');\nconst tag = document.querySelector(\'.xh-tag\');\n\nlet x = 0, y = 0, raf = 0;\n\naddEventListener(\'pointermove\', (e) => {\n  x = e.clientX; y = e.clientY;\n  if (raf) return;                 // coalesce to one write per frame\n  raf = requestAnimationFrame(() => {\n    raf = 0;\n    v.style.transform   = `translate3d(${x}px,0,0)`;\n    h.style.transform   = `translate3d(0,${y}px,0)`;\n    box.style.transform = `translate3d(${x}px,${y}px,0)`;\n    tag.style.transform = `translate3d(${x + 13}px,${y + 13}px,0)`;\n    tag.textContent     = `${x} · ${y}`;\n  });\n}, { passive: true });',
        react: 'import { useEffect, useRef } from \'react\';\n\nexport function CrosshairCursor({ readout = ' + p.readout + ' }) {\n  const v = useRef(null), h = useRef(null), box = useRef(null), tag = useRef(null);\n\n  useEffect(() => {\n    if (!matchMedia(\'(pointer: fine)\').matches) return;\n    let raf = 0, x = 0, y = 0;\n    const move = (e) => {\n      x = e.clientX; y = e.clientY;\n      if (raf) return;\n      raf = requestAnimationFrame(() => {\n        raf = 0;\n        v.current.style.transform   = `translate3d(${x}px,0,0)`;\n        h.current.style.transform   = `translate3d(0,${y}px,0)`;\n        box.current.style.transform = `translate3d(${x}px,${y}px,0)`;\n        if (tag.current) {\n          tag.current.style.transform = `translate3d(${x + 13}px,${y + 13}px,0)`;\n          tag.current.textContent = `${x} · ${y}`;\n        }\n      });\n    };\n    addEventListener(\'pointermove\', move, { passive: true });\n    return () => { removeEventListener(\'pointermove\', move); cancelAnimationFrame(raf); };\n  }, []);\n\n  return (<>\n    <div ref={v} className="xh-v" aria-hidden />\n    <div ref={h} className="xh-h" aria-hidden />\n    <div ref={box} className="xh-box" aria-hidden />\n    {readout && <div ref={tag} className="xh-tag" aria-hidden />}\n  </>);\n}'
      };
    }
  });

  /* ── 04 · Custom Pointer ──────────────────────────────── */
  var SHAPES = {
    dot: 'border-radius:50%',
    ring: 'border-radius:50%;background:transparent!important;border:2px solid CLR',
    square: 'border-radius:3px',
    squircle: 'border-radius:34%',
    diamond: 'border-radius:4px;rotate:45deg'
  };
  DB.push({
    id: 'custom-pointer', name: 'Custom Pointer', group: 'Pointer',
    desc: 'One element, any silhouette. Swap the shape, let it bank into the direction of travel, and it becomes a brand pointer rather than a demo.',
    params: [
      { key: 'shape', label: 'Shape', type: 'select', value: 'squircle', options: ['dot', 'ring', 'square', 'squircle', 'diamond'] },
      { key: 'size', label: 'Size', type: 'range', min: 8, max: 64, step: 1, value: 22, unit: 'px' },
      { key: 'ease', label: 'Follow', type: 'range', min: 0.05, max: 1, step: 0.01, value: 0.22 },
      { key: 'bank', label: 'Bank into motion', type: 'switch', value: true },
      { key: 'color', label: 'Colour', type: 'paint', value: { a: '#FFFFFF', b: '#5B9BF6', on: false, angle: 90 } }
    ],
    content: body('Any silhouette.', 'shape · size · follow · bank'),
    mount: function (stage, p) {
      var l = FX.layer(stage);
      var c = make(BASE + 'opacity:0;transition:opacity .3s');
      l.appendChild(c);
      var x = 0, y = 0, rot = 0;
      return FX.mount(stage, {
        enter: function (s) { x = s.x; y = s.y; c.style.opacity = 1; },
        leave: function () { c.style.opacity = 0; },
        tick: function (s) {
          var dx = s.x - x, dy = s.y - y;
          x += dx * p.ease; y += dy * p.ease;
          var speed = Math.min(Math.hypot(dx, dy), 40);
          var tilt = p.bank ? clamp(dx * 0.6, -22, 22) : 0;
          rot = lerp(rot, tilt, .16);
          var base = SHAPES[p.shape].replace(/CLR/g, FX.pat(p.color, 0.5));
          c.style.cssText = BASE + 'opacity:1;width:' + p.size + 'px;height:' + p.size + 'px;margin:' +
            (-p.size / 2) + 'px 0 0 ' + (-p.size / 2) + 'px;background:' + FX.pcss(p.color) + ';' + base +
            ';transform:translate3d(' + x + 'px,' + y + 'px,0) rotate(' + (rot + (p.shape === 'diamond' ? 45 : 0)) + 'deg) scale(' + (1 + speed / 300) + ')';
        }
      }).destroy;
    },
    code: function (p) {
      var shapeCss = p.shape === 'ring'
        ? 'border-radius: 50%; border: 2px solid ' + FX.pat(p.color, 0.5) + ';'
        : p.shape === 'dot' ? 'border-radius: 50%; background: ' + FX.pcss(p.color) + ';'
          : p.shape === 'square' ? 'border-radius: 3px; background: ' + FX.pcss(p.color) + ';'
            : p.shape === 'diamond' ? 'border-radius: 4px; background: ' + FX.pcss(p.color) + ';'
              : 'border-radius: 34%; background: ' + FX.pcss(p.color) + ';';
      return {
        css: '.pointer{\n  position: fixed; top: 0; left: 0; z-index: 9999;\n  width: ' + p.size + 'px; height: ' + p.size + 'px;\n  margin: ' + (-p.size / 2) + 'px 0 0 ' + (-p.size / 2) + 'px;\n  ' + shapeCss + '\n  pointer-events: none; will-change: transform;\n}\nbody { cursor: none; }',
        js: 'const el = document.querySelector(\'.pointer\');\n\nconst EASE = ' + p.ease + ';\nconst BANK = ' + p.bank + ';        // tilt into the direction of travel\nconst REST = ' + (p.shape === 'diamond' ? 45 : 0) + ';           // resting rotation of the shape\n\nlet mx = 0, my = 0, x = 0, y = 0, rot = 0;\naddEventListener(\'pointermove\', e => { mx = e.clientX; my = e.clientY; }, { passive: true });\n\n(function loop(){\n  const dx = mx - x, dy = my - y;\n  x += dx * EASE;\n  y += dy * EASE;\n\n  const speed = Math.min(Math.hypot(dx, dy), 40);\n  const tilt  = BANK ? Math.max(-22, Math.min(dx * 0.6, 22)) : 0;\n  rot += (tilt - rot) * 0.16;\n\n  el.style.transform =\n    `translate3d(${x}px, ${y}px, 0) rotate(${rot + REST}deg) scale(${1 + speed / 300})`;\n  requestAnimationFrame(loop);\n})();',
        react: 'import { useEffect, useRef } from \'react\';\n\nexport function CustomPointer({ ease = ' + p.ease + ', bank = ' + p.bank + ', rest = ' + (p.shape === 'diamond' ? 45 : 0) + ' }) {\n  const ref = useRef(null);\n\n  useEffect(() => {\n    if (!matchMedia(\'(pointer: fine)\').matches) return;\n    let mx = 0, my = 0, x = 0, y = 0, rot = 0, id = 0;\n    const move = (e) => { mx = e.clientX; my = e.clientY; };\n    addEventListener(\'pointermove\', move, { passive: true });\n\n    const loop = () => {\n      const dx = mx - x, dy = my - y;\n      x += dx * ease; y += dy * ease;\n      const speed = Math.min(Math.hypot(dx, dy), 40);\n      const tilt = bank ? Math.max(-22, Math.min(dx * 0.6, 22)) : 0;\n      rot += (tilt - rot) * 0.16;\n      if (ref.current) ref.current.style.transform =\n        `translate3d(${x}px,${y}px,0) rotate(${rot + rest}deg) scale(${1 + speed / 300})`;\n      id = requestAnimationFrame(loop);\n    };\n    id = requestAnimationFrame(loop);\n    return () => { removeEventListener(\'pointermove\', move); cancelAnimationFrame(id); };\n  }, [ease, bank, rest]);\n\n  return <div ref={ref} className="pointer" aria-hidden />;\n}'
      };
    }
  });

  /* ── 05 · Figma Cursor ────────────────────────────────── */
  DB.push({
    id: 'figma', name: 'Figma Cursor', group: 'Pointer',
    desc: 'The multiplayer pointer: a filled arrow with a name tag riding its tail. Give the tag a per-user colour and a room instantly feels inhabited.',
    params: [
      { key: 'label', label: 'Name', type: 'text', value: 'you' },
      { key: 'size', label: 'Arrow size', type: 'range', min: 14, max: 40, step: 1, value: 22, unit: 'px' },
      { key: 'corner', label: 'Corner radius', type: 'range', min: 0, max: 5, step: 0.25, value: 1.75 },
      { key: 'ease', label: 'Follow', type: 'range', min: 0.08, max: 1, step: 0.01, value: 0.34 },
      { key: 'tag', label: 'Show name tag', type: 'switch', value: true },
      { key: 'color', label: 'Colour', type: 'paint', value: { a: '#FFFFFF', b: '#5B9BF6', on: false, angle: 90 } }
    ],
    content: body('Multiplayer.', 'arrow + name tag'),
    mount: function (stage, p) {
      var l = FX.layer(stage);
      var wrap = make(BASE + 'opacity:0;transition:opacity .25s');
      l.appendChild(wrap);
      var x = 0, y = 0;
      return FX.mount(stage, {
        enter: function (s) { x = s.x; y = s.y; wrap.style.opacity = 1; },
        leave: function () { wrap.style.opacity = 0; },
        tick: function (s) {
          x = lerp(x, s.x, p.ease); y = lerp(y, s.y, p.ease);
          // stroking the polygon with its own fill and a round join
          // is what rounds the arrow's corners
          wrap.innerHTML =
            '<svg width="' + p.size + '" height="' + p.size + '" viewBox="0 0 24 24" style="position:absolute;top:0;left:0;overflow:visible">' +
            '<path d="M5 2l14 7-6 1.7L11 18z" fill="' + FX.pat(p.color, 0) + '" stroke="' + FX.pat(p.color, 0) +
            '" stroke-width="' + (p.corner * 2) + '" stroke-linejoin="round" stroke-linecap="round"/></svg>' +
            (p.tag ? '<span style="position:absolute;top:' + (p.size * .72) + 'px;left:' + (p.size * .62) + 'px;padding:2px 7px;border-radius:999px;background:' + FX.pat(p.color, 1) + ';color:#000;font-family:var(--font-mono);font-size:10px;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap">' + (p.label || 'you') + '</span>' : '');
          wrap.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
        }
      }).destroy;
    },
    code: function (p) {
      return {
        css: '.fig{\n  position: fixed; top: 0; left: 0; z-index: 9999;\n  pointer-events: none; will-change: transform;\n}\n.fig svg{ overflow: visible; }\n.fig__tag{\n  position: absolute;\n  top: ' + Math.round(p.size * 0.72) + 'px; left: ' + Math.round(p.size * 0.62) + 'px;\n  padding: 2px 7px; border-radius: 999px;\n  background: ' + FX.pat(p.color, 1) + '; color: #000;\n  font: 400 10px/1.4 ui-monospace, monospace;\n  letter-spacing: .06em; text-transform: uppercase; white-space: nowrap;\n}\nbody { cursor: none; }',
        js: '<div class="fig">\n  <!-- Corner radius trick: stroke the polygon with its own fill colour\n       and a round line-join. stroke-width = radius * 2. -->\n  <svg width="' + p.size + '" height="' + p.size + '" viewBox="0 0 24 24">\n    <path d="M5 2l14 7-6 1.7L11 18z"\n          fill="' + FX.pat(p.color, 0) + '"\n          stroke="' + FX.pat(p.color, 0) + '"\n          stroke-width="' + (p.corner * 2) + '"\n          stroke-linejoin="round"\n          stroke-linecap="round"/>\n  </svg>\n  <span class="fig__tag">' + (p.label || 'you') + '</span>\n</div>\n\n<script>\nconst el = document.querySelector(\'.fig\');\nconst EASE = ' + p.ease + ';\n\nlet mx = 0, my = 0, x = 0, y = 0;\naddEventListener(\'pointermove\', e => { mx = e.clientX; my = e.clientY; }, { passive: true });\n\n(function loop(){\n  x += (mx - x) * EASE;\n  y += (my - y) * EASE;\n  el.style.transform = `translate3d(${x}px, ${y}px, 0)`;\n  requestAnimationFrame(loop);\n})();\n<\/script>\n\n/* For real multiplayer, run one of these per remote peer and feed it\n   their broadcast x/y instead of your own pointer events. */',
        react: 'import { useEffect, useRef } from \'react\';\n\nexport function FigmaCursor({\n  name = \'' + (p.label || 'you') + '\',\n  color = \'' + FX.pat(p.color, 0) + '\',\n  size = ' + p.size + ',\n  corner = ' + p.corner + ',    // stroke-width = corner * 2\n  ease = ' + p.ease + ',\n  point,                       // optional { x, y } for a remote peer\n}) {\n  const ref = useRef(null);\n\n  useEffect(() => {\n    let mx = point?.x ?? 0, my = point?.y ?? 0, x = mx, y = my, id = 0;\n    const move = (e) => { mx = e.clientX; my = e.clientY; };\n    if (!point) addEventListener(\'pointermove\', move, { passive: true });\n\n    const loop = () => {\n      if (point) { mx = point.x; my = point.y; }\n      x += (mx - x) * ease; y += (my - y) * ease;\n      if (ref.current) ref.current.style.transform = `translate3d(${x}px,${y}px,0)`;\n      id = requestAnimationFrame(loop);\n    };\n    id = requestAnimationFrame(loop);\n    return () => { removeEventListener(\'pointermove\', move); cancelAnimationFrame(id); };\n  }, [ease, point]);\n\n  return (\n    <div ref={ref} className="fig" aria-hidden>\n      <svg width={size} height={size} viewBox="0 0 24 24">\n        <path d="M5 2l14 7-6 1.7L11 18z" fill={color} stroke={color}\n              strokeWidth={corner * 2} strokeLinejoin="round" strokeLinecap="round" />\n      </svg>\n      <span className="fig__tag" style={{ background: color }}>{name}</span>\n    </div>\n  );\n}'
      };
    }
  });

  /* ── 06 · Eyes ────────────────────────────────────────── */
  var FACE = {
    Grotesk: '"Space Grotesk", system-ui, sans-serif',
    Mono: '"Space Mono", ui-monospace, monospace',
    Dot: '"Doto", "Space Mono", monospace',
    System: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    Serif: 'Georgia, "Times New Roman", serif'
  };
  var WGHT = { Regular: 400, Medium: 500, Semibold: 600, Bold: 700 };

  DB.push({
    id: 'eyes', name: 'Eyes', group: 'Pointer',
    desc: 'Hover the card and the arrow is swapped for the button itself. Everything inside the pill is derived from its height, so resizing the button rescales the eyes, the type and the padding together.',
    hideCursor: false,
    params: [
      { key: 'label', label: 'Label', type: 'text', value: 'Explore', group: 'BUTTON' },
      { key: 'font', label: 'Typeface', type: 'select', value: 'Grotesk',
        options: ['Grotesk', 'Mono', 'Dot', 'System', 'Serif'], group: 'BUTTON' },
      { key: 'weight', label: 'Weight', type: 'select', value: 'Medium',
        options: ['Regular', 'Medium', 'Semibold', 'Bold'], group: 'BUTTON' },
      { key: 'bw', label: 'Width', type: 'range', min: 60, max: 320, step: 2, value: 128, unit: 'px', group: 'BUTTON' },
      { key: 'bh', label: 'Height', type: 'range', min: 22, max: 72, step: 1, value: 36, unit: 'px', group: 'BUTTON' },
      { key: 'corner', label: 'Corner radius', type: 'range', min: 0, max: 36, step: 1, value: 36, unit: 'px', group: 'BUTTON' },

      { key: 'eyeRatio', label: 'Eye size', type: 'range', min: 0.16, max: 0.7, step: 0.02, value: 0.42, unit: '×h', group: 'EYES' },
      { key: 'pupilRatio', label: 'Pupil size', type: 'range', min: 0.2, max: 0.7, step: 0.02, value: 0.42, unit: '×eye', group: 'EYES' },
      { key: 'gap', label: 'Eye gap', type: 'range', min: 0, max: 12, step: 1, value: 1, unit: 'px', group: 'EYES' },
      { key: 'travel', label: 'Pupil travel', type: 'range', min: 0.1, max: 1, step: 0.05, value: 0.75, group: 'EYES' },
      { key: 'gaze', label: 'Gaze gain', type: 'range', min: 8, max: 120, step: 2, value: 26, unit: 'px', group: 'EYES' },

      { key: 'blink', label: 'Interval', type: 'range', min: 0.6, max: 10, step: 0.2, value: 3, unit: 's', group: 'BLINK' },
      { key: 'blinkLen', label: 'Duration', type: 'range', min: 60, max: 400, step: 10, value: 170, unit: 'ms', group: 'BLINK' },
      { key: 'jitter', label: 'Randomness', type: 'range', min: 0, max: 1, step: 0.05, value: 0.3, group: 'BLINK' },

      { key: 'ease', label: 'Trail', type: 'range', min: 0.03, max: 1, step: 0.01, value: 0.08, group: 'MOTION' },

      { key: 'bg', label: 'Button', type: 'paint', value: { a: '#000000', b: '#1A1A1A', on: false, angle: 90 }, group: 'PAINT' },
      { key: 'eye', label: 'Sclera', type: 'paint', value: { a: '#FFFFFF', b: '#FFFFFF', on: false, angle: 90 }, group: 'PAINT' },
      { key: 'pupil', label: 'Pupil', type: 'paint', value: { a: '#000000', b: '#000000', on: false, angle: 90 }, group: 'PAINT' },
      { key: 'text', label: 'Label', type: 'paint', value: { a: '#FFFFFF', b: '#FFFFFF', on: false, angle: 90 }, group: 'PAINT' },

      /* ungrouped and declared last, so they stay pinned under the folded
         groups — these are the switches people actually reach for */
      { key: 'hideArrow', label: 'Hide the real cursor', type: 'switch', value: false },
      { key: 'motion', label: 'Look where it moves', type: 'switch', value: false }
    ],
    content:
      '<div class="stage__body"><div class="demo-card" data-eyes-target>' +
      '<i>2026 / PROJECT</i><div class="row"><b>Bloomly<br>Product design &amp; identity.</b></div>' +
      '</div><p class="stage__note">HOVER THE CARD</p></div>',
    mount: function (stage, p) {
      FX.style('eyes',
        '.eyes-pill{position:absolute;top:0;left:0;display:inline-flex;align-items:center;' +
        'justify-content:center;box-sizing:border-box;' +
        'font-family:var(--font-sans);line-height:1;letter-spacing:-.01em;' +
        'white-space:nowrap;opacity:0;will-change:transform;' +
        'transition:opacity 160ms cubic-bezier(.25,.1,.25,1)}' +
        '.eyes{display:inline-flex;align-items:center;flex:none}' +
        /* no transition on .eye: the lid is written every frame and a CSS
           transition would fight those writes and mush the blink away */
        '.eyes .eye{position:relative;flex:none;border-radius:50%;overflow:hidden;will-change:transform}' +
        '.eyes .eye i{position:absolute;display:block;border-radius:50%;will-change:transform}');

      var card = stage.querySelector('[data-eyes-target]');
      var l = FX.layer(stage);
      var pill = document.createElement('span');
      pill.className = 'eyes-pill';
      pill.innerHTML = '<span class="eyes"><span class="eye"><i></i></span><span class="eye"><i></i></span></span><span class="eyes-pill__t"></span>';
      l.appendChild(pill);

      var eyes = [].slice.call(pill.querySelectorAll('.eye'));
      var text = pill.querySelector('.eyes-pill__t');

      /* the pupil may never leave the sclera, so the travel budget is the
         leftover room, not a share of the eye. 8% is kept as a rim. */
      function room() {
        var eye = p.bh * p.eyeRatio;
        return Math.max(0, (eye - eye * p.pupilRatio) / 2 * 0.92) * p.travel;
      }

      /* Everything is derived from the button height, so dragging Height
         rescales eyes, type and padding in one go. Painted every frame so a
         live edit lands instantly, and once up front so the pill is correct
         even if no frame ever runs. */
      function paintStatic() {
        var h = p.bh, eye = h * p.eyeRatio, pr = eye * p.pupilRatio;
        text.textContent = p.label || '';
        pill.style.minWidth = p.bw + 'px';
        pill.style.height = h + 'px';
        pill.style.borderRadius = Math.min(p.corner, h / 2) + 'px';
        pill.style.padding = '0 ' + (h * 0.44).toFixed(1) + 'px';
        pill.style.fontSize = (h * 0.36).toFixed(1) + 'px';
        pill.style.fontFamily = FACE[p.font] || FACE.Grotesk;
        pill.style.fontWeight = WGHT[p.weight] || 500;
        pill.style.gap = (h * 0.22).toFixed(1) + 'px';
        pill.style.background = FX.pcss(p.bg);
        pill.style.color = FX.pat(p.text, 0);
        eyes.forEach(function (e, i) {
          e.style.width = eye + 'px';
          e.style.height = eye + 'px';
          e.style.background = FX.pat(p.eye, i);
          e.style.marginLeft = (i === 0 ? 0 : p.gap) + 'px';
          var pu = e.firstChild;
          pu.style.width = pr + 'px';
          pu.style.height = pr + 'px';
          pu.style.left = ((eye - pr) / 2) + 'px';
          pu.style.top = ((eye - pr) / 2) + 'px';
          pu.style.background = FX.pat(p.pupil, i);
        });
      }
      paintStatic();

      var over = false, sc = 0.7, x = 0, y = 0;
      var lx = 0, ly = 0, vx = 0, vy = 0;   // smoothed pointer velocity
      var px = [0, 0], py = [0, 0];
      var blinkAt = -1, next = 0;

      function hit(ev) { return !!(ev.target.closest && ev.target.closest('[data-eyes-target]')); }
      function onOver(ev) {
        var was = over; over = hit(ev);
        if (over !== was) { pill.style.opacity = over ? 1 : 0; poke(); }
      }
      function onOut(ev) {
        if (ev.relatedTarget && hit({ target: ev.relatedTarget })) return;
        if (!over) return;
        over = false; pill.style.opacity = 0;
      }
      function poke() { if (stage.__fx && stage.__fx.poke) stage.__fx.poke(); }
      if (card) card.style.cursor = p.hideArrow ? 'none' : '';
      stage.addEventListener('pointerover', onOver);
      stage.addEventListener('pointerout', onOut);

      return FX.mount(stage, {
        enter: function (s) { x = s.x; y = s.y; lx = s.x; ly = s.y; vx = vy = 0; },
        leave: function () { over = false; pill.style.opacity = 0; },
        tick: function (s, t) {
          paintStatic();
          if (card) card.style.cursor = p.hideArrow ? 'none' : '';

          /* ── blink: explicit close / hold / open, jittered ── */
          if (!next) next = t + p.blink * 1000;
          if (blinkAt < 0 && t > next) {
            blinkAt = t;
            next = t + p.blink * 1000 * (1 + (Math.random() * 2 - 1) * p.jitter);
          }
          var lid = 1;
          if (blinkAt >= 0) {
            var k = (t - blinkAt) / p.blinkLen;
            if (k >= 1) blinkAt = -1;
            else if (k < 0.35) lid = 1 - k / 0.35;
            else if (k < 0.5) lid = 0;
            else lid = (k - 0.5) / 0.5;
            lid = Math.max(0.04, lid);
          }

          pill.style.opacity = over ? 1 : 0;
          sc = lerp(sc, over ? 1 : 0.7, 0.2);
          x = lerp(x, s.x, p.ease);
          y = lerp(y, s.y, p.ease);
          pill.style.transform =
            'translate3d(' + x + 'px,' + y + 'px,0) translate(-50%,-50%) scale(' + sc + ')';

          /* low-passed velocity: decays to zero the moment you stop, so the
             pupils drift back to centre on their own */
          var ddx = s.x - lx, ddy = s.y - ly;
          lx = s.x; ly = s.y;
          vx = vx * 0.82 + ddx * 0.18;
          vy = vy * 0.82 + ddy * 0.18;

          var max = room();
          /* reference point is the PILL centre, not each eye: the eyes sit
             left of centre, so measuring per-eye left them permanently
             staring at the label instead of resting centred */
          var pr = pill.getBoundingClientRect();
          var hx = pr.left + pr.width / 2, hy = pr.top + pr.height / 2;

          eyes.forEach(function (eye, i) {
            eye.style.transform = 'scaleY(' + lid + ')';
            var tx = 0, ty = 0;

            if (p.motion) {
              /* look where it moves: aim straight down the velocity vector */
              var sp = Math.hypot(vx, vy);
              if (sp > 0.02) {
                var amv = Math.min(sp / Math.max(p.gaze * 0.25, 1), 1);
                tx = (vx / sp) * amv * max;
                ty = (vy / sp) * amv * max;
              }
            } else {
              /* look at the pointer: aim at wherever it actually is */
              var dx = s.clientX - hx;
              var dy = s.clientY - hy;
              var d = Math.hypot(dx, dy) || 1;
              var amp = Math.min(d / p.gaze, 1);
              tx = (dx / d) * amp * max;
              ty = (dy / d) * amp * max;
            }

            if (!isFinite(tx) || !isFinite(ty)) { tx = 0; ty = 0; }
            if (!isFinite(px[i])) px[i] = 0;
            if (!isFinite(py[i])) py[i] = 0;
            px[i] = lerp(px[i], tx, 0.3);
            py[i] = lerp(py[i], ty, 0.3);
            eye.firstChild.style.transform = 'translate(' + px[i] + 'px,' + py[i] + 'px)';
          });
        },
        destroy: function () {
          if (card) card.style.cursor = '';
          stage.removeEventListener('pointerover', onOver);
          stage.removeEventListener('pointerout', onOut);
        }
      }).destroy;
    },
    code: function (p) {
      var h = p.bh, eye = +(h * p.eyeRatio).toFixed(1), pr = +(eye * p.pupilRatio).toFixed(1);
      var room = +(Math.max(0, (eye - pr) / 2 * 0.92) * p.travel).toFixed(2);
      var pad = +(h * 0.44).toFixed(1), fs = +(h * 0.36).toFixed(1), ga = +(h * 0.22).toFixed(1);
      return {
        css: '' + (p.hideArrow ? '/* the target gives up its cursor; the pill becomes one */\n[data-eyes-target]{ cursor: none; }' : '/* the arrow stays visible — the eyes are a companion that trails it */') + '\n\n/* Every inner size is derived from --h, so changing the button\n   height rescales the eyes, the type and the padding together. */\n.eyes-pill{\n  --h: ' + h + 'px;\n  position: fixed; top: 0; left: 0; z-index: 9999;\n  display: inline-flex; align-items: center; justify-content: center;\n  box-sizing: border-box;\n  min-width: ' + p.bw + 'px; height: var(--h);\n  padding: 0 ' + pad + 'px; gap: ' + ga + 'px;\n  border-radius: ' + Math.min(p.corner, h / 2) + 'px;\n  background: ' + FX.pcss(p.bg) + ';\n  color: ' + FX.pat(p.text, 0) + ';\n  font: ' + (WGHT[p.weight] || 500) + ' ' + fs + 'px/1 ' + (FACE[p.font] || FACE.Grotesk) + '; letter-spacing: -.01em;\n  white-space: nowrap; pointer-events: none;\n  opacity: 0; will-change: transform;\n  transition: opacity 160ms cubic-bezier(.25,.1,.25,1);\n}\n.eyes-pill.is-on{ opacity: 1; }\n\n.eyes{ display: inline-flex; align-items: center; flex: none; }\n\n/* NO transition on .eye — the lid is written every frame and a CSS\n   transition would fight those writes and mush the blink away. */\n.eye{\n  position: relative; flex: none; overflow: hidden;\n  width: ' + eye + 'px; height: ' + eye + 'px;\n  border-radius: 50%; will-change: transform;\n}\n.eye:nth-child(1){ background: ' + FX.pat(p.eye, 0) + '; }\n.eye:nth-child(2){ background: ' + FX.pat(p.eye, 1) + '; margin-left: ' + p.gap + 'px; }\n.eye i{\n  position: absolute; border-radius: 50%; background: ' + FX.pat(p.pupil, 0) + ';\n  width: ' + pr + 'px; height: ' + pr + 'px;\n  left: ' + ((eye - pr) / 2).toFixed(1) + 'px; top: ' + ((eye - pr) / 2).toFixed(1) + 'px;\n  will-change: transform;\n}',
        js: '<a class="card" data-eyes-target href="/projects/bloomly">…</a>\n\n<span class="eyes-pill">\n  <span class="eyes">\n    <span class="eye"><i></i></span>\n    <span class="eye"><i></i></span>\n  </span>\n  ' + (p.label || '') + '\n</span>\n\n<script>\nconst pill = document.querySelector(\'.eyes-pill\');\nconst eyes = [...pill.querySelectorAll(\'.eye\')];\n\n// The pupil may never leave the sclera, so the travel budget is the\n// leftover room between the two radii — not a share of the eye.\nconst ROOM      = ' + room + ';\nconst GAZE      = ' + p.gaze + ';     // px of lag that already means "look all the way"\nconst EASE      = ' + p.ease + ';     // trail — LOW = the eyes lag far behind,\n                        // and that distance is what the pupils stare at\nconst BLINK     = ' + p.blink + ' * 1000;\nconst BLINK_LEN = ' + p.blinkLen + ';    // ms: close + hold + open\nconst JITTER    = ' + p.jitter + ';    // 0 = metronome, 1 = wildly irregular\nconst MOTION    = ' + p.motion + ';  // false = stare at the real pointer (reference behaviour)\n\nlet mx = 0, my = 0, x = 0, y = 0;\nlet lx = 0, ly = 0, vx = 0, vy = 0;          // smoothed pointer velocity\nlet scale = 0.7, over = false, blinkAt = -1, next = 0;\nconst px = eyes.map(() => 0), py = eyes.map(() => 0);\n\naddEventListener(\'pointermove\', e => { mx = e.clientX; my = e.clientY; }, { passive: true });\n\n// the pill replaces the arrow, but only over the targets\naddEventListener(\'pointerover\', e => {\n  over = !!e.target.closest(\'[data-eyes-target]\');\n  pill.classList.toggle(\'is-on\', over);\n});\n\n(function loop(t){\n  // ── blink: an explicit close / hold / open curve on a jittered timer\n  if (!next) next = t + BLINK;\n  if (blinkAt < 0 && t > next) {\n    blinkAt = t;\n    next = t + BLINK * (1 + (Math.random() * 2 - 1) * JITTER);\n  }\n  let lid = 1;\n  if (blinkAt >= 0) {\n    const k = (t - blinkAt) / BLINK_LEN;\n    if (k >= 1) blinkAt = -1;\n    else if (k < 0.35) lid = 1 - k / 0.35;      // snap shut\n    else if (k < 0.50) lid = 0;                 // hold\n    else lid = (k - 0.5) / 0.5;                 // ease open\n    lid = Math.max(0.04, lid);\n  }\n\n  x += (mx - x) * EASE;\n  y += (my - y) * EASE;\n  scale += ((over ? 1 : 0.7) - scale) * 0.2;\n  pill.style.transform =\n    `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale})`;\n\n  // low-passed velocity: decays to zero the moment you stop, so the\n  // pupils drift back to centre without any extra bookkeeping\n  vx = vx * 0.82 + (mx - lx) * 0.18;\n  vy = vy * 0.82 + (my - ly) * 0.18;\n  lx = mx; ly = my;\n\n  eyes.forEach((eye, i) => {\n    eye.style.transform = `scaleY(${lid})`;\n    let tx = 0, ty = 0;\n\n    if (MOTION) {\n      // look where it moves: aim straight down the velocity vector\n      const sp = Math.hypot(vx, vy);\n      if (sp > 0.02) {\n        const amp = Math.min(sp / Math.max(GAZE * 0.25, 1), 1);\n        tx = (vx / sp) * amp * ROOM;\n        ty = (vy / sp) * amp * ROOM;\n      }\n    } else {\n      // measure from the PILL centre, not each eye — the eyes sit left of\n      // centre, so per-eye maths leaves them staring at the label at rest\n      const r  = pill.getBoundingClientRect();\n      const dx = mx - (r.left + r.width / 2);\n      const dy = my - (r.top + r.height / 2);\n      const d  = Math.hypot(dx, dy) || 1;\n      const amp = Math.min(d / GAZE, 1);   // amplify the residual lag\n      tx = (dx / d) * amp * ROOM;\n      ty = (dy / d) * amp * ROOM;\n    }\n\n    px[i] += (tx - px[i]) * 0.3;\n    py[i] += (ty - py[i]) * 0.3;\n    eye.firstElementChild.style.transform = `translate(${px[i]}px, ${py[i]}px)`;\n  });\n\n  requestAnimationFrame(loop);\n})(0);\n<\/script>',
        react: 'import { useEffect, useRef } from \'react\';\n\nexport function EyesCursor({\n  label = \'' + (p.label || '') + '\',\n  width = ' + p.bw + ', height = ' + p.bh + ', corner = ' + Math.min(p.corner, h / 2) + ',\n  eyeRatio = ' + p.eyeRatio + ', pupilRatio = ' + p.pupilRatio + ', gap = ' + p.gap + ',\n  travel = ' + p.travel + ', gaze = ' + p.gaze + ', ease = ' + p.ease + ',\n  blink = ' + p.blink + ', blinkLen = ' + p.blinkLen + ', jitter = ' + p.jitter + ',\n  motion = ' + p.motion + ',   // true = look where it moves\n  typeface = \'' + (FACE[p.font] || FACE.Grotesk).replace(/'/g, "\\\\'") + '\', weight = ' + (WGHT[p.weight] || 500) + ',' + '\n  background = \'' + FX.pcss(p.bg) + '\', sclera = \'' + FX.pat(p.eye, 0) + '\',\n  pupilColor = \'' + FX.pat(p.pupil, 0) + '\', labelColor = \'' + FX.pat(p.text, 0) + '\'\n}) {\n  const pill = useRef(null);\n\n  // one source of truth: the button height drives every inner size\n  const eye = height * eyeRatio;\n  const pupil = eye * pupilRatio;\n  // the pupil may never leave the sclera\n  const room = Math.max(0, (eye - pupil) / 2 * 0.92) * travel;\n\n  useEffect(() => {\n    if (!matchMedia(\'(pointer: fine)\').matches) return;\n    const eyes = [...pill.current.querySelectorAll(\'.eye\')];\n    const px = eyes.map(() => 0), py = eyes.map(() => 0);\n    let mx = 0, my = 0, x = 0, y = 0;\n    let lx = 0, ly = 0, vx = 0, vy = 0;\n    let scale = 0.7, over = false, blinkAt = -1, next = 0, id = 0;\n\n    const move = (e) => { mx = e.clientX; my = e.clientY; };\n    const enter = (e) => {\n      over = !!e.target.closest?.(\'[data-eyes-target]\');\n      pill.current?.classList.toggle(\'is-on\', over);\n    };\n    addEventListener(\'pointermove\', move, { passive: true });\n    addEventListener(\'pointerover\', enter);\n\n    const loop = (t) => {\n      if (!next) next = t + blink * 1000;\n      if (blinkAt < 0 && t > next) {\n        blinkAt = t;\n        next = t + blink * 1000 * (1 + (Math.random() * 2 - 1) * jitter);\n      }\n      let lid = 1;\n      if (blinkAt >= 0) {\n        const k = (t - blinkAt) / blinkLen;\n        if (k >= 1) blinkAt = -1;\n        else if (k < 0.35) lid = 1 - k / 0.35;\n        else if (k < 0.50) lid = 0;\n        else lid = (k - 0.5) / 0.5;\n        lid = Math.max(0.04, lid);\n      }\n\n      x += (mx - x) * ease;\n      y += (my - y) * ease;\n      scale += ((over ? 1 : 0.7) - scale) * 0.2;\n      pill.current.style.transform =\n        `translate3d(${x}px,${y}px,0) translate(-50%,-50%) scale(${scale})`;\n\n      vx = vx * 0.82 + (mx - lx) * 0.18;\n      vy = vy * 0.82 + (my - ly) * 0.18;\n      lx = mx; ly = my;\n\n      eyes.forEach((el, i) => {\n        el.style.transform = `scaleY(${lid})`;\n        let tx = 0, ty = 0;\n        if (motion) {\n          const sp = Math.hypot(vx, vy);\n          if (sp > 0.02) {\n            const amp = Math.min(sp / Math.max(gaze * 0.25, 1), 1);\n            tx = (vx / sp) * amp * room;\n            ty = (vy / sp) * amp * room;\n          }\n        } else {\n          const r = pill.current.getBoundingClientRect();\n          const dx = mx - (r.left + r.width / 2);\n          const dy = my - (r.top + r.height / 2);\n          const d = Math.hypot(dx, dy) || 1;\n          const amp = Math.min(d / gaze, 1);\n          tx = (dx / d) * amp * room;\n          ty = (dy / d) * amp * room;\n        }\n        px[i] += (tx - px[i]) * 0.3;\n        py[i] += (ty - py[i]) * 0.3;\n        el.firstElementChild.style.transform = `translate(${px[i]}px,${py[i]}px)`;\n      });\n      id = requestAnimationFrame(loop);\n    };\n    id = requestAnimationFrame(loop);\n\n    return () => {\n      removeEventListener(\'pointermove\', move);\n      removeEventListener(\'pointerover\', enter);\n      cancelAnimationFrame(id);\n    };\n  }, [eye, pupil, room, gaze, ease, blink, blinkLen, jitter, motion]);\n\n  const eyeStyle = { width: eye, height: eye, background: sclera };\n  const pupilStyle = { width: pupil, height: pupil, background: pupilColor,\n                       left: (eye - pupil) / 2, top: (eye - pupil) / 2 };\n\n  return (\n    <span ref={pill} className="eyes-pill" aria-hidden style={{\n      minWidth: width, height, borderRadius: corner,\n      padding: `0 ${height * 0.44}px`, gap: height * 0.22,\n      fontSize: height * 0.36, fontFamily: typeface, fontWeight: weight,\n      background, color: labelColor\n    }}>\n      <span className="eyes">\n        <span className="eye" style={eyeStyle}><i style={pupilStyle} /></span>\n        <span className="eye" style={{ ...eyeStyle, marginLeft: gap }}><i style={pupilStyle} /></span>\n      </span>\n      {label}\n    </span>\n  );\n}'
      };
    }
  });

  /* ── 07 · Liquid Glass ────────────────────────────────── */
  DB.push({
    id: 'liquid-glass', name: 'Liquid Glass', group: 'Pointer',
    desc: 'The Apple treatment: a squircle lens that blurs and over-saturates whatever sits under it, with a bright inner rim, a specular sweep, and a body that stretches with speed.',
    params: [
      { key: 'size', label: 'Size', type: 'range', min: 28, max: 140, step: 2, value: 72, unit: 'px' },
      { key: 'blur', label: 'Refraction', type: 'range', min: 0, max: 20, step: 0.5, value: 7, unit: 'px' },
      { key: 'round', label: 'Corner', type: 'range', min: 12, max: 50, step: 1, value: 50, unit: '%' },
      { key: 'ease', label: 'Follow', type: 'range', min: 0.05, max: 0.5, step: 0.01, value: 0.15 },
      { key: 'spec', label: 'Specular', type: 'range', min: 0, max: 1, step: 0.05, value: 0.55 }
    ],
    content: body('Liquid Glass.', 'blur · saturate · specular rim',
      '<div class="demo-thumbs" style="display:flex;gap:10px;margin-top:6px">' +
      '<span style="width:60px;height:60px;border-radius:14px;background:#a78bfa"></span>' +
      '<span style="width:60px;height:60px;border-radius:14px;background:#5eead4"></span>' +
      '<span style="width:60px;height:60px;border-radius:14px;background:#fbbf24"></span>' +
      '<span style="width:60px;height:60px;border-radius:14px;background:#fb7185"></span></div>'),
    mount: function (stage, p) {
      var l = FX.layer(stage);
      var g = make(BASE + 'opacity:0;transition:opacity .3s;overflow:hidden');
      var spec = make('position:absolute;inset:0;pointer-events:none');
      g.appendChild(spec);
      l.appendChild(g);
      var x = 0, y = 0, sx = 1, sy = 1, rot = 0;
      return FX.mount(stage, {
        enter: function (s) { x = s.x; y = s.y; g.style.opacity = 1; },
        leave: function () { g.style.opacity = 0; },
        tick: function (s) {
          var dx = s.x - x, dy = s.y - y;
          x += dx * p.ease; y += dy * p.ease;
          var speed = Math.min(Math.hypot(dx, dy) / 90, .34);
          if (speed > .02) rot = Math.atan2(dy, dx) * 180 / Math.PI;
          sx = lerp(sx, 1 + speed, .16); sy = lerp(sy, 1 - speed * .7, .16);
          var sz = p.size;
          g.style.width = g.style.height = sz + 'px';
          g.style.margin = (-sz / 2) + 'px 0 0 ' + (-sz / 2) + 'px';
          g.style.borderRadius = p.round + '%';
          g.style.backdropFilter = g.style.webkitBackdropFilter = 'blur(' + p.blur + 'px) saturate(1.9) brightness(1.06)';
          g.style.background = 'rgba(255,255,255,.06)';
          g.style.boxShadow = 'inset 0 0 0 1px rgba(255,255,255,.30), inset 0 ' + (sz * .06) + 'px ' + (sz * .18) + 'px rgba(255,255,255,' + (p.spec * .45) + '), 0 ' + (sz * .12) + 'px ' + (sz * .3) + 'px rgba(0,0,0,.45)';
          spec.style.background = 'linear-gradient(' + (rot + 120) + 'deg, rgba(255,255,255,' + (p.spec * .5) + ') 0%, rgba(255,255,255,0) 38%, rgba(255,255,255,0) 62%, rgba(255,255,255,' + (p.spec * .22) + ') 100%)';
          g.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) rotate(' + rot + 'deg) scale(' + sx + ',' + sy + ') rotate(' + (-rot) + 'deg)';
        }
      }).destroy;
    },
    code: function (p) {
      return {
        css: '.glass{\n  position: fixed; top: 0; left: 0; z-index: 9999;\n  width: ' + p.size + 'px; height: ' + p.size + 'px;\n  margin: ' + (-p.size / 2) + 'px 0 0 ' + (-p.size / 2) + 'px;\n  border-radius: ' + p.round + '%;\n  pointer-events: none; overflow: hidden; will-change: transform;\n\n  /* the lens itself */\n  background: rgb(255 255 255 / 6%);\n  backdrop-filter: blur(' + p.blur + 'px) saturate(1.9) brightness(1.06);\n  -webkit-backdrop-filter: blur(' + p.blur + 'px) saturate(1.9) brightness(1.06);\n\n  /* rim light + inner glow + cast shadow, in that order */\n  box-shadow:\n    inset 0 0 0 1px rgb(255 255 255 / 30%),\n    inset 0 ' + (p.size * 0.06).toFixed(1) + 'px ' + (p.size * 0.18).toFixed(1) + 'px rgb(255 255 255 / ' + Math.round(p.spec * 45) + '%),\n    0 ' + (p.size * 0.12).toFixed(1) + 'px ' + (p.size * 0.3).toFixed(1) + 'px rgb(0 0 0 / 45%);\n}\n\n/* the specular sweep rides on its own layer so it can rotate freely */\n.glass::after{\n  content: ""; position: absolute; inset: 0;\n  background: linear-gradient(var(--sweep, 120deg),\n    rgb(255 255 255 / ' + Math.round(p.spec * 50) + '%) 0%,\n    transparent 38%, transparent 62%,\n    rgb(255 255 255 / ' + Math.round(p.spec * 22) + '%) 100%);\n}\n\nbody { cursor: none; }',
        js: 'const el = document.querySelector(\'.glass\');\n\nconst EASE = ' + p.ease + ';\nlet mx = 0, my = 0, x = 0, y = 0, sx = 1, sy = 1, rot = 0;\n\naddEventListener(\'pointermove\', e => { mx = e.clientX; my = e.clientY; }, { passive: true });\n\n(function loop(){\n  const dx = mx - x, dy = my - y;\n  x += dx * EASE;\n  y += dy * EASE;\n\n  const speed = Math.min(Math.hypot(dx, dy) / 90, 0.34);\n  if (speed > 0.02) rot = Math.atan2(dy, dx) * 180 / Math.PI;\n\n  sx += ((1 + speed)       - sx) * 0.16;\n  sy += ((1 - speed * 0.7) - sy) * 0.16;\n\n  // rotate → scale → rotate back: the blob stretches along travel\n  // without the rounded corners visibly spinning.\n  el.style.transform =\n    `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg) scale(${sx}, ${sy}) rotate(${-rot}deg)`;\n  el.style.setProperty(\'--sweep\', `${rot + 120}deg`);\n\n  requestAnimationFrame(loop);\n})();\n\n/* backdrop-filter is GPU-expensive. One fixed element is fine;\n   never put it on something that scrolls. */',
        react: 'import { useEffect, useRef } from \'react\';\n\nexport function LiquidGlassCursor({ ease = ' + p.ease + ' }) {\n  const ref = useRef(null);\n\n  useEffect(() => {\n    if (!matchMedia(\'(pointer: fine)\').matches) return;\n    let mx = 0, my = 0, x = 0, y = 0, sx = 1, sy = 1, rot = 0, id = 0;\n    const move = (e) => { mx = e.clientX; my = e.clientY; };\n    addEventListener(\'pointermove\', move, { passive: true });\n\n    const loop = () => {\n      const dx = mx - x, dy = my - y;\n      x += dx * ease; y += dy * ease;\n      const speed = Math.min(Math.hypot(dx, dy) / 90, 0.34);\n      if (speed > 0.02) rot = Math.atan2(dy, dx) * 180 / Math.PI;\n      sx += ((1 + speed) - sx) * 0.16;\n      sy += ((1 - speed * 0.7) - sy) * 0.16;\n      const el = ref.current;\n      if (el) {\n        el.style.transform =\n          `translate3d(${x}px,${y}px,0) rotate(${rot}deg) scale(${sx},${sy}) rotate(${-rot}deg)`;\n        el.style.setProperty(\'--sweep\', `${rot + 120}deg`);\n      }\n      id = requestAnimationFrame(loop);\n    };\n    id = requestAnimationFrame(loop);\n    return () => { removeEventListener(\'pointermove\', move); cancelAnimationFrame(id); };\n  }, [ease]);\n\n  return <div ref={ref} className="glass" aria-hidden />;\n}'
      };
    }
  });

  /* ── 08 · Butterfly ───────────────────────────────────── */
  DB.push({
    id: 'butterfly', name: 'Butterfly', group: 'Pointer',
    desc: 'Wings flap on a sine, the body banks into the turn, and a slow wander offset keeps it from ever sitting perfectly still on the pointer.',
    params: [
      { key: 'size', label: 'Wingspan', type: 'range', min: 16, max: 90, step: 2, value: 40, unit: 'px' },
      { key: 'flap', label: 'Flap speed', type: 'range', min: 2, max: 22, step: 0.5, value: 9, unit: 'hz' },
      { key: 'ease', label: 'Follow', type: 'range', min: 0.02, max: 0.3, step: 0.01, value: 0.07 },
      { key: 'wander', label: 'Wander', type: 'range', min: 0, max: 40, step: 1, value: 14, unit: 'px' },
      { key: 'color', label: 'Colour', type: 'paint', value: { a: '#FFFFFF', b: '#5B9BF6', on: false, angle: 90 } }
    ],
    content: body('It never lands.', 'sine flap · banked turns'),
    mount: function (stage, p) {
      var l = FX.layer(stage);
      var b = make(BASE + 'opacity:0;transition:opacity .35s');
      l.appendChild(b);
      var x = 0, y = 0, rot = 0;
      return FX.mount(stage, {
        enter: function (s) { x = s.x; y = s.y; b.style.opacity = 1; },
        leave: function () { b.style.opacity = 0; },
        tick: function (s, t) {
          var wx = Math.sin(t / 900) * p.wander, wy = Math.cos(t / 1150) * p.wander * .7;
          var dx = (s.x + wx) - x, dy = (s.y + wy) - y;
          x += dx * p.ease; y += dy * p.ease;
          rot = lerp(rot, clamp(dx * 1.4, -34, 34), .1);
          var open = Math.abs(Math.sin(t / 1000 * p.flap));
          var sz = p.size;
          b.style.width = sz + 'px'; b.style.height = sz + 'px';
          b.style.margin = (-sz / 2) + 'px 0 0 ' + (-sz / 2) + 'px';
          b.innerHTML =
            '<svg viewBox="0 0 40 40" width="' + sz + '" height="' + sz + '">' +
            '<g transform="translate(20 20)">' +
            '<g transform="scale(' + (-0.25 - open * 0.75) + ' 1)">' +
            '<path d="M0 0 C-4-13 -17-16 -18-6 C-19 2 -8 5 0 0 Z M0 1 C-4 11 -14 14 -15 6 C-16 0 -7-2 0 1 Z" fill="' + FX.pat(p.color, 0) + '"/></g>' +
            '<g transform="scale(' + (0.25 + open * 0.75) + ' 1)">' +
            '<path d="M0 0 C-4-13 -17-16 -18-6 C-19 2 -8 5 0 0 Z M0 1 C-4 11 -14 14 -15 6 C-16 0 -7-2 0 1 Z" fill="' + FX.pat(p.color, 1) + '"/></g>' +
            '<rect x="-0.9" y="-8" width="1.8" height="17" rx="0.9" fill="' + FX.pat(p.color, 0.5) + '"/>' +
            '<path d="M-0.4-7 C-3-11 -5-12 -6-13 M0.4-7 C3-11 5-12 6-13" stroke="' + FX.pat(p.color, 0.5) + '" stroke-width="0.8" fill="none" stroke-linecap="round"/>' +
            '</g></svg>';
          b.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0) rotate(' + rot + 'deg)';
        }
      }).destroy;
    },
    code: function (p) {
      return {
        css: '.fly{\n  position: fixed; top: 0; left: 0; z-index: 9999;\n  width: ' + p.size + 'px; height: ' + p.size + 'px;\n  margin: ' + (-p.size / 2) + 'px 0 0 ' + (-p.size / 2) + 'px;\n  pointer-events: none; will-change: transform;\n}\n.fly .wing{ transform-origin: 0 0; }\nbody { cursor: none; }',
        js: '<div class="fly">\n  <svg viewBox="0 0 40 40">\n    <g transform="translate(20 20)">\n      <g class="wing" id="wingL"><path d="M0 0 C-4-13 -17-16 -18-6 C-19 2 -8 5 0 0 Z M0 1 C-4 11 -14 14 -15 6 C-16 0 -7-2 0 1 Z" fill="' + FX.pat(p.color, 0.5) + '"/></g>\n      <g class="wing" id="wingR"><path d="M0 0 C-4-13 -17-16 -18-6 C-19 2 -8 5 0 0 Z M0 1 C-4 11 -14 14 -15 6 C-16 0 -7-2 0 1 Z" fill="' + FX.pat(p.color, 0.5) + '"/></g>\n      <rect x="-.9" y="-8" width="1.8" height="17" rx=".9" fill="' + FX.pat(p.color, 0.5) + '"/>\n    </g>\n  </svg>\n</div>\n\n<script>\nconst el = document.querySelector(\'.fly\');\nconst L  = document.getElementById(\'wingL\');\nconst R  = document.getElementById(\'wingR\');\n\nconst EASE   = ' + p.ease + ';\nconst FLAP   = ' + p.flap + ';     // wing beats per second-ish\nconst WANDER = ' + p.wander + ';   // px of idle drift\n\nlet mx = 0, my = 0, x = 0, y = 0, rot = 0;\naddEventListener(\'pointermove\', e => { mx = e.clientX; my = e.clientY; }, { passive: true });\n\n(function loop(t){\n  // it aims at a slowly moving point near the cursor, never at the cursor\n  const wx = Math.sin(t / 900)  * WANDER;\n  const wy = Math.cos(t / 1150) * WANDER * 0.7;\n\n  const dx = (mx + wx) - x, dy = (my + wy) - y;\n  x += dx * EASE;\n  y += dy * EASE;\n  rot += (Math.max(-34, Math.min(dx * 1.4, 34)) - rot) * 0.1;   // bank into the turn\n\n  const open = Math.abs(Math.sin(t / 1000 * FLAP));\n  L.setAttribute(\'transform\', `scale(${-0.25 - open * 0.75} 1)`);\n  R.setAttribute(\'transform\', `scale(${ 0.25 + open * 0.75} 1)`);\n\n  el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)`;\n  requestAnimationFrame(loop);\n})(0);\n<\/script>',
        react: 'import { useEffect, useRef } from \'react\';\n\nconst WING = "M0 0 C-4-13 -17-16 -18-6 C-19 2 -8 5 0 0 Z M0 1 C-4 11 -14 14 -15 6 C-16 0 -7-2 0 1 Z";\n\nexport function ButterflyCursor({\n  size = ' + p.size + ', flap = ' + p.flap + ', ease = ' + p.ease + ', wander = ' + p.wander + ', color = \'' + FX.pat(p.color, 0.5) + '\'\n}) {\n  const el = useRef(null), L = useRef(null), R = useRef(null);\n\n  useEffect(() => {\n    if (!matchMedia(\'(pointer: fine)\').matches) return;\n    let mx = 0, my = 0, x = 0, y = 0, rot = 0, id = 0;\n    const move = (e) => { mx = e.clientX; my = e.clientY; };\n    addEventListener(\'pointermove\', move, { passive: true });\n\n    const loop = (t) => {\n      const wx = Math.sin(t / 900) * wander;\n      const wy = Math.cos(t / 1150) * wander * 0.7;\n      const dx = (mx + wx) - x, dy = (my + wy) - y;\n      x += dx * ease; y += dy * ease;\n      rot += (Math.max(-34, Math.min(dx * 1.4, 34)) - rot) * 0.1;\n\n      const open = Math.abs(Math.sin(t / 1000 * flap));\n      L.current?.setAttribute(\'transform\', `scale(${-0.25 - open * 0.75} 1)`);\n      R.current?.setAttribute(\'transform\', `scale(${0.25 + open * 0.75} 1)`);\n      if (el.current) el.current.style.transform = `translate3d(${x}px,${y}px,0) rotate(${rot}deg)`;\n      id = requestAnimationFrame(loop);\n    };\n    id = requestAnimationFrame(loop);\n    return () => { removeEventListener(\'pointermove\', move); cancelAnimationFrame(id); };\n  }, [flap, ease, wander]);\n\n  return (\n    <div ref={el} className="fly" aria-hidden style={{ width: size, height: size, margin: `${-size / 2}px 0 0 ${-size / 2}px` }}>\n      <svg viewBox="0 0 40 40">\n        <g transform="translate(20 20)">\n          <g ref={L}><path d={WING} fill={color} /></g>\n          <g ref={R}><path d={WING} fill={color} /></g>\n          <rect x="-.9" y="-8" width="1.8" height="17" rx=".9" fill={color} />\n        </g>\n      </svg>\n    </div>\n  );\n}'
      };
    }
  });
})();
