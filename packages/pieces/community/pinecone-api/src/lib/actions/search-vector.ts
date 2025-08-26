import { createAction, Property } from '@activepieces/pieces-framework';
import { createPineconeClientFromAuth } from '../common/pinecone-client';
import { pineconeAuth } from '../../index';

export const searchVector = createAction({
  auth: pineconeAuth,
  name: 'search_vector',
  displayName: 'Search with Vector',
  description:
    'Search a namespace using a query vector. It retrieves the ids of the most similar items in a namespace, along with their similarity scores.',
  props: {
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the index to search in',
      required: true
    }),
    indexHost: Property.ShortText({
      displayName: 'Index Host',
      description:
        'The unique host for the index (optional, see Pinecone docs for targeting an index)',
      required: false
    }),
    topK: Property.Number({
      displayName: 'Top K',
      description:
        'The number of results to return for each query (range: 1-10000)',
      required: true,
      defaultValue: 10
    }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'The namespace to query (e.g., "example-namespace")',
      required: false,
      defaultValue: 'example-namespace'
    }),
    queryMethod: Property.StaticDropdown({
      displayName: 'Query Method',
      description: 'Choose how to provide the query',
      required: true,
      options: {
        options: [
          { label: 'Query Vector', value: 'vector' },
          { label: 'Query by ID', value: 'id' }
        ]
      },
      defaultValue: 'vector'
    }),
    vector: Property.Array({
      displayName: 'Query Vector',
      description:
        'The query vector. This should be the same length as the dimension of the index (e.g., [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8])',
      required: false
    }),
    id: Property.ShortText({
      displayName: 'Query Vector ID',
      description:
        'The unique ID of the vector to be used as a query vector (max length: 512)',
      required: false
    }),
    sparseIndices: Property.Array({
      displayName: 'Sparse Indices',
      description: 'Array of indices for sparse vector data (optional)',
      required: false
    }),
    sparseValues: Property.Array({
      displayName: 'Sparse Values',
      description:
        'Array of sparse values corresponding to indices (must be same length as indices)',
      required: false
    }),
    filter: Property.Json({
      displayName: 'Metadata Filter',
      description:
        'Filter to apply using vector metadata (e.g., {"genre": {"$eq": "documentary"}})',
      required: false
    }),
    includeValues: Property.Checkbox({
      displayName: 'Include Values',
      description: 'Whether vector values are included in the response',
      required: false,
      defaultValue: false
    }),
    includeMetadata: Property.Checkbox({
      displayName: 'Include Metadata',
      description: 'Whether metadata is included in the response',
      required: false,
      defaultValue: false
    })
  },
  async run(context) {
    const {
      indexName,
      indexHost,
      topK,
      namespace,
      queryMethod,
      vector,
      id,
      sparseIndices,
      sparseValues,
      filter,
      includeValues,
      includeMetadata
    } = context.propsValue;

    // Validation following SDK pattern
    if (!indexName) {
      throw new Error('You must provide an index name to search vectors.');
    }

    if (!topK || topK < 1 || topK > 10000) {
      throw new Error('topK must be between 1 and 10000.');
    }

    // Validate query method requirements
    if (queryMethod === 'vector') {
      if (!vector || !Array.isArray(vector) || vector.length === 0) {
        throw new Error(
          'You must provide a query vector when using vector query method.'
        );
      }
    } else if (queryMethod === 'id') {
      if (!id || typeof id !== 'string' || id.length === 0 || id.length > 512) {
        throw new Error(
          'You must provide a valid vector ID (1-512 characters) when using ID query method.'
        );
      }
    }

    // Initialize Pinecone client following SDK documentation
    const pc = createPineconeClientFromAuth(context.auth);

    // Declare query request in outer scope for error handling
    let queryRequest: any = {};

    try {
      // Target the index following SDK pattern
      // const index = pc.index("INDEX_NAME", "INDEX_HOST")
      const index = indexHost
        ? pc.index(indexName, indexHost)
        : pc.index(indexName);

      // Build query request following SDK structure
      queryRequest = {
        topK: topK,
        includeValues: includeValues || false,
        includeMetadata: includeMetadata || false
      };

      // Add query vector or ID
      if (queryMethod === 'vector') {
        if (vector && Array.isArray(vector)) {
          queryRequest.vector = vector.map((v) => Number(v));
        }
      } else if (queryMethod === 'id') {
        if (id) {
          queryRequest.id = id;
        }
      }

      // Add sparse vector if provided
      if (sparseIndices && sparseValues) {
        if (!Array.isArray(sparseIndices) || !Array.isArray(sparseValues)) {
          throw new Error('Sparse indices and values must be arrays.');
        }
        if (sparseIndices.length !== sparseValues.length) {
          throw new Error(
            'Sparse indices and values arrays must have the same length.'
          );
        }

        queryRequest.sparseVector = {
          indices: sparseIndices.map((i) => Number(i)),
          values: sparseValues.map((v) => Number(v))
        };
      }

      // Add filter if provided
      if (filter) {
        queryRequest.filter = filter;
      }

      // Query vectors following SDK pattern
      // const queryResponse = await index.namespace('example-namespace').query({...});
      const queryResponse = namespace
        ? await index.namespace(namespace).query(queryRequest)
        : await index.query(queryRequest);

      // Process response following documented structure
      const matches = queryResponse?.matches || [];
      const usage = queryResponse?.usage || { readUnits: 0 };

      return {
        success: true,
        indexName: indexName,
        namespace: queryResponse?.namespace || namespace || 'default',
        matches: matches,
        usage: usage,
        query: {
          topK: topK,
          method: queryMethod,
          ...(queryMethod === 'vector' && { vectorDimension: vector?.length }),
          ...(queryMethod === 'id' && { queryId: id }),
          ...(filter && { filter: filter })
        },
        summary: {
          matchCount: matches.length,
          topScore: matches.length > 0 ? matches[0]?.score : null,
          readUnits: usage.readUnits || usage.readUnits || 0
        },
        message: `Successfully found ${matches.length} matches`
      };
    } catch (caught) {
      console.log('Failed to search vectors.', caught);

      // Handle specific API error responses following documentation
      if (caught instanceof Error) {
        const error = caught as any;

        // Handle 400 Bad Request - Invalid request parameters
        if (error.status === 400 || error.code === 400) {
          return {
            success: false,
            error: 'Bad Request',
            code: 400,
            message:
              error.message ||
              'The request body included invalid request parameters.',
            details: error.details || [],
            query: queryRequest,
            indexName: indexName,
            namespace: namespace || 'default'
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
            query: queryRequest,
            indexName: indexName,
            namespace: namespace || 'default'
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
            query: queryRequest,
            indexName: indexName,
            namespace: namespace || 'default'
          };
        }
      }

      // Handle any other errors
      return {
        success: false,
        error: 'Unknown Error',
        message:
          caught instanceof Error
            ? caught.message
            : 'An unexpected error occurred while searching vectors.',
        query: queryRequest,
        indexName: indexName,
        namespace: namespace || 'default'
      };
    }
  }
});
