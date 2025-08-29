import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';

const pollingStoreKey = 'toggl_new_workspace_trigger';

type Workspace = {
    id: number;
    [key: string]: unknown;
}

export const newWorkspace = createTrigger({
    auth: togglTrackAuth,
    name: 'new_workspace',
    displayName: 'New Workspace',
    description: 'Fires when a new workspace is created.',
    props: {
        // No properties needed, this trigger monitors all workspaces.
    },
    sampleData: {
        "id": 123456,
        "organization_id": 98765,
        "name": "My New Workspace",
        "premium": true,
        "admin": true,
        "default_currency": "USD",
        "only_admins_may_create_projects": false,
        "only_admins_see_billable_rates": true,
        "rounding": 1,
        "rounding_minutes": 0,
        "at": "2025-08-29T10:15:30+00:00",
        "logo_url": "https://assets.toggl.com/images/workspace.jpg"
    },
    type: TriggerStrategy.POLLING,

    async onEnable(context) {
        const workspaces = await getWorkspaces(context.auth);
        const workspaceIds = workspaces.map(ws => ws.id);
        
        await context.store.put(pollingStoreKey, workspaceIds);
    },

    async onDisable(context) {
        await context.store.delete(pollingStoreKey);
    },

    async run(context) {
        const storedWorkspaceIds = await context.store.get<number[]>(pollingStoreKey) ?? [];
        const currentWorkspaces = await getWorkspaces(context.auth);
        
        const oldWorkspaceIdsSet = new Set(storedWorkspaceIds);
        const newWorkspaces = currentWorkspaces.filter(ws => !oldWorkspaceIdsSet.has(ws.id));

        if (newWorkspaces.length > 0) {
            const allCurrentIds = currentWorkspaces.map(ws => ws.id);
            await context.store.put(pollingStoreKey, allCurrentIds);
        }
        
        return newWorkspaces;
    },
});

async function getWorkspaces(apiToken: string): Promise<Workspace[]> {
    const response = await httpClient.sendRequest<{ workspaces: Workspace[] }>({
        method: HttpMethod.GET,
        url: `https://api.track.toggl.com/api/v9/me`,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString('base64')}`,
        },
    });
    return response.body?.workspaces || [];
}