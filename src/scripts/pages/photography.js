/* ============================================================
   PHOTOGRAPHY PAGE SCRIPT
   ============================================================ */

// Photo data - public renditions contain no EXIF or location metadata.
const photos = [
  {
    id: '1785261471105',
    title: '静谧时分',
    date: '2025',
    location: '昆明',
    w: 3072, h: 4096,
  },
  {
    id: '1785261471174',
    title: '光影之间',
    date: '2025',
    location: '昆明',
    w: 2721, h: 3642,
  },
  {
    id: '1785261471244',
    title: '远山',
    date: '2025',
    location: '乌鲁木齐',
    w: 4096, h: 1500,
  },
  {
    id: '1785261471285',
    title: '日常切片',
    date: '2025',
    location: '乌鲁木齐',
    w: 4096, h: 3072,
  },
  {
    id: '1785261471324',
    title: '暮色',
    date: '2025',
    location: '昆明',
    w: 2321, h: 3036,
  },
  {
    id: '1785261471385',
    title: '辽阔',
    date: '2025',
    location: '乌鲁木齐',
    w: 3794, h: 2132,
  },
];

const photoSource = (id, width) => `assets/images/photography/${id}-${width}.webp`;

// Random vertical offsets for each photo (magazine feel)
const offsets = photos.map((_, i) => {
  // Deterministic-ish from index, range -24px to +36px
  const seed = (i * 17 + 3) % 60;
  return seed - 24;
});

// ========================
// BUILD GALLERY
// ========================
const gallery = document.getElementById('gallery');

photos.forEach((p, i) => {
  const item = document.createElement('div');
  item.className = 'photo-item';
  item.style.setProperty('--offset', offsets[i] + 'px');
  item.dataset.index = i;

  item.innerHTML = `
    <div class="photo-card" data-index="${String(i + 1).padStart(2, '0')}">
      <img
        src="${photoSource(p.id, 640)}"
        srcset="${photoSource(p.id, 640)} 640w, ${photoSource(p.id, 1280)} 1280w"
        sizes="(max-width: 700px) 100vw, 50vw"
        width="${p.w}"
        height="${p.h}"
        alt="${p.title}"
        loading="lazy"
        decoding="async"
      >
      <div class="photo-info">
        <div class="photo-info-title">${p.title}</div>
        <div class="photo-info-meta">
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            ${p.date}
          </span>
          <span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${p.location}
          </span>
        </div>
      </div>
    </div>
  `;

  // Click → lightbox
  item.querySelector('.photo-card').addEventListener('click', () => openLightbox(i));

  gallery.appendChild(item);
});

// ========================
// SCROLL REVEAL (IntersectionObserver)
// ========================
const photoItems = document.querySelectorAll('.photo-item');
const observerOptions = { threshold: 0.15, rootMargin: '0px 0px -40px 0px' };

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

photoItems.forEach(item => revealObserver.observe(item));

// ========================
// LIGHTBOX
// ========================
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightboxImg');
const lightboxCaption = document.getElementById('lightboxCaption');
const lightboxCounter = document.getElementById('lightboxCounter');
let currentIndex = 0;

function openLightbox(index) {
  currentIndex = index;
  renderLightbox();
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function renderLightbox() {
  const p = photos[currentIndex];
  lightboxImg.src = photoSource(p.id, 1920);
  lightboxImg.alt = p.title;
  lightboxCaption.innerHTML = `
    <div class="photo-info-title">${p.title}</div>
    <div class="photo-info-meta">
      <span>${p.date}</span>
      <span>${p.location}</span>
    </div>
  `;
  lightboxCounter.textContent = `${currentIndex + 1} / ${photos.length}`;
}

function nextPhoto() {
  currentIndex = (currentIndex + 1) % photos.length;
  renderLightbox();
}

function prevPhoto() {
  currentIndex = (currentIndex - 1 + photos.length) % photos.length;
  renderLightbox();
}

// Events
document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
document.querySelector('.lightbox-bg').addEventListener('click', closeLightbox);
document.getElementById('lightboxPrev').addEventListener('click', prevPhoto);
document.getElementById('lightboxNext').addEventListener('click', nextPhoto);

// Keyboard
document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') nextPhoto();
  if (e.key === 'ArrowLeft') prevPhoto();
});

// ========================
// NAV SCROLL BEHAVIOR
// ========================
const nav = document.getElementById('nav');
let lastScrollY = 0;

function updateNav() {
  const y = window.scrollY;
  if (y > 40) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
  lastScrollY = y;
  requestAnimationFrame(updateNav);
}
requestAnimationFrame(updateNav);

// ========================
// PAGE ENTER ANIMATION
// ========================
document.addEventListener('DOMContentLoaded', () => {
  // Hero text fades in
  const heroEls = document.querySelectorAll(' .photo-hero-label, .photo-hero-title, .color-line');
  heroEls.forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity .8s ease, transform .8s ease';
    el.style.transitionDelay = (i * 0.1 + 0.1) + 's';
    requestAnimationFrame(() => {
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
  });
});

// ========================
// EXIT ANIMATION (back link)
// ========================
document.querySelector('.nav-back').addEventListener('click', (e) => {
  e.preventDefault();
  const href = e.currentTarget.getAttribute('href');

  // Fade out all photo items
  photoItems.forEach((item, i) => {
    item.style.transition = 'opacity .35s ease, transform .35s ease';
    item.style.transitionDelay = (i * 0.04) + 's';
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';
  });

  // Fade hero
  document.querySelectorAll(' .photo-hero-label, .photo-hero-title, .color-line').forEach(el => {
    el.style.transition = 'opacity .3s ease';
    el.style.opacity = '0';
  });

  // Navigate after animation
  setTimeout(() => { window.location.href = href; }, 500);
});
