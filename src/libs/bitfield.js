const MAX_BITS = 32;

const SET_FIELDS = [];
for (let i = 0; i < MAX_BITS; i++) SET_FIELDS[i] = 1 << i;

const UNSET_FIELDS = SET_FIELDS.map(i => ~i);

class Bitfield {
	constructor(value) {
		this.value = ~~value;
	}

	static set(value, index, bool) {
		return bool
			? this.add(value, index)
			: this.delete(value, index);
	}

	static add(value, index) {
		return value | SET_FIELDS[index];
	}

	static delete(value, index) {
		return value & UNSET_FIELDS[index];
	}

	static has(value, index) {
		return (value & SET_FIELDS[index]) !== 0;
	}

	static isIndexValid(index) {
		return SET_FIELDS.hasOwnProperty(index);
	}

	set(index, bool) {
		return this.value = this.constructor.set(this.value, index, bool);
	}

	add(index) {
		return this.value = this.constructor.add(this.value, index);
	}

	delete(index) {
		return this.value = this.constructor.delete(this.value, index);
	}

	has(index) {
		return this.constructor.has(this.value, index);
	}

	toString() {
		return `${this.constructor.name}[${this.value}]`;
	}
	
	valueOf() {
		return this.value;
	}

	[Symbol.toPrimitive]() {
		return this.valueOf();
	}

	*[Symbol.iterator]() {
		for (let i = 0; i < MAX_BITS; i++) yield this.has(i);
	}
}

module.exports = Bitfield;
