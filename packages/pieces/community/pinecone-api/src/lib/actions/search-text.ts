import { createAction, Property } from '@activepieces/pieces-framework';
import { createPineconeClientFromAuth } from '../common/pinecone-client';
import { pineconeAuth } from '../../index';

export const searchText = createAction({
  auth: pineconeAuth,
  name: 'search_text',
  displayName: 'Search with Text',
  description:
    'Search a namespace with a query text, query vector, or record ID and return the most similar records. Optionally rerank results based on relevance. Supports indexes with integrated embedding.',
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
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'The namespace to search (e.g., "example-namespace")',
      required: true,
      defaultValue: 'example-namespace'
    }),
    searchMethod: Property.StaticDropdown({
      displayName: 'Search Method',
      description: 'Choose how to search',
      required: true,
      options: {
        options: [
          { label: 'Search with Text', value: 'text' },
          { label: 'Search with Vector', value: 'vector' },
          { label: 'Search with Record ID', value: 'id' }
        ]
      },
      defaultValue: 'text'
    }),
    topK: Property.Number({
      displayName: 'Top K',
      description: 'The number of initial results to return',
      required: true,
      defaultValue: 4
    }),
    // Text search
    queryText: Property.ShortText({
      displayName: 'Query Text',
      description: 'The text query to search with (e.g., "Disease prevention")',
      required: false
    }),
    // Vector search
    vector: Property.Array({
      displayName: 'Query Vector',
      description:
        'The query vector values (e.g., [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3])',
      required: false
    }),
    vectorText: Property.ShortText({
      displayName: 'Vector Text Input',
      description: 'Text input for vector search (optional)',
      required: false
    }),
    // ID search
    recordId: Property.ShortText({
      displayName: 'Record ID',
      description: 'The record ID to use for search (e.g., "rec1")',
      required: false
    }),
    // Common options
    fields: Property.Array({
      displayName: 'Fields to Return',
      description:
        'The fields to return in search results (e.g., ["chunk_text", "category"])',
      required: false
    }),
    // Reranking options
    enableRerank: Property.Checkbox({
      displayName: 'Enable Reranking',
      description: 'Whether to rerank the initial results based on relevance',
      required: false,
      defaultValue: false
    }),
    rerankQuery: Property.ShortText({
      displayName: 'Rerank Query',
      description: 'Query text for reranking (e.g., "Disease prevention")',
      required: false
    }),
    rerankModel: Property.StaticDropdown({
      displayName: 'Rerank Model',
      description: 'The reranking model to use',
      required: false,
      options: {
        options: [{ label: 'bge-reranker-v2-m3', value: 'bge-reranker-v2-m3' }]
      },
      defaultValue: 'bge-reranker-v2-m3'
    }),
    rankFields: Property.Array({
      displayName: 'Rank Fields',
      description: 'Fields to use for reranking (e.g., ["chunk_text"])',
      required: false
    }),
    topN: Property.Number({
      displayName: 'Top N (Rerank)',
      description: 'Number of top results to return after reranking',
      required: false,
      defaultValue: 2
    })
  },
  async run(context) {
    const {
      indexName,
      indexHost,
      namespace,
      searchMethod,
      topK,
      queryText,
      vector,
      vectorText,
      recordId,
      fields,
      enableRerank,
      rerankQuery,
      rerankModel,
      rankFields,
      topN
    } = context.propsValue;

    // Validation following SDK pattern
    if (!indexName) {
      throw new Error('You must provide an index name to search.');
    }

    if (!namespace) {
      throw new Error('You must provide a namespace to search.');
    }

    // Validate search method requirements
    if (searchMethod === 'text' && !queryText) {
      throw new Error(
        'You must provide query text when using text search method.'
      );
    }
    if (
      searchMethod === 'vector' &&
      (!vector || !Array.isArray(vector) || vector.length === 0)
    ) {
      throw new Error(
        'You must provide a query vector when using vector search method.'
      );
    }
    if (searchMethod === 'id' && !recordId) {
      throw new Error(
        'You must provide a record ID when using ID search method.'
      );
    }

    // Initialize Pinecone client following SDK documentation
    const pc = createPineconeClientFromAuth(context.auth);

    // Declare search request in outer scope for error handling
    let searchRequest: any = {};

    try {
      // Target the namespace following SDK pattern
      // const namespace = pc.index("INDEX_NAME", "INDEX_HOST").namespace("example-namespace");
      const index = indexHost
        ? pc.index(indexName, indexHost)
        : pc.index(indexName);
      const namespaceRef = index.namespace(namespace);

      // Build search request following SDK structure
      searchRequest = {
        query: {
          topK: topK
        }
      };

      // Add query based on search method
      if (searchMethod === 'text') {
        if (queryText) {
          searchRequest.query.inputs = { text: queryText };
        }
      } else if (searchMethod === 'vector') {
        if (vector && Array.isArray(vector)) {
          searchRequest.query.vector = {
            values: vector.map((v) => Number(v))
          };
        }
        if (vectorText) {
          searchRequest.query.inputs = { text: vectorText };
        }
      } else if (searchMethod === 'id') {
        if (recordId) {
          searchRequest.query.id = recordId;
        }
      }

      // Add fields if specified
      if (fields && Array.isArray(fields) && fields.length > 0) {
        searchRequest.fields = fields as string[];
      }

      // Add reranking if enabled
      if (enableRerank) {
        searchRequest.rerank = {
          model: rerankModel || 'bge-reranker-v2-m3',
          topN: topN || 2
        };

        // Add rerank query (required for vector and ID searches)
        if (searchMethod === 'vector' || searchMethod === 'id') {
          if (!rerankQuery) {
            throw new Error(
              'Rerank query is required when reranking vector or ID search results.'
            );
          }
          searchRequest.rerank.query = rerankQuery;
        }

        // Add rank fields if specified
        if (rankFields && Array.isArray(rankFields) && rankFields.length > 0) {
          searchRequest.rerank.rankFields = rankFields as string[];
        }
      }

      // Search records following SDK pattern
      // const searchResult = await namespace.searchRecords({...});
      const searchResult = await namespaceRef.searchRecords(searchRequest);

      // Process response following documented structure
      const result = searchResult?.result || {};
      const hits = result.hits || [];
      const usage = searchResult?.usage || {};

      return {
        success: true,
        indexName: indexName,
        namespace: namespace,
        result: result,
        usage: usage,
        search: {
          method: searchMethod,
          topK: topK,
          ...(searchMethod === 'text' && { queryText }),
          ...(searchMethod === 'vector' && { vectorDimension: vector?.length }),
          ...(searchMethod === 'id' && { recordId }),
          ...(enableRerank && { reranked: true, topN: topN })
        },
        summary: {
          hitCount: hits.length,
          topScore: hits.length > 0 ? hits[0]?._score : null,
          readUnits: usage.readUnits || usage.readUnits || 0,
          embedTokens: usage.embedTotalTokens || usage.embedTotalTokens || 0,
          rerankUnits: usage.rerankUnits || usage.rerankUnits || 0
        },
        message: `Successfully found ${hits.length} records`
      };
    } catch (caught) {
      console.log('Failed to search records.', caught);

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
            searchRequest: searchRequest,
            indexName: indexName,
            namespace: namespace
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
            searchRequest: searchRequest,
            indexName: indexName,
            namespace: namespace
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
            : 'An unexpected error occurred while searching records.',
        searchRequest: searchRequest,
        indexName: indexName,
        namespace: namespace
      };
    }
  }
});
