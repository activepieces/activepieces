import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../common/auth';
import { klaviyoApiCall } from '../common/client';

export const findListByNameAction = createAction({
  auth: klaviyoAuth,
  name: 'find_list_by_name',
  displayName: 'Find List by Name',
  description: 'Search for a Klaviyo list by its name.',
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      description: 'Name of the list to search for (case-sensitive, exact match)',
      required: true,
    }),
  },
  async run(context) {
    return klaviyoApiCall({
      apiKey: context.auth,
      method: HttpMethod.GET,
      endpoint: '/lists',
      queryParams: {
        filter: `equals(name,"${context.propsValue.name}")`,
      },
    });
  },
});
