import { OutputSchema } from '@activepieces/pieces-framework';

const topicFields: OutputSchema['fields'] = [
  { key: 'topic', label: 'Topic' },
  { key: 'confidence', label: 'Confidence', format: 'number' },
  { key: 'text', label: 'Text' },
];

const intentFields: OutputSchema['fields'] = [
  { key: 'intent', label: 'Intent' },
  { key: 'confidence', label: 'Confidence', format: 'number' },
  { key: 'text', label: 'Text' },
];

const requestRowFields: OutputSchema['fields'] = [
  { key: 'request_id', label: 'Request ID' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'completed', label: 'Completed', format: 'datetime' },
  { key: 'endpoint', label: 'Endpoint' },
  { key: 'path', label: 'Path' },
  { key: 'api_key_id', label: 'API Key ID' },
  { key: 'status_code', label: 'Status Code', format: 'number' },
  { key: 'method', label: 'Method' },
  { key: 'deployment', label: 'Deployment' },
  { key: 'duration_seconds', label: 'Duration (seconds)', format: 'number' },
  {
    key: 'total_audio_seconds',
    label: 'Total Audio (seconds)',
    format: 'number',
  },
  { key: 'channels', label: 'Channels', format: 'number' },
  { key: 'usd', label: 'Cost', format: 'currency', currency: 'USD' },
  { key: 'models', label: 'Models' },
  { key: 'features', label: 'Features' },
  { key: 'tags', label: 'Tags' },
  { key: 'tier', label: 'Tier' },
  {
    key: 'callback_status_code',
    label: 'Callback Response Code',
    format: 'number',
  },
  { key: 'callback_attempts', label: 'Callback Attempts', format: 'number' },
];

const projectFields: OutputSchema['fields'] = [
  { key: 'project_id', label: 'Project ID' },
  { key: 'name', label: 'Name' },
  { key: 'mip_opt_out', label: 'Model Improvement Opt-Out', format: 'boolean' },
];

const speechFields: OutputSchema['fields'] = [
  { key: 'file', label: 'Audio File', format: 'url' },
  { key: 'file_name', label: 'File Name' },
  { key: 'content_type', label: 'Content Type' },
  { key: 'size_bytes', label: 'Size', format: 'filesize' },
  { key: 'characters', label: 'Characters Billed', format: 'number' },
  { key: 'request_id', label: 'Request ID' },
  { key: 'model', label: 'Voice' },
  { key: 'encoding', label: 'Encoding' },
];

export const listProjectsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'projects',
      label: 'Projects',
      labelKey: 'name',
      listItems: [
        { key: 'project_id', label: 'Project ID' },
        { key: 'name', label: 'Name' },
        {
          key: 'mip_opt_out',
          label: 'Model Improvement Opt-Out',
          format: 'boolean',
        },
        { key: 'allowed_providers', label: 'Allowed Providers' },
      ],
    },
  ],
};

export const projectOutputSchema: OutputSchema = {
  fields: projectFields,
};

export const updateProjectOutputSchema: OutputSchema = {
  fields: [...projectFields, { key: 'message', label: 'Message' }],
};

export const listMembersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'members',
      label: 'Members',
      labelKey: 'email',
      listItems: [
        { key: 'member_id', label: 'Member ID' },
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'first_name', label: 'First Name' },
        { key: 'last_name', label: 'Last Name' },
        { key: 'scopes', label: 'Scopes' },
      ],
    },
  ],
};

export const listKeysOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'keys',
      label: 'API Keys',
      labelKey: 'comment',
      listItems: [
        { key: 'api_key_id', label: 'API Key ID' },
        { key: 'comment', label: 'Comment' },
        { key: 'scopes', label: 'Scopes' },
        { key: 'created', label: 'Created', format: 'datetime' },
        { key: 'expiration_date', label: 'Expires', format: 'datetime' },
        { key: 'member_id', label: 'Member ID' },
        { key: 'member_email', label: 'Member Email', format: 'email' },
      ],
    },
  ],
};

export const listRequestsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'requests',
      label: 'Requests',
      labelKey: 'request_id',
      listItems: requestRowFields,
    },
    { key: 'page', label: 'Page', format: 'number' },
    { key: 'limit', label: 'Limit', format: 'number' },
    { key: 'has_more', label: 'Has More', format: 'boolean' },
  ],
};

