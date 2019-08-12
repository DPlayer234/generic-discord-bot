const Discord = require('discord.js');

const fsProm = require('../../libs/fs_prom');
const wait = require('../../libs/wait');

const fs = require('fs');
const path = require('path');

const MAX_PARALLEL = 20;
const MSG_FILTER = m => m.attachments.size || m.embeds.length;
const MKDIR_CATCH = e => e.code !== 'EEXIST' && console.log(e);
const reduceOldest = (a, b) => a.createdTimestamp < b.createdTimestamp ? a : b;

module.exports = {
	name: '%fetchreact',
	category: 'Admin',
	admin: true,
	desc: 'Fetches all reactions in the current channel.',
	args: [ Discord.Channel, String ],
	argDesc: '`<#channel> <dwnl-folder>`',
	async func(message, channel, root) {
		console.log(`Fetching reactions in ${channel.name}...`);

		root = root.replace(/[^0-9a-zA-Z_-]/g, '_');

		await fsProm.mkdir(root).catch(MKDIR_CATCH);

		const reactions = {};
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

		const jsonReactions = JSON.stringify(reactions);
		const reactsPath = path.join(root, 'reactions.json');
		await fsProm.writeFile(reactsPath, jsonReactions);

		console.log(`Saved reaction JSON of ${channel.name}...`);

		const indexPath = path.join(root, 'index.js');
		fs.copyFile(require.resolve('./fetchreact_index#.js'), indexPath,
			() => console.log(`Written index.js for ${channel.name}...`));

		async function workQueue() {
			const dwnl = new Set();

			while (!allQueued || queued[0]) {
				while (queued[0] && dwnl.size < MAX_PARALLEL) {
					const item = queued.pop();
					const proc = fetchReactions(item).then(() => dwnl.delete(proc));
					dwnl.add(proc);
				}

				await wait.milliseconds(50);
			}

			await Promise.all(dwnl);
		}

		async function fetchReactions(message) {
			console.log(`Fetching reactions of ${message.id}...`);

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
