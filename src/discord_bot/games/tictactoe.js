const Game = require('./game');
const numerics = require('../misc/numerics');

const BACKGROUND = '⬛';
const PLAYER_PIECES = ['⭕', '❌'];

const WIDTH = 3, HEIGHT = 3;
const TOTAL = WIDTH * HEIGHT;

const SUB_NUM = numerics.uri.slice(0, TOTAL);
const REVERSE_MAP = new Map(SUB_NUM.map((n, i) => [n, i]));

class TicTacToe extends Game {
	constructor(channel, players) {
		super(channel, players);

		this.gridArray = new Array(TOTAL).fill(-1);
		this.message = null;

		this.reactions = new Set(SUB_NUM);
	}

	async start() {
		this.message = await this.channel.send('Please wait...');
		for (const emoji of this.reactions) await this.message.react(emoji);

		let winner;
		while ((winner = this.getWinnerIndex()) === null && this.turn < TOTAL) {
			await this.doTurn();
			this.turn += 1;
		}

		await this.message.edit(`${this.getWinMessage(this.players[winner])}\n${this.getGridMessageContent()}`);

		return winner;
	}

	async doTurn() {
		const turnUser = this.turnUser;
		await this.message.edit(`${turnUser}:\n${this.getGridMessageContent()}`);

		const reactionFilter = (reaction, user) => this.reactions.has(reaction.emoji.identifier) && user === turnUser;
		const reactionColl = await this.message.awaitReactions(reactionFilter, { max: 1 });

		const reaction = reactionColl.first();
		const index = REVERSE_MAP.get(reaction.emoji.identifier);

		this.reactions.delete(reaction.emoji.identifier);
		this.gridArray[index] = this.turnUserIndex;
	}

	getWinnerIndex() {
		// winner is any of these: diagonal, full row, full line
		for (let x = 0; x < WIDTH; x++) {
			const value = this.getRowValue(x);
			if (this.canBeWinner(value)) return value;
		}

		for (let y = 0; y < HEIGHT; y++) {
			const value = this.getLineValue(y);
			if (this.canBeWinner(value)) return value;
		}

		if (WIDTH !== HEIGHT) return null; // No diagonals

		const d1Value = this.getDiagonal1Value();
		if (this.canBeWinner(d1Value)) return d1Value;

		const d2Value = this.getDiagonal2Value();
		if (this.canBeWinner(d2Value)) return d2Value;

		return null;
	}

	canBeWinner(value) {
		return value !== null && value >= 0;
	}

	getWinMessage(winner) {
		return winner
			? `${winner} won!`
			: 'It\'s a draw!';
	}

	getRowValue(x) {
		const value = this.getField(x, 0);
		for (let y = 1; y < HEIGHT; y++) if (this.getField(x, y) !== value) return null;
		return value;
	}

	getLineValue(y) {
		const value = this.getField(0, y);
		for (let x = 0; x < WIDTH; x++) if (this.getField(x, y) !== value) return null;
		return value;
	}

	getDiagonal1Value() {
		const value = this.getField(0, 0);
		for (let i = 1; i < WIDTH; i++) if (this.getField(i, i) !== value) return null;
		return value;
	}

	getDiagonal2Value() {
		const value = this.getField(WIDTH - 1, 0);
		for (let i = 1; i < WIDTH; i++) if (this.getField(WIDTH - 1 - i, i) !== value) return null;
		return value;
	}

	getField(x, y) {
		return this.gridArray[this.getGridIndex(x, y)];
	}

	setField(x, y, value) {
		this.gridArray[this.getGridIndex(x, y)] = value;
	}

	getGridIndex(x, y) {
		if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) throw new RangeError('Out of grid range.');
		return x + y * WIDTH;
	}

	getGridMessageContent() {
		const content = [];

		for (let y = 0; y < HEIGHT; y++) {
			for (let x = 0; x < WIDTH; x++) {
				content.push(this.getGridCharacter(x, y));
			}

			content.push('\n');
		}

		return content.join('');
	}

	getGridCharacter(x, y) {
		const i = this.getGridIndex(x, y);
		const f = this.gridArray[i];
		return PLAYER_PIECES[f] || numerics.unicode[i];
	}

	static get maxPlayerCount() {
		return PLAYER_PIECES.length;
	}
}

module.exports = TicTacToe;
