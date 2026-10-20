import { OutputSchema } from '@activepieces/pieces-framework';

const statusFields: OutputSchema['fields'] = [
	{ key: 'ready', label: 'Ready', format: 'boolean' },
	{ key: 'state', label: 'State' },
];

const indexFields: OutputSchema['fields'] = [
	{ key: 'name', label: 'Index Name' },
	{ key: 'host', label: 'Host' },
	{ key: 'status', label: 'Status', children: statusFields },
	{
		key: 'deployment',
		label: 'Deployment',
		children: [
			{ key: 'deploymentType', label: 'Deployment Type' },
			{ key: 'cloud', label: 'Cloud' },
			{ key: 'region', label: 'Region' },
			{ key: 'environment', label: 'Environment' },
		],
	},
	{
		key: 'readCapacity',
		label: 'Read Capacity',
		children: [
			{ key: 'mode', label: 'Mode' },
			{ key: 'status', label: 'Status', children: [{ key: 'state', label: 'State' }] },
		],
	},
	{
		key: 'schema',
		label: 'Schema',
		children: [
			{
				key: 'fields',
				label: 'Fields',
				dynamicKey: true,
				children: [
					{ key: 'type', label: 'Type' },
					{ key: 'dimension', label: 'Dimension', format: 'number' },
					{ key: 'metric', label: 'Metric' },
				],
			},
		],
	},
	{ key: 'tags', label: 'Tags', dynamicKey: true },
	{ key: 'deletionProtection', label: 'Deletion Protection' },
];

const legacyIndexFields: OutputSchema['fields'] = [
	{ key: 'name', label: 'Index Name' },
	{ key: 'dimension', label: 'Dimension', format: 'number' },
	{ key: 'metric', label: 'Metric' },
	{ key: 'host', label: 'Host' },
	{ key: 'deletionProtection', label: 'Deletion Protection' },
	{ key: 'tags', label: 'Tags', dynamicKey: true },
	{
		key: 'embed',
		label: 'Embedding Model',
		children: [
			{ key: 'model', label: 'Model' },
			{ key: 'metric', label: 'Metric' },
			{ key: 'dimension', label: 'Dimension', format: 'number' },
			{ key: 'vectorType', label: 'Vector Type' },
			{ key: 'fieldMap', label: 'Field Map', dynamicKey: true },
			{ key: 'readParameters', label: 'Read Parameters', dynamicKey: true },
			{ key: 'writeParameters', label: 'Write Parameters', dynamicKey: true },
		],
	},
	{
		key: 'spec',
		label: 'Spec',
		children: [
			{
				key: 'serverless',
				label: 'Serverless',
				children: [
					{ key: 'cloud', label: 'Cloud' },
					{ key: 'region', label: 'Region' },
				],
			},
		],
	},
	{ key: 'status', label: 'Status', children: statusFields },
	{ key: 'vectorType', label: 'Vector Type' },
];

const sparseValuesFields: OutputSchema['fields'] = [
	{ key: 'indices', label: 'Indices' },
	{ key: 'values', label: 'Values' },
];

const vectorRecordFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Vector ID' },
	{ key: 'values', label: 'Values' },
	{ key: 'sparseValues', label: 'Sparse Values', children: sparseValuesFields },
	{ key: 'metadata', label: 'Metadata', dynamicKey: true },
];

const vectorMatchFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Vector ID' },
	{ key: 'score', label: 'Score', format: 'number' },
	{ key: 'values', label: 'Values' },
	{ key: 'sparseValues', label: 'Sparse Values', children: sparseValuesFields },
	{ key: 'metadata', label: 'Metadata', dynamicKey: true },
];

const readUsageField: OutputSchema['fields'][number] = {
	key: 'usage',
	label: 'Usage',
	children: [{ key: 'readUnits', label: 'Read Units', format: 'number' }],
};

const paginationField: OutputSchema['fields'][number] = {
	key: 'pagination',
	label: 'Pagination',
	children: [{ key: 'next', label: 'Next Page Token' }],
};

const namespaceBaseFields: OutputSchema['fields'] = [
	{ key: 'name', label: 'Namespace' },
	{ key: 'recordCount', label: 'Record Count' },
	{ key: 'sizeBytes', label: 'Size', format: 'filesize' },
];

