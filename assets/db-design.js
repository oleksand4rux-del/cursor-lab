/* ============================================================
   cursor lab — DESIGN
   Drawn cursors. Every entry is a self-contained <svg> used three
   ways: big preview, 17px catalogue icon, and the real
   `cursor: url(...)` value. Micro-animation only, no physics.
   ============================================================ */
(function () {
  'use strict';

  var DB = window.DESIGN_DB = [];
  var B = '#111111', W = '#ffffff';

  function svg(inner) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">' + inner + '</svg>';
  }

  /* pixel-art helper: a char grid becomes crisp <rect>s.
     `blinkChar` cells are grouped and winked on a SMIL loop. */
  function pix(rows, colors, opts) {
    opts = opts || {};
    var scale = opts.scale || 2;
    var w = rows[0].length * scale, h = rows.length * scale;
    var body = '', wink = '';
    for (var y = 0; y < rows.length; y++) {
      for (var x = 0; x < rows[y].length; x++) {
        var ch = rows[y][x], c = colors[ch];
        if (!c) continue;
        var r = '<rect x="' + (x * scale) + '" y="' + (y * scale) + '" width="' + scale +
          '" height="' + scale + '" fill="' + c + '"/>';
        if (opts.blinkChar && ch === opts.blinkChar) wink += r; else body += r;
      }
    }
    if (wink) {
      wink = '<g>' + wink +
        '<animate attributeName="opacity" values="1;1;0;1" keyTimes="0;0.9;0.94;0.98" dur="' +
        (opts.blinkDur || 4) + 's" repeatCount="indefinite"/></g>';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h +
      '" viewBox="0 0 ' + w + ' ' + h + '" shape-rendering="crispEdges">' + body + wink + '</svg>';
  }

  /* ellipse eye that closes for one beat of a long cycle */
  function blink(cx, cy, r, dur, delay) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + r + '" ry="' + r + '" fill="' + B + '">' +
      '<animate attributeName="ry" values="' + r + ';' + r + ';0.2;' + r + '" ' +
      'keyTimes="0;0.9;0.945;0.99" dur="' + dur + 's" begin="' + (delay || 0) + 's" repeatCount="indefinite"/>' +
      '</ellipse>';
  }

  /* the shared arrow silhouette */
  var ARROW = 'M6 3 L6 25.4 L11.7 19.7 L14.9 26.9 L18.5 25.3 L15.3 18.3 L22.8 17.9 Z';

  /* ── AERO ─────────────────────────────────────────────── */
  DB.push({
    id: 'aero-arrow', name: 'Aero Arrow', group: 'Aero', hot: [6, 3],
    desc: 'Glossy Vista-era pointer: pale glass body, iridescent teal-to-violet rim, one gloss streak. The only entry that keeps colour inside the artwork.',
    svg: svg(
      '<defs>' +
      '<linearGradient id="aar" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#5eead4"/><stop offset=".45" stop-color="#e9d5ff"/><stop offset="1" stop-color="#a855f7"/>' +
      '</linearGradient>' +
      '<linearGradient id="aaf" x1=".2" y1="0" x2=".8" y2="1">' +
      '<stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#f2f7ff"/><stop offset="1" stop-color="#dbe8ff"/>' +
      '</linearGradient></defs>' +
      '<path d="' + ARROW + '" fill="url(#aaf)" stroke="url(#aar)" stroke-width="1.7" stroke-linejoin="round"/>' +
      '<path d="M8.2 6.6 L8.2 16.4 L12.3 13.1 Z" fill="#fff" opacity=".9"/>')
  });

  /* ── Y2K ──────────────────────────────────────────────── */
  DB.push({
    id: 'y2k-arrow', name: 'Candy Arrow', group: 'Y2K', hot: [6, 3],
    desc: 'Flat bubblegum arrow with a fat white keyline — the 2003 desktop-theme look, rebuilt at one-third the file size.',
    svg: svg('<path d="' + ARROW + '" fill="#ff6fae" stroke="#ffffff" stroke-width="2.4" stroke-linejoin="round"/>')
  });

  DB.push({
    id: 'y2k-bunny', name: 'Bunny', group: 'Y2K', hot: [16, 16],
    desc: 'Ears drawn behind the head fill, so the outline never crosses itself. Blinks on a four-second loop.',
    svg: svg(
      '<g fill="#ffffff" stroke="' + B + '" stroke-width="1.8" stroke-linejoin="round">' +
      '<rect x="9.4" y="3.5" width="4.6" height="14" rx="2.3" transform="rotate(-9 11.7 10.5)"/>' +
      '<rect x="18" y="3.5" width="4.6" height="14" rx="2.3" transform="rotate(9 20.3 10.5)"/>' +
      '<rect x="7.2" y="13.4" width="17.6" height="14.4" rx="7.2"/></g>' +
      blink(12.4, 20.2, 1.2, 4) + blink(19.6, 20.2, 1.2, 4) +
      '<path d="M14.6 23.4 q1.4 1.5 2.8 0" fill="none" stroke="' + B + '" stroke-width="1.3" stroke-linecap="round"/>')
  });

  DB.push({
    id: 'y2k-star', name: 'Sparkle', group: 'Y2K', hot: [16, 16],
    desc: 'Four-point twinkle that breathes on its own. Good as a hover cursor over media tiles.',
    svg: svg(
      '<g><path d="M16 1.5 C17.3 10.8 21.2 14.7 30.5 16 C21.2 17.3 17.3 21.2 16 30.5 C14.7 21.2 10.8 17.3 1.5 16 C10.8 14.7 14.7 10.8 16 1.5 Z" fill="#ffffff"/>' +
      '<animateTransform attributeName="transform" type="scale" values="1;0.88;1" dur="2.2s" additive="sum" repeatCount="indefinite"/>' +
      '<animateTransform attributeName="transform" type="translate" values="0 0;1.9 1.9;0 0" dur="2.2s" additive="sum" repeatCount="indefinite"/></g>')
  });

  DB.push({
    id: 'y2k-cherry', name: 'Cherry', group: 'Y2K', hot: [16, 20],
    desc: 'Two berries, one stem, one specular dot. Pure decoration — pair it with a playful hero.',
    svg: svg(
      '<path d="M16 5 C13 10 10 14 9.5 18 M16 5 C19.4 9.6 21.6 14 22.2 18" fill="none" stroke="#3ecf6a" stroke-width="1.9" stroke-linecap="round"/>' +
      '<path d="M16 5 q4-3.4 7.4-2.2 q-2 3.6-6 3.4 z" fill="#3ecf6a"/>' +
      '<circle cx="9.6" cy="22.4" r="5.2" fill="#ff3b5c"/><circle cx="22.4" cy="22.8" r="4.6" fill="#e0284a"/>' +
      '<circle cx="7.9" cy="20.6" r="1.35" fill="#fff" opacity=".85"/>')
  });

  DB.push({
    id: 'y2k-heart-arrow', name: 'Love Arrow', group: 'Y2K', hot: [6, 3],
    desc: 'Arrow with a heart pip riding the tail. Still reads instantly at 32 pixels.',
    svg: svg(
      '<path d="' + ARROW + '" fill="#ffffff" stroke="#ff6fae" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<path d="M22.6 20.6 c1-1.2 3-0.5 3 1.1 c0 1.8-2 3-3 3.9 c-1-0.9-3-2.1-3-3.9 c0-1.6 2-2.3 3-1.1 z" fill="#ff3b5c"/>')
  });

  /* ── 8-BIT ────────────────────────────────────────────── */
  DB.push({
    id: 'bit-arrow', name: 'Pixel Arrow', group: '8-bit', hot: [0, 0], pixel: true,
    desc: 'The 12x16 classic, rebuilt rect by rect. Crisp at any device pixel ratio, zero anti-aliasing.',
    svg: pix([
      'B...........',
      'BB..........',
      'BWB.........',
      'BWWB........',
      'BWWWB.......',
      'BWWWWB......',
      'BWWWWWB.....',
      'BWWWWWWB....',
      'BWWWWWWWB...',
      'BWWWWWWWWB..',
      'BWWWWWBBBBB.',
      'BWWBWWB.....',
      'BWB.BWWB....',
      'BB..BWWB....',
      'B....BWWB...',
      '......BB....'
    ], { B: B, W: W })
  });

  DB.push({
    id: 'bit-heart', name: 'Pixel Heart', group: '8-bit', hot: [9, 8], pixel: true,
    desc: 'Nine pixels wide. The only coloured 8-bit entry, so it stays the accent of the group.',
    svg: pix([
      '.BB...BB.',
      'BRRB.BRRB',
      'BRRRBRRRB',
      'BRRRRRRRB',
      '.BRRRRRB.',
      '..BRRRB..',
      '...BRB...',
      '....B....'
    ], { B: B, R: '#ff3b5c' })
  });

  DB.push({
    id: 'bit-pencil', name: 'Pixel Pencil', group: '8-bit', hot: [0, 20], pixel: true,
    desc: 'Draw or annotate affordance. The hotspot sits on the graphite tip, bottom-left.',
    svg: pix([
      '......BBB.',
      '.....BYYB.',
      '....BYYYB.',
      '...BYYYB..',
      '..BYYYB...',
      '.BYYYB....',
      'BWWYB.....',
      'BWWB......',
      'BWB.......',
      'BB........'
    ], { B: B, W: W, Y: '#ffd23f' })
  });

  /* ── KAWAII ───────────────────────────────────────────── */
  DB.push({
    id: 'kitty', name: 'Kitty', group: 'Kawaii', hot: [30, 12], pixel: true,
    desc: 'Solid-white pixel cat: tail up on the left, two ears, four legs, and a pair of one-pixel eye slits that wink every four seconds.',
    svg: pix([
      '......WW............',
      '.....WWW...WW..WW...',
      '.....WWW...WWW.WWW..',
      '....WWWW...WWWWWWW..',
      '....WWWWW.WWWWWWWW..',
      '...WWWWWWWWWWWWWWW..',
      '...WWWWWWWWEWWWEWW..',
      '..WWWWWWWWWEWWWEWW..',
      '..WWWWWWWWWWWWWWWW..',
      '..WWWWWWWWWWWWWWWWW.',
      '.WWWWWWWWWWWWWWWWWW.',
      '.WWWWWWWWWWWWWWWWWW.',
      '.WWWWWWWWWWWWWWWWW..',
      '..WWWWWWWWWWWWWWWW..',
      '..WWW.WWWW.WWWWWWW..',
      '..WWW..WWW.WWW.WWW..',
      '..WW...WWW.WWW.WWW..',
      '..WW...WWW.WW..WWW..',
      '.......WW.......WW..'
    ], { W: W, E: '#000000' }, { blinkChar: 'E', blinkDur: 4 })
  });

  DB.push({
    id: 'peepers', name: 'Peepers', group: 'Kawaii', hot: [16, 18],
    desc: 'Just the eyes — two lozenges with off-centre pupils and an offset blink, so the pair never shuts in perfect sync.',
    svg: svg(
      '<g><ellipse cx="10.6" cy="16" rx="6.4" ry="8.4" fill="#ffffff"/>' +
      '<ellipse cx="21.4" cy="16" rx="6.4" ry="8.4" fill="#ffffff"/></g>' +
      blink(9.4, 15.2, 3.1, 3.6) + blink(20.2, 15.2, 3.1, 3.6, 0.18) +
      '<circle cx="8.3" cy="17.6" r="0.85" fill="#ffffff"/>' +
      '<circle cx="19.1" cy="17.6" r="0.85" fill="#ffffff"/>')
  });
})();
