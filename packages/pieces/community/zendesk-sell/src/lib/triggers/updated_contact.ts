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

const STORE_KEY = 'updatedContact_last_poll_time';

interface ZendeskContactItem {
    data: ZendeskContact;
    meta: { type: string };
}
interface ZendeskContact {
    id: number;
    name: string;
    email?: string;
    updated_at: string;
}

interface TriggerPropsValue {}

export const updatedContact = createTrigger({
    auth: zendeskSellAuth,
    name: 'updated_contact',
    displayName: 'Updated Contact',
    description: 'Fires when an existing contact is updated (polls for updates).',
    props: {},
    sampleData: {
        "id": 2,
        "creator_id": 1,
        "owner_id": 1,
        "is_organization": false,
        "contact_id": 1,
        "name": "Mark Johnson",
        "first_name": "Mark",
        "last_name": "Johnson",
        "customer_status": "current",
        "email": "mark@designservice.com",
        "phone": "508-778-6516",
        "created_at": "2014-08-27T16:32:56Z",
        "updated_at": "2025-10-18T10:30:00Z"
    },
    type: TriggerStrategy.POLLING,

    async test(context) {
        const { auth } = context;

        const response = await callZendeskApi<{ items: ZendeskContactItem[] }>(
            HttpMethod.GET,
            'v2/contacts',
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
        console.log(`Initialized ${STORE_KEY} for updatedContact`);
    },

    async onDisable(context) {
        await context.store.delete(STORE_KEY);
        console.log(`Cleaned up ${STORE_KEY} for updatedContact`);
    },

    async run(context) {
        const { auth, store } = context;
        const lastPollTimeSeconds = await store.get<number>(STORE_KEY) ?? 0;

        console.log(`Polling contacts updated after timestamp (seconds): ${lastPollTimeSeconds}`);

        const response = await callZendeskApi<{ items: ZendeskContactItem[] }>(
            HttpMethod.GET,
            'v2/contacts',
            auth as ZendeskSellAuthValue,
            undefined,
            {
                sort_by: 'updated_at:asc',
                per_page: '100',
            }
        );

        const contacts = response.body.items.map(item => item.data);
        let maxTimestampSeconds = lastPollTimeSeconds;
        const updatedContactsSinceLastPoll: ZendeskContact[] = [];

        for (const contact of contacts) {
            const updatedAtSeconds = Math.floor(new Date(contact.updated_at).getTime() / 1000);

            if (updatedAtSeconds > lastPollTimeSeconds) {
                updatedContactsSinceLastPoll.push(contact);
                if (updatedAtSeconds > maxTimestampSeconds) {
                    maxTimestampSeconds = updatedAtSeconds;
                }
            }
        }

        if (updatedContactsSinceLastPoll.length > 0) {
            await store.put(STORE_KEY, maxTimestampSeconds);
            console.log(`Updated ${STORE_KEY} to: ${maxTimestampSeconds}`);
        } else {
             console.log(`No contacts updated since last poll time: ${lastPollTimeSeconds}`);
        }

        console.log(`Found ${updatedContactsSinceLastPoll.length} updated contacts.`);
        return updatedContactsSinceLastPoll;
    },
});