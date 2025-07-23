import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const createContact = createAction({
  name: 'createContact',
  displayName: 'Create Contact',
  description: 'Create a new Contact record in Teamleader.',
  props: {
    firstName: Property.ShortText({ displayName: 'First Name', required: true }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: true }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    // Add more fields as needed
  },
  async run(context) {
    const { firstName, lastName, email } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;
    if (!auth?.access_token) throw new Error('Missing access token');
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.focus.teamleader.eu/contacts.add',
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: {
        first_name: firstName,
        last_name: lastName,
        email,
      },
    });
    return response.body.data;
  },
}); 