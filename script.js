/* ============================================================
   SERDAR NAKLİYAT AĞIR RAMPALI — arayüz
   ============================================================ */
(function () {
  'use strict';

  var d = document;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Mobil menü ---- */
  var toggle = $('#navToggle');
  var nav = $('#nav');
  if (toggle && nav) {
    var backdrop = d.createElement('div');
    backdrop.className = 'nav-backdrop';
    d.body.appendChild(backdrop);

    var setNav = function (open) {
      nav.classList.toggle('open', open);
      backdrop.classList.toggle('show', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      d.body.style.overflow = open ? 'hidden' : '';
    };
    toggle.addEventListener('click', function () { setNav(!nav.classList.contains('open')); });
    backdrop.addEventListener('click', function () { setNav(false); });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 900) setNav(false); });
  }

  /* ---- Scroll: header gölgesi + ilerleme çubuğu ---- */
  var progress = $('#scrollProgress');
  var scrollTicking = false;
  var updateScrollUI = function () {
    var y = window.scrollY || d.documentElement.scrollTop;
    d.body.classList.toggle('is-scrolled', y > 8);
    if (progress) {
      var max = d.documentElement.scrollHeight - d.documentElement.clientHeight;
      var pct = max > 0 ? Math.min(100, (y / max) * 100) : 0;
      progress.style.width = pct + '%';
    }
    scrollTicking = false;
  };
  window.addEventListener('scroll', function () {
    if (!scrollTicking) { requestAnimationFrame(updateScrollUI); scrollTicking = true; }
  }, { passive: true });
  updateScrollUI();

  /* ---- "#top" bağlantıları en üste ---- */
  $$('a[href="#top"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  });

  /* ---- Aktif menü bağlantısı ---- */
  var navLinks = nav ? $$('a[href^="#"]', nav) : [];
  var sections = navLinks
    .map(function (a) { return d.querySelector(a.getAttribute('href')); })
    .filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var hash = '#' + en.target.id;
        navLinks.forEach(function (l) { l.classList.toggle('active', l.getAttribute('href') === hash); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---- Görünüme girince ortaya çıkış ---- */
  var reveals = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduce) {
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); ro.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { ro.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- Sayaç animasyonu ---- */
  var counters = $$('[data-count]');
  if ('IntersectionObserver' in window && !reduce && counters.length) {
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        co.unobserve(el);
        var target = parseInt(el.getAttribute('data-count'), 10) || 0;
        var suffix = el.getAttribute('data-suffix') || '';
        var start = null;
        var dur = 1400;
        var step = function (t) {
          if (!start) start = t;
          var p = Math.min((t - start) / dur, 1);
          el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target) + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { co.observe(c); });
  } else {
    counters.forEach(function (c) {
      c.textContent = (c.getAttribute('data-count') || '0') + (c.getAttribute('data-suffix') || '');
    });
  }

  /* ---- Galeri lightbox ---- */
  var items = $$('.gallery-item');
  var lb = $('#lightbox');
  if (items.length && lb) {
    var lbImg = $('#lbImg');
    var lbCap = $('#lbCap');
    var lbClose = $('#lbClose');
    var lbPrev = $('#lbPrev');
    var lbNext = $('#lbNext');
    var slides = items.map(function (it) {
      var img = it.querySelector('img');
      var cap = it.querySelector('.gallery-cap');
      return {
        src: img.getAttribute('src'),
        alt: img.getAttribute('alt') || '',
        cap: cap ? cap.textContent : ''
      };
    });
    var idx = 0;
    var lastFocus = null;

    var render = function (i) {
      var s = slides[i];
      lbImg.src = s.src;
      lbImg.alt = s.alt;
      lbCap.textContent = s.cap;
    };
    var open = function (i) {
      idx = i;
      lastFocus = d.activeElement;
      render(i);
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
      d.body.style.overflow = 'hidden';
      lbClose.focus();
    };
    var close = function () {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
      d.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    };
    var go = function (n) {
      idx = (idx + n + slides.length) % slides.length;
      render(idx);
    };

    items.forEach(function (it, i) { it.addEventListener('click', function () { open(i); }); });
    lbClose.addEventListener('click', close);
    lbPrev.addEventListener('click', function () { go(-1); });
    lbNext.addEventListener('click', function () { go(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    d.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'Tab') {
        var f = [lbClose, lbPrev, lbNext];
        var first = f[0];
        var last = f[f.length - 1];
        if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }
})();
