const discordEmojiNames = require('./discord_emoji_names');

const nameCache = new Map(Object.keys(discordEmojiNames).map(id => [id, `<:${discordEmojiNames[id]}:${id}>`]));

module.exports = function toStringEmoji(id) {
	if (nameCache.has(id)) return nameCache.get(id);

	if (/^[0-9]+$/.test(id)) {
		return `<:_:${id}>`;
	}

	return decodeURI(id);
};