const namespaceFields: OutputSchema['fields'] = [
	...namespaceBaseFields,
	{
		key: 'schema',
		label: 'Schema',
		children: [
			{
				key: 'fields',
				label: 'Filterable Fields',
				dynamicKey: true,
				children: [{ key: 'filterable', label: 'Filterable', format: 'boolean' }],
			},
		],
	},
];

const namespaceAliasFields: OutputSchema['fields'] = [
	{ key: 'name', label: 'Alias Name' },
	{ key: 'target_namespace', label: 'Target Namespace' },
	{ key: 'created_at', label: 'Created At', format: 'datetime' },
	{ key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const assistantFields: OutputSchema['fields'] = [
	{ key: 'name', label: 'Assistant Name' },
	{ key: 'instructions', label: 'Instructions' },
	{ key: 'metadata', label: 'Metadata', dynamicKey: true },
	{ key: 'status', label: 'Status' },
	{ key: 'host', label: 'Host', format: 'url' },
	{ key: 'region', label: 'Region' },
	{ key: 'createdAt', label: 'Created At', format: 'datetime' },
	{ key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const assistantFileFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'File ID' },
	{ key: 'name', label: 'File Name' },
	{ key: 'size', label: 'Size', format: 'filesize' },
	{ key: 'metadata', label: 'Metadata', dynamicKey: true },
	{ key: 'status', label: 'Status' },
	{ key: 'multimodal', label: 'Multimodal', format: 'boolean' },
	{ key: 'createdOn', label: 'Created On', format: 'datetime' },
	{ key: 'updatedOn', label: 'Updated On', format: 'datetime' },
];

const assistantFileWithUrlFields: OutputSchema['fields'] = [
	...assistantFileFields,
	{ key: 'signedUrl', label: 'Download URL', format: 'url' },
];

const assistantOperationFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Operation ID' },
	{ key: 'operationType', label: 'Operation Type' },
	{ key: 'fileId', label: 'File ID' },
	{ key: 'status', label: 'Status' },
	{ key: 'percentComplete', label: 'Percent Complete', format: 'number' },
	{ key: 'createdOn', label: 'Created On', format: 'datetime' },
];

const assistantFinishedOperationFields: OutputSchema['fields'] = [
	...assistantOperationFields,
	{ key: 'completedOn', label: 'Completed On', format: 'datetime' },
	{ key: 'ingestionUnits', label: 'Ingestion Units', format: 'number' },
];

const tokenUsageField: OutputSchema['fields'][number] = {
	key: 'usage',
	label: 'Usage',
	children: [
		{ key: 'promptTokens', label: 'Prompt Tokens', format: 'number' },
		{ key: 'completionTokens', label: 'Completion Tokens', format: 'number' },
		{ key: 'totalTokens', label: 'Total Tokens', format: 'number' },
	],
};

const messageField: OutputSchema['fields'][number] = {
	key: 'message',
	label: 'Message',
	children: [
		{ key: 'role', label: 'Role' },
		{ key: 'content', label: 'Content' },
	],
};

const importFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Import ID' },
	{ key: 'uri', label: 'Storage URI' },
	{ key: 'status', label: 'Status' },
	{ key: 'percentComplete', label: 'Percent Complete', format: 'number' },
	{ key: 'recordsImported', label: 'Records Imported', format: 'number' },
	{ key: 'error', label: 'Error' },
	{ key: 'createdAt', label: 'Created At', format: 'datetime' },
	{ key: 'finishedAt', label: 'Finished At', format: 'datetime' },
];

const modelFields: OutputSchema['fields'] = [
	{ key: 'model', label: 'Model' },
	{ key: 'shortDescription', label: 'Description' },
	{ key: 'type', label: 'Type' },
	{ key: 'vectorType', label: 'Vector Type' },
	{ key: 'defaultDimension', label: 'Default Dimension', format: 'number' },
	{ key: 'modality', label: 'Modality' },
	{ key: 'maxSequenceLength', label: 'Max Sequence Length', format: 'number' },
	{ key: 'maxBatchSize', label: 'Max Batch Size', format: 'number' },
	{ key: 'providerName', label: 'Provider' },
	{ key: 'supportedDimensions', label: 'Supported Dimensions' },
	{ key: 'supportedMetrics', label: 'Supported Metrics' },
	{
		key: 'supportedParameters',
		label: 'Supported Parameters',
		labelKey: 'parameter',
		listItems: [
			{ key: 'parameter', label: 'Parameter' },
			{ key: 'type', label: 'Type' },
			{ key: 'valueType', label: 'Value Type' },
			{ key: 'required', label: 'Required', format: 'boolean' },
			{ key: 'allowedValues', label: 'Allowed Values' },
			{ key: '_default', label: 'Default' },
			{ key: 'min', label: 'Min', format: 'number' },
			{ key: 'max', label: 'Max', format: 'number' },
		],
	},
];

