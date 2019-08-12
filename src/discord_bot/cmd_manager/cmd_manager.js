const Discord = require('discord.js');
const wait = require('../../libs/wait');

const Command = require('./command');
const CmdError = require('./cmd_error');

const helpCmds = require('./help_cmd');

const trueSet = new Set(['true', 't', 'yes', 'y', 'on']);
const falseSet = new Set(['false', 'f', 'no', 'n', 'off']);

const toBool = (str) => {
	str = str.toLowerCase();
	return trueSet.has(str) ? true
		: falseSet.has(str) ? false
		: null;
};

const arrayEq = (types1, types2) => {
	if (types1 === types2) return true;
	if (types1.length !== types2.length) return false;

	for (let i = 0; i < types1.length; i++) {
		if (types1[i] !== types2[i]) return false;
	}

	return true;
};

const MAX_ARGS = 4;

const ARG_TYPES = [Discord.User, Discord.Channel, Number, Boolean, String];
const ARG_PRIO = new Map(ARG_TYPES.map((t, i) => [t, i]));

const ARG_PRIO_SORT = (a, b) => {
	if (a.args === Array) return 1;
	if (b.args === Array) return -1;
	if (a.args.length !== b.args.length) return a.args.length - b.args.length;

	for (let i = 0; i < a.args.length; i++) {
		const aT = a.args[i];
		const bT = b.args[i];
		const dif = ARG_PRIO.get(aT) - ARG_PRIO.get(bT);
		if (dif !== 0) return dif;
	}

	throw new Error(`Same name and same arguments: ${a.name}-${a.args.length}`);
};

const CAST_NAMES = [
	[String, '$cast_String'],
	[Boolean, '$cast_Boolean'],
	[Number, '$cast_Number'],
	[Discord.User, '$cast_DiscordUser'],
	[Discord.Channel, '$cast_DiscordChannel']
];

const ADMINS = new Set(['124561134278672387']);

class CmdManager {
	constructor(bot, prefix) {
		this.client = bot.client;
		this.bot = bot;

		this.prefix = prefix;

		this.commands = new Map();
		this.aliases = new Map();
		this.commandsByName = new Map();

		this.uniqueCommands = [];

		this.casts = new Map(CAST_NAMES.map(e => [e[0], this[e[1]].bind(this)]));

		this.registerCommands(helpCmds);

		this.client.on('message', this.onMessage.bind(this));
	}

	isIgnored(message, prefix) {
		return message.author.bot || !message.content.startsWith(prefix);
	}

	onMessage(message) {
		this.aOnMessage(message)
		.catch(this.bot.errorHandler);
	}

	async aOnMessage(message) {
		const prefix = await this.fetchPrefix(message.guild);
		if (this.isIgnored(message, prefix)) return;
		return this.runCommand(message, prefix);
	}

	async fetchPrefix(guild) {
		return this.prefix;
	}

	async runCommand(message, prefix) {
		try {
			const parsed = await this.parseCommand(message.content, prefix);
			if (!parsed) return;

			const { command, args } = parsed;
			console.log(`[${new Date().toLocaleTimeString()}][${message.channel.name || 'DM'}] ${message.author.username}: ${message.content}`);
			await command.func(message, ...args);
		}
		catch (err) {
			return this.handleCmdError(message, err);
		}
	}

	async parseCommand(str, prefix) {
		if (!str.startsWith(prefix)) return null;

		const args = str.slice(prefix.length).split(/\s+/);
		const name = args.shift().toLowerCase();

		const cmdKey = this._getCmdKey(name, args);
		const commands = this.commands.get(cmdKey) || this.aliases.get(cmdKey)
			|| this.commands.get(name) || this.aliases.get(name);

		if (!commands) {
			throw this.commandsByName.has(name)
				? new CmdError('INVALID_ARGS', `This command does not take ${args.length} argument(s). Type \`${prefix}help ${name}\` for help.`)
				: new CmdError('INVALID_COMMAND', `Use \`${prefix}help\` to get a list of all commands.`);
		}

		let lastError, lastIndex = -1;

		for (const command of commands) {
			const result = await this._parseCommand(command, args);

			if (!result.error) {
				return result;
			}
			else if (result.index > lastIndex) {
				lastError = result.error;
				lastIndex = result.index;
			}
		}

		throw lastError || new Error('No command...?');
	}

