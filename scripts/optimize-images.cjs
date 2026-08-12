const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const projectRoot = path.resolve(__dirname, '..');
const photoSource = path.join(projectRoot, 'private/source-media/photography/originals');
const distilledPhotoSource = path.join(projectRoot, 'private/source-media/photography/distilled-originals');
const photoOutput = path.join(projectRoot, 'public/assets/images/photography');
const musicSource = path.join(projectRoot, 'private/source-media/music/originals');
const musicOutput = path.join(projectRoot, 'public/assets/images/music');
const photoFiles = [
  '1785261471105.jpg',
  '1785261471174.jpg',
  '1785261471244.jpg',
  '1785261471285.jpg',
  '1785261471324.jpg',
  '1785261471385.jpg',
  '1785261471480.dng',
];
const distilledPhotoFiles = [
  '蒸馏_余晖.png',
  '蒸馏_光影之间.png',
  '蒸馏_暮色.png',
  '蒸馏_辽阔.png',
  '蒸馏_远山.png',
  '蒸馏_雪山.png',
  '蒸馏_静谧时分.png',
];

async function optimizePhotos() {
  await fs.mkdir(photoOutput, { recursive: true });
  await Promise.all(
    photoFiles.flatMap((fileName) => {
      const id = path.parse(fileName).name;

      return [640, 1280, 1920].map((width) =>
        sharp(path.join(photoSource, fileName))
          .rotate()
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 80, effort: 6 })
          .toFile(path.join(photoOutput, `${id}-${width}.webp`)),
      );
    }),
  );
}

async function optimizeDistilledPhotos() {
  await fs.mkdir(photoOutput, { recursive: true });
  await Promise.all(
    distilledPhotoFiles.map((fileName) =>
      sharp(path.join(distilledPhotoSource, fileName))
        .webp({ quality: 85, effort: 6 })
        .toFile(path.join(photoOutput, fileName.replace(/\.png$/i, '.webp'))),
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

Promise.all([optimizePhotos(), optimizeDistilledPhotos(), optimizeMusicCovers()])
  .then(() => console.log('Optimized photography and music artwork.'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
