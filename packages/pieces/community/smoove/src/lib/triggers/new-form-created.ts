
import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, HttpMethod, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { smooveAuth } from '../common/auth';
import { makeRequest } from '../common/client';


const polling: Polling<PiecePropValueSchema<typeof smooveAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.LAST_ITEM,
    items: async ({ auth }) => {
        const response = await makeRequest(auth, HttpMethod.GET, '/LandingPages');
        const items = Array.isArray(response) ? response : [];

        const sorted = items.sort((a, b) => b.id - a.id);
        return sorted.map(item => ({
            id: item.id,
            data: item,
        }));
    }
};

export const newFormCreated = createTrigger({
    auth: smooveAuth,
    name: 'newFormCreated',
    displayName: 'New Form Created',
    description: '',
    props: {},
    sampleData: {
        "formId": 581014,
        "formTitle": "Landing page - 581014 ",
        "formType": "LandingPage"
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