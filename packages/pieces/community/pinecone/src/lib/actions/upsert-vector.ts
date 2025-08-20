import { createAction, Property } from '@activepieces/pieces-framework';
import { PineconeAuth } from '../common/auth';
import { makeDataPlaneRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

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
    id: Property.ShortText({
      displayName: 'Vector ID',
      description: 'Unique identifier for the vector',
      required: true,
    }),
    values: Property.Array({
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
    sparseValues: Property.Object({
      displayName: 'Sparse Values',
      description: 'Sparse vector values (optional)',
      required: false,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'Metadata associated with the vector (optional)',
      required: false,
    }),
    //   },
    // }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'The namespace to upsert vectors into (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const vectors = propsValue.values.map((value: any) => ({
      id: propsValue.id,
      values: value.values.map((v: any) => v.value),
      sparseValues: propsValue.sparseValues || {},
      metadata: propsValue.metadata || {},
    }));

    const requestBody: any = {
      vectors,
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
