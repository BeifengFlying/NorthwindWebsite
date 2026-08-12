(function () {
  var container = document.getElementById('workflowCardSwap');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.workflow-card'));
  var nav = document.querySelector('.workflow-nav');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var compactViewport = window.matchMedia('(max-width: 760px)').matches;
  var order = cards.map(function (_, index) { return index; });
  var distanceX = 38; var distanceY = 47; var timer; var moving = false;
  var slideEase = 'cubic-bezier(.2,.8,.2,1)';
  function place(card, index, instant) { card.style.zIndex = String(cards.length - index); card.style.transition = instant ? 'none' : 'transform .58s ' + slideEase; card.style.transform = 'translate(calc(-50% + ' + index * distanceX + 'px), calc(-50% - ' + index * distanceY + 'px)) rotate(' + (index * 1.5 - 3) + 'deg)'; }
  function initial() { cards.forEach(function (card, index) { place(card, index, true); }); }
  function swap() { if (moving || order.length < 2) return; moving = true; var frontIndex = order[0]; var front = cards[frontIndex]; var rest = order.slice(1); front.style.transition = 'transform .58s ' + slideEase; front.style.transform = 'translate(calc(-50% + 230px), calc(-50% + 520px)) rotate(12deg)'; rest.forEach(function (cardIndex, index) { place(cards[cardIndex], index, false); }); window.setTimeout(function () { front.style.zIndex = '1'; front.style.transition = 'transform .62s ' + slideEase; front.style.transform = 'translate(calc(-50% + ' + (cards.length - 1) * distanceX + 'px), calc(-50% - ' + (cards.length - 1) * distanceY + 'px)) rotate(3deg)'; }, 240); window.setTimeout(function () { order = rest.concat(frontIndex); moving = false; }, 900); }
  function start() { if (!reduceMotion && !compactViewport) { window.clearInterval(timer); timer = window.setInterval(swap, 2300); } } function stop() { window.clearInterval(timer); }
  if (container && cards.length) { initial(); start(); container.addEventListener('mouseenter', stop); container.addEventListener('mouseleave', start); cards.forEach(function (card) { card.addEventListener('click', function () { var target = document.querySelector(card.getAttribute('data-target')); if (target) { stop(); target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); window.setTimeout(start, 1200); } }); }); }
  function animateStats() { Array.prototype.forEach.call(document.querySelectorAll('[data-stat]'), function (stat) { var target = Number(stat.getAttribute('data-stat')); var started = Date.now(); function tick() { var progress = Math.min((Date.now() - started) / 900, 1); stat.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3))) + '+'; if (progress < 1) window.requestAnimationFrame(tick); } tick(); }); }
  document.addEventListener('northwind:motion-visible', function (event) {
    if (event.target.querySelector('[data-stat]')) animateStats();
  }, { once: true });
  window.addEventListener('scroll', function () { if (nav) nav.classList.toggle('scrolled', window.scrollY > 24); }, { passive: true });
}());
