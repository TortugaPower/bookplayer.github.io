/* BookPlayer landing: platform menu and the "Now playing" chapter bar. */
(function () {
  'use strict';

  // Desktop download. Empty until the first desktop release; set it to
  // 'https://download.bookplayer.app/desktop' to turn the "Coming soon" button
  // and the phone hero's "Mac, Windows and Linux" into links.
  var DESKTOP_URL = '';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var narrow = window.matchMedia('(max-width: 699.98px)');

  /* ---------- Desktop download ---------- */
  if (DESKTOP_URL) {
    var main = document.getElementById('desktop-download');
    var link = document.createElement('a');
    link.className = main.className;
    link.id = main.id;
    link.href = DESKTOP_URL;
    main.querySelector('.soon').remove();
    while (main.firstChild) link.appendChild(main.firstChild);
    main.replaceWith(link);

    var soon = document.getElementById('desktop-soon');
    var soonLink = document.createElement('a');
    soonLink.className = 'hero-link';
    soonLink.href = DESKTOP_URL;
    soonLink.textContent = 'Mac, Windows and Linux';
    soon.replaceWith(soonLink);
  }

  /* ---------- Platform menu: the computer you're on first ---------- */
  var split = document.querySelector('[data-platforms]');
  var toggle = split.querySelector('.split-toggle');
  var menu = split.querySelector('.platforms');
  var label = split.querySelector('[data-platform-label]');
  var picks = menu.querySelectorAll('[data-platform]');

  function detectPlatform() {
    var ua = navigator.userAgent || '';
    if (/Windows/i.test(ua)) return 'windows';
    if (/Linux/i.test(ua) && !/Android/i.test(ua)) return 'linux';
    return 'mac';
  }

  function setPlatform(id) {
    picks.forEach(function (b) {
      var on = b.getAttribute('data-platform') === id;
      if (on) { b.setAttribute('aria-current', 'true'); label.textContent = b.firstElementChild.textContent; }
      else b.removeAttribute('aria-current');
    });
  }

  function setMenu(open) {
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  }

  setPlatform(detectPlatform());
  toggle.addEventListener('click', function () { setMenu(menu.hidden); });
  picks.forEach(function (b) {
    b.addEventListener('click', function () {
      setPlatform(b.getAttribute('data-platform'));
      setMenu(false);
      toggle.focus();
    });
  });
  document.addEventListener('click', function (e) {
    if (!menu.hidden && !split.contains(e.target)) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus(); }
  });
  // Tabbing out closes the menu, so it doesn't cover the links after it. Clicks outside are handled above.
  split.addEventListener('focusout', function (e) {
    if (!menu.hidden && e.relatedTarget && !split.contains(e.relatedTarget)) setMenu(false);
  });

  /* ---------- Now playing ---------- */
  var ids = ['features', 'collection', 'community', 'support'];
  var titles = ['A wonderful player for your audiobooks', 'Your listening experience', 'Manage your collection', 'Community', 'Support'];
  var sections = ids.map(function (id) { return document.getElementById(id); });
  var bar = document.querySelector('.np');
  var num = bar.querySelector('.np-num');
  var name = bar.querySelector('.np-name');
  var pct = bar.querySelector('.np-pct');
  var fill = bar.querySelector('.np-fill');
  var track = bar.querySelector('.np-track');
  var marks = ids.map(function () {
    var m = document.createElement('span');
    m.className = 'np-mark';
    m.setAttribute('aria-hidden', 'true');
    track.appendChild(m);
    return m;
  });
  var chapter = -1;
  var frame = 0;

  /** Where each chapter starts, from the top of the page. */
  function starts() {
    var y = window.pageYOffset;
    return sections.map(function (s) { return s.getBoundingClientRect().top + y; });
  }

  function render() {
    frame = 0;
    var y = window.pageYOffset;
    var h = window.innerHeight;
    var max = root.scrollHeight - h;
    var progress = max > 0 ? Math.min(Math.max(y / max, 0), 1) : 0;
    var tops = starts();
    // A chapter starts once its top passes the middle of the window.
    var current = 0;
    tops.forEach(function (top, i) { if (top - h / 2 <= y) current = i + 1; });

    fill.style.width = (progress * 100).toFixed(2) + '%';
    pct.textContent = Math.round(progress * 100) + '%';
    // Each mark sits where its chapter starts (top at mid-window), so the fill reaches it as the label changes.
    marks.forEach(function (m, i) {
      var at = max > 0 ? Math.min(Math.max((tops[i] - h / 2) / max, 0), 1) : 0;
      m.style.left = (at * 100).toFixed(2) + '%';
    });
    var text = current === 0 ? 'Prologue' : (narrow.matches ? 'Ch. ' : 'Chapter ') + current;
    if (current !== chapter || num.textContent !== text) {
      chapter = current;
      num.textContent = text;
      name.textContent = titles[current];
      bar.classList.toggle('is-on', current >= 1);
    }
  }

  function schedule() { if (!frame) frame = requestAnimationFrame(render); }

  function go(step) {
    var target = Math.max(0, Math.min(ids.length, Math.max(chapter, 0) + step));
    var top = [0].concat(starts())[target];
    // Next on the last chapter goes to the end of the page, not back up to where that chapter starts.
    if (step > 0 && target === chapter) top = root.scrollHeight - window.innerHeight;
    window.scrollTo({ top: top, behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  }

  // Browsers only scroll a focused link into view when it's off-screen, so one that lands
  // behind the fixed bar while tabbing stays hidden. Scroll until it clears the bar; the
  // timeout lets the browser's own focus scroll start first, so this one wins.
  document.addEventListener('focusin', function (e) {
    if (!bar.classList.contains('is-on') || bar.contains(e.target)) return;
    var need = e.target.getBoundingClientRect().bottom + window.pageYOffset - bar.getBoundingClientRect().top + 16;
    setTimeout(function () { if (window.pageYOffset < need) window.scrollTo({ top: need }); }, 0);
  });

  bar.querySelector('.np-prev').addEventListener('click', function () { go(-1); });
  bar.querySelector('.np-next').addEventListener('click', function () { go(1); });
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('load', schedule);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  render();
})();
