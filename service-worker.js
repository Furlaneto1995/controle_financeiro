/* Controle Financeiro PWA v8 - FIX DEFINITIVO: nunca cacheia HTML, só ícones */
const CACHE_NAME = "financeiro-pwa-v8-no-html-cache";
const ICONS_CACHE = [
  "./manifest.json",
  "./icon-96.png",
  "./icon-144.png",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png"
];

self.addEventListener("install", (e) => {
  console.log("[SW v8] Install - cacheando SÓ ícones, NUNCA HTML");
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(ICONS_CACHE)).then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  console.log("[SW v8] Activate - apagando TODOS caches antigos de HTML");
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k=>{
      console.log("[SW v8] Deletando cache antigo", k);
      return caches.delete(k);
    }))).then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = e.request.url;
  
  // NUNCA intercepta HTML, manifest ou service-worker - deixa ir direto na rede para sempre pegar versão nova
  if (e.request.mode === "navigate" || 
      url.includes("controle-financeiro.html") || 
      url.includes("index.html") ||
      url.includes("manifest.json") ||
      url.includes("service-worker.js") ||
      url.includes("firebaseio.com") ||
      url.includes("firebase")) {
    // Network only - sem cache, sempre última versão
    e.respondWith(fetch(e.request).catch(()=>caches.match("./icon-192.png")));
    return;
  }
  
  // Só para ícones: cache first
  e.respondWith(
    caches.match(e.request).then(cached=>{
      if(cached) return cached;
      return fetch(e.request).then(nr=>{
        if(nr&&nr.status===200){
          caches.open(CACHE_NAME).then(c=>c.put(e.request, nr.clone()));
        }
        return nr;
      });
    })
  );
});

async function agendarNotificacaoDiaria(timestamp, titulo, corpo) {
  if ('showTrigger' in Notification.prototype) {
    try {
      const tag = "financeiro-agendado-" + new Date(timestamp).toISOString().slice(0,10);
      const existing = await self.registration.getNotifications({ tag });
      existing.forEach(n=>n.close());
      await self.registration.showNotification(titulo, {
        body: corpo,
        icon: "./icon-192.png",
        badge: "./icon-96.png",
        tag: tag,
        renotify: true,
        data: { url: "./controle-financeiro.html", agendada: true },
        showTrigger: new TimestampTrigger(timestamp),
        actions: [{action:"abrir",title:"💰 Abrir"},{action:"pagar",title:"✔️ Pendentes"}]
      });
      return true;
    } catch(e){ console.error(e); return false; }
  }
  return false;
}

self.addEventListener("message", async (event) => {
  const data = event.data;
  if (!data) return;
  if (data.type === "SHOW_NOTIFICATION") {
    event.waitUntil(self.registration.showNotification(data.title||"Controle Financeiro",{
      body: data.body||"Contas a vencer!",
      icon:"./icon-192.png", badge:"./icon-96.png", tag:"financeiro-vencimento", renotify:true,
      data:{url:data.url||"./controle-financeiro.html"}
    }));
  }
  if (data.type === "SCHEDULE_DAILY_NOTIFICATION") {
    event.waitUntil(agendarNotificacaoDiaria(data.timestamp, data.title, data.body));
  }
  if (data.type === "SKIP_WAITING") self.skipWaiting();
  if (data.type === "CLEAR_ALL_CACHE") {
    event.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>caches.delete(k)))).then(()=>self.skipWaiting()));
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url||"./controle-financeiro.html";
  event.waitUntil(
    clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
      for(const c of list){ if(c.url.includes("controle-financeiro")&&"focus" in c){ return c.focus(); } }
      if(clients.openWindow) return clients.openWindow(url);
    })
  );
});
