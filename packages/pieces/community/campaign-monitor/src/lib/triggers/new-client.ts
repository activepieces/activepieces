import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../../index';

export const newClientTrigger = createTrigger({
  auth: campaignMonitorAuth,
  name: 'new_client',
  displayName: 'New Client',
  description: 'Triggered when a new client is added to Campaign Monitor.',
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    ClientID: 'xyz',
    Name: 'New Client',
  },
  async onEnable(context) {
    // Store the list of existing clients
    const response = await makeRequest(
      { apiKey: context.auth as string },
      HttpMethod.GET,
      '/clients.json'
    );

    const clients = response.body as Array<{ ClientID: string; Name: string }>;

    await context.store.put('existing_clients', {
      clients: clients.map((c) => c.ClientID),
    });
  },
  async onDisable(context) {
    // No cleanup needed for polling trigger
    await context.store.delete('existing_clients');
  },
  async test(context) {
    const response = await makeRequest(
      { apiKey: context.auth as string },
      HttpMethod.GET,
      '/clients.json'
    );

    return response.body;
  },
  async run(context) {
    // Get stored list of clients
    const storedClients = await context.store.get<{ clients: string[] }>(
      'existing_clients'
    );
    const existingClientIds = storedClients?.clients || [];

    // Get all clients
    const response = await makeRequest(
      { apiKey: context.auth as string },
      HttpMethod.GET,
      '/clients.json'
    );

    const allClients = response.body as Array<{
      ClientID: string;
      Name: string;
    }>;

    // Find new clients
    const newClients = allClients.filter(
      (client) => !existingClientIds.includes(client.ClientID)
    );

    // Update stored client list
    const updatedClientIds = Array.from(
      new Set([...existingClientIds, ...allClients.map((c) => c.ClientID)])
    );
    await context.store.put('existing_clients', {
      clients: updatedClientIds,
    });

    // Return new clients
    return newClients;
  },
});
