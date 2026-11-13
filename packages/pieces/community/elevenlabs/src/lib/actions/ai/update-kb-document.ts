import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetKbDocumentOutputSchema } from '../../output-schemas';

export const updateKbDocument = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_update_kb_document',
  outputSchema: elevenlabsGetKbDocumentOutputSchema,
  displayName: 'Update KB Document',
  description: 'Rename or edit a knowledge base document',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Renames a knowledge base document or replaces its text content. Only the supplied fields change.',
    idempotent: true,
  },
  props: {
    documentationId: Property.ShortText({ displayName: 'Documentation ID', description: 'The document id from List KB Documents or a create action', required: true }),
    name: Property.ShortText({ displayName: 'Name', description: 'New name', required: false }),
    content: Property.LongText({ displayName: 'Content', description: 'New text content', required: false }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.PATCH,
      path: `/v1/convai/knowledge-base/${encodeURIComponent(propsValue.documentationId)}`,
      body: elevenlabsClient.compact({ values: { name: propsValue.name, content: propsValue.content } }),
    });
    return response ?? { success: true };
  },
});
