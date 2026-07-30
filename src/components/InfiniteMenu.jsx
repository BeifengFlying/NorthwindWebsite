import { useEffect, useRef, useState } from 'react';
import { quat, vec3 } from 'gl-matrix';
import './InfiniteMenu.css';

const TAU = Math.PI * 2;
const POINT_COUNT = 6;
const FRONT = vec3.fromValues(0, 0, 1);

function makeSpherePoints(count) {
  const points = [];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let index = 0; index < count; index += 1) {
    const y = 1 - (index / (count - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const angle = goldenAngle * index;
    points.push(vec3.fromValues(Math.cos(angle) * radius, y, Math.sin(angle) * radius));
  }
  return points;
}

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}

function drawLine(context, x1, y1, x2, y2, color, width = 2, alpha = 1) {
  context.save();
  context.globalAlpha *= alpha;
  context.strokeStyle = color;
  context.lineWidth = width;
  context.beginPath();
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.stroke();
  context.restore();
}

function drawDot(context, x, y, radius, color, alpha = 1) {
  context.save();
  context.globalAlpha *= alpha;
  context.fillStyle = color;
  context.beginPath();
  context.arc(x, y, radius, 0, TAU);
  context.fill();
  context.restore();
}

function drawCardGraphic(context, item, x, y, width, height, alpha) {
  const pad = Math.max(10, width * 0.09);
  const centerX = x + width * 0.5;
  const centerY = y + height * 0.52;
  context.save();
  context.globalAlpha = alpha;
  roundedRect(context, x, y, width, height, Math.max(7, width * 0.045));
  context.clip();
  context.fillStyle = '#1d2222';
  context.fillRect(x, y, width, height);

  const glow = context.createRadialGradient(x + width * 0.72, y + height * 0.2, 0, x + width * 0.72, y + height * 0.2, width);
  glow.addColorStop(0, `${item.accent}52`);
  glow.addColorStop(1, 'transparent');
  context.fillStyle = glow;
  context.fillRect(x, y, width, height);

  context.fillStyle = 'rgba(255,255,255,.045)';
  for (let line = 0; line < 8; line += 1) {
    context.fillRect(x + (line * width) / 7, y, 1, height);
    context.fillRect(x, y + (line * height) / 7, width, 1);
  }

  if (item.theme === 'idea') {
    for (let ring = 1; ring < 4; ring += 1) {
      context.globalAlpha = alpha * (0.22 - ring * 0.035);
      context.strokeStyle = item.accent;
      context.lineWidth = 1;
      context.beginPath();
      context.arc(centerX, centerY, width * (0.12 + ring * 0.1), 0, TAU);
      context.stroke();
    }
    context.globalAlpha = alpha;
    drawDot(context, centerX, centerY, width * 0.065, item.accent);
    for (let ray = 0; ray < 8; ray += 1) {
      const angle = (ray * Math.PI) / 4;
      drawLine(context, centerX + Math.cos(angle) * width * 0.18, centerY + Math.sin(angle) * width * 0.18, centerX + Math.cos(angle) * width * 0.31, centerY + Math.sin(angle) * width * 0.31, item.accent);
    }
  } else if (item.theme === 'planning') {
    const nodes = [[-0.22, -0.2], [0.2, -0.22], [-0.2, 0.2], [0.22, 0.2], [0, 0]];
    nodes.slice(0, 4).forEach((node) => drawLine(context, centerX + node[0] * width, centerY + node[1] * height, centerX, centerY, item.accent, 2, 0.75));
    nodes.forEach((node, nodeIndex) => drawDot(context, centerX + node[0] * width, centerY + node[1] * height, width * (nodeIndex === 4 ? 0.055 : 0.038), nodeIndex === 4 ? '#f4f1ea' : item.accent));
  } else if (item.theme === 'design') {
    ['#ff70e8', '#ff8a3d', '#ffd84d', '#62e8e8', '#4d83ff'].forEach((color, colorIndex) => {
      const dotX = x + pad + (colorIndex * (width - pad * 2)) / 4;
      const dotY = y + height * 0.64 - Math.sin(colorIndex * 0.9) * height * 0.09;
      drawDot(context, dotX, dotY, width * 0.055, color);
    });
    context.strokeStyle = 'rgba(255,255,255,.62)';
    context.lineWidth = 1.5;
    context.beginPath();
    context.arc(centerX, y + height * 0.39, width * 0.18, Math.PI * 0.1, Math.PI * 0.92);
    context.stroke();
  } else if (item.theme === 'development') {
    context.fillStyle = '#101313';
    context.fillRect(x + pad, y + height * 0.25, width - pad * 2, height * 0.46);
    context.fillStyle = item.accent;
    context.fillRect(x + pad, y + height * 0.25, width - pad * 2, height * 0.05);
    drawLine(context, x + pad * 1.4, y + height * 0.42, x + pad * 2.2, y + height * 0.49, item.accent);
    drawLine(context, x + pad * 2.2, y + height * 0.49, x + pad * 1.4, y + height * 0.56, item.accent);
    drawLine(context, x + pad * 2.7, y + height * 0.57, x + width * 0.58, y + height * 0.57, '#fff', 2, 0.58);
    drawLine(context, x + pad * 2.7, y + height * 0.64, x + width * 0.72, y + height * 0.64, '#fff', 2, 0.3);
  } else if (item.theme === 'optimization') {
    [0.68, 0.42, 0.8].forEach((position, sliderIndex) => {
      const sliderY = y + height * (0.34 + sliderIndex * 0.16);
      drawLine(context, x + pad, sliderY, x + width - pad, sliderY, '#fff', 1, 0.28);
      drawDot(context, x + width * position, sliderY, width * 0.04, item.accent);
    });
    drawLine(context, x + pad, y + height * 0.74, x + width * 0.38, y + height * 0.65, item.accent, 2, 0.65);
    drawLine(context, x + width * 0.38, y + height * 0.65, x + width * 0.58, y + height * 0.7, item.accent, 2, 0.65);
    drawLine(context, x + width * 0.58, y + height * 0.7, x + width - pad, y + height * 0.55, item.accent, 2, 0.65);
  } else {
    const steps = [x + pad * 1.3, centerX, x + width - pad * 1.3];
    drawLine(context, steps[0], centerY, steps[2], centerY, item.accent, 2, 0.8);
    steps.forEach((step, stepIndex) => drawDot(context, step, centerY, width * (stepIndex === 1 ? 0.058 : 0.044), stepIndex === 2 ? '#f4f1ea' : item.accent));
    drawLine(context, centerX, centerY - height * 0.22, centerX, centerY - height * 0.08, '#fff', 1, 0.42);
    drawDot(context, centerX, centerY - height * 0.25, width * 0.024, item.accent);
  }

  context.globalAlpha = alpha * 0.72;
  context.fillStyle = item.accent;
  context.font = `500 ${Math.max(7, width * 0.034)}px "DM Mono", monospace`;
  context.fillText(`0${item.order} / NORTHWIND`, x + pad, y + pad * 1.15);
  context.fillStyle = '#fff';
  context.globalAlpha = alpha * 0.6;
  context.font = `500 ${Math.max(9, width * 0.052)}px Inter, sans-serif`;
  context.fillText(item.title, x + pad, y + height - pad);
  context.restore();

  context.save();
  context.globalAlpha = alpha * 0.5;
  context.strokeStyle = '#fff';
  context.lineWidth = 1;
  roundedRect(context, x, y, width, height, Math.max(7, width * 0.045));
  context.stroke();
  context.restore();
}

