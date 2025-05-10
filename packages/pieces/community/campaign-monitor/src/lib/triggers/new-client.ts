import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../../index';

export const newClientTrigger = createTrigger({
    auth: campaignMonitorAuth,
    name: 'new_client',
    displayName: 'New Client',
    description: 'Triggered when a new client is added to Campaign Monitor',
    props: {},
    type: TriggerStrategy.POLLING,
    sampleData: {
        "ClientID": "a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1",
        "Name": "New Client"
    },
    async onEnable(context) {
        // Store the current timestamp to use as a starting point
        await context.store.put('last_clients_check_time', { timestamp: new Date().toISOString() });

        // Store the list of existing clients
        const clients = await makeRequest(
            { apiKey: context.auth as string },
            HttpMethod.GET,
            '/clients.json'
        ) as Array<{ ClientID: string, Name: string }>;

        await context.store.put('existing_clients', { clients: clients.map(c => c.ClientID) });
    },
    async onDisable(context) {
        // No cleanup needed for polling trigger
    },
    async run(context) {
        const currentTime = new Date().toISOString();

        // Get stored list of clients
        const storedClients = await context.store.get<{ clients: string[] }>('existing_clients');
        const existingClientIds = storedClients?.clients || [];

        // Get all clients
        const allClients = await makeRequest(
            { apiKey: context.auth as string },
            HttpMethod.GET,
            '/clients.json'
        ) as Array<{ ClientID: string, Name: string }>;

        // Find new clients
        const newClients = allClients.filter(client =>
            !existingClientIds.includes(client.ClientID)
        );

        // Update stored client list
        await context.store.put('existing_clients', {
            clients: allClients.map(c => c.ClientID)
        });

        // Update the last check time
        await context.store.put('last_clients_check_time', { timestamp: currentTime });

        // Return new clients
        return newClients;
    },
});
