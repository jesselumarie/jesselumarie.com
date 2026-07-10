/* FF7 kit: windows, cursor lists, sounds, save file, hint bar, config overlay.
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
  if (!settings.windowColor) settings.windowColor = 'Blue';

  /* ---------- hint bar ---------- */
  var hintEl = document.getElementById('hint');
  var defaultHint = '';
  function renderHint(t) {
    hintEl.innerHTML = String(t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/\./g, '<span class="dot">.</span>');
  }
  function setHint(t) { renderHint(t || defaultHint); }
  function setDefaultHint(t) {
    defaultHint = t;
    renderHint(defaultHint);
  }

  document.addEventListener('mouseover', function (e) {
    var t = e.target.closest('[data-hint]');
    setHint(t ? t.getAttribute('data-hint') : null);
  });

  /* ---------- sound ---------- */
  var audioCtx = null;
  function tone(freq, dur, vol) {
    if (!settings.sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      var o = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      o.type = 'square';
      o.frequency.value = freq;
      g.gain.setValueAtTime(vol, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
      o.connect(g).connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + dur + 0.01);
    } catch (e) { /* silence */ }
  }
  function blip() { tone(1320, 0.07, 0.03); }
  function confirmBeep() { tone(880, 0.09, 0.035); }
  function buzzer() { tone(160, 0.18, 0.05); }
  // cancel: softer, lower cousin of the cursor blip (backing out of a menu)
  function cancelBeep() { tone(990, 0.07, 0.025); }

  function getCtx() {
    if (!settings.sound) return null;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      return audioCtx;
    } catch (e) { return null; }
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

  /* ---------- window colors / shell settings ---------- */
  var WINDOW_COLORS = {
    Blue:     ['#2028b0', '#050840'],
    Green:    ['#0e7a34', '#032a10'],
    Crimson:  ['#a01030', '#2c030a'],
    Violet:   ['#7030c0', '#1a0640'],
    Midnight: ['#34344e', '#08080f']
  };

  function applyShellSettings() {
    var c = WINDOW_COLORS[settings.windowColor] || WINDOW_COLORS.Blue;
    document.documentElement.style.setProperty('--win-top', c[0]);
    document.documentElement.style.setProperty('--win-bottom', c[1]);
    document.body.classList.toggle('no-scanlines', !settings.scanlines);
  }

  /* ---------- config overlay ---------- */
  var overlay = document.getElementById('configOverlay');
  var configList = document.getElementById('configList');
  var configCursor = null;
  var configItems = [];
  var onConfigChange = function () {};

  function renderConfig() {
    configList.innerHTML = configItems.map(function (it) {
      return '<li><button class="citem" type="button" data-hint="' + it.hint + '">' +
        '<span class="hand">👉</span><span>' + it.label + '</span>' +
        '<span class="cval">' + it.value() + '</span></button></li>';
    }).join('');
    var lis = Array.prototype.slice.call(configList.children);
    configCursor = cursorList(lis, function (li) { li.querySelector('button').click(); });
    lis.forEach(function (li, i) {
      li.querySelector('button').addEventListener('click', function () {
        confirmBeep();
        configItems[i].act();
        if (overlay.classList.contains('open')) {
          onConfigChange();
          renderConfig();
        }
      });
    });
  }

  function openConfig(items, onChange) {
    configItems = items;
    onConfigChange = onChange || function () {};
    confirmBeep();
    renderConfig();
    overlay.classList.add('open');
  }
  function closeConfig() {
    overlay.classList.remove('open');
    setHint(null);
  }
  overlay.addEventListener('click', function (e) { if (e.target === overlay) closeConfig(); });

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
      if (timeEl) timeEl.textContent = Math.floor(s / 3600) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60);
      if (s > 0 && s % 10 === 0 && s !== lastAccrual) {
        lastAccrual = s;
        save.gil += 7;
      }
      if (gilEl) gilEl.textContent = save.gil.toLocaleString();
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
    if (hint != null) setDefaultHint(hint);
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
    var open = overlay.classList.contains('open');
    if (e.key === 'Escape') {
      if (open) { closeConfig(); return; }
      routerBack();
      return;
    }
    var cursor = open ? configCursor
      : (currentRoute && currentRoute.def.cursor ? currentRoute.def.cursor() : null);
    if (!cursor) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); cursor.move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); cursor.move(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); cursor.activate(); }
  });

  return {
    save: save,
    settings: settings,
    writeSave: writeSave,
    resetSave: resetSave,
    hint: setHint,
    setDefaultHint: setDefaultHint,
    sounds: {
      blip: blip,
      confirm: confirmBeep,
      cancel: cancelBeep,
      buzzer: buzzer,
      powerOn: powerOnSound,
      powerOff: powerOffSound
    },
    cursorList: cursorList,
    windowColors: WINDOW_COLORS,
    applyShellSettings: applyShellSettings,
    config: {
      open: openConfig,
      close: closeConfig,
      isOpen: function () { return overlay.classList.contains('open'); },
      cursor: function () { return configCursor; }
    },
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
