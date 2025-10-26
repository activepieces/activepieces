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

const STORE_KEY = 'updatedLead_last_poll_time';

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
    status?: string;
    updated_at: string;
}

interface TriggerPropsValue {}

export const updatedLead = createTrigger({
    auth: zendeskSellAuth,
    name: 'updated_lead',
    displayName: 'Updated Lead',
    description: 'Fires when an existing lead record is updated (polls for updates).',
    props: {},
    sampleData: {
        "id": 1,
        "creator_id": 1,
        "owner_id": 1,
        "first_name": "Mark",
        "last_name": "Johnson",
        "organization_name": "Design Services Inc.",
        "status": "Contacted",
        "source_id": 10,
        "title": "Senior Designer",
        "description": "Updated description.",
        "email": "mark.johnson@example.com",
        "phone": "508-778-6516",
        "mobile": "508-778-6517",
        "created_at": "2024-08-27T16:32:56Z",
        "updated_at": "2025-10-18T10:25:00Z"
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
        console.log(`Initialized ${STORE_KEY} for updatedLead`);
    },

    async onDisable(context) {
        await context.store.delete(STORE_KEY);
        console.log(`Cleaned up ${STORE_KEY} for updatedLead`);
    },

    async run(context) {
        const { auth, store } = context;
        const lastPollTimeSeconds = await store.get<number>(STORE_KEY) ?? 0;

        console.log(`Polling leads updated after timestamp (seconds): ${lastPollTimeSeconds}`);

        const response = await callZendeskApi<{ items: ZendeskLeadItem[] }>(
            HttpMethod.GET,
            'v2/leads',
            auth as ZendeskSellAuthValue,
            undefined,
            {
                sort_by: 'updated_at:asc',
                per_page: '100',
            }
        );

        const leads = response.body.items.map(item => item.data);
        let maxTimestampSeconds = lastPollTimeSeconds;
        const updatedLeadsSinceLastPoll: ZendeskLead[] = [];

        for (const lead of leads) {
            const updatedAtSeconds = Math.floor(new Date(lead.updated_at).getTime() / 1000);

            if (updatedAtSeconds > lastPollTimeSeconds) {
                updatedLeadsSinceLastPoll.push(lead);
                if (updatedAtSeconds > maxTimestampSeconds) {
                    maxTimestampSeconds = updatedAtSeconds;
                }
            }
        }

        if (updatedLeadsSinceLastPoll.length > 0) {
            await store.put(STORE_KEY, maxTimestampSeconds);
            console.log(`Updated ${STORE_KEY} to: ${maxTimestampSeconds}`);
        } else {
             console.log(`No leads updated since last poll time: ${lastPollTimeSeconds}`);
        }

        console.log(`Found ${updatedLeadsSinceLastPoll.length} updated leads.`);
        return updatedLeadsSinceLastPoll;
    },
});