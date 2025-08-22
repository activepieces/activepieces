import { createAction, Property } from '@activepieces/pieces-framework';
import { pineconeAuth } from '../common/auth';
import { pineconeCommon } from '../common';

export const updateVectorAction = createAction({
  auth: pineconeAuth,
  name: 'pinecone_update_vector',
  displayName: 'Update Vector',
  description: 'Update an existing vector in a Pinecone index',
  props: {
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the index containing the vector to update',
      required: true,
    }),
    id: Property.ShortText({
      displayName: 'Vector ID',
      description: 'The ID of the vector to update',
      required: true,
    }),
    values: Property.Json({
      displayName: 'Vector Values',
      description: 'New vector values (array of numbers). Leave empty to keep existing values.',
      required: false,
    }),
    metadata: Property.Json({
      displayName: 'Metadata',
      description: 'New metadata for the vector. Leave empty to keep existing metadata.',
      required: false,
    }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'The namespace containing the vector (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { indexName, id, values, metadata, namespace } = context.propsValue;

    try {
      // Validate that at least one update parameter is provided
      if (!values && !metadata) {
        return {
          success: false,
          error: 'At least one of "values" or "metadata" must be provided for update',
        };
      }

      // Get the index host
      const indexHost = await pineconeCommon.getIndexHost(context.auth, indexName);
      
      if (!indexHost) {
        return {
          success: false,
          error: `Index "${indexName}" not found or not ready`,
        };
      }

      // Validate values if provided
      let vectorValues: number[] | undefined;
      if (values) {
        if (Array.isArray(values)) {
          vectorValues = values;
        } else {
          return {
            success: false,
            error: 'Values must be an array of numbers',
          };
        }
      }

      const result = await pineconeCommon.updateVector(
        context.auth,
        indexHost,
        id,
        vectorValues,
        metadata,
        namespace
      );

      return {
        success: true,
        result,
        message: `Successfully updated vector "${id}" in index "${indexName}"`,
        updatedFields: {
          values: !!values,
          metadata: !!metadata,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.response?.data || error.message,
        message: `Failed to update vector "${id}" in index "${indexName}"`,
      };
    }
  },
});