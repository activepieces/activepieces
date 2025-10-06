import {
  createTrigger,
  TriggerStrategy,
  Property
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { simplybookAuth, getAccessToken, SimplybookAuth } from '../common';

export const newClient = createTrigger({
  auth: simplybookAuth,
  name: 'new_client',
  displayName: 'New Client',
  description: 'Triggers when a new client is added (via booking or manually)',
  type: TriggerStrategy.POLLING,
  props: {
    search: Property.ShortText({
      displayName: 'Search Filter',
      description: 'Optional search string to filter clients',
      required: false
    })
  },
  async onEnable(context) {
    // Store the highest client ID to track new clients from this point forward
    const auth = context.auth as SimplybookAuth;
    const accessToken = await getAccessToken(auth);

    try {
      const response = await httpClient.sendRequest<any>({
        method: HttpMethod.GET,
        url: 'https://user-api-v2.simplybook.me/admin/clients?on_page=1&page=1',
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Login': auth.companyLogin,
          'X-Token': accessToken
        }
      });

      const clients = response.body?.data || [];
      if (clients.length > 0) {
        const maxId = Math.max(...clients.map((c: any) => c.id));
        await context.store.put('lastClientId', maxId);
      } else {
        await context.store.put('lastClientId', 0);
      }
    } catch {
      await context.store.put('lastClientId', 0);
    }
  },
  async onDisable(context) {
    await context.store.delete('lastClientId');
  },
  async run(context) {
    const auth = context.auth as SimplybookAuth;
    const accessToken = await getAccessToken(auth);

    const lastClientId = (await context.store.get<number>('lastClientId')) || 0;

    // Build query parameters
    const queryParams: string[] = ['on_page=100', 'page=1'];

    // Add search filter if provided
    if (context.propsValue.search) {
      queryParams.push(
        `filter[search]=${encodeURIComponent(context.propsValue.search)}`
      );
    }

    const queryString = `?${queryParams.join('&')}`;

    try {
      const response = await httpClient.sendRequest<any>({
        method: HttpMethod.GET,
        url: `https://user-api-v2.simplybook.me/admin/clients${queryString}`,
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Login': auth.companyLogin,
          'X-Token': accessToken
        }
      });

      const clients = response.body?.data || [];

      // Filter for new clients with ID greater than last seen
      const newClients = clients.filter((client: any) => {
        return client.id > lastClientId;
      });

      // Update last client ID if we have clients
      if (clients.length > 0) {
        const maxId = Math.max(...clients.map((c: any) => c.id));
        await context.store.put('lastClientId', maxId);
      }

      return newClients;
    } catch (error: any) {
      throw new Error(`Failed to fetch clients: ${error.message}`);
    }
  },
  async test(context) {
    const auth = context.auth as SimplybookAuth;
    const accessToken = await getAccessToken(auth);

    // Build query parameters
    const queryParams: string[] = ['on_page=5', 'page=1'];

    // Add search filter if provided
    if (context.propsValue.search) {
      queryParams.push(
        `filter[search]=${encodeURIComponent(context.propsValue.search)}`
      );
    }

    const queryString = `?${queryParams.join('&')}`;

    try {
      const response = await httpClient.sendRequest<any>({
        method: HttpMethod.GET,
        url: `https://user-api-v2.simplybook.me/admin/clients${queryString}`,
        headers: {
          'Content-Type': 'application/json',
          'X-Company-Login': auth.companyLogin,
          'X-Token': accessToken
        }
      });

      return response.body?.data || [];
    } catch (error: any) {
      throw new Error(`Failed to test trigger: ${error.message}`);
    }
  },
  sampleData: {
    id: 12345,
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    address: '123 Main St',
    city: 'New York',
    zip: '10001',
    country: 'USA',
    created_at: '2025-10-05T10:30:00.000Z',
    fields: [
      {
        id: 'field_1',
        title: 'Date of Birth',
        value: '1990-01-15',
        type: 'text',
        is_visible: true,
        is_optional: false,
        is_built_in: false
      },
      {
        id: 'field_2',
        title: 'Preferred Contact Method',
        value: 'Email',
        type: 'select',
        is_visible: true,
        is_optional: true,
        is_built_in: false,
        values: [
          { label: 'Email', value: 'email' },
          { label: 'Phone', value: 'phone' },
          { label: 'SMS', value: 'sms' }
        ]
      }
    ]
  }
});
