/* Shared, gesture-aware sound effects for navigation and tactile interactions. */
var NorthwindSound = window.NorthwindSound || (function () {
  'use strict';

  var AudioContextClass = window.AudioContext || window.webkitAudioContext;
  var context;
  var resumePromise;
  var lastWindAt = -Infinity;

  function getContext() {
    if (!AudioContextClass) return null;
    if (context && context.state !== 'closed') return context;
    try {
      context = new AudioContextClass({ latencyHint: 'interactive' });
    } catch (error) {
      try { context = new AudioContextClass(); }
      catch (fallbackError) { context = null; }
    }
    return context;
  }

  function unlock() {
    var audioContext = getContext();
    if (!audioContext || audioContext.state === 'running') return Promise.resolve(audioContext);
    if (audioContext.state === 'closed') return Promise.resolve(null);
    if (!resumePromise) {
      resumePromise = audioContext.resume().then(function () {
        resumePromise = null;
        return audioContext;
      }).catch(function () {
        resumePromise = null;
        return null;
      });
    }
    return resumePromise;
  }

  function createNoise(audioContext, duration) {
    var buffer = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * duration), audioContext.sampleRate);
    var samples = buffer.getChannelData(0);
    var previous = 0;
    for (var i = 0; i < samples.length; i += 1) {
      var white = Math.random() * 2 - 1;
      previous = previous * .68 + white * .32;
      samples[i] = previous;
    }
    var source = audioContext.createBufferSource();
    source.buffer = buffer;
    return source;
  }

  function playTick(volume) {
    var requestedAt = performance.now();
    unlock().then(function (audioContext) {
      if (!audioContext || performance.now() - requestedAt > 120) return;
      var start = audioContext.currentTime + .004;
      var end = start + .052;
      var oscillator = audioContext.createOscillator();
      var gain = audioContext.createGain();
      var normalizedVolume = volume == null ? .4 : volume;
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(1850, start);
      oscillator.frequency.exponentialRampToValueAtTime(720, end);
      gain.gain.setValueAtTime(Math.min(Math.max(normalizedVolume, 0), 1) * .11, start);
      gain.gain.exponentialRampToValueAtTime(.0001, end);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(end);
    });
  }

  function playPageWhoosh(delay) {
    unlock().then(function (audioContext) {
      if (!audioContext) return;
      var start = audioContext.currentTime + Math.max(delay || 0, 0);
      var duration = .64;
      var end = start + duration;
      var noise = createNoise(audioContext, duration);
      var filter = audioContext.createBiquadFilter();
      var noiseGain = audioContext.createGain();
      filter.type = 'bandpass';
      filter.Q.value = .72;
      filter.frequency.setValueAtTime(480, start);
      filter.frequency.exponentialRampToValueAtTime(2800, end);
      noiseGain.gain.setValueAtTime(.0001, start);
      noiseGain.gain.linearRampToValueAtTime(.09, start + .16);
      noiseGain.gain.exponentialRampToValueAtTime(.0001, end);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(audioContext.destination);
      noise.start(start);
      noise.stop(end);

      var tone = audioContext.createOscillator();
      var toneGain = audioContext.createGain();
      tone.type = 'sine';
      tone.frequency.setValueAtTime(340, start);
      tone.frequency.exponentialRampToValueAtTime(1500, end - .06);
      toneGain.gain.setValueAtTime(.0001, start);
      toneGain.gain.linearRampToValueAtTime(.022, start + .12);
      toneGain.gain.exponentialRampToValueAtTime(.0001, end - .03);
      tone.connect(toneGain);
      toneGain.connect(audioContext.destination);
      tone.start(start);
      tone.stop(end);
    });
  }

  function playWind(direction) {
    var requestedAt = performance.now();
    if (requestedAt - lastWindAt < 900) return;
    lastWindAt = requestedAt;
    unlock().then(function (audioContext) {
      if (!audioContext || performance.now() - requestedAt > 180) return;
      var start = audioContext.currentTime + .02;
      var duration = 1.18;
      var end = start + duration;
      var noise = createNoise(audioContext, duration);
      var filter = audioContext.createBiquadFilter();
      var gain = audioContext.createGain();
      var panner = audioContext.createStereoPanner ? audioContext.createStereoPanner() : null;
      filter.type = 'bandpass';
      filter.Q.value = .48;
      filter.frequency.setValueAtTime(340, start);
      filter.frequency.exponentialRampToValueAtTime(1250, start + .42);
      filter.frequency.exponentialRampToValueAtTime(430, end);
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.linearRampToValueAtTime(.115, start + .22);
      gain.gain.exponentialRampToValueAtTime(.0001, end);
      noise.connect(filter);
      filter.connect(gain);
      if (panner) {
        var from = direction < 0 ? .65 : -.65;
        panner.pan.setValueAtTime(from, start);
        panner.pan.linearRampToValueAtTime(-from, end);
        gain.connect(panner);
        panner.connect(audioContext.destination);
      } else {
        gain.connect(audioContext.destination);
      }
      noise.start(start);
      noise.stop(end);
    });
  }

  document.addEventListener('pointerdown', unlock, { capture: true });
  document.addEventListener('touchstart', unlock, { capture: true, passive: true });
  document.addEventListener('keydown', unlock, { capture: true });
  window.addEventListener('wheel', unlock, { capture: true, passive: true });

  return {
    playPageWhoosh: playPageWhoosh,
    playTick: playTick,
    playWind: playWind,
    unlock: unlock
  };
}());
window.NorthwindSound = NorthwindSound;

