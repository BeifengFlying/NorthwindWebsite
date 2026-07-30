import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const audioDir = path.join(projectRoot, 'public/assets/audio');
const sampleRate = 44_100;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function smoothstep(value) {
  const normalized = clamp(value, 0, 1);
  return normalized * normalized * (3 - 2 * normalized);
}

function createRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1_664_525) + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

function encodePcm16(channels) {
  const channelCount = channels.length;
  const sampleCount = channels[0].length;
  const bytesPerSample = 2;
  const dataLength = sampleCount * channelCount * bytesPerSample;
  const output = Buffer.alloc(44 + dataLength);

  output.write('RIFF', 0);
  output.writeUInt32LE(36 + dataLength, 4);
  output.write('WAVE', 8);
  output.write('fmt ', 12);
  output.writeUInt32LE(16, 16);
  output.writeUInt16LE(1, 20);
  output.writeUInt16LE(channelCount, 22);
  output.writeUInt32LE(sampleRate, 24);
  output.writeUInt32LE(sampleRate * channelCount * bytesPerSample, 28);
  output.writeUInt16LE(channelCount * bytesPerSample, 32);
  output.writeUInt16LE(16, 34);
  output.write('data', 36);
  output.writeUInt32LE(dataLength, 40);

  let offset = 44;
  for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex += 1) {
      const sample = clamp(channels[channelIndex][sampleIndex], -1, 1);
      output.writeInt16LE(Math.round(sample * 32_767), offset);
      offset += bytesPerSample;
    }
  }
  return output;
}

function createWheelTick() {
  const duration = 0.085;
  const samples = new Float32Array(Math.ceil(sampleRate * duration));
  const random = createRandom(0x4e57544b);
  let phase = 0;

  for (let index = 0; index < samples.length; index += 1) {
    const time = index / sampleRate;
    const progress = time / duration;
    const frequency = 2_300 * Math.pow(690 / 2_300, progress);
    phase += (Math.PI * 2 * frequency) / sampleRate;
    const attack = smoothstep(time / 0.0035);
    const decay = Math.exp(-time * 47);
    const tone = Math.sin(phase) * 0.78 + Math.sin(phase * 2.01) * 0.14;
    const transient = (random() * 2 - 1) * Math.exp(-time * 135) * 0.24;
    samples[index] = (tone + transient) * attack * decay * 0.78;
  }
  return encodePcm16([samples]);
}

function createPaperPlaneWind() {
  const duration = 1.45;
  const sampleCount = Math.ceil(sampleRate * duration);
  const left = new Float32Array(sampleCount);
  const right = new Float32Array(sampleCount);
  const random = createRandom(0x4e57574e);
  let slowNoise = 0;
  let previousColored = 0;

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const progress = time / duration;
    const white = random() * 2 - 1;
    slowNoise += (white - slowNoise) * 0.075;
    const colored = white * 0.34 + slowNoise * 1.7;
    const airy = colored - previousColored * 0.32;
    previousColored = colored;

    const attack = smoothstep(progress / 0.16);
    const release = 1 - smoothstep((progress - 0.58) / 0.42);
    const gust = 0.72 + Math.sin(time * Math.PI * 3.2) * 0.13 + Math.sin(time * Math.PI * 7.4) * 0.06;
    const amplitude = attack * release * gust * 0.62;
    const pan = smoothstep(progress) * 0.82 + 0.09;
    const leftGain = Math.cos(pan * Math.PI * 0.5);
    const rightGain = Math.sin(pan * Math.PI * 0.5);
    left[index] = airy * amplitude * leftGain;
    right[index] = airy * amplitude * rightGain;
  }
  return encodePcm16([left, right]);
}

await mkdir(audioDir, { recursive: true });
await Promise.all([
  writeFile(path.join(audioDir, 'wheel-tick.wav'), createWheelTick()),
  writeFile(path.join(audioDir, 'paper-plane-wind.wav'), createPaperPlaneWind()),
]);

console.log('Generated public sound effects in public/assets/audio/');
