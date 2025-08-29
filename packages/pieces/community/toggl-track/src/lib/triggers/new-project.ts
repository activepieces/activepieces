import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';

const pollingStoreKey = 'toggl_new_project_trigger';

type Project = {
    id: number;
    [key: string]: unknown;
}

export const newProject = createTrigger({
    auth: togglTrackAuth,
    name: 'new_project',
    displayName: 'New Project',
    description: 'Fires when a new project is added to a workspace.',
    props: {
        workspace_id: togglCommon.workspace_id,
    },
    sampleData: {
        "id": 123987456,
        "workspace_id": 987654,
        "client_id": 123456789,
        "name": "New Website Development",
        "is_private": false,
        "active": true,
        "at": "2025-08-29T10:54:00+00:00",
        "created_at": "2025-08-29T10:54:00+00:00",
        "color": "#06a893",
        "billable": true,
        "template": false
    },
    type: TriggerStrategy.POLLING,

    async onEnable(context) {
        const projects = await getProjects(context.auth, context.propsValue.workspace_id as number);
        const projectIds = projects.map(p => p.id);
        
        await context.store.put(pollingStoreKey, projectIds);
    },

    async onDisable(context) {
        await context.store.delete(pollingStoreKey);
    },

    async run(context) {
        const storedProjectIds = await context.store.get<number[]>(pollingStoreKey) ?? [];
        const currentProjects = await getProjects(context.auth, context.propsValue.workspace_id as number);
        
        const oldProjectIdsSet = new Set(storedProjectIds);
        const newProjects = currentProjects.filter(p => !oldProjectIdsSet.has(p.id));

        if (newProjects.length > 0) {
            const allCurrentIds = currentProjects.map(p => p.id);
            await context.store.put(pollingStoreKey, allCurrentIds);
        }
        
        return newProjects;
    },
});

async function getProjects(apiToken: string, workspaceId: number): Promise<Project[]> {
    const response = await httpClient.sendRequest<Project[]>({
        method: HttpMethod.GET,
        url: `https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/projects`,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString('base64')}`,
        },
    });
    return response.body || [];
}