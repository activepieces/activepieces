import { createAction, Property } from '@activepieces/pieces-framework';
import { flatAuth } from '../auth';
import { flatApiClient } from '../common';

export const editCollectionAction = createAction({
  auth: flatAuth,
  name: 'edit_collection',
  displayName: 'Update a collection\'s metadata',
  description: 'Update a collection\'s metadata',
  props: {
    privacy: Property.StaticDropdown({
      displayName: 'Privacy',
      description: 'The collection main privacy mode. - `private`: The collection is private and can be only accessed, modified and administred by specified collaborators users. ',
      required: false,
      options: {
        options: [{ label: 'private', value: "private" }],
      },
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the collection',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await flatApiClient.put({
      auth, endpoint: '/collections/{collection}',
      body: {
        privacy: propsValue.privacy,
        title: propsValue.title,
      },
    });
    return response.body;
  },
});
