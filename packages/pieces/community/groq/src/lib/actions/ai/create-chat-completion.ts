import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { groqAuth } from '../../auth';
import { groqAiProps } from '../../common/ai-props';
import { groqClient } from '../../common/client';
import { groqCreateChatCompletionOutputSchema } from '../../output-schemas';

export const createChatCompletionAction = createAction({
  auth: groqAuth,
  name: 'groq_create_chat_completion',
  outputSchema: groqCreateChatCompletionOutputSchema,
  displayName: 'Create Chat Completion',
  description: 'Send a conversation to a Groq model and get its reply.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Sends a list of chat messages to a Groq-hosted model and returns the completion, including tool calls when tools are given and structured JSON when a JSON schema is set. Stateless: pass the whole conversation each time. Use Create Response for the Responses API, and Create Transcription for audio input; model IDs come from List Models.',
    idempotent: false,
  },
  props: {
    modelId: groqAiProps.modelId({ required: true }),
    messages: Property.Json({
      displayName: 'Messages',
      description:
        'The conversation as a JSON array of messages, oldest first, e.g. [{"role": "system", "content": "Be brief."}, {"role": "user", "content": "Hello"}]. Roles: system, user, assistant, tool.',
      required: true,
    }),
    maxCompletionTokens: Property.Number({
      displayName: 'Max Completion Tokens',
      description: 'Upper limit on generated tokens, reasoning included. Defaults to the model maximum.',
      required: false,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'Sampling temperature from 0 to 2. Lower is more focused. Defaults to 1.',
      required: false,
    }),
    topP: Property.Number({
      displayName: 'Top P',
      description: 'Nucleus sampling from 0 to 1. Set this or Temperature, not both. Defaults to 1.',
      required: false,
    }),
    stop: Property.Array({
      displayName: 'Stop Sequences',
      description: 'Up to 4 strings that end generation. The reply does not include them.',
      required: false,
    }),
    seed: Property.Number({
      displayName: 'Seed',
      description: 'Best-effort deterministic sampling: repeat calls with the same seed and inputs tend to match.',
      required: false,
    }),
    jsonSchema: Property.Json({
      displayName: 'JSON Schema',
      description:
        'Forces a JSON reply matching this schema (Structured Outputs), as {"name": "...", "schema": {...}, "strict": true}. Only some models support it. Leave empty for plain text.',
      required: false,
    }),
    tools: Property.Json({
      displayName: 'Tools',
      description:
        'Functions the model may call, as a JSON array in the OpenAI format: [{"type": "function", "function": {"name": "...", "description": "...", "parameters": {...}}}].',
      required: false,
    }),
    toolChoice: Property.StaticDropdown({
      displayName: 'Tool Choice',
      description: '"auto" lets the model decide, "required" forces a tool call, "none" forbids one. Defaults to "auto" when tools are given.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Auto', value: 'auto' },
          { label: 'Required', value: 'required' },
          { label: 'None', value: 'none' },
        ],
      },
    }),
    reasoningEffort: Property.StaticDropdown({
      displayName: 'Reasoning Effort',
      description: 'For reasoning models only: none, default, low, medium or high. Supported values differ per model.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'None', value: 'none' },
          { label: 'Default', value: 'default' },
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
        ],
      },
    }),
    reasoningFormat: Property.StaticDropdown({
      displayName: 'Reasoning Format',
      description: 'For reasoning models only: "parsed" returns reasoning in its own field, "raw" keeps it in the content, "hidden" drops it.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Parsed', value: 'parsed' },
          { label: 'Raw', value: 'raw' },
          { label: 'Hidden', value: 'hidden' },
        ],
      },
    }),
    additionalFields: groqAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    return await groqClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/chat/completions',
      body: {
        ...propsValue.additionalFields,
        model: propsValue.modelId,
        messages: propsValue.messages,
        max_completion_tokens: propsValue.maxCompletionTokens,
        temperature: propsValue.temperature,
        top_p: propsValue.topP,
        stop: propsValue.stop && propsValue.stop.length > 0 ? propsValue.stop : undefined,
        seed: propsValue.seed,
        response_format: propsValue.jsonSchema
          ? { type: 'json_schema', json_schema: propsValue.jsonSchema }
          : undefined,
        tools: propsValue.tools,
        tool_choice: propsValue.toolChoice,
        reasoning_effort: propsValue.reasoningEffort,
        reasoning_format: propsValue.reasoningFormat,
      },
    });
  },
});
