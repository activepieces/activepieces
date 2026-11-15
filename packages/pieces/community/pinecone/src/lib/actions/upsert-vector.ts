import { createAction, Property } from '@activepieces/pieces-framework';
import { pineconeClient } from '../common/client';
import type { PineconeRecord, RecordMetadata } from '../common/types';
import { pineconeAuth } from '../auth';
import { upsertVectorOutputSchema } from '../output-schemas';

export const upsertVectorAction = createAction({
  auth: pineconeAuth,
  name: 'upsert_vector',
  outputSchema: upsertVectorOutputSchema,
  classification: 'WRITE',
  displayName: 'Upsert Vector',
  description: 'Upsert vectors into a namespace. Overwrites existing vectors with the same ID.',
  audience: 'human',
  aiMetadata: { description: 'Writes (inserts or overwrites) vectors into a namespace of a Pinecone index, accepting either a single vector or a batch of vectors supplied as structured rows, chosen via the input method. Use to store or refresh embeddings keyed by ID; each vector requires an ID and numeric values. Idempotent: because writes are keyed on the vector ID, repeating the same call overwrites the same records to the same state without creating duplicates.', idempotent: true },
  props: {
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the index to upsert vectors into',
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
      description:
        'The namespace where you upsert vectors (e.g., "example-namespace")',
      required: false,
      defaultValue: 'example-namespace'
    }),
    vectorsInput: Property.StaticDropdown({
      displayName: 'Input Method',
      description: 'Choose how to provide vector data',
      required: true,
      options: {
        options: [
          { label: 'Single Vector', value: 'single' },
          { label: 'Multiple Vectors (JSON)', value: 'multiple' }
        ]
      },
      defaultValue: 'single'
    }),
    id: Property.ShortText({
      displayName: 'Vector ID',
      description: 'The unique identifier for the vector (e.g., "vec1")',
      required: false
    }),
    values: Property.Array({
      displayName: 'Vector Values',
      description:
        'Array of numbers representing the vector (e.g., [0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1])',
      required: false
    }),

    vectors: Property.Array({
      displayName: 'Vectors',
      description: 'Array of vectors to upsert (for multiple vectors input)',
      required: false,
      properties: {
        id: Property.ShortText({
          displayName: 'Vector ID',
          description: 'Unique identifier for this vector',
          required: true
        }),
        values: Property.LongText({
          displayName: 'Vector Values',
          description: 'Comma-separated numbers (e.g., 0.1,0.2,0.3,0.4)',
          required: true
        }),
        metadataKeys: Property.LongText({
          displayName: 'Metadata Keys',
          description: 'Comma-separated metadata field names (e.g., genre,year,rating)',
          required: false
        }),
        metadataValues: Property.LongText({
          displayName: 'Metadata Values',
          description: 'Comma-separated metadata values (e.g., comedy,2020,8.5)',
          required: false
        }),
        sparseIndices: Property.LongText({
          displayName: 'Sparse Indices',
          description: 'Comma-separated indices for sparse vector (e.g., 1,312,822)',
          required: false
        }),
        sparseValues: Property.LongText({
          displayName: 'Sparse Values',
          description: 'Comma-separated values for sparse vector (e.g., 0.1,0.2,0.3)',
          required: false
        })
      }
    })
  },
  async run(context) {
    const {
      indexName,
      indexHost,
      namespace,
      vectorsInput,
      id,
      values,
      vectors
    } = context.propsValue;

    if (!indexName) {
      throw new Error('You must provide an index name to upsert vectors.');
    }

    const pc = pineconeClient.create({ auth: context.auth });

    let vectorsToUpsert: PineconeRecord[] = [];

    try {

      const index = indexHost
        ? pc.index({ name: indexName, host: indexHost })
        : pc.index({ name: indexName });

      if (vectorsInput === 'single') {
        if (!id) {
          throw new Error(
            'You must provide a vector ID for single vector input.'
          );
        }
        if (!values || !Array.isArray(values) || values.length === 0) {
          throw new Error(
            'You must provide vector values as a non-empty array of numbers.'
          );
        }

        const record: PineconeRecord = {
          id: id,
          values: values.map((v) => Number(v))
        };

        vectorsToUpsert = [record];
      } else if (vectorsInput === 'multiple') {
        if (!vectors || !Array.isArray(vectors) || vectors.length === 0) {
          throw new Error(
            'You must provide vectors array when using multiple vectors input.'
          );
        }

        if (vectors.length > 1000) {
          throw new Error(
            'Recommended batch limit is up to 1000 vectors. Please reduce the number of vectors.'
          );
        }

        vectorsToUpsert = vectors.map((item, index) => {
          const vector = typeof item === 'object' && item !== null ? item : {};
          const vectorId = 'id' in vector ? vector.id : undefined;
          const vectorValues = 'values' in vector ? vector.values : undefined;
          const metadataKeys = 'metadataKeys' in vector ? vector.metadataKeys : undefined;
          const metadataValues = 'metadataValues' in vector ? vector.metadataValues : undefined;
          const sparseIndicesText = 'sparseIndices' in vector ? vector.sparseIndices : undefined;
          const sparseValuesText = 'sparseValues' in vector ? vector.sparseValues : undefined;

          if (!vectorId) {
            throw new Error(
              `Vector at index ${index} must have an ID.`
            );
          }
          
          if (!vectorValues) {
            throw new Error(
              `Vector at index ${index} must have values.`
            );
          }

          const values = String(vectorValues).split(',').map((v) => Number(v.trim()));
          if (values.some(isNaN) || values.length === 0) {
            throw new Error(
              `Vector at index ${index} has invalid values. Use comma-separated numbers.`
            );
          }

          const record: PineconeRecord = {
            id: String(vectorId),
            values: values
          };

          if (sparseIndicesText && sparseValuesText) {
            const sparseIndices = String(sparseIndicesText).split(',').map((v) => Number(v.trim()));
            const sparseValues = String(sparseValuesText).split(',').map((v) => Number(v.trim()));
            
            if (sparseIndices.some(isNaN) || sparseValues.some(isNaN)) {
              throw new Error(
                `Vector at index ${index} has invalid sparse values. Use comma-separated numbers.`
              );
            }
            
            if (sparseIndices.length !== sparseValues.length) {
              throw new Error(
                `Vector at index ${index}: sparse indices and values must have the same length.`
              );
            }

            record.sparseValues = {
              indices: sparseIndices,
              values: sparseValues
            };
          }

          if (metadataKeys && metadataValues) {
            const keys = String(metadataKeys).split(',').map((k) => k.trim());
            const vals = String(metadataValues).split(',').map((v) => v.trim());
            
            if (keys.length !== vals.length) {
              throw new Error(
                `Vector at index ${index}: metadata keys and values must have the same length.`
              );
            }
            
            const metadata: RecordMetadata = {};
            for (let i = 0; i < keys.length; i++) {
              const key = keys[i];
              const value = vals[i];
              const numValue = Number(value);
              metadata[key] = isNaN(numValue) ? value : numValue;
            }
            record.metadata = metadata;
          }

          return record;
        });
      }


      namespace
        ? await index.namespace(namespace).upsert({ records: vectorsToUpsert })
        : await index.upsert({ records: vectorsToUpsert });

      const upsertedCount = vectorsToUpsert.length;

      return {
        success: true,
        indexName: indexName,
        namespace: namespace || 'default',
        upsertedCount: upsertedCount,
        vectorCount: vectorsToUpsert.length,
        vectors: vectorsToUpsert.map((v) => ({
          id: v.id,
          dimension: v.values?.length
        })),
        message: `Successfully upserted ${upsertedCount} vector(s)`
      };
    } catch (caught) {
      return {
        success: false,
        error: 'Unknown Error',
        message:
          caught instanceof Error
            ? caught.message
            : 'An unexpected error occurred while upserting vectors.',
        vectorCount: vectorsToUpsert?.length || 0,
        indexName: indexName,
        namespace: namespace || 'default'
      };
    }
  }
});
