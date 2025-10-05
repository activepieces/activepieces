import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { simplyBookAuth, makeApiRequest } from '../common';

export const newClientTrigger = createTrigger({
  auth: simplyBookAuth,
  name: 'new_client',
  displayName: 'New Client',
  description: 'Triggers when a new client is added (via booking or manually)',
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 67890,
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    zip_code: '10001',
    country: 'USA',
    created_at: '2023-11-28T14:30:00Z',
  },
  async onEnable(context) {
    // Store the current timestamp to track new clients
    await context.store.put('last_client_check', new Date().toISOString());
  },
  async onDisable(context) {
    // Clean up if needed
    await context.store.delete('last_client_check');
  },
  async run(context) {
    const lastCheck = await context.store.get<string>('last_client_check');
    const now = new Date().toISOString();
    
    const params: Record<string, any> = {
      start_date: lastCheck || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      end_date: now,
    };

    const clients = await makeApiRequest(context.auth, 'getClients', params);
    
    // Filter for clients created since last check
    const newClients = (clients || []).filter((client: any) => 
      client.created_at && client.created_at > lastCheck
    );
    
    // Update the last check timestamp
    await context.store.put('last_client_check', now);
    
    return newClients;
  },
});
