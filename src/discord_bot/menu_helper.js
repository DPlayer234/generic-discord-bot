const Discord = require('discord.js');

const emojiDefs = require('./misc/emoji_defs');
const toStringEmoji = require('./misc/to_string_emoji');

const DISABLE_TIMEOUT = 30 * 1000;

const LEFT_EMOJI = encodeURI(emojiDefs.left_unicode);
const RIGHT_EMOJI = encodeURI(emojiDefs.right_unicode);
const FAST_LEFT_EMOJI = encodeURI(emojiDefs.fast_left_unicode);
const FAST_RIGHT_EMOJI = encodeURI(emojiDefs.fast_right_unicode);

const SMALL_MENU_SET = new Set([LEFT_EMOJI, RIGHT_EMOJI]);
const LARGE_MENU_SET = new Set([LEFT_EMOJI, RIGHT_EMOJI, FAST_LEFT_EMOJI, FAST_RIGHT_EMOJI]);

const NO_OP = () => {};

const changePage = (emoji, curPage, maxPages) => {
	switch (emoji) {
		case LEFT_EMOJI: return maxPages - ((maxPages - curPage + 1) % maxPages);
		case RIGHT_EMOJI: return curPage % maxPages + 1;
		case FAST_LEFT_EMOJI: return maxPages - ((maxPages - curPage + 10) % maxPages);
		case FAST_RIGHT_EMOJI: return (curPage + 9) % maxPages + 1;
		default: return curPage;
	}
};

class MenuHelper extends null {
	static async openMenu(bot, channel, nav, maxPages, makeEmbed, disableTimeout = DISABLE_TIMEOUT) {
		const message = await channel.send(await makeEmbed(bot, 1));
		if (maxPages < 2) return;

		let curPage = 1;

		this.openCustom(bot, message, nav, maxPages > 10 ? LARGE_MENU_SET : SMALL_MENU_SET, async (reaction) => {
			curPage = changePage(reaction.emoji.identifier, curPage, maxPages);

			const embed = await makeEmbed(bot, curPage);
			await message.edit(embed);
			return false;
		}, disableTimeout).catch(NO_OP);

		return message;
	}

	static async openSelection(message, user, emojis, disableTimeout = DISABLE_TIMEOUT) {
		const client = message.client;
		const emojiColl = message.createReactionCollector(({emoji: {id, identifier}}, ruser) => ruser === user && emojis.includes(id || identifier));
		const msgColl = message.channel.createMessageCollector(({author, content}) => author === user && emojis[Number(content) - 1]);

		let timeout;
		let emojiResult = null;

		const stop = () => {
			emojiColl.stop();
			msgColl.stop();
		};

		msgColl.on('collect', (message) => {
			if (message.deletable) {
				message.delete().catch(NO_OP);
			}
			emojiResult = emojis[Number(message.content) - 1];
			stop();
		});

		emojiColl.on('collect', ({emoji: {id, identifier}}) => {
			client.clearTimeout(timeout);
			emojiResult = id || identifier;
			stop();
		});

		try {
			for (const emoji of emojis) {
				await message.react(emoji);

				if (emojiResult) {
					stop();

					await message.clearReactions().catch(() => null);
					return emojiResult;
				}
			}
		}
		catch (e) {
			if (e instanceof Discord.DiscordAPIError) {
				await message.channel.send(
					'Cannot add remaining reactions:\n' +
					emojis.map(toStringEmoji).join(' '));
			}
			// ignore and continue
		}

		timeout = client.setTimeout(() => stop(), disableTimeout);
		return new Promise((resolve, reject) => {
			emojiColl.on('end', async () => {
				await message.clearReactions().catch(() => null);
				resolve(emojiResult);
			});
		});
	}

	static async openCustom(bot, message, user, emojiSet, reactionCollect, disableTimeout = DISABLE_TIMEOUT) {
		const coll = message.createReactionCollector(({emoji: {id, identifier}}, ruser) => ruser === user && emojiSet.has(id || identifier));

		let timeout;

		const resetTimeout = () => {
			bot.client.clearTimeout(timeout);
			timeout = bot.client.setTimeout(() => coll.stop(), disableTimeout);
		};

		const endTimeout = () => {
			bot.client.clearTimeout(timeout);
			coll.stop();
		};

		coll.on('collect', async (reaction) => {
			try {
				resetTimeout();

				const close = await reactionCollect(reaction);
				if (close) endTimeout();
			}
			catch (e) {
				bot.errorHandler(e);
				endTimeout();
			}
			finally {
				reaction.remove(user).catch(NO_OP);
			}
		});

		coll.on('end', () => message.clearReactions().catch(NO_OP));

		for (const emoji of emojiSet) {
			await message.react(emoji);
		}

		resetTimeout();
	}
}

module.exports = MenuHelper;
