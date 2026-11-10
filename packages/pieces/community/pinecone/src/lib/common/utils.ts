import type {
	DocumentRecord,
	MessageModel,
	PineconeRecord,
	ReadCapacity,
	RecordMetadata,
	RecordMetadataValue,
	RecordSparseValues,
} from './types';

function toStringMap({
	value,
	propName,
}: {
	value: object;
	propName: string;
}): Record<string, string> {
	return Object.fromEntries(
		Object.entries(value).map(([key, entry]): [string, string] => {
			if (typeof entry !== 'string') {
				throw new Error(`"${propName}" values must be strings, but "${key}" is not.`);
			}
			return [key, entry];
		}),
	);
}

function toRecordMetadata({
	value,
	propName,
}: {
	value: object;
	propName: string;
}): RecordMetadata {
	return Object.fromEntries(
		Object.entries(value).map(([key, entry]): [string, RecordMetadataValue] => [
			key,
			toMetadataValue({ key, entry, propName }),
		]),
	);
}

function toStringList({ value, propName }: { value: unknown[]; propName: string }): string[] {
	if (!value.every((item): item is string => typeof item === 'string')) {
		throw new Error(`"${propName}" must be a list of strings.`);
	}
	return value;
}

function toNumberList({ value, propName }: { value: unknown[]; propName: string }): number[] {
	if (!value.every((item): item is number => typeof item === 'number')) {
		throw new Error(`"${propName}" must be a list of numbers.`);
	}
	return value;
}

function toReadCapacity({
	nodeType,
	replicas,
	shards,
}: {
	nodeType?: 'b1' | 't1';
	replicas?: number;
	shards?: number;
}): ReadCapacity | undefined {
	if (nodeType === undefined) {
		if (replicas !== undefined || shards !== undefined) {
			throw new Error('"Read Replicas" and "Read Shards" need "Dedicated Node Type".');
		}
		return undefined;
	}
	if (replicas === undefined || shards === undefined) {
		throw new Error('"Dedicated Node Type" needs both "Read Replicas" and "Read Shards".');
	}
	return {
		mode: 'Dedicated',
		dedicated: { nodeType, scaling: 'Manual', manual: { replicas, shards } },
	};
}

function toSparseValues({
	indices,
	values,
	propName,
}: {
	indices: unknown[];
	values: unknown[];
	propName: string;
}): RecordSparseValues {
	if (indices.length !== values.length) {
		throw new Error(`"${propName}" indices and values must have the same length.`);
	}
	return {
		indices: toNumberList({ value: indices, propName: `${propName} indices` }),
		values: toNumberList({ value: values, propName: `${propName} values` }),
	};
}

function toVectorRecords({
	value,
	propName,
}: {
	value: unknown[];
	propName: string;
}): PineconeRecord[] {
	return value.map((item, position) =>
		toVectorRecord({ item, propName: `${propName}[${position}]` }),
	);
}

function toVectorRecord({ item, propName }: { item: unknown; propName: string }): PineconeRecord {
	if (typeof item !== 'object' || item === null || Array.isArray(item)) {
		throw new Error(`"${propName}" must be an object like {"id": "vec-1", "values": [0.1, 0.2]}.`);
	}
	const id = 'id' in item ? item.id : undefined;
	if (typeof id !== 'string' || id === '') {
		throw new Error(`"${propName}.id" must be a non-empty string.`);
	}
	const values = 'values' in item ? item.values : undefined;
	const sparseValues = 'sparseValues' in item ? item.sparseValues : undefined;
	const metadata = 'metadata' in item ? item.metadata : undefined;
	if (values !== undefined && !Array.isArray(values)) {
		throw new Error(`"${propName}.values" must be a list of numbers.`);
	}
	if (
		metadata !== undefined &&
		(typeof metadata !== 'object' || metadata === null || Array.isArray(metadata))
	) {
		throw new Error(`"${propName}.metadata" must be an object.`);
	}
	return {
		id,
		...(values !== undefined
			? { values: toNumberList({ value: values, propName: `${propName}.values` }) }
			: {}),
		...(sparseValues !== undefined
			? {
					sparseValues: toSparseObject({
						value: sparseValues,
						propName: `${propName}.sparseValues`,
					}),
			  }
			: {}),
		...(metadata !== undefined
			? { metadata: toRecordMetadata({ value: metadata, propName: `${propName}.metadata` }) }
			: {}),
	};
}

