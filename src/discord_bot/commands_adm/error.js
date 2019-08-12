const Discord = require('discord.js');

module.exports = {
	name: '%error',
	category: null,
	admin: true,
	desc: 'Throws an error.',
	args: Array,
	argDesc: '<message>',
	async func({ author, channel }, args) {
		await this.assertAdmin(author);
		throw new Error(args.join(' '));
	}
};
