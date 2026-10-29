import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsGetKbDocumentRagIndexesOutputSchema } from '../../output-schemas';

export const getKbDocumentRagIndexes = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_get_kb_document_rag_indexes',
  outputSchema: elevenlabsGetKbDocumentRagIndexesOutputSchema,
  displayName: 'Get KB Document RAG Indexes',
  description: 'List the RAG indexes of a document',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns the RAG indexes of a knowledge base document with their model and build status. Poll this after Create KB RAG Index.',
    idempotent: true,
  },
  props: {
    documentationId: Property.ShortText({ displayName: 'Documentation ID', description: 'The document id from List KB Documents or a create action', required: true }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/convai/knowledge-base/${encodeURIComponent(propsValue.documentationId)}/rag-index`,
    });
    return response ?? { success: true };
  },
});
