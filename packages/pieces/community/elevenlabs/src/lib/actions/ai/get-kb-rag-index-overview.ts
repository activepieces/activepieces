import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetKbRagIndexOverviewOutputSchema } from '../../output-schemas';

export const getKbRagIndexOverview = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_kb_rag_index_overview',
  outputSchema: elevenlabsGetKbRagIndexOverviewOutputSchema,
  displayName: 'Get KB RAG Index Overview',
  description: 'Get RAG index storage usage',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the total RAG index storage used and available, per embedding model.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/convai/knowledge-base/rag-index`,
    });
    return response ?? { success: true };
  },
});
