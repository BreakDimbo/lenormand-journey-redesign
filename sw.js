/* Stale-while-revalidate for the app shell and assets: repeat visits and screen switches are served from cache,
   and anything the team redeploys is picked up in the background for the next load. Bump V to purge. */
const V='lj-v1-deck3';
self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==location.origin)return;
 if(/\.(mp3|ogg)$/.test(u.pathname)||r.headers.get('range'))return;
 e.respondWith(caches.open(V).then(async c=>{const hit=await c.match(r);
  const net=fetch(r).then(res=>{if(res.ok&&res.type==='basic')c.put(r,res.clone());return res}).catch(()=>hit);
  if(hit){e.waitUntil(net);return hit}return net}))});
