// 把 iCreate 原始抓取结果规范化为站点数据
// 输入: data/raw/{hero_list,tag_list}.json + data/raw/materials/*.json
// 输出: data/site/{heroes,index}.json + data/site/voices/<heroTagId>.json
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const RAW = path.join(ROOT, 'data/raw');
const OUT = path.join(ROOT, 'data/site');
const AUDIO_BASE = 'https://audio.wzry.panini-pigs.cn/audio';
const IMG_BASE = 'https://game.gtimg.cn/images/yxzj/img201606';

const readJSON = async (p) =>
  JSON.parse((await fs.readFile(p, 'utf8')).replace(/^\uFEFF/, ''));

// ---------- 载入原始数据 ----------
const heroList = (await readJSON(path.join(RAW, 'hero_list.json'))).data.list;
const tagList = (await readJSON(path.join(RAW, 'tag_list.json'))).data.list;
const tagById = new Map(tagList.map((t) => [String(t.id), t]));
const childrenOf = new Map();
for (const t of tagList) {
  const pid = String(t.pid);
  if (!childrenOf.has(pid)) childrenOf.set(pid, []);
  childrenOf.get(pid).push(t);
}

// 官方公开英雄表（拿 ename / 拼音 / 皮肤数量顺序）
const officialRoles = await readJSON(path.join(RAW, 'hero_roles.json')).catch(() => ({}));
const publicHeroes = await fetch(
  'https://pvp.qq.com/web201605/js/herolist.json'
).then((r) => r.json());
const publicByName = new Map(publicHeroes.map((h) => [h.cname, h]));

