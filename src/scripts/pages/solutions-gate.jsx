import { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createPortal } from 'react-dom';
import Shuffle from '../../components/Shuffle.jsx';
import DecryptedText from '../../components/DecryptedText.jsx';
import GlassSurface from '../../components/GlassSurface/GlassSurface.jsx';

const SKIP_KEY = 'northwind-solutions-skip-count';
const ACCESS_KEY = 'northwind-solutions-ac-passed';

const languageOptions = [
  { id: 'cpp', label: 'C++', mode: 'C++17' },
  { id: 'c', label: 'C', mode: 'C11' },
  { id: 'python', label: 'Python', mode: 'Python 3' },
  { id: 'java', label: 'Java', mode: 'JDK 17' },
  { id: 'go', label: 'Go', mode: 'Go 1.22' },
];

// Keep every assessment editor blank so no accepted solution is exposed by default.
const starterCode = {
  cpp: '',
  c: '',
  python: '',
  java: '',
  go: '',
};

const readSkipCount = () => {
  try {
    const value = Number.parseInt(window.localStorage.getItem(SKIP_KEY) || '0', 10);
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
};

const writeSkipCount = (value) => {
  try {
    window.localStorage.setItem(SKIP_KEY, String(value));
  } catch {
    // Private browsing can make localStorage unavailable; the in-page count still works.
  }
};

const readAccess = () => {
  try {
    return window.localStorage.getItem(ACCESS_KEY) === 'true';
  } catch {
    return false;
  }
};

const writeAccess = () => {
  try {
    window.localStorage.setItem(ACCESS_KEY, 'true');
  } catch {
    // Keep the current page unlocked when localStorage is unavailable.
  }
};

function formatCount(value) {
  return String(value).padStart(3, '0');
}

function escapeCode(value) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character]));
}

