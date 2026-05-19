import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
  Property,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  HttpMethod,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import { greenhouseAuth } from '../auth';
import { greenhouseApiCall } from '../common';

type GreenhouseInterview = {
  id: number;
  application_id: number;
  external_event_id: string | null;
  starts_at: string | null;
  ends_at: string | null;
  all_day_start_on: string | null;
  all_day_end_on: string | null;
  location: string | null;
  video_conferencing_url: string | null;
  status: string;
  organizer_id: number | null;
  created_at: string;
  updated_at: string;
};

type TriggerProps = { days_ahead: number };
type GreenhouseAuth = AppConnectionValueForAuthProperty<typeof greenhouseAuth>;

const polling: Polling<GreenhouseAuth, TriggerProps> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const daysAhead = propsValue.days_ahead ?? 7;

    const createdAfter =
      lastFetchEpochMS > 0
        ? new Date(lastFetchEpochMS).toISOString()
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const startsBefore = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString();

    const response = await greenhouseApiCall<GreenhouseInterview[]>({
      accessToken: auth.access_token,
      method: HttpMethod.GET,
      endpoint: '/interviews',
      queryParams: {
        'created_at[gte]': createdAfter,
        'starts_at[lte]': startsBefore,
        per_page: '500',
      },
    });

    const interviews = Array.isArray(response.body) ? response.body : [];

    return interviews.map((interview) => ({
      epochMilliSeconds: new Date(interview.created_at).getTime(),
      data: {
        id: interview.id,
        application_id: interview.application_id,
        external_event_id: interview.external_event_id,
        status: interview.status,
        starts_at: interview.starts_at,
        ends_at: interview.ends_at,
        all_day_start_on: interview.all_day_start_on,
        all_day_end_on: interview.all_day_end_on,
        location: interview.location,
        video_conferencing_url: interview.video_conferencing_url,
        organizer_id: interview.organizer_id,
        created_at: interview.created_at,
        updated_at: interview.updated_at,
      },
    }));
  },
};

export const newScheduledInterviewTrigger = createTrigger({
  auth: greenhouseAuth,
  name: 'new_scheduled_interview',
  displayName: 'New Scheduled Interview',
  description: 'Triggers when a new scheduled interview is created within the configured time window.',
  props: {
    days_ahead: Property.Number({
      displayName: 'Time Window (Days)',
      description:
        'Only trigger for interviews scheduled to start within this many days from now. For example, `7` means only interviews starting within the next week will fire this trigger.',
      required: true,
      defaultValue: 7,
    }),
  },
  sampleData: {
    id: 109170954,
    application_id: 102717457,
    external_event_id: 'external_event_id_1',
    status: 'scheduled',
    starts_at: '2024-03-20T13:15:00.000Z',
    ends_at: '2024-03-20T14:15:00.000Z',
    all_day_start_on: null,
    all_day_end_on: null,
    location: 'Big Conference Room',
    video_conferencing_url: 'https://zoom.us/j/123456789',
    organizer_id: 102361,
    created_at: '2024-03-10T19:22:07.000Z',
    updated_at: '2024-03-10T19:22:07.000Z',
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
