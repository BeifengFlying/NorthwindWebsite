import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { appVersion } from '../src/config/version.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const versionPlaceholder = '{{APP_VERSION}}';
const assetReferencePattern = /["'`]((?:\.?\.?\/|\/)?assets\/[^"'`?#]+\.(?:js|css)(?:\?[^"'`]*)?)["'`]/gi;

function isRemote(reference) {
  return /^(?:https?:)?\/\//i.test(reference);
}

function getVersion(reference) {
  const query = reference.split('#')[0].split('?')[1] ?? '';
  return new URLSearchParams(query).get('v');
}

async function readTextFiles(directory, extensions) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return readTextFiles(entryPath, extensions);
    if (!extensions.has(path.extname(entry.name).toLowerCase())) return [];
    return [{
      name: path.relative(projectRoot, entryPath),
      source: await readFile(entryPath, 'utf8'),
    }];
  }));
  return files.flat().sort((left, right) => left.name.localeCompare(right.name));
}

function collectFailures(files, expectedVersion, label) {
  const failures = [];
  const versionsByAsset = new Map();

  for (const { name, source } of files) {
    for (const match of source.matchAll(assetReferencePattern)) {
      const reference = match[1];
      if (isRemote(reference)) continue;

      const [asset] = reference.split(/[?#]/);
      const version = getVersion(reference);
      if (version !== expectedVersion) {
        failures.push(
          `${label}/${name}: ${reference} must use ?v=${expectedVersion}`,
        );
      }

      const versions = versionsByAsset.get(asset) ?? new Set();
      versions.add(version ?? '<missing>');
      versionsByAsset.set(asset, versions);
    }
  }

  for (const [asset, versions] of versionsByAsset) {
    if (versions.size > 1) {
      failures.push(`${label}: ${asset} uses multiple versions: ${[...versions].join(', ')}`);
    }
  }

  return failures;
}

function assertValidVersion() {
  if (!/^\d{8}-\d+$/.test(appVersion)) {
    throw new Error(`appVersion must match YYYYMMDD-sequence, received: ${appVersion}`);
  }
}

function reportFailures(failures) {
  if (!failures.length) return;
  throw new Error(`Resource version check failed:\n${failures.map((item) => `- ${item}`).join('\n')}`);
}

export async function validateSourceVersioning() {
  assertValidVersion();
  const sourceDirectories = [
    path.join(projectRoot, 'src/pages'),
    path.join(projectRoot, 'src/scripts'),
  ];
  const files = (await Promise.all(
    sourceDirectories.map((directory) => readTextFiles(directory, new Set(['.html', '.js', '.jsx']))),
  )).flat();
  // Existing source pages intentionally carry human-readable cache versions;
  // the build computes one deterministic version for the generated dist tree.
  const failures = [];

  for (const { name, source } of files) {
    if (path.extname(name).toLowerCase() !== '.html') continue;
    const unexpectedPlaceholders = source.match(/{{[^}]+}}/g) ?? [];
    for (const placeholder of unexpectedPlaceholders) {
      if (placeholder !== versionPlaceholder) {
        failures.push(`${name}: unsupported placeholder ${placeholder}`);
      }
    }
  }

  reportFailures(failures);
  return files.length;
}

export async function validateBuiltVersioning(
  distDir = path.join(projectRoot, 'dist'),
  expectedVersion = appVersion,
) {
  assertValidVersion();
  const files = await readTextFiles(distDir, new Set(['.html', '.js']));
  const failures = collectFailures(files, expectedVersion, 'dist');

  for (const { name, source } of files) {
    if (source.includes(versionPlaceholder)) {
      failures.push(`dist/${name}: unresolved ${versionPlaceholder}`);
    }
  }

  reportFailures(failures);
  return files.length;
}

export async function createAssetVersion(distDir = path.join(projectRoot, 'dist')) {
  assertValidVersion();
  const files = await readTextFiles(distDir, new Set(['.css', '.js']));
  const digest = createHash('sha256');
  for (const file of files) {
    digest.update(file.name);
    digest.update('\0');
    digest.update(file.source);
    digest.update('\0');
  }
  return `${appVersion}-${digest.digest('hex').slice(0, 12)}`;
}

const isDirectRun = process.argv[1]
  && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  const fileCount = await validateSourceVersioning();
  console.log(`Resource version check passed for ${fileCount} source files (${appVersion}).`);
}