const legacyResultFields: OutputSchema['fields'] = [
	{ key: 'success', label: 'Success', format: 'boolean' },
	{ key: 'error', label: 'Error' },
	{ key: 'message', label: 'Message' },
];

export const pineconeListIndexesOutputSchema: OutputSchema = {
	fields: [{ key: 'indexes', label: 'Indexes', labelKey: 'name', listItems: indexFields }],
};

export const pineconeGetIndexOutputSchema: OutputSchema = { fields: indexFields };

export const pineconeCreateIndexOutputSchema: OutputSchema = { fields: indexFields };

export const pineconeCreateIndexForModelOutputSchema: OutputSchema = { fields: indexFields };

export const pineconeConfigureIndexOutputSchema: OutputSchema = { fields: indexFields };

export const pineconeDeleteIndexOutputSchema: OutputSchema = {
	fields: [
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
		{ key: 'indexName', label: 'Index Name' },
	],
};

export const pineconeGetIndexStatsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'namespaces',
			label: 'Namespaces',
			dynamicKey: true,
			children: [{ key: 'recordCount', label: 'Record Count', format: 'number' }],
		},
		{ key: 'dimension', label: 'Dimension', format: 'number' },
		{ key: 'indexFullness', label: 'Index Fullness', format: 'number' },
		{ key: 'totalRecordCount', label: 'Total Record Count', format: 'number' },
	],
};

export const pineconeUpsertTextRecordsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'upsertedCount', label: 'Upserted Count', format: 'number' },
		{ key: 'ids', label: 'IDs' },
	],
};

export const pineconeFetchVectorsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'records',
			label: 'Records',
			dynamicKey: true,
			labelKey: 'id',
			children: vectorRecordFields,
		},
		{ key: 'namespace', label: 'Namespace' },
		readUsageField,
	],
};

export const pineconeFetchVectorsByMetadataOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'records',
			label: 'Records',
			dynamicKey: true,
			labelKey: 'id',
			children: vectorRecordFields,
		},
		{ key: 'namespace', label: 'Namespace' },
		readUsageField,
		paginationField,
	],
};

export const pineconeListVectorIdsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'vectors',
			label: 'Vectors',
			labelKey: 'id',
			listItems: [{ key: 'id', label: 'Vector ID' }],
		},
		{ key: 'namespace', label: 'Namespace' },
		readUsageField,
		paginationField,
	],
};

export const pineconeUpdateVectorOutputSchema: OutputSchema = {
	fields: [
		{ key: 'updated', label: 'Updated', format: 'boolean' },
		{ key: 'id', label: 'Vector ID' },
		{ key: 'filter', label: 'Filter' },
	],
};

export const pineconeDeleteVectorsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
		{ key: 'mode', label: 'Mode' },
		{ key: 'ids', label: 'IDs' },
		{ key: 'filter', label: 'Filter' },
		{ key: 'namespace', label: 'Namespace' },
	],
};

export const pineconeQueryVectorsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'matches', label: 'Matches', labelKey: 'id', listItems: vectorMatchFields },
		{ key: 'namespace', label: 'Namespace' },
		readUsageField,
	],
};

export const pineconeListNamespacesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'namespaces', label: 'Namespaces', labelKey: 'name', listItems: namespaceFields },
		{ key: 'totalCount', label: 'Total Count', format: 'number' },
		paginationField,
	],
};

export const pineconeCreateNamespaceOutputSchema: OutputSchema = { fields: namespaceFields };

export const pineconeGetNamespaceOutputSchema: OutputSchema = { fields: namespaceBaseFields };

export const pineconeDeleteNamespaceOutputSchema: OutputSchema = {
	fields: [
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
		{ key: 'namespace', label: 'Namespace' },
	],
};

export const pineconeListNamespaceAliasesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'namespace_aliases',
			label: 'Namespace Aliases',
			labelKey: 'name',
			listItems: namespaceAliasFields,
		},
		{ key: 'total_count', label: 'Total Count', format: 'number' },
		paginationField,
	],
};

export const pineconeCreateNamespaceAliasOutputSchema: OutputSchema = {
	fields: namespaceAliasFields,
};

