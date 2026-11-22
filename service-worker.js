var CACHE_NAME = 'flip-clock-v1';
var FILES_TO_CACHE = [
  './',
  './index.html',
  './script.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(FILES_TO_CACHE);
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(key){
        return key !== CACHE_NAME;
      }).map(function(key){
        return caches.delete(key);
      }));
    }).then(function(){
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event){
  event.respondWith(
    caches.match(event.request).then(function(cached){
      return cached || fetch(event.request).catch(function(){
        return caches.match('./index.html');
      });
    })
  );
});
