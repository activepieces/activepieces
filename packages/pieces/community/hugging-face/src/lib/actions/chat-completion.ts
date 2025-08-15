import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';

interface ChatCompletionRequest {
  model: string;
  messages: unknown[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: unknown[];
  stream?: boolean;
  seed?: number;
  response_format?: {
    type: string;
    json_schema?: {
      name: string;
      description: string;
      schema: unknown;
      strict: boolean;
    };
  };
  tools?: unknown[];
  tool_choice?: string;
  tool_prompt?: string;
  logprobs?: boolean;
  top_logprobs?: number;
}

export const chatCompletion = createAction({
  name: 'chat_completion',
  auth: huggingFaceAuth,
  displayName: 'Chat Completion',
  description: 'Generate assistant replies using a chat-style LLM on Hugging Face with support for conversational LLMs and VLMs',
  props: {
    model: Property.ShortText({
      displayName: 'Model',
      description: 'Hugging Face chat completion model to use (e.g., google/gemma-2-2b-it, Qwen/Qwen2.5-VL-7B-Instruct)',
      required: true,
      defaultValue: 'google/gemma-2-2b-it',
    }),
    messages: Property.Array({
      displayName: 'Messages',
      description: 'Array of conversation messages with role and content',
      required: true,
    }),
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      description: 'Maximum number of tokens to generate',
      required: false,
      defaultValue: 100,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'Sampling temperature (0.0 to 2.0)',
      required: false,
      defaultValue: 0.7,
    }),
    topP: Property.Number({
      displayName: 'Top P',
      description: 'Nucleus sampling parameter (0.0 to 1.0)',
      required: false,
      defaultValue: 0.9,
    }),
    frequencyPenalty: Property.Number({
      displayName: 'Frequency Penalty',
      description: 'Frequency penalty (-2.0 to 2.0)',
      required: false,
      defaultValue: 0,
    }),
    presencePenalty: Property.Number({
      displayName: 'Presence Penalty',
      description: 'Presence penalty (-2.0 to 2.0)',
      required: false,
      defaultValue: 0,
    }),
    stop: Property.Array({
      displayName: 'Stop Sequences',
      description: 'Up to 4 sequences where generation will stop',
      required: false,
    }),
    stream: Property.Checkbox({
      displayName: 'Stream',
      description: 'Whether to stream the response',
      required: false,
      defaultValue: false,
    }),
    seed: Property.Number({
      displayName: 'Seed',
      description: 'Random seed for reproducible generation',
      required: false,
    }),
    responseFormat: Property.StaticDropdown({
      displayName: 'Response Format',
      description: 'Format of the response',
      required: false,
      options: {
        options: [
          { label: 'Text', value: 'text' },
          { label: 'JSON Schema', value: 'json_schema' },
          { label: 'JSON Object', value: 'json_object' },
        ],
      },
    }),
    jsonSchema: Property.Json({
      displayName: 'JSON Schema',
      description: 'JSON Schema for response format (required when response format is json_schema)',
      required: false,
    }),
    strictSchema: Property.Checkbox({
      displayName: 'Strict Schema',
      description: 'Enable strict schema adherence',
      required: false,
      defaultValue: false,
    }),
    tools: Property.Array({
      displayName: 'Tools',
      description: 'List of tools the model may call',
      required: false,
    }),
    toolChoice: Property.StaticDropdown({
      displayName: 'Tool Choice',
      description: 'How the model should handle tool calls',
      required: false,
      options: {
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'None', value: 'none' },
          { label: 'Required', value: 'required' },
        ],
      },
    }),
    toolPrompt: Property.LongText({
      displayName: 'Tool Prompt',
      description: 'Prompt to be appended before the tools',
      required: false,
    }),
    logprobs: Property.Checkbox({
      displayName: 'Log Probabilities',
      description: 'Return log probabilities of output tokens',
      required: false,
      defaultValue: false,
    }),
    topLogprobs: Property.Number({
      displayName: 'Top Log Probabilities',
      description: 'Number of most likely tokens to return (0-5)',
      required: false,
      defaultValue: 0,
    }),
  },
  async run(context) {
    const apiKey = context.auth as string;
    const {
      model,
      messages,
      maxTokens,
      temperature,
      topP,
      frequencyPenalty,
      presencePenalty,
      stop,
      stream,
      seed,
      responseFormat,
      jsonSchema,
      strictSchema,
      tools,
      toolChoice,
      toolPrompt,
      logprobs,
      topLogprobs,
    } = context.propsValue;

    // Build request body
    const requestBody: ChatCompletionRequest = {
      model,
      messages,
    };

    // Add optional parameters
    if (maxTokens !== undefined) requestBody.max_tokens = maxTokens;
    if (temperature !== undefined) requestBody.temperature = temperature;
    if (topP !== undefined) requestBody.top_p = topP;
    if (frequencyPenalty !== undefined) requestBody.frequency_penalty = frequencyPenalty;
    if (presencePenalty !== undefined) requestBody.presence_penalty = presencePenalty;
    if (stop !== undefined) requestBody.stop = stop;
    if (stream !== undefined) requestBody.stream = stream;
    if (seed !== undefined) requestBody.seed = seed;
    if (logprobs !== undefined) requestBody.logprobs = logprobs;
    if (topLogprobs !== undefined) requestBody.top_logprobs = topLogprobs;

    // Handle response format
    if (responseFormat) {
      if (responseFormat === 'json_schema' && jsonSchema) {
        requestBody.response_format = {
          type: 'json_schema',
          json_schema: {
            name: 'response',
            description: 'The response format',
            schema: jsonSchema,
            strict: strictSchema || false,
          },
        };
      } else if (responseFormat === 'json_object') {
        requestBody.response_format = { type: 'json_object' };
      } else if (responseFormat === 'text') {
        requestBody.response_format = { type: 'text' };
      }
    }

    // Handle tools
    if (tools && tools.length > 0) {
      requestBody.tools = tools;
      if (toolChoice) requestBody.tool_choice = toolChoice;
      if (toolPrompt) requestBody.tool_prompt = toolPrompt;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://router.huggingface.co/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: requestBody,
    });

    return response.body;
  },
}); 