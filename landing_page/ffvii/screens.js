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

  function renderParty() {
    var html = '';
    party.forEach(function (m) {
      {
        var birthday = isBirthday();
        html +=
          '<div class="member" data-hint="' + m.hint + '">' +
            '<img class="portrait" src="' + m.img + '" alt="Portrait of ' + m.name + '">' +
            '<div class="stats">' +
              '<p class="mname">' + m.name + '</p>' +
              '<div class="srow"><span class="lab">LV</span><span class="val">' + m.lv + '</span></div>' +
              '<div class="srow"><span class="lab">HP</span><span class="val">' + fmtPair(m.hp) + '</span><span class="thinbar"><span style="width:100%"></span></span></div>' +
              '<div class="srow"><span class="lab">MP</span><span class="val">' + fmtPair(m.mp) + '</span><span class="thinbar"><span style="width:100%"></span></span></div>' +
            '</div>' +
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
    document.getElementById('party').innerHTML = html;
  }

  function refreshDefaultHint() {
    if (isBirthday()) FF7.setDefaultHint('Happy birthday, Jesse! Limit break ready.');
    else FF7.setDefaultHint('Welcome to jesselumarie.com');
  }

  function applySettings() {
    FF7.applyShellSettings();
    refreshDefaultHint();
    renderParty();
    FF7.writeSave();
  }

  /* ---------- main menu ---------- */
  var menuItems = Array.prototype.slice.call(document.querySelectorAll('#menu li:not(.spacer)'));
  var menuCursor = FF7.cursorList(menuItems, function (li) { li.querySelector('a').click(); });

  document.querySelectorAll('#menu a').forEach(function (a) {
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

  /* ---------- keyboard ---------- */
  document.addEventListener('keydown', function (e) {
    var open = FF7.config.isOpen();
    var cursor = open ? FF7.config.cursor() : menuCursor;
    if (e.key === 'ArrowDown') { e.preventDefault(); cursor.move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); cursor.move(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); cursor.activate(); }
    else if (e.key === 'Escape' && open) { FF7.config.close(); }
  });

  /* ---------- boot ---------- */
  FF7.power.initButton();
  applySettings();
  FF7.initClock();
})();
