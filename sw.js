const CACHE_NAME = 'athar-v1';
const MEDIA_CACHE = 'quran-media-cache';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/data.js',
  '/tafsir_logic.js',
  '/adhkar_advanced.js',
  '/hadiths_logic.js',
  '/prayer_logic.js',
  '/score_engine.js',
  '/ai_companion.js',
  '/adkar.json',
  '/favicon.png'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching essential assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME && key !== MEDIA_CACHE).map((key) => caches.delete(key))
      );
    })
  );
});

// Fetch Event: Cache-First Strategy with Range Request Support for Audio
self.addEventListener('fetch', (event) => {
  const isMedia = event.request.url.includes('.mp3') || event.request.url.includes('.mp4');

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If found in cache
      if (cachedResponse) {
        // Range Request Handling for Audio (Crucial for seeking and iOS/Chrome offline playback)
        if (isMedia && event.request.headers.get('range')) {
          return handleRangeRequest(event.request, cachedResponse);
        }
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(event.request).then((networkResponse) => {
        // Validation: Allow 200 (OK) and 0 (Opaque/CORS) responses for caching
        const status = networkResponse.status;
        if (!networkResponse || (status !== 200 && status !== 0)) {
          return networkResponse;
        }

        const isDataApi = event.request.url.includes('cdn.jsdelivr.net') || event.request.url.includes('.json');
        const responseToCache = networkResponse.clone();

        if (isMedia) {
          caches.open(MEDIA_CACHE).then(cache => cache.put(event.request, responseToCache));
        } else if (isDataApi || event.request.method === 'GET') {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
        }

        return networkResponse;
      }).catch(err => {
        console.error("Fetch failed", err);
      });
    })
  );
});

// Helper for Range Requests (Media Seeking)
async function handleRangeRequest(request, cachedResponse) {
  const rangeHeader = request.headers.get('range');
  const buffer = await cachedResponse.arrayBuffer();
  const bytes = rangeHeader.replace(/bytes=/, "").split("-");
  const start = parseInt(bytes[0], 10);
  const end = bytes[1] ? parseInt(bytes[1], 10) : buffer.byteLength - 1;

  const slicedBuffer = buffer.slice(start, end + 1);
  return new Response(slicedBuffer, {
    status: 206,
    statusText: 'Partial Content',
    headers: {
      ...cachedResponse.headers,
      'Content-Range': `bytes ${start}-${end}/${buffer.byteLength}`,
      'Content-Length': slicedBuffer.byteLength,
    }
  });
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data.action === 'download') {
    const url = event.data.url;
    event.waitUntil(
      caches.open(MEDIA_CACHE).then((cache) => {
        return fetch(url).then((response) => {
          if (response.ok) {
            cache.put(url, response);
            // Notify UI that download is complete
            self.clients.matchAll().then(clients => {
              clients.forEach(client => client.postMessage({ action: 'download-complete', url: url }));
            });
          }
        });
      })
    );
  } else if (event.data.action === 'show-notification') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
});

// Notification Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Open the app or focus the existing window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});
