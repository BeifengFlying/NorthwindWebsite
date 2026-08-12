import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { appVersion } from '../src/config/version.js';
import { createAssetVersion, validateBuiltVersioning, validateSourceVersioning } from './check-version.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(projectRoot, 'dist');

const copyDirectory = (source, destination, include = () => true) =>
  cp(path.join(projectRoot, source), path.join(projectRoot, destination), {
    recursive: true,
    filter: (entry) => path.basename(entry) !== '.DS_Store' && include(entry),
  });

async function replaceVersionPlaceholders(directory, version) {
  const entries = await readdir(directory, { withFileTypes: true });
  await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return replaceVersionPlaceholders(entryPath, version);
    if (!['.css', '.html', '.js'].includes(path.extname(entry.name).toLowerCase())) return;
    const source = await readFile(entryPath, 'utf8');
    const output = source
      .replaceAll('{{APP_VERSION}}', version)
      .replace(/((?:src|href)=["'])(?!https?:|\/\/)([^"']+\.(?:js|css))(?:\?[^"']*)?(["'])/gi, '$1$2?v=' + version + '$3');
    if (output !== source) await writeFile(entryPath, output);
  }));
}

await validateSourceVersioning();

await rm(distDir, { recursive: true, force: true });
await mkdir(path.join(distDir, 'assets'), { recursive: true });

await Promise.all([
  copyDirectory('public', 'dist'),
  copyDirectory('src/styles', 'dist/assets/styles'),
  copyDirectory('src/scripts', 'dist/assets/scripts', (entry) => path.extname(entry) !== '.jsx'),
  copyDirectory('src/config', 'dist/assets/data', (entry) => path.extname(entry) !== '.js'),
  copyDirectory('src/locales', 'dist/assets/locales'),
]);

const pagesDir = path.join(projectRoot, 'src/pages');
const pageNames = (await readdir(pagesDir)).filter((name) => name.endsWith('.html'));
await Promise.all(
  pageNames.map(async (name) => {
    const source = await readFile(path.join(pagesDir, name), 'utf8');
    await writeFile(path.join(distDir, name), source);
  }),
);

await build({
  entryPoints: [
    path.join(projectRoot, 'src/scripts/pages/journey-menu.jsx'),
    path.join(projectRoot, 'src/scripts/pages/photography-gallery.jsx'),
    path.join(projectRoot, 'src/scripts/pages/ai-lab-components.jsx'),
    path.join(projectRoot, 'src/scripts/pages/lanyard.jsx'),
    path.join(projectRoot, 'src/scripts/pages/music-card.jsx'),
    path.join(projectRoot, 'src/scripts/pages/sound-control.jsx'),
    path.join(projectRoot, 'src/scripts/pages/solutions-gate.jsx'),
    path.join(projectRoot, 'src/scripts/pages/workflow-hyperspeed.jsx'),
    path.join(projectRoot, 'src/scripts/pages/journey-grid-motion.jsx'),
  ],
  bundle: true,
  minify: true,
  sourcemap: false,
  outdir: path.join(distDir, 'assets/scripts/pages'),
  format: 'iife',
  target: ['es2020'],
  jsx: 'automatic',
  legalComments: 'none',
});

await build({
  entryPoints: [
    path.join(projectRoot, 'src/scripts/shared/nav-glass.jsx'),
    path.join(projectRoot, 'src/scripts/shared/motion-anime.js'),
  ],
  bundle: true,
  minify: true,
  sourcemap: false,
  outdir: path.join(distDir, 'assets/scripts/shared'),
  format: 'iife',
  target: ['es2020'],
  jsx: 'automatic',
  legalComments: 'none',
});

await cp(
  path.join(projectRoot, 'src/components/InfiniteMenu.css'),
  path.join(distDir, 'assets/styles/infinite-menu.css'),
);

await cp(
  path.join(projectRoot, 'src/components/GridMotion/GridMotion.css'),
  path.join(distDir, 'assets/styles/grid-motion.css'),
);

await Promise.all([
  cp(path.join(projectRoot, 'src/components/Aurora/Aurora.css'), path.join(distDir, 'assets/styles/aurora.css')),
  cp(path.join(projectRoot, 'src/components/ScrollStack/ScrollStack.css'), path.join(distDir, 'assets/styles/scroll-stack.css')),
]);

const assetVersion = await createAssetVersion(distDir);
await replaceVersionPlaceholders(distDir, assetVersion);
await validateBuiltVersioning(distDir, assetVersion);

console.log(`Built ${pageNames.length} pages in dist/ with asset version ${assetVersion}.`);
