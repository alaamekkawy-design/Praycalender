// sw.js - Service Worker مع إدارة التحديثات المثالية
const CACHE_NAME = 'prayer-times-v2';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    './install.js',
    './location.js'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('✅ تم فتح التخزين المؤقت');
                return cache.addAll(urlsToCache);
            })
            .catch(err => console.error('❌ خطأ في التخزين المؤقت:', err))
    );
    // تفعيل الـ SW الجديد فوراً دون انتظار
    self.skipWaiting();
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ حذف التخزين القديم:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // السيطرة على جميع الصفحات المفتوحة فوراً
    event.waitUntil(clients.claim());
});

// الاستماع لرسائل من الصفحة الرئيسية
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('📢 تم استلام أمر SKIP_WAITING');
        self.skipWaiting();
    }
});

// استراتيجية التخزين المؤقت (Cache First ثم Network)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then(response => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                });
            })
    );
});
