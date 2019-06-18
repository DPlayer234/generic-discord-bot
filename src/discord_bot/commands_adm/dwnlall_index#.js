/**
 * Run this script with node.js
 * This script allows you to filter images based on your reactions.
 *
 * Just follow the prompts.
 * :lewd: is 357212667427028992
 * :lick: is 357212424941600769.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

function getUserId() {
	return new Promise((resolve, reject) => {
		rl.question('Enter your user ID: ', answer => resolve(answer));
	});
}

function getEmojiId() {
	return new Promise((resolve, reject) => {
		rl.question('Enter the emoji ID: ', answer => resolve(answer));
	});
}

function getReactionData() {
	return new Promise((resolve, reject) => {
		fs.readFile(path.join(__dirname, 'reactions.json'), (err, data) => {
			if (err) reject(err);
			else resolve(data);
		});
	});
}

function copyFile(output, file) {
	const src = path.join(__dirname, file);
	const dest = path.join(output, file);
	fs.copyFile(src, dest, () => console.log(`Copied ${file}...`));
}

async function main() {
	const rawData = await getReactionData();
	const data = JSON.parse(rawData.toString('utf8'));

	const userId = await getUserId();
	const reactions = data[userId];
	if (!reactions) return rl.write('No reactions for that user found.');

	const emojiId = await getEmojiId();
	const messages = reactions[emojiId];
	if (!messages) return rl.write('No messages for that user-emoji combination found.');

	const output = userId + '-' + emojiId;
	try { fs.mkdirSync(output); }
	catch (e) { console.warn('Could not create output directory...'); }

	const messageSet = new Set(messages);
	let files = fs.readdirSync(__dirname);

	files = files.filter(f => fs.statSync(f).isFile() && messageSet.has(f.slice(0, 18)));
	files.forEach(f => copyFile(output, f));
}

main().catch(console.error).then(() => rl.close());
