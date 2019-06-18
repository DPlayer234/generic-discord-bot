const combiners = {
	0: (cnd) => x => true,
	1: (cnd) => cnd[0]
};

function generateCombiner(count) {
	const varNames = [];
	for (let i = 0; i < count; i++) {
		varNames.push(`v${i}`);
	}

	return new Function('cnd', `
		const ${varNames.map((v, i) => `${v} = cnd[${i}]`).join(', ')};
		return x => ${varNames.map(v => v + '(x)').join(' && ')};
	`);
}

function getCombiner(count) {
	if (combiners[count]) return combiners[count];
	return combiners[count] = generateCombiner(count);
}

for (let i = 2; i < 10; i++) {
	combiners[i] = generateCombiner(i);
}

module.exports = function combineConditions(conditions) {
	return getCombiner(conditions.length)(conditions);
};
