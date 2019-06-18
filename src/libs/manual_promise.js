class ManualPromise {
	constructor() {
		this._promise = new Promise((resolve, reject) => {
			Object.defineProperty(this, 'resolve', { value: resolve });
			Object.defineProperty(this, 'reject', { value: reject });
		});
	}

	then(onFulfilled, onRejected) {
		return this._promise.then(onFulfilled, onRejected);
	}

	catch(onRejected) {
		return this._promise.catch(onRejected);
	}

	finally(onFinally) {
		return this._promise.finally(onFinally);
	}
}

module.exports = ManualPromise;
