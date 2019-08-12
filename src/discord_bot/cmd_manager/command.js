const CmdError = require('./cmd_error');

class Command {
	constructor({
		name, desc = null, category = null, admin = false,
		args = [], argDesc = null, argC = null,
		func, aliases = [],
		superName = null, superArgs = null,
		...other
	}, cmdManager) {
		if (typeof name !== 'string') throw new TypeError('The name of a command needs to be a string.');
		if (typeof func !== 'function') throw new TypeError('The function of a command needs to be a function.');

		this.cmdManager = cmdManager;
		this.bot = cmdManager.bot;
		this.client = cmdManager.client;

		this.name = name;
		this.desc = desc;
		this.category = category;
		this.admin = admin;
		this.args = args;
		this.argDesc = argDesc;
		this.argC = argC;
		this.aliases = aliases;
		this.func = func;

		this.superName = superName;
		this.superArgs = superArgs;
		this._super = null;

		Object.assign(this, other);
	}

	get super() {
		if (this._super) return this._super;
		if (!this.superArgs) return null;

		return this._super = this.cmdManager.findCommand(this.superName || this.name, this.superArgs);
	}

	cast(type, str, i) {
		return this.cmdManager.cast(type, str, i);
	}

	canCast(type) {
		return this.cmdManager.canCast(type);
	}

	eqArgTransform(args) {
		return this.cmdManager.eqArgTransform(args);
	}

	castRange(str, i) {
		return this.cmdManager.castRange(str, i);
	}

	requestConfirmation(channel, author) {
		return this.cmdManager.requestConfirmation(channel, author);
	}

	requestCancelableConfirmation(channel, author, cObj) {
		return this.cmdManager.requestCancelableConfirmation(channel, author, cObj);
	}

	assertAdmin(user) {
		return this.cmdManager.assertAdmin(user);
	}
}

Command.CmdError = Command.prototype.CmdError = CmdError;

module.exports = Command;
