/* Controle Financeiro PWA v12.7 - Push Web nativo/FCM */
const CACHE_NAME = "financeiro-v12.7";
const ICONS = ["./manifest.json", "./icon-96.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", event => {
  console.log("[SW v12.7] Install");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ICONS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  console.log("[SW v12.7] Activate - limpando caches antigos");
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// Recebe mensagens FCM data-only mesmo quando o PWA está fechado.
// O workflow envia data.title, data.body, data.url e data.tag.
self.addEventListener("push", event => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (erro) {
    payload = { data: { body: event.data ? event.data.text() : "Você tem contas a vencer!" } };
  }

  const notification = payload.notification || {};
  const data = payload.data || {};
  const titulo = notification.title || data.title || "Controle Financeiro";
  const corpo = notification.body || data.body || "Você tem contas a vencer!";
  const url = data.url || notification.click_action || "./";
  const tag = data.tag || "financeiro-push";

  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: corpo,
      icon: "./icon-192.png",
      badge: "./icon-96.png",
      tag,
      vibrate: [200, 100, 200],
      requireInteraction: true,
      data: { url },
      actions: [
        { action: "abrir", title: "💰 Abrir" },
        { action: "ver", title: "✔️ Ver" }
      ]
    })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url || "./";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(lista => {
      for (const cliente of lista) {
        if (cliente.url.includes("controle_financeiro") || cliente.url.includes("index")) {
          return cliente.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener("message", event => {
  if (!event.data) return;

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (event.data.type === "SHOW_NOTIFICATION") {
    const titulo = event.data.title || "Controle Financeiro";
    const corpo = event.data.body || "Você tem contas a vencer!";
    const url = event.data.url || "./";
    event.waitUntil(self.registration.showNotification(titulo, {
      body: corpo,
      icon: "./icon-192.png",
      badge: "./icon-96.png",
      tag: "financeiro-push",
      data: { url }
    }));
  }
});

self.addEventListener("fetch", event => {
  const url = event.request.url;
  if (
    event.request.mode === "navigate" ||
    url.includes("index.html") ||
    url.includes("manifest.json") ||
    url.includes("service-worker.js") ||
    url.includes("firebase")
  ) {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .catch(() => caches.match("./icon-192.png"))
    );
    return;
  }

  event.respondWith(
    fetch(event.request).then(response => {
      if (response && response.ok) {
        const copia = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copia));
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});
