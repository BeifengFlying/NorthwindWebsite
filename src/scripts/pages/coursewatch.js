(() => {
  'use strict';

  const views = {
    courses: {
      image: 'courses.webp',
      key: 'cw_caption_courses',
      caption: '只同步你选择的课程，移除后也可以重新添加。',
      alt: '课程管理界面，展示模拟课程选择',
    },
    schedules: {
      image: 'schedules.webp',
      key: 'cw_caption_schedules',
      caption: '备注、星标、多个提前提醒，个人日程无需课程账号。',
      alt: '个人日程界面，展示模拟日程和提醒',
    },
    notifications: {
      image: 'notifications.webp',
      key: 'cw_caption_notifications',
      caption: '按需配置邮件、网页推送与 iCloud 日历，查看各渠道设置。',
      alt: '手机通知设置界面，展示通知渠道配置',
    },
  };
  const viewImage = document.getElementById('cwViewImage');
  const viewLink = document.getElementById('cwViewLink');
  const caption = document.getElementById('cwViewCaption');
  const controls = [...document.querySelectorAll('[data-view]')];
  const translate = (key, fallback) => window.NorthwindI18n?.t(key, fallback) ?? fallback;

  controls.forEach((button) => {
    button.addEventListener('click', () => {
      const view = views[button.dataset.view];
      if (!view || button.getAttribute('aria-pressed') === 'true') return;
      controls.forEach((control) => {
        const active = control === button;
        control.setAttribute('aria-pressed', String(active));
        control.classList.toggle('is-active', active);
      });
      const source = `assets/images/coursewatch/${view.image}`;
      viewImage.src = source;
      viewImage.dataset.i18nAlt = view.alt;
      viewImage.alt = translate(view.alt, view.alt);
      viewLink.href = source;
      caption.dataset.i18n = view.key;
      caption.textContent = translate(view.key, view.caption);
    });
  });

  const lightbox = document.getElementById('cwLightbox');
  const enlargedImage = lightbox.querySelector('img');
  let previousOverflow = '';
  let imageTrigger;
  document.querySelectorAll('[data-lightbox]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
        return;
      if (typeof lightbox.showModal !== 'function') return;
      event.preventDefault();
      imageTrigger = link;
      enlargedImage.src = link.href;
      enlargedImage.alt = link.querySelector('img').alt;
      previousOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      lightbox.showModal();
    });
  });
  lightbox.querySelector('button').addEventListener('click', () => lightbox.close());
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) lightbox.close();
  });
  lightbox.addEventListener('close', () => {
    document.documentElement.style.overflow = previousOverflow;
    imageTrigger?.focus({ preventScroll: true });
  });

  // Include prereleases: the project's current desktop builds are still in beta.
  const installerPatterns = {
    'mac-arm64': /^CourseWatch-.+-mac-arm64\.dmg$/i,
    'mac-x64': /^CourseWatch-.+-mac-x64\.dmg$/i,
    'win-setup': /^CourseWatch-.+-win-x64-setup\.exe$/i,
    'win-zip': /^CourseWatch-.+-win-x64\.zip$/i,
  };
  const releaseBase = 'https://github.com/BeifengFlying/CourseWatch/releases/';
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 5000);

  fetch('https://api.github.com/repos/BeifengFlying/CourseWatch/releases?per_page=20', {
    signal: controller.signal,
    headers: { Accept: 'application/vnd.github+json' },
  })
    .then((response) => {
      if (!response.ok) throw new Error('Release information unavailable');
      return response.json();
    })
    .then((data) => {
      if (!Array.isArray(data)) return;
      const releases = data
        .filter((release) => release && !release.draft && Array.isArray(release.assets))
        .sort((a, b) => Date.parse(b.published_at || '') - Date.parse(a.published_at || ''));
      let releaseNotes;
      for (const link of document.querySelectorAll('[data-cw-download]')) {
        const pattern = installerPatterns[link.dataset.cwDownload];
        if (!pattern) continue;
        for (const release of releases) {
          const asset = release.assets.find(
            (item) =>
              item &&
              pattern.test(item.name) &&
              typeof item.browser_download_url === 'string' &&
              item.browser_download_url.startsWith(`${releaseBase}download/`),
          );
          if (!asset) continue;
          link.href = asset.browser_download_url;
          if (!releaseNotes || releases.indexOf(release) < releases.indexOf(releaseNotes)) {
            releaseNotes = release;
          }
          break;
        }
      }
      if (releaseNotes?.html_url?.startsWith(`${releaseBase}tag/`)) {
        document.querySelector('[data-cw-release]').href = releaseNotes.html_url;
      }
    })
    .catch(() => {
      // The releases list remains usable if GitHub is unreachable or rate limited.
    })
    .finally(() => window.clearTimeout(timeout));
})();
