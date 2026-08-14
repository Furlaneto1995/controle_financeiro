/* Controle Financeiro PWA v11.1 - FIX clone error */
const CACHE_NAME = "financeiro-pwa-v98";
const ICONS = ["./manifest.json","./icon-96.png","./icon-192.png","./icon-512.png"];

self.addEventListener("install", e=>{
  console.log("[SW 9.8] Install");
  e.waitUntil(
    caches.open(CACHE_NAME).then(c=>c.addAll(ICONS)).then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate", e=>{
  console.log("[SW 9.8] Activate");
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch", e=>{
  const url = e.request.url;
  // NUNCA cacheia HTML, JS, manifest, firebase
  if(e.request.mode==="navigate" || url.includes("controle_financeiro") || url.includes("index.html") || url.includes("manifest.json") || url.includes("service-worker.js") || url.includes("firebase")){
    e.respondWith(fetch(e.request, {cache:"no-store"}).catch(()=>caches.match("./icon-192.png") || fetch("./")));
    return;
  }
  // Ícones: tenta rede, se falhar usa cache, sem clone duplicado
  e.respondWith(
    fetch(e.request).then(resp=>{
      if(resp && resp.ok){
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(c=>c.put(e.request, copy));
      }
      return resp;
    }).catch(()=>caches.match(e.request))
  );
});

self.addEventListener("message", async e=>{
  if(!e.data) return;
  if(e.data.type==="SHOW_NOTIFICATION"){
    await self.registration.showNotification(e.data.title||"Controle", {
      body:e.data.body||"Contas a vencer",
      icon:"./icon-192.png", badge:"./icon-96.png", tag:"vencimento"
    });
  }
  if(e.data.type==="SCHEDULE_DAILY_NOTIFICATION"){
    if('showTrigger' in Notification.prototype){
      try{
        await self.registration.showNotification(e.data.title,{
          body:e.data.body, icon:"./icon-192.png", badge:"./icon-96.png",
          tag:"agendado-"+new Date(e.data.timestamp).toISOString().slice(0,10),
          showTrigger: new TimestampTrigger(e.data.timestamp)
        });
      }catch(err){ console.error(err); }
    }
  }
  if(e.data.type==="SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("notificationclick", e=>{
  e.notification.close();
  e.waitUntil(clients.matchAll({type:"window"}).then(list=>{
    for(const c of list){ if(c.url.includes("controle_financeiro")||c.url.includes("index")) return c.focus(); }
    return clients.openWindow("./?v=9.8");
  }));
});
