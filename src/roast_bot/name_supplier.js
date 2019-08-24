class NameSupplier {
	constructor(member) {
		this.member = member;
		this.user = member.user;
	}

	get full() {
		return this.member.displayName;
	}

	get stripped() {
		let stripped = this.full.replace(/[^a-zA-Z0-9]/g, '');
		if (!/^[0-9]+$/.test(stripped)) stripped = stripped.replace(/[0-9]/g, '');
		return stripped;
	}

	get parts() {
		const stripped = this.stripped;

		const parts = stripped.match(/[A-Z]+?[a-z]+/g);
		if (!parts) return stripped;

		return parts;
	}

	get nick() {
		for (const part of this.parts) {
			const nick = this._getNick(part);
			if (nick) return nick;
		}

		return this.stripped;
	}

	_getNick(part) {
		const multiCaps = part.match(/^[A-Z]{2,}/);
		if (multiCaps) return multiCaps[0];

		const manyCons = part.match(/^(.*?[bcdfgjlmkpqtvwxz]{2})[bcdfgjlmkpqtvwxz]/);
		if (manyCons) return manyCons[1];

		if (part.length > 3) return part;

		return null;
	}
}

module.exports = NameSupplier;
