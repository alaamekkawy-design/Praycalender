const CACHE_NAME = 'islamic-calendar-v4';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json'
  // تم حذف './Location.html' لأنه غير موجود
  // الأيقونات ستُخزَّن تلقائياً عند جلبها
];

// تثبيت Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('تم فتح التخزين المؤقت');
        return cache.addAll(urlsToCache);
      })
      .catch(error => console.error('خطأ في التخزين:', error))
  );
  self.skipWaiting();
});

// اعتراض الطلبات (هذا سيخزِّن الأيقونات تلقائياً عند الحاجة)
self.addEventListener('fetch', event => {
  // استثناء طلبات API
  if (event.request.url.includes('aladhan.com')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // من التخزين المؤقت
        }
        
        return fetch(event.request).then(response => {
          // تخزين الملفات الناجحة (بما فيها الصور من مجلد icons)
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        });
      })
  );
});

// تحديث التخزين القديم
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('حذف التخزين القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
