import { OutputSchema } from '@activepieces/pieces-framework';

const tokenUsageFields: OutputSchema['fields'] = [
	{ key: 'prompt_tokens', label: 'Prompt Tokens', format: 'number' },
	{ key: 'completion_tokens', label: 'Completion Tokens', format: 'number' },
	{ key: 'total_tokens', label: 'Total Tokens', format: 'number' },
];

const moderationFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Moderation ID' },
	{ key: 'model', label: 'Model' },
	{ key: 'any_flagged', label: 'Any Flagged', format: 'boolean' },
	{
		key: 'results',
		label: 'Results',
		labelKey: 'input',
		listItems: [
			{ key: 'input', label: 'Input' },
			{ key: 'flagged', label: 'Flagged', format: 'boolean' },
			{ key: 'flagged_categories', label: 'Flagged Categories' },
			{ key: 'categories', label: 'Categories', dynamicKey: true },
			{ key: 'category_scores', label: 'Category Scores', dynamicKey: true },
		],
	},
];

const modelFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Model ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'description', label: 'Description' },
	{ key: 'type', label: 'Type' },
	{ key: 'owned_by', label: 'Owned By' },
	{ key: 'max_context_length', label: 'Max Context Length', format: 'number' },
	{ key: 'aliases', label: 'Aliases' },
	{ key: 'deprecation', label: 'Deprecation Date', format: 'datetime' },
	{ key: 'default_model_temperature', label: 'Default Temperature', format: 'number' },
	{ key: 'capabilities', label: 'Capabilities', dynamicKey: true },
];

const fileFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'File ID' },
	{ key: 'filename', label: 'File Name' },
	{ key: 'purpose', label: 'Purpose' },
	{ key: 'bytes', label: 'Size', format: 'filesize' },
	{ key: 'mimetype', label: 'MIME Type' },
	{ key: 'source', label: 'Source' },
	{ key: 'sample_type', label: 'Sample Type' },
	{ key: 'num_lines', label: 'Number of Lines', format: 'number' },
	{ key: 'created_at', label: 'Created At', format: 'datetime' },
	{ key: 'expires_at', label: 'Expires At', format: 'datetime' },
];

const agentFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Agent ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'description', label: 'Description' },
	{ key: 'model', label: 'Model' },
	{ key: 'instructions', label: 'Instructions' },
	{ key: 'tools', label: 'Tools' },
	{ key: 'library_ids', label: 'Library IDs' },
	{ key: 'temperature', label: 'Temperature', format: 'number' },
	{ key: 'version', label: 'Version', format: 'number' },
	{ key: 'source', label: 'Source' },
	{ key: 'created_at', label: 'Created At', format: 'datetime' },
	{ key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const conversationEntryFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Entry ID' },
	{ key: 'type', label: 'Type' },
	{ key: 'role', label: 'Role' },
	{ key: 'content', label: 'Content' },
	{ key: 'chunks', label: 'Files & References' },
	{ key: 'name', label: 'Tool Name' },
	{ key: 'arguments', label: 'Tool Arguments' },
	{ key: 'agent_id', label: 'Agent ID' },
	{ key: 'model', label: 'Model' },
	{ key: 'created_at', label: 'Created At', format: 'datetime' },
];

const conversationReplyFields: OutputSchema['fields'] = [
	{ key: 'conversation_id', label: 'Conversation ID' },
	{ key: 'reply', label: 'Reply' },
	{ key: 'outputs', label: 'Outputs', labelKey: 'type', listItems: conversationEntryFields },
	...tokenUsageFields,
];

const conversationFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Conversation ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'description', label: 'Description' },
	{ key: 'agent_id', label: 'Agent ID' },
	{ key: 'agent_version', label: 'Agent Version' },
	{ key: 'model', label: 'Model' },
	{ key: 'instructions', label: 'Instructions' },
	{ key: 'created_at', label: 'Created At', format: 'datetime' },
	{ key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const libraryFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Library ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'description', label: 'Description' },
	{ key: 'generated_description', label: 'Generated Description' },
	{ key: 'owner_type', label: 'Owner Type' },
	{ key: 'owner_id', label: 'Owner ID' },
	{ key: 'nb_documents', label: 'Number of Documents', format: 'number' },
	{ key: 'total_size', label: 'Total Size', format: 'filesize' },
	{ key: 'chunk_size', label: 'Chunk Size', format: 'number' },
	{ key: 'created_at', label: 'Created At', format: 'datetime' },
	{ key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const documentFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Document ID' },
	{ key: 'library_id', label: 'Library ID' },
	{ key: 'name', label: 'Name' },
	{ key: 'mime_type', label: 'MIME Type' },
	{ key: 'extension', label: 'Extension' },
	{ key: 'size', label: 'Size', format: 'filesize' },
	{ key: 'number_of_pages', label: 'Number of Pages', format: 'number' },
	{ key: 'summary', label: 'Summary' },
	{ key: 'process_status', label: 'Processing Status' },
	{ key: 'attributes', label: 'Attributes', dynamicKey: true },
	{ key: 'expires_at', label: 'Delete After', format: 'datetime' },
	{ key: 'created_at', label: 'Created At', format: 'datetime' },
	{ key: 'last_processed_at', label: 'Last Processed At', format: 'datetime' },
];

