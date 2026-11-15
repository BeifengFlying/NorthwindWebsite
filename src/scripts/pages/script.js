/* ============================================================
   NORTHWIND V2.1 · SCRIPT
   ============================================================ */
(function initHomepage() {
var navToggle = document.getElementById('navToggle');
var navLinks = document.getElementById('navLinks');
var mobileNav = navToggle && navToggle.closest('.nav');

function setMobileMenu(open) {
  if (!navToggle || !navLinks || !mobileNav) return;
  navLinks.classList.toggle('open', open);
  mobileNav.classList.toggle('is-menu-open', open);
  document.documentElement.classList.toggle('mobile-menu-open', open);
  document.body.classList.toggle('mobile-menu-open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  var i18n = window.NorthwindI18n;
  navToggle.setAttribute('aria-label', open ? (i18n ? i18n.t('close_menu', '关闭菜单') : '关闭菜单') : (i18n ? i18n.t('open_menu', '打开菜单') : '打开菜单'));
}

if (navToggle && navLinks) {
  navToggle.addEventListener('click', function () {
    setMobileMenu(!navLinks.classList.contains('open'));
  });
  navLinks.querySelectorAll('.nav-link').forEach(function (link) {
    link.addEventListener('click', function () { setMobileMenu(false); });
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') setMobileMenu(false);
  });
}

var hasMotionLibraries = Boolean(window.gsap && window.ScrollTrigger && window.Lenis);
var homepageNav = document.querySelector('.nav');

// Keep the compact header state working even when the optional motion CDN is unavailable.
function syncHomepageNav() {
  if (homepageNav) homepageNav.classList.toggle('scrolled', window.scrollY > 30);
}
window.addEventListener('scroll', syncHomepageNav, { passive: true });
syncHomepageNav();

function syncSolutionsAccessState() {
  var passed = false;
  try { passed = window.localStorage.getItem('northwind-solutions-ac-passed') === 'true'; } catch (error) {}
  document.querySelectorAll('[data-solutions-status]').forEach(function (element) {
    element.textContent = passed ? '恭喜通过' : '待 AC';
    element.classList.toggle('is-passed', passed);
  });
  document.querySelectorAll('[data-solutions-title]').forEach(function (element) {
    element.classList.toggle('is-passed', passed);
  });
  var solutionProject = document.querySelector('[data-project-id="solutions"]');
  if (solutionProject) solutionProject.classList.toggle('is-solution-passed', passed);
}

syncSolutionsAccessState();
window.addEventListener('storage', syncSolutionsAccessState);

if (hasMotionLibraries) {

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const navigationEntry = performance.getEntriesByType('navigation')[0];
const isReload = navigationEntry && navigationEntry.type === 'reload';
const returnsFromLegacyProjectsLink = new URLSearchParams(window.location.search).get('from') === 'projects';
const resetHomepageToTop = Boolean(isReload || returnsFromLegacyProjectsLink);
const reduceMotion = window.NorthwindPerformance?.lite || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const compactViewport = window.matchMedia('(max-width: 768px)').matches;
if (resetHomepageToTop) history.replaceState(null, '', window.location.pathname);

// Browsers may retain the previous scroll position even with manual
// restoration. The homepage should always start at the top on a refresh.
if (resetHomepageToTop) window.scrollTo(0, 0);

/* --------------------------------
   LENIS + SCROLLTRIGGER INIT
   -------------------------------- */
gsap.registerPlugin(ScrollTrigger);

const lenis = reduceMotion ? {
  on() {},
  scrollTo(target) { window.scrollTo({ top: Number(target) || 0, behavior: 'instant' }); }
} : new Lenis({
  // Keep the material glide, but reduce catch-up latency so fast scrolling
  // reveals the next heading while the user is still reading that section.
  duration: compactViewport ? 0.6 : 0.75,
  smoothWheel: !reduceMotion,
});

lenis.on('scroll', ScrollTrigger.update);
if (!reduceMotion) gsap.ticker.add((time) => { if (!document.hidden) lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);

/* --------------------------------
   CRAFTED WORKS POSITION RESTORE
   -------------------------------- */
const craftedWorksPositionKey = 'craftedWorksPosition';
const craftedWorksProjectKey = 'craftedWorksProject';
let craftedWorksRestoreTask = null;

function readCraftedWorksState() {
  if (window.NorthwindPageState) {
    const state = window.NorthwindPageState.readCraftedWorks();
    if (state) return state;
  }
  try {
    const storedPosition = sessionStorage.getItem(craftedWorksPositionKey);
    if (storedPosition === null) return null;
    const scrollY = Number(storedPosition);
    if (!Number.isFinite(scrollY) || scrollY < 0) return null;
    return {
      page: 'crafted-works',
      scrollY,
      project: sessionStorage.getItem(craftedWorksProjectKey) || '',
    };
  } catch (error) {
    return null;
  }
}

const shouldRestoreCraftedWorks = Boolean(readCraftedWorksState());

function saveCraftedWorksPosition(event) {
  const link = event.currentTarget;
  if (window.NorthwindPageState) {
    window.NorthwindPageState.saveCraftedWorks(link);
    return;
  }
  try {
    sessionStorage.setItem(craftedWorksPositionKey, String(Math.round(window.scrollY)));
    sessionStorage.setItem(craftedWorksProjectKey, link.dataset.projectId || '');
  } catch (error) {
    /* Private browsing can disable session storage without affecting navigation. */
  }
}

function waitForWindowLoad() {
  if (document.readyState === 'complete') return Promise.resolve();
  return new Promise((resolve) => window.addEventListener('load', resolve, { once: true }));
}

function waitForPageImages() {
  const pendingImages = Array.from(document.images).filter((image) => !image.complete);
  return Promise.all(pendingImages.map((image) => new Promise((resolve) => {
    image.addEventListener('load', resolve, { once: true });
    image.addEventListener('error', resolve, { once: true });
  })));
}

function waitForStableLayout() {
  return new Promise((resolve) => {
    let previousHeight = -1;
    let stableFrames = 0;
    const startedAt = performance.now();
    const inspectLayout = () => {
      const currentHeight = document.documentElement.scrollHeight;
      stableFrames = Math.abs(currentHeight - previousHeight) <= 1 ? stableFrames + 1 : 0;
      previousHeight = currentHeight;
      if (stableFrames >= 3 || performance.now() - startedAt > 1600) {
        resolve();
        return;
      }
      requestAnimationFrame(inspectLayout);
    };
    requestAnimationFrame(inspectLayout);
  });
}

function nextAnimationFrame() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}

function restoreCraftedWorksPosition() {
  if (craftedWorksRestoreTask) return craftedWorksRestoreTask;
  const state = readCraftedWorksState();
  if (!state) return Promise.resolve(false);

  document.documentElement.classList.add('is-restoring-crafted-works');
  craftedWorksRestoreTask = Promise.all([
    waitForWindowLoad(),
    waitForPageImages(),
    document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => {}) : Promise.resolve(),
  ]).then(waitForStableLayout).then(async () => {
    const applyPosition = () => {
      lenis.scrollTo(state.scrollY, { immediate: true, force: true });
      window.scrollTo(0, state.scrollY);
      if (window.ScrollTrigger) {
        ScrollTrigger.refresh();
        ScrollTrigger.update();
      }
      window.dispatchEvent(new Event('scroll'));
    };

    applyPosition();
    await nextAnimationFrame();
    await nextAnimationFrame();
    applyPosition();

    const project = state.project && document.querySelector('[data-project-id="' + state.project + '"]');
    if (project) {
      project.classList.add('project--last-viewed');
      window.setTimeout(() => project.classList.remove('project--last-viewed'), 1800);
    }

    document.documentElement.classList.remove('is-restoring-crafted-works');
    await nextAnimationFrame();
    applyPosition();
    if (window.ScrollTrigger) {
      ScrollTrigger.refresh();
      ScrollTrigger.update();
    }
    if (window.NorthwindPageState) window.NorthwindPageState.clearCraftedWorks();
    else {
      try {
        sessionStorage.removeItem(craftedWorksPositionKey);
        sessionStorage.removeItem(craftedWorksProjectKey);
      } catch (error) {}
    }
    return true;
  }).finally(() => {
    craftedWorksRestoreTask = null;
  });
  return craftedWorksRestoreTask;
}

document.querySelectorAll('.project-link').forEach((link) => {
  link.addEventListener('click', saveCraftedWorksPosition);
});

restoreCraftedWorksPosition();
window.addEventListener('pageshow', restoreCraftedWorksPosition);

if (resetHomepageToTop) {
  const enforceHomepageTop = () => {
    lenis.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
    ScrollTrigger.refresh();
  };
  window.addEventListener('load', () => requestAnimationFrame(enforceHomepageTop), { once: true });
} else if (window.location.hash && !shouldRestoreCraftedWorks) {
  const homepageTarget = document.getElementById(window.location.hash.slice(1));
  if (homepageTarget) {
    const enforceHomepageTarget = () => {
      lenis.scrollTo(homepageTarget, { immediate: true, force: true });
      window.scrollTo(0, homepageTarget.offsetTop);
      ScrollTrigger.refresh();
    };
    requestAnimationFrame(enforceHomepageTarget);
    window.addEventListener('load', () => requestAnimationFrame(enforceHomepageTarget), { once: true });
  }
}

if (reduceMotion) {
  document.querySelectorAll(
    '.reveal-stagger, .reveal, .hero-title-line, .hero-subtitle, .hero-scroll-hint, ' +
    '.project, .explore-card, .complexity, .creative-title, .now-item, ' +
    '.cta-title, .cta-subtitle, .cta-buttons, .algo-node, .algo-edge, ' +
    '.ambient-blob'
  ).forEach(el => {
    el.style.opacity = '1';
    if (!el.classList.contains('explore-card')) el.style.transform = 'none';
  });
}

/* --------------------------------
   MOBILE NAV
   -------------------------------- */
/* --------------------------------
   NAV SCROLL STATE
   -------------------------------- */
const nav = document.querySelector('.nav');
ScrollTrigger.create({
  trigger: 'body',
  start: 'top+=30 top',
  onEnter: () => nav.classList.add('scrolled'),
  onLeaveBack: () => nav.classList.remove('scrolled'),
});

const sections = document.querySelectorAll('section[id]');
const navLinksAll = document.querySelectorAll('.nav-link');
let sectionRanges = [];
let activeSectionId = '';
function measureSectionRanges() {
  sectionRanges = Array.from(sections, (section) => ({
    id: section.id,
    top: section.offsetTop,
    bottom: section.offsetTop + section.offsetHeight
  }));
}
measureSectionRanges();
window.addEventListener('resize', measureSectionRanges, { passive: true });
window.addEventListener('load', measureSectionRanges, { once: true });
ScrollTrigger.create({
  trigger: 'body',
  start: 'top top',
  end: 'bottom bottom',
  onUpdate: (self) => {
    const scrollPos = self.scroll() + window.innerHeight / 3;
    sectionRanges.some((section) => {
      if (scrollPos >= section.top && scrollPos < section.bottom) {
        if (activeSectionId === section.id) return true;
        activeSectionId = section.id;
        navLinksAll.forEach(l => l.classList.remove('active'));
        const match = document.querySelector('.nav-link[href="#' + section.id + '"]');
        if (match) match.classList.add('active');
        return true;
      }
      return false;
    });
  },
});

/* --------------------------------
   MOUSE INTERACTION (lerp)
   -------------------------------- */
if (!reduceMotion && !compactViewport) {
  const pointer = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  const pointerElements = {
    pink: document.querySelector('.ambient-blob--pink'),
    cyan: document.querySelector('.ambient-blob--cyan'),
    green: document.querySelector('.ambient-blob--green'),
  };
  let pointerActive = true;

  window.addEventListener('pointermove', (e) => {
    target.x = (e.clientX / window.innerWidth - .5) * 2;
    target.y = (e.clientY / window.innerHeight - .5) * 2;
    pointerActive = true;
  });

  gsap.ticker.add(() => {
    if (!pointerActive) return;
    pointer.x += (target.x - pointer.x) * .04;
    pointer.y += (target.y - pointer.y) * .04;

    if (pointerElements.pink) gsap.set(pointerElements.pink, { x: pointer.x * 30, y: pointer.y * 20 });
    if (pointerElements.cyan) gsap.set(pointerElements.cyan, { x: pointer.x * -25, y: pointer.y * -18 });
    if (pointerElements.green) gsap.set(pointerElements.green, { x: pointer.x * 20, y: pointer.y * -15 });
    if (Math.abs(target.x - pointer.x) < .0005 && Math.abs(target.y - pointer.y) < .0005) {
      pointer.x = target.x;
      pointer.y = target.y;
      pointerActive = false;
    }
  });
}

/* --------------------------------
   EXPLORE CARD SPECULAR GLOW SHINE
   -------------------------------- */
(function setupCardShine() {
  const cards = document.querySelectorAll('.explore-card');
  if (!cards.length) return;
  const exploreSection = document.getElementById('explore');
  const ns = 'http://www.w3.org/2000/svg';

  cards.forEach((card, idx) => {
    const svg = document.createElementNS(ns, 'svg');
    svg.classList.add('shine-svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');

    const defs = document.createElementNS(ns, 'defs');

    const gid = 'sg-' + idx;
    const grad = document.createElementNS(ns, 'linearGradient');
    grad.id = gid;
    grad.setAttribute('x1', '0');
    grad.setAttribute('y1', '0');
    grad.setAttribute('x2', '1');
    grad.setAttribute('y2', '0');
    grad.setAttribute('gradientTransform', 'rotate(0, 50, 50)');
    [
      ['0%', 'black'],
      ['38%', 'black'],
      ['47%', 'white'],
      ['53%', 'white'],
      ['62%', 'black'],
      ['100%', 'black'],
    ].forEach(function (pair) {
      var stop = document.createElementNS(ns, 'stop');
      stop.setAttribute('offset', pair[0]);
      stop.setAttribute('stop-color', pair[1]);
      grad.appendChild(stop);
    });
    defs.appendChild(grad);

    var mid = 'sm-' + idx;
    var mask = document.createElementNS(ns, 'mask');
    mask.id = mid;
    var mr = document.createElementNS(ns, 'rect');
    mr.setAttribute('x', '0');
    mr.setAttribute('y', '0');
    mr.setAttribute('width', '100');
    mr.setAttribute('height', '100');
    mr.setAttribute('fill', 'url(#' + gid + ')');
    mask.appendChild(mr);
    defs.appendChild(mask);

    var fid = 'sf-' + idx;
    var filter = document.createElementNS(ns, 'filter');
    filter.id = fid;
    filter.setAttribute('x', '-20%');
    filter.setAttribute('y', '-20%');
    filter.setAttribute('width', '140%');
    filter.setAttribute('height', '140%');
    var feBlur = document.createElementNS(ns, 'feGaussianBlur');
    feBlur.setAttribute('stdDeviation', '1.5');
    filter.appendChild(feBlur);
    defs.appendChild(filter);

    svg.appendChild(defs);

    var base = document.createElementNS(ns, 'rect');
    base.setAttribute('x', '1.5');
    base.setAttribute('y', '1.5');
    base.setAttribute('width', '97');
    base.setAttribute('height', '97');
    base.setAttribute('rx', '10');
    base.setAttribute('fill', 'none');
    base.setAttribute('stroke', 'white');
    base.setAttribute('stroke-width', '1');
    base.setAttribute('opacity', '0.10');
    svg.appendChild(base);

    var hi = document.createElementNS(ns, 'rect');
    hi.setAttribute('x', '1.5');
    hi.setAttribute('y', '1.5');
    hi.setAttribute('width', '97');
    hi.setAttribute('height', '97');
    hi.setAttribute('rx', '10');
    hi.setAttribute('fill', 'none');
    hi.setAttribute('stroke', 'white');
    hi.setAttribute('stroke-width', '2.5');
    hi.setAttribute('mask', 'url(#' + mid + ')');
    hi.setAttribute('filter', 'url(#' + fid + ')');
    svg.appendChild(hi);

    card.appendChild(svg);
    card._shineGrad = grad;
  });

  exploreSection?.addEventListener('pointermove', function (e) {
    if (e.target && e.target.closest && e.target.closest('.option-wheel')) return;
    cards.forEach(function (card) {
      var svg = card.querySelector('.shine-svg');
      var grad = card._shineGrad;
      if (!svg || !grad) return;

      var r = card.getBoundingClientRect();
      var cx = r.left + r.width / 2;
      var cy = r.top + r.height / 2;

      var dx = Math.max(0, r.left - e.clientX, e.clientX - r.right);
      var dy = Math.max(0, r.top - e.clientY, e.clientY - r.bottom);
      var dist = Math.hypot(dx, dy);

      if (dist < 250) {
        svg.classList.add('active');
        var angle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
        grad.setAttribute('gradientTransform', 'rotate(' + angle + ', 50, 50)');
      } else {
        svg.classList.remove('active');
      }
    });
  }, {passive:true});
})();

/* --------------------------------
   ANIMATIONS
   -------------------------------- */
var usesSectionMotion = document.body.classList.contains('home-section-motion');
if (!reduceMotion) {

if (!usesSectionMotion) {
gsap.from('.hero-title-line', {
  y: 100, opacity: 0,
  duration: 1.1, ease: 'power4.out',
  stagger: .15,
});
gsap.from('.hero-subtitle', {
  y: 30, opacity: 0,
  duration: .9, delay: .35, ease: 'power3.out',
});
gsap.from('.hero-scroll-hint', {
  opacity: 0, duration: .7, delay: 1,
});
window.__northwindGsapMotionReady = true;
}

gsap.to('.shape-ring', {
  y: -160, x: 40, rotate: 25, scale: 1.15,
  scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1 },
});
gsap.to('.shape-blob', {
  y: -130, x: -30, scale: 1.2,
  scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 1.1 },
});
gsap.to('.shape-line', {
  x: 50, rotate: 15, opacity: .15,
  scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: .8 },
});

if (!usesSectionMotion) gsap.utils.toArray('.reveal').forEach(function (el) {
  if (el.classList.contains('explore-card') || el.classList.contains('project')) return;
  gsap.from(el, {
    y: 60,
    duration: .85, ease: 'power3.out',
    scrollTrigger: { trigger: el, start: 'top 85%', once: true },
  });
});


/* About pixel bar fill animation */
(function initAboutBars() {
  var bars = document.querySelectorAll('.about-bar');
  if (!bars.length) return;
  var levels = [1, 2, 3, 2, 1, 1, 1];
  var animated = false;

  function fill() {
    if (animated) return;
    animated = true;
    var delay = 0;
    bars.forEach(function (bar, bi) {
      var blocks = bar.querySelectorAll('.about-bar-block');
      var lvl = levels[bi];
      for (var j = 0; j < lvl; j++) {
        (function (block, d) {
          setTimeout(function () { block.classList.add('filled'); }, d);
        })(blocks[j], delay + j * 90);
      }
      delay += lvl * 90 + 120;
    });
  }

  var about = document.querySelector('.about');
  if (about && window.IntersectionObserver) {
    var obs = new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { fill(); obs.disconnect(); }
    }, { threshold: 0.25 });
    obs.observe(about);
  } else {
    setTimeout(fill, 500);
  }
})();

