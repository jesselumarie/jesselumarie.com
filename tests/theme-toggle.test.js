const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const repoRoot = path.resolve(__dirname, '..');
const landingPage = fs.readFileSync(path.join(repoRoot, 'landing_page/index.html'), 'utf8');
const aboutPage = fs.readFileSync(path.join(repoRoot, 'landing_page/about/index.html'), 'utf8');
const navigationSource = fs.readFileSync(path.join(repoRoot, 'landing_page/nav.js'), 'utf8');
const styles = fs.readFileSync(path.join(repoRoot, 'landing_page/style.css'), 'utf8');
const themeSource = fs.readFileSync(path.join(repoRoot, 'landing_page/theme-toggle.js'), 'utf8');
const themeToggle = require('../landing_page/theme-toggle.js');

test('resolves a saved theme before the system preference', () => {
  assert.equal(themeToggle.resolveTheme('light', true), 'light');
  assert.equal(themeToggle.resolveTheme('dark', false), 'dark');
  assert.equal(themeToggle.resolveTheme(null, true), 'dark');
  assert.equal(themeToggle.resolveTheme('invalid', false), 'light');
});

test('a deliberate pull crosses the threshold in any direction', () => {
  assert.equal(themeToggle.shouldToggleFromPull(27, 0), true);
  assert.equal(themeToggle.shouldToggleFromPull(-27, 0), true);
  assert.equal(themeToggle.shouldToggleFromPull(0, -27), true);
  assert.equal(themeToggle.shouldToggleFromPull(20, 20), true);
  assert.equal(themeToggle.shouldToggleFromPull(15, 15), false);
});

test('landing page includes an accessible WebGL lamp-chain control', () => {
  assert.match(landingPage, /class="lamp-pull"/);
  assert.match(landingPage, /<canvas[^>]+aria-hidden="true"/);
  assert.match(landingPage, /theme-toggle\.js/);
  assert.match(styles, /\.lamp-pull/);
  assert.match(styles, /html\[data-theme="dark"\]/);
});

test('chain has a wide render target and a load-in drop sequence', () => {
  assert.match(landingPage, /<canvas[^>]+width="160" height="140"/);
  assert.match(themeSource, /function dropIn\(/);
  assert.match(themeSource, /motionQuery\.matches/);
});

test('theme toggles synthesize a lazy Web Audio switch click', () => {
  assert.match(themeSource, /function playSwitchClick\(/);
  assert.match(themeSource, /AudioContext/);
  assert.match(themeSource, /createOscillator\(\)/);
});

test('lamp survives direct and cross-shell navigation', () => {
  assert.match(aboutPage, /class="lamp-pull"/);
  assert.match(aboutPage, /theme-toggle\.js/);
  assert.match(navigationSource, /replaceChildren\(lamp, incoming\)/);
});
