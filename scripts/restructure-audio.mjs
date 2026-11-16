// 把下载时按随机标签分目录的 mp3，重组为 data/audio/<英雄tag>/<rowkey>.mp3
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const RAW = path.join(ROOT, 'data/raw/materials');
const SRC = path.join(ROOT, 'data/audio');
const DST = path.join(ROOT, 'data/audio_clean');

const decode = (buf) => JSON.parse(buf.toString('utf8').replace(/^\uFEFF/, ''));

// rowkey -> 英雄 tag（materials 的文件名就是英雄 tag）
const map = new Map();
for (const f of await fs.readdir(RAW)) {
  const heroTag = f.replace(/\.json$/, '');
  for (const m of decode(await fs.readFile(path.join(RAW, f)))) {
    map.set(String(m.rowkey), heroTag);
  }
}

let moved = 0;
let missing = 0;
for (const d of await fs.readdir(SRC, { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  const dir = path.join(SRC, d.name);
  for (const f of await fs.readdir(dir)) {
    if (!f.endsWith('.mp3')) continue;
    const rowkey = f.replace(/\.mp3$/, '');
    const heroTag = map.get(rowkey);
    if (!heroTag) {
      missing++;
      continue;
    }
    const outDir = path.join(DST, heroTag);
    await fs.mkdir(outDir, { recursive: true });
    await fs.rename(path.join(dir, f), path.join(outDir, f));
    moved++;
  }
}
console.log(JSON.stringify({ moved, missing, heroDirs: (await fs.readdir(DST)).length }));
