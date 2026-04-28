import { createAction, Property } from '@activepieces/pieces-framework';
import { flatAuth } from '../auth';
import { flatApiClient } from '../common';

export const untrashCollectionAction = createAction({
  auth: flatAuth,
  name: 'untrash_collection',
  displayName: 'Untrash a collection',
  description: 'This method will restore the collection by removing it from the `trash` and add it back to the `root` collection. ',
  props: {
  },
  async run({ auth, propsValue }) {
    const response = await flatApiClient.post({
      auth, endpoint: '/collections/{collection}/untrash',
      body: {

      },
    });
    return response.body;
  },
});
