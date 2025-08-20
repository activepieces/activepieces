import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { pineconeAuth } from '../..';

export const getAVector = createAction({
  name: 'get-a-vector',
  displayName: 'Fetch Vectors',
  description: 'Look up and return vectors by ID from a single namespace. The returned vectors include the vector data and/or metadata.',
  auth: pineconeAuth,
  props: {
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the Pinecone index',
      required: true,
    }),
    vectorIds: Property.Json({
      displayName: 'Vector IDs',
      description: 'Array of vector IDs to fetch. Does not accept values containing spaces.',
      required: true,
      defaultValue: ['id-1', 'id-2']
    }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'The namespace where the vectors are stored (optional)',
      required: false,
    }),
    includeValues: Property.Checkbox({
      displayName: 'Include Vector Values',
      description: 'Whether to include the actual vector values in the response',
      required: false,
      defaultValue: true,
    }),
    includeMetadata: Property.Checkbox({
      displayName: 'Include Metadata',
      description: 'Whether to include metadata in the response',
      required: false,
      defaultValue: true,
    }),
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
      // First, get the index host to construct the correct URL
      const indexResponse = await httpClient.sendRequest({
        url: `https://api.pinecone.io/indexes/${indexName}`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth as string,
        },
      });

      if (indexResponse.status !== 200) {
        throw new Error(`Failed to get index information: ${indexResponse.status}`);
      }

      const indexInfo = indexResponse.body as any;
      const host = indexInfo.host;

      if (!host) {
        throw new Error('Index host not found in response');
      }

      // Construct query parameters
      const queryParams = new URLSearchParams();
      
      // Add vector IDs
      vectorIds.forEach(id => {
        queryParams.append('ids', id);
      });

      // Add namespace if provided
      if (namespace) {
        queryParams.append('namespace', namespace);
      }

      // Add include options
      if (!includeValues) {
        queryParams.append('includeValues', 'false');
      }
      if (!includeMetadata) {
        queryParams.append('includeMetadata', 'false');
      }

      // Fetch vectors
      const fetchResponse = await httpClient.sendRequest({
        url: `https://${host}/vectors/fetch?${queryParams.toString()}`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth as string,
        },
      });

      if (fetchResponse.status !== 200) {
        throw new Error(`Failed to fetch vectors: ${fetchResponse.status} - ${JSON.stringify(fetchResponse.body)}`);
      }

      const fetchResult = fetchResponse.body as any;

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
