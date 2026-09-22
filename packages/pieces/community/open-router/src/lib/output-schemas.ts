import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

export const askLmmActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'response',
      label: 'Response',
      value: '',
      description: 'The LLM\'s generated text response.',
    },
  ],
};

const modelSummaryListItems: OutputSchemaField[] = [
  { key: 'id', label: 'Model ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'contextLength', label: 'Context Length', format: 'number' },
  { key: 'promptPrice', label: 'Prompt Price (per token)' },
  { key: 'completionPrice', label: 'Completion Price (per token)' },
  { key: 'supportedParameters', label: 'Supported Parameters' },
];

export const listModelsActionOutputSchema: OutputSchema = {
  itemLabel: '{id}',
  fields: [
    {
      key: 'models',
      label: 'Models',
      value: '',
      listItems: modelSummaryListItems,
    },
  ],
};

export const listProvidersActionOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    {
      key: 'providers',
      label: 'Providers',
      value: '',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'slug', label: 'Slug' },
        { key: 'headquarters', label: 'Headquarters' },
        { key: 'privacy_policy_url', label: 'Privacy Policy URL', format: 'url' },
        { key: 'terms_of_service_url', label: 'Terms of Service URL', format: 'url' },
        { key: 'status_page_url', label: 'Status Page URL', format: 'url' },
      ],
    },
  ],
};

const endpointListItems: OutputSchemaField[] = [
  { key: 'name', label: 'Endpoint Name' },
  { key: 'modelId', label: 'Model ID' },
  { key: 'modelName', label: 'Model Name' },
  { key: 'providerName', label: 'Provider' },
  { key: 'contextLength', label: 'Context Length', format: 'number' },
  { key: 'promptPrice', label: 'Prompt Price (per token)' },
  { key: 'completionPrice', label: 'Completion Price (per token)' },
  { key: 'quantization', label: 'Quantization' },
  { key: 'maxCompletionTokens', label: 'Max Completion Tokens', format: 'number' },
  { key: 'uptimeLast30m', label: 'Uptime (last 30m %)', format: 'number' },
];

export const listModelEndpointsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Model ID' },
    { key: 'name', label: 'Model Name' },
    {
      key: 'endpoints',
      label: 'Endpoints',
      value: '',
      listItems: endpointListItems,
    },
  ],
};

export const getCreditsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'totalCredits', label: 'Total Credits', format: 'number' },
    { key: 'totalUsage', label: 'Total Usage', format: 'number' },
  ],
};

export const getCurrentKeyActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'label', label: 'Key Label' },
    { key: 'usage', label: 'Usage', format: 'number' },
    { key: 'limit', label: 'Limit', format: 'number' },
    { key: 'isFreeTier', label: 'Is Free Tier', format: 'boolean' },
    {
      key: 'rateLimit',
      label: 'Rate Limit',
      value: 'rateLimit',
      children: [
        { key: 'requests', label: 'Requests', format: 'number' },
        { key: 'interval', label: 'Interval' },
      ],
    },
  ],
};