function toSparseObject({
	value,
	propName,
}: {
	value: unknown;
	propName: string;
}): RecordSparseValues {
	if (typeof value !== 'object' || value === null) {
		throw new Error(
			`"${propName}" must be an object like {"indices": [1, 5], "values": [0.5, 0.3]}.`,
		);
	}
	const indices = 'indices' in value ? value.indices : undefined;
	const values = 'values' in value ? value.values : undefined;
	if (!Array.isArray(indices) || !Array.isArray(values)) {
		throw new Error(`"${propName}" needs "indices" and "values" lists.`);
	}
	return toSparseValues({ indices, values, propName });
}

function toDocuments({
	value,
	propName,
}: {
	value: unknown[];
	propName: string;
}): DocumentRecord[] {
	return value.map((item, position) => {
		if (typeof item !== 'object' || item === null || Array.isArray(item)) {
			throw new Error(`"${propName}[${position}]" must be an object with an "_id".`);
		}
		const id = '_id' in item ? item._id : undefined;
		if (typeof id !== 'string' || id === '') {
			throw new Error(`"${propName}[${position}]._id" must be a non-empty string.`);
		}
		return { ...item, _id: id };
	});
}

function toTextRecords({
	value,
	propName,
}: {
	value: unknown[];
	propName: string;
}): PineconeTextRecord[] {
	return value.map((item, position) => {
		if (typeof item !== 'object' || item === null || Array.isArray(item)) {
			throw new Error(`"${propName}[${position}]" must be an object with an "_id".`);
		}
		const fields = toRecordMetadata({ value: item, propName: `${propName}[${position}]` });
		const id = fields['_id'];
		if (typeof id !== 'string' || id === '') {
			throw new Error(`"${propName}[${position}]._id" must be a non-empty string.`);
		}
		return { ...fields, _id: id };
	});
}

function toMessages({ value, propName }: { value: unknown[]; propName: string }): MessageModel[] {
	return value.map((item, position) => {
		const role =
			typeof item === 'object' && item !== null && 'role' in item ? item.role : undefined;
		const content =
			typeof item === 'object' && item !== null && 'content' in item ? item.content : undefined;
		if (typeof role !== 'string' || typeof content !== 'string') {
			throw new Error(
				`"${propName}[${position}]" must be {"role": "user" | "assistant", "content": "..."}.`,
			);
		}
		return { role, content };
	});
}

function toRerankDocuments({
	value,
	propName,
}: {
	value: unknown[];
	propName: string;
}): Array<string | Record<string, string>> {
	return value.map((item, position) => {
		if (typeof item === 'string') {
			return item;
		}
		if (typeof item !== 'object' || item === null || Array.isArray(item)) {
			throw new Error(`"${propName}[${position}]" must be a string or an object of string fields.`);
		}
		return toStringMap({ value: item, propName: `${propName}[${position}]` });
	});
}

function toFileMetadata({
	value,
	propName,
}: {
	value: object;
	propName: string;
}): Record<string, string | number> {
	return Object.fromEntries(
		Object.entries(value).map(([key, entry]): [string, string | number] => {
			if (typeof entry !== 'string' && typeof entry !== 'number') {
				throw new Error(`"${propName}.${key}" must be a string or a number.`);
			}
			return [key, entry];
		}),
	);
}

function toMetadataValue({
	key,
	entry,
	propName,
}: {
	key: string;
	entry: unknown;
	propName: string;
}): RecordMetadataValue {
	if (typeof entry === 'string' || typeof entry === 'number' || typeof entry === 'boolean') {
		return entry;
	}
	if (Array.isArray(entry) && entry.every((item): item is string => typeof item === 'string')) {
		return entry;
	}
	throw new Error(`"${propName}.${key}" must be a string, number, boolean or list of strings.`);
}

export const pineconeUtils = {
	toStringMap,
	toRecordMetadata,
	toStringList,
	toNumberList,
	toReadCapacity,
	toSparseValues,
	toVectorRecords,
	toDocuments,
	toTextRecords,
	toMessages,
	toRerankDocuments,
	toFileMetadata,
};

type PineconeTextRecord = RecordMetadata & { _id: string };
