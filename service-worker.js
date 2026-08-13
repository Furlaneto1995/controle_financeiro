/* Controle Financeiro PWA v9 - FIX FINAL: apaga tudo antigo e força atualização */
const CACHE_NAME = "financeiro-pwa-v9-final";
const VERSION = "v9";

self.addEventListener("install", (e) => {
  console.log("[SW v9] Install - Limpando tudo antigo antes");
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k=>{
      console.log("[SW v9] Apagando cache", k);
      return caches.delete(k);
    }))).then(()=>{
      // Não cacheia HTML, só ícones
      return caches.open(CACHE_NAME).then(c=>c.addAll([
        "./manifest.json",
        "./icon-96.png",
        "./icon-192.png",
        "./icon-512.png"
      ]));
    }).then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  console.log("[SW v9] Activate - tomando controle total e recarregando clientes antigos");
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
    .then(()=>self.clients.matchAll({type:"window"})).then(clients=>{
      clients.forEach(client=>{
        // Avisa clientes que tem nova versão e precisam recarregar
        client.postMessage({type:"NEW_VERSION", version: VERSION});
      });
    })
  );
});

self.addEventListener("fetch", (e) => {
  const url = e.request.url;
  // HTML, manifest, SW, firebase NUNCA cacheia
  if (e.request.mode === "navigate" || 
      url.includes("controle-financeiro.html") ||
      url.includes("index.html") ||
      url.includes("manifest.json") ||
      url.includes("service-worker.js") ||
      url.includes("firebase")) {
    e.respondWith(fetch(e.request, {cache: "no-store"}).catch(()=>caches.match("./icon-192.png")));
    return;
  }
  // Ícones: cache first
  e.respondWith(
    caches.match(e.request).then(cached=>{
      if(cached) return cached;
      return fetch(e.request).then(nr=>{
        if(nr&&nr.status===200) caches.open(CACHE_NAME).then(c=>c.put(e.request, nr.clone()));
        return nr;
      });
    })
  );
});

self.addEventListener("message", (e) => {
  if(!e.data) return;
  if(e.data.type==="SKIP_WAITING") self.skipWaiting();
  if(e.data.type==="CLEAR_ALL"){
    e.waitUntil(caches.keys().then(ks=>Promise.all(ks.map(k=>caches.delete(k)))).then(()=>self.skipWaiting()));
  }
});
