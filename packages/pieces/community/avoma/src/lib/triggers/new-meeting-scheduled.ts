import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { avomaAuth, avomaApiUrl } from '../..';
import dayjs from 'dayjs';


interface AvomaMeeting {
    uuid: string;
    created: string; // ISO 8601 date-time string
    modified: string;
    start_at: string;
    end_at: string;
    subject: string;
    organizer_email: string;
    state: string;
    attendees: { email: string, name: string }[];
    // Add other relevant properties from the API sample
}

const polling: Polling<PiecePropValueSchema<typeof avomaAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth }) => {
        
        const response = await httpClient.sendRequest<{ results: AvomaMeeting[] }>({
            method: HttpMethod.GET,
            url: `${avomaApiUrl}/v1/meetings/`,
            headers: {
                Authorization: `Bearer ${auth}`,
            },
            queryParams: {
                page_size: '100', 
            }
        });

        if (response.status !== 200) {
            return [];
        }

        const meetings = response.body.results;

        // Map the meetings to the format required by the polling helper,
        // using the 'created' field for the time-based deduplication.
        return meetings.map((meeting) => ({
            epochMilliSeconds: dayjs(meeting.created).valueOf(),
            data: meeting,
        }));
    }
};

export const newMeetingScheduled = createTrigger({
    auth: avomaAuth,
    name: 'new_meeting_scheduled',
    displayName: 'New Meeting Scheduled',
    description: 'Triggers when a meeting is booked via one of your Avoma scheduling pages.',
    props: {},
    sampleData: {
        "uuid": "095be615-a8ad-4c33-8e9c-c7612fbf6c9f",
        "created": "2025-08-28T14:15:22Z",
        "modified": "2025-08-28T14:15:22Z",
        "start_at": "2025-09-05T10:00:00Z",
        "end_at": "2025-09-05T10:30:00Z",
        "duration": 1800,
        "subject": "Introductory Call",
        "organizer_email": "organizer@example.com",
        "state": "scheduled",
        "attendees": [
            { "email": "organizer@example.com", "name": "Jane Doe" },
            { "email": "prospect@example.com", "name": "John Smith" }
        ],
        "url": "https://calendar.avoma.com/meeting/jane-doe/intro-call",
        "notes_ready": false,
        "transcript_ready": false,
        "is_call": false,
        "is_internal": false
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