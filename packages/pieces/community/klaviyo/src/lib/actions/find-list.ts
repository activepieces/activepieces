import { klaviyoAuth } from '../..';
import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../common';

export const findListAction = createAction({
  auth: klaviyoAuth,
  name: 'klaviyo_find_list',
  displayName: 'Find List',
  description: 'Find a list by name.',
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      required: true,
      description: 'The name of the list to search for',
    }),
  },
  async run(context) {
    const { name } = context.propsValue;

    const client = makeClient(context.auth);
    const result = await client.searchListByName(name);

    return result.data.length > 0 ? result.data[0] : null;
  },
});

