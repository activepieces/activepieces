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

const STORE_KEY = 'newDeal_seen_ids';
const MAX_SEEN_IDS = 1000;

interface ZendeskDealItem {
    data: ZendeskDeal;
    meta: { type: string };
}
interface ZendeskDeal {
    id: number;
    name: string;
    contact_id: number;
    value: string;
    stage_id: number;
    created_at: string;
}

interface TriggerPropsValue {}

export const newDeal = createTrigger({
    auth: zendeskSellAuth,
    name: 'new_deal',
    displayName: 'New Deal',
    description: 'Fires when a new deal is created (polls for new records).',
    props: {},
    sampleData: {
        "id": 1,
        "creator_id": 1,
        "owner_id": 1,
        "contact_id": 1,
        "name": "Website Redesign",
        "value": "15000.0",
        "currency": "USD",
        "hot": false,
        "stage_id": 12,
        "created_at": "2025-10-27T10:30:00Z",
        "updated_at": "2025-10-27T10:30:00Z",
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
                sort_by: 'created_at:desc',
                per_page: '1',
            }
        );

        if (response.body.items && response.body.items.length > 0) {
            return [response.body.items[0].data];
        }
        return [{}];
    },

    async onEnable(context) {
        const { auth, store } = context;
        console.log(`Initializing ${STORE_KEY} for newDeal`);

        const response = await callZendeskApi<{ items: ZendeskDealItem[] }>(
            HttpMethod.GET,
            'v2/deals',
            auth as ZendeskSellAuthValue,
            undefined,
            {
                sort_by: 'created_at:desc',
                per_page: '100',
            }
        );
        const initialIds = response.body.items.map(item => item.data.id.toString());
        await store.put<string[]>(STORE_KEY, initialIds.slice(0, MAX_SEEN_IDS));
        console.log(`Stored initial ${initialIds.length} deal IDs.`);
    },

    async onDisable(context) {
        await context.store.delete(STORE_KEY);
        console.log(`Cleaned up ${STORE_KEY} for newDeal`);
    },

    async run(context) {
        const { auth, store } = context;
        const seenDealIds = await store.get<string[]>(STORE_KEY) ?? [];

        console.log(`Polling for new deals. Currently seen IDs: ${seenDealIds.length}`);

        const response = await callZendeskApi<{ items: ZendeskDealItem[] }>(
            HttpMethod.GET,
            'v2/deals',
            auth as ZendeskSellAuthValue,
            undefined,
            {
                sort_by: 'created_at:desc',
                per_page: '100',
            }
        );

        const deals = response.body.items.map(item => item.data);
        const newDeals: ZendeskDeal[] = [];
        const currentBatchIds: string[] = [];

        for (const deal of deals) {
            const dealIdStr = deal.id.toString();
            currentBatchIds.push(dealIdStr);
            if (!seenDealIds.includes(dealIdStr)) {
                newDeals.push(deal);
            }
        }

        if (newDeals.length > 0) {
            const updatedSeenIds = [...new Set([...currentBatchIds, ...seenDealIds])].slice(0, MAX_SEEN_IDS);
            await store.put(STORE_KEY, updatedSeenIds);
            console.log(`Found ${newDeals.length} new deals. Updated seen IDs count: ${updatedSeenIds.length}`);
        } else {
            console.log("No new deals found in this poll.");
             const updatedSeenIds = [...new Set([...currentBatchIds, ...seenDealIds])].slice(0, MAX_SEEN_IDS);
             if (updatedSeenIds.length !== seenDealIds.length){
                 await store.put(STORE_KEY, updatedSeenIds);
                 console.log(`Pruned seen IDs. Count: ${updatedSeenIds.length}`);
             }
        }

        return newDeals.reverse();
    },
});