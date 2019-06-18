const Discord = require('discord.js');
const path = require('path');

const ManualPromise = require('../libs/manual_promise');
const getAllFiles = require('../libs/get_all_files');
const random = require('../libs/random');
const wait = require('../libs/wait');
const emojiDefs = require('./misc/emoji_defs');

const VERSION = '0.1.0';

if (process.argv.includes('botdebug')) require('./misc/debug_help');

const MenuHelper = require('./menu_helper');
const CmdManager = require('./cmd_manager');

const CONFIRM_EMOJI = emojiDefs.accept;
const DENY_EMOJI = emojiDefs.deny;
const DM_EMOJI = emojiDefs.dm;

const commandFiles = [
	...getAllFiles(path.join(__dirname, 'commands_adm')),
	...getAllFiles(path.join(__dirname, 'commands_usr'))
].filter(f => f.endsWith('.js') && !f.endsWith('#.js')).map(require);

const genericMessage = require('./misc/generic_messages');

const toLockKey = (obj) => obj && obj.id ? obj.id : obj;
const NO_OP = () => {};
const bind = (obj, func, ...args) => obj[func].bind(obj, ...args);

const TICK_INTERVAL = 2000;
const PRESENCE_INTERVAL = 20 * 60 * 1000;

const { FLAGS } = Discord.Permissions;
const ACT_PERMISSIONS = FLAGS.VIEW_CHANNEL | FLAGS.SEND_MESSAGES;
const MANAGE_PERMISSION = FLAGS.MANAGE_MESSAGES;

const CREATOR_ID = '124561134278672387';
const ERROR_CHANNEL_ID = process.env.ERROR_CHANNEL_ID;

class DiscordBot {
	constructor(client, { prefix = '%', color = null, ownerId } = {}) {
		this.client = client;
		this.bot = this;

		this.cmdManager = new CmdManager(this, prefix);

		this.color = color;
		this.version = VERSION;

		this._ownerId = ownerId || null;
		this.owner = null;
		this.creator = null;
		this.errorChannel = null;

		this.cmdManager.registerCommands(commandFiles);
		console.log(`Loaded ${this.cmdManager.commands.size} Commands...`);

		this.client.once('ready', this.onReady.bind(this));
		this.client.on('warn', this.onWarn.bind(this));
		this.client.on('error', this.onError.bind(this));
		this.client.setInterval(this._tick.bind(this), TICK_INTERVAL);

		this.errorHandler = this.errorHandler.bind(this);
	}

	onReady() {
		this.client.user.setPresence({
			game: {
				name: `tests! %help`,
				type: 'PLAYING'
			}
		});

		if (this._ownerId) {
			this._assignUser('owner', this._ownerId);
		}

		this._assignUser('creator', CREATOR_ID);
		this.errorChannel = this.client.channels.get(ERROR_CHANNEL_ID) || null;
	}

	onWarn(info) {
		console.warn(info);
	}

	onError(err) {
		console.error(err.message);
	}

	getMessage(reason) {
		return genericMessage[reason] ? random.arrayItem(genericMessage[reason]) : reason;
	}

	getColor(guild) {
		return guild && guild.me && guild.me.displayColor || this.color;
	}

	mayActInChannel(channel) {
		return channel.type === 'text' && channel.permissionsFor(this.client.user).has(ACT_PERMISSIONS)
			|| channel.type === 'dm';
	}

	mayManageInChannel(channel) {
		return channel.type !== 'dm' && channel.permissionsFor(this.client.user).has(MANAGE_PERMISSION);
	}

	async editOrResendMessage(channel, message, arg0, arg1) {
		const mayNotManage = !this.mayManageInChannel(channel);
		if (message && mayNotManage) {
			message.delete().catch(NO_OP); // No need to await
		}

		return !message || mayNotManage
			? channel.send(arg0, arg1)
			: message.edit(arg0, arg1).then(m => m || message);
	}

	async sendLarge(channel, content) {
		if (content.length < 2000) return [channel.send(content)];

		const lines = content.split('\n');
		const messages = [];

		let buffer = [];
		let bufferLength = 0;

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const length = line.length;
			if (length > 2000) continue;

			bufferLength += length;

			if (bufferLength > 2000) {
				const message = await channel.send(buffer.join('\n'));
				messages.push(message);

				buffer = [];
				bufferLength = length;
			}

			buffer.push(line);
		}

		if (buffer.length > 0) {
			const message = await channel.send(buffer.join('\n'));
			messages.push(message);
		}

		return messages;
	}

	async confirm(message) {
		return message.react(CONFIRM_EMOJI);
	}

	async deny(message) {
		return message.react(DENY_EMOJI);
	}

	async sentDM(message) {
		return message.react(DM_EMOJI);
	}

	errorHandler(err) {
		try { this.errorChannel.send(`\`\`\`${err.stack.slice(0, 1500)}\`\`\``).catch(NO_OP); } catch (e) { }

		if (err instanceof Discord.DiscordAPIError) {
			return console.warn(err);
		}

		return console.error(err);
	}

	_tick() { }

	_assignUser(field, id) {
		this.client.fetchUser(id)
		.then(user => this[field] = user)
		.catch(() => {
			console.log('The user ID is invalid.');
			this[field] = this.client.user;
		});
	}
}

DiscordBot.MenuHelper = MenuHelper;
DiscordBot.CmdManager = CmdManager;

module.exports = DiscordBot;
