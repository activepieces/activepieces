import { createAction, Property } from '@activepieces/pieces-framework';
import { pineconeAuth } from '../common/auth';
import { pineconeCommon } from '../common';

export const getVectorAction = createAction({
  auth: pineconeAuth,
  name: 'pinecone_get_vector',
  displayName: 'Get Vector',
  description: 'Retrieve a specific vector by ID from a Pinecone index',
  props: {
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the index to retrieve the vector from',
      required: true,
    }),
    id: Property.ShortText({
      displayName: 'Vector ID',
      description: 'The ID of the vector to retrieve',
      required: true,
    }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'The namespace to retrieve the vector from (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { indexName, id, namespace } = context.propsValue;

    try {
      // Get the index host
      const indexHost = await pineconeCommon.getIndexHost(context.auth, indexName);
      
      if (!indexHost) {
        return {
          success: false,
          error: `Index "${indexName}" not found or not ready`,
        };
      }

      const result = await pineconeCommon.getVector(
        context.auth,
        indexHost,
        id,
        namespace
      );

      // Check if vector was found
      const vectors = result.vectors || {};
      const vector = vectors[id];

      if (!vector) {
        return {
          success: false,
          error: `Vector with ID "${id}" not found in index "${indexName}"${namespace ? ` namespace "${namespace}"` : ''}`,
        };
      }

      return {
        success: true,
        vector: {
          id,
          values: vector.values,
          metadata: vector.metadata,
        },
        message: `Successfully retrieved vector "${id}" from index "${indexName}"`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.response?.data || error.message,
        message: `Failed to retrieve vector "${id}" from index "${indexName}"`,
      };
    }
  },
});