import { TriggerStrategy, createTrigger, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { MicrosoftPlannerAuth } from '../common/auth';
import { Client } from '@microsoft/microsoft-graph-client';
import { PlannerTask } from '@microsoft/microsoft-graph-types';
import dayjs from 'dayjs';

const polling: Polling<PiecePropValueSchema<typeof MicrosoftPlannerAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth }) => {
        const client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: () => Promise.resolve(auth.access_token),
            },
        });

        const response = await client.api('/planner/tasks').get();
        const tasks = response.value as PlannerTask[];

        return tasks.map((task) => ({
            epochMilliSeconds: dayjs(task.createdDateTime).valueOf(),
            data: task,
        }));
    },
};

export const newTaskCreatedTrigger = createTrigger({
    auth: MicrosoftPlannerAuth,
    name: 'new_task_created',
    displayName: 'New Task Created',
    description: 'Triggers when a new task is created in Microsoft 365 Planner.',
    props: {},
    type: TriggerStrategy.POLLING,
    sampleData: {
        id: 'sample-task-id',
        title: 'Design Homepage UI',
        createdDateTime: '2025-10-10T09:30:00Z',
        planId: 'sample-plan-id',
        bucketId: 'sample-bucket-id',
        assignments: {
            'user-id-123': {
                assignedBy: { user: { id: 'user-id-assigner' } },
                assignedDateTime: '2025-10-10T09:35:00Z',
            },
        },
    },

    async onEnable(context) {
        await pollingHelper.onEnable(polling, context as any);
    },

    async onDisable(context) {
        await pollingHelper.onDisable(polling, context as any);
    },

    async run(context) {
        return await pollingHelper.poll(polling, context as any);
    },

    async test(context) {
        try {
            const client = Client.initWithMiddleware({
                authProvider: {
                    getAccessToken: () => Promise.resolve(context.auth.access_token),
                },
            });

            const response = await client.api('/planner/tasks').get();
            const tasks = (response.value as PlannerTask[]).slice(0, 5);
            return tasks;
        } catch (error: any) {
            throw new Error(`Failed to fetch planner tasks: ${error?.message || error}`);
        }
    },
});
