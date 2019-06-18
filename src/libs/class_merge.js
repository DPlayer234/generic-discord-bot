const STATIC_DEFAULT = [ 'length', 'name', 'prototype' ];
const INST_DEFAULT = [ 'constructor' ];

module.exports = function classMerge(TInto, TFrom) {
	const statics = Object.getOwnPropertyDescriptors(TFrom);
	const insts = Object.getOwnPropertyDescriptors(TFrom.prototype);

	for (const fieldName of STATIC_DEFAULT) delete statics[fieldName];
	for (const fieldName of INST_DEFAULT) delete insts[fieldName];

	for (const key of Object.keys(statics)) {
		if (TInto.hasOwnProperty(key)) throw new TypeError(`Duplicate static property '${key}'`);
	}

	for (const key of Object.keys(insts)) {
		if (TInto.prototype.hasOwnProperty(key)) throw new TypeError(`Duplicate property '${key}'`);
	}

	Object.defineProperties(TInto, statics);
	Object.defineProperties(TInto.prototype, insts);

	return TInto;
};
