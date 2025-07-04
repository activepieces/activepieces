import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { baseApiUrl } from '../..';
import dayjs from 'dayjs';

const polling: Polling<PiecePropValueSchema<any>, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, propsValue, lastFetchEpochMS }) => {
        const res = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: baseApiUrl + 'api/user/assistants',
            headers: {
                Authorization: "Bearer " + auth,
            },
        });

        if (res.status !== 200) {
            throw new Error(`Failed to fetch assistants. Status: ${res.status}`);
        }

        const assistants = res.body || [];
        
        return [{
            epochMilliSeconds: dayjs().valueOf(),
            data: assistants,
        }];
        }
};

export const getAssistants = createTrigger({
name: 'getAssistants',
    displayName: 'Get Assistants',
    description: 'Triggers when assistants are fetched or updated in your Autocalls account.',
props: {},
    sampleData: {
        id: "assistant_123",
        name: "Customer Support Assistant",
        description: "Handles customer inquiries and support requests",
        status: "active",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T14:20:00Z",
        settings: {
            voice: "en-US-female",
            language: "en-US",
            max_duration: 300
        }
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