export const pineconeDeleteNamespaceAliasOutputSchema: OutputSchema = {
	fields: [
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
		{ key: 'aliasName', label: 'Alias Name' },
	],
};

export const pineconeUpsertDocumentsOutputSchema: OutputSchema = {
	fields: [{ key: 'upsertedCount', label: 'Upserted Count', format: 'number' }],
};

export const pineconeFetchDocumentsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'documents',
			label: 'Documents',
			dynamicKey: true,
			labelKey: '_id',
			children: [{ key: '_id', label: 'Document ID' }],
		},
		{ key: 'namespace', label: 'Namespace' },
		readUsageField,
		paginationField,
	],
};

export const pineconeListDocumentsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'documents',
			label: 'Documents',
			labelKey: '_id',
			listItems: [{ key: '_id', label: 'Document ID' }],
		},
		{ key: 'namespace', label: 'Namespace' },
		readUsageField,
		paginationField,
	],
};

export const pineconeSearchDocumentsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'matches',
			label: 'Matches',
			labelKey: '_id',
			listItems: [
				{ key: '_id', label: 'Document ID' },
				{ key: '_score', label: 'Score', format: 'number' },
				{ key: 'fields', label: 'Document Fields', value: '', dynamicKey: true },
			],
		},
		{ key: 'namespace', label: 'Namespace' },
		readUsageField,
	],
};

export const pineconeUpdateDocumentsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'updated', label: 'Updated', format: 'boolean' },
		{ key: 'ids', label: 'IDs' },
		{ key: 'filter', label: 'Filter' },
		{ key: 'matchedRecords', label: 'Matched Records', format: 'number' },
	],
};

export const pineconeDeleteDocumentsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
		{ key: 'mode', label: 'Mode' },
		{ key: 'ids', label: 'IDs' },
		{ key: 'filter', label: 'Filter' },
		{ key: 'namespace', label: 'Namespace' },
		{ key: 'matchedRecords', label: 'Matched Records', format: 'number' },
	],
};

export const pineconeSearchTextRecordsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'result',
			label: 'Result',
			children: [
				{
					key: 'hits',
					label: 'Hits',
					labelKey: '_id',
					listItems: [
						{ key: '_id', label: 'Record ID' },
						{ key: '_score', label: 'Score', format: 'number' },
						{ key: 'fields', label: 'Fields', dynamicKey: true },
					],
				},
			],
		},
		{
			key: 'usage',
			label: 'Usage',
			children: [
				{ key: 'readUnits', label: 'Read Units', format: 'number' },
				{ key: 'embedTotalTokens', label: 'Embedding Tokens', format: 'number' },
				{ key: 'rerankUnits', label: 'Rerank Units', format: 'number' },
			],
		},
	],
};

export const pineconeStartImportOutputSchema: OutputSchema = {
	fields: [{ key: 'id', label: 'Import ID' }],
};

export const pineconeListImportsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'data', label: 'Imports', labelKey: 'id', listItems: importFields },
		paginationField,
	],
};

export const pineconeGetImportOutputSchema: OutputSchema = { fields: importFields };

export const pineconeCancelImportOutputSchema: OutputSchema = {
	fields: [
		{ key: 'cancelled', label: 'Cancelled', format: 'boolean' },
		{ key: 'importId', label: 'Import ID' },
	],
};

export const pineconeGenerateEmbeddingsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'model', label: 'Model' },
		{ key: 'vectorType', label: 'Vector Type' },
		{
			key: 'data',
			label: 'Embeddings',
			listItems: [
				{ key: 'vectorType', label: 'Vector Type' },
				{ key: 'values', label: 'Values' },
				{ key: 'sparseIndices', label: 'Sparse Indices' },
				{ key: 'sparseValues', label: 'Sparse Values' },
			],
		},
		{
			key: 'usage',
			label: 'Usage',
			children: [{ key: 'totalTokens', label: 'Total Tokens', format: 'number' }],
		},
	],
};

export const pineconeRerankDocumentsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'model', label: 'Model' },
		{
			key: 'data',
			label: 'Ranked Documents',
			labelKey: 'index',
			listItems: [
				{ key: 'index', label: 'Input Position', format: 'number' },
				{ key: 'score', label: 'Score', format: 'number' },
				{ key: 'document', label: 'Document', dynamicKey: true },
			],
		},
		{
			key: 'usage',
			label: 'Usage',
			children: [{ key: 'rerankUnits', label: 'Rerank Units', format: 'number' }],
		},
	],
};

