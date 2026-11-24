// 缓存策略：页面导航走网络优先（保证每次刷新拿到最新 HTML），静态资源 SWR，音频缓存优先
const VERSION = 'v2';
const SHELL = `wzry-shell-${VERSION}`;
const DATA = `wzry-data-${VERSION}`;
const AUDIO = `wzry-audio-${VERSION}`;
const AUDIO_MAX = 400;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(SHELL);
        await cache.add(new Request('./', { cache: 'reload' }));
      } catch {
        /* 首次安装拿不到也用不着阻断 */
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => ![SHELL, DATA, AUDIO].includes(k)).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

async function trimAudioCache() {
  const cache = await caches.open(AUDIO);
  const keys = await cache.keys();
  if (keys.length <= AUDIO_MAX) return;
  for (const k of keys.slice(0, keys.length - AUDIO_MAX)) await cache.delete(k);
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1) 音频：缓存优先 + 上限，R2 已带 immutable
  if (url.hostname.endsWith('panini-pigs.cn') && url.pathname.endsWith('.mp3')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(AUDIO);
        const hit = await cache.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) cache.put(req, res.clone()).then(trimAudioCache);
        return res;
      })()
    );
    return;
  }

  // 2) 页面导航：网络优先，失败才回退到缓存的壳（这样普通刷新永远是最新版）
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          if (fresh.ok) {
            const cache = await caches.open(SHELL);
            cache.put('./', fresh.clone());
          }
          return fresh;
        } catch {
          return (await caches.match('./')) || (await caches.match(req)) || Response.error();
        }
      })()
    );
    return;
  }

  // 3) 同源数据 JSON：陈旧就先用，后台再更新
  if (url.origin === self.location.origin && url.pathname.includes('/data/')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(DATA);
        const hit = await cache.match(req);
        const net = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => hit);
        return hit || net;
      })()
    );
    return;
  }

  // 4) 其余同源静态资源（带 hash）：缓存优先，后台更新
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL);
        const hit = await cache.match(req);
        const net = fetch(req)
          .then((res) => {
            if (res.ok && res.type === 'basic') cache.put(req, res.clone());
            return res;
          })
          .catch(() => hit);
        return hit || net;
      })()
    );
  }
});
