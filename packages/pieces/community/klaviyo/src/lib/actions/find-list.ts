import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../auth';
import { klaviyoCommon, escapeFilterValue } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const findList = createAction({
  auth: klaviyoAuth,
  name: 'find_list',
  displayName: 'Find List by Name',
  description: 'Search for a list by its name',
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      description: 'The name of the list to find',
      required: true,
    }),
  },
  async run(context) {
    const { name } = context.propsValue;

    const filter = `equals(name,"${escapeFilterValue(name)}")`;

    const response = await klaviyoCommon.makeRequest(
      context.auth,
      HttpMethod.GET,
      `/lists?filter=${encodeURIComponent(filter)}`
    );

    const lists = response.body.data || [];

    return {
      found: lists.length > 0,
      count: lists.length,
      lists,
    };
  },
});
