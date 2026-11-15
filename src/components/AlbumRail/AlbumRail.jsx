import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useSpring, useTransform } from 'motion/react';
import './AlbumRail.css';

// Original CSS/DOM implementation. Spinning is decorative; the website's
// existing platform links remain responsible for opening the actual music.
const wrap = (value, count) => ((value % count) + count) % count;
const distance = (index, position, count) => {
  const delta = wrap(index - position, count);
  return delta > count / 2 ? delta - count : delta;
};

function Sleeve({ item, index, count, selected, position, size, expanded, visible, onSelect }) {
  const transform = useTransform(position, value => {
    const d = distance(index, value, count);
    const depth = Math.abs(d);
    const x = Math.sign(d) * (Math.min(depth, 1) * .62 + Math.max(0, depth - 1) * .3);
    return `translate(-50%, -50%) translate3d(${x * size}px, ${Math.min(depth, 4) * 14}px, ${-depth * 90}px) rotateY(${-Math.sign(d) * Math.min(depth, 1) * 22}deg) rotateZ(${d * 6}deg)`;
  });
  const opacity = useTransform(position, value => {
    const d = Math.abs(distance(index, value, count));
    return d > 3.5 ? 0 : Math.max(0, 1 - d * .19);
  });
  const zIndex = useTransform(position, value => 20 - Math.round(Math.abs(distance(index, value, count)) * 2));
  const active = selected === index;
  const nearby = Math.abs(distance(index, selected, count)) <= 3;
  return (
    <motion.button type="button" className="album-rail__sleeve" data-active={active} data-expanded={active && expanded}
      style={{ width: size, height: size, transform, opacity, zIndex, pointerEvents: nearby ? 'auto' : 'none' }}
      tabIndex={active ? 0 : -1} aria-hidden={!nearby} aria-pressed={active && expanded}
      aria-label={active ? `${expanded ? '收起' : '抽出'}黑胶：${item.title} · ${item.artist}` : `选择 ${item.title} · ${item.artist}`}
      onClick={() => onSelect(index)}>
      <span className="album-rail__record" aria-hidden="true">
        <span className="album-rail__disc" style={{ animationPlayState: active && expanded && visible ? 'running' : 'paused' }}>
          <img className="album-rail__label" src={item.cover} alt="" draggable="false" loading="lazy" />
        </span>
      </span>
      <span className="album-rail__jacket"><img src={item.cover} alt="" draggable="false" loading={nearby ? 'eager' : 'lazy'} decoding="async" /></span>
    </motion.button>
  );
}

