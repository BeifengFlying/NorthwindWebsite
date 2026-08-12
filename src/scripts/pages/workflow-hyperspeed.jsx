import React from 'react';
import { createRoot } from 'react-dom/client';
import Hyperspeed from '../../components/Hyperspeed.jsx';

const baseOptions = {
  onSpeedUp: () => document.documentElement.classList.add('workflow-speeding'),
  onSlowDown: () => document.documentElement.classList.remove('workflow-speeding'),
  distortion: 'turbulentDistortion',
  length: 400,
  roadWidth: 9,
  islandWidth: 2,
  lanesPerRoad: 3,
  fov: 90,
  fovSpeedUp: 150,
  speedUp: 2,
  carLightsFade: 0.4,
  totalSideLightSticks: 50,
  lightPairsPerRoadWay: 50,
  shoulderLinesWidthPercentage: 0.05,
  brokenLinesWidthPercentage: 0.1,
  brokenLinesLengthPercentage: 0.5,
  lightStickWidth: [0.12, 0.5],
  lightStickHeight: [1.3, 1.7],
  // Mirror both carriageways together so colour and travel direction swap as
  // one visual system.
  movingAwaySpeed: [-120, -160],
  movingCloserSpeed: [60, 80],
  carLightsLength: [20, 60],
  carLightsRadius: [0.05, 0.14],
  carWidthPercentage: [0.3, 0.5],
  carShiftX: [-0.2, 0.2],
  carFloorSeparation: [0.05, 1],
  colors: {
    roadColor: 0x080808,
    islandColor: 0x0a0a0a,
    background: 0x000000,
    shoulderLines: 0x131318,
    brokenLines: 0x131318,
    leftCars: [0x334bf7, 0xe5e6ed, 0xbfc6f3],
    rightCars: [0xdc5b20, 0xdca320, 0xdc2020],
    sticks: 0xc5e8eb
  }
};

const compactOptions = {
  ...baseOptions,
  totalSideLightSticks: 28,
  lightPairsPerRoadWay: 28,
  colors: { ...baseOptions.colors }
};

const mount = document.getElementById('workflowHyperspeed');
if (mount) {
  const options = window.matchMedia('(max-width: 760px)').matches ? compactOptions : baseOptions;
  createRoot(mount).render(<Hyperspeed effectOptions={options} />);

  // The page content sits above the fixed background. Forward only background
  // presses so Hyperspeed keeps its native hold-to-speed-up interaction.
  const forward = (type, event) => {
    if (type === 'mousedown' && event.target.closest('a, button, input, select, textarea')) return;
    const lights = mount.querySelector('#lights');
    if (!lights) return;
    lights.dispatchEvent(new MouseEvent(type, {
      bubbles: true,
      clientX: event.clientX,
      clientY: event.clientY,
      buttons: event.buttons
    }));
  };
  document.addEventListener('pointerdown', (event) => forward('mousedown', event), { passive: true });
  document.addEventListener('pointerup', (event) => forward('mouseup', event), { passive: true });
  document.addEventListener('pointercancel', (event) => forward('mouseup', event), { passive: true });
}
