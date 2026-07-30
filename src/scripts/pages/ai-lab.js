const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
document.body.classList.add('motion-ready');

let revealObserver;

function setupRevealAnimations() {
  const targets = $$('.reveal-on-scroll:not([data-reveal-ready])');
  if (!targets.length) return;
  if (!('IntersectionObserver' in window)) {
    targets.forEach((element) => element.classList.add('is-visible'));
    return;
  }
  if (!revealObserver) {
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  }
  targets.forEach((element, index) => {
    element.dataset.revealReady = 'true';
    element.style.setProperty('--reveal-delay', `${Math.min(index * 55, 275)}ms`);
    revealObserver.observe(element);
  });
}

const stepData = {
  1: '先确认硬件，再决定模型规模',
  2: '量化版本决定了文件大小和一部分推理体验',
  3: '让模型尽可能进入 GPU，但不要牺牲系统稳定性',
  4: '先跑通，再根据任务逐项调参'
};

// Keep the timeline readable when the static page is opened directly and the
// browser blocks fetch() for local JSON files. Online deployments still use
// assets/data/timeline.json as the source of truth.
const fallbackTimeline = [
  { date: '2018.06', model: 'GPT-1', company: 'OpenAI', technology: 'Transformer Decoder / 117M', description: '证明语言模型可以先学习通用知识，再迁移到不同任务，基础模型范式开始发芽。', era: 'pretraining' },
  { date: '2019.02', model: 'GPT-2', company: 'OpenAI', technology: '1.5B / Zero-shot', description: '长文本生成与零样本能力让行业开始相信，规模会带来新的智能能力。', era: 'pretraining' },
  { date: '2020.06', model: 'GPT-3', company: 'OpenAI', technology: '175B / In-context Learning', description: 'Prompt 即可完成任务，催生提示工程、Agent 雏形和大模型创业潮。', era: 'pretraining' },
  { date: '2022.11', model: 'ChatGPT', company: 'OpenAI', technology: 'GPT-3.5 / RLHF', description: '模型从“会生成文字”变成“像助手一样交流”，两个月破亿用户。', era: 'chat' },
  { date: '2023.03', model: 'GPT-4', company: 'OpenAI', technology: '推理 / 图像 / 编程', description: '行业标准从语言模型提升到通用智能模型，能力门槛被重新定义。', era: 'multimodal' },
  { date: '2023.03', model: 'Claude 1', company: 'Anthropic', technology: 'Constitutional AI', description: '以安全、长文本和企业应用为核心路线，成为 GPT 的重要竞争者。', era: 'multimodal' },
  { date: '2023.07', model: 'Llama 2', company: 'Meta', technology: 'Open Weights', description: '开源模型开始爆发，更多团队拥有训练和部署自己模型的可能。', era: 'multimodal' },
  { date: '2023.11', model: 'Grok 1', company: 'xAI', technology: '实时互联网 / X', description: '把实时世界信息与社交网络接入模型，形成 AI + 社交的新分枝。', era: 'multimodal' },
  { date: '2023.12', model: 'Gemini 1.0', company: 'Google DeepMind', technology: '原生多模态', description: '从一开始就理解文字、图像、音频和视频，而非从文字模型后补能力。', era: 'multimodal' },
  { date: '2024.05', model: 'GPT-4o', company: 'OpenAI', technology: 'Omni / 实时语音视觉', description: '模型从 Chatbot 走向实时 AI 助手，交互开始自然地跨越语音、图片与视频。', era: 'efficiency' },
  { date: '2024.05', model: 'DeepSeek-V2', company: 'DeepSeek', technology: 'MoE / MLA / 236B', description: '每次只激活约 21B 参数，证明高性能不必依赖暴力堆叠算力。', era: 'efficiency' },
  { date: '2024', model: 'Kimi', company: 'Moonshot AI', technology: '超长上下文 / 中文长文', description: '把长文理解和中文场景带到大众视野，形成面向真实阅读任务的分枝。', era: 'efficiency' },
  { date: '2024', model: 'GLM-4', company: '智谱 AI', technology: '中文 / 企业 / Agent', description: '国产通用模型向企业服务和 Agent 能力延展。', era: 'efficiency' },
  { date: '2024', model: 'Qwen2.5', company: '阿里通义千问', technology: '多尺寸 / 商业部署', description: '兼顾中文能力、开源生态和商业部署，成为重要的国产开源分枝。', era: 'efficiency' },
  { date: '2024.12', model: 'DeepSeek-V3', company: 'DeepSeek', technology: 'MoE 优化 / 训练效率', description: '训练效率与开源能力的突破，让全球重新关注中国大模型路线。', era: 'efficiency' },
  { date: '2025.01', model: 'DeepSeek-R1', company: 'DeepSeek', technology: 'GRPO / 推理强化学习', description: '模型从预测下一个 token，开始主动思考；开源推理模型进入主舞台。', era: 'reasoning' },
  { date: '2025', model: 'OpenAI o3 / GPT-5 系列', company: 'OpenAI', technology: '推理 / 工具调用 / Agent', description: '模型不只回答问题，也开始分析、调用工具并完成连续任务。', era: 'reasoning' },
  { date: '2025', model: 'Claude 4 / Opus', company: 'Anthropic', technology: '代码 Agent', description: '长链路的软件工程任务成为重点，模型开始参与更完整的开发流程。', era: 'reasoning' },
  { date: '2025', model: 'Gemini 2.5', company: 'Google', technology: '长上下文 / 推理 / Agent', description: '超长上下文与推理能力结合，进一步扩大复杂任务的可执行范围。', era: 'reasoning' },
  { date: '2025', model: 'Grok 3 / 4', company: 'xAI', technology: '实时数据 / 数学推理', description: '大规模训练与实时世界数据结合，继续探索推理的上限。', era: 'reasoning' },
  { date: '2026', model: 'GPT-5.5', company: 'OpenAI', technology: 'Agentic Coding / 长任务', description: '面向实际工作流，强调代码、科研辅助与更长程的任务执行。', era: 'agent' },
  { date: '2026', model: 'Claude 5', company: 'Anthropic', technology: '长时间 Agent / 企业工作流', description: '把软件开发与企业流程作为长期 Agent 的核心场景。', era: 'agent' },
  { date: '2026', model: 'Gemini 3.5', company: 'Google DeepMind', technology: 'Agent / 多模态理解', description: '进一步聚焦复杂任务执行和跨模态理解。', era: 'agent' },
  { date: '2026', model: 'DeepSeek-V4', company: 'DeepSeek', technology: 'MoE / 推理效率 / 开源', description: 'V2、V3、R1 到 V4 的技术路线，持续强化高效推理和开源生态。', era: 'agent' },
  { date: '2026', model: 'Qwen3.7', company: '阿里通义千问', technology: '多模态 / 企业应用', description: '从中文模型走向全球开源生态竞争者，面向企业级任务执行。', era: 'agent' },
  { date: '2026', model: 'Kimi K2.7', company: 'Moonshot AI', technology: 'Agent Coding / 长任务', description: '将长任务软件开发作为 Agent 能力的关键落点。', era: 'agent' },
  { date: '2026', model: 'GLM-5.2', company: '智谱 AI', technology: '百万级上下文 / 推理', description: '围绕长上下文、推理与企业应用继续扩展。', era: 'agent' },
  { date: '2026', model: 'Grok 4.x', company: 'xAI', technology: '实时世界模型 / X 生态', description: '沿着实时信息、社交生态与推理能力继续生长。', era: 'agent' }
];

