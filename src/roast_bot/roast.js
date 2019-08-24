const NameSupplier = require('./name_supplier');

const format = {
	userName: Symbol('userName'),
	userNick: Symbol('userNick'),
	userMention: Symbol('userMention')
};

const formatSet = new Set(Object.values(format));

function roast(parts, ...inserts) {
	if (inserts.length === 0) return () => parts[0];

	for (let i = 0; i < inserts.length; i++) {
		if (!formatSet.has(inserts[i])) throw new TypeError('Invalid roast insert.');
	}

	return (member) => {
		const result = [parts[0]];
		for (let i = 0; i < inserts.length; i++) {
			result.push(getInsert(inserts[i], member), parts[i + 1]);
		}

		return result.join('');
	};
}

function getInsert(insert, member) {
	switch (insert) {
		case format.userName: return new NameSupplier(member).full;
		case format.userNick: return new NameSupplier(member).nick;
		case format.userMention: return member.toString();
		default: throw new TypeError('Invalid roast insert');
	}
}

roast.format = format;

module.exports = roast;
