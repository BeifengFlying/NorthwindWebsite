import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(projectRoot, 'dist');

const copyDirectory = (source, destination) =>
  cp(path.join(projectRoot, source), path.join(projectRoot, destination), {
    recursive: true,
  });

await rm(distDir, { recursive: true, force: true });
await mkdir(path.join(distDir, 'assets'), { recursive: true });

await Promise.all([
  copyDirectory('public', 'dist'),
  copyDirectory('src/styles', 'dist/assets/styles'),
  copyDirectory('src/scripts', 'dist/assets/scripts'),
  copyDirectory('src/config', 'dist/assets/data'),
]);

const pagesDir = path.join(projectRoot, 'src/pages');
const pageNames = (await readdir(pagesDir)).filter((name) => name.endsWith('.html'));
await Promise.all(
  pageNames.map((name) => cp(path.join(pagesDir, name), path.join(distDir, name))),
);

console.log(`Built ${pageNames.length} pages in dist/`);
