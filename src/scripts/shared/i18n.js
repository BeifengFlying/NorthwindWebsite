/* Shared language state and lightweight DOM localization for every page. */
(function () {
  'use strict';

  var storageKey = 'northwind-locale';
  var locale = 'zh';
  var dictionaries = { zh: null, en: null };
  var readyResolve;
  var ready = new Promise(function (resolve) { readyResolve = resolve; });
  var observer;

  try {
    var queryLocale = new URLSearchParams(window.location.search).get('lang');
    var storedLocale = window.localStorage.getItem(storageKey);
    locale = queryLocale === 'en' || queryLocale === 'zh' ? queryLocale : storedLocale === 'en' ? 'en' : 'zh';
  } catch (error) { locale = 'zh'; }

  function sourceText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function textMap() {
    return dictionaries.en && dictionaries.en.text ? dictionaries.en.text : {};
  }

  function translateValue(value) {
    var clean = sourceText(value);
    if (!clean || locale === 'zh') return value;
    var map = textMap();
    return Object.prototype.hasOwnProperty.call(map, clean) ? map[clean] : value;
  }

  function translateAttributes(element) {
    ['aria-label', 'title', 'placeholder', 'alt'].forEach(function (attribute) {
      if (!element.hasAttribute(attribute)) return;
      var original = element.getAttribute('data-i18n-' + attribute) || element.getAttribute(attribute);
      if (!element.hasAttribute('data-i18n-' + attribute)) element.setAttribute('data-i18n-' + attribute, original);
      element.setAttribute(attribute, translateValue(original));
    });
  }

  function translateTextNode(node) {
    var parent = node.parentElement;
    if (!parent || parent.closest('script, style, svg')) return;
    if (parent.closest('[data-i18n]')) return;
    if (parent.closest('.music-song-name, .music-song-artist, .music-song-album, .option-wheel')) return;
    var original = node.nodeValue;
    var clean = sourceText(original);
    if (!clean) return;
    if (!node._northwindSource) node._northwindSource = original;
    var source = node._northwindSource;
    var translated = translateValue(source);
    if (translated === source && locale === 'en') {
      Object.keys(textMap()).sort(function (a, b) { return b.length - a.length; }).some(function (key) {
        if (!key || !source.includes(key)) return false;
        translated = translated.split(key).join(textMap()[key]);
        return false;
      });
    }
    if (translated !== source) node.nodeValue = original.replace(sourceText(original), translated);
    else if (locale === 'zh') node.nodeValue = source;
  }

  function apply(root) {
    var scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach(function (element) {
      var key = element.getAttribute('data-i18n');
      var dictionary = dictionaries[locale] && dictionaries[locale].strings;
      if (dictionary && Object.prototype.hasOwnProperty.call(dictionary, key)) element.textContent = dictionary[key];
    });
    scope.querySelectorAll('*').forEach(translateAttributes);
    var walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
    var node;
    while ((node = walker.nextNode())) translateTextNode(node);
    updateSwitches();
  }

  function switchMarkup() {
    return '<div class="language-switch" role="group" aria-label="Language"><button type="button" data-locale="zh" aria-label="中文">ZH</button><span aria-hidden="true">|</span><button type="button" data-locale="en" aria-label="English">EN</button></div>';
  }

  function installSwitches() {
    document.querySelectorAll('.nav, .journey-nav, .workflow-nav, .solutions-nav, .lab-nav, .error-nav').forEach(function (nav) {
      if (nav.querySelector('.language-switch')) return;
      var wrapper = document.createElement('div');
      wrapper.innerHTML = switchMarkup();
      var switcher = wrapper.firstElementChild;
      var toggle = nav.querySelector('.nav-toggle');
      var rightGroup = nav.querySelector('.journey-nav-right, .workflow-nav-right');
      var back = nav.querySelector('.nav-back, .journey-back, .workflow-back');
      if (toggle) {
        nav.insertBefore(switcher, toggle);
      } else if (rightGroup) {
        rightGroup.insertBefore(switcher, back || rightGroup.firstChild);
      } else if (back) {
        var actions = document.createElement('div');
        actions.className = 'nav-actions';
        nav.insertBefore(actions, back);
        actions.appendChild(switcher);
        actions.appendChild(back);
      } else {
        nav.appendChild(switcher);
      }
      switcher.addEventListener('click', function (event) {
        var button = event.target.closest('[data-locale]');
        if (button) setLocale(button.getAttribute('data-locale'));
      });
    });
    updateSwitches();
  }

  function updateSwitches() {
    document.querySelectorAll('.language-switch').forEach(function (switcher) {
      switcher.querySelectorAll('[data-locale]').forEach(function (button) {
        var active = button.getAttribute('data-locale') === locale;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    });
  }

  function setLocale(nextLocale) {
    if (nextLocale !== 'en' && nextLocale !== 'zh') return;
    locale = nextLocale;
    try { window.localStorage.setItem(storageKey, locale); } catch (error) { /* Ignore restricted storage. */ }
    document.documentElement.lang = locale === 'en' ? 'en' : 'zh-CN';
    document.body.classList.add('language-switching');
    window.setTimeout(function () {
      apply(document);
      document.body.classList.remove('language-switching');
    }, 180);
  }

  function t(key, fallback) {
    var dictionary = dictionaries[locale] && dictionaries[locale].strings;
    return dictionary && dictionary[key] != null ? dictionary[key] : (fallback == null ? key : fallback);
  }

  window.NorthwindI18n = { ready: ready, apply: apply, setLocale: setLocale, t: t, getLocale: function () { return locale; } };

  installSwitches();
  Promise.all([
    fetch('assets/locales/zh.json').then(function (response) { return response.json(); }),
    fetch('assets/locales/en.json').then(function (response) { return response.json(); })
  ]).then(function (loaded) {
    dictionaries.zh = loaded[0];
    dictionaries.en = loaded[1];
    document.documentElement.lang = locale === 'en' ? 'en' : 'zh-CN';
    apply(document);
    readyResolve();
  }).catch(function () { readyResolve(); });

  observer = new MutationObserver(function (records) {
    if (!dictionaries.en) return;
    records.forEach(function (record) {
      record.addedNodes.forEach(function (node) {
        if (node.nodeType === 1) apply(node);
        else if (node.nodeType === 3) translateTextNode(node);
      });
    });
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}());
