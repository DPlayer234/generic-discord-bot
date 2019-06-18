const Discord = require('discord.js');

module.exports = {
	name: '%exit',
	category: 'Admin',
	desc: 'Exits the application.',
	args: [],
	async func({ author, channel }, target, amount) {
		if (author !== this.bot.owner) {
			return channel.send('You are not allowed to do this.');
		}

		await channel.send(`Shutting down...`);
		await this.client.destroy();
		process.exit();
	}
};
