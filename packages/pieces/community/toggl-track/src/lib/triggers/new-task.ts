import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, QueryParams } from '@activepieces/pieces-common';
import { togglTrackAuth } from '../..';
import { togglCommon } from '../common';

const pollingStoreKey = 'toggl_new_task_trigger';

type Task = {
    id: number;
    [key: string]: unknown;
}

export const newTask = createTrigger({
    auth: togglTrackAuth,
    name: 'new_task',
    displayName: 'New Task',
    description: 'Fires when a new task is created.',
    props: {
        workspace_id: togglCommon.workspace_id,
        project_id: togglCommon.optional_project_id,
    },
    sampleData: {
        "id": 789123456,
        "name": "Design the login page",
        "project_id": 123987456,
        "workspace_id": 987654,
        "user_id": 555555,
        "estimated_seconds": 7200,
        "active": true,
        "at": "2025-08-29T11:05:00+00:00",
        "tracked_seconds": 0
    },
    type: TriggerStrategy.POLLING,

    async onEnable(context) {
        const { workspace_id, project_id } = context.propsValue;
        const tasks = await getTasks(context.auth, workspace_id as number, project_id as number | undefined);
        const taskIds = tasks.map(task => task.id);
        
        await context.store.put(pollingStoreKey, taskIds);
    },

    async onDisable(context) {
        await context.store.delete(pollingStoreKey);
    },

    async run(context) {
        const { workspace_id, project_id } = context.propsValue;
        const storedTaskIds = await context.store.get<number[]>(pollingStoreKey) ?? [];
        const currentTasks = await getTasks(context.auth, workspace_id as number, project_id as number | undefined);
        
        const oldTaskIdsSet = new Set(storedTaskIds);
        const newTasks = currentTasks.filter(task => !oldTaskIdsSet.has(task.id));

        if (newTasks.length > 0) {
            const allCurrentIds = currentTasks.map(task => task.id);
            await context.store.put(pollingStoreKey, allCurrentIds);
        }
        
        return newTasks;
    },
});

async function getTasks(apiToken: string, workspaceId: number, projectId?: number): Promise<Task[]> {
    const queryParams: QueryParams = {};
    if (projectId) {
        queryParams['pid'] = projectId.toString();
    }

    const response = await httpClient.sendRequest<{ data: Task[] }>({
        method: HttpMethod.GET,
        url: `https://api.track.toggl.com/api/v9/workspaces/${workspaceId}/tasks`,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${Buffer.from(`${apiToken}:api_token`).toString('base64')}`,
        },
        queryParams: queryParams,
    });
    return response.body?.data || [];
}