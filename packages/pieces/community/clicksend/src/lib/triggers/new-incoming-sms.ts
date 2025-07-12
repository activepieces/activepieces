
import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import { clicksendAuth } from '../../index';
import { makeRequest } from '../common';

const polling: Polling<PiecePropValueSchema<typeof clicksendAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS }) => {

        const apiKey = `${auth.username}:${auth.password}`;
        const queryParams: Record<string, any> = {};
        if (lastFetchEpochMS) {
            // ClickSend expects seconds, not ms
            queryParams['date_from'] = Math.floor(lastFetchEpochMS / 1000);
        }
      
        const response = await makeRequest(
            apiKey,
            HttpMethod.GET,
            '/sms/inbound?page=1&limit=15',
            queryParams
        );
        // Defensive: handle both array and paginated object
        const messages = Array.isArray(response?.data?.data)
            ? response.data.data
            : [];

        return messages.map((msg: any) => ({
            epochMilliSeconds: msg.timestamp_send * 1000,
            data: msg,
        }));
    }
};

export const newIncomingSms = createTrigger({
    auth: clicksendAuth,
    name: 'newIncomingSms',
    displayName: 'New Incoming SMS',
    description: 'Trigger when a new SMS is received in your ClickSend account.',
    props: {},
    sampleData: {
        timestamp_send: 1722997250,
        from: "+61123456789",
        body: "reply to msg on 7 aug 2024",
        original_body: "test msg",
        original_message_id: "1EF54639-F16D-681E-947A-4F4FCDFD2B87",
        to: "+61113456789",
        custom_string: "",
        message_id: "D2F2BCC3-6558-4DAA-858E-AD7529CC809C",
        _keyword: "reply"
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