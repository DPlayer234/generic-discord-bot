const Enum = require('../../libs/enum');

class CmdError extends Error {
	constructor(type, message) {
		if (!CmdError.TYPES[type]) throw new Error('Invalid CmdError type.');
		super(`${CmdError.MESSAGES[type]}${message}`);
		this.cmdErrorType = type;
	}
}

CmdError.TYPES = new Enum([
	'INVALID_COMMAND',
	'INVALID_ARGS',
	'CUSTOM'
]);

CmdError.MESSAGES = {
	'INVALID_COMMAND': 'I know no such command: ',
	'INVALID_ARGS': 'The arguments are incorrect: ',
	'CUSTOM': ''
};

module.exports = CmdError;
