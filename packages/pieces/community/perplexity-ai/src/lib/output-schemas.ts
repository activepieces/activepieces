import { OutputSchema } from '@activepieces/pieces-framework';

const tokenUsageFields: OutputSchema['fields'] = [
  { key: 'input_tokens', label: 'Input Tokens', format: 'number' },
  {
    key: 'input_tokens_details',
    label: 'Input Token Details',
    children: [
      { key: 'cached_tokens', label: 'Cached Tokens', format: 'number' },
    ],
  },
  { key: 'output_tokens', label: 'Output Tokens', format: 'number' },
  {
    key: 'output_tokens_details',
    label: 'Output Token Details',
    children: [
      { key: 'reasoning_tokens', label: 'Reasoning Tokens', format: 'number' },
    ],
  },
  { key: 'total_tokens', label: 'Total Tokens', format: 'number' },
];

const batchFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Batch ID' },
  { key: 'object', label: 'Object Type' },
  { key: 'status', label: 'Status' },
  { key: 'endpoint', label: 'Endpoint' },
  { key: 'input_file_id', label: 'Input File ID' },
  { key: 'output_file_id', label: 'Output File ID' },
  { key: 'error_file_id', label: 'Error File ID' },
  { key: 'completion_window', label: 'Completion Window' },
  {
    key: 'request_counts',
    label: 'Request Counts',
    children: [
      { key: 'total', label: 'Total', format: 'number' },
      { key: 'completed', label: 'Completed', format: 'number' },
      { key: 'failed', label: 'Failed', format: 'number' },
    ],
  },
  { key: 'errors', label: 'Errors' },
  { key: 'metadata', label: 'Metadata', dynamicKey: true },
  { key: 'usage', label: 'Usage', children: tokenUsageFields },
  { key: 'created_at', label: 'Created At (Unix Seconds)', format: 'number' },
  {
    key: 'in_progress_at',
    label: 'In Progress At (Unix Seconds)',
    format: 'number',
  },
  {
    key: 'finalizing_at',
    label: 'Finalizing At (Unix Seconds)',
    format: 'number',
  },
  {
    key: 'completed_at',
    label: 'Completed At (Unix Seconds)',
    format: 'number',
  },
  { key: 'failed_at', label: 'Failed At (Unix Seconds)', format: 'number' },
  {
    key: 'cancelling_at',
    label: 'Cancelling At (Unix Seconds)',
    format: 'number',
  },
  {
    key: 'cancelled_at',
    label: 'Cancelled At (Unix Seconds)',
    format: 'number',
  },
  { key: 'expires_at', label: 'Expires At (Unix Seconds)', format: 'number' },
  { key: 'expired_at', label: 'Expired At (Unix Seconds)', format: 'number' },
];

const batchFileFields: OutputSchema['fields'] = [
  { key: 'id', label: 'File ID' },
  { key: 'object', label: 'Object Type' },
  { key: 'filename', label: 'File Name' },
  { key: 'purpose', label: 'Purpose' },
  { key: 'bytes', label: 'Size', format: 'filesize' },
  { key: 'created_at', label: 'Created At (Unix Seconds)', format: 'number' },
  { key: 'expires_at', label: 'Expires At (Unix Seconds)', format: 'number' },
];

const pageFields: OutputSchema['fields'] = [
  { key: 'first_id', label: 'First ID' },
  { key: 'last_id', label: 'Last ID' },
  { key: 'has_more', label: 'Has More', format: 'boolean' },
  { key: 'object', label: 'Object Type' },
];

