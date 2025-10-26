import {
    createTrigger,
    TriggerStrategy,
    Property,
    Store,
    TriggerHookContext
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth, ZendeskSellAuth as ZendeskSellAuthValue } from '../common/auth';
import { callZendeskApi } from '../common/client';

const STORE_KEY = 'updatedDeal_last_poll_time';

interface ZendeskDealItem {
    data: ZendeskDeal;
    meta: { type: string };
}
interface ZendeskDeal {
    id: number;
    name: string;
    value: string;
    stage_id: number;
    contact_id: number;
    owner_id: number;
    updated_at: string;
}

interface TriggerPropsValue {}

export const updatedDeal = createTrigger({
    auth: zendeskSellAuth,
    name: 'updated_deal',
    displayName: 'Updated Deal',
    description: 'Fires when an existing deal is modified (polls for updates).',
    props: {},
    sampleData: {
        "id": 123,
        "contact_id": 456,
        "name": "Updated Deal Name",
        "value": "25000.0",
        "currency": "USD",
        "owner_id": 789,
        "stage_id": 1,
        "created_at": "2025-10-20T10:00:00Z",
        "updated_at": "2025-10-27T01:21:00Z"
    },
    type: TriggerStrategy.POLLING,

    async test(context) {
        const { auth } = context;

        const response = await callZendeskApi<{ items: ZendeskDealItem[] }>(
            HttpMethod.GET,
            'v2/deals',
            auth as ZendeskSellAuthValue,
            undefined,
            {
                sort_by: 'updated_at:desc',
                per_page: '1',
            }
        );

        if (response.body.items && response.body.items.length > 0) {
            return [response.body.items[0].data];
        }
        return [{}];
    },

    async onEnable(context) {
        await context.store.put(STORE_KEY, Math.floor(Date.now() / 1000));
        console.log(`Initialized ${STORE_KEY} for updatedDeal`);
    },

    async onDisable(context) {
        await context.store.delete(STORE_KEY);
        console.log(`Cleaned up ${STORE_KEY} for updatedDeal`);
    },

    async run(context) {
        const { auth, store } = context;
        const lastPollTimeSeconds = await store.get<number>(STORE_KEY) ?? 0;

        console.log(`Polling deals updated after timestamp (seconds): ${lastPollTimeSeconds}`);

        const response = await callZendeskApi<{ items: ZendeskDealItem[] }>(
            HttpMethod.GET,
            'v2/deals',
            auth as ZendeskSellAuthValue,
            undefined,
            {
                sort_by: 'updated_at:asc',
                per_page: '100',
            }
        );

        const deals = response.body.items.map(item => item.data);
        let maxTimestampSeconds = lastPollTimeSeconds;
        const updatedDealsSinceLastPoll: ZendeskDeal[] = [];

        for (const deal of deals) {
            const updatedAtSeconds = Math.floor(new Date(deal.updated_at).getTime() / 1000);

            if (updatedAtSeconds > lastPollTimeSeconds) {
                updatedDealsSinceLastPoll.push(deal);
                if (updatedAtSeconds > maxTimestampSeconds) {
                    maxTimestampSeconds = updatedAtSeconds;
                }
            }
        }

        if (updatedDealsSinceLastPoll.length > 0) {
            await store.put(STORE_KEY, maxTimestampSeconds);
            console.log(`Updated ${STORE_KEY} to: ${maxTimestampSeconds}`);
        } else {
             console.log(`No deals updated since last poll time: ${lastPollTimeSeconds}`);
        }

        console.log(`Found ${updatedDealsSinceLastPoll.length} updated deals.`);
        return updatedDealsSinceLastPoll;
    },
});