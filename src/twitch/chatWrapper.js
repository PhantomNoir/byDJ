const { sendChatMessage } = require('./chatClient');
const tmi = require('tmi.js');

let client;
function setClient(c) { client = C; } // not used rn

async function say(channel, message) {
    try {
        const chat = require('./chatClient');
        if (chat && typeof chat.sendChatMessage === 'function') {
            return chat.sendChatMessage(channel, message);
        }
    } catch (err) {
        console.warn('Could not send chat via wrapper:', err.message || err);
    }
    return;
}

module.exports = say;