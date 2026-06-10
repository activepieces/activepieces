import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { parallelAuth } from '../auth';
import { parallelClient } from '../common/client';

export const chatCompletionAction = createAction({
  auth: parallelAuth,
  name: 'chat_completion',
  displayName: 'Chat Completion',
  description:
    "Get a chat completion using a Parallel processor. OpenAI-compatible interface; processor names like 'speed', 'base', 'core', 'pro', 'ultra' map to Parallel tiers.",
  props: {
    model: Property.ShortText({
      displayName: 'Model / Processor',
      description:
        'Model name to use (e.g. `speed`, `base`, `core`, `pro`, `ultra`).',
      required: true,
      defaultValue: 'speed',
    }),
    system: Property.LongText({
      displayName: 'System Message',
      description: 'Optional system message to set the assistant behaviour.',
      required: false,
    }),
    user_message: Property.LongText({
      displayName: 'User Message',
      description: 'The user prompt to send.',
      required: true,
    }),
    response_format: Property.StaticDropdown({
      displayName: 'Response Format',
      description: 'Whether the model should return free text or a JSON object.',
      required: false,
      defaultValue: 'text',
      options: {
        options: [
          { label: 'Text', value: 'text' },
          { label: 'JSON Object', value: 'json_object' },
          { label: 'JSON Schema', value: 'json_schema' },
        ],
      },
    }),
    json_schema: Property.Json({
      displayName: 'JSON Schema',
      description:
        'Used when Response Format is "JSON Schema". Provide a JSON Schema object.',
      required: false,
    }),
    json_schema_name: Property.ShortText({
      displayName: 'JSON Schema Name',
      description: 'Name for the JSON schema (required when Response Format is JSON Schema).',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const messages: Array<Record<string, unknown>> = [];
    if (props.system) {
      messages.push({ role: 'system', content: props.system });
    }
    messages.push({ role: 'user', content: props.user_message });

    const body: Record<string, unknown> = {
      model: props.model,
      messages,
    };

    if (props.response_format === 'json_object') {
      body['response_format'] = { type: 'json_object' };
    } else if (props.response_format === 'json_schema') {
      if (!props.json_schema || typeof props.json_schema !== 'object') {
        throw new Error('JSON Schema is required when Response Format is "JSON Schema".');
      }
      body['response_format'] = {
        type: 'json_schema',
        json_schema: {
          name: props.json_schema_name ?? 'response',
          schema: props.json_schema,
        },
      };
    }

    return await parallelClient.request({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1beta/chat/completions',
      body,
    });
  },
});
