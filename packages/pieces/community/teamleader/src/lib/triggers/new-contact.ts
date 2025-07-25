import { createTrigger, TriggerStrategy, Property, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { getTeamleaderApiBaseUrl } from '../common';

interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  created_at: string;
}

// Trigger: Fires when a new contact is added in Teamleader
export const newContact = createTrigger({
  name: 'newContact',
  displayName: 'New Contact',
  description: 'Fires when a new contact is added in Teamleader.',
  type: TriggerStrategy.POLLING,
  props: {
    since: Property.DateTime({
      displayName: 'Created Since',
      required: false,
      description: 'Only fetch contacts created after this date/time',
    }),
  },
  sampleData: {
    id: '22222',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    created_at: '2024-01-01T12:00:00Z',
  },
  // Required by interface, intentionally left empty for framework compliance
  async onEnable(): Promise<void> { /* intentionally empty */ },
  async onDisable(): Promise<void> { /* intentionally empty */ },
  async run(context) {
    const since = context.propsValue.since;
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
          ...(since ? { filter: { created_at: { gte: since } } } : {}),
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
      throw new Error(`Failed to fetch contacts: ${(e as Error).message}`);
    }
  },
  async test(context) {
    return await this.run(context as never);
  },
}); 