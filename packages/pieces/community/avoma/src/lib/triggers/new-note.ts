import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { avomaAuth, avomaApiUrl } from '../..';
import dayjs from 'dayjs';


interface AvomaNote {
    uuid: string;
    modified: string; // ISO 8601 date-time string
    created_at: string;
    notes_summary: string;
    notes_data: {
        category: string;
        content: string;
    }[];
}

const polling: Polling<PiecePropValueSchema<typeof avomaAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth, store }) => {
        // Get the last time we polled, or default to one day ago for the first run
        const lastFetchEpochMs = await store.get<number>('lastPollTime') ?? dayjs().subtract(1, 'day').valueOf();

        const fromDate = dayjs(lastFetchEpochMs).toISOString();
        const toDate = dayjs().toISOString();

        const response = await httpClient.sendRequest<{ results: AvomaNote[] }>({
            method: HttpMethod.GET,
            url: `${avomaApiUrl}/v1/notes/`,
            headers: {
                Authorization: `Bearer ${auth}`,
            },
            queryParams: {
                from_date: fromDate,
                to_date: toDate,
                o: '-modified' // Order by most recently modified to get the latest notes first
            }
        });

        if (response.status !== 200) {
            return [];
        }

        const notes = response.body.results;

        // Map the notes to the format required by the polling helper
        return notes.map((note) => ({
            epochMilliSeconds: dayjs(note.modified).valueOf(),
            data: note,
        }));
    }
};

export const newNote = createTrigger({
    auth: avomaAuth,
    name: 'new_note',
    displayName: 'New Note',
    description: 'Triggers when notes are successfully generated for meetings or calls.',
    props: {},
    sampleData: {
        "uuid": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "meeting_uuid": "m1n2o3p4-q5r6-7890-1234-567890ghijkl",
        "created_at": "2025-08-28T10:00:00Z",
        "modified": "2025-08-28T10:05:00Z",
        "notes_summary": "Discussed Q4 roadmap and budget allocation. Key decisions were made regarding the 'Phoenix' project.",
        "notes_data": [
            {
                "category": "Decision",
                "content": "The team has approved the proposed budget for the Phoenix project."
            },
            {
                "category": "Action Item",
                "content": "Sarah to create the project plan and share it by end of week."
            },
            {
                "category": "Key Topic",
                "content": "Initial feedback on the new UI mockups was positive."
            }
        ]
    },
    type: TriggerStrategy.POLLING,
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