export const pineconeListModelsOutputSchema: OutputSchema = {
	fields: [{ key: 'models', label: 'Models', labelKey: 'model', listItems: modelFields }],
};

export const pineconeGetModelOutputSchema: OutputSchema = { fields: modelFields };

export const pineconeListAssistantsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'assistants', label: 'Assistants', labelKey: 'name', listItems: assistantFields },
	],
};

export const pineconeCreateAssistantOutputSchema: OutputSchema = { fields: assistantFields };

export const pineconeUpdateAssistantOutputSchema: OutputSchema = {
	fields: [
		{ key: 'instructions', label: 'Instructions' },
		{ key: 'metadata', label: 'Metadata', dynamicKey: true },
	],
};

export const pineconeDeleteAssistantOutputSchema: OutputSchema = {
	fields: [
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
		{ key: 'assistantName', label: 'Assistant Name' },
	],
};

export const pineconeChatWithAssistantOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Response ID' },
		messageField,
		{ key: 'finishReason', label: 'Finish Reason' },
		{ key: 'model', label: 'Model' },
		{
			key: 'citations',
			label: 'Citations',
			labelKey: 'position',
			listItems: [
				{ key: 'position', label: 'Position', format: 'number' },
				{
					key: 'references',
					label: 'References',
					listItems: [
						{ key: 'file', label: 'File', children: assistantFileWithUrlFields },
						{ key: 'pages', label: 'Pages' },
						{
							key: 'highlight',
							label: 'Highlight',
							children: [
								{ key: 'type', label: 'Type' },
								{ key: 'content', label: 'Content' },
							],
						},
					],
				},
			],
		},
		{ key: 'contextSnippetCount', label: 'Context Snippet Count', format: 'number' },
		{ key: 'contentFilterResults', label: 'Content Filter Results' },
		tokenUsageField,
	],
};

export const pineconeChatCompletionWithAssistantOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Response ID' },
		{
			key: 'choices',
			label: 'Choices',
			labelKey: 'index',
			listItems: [
				{ key: 'index', label: 'Index', format: 'number' },
				messageField,
				{ key: 'finishReason', label: 'Finish Reason' },
			],
		},
		{ key: 'model', label: 'Model' },
		tokenUsageField,
	],
};

export const pineconeRetrieveAssistantContextOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Response ID' },
		{
			key: 'snippets',
			label: 'Snippets',
			listItems: [
				{ key: 'type', label: 'Type' },
				{ key: 'content', label: 'Content' },
				{ key: 'score', label: 'Score', format: 'number' },
				{
					key: 'reference',
					label: 'Reference',
					children: [
						{ key: 'type', label: 'Type' },
						{ key: 'file', label: 'File', children: assistantFileWithUrlFields },
					],
				},
			],
		},
		tokenUsageField,
	],
};

export const pineconeListAssistantFilesOutputSchema: OutputSchema = {
	fields: [{ key: 'files', label: 'Files', labelKey: 'name', listItems: assistantFileFields }],
};

export const pineconeGetAssistantFileOutputSchema: OutputSchema = {
	fields: assistantFileWithUrlFields,
};

export const pineconeDeleteAssistantFileOutputSchema: OutputSchema = {
	fields: assistantOperationFields,
};

export const pineconeListAssistantOperationsOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'operations',
			label: 'Operations',
			labelKey: 'id',
			listItems: assistantFinishedOperationFields,
		},
		paginationField,
	],
};

export const pineconeGetAssistantOperationOutputSchema: OutputSchema = {
	fields: assistantFinishedOperationFields,
};

export const createIndexOutputSchema: OutputSchema = {
	fields: [
		{ key: 'success', label: 'Success', format: 'boolean' },
		{ key: 'message', label: 'Message' },
		{ key: 'indexName', label: 'Index Name' },
		{ key: 'dimension', label: 'Dimension', format: 'number' },
		{ key: 'indexType', label: 'Index Type' },
		{
			key: 'spec',
			label: 'Spec',
			children: [
				{
					key: 'serverless',
					label: 'Serverless',
					children: [
						{ key: 'cloud', label: 'Cloud' },
						{ key: 'region', label: 'Region' },
					],
				},
			],
		},
		{ key: 'metric', label: 'Metric' },
		{ key: 'vectorType', label: 'Vector Type' },
		{ key: 'tags', label: 'Tags', dynamicKey: true },
		{ key: 'response', label: 'Index', children: legacyIndexFields },
	],
};

