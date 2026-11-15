import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import './GridMotion.css';

const GridMotion = ({ items = [], gradientColor = 'black' }) => {
  const gridRef = useRef(null);
  const rowRefs = useRef([]);
  const totalItems = 28;
  const defaultItems = Array.from({ length: totalItems }, (_, index) => `Item ${index + 1}`);
  const combinedItems = items.length > 0 ? items.slice(0, totalItems) : defaultItems;

  useEffect(() => {
    if (window.NorthwindPerformance?.lite) return;
    let visible = false;
    const moves = rowRefs.current.map((row, index) => gsap.quickTo(row, 'x', {
      duration: 0.8 + [0.6, 0.4, 0.3, 0.2][index], ease: 'power3.out'
    }));
    const handleMouseMove = event => {
      if (!visible || document.hidden) return;
      moves.forEach((move, index) => move((event.clientX / window.innerWidth * 300 - 150) * (index % 2 === 0 ? 1 : -1)));
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) moves.forEach(move => move.tween.pause());
    });
    observer.observe(gridRef.current);
    const pause = () => { if (document.hidden) moves.forEach(move => move.tween.pause()); };
    window.addEventListener('pointermove', handleMouseMove, { passive: true });
    document.addEventListener('visibilitychange', pause);
    return () => {
      observer.disconnect();
      window.removeEventListener('pointermove', handleMouseMove);
      document.removeEventListener('visibilitychange', pause);
      moves.forEach(move => move.tween.kill());
    };
  }, []);

  return <div className="noscroll loading" ref={gridRef}>
    <section className="intro" style={{ background: `radial-gradient(circle, ${gradientColor} 0%, transparent 100%)` }}>
      <div className="gridMotion-container">
        {[...Array(4)].map((_, rowIndex) => <div key={rowIndex} className="row" ref={el => { rowRefs.current[rowIndex] = el; }}>
          {[...Array(7)].map((_, itemIndex) => {
            const content = combinedItems[rowIndex * 7 + itemIndex];
            return <div key={itemIndex} className="row__item"><div className="row__item-inner" style={{ backgroundColor: '#111' }}>
              {typeof content === 'string' && content.startsWith('http') || typeof content === 'string' && content.includes('/') ? <div className="row__item-img" style={{ backgroundImage: `url(${content})` }} /> : <div className="row__item-content">{content}</div>}
            </div></div>;
          })}
        </div>)}
      </div>
      <div className="fullview" />
    </section>
  </div>;
};

export default GridMotion;
