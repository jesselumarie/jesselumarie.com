/* Router that keeps navigation to / and /about/ from flashing.

   Same shell (/ <-> /about/): both pages share style.css and the header/
   footer bands, so fetch the destination and swap #page in place. The shell
   never repaints; back/forward keep working via popstate.

   Cross shell (blog -> / or /about/): the blog is a different shell with its
   own theme CSS, so a real navigation blasts the landing page's white canvas
   over the dark blog page while its CSS loads. Instead: fetch the landing
   HTML, load style.css invisibly (media="print"), then in a single frame drop
   the theme CSS, activate style.css, and replace the body. The blog page
   stays fully visible until that frame — no blank canvas, ever.

   Any other link (to /blog/, /ffvii/, external) stays a normal navigation,
   and any failure falls back to one. */
(function () {
  if (window.__jlNav) return;
  window.__jlNav = true;

  var LANDING = { '/': true, '/about/': true };
  var LANDING_CSS = '/style.css';
  var crossed = false; // this document began as a blog page and swapped over

  function landingShell() { return !!document.getElementById('page'); }

  function fetchPage(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.text();
    }).then(function (html) {
      return new DOMParser().parseFromString(html, 'text/html');
    });
  }

  function sameShellSwap(doc, url, push) {
    var incoming = doc.getElementById('page');
    var current = document.getElementById('page');
    if (!incoming || !current) { location.href = url; return; }
    document.title = doc.title;
    current.replaceWith(incoming);
    if (push) history.pushState({}, '', url);
    scrollTo(0, 0);
  }

  /* Load scripts the landing pages have that this (ex-blog) document doesn't
     (moogle.js, jesse.js). Both init immediately when loaded after
     DOMContentLoaded. Already-loaded ones (jquery, bootstrap, nav.js itself)
     are skipped by URL. */
  function loadNewScripts(doc) {
    var have = {};
    document.querySelectorAll('script[src]').forEach(function (s) { have[s.src] = true; });
    doc.querySelectorAll('script[src]').forEach(function (s) {
      // resolve raw src attributes against the site root: the parsed doc
      // can't resolve its own relative URLs correctly from here
      var src = new URL(s.getAttribute('src'), location.origin + '/').href;
      if (have[src]) return;
      have[src] = true;
      var el = document.createElement('script');
      el.src = src;
      document.head.appendChild(el);
    });
  }

  function crossShellSwap(doc, url, push, cssLink) {
    var incoming = doc.getElementById('page');
    if (!incoming) { location.href = url; return; }
    // one frame: theme CSS out, landing CSS live, landing body in.
    // style.css comes after the blog's inline canvas style in the head,
    // so it also wins the html/body background back to the landing colors.
    document.querySelectorAll('link[href*="/theme/css/"]').forEach(function (l) { l.remove(); });
    cssLink.media = 'all';
    document.title = doc.title;
    document.body.removeAttribute('id');
    document.body.removeAttribute('class');
    document.body.replaceChildren(incoming);
    loadNewScripts(doc);
    crossed = true;
    if (push) history.pushState({}, '', url);
    scrollTo(0, 0);
  }

  function go(url, push) {
    if (landingShell()) {
      fetchPage(url)
        .then(function (doc) { sameShellSwap(doc, url, push); })
        .catch(function () { location.href = url; });
      return;
    }
    // blog shell: fetch the page and style.css together; media="print" loads
    // the CSS without restyling the still-visible blog page
    var css = document.createElement('link');
    css.rel = 'stylesheet';
    css.media = 'print';
    css.href = LANDING_CSS;
    var cssReady = new Promise(function (resolve, reject) {
      css.onload = resolve;
      css.onerror = reject;
    });
    document.head.appendChild(css);
    Promise.all([fetchPage(url), cssReady])
      .then(function (results) { crossShellSwap(results[0], url, push, css); })
      .catch(function () { location.href = url; });
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 ||
        e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest('a');
    if (!a || a.origin !== location.origin || !LANDING[a.pathname] || a.target) return;
    e.preventDefault();
    if (a.pathname === location.pathname) return;
    go(a.pathname, true);
  });

  addEventListener('popstate', function () {
    if (LANDING[location.pathname]) { go(location.pathname, false); return; }
    // back/forward to the blog entry from a cross-swapped document: the blog
    // shell is gone from this DOM, so really reload it (dark to dark, no flash)
    if (crossed) location.reload();
  });
})();
