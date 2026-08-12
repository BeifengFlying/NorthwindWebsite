(function () {
  var stage = document.getElementById('infiniteMenuRoot');
  if (!stage) return;
  var nav = document.querySelector('.journey-nav');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  stage.removeAttribute('aria-busy');
  window.addEventListener('scroll', function () { if (!reduceMotion) stage.style.setProperty('--scroll-shift', (window.scrollY * .025) + 'px'); nav.classList.toggle('scrolled', window.scrollY > 24); }, { passive: true });
}());
