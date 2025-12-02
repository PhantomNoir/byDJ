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
    
}

async function searchSong(query) {
    const res = await spotifyApi.searchTracks(query);
    return res.body.tracks.items[0];
}

async function queueSong(uri) {
    try {
        await spotifyApi.addToQueue(uri);
    } catch (err) {
        if (err.statusCode === 404) {
            console.log('No active Spotify device! Open Spotify and try again.');
        } else {
            console.error('Queue error:', err);
        }
    }
}

module.exports = { spotifyApi, ensureAccessToken, searchSong, queueSong };