export default function InfiniteMenu({ items = [], scale = 1 }) {
  const canvasRef = useRef(null);
  const itemsRef = useRef(items);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const activeItem = items[activeIndex];
  itemsRef.current = items;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !items.length) return undefined;
    const context = canvas.getContext('2d', { alpha: true });
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const points = makeSpherePoints(POINT_COUNT);
    const orientation = quat.setAxisAngle(quat.create(), [1, 0, 0], Math.PI / 2);
    const rotated = vec3.create();
    const correction = quat.create();
    let frame = 0;
    let previousTime = performance.now();
    let pointerDown = false;
    let dragged = false;
    let lastX = 0;
    let lastY = 0;
    let velocityX = reduceMotion ? 0 : 0.00045;
    let velocityY = 0;
    let currentActive = 0;
    let movementState = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const rotate = (xAngle, yAngle) => {
      const horizontal = quat.setAxisAngle(quat.create(), [0, 1, 0], xAngle);
      const vertical = quat.setAxisAngle(quat.create(), [1, 0, 0], yAngle);
      quat.multiply(orientation, horizontal, orientation);
      quat.multiply(orientation, vertical, orientation);
      quat.normalize(orientation, orientation);
    };

    const updateMovement = (moving) => {
      if (moving !== movementState) {
        movementState = moving;
        setIsMoving(moving);
      }
    };

    const render = (time) => {
      const delta = Math.min(32, time - previousTime);
      previousTime = time;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const compact = width < 700;
      const centerX = width / 2;
      const centerY = height / 2 + (compact ? 18 : 0);
      const radius = Math.min(width * (compact ? 0.49 : 0.36), height * 0.54) / scale;
      const baseWidth = Math.min(compact ? 164 : 218, width * (compact ? 0.38 : 0.23));
      const projected = [];
      let nearest = null;

      context.clearRect(0, 0, width, height);
      if (!pointerDown && !reduceMotion) {
        rotate(velocityX * delta, velocityY * delta);
        velocityX *= Math.pow(0.986, delta / 16.67);
        velocityY *= Math.pow(0.986, delta / 16.67);
      }

      points.forEach((point, pointIndex) => {
        vec3.transformQuat(rotated, point, orientation);
        const depth = (rotated[2] + 1) / 2;
        const perspective = 0.52 + depth * 0.6;
        const screenX = centerX + rotated[0] * radius * perspective;
        const screenY = centerY - rotated[1] * radius * perspective;
        const candidate = { pointIndex, itemIndex: pointIndex % itemsRef.current.length, point: vec3.clone(rotated), depth, perspective, x: screenX, y: screenY };
        projected.push(candidate);
        if (!nearest || rotated[2] > nearest.point[2]) nearest = candidate;
      });

      projected.sort((left, right) => left.depth - right.depth).forEach((card) => {
        if (card.depth < 0.08) return;
        const cardWidth = baseWidth * card.perspective;
        const cardHeight = cardWidth * 1.16;
        drawCardGraphic(context, itemsRef.current[card.itemIndex], card.x - cardWidth / 2, card.y - cardHeight / 2, cardWidth, cardHeight, 0.12 + card.depth * 0.82);
      });

      const moving = pointerDown || Math.abs(velocityX) + Math.abs(velocityY) > 0.0012;
      updateMovement(moving);
      if (nearest && nearest.itemIndex !== currentActive && nearest.point[2] > 0.93) {
        currentActive = nearest.itemIndex;
        setActiveIndex(currentActive);
      }

      if (!pointerDown && !moving && nearest && !reduceMotion) {
        quat.rotationTo(correction, nearest.point, FRONT);
        quat.slerp(correction, quat.create(), correction, 0.075);
        quat.multiply(orientation, correction, orientation);
      }
      if (!pointerDown && Math.abs(velocityX) + Math.abs(velocityY) < 0.00008 && !reduceMotion) velocityX = 0.00004;
      frame = window.requestAnimationFrame(render);
    };

    const pointerStart = (event) => {
      pointerDown = true;
      dragged = false;
      lastX = event.clientX;
      lastY = event.clientY;
      velocityX = 0;
      velocityY = 0;
      canvas.setPointerCapture?.(event.pointerId);
    };
    const pointerMove = (event) => {
      if (!pointerDown) return;
      const deltaX = event.clientX - lastX;
      const deltaY = event.clientY - lastY;
      if (Math.abs(deltaX) + Math.abs(deltaY) > 3) dragged = true;
      rotate(deltaX / Math.max(180, canvas.clientWidth) * 2.5, deltaY / Math.max(180, canvas.clientHeight) * 2.5);
      velocityX = (deltaX / Math.max(180, canvas.clientWidth)) * 0.11;
      velocityY = (deltaY / Math.max(180, canvas.clientHeight)) * 0.11;
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const pointerEnd = (event) => {
      pointerDown = false;
      canvas.releasePointerCapture?.(event.pointerId);
    };
    const focusItem = (nextIndex) => {
      const normalizedIndex = (nextIndex + itemsRef.current.length) % itemsRef.current.length;
      const targetPoint = vec3.transformQuat(vec3.create(), points[normalizedIndex], orientation);
      quat.rotationTo(correction, targetPoint, FRONT);
      quat.multiply(orientation, correction, orientation);
      quat.normalize(orientation, orientation);
      velocityX = 0;
      velocityY = 0;
      currentActive = normalizedIndex;
      setActiveIndex(normalizedIndex);
      updateMovement(false);
    };
    const keyDown = (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') focusItem(currentActive - 1);
      else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') focusItem(currentActive + 1);
      else if (event.key === 'Enter' && itemsRef.current[currentActive]) window.location.href = itemsRef.current[currentActive].link;
      else return;
      event.preventDefault();
    };
    const click = () => {
      if (!dragged && itemsRef.current[currentActive]) window.location.href = itemsRef.current[currentActive].link;
    };

    window.addEventListener('resize', resize);
    canvas.addEventListener('pointerdown', pointerStart);
    canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('pointerup', pointerEnd);
    canvas.addEventListener('pointercancel', pointerEnd);
    canvas.addEventListener('keydown', keyDown);
    canvas.addEventListener('click', click);
    resize();
    frame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', pointerStart);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('pointerup', pointerEnd);
      canvas.removeEventListener('pointercancel', pointerEnd);
      canvas.removeEventListener('keydown', keyDown);
      canvas.removeEventListener('click', click);
    };
  }, [items.length, scale]);

  if (!activeItem) return <p className="infinite-menu-empty">暂无可展示的阶段</p>;

  return (
    <div className="infinite-menu-component">
      <canvas ref={canvasRef} className="infinite-menu-canvas" tabIndex="0" aria-label="开发旅程阶段导航，可拖动或使用方向键旋转" />
      <div className={`infinite-menu-copy infinite-menu-copy--left ${isMoving ? 'is-moving' : ''}`} aria-live="polite">
        <span>{String(activeIndex + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
        <h3>{activeItem.title}</h3>
      </div>
      <p className={`infinite-menu-description ${isMoving ? 'is-moving' : ''}`}>{activeItem.description}</p>
      <a className={`infinite-menu-action ${isMoving ? 'is-moving' : ''}`} href={activeItem.link} aria-label={`查看${activeItem.title}阶段`}>
        <span aria-hidden="true">↗</span>
      </a>
      <span className="infinite-menu-hint">拖动旋转</span>
    </div>
  );
}
