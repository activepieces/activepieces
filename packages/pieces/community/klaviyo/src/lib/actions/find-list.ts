import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../common/auth';
import { klaviyoClient } from '../common/client';

export const findListAction = createAction({
  auth: klaviyoAuth,
  name: 'find_list',
  displayName: 'Find List by Name',
  description: 'Find a list by its name in Klaviyo',
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      description: 'The name of the list to search for',
      required: true,
    }),
  },
  async run(context) {
    const { name } = context.propsValue;

    return await klaviyoClient.findListByName(
      context.auth,
      name
    );
  },
});
