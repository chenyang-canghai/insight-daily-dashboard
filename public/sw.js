const CACHE_VERSION = "insight-daily-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;
const SCOPE = new URL(self.registration.scope);
const scopedUrl = (path) => new URL(path, SCOPE).toString();
const OFFLINE_URL = scopedUrl("offline.html");
const HOME_URL = scopedUrl("./");
const PRECACHE = [
  OFFLINE_URL,
  scopedUrl("manifest.webmanifest"),
  scopedUrl("icons/pwa-192.png"),
  scopedUrl("icons/pwa-512.png"),
  scopedUrl("icons/pwa-maskable-512.png"),
  scopedUrl("icons/apple-touch-icon.png"),
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("insight-daily-") &&
                ![STATIC_CACHE, PAGE_CACHE].includes(key),
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (
      (await cache.match(request)) ||
      (await cache.match(HOME_URL)) ||
      (await caches.match(OFFLINE_URL)) ||
      new Response("Offline", { status: 503, statusText: "Offline" })
    );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const fresh = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached || Response.error());
  return cached || fresh;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== SCOPE.origin ||
    !url.pathname.startsWith(SCOPE.pathname) ||
    url.pathname.endsWith("/sw.js")
  ) {
    return;
  }
  if (
    request.mode === "navigate" ||
    url.pathname.endsWith("/data/latest.json")
  ) {
    event.respondWith(networkFirst(request));
    return;
  }
  if (
    url.pathname.includes("/_next/static/") ||
    /\.(?:css|js|png|svg|ico|webmanifest|woff2?)$/i.test(url.pathname)
  ) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