const skillFields: OutputSchema['fields'] = [
  { key: 'skill_id', label: 'Skill ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'revision', label: 'Revision' },
  { key: 'latest_revision', label: 'Latest Revision' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const searchResultFields: OutputSchema['fields'] = [
  { key: 'title', label: 'Title' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'snippet', label: 'Snippet' },
  { key: 'date', label: 'Published', format: 'date' },
  { key: 'last_updated', label: 'Last Updated', format: 'date' },
];

const embeddingUsageFields: OutputSchema['fields'] = [
  { key: 'prompt_tokens', label: 'Prompt Tokens', format: 'number' },
  { key: 'total_tokens', label: 'Total Tokens', format: 'number' },
  {
    key: 'cost',
    label: 'Cost',
    children: [
      {
        key: 'input_cost',
        label: 'Input Cost',
        format: 'currency',
        currency: 'USD',
      },
      {
        key: 'total_cost',
        label: 'Total Cost',
        format: 'currency',
        currency: 'USD',
      },
      { key: 'currency', label: 'Currency' },
    ],
  },
];

const embeddingFields: OutputSchema['fields'] = [
  { key: 'index', label: 'Index', format: 'number' },
  { key: 'embedding', label: 'Embedding (Base64)' },
  { key: 'object', label: 'Object Type' },
];

const savedFileFields: OutputSchema['fields'] = [
  { key: 'file', label: 'File', format: 'url' },
  { key: 'file_name', label: 'File Name' },
  { key: 'size', label: 'Size', format: 'filesize' },
];

export const askAiOutputSchema: OutputSchema = {
  fields: [
    { key: 'result', label: 'Answer' },
    { key: 'citations', label: 'Citations' },
  ],
};

export const perplexityAiCancelAgentResponseOutputSchema: OutputSchema = {
  fields: [
    { key: 'response_id', label: 'Response ID' },
    { key: 'status', label: 'Status' },
  ],
};

export const perplexityAiCancelBatchOutputSchema: OutputSchema = {
  fields: batchFields,
};

export const perplexityAiCreateAgentResponseOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Response ID' },
    { key: 'object', label: 'Object Type' },
    { key: 'status', label: 'Status' },
    { key: 'model', label: 'Model' },
    {
      key: 'output',
      label: 'Output',
      labelKey: 'type',
      listItems: [
        { key: 'type', label: 'Type' },
        { key: 'id', label: 'Item ID' },
        { key: 'role', label: 'Role' },
        { key: 'status', label: 'Status' },
        {
          key: 'content',
          label: 'Content',
          labelKey: 'type',
          listItems: [
            { key: 'type', label: 'Type' },
            { key: 'text', label: 'Text' },
            { key: 'annotations', label: 'Annotations' },
          ],
        },
        { key: 'queries', label: 'Search Queries' },
        {
          key: 'results',
          label: 'Search Results',
          labelKey: 'title',
          listItems: searchResultFields,
        },
      ],
    },
    { key: 'error', label: 'Error' },
    { key: 'incomplete_details', label: 'Incomplete Details' },
    { key: 'background', label: 'Background', format: 'boolean' },
    { key: 'store', label: 'Stored', format: 'boolean' },
    { key: 'previous_response_id', label: 'Previous Response ID' },
    { key: 'instructions', label: 'Instructions' },
    { key: 'max_output_tokens', label: 'Max Output Tokens', format: 'number' },
    { key: 'max_tool_calls', label: 'Max Tool Calls', format: 'number' },
    {
      key: 'tools',
      label: 'Tools',
      labelKey: 'type',
      listItems: [{ key: 'type', label: 'Type' }],
    },
    { key: 'tool_choice', label: 'Tool Choice' },
    {
      key: 'parallel_tool_calls',
      label: 'Parallel Tool Calls',
      format: 'boolean',
    },
    { key: 'reasoning', label: 'Reasoning' },
    {
      key: 'text',
      label: 'Text Format',
      children: [
        {
          key: 'format',
          label: 'Format',
          children: [{ key: 'type', label: 'Type' }],
        },
      ],
    },
    { key: 'temperature', label: 'Temperature', format: 'number' },
    { key: 'top_p', label: 'Top P', format: 'number' },
    { key: 'top_logprobs', label: 'Top Logprobs', format: 'number' },
    { key: 'frequency_penalty', label: 'Frequency Penalty', format: 'number' },
    { key: 'presence_penalty', label: 'Presence Penalty', format: 'number' },
    { key: 'truncation', label: 'Truncation' },
    { key: 'service_tier', label: 'Service Tier' },
    { key: 'prompt_cache_key', label: 'Prompt Cache Key' },
    { key: 'safety_identifier', label: 'Safety Identifier' },
    { key: 'user', label: 'User' },
    { key: 'metadata', label: 'Metadata', dynamicKey: true },
    {
      key: 'usage',
      label: 'Usage',
      children: [
        { key: 'input_tokens', label: 'Input Tokens', format: 'number' },
        {
          key: 'input_tokens_details',
          label: 'Input Token Details',
          children: [
            { key: 'cached_tokens', label: 'Cached Tokens', format: 'number' },
            {
              key: 'cache_read_input_tokens',
              label: 'Cache Read Tokens',
              format: 'number',
            },
            {
              key: 'cache_creation_input_tokens',
              label: 'Cache Write Tokens',
              format: 'number',
            },
          ],
        },
        { key: 'output_tokens', label: 'Output Tokens', format: 'number' },
        {
          key: 'output_tokens_details',
          label: 'Output Token Details',
          children: [
            {
              key: 'reasoning_tokens',
              label: 'Reasoning Tokens',
              format: 'number',
            },
          ],
        },
        { key: 'total_tokens', label: 'Total Tokens', format: 'number' },
        {
          key: 'cost',
          label: 'Cost',
          children: [
            {
              key: 'total_cost',
              label: 'Total Cost',
              format: 'currency',
              currency: 'USD',
            },
            {
              key: 'input_cost',
              label: 'Input Cost',
              format: 'currency',
              currency: 'USD',
            },
            {
              key: 'output_cost',
              label: 'Output Cost',
              format: 'currency',
              currency: 'USD',
            },
            {
              key: 'cache_creation_cost',
              label: 'Cache Write Cost',
              format: 'currency',
              currency: 'USD',
            },
            {
              key: 'tool_calls_cost',
              label: 'Tool Calls Cost',
              format: 'currency',
              currency: 'USD',
            },
            {
              key: 'tool_calls_cost_details',
              label: 'Tool Calls Cost by Tool',
              dynamicKey: true,
            },
            { key: 'currency', label: 'Currency' },
          ],
        },
        {
          key: 'tool_calls_details',
          label: 'Tool Calls by Tool',
          dynamicKey: true,
          children: [
            { key: 'invocation', label: 'Calls', format: 'number' },
            {
              key: 'cost_usd',
              label: 'Cost',
              format: 'currency',
              currency: 'USD',
            },
          ],
        },
      ],
    },
    { key: 'created_at', label: 'Created At (Unix Seconds)', format: 'number' },
    {
      key: 'completed_at',
      label: 'Completed At (Unix Seconds)',
      format: 'number',
    },
  ],
};

export const perplexityAiCreateBatchOutputSchema: OutputSchema = {
  fields: batchFields,
};

export const perplexityAiCreateContextualizedEmbeddingsOutputSchema: OutputSchema =
  {
    fields: [
      {
        key: 'data',
        label: 'Documents',
        listItems: [
          { key: 'index', label: 'Document Index', format: 'number' },
          {
            key: 'data',
            label: 'Chunk Embeddings',
            listItems: embeddingFields,
          },
          { key: 'object', label: 'Object Type' },
        ],
      },
      { key: 'model', label: 'Model' },
      { key: 'object', label: 'Object Type' },
      { key: 'usage', label: 'Usage', children: embeddingUsageFields },
    ],
  };

export const perplexityAiCreateEmbeddingsOutputSchema: OutputSchema = {
  fields: [
    { key: 'data', label: 'Embeddings', listItems: embeddingFields },
    { key: 'model', label: 'Model' },
    { key: 'object', label: 'Object Type' },
    { key: 'usage', label: 'Usage', children: embeddingUsageFields },
  ],
};

export const perplexityAiCreateSkillOutputSchema: OutputSchema = {
  fields: skillFields,
};

export const perplexityAiDeleteFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'File ID' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'object', label: 'Object Type' },
  ],
};

