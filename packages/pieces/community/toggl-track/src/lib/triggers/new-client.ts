import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';

const pollingStoreKey = 'toggl_new_client_trigger';

type Client = {
    id: number;
    [key: string]: unknown;
}

export const newClient = createTrigger({
    auth: togglTrackAuth,
    name: 'new_client',
    displayName: 'New Client',
    description: 'Fires when a new client is created in a workspace.',
    props: {
        workspace_id: togglCommon.workspace_id,
    },
    sampleData: {
        "id": 123456789,
        "wid": 987654,
        "name": "New Client Name",
        "at": "2025-08-29T10:45:00+00:00",
        "notes": "Important client notes.",
        "archived": false
    },
    type: TriggerStrategy.POLLING,

    async onEnable(context) {
        
        const clients = await getClients(context.auth, context.propsValue.workspace_id as number);
        const clientIds = clients.map(client => client.id);
        
        await context.store.put(pollingStoreKey, clientIds);
    },

    async onDisable(context) {
       
        await context.store.delete(pollingStoreKey);
    },

    async run(context) {
        const storedClientIds = await context.store.get<number[]>(pollingStoreKey) ?? [];
        const currentClients = await getClients(context.auth, context.propsValue.workspace_id as number);
        
        const oldClientIdsSet = new Set(storedClientIds);
        const newClients = currentClients.filter(client => !oldClientIdsSet.has(client.id));

        if (newClients.length > 0) {
            
            const allCurrentIds = currentClients.map(client => client.id);
            await context.store.put(pollingStoreKey, allCurrentIds);
        }
        
        return newClients;
    },
});


async function getClients(apiToken: string, workspaceId: number): Promise<Client[]> {
    const response = await httpClient.sendRequest<Client[]>({
        method: HttpMethod.GET,
        url: `https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/clients`,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString('base64')}`,
        },
    });
    return response.body || [];
}