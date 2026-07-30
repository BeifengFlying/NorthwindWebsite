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
  const originalTick = 'UklGRk4FAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YSoFAAAAABUb0TQJTLJf7G4MeaB9e3yxdZdpv1jzQyosexIT+Cbe4MVasIqePJEFiT6GAYkpkU+e1q/sxJjcxfVKDwEoyj6fUp1iDm5zdId1Q3HgZ9BZvUd9MgsbeQLo6XTSLL0Fq9CcK5ODjgePrJQpnwCuf8DL1ensyARWHH8yQ0a/VjljImslbiVsPmXGWUhKfDdBIpELdvT63STJ5LYLqEGd/5aKleuY9qBJrU+9StBZ5Yb7zBEqJ6g6ZkukWM1hemZ7ZtRhwlizS0M7NShqE9b9dOg81BjC2bIsp5WfZ5zDnZSjj60+u/vLAt9z81wIzhzYL6FAZ06NWKNeZmDGXedWHkztPf0sFRoUBuTxb96XzCm91bAoqIKjFaPgprOuLbrGyNDZguwAAGgT2CV7NpJEe0+8VgRaMllUVKhLlz+wMKUfPQ1T+r/nWtbuxiu6orC/qsKovaqVsAG6j8ar1aLmq/j0Cqoc/iw0O6lG3E5wUzZUKFFuSltAZzMtJGATxgEs8F3fHtAcw+64BbKvrg2vGbOduj/FgNLC4VLybQNNFC4kWDIoPhhHxEzsTn1Ni0hTQDk1wSeLGEoIu/ef57HYncv6wD+5w7S3syS257u8xDfQ0N3n7Mv8wAwQHAcqBjaEPxRGbUluSRlGmT89NnYqzxzpDXP+Ie+k4KTTuMhawOq6o7icuce97sS8zrraXegC9/4FoxRIIk8uLThzP89DEkUxQ0U+ijZfLDwgsBJbBOT18+cq2xvQRscPwbq9bL0kwL/F+M1u2KPkCPIAAOcNHhsJJyIx8zglPn9A6T9tPDY2kC3jIqwWfQnv+5/uKOIb1/bNIsfqwn3B6MIYx9jN2Nar4dPtwPrZB4oUPSBrKqEygTjJO1c8JjpUNRwu1STsGeINRQGp9J7osd1f1BPNIMi8xQDG5chIzufVZt9V6jP2dAKMDuwZEiSJLPEyATeNOIY3+jMXLiMmfByWEfAFE/qI7tbjd9rX0k7NF8pXyRTLNc+J1cPdgedR8rT9IwkbFB0etiaCLTYynTSdNDoyki3dJm0epBT3CeT+6fOI6TfgY9hl0n/O3syRzY3QrdWz3EvlEO+P+UsEyQ6QGC4hQCh3LZYwfjElMJ4sFCfLHxkXZA0fA8L4xe6b5a/dW9fn0oTQTNA+0kLWJ9yl42Xs/vUAAPYJbhP4GzQjziiHLDcuyy1MK9gmpiD/GD8QzAYW/Yzznuqz4ibcQdc71DXTOtQ61xDcg+JF6vryPfygBbcOGRdlHkckfCjWKjwrqik2JgohZBqTEvIJ6QDg9z/va+e94IPb99dA1nHWhNhg3NbhpOh58Pr4wgFsCpMS2RnpH4AkaSeFKMgnPiUGIVMbaRSaDEEEwft889LrG+Wl363bX9nW2BTaCt2T4Xjnc+4y9lv+jAZoDpQVvRucIPojsyWzJf0jpyDZG80Vyg4kBzX/V/fm7zrpnuNT34jcXdvd2wDerOG15t3s3fNi+xMDmAqaEcYX1xyTINAidiN/IvgfABzIFowQmAk8AtD6p/MX7Wnn4eKw3/rd0t033xfiUOav6/Tx1PgAACMH7A0LFDkZPR3oHx0h0CAGH9UbZBfpEaQL3wTq/RT3rvAB61DmzuKj4Ojfo+DJ4kDm3+pu8Kv2Tv0HBIsKjRDHFf4ZAh2yHvoe2x1hG6wX6RJPDSAHpwAu+v/zY+6a6dvlUOMW4jnituN65mPqQ+/g9Pj6QgF4B08NhRLdFicaPRwIHYEcrxqqF5QToA4HCQ==';
  return Buffer.from(originalTick, 'base64');
}

function createPaperPlaneWind() {
  const duration = 1.18;
  const sampleCount = Math.ceil(sampleRate * duration);
  const left = new Float32Array(sampleCount);
  const right = new Float32Array(sampleCount);
  const random = createRandom(0x4e57574e);
  let lowNoise = 0;
  let midNoise = 0;

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const progress = time / duration;
    const white = random() * 2 - 1;
    lowNoise += (white - lowNoise) * 0.025;
    midNoise += (white - midNoise) * 0.16;
    const rustle = (midNoise - lowNoise) * 0.72 + white * 0.035;

    const attack = smoothstep(progress / 0.22);
    const release = 1 - smoothstep((progress - 0.56) / 0.44);
    const flutter = 0.62 + Math.sin(time * Math.PI * 4.1) * 0.08 + Math.sin(time * Math.PI * 9.3) * 0.035;
    const amplitude = attack * release * flutter * 0.32;
    const pan = 0.38 + smoothstep(progress) * 0.24;
    const leftGain = Math.cos(pan * Math.PI * 0.5);
    const rightGain = Math.sin(pan * Math.PI * 0.5);
    left[index] = rustle * amplitude * leftGain;
    right[index] = rustle * amplitude * rightGain;
  }
  return encodePcm16([left, right]);
}

await mkdir(audioDir, { recursive: true });
await Promise.all([
  writeFile(path.join(audioDir, 'wheel-tick.wav'), createWheelTick()),
  writeFile(path.join(audioDir, 'paper-plane-wind.wav'), createPaperPlaneWind()),
]);

console.log('Generated public sound effects in public/assets/audio/');
