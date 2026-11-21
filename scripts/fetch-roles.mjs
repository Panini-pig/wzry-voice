// 拉取每个英雄的官方职业（王者资料库 hero detail），缓存到 data/raw/hero_roles.json
// 用法: node scripts/fetch-roles.mjs
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const RAW = path.join(ROOT, 'data/raw');
const OUT = path.join(RAW, 'hero_roles.json');

const heroList = JSON.parse(
  (await fs.readFile(path.join(RAW, 'hero_list.json'), 'utf8')).replace(/^\uFEFF/, '')
).data.list;

const cache = await fs
  .readFile(path.join(OUT), 'utf8')
  .then((t) => JSON.parse(t.replace(/^\uFEFF/, '')))
  .catch(() => ({}));

let fetched = 0;
for (const h of heroList) {
  const id = String(h.heroId);
  if (cache[id]) continue;
  try {
    const res = await fetch(`https://pvp.qq.com/zlkdatasys/yuzhouzhan/hero/detail/${id}.json`, {
      headers: { referer: 'https://pvp.qq.com/', 'user-agent': 'Mozilla/5.0' },
    });
    const json = await res.json();
    const role = String(json.yzzyxz_1918 ?? '').trim();
    const name = String(json.yzzyxm_4588 ?? '').trim();
    if (role) {
      cache[id] = { name, role };
      fetched++;
    }
    await new Promise((r) => setTimeout(r, 120));
  } catch (e) {
    console.warn('fail', id, e.message);
  }
}

await fs.writeFile(OUT, JSON.stringify(cache, null, 0), 'utf8');
console.log(JSON.stringify({ fetched, total: Object.keys(cache).length, heroes: heroList.length }));
