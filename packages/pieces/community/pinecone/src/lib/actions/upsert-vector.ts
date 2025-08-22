import { createAction, Property } from '@activepieces/pieces-framework';
import { PineconeAuth } from '../common/auth';
import { makeDataPlaneRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { vectorsIds } from '../common/props';

export const upsertVector = createAction({
  auth: PineconeAuth,
  name: 'upsertVector',
  displayName: 'Upsert Vector',
  description: 'Insert or update vectors in a Pinecone index',
  props: {
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the index to upsert vectors into',
      required: true,
    }),
    // vectors: Property.Array({
    //   displayName: 'Vectors',
    //   description: 'Array of vectors to upsert',
    //   required: true,
    //   properties: {
    id: vectorsIds,
    vectors_values: Property.Array({
      displayName: 'Vector Values',
      description: 'The vector values as an array of numbers',
      required: true,
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

    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'Metadata associated with the vector (optional)',
      required: false,
    }),

    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'The namespace to upsert vectors into (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const vectorData: any = {
      id: Array.isArray(propsValue.id) ? propsValue.id[0] : propsValue.id,
      values: propsValue.vectors_values.map((v: any) => v.value),
    };

    if (propsValue.sparseValues_indices && propsValue.sparseValues_values) {
      const indices = propsValue.sparseValues_indices.map(
        (item: any) => item.index
      );
      const values = propsValue.sparseValues_values.map(
        (item: any) => item.value
      );

      if (indices.length !== values.length) {
        throw new Error(
          'Sparse values indices and values arrays must have the same length'
        );
      }

      vectorData.sparseValues = {
        indices: indices,
        values: values,
      };
    }
    if (propsValue.metadata) {
      vectorData.metadata = propsValue.metadata;
    }

    const requestBody: any = {
      vectors: [vectorData],
    };

    if (propsValue.namespace) {
      requestBody.namespace = propsValue.namespace;
    }

    const response = await makeDataPlaneRequest(
      auth as string,
      propsValue.indexName,
      HttpMethod.POST,
      '/vectors/upsert',
      requestBody
    );

    return response;
  },
});
