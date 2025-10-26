import {
    createTrigger,
    TriggerStrategy,
    Property, // Keep Property
    Store,
    TriggerHookContext
} from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskSellAuth, ZendeskSellAuth as ZendeskSellAuthValue } from '../common/auth';
import { callZendeskApi } from '../common/client';

const STORE_KEY = 'newContact_seen_ids';
const MAX_SEEN_IDS = 1000;


interface ZendeskContactItem {
    data: ZendeskContact;
    meta: { type: string };
}
interface ZendeskContact {
    id: number;
    name: string;
    email?: string;
    created_at: string;
}


interface TriggerPropsValue {}

export const newContact = createTrigger({
    auth: zendeskSellAuth,
    name: 'new_contact',
    displayName: 'New Contact',
    description: 'Fires when a new contact is created in Zendesk Sell (polls for new records).',
    props: {

    },
    sampleData: {
        "id": 2,
        "creator_id": 1,
        "owner_id": 1,
        "is_organization": false,
        "contact_id": 1,
        "name": "Mark Johnson",
        "first_name": "Mark",
        "last_name": "Johnson",
        "customer_status": "none",
        "email": "mark@designservice.com",
        "phone": "508-778-6516",
        "created_at": "2014-08-27T16:32:56Z",
        "updated_at": "2014-08-27T16:32:56Z"
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
        console.log(`Initializing ${STORE_KEY} for newContact`);


        const response = await callZendeskApi<{ items: ZendeskContactItem[] }>(
            HttpMethod.GET,
            'v2/contacts',
            auth as ZendeskSellAuthValue,
            undefined,
            {
                sort_by: 'created_at:desc',
                per_page: '100',
            }
        );
        const initialIds = response.body.items.map(item => item.data.id.toString());
        await store.put<string[]>(STORE_KEY, initialIds.slice(0, MAX_SEEN_IDS)); // Store as strings
        console.log(`Stored initial ${initialIds.length} contact IDs.`);
    },


    async onDisable(context) {
        await context.store.delete(STORE_KEY);
        console.log(`Cleaned up ${STORE_KEY} for newContact`);
    },


    async run(context) {
        const { auth, store } = context;
        const seenContactIds = await store.get<string[]>(STORE_KEY) ?? [];

        console.log(`Polling for new contacts. Currently seen IDs: ${seenContactIds.length}`);

        const response = await callZendeskApi<{ items: ZendeskContactItem[] }>(
            HttpMethod.GET,
            'v2/contacts',
            auth as ZendeskSellAuthValue,
            undefined,
            {
                sort_by: 'created_at:desc',
                per_page: '100', 
            }
        );

        const contacts = response.body.items.map(item => item.data);
        const newContacts: ZendeskContact[] = [];
        const currentBatchIds: string[] = [];

        for (const contact of contacts) {
            const contactIdStr = contact.id.toString();
            currentBatchIds.push(contactIdStr);
            if (!seenContactIds.includes(contactIdStr)) {
                newContacts.push(contact);
            }
        }

        if (newContacts.length > 0) {
            const updatedSeenIds = [...new Set([...currentBatchIds, ...seenContactIds])].slice(0, MAX_SEEN_IDS);
            await store.put(STORE_KEY, updatedSeenIds);
            console.log(`Found ${newContacts.length} new contacts. Updated seen IDs count: ${updatedSeenIds.length}`);
        } else {
            console.log("No new contacts found in this poll.");
             const updatedSeenIds = [...new Set([...currentBatchIds, ...seenContactIds])].slice(0, MAX_SEEN_IDS);
             if (updatedSeenIds.length !== seenContactIds.length){ 
                 await store.put(STORE_KEY, updatedSeenIds);
                 console.log(`Pruned seen IDs. Count: ${updatedSeenIds.length}`);
             }
        }

        return newContacts.reverse();
    },
});