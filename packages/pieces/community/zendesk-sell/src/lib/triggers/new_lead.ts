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

const STORE_KEY = 'newLead_seen_ids';
const MAX_SEEN_IDS = 1000;

interface ZendeskLeadItem {
    data: ZendeskLead;
    meta: { type: string };
}
interface ZendeskLead {
    id: number;
    first_name?: string;
    last_name?: string;
    organization_name?: string;
    email?: string;
    created_at: string;
}

interface TriggerPropsValue {}

export const newLead = createTrigger({
    auth: zendeskSellAuth,
    name: 'new_lead',
    displayName: 'New Lead',
    description: 'Fires when a new lead is created (polls for new records).',
    props: {},
    sampleData: {
        "id": 1,
        "creator_id": 1,
        "owner_id": 1,
        "first_name": "Mark",
        "last_name": "Johnson",
        "organization_name": "Design Services Company",
        "status": "New",
        "source_id": 10,
        "email": "mark@example.com",
        "phone": "508-778-6516",
        "created_at": "2014-08-27T16:32:56Z",
        "updated_at": "2014-08-27T16:32:56Z"
    },
    type: TriggerStrategy.POLLING,

    async test(context) {
        const { auth } = context;

        const response = await callZendeskApi<{ items: ZendeskLeadItem[] }>(
            HttpMethod.GET,
            'v2/leads',
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
        console.log(`Initializing ${STORE_KEY} for newLead`);

        const response = await callZendeskApi<{ items: ZendeskLeadItem[] }>(
            HttpMethod.GET,
            'v2/leads',
            auth as ZendeskSellAuthValue,
            undefined,
            {
                sort_by: 'created_at:desc',
                per_page: '100',
            }
        );
        const initialIds = response.body.items.map(item => item.data.id.toString());
        await store.put<string[]>(STORE_KEY, initialIds.slice(0, MAX_SEEN_IDS));
        console.log(`Stored initial ${initialIds.length} lead IDs.`);
    },

    async onDisable(context) {
        await context.store.delete(STORE_KEY);
        console.log(`Cleaned up ${STORE_KEY} for newLead`);
    },

    async run(context) {
        const { auth, store } = context;
        const seenLeadIds = await store.get<string[]>(STORE_KEY) ?? [];

        console.log(`Polling for new leads. Currently seen IDs: ${seenLeadIds.length}`);

        const response = await callZendeskApi<{ items: ZendeskLeadItem[] }>(
            HttpMethod.GET,
            'v2/leads',
            auth as ZendeskSellAuthValue,
            undefined,
            {
                sort_by: 'created_at:desc',
                per_page: '100',
            }
        );

        const leads = response.body.items.map(item => item.data);
        const newLeads: ZendeskLead[] = [];
        const currentBatchIds: string[] = [];

        for (const lead of leads) {
            const leadIdStr = lead.id.toString();
            currentBatchIds.push(leadIdStr);
            if (!seenLeadIds.includes(leadIdStr)) {
                newLeads.push(lead);
            }
        }

        if (newLeads.length > 0) {
            const updatedSeenIds = [...new Set([...currentBatchIds, ...seenLeadIds])].slice(0, MAX_SEEN_IDS);
            await store.put(STORE_KEY, updatedSeenIds);
            console.log(`Found ${newLeads.length} new leads. Updated seen IDs count: ${updatedSeenIds.length}`);
        } else {
            console.log("No new leads found in this poll.");
            const updatedSeenIds = [...new Set([...currentBatchIds, ...seenLeadIds])].slice(0, MAX_SEEN_IDS);
            if (updatedSeenIds.length !== seenLeadIds.length){
                 await store.put(STORE_KEY, updatedSeenIds);
                 console.log(`Pruned seen IDs. Count: ${updatedSeenIds.length}`);
            }
        }

        return newLeads.reverse();
    },
});