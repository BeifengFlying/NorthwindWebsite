(function () {
  var stage = document.getElementById('infiniteMenuRoot');
  if (!stage) return;
  var nav = document.querySelector('.journey-nav');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  stage.removeAttribute('aria-busy');
  var revealItems = document.querySelectorAll('[data-reveal]'); if ('IntersectionObserver' in window) { var observer = new IntersectionObserver(function (entries) { entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }); }, { threshold: .12 }); revealItems.forEach(function (item) { observer.observe(item); }); } else revealItems.forEach(function (item) { item.classList.add('is-visible'); });
  window.addEventListener('scroll', function () { if (!reduceMotion) stage.style.setProperty('--scroll-shift', (window.scrollY * .025) + 'px'); nav.classList.toggle('scrolled', window.scrollY > 24); }, { passive: true });
}());
