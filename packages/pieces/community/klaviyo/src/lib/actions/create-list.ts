import { klaviyoAuth } from '../..';
import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../common';

export const createListAction = createAction({
  auth: klaviyoAuth,
  name: 'klaviyo_create_list',
  displayName: 'Create List',
  description: 'Create a new list in Klaviyo.',
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      required: true,
      description: 'The name for the new list',
    }),
  },
  async run(context) {
    const { name } = context.propsValue;

    const client = makeClient(context.auth);
    return await client.createList({ name });
  },
});

