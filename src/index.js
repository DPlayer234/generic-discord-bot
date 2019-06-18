const Discord = require('discord.js');
const DiscordBot = require('./discord_bot');

const client = new Discord.Client();
client.login(process.env.BOT_TOKEN);

const bot = new DiscordBot(client, {
	ownerId: process.env.OWNER_USER_ID
});

global.client__ = client;
global.bot__ = bot;
