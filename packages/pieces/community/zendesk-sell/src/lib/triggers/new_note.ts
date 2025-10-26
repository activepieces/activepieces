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

const STORE_KEY = 'newNote_seen_ids';
const MAX_SEEN_IDS = 1000;

interface ZendeskNoteItem {
    data: ZendeskNote;
    meta: { type: string };
}
interface ZendeskNote {
    id: number;
    creator_id: number;
    resource_type: string;
    resource_id: number;
    content: string;
    created_at: string;
}

interface TriggerPropsValue {}

export const newNote = createTrigger({
    auth: zendeskSellAuth,
    name: 'new_note',
    displayName: 'New Note',
    description: 'Fires when a new note is added to a record (lead, contact, deal) (polls for new records).',
    props: {},
    sampleData: {
        "id": 1,
        "creator_id": 1,
        "resource_type": "lead",
        "resource_id": 1,
        "content": "Highly important.",
        "is_important": true,
        "created_at": "2014-08-27T16:32:56Z",
        "updated_at": "2014-08-27T17:32:56Z"
    },
    type: TriggerStrategy.POLLING,

    async test(context) {
        const { auth } = context;

        const response = await callZendeskApi<{ items: ZendeskNoteItem[] }>(
            HttpMethod.GET,
            'v2/notes',
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
        console.log(`Initializing ${STORE_KEY} for newNote`);

        const response = await callZendeskApi<{ items: ZendeskNoteItem[] }>(
            HttpMethod.GET,
            'v2/notes',
            auth as ZendeskSellAuthValue,
            undefined,
            {
                sort_by: 'created_at:desc',
                per_page: '100',
            }
        );
        const initialIds = response.body.items.map(item => item.data.id.toString());
        await store.put<string[]>(STORE_KEY, initialIds.slice(0, MAX_SEEN_IDS));
        console.log(`Stored initial ${initialIds.length} note IDs.`);
    },

    async onDisable(context) {
        await context.store.delete(STORE_KEY);
        console.log(`Cleaned up ${STORE_KEY} for newNote`);
    },

    async run(context) {
        const { auth, store } = context;
        const seenNoteIds = await store.get<string[]>(STORE_KEY) ?? [];

        console.log(`Polling for new notes. Currently seen IDs: ${seenNoteIds.length}`);

        const response = await callZendeskApi<{ items: ZendeskNoteItem[] }>(
            HttpMethod.GET,
            'v2/notes',
            auth as ZendeskSellAuthValue,
            undefined,
            {
                sort_by: 'created_at:desc',
                per_page: '100',
            }
        );

        const notes = response.body.items.map(item => item.data);
        const newNotes: ZendeskNote[] = [];
        const currentBatchIds: string[] = [];

        for (const note of notes) {
            const noteIdStr = note.id.toString();
            currentBatchIds.push(noteIdStr);
            if (!seenNoteIds.includes(noteIdStr)) {
                newNotes.push(note);
            }
        }

        if (newNotes.length > 0) {
            const updatedSeenIds = [...new Set([...currentBatchIds, ...seenNoteIds])].slice(0, MAX_SEEN_IDS);
            await store.put(STORE_KEY, updatedSeenIds);
            console.log(`Found ${newNotes.length} new notes. Updated seen IDs count: ${updatedSeenIds.length}`);
        } else {
            console.log("No new notes found in this poll.");
            const updatedSeenIds = [...new Set([...currentBatchIds, ...seenNoteIds])].slice(0, MAX_SEEN_IDS);
            if (updatedSeenIds.length !== seenNoteIds.length){
                 await store.put(STORE_KEY, updatedSeenIds);
                 console.log(`Pruned seen IDs. Count: ${updatedSeenIds.length}`);
            }
        }

        return newNotes.reverse();
    },
});