const generatedFileFields: OutputSchema['fields'] = [
	{ key: 'file', label: 'File', format: 'url' },
	{ key: 'file_name', label: 'File Name' },
	{ key: 'size_bytes', label: 'Size', format: 'filesize' },
];

const batchJobFields: OutputSchema['fields'] = [
	{ key: 'id', label: 'Batch Job ID' },
	{ key: 'status', label: 'Status' },
	{ key: 'endpoint', label: 'Endpoint' },
	{ key: 'model', label: 'Model' },
	{ key: 'agent_id', label: 'Agent ID' },
	{ key: 'input_files', label: 'Input File IDs' },
	{ key: 'output_file', label: 'Output File ID' },
	{ key: 'error_file', label: 'Error File ID' },
	{ key: 'total_requests', label: 'Total Requests', format: 'number' },
	{ key: 'completed_requests', label: 'Completed Requests', format: 'number' },
	{ key: 'succeeded_requests', label: 'Succeeded Requests', format: 'number' },
	{ key: 'failed_requests', label: 'Failed Requests', format: 'number' },
	{
		key: 'errors',
		label: 'Errors',
		labelKey: 'message',
		listItems: [
			{ key: 'message', label: 'Message' },
			{ key: 'count', label: 'Count', format: 'number' },
		],
	},
	{ key: 'metadata', label: 'Metadata', dynamicKey: true },
	{ key: 'outputs', label: 'Inline Outputs' },
	{ key: 'created_at', label: 'Created At', format: 'datetime' },
	{ key: 'started_at', label: 'Started At', format: 'datetime' },
	{ key: 'completed_at', label: 'Completed At', format: 'datetime' },
];

export const generateChatCompletionOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Completion ID' },
		{ key: 'model', label: 'Model' },
		{ key: 'content', label: 'Reply' },
		{ key: 'finish_reason', label: 'Finish Reason' },
		...tokenUsageFields,
	],
};

export const batchJobOutputSchema: OutputSchema = { fields: batchJobFields };

export const listBatchJobsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'jobs', label: 'Batch Jobs', labelKey: 'id', listItems: batchJobFields },
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'total', label: 'Total', format: 'number' },
	],
};

export const completeCodeFimOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Completion ID' },
		{ key: 'model', label: 'Model' },
		{ key: 'completion', label: 'Completion' },
		{ key: 'finish_reason', label: 'Finish Reason' },
		...tokenUsageFields,
	],
};

export const transcribeAudioOutputSchema: OutputSchema = {
	fields: [
		{ key: 'text', label: 'Transcript' },
		{ key: 'language', label: 'Language' },
		{ key: 'model', label: 'Model' },
		{
			key: 'segments',
			label: 'Segments',
			labelKey: 'text',
			listItems: [
				{ key: 'text', label: 'Text' },
				{ key: 'start', label: 'Start (s)', format: 'number' },
				{ key: 'end', label: 'End (s)', format: 'number' },
				{ key: 'speaker_id', label: 'Speaker' },
			],
		},
		{ key: 'prompt_audio_seconds', label: 'Audio Seconds', format: 'number' },
		{ key: 'total_tokens', label: 'Total Tokens', format: 'number' },
	],
};

export const generateSpeechOutputSchema: OutputSchema = {
	fields: [...generatedFileFields, { key: 'format', label: 'Audio Format' }],
};

export const moderateTextOutputSchema: OutputSchema = { fields: moderationFields };

export const moderateChatOutputSchema: OutputSchema = { fields: moderationFields };

export const getModelOutputSchema: OutputSchema = { fields: modelFields };

export const listModelsOutputSchema: OutputSchema = {
	fields: [{ key: 'data', label: 'Models', labelKey: 'id', listItems: modelFields }],
};

export const createEmbeddingsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'Request ID' },
		{ key: 'model', label: 'Model' },
		{
			key: 'data',
			label: 'Embeddings',
			labelKey: 'index',
			listItems: [
				{ key: 'index', label: 'Index', format: 'number' },
				{ key: 'embedding', label: 'Vector' },
			],
		},
		{
			key: 'usage',
			label: 'Usage',
			children: [
				{ key: 'prompt_tokens', label: 'Prompt Tokens', format: 'number' },
				{ key: 'total_tokens', label: 'Total Tokens', format: 'number' },
			],
		},
	],
};

