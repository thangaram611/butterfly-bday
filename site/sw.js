// The invite, offline after one visit. The page, its code and its styles come from the network first, so a changed
// date or venue reaches everyone, and from this phone's copy when there's no signal. Pictures and fonts come from the
// copy first: they never change in place (a changed one gets a new name, or COPY a new number). The first visit isn't
// this worker's to serve, so the page hands it the list of everything it has loaded (js/main.js), which it copies from
// the browser's own cache.
const COPY = 'invite-1';
const key = url => { const u = new URL(url); return u.origin + u.pathname; }; // a family's ?to= link is the same page

addEventListener('install', () => skipWaiting());
addEventListener('activate', e => e.waitUntil(caches.keys()
  .then(names => Promise.all(names.filter(n => n !== COPY).map(n => caches.delete(n))))
  .then(() => clients.claim())));

addEventListener('message', e => e.waitUntil(caches.open(COPY).then(copy => Promise.all(e.data
  .filter(url => new URL(url).origin === location.origin)
  .map(async url => (await copy.match(key(url))) || fetch(url, { cache: 'force-cache' })
    .then(r => r.ok && copy.put(key(url), r), () => {}))))));

addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET' || new URL(request.url).origin !== location.origin) return;
  e.respondWith(caches.open(COPY).then(async copy => {
    const kept = await copy.match(key(request.url));
    if (kept && ['image', 'font'].includes(request.destination)) return kept;
    return fetch(request).then(r => (r.ok && copy.put(key(request.url), r.clone()), r), () => kept || Response.error());
  }));
});