	findCommand(name, args) {
		const cmdKey = this._getCmdKey(name, args);
		const commands = this.commands.get(cmdKey) || this.commands.get(name);

		if (!commands) throw new TypeError(`There is no command by the name '${name}'.`);

		for (const command of commands) {
			if (arrayEq(command.args, args)) {
				return command;
			}
		}

		throw new TypeError(`There is no variant of '${name}' matching the suplied argument types.`);
	}

	async cast(type, str, i) {
		return this.casts.get(type)(str, i);
	}

	canCast(type) {
		return this.casts.has(type);
	}

	eqArgTransform(args) {
		const map = new Map();
		if (args.length === 0) return map;

		let key, value;
		for (let i = 0; i < args.length; i++) {
			const arg = args[i];
			const eqI = arg.indexOf('=');
			if (eqI === -1) {
				if (value === undefined) throw new CmdError('INVALID_ARGS', `I don't understand that. Give me *key=value* pairs.`);
				value = `${value} ${arg}`;
			}
			else {
				if (key) {
					if (map.has(key)) throw new CmdError('INVALID_ARGS', 'A key was given multiple times.');
					map.set(key, value);
				}

				key = arg.slice(0, eqI);
				value = arg.slice(eqI + 1);
			}
		}

		if (!key) throw new CmdError('INVALID_ARGS', `I don't understand that. Give me *key=value* pairs.`);
		if (map.has(key)) throw new CmdError('INVALID_ARGS', 'A key was given multiple times.');
		map.set(key, value);

		return map;
	}

	async castRange(str, i) {
		const result = [undefined, undefined];
		const rMatch = str.match(/^([0-9]+)?\.\.([0-9]+)?$/);

		if (rMatch) {
			let [_, minValue, maxValue] = rMatch;
			if (minValue === undefined && maxValue === undefined) throw new CmdError('INVALID_ARGS', `Invalid option ${i}. Needs to be a number or range.`);
			if (minValue !== undefined) result[0] = await this.cast(Number, minValue, i);
			if (maxValue !== undefined) result[1] = await this.cast(Number, maxValue, i);
		}
		else {
			const value = await this.cast(Number, str, i);
			result[0] = value;
			result[1] = value;
		}

		return result;
	}

	async requestConfirmation(channel, author) {
		while (true) {
			const response = await wait.forMessage(channel, author);
			if (!response) return null;

			const result = toBool(response.content);
			if (result !== null) return result;
		}
	}

	async requestCancelableConfirmation(channel, author, cObj) {
		const rProm = Promise.race([
			this.requestConfirmation(channel, author),
			new Promise((resolve) => {
				const int = setInterval(() => {
					if (cObj.canceled) resolve(null);
				}, 500);

				setTimeout(() => rProm.then(v => {
					clearInterval(int);
					resolve(v);
				}), 0);
			})
		]);

		const result = await rProm;

		if (!result) {
			cObj.canceled = true;
		}

		return result;
	}

	async assertAdmin(user) {
		if (!ADMINS.has(user.id)) throw new CmdError('CUSTOM', 'You are not allowed to do this.');
	}

	async handleCmdError(message, err) {
		if (err instanceof CmdError) {
			return message.channel.send(`${err.message}`);
		}

		if (err instanceof Discord.DiscordAPIError && err.message === 'Cannot send messages to this user') {
			const match = err.path.match(/^\/api\/v\d+\/channels\/(\d+)\/messages$/);
			const dmChannel = match && this.client.channels.get(match[1]);
			if (dmChannel && dmChannel.type === 'dm') {
				return message.channel.send(`📪 Cannot send direct messages to ${dmChannel.recipient}. Please allow direct messages from server members.`);
			}
		}

		this.bot.errorHandler(err);
		return message.channel.send(`An internal error has occured: \`\`\`${err.stack.slice(0, 1500)}\`\`\``);
	}

	registerCommand(options, check = true) {
		const cmd = new Command(options, this);
		const { name, args, aliases } = cmd;

		this._validateCmd(cmd);

		this._insertCmd(this.commands, this._getCmdKey(name, args), cmd);
		this._insertCmdByName(cmd, name);

		for (const alias of aliases) {
			this._insertCmd(this.aliases, this._getCmdKey(alias, args), cmd);
			this._insertCmdByName(cmd, alias);
		}

		if (check) this._checkArrayCmds();

		this.uniqueCommands.push(cmd);
	}

