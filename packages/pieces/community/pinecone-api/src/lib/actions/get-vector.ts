import { createAction, Property } from '@activepieces/pieces-framework';
import { createPineconeClientFromAuth } from '../common/pinecone-client';
import { pineconeAuth } from '../../index';

export const getVector = createAction({
  auth: pineconeAuth,
  name: 'get_vector',
  displayName: 'Get Vector',
  description: 'Look up and return vectors by ID from a single namespace. The returned vectors include the vector data and/or metadata.',
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
    includeValues: Property.Checkbox({
      displayName: 'Include Values',
      description: 'Whether to include vector values in the response',
      required: false,
      defaultValue: true,
    }),
    includeMetadata: Property.Checkbox({
      displayName: 'Include Metadata',
      description: 'Whether to include vector metadata in the response',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const {
      indexName,
      indexHost,
      ids,
      namespace,
      includeValues,
      includeMetadata,
    } = context.propsValue;

    // Validation following SDK pattern
    if (!indexName) {
      throw new Error('You must provide an index name to fetch vectors.');
    }

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new Error('You must provide at least one vector ID to fetch.');
    }

    // Validate IDs don't contain spaces (as per API requirement)
    const invalidIds = ids.filter((id: any) => typeof id === 'string' && id.includes(' '));
    if (invalidIds.length > 0) {
      throw new Error(`Vector IDs cannot contain spaces. Invalid IDs: ${invalidIds.join(', ')}`);
    }

    // Initialize Pinecone client following SDK documentation
    const pc = createPineconeClientFromAuth(context.auth);

    try {
      // Target the index following SDK pattern
      // const index = pc.index("INDEX_NAME", "INDEX_HOST")
      const index = indexHost ? pc.index(indexName, indexHost) : pc.index(indexName);

      // Fetch vectors following SDK pattern
      // const fetchResult = await index.namespace('example-namespace').fetch(['id-1', 'id-2']);
      const fetchResult = namespace 
        ? await index.namespace(namespace).fetch(ids as string[])
        : await index.fetch(ids as string[]);

      // Process the response to match the documented structure
      const records = fetchResult?.records || {};
      const vectorCount = Object.keys(records).length;
      const foundIds = Object.keys(records);
      const notFoundIds = (ids as string[]).filter(id => !foundIds.includes(id));

      return {
        success: true,
        indexName: indexName,
        namespace: fetchResult?.namespace || namespace || 'default',
        usage: fetchResult?.usage || { readUnits: 0 },
        records: records,
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
      
      // Handle specific API error responses following documentation
      if (caught instanceof Error) {
        const error = caught as any;
        
        // Handle 400 Bad Request - Invalid request parameters
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
        
        // Handle 4XX Client Errors - Unexpected error response
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
        
        // Handle 5XX Server Errors - Unexpected error response
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
      
      // Handle any other errors
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