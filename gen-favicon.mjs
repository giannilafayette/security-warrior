import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(__dirname, 'favicon.svg');
const svg = fs.readFileSync(svgPath);

await sharp(svg).resize(32, 32).png().toFile(path.join(__dirname, 'favicon-32x32.png'));
console.log('favicon-32x32.png done');

await sharp(svg).resize(192, 192).png().toFile(path.join(__dirname, 'favicon-192x192.png'));
console.log('favicon-192x192.png done');

// ICO = 16, 32, 48 PNGs concatenated in ICO format (simple approach: use 32x32 as ico)
// Build a proper ICO file manually
const sizes = [16, 32, 48];
const pngBuffers = await Promise.all(
  sizes.map(s => sharp(svg).resize(s, s).png().toBuffer())
);

// ICO file format
function buildIco(pngs) {
  const count = pngs.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = headerSize + dirEntrySize * count;

  let offset = dirSize;
  const dir = Buffer.alloc(dirSize);

  // ICONDIR header
  dir.writeUInt16LE(0, 0);     // reserved
  dir.writeUInt16LE(1, 2);     // type: ICO
  dir.writeUInt16LE(count, 4); // count

  for (let i = 0; i < count; i++) {
    const size = sizes[i];
    const png = pngs[i];
    const entry = headerSize + i * dirEntrySize;
    dir.writeUInt8(size === 256 ? 0 : size, entry);      // width
    dir.writeUInt8(size === 256 ? 0 : size, entry + 1);  // height
    dir.writeUInt8(0, entry + 2);   // color count
    dir.writeUInt8(0, entry + 3);   // reserved
    dir.writeUInt16LE(1, entry + 4); // color planes
    dir.writeUInt16LE(32, entry + 6); // bits per pixel
    dir.writeUInt32LE(png.length, entry + 8);  // size
    dir.writeUInt32LE(offset, entry + 12);     // offset
    offset += png.length;
  }

  return Buffer.concat([dir, ...pngs]);
}

const icoBuffer = buildIco(pngBuffers);
fs.writeFileSync(path.join(__dirname, 'favicon.ico'), icoBuffer);
console.log('favicon.ico done');
