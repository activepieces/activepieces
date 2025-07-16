import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { edenApiCall } from '../common/client';
import { edenAuth } from '../common/auth';

export const generateAction = createAction({
  name: 'edenai-generate',
  auth: edenAuth,
  displayName: 'Generate',
  description: 'Interact with various LLM providers via Eden AI’s unified endpoint.',
  props: {
    projectId: Property.ShortText({
      displayName: 'Project ID',
      description: 'Your Eden AI project UUID.',
      required: true,
    }),
    model: Property.ShortText({
      displayName: 'Model',
      description: 'The OpenAI-compatible model name, e.g., "gpt-4", "gpt-3.5-turbo".',
      required: true,
    }),
    reasoning_effort: Property.StaticDropdown({
      displayName: 'Reasoning Effort',
      description: 'Controls how deeply the model reasons through your prompt.',
      required: false,
      options: {
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
        ],
      },
    }),
    messages: Property.Json({
      displayName: 'Messages',
      description: `Conversation history in the format: [{"role": "user", "content": [{"type": "text", "text": "Hello"}]}]`,
      required: true,
    }),
    metadata: Property.Json({
      displayName: 'Metadata (optional)',
      description: 'Key-value metadata for the chat request.',
      required: false,
    }),
    frequency_penalty: Property.Number({
      displayName: 'Frequency Penalty',
      description: 'Reduces repetition. Range: -2.0 to 2.0',
      required: false,
    }),
    logit_bias: Property.Json({
      displayName: 'Logit Bias',
      description: 'Adjust token probabilities. Format: {"50256": -100, "15": 5}',
      required: false,
    }),
    logprobs: Property.Checkbox({
      displayName: 'Logprobs',
      description: 'Return log probabilities for top tokens.',
      required: false,
      defaultValue: false,
    }),
    top_logprobs: Property.Number({
      displayName: 'Top Logprobs',
      description: 'Number of top logprobs to return (0–20)',
      required: false,
    }),
    max_completion_tokens: Property.Number({
      displayName: 'Max Completion Tokens',
      description: 'Max tokens to generate in the completion.',
      required: false,
    }),
    n: Property.Number({
      displayName: 'N (Number of Completions)',
      description: 'Number of completions to generate (default is 1)',
      required: false,
    }),
    modalities: Property.Json({
      displayName: 'Modalities',
      description: 'List of supported input/output modalities, e.g., ["text", "image"]',
      required: false,
    }),
    prediction: Property.Json({
      displayName: 'Prediction Metadata',
      description: 'Optional predictive metadata, e.g., {"confidence_score": 0.85}',
      required: false,
    }),
    audio: Property.Json({
      displayName: 'Audio Metadata',
      description: 'Optional audio-related metadata, e.g., {"language": "en-US"}',
      required: false,
    }),
    presence_penalty: Property.Number({
      displayName: 'Presence Penalty',
      description: 'Promotes topic diversity. Range: -2.0 to 2.0',
      required: false,
    }),
    response_format: Property.Json({
      displayName: 'Response Format',
      description: 'Format for the completion response, e.g., {"type": "json_object"}',
      required: false,
    }),
    seed: Property.Number({
      displayName: 'Seed',
      description: 'For deterministic/random result control.',
      required: false,
    }),
    service_tier: Property.StaticDropdown({
      displayName: 'Service Tier',
      description: 'Choose the appropriate service tier.',
      required: false,
      options: {
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'Default', value: 'default' },
        ],
      },
    }),
    stop: Property.Json({
      displayName: 'Stop Sequences',
      description: 'List of strings that stop model generation.',
      required: false,
    }),
    stream: Property.Checkbox({
      displayName: 'Stream',
      description: 'Enable streaming responses.',
      required: false,
      defaultValue: false,
    }),
    stream_options: Property.Json({
      displayName: 'Stream Options',
      description: 'Extra config for streamed responses, e.g., {"include_usage": true}',
      required: false,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'Controls randomness (0 = deterministic, 2 = very creative)',
      required: false,
    }),
    top_p: Property.Number({
      displayName: 'Top P',
      description: 'Top-p (nucleus) sampling threshold. Default is 1.',
      required: false,
    }),
    tools: Property.Json({
      displayName: 'Tools',
      description: 'Tool list, e.g., [{"type": "function", "function": {...}}]',
      required: false,
    }),
    tool_choice: Property.ShortText({
      displayName: 'Tool Choice',
      description: 'Tool usage strategy: "auto", "none", or specific tool name',
      required: false,
    }),
    parallel_tool_calls: Property.Checkbox({
      displayName: 'Parallel Tool Calls',
      description: 'Allow parallel tool usage.',
      required: false,
    }),
    user: Property.ShortText({
      displayName: 'User Identifier',
      description: 'Unique user ID to help trace requests.',
      required: false,
    }),
    function_call: Property.ShortText({
      displayName: 'Function Call',
      description: 'Control function invocation (auto, none, or function name)',
      required: false,
    }),
    functions: Property.Json({
      displayName: 'Functions',
      description: 'List of callable functions available to the model.',
      required: false,
    }),
    thinking: Property.Json({
      displayName: 'Claude Thinking',
      description: 'Extended thinking config for Claude, e.g., {"type":"enabled","budget_tokens": "1024"}',
      required: false,
    }),
    filter_documents: Property.Json({
      displayName: 'Document Filter',
      description: 'Metadata-based document filtering. Format: {"category": "support"}',
      required: false,
    }),
    min_score: Property.Number({
      displayName: 'Min Score',
      description: 'Minimum relevance score for responses.',
      required: false,
    }),
    k: Property.Number({
      displayName: 'Top K Results',
      description: 'How many chunks to return.',
      required: false,
    }),
    max_tokens: Property.Number({
      displayName: 'Max Tokens (Prompt + Completion)',
      description: 'Total tokens allowed including prompt.',
      required: false,
    }),
    conversation_id: Property.ShortText({
      displayName: 'Conversation ID',
      description: 'UUID for linking messages to a single thread.',
      required: false,
    }),
  },
  async run(context) {
    const {
      projectId,
      ...params
    } = context.propsValue;

    const response = await edenApiCall<any>({
      method: HttpMethod.POST,
      auth: { apiKey: context.auth },
      resourceUri: `/aiproducts/askyoda/v2/${projectId}/generate/`,
      body: params,
    });

    return response;
  },
});
