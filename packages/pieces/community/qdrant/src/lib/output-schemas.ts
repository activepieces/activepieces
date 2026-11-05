import { OutputSchema } from '@activepieces/pieces-framework';

const payloadField: OutputSchema['fields'][number] = {
	key: 'payload',
	label: 'Payload',
	dynamicKey: true,
};

const vectorField: OutputSchema['fields'][number] = {
	key: 'vector',
	label: 'Vector',
	dynamicKey: true,
};

const pointFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Point ID' },
	payloadField,
	vectorField,
];

const scoredPointFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Point ID' },
	{ key: 'score', label: 'Score', format: 'number' },
	{ key: 'version', label: 'Version', format: 'number' },
	payloadField,
];

const snapshotFields: OutputSchema['fields'] = [
	{ key: 'name', label: 'Snapshot Name' },
	{ key: 'creation_time', label: 'Created At', format: 'datetime' },
	{ key: 'size', label: 'Size', format: 'filesize' },
	{ key: 'checksum', label: 'Checksum' },
];

export const qdrantSuccessOutputSchema: OutputSchema = {
	fields: [{ key: 'success', label: 'Success', format: 'boolean' }],
};

export const qdrantUpdateResultOutputSchema: OutputSchema = {
	fields: [
		{ key: 'operation_id', label: 'Operation ID', format: 'number' },
		{ key: 'status', label: 'Status' },
	],
};

export const qdrantCollectionExistsOutputSchema: OutputSchema = {
	fields: [{ key: 'exists', label: 'Exists', format: 'boolean' }],
};

export const qdrantListCollectionsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'collections',
			label: 'Collections',
			labelKey: 'name',
			listItems: [{ key: 'name', label: 'Collection Name' }],
		},
	],
};

export const qdrantGetCollectionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'status', label: 'Status' },
		{ key: 'optimizer_status', label: 'Optimizer Status' },
		{ key: 'points_count', label: 'Points Count', format: 'number' },
		{ key: 'indexed_vectors_count', label: 'Indexed Vectors Count', format: 'number' },
		{ key: 'segments_count', label: 'Segments Count', format: 'number' },
		{
			key: 'config',
			label: 'Configuration',
			children: [
				{
					key: 'params',
					label: 'Parameters',
					children: [
						{ key: 'vectors', label: 'Vectors', dynamicKey: true },
						{ key: 'sparse_vectors', label: 'Sparse Vectors', dynamicKey: true },
						{ key: 'shard_number', label: 'Shard Number', format: 'number' },
						{ key: 'replication_factor', label: 'Replication Factor', format: 'number' },
						{
							key: 'write_consistency_factor',
							label: 'Write Consistency Factor',
							format: 'number',
						},
						{ key: 'on_disk_payload', label: 'On-Disk Payload', format: 'boolean' },
					],
				},
				{ key: 'hnsw_config', label: 'HNSW Config', dynamicKey: true },
				{ key: 'optimizer_config', label: 'Optimizer Config', dynamicKey: true },
				{ key: 'wal_config', label: 'WAL Config', dynamicKey: true },
				{ key: 'quantization_config', label: 'Quantization Config' },
			],
		},
		{ key: 'payload_schema', label: 'Payload Indexes', dynamicKey: true },
	],
};

export const qdrantListAliasesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'aliases',
			label: 'Aliases',
			labelKey: 'alias_name',
			listItems: [
				{ key: 'alias_name', label: 'Alias Name' },
				{ key: 'collection_name', label: 'Collection Name' },
			],
		},
	],
};

export const qdrantCreateSnapshotOutputSchema: OutputSchema = {
	fields: snapshotFields,
};

export const qdrantListSnapshotsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'snapshots', label: 'Snapshots', labelKey: 'name', listItems: snapshotFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const qdrantGetPointsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'points', label: 'Points', labelKey: 'id', listItems: pointFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const qdrantScrollPointsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'points', label: 'Points', labelKey: 'id', listItems: pointFields },
		{ key: 'next_page_offset', label: 'Next Page Offset' },
	],
};

export const qdrantCountPointsOutputSchema: OutputSchema = {
	fields: [{ key: 'count', label: 'Count', format: 'number' }],
};

export const qdrantQueryPointsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'points',
			label: 'Points',
			labelKey: 'id',
			listItems: [...scoredPointFields, vectorField],
		},
	],
};

export const qdrantQueryPointsGroupsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'groups',
			label: 'Groups',
			labelKey: 'id',
			listItems: [
				{ key: 'id', label: 'Group Value' },
				{ key: 'hits', label: 'Hits', labelKey: 'id', listItems: scoredPointFields },
			],
		},
	],
};

export const qdrantFacetPayloadOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'hits',
			label: 'Values',
			labelKey: 'value',
			listItems: [
				{ key: 'value', label: 'Value' },
				{ key: 'count', label: 'Points Count', format: 'number' },
			],
		},
	],
};

export const deleteCollectionOutputSchema: OutputSchema = {
	fields: [{ key: 'deleted', label: 'Deleted', value: '', format: 'boolean' }],
};

export const searchPointsOutputSchema: OutputSchema = {
	itemLabel: 'Point {id}',
	fields: [{ key: 'points', label: 'Points', value: '', listItems: scoredPointFields }],
};
