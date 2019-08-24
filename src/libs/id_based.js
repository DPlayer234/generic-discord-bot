const toLockKey = obj => obj && obj.id ? obj.id : obj;
const ID_TYPES = new WeakMap();

function toIdType(T) {
	if (ID_TYPES.has(T)) return ID_TYPES.get(T);
	let IdType;

	const p = T.prototype;
	if (p.set && p.get && p.has && p.delete) {
		// Map
		IdType = extendIdMap(T);
	}
	else if (p.add && p.has && p.delete) {
		// Set
		IdType = extendIdSet(T);
	}
	else {
		// Invalid
		throw new TypeError('Cannot extend non-map-like and non-set-like classes.');
	}

	ID_TYPES.set(T, IdType);
	return IdType;
}

function extendIdMap(TMap) {
	return class IdMap extends TMap {
		get(key) {
			return super.get(toLockKey(key));
		}

		set(key, value) {
			return super.set(toLockKey(key), value);
		}

		has(key) {
			return super.has(toLockKey(key));
		}

		delete(key) {
			return super.delete(toLockKey(key));
		}
	};
}

function extendIdSet(TSet) {
	return class IdSet extends TSet {
		add(value) {
			return super.add(toLockKey(value));
		}

		has(value) {
			return super.has(toLockKey(value));
		}

		delete(value) {
			return super.delete(toLockKey(value));
		}
	};
}

const IdMap = extendIdMap(Map);
const IdSet = extendIdSet(Set);

module.exports = {
	IdMap, IdSet,
	toIdType
};
