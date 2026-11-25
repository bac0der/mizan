import { precacheAndRoute } from 'workbox-precaching';

precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick', (event) => {
  const action = event.action || 'open';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        client.postMessage({
          type: 'MIZAN_NOTIFICATION_ACTION',
          action
        });
      }

      if (action === 'open' || clientList.length === 0) {
        if (clientList.length > 0 && 'focus' in clientList[0]) {
          return clientList[0].focus();
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      }
      return undefined;
    })
  );
});
