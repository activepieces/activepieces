import { createAction, Property } from '@activepieces/pieces-framework';
import { pineconeAuth } from '../common';
import { PineconeClient } from '../common/client';
import { commonProps, searchProps } from '../common/props';

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

    // Validate vector IDs input
    if (!Array.isArray(vectorIds)) {
      throw new Error('Vector IDs must be an array');
    }

    if (vectorIds.length === 0) {
      throw new Error('Vector IDs array cannot be empty');
    }

    if (vectorIds.length > 1000) {
      throw new Error('Maximum 1000 vector IDs allowed per fetch operation');
    }

    // Validate each vector ID
    for (let i = 0; i < vectorIds.length; i++) {
      const id = vectorIds[i];
      if (!id || typeof id !== 'string') {
        throw new Error(`Vector ID at index ${i} must be a valid string`);
      }
      if (id.includes(' ')) {
        throw new Error(`Vector ID at index ${i} cannot contain spaces: "${id}"`);
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

      // Construct query parameters
      const queryParams: any = {
        ids: vectorIds
      };

      // Add namespace if provided
      if (namespace) {
        queryParams.namespace = namespace;
      }

      // Add include options
      if (!includeValues) {
        queryParams.includeValues = 'false';
      }
      if (!includeMetadata) {
        queryParams.includeMetadata = 'false';
      }

      // Fetch vectors
      const fetchResult = await client.fetchVector(host, queryParams);

      // Process the response
      const vectors = fetchResult.vectors || {};
      const fetchedIds = Object.keys(vectors);
      const missingIds = vectorIds.filter(id => !fetchedIds.includes(id));

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

    } catch (error: any) {
      throw new Error(`Failed to fetch vectors: ${error.message || error}`);
    }
  },
});
