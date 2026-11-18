import { OutputSchema } from '@activepieces/pieces-framework';

const chatflowFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Chatflow ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'type', label: 'Type' },
	{ key: 'flowData', label: 'Flow Data (JSON)' },
	{ key: 'deployed', label: 'Deployed', format: 'boolean' },
	{ key: 'isPublic', label: 'Public', format: 'boolean' },
	{ key: 'category', label: 'Category' },
	{ key: 'apikeyid', label: 'API Key ID' },
	{ key: 'chatbotConfig', label: 'Chatbot Config (JSON)' },
	{ key: 'apiConfig', label: 'API Config (JSON)' },
	{ key: 'analytic', label: 'Analytics Config (JSON)' },
	{ key: 'speechToText', label: 'Speech To Text Config (JSON)' },
	{ key: 'textToSpeech', label: 'Text To Speech Config (JSON)' },
	{ key: 'followUpPrompts', label: 'Follow-Up Prompts Config (JSON)' },
	{ key: 'workspaceId', label: 'Workspace ID' },
	{ key: 'createdDate', label: 'Created Date', format: 'datetime' },
	{ key: 'updatedDate', label: 'Updated Date', format: 'datetime' },
];

const assistantFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Assistant ID' },
	{ key: 'type', label: 'Type' },
	{ key: 'details', label: 'Details (JSON)' },
	{ key: 'credential', label: 'Credential ID' },
	{ key: 'iconSrc', label: 'Icon', format: 'image' },
	{ key: 'workspaceId', label: 'Workspace ID' },
	{ key: 'createdDate', label: 'Created Date', format: 'datetime' },
	{ key: 'updatedDate', label: 'Updated Date', format: 'datetime' },
];

const toolFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Tool ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'description', label: 'Description' },
	{ key: 'schema', label: 'Input Schema (JSON)' },
	{ key: 'func', label: 'Function' },
	{ key: 'color', label: 'Color' },
	{ key: 'iconSrc', label: 'Icon', format: 'image' },
	{ key: 'workspaceId', label: 'Workspace ID' },
	{ key: 'createdDate', label: 'Created Date', format: 'datetime' },
	{ key: 'updatedDate', label: 'Updated Date', format: 'datetime' },
];

const variableFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Variable ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'value', label: 'Value' },
	{ key: 'type', label: 'Type' },
	{ key: 'workspaceId', label: 'Workspace ID' },
	{ key: 'createdDate', label: 'Created Date', format: 'datetime' },
	{ key: 'updatedDate', label: 'Updated Date', format: 'datetime' },
];

const loaderFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Loader ID' },
	{ key: 'loaderId', label: 'Loader Type' },
	{ key: 'loaderName', label: 'Loader Name' },
	{ key: 'loaderConfig', label: 'Loader Config', dynamicKey: true },
	{ key: 'splitterId', label: 'Splitter Type' },
	{ key: 'splitterName', label: 'Splitter Name' },
	{ key: 'splitterConfig', label: 'Splitter Config', dynamicKey: true },
	{ key: 'totalChunks', label: 'Total Chunks', format: 'number' },
	{ key: 'totalChars', label: 'Total Characters', format: 'number' },
	{ key: 'status', label: 'Status' },
];

const documentStoreBaseFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Document Store ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'description', label: 'Description' },
	{ key: 'status', label: 'Status' },
	{ key: 'whereUsed', label: 'Used By Chatflows' },
	{
		key: 'vectorStoreConfig',
		label: 'Vector Store Config',
		children: [{ key: 'name', label: 'Vector Store' }],
	},
	{
		key: 'embeddingConfig',
		label: 'Embedding Config',
		children: [{ key: 'name', label: 'Embedding Model' }],
	},
	{ key: 'recordManagerConfig', label: 'Record Manager Config' },
	{ key: 'workspaceId', label: 'Workspace ID' },
	{ key: 'createdDate', label: 'Created Date', format: 'datetime' },
	{ key: 'updatedDate', label: 'Updated Date', format: 'datetime' },
];

const documentStoreFields: OutputSchema['fields'] = [
	...documentStoreBaseFields,
	{
		key: 'loaders',
		label: 'Loaders',
		labelKey: 'loaderName',
		listItems: [...loaderFields, { key: 'source', label: 'Source' }],
	},
	{ key: 'totalChunks', label: 'Total Chunks', format: 'number' },
	{ key: 'totalChars', label: 'Total Characters', format: 'number' },
];

