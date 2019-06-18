function invalidOperation(name) {
	throw new TypeError(`Cannot use the ${name} method in SetArrays`);
}

class SetArray extends Set {
	constructor(items) {
		super();

		this.length = 0;

		if (items) {
			for (const item of items) {
				this.add(item);
			}
		}
	}

	add(item) {
		if (this.has(item)) return this;

		this[this.length++] = item;

		return super.add(item);
	}

	delete(item) {
		if (!this.has(item)) return false;

		const indexOf = this.indexOf(item);
		this.splice(indexOf, 1);

		return super.delete(item);
	}

	includes(item) {
		return this.has(item);
	}

	pop() {
		const item = Array.prototype.pop.call(this);

		super.delete(item);
		return item;
	}

	push(...items) {
		for (const item of items) {
			this.add(item);
		}

		return this.length;
	}

	shift() {
		const item = Array.prototype.shift.call(this);

		super.delete(item);
		return item;
	}

	unshift(...items) {
		items = items.filter(i => !this.has(i));

		for (const item of items) {
			super.add(item);
		}

		return Array.prototype.unshift.apply(this, items);
	}

	splice(...args) {
		const slice = Array.prototype.splice.apply(this, args);

		for (const item of slice) {
			super.delete(item);
		}

		return slice;
	}

	fill() { invalidOperation('fill'); }

	toJSON() {
		return [...this];
	}

	[Symbol.toStringTag]() {
		return this.constructor.name;
	}
}

for (const method of Reflect.ownKeys(Array.prototype)) {
	if (!SetArray.prototype.hasOwnProperty(method)) {
		SetArray.prototype[method] = Array.prototype[method];
	}
}

module.exports = SetArray;
