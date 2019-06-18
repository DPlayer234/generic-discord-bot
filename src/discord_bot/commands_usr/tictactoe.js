const Discord = require('discord.js');
const TicTacToe = require('../games/tictactoe');

module.exports = {
	name: 'tictactoe',
	category: 'Games',
	desc: `Start a game of tic-tac-toe.`,
	args: [ Discord.User ],
	argDesc: '`<with-user>`',
	async func({ author, channel, guild }, other) {
		if (other.bot) return channel.send('Cannot play tic-tac-toe with a bot.');

		const ticTacToe = new TicTacToe(channel, [author, other]);
		await ticTacToe.start();
	}
};
