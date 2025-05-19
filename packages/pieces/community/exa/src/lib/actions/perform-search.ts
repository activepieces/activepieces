import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { exaAuth } from '../../index';

export const performSearchAction = createAction({
  name: 'perform_search',
  displayName: 'Perform Search',
  description: 'Search using semantic or keyword search to find web content',
  auth: exaAuth,
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Search query to find related articles and data',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await makeRequest(
      auth as string,
      HttpMethod.POST,
      '/search',
      { query: propsValue.query }
    );
  },
});