/* About + Creative staggered reveal */
var staggerGroups = [
  { trigger: '.about', items: '.about-right .reveal-stagger', delay: 0.15 },
  { trigger: '.creative', items: '.creative .reveal-stagger', delay: 0.18 },
];

if (!usesSectionMotion) staggerGroups.forEach(function (group) {
  var els = document.querySelectorAll(group.items);
  if (!els.length) return;
  gsap.from(els, {
    y: 20,
    duration: 0.6,
    stagger: group.delay,
    ease: 'power2.out',
    scrollTrigger: { trigger: group.trigger, start: 'top 78%', once: true },
  });
});


if (!usesSectionMotion) gsap.utils.toArray('.explore-card').forEach(function (card, i) {
  gsap.from(card, {
    y: '+=50',
    rotate: i === 0 ? -3 : i === 2 ? 3 : 0,
    duration: .65, ease: 'power3.out',
    clearProps: 'transform',
    scrollTrigger: { trigger: card, start: 'top 88%', once: true },
  });
});

if (!usesSectionMotion) gsap.utils.toArray('.project').forEach(function (proj, i) {
  gsap.from(proj, {
    y: 50,
    duration: .6, delay: i * .08,
    ease: 'power3.out',
    clearProps: 'transform',
    scrollTrigger: { trigger: proj, start: 'top 90%', once: true },
  });
});