export const uploadFileOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'File ID' },
		{ key: 'filename', label: 'File Name' },
		{ key: 'purpose', label: 'Purpose' },
		{ key: 'bytes', label: 'Size', format: 'filesize' },
		{ key: 'mimetype', label: 'MIME Type' },
		{ key: 'source', label: 'Source' },
		{ key: 'created_at', label: 'Created At (Unix seconds)', format: 'number' },
	],
};

export const fileOutputSchema: OutputSchema = { fields: fileFields };

export const listFilesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'files', label: 'Files', labelKey: 'filename', listItems: fileFields },
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'total', label: 'Total', format: 'number' },
	],
};

export const deleteFileOutputSchema: OutputSchema = {
	fields: [
		{ key: 'id', label: 'File ID' },
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
	],
};

export const getFileSignedUrlOutputSchema: OutputSchema = {
	fields: [
		{ key: 'file_id', label: 'File ID' },
		{ key: 'url', label: 'Download URL', format: 'url' },
		{ key: 'expires_at', label: 'Expires At', format: 'datetime' },
	],
};

export const downloadFileOutputSchema: OutputSchema = {
	fields: [
		...generatedFileFields,
		{ key: 'file_id', label: 'File ID' },
		{ key: 'mimetype', label: 'MIME Type' },
	],
};

export const agentOutputSchema: OutputSchema = { fields: agentFields };

export const listAgentsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'agents', label: 'Agents', labelKey: 'name', listItems: agentFields },
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'next_page_token', label: 'Next Page Token' },
	],
};

export const deleteAgentOutputSchema: OutputSchema = {
	fields: [
		{ key: 'agent_id', label: 'Agent ID' },
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
	],
};

export const conversationReplyOutputSchema: OutputSchema = { fields: conversationReplyFields };

export const conversationOutputSchema: OutputSchema = { fields: conversationFields };

export const listConversationsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'conversations', label: 'Conversations', labelKey: 'name', listItems: conversationFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const conversationHistoryOutputSchema: OutputSchema = {
	fields: [
		{ key: 'conversation_id', label: 'Conversation ID' },
		{ key: 'entries', label: 'Entries', labelKey: 'type', listItems: conversationEntryFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const conversationMessagesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'conversation_id', label: 'Conversation ID' },
		{ key: 'messages', label: 'Messages', labelKey: 'role', listItems: conversationEntryFields },
		{ key: 'count', label: 'Count', format: 'number' },
	],
};

export const deleteConversationOutputSchema: OutputSchema = {
	fields: [
		{ key: 'conversation_id', label: 'Conversation ID' },
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
	],
};

export const libraryOutputSchema: OutputSchema = { fields: libraryFields };

export const listLibrariesOutputSchema: OutputSchema = {
	fields: [
		{ key: 'libraries', label: 'Libraries', labelKey: 'name', listItems: libraryFields },
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'next_page_token', label: 'Next Page Token' },
	],
};

export const deleteLibraryOutputSchema: OutputSchema = {
	fields: [...libraryFields, { key: 'deleted', label: 'Deleted', format: 'boolean' }],
};

export const documentOutputSchema: OutputSchema = { fields: documentFields };

export const listLibraryDocumentsOutputSchema: OutputSchema = {
	fields: [
		{ key: 'documents', label: 'Documents', labelKey: 'name', listItems: documentFields },
		{ key: 'count', label: 'Count', format: 'number' },
		{ key: 'total', label: 'Total', format: 'number' },
		{ key: 'has_more', label: 'Has More', format: 'boolean' },
	],
};

export const documentStatusOutputSchema: OutputSchema = {
	fields: [
		{ key: 'document_id', label: 'Document ID' },
		{ key: 'process_status', label: 'Processing Status' },
		{ key: 'is_done', label: 'Done', format: 'boolean' },
		{ key: 'is_error', label: 'Error', format: 'boolean' },
	],
};

export const documentTextContentOutputSchema: OutputSchema = {
	fields: [
		{ key: 'document_id', label: 'Document ID' },
		{ key: 'text', label: 'Text' },
		{ key: 'length', label: 'Length', format: 'number' },
	],
};

export const deleteLibraryDocumentOutputSchema: OutputSchema = {
	fields: [
		{ key: 'library_id', label: 'Library ID' },
		{ key: 'document_id', label: 'Document ID' },
		{ key: 'deleted', label: 'Deleted', format: 'boolean' },
	],
};

export const reprocessDocumentOutputSchema: OutputSchema = {
	fields: [
		{ key: 'library_id', label: 'Library ID' },
		{ key: 'document_id', label: 'Document ID' },
		{ key: 'reprocessing', label: 'Reprocessing', format: 'boolean' },
	],
};
