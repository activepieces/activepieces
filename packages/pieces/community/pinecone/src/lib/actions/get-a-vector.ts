import { createAction, Property } from '@activepieces/pieces-framework';
import { PineconeAuth } from '../common/auth';
import { makeDataPlaneRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getAVector = createAction({
  auth: PineconeAuth,
  name: 'getAVector',
  displayName: 'Get a Vector',
  description: 'Fetch vectors by their IDs from a Pinecone index',
  props: {
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the index to fetch vectors from',
      required: true,
    }),
    ids: Property.Array({
      displayName: 'Vector IDs',
      description: 'Array of vector IDs to fetch',
      required: true,
      properties: {
        id: Property.ShortText({
          displayName: 'Vector ID',
          description: 'Unique identifier for the vector',
          required: true,
        }),
      },
    }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'The namespace to fetch vectors from (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    // Extract IDs from the array format
    const ids = propsValue.ids.map((item: any) => item.id);

    const requestBody: any = {
      ids,
    };

    if (propsValue.namespace) {
      requestBody.namespace = propsValue.namespace;
    }

    const response = await makeDataPlaneRequest(
      auth as string,
      propsValue.indexName,
      HttpMethod.POST,
      '/vectors/fetch',
      requestBody
    );

    return response;
  },
});
