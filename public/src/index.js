let app = (function () {

    let appId = Math.random();
    let currentSubscription = null;

    function askForNotificationPermission() {
        Notification.requestPermission().then(perm => {
            if (perm !== 'granted') {
                console.log('Error:  notifications are not allowed');
            }
        });
    }

    function startWorker() {
        function urlBase64ToUint8Array(base64String) {
            const padding = '='.repeat((4 - base64String.length % 4) % 4)
            const base64 = (base64String + padding)
                .replace(/\-/g, '+')
                .replace(/_/g, '/')

            const rawData = window.atob(base64)
            const outputArray = new Uint8Array(rawData.length)

            for (let i = 0; i < rawData.length; ++i)
                outputArray[i] = rawData.charCodeAt(i)
            return outputArray
        }

        async function getVAPIDkey() {
            const request = await fetch('/vapidkey')
            return urlBase64ToUint8Array((await request.json()).publicKey)
        }

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js', {
                scope: '/'
            });

            navigator.serviceWorker.ready.then(registration => {
                getVAPIDkey().then(key => {
                    return registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: key
                    })
                }).then(subscription => {
                    currentSubscription = subscription;
                    fetch('/register', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            subscription: currentSubscription
                        })
                    });
                }).catch(err => console.error(err))
            });

            navigator.serviceWorker.addEventListener('message', event => { // when worker call postMessage on the client
               renderReceivedData(event.data);
            });
        }
    }

    function renderReceivedData(data){
        document.getElementById('received-data').innerHTML += JSON.stringify(data);
    }

    function init() {
        const sendLocal = document.querySelector('button#send-local'),
            sendServer = document.querySelector('button#send-server'),
            title = document.querySelector('input[name="title"]');

        sendLocal.addEventListener('click', () => {
            const message = {
                kind: 'notification',
                notification: {
                    title: title.value,
                    options: 'foo'
                }
            };
            navigator.serviceWorker.controller.postMessage(message)
        });
        sendServer.addEventListener('click', () => {
            fetch('/notify-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    subscription: currentSubscription,
                    payload: JSON.stringify({
                        appId: appId,
                        title: title.value
                    })
                })
            });
        });
    }

    return {
        start: () => {
            askForNotificationPermission();
            startWorker();
            init();
        }
    }

}());