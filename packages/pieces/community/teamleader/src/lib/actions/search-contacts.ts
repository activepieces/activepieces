import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const searchContacts = createAction({
  name: 'searchContacts',
  displayName: 'Search Contacts',
  description: 'List or filter Contacts via Teamleader API.',
  props: {
    firstName: Property.ShortText({ displayName: 'First Name (filter)', required: false }),
    lastName: Property.ShortText({ displayName: 'Last Name (filter)', required: false }),
    email: Property.ShortText({ displayName: 'Email (filter)', required: false }),
    pageSize: Property.Number({ displayName: 'Page Size', required: false, defaultValue: 50 }),
  },
  async run(context) {
    const { firstName, lastName, email, pageSize } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;
    if (!auth?.access_token) throw new Error('Missing access token');
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.focus.teamleader.eu/contacts.list',
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: {
        filter: {
          ...(firstName ? { first_name: firstName } : {}),
          ...(lastName ? { last_name: lastName } : {}),
          ...(email ? { email } : {}),
        },
        page: { size: pageSize || 50 },
      },
    });
    return response.body.data;
  },
}); 