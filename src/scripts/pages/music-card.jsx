import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import TiltedCard from '../../components/TiltedCard/TiltedCard.jsx';

const root = document.getElementById('musicCoverRoot');

const getInitialSong = element => ({
  title: element?.dataset.title || '平凡之路',
  artist: element?.dataset.artist || '朴树',
  cover: element?.dataset.cover || 'assets/images/music/111/平凡之路.webp'
});

function MusicCard({ initialSong }) {
  const [song, setSong] = useState(initialSong);

  useEffect(() => {
    const handleSongChange = event => {
      const nextSong = event.detail;
      if (!nextSong?.cover) return;
      setSong(nextSong);
    };

    document.addEventListener('music:song-change', handleSongChange);
    return () => document.removeEventListener('music:song-change', handleSongChange);
  }, []);

  return (
    <TiltedCard
      imageSrc={song.cover}
      altText={`${song.title}专辑封面`}
      captionText={`${song.title} · ${song.artist}`}
      containerHeight="100%"
      containerWidth="100%"
      imageWidth="100%"
      aspectRatio="1 / 1"
      rotateAmplitude={12}
      scaleOnHover={1.08}
      showMobileWarning={false}
      showTooltip={false}
      displayOverlayContent={false}
    />
  );
}

if (root) createRoot(root).render(<MusicCard initialSong={getInitialSong(root)} />);