const documentStoreSummaryFields: OutputSchema['fields'] = [
	...documentStoreBaseFields,
	{ key: 'loaders', label: 'Loaders' },
	{ key: 'totalChunks', label: 'Total Chunks', format: 'number' },
	{ key: 'totalChars', label: 'Total Characters', format: 'number' },
];

const documentFields: OutputSchema['fields'] = [
	{ key: 'pageContent', label: 'Content' },
	{ key: 'metadata', label: 'Metadata', dynamicKey: true },
];

const refreshResultFields: OutputSchema['fields'] = [
	{ key: 'docId', label: 'Loader ID' },
	{ key: 'numAdded', label: 'Added', format: 'number' },
	{ key: 'addedDocs', label: 'Added Documents', listItems: documentFields },
];

const upsertResultFields: OutputSchema['fields'] = [
	{ key: 'docId', label: 'Loader ID' },
	{ key: 'numAdded', label: 'Added', format: 'number' },
	{ key: 'numUpdated', label: 'Updated', format: 'number' },
	{ key: 'numDeleted', label: 'Deleted', format: 'number' },
	{ key: 'numSkipped', label: 'Skipped', format: 'number' },
	{ key: 'totalKeys', label: 'Total Keys', format: 'number' },
	{ key: 'addedDocs', label: 'Added Documents', listItems: documentFields },
];

const feedbackFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Feedback ID' },
	{ key: 'rating', label: 'Rating' },
	{ key: 'content', label: 'Comment' },
	{ key: 'messageId', label: 'Message ID' },
	{ key: 'chatId', label: 'Chat ID' },
	{ key: 'chatflowid', label: 'Chatflow ID' },
	{ key: 'createdDate', label: 'Created Date', format: 'datetime' },
];

const leadFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Lead ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'email', label: 'Email', format: 'email' },
	{ key: 'phone', label: 'Phone' },
	{ key: 'chatId', label: 'Chat ID' },
	{ key: 'chatflowid', label: 'Chatflow ID' },
	{ key: 'createdDate', label: 'Created Date', format: 'datetime' },
];

export const flowiseChatflowOutputSchema: OutputSchema = { fields: chatflowFields };

export const flowiseListChatflowsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'chatflows', label: 'Chatflows', labelKey: 'name', listItems: chatflowFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const flowiseAssistantOutputSchema: OutputSchema = { fields: assistantFields };

export const flowiseListAssistantsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'assistants', label: 'Assistants', labelKey: 'id', listItems: assistantFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const flowiseToolOutputSchema: OutputSchema = { fields: toolFields };

export const flowiseListToolsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'tools', label: 'Tools', labelKey: 'name', listItems: toolFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const flowiseVariableOutputSchema: OutputSchema = { fields: variableFields };

export const flowiseListVariablesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'variables', label: 'Variables', labelKey: 'name', listItems: variableFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const flowiseDeleteResultOutputSchema: OutputSchema = {
	fields: [
		{ key: 'affected', label: 'Records Deleted', format: 'number' },
		{ key: 'raw', label: 'Raw Result' },
	],
};

export const flowiseDocumentStoreOutputSchema: OutputSchema = { fields: documentStoreFields };

export const flowiseUpdateDocumentStoreOutputSchema: OutputSchema = {
	fields: documentStoreSummaryFields,
};

export const flowiseCreateDocumentStoreOutputSchema: OutputSchema = {
	fields: [...documentStoreBaseFields, { key: 'loaders', label: 'Loaders (JSON)' }],
};

export const flowiseListDocumentStoresOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'documentStores',
			label: 'Document Stores',
			labelKey: 'name',
			listItems: documentStoreSummaryFields,
		},
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const flowiseDeleteDocumentStoreOutputSchema: OutputSchema = {
	fields: [{ key: 'deleted', label: 'Deleted', format: 'number' }],
};

export const flowiseDocumentChunksOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'chunks',
			label: 'Chunks',
			labelKey: 'chunkNo',
			listItems: [
				{ key: 'id', label: 'Chunk ID' },
				{ key: 'chunkNo', label: 'Chunk Number', format: 'number' },
				{ key: 'pageContent', label: 'Content' },
				{ key: 'metadata', label: 'Metadata (JSON)' },
				{ key: 'docId', label: 'Loader ID' },
				{ key: 'storeId', label: 'Document Store ID' },
			],
		},
		{ key: 'count', label: 'Total Chunks', format: 'number' },
		{ key: 'currentPage', label: 'Current Page', format: 'number' },
		{ key: 'characters', label: 'Total Characters', format: 'number' },
		{ key: 'docId', label: 'Loader ID' },
		{ key: 'storeName', label: 'Document Store Name' },
		{ key: 'description', label: 'Document Store Description' },
		{ key: 'file', label: 'Loader', children: loaderFields },
		{ key: 'workspaceId', label: 'Workspace ID' },
	],
};

