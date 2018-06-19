
self.addEventListener('install', event => {
    event.waitUntil(self.skipWaiting()); // speep up installation
})

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim()); // avoids the need for app reload
});

self.addEventListener('message', event => { // When the client calls postMessage function
    console.log('message:', event.data);
    self.registration.showNotification(event.data.notification.title);
});

self.addEventListener('push', event => { // When push message is received from the server
    let data = JSON.parse(event.data.json());
    console.log('push:', data);
    self.registration.showNotification(data.title);
    clients.matchAll().then(clients => { // Send the message to the client
        clients.forEach(client => {
            client.postMessage(data.title);
        });
    });
});