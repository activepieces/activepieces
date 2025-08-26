import { createAction, Property } from '@activepieces/pieces-framework';
import { createPineconeClientFromAuth } from '../common/pinecone-client';
import { pineconeAuth } from '../../index';

export const upsertVector = createAction({
  auth: pineconeAuth,
  name: 'upsert_vector',
  displayName: 'Upsert Vector',
  description:
    'Upsert vectors into a namespace. If a new value is upserted for an existing vector ID, it will overwrite the previous value. Recommended batch limit is up to 1000 vectors.',
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
    // Single vector properties
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
    metadata: Property.Json({
      displayName: 'Metadata',
      description:
        'Optional metadata object to store with the vector (e.g., {"genre": "comedy", "year": 2020})',
      required: false
    }),
    // Multiple vectors property
    records: Property.Json({
      displayName: 'Records',
      description:
        'JSON array of vector records. Each must have id, values, and optionally metadata. Max 1000 vectors per batch.',
      required: false
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
      metadata,
      records
    } = context.propsValue;

    // Validation following SDK pattern
    if (!indexName) {
      throw new Error('You must provide an index name to upsert vectors.');
    }

    // Initialize Pinecone client following SDK documentation
    const pc = createPineconeClientFromAuth(context.auth);

    // Declare vectorsToUpsert in outer scope so it's accessible in catch block
    let vectorsToUpsert: any[] = [];

    try {
      // Target the index following SDK pattern
      // const index = pc.index("INDEX_NAME", "INDEX_HOST")
      const index = indexHost
        ? pc.index(indexName, indexHost)
        : pc.index(indexName);

      if (vectorsInput === 'single') {
        // Single vector validation
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

        // Build single vector following SDK example structure
        const record = {
          id: id,
          values: values.map((v) => Number(v)),
          ...(metadata && { metadata })
        };

        vectorsToUpsert = [record];
      } else if (vectorsInput === 'multiple') {
        // Multiple vectors validation
        if (!records || !Array.isArray(records)) {
          throw new Error(
            'You must provide records as a JSON array when using multiple vectors input.'
          );
        }

        if (records.length > 1000) {
          throw new Error(
            'Recommended batch limit is up to 1000 vectors. Please reduce the number of records.'
          );
        }

        // Validate each record in the array following SDK structure
        vectorsToUpsert = records.map((record: any, index: number) => {
          if (!record.id) {
            throw new Error(
              `Record at index ${index} must have an 'id' field.`
            );
          }
          if (
            !record.values ||
            !Array.isArray(record.values) ||
            record.values.length === 0
          ) {
            throw new Error(
              `Record at index ${index} must have 'values' as a non-empty array of numbers.`
            );
          }

          return {
            id: record.id,
            values: record.values.map((v: any) => Number(v)),
            ...(record.metadata && { metadata: record.metadata })
          };
        });
      }

      // Upsert vectors following SDK pattern
      // await index.namespace('example-namespace').upsert(records);
      const response: any = namespace
        ? await index.namespace(namespace).upsert(vectorsToUpsert)
        : await index.upsert(vectorsToUpsert);

      // Extract upserted count from response if available
      const upsertedCount =
        response && typeof response === 'object' && response.upsertedCount
          ? response.upsertedCount
          : vectorsToUpsert.length;

      return {
        success: true,
        indexName: indexName,
        namespace: namespace || 'default',
        upsertedCount: upsertedCount,
        vectorCount: vectorsToUpsert.length,
        vectors: vectorsToUpsert.map((v) => ({
          id: v.id,
          dimension: v.values.length
        })),
        message: `Successfully upserted ${upsertedCount} vector(s)`
      };
    } catch (caught) {
      console.log('Failed to upsert vector(s).', caught);

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
            vectorCount: vectorsToUpsert?.length || 0,
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
            vectorCount: vectorsToUpsert?.length || 0,
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
            vectorCount: vectorsToUpsert?.length || 0,
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
            : 'An unexpected error occurred while upserting vectors.',
        vectorCount: vectorsToUpsert?.length || 0,
        indexName: indexName,
        namespace: namespace || 'default'
      };
    }
  }
});
