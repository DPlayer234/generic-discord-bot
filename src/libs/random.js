function float(min, max) {
	return Math.random() * (max - min) + min;
}

function int(min, max) {
	return Math.floor(float(min, max));
}

function arrayItem(arr) {
	return arr[arr.length > 1 ? int(0, arr.length) : 0];
}

function pick(list, count) {
	const picker = new Picker(list);
	for (let i = 0; i < count; i++) picker.next();
	return picker.result;
}

class Picker {
	constructor(list) {
		this.list = list;
		this.indices = [];
		this.result = [];
		this.count = 0;
	}

	next() {
		if (this.count >= this.list.length) return;

		let index = int(0, this.list.length - this.count);
		this.count += 1;

		let j = 0;
		for (; j < this.indices.length; j++) {
			if (index < this.indices[j]) break;
			else index += 1;
		}

		const item = this.list[index];

		this.indices.splice(j, 0, index);
		this.result.push(item);

		return item;
	}

	nextCond(cond) {
		let item;
		do { item = this.next(); } while (!cond(item));
		return item;
	}
}

class WeightedRNG {
	constructor(items) {
		const tItems = [];
		let totalWeight = 0.0;

		for (const [item, weight] of items) {
			totalWeight += weight;
			tItems.push([item, totalWeight]);
		}

		this.tItems = tItems;
		this.totalWeight = totalWeight;
	}

	next() {
		const rng = float(0, this.totalWeight);
		return this.tItems.find(c => c[1] > rng)[0];
	}

	static from(items) {
		const rng = new this(items);
		return rng.next();
	}
}

module.exports = {
	float, int, arrayItem,
	pick, Picker, WeightedRNG
};
