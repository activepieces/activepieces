import { createAction, Property } from '@activepieces/pieces-framework';
import { flatAuth } from '../auth';
import { flatApiClient } from '../common';

export const deleteCollectionAction = createAction({
  auth: flatAuth,
  name: 'delete_collection',
  displayName: 'Delete the collection',
  description: 'This method will schedule the deletion of the collection. Until deleted, the collection will be available in the `trash`. ',
  props: {
  },
  async run({ auth, propsValue }) {
    const response = await flatApiClient.delete({
      auth, endpoint: '/collections/{collection}',
    });
    return response.body;
  },
});
