const Discord = require('discord.js');
const DiscordBot = require('./discord_bot');
const RoastBot = require('./roast_bot');

const client = new Discord.Client();
client.login(process.env.BOT_TOKEN);

const bot = new DiscordBot(client, {
	ownerId: process.env.OWNER_USER_ID
});

const roastBot = new RoastBot(client);

global.client__ = client;
global.bot__ = bot;

/*
client.on('ready', () => {
	const SimpleHall = require('./simple_hall');

	const MAIN_ID = '576564128609468437';
	const HALL_ID = '576564157722263552';

	const hall = new SimpleHall({
		client: client,
		mainChannel: client.channels.get(MAIN_ID),
		hallChannel: client.channels.get(HALL_ID),
		copyEmoji: '608040750977908738',
		copyAmount: 2,
		approvedEmoji: '608045021127639040'
	});

	hall.on('copy', (main, hall) => console.log(`Copy: ${main.id} >> ${hall.id}`));
});
*/
