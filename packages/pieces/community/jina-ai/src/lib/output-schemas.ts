import { OutputSchema } from '@activepieces/pieces-framework';

export const jinaAiCreateBatchEmbeddingsOutputSchema: OutputSchema = {
  fields: [
    { key: 'batch_id', label: 'Batch ID' },
    { key: 'status', label: 'Status' },
    { key: 'model', label: 'Model' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'expires_at', label: 'Expires At', format: 'datetime' },
  ],
};

export const jinaAiGetBatchOutputSchema: OutputSchema = {
  fields: [
    { key: 'batch_id', label: 'Batch ID' },
    { key: 'status', label: 'Status' },
    { key: 'model', label: 'Model' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'completed_at', label: 'Completed At', format: 'datetime' },
    { key: 'expires_at', label: 'Expires At', format: 'datetime' },
    { key: 'error', label: 'Error' },
  ],
};

export const jinaAiListBatchesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'batches',
      label: 'Batches',
      labelKey: 'batch_id',
      listItems: [
        { key: 'batch_id', label: 'Batch ID' },
        { key: 'status', label: 'Status' },
        { key: 'model', label: 'Model' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'completed_at', label: 'Completed At', format: 'datetime' },
        { key: 'expires_at', label: 'Expires At', format: 'datetime' },
        { key: 'error', label: 'Error' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const classifyContentOutputSchema: OutputSchema = {
  fields: [
    { key: 'label', label: 'Label' },
  ],
};

export const deepsearchQueryOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Result', value: '' },
  ],
};

export const jinaAiCreateEmbeddingsOutputSchema: OutputSchema = {
  fields: [
    { key: 'model', label: 'Model' },
    { key: 'object', label: 'Object' },
    {
      key: 'usage',
      label: 'Usage',
      children: [
        { key: 'total_tokens', label: 'Total Tokens', format: 'number' },
      ],
    },
    {
      key: 'data',
      label: 'Embeddings',
      listItems: [
        { key: 'object', label: 'Object' },
        { key: 'index', label: 'Index', format: 'number' },
        { key: 'embedding', label: 'Embedding Vector' },
      ],
    },
  ],
};

export const extractWebpageContentOutputSchema: OutputSchema = {
  fields: [
    { key: 'code', label: 'Code', format: 'number' },
    { key: 'status', label: 'Status', format: 'number' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description' },
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'content', label: 'Content' },
        { key: 'warning', label: 'Warning' },
        { key: 'metadata', label: 'Metadata' },
                { key: 'httpStatus', label: 'Http Status', format: 'number' },
        { key: 'httpStatusText', label: 'Http Status Text' },
        {
          key: 'usage',
          label: 'Usage',
          children: [
            { key: 'outputTokens', label: 'Output Tokens', format: 'number' },
            { key: 'measuredTokens', label: 'Measured Tokens', format: 'number' },
            { key: 'scaledTokens', label: 'Scaled Tokens', format: 'number' },
            { key: 'tokens', label: 'Tokens', format: 'number' },
          ],
        },
      ],
    },
    {
      key: 'meta',
      label: 'Meta',
      children: [
        {
          key: 'usage',
          label: 'Usage',
          children: [
            { key: 'outputTokens', label: 'Output Tokens', format: 'number' },
            { key: 'measuredTokens', label: 'Measured Tokens', format: 'number' },
            { key: 'scaledTokens', label: 'Scaled Tokens', format: 'number' },
            { key: 'tokens', label: 'Tokens', format: 'number' },
          ],
        },
      ],
    },
  ],
};

