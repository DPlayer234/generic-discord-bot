const EventEmitter = require('events');
const Discord = require('discord.js');

const CHECK_FETCH_ARGS = { limit: 100 };

class SimpleHall extends EventEmitter {
	constructor({ client, mainChannel, hallChannel, copyEmoji, copyAmount, approvedEmoji }) {
		// Parameter checking
		if (!(client instanceof Discord.Client)) throw new TypeError('client invalid or not provided');
		if (!(mainChannel instanceof Discord.TextChannel)) throw new TypeError('mainChannel invalid or not provided');
		if (!(hallChannel instanceof Discord.TextChannel)) throw new TypeError('hallChannel invalid or not provided');

		super();

		// Init
		this.client = client;

		this.mainChannel = mainChannel;
		this.hallChannel = hallChannel;

		this.copyEmoji = copyEmoji;
		this.copyAmount = copyAmount;

		this.approvedEmoji = approvedEmoji;

		this._copying = new Set();

		this.client.on('message', this.onMessage.bind(this));
		this.client.on('messageReactionAdd', this.onMessageReactionAdd.bind(this));

		this.checkAll().catch(console.error);
	}

	isCopied(message) {
		if (this._copying.has(message.id)) return true;

		for (const reaction of message.reactions.values()) {
			const emoji = reaction.emoji;
			if ((emoji.id || emoji.name) === this.approvedEmoji) return reaction.me;
		}

		return false;
	}

	shouldBeCopied(message) {
		if (this.isCopied(message)) return false;

		for (const reaction of message.reactions.values()) {
			const emoji = reaction.emoji;
			if ((emoji.id || emoji.name) === this.copyEmoji) return reaction.count >= this.copyAmount;
		}

		return false;
	}

	async checkAll() {
		const messages = await this.mainChannel.fetchMessages(CHECK_FETCH_ARGS);
		for (const message of messages.values()) {
			await this.checkOne(message);
		}
	}

	async checkOne(message) {
		if (this.isCopied(message)) return false;
		if (!this.shouldBeCopied(message)) return false;

		await this.copyToHall(message);
		return true;
	}

	async checkOneByReaction(reaction) {
		const message = reaction.message;
		if (this.isCopied(message)) return false;

		const emoji = reaction.emoji;
		if ((emoji.id || emoji.name) === this.copyEmoji && reaction.count >= this.copyAmount) {
			await this.copyToHall(message);
			return true;
		}
		return false;
	}

	async copyToHall(message) {
		this._copying.add(message.id);

		const files = [];
		for (const attachment of message.attachments.values()) {
			files.push(attachment.url);
		}

		const content = `Posted by ${message.author}:\n${message.content}`;

		await message.react(this.approvedEmoji);
		const hallMessage = await this.hallChannel.send(content, { files });

		this._copying.delete(message.id);
		this.emit('copy', message, hallMessage);
	}

	onMessage(message) {
		const channel = message.channel;
		if (channel !== this.mainChannel) return;

		if (message.attachments.size > 0 || /\bhttps?:\/\//.test(message.content)) {
			message.react(this.copyEmoji).catch(console.error);
		}
	}

	onMessageReactionAdd(reaction, user) {
		const message = reaction.message;
		const channel = message.channel;
		if (channel !== this.mainChannel) return;

		this.checkOneByReaction(reaction).catch(console.error);
	}
}

module.exports = SimpleHall;
