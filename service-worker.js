/* Controle Financeiro PWA - Service Worker */
const CACHE_NAME = "financeiro-pwa-v3";
const CACHE_VERSION = "v3";
const ASSETS_TO_CACHE = [
  "./",
  "./controle-financeiro.html",
  "./index.html",
  "./manifest.json",
  "./icon-96.png",
  "./icon-144.png",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-512-maskable.png"
];

// Instalação - cacheia arquivos principais
self.addEventListener("install", (event) => {
  console.log("[SW] Install", CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log("[SW] Cacheando assets");
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Ativação - limpa caches antigos
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate");
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log("[SW] Removendo cache antigo", k);
          return caches.delete(k);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch - estratégia Cache First com fallback Network
self.addEventListener("fetch", (event) => {
  const request = event.request;
  
  // Não cacheia requisições do Firebase (dados dinâmicos)
  if (request.url.includes("firebaseio.com") || request.url.includes("firestore") || request.url.includes("firebase")) {
    return; // deixa passar direto pra rede
  }

  // Para outros, tenta cache primeiro
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Atualiza cache em background (stale-while-revalidate)
        event.waitUntil(
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then(cache => cache.put(request, networkResponse));
            }
          }).catch(() => {})
        );
        return cachedResponse;
      }
      // Se não tem no cache, busca na rede e cacheia
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && request.method === "GET") {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, responseClone));
        }
        return networkResponse;
      }).catch(() => {
        // Offline fallback - se for navegação, retorna controle-financeiro.html
        if (request.mode === "navigate") {
          return caches.match("./controle-financeiro.html");
        }
      });
    })
  );
});

// Permite que o site peça para mostrar notificação via SW (mais confiável)
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === "SHOW_NOTIFICATION") {
    const title = data.title || "Controle Financeiro";
    const options = {
      body: data.body || "Você tem contas a vencer!",
      icon: "./icon-192.png",
      badge: "./icon-96.png",
      tag: "financeiro-vencimento",
      renotify: true,
      requireInteraction: false,
      vibrate: [200, 100, 200],
      data: {
        url: data.url || "./controle-financeiro.html",
        date: Date.now()
      },
      actions: data.actions || [
        { action: "abrir", title: "💰 Abrir app" },
        { action: "pagar", title: "✔️ Ver pendentes" }
      ]
    };
    self.registration.showNotification(title, options);
  }

  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Push event - para futuro uso com servidor Push (Firebase Cloud Messaging)
self.addEventListener("push", (event) => {
  console.log("[SW] Push recebido", event);
  let payload = { title: "Controle Financeiro", body: "Você tem contas a vencer!" };
  try {
    if (event.data) {
      const json = event.data.json();
      payload = { ...payload, ...json };
    }
  } catch (e) {
    if (event.data) payload.body = event.data.text();
  }

  const options = {
    body: payload.body,
    icon: "./icon-192.png",
    badge: "./icon-96.png",
    tag: "financeiro-vencimento-push",
    renotify: true,
    vibrate: [200, 100, 200],
    data: { url: "./controle-financeiro.html" },
    actions: [
      { action: "abrir", title: "💰 Abrir" },
      { action: "pagar", title: "✔️ Pagar" }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, options)
  );
});

// Clique na notificação
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification click", event.action);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "./controle-financeiro.html";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Se já tem janela aberta, foca nela
      for (const client of clientList) {
        if (client.url.includes("controle-financeiro") && "focus" in client) {
          if (event.action === "pagar") {
            client.postMessage({ type: "FILTRAR_PENDENTES" });
          }
          return client.focus();
        }
      }
      // Senão abre nova
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen + (event.action === "pagar" ? "?filtro=pendente" : ""));
      }
    })
  );
});

// Background Sync - tenta sincronizar backup quando voltar online
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-backup") {
    console.log("[SW] Sync backup");
    // Aqui poderia implementar lógica de sync com Firebase quando voltar online
    event.waitUntil(Promise.resolve());
  }
});

// Periodic Sync - para verificar vencimentos periodicamente (Chrome 80+)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "verificar-vencimentos") {
    console.log("[SW] Periodic sync - verificar vencimentos");
    event.waitUntil(
      // Notifica o cliente para verificar
      self.clients.matchAll({ type: "window" }).then(clients => {
        clients.forEach(client => client.postMessage({ type: "VERIFICAR_VENCIMENTOS" }));
      })
    );
  }
});
