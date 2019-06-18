function milliseconds(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function forResponse(message, maxTime) {
	return forMessage(message.channel, message.author, maxTime);
}

async function forMessage(channel, author, maxTime = 30000) {
	try {
		let responses = await channel.awaitMessages((response) => response.author.id === author.id, {
			max: 10,
			maxMatches: 1,
			time: maxTime,
			errors: ['time']
		});

		return responses.first();
	}
	catch (err) {
		return null;
	}
}

module.exports = {
	milliseconds,
	forResponse,
	forMessage
};
