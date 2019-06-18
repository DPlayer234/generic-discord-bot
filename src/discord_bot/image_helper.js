const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const fsProm = require('../libs/fs_prom');
const downloadFile = require('../libs/download_file');
const GeneratorMap = require('../libs/generator_map');

const DeckManager = require('./deck_manager');

const DECK_OFFSET = 21;
const DECK_RAR_WIDTH = 4;
const DECK_IND_WIDTH = 84;
const DECK_IND_HEIGHT = 131;
const DECK_LEFT = sharp('assets/deck_roles.png').png().toBuffer();

const CACHE_ROOT = '_cache';

const HASH_MAP = new GeneratorMap((key) => {
	const h = crypto.createHash('md5');
	h.update(key);
	return h.digest('hex');
});

const MKDIR_CATCH = e => e.code !== 'EEXIST' && console.log(e);

class ImageHelper extends null {
	static async fetchFile(url) {
		const hashedUrl = HASH_MAP.get(url);
		const cachedPath = path.join(CACHE_ROOT, hashedUrl);

		try {
			// File exists and can be read
			return await fsProm.readFile(cachedPath);
		}
		catch (e) {
			// File needs to be downloaded
			const data = await downloadFile(url);
			await fsProm.mkdir(CACHE_ROOT).catch(MKDIR_CATCH);
			await fsProm.writeFile(cachedPath, data);
			return data;
		}
	}

	static async fetchPortrait(char) {
		return this.fetchFile(char.portraitUrl);
	}

	static async createDeckImage(deck) {
		const deckChars = await DeckManager.fetchDeckChars(deck);
		return this._createDeckImage(deckChars);
	}

	static async createPartyImage(party) {
		return this._createDeckImage(party);
	}

	static async _createDeckImage(deckChars) {
		const deckImages = await this._fetchDeckImages(deckChars);

		const compositeImageArgs = await Promise.all([
			...deckImages.fighters.map((d, i) => this._createDeckCompositeArg(d, i, 0)),
			...deckImages.supporters.map((d, i) => this._createDeckCompositeArg(d, i, 1)),
			...deckChars.fighters.map((c, i) => this._createDeckRarCompositeArg(c, i, 0)),
			...deckChars.supporters.map((c, i) => this._createDeckRarCompositeArg(c, i, 1)),
			this._createDeckCompositeLeftArg()
		]);

		return sharp({ create: {
			width: DECK_OFFSET + (DECK_IND_WIDTH + DECK_RAR_WIDTH) * Math.max(deckImages.fighters.length, deckImages.supporters.length),
			height: DECK_IND_HEIGHT * 2 + 1,
			channels: 4, background: '#00000000'
		} }).composite(compositeImageArgs).png().toBuffer();
	}

	static async _fetchCharImages(chars) {
		return Promise.all(chars.map(c => this.fetchPortrait(c)));
	}

	static async _fetchDeckImages(deckChars) {
		const fighters = await this._fetchCharImages(deckChars.fighters);
		const supporters = await this._fetchCharImages(deckChars.supporters);

		return {
			chars: [...fighters, ...supporters],
			fighters, supporters
		};
	}

	static async _createDeckCompositeLeftArg() {
		const buffer = await DECK_LEFT;

		return {
			input: buffer,
			blend: 'add',
			top: 0,
			left: 0
		};
	}

	static async _createDeckCompositeArg(imageData, row, line) {
		const buffer = await sharp(imageData).png().resize(DECK_IND_WIDTH, DECK_IND_HEIGHT).toBuffer();

		return {
			input: buffer,
			blend: 'add',
			top: line * (DECK_IND_HEIGHT + 1),
			left: row * (DECK_IND_WIDTH + DECK_RAR_WIDTH) + DECK_RAR_WIDTH + DECK_OFFSET
		};
	}

	static async _createDeckRarCompositeArg(char, row, line) {
		const buffer = await sharp({ create: {
			width: DECK_RAR_WIDTH - 1,
			height: DECK_IND_HEIGHT,
			channels: 4, background: char.rarityInfo.color
		} }).png().toBuffer();

		return {
			input: buffer,
			blend: 'add',
			top: line * (DECK_IND_HEIGHT + 1),
			left: row * (DECK_IND_WIDTH + DECK_RAR_WIDTH) + 1 + DECK_OFFSET
		};
	}
}

module.exports = ImageHelper;
