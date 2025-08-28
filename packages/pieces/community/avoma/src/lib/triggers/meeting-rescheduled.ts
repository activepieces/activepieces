import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { avomaAuth, avomaApiUrl } from '../..';
import dayjs from 'dayjs';

// Define the structure of a meeting object
interface AvomaMeeting {
    uuid: string;
    created: string;
    modified: string;
    start_at: string;
    end_at: string;
    subject: string;
    // Add other relevant properties
}

const polling: Polling<PiecePropValueSchema<typeof avomaAuth>, Record<string, never>> = {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth }) => {
        // Since the API doesn't allow filtering or sorting by modification date,
        // we'll check meetings scheduled in the near future for updates.
        const fromDate = dayjs().toISOString();
        const toDate = dayjs().add(90, 'days').toISOString(); // Look 90 days into the future

        const response = await httpClient.sendRequest<{ results: AvomaMeeting[] }>({
            method: HttpMethod.GET,
            url: `${avomaApiUrl}/v1/meetings/`,
            headers: {
                Authorization: `Bearer ${auth}`,
            },
            queryParams: {
                page_size: '100',
                from_date: fromDate,
                to_date: toDate,
            }
        });

        if (response.status !== 200) {
            return [];
        }

        // Filter for meetings that have been modified after their creation.
        const updatedMeetings = response.body.results.filter(meeting =>
            dayjs(meeting.modified).isAfter(dayjs(meeting.created))
        );
        
        // Map meetings for the polling helper, using the 'modified' timestamp
        // for deduplication. This ensures we only trigger on new modifications.
        return updatedMeetings.map((meeting) => ({
            epochMilliSeconds: dayjs(meeting.modified).valueOf(),
            data: meeting,
        }));
    }
};

export const meetingRescheduled = createTrigger({
    auth: avomaAuth,
    name: 'meeting_rescheduled',
    displayName: 'Meeting Rescheduled',
    description: 'Triggers when a scheduled meeting is rescheduled.',
    props: {},
    sampleData: {
        "uuid": "095be615-a8ad-4c33-8e9c-c7612fbf6c9f",
        "created": "2025-08-28T14:15:22Z",
        "modified": "2025-08-29T09:30:00Z", // Note: modified time is later than created
        "start_at": "2025-09-10T11:00:00Z", // Note: New start time
        "end_at": "2025-09-10T11:30:00Z",
        "subject": "Rescheduled: Introductory Call",
        "organizer_email": "organizer@example.com",
        "state": "scheduled",
        "attendees": [
            { "email": "organizer@example.com", "name": "Jane Doe" },
            { "email": "prospect@example.com", "name": "John Smith" }
        ],
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