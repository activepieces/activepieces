import { OutputSchema } from '@activepieces/pieces-framework';

export const askCometApiOutputSchema: OutputSchema = {
  fields: [
    { key: 'response', label: 'Response' },
    { key: 'model', label: 'Model' },
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
      ],
    },
  ],
};

export const cometapiCreateChatCompletionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'object', label: 'Object' },
    { key: 'created', label: 'Created', format: 'number' },
    { key: 'model', label: 'Model' },
    {
      key: 'choices',
      label: 'Choices',
      listItems: [
        { key: 'index', label: 'Index', format: 'number' },
        {
          key: 'message',
          label: 'Message',
          children: [
            { key: 'role', label: 'Role' },
            { key: 'content', label: 'Content' },
            { key: 'refusal', label: 'Refusal' },
            {
              key: 'tool_calls',
              label: 'Tool Calls',
              labelKey: 'id',
              listItems: [
                { key: 'id', label: 'ID' },
                { key: 'type', label: 'Type' },
                {
                  key: 'function',
                  label: 'Function',
                  children: [
                    { key: 'name', label: 'Name' },
                    { key: 'arguments', label: 'Arguments' },
                  ],
                },
              ],
            },
            { key: 'annotations', label: 'Annotations' },
          ],
        },
        { key: 'logprobs', label: 'Logprobs' },
        { key: 'finish_reason', label: 'Finish Reason' },
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
          key: 'prompt_tokens_details',
          label: 'Prompt Tokens Details',
          children: [
            { key: 'cached_tokens', label: 'Cached Tokens', format: 'number' },
            { key: 'audio_tokens', label: 'Audio Tokens', format: 'number' },
          ],
        },
        {
          key: 'completion_tokens_details',
          label: 'Completion Tokens Details',
          children: [
            {
              key: 'reasoning_tokens',
              label: 'Reasoning Tokens',
              format: 'number',
            },
            { key: 'audio_tokens', label: 'Audio Tokens', format: 'number' },
            {
              key: 'accepted_prediction_tokens',
              label: 'Accepted Prediction Tokens',
              format: 'number',
            },
            {
              key: 'rejected_prediction_tokens',
              label: 'Rejected Prediction Tokens',
              format: 'number',
            },
          ],
        },
      ],
    },
    { key: 'service_tier', label: 'Service Tier' },
    { key: 'system_fingerprint', label: 'System Fingerprint' },
  ],
};

export const cometapiCreateClaudeMessageOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'type', label: 'Type' },
    { key: 'role', label: 'Role' },
    {
      key: 'content',
      label: 'Content',
      labelKey: 'name',
      listItems: [
        { key: 'type', label: 'Type' },
        { key: 'text', label: 'Text' },
        { key: 'thinking', label: 'Thinking' },
        { key: 'signature', label: 'Signature' },
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'input', label: 'Input' },
        { key: 'tool_use_id', label: 'Tool Use ID' },
        { key: 'content', label: 'Content' },
        { key: 'citations', label: 'Citations' },
      ],
    },
    { key: 'model', label: 'Model' },
    { key: 'stop_reason', label: 'Stop Reason' },
    { key: 'stop_sequence', label: 'Stop Sequence' },
    {
      key: 'usage',
      label: 'Usage',
      children: [
        { key: 'input_tokens', label: 'Input Tokens', format: 'number' },
        { key: 'output_tokens', label: 'Output Tokens', format: 'number' },
        {
          key: 'cache_creation_input_tokens',
          label: 'Cache Creation Input Tokens',
          format: 'number',
        },
        {
          key: 'cache_read_input_tokens',
          label: 'Cache Read Input Tokens',
          format: 'number',
        },
        { key: 'cache_creation', label: 'Cache Creation', dynamicKey: true },
        {
          key: 'output_tokens_details',
          label: 'Output Tokens Details',
          children: [
            {
              key: 'thinking_tokens',
              label: 'Thinking Tokens',
              format: 'number',
            },
          ],
        },
        {
          key: 'server_tool_use',
          label: 'Server Tool Use',
          children: [
            {
              key: 'web_fetch_requests',
              label: 'Web Fetch Requests',
              format: 'number',
            },
            {
              key: 'web_search_requests',
              label: 'Web Search Requests',
              format: 'number',
            },
          ],
        },
      ],
    },
  ],
};

