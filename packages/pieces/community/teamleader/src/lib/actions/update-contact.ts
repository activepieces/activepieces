import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const updateContact = createAction({
  name: 'updateContact',
  displayName: 'Update Contact',
  description: 'Modify existing Contact in Teamleader.',
  props: {
    id: Property.ShortText({ displayName: 'Contact ID', required: true }),
    firstName: Property.ShortText({ displayName: 'First Name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    // Add more fields as needed
  },
  async run(context) {
    const { id, firstName, lastName, email } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;
    if (!auth?.access_token) throw new Error('Missing access token');
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.focus.teamleader.eu/contacts.update',
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body: {
        id,
        ...(firstName ? { first_name: firstName } : {}),
        ...(lastName ? { last_name: lastName } : {}),
        ...(email ? { email } : {}),
      },
    });
    return response.body.data;
  },
}); 