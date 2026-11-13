// ai-happy-01 entry (Node 22, standard library only): copies the image beside this
// file to /output/entry.png, validating it first. The gate takes a whole PNG or JPEG
// of at most 1 MiB and 1024 by 1024 pixels; the judge sees exactly the bytes copied.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_IMAGE_BYTES = 1048576;
const MAX_DIMENSION = 1024;

const here = dirname(fileURLToPath(import.meta.url));
const bytes = readFileSync(join(here, 'entry.png'));

// The format is told by the first bytes: a JPEG starts FF D8 FF, a PNG starts
// with the 8-byte PNG signature.
const isJpeg =
  bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
const isPng =
  bytes.length >= 8 &&
  bytes[0] === 0x89 &&
  bytes[1] === 0x50 &&
  bytes[2] === 0x4e &&
  bytes[3] === 0x47 &&
  bytes[4] === 0x0d &&
  bytes[5] === 0x0a &&
  bytes[6] === 0x1a &&
  bytes[7] === 0x0a;
if (!isJpeg && !isPng) {
  console.error('entry.png is neither a JPEG nor a PNG (bad magic bytes)');
  process.exit(1);
}
if (bytes.length > MAX_IMAGE_BYTES) {
  console.error(`entry.png is ${bytes.length} bytes, over the ${MAX_IMAGE_BYTES}-byte limit`);
  process.exit(1);
}

// Dimensions, parsed from the image header itself (stdlib only): a JPEG's Start
// Of Frame marker carries height then width; a PNG's IHDR chunk carries width
// then height.
function dimensions(buf: Buffer): { width: number; height: number } {
  if (buf[0] === 0xff) {
    // JPEG: walk the segments after the SOI marker until a Start Of Frame.
    let i = 2;
    while (i + 1 < buf.length) {
      if (buf[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = buf[i + 1];
      if (marker === 0xff) {
        i++; // fill byte
        continue;
      }
      if (marker === 0xd9) break; // EOI: no frame found
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        i += 2; // standalone marker, no length field
        continue;
      }
      if (i + 3 >= buf.length) break;
      const len = buf.readUInt16BE(i + 2);
      if (
        [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(
          marker,
        )
      ) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
    throw new Error('no JPEG Start Of Frame marker found');
  }
  // PNG: the IHDR chunk follows the 8-byte signature.
  if (buf.toString('ascii', 12, 16) !== 'IHDR') throw new Error('PNG has no IHDR chunk');
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

const { width, height } = dimensions(bytes);
if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
  console.error(`entry.png is ${width}x${height}, over the ${MAX_DIMENSION}x${MAX_DIMENSION} limit`);
  process.exit(1);
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, 'entry.png');
writeFileSync(outPath, bytes);
console.log(
  `wrote ${bytes.length} bytes (${isJpeg ? 'JPEG' : 'PNG'}, ${width}x${height}) to ${outPath}`,
);