export const cometapiCreateEmbeddingsOutputSchema: OutputSchema = {
  fields: [
    { key: 'object', label: 'Object' },
    {
      key: 'data',
      label: 'Data',
      listItems: [
        { key: 'object', label: 'Object' },
        { key: 'index', label: 'Index', format: 'number' },
        { key: 'embedding', label: 'Embedding' },
      ],
    },
    { key: 'model', label: 'Model' },
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

export const cometapiCreateModerationOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'model', label: 'Model' },
    {
      key: 'results',
      label: 'Results',
      listItems: [
        { key: 'flagged', label: 'Flagged', format: 'boolean' },
        {
          key: 'categories',
          label: 'Categories',
          children: [
            { key: 'harassment', label: 'Harassment', format: 'boolean' },
            {
              key: 'harassment/threatening',
              label: 'Harassment Threatening',
              format: 'boolean',
            },
            { key: 'hate', label: 'Hate', format: 'boolean' },
            {
              key: 'hate/threatening',
              label: 'Hate Threatening',
              format: 'boolean',
            },
            { key: 'illicit', label: 'Illicit', format: 'boolean' },
            {
              key: 'illicit/violent',
              label: 'Illicit Violent',
              format: 'boolean',
            },
            { key: 'self-harm', label: 'Self Harm', format: 'boolean' },
            {
              key: 'self-harm/intent',
              label: 'Self Harm Intent',
              format: 'boolean',
            },
            {
              key: 'self-harm/instructions',
              label: 'Self Harm Instructions',
              format: 'boolean',
            },
            { key: 'sexual', label: 'Sexual', format: 'boolean' },
            { key: 'sexual/minors', label: 'Sexual Minors', format: 'boolean' },
            { key: 'violence', label: 'Violence', format: 'boolean' },
            {
              key: 'violence/graphic',
              label: 'Violence Graphic',
              format: 'boolean',
            },
          ],
        },
        {
          key: 'category_scores',
          label: 'Category Scores',
          children: [
            { key: 'harassment', label: 'Harassment', format: 'number' },
            {
              key: 'harassment/threatening',
              label: 'Harassment Threatening',
              format: 'number',
            },
            { key: 'hate', label: 'Hate', format: 'number' },
            {
              key: 'hate/threatening',
              label: 'Hate Threatening',
              format: 'number',
            },
            { key: 'illicit', label: 'Illicit', format: 'number' },
            {
              key: 'illicit/violent',
              label: 'Illicit Violent',
              format: 'number',
            },
            { key: 'self-harm', label: 'Self Harm', format: 'number' },
            {
              key: 'self-harm/intent',
              label: 'Self Harm Intent',
              format: 'number',
            },
            {
              key: 'self-harm/instructions',
              label: 'Self Harm Instructions',
              format: 'number',
            },
            { key: 'sexual', label: 'Sexual', format: 'number' },
            { key: 'sexual/minors', label: 'Sexual Minors', format: 'number' },
            { key: 'violence', label: 'Violence', format: 'number' },
            {
              key: 'violence/graphic',
              label: 'Violence Graphic',
              format: 'number',
            },
          ],
        },
        {
          key: 'category_applied_input_types',
          label: 'Category Applied Input Types',
          children: [
            { key: 'harassment', label: 'Harassment' },
            { key: 'harassment/threatening', label: 'Harassment Threatening' },
            { key: 'hate', label: 'Hate' },
            { key: 'hate/threatening', label: 'Hate Threatening' },
            { key: 'illicit', label: 'Illicit' },
            { key: 'illicit/violent', label: 'Illicit Violent' },
            { key: 'self-harm', label: 'Self Harm' },
            { key: 'self-harm/intent', label: 'Self Harm Intent' },
            { key: 'self-harm/instructions', label: 'Self Harm Instructions' },
            { key: 'sexual', label: 'Sexual' },
            { key: 'sexual/minors', label: 'Sexual Minors' },
            { key: 'violence', label: 'Violence' },
            { key: 'violence/graphic', label: 'Violence Graphic' },
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
        { key: 'input_tokens', label: 'Input Tokens', format: 'number' },
        { key: 'output_tokens', label: 'Output Tokens', format: 'number' },
        { key: 'prompt_tokens_details', label: 'Prompt Tokens Details' },
        {
          key: 'completion_tokens_details',
          label: 'Completion Tokens Details',
        },
        { key: 'input_tokens_details', label: 'Input Tokens Details' },
        {
          key: 'claude_cache_creation_1_h_tokens',
          label: 'Claude Cache Creation 1 H Tokens',
          format: 'number',
        },
        {
          key: 'claude_cache_creation_5_m_tokens',
          label: 'Claude Cache Creation 5 M Tokens',
          format: 'number',
        },
      ],
    },
  ],
};

export const cometapiCreateResponseOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'object', label: 'Object' },
    { key: 'created_at', label: 'Created At', format: 'number' },
    { key: 'status', label: 'Status' },
    { key: 'background', label: 'Background', format: 'boolean' },
    { key: 'completed_at', label: 'Completed At', format: 'number' },
    {
      key: 'error',
      label: 'Error',
      children: [
        { key: 'code', label: 'Code' },
        { key: 'message', label: 'Message' },
      ],
    },
    {
      key: 'incomplete_details',
      label: 'Incomplete Details',
      children: [{ key: 'reason', label: 'Reason' }],
    },
    { key: 'instructions', label: 'Instructions' },
    { key: 'max_output_tokens', label: 'Max Output Tokens', format: 'number' },
    { key: 'model', label: 'Model' },
    {
      key: 'output',
      label: 'Output',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'type', label: 'Type' },
        { key: 'status', label: 'Status' },
        { key: 'role', label: 'Role' },
        {
          key: 'content',
          label: 'Content',
          listItems: [
            { key: 'type', label: 'Type' },
            { key: 'text', label: 'Text' },
            { key: 'annotations', label: 'Annotations' },
            { key: 'logprobs', label: 'Logprobs' },
          ],
        },
        { key: 'name', label: 'Name' },
        { key: 'arguments', label: 'Arguments' },
        { key: 'call_id', label: 'Call ID' },
        { key: 'phase', label: 'Phase' },
      ],
    },
    {
      key: 'parallel_tool_calls',
      label: 'Parallel Tool Calls',
      format: 'boolean',
    },
    { key: 'previous_response_id', label: 'Previous Response ID' },
    {
      key: 'reasoning',
      label: 'Reasoning',
      children: [
        { key: 'effort', label: 'Effort' },
        { key: 'summary', label: 'Summary' },
        { key: 'context', label: 'Context' },
        { key: 'mode', label: 'Mode' },
      ],
    },
    { key: 'service_tier', label: 'Service Tier' },
    { key: 'store', label: 'Store', format: 'boolean' },
    { key: 'temperature', label: 'Temperature', format: 'number' },
    {
      key: 'text',
      label: 'Text',
      children: [
        {
          key: 'format',
          label: 'Format',
          children: [{ key: 'type', label: 'Type' }],
        },
        { key: 'verbosity', label: 'Verbosity' },
      ],
    },
    { key: 'tool_choice', label: 'Tool Choice' },
    { key: 'tools', label: 'Tools' },
    { key: 'top_p', label: 'Top P', format: 'number' },
    { key: 'truncation', label: 'Truncation' },
    {
      key: 'usage',
      label: 'Usage',
      children: [
        { key: 'input_tokens', label: 'Input Tokens', format: 'number' },
        {
          key: 'input_tokens_details',
          label: 'Input Tokens Details',
          children: [
            { key: 'cached_tokens', label: 'Cached Tokens', format: 'number' },
            {
              key: 'cache_write_tokens',
              label: 'Cache Write Tokens',
              format: 'number',
            },
          ],
        },
        { key: 'output_tokens', label: 'Output Tokens', format: 'number' },
        {
          key: 'output_tokens_details',
          label: 'Output Tokens Details',
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
    { key: 'user', label: 'User' },
    { key: 'metadata', label: 'Metadata' },
    { key: 'content_filters', label: 'Content Filters' },
    { key: 'frequency_penalty', label: 'Frequency Penalty', format: 'number' },
    { key: 'max_tool_calls', label: 'Max Tool Calls', format: 'number' },
    { key: 'presence_penalty', label: 'Presence Penalty', format: 'number' },
    { key: 'prompt_cache_key', label: 'Prompt Cache Key' },
    { key: 'prompt_cache_retention', label: 'Prompt Cache Retention' },
    { key: 'safety_identifier', label: 'Safety Identifier' },
    { key: 'top_logprobs', label: 'Top Logprobs', format: 'number' },
  ],
};

export const cometapiCreateSpeechOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'Audio File' },
    { key: 'format', label: 'Format' },
  ],
};

export const cometapiDownloadVideoOutputSchema: OutputSchema = {
  fields: [{ key: 'file', label: 'Video File' }],
};

export const cometapiCreateTranscriptionOutputSchema: OutputSchema = {
  fields: [{ key: 'text', label: 'Text' }],
};

export const cometapiCreateVideoOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'task_id', label: 'Task ID' },
    { key: 'object', label: 'Object' },
    { key: 'model', label: 'Model' },
    { key: 'status', label: 'Status' },
    { key: 'progress', label: 'Progress', format: 'number' },
    { key: 'created_at', label: 'Created At', format: 'number' },
    { key: 'completed_at', label: 'Completed At', format: 'number' },
    { key: 'video_url', label: 'Video URL' },
    { key: 'error', label: 'Error' },
  ],
};

export const cometapiEditImageOutputSchema: OutputSchema = {
  fields: [
    { key: 'created', label: 'Created', format: 'number' },
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
          key: 'prompt_tokens_details',
          label: 'Prompt Tokens Details',
          children: [
            { key: 'cached_tokens_details', label: 'Cached Tokens Details' },
          ],
        },
        {
          key: 'completion_tokens_details',
          label: 'Completion Tokens Details',
        },
        { key: 'input_tokens', label: 'Input Tokens', format: 'number' },
        { key: 'output_tokens', label: 'Output Tokens', format: 'number' },
        {
          key: 'input_tokens_details',
          label: 'Input Tokens Details',
          children: [
            { key: 'image_tokens', label: 'Image Tokens', format: 'number' },
            { key: 'text_tokens', label: 'Text Tokens', format: 'number' },
            { key: 'cached_tokens_details', label: 'Cached Tokens Details' },
          ],
        },
        {
          key: 'claude_cache_creation_5_m_tokens',
          label: 'Claude Cache Creation 5 M Tokens',
          format: 'number',
        },
        {
          key: 'claude_cache_creation_1_h_tokens',
          label: 'Claude Cache Creation 1 H Tokens',
          format: 'number',
        },
      ],
    },
    {
      key: 'data',
      label: 'Data',
      listItems: [
        { key: 'b64_json', label: 'B64 JSON' },
        { key: 'url', label: 'URL' },
        { key: 'revised_prompt', label: 'Revised Prompt' },
      ],
    },
    { key: 'background', label: 'Background' },
    { key: 'output_format', label: 'Output Format' },
    { key: 'quality', label: 'Quality' },
    { key: 'size', label: 'Size' },
  ],
};

const fluxTaskFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'status', label: 'Status' },
  {
    key: 'result',
    label: 'Result',
    children: [
      { key: 'sample', label: 'Sample' },
      { key: 'seed', label: 'Seed', format: 'number' },
    ],
  },
  { key: 'polling_url', label: 'Polling URL' },
  { key: 'cost', label: 'Cost', format: 'number' },
  { key: 'input_mp', label: 'Input Mp', format: 'number' },
  { key: 'output_mp', label: 'Output Mp', format: 'number' },
  { key: 'progress', label: 'Progress', format: 'number' },
  { key: 'details', label: 'Details' },
  { key: 'preview', label: 'Preview' },
];

