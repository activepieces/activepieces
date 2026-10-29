import type {
	QdrantCondition,
	QdrantEmbedding,
	QdrantEmbeddingsInput,
	QdrantFilter,
	QdrantPointId,
	QdrantPointsSelector,
} from './types';

function decodeEmbeddings({ data }: { data: Buffer }): Float32Array[] {
	const embeddings = toEmbeddingList({
		value: parseEmbeddings({ text: data.toString('utf-8') }),
	});

	if (embeddings.length === 0) throw new Error('Embeddings must contain one element minimum');

	return embeddings.map((embedding) =>
		typeof embedding === 'string'
			? new Float32Array(new Uint8Array(Buffer.from(embedding, 'base64')).buffer)
			: new Float32Array(embedding),
	);
}

function convertToFilter({
	must,
	must_not,
}: {
	must?: Record<string, unknown>;
	must_not?: Record<string, unknown>;
}): QdrantFilter {
	return {
		must: toConditions({ fields: must }),
		must_not: toConditions({ fields: must_not }),
	};
}

function parseEmbeddings({ text }: { text: string }): QdrantEmbeddingsInput {
	if (text[0] === '[') {
		try {
			return JSON.parse(text);
		} catch {
			return text;
		}
	}
	return text;
}

function toEmbeddingList({ value }: { value: QdrantEmbeddingsInput }): QdrantEmbedding[] {
	if (typeof value === 'string') {
		return value.length === 0 ? [] : [value];
	}
	const [first] = value;
	if (typeof first === 'number' || (typeof first === 'string' && first.length === 1)) {
		return [value.map(Number)];
	}
	return value.map((embedding) => (typeof embedding === 'number' ? [embedding] : embedding));
}

function toConditions({ fields }: { fields?: Record<string, unknown> }): QdrantCondition[] {
	return Object.entries(fields ?? {}).flatMap(([key, rawValue]): QdrantCondition[] => {
		const value = parseFilterValue({ value: rawValue });

		if (['id', 'ids'].includes(key.toLocaleLowerCase())) {
			return [{ has_id: (value instanceof Array ? value : [value]).map(toPointId) }];
		}

		if (value instanceof Array) {
			return [
				{ key, match: { any: value } },
				{ key, match: { value } },
			];
		}

		return [{ key, match: { value } }];
	});
}

function toPointId(id: unknown): QdrantPointId {
	return typeof id === 'number' ? id : String(id);
}

function parsePointId({ id }: { id: unknown }): QdrantPointId {
	const value = typeof id === 'string' && /^\d+$/.test(id) ? Number(id) : id;
	if (typeof value === 'string') {
		return value;
	}
	if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) {
		return value;
	}
	throw new Error(
		`Point ID ${String(id)} is invalid: use a UUID string or an unsigned integer up to ${
			Number.MAX_SAFE_INTEGER
		}.`,
	);
}

function pointsSelector({
	pointIds,
	filter,
}: {
	pointIds?: unknown[];
	filter?: Record<string, unknown>;
}): QdrantPointsSelector {
	if (pointIds !== undefined && pointIds.length > 0) {
		if (filter !== undefined) {
			throw new Error(EXACTLY_ONE_SELECTOR);
		}
		return { points: pointIds.map((id) => parsePointId({ id })) };
	}
	if (filter === undefined) {
		throw new Error(EXACTLY_ONE_SELECTOR);
	}
	return { filter };
}

function requireItems<T>({ items, propName }: { items: T[]; propName: string }): T[] {
	if (items.length === 0) {
		throw new Error(`${propName} must contain at least one item.`);
	}
	return items;
}

function parseFilterValue({ value }: { value: unknown }): unknown {
	if (typeof value === 'string' && ['{', '['].includes(value[0])) {
		try {
			return JSON.parse(value);
		} catch {
			return value;
		}
	}
	return value;
}

export const qdrantUtils = {
	decodeEmbeddings,
	convertToFilter,
	toPointId,
	parsePointId,
	pointsSelector,
	requireItems,
};

const EXACTLY_ONE_SELECTOR = 'Provide exactly one of Point IDs or Filter.';
