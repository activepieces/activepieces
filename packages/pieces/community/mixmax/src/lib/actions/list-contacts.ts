import { createAction, Property } from '@activepieces/pieces-framework';
import { mixmaxAuth } from '../..';
import { mixmaxGetRequest } from '../common';

export const listContacts = createAction({
  auth: mixmaxAuth,
  name: 'list_contacts',
  displayName: 'List Contacts',
  description: 'List all contacts in Mixmax. [See the documentation](https://developer.mixmax.com/reference/contacts)',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of contacts to return (default: 20)',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {};
    if (propsValue.limit) queryParams['limit'] = String(propsValue.limit);

    const response = await mixmaxGetRequest(auth, '/contacts', queryParams);
    return response.body;
  },
});
