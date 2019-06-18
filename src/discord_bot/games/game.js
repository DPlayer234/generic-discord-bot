const Discord = require('discord.js');

class Game {
	constructor(channel, players, maxPlayerCount = this.constructor.maxPlayerCount) {
		this.channel = channel;
		this.players = players = [...players];

		if (players.length < 1) throw new Error('Need at least 1 player to play.');
		if (players.length > maxPlayerCount) throw new Error(`${this.constructor.name} may have at most ${maxPlayerCount} players.`);
		if (players.some(p => !(p instanceof Discord.User))) throw new Error('At least one player is not a Discord.User.');

		this.turn = 0;
	}

	get turnUserIndex() {
		return this.turn % this.players.length;
	}

	get turnUser() {
		return this.players[this.turnUserIndex];
	}

	async start() {
		throw new Error('No start for game defined.');
	}

	static get maxPlayerCount() {
		return 2;
	}
}

module.exports = Game;
