import { createAction, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getTeamleaderApiBaseUrl } from '../common';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  created_at?: string;
}

// Action: Search for contacts in Teamleader
export const searchContacts = createAction({
  name: 'searchContacts',
  displayName: 'Search Contacts',
  description: 'Search for contacts in Teamleader.',
  props: {
    query: Property.ShortText({ displayName: 'Query', required: false, description: 'Search term for contact name or email.' }),
    email: Property.ShortText({ displayName: 'Email', required: false, description: 'Filter by email address.' }),
  },
  async run(context) {
    const { query, email } = context.propsValue;
    const auth = context.auth as OAuth2PropertyValue;
    if (!auth?.access_token) throw new Error('Missing access token');
    const apiBase = getTeamleaderApiBaseUrl(auth);
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${apiBase}/contacts.list`,
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
        },
        body: {
          ...(query ? { filter: { first_name: { contains: query } } } : {}),
          ...(email ? { filter: { ...(query ? { first_name: { contains: query } } : {}), email } } : {}),
          page: { size: 50 },
        },
      });
      if (!response.body?.data || !Array.isArray(response.body.data)) {
        throw new Error('Unexpected API response: missing data array');
      }
      // Map output to a clear schema
      return response.body.data.map((contact: Contact) => ({
        id: contact.id,
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        created_at: contact.created_at,
      }));
    } catch (e: unknown) {
      throw new Error(`Failed to search contacts: ${(e as Error).message}`);
    }
  },
}); 