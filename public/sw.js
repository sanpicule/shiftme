const CACHE_NAME = 'shiftme-v3';
const urlsToCache = ['/', '/manifest.json', '/shiftme-icon.png'];

// インストール時のキャッシュ
self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Cache addAll failed:', error);
      }),
  );
  // 新しいサービスワーカーを即座にアクティブ化
  self.skipWaiting();
});

// フェッチ時のキャッシュ戦略（Network First with Cache Fallback）
self.addEventListener('fetch', event => {
  // Chrome拡張機能やその他の特殊なスキームのリクエストはキャッシュしない
  if (event.request.scheme !== 'https' && event.request.scheme !== 'http') {
    return;
  }

  // 同じオリジンのリクエストのみをキャッシュ対象とする
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // レスポンスが有効な場合、キャッシュに保存
          if (response && response.status === 200 && response.type === 'basic') {
            const responseToCache = response.clone();
            caches
              .open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              })
              .catch(error => {
                console.warn('Failed to cache response:', error);
              });
          }
          return response;
        })
        .catch(() => {
          // ネットワークが失敗した場合、キャッシュから取得
          return caches.match(event.request).then(response => {
            if (response) {
              return response;
            }
            // キャッシュにもない場合、オフラインページを返す
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
          });
        }),
    );
  } else {
    // 外部リクエストは通常のfetchのみ
    event.respondWith(fetch(event.request));
  }
});

// アップデート時の古いキャッシュ削除
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  // 新しいサービスワーカーがすべてのクライアントを制御
  self.clients.claim();
});

// プッシュ通知のサポート（将来の拡張用）
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/shiftme-icon.png',
      badge: '/shiftme-icon.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey,
      },
      actions: [
        {
          action: 'explore',
          title: '開く',
          icon: '/shiftme-icon.png',
        },
        {
          action: 'close',
          title: '閉じる',
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// 通知クリック時の処理
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/'));
  }
});
