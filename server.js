const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

let whitelist = ["sewarg47"];
let activePlaces = {};
let pendingScripts = {};

app.post('/add-whitelist', (req, res) => {
    const nick = req.body.nick;
    if (nick) {
        if (!whitelist.includes(nick)) {
            whitelist.push(nick);
        }
        res.json({ success: true, whitelist: whitelist });
    } else {
        res.status(400).json({ success: false, error: 'Nick is required' });
    }
});

app.get('/check-whitelist', (req, res) => {
    const nick = req.query.nick;
    if (whitelist.includes(nick)) {
        res.json({ allowed: true });
    } else {
        res.json({ allowed: false });
    }
});

app.post('/ping-place', (req, res) => {
    const { placeId } = req.body;
    if (placeId) {
        activePlaces[placeId] = Date.now();
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, error: 'PlaceID required' });
    }
});

app.get('/active-places', (req, res) => {
    const now = Date.now();
    let currentActive = [];
    for (let placeId in activePlaces) {
        if (now - activePlaces[placeId] < 30000) {
            currentActive.push(placeId);
        } else {
            delete activePlaces[placeId];
        }
    }
    res.json(currentActive);
});

app.post('/set-script', (req, res) => {
    const { placeId, command, nick } = req.body;
    if (!whitelist.includes(nick)) {
        return res.json({ success: false, status: 'not_in_whitelist' });
    }
    pendingScripts[placeId] = command;
    res.json({ success: true });
});

app.get('/get-script', (req, res) => {
    const placeId = req.query.placeId;
    if (pendingScripts[placeId]) {
        const code = pendingScripts[placeId];
        delete pendingScripts[placeId];
        res.json({ success: true, code: code });
    } else {
        res.json({ success: false });
    }
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
