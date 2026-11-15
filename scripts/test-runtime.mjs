import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import vm from 'node:vm';

const soundSource = (await readFile(new URL('../src/scripts/shared/page-transition.js', import.meta.url), 'utf8')).split('/* Reversible, scroll-driven')[0];
const performanceSource = await readFile(new URL('../src/scripts/shared/performance.js', import.meta.url), 'utf8');
function soundRuntime(values = {}, blocked = false) {
  const saved = new Map(Object.entries(values));
  const listeners = new Map();
  const audio = [];
  const context = {
    Event, CustomEvent, performance, console,
    setTimeout: callback => { callback(); return 1; }, clearTimeout() {},
    addEventListener(type, callback) { listeners.set(type, callback); }, dispatchEvent() {},
    localStorage: {
      getItem(key) { if (blocked) throw new Error('denied'); return saved.get(key) ?? null; },
      setItem(key, value) { if (blocked) throw new Error('denied'); saved.set(key, value); }
    },
    AudioContext: class {
      state = 'suspended'; destination = {}; currentTime = 0; sampleRate = 44100;
      constructor() { audio.push(this); }
      createGain() { return { gain: { value: 0, cancelScheduledValues() {}, setValueAtTime() {} }, connect() {} }; }
      createBuffer() { return {}; }
      createBufferSource() { return { connect() {}, start() {} }; }
      addEventListener() {}
      resume() { this.state = 'running'; return Promise.resolve(); }
    },
    document: { readyState: 'loading', addEventListener() {}, getElementById() { return null; } },
    fetch: () => Promise.resolve({ ok: false, status: 404 })
  };
  context.window = context;
  vm.runInNewContext(soundSource, context);
  return { sound: context.NorthwindSound, saved, audio };
}
test('first visit keeps a usable volume, then enables audio on request', async () => {
  const { sound, audio } = soundRuntime();
  assert.equal(sound.getVolume(), .75);
  assert.equal(sound.isMuted(), false);
  assert.equal(audio.length, 0);
  sound.enable();
  await sound.unlock();
  assert.equal(sound.isMuted(), false);
  assert.equal(audio[0].state, 'running');
});
test('explicit mute survives loading, and re-enabling zero volume restores audibility', () => {
  const { sound, saved } = soundRuntime({ 'northwind-sound-volume': '0', 'northwind-sound-muted': 'true' });
  assert.equal(sound.getVolume(), 0);
  assert.equal(sound.isMuted(), true);
  sound.enable();
  assert.equal(sound.getVolume(), .75);
  assert.equal(saved.get('northwind-sound-volume'), '0.75');
});
test('storage-denied browsing still supports enabling and changing sound', () => {
  const { sound } = soundRuntime({}, true);
  sound.enable(); sound.setVolume(.4);
  assert.equal(sound.getVolume(), .4);
  assert.equal(sound.isMuted(), false);
});
test('invalid saved volume falls back; valid preferences survive', () => {
  assert.equal(soundRuntime({ 'northwind-sound-volume': 'invalid' }).sound.getVolume(), .75);
  const { sound } = soundRuntime({ 'northwind-sound-volume': '0.3', 'northwind-sound-muted': 'false' });
  assert.equal(sound.getVolume(), .3); assert.equal(sound.isMuted(), false);
});
function policy({ compact = false, reduced = false, cpu = 8, memory, saveData = false, gpu = true } = {}) {
  let probes = 0;
  const context = {
    Event, dispatchEvent() {}, navigator: { hardwareConcurrency: cpu, deviceMemory: memory, connection: { saveData } },
    matchMedia: query => ({ matches: query.includes('reduced-motion') ? reduced : compact, addEventListener() {} }),
    document: { documentElement: { dataset: {} }, createElement: () => ({ getContext: () => {
      probes++; if (!gpu) throw new Error('GPU disabled'); return { getExtension: () => null };
    } }) }
  };
  context.window = context;
  vm.runInNewContext(performanceSource, context);
  return { policy: context.NorthwindPerformance, probes: () => probes };
}
test('device and accessibility constraints select lightweight rendering without probing GPU', () => {
  for (const options of [{compact:true},{reduced:true},{cpu:4},{memory:4},{saveData:true}]) {
    const result = policy(options);
    assert.equal(result.policy.lite, true);
    assert.equal(result.probes(), 0);
  }
  assert.equal(policy().policy.lite, false);
});
test('unavailable WebGL is handled and capability probes are cached', () => {
  const result = policy({ gpu: false });
  assert.equal(result.policy.supportsWebGL2(), false);
  assert.equal(result.policy.supportsWebGL2(), false);
  assert.equal(result.probes(), 1);
});
