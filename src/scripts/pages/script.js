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
  navToggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
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

if (hasMotionLibraries) {

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const navigationEntry = performance.getEntriesByType('navigation')[0];
const isReload = navigationEntry && navigationEntry.type === 'reload';
const returnsFromLegacyProjectsLink = new URLSearchParams(window.location.search).get('from') === 'projects';
const resetHomepageToTop = Boolean(isReload || returnsFromLegacyProjectsLink);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const compactViewport = window.matchMedia('(max-width: 768px)').matches;
if (resetHomepageToTop) history.replaceState(null, '', window.location.pathname);

// Browsers may retain the previous scroll position even with manual
// restoration. The homepage should always start at the top on a refresh.
if (resetHomepageToTop) window.scrollTo(0, 0);

/* --------------------------------
   LENIS + SCROLLTRIGGER INIT
   -------------------------------- */
gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({
  duration: compactViewport ? 0.8 : 1.2,
  smoothWheel: !reduceMotion,
});

lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);

/* --------------------------------
   CRAFTED WORKS POSITION RESTORE
   -------------------------------- */
const craftedWorksPositionKey = 'craftedWorksPosition';
const craftedWorksProjectKey = 'craftedWorksProject';
const shouldRestoreCraftedWorks = !isReload && !window.location.hash;

function saveCraftedWorksPosition(event) {
  const link = event.currentTarget;
  try {
    sessionStorage.setItem(craftedWorksPositionKey, String(Math.round(window.scrollY)));
    sessionStorage.setItem(craftedWorksProjectKey, link.dataset.projectId || '');
  } catch (error) {
    /* Private browsing can disable session storage without affecting navigation. */
  }
}

function restoreCraftedWorksPosition() {
  if (!shouldRestoreCraftedWorks) return;
  let savedPosition = null;
  let savedProject = '';
  try {
    savedPosition = Number(sessionStorage.getItem(craftedWorksPositionKey));
    savedProject = sessionStorage.getItem(craftedWorksProjectKey) || '';
  } catch (error) {
    return;
  }
  if (!Number.isFinite(savedPosition) || savedPosition <= 0) return;

  const applyPosition = () => {
    lenis.scrollTo(savedPosition, { immediate: true, force: true });
    window.scrollTo(0, savedPosition);
    if (window.ScrollTrigger) {
      ScrollTrigger.refresh();
      ScrollTrigger.update();
    }
    window.dispatchEvent(new Event('scroll'));

    const project = savedProject && document.querySelector('[data-project-id="' + savedProject + '"]');
    if (project) {
      project.classList.add('project--last-viewed');
      window.setTimeout(() => project.classList.remove('project--last-viewed'), 1800);
    }
    try {
      sessionStorage.removeItem(craftedWorksPositionKey);
      sessionStorage.removeItem(craftedWorksProjectKey);
    } catch (error) {}
  };

  requestAnimationFrame(() => {
    applyPosition();
    window.setTimeout(applyPosition, 180);
  });
}

document.querySelectorAll('.project-link').forEach((link) => {
  link.addEventListener('click', saveCraftedWorksPosition);
});

restoreCraftedWorksPosition();
window.addEventListener('load', restoreCraftedWorksPosition, { once: true });