/* Reversible, scroll-driven paper-plane passage from the hero into About. */
(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var frame;
  var previousScroll = window.scrollY;
  var previousTime = performance.now();

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function easeInOut(value) {
    return value * value * (3 - 2 * value);
  }

  function planeMarkup(id) {
    return '<div class="paper-plane-wobble">' +
      '<svg class="paper-plane-model" viewBox="110 38 500 325" role="presentation">' +
      '<defs>' +
        '<linearGradient id="plane-upper-' + id + '" x1="125" y1="51" x2="595" y2="184" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#dce5d8"></stop><stop offset="1" stop-color="#c7dcda"></stop></linearGradient>' +
        '<linearGradient id="plane-center-' + id + '" x1="125" y1="51" x2="483" y2="245" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#d6dfd2"></stop><stop offset="1" stop-color="#bcd4cf"></stop></linearGradient>' +
        '<linearGradient id="plane-lower-' + id + '" x1="125" y1="51" x2="345" y2="330" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#e5d8cf"></stop><stop offset="1" stop-color="#d5e0d5"></stop></linearGradient>' +
      '</defs>' +
      '<path class="plane-reference-lower" d="M125 51 L421 272 L286 349 Z" fill="url(#plane-lower-' + id + ')"></path>' +
      '<path class="plane-reference-upper" d="M125 51 L589 152 L595 184 L483 245 Z" fill="url(#plane-upper-' + id + ')"></path>' +
      '<path class="plane-reference-center" d="M125 51 L483 245 L421 272 Z" fill="url(#plane-center-' + id + ')"></path>' +
      '<path class="plane-reference-tail" d="M483 245 L483 338 L421 272 Z"></path>' +
      '<path class="plane-reference-outline" d="M125 51 L589 152 L595 184 L483 245 L483 338 L421 272 L286 349 Z M125 51 L483 245 M125 51 L421 272"></path>' +
      '</svg>' +
      '</div>';
  }

  function createPassage() {
    var overlay = document.createElement('div');
    overlay.className = 'paper-plane-transition';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML =
      '<div class="paper-plane-flight paper-plane-flight--large">' + planeMarkup('large') + '</div>' +
      '<div class="paper-plane-flight paper-plane-flight--small">' + planeMarkup('small') + '</div>' +
      '<div class="wind-group wind-group--large">' +
        '<span class="wind-line wind-line--a"><i></i></span><span class="wind-line wind-line--b"><i></i></span><span class="wind-line wind-line--c"><i></i></span><span class="wind-line wind-line--d"><i></i></span><span class="wind-line wind-line--e"><i></i></span>' +
      '</div>' +
      '<div class="wind-group wind-group--small">' +
        '<span class="wind-line wind-line--a"><i></i></span><span class="wind-line wind-line--b"><i></i></span><span class="wind-line wind-line--c"><i></i></span><span class="wind-line wind-line--d"><i></i></span><span class="wind-line wind-line--e"><i></i></span>' +
      '</div>';
    document.body.appendChild(overlay);

    return {
      large: overlay.querySelector('.paper-plane-flight--large'),
      small: overlay.querySelector('.paper-plane-flight--small'),
      largeWind: overlay.querySelector('.wind-group--large'),
      smallWind: overlay.querySelector('.wind-group--small')
    };
  }

  function setFlight(element, x, y, rotation, scale, opacity) {
    element.style.opacity = opacity.toFixed(3);
    element.style.transform = 'translate3d(' + x.toFixed(2) + 'vw, ' + y.toFixed(2) + 'vh, 0) rotate(' + rotation.toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
  }

  function setWind(group, x, y, rotation, opacity, speed) {
    group.style.opacity = opacity.toFixed(3);
    group.style.transform = 'translate3d(' + x.toFixed(2) + 'vw, ' + y.toFixed(2) + 'vh, 0) rotate(' + rotation.toFixed(2) + 'deg)';
    group.style.setProperty('--wind-duration', (2.6 - speed * 1.55).toFixed(2) + 's');
    group.style.setProperty('--wind-stretch', (1 + speed * .72).toFixed(3));
  }

  function boot() {
    if (reducedMotion) return;

    var hero = document.getElementById('hero');
    var about = document.getElementById('about');
    if (!hero || !about) return;

    var passage = createPassage();
    var passageActive;

    function render() {
      frame = 0;
      var now = performance.now();
      var scroll = window.scrollY;
      var elapsed = Math.max(now - previousTime, 16);
      var velocity = (scroll - previousScroll) / elapsed;
      var speed = clamp(Math.abs(velocity) / 2.4, 0, 1);
      var travelEnd = about.offsetTop + Math.min(about.offsetHeight * .26, window.innerHeight * .28);
      var progress = clamp(scroll / Math.max(travelEnd, 1), 0, 1);
      var isPassageActive = progress > .025 && progress < .975;
      var largeProgress = easeInOut(progress);
      var smallRaw = clamp((progress - .08) / .86, 0, 1);
      var smallProgress = easeInOut(smallRaw);
      var largePresence = clamp(Math.min(progress / .055, (1 - progress) / .08), 0, 1);
      var smallPresence = clamp(Math.min(smallRaw / .07, (1 - smallRaw) / .10), 0, 1);
      var largeX = -48 + largeProgress * 166;
      var largeY = 72 - largeProgress * 111;
      var smallX = 51 - smallProgress * 107;
      var smallY = 91 - smallProgress * 112;

      setFlight(
        passage.large,
        largeX,
        largeY,
        -3 - largeProgress * 3 + clamp(velocity * .42, -1.1, 1.1),
        .90 + largeProgress * .08 + speed * .025,
        largePresence
      );
      setFlight(
        passage.small,
        smallX,
        smallY,
        1 + smallProgress * 3 + clamp(velocity * .32, -.8, .8),
        .84 + smallProgress * .06 + speed * .02,
        smallPresence
      );

      setWind(
        passage.largeWind,
        largeX - 3,
        largeY + 25,
        -34,
        largePresence * (.44 + speed * .38),
        speed
      );
      setWind(
        passage.smallWind,
        smallX + 17,
        smallY + 18,
        -132,
        smallPresence * (.36 + speed * .32),
        speed * .82
      );

      if (passageActive === false && isPassageActive && Math.abs(scroll - previousScroll) > .5) {
        NorthwindSound.playWind(velocity < 0 ? -1 : 1);
      }
      passageActive = isPassageActive;

      previousScroll = scroll;
      previousTime = now;
    }

    function schedule() {
      if (!frame) frame = window.requestAnimationFrame(render);
    }

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
}());

