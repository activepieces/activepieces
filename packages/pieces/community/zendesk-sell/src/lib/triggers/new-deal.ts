import {
    DedupeStrategy,
    HttpMethod,
    Polling,
    pollingHelper,
} from '@activepieces/pieces-common';
import {
    TriggerStrategy,
    createTrigger,
} from '@activepieces/pieces-framework';
import { zendeskSellAuth, ZendeskSellAuth } from '../common/auth';
import { callZendeskApi } from '../common';
import dayjs from 'dayjs';

interface Deal {
    id: number;
    name: string;
    value: string;
    created_at: string;
    [key: string]: unknown;
}

const polling: Polling<ZendeskSellAuth, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, lastFetchEpochMS }) => {
        const response = await callZendeskApi<{ items: { data: Deal }[] }>(
            HttpMethod.GET,
            'v2/deals?sort_by=created_at:desc&per_page=100',
            auth
        );

        const deals = response.body?.items.map(item => item.data) || [];
        
        const newDeals = deals.filter(deal => 
            dayjs(deal.created_at).valueOf() > lastFetchEpochMS
        );

        return newDeals.reverse().map((deal) => ({
            epochMilliSeconds: dayjs(deal.created_at).valueOf(),
            data: deal,
        }));
    },
};

export const newDeal = createTrigger({
    auth: zendeskSellAuth,
    name: 'new_deal',
    displayName: 'New Deal',
    description: 'Fires when a new deal is created.',
    props: {},
    sampleData: {
        "id": 21730067,
        "name": "Website Redesign Project",
        "value": 25000,
        "created_at": "2025-09-15T10:00:00Z",
    },
    type: TriggerStrategy.POLLING,
    async test(context) {
        return await pollingHelper.test(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
            files: context.files
        });
    },
    async onEnable(context) {
        await pollingHelper.onEnable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },
    async onDisable(context) {
        await pollingHelper.onDisable(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
        });
    },
    async run(context) {
        return await pollingHelper.poll(polling, {
            auth: context.auth,
            store: context.store,
            propsValue: context.propsValue,
            files: context.files
        });
    },
});