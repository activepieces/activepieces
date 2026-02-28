import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, httpClient, HttpMethod } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { twentyAuth } from '../auth';

const polling: Polling<any, any> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth }) => {
        // 1. Look inside auth.props first, then fallback to auth directly
        const base_url = auth?.props?.base_url || auth?.base_url || "";
        const api_key = auth?.props?.api_key || auth?.api_key || "";

        if (!base_url) {
            throw new Error("Please provide your Twenty CRM Base URL in the connection settings.");
        }
        
        const sanitizedUrl = base_url.replace(/\/$/, '');

        const response = await httpClient.sendRequest<{ data: { people: any[] } }>({
            method: HttpMethod.GET,
            url: `${sanitizedUrl}/rest/people`,
            headers: { 
                Authorization: `Bearer ${api_key}`,
            },
            queryParams: {
                'sort[createdAt]': 'desc'
            }
        });

       const items = response.body.data?.people || [];

        return items.map((item) => ({
            epochMilliSeconds: dayjs(item.createdAt).valueOf(),
            data: item,
        }));
    }
}

export const newPerson = createTrigger({
    auth: twentyAuth,
    name: 'new_person',
    displayName: 'New Person',
    description: 'Triggers when a new person is created in Twenty CRM.',
    requireAuth: true,
    props: {},
    type: TriggerStrategy.POLLING,
    sampleData: {
        id: "303030-3030-3030",
        firstName: "Akash",
        lastName: "Kumar",
        createdAt: "2026-02-27T10:00:00Z"
    },
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