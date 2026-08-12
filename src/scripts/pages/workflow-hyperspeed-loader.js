(function () {
  'use strict';

  var loaded = false;
  var idleHandle = 0;
  var settleTimer = 0;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function loadHyperspeed() {
    if (loaded || reduceMotion || document.documentElement.classList.contains('workflow-scrolling')) return;
    loaded = true;

    var script = document.createElement('script');
    script.src = 'assets/scripts/pages/workflow-hyperspeed.js?v={{APP_VERSION}}';
    script.async = true;
    document.body.appendChild(script);
  }

  function cancelIdleLoad() {
    if (idleHandle && 'cancelIdleCallback' in window) window.cancelIdleCallback(idleHandle);
    else if (idleHandle) window.clearTimeout(idleHandle);
    idleHandle = 0;
  }

  function scheduleIdleLoad() {
    if (reduceMotion) return;
    cancelIdleLoad();
    if ('requestIdleCallback' in window) {
      idleHandle = window.requestIdleCallback(loadHyperspeed, { timeout: 1800 });
    } else {
      idleHandle = window.setTimeout(loadHyperspeed, 500);
    }
  }

  window.addEventListener('scroll', function () {
    cancelIdleLoad();
    window.clearTimeout(settleTimer);
    settleTimer = window.setTimeout(scheduleIdleLoad, 320);
  }, { passive: true });

  function scheduleInitialLoad() {
    scheduleIdleLoad();
  }

  if (document.readyState === 'complete') scheduleInitialLoad();
  else window.addEventListener('load', scheduleInitialLoad, { once: true });
}());
