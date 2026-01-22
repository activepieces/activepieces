import { createAction, Property } from '@activepieces/pieces-framework';
import { createPineconeClientFromAuth } from '../common/pinecone-client';
import { pineconeAuth } from '../../index';

export const getVector = createAction({
  auth: pineconeAuth,
  name: 'get_vector',
  displayName: 'Get a Vector',
  description: 'Look up and return vectors by ID from a namespace.',
  props: {
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the index to fetch vectors from',
      required: true,
    }),
    indexHost: Property.ShortText({
      displayName: 'Index Host',
      description: 'The unique host for the index (optional, see Pinecone docs for targeting an index)',
      required: false,
    }),
    ids: Property.Array({
      displayName: 'Vector IDs',
      description: 'The vector IDs to fetch. Does not accept values containing spaces (e.g., ["id-1", "id-2"])',
      required: true,
    }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'The namespace containing the vectors to fetch (e.g., "example-namespace")',
      required: false,
      defaultValue: 'example-namespace',
    }),

  },
  async run(context) {
    const {
      indexName,
      indexHost,
      ids,
      namespace,
    } = context.propsValue;

    if (!indexName) {
      throw new Error('You must provide an index name to fetch vectors.');
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new Error('You must provide at least one vector ID to fetch.');
    }

    const invalidIds = ids.filter((id: any) => typeof id === 'string' && id.includes(' '));
    if (invalidIds.length > 0) {
      throw new Error(`Vector IDs cannot contain spaces. Invalid IDs: ${invalidIds.join(', ')}`);
    }

    const pc = createPineconeClientFromAuth(context.auth);

    try {

      const index = indexHost ? pc.index(indexName, indexHost) : pc.index(indexName);


      const fetchResult = namespace 
        ? await index.namespace(namespace).fetch(ids as string[])
        : await index.fetch(ids as string[]);

      const records = fetchResult.records || {};
      const vectorCount = Object.keys(records).length;
      const foundIds = Object.keys(records);
      const notFoundIds = (ids as string[]).filter(id => !foundIds.includes(id));

      return {
        success: true,
        indexName: indexName,
        namespace: fetchResult.namespace,
        usage: fetchResult.usage,
        vectors: records,
        summary: {
          requested: ids.length,
          found: vectorCount,
          foundIds: foundIds,
          ...(notFoundIds.length > 0 && { notFoundIds: notFoundIds }),
        },
        message: `Successfully fetched ${vectorCount} out of ${ids.length} requested vector(s)`,
      };
    } catch (caught) {
      console.log('Failed to fetch vector(s).', caught);
      
      if (caught instanceof Error) {
        const error = caught as any;
        
        if (error.status === 400 || error.code === 400) {
          return {
            success: false,
            error: 'Bad Request',
            code: 400,
            message: error.message || 'The request body included invalid request parameters.',
            details: error.details || [],
            requestedIds: ids,
            indexName: indexName,
            namespace: namespace || 'default',
          };
        }
        
        if (error.status >= 400 && error.status < 500) {
          return {
            success: false,
            error: 'Client Error',
            code: error.status || error.code,
            message: error.message || 'An unexpected client error occurred.',
            details: error.details || [],
            requestedIds: ids,
            indexName: indexName,
            namespace: namespace || 'default',
          };
        }
        
        if (error.status >= 500 || error.code >= 500) {
          return {
            success: false,
            error: 'Server Error',
            code: error.status || error.code,
            message: error.message || 'An unexpected server error occurred.',
            details: error.details || [],
            requestedIds: ids,
            indexName: indexName,
            namespace: namespace || 'default',
          };
        }
      }
      
      return {
        success: false,
        error: 'Unknown Error',
        message: caught instanceof Error ? caught.message : 'An unexpected error occurred while fetching vectors.',
        requestedIds: ids,
        indexName: indexName,
        namespace: namespace || 'default',
      };
    }
  },
});