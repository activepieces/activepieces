import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetKbDocumentContentOutputSchema } from '../../output-schemas';

export const getKbDocumentContent = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_kb_document_content',
  outputSchema: elevenlabsGetKbDocumentContentOutputSchema,
  displayName: 'Get KB Document Content',
  description: 'Get the text content of a knowledge base document',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the extracted text content of a knowledge base document.',
    idempotent: true,
  },
  props: {
    documentationId: Property.ShortText({ displayName: 'Documentation ID', description: 'The document id from List KB Documents or a create action', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/convai/knowledge-base/${encodeURIComponent(propsValue.documentationId)}/content`,
    });
    return response ?? { success: true };
  },
});
