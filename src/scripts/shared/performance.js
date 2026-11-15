/* Shared capability policy, evaluated before optional effects are loaded. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var compact = window.matchMedia('(max-width: 1024px), (hover: none) and (pointer: coarse)');
  var connection = navigator.connection;
  var webgl;
  var policy = {
    supportsWebGL2: function () {
      if (webgl !== undefined) return webgl;
      try {
        var canvas = document.createElement('canvas');
        var gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true });
        webgl = Boolean(gl);
        if (gl) gl.getExtension('WEBGL_lose_context')?.loseContext();
      } catch (error) { webgl = false; }
      return webgl;
    }
  };
  function sync() {
    policy.reducedMotion = reduced.matches;
    policy.lite = reduced.matches || compact.matches
      || (navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4)
      || (navigator.deviceMemory > 0 && navigator.deviceMemory <= 4)
      || Boolean(connection?.saveData)
      || /^(slow-2g|2g)$/.test(connection?.effectiveType || '');
    document.documentElement.dataset.performance = policy.lite ? 'lite' : 'full';
    window.dispatchEvent(new Event('northwind:performance-change'));
  }
  window.NorthwindPerformance = policy;
  sync();
  [reduced, compact].forEach(function (query) {
    if (query.addEventListener) query.addEventListener('change', sync);
    else query.addListener(sync);
  });
  connection?.addEventListener?.('change', sync);
}());
