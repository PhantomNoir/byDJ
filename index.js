require('dotenv').config();
const { startChatClient } = require('./src/twitch/chatClient');
const { initEventSub } = require('./src/twitch/eventSub');

(async () => {
    console.log('Starting byDJ, let\'s get funky!');

    await startChatClient();
    await initEventSub();
})();