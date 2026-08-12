import { createRoot } from 'react-dom/client';
import GridMotion from '../../components/GridMotion/GridMotion.jsx';

const root = document.getElementById('journeyGridMotion');
const distilledImages = [
  '蒸馏_余晖.webp',
  '蒸馏_光影之间.webp',
  '蒸馏_暮色.webp',
  '蒸馏_辽阔.webp',
  '蒸馏_远山.webp',
  '蒸馏_雪山.webp',
  '蒸馏_静谧时分.webp',
];
const imageItems = Array.from(
  { length: 28 },
  (_, index) => `assets/images/photography/${encodeURIComponent(distilledImages[index % distilledImages.length])}`,
);

if (root) createRoot(root).render(<GridMotion items={imageItems} gradientColor="#161616" />);
