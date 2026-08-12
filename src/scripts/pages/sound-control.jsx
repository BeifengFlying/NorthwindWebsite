import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { ChakraProvider, Icon, defaultSystem } from '@chakra-ui/react';
import { RiCloseLine, RiVolumeDownFill, RiVolumeUpFill } from 'react-icons/ri';
import ElasticSlider from '../../components/ElasticSlider/ElasticSlider.jsx';
import GlassSurface from '../../components/GlassSurface/GlassSurface.jsx';

const root = document.getElementById('soundControlRoot');
const savedVolume = window.NorthwindSound?.getVolume?.() ?? 0.75;
const initialVolume = Math.min(1, Math.max(0, savedVolume));

// Every slider position has a deterministic, distinct question whose answer is the position.
const volumeProblems = Array.from({ length: 101 }, (_, answer) => {
  if (answer === 0) return '1 - 1';
  if (answer === 1) return 'lim x->0 sin(x) / x';
  if (answer === 2) return '1 + 1';
  if (answer === 3) return 'sqrt(9)';
  if (answer === 4) return '2^2';
  if (answer === 5) return 'log10(100000)';
  if (answer === 6) return 'x + 4 = 10';
  if (answer === 7) return '2x + 1 = 15';
  if (answer === 8) return 'sqrt(64)';
  if (answer === 9) return 'int[0,3] 2x dx';
  if (answer === 10) return 'sum(k=1..10) 1';
  if (answer === 15) return 'x^2 = 225, x > 0';

  switch (answer % 5) {
    case 0: return `int[0,1] ${answer} dx`;
    case 1: return `lim x->0 sin(${answer}x) / x`;
    case 2: return `d/dx(${answer}x^2/2)|x=1`;
    case 3: return `det[[${answer},0],[0,1]]`;
    case 4: return `ln(e^${answer})`;
    default: return `sum(k=1..${answer}) 1`;
  }
});

function SoundControl() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(false);

  useEffect(() => {
    let frame = 0;
    const syncBottomState = () => {
      frame = 0;
      const distanceToBottom = document.documentElement.scrollHeight - (window.scrollY + window.innerHeight);
      setIsAtBottom(distanceToBottom <= 24);
    };
    const scheduleSync = () => {
      if (frame) return;
      frame = requestAnimationFrame(syncBottomState);
    };

    window.addEventListener('scroll', scheduleSync, { passive: true });
    window.addEventListener('resize', scheduleSync, { passive: true });
    scheduleSync();

    return () => {
      window.removeEventListener('scroll', scheduleSync);
      window.removeEventListener('resize', scheduleSync);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    if (isAtBottom) setIsOpen(false);
    root?.classList.toggle('is-open', isOpen && !isAtBottom);
    root?.classList.toggle('is-at-bottom', isAtBottom);
  }, [isOpen, isAtBottom]);

  const handleChange = value => {
    window.NorthwindSound?.setVolume?.(value / 100);
    window.NorthwindSound?.unlock?.();
  };

  return (
    <GlassSurface
      width="100%"
      height={72}
      borderRadius={36}
      borderWidth={0.06}
      brightness={50}
      opacity={0.93}
      blur={11}
      displace={0.5}
      backgroundOpacity={0}
      saturation={1}
      distortionScale={-180}
      redOffset={0}
      greenOffset={10}
      blueOffset={20}
      mixBlendMode="difference"
      className="sound-control__surface"
    >
      <div className="sound-control__view sound-control__view--collapsed" aria-hidden={isOpen || isAtBottom}>
        <button
          type="button"
          className="sound-control__trigger"
          aria-label="打开音量控制"
          aria-expanded={isOpen}
          title="打开音量控制"
          tabIndex={isOpen || isAtBottom ? -1 : 0}
          onClick={() => setIsOpen(true)}
        >
          <Icon as={RiVolumeUpFill} aria-hidden="true" />
        </button>
      </div>

      <div className="sound-control__view sound-control__view--expanded" aria-hidden={!isOpen || isAtBottom}>
        <button
          type="button"
          className="sound-control__close"
          aria-label="收起音量控制"
          title="收起音量控制"
          tabIndex={isOpen && !isAtBottom ? 0 : -1}
          onClick={() => setIsOpen(false)}
        >
          <Icon as={RiCloseLine} aria-hidden="true" />
        </button>
        <ElasticSlider
          className="sound-control__slider"
          leftIcon={<Icon as={RiVolumeDownFill} aria-hidden="true" />}
          rightIcon={<Icon as={RiVolumeUpFill} aria-hidden="true" />}
          startingValue={0}
          defaultValue={Math.round(initialVolume * 100)}
          maxValue={100}
          isStepped
          stepSize={1}
          onChange={handleChange}
          valueFormatter={value => volumeProblems[value]}
        />
      </div>
    </GlassSurface>
  );
}

if (root) {
  createRoot(root).render(
    <ChakraProvider value={defaultSystem}>
      <SoundControl />
    </ChakraProvider>
  );
}
