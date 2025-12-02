const SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');
const path = require('path');

const tokenPath = path.join(__dirname, '../../tokens.json');

const spotifyApi = new SpotifyWebApi({
    clientId:process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

function readTokensFile() {
    if (!fs.existsSync(tokenPath)) return null;

    try {
        return JSON.parse(fs.readFileSync(tokenPath, 'utf-8'));
    } catch {
        return null;
    }
}

async function ensureAccessToken() {
    const tokenData = readTokensFile();
    if (!tokenData || !tokenData.refresh_token) {
        throw new Error('No Spotify refresh token found. Visit /auth/spotify/login to authorize.');
    }

    spotifyApi.setRefreshToken(tokenData.refresh_token);
    // if token not expired, set access token
    if (tokenData.access_token && tokenData.expires_at && Date.now() < tokenData.expires_at - 10000) {
        spotifyApi.setAccessToken(tokenData.access_token);
        return spotifyApi.getAccessToken();
    }

    // refresh
    try {
        const data = await spotifyApi.refreshAccessToken();
        const access_token = data.body['access_token'];
        const expires_in = data.body['expires_in'];

        // update tokens file (keep refresh token if present)
        const newTokenObj = {
            ...tokenData,
            access_token,
            expires_at: Date.now() + (expires_in * 1000)
        };
        fs.writeFileSync(tokenPath, JSON.stringify(newTokenObj, null, 2));
        return access_token;
    } catch (err) {
        throw new Error('Failed to refresh Spotify access token: ' + (err.message || err));
    }
}

async function searchSong(query) {
    await ensureAccessToken();
    const res = await spotifyApi.searchTracks(query, { limit: 5 });
    const { items } = res.body.tracks.items;
    return items && items.length ? items[0] : null;
}

async function queueSong(uri) {
    await ensureAccessToken();
    try {
        await spotifyApi.addToQueue(uri);
        return true;
    } catch (err) {
        // handle no active device
        const status = err.statusCode || (err.status && err.status);
        if (status === 404) {
            const e = new Error('No active Spotify device found. Start Spotify on a device and try again.');
            e.code = 'NO_DEVICE';
            throw e;
        }
        throw err;
    }
}

module.exports = { spotifyApi, ensureAccessToken, searchSong, queueSong };