import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { exaAuth } from '../../index';

export const findSimilarLinksAction = createAction({
  name: 'find_similar_links',
  displayName: 'Find Similar Links',
  description: 'Find pages similar to a given URL',
  auth: exaAuth,
  props: {
    url: Property.ShortText({
      displayName: 'URL',
      description: 'Reference URL to find semantically similar links',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await makeRequest(
      auth as string,
      HttpMethod.POST,
      '/similar',
      { url: propsValue.url }
    );
  },
});
