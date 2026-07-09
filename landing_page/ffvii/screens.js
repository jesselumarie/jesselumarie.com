/* Site-specific screens and data for jesselumarie.com's FF7 menu.
   Uses the content-agnostic kit in ff7.js (global FF7). */
(function () {
  'use strict';

  var settings = FF7.settings;

  /* ---------- birthday math (June 22) ---------- */
  var BMONTH = 5, BDAY = 22, BYEAR = 1986;
  function now() { return new Date(); }
  function isBirthday() {
    var d = now();
    return settings.birthday || (d.getMonth() === BMONTH && d.getDate() === BDAY);
  }
  function age() {
    var d = now();
    var a = d.getFullYear() - BYEAR;
    if (d.getMonth() < BMONTH || (d.getMonth() === BMONTH && d.getDate() < BDAY)) a--;
    return a;
  }
  function daysToNextLevel() {
    var d = now();
    var next = new Date(d.getFullYear(), BMONTH, BDAY);
    if (next - d <= 0) next = new Date(d.getFullYear() + 1, BMONTH, BDAY);
    var today = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.round((next - today) / 86400000);
  }

  /* ---------- party ---------- */
  var lv = age();
  var days = daysToNextLevel();
  var yearPct = Math.round((1 - days / 365) * 100);
  // Static, random, deliberately-not-full limit gauge (full only on the birthday).
  var limitPct = 25 + Math.floor(Math.random() * 56);

  var party = [
    {
      name: 'Jesse', img: 'jesse_ff7.png',
      lv: lv, hp: [9999, 9999], mp: [999, 999],
      limitLevel: Math.floor(lv / 10),
      hint: 'Jesse — software developer, former lawyer, LV ' + lv + '.'
    }
  ];

  function fmtPair(pair) {
    return '<span class="pnum">' + pair[0] + '</span>/<span class="pnum">' + pair[1] + '</span>';
  }

  function memberStatsHTML(m) {
    return '<img class="portrait" src="' + m.img + '" alt="Portrait of ' + m.name + '">' +
      '<div class="stats">' +
        '<p class="mname">' + m.name + '</p>' +
        '<div class="srow"><span class="lab">LV</span><span class="val">' + m.lv + '</span></div>' +
        '<div class="srow"><span class="lab">HP</span><span class="val">' + fmtPair(m.hp) + '</span><span class="thinbar"><span style="width:100%"></span></span></div>' +
        '<div class="srow"><span class="lab">MP</span><span class="val">' + fmtPair(m.mp) + '</span><span class="thinbar"><span style="width:100%"></span></span></div>' +
      '</div>';
  }

  function renderParty() {
    var el = document.getElementById('party');
    if (!el) return;
    var html = '';
    party.forEach(function (m) {
      {
        var birthday = isBirthday();
        html +=
          '<div class="member" data-hint="' + m.hint + '">' +
            memberStatsHTML(m) +
            '<div class="growth">' +
              '<div class="glabel"><span>next level</span><span class="gsub">' +
                (birthday ? 'LEVEL UP!' : days + (days === 1 ? ' day' : ' days')) +
              '</span></div>' +
              '<div class="fatbar"><span style="width:' + (birthday ? 100 : yearPct) + '%"></span></div>' +
              '<div class="glabel"><span>Limit level ' + m.limitLevel + '</span></div>' +
              '<div class="fatbar' + (birthday ? ' rainbow' : '') + '"><span style="width:' + limitPct + '%"></span></div>' +
            '</div>' +
          '</div>';
      }
    });
    el.innerHTML = html;
  }

  function defaultHint() {
    if (isBirthday()) return 'Happy birthday, Jesse! Limit break ready.';
    return 'Welcome to jesselumarie.com';
  }

  function applySettings() {
    FF7.applyShellSettings();
    FF7.setDefaultHint(defaultHint());
    renderParty();
    FF7.writeSave();
  }

  /* ---------- config / debug menu ---------- */
  var configItems = [
    {
      label: 'Window color',
      hint: 'Cycle the window color, like the in-game Config screen.',
      value: function () { return settings.windowColor; },
      act: function () {
        var keys = Object.keys(FF7.windowColors);
        settings.windowColor = keys[(keys.indexOf(settings.windowColor) + 1) % keys.length];
      }
    },
    {
      label: 'Sound',
      hint: 'Toggle cursor sound effects.',
      value: function () { return settings.sound ? 'On' : 'Off'; },
      act: function () { settings.sound = !settings.sound; }
    },
    {
      label: 'CRT filter',
      hint: 'Toggle the 1997 CRT picture tube.',
      value: function () { return settings.scanlines ? 'On' : 'Off'; },
      act: function () { settings.scanlines = !settings.scanlines; }
    },
    {
      label: 'Birthday mode',
      hint: 'Debug: pretend it is June 22 and charge the limit gauge.',
      value: function () { return settings.birthday ? 'On' : 'Off'; },
      act: function () { settings.birthday = !settings.birthday; }
    },
    {
      label: 'Reroll limit',
      hint: 'Debug: reroll the random limit gauge.',
      value: function () { return limitPct + '%'; },
      act: function () { limitPct = 25 + Math.floor(Math.random() * 56); }
    },
    {
      label: 'Reset save data',
      hint: 'Debug: clear time, gil, and settings.',
      value: function () { return ''; },
      act: function () {
        FF7.resetSave();
        location.reload();
      }
    },
    {
      label: 'Close',
      hint: 'Return to the menu.',
      value: function () { return ''; },
      act: function () { FF7.config.close(); }
    }
  ];

  /* ---------- main screen (#/) ---------- */
  var MAIN_LAYOUT =
    '<div class="layout">' +

      '<section class="party window" aria-label="Party" id="party"></section>' +

      '<nav class="menu window" aria-label="Main menu">' +
        '<ul id="menu">' +
          '<li><a href="#/about" data-hint="Learn more about Jesse."><span class="hand">👉</span>About</a></li>' +
          '<li><a href="#/writing" data-hint="Read Jesse\'s writing."><span class="hand">👉</span>Writing</a></li>' +
          '<li><a href="https://github.com/jesselumarie" data-hint="Inspect Jesse\'s materia."><span class="hand">👉</span>GitHub</a></li>' +
          '<li><a href="https://www.linkedin.com/in/jesselumarie" data-hint="Employment record and battle history."><span class="hand">👉</span>LinkedIn</a></li>' +
          '<li><a href="https://twitter.com/jesselumarie" data-hint="Short-form dispatches."><span class="hand">👉</span>Twitter</a></li>' +
          '<li><a href="https://instagram.com/jesselumarie" data-hint="Field photography."><span class="hand">👉</span>Instagram</a></li>' +
          '<li><a href="mailto:jesse.lumarie@gmail.com" data-hint="PHS — send Jesse a message."><span class="hand">👉</span>PHS</a></li>' +
          '<li><a href="#" data-action="config" data-hint="Adjust windows, sound, and debug options."><span class="hand">👉</span>Config</a></li>' +
          '<li class="spacer" role="presentation"></li>' +
          '<li><a href="#" class="disabled" data-action="save" data-hint="You cannot save here."><span class="hand">👉</span>Save</a></li>' +
          '<li><a href="/" data-action="exit" data-hint="Power off and return to jesselumarie.com"><span class="hand">👉</span>Exit</a></li>' +
        '</ul>' +
      '</nav>' +

      '<section class="loc window" aria-label="Location">Boulder, CO</section>' +

      '<section class="timegil window" aria-label="Time and gil">' +
        '<div class="kv"><span>Time</span> <span class="v time-v" id="time">0:00:00</span></div>' +
        '<div class="kv"><span>Gil</span> <span class="v" id="gil">2244</span></div>' +
      '</section>' +

    '</div>';

  var mainCursor = null;

  var mainScreen = {
    name: 'main',
    path: '',
    hint: function () { return defaultHint(); },
    cursor: function () { return mainCursor; },
    render: function (mount) {
      mount.innerHTML = MAIN_LAYOUT;
      renderParty();
      FF7.clock.sync();

      var menuItems = Array.prototype.slice.call(mount.querySelectorAll('#menu li:not(.spacer)'));
      mainCursor = FF7.cursorList(menuItems, function (li) { li.querySelector('a').click(); });

      mount.querySelectorAll('#menu a').forEach(function (a) {
        a.addEventListener('click', function (e) {
          var action = a.getAttribute('data-action');
          if (action === 'config') { e.preventDefault(); FF7.config.open(configItems, applySettings); return; }
          if (action === 'save') { e.preventDefault(); FF7.sounds.buzzer(); FF7.hint('You cannot save here.'); return; }
          if (action === 'exit') {
            e.preventDefault();
            FF7.power.offAndNavigate(a.href);
            return;
          }
          FF7.sounds.confirm();
        });
      });
    }
  };

  /* ---------- writing screens (#/writing, #/writing/<slug>) ---------- */
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmtDate(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    if (!m) return '';
    return MONTHS[+m[2] - 1] + ' ' + (+m[3]) + ', ' + m[1];
  }

  var blogIndex = null;
  function fetchBlogIndex() {
    if (blogIndex) return Promise.resolve(blogIndex);
    return fetch(FF7_MANIFEST.blogIndexUrl).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(function (data) {
      blogIndex = data;
      return data;
    });
  }

  function onScreen(name) {
    var cur = FF7.router.current();
    return cur && cur.def.name === name;
  }

  function fallbackDialog(title, message, href, label) {
    return '<h2>' + title + '</h2>' +
      '<p>' + message + '</p>' +
      '<ul class="dialog-actions">' +
        '<li><a href="' + href + '" data-hint="Leave the menu and open the page directly."><span class="hand">👉</span>' + label + '</a></li>' +
        '<li><a href="#/" data-back data-hint="Return to the menu."><span class="hand">👉</span>Back</a></li>' +
      '</ul>';
  }

  function wireDialogActions(mount, cursorSetter) {
    var items = Array.prototype.slice.call(mount.querySelectorAll('.dialog-actions li'));
    cursorSetter(FF7.cursorList(items, function (li) { li.querySelector('a').click(); }));
    var back = mount.querySelector('[data-back]');
    if (back) back.addEventListener('click', function (e) { e.preventDefault(); FF7.router.back(); });
  }

  var writingCursor = null;
  var writingScreen = {
    name: 'writing',
    path: 'writing',
    parent: 'main',
    hint: 'Select an entry.',
    cursor: function () { return writingCursor; },
    render: function (mount) {
      writingCursor = null;
      mount.innerHTML =
        '<div class="dialog window submenu" role="dialog" aria-label="Writing" tabindex="-1">' +
          '<h2>Writing</h2>' +
          '<p class="loading">Loading&hellip;</p>' +
        '</div>';
      var dialog = mount.querySelector('.dialog');
      dialog.focus({ preventScroll: true });
      fetchBlogIndex().then(function (data) {
        if (!onScreen('writing')) return;
        dialog.innerHTML =
          '<h2>Writing</h2>' +
          '<ul class="postlist">' +
            data.articles.map(function (a) {
              return '<li><a href="#/writing/' + encodeURIComponent(a.slug) + '" data-hint="' + esc(a.summary) + '">' +
                '<span class="hand">👉</span>' +
                '<span class="ptitle">' + esc(a.title) + '</span>' +
                '<span class="pdate">' + fmtDate(a.date) + '</span></a></li>';
            }).join('') +
            '<li><a href="#/" data-back data-hint="Return to the menu."><span class="hand">👉</span><span class="ptitle">Back</span></a></li>' +
          '</ul>';
        var items = Array.prototype.slice.call(dialog.querySelectorAll('.postlist li'));
        writingCursor = FF7.cursorList(items, function (li) { li.querySelector('a').click(); });
        dialog.querySelectorAll('.postlist a:not([data-back])').forEach(function (a) {
          a.addEventListener('click', function () { FF7.sounds.confirm(); });
        });
        dialog.querySelector('[data-back]').addEventListener('click', function (e) {
          e.preventDefault();
          FF7.router.back();
        });
      }).catch(function () {
        if (!onScreen('writing')) return;
        dialog.innerHTML = fallbackDialog('Writing',
          'The archive could not be loaded.',
          FF7_MANIFEST.blogFallbackUrl, 'Read the blog');
        wireDialogActions(dialog, function (c) { writingCursor = c; });
      });
    }
  };

  var articleCursor = null;
  var articleScreen = {
    name: 'article',
    path: 'writing/:slug',
    parent: 'writing',
    hint: 'Loading…',
    cursor: function () { return articleCursor; },
    render: function (mount, params) {
      articleCursor = null;
      mount.innerHTML =
        '<div class="dialog window article" role="dialog" aria-label="Article" tabindex="-1">' +
          '<p class="loading">Loading&hellip;</p>' +
        '</div>';
      var dialog = mount.querySelector('.dialog');
      dialog.focus({ preventScroll: true });
      fetchBlogIndex().then(function (data) {
        if (!onScreen('article')) return;
        var art = null;
        data.articles.forEach(function (a) { if (a.slug === params.slug) art = a; });
        if (!art) {
          dialog.innerHTML = fallbackDialog('Writing',
            'That entry does not exist.',
            FF7_MANIFEST.blogFallbackUrl, 'Read the blog');
          wireDialogActions(dialog, function (c) { articleCursor = c; });
          return;
        }
        dialog.setAttribute('aria-label', art.title);
        FF7.setDefaultHint(art.title);
        dialog.innerHTML =
          '<header class="ahead">' +
            '<h2 class="atitle">' + esc(art.title) + '</h2>' +
            '<span class="adate">' + fmtDate(art.date) + '</span>' +
          '</header>' +
          '<div class="article-body">' + art.content + '</div>' +
          '<ul class="dialog-actions afoot">' +
            '<li><a href="#/writing" data-back data-hint="Return to the list of entries."><span class="hand">👉</span>Back</a></li>' +
            '<li><a href="' + esc(art.url) + '" data-hint="Open this entry on the regular blog."><span class="hand">👉</span>Open in blog</a></li>' +
          '</ul>';
        wireDialogActions(dialog, function (c) { articleCursor = c; });
      }).catch(function () {
        if (!onScreen('article')) return;
        dialog.innerHTML = fallbackDialog('Writing',
          'The archive could not be loaded.',
          FF7_MANIFEST.blogFallbackUrl, 'Read the blog');
        wireDialogActions(dialog, function (c) { articleCursor = c; });
      });
    }
  };

  /* ---------- about screen (#/about) — the game's Equip layout ---------- */
  var aboutCursor = null;
  var aboutScreen = {
    name: 'about',
    path: 'about',
    parent: 'main',
    hint: 'Jesse — software developer, former lawyer.',
    cursor: function () { return aboutCursor; },
    render: function (mount) {
      var about = FF7_MANIFEST.about;
      var m = party[0];
      mount.innerHTML =
        '<div class="dialog window equip" role="dialog" aria-label="About" tabindex="-1">' +
          '<div class="equip-top">' +
            '<div class="member" data-hint="' + esc(m.hint) + '">' + memberStatsHTML(m) + '</div>' +
            '<ul class="equip-slots">' +
              about.equipment.map(function (eq) {
                return '<li><a href="#" data-noop data-hint="' + esc(eq.desc) + '">' +
                  '<span class="hand">👉</span>' +
                  '<span class="eslot">' + esc(eq.slot) + '</span>' +
                  '<span class="ename">' + esc(eq.name) + '</span></a></li>';
              }).join('') +
            '</ul>' +
          '</div>' +
          '<div class="equip-bio">' +
            about.bio.map(function (line) { return '<p>' + esc(line) + '</p>'; }).join('') +
          '</div>' +
          '<h3 class="msec">Materia</h3>' +
          '<ul class="materia">' +
            about.materia.map(function (mat) {
              return '<li><a href="' + esc(mat.href) + '" data-hint="' + esc(mat.hint) + '">' +
                '<span class="hand">👉</span>' +
                '<span class="orb orb-' + esc(mat.color) + '"></span>' + esc(mat.name) + '</a></li>';
            }).join('') +
          '</ul>' +
          '<ul class="dialog-actions">' +
            '<li><a href="' + esc(about.fallbackUrl) + '" data-hint="Leave the menu and read the about page directly."><span class="hand">👉</span>About Jesse (plain version)</a></li>' +
            '<li><a href="#/" data-back data-hint="Return to the menu."><span class="hand">👉</span>Back</a></li>' +
          '</ul>' +
        '</div>';

      var dialog = mount.querySelector('.dialog');
      dialog.focus({ preventScroll: true });
      var items = Array.prototype.slice.call(
        dialog.querySelectorAll('.equip-slots li, .materia li, .dialog-actions li'));
      aboutCursor = FF7.cursorList(items, function (li) { li.querySelector('a').click(); });
      dialog.querySelectorAll('[data-noop]').forEach(function (a) {
        a.addEventListener('click', function (e) { e.preventDefault(); FF7.sounds.blip(); });
      });
      dialog.querySelectorAll('.materia a[href^="#/"]').forEach(function (a) {
        a.addEventListener('click', function () { FF7.sounds.confirm(); });
      });
      dialog.querySelector('[data-back]').addEventListener('click', function (e) {
        e.preventDefault();
        FF7.router.back();
      });
    }
  };

  FF7.router.register(mainScreen);
  FF7.router.register(writingScreen);
  FF7.router.register(articleScreen);
  FF7.router.register(aboutScreen);

  /* ---------- boot ---------- */
  FF7.power.initButton();
  applySettings();
  FF7.clock.init();
  FF7.router.start(document.getElementById('app'));
})();