	registerCommands(cmds) {
		for (const cmd of cmds) {
			this.registerCommand(cmd, false);
		}

		this._checkArrayCmds();
	}

	_getCmdKey(name, args) {
		return args !== Array ? `${name}-${args.length}` : name;
	}

	_validateCmd({ args, name }) {
		if (name.includes(' ') || name !== name.toLowerCase()) throw new Error(`The command name ${name} isn't valid.`);

		if (args === Array) return;
		if (args.length > MAX_ARGS) throw new Error(`The command has too many arguments: ${name}-${args.length}`);

		for (let i = 0; i < args.length; i++) {
			if (!this.canCast(args[i])) throw new Error(`The command argument definition is invalid: ${name}-${args.length}[${i}]`);
		}
	}

	_insertCmd(map, key, cmd) {
		if (!map.has(key)) map.set(key, []);

		const arr = map.get(key);
		if (arr.length > 0 && cmd.args === Array) throw new Error(`Cannot have multiple 'Array' arg-type commands for ${key}`);

		arr.push(cmd);
		arr.sort(ARG_PRIO_SORT);
	}

	_insertCmdByName(cmd, name) {
		if (!this.commandsByName.has(name)) this.commandsByName.set(name, []);

		const arr = this.commandsByName.get(name);

		arr.push(cmd);
		arr.sort(ARG_PRIO_SORT);
	}

	_checkArrayCmds() {
		for (const [cmd] of this.commands.values()) {
			if (cmd && cmd.args === Array) {
				this._checkArrayCmd(this.commands, cmd.name, cmd);

				for (const alias of cmd.aliases) {
					this._checkArrayCmd(this.aliases, alias, cmd);
				}
			}
		}
	}

	_checkArrayCmd(map, name, cmd) {
		for (let i = 0; i < MAX_ARGS; i++) {
			const key = this._getCmdKey(name, { length: i });
			if (!map.has(key)) continue;

			const cmds = map.get(key);
			if (cmds.includes(cmd)) continue;

			cmds.push(cmd);
		}
	}

	async _parseCommand(command, args) {
		if (command.args === Array) {
			return { command, args: [args] };
		}

		for (let i = 0; i < args.length; i++) {
			try {
				args[i] = await this.cast(command.args[i], args[i], i + 1);
			}
			catch (e) {
				return { error: e, index: i };
			}
		}

		return { command, args };
	}

	async $cast_String(str, i) {
		return str;
	}

	async $cast_Boolean(str, i) {
		let bool = toBool(str);
		if (bool === null) throw new CmdError('INVALID_ARGS', `I need true/false/yes/no/on/off as argument ${i}.`);
		return bool;
	}

	async $cast_Number(str, i) {
		let num = Number(str);
		if (Number.isNaN(num)) throw new CmdError('INVALID_ARGS', `I need a number as argument ${i}.`);
		return num;
	}

	async $cast_DiscordUser(str, i) {
		try {
			// str = this._fetchIdByTag(str) || str;
			const uMatch = str.match(/^<@!?([0-9]+)>$/);
			if (!uMatch && str.length < 9) throw null;
			return await this.client.fetchUser(uMatch ? uMatch[1] : str);
		}
		catch (e) {
			throw new CmdError('INVALID_ARGS', `I need a user as argument ${i}.`);
		}
	}

	async $cast_DiscordChannel(str, i) {
		try {
			const uMatch = str.match(/^<#([0-9]+)>$/);
			if (!uMatch && str.length < 9) throw null;
			const id = uMatch ? uMatch[1] : str;
			if (!this.client.channels.has(id)) throw null;
			const channel = this.client.channels.get(id);
			if (channel.type !== 'text') throw null;
			return channel;
		}
		catch (e) {
			throw new CmdError('INVALID_ARGS', `I need a channel as argument ${i}.`);
		}
	}

	/*
	_fetchIdByTag(sTag) {
		if (!/.#\d{4}$/.test(sTag)) return null;

		for (const {id, tag} of this.client.users.values()) {
			if (tag === sTag) return id;
		}

		return null;
	}
	*/
}

CmdManager.Command = Command;
CmdManager.CmdError = CmdError;

module.exports = CmdManager;
