(function () {
  var canvas = document.getElementById('infiniteMenuCanvas');
  if (!canvas) return;
  var stage = document.getElementById('infiniteMenu');
  var ctx = canvas.getContext('2d');
  var title = document.getElementById('menuTitle');
  var description = document.getElementById('menuDescription');
  var index = document.getElementById('menuIndex');
  var action = document.getElementById('menuAction');
  var nav = document.querySelector('.journey-nav');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var compactViewport = window.matchMedia('(max-width: 760px)').matches;
  var items = [
    { title: '想法', description: '从一个属于自己的数字空间开始', href: '#idea', theme: 'idea', accent: '#ff70e8' },
    { title: '规划', description: '让不同兴趣拥有自己的入口', href: '#planning', theme: 'planning', accent: '#ff8a3d' },
    { title: '设计', description: '把秩序、颜色和情绪放在一起', href: '#design', theme: 'design', accent: '#ffd84d' },
    { title: '开发', description: '把设计变成真实可用的交互', href: '#development', theme: 'development', accent: '#78f58a' },
    { title: '打磨', description: '让细节更轻，让体验更顺', href: '#optimization', theme: 'optimization', accent: '#62e8e8' },
    { title: '上线', description: '从本地文件，到公开的地址', href: '#deployment', theme: 'deployment', accent: '#4d83ff' }
  ];
  var rotation = 0; var velocity = reduceMotion ? 0 : .0018; var activeIndex = 0; var pointerDown = false; var dragged = false; var lastX = 0; var lastTime = 0; var cards = [];
  function roundedRectPath(x, y, width, height, radius) { if (ctx.roundRect) { ctx.roundRect(x, y, width, height, radius); return; } var r = Math.min(radius, width / 2, height / 2); ctx.moveTo(x + r, y); ctx.arcTo(x + width, y, x + width, y + height, r); ctx.arcTo(x + width, y + height, x, y + height, r); ctx.arcTo(x, y + height, x, y, r); ctx.arcTo(x, y, x + width, y, r); ctx.closePath(); }
  function resize() { var dpr = Math.min(window.devicePixelRatio || 1, compactViewport ? 1.5 : 2); canvas.width = canvas.clientWidth * dpr; canvas.height = canvas.clientHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); if (reduceMotion) window.requestAnimationFrame(render); }
  function drawLine(x1, y1, x2, y2, color, width, alpha) { ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore(); }
  function drawDot(x, y, radius, color, alpha) { ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  function drawStageCard(item, x, y, width, height, radius, alpha) {
    var accent = item.accent;
    var pad = Math.max(12, width * .1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath(); roundedRectPath(x, y, width, height, radius); ctx.clip();
    ctx.fillStyle = '#202323'; ctx.fillRect(x, y, width, height);
    var glow = ctx.createRadialGradient(x + width * .7, y + height * .2, 0, x + width * .7, y + height * .2, width * .8);
    glow.addColorStop(0, accent + '45'); glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow; ctx.fillRect(x, y, width, height);
    ctx.fillStyle = 'rgba(255,255,255,.035)';
    for (var grid = 0; grid < 8; grid += 1) { ctx.fillRect(x + grid * width / 7, y, 1, height); ctx.fillRect(x, y + grid * height / 7, width, 1); }

    var cx = x + width * .5; var cy = y + height * .52;
    if (item.theme === 'idea') {
      for (var ring = 1; ring < 4; ring += 1) { ctx.globalAlpha = alpha * (.22 - ring * .035); ctx.strokeStyle = accent; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, width * (.12 + ring * .1), 0, Math.PI * 2); ctx.stroke(); }
      drawDot(cx, cy, width * .07, accent, alpha); for (var ray = 0; ray < 8; ray += 1) { var a = ray * Math.PI / 4; drawLine(cx + Math.cos(a) * width * .18, cy + Math.sin(a) * width * .18, cx + Math.cos(a) * width * .31, cy + Math.sin(a) * width * .31, accent, 2, alpha * .8); }
    } else if (item.theme === 'planning') {
      var nodes = [[-.22, -.2], [.2, -.22], [-.2, .2], [.22, .2], [0, 0]];
      [[0, 4], [1, 4], [2, 4], [3, 4]].forEach(function (edge) { drawLine(cx + nodes[edge[0]][0] * width, cy + nodes[edge[0]][1] * height, cx + nodes[edge[1]][0] * width, cy + nodes[edge[1]][1] * height, accent, 2, alpha * .7); });
      nodes.forEach(function (node, nodeIndex) { drawDot(cx + node[0] * width, cy + node[1] * height, nodeIndex === 4 ? width * .06 : width * .04, nodeIndex === 4 ? '#fff' : accent, alpha); });
    } else if (item.theme === 'design') {
      var swatches = ['#ff70e8', '#ff8a3d', '#ffd84d', '#62e8e8', '#4d83ff'];
      swatches.forEach(function (color, swatchIndex) { var sx = x + pad + swatchIndex * (width - pad * 2) / 4; var sy = y + height * .64 - Math.sin(swatchIndex * .9) * height * .09; ctx.fillStyle = color; ctx.globalAlpha = alpha * .9; ctx.beginPath(); ctx.arc(sx, sy, width * .065, 0, Math.PI * 2); ctx.fill(); if (swatchIndex) drawLine(sx - (width - pad * 2) / 4, sy, sx - width * .065, sy, '#fff', 1, alpha * .28); });
      ctx.globalAlpha = alpha * .75; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, y + height * .39, width * .18, Math.PI * .1, Math.PI * .92); ctx.stroke();
    } else if (item.theme === 'development') {
      ctx.fillStyle = '#111'; ctx.globalAlpha = alpha * .9; ctx.fillRect(x + pad, y + height * .24, width - pad * 2, height * .48); ctx.fillStyle = accent; ctx.globalAlpha = alpha; ctx.fillRect(x + pad, y + height * .24, width - pad * 2, height * .055);
      drawLine(x + pad * 1.5, y + height * .42, x + pad * 2.3, y + height * .49, accent, 2, alpha); drawLine(x + pad * 2.3, y + height * .49, x + pad * 1.5, y + height * .56, accent, 2, alpha); drawLine(x + pad * 2.8, y + height * .57, x + width * .56, y + height * .57, '#fff', 2, alpha * .6); drawLine(x + pad * 2.8, y + height * .64, x + width * .72, y + height * .64, '#fff', 2, alpha * .35);
    } else if (item.theme === 'optimization') {
      for (var slider = 0; slider < 3; slider += 1) { var sy2 = y + height * (.34 + slider * .16); drawLine(x + pad, sy2, x + width - pad, sy2, '#fff', 1, alpha * .3); var knob = x + width * [.68, .42, .8][slider]; drawDot(knob, sy2, width * .045, accent, alpha); }
      ctx.globalAlpha = alpha * .6; ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + pad, y + height * .72); ctx.lineTo(x + width * .37, y + height * .64); ctx.lineTo(x + width * .58, y + height * .7); ctx.lineTo(x + width - pad, y + height * .55); ctx.stroke();
    } else if (item.theme === 'deployment') {
      var steps = [x + pad * 1.3, cx, x + width - pad * 1.3]; var sy3 = y + height * .5; drawLine(steps[0], sy3, steps[1], sy3, accent, 2, alpha * .8); drawLine(steps[1], sy3, steps[2], sy3, accent, 2, alpha * .8); steps.forEach(function (step, stepIndex) { drawDot(step, sy3, width * (stepIndex === 1 ? .065 : .05), stepIndex === 2 ? '#fff' : accent, alpha); }); drawLine(cx, sy3 - height * .2, cx, sy3 - height * .08, '#fff', 1, alpha * .45); drawDot(cx, sy3 - height * .24, width * .025, accent, alpha);
    }
    ctx.globalAlpha = alpha * .55; ctx.fillStyle = '#fff'; ctx.font = Math.max(9, width * .052) + 'px ' + getComputedStyle(document.body).fontFamily; ctx.fillText(item.title.toUpperCase(), x + pad, y + height - pad * .9); ctx.font = Math.max(7, width * .033) + 'px ' + getComputedStyle(document.body).fontFamily; ctx.fillStyle = accent; ctx.fillText('0' + (items.indexOf(item) + 1) + ' / NORTHWIND', x + pad, y + pad * 1.1);
    ctx.restore();
  }
  function updateLabel() { var item = items[activeIndex]; title.textContent = item.title; description.textContent = item.description; index.textContent = String(activeIndex + 1).padStart(2, '0') + ' / ' + String(items.length).padStart(2, '0'); action.href = item.href; }
  function render() { var width = canvas.clientWidth; var height = canvas.clientHeight; var centerX = width / 2; var centerY = height / 2 + (width < 700 ? 24 : 0); var radiusX = Math.min(width * .33, 390); var radiusY = Math.min(height * .27, 160); var cardWidth = Math.min(width < 700 ? 170 : 230, width * .27); var cardHeight = cardWidth * 1.16; ctx.clearRect(0, 0, width, height); cards = items.map(function (item, itemIndex) { var angle = rotation + itemIndex * Math.PI * 2 / items.length; var depth = (Math.cos(angle) + 1) / 2; return { item: item, itemIndex: itemIndex, depth: depth, x: centerX + Math.sin(angle) * radiusX, y: centerY + Math.cos(angle) * radiusY, scale: .62 + depth * .5 }; }).sort(function (a, b) { return a.depth - b.depth; }); cards.forEach(function (card) { var widthScaled = cardWidth * card.scale; var heightScaled = cardHeight * card.scale; var alpha = .3 + card.depth * .7; drawStageCard(card.item, card.x - widthScaled / 2, card.y - heightScaled / 2, widthScaled, heightScaled, 10, alpha); ctx.save(); ctx.globalAlpha = alpha * .5; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.beginPath(); roundedRectPath(card.x - widthScaled / 2, card.y - heightScaled / 2, widthScaled, heightScaled, 10); ctx.stroke(); ctx.restore(); }); var front = cards[cards.length - 1]; if (front && front.itemIndex !== activeIndex) { activeIndex = front.itemIndex; updateLabel(); } if (!pointerDown) rotation += velocity; velocity *= .985; if (Math.abs(velocity) < .0002 && !reduceMotion) velocity += (rotation % (Math.PI * 2) < 0 ? .0003 : -.0003); if (!reduceMotion) window.requestAnimationFrame(render); }
  function pointerPosition(event) { return event.touches ? event.touches[0].clientX : event.clientX; } function down(event) { pointerDown = true; dragged = false; lastX = pointerPosition(event); lastTime = performance.now(); velocity = 0; } function move(event) { if (!pointerDown) return; var currentX = pointerPosition(event); var delta = currentX - lastX; if (Math.abs(delta) > 2) dragged = true; rotation += delta / Math.max(250, canvas.clientWidth); var now = performance.now(); velocity = delta / Math.max(1, now - lastTime) * .018; lastX = currentX; lastTime = now; if (event.cancelable) event.preventDefault(); } function up() { pointerDown = false; }
  canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move, { passive: false }); canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up); canvas.addEventListener('click', function () { if (!dragged) action.click(); }); window.addEventListener('resize', resize); resize(); updateLabel(); render();
  var revealItems = document.querySelectorAll('[data-reveal]'); if ('IntersectionObserver' in window) { var observer = new IntersectionObserver(function (entries) { entries.forEach(function (entry) { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } }); }, { threshold: .12 }); revealItems.forEach(function (item) { observer.observe(item); }); } else revealItems.forEach(function (item) { item.classList.add('is-visible'); });
  window.addEventListener('scroll', function () { if (!reduceMotion) stage.style.setProperty('--scroll-shift', (window.scrollY * .025) + 'px'); nav.classList.toggle('scrolled', window.scrollY > 24); }, { passive: true });
}());
