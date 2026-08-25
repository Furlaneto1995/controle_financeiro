/* Controle Financeiro PWA v12.1.4 - Web Push com Firebase Cloud Messaging */
const CACHE_NAME = "financeiro-v12.1-final";
const ICONS = ["./manifest.json","./icon-96.png","./icon-192.png","./icon-512.png"];

importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging-compat.js");

const FIREBASE_CONFIG_SW = {
  apiKey: "AIzaSyDkLf1A9MhrAUrf8PL2e0n2J9w1davDgSg",
  authDomain: "controle-financeiro-e4f3b.firebaseapp.com",
  projectId: "controle-financeiro-e4f3b",
  storageBucket: "controle-financeiro-e4f3b.firebasestorage.app",
  messagingSenderId: "362985442376",
  appId: "1:362985442376:web:2ab89ca718779c9a785c7d",
  databaseURL: "https://controle-financeiro-e4f3b-default-rtdb.firebaseio.com"
};

try{
  if(!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG_SW);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload)=>{
    console.log("[SW FCM] Push recebido em background", payload);
    const titulo = payload.notification?.title || payload.data?.title || "Controle Financeiro";
    const corpo = payload.notification?.body || payload.data?.body || "Você tem contas a vencer!";
    return self.registration.showNotification(titulo, {
      body: corpo,
      icon: "./icon-192.png",
      badge: "./icon-96.png",
      tag: payload.data?.tag || "financeiro-push",
      vibrate: [200,100,200],
      data: { url: "./?v=12&utm_source=push" },
      requireInteraction: true,
      actions: [{action:"abrir",title:"💰 Abrir"},{action:"pagar",title:"✔️ Ver"}]
    });
  });
}catch(e){ console.warn("[SW] FCM init falhou", e); }

self.addEventListener("install", e=>{
  console.log("[SW v12.1.4] Install");
  e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ICONS)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate", e=>{
  console.log("[SW v12.1.4] Activate - limpando antigos");
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch", e=>{
  const url = e.request.url;
  if(e.request.mode==="navigate" || url.includes("index.html") || url.includes("manifest.json") || url.includes("service-worker.js") || url.includes("firebase")){
    e.respondWith(fetch(e.request, {cache:"no-store"}).catch(()=>caches.match("./icon-192.png")));
    return;
  }
  e.respondWith(
    fetch(e.request).then(resp=>{
      if(resp&&resp.ok){ const copy=resp.clone(); caches.open(CACHE_NAME).then(c=>c.put(e.request, copy)); }
      return resp;
    }).catch(()=>caches.match(e.request))
  );
});

self.addEventListener("notificationclick", e=>{
  e.notification.close();
  const url = e.notification.data?.url || "./?v=12";
  e.waitUntil(
    clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
      for(const c of list){ if(c.url.includes("controle_financeiro")||c.url.includes("index")) return c.focus(); }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener("message", e=>{
  if(!e.data) return;
  if(e.data.type==="SKIP_WAITING") self.skipWaiting();
});
