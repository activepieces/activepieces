import { createAction, Property } from '@activepieces/pieces-framework';
import { localaiAuth } from '../auth';
import { localaiCommon } from '../common';
import { createEmbeddingOutputSchema } from '../output-schemas';

export const createEmbedding = createAction({
  audience: 'both',
  auth: localaiAuth,
  name: 'create_embedding',
  classification: 'READ',
  displayName: 'Create Embedding',
  description: 'Turn text into a vector for semantic search or clustering.',
  aiMetadata: { description: 'Converts one block of text into a numeric embedding vector with an embedding model installed on the connected self-hosted LocalAI server, for storing in a vector database or for semantic search, clustering, and RAG, without the text leaving your infrastructure. The model must be an embedding model (for example mxbai-embed-large or nomic-embed), not a chat model: call list_models when unsure. Returns the vector and its length; one input per call, so loop to embed several texts. Deterministic for the same model and text, so repeat calls are idempotent.', idempotent: true },
  props: {
    model: localaiCommon.modelDropdown({
      displayName: 'Model',
      description: 'An embedding model installed on your LocalAI server.',
    }),
    input: Property.LongText({
      displayName: 'Text',
      description: 'The text to turn into a vector.',
      required: true,
    }),
  },
  outputSchema: createEmbeddingOutputSchema,
  async run({ auth, propsValue }) {
    try {
      const response = await localaiCommon.client(auth).embeddings.create({
        model: propsValue.model,
        input: propsValue.input,
      });
      const embedding = response.data[0]?.embedding ?? [];
      return {
        model: response.model,
        dimensions: embedding.length,
        embedding,
      };
    } catch (error) {
      throw localaiCommon.friendlyError(error);
    }
  },
});
