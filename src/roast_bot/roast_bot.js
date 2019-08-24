const Discord = require('discord.js');
const random = require('../libs/random');
const wait = require('../libs/wait');
const { IdSet } = require('../libs/id_based');

const roastData = require('./roast_data');

const TYPING_DELAY_BASE = 300;
const TYPING_DELAY_CHAR = 15;
const getTypingDelay = text => TYPING_DELAY_BASE + TYPING_DELAY_CHAR * text.length;

const TYPE_PERM = Discord.Permissions.FLAGS.SEND_MESSAGES;

class RoastBot {
	constructor(client) {
		this.client = client;
		this.activeChannels = new IdSet();

		this.client.on('message', this.onMessage.bind(this));
	}

	onMessage(message) {
		this.onMessageAsync(message).catch(console.error);
	}

	async onMessageAsync(message) {
		const ok = !this.activeChannels.has(message.channel)
			&& !message.author.bot
			&& message.member && message.mentions.members.has(this.client.user.id)
			&& message.channel.permissionsFor(this.client.user).has(TYPE_PERM);

		if (ok) {
			await this.sendRoast(message.channel, message.member);
		}
	}

	async sendRoast(channel, member) {
		try {
			this.activeChannels.add(channel);

			const roastSet = random.arrayItem(roastData);

			for (const roast of roastSet) {
				channel.startTyping();
				const text = roast(member);
				await wait.milliseconds(getTypingDelay(text));
				await channel.send(text);
				channel.stopTyping();
				await wait.milliseconds(200);
			}
		}
		finally {
			this.activeChannels.delete(channel);
		}
	}
}

const NameSupplier = RoastBot.NameSupplier = require('./name_supplier');

module.exports = RoastBot;
