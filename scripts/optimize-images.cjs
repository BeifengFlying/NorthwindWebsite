const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const projectRoot = path.resolve(__dirname, '..');
const photoSource = path.join(projectRoot, 'private/source-media/photography/originals');
const photoOutput = path.join(projectRoot, 'public/assets/images/photography');
const musicSource = path.join(projectRoot, 'private/source-media/music/originals');
const musicOutput = path.join(projectRoot, 'public/assets/images/music');
const photoIds = [
  '1785261471105',
  '1785261471174',
  '1785261471244',
  '1785261471285',
  '1785261471324',
  '1785261471385',
];

async function optimizePhotos() {
  await fs.mkdir(photoOutput, { recursive: true });
  await Promise.all(
    photoIds.flatMap((id) =>
      [640, 1280, 1920].map((width) =>
        sharp(path.join(photoSource, `${id}.jpg`))
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 80, effort: 6 })
          .toFile(path.join(photoOutput, `${id}-${width}.webp`)),
      ),
    ),
  );
}

async function optimizeMusicCovers() {
  await Promise.all(
    ['111', '222'].map(async (set) => {
      const sourceDir = path.join(musicSource, set, 'thumbs');
      const outputDir = path.join(musicOutput, set);
      await fs.mkdir(outputDir, { recursive: true });
      const names = (await fs.readdir(sourceDir)).filter((name) => name.endsWith('.jpg'));
      await Promise.all(
        names.map((name) =>
          sharp(path.join(sourceDir, name))
            .rotate()
            .resize({ width: 480, height: 480, fit: 'cover', withoutEnlargement: true })
            .webp({ quality: 78, effort: 6 })
            .toFile(path.join(outputDir, name.replace(/\.jpg$/i, '.webp'))),
        ),
      );
    }),
  );
}

Promise.all([optimizePhotos(), optimizeMusicCovers()])
  .then(() => console.log('Optimized photography and music artwork.'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