var complexityEls = document.querySelectorAll('.complexity');
if (complexityEls.length > 0) {
  var algoTL = gsap.timeline({
    scrollTrigger: {
      trigger: '.algorithm-story',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
    },
  });

  algoTL.fromTo('.complexity-o1',
    { opacity: 1, scale: 1, y: 0 },
    { opacity: 1, scale: 1.08, y: -8, duration: 1 }
  );

  algoTL.to('.complexity-o1', { opacity: 0, scale: .8, y: -40, duration: .5 });
  algoTL.fromTo('.complexity-ologn',
    { opacity: 0, scale: .8, y: 40 },
    { opacity: 1, scale: 1.05, y: 0, duration: .5 },
    '-=.3'
  );

  algoTL.to('.complexity-ologn', { opacity: 0, scale: .8, y: -40, duration: .5 });
  algoTL.fromTo('.complexity-on',
    { opacity: 0, scale: .8, y: 40 },
    { opacity: 1, scale: 1.08, y: 0, duration: .5 },
    '-=.3'
  );

  algoTL.to('.complexity-on', { opacity: 0, scale: .8, y: -40, duration: .5 });
  algoTL.fromTo('.complexity-onlogn',
    { opacity: 0, scale: .8, y: 40 },
    { opacity: 1, scale: 1.05, y: 0, duration: .5 },
    '-=.3'
  );

  algoTL.to('.complexity-onlogn', { opacity: 0, scale: .7, y: -40, duration: .5 });
  algoTL.to('.complexity-o1', { opacity: 1, scale: 1, y: 0, duration: .5 }, '-=.3');
}

