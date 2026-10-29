import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsCreateToolOutputSchema } from '../../output-schemas';

export const createTool = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_create_tool',
  outputSchema: elevenlabsCreateToolOutputSchema,
  displayName: 'Create Tool',
  description: 'Create an agent tool',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Creates a webhook, client or system tool for agents from a tool_config JSON and returns its id. Not idempotent: each call creates another tool.',
    idempotent: false,
  },
  props: {
    toolConfig: Property.Json({ displayName: 'Tool Config', description: 'Tool configuration, such as {"type": "webhook", "name": "lookup_order", "description": "...", "api_schema": {"url": "https://...", "method": "GET"}}', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.POST,
      path: `/v1/convai/tools`,
      body: elevenlabsClient.compact({ values: { tool_config: propsValue.toolConfig } }),
    });
    return response ?? { success: true };
  },
});