function setupStepper() {
  const stepper = $('#lmStepper');
  if (!stepper) return;
  let current = 1;
  const total = $$('.step-indicator', stepper).length;
  const indicators = $$('.step-indicator', stepper);
  const panels = $$('.step-panel', stepper);
  const connectors = $$('.step-connector', stepper);
  const back = $('#stepBack');
  const next = $('#stepNext');
  const hint = $('#stepHint');
  const complete = $('#stepComplete');

  function render(nextStep, direction = 1) {
    current = nextStep;
    stepper.dataset.step = String(current);
    $('#stepCurrent').textContent = String(current).padStart(2, '0');
    hint.textContent = stepData[current];
    indicators.forEach((indicator, index) => {
      const number = index + 1;
      indicator.classList.toggle('active', number === current);
      indicator.classList.toggle('complete', number < current);
      indicator.setAttribute('aria-selected', String(number === current));
    });
    connectors.forEach((connector, index) => connector.classList.toggle('complete', index < current - 1));
    panels.forEach((panel) => {
      const isCurrent = Number(panel.dataset.stepPanel) === current;
      panel.hidden = !isCurrent;
      panel.classList.toggle('active', isCurrent);
      if (isCurrent) {
        panel.style.animationName = direction > 0 ? 'step-in' : 'step-in-back';
      }
    });
    back.disabled = current === 1;
    next.querySelector('span').textContent = current === total ? '完成' : '继续';
  }

  function finish() {
    $$('.stepper-head, .step-indicators, .step-viewport, .stepper-footer', stepper).forEach((element) => { element.hidden = true; });
    complete.hidden = false;
  }

  indicators.forEach((indicator) => indicator.addEventListener('click', () => {
    const target = Number(indicator.dataset.stepTarget);
    if (target !== current) render(target, target > current ? 1 : -1);
  }));
  back.addEventListener('click', () => render(current - 1, -1));
  next.addEventListener('click', () => current === total ? finish() : render(current + 1, 1));
  $('#stepRestart').addEventListener('click', () => {
    $$('.stepper-head, .step-indicators, .step-viewport, .stepper-footer', stepper).forEach((element) => { element.hidden = false; });
    complete.hidden = true;
    render(1, -1);
  });

  $$('[data-param="temperature"]', stepper).forEach((input) => input.addEventListener('input', () => { input.previousElementSibling.querySelector('b').textContent = Number(input.value).toFixed(2); }));
  $$('[data-param="context"]', stepper).forEach((input) => input.addEventListener('input', () => { input.previousElementSibling.querySelector('b').textContent = `${input.value}K`; }));
  $$('[data-param="repeat"]', stepper).forEach((input) => input.addEventListener('input', () => { input.previousElementSibling.querySelector('b').textContent = Number(input.value).toFixed(2); }));
}