if (document.querySelector('.algo-edge')) {
  gsap.to('.algo-edge', {
    strokeDashoffset: -80,
    duration: 3,
    repeat: -1,
    ease: 'none',
  });
}

if (document.querySelector('.algo-node')) {
  gsap.to('.algo-node', {
    scale: 1.2,
    transformOrigin: 'center',
    duration: 1.4,
    stagger: .15,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });
}

if (!usesSectionMotion) gsap.utils.toArray('.now-item').forEach(function (item, i) {
  gsap.from(item, {
    x: -20,
    duration: .5, delay: i * .08,
    ease: 'power3.out',
    scrollTrigger: { trigger: item, start: 'top 90%', once: true },
  });
});

if (!usesSectionMotion) {
gsap.from('.cta-title', {
  y: 60, opacity: 0,
  duration: 1, ease: 'power4.out',
  scrollTrigger: { trigger: '.cta', start: 'top 82%', once: true },
});
gsap.from('.cta-subtitle', {
  y: 25, opacity: 0,
  duration: .7, delay: .25, ease: 'power3.out',
  scrollTrigger: { trigger: '.cta', start: 'top 82%', once: true },
});
gsap.from('.cta-buttons', {
  y: 25, opacity: 0,
  duration: .7, delay: .45, ease: 'power3.out',
  scrollTrigger: { trigger: '.cta', start: 'top 82%', once: true },
});
}

