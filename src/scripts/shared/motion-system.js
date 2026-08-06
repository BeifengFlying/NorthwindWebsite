/* Global reveal orchestration for pages that do not already own an animation. */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var compactViewport = window.matchMedia('(max-width: 768px)').matches;
  var selector = [
    '.solutions-hero > *', '.workflow-hero .hero-copy', '.workflow-hero .card-swap-stage',
    '.journey-hero > :not(.hero-grid-mark)', '.lab-hero > *',
    '.photo-hero-media', '.photo-hero-top', '.photo-hero-inner', '.photo-hero-side', '.photo-hero-scroll',
    '.solutions-toolbar', '.platform-list', '.overview-card', '.menu-section',
    '.loop-card', '.phase-card', '.algorithm-flow', '.streams-grid', '.assistant-box',
    '.archive-map', '.future-list', '.hardware-card', '.format-row', '.timeline-era',
    '.photo-card', '.solution-card'
  ].join(',');

  function addReveal(element, kind, delay) {
    if (!element || element.hasAttribute('data-motion-reveal') || element.classList.contains('reveal') || element.classList.contains('reveal-on-scroll')) return;
    element.setAttribute('data-motion-reveal', kind || 'content');
    if (delay) element.style.setProperty('--motion-delay', delay + 'ms');
  }

  function setupHomeFallback() {
    // The homepage's primary sequence normally comes from GSAP. Retain the
    // same hierarchy when a CDN script is unavailable instead of leaving the
    // homepage visually static.
    if (reducedMotion || window.__northwindGsapMotionReady || document.body.classList.contains('home-section-motion') || !document.querySelector('.hero')) return;
    var elements = [];
    Array.prototype.forEach.call(document.querySelectorAll('.hero-title-line'), function (element, index) {
      elements.push({ element: element, kind: 'heading', delay: index * 140 });
    });
    Array.prototype.forEach.call(document.querySelectorAll('.hero-subtitle, .hero-scroll-hint'), function (element, index) {
      elements.push({ element: element, kind: 'content', delay: 360 + index * 180 });
    });
    if (!document.body.classList.contains('home-section-motion')) {
      Array.prototype.forEach.call(document.querySelectorAll('.reveal, .reveal-stagger, .creative-title, .creative-subtitle, .cta-title, .cta-subtitle, .cta-buttons'), function (element, index) {
        elements.push({ element: element, kind: 'content', delay: Math.min(100 + index * 70, 420) });
      });
    }
    elements.forEach(function (item) {
      if (item.element.hasAttribute('data-motion-reveal')) return;
      item.element.setAttribute('data-motion-reveal', item.kind);
      item.element.style.setProperty('--motion-delay', item.delay + 'ms');
    });
  }

  function setupHomeSectionMotion() {
    if (!document.body.classList.contains('home-section-motion')) return;

    var groups = [
      { selector: '.hero-title-line, .hero-subtitle, .hero-scroll-hint', heading: '.hero-title-line' },
      { selector: '#about .sec-label, #about .about-title, #about .about-identity, #about .about-module', heading: '.about-title' },
      { selector: '#path .sec-label, #path .path-title, #path .path-bilingual-row, #path .path-route-note', heading: '.path-title' },
      { selector: '#music .sec-label, #music .music-heading, #music .music-group-toggle, #music .music-cover-col, #music .music-links-col, #music .music-wheel-col', heading: '.music-heading', image: '.music-cover-col' },
      { selector: '#explore .sec-label, #explore .explore-title, #explore .explore-card', heading: '.explore-title' },
      { selector: '#projects .sec-label, #projects .projects-title', heading: '.projects-title' },
      { selector: '#creative .sec-label, #creative .creative-title, #creative .creative-subtitle-line, #creative .creative-desc p, #creative .creative-tags', heading: '.creative-title' },
      { selector: '#now .sec-label, #now .now-title, #now .now-item', heading: '.now-title' },
      { selector: '#contact .cta-title, #contact .cta-subtitle, #contact .cta-buttons, #contact .contact-info', heading: '.cta-title' }
    ];
    var items = [];

    groups.forEach(function (group) {
      Array.prototype.forEach.call(document.querySelectorAll(group.selector), function (element, index) {
        element.classList.add('home-motion-item');
        element.setAttribute('data-home-motion', element.matches(group.heading || ':not(*)') ? 'heading' : element.matches(group.image || ':not(*)') ? 'image' : 'content');
        var delayStep = compactViewport ? 45 : 85;
        var maxDelay = compactViewport ? 135 : 425;
        element.style.setProperty('--home-motion-delay', Math.min(index * delayStep, maxDelay) + 'ms');
        items.push(element);
      });
    });

    if (reducedMotion) {
      items.forEach(function (element) { element.classList.add('is-home-motion-visible'); });
      return;
    }

    // Use separate entry and exit boundaries. Observing the animated element
    // itself can oscillate in Safari: hiding moves it down, which makes it
    // intersect again, then showing moves it back out.
    var frame = 0;
    function updateVisibility() {
      frame = 0;
      var viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      var entryTop = viewportHeight * .06;
      var entryBottom = viewportHeight * .94;
      var exitBuffer = Math.max(96, viewportHeight * .1);

      items.forEach(function (element) {
        var rect = element.getBoundingClientRect();
        var visible = element.classList.contains('is-home-motion-visible');

        if (!visible && rect.bottom > entryTop && rect.top < entryBottom) {
          element.classList.add('is-home-motion-visible');
        } else if (visible && (rect.bottom < -exitBuffer || rect.top > viewportHeight + exitBuffer)) {
          element.classList.remove('is-home-motion-visible');
        }
      });
    }

    function scheduleVisibilityUpdate() {
      if (!frame) frame = window.requestAnimationFrame(updateVisibility);
    }

    window.addEventListener('scroll', scheduleVisibilityUpdate, { passive: true });
    window.addEventListener('resize', scheduleVisibilityUpdate);
    window.addEventListener('pageshow', scheduleVisibilityUpdate);
    scheduleVisibilityUpdate();
  }

  function addGroup(scope, containerSelector, itemSelector, kind) {
    if (!scope) return;
    var containers = [];
    if (scope.matches && scope.matches(containerSelector)) containers.push(scope);
    Array.prototype.push.apply(containers, scope.querySelectorAll(containerSelector));
    containers.forEach(function (container) {
      Array.prototype.forEach.call(container.querySelectorAll(itemSelector), function (element, index) {
        addReveal(element, kind || 'content', Math.min(index * 90, 360));
      });
    });
  }

  function register(root) {
    var scope = root || document;
    // Register grouped children first so their stagger delay wins over the
    // generic selector pass below.
    addGroup(scope, '.overview-grid', '.overview-card');
    addGroup(scope, '.loop-grid', '.loop-card');
    addGroup(scope, '.phase-grid', '.phase-card');
    addGroup(scope, '.solution-grid', '.solution-card');
    addGroup(scope, '.models-grid', '.model-card');
    addGroup(scope, '.gallery', '.photo-card', 'image');
    Array.prototype.forEach.call(scope.querySelectorAll(selector), function (element) {
      var kind = element.matches('.photo-hero-media, img, .photo-card') ? 'image' : element.matches('nav, .solutions-nav, .workflow-nav, .journey-nav, .lab-nav, .error-nav') ? 'nav' : element.matches('.hero-copy, .journey-hero > h1, .photo-hero-inner') ? 'heading' : 'content';
      addReveal(element, kind);
    });
  }

  function animateCount(element) {
    if (element.dataset.motionCounted || !/^\s*\d+(?:\.\d+)?\s*(?:%|\+|GB|B|K)?\s*$/i.test(element.textContent)) return;
    var match = element.textContent.match(/(\d+(?:\.\d+)?)(.*)/);
    if (!match) return;
    var target = Number(match[1]);
    if (!Number.isFinite(target) || target > 100000) return;
    element.dataset.motionCounted = 'true';
    var suffix = match[2];
    var start = performance.now();
    var duration = Math.min(1300, Math.max(800, target * 18));
    function tick(now) {
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = target % 1 ? (target * eased).toFixed(1) : String(Math.round(target * eased));
      element.textContent = value + suffix;
      if (progress < 1) window.requestAnimationFrame(tick);
    }
    window.requestAnimationFrame(tick);
  }

  function boot() {
    setupHomeFallback();
    setupHomeSectionMotion();
    register();
    document.body.classList.add('motion-ready');
    var revealItems = Array.prototype.slice.call(document.querySelectorAll('[data-motion-reveal]'));
    if (reducedMotion || !('IntersectionObserver' in window)) {
      revealItems.forEach(function (element) { element.classList.add('is-motion-visible'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-motion-visible');
        Array.prototype.forEach.call(entry.target.querySelectorAll('.stat strong, .data-strip strong, .hardware-spec'), animateCount);
        observer.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -7% 0px' });
    revealItems.forEach(function (element) { observer.observe(element); });

    new MutationObserver(function (records) {
      records.forEach(function (record) {
        Array.prototype.forEach.call(record.addedNodes, function (node) {
          if (node.nodeType !== 1) return;
          register(node.parentElement || document);
          Array.prototype.forEach.call(document.querySelectorAll('[data-motion-reveal]:not(.is-motion-visible)'), function (element) { observer.observe(element); });
        });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
