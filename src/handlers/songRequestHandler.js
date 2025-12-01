const { searchSong, queueSong } = require('../spotify/spotifyClient');

async function handleSongRequest(user, query) {
    try {
        const cleanedQuery = query.replace('!song', '').trim();
        if (!cleanedQuery) return;

        const track = await searchSong(cleanedQuery);
        if (!track) return console.log('No song found!');
        
        await queueSong(track.uri);
        console.log(`Queued: ${track.name} by ${track.artists[0].name}`);
    } catch (err) {
        console.log('Error handling song request:', err);
    }
}

module.exports = { handleSongRequest };