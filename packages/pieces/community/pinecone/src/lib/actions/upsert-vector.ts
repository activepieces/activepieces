import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { pineconeAuth } from '../..';

export const upsertVector = createAction({
  name: 'upsert-vector',
  displayName: 'Upsert Vectors',
  description: 'Upsert vectors into a Pinecone index namespace. If a new value is upserted for an existing vector ID, it will overwrite the previous value.',
  auth: pineconeAuth,
  props: {
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the Pinecone index',
      required: true,
    }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'The namespace where you want to upsert vectors (optional)',
      required: false,
    }),
    vectors: Property.Json({
      displayName: 'Vectors',
      description: 'Array of vectors to upsert. Each vector should have: id, values (array of numbers), and optional metadata object. Recommended batch limit is up to 1000 vectors.',
      required: true,
      defaultValue: [
        {
          id: 'vec1',
          values: [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1],
          metadata: { genre: "comedy", year: 2020 }
        },
        {
          id: 'vec2',
          values: [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.2],
          metadata: { genre: "documentary", year: 2019 }
        }
      ]
    }),
    // Advanced options
    batchSize: Property.Number({
      displayName: 'Batch Size',
      description: 'Number of vectors to process in each batch (max 1000 per batch)',
      required: false,
      defaultValue: 1000,
    }),
  },
  async run({ auth, propsValue }) {
    const { indexName, namespace, vectors, batchSize = 1000 } = propsValue;

    // Validate vectors input
    if (!Array.isArray(vectors)) {
      throw new Error('Vectors must be an array');
    }

    if (vectors.length === 0) {
      throw new Error('Vectors array cannot be empty');
    }

    if (vectors.length > 10000) {
      throw new Error('Maximum 10,000 vectors allowed per upsert operation. For larger datasets, consider using import instead.');
    }

    // Validate each vector
    for (let i = 0; i < vectors.length; i++) {
      const vector = vectors[i];
      if (!vector.id || typeof vector.id !== 'string') {
        throw new Error(`Vector at index ${i} must have a valid string 'id'`);
      }
      if (!Array.isArray(vector.values) || vector.values.length === 0) {
        throw new Error(`Vector at index ${i} must have a non-empty 'values' array`);
      }
      if (!vector.values.every((val: any) => typeof val === 'number')) {
        throw new Error(`Vector at index ${i} must have numeric values only`);
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

      // Process vectors in batches
      const batches = [];
      for (let i = 0; i < vectors.length; i += batchSize) {
        batches.push(vectors.slice(i, i + batchSize));
      }

      let totalUpserted = 0;
      const results = [];

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        const requestBody: any = {
          vectors: batch
        };

        if (namespace) {
          requestBody.namespace = namespace;
        }

        const upsertResponse = await httpClient.sendRequest({
          url: `https://${host}/vectors/upsert`,
          method: HttpMethod.POST,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: auth as string,
          },
          body: requestBody,
        });

        if (upsertResponse.status !== 200) {
          throw new Error(`Failed to upsert batch ${batchIndex + 1}: ${upsertResponse.status} - ${JSON.stringify(upsertResponse.body)}`);
        }

        const batchResult = upsertResponse.body as any;
        totalUpserted += batchResult.upsertedCount || batch.length;
        
        results.push({
          batchIndex: batchIndex + 1,
          batchSize: batch.length,
          upsertedCount: batchResult.upsertedCount || batch.length,
          status: 'success'
        });
      }

      return {
        success: true,
        message: `Successfully upserted ${totalUpserted} vectors into index "${indexName}"${namespace ? ` in namespace "${namespace}"` : ''}`,
        totalUpserted,
        totalVectors: vectors.length,
        batchesProcessed: batches.length,
        batchResults: results,
        indexName,
        namespace: namespace || null
      };

    } catch (error: any) {
      throw new Error(`Failed to upsert vectors: ${error.message || error}`);
    }
  },
});
