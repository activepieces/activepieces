import { Property } from '@activepieces/pieces-framework';

import type { PropParams } from './props';

function collectionName<R extends boolean>({
	required,
	displayName = 'Collection Name',
	description = 'Exact name of the collection, e.g. "products". Use List Collections to find it.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function pointIds<R extends boolean>({
	required,
	displayName = 'Point IDs',
	description = 'Point IDs: unsigned integers (e.g. 42) or UUID strings. Returned by Scroll Points and Query Points.',
}: PropParams<R>) {
	return Property.Array({ displayName, description, required });
}

function filter<R extends boolean>({
	required,
	displayName = 'Filter',
	description = 'Qdrant filter object with must, should and must_not condition lists, e.g. {"must": [{"key": "city", "match": {"value": "London"}}]}. Filtering on a field is fastest with a payload index (Create Payload Index).',
}: PropParams<R>) {
	return Property.Json({ displayName, description, required });
}

function withPayload<R extends boolean>({
	required,
	displayName = 'Include Payload',
	description = "Return each point's payload. Defaults to true.",
}: PropParams<R>) {
	return Property.Checkbox({ displayName, description, required, defaultValue: true });
}

function withVector<R extends boolean>({
	required,
	displayName = 'Include Vectors',
	description = "Return each point's vectors. Defaults to false; vectors can be large.",
}: PropParams<R>) {
	return Property.Checkbox({ displayName, description, required, defaultValue: false });
}

function limit<R extends boolean>({
	required,
	displayName = 'Limit',
	description = 'Maximum number of results to return. Defaults to 10.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function query<R extends boolean>({
	required,
	displayName = 'Query',
	description = 'What to rank by, as JSON. Nearest to a vector: {"nearest": [0.1, 0.2, 0.3]}. Nearest to an existing point: {"nearest": 42}. Fuse prefetch results: {"fusion": "rrf"}. Order by a payload field: {"order_by": "price"}. Leave empty to return points matching the filter.',
}: PropParams<R>) {
	return Property.Json({ displayName, description, required });
}

function using<R extends boolean>({
	required,
	displayName = 'Vector Name',
	description = 'Named vector to search with, e.g. "text". Leave empty for a collection with one unnamed vector. Get Collection lists the names.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function payload<R extends boolean>({
	required,
	displayName = 'Payload',
	description = 'Payload keys and values as a JSON object, e.g. {"status": "archived", "tags": ["a", "b"]}.',
}: PropParams<R>) {
	return Property.Json({ displayName, description, required });
}

function nestedKey<R extends boolean>({
	required,
	displayName = 'Nested Key',
	description = 'Payload path to write the keys under, e.g. "metadata.address". Leave empty to write at the top level.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

export const qdrantAiProps = {
	collectionName,
	pointIds,
	filter,
	withPayload,
	withVector,
	limit,
	query,
	using,
	payload,
	nestedKey,
};
