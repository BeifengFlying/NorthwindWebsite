/* ============================================================
   PHOTOGRAPHY PAGE SCRIPT
   ============================================================ */

// ========================
// NAV SCROLL BEHAVIOR
// ========================
const nav = document.getElementById('nav');

function updateNav() {
  nav.classList.toggle('scrolled', window.scrollY > 40);
}

let navFrame = 0;
function scheduleNavUpdate() {
  if (navFrame) return;
  navFrame = requestAnimationFrame(() => {
    navFrame = 0;
    updateNav();
  });
}

window.addEventListener('scroll', scheduleNavUpdate, { passive: true });
updateNav();

// ========================
// EXIT ANIMATION (back link)
// ========================
document.querySelector('.nav-back').addEventListener('click', event => {
  event.preventDefault();
  const href = event.currentTarget.getAttribute('href');
  const gallery = document.getElementById('accordionGalleryRoot');

  if (gallery) {
    gallery.style.transition = 'opacity .35s ease, transform .35s ease';
    gallery.style.opacity = '0';
    gallery.style.transform = 'translateY(20px)';
  }

  document.querySelectorAll('.photo-hero-label, .photo-hero-title, .color-line').forEach(element => {
    element.style.transition = 'opacity .3s ease';
    element.style.opacity = '0';
  });

  setTimeout(() => {
    window.location.href = href;
  }, 500);
});
