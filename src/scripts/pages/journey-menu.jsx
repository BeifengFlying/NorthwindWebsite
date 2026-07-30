import { createRoot } from 'react-dom/client';
import InfiniteMenu from '../../components/InfiniteMenu.jsx';

const root = document.getElementById('infiniteMenuRoot');
const items = [
  { order: 1, title: '想法', description: '从一个属于自己的数字空间开始', link: '#idea', theme: 'idea', accent: '#ff70e8' },
  { order: 2, title: '规划', description: '让不同兴趣拥有自己的入口', link: '#planning', theme: 'planning', accent: '#ff8a3d' },
  { order: 3, title: '设计', description: '把秩序、颜色和情绪放在一起', link: '#design', theme: 'design', accent: '#ffd84d' },
  { order: 4, title: '开发', description: '把设计变成真实可用的交互', link: '#development', theme: 'development', accent: '#78f58a' },
  { order: 5, title: '打磨', description: '让细节更轻，让体验更顺', link: '#optimization', theme: 'optimization', accent: '#62e8e8' },
  { order: 6, title: '上线', description: '从本地文件，到公开的地址', link: '#deployment', theme: 'deployment', accent: '#4d83ff' },
];

if (root) createRoot(root).render(<InfiniteMenu items={items} scale={1} />);
