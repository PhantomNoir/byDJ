const { ChatClient } = require('@twurple/chat');
const { RefreshingAuthProvider } = require('@twurple/auth');
const fs = require('fs');
const { handleSongRequest } = require('../handlers/songRequestHandler');
const { channel } = require('diagnostics_channel');

const path = require('path');
const tokenPath = path.join(__dirname, '../../tokens.json');

let chatClient;

async function startChatClient() {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    const tokenData = JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));

    const authProvider = new RefreshingAuthProvider(
        {
            clientId,
            clientSecret,
            onRefresh: newTokenData => 
                fs.writeFileSync(tokenPath, JSON.stringify(newTokenData, null, 4))
        },
        tokenData
    );

    chatClient = new ChatClient({
        authProvider,
        channels: [process.env.TWITCH_CHANNEL]
    });

    chatClient.onMessage(async (channel, user, message) => {
        if (message.startsWith('!song')) {
            await handleSongRequest(user, message);
        }
    });

    await chatClient.connect();
    console.log('Chat client connected.');
}

module.exports = { startChatClient };