import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getTeamleaderApiBaseUrl } from '../common';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  telephone?: string;
  address?: string;
  created_at?: string;
}

// Action: Update a contact in Teamleader
export const updateContact = createAction({
  name: 'updateContact',
  displayName: 'Update Contact',
  description: 'Update an existing contact in Teamleader.',
  props: {
    id: Property.ShortText({ displayName: 'Contact ID', required: true, description: 'The ID of the contact to update.' }),
    firstName: Property.ShortText({ displayName: 'First Name', required: false }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: false }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    address: Property.ShortText({ displayName: 'Address', required: false }),
  },
  async run(context) {
    const { id, firstName, lastName, email, phone, address } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;
    if (!auth?.access_token) throw new Error('Missing access token');
    const apiBase = getTeamleaderApiBaseUrl(auth);
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${apiBase}/contacts.update`,
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
        body: {
          id,
          ...(firstName ? { first_name: firstName } : {}),
          ...(lastName ? { last_name: lastName } : {}),
          ...(email ? { email } : {}),
          ...(phone ? { telephone: phone } : {}),
          ...(address ? { address } : {}),
        },
      });
      if (!response.body?.data) {
        throw new Error('Unexpected API response: missing data');
      }
      // Output schema: return the updated contact object
      const contact: Contact = response.body.data;
      return contact;
    } catch (e: unknown) {
      throw new Error(`Failed to update contact: ${(e as Error).message}`);
    }
  },
}); 