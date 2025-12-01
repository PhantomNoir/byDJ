const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
    clientId:process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

async function setAccessToken(tokenData) {
    spotifyApi.setAccessToken(tokenData.access_token);
    spotifyApi.setRefreshToken(tokenData.refresh_token);
}

async function searchSong(query) {
    const res = await spotifyApi.searchTracks(query);
    return res.body.tracks.items[0];
}

async function queueSong(uri) {
    await spotifyApi.addToQueue(uri);
}

module.exports = { spotifyApi, setAccessToken, searchSong, queueSong };