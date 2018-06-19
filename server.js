require('dotenv').config()

const Express = require('express')
const BodyParser = require('body-parser')
const Morgan = require('morgan')
const WebPush = require('web-push')

if (!('VAPID_PRIVATE_KEY' in process.env || 'VAPID_PUBLIC_KEY' in process.env)) {
    console.log('VAPID keys pair not found. generating pair...')
    const keys = WebPush.generateVAPIDKeys()
    require('fs').appendFileSync(`${__dirname}/.env`, `\nVAPID_PRIVATE_KEY=${keys.privateKey}\nVAPID_PUBLIC_KEY=${keys.publicKey}`)
    process.env.VAPID_PRIVATE_KEY = keys.privateKey
    process.env.VAPID_PUBLIC_KEY = keys.publicKey
}

WebPush.setVapidDetails('mailto:localhost', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY)

const app = new Express()

const PORT = process.env.PORT || 3000

app.use([new BodyParser.json(), new BodyParser.urlencoded({extended: true})])
app.use(new Morgan('dev'))
app.use(Express.static(`${__dirname}/public`))

app.get('/vapidkey', (req, res) => {
    res.json({
        publicKey: process.env.VAPID_PUBLIC_KEY
    })
})

app.post('/notification', (req, res) => {
    console.log('Notification received:', req.body.payload);
    WebPush.sendNotification(req.body.subscription, JSON.stringify(req.body.payload)).then(() => {
        res.sendStatus(201)
    }).catch(err => {
        res.sendStatus(500)
    })
});

let subscriptions = [];
app.post('/register', (req, res) => {
    //console.log('Registration received:', req.body.subscription);
    subscriptions.push(req.body.subscription);
});

app.post('/notify-all', (req, res) => {
    subscriptions.forEach(subscription => {
        if (JSON.stringify(subscription) != JSON.stringify(req.body.subscription)) {
            console.log(req.body.payload);
            WebPush.sendNotification(subscription, JSON.stringify(req.body.payload)).then(() => {
                res.sendStatus(201)
            }).catch(err => {
                res.sendStatus(500)
            })
        }
    });
});


app.listen(PORT, () => {
    console.log(`server started at ${PORT}`)
});
