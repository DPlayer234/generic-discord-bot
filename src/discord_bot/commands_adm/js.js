const Discord = require('discord.js');

const commandName = '%js';

module.exports = {
	name: commandName,
	category: '-',
	desc: 'Executes JavaScript code on the bot.\n' +
		'The code will have "bot", "client", "channel" and "user" as variables available.\n' +
		'THIS IS A DANGEROUS COMMAND AND AS SUCH CAN ONLY BE USED BY ADMINS!',
	args: Array,
	argDesc: commandName + ' ```js\n// code here```',
	async func(message, args) {
		const { channel, author, content } = message;

		if (author !== this.bot.owner) {
			return channel.send('You are not allowed to do this.');
		}

		const match = content.match(/```js([^\0]*)```/);

		if (!match) {
			return channel.send('Please supply the code in a js formatted code block:\n```js\n// code here\n```');
		}

		const code = match[1];

		try {
			let func = new Function(`return (async ({client, channel, author: user}, bot, require) => { ${code} });`)();
			let result = await func(message, this.bot, require.main.require);
			await channel.send(`Result: ${result}`);
		}
		catch (err) {
			await channel.send(`${err}`);
		}

		return channel.send('Execution finished.');
	}
};
