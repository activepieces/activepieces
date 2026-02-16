import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { klaviyoClient } from '../common/client';

export const findTagAction = createAction({
  auth: klaviyoAuth,
  name: 'find_tag',
  displayName: 'Find Tag by Name',
  description: 'Find a tag by its name in Klaviyo',
  props: {
    name: Property.ShortText({
      displayName: 'Tag Name',
      description: 'The name of the tag to search for',
      required: true,
    }),
  },
  async run(context) {
    const { name } = context.propsValue;

    return await klaviyoClient.findTagByName(
      context.auth,
      name
    );
  },
});
