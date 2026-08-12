import { createRoot } from 'react-dom/client';
import GlassSurface from '../../components/GlassSurface/GlassSurface.jsx';

const alphaPattern = /rgba?\(([^)]+)\)/i;

function parseColor(value) {
  const match = value?.match(alphaPattern);
  if (!match) return null;
  const channels = match[1].split(',').map(channel => Number.parseFloat(channel.trim()));
  if (channels.length < 3 || channels.some(Number.isNaN)) return null;
  return {
    red: channels[0],
    green: channels[1],
    blue: channels[2],
    alpha: channels[3] == null ? 1 : channels[3]
  };
}

function luminance({ red, green, blue }) {
  const linear = [red, green, blue].map(channel => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function estimateSurfaceLuminance(nav) {
  const rect = nav.getBoundingClientRect();
  const probeY = Math.min(window.innerHeight - 1, Math.max(rect.bottom + 8, 1));
  const probeX = Math.min(window.innerWidth - 1, Math.max(rect.left + rect.width / 2, 1));
  const candidates = document.elementsFromPoint(probeX, probeY);

  for (const element of candidates) {
    if (element.closest('nav, header.workflow-nav, header.journey-nav')) continue;
    const style = window.getComputedStyle(element);
    const color = parseColor(style.backgroundColor);
    if (color?.alpha > 0.08) return luminance(color);
    if (style.backgroundImage !== 'none') {
      const foreground = parseColor(style.color);
      if (foreground) return luminance(foreground) > 0.52 ? 0.16 : 0.82;
    }
  }

  const bodyStyle = window.getComputedStyle(document.body);
  const bodyColor = parseColor(bodyStyle.backgroundColor);
  return bodyColor ? luminance(bodyColor) : 0.82;
}

function syncNavContrast() {
  document.querySelectorAll('nav, header.workflow-nav, header.journey-nav').forEach(nav => {
    const surfaceLuminance = estimateSurfaceLuminance(nav);
    nav.dataset.navContrast = surfaceLuminance < 0.48 ? 'light' : 'dark';
  });
}

function NavGlass() {
  return (
    <GlassSurface
      width="100%"
      height="100%"
      borderRadius={999}
      borderWidth={0.06}
      brightness={50}
      opacity={0.93}
      blur={11}
      displace={0.5}
      backgroundOpacity={0.1}
      saturation={1}
      distortionScale={-180}
      redOffset={0}
      greenOffset={10}
      blueOffset={20}
      mixBlendMode="screen"
      className="nav__glass-surface"
    >
      <span className="nav__glass-proxy" aria-hidden="true" />
    </GlassSurface>
  );
}

document.querySelectorAll('[data-nav-glass-root]').forEach(root => {
  createRoot(root).render(<NavGlass />);
});

let contrastFrame = 0;
let workflowContrastTimer = 0;
const scheduleNavContrast = () => {
  if (document.querySelector('.workflow-background')) {
    window.clearTimeout(workflowContrastTimer);
    workflowContrastTimer = window.setTimeout(syncNavContrast, 160);
    return;
  }
  if (contrastFrame) return;
  contrastFrame = requestAnimationFrame(() => {
    contrastFrame = 0;
    syncNavContrast();
  });
};

syncNavContrast();
window.addEventListener('scroll', scheduleNavContrast, { passive: true });
window.addEventListener('resize', scheduleNavContrast, { passive: true });
