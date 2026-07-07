// Ledger service worker — enables installability and background/periodic
// notification support. It has no access to the app's localStorage data
// (service workers can't read that), so notifications it fires directly
// (e.g. periodic sync) are kept generic. Specific alerts — overspending,
// "you haven't logged today" — are computed in index.html itself while the
// app is open, and shown via this service worker's registration.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// Clicking a notification focuses/opens the app.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientsArr) => {
      const existing = clientsArr.find((c) => c.url.includes('index.html') || c.url.endsWith('/'));
      if (existing) return existing.focus();
      return self.clients.openWindow('./index.html');
    })
  );
});

// Best-effort: on supported browsers (Chrome/Android, installed as PWA,
// with the periodic-background-sync permission granted), the OS wakes this
// worker on a schedule even if the app/tab is closed, and we can show a
// reminder. Not supported on iOS Safari or Firefox.
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'ledger-daily-reminder') {
    event.waitUntil(
      self.registration.showNotification('Ledger reminder', {
        body: "Take a moment to log today's income and expenses.",
        icon: './icon.svg',
        badge: './icon.svg',
        tag: 'ledger-daily-reminder'
      })
    );
  }
});

// Placeholder for real push notifications. Actually receiving a push here
// while the app is fully closed requires a server that holds the
// subscription and sends it via the Push API — this file alone can't do
// that without one.
self.addEventListener('push', (event) => {
  let data = { title: 'Ledger', body: 'You have a new update.' };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch (e) {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icon.svg',
      badge: './icon.svg'
    })
  );
});
