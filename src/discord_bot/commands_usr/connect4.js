const Discord = require('discord.js');
const Connect4 = require('../games/connect_4');

module.exports = {
	name: 'connect4',
	category: 'Games',
	desc: `Start a game of Connect 4.`,
	args: Array,
	argDesc: '`<...with-users>`',
	async func({ author, channel, guild }, args) {
		const others = await Promise.all(args.map(a => this.cast(Discord.User, a)));
		if (others.some(o => o.bot)) return channel.send('Cannot play Connect 4 with a bot.');
		if (others.length + 1 > Connect4.maxPlayerCount) return channel.send(`Cannot play Connect 4 with ${others.length + 1} players.`);

		const ticTacToe = new Connect4(channel, [author, ...others]);
		await ticTacToe.start();
	}
};
