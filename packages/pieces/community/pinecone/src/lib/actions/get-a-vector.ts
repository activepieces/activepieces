import { createAction, Property } from '@activepieces/pieces-framework';
import { pineconeAuth } from '../common/auth';
import { PineconeClient } from '../common/client';
import { commonProps, searchProps } from '../common/props';

interface FetchVectorParams {
  ids: string[];
  namespace?: string;
  includeValues?: boolean;
  includeMetadata?: boolean;
}

interface ErrorResponse {
  response?: {
    body: {
      code?: string;
      message?: string;
    };
  };
  message?: string;
}

export const getAVector = createAction({
  name: 'get-a-vector',
  displayName: 'Get a Vector',
  description: 'Look up and return vectors by ID from a single namespace. The returned vectors include the vector data and/or metadata.',
  auth: pineconeAuth,
  props: {
    indexName: commonProps.indexName,
    vectorIds: Property.Json({
      displayName: 'Vector IDs',
      description: 'Array of vector IDs to fetch. Does not accept values containing spaces.',
      required: true,
      defaultValue: ['id-1', 'id-2']
    }),
    namespace: commonProps.namespace,
    includeValues: searchProps.includeValues,
    includeMetadata: searchProps.includeMetadata,
  },
  async run({ auth, propsValue }) {
    const { indexName, vectorIds, namespace, includeValues = true, includeMetadata = true } = propsValue;

    if (!Array.isArray(vectorIds)) {
      throw new Error('Vector IDs must be an array');
    }

    if (vectorIds.length === 0) {
      throw new Error('Vector IDs array cannot be empty');
    }

    if (vectorIds.length > 1000) {
      throw new Error('Maximum 1000 vector IDs allowed per fetch operation');
    }

    for (let i = 0; i < vectorIds.length; i++) {
      const id = vectorIds[i];
      if (!id || typeof id !== 'string') {
        throw new Error(`Vector ID at index ${i} must be a valid string`);
      }
      if (id.includes(' ')) {
        throw new Error(`Vector ID at index ${i} cannot contain spaces: "${id}"`);
      }
      if (id.trim() === '') {
        throw new Error(`Vector ID at index ${i} cannot be empty or whitespace`);
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
        throw new Error(`Vector ID at index ${i} contains invalid characters: "${id}". Only alphanumeric characters, hyphens, and underscores are allowed.`);
      }
    }

    try {
      const client = new PineconeClient(auth);
      
      const indexInfo = await client.getIndex(indexName);
      const host = indexInfo.host;

      if (!host) {
        throw new Error('Index host not found in response');
      }

      const queryParams: FetchVectorParams = {
        ids: vectorIds
      };

      if (namespace) {
        queryParams.namespace = namespace;
      }

      if (includeValues === false) {
        queryParams.includeValues = false;
      }
      if (includeMetadata === false) {
        queryParams.includeMetadata = false;
      }

      const fetchResult = await client.fetchVector(host, queryParams);

      const vectors = fetchResult.vectors || {};
      const fetchedIds = Object.keys(vectors);
      const missingIds = vectorIds.filter(id => !fetchedIds.includes(id));
      console.log('Pinecone fetch response:', JSON.stringify(fetchResult, null, 2));


      if (!fetchResult.vectors || typeof fetchResult.vectors !== 'object') {
        throw new Error(`Unexpected response format from Pinecone API. Expected 'vectors' field, got: ${JSON.stringify(fetchResult)}`);
      }

      if (fetchedIds.length === 0) {
        throw new Error(`No vectors found for the provided IDs: ${vectorIds.join(', ')}. Please verify that these vector IDs exist in the index.`);
      }

      return {
        success: true,
        message: `Successfully fetched ${fetchedIds.length} vector(s) from index "${indexName}"${namespace ? ` in namespace "${namespace}"` : ''}`,
        indexName,
        namespace: namespace || null,
        requestedIds: vectorIds,
        fetchedIds,
        missingIds,
        vectors,
        usage: fetchResult.usage || null,
        summary: {
          totalRequested: vectorIds.length,
          totalFetched: fetchedIds.length,
          totalMissing: missingIds.length,
          includeValues,
          includeMetadata
        }
      };

    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const errorResponse = error as ErrorResponse;
        if (errorResponse.response?.body) {
          const errorBody = errorResponse.response.body;
          
          if (errorBody.code && errorBody.message) {
            throw new Error(`Pinecone API Error (${errorBody.code}): ${errorBody.message}`);
          }
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('No vectors found')) {
        throw error;
      }
      
      if (errorMessage.includes('Unexpected response format')) {
        throw error;
      }
      
      throw new Error(`Failed to fetch vectors: ${errorMessage}`);
    }
  },
});
