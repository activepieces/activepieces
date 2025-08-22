import { createAction, Property } from '@activepieces/pieces-framework';
import { PineconeAuth } from '../common/auth';
import { makeDataPlaneRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { vectorsIds } from '../common/props';

export const deleteAVector = createAction({
  auth: PineconeAuth,
  name: 'deleteAVector',
  displayName: 'Delete a Vector',
  description:
    'Delete vectors from a Pinecone index by IDs or delete all vectors',
  props: {
    indexName: Property.ShortText({
      displayName: 'Index Name',
      description: 'The name of the index to delete vectors from',
      required: true,
    }),

    ids: vectorsIds,
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'The namespace to delete vectors from (optional)',
      required: false,
    }),
    filter: Property.Object({
      displayName: 'Filter',
      description:
        'Metadata filter to specify which vectors to delete (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const requestBody: any = {};

    if (propsValue.ids && propsValue.ids.length > 0) {
      requestBody.ids = propsValue.ids;
    }

    if (propsValue.namespace) {
      requestBody.namespace = propsValue.namespace;
    }

    if (propsValue.filter) {
      requestBody.filter = propsValue.filter;
    }

    const response = await makeDataPlaneRequest(
      auth as string,
      propsValue.indexName,
      HttpMethod.POST,
      '/vectors/delete',
      requestBody
    );

    return response;
  },
});
