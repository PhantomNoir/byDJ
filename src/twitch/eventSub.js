const { EventSubWsListener } = require('@twurple/eventsub-ws');
const { ApiClient } = require('@twurple/api');
const { ClientCredentialsAuthProvider } = require('@twurple/auth');
const path = require('path');
const { handleSongRequestFromRedemption } = require('../handlers/songRequestHandler');
const sendChat = require('./chatWrapper');

async function initEventSub() {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    const broadcasterId = process.env.TWITCH_BROADCASTER_ID; 
    const rewardId = process.env.SONG_REWARD_ID; 

    if (!clientId || !clientSecret || !broadcasterId) {
        console.warn('Skipping EventSub: missing TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET or TWITCH_BROADCASTER_ID.');
        return;
    }

    const authProvider = new ClientCredentialsAuthProvider(clientId, clientSecret);
    const apiClient = new ApiClient({ authProvider });

    const listener = new EventSubWsListener({ apiClient });

    // channel points redemption event subscription
    listener.onChannelPointsRewardRedeemed(async (event) => {
        try {
            if (rewardId && event.reward.id !== rewardId) { return; }

            const username = event.userDisplayName || event.userName;
            const input = event.userInput || '';
            console.log('Received redemption from', username, 'input:', input);

            // hand off to handler
            await handleSongRequestFromRedemption(username, input, event);

        } catch (err) {
            console.error('Error handling redemption:', err);
        }
    });

    await listener.listen();
    console.log('EventSub WebSocket listener started.');
}

module.exports = { initEventSub };