export const perplexityAiDeleteSkillOutputSchema: OutputSchema = {
  fields: [
    { key: 'skill_id', label: 'Skill ID' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

export const perplexityAiDownloadAgentResponseFileOutputSchema: OutputSchema = {
  fields: savedFileFields,
};

export const perplexityAiEvaluateDecisionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'answers',
      label: 'Answers',
      dynamicKey: true,
      labelKey: 'type',
      children: [
        { key: 'type', label: 'Question Type' },
        { key: 'noul', label: 'Probability of Yes', format: 'number' },
        { key: 'choice', label: 'Choice' },
        { key: 'score', label: 'Score', format: 'number' },
        { key: 'confidence', label: 'Confidence', format: 'number' },
        { key: 'probabilities', label: 'Probabilities', dynamicKey: true },
        { key: 'legend', label: 'Score Levels', dynamicKey: true },
      ],
    },
    { key: 'model', label: 'Model' },
    {
      key: 'usage',
      label: 'Usage',
      children: [
        { key: 'input_tokens', label: 'Input Tokens', format: 'number' },
        { key: 'output_tokens', label: 'Output Tokens', format: 'number' },
      ],
    },
  ],
};

export const perplexityAiGetBatchOutputSchema: OutputSchema = {
  fields: batchFields,
};

