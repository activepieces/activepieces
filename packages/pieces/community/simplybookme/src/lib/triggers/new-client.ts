import {
  AppConnectionValueForAuthProperty,
  createTrigger,
  TriggerStrategy
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper
} from '@activepieces/pieces-common';
import { simplybookAuth, makeJsonRpcCall } from '../common';

const polling: Polling<AppConnectionValueForAuthProperty<typeof simplybookAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth }) => {
    const authData = auth;
    
    const clients = await makeJsonRpcCall<any[]>(
      authData.props,
      'getClientList',
      ['', null]
    );
    
    // Handle object with numeric keys format
    let clientArray: any[] = [];
    if (Array.isArray(clients)) {
      clientArray = clients;
    } else if (clients && typeof clients === 'object') {
      const keys = Object.keys(clients);
      if (keys.length > 0 && keys.every((k) => !isNaN(Number(k)))) {
        clientArray = Object.values(clients);
      }
    }
    
    return clientArray
      .sort((a, b) => b.id - a.id)
      .map((client) => ({
        id: client.id,
        data: client
      }));
  }
};

export const newClient = createTrigger({
  auth: simplybookAuth,
  name: 'new_client',
  displayName: 'New Client',
  description: 'Triggers when a new client is added (via booking or manually) in SimplyBook.me',
  type: TriggerStrategy.POLLING,
  props: {},
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
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
    created_at: '2025-10-05T10:30:00.000Z'
  }
});
