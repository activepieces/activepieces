import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { avomaAuth, avomaApiUrl } from '../..';
import dayjs from 'dayjs';


interface AvomaMeeting {
    uuid: string;
    created: string;
    modified: string; // ISO 8601 date-time string, crucial for this trigger
    start_at: string;
    end_at: string;
    subject: string;
    organizer_email: string;
    state: string; // We will filter for 'cancelled' state
    attendees: { email: string, name: string }[];
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
                page_size: '100', // Fetch a recent batch of meetings to check for cancellations
            }
        });

        if (response.status !== 200) {
            return [];
        }

        const meetings = response.body.results;

        // Find meetings that are in the 'cancelled' state
        const cancelledMeetings = meetings.filter(meeting => meeting.state === 'cancelled');

        // Map the cancelled meetings to the format required by the polling helper.
        // We use the 'modified' timestamp to deduplicate, ensuring we only
        // trigger once per cancellation event.
        return cancelledMeetings.map((meeting) => ({
            epochMilliSeconds: dayjs(meeting.modified).valueOf(),
            data: meeting,
        }));
    }
};

export const meetingCancelled = createTrigger({
    auth: avomaAuth,
    name: 'meeting_cancelled',
    displayName: 'Meeting Cancelled',
    description: 'Triggers when a meeting booked via the scheduling page is canceled.',
    props: {},
    sampleData: {
        "uuid": "095be615-a8ad-4c33-8e9c-c7612fbf6c9f",
        "created": "2025-08-28T14:15:22Z",
        "modified": "2025-08-28T18:30:00Z", // Note: modified time is after created time
        "start_at": "2025-09-05T10:00:00Z",
        "end_at": "2025-09-05T10:30:00Z",
        "duration": 1800,
        "subject": "Introductory Call",
        "organizer_email": "organizer@example.com",
        "state": "cancelled", // The state is now 'cancelled'
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