/* Anime.js-powered shared motion entrypoint. */
import { animate, createTimeline } from 'animejs';

(function initNorthwindMotion() {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const compactViewport = window.matchMedia('(max-width: 768px)').matches;
  const revealSelector = [
    '.solutions-hero > *', '.workflow-hero .hero-copy', '.workflow-hero .card-swap-stage',
    '.journey-hero > :not(.hero-grid-mark)', '.lab-hero > *',
    '.photo-hero-media', '.photo-hero-top', '.photo-hero-inner', '.photo-hero-side', '.photo-hero-scroll',
    '.solutions-toolbar', '.platform-list', '.overview-card', '.menu-section',
    '.loop-card', '.phase-card', '.algorithm-flow', '.streams-grid', '.assistant-box',
    '.archive-map', '.future-list', '.hardware-card', '.format-row', '.timeline-era',
    '.photo-card', '.solution-card'
  ].join(',');
  const headingSelector = 'h1, h2, .hero-title, .about-title, .path-title, .music-heading, .explore-title, .projects-title, .creative-title, .now-title, .cta-title, .explore-card-title, .now-item-title, .music-song-name, .creative-subtitle-line';
  const pageHeadingSelector = [
    '.workflow-hero h1', '.solutions-hero h1', '.journey-hero h1', '.lab-hero h1',
    '.photo-hero-title', '.error-number', '.section-heading h2', '.future-copy h2',
    '.timeline-copy h3', '.assistant-box h2', '.archive-copy h2'
  ].join(',');
  const observed = new WeakSet();
  let observer;
  let textFadeObserver;

  const isHeading = (element) => element.matches(headingSelector) || element.classList.contains('hero-title-line');
  const isImage = (element) => element.matches('img, .photo-hero-media, .photo-card, .music-cover-col, .card-swap-stage');
  const addReveal = (element, kind, delay) => {
    if (!element || element.dataset.motionRegistered === 'true') return;
    element.dataset.motionRegistered = 'true';
    element.setAttribute('data-motion-reveal', kind || (isHeading(element) ? 'heading' : isImage(element) ? 'image' : 'content'));
    if (delay) element.style.setProperty('--motion-delay', `${delay}ms`);
  };

  function addGroup(scope, containerSelector, itemSelector, kind) {
    const containers = [];
    if (scope.matches?.(containerSelector)) containers.push(scope);
    containers.push(...scope.querySelectorAll(containerSelector));
    containers.forEach((container) => container.querySelectorAll(itemSelector).forEach((element, index) => addReveal(element, kind, Math.min(index * (compactViewport ? 42 : 68), 340))));
  }

  function registerHome(scope) {
    if (!document.body.classList.contains('home-section-motion')) return;
    [
      // Keep motion on wayfinding and visual modules. Reading copy remains
      // available immediately so sections can be scanned while scrolling.
      '.hero-title-line',
      '#about .about-title, #about .about-lanyard-mount',
      '#path .path-title',
      '#music .music-heading, #music .music-cover-col',
      '#explore .explore-title, #explore .explore-card, #explore .explore-card-title',
      '#projects .projects-title',
      '#music .music-song-name',
      '#contact .cta-title'
    ].forEach((selector) => scope.querySelectorAll(selector).forEach((element, index) => addReveal(element, undefined, Math.min(index * (compactViewport ? 46 : 74), compactViewport ? 160 : 400))));

    [
      '#creative .sec-label, #creative .creative-title, #creative .creative-subtitle-line, #creative .creative-desc p, #creative .creative-tags',
      '#now .sec-label, #now .now-title, #now .now-item'
    ].forEach((selector) => scope.querySelectorAll(selector).forEach((element, index) => {
      addReveal(element, 'text-fade', Math.min(index * (compactViewport ? 50 : 80), compactViewport ? 150 : 480));
    }));
  }

  function register(scope = document) {
    const isHomepage = document.body.classList.contains('home-section-motion');
    if (!isHomepage) {
      addGroup(scope, '.overview-grid', '.overview-card');
      addGroup(scope, '.loop-grid', '.loop-card');
      addGroup(scope, '.phase-grid', '.phase-card');
      addGroup(scope, '.solution-grid', '.solution-card');
      addGroup(scope, '.models-grid', '.model-card');
      addGroup(scope, '.gallery', '.photo-card', 'image');
      scope.querySelectorAll(revealSelector).forEach((element) => addReveal(element));
      scope.querySelectorAll(pageHeadingSelector).forEach((element) => addReveal(element, 'heading'));
      scope.querySelectorAll('.reveal, [data-reveal], .reveal-on-scroll').forEach((element) => addReveal(element));
    }
    registerHome(scope);
  }

  function headingVariant(element) {
    if (element.matches('.hero-title-line')) return 'hero-stretch';
    if (element.matches('.path-title, .projects-title, .journey-hero h1, .error-number')) return 'scale-reveal';
    if (element.matches('.music-heading, .creative-title, .workflow-hero h1, .photo-hero-title')) return 'side-sweep';
    if (element.matches('.explore-title, .now-title, .solutions-hero h1, .timeline-copy h3')) return 'tracking';
    if (element.matches('.about-title, .cta-title, .lab-hero h1, .assistant-box h2')) return 'rise';
    return 'settle';
  }

  function revealHeading(timeline, element, delay) {
    const variant = headingVariant(element);
    const isHomepageHeading = document.body.classList.contains('home-section-motion');
    // Display headings are wayfinding, so they must resolve before a fast
    // scroll can carry the next section past them. Keep the softer pace for
    // secondary pages and use a short, critically-damped settle on the home.
    const duration = isHomepageHeading ? (compactViewport ? 220 : 280) : (compactViewport ? 260 : 340);
    const headingDelay = isHomepageHeading ? Math.min(delay, compactViewport ? 24 : 36) : delay;
    const common = { opacity: [0, 1], duration, delay: headingDelay, ease: 'out(5)' };

    if (variant === 'hero-stretch') {
      timeline.add(element, {
        ...common,
        y: [compactViewport ? 18 : 28, 0],
        scaleX: [1.015, 1],
        scaleY: [.96, 1],
        duration: isHomepageHeading ? (compactViewport ? 240 : 300) : (compactViewport ? 280 : 360),
        ease: 'out(4)'
      });
      return;
    }
    if (variant === 'scale-reveal') {
      timeline.add(element, { ...common, y: [compactViewport ? 14 : 22, 0], scale: [.985, 1], transformOrigin: 'left bottom' });
      return;
    }
    if (variant === 'side-sweep') {
      timeline.add(element, { ...common, x: [compactViewport ? -12 : -20, 0], scaleX: [.99, 1], transformOrigin: 'left center' });
      return;
    }
    if (variant === 'tracking') {
      timeline.add(element, { ...common, y: [compactViewport ? 12 : 18, 0], scaleY: [.98, 1] });
      return;
    }
    if (variant === 'rise') {
      timeline.add(element, { ...common, y: [compactViewport ? 14 : 22, 0], scaleY: [.98, 1], scaleX: [1.01, 1], transformOrigin: 'center bottom' });
      return;
    }
    timeline.add(element, { ...common, y: [compactViewport ? 10 : 16, 0], scale: [.99, 1] });
  }

  function setupHeroScrollStretch() {
    const hero = document.querySelector('.hero');
    const titleLines = document.querySelectorAll('.hero-title-line');
    if (!hero || !titleLines.length || reducedMotion) return;

    const scrollMotion = animate(titleLines, {
      y: [0, compactViewport ? 14 : 28],
      scaleY: [1, compactViewport ? 1.05 : 1.1],
      scaleX: [1, .985],
      opacity: [1, .42],
      ease: 'linear',
      autoplay: false
    });

    // The homepage uses Lenis, so drive Anime's scrub from the resolved page
    // position. This avoids two scroll observers competing for the same
    // transform while keeping the effect smooth during inertial scrolling.
    let frame = 0;
    const sync = () => {
      frame = 0;
      const rect = hero.getBoundingClientRect();
      const range = Math.max(1, hero.offsetHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / range));
      scrollMotion.seek(progress * scrollMotion.duration);
    };
    const requestSync = () => {
      if (!frame) frame = window.requestAnimationFrame(sync);
    };
    window.addEventListener('scroll', requestSync, { passive: true });
    window.addEventListener('resize', requestSync, { passive: true });
    requestSync();
  }

  function reveal(element) {
    if (element.getAttribute('data-motion-reveal') === 'text-fade') {
      element.classList.add('is-motion-visible');
      return;
    }
    if (element.dataset.motionPlayed === 'true') return;
    element.dataset.motionPlayed = 'true';
    element.classList.add('is-motion-visible', 'is-visible');
    const delay = Number.parseInt(element.style.getPropertyValue('--motion-delay'), 10) || 0;
    const type = element.getAttribute('data-motion-reveal');
    const fastWorkflowScroll = document.documentElement.classList.contains('workflow-scrolling');
    if (reducedMotion || fastWorkflowScroll) {
      element.style.opacity = '1';
      element.style.filter = 'none';
      // Let layout-owned transforms (the exploration fan) come from CSS.
      element.style.removeProperty('transform');
      element.dispatchEvent(new CustomEvent('northwind:motion-visible', { bubbles: true }));
      return;
    }
    element.style.willChange = type === 'image' ? 'opacity, transform, filter' : 'opacity, transform';
    const timeline = createTimeline({ defaults: { ease: 'out(4)' } });
    if (type === 'heading') {
      revealHeading(timeline, element, delay);
    } else if (element.matches('.explore-card')) {
      // Card geometry is owned by the fan layout; only reveal its surface.
      timeline.add(element, {
        opacity: [0, 1],
        filter: ['blur(4px)', 'blur(0px)'],
        duration: compactViewport ? 220 : 300,
        delay
      });
    } else {
      timeline.add(element, {
        opacity: [0, 1],
        y: [compactViewport ? 12 : 18, 0],
        scale: type === 'image' ? [1.025, 1] : [0.99, 1],
        filter: type === 'image' ? ['blur(4px)', 'blur(0px)'] : ['blur(2px)', 'blur(0px)'],
        duration: compactViewport ? 220 : 300,
        delay,
        // Anime temporarily owns transform during the reveal. Returning it
        // to CSS afterward restores the card's fan rotation and offsets.
      });
    }
    timeline.then(() => element.style.removeProperty('will-change'));
    element.dispatchEvent(new CustomEvent('northwind:motion-visible', { bubbles: true }));
  }

  function observe(element) {
    if (observed.has(element)) return;
    observed.add(element);
    if (reducedMotion || !observer) { reveal(element); return; }
    if (element.getAttribute('data-motion-reveal') === 'text-fade') {
      textFadeObserver.observe(element);
      return;
    }
    observer.observe(element);
  }

  function boot() {
    register();
    document.body.classList.add('motion-ready');
    observer = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.target.getAttribute('data-motion-reveal') === 'text-fade') {
        entry.target.classList.toggle('is-motion-visible', entry.isIntersecting);
        return;
      }
      if (entry.isIntersecting) { observer.unobserve(entry.target); reveal(entry.target); }
    }), {
      threshold: 0.01,
      // Prewarm the next section so a quick wheel/trackpad gesture does not
      // outrun the heading's first frame.
      rootMargin: document.body.classList.contains('home-section-motion') ? '0px 0px 12% 0px' : '0px 0px -4% 0px'
    }) : null;
    textFadeObserver = 'IntersectionObserver' in window ? new IntersectionObserver((entries) => entries.forEach((entry) => {
      entry.target.classList.toggle('is-motion-visible', entry.isIntersecting);
    }), {
      threshold: .35,
      rootMargin: '-6% 0px -12% 0px'
    }) : null;
    document.querySelectorAll('[data-motion-reveal]').forEach(observe);
    setupHeroScrollStretch();
    new MutationObserver((records) => records.forEach((record) => record.addedNodes.forEach((node) => { if (node.nodeType === Node.ELEMENT_NODE) { register(node.parentElement || document); document.querySelectorAll('[data-motion-reveal]').forEach(observe); } }))).observe(document.body, { childList: true, subtree: true });
  }

  window.NorthwindMotion = { register, observe, reveal };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
}());
