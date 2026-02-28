import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { klaviyoApiCall } from '../common';

export const findList = createAction({
  auth: klaviyoAuth,
  name: 'find_list',
  displayName: 'Find List by Name',
  description: 'Look up a list by name to get its ID.',
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      description: 'The name of the list to search for.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return await klaviyoApiCall(auth as string, HttpMethod.GET, '/lists', undefined, {
      filter: `equals(name,"${propsValue.name}")`,
    });
  },
});
