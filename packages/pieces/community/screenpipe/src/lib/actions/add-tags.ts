import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { screenpipeAuth } from '../auth';
import { screenpipeApiRequest } from '../common';

export const addTags = createAction({
  auth: screenpipeAuth,
  name: 'add_tags',
  displayName: 'Add Tags',
  description: 'Add tags to a captured screen frame or audio chunk',
  props: {
    contentType: Property.StaticDropdown({
      displayName: 'Content Type',
      description: 'Type of content to tag',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Vision (Screen)', value: 'vision' },
          { label: 'Audio', value: 'audio' },
        ],
      },
    }),
    contentId: Property.Number({
      displayName: 'Content ID',
      description: 'The ID of the content to tag',
      required: true,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'List of tags to add',
      required: true,
    }),
  },
  async run(context) {
    return await screenpipeApiRequest({
      auth: context.auth,
      method: HttpMethod.POST,
      endpoint: `/tags/${context.propsValue.contentType}/${context.propsValue.contentId}`,
      body: {
        tags: context.propsValue.tags,
      },
    });
  },
});
