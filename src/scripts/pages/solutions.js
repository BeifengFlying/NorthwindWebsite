const REPO = 'BeifengFlying/solutions';
const RAW_BASE = `https://raw.githubusercontent.com/${REPO}/main/`;
const API_BASE = `https://api.github.com/repos/${REPO}`;

const platformConfig = [
  { name: 'Online Judge', label: 'DLUOJ', aliases: ['online judge', 'oj', 'dluoj'], color: '#ff8a3d', back: '#d76123', sub: 'DLUOJ 题集' },
  { name: 'Luogu', label: 'Luogu', aliases: ['luogu'], color: '#7c9dff', back: '#5575d3', sub: 'Luogu 题集' },
  { name: 'LeetCode', label: 'LeetCode', aliases: ['leetcode', '力扣'], color: '#c9ef54', back: '#91b83b', sub: '面试与数据结构' },
  { name: 'Codeforces', label: 'Codeforces', aliases: ['codeforces', 'cf'], color: '#ec77b7', back: '#b34f85', sub: '竞赛编程' },
];

const fallbackData = [];
const state = { solutions: [], filter: 'all', query: '' };
const REQUEST_TIMEOUT = 8000;

const $ = (selector) => document.querySelector(selector);
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const normalizePlatform = (value) => {
  const text = String(value || '').trim().toLowerCase();
  return platformConfig.find((item) => item.aliases.includes(text))?.name || value || 'Online Judge';
};
const formatDate = (value) => {
  if (!value) return '—';
  const match = String(value).match(/(\d{4})[-./](\d{1,2})/);
  return match ? `${match[1]}.${String(match[2]).padStart(2, '0')}` : String(value);
};
const toDateValue = (value) => {
  const timestamp = Date.parse(value || '');
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error(`Request timed out: ${url}`);
      timeoutError.code = 'REQUEST_TIMEOUT';
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

function isTimeoutError(error) {
  return error?.code === 'REQUEST_TIMEOUT';
}

function createEntry(raw, fallbackPlatform = '') {
  const path = raw.path || raw.file || '';
  const fileTitle = path.split('/').pop()?.replace(/\.md$/i, '').replace(/[-_]/g, ' ') || '未命名题解';
  const tags = Array.isArray(raw.tags) ? raw.tags : String(raw.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
  const platform = normalizePlatform(raw.platform || fallbackPlatform || path.split('/')[0]);
  return {
    platform,
    title: raw.title || fileTitle,
    difficulty: raw.difficulty || '题解',
    tags,
    date: raw.date || raw.updated || raw.updatedAt || '',
    link: raw.link || raw.url || (path ? `https://github.com/${REPO}/blob/main/${path}` : `https://github.com/${REPO}`),
    path,
  };
}

async function fetchMetadata() {
  const urls = [`${RAW_BASE}metadata.json`, `https://raw.githubusercontent.com/${REPO}/master/metadata.json`];
  let timedOut = false;
  for (const url of urls) {
    try {
      const response = await fetchWithTimeout(url, { cache: 'no-store' });
      if (!response.ok) continue;
      const json = await response.json();
      if (Array.isArray(json)) return { data: json.map((item) => createEntry(item)), timedOut };
    } catch (error) {
      timedOut = timedOut || isTimeoutError(error);
    }
  }
  return { data: null, timedOut };
}

function parseMarkdownMetadata(markdown, path) {
  const frontMatter = markdown.match(/^---\s*\n([\s\S]*?)\n---/);
  const metadata = {};
  if (frontMatter) {
    frontMatter[1].split('\n').forEach((line) => {
      const match = line.match(/^([\w-]+):\s*(.+)$/);
      if (!match) return;
      let value = match[2].trim().replace(/^['"]|['"]$/g, '');
      if (value.startsWith('[') && value.endsWith(']')) value = value.slice(1, -1).split(',').map((item) => item.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
      metadata[match[1]] = value;
    });
  }
  const heading = markdown.match(/^#\s+(.+)$/m);
  return createEntry({ ...metadata, title: metadata.title || heading?.[1], path }, path.split('/')[0]);
}

async function fetchTreeEntries() {
  let markdownFiles = [];
  let activeBranch = 'main';
  let timedOut = false;
  for (const branch of ['main', 'master']) {
    try {
      const response = await fetchWithTimeout(`${API_BASE}/git/trees/${branch}?recursive=1`, { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' });
      if (!response.ok) continue;
      const json = await response.json();
      markdownFiles = (json.tree || []).filter((item) => item.type === 'blob' && /\.md$/i.test(item.path));
      activeBranch = branch;
      if (markdownFiles.length || json.tree) break;
    } catch (error) {
      timedOut = timedOut || isTimeoutError(error);
    }
  }
  if (!markdownFiles.length) return { data: [], timedOut };
  const entries = await Promise.all(markdownFiles.map(async (item) => {
    try {
      const response = await fetchWithTimeout(`https://raw.githubusercontent.com/${REPO}/${activeBranch}/${item.path}`, { cache: 'no-store' });
      if (response.ok) return parseMarkdownMetadata(await response.text(), item.path);
    } catch (error) {
      timedOut = timedOut || isTimeoutError(error);
    }
    return createEntry({ path: item.path }, item.path.split('/')[0]);
  }));
  return { data: entries, timedOut };
}

function folderPaper(entry) {
  return `<span>${escapeHTML(entry.title)}</span><em>${escapeHTML(entry.difficulty)}</em>`;
}

function platformTemplate(config, entries, index, total) {
  const papers = entries.slice(0, 3).map(folderPaper);
  const cards = entries.map((entry, cardIndex) => {
    const tags = entry.tags.length ? entry.tags.slice(0, 4).map((tag) => `<span class="solution-tag">${escapeHTML(tag)}</span>`).join('') : '<span class="solution-tag">算法</span>';
    return `<a class="solution-card" href="${escapeHTML(entry.link)}" target="_blank" rel="noopener" data-border-glow data-border-glow-palette="warm" data-border-glow-radius="0" data-border-glow-sensitivity="32" data-title="${escapeHTML(entry.title.toLowerCase())}" data-tags="${escapeHTML(entry.tags.join(' ').toLowerCase())}">
      <div class="solution-card-top"><span class="difficulty">${escapeHTML(entry.difficulty)}</span><span>${String(cardIndex + 1).padStart(2, '0')}</span></div>
      <h3 class="solution-title">${escapeHTML(entry.title)}</h3>
      <div class="solution-tags">${tags}</div>
      <div class="solution-footer"><span>${escapeHTML(formatDate(entry.date))}</span><span class="solution-link">查看题解 <span class="solution-arrow">↗</span></span></div>
    </a>`;
  }).join('');
  const folderItems = [...papers, ...Array(3 - papers.length).fill('')];
  const folderHTML = folderItems.map((paper, i) => `<div class="paper paper-${i + 1}">${paper}</div>`).join('');
  return `<section class="platform-section" data-platform="${escapeHTML(config.name)}" style="--folder-color:${config.color};--folder-back-color:${config.back};--accent:${config.color};">
    <div class="platform-head">
      <div class="platform-index">${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</div>
      <div class="platform-folder"><div class="folder-wrap"><div class="folder" tabindex="0" role="button" aria-expanded="false" aria-label="打开 ${escapeHTML(config.label || config.name)} 文件夹"><div class="folder__back">${folderHTML}<div class="folder__front"></div><div class="folder__front right"></div></div></div></div></div>
      <div><h2 class="platform-title">${escapeHTML(config.label || config.name)}</h2><p class="platform-sub">${escapeHTML(config.sub)}</p></div>
      <div class="platform-count"><strong>${entries.length}</strong> 题目</div>
    </div>
    ${entries.length ? `<div class="solution-grid">${cards}</div>` : '<div class="empty-state">暂时还没有题解~</div>'}
  </section>`;
}

function render() {
  const visible = state.solutions.filter((entry) => {
    const platformMatch = state.filter === 'all' || entry.platform === state.filter;
    const query = state.query.toLowerCase();
    return platformMatch && (!query || `${entry.title} ${entry.tags.join(' ')}`.toLowerCase().includes(query));
  });
  const visiblePlatforms = state.filter === 'all'
    ? platformConfig
    : platformConfig.filter((config) => config.name === state.filter);
  $('#platformList').innerHTML = visiblePlatforms.map((config, index) => platformTemplate(config, visible.filter((entry) => entry.platform === config.name), index, visiblePlatforms.length)).join('');
  $('#resultCount').textContent = String(visible.length).padStart(2, '0');
  $('#platformList').querySelectorAll('.folder').forEach((folder) => {
    const toggle = () => { const isOpen = folder.classList.toggle('open'); folder.setAttribute('aria-expanded', String(isOpen)); };
    folder.addEventListener('click', toggle);
    folder.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggle(); } });
  });
}

function filterSlug(value) {
  return value.toLowerCase().replace(/\s+/g, '-');
}

function filterFromHash() {
  const slug = decodeURIComponent(window.location.hash.slice(1)).toLowerCase();
  return platformConfig.find((config) => filterSlug(config.name) === slug)?.name || 'all';
}

function setFilter(value, updateHash = false) {
  state.filter = value === 'all' || platformConfig.some((config) => config.name === value) ? value : 'all';
  document.querySelectorAll('.filter-button').forEach((item) => item.classList.toggle('active', item.dataset.filter === state.filter));
  render();
  if (updateHash) history.replaceState(null, '', state.filter === 'all' ? window.location.pathname : `#${filterSlug(state.filter)}`);
}

function updateStats() {
  const dated = state.solutions.filter((entry) => entry.date).sort((a, b) => toDateValue(b.date) - toDateValue(a.date));
  $('#problemCount').textContent = String(state.solutions.length).padStart(2, '0');
  $('#lastUpdate').textContent = dated[0]?.date ? formatDate(dated[0].date) : '--';
}

async function init() {
  const metadataResult = await fetchMetadata();
  let timedOut = metadataResult.timedOut;
  const metadata = metadataResult.data;
  if (metadata) {
    state.solutions = metadata;
  } else {
    const treeResult = await fetchTreeEntries();
    state.solutions = treeResult.data;
    timedOut = timedOut || treeResult.timedOut;
  }

  if (timedOut && !state.solutions.length) {
    window.location.replace('/404.html?reason=timeout');
    return;
  }

  if (!state.solutions.length) state.solutions = fallbackData;
  updateStats();
  render();
  const syncState = $('#syncState');
  syncState.innerHTML = state.solutions.length ? '<i></i> 来自 GitHub 的实时数据' : '<i></i> 仓库已就绪';
  if (!metadata && !state.solutions.length) syncState.classList.add('offline');
}

$('#platformFilters').addEventListener('click', (event) => {
  const button = event.target.closest('[data-filter]');
  if (!button) return;
  setFilter(button.dataset.filter, true);
});
$('#solutionSearch').addEventListener('input', (event) => { state.query = event.target.value.trim(); render(); });
window.addEventListener('hashchange', () => setFilter(filterFromHash()));
setFilter(filterFromHash());
init();
