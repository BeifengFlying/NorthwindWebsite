/* BorderGlow: vanilla DOM integration of the React Bits interaction. */
(function () {
  'use strict';

  var palettes = {
    default: { glow: '175 88 70', colors: ['#ff70e8', '#62e8e8', '#4d83ff'] },
    warm: { glow: '28 96 68', colors: ['#ff8a3d', '#ffd84d', '#ff70e8'] },
    acid: { glow: '78 82 68', colors: ['#c9ef54', '#5fe4d0', '#7c9dff'] }
  };

  var positions = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
  var keys = ['--gradient-one', '--gradient-two', '--gradient-three', '--gradient-four', '--gradient-five', '--gradient-six', '--gradient-seven'];
  var colorMap = [0, 1, 2, 0, 1, 2, 1];

  function parseHsl(value) {
    var match = String(value || '').match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
    return match ? { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) } : { h: 175, s: 88, l: 70 };
  }

  function setGlowVars(card) {
    var palette = palettes[card.dataset.borderGlowPalette] || palettes.default;
    var hsl = parseHsl(card.dataset.borderGlowColor || palette.glow);
    var opacities = [100, 60, 50, 40, 30, 20, 10];
    var suffixes = ['', '-60', '-50', '-40', '-30', '-20', '-10'];
    var intensity = Math.min(Math.max(Number(card.dataset.borderGlowIntensity || 1), .1), 3);
    var base = hsl.h + 'deg ' + hsl.s + '% ' + hsl.l + '%';

    opacities.forEach(function (opacity, index) {
      card.style.setProperty('--glow-color' + suffixes[index], 'hsl(' + base + ' / ' + Math.min(opacity * intensity, 100) + '%)');
    });

    palette.colors.forEach(function (color, index) {
      card.style.setProperty('--glow-color-stop-' + index, color);
    });
    keys.forEach(function (key, index) {
      card.style.setProperty(key, 'radial-gradient(at ' + positions[index] + ', ' + palette.colors[Math.min(colorMap[index], palette.colors.length - 1)] + ' 0, transparent 50%)');
    });
    card.style.setProperty('--gradient-base', 'linear-gradient(' + palette.colors[0] + ' 0 100%)');
    card.style.setProperty('--border-radius', card.dataset.borderGlowRadius ? card.dataset.borderGlowRadius + 'px' : (getComputedStyle(card).borderRadius || '20px'));
    card.style.setProperty('--glow-padding', card.dataset.borderGlowGlowRadius || '40px');
    card.style.setProperty('--edge-sensitivity', card.dataset.borderGlowSensitivity || '30');
    card.style.setProperty('--cone-spread', card.dataset.borderGlowCone || '25');
    card.style.setProperty('--fill-opacity', card.dataset.borderGlowFill || '.22');
  }

  function centerOf(element) {
    var rect = element.getBoundingClientRect();
    return [rect.width / 2, rect.height / 2];
  }

  function updateGlow(card, event) {
    var rect = card.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;
    var center = centerOf(card);
    var dx = x - center[0];
    var dy = y - center[1];
    var kx = dx ? center[0] / Math.abs(dx) : Infinity;
    var ky = dy ? center[1] / Math.abs(dy) : Infinity;
    var edge = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1) * 100;
    var angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    card.style.setProperty('--edge-proximity', edge.toFixed(3));
    card.style.setProperty('--cursor-angle', angle.toFixed(3) + 'deg');
  }

  function resetGlow(card) {
    card.style.setProperty('--edge-proximity', '0');
  }

  function initCard(card) {
    if (card.dataset.borderGlowReady === 'true') return;
    card.dataset.borderGlowReady = 'true';
    card.classList.add('border-glow-card');
    setGlowVars(card);

    ['border-glow-mesh', 'border-glow-fill', 'border-glow-edge'].forEach(function (name) {
      var layer = document.createElement('span');
      layer.className = name;
      layer.setAttribute('aria-hidden', 'true');
      card.appendChild(layer);
    });

    card.addEventListener('pointermove', function (event) {
      if (event.pointerType === 'touch') return;
      updateGlow(card, event);
    });
    card.addEventListener('pointerleave', function () {
      resetGlow(card);
    });
    card.addEventListener('pointercancel', function () {
      resetGlow(card);
    });
  }

  function initAll(root) {
    var scope = root && root.querySelectorAll ? root : document;
    if (scope.matches && scope.matches('[data-border-glow]')) initCard(scope);
    scope.querySelectorAll('[data-border-glow]').forEach(initCard);
  }

  function boot() {
    initAll(document);
    var observer = new MutationObserver(function (records) {
      records.forEach(function (record) {
        record.addedNodes.forEach(function (node) {
          if (node.nodeType === 1) initAll(node);
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());
