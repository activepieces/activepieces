import { OutputSchema } from '@activepieces/pieces-framework';

export const askClaudeActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'response',
      label: 'Response',
      value: '',
    },
  ],
};

export const extractStructuredDataActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'name',
      label: 'Name',
    },
    {
      key: 'email',
      label: 'Email',
      format: 'email',
    },
    {
      key: 'phone',
      label: 'Phone',
    },
    {
      key: 'city',
      label: 'City',
    },
  ],
};

const capabilitySupportFields: OutputSchema['fields'] = [
  { key: 'supported', label: 'Supported', format: 'boolean' },
];

const modelCapabilitiesFields: OutputSchema['fields'] = [
  { key: 'batch', label: 'Batch API', children: capabilitySupportFields },
  { key: 'citations', label: 'Citations', children: capabilitySupportFields },
  { key: 'code_execution', label: 'Code Execution', children: capabilitySupportFields },
  { key: 'image_input', label: 'Image Input', children: capabilitySupportFields },
  { key: 'pdf_input', label: 'PDF Input', children: capabilitySupportFields },
  { key: 'structured_outputs', label: 'Structured Outputs', children: capabilitySupportFields },
  {
    key: 'thinking',
    label: 'Extended Thinking',
    children: [
      { key: 'supported', label: 'Supported', format: 'boolean' },
      {
        key: 'types',
        label: 'Types',
        children: [
          { key: 'adaptive', label: 'Adaptive', children: capabilitySupportFields },
          { key: 'enabled', label: 'Enabled', children: capabilitySupportFields },
        ],
      },
    ],
  },
];

const modelFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Model ID' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'max_input_tokens', label: 'Max Input Tokens', format: 'number' },
  { key: 'max_tokens', label: 'Max Output Tokens', format: 'number' },
  { key: 'capabilities', label: 'Capabilities', children: modelCapabilitiesFields },
];

const requestCountsFields: OutputSchema['fields'] = [
  { key: 'processing', label: 'Processing', format: 'number' },
  { key: 'succeeded', label: 'Succeeded', format: 'number' },
  { key: 'errored', label: 'Errored', format: 'number' },
  { key: 'canceled', label: 'Canceled', format: 'number' },
  { key: 'expired', label: 'Expired', format: 'number' },
];

const messageBatchFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Batch ID' },
  { key: 'processing_status', label: 'Status' },
  { key: 'request_counts', label: 'Request Counts', children: requestCountsFields },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'expires_at', label: 'Expires At', format: 'datetime' },
  { key: 'ended_at', label: 'Ended At', format: 'datetime' },
  { key: 'archived_at', label: 'Archived At', format: 'datetime' },
  { key: 'cancel_initiated_at', label: 'Cancel Initiated At', format: 'datetime' },
  { key: 'results_url', label: 'Results URL', format: 'url' },
];

export const listModelsActionOutputSchema: OutputSchema = {
  fields: [{ key: 'models', label: 'Models', labelKey: 'display_name', listItems: modelFields }],
};

export const getModelActionOutputSchema: OutputSchema = { fields: modelFields };

export const createMessageBatchActionOutputSchema: OutputSchema = { fields: messageBatchFields };

export const getMessageBatchActionOutputSchema: OutputSchema = { fields: messageBatchFields };

export const listMessageBatchesActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'data', label: 'Batches', labelKey: 'id', listItems: messageBatchFields },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
    { key: 'first_id', label: 'First ID' },
    { key: 'last_id', label: 'Last ID' },
  ],
};

export const cancelMessageBatchActionOutputSchema: OutputSchema = { fields: messageBatchFields };

export const deleteMessageBatchActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Batch ID' },
    { key: 'type', label: 'Type' },
  ],
};

export const getMessageBatchResultsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'results',
      label: 'Results',
      labelKey: 'custom_id',
      listItems: [
        { key: 'custom_id', label: 'Custom ID' },
        {
          key: 'result',
          label: 'Result',
          children: [
            { key: 'type', label: 'Type' },
            {
              key: 'message',
              label: 'Message',
              children: [
                { key: 'id', label: 'Message ID' },
                { key: 'model', label: 'Model' },
                { key: 'stop_reason', label: 'Stop Reason' },
                {
                  key: 'content',
                  label: 'Content',
                  listItems: [
                    { key: 'type', label: 'Type' },
                    { key: 'text', label: 'Text' },
                  ],
                },
                {
                  key: 'usage',
                  label: 'Usage',
                  children: [
                    { key: 'input_tokens', label: 'Input Tokens', format: 'number' },
                    { key: 'output_tokens', label: 'Output Tokens', format: 'number' },
                  ],
                },
              ],
            },
            {
              key: 'error',
              label: 'Error',
              children: [
                { key: 'request_id', label: 'Request ID' },
                {
                  key: 'error',
                  label: 'Error',
                  children: [
                    { key: 'type', label: 'Type' },
                    { key: 'message', label: 'Message' },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const countTokensActionOutputSchema: OutputSchema = {
  fields: [{ key: 'input_tokens', label: 'Input Tokens', format: 'number' }],
};
