const { EventSubWSListener } = require('@twurple/eventsub-ws');
const { ApiClient } = require('@twurple/api');
const { RefreshingAuthProvider } = require('@twurple/auth');
const fs = require('fs');
const { handleSongRequest } = require('../handlers/songRequestHandler');

async function initEventSub() {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    const channelId = process.env.TWITCH_CHANNEL_ID;

    const tokenData = JSON.parse(fs.readFileSync('./tokens.json', 'utf-8'));

    const authProvider = new RefreshingAuthProvider(
        {
            clientId,
            clientSecret,
            onRefresh: newTokenData => fs.writeFileSync('./tokens.json', JSON.stringify(newTokenData, null, 4))
        },
        tokenData
    );

    const api = new ApiClient({ authProvider });
    const listener = new EventSubWSListener({ apiClient: api });

    listener.onChannelRedemptionAdd(channelId, async event => {
        if (event.rewardTitle.toLowercase().includes('song')) {
            await handleSongRequest(event.userName, event.input);
        }
    });

    listener.start();
    console.log('Event WebSocket listener started.');
}

module.exports = { initEventSub };