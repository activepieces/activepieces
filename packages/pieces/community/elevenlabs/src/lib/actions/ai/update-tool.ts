import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsCreateToolOutputSchema } from '../../output-schemas';

export const updateTool = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_update_tool',
  outputSchema: elevenlabsCreateToolOutputSchema,
  displayName: 'Update Tool',
  description: 'Change an agent tool',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Replaces the configuration of a tool. tool_config is required in full, so start from Get Tool. Re-applying the same config is safe.',
    idempotent: true,
  },
  props: {
    toolId: Property.ShortText({ displayName: 'Tool ID', description: 'The tool id from List Tools or Create Tool', required: true }),
    toolConfig: Property.Json({ displayName: 'Tool Config', description: 'Full tool configuration, from Get Tool', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.PATCH,
      path: `/v1/convai/tools/${encodeURIComponent(propsValue.toolId)}`,
      body: elevenlabsClient.compact({ values: { tool_config: propsValue.toolConfig } }),
    });
    return response ?? { success: true };
  },
});
