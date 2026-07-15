/* FF7 kit: windows, cursor lists, sounds, save file, hint bar, router.
   Content-agnostic — site-specific data and screens live in screens.js. */
var FF7 = (function () {
  'use strict';

  /* ---------- save data ---------- */
  var KEY = 'ff7save';
  function loadSave() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  function writeSave() {
    try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* private mode */ }
  }
  function resetSave() {
    try { localStorage.removeItem(KEY); } catch (e) {}
  }
  var save = loadSave();
  if (typeof save.seconds !== 'number') save.seconds = 0;
  if (typeof save.gil !== 'number') save.gil = 2244;
  save.settings = save.settings || {};
  var settings = save.settings;
  if (typeof settings.sound !== 'boolean') settings.sound = true;
  if (typeof settings.scanlines !== 'boolean') settings.scanlines = true;
  if (typeof settings.birthday !== 'boolean') settings.birthday = false;
  // window color: RGB per corner, like the game's Config screen
  // (PSX defaults: pure blue 176/128/80/32 from top-left to bottom-right)
  function defaultCorners() {
    return { tl: [0, 0, 176], tr: [0, 0, 128], bl: [0, 0, 80], br: [0, 0, 32] };
  }
  if (!settings.windowColor || typeof settings.windowColor === 'string' ||
      !settings.windowColor.tl) {
    settings.windowColor = defaultCorners();
  }

  /* ---------- hint bar (the game's help window) + screen title tab ---------- */
  var hintEl = document.getElementById('hint');
  var titleEl = document.getElementById('screenTitle');
  var defaultHint = '';
  var showingDefault = true;
  function renderHint(t) {
    hintEl.innerHTML = String(t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/\./g, '<span class="dot">.</span>');
  }
  function setHint(t) {
    showingDefault = !t;
    renderHint(t || defaultHint);
  }
  function setDefaultHint(t) {
    defaultHint = t;
    // don't stomp a contextual hint (e.g. the window color editor's)
    if (showingDefault) renderHint(defaultHint);
  }
  // sub-screens get a small title window right of the help bar, like the
  // game's "Config"/"Equip" tab; the main menu has none
  function setTitle(t) {
    if (!titleEl) return;
    titleEl.textContent = t || '';
    titleEl.hidden = !t;
  }

  document.addEventListener('mouseover', function (e) {
    var t = e.target.closest('[data-hint]');
    setHint(t ? t.getAttribute('data-hint') : null);
  });

  /* ---------- sound ----------
     Synthesized to match the PSX menu SFX, measured from the real
     samples (10ms FFT windows): pitch contours, envelopes, timing. */
  var audioCtx = null;
  function getCtx() {
    if (!settings.sound) return null;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      return audioCtx;
    } catch (e) { return null; }
  }

  // master level for menu SFX (the raw envelopes below mirror the game's
  // relative levels; this scales them to polite web volume)
  var SFX_VOL = 0.5;

  function sfxOsc(ctx, type, t0, t1, freqs, gains) {
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = type;
    freqs.forEach(function (f) { o.frequency[f[0]](f[1], t0 + f[2]); });
    gains.forEach(function (v) { g.gain[v[0]](v[1] * SFX_VOL, t0 + v[2]); });
    o.connect(g).connect(ctx.destination);
    o.start(t0); o.stop(t1 + 0.02);
  }

  // cursor move: 130ms chirp, 1200 -> 2100Hz over 70ms, exponential decay
  function blip() {
    var ctx = getCtx(); if (!ctx) return;
    var t = ctx.currentTime;
    sfxOsc(ctx, 'sine', t, t + 0.145,
      [['setValueAtTime', 1200, 0], ['linearRampToValueAtTime', 2100, 0.07]],
      [['setValueAtTime', 0.09, 0], ['exponentialRampToValueAtTime', 0.01, 0.13],
       ['linearRampToValueAtTime', 0.0002, 0.145]]);
  }

  // confirm: bright 11.2kHz ping (55ms), then 6.3kHz tail decaying to 380ms
  function confirmBeep() {
    var ctx = getCtx(); if (!ctx) return;
    var t = ctx.currentTime;
    sfxOsc(ctx, 'sine', t, t + 0.055,
      [['setValueAtTime', 11200, 0]],
      [['setValueAtTime', 0.06, 0], ['setValueAtTime', 0.06, 0.045],
       ['linearRampToValueAtTime', 0.0002, 0.055]]);
    sfxOsc(ctx, 'sine', t + 0.085, t + 0.40,
      [['setValueAtTime', 6300, 0]],
      [['setValueAtTime', 0.07, 0], ['exponentialRampToValueAtTime', 0.012, 0.295],
       ['linearRampToValueAtTime', 0.0002, 0.315]]);
  }

  // cancel: quick two-step blip, 3.15kHz (30ms) then 6.35kHz (30ms)
  function cancelBeep() {
    var ctx = getCtx(); if (!ctx) return;
    var t = ctx.currentTime;
    sfxOsc(ctx, 'sine', t, t + 0.062,
      [['setValueAtTime', 3150, 0], ['setValueAtTime', 6350, 0.03]],
      [['setValueAtTime', 0.05, 0], ['setValueAtTime', 0.06, 0.03],
       ['exponentialRampToValueAtTime', 0.0002, 0.062]]);
  }

  // buzzer: harsh ~100Hz buzz in two bursts (100ms, gap, 225ms)
  function buzzer() {
    var ctx = getCtx(); if (!ctx) return;
    var t = ctx.currentTime;
    [[0, 0.10], [0.12, 0.345]].forEach(function (seg) {
      var dur = seg[1] - seg[0];
      sfxOsc(ctx, 'sawtooth', t + seg[0], t + seg[1],
        [['setValueAtTime', 100, 0]],
        [['setValueAtTime', 0.11, 0], ['setValueAtTime', 0.11, dur - 0.01],
         ['linearRampToValueAtTime', 0.0002, dur]]);
    });
  }

  function noiseBurst(ctx, at, dur, vol, filterFreq) {
    var len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = filterFreq || 2000;
    var g = ctx.createGain();
    g.gain.setValueAtTime(vol, at);
    src.connect(f).connect(g).connect(ctx.destination);
    src.start(at);
  }

  // CRT power-on: relay click, low degauss bloom, rising sweep, flyback whine
  function powerOnSound() {
    var ctx = getCtx();
    if (!ctx) return;
    var t = ctx.currentTime;

    noiseBurst(ctx, t, 0.025, 0.09, 2500);

    var bloom = ctx.createOscillator();
    var bg = ctx.createGain();
    bloom.type = 'sine';
    bloom.frequency.setValueAtTime(42, t);
    bloom.frequency.exponentialRampToValueAtTime(58, t + 0.35);
    bg.gain.setValueAtTime(0.0001, t);
    bg.gain.exponentialRampToValueAtTime(0.07, t + 0.08);
    bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
    bloom.connect(bg).connect(ctx.destination);
    bloom.start(t); bloom.stop(t + 0.6);

    var sweep = ctx.createOscillator();
    var sg = ctx.createGain();
    sweep.type = 'triangle';
    sweep.frequency.setValueAtTime(220, t + 0.04);
    sweep.frequency.exponentialRampToValueAtTime(1600, t + 0.22);
    sg.gain.setValueAtTime(0.0001, t + 0.04);
    sg.gain.exponentialRampToValueAtTime(0.035, t + 0.1);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    sweep.connect(sg).connect(ctx.destination);
    sweep.start(t + 0.04); sweep.stop(t + 0.32);

    var whine = ctx.createOscillator();
    var wg = ctx.createGain();
    whine.type = 'sine';
    whine.frequency.value = 15625;
    wg.gain.setValueAtTime(0.0001, t + 0.1);
    wg.gain.exponentialRampToValueAtTime(0.012, t + 0.4);
    wg.gain.setValueAtTime(0.012, t + 1.0);
    wg.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    whine.connect(wg).connect(ctx.destination);
    whine.start(t + 0.1); whine.stop(t + 1.85);
  }

  // CRT power-off: falling sweep, deep thump, static discharge tick
  function powerOffSound() {
    var ctx = getCtx();
    if (!ctx) return;
    var t = ctx.currentTime;

    var sweep = ctx.createOscillator();
    var sg = ctx.createGain();
    sweep.type = 'sine';
    sweep.frequency.setValueAtTime(1800, t);
    sweep.frequency.exponentialRampToValueAtTime(55, t + 0.28);
    sg.gain.setValueAtTime(0.06, t);
    sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
    sweep.connect(sg).connect(ctx.destination);
    sweep.start(t); sweep.stop(t + 0.32);

    var thump = ctx.createOscillator();
    var tg = ctx.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(70, t + 0.02);
    thump.frequency.exponentialRampToValueAtTime(32, t + 0.35);
    tg.gain.setValueAtTime(0.0001, t + 0.02);
    tg.gain.exponentialRampToValueAtTime(0.11, t + 0.06);
    tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    thump.connect(tg).connect(ctx.destination);
    thump.start(t + 0.02); thump.stop(t + 0.55);

    noiseBurst(ctx, t + 0.16, 0.04, 0.05, 4000);
  }

  /* ---------- cursor-driven lists ---------- */
  function itemHint(li) {
    var el = li.hasAttribute('data-hint') ? li : li.querySelector('[data-hint]');
    return el ? el.getAttribute('data-hint') : null;
  }

  function cursorList(items, onActivate) {
    var idx = 0;
    function apply(quiet) {
      items.forEach(function (li, i) { li.classList.toggle('selected', i === idx); });
      // the hint tracks the cursor however it moves (mouse or keyboard);
      // the initial quiet apply keeps the screen's default hint showing
      if (!quiet) {
        blip();
        setHint(itemHint(items[idx]));
      }
    }
    apply(true);
    items.forEach(function (li, i) {
      li.addEventListener('mouseenter', function () {
        if (idx !== i) { idx = i; apply(); }
      });
    });
    return {
      move: function (delta) { idx = (idx + delta + items.length) % items.length; apply(); },
      activate: function () { onActivate(items[idx]); },
      current: function () { return items[idx]; }
    };
  }

  /* ---------- window colors / shell settings ----------
     The PSX renders every window as one quad with a color per vertex
     (Gouraud shading). Recreate that exactly: bilinear-interpolate the
     four corner colors into a small canvas and stretch it over each
     window via a CSS variable. */
  function cornerGradientURL(c) {
    var N = 32;
    var cv = document.createElement('canvas');
    cv.width = N; cv.height = N;
    var g = cv.getContext('2d');
    var img = g.createImageData(N, N);
    for (var y = 0; y < N; y++) {
      var fy = y / (N - 1);
      for (var x = 0; x < N; x++) {
        var fx = x / (N - 1);
        var o = (y * N + x) * 4;
        for (var ch = 0; ch < 3; ch++) {
          var top = c.tl[ch] + (c.tr[ch] - c.tl[ch]) * fx;
          var bot = c.bl[ch] + (c.br[ch] - c.bl[ch]) * fx;
          img.data[o + ch] = Math.round(top + (bot - top) * fy);
        }
        img.data[o + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    return 'url(' + cv.toDataURL() + ')';
  }

  function applyShellSettings() {
    document.documentElement.style.setProperty(
      '--win-bg', cornerGradientURL(settings.windowColor));
    document.body.classList.toggle('no-scanlines', !settings.scanlines);
  }

  /* ---------- TV power (desktop shell) ---------- */
  function initPowerButton() {
    var powerBtn = document.getElementById('powerBtn');
    var frameEl = document.querySelector('.frame');
    if (powerBtn) {
      powerBtn.addEventListener('click', function () {
        var off = document.body.classList.toggle('tv-off');
        if (!off) {
          frameEl.classList.add('tv-on-anim');
          setTimeout(function () { frameEl.classList.remove('tv-on-anim'); }, 300);
        }
        if (off) { powerOffSound(); } else { powerOnSound(); }
      });
    }
  }

  function powerOffAndNavigate(href) {
    powerOffSound();
    document.body.classList.add('tv-off');
    setTimeout(function () { window.location.href = href; }, 650);
  }

  /* ---------- time (persistent across visits) & gil ----------
     The #time/#gil elements live inside the current screen's render
     output, so tick() re-queries them and tolerates their absence. */
  var clockTick = null;
  function initClock() {
    var sessionStart = Date.now();
    var baseSeconds = save.seconds;
    var lastAccrual = 0;

    function totalSeconds() {
      return baseSeconds + Math.floor((Date.now() - sessionStart) / 1000);
    }

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function tick() {
      var timeEl = document.getElementById('time');
      var gilEl = document.getElementById('gil');
      var s = totalSeconds();
      // colons blink once a second, like the game's play-time display
      if (timeEl) timeEl.innerHTML = Math.floor(s / 3600) +
        '<span class="tsep">:</span>' + pad(Math.floor(s / 60) % 60) +
        '<span class="tsep">:</span>' + pad(s % 60);
      if (s > 0 && s % 10 === 0 && s !== lastAccrual) {
        lastAccrual = s;
        save.gil += 7;
      }
      // the game prints gil as a bare number — no thousands separator
      if (gilEl) gilEl.textContent = String(save.gil);
      if (s % 5 === 0) persist();
    }

    function persist() {
      save.seconds = totalSeconds();
      writeSave();
    }

    window.addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') persist();
    });

    clockTick = tick;
    tick();
    setInterval(tick, 1000);
  }
  function syncClock() { if (clockTick) clockTick(); }

  /* ---------- router (hash-based) ----------
     Screens register with a path pattern ('', 'writing', 'writing/:slug').
     hashchange drives rendering, so browser Back works and deep links
     resolve on load. Escape pops one level to the registered parent. */
  var routes = [];
  var currentRoute = null; // { def, params }
  var routerMount = null;

  function findRoute(name) {
    for (var i = 0; i < routes.length; i++) if (routes[i].name === name) return routes[i];
    return null;
  }

  function matchHash() {
    var h = location.hash.replace(/^#\/?/, '');
    var segs = h === '' ? [] : h.split('/').map(decodeURIComponent);
    for (var i = 0; i < routes.length; i++) {
      var pat = routes[i].path === '' ? [] : routes[i].path.split('/');
      if (pat.length !== segs.length) continue;
      var params = {};
      var ok = true;
      for (var j = 0; j < pat.length; j++) {
        if (pat[j].charAt(0) === ':') params[pat[j].slice(1)] = segs[j];
        else if (pat[j] !== segs[j]) { ok = false; break; }
      }
      if (ok) return { def: routes[i], params: params };
    }
    return null;
  }

  function hashFor(name, params) {
    var def = findRoute(name);
    if (!def) return '#/';
    var path = def.path === '' ? '' : def.path.split('/').map(function (seg) {
      return seg.charAt(0) === ':' ? encodeURIComponent((params || {})[seg.slice(1)]) : seg;
    }).join('/');
    return '#/' + path;
  }

  function goRoute(name, params) {
    var target = hashFor(name, params);
    if (location.hash === target) renderRoute();
    else location.hash = target;
  }

  function renderRoute() {
    var match = matchHash();
    if (!match) {
      // unknown or empty hash: fall back to the root screen
      for (var i = 0; i < routes.length; i++) {
        if (routes[i].path === '') { match = { def: routes[i], params: {} }; break; }
      }
      if (!match) return;
    }
    if (currentRoute && currentRoute.def.destroy) currentRoute.def.destroy();
    currentRoute = match;
    routerMount.innerHTML = '';
    var hint = typeof match.def.hint === 'function' ? match.def.hint(match.params) : match.def.hint;
    if (hint != null) defaultHint = hint;
    setHint(null); // entering a screen always shows its default hint
    setTitle(match.def.title || null);
    match.def.render(routerMount, match.params);
  }

  function routerBack() {
    if (currentRoute && currentRoute.def.parent) {
      cancelBeep();
      goRoute(currentRoute.def.parent);
      return true;
    }
    return false;
  }

  function startRouter(mountEl) {
    routerMount = mountEl;
    window.addEventListener('hashchange', renderRoute);
    renderRoute();
  }

  /* ---------- keyboard ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      // a screen may consume Escape itself (e.g. the window color editor)
      if (currentRoute && currentRoute.def.onEscape && currentRoute.def.onEscape()) return;
      routerBack();
      return;
    }
    var cursor = currentRoute && currentRoute.def.cursor ? currentRoute.def.cursor() : null;
    if (!cursor) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); cursor.move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); cursor.move(-1); }
    else if (e.key === 'ArrowLeft' && cursor.moveH) { e.preventDefault(); cursor.moveH(-1); }
    else if (e.key === 'ArrowRight' && cursor.moveH) { e.preventDefault(); cursor.moveH(1); }
    else if (e.key === 'Enter') { e.preventDefault(); cursor.activate(); }
  });

  return {
    save: save,
    settings: settings,
    writeSave: writeSave,
    resetSave: resetSave,
    hint: setHint,
    setDefaultHint: setDefaultHint,
    setTitle: setTitle,
    sounds: {
      blip: blip,
      confirm: confirmBeep,
      cancel: cancelBeep,
      buzzer: buzzer,
      powerOn: powerOnSound,
      powerOff: powerOffSound
    },
    cursorList: cursorList,
    defaultWindowCorners: defaultCorners,
    cornerGradientURL: cornerGradientURL,
    applyShellSettings: applyShellSettings,
    power: {
      initButton: initPowerButton,
      offAndNavigate: powerOffAndNavigate
    },
    clock: {
      init: initClock,
      sync: syncClock
    },
    router: {
      register: function (def) { routes.push(def); },
      go: goRoute,
      back: routerBack,
      start: startRouter,
      current: function () { return currentRoute; }
    }
  };
})();