export const jinaAiGetModelOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'hugging_face_id', label: 'Hugging Face ID' },
    { key: 'name', label: 'Name' },
    { key: 'created', label: 'Created', format: 'number' },
    { key: 'input_modalities', label: 'Input Modalities' },
    { key: 'output_modalities', label: 'Output Modalities' },
    { key: 'quantization', label: 'Quantization' },
    { key: 'context_length', label: 'Context Length', format: 'number' },
    { key: 'max_output_length', label: 'Max Output Length', format: 'number' },
    {
      key: 'pricing',
      label: 'Pricing',
      children: [
        { key: 'prompt', label: 'Prompt' },
        { key: 'completion', label: 'Completion' },
        { key: 'image', label: 'Image' },
        { key: 'request', label: 'Request' },
        { key: 'input_cache_read', label: 'Input Cache Read' },
        { key: 'input_cache_write', label: 'Input Cache Write' },
      ],
    },
    { key: 'supported_sampling_parameters', label: 'Supported Sampling Parameters' },
    { key: 'supported_features', label: 'Supported Features' },
    { key: 'description', label: 'Description' },
    {
      key: 'datacenters',
      label: 'Datacenters',
      listItems: [
        { key: 'country_code', label: 'Country Code' },
      ],
    },
  ],
};

export const jinaAiListModelsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'models',
      label: 'Models',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'hugging_face_id', label: 'Hugging Face ID' },
        { key: 'name', label: 'Name' },
        { key: 'created', label: 'Created', format: 'number' },
        { key: 'input_modalities', label: 'Input Modalities' },
        { key: 'output_modalities', label: 'Output Modalities' },
        { key: 'quantization', label: 'Quantization' },
        { key: 'context_length', label: 'Context Length', format: 'number' },
        { key: 'max_output_length', label: 'Max Output Length', format: 'number' },
        {
          key: 'pricing',
          label: 'Pricing',
          children: [
            { key: 'prompt', label: 'Prompt' },
            { key: 'completion', label: 'Completion' },
            { key: 'image', label: 'Image' },
            { key: 'request', label: 'Request' },
            { key: 'input_cache_read', label: 'Input Cache Read' },
            { key: 'input_cache_write', label: 'Input Cache Write' },
          ],
        },
        { key: 'supported_sampling_parameters', label: 'Supported Sampling Parameters' },
        { key: 'supported_features', label: 'Supported Features' },
        { key: 'description', label: 'Description' },
        {
          key: 'datacenters',
          label: 'Datacenters',
          listItems: [
            { key: 'country_code', label: 'Country Code' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const jinaAiRerankDocumentsOutputSchema: OutputSchema = {
  fields: [
    { key: 'model', label: 'Model' },
    { key: 'object', label: 'Object' },
    {
      key: 'usage',
      label: 'Usage',
      children: [
        { key: 'total_tokens', label: 'Total Tokens', format: 'number' },
      ],
    },
    {
      key: 'results',
      label: 'Ranked Results',
      listItems: [
        { key: 'index', label: 'Index', format: 'number' },
        { key: 'relevance_score', label: 'Relevance Score', format: 'number' },
        {
          key: 'document',
          label: 'Document',
          children: [
            { key: 'text', label: 'Text' },
          ],
        },
      ],
    },
  ],
};

export const webSearchSummarizationOutputSchema: OutputSchema = {
  fields: [
    { key: 'code', label: 'Code', format: 'number' },
    { key: 'status', label: 'Status', format: 'number' },
    {
      key: 'data',
      label: 'Data',
      labelKey: 'title',
      listItems: [
        { key: 'title', label: 'Title' },
        { key: 'url', label: 'URL', format: 'url' },
        { key: 'description', label: 'Description' },
        { key: 'content', label: 'Content' },
        {
          key: 'usage',
          label: 'Usage',
          children: [
            { key: 'tokens', label: 'Tokens', format: 'number' },
          ],
        },
        { key: 'date', label: 'Date' },
      ],
    },
    {
      key: 'meta',
      label: 'Meta',
      children: [
        {
          key: 'usage',
          label: 'Usage',
          children: [
            { key: 'tokens', label: 'Tokens', format: 'number' },
          ],
        },
      ],
    },
  ],
};
