import { createAction, Property } from '@activepieces/pieces-framework';
import { pineconeAuth } from '../common/auth';
import { pineconeCommon } from '../common';

export const deleteVectorAction = createAction({
  auth: pineconeAuth,
  name: 'pinecone_delete_vector',
  displayName: 'Delete Vector',
  description: 'Delete vectors from a Pinecone index',
  props: {
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the index to delete vectors from',
      required: true,
    }),
    ids: Property.Json({
      displayName: 'Vector IDs',
      description: 'Array of vector IDs to delete, or single ID string',
      required: true,
    }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'The namespace to delete vectors from (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { indexName, ids, namespace } = context.propsValue;

    try {
      // Get the index host
      const indexHost = await pineconeCommon.getIndexHost(context.auth, indexName);
      
      if (!indexHost) {
        return {
          success: false,
          error: `Index "${indexName}" not found or not ready`,
        };
      }

      // Handle both single ID and array of IDs
      let idsArray: string[];
      if (typeof ids === 'string') {
        idsArray = [ids];
      } else if (Array.isArray(ids)) {
        idsArray = ids;
      } else {
        return {
          success: false,
          error: 'IDs must be a string or array of strings',
        };
      }

      // Validate all IDs are strings
      for (const id of idsArray) {
        if (typeof id !== 'string') {
          return {
            success: false,
            error: 'All vector IDs must be strings',
          };
        }
      }

      const result = await pineconeCommon.deleteVectors(
        context.auth,
        indexHost,
        idsArray,
        namespace
      );

      return {
        success: true,
        deletedCount: idsArray.length,
        deletedIds: idsArray,
        result,
        message: `Successfully deleted ${idsArray.length} vector(s) from index "${indexName}"`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.response?.data || error.message,
        message: `Failed to delete vectors from index "${indexName}"`,
      };
    }
  },
});