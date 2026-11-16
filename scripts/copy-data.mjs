import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'data', 'site');
const DST = path.join(ROOT, 'public', 'data');

await fs.rm(DST, { recursive: true, force: true });
await fs.mkdir(DST, { recursive: true });
await fs.cp(SRC, DST, { recursive: true });

let files = 0;
let bytes = 0;
for (const d of await fs.readdir(DST, { withFileTypes: true })) {
  const p = path.join(DST, d.name);
  if (d.isDirectory()) {
    for (const f of await fs.readdir(p)) {
      files++;
      bytes += (await fs.stat(path.join(p, f))).size;
    }
  } else {
    files++;
    bytes += (await fs.stat(p)).size;
  }
}
console.log(`copied ${files} files, ${(bytes / 1024 / 1024).toFixed(1)} MB -> public/data`);
