import { createAction, Property } from '@activepieces/pieces-framework';
import { pineconeAuth } from '../common/auth';
import { pineconeCommon } from '../common';

export const searchIndexAction = createAction({
  auth: pineconeAuth,
  name: 'pinecone_search_index',
  displayName: 'Get Index Statistics',
  description: 'Get statistics and information about a Pinecone index',
  props: {
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the index to get statistics for',
      required: true,
    }),
    filter: Property.Json({
      displayName: 'Metadata Filter',
      description: 'Filter statistics by metadata (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { indexName, filter } = context.propsValue;

    try {
      // Get the index host
      const indexHost = await pineconeCommon.getIndexHost(context.auth, indexName);
      
      if (!indexHost) {
        return {
          success: false,
          error: `Index "${indexName}" not found or not ready`,
        };
      }

      // Get index description
      const indexInfo = await pineconeCommon.describeIndex(context.auth, indexName);
      
      // Get index statistics
      const stats = await pineconeCommon.getIndexStats(
        context.auth,
        indexHost,
        filter
      );

      return {
        success: true,
        indexInfo: {
          name: indexInfo.database?.name,
          dimension: indexInfo.database?.dimension,
          metric: indexInfo.database?.metric,
          pods: indexInfo.database?.pods,
          replicas: indexInfo.database?.replicas,
          podType: indexInfo.database?.pod_type,
          status: indexInfo.status,
          host: indexInfo.status?.host,
          state: indexInfo.status?.state,
        },
        statistics: {
          totalVectorCount: stats.totalVectorCount,
          namespaces: stats.namespaces || {},
          dimension: stats.dimension,
          indexFullness: stats.indexFullness,
        },
        message: `Successfully retrieved statistics for index "${indexName}"`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.response?.data || error.message,
        message: `Failed to retrieve statistics for index "${indexName}"`,
      };
    }
  },
});