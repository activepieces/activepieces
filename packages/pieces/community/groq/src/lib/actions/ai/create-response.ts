import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { groqAuth } from '../../auth';
import { groqAiProps } from '../../common/ai-props';
import { groqClient } from '../../common/client';
import { groqCreateResponseOutputSchema } from '../../output-schemas';

export const createResponseAction = createAction({
  auth: groqAuth,
  name: 'groq_create_response',
  outputSchema: groqCreateResponseOutputSchema,
  displayName: 'Create Response',
  description: 'Generate a model response with the Responses API.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Generates a reply from a Groq model through the OpenAI-compatible Responses API (beta), from text input plus optional instructions, tools and a JSON schema for structured output. Responses are not stored, so there is no follow-up by ID: pass the context again each call. Prefer Create Chat Completion for message-list conversations; model IDs come from List Models.',
    idempotent: false,
  },
  props: {
    modelId: groqAiProps.modelId({ required: true }),
    input: Property.LongText({
      displayName: 'Input',
      description: 'The text the model responds to. For a list of input items, leave this empty and set "input" in Additional Fields.',
      required: false,
    }),
    instructions: Property.LongText({
      displayName: 'Instructions',
      description: 'A system message placed first in the model context.',
      required: false,
    }),
    maxOutputTokens: Property.Number({
      displayName: 'Max Output Tokens',
      description: 'Upper limit on generated tokens, reasoning included.',
      required: false,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'Sampling temperature from 0 to 2. Lower is more focused. Defaults to 1.',
      required: false,
    }),
    topP: Property.Number({
      displayName: 'Top P',
      description: 'Nucleus sampling from 0 to 1. Set this or Temperature, not both.',
      required: false,
    }),
    reasoningEffort: Property.StaticDropdown({
      displayName: 'Reasoning Effort',
      description: 'For reasoning models only: low, medium or high.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Low', value: 'low' },
          { label: 'Medium', value: 'medium' },
          { label: 'High', value: 'high' },
        ],
      },
    }),
    jsonSchema: Property.Json({
      displayName: 'JSON Schema',
      description:
        'Forces a JSON reply matching this schema, as {"name": "...", "schema": {...}, "strict": true}. Leave empty for plain text.',
      required: false,
    }),
    tools: Property.Json({
      displayName: 'Tools',
      description:
        'Functions the model may call, as a JSON array: [{"type": "function", "name": "...", "description": "...", "parameters": {...}}]. Up to 128.',
      required: false,
    }),
    additionalFields: groqAiProps.additionalFields({ required: false }),
  },
  async run({ auth, propsValue }) {
    if (!propsValue.input && !propsValue.additionalFields?.['input']) {
      throw new Error('Set Input, or "input" in Additional Fields.');
    }
    return await groqClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/responses',
      body: {
        ...propsValue.additionalFields,
        model: propsValue.modelId,
        ...(propsValue.input ? { input: propsValue.input } : {}),
        instructions: propsValue.instructions,
        max_output_tokens: propsValue.maxOutputTokens,
        temperature: propsValue.temperature,
        top_p: propsValue.topP,
        reasoning: propsValue.reasoningEffort ? { effort: propsValue.reasoningEffort } : undefined,
        text: propsValue.jsonSchema
          ? { format: { type: 'json_schema', ...propsValue.jsonSchema } }
          : undefined,
        tools: propsValue.tools,
      },
    });
  },
});
