import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsCreateKbRagIndexOutputSchema } from '../../output-schemas';

export const createKbRagIndex = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_create_kb_rag_index',
  outputSchema: elevenlabsCreateKbRagIndexOutputSchema,
  displayName: 'Create KB RAG Index',
  description: 'Build a RAG index for a document',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description: 'Starts building a RAG index for a knowledge base document with the chosen embedding model and returns the index. Poll Get KB Document RAG Indexes until its status is succeeded. Re-running for the same model returns the existing index.',
    idempotent: true,
  },
  props: {
    documentationId: Property.ShortText({ displayName: 'Documentation ID', description: 'The document id from List KB Documents or a create action', required: true }),
    model: Property.StaticDropdown({ displayName: 'Model', description: 'Embedding model', required: true, options: { options: [{ label: 'e5_mistral_7b_instruct', value: 'e5_mistral_7b_instruct' }, { label: 'multilingual_e5_large_instruct', value: 'multilingual_e5_large_instruct' }] } }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> | undefined>({
      auth,
      method: HttpMethod.POST,
      path: `/v1/convai/knowledge-base/${encodeURIComponent(propsValue.documentationId)}/rag-index`,
      body: elevenlabsClient.compact({ values: { model: propsValue.model } }),
    });
    return response ?? { success: true };
  },
});
