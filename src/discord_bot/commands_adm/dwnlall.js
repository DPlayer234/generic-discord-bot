const Discord = require('discord.js');

const fsProm = require('../../libs/fs_prom');

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

async function downloadMessage(message, root) {
	return [
		...message.attachments.map(MAP_ATT_URL),
		...message.embeds.map(MAP_EMB_URL)
	].filter(TRUTHY).map((url, i) => {
		const fileName = path.join(root, `${message.id}-${i}${getExt(url)}`);
		return forceDownloadFile(url, fileName);
	});
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
		let messages = await channel.fetchMessages({ limit: 100 });

		const queued = [];
		let allQueued = false;

		let worker = workQueue();

		while (messages.size > 0) {
			queued.push(...messages.values());

			const oldest = messages.reduce(reduceOldest);
			console.log(`Fetching messages starting at ${oldest.id}`);
			messages = await channel.fetchMessages({ limit: 100, before: oldest.id });
		}

		console.log(`Done fetching messages in ${channel.name}...`);

		allQueued = true;
		await worker;

		console.log(`Done downloading images of ${channel.name}...`);

		async function workQueue() {
			const proms = [];

			while (!allQueued || queued[0]) {
				while (queued[0]) {
					const item = queued.pop();
					const r = downloadMessage(item, root);
					proms.push(r);
				}

				await new Promise(r => setTimeout(r, 500));
			}

			await Promise.all(proms);
		}
	}
};