export const cometapiFluxGenerateImageOutputSchema: OutputSchema = {
  fields: [
    { key: 'task', label: 'Task', children: fluxTaskFields },
    { key: 'result', label: 'Result', children: fluxTaskFields },
  ],
};

export const cometapiFluxGetResultOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'status', label: 'Status' },
    {
      key: 'result',
      label: 'Result',
      children: [
        { key: 'seed', label: 'Seed', format: 'number' },
        { key: 'prompt', label: 'Prompt' },
        { key: 'sample', label: 'Sample' },
        { key: 'start_time', label: 'Start Time', format: 'number' },
      ],
    },
    { key: 'progress', label: 'Progress', format: 'number' },
    { key: 'details', label: 'Details' },
    { key: 'preview', label: 'Preview' },
  ],
};

export const cometapiGeminiGenerateContentOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'candidates',
      label: 'Candidates',
      listItems: [
        {
          key: 'content',
          label: 'Content',
          children: [
            { key: 'role', label: 'Role' },
            {
              key: 'parts',
              label: 'Parts',
              listItems: [
                { key: 'text', label: 'Text' },
                {
                  key: 'functionCall',
                  label: 'Function Call',
                  children: [
                    { key: 'name', label: 'Name' },
                    { key: 'args', label: 'Args' },
                    { key: 'id', label: 'ID' },
                  ],
                },
                {
                  key: 'inlineData',
                  label: 'Inline Data',
                  children: [
                    { key: 'mimeType', label: 'Mime Type' },
                    { key: 'data', label: 'Data' },
                  ],
                },
                { key: 'thought', label: 'Thought', format: 'boolean' },
                { key: 'thoughtSignature', label: 'Thought Signature' },
              ],
            },
          ],
        },
        { key: 'finishReason', label: 'Finish Reason' },
        {
          key: 'safetyRatings',
          label: 'Safety Ratings',
          listItems: [
            { key: 'category', label: 'Category' },
            { key: 'probability', label: 'Probability' },
            { key: 'blocked', label: 'Blocked', format: 'boolean' },
          ],
        },
        {
          key: 'citationMetadata',
          label: 'Citation Metadata',
          children: [
            {
              key: 'citationSources',
              label: 'Citation Sources',
              listItems: [
                { key: 'startIndex', label: 'Start Index', format: 'number' },
                { key: 'endIndex', label: 'End Index', format: 'number' },
                { key: 'uri', label: 'URI' },
                { key: 'license', label: 'License' },
              ],
            },
          ],
        },
        { key: 'tokenCount', label: 'Token Count', format: 'number' },
        { key: 'avgLogprobs', label: 'Avg Logprobs', format: 'number' },
        {
          key: 'groundingMetadata',
          label: 'Grounding Metadata',
          children: [
            {
              key: 'groundingChunks',
              label: 'Grounding Chunks',
              listItems: [
                {
                  key: 'web',
                  label: 'Web',
                  children: [
                    { key: 'uri', label: 'URI' },
                    { key: 'title', label: 'Title' },
                  ],
                },
              ],
            },
            {
              key: 'groundingSupports',
              label: 'Grounding Supports',
              listItems: [
                {
                  key: 'groundingChunkIndices',
                  label: 'Grounding Chunk Indices',
                },
                { key: 'confidenceScores', label: 'Confidence Scores' },
                {
                  key: 'segment',
                  label: 'Segment',
                  children: [
                    {
                      key: 'startIndex',
                      label: 'Start Index',
                      format: 'number',
                    },
                    { key: 'endIndex', label: 'End Index', format: 'number' },
                    { key: 'text', label: 'Text' },
                  ],
                },
              ],
            },
            { key: 'webSearchQueries', label: 'Web Search Queries' },
          ],
        },
        { key: 'index', label: 'Index', format: 'number' },
      ],
    },
    {
      key: 'promptFeedback',
      label: 'Prompt Feedback',
      children: [
        { key: 'blockReason', label: 'Block Reason' },
        {
          key: 'safetyRatings',
          label: 'Safety Ratings',
          listItems: [
            { key: 'category', label: 'Category' },
            { key: 'probability', label: 'Probability' },
            { key: 'blocked', label: 'Blocked', format: 'boolean' },
          ],
        },
      ],
    },
    {
      key: 'usageMetadata',
      label: 'Usage Metadata',
      children: [
        {
          key: 'promptTokenCount',
          label: 'Prompt Token Count',
          format: 'number',
        },
        {
          key: 'candidatesTokenCount',
          label: 'Candidates Token Count',
          format: 'number',
        },
        {
          key: 'totalTokenCount',
          label: 'Total Token Count',
          format: 'number',
        },
        { key: 'trafficType', label: 'Traffic Type' },
        {
          key: 'thoughtsTokenCount',
          label: 'Thoughts Token Count',
          format: 'number',
        },
        {
          key: 'promptTokensDetails',
          label: 'Prompt Tokens Details',
          listItems: [
            { key: 'modality', label: 'Modality' },
            { key: 'tokenCount', label: 'Token Count', format: 'number' },
          ],
        },
        {
          key: 'candidatesTokensDetails',
          label: 'Candidates Tokens Details',
          listItems: [
            { key: 'modality', label: 'Modality' },
            { key: 'tokenCount', label: 'Token Count', format: 'number' },
          ],
        },
      ],
    },
    { key: 'modelVersion', label: 'Model Version' },
    { key: 'createTime', label: 'Create Time' },
    { key: 'responseId', label: 'Response ID' },
  ],
};

export const cometapiGenerateImageOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'result',
      label: 'Result',
      children: [
        { key: 'created', label: 'Created', format: 'datetime' },
        {
          key: 'data',
          label: 'Images',
          listItems: [
            { key: 'url', label: 'URL', format: 'url' },
            { key: 'b64_json', label: 'Base64 Image' },
            { key: 'revised_prompt', label: 'Revised Prompt' },
          ],
        },
        {
          key: 'usage',
          label: 'Usage',
          children: [
            { key: 'input_tokens', label: 'Input Tokens', format: 'number' },
            { key: 'output_tokens', label: 'Output Tokens', format: 'number' },
            { key: 'total_tokens', label: 'Total Tokens', format: 'number' },
          ],
        },
      ],
    },
    {
      key: 'task',
      label: 'Task',
      children: [
        { key: 'code', label: 'Code' },
        { key: 'message', label: 'Message' },
        {
          key: 'data',
          label: 'Data',
          children: [
            { key: 'task_id', label: 'Task ID' },
            { key: 'status', label: 'Status' },
            { key: 'data', label: 'Data' },
          ],
        },
      ],
    },
  ],
};

export const cometapiGetApiKeyUsageOutputSchema: OutputSchema = {
  fields: [
    { key: 'expires_at', label: 'Expires At', format: 'number' },
    { key: 'model_limits', label: 'Model Limits' },
    {
      key: 'model_limits_enabled',
      label: 'Model Limits Enabled',
      format: 'boolean',
    },
    { key: 'name', label: 'Name' },
    { key: 'object', label: 'Object' },
    { key: 'total_available', label: 'Total Available', format: 'number' },
    { key: 'total_granted', label: 'Total Granted', format: 'number' },
    { key: 'total_used', label: 'Total Used', format: 'number' },
    { key: 'unlimited_quota', label: 'Unlimited Quota', format: 'boolean' },
  ],
};

export const cometapiGetImageTaskOutputSchema: OutputSchema = {
  fields: [
    { key: 'code', label: 'Code' },
    { key: 'message', label: 'Message' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'task_id', label: 'Task ID' },
        { key: 'status', label: 'Status' },
        {
          key: 'data',
          label: 'Data',
          listItems: [
            { key: 'url', label: 'URL' },
            { key: 'b64_json', label: 'B64 JSON' },
            { key: 'revised_prompt', label: 'Revised Prompt' },
          ],
        },
        { key: 'fail_reason', label: 'Fail Reason' },
      ],
    },
  ],
};

