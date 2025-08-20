import { createAction, Property } from '@activepieces/pieces-framework';
import { pineconeAuth } from '../common';
import { PineconeClient } from '../common/client';
import { commonProps, searchProps } from '../common/props';

export const searchVectors = createAction({
  name: 'search-vectors',
  displayName: 'Search Vectors',
  description: 'Queries a Pinecone index with a vector to find similar records. Retrieves the IDs of the most similar items along with their similarity scores.',
  auth: pineconeAuth,
  props: {
    indexName: commonProps.indexName,
    namespace: commonProps.namespace,
    // Query method selection
    queryMethod: Property.Dropdown({
      displayName: 'Query Method',
      description: 'Choose how to provide the query vector',
      required: true,
      defaultValue: 'vector',
      refreshers: [],
      options: async () => {
        return {
          disabled: false,
          options: [
            { label: 'Query by Vector Values', value: 'vector' },
            { label: 'Query by Vector ID', value: 'id' }
          ]
        };
      }
    }),
    // Vector values for direct query
    queryVector: Property.Json({
      displayName: 'Query Vector',
      description: 'The query vector as an array of numbers (required when using vector method). Should match the dimension of the index.',
      required: false,
      defaultValue: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]
    }),
    // Vector ID for reference query
    queryVectorId: Property.ShortText({
      displayName: 'Query Vector ID',
      description: 'The unique ID of the vector to use as a query vector (required when using id method). Maximum length: 512 characters.',
      required: false,
    }),
    // Sparse vector support
    sparseVector: Property.Json({
      displayName: 'Sparse Vector',
      description: 'Vector sparse data with indices and values arrays (optional). Use for sparse vector queries. Note: Only supported by sparse indexes or indexes using dotproduct similarity metric.',
      required: false,
      defaultValue: {
        indices: [0, 1, 2],
        values: [0.1, 0.2, 0.3]
      }
    }),
    // Search parameters
    topK: searchProps.topK,
    // Response options
    includeValues: searchProps.includeValues,
    includeMetadata: searchProps.includeMetadata,
    // Metadata filter
    metadataFilter: searchProps.filter,
  },
  async run({ auth, propsValue }) {
    const { 
      indexName, 
      namespace, 
      queryMethod, 
      queryVector, 
      queryVectorId, 
      sparseVector, 
      topK, 
      includeValues, 
      includeMetadata, 
      metadataFilter 
    } = propsValue;

    // Validate topK
    if (!topK || typeof topK !== 'number') {
      throw new Error('Top K must be a valid number');
    }
    if (topK < 1 || topK > 10000) {
      throw new Error('Top K must be between 1 and 10000');
    }

    // Validate query method requirements
    if (queryMethod === 'vector') {
      if (!queryVector || !Array.isArray(queryVector)) {
        throw new Error('Query vector is required when using vector method');
      }
      if (queryVector.length === 0) {
        throw new Error('Query vector array cannot be empty');
      }
      if (!queryVector.every((val: any) => typeof val === 'number')) {
        throw new Error('All query vector values must be numbers');
      }
    } else if (queryMethod === 'id') {
      if (!queryVectorId || typeof queryVectorId !== 'string') {
        throw new Error('Query vector ID is required when using id method');
      }
      if (queryVectorId.length < 1 || queryVectorId.length > 512) {
        throw new Error('Query vector ID must be between 1 and 512 characters');
      }
    }

    // Validate sparse vector if provided
    if (sparseVector) {
      if (typeof sparseVector !== 'object' || sparseVector === null) {
        throw new Error('Sparse vector must be an object');
      }
      
      const { indices, values } = sparseVector as any;
      if (!Array.isArray(indices) || !Array.isArray(values)) {
        throw new Error('Sparse vector must have indices and values arrays');
      }
      
      if (indices.length !== values.length) {
        throw new Error('Sparse vector indices and values arrays must have the same length');
      }
      
      if (!indices.every((idx: any) => typeof idx === 'number' && Number.isInteger(idx) && idx >= 0)) {
        throw new Error('Sparse vector indices must be non-negative integers');
      }
      
      if (!values.every((val: any) => typeof val === 'number')) {
        throw new Error('Sparse vector values must be numbers');
      }
    }

    try {
      const client = new PineconeClient(auth);
      
      // First, get the index host to construct the correct URL
      const indexInfo = await client.getIndex(indexName);
      const host = indexInfo.host;

      if (!host) {
        throw new Error('Index host not found in response');
      }

      // Build the request body
      const requestBody: any = {
        topK,
        includeValues,
        includeMetadata
      };

      // Add query method specific data
      if (queryMethod === 'vector') {
        requestBody.vector = queryVector;
      } else if (queryMethod === 'id') {
        requestBody.id = queryVectorId;
      }

      // Add sparse vector only if provided AND if the index supports it
      // Note: Sparse vectors are only supported by sparse indexes or indexes using dotproduct similarity
      if (sparseVector) {
        // Check if this is a sparse index by examining the index info
        const indexConfig = indexInfo.dimension || {};
        const isSparseIndex = indexInfo.metric === 'dotproduct' || 
                             (indexInfo.configuration && indexInfo.configuration.sparse);
        
        if (!isSparseIndex) {
          // Don't add sparseVector to requestBody for non-sparse indexes
        } else {
          requestBody.sparseVector = sparseVector;
        }
      }

      // Add namespace if provided
      if (namespace) {
        requestBody.namespace = namespace;
      }

      // Add metadata filter if provided
      if (metadataFilter) {
        requestBody.filter = metadataFilter;
      }

      // Search vectors
      const searchResult = await client.queryVectors(host, requestBody);

      // Process the response
      const matches = searchResult.matches || [];
      const usage = searchResult.usage || null;

      return {
        success: true,
        message: `Successfully found ${matches.length} similar vector(s) in index "${indexName}"${namespace ? ` in namespace "${namespace}"` : ''}`,
        indexName,
        namespace: namespace || null,
        queryMethod,
        topK,
        totalResults: matches.length,
        matches: matches.map((match: any) => ({
          id: match.id,
          score: match.score,
          values: match.values || null,
          sparseValues: match.sparseValues || null,
          metadata: match.metadata || null
        })),
        usage,
        searchParameters: {
          method: queryMethod,
          includeValues,
          includeMetadata,
          hasFilter: !!metadataFilter,
          hasSparseVector: !!sparseVector && requestBody.sparseVector !== undefined
        },
        requestBody
      };

    } catch (error: any) {
      // Handle specific Pinecone API errors
      if (error.response && error.response.body) {
        const errorBody = error.response.body;
        
        if (errorBody.code === 3 && errorBody.message && errorBody.message.includes('sparse values')) {
          throw new Error(`Sparse vector search not supported by this index. This index only supports dense vectors. Please remove the sparse vector parameter or use a different index that supports sparse vectors.`);
        }
        
        if (errorBody.code && errorBody.message) {
          throw new Error(`Pinecone API Error (${errorBody.code}): ${errorBody.message}`);
        }
      }
      
      throw new Error(`Failed to search vectors: ${error.message || error}`);
    }
  },
});