export default function AlbumRail({ items, startIndex = 0, onIndexChange }) {
  const [selected, setSelected] = useState(startIndex);
  const [expanded, setExpanded] = useState(false);
  const [size, setSize] = useState(260);
  const [dragging, setDragging] = useState(false);
  const [visible, setVisible] = useState(false);
  const stageRef = useRef(null);
  const railRef = useRef(null);
  const pointer = useRef(null);
  const suppressClick = useRef(false);
  const selectedPosition = useRef(startIndex);
  const reduced = useReducedMotion();
  const position = useSpring(startIndex, { duration: .5, bounce: .2 });
  const count = items.length;

  useEffect(() => { onIndexChange?.(selected); }, [selected, onIndexChange]);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setSize(Math.min(286, width * (width < 580 ? .57 : .36)));
    });
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    let intersecting = false;
    const sync = () => setVisible(intersecting && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; sync(); });
    observer.observe(railRef.current);
    document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, []);

  function goTo(next, instant = false) {
    selectedPosition.current = next;
    setSelected(wrap(next, count));
    setExpanded(false);
    if (reduced || instant) position.jump(next);
    else position.set(next);
  }
  const navigate = useRef(goTo);
  navigate.current = goTo;
  useEffect(() => {
    let lastWheel = 0;
    const stage = stageRef.current;
    const onWheel = event => {
      if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || Math.abs(event.deltaX) < 8) return;
      event.preventDefault();
      const now = performance.now();
      if (now - lastWheel < 240) return;
      lastWheel = now;
      navigate.current(selectedPosition.current + Math.sign(event.deltaX));
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, []);

  function pointerDown(event) {
    if (event.button !== 0 || !event.isPrimary) return;
    suppressClick.current = false;
    pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY, lastX: event.clientX, time: performance.now(), velocity: 0, position: selectedPosition.current, dragging: false };
  }
  function pointerMove(event) {
    const p = pointer.current;
    if (!p || p.id !== event.pointerId) return;
    const dx = event.clientX - p.x;
    const dy = event.clientY - p.y;
    if (!p.dragging) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { pointer.current = null; return; }
      if (Math.abs(dx) < 8) return;
      p.dragging = true;
      suppressClick.current = true;
      stageRef.current.setPointerCapture(event.pointerId);
      setDragging(true);
      setExpanded(false);
    }
    const now = performance.now();
    p.velocity = (event.clientX - p.lastX) / Math.max(1, now - p.time);
    p.lastX = event.clientX;
    p.time = now;
    position.jump(p.position - dx / (size * .65));
  }
  function pointerEnd(event, cancelled = false) {
    const p = pointer.current;
    if (!p || p.id !== event.pointerId) return;
    pointer.current = null;
    setDragging(false);
    if (!p.dragging) return;
    if (stageRef.current.hasPointerCapture(event.pointerId)) stageRef.current.releasePointerCapture(event.pointerId);
    const velocity = performance.now() - p.time < 100 ? p.velocity : 0;
    const momentum = Math.max(-.65, Math.min(.65, -velocity * .24));
    goTo(cancelled ? selectedPosition.current : Math.round(position.get() + momentum));
  }
  function select(index) {
    if (suppressClick.current) return;
    if (index === selected) setExpanded(value => !value);
    else goTo(selectedPosition.current + distance(index, selected, count));
  }
  function keyDown(event) {
    suppressClick.current = false;
    const next = { ArrowRight: selectedPosition.current + 1, ArrowLeft: selectedPosition.current - 1, Home: 0, End: count - 1 }[event.key];
    if (next !== undefined) {
      event.preventDefault();
      goTo(next, true);
      stageRef.current.focus({ preventScroll: true });
    }
    if ((event.key === 'Enter' || event.key === ' ') && event.target === event.currentTarget) { event.preventDefault(); setExpanded(value => !value); }
  }

  if (!count) return null;
  return (
    <div className={`album-rail${dragging ? ' is-dragging' : ''}`} ref={railRef}>
      <div className="album-rail__stage" ref={stageRef} role="group" aria-roledescription="唱片轮播" aria-label="唱片架，左右方向键切换歌曲，Enter 抽出黑胶" tabIndex={0}
        onKeyDown={keyDown} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerEnd} onPointerCancel={event => pointerEnd(event, true)}
        onClickCapture={event => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); } }}>
        <div className="album-rail__floor" aria-hidden="true" />
        {items.map((item, index) => <Sleeve key={item.cover} {...{ item, index, count, selected, position, size, expanded, visible }} onSelect={select} />)}
      </div>
      <div className="album-rail__controls" role="group" aria-label="唱片切换">
        <button type="button" className="album-rail__arrow" aria-label="上一张唱片" onClick={() => goTo(selectedPosition.current - 1)}>←</button>
        <div className="album-rail__ruler" role="group" aria-label="选择唱片">
          {items.map((item, index) => <button key={item.cover} type="button" className="album-rail__tick" data-active={index === selected} aria-current={index === selected ? 'true' : undefined} aria-label={`切换到 ${item.title}`} onClick={() => goTo(selectedPosition.current + distance(index, selected, count))}><span /></button>)}
        </div>
        <button type="button" className="album-rail__arrow" aria-label="下一张唱片" onClick={() => goTo(selectedPosition.current + 1)}>→</button>
      </div>
      <div className="album-rail__footnote">
        <span className="album-rail__count">{String(selected + 1).padStart(2, '0')} <span>/ {String(count).padStart(2, '0')}</span></span>
        <span className="album-rail__hint">左右拖动挑选 · 点击封面{expanded ? '收起' : '抽出'}黑胶</span>
        <button type="button" className="album-rail__vinyl-toggle" aria-label={expanded ? '收起黑胶' : '抽出黑胶'} aria-pressed={expanded} onClick={() => setExpanded(value => !value)}><span className="album-rail__mini-record" aria-hidden="true" />{expanded ? '收起' : '抽出'}</button>
      </div>
    </div>
  );
}
