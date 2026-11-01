import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetKbDocumentOutputSchema } from '../../output-schemas';

export const getKbDocument = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_kb_document',
  outputSchema: elevenlabsGetKbDocumentOutputSchema,
  displayName: 'Get KB Document',
  description: 'Get a knowledge base document',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns a knowledge base document with its type, metadata and folder path.',
    idempotent: true,
  },
  props: {
    documentationId: Property.ShortText({ displayName: 'Documentation ID', description: 'The document id from List KB Documents or a create action', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/convai/knowledge-base/${encodeURIComponent(propsValue.documentationId)}`,
    });
    return response ?? { success: true };
  },
});
