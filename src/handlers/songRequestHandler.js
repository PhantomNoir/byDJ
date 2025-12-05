const path = require("path");
const cache = require("../utils/cache");
const { searchSong, queueSong } = require("../spotify/spotifyClient");
const sendChatMessage = require("../twitch/chatClient");
const fs = require("fs");
const axios = require("axios");

const COOLDOWN_SECONDS = parseInt(process.env.COOLDOWN_SECONDS || "300", 10);
const MAX_QUEUE_LENGTH = parseInt(process.env.MAX_QUEUE_LENGTH || "25", 10);
const ALLOW_DUPLICATES = process.env.ALLOW_DUPLICATES === "true";

const RECENT_KEY_PREFIX = "queued:";

// handle redemption-based request
async function handleSongRequestFromRedemption(username, userInput, event) {
    const channelName = process.env.TWITCH_CHANNEL || username; // send chat confirmation to configured channel
    const userKey = `cooldown:${username.toLowerCase()}`;

    if (!userInput || !userInput.trim()) {
        await sendChatMessage(
            channelName,
            `@${username} please include a song name or Spotify link in your redemption.`
        );
        if (event && event.id)
            await fulfillRedemption(
                event.id,
                event.reward.id,
                event.broadcasterId,
                false
            );
        return;
    }

    if (cache.get(userKey)) {
        await sendChatMessage(
            channelName,
            `@${username} you are on cooldown. Try again later.`
        );
        if (event && event.id)
            await fulfillRedemption(
                event.id,
                event.reward.id,
                event.broadcasterId,
                false
            );
        return;
    }

    // parse spotify URL or search term
    let query = userInput.trim();
    const spotifyMatch =
        query.match(/open\.spotify\.com\/track\/([A-Za-z0-9_-]+)/) ||
        query.match(/spotify:track:([A-Za-z0-9_-]+)/);
    if (spotifyMatch) {
        // convert to spotify:track:id
        const id = spotifyMatch[1];
        query = `spotify:track:${id}`;
    }

    try {
        const track = await searchSong(query);
        if (!track) {
            await sendChatMessage(
                channelName,
                `@${username} I couldn't find that track on Spotify.`
            );
            if (event && event.id)
                await fulfillRedemption(
                    event.id,
                    event.reward.id,
                    event.broadcasterId,
                    false
                );
            return;
        }

        const { uri } = track.uri;
        if (!ALLOW_DUPLICATES && cache.get(RECENT_KEY_PREFIX + uri)) {
            await sendChatMessage(
                channelName,
                `@${username} that track was recently queued. Try another one.`
            );
            if (event && event.id)
                await fulfillRedemption(
                    event.id,
                    event.reward.id,
                    event.broadcasterId,
                    false
                );
            return;
        }

        // approximate queue length via cache keys
        const queuedCount = cache
            .keys()
            .filter((k) => k.startsWith(RECENT_KEY_PREFIX)).length;
        if (queuedCount >= MAX_QUEUE_LENGTH) {
            await sendChatMessage(
                channelName,
                `@${username} the song queue is full. Try again later.`
            );
            if (event && event.id)
                await fulfillRedemption(
                    event.id,
                    event.reward.id,
                    event.broadcasterId,
                    false
                );
            return;
        }

        await queueSong(uri);
        cache.set(RECENT_KEY_PREFIX + uri, true, 3600); // remember for 1 hour
        cache.set(userKey, true, COOLDOWN_SECONDS);

        const pretty = `${track.name} — ${track.artists
            .map((a) => a.name)
            .join(", ")}`;
        await sendChatMessage(
            channelName,
            `▶️ Added "${pretty}" to the Spotify queue for @${username}!`
        );
        if (event && event.id)
            await fulfillRedemption(
                event.id,
                event.reward.id,
                event.broadcasterId,
                true
            );
    } catch (err) {
        console.error("Error queuing track:", err);
        let msg = `@${username} failed to add track.`;
        if (err.code === "NO_DEVICE")
            msg = `@${username} no active Spotify device. Start Spotify and try again.`;
        await sendChatMessage(channelName, msg);
        if (event && event.id)
            await fulfillRedemption(
                event.id,
                event.reward.id,
                event.broadcasterId,
                false
            );
    }
}

// handler for chat-based !song fallback
async function handleSongRequestFromChat(username, query, channel) {
    // reuse redemption handler structure with no event
    await handleSongRequestFromRedemption(username, query, null);
}

module.exports = {
    handleSongRequestFromRedemption,
    handleSongRequestFromChat,
};
