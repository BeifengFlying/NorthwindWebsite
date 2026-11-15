import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Component, Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
const Lanyard = lazy(() => import('../../components/Lanyard/Lanyard.jsx'));
import StickerPeel from '../../components/StickerPeel/StickerPeel.jsx';

const mount = document.getElementById('lanyardRoot');
const stickerLayer = document.getElementById('homeStickerLayer');
const assetUrl = path => new URL(path, document.baseURI).href;
const QR_IMAGE = assetUrl('assets/images/github-qr.svg');
const LANYARD_CARD_BACK = assetUrl('assets/images/flying-card-back.svg');
const FLOATING_CARD_BACK = assetUrl('assets/images/flying-card-back-clean.svg');
const BACK_STICKER = assetUrl('assets/images/flying-wordmark-sticker.svg');
const CARD_EDGE_LAYERS = [-2.6, -1.95, -1.3, -0.65, 0, 0.65, 1.3, 1.95, 2.6];
const STICKER_POSITION_STORAGE_KEY = 'northwind-home-sticker-position';

function syncStickerLayerHeight() {
  if (!stickerLayer) return;
  const footer = document.querySelector('.footer');
  const contentBottom = footer ? footer.getBoundingClientRect().bottom + window.scrollY : document.body.scrollHeight;
  stickerLayer.style.height = `${Math.ceil(contentBottom)}px`;
}

syncStickerLayerHeight();

function initialStickerPosition() {
  if (typeof window === 'undefined') return { x: 0, y: 0 };

  let stored = null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STICKER_POSITION_STORAGE_KEY) || 'null');
    if (parsed && Number.isFinite(parsed.x) && Number.isFinite(parsed.y)) stored = parsed;
  } catch (error) {}

  const maxX = Math.max(24, window.innerWidth - 150);
  const contentHeight = Math.max(document.body?.scrollHeight || 0, window.innerHeight);
  const maxY = Math.max(window.scrollY + 24, contentHeight - 150);
  if (stored) {
    return {
      x: Math.min(maxX, Math.max(24, stored.x)),
      y: Math.min(maxY, Math.max(24, stored.y))
    };
  }

  return {
    x: Math.max(24, window.innerWidth - 190),
    y: window.scrollY + Math.max(240, window.innerHeight - 190)
  };
}

function saveStickerPosition(position) {
  if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.y)) return;
  try {
    window.localStorage.setItem(STICKER_POSITION_STORAGE_KEY, JSON.stringify({
      x: Math.round(position.x),
      y: Math.round(position.y)
    }));
  } catch (error) {}
}

