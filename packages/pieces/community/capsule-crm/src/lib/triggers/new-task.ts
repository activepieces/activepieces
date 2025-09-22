import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { capsuleCrmAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

interface CapsuleTask {
    id: number;
    createdAt: string;
    [key: string]: any;
}

const polling: Polling<string, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth }) => {
        const response = await makeRequest<{ tasks: CapsuleTask[] }>(
            auth,
            HttpMethod.GET,
            `/tasks?status=open&perPage=100&embed=party,opportunity,kase,owner`
        );

        const items = response.tasks.map((task) => ({
            epochMilliSeconds: new Date(task.createdAt).getTime(),
            data: task,
        }));
        
        items.sort((a, b) => a.epochMilliSeconds - b.epochMilliSeconds);
        
        return items;
    },
};

export const newTasks = createTrigger({
    auth: capsuleCrmAuth,
    name: 'new_task',
    displayName: 'New Task',
    description: 'Fires when a new task is created.',
    props: {},
    sampleData: {
        "id": 493,
        "category": { "id": 47, "name": "Billing" },
        "description": "Send quarterly invoice",
        "status": "OPEN",
        "party": { "id": 448322, "type": "organisation", "name": "ABC Furniture" },
        "owner": { "id": 1, "username": "owner", "name": "Rupert Ada" },
        "createdAt": "2025-10-26T14:37:52Z",
        "updatedAt": "2025-10-26T14:37:52Z",
        "dueOn": "2025-10-01",
    },
    type: TriggerStrategy.POLLING,
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
});