function renderModels(models) {
  const grid = $('#modelsGrid');
  grid.innerHTML = models.map((model, index) => `
    <article class="model-card reveal-on-scroll">
      <div class="model-card-top"><span class="model-number">${String(index + 1).padStart(2, '0')}</span><span>模型记录 / 0${index + 1}</span></div>
      <h3 class="model-name">${model.name}</h3>
      <p class="model-architecture">${model.architecture} / ${model.tags.join(' / ')}</p>
      <p class="model-description">${model.description}</p>
      <div class="model-columns"><div><h4>优势</h4><ul>${model.advantages.map((item) => `<li>${item}</li>`).join('')}</ul></div><div><h4>限制</h4><ul class="limits">${model.limitations.map((item) => `<li>${item}</li>`).join('')}</ul></div></div>
      <div class="model-bottom">${model.scenarios.map((item) => `<span>${item}</span>`).join('')}</div>
      <p class="model-experience">部署记录 / ${model.experience}</p>
    </article>`).join('');
  setupRevealAnimations();
}

function renderTimeline(entries) {
  const eras = [
    { id: 'pretraining', range: '2018 - 2020', title: '训练一个大脑', note: 'Transformer 预训练时代' },
    { id: 'chat', range: '2022', title: '让大众使用 AI', note: 'RLHF / 对话革命' },
    { id: 'multimodal', range: '2023', title: '能力开始分枝', note: '多模态 / 开源 / 安全' },
    { id: 'efficiency', range: '2024', title: '树冠快速展开', note: '实时交互 / MoE / 长上下文' },
    { id: 'reasoning', range: '2025', title: '模型学会思考', note: '推理 / 工具调用 / 代码 Agent' },
    { id: 'agent', range: '2026', title: '枝叶指向行动', note: '长任务 / 多模态 / Agent' }
  ];
  const sidePattern = ['left', 'right', 'right', 'left', 'left', 'right'];
  const branchOffsets = [0, 18, 34, 10, 42, 24];
  const eraShape = {
    pretraining: { reach: 52, spacing: 132 },
    chat: { reach: 68, spacing: 140 },
    multimodal: { reach: 92, spacing: 146 },
    efficiency: { reach: 112, spacing: 154 },
    reasoning: { reach: 136, spacing: 160 },
    agent: { reach: 162, spacing: 166 }
  };
  const eraForEntry = (entry) => {
    if (entry.era) return entry.era;
    const year = Number(String(entry.year || entry.date).slice(0, 4));
    if (year <= 2020) return 'pretraining';
    if (year === 2022) return 'chat';
    if (year === 2023) return 'multimodal';
    if (year === 2024) return 'efficiency';
    if (year === 2025) return 'reasoning';
    return 'agent';
  };
  const groups = eras.map((era) => ({ ...era, entries: entries.filter((entry) => eraForEntry(entry) === era.id) })).filter((era) => era.entries.length);

  const tree = groups.map((era) => {
    const shape = eraShape[era.id];
    return `
    <section class="tree-era tree-era--${era.id}" aria-label="${era.range} ${era.title}" style="--tree-reach:${shape.reach}px;--tree-row-height:${shape.spacing}px">
      <div class="tree-era-marker"><span>${era.range}</span><strong>${era.title}</strong><em>${era.note}</em></div>
      ${era.entries.map((entry, index) => {
        const side = sidePattern[index % sidePattern.length];
        const branchOffset = branchOffsets[index % branchOffsets.length];
        return `<article class="tree-leaf tree-leaf--${side} reveal-on-scroll" style="--tree-row:${Math.floor(index / 2) + 2};--leaf-shift:${branchOffset}px">
          <time class="tree-date" datetime="${entry.date}">${entry.date}</time>
          <div class="tree-leaf-heading"><strong>${entry.model}</strong><span>${entry.company}</span></div>
          <span class="tree-tech">${entry.technology}</span>
          <p>${entry.description}</p>
        </article>`;
      }).join('')}
    </section>
  `;
  }).join('');

  $('#timelineTrack').innerHTML = `<div class="tree-seed"><span></span><strong>Seed / 2018</strong><small>预训练开始发芽</small></div>${tree}<div class="tree-canopy"><span></span><strong>2026 / Agent Era</strong><small>从回答问题，走向完成任务</small></div>`;
  setupRevealAnimations();
}

