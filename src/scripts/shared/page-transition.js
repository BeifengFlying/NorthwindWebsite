/* Shared, gesture-aware sound effects for navigation and tactile interactions. */
var NorthwindSound = window.NorthwindSound || (function () {
  'use strict';

  var AudioContextClass = window.AudioContext || window.webkitAudioContext;
  var context;
  var resumePromise;
  var contextPrimed = false;
  var masterGain;
  var muteStorageKey = 'northwind-sound-muted';
  var volumeStorageKey = 'northwind-sound-volume';
  var soundMuted = true;
  var soundVolume = .75;
  var lastWindAt = -Infinity;
  var volumePersistTimer = 0;
  var assetData = Object.create(null);
  var assetDataPromises = Object.create(null);
  var assetBuffers = Object.create(null);
  var assetPromises = Object.create(null);
  var assetUrls = {
    tick: '/assets/audio/wheel-tick.wav?v=sfx-20260731-5',
    wind: '/assets/audio/paper-plane-wind.wav?v=sfx-20260731-5'
  };

  try {
    var storedMuteState = window.localStorage.getItem(muteStorageKey);
    soundMuted = storedMuteState === null ? true : storedMuteState === 'true';
    var storedVolume = Number(window.localStorage.getItem(volumeStorageKey));
    if (Number.isFinite(storedVolume)) soundVolume = Math.min(Math.max(storedVolume, 0), 1);
  }
  catch (error) { /* Sound still works when storage is unavailable. */ }

  function reflectSoundState() {
    var toggle = document.getElementById('soundToggle');
    if (!toggle) return;
    var enabled = !soundMuted;
    var i18n = window.NorthwindI18n;
    var label = enabled ? (i18n ? i18n.t('disable_sound', '关闭声音') : '关闭声音') : (i18n ? i18n.t('enable_sound', '开启声音') : '开启声音');
    toggle.classList.toggle('is-enabled', enabled);
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
    var stateLabel = toggle.querySelector('.sound-toggle__label');
    if (stateLabel) stateLabel.textContent = enabled ? 'ON' : 'OFF';
  }

  function getContext() {
    if (!AudioContextClass) return null;
    if (context && context.state !== 'closed') return context;
    try {
      context = new AudioContextClass({ latencyHint: 'interactive' });
    } catch (error) {
      try { context = new AudioContextClass(); }
      catch (fallbackError) { context = null; }
    }
    if (context && !context._northwindStateListener) {
      masterGain = context.createGain();
      masterGain.gain.value = soundMuted ? 0 : soundVolume;
      masterGain.connect(context.destination);
      context.addEventListener('statechange', reflectSoundState);
      context._northwindStateListener = true;
    }
    return context;
  }

  function outputNode(audioContext) {
    return masterGain || audioContext.destination;
  }

  function setSoundMuted(muted) {
    soundMuted = Boolean(muted);
    try { window.localStorage.setItem(muteStorageKey, String(soundMuted)); }
    catch (error) { /* Keep the in-memory setting in restricted contexts. */ }
    if (masterGain && context && context.state !== 'closed') {
      var now = context.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(soundMuted ? 0 : soundVolume, now);
    }
    reflectSoundState();
  }

  function setVolume(value) {
    soundVolume = Math.min(Math.max(Number(value) || 0, 0), 1);
    window.clearTimeout(volumePersistTimer);
    if (soundVolume > 0 && soundMuted) soundMuted = false;
    if (soundVolume === 0) soundMuted = true;
    if (masterGain && context && context.state !== 'closed') {
      var now = context.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(soundMuted ? 0 : soundVolume, now);
    }
    volumePersistTimer = window.setTimeout(function () {
      try {
        window.localStorage.setItem(volumeStorageKey, String(soundVolume));
        window.localStorage.setItem(muteStorageKey, String(soundMuted));
      } catch (error) { /* Keep the in-memory setting in restricted contexts. */ }
    }, 120);
    reflectSoundState();
  }

  function getVolume() {
    return soundVolume;
  }

  function primeContext(audioContext) {
    if (!audioContext || contextPrimed) return;
    contextPrimed = true;
    try {
      var silentBuffer = audioContext.createBuffer(1, 1, audioContext.sampleRate);
      var silentSource = audioContext.createBufferSource();
      silentSource.buffer = silentBuffer;
      silentSource.connect(audioContext.destination);
      silentSource.start(0);
    } catch (error) { /* Resuming still works when priming is unavailable. */ }
  }

  function unlock() {
    var audioContext = getContext();
    primeContext(audioContext);
    if (!audioContext || audioContext.state === 'running') return Promise.resolve(audioContext);
    if (audioContext.state === 'closed') return Promise.resolve(null);
    if (!resumePromise) {
      resumePromise = audioContext.resume().then(function () {
        resumePromise = null;
        reflectSoundState();
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

  function fetchAssetData(name) {
    if (!assetUrls[name]) return Promise.resolve(null);
    if (assetData[name]) return Promise.resolve(assetData[name]);
    if (assetDataPromises[name]) return assetDataPromises[name];

    assetDataPromises[name] = window.fetch(assetUrls[name], { credentials: 'same-origin' })
      .then(function (response) {
        if (!response.ok) throw new Error('Unable to load sound effect: ' + response.status);
        return response.arrayBuffer();
      })
      .then(function (data) {
        assetData[name] = data;
        assetDataPromises[name] = null;
        return data;
      })
      .catch(function () {
        assetDataPromises[name] = null;
        return null;
      });
    return assetDataPromises[name];
  }

  function loadAsset(name) {
    var audioContext = getContext();
    if (!audioContext || !assetUrls[name]) return Promise.resolve(null);
    if (assetBuffers[name]) return Promise.resolve(assetBuffers[name]);
    if (assetPromises[name]) return assetPromises[name];

    assetPromises[name] = fetchAssetData(name)
      .then(function (data) {
        if (!data) return null;
        return audioContext.decodeAudioData(data.slice(0));
      })
      .then(function (buffer) {
        assetPromises[name] = null;
        if (!buffer) return null;
        assetBuffers[name] = buffer;
        return buffer;
      })
      .catch(function () {
        assetPromises[name] = null;
        return null;
      });
    return assetPromises[name];
  }

  function playAsset(name, volume, maxWait) {
    if (soundMuted) return;
    var requestedAt = performance.now();
    unlock().then(function (audioContext) {
      if (!audioContext || soundMuted) return;
      loadAsset(name).then(function (buffer) {
        if (!buffer || soundMuted || performance.now() - requestedAt > maxWait) return;
        var source = audioContext.createBufferSource();
        var gain = audioContext.createGain();
        source.buffer = buffer;
        gain.gain.value = Math.min(Math.max(volume, 0), 1);
        source.connect(gain);
        gain.connect(outputNode(audioContext));
        source.start(audioContext.currentTime + .004);
      });
    });
  }

  function playTick(volume) {
    var normalizedVolume = volume == null ? .4 : volume;
    playAsset('tick', normalizedVolume * .9, 180);
  }

  function playPageWhoosh(delay) {
    if (soundMuted) return;
    unlock().then(function (audioContext) {
      if (!audioContext || soundMuted) return;
      var start = audioContext.currentTime + Math.max(delay || 0, 0);
      var duration = .44;
      var end = start + duration;
      var noise = createNoise(audioContext, duration);
      var filter = audioContext.createBiquadFilter();
      var noiseGain = audioContext.createGain();
      filter.type = 'bandpass';
      filter.Q.value = .72;
      filter.frequency.setValueAtTime(480, start);
      filter.frequency.exponentialRampToValueAtTime(2800, end);
      noiseGain.gain.setValueAtTime(.0001, start);
      noiseGain.gain.linearRampToValueAtTime(.09, start + .10);
      noiseGain.gain.exponentialRampToValueAtTime(.0001, end);
      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(outputNode(audioContext));
      noise.start(start);
      noise.stop(end);

      var tone = audioContext.createOscillator();
      var toneGain = audioContext.createGain();
      tone.type = 'sine';
      tone.frequency.setValueAtTime(340, start);
      tone.frequency.exponentialRampToValueAtTime(1500, end - .06);
      toneGain.gain.setValueAtTime(.0001, start);
      toneGain.gain.linearRampToValueAtTime(.022, start + .08);
      toneGain.gain.exponentialRampToValueAtTime(.0001, end - .03);
      tone.connect(toneGain);
      toneGain.connect(outputNode(audioContext));
      tone.start(start);
      tone.stop(end);
    });
  }

  function playWind(direction) {
    var requestedAt = performance.now();
    if (requestedAt - lastWindAt < 900) return;
    lastWindAt = requestedAt;
    playAsset('wind', direction < 0 ? .18 : .20, 800);
  }

  function preparePageAssets(decode) {
    var prepare = decode ? loadAsset : fetchAssetData;
    if (document.getElementById('optionWheel')) prepare('tick');
    if (document.getElementById('hero') && document.getElementById('about')) prepare('wind');
  }

  function unlockFromGesture(event) {
    if (event.target && event.target.closest && event.target.closest('#soundToggle')) return;
    if (soundMuted) return;
    unlock().then(function (audioContext) {
      reflectSoundState();
      if (audioContext) preparePageAssets(true);
    });
  }

  function toggleSound() {
    var shouldEnable = soundMuted;
    setSoundMuted(!shouldEnable);
    if (!shouldEnable) return;
    unlock().then(function (audioContext) {
      reflectSoundState();
      if (audioContext) preparePageAssets(true);
    });
  }

  var lastTogglePointerAt = -Infinity;
  document.addEventListener('pointerdown', function (event) {
    if (!event.target || !event.target.closest || !event.target.closest('#soundToggle')) return;
    if (event.isPrimary === false || (typeof event.button === 'number' && event.button !== 0)) return;
    lastTogglePointerAt = performance.now();
    toggleSound();
  }, { capture: true });
  document.addEventListener('click', function (event) {
    if (!event.target || !event.target.closest || !event.target.closest('#soundToggle')) return;
    if (performance.now() - lastTogglePointerAt < 800) return;
    toggleSound();
  });
  document.addEventListener('pointerdown', unlockFromGesture, { capture: true });
  document.addEventListener('touchstart', unlockFromGesture, { capture: true, passive: true });
  document.addEventListener('keydown', unlockFromGesture, { capture: true });
  window.addEventListener('wheel', unlockFromGesture, { capture: true, passive: true });

  function finishSoundBoot() {
    reflectSoundState();
    preparePageAssets(false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', finishSoundBoot);
  else finishSoundBoot();

  return {
    playPageWhoosh: playPageWhoosh,
    playTick: playTick,
    playWind: playWind,
    setVolume: setVolume,
    getVolume: getVolume,
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

/* Session-scoped state shared by the homepage and project detail pages. */
var NorthwindPageState = window.NorthwindPageState || (function () {
  'use strict';

  var craftedWorksKey = 'northwind-crafted-works-state';

  function readCraftedWorks() {
    try {
      var state = JSON.parse(window.sessionStorage.getItem(craftedWorksKey) || 'null');
      if (!state || state.page !== 'crafted-works' || !Number.isFinite(state.scrollY)) return null;
      return state;
    } catch (error) {
      return null;
    }
  }

  function saveCraftedWorks(anchor) {
    if (!anchor || !anchor.classList.contains('project-link')) return;
    var state = {
      page: 'crafted-works',
      pagePath: window.location.pathname,
      scrollY: Math.max(0, Math.round(window.scrollY)),
      project: anchor.dataset.projectId || '',
      href: anchor.getAttribute('href') || '',
      savedAt: Date.now()
    };
    try {
      window.sessionStorage.setItem(craftedWorksKey, JSON.stringify(state));
      // Keep the original keys readable during the migration to structured state.
      window.sessionStorage.setItem('craftedWorksPosition', String(state.scrollY));
      window.sessionStorage.setItem('craftedWorksProject', state.project);
    } catch (error) { /* Navigation remains available when storage is restricted. */ }
  }

  function clearCraftedWorks() {
    try {
      window.sessionStorage.removeItem(craftedWorksKey);
      window.sessionStorage.removeItem('craftedWorksPosition');
      window.sessionStorage.removeItem('craftedWorksProject');
    } catch (error) { /* Treat storage failures as already cleared. */ }
  }

  return {
    clearCraftedWorks: clearCraftedWorks,
    readCraftedWorks: readCraftedWorks,
    saveCraftedWorks: saveCraftedWorks
  };
}());
window.NorthwindPageState = NorthwindPageState;

var initialCraftedWorksState = NorthwindPageState.readCraftedWorks();
var currentPagePath = window.location.pathname;
if (initialCraftedWorksState && (currentPagePath === '/' || /\/index\.html$/i.test(currentPagePath))) {
  document.documentElement.classList.add('is-restoring-crafted-works');
}

/* Full-page geometric wipe for navigation between project pages. */
(function () {
  'use strict';

  var storageKey = 'northwind-page-transition';
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var locked = false;
  var overlay;
  var arriving = false;
  var warmups = Object.create(null);
  var intentWarmupDelay = 70;
  var intentWarmupTimer = 0;
  var intentWarmupAnchor = null;

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

  function getPageUrl(anchor) {
    if (!anchor) return null;
    var url;
    try { url = new URL(anchor.href, window.location.href); }
    catch (error) { return null; }
    if (url.origin !== window.location.origin) return null;
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.pathname.endsWith('/') && !/\.html$/i.test(url.pathname)) return null;
    url.hash = '';
    return url;
  }

  function fetchForNavigation(url) {
    return window.fetch(url, {
      credentials: 'same-origin',
      cache: 'force-cache'
    }).then(function (response) {
      if (!response.ok) throw new Error('Unable to warm page: ' + response.status);
      return response;
    });
  }

  function getCriticalAssets(pageUrl, markup) {
    var parsed = new DOMParser().parseFromString(markup, 'text/html');
    var selectors = [
      'link[rel="preload"][href]',
      'link[rel="stylesheet"][href]',
      'script[src]',
      'img[fetchpriority="high"][src]',
      'img:not([loading="lazy"])[src]'
    ];
    var urls = [];
    parsed.querySelectorAll(selectors.join(',')).forEach(function (node) {
      var source = node.getAttribute('href') || node.getAttribute('src');
      if (!source) return;
      try {
        var assetUrl = new URL(source, pageUrl);
        if (assetUrl.origin !== window.location.origin) return;
        if (urls.indexOf(assetUrl.href) === -1) urls.push(assetUrl.href);
      } catch (error) { /* Invalid optional assets do not block navigation. */ }
    });
    return urls;
  }

  function warmPage(url) {
    var pageUrl = url instanceof URL ? url : new URL(url, window.location.href);
    pageUrl.hash = '';
    var key = pageUrl.href;
    if (warmups[key]) return warmups[key];

    warmups[key] = fetchForNavigation(key)
      .then(function (response) { return response.text(); })
      .then(function (markup) {
        return Promise.all(getCriticalAssets(key, markup).map(function (assetUrl) {
          return fetchForNavigation(assetUrl).catch(function () { return null; });
        }));
      })
      .catch(function () { return null; });
    return warmups[key];
  }

  function prefetchPage(url) {
    var key = url.href;
    var exists = Array.prototype.some.call(document.querySelectorAll('link[data-page-prefetch]'), function (link) {
      return link.getAttribute('data-page-prefetch') === key;
    });
    if (exists) return;
    var link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = key;
    link.setAttribute('data-page-prefetch', key);
    document.head.appendChild(link);
  }

  function scheduleIntentWarmup(anchor, immediate) {
    var url = getPageUrl(anchor);
    if (!url) return;
    if (anchor === intentWarmupAnchor && !immediate) return;
    window.clearTimeout(intentWarmupTimer);
    intentWarmupAnchor = anchor;
    if (immediate) {
      warmPage(url);
      return;
    }
    intentWarmupTimer = window.setTimeout(function () {
      if (intentWarmupAnchor === anchor) warmPage(url);
    }, intentWarmupDelay);
  }

  function onNavigationIntent(event) {
    var anchor = event.target.closest && event.target.closest('a[href]');
    scheduleIntentWarmup(anchor, event.type === 'touchstart' || event.type === 'pointerdown' || event.type === 'focusin');
  }

  function cancelNavigationIntent(event) {
    var anchor = event.target.closest && event.target.closest('a[href]');
    if (!anchor || anchor !== intentWarmupAnchor) return;
    if (event.relatedTarget && anchor.contains(event.relatedTarget)) return;
    window.clearTimeout(intentWarmupTimer);
    intentWarmupAnchor = null;
  }

  function scheduleProjectPrefetch() {
    var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || ''))) return;
    var run = function () {
      if (document.hidden) return;
      document.querySelectorAll('.project-link[href]').forEach(function (anchor) {
        var url = getPageUrl(anchor);
        if (url) prefetchPage(url);
      });
    };
    var afterLoad = function () {
      if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 2500 });
      else window.setTimeout(run, 800);
    };
    if (document.readyState === 'complete') afterLoad();
    else window.addEventListener('load', afterLoad, { once: true });
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
    NorthwindSound.unlock();
    window.setTimeout(function () {
      NorthwindSound.playPageWhoosh(0);
    }, 620);

    try { window.sessionStorage.setItem(storageKey, url); }
    catch (error) { /* Navigation still works when storage is unavailable. */ }

    var pageUrl;
    try { pageUrl = new URL(url, window.location.href); }
    catch (error) { pageUrl = null; }
    var ready = pageUrl ? warmPage(pageUrl) : Promise.resolve();
    window.setTimeout(function () {
      var navigated = false;
      var finish = function () {
        if (navigated) return;
        navigated = true;
        window.location.assign(url);
      };
      ready.then(finish, finish);
      window.setTimeout(finish, 700);
    }, 1080);
  }

  function onClick(event) {
    var anchor = event.target.closest && event.target.closest('a[href]');
    if (!isPageNavigation(anchor, event)) return;

    NorthwindPageState.saveCraftedWorks(anchor);
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
    document.addEventListener('pointerover', onNavigationIntent, true);
    document.addEventListener('pointerdown', onNavigationIntent, true);
    document.addEventListener('focusin', onNavigationIntent, true);
    document.addEventListener('touchstart', onNavigationIntent, { capture: true, passive: true });
    document.addEventListener('pointerout', cancelNavigationIntent, true);
    scheduleProjectPrefetch();

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