export const requestOutputSchema: OutputSchema = {
  fields: requestRowFields,
};

export const usageOutputSchema: OutputSchema = {
  fields: [
    { key: 'start', label: 'Start', format: 'date' },
    { key: 'end', label: 'End', format: 'date' },
    { key: 'resolution', label: 'Resolution' },
    { key: 'total_hours', label: 'Total Hours', format: 'number' },
    { key: 'total_requests', label: 'Total Requests', format: 'number' },
    {
      key: 'total_tts_characters',
      label: 'Total TTS Characters',
      format: 'number',
    },
    { key: 'total_tokens_in', label: 'Total Tokens In', format: 'number' },
    { key: 'total_tokens_out', label: 'Total Tokens Out', format: 'number' },
    {
      key: 'results',
      label: 'Rows',
      labelKey: 'start',
      listItems: [
        { key: 'start', label: 'Start', format: 'date' },
        { key: 'end', label: 'End', format: 'date' },
        { key: 'hours', label: 'Hours', format: 'number' },
        { key: 'total_hours', label: 'Total Hours', format: 'number' },
        { key: 'agent_hours', label: 'Agent Hours', format: 'number' },
        { key: 'requests', label: 'Requests', format: 'number' },
        { key: 'tts_characters', label: 'TTS Characters', format: 'number' },
        { key: 'tokens_in', label: 'Tokens In', format: 'number' },
        { key: 'tokens_out', label: 'Tokens Out', format: 'number' },
        { key: 'endpoint', label: 'Endpoint' },
        { key: 'method', label: 'Method' },
        { key: 'models', label: 'Models' },
        { key: 'tags', label: 'Tags' },
        { key: 'accessor', label: 'API Key (Accessor)' },
        { key: 'feature_set', label: 'Feature Set' },
        { key: 'deployment', label: 'Deployment' },
      ],
    },
  ],
};

export const balancesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'balances',
      label: 'Balances',
      labelKey: 'balance_id',
      listItems: [
        { key: 'balance_id', label: 'Balance ID' },
        { key: 'amount', label: 'Amount', format: 'number' },
        { key: 'units', label: 'Units' },
        { key: 'purchase_order_id', label: 'Purchase Order ID' },
      ],
    },
  ],
};

export const billingOutputSchema: OutputSchema = {
  fields: [
    { key: 'start', label: 'Start', format: 'date' },
    { key: 'end', label: 'End', format: 'date' },
    {
      key: 'total_dollars',
      label: 'Total',
      format: 'currency',
      currency: 'USD',
    },
    {
      key: 'results',
      label: 'Rows',
      labelKey: 'line_item',
      listItems: [
        {
          key: 'dollars',
          label: 'Amount',
          format: 'currency',
          currency: 'USD',
        },
        { key: 'start', label: 'Start', format: 'date' },
        { key: 'end', label: 'End', format: 'date' },
        { key: 'line_item', label: 'Line Item' },
        { key: 'accessor', label: 'API Key (Accessor)' },
        { key: 'deployment', label: 'Deployment' },
        { key: 'tags', label: 'Tags' },
      ],
    },
  ],
};

const modelRowFields: OutputSchema['fields'] = [
  { key: 'canonical_name', label: 'Model ID' },
  { key: 'type', label: 'Type' },
  { key: 'name', label: 'Name' },
  { key: 'architecture', label: 'Architecture' },
  { key: 'languages', label: 'Languages' },
  { key: 'version', label: 'Version' },
  { key: 'batch', label: 'Pre-recorded', format: 'boolean' },
  { key: 'streaming', label: 'Streaming', format: 'boolean' },
  { key: 'accent', label: 'Accent' },
  { key: 'age', label: 'Age' },
  { key: 'gender', label: 'Gender' },
  { key: 'voice_tags', label: 'Voice Traits' },
  { key: 'sample_url', label: 'Sample', format: 'url' },
];

export const listModelsOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'models',
      label: 'Models',
      labelKey: 'canonical_name',
      listItems: modelRowFields,
    },
  ],
};

export const listModelBuildsOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'models',
      label: 'Models',
      labelKey: 'canonical_name',
      listItems: [{ key: 'uuid', label: 'Build UUID' }, ...modelRowFields],
    },
  ],
};

