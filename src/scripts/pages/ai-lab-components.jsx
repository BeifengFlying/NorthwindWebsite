import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Aurora from '../../components/Aurora/Aurora.jsx';
import ScrollStack, { ScrollStackItem } from '../../components/ScrollStack/ScrollStack.jsx';

const auroraRoot = document.getElementById('aiLabAuroraRoot');
const stackRoot = document.getElementById('aiLabStackRoot');

if (auroraRoot) {
  createRoot(auroraRoot).render(
    <Aurora
      colorStops={['#7cff67', '#B497CF', '#5227FF']}
      blend={0.5}
      amplitude={1}
      speed={0.5}
    />
  );
}

const fallbackNotes = [
  {
    index: '01',
    label: 'FIELD NOTE / 01',
    title: '先让模型跑起来',
    body: '本地部署的第一步不是追逐最大的参数量，而是把硬件、格式与运行时的边界摸清。一次成功的推理，比一张参数表更有价值。',
    meta: 'HARDWARE / RUNTIME',
    tone: 'green'
  },
  {
    index: '02',
    label: 'FIELD NOTE / 02',
    title: '量化是取舍，不是妥协',
    body: 'Q4、Q5、Q8 让同一个模型在不同机器上拥有不同的节奏。文件变小以后，真正需要观察的是回答质量与响应速度的平衡。',
    meta: 'GGUF / MLX / Q4',
    tone: 'violet'
  },
  {
    index: '03',
    label: 'FIELD NOTE / 03',
    title: '把观察写进工作流',
    body: '记录上下文长度、GPU Offload、首 token 延迟和真实任务表现。模型只有进入工作流，才会从“能用”变成“值得留下”。',
    meta: 'OBSERVE / MEASURE',
    tone: 'orange'
  },
  {
    index: '04',
    label: 'FIELD NOTE / 04',
    title: '下一步是行动能力',
    body: '从回答问题到调用工具，再到完成长任务，本地模型的下一条边界不只是更聪明，而是更稳定地参与真实工作。',
    meta: 'AGENT / LONG TASK',
    tone: 'cyan'
  }
];

function StackNote({ note }) {
  return (
    <ScrollStackItem itemClassName={`lab-stack-card lab-stack-card--${note.tone}`}>
      <div className="lab-stack-card__top">
        <span>{note.label}</span>
        <b>{note.index}</b>
      </div>
      <div className="lab-stack-card__body">
        <div>
          <p className="lab-stack-card__signal">LOCAL INTELLIGENCE / RUNNING</p>
          <h3>{note.title}</h3>
          <p>{note.body}</p>
        </div>
        <span className="lab-stack-card__meta">{note.meta}</span>
      </div>
      <span className="lab-stack-card__mark" aria-hidden="true" />
    </ScrollStackItem>
  );
}

function LabStack() {
  const [notes, setNotes] = useState(fallbackNotes);

  useEffect(() => {
    fetch('assets/data/models.json')
      .then(response => (response.ok ? response.json() : Promise.reject(new Error('model notes unavailable'))))
      .then(models => {
        if (!Array.isArray(models) || !models.length) return;
        setNotes(current => current.map((note, index) => {
          const model = models[index % models.length];
          return index === 2 && model
            ? { ...note, title: `${model.name} / 现场记录`, body: model.description, meta: model.tags.join(' / ') }
            : note;
        }));
      })
      .catch(() => {});
  }, []);

  return (
    <ScrollStack
      className="lab-stack-scroller"
      itemDistance={88}
      itemScale={0.035}
      itemStackDistance={28}
      stackPosition="18%"
      scaleEndPosition="8%"
      baseScale={0.86}
      rotationAmount={0.7}
      blurAmount={0.4}
      useWindowScroll={false}
    >
      {notes.map(note => <StackNote key={note.index} note={note} />)}
    </ScrollStack>
  );
}

if (stackRoot) createRoot(stackRoot).render(<LabStack />);
