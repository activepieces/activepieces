import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const fileFields: OutputSchemaField[] = [
  { key: 'id', label: 'File ID' },
  { key: 'filename', label: 'Filename' },
  { key: 'bytes', label: 'Size', format: 'filesize' },
  { key: 'purpose', label: 'Purpose' },
  { key: 'status', label: 'Status' },
  { key: 'status_details', label: 'Status Details' },
  { key: 'created_at', label: 'Created At (Unix Seconds)' },
  { key: 'expires_at', label: 'Expires At (Unix Seconds)' },
];

const imageUsageFields: OutputSchemaField[] = [
  { key: 'input_tokens', label: 'Input Tokens', format: 'number' },
  { key: 'output_tokens', label: 'Output Tokens', format: 'number' },
  { key: 'total_tokens', label: 'Total Tokens', format: 'number' },
];

const savedImageFields: OutputSchemaField[] = [
  { key: 'url', label: 'Image URL', format: 'image' },
  { key: 'fileName', label: 'File Name' },
];

const assistantMessageFields: OutputSchemaField[] = [
  { key: 'id', label: 'Message ID' },
  { key: 'role', label: 'Role' },
  { key: 'created_at', label: 'Created At (Unix Seconds)' },
  { key: 'assistant_id', label: 'Assistant ID' },
  { key: 'thread_id', label: 'Thread ID' },
  { key: 'run_id', label: 'Run ID' },
  {
    key: 'content',
    label: 'Content',
    labelKey: 'type',
    listItems: [
      { key: 'type', label: 'Type' },
      { key: 'text', label: 'Text', children: [{ key: 'value', label: 'Value' }] },
    ],
  },
];

export const analyzeSentimentActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'sentiment', label: 'Sentiment' },
    { key: 'confidence', label: 'Confidence', format: 'number' },
    { key: 'explanation', label: 'Explanation' },
  ],
};

export const classifyTextActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'flagged', label: 'Flagged', format: 'boolean' },
    { key: 'categories', label: 'Categories', dynamicKey: true },
    { key: 'category_scores', label: 'Category Scores', dynamicKey: true },
    { key: 'model', label: 'Model' },
    { key: 'id', label: 'Moderation ID' },
  ],
};

export const createEmbeddingActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'model', label: 'Model' },
    { key: 'embedding', label: 'Embedding' },
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

export const searchEmbeddingsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'bestMatch',
      label: 'Best Match',
      children: [
        { key: 'document', label: 'Document' },
        { key: 'index', label: 'Index', format: 'number' },
        { key: 'score', label: 'Score', format: 'number' },
      ],
    },
    {
      key: 'results',
      label: 'Results',
      labelKey: 'document',
      listItems: [
        { key: 'document', label: 'Document' },
        { key: 'index', label: 'Index', format: 'number' },
        { key: 'score', label: 'Score', format: 'number' },
      ],
    },
    {
      key: 'usage',
      label: 'Usage',
      children: [{ key: 'total_tokens', label: 'Total Tokens', format: 'number' }],
    },
  ],
};

export const deleteFileActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'File ID' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

export const findFileActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'count', label: 'Match Count', format: 'number' },
    { key: 'file', label: 'File', children: fileFields },
    { key: 'files', label: 'Files', labelKey: 'filename', listItems: fileFields },
  ],
};

export const listFilesActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'files', label: 'Files', labelKey: 'filename', listItems: fileFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const uploadFileActionOutputSchema: OutputSchema = { fields: fileFields };

export const listModelsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'models',
      label: 'Models',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'Model ID' },
        { key: 'created', label: 'Created (Unix Seconds)' },
        { key: 'owned_by', label: 'Owned By' },
      ],
    },
  ],
};

export const generateImageActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'created', label: 'Created At (Unix Seconds)' },
    { key: 'background', label: 'Background' },
    { key: 'output_format', label: 'Output Format' },
    { key: 'quality', label: 'Quality' },
    { key: 'size', label: 'Size' },
    { key: 'usage', label: 'Usage', children: imageUsageFields },
    {
      key: 'images',
      label: 'Images',
      labelKey: 'fileName',
      listItems: [...savedImageFields, { key: 'revised_prompt', label: 'Revised Prompt' }],
    },
  ],
};

export const editImageActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'created', label: 'Created At (Unix Seconds)' },
    { key: 'background', label: 'Background' },
    { key: 'output_format', label: 'Output Format' },
    { key: 'quality', label: 'Quality' },
    { key: 'size', label: 'Size' },
    { key: 'usage', label: 'Usage', children: imageUsageFields },
    { key: 'images', label: 'Images', labelKey: 'fileName', listItems: savedImageFields },
  ],
};

export const transcribeActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'text', label: 'Text' },
    {
      key: 'usage',
      label: 'Usage',
      children: [
        { key: 'type', label: 'Type' },
        { key: 'seconds', label: 'Seconds', format: 'number' },
      ],
    },
  ],
};

export const translateActionOutputSchema: OutputSchema = {
  fields: [{ key: 'text', label: 'Text' }],
};

export const askAssistantActionOutputSchema: OutputSchema = {
  itemLabel: '{role}',
  fields: [
    {
      key: 'messages',
      label: 'Messages',
      value: '',
      labelKey: 'role',
      listItems: assistantMessageFields,
    },
  ],
};
