const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const resDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

// 1. Square / Rect App Icon SVG
const squareSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="110" fill="#000000"/>
  <g transform="translate(64, 64) scale(3.84)">
    <path d="M28 34L50 22L72 34L50 46L28 34Z" stroke="#FFFFFF" stroke-width="5.5" stroke-linejoin="round" fill="none"/>
    <path d="M28 50L50 62L72 50" stroke="#A1A1AA" stroke-width="5.5" stroke-linejoin="round" fill="none"/>
    <path d="M28 66L50 78L72 66" stroke="#71717A" stroke-width="5.5" stroke-linejoin="round" fill="none"/>
  </g>
</svg>
`;

// 2. Round App Icon SVG
const roundSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <circle cx="256" cy="256" r="256" fill="#000000"/>
  <g transform="translate(64, 64) scale(3.84)">
    <path d="M28 34L50 22L72 34L50 46L28 34Z" stroke="#FFFFFF" stroke-width="5.5" stroke-linejoin="round" fill="none"/>
    <path d="M28 50L50 62L72 50" stroke="#A1A1AA" stroke-width="5.5" stroke-linejoin="round" fill="none"/>
    <path d="M28 66L50 78L72 66" stroke="#71717A" stroke-width="5.5" stroke-linejoin="round" fill="none"/>
  </g>
</svg>
`;

// 3. Foreground Adaptive Icon SVG (Transparent canvas, centered mark)
const foregroundSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect x="120" y="120" width="272" height="272" rx="58" fill="#000000"/>
  <g transform="translate(154, 154) scale(2.04)">
    <path d="M28 34L50 22L72 34L50 46L28 34Z" stroke="#FFFFFF" stroke-width="5.5" stroke-linejoin="round" fill="none"/>
    <path d="M28 50L50 62L72 50" stroke="#A1A1AA" stroke-width="5.5" stroke-linejoin="round" fill="none"/>
    <path d="M28 66L50 78L72 66" stroke="#71717A" stroke-width="5.5" stroke-linejoin="round" fill="none"/>
  </g>
</svg>
`;

// 4. Centered Splash Logo on White Canvas
function getSplashSvg(w, h) {
  const minDim = Math.min(w, h);
  const logoSize = Math.max(140, Math.min(minDim * 0.35, 240));
  const x = (w - logoSize) / 2;
  const y = (h - logoSize) / 2;
  const scale = logoSize / 100;

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="#F8F9FA"/>
  <g transform="translate(${x}, ${y})">
    <rect width="${logoSize}" height="${logoSize}" rx="${logoSize * 0.22}" fill="#000000"/>
    <g transform="scale(${scale})">
      <path d="M28 34L50 22L72 34L50 46L28 34Z" stroke="#FFFFFF" stroke-width="5.5" stroke-linejoin="round" fill="none"/>
      <path d="M28 50L50 62L72 50" stroke="#A1A1AA" stroke-width="5.5" stroke-linejoin="round" fill="none"/>
      <path d="M28 66L50 78L72 66" stroke="#71717A" stroke-width="5.5" stroke-linejoin="round" fill="none"/>
    </g>
  </g>
</svg>
`;
}

async function run() {
  const iconDensities = [
    { dir: 'mipmap-mdpi', size: 48, fgSize: 108 },
    { dir: 'mipmap-hdpi', size: 72, fgSize: 162 },
    { dir: 'mipmap-xhdpi', size: 96, fgSize: 216 },
    { dir: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
    { dir: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
  ];

  for (const d of iconDensities) {
    const targetDir = path.join(resDir, d.dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    // ic_launcher.png
    await sharp(Buffer.from(squareSvg))
      .resize(d.size, d.size)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // ic_launcher_round.png
    await sharp(Buffer.from(roundSvg))
      .resize(d.size, d.size)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    // ic_launcher_foreground.png
    await sharp(Buffer.from(foregroundSvg))
      .resize(d.fgSize, d.fgSize)
      .png()
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    console.log(`Generated icons for ${d.dir}`);
  }

  // Splash screens
  const splashConfigs = [
    { dir: 'drawable', file: 'splash.png', w: 480, h: 480 },
    { dir: 'drawable-land-mdpi', file: 'splash.png', w: 480, h: 320 },
    { dir: 'drawable-land-hdpi', file: 'splash.png', w: 800, h: 480 },
    { dir: 'drawable-land-xhdpi', file: 'splash.png', w: 1280, h: 720 },
    { dir: 'drawable-land-xxhdpi', file: 'splash.png', w: 1600, h: 960 },
    { dir: 'drawable-land-xxxhdpi', file: 'splash.png', w: 1920, h: 1080 },
    { dir: 'drawable-port-mdpi', file: 'splash.png', w: 320, h: 480 },
    { dir: 'drawable-port-hdpi', file: 'splash.png', w: 480, h: 800 },
    { dir: 'drawable-port-xhdpi', file: 'splash.png', w: 720, h: 1280 },
    { dir: 'drawable-port-xxhdpi', file: 'splash.png', w: 960, h: 1600 },
    { dir: 'drawable-port-xxxhdpi', file: 'splash.png', w: 1080, h: 1920 },
  ];

  for (const s of splashConfigs) {
    const targetDir = path.join(resDir, s.dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const svgContent = getSplashSvg(s.w, s.h);
    await sharp(Buffer.from(svgContent))
      .resize(s.w, s.h)
      .png()
      .toFile(path.join(targetDir, s.file));

    console.log(`Generated splash for ${s.dir}`);
  }

  console.log('All icons and splash screens generated successfully!');
}

run().catch(console.error);