export const upsertVectorOutputSchema: OutputSchema = {
	fields: [
		...legacyResultFields,
		{ key: 'indexName', label: 'Index Name' },
		{ key: 'namespace', label: 'Namespace' },
		{ key: 'upsertedCount', label: 'Upserted Count', format: 'number' },
		{ key: 'vectorCount', label: 'Vector Count', format: 'number' },
		{
			key: 'vectors',
			label: 'Vectors',
			labelKey: 'id',
			listItems: [
				{ key: 'id', label: 'Vector ID' },
				{ key: 'dimension', label: 'Dimension', format: 'number' },
			],
		},
	],
};

export const updateVectorOutputSchema: OutputSchema = {
	fields: [
		...legacyResultFields,
		{ key: 'indexName', label: 'Index Name' },
		{ key: 'namespace', label: 'Namespace' },
		{ key: 'vectorId', label: 'Vector ID' },
		{
			key: 'updatedFields',
			label: 'Updated Fields',
			children: [
				{ key: 'values', label: 'Values' },
				{ key: 'sparseValues', label: 'Sparse Values' },
				{ key: 'metadata', label: 'Metadata' },
			],
		},
	],
};

export const getVectorOutputSchema: OutputSchema = {
	fields: [
		...legacyResultFields,
		{ key: 'indexName', label: 'Index Name' },
		{ key: 'namespace', label: 'Namespace' },
		{
			key: 'vectors',
			label: 'Vectors',
			dynamicKey: true,
			labelKey: 'id',
			children: vectorRecordFields,
		},
		{
			key: 'summary',
			label: 'Summary',
			children: [
				{ key: 'requested', label: 'Requested', format: 'number' },
				{ key: 'found', label: 'Found', format: 'number' },
				{ key: 'foundIds', label: 'Found IDs' },
			],
		},
		readUsageField,
		{ key: 'requestedIds', label: 'Requested IDs' },
	],
};

export const deleteVectorOutputSchema: OutputSchema = {
	fields: [
		...legacyResultFields,
		{ key: 'indexName', label: 'Index Name' },
		{ key: 'namespace', label: 'Namespace' },
		{ key: 'deleteMode', label: 'Delete Mode' },
		{ key: 'operation', label: 'Operation' },
		{ key: 'deletedCount', label: 'Deleted Count', format: 'number' },
	],
};

export const searchVectorOutputSchema: OutputSchema = {
	fields: [
		...legacyResultFields,
		{ key: 'indexName', label: 'Index Name' },
		{ key: 'namespace', label: 'Namespace' },
		{ key: 'matches', label: 'Matches', labelKey: 'id', listItems: vectorMatchFields },
		readUsageField,
		{
			key: 'query',
			label: 'Query',
			children: [
				{ key: 'topK', label: 'Top K', format: 'number' },
				{ key: 'method', label: 'Method' },
				{ key: 'queryId', label: 'Query Vector ID' },
				{ key: 'vectorDimension', label: 'Vector Dimension', format: 'number' },
				{ key: 'filter', label: 'Filter' },
			],
		},
		{
			key: 'summary',
			label: 'Summary',
			children: [
				{ key: 'matchCount', label: 'Match Count', format: 'number' },
				{ key: 'topScore', label: 'Top Score', format: 'number' },
				{ key: 'readUnits', label: 'Read Units', format: 'number' },
			],
		},
	],
};

export const searchIndexOutputSchema: OutputSchema = {
	fields: [
		...legacyResultFields,
		{ key: 'mode', label: 'Mode' },
		{ key: 'searchTerm', label: 'Search Term' },
		{ key: 'found', label: 'Found', format: 'boolean' },
		{ key: 'index', label: 'Index', children: legacyIndexFields },
		{ key: 'filter', label: 'Name Filter' },
		{ key: 'indexes', label: 'Indexes', labelKey: 'name', listItems: legacyIndexFields },
		{ key: 'totalCount', label: 'Total Count', format: 'number' },
		{ key: 'filteredCount', label: 'Filtered Count', format: 'number' },
		{
			key: 'summary',
			label: 'Summary',
			children: [
				{ key: 'total', label: 'Total', format: 'number' },
				{ key: 'returned', label: 'Returned', format: 'number' },
				{ key: 'filtered', label: 'Filtered', format: 'boolean' },
			],
		},
	],
};
