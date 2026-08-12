import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { createRoot } from 'react-dom/client';
import AccordionGallery from '../../components/AccordionGallery/AccordionGallery.jsx';
import TiltedCard from '../../components/TiltedCard/TiltedCard.jsx';

const items = [
  {
    image: 'assets/images/photography/1785261471105-1280.webp',
    distilledImage: 'assets/images/photography/蒸馏_静谧时分.webp',
    label: '静谧时分',
    place: '昆明',
    aspectRatio: 3072 / 4096,
    note: '拍摄于昆明。'
  },
  {
    image: 'assets/images/photography/1785261471174-1280.webp',
    distilledImage: 'assets/images/photography/蒸馏_光影之间.webp',
    label: '光影之间',
    place: '昆明',
    aspectRatio: 2721 / 3642,
    note: '拍摄于昆明。'
  },
  {
    image: 'assets/images/photography/1785261471244-1280.webp',
    distilledImage: 'assets/images/photography/蒸馏_远山.webp',
    label: '远山',
    place: '乌鲁木齐',
    aspectRatio: 4096 / 1500,
    note: '拍摄于乌鲁木齐。'
  },
  {
    image: 'assets/images/photography/1785261471285-1280.webp',
    distilledImage: 'assets/images/photography/蒸馏_雪山.webp',
    label: '雪山',
    place: '乌鲁木齐',
    aspectRatio: 4096 / 3072,
    note: '拍摄于乌鲁木齐。'
  },
  {
    image: 'assets/images/photography/1785261471324-1280.webp',
    distilledImage: 'assets/images/photography/蒸馏_暮色.webp',
    label: '暮色',
    place: '昆明',
    aspectRatio: 2321 / 3036,
    note: '拍摄于昆明。'
  },
  {
    image: 'assets/images/photography/1785261471385-1280.webp',
    distilledImage: 'assets/images/photography/蒸馏_辽阔.webp',
    label: '辽阔',
    place: '乌鲁木齐',
    aspectRatio: 3794 / 2132,
    note: '拍摄于乌鲁木齐。'
  },
  {
    image: 'assets/images/photography/1785261471480-1280.webp',
    distilledImage: 'assets/images/photography/蒸馏_余晖.webp',
    label: '余晖',
    place: '大理',
    aspectRatio: 4096 / 3072,
    note: '拍摄于大理。'
  }
];

const root = document.getElementById('accordionGalleryRoot');

function PhotoDetail({ index, onClose, onSelect }) {
  const closeButtonRef = useRef(null);
  const item = items[index];
  const visualOnRight = index % 2 === 1;
  const cardWidth = `min(62vw, 760px, calc(68svh * ${item.aspectRatio}))`;

  useEffect(() => {
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') onSelect((index + 1) % items.length);
      if (event.key === 'ArrowLeft') onSelect((index - 1 + items.length) % items.length);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [index, onClose, onSelect]);

  return (
    <section
      className="photo-detail"
      role="dialog"
      aria-modal="true"
      aria-labelledby="photoDetailTitle"
    >
      <button
        className="photo-detail__backdrop"
        type="button"
        aria-label="关闭照片详情"
        style={{ backgroundImage: `linear-gradient(rgba(8, 9, 9, .68), rgba(8, 9, 9, .78)), url("${item.distilledImage}")` }}
        onClick={onClose}
      />
      <div className={`photo-detail__content${visualOnRight ? ' photo-detail__content--visual-right' : ''}`}>
        <div className="photo-detail__copy">
          <button ref={closeButtonRef} className="photo-detail__close" type="button" onClick={onClose}>
            关闭
          </button>
          <div className="photo-detail__index">{String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</div>
          <h2 id="photoDetailTitle">{item.label}</h2>
          <p className="photo-detail__place">{item.place} / 2025</p>
          <p className="photo-detail__note">{item.note}</p>
          <div className="photo-detail__actions" aria-label="切换照片">
            <button type="button" onClick={() => onSelect((index - 1 + items.length) % items.length)}>上一张</button>
            <button type="button" onClick={() => onSelect((index + 1) % items.length)}>下一张</button>
          </div>
        </div>
        <div className="photo-detail__visual">
          <TiltedCard
            imageSrc={item.image}
            altText={item.label}
            captionText={`${item.label} / ${item.place}`}
            containerHeight="auto"
            containerWidth={cardWidth}
            imageWidth={cardWidth}
            aspectRatio={item.aspectRatio}
            rotateAmplitude={7}
            scaleOnHover={1.03}
            showMobileWarning={false}
            showTooltip={true}
            displayOverlayContent={false}
          />
        </div>
      </div>
    </section>
  );
}

function PhotographyGallery() {
  const [selectedIndex, setSelectedIndex] = useState(null);

  return (
    <>
      <AccordionGallery
        items={items}
        defaultIndex={2}
        expandRatio={0.52}
        trigger="hover"
        showLabels={false}
        onItemClick={setSelectedIndex}
      />
      {selectedIndex !== null && createPortal(
        <PhotoDetail index={selectedIndex} onClose={() => setSelectedIndex(null)} onSelect={setSelectedIndex} />,
        document.body,
      )}
    </>
  );
}

if (root) {
  createRoot(root).render(<PhotographyGallery />);
}