if (resetHomepageToTop) {
  const enforceHomepageTop = () => {
    lenis.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
    ScrollTrigger.refresh();
  };
  window.addEventListener('load', () => requestAnimationFrame(enforceHomepageTop), { once: true });
} else if (window.location.hash) {
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
ScrollTrigger.create({
  trigger: 'body',
  start: 'top top',
  end: 'bottom bottom',
  onUpdate: (self) => {
    const scrollPos = self.scroll() + window.innerHeight / 3;
    sections.forEach((sec) => {
      const top = sec.offsetTop;
      const bottom = top + sec.offsetHeight;
      if (scrollPos >= top && scrollPos < bottom) {
        navLinksAll.forEach(l => l.classList.remove('active'));
        const match = document.querySelector('.nav-link[href="#' + sec.id + '"]');
        if (match) match.classList.add('active');
      }
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
    ring: document.querySelector('.shape-ring'),
    blob: document.querySelector('.shape-blob'),
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
    if (pointerElements.ring) gsap.set(pointerElements.ring, { x: pointer.x * 20, y: pointer.y * 14 });
    if (pointerElements.blob) gsap.set(pointerElements.blob, { x: pointer.x * 12, y: pointer.y * 10 });

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

  window.addEventListener('pointermove', function (e) {
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

gsap.to('.algo-edge', {
  strokeDashoffset: -80,
  duration: 3,
  repeat: -1,
  ease: 'none',
});

gsap.to('.algo-node', {
  scale: 1.2,
  transformOrigin: 'center',
  duration: 1.4,
  stagger: .15,
  repeat: -1,
  yoyo: true,
  ease: 'sine.inOut',
});

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
  var fallbackNavigation = performance.getEntriesByType('navigation')[0];
  var fallbackShouldRestore = (!fallbackNavigation || fallbackNavigation.type !== 'reload') && !window.location.hash;
  document.querySelectorAll('.project-link').forEach(function (link) {
    link.addEventListener('click', function () {
      try {
        sessionStorage.setItem('craftedWorksPosition', String(Math.round(window.scrollY)));
        sessionStorage.setItem('craftedWorksProject', link.dataset.projectId || '');
      } catch (error) {}
    });
  });
  if (fallbackShouldRestore) {
    var fallbackRestore = function () {
      var position = null;
      var projectId = '';
      try {
        position = Number(sessionStorage.getItem('craftedWorksPosition'));
        projectId = sessionStorage.getItem('craftedWorksProject') || '';
      } catch (error) {
        return;
      }
      if (!Number.isFinite(position) || position <= 0) return;
      window.scrollTo(0, position);
      var project = projectId && document.querySelector('[data-project-id="' + projectId + '"]');
      if (project) {
        project.classList.add('project--last-viewed');
        window.setTimeout(function () { project.classList.remove('project--last-viewed'); }, 1800);
      }
      try {
        sessionStorage.removeItem('craftedWorksPosition');
        sessionStorage.removeItem('craftedWorksProject');
      } catch (error) {}
    };
    requestAnimationFrame(fallbackRestore);
    window.addEventListener('load', fallbackRestore, { once: true });
  }
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

  var songs = [
    { title:'鲜花 (Live)', artist:'回春丹', album:'乐队的夏天3 第9期', qqUrl:'https://y.qq.com/n/ryqq/search?w=鲜花%20回春丹', neteaseUrl:'https://music.163.com/#/search/m/?s=鲜花%20回春丹', set:'111', cover:'assets/images/music/111/鲜花.webp' },
    { title:'我们的时光', artist:'赵雷', album:'吉姆餐厅', qqUrl:'https://y.qq.com/n/ryqq/search?w=我们的时光%20赵雷', neteaseUrl:'https://music.163.com/#/search/m/?s=我们的时光%20赵雷', set:'111', cover:'assets/images/music/111/我们的时光.webp' },
    { title:'平凡之路', artist:'朴树', album:'猎户星座', qqUrl:'https://y.qq.com/n/ryqq/search?w=平凡之路%20朴树', neteaseUrl:'https://music.163.com/#/song?id=28815250', set:'111', cover:'assets/images/music/111/平凡之路.webp' },
    { title:'公路之歌', artist:'痛仰乐队', album:'不要停止我的音乐', qqUrl:'https://y.qq.com/n/ryqq/search?w=公路之歌%20痛仰', neteaseUrl:'https://music.163.com/#/search/m/?s=公路之歌%20痛仰', set:'111', cover:'assets/images/music/111/公路之歌.webp' },
    { title:'反乌托邦', artist:'乌托邦P', album:'反乌托邦', qqUrl:'https://y.qq.com/n/ryqq/search?w=反乌托邦%20乌托邦P', neteaseUrl:'https://music.163.com/#/search/m/?s=反乌托邦%20乌托邦P', set:'111', cover:'assets/images/music/111/反乌托邦.webp' },
    { title:'Montagem pitty', artist:'见过夏天P、洛天依', album:'拼接遗憾', qqUrl:'https://y.qq.com/n/ryqq/search?w=Montagem%20pitty', neteaseUrl:'https://music.163.com/#/search/m/?s=Montagem%20pitty', set:'111', cover:'assets/images/music/111/Montagem pitty.webp' },
    { title:'越来越不懂', artist:'蔡健雅', album:'Goodbye & Hello', qqUrl:'https://y.qq.com/n/ryqq/search?w=越来越不懂%20蔡健雅', neteaseUrl:'https://music.163.com/#/search/m/?s=越来越不懂%20蔡健雅', set:'111', cover:'assets/images/music/111/越来越不懂.webp' },
    { title:'喜欢', artist:'阿肆', album:'喜欢', qqUrl:'https://y.qq.com/n/ryqq/search?w=喜欢%20阿肆', neteaseUrl:'https://music.163.com/#/search/m/?s=喜欢%20阿肆', set:'111', cover:'assets/images/music/111/喜欢.webp' },
    { title:'такси и полиция', artist:'опека', album:'такси и полиция', qqUrl:'https://y.qq.com/n/ryqq/search?w=такси%20и%20полиция', neteaseUrl:'https://music.163.com/#/search/m/?s=такси%20и%20полиция', set:'222', cover:'assets/images/music/222/такси и полиция.webp' },
    { title:'Remember Our Summer', artist:'FrogMonster', album:'Remember Our Summer', qqUrl:'https://y.qq.com/n/ryqq/search?w=Remember%20Our%20Summer%20FrogMonster', neteaseUrl:'https://music.163.com/#/search/m/?s=Remember%20Our%20Summer%20FrogMonster', set:'111', cover:'assets/images/music/111/Remember Our Summer.webp' },
    { title:'Nevada', artist:'Vicetone、Cozi Zuehlsdorff', album:'Nevada', qqUrl:'https://y.qq.com/n/ryqq/search?w=Nevada%20Vicetone', neteaseUrl:'https://music.163.com/#/search/m/?s=Nevada%20Vicetone', set:'111', cover:'assets/images/music/111/Nevada.webp' },
    { title:'起风了 (旧版)', artist:'买辣椒也用券', album:'起风了 (旧版)', qqUrl:'https://i.y.qq.com/n2/m/share/details/album.html?albummid=003j3NMw1ZBpsv', neteaseUrl:'https://music.163.com/#/search/m/?s=起风了%20旧版%20买辣椒也用券', set:'222', cover:'assets/images/music/222/起风了.webp' },
    { title:"Love Story (Taylor's Version)", artist:'Taylor Swift', album:"Fearless (Taylor's Version)", qqUrl:'https://c.y.qq.com/base/fcgi-bin/u?__=VulaZDZ', neteaseUrl:'https://music.163.com/#/song?id=19292984', set:'111', cover:'assets/images/music/111/Love Story.webp' },
    { title:'Opalite', artist:'Taylor Swift', album:'The Life of a Showgirl', qqUrl:'https://y.qq.com/n/ryqq/search?w=Opalite%20Taylor%20Swift', neteaseUrl:'https://music.163.com/#/search/m/?s=Opalite%20Taylor%20Swift', set:'222', cover:'assets/images/music/222/Opalite.webp' },
    { title:'生如夏花', artist:'朴树', album:'生如夏花', qqUrl:'https://y.qq.com/n/ryqq/search?w=生如夏花%20朴树', neteaseUrl:'https://music.163.com/#/search/m/?s=生如夏花%20朴树', set:'111', cover:'assets/images/music/111/生如夏花.webp' },
    { title:'晴天', artist:'周杰伦', album:'叶惠美', qqUrl:'https://y.qq.com/n/ryqq/search?w=晴天%20周杰伦', set:'222', cover:'assets/images/music/222/晴天.webp' },
    { title:'海阔天空', artist:'Beyond', album:'乐与怒', qqUrl:'https://y.qq.com/n/ryqq/search?w=海阔天空%20Beyond', neteaseUrl:'https://music.163.com/#/search/m/?s=海阔天空%20Beyond', set:'222', cover:'assets/images/music/222/海阔天空.webp' },
    { title:'没有理想的人不伤心', artist:'新裤子', album:'生命因你而火热', qqUrl:'https://y.qq.com/n/ryqq/search?w=没有理想的人不伤心%20新裤子', neteaseUrl:'https://music.163.com/#/search/m/?s=没有理想的人不伤心%20新裤子', set:'222', cover:'assets/images/music/222/没有理想的人不伤心.webp' },
    { title:'心要野', artist:'后海大鲨鱼', album:'心要野', qqUrl:'https://c.y.qq.com/base/fcgi-bin/u?__=BypklO5', neteaseUrl:'https://music.163.com/#/search/m/?s=心要野%20后海大鲨鱼', set:'111', cover:'assets/images/music/111/心要野.webp' },
    { title:'为你唱首歌', artist:'痛仰乐队', album:'不要停止我的音乐', qqUrl:'https://y.qq.com/n/ryqq/search?w=为你唱首歌%20痛仰', neteaseUrl:'https://music.163.com/#/search/m/?s=为你唱首歌%20痛仰', set:'222', cover:'assets/images/music/222/为你唱这首歌.webp' },
    { title:'Timber', artist:'Pitbull、Kesha', album:'Meltdown', qqUrl:'https://y.qq.com/n/ryqq/search?w=Timber%20Pitbull%20Kesha', neteaseUrl:'https://music.163.com/#/search/m/?s=Timber%20Pitbull%20Kesha', set:'222', cover:'assets/images/music/222/Timber.webp' },
    { title:'All Falls Down', artist:'Alan Walker、Noah Cyrus、Digital Farm Animals', album:'Different World', qqUrl:'https://y.qq.com/n/ryqq/search?w=All%20Falls%20Down%20Alan%20Walker', neteaseUrl:'https://music.163.com/#/search/m/?s=All%20Falls%20Down%20Alan%20Walker', set:'222', cover:'assets/images/music/222/All Falls Down.webp' },
    { title:'山雀', artist:'万能青年旅店', album:'冀西南林路行', qqUrl:'https://y.qq.com/n/ryqq/search?w=山雀%20万能青年旅店', neteaseUrl:'https://music.163.com/#/search/m/?s=山雀%20万能青年旅店', set:'222', cover:'assets/images/music/222/山雀.webp' },
    { title:'火车驶向云外，梦安魂于九霄', artist:'刺猬乐队', album:'生之响往', qqUrl:'https://y.qq.com/n/ryqq/search?w=火车驶向云外%20梦安魂于九霄', neteaseUrl:'https://music.163.com/#/search/m/?s=火车驶向云外%20梦安魂于九霄', set:'222', cover:'assets/images/music/222/火车驶向云外，梦安魂于九霄.webp' },
    { title:'皮囊', artist:'萧敬腾', album:'欲望反光', qqUrl:'https://y.qq.com/n/ryqq/search?w=皮囊%20萧敬腾', neteaseUrl:'https://music.163.com/#/search/m/?s=皮囊%20萧敬腾', set:'222', cover:'assets/images/music/222/皮囊.webp' },
    { title:"Don't Call", artist:'Eddie Chen', album:'单曲（无专辑）', qqUrl:'https://y.qq.com/n/ryqq/search?w=Dont%20Call%20Eddie%20Chen', set:'222', cover:'assets/images/music/222/Dont Call.webp' },
    { title:'Yesterday Once More', artist:'Carpenters', album:'Now & Then', qqUrl:'https://y.qq.com/n/ryqq/search?w=Yesterday%20Once%20More%20Carpenters', neteaseUrl:'https://music.163.com/#/search/m/?s=Yesterday%20Once%20More%20Carpenters', set:'111', cover:'assets/images/music/111/Yesterday Once More.webp' },
  ];

  var coverRequestId = 0;
  var coverGeneration = 0;
  var activeCoverImages = Object.create(null);
  var coverDecodeHandle = null;
  var coverDecodeUsesIdleCallback = false;
  var activeCoverLayer = 0;

  function cancelCoverDecode() {
    if (coverDecodeHandle === null) return;
    if (coverDecodeUsesIdleCallback) cancelIdleCallback(coverDecodeHandle);
    else clearTimeout(coverDecodeHandle);
    coverDecodeHandle = null;
  }

  function releaseCoverImages() {
    coverRequestId++;
    coverGeneration++;
    cancelCoverDecode();
    Object.keys(activeCoverImages).forEach(function (src) {
      var image = activeCoverImages[src];
      image.onload = null;
      image.onerror = null;
      image.removeAttribute('src');
    });
    activeCoverImages = Object.create(null);
  }

  function decodeCoversWhenIdle(images, generation) {
    var nextIndex = 0;
    var scheduleNext = function () {
      if (generation !== coverGeneration || nextIndex >= images.length) return;
      var decodeNext = function () {
        coverDecodeHandle = null;
        if (generation !== coverGeneration) return;
        var image = images[nextIndex++];
        var decode = image.decode ? image.decode() : Promise.resolve();
        Promise.resolve(decode).catch(function () {}).then(scheduleNext);
      };
      if ('requestIdleCallback' in window) {
        coverDecodeUsesIdleCallback = true;
        coverDecodeHandle = requestIdleCallback(decodeNext, {timeout:1800});
      } else {
        coverDecodeUsesIdleCallback = false;
        coverDecodeHandle = setTimeout(decodeNext, 180);
      }
    };
    scheduleNext();
  }

  function preloadCoverImages(groupSongs, prioritySong) {
    releaseCoverImages();
    var generation = coverGeneration;
    var deferredImages = [];
    var preloadOrder = prioritySong
      ? [prioritySong].concat(groupSongs.filter(function (song) { return song !== prioritySong; }))
      : groupSongs;
    preloadOrder.forEach(function (song) {
      var image = new Image();
      image.decoding = 'async';
      image.fetchPriority = song === prioritySong ? 'high' : 'low';
      image.src = song.cover;
      activeCoverImages[song.cover] = image;
      if (image.decode) {
        if (song === prioritySong) {
          image.decode().catch(function () {});
        } else {
          deferredImages.push(image);
        }
      }
    });
    decodeCoversWhenIdle(deferredImages, generation);
  }

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
    var coverLayers = document.querySelectorAll('[data-music-cover-layer]');
    if (coverLayers.length > 1) {
      var requestId = ++coverRequestId;
      var image = activeCoverImages[s.cover];
      var showCover = function () {
        if (requestId !== coverRequestId || !image || !image.naturalWidth) return;
        var currentCover = coverLayers[activeCoverLayer];
        if (currentCover.dataset.lastValidSrc === s.cover) {
          currentCover.alt = s.title + ' 封面';
          return;
        }
        var nextLayer = activeCoverLayer === 0 ? 1 : 0;
        var nextCover = coverLayers[nextLayer];
        nextCover.src = image.src;
        nextCover.alt = s.title + ' 封面';
        nextCover.dataset.lastValidSrc = s.cover;
        requestAnimationFrame(function () {
          if (requestId !== coverRequestId) return;
          nextCover.classList.add('music-cover-image--active');
          nextCover.removeAttribute('aria-hidden');
          currentCover.classList.remove('music-cover-image--active');
          currentCover.setAttribute('aria-hidden', 'true');
          activeCoverLayer = nextLayer;
        });
      };
      if (image) {
        var ready = image.decode ? image.decode() : Promise.resolve();
        Promise.resolve(ready).catch(function () {}).then(showCover);
      }
    }
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

  /* ---- OptionWheel (vanilla JS port) ---- */

  function createOptionWheel(container, opts) {
    opts = opts || {};
    var items = opts.items || [];
    var def = opts.defaultSelected || 0;
    var onChange = opts.onChange;
    var textColor = opts.textColor || '#5C5C5C';
    var activeColor = opts.activeColor || '#111111';
    var fontSize = opts.fontSize != null ? opts.fontSize : 2.4;
    var spacing = opts.spacing != null ? opts.spacing : 1.5;
    var curve = opts.curve != null ? opts.curve : 1.3;
    var tilt = opts.tilt != null ? opts.tilt : 12;
    var fade = opts.fade != null ? opts.fade : 0.28;
    var minOpacity = opts.minOpacity != null ? opts.minOpacity : 0.05;
    var smoothing = opts.smoothing != null ? opts.smoothing : 160;
    var inset = opts.inset != null ? opts.inset : 92;
    var loop = opts.loop !== false;
    var draggable = opts.draggable !== false;
    var soundVolume = opts.soundVolume != null ? opts.soundVolume : 0.5;

    var itemRefs = [];
    var pos = def, target = def, selectedIdx = def, selectedPosition = def;
    var rafId = null, lastTime = 0;
    var wheelDirectUntil = 0;
    var dragData = null, dragMoved = false, dragFrame = null;
    var remPx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    var maxRenderedDistance = 3.5;

    function cfg() {
      return { count:items.length, items:items, rowH:Math.max(fontSize*spacing*remPx,1), curve:curve, tilt:tilt, fade:fade, minOpacity:minOpacity, loop:loop, smoothing:smoothing, draggable:draggable };
    }

    container.innerHTML = '';
    container.setAttribute('role','listbox');
    container.setAttribute('tabindex','0');
    container.setAttribute('aria-label','歌曲选择');
    container.classList.add('option-wheel');
    container.style.setProperty('--ow-text-color', textColor);
    container.style.setProperty('--ow-active-color', activeColor);
    container.style.setProperty('--ow-font-size', fontSize+'rem');
    container.style.setProperty('--ow-inset', inset+'px');

    function renderItems() {
      container.innerHTML = '';
      itemRefs = [];
      items.forEach(function (label, i) {
        var div = document.createElement('div');
        div.className = 'option-wheel__item';
        if (i === def) div.classList.add('option-wheel__item--selected');
        div.setAttribute('role','option');
        div.setAttribute('aria-selected', i===def?'true':'false');
        div.textContent = label;
        div.addEventListener('click', (function (idx) { return function () { handleItemClick(idx); }; })(i));
        container.appendChild(div);
        itemRefs.push(div);
      });
    }

    renderItems();

    function renderPosition(next, c) {
      pos = next;
      syncSelection(pos, c);
      var n = c.count;
      var mirror = -1;
      var tiltRad = c.tilt*Math.PI/180;
      var R = tiltRad > 0.0005 ? c.rowH/tiltRad : 0;
      for (var i=0; i<n; i++) {
        var el = itemRefs[i];
        if (!el) continue;
        var d = i - next;
        if (c.loop && n>1) { d=((d%n)+n)%n; if (d>n/2) d-=n; }
        var dist = Math.abs(d);
        if (dist > maxRenderedDistance) {
          if (el._owVisible !== false) {
            el.style.visibility = 'hidden';
            el._owVisible = false;
          }
          continue;
        }
        if (el._owVisible !== true) {
          el.style.visibility = 'visible';
          el._owVisible = true;
        }
        var x=0, y=d*c.rowH, rot=0;
        if (R>0) {
          var ang = Math.max(-Math.PI/2, Math.min(Math.PI/2, d*tiltRad));
          y = R*Math.sin(ang);
          x = -mirror*R*(1-Math.cos(ang))*c.curve;
          rot = mirror*ang*180/Math.PI;
        }
        var itemScale = 1 + Math.max(0, 1-dist) * 0.035;
        el.style.transform = 'translate3d('+x.toFixed(2)+'px, calc('+y.toFixed(2)+'px - 50%), 0) rotate('+rot.toFixed(3)+'deg) scale('+itemScale.toFixed(3)+')';
        el.style.opacity = String(Math.max(c.minOpacity, 1-dist*c.fade));
      }
    }

    function runFrame(now) {
      var dt = Math.min((now-lastTime)/1000, 0.05);
      lastTime = now;
      var c = cfg();
      var tau = Math.max(c.smoothing,1)/1000;
      var k = 1 - Math.exp(-dt/tau);
      var directTracking = now < wheelDirectUntil;
      var next = directTracking ? target : pos + (target-pos)*k;
      var settled = Math.abs(target-next) < 0.001;
      if (settled) next = target;
      renderPosition(next, c);
      rafId = settled ? null : requestAnimationFrame(runFrame);
    }

    function startLoop() {
      if (rafId!=null) return;
      lastTime = performance.now();
      rafId = requestAnimationFrame(runFrame);
    }

    function unlockTickAudio() {
      if (window.NorthwindSound) window.NorthwindSound.unlock();
    }

    function playTick() {
      if (window.NorthwindSound) window.NorthwindSound.playTick(soundVolume);
    }

    function syncSelection(value, c) {
      if (!c.count) return;
      var roundedPosition = Math.round(value);
      if (roundedPosition === selectedPosition) return;
      var idx = ((roundedPosition%c.count)+c.count)%c.count;
      if (itemRefs[selectedIdx]) {
        itemRefs[selectedIdx].classList.remove('option-wheel__item--selected');
        itemRefs[selectedIdx].setAttribute('aria-selected', 'false');
      }
      if (itemRefs[idx]) {
        itemRefs[idx].classList.add('option-wheel__item--selected');
        itemRefs[idx].setAttribute('aria-selected', 'true');
      }
      selectedPosition = roundedPosition;
      selectedIdx = idx;
      if (onChange) onChange(idx, c.items[idx]);
      playTick();
    }

    function applyTarget(value, snap, renderDirectly) {
      var c = cfg();
      var v = value;
      if (!c.loop) v = Math.min(Math.max(v,0), Math.max(c.count-1,0));
      if (snap) v = Math.round(v);
      target = v;
      if (renderDirectly) {
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = null;
        renderPosition(v, c);
        return;
      }
      startLoop();
    }

    document.addEventListener('pointerdown', unlockTickAudio, { capture:true });
    document.addEventListener('touchstart', unlockTickAudio, { capture:true, passive:true });
    document.addEventListener('keydown', unlockTickAudio, { capture:true });
    container.addEventListener('wheel', unlockTickAudio, { capture:true, passive:true });

    container.addEventListener('wheel', function (e) {
      e.stopPropagation();
      e.preventDefault();
      var c = cfg();
      var delta = e.deltaMode===1 ? e.deltaY*24 : e.deltaY;
      wheelDirectUntil = performance.now() + 140;
      applyTarget(target + Math.max(-1, Math.min(1, delta/c.rowH)), false);
    }, {passive:false});

    container.addEventListener('pointerdown', function (e) {
      if (!cfg().draggable) return;
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
      target = pos;
      dragData = {y:e.clientY, latestY:e.clientY, start:pos, id:e.pointerId};
      dragMoved = false;
      container.classList.add('option-wheel--dragging');
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragData) return;
      var pointerSamples = e.getCoalescedEvents ? e.getCoalescedEvents() : null;
      var latestPointer = pointerSamples && pointerSamples.length
        ? pointerSamples[pointerSamples.length - 1]
        : e;
      dragData.latestY = latestPointer.clientY;
      var dy = dragData.latestY - dragData.y;
      if (!dragMoved && Math.abs(dy)>3) {
        dragMoved=true;
        try { container.setPointerCapture(dragData.id); } catch (error) {}
      }
      if (dragMoved && dragFrame === null) {
        dragFrame = requestAnimationFrame(function () {
          dragFrame = null;
          if (!dragData || !dragMoved) return;
          var latestDy = dragData.latestY - dragData.y;
          applyTarget(dragData.start - latestDy/cfg().rowH, false, true);
        });
      }
    }, {passive:true});
    window.addEventListener('pointerup', function () {
      if (!dragData) return;
      var finishedDrag = dragData;
      var wasDragged = dragMoved;
      if (dragFrame !== null) {
        cancelAnimationFrame(dragFrame);
        dragFrame = null;
      }
      if (wasDragged) {
        var finalDy = finishedDrag.latestY - finishedDrag.y;
        applyTarget(finishedDrag.start - finalDy/cfg().rowH, false, true);
      }
      dragData = null;
      container.classList.remove('option-wheel--dragging');
    });
    window.addEventListener('pointercancel', function () {
      if (dragFrame !== null) cancelAnimationFrame(dragFrame);
      dragFrame = null;
      dragData = null;
      dragMoved = false;
      container.classList.remove('option-wheel--dragging');
    });

    function handleItemClick(index) {
      if (dragMoved) return;
      var c = cfg();
      var cur = target;
      var d = index - (((cur%c.count)+c.count)%c.count);
      if (c.loop && c.count>1) { if (d>c.count/2) d-=c.count; else if (d<-c.count/2) d+=c.count; }
      applyTarget(cur+d, true);
    }

    container.addEventListener('keydown', function (e) {
      var delta = null;
      if (e.key==='ArrowUp'||e.key==='ArrowLeft') delta=-1;
      else if (e.key==='ArrowDown'||e.key==='ArrowRight') delta=1;
      if (delta==null) return;
      e.preventDefault();
      applyTarget(Math.round(target)+delta, true);
    });

    function setItems(nextItems, nextSelected) {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (dragFrame !== null) cancelAnimationFrame(dragFrame);
      rafId = null;
      wheelDirectUntil = 0;
      dragFrame = null;
      dragData = null;
      dragMoved = false;
      container.classList.remove('option-wheel--dragging');
      items = nextItems || [];
      def = Math.min(Math.max(nextSelected || 0, 0), Math.max(items.length - 1, 0));
      pos = def;
      target = def;
      selectedIdx = def;
      selectedPosition = def;
      renderItems();
      startLoop();
    }

    applyTarget(def, false);
    return { setItems:setItems };
  }

  /* ---- Init ---- */
  var wheelContainer = document.getElementById('optionWheel');
  function initializeMusicWheel() {
    if (!wheelContainer || !songs.length) return;
    var compactWheel = window.matchMedia('(max-width: 640px)').matches;
    var activeSet = '111';
    var activeSongs = songs.filter(function (song) { return song.set === activeSet; });
    var selectedIndexBySet = { '111':Math.floor(Math.random() * activeSongs.length) };
    var songUITimer = null;
    var queuedSong = null;
    var queueSongUIUpdate = function (song) {
      queuedSong = song;
      if (songUITimer !== null) clearTimeout(songUITimer);
      songUITimer = setTimeout(function () {
        songUITimer = null;
        var nextSong = queuedSong;
        queuedSong = null;
        if (nextSong) updateSongUI(nextSong);
      }, 80);
    };
    preloadCoverImages(activeSongs, activeSongs[selectedIndexBySet[activeSet]]);
    var wheelApi = createOptionWheel(wheelContainer, {
      items: activeSongs.map(function (s) { return s.title; }),
      defaultSelected: selectedIndexBySet[activeSet],
      onChange: function (index) {
        selectedIndexBySet[activeSet] = index;
        queueSongUIUpdate(activeSongs[index]);
      },
      textColor: '#5C5C5C',
      activeColor: '#111111',
      fontSize: compactWheel ? 1.55 : 2.4,
      spacing: 1.5,
      curve: 1.3,
      tilt: 12,
      fade: 0.28,
      smoothing: 160,
      inset: compactWheel ? 36 : 92,
      loop: true,
      draggable: true,
      soundVolume: 0.4,
    });
    updateSongUI(activeSongs[selectedIndexBySet[activeSet]]);

    var groupToggle = document.getElementById('musicGroupToggle');
    if (groupToggle) {
      groupToggle.addEventListener('click', function () {
        if (songUITimer !== null) clearTimeout(songUITimer);
        songUITimer = null;
        queuedSong = null;
        activeSet = activeSet === '111' ? '222' : '111';
        activeSongs = songs.filter(function (song) { return song.set === activeSet; });
        if (selectedIndexBySet[activeSet] == null) {
          selectedIndexBySet[activeSet] = Math.floor(Math.random() * activeSongs.length);
        }
        preloadCoverImages(activeSongs, activeSongs[selectedIndexBySet[activeSet]]);
        wheelApi.setItems(
          activeSongs.map(function (song) { return song.title; }),
          selectedIndexBySet[activeSet]
        );
        updateSongUI(activeSongs[selectedIndexBySet[activeSet]]);
      });
    }
  }

  if (wheelContainer) {
    fetch('assets/data/music.json', { credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) throw new Error('Unable to load music data: ' + response.status);
        return response.json();
      })
      .then(function (remoteSongs) {
        if (!Array.isArray(remoteSongs) || !remoteSongs.length) throw new Error('Invalid music data');
        songs = remoteSongs;
        initializeMusicWheel();
      })
      .catch(function () {
        initializeMusicWheel();
      });
  }
})();
}());
