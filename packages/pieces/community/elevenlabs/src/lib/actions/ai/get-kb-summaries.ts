import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetKbSummariesOutputSchema } from '../../output-schemas';

export const getKbSummaries = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_kb_summaries',
  outputSchema: elevenlabsGetKbSummariesOutputSchema,
  displayName: 'Get KB Summaries',
  description: 'Get the summary of a knowledge base document',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the summary of one knowledge base document by id.',
    idempotent: true,
  },
  props: {
    documentId: Property.ShortText({ displayName: 'Document ID', description: 'A document id from List KB Documents', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/convai/knowledge-base/summaries`,
      queryParams: { document_ids: propsValue.documentId },
    });
    return response ?? { success: true };
  },
});