/* Full-page geometric wipe for navigation between project pages. */
(function () {
  'use strict';

  var storageKey = 'northwind-page-transition';
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var locked = false;
  var overlay;
  var arriving = false;

  try { arriving = Boolean(window.sessionStorage.getItem(storageKey)); }
  catch (error) { /* Storage can be unavailable in privacy-restricted contexts. */ }
  try {
    var navigationEntry = window.performance.getEntriesByType('navigation')[0];
    arriving = arriving || (navigationEntry && navigationEntry.type === 'back_forward');
  } catch (error) { /* Older browsers still receive the pageshow fallback below. */ }
  if (arriving && !reducedMotion) document.documentElement.classList.add('page-transition-pending');

  function createOverlay() {
    overlay = document.createElement('div');
    overlay.className = 'page-wipe';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML =
      '<div class="page-wipe__field"></div>' +
      '<div class="page-wipe__band"></div>'.repeat(10) +
      '<div class="page-wipe__puzzle"></div>' +
      '<div class="page-wipe__spark"></div>';
    document.body.appendChild(overlay);
  }

  function isPageNavigation(anchor, event) {
    if (!anchor || event.defaultPrevented || event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
    if (anchor.target && anchor.target !== '_self') return false;
    if (anchor.hasAttribute('download')) return false;

    var url;
    try { url = new URL(anchor.href, window.location.href); }
    catch (error) { return false; }

    if (url.origin !== window.location.origin) return false;
    if (url.protocol !== 'http:' && url.protocol !== 'https:' && url.protocol !== 'file:') return false;

    var current = new URL(window.location.href);
    var sameDocument = url.pathname === current.pathname && url.search === current.search;
    if (sameDocument) return false;
    return url.pathname.endsWith('/') || /\.html$/i.test(url.pathname);
  }

  function reveal() {
    if (!overlay || reducedMotion) return;
    locked = true;
    document.documentElement.classList.add('page-transition-active');
    overlay.className = 'page-wipe is-revealing';
    document.documentElement.classList.remove('page-transition-pending');

    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        overlay.classList.add('is-leaving');
      });
    });

    window.setTimeout(function () {
      overlay.className = 'page-wipe';
      document.documentElement.classList.remove('page-transition-active');
      locked = false;
    }, 980);
  }

  function navigate(url) {
    locked = true;
    document.documentElement.classList.add('page-transition-active');
    overlay.className = 'page-wipe is-covering';
    NorthwindSound.playPageWhoosh(.14);

    try { window.sessionStorage.setItem(storageKey, url); }
    catch (error) { /* Navigation still works when storage is unavailable. */ }

    window.setTimeout(function () {
      window.location.assign(url);
    }, 1080);
  }

  function onClick(event) {
    var anchor = event.target.closest && event.target.closest('a[href]');
    if (!isPageNavigation(anchor, event)) return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (locked) return;

    if (reducedMotion) {
      window.location.assign(anchor.href);
      return;
    }

    navigate(anchor.href);
  }

  function bootNavigation() {
    createOverlay();
    document.addEventListener('click', onClick, true);

    var shouldReveal = arriving;
    try {
      window.sessionStorage.removeItem(storageKey);
    } catch (error) { /* Treat storage failures as a normal page load. */ }

    if (shouldReveal) reveal();

    window.addEventListener('pageshow', function (event) {
      if (event.persisted || overlay.classList.contains('is-covering')) reveal();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootNavigation);
  else bootNavigation();
}());
