const tmi = require('tmi.js');

let chatClient;

async function startChatClient() {
    const botName = process.env.TWITCH_BOT_USERNAME;
    const botOauth = process.env.TWITCH_BOT_OATH;
    const channel = process.env.TWITCH_CHANNEL;

    if (!botName || !botOauth || !channel) {
        console.warn('Twitch chat not started: missing TWITCH_BOT_USERNAME, TWITCH_BOT_OATH or TWITCH_CHANNEL.');
        return;
    }

    chatClient = new tmi.Client({
        identity: {
            username: botName,
            password: botOauth
        },
        channels: [channel]
    });

    chatClient.on('message', async (channel, tags, message, self) => {
        if (self) return;
        // simple fallback: !song <name>
        if (message.toLocaleLowerCase().startsWith('!song ')) {
            const { handleSongRequestFromChat } = require('../handlers/songRequestHandler');
            const user = tags['display-name'] || tags.username;
            const query = message.substring(6).trim();
            await handleSongRequestFromChat(user, query, channel);
        }
    });

    await chatClient.connect();
    console.log('TMI chat connected.');
}

async function sendChatMessage(channel, message) {
    if (!chatClient) return;
    try {
        await chatClient.say(channel, message);
    } catch (err) {
        console.warn('Failed to send chat message: ', err.message || err);
    }
}

module.exports = { startChatClient, sendChatMessage };