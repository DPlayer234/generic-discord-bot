const Discord = require('discord.js');

const EMBED_CACHE = Symbol('embedCache');

const filteredHelp = (cmdFilter) => {
	const getFields = (thisCmd, embed) => {
		if (thisCmd[EMBED_CACHE]) return embed.fields = thisCmd[EMBED_CACHE];

		const categories = new Map();

		for (const cmds of thisCmd.cmdManager.commands.values()) {
			for (const cmd of cmds) {
				if (!cmdFilter(cmd)) continue;

				const { name, category } = cmd;
				if (!categories.has(category)) categories.set(category, new Set());
				categories.get(category).add(name);
			}
		}

		const catArray = [...categories.entries()].sort((a, b) => a[0] === b[0] ? 0 : a[0] > b[0] ? 1 : -1);
		for (const [catName, names] of catArray) {
			embed.addField(catName, '`' + [...names].sort().join('` `') + '`', true);
		}

		return thisCmd[EMBED_CACHE] = embed.fields;
	};

	return async function func({ channel, guild }) {
		const embed = new Discord.RichEmbed();
		const prefix = await this.cmdManager.fetchPrefix(guild);

		embed.title = 'Commands';
		embed.color = this.bot.getColor(guild);
		embed.setFooter(`Use '${prefix}help <cmd>' for more info.`);
		getFields(this, embed);

		return channel.send(embed);
	};
};

module.exports = [
	{
		name: 'help',
		category: 'General',
		desc: 'Displays all known commands.',
		args: [],
		aliases: [ '?' ],
		func: filteredHelp((cmd) => cmd.category && !cmd.admin)
	},
	{
		name: '%help',
		category: 'Admin',
		admin: true,
		desc: 'Displays all known admin commands.',
		args: [],
		aliases: [ '%?' ],
		func: filteredHelp((cmd) => cmd.category && cmd.admin)
	},
	{
		name: 'nullhelp',
		category: 'Admin',
		admin: true,
		desc: 'Displays all known uncategorized commands.',
		args: [],
		funcX: filteredHelp((cmd) => !cmd.category),
		async func(message) {
			await this.assertAdmin(message.author);
			return this.funcX(message);
		}
	},
	{
		name: 'help',
		category: 'General',
		desc: 'Displays info for a command.',
		args: [ String ],
		argDesc: '`<command-name>`',
		aliases: [ '?' ],
		async func({ channel, guild }, name) {
			if (!this.cmdManager.commandsByName.has(name)) {
				return channel.send(`Unknown command \`${name}\`.`);
			}

			const embed = new Discord.RichEmbed();
			const prefix = await this.cmdManager.fetchPrefix(guild);

			embed.title = `Command: ${prefix}${name}`;
			embed.color = this.bot.getColor(guild);

			const commands = this.cmdManager.commandsByName.get(name);

			for (const cmd of commands) {
				let text = cmd.desc || 'No Description.';
				if (cmd.argDesc) {
					text += '\nArgs.: ' + cmd.argDesc;
				}
				else if (cmd.args.length > 0) {
					text += '\nArg. Types: `' + cmd.args.map(f => f.name).join(' ') + '`';
				}

				if (cmd.aliases.length > 0) {
					text += `\nAliases: \`${cmd.aliases.join('` `')}\``;
				}

				const add = cmd.name !== name ? `(${cmd.name})` : '';
				const argC = cmd.args === Array
					? cmd.argC || 'Variable'
					: cmd.args.length;

				embed.addField(
					argC === 0 ? `No Arguments ${add}` :
					argC === 1 ? `1 Argument ${add}` :
					`${argC} Arguments ${add}`,
					text);
			}

			return channel.send(embed);
		}
	},
	{
		name: '%help',
		category: 'Admin',
		admin: true,
		desc: 'Displays info for an admin command.',
		args: [ String ],
		aliases: [ '%?' ],
		superName: 'help',
		superArgs: [ String ],
		async func(message, name) {
			return this.super.func(message, `%${name}`);
		}
	}
];