function FloatingProfileCard({ frontImage, locale, stickerDetached, onStickerDetach, onClose, variant = 'default', peelableSticker = true }) {
  const [rotation, setRotation] = useState({ x: -3, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef(null);

  useEffect(() => {
    const onKeyDown = event => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const settleCard = () => {
    if (!dragStart.current) return;
    dragStart.current = null;
    setIsDragging(false);
    setRotation(current => ({ x: 0, y: Math.round(current.y / 180) * 180 }));
  };

  useEffect(() => {
    if (!isDragging) return undefined;
    window.addEventListener('pointerup', settleCard);
    window.addEventListener('pointercancel', settleCard);
    return () => {
      window.removeEventListener('pointerup', settleCard);
      window.removeEventListener('pointercancel', settleCard);
    };
  }, [isDragging]);

  const finishDrag = event => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    settleCard();
  };

  return (
    <div className={`profile-card-float profile-card-float--${variant}`} role="dialog" aria-modal="false" aria-label={locale === 'en' ? 'Northwind two-sided profile card' : '北风双面资料卡'}>
      <div className="profile-card-float__actions">
        <button
          type="button"
          className="profile-card-float__button"
          onClick={() => setRotation(current => ({ x: 0, y: current.y + 180 }))}
          aria-label="翻转资料卡"
          title="翻转资料卡"
        >↻</button>
        <button type="button" className="profile-card-float__button" onClick={onClose} aria-label="关闭资料卡" title="关闭资料卡">×</button>
      </div>
      <div
        className={`profile-card-3d${isDragging ? ' is-dragging' : ''}`}
        style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}
        tabIndex="0"
        onKeyDown={event => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          setRotation(current => ({ x: 0, y: current.y + 180 }));
        }}
        onPointerDown={event => {
          event.currentTarget.setPointerCapture(event.pointerId);
          dragStart.current = { x: event.clientX, y: event.clientY, rotation };
          setIsDragging(true);
        }}
        onPointerMove={event => {
          if (!dragStart.current) return;
          const nextX = Math.max(-18, Math.min(18, dragStart.current.rotation.x - (event.clientY - dragStart.current.y) * 0.18));
          const nextY = dragStart.current.rotation.y + (event.clientX - dragStart.current.x) * 0.72;
          setRotation({ x: nextX, y: nextY });
        }}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        <div className="profile-card-3d__face profile-card-3d__face--front">
          <img src={frontImage} alt={locale === 'en' ? 'Northwind profile card front' : '北风个人资料卡正面'} draggable="false" />
          <img className="profile-card-3d__qr" src={QR_IMAGE} alt={locale === 'en' ? 'GitHub QR code' : 'GitHub 二维码'} draggable="false" />
        </div>
        <div className="profile-card-3d__face profile-card-3d__face--back">
          <img src={FLOATING_CARD_BACK} alt="北风个人资料卡背面" draggable="false" />
          {!stickerDetached && peelableSticker && (
            <StickerPeel
              className="profile-card-back-sticker"
              imageSrc={BACK_STICKER}
              width="74%"
              rotate={0}
              peelBackHoverPct={24}
              peelBackActivePct={56}
              shadowIntensity={0.36}
              lightingIntensity={0.06}
              bounds={false}
              stopPropagation
              onDragRelease={sticker => {
                if (sticker.distance > 18) onStickerDetach?.(sticker);
              }}
            />
          )}
          {!stickerDetached && !peelableSticker && (
            <img className="profile-card-back-sticker profile-card-back-sticker--static" src={BACK_STICKER} alt="" draggable="false" />
          )}
        </div>
        {CARD_EDGE_LAYERS.map(layer => (
          <div
            key={layer}
            className="profile-card-3d__layer"
            style={{ '--card-layer-z': `${layer}px` }}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}

class SceneBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function AdaptiveLanyard({ frontImage, locale, backImage = LANYARD_CARD_BACK, onOpen }) {
  const scene = useRef(null);
  const [lite, setLite] = useState(() => window.NorthwindPerformance?.lite ?? true);
  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [awake, setAwake] = useState(!document.hidden);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const fail = useMemo(() => () => { setFailed(true); setReady(false); }, []);
  const markReady = useMemo(() => () => setReady(true), []);
  useEffect(() => {
    const sync = () => setLite(window.NorthwindPerformance?.lite ?? true);
    const visibility = () => setAwake(!document.hidden);
    window.addEventListener('northwind:performance-change', sync);
    document.addEventListener('visibilitychange', visibility);
    if (!window.IntersectionObserver) { setNear(true); setVisible(true); }
    const observer = window.IntersectionObserver && new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
      if (entry.isIntersecting) setNear(true);
    });
    observer?.observe(scene.current);
    return () => {
      observer?.disconnect();
      window.removeEventListener('northwind:performance-change', sync);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  const use3D = near && !lite && !failed && window.NorthwindPerformance?.supportsWebGL2();
  useEffect(() => {
    if (!use3D || ready) return;
    const timer = setTimeout(fail, 15000);
    return () => clearTimeout(timer);
  }, [use3D, ready, fail]);
  return <div ref={scene} className="lanyard-scene" data-scene-ready={Boolean(use3D && ready)}>
    {!(use3D && ready) && <div className="lanyard-fallback">
      <span className="lanyard-fallback__strap" aria-hidden="true" />
      <button type="button" className="lanyard-fallback__card" onClick={onOpen} aria-label={locale === 'en' ? 'Open profile card' : '查看资料卡'}>
        <img src={frontImage} width="720" height="1024" alt={locale === 'en' ? 'Northwind profile card' : '北风个人资料卡'} />
        <img className="lanyard-fallback__qr" src={QR_IMAGE} alt={locale === 'en' ? 'GitHub QR code' : 'GitHub 二维码'} />
      </button>
    </div>}
    {use3D && <SceneBoundary onError={fail}><Suspense fallback={null}>
      <Lanyard position={[-3, 0, 12]} gravity={[0, -40, 0]} frontImage={frontImage}
        backImage={backImage} lanyardImage={assetUrl('assets/lanyard/flying-lanyard.svg')}
        active={visible && awake} onReady={markReady} onError={fail} onCardDoubleClick={onOpen} />
    </Suspense></SceneBoundary>}
    <button type="button" className="lanyard-scene__hint" onClick={onOpen}>
      <span>{locale === 'en' ? 'VIEW PROFILE CARD' : '点击查看资料卡'}</span>
      <span>{use3D && ready ? (locale === 'en' ? 'DRAG TO INTERACT' : '可拖拽互动') : 'PROFILE CARD'}</span>
    </button>
  </div>;
}

function LanyardShowcase() {
  const [expanded, setExpanded] = useState(false);
  const [detachedBackSticker, setDetachedBackSticker] = useState(null);
  const [locale, setLocale] = useState(() => window.NorthwindI18n?.getLocale?.() || (document.documentElement.lang.startsWith('en') ? 'en' : 'zh'));
  const stickerPosition = useMemo(initialStickerPosition, []);
  const frontImage = locale === 'en'
    ? assetUrl('assets/images/flying-card-front-en.svg')
    : assetUrl('assets/images/flying-card-front.svg');

  useEffect(() => {
    const syncLocale = () => setLocale(window.NorthwindI18n?.getLocale?.() || (document.documentElement.lang.startsWith('en') ? 'en' : 'zh'));
    const observer = new MutationObserver(syncLocale);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    window.NorthwindI18n?.ready?.then(syncLocale);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!stickerLayer) return undefined;
    const contentObserver = typeof ResizeObserver === 'function' ? new ResizeObserver(syncStickerLayerHeight) : null;
    const main = document.querySelector('main');
    const footer = document.querySelector('.footer');
    if (main) contentObserver?.observe(main);
    if (footer) contentObserver?.observe(footer);
    let settleFrame = requestAnimationFrame(() => { settleFrame = requestAnimationFrame(syncStickerLayerHeight); });
    const settleTimer = window.setTimeout(syncStickerLayerHeight, 1000);
    window.NorthwindI18n?.ready?.then(syncStickerLayerHeight);
    syncStickerLayerHeight();
    window.addEventListener('resize', syncStickerLayerHeight);
    window.addEventListener('load', syncStickerLayerHeight);
    return () => {
      contentObserver?.disconnect();
      cancelAnimationFrame(settleFrame);
      window.clearTimeout(settleTimer);
      window.removeEventListener('resize', syncStickerLayerHeight);
      window.removeEventListener('load', syncStickerLayerHeight);
    };
  }, []);

  return (
    <>
      <AdaptiveLanyard
        frontImage={frontImage}
        locale={locale}
        backImage={detachedBackSticker ? FLOATING_CARD_BACK : LANYARD_CARD_BACK}
        onOpen={() => setExpanded(true)}
      />
      {stickerLayer && createPortal(
        <div className="home-sticker-position">
          <StickerPeel
            imageSrc={assetUrl('assets/images/flying-sticker.svg')}
            width={116}
            rotate={-11}
            peelBackHoverPct={20}
            peelBackActivePct={40}
            shadowIntensity={0.55}
            lightingIntensity={0.1}
            initialPosition={stickerPosition}
            bounds={stickerLayer}
            onDragRelease={saveStickerPosition}
          />
        </div>,
        stickerLayer
      )}
      {detachedBackSticker && stickerLayer && createPortal(
        <StickerPeel
          className="detached-back-sticker"
          imageSrc={BACK_STICKER}
          width={detachedBackSticker.width}
          rotate={0}
          peelBackHoverPct={20}
          peelBackActivePct={45}
          shadowIntensity={0.46}
          lightingIntensity={0.06}
          initialPosition={{ x: detachedBackSticker.x, y: detachedBackSticker.y }}
          bounds={stickerLayer}
        />,
        stickerLayer
      )}
      {expanded && createPortal(
        <FloatingProfileCard
          frontImage={frontImage}
          locale={locale}
          stickerDetached={Boolean(detachedBackSticker)}
          onStickerDetach={setDetachedBackSticker}
          onClose={() => setExpanded(false)}
        />,
        document.body
      )}

    </>
  );
}

if (mount) createRoot(mount).render(<LanyardShowcase />);
