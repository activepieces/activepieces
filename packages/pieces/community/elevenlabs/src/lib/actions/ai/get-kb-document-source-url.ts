import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetKbDocumentSourceUrlOutputSchema } from '../../output-schemas';

export const getKbDocumentSourceUrl = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_kb_document_source_url',
  outputSchema: elevenlabsGetKbDocumentSourceUrlOutputSchema,
  displayName: 'Get KB Document Source URL',
  description: 'Get a signed URL of the original file',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns a signed URL to download the original file of an uploaded knowledge base document.',
    idempotent: true,
  },
  props: {
    documentationId: Property.ShortText({ displayName: 'Documentation ID', description: 'The document id from List KB Documents or a create action', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/convai/knowledge-base/${encodeURIComponent(propsValue.documentationId)}/source-file-url`,
    });
    return response ?? { success: true };
  },
});
