const Discord = require('discord.js');

const fsProm = require('../../libs/fs_prom');
const wait = require('../../libs/wait');

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const protocols = {
	'http:': http,
	'https:': https
};

const writeOptions = {
	flags: 'w',
	encoding: 'binary'
};

const MAP_ATT_URL = a => a.proxyURL;
const MAP_EMB_URL = e => e.image ? e.image.proxyURL : null;
const TRUTHY = v => v;

function downloadFile(urlStr, fileName) {
	return new Promise((resolve, reject) => {
		const url = new URL(urlStr);
		if (!protocols.hasOwnProperty(url.protocol)) return reject(`Unsupported protocol ${url.protocol}`);

		const protocol = protocols[url.protocol];
		const rawData = [];

		protocol.get(url, (res) => {
			console.log(`Downloading ${urlStr} as ${fileName}...`);
			const wstream = fs.createWriteStream(fileName, writeOptions);

			res.pipe(wstream);
			res.on('end', resolve);
		}).on('error', reject);
	});
}

async function forceDownloadFile(urlStr, fileName) {
	try {
		return await downloadFile(urlStr, fileName);
	}
	catch (e) {
		console.error(e);
		return forceDownloadFile(urlStr, fileName);
	}
}

function getExt(fname) {
	const m = fname.match(/\.[^\.]+$/);
	if (!m) return '';
	const ext = m[0].replace(/[\?%].+$/, '');
	if (ext.length > 4) return '';
	return ext;
}

const MKDIR_CATCH = e => e.code !== 'EEXIST' && console.log(e);
const reduceOldest = (a, b) => a.createdTimestamp < b.createdTimestamp ? a : b;

module.exports = {
	name: '%dwnlall',
	category: 'Admin',
	desc: 'Downloads all images in the current channel.',
	args: [ String ],
	argDesc: '`<dwnl-folder>`',
	async func({ author, channel, guild }, root) {
		console.log(`Downloading images in ${channel.name}...`);

		root = root.replace(/[^0-9a-zA-Z_-]/g, '_');

		await fsProm.mkdir(root).catch(MKDIR_CATCH);

		const reactions = {};
		const queued = [];
		let allQueued = false;

		const worker = workQueue();
		let messages = await channel.fetchMessages({ limit: 100 });

		while (messages.size > 0) {
			queued.push(...messages.values());

			const oldest = messages.reduce(reduceOldest);
			console.log(`Fetching messages starting at ${oldest.id}`);
			messages = await fetchNextMessages(oldest);
		}

		console.log(`Done fetching messages in ${channel.name}...`);

		allQueued = true;
		await worker;

		console.log(`Done downloading images of ${channel.name}...`);

		const jsonReactions = JSON.stringify(reactions);
		const reactsPath = path.join(root, 'reactions.json');
		await fsProm.writeFile(reactsPath, jsonReactions);

		console.log(`Saved reaction JSON of ${channel.name}...`);

		const indexPath = path.join(root, 'index.js');
		fs.copyFile(require.resolve('./dwnlall_index#.js'), indexPath,
			() => console.log(`Written index.js for ${channel.name}...`));

		async function workQueue() {
			const proms = [];

			while (!allQueued || queued[0]) {
				while (queued[0]) {
					const item = queued.pop();
					const r = downloadMessage(item, root);
					proms.push(r);
				}

				await wait.milliseconds(500);
			}

			await Promise.all(proms);
		}

		async function downloadMessage(message, root) {
			const reactProcess = fetchReactions(message);

			const urlProcesses = [
				...message.attachments.map(MAP_ATT_URL),
				...message.embeds.map(MAP_EMB_URL)
			].filter(TRUTHY).map((url, i) => {
				const fileName = path.join(root, `${message.id}-${i}${getExt(url)}`);
				return forceDownloadFile(url, fileName);
			});

			return Promise.all([reactProcess, ...urlProcesses]);
		}

		async function fetchReactions(message) {
			for (const reaction of message.reactions.values()) {
				const key = reaction.emoji.id || reaction.emoji.name;
				const userIds = await fetchReactionUsers(reaction);

				for (const id of userIds) {
					const rs = reactions[id] = reactions[id] || {};
					const ms = rs[key] = rs[key] || [];
					ms.push(message.id);
				}
			}
		}

		async function fetchReactionUsers(reaction) {
			try {
				await reaction.fetchUsers();
				return reaction.users.filter(u => !u.bot).map(u => u.id);
			}
			catch (e) {
				await wait.milliseconds(500);
				return fetchReactionUsers(reaction);
			}
		}

		async function fetchNextMessages(oldest) {
			try {
				return await channel.fetchMessages({ limit: 100, before: oldest.id });
			}
			catch (e) {
				await wait.milliseconds(500);
				return fetchNextMessages(oldest);
			}
		}
	}
};
