import { createAction, Property } from '@activepieces/pieces-framework';
import { propsValidation } from '@activepieces/pieces-common';
import { pineconeAuth } from '../common/auth';
import { pineconeCommon } from '../common';
import { z } from 'zod';

export const searchVectorsAction = createAction({
  auth: pineconeAuth,
  name: 'pinecone_search_vectors',
  displayName: 'Search Vectors',
  description: 'Search for similar vectors in a Pinecone index',
  props: {
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the index to search in',
      required: true,
    }),
    queryVector: Property.Json({
      displayName: 'Query Vector',
      description: 'The query vector to search for (array of numbers)',
      required: true,
    }),
    topK: Property.Number({
      displayName: 'Top K Results',
      description: 'Number of most similar vectors to return',
      required: false,
      defaultValue: 10,
    }),
    includeValues: Property.Checkbox({
      displayName: 'Include Vector Values',
      description: 'Include the actual vector values in the response',
      required: false,
      defaultValue: false,
    }),
    includeMetadata: Property.Checkbox({
      displayName: 'Include Metadata',
      description: 'Include metadata in the response',
      required: false,
      defaultValue: true,
    }),
    filter: Property.Json({
      displayName: 'Metadata Filter',
      description: 'Filter results by metadata (optional)',
      required: false,
    }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'The namespace to search in (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { indexName, queryVector, topK, includeValues, includeMetadata, filter, namespace } = context.propsValue;

    try {
      // Get the index host
      const indexHost = await pineconeCommon.getIndexHost(context.auth, indexName);
      
      if (!indexHost) {
        return {
          success: false,
          error: `Index "${indexName}" not found or not ready`,
        };
      }

      // Validate query vector and other params
      await propsValidation.validateZod(context.propsValue, {
        queryVector: z.array(z.number()).min(1, 'Query vector cannot be empty'),
        topK: z.number().int().min(1).max(10000).optional(),
      });

      const queryVectorArray = queryVector as unknown as number[];

      const result = await pineconeCommon.queryVectors(
        context.auth,
        indexHost,
        queryVectorArray,
        topK || 10,
        includeValues || false,
        includeMetadata !== false, // Default to true
        filter,
        namespace
      );

      return {
        success: true,
        matches: result.matches,
        totalMatches: result.matches.length,
        query: {
          topK: topK || 10,
          includeValues: includeValues || false,
          includeMetadata: includeMetadata !== false,
          namespace,
          filter,
        },
        message: `Found ${result.matches.length} similar vectors in index "${indexName}"`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.response?.data || error.message,
        message: `Failed to search vectors in index "${indexName}"`,
      };
    }
  },
});