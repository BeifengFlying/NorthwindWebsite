import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Lanyard from '../../components/Lanyard/Lanyard.jsx';
import StickerPeel from '../../components/StickerPeel/StickerPeel.jsx';

const mount = document.getElementById('lanyardRoot');
const stickerLayer = document.getElementById('homeStickerLayer');
const QR_IMAGE = 'assets/images/github-qr.svg';
const FLOATING_CARD_BACK = '/assets/images/flying-card-back-clean.svg';
const BACK_STICKER = '/assets/images/flying-wordmark-sticker.svg';
const CARD_EDGE_LAYERS = [-2.6, -1.95, -1.3, -0.65, 0, 0.65, 1.3, 1.95, 2.6];
const DESKTOP_TIP_STORAGE_KEY = 'northwind-desktop-tip-dismissed';
const DESKTOP_TIP_SESSION_KEY = 'northwind-desktop-tip-seen';

function syncStickerLayerHeight() {
  if (!stickerLayer) return;
  const footer = document.querySelector('.footer');
  const contentBottom = footer ? footer.getBoundingClientRect().bottom + window.scrollY : document.body.scrollHeight;
  stickerLayer.style.height = `${Math.ceil(contentBottom)}px`;
}

syncStickerLayerHeight();

function initialStickerPosition() {
  if (typeof window === 'undefined') return { x: 0, y: 0 };
  return {
    x: Math.max(24, window.innerWidth - 190),
    y: window.scrollY + Math.max(240, window.innerHeight - 190)
  };
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
                if (sticker.distance > 18) onStickerDetach(sticker);
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

function LanyardShowcase() {
  const [expanded, setExpanded] = useState(false);
  const [showDesktopTip, setShowDesktopTip] = useState(false);
  const [dontRemind, setDontRemind] = useState(false);
  const [detachedBackSticker, setDetachedBackSticker] = useState(null);
  const [locale, setLocale] = useState(() => window.NorthwindI18n?.getLocale?.() || (document.documentElement.lang.startsWith('en') ? 'en' : 'zh'));
  const stickerPosition = useMemo(initialStickerPosition, []);
  const frontImage = locale === 'en' ? '/assets/images/flying-card-front-en.svg' : '/assets/images/flying-card-front.svg';

  useEffect(() => {
    const isCompactDevice = window.matchMedia('(max-width: 1024px), (hover: none) and (pointer: coarse)').matches;
    if (!isCompactDevice) return undefined;
    let dismissed = false;
    try {
      dismissed = window.localStorage.getItem(DESKTOP_TIP_STORAGE_KEY) === 'true'
        || window.sessionStorage.getItem(DESKTOP_TIP_SESSION_KEY) === 'true';
    } catch (error) {}
    if (!dismissed) setShowDesktopTip(true);
    return undefined;
  }, []);

  useEffect(() => {
    if (!showDesktopTip) return undefined;
    document.documentElement.classList.add('desktop-tip-open');
    document.body.classList.add('desktop-tip-open');
    return () => {
      document.documentElement.classList.remove('desktop-tip-open');
      document.body.classList.remove('desktop-tip-open');
    };
  }, [showDesktopTip]);

  const closeDesktopTip = () => {
    try {
      window.sessionStorage.setItem(DESKTOP_TIP_SESSION_KEY, 'true');
      if (dontRemind) window.localStorage.setItem(DESKTOP_TIP_STORAGE_KEY, 'true');
    } catch (error) {}
    setShowDesktopTip(false);
  };

  useEffect(() => {
    const syncLocale = () => setLocale(window.NorthwindI18n?.getLocale?.() || (document.documentElement.lang.startsWith('en') ? 'en' : 'zh'));
    const observer = new MutationObserver(syncLocale);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
    window.NorthwindI18n?.ready?.then(syncLocale);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!stickerLayer) return undefined;
    const contentObserver = new ResizeObserver(syncStickerLayerHeight);
    const main = document.querySelector('main');
    const footer = document.querySelector('.footer');
    if (main) contentObserver.observe(main);
    if (footer) contentObserver.observe(footer);
    const settleFrame = requestAnimationFrame(() => requestAnimationFrame(syncStickerLayerHeight));
    const settleTimer = window.setTimeout(syncStickerLayerHeight, 1000);
    window.NorthwindI18n?.ready?.then(syncStickerLayerHeight);
    syncStickerLayerHeight();
    window.addEventListener('resize', syncStickerLayerHeight);
    window.addEventListener('load', syncStickerLayerHeight);
    return () => {
      contentObserver.disconnect();
      cancelAnimationFrame(settleFrame);
      window.clearTimeout(settleTimer);
      window.removeEventListener('resize', syncStickerLayerHeight);
      window.removeEventListener('load', syncStickerLayerHeight);
    };
  }, []);

  return (
    <>
      <div className="lanyard-scene">
        <Lanyard
          position={[0, 0, 14]}
          gravity={[0, -40, 0]}
          frontImage={frontImage}
          backImage="/assets/images/flying-card-back.svg"
          imageFit="cover"
          lanyardImage="/assets/lanyard/flying-lanyard.svg"
          lanyardWidth={1}
          onCardDoubleClick={() => setExpanded(true)}
        />
        <div className="lanyard-scene__hint" role="note">
          <span>{locale === 'en' ? 'DRAG CARD' : '拖动卡片'}</span>
          <span>{locale === 'en' ? 'DOUBLE-CLICK TO ENLARGE' : '双击查看大图'}</span>
        </div>
      </div>
      {stickerLayer && createPortal(
        <div className="home-sticker-position">
          <StickerPeel
            imageSrc="/assets/images/flying-sticker.svg"
            width={116}
            rotate={-11}
            peelBackHoverPct={20}
            peelBackActivePct={40}
            shadowIntensity={0.55}
            lightingIntensity={0.1}
            initialPosition={stickerPosition}
            bounds={stickerLayer}
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
      {showDesktopTip && createPortal(
        <div className="desktop-tip-modal" role="dialog" aria-modal="true" aria-labelledby="desktopTipTitle">
          <button type="button" className="desktop-tip-modal__backdrop" onClick={closeDesktopTip} aria-label={locale === 'en' ? 'Close desktop tip' : '关闭提示'} />
          <div className="desktop-tip-modal__panel">
            <div className="desktop-tip-modal__card">
              <FloatingProfileCard
                frontImage={frontImage}
                locale={locale}
                stickerDetached={Boolean(detachedBackSticker)}
                onStickerDetach={setDetachedBackSticker}
                onClose={closeDesktopTip}
                variant="prompt"
                peelableSticker={false}
              />
            </div>
            <div className="desktop-tip-modal__copy">
              <div className="desktop-tip-modal__eyebrow">NORTHWIND / IDENTITY</div>
              <h2 id="desktopTipTitle">
                <span>建议使用桌面端</span>
                <span>Best on desktop</span>
              </h2>
              <p>
                <span>桌面端可获得更完整的 3D 互动体验</span>
                <span>Use a desktop browser for the full 3D experience</span>
              </p>
              <label className="desktop-tip-modal__check">
                <input type="checkbox" checked={dontRemind} onChange={event => setDontRemind(event.target.checked)} />
                <span>
                  <span>不再提醒</span>
                  <span>Don't remind me again</span>
                </span>
              </label>
            </div>
            <button type="button" className="desktop-tip-modal__close" onClick={closeDesktopTip} aria-label={locale === 'en' ? 'Close desktop tip' : '关闭提示'} title={locale === 'en' ? 'Close' : '关闭'}>×</button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

if (mount) createRoot(mount).render(<LanyardShowcase />);
