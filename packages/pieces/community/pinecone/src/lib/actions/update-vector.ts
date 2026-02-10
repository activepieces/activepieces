import { createAction, Property } from '@activepieces/pieces-framework';
import { createPineconeClientFromAuth } from '../common/pinecone-client';
import { pineconeAuth } from '../../index';

export const updateVector = createAction({
  auth: pineconeAuth,
  name: 'update_vector',
  displayName: 'Update a Vector',
  description: 'Updates a vector in a namespace. Overwrites existing values and metadata.',
  props: {
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the index containing the vector to update',
      required: true
    }),
    indexHost: Property.ShortText({
      displayName: 'Index Host',
      description:
        'The unique host for the index (optional, see Pinecone docs for targeting an index)',
      required: false
    }),
    id: Property.ShortText({
      displayName: 'Vector ID',
      description: "Vector's unique id (required, string length: 1 - 512)",
      required: true
    }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description:
        'The namespace containing the vector to update (e.g., "example-namespace")',
      required: false,
      defaultValue: 'example-namespace'
    }),
    values: Property.Array({
      displayName: 'Vector Values',
      description:
        'Vector data to update (e.g., [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8])',
      required: false
    }),
    sparseIndices: Property.Array({
      displayName: 'Sparse Indices',
      description: 'Array of indices for sparse values (optional)',
      required: false
    }),
    sparseValues: Property.Array({
      displayName: 'Sparse Values',
      description:
        'Array of sparse values corresponding to indices (must be same length as indices)',
      required: false
    }),
    metadata: Property.Array({
      displayName: 'Metadata',
      description: 'Key-value pairs to set for the vector',
      required: false,
      properties: {
        key: Property.ShortText({
          displayName: 'Key',
          description: 'Metadata field name',
          required: true
        }),
        value: Property.ShortText({
          displayName: 'Value',
          description: 'Metadata field value',
          required: true
        })
      }
    })
  },
  async run(context) {
    const {
      indexName,
      indexHost,
      id,
      namespace,
      values,
      sparseIndices,
      sparseValues,
      metadata
    } = context.propsValue;

    if (!indexName) {
      throw new Error('You must provide an index name to update a vector.');
    }

    if (!id || typeof id !== 'string' || id.length === 0 || id.length > 512) {
      throw new Error(
        'Vector ID is required and must be a string with length 1-512 characters.'
      );
    }

    const pc = createPineconeClientFromAuth(context.auth);

    try {

      const index = indexHost
        ? pc.index(indexName, indexHost)
        : pc.index(indexName);

      const updateRequest: any = {
        id: id
      };

      if (values && Array.isArray(values) && values.length > 0) {
        updateRequest.values = values.map((v) => Number(v));
      }

      if (sparseIndices && sparseValues) {
        if (!Array.isArray(sparseIndices) || !Array.isArray(sparseValues)) {
          throw new Error('Sparse indices and values must be arrays.');
        }
        if (sparseIndices.length !== sparseValues.length) {
          throw new Error(
            'Sparse indices and values arrays must have the same length.'
          );
        }

        updateRequest.sparseValues = {
          indices: sparseIndices.map((i) => Number(i)),
          values: sparseValues.map((v) => Number(v))
        };
      }

      if (metadata && Array.isArray(metadata) && metadata.length > 0) {
        const metadataObj: any = {};
        for (const item of metadata) {
          const metaItem = item as any;
          const key = String(metaItem.key);
          const value = metaItem.value;
          const numValue = Number(value);
          metadataObj[key] = isNaN(numValue) ? value : numValue;
        }
        updateRequest.metadata = metadataObj;
      }

      namespace
        ? await index.namespace(namespace).update(updateRequest)
        : await index.update(updateRequest);

      return {
        success: true,
        indexName: indexName,
        namespace: namespace || 'default',
        vectorId: id,
        updatedFields: {
          ...(updateRequest.values && {
            values: `${updateRequest.values.length} values`
          }),
          ...(updateRequest.sparseValues && {
            sparseValues: `${updateRequest.sparseValues.indices.length} sparse values`
          }),
          ...(updateRequest.metadata && {
            metadata:
              Object.keys(updateRequest.metadata).length + ' metadata fields'
          })
        },
        message: `Successfully updated vector '${id}'`
      };
    } catch (caught) {
      console.log('Failed to update vector.', caught);

      if (caught instanceof Error) {
        const error = caught as any;

        if (error.status === 400 || error.code === 400) {
          return {
            success: false,
            error: 'Bad Request',
            code: 400,
            message:
              error.message ||
              'The request body included invalid request parameters.',
            details: error.details || [],
            vectorId: id,
            indexName: indexName
          };
        }

        if (error.status >= 400 && error.status < 500) {
          return {
            success: false,
            error: 'Client Error',
            code: error.status || error.code,
            message: error.message || 'An unexpected client error occurred.',
            details: error.details || [],
            vectorId: id,
            indexName: indexName
          };
        }

        if (error.status >= 500 || error.code >= 500) {
          return {
            success: false,
            error: 'Server Error',
            code: error.status || error.code,
            message: error.message || 'An unexpected server error occurred.',
            details: error.details || [],
            vectorId: id,
            indexName: indexName
          };
        }
      }

      return {
        success: false,
        error: 'Unknown Error',
        message:
          caught instanceof Error
            ? caught.message
            : 'An unexpected error occurred while updating the vector.',
        vectorId: id,
        indexName: indexName
      };
    }
  }
});
