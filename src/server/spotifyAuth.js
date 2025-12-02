const express = require('express');
const SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');
const path = require('path');

const router = express.Router();

const tokenPath = path.join(__dirname, '../../tokens.json');

const spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI
});

router.get('/auth/spotify/login', (req, res) => {
    const scopes = [
        'user-read-playback-state',
        'user-modify-playback-state',
        'user-read-currently-playing'
    ];
    const state = 'byDJ-' + Math.random().toString(36).substring(2, 15);
    const url = spotifyApi.createAuthorizeURL(scopes, state);
    res.redirect(url);
});

router.get('/auth/spotify/callback', async (req, res) => {
    const code = req.query.code;
    if (!code) return res.status(400).send('No code returned by Spotify.');

    try {
        const data = await spotifyApi.authorizationCodeGrant(code);
        const access_token = data.body['access_token'];
        const refresh_token = data.body['refresh_token'];
        const expires_in = data.body['expires_in'];

        const tokenObj = {
            provider: 'spotify',
            access_token,
            refresh_token,
            expires_at: Date.now() + (expires_in * 1000)
        };

        fs.writeFileSync(tokenPath, JSON.stringify(tokenObj, null, 2));
        console.log('Saved Spotify tokens to ', tokenPath);

        res.send(`Spotify authorization successful. You can close this window.\nSaved refresh token to tokens.json.`);
    } catch (err) {
        console.error('Spotify callback error', err);
        res.status(500).send('Spotify auth failed: ' + (err.message || JSON.stringify(err)));
    }
});

module.exports = router;