export const transcribeAudioOutputSchema: OutputSchema = {
  fields: [
    { key: 'request_id', label: 'Request ID' },
    { key: 'transcript', label: 'Transcript' },
    { key: 'confidence', label: 'Confidence', format: 'number' },
    { key: 'duration_seconds', label: 'Duration (seconds)', format: 'number' },
    { key: 'detected_language', label: 'Detected Language' },
    {
      key: 'language_confidence',
      label: 'Language Confidence',
      format: 'number',
    },
    { key: 'model_name', label: 'Model' },
    { key: 'model_version', label: 'Model Version' },
    { key: 'channel_count', label: 'Channels', format: 'number' },
    { key: 'paragraphs_text', label: 'Transcript with Paragraphs' },
    { key: 'speaker_count', label: 'Speakers', format: 'number' },
    { key: 'speaker_transcript', label: 'Transcript by Speaker' },
    { key: 'summary', label: 'Summary' },
    {
      key: 'topics',
      label: 'Topics',
      labelKey: 'topic',
      listItems: topicFields,
    },
    {
      key: 'intents',
      label: 'Intents',
      labelKey: 'intent',
      listItems: intentFields,
    },
    { key: 'sentiment', label: 'Overall Sentiment' },
    { key: 'sentiment_score', label: 'Sentiment Score', format: 'number' },
    {
      key: 'utterances',
      label: 'Utterances',
      labelKey: 'transcript',
      listItems: [
        { key: 'speaker', label: 'Speaker', format: 'number' },
        { key: 'channel', label: 'Channel', format: 'number' },
        { key: 'start', label: 'Start (seconds)', format: 'number' },
        { key: 'end', label: 'End (seconds)', format: 'number' },
        { key: 'confidence', label: 'Confidence', format: 'number' },
        { key: 'transcript', label: 'Transcript' },
      ],
    },
    {
      key: 'channels',
      label: 'Channel Transcripts',
      labelKey: 'channel',
      listItems: [
        { key: 'channel', label: 'Channel', format: 'number' },
        { key: 'transcript', label: 'Transcript' },
        { key: 'confidence', label: 'Confidence', format: 'number' },
        { key: 'detected_language', label: 'Detected Language' },
      ],
    },
    {
      key: 'entities',
      label: 'Entities',
      labelKey: 'value',
      listItems: [
        { key: 'label', label: 'Type' },
        { key: 'value', label: 'Value' },
        { key: 'confidence', label: 'Confidence', format: 'number' },
        { key: 'channel', label: 'Channel', format: 'number' },
      ],
    },
    {
      key: 'words',
      label: 'Words',
      labelKey: 'punctuated_word',
      listItems: [
        { key: 'word', label: 'Word' },
        { key: 'punctuated_word', label: 'Punctuated Word' },
        { key: 'start', label: 'Start (seconds)', format: 'number' },
        { key: 'end', label: 'End (seconds)', format: 'number' },
        { key: 'confidence', label: 'Confidence', format: 'number' },
        { key: 'speaker', label: 'Speaker', format: 'number' },
        { key: 'channel', label: 'Channel', format: 'number' },
      ],
    },
    { key: 'warnings', label: 'Warnings' },
  ],
};

export const analyzeTextOutputSchema: OutputSchema = {
  fields: [
    { key: 'request_id', label: 'Request ID' },
    { key: 'language', label: 'Language' },
    { key: 'summary', label: 'Summary' },
    {
      key: 'topics',
      label: 'Topics',
      labelKey: 'topic',
      listItems: topicFields,
    },
    {
      key: 'intents',
      label: 'Intents',
      labelKey: 'intent',
      listItems: intentFields,
    },
    { key: 'sentiment', label: 'Overall Sentiment' },
    { key: 'sentiment_score', label: 'Sentiment Score', format: 'number' },
    {
      key: 'sentiment_segments',
      label: 'Sentiment by Segment',
      labelKey: 'sentiment',
      listItems: [
        { key: 'text', label: 'Text' },
        { key: 'sentiment', label: 'Sentiment' },
        { key: 'sentiment_score', label: 'Score', format: 'number' },
      ],
    },
    { key: 'input_tokens', label: 'Input Tokens', format: 'number' },
    { key: 'output_tokens', label: 'Output Tokens', format: 'number' },
  ],
};

