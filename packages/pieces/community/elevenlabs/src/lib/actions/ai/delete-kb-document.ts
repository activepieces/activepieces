import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsDeleteKbDocumentOutputSchema } from '../../output-schemas';

export const deleteKbDocument = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_delete_kb_document',
  outputSchema: elevenlabsDeleteKbDocumentOutputSchema,
  displayName: 'Delete KB Document',
  description: 'Delete a knowledge base document or folder',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Permanently deletes a knowledge base document or folder. Set force to delete it even when agents depend on it. A second call on the same id fails.',
    idempotent: false,
  },
  props: {
    documentationId: Property.ShortText({ displayName: 'Documentation ID', description: 'The document id from List KB Documents or a create action', required: true }),
    force: Property.StaticDropdown({ displayName: 'Force', description: 'Delete even if agents use it', required: false, options: { options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] } }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.DELETE,
      path: `/v1/convai/knowledge-base/${encodeURIComponent(propsValue.documentationId)}`,
      queryParams: { force: propsValue.force },
    });
    return response ?? { success: true };
  },
});