export const cometapiGrokEditVideoOutputSchema: OutputSchema = {
  fields: [{ key: 'request_id', label: 'Request ID' }],
};

export const cometapiGrokGetVideoOutputSchema: OutputSchema = {
  fields: [
    { key: 'request_id', label: 'Request ID' },
    { key: 'model', label: 'Model' },
    {
      key: 'video',
      label: 'Video',
      children: [
        { key: 'url', label: 'URL' },
        { key: 'duration', label: 'Duration', format: 'number' },
        {
          key: 'respect_moderation',
          label: 'Respect Moderation',
          format: 'boolean',
        },
      ],
    },
    { key: 'status', label: 'Status' },
    { key: 'progress', label: 'Progress', format: 'number' },
    { key: 'usage', label: 'Usage' },
    { key: 'error', label: 'Error' },
  ],
};

export const cometapiKlingAddVideoSelectionOutputSchema: OutputSchema = {
  fields: [
    { key: 'code', label: 'Code', format: 'number' },
    { key: 'message', label: 'Message' },
    { key: 'data', label: 'Data' },
  ],
};

export const cometapiKlingApplyVideoEffectOutputSchema: OutputSchema = {
  fields: [
    { key: 'code', label: 'Code', format: 'number' },
    { key: 'message', label: 'Message' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'task_id', label: 'Task ID' },
        { key: 'task_status', label: 'Task Status' },
        { key: 'task_info', label: 'Task Info' },
        { key: 'created_at', label: 'Created At', format: 'number' },
        { key: 'updated_at', label: 'Updated At', format: 'number' },
      ],
    },
  ],
};

export const cometapiKlingCreateLipSyncOutputSchema: OutputSchema = {
  fields: [
    { key: 'code', label: 'Code', format: 'number' },
    { key: 'message', label: 'Message' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'task_id', label: 'Task ID' },
        { key: 'task_status', label: 'Task Status' },
        { key: 'created_at', label: 'Created At', format: 'number' },
        { key: 'updated_at', label: 'Updated At', format: 'number' },
      ],
    },
  ],
};

export const cometapiKlingCreateOmniImageOutputSchema: OutputSchema = {
  fields: [
    { key: 'code', label: 'Code', format: 'number' },
    { key: 'message', label: 'Message' },
    { key: 'request_id', label: 'Request ID' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'task_id', label: 'Task ID' },
        { key: 'task_status', label: 'Task Status' },
        { key: 'task_status_msg', label: 'Task Status Msg' },
        {
          key: 'task_info',
          label: 'Task Info',
          children: [{ key: 'external_task_id', label: 'External Task ID' }],
        },
        {
          key: 'task_result',
          label: 'Task Result',
          children: [
            {
              key: 'images',
              label: 'Images',
              listItems: [
                { key: 'index', label: 'Index', format: 'number' },
                { key: 'url', label: 'URL' },
                { key: 'watermark_url', label: 'Watermark URL' },
              ],
            },
          ],
        },
        { key: 'created_at', label: 'Created At', format: 'number' },
        { key: 'updated_at', label: 'Updated At', format: 'number' },
        { key: 'final_unit_deduction', label: 'Final Unit Deduction' },
      ],
    },
  ],
};

export const cometapiKlingCreateOmniVideoOutputSchema: OutputSchema = {
  fields: [
    { key: 'code', label: 'Code', format: 'number' },
    { key: 'message', label: 'Message' },
    { key: 'request_id', label: 'Request ID' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'task_id', label: 'Task ID' },
        { key: 'task_status', label: 'Task Status' },
        {
          key: 'task_info',
          label: 'Task Info',
          children: [{ key: 'external_task_id', label: 'External Task ID' }],
        },
        { key: 'task_status_msg', label: 'Task Status Msg' },
        { key: 'created_at', label: 'Created At', format: 'number' },
        { key: 'updated_at', label: 'Updated At', format: 'number' },
      ],
    },
  ],
};

export const cometapiKlingExpandImageOutputSchema: OutputSchema = {
  fields: [
    { key: 'code', label: 'Code', format: 'number' },
    { key: 'message', label: 'Message' },
    { key: 'request_id', label: 'Request ID' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'task_id', label: 'Task ID' },
        { key: 'task_status', label: 'Task Status' },
        { key: 'task_status_msg', label: 'Task Status Msg' },
        {
          key: 'task_info',
          label: 'Task Info',
          children: [{ key: 'external_task_id', label: 'External Task ID' }],
        },
        { key: 'task_result', label: 'Task Result' },
        { key: 'created_at', label: 'Created At', format: 'number' },
        { key: 'updated_at', label: 'Updated At', format: 'number' },
      ],
    },
  ],
};

export const cometapiKlingExtendVideoOutputSchema: OutputSchema = {
  fields: [
    { key: 'code', label: 'Code', format: 'number' },
    { key: 'message', label: 'Message' },
    { key: 'request_id', label: 'Request ID' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'task_id', label: 'Task ID' },
        { key: 'task_status', label: 'Task Status' },
        { key: 'task_status_msg', label: 'Task Status Msg' },
        {
          key: 'task_info',
          label: 'Task Info',
          children: [
            {
              key: 'parent_video',
              label: 'Parent Video',
              children: [
                { key: 'id', label: 'ID' },
                { key: 'url', label: 'URL' },
                { key: 'duration', label: 'Duration' },
              ],
            },
          ],
        },
        {
          key: 'task_result',
          label: 'Task Result',
          children: [
            {
              key: 'videos',
              label: 'Videos',
              labelKey: 'id',
              listItems: [
                { key: 'id', label: 'ID' },
                { key: 'url', label: 'URL' },
                { key: 'duration', label: 'Duration' },
              ],
            },
          ],
        },
        { key: 'created_at', label: 'Created At', format: 'number' },
        { key: 'updated_at', label: 'Updated At', format: 'number' },
      ],
    },
  ],
};

export const cometapiKlingGetOmniVideoOutputSchema: OutputSchema = {
  fields: [
    { key: 'code', label: 'Code', format: 'number' },
    { key: 'message', label: 'Message' },
    { key: 'request_id', label: 'Request ID' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'task_id', label: 'Task ID' },
        { key: 'task_status', label: 'Task Status' },
        { key: 'task_status_msg', label: 'Task Status Msg' },
        { key: 'task_info', label: 'Task Info' },
        {
          key: 'task_result',
          label: 'Task Result',
          children: [
            {
              key: 'videos',
              label: 'Videos',
              labelKey: 'id',
              listItems: [
                { key: 'id', label: 'ID' },
                { key: 'url', label: 'URL' },
                { key: 'duration', label: 'Duration' },
                { key: 'watermark_url', label: 'Watermark URL' },
              ],
            },
          ],
        },
        { key: 'created_at', label: 'Created At', format: 'number' },
        { key: 'updated_at', label: 'Updated At', format: 'number' },
        { key: 'final_unit_deduction', label: 'Final Unit Deduction' },
      ],
    },
  ],
};

export const cometapiKlingGetTaskOutputSchema: OutputSchema = {
  fields: [
    { key: 'task_id', label: 'Task ID' },
    { key: 'task_status', label: 'Task Status' },
    { key: 'status', label: 'Status' },
    { key: 'task_status_msg', label: 'Task Status Msg' },
    { key: 'task_info', label: 'Task Info' },
    {
      key: 'task_result',
      label: 'Task Result',
      children: [
        {
          key: 'videos',
          label: 'Videos',
          labelKey: 'id',
          listItems: [
            { key: 'id', label: 'ID' },
            { key: 'url', label: 'URL', format: 'url' },
            { key: 'watermark_url', label: 'Watermark URL', format: 'url' },
            { key: 'duration', label: 'Duration' },
          ],
        },
      ],
    },
    {
      key: 'watermark_info',
      label: 'Watermark Info',
      children: [{ key: 'enabled', label: 'Enabled', format: 'boolean' }],
    },
    { key: 'created_at', label: 'Created At', format: 'number' },
    { key: 'updated_at', label: 'Updated At', format: 'number' },
    { key: 'final_unit_deduction', label: 'Final Unit Deduction' },
    {
      key: 'final_balance_deduction',
      label: 'Final Balance Deduction',
      children: [
        { key: 'quota', label: 'Quota' },
        { key: 'list_price', label: 'List Price' },
      ],
    },
  ],
};

