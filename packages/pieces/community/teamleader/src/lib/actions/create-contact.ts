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

// Action: Create a new contact in Teamleader
export const createContact = createAction({
  name: 'createContact',
  displayName: 'Create Contact',
  description: 'Create a new contact in Teamleader.',
  props: {
    firstName: Property.ShortText({ displayName: 'First Name', required: true }),
    lastName: Property.ShortText({ displayName: 'Last Name', required: true }),
    email: Property.ShortText({ displayName: 'Email', required: false }),
    phone: Property.ShortText({ displayName: 'Phone', required: false }),
    address: Property.ShortText({ displayName: 'Address', required: false }),
  },
  async run(context) {
    const { firstName, lastName, email, phone, address } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;
    if (!auth?.access_token) throw new Error('Missing access token');
    const apiBase = getTeamleaderApiBaseUrl(auth);
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${apiBase}/contacts.add`,
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
        body: {
          first_name: firstName,
          last_name: lastName,
          ...(email ? { email } : {}),
          ...(phone ? { telephone: phone } : {}),
          ...(address ? { address } : {}),
        },
      });
      if (!response.body?.data) {
        throw new Error('Unexpected API response: missing data');
      }
      // Output schema: return the created contact object
      const contact: Contact = response.body.data;
      return contact;
    } catch (e: unknown) {
      throw new Error(`Failed to create contact: ${(e as Error).message}`);
    }
  },
}); 