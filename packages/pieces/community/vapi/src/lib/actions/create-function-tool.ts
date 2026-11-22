import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vapiAuth } from '../auth';
import { vapiApi, vapiUtils } from '../common/vapi-api';
import { vapiOutputSchemas } from '../common/output-schemas';

const FUNCTION_NAME_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

export const createFunctionTool = createAction({
  auth: vapiAuth,
  name: 'create_function_tool',
  classification: 'WRITE',
  displayName: 'Create Function Tool',
  description: 'Create a function tool that assistants can call during a conversation; Vapi sends the call to your server URL.',
  audience: 'human',
  outputSchema: vapiOutputSchemas.tool,
  props: {
    name: Property.ShortText({
      displayName: 'Function Name',
      description: 'Letters, digits, underscores and dashes only, up to 64 characters (e.g. get_order_status).',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Tells the assistant when and how to use this function.',
      required: false,
    }),
    parameters: Property.Json({
      displayName: 'Parameters (JSON Schema)',
      description: 'JSON Schema object for the function arguments, e.g. {"type":"object","properties":{"orderId":{"type":"string"}},"required":["orderId"]}.',
      required: false,
    }),
    serverUrl: Property.ShortText({
      displayName: 'Server URL',
      description: 'HTTPS URL Vapi calls when the assistant uses this function.',
      required: true,
    }),
  },
  async run(context) {
    const { name, description, parameters, serverUrl } = context.propsValue;
    const functionName = name.trim();
    if (!FUNCTION_NAME_PATTERN.test(functionName)) {
      throw new Error('Function Name may contain only letters, digits, underscores and dashes (max 64 characters).');
    }
    let url: URL;
    try {
      url = new URL(serverUrl.trim());
    } catch {
      throw new Error('Server URL must be a valid URL, e.g. https://example.com/vapi.');
    }
    if (url.protocol !== 'https:') {
      throw new Error('Server URL must start with https://.');
    }
    const fn: Record<string, unknown> = { name: functionName };
    if (description && description.trim() !== '') fn['description'] = description;
    const schema = vapiUtils.parseJsonObject({ value: parameters, fieldName: 'Parameters (JSON Schema)' });
    if (schema !== undefined) fn['parameters'] = schema;
    const tool = await vapiApi.request<unknown>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/tool',
      operation: 'create tool',
      body: { type: 'function', function: fn, server: { url: url.toString() } },
    });
    return vapiUtils.stripSecrets(tool);
  },
});
