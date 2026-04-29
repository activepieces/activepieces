import { createAction, Property } from '@activepieces/pieces-framework';
import { flatAuth } from '../auth';
import { flatApiClient } from '../common';

export const createCollectionAction = createAction({
  auth: flatAuth,
  name: 'create_collection',
  displayName: 'Create a new collection',
  description: 'This method will create a new collection and add it to your `root` collection. ',
  props: {
    privacy: Property.StaticDropdown({
      displayName: 'Privacy',
      description: 'The collection main privacy mode. - `private`: The collection is private and can be only accessed, modified and administred by specified collaborators users. ',
      required: true,
      options: {
        options: [{ label: 'private', value: "private" }],
      },
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'The title of the collection',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await flatApiClient.post({
      auth, endpoint: '/collections',
      body: {
        privacy: propsValue.privacy,
        title: propsValue.title,
      },
    });
    return response.body;
  },
});
