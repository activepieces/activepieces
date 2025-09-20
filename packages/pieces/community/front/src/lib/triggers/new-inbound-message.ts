import { createTrigger, TriggerStrategy, Property, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import dayjs from 'dayjs';

const polling: Polling<
    PiecePropValueSchema<typeof frontAuth>,
    { inbox_id: string }
> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const query = `q[types]=inbound`;
        const limit = 50;
        const response = await makeRequest(
            auth.access_token,
            HttpMethod.GET,
            `/events?${query}&limit=${limit}`
        );
        const events = response._results || [];
        const outboundMessages: any[] = [];

        for (const event of events) {
            // Only include new events since last fetch
            const createdAtMs = Math.floor(Number(event.created_at) * 1000);
            if (!lastFetchEpochMS || createdAtMs > lastFetchEpochMS) {
                outboundMessages.push({
                    epochMilliSeconds: createdAtMs,
                    data: event,
                });
            }
        }
        return outboundMessages;
    },
};

export const newInboundMessage = createTrigger({
    auth: frontAuth,
    name: 'newInboundMessage',
    displayName: 'New Inbound Message',
    description: 'Fires when a new message is received in a shared inbox.',
    props: {
        inbox_id: Property.ShortText({
            displayName: 'Inbox ID',
            description: 'The ID of the inbox to monitor for new inbound messages.',
            required: true,
        }),
    },
    sampleData: {
        id: 'msg_123',
        conversation_id: 'cnv_456',
        subject: 'Welcome to Dunder Mifflin!',
        body: 'Hello, this is your onboarding message.',
        created_at: 1701806790.536,
        status: 'open',
        assignee: {
            id: 'tea_6r55a',
            email: 'michael.scott@dundermifflin.com',
            first_name: 'Michael',
            last_name: 'Scott',
        },
        tags: [
            {
                id: 'tag_2oxhvy',
                name: 'Warehouse task',
            },
        ],
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