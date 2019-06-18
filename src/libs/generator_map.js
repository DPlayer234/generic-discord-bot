class GeneratorMap extends Map {
	constructor(generator, ...args) {
		super(...args);
		this.generator = generator;
	}

	get(key) {
		if (super.has(key)) return super.get(key);

		const value = this.generator(key);
		super.set(key, value);
		return value;
	}
}

module.exports = GeneratorMap;