export const cometapiKlingIdentifyFaceOutputSchema: OutputSchema = {
  fields: [
    { key: 'code', label: 'Code', format: 'number' },
    { key: 'message', label: 'Message' },
    { key: 'request_id', label: 'Request ID' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'session_id', label: 'Session ID' },
        {
          key: 'face_data',
          label: 'Face Data',
          listItems: [
            { key: 'face_id', label: 'Face ID' },
            { key: 'face_image', label: 'Face Image' },
            { key: 'start_time', label: 'Start Time', format: 'number' },
            { key: 'end_time', label: 'End Time', format: 'number' },
          ],
        },
      ],
    },
  ],
};

export const cometapiKlingImageToVideoOutputSchema: OutputSchema = {
  fields: [
    { key: 'code', label: 'Code', format: 'number' },
    { key: 'message', label: 'Message' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'task_id', label: 'Task ID' },
        { key: 'task_status', label: 'Task Status' },
        { key: 'task_status_msg', label: 'Task Status Msg' },
        { key: 'task_info', label: 'Task Info' },
        { key: 'created_at', label: 'Created At', format: 'number' },
        { key: 'updated_at', label: 'Updated At', format: 'number' },
      ],
    },
  ],
};

export const cometapiKlingInitVideoSelectionOutputSchema: OutputSchema = {
  fields: [
    { key: 'code', label: 'Code', format: 'number' },
    { key: 'message', label: 'Message' },
    {
      key: 'data',
      label: 'Data',
      children: [{ key: 'session_id', label: 'Session ID' }],
    },
  ],
};

export const cometapiKlingRecognizeImageOutputSchema: OutputSchema = {
  fields: [
    { key: 'code', label: 'Code', format: 'number' },
    { key: 'message', label: 'Message' },
    { key: 'request_id', label: 'Request ID' },
    {
      key: 'data',
      label: 'Data',
      children: [
        {
          key: 'task_result',
          label: 'Task Result',
          children: [
            {
              key: 'images',
              label: 'Images',
              listItems: [
                { key: 'type', label: 'Type' },
                { key: 'is_contain', label: 'Is Contain', format: 'boolean' },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const cometapiKlingRouteGetTasksOutputSchema: OutputSchema = {
  fields: [
    { key: 'code', label: 'Code', format: 'number' },
    { key: 'message', label: 'Message' },
    { key: 'status', label: 'Status' },
    { key: 'request_id', label: 'Request ID' },
    {
      key: 'data',
      label: 'Data',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'status', label: 'Status' },
        { key: 'message', label: 'Message' },
        {
          key: 'outputs',
          label: 'Outputs',
          labelKey: 'id',
          listItems: [
            { key: 'id', label: 'ID' },
            { key: 'type', label: 'Type' },
            { key: 'url', label: 'URL', format: 'url' },
            { key: 'duration', label: 'Duration' },
          ],
        },
        { key: 'create_time', label: 'Create Time', format: 'number' },
        { key: 'update_time', label: 'Update Time', format: 'number' },
      ],
    },
  ],
};

export const cometapiKlingRouteImageToVideoOutputSchema: OutputSchema = {
  fields: [
    { key: 'code', label: 'Code', format: 'number' },
    { key: 'message', label: 'Message' },
    { key: 'msg', label: 'Msg' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'id', label: 'ID' },
        { key: 'status', label: 'Status' },
      ],
    },
  ],
};

export const cometapiKlingTextToSpeechOutputSchema: OutputSchema = {
  fields: [
    { key: 'code', label: 'Code', format: 'number' },
    { key: 'message', label: 'Message' },
    { key: 'request_id', label: 'Request ID' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'task_id', label: 'Task ID' },
        { key: 'task_status', label: 'Task Status' },
        { key: 'task_info', label: 'Task Info' },
        { key: 'task_status_msg', label: 'Task Status Msg' },
        { key: 'created_at', label: 'Created At', format: 'number' },
        { key: 'updated_at', label: 'Updated At', format: 'number' },
      ],
    },
  ],
};

export const cometapiKlingTextToVideoOutputSchema: OutputSchema = {
  fields: [
    { key: 'code', label: 'Code', format: 'number' },
    { key: 'message', label: 'Message' },
    { key: 'request_id', label: 'Request ID' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'task_id', label: 'Task ID' },
        { key: 'task_status', label: 'Task Status' },
        { key: 'created_at', label: 'Created At', format: 'number' },
        { key: 'updated_at', label: 'Updated At', format: 'number' },
      ],
    },
  ],
};

