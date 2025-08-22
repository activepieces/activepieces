import { createAction, Property } from '@activepieces/pieces-framework';
import { PineconeAuth } from '../common/auth';
import { makeDataPlaneRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { hostDropdown, vectorsIds } from '../common/props';

export const getAVector = createAction({
  auth: PineconeAuth,
  name: 'getAVector',
  displayName: 'Get a Vector',
  description: 'Fetch vectors by their IDs from a Pinecone index',
  props: {
    host: hostDropdown,
    ids: vectorsIds,
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'The namespace to fetch vectors from (optional)',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const requestBody: any = {
      ids: propsValue.ids,
    };

    if (propsValue.namespace) {
      requestBody.namespace = propsValue.namespace;
    }

    const response = await makeDataPlaneRequest(
      auth as string,
      propsValue.host as string,
      HttpMethod.POST,
      '/vectors/fetch',
      requestBody
    );
   
    return response;
  },
});
