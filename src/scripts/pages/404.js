(function () {
  var page = document.querySelector('.error-page');
  var stage = document.querySelector('.error-stage');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!page || !stage) return;

  if (!reducedMotion) {
    var targetX = 0;
    var targetY = 0;
    var currentX = 0;
    var currentY = 0;

    window.addEventListener('pointermove', function (event) {
      targetX = (event.clientX / window.innerWidth - .5) * 2;
      targetY = (event.clientY / window.innerHeight - .5) * 2;
    }, { passive: true });

    function moveStage() {
      currentX += (targetX - currentX) * .06;
      currentY += (targetY - currentY) * .06;
      stage.style.setProperty('--pointer-x', (currentX * 9).toFixed(2) + 'px');
      stage.style.setProperty('--pointer-y', (currentY * 6).toFixed(2) + 'px');
      window.requestAnimationFrame(moveStage);
    }

    moveStage();
  }

  document.querySelectorAll('[data-transition]').forEach(function (link) {
    link.addEventListener('click', function (event) {
      if (reducedMotion || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      var destination = link.getAttribute('href');
      if (!destination || link.target === '_blank') return;

      event.preventDefault();
      page.classList.add('is-exiting');
      window.setTimeout(function () {
        window.location.href = destination;
      }, 400);
    });
  });
}());
