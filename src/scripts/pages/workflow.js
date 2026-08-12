(function () {
  'use strict';

  var container = document.getElementById('workflowCardSwap');
  var cards = Array.prototype.slice.call(document.querySelectorAll('.workflow-card'));
  var nav = document.querySelector('.workflow-nav');
  var reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var compactViewportQuery = window.matchMedia('(max-width: 760px)');
  var reducedMotion = reducedMotionQuery.matches;
  var order = cards.map(function (_, index) { return index; });
  var isReordering = false;
  var reorderingTimer = 0;
  var autoTimer = 0;
  var stageVisible = false;
  var interactionPaused = false;
  var slideEase = 'cubic-bezier(.23, 1, .32, 1)';
  var transitionDuration = 360;
  var distanceX = 38;
  var distanceY = 47;

  function transformFor(index) {
    return 'translate(calc(-50% + ' + index * distanceX + 'px), calc(-50% - ' + index * distanceY + 'px)) rotate(' + (index * 1.5 - 3) + 'deg)';
  }

  function place(card, index, instant) {
    card.style.zIndex = String(cards.length - index);
    card.style.transition = instant || reducedMotion ? 'none' : 'transform ' + transitionDuration + 'ms ' + slideEase;
    card.style.transform = transformFor(index);
    card.setAttribute('aria-hidden', String(index !== 0));
    card.tabIndex = index === 0 ? 0 : -1;
  }

  function syncStack(instant) {
    order.forEach(function (cardIndex, index) { place(cards[cardIndex], index, instant); });
  }

  function reorder() {
    if (isReordering || order.length < 2) return;
    isReordering = true;
    order.push(order.shift());
    syncStack(false);
    window.clearTimeout(reorderingTimer);
    reorderingTimer = window.setTimeout(function () { isReordering = false; }, reducedMotion ? 0 : transitionDuration);
  }

  function canAutoRotate() {
    return !reducedMotion && !compactViewportQuery.matches && !document.hidden && stageVisible && !interactionPaused;
  }

  function stopAutoRotate() {
    if (!autoTimer) return;
    window.clearInterval(autoTimer);
    autoTimer = 0;
  }

  function updateAutoRotate() {
    if (!canAutoRotate()) {
      stopAutoRotate();
      return;
    }
    if (autoTimer) return;
    autoTimer = window.setInterval(function () {
      if (!canAutoRotate()) {
        stopAutoRotate();
        return;
      }
      reorder();
    }, 2300);
  }

  function navigateToCard(card, instant) {
    var target = document.querySelector(card.getAttribute('data-target'));
    if (target) target.scrollIntoView({ behavior: reducedMotion || instant ? 'auto' : 'smooth', block: 'start' });
  }

  if (container && cards.length) {
    syncStack(true);
    var stage = container.closest('.card-swap-stage');
    if ('IntersectionObserver' in window && stage) {
      new IntersectionObserver(function (entries) {
        stageVisible = entries[0].isIntersecting;
        updateAutoRotate();
      }, { threshold: .2 }).observe(stage);
    } else {
      stageVisible = true;
      updateAutoRotate();
    }
    container.addEventListener('click', function (event) {
      var card = event.target.closest('.workflow-card');
      if (!card || card !== cards[order[0]]) return;
      reorder();
      navigateToCard(card);
    });
    container.addEventListener('keydown', function (event) {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      var card = event.target.closest('.workflow-card');
      if (!card || card !== cards[order[0]]) return;
      event.preventDefault();
      navigateToCard(card, true);
    });
    container.addEventListener('mouseenter', function () {
      interactionPaused = true;
      updateAutoRotate();
    });
    container.addEventListener('mouseleave', function () {
      interactionPaused = false;
      updateAutoRotate();
    });
    container.addEventListener('focusin', function () {
      interactionPaused = true;
      updateAutoRotate();
    });
    container.addEventListener('focusout', function () {
      window.requestAnimationFrame(function () {
        interactionPaused = container.contains(document.activeElement);
        updateAutoRotate();
      });
    });
    document.addEventListener('visibilitychange', updateAutoRotate);
    var updateMotionPreference = function (event) {
      reducedMotion = event.matches;
      syncStack(true);
      updateAutoRotate();
    };
    var updateViewport = function () { updateAutoRotate(); };
    if (reducedMotionQuery.addEventListener) reducedMotionQuery.addEventListener('change', updateMotionPreference);
    else reducedMotionQuery.addListener(updateMotionPreference);
    if (compactViewportQuery.addEventListener) compactViewportQuery.addEventListener('change', updateViewport);
    else compactViewportQuery.addListener(updateViewport);
    window.addEventListener('pagehide', stopAutoRotate, { once: true });
    window.addEventListener('pageshow', updateAutoRotate);
  }

  function animateStats(scope) {
    Array.prototype.forEach.call(scope.querySelectorAll('[data-stat]'), function (stat) {
      if (stat.dataset.statAnimated === 'true') return;
      var target = Number(stat.getAttribute('data-stat'));
      if (!Number.isFinite(target)) return;
      stat.dataset.statAnimated = 'true';
      if (reducedMotion) { stat.textContent = target + '+'; return; }
      var started = performance.now();
      function tick(now) {
        var progress = Math.min((now - started) / 480, 1);
        stat.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3))) + '+';
        if (progress < 1) window.requestAnimationFrame(tick);
      }
      window.requestAnimationFrame(tick);
    });
  }

  document.addEventListener('northwind:motion-visible', function (event) { animateStats(event.target); });
  window.addEventListener('scroll', function () {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 24);
  }, { passive: true });
}());