export const createTranscriptionCallbackOutputSchema: OutputSchema = {
  fields: [
    { key: 'requestId', label: 'Request ID' },
    { key: 'callbackUrl', label: 'Callback URL' },
    { key: 'status', label: 'Status' },
  ],
};

export const textToSpeechOutputSchema: OutputSchema = {
  fields: speechFields,
};

export const generateSpeechOutputSchema: OutputSchema = {
  fields: speechFields,
};

export const modelOutputSchema: OutputSchema = {
  fields: [{ key: 'uuid', label: 'Build UUID' }, ...modelRowFields],
};

export const balanceOutputSchema: OutputSchema = {
  fields: [
    { key: 'balance_id', label: 'Balance ID' },
    { key: 'amount', label: 'Amount', format: 'number' },
    { key: 'units', label: 'Units' },
    { key: 'purchase_order_id', label: 'Purchase Order ID' },
  ],
};

export const usageSummaryOutputSchema: OutputSchema = {
  fields: [
    { key: 'start', label: 'Start', format: 'date' },
    { key: 'end', label: 'End', format: 'date' },
    { key: 'resolution', label: 'Resolution' },
    { key: 'total_hours', label: 'Total Hours', format: 'number' },
    { key: 'total_requests', label: 'Total Requests', format: 'number' },
    {
      key: 'total_tts_characters',
      label: 'Total TTS Characters',
      format: 'number',
    },
    {
      key: 'total_tts_requests',
      label: 'Total TTS Requests',
      format: 'number',
    },
    { key: 'total_tokens_in', label: 'Total Tokens In', format: 'number' },
    { key: 'total_tokens_out', label: 'Total Tokens Out', format: 'number' },
    {
      key: 'results',
      label: 'Days',
      labelKey: 'start',
      listItems: [
        { key: 'start', label: 'Start', format: 'date' },
        { key: 'end', label: 'End', format: 'date' },
        { key: 'hours', label: 'Hours', format: 'number' },
        { key: 'total_hours', label: 'Total Hours', format: 'number' },
        { key: 'requests', label: 'Requests', format: 'number' },
        { key: 'tts_characters', label: 'TTS Characters', format: 'number' },
        { key: 'tts_requests', label: 'TTS Requests', format: 'number' },
        { key: 'tokens_in', label: 'Tokens In', format: 'number' },
        { key: 'tokens_out', label: 'Tokens Out', format: 'number' },
      ],
    },
  ],
};

export const usageFieldsOutputSchema: OutputSchema = {
  fields: [
    { key: 'accessors', label: 'API Key IDs' },
    { key: 'tags', label: 'Tags' },
    {
      key: 'models',
      label: 'Model Builds',
      labelKey: 'name',
      listItems: [
        { key: 'model_id', label: 'Model UUID' },
        { key: 'name', label: 'Name' },
        { key: 'language', label: 'Language' },
        { key: 'version', label: 'Version' },
      ],
    },
    { key: 'processing_methods', label: 'Processing Methods' },
    { key: 'features', label: 'Features' },
  ],
};

export const billingFieldsOutputSchema: OutputSchema = {
  fields: [
    { key: 'accessors', label: 'API Key IDs' },
    { key: 'deployments', label: 'Deployments' },
    { key: 'tags', label: 'Tags' },
    {
      key: 'line_items',
      label: 'Line Items',
      labelKey: 'line_item',
      listItems: [
        { key: 'line_item', label: 'Line Item' },
        { key: 'description', label: 'Description' },
      ],
    },
  ],
};

export const purchasesOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'orders',
      label: 'Purchases',
      labelKey: 'order_id',
      listItems: [
        { key: 'order_id', label: 'Order ID' },
        { key: 'created', label: 'Created', format: 'datetime' },
        { key: 'expiration', label: 'Expires', format: 'datetime' },
        { key: 'amount', label: 'Amount', format: 'number' },
        { key: 'units', label: 'Units' },
        { key: 'order_type', label: 'Order Type' },
      ],
    },
  ],
};

export const thinkModelsOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'models',
      label: 'Models',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Model ID' },
        { key: 'name', label: 'Name' },
        { key: 'provider', label: 'Provider' },
      ],
    },
  ],
};
