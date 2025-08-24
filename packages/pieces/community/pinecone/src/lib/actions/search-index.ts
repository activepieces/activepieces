import { createAction, Property } from '@activepieces/pieces-framework';
import { PineconeAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const searchIndex = createAction({
  auth: PineconeAuth,
  name: 'searchIndex',
  displayName: 'Search Index',
  description:
    'Lists all indexes in your Pinecone project or searches for indexes by name',
  props: {
    name: Property.ShortText({
      displayName: 'Index Name Filter',
      description:
        'Filter indexes by name (optional). Leave empty to list all indexes.',
      required: false,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const response = await makeRequest(
      auth as string,
      HttpMethod.GET,
      '/indexes'
    );
    if (!propsValue.name) {
      return response;
    }
    if (response && response.indexes && Array.isArray(response.indexes)) {
      const filteredIndexes = response.indexes.filter(
        (index: any) =>
          index.name && index.name.toLowerCase().includes(propsValue.name)
      );

      return {
        ...response,
        indexes: filteredIndexes,
      };
    }

    return response;
  },
});
