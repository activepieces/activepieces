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

        const assignedTasks = tasks.filter(
            (task) =>
                task.assignments &&
                Object.keys(task.assignments).length > 0 &&
                Object.keys(task.assignments).includes(auth.access_token)
        );

        return assignedTasks.map((task) => ({
            epochMilliSeconds: dayjs(task.createdDateTime).valueOf(),
            data: task,
        }));
    },
};

export const newTaskAssignedToUserTrigger = createTrigger({
    auth: MicrosoftPlannerAuth,
    name: 'new_task_assigned_to_user',
    displayName: 'New Task Assigned to User',
    description: 'Triggers when a new task is assigned to the authenticated user in Microsoft 365 Planner.',
    props: {},
    type: TriggerStrategy.POLLING,
    sampleData: {
        id: 'sample-task-id',
        title: 'Review Product Launch Plan',
        createdDateTime: '2025-10-10T10:00:00Z',
        planId: 'sample-plan-id',
        bucketId: 'sample-bucket-id',
        assignments: {
            'user-id-123': {
                assignedBy: { user: { id: 'assigner-user-id' } },
                assignedDateTime: '2025-10-10T10:05:00Z',
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
            const tasks = (response.value as PlannerTask[])
                .filter(
                    (task) =>
                        task.assignments &&
                        Object.keys(task.assignments).length > 0
                )
                .slice(0, 5);

            return tasks;
        } catch (error: any) {
            throw new Error(`Failed to fetch assigned tasks: ${error?.message || error}`);
        }
    },
});
