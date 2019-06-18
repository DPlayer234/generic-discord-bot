const Discord = require('discord.js');

const random = require('../../libs/random');

const choices = ['rock', 'paper', 'scissor'];
//const choices = ['<:battleship:589213822708088842>', '<:destroyer:589213860167417872>', '<:carrier:589213900998705153>'];
const indices = new Map(choices.map((v, i) => [v, i]));

function wins(a, b) {
	const ai = indices.get(a);
	const bi = indices.get(b);
	if (ai === bi) return 0;
	if ((ai - bi === 1) || (bi - ai === indices.size - 1)) return 1;
	return 2;
}

const rpsInsert = choices.join('/');

async function waitForRPS(channel, author) {
	try {
		const responses = await channel.awaitMessages(r => r.author.id === author.id && choices.includes(r.content), {
			max: 10,
			maxMatches: 1,
			time: 30000,
			errors: ['time']
		});

		return responses.first().content.toLowerCase();
	}
	catch (err) {
		return null;
	}
}

module.exports = {
	name: 'rps',
	category: 'Games',
	desc: `Start a game of Rock-Paper-Scissor against the bot.`,
	args: [],
	async func({ author, channel, guild }) {
		await channel.send(`Type ${rpsInsert} to pick.`);
		const botPick = random.arrayItem(choices);
		const userPick = await waitForRPS(channel, author);
		if (!userPick) return channel.send(this.bot.getMessage('request_timeout'));

		await channel.send(`*${botPick}!*`);

		const winner = wins(userPick, botPick);

		switch (winner) {
			case 0: return channel.send('It\'s a draw!');
			case 1: return channel.send('You win!');
			case 2: return channel.send('I win!');
		}
	}
};
