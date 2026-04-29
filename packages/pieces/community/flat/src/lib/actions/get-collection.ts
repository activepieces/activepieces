import { createAction, Property } from '@activepieces/pieces-framework';
import { flatAuth } from '../auth';
import { flatApiClient } from '../common';

export const getCollectionAction = createAction({
  auth: flatAuth,
  name: 'get_collection',
  displayName: 'Get collection details',
  description: 'Get collection details',
  props: {
    sharingKey: Property.ShortText({
      displayName: 'Sharing Key',
      description: 'This sharing key must be specified to access to a score or collection with a `privacy` mode set to `privateLink` and the current user is not a collaborator of the document. ',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await flatApiClient.get({
      auth, endpoint: '/collections/{collection}',
      queryParams: {
        sharingKey: propsValue.sharingKey,
      },
    });
    return response.body;
  },
});
