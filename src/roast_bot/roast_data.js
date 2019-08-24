const roast = require('./roast');
const { userName, userNick, userMention } = roast.format;

module.exports = [
	[
		roast`What?`,
		roast`Leave me alone, ${userNick}!`,
		roast`You're not remotely worth dealing with.`
	],
	[
		roast`What the fuck do you want now?!`,
		roast`${userNick}, you buffoon.`,
		roast`Get the hell out!`
	],
	[
		roast`Trust me, ${userNick}, I have`,
		roast`never`,
		roast`ever`,
		roast`met somebody as obnoxious as you.`,
		roast`${userName}, you truly are special.`
	],
	[
		roast`You know...`,
		roast`Sometimes I feel like I'm surrounded by idiots.`,
		roast`But, ${userName}, you...`,
		roast`Yes, you're on a whole 'nother level of stupid.`
	],
	[
		roast`Go back to studying the blade or something, ${userNick}...`,
		roast`... and don't forget your fedora on the way out.`
	],
	[
		roast`${userMention}`,
		roast`How does it feel getting constantly pinged?`,
		roast`${userMention}`,
		roast`Huh?`,
		roast`${userMention} ${userMention}`,
		roast`Huuuh!!?`,
		roast`${userMention} ${userMention} ${userMention} ${userMention}`
	],
	[
		roast`I honestly can't be bothered to even come up with a way to insult you.`,
		roast`Just...`,
		roast`Not worth the time for you, ${userNick}.`
	]
];
