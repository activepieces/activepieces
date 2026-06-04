import { createAction, Property } from '@activepieces/pieces-framework';

import { mixmaxAuth } from '../auth';
import { mixmaxApiClient } from '../common';

export const findContact = createAction({
  auth: mixmaxAuth,
  name: 'find_contact',
  displayName: 'Find Contact',
  description:
    'Search for a contact in Mixmax. [See the documentation](https://developer.mixmax.com/reference/contactsquery)',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Email address or name to search for',
      required: true,
    }),
    includeSalesforceContacts: Property.Checkbox({
      displayName: 'Include Salesforce Contacts',
      description: 'Include Salesforce contacts in search results',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = { q: propsValue.query };
    if (propsValue.includeSalesforceContacts) {
      queryParams.includeSalesforceContacts = 'true';
    }

    const response = await mixmaxApiClient.getRequest({
      auth,
      endpoint: '/contacts/query',
      queryParams,
    });
    return response.body;
  },
});