if (!hasMotionLibraries) {
  var fallbackRestoreTask = null;

  function readFallbackCraftedWorksState() {
    if (window.NorthwindPageState) {
      var state = window.NorthwindPageState.readCraftedWorks();
      if (state) return state;
    }
    try {
      var storedPosition = sessionStorage.getItem('craftedWorksPosition');
      if (storedPosition === null) return null;
      var scrollY = Number(storedPosition);
      if (!Number.isFinite(scrollY) || scrollY < 0) return null;
      return { scrollY:scrollY, project:sessionStorage.getItem('craftedWorksProject') || '' };
    } catch (error) {
      return null;
    }
  }

  document.querySelectorAll('.project-link').forEach(function (link) {
    link.addEventListener('click', function () {
      if (window.NorthwindPageState) {
        window.NorthwindPageState.saveCraftedWorks(link);
        return;
      }
      try {
        sessionStorage.setItem('craftedWorksPosition', String(Math.round(window.scrollY)));
        sessionStorage.setItem('craftedWorksProject', link.dataset.projectId || '');
      } catch (error) {}
    });
  });

  function restoreCraftedWorksWithoutMotion() {
    if (fallbackRestoreTask) return fallbackRestoreTask;
    var state = readFallbackCraftedWorksState();
    if (!state) return Promise.resolve(false);
    document.documentElement.classList.add('is-restoring-crafted-works');
    var images = Array.prototype.filter.call(document.images, function (image) { return !image.complete; });
    var imagesReady = Promise.all(images.map(function (image) {
      return new Promise(function (resolve) {
        image.addEventListener('load', resolve, { once:true });
        image.addEventListener('error', resolve, { once:true });
      });
    }));
    var loadReady = document.readyState === 'complete'
      ? Promise.resolve()
      : new Promise(function (resolve) { window.addEventListener('load', resolve, { once:true }); });
    fallbackRestoreTask = Promise.all([imagesReady, loadReady]).then(function () {
      return new Promise(function (resolve) {
        requestAnimationFrame(function () { requestAnimationFrame(resolve); });
      });
    }).then(function () {
      window.scrollTo(0, state.scrollY);
      window.dispatchEvent(new Event('scroll'));
      var project = state.project && document.querySelector('[data-project-id="' + state.project + '"]');
      if (project) {
        project.classList.add('project--last-viewed');
        window.setTimeout(function () { project.classList.remove('project--last-viewed'); }, 1800);
      }
      document.documentElement.classList.remove('is-restoring-crafted-works');
      if (window.NorthwindPageState) window.NorthwindPageState.clearCraftedWorks();
      else {
        try {
          sessionStorage.removeItem('craftedWorksPosition');
          sessionStorage.removeItem('craftedWorksProject');
        } catch (error) {}
      }
      return true;
    }).finally(function () { fallbackRestoreTask = null; });
    return fallbackRestoreTask;
  }

  restoreCraftedWorksWithoutMotion();
  window.addEventListener('pageshow', restoreCraftedWorksWithoutMotion);
}

}
}

