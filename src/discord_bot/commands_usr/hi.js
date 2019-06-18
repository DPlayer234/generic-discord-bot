const Discord = require('discord.js');

const formatNumber = require('../../libs/format_number').as2;
const formatMemory = (value) => (value / (1024 * 1024)).toFixed(3);

module.exports = {
	name: 'hi',
	category: 'General',
	desc: `Says hi and displays some general information.`,
	args: [],
	aliases: [ 'version', 'uptime' ],
	async func({ author, channel, guild }) {
		const embed = new Discord.RichEmbed();

		embed.title = `${this.client.user.username} - Info`;
		embed.color = this.bot.getColor(guild);

		const { rss } = process.memoryUsage();

		embed.description = `**Version:** ${this.bot.version}
**RSS:** ${formatMemory(rss)} MiB
**Time:** ${new Date().toUTCString()}`;

		embed.setFooter(`Test Bot`);

		return channel.send(`${this.bot.getMessage('hello')}`, embed);
	}
};
