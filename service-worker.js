const CACHE_NAME = 'grades-system-v10.0';
const urlsToCache = [
  '/grade-system-PWA/',
  '/grade-system-PWA/index.html',
  '/grade-system-PWA/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] جاري التثبيت...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] جاري تخزين الملفات في الذاكرة');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('[Service Worker] تم التثبيت بنجاح');
        return self.skipWaiting();
      })
  );
});

// تفعيل Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] جاري التفعيل...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] حذف الذاكرة القديمة:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Service Worker مفعل وجاهز');
      return self.clients.claim();
    })
  );
});

// معالجة الطلبات
self.addEventListener('fetch', event => {
  // تخطي طلبات Firebase و Google
  if (event.request.url.includes('firebase') || 
      event.request.url.includes('googleapis') || 
      event.request.url.includes('gstatic')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
            
          return response;
        });
      })
      .catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/grade-system-PWA/index.html');
        }
      })
  );
});

// استقبال الرسائل
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});