function setupSizeExplorer() {
  const sizes = [
    ['1B', '轻量 / 端侧友好', '响应快、资源占用低，适合做功能验证和简单任务'],
    ['7B', '实用的起点', '速度、质量和硬件要求之间比较容易取得平衡，适合先验证一条本地工作流'],
    ['14B', '更完整的能力', '知识和复杂任务能力更稳，但需要更严格地管理显存、上下文和量化'],
    ['32B', '开始有重量', '复杂任务的上限更高，加载时间和硬件成本也会明显增加'],
    ['70B+', '部署的边界', '更多时候需要多卡、极致量化或云端资源，本地体验不再轻松']
  ];
  const range = $('#sizeRange');
  const buttons = $$('.size-scale button');
  function update(index) {
    const [size, title, description] = sizes[index];
    range.value = index;
    $('#sizeTitle').textContent = `${size} / ${title}`;
    $('#sizeDescription').textContent = description;
    buttons.forEach((button) => button.classList.toggle('active', button.dataset.size === size));
  }
  range.addEventListener('input', () => update(Number(range.value)));
  buttons.forEach((button, index) => button.addEventListener('click', () => update(index)));
}

async function loadData() {
  const [modelsResult, timelineResult] = await Promise.allSettled([
    fetch('assets/data/models.json').then((response) => {
      if (!response.ok) throw new Error('models.json unavailable');
      return response.json();
    }),
    fetch('assets/data/timeline.json').then((response) => {
      if (!response.ok) throw new Error('timeline.json unavailable');
      return response.json();
    })
  ]);
  if (modelsResult.status === 'fulfilled') renderModels(modelsResult.value);
  if (timelineResult.status === 'fulfilled') renderTimeline(timelineResult.value);
  else renderTimeline(fallbackTimeline);
}

setupStepper();
setupSizeExplorer();
setupRevealAnimations();
loadData().catch((error) => {
  console.error(error);
  renderTimeline(fallbackTimeline);
});
