import { klaviyoAuth } from '../..';
import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../common';

export const findTagAction = createAction({
  auth: klaviyoAuth,
  name: 'klaviyo_find_tag',
  displayName: 'Find Tag',
  description: 'Find a tag by name.',
  props: {
    name: Property.ShortText({
      displayName: 'Tag Name',
      required: true,
      description: 'The name of the tag to search for',
    }),
  },
  async run(context) {
    const { name } = context.propsValue;

    const client = makeClient(context.auth);
    const result = await client.searchTagByName(name);

    return result.data.length > 0 ? result.data[0] : null;
  },
});

