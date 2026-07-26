const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let scriptQueue = {};

// Принимает скрипт из твоей веб-панели
app.post('/set-script', (req, res) => {
    const { placeId, script } = req.body;
    if (placeId && script) {
        scriptQueue[placeId] = script;
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false });
    }
});

// Отдает скрипт игре в Roblox
app.get('/get-script', (req, res) => {
    const placeId = req.query.placeId;
    if (placeId && scriptQueue[placeId]) {
        const scriptToRun = scriptQueue[placeId];
        delete scriptQueue[placeId]; // Выдается один раз и удаляется
        res.send(scriptToRun);
    } else {
        res.send("");
    }
});

app.listen(PORT, () => {
    console.log(`Server is running`);
});
