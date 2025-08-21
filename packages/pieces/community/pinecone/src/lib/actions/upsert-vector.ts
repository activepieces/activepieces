import { createAction, Property } from '@activepieces/pieces-framework';
import { pineconeAuth } from '../common/auth';
import { PineconeClient } from '../common/client';
import { commonProps } from '../common/props';

interface Vector {
  id: string;
  values: number[];
  metadata?: Record<string, unknown>;
}

interface UpsertRequestBody {
  vectors: Vector[];
  namespace?: string;
}

interface BatchResult {
  batchIndex: number;
  batchSize: number;
  upsertedCount: number;
  status: string;
}

export const upsertVector = createAction({
  name: 'upsert-vector',
  displayName: 'Upsert Vectors',
  description: 'Upsert vectors into a Pinecone index namespace. If a new value is upserted for an existing vector ID, it will overwrite the previous value.',
  auth: pineconeAuth,
  props: {
    indexName: commonProps.indexName,
    namespace: commonProps.namespace,
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
      if (!vector.values.every((val: number) => typeof val === 'number')) {
        throw new Error(`Vector at index ${i} must have numeric values only`);
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

      // Process vectors in batches
      const batches = [];
      for (let i = 0; i < vectors.length; i += batchSize) {
        batches.push(vectors.slice(i, i + batchSize));
      }

      let totalUpserted = 0;
      const results = [];

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        const requestBody: UpsertRequestBody = {
          vectors: batch as Vector[]
        };

        if (namespace) {
          requestBody.namespace = namespace;
        }

        const batchResult = await client.upsertVectors(host, requestBody);
        totalUpserted += batchResult.upsertedCount || batch.length;
        
        results.push({
          batchIndex: batchIndex + 1,
          batchSize: batch.length,
          upsertedCount: batchResult.upsertedCount || batch.length,
          status: 'success'
        } as BatchResult);
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

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to upsert vectors: ${errorMessage}`);
    }
  },
});
