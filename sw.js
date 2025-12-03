const CACHE_NAME = 'recta-entera-gh-v1';

// RUTAS LOCALES A CACHEAR
const LOCAL_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './css/styles.css',
    './js/config.js',
    './js/app.js',
    './js/Quiz.js',
    './js/Game.js',
    './js/Storage.js'
];

// RUTAS EXTERNAS A CACHEAR

const EXTERNAL_ASSETS = ['https://cdn.tailwindcss.com'];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            await cache.addAll(LOCAL_ASSETS);
            for (const url of EXTERNAL_ASSETS) {
                const req = new Request(url, { mode: 'no-cors' });
                const res = await fetch(req);
                await cache.put(req, res);
            }
        }).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then(keys => Promise.all(
                keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
            ))
        ])
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('api/')) return;

    event.respondWith(
        caches.match(event.request, { ignoreSearch: true }).then(cached => {
            return cached || fetch(event.request);
        })
    );
});

// Listener para Push
self.addEventListener('push', (event) => {
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
        badge: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
        vibrate: [100, 50, 100],
        data: { url: data.url || './' }
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            for (const client of clientList) {
                if (client.url.includes('index.html') && 'focus' in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow('./');
        })
    );
});