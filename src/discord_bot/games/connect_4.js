const Game = require('./game');
const numerics = require('../misc/numerics');

const BACKGROUND = '⬛';
const PLAYER_PIECES = ['❤', '💙', '💚', '💛'];
const WIN_PIECE = '💗';

const WIDTH = 7, HEIGHT = 6;
const TOTAL = WIDTH * HEIGHT;
const WIN_LENGTH = 4;

const SUB_NUM = numerics.uri.slice(0, WIDTH);
const REACTIONS = new Set(SUB_NUM);
const REVERSE_MAP = new Map(SUB_NUM.map((n, i) => [n, i]));
const TOP_LINE = numerics.unicode.slice(0, WIDTH).join('');

class Connect4 extends Game {
	constructor(channel, players) {
		super(channel, players);

		this.gridArray = new Array(TOTAL).fill(-1);
		this.message = null;

		this.lastDrop = null;
	}

	async start() {
		this.message = await this.channel.send('Please wait...');
		for (const emoji of REACTIONS) await this.message.react(emoji);

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

		const reactionFilter = (reaction, user) => REACTIONS.has(reaction.emoji.identifier) && user === turnUser;

		while (true) {
			const reactionColl = await this.message.awaitReactions(reactionFilter, { max: 1 });

			const reaction = reactionColl.first();
			const pos = REVERSE_MAP.get(reaction.emoji.identifier);

			if (this.dropPiece(pos, this.turnUserIndex)) break;
		}
	}

	getWinnerIndex() {
		debugger;
		if (!this.lastDrop) return null;
		const [x, y] = this.lastDrop;
		const value = this.getField(x, y);

		if (this.canWinHorizontally(x, y, value) ||
			this.canWinVertically(x, y, value) ||
			this.canWinDiagonally1(x, y, value) ||
			this.canWinDiagonally2(x, y, value)) return value;

		return null;
	}

	canWinHorizontally(x, y, value) {
		const min = Math.max(0, x - WIN_LENGTH + 1);

		let first;
		for (let i = min; i < x + 1; i++) {
			if (this.getField(i, y) === value) {
				first = i;
				break;
			}
		}

		const max = Math.min(first + WIN_LENGTH, WIDTH, x + WIN_LENGTH);
		if (max - first < WIN_LENGTH) return false;

		for (let i = first; i < max; i++) {
			if (this.getField(i, y) !== value) return false;
		}

		return true;
	}

	canWinVertically(x, y, value) {
		const min = Math.max(0, y - WIN_LENGTH + 1);

		let first;
		for (let i = min; i < y + 1; i++) {
			if (this.getField(x, i) === value) {
				first = i;
				break;
			}
		}

		const max = Math.min(first + WIN_LENGTH, HEIGHT, y + WIN_LENGTH);
		if (max - first < WIN_LENGTH) return false;

		for (let i = first; i < max; i++) {
			if (this.getField(x, i) !== value) return false;
		}

		return true;
	}

	canWinDiagonally1(x, y, value) {
		const maxRed = Math.min(x, y, WIN_LENGTH - 1);

		let inc;
		for (let i = -maxRed; i < 1; i++) {
			if (this.getField(x + i, y + i) === value) {
				inc = i;
				break;
			}
		}

		const maxInc = Math.min(inc + WIN_LENGTH, WIDTH - x, HEIGHT - y, WIN_LENGTH);
		if (maxInc - inc < WIN_LENGTH) return false;

		for (let i = inc; i < maxInc; i++) {
			if (this.getField(x + i, y + i) !== value) return false;
		}

		return true;
	}

	canWinDiagonally2(x, y, value) {
		const maxRed = Math.min(x, HEIGHT - y - 1, WIN_LENGTH - 1);

		let inc;
		for (let i = -maxRed; i < 1; i++) {
			if (this.getField(x + i, y - i) === value) {
				inc = i;
				break;
			}
		}

		const maxInc = Math.min(inc + WIN_LENGTH, WIDTH - x, y + 1, WIN_LENGTH);
		if (maxInc - inc < WIN_LENGTH) return false;

		for (let i = inc; i < maxInc; i++) {
			if (this.getField(x + i, y - i) !== value) return false;
		}

		return true;
	}

	getWinMessage(winner) {
		return winner
			? `${winner} won!`
			: 'It\'s a draw!';
	}

	dropPiece(x, value) {
		if (x < 0 || x >= WIDTH) throw new RangeError('Out of grid range.');

		for (let y = HEIGHT - 1; y >= 0; y--) {
			const f = this.getField(x, y);

			if (f < 0) {
				this.setField(x, y, value);
				this.lastDrop = [x, y];
				return true;
			}
		}

		return false;
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
		const content = [TOP_LINE, '\n'];

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
		return PLAYER_PIECES[f] || BACKGROUND;
	}

	static get maxPlayerCount() {
		return PLAYER_PIECES.length;
	}
}

module.exports = Connect4;
