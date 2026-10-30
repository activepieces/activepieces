import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsDeleteKbDocumentOutputSchema } from '../../output-schemas';

export const deleteTool = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_delete_tool',
  outputSchema: elevenlabsDeleteKbDocumentOutputSchema,
  displayName: 'Delete Tool',
  description: 'Delete an agent tool',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes a tool. Set force to delete it even when agents use it. A second call on the same id fails.',
    idempotent: false,
  },
  props: {
    toolId: Property.ShortText({ displayName: 'Tool ID', description: 'The tool id from List Tools or Create Tool', required: true }),
    force: Property.StaticDropdown({ displayName: 'Force', description: 'Delete even if agents use it', required: false, options: { options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] } }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.DELETE,
      path: `/v1/convai/tools/${encodeURIComponent(propsValue.toolId)}`,
      queryParams: { force: propsValue.force },
    });
    return response ?? { success: true };
  },
});
