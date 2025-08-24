import { createAction, Property } from '@activepieces/pieces-framework';
import { pineconeAuth } from '../common/auth';
import { pineconeCommon, PineconeVector } from '../common';

export const upsertVectorAction = createAction({
  auth: pineconeAuth,
  name: 'pinecone_upsert_vector',
  displayName: 'Upsert Vector',
  description: 'Insert or update vectors in a Pinecone index',
  props: {
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the index to upsert vectors into',
      required: true,
    }),
    vectors: Property.Json({
      displayName: 'Vectors',
      description: 'Array of vectors to upsert. Each vector should have id, values, and optionally metadata',
      required: true,
    }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'The namespace to upsert vectors into (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { indexName, vectors, namespace } = context.propsValue;

    try {
      // Get the index host
      const indexHost = await pineconeCommon.getIndexHost(context.auth, indexName);
      
      if (!indexHost) {
        return {
          success: false,
          error: `Index "${indexName}" not found or not ready`,
        };
      }

      // Validate vectors
      const validation = pineconeCommon.validateVectors(vectors);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }
      
      const vectorsArray = validation.vectors!;

      const result = await pineconeCommon.upsertVectors(
        context.auth,
        indexHost,
        vectorsArray,
        namespace
      );

      return {
        success: true,
        upsertedCount: result.upsertedCount || vectorsArray.length,
        result,
        message: `Successfully upserted ${vectorsArray.length} vector(s) to index "${indexName}"`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.response?.data || error.message,
        message: `Failed to upsert vectors to index "${indexName}"`,
      };
    }
  },
});