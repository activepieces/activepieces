import { OutputSchema } from '@activepieces/pieces-framework';

export const askAiActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'answer',
      label: 'Answer',
      value: '',
      listItems: [
        {
          key: 'Content',
          label: 'Content',
        },
      ],
    },
  ],
};

export const transcribeAudioActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'text',
      label: 'Transcribed Text',
    },
    {
      key: 'id',
      label: 'Request ID',
      value: 'x_groq.id',
    },
  ],
};

export const translateAudioActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'text',
      label: 'Translated Text',
      value: 'text',
    },
  ],
};

const usageTimingFields: OutputSchema['fields'] = [
  { key: 'queue_time', label: 'Queue Time (Seconds)', format: 'number' },
  { key: 'prompt_time', label: 'Prompt Time (Seconds)', format: 'number' },
  {
    key: 'completion_time',
    label: 'Completion Time (Seconds)',
    format: 'number',
  },
  { key: 'total_time', label: 'Total Time (Seconds)', format: 'number' },
];

const audioSegmentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Segment ID', format: 'number' },
  { key: 'start', label: 'Start (Seconds)', format: 'number' },
  { key: 'end', label: 'End (Seconds)', format: 'number' },
  { key: 'text', label: 'Text' },
  { key: 'avg_logprob', label: 'Average Log Probability', format: 'number' },
  { key: 'compression_ratio', label: 'Compression Ratio', format: 'number' },
  { key: 'no_speech_prob', label: 'No Speech Probability', format: 'number' },
];

const modelFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Model ID' },
  { key: 'name', label: 'Name' },
  { key: 'owned_by', label: 'Owner' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'created', label: 'Created (Unix Seconds)', format: 'number' },
  { key: 'context_window', label: 'Context Window (Tokens)', format: 'number' },
  {
    key: 'max_completion_tokens',
    label: 'Max Completion Tokens',
    format: 'number',
  },
  { key: 'input_modalities', label: 'Input Modalities' },
  { key: 'output_modalities', label: 'Output Modalities' },
  { key: 'hugging_face_id', label: 'Hugging Face ID' },
  { key: 'model_card', label: 'Model Card', format: 'url' },
  {
    key: 'pricing',
    label: 'Pricing',
    children: [
      { key: 'prompt', label: 'Prompt Price' },
      { key: 'completion', label: 'Completion Price' },
      { key: 'input_cache_read', label: 'Cached Input Price' },
    ],
  },
  { key: 'supported_features', label: 'Supported Features' },
  {
    key: 'supported_sampling_parameters',
    label: 'Supported Sampling Parameters',
  },
];

export const groqCreateChatCompletionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Completion ID' },
    { key: 'model', label: 'Model' },
    { key: 'created', label: 'Created (Unix Seconds)', format: 'number' },
    {
      key: 'choices',
      label: 'Choices',
      labelKey: 'finish_reason',
      listItems: [
        { key: 'index', label: 'Index', format: 'number' },
        { key: 'finish_reason', label: 'Finish Reason' },
        {
          key: 'message',
          label: 'Message',
          children: [
            { key: 'role', label: 'Role' },
            { key: 'content', label: 'Content' },
            { key: 'reasoning', label: 'Reasoning' },
          ],
        },
      ],
    },
    {
      key: 'usage',
      label: 'Usage',
      children: [
        { key: 'prompt_tokens', label: 'Prompt Tokens', format: 'number' },
        {
          key: 'completion_tokens',
          label: 'Completion Tokens',
          format: 'number',
        },
        { key: 'total_tokens', label: 'Total Tokens', format: 'number' },
        {
          key: 'completion_tokens_details',
          label: 'Completion Token Details',
          children: [
            {
              key: 'reasoning_tokens',
              label: 'Reasoning Tokens',
              format: 'number',
            },
          ],
        },
        ...usageTimingFields,
      ],
    },
    { key: 'service_tier', label: 'Service Tier' },
    { key: 'system_fingerprint', label: 'System Fingerprint' },
    {
      key: 'x_groq',
      label: 'Groq Metadata',
      children: [{ key: 'id', label: 'Request ID' }],
    },
  ],
};

export const groqCreateResponseOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Response ID' },
    { key: 'status', label: 'Status' },
    { key: 'model', label: 'Model' },
    { key: 'created_at', label: 'Created (Unix Seconds)', format: 'number' },
    {
      key: 'output',
      label: 'Output Items',
      labelKey: 'type',
      listItems: [
        { key: 'id', label: 'Item ID' },
        { key: 'type', label: 'Type' },
        { key: 'status', label: 'Status' },
        { key: 'role', label: 'Role' },
        {
          key: 'content',
          label: 'Content',
          labelKey: 'type',
          listItems: [
            { key: 'type', label: 'Type' },
            { key: 'text', label: 'Text' },
          ],
        },
        { key: 'summary', label: 'Summary' },
      ],
    },
    { key: 'instructions', label: 'Instructions' },
    {
      key: 'reasoning',
      label: 'Reasoning',
      children: [{ key: 'effort', label: 'Effort' }],
    },
    { key: 'max_output_tokens', label: 'Max Output Tokens', format: 'number' },
    { key: 'temperature', label: 'Temperature', format: 'number' },
    { key: 'top_p', label: 'Top P', format: 'number' },
    { key: 'tools', label: 'Tools' },
    { key: 'tool_choice', label: 'Tool Choice' },
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
    { key: 'error', label: 'Error' },
    { key: 'incomplete_details', label: 'Incomplete Details' },
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
      ],
    },
    { key: 'service_tier', label: 'Service Tier' },
  ],
};

export const groqCreateSpeechOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'Audio File', format: 'url' },
    { key: 'fileName', label: 'File Name' },
    { key: 'format', label: 'Audio Format' },
    { key: 'size', label: 'Size', format: 'filesize' },
  ],
};

export const groqCreateTranscriptionOutputSchema: OutputSchema = {
  fields: [
    { key: 'text', label: 'Transcript' },
    { key: 'language', label: 'Language' },
    { key: 'duration', label: 'Duration (Seconds)', format: 'number' },
    {
      key: 'words',
      label: 'Words',
      labelKey: 'word',
      listItems: [
        { key: 'word', label: 'Word' },
        { key: 'start', label: 'Start (Seconds)', format: 'number' },
        { key: 'end', label: 'End (Seconds)', format: 'number' },
      ],
    },
    {
      key: 'segments',
      label: 'Segments',
      labelKey: 'text',
      listItems: audioSegmentFields,
    },
    { key: 'task', label: 'Task' },
    {
      key: 'x_groq',
      label: 'Groq Metadata',
      children: [{ key: 'id', label: 'Request ID' }],
    },
  ],
};

export const groqCreateTranslationOutputSchema: OutputSchema = {
  fields: [
    { key: 'text', label: 'English Text' },
    { key: 'language', label: 'Language' },
    { key: 'duration', label: 'Duration (Seconds)', format: 'number' },
    {
      key: 'segments',
      label: 'Segments',
      labelKey: 'text',
      listItems: audioSegmentFields,
    },
    { key: 'task', label: 'Task' },
    {
      key: 'x_groq',
      label: 'Groq Metadata',
      children: [{ key: 'id', label: 'Request ID' }],
    },
  ],
};

export const groqGetModelOutputSchema: OutputSchema = {
  fields: modelFields,
};

export const groqListModelsOutputSchema: OutputSchema = {
  fields: [
    { key: 'data', label: 'Models', labelKey: 'id', listItems: modelFields },
  ],
};
