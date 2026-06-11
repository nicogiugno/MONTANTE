/* ============================================================
   MONTANTE — main.js
   Nav · menú móvil · reveals (IO) · contadores · FAQ · Modal VN
   Sin librerías. ENHANCE WITH GSAP donde se indica.
   ============================================================ */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- NAV: compactar al scrollear (sin listener de scroll) ---------- */
  var nav = document.getElementById('nav');
  if (nav) {
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;height:1px;width:1px;pointer-events:none;';
    document.body.prepend(sentinel);
    new IntersectionObserver(function (entries) {
      nav.classList.toggle('is-compact', !entries[0].isIntersecting);
    }, { rootMargin: '120px 0px 0px 0px' }).observe(sentinel);
  }

  /* ---------- MENÚ MÓVIL ---------- */
  var burger = document.querySelector('.nav__burger');
  var overlay = document.getElementById('menu-overlay');

  function closeMenu() {
    if (!overlay || !burger) return;
    overlay.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Abrir menú');
    document.body.classList.remove('is-locked');
  }

  if (burger && overlay) {
    burger.addEventListener('click', function () {
      var open = overlay.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      document.body.classList.toggle('is-locked', open);
    });
    overlay.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });
  }

  /* ---------- REVEALS (IntersectionObserver, una sola vez) ---------- */
  /* ENHANCE WITH GSAP: reemplazar por timelines con ScrollTrigger (hero, proceso) */
  document.querySelectorAll('[data-io-group]').forEach(function (group) {
    var items = group.querySelectorAll('.io');
    items.forEach(function (el, i) { el.style.setProperty('--io-i', i); });
  });

  var ioEls = document.querySelectorAll('.io');
  if (REDUCED || !('IntersectionObserver' in window)) {
    ioEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revealIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    ioEls.forEach(function (el) { revealIO.observe(el); });
  }

  /* ---------- CONTADORES ---------- */
  function formatNum(value, sep) {
    var s = String(value);
    if (sep) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
    return s;
  }

  function renderCounter(el, value) {
    var prefix = el.dataset.prefix || '';
    var suffix = el.dataset.suffix || '';
    el.textContent = prefix + formatNum(value, el.dataset.sep || '') + suffix;
  }

  function animateCounter(el) {
    var target = parseInt(el.dataset.target, 10) || 0;
    if (REDUCED || target === 0) { renderCounter(el, target); return; }
    var duration = 1200;
    var start = null;
    function tick(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3); /* easeOutCubic */
      renderCounter(el, Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  var counters = document.querySelectorAll('[data-counter]');
  if (REDUCED || !('IntersectionObserver' in window)) {
    counters.forEach(function (el) { renderCounter(el, parseInt(el.dataset.target, 10) || 0); });
  } else {
    var counterIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { counterIO.observe(el); });
  }

  /* ---------- FAQ (acordeón, uno abierto por vez) ---------- */
  var faqItems = document.querySelectorAll('.faq__item');
  faqItems.forEach(function (item) {
    var btn = item.querySelector('.faq__q');
    var sign = item.querySelector('.faq__sign');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('is-open');
      faqItems.forEach(function (other) {
        other.classList.remove('is-open');
        var b = other.querySelector('.faq__q');
        var s = other.querySelector('.faq__sign');
        if (b) b.setAttribute('aria-expanded', 'false');
        if (s) s.textContent = '+';
      });
      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        if (sign) sign.textContent = '−';
      }
    });
  });

  /* ---------- MODAL VISUAL NOVA ---------- */
  var modal = document.getElementById('modal-vn');
  var lastFocus = null;

  function focusables() {
    return modal.querySelectorAll('a[href], button:not([disabled])');
  }

  function openModal(trigger) {
    if (!modal) return;
    lastFocus = trigger || document.activeElement;
    closeMenu();
    modal.hidden = false;
    modal.classList.add('is-open');
    /* doble rAF para que la transición de entrada corra */
    if (REDUCED) {
      modal.classList.add('is-visible');
    } else {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { modal.classList.add('is-visible'); });
      });
    }
    document.body.classList.add('is-locked');
    var f = focusables();
    if (f.length) f[0].focus();
    document.addEventListener('keydown', onModalKeydown);
  }

  function closeModal() {
    if (!modal || modal.hidden) return;
    modal.classList.remove('is-visible');
    document.removeEventListener('keydown', onModalKeydown);
    var finish = function () {
      modal.classList.remove('is-open');
      modal.hidden = true;
      document.body.classList.remove('is-locked');
      if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
    };
    if (REDUCED) { finish(); } else { setTimeout(finish, 250); }
  }

  function onModalKeydown(e) {
    if (e.key === 'Escape') { closeModal(); return; }
    if (e.key !== 'Tab') return;
    /* focus-trap */
    var f = focusables();
    if (!f.length) return;
    var first = f[0];
    var last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  /* Delegación: cualquier [data-contact] dispara el modal */
  document.addEventListener('click', function (e) {
    var contactEl = e.target.closest('[data-contact]');
    if (contactEl) {
      e.preventDefault();
      openModal(contactEl);
      return;
    }
    var closeEl = e.target.closest('[data-modal-close]');
    if (closeEl) closeModal();
  });

  /* Formulario: validación HTML5 normal, luego modal en vez de envío */
  var form = document.getElementById('form-contacto');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      openModal(form.querySelector('[type="submit"]'));
    });
  }
})();