function highlightCode(code, language) {
  const source = code;
  const tokenPattern = /(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"])*"|'(?:\\.|[^'])*'|\b\d+(?:\.\d+)?\b|\b(?:int|long|float|double|bool|char|string|void|const|auto|struct|class|public|private|static|package|import|func|var|type|map|range|for|while|if|else|return|def|from|as|new|using|namespace|true|false|null|None|nil)\b)/g;
  const parts = [];
  let cursor = 0;
  let match;
  while ((match = tokenPattern.exec(source))) {
    if (match.index > cursor) parts.push(<span key={`${cursor}-plain`}>{source.slice(cursor, match.index)}</span>);
    const token = match[0];
    const type = /^(\/\/|#|\/\*)/.test(token)
      ? 'comment'
        : /^("|'|`)/.test(token)
        ? 'string'
        : /^\d/.test(token)
          ? 'number'
          : 'keyword';
    parts.push(<span key={`${match.index}-${token}`} className={`syntax-${type}`}>{token}</span>);
    cursor = match.index + token.length;
  }
  if (cursor < source.length) parts.push(<span key={`${cursor}-tail`}>{source.slice(cursor)}</span>);
  return parts;
}

function updateProgressSurface(value, passed) {
  const board = document.querySelector('#gateSkipBoard');
  const successBoard = document.querySelector('#gateSuccessBoard');
  if (board) {
    board.hidden = passed || value <= 0;
    board.setAttribute('aria-label', `已跳过 ${value} 次考核`);
  }
  if (successBoard) successBoard.hidden = !passed;
}

function evaluateCode(code, language) {
  const source = code.toLowerCase();
  const common = /main|print|println/.test(source) && /(answer|count|map|counter|hash)/.test(source);
  const checks = {
    cpp: common && /unordered_map|map|sort|binary_search/.test(source) && /cin|scanf/.test(source),
    c: common && /qsort|sort|binary|count_value/.test(source) && /scanf/.test(source),
    python: common && /counter|dict|collections/.test(source) && /print\s*\(/.test(source),
    java: common && /hashmap|treemap|map</.test(source) && /system\.out/.test(source),
    go: common && /package\s+main|func\s+main/.test(source) && /map\[|map\s*\(/.test(source) && /fmt\.print/.test(source),
  };
  return Boolean(checks[language]);
}

function SignalText() {
  const [cycle, setCycle] = useState(0);
  const copy = 'ACCESS SIGNAL // READY';

  useEffect(() => {
    const timer = window.setInterval(() => setCycle((value) => value + 1), 2200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <span className="gate-signal-copy" aria-live="polite">
      <DecryptedText
        key={`${copy}-${cycle}`}
        text={copy}
        animateOn="view"
        speed={42}
        maxIterations={12}
        characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%"
        encryptedClassName="is-encrypted"
      />
    </span>
  );
}

function CounterNumber({ value }) {
  const [cycle, setCycle] = useState(0);
  const displayValue = formatCount(value);

  useEffect(() => {
    const timer = window.setInterval(() => setCycle((current) => current + 1), 2200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <strong className="counter-number-tech" aria-live="polite" aria-label={displayValue}>
      <span className="counter-number-shuffle" aria-hidden="true">
        <Shuffle
          key={`counter-shuffle-${displayValue}-${cycle}`}
          text={displayValue}
          tag="span"
          className="counter-digit-shuffle"
          shuffleDirection="up"
          duration={0.42}
          shuffleTimes={3}
          scrambleCharset="0123456789"
          triggerOnHover={false}
          textAlign="left"
        />
      </span>
      <span className="counter-number-decrypted" aria-hidden="true">
        <DecryptedText
          key={`counter-decrypt-${displayValue}-${cycle}`}
          text={displayValue}
          animateOn="view"
          speed={46}
          maxIterations={10}
          characters="0123456789"
          encryptedClassName="is-encrypted"
        />
      </span>
    </strong>
  );
}

function CounterTechLabel() {
  return (
    <>
      <Shuffle
        text="LOCAL // ACCESS TRACKER"
        tag="span"
        className="counter-tech-shuffle"
        shuffleDirection="right"
        duration={0.38}
        shuffleTimes={2}
        scrambleCharset="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
        triggerOnHover
        textAlign="left"
      />
    </>
  );
}

function SuccessBoardAction({ onOpen }) {
  return (
    <button type="button" className="success-reopen-button" onClick={onOpen}>
      返回 IDE <span aria-hidden="true">↗</span>
    </button>
  );
}

function GateLocaleSwitch() {
  const setLocale = (locale) => window.NorthwindI18n?.setLocale(locale);

  return (
    <div className="language-switch gate-locale-switch" role="group" aria-label="Language">
      <button type="button" data-locale="zh" aria-label="中文" onClick={() => setLocale('zh')}>ZH</button>
      <span aria-hidden="true">|</span>
      <button type="button" data-locale="en" aria-label="English" onClick={() => setLocale('en')}>EN</button>
    </div>
  );
}

function ProblemBrief() {
  return (
    <aside className="gate-problem-brief">
      <div className="gate-brief-top">
        <span className="gate-label">LUOGU / P1102</span>
        <span className="gate-status-dot">LIVE</span>
      </div>
      <h2>A-B 数对</h2>
      <p>给出数列和正整数 C，计算所有满足 A − B = C 的数对数量</p>
      <div className="gate-example">
        <div><span>INPUT</span><code><span>4 1</span><span>1 1 2 3</span></code></div>
        <div><span>OUTPUT</span><code><span>3</span></code></div>
      </div>
      <div className="gate-constraints">
        <span>TIME <b>1.00 s</b></span>
        <span>MEMORY <b>125 MB</b></span>
      </div>
    </aside>
  );
}

function CodeEditor({ language, code, onChange, onLanguageChange, onReset, activeView, onViewChange, inputData, onInputChange, outputText }) {
  const selected = languageOptions.find((item) => item.id === language) || languageOptions[0];
  const highlightRef = useRef(null);

  const handleKeyDown = (event) => {
    if (event.key !== 'Tab') return;
    event.preventDefault();
    const start = event.currentTarget.selectionStart;
    const end = event.currentTarget.selectionEnd;
    const value = event.currentTarget.value;
    onChange(`${value.slice(0, start)}  ${value.slice(end)}`);
    requestAnimationFrame(() => {
      event.currentTarget.selectionStart = start + 2;
      event.currentTarget.selectionEnd = start + 2;
    });
  };

  const syncHighlightScroll = (event) => {
    if (!highlightRef.current) return;
    highlightRef.current.scrollTop = event.currentTarget.scrollTop;
    highlightRef.current.scrollLeft = event.currentTarget.scrollLeft;
  };

  return (
    <section className="gate-editor-panel">
      <div className="gate-editor-head">
        <div className="gate-editor-tabs">
          <span className="gate-file-dot" />
          <button type="button" className={`gate-editor-view-button ${activeView === 'code' ? 'is-active' : ''}`} onClick={() => onViewChange('code')}>CODE</button>
          <button type="button" className={`gate-editor-view-button ${activeView === 'tests' ? 'is-active' : ''}`} onClick={() => onViewChange('tests')}>TESTS</button>
          <button type="button" className={`gate-editor-view-button ${activeView === 'output' ? 'is-active' : ''}`} onClick={() => onViewChange('output')}>OUTPUT</button>
        </div>
        <div className="gate-editor-actions">
          <label className="gate-language-select">
            <span className="sr-only">选择语言</span>
            <select value={language} onChange={(event) => onLanguageChange(event.target.value)}>
              {languageOptions.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <span aria-hidden="true">⌄</span>
          </label>
          <button type="button" className="gate-reset" onClick={onReset}>重置</button>
        </div>
      </div>
      <div className="gate-editor-meta">
        <span>{selected.mode}</span>
        <span>{activeView === 'code' ? `solution.${language === 'python' ? 'py' : language === 'java' ? 'java' : language}` : 'P1102 / SAMPLE 01'}</span>
        <span className="gate-editor-live"><i /> FRONTEND IDE</span>
      </div>
      {activeView === 'code' && <div className="gate-code-wrap">
          <div className="gate-line-numbers" aria-hidden="true">
            {code.split('\n').map((_, index) => <span key={index}>{index + 1}</span>)}
          </div>
          <div ref={highlightRef} className="gate-code-highlight" aria-hidden="true"><pre>{highlightCode(code, language)}</pre></div>
          <textarea
            aria-label={`${selected.label} 代码编辑器`}
            placeholder="从空白文件开始编写你的解法…"
            spellCheck="false"
            value={code}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={syncHighlightScroll}
          />
        </div>}
      {activeView === 'tests' && <div className="gate-tests-view">
        <div className="gate-view-heading"><span>样例输入</span><b>可编辑</b></div>
        <textarea aria-label="样例输入编辑器" value={inputData} onChange={(event) => onInputChange(event.target.value)} spellCheck="false" />
        <div className="gate-test-preview"><span>EXPECTED OUTPUT</span><strong>3</strong><small>4 个数 · C = 1 · 1 个测试用例</small></div>
      </div>}
      {activeView === 'output' && <div className="gate-output-view" aria-live="polite">
        <div className="gate-view-heading"><span>运行结果</span><b className={outputText.includes('passed') ? 'is-pass' : ''}>{outputText.includes('passed') ? 'PASS' : 'WAITING'}</b></div>
        <pre>{outputText}</pre>
        <div className="gate-output-flow"><span>stdin</span><i>→</i><span>count map</span><i>→</i><strong>stdout / 3</strong></div>
      </div>}
    </section>
  );
}

function Gate({ onUnlock }) {
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState(starterCode.cpp);
  const [activeView, setActiveView] = useState('code');
  const [inputData, setInputData] = useState('4 1\n1 1 2 3');
  const [runState, setRunState] = useState('idle');
  const [submitState, setSubmitState] = useState('idle');
  const skipCount = readSkipCount();

  const selected = useMemo(() => languageOptions.find((item) => item.id === language) || languageOptions[0], [language]);

  const selectLanguage = (value) => {
    setLanguage(value);
    setCode(starterCode[value]);
    setActiveView('code');
    setRunState('idle');
    setSubmitState('idle');
  };

  const resetEditor = () => {
    setCode('');
    setActiveView('code');
    setRunState('idle');
    setSubmitState('idle');
  };

  const runSample = () => {
    setRunState('running');
    setActiveView('output');
    window.setTimeout(() => setRunState(evaluateCode(code, language) ? 'passed' : 'failed'), 620);
  };

  const submit = () => {
    setSubmitState('checking');
    window.setTimeout(() => {
      if (evaluateCode(code, language)) {
        setSubmitState('accepted');
        writeAccess();
        setActiveView('output');
        window.setTimeout(() => onUnlock('accepted', skipCount), 520);
      } else {
        setSubmitState('rejected');
        setActiveView('output');
      }
    }, 850);
  };

  const skip = () => {
    const next = skipCount + 1;
    writeSkipCount(next);
    onUnlock('skipped', next);
  };

  return (
    <div className="gate-overlay">
      <div className="gate-overlay-grid" aria-hidden="true" />
      <div className="gate-overlay-glow gate-overlay-glow-a" aria-hidden="true" />
      <div className="gate-overlay-glow gate-overlay-glow-b" aria-hidden="true" />
      <header className="gate-topline">
        <span className="gate-brand">FLYING<span>.</span> / SOLUTIONS</span>
        <div className="gate-top-actions">
          <GateLocaleSwitch />
          <span className="gate-top-meta"><i /> PRIVATE ACCESS / 01</span>
        </div>
      </header>

      <main className="gate-shell">
        <section className="gate-intro">
          <div className="gate-kicker"><span className="gate-kicker-mark">01</span> 题解仓库 · 访问考核</div>
          <h1><Shuffle text="AC // GATE" tag="span" className="gate-shuffle" shuffleDirection="right" duration={0.45} shuffleTimes={2} scrambleCharset="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789" triggerOnHover={false} textAlign="left" /></h1>
          <p className="gate-lead">先让一道题通过，再打开全部题解</p>
          <div className="gate-signal"><span className="gate-signal-line" /><SignalText /></div>
          <div className="gate-intro-notes">
            <span>题目会话 <b>P1102</b></span>
            <span>访问方式 <b>LOCAL / FRONTEND</b></span>
          </div>
        </section>

        <GlassSurface
          width="100%"
          height="auto"
          borderRadius={18}
          displace={10}
          distortionScale={-90}
          brightness={86}
          opacity={0.7}
          backgroundOpacity={0.34}
          saturation={1.25}
          className="gate-ide-shell"
        >
          <div className="gate-ide-heading">
            <div>
              <span className="gate-label">ASSESSMENT / 001</span>
              <h2>用你习惯的语言，<em>拿到 AC</em></h2>
            </div>
            <div className="gate-judge-badge"><span /> SAMPLE JUDGE</div>
          </div>
          <div className="gate-ide-grid">
            <ProblemBrief />
            <CodeEditor
              language={language}
              code={code}
              onChange={(value) => { setCode(value); setSubmitState('idle'); }}
              onLanguageChange={selectLanguage}
              onReset={resetEditor}
              activeView={activeView}
              onViewChange={setActiveView}
              inputData={inputData}
              onInputChange={setInputData}
              outputText={runState === 'passed' ? 'sample 1 / 1 passed\n\n3 == 3\n\nProcess finished with exit code 0' : runState === 'failed' ? 'sample 1 / 1 failed\n\nexpected: 3\nreceived: —' : '等待运行样例…'}
            />
          </div>
          <div className="gate-ide-footer">
            <div className={`gate-console ${runState === 'passed' ? 'is-passed' : ''} ${runState === 'running' ? 'is-running' : ''}`} aria-live="polite">
              <span className="gate-console-prompt">›</span>
              {runState === 'idle' && <span>运行样例，确认输出为 3</span>}
              {runState === 'running' && <span>正在执行样例集 <b>···</b></span>}
              {runState === 'passed' && <span>sample 1 / 1 passed <b>3 == 3</b></span>}
              {runState === 'failed' && <span className="gate-console-failed">sample 1 / 1 failed <b>输出结构未通过</b></span>}
            </div>
            <div className="gate-submit-actions">
              {submitState === 'rejected' && <span className="gate-submit-error">需要补全可运行的计数逻辑</span>}
              {submitState === 'accepted' && <span className="gate-submit-accepted">ACCEPTED / ACCESS GRANTED</span>}
              <button type="button" className="gate-run-button" onClick={runSample} disabled={runState === 'running'}>运行样例 <span>↗</span></button>
              <button type="button" className="gate-submit-button" onClick={submit} disabled={submitState === 'checking' || submitState === 'accepted'}>
                {submitState === 'checking' ? '评测中…' : submitState === 'accepted' ? '已通过' : '提交代码'} <span>→</span>
              </button>
            </div>
          </div>
        </GlassSurface>

        <div className="gate-bottom-row">
          <span><i className="gate-mini-dot" /> 本地记录 · 不上传代码</span>
          <span>支持 C / C++ / Python / Java / Go</span>
        </div>
      </main>

      <button type="button" className="gate-defer" onClick={skip}>
        <span className="gate-defer-index">SKIP {formatCount(skipCount)}</span>
        <span>下次再试，跳过考核</span>
        <span className="gate-defer-arrow">↘</span>
      </button>
    </div>
  );
}

function SolutionsGateApp() {
  const [passed, setPassed] = useState(readAccess);
  const [open, setOpen] = useState(() => !readAccess());
  const [skipCount, setSkipCount] = useState(readSkipCount);
  const [counterReady, setCounterReady] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('solutions-gate-locked', open);
    return () => document.body.classList.remove('solutions-gate-locked');
  }, [open]);

  useEffect(() => {
    updateProgressSurface(skipCount, passed);
    const frame = window.requestAnimationFrame(() => setCounterReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, [skipCount, passed]);

  const unlock = (mode, count) => {
    const nextCount = Number.isFinite(count) ? count : readSkipCount();
    const accepted = mode === 'accepted';
    if (accepted) setPassed(true);
    setSkipCount(nextCount);
    setOpen(false);
    updateProgressSurface(nextCount, accepted);
  };

  const counterRoot = document.querySelector('#counterTechText');
  const counterDigitRoot = document.querySelector('#gateSkipCount');
  const successActionRoot = document.querySelector('#gateSuccessAction');
  return (
    <>
      {open && <Gate onUnlock={unlock} />}
      {!passed && counterRoot && counterReady && skipCount > 0 && createPortal(<CounterTechLabel />, counterRoot)}
      {!passed && counterDigitRoot && counterReady && skipCount > 0 && createPortal(<CounterNumber value={skipCount} />, counterDigitRoot)}
      {passed && successActionRoot && createPortal(<SuccessBoardAction onOpen={() => setOpen(true)} />, successActionRoot)}
    </>
  );
}

const root = document.querySelector('#solutionsGateRoot');
if (root) createRoot(root).render(<SolutionsGateApp />);
