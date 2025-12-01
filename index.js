require('dotenv').config();
const express = require('express')
const path = require('path');

const { startChatClient } = require('./src/twitch/chatClient');
const { initEventSub } = require('./src/twitch/eventSub');
const spotifyAuth = require('./src/server/spotifyAuth');

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use('/', spotifyAuth);

app.get('/', (req, res) => res.send('byDJ server running'));

app.listen(PORT, async () => {
    console.log(`HTTP server listening on http://127.0.0.1:${PORT}`);

    try {
        await startChatClient();
        await initEventSub();
        console.log('Twitch clients started.')
    } catch (err) {
        console.error('Failed to start Twitch clients:', err);
    }
});