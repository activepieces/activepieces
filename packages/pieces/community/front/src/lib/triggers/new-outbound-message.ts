import { createTrigger, TriggerStrategy, Property, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { frontAuth } from '../common/auth';
import { makeRequest } from '../common/client';

const polling: Polling<
    PiecePropValueSchema<typeof frontAuth>,
    Record<string, never>
> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS }) => {
        // Fetch outbound and out_reply message events
        const query = `q[types]=outbound`;
        const limit = 50;
        const response = await makeRequest(
            auth as string,
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

export const newOutboundMessage = createTrigger({
    auth: frontAuth,
    name: 'newOutboundMessage',
    displayName: 'New Outbound Message',
    description: 'Fires when a message is sent or replied to in Front.',
    props: {},
    sampleData: {
        id: 'evt_123',
        type: 'outbound',
        message: {
            id: 'msg_456',
            subject: 'Re: Welcome to Dunder Mifflin!',
            body: 'Thank you for your message.',
            created_at: 1701806790.536,
        },
        created_at: 1701806790.536,
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