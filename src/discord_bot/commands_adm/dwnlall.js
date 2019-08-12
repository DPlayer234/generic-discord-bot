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
			res.on('error', err => {
				wstream.end();
				reject(err);
			});
			res.on('end', () => {
				wstream.end();
				resolve();
			});
		}).on('error', reject);
	});
}

async function forceDownloadFile(urlStr, fileName) {
	try {
		return await downloadFile(urlStr, fileName);
	}
	catch (e) {
		console.error(e);
		await wait.milliseconds(500);
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

const MAX_PARALLEL = 5;
const MKDIR_CATCH = e => e.code !== 'EEXIST' && console.log(e);
const MSG_FILTER = m => m.attachments.size || m.embeds.length;
const reduceOldest = (a, b) => a.createdTimestamp < b.createdTimestamp ? a : b;

module.exports = {
	name: '%dwnlall',
	category: 'Admin',
	admin: true,
	desc: 'Downloads all images in the current channel.',
	args: [ Discord.Channel, String ],
	argDesc: '`<#channel> <dwnl-folder>`',
	async func(message, channel, root) {
		console.log(`Downloading images in ${channel.name}...`);

		root = root.replace(/[^0-9a-zA-Z_-]/g, '_');

		await fsProm.mkdir(root).catch(MKDIR_CATCH);

		const queued = [];
		let allQueued = false;

		const worker = workQueue();
		let messages = await channel.fetchMessages({ limit: 100 });

		while (messages.size > 0) {
			queued.push(...messages.filter(MSG_FILTER).values());

			const oldest = messages.reduce(reduceOldest);
			console.log(`Fetching messages starting at ${oldest.id}`);
			messages = await fetchNextMessages(oldest);
		}

		console.log(`Done fetching messages in ${channel.name}...`);

		allQueued = true;

		await worker;

		console.log(`Done downloading images of ${channel.name}...`);

		async function workQueue() {
			const dwnl = new Set();

			while (!allQueued || queued[0]) {
				while (queued[0] && dwnl.size < MAX_PARALLEL) {
					const item = queued.pop();
					const proc = downloadMessage(item, root).then(() => dwnl.delete(proc));
					dwnl.add(proc);
				}

				await wait.milliseconds(50);
			}

			await Promise.all(dwnl);
		}

		async function downloadMessage(message, root) {
			const urlProcesses = [
				...message.attachments.map(MAP_ATT_URL),
				...message.embeds.map(MAP_EMB_URL)
			].filter(TRUTHY).map((url, i) => {
				const fileName = path.join(root, `${message.id}-${i}${getExt(url)}`);
				return forceDownloadFile(url, fileName);
			});

			return Promise.all(urlProcesses);
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
