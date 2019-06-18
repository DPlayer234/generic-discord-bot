class Enum {
	constructor(arr) {
		this._array = [...arr];

		for (let item of this._array) {
			this[item] = item;
		}

		Object.freeze(this);
		Object.freeze(this._array);
	}

	asArray() {
		return this._array;
	}

	has(field) {
		return this[field] === field;
	}

	get itemCount() {
		return this._array.length;
	}

	[Symbol.iterator]() {
		return this._array[Symbol.iterator]();
	}
}

module.exports = Enum;
