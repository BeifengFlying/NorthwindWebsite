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

    function render() {
      frame = 0;
      var now = performance.now();
      var scroll = window.scrollY;
      var elapsed = Math.max(now - previousTime, 16);
      var velocity = (scroll - previousScroll) / elapsed;
      var speed = clamp(Math.abs(velocity) / 2.4, 0, 1);
      var travelEnd = about.offsetTop + Math.min(about.offsetHeight * .26, window.innerHeight * .28);
      var progress = clamp(scroll / Math.max(travelEnd, 1), 0, 1);
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
  var audioContext;

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

  function playWhoosh() {
    var AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    try {
      if (!audioContext) audioContext = new AudioContext();

      var renderSound = function () {
        var start = audioContext.currentTime + .01;
        var duration = .42;
        var end = start + duration;
        var buffer = audioContext.createBuffer(1, Math.ceil(audioContext.sampleRate * duration), audioContext.sampleRate);
        var samples = buffer.getChannelData(0);

        for (var i = 0; i < samples.length; i += 1) {
          var envelope = Math.sin(Math.PI * i / samples.length);
          samples[i] = (Math.random() * 2 - 1) * envelope;
        }

        var noise = audioContext.createBufferSource();
        var filter = audioContext.createBiquadFilter();
        var noiseGain = audioContext.createGain();
        noise.buffer = buffer;
        filter.type = 'bandpass';
        filter.Q.value = .72;
        filter.frequency.setValueAtTime(520, start);
        filter.frequency.exponentialRampToValueAtTime(2600, end);
        noiseGain.gain.setValueAtTime(.0001, start);
        noiseGain.gain.linearRampToValueAtTime(.085, start + .07);
        noiseGain.gain.exponentialRampToValueAtTime(.0001, end);
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(audioContext.destination);

        var tone = audioContext.createOscillator();
        var toneGain = audioContext.createGain();
        tone.type = 'sine';
        tone.frequency.setValueAtTime(380, start);
        tone.frequency.exponentialRampToValueAtTime(1650, end - .04);
        toneGain.gain.setValueAtTime(.0001, start);
        toneGain.gain.linearRampToValueAtTime(.025, start + .045);
        toneGain.gain.exponentialRampToValueAtTime(.0001, end - .03);
        tone.connect(toneGain);
        toneGain.connect(audioContext.destination);

        noise.start(start);
        noise.stop(end);
        tone.start(start);
        tone.stop(end);
      };

      if (audioContext.state === 'suspended') audioContext.resume().then(renderSound).catch(function () {});
      else renderSound();
    } catch (error) { /* Audio is optional when a browser blocks Web Audio. */ }
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
    playWhoosh();
    document.documentElement.classList.add('page-transition-active');
    overlay.className = 'page-wipe is-covering';

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
