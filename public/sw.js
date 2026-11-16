const SHELL = 'wzry-shell-v1';
const DATA = 'wzry-data-v1';
const AUDIO = 'wzry-audio-v1';
const AUDIO_MAX = 400; // 最多缓存约 400 条语音（约 25MB）

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.add('./')).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![SHELL, DATA, AUDIO].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trimAudioCache() {
  const cache = await caches.open(AUDIO);
  const keys = await cache.keys();
  if (keys.length <= AUDIO_MAX) return;
  for (const k of keys.slice(0, keys.length - AUDIO_MAX)) await cache.delete(k);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  // 音频：cache-first + 上限
  if (url.hostname.endsWith('panini-pigs.cn') && url.pathname.endsWith('.mp3')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(AUDIO);
        const hit = await cache.match(request);
        if (hit) return hit;
        const res = await fetch(request);
        if (res.ok) {
          cache.put(request, res.clone()).then(() => trimAudioCache());
        }
        return res;
      })()
    );
    return;
  }

  // 元数据 JSON：stale-while-revalidate
  if (url.origin === location.origin && url.pathname.includes('/data/')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(DATA);
        const hit = await cache.match(request);
        const net = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => hit);
        return hit || net;
      })()
    );
    return;
  }

  // 其余同源资源：缓存优先，回退网络
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request)
            .then((res) => {
              if (res.ok && res.type === 'basic') {
                caches.open(SHELL).then((c) => c.put(request, res.clone()));
              }
              return res;
            })
            .catch(() => caches.match('./'))
      )
    );
  }
});