export const cometapiListModelsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'models',
      label: 'Models',
      labelKey: 'name',
      listItems: [
        { key: 'created', label: 'Created', format: 'number' },
        { key: 'id', label: 'ID' },
        { key: 'code', label: 'Code' },
        { key: 'provider', label: 'Provider' },
        { key: 'provider_code', label: 'Provider Code' },
        { key: 'provider_sort', label: 'Provider Sort', format: 'number' },
        { key: 'model_sort', label: 'Model Sort', format: 'number' },
        { key: 'published_at', label: 'Published At', format: 'number' },
        { key: 'description', label: 'Description' },
        { key: 'tags', label: 'Tags' },
        { key: 'name', label: 'Name' },
        { key: 'model_type', label: 'Model Type' },
        { key: 'context_length', label: 'Context Length' },
        { key: 'max_completion_tokens', label: 'Max Completion Tokens' },
        { key: 'features', label: 'Features' },
        {
          key: 'endpoints',
          label: 'Endpoints',
          children: [
            {
              key: 'openai-chat',
              label: 'Openai Chat',
              children: [
                { key: 'path', label: 'Path' },
                { key: 'method', label: 'Method' },
                { key: 'api_doc_url', label: 'API Doc URL', format: 'url' },
              ],
            },
            {
              key: 'generateContent',
              label: 'Generate Content',
              children: [
                { key: 'path', label: 'Path' },
                { key: 'method', label: 'Method' },
                { key: 'api_doc_url', label: 'API Doc URL', format: 'url' },
              ],
            },
            {
              key: 'openai-response',
              label: 'Openai Response',
              children: [
                { key: 'path', label: 'Path' },
                { key: 'method', label: 'Method' },
                { key: 'api_doc_url', label: 'API Doc URL', format: 'url' },
              ],
            },
            {
              key: 'doubao-image',
              label: 'Doubao Image',
              children: [
                { key: 'path', label: 'Path' },
                { key: 'method', label: 'Method' },
                { key: 'api_doc_url', label: 'API Doc URL', format: 'url' },
              ],
            },
            {
              key: 'anthropic-messages',
              label: 'Anthropic Messages',
              children: [
                { key: 'path', label: 'Path' },
                { key: 'method', label: 'Method' },
                { key: 'api_doc_url', label: 'API Doc URL', format: 'url' },
              ],
            },
            {
              key: 'openai-image',
              label: 'Openai Image',
              children: [
                { key: 'path', label: 'Path' },
                { key: 'method', label: 'Method' },
                { key: 'api_doc_url', label: 'API Doc URL', format: 'url' },
              ],
            },
            {
              key: 'openai-image-edit',
              label: 'Openai Image Edit',
              children: [
                { key: 'path', label: 'Path' },
                { key: 'method', label: 'Method' },
                { key: 'api_doc_url', label: 'API Doc URL', format: 'url' },
              ],
            },
            {
              key: 'openai-completion',
              label: 'Openai Completion',
              children: [
                { key: 'path', label: 'Path' },
                { key: 'method', label: 'Method' },
                { key: 'api_doc_url', label: 'API Doc URL', format: 'url' },
              ],
            },
            {
              key: 'gemini',
              label: 'Gemini',
              children: [
                { key: 'path', label: 'Path' },
                { key: 'method', label: 'Method' },
                { key: 'api_doc_url', label: 'API Doc URL', format: 'url' },
              ],
            },
            {
              key: 'gemini-stream',
              label: 'Gemini Stream',
              children: [
                { key: 'path', label: 'Path' },
                { key: 'method', label: 'Method' },
                { key: 'api_doc_url', label: 'API Doc URL', format: 'url' },
              ],
            },
            {
              key: 'chat',
              label: 'Chat',
              children: [
                { key: 'path', label: 'Path' },
                { key: 'method', label: 'Method' },
                { key: 'api_doc_url', label: 'API Doc URL', format: 'url' },
              ],
            },
            {
              key: 'messages',
              label: 'Messages',
              children: [
                { key: 'path', label: 'Path' },
                { key: 'method', label: 'Method' },
                { key: 'api_doc_url', label: 'API Doc URL', format: 'url' },
              ],
            },
            {
              key: 'responses',
              label: 'Responses',
              children: [
                { key: 'path', label: 'Path' },
                { key: 'method', label: 'Method' },
                { key: 'api_doc_url', label: 'API Doc URL', format: 'url' },
              ],
            },
            {
              key: 'image_editing',
              label: 'Image Editing',
              children: [
                { key: 'path', label: 'Path' },
                { key: 'method', label: 'Method' },
                { key: 'api_doc_url', label: 'API Doc URL', format: 'url' },
              ],
            },
            {
              key: 'image_generation',
              label: 'Image Generation',
              children: [
                { key: 'path', label: 'Path' },
                { key: 'method', label: 'Method' },
                { key: 'api_doc_url', label: 'API Doc URL', format: 'url' },
              ],
            },
            {
              key: 'openai-video',
              label: 'Openai Video',
              children: [
                { key: 'path', label: 'Path' },
                { key: 'method', label: 'Method' },
                { key: 'api_doc_url', label: 'API Doc URL', format: 'url' },
              ],
            },
            {
              key: 'openai-video-result',
              label: 'Openai Video Result',
              children: [
                { key: 'path', label: 'Path' },
                { key: 'method', label: 'Method' },
                { key: 'api_doc_url', label: 'API Doc URL', format: 'url' },
              ],
            },
            {
              key: 'openai-video-content',
              label: 'Openai Video Content',
              children: [
                { key: 'path', label: 'Path' },
                { key: 'method', label: 'Method' },
                { key: 'api_doc_url', label: 'API Doc URL', format: 'url' },
              ],
            },
          ],
        },
        {
          key: 'pricing',
          label: 'Pricing',
          children: [
            { key: 'currency', label: 'Currency' },
            { key: 'input', label: 'Input', format: 'number' },
            { key: 'output', label: 'Output', format: 'number' },
            { key: 'per_request', label: 'Per Request', format: 'number' },
            { key: 'per_second', label: 'Per Second', format: 'number' },
            { key: 'ratio', label: 'Ratio', format: 'number' },
            { key: 'web_search', label: 'Web Search', format: 'number' },
            { key: 'cached_input', label: 'Cached Input', format: 'number' },
            { key: 'billing_mode', label: 'Billing Mode' },
            { key: 'billing_expr', label: 'Billing Expr' },
            { key: 'cache_write', label: 'Cache Write', format: 'number' },
          ],
        },
        {
          key: 'show_official_price',
          label: 'Show Official Price',
          format: 'boolean',
        },
        {
          key: 'official_pricing',
          label: 'Official Pricing',
          children: [
            { key: 'currency', label: 'Currency' },
            { key: 'input', label: 'Input', format: 'number' },
            { key: 'output', label: 'Output', format: 'number' },
            { key: 'per_request', label: 'Per Request', format: 'number' },
            { key: 'per_second', label: 'Per Second' },
          ],
        },
        { key: 'icon', label: 'Icon', format: 'image' },
        { key: 'latest_model_name', label: 'Latest Model Name' },
        { key: 'pricing_content', label: 'Pricing Content' },
        {
          key: 'matched_models',
          label: 'Matched Models',
          children: [
            {
              key: 'auto',
              label: 'Auto',
              children: [
                { key: 'currency', label: 'Currency' },
                { key: 'input', label: 'Input', format: 'number' },
                { key: 'output', label: 'Output', format: 'number' },
                { key: 'per_request', label: 'Per Request' },
                { key: 'per_second', label: 'Per Second' },
                { key: 'ratio', label: 'Ratio', format: 'number' },
              ],
            },
            {
              key: 'auto-high',
              label: 'Auto High',
              children: [
                { key: 'currency', label: 'Currency' },
                { key: 'input', label: 'Input', format: 'number' },
                { key: 'output', label: 'Output', format: 'number' },
                { key: 'per_request', label: 'Per Request' },
                { key: 'per_second', label: 'Per Second' },
                { key: 'ratio', label: 'Ratio', format: 'number' },
              ],
            },
            {
              key: 'deepseek-v4-flash-vision',
              label: 'Deepseek V4 Flash Vision',
              children: [
                { key: 'currency', label: 'Currency' },
                { key: 'input', label: 'Input' },
                { key: 'output', label: 'Output' },
                { key: 'per_request', label: 'Per Request' },
                { key: 'per_second', label: 'Per Second' },
                { key: 'billing_mode', label: 'Billing Mode' },
                { key: 'billing_expr', label: 'Billing Expr' },
                { key: 'ratio', label: 'Ratio', format: 'number' },
                { key: 'web_search', label: 'Web Search', format: 'number' },
              ],
            },
            {
              key: 'deepseek-v4-flash-vision-exp',
              label: 'Deepseek V4 Flash Vision Exp',
              children: [
                { key: 'currency', label: 'Currency' },
                { key: 'input', label: 'Input' },
                { key: 'output', label: 'Output' },
                { key: 'per_request', label: 'Per Request' },
                { key: 'per_second', label: 'Per Second' },
                { key: 'billing_mode', label: 'Billing Mode' },
                { key: 'billing_expr', label: 'Billing Expr' },
                { key: 'ratio', label: 'Ratio', format: 'number' },
                { key: 'web_search', label: 'Web Search', format: 'number' },
              ],
            },
            {
              key: 'deepseek-v4-pro',
              label: 'Deepseek V4 Pro',
              children: [
                { key: 'currency', label: 'Currency' },
                { key: 'input', label: 'Input' },
                { key: 'output', label: 'Output' },
                { key: 'per_request', label: 'Per Request' },
                { key: 'per_second', label: 'Per Second' },
                { key: 'billing_mode', label: 'Billing Mode' },
                { key: 'billing_expr', label: 'Billing Expr' },
                { key: 'ratio', label: 'Ratio', format: 'number' },
                { key: 'web_search', label: 'Web Search', format: 'number' },
                {
                  key: 'discount',
                  label: 'Discount',
                  children: [
                    { key: 'model_id', label: 'Model ID', format: 'number' },
                    { key: 'eligibility', label: 'Eligibility' },
                    { key: 'discount_type', label: 'Discount Type' },
                    {
                      key: 'discount_value',
                      label: 'Discount Value',
                      format: 'number',
                    },
                    { key: 'pay_ratio', label: 'Pay Ratio', format: 'number' },
                    {
                      key: 'start_time_utc',
                      label: 'Start Time UTC',
                      format: 'datetime',
                    },
                    {
                      key: 'end_time_utc',
                      label: 'End Time UTC',
                      format: 'datetime',
                    },
                    { key: 'expired', label: 'Expired', format: 'boolean' },
                    {
                      key: 'not_started',
                      label: 'Not Started',
                      format: 'boolean',
                    },
                    {
                      key: 'within_valid_period',
                      label: 'Within Valid Period',
                      format: 'boolean',
                    },
                    { key: 'enabled', label: 'Enabled', format: 'boolean' },
                  ],
                },
              ],
            },
            {
              key: 'deepseek-v4-pro-0813',
              label: 'Deepseek V4 Pro 0813',
              children: [
                { key: 'currency', label: 'Currency' },
                { key: 'input', label: 'Input' },
                { key: 'output', label: 'Output' },
                { key: 'per_request', label: 'Per Request' },
                { key: 'per_second', label: 'Per Second' },
                { key: 'billing_mode', label: 'Billing Mode' },
                { key: 'billing_expr', label: 'Billing Expr' },
                { key: 'ratio', label: 'Ratio', format: 'number' },
                { key: 'web_search', label: 'Web Search', format: 'number' },
              ],
            },
            {
              key: 'wan3.0-prime',
              label: 'Wan3 0 Prime',
              value: "['wan3.0-prime']",
              children: [
                { key: 'currency', label: 'Currency' },
                { key: 'input', label: 'Input' },
                { key: 'output', label: 'Output' },
                { key: 'per_request', label: 'Per Request' },
                { key: 'per_second', label: 'Per Second', format: 'number' },
                { key: 'ratio', label: 'Ratio', format: 'number' },
              ],
            },
            {
              key: 'deepseek-v4-flash',
              label: 'Deepseek V4 Flash',
              children: [
                { key: 'currency', label: 'Currency' },
                { key: 'input', label: 'Input' },
                { key: 'output', label: 'Output' },
                { key: 'per_request', label: 'Per Request' },
                { key: 'per_second', label: 'Per Second' },
                { key: 'billing_mode', label: 'Billing Mode' },
                { key: 'billing_expr', label: 'Billing Expr' },
                { key: 'ratio', label: 'Ratio', format: 'number' },
                { key: 'web_search', label: 'Web Search', format: 'number' },
              ],
            },
            {
              key: 'deepseek-v4-flash-0731',
              label: 'Deepseek V4 Flash 0731',
              children: [
                { key: 'currency', label: 'Currency' },
                { key: 'input', label: 'Input' },
                { key: 'output', label: 'Output' },
                { key: 'per_request', label: 'Per Request' },
                { key: 'per_second', label: 'Per Second' },
                { key: 'billing_mode', label: 'Billing Mode' },
                { key: 'billing_expr', label: 'Billing Expr' },
                { key: 'ratio', label: 'Ratio', format: 'number' },
                { key: 'web_search', label: 'Web Search', format: 'number' },
              ],
            },
            {
              key: 'qwen-image-3.0',
              label: 'Qwen Image 3 0',
              value: "['qwen-image-3.0']",
              children: [
                { key: 'currency', label: 'Currency' },
                { key: 'input', label: 'Input' },
                { key: 'output', label: 'Output' },
                { key: 'per_request', label: 'Per Request', format: 'number' },
                { key: 'per_second', label: 'Per Second' },
                { key: 'ratio', label: 'Ratio', format: 'number' },
              ],
            },
            {
              key: 'qwen-image-3.0-pro',
              label: 'Qwen Image 3 0 Pro',
              value: "['qwen-image-3.0-pro']",
              children: [
                { key: 'currency', label: 'Currency' },
                { key: 'input', label: 'Input' },
                { key: 'output', label: 'Output' },
                { key: 'per_request', label: 'Per Request', format: 'number' },
                { key: 'per_second', label: 'Per Second' },
                { key: 'ratio', label: 'Ratio', format: 'number' },
              ],
            },
            {
              key: 'wan3.0',
              label: 'Wan3 0',
              value: "['wan3.0']",
              children: [
                { key: 'currency', label: 'Currency' },
                { key: 'input', label: 'Input' },
                { key: 'output', label: 'Output' },
                { key: 'per_request', label: 'Per Request' },
                { key: 'per_second', label: 'Per Second', format: 'number' },
                { key: 'ratio', label: 'Ratio', format: 'number' },
              ],
            },
          ],
        },
        { key: 'cover', label: 'Cover' },
        { key: 'api_doc_url', label: 'API Doc URL', format: 'url' },
        { key: 'upcoming', label: 'Upcoming', format: 'boolean' },
        { key: 'is_popular', label: 'Is Popular', format: 'boolean' },
        { key: 'is_router', label: 'Is Router', format: 'boolean' },
        {
          key: 'discount',
          label: 'Discount',
          children: [
            { key: 'model_id', label: 'Model ID', format: 'number' },
            { key: 'eligibility', label: 'Eligibility' },
            { key: 'discount_type', label: 'Discount Type' },
            {
              key: 'discount_value',
              label: 'Discount Value',
              format: 'number',
            },
            { key: 'pay_ratio', label: 'Pay Ratio', format: 'number' },
            {
              key: 'start_time_utc',
              label: 'Start Time UTC',
              format: 'datetime',
            },
            { key: 'end_time_utc', label: 'End Time UTC', format: 'datetime' },
            { key: 'expired', label: 'Expired', format: 'boolean' },
            { key: 'not_started', label: 'Not Started', format: 'boolean' },
            {
              key: 'within_valid_period',
              label: 'Within Valid Period',
              format: 'boolean',
            },
            { key: 'enabled', label: 'Enabled', format: 'boolean' },
          ],
        },
        {
          key: 'estimated_response_time_ms',
          label: 'Estimated Response Time Ms',
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'total', label: 'Total', format: 'number' },
  ],
};

