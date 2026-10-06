import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsDeleteKbDocumentOutputSchema } from '../../output-schemas';

export const deleteKbRagIndex = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_delete_kb_rag_index',
  outputSchema: elevenlabsDeleteKbDocumentOutputSchema,
  displayName: 'Delete KB RAG Index',
  description: 'Delete a RAG index',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description: 'Deletes one RAG index of a knowledge base document. The rag_index_id comes from Get KB Document RAG Indexes.',
    idempotent: false,
  },
  props: {
    documentationId: Property.ShortText({ displayName: 'Documentation ID', description: 'The document id from List KB Documents or a create action', required: true }),
    ragIndexId: Property.ShortText({ displayName: 'Rag Index ID', description: 'The index id from Get KB Document RAG Indexes', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.DELETE,
      path: `/v1/convai/knowledge-base/${encodeURIComponent(propsValue.documentationId)}/rag-index/${encodeURIComponent(propsValue.ragIndexId)}`,
    });
    return response ?? { success: true };
  },
});
