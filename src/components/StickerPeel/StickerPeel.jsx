import { useEffect, useMemo, useRef } from 'react';
import { Draggable } from 'gsap/Draggable';
import { gsap } from 'gsap';

gsap.registerPlugin(Draggable);

export default function StickerPeel({
  imageSrc,
  rotate = 30,
  peelBackHoverPct = 30,
  peelBackActivePct = 40,
  width = 200,
  shadowIntensity = 0.6,
  lightingIntensity = 0.1,
  initialPosition = 'center',
  peelDirection = 0,
  bounds = null,
  stopPropagation = false,
  onDragRelease = null,
  className = ''
}) {
  const containerRef = useRef(null);
  const dragTargetRef = useRef(null);
  const pointLightRef = useRef(null);
  const pointLightFlippedRef = useRef(null);
  const draggableRef = useRef(null);
  const dragOriginRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const target = dragTargetRef.current;
    const tiltTarget = containerRef.current;
    if (!target || !tiltTarget) return undefined;
    const boundsEl = bounds === false ? null : bounds || target.parentNode;
    const setDragRotation = gsap.quickSetter(tiltTarget, 'rotation', 'deg');
    gsap.set(tiltTarget, { rotation: peelDirection });
    if (typeof initialPosition === 'object') gsap.set(target, { x: initialPosition.x ?? 0, y: initialPosition.y ?? 0 });
    draggableRef.current = Draggable.create(target, {
      type: 'x,y',
      force3D: true,
      ...(boundsEl ? { bounds: boundsEl } : {}),
      onDragStart() {
        const rect = target.getBoundingClientRect();
        dragOriginRef.current = { x: rect.left, y: rect.top };
      },
      onDrag() {
        setDragRotation(peelDirection + gsap.utils.clamp(-24, 24, this.deltaX * 0.4));
      },
      onDragEnd() {
        const rect = target.getBoundingClientRect();
        const distance = Math.hypot(rect.left - dragOriginRef.current.x, rect.top - dragOriginRef.current.y);
        gsap.to(tiltTarget, { rotation: peelDirection, duration: 0.8, ease: 'power2.out' });
        onDragRelease?.({
          x: rect.left + window.scrollX,
          y: rect.top + window.scrollY,
          width: rect.width,
          height: rect.height,
          distance
        });
      }
    })[0];
    return () => draggableRef.current?.kill();
  }, [initialPosition, peelDirection, bounds, onDragRelease]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    let frame = 0;
    let latestEvent = null;
    const updateLight = event => {
      latestEvent = event;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!latestEvent) return;
        const rect = container.getBoundingClientRect();
        const x = latestEvent.clientX - rect.left;
        const y = latestEvent.clientY - rect.top;
        gsap.set(pointLightRef.current, { attr: { x, y } });
        gsap.set(pointLightFlippedRef.current, { attr: { x, y: rect.height - y } });
      });
    };
    const onTouchStart = () => container.classList.add('touch-active');
    const onTouchEnd = () => container.classList.remove('touch-active');
    container.addEventListener('mousemove', updateLight);
    container.addEventListener('touchstart', onTouchStart);
    container.addEventListener('touchend', onTouchEnd);
    container.addEventListener('touchcancel', onTouchEnd);
    return () => {
      cancelAnimationFrame(frame);
      container.removeEventListener('mousemove', updateLight);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchend', onTouchEnd);
      container.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  const style = useMemo(() => ({
    '--sticker-rotate': `${rotate}deg`,
    '--sticker-peelback-hover': `${peelBackHoverPct}%`,
    '--sticker-peelback-active': `${peelBackActivePct}%`,
    '--sticker-width': typeof width === 'number' ? `${width}px` : width,
    '--sticker-shadow-opacity': shadowIntensity,
    '--sticker-lighting-constant': lightingIntensity,
    '--peel-direction': `${peelDirection}deg`
  }), [rotate, peelBackHoverPct, peelBackActivePct, width, shadowIntensity, lightingIntensity, peelDirection]);

  return (
    <div
      className={`sticker-draggable ${className}`.trim()}
      ref={dragTargetRef}
      style={style}
      onPointerDown={stopPropagation ? event => event.stopPropagation() : undefined}
      onPointerMove={stopPropagation ? event => event.stopPropagation() : undefined}
      onPointerUp={stopPropagation ? event => event.stopPropagation() : undefined}
      onDoubleClick={stopPropagation ? event => event.stopPropagation() : undefined}
    >
      <svg width="0" height="0" aria-hidden="true">
        <defs>
          <filter id="sticker-point-light"><feGaussianBlur stdDeviation="1" result="blur"/><feSpecularLighting result="spec" in="blur" specularExponent="100" specularConstant={lightingIntensity} lightingColor="white"><fePointLight ref={pointLightRef} x="100" y="100" z="300"/></feSpecularLighting><feComposite in="spec" in2="SourceGraphic" result="lit"/><feComposite in="lit" in2="SourceAlpha" operator="in"/></filter>
          <filter id="sticker-point-light-flipped"><feGaussianBlur stdDeviation="10" result="blur"/><feSpecularLighting result="spec" in="blur" specularExponent="100" specularConstant={lightingIntensity * 7} lightingColor="white"><fePointLight ref={pointLightFlippedRef} x="100" y="100" z="300"/></feSpecularLighting><feComposite in="spec" in2="SourceGraphic" result="lit"/><feComposite in="lit" in2="SourceAlpha" operator="in"/></filter>
          <filter id="sticker-shadow"><feDropShadow dx="2" dy="4" stdDeviation={3 * shadowIntensity} floodColor="black" floodOpacity={shadowIntensity}/></filter>
          <filter id="sticker-fill"><feFlood floodColor="#b3b3b3" result="flood"/><feComposite operator="in" in="flood" in2="SourceAlpha"/></filter>
        </defs>
      </svg>
      <div className="sticker-container" ref={containerRef}>
        <div className="sticker-main"><div className="sticker-lighting"><img src={imageSrc} alt="Flying logo sticker" className="sticker-image" draggable="false"/></div></div>
        <div className="sticker-flap"><div className="sticker-flap-lighting"><img src={imageSrc} alt="" className="sticker-flap-image" draggable="false"/></div></div>
      </div>
    </div>
  );
}
