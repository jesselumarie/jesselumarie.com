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
  function cursorList(items, onActivate) {
    var idx = 0;
    function apply(quiet) {
      items.forEach(function (li, i) { li.classList.toggle('selected', i === idx); });
      if (!quiet) blip();
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

  /* ---------- time (persistent across visits) & gil ---------- */
  function initClock() {
    var timeEl = document.getElementById('time');
    var gilEl = document.getElementById('gil');
    var sessionStart = Date.now();
    var baseSeconds = save.seconds;

    function totalSeconds() {
      return baseSeconds + Math.floor((Date.now() - sessionStart) / 1000);
    }

    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    function tick() {
      var s = totalSeconds();
      timeEl.textContent = Math.floor(s / 3600) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60);
      if (s > 0 && s % 10 === 0) {
        save.gil += 7;
        gilEl.textContent = save.gil.toLocaleString();
      }
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

    gilEl.textContent = save.gil.toLocaleString();
    tick();
    setInterval(tick, 1000);
  }

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
    initClock: initClock
  };
})();
