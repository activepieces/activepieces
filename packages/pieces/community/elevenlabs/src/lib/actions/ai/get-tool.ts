import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsCreateToolOutputSchema } from '../../output-schemas';

export const getTool = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_tool',
  outputSchema: elevenlabsCreateToolOutputSchema,
  displayName: 'Get Tool',
  description: 'Get an agent tool',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns one tool with its configuration and usage stats.',
    idempotent: true,
  },
  props: {
    toolId: Property.ShortText({ displayName: 'Tool ID', description: 'The tool id from List Tools or Create Tool', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/convai/tools/${encodeURIComponent(propsValue.toolId)}`,
    });
    return response ?? { success: true };
  },
});