/* Pointer-following specular glow on compact tags */
(function initTagGlow() {
  var tags = document.querySelectorAll('.about-direction span, .creative-tags span');
  tags.forEach(function (el) {
    function setLight(e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--spec-x', (e.clientX - r.left) + 'px');
      el.style.setProperty('--spec-y', (e.clientY - r.top) + 'px');
      el.style.setProperty('--spec-opacity', '1');
    }

    el.addEventListener('pointerenter', setLight);
    el.addEventListener('pointermove', setLight);
    el.addEventListener('pointerleave', function () {
      el.style.setProperty('--spec-opacity', '0');
    });
  });
})();

/* ============================================================
   MUSIC SECTION — OptionWheel + Song Data
   ============================================================ */
(function initMusicSection() {
  const section = document.getElementById('music');
  if (!section) return;

  var currentSong = null;

  function getSongPlatforms(song) {
    if (!song) return [];
    var primaryLabels = { netease:'网易云音乐', qq:'QQ音乐', spotify:'Spotify' };
    if (!song.platform) {
      var legacyPrimary = song.neteaseUrl ? 'netease' : 'qq';
      return [{
        platform: legacyPrimary,
        label: primaryLabels[legacyPrimary],
        appUrl: '',
        webUrl: song[legacyPrimary + 'Url'],
      }];
    }
    var primary = {
      platform: song.platform,
      label: primaryLabels[song.platform] || song.platform,
      appUrl: song.appUrl,
      webUrl: song.webUrl,
    };
    return [primary].concat(Array.isArray(song.alternatives) ? song.alternatives : []);
  }

  function findSongPlatform(song, platformId) {
    return getSongPlatforms(song).find(function (platform) { return platform.platform === platformId; }) || getSongPlatforms(song)[0];
  }

  function updateSongUI(s) {
    if (!s) return;
    currentSong = s;
    var setText = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    setText('musicCurrentTitle', s.title);
    setText('musicCurrentArtist', s.artist);
    setText('musicCurrentAlbum', s.album);
    ['qq', 'netease', 'spotify'].forEach(function (platformId) {
      var button = document.querySelector('[data-platform="' + platformId + '"]');
      var platform = findSongPlatform(s, platformId);
      if (!button) return;
      button.hidden = !platform;
      button.dataset.platform = platformId;
      button.setAttribute('aria-label', '打开' + (platform ? platform.label : platformId));
    });
  }

  var chooser = document.getElementById('musicChooser');
  var chooserSong = document.getElementById('musicChooserSong');
  var chooserApp = document.getElementById('musicChooserApp');
  var chooserWeb = document.getElementById('musicChooserWeb');
  var chooserCopy = document.getElementById('musicChooserCopy');
  var chooserPlatform = null;

  function closeMusicChooser() {
    if (!chooser) return;
    chooser.hidden = true;
    document.body.classList.remove('music-chooser-open');
  }

  function showMusicChooser(song, platform) {
    if (!chooser || !song || !platform) return;
    chooserPlatform = platform;
    chooserSong.textContent = song.title + ' · ' + platform.label;
    chooser.hidden = false;
    document.body.classList.add('music-chooser-open');
    chooserApp.hidden = !platform.appUrl;
    chooserWeb.hidden = !platform.webUrl;
  }

  function copyMusicLink(url) {
    if (!url) return;
    var fallback = function () {
      var input = document.createElement('input');
      input.value = url;
      input.setAttribute('readonly', '');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      try { document.execCommand('copy'); } catch (error) {}
      input.remove();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).catch(fallback);
    } else fallback();
  }

  function openMusicDestination(song, platformId) {
    var platform = findSongPlatform(song, platformId);
    if (!song || !platform) return;
    if (!platform.appUrl) {
      showMusicChooser(song, platform);
      return;
    }
    var appWasOpened = false;
    var onVisibilityChange = function () { if (document.hidden) appWasOpened = true; };
    document.addEventListener('visibilitychange', onVisibilityChange, { once: true });
    window.location.href = platform.appUrl;
    window.setTimeout(function () {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (!appWasOpened && !document.hidden) showMusicChooser(song, platform);
    }, 1200);
  }

  document.querySelectorAll('[data-music-chooser-close]').forEach(function (element) {
    element.addEventListener('click', closeMusicChooser);
  });
  if (chooserApp) chooserApp.addEventListener('click', function () {
    if (chooserPlatform && chooserPlatform.appUrl) window.location.href = chooserPlatform.appUrl;
  });
  if (chooserWeb) chooserWeb.addEventListener('click', function () {
    if (chooserPlatform && chooserPlatform.webUrl) window.open(chooserPlatform.webUrl, '_blank', 'noopener');
    closeMusicChooser();
  });
  if (chooserCopy) chooserCopy.addEventListener('click', function () {
    if (chooserPlatform) copyMusicLink(chooserPlatform.webUrl);
    closeMusicChooser();
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeMusicChooser();
  });
  var playButton = document.getElementById('musicPlayButton');
  if (playButton) playButton.addEventListener('click', function () {
    openMusicDestination(currentSong, currentSong && currentSong.platform);
  });
  document.querySelectorAll('.music-platform-btn[data-platform]').forEach(function (button) {
    button.addEventListener('click', function () {
      openMusicDestination(currentSong, button.dataset.platform);
    });
  });

  document.addEventListener('music:song-change', function (event) {
    if (event.detail && event.detail.cover) updateSongUI(event.detail);
  });

})();
}());