// 已下载的音频文件（用来标记可用性）
const audioDir = path.join(ROOT, 'data/audio_clean');
const haveAudio = new Set();
for (const d of await fs.readdir(audioDir, { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  for (const f of await fs.readdir(path.join(audioDir, d.name))) {
    haveAudio.add(`${d.name}/${f.replace(/\.mp3$/, '')}`);
  }
}

// ---------- 文本工具 ----------
// iCreate 的 career 编码顺序和官方 hero_type 完全不同：
// 用 77 个单职业英雄做交叉验证得出 1=刺客 2=战士 3=法师 4=射手 5=辅助 6=坦克
const ICREATE_CAREER = { 1: '刺客', 2: '战士', 3: '法师', 4: '射手', 5: '辅助', 6: '坦克' };
const CAREER = { 1: '战士', 2: '法师', 3: '坦克', 4: '刺客', 5: '射手', 6: '辅助' };
const ROLE_ORDER = ['战士', '法师', '坦克', '刺客', '射手', '辅助'];

const rolesOf = (career, pub, name, officialRole) => {
  // 元流之子 是多形态英雄，职业取标签名后缀（坦克/辅助/法师/刺客/射手），不能用通用数据
  if (String(name).startsWith('元流之子')) {
    const m = String(name).match(/(战士|法师|坦克|刺客|射手|辅助)$/);
    if (m) return [m[1]];
  }
  const fromOfficial = String(officialRole ?? '')
    .split(/[\/、,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
  let list = fromOfficial;
  if (!list.length) list = (career ?? []).map((c) => ICREATE_CAREER[Number(c)]).filter(Boolean);
  if (!list.length && pub) {
    list = [pub.hero_type, pub.hero_type2].filter((t) => Number(t) > 0).map((t) => CAREER[Number(t)]);
  }
  if (!list.length) {
    // 元流之子 等多形态英雄：标签名后缀就是职业
    const m = String(name).match(/(战士|法师|坦克|刺客|射手|辅助)$/);
    if (m) list = [m[1]];
  }
  return [...new Set(list)].sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b));
};

const CATEGORY_RULES = [
  ['相遇', /相遇/],
  ['挑衅', /挑衅|嘲讽/],
  ['回城', /回城/],
  ['复活', /复活|重生/],
  ['击杀', /击杀|首杀|双杀|三杀|四杀|五杀|超神/],
  ['死亡', /死亡/],
  ['技能', /技能|强普|被动|大招/],
  ['大厅', /大厅|泉水/],
  ['移动', /移动/],
  ['MVP', /mvp/i],
  ['待机', /idle|待机|展示/],
  ['动作', /动作|互动|插旗|鼓掌|抬手/],
  ['喊话', /喊话/],
  ['装备', /装备/],
  ['背景音乐', /音乐|主题曲|哼唱/],
];

const classify = (title) => {
  for (const [name, re] of CATEGORY_RULES) if (re.test(title)) return name;
  return '其他';
};

const seqOf = (title) => {
  const m = title.match(/[-_ ](\d+)(?:$|[^\d])/);
  return m ? Number(m[1]) : null;
};

// 标题里若带 "英雄_皮肤_" 前缀，剥掉并返回皮肤名
const splitSkinPrefix = (title, heroName, skinNames) => {
  const norm = title.replace(/^["'\s]+/, '').trim();
  if (norm.startsWith(heroName + '_')) {
    const rest = norm.slice(heroName.length + 1);
    for (const s of skinNames) {
      if (rest.startsWith(s + '_')) return { skin: s, rest: rest.slice(s.length + 1) };
    }
    const m = rest.match(/^(.+?)_(.*)$/);
    if (m) return { skin: m[1], rest: m[2] };
  }
  return { skin: null, rest: norm };
};

// ---------- 组装 ----------
const heroes = [];
for (const h of heroList) {
  const heroTagId = String(h.tagId);
  const tagName = tagById.get(heroTagId)?.name ?? String(h.name).split(/\s+/)[0];
  const name = tagName;
  const pub = publicByName.get(name) ?? null;
  const title = pub?.title ?? String(h.name).replace(name, '').trim();

  const skinTags = (childrenOf.get(heroTagId) ?? []).map((t) => ({
    id: String(t.id),
    name: t.name,
    isVariant: /（星元）|\(星元\)|闪光海报|辉光海报/.test(t.name),
  }));
  const skinByName = new Map(skinTags.map((s) => [s.name, s]));

  const materials = await readJSON(path.join(RAW, 'materials', `${heroTagId}.json`)).catch(
    () => []
  );

  const ename = pub?.ename ?? h.heroId;
  const avatarUrl = `${IMG_BASE}/heroimg/${ename}/${ename}.jpg`;

  // 皮肤顺序：以官方 skin_name 顺序为准，补上标签树里多出来的
  const officialSkinNames = pub?.skin_name ? pub.skin_name.split('|') : [title];
  const skins = [];
  officialSkinNames.forEach((sname, i) => {
    const tag = skinByName.get(sname) ?? null;
    skins.push({
      id: tag?.id ?? `${heroTagId}-${i}`,
      name: sname,
      isDefault: i === 0,
      isVariant: false,
      posterUrl: `${IMG_BASE}/skin/hero-info/${ename}/${ename}-bigskin-${i + 1}.jpg`,
      voiceCount: 0,
    });
  });
  for (const st of skinTags) {
    if (skins.some((s) => s.id === st.id)) continue;
    skins.push({
      id: st.id,
      name: st.name,
      isDefault: false,
      isVariant: st.isVariant,
      posterUrl: null,
      voiceCount: 0,
    });
  }

  const skinById = new Map(skins.map((s) => [s.id, s]));
  const skinNameList = [...skins].sort((a, b) => b.name.length - a.name.length).map((s) => s.name);

  const voices = [];
  for (const m of materials) {
    if (String(m.comType) !== '16') continue;
    const tags = String(m.tagId || '').split(',').map((s) => s.trim());
    let skin = tags.map((t) => skinById.get(t)).find(Boolean) ?? null;

    const { skin: prefixSkin, rest } = splitSkinPrefix(String(m.title ?? ''), name, skinNameList);
    if (!skin && prefixSkin) skin = skinById.get(skinByName.get(prefixSkin)?.id) ?? null;

    const rowkey = String(m.rowkey);
    const hasFile = haveAudio.has(`${heroTagId}/${rowkey}`);
    const text = String(m.summary ?? '').trim();

    voices.push({
      id: rowkey,
      heroId: heroTagId,
      skinId: skin?.id ?? null,
      skinName: skin?.name ?? null,
      title: String(m.title ?? '').trim(),
      category: classify(rest) === '其他' ? '台词' : classify(rest),
      seq: seqOf(rest),
      text: text || String(m.title ?? '').trim(),
      hasText: Boolean(text),
      duration: Number(m.videoTime) || null,
      audio: hasFile ? `${AUDIO_BASE}/${heroTagId}/${rowkey}.mp3` : null,
    });
    if (skin) skin.voiceCount += 1;
  }

  voices.sort((a, b) => (a.skinId ?? '').localeCompare(b.skinId ?? '') || (a.seq ?? 999) - (b.seq ?? 999));

  heroes.push({
    id: heroTagId,
    heroId: h.heroId,
    ename,
    name,
    title,
    slug: pub?.id_name ?? `hero-${h.heroId}`,
    roles: rolesOf(h.career, pub, name, officialRoles[String(h.heroId)]?.role),
    pubTime: h.pubTime ?? null,
    isNew: Boolean(h.isNew),
    avatarUrl,
    voiceCount: voices.length,
    skinCount: skins.filter((s) => !s.isVariant).length,
    skins,
    voices,
  });
}

heroes.sort((a, b) => b.voiceCount - a.voiceCount);

// ---------- 落盘 ----------
await fs.mkdir(path.join(OUT, 'voices'), { recursive: true });
const manifest = [];
for (const h of heroes) {
  const { voices, ...rest } = h;
  manifest.push({ ...rest, voiceCount: voices.length });
  await fs.writeFile(
    path.join(OUT, 'voices', `${h.id}.json`),
    JSON.stringify(voices),
    'utf8'
  );
}
await fs.writeFile(path.join(OUT, 'heroes.json'), JSON.stringify(manifest), 'utf8');

// 搜索索引：英雄 + 皮肤 + 台词压缩成扁平数组
const searchIndex = [];
for (const h of heroes) {
  searchIndex.push({ t: 'h', id: h.id, n: h.name, p: h.slug, s: h.title });
  for (const s of h.skins) searchIndex.push({ t: 's', id: s.id, h: h.id, n: s.name });
  for (const v of h.voices) {
    searchIndex.push({ t: 'v', id: v.id, h: h.id, n: v.text, a: v.audio ? 1 : 0 });
  }
}
await fs.writeFile(path.join(OUT, 'index.json'), JSON.stringify(searchIndex), 'utf8');

const totalVoices = heroes.reduce((n, h) => n + h.voices.length, 0);
const playable = heroes.reduce((n, h) => n + h.voices.filter((v) => v.audio).length, 0);
const totalSkins = heroes.reduce((n, h) => n + h.skins.length, 0);
console.log(
  JSON.stringify(
    {
      heroes: heroes.length,
      skins: totalSkins,
      voices: totalVoices,
      playable,
      noAudio: totalVoices - playable,
      missingText: heroes.reduce((n, h) => n + h.voices.filter((v) => !v.hasText).length, 0),
      searchRows: searchIndex.length,
      top5: heroes.slice(0, 5).map((h) => `${h.name}(${h.voices.length})`),
    },
    null,
    2
  )
);
