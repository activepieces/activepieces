import { createAction, Property } from '@activepieces/pieces-framework';

import { mixmaxAuth } from '../auth';
import { mixmaxApiClient } from '../common';

export const listContacts = createAction({
  auth: mixmaxAuth,
  name: 'list_contacts',
  displayName: 'List Contacts',
  description:
    'List contacts in Mixmax. [See the documentation](https://developer.mixmax.com/reference/contacts)',
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Filter contacts by name or email',
      required: false,
    }),
    sort: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort results by',
      required: false,
      options: {
        options: [
          { label: 'Name', value: 'name' },
          { label: 'Email', value: 'email' },
          { label: 'Last Used', value: 'timestamp' },
          { label: 'Used Count', value: 'usedCount' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {};
    if (propsValue.search) queryParams.search = propsValue.search;
    if (propsValue.sort) queryParams.sort = propsValue.sort;

    const response = await mixmaxApiClient.getRequest({
      auth,
      endpoint: '/contacts',
      queryParams,
    });
    return response.body;
  },
});
