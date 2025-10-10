import { TriggerStrategy, createTrigger, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { MicrosoftPlannerAuth } from '../common/auth';
import { Client } from '@microsoft/microsoft-graph-client';
import { PlannerPlan } from '@microsoft/microsoft-graph-types';

const polling: Polling<PiecePropValueSchema<typeof MicrosoftPlannerAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.LAST_ITEM,
    items: async ({ auth }) => {
        const client = Client.initWithMiddleware({
            authProvider: {
                getAccessToken: () => Promise.resolve(auth.access_token),
            },
        });

        const response = await client.api('/planner/plans').get();
        const plans = response.value as PlannerPlan[];

        return plans.map((plan) => ({
            id: plan.id!,
            data: plan,
        }));
    },
};

export const newPlanCreatedTrigger = createTrigger({
    auth: MicrosoftPlannerAuth,
    name: 'new_plan_created',
    displayName: 'New Plan Created',
    description: 'Triggers when a new Planner plan is created.',
    props: {},
    type: TriggerStrategy.POLLING,
    sampleData: {
        id: 'sample-plan-id',
        title: 'New Marketing Campaign',
        owner: 'example-group-id',
        createdDateTime: '2025-10-10T09:30:00Z',
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

            const response = await client.api('/planner/plans').get();
            const plans = (response.value as PlannerPlan[]).slice(0, 5);
            return plans;
        } catch (error: any) {
            throw new Error(`Failed to fetch planner plans: ${error?.message || error}`);
        }
    },
});