export const flowiseUpsertDocumentOutputSchema: OutputSchema = { fields: upsertResultFields };

export const flowiseRefreshDocumentStoreOutputSchema: OutputSchema = {
	itemLabel: 'Loader {docId}',
	fields: [{ key: 'results', label: 'Loader Results', value: '', listItems: refreshResultFields }],
};

export const flowiseQueryDocumentStoreOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'docs',
			label: 'Matching Chunks',
			labelKey: 'chunkNo',
			listItems: [
				{ key: 'id', label: 'Chunk ID' },
				{ key: 'chunkNo', label: 'Chunk Number', format: 'number' },
				...documentFields,
			],
		},
		{ key: 'timeTaken', label: 'Time Taken (ms)', format: 'number' },
	],
};

export const flowiseListChatMessagesOutputSchema: OutputSchema = {
	fields: [
		{
			key: 'messages',
			label: 'Messages',
			labelKey: 'role',
			listItems: [
				{ key: 'id', label: 'Message ID' },
				{ key: 'role', label: 'Role' },
				{ key: 'content', label: 'Content' },
				{ key: 'chatId', label: 'Chat ID' },
				{ key: 'sessionId', label: 'Session ID' },
				{ key: 'chatType', label: 'Chat Type' },
				{ key: 'chatflowid', label: 'Chatflow ID' },
				{ key: 'memoryType', label: 'Memory Type' },
				{ key: 'executionId', label: 'Execution ID' },
				{ key: 'sourceDocuments', label: 'Source Documents (JSON)' },
				{ key: 'usedTools', label: 'Used Tools (JSON)' },
				{ key: 'fileAnnotations', label: 'File Annotations (JSON)' },
				{ key: 'agentReasoning', label: 'Agent Reasoning (JSON)' },
				{ key: 'reasonContent', label: 'Reasoning' },
				{ key: 'fileUploads', label: 'File Uploads (JSON)' },
				{ key: 'artifacts', label: 'Artifacts (JSON)' },
				{ key: 'action', label: 'Action (JSON)' },
				{ key: 'followUpPrompts', label: 'Follow-Up Prompts (JSON)' },
				{ key: 'execution', label: 'Execution' },
				{ key: 'leadEmail', label: 'Lead Email', format: 'email' },
				{ key: 'feedback', label: 'Feedback', children: feedbackFields },
				{ key: 'createdDate', label: 'Created Date', format: 'datetime' },
			],
		},
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const flowiseFeedbackOutputSchema: OutputSchema = { fields: feedbackFields };

export const flowiseListFeedbackOutputSchema: OutputSchema = {
	fields: [
		{ key: 'feedback', label: 'Feedback', labelKey: 'rating', listItems: feedbackFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const flowiseUpdateFeedbackOutputSchema: OutputSchema = {
	fields: [{ key: 'status', label: 'Status' }],
};

export const flowiseLeadOutputSchema: OutputSchema = { fields: leadFields };

export const flowiseListLeadsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'leads', label: 'Leads', labelKey: 'name', listItems: leadFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const flowiseCreateAttachmentsOutputSchema: OutputSchema = {
	itemLabel: '{name}',
	fields: [
		{
			key: 'attachments',
			label: 'Attachments',
			value: '',
			listItems: [
				{ key: 'name', label: 'File Name' },
				{ key: 'mimeType', label: 'MIME Type' },
				{ key: 'size', label: 'Size', format: 'filesize' },
				{ key: 'content', label: 'Content' },
			],
		},
	],
};

export const makePredictionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'text', label: 'Answer' },
		{ key: 'question', label: 'Question' },
		{ key: 'chatId', label: 'Chat ID' },
		{ key: 'chatMessageId', label: 'Message ID' },
		{ key: 'sessionId', label: 'Session ID' },
		{ key: 'memoryType', label: 'Memory Type' },
		{ key: 'isStreamValid', label: 'Streaming Available', format: 'boolean' },
	],
};
