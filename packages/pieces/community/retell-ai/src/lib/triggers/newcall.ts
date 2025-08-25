import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { RetllAiAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';

const polling: Polling<PiecePropValueSchema<typeof RetllAiAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS }) => {
        const params: any = {
            limit: 50,
            sort_order: 'desc',
        };

        if (lastFetchEpochMS) {
            const lastFetchDate = dayjs(lastFetchEpochMS).toISOString();
            params.filter_criteria = {
                after_call_id: null,
                before_call_id: null,
                after_start_timestamp: lastFetchDate,
            };
        }

        const response = await makeRequest(
            auth as string,
            HttpMethod.GET,
            '/list-calls',
            undefined
        );

        const calls = response?.calls || [];
        
        return calls.map((call: any) => ({
            epochMilliSeconds: dayjs(call.start_timestamp || call.created_at).valueOf(),
            data: call,
        }));
    }
};

export const newcall = createTrigger({
    auth: RetllAiAuth,
    name: 'newcall',
    displayName: 'New Call',
    description: 'Fires when a new outgoing or incoming call is created in Retell AI. Provides call status and metadata.',
    props: {},
    sampleData: {
        call_id: "550e8400-e29b-41d4-a716-446655440000",
        call_type: "outbound",
        call_status: "completed",
        agent_id: "agent_123",
        from_number: "+1234567890",
        to_number: "+0987654321",
        start_timestamp: "2024-01-01T12:00:00Z",
        end_timestamp: "2024-01-01T12:05:30Z",
        duration: 330,
        disconnect_reason: "user_hangup",
        cost: 0.05,
        metadata: {}
    },
    type: TriggerStrategy.POLLING,
    async test(context) {
        return await pollingHelper.test(polling, context);
    },
    async onEnable(context) {
        const { store, auth, propsValue } = context;
        await pollingHelper.onEnable(polling, { store, auth, propsValue });
    },
    async onDisable(context) {
        const { store, auth, propsValue } = context;
        await pollingHelper.onDisable(polling, { store, auth, propsValue });
    },
    async run(context) {
        return await pollingHelper.poll(polling, context);
    },
});