export const cometapiMidjourneyActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'code', label: 'Code', format: 'number' },
    { key: 'description', label: 'Description' },
    { key: 'result', label: 'Result' },
    {
      key: 'properties',
      label: 'Properties',
      children: [
        { key: 'numberOfQueues', label: 'Number Of Queues', format: 'number' },
        { key: 'discordInstanceId', label: 'Discord Instance ID' },
        { key: 'discordChannelId', label: 'Discord Channel ID' },
      ],
    },
  ],
};

export const cometapiMidjourneyBlendOutputSchema: OutputSchema = {
  fields: [
    { key: 'code', label: 'Code', format: 'number' },
    { key: 'description', label: 'Description' },
    { key: 'properties', label: 'Properties' },
    { key: 'result', label: 'Result', format: 'number' },
  ],
};

export const cometapiMidjourneyCreateVideoOutputSchema: OutputSchema = {
  fields: [
    { key: 'code', label: 'Code', format: 'number' },
    { key: 'description', label: 'Description' },
    { key: 'result', label: 'Result' },
    {
      key: 'properties',
      label: 'Properties',
      children: [{ key: 'prompt', label: 'Prompt' }],
    },
  ],
};

export const cometapiMidjourneyEditImageOutputSchema: OutputSchema = {
  fields: [
    { key: 'code', label: 'Code', format: 'number' },
    { key: 'description', label: 'Description' },
    { key: 'result', label: 'Result' },
  ],
};

export const cometapiMidjourneyGetTaskOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'action', label: 'Action' },
    { key: 'customId', label: 'Custom ID' },
    { key: 'botType', label: 'Bot Type' },
    { key: 'prompt', label: 'Prompt' },
    { key: 'promptEn', label: 'Prompt En' },
    { key: 'description', label: 'Description' },
    { key: 'state', label: 'State' },
    { key: 'submitTime', label: 'Submit Time', format: 'number' },
    { key: 'startTime', label: 'Start Time', format: 'number' },
    { key: 'finishTime', label: 'Finish Time', format: 'number' },
    { key: 'imageUrl', label: 'Image URL' },
    { key: 'videoUrl', label: 'Video URL' },
    { key: 'status', label: 'Status' },
    { key: 'progress', label: 'Progress' },
    { key: 'failReason', label: 'Fail Reason' },
    {
      key: 'buttons',
      label: 'Buttons',
      labelKey: 'label',
      listItems: [
        { key: 'customId', label: 'Custom ID' },
        { key: 'emoji', label: 'Emoji' },
        { key: 'label', label: 'Label' },
        { key: 'type', label: 'Type', format: 'number' },
        { key: 'style', label: 'Style', format: 'number' },
      ],
    },
    { key: 'maskBase64', label: 'Mask Base64' },
    {
      key: 'properties',
      label: 'Properties',
      children: [
        { key: 'finalPrompt', label: 'Final Prompt' },
        { key: 'finalZhPrompt', label: 'Final Zh Prompt' },
      ],
    },
  ],
};

