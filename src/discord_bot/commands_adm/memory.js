const Discord = require('discord.js');

const formatMemory = (value) => (value / (1024 * 1024)).toFixed(3);

module.exports = {
	name: '%memory',
	category: 'Admin',
	desc: 'Displays memory usage.',
	async func({ author, channel, guild }) {
		const { rss, heapTotal, heapUsed, external } = process.memoryUsage();

		const embed = new Discord.RichEmbed();

		embed.title = 'process.memoryUsage() output';
		embed.color = this.bot.getColor(guild);

		embed.description = `**rss**: ${formatMemory(rss)} MiB
**heapTotal**: ${formatMemory(heapTotal)} MiB
**heapUsed**: ${formatMemory(heapUsed)} MiB
**external**: ${formatMemory(external)} MiB`;

		return channel.send(embed);
	}
};
