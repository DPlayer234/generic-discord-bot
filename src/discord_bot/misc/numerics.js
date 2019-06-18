/*
 * File for defining numeric emojis.
 */
const emojis = [];

for (let i = 0; i < 9; i++) {
	emojis.push(`${i + 1}\u20E3`);
}

for (let i = 0x1f1e6; i < 0x1f200; i++) {
	emojis.push(String.fromCodePoint(i));
}

exports.unicode = emojis;
exports.uri = emojis.map(encodeURI);
exports.ascii = '123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
