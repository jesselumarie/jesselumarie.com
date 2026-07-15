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
    // HP fills periwinkle, MP teal — the game's stat underline bars
    return '<img class="portrait" src="' + m.img + '" alt="Portrait of ' + m.name + '">' +
      '<div class="stats">' +
        '<p class="mname">' + m.name + '</p>' +
        '<div class="srow"><span class="lab">LV</span><span class="val val-lv"><span class="pnum lvnum">' + m.lv + '</span></span></div>' +
        '<div class="srow"><span class="lab">HP</span><span class="val">' + fmtPair(m.hp) + '</span><span class="thinbar hpbar"><span style="width:100%"></span></span></div>' +
        '<div class="srow"><span class="lab">MP</span><span class="val">' + fmtPair(m.mp) + '</span><span class="thinbar mpbar"><span style="width:100%"></span></span></div>' +
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

  /* ---------- config screen (#/config) — the game's Config layout ----------
     Cyan labels on the left; toggle rows show every option with the
     active one lit, like Mono/Stereo in the game. "Window color" opens
     the corner editor: pick a corner of the preview window, then slide
     R/G/B (0-255). Every window repaints live. */

  var configItems = [
    {
      label: 'Window color', type: 'window',
      hint: 'Select colors for each corner of the window.'
    },
    {
      label: 'Sound', type: 'toggle', options: ['On', 'Off'],
      hint: 'Toggle cursor sound effects.',
      get: function () { return settings.sound ? 0 : 1; },
      set: function (i) { settings.sound = (i === 0); }
    },
    {
      label: 'CRT filter', type: 'toggle', options: ['On', 'Off'],
      hint: 'Toggle the 1997 CRT picture tube.',
      get: function () { return settings.scanlines ? 0 : 1; },
      set: function (i) { settings.scanlines = (i === 0); }
    },
    {
      label: 'Birthday mode', type: 'toggle', options: ['On', 'Off'],
      hint: 'Debug: pretend it is June 22 and charge the limit gauge.',
      get: function () { return settings.birthday ? 0 : 1; },
      set: function (i) { settings.birthday = (i === 0); }
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
      label: 'Exit',
      hint: 'Return to the menu.',
      value: function () { return ''; },
      act: function () { FF7.router.back(); }
    }
  ];

  var CORNERS = ['tl', 'tr', 'bl', 'br'];
  var CHANNELS = ['R', 'G', 'B'];

  var configCursor = null;
  var wcState = null; // null = list; else { mode:'corner'|'chan', corner, chan }

  function wcColor() { return settings.windowColor[wcState.corner]; }

  function renderWcEditor(root) {
    var ed = root.querySelector('#wcEditor');
    if (!ed) return;
    ed.hidden = !wcState;
    if (!wcState) return;
    CORNERS.forEach(function (c) {
      var b = ed.querySelector('.wc-corner.' + c);
      b.classList.toggle('selected', wcState.corner === c);
      b.classList.toggle('armed', wcState.corner === c && wcState.mode === 'corner');
    });
    var col = wcColor();
    ed.querySelector('#wcSwatch').style.background =
      'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';
    ed.querySelectorAll('.wc-sliders li').forEach(function (li, i) {
      li.classList.toggle('selected', wcState.mode === 'chan' && wcState.chan === i);
      li.querySelector('.wc-val').textContent = col[i];
      li.querySelector('.wc-fill').style.width = (col[i] / 255 * 100) + '%';
    });
  }

  function wcApply(root) {
    applySettings();
    renderWcEditor(root);
  }

  function wcSetChannel(root, ch, v) {
    wcColor()[ch] = Math.max(0, Math.min(255, v));
    wcApply(root);
  }

  function makeWcCursor(root) {
    return {
      move: function (d) {
        if (wcState.mode === 'corner') {
          // up/down flips between the top and bottom corner of a side
          wcState.corner = { tl: 'bl', bl: 'tl', tr: 'br', br: 'tr' }[wcState.corner];
        } else {
          wcState.chan = (wcState.chan + d + 3) % 3;
        }
        FF7.sounds.blip();
        renderWcEditor(root);
      },
      moveH: function (d) {
        if (wcState.mode === 'corner') {
          wcState.corner = { tl: 'tr', tr: 'tl', bl: 'br', br: 'bl' }[wcState.corner];
          FF7.sounds.blip();
          renderWcEditor(root);
        } else {
          wcSetChannel(root, wcState.chan, wcColor()[wcState.chan] + d * 4);
        }
      },
      activate: function () {
        if (wcState.mode === 'corner') {
          wcState.mode = 'chan';
          FF7.sounds.confirm();
          FF7.hint('Left/Right changes the value. Up/Down picks R, G, B.');
        } else {
          wcState.mode = 'corner';
          FF7.sounds.confirm();
          FF7.hint('Select colors for each corner of the window.');
        }
        renderWcEditor(root);
      }
    };
  }

  var wcCursor = null;

  function openWcEditor(root) {
    wcState = { mode: 'corner', corner: 'tl', chan: 0 };
    wcCursor = makeWcCursor(root);
    FF7.hint('Select colors for each corner of the window.');
    renderWcEditor(root);
  }

  function closeWcEditor(root) {
    wcState = null;
    wcCursor = null;
    FF7.sounds.cancel();
    FF7.hint(null);
    renderWcEditor(root);
  }

  function configRowHTML(it) {
    var val;
    if (it.type === 'window') {
      val = '<span class="wc-mini window-mini" aria-hidden="true"></span>';
    } else if (it.type === 'toggle') {
      val = it.options.map(function (o, i) {
        return '<span class="copt' + (it.get() === i ? ' active' : '') +
          '" data-opt="' + i + '">' + o + '</span>';
      }).join('');
    } else {
      val = '<span class="cplain">' + it.value() + '</span>';
    }
    return '<a href="#" data-hint="' + it.hint + '"><span class="hand"></span>' +
      '<span class="clabel">' + it.label + '</span>' +
      '<span class="cval">' + val + '</span></a>';
  }

  function renderConfigList(root) {
    var lis = root.querySelectorAll('#configList li');
    lis.forEach(function (li, i) { li.innerHTML = configRowHTML(configItems[i]); });
  }

  var configScreen = {
    name: 'config',
    path: 'config',
    parent: 'main',
    title: 'Config',
    hint: 'Customize the menu.',
    cursor: function () { return wcState ? wcCursor : configCursor; },
    onEscape: function () {
      var root = document.getElementById('app');
      if (wcState && wcState.mode === 'chan') {
        wcState.mode = 'corner';
        FF7.sounds.cancel();
        FF7.hint('Select colors for each corner of the window.');
        renderWcEditor(root);
        return true;
      }
      if (wcState) { closeWcEditor(root); return true; }
      return false;
    },
    render: function (mount) {
      mount.innerHTML =
        '<div class="dialog window configscr" role="dialog" aria-label="Config" tabindex="-1">' +
          '<ul class="configlist" id="configList">' +
            configItems.map(function () { return '<li></li>'; }).join('') +
          '</ul>' +
          '<div class="wc-editor window" id="wcEditor" hidden>' +
            '<div class="wc-top">' +
              '<span class="wc-preview window-mini" aria-hidden="false">' +
                CORNERS.map(function (c) {
                  return '<button class="wc-corner ' + c + '" type="button" data-corner="' + c +
                    '" aria-label="' + c + ' corner"></button>';
                }).join('') +
              '</span>' +
              '<span class="wc-swatch window-mini" id="wcSwatch"></span>' +
            '</div>' +
            '<ul class="wc-sliders">' +
              CHANNELS.map(function (ch, i) {
                return '<li data-ch="' + i + '"><span class="hand"></span>' +
                  '<b class="wc-ch wc-' + ch.toLowerCase() + '">' + ch + '</b>' +
                  '<span class="wc-val">0</span>' +
                  '<span class="wc-bar"><span class="wc-fill"></span></span></li>';
              }).join('') +
            '</ul>' +
          '</div>' +
        '</div>';

      var dialog = mount.querySelector('.dialog');
      dialog.focus({ preventScroll: true });
      renderConfigList(mount);

      var lis = Array.prototype.slice.call(mount.querySelectorAll('#configList li'));
      configCursor = FF7.cursorList(lis, function (li) {
        var i = lis.indexOf(li);
        var it = configItems[i];
        if (it.type === 'window') {
          FF7.sounds.confirm();
          openWcEditor(mount);
        } else if (it.type === 'toggle') {
          FF7.sounds.confirm();
          it.set(it.get() === 0 ? 1 : 0);
          applySettings();
          renderConfigList(mount);
        } else {
          FF7.sounds.confirm();
          it.act();
          applySettings();
          renderConfigList(mount);
        }
      });

      lis.forEach(function (li, i) {
        li.addEventListener('click', function (e) {
          e.preventDefault();
          var it = configItems[i];
          var opt = e.target.closest('.copt');
          if (opt && it.type === 'toggle') {
            FF7.sounds.confirm();
            it.set(+opt.getAttribute('data-opt'));
            applySettings();
            renderConfigList(mount);
            return;
          }
          configCursor.activate();
        });
      });

      // window color editor: mouse/touch controls
      var ed = mount.querySelector('#wcEditor');
      ed.addEventListener('click', function (e) {
        var corner = e.target.closest('.wc-corner');
        if (corner) {
          wcState.corner = corner.getAttribute('data-corner');
          wcState.mode = 'chan';
          FF7.sounds.confirm();
          renderWcEditor(mount);
        }
      });
      ed.querySelectorAll('.wc-sliders li').forEach(function (li, i) {
        var bar = li.querySelector('.wc-bar');
        function setFromPointer(e) {
          var r = bar.getBoundingClientRect();
          var v = Math.round((e.clientX - r.left) / r.width * 255);
          wcState.chan = i;
          if (wcState.mode !== 'chan') wcState.mode = 'chan';
          wcSetChannel(mount, i, v);
        }
        bar.addEventListener('pointerdown', function (e) {
          e.preventDefault();
          bar.setPointerCapture(e.pointerId);
          setFromPointer(e);
          function mv(ev) { setFromPointer(ev); }
          function up() {
            bar.removeEventListener('pointermove', mv);
            bar.removeEventListener('pointerup', up);
          }
          bar.addEventListener('pointermove', mv);
          bar.addEventListener('pointerup', up);
        });
        li.addEventListener('mouseenter', function () {
          if (wcState && wcState.mode === 'chan' && wcState.chan !== i) {
            wcState.chan = i;
            FF7.sounds.blip();
            renderWcEditor(mount);
          }
        });
      });
    },
    destroy: function () {
      wcState = null;
      wcCursor = null;
      configCursor = null;
    }
  };

  /* ---------- main screen (#/) ---------- */
  var MAIN_LAYOUT =
    '<div class="layout">' +

      '<section class="party window" aria-label="Party" id="party"></section>' +

      '<nav class="menu window" aria-label="Main menu">' +
        '<ul id="menu">' +
          '<li><a href="#/about" data-hint="Learn more about Jesse."><span class="hand"></span>About</a></li>' +
          '<li><a href="#/writing" data-hint="Read Jesse\'s writing."><span class="hand"></span>Writing</a></li>' +
          '<li><a href="https://github.com/jesselumarie" data-hint="Inspect Jesse\'s materia."><span class="hand"></span>GitHub</a></li>' +
          '<li><a href="https://www.linkedin.com/in/jesselumarie" data-hint="Employment record and battle history."><span class="hand"></span>LinkedIn</a></li>' +
          '<li><a href="https://twitter.com/jesselumarie" data-hint="Short-form dispatches."><span class="hand"></span>Twitter</a></li>' +
          '<li><a href="https://instagram.com/jesselumarie" data-hint="Field photography."><span class="hand"></span>Instagram</a></li>' +
          '<li><a href="mailto:jesse.lumarie@gmail.com" data-hint="PHS — send Jesse a message."><span class="hand"></span>PHS</a></li>' +
          '<li><a href="#/config" data-hint="Adjust windows, sound, and debug options."><span class="hand"></span>Config</a></li>' +
          '<li class="spacer" role="presentation"></li>' +
          '<li><a href="#" class="disabled" data-action="save" data-hint="You cannot save here."><span class="hand"></span>Save</a></li>' +
          '<li><a href="/" data-action="exit" data-hint="Power off and return to jesselumarie.com"><span class="hand"></span>Exit</a></li>' +
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
        '<li><a href="' + href + '" data-hint="Leave the menu and open the page directly."><span class="hand"></span>' + label + '</a></li>' +
        '<li><a href="#/" data-back data-hint="Return to the menu."><span class="hand"></span>Back</a></li>' +
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
    title: 'Writing',
    hint: 'Select an entry.',
    cursor: function () { return writingCursor; },
    render: function (mount) {
      writingCursor = null;
      mount.innerHTML =
        '<div class="dialog window submenu" role="dialog" aria-label="Writing" tabindex="-1">' +
          '<p class="loading">Loading&hellip;</p>' +
        '</div>';
      var dialog = mount.querySelector('.dialog');
      dialog.focus({ preventScroll: true });
      fetchBlogIndex().then(function (data) {
        if (!onScreen('writing')) return;
        dialog.innerHTML =
          '<ul class="postlist">' +
            data.articles.map(function (a) {
              return '<li><a href="#/writing/' + encodeURIComponent(a.slug) + '" data-hint="' + esc(a.summary) + '">' +
                '<span class="hand"></span>' +
                '<span class="ptitle">' + esc(a.title) + '</span>' +
                '<span class="pdate">' + fmtDate(a.date) + '</span></a></li>';
            }).join('') +
            '<li><a href="#/" data-back data-hint="Return to the menu."><span class="hand"></span><span class="ptitle">Back</span></a></li>' +
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
    title: 'Writing',
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
            '<li><a href="#/writing" data-back data-hint="Return to the list of entries."><span class="hand"></span>Back</a></li>' +
            '<li><a href="' + esc(art.url) + '" data-hint="Open this entry on the regular blog."><span class="hand"></span>Open in blog</a></li>' +
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

  /* ---------- about screen (#/about) — the game's Equip layout ----------
     Three stacked windows like the real Equip screen: member + slots on
     top, a one-line description window (shows the selected equipment's
     text, or the bio), then the lower window with materia and actions. */
  var aboutCursor = null;
  var aboutScreen = {
    name: 'about',
    path: 'about',
    parent: 'main',
    title: 'About',
    hint: 'Jesse — software developer, former lawyer.',
    cursor: function () { return aboutCursor; },
    render: function (mount) {
      var about = FF7_MANIFEST.about;
      var m = party[0];
      var bioLine = esc(about.bio.join(' '));
      mount.innerHTML =
        '<div class="equip-wrap" role="dialog" aria-label="About" tabindex="-1">' +
          '<div class="window equip-topwin">' +
            '<div class="member" data-hint="' + esc(m.hint) + '">' + memberStatsHTML(m) + '</div>' +
            '<ul class="equip-slots">' +
              about.equipment.map(function (eq) {
                return '<li><a href="#" data-noop data-desc="' + esc(eq.desc) + '" data-hint="' + esc(eq.desc) + '">' +
                  '<span class="hand"></span>' +
                  '<span class="eslot">' + esc(eq.slot) + '</span>' +
                  '<span class="ename">' + esc(eq.name) + '</span></a></li>';
              }).join('') +
            '</ul>' +
          '</div>' +
          '<div class="window equip-desc" id="equipDesc">' + bioLine + '</div>' +
          '<div class="window equip-main">' +
            '<h3 class="msec">Materia</h3>' +
            '<ul class="materia">' +
              about.materia.map(function (mat) {
                return '<li><a href="' + esc(mat.href) + '" data-hint="' + esc(mat.hint) + '">' +
                  '<span class="hand"></span>' +
                  '<span class="orb orb-' + esc(mat.color) + '"></span>' + esc(mat.name) + '</a></li>';
              }).join('') +
            '</ul>' +
            '<ul class="dialog-actions">' +
              '<li><a href="' + esc(about.fallbackUrl) + '" data-hint="Leave the menu and read the about page directly."><span class="hand"></span>About Jesse (plain version)</a></li>' +
              '<li><a href="#/" data-back data-hint="Return to the menu."><span class="hand"></span>Back</a></li>' +
            '</ul>' +
          '</div>' +
        '</div>';

      var wrap = mount.querySelector('.equip-wrap');
      wrap.focus({ preventScroll: true });
      var descEl = mount.querySelector('#equipDesc');
      function syncDesc(li) {
        var a = li && li.querySelector('[data-desc]');
        descEl.textContent = a ? a.getAttribute('data-desc') : about.bio.join(' ');
      }
      var items = Array.prototype.slice.call(
        wrap.querySelectorAll('.equip-slots li, .materia li, .dialog-actions li'));
      aboutCursor = FF7.cursorList(items, function (li) { li.querySelector('a').click(); });
      var baseMove = aboutCursor.move;
      aboutCursor.move = function (d) { baseMove(d); syncDesc(aboutCursor.current()); };
      items.forEach(function (li) {
        li.addEventListener('mouseenter', function () { syncDesc(li); });
      });
      wrap.querySelectorAll('[data-noop]').forEach(function (a) {
        a.addEventListener('click', function (e) { e.preventDefault(); FF7.sounds.blip(); });
      });
      wrap.querySelectorAll('.materia a[href^="#/"]').forEach(function (a) {
        a.addEventListener('click', function () { FF7.sounds.confirm(); });
      });
      wrap.querySelector('[data-back]').addEventListener('click', function (e) {
        e.preventDefault();
        FF7.router.back();
      });
    }
  };

  FF7.router.register(mainScreen);
  FF7.router.register(writingScreen);
  FF7.router.register(articleScreen);
  FF7.router.register(aboutScreen);
  FF7.router.register(configScreen);

  /* ---------- boot ---------- */
  FF7.power.initButton();
  applySettings();
  FF7.clock.init();
  FF7.router.start(document.getElementById('app'));
})();
