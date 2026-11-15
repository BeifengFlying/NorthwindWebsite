import { useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import AlbumRail from '../../components/AlbumRail/AlbumRail.jsx';
import songs from '../../config/music.json';

const root = document.getElementById('musicCoverRoot');
const selections = { '111': 2, '222': 0 };

function MusicCollection() {
  const [group, setGroup] = useState('111');
  const items = songs.filter(song => song.set === group);
  const handleIndex = useCallback(index => {
    selections[group] = index;
    const song = songs.filter(item => item.set === group)[index];
    if (song) document.dispatchEvent(new CustomEvent('music:song-change', { detail: song }));
  }, [group]);

  useEffect(() => {
    const button = document.getElementById('musicGroupToggle');
    const toggle = () => setGroup(value => value === '111' ? '222' : '111');
    button?.addEventListener('click', toggle);
    return () => button?.removeEventListener('click', toggle);
  }, []);

  return <AlbumRail key={group} items={items} startIndex={selections[group]} onIndexChange={handleIndex} />;
}

if (root) createRoot(root).render(<MusicCollection />);
