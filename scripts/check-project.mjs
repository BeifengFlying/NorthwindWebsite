import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(projectRoot, 'dist');
const failures = [];

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(entryPath) : [entryPath];
    }),
  );
  return nested.flat();
}

function isRemote(reference) {
  return /^(?:https?:|data:|mailto:|tel:|javascript:|#|%23)/i.test(reference);
}

function resolveReference(sourceFile, reference) {
  const cleanReference = reference.split('#')[0].split('?')[0];
  if (!cleanReference || isRemote(reference)) return null;
  if (cleanReference === '/') return path.join(distDir, 'index.html');
  const target = cleanReference.startsWith('/')
    ? path.join(distDir, cleanReference.replace(/^\/+/, ''))
    : path.resolve(path.dirname(sourceFile), cleanReference);
  const relativeTarget = path.relative(distDir, target);
  return relativeTarget && !relativeTarget.startsWith(`..${path.sep}`) && !path.isAbsolute(relativeTarget)
    ? target
    : null;
}

async function checkReference(sourceFile, reference) {
  if (!reference || isRemote(reference)) return;
  const target = resolveReference(sourceFile, reference);
  if (!target) {
    failures.push(
      `${path.relative(projectRoot, sourceFile)} -> reference escapes dist: ${reference}`,
    );
    return;
  }
  try {
    if (!(await stat(target)).isFile()) throw new Error('Not a file');
  } catch {
    failures.push(
      `${path.relative(projectRoot, sourceFile)} -> missing ${reference}`,
    );
  }
}

const files = await walk(distDir);
for (const file of files) {
  const relativePath = path.relative(distDir, file);
  const extension = path.extname(file).toLowerCase();
  const fileStat = await stat(file);

  if (/(^|[/\\])(?:private|private-assets|node_modules)([/\\]|$)/.test(relativePath)) {
    failures.push(`Private directory published: ${relativePath}`);
  }
  if (path.basename(file) === '.DS_Store' || /^\.env(?:\.|$)/.test(path.basename(file))) {
    failures.push(`Local-only file published: ${relativePath}`);
  }
  if (['.cjs', '.jsx', '.map', '.mjs', '.ts', '.tsx'].includes(extension)) {
    failures.push(`Source or development file published: ${relativePath}`);
  }
  const isPublicSoundEffect =
    relativePath.startsWith(`assets${path.sep}audio${path.sep}`) &&
    extension === '.wav';
  if (
    !isPublicSoundEffect &&
    [
      '.arw',
      '.cr2',
      '.dng',
      '.flac',
      '.jpg',
      '.jpeg',
      '.mp3',
      '.nef',
      '.psd',
      '.raw',
      '.wav',
    ].includes(extension)
  ) {
    failures.push(`Protected source asset published: ${relativePath}`);
  }
  const maxAssetSize = relativePath === path.join('assets', 'scripts', 'pages', 'lanyard.js')
    ? 4_000_000
    : 1_500_000;
  if (fileStat.size > maxAssetSize) {
    failures.push(`Asset exceeds ${maxAssetSize / 1_000_000} MB: ${relativePath}`);
  }

  if (extension === '.webp') {
    const imageBuffer = await readFile(file);
    if (imageBuffer.includes(Buffer.from('Exif'))) {
      failures.push(`EXIF marker found in ${relativePath}`);
    }
  }

  if (!['.html', '.css', '.js', '.json'].includes(extension)) continue;
  const source = await readFile(file, 'utf8');
  const sensitivePatterns = [
    /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
    /\b(?:api[_-]?key|secret|password|passwd|access[_-]?token)\s*[:=]\s*["'][^"']{8,}["']/i,
    /\/Users\/[^/\s]+\//,
  ];
  const isVendoredDependency = relativePath.startsWith(`assets${path.sep}vendor${path.sep}`);
  if (!isVendoredDependency) {
    sensitivePatterns.push(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/);
  }
  sensitivePatterns.forEach((pattern) => {
    if (pattern.test(source)) failures.push(`Sensitive value pattern in ${relativePath}`);
  });

  const references = [];
  if (extension === '.html') {
    references.push(...source.matchAll(/(?:src|href)=["']([^"']*)["']/g));
  } else if (extension === '.css') {
    references.push(...source.matchAll(/url\(["']?([^"')]+)["']?\)/g));
  }
  await Promise.all(references.map((match) => checkReference(file, match[1])));
}

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Project check passed for ${files.length} published files.`);
}