export const cometapiMidjourneyImagineOutputSchema: OutputSchema = {
  fields: [
    { key: 'code', label: 'Code', format: 'number' },
    { key: 'description', label: 'Description' },
    {
      key: 'properties',
      label: 'Properties',
      children: [
        { key: 'discordChannelId', label: 'Discord Channel ID' },
        { key: 'discordInstanceId', label: 'Discord Instance ID' },
      ],
    },
    { key: 'result', label: 'Result' },
  ],
};

export const cometapiMidjourneyListTasksOutputSchema: OutputSchema = {
  itemLabel: '{id}',
  fields: [
    {
      key: 'tasks',
      label: 'Tasks',
      value: '',
      listItems: [
        { key: 'action', label: 'Action' },
        {
          key: 'buttons',
          label: 'Buttons',
          labelKey: 'label',
          listItems: [
            { key: 'customId', label: 'Custom ID' },
            { key: 'emoji', label: 'Emoji' },
            { key: 'label', label: 'Label' },
            { key: 'style', label: 'Style', format: 'number' },
            { key: 'type', label: 'Type', format: 'number' },
          ],
        },
        { key: 'description', label: 'Description' },
        { key: 'failReason', label: 'Fail Reason' },
        { key: 'finishTime', label: 'Finish Time', format: 'number' },
        { key: 'id', label: 'ID' },
        { key: 'imageUrl', label: 'Image URL' },
        { key: 'progress', label: 'Progress' },
        { key: 'prompt', label: 'Prompt' },
        { key: 'promptEn', label: 'Prompt En' },
        { key: 'properties', label: 'Properties' },
        { key: 'startTime', label: 'Start Time', format: 'number' },
        { key: 'state', label: 'State' },
        { key: 'status', label: 'Status' },
        { key: 'submitTime', label: 'Submit Time', format: 'number' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const cometapiMinimaxCreateVideoOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'file',
      label: 'File',
      children: [
        { key: 'file_id', label: 'File ID', format: 'number' },
        { key: 'bytes', label: 'Bytes', format: 'number' },
        { key: 'created_at', label: 'Created At', format: 'number' },
        { key: 'filename', label: 'Filename' },
        { key: 'purpose', label: 'Purpose' },
        { key: 'download_url', label: 'Download URL' },
      ],
    },
    { key: 'task_id', label: 'Task ID' },
    {
      key: 'base_resp',
      label: 'Base Resp',
      children: [
        { key: 'status_code', label: 'Status Code', format: 'number' },
        { key: 'status_msg', label: 'Status Msg' },
      ],
    },
  ],
};

export const cometapiMinimaxGetFileOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'file',
      label: 'File',
      children: [
        { key: 'file_id', label: 'File ID', format: 'number' },
        { key: 'bytes', label: 'Bytes', format: 'number' },
        { key: 'created_at', label: 'Created At', format: 'number' },
        { key: 'filename', label: 'Filename' },
        { key: 'purpose', label: 'Purpose' },
        { key: 'download_url', label: 'Download URL' },
      ],
    },
    {
      key: 'base_resp',
      label: 'Base Resp',
      children: [
        { key: 'status_code', label: 'Status Code', format: 'number' },
        { key: 'status_msg', label: 'Status Msg' },
      ],
    },
  ],
};

export const cometapiMinimaxGetVideoTaskOutputSchema: OutputSchema = {
  fields: [
    { key: 'code', label: 'Code' },
    { key: 'message', label: 'Message' },
    {
      key: 'data',
      label: 'Data',
      children: [
        { key: 'task_id', label: 'Task ID' },
        { key: 'action', label: 'Action' },
        { key: 'status', label: 'Status' },
        { key: 'fail_reason', label: 'Fail Reason' },
        { key: 'result_url', label: 'Result URL' },
        { key: 'submit_time', label: 'Submit Time', format: 'number' },
        { key: 'start_time', label: 'Start Time', format: 'number' },
        { key: 'finish_time', label: 'Finish Time', format: 'number' },
        { key: 'progress', label: 'Progress' },
        {
          key: 'data',
          label: 'Data',
          children: [
            {
              key: 'file',
              label: 'File',
              children: [
                { key: 'bytes', label: 'Bytes', format: 'number' },
                { key: 'file_id', label: 'File ID', format: 'number' },
                { key: 'purpose', label: 'Purpose' },
                { key: 'filename', label: 'Filename' },
                { key: 'created_at', label: 'Created At', format: 'number' },
                { key: 'download_url', label: 'Download URL' },
              ],
            },
            { key: 'task_id', label: 'Task ID' },
            {
              key: 'base_resp',
              label: 'Base Resp',
              children: [
                { key: 'status_msg', label: 'Status Msg' },
                { key: 'status_code', label: 'Status Code', format: 'number' },
              ],
            },
          ],
        },
      ],
    },
    { key: 'status', label: 'Status' },
    { key: 'file_id', label: 'File ID' },
    { key: 'task_id', label: 'Task ID' },
    { key: 'video_width', label: 'Video Width', format: 'number' },
    { key: 'video_height', label: 'Video Height', format: 'number' },
  ],
};

export const cometapiReplicateCreatePredictionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'model', label: 'Model' },
    { key: 'version', label: 'Version' },
    { key: 'input', label: 'Input' },
    { key: 'logs', label: 'Logs' },
    { key: 'output', label: 'Output' },
    { key: 'data_removed', label: 'Data Removed', format: 'boolean' },
    { key: 'error', label: 'Error' },
    { key: 'source', label: 'Source' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created At' },
    {
      key: 'urls',
      label: 'URLs',
      children: [
        { key: 'cancel', label: 'Cancel' },
        { key: 'get', label: 'Get' },
        { key: 'stream', label: 'Stream' },
        { key: 'web', label: 'Web' },
      ],
    },
  ],
};

export const cometapiReplicateGetPredictionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'logs', label: 'Logs' },
    {
      key: 'urls',
      label: 'URLs',
      children: [
        { key: 'get', label: 'Get' },
        { key: 'cancel', label: 'Cancel' },
        { key: 'stream', label: 'Stream' },
      ],
    },
    { key: 'error', label: 'Error' },
    { key: 'input', label: 'Input' },
    { key: 'model', label: 'Model' },
    { key: 'output', label: 'Output' },
    { key: 'status', label: 'Status' },
    {
      key: 'metrics',
      label: 'Metrics',
      children: [
        { key: 'image_count', label: 'Image Count', format: 'number' },
        { key: 'predict_time', label: 'Predict Time', format: 'number' },
      ],
    },
    { key: 'version', label: 'Version' },
    { key: 'created_at', label: 'Created At' },
    { key: 'started_at', label: 'Started At' },
    { key: 'completed_at', label: 'Completed At' },
    { key: 'data_removed', label: 'Data Removed', format: 'boolean' },
  ],
};

export const cometapiRunwayCharacterPerformanceOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'output', label: 'Output' },
    { key: 'failure', label: 'Failure' },
    { key: 'failureCode', label: 'Failure Code' },
    {
      key: 'estimatedCost',
      label: 'Estimated Cost',
      children: [{ key: 'credits', label: 'Credits', format: 'number' }],
    },
    {
      key: 'cost',
      label: 'Cost',
      children: [{ key: 'credits', label: 'Credits', format: 'number' }],
    },
  ],
};

export const cometapiRunwayGetTaskOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'progress', label: 'Progress', format: 'number' },
    { key: 'output', label: 'Output' },
    { key: 'failure', label: 'Failure' },
    { key: 'failureCode', label: 'Failure Code' },
    {
      key: 'estimatedCost',
      label: 'Estimated Cost',
      children: [{ key: 'credits', label: 'Credits', format: 'number' }],
    },
    {
      key: 'cost',
      label: 'Cost',
      children: [{ key: 'credits', label: 'Credits', format: 'number' }],
    },
  ],
};