export const perplexityAiGetFileOutputSchema: OutputSchema = {
  fields: batchFileFields,
};

export const perplexityAiGetSkillDownloadUrlOutputSchema: OutputSchema = {
  fields: [
    { key: 'download_url', label: 'Download URL', format: 'url' },
    { key: 'name', label: 'Name' },
    { key: 'revision', label: 'Revision' },
  ],
};

export const perplexityAiListAgentResponseFilesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Files',
      labelKey: 'filename',
      listItems: [
        { key: 'id', label: 'File ID' },
        { key: 'filename', label: 'File Name' },
        { key: 'bytes', label: 'Size', format: 'filesize' },
        { key: 'object', label: 'Object Type' },
        {
          key: 'created_at',
          label: 'Created At (Unix Seconds)',
          format: 'number',
        },
      ],
    },
    { key: 'object', label: 'Object Type' },
  ],
};

export const perplexityAiListBatchesOutputSchema: OutputSchema = {
  fields: [
    { key: 'data', label: 'Batches', labelKey: 'id', listItems: batchFields },
    ...pageFields,
  ],
};

export const perplexityAiListFilesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Files',
      labelKey: 'filename',
      listItems: batchFileFields,
    },
    ...pageFields,
  ],
};

export const perplexityAiListModelsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Models',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'Model ID' },
        { key: 'owned_by', label: 'Provider' },
        { key: 'object', label: 'Object Type' },
        { key: 'created', label: 'Created (Unix Seconds)', format: 'number' },
        {
          key: 'pricing',
          label: 'Pricing',
          children: [
            {
              key: 'input',
              label: 'Input per 1M Tokens',
              format: 'currency',
              currency: 'USD',
            },
            {
              key: 'output',
              label: 'Output per 1M Tokens',
              format: 'currency',
              currency: 'USD',
            },
            {
              key: 'cache_read',
              label: 'Cache Read per 1M Tokens',
              format: 'currency',
              currency: 'USD',
            },
            {
              key: 'cache_write',
              label: 'Cache Write per 1M Tokens',
              format: 'currency',
              currency: 'USD',
            },
            { key: 'unit', label: 'Unit' },
          ],
        },
      ],
    },
    { key: 'object', label: 'Object Type' },
  ],
};

export const perplexityAiListSkillRevisionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'revisions',
      label: 'Revisions',
      labelKey: 'revision',
      listItems: [
        { key: 'revision', label: 'Revision' },
        { key: 'name', label: 'Name' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
      ],
    },
  ],
};

export const perplexityAiListSkillsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'skills',
      label: 'Skills',
      labelKey: 'name',
      listItems: [
        { key: 'skill_id', label: 'Skill ID' },
        { key: 'name', label: 'Name' },
        { key: 'revision', label: 'Revision' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
      ],
    },
  ],
};

export const perplexityAiSearchWebOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Search ID' },
    {
      key: 'results',
      label: 'Results',
      labelKey: 'title',
      listItems: searchResultFields,
    },
  ],
};

export const perplexityAiUpdateSkillOutputSchema: OutputSchema = {
  fields: [
    ...skillFields,
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  ],
};
