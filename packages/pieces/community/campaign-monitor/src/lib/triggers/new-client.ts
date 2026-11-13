import { createTrigger, isNil, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../auth';
import { clientOutputSchema } from '../output-schemas';

export const newClientTrigger = createTrigger({
  auth: campaignMonitorAuth,
  name: 'new_client',
  classification: 'READ',
  displayName: 'New Client',
  description: 'Triggered when a new client is added to Campaign Monitor.',
  aiMetadata: {
    description:
      'Fires when a new client account appears in the authenticated Campaign Monitor login, detected by polling the account client list for IDs not previously seen.',
  },
  props: {},
  type: TriggerStrategy.POLLING,
  outputSchema: clientOutputSchema,
  sampleData: {
    ClientID: 'xyz',
    Name: 'New Client',
  },
  async onEnable(context) {
    if (
      context.isRepublish &&
      !isNil(await context.store.get('existing_clients'))
    ) {
      return;
    }
    const response = await makeRequest<
      Array<{ ClientID: string; Name: string }>
    >({
      auth: { apiKey: context.auth.secret_text },
      method: HttpMethod.GET,
      path: '/clients.json',
    });

    const clients = response.body;

    await context.store.put('existing_clients', {
      clients: clients.map((c) => c.ClientID),
    });
  },
  async onDisable(context) {
    if (context.isRepublish) {
      return;
    }
    await context.store.delete('existing_clients');
  },
  async test(context) {
    const response = await makeRequest<
      Array<{ ClientID: string; Name: string }>
    >({
      auth: { apiKey: context.auth.secret_text },
      method: HttpMethod.GET,
      path: '/clients.json',
    });

    return response.body;
  },
  async run(context) {
    const storedClients = await context.store.get<{ clients: string[] }>(
      'existing_clients'
    );
    const existingClientIds = storedClients?.clients || [];
    const response = await makeRequest<
      Array<{
        ClientID: string;
        Name: string;
      }>
    >({
      auth: { apiKey: context.auth.secret_text },
      method: HttpMethod.GET,
      path: '/clients.json',
    });

    const allClients = response.body;
    const newClients = allClients.filter(
      (client) => !existingClientIds.includes(client.ClientID)
    );
    const updatedClientIds = Array.from(
      new Set([...existingClientIds, ...allClients.map((c) => c.ClientID)])
    );
    await context.store.put('existing_clients', {
      clients: updatedClientIds,
    });
    return newClients;
  },
});
