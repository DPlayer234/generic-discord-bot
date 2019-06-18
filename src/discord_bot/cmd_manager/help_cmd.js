const Discord = require('discord.js');

const filteredHelp = (cmdFilter) => {
	return async function func({ channel, guild }) {
		const embed = new Discord.RichEmbed();
		const prefix = await this.fetchPrefix(guild);

		embed.title = 'Commands';
		embed.color = this.bot.getColor(guild);
		embed.setFooter(`Use '${prefix}help <cmd>' for more info.`);

		const categories = new Map();

		for (const cmds of this.commands.values()) {
			for (const cmd of cmds) {
				if (!cmdFilter(cmd)) continue;

				const {name, category} = cmd;
				if (!categories.has(category)) {
					categories.set(category, {
						names: [],
						known: new Map()
					});
				}

				const {names, known} = categories.get(category);

				if (!known.has(name)) {
					names.push(name);
					known.set(name, true);
				}
			}
		}

		const catArray = [...categories.entries()].sort(([a], [b]) => a === b ? 0 : a > b ? 1 : -1);
		for (const [catName, {names}] of catArray) {
			let value = '';
			let length = 0;
			embed.addField(catName, '`' + names.join('` `') + '`', true);
		}

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
		func: filteredHelp((cmd) => cmd.category !== 'Admin' && cmd.category !== '-')
	},
	{
		name: '%help',
		category: 'Admin',
		desc: 'Displays all known admin commands.',
		args: [],
		aliases: [ '%?' ],
		func: filteredHelp((cmd) => cmd.category === 'Admin' && cmd.category !== '-')
	},
	{
		name: 'help',
		category: 'General',
		desc: 'Displays info for a command.',
		args: [ String ],
		argDesc: '`<command-name>`',
		aliases: [ '?' ],
		async func({ channel, guild }, name) {
			if (!this.commandsByName.has(name)) {
				return channel.send(`Unknown command \`${name}\`.`);
			}

			const embed = new Discord.RichEmbed();
			const prefix = await this.fetchPrefix(guild);

			embed.title = `Command: ${prefix}${name}`;
			embed.color = this.bot.getColor(guild);

			const commands = this.commandsByName.get(name);

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
	}
];
