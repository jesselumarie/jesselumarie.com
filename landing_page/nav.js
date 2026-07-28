/* Same-shell router for / and /about/: both pages share style.css and the
   header/footer bands, so instead of a real navigation (whose blank first
   frame Chrome sometimes flashes), fetch the destination and swap #page in
   place. The shell never repaints; back/forward keep working via popstate.
   Any other link (blog, ffvii, external) stays a normal navigation. */
(function () {
  var ROUTES = { '/': true, '/about/': true };

  function swap(doc, url, push) {
    var incoming = doc.getElementById('page');
    var current = document.getElementById('page');
    if (!incoming || !current) { location.href = url; return; }
    document.title = doc.title;
    current.replaceWith(incoming);
    if (push) history.pushState({}, '', url);
    scrollTo(0, 0);
  }

  function go(url, push) {
    fetch(url)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(function (html) {
        swap(new DOMParser().parseFromString(html, 'text/html'), url, push);
      })
      .catch(function () { location.href = url; });
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 ||
        e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest('a');
    if (!a || a.origin !== location.origin || !ROUTES[a.pathname] || a.target) return;
    e.preventDefault();
    if (a.pathname === location.pathname) return;
    go(a.pathname, true);
  });

  addEventListener('popstate', function () {
    if (ROUTES[location.pathname]) go(location.pathname, false);
  });
})();
