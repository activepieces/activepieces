import { createAction, Property } from '@activepieces/pieces-framework';
import { PineconeAuth } from '../common/auth';
import { makeDataPlaneRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const updateAVector = createAction({
  auth: PineconeAuth,
  name: 'updateAVector',
  displayName: 'Update a Vector',
  description: 'Update an existing vector in a Pinecone index',
  props: {
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the index containing the vector to update',
      required: true,
    }),
    id: Property.ShortText({
      displayName: 'Vector ID',
      description:
        'Unique identifier for the vector to update (1-512 characters)',
      required: true,
    }),
    values: Property.Array({
      displayName: 'Vector Values',
      description: 'The new vector values as an array of numbers (optional)',
      required: false,
      properties: {
        value: Property.Number({
          displayName: 'Value',
          description: 'Vector component value',
          required: true,
        }),
      },
    }),

    sparseValues_indices: Property.Array({
      displayName: 'Indices',
      description: 'The indices of the sparse data',
      required: true,
      properties: {
        index: Property.Number({
          displayName: 'Index',
          description: 'Sparse vector index',
          required: true,
        }),
      },
    }),
    sparseValues_values: Property.Array({
      displayName: 'Values',
      description: 'The corresponding values of the sparse data',
      required: true,
      properties: {
        value: Property.Number({
          displayName: 'Value',
          description: 'Sparse vector value',
          required: true,
        }),
      },
    }),

    setMetadata: Property.Object({
      displayName: 'Set Metadata',
      description: 'Metadata fields to set (replaces existing fields)',
      required: false,
    }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'The namespace containing the vector to update (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const requestBody: any = {
      id: propsValue.id,
    };

    if (propsValue.values && propsValue.values.length > 0) {
      requestBody.values = propsValue.values.map((v: any) => v.value);
    }

    if (propsValue.sparseValues_indices && propsValue.sparseValues_values) {
      requestBody.sparseValues = {
        indices: propsValue.sparseValues_indices.map((item: any) => item.index),
        values: propsValue.sparseValues_values.map((item: any) => item.value),
      };
    }

    if (propsValue.setMetadata) {
      requestBody.setMetadata = propsValue.setMetadata;
    }

    if (propsValue.namespace) {
      requestBody.namespace = propsValue.namespace;
    }

    const response = await makeDataPlaneRequest(
      auth as string,
      propsValue.indexName,
      HttpMethod.POST,
      '/vectors/update',
      requestBody
    );

    return response;
  },
});
