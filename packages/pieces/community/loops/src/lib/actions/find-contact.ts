import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { loopsAuth, LOOPS_BASE_URL } from '../auth';

export const findContact = createAction({
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Finds a contact in Loops by their email address or user ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up a contact in Loops by a single search field, chosen via a Search By selector that switches between matching on email or on internal user ID (the API allows only one search parameter). Use to check whether a contact exists or to retrieve their details before acting. Read-only and idempotent.',
    idempotent: true,
  },
  auth: loopsAuth,
  props: {
    searchBy: Property.StaticDropdown({
      displayName: 'Search By',
      description: 'The field to search by. The Loops API only allows one search parameter.',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Email', value: 'email' },
          { label: 'User ID', value: 'userId' },
        ],
      },
    }),
    searchValue: Property.ShortText({
      displayName: 'Value',
      description: 'The email address or user ID to search for.',
      required: true,
    }),
  },
  async run(context) {
    const { searchBy, searchValue } = context.propsValue;

    const params = new URLSearchParams();
    params.set(searchBy, searchValue);

    const response = await httpClient.sendRequest<unknown[]>({
      method: HttpMethod.GET,
      url: `${LOOPS_BASE_URL}/contacts/find?${params.toString()}`,
      headers: {
        Authorization: `Bearer ${context.auth.secret_text}`,
        Accept: 'application/json',
      },
    });

    const data = response.body;

    return {
      contacts: data,
      count: Array.isArray(data) ? data.length : 0,